/* eslint-disable @typescript-eslint/require-await -- Fastify plugin signature is async */
// Snapshot API: 看快照状态 / 拉新快照
import type { Container } from '../composition.js'
import type { FastifyPluginAsync } from 'fastify'


export function createSnapshotPlugin(container: Container): FastifyPluginAsync {
  return async (app) => {
    app.get('/api/snapshot/status', async () => {
      return await container.snapshot.status()
    })

    app.get('/api/snapshot/current', async (_req, reply) => {
      const snap = await container.snapshot.load()
      if (snap === null) {
        return reply.code(404).send({ error: 'no snapshot yet' })
      }
      return snap
    })

    app.post('/api/snapshot/refresh', async (_req, reply) => {
      if (container.ncm.getCookie() === undefined) {
        return reply.code(401).send({ error: 'not logged in' })
      }
      const snap = await container.ncm.fetchUserSnapshot()
      await container.snapshot.save(snap)
      return {
        ok: true,
        snapshotAtMs: snap.snapshotAtMs,
        userId: snap.userId,
        likedCount: snap.likedSongIds.length,
        playlistCount: snap.playlists.length,
      }
    })
  }
}
