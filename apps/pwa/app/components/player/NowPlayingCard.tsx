'use client'

import type { ApiSong } from '../../lib/api'
import type { LrcLine } from '../../lib/lrc'

type Props = {
  readonly song: ApiSong | undefined
  readonly lrcLines: readonly LrcLine[]
  readonly lrcLoading: boolean
  readonly activeLrcIndex: number
}

export function NowPlayingCard(props: Props) {
  return (
    <section className="rounded-lg bg-bg-secondary p-6">
      {props.song !== undefined ? (
        <div className="space-y-4">
          <SongHeader song={props.song} />
          <LyricsPane
            loading={props.lrcLoading}
            lines={props.lrcLines}
            activeIndex={props.activeLrcIndex}
          />
        </div>
      ) : (
        <div className="text-text-muted text-center py-12">搜索一首歌开始播放</div>
      )}
    </section>
  )
}

function SongHeader({ song }: { readonly song: ApiSong }) {
  return (
    <div className="flex items-center gap-4">
      {song.coverUrl !== undefined ? (
        <img src={song.coverUrl} alt="" className="w-24 h-24 rounded object-cover" />
      ) : (
        <div className="w-24 h-24 rounded bg-bg-primary" />
      )}
      <div className="flex-1 min-w-0">
        <div className="text-lg font-semibold truncate">{song.title}</div>
        <div className="text-sm text-text-secondary truncate">
          {song.artists.map((a) => a.name).join(' · ')}
        </div>
        <div className="text-xs text-text-muted truncate">{song.album?.name ?? ''}</div>
      </div>
    </div>
  )
}

function LyricsPane(props: {
  readonly loading: boolean
  readonly lines: readonly LrcLine[]
  readonly activeIndex: number
}) {
  return (
    <div className="max-h-48 overflow-y-auto rounded bg-bg-primary p-4 text-sm leading-relaxed">
      {props.loading ? (
        <div className="text-text-muted">加载歌词中…</div>
      ) : props.lines.length === 0 ? (
        <div className="text-text-muted">无歌词</div>
      ) : (
        props.lines.map((line, i) => (
          <div
            key={i}
            className={i === props.activeIndex ? 'text-accent font-medium' : 'text-text-muted'}
          >
            {line.text}
          </div>
        ))
      )}
    </div>
  )
}
