/* eslint-disable @typescript-eslint/require-await -- better-sqlite3 is sync */
/* eslint-disable max-lines-per-function -- repo factory naturally groups related methods */
// PlanRepo · 今日节目单

import { toPlanId, toSongId } from '@claudio/domain'
import { and, asc, eq } from 'drizzle-orm'


import { planItems, plans } from '../schema.js'

import type { DbClient } from '../client.js'
import type { IPlanRepo } from '@claudio/application'
import type { Plan, PlanId } from '@claudio/domain'

export function createPlanRepo(client: DbClient): IPlanRepo {
  return {
    async findByDate(dateIso: string): Promise<Plan | null> {
      const planRows = client.db.select().from(plans).where(eq(plans.dateIso, dateIso)).all()
      const planRow = planRows[0]
      if (planRow === undefined) return null

      const itemRows = client.db
        .select()
        .from(planItems)
        .where(eq(planItems.planId, planRow.id))
        .orderBy(asc(planItems.orderIdx))
        .all()

      return {
        id: toPlanId(planRow.id),
        dateIso: planRow.dateIso,
        items: itemRows.map((it) => ({
          slotAtMs: it.slotAtMs,
          songId: toSongId(it.songId),
          reason: it.reason,
          status: it.status,
        })),
      }
    },

    async save(plan: Plan): Promise<void> {
      client.db.transaction((tx) => {
        tx.insert(plans)
          .values({
            id: plan.id,
            dateIso: plan.dateIso,
            createdAtMs: Date.now(),
          })
          .onConflictDoNothing()
          .run()
        // 清掉旧条目重写
        tx.delete(planItems).where(eq(planItems.planId, plan.id)).run()
        plan.items.forEach((item, idx) => {
          tx.insert(planItems)
            .values({
              planId: plan.id,
              slotAtMs: item.slotAtMs,
              songId: item.songId,
              reason: item.reason,
              status: item.status,
              orderIdx: idx,
            })
            .run()
        })
      })
    },

    async markStatus(
      planId: PlanId,
      slotAtMs: number,
      status: 'played' | 'skipped',
    ): Promise<void> {
      client.db
        .update(planItems)
        .set({ status })
        .where(and(eq(planItems.planId, planId), eq(planItems.slotAtMs, slotAtMs)))
        .run()
    },
  }
}
