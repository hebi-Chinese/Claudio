/* eslint-disable @typescript-eslint/require-await -- better-sqlite3 is sync */
// BubblesRepo · DJ 串场记录

import { toBubbleId } from '@claudio/domain'
import { desc } from 'drizzle-orm'


import { bubbles, type DbBubble } from '../schema.js'

import type { DbClient } from '../client.js'
import type { IBubblesRepo } from '@claudio/application'
import type { Bubble } from '@claudio/domain'

function dbRowToBubble(row: DbBubble): Bubble {
  const base = {
    id: toBubbleId(row.id),
    kind: row.kind,
    text: row.text,
    createdAtMs: row.createdAtMs,
  }
  return row.audioUrl !== null ? { ...base, audioUrl: row.audioUrl } : base
}

export function createBubblesRepo(client: DbClient): IBubblesRepo {
  return {
    async save(bubble: Bubble): Promise<void> {
      client.db
        .insert(bubbles)
        .values({
          id: bubble.id,
          kind: bubble.kind,
          text: bubble.text,
          audioUrl: bubble.audioUrl ?? null,
          createdAtMs: bubble.createdAtMs,
        })
        .onConflictDoNothing()
        .run()
    },

    async recent(limit: number): Promise<readonly Bubble[]> {
      const rows = client.db.select().from(bubbles).orderBy(desc(bubbles.createdAtMs)).limit(limit).all()
      return rows.map(dbRowToBubble)
    },
  }
}
