// Redis 版短期记忆 — 跨进程持久, TTL 走 Redis EXPIRE
//
// Key 设计 (单用户应用, 没分租户):
//   claudio:mem:active     STRING  "1"     TTL = idle timeout (每次 appendTurn 重置)
//   claudio:mem:session    LIST    JSON[]  no TTL (current session turns)
//
// 活跃判定: EXISTS claudio:mem:active.
// session 边界: active key 过期 → isSessionActive=false, 但 session list 还在
// → 调用方 (use-case) 拉出来 distill → 清掉 list → 下次 appendTurn 起新 session.

import { ExternalServiceError } from '@claudio/domain'

import type { IShortTermMemoryRepo, SessionTurn } from '@claudio/application'
import type { Redis } from 'ioredis'

const ACTIVE_KEY = 'claudio:mem:active'
const SESSION_KEY = 'claudio:mem:session'

export type RedisShortTermConfig = {
  readonly redis: Redis
  readonly idleTtlMs: number
}

export function createRedisShortTermRepo(cfg: RedisShortTermConfig): IShortTermMemoryRepo {
  const idleTtlSec = Math.max(1, Math.floor(cfg.idleTtlMs / 1000))
  const wrap = redisErrorWrapper(cfg.redis)
  return {
    appendTurn: wrap('appendTurn', async (turn: SessionTurn) => {
      // SET active key (重置 TTL) + RPUSH session list, multi 顺序保证
      await cfg.redis
        .multi()
        .set(ACTIVE_KEY, '1', 'EX', idleTtlSec)
        .rpush(SESSION_KEY, JSON.stringify(turn))
        .exec()
    }),
    loadCurrentSession: wrap('loadCurrentSession', async () => {
      const active = await cfg.redis.exists(ACTIVE_KEY)
      if (active === 0) return []
      const raw = await cfg.redis.lrange(SESSION_KEY, 0, -1)
      return raw.map((s) => JSON.parse(s) as SessionTurn)
    }),
    isSessionActive: wrap('isSessionActive', async () => (await cfg.redis.exists(ACTIVE_KEY)) > 0),
    clearSession: wrap('clearSession', async () => {
      await cfg.redis.del(SESSION_KEY, ACTIVE_KEY)
    }),
    // endSession 只删 active, 保留 session list 给 distill 拉
    endSession: wrap('endSession', async () => {
      await cfg.redis.del(ACTIVE_KEY)
    }),
  }
}

// 统一抓 Redis 错误 + 包 ExternalServiceError 保留 cause
function redisErrorWrapper(
  _redis: Redis,
): <T extends unknown[], R>(
  op: string,
  fn: (...args: T) => Promise<R>,
) => (...args: T) => Promise<R> {
  return (op, fn) =>
    async (...args) => {
      try {
        return await fn(...args)
      } catch (err: unknown) {
        throw new ExternalServiceError('redis-short-term', `${op} failed`, undefined, {
          cause: err,
        })
      }
    }
}
