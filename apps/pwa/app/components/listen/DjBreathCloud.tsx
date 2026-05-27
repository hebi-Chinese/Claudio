'use client'

// DjBreathCloud · 浮在窗台上方的 DJ 旁白气泡
// 仅 Listen 模式显示 (调用方控)
// data-fading 触发淡出动画

import type { DjMessage } from './useDjState'

type Props = {
  readonly message: DjMessage | null
}

export function DjBreathCloud({ message }: Props) {
  if (message === null) return null
  const fading = message.id.endsWith('-fading')
  return (
    <div className="dj-cloud" data-fading={fading} role="status" aria-live="polite">
      {message.text}
    </div>
  )
}
