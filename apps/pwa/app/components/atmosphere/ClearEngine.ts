// 晴天引擎 · v1 占位: 只画几粒慢慢浮动的光斑
// 后续可换 lens-flare / sparkle / heat-shimmer 等

import type { AtmosphereEngine, Viewport } from './types'

type Mote = {
  x: number
  y: number
  r: number
  vx: number
  vy: number
  alpha: number
}

const MOTE_COUNT = 40

export function createClearEngine(): AtmosphereEngine {
  const motes: Mote[] = []
  let vp: Viewport = { width: 0, height: 0, dpr: 1 }

  return {
    init(viewport) {
      vp = viewport
      motes.length = 0
      for (let i = 0; i < MOTE_COUNT; i++) motes.push(makeMote(vp))
    },
    resize(viewport) {
      vp = viewport
    },
    step(dtMs) {
      const dt = dtMs / 1000
      for (const m of motes) {
        m.x += m.vx * dt
        m.y += m.vy * dt
        if (m.x < -10) m.x = vp.width + 10
        if (m.x > vp.width + 10) m.x = -10
        if (m.y < -10) m.y = vp.height + 10
        if (m.y > vp.height + 10) m.y = -10
      }
    },
    draw(ctx) {
      for (const m of motes) {
        ctx.fillStyle = `rgba(255,240,200,${String(m.alpha)})`
        ctx.beginPath()
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2)
        ctx.fill()
      }
    },
    dispose() {
      motes.length = 0
    },
  }
}

function makeMote(vp: Viewport): Mote {
  return {
    x: Math.random() * vp.width,
    y: Math.random() * vp.height,
    r: 0.6 + Math.random() * 1.6,
    vx: (Math.random() - 0.5) * 12,
    vy: (Math.random() - 0.5) * 8,
    alpha: 0.15 + Math.random() * 0.35,
  }
}
