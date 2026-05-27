'use client'

// VinylRecord · Listen 模式视觉主角 — 真旋转的唱片,中心贴 NCM 封面
// 比之前大一档,放在视口中上,占据视觉焦点
// 切歌时旧封面 rotate+fade out,新封面 spring 弹回 (key 变化触发)

import { useEffect, useState } from 'react'

import type { ApiSong } from '../../lib/api'

type Props = {
  readonly song: ApiSong | undefined
  readonly playing: boolean
}

const SIZE = 'clamp(280px, 36vw, 480px)' // 比上版大

export function VinylRecord({ song, playing }: Props) {
  const enterKey = useEnterKey(song?.id)
  return (
    <div
      aria-label={
        song !== undefined
          ? `正在播放: ${song.title} · ${song.artists.map((a) => a.name).join(', ')}`
          : '唱片机'
      }
      role="img"
      className="relative"
      style={{ width: SIZE, height: SIZE }}
    >
      <div
        key={enterKey}
        className="absolute inset-0 rounded-full enter-vinyl"
        style={{
          background:
            'radial-gradient(circle at 35% 35%, oklch(15% 0 0) 0%, oklch(5% 0 0) 70%, oklch(3% 0 0) 100%)',
          boxShadow:
            '0 0 80px oklch(82% 0.13 75 / 0.15), 0 32px 64px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.05)',
          animation: `vinyl-spin 12s linear infinite${playing ? '' : ' paused'}`,
          animationPlayState: playing ? 'running' : 'paused',
        }}
      >
        <Grooves />
        <CenterLabel song={song} />
        <Spindle />
      </div>
      <Highlight />
    </div>
  )
}

// song.id 变化触发入场动画
function useEnterKey(id: string | undefined): string {
  const [key, setKey] = useState(id ?? 'empty')
  useEffect(() => {
    setKey(id ?? 'empty')
  }, [id])
  return key
}

function Grooves() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {Array.from({ length: 12 }, (_, i) => {
        const r = 14 + i * 2.8
        return (
          <circle
            key={i}
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="oklch(22% 0 0)"
            strokeWidth="0.12"
            opacity={0.5 - (i / 12) * 0.2}
          />
        )
      })}
    </svg>
  )
}

function CenterLabel({ song }: { readonly song: ApiSong | undefined }) {
  return (
    <div
      className="absolute top-1/2 left-1/2 rounded-full overflow-hidden"
      style={{
        width: '38%',
        height: '38%',
        transform: 'translate(-50%, -50%)',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08), 0 0 16px rgba(0,0,0,0.5)',
        background: 'oklch(22% 0.04 50)',
      }}
    >
      {song?.coverUrl !== undefined ? (
        <img src={song.coverUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white/30 text-xs font-light">
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
        width: 12,
        height: 12,
        transform: 'translate(-50%, -50%)',
        background:
          'radial-gradient(circle, oklch(82% 0.13 70) 0%, oklch(55% 0.10 60) 80%)',
        boxShadow: '0 0 6px rgba(0,0,0,0.7), inset 0 0 2px oklch(15% 0 0)',
      }}
      aria-hidden="true"
    />
  )
}

// 唱片表面光泽 (整圆斜向反光),静止不旋转,叠在最上
function Highlight() {
  return (
    <div
      className="absolute inset-0 rounded-full pointer-events-none"
      style={{
        background:
          'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 30%, transparent 70%, rgba(255,255,255,0.03) 100%)',
      }}
      aria-hidden="true"
    />
  )
}
