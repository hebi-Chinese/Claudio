'use client'

// useDjState · DJ 文案生成 + 气泡云显示节奏
// 切歌时(currentSong.id 变化)生成一段「过场词」,5s 后自动 fade-out
// 文案模板: 上一首是 X → 现在这首 → 引入说明 (作品年份/风格)
// v1 用本地模板;M3 接 LLM

import { useEffect, useRef, useState } from 'react'

import type { ApiSong } from '../../lib/api'
import type { Language } from '../../lib/i18n'

const CLOUD_HOLD_MS = 5400
const CLOUD_FADE_MS = 800

export type DjMessage = {
  readonly text: string
  readonly id: string
}

type Props = {
  readonly currentSong: ApiSong | undefined
  readonly previousSong: ApiSong | undefined
  readonly userInitiated: boolean
  readonly enabled: boolean
  readonly lang: Language
}

export function useDjCloud({
  currentSong,
  previousSong,
  userInitiated,
  enabled,
  lang,
}: Props): DjMessage | null {
  const [msg, setMsg] = useState<DjMessage | null>(null)
  const [fading, setFading] = useState(false)
  const lastId = useRef<string | null>(null)

  useEffect(() => {
    if (!enabled || currentSong === undefined) {
      setMsg(null)
      return
    }
    if (lastId.current === currentSong.id) return
    lastId.current = currentSong.id
    const text = composeIntro({ currentSong, previousSong, userInitiated, lang })
    const id = `${currentSong.id}-${String(Date.now())}`
    setMsg({ text, id })
    setFading(false)
    const t1 = window.setTimeout(() => {
      setFading(true)
    }, CLOUD_HOLD_MS)
    const t2 = window.setTimeout(() => {
      setMsg(null)
      setFading(false)
    }, CLOUD_HOLD_MS + CLOUD_FADE_MS)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [currentSong, previousSong, userInitiated, enabled, lang])

  // 把 fading 状态贴回 msg 以便组件使用 data-fading
  if (msg === null) return null
  return fading ? { ...msg, id: `${msg.id}-fading` } : msg
}

// ────────────────────────────────────────────────────────────────────────
// 文案生成 (纯函数,易测)

type ComposeOpts = {
  readonly currentSong: ApiSong
  readonly previousSong: ApiSong | undefined
  readonly userInitiated: boolean
  readonly lang: Language
}

const ZH_INTROS_USER: readonly string[] = [
  '好,放你的{title} · {artist}',
  '点的是{artist}的{title},来',
  '{title}—听过很多遍,但每次都不一样',
  '{artist}的歌,放',
]
const ZH_INTROS_AUTO: readonly string[] = [
  '接下来给你放{artist}的{title}',
  '雨天合适听这首—{title} · {artist}',
  '换一首{artist},{title}',
  '{artist}的{title},让它响一下',
]
const ZH_TRANSITIONS: readonly string[] = [
  '听完{prevTitle},接{title}',
  '{prevArtist}的余韵还在,来段{artist}',
  '上首是{prevTitle},现在这首{title}',
]
const EN_INTROS_USER: readonly string[] = [
  'Alright, your pick: {title} by {artist}',
  '{title} from {artist}, coming up',
  '{title} — never gets old',
]
const EN_INTROS_AUTO: readonly string[] = [
  'Next up, {title} by {artist}',
  'Rainy-day mood, this fits: {title} · {artist}',
  'Switching to {artist}, {title}',
]
const EN_TRANSITIONS: readonly string[] = [
  'After {prevTitle}, here is {title}',
  '{prevArtist} leaving, {artist} entering',
  'From {prevTitle} into {title}',
]

function composeIntro(opts: ComposeOpts): string {
  const titleNow = opts.currentSong.title
  const artistNow = opts.currentSong.artists.map((a) => a.name).join(' / ')
  const hasPrev = opts.previousSong !== undefined && opts.previousSong.id !== opts.currentSong.id
  const titlePrev = opts.previousSong?.title ?? ''
  const artistPrev = opts.previousSong?.artists.map((a) => a.name).join(' / ') ?? ''

  const pool = pickPool(opts.lang, hasPrev, opts.userInitiated)
  const template = pool[Math.floor(Math.random() * pool.length)] ?? pool[0] ?? ''
  return template
    .replaceAll('{title}', titleNow)
    .replaceAll('{artist}', artistNow)
    .replaceAll('{prevTitle}', titlePrev)
    .replaceAll('{prevArtist}', artistPrev)
}

function pickPool(lang: Language, hasPrev: boolean, userInitiated: boolean): readonly string[] {
  if (lang === 'zh') {
    if (hasPrev && !userInitiated) return ZH_TRANSITIONS
    return userInitiated ? ZH_INTROS_USER : ZH_INTROS_AUTO
  }
  if (hasPrev && !userInitiated) return EN_TRANSITIONS
  return userInitiated ? EN_INTROS_USER : EN_INTROS_AUTO
}
