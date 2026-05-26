// 通用信号源接口 · 给 prompt 注入"环境感知"
// 实现：infrastructure/signal/{weather,time,ncm-snapshot,...}
// 新增信号源 = 新增一个 adapter 实现这个接口

export type SignalValue = Readonly<Record<string, unknown>>

export type ISignalSource = {
  readonly name: string
  readonly ttlMs: number // 缓存有效期
  fetch(): Promise<SignalValue>
}
