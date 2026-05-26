'use client'

import type { ApiSong } from '../../lib/api'

type Props = {
  readonly query: string
  readonly onQueryChange: (q: string) => void
  readonly onSubmit: () => void
  readonly searching: boolean
  readonly results: readonly ApiSong[]
  readonly onPlay: (song: ApiSong) => void
  readonly onEnqueue: (song: ApiSong) => void
}

export function SearchPanel(props: Props) {
  return (
    <section>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          props.onSubmit()
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={props.query}
          onChange={(e) => {
            props.onQueryChange(e.target.value)
          }}
          placeholder="搜歌名 / 歌手"
          className="flex-1 px-4 py-2 rounded bg-bg-secondary text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-accent"
        />
        <button
          type="submit"
          disabled={props.searching}
          className="px-4 py-2 rounded bg-accent text-bg-primary font-medium disabled:opacity-50"
        >
          {props.searching ? '搜索中…' : '搜索'}
        </button>
      </form>

      {props.results.length > 0 ? (
        <ul className="mt-4 space-y-1">
          {props.results.map((song) => (
            <SearchResultRow
              key={song.id}
              song={song}
              onPlay={props.onPlay}
              onEnqueue={props.onEnqueue}
            />
          ))}
        </ul>
      ) : null}
    </section>
  )
}

function SearchResultRow(props: {
  readonly song: ApiSong
  readonly onPlay: (song: ApiSong) => void
  readonly onEnqueue: (song: ApiSong) => void
}) {
  const { song } = props
  return (
    <li className="flex items-center gap-3 px-3 py-2 rounded hover:bg-bg-secondary group">
      {song.coverUrl !== undefined ? (
        <img src={song.coverUrl} alt="" className="w-10 h-10 rounded object-cover" />
      ) : (
        <div className="w-10 h-10 rounded bg-bg-secondary" />
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{song.title}</div>
        <div className="text-xs text-text-muted truncate">
          {song.artists.map((a) => a.name).join(' · ')}
          {song.album !== undefined ? ` — ${song.album.name}` : ''}
        </div>
      </div>
      <div className="opacity-0 group-hover:opacity-100 flex gap-2">
        <button
          type="button"
          onClick={() => {
            props.onPlay(song)
          }}
          className="text-xs px-2 py-1 rounded bg-accent text-bg-primary"
        >
          播放
        </button>
        <button
          type="button"
          onClick={() => {
            props.onEnqueue(song)
          }}
          className="text-xs px-2 py-1 rounded bg-bg-secondary"
        >
          加入队列
        </button>
      </div>
    </li>
  )
}
