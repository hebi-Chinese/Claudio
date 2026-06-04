// useBrowseAdjuster · ?adjust=browse 调试模式 — 拖天气 canvas 矩形
// 控制 4 个 CSS var 写到 :root: --browse-weather-{left,top,w,h}
// 触发: URL 加 ?adjust=browse
// 操作:
//   方向键        移位      (Shift = 大步 1%, 默认 0.2%)
//   + / -         同比缩放   (Shift = 0.5%, 默认 0.1%)
//   [ / ]         只调宽
//   , / .         只调高
//   P             console.log + alert 当前 CSS, 主人定数后烧进 globals.css

import { useEffect, useState } from 'react'

type BrowseVars = {
  left: number // %
  top: number // %
  w: number // %
  h: number // %
}

const DEFAULT_VARS: BrowseVars = { left: 20, top: 5, w: 60, h: 45 }

export function useBrowseAdjuster(): boolean {
  const [on, setOn] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const enabled = new URLSearchParams(window.location.search).get('adjust') === 'browse'
    if (!enabled) return
    setOn(true)
    const vars: BrowseVars = { ...DEFAULT_VARS }
    const onKey = (e: KeyboardEvent): void => {
      if (handleAdjustKey(e, vars)) {
        e.preventDefault()
        applyBrowseVars(vars)
      }
    }
    applyBrowseVars(vars)
    document.documentElement.setAttribute('data-adjust-mode', 'browse')
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.documentElement.removeAttribute('data-adjust-mode')
    }
  }, [])
  return on
}

function applyBrowseVars(v: BrowseVars): void {
  const r = document.documentElement
  r.style.setProperty('--browse-weather-left', `${v.left.toFixed(2)}%`)
  r.style.setProperty('--browse-weather-top', `${v.top.toFixed(2)}%`)
  r.style.setProperty('--browse-weather-w', `${v.w.toFixed(2)}%`)
  r.style.setProperty('--browse-weather-h', `${v.h.toFixed(2)}%`)
}

function handleAdjustKey(e: KeyboardEvent, v: BrowseVars): boolean {
  // step 单位是 vw/vh 的 %, weather canvas 占视口 60% 宽, 用 vinyl 的 0.1
  // 步长每次只动 ~1px 肉眼无感; bump 到 1.0 默认 / 3.0 shift
  const moveStep = e.shiftKey ? 3 : 1
  const sizeStep = e.shiftKey ? 3 : 1
  if (handleMoveKey(e.key, v, moveStep)) return true
  if (handleSizeKey(e.key, v, sizeStep)) return true
  if (e.key === 'p' || e.key === 'P') {
    printBrowseVars(v)
    return true
  }
  return false
}

function handleMoveKey(key: string, v: BrowseVars, step: number): boolean {
  switch (key) {
    case 'ArrowLeft':
      v.left -= step
      return true
    case 'ArrowRight':
      v.left += step
      return true
    case 'ArrowUp':
      v.top -= step
      return true
    case 'ArrowDown':
      v.top += step
      return true
    default:
      return false
  }
}

function handleSizeKey(key: string, v: BrowseVars, step: number): boolean {
  const z = zoomDelta(key)
  if (z !== 0) {
    v.w += step * z
    v.h += step * z
    return true
  }
  const wd = widthDelta(key)
  if (wd !== 0) {
    v.w += step * wd
    return true
  }
  const hd = heightDelta(key)
  if (hd !== 0) {
    v.h += step * hd
    return true
  }
  return false
}

function zoomDelta(key: string): -1 | 0 | 1 {
  if (key === '=' || key === '+') return 1
  if (key === '-' || key === '_') return -1
  return 0
}
function widthDelta(key: string): -1 | 0 | 1 {
  if (key === ']') return 1
  if (key === '[') return -1
  return 0
}
function heightDelta(key: string): -1 | 0 | 1 {
  if (key === '.' || key === '>') return 1
  if (key === ',' || key === '<') return -1
  return 0
}

function printBrowseVars(v: BrowseVars): void {
  const css = `--browse-weather-left: ${v.left.toFixed(1)}%; --browse-weather-top: ${v.top.toFixed(1)}%; --browse-weather-w: ${v.w.toFixed(1)}%; --browse-weather-h: ${v.h.toFixed(1)}%;`
  // eslint-disable-next-line no-console -- intentional: dev adjust mode
  console.log('[browse-adjust]', css)
  window.alert(css)
}
