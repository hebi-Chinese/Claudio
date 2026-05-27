'use client'

// ImmersiveLyrics · Listen 模式底部歌词带 (单行强 + 上下行弱,共 3 行可见)
// 不是占满屏的大字阵列,是窗台下方一段安静的字幕带
// active 居中且最显眼; prev/next 极弱辅助
// 无 LRC 时只显示歌名 + 歌手居中

import type { ApiSong } from '../../lib/api'
import type { LrcLine } from '../../lib/lrc'

type Props = {
  readonly song: ApiSong | undefined
  readonly lines: readonly LrcLine[]
  readonly loading: boolean
  readonly activeIndex: number
}

export function ImmersiveLyrics(props: Props) {
  if (props.song === undefined) return <Empty />
  if (props.loading) return <Loading />
  if (props.lines.length === 0) return <NoLyricFallback song={props.song} />
  return <Strip lines={props.lines} activeIndex={props.activeIndex} />
}

const STRIP_STYLE: React.CSSProperties = {
  fontFamily: '"Source Han Serif SC", "Songti SC", "Noto Serif SC", serif',
  color: 'oklch(94% 0.02 70)',
}

function Strip({
  lines,
  activeIndex,
}: {
  readonly lines: readonly LrcLine[]
  readonly activeIndex: number
}) {
  // 只渲染 active ±1 (共 3 行带)
  const prev = activeIndex > 0 ? lines[activeIndex - 1] : undefined
  const active = lines[activeIndex]
  const next = activeIndex < lines.length - 1 ? lines[activeIndex + 1] : undefined

  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="歌词"
      className="flex flex-col items-center text-center gap-2"
      style={STRIP_STYLE}
    >
      <StripLine text={prev?.text} role="passive" />
      <StripLine text={active?.text ?? ''} role="active" />
      <StripLine text={next?.text} role="passive" />
    </div>
  )
}

function StripLine({
  text,
  role,
}: {
  readonly text: string | undefined
  readonly role: 'active' | 'passive'
}) {
  const isActive = role === 'active'
  return (
    <div
      className="transition-all duration-500 ease-out leading-tight"
      style={{
        opacity: text === undefined ? 0 : isActive ? 1 : 0.32,
        fontSize: isActive ? 'clamp(1.1rem, 1.6vw, 1.6rem)' : 'clamp(0.85rem, 1.1vw, 1.05rem)',
        fontWeight: isActive ? 400 : 300,
        letterSpacing: isActive ? '0.04em' : '0.02em',
        filter: isActive ? 'none' : 'blur(0.5px)',
        textShadow: isActive ? '0 0 6px rgba(255,255,255,0.18)' : 'none',
        minHeight: '1.4em',
      }}
    >
      {text ?? ' '}
    </div>
  )
}

function Empty() {
  return <div className="text-white/30 font-light text-sm">还没选歌</div>
}

function Loading() {
  return <div className="text-white/40 font-light text-sm animate-pulse">加载歌词中…</div>
}

function NoLyricFallback({ song }: { readonly song: ApiSong }) {
  return (
    <div className="text-center text-white/85 font-light leading-tight" style={STRIP_STYLE}>
      <div style={{ fontSize: 'clamp(1.1rem, 1.5vw, 1.5rem)' }}>{song.title}</div>
      <div className="mt-1 text-white/45" style={{ fontSize: 'clamp(0.85rem, 1vw, 1rem)' }}>
        {song.artists.map((a) => a.name).join(' · ')}
      </div>
    </div>
  )
}
