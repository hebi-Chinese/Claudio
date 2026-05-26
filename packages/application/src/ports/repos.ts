// 仓储接口 · 实现：infrastructure/db/ (drizzle)
// 业务用例只依赖这些接口，不知道底层是 SQLite 还是别的

import type { Bubble, Plan, PlanId, Song, SongId } from '@claudio/domain'
import type { z } from 'zod'

export type PlaySource = 'plan' | 'fm' | 'manual' | 'recommendation' | 'search'

export type PlayRecord = {
  readonly songId: SongId
  readonly playedAtMs: number
  readonly finished: boolean
  readonly source: PlaySource
}

export type ISongRepo = {
  findById(id: SongId): Promise<Song | null>
  upsert(song: Song): Promise<void>
}

export type IPlaysRepo = {
  recordPlay(play: PlayRecord): Promise<void>
  recentPlays(limit: number): Promise<readonly PlayRecord[]>
  countPlays(songId: SongId, sinceMs: number): Promise<number>
}

export type IBubblesRepo = {
  save(bubble: Bubble): Promise<void>
  recent(limit: number): Promise<readonly Bubble[]>
}

export type IPlanRepo = {
  findByDate(dateIso: string): Promise<Plan | null>
  save(plan: Plan): Promise<void>
  markStatus(planId: PlanId, slotAtMs: number, status: 'played' | 'skipped'): Promise<void>
}

export type IPrefsRepo = {
  /** 用 zod schema 校验+类型推断 */
  get<T>(key: string, schema: z.ZodSchema<T>): Promise<T | null>
  set<T>(key: string, value: T, schema: z.ZodSchema<T>): Promise<void>
}
