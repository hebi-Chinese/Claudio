'use client'

// useAudioUnlock · 解决 Chrome autoplay 拦截
// 背景: React 用 useEffect 异步 setState → audio.src=url → .play(),已脱离 user-gesture window,
// Chrome 拦掉。结果是"点搜索结果没声音"。
//
// 修复策略 (双保险):
//  (a) 首次用户事件 — 用 silent wav 作为 src 调一次 play()+pause(),让 audio 元素被标记成
//      "已经在用户手势内成功播过"。这个标记长期存在,后续 src 变更 + play() 不再被拦。
//  (b) 同步 resume 一个 AudioContext + 播一个 0-length buffer — 让 web audio 子系统解锁。
// 若 audio 已经有真 src (用户先点了一首歌再交互),跳过 silent 注入,避免覆盖。

import { useEffect } from 'react'

// 极短 silent wav (8-bit 单声道, 1 sample) base64
const SILENT_WAV =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='

export function useAudioUnlock(audioRef: React.RefObject<HTMLAudioElement | null>): void {
  useEffect(() => {
    let unlocked = false

    const unlock = (): void => {
      if (unlocked) return
      // 1. AudioContext 路径 — 解锁 web audio 子系统
      try {
        const ctx = new AudioContext()
        void ctx.resume()
        const bufferSource = ctx.createBufferSource()
        bufferSource.buffer = ctx.createBuffer(1, 1, 22050)
        bufferSource.connect(ctx.destination)
        bufferSource.start(0)
      } catch {
        // 浏览器不支持时降级
      }

      // 2. HTMLAudio 路径 — 用 silent wav 真正完成一次 play+pause 来激活元素
      const audio = audioRef.current
      if (audio === null) return
      if (audio.src.length > 0 && !audio.src.startsWith('data:')) {
        // 真 src 已经在跑,别用 silent 覆盖,标记解锁完毕即可
        unlocked = true
        return
      }
      const originalMuted = audio.muted
      audio.muted = true
      audio.src = SILENT_WAV
      audio
        .play()
        .then(() => {
          audio.pause()
          audio.currentTime = 0
          audio.muted = originalMuted
          unlocked = true
        })
        .catch(() => {
          audio.muted = originalMuted
          // 失败就让下一次 gesture 再试
        })
    }

    window.addEventListener('pointerdown', unlock, { passive: true })
    window.addEventListener('keydown', unlock, { passive: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [audioRef])
}
