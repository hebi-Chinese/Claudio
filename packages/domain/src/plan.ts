// 今日节目单 · scheduler 早上生成

import type { PlanId, SongId } from './ids.js'

export type PlanItemStatus = 'queued' | 'playing' | 'played' | 'skipped'

export type PlanItem = {
  readonly slotAtMs: number
  readonly songId: SongId
  readonly reason: string
  readonly status: PlanItemStatus
}

export type Plan = {
  readonly id: PlanId
  readonly dateIso: string // 'YYYY-MM-DD'
  readonly items: readonly PlanItem[]
}
