// 解析 claude --output-format stream-json 的 NDJSON 流
// 只吐 text_delta(可见文本),thinking_delta/signature_delta 全部忽略

import { z } from 'zod'

const textDeltaEvent = z.object({
  type: z.literal('stream_event'),
  event: z.object({
    type: z.literal('content_block_delta'),
    delta: z.object({
      type: z.literal('text_delta'),
      text: z.string(),
    }),
  }),
})

const resultEvent = z.object({
  type: z.literal('result'),
  subtype: z.string(),
  // eslint-disable-next-line @typescript-eslint/naming-convention -- claude CLI 输出字段
  is_error: z.boolean(),
  result: z.string().optional(),
})

export type StreamLineParseResult =
  | { readonly kind: 'text'; readonly text: string }
  | { readonly kind: 'result'; readonly isError: boolean; readonly result: string }
  | { readonly kind: 'other' }

export function parseStreamLine(line: string): StreamLineParseResult {
  const trimmed = line.trim()
  if (trimmed.length === 0) return { kind: 'other' }

  let json: unknown
  try {
    json = JSON.parse(trimmed)
  } catch {
    return { kind: 'other' }
  }

  const text = textDeltaEvent.safeParse(json)
  if (text.success) {
    return { kind: 'text', text: text.data.event.delta.text }
  }

  const res = resultEvent.safeParse(json)
  if (res.success) {
    return {
      kind: 'result',
      isError: res.data.is_error,
      result: res.data.result ?? '',
    }
  }

  return { kind: 'other' }
}
