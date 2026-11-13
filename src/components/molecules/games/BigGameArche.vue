<script setup lang="ts">
/**
 * "Arche der Tierpaare": the match-3 game (the rules are in `utils/archeGame.ts`, the levels in `utils/archeLevels.ts`, this file draws it
 * and takes the touch). The rules play a whole move at once and tell it as steps; this file keeps its own display state (sprites that slide,
 * fall, burst) and plays the steps one after the other. When all steps are played the display is set to the state of the rules again.
 * Menu = the overview of the ark (the landscape of the chapter, the pairs on board, the levels).
 */
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import AdventureStars from '@/components/molecules/AdventureStars.vue'
import useBigGames, { howSeen, markHowSeen } from '@/use/useBigGames'
import useSfx from '@/use/useSfx'
import useMusic from '@/use/useMusic'
import { prependBaseUrl } from '@/utils/function'
import {
  BASKET,
  CRATE,
  DOVE_H,
  DOVE_V,
  FLOOR,
  KIND_NAMES,
  OLIVE,
  RAINBOW,
  STONE,
  VOID,
  WATER,
  boosterHammer,
  boosterShuffle,
  boosterSwap,
  bonusSteps,
  canSwap,
  colOf,
  goalLeft,
  hint,
  newGame,
  rowOf,
  starsFor,
  trySwap,
  type Game,
  type Goal,
  type Step,
  type Turn
} from '@/utils/archeGame'
import { CHAPTER_COUNT, LEVELS, LEVELS_PER_CHAPTER, PAIR_KIND } from '@/utils/archeLevels'
import { BOOSTERS, add, earned, loadBoosters, pairsOnBoard, saveBoosters, spend, topUp, type BoosterName } from '@/utils/archeStore'

const emit = defineEmits<{ leave: [] }>()
const { t, te, tm, rt } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const music = useMusic()
const progress = useBigGames()
const ID = 'arche'
const T = (k: string, p?: Record<string, unknown>) => t(`app.bigGames.arche.${k}`, p ?? {})

// ── the pictures ────────────────────────────────────────────────────────────────────────────────────────────────────────────
const NAMES = [
  ...KIND_NAMES.map((n) => `tier-${n}`),
  'sp-taube', 'sp-oelzweig', 'sp-regenbogen', 'b-hammer', 'hi-kiste', 'hi-kiste-riss', 'hi-fels', 'hi-netz', 'hi-kaefig', 'hi-korb', 'hi-wasser',
  'rahmen', 'feld-hell', 'feld-dunkel', 'banner', 'szene-1', 'szene-2', 'szene-3', 'szene-4', 'szene-5', 'szene-6'
]
const img: Record<string, HTMLImageElement | undefined> = {}
const loaded = ref(false)
const glow = new Image()
glow.src = prependBaseUrl('images/abenteuer/ui/sternglanz.webp')
const pic = (n: string) => prependBaseUrl(`images/spiele-gross/arche/${n}.webp`)

function loadAll(): Promise<void> {
  return Promise.all(
    NAMES.map(
      (n) =>
        new Promise<void>((resolve) => {
          const i = new Image()
          i.onload = () => {
            img[n] = i
            resolve()
          }
          i.onerror = () => resolve()
          i.src = pic(n)
        })
    )
  ).then(() => {
    loaded.value = true
  })
}

// ── the screens and what the page shows ─────────────────────────────────────────────────────────────────────────────────────
type Screen = 'menu' | 'play' | 'result'
const screen = ref<Screen>('menu')
const level = ref(0)
const paused = ref(false)
const how = ref(false)
const tip = ref('')
const levelStars = computed(() => progress.levels(ID))
const pairs = computed(() => pairsOnBoard(levelStars.value, LEVELS.length))
const firstOpen = () => {
  const i = LEVELS.findIndex((_, k) => !(levelStars.value[k] ?? 0))
  return i < 0 ? LEVELS.length - 1 : i
}
const chapterView = ref(Math.floor(firstOpen() / LEVELS_PER_CHAPTER))
const chapterNames = computed(() => ((tm('app.bigGames.arche.chapters') as unknown as Parameters<typeof rt>[0][]) ?? []).map((m) => rt(m)))
const chapterRefs = computed(() => ((tm('app.bigGames.arche.chapterRefs') as unknown as Parameters<typeof rt>[0][]) ?? []).map((m) => rt(m)))
const cheers = computed(() => ((tm('app.bigGames.arche.cheer') as unknown as Parameters<typeof rt>[0][]) ?? []).map((m) => rt(m)))
const chapterPairs = (c: number) => levelStars.value.slice(c * LEVELS_PER_CHAPTER, (c + 1) * LEVELS_PER_CHAPTER).filter((s) => (s ?? 0) > 0).length
const allWon = computed(() => pairs.value >= LEVELS.length)
const deckSlots = computed(() => Array.from({ length: LEVELS_PER_CHAPTER }, (_, i) => ({ kind: PAIR_KIND(chapterView.value * LEVELS_PER_CHAPTER + i), on: (levelStars.value[chapterView.value * LEVELS_PER_CHAPTER + i] ?? 0) > 0 })))
const levelsOfChapter = computed(() => Array.from({ length: LEVELS_PER_CHAPTER }, (_, i) => chapterView.value * LEVELS_PER_CHAPTER + i))

const stock = reactive(loadBoosters())
const hud = reactive({ moves: 0, score: 0, left: [] as number[], pulse: 0 })
const outcome = reactive({ phase: 'play' as 'play' | 'won' | 'lost', stars: 0, gained: [] as BoosterName[], newDeck: false })
const mode = ref<'' | 'hammer' | 'swap'>('')
const goals = computed<Goal[]>(() => LEVELS[level.value]?.goals ?? [])
const levelTitle = (i: number) => T('levelN', { n: i + 1 })

// ── the game and its display state ──────────────────────────────────────────────────────────────────────────────────────────
let g: Game = newGame(LEVELS[0]!)
const canvas = ref<HTMLCanvasElement | null>(null)
const hudEl = ref<HTMLElement | null>(null)
const boostEl = ref<HTMLElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let raf = 0
let last = 0
let dpr = 1
let vw = 0
let vh = 0
let cell = 40
let bx = 0
let by = 0
let ft = 10
const side = ref(false)

interface Sprite {
  id: number
  kind: number
  special: number
  cage: boolean
  net: boolean
  x: number
  y: number
  fx: number
  fy: number
  tx: number
  ty: number
  mt: number
  md: number
  delay: number
  moving: boolean
  ease: 0 | 1
  pop: number
  squash: number
  dying: boolean
  dt: number
  ddelay: number
  shake: number
}
let sprites = new Map<number, Sprite>()
let list: Sprite[] = []
let dispType = new Uint8Array(0)
let dispHp = new Uint8Array(0)
let cellPop = new Float32Array(0)
let cellShake = new Float32Array(0)

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  t: number
  life: number
  size: number
  color: string
  star: boolean
}
const particles: Particle[] = []
interface Fx {
  type: 'bird' | 'ring' | 'beam' | 'flash' | 'text' | 'hammer'
  x0: number
  y0: number
  x1: number
  y1: number
  t: number
  dur: number
  text?: string
  hue?: number
  delay: number
}
let fxs: Fx[] = []
let banner: { text: string; t: number; dur: number } | null = null
let shakeT = 0
let selected = -1
let hintPair: { a: number; b: number } | null = null
let idle = 0
let clock = 0

const KIND_COLOR = ['#9db2d0', '#f2bf45', '#e48d33', '#f4ecd6', '#a87546', '#d8d8d8', '#78c850', '#d89a3a']

function newSprite(id: number, kind: number, special: number, cage: boolean, net: boolean, x: number, y: number): Sprite {
  return { id, kind, special, cage, net, x, y, fx: x, fy: y, tx: x, ty: y, mt: 0, md: 0, delay: 0, moving: false, ease: 0, pop: 0, squash: 0, dying: false, dt: 0, ddelay: 0, shake: 0 }
}
function addSprite(s: Sprite) {
  sprites.set(s.id, s)
  list.push(s)
}
function dropSprite(s: Sprite) {
  sprites.delete(s.id)
  const i = list.indexOf(s)
  if (i >= 0) list.splice(i, 1)
}

/** The display is built from the state of the rules (at the start, and again when all steps are played). */
function rebuild() {
  sprites = new Map()
  list = []
  dispType = Uint8Array.from(g.type)
  dispHp = Uint8Array.from(g.hp)
  cellPop = new Float32Array(g.tiles.length).fill(1)
  cellShake = new Float32Array(g.tiles.length)
  for (let i = 0; i < g.tiles.length; i++) {
    const tl = g.tiles[i]
    if (tl) addSprite(newSprite(tl.id, tl.kind, tl.special, tl.cage, tl.net, colOf(g, i), rowOf(g, i)))
  }
}

/** Sets the display to the state of the rules; what differs is corrected. */
function sync() {
  for (let i = 0; i < g.tiles.length; i++) {
    const tl = g.tiles[i]
    const r = rowOf(g, i)
    const c = colOf(g, i)
    if (!tl) continue
    let s = sprites.get(tl.id)
    if (!s) {
      s = newSprite(tl.id, tl.kind, tl.special, tl.cage, tl.net, c, r)
      addSprite(s)
    }
    s.kind = tl.kind
    s.special = tl.special
    s.cage = tl.cage
    s.net = tl.net
    s.dying = false
    s.moving = false
    s.x = s.tx = c
    s.y = s.ty = r
  }
  const alive = new Set<number>()
  for (const tl of g.tiles) if (tl) alive.add(tl.id)
  for (const s of [...list]) if (!alive.has(s.id)) dropSprite(s)
  dispType = Uint8Array.from(g.type)
  dispHp = Uint8Array.from(g.hp)
}

function slide(s: Sprite, tx: number, ty: number, dur: number, delay = 0, ease: 0 | 1 = 0) {
  s.fx = s.x
  s.fy = s.y
  s.tx = tx
  s.ty = ty
  s.mt = 0
  s.md = Math.max(0.01, dur)
  s.delay = delay
  s.moving = true
  s.ease = ease
}

function spriteAt(idx: number): Sprite | undefined {
  const r = rowOf(g, idx)
  const c = colOf(g, idx)
  for (const s of list) if (!s.dying && Math.round(s.tx) === c && Math.round(s.ty) === r) return s
  return undefined
}

// ── the timeline: phases one after the other ────────────────────────────────────────────────────────────────────────────────
interface Phase {
  dur: number
  t: number
  started: boolean
  begin?: (p: Phase) => void
  end?: () => void
}
let phases: Phase[] = []
const busy = () => phases.length > 0
function phase(dur: number, begin?: (p: Phase) => void, end?: () => void) {
  phases.push({ dur, t: 0, started: false, begin, end })
}
function runPhases(dt: number) {
  const p = phases[0]
  if (!p) return
  if (!p.started) {
    p.started = true
    p.begin?.(p)
  }
  p.t += dt
  if (p.t >= p.dur) {
    p.end?.()
    phases.shift()
  }
}

// ── effects ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
function burst(x: number, y: number, color: string, n: number, speed = 260, star = false) {
  for (let i = 0; i < n; i++) {
    if (particles.length > 260) particles.shift()
    const a = Math.random() * Math.PI * 2
    const v = speed * (0.35 + Math.random() * 0.75)
    particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 90, t: 0, life: 0.45 + Math.random() * 0.4, size: (star ? 5 : 3) + Math.random() * 4, color, star })
  }
}
const cellXY = (idx: number) => ({ x: colOf(g, idx) + 0.5, y: rowOf(g, idx) + 0.5 })
function px(x: number) {
  return bx + x * cell
}
function py(y: number) {
  return by + y * cell
}
function say(text: string, dur = 1.1) {
  banner = { text, t: 0, dur }
}
function shake(amp = 1) {
  shakeT = 0.28 * amp
}

// ── playing the steps ───────────────────────────────────────────────────────────────────────────────────────────────────────
function updateHud(step: Step | null) {
  if (step) {
    hud.score = step.score
    hud.left = goals.value.map((gl, i) => leftFor(gl, i, step))
  } else {
    hud.score = g.score
    hud.left = goals.value.map((_, i) => goalLeft(g, i))
  }
  hud.moves = g.moves
}
/** What is left to do for goal `i`, from the display (so the counters tick while the animals clear). */
function leftFor(gl: Goal, i: number, step: Step): number {
  if (gl.t === 'water' || gl.t === 'crate') {
    const want = gl.t === 'water' ? WATER : CRATE
    let n = 0
    for (let k = 0; k < dispType.length; k++) if (dispType[k] === want) n++
    return n
  }
  if (gl.t === 'net') return list.filter((s) => s.net && !s.dying).length
  if (gl.t === 'cage') return list.filter((s) => s.cage && !s.dying).length
  if (gl.t === 'score') return Math.max(0, gl.n - step.score)
  return Math.max(0, gl.n - (step.progress[i] ?? 0))
}

function playStep(step: Step, bonusStep = false) {
  // 1. clearing (and what the special stones do)
  phase(0.2, (p) => {
    const origins = step.effects.map((e) => e.idx)
    let maxDelay = 0
    for (const m of step.made) {
      const s = sprites.get(m.id)
      if (s) {
        s.special = m.special
        s.pop = 1
      }
      const c = cellXY(m.idx)
      burst(px(c.x), py(c.y), '#ffe27a', 14, 220, true)
      play('star', 0.8)
    }
    for (const e of step.effects) {
      const c = cellXY(e.idx)
      if (e.type === 'doveH' || e.type === 'doveV') {
        const horizontal = e.type === 'doveH'
        fxs.push({ type: 'bird', x0: horizontal ? c.x : c.x, y0: c.y, x1: horizontal ? g.cols + 0.5 : c.x, y1: horizontal ? c.y : g.rows + 0.5, t: 0, dur: 0.45, delay: 0 })
        fxs.push({ type: 'bird', x0: c.x, y0: c.y, x1: horizontal ? -1.5 : c.x, y1: horizontal ? c.y : -1.5, t: 0, dur: 0.45, delay: 0 })
        play('flip', 0.9)
      } else if (e.type === 'olive' || e.type === 'bigolive') {
        fxs.push({ type: 'ring', x0: c.x, y0: c.y, x1: e.type === 'olive' ? 2.6 : 4.2, y1: 0, t: 0, dur: 0.45, delay: 0 })
        play('snap', 0.9)
        if (e.type === 'bigolive') shake(1.2)
      } else if (e.type === 'cross' || e.type === 'bigcross') {
        fxs.push({ type: 'bird', x0: c.x, y0: c.y, x1: g.cols + 0.5, y1: c.y, t: 0, dur: 0.45, delay: 0 })
        fxs.push({ type: 'bird', x0: c.x, y0: c.y, x1: -1.5, y1: c.y, t: 0, dur: 0.45, delay: 0 })
        fxs.push({ type: 'bird', x0: c.x, y0: c.y, x1: c.x, y1: g.rows + 0.5, t: 0, dur: 0.45, delay: 0 })
        fxs.push({ type: 'bird', x0: c.x, y0: c.y, x1: c.x, y1: -1.5, t: 0, dur: 0.45, delay: 0 })
        shake(1.4)
        play('fanfare', 0.9)
      } else if (e.type === 'rainbow' || e.type === 'all') {
        e.cells.forEach((cellIdx, k) => {
          const d = cellXY(cellIdx)
          fxs.push({ type: 'beam', x0: c.x, y0: c.y, x1: d.x, y1: d.y, t: 0, dur: 0.4, hue: (k * 40) % 360, delay: k * 0.02 })
        })
        fxs.push({ type: 'flash', x0: 0, y0: 0, x1: 0, y1: 0, t: 0, dur: 0.4, delay: 0 })
        shake(1.3)
        play('fanfare', 0.9)
      } else if (e.type === 'hammer') {
        fxs.push({ type: 'hammer', x0: c.x, y0: c.y, x1: 0, y1: 0, t: 0, dur: 0.3, delay: 0 })
      }
    }
    for (const cl of step.clears) {
      const s = sprites.get(cl.id)
      if (!s) continue
      let delay = 0
      if (origins.length) {
        const ef = step.effects.find((e) => e.cells.includes(cl.idx))
        if (ef) {
          const o = cellXY(ef.idx)
          const d = cellXY(cl.idx)
          delay = ef.type === 'rainbow' || ef.type === 'all' ? ef.cells.indexOf(cl.idx) * 0.02 : (Math.abs(o.x - d.x) + Math.abs(o.y - d.y)) * 0.045
        }
      }
      s.dying = true
      s.dt = 0
      s.ddelay = delay
      maxDelay = Math.max(maxDelay, delay)
      const c = cellXY(cl.idx)
      burst(px(c.x), py(c.y), KIND_COLOR[cl.kind] ?? '#fff', 7 + step.cascade * 2)
      if (cl.cage) burst(px(c.x), py(c.y), '#d9a441', 10, 200, true)
    }
    for (const h of step.hits) {
      const c = cellXY(h.idx)
      if (h.what === 'net') {
        const s = spriteAt(h.idx)
        if (s) s.net = false
        burst(px(c.x), py(c.y), '#c99a55', 8)
        play('snap', 0.6)
      } else if (h.what === 'crate') {
        if (h.gone) {
          dispType[h.idx] = FLOOR
          cellPop[h.idx] = 0
          burst(px(c.x), py(c.y), '#b87a3a', 14, 300)
          play('clunk', 0.8)
        } else {
          dispHp[h.idx] = 1
          cellShake[h.idx] = 1
          burst(px(c.x), py(c.y), '#b87a3a', 6)
          play('hit', 0.7)
        }
      } else if (h.what === 'water') {
        dispType[h.idx] = FLOOR
        cellPop[h.idx] = 0
        burst(px(c.x), py(c.y), '#7fd0ee', 12, 240)
        play('right', 0.5)
      } else {
        dispType[h.idx] = FLOOR
        cellPop[h.idx] = 0
        burst(px(c.x), py(c.y), '#999', 12, 280)
        play('clunk', 0.8)
      }
    }
    if (step.clears.length) play('bead', 0.8, Math.min(1.7, 1 + 0.09 * (step.cascade - 1)))
    if (step.cascade >= 2 && !bonusStep) {
      const w = cheers.value
      say(w[Math.min(w.length - 1, step.cascade - 2)] ?? '', 0.9)
      if (step.cascade >= 3) shake(0.6)
    }
    if (step.clears.length >= 4 || step.points > 60) {
      const o = step.clears[0] ? cellXY(step.clears[0].idx) : { x: 0, y: 0 }
      if (step.points > 0 && step.clears[0]) fxs.push({ type: 'text', x0: o.x, y0: o.y, x1: 0, y1: 0, t: 0, dur: 0.8, text: `+${step.points}`, delay: 0 })
    }
    updateHud(step)
    p.dur = 0.22 + maxDelay + (step.effects.length ? 0.22 : 0)
  }, () => {
    for (const s of [...list]) if (s.dying) dropSprite(s)
  })
  // 2. everything falls and new animals come in
  phase(0.2, (p) => {
    let end = 0
    const spawnDelay = new Map<number, number>()
    for (const f of step.falls) {
      let s = sprites.get(f.id)
      if (!s) {
        s = newSprite(f.id, f.kind, f.special, f.cage, false, f.fc, f.fr)
        addSprite(s)
      }
      const dist = Math.hypot(f.tr - s.y, f.tc - s.x)
      if (dist < 0.01) continue
      const n = spawnDelay.get(f.fc) ?? 0
      const dl = f.spawned ? n * 0.035 : 0
      if (f.spawned) spawnDelay.set(f.fc, n + 1)
      const dur = 0.16 + 0.07 * Math.sqrt(dist)
      slide(s, f.tc, f.tr, dur, dl, 0)
      end = Math.max(end, dur + dl)
    }
    p.dur = Math.max(0.02, end + 0.1)
  }, () => {
    // the baskets that reached the bottom
    for (const col of step.collects) {
      const s = sprites.get(col.id)
      if (s) {
        const c = cellXY(col.idx)
        burst(px(c.x), py(c.y), '#ffd24d', 16, 260, true)
        s.dying = true
        s.dt = 0
        s.ddelay = 0
      }
    }
    if (step.collects.length) {
      play('coin', 0.9)
      hud.left = goals.value.map((gl, i) => leftFor(gl, i, step))
    }
  })
  if (step.collects.length) phase(0.25, undefined, () => { for (const s of [...list]) if (s.dying) dropSprite(s) })
}

function enqueueTurn(turn: Turn) {
  if (turn.swap && turn.ok) {
    const { a, b } = turn.swap
    phase(0.14, () => {
      const sa = spriteAt(a)
      const sb = spriteAt(b)
      if (sa) slide(sa, colOf(g, b), rowOf(g, b), 0.14, 0, 1)
      if (sb) slide(sb, colOf(g, a), rowOf(g, a), 0.14, 0, 1)
      play('tap', 0.7)
    })
  }
  for (const s of turn.steps) playStep(s)
  for (const f of turn.flood) {
    phase(0.5, () => {
      const s = sprites.get(f.id)
      if (s) {
        s.dying = true
        s.dt = 0
        s.ddelay = 0
      }
      dispType[f.idx] = WATER
      cellPop[f.idx] = 0
      const c = cellXY(f.idx)
      burst(px(c.x), py(c.y), '#7fd0ee', 14, 240)
      say(T('flood'), 0.9)
      play('wrong', 0.4)
    }, () => { for (const s of [...list]) if (s.dying) dropSprite(s) })
  }
  if (turn.shuffled) {
    const moves = turn.shuffled
    phase(0.6, () => {
      for (const m of moves) {
        const s = sprites.get(m.id)
        if (s) slide(s, colOf(g, m.to), rowOf(g, m.to), 0.5, 0, 1)
      }
      say(T('shuffled'), 1)
      play('flip', 0.9)
    })
  }
  updateAfter(turn)
}

function updateAfter(turn: Turn) {
  if (turn.phase === 'won') {
    phase(0.05, () => {
      say(T('bonus'), 1)
      play('fanfare', 0.8)
    })
    const extra = bonusSteps(g)
    for (const s of extra) playStep(s, true)
    phase(0.7, undefined, finish)
  } else if (turn.phase === 'lost') {
    phase(0.7, undefined, finish)
  } else {
    phase(0.01, undefined, () => {
      sync()
      updateHud(null)
      idle = 0
      hintPair = null
    })
  }
}

function finish() {
  sync()
  updateHud(null)
  const stars = starsFor(g)
  const old = levelStars.value[level.value] ?? 0
  outcome.phase = g.phase === 'won' ? 'won' : 'lost'
  outcome.stars = stars
  outcome.gained = []
  const deckBefore = chapterPairs(Math.floor(level.value / LEVELS_PER_CHAPTER))
  if (g.phase === 'won') {
    progress.record(ID, level.value, stars)
    const list2 = earned(level.value, stars, old)
    outcome.gained = list2
    Object.assign(stock, add({ ...stock }, list2))
    saveBoosters({ ...stock })
    outcome.newDeck = old === 0 && deckBefore + 1 >= LEVELS_PER_CHAPTER
    play('result')
  } else {
    outcome.newDeck = false
    play('wrong', 0.5)
  }
  screen.value = 'result'
}

// ── the screens ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
const TIP_LEVELS = [1, 3, 4, 5, 6, 7, 9, 11, 13, 21, 22]

function start(i: number) {
  level.value = i
  const lv = LEVELS[i]!
  g = newGame(lv)
  Object.assign(stock, topUp({ ...stock }))
  saveBoosters({ ...stock })
  phases = []
  fxs = []
  particles.length = 0
  banner = null
  selected = -1
  hintPair = null
  idle = 0
  mode.value = ''
  rebuild()
  updateHud(null)
  screen.value = 'play'
  how.value = !howSeen(ID)
  paused.value = how.value
  tip.value = ''
  if (!how.value) showTip()
  void nextTick(() => resize())
  music.playGame('memory')
}

function showTip() {
  const id = LEVELS[level.value]!.id
  if (!TIP_LEVELS.includes(id) || (levelStars.value[level.value] ?? 0) > 0) return
  const key = `app.bigGames.arche.tip${id}`
  if (!te(key)) return
  tip.value = t(key)
  window.setTimeout(() => (tip.value = ''), 7000)
}

function closeHow() {
  how.value = false
  markHowSeen(ID)
  paused.value = false
  showTip()
}

function toMenu() {
  screen.value = 'menu'
  paused.value = false
  chapterView.value = Math.floor(level.value / LEVELS_PER_CHAPTER)
}

function leave() {
  emit('leave')
}

function nextLevel() {
  if (level.value + 1 < LEVELS.length) start(level.value + 1)
  else toMenu()
}

// ── the touch ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
interface Down {
  idx: number
  x: number
  y: number
  done: boolean
}
let down: Down | null = null

function cellFromPoint(x: number, y: number): number {
  const c = Math.floor((x - bx) / cell)
  const r = Math.floor((y - by) / cell)
  if (c < 0 || r < 0 || c >= g.cols || r >= g.rows) return -1
  return r * g.cols + c
}
function local(e: PointerEvent) {
  const r = canvas.value!.getBoundingClientRect()
  return { x: e.clientX - r.left, y: e.clientY - r.top }
}

function onDown(e: PointerEvent) {
  if (screen.value !== 'play' || paused.value || busy() || g.phase !== 'play') return
  ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
  const p = local(e)
  idle = 0
  hintPair = null
  down = { idx: cellFromPoint(p.x, p.y), x: p.x, y: p.y, done: false }
}
function onMove(e: PointerEvent) {
  if (!down || down.done || down.idx < 0 || busy()) return
  const p = local(e)
  const dx = p.x - down.x
  const dy = p.y - down.y
  // a swipe: far enough (a third of a cell) and clearly in one direction
  if (Math.max(Math.abs(dx), Math.abs(dy)) < cell * 0.33) return
  down.done = true
  const horizontal = Math.abs(dx) > Math.abs(dy)
  const from = down.idx
  const c = colOf(g, from) + (horizontal ? Math.sign(dx) : 0)
  const r = rowOf(g, from) + (horizontal ? 0 : Math.sign(dy))
  if (c < 0 || r < 0 || c >= g.cols || r >= g.rows) return
  attempt(from, r * g.cols + c)
}
function onUp() {
  const d = down
  down = null
  if (!d || d.done || d.idx < 0 || busy() || screen.value !== 'play' || paused.value || g.phase !== 'play') return
  tap(d.idx)
}

function tap(idx: number) {
  if (mode.value === 'hammer') {
    const turn = boosterHammer(g, idx)
    if (!turn.ok) {
      play('wrong', 0.4)
      return
    }
    const left = spend({ ...stock }, 'hammer')
    if (left) Object.assign(stock, left)
    saveBoosters({ ...stock })
    mode.value = ''
    selected = -1
    enqueueTurn(turn)
    return
  }
  if (selected < 0) {
    if (canSwap(g, idx, idx + 1) || canSwap(g, idx, idx - 1) || canSwap(g, idx, idx + g.cols) || canSwap(g, idx, idx - g.cols) || mode.value === 'swap') {
      if (g.tiles[idx]) {
        selected = idx
        play('tap', 0.6)
      }
    } else play('wrong', 0.3)
    return
  }
  if (selected === idx) {
    selected = -1
    return
  }
  const from = selected
  selected = -1
  const adjacent = Math.abs(from - idx) === g.cols || (Math.abs(from - idx) === 1 && rowOf(g, from) === rowOf(g, idx))
  if (!adjacent) {
    // another animal that is not a neighbour: take it as the new one
    tap(idx)
    return
  }
  attempt(from, idx)
}

function attempt(a: number, b: number) {
  selected = -1
  if (mode.value === 'swap') {
    const turn = boosterSwap(g, a, b)
    if (!turn.ok) {
      play('wrong', 0.4)
      return
    }
    const left = spend({ ...stock }, 'swap')
    if (left) Object.assign(stock, left)
    saveBoosters({ ...stock })
    mode.value = ''
    enqueueTurn(turn)
    return
  }
  const turn = trySwap(g, a, b)
  if (!turn.swap) {
    // a netted or caged animal: it only trembles
    const s = spriteAt(a)
    if (s) s.shake = 1
    play('wrong', 0.35)
    return
  }
  if (!turn.ok) {
    // no row: the two swap and swap back
    const sa = spriteAt(a)
    const sb = spriteAt(b)
    phase(0.2, () => {
      if (sa) slide(sa, colOf(g, b), rowOf(g, b), 0.1, 0, 1)
      if (sb) slide(sb, colOf(g, a), rowOf(g, a), 0.1, 0, 1)
      play('wrong', 0.3)
    })
    phase(0.2, () => {
      if (sa) slide(sa, colOf(g, a), rowOf(g, a), 0.12, 0, 1)
      if (sb) slide(sb, colOf(g, b), rowOf(g, b), 0.12, 0, 1)
    })
    return
  }
  hud.moves = g.moves
  enqueueTurn(turn)
}

function useBooster(name: BoosterName) {
  if (screen.value !== 'play' || paused.value || busy() || g.phase !== 'play' || stock[name] <= 0) return
  selected = -1
  idle = 0
  hintPair = null
  play('button', 0.6)
  if (name === 'shuffle') {
    const turn = boosterShuffle(g)
    if (!turn.ok) return
    const left = spend({ ...stock }, 'shuffle')
    if (left) Object.assign(stock, left)
    saveBoosters({ ...stock })
    mode.value = ''
    enqueueTurn(turn)
    return
  }
  mode.value = mode.value === name ? '' : name
}

// ── the loop and the drawing ────────────────────────────────────────────────────────────────────────────────────────────────
function resize() {
  const c = canvas.value
  if (!c) return
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  const box = c.getBoundingClientRect()
  vw = box.width || window.innerWidth
  vh = box.height || window.innerHeight
  c.width = Math.round(vw * dpr)
  c.height = Math.round(vh * dpr)
  side.value = vw > vh && vh <= 560
  const hudR = hudEl.value?.getBoundingClientRect()
  const boostR = boostEl.value?.getBoundingClientRect()
  let left = 6
  let right = vw - 6
  let top = 6
  let bottom = vh - 6
  if (side.value) {
    left = (hudR?.right ?? 150) + 8
    right = (boostR?.left ?? vw - 80) - 8
  } else {
    top = (hudR?.bottom ?? 120) + 6
    bottom = (boostR?.top ?? vh - 90) - 6
  }
  const aw = Math.max(100, right - left)
  const ah = Math.max(100, bottom - top)
  const cols = g.cols
  const rows = g.rows
  cell = Math.max(24, Math.min(Math.floor(aw / (cols + 0.6)), Math.floor(ah / (rows + 0.6)), 104))
  ft = cell * 0.3
  bx = Math.round(left + (aw - cell * cols) / 2)
  by = Math.round(top + (ah - cell * rows) / 2)
}

const ease = (p: number) => 1 - Math.pow(1 - p, 3)
const easeIO = (p: number) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2)

function update(dt: number) {
  clock += dt
  runPhases(dt)
  for (const s of list) {
    if (s.moving) {
      if (s.delay > 0) s.delay -= dt
      else {
        s.mt += dt
        const p = Math.min(1, s.mt / s.md)
        const e = s.ease ? easeIO(p) : ease(p)
        s.x = s.fx + (s.tx - s.fx) * e
        s.y = s.fy + (s.ty - s.fy) * e
        if (p >= 1) {
          s.moving = false
          s.x = s.tx
          s.y = s.ty
          if (!s.ease) s.squash = 1
        }
      }
    }
    if (s.pop > 0) s.pop = Math.max(0, s.pop - dt * 3)
    if (s.squash > 0) s.squash = Math.max(0, s.squash - dt * 5)
    if (s.shake > 0) s.shake = Math.max(0, s.shake - dt * 4)
    if (s.dying) {
      if (s.ddelay > 0) s.ddelay -= dt
      else s.dt += dt
    }
  }
  for (let i = 0; i < cellPop.length; i++) {
    if ((cellPop[i] ?? 1) < 1) cellPop[i] = Math.min(1, (cellPop[i] ?? 0) + dt * 4)
    if ((cellShake[i] ?? 0) > 0) cellShake[i] = Math.max(0, (cellShake[i] ?? 0) - dt * 3)
  }
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]!
    p.t += dt
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.vy += 700 * dt
    if (p.t >= p.life) particles.splice(i, 1)
  }
  for (let i = fxs.length - 1; i >= 0; i--) {
    const f = fxs[i]!
    if (f.delay > 0) f.delay -= dt
    else f.t += dt
    if (f.t >= f.dur) fxs.splice(i, 1)
  }
  if (banner) {
    banner.t += dt
    if (banner.t >= banner.dur) banner = null
  }
  if (shakeT > 0) shakeT = Math.max(0, shakeT - dt)
  // a hint after a while of waiting
  if (screen.value === 'play' && !paused.value && !busy() && g.phase === 'play' && !down && mode.value === '') {
    idle += dt
    if (idle > 5 && !hintPair) hintPair = hint(g)
  }
}

function frame(now: number) {
  raf = requestAnimationFrame(frame)
  const dt = Math.min(0.033, (now - last) / 1000 || 0)
  last = now
  if (screen.value === 'play' && !paused.value) update(dt)
  draw()
}

function fitDraw(c: CanvasRenderingContext2D, name: string, cx: number, cy: number, box: number, sx = 1, sy = 1, rot = 0, alpha = 1) {
  const i = img[name]
  if (!i) return
  const k = Math.min(box / i.width, box / i.height)
  const w = i.width * k
  const h = i.height * k
  c.save()
  c.globalAlpha = alpha
  c.translate(cx, cy)
  if (rot) c.rotate(rot)
  c.scale(sx, sy)
  c.drawImage(i, -w / 2, -h / 2, w, h)
  c.restore()
}

/** A frame made of nine pieces: the corners stay as they are, the sides are stretched. */
function drawFrame(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number) {
  const i = img.rahmen
  if (!i) return
  const s = i.width * 0.12
  const iw = i.width
  const ih = i.height
  c.drawImage(i, 0, 0, s, s, x, y, t, t)
  c.drawImage(i, iw - s, 0, s, s, x + w - t, y, t, t)
  c.drawImage(i, 0, ih - s, s, s, x, y + h - t, t, t)
  c.drawImage(i, iw - s, ih - s, s, s, x + w - t, y + h - t, t, t)
  c.drawImage(i, s, 0, iw - 2 * s, s, x + t, y, w - 2 * t, t)
  c.drawImage(i, s, ih - s, iw - 2 * s, s, x + t, y + h - t, w - 2 * t, t)
  c.drawImage(i, 0, s, s, ih - 2 * s, x, y + t, t, h - 2 * t)
  c.drawImage(i, iw - s, s, s, ih - 2 * s, x + w - t, y + t, t, h - 2 * t)
}

function glowAt(c: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, a: number) {
  const gr = c.createRadialGradient(x, y, 0, x, y, r)
  gr.addColorStop(0, color)
  gr.addColorStop(1, 'rgba(255,255,255,0)')
  c.globalAlpha = a
  c.fillStyle = gr
  c.beginPath()
  c.arc(x, y, r, 0, Math.PI * 2)
  c.fill()
  c.globalAlpha = 1
}

function drawTile(c: CanvasRenderingContext2D, s: Sprite) {
  let a = 1
  let sc = 1 + 0.22 * s.pop
  if (s.dying) {
    if (s.ddelay > 0) sc = 1
    else {
      const p = Math.min(1, s.dt / 0.2)
      sc = p < 0.25 ? 1 + p * 0.8 : Math.max(0, 1.2 * (1 - (p - 0.25) / 0.75))
      a = 1 - Math.max(0, (p - 0.5) * 2)
    }
  }
  if (sc <= 0.01 || a <= 0.01) return
  let cx = px(s.x + 0.5)
  let cy = py(s.y + 0.5)
  if (s.shake > 0) cx += Math.sin(s.shake * 40) * cell * 0.06 * s.shake
  const isHint = hintPair && (hintPair.a === Math.round(s.ty) * g.cols + Math.round(s.tx) || hintPair.b === Math.round(s.ty) * g.cols + Math.round(s.tx))
  if (isHint) {
    const w = Math.sin(clock * 9)
    cy += w * cell * 0.05
    sc *= 1 + 0.06 * Math.abs(w)
  }
  const sx = sc * (1 + 0.1 * s.squash)
  const sy = sc * (1 - 0.13 * s.squash)
  c.globalAlpha = a
  // a soft shadow
  c.fillStyle = 'rgba(40,20,0,0.16)'
  c.beginPath()
  c.ellipse(cx, cy + cell * 0.36, cell * 0.3 * sc, cell * 0.08 * sc, 0, 0, Math.PI * 2)
  c.fill()
  if (s.kind === BASKET) {
    fitDraw(c, 'hi-korb', cx, cy, cell * 0.94, sx, sy, 0, a)
  } else if (s.special === RAINBOW) {
    glowAt(c, cx, cy, cell * 0.7, 'rgba(255,255,210,0.9)', 0.55 + 0.25 * Math.sin(clock * 5))
    fitDraw(c, 'sp-regenbogen', cx, cy, cell * 1.0, sx, sy, 0, a)
  } else {
    if (s.special !== 0) glowAt(c, cx, cy, cell * 0.66, s.special === OLIVE ? 'rgba(190,255,150,0.95)' : 'rgba(255,240,150,0.95)', 0.5 + 0.25 * Math.sin(clock * 5 + s.id))
    fitDraw(c, `tier-${KIND_NAMES[s.kind] ?? 'schaf'}`, cx, cy, cell * (s.special ? 0.8 : 0.9), sx, sy, 0, a)
    if (s.special === DOVE_H || s.special === DOVE_V) {
      fitDraw(c, 'sp-taube', cx + cell * 0.22, cy + cell * 0.2, cell * 0.46, sx, sy, 0, a)
      // two little arrows show the way it flies
      c.fillStyle = 'rgba(255,214,70,0.95)'
      const horizontal = s.special === DOVE_H
      const k = cell * 0.09
      for (const d of [-1, 1]) {
        c.beginPath()
        if (horizontal) {
          const ax = cx + d * cell * 0.46
          c.moveTo(ax, cy - k)
          c.lineTo(ax + d * k * 1.4, cy)
          c.lineTo(ax, cy + k)
        } else {
          const ay = cy + d * cell * 0.46
          c.moveTo(cx - k, ay)
          c.lineTo(cx, ay + d * k * 1.4)
          c.lineTo(cx + k, ay)
        }
        c.closePath()
        c.fill()
      }
    } else if (s.special === OLIVE) fitDraw(c, 'sp-oelzweig', cx + cell * 0.22, cy + cell * 0.2, cell * 0.46, sx, sy, 0, a)
  }
  if (s.net) fitDraw(c, 'hi-netz', cx, cy, cell * 1.0, 1, 1, 0, 0.95)
  if (s.cage) fitDraw(c, 'hi-kaefig', cx, cy, cell * 1.0, 1, 1, 0, 0.97)
  c.globalAlpha = 1
}

function draw() {
  const c = ctx
  if (!c || !vw) return
  c.setTransform(dpr, 0, 0, dpr, 0, 0)
  c.fillStyle = '#26364a'
  c.fillRect(0, 0, vw, vh)
  const chap = screen.value === 'play' ? LEVELS[level.value]!.chapter : 0
  const bg = img[`szene-${chap + 1}`]
  if (bg) {
    const k = Math.max(vw / bg.width, vh / bg.height)
    const w = bg.width * k
    const h = bg.height * k
    c.drawImage(bg, (vw - w) / 2, (vh - h) / 2, w, h)
  }
  if (screen.value !== 'play') {
    c.fillStyle = 'rgba(12,22,34,0.35)'
    c.fillRect(0, 0, vw, vh)
    return
  }
  c.fillStyle = 'rgba(12,22,34,0.2)'
  c.fillRect(0, 0, vw, vh)
  const ox = shakeT > 0 ? (Math.random() - 0.5) * 6 * shakeT : 0
  const oy = shakeT > 0 ? (Math.random() - 0.5) * 6 * shakeT : 0
  c.save()
  c.translate(ox, oy)
  const bw = cell * g.cols
  const bh = cell * g.rows
  // the plate under the board and the frame
  c.fillStyle = 'rgba(60,34,12,0.55)'
  c.fillRect(bx - ft * 0.4, by - ft * 0.4, bw + ft * 0.8, bh + ft * 0.8)
  for (let r = 0; r < g.rows; r++) {
    for (let col = 0; col < g.cols; col++) {
      const idx = r * g.cols + col
      if (dispType[idx] === VOID) continue
      const tex = img[(r + col) % 2 ? 'feld-dunkel' : 'feld-hell']
      c.globalAlpha = 0.5
      if (tex) c.drawImage(tex, bx + col * cell + 1, by + r * cell + 1, cell - 2, cell - 2)
      else {
        c.fillStyle = (r + col) % 2 ? 'rgba(255,230,180,0.5)' : 'rgba(255,240,205,0.6)'
        c.fillRect(bx + col * cell + 1, by + r * cell + 1, cell - 2, cell - 2)
      }
      c.globalAlpha = 1
    }
  }
  drawFrame(c, bx - ft, by - ft, bw + 2 * ft, bh + 2 * ft, ft)
  // the obstacles on their cells
  for (let r = 0; r < g.rows; r++) {
    for (let col = 0; col < g.cols; col++) {
      const idx = r * g.cols + col
      const ty = dispType[idx]
      if (ty === FLOOR || ty === VOID || ty === undefined) continue
      const cx = bx + (col + 0.5) * cell + (cellShake[idx]! > 0 ? Math.sin(cellShake[idx]! * 50) * cell * 0.05 : 0)
      const cy = by + (r + 0.5) * cell
      const pop = cellPop[idx] ?? 1
      if (ty === WATER) {
        const bob = Math.sin(clock * 2 + col * 0.9 + r) * cell * 0.015
        fitDraw(c, 'hi-wasser', cx, cy + bob, cell * 1.04, pop, pop, 0, 0.95)
      } else if (ty === CRATE) fitDraw(c, dispHp[idx] === 1 ? 'hi-kiste-riss' : 'hi-kiste', cx, cy, cell * 0.98)
      else if (ty === STONE) fitDraw(c, 'hi-fels', cx, cy, cell * 1.0)
    }
  }
  if (selected >= 0) {
    const cx = bx + (colOf(g, selected) + 0.5) * cell
    const cy = by + (rowOf(g, selected) + 0.5) * cell
    c.strokeStyle = `rgba(255,236,130,${0.7 + 0.3 * Math.sin(clock * 8)})`
    c.lineWidth = Math.max(3, cell * 0.07)
    c.beginPath()
    c.roundRect(cx - cell * 0.47, cy - cell * 0.47, cell * 0.94, cell * 0.94, cell * 0.16)
    c.stroke()
  }
  // the animals only show inside the frame (new ones come in from above it)
  c.save()
  c.beginPath()
  c.rect(bx - 2, by - 2, bw + 4, bh + 4)
  c.clip()
  for (const s of list) if (!s.dying) drawTile(c, s)
  for (const s of list) if (s.dying) drawTile(c, s)
  c.restore()
  // the effects
  for (const f of fxs) {
    if (f.delay > 0) continue
    const p = f.t / f.dur
    if (f.type === 'bird') {
      const x = f.x0 + (f.x1 - f.x0) * ease(p)
      const y = f.y0 + (f.y1 - f.y0) * ease(p)
      glowAt(c, px(x), py(y), cell * 0.7, 'rgba(255,250,200,0.9)', 0.6 * (1 - p))
      fitDraw(c, 'sp-taube', px(x), py(y), cell * 1.0, 1, 1, 0, 1 - p * 0.3)
    } else if (f.type === 'ring') {
      c.strokeStyle = `rgba(190,255,150,${0.9 * (1 - p)})`
      c.lineWidth = cell * 0.18 * (1 - p) + 2
      c.beginPath()
      c.arc(px(f.x0), py(f.y0), cell * f.x1 * ease(p), 0, Math.PI * 2)
      c.stroke()
    } else if (f.type === 'beam') {
      c.strokeStyle = `hsla(${(f.hue ?? 0) + clock * 200},95%,62%,${0.9 * (1 - p)})`
      c.lineWidth = cell * 0.12
      c.lineCap = 'round'
      c.beginPath()
      c.moveTo(px(f.x0), py(f.y0))
      c.lineTo(px(f.x0 + (f.x1 - f.x0) * Math.min(1, p * 2)), py(f.y0 + (f.y1 - f.y0) * Math.min(1, p * 2)))
      c.stroke()
    } else if (f.type === 'flash') {
      c.fillStyle = `rgba(255,255,230,${0.45 * (1 - p)})`
      c.fillRect(bx - ft, by - ft, bw + 2 * ft, bh + 2 * ft)
    } else if (f.type === 'text') {
      c.globalAlpha = 1 - p
      c.fillStyle = '#fff6c8'
      c.strokeStyle = 'rgba(80,40,0,0.8)'
      c.lineWidth = 4
      c.font = `800 ${Math.round(cell * 0.4)}px "Source Sans 3", sans-serif`
      c.textAlign = 'center'
      c.strokeText(f.text ?? '', px(f.x0), py(f.y0 - p * 0.8))
      c.fillText(f.text ?? '', px(f.x0), py(f.y0 - p * 0.8))
      c.globalAlpha = 1
    } else if (f.type === 'hammer') {
      glowAt(c, px(f.x0), py(f.y0), cell * (0.5 + p), 'rgba(255,220,120,0.9)', 0.8 * (1 - p))
      // the hammer swings down onto the cell
      fitDraw(c, 'b-hammer', px(f.x0 + 0.35), py(f.y0 - 0.35 + 0.35 * ease(Math.min(1, p * 2))), cell * 0.9, 1, 1, -0.9 + 0.9 * ease(Math.min(1, p * 2)), 1 - Math.max(0, p - 0.6) * 2.5)
    }
  }
  for (const p of particles) {
    const k = 1 - p.t / p.life
    c.globalAlpha = Math.max(0, k)
    c.fillStyle = p.color
    c.beginPath()
    c.arc(p.x, p.y, p.size * k, 0, Math.PI * 2)
    c.fill()
  }
  c.globalAlpha = 1
  c.restore()
  // the banner with the cheer
  if (banner) {
    const p = banner.t / banner.dur
    const pop = p < 0.18 ? ease(p / 0.18) * 1.12 : p < 0.28 ? 1.12 - 0.12 * ((p - 0.18) / 0.1) : 1
    const fade = p > 0.8 ? 1 - (p - 0.8) / 0.2 : 1
    const bi = img.banner
    const w = Math.min(vw * 0.84, 460) * pop
    const h = bi ? (bi.height / bi.width) * w : w * 0.3
    const cx = vw / 2
    const cy = by + (cell * g.rows) / 2
    c.globalAlpha = fade
    if (bi) c.drawImage(bi, cx - w / 2, cy - h / 2, w, h)
    c.font = `800 ${Math.round(w * 0.12)}px "Fraunces", "Source Sans 3", serif`
    c.textAlign = 'center'
    c.textBaseline = 'middle'
    c.lineWidth = 5
    c.strokeStyle = 'rgba(90,20,0,0.85)'
    c.fillStyle = '#fff8dc'
    c.strokeText(banner.text, cx, cy - h * 0.08)
    c.fillText(banner.text, cx, cy - h * 0.08)
    c.globalAlpha = 1
  }
}

// ── the page ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const goalIcon = (gl: Goal): string => {
  if (gl.t === 'kind') return pic(`tier-${KIND_NAMES[gl.kind ?? 0]}`)
  const names: Record<string, string> = { dove: 'sp-taube', olive: 'sp-oelzweig', rainbow: 'sp-regenbogen', water: 'hi-wasser', crate: 'hi-kiste', net: 'hi-netz', cage: 'hi-kaefig', basket: 'hi-korb' }
  return names[gl.t] ? pic(names[gl.t]!) : ''
}
const goalLabel = (gl: Goal): string => (gl.t === 'kind' ? `${T('goalNames.kind')}: ${T(`animals.${KIND_NAMES[gl.kind ?? 0]}`)}` : T(`goalNames.${gl.t}`))
const boosterPic = (b: BoosterName) => pic(b === 'hammer' ? 'b-hammer' : b === 'swap' ? 'b-tausch' : 'b-mischen')
const resultText = computed(() => {
  if (outcome.phase !== 'won') return T('lost')
  if (level.value === LEVELS.length - 1) return T('newLand')
  return T('won')
})
const pairKind = computed(() => KIND_NAMES[PAIR_KIND(level.value)] ?? 'schaf')
const heroSrc = computed(() => pic(`szene-${chapterView.value + 1}`))
const hideBroken = (e: Event) => {
  ;(e.target as HTMLElement).style.display = 'none'
}
const pickChapter = (c: number) => {
  chapterView.value = c
  play('button', 0.5)
}
const startFirstOpen = () => start(firstOpen())

let bodyOverflow = ''
onMounted(async () => {
  bodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  ctx = canvas.value?.getContext('2d') ?? null
  resize()
  window.addEventListener('resize', resize)
  await loadAll()
  last = performance.now()
  raf = requestAnimationFrame(frame)
  // with `?probe=1` the game can be looked at and played from the console (for the tests)
  if (window.location.hash.includes('probe=1')) {
    ;(window as unknown as { __arche?: unknown }).__arche = {
      get g() {
        return g
      },
      start,
      /** Runs the animations on (the pane of the editor draws no frames by itself). */
      advance(sec: number) {
        for (let k = 0; k < Math.ceil(sec / 0.016); k++) update(0.016)
        draw()
      },
      swap: attempt,
      get busy() {
        return busy()
      },
      get screen() {
        return screen.value
      }
    }
  }
})
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  music.stop('game')
  window.removeEventListener('resize', resize)
  document.body.style.overflow = bodyOverflow
})
</script>

<template lang="pug">
  div(class="ag")
    canvas(
      ref="canvas"
      class="ag-canvas"
      :aria-label="T('board')"
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onUp"
    )

    div(v-if="!loaded" class="ag-center")
      div(class="ag-spinner")

    //- the overview of the ark: landscape, pairs on board, levels
    div(v-else-if="screen === 'menu'" class="ag-menu")
      div(class="ag-card ag-card--wide")
        h1(class="ag-title") {{ T('title') }}
        p(class="ag-ref") {{ T('ref') }}
        div(class="ag-hero")
          img(:src="heroSrc" alt="" class="ag-hero-img" @error="hideBroken")
          div(class="ag-hero-label")
            span(class="ag-hero-chapter") {{ chapterNames[chapterView] }}
            span(class="ag-hero-ref") {{ chapterRefs[chapterView] }}
        div(class="ag-deck" :class="{ 'is-full': chapterPairs(chapterView) >= 10 }")
          span(class="ag-deck-title") {{ T('deck', { n: chapterView + 1 }) }}
            span(v-if="chapterPairs(chapterView) >= 10" class="ag-deck-full")  · {{ T('deckFull') }}
          div(class="ag-deck-slots")
            div(v-for="(s, i) in deckSlots" :key="i" :class="['ag-slot', { 'is-on': s.on }]")
              img(:src="pic(`tier-${KIND_NAMES[s.kind]}`)" alt="" class="ag-slot-img" @error="hideBroken")
              img(v-if="s.on" :src="pic(`tier-${KIND_NAMES[s.kind]}`)" alt="" class="ag-slot-img ag-slot-img--two" @error="hideBroken")
        p(class="ag-pairs") {{ T('pairsOnBoard', { n: pairs, max: LEVELS.length }) }}
        p(v-if="allWon" class="ag-newland") {{ T('newLandTitle') }}: {{ T('newLand') }}
        div(class="ag-chapters")
          button(
            v-for="c in CHAPTER_COUNT"
            :key="c"
            type="button"
            :class="['ag-chip', { 'is-on': chapterView === c - 1 }]"
            :aria-label="chapterNames[c - 1]"
            @click="pickChapter(c - 1)"
          )
            span(class="ag-chip-no") {{ c }}
            span(class="ag-chip-n") {{ chapterPairs(c - 1) }}/10
        div(class="ag-levels")
          button(v-for="i in levelsOfChapter" :key="i" type="button" class="ag-level" :data-test="`arche-level-${i + 1}`" @click="start(i)")
            span(class="ag-level-no") {{ i + 1 }}
            AdventureStars(:stars="levelStars[i] ?? 0" :size="16")
        p(class="ag-rules") {{ T('starRules') }}
        div(class="ag-menu-buttons")
          AdvButton(data-test="arche-play" @click="startFirstOpen") {{ levelTitle(firstOpen()) }}
          AdvButton(tone="blau" small data-test="arche-how" @click="how = true") {{ T('howTitle') }}
          AdvButton(tone="blau" small @click="leave") {{ T('leave') }}

    //- the game
    template(v-else-if="screen === 'play'")
      div(ref="hudEl" :class="['ag-hud', { 'is-side': side }]")
        div(class="ag-hud-top")
          button(type="button" class="ag-btn" :aria-label="T('pause')" data-test="arche-pause" @click="paused = true") ❚❚
          span(class="ag-level-label") {{ levelTitle(level) }}
          div(class="ag-moves" :aria-label="T('moves')")
            span(class="ag-moves-n" :key="hud.moves") {{ hud.moves }}
            span(class="ag-moves-t") {{ T('moves') }}
        div(class="ag-goals")
          div(v-for="(gl, i) in goals" :key="i" :class="['ag-goal', { 'is-done': (hud.left[i] ?? 1) === 0 }]" :title="goalLabel(gl)")
            img(v-if="goalIcon(gl)" :src="goalIcon(gl)" alt="" class="ag-goal-img" @error="hideBroken")
            span(v-else class="ag-goal-score") ★
            span(class="ag-goal-n" :key="hud.left[i]") {{ (hud.left[i] ?? 1) === 0 ? '✓' : hud.left[i] }}
      div(ref="boostEl" :class="['ag-boost', { 'is-side': side }]")
        button(
          v-for="b in BOOSTERS"
          :key="b"
          type="button"
          :class="['ag-boost-btn', { 'is-on': mode === b, 'is-empty': stock[b] <= 0 }]"
          :aria-label="T(`boosterNames.${b}`)"
          :data-test="`arche-booster-${b}`"
          @click="useBooster(b)"
        )
          img(:src="boosterPic(b)" alt="" class="ag-boost-img" @error="hideBroken")
          span(class="ag-boost-n") {{ stock[b] }}
      div(v-if="mode" class="ag-mode")
        span {{ mode === 'hammer' ? T('hammerHint') : T('swapHint') }}
        button(type="button" class="ag-mode-x" @click="mode = ''") {{ T('cancel') }}
      div(v-if="tip && !mode" class="ag-tip") {{ tip }}

      div(v-if="paused && !how" class="ag-menu ag-menu--dim")
        div(class="ag-card ag-card--small")
          h2(class="ag-title") {{ T('pause') }}
          AdvButton(data-test="arche-resume" @click="paused = false") {{ T('resume') }}
          AdvButton(tone="blau" @click="start(level)") {{ T('again') }}
          AdvButton(tone="blau" @click="toMenu") {{ T('menu') }}

    //- the end of a round
    div(v-else-if="screen === 'result'" class="ag-menu ag-menu--dim")
      div(class="ag-card ag-card--small")
        h2(class="ag-title") {{ levelTitle(level) }}
        AdventureStars(:stars="outcome.stars" :size="56" celebrate)
        div(v-if="outcome.phase === 'won'" class="ag-pair")
          img(:src="pic(`tier-${pairKind}`)" alt="" class="ag-pair-img" @error="hideBroken")
          img(:src="pic(`tier-${pairKind}`)" alt="" class="ag-pair-img" @error="hideBroken")
        p(class="ag-text") {{ resultText }}
        p(v-if="outcome.newDeck" class="ag-text ag-text--strong") {{ T('deckFull') }}
        p(v-if="outcome.gained.length" class="ag-text") {{ T('newHelpers') }}
        div(v-if="outcome.gained.length" class="ag-gained")
          img(v-for="(b, i) in outcome.gained" :key="i" :src="boosterPic(b)" alt="" class="ag-gained-img" @error="hideBroken")
        AdvButton(v-if="outcome.phase === 'won' && level < LEVELS.length - 1" data-test="arche-next" @click="nextLevel") {{ T('next') }}
        AdvButton(:tone="outcome.phase === 'won' && level < LEVELS.length - 1 ? 'blau' : 'gold'" data-test="arche-again" @click="start(level)") {{ T('again') }}
        AdvButton(tone="blau" @click="toMenu") {{ T('menu') }}

    //- the explanation (once, then from the question mark)
    div(v-if="how && loaded" class="ag-menu ag-menu--dim")
      div(class="ag-card ag-how")
        h2(class="ag-title") {{ T('howTitle') }}
        p(class="ag-text") {{ T('intro') }}
        div(class="ag-how-row")
          img(:src="pic('tier-schaf')" alt="" class="ag-how-img" @error="hideBroken")
          img(:src="pic('tier-schaf')" alt="" class="ag-how-img" @error="hideBroken")
          img(:src="pic('tier-schaf')" alt="" class="ag-how-img" @error="hideBroken")
        p(class="ag-how-line") {{ T('howSwap') }}
        p(class="ag-how-line") {{ T('howRow') }}
        div(class="ag-how-row")
          img(:src="pic('sp-taube')" alt="" class="ag-how-img" @error="hideBroken")
          img(:src="pic('sp-oelzweig')" alt="" class="ag-how-img" @error="hideBroken")
          img(:src="pic('sp-regenbogen')" alt="" class="ag-how-img" @error="hideBroken")
        p(class="ag-how-line") {{ T('howSpecial') }}
        p(class="ag-how-line") {{ T('howGoal') }}
        p(class="ag-how-line") {{ T('howHelp') }}
        AdvButton(data-test="arche-go" @click="closeHow") {{ T('go') }}
</template>

<style scoped lang="sass">
.ag
  position: fixed
  inset: 0
  z-index: 60
  background: #26364a
  overflow: hidden
  user-select: none
  -webkit-user-select: none
  touch-action: none

.ag-canvas
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  touch-action: none

.ag-center
  position: absolute
  inset: 0
  display: grid
  place-items: center

.ag-spinner
  width: 46px
  height: 46px
  border-radius: 50%
  border: 5px solid rgba(255, 255, 255, 0.25)
  border-top-color: #f5c84a
  animation: ag-spin 0.9s linear infinite

@keyframes ag-spin
  to
    transform: rotate(360deg)

@keyframes ag-pop
  0%
    transform: scale(1.5)
  100%
    transform: scale(1)

.ag-menu
  position: absolute
  inset: 0
  display: grid
  place-items: start center
  padding: 14px
  overflow-y: auto
  background: linear-gradient(180deg, rgba(10, 20, 30, 0.25), rgba(10, 20, 30, 0.5))

  &--dim
    place-items: center
    background: rgba(10, 16, 26, 0.62)

.ag-card
  width: min(560px, 100%)
  padding: 18px 18px 16px
  border-radius: 24px
  background: var(--lk-surface, #fffaf0)
  color: var(--lk-text, #2a2418)
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.45)
  display: flex
  flex-direction: column
  align-items: center
  gap: 10px
  text-align: center

  &--small
    width: min(420px, 100%)

.ag-title
  margin: 0
  font-size: 1.55rem
  font-weight: 800

.ag-ref
  margin: -6px 0 0
  font-weight: 700
  color: var(--lk-muted, #7a6b4f)

.ag-text
  margin: 0
  line-height: 1.4

  &--strong
    font-weight: 800

.ag-hero
  position: relative
  width: 100%
  aspect-ratio: 3 / 2
  max-height: 40vh
  border-radius: 18px
  overflow: hidden
  background: #3c4f66

.ag-hero-img
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  object-fit: cover
  object-position: center 70%

.ag-hero-label
  position: absolute
  left: 10px
  bottom: 8px
  display: flex
  flex-direction: column
  align-items: flex-start
  padding: 6px 12px
  border-radius: 14px
  background: rgba(255, 250, 235, 0.88)
  font-weight: 800

.ag-hero-ref
  font-size: 0.75rem
  font-weight: 600
  color: var(--lk-muted, #7a6b4f)

.ag-deck
  width: 100%
  padding: 8px 8px 10px
  border-radius: 16px
  background: var(--lk-surface-2, #f6efdc)
  border: 2px solid var(--lk-line, #e3d7bb)

  &.is-full
    border-color: #e6b030
    background: #fdf0c8

.ag-deck-title
  font-size: 0.85rem
  font-weight: 800

.ag-deck-slots
  display: grid
  grid-template-columns: repeat(10, minmax(0, 1fr))
  gap: 3px
  margin-top: 6px

.ag-slot
  position: relative
  aspect-ratio: 1
  display: grid
  place-items: center
  opacity: 0.3
  filter: grayscale(1) brightness(0.55)

  &.is-on
    opacity: 1
    filter: none

.ag-slot-img
  position: absolute
  width: 78%
  height: 78%
  object-fit: contain

  &--two
    transform: translate(18%, 12%) scale(0.75)

.ag-pairs
  margin: 0
  font-weight: 800

.ag-newland
  margin: 0
  padding: 8px 12px
  border-radius: 12px
  background: #fdf0c8
  font-weight: 700
  font-size: 0.9rem

.ag-chapters
  display: grid
  grid-template-columns: repeat(6, minmax(0, 1fr))
  gap: 6px
  width: 100%

.ag-chip
  display: flex
  flex-direction: column
  align-items: center
  padding: 6px 2px
  min-height: 48px
  border: 2px solid var(--lk-line, #e3d7bb)
  border-radius: 14px
  background: var(--lk-surface-2, #f6efdc)
  color: inherit
  font: inherit
  cursor: pointer

  &.is-on
    border-color: #e6b030
    background: #fdf0c8

.ag-chip-no
  font-weight: 800

.ag-chip-n
  font-size: 0.7rem
  color: var(--lk-muted, #7a6b4f)

.ag-levels
  display: grid
  grid-template-columns: repeat(5, minmax(0, 1fr))
  gap: 8px
  width: 100%

.ag-level
  display: flex
  flex-direction: column
  align-items: center
  gap: 4px
  padding: 8px 2px
  min-height: 56px
  border: 2px solid var(--lk-line, #e3d7bb)
  border-radius: 16px
  background: var(--lk-surface-2, #f6efdc)
  color: inherit
  font: inherit
  cursor: pointer

.ag-level-no
  display: grid
  place-items: center
  width: 30px
  height: 30px
  border-radius: 50%
  background: var(--lk-accent, #1f6a6a)
  color: var(--lk-on-accent, #fff)
  font-weight: 800

.ag-rules
  margin: 0
  font-size: 0.82rem
  color: var(--lk-muted, #7a6b4f)

.ag-menu-buttons
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 10px

.ag-hud
  position: absolute
  top: 0
  left: 0
  right: 0
  display: flex
  flex-direction: column
  gap: 6px
  padding: max(8px, env(safe-area-inset-top)) max(10px, env(safe-area-inset-right)) 6px max(10px, env(safe-area-inset-left))
  pointer-events: none

  &.is-side
    right: auto
    bottom: 0
    width: 150px
    justify-content: flex-start

.ag-hud > *
  pointer-events: auto

.ag-hud-top
  display: flex
  align-items: center
  justify-content: space-between
  gap: 8px

.ag-hud.is-side .ag-hud-top
  flex-wrap: wrap

.ag-btn
  width: 48px
  height: 48px
  border: none
  border-radius: 50%
  background: rgba(255, 255, 255, 0.9)
  color: #2a2418
  font-weight: 800
  cursor: pointer

.ag-level-label
  padding: 6px 14px
  border-radius: 14px
  background: rgba(255, 255, 255, 0.85)
  font-weight: 800
  color: #2a2418

.ag-moves
  display: flex
  flex-direction: column
  align-items: center
  min-width: 64px
  padding: 4px 12px
  border-radius: 14px
  background: rgba(255, 244, 214, 0.95)
  color: #4a2a08
  font-weight: 800
  line-height: 1.05

.ag-moves-n
  font-size: 1.5rem
  animation: ag-pop 0.25s ease-out

.ag-moves-t
  font-size: 0.65rem
  text-transform: uppercase
  letter-spacing: 0.04em

.ag-goals
  display: flex
  flex-wrap: wrap
  gap: 6px
  justify-content: center
  padding: 5px 8px
  border-radius: 16px
  background: rgba(40, 24, 8, 0.55)

.ag-goal
  display: flex
  align-items: center
  gap: 4px
  padding: 2px 8px 2px 4px
  border-radius: 999px
  background: rgba(255, 248, 225, 0.94)
  color: #3a2208
  font-weight: 800

  &.is-done
    background: #d5f0b8

.ag-goal-img
  width: 30px
  height: 30px
  object-fit: contain

.ag-goal-score
  width: 30px
  text-align: center
  font-size: 1.3rem

.ag-goal-n
  min-width: 22px
  text-align: center
  font-size: 1.15rem
  animation: ag-pop 0.25s ease-out

.ag-boost
  position: absolute
  left: 0
  right: 0
  bottom: 0
  display: flex
  justify-content: center
  gap: 18px
  padding: 6px 10px max(10px, env(safe-area-inset-bottom))

  &.is-side
    left: auto
    top: 0
    width: 84px
    flex-direction: column
    justify-content: center
    align-items: center
    padding: 6px max(8px, env(safe-area-inset-right)) 6px 6px

.ag-boost-btn
  position: relative
  width: 64px
  height: 64px
  padding: 0
  border: none
  border-radius: 50%
  background: transparent
  cursor: pointer

  &.is-on
    filter: drop-shadow(0 0 10px #ffe27a)
    transform: scale(1.1)

  &.is-empty
    opacity: 0.4
    filter: grayscale(1)

.ag-boost-img
  width: 100%
  height: 100%
  object-fit: contain
  pointer-events: none

.ag-boost-n
  position: absolute
  right: -4px
  bottom: -2px
  min-width: 24px
  height: 24px
  padding: 0 5px
  border-radius: 12px
  background: #2a2418
  color: #fff6dc
  font-weight: 800
  font-size: 0.85rem
  line-height: 24px

.ag-mode
  position: absolute
  left: 50%
  bottom: 88px
  transform: translateX(-50%)
  display: flex
  align-items: center
  gap: 10px
  max-width: 92vw
  padding: 8px 8px 8px 16px
  border-radius: 999px
  background: rgba(255, 250, 235, 0.95)
  color: #2a2418
  font-weight: 700

.ag-mode-x
  min-height: 40px
  padding: 0 14px
  border: none
  border-radius: 999px
  background: #2a2418
  color: #fff6dc
  font: inherit
  font-weight: 800
  cursor: pointer

@keyframes ag-tipfade
  0%
    opacity: 0
  100%
    opacity: 1

.ag-tip
  position: absolute
  left: 50%
  top: 118px
  animation: ag-tipfade 0.3s ease-out
  transform: translateX(-50%)
  max-width: min(520px, 92vw)
  padding: 10px 18px
  border-radius: 20px
  background: rgba(255, 250, 235, 0.95)
  color: #2a2418
  font-weight: 700
  text-align: center
  pointer-events: none

.ag-pair
  display: flex
  gap: 6px
  justify-content: center

.ag-pair-img
  width: 70px
  height: 70px
  object-fit: contain

.ag-gained
  display: flex
  gap: 8px
  justify-content: center

.ag-gained-img
  width: 44px
  height: 44px
  object-fit: contain

.ag-how
  width: min(520px, 100%)
  gap: 8px
  max-height: 100%
  overflow-y: auto

.ag-how-row
  display: flex
  gap: 10px
  justify-content: center

.ag-how-img
  width: 56px
  height: 56px
  object-fit: contain

.ag-how-line
  margin: 0
  text-align: left
  font-size: 0.95rem
  line-height: 1.35

@media (max-width: 420px)
  .ag-goal-img
    width: 26px
    height: 26px
</style>
