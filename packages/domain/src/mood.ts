// 心情 · 用户显式切换 + DJ 推断
// 注意：mood 是离散枚举，能量是连续值，分开管

export const MOODS = ['calm', 'happy', 'sad', 'energetic', 'focused', 'melancholic'] as const

export type Mood = (typeof MOODS)[number]

export type EnergyLevel = number // 0-10

export type MoodContext = {
  readonly mood: Mood
  readonly energy: EnergyLevel
  readonly setAtMs: number
  readonly setBy: 'user' | 'system'
}
