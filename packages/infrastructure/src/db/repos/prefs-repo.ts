/* eslint-disable @typescript-eslint/require-await -- better-sqlite3 is sync */
// PrefsRepo · key/value JSON 偏好存储

import { eq } from 'drizzle-orm'

import { prefs } from '../schema.js'

import type { DbClient } from '../client.js'
import type { IPrefsRepo } from '@claudio/application'
import type { z } from 'zod'

export function createPrefsRepo(client: DbClient): IPrefsRepo {
  return {
    async get<T>(key: string, schema: z.ZodSchema<T>): Promise<T | null> {
      const rows = client.db.select().from(prefs).where(eq(prefs.key, key)).all()
      const row = rows[0]
      if (row === undefined) return null
      const parsed = schema.safeParse(JSON.parse(row.valueJson))
      return parsed.success ? parsed.data : null
    },

    async set<T>(key: string, value: T, schema: z.ZodSchema<T>): Promise<void> {
      // 写入前校验
      schema.parse(value)
      const valueJson = JSON.stringify(value)
      client.db
        .insert(prefs)
        .values({ key, valueJson })
        .onConflictDoUpdate({
          target: prefs.key,
          set: { valueJson, updatedAtMs: Date.now() },
        })
        .run()
    },
  }
}
