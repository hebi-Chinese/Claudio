// 设计 token · CSS 变量定义（主题中性，不绑死颜色）
// 实际颜色值由各 theme 覆盖

export const TOKEN_NAMES = {
  // surface
  bgPrimary: '--bg-primary',
  bgSecondary: '--bg-secondary',
  // text
  textPrimary: '--text-primary',
  textSecondary: '--text-secondary',
  textMuted: '--text-muted',
  // accent
  accent: '--accent',
  accentMuted: '--accent-muted',
  // semantic
  success: '--success',
  warning: '--warning',
  danger: '--danger',
  // spacing
  spaceXs: '--space-xs',
  spaceSm: '--space-sm',
  spaceMd: '--space-md',
  spaceLg: '--space-lg',
  spaceXl: '--space-xl',
  // type scale
  textXs: '--text-xs',
  textSm: '--text-sm',
  textBase: '--text-base',
  textLg: '--text-lg',
  textXl: '--text-xl',
  textHero: '--text-hero',
  // motion
  durationFast: '--duration-fast',
  durationNormal: '--duration-normal',
  easeOut: '--ease-out',
} as const

export type TokenName = (typeof TOKEN_NAMES)[keyof typeof TOKEN_NAMES]
