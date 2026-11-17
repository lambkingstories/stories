/**
 * The Wortreise (word journey), a family game on the old map: a circle of letters and a crossword grid of Bible words. The people take turns
 * on one device, find a word from the letters of the circle, and every word that belongs to the grid fills its squares.
 *
 * This file holds the pure parts without Vue (so that they can be tested): the word lists, the generator of the puzzles (a letter circle and
 * a crossword that fits together, the same for the same seed) and the proof that a puzzle can be solved (`validatePuzzle`), the rules for a
 * typed word, the points and the helps. The state of a game (`WortreiseGame`) is plain data, so it can be kept on the device between two
 * visits (see `wortreiseGame.ts`).
 */
import { WORDS } from './wortreiseWords'

export type WrLang = 'de' | 'en' | 'es'
export type WrLevel = 'kids' | 'family' | 'pro'
export const WR_LEVELS: WrLevel[] = ['kids', 'family', 'pro']
export const WR_LANGS: WrLang[] = ['de', 'en', 'es']

export interface WrLevelSpec {
  /** Letters on the circle. */
  letters: number
  /** The shortest word that counts. */
  minWord: number
  /** How many words the grid holds (at least, at most). */
  words: [number, number]
  /** The biggest grid (rows and columns). */
  maxGrid: number
  /** The fewest words of the grid that come from the Bible (the others are everyday words that fill the grid). */
  minBible: number
}

export const WR_SPEC: Record<WrLevel, WrLevelSpec> = {
  kids: { letters: 5, minWord: 3, words: [4, 5], maxGrid: 6, minBible: 2 },
  family: { letters: 6, minWord: 3, words: [5, 7], maxGrid: 8, minBible: 3 },
  pro: { letters: 7, minWord: 3, words: [7, 9], maxGrid: 9, minBible: 4 }
}

export const WR_MAX_PLAYERS = 6
export const WR_STAGE_CHOICES = [3, 5, 7] as const
/** Points for a word of the grid, by its length. */
export const WR_WORD_POINTS: Record<number, number> = { 3: 2, 4: 4, 5: 6, 6: 9, 7: 12 }
/** The bonus for the person who fills the last square of a grid. */
export const WR_STAGE_BONUS = 5
/** The shared hints (a letter is shown) of a whole journey: one for every stage. */
export const wrHintsFor = (stages: number): number => stages

// ── letters and words ──────────────────────────────────────────────────────────────────────────────────────────────

/** The letters a word is played with: capitals; german keeps ä ö ü, spanish keeps ñ and loses its accents, "ß" is written "SS". */
export function keyOf(lang: WrLang, word: string): string {
  let w = word.toUpperCase().replace(/ß/g, 'SS')
  if (lang === 'de') return w.replace(/[^A-ZÄÖÜ]/g, '')
  if (lang === 'es') {
    w = w.replace(/Ñ/g, '\u0001')
    w = w.normalize('NFD').replace(/[̀-ͯ]/g, '')
    return w.replace(/[^A-Z\u0001]/g, '').replace(/\u0001/g, 'Ñ')
  }
  return w.replace(/[^A-Z]/g, '')
}

export interface WrWord {
  key: string
  /** The word as it is written (with the accents, the capital). */
  show: string
  /** Where it stands in the Bible (empty when it is not known for sure). */
  ref: string
  /** A word of the Bible (the others are everyday words, they only count as bonus words or fill a gap). */
  bible: boolean
}

export interface WrDict {
  lang: WrLang
  /** All words by key. */
  byKey: Map<string, WrWord>
  /** The same as a list (sorted by key). */
  list: WrWord[]
}

const dicts = new Map<WrLang, WrDict>()

/** The words of a language (built once). */
export function dictFor(lang: WrLang): WrDict {
  const have = dicts.get(lang)
  if (have) return have
  const byKey = new Map<string, WrWord>()
  for (const [show, ref, bib] of WORDS[lang]) {
    const key = keyOf(lang, show)
    if (key.length < 3 || key.length > 7 || byKey.has(key)) continue
    byKey.set(key, { key, show, ref, bible: bib === 1 })
  }
  const list = [...byKey.values()].sort((a, b) => (a.key < b.key ? -1 : 1))
  const d = { lang, byKey, list }
  dicts.set(lang, d)
  return d
}

function counts(letters: string[] | string): Map<string, number> {
  const m = new Map<string, number>()
  for (const c of letters) m.set(c, (m.get(c) ?? 0) + 1)
  return m
}

/** Can the word be made from the letters of the circle (every letter as often as it is on the circle)? */
export function canMake(letters: string[] | string, key: string): boolean {
  const have = counts(letters)
  for (const c of key) {
    const n = have.get(c) ?? 0
    if (n <= 0) return false
    have.set(c, n - 1)
  }
  return true
}

// ── a seeded random generator ───────────────────────────────────────────────────────────────────────────────────────

export type Rand = () => number

/** mulberry32: the same seed gives the same numbers. */
export function rng(seed: number): Rand {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A number made of several numbers (for the seed of a stage). */
export function mixSeed(...n: number[]): number {
  let h = 2166136261
  for (const x of n) {
    h ^= x >>> 0
    h = Math.imul(h, 16777619)
    h ^= h >>> 13
  }
  return h >>> 0
}

function shuffled<T>(list: readonly T[], rand: Rand): T[] {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

// ── the puzzle ──────────────────────────────────────────────────────────────────────────────────────────────────────

export interface WrPlaced {
  key: string
  row: number
  col: number
  /** 'h' across, 'v' down. */
  dir: 'h' | 'v'
}

export interface WrPuzzle {
  lang: WrLang
  level: WrLevel
  seed: number
  /** The word that gave the letters (it is one of the words of the grid when it fits). */
  root: string
  /** The letters of the circle in the order in which they are drawn on it. */
  circle: string[]
  rows: number
  cols: number
  words: WrPlaced[]
  /** The other words that can be made from the circle (they give bonus points, they are not in the grid). */
  bonus: string[]
}

/** The squares of a word, in reading order. */
export function cellsOf(w: WrPlaced): [number, number][] {
  return Array.from({ length: w.key.length }, (_, i) => [w.row + (w.dir === 'v' ? i : 0), w.col + (w.dir === 'h' ? i : 0)] as [number, number])
}

const cid = (r: number, c: number) => `${r},${c}`

/** The squares of the grid with their letter ("r,c" → letter). */
export function gridLetters(p: Pick<WrPuzzle, 'words'>): Map<string, string> {
  const m = new Map<string, string>()
  for (const w of p.words) cellsOf(w).forEach(([r, c], i) => m.set(cid(r, c), w.key[i]!))
  return m
}

interface Layout {
  grid: Map<string, { ch: string; h: boolean; v: boolean }>
  placed: WrPlaced[]
  r0: number
  r1: number
  c0: number
  c1: number
}

function tryPlace(l: Layout, key: string, r: number, c: number, dir: 'h' | 'v', maxGrid: number): number {
  const dr = dir === 'v' ? 1 : 0
  const dc = dir === 'h' ? 1 : 0
  const n = key.length
  const r1 = r + dr * (n - 1)
  const c1 = c + dc * (n - 1)
  const nr0 = Math.min(l.r0, r)
  const nr1 = Math.max(l.r1, r1)
  const nc0 = Math.min(l.c0, c)
  const nc1 = Math.max(l.c1, c1)
  if (nr1 - nr0 + 1 > maxGrid || nc1 - nc0 + 1 > maxGrid) return -1
  // the squares right before and after the word stay empty
  if (l.grid.has(cid(r - dr, c - dc)) || l.grid.has(cid(r1 + dr, c1 + dc))) return -1
  let crossings = 0
  for (let i = 0; i < n; i++) {
    const rr = r + dr * i
    const cc = c + dc * i
    const have = l.grid.get(cid(rr, cc))
    if (have) {
      // a crossing: the same letter, and the other word runs the other way (no two words on top of each other)
      if (have.ch !== key[i]) return -1
      if (dir === 'h' ? have.h : have.v) return -1
      crossings++
    } else if (l.grid.has(cid(rr + dc, cc + dr)) || l.grid.has(cid(rr - dc, cc - dr))) {
      // a new square must not touch a word beside it
      return -1
    }
  }
  if (l.placed.length > 0 && (crossings === 0 || crossings >= n)) return -1
  return crossings
}

function put(l: Layout, key: string, r: number, c: number, dir: 'h' | 'v') {
  const dr = dir === 'v' ? 1 : 0
  const dc = dir === 'h' ? 1 : 0
  for (let i = 0; i < key.length; i++) {
    const id = cid(r + dr * i, c + dc * i)
    const have = l.grid.get(id)
    if (have) {
      if (dir === 'h') have.h = true
      else have.v = true
    } else l.grid.set(id, { ch: key[i]!, h: dir === 'h', v: dir === 'v' })
  }
  l.placed.push({ key, row: r, col: c, dir })
  l.r0 = Math.min(l.r0, r)
  l.c0 = Math.min(l.c0, c)
  l.r1 = Math.max(l.r1, r + dr * (key.length - 1))
  l.c1 = Math.max(l.c1, c + dc * (key.length - 1))
}

/** Lays the words out as a crossword (greedy: every word where it crosses most, the smallest grid); words that do not fit are left out. */
function layOut(keys: string[], want: number, maxGrid: number, rand: Rand): Layout | null {
  if (keys.length === 0) return null
  const l: Layout = { grid: new Map(), placed: [], r0: 0, r1: 0, c0: 0, c1: 0 }
  const first = keys[0]!
  put(l, first, 0, 0, rand() < 0.5 ? 'h' : 'v')
  for (let k = 1; k < keys.length && l.placed.length < want; k++) {
    const key = keys[k]!
    let best: { r: number; c: number; dir: 'h' | 'v'; score: number } | null = null
    for (const dir of ['h', 'v'] as const) {
      // every square of the grid with the right letter is a place where the word may cross
      for (const [id, cell] of l.grid) {
        if (dir === 'h' ? cell.h : cell.v) continue
        const [rs, cs] = id.split(',').map(Number) as [number, number]
        for (let i = 0; i < key.length; i++) {
          if (key[i] !== cell.ch) continue
          const r = dir === 'v' ? rs - i : rs
          const c = dir === 'h' ? cs - i : cs
          const x = tryPlace(l, key, r, c, dir, maxGrid)
          if (x < 0) continue
          const nr0 = Math.min(l.r0, r)
          const nr1 = Math.max(l.r1, r + (dir === 'v' ? key.length - 1 : 0))
          const nc0 = Math.min(l.c0, c)
          const nc1 = Math.max(l.c1, c + (dir === 'h' ? key.length - 1 : 0))
          const area = (nr1 - nr0 + 1) * (nc1 - nc0 + 1)
          // the more crossings and the smaller and squarer the grid, the better; a little chance keeps the grids different
          const score = x * 12 - area - Math.abs(nr1 - nr0 - (nc1 - nc0)) * 2 + rand() * 3
          if (!best || score > best.score) best = { r, c, dir, score }
        }
      }
    }
    if (best) put(l, key, best.r, best.c, best.dir)
  }
  return l
}

/** The roots (words whose letters hold enough other words) of a language and a level, the Bible words first, then in a fixed order. */
const rootCache = new Map<string, { key: string; bible: boolean; inside: WrWord[] }[]>()

function rootsFor(lang: WrLang, level: WrLevel) {
  const id = `${lang}-${level}`
  const have = rootCache.get(id)
  if (have) return have
  const spec = WR_SPEC[level]
  const d = dictFor(lang)
  const out: { key: string; bible: boolean; inside: WrWord[] }[] = []
  for (const w of d.list) {
    if (w.key.length !== spec.letters) continue
    const inside = d.list.filter((x) => x.key !== w.key && x.key.length >= spec.minWord && canMake(w.key, x.key))
    const bible = inside.filter((x) => x.bible).length + (w.bible ? 1 : 0)
    // enough words to choose from, and enough of them from the Bible
    if (bible >= spec.minBible && inside.length + 1 >= spec.words[0] + 1) out.push({ key: w.key, bible: w.bible, inside })
  }
  rootCache.set(id, out)
  return out
}

/** How many different roots a level has in a language (the first seeds all have another root). */
export function rootCount(lang: WrLang, level: WrLevel): number {
  return rootsFor(lang, level).length
}

/**
 * A puzzle for a language, a level and a seed: the same input always gives the same puzzle. The first `rootCount` seeds each use another
 * word for the letters; `avoid` lists roots that must not be used again (the earlier stages of a journey).
 */
export function makePuzzle(lang: WrLang, level: WrLevel, seed: number, avoid: readonly string[] = []): WrPuzzle {
  const all = rootsFor(lang, level)
  if (all.length === 0) throw new Error(`no roots for ${lang} ${level}`)
  // the roots from the Bible come first (a seed picks one by its number), then the roots of everyday words
  const rr = rng(mixSeed(1, lang.charCodeAt(0), level.length))
  const order = [...shuffled(all.filter((r) => r.bible), rr), ...shuffled(all.filter((r) => !r.bible), rr)]
  const usable = order.filter((r) => !avoid.includes(r.key))
  const pool = usable.length > 0 ? usable : order
  const variant = Math.floor(seed / pool.length)
  // the root of the seed; when no good grid can be laid out with it, the next root is tried (so a seed always gives a puzzle)
  for (let k = 0; k < pool.length; k++) {
    const root = pool[(seed + k) % pool.length]!
    const got = tryRoot(lang, level, seed, variant, root)
    if (got) return got
  }
  throw new Error(`no grid for ${lang} ${level} seed ${seed}`)
}

function tryRoot(lang: WrLang, level: WrLevel, seed: number, variant: number, root: { key: string; inside: WrWord[] }): WrPuzzle | null {
  const spec = WR_SPEC[level]
  const d = dictFor(lang)
  for (let attempt = 0; attempt < 40; attempt++) {
    const rand = rng(mixSeed(seed, variant, attempt, 7))
    const rootWord = d.byKey.get(root.key)!
    const want = spec.words[0] + Math.floor(rand() * (spec.words[1] - spec.words[0] + 1))
    // the words that may stand in the grid: the Bible words are drawn two times as often as the everyday words
    const bibleIn = shuffled(root.inside.filter((x) => x.bible), rand)
    const dayIn = shuffled(root.inside.filter((x) => !x.bible), rand)
    const cand: WrWord[] = []
    while (cand.length < want * 2 && (bibleIn.length || dayIn.length)) {
      const useBible = bibleIn.length > 0 && (dayIn.length === 0 || rand() < 0.67)
      cand.push((useBible ? bibleIn : dayIn).shift()!)
    }
    // the root carries the grid when it is a Bible word (or by chance), then the long words (they give the grid its shape)
    const keys = [...cand].sort((a, b) => b.key.length - a.key.length || rand() - 0.5).map((w) => w.key)
    if (rootWord.bible || rand() < 0.5) keys.unshift(root.key)
    const l = layOut(keys, want, spec.maxGrid, rand)
    if (!l || l.placed.length < spec.words[0]) continue
    if (l.placed.filter((w) => d.byKey.get(w.key)?.bible).length < spec.minBible) continue
    const rows = l.r1 - l.r0 + 1
    const cols = l.c1 - l.c0 + 1
    const words = l.placed.map((w) => ({ ...w, row: w.row - l.r0, col: w.col - l.c0 })).sort((a, b) => a.row - b.row || a.col - b.col)
    const circle = shuffled(root.key.split(''), rand)
    const placedKeys = new Set(words.map((w) => w.key))
    const bonus = d.list.filter((x) => !placedKeys.has(x.key) && x.key.length >= spec.minWord && canMake(circle, x.key)).map((x) => x.key)
    return { lang, level, seed, root: root.key, circle, rows, cols, words, bonus }
  }
  return null
}

/**
 * The proof that a puzzle can be solved: a list of the faults (empty means the puzzle is good). Every word must be made from the letters of the
 * circle and be in the dictionary, the grid must be connected and must not hold a word that is not in the list (letters touching), and the
 * size must fit the level.
 */
export function validatePuzzle(p: WrPuzzle): string[] {
  const faults: string[] = []
  const spec = WR_SPEC[p.level]
  const d = dictFor(p.lang)
  if (p.circle.length !== spec.letters) faults.push('circle size')
  if (counts(p.circle).size === 0) faults.push('empty circle')
  if (p.words.length < spec.words[0] || p.words.length > spec.words[1]) faults.push(`word count ${p.words.length}`)
  if (p.rows > spec.maxGrid || p.cols > spec.maxGrid) faults.push('grid too big')
  const seen = new Set<string>()
  const grid = new Map<string, string>()
  const owner = new Map<string, number[]>()
  let bibleWords = 0
  p.words.forEach((w, wi) => {
    if (seen.has(w.key)) faults.push(`double word ${w.key}`)
    seen.add(w.key)
    const entry = d.byKey.get(w.key)
    if (!entry) faults.push(`unknown word ${w.key}`)
    else if (entry.bible) bibleWords++
    if (w.key.length < spec.minWord) faults.push(`short word ${w.key}`)
    if (!canMake(p.circle, w.key)) faults.push(`not made from the circle: ${w.key}`)
    let own = 0
    cellsOf(w).forEach(([r, c], i) => {
      if (r < 0 || c < 0 || r >= p.rows || c >= p.cols) faults.push(`outside ${w.key}`)
      const id = cid(r, c)
      const have = grid.get(id)
      if (have && have !== w.key[i]) faults.push(`letters clash at ${id}`)
      grid.set(id, w.key[i]!)
      const o = owner.get(id) ?? []
      o.push(wi)
      owner.set(id, o)
      if (o.length === 1) own++
    })
    if (own === 0) faults.push(`no own square ${w.key}`)
  })
  if (bibleWords < spec.minBible) faults.push('too few words from the Bible')
  // no square belongs to two words of the same direction
  for (const [id, o] of owner) {
    if (o.length > 2) faults.push(`three words at ${id}`)
    if (o.length === 2 && p.words[o[0]!]!.dir === p.words[o[1]!]!.dir) faults.push(`same direction at ${id}`)
  }
  // every run of two or more letters in a row or column is exactly one word of the list
  const runs = new Set<string>()
  for (let r = 0; r < p.rows; r++) {
    let run = ''
    let start = 0
    for (let c = 0; c <= p.cols; c++) {
      const ch = c < p.cols ? grid.get(cid(r, c)) : undefined
      if (ch) {
        if (!run) start = c
        run += ch
      } else {
        if (run.length > 1) runs.add(`h${r},${start}:${run}`)
        run = ''
      }
    }
  }
  for (let c = 0; c < p.cols; c++) {
    let run = ''
    let start = 0
    for (let r = 0; r <= p.rows; r++) {
      const ch = r < p.rows ? grid.get(cid(r, c)) : undefined
      if (ch) {
        if (!run) start = r
        run += ch
      } else {
        if (run.length > 1) runs.add(`v${start},${c}:${run}`)
        run = ''
      }
    }
  }
  const expected = new Set(p.words.map((w) => `${w.dir}${w.row},${w.col}:${w.key}`))
  for (const x of runs) if (!expected.has(x)) faults.push(`unplanned run ${x}`)
  for (const x of expected) if (!runs.has(x)) faults.push(`missing run ${x}`)
  // connected
  const ids = [...grid.keys()]
  if (ids.length > 0) {
    const todo = [ids[0]!]
    const reach = new Set<string>(todo)
    while (todo.length) {
      const [r, c] = todo.pop()!.split(',').map(Number) as [number, number]
      for (const [a, b] of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]] as const) {
        const n = cid(a, b)
        if (grid.has(n) && !reach.has(n)) {
          reach.add(n)
          todo.push(n)
        }
      }
    }
    if (reach.size !== ids.length) faults.push('grid not connected')
  }
  // bonus words are made from the circle, are in the list and are not in the grid
  for (const b of p.bonus) {
    if (seen.has(b)) faults.push(`bonus word also in the grid ${b}`)
    if (!d.byKey.has(b) || !canMake(p.circle, b)) faults.push(`bad bonus word ${b}`)
  }
  // the root word is made from exactly the letters of the circle
  if (!canMake(p.circle, p.root) || p.root.length !== p.circle.length) faults.push('root does not match the circle')
  return faults
}

// ── a typed word ────────────────────────────────────────────────────────────────────────────────────────────────────

export type WrResult = 'grid' | 'bonus' | 'again' | 'no'

export interface WrProgress {
  /** Words of the grid that were found by typing. */
  found: string[]
  /** Bonus words found. */
  bonusFound: string[]
  /** Squares that are filled by a help (a shown letter): "r,c". */
  shown: string[]
}

export const emptyProgress = (): WrProgress => ({ found: [], bonusFound: [], shown: [] })

/** The squares that are filled right now (found words and shown letters). */
export function filledCells(p: WrPuzzle, pr: WrProgress): Set<string> {
  const out = new Set<string>(pr.shown)
  for (const w of p.words) if (pr.found.includes(w.key)) for (const [r, c] of cellsOf(w)) out.add(cid(r, c))
  return out
}

/** A word of the grid is done when it was found or when all its squares are filled (crossing words and shown letters). */
export function wordDone(p: WrPuzzle, pr: WrProgress, w: WrPlaced): boolean {
  if (pr.found.includes(w.key)) return true
  const f = filledCells(p, pr)
  return cellsOf(w).every(([r, c]) => f.has(cid(r, c)))
}

export function puzzleDone(p: WrPuzzle, pr: WrProgress): boolean {
  return p.words.every((w) => wordDone(p, pr, w))
}

/** What a typed word is: a word of the grid, a bonus word, a word that was found already, or no word of this puzzle. */
export function judge(p: WrPuzzle, pr: WrProgress, typed: string): WrResult {
  const key = typed.toUpperCase()
  if (key.length < WR_SPEC[p.level].minWord || !canMake(p.circle, key)) return 'no'
  const w = p.words.find((x) => x.key === key)
  if (w) return wordDone(p, pr, w) ? 'again' : 'grid'
  if (p.bonus.includes(key)) return pr.bonusFound.includes(key) ? 'again' : 'bonus'
  return 'no'
}

export const wordPoints = (len: number): number => WR_WORD_POINTS[len] ?? len * 2
export const bonusPoints = (len: number): number => (len >= 5 ? 2 : 1)

/** The square a help shows: a square that is still empty, preferably of a word that has most squares filled already (so a word gets close to done). */
export function pickHint(p: WrPuzzle, pr: WrProgress, rand: Rand = Math.random): [number, number] | null {
  const f = filledCells(p, pr)
  let best: { cell: [number, number]; score: number } | null = null
  for (const w of p.words) {
    if (wordDone(p, pr, w)) continue
    const cells = cellsOf(w)
    const empty = cells.filter(([r, c]) => !f.has(cid(r, c)))
    if (empty.length === 0) continue
    // a word with several empty squares: show the first one that is empty (the person sees where it starts)
    const score = (cells.length - empty.length) / cells.length + rand() * 0.2
    if (!best || score > best.score) best = { cell: empty[0]!, score }
  }
  return best ? best.cell : null
}

/** Mixes the letters of the circle into another order (never the same as before when there is a choice). */
export function mixCircle(circle: string[], rand: Rand = Math.random): string[] {
  for (let i = 0; i < 6; i++) {
    const next = shuffled(circle, rand)
    if (next.join('') !== circle.join('') || new Set(circle).size === 1) return next
  }
  return [...circle].reverse()
}

export const wordInfo = (lang: WrLang, key: string): WrWord | undefined => dictFor(lang).byKey.get(key)
