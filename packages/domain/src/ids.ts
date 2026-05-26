// Branded ID 类型 · 防止 UserId / SongId 之类的串台
// 用法：const id: SongId = toSongId('s-123')

type Brand<T, B extends string> = T & { readonly __brand: B }

export type SongId = Brand<string, 'SongId'>
export type PlanId = Brand<string, 'PlanId'>
export type BubbleId = Brand<string, 'BubbleId'>
export type UserId = Brand<string, 'UserId'>
export type ArtistId = Brand<string, 'ArtistId'>
export type AlbumId = Brand<string, 'AlbumId'>
export type PlaylistId = Brand<string, 'PlaylistId'>

// 构造函数（边界处用）
export const toSongId = (raw: string): SongId => raw as SongId
export const toPlanId = (raw: string): PlanId => raw as PlanId
export const toBubbleId = (raw: string): BubbleId => raw as BubbleId
export const toUserId = (raw: string): UserId => raw as UserId
export const toArtistId = (raw: string): ArtistId => raw as ArtistId
export const toAlbumId = (raw: string): AlbumId => raw as AlbumId
export const toPlaylistId = (raw: string): PlaylistId => raw as PlaylistId
