// useSearch · 搜索表单状态 + 提交逻辑
// 跟 player 主 state 隔离 (搜索失败不影响播放)

import { useCallback, useState } from 'react'

import { api, type ApiSong } from '../../lib/api'

import { describeError } from './types'

const DEFAULT_LIMIT = 20

export type SearchHook = {
  readonly query: string
  readonly setQuery: (q: string) => void
  readonly results: readonly ApiSong[]
  readonly searching: boolean
  readonly submit: (onError: (msg: string) => void) => Promise<void>
}

export function useSearch(): SearchHook {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<readonly ApiSong[]>([])
  const [searching, setSearching] = useState(false)

  const submit = useCallback(
    async (onError: (msg: string) => void) => {
      const q = query.trim()
      if (q.length === 0) return
      setSearching(true)
      try {
        const result = await api.search(q, DEFAULT_LIMIT)
        setResults(result.songs)
      } catch (err: unknown) {
        onError(`搜索失败: ${describeError(err)}`)
      } finally {
        setSearching(false)
      }
    },
    [query],
  )

  return { query, setQuery, results, searching, submit }
}
