/* eslint-disable @typescript-eslint/require-await -- Fastify plugin signature is async */
// 发现 API: 每日推荐 / 私人 FM / 心动 / 排行
import { toSongId } from '@claudio/domain'
import { z } from 'zod'


import type { Container } from '../composition.js'
import type { FastifyPluginAsync } from 'fastify'


const idParams = z.object({ id: z.string().min(1) })

export function createDiscoverPlugin(container: Container): FastifyPluginAsync {
  return async (app) => {
    app.get('/api/recommend/daily', async () => {
      return { songs: await container.ncm.dailyRecommendations() }
    })

    app.get('/api/fm/next', async () => {
      return { songs: await container.ncm.privateFm() }
    })

    app.get('/api/heart-mode/:id', async (req) => {
      const { id } = idParams.parse(req.params)
      return { songs: await container.ncm.heartMode(toSongId(id)) }
    })

    app.get('/api/toplist/:id', async (req) => {
      const { id } = idParams.parse(req.params)
      return { songs: await container.ncm.toplist(id) }
    })
  }
}
