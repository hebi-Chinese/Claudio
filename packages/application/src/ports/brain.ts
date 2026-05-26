// LLM 大脑接口 · 多实现 claude/deepseek/ollama/openai-compat（在 infrastructure）

import type { z } from 'zod'

export type BrainMessage = {
  readonly role: 'system' | 'user' | 'assistant'
  readonly content: string
}

export type BrainGenerateOptions = {
  readonly signal?: AbortSignal
  readonly maxTokens?: number
  readonly temperature?: number
}

export type IBrain = {
  /** 流式生成（用于串场对话，逐 token 吐出） */
  stream(messages: readonly BrainMessage[], options?: BrainGenerateOptions): AsyncIterable<string>

  /** JSON 模式（用于结构化输出：选歌 / 生成 plan） */
  generateJson<T>(
    messages: readonly BrainMessage[],
    schema: z.ZodSchema<T>,
    options?: BrainGenerateOptions,
  ): Promise<T>
}
