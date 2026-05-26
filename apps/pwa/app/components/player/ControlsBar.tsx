'use client'

import { formatTime, MODE_LABEL, type PlayMode } from './types'

type Props = {
  readonly playing: boolean
  readonly hasSong: boolean
  readonly queueEmpty: boolean
  readonly currentTimeSec: number
  readonly durationSec: number
  readonly volume: number
  readonly muted: boolean
  readonly mode: PlayMode
  readonly onPrev: () => void
  readonly onNext: () => void
  readonly onTogglePlay: () => void
  readonly onSeek: (sec: number) => void
  readonly onVolumeChange: (v: number) => void
  readonly onToggleMute: () => void
  readonly onCycleMode: () => void
}

export function ControlsBar(props: Props) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-bg-secondary border-t border-bg-primary px-6 py-3">
      <div className="max-w-6xl mx-auto flex items-center gap-4">
        <TransportButtons
          onPrev={props.onPrev}
          onNext={props.onNext}
          onTogglePlay={props.onTogglePlay}
          playing={props.playing}
          hasSong={props.hasSong}
          queueEmpty={props.queueEmpty}
        />
        <SeekSlider
          currentTimeSec={props.currentTimeSec}
          durationSec={props.durationSec}
          disabled={!props.hasSong}
          onSeek={props.onSeek}
        />
        <button
          type="button"
          onClick={props.onCycleMode}
          className="text-xs text-text-secondary hover:text-accent"
        >
          {MODE_LABEL[props.mode]}
        </button>
        <VolumeControl
          volume={props.volume}
          muted={props.muted}
          onChange={props.onVolumeChange}
          onToggleMute={props.onToggleMute}
        />
      </div>
    </div>
  )
}

function TransportButtons(props: {
  readonly onPrev: () => void
  readonly onNext: () => void
  readonly onTogglePlay: () => void
  readonly playing: boolean
  readonly hasSong: boolean
  readonly queueEmpty: boolean
}) {
  return (
    <>
      <button
        type="button"
        onClick={props.onPrev}
        disabled={props.queueEmpty}
        className="text-xl text-text-primary disabled:opacity-30 hover:text-accent"
        aria-label="上一首"
      >
        ⏮
      </button>
      <button
        type="button"
        onClick={props.onTogglePlay}
        disabled={!props.hasSong}
        className="text-2xl text-text-primary disabled:opacity-30 hover:text-accent"
        aria-label={props.playing ? '暂停' : '播放'}
      >
        {props.playing ? '⏸' : '▶'}
      </button>
      <button
        type="button"
        onClick={props.onNext}
        disabled={props.queueEmpty}
        className="text-xl text-text-primary disabled:opacity-30 hover:text-accent"
        aria-label="下一首"
      >
        ⏭
      </button>
    </>
  )
}

function SeekSlider(props: {
  readonly currentTimeSec: number
  readonly durationSec: number
  readonly disabled: boolean
  readonly onSeek: (sec: number) => void
}) {
  return (
    <div className="flex-1 flex items-center gap-2">
      <span className="text-xs text-text-muted w-12 text-right">
        {formatTime(props.currentTimeSec)}
      </span>
      <input
        type="range"
        aria-label="播放进度"
        min={0}
        max={props.durationSec > 0 ? props.durationSec : 0}
        step={0.1}
        value={props.currentTimeSec}
        onChange={(e) => {
          props.onSeek(Number(e.target.value))
        }}
        disabled={props.disabled}
        className="flex-1 accent-accent"
      />
      <span className="text-xs text-text-muted w-12">{formatTime(props.durationSec)}</span>
    </div>
  )
}

function VolumeControl(props: {
  readonly volume: number
  readonly muted: boolean
  readonly onChange: (v: number) => void
  readonly onToggleMute: () => void
}) {
  return (
    <div className="flex items-center gap-2 w-32">
      <button
        type="button"
        onClick={props.onToggleMute}
        className="text-text-secondary hover:text-accent"
      >
        {props.muted ? '🔇' : '🔊'}
      </button>
      <input
        type="range"
        aria-label="音量"
        min={0}
        max={1}
        step={0.01}
        value={props.muted ? 0 : props.volume}
        onChange={(e) => {
          props.onChange(Number(e.target.value))
        }}
        className="flex-1 accent-accent"
      />
    </div>
  )
}
