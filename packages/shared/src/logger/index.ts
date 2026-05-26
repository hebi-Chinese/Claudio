// Pino 日志封装 · 结构化输出 + redact 敏感字段
// 用法：import { createLogger } from '@claudio/shared/logger'

import { pino, type Logger, type LoggerOptions } from 'pino'

const REDACT_PATHS = [
  'cookie',
  'password',
  'token',
  'authorization',
  '*.cookie',
  '*.password',
  '*.token',
  '*.authorization',
]

type CreateLoggerOptions = {
  name: string
  level?: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace'
  pretty?: boolean
}

export function createLogger(options: CreateLoggerOptions): Logger {
  const config: LoggerOptions = {
    name: options.name,
    level: options.level ?? 'info',
    redact: { paths: REDACT_PATHS, censor: '[redacted]' },
  }
  if (options.pretty) {
    config.transport = {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'HH:MM:ss.l', ignore: 'pid,hostname' },
    }
  }
  return pino(config)
}

export type { Logger } from 'pino'
