// DB 入口 · 导出 client + repos 工厂

export * from './client.js'
export * from './schema.js'

export { createSongRepo } from './repos/song-repo.js'
export { createPlaysRepo } from './repos/plays-repo.js'
export { createBubblesRepo } from './repos/bubbles-repo.js'
export { createPlanRepo } from './repos/plan-repo.js'
export { createPrefsRepo } from './repos/prefs-repo.js'
export {
  createNcmSnapshotRepo,
  type INcmSnapshotRepo,
} from './repos/ncm-snapshot-repo.js'
export {
  createNcmAccountRepo,
  type INcmAccountRepo,
} from './repos/account-repo.js'
export {
  createConversationsRepo,
  type IConversationsRepo,
  type ConversationEntry,
} from './repos/conversations-repo.js'
export {
  createTasteRepo,
  type ITasteRepo,
  type TasteSnapshotEntry,
} from './repos/taste-repo.js'
