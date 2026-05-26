/* eslint-disable @typescript-eslint/require-await -- Fastify plugin signature is async */
// DJ API · 用大脑润色一句串场,再丢 TTS 合成,返回 audio_url
// 这是 M2 端到端验证用的最小路径

import { TTS_EMOTIONS } from '@claudio/application'
import { z } from 'zod'

import type { Container } from '../composition.js'
import type { TtsEmotion } from '@claudio/application'
import type { FastifyPluginAsync } from 'fastify'

const sayBody = z.object({
  text: z.string().min(1).max(500),
  emotion: z.enum(TTS_EMOTIONS).default('中立'),
  polish: z.boolean().default(false), // true = 让 brain 先润色,false = 直接 TTS
})

const polishSchema = z.object({
  text: z.string().min(1).max(500),
  emotion: z.enum(TTS_EMOTIONS),
})

const POLISH_SYSTEM = `你是流萤声线的电台 DJ。把用户给的串场文字润色成 1-2 句、口语化、不超过 60 字的中文播报,
并选择一个最合适的情绪 (中立/开心/难过/生气/恐惧)。直接返回 JSON,不要任何额外解释。`

export function createDjPlugin(container: Container): FastifyPluginAsync {
  return async (app) => {
    app.post('/api/dj/say', async (req) => {
      const body = sayBody.parse(req.body)
      const finalPayload = body.polish
        ? await polish(container, body.text)
        : { text: body.text, emotion: body.emotion }

      const tts = await container.tts.synthesize({
        text: finalPayload.text,
        emotion: finalPayload.emotion,
      })

      return {
        text: finalPayload.text,
        emotion: finalPayload.emotion,
        audioUrl: tts.audioUrl,
        polished: body.polish,
      }
    })
  }
}

async function polish(
  container: Container,
  raw: string,
): Promise<{ text: string; emotion: TtsEmotion }> {
  const polished = await container.brain.generateJson(
    [
      { role: 'system', content: POLISH_SYSTEM },
      { role: 'user', content: raw },
    ],
    polishSchema,
  )
  return polished
}
