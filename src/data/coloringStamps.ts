/**
 * The stamps of the painting app: flat shapes that a child presses on the picture in any colour, large or
 * small, also with glitter. The shapes are pictures made with an image model: black silhouettes with the details cut out (a folder
 * `stamps`, from the order "BILDAUFTRAG-stempel"); the app colours them itself.
 */
import { prependBaseUrl } from '@/utils/function'

/** The shapes (ten from the first sheet, fifteen from the second), in the order of their pictures (`01.webp` …). The names are the keys of `app.coloring.stampName_*`. */
export const STAMP_IDS = [
  'star', 'heart', 'lamb', 'fish', 'dove', 'crown', 'sun', 'flower', 'rainbow', 'ark',
  'cross', 'bible', 'candle', 'bread', 'grapes', 'crook', 'palm', 'mountain', 'cloud', 'butterfly', 'tree', 'house', 'harp', 'ladybug', 'camel'
] as const
export type StampId = (typeof STAMP_IDS)[number]

export const stampUrl = (index: number): string => prependBaseUrl(`images/ausmalen/stamps/${String(index + 1).padStart(2, '0')}.webp`)

/** The colours of the stamps: twelve bright ones. */
export const STAMP_COLORS = [
  '#E53935',
  '#FB8C00',
  '#FDD835',
  '#7CB342',
  '#2E9E4F',
  '#00ACC1',
  '#1E6FD9',
  '#3949AB',
  '#8E44C4',
  '#EC5A9B',
  '#8D5A3B',
  '#2B2B2B'
] as const

export interface StampSettings {
  /** Which of the ten shapes (0–9). */
  shape: number
  /** How large, 1–100. */
  size: number
  color: string
  glitter: boolean
}

export const DEFAULT_STAMP: StampSettings = { shape: 0, size: 50, color: STAMP_COLORS[0], glitter: false }

/** Reads settings from what was stored; anything that is not right falls back to the default. */
export function cleanStamp(raw: unknown): StampSettings {
  const v = (raw && typeof raw === 'object' ? raw : {}) as Partial<Record<keyof StampSettings, unknown>>
  const shape = typeof v.shape === 'number' && v.shape >= 0 && v.shape < STAMP_IDS.length ? Math.floor(v.shape) : DEFAULT_STAMP.shape
  const size = typeof v.size === 'number' ? Math.max(1, Math.min(100, Math.round(v.size))) : DEFAULT_STAMP.size
  const color = typeof v.color === 'string' && /^#[0-9a-f]{6}$/i.test(v.color) ? v.color.toUpperCase() : DEFAULT_STAMP.color
  return { shape, size, color, glitter: v.glitter === true }
}
