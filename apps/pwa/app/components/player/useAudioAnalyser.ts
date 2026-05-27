// useAudioAnalyser · 把 <audio> ref 接到 Web Audio AnalyserNode
// 返回平滑后的 48 bar 频率数据 (log-scale 抽样)
//
// 关键约束: createMediaElementSource 会**夺走** audio 元素的默认输出,
// 此后声音必须经过 audioCtx 图才能播。一旦 ctx 是 suspended (Chrome
// autoplay policy 常态),声音就**完全没了**。所以:
// 1) 创建后立即 ctx.resume(),失败就不接 analyser 让 audio 走默认路径
// 2) 失败 / 取不到时, bars 为 null,组件 fallback 静态呼吸,**优先保声音**

import { useEffect, useRef, useState } from 'react'

const FFT_SIZE = 256
const USED_BINS = 64
const BAR_COUNT = 48
const SMOOTHING = 0.7

type State = {
  readonly bars: readonly number[] | null
  readonly active: boolean
}

type AnalyserRefs = {
  readonly mounted: { current: boolean }
  readonly analyser: { current: AnalyserNode | null }
  readonly smoothed: { current: Float32Array }
  readonly raf: { current: number }
}

export function useAudioAnalyser(audioRef: React.RefObject<HTMLAudioElement | null>): State {
  const [bars, setBars] = useState<readonly number[] | null>(null)
  const [active, setActive] = useState(false)
  const refs: AnalyserRefs = {
    mounted: useRef(false),
    analyser: useRef<AnalyserNode | null>(null),
    smoothed: useRef<Float32Array>(new Float32Array(BAR_COUNT)),
    raf: useRef(0),
  }

  useEffect(() => {
    const audio = audioRef.current
    if (audio === null) return
    const attach = (): void => {
      void tryAttach(audio, refs, setActive, setBars)
    }
    audio.addEventListener('play', attach)
    if (!audio.paused) attach()
    return () => {
      cancelAnimationFrame(refs.raf.current)
      audio.removeEventListener('play', attach)
    }
  }, [audioRef, refs])

  return { bars, active }
}

async function tryAttach(
  audio: HTMLAudioElement,
  refs: AnalyserRefs,
  setActive: (v: boolean) => void,
  setBars: (v: readonly number[]) => void,
): Promise<void> {
  if (refs.mounted.current) return
  refs.mounted.current = true
  try {
    const ctx = new AudioContext()
    // 必须 resume,否则 ctx 是 suspended 状态、整条 graph 静默,等于劫持了 audio
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }
    const source = ctx.createMediaElementSource(audio)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = FFT_SIZE
    source.connect(analyser)
    analyser.connect(ctx.destination)
    refs.analyser.current = analyser
    setActive(true)
    startLoop(refs, setBars)
  } catch {
    // resume 失败 / createMediaElementSource 失败 → 不接,audio 自己播,viz 走 fallback
    refs.mounted.current = false
    setActive(false)
  }
}

function startLoop(refs: AnalyserRefs, setBars: (v: readonly number[]) => void): void {
  const analyser = refs.analyser.current
  if (analyser === null) return
  const freqData = new Uint8Array(analyser.frequencyBinCount)
  const tick = (): void => {
    analyser.getByteFrequencyData(freqData)
    const sampled = sampleLogScale(freqData)
    const smoothed = refs.smoothed.current
    const next = new Array<number>(BAR_COUNT)
    for (let i = 0; i < BAR_COUNT; i++) {
      const prev = smoothed[i] ?? 0
      const v = sampled[i] ?? 0
      const s = prev * SMOOTHING + v * (1 - SMOOTHING)
      smoothed[i] = s
      next[i] = s
    }
    setBars(next)
    refs.raf.current = requestAnimationFrame(tick)
  }
  refs.raf.current = requestAnimationFrame(tick)
}

function sampleLogScale(freqData: Uint8Array): number[] {
  const result = new Array<number>(BAR_COUNT)
  for (let i = 0; i < BAR_COUNT; i++) {
    const t = i / (BAR_COUNT - 1)
    const binIndex = Math.round(Math.pow(2, t * Math.log2(USED_BINS + 1)) - 1)
    const clamped = Math.min(USED_BINS - 1, Math.max(0, binIndex))
    result[i] = freqData[clamped] ?? 0
  }
  return result
}
