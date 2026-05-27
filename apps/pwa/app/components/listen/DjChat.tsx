'use client'

// DjChat · D 方案: 跟 DJ 对话点歌
// Listen 模式右下角入口 → 点开抽屉式聊天
// v1 用规则解析: 抽出"歌手/歌名"片段 → 调 search → 取第一首 → 播放
//   - "放周杰伦的稻香" → search("稻香 周杰伦")
//   - "下一首" → 直接 next
//   - "换一首" → next
//   - "听点XX" → search("XX")
// M3 接 LLM 真对话 + 心理画像

import { useEffect, useRef, useState } from 'react'

import { api, type ApiSong } from '../../lib/api'

import type { LanguageHook } from '../settings/useLanguage'

type Message = {
  readonly id: string
  readonly role: 'user' | 'dj'
  readonly text: string
}

type Props = {
  readonly open: boolean
  readonly onClose: () => void
  readonly onOpen: () => void
  readonly language: LanguageHook
  readonly onPlay: (song: ApiSong) => void
  readonly onNext: () => void
}

export function DjChat({ open, onClose, onOpen, language, onPlay, onNext }: Props) {
  return (
    <>
      <button
        type="button"
        className="dj-chat-trigger"
        onClick={open ? onClose : onOpen}
        aria-label={language.t('djTitle')}
        title={language.t('djTitle')}
      >
        {open ? '×' : '💬'}
      </button>
      {open ? <ChatPanel onClose={onClose} language={language} onPlay={onPlay} onNext={onNext} /> : null}
    </>
  )
}

type ChatPanelProps = {
  readonly onClose: () => void
  readonly language: LanguageHook
  readonly onPlay: (s: ApiSong) => void
  readonly onNext: () => void
}

function ChatPanel({ onClose, language, onPlay, onNext }: ChatPanelProps) {
  const { t } = language
  const [messages, setMessages] = useState<readonly Message[]>(() => [
    { id: 'welcome', role: 'dj', text: t('djWelcome') },
  ])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const send = async (): Promise<void> => {
    const text = input.trim()
    if (text.length === 0 || busy) return
    setBusy(true)
    setInput('')
    setMessages((m) => [...m, { id: rid(), role: 'user', text }])
    const result = await dispatch(text, { onPlay, onNext })
    setMessages((m) => [...m, { id: rid(), role: 'dj', text: result.reply }])
    setBusy(false)
  }

  return (
    <div className="dj-chat-panel" role="dialog" aria-label={t('djTitle')}>
      <ChatHeader title={t('djTitle')} closeLabel={t('settingsClose')} onClose={onClose} />
      <ChatList listRef={listRef} messages={messages} busy={busy} />
      <ChatForm
        inputRef={inputRef}
        placeholder={t('djInputPlaceholder')}
        sendLabel={t('djSend')}
        input={input}
        busy={busy}
        onChange={setInput}
        onSubmit={() => {
          void send()
        }}
      />
    </div>
  )
}

function ChatHeader({
  title,
  closeLabel,
  onClose,
}: {
  readonly title: string
  readonly closeLabel: string
  readonly onClose: () => void
}) {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-white/8">
      <h3 className="text-sm font-light tracking-widest text-white/85" style={{ fontFamily: 'serif' }}>
        {title}
      </h3>
      <button
        type="button"
        onClick={onClose}
        className="text-white/50 hover:text-white text-base"
        aria-label={closeLabel}
      >
        ×
      </button>
    </header>
  )
}

function ChatList({
  listRef,
  messages,
  busy,
}: {
  readonly listRef: React.RefObject<HTMLDivElement | null>
  readonly messages: readonly Message[]
  readonly busy: boolean
}) {
  return (
    <div ref={listRef} className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
      {messages.map((m) => (
        <div key={m.id} className={`dj-msg ${m.role === 'dj' ? 'dj-msg-dj' : 'dj-msg-user'}`}>
          {m.text}
        </div>
      ))}
      {busy ? <div className="dj-msg dj-msg-dj opacity-60">…</div> : null}
    </div>
  )
}

function ChatForm({
  inputRef,
  placeholder,
  sendLabel,
  input,
  busy,
  onChange,
  onSubmit,
}: {
  readonly inputRef: React.RefObject<HTMLInputElement | null>
  readonly placeholder: string
  readonly sendLabel: string
  readonly input: string
  readonly busy: boolean
  readonly onChange: (v: string) => void
  readonly onSubmit: () => void
}) {
  return (
    <form
      className="flex gap-2 p-3 border-t border-white/8"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
    >
      <input
        ref={inputRef}
        className="flex-1 bg-black/30 rounded-lg px-3 py-2 text-sm text-white outline-none border border-white/10 focus:border-white/30"
        placeholder={placeholder}
        value={input}
        onChange={(e) => {
          onChange(e.target.value)
        }}
        disabled={busy}
      />
      <button
        type="submit"
        disabled={busy || input.trim().length === 0}
        className="px-3 py-2 rounded-lg bg-white/15 hover:bg-white/25 text-white text-sm disabled:opacity-40"
      >
        {sendLabel}
      </button>
    </form>
  )
}

// ────────────────────────────────────────────────────────────────────────
// 意图分发 — 规则版 (v1)

type Dispatcher = {
  readonly onPlay: (s: ApiSong) => void
  readonly onNext: () => void
}

async function dispatch(text: string, d: Dispatcher): Promise<{ reply: string }> {
  // 1) 跳过类: 下一首 / 换一首 / 跳过
  if (/(下一首|换一首|跳过|next|skip)/i.test(text)) {
    d.onNext()
    return { reply: '好,换一首。' }
  }
  // 2) 提取查询关键词
  const query = extractQuery(text)
  if (query.length === 0) {
    return { reply: '没听清,告诉我歌名或歌手就行。' }
  }
  try {
    const res = await api.search(query, 1)
    const song = res.songs[0]
    if (song === undefined) {
      return { reply: `没找到「${query}」,换个说法?` }
    }
    d.onPlay(song)
    return { reply: `放了:${song.title} · ${song.artists.map((a) => a.name).join(' / ')}` }
  } catch {
    return { reply: '搜索失败,等等再试。' }
  }
}

function extractQuery(text: string): string {
  // 去掉指令性前缀 → 留歌名/歌手关键词
  return text
    .replace(/(放点|来点|放一首|来一首|听点|听首|想听|放|来|播放|换|帮我|please|play|listen to)/gi, ' ')
    .replace(/(的歌|的作品|吧|啊|呗|呀|好吗|可以吗)/g, ' ')
    .trim()
}

function rid(): string {
  return `${String(Date.now())}-${String(Math.random()).slice(2, 8)}`
}
