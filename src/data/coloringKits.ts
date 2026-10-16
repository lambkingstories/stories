/**
 * The boxes of the coloring app and the artwork they are made of. All pictures
 * (pencils, markers, brushes, chalk, tool and button icons) were made with GPT Image 2 and cut into single sprites with transparent
 * backgrounds; the list of sprites and the paint colour each one stands for is
 * generated in `coloringSprites.ts`. To change a picture, make a new sheet and
 * run `slice_sheets.mjs` (see the design folder), do not draw it in code.
 */
import { SPRITES } from '@/data/coloringSprites'
import { prependBaseUrl } from '@/utils/function'

export type KitVariant = 'pencil' | 'marker' | 'chalk' | 'brushW' | 'brushO' | 'bucket'

export interface KitItem {
  /** The sprite picture. */
  src: string
  /** The paint colour this item stands for (hex). */
  color: string
}

const url = (folder: string, file: string) => prependBaseUrl(`images/ausmalen/${folder}/${file}`)

/** All sprites of a folder as items; the last one is the rainbow item when the folder has one. */
function itemsOf(folder: string): KitItem[] {
  const set = SPRITES[folder]
  if (!set) return []
  const list = set.rainbow ? set.items.slice(0, -1) : set.items
  // a sprite whose paint colour could not be read (the slicer writes pure black for it) is not offered
  return list.filter((s) => s.color !== '#000000').map((s) => ({ src: url(folder, s.file), color: s.color }))
}

function rainbowOf(folder: string): KitItem | null {
  const set = SPRITES[folder]
  if (!set?.rainbow) return null
  const last = set.items[set.items.length - 1]!
  return { src: url(folder, last.file), color: '#FFFFFF' }
}

const pencils = itemsOf('pencil')
const pencilsLight = itemsOf('pencil-extra-hell')
const pencilsDark = itemsOf('pencil-extra-dunkel')

/** Pencil box: 12 free pencils, 24 more in the "big box". */
export const PENCIL_BASE: KitItem[] = pencils
export const PENCIL_EXTRA: KitItem[] = [...pencilsLight, ...pencilsDark]

/** Graphite pencils: the two darkest pencils of the sheets, with their own grey (the beige one paints grey, so it stays with the coloured pencils). */
const GRAPHITE: KitItem[] = [
  { src: pencils[pencils.length - 1]?.src ?? '', color: '#2E2E2E' },
  { src: pencilsDark[pencilsDark.length - 1]?.src ?? '', color: '#5A5F5F' }
]

export interface KitArtwork {
  variant: KitVariant
  base: KitItem[]
  extra: KitItem[]
  /** The rainbow item that opens the free colour picker. */
  rainbow: KitItem | null
}

export const KIT_ARTWORK: Record<'pencil' | 'marker' | 'watercolor' | 'oil' | 'graphite' | 'chalk' | 'bucket', KitArtwork> = {
  pencil: { variant: 'pencil', base: PENCIL_BASE, extra: PENCIL_EXTRA, rainbow: rainbowOf('pencil-extra-hell') },
  marker: { variant: 'marker', base: itemsOf('marker'), extra: itemsOf('marker-2'), rainbow: rainbowOf('marker') },
  watercolor: { variant: 'brushW', base: itemsOf('brush-water'), extra: itemsOf('brush-water-2'), rainbow: rainbowOf('brush-water') },
  oil: { variant: 'brushO', base: itemsOf('brush-oil'), extra: itemsOf('brush-oil-2'), rainbow: rainbowOf('brush-oil') },
  graphite: { variant: 'pencil', base: GRAPHITE, extra: [], rainbow: null },
  chalk: { variant: 'chalk', base: itemsOf('chalk'), extra: [], rainbow: rainbowOf('chalk') },
  // the paint buckets of the bucket tool (the striped last one opens the free colour picker)
  bucket: { variant: 'bucket', base: itemsOf('bucket'), extra: [], rainbow: rainbowOf('bucket') }
}

/** Thin line icons (made with GPT Image 2, cut into single files) for the controls. */
const line = (sheet: 'line-a' | 'line-b' | 'line-c' | 'line-d', n: number) => url(sheet, `${String(n).padStart(2, '0')}.webp`)

/** The coloured box of pencils on the colour box button. */
export const ICON_COLORS = url('icon-colors', '01.webp')

/** Pictures of the tools that are not a box of pencils: eraser pen, paint bucket, pipette (tip up). */
export const TOOL_SPRITES = {
  eraser: url('tool-eraser', '01.webp'),
  fill: url('tool-extra', '02.webp'),
  pipette: url('tool-extra', '03.webp')
}

export const LINE_ICONS = {
  undo: line('line-a', 1),
  redo: line('line-a', 2),
  more: line('line-a', 3),
  save: line('line-a', 4),
  share: line('line-a', 5),
  trash: line('line-a', 6),
  fullscreen: line('line-a', 7),
  frames: line('line-a', 8),
  eraser: line('line-b', 1),
  bucket: line('line-b', 2),
  pipette: line('line-b', 3),
  close: line('line-b', 4),
  check: line('line-b', 5),
  sliders: line('line-b', 6),
  back: line('line-b', 7),
  palette: line('line-b', 8),
  // line-c: made later for the tool bar
  rotate: line('line-c', 1),
  background: line('line-c', 2),
  stay: line('line-c', 3),
  box: line('line-c', 4),
  grip: line('line-c', 7),
  down: line('line-c', 9),
  plus: line('line-c', 10),
  // line-d
  text: line('line-d', 1),
  zoomIn: line('line-d', 2),
  zoomOut: line('line-d', 3),
  fit: line('line-d', 4),
  hand: line('line-d', 5)
}
