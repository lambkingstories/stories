/**
 * The backdrops behind the paper of the coloring screen. The pictures were made with an image model (top-down views of a
 * table, a meadow and a beach); `plain` is the calm warm light the screen always had. To add one, put the picture and
 * its small `-t` thumbnail in `public/images/ausmalen-bg/` and list it here.
 */
import { prependBaseUrl } from '@/utils/function'

export type BackdropId = 'plain' | 'oak' | 'meadow' | 'sand'

export interface Backdrop {
  id: BackdropId
  /** The picture behind the paper; empty for the plain light. */
  image: string
  /** The small picture for the choice list; empty for the plain light. */
  thumb: string
}

const picture = (file: string): Pick<Backdrop, 'image' | 'thumb'> => ({
  image: prependBaseUrl(`images/ausmalen-bg/${file}.webp`),
  thumb: prependBaseUrl(`images/ausmalen-bg/${file}-t.webp`)
})

export const BACKDROPS: Backdrop[] = [
  { id: 'plain', image: '', thumb: '' },
  { id: 'oak', ...picture('eiche') },
  { id: 'meadow', ...picture('wiese') },
  { id: 'sand', ...picture('sand') }
]

export const BACKDROP_KEY = 'lk-coloring-backdrop'

/** The table is what a child sees first. */
export const DEFAULT_BACKDROP: BackdropId = 'oak'

/** The colours the plain light can have: the warm light it always had, and a few calm colours. */
export interface PlainColor {
  id: string
  /** A CSS background (a gradient, or a flat colour as a gradient). */
  css: string
}

const flat = (hex: string) => `linear-gradient(${hex}, ${hex})`

export const PLAIN_COLORS: PlainColor[] = [
  { id: 'warm', css: 'radial-gradient(ellipse at 50% 30%, #fff2d9 0%, #fbdcae 55%, #f3c58b 100%)' },
  { id: 'white', css: flat('#f4f2ee') },
  { id: 'sky', css: flat('#cfe3f2') },
  { id: 'mint', css: flat('#d3ebdc') },
  { id: 'rose', css: flat('#f4d9df') },
  { id: 'lilac', css: flat('#e1d8f0') },
  { id: 'sand', css: flat('#eadfc9') },
  { id: 'slate', css: flat('#3a404a') }
]

export const PLAIN_KEY = 'lk-coloring-plain'

export function isPlainColorId(v: unknown): v is string {
  return typeof v === 'string' && PLAIN_COLORS.some((c) => c.id === v)
}

export function isBackdropId(v: unknown): v is BackdropId {
  return typeof v === 'string' && BACKDROPS.some((b) => b.id === v)
}
