// 日历接口 · 实现：infrastructure/calendar/{noop,ics,feishu,google}

export type CalendarEvent = {
  readonly id: string
  readonly title: string
  readonly startMs: number
  readonly endMs: number
  readonly location?: string
}

export type ICalendarSource = {
  readonly name: string
  fetchToday(): Promise<readonly CalendarEvent[]>
  fetchRange(startMs: number, endMs: number): Promise<readonly CalendarEvent[]>
}
