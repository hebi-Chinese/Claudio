// 空日历 · 用户没设日历源时的默认实现，永远返回空数组

import type { CalendarEvent, ICalendarSource } from '@claudio/application'

export class NoOpCalendarSource implements ICalendarSource {
  readonly name = 'noop'

  // eslint-disable-next-line @typescript-eslint/require-await
  async fetchToday(): Promise<readonly CalendarEvent[]> {
    return []
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async fetchRange(_startMs: number, _endMs: number): Promise<readonly CalendarEvent[]> {
    return []
  }
}
