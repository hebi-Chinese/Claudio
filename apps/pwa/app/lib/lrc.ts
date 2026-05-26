// LRC 歌词解析 · 把 "[00:12.34]xxx" 行 → { timeMs, text }

export type LrcLine = {
  readonly timeMs: number
  readonly text: string
}

const LRC_LINE_RE = /\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?\](.*)/

export function parseLrc(raw: string): readonly LrcLine[] {
  const lines: LrcLine[] = []
  for (const rawLine of raw.split('\n')) {
    const m = LRC_LINE_RE.exec(rawLine)
    if (m === null) continue
    const [, mm, ss, msRaw, text] = m
    if (mm === undefined || ss === undefined || text === undefined) continue
    const minutes = Number(mm)
    const seconds = Number(ss)
    let millis = 0
    if (msRaw !== undefined) {
      const padded = msRaw.length === 2 ? msRaw + '0' : msRaw.length === 1 ? msRaw + '00' : msRaw
      millis = Number(padded)
    }
    const timeMs = (minutes * 60 + seconds) * 1000 + millis
    const trimmed = text.trim()
    if (trimmed.length > 0) {
      lines.push({ timeMs, text: trimmed })
    }
  }
  return lines.sort((a, b) => a.timeMs - b.timeMs)
}

export function findActiveLineIndex(lines: readonly LrcLine[], currentMs: number): number {
  if (lines.length === 0) return -1
  // 找最后一个 timeMs <= currentMs 的行
  let lo = 0
  let hi = lines.length - 1
  let result = -1
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1
    const midLine = lines[mid]
    if (midLine === undefined) break
    if (midLine.timeMs <= currentMs) {
      result = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  return result
}
