'use client'

// useAudioUnlock · 解决 Chrome autoplay 拦截
// 背景: React useEffect 异步设 audio.src 然后 play(),已脱离 user-gesture window,被 Chrome 拦
// 同时 useAudioAnalyser.createMediaElementSource 会把 audio 输出路由到 AudioContext,
// 如果 ctx 是 suspended → 即使 audio.paused=false 也**没声音**
//
// 修复 (两件事都在首次用户事件里同步做完):
//  1) 共享 AudioContext.resume() — 让 analyser 复用的同一个 ctx 进入 running
//     同时播一个 0-length buffer,Chrome 把页面标记为已激活
//  2) 给 audio 元素一次"已经在用户手势内成功播过"的标记
//     用 silent base64 wav 当 src 调一次 play+pause

import { useEffect } from 'react'

import { getSharedAudioCtx, unlockSharedAudioCtx } from './sharedAudioCtx'

// 极短 silent wav (8-bit 单声道, 1 sample) base64
const SILENT_WAV =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='

export function useAudioUnlock(audioRef: React.RefObject<HTMLAudioElement | null>): void {
  useEffect(() => {
    let unlocked = false

    const unlock = (): void => {
      if (unlocked) return
      void unlockSharedAudioCtx().then((ok) => {
        // 顺手播一个 0-length buffer,触发 Chrome 把页面标记为激活
        if (ok) {
          const ctx = getSharedAudioCtx()
          if (ctx !== null) {
            try {
              const bufferSource = ctx.createBufferSource()
              bufferSource.buffer = ctx.createBuffer(1, 1, 22050)
              bufferSource.connect(ctx.destination)
              bufferSource.start(0)
            } catch {
              // 解锁失败不阻塞后续
            }
          }
        }
      })

      // 给 audio 元素本身一次成功 play 的记录
      const audio = audioRef.current
      if (audio === null) return
      if (audio.src.length > 0 && !audio.src.startsWith('data:')) {
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
