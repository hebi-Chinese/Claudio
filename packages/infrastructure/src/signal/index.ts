// Signal 工厂 · 每个 signal 是一个独立子目录
// v1 实现：time / weather / ncm-snapshot

import type { ISignalSource } from '@claudio/application'

export type SignalType = 'time' | 'weather' | 'ncm-snapshot'

export function createSignal(_type: SignalType): ISignalSource {
  throw new Error('signal sources not implemented yet (M5)')
}
