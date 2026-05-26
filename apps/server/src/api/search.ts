/* eslint-disable @typescript-eslint/require-await -- Fastify plugin signature is async */
// 搜索 API
import { z } from 'zod'

import type { Container } from '../composition.js'
import type { FastifyPluginAsync } from 'fastify'


const querySchema = z.object({
  q: z.string().min(1).max(200),
  limit: z.coerce.number().int().min(1).max(100).optional(),
})

export function createSearchPlugin(container: Container): FastifyPluginAsync {
  return async (app) => {
    app.get('/api/search', async (req) => {
      const params = querySchema.parse(req.query)
      const result = await container.ncm.search(
        params.q,
        params.limit !== undefined ? { limit: params.limit } : undefined,
      )
      return result
    })
  }
}
