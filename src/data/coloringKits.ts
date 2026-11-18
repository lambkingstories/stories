/**
 * The boxes of the coloring app and the artwork they are made of. All pictures
 * (pencils, markers, brushes, chalk, tool and button icons) were made with GPT Image 2 and cut into single sprites with transparent
 * backgrounds; the list of sprites and the paint colour each one stands for is
 * generated in `coloringSprites.ts`. To change a picture, make a new sheet and
 * run `slice_sheets.mjs` (see the design folder), do not draw it in code.
 */
import { SPRITES } from '@/data/coloringSprites'
import { prependBaseUrl } from '@/utils/function'

export type KitVariant = 'pencil' | 'marker' | 'chalk' | 'brushW' | 'pans' | 'brushO' | 'bucket' | 'dabs'

export interface KitItem {
  /** The sprite picture. */
  src: string
  /** The paint colour this item stands for (hex). */
  color: string
  /** The item belongs to a tool of its own: a graphite pencil (a soft grey line) or the white pencil (lightens and blends what lies under it). */
  tool?: 'graphite' | 'whitepencil'
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

/**
 * The pencil tool has a box of its own with three pencils: a light and a dark graphite pencil and a white pencil that lightens and blends what
 * lies under it. They come from their own sheet (a folder `graphite` with three pencils, see the order "BILDAUFTRAG-bleistifte-geodreieck");
 * until it has three, the old two graphite pencils stand in, and the palest pencil of the coloured sheets for the white one.
 */
const graphiteSprites = itemsOf('graphite')
const whiteStandIn = pencilsLight.find((i) => i.src.endsWith('/12.webp'))
const GRAPHITE: KitItem[] = (
  graphiteSprites.length >= 3
    ? graphiteSprites.slice(0, 3)
    : [
        { src: graphiteSprites[0]?.src ?? pencilsDark[pencilsDark.length - 1]?.src ?? '', color: graphiteSprites[0]?.color ?? '#8A8F8F' },
        { src: graphiteSprites[1]?.src ?? pencils[pencils.length - 1]?.src ?? '', color: graphiteSprites[1]?.color ?? '#2E2E2E' },
        { src: whiteStandIn?.src ?? '', color: '#F6F6F2' }
      ]
).map((i, n) => ({ ...i, tool: n === 2 ? ('whitepencil' as const) : ('graphite' as const) }))

export interface KitArtwork {
  variant: KitVariant
  base: KitItem[]
  extra: KitItem[]
  /** What the tool looks like in the tool bar (by colour), when it is something else than what lies in the box: a brush for the paint pans. */
  toolSprites?: KitItem[]
  /** The rainbow item that opens the free colour picker. */
  rainbow: KitItem | null
}

/**
 * Glitter markers: 24 glitter colours, all of them Plus (the whole tool is, so there are no "more colours" to hold back). Until their own
 * sprites exist (a folder `glitter` in `public/images/ausmalen/`, made like the other sheets, see the brief "LambKing Glitzerstifte Bildauftrag")
 * the box shows the felt-tip markers, which are the nearest thing to them (never the coloured pencils: every tool has to look like itself).
 */
const GLITTER_COLORS = 24
// two sheets of 12 glitter markers (the second ends with the striped marker that opens the colour picker)
const glitter = [...itemsOf('glitter'), ...itemsOf('glitter-2')]
const glitterStandIn = [...itemsOf('marker'), ...itemsOf('marker-2')].slice(0, GLITTER_COLORS)

const pansBase = itemsOf('pan')
// the brushes of the tool bar: the new ones (folders `wasserpinsel`) when there are, else the old wooden ones
const newBrushes = itemsOf('wasserpinsel')
const waterBrushes = newBrushes.length ? newBrushes : itemsOf('brush-water')
const waterBrushes2 = newBrushes.length ? itemsOf('wasserpinsel-2') : itemsOf('brush-water-2')
const chalkPaper = itemsOf('chalk-paper')
const cans = [...itemsOf('bucket'), ...itemsOf('bucket-2')]
// the dabs stand in the order of the cans and paint with exactly the colours of the cans (the tool bar finds its can by colour)
const dabs = [...itemsOf('farbfleck'), ...itemsOf('farbfleck-2')].map((d, i) => ({ ...d, color: cans[i]?.color ?? d.color }))

export const KIT_ARTWORK: Record<'pencil' | 'graphite' | 'marker' | 'watercolor' | 'oil' | 'chalk' | 'glitter' | 'bucket', KitArtwork> = {
  // the 12 coloured pencils (and the 24 more of the big box)
  pencil: { variant: 'pencil', base: PENCIL_BASE, extra: PENCIL_EXTRA, rainbow: rainbowOf('pencil-extra-hell') },
  // the pencil tool: light, dark and white
  graphite: { variant: 'pencil', base: GRAPHITE, extra: [], rainbow: null },
  glitter: glitter.length
    ? { variant: 'marker', base: glitter, extra: [], rainbow: rainbowOf('glitter-2') }
    : { variant: 'marker', base: glitterStandIn, extra: [], rainbow: rainbowOf('marker') },
  marker: { variant: 'marker', base: itemsOf('marker'), extra: itemsOf('marker-2'), rainbow: rainbowOf('marker') },
  // watercolours lie in round white plastic pans (two sheets); the tool bar shows the brush in the same colour. Until the pans exist the brushes are the box.
  watercolor: pansBase.length
    ? { variant: 'pans', base: pansBase, extra: itemsOf('pan-2'), rainbow: rainbowOf('pan'), toolSprites: [...waterBrushes, ...waterBrushes2] }
    : { variant: 'brushW', base: itemsOf('brush-water'), extra: itemsOf('brush-water-2'), rainbow: rainbowOf('brush-water') },
  oil: { variant: 'brushO', base: itemsOf('brush-oil'), extra: itemsOf('brush-oil-2'), rainbow: rainbowOf('brush-oil') },
  // chalk in coloured paper (own sheet); the plain sticks are the stand-in
  chalk: chalkPaper.length ? { variant: 'chalk', base: chalkPaper, extra: [], rainbow: rainbowOf('chalk-paper') } : { variant: 'chalk', base: itemsOf('chalk'), extra: [], rainbow: rainbowOf('chalk') },
  // the pouring tool: the tool bar shows the watering can, the colour box shows fresh dabs of paint (until they exist, the cans are the box)
  bucket: dabs.length
    ? { variant: 'dabs', base: dabs, extra: [], rainbow: rainbowOf('farbfleck-2'), toolSprites: cans }
    : { variant: 'bucket', base: cans, extra: [], rainbow: rainbowOf('bucket-2') }
}

/**
 * Loads the pictures of every box quietly in the background, one box after the other, so that changing the tool shows its colours at once
 * (without it a phone shows the old pictures for a moment and then jumps). Called once when the coloring screen is open.
 */
let warmed = false
export function warmSprites(): void {
  if (warmed || typeof window === 'undefined') return
  warmed = true
  const boxes = Object.values(KIT_ARTWORK)
  const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback
  const later = (fn: () => void) => (idle ? idle(fn, { timeout: 4000 }) : window.setTimeout(fn, 300))
  let box = 0
  const next = () => {
    const k = boxes[box++]
    if (!k) return
    for (const it of [...k.base, ...(k.toolSprites ?? []), ...(k.rainbow ? [k.rainbow] : [])]) {
      const img = new Image()
      img.decoding = 'async'
      img.src = it.src
      void img.decode().catch(() => undefined)
    }
    later(next)
  }
  later(next)
}

/** Thin line icons (made with GPT Image 2, cut into single files) for the controls. */
const line = (sheet: 'line-a' | 'line-b' | 'line-c' | 'line-d' | 'line-e', n: number) => url(sheet, `${String(n).padStart(2, '0')}.webp`)

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
  hand: line('line-d', 5),
  // line-e: the stamp
  stamp: line('line-e', 2)
}
