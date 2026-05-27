'use client'

// VinylRecord · Listen 模式视觉主角 — 真旋转的黑胶唱片
// 必须正圆 (width === height + aspect-ratio),否则会看起来像跑道
// 尺寸同时受 vw 和 vh 约束,避免被父 flex 压扁
// 视觉层次 (内到外):
//   - 中心轴钉 (gold spindle)
//   - 中心标签 (NCM 封面 + 一圈奶油色外框)
//   - 唱片本体 (深黑径向 + 32 道细 grooves + 表面斜向高光)
//   - 外缘暗边
// 切歌时旧封面 rotate+fade out,新封面 spring 弹回 (key 变化触发)

import { useEffect, useState } from 'react'

import type { ApiSong } from '../../lib/api'

type Props = {
  readonly song: ApiSong | undefined
  readonly playing: boolean
}

// 同时受 32vh 约束,防止被父容器压
const SIZE = 'min(clamp(240px, 30vw, 380px), 32vh)'

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
      className="relative flex-shrink-0"
      style={{ width: SIZE, height: SIZE, aspectRatio: '1 / 1' }}
    >
      <div
        key={enterKey}
        className="absolute inset-0 rounded-full enter-vinyl"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, oklch(8% 0 0) 0%, oklch(5% 0 0) 60%, oklch(3% 0 0) 100%)',
          boxShadow:
            '0 0 80px oklch(82% 0.13 75 / 0.12), 0 28px 56px rgba(0,0,0,0.65), inset 0 0 0 2px oklch(8% 0 0), inset 0 0 0 3px oklch(20% 0.02 30 / 0.4)',
          animationPlayState: playing ? 'running' : 'paused',
        }}
      >
        <Grooves />
        <OuterRim />
        <CenterLabel song={song} />
        <Spindle />
      </div>
      <DiagonalGloss />
      <CircularHighlight />
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

// 32 道更密 + 更细 grooves,半径从 14 (中心标签外) 到 48 (边缘附近)
function Grooves() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      {Array.from({ length: 32 }, (_, i) => {
        const r = 18 + i * 0.95 // 18 → 47.45
        // 每 4 道里有一道稍亮,模拟分段
        const isAccent = i % 4 === 0
        const stroke = isAccent ? 'oklch(28% 0.01 50)' : 'oklch(20% 0 0)'
        const sw = isAccent ? 0.18 : 0.08
        const op = 0.35 + Math.sin(i * 0.4) * 0.1
        return (
          <circle
            key={i}
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={stroke}
            strokeWidth={sw}
            opacity={op}
          />
        )
      })}
    </svg>
  )
}

function OuterRim() {
  return (
    <div
      className="absolute inset-0 rounded-full pointer-events-none"
      style={{
        boxShadow:
          'inset 0 0 0 2px oklch(3% 0 0), inset 0 0 8px oklch(5% 0 0 / 0.8), inset 0 0 0 3px oklch(18% 0.02 30 / 0.35)',
      }}
      aria-hidden="true"
    />
  )
}

function CenterLabel({ song }: { readonly song: ApiSong | undefined }) {
  return (
    <div
      className="absolute top-1/2 left-1/2 rounded-full overflow-hidden"
      style={{
        width: '34%',
        height: '34%',
        transform: 'translate(-50%, -50%)',
        boxShadow:
          'inset 0 0 0 1.5px oklch(82% 0.1 75 / 0.5), inset 0 0 0 3px oklch(8% 0 0), 0 0 22px oklch(0% 0 0 / 0.6), 0 0 0 1px oklch(82% 0.1 75 / 0.2)',
        background: 'oklch(20% 0.04 50)',
      }}
    >
      {song?.coverUrl !== undefined ? (
        <img src={song.coverUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white/30 text-2xl font-light">
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
        width: 10,
        height: 10,
        transform: 'translate(-50%, -50%)',
        background:
          'radial-gradient(circle at 30% 30%, oklch(92% 0.1 75) 0%, oklch(70% 0.13 65) 50%, oklch(40% 0.08 55) 100%)',
        boxShadow: '0 0 6px rgba(0,0,0,0.9), inset 0 0 2px oklch(20% 0.04 40), 0 0 0 1px oklch(35% 0.06 50)',
      }}
      aria-hidden="true"
    />
  )
}

// 斜向高光: 整张唱片有一道斜光 (不旋转,叠在静态层上)
function DiagonalGloss() {
  return (
    <div
      className="absolute inset-0 rounded-full pointer-events-none"
      style={{
        background:
          'linear-gradient(115deg, transparent 30%, oklch(95% 0.01 100 / 0.06) 45%, oklch(95% 0.01 100 / 0.1) 50%, oklch(95% 0.01 100 / 0.04) 56%, transparent 70%)',
      }}
      aria-hidden="true"
    />
  )
}

// 圆形高光: 左上角一片更亮的反光,模拟环境光
function CircularHighlight() {
  return (
    <div
      className="absolute inset-0 rounded-full pointer-events-none"
      style={{
        background:
          'radial-gradient(ellipse at 28% 22%, oklch(95% 0.01 100 / 0.08) 0%, transparent 35%)',
      }}
      aria-hidden="true"
    />
  )
}
