// Brain 工厂 · 根据 BRAIN_TYPE env 选实现
// 加新 brain：新建子目录 + 实现 IBrain + 在这里注册

import { ClaudeCodeBrain } from './claude/index.js'

import type { IBrain } from '@claudio/application'

export type BrainType = 'claude' | 'deepseek' | 'ollama' | 'openai-compat' | 'custom'

export function createBrain(type: BrainType): IBrain {
  switch (type) {
    case 'claude':
      return new ClaudeCodeBrain()
    case 'deepseek':
    case 'ollama':
    case 'openai-compat':
    case 'custom':
      throw new Error(`brain type "${type}" not implemented yet (planned for v1.5+)`)
    default: {
      const _exhaustive: never = type
      throw new Error(`unknown brain type: ${_exhaustive as string}`)
    }
  }
}

export { ClaudeCodeBrain } from './claude/index.js'
