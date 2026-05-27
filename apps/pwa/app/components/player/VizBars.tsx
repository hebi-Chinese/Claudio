'use client'

// VizBars · Listen 模式底部音频可视化条
// 性能关键: 60fps × 48 bar = 2880 个 DOM 更新/秒,
// 用 React state 每帧 setState 会触发 reconciliation → 严重掉帧。
// 这里改成 ref 数组 + 直接 style.height,不走 React 调度。
// analyser 不可用时用静态呼吸 fallback (也是直接 DOM)。

import { useEffect, useRef } from 'react'

import { BAR_COUNT, useAudioAnalyser } from './useAudioAnalyser'

const BAR_WIDTH = 3
const BAR_GAP = 4
const MAX_HEIGHT = 72
const BASELINE = 2

type Props = {
  readonly audioRef: React.RefObject<HTMLAudioElement | null>
  readonly playing: boolean
}

export function VizBars({ audioRef, playing }: Props) {
  const { barsRef, isActive } = useAudioAnalyser(audioRef)
  const barElsRef = useRef<HTMLDivElement[]>([])
  useVizLoop(barElsRef, barsRef, isActive, playing)
  const totalWidth = BAR_COUNT * BAR_WIDTH + (BAR_COUNT - 1) * BAR_GAP
  return (
    <div
      aria-hidden="true"
      className="fixed bottom-0 left-1/2 z-20 -translate-x-1/2 flex items-end gap-1 pb-3 pointer-events-none"
      style={{ width: totalWidth, height: MAX_HEIGHT + 12 }}
    >
      {Array.from({ length: BAR_COUNT }, (_, i) => (
        <div
          key={i}
          ref={(el) => {
            if (el !== null) barElsRef.current[i] = el
          }}
          className="rounded-sm"
          style={{
            width: BAR_WIDTH,
            height: BASELINE,
            background: 'linear-gradient(to top, oklch(94% 0.02 70 / 0.5), oklch(94% 0.02 70 / 1))',
          }}
        />
      ))}
    </div>
  )
}

function useVizLoop(
  barElsRef: React.RefObject<HTMLDivElement[]>,
  barsRef: { current: Float32Array },
  isActive: () => boolean,
  playing: boolean,
): void {
  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const tick = (): void => {
      const els = barElsRef.current
      const useBars = isActive()
      for (let i = 0; i < BAR_COUNT; i++) {
        const el = els[i]
        if (el === undefined) continue
        let h = BASELINE
        if (playing) {
          if (useBars) {
            const v = barsRef.current[i] ?? 0
            h = Math.max(BASELINE, (v / 255) * MAX_HEIGHT)
          } else {
            const t = (performance.now() - start) / 1000
            const phase = (i / BAR_COUNT) * Math.PI * 2 + t * 1.5
            h = Math.max(BASELINE, 16 + Math.sin(phase) * 12)
          }
        }
        el.style.height = `${String(h)}px`
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
    }
  }, [barElsRef, barsRef, isActive, playing])
}
