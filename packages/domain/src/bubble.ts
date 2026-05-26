// 串场 / 气泡 · DJ 在歌曲间说的话

import type { BubbleId } from './ids.js'

export type BubbleKind = 'say' | 'segue' | 'reaction' | 'greeting'

export type Bubble = {
  readonly id: BubbleId
  readonly kind: BubbleKind
  readonly text: string
  readonly audioUrl?: string // GPT-SoVITS 合成的 wav URL；未合成则为空
  readonly createdAtMs: number
}
