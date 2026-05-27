'use client'

// VinylRecord · 视觉重设计
// 旧版: 大黑唱片 + 38% 中心小封面 — 用户嫌"一坨黑,封面太小"
// 新版: 封面占 68% 大头,黑色只剩 16% 薄外圈,grooves 只画在外圈
//      整体观感是"一张大封面,边缘镶黑胶质感",不是"黑胶里塞个小标签"
// 必须正圆 (aspect-ratio + width/height + 32vh 上限),否则像跑道

import { useEffect, useState } from 'react'

import type { ApiSong } from '../../lib/api'

type Props = {
  readonly song: ApiSong | undefined
  readonly playing: boolean
}

const SIZE = 'min(clamp(260px, 32vw, 420px), 36vh)'

export function VinylRecord({ song, playing }: Props) {
  const enterKey = useEnterKey(song?.id)
  return (
    <div
      aria-label={
        song !== undefined
          ? `正在播放: ${song.title} · ${song.artists.map((a) => a.name).join(', ')}`
          : '唱片'
      }
      role="img"
      className="relative flex-shrink-0"
      style={{ width: SIZE, height: SIZE, aspectRatio: '1 / 1' }}
    >
      <div
        key={enterKey}
        className="absolute inset-0 rounded-full enter-vinyl"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, oklch(10% 0 0) 0%, oklch(6% 0 0) 70%, oklch(3% 0 0) 100%)',
          boxShadow:
            '0 0 60px oklch(82% 0.13 75 / 0.1), 0 24px 48px rgba(0,0,0,0.6)',
          animationPlayState: playing ? 'running' : 'paused',
        }}
      >
        <OuterGrooves />
        <CoverArt song={song} />
        <Spindle />
      </div>
      <Highlight />
    </div>
  )
}

function useEnterKey(id: string | undefined): string {
  const [key, setKey] = useState(id ?? 'empty')
  useEffect(() => {
    setKey(id ?? 'empty')
  }, [id])
  return key
}

// grooves 只画在外圈薄环里 (r 34 → 48,封面占 68%),不再侵占中心
function OuterGrooves() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      {Array.from({ length: 14 }, (_, i) => {
        const r = 34.5 + i * 0.95
        const isAccent = i % 3 === 0
        return (
          <circle
            key={i}
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={isAccent ? 'oklch(28% 0.01 50)' : 'oklch(20% 0 0)'}
            strokeWidth={isAccent ? 0.15 : 0.06}
            opacity={0.45 - i * 0.015}
          />
        )
      })}
    </svg>
  )
}

// 封面占 68% 直径 — 视觉主角
function CoverArt({ song }: { readonly song: ApiSong | undefined }) {
  return (
    <div
      className="absolute top-1/2 left-1/2 rounded-full overflow-hidden"
      style={{
        width: '68%',
        height: '68%',
        transform: 'translate(-50%, -50%)',
        boxShadow:
          '0 0 0 1px oklch(8% 0 0 / 0.7), 0 0 0 2px oklch(82% 0.08 70 / 0.18), 0 6px 16px oklch(0% 0 0 / 0.5)',
        background: 'oklch(20% 0.04 50)',
      }}
    >
      {song?.coverUrl !== undefined ? (
        <img src={song.coverUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white/30 text-3xl font-light">
          ○
        </div>
      )}
    </div>
  )
}

function Spindle() {
  return (
    <div
      className="absolute top-1/2 left-1/2 rounded-full"
      style={{
        width: 9,
        height: 9,
        transform: 'translate(-50%, -50%)',
        background:
          'radial-gradient(circle at 30% 30%, oklch(92% 0.1 75) 0%, oklch(70% 0.13 65) 55%, oklch(40% 0.08 55) 100%)',
        boxShadow:
          '0 0 5px rgba(0,0,0,0.9), inset 0 0 1px oklch(20% 0.04 40), 0 0 0 1px oklch(35% 0.06 50)',
      }}
      aria-hidden="true"
    />
  )
}

// 整张唱片表面的环境光高光,在外圈黑环上滚一道反光
function Highlight() {
  return (
    <div
      className="absolute inset-0 rounded-full pointer-events-none"
      style={{
        background:
          'radial-gradient(ellipse at 28% 22%, oklch(95% 0.01 100 / 0.08) 0%, transparent 35%), linear-gradient(115deg, transparent 35%, oklch(95% 0.01 100 / 0.04) 50%, transparent 65%)',
      }}
      aria-hidden="true"
    />
  )
}
