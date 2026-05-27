// sharedAudioCtx · 全局唯一 AudioContext
//
// 为什么必须共享:
//   useAudioAnalyser 会调 createMediaElementSource(audio),这一步会**永久**把 audio 的
//   输出路由到这个 AudioContext 的 graph。如果 ctx 是 suspended,audio 就**没声音**
//   (尽管 audio.paused=false)。
//
//   ctx.resume() 必须在用户 gesture 里调,否则 Chrome 拒绝。如果 unlock 用一个 ctx、
//   analyser 用另一个 ctx,那 analyser 的 ctx 永远没机会被 resume → audio 永远静音。
//
//   所以: 同一个 ctx,unlock 时 resume,analyser 复用。

let shared: AudioContext | null = null
let resumed = false

export function getSharedAudioCtx(): AudioContext | null {
  if (shared !== null) return shared
  if (typeof window === 'undefined') return null
  try {
    shared = new AudioContext()
  } catch {
    return null
  }
  return shared
}

// 在 user gesture 内调一次,负责 resume + 标记
export async function unlockSharedAudioCtx(): Promise<boolean> {
  const ctx = getSharedAudioCtx()
  if (ctx === null) return false
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume()
    } catch {
      return false
    }
  }
  resumed = ctx.state === 'running'
  return resumed
}

export function isSharedAudioCtxRunning(): boolean {
  return resumed && shared !== null && shared.state === 'running'
}
