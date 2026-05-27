'use client'

// WindowPane · 窗户本身 — 窗框 + 十字木条 + 玻璃 + 双扇关窗动效
// 玻璃 opacity / 双扇位移由 [data-mode='listen'] 驱动 (CSS only,无 JS state)
// 雨珠贴玻璃: M5 接 RainOnGlass canvas;v1 用 CSS gradient + 静态 SVG noise 模拟潮气
// 关窗动画一次性,不在切歌时重放

export function WindowPane() {
  return (
    <div className="window-box" aria-hidden="true">
      <div className="window-frame" />
      <div className="window-glass">
        <FoggyBreath />
      </div>
      <div className="window-sash left" />
      <div className="window-sash right" />
      <div className="window-cross" />
    </div>
  )
}

// 玻璃上的薄雾呼吸 — Listen 时玻璃多一层潮意 (CSS 控)
function FoggyBreath() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'radial-gradient(ellipse at 30% 70%, oklch(80% 0.02 220 / 0.18) 0%, transparent 55%), radial-gradient(ellipse at 70% 30%, oklch(80% 0.02 220 / 0.12) 0%, transparent 50%)',
        pointerEvents: 'none',
        mixBlendMode: 'screen',
      }}
    />
  )
}
