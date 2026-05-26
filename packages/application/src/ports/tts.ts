// TTS 接口 · 实现：infrastructure/tts/（GPT-SoVITS :8000 客户端）

// 元组在前,类型从元组推导 — 让 zod.enum / array.includes 这些运行时校验和类型保持单一真相源
export const TTS_EMOTIONS = ['中立', '开心', '难过', '生气', '恐惧'] as const
export type TtsEmotion = (typeof TTS_EMOTIONS)[number]

export type TtsSynthesizeRequest = {
  readonly text: string
  readonly emotion: TtsEmotion
}

export type TtsSynthesizeResult = {
  readonly audioUrl: string
}

export type ITtsClient = {
  synthesize(req: TtsSynthesizeRequest): Promise<TtsSynthesizeResult>
}
