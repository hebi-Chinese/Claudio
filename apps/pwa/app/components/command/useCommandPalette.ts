'use client'

// useCommandPalette · 全局快捷键 (Cmd/Ctrl+K) + 开关状态

import { useCallback, useEffect, useState } from 'react'

export type CommandPaletteHook = {
  readonly open: boolean
  readonly setOpen: (v: boolean) => void
  readonly toggle: () => void
}

export function useCommandPalette(): CommandPaletteHook {
  const [open, setOpen] = useState(false)
  const toggle = useCallback(() => {
    setOpen((v) => !v)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'
      if (isCmdK) {
        e.preventDefault()
        toggle()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
    }
  }, [toggle])

  return { open, setOpen, toggle }
}
