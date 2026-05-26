// 数据库客户端 · better-sqlite3 + drizzle
// 同步 API（单用户场景反而更简单）

import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

import BetterSqlite3 from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'

import { schema } from './schema.js'

export type DbClient = ReturnType<typeof createDb>

export function createDb(dbUrl: string): {
  db: ReturnType<typeof drizzle<typeof schema>>
  close: () => void
  applyMigrations: (migrationsFolder: string) => void
} {
  // 确保目录存在
  const dir = dirname(dbUrl)
  if (dir.length > 0 && dir !== '.') {
    mkdirSync(dir, { recursive: true })
  }

  const sqlite = new BetterSqlite3(dbUrl)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')

  const db = drizzle(sqlite, { schema })

  return {
    db,
    close: () => sqlite.close(),
    applyMigrations: (migrationsFolder) => { migrate(db, { migrationsFolder }); },
  }
}
