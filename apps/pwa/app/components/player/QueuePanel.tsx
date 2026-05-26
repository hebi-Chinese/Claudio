'use client'

import type { ApiSong } from '../../lib/api'

type Props = {
  readonly queue: readonly ApiSong[]
  readonly currentIndex: number
  readonly onRemove: (id: string) => void
}

export function QueuePanel(props: Props) {
  return (
    <aside className="space-y-4">
      <div className="rounded-lg bg-bg-secondary p-4">
        <div className="text-sm font-semibold mb-2">播放队列（{props.queue.length}）</div>
        {props.queue.length === 0 ? (
          <div className="text-text-muted text-xs">空</div>
        ) : (
          <ul className="space-y-1 max-h-96 overflow-y-auto">
            {props.queue.map((song, idx) => (
              <QueueRow
                key={song.id}
                song={song}
                index={idx}
                isCurrent={idx === props.currentIndex}
                onRemove={props.onRemove}
              />
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}

function QueueRow(props: {
  readonly song: ApiSong
  readonly index: number
  readonly isCurrent: boolean
  readonly onRemove: (id: string) => void
}) {
  return (
    <li
      className={`flex items-center gap-2 px-2 py-1 rounded text-sm group ${
        props.isCurrent ? 'bg-accent/20 text-accent' : 'hover:bg-bg-primary'
      }`}
    >
      <span className="text-xs text-text-muted w-6">{props.index + 1}</span>
      <div className="flex-1 min-w-0">
        <div className="truncate">{props.song.title}</div>
        <div className="text-xs text-text-muted truncate">
          {props.song.artists.map((a) => a.name).join(', ')}
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          props.onRemove(props.song.id)
        }}
        className="opacity-0 group-hover:opacity-100 text-xs text-text-muted hover:text-danger"
      >
        ✕
      </button>
    </li>
  )
}
