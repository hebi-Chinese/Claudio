// useTimeTint · 按当前小时返回 CSS 背景 gradient
// 每分钟更新一次 (够细),关键时段 (黎明 6 / 黄昏 18) 平滑插值

import { useEffect, useState } from 'react'

const TICK_MS = 60_000

type Tint = {
  readonly top: string
  readonly bottom: string
}

// 6 个锚点 (24h 循环): 0/4 深夜 → 6 黎明 → 9 日间 → 14 午后 → 18 黄昏 → 21 夜幕
const ANCHORS: readonly { h: number; top: string; bottom: string }[] = [
  { h: 0, top: 'oklch(11% 0.04 270)', bottom: 'oklch(8% 0.03 280)' },
  { h: 4, top: 'oklch(14% 0.04 260)', bottom: 'oklch(10% 0.03 280)' },
  { h: 6, top: 'oklch(40% 0.10 50)', bottom: 'oklch(18% 0.08 280)' },
  { h: 9, top: 'oklch(55% 0.07 240)', bottom: 'oklch(35% 0.06 250)' },
  { h: 14, top: 'oklch(60% 0.06 230)', bottom: 'oklch(38% 0.05 245)' },
  { h: 18, top: 'oklch(50% 0.14 35)', bottom: 'oklch(22% 0.09 280)' },
  { h: 21, top: 'oklch(20% 0.06 280)', bottom: 'oklch(11% 0.04 285)' },
  { h: 24, top: 'oklch(11% 0.04 270)', bottom: 'oklch(8% 0.03 280)' },
]

export function useTimeTint(): Tint {
  const [tint, setTint] = useState<Tint>(() => computeTint(new Date()))

  useEffect(() => {
    const update = (): void => {
      setTint(computeTint(new Date()))
    }
    const id = setInterval(update, TICK_MS)
    return () => {
      clearInterval(id)
    }
  }, [])

  return tint
}

function computeTint(d: Date): Tint {
  const h = d.getHours() + d.getMinutes() / 60
  for (let i = 0; i < ANCHORS.length - 1; i++) {
    const a = ANCHORS[i]
    const b = ANCHORS[i + 1]
    if (a === undefined || b === undefined) continue
    if (h >= a.h && h < b.h) {
      const t = (h - a.h) / (b.h - a.h)
      // CSS color-mix 让浏览器自己插值 oklch,不用我手算
      return {
        top: `color-mix(in oklch, ${a.top}, ${b.top} ${String(Math.round(t * 100))}%)`,
        bottom: `color-mix(in oklch, ${a.bottom}, ${b.bottom} ${String(Math.round(t * 100))}%)`,
      }
    }
  }
  const fallback = ANCHORS[0]
  return fallback ?? { top: 'black', bottom: 'black' }
}
