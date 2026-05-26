'use client'

import { ControlsBar } from './ControlsBar'
import { NowPlayingCard } from './NowPlayingCard'
import { QueuePanel } from './QueuePanel'
import { SearchPanel } from './SearchPanel'
import { usePlayerLogic } from './usePlayerLogic'
import { useSearch } from './useSearch'

export function Player() {
  const logic = usePlayerLogic()
  const search = useSearch()

  const onSearchSubmit = (): void => {
    void search.submit(logic.actions.setError)
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <audio
        ref={logic.audioRef}
        onTimeUpdate={logic.actions.onTimeUpdate}
        onLoadedMetadata={logic.actions.onTimeUpdate}
        onPlay={logic.actions.onPlay}
        onPause={logic.actions.onPause}
        onEnded={logic.actions.handleEnded}
        preload="metadata"
      />

      <div className="max-w-6xl mx-auto px-6 py-8">
        <PageHeader />
        {logic.state.error !== undefined ? <ErrorBanner message={logic.state.error} /> : null}
        <MainGrid logic={logic} search={search} onSearchSubmit={onSearchSubmit} />
        <BottomControls logic={logic} />
      </div>
    </div>
  )
}

function PageHeader() {
  return (
    <header className="mb-8">
      <h1 className="text-3xl font-bold tracking-tight">Claudio</h1>
      <p className="text-text-muted text-sm mt-1">个人 AI 电台 · M0 + 播放器</p>
    </header>
  )
}

function ErrorBanner({ message }: { readonly message: string }) {
  return <div className="mb-4 p-3 rounded bg-red-900/30 text-red-200 text-sm">{message}</div>
}

function MainGrid(props: {
  readonly logic: ReturnType<typeof usePlayerLogic>
  readonly search: ReturnType<typeof useSearch>
  readonly onSearchSubmit: () => void
}) {
  const { logic, search, onSearchSubmit } = props
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
      <main className="space-y-6">
        <SearchPanel
          query={search.query}
          onQueryChange={search.setQuery}
          onSubmit={onSearchSubmit}
          searching={search.searching}
          results={search.results}
          onPlay={logic.actions.playSong}
          onEnqueue={logic.actions.queueSong}
        />
        <NowPlayingCard
          song={logic.currentSong}
          lrcLines={logic.state.lrcLines}
          lrcLoading={logic.state.lrcLoading}
          activeLrcIndex={logic.activeLrcIndex}
        />
      </main>
      <QueuePanel
        queue={logic.state.queue}
        currentIndex={logic.state.currentIndex}
        onRemove={logic.actions.removeFromQueue}
      />
    </div>
  )
}

function BottomControls({ logic }: { readonly logic: ReturnType<typeof usePlayerLogic> }) {
  return (
    <ControlsBar
      playing={logic.state.playing}
      hasSong={logic.currentSong !== undefined}
      queueEmpty={logic.state.queue.length === 0}
      currentTimeSec={logic.state.currentTimeSec}
      durationSec={logic.state.durationSec}
      volume={logic.state.volume}
      muted={logic.state.muted}
      mode={logic.state.mode}
      onPrev={logic.actions.handlePrev}
      onNext={logic.actions.handleNext}
      onTogglePlay={logic.actions.togglePlay}
      onSeek={logic.actions.onSeek}
      onVolumeChange={logic.actions.setVolume}
      onToggleMute={logic.actions.toggleMute}
      onCycleMode={logic.actions.cycleMode}
    />
  )
}
