'use client'

// VinylRecord · 简化设计 — 用户最新意见: "不要黑边,封面太大挡字幕"
//
// 新版结构 (从外到内):
//   外阴影 (沉)
//   暖色光环 (1px gold,代替黑胶外圈)
//   封面图 (占 100% 圆形主体,旋转)
//   spindle (中心金钉)
// 没有黑色环,没有 grooves
// SIZE 比上版缩 30%,留出空间给底部字幕
// 必须正圆 (aspect-ratio + width/height + 24vh 上限)

import { useEffect, useState } from 'react'

import type { ApiSong } from '../../lib/api'

type Props = {
  readonly song: ApiSong | undefined
  readonly playing: boolean
}

// 同时受 24vh 约束 — 比之前 32vh 小,留空间给歌词
const SIZE = 'min(clamp(180px, 22vw, 280px), 24vh)'

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
        className="absolute inset-0 rounded-full overflow-hidden enter-vinyl"
        style={{
          boxShadow:
            '0 0 0 1px oklch(82% 0.1 75 / 0.35), 0 0 0 2px oklch(60% 0.06 60 / 0.18), 0 16px 32px oklch(0% 0 0 / 0.55), 0 0 36px oklch(82% 0.13 75 / 0.08)',
          background: 'oklch(18% 0.04 50)',
          animationPlayState: playing ? 'running' : 'paused',
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
      <Spindle />
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

function Spindle() {
  return (
    <div
      className="absolute top-1/2 left-1/2 rounded-full"
      style={{
        width: 8,
        height: 8,
        transform: 'translate(-50%, -50%)',
        background:
          'radial-gradient(circle at 30% 30%, oklch(94% 0.08 75) 0%, oklch(70% 0.13 65) 55%, oklch(40% 0.08 55) 100%)',
        boxShadow:
          '0 0 4px rgba(0,0,0,0.85), inset 0 0 1px oklch(20% 0.04 40), 0 0 0 1px oklch(35% 0.06 50)',
      }}
      aria-hidden="true"
    />
  )
}

// 整张封面的环境反光,极淡
function Highlight() {
  return (
    <div
      className="absolute inset-0 rounded-full pointer-events-none"
      style={{
        background:
          'radial-gradient(ellipse at 30% 22%, oklch(95% 0.01 100 / 0.1) 0%, transparent 30%)',
      }}
      aria-hidden="true"
    />
  )
}
