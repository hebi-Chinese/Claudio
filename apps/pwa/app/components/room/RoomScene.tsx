'use client'

// RoomScene · 房间外壳 (墙 / 天花板阴影 / 地板 / 壁灯 / 窗户 / 窗台)
// 永远存在,在所有 ViewMode 下都看得见
// data-mode 由调用方挂在 <html> 上 → 驱动 [data-mode='listen'] 的暗化/玻璃关闭


import { WallLamp } from './WallLamp'
import { WindowPane } from './WindowPane'
import { WindowSill } from './WindowSill'

import type { ReactNode } from 'react'

type Props = {
  readonly children: ReactNode
}

export function RoomScene({ children }: Props) {
  return (
    <>
      {/* 4 块墙环绕窗洞 — 盖住 atmosphere canvas 让户外只在窗内可见 */}
      <div className="wall wall-top" aria-hidden="true" />
      <div className="wall wall-left" aria-hidden="true" />
      <div className="wall wall-right" aria-hidden="true" />
      <div className="wall wall-bottom" aria-hidden="true" />

      {/* 天花板阴影 + 地板透视 */}
      <div className="ceiling-shadow" aria-hidden="true" />
      <div className="floor" aria-hidden="true" />

      {/* 房间陈设 */}
      <WallLamp />
      <WindowPane />
      <WindowSill />

      {/* 全屋暖罩 (Listen 时加深) */}
      <div className="room-dim-overlay" aria-hidden="true" />

      {children}
    </>
  )
}
