/**
 * The tiles of the start page can be arranged by the child or the parents (Anton, 18.11.2026: "press long, move, swap and change the size, like on the
 * iPhone"). A layout is a list of tiles in order, each with a size: `small` takes one column, `wide` two. This file is only the rules (pure functions,
 * no screen): which tiles exist, the layout a new device starts with, and how a layout is changed. The screen is `HomeTileGrid.vue`, the memory of the
 * layout is `useHomeLayout`.
 */
import { BIG_GAMES, type BigGameId } from '@/data/bigGames'

/** The five tiles of the start page since the beginning (they begin on the page). */
export const CORE_TILES = ['adventure', 'book', 'picture', 'games', 'family'] as const
/**
 * Shortcuts that can be added: the stage games, the collector cards, the diary, the good-night stories, the coloring books, LambKing Plus and
 * every one of the seven family games on its own.
 */
export const EXTRA_TILES = ['stageGames', 'cards', 'journal', 'goodnight', 'coloringBooks', 'plus', 'quiz', 'activity', 'who', 'order', 'bingo', 'memory', 'wortreise'] as const

/**
 * Every adventure game on its own (Anton, 18.11.2026: "the single bonus games should be choosable here too"): the tile of a game leads into the
 * game when it is open, and to "My games" (where it is picked) when it is still closed.
 */
export const GAME_TILE_PREFIX = 'game-'
export const GAME_TILES = BIG_GAMES.map((g) => `${GAME_TILE_PREFIX}${g.id}` as const)

export type HomeTileId = (typeof CORE_TILES)[number] | (typeof EXTRA_TILES)[number] | `game-${BigGameId}`
export type HomeTileSize = 'small' | 'wide'
export interface HomeTile {
  id: HomeTileId
  size: HomeTileSize
}

export const ALL_TILES: readonly HomeTileId[] = [...CORE_TILES, ...EXTRA_TILES, ...GAME_TILES]

/**
 * The start page has room for 8 places (Anton 22.11.2026): a small tile takes one place, a wide tile two. Nothing can be added, and no tile made wide, when that would
 * need more places than that.
 */
export const MAX_SLOTS = 8
const costOf = (size: HomeTileSize) => (size === 'wide' ? 2 : 1)
/** The places the tiles of a layout take. */
export const slotsUsed = (layout: readonly HomeTile[]): number => layout.reduce((n, t) => n + costOf(t.size), 0)
/** True when one more small tile has a place. */
export const canAddTile = (layout: readonly HomeTile[]): boolean => slotsUsed(layout) + 1 <= MAX_SLOTS
/** True when this tile may become wide: it is small, and one more place is free. */
export const canWiden = (layout: readonly HomeTile[], id: HomeTileId): boolean => layout.some((t) => t.id === id && t.size === 'small') && slotsUsed(layout) + 1 <= MAX_SLOTS

/** What a device without a saved layout shows: the five tiles, all small (Anton 22.11.2026: the family games are a small square tile like the others; a hint tile stands beside it). */
export const DEFAULT_LAYOUT: readonly HomeTile[] = [
  { id: 'adventure', size: 'small' },
  { id: 'book', size: 'small' },
  { id: 'picture', size: 'small' },
  { id: 'games', size: 'small' },
  { id: 'family', size: 'small' }
]

const isId = (x: unknown): x is HomeTileId => typeof x === 'string' && (ALL_TILES as readonly string[]).includes(x)
const isSize = (x: unknown): x is HomeTileSize => x === 'small' || x === 'wide'

/** A copy of the default layout (it is never changed in place). */
export const defaultLayout = (): HomeTile[] => DEFAULT_LAYOUT.map((t) => ({ ...t }))

/**
 * Makes a layout from whatever was saved: unknown tiles go, double tiles go, a wrong size becomes `small`. Anything that is not a list gives
 * `null` (nothing was saved: the default applies); a saved empty list is a real layout (the child took everything away).
 */
export function normalizeLayout(raw: unknown): HomeTile[] | null {
  if (!Array.isArray(raw)) return null
  const seen = new Set<string>()
  const out: HomeTile[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const { id, size } = item as { id?: unknown; size?: unknown }
    if (!isId(id) || seen.has(id)) continue
    const sz: HomeTileSize = isSize(size) ? size : 'small'
    // more than the 8 places: the tile that does not fit stays off the page (it can be added again when there is room)
    if (slotsUsed(out) + costOf(sz) > MAX_SLOTS) continue
    seen.add(id)
    out.push({ id, size: sz })
  }
  return out
}

/** The tile `id` takes the place of the tile `targetId` (the ones between move over by one place). Nothing changes when one of them is missing. */
export function moveTile(layout: readonly HomeTile[], id: HomeTileId, targetId: HomeTileId): HomeTile[] {
  const from = layout.findIndex((t) => t.id === id)
  const to = layout.findIndex((t) => t.id === targetId)
  if (from < 0 || to < 0 || from === to) return layout.map((t) => ({ ...t }))
  const copy = layout.map((t) => ({ ...t }))
  const [moved] = copy.splice(from, 1)
  copy.splice(to, 0, moved!)
  return copy
}

/** Another size for one tile. */
export function setSize(layout: readonly HomeTile[], id: HomeTileId, size: HomeTileSize): HomeTile[] {
  // a wide tile needs a second place: without one the size stays
  if (size === 'wide' && !canWiden(layout, id)) return layout.map((t) => ({ ...t }))
  return layout.map((t) => (t.id === id ? { ...t, size } : { ...t }))
}

/** Small becomes wide, wide becomes small. */
export function toggleSize(layout: readonly HomeTile[], id: HomeTileId): HomeTile[] {
  const cur = layout.find((t) => t.id === id)
  return cur ? setSize(layout, id, cur.size === 'small' ? 'wide' : 'small') : layout.map((t) => ({ ...t }))
}

/** A tile leaves the page (it stays in the list of tiles that can be added). */
export function removeTile(layout: readonly HomeTile[], id: HomeTileId): HomeTile[] {
  return layout.filter((t) => t.id !== id).map((t) => ({ ...t }))
}

/** A tile comes to the end of the page, small. Nothing changes when it is there already. */
export function addTile(layout: readonly HomeTile[], id: HomeTileId, size: HomeTileSize = 'small'): HomeTile[] {
  if (!isId(id) || layout.some((t) => t.id === id)) return layout.map((t) => ({ ...t }))
  // the page is full: nothing is added
  if (slotsUsed(layout) + costOf(size) > MAX_SLOTS) return layout.map((t) => ({ ...t }))
  return [...layout.map((t) => ({ ...t })), { id, size }]
}

/** The tiles that are not on the page: the ones that can be added. */
export function missingTiles(layout: readonly HomeTile[]): HomeTileId[] {
  return ALL_TILES.filter((id) => !layout.some((t) => t.id === id))
}

/** What the screen needs to show one tile (the start page makes it: it knows where the child stands). */
export interface HomeCard {
  id: HomeTileId
  /** The small label on the picture. */
  kind: string
  title: string
  /** The line under the title (when no bar and no "start here" is shown). */
  meta: string
  image: string
  /** Where a wide picture is held when it is cut to the box (CSS `object-position`, e.g. `50% 22%`), so that faces stay in view. */
  focus?: string
  /** The picture is a symbol: it stands whole on a soft blur of itself. */
  medal?: boolean
  /** 0-1, or -1 when there is nothing to measure. */
  progress: number
  /** Nothing begun yet: the chip "Start here" instead of the line. */
  empty: boolean
  /** The name of the small icon on the label (see `ZIconography`). */
  icon: string
  go: () => void
}
