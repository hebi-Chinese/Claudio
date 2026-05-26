// Calendar 工厂 · v1 默认 NoOp
// v1.5 加 IcsFile / Feishu；v2 加 Google / Apple

import { NoOpCalendarSource } from './noop/index.js'

import type { ICalendarSource } from '@claudio/application'

export type CalendarType = 'noop' | 'ics' | 'feishu' | 'google' | 'apple'

export function createCalendar(type: CalendarType): ICalendarSource {
  switch (type) {
    case 'noop':
      return new NoOpCalendarSource()
    case 'ics':
    case 'feishu':
    case 'google':
    case 'apple':
      throw new Error(`calendar type "${type}" not implemented yet`)
    default: {
      const _exhaustive: never = type
      throw new Error(`unknown calendar type: ${_exhaustive as string}`)
    }
  }
}

export { NoOpCalendarSource } from './noop/index.js'
