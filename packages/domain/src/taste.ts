// 用户品味 · taste.md / mood-rules.md / routines.md 的内存表示

export type TasteDocument = {
  /** 用户手编的最高优先级指令（taste.md 全文） */
  readonly userPreface: string
  /** 时段 → 风格规则（mood-rules.md 解析后） */
  readonly moodRules: readonly MoodRule[]
  /** 日常作息（routines.md 解析后） */
  readonly routines: readonly Routine[]
}

export type MoodRule = {
  readonly timeRange: { startHour: number; endHour: number } // 0-23
  readonly preferredStyles: readonly string[]
  readonly avoidStyles: readonly string[]
}

export type Routine = {
  readonly name: string
  readonly cronExpr: string
  readonly action: string
}
