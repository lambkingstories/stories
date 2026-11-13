<script setup lang="ts">
/**
 * "Nehemias Mauer": the big game (rules in `utils/nehemiaMauerGame.ts`, the levels in `utils/nehemiaMauerLevels.ts`; this file draws it and takes the touch).
 * Stones fall into the plan of the wall of Jerusalem (the template); the child moves, turns and drops them until the plan is filled exactly.
 * The field fits into the screen (upright: bar on top, buttons below; turned: columns left and right).
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import AdventureStars from '@/components/molecules/AdventureStars.vue'
import useBigGames, { howSeen, markHowSeen } from '@/use/useBigGames'
import useSfx from '@/use/useSfx'
import useMusic from '@/use/useMusic'
import { prependBaseUrl } from '@/utils/function'
import {
  AIR,
  ORIENTS,
  SHAPE_COLOR,
  SLOT,
  WALL,
  cellsAt,
  discard,
  ghostY,
  hardDrop,
  holdPiece,
  lockable,
  move,
  remainingShapes,
  resting,
  rotate,
  softDrop,
  starsOf,
  tick,
  tip,
  undo,
  type Game,
  type ShapeId
} from '@/utils/nehemiaMauerGame'
import { LEVELS, LEVELS_PER_CHAPTER, CHAPTER_COUNT, levelGame } from '@/utils/nehemiaMauerLevels'

const emit = defineEmits<{ leave: [] }>()
const { t, tm, rt } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const music = useMusic()
const progress = useBigGames()
const ID = 'nehemia'

// ── the pictures ────────────────────────────────────────────────────────────────────────────────────────────────────────────
const NAMES = [
  ...Array.from({ length: 6 }, (_, i) => `bloecke-${i + 1}`),
  ...Array.from({ length: 6 }, (_, i) => `szene-${i + 1}`),
  ...Array.from({ length: 6 }, (_, i) => `wand-${i + 1}`),
  'spezial', 'pergament', 'holz', 'deko-olive', 'deko-zweige', 'deko-fahne-rot', 'deko-fahne-blau', 'deko-leiter', 'deko-krug',
  'sym-rotl', 'sym-rotr', 'sym-drop', 'sym-hold', 'sym-undo', 'sym-clay', 'sym-trash', 'sym-tip'
]
const img: Record<string, HTMLImageElement | undefined> = {}
const loaded = ref(false)
const glow = new Image()
glow.src = prependBaseUrl('images/abenteuer/ui/sternglanz.webp')
const pic = (n: string) => prependBaseUrl(`images/spiele-gross/nehemia/${n}.webp`)

function loadImage(n: string): Promise<void> {
  return new Promise<void>((resolve) => {
    const i = new Image()
    i.onload = () => {
      img[n] = i
      resolve()
    }
    i.onerror = () => resolve()
    i.src = pic(n)
  })
}

async function loadAll() {
  await Promise.all(NAMES.map(loadImage))
  loaded.value = true
}

/** The colours of a block when its picture is missing (one for each of the six slots of a chapter). */
const FLAT = [
  ['#c98a52', '#d9a25f', '#a8683a', '#c9a24a', '#b97a68', '#8f8a4a'],
  ['#e9e1c9', '#c9ccd0', '#b7c4d4', '#ecd98a', '#e0b4b4', '#a9c2a0'],
  ['#e0b04a', '#d98a3c', '#d8c08a', '#a8643a', '#c99a3a', '#e8b890'],
  ['#b5473a', '#8f2f30', '#6b4332', '#c9693a', '#7d3a4a', '#c98068'],
  ['#8aa0b8', '#4f7686', '#d4d8dc', '#a79bb8', '#5d82a8', '#6aa595'],
  ['#e5b84a', '#f3ead2', '#e8d49a', '#e0a898', '#e8b45a', '#f0e08a']
]

// ── the screens ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
type Screen = 'menu' | 'play' | 'result'
const screen = ref<Screen>('menu')
const level = ref(0)
const paused = ref(false)
const how = ref(false)
const chapterCard = ref(-1)
let pendingCard = -1
const hintText = ref('')
const hintShown = ref(false)
let hintTimer = 0
const chapterTexts = computed(() => ((tm('app.bigGames.nehemia.chapters') as unknown as { name: Parameters<typeof rt>[0]; ref: Parameters<typeof rt>[0]; story: Parameters<typeof rt>[0]; task: Parameters<typeof rt>[0] }[]) ?? []).map((m) => ({ name: rt(m.name), ref: rt(m.ref), story: rt(m.story), task: rt(m.task) })))
const levelStars = computed(() => progress.levels(ID))
const chapterOf = (i: number) => LEVELS[i]?.chapter ?? 0
const chapterLevels = (c: number) => Array.from({ length: LEVELS_PER_CHAPTER }, (_, k) => c * LEVELS_PER_CHAPTER + k)
const chapterStars = (c: number) => chapterLevels(c).reduce((n, i) => n + (levelStars.value[i] ?? 0), 0)
const chapterDone = (c: number) => chapterLevels(c).every((i) => (levelStars.value[i] ?? 0) >= 1)
const allDone = computed(() => Array.from({ length: CHAPTER_COUNT }, (_, c) => c).every(chapterDone))
const hasNext = computed(() => level.value < LEVELS.length - 1)
const levelLabel = (i: number) => `${t('app.bigGames.nehemia.level')} ${(LEVELS[i]?.index ?? 0) + 1}`

const hud = reactive({ stuck: false, undoLeft: 0, clay: 0, left: 0, decoy: false, holdOk: false, timeFrac: 1, s2: true, s3: true, won: false })
const outcome = reactive({ phase: 'won' as 'won' | 'lost', stars: 0, patched: 0, helped: false, time: 0, par: 0 })
const lay = reactive({ land: false, hold: { x: 0, y: 0, s: 0 }, nexts: [] as { x: number; y: number; s: number }[] })

// ── local memory (chapters seen, hints seen, speed) ─────────────────────────────────────────────────────────────────────────
const MEM_KEY = 'lk-nehemia-v1'
interface Mem {
  chapters: boolean[]
  hints: Record<string, boolean>
  quick: boolean
}
function loadMem(): Mem {
  try {
    const m = JSON.parse(localStorage.getItem(MEM_KEY) ?? 'null') as Mem | null
    if (m && typeof m === 'object') return { chapters: m.chapters ?? [], hints: m.hints ?? {}, quick: !!m.quick }
  } catch {
    // start fresh
  }
  return { chapters: [], hints: {}, quick: false }
}
const mem = reactive<Mem>(loadMem())
function saveMem() {
  try {
    localStorage.setItem(MEM_KEY, JSON.stringify(mem))
  } catch {
    // a private window: not remembered
  }
}

// ── the game ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
let g: Game = levelGame(0)
const canvas = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let raf = 0
let last = 0
let dpr = 1
let cvW = 1
let cvH = 1
let fx = 0
let fy = 0
let cell = 1
let holdBox = { x: 0, y: 0, s: 0 }
let nextBoxes: { x: number; y: number; s: number }[] = []

interface Part {
  x: number
  y: number
  vx: number
  vy: number
  t: number
  life: number
  r: number
  kind: 'dust' | 'spark'
  color: string
}
const parts: Part[] = []
let rngState = 4242
const rand = () => {
  rngState = (rngState * 1664525 + 1013904223) >>> 0
  return rngState / 4294967296
}
function spawn(p: Omit<Part, 't'>) {
  if (parts.length >= 260) parts.shift()
  parts.push({ ...p, t: 0 })
}

let popCells: Set<number> = new Set()
let popT = 9
let shakeT = 0
let winT = -1
let tipPlace: { shape: ShapeId; rot: number; x: number; y: number } | null = null
let tipT = 0
let endTimer = 0

function applyTempo() {
  const L = LEVELS[level.value]!
  g.gravity = L.gravity * (mem.quick ? 2.6 : 1)
  g.lockDelay = mem.quick ? 1.0 : 0
}

function begin(i: number) {
  level.value = i
  g = levelGame(i)
  applyTempo()
  parts.length = 0
  popCells = new Set()
  popT = 9
  winT = -1
  tipPlace = null
  tipT = 0
  window.clearTimeout(endTimer)
  hud.won = false
  syncHud(true)
  screen.value = 'play'
  const L = LEVELS[i]!
  const c = L.chapter
  pendingCard = L.index === 0 && !mem.chapters[c] ? c : -1
  how.value = !howSeen(ID)
  chapterCard.value = how.value ? -1 : pendingCard
  paused.value = how.value || chapterCard.value >= 0
  hintShown.value = false
  if (!paused.value) hintOnce(L.intro)
  layout()
  setProbe()
}

function closeHow() {
  how.value = false
  markHowSeen(ID)
  chapterCard.value = pendingCard
  paused.value = chapterCard.value >= 0
  if (!paused.value) hintOnce(LEVELS[level.value]?.intro)
}

function closeCard() {
  const c = chapterCard.value
  if (c >= 0) {
    mem.chapters[c] = true
    saveMem()
  }
  chapterCard.value = -1
  pendingCard = -1
  paused.value = false
  hintOnce(LEVELS[level.value]?.intro)
}

function toMenu() {
  screen.value = 'menu'
  paused.value = false
  window.clearTimeout(endTimer)
}

function say(text: string, ms = 6500) {
  hintText.value = text
  hintShown.value = true
  window.clearTimeout(hintTimer)
  hintTimer = window.setTimeout(() => (hintShown.value = false), ms)
}

function hintOnce(intro: string | undefined) {
  if (!intro || mem.hints[intro]) return
  mem.hints[intro] = true
  saveMem()
  say(t(`app.bigGames.nehemia.hint.${intro}`), 8000)
}

function toggleTempo() {
  mem.quick = !mem.quick
  saveMem()
  applyTempo()
}

function syncHud(force = false) {
  const left = remainingShapes(g).length
  const timeFrac = g.helped ? 0 : Math.max(0, 1 - g.time / Math.max(1, g.par))
  const s3 = !g.helped && g.time <= g.par
  if (force || hud.stuck !== g.stuck) hud.stuck = g.stuck
  if (force || hud.undoLeft !== g.undoLeft) hud.undoLeft = g.undoLeft
  if (force || hud.clay !== g.clayLeft) hud.clay = g.clayLeft
  if (force || hud.left !== left) hud.left = left
  const dec = !!g.cur?.decoy
  if (force || hud.decoy !== dec) hud.decoy = dec
  if (force || hud.holdOk !== g.holdAllowed) hud.holdOk = g.holdAllowed
  if (force || Math.abs(hud.timeFrac - timeFrac) > 0.004) hud.timeFrac = timeFrac
  if (force || hud.s2 !== !g.helped) hud.s2 = !g.helped
  if (force || hud.s3 !== s3) hud.s3 = s3
}

// ── the events of the rules: sounds and effects ─────────────────────────────────────────────────────────────────────────────
function onEvents() {
  for (const e of g.events) {
    if (e.t === 'rotate') play('tap', 0.7)
    else if (e.t === 'lock') {
      play(e.hard ? 'clunk' : 'snap')
      popCells = new Set(e.cells)
      popT = 0
      for (const i of e.cells) {
        const x = i % g.cols
        const y = (i - x) / g.cols
        const below = y + 1 < g.rows && g.fill[(y + 1) * g.cols + x] === 0 && g.kind[(y + 1) * g.cols + x] !== SLOT
        if (below || g.fill[(y + 1) * g.cols + x] !== 0 || y + 1 >= g.rows || g.kind[(y + 1) * g.cols + x] === WALL) {
          for (let k = 0; k < 2; k++) spawn({ x: x + 0.5, y: y + 1, vx: (rand() - 0.5) * 3.5, vy: -rand() * 2.2, life: 0.5 + rand() * 0.3, r: 0.1 + rand() * 0.14, kind: 'dust', color: '#d9c19a' })
        }
        if (rand() < 0.45) spawn({ x: x + rand(), y: y + rand(), vx: (rand() - 0.5) * 3, vy: -1 - rand() * 3, life: 0.5 + rand() * 0.4, r: 0.5 + rand() * 0.5, kind: 'spark', color: '#ffe27a' })
      }
      if (e.hard) shakeT = 0.16
    } else if (e.t === 'discard') {
      play('sack')
      const c = g.cur
      void c
      for (let k = 0; k < 8; k++) spawn({ x: g.cols / 2 + (rand() - 0.5) * 2, y: g.sky - 1, vx: (rand() - 0.5) * 4, vy: -rand() * 3, life: 0.6, r: 0.18, kind: 'dust', color: '#9a9488' })
    } else if (e.t === 'refuse') play('wrong', 0.6)
    else if (e.t === 'undo' || e.t === 'hold') play('flip')
    else if (e.t === 'stuck') play('wrong', 0.5)
    else if (e.t === 'win') {
      hud.won = true
      winT = 0
      play('fanfare')
      finish('won')
    } else if (e.t === 'lost') finish('lost')
  }
  g.events.length = 0
}

function finish(phase: 'won' | 'lost') {
  outcome.phase = phase
  outcome.stars = phase === 'won' ? starsOf(g) : 0
  outcome.patched = g.patched
  outcome.helped = g.helped
  outcome.time = Math.round(g.time)
  outcome.par = g.par
  progress.record(ID, level.value, outcome.stars)
  window.clearTimeout(endTimer)
  endTimer = window.setTimeout(
    () => {
      if (screen.value !== 'play') return
      screen.value = 'result'
      play(phase === 'won' ? 'result' : 'wrong')
    },
    phase === 'won' ? 2100 : 900
  )
}

// ── the actions of the buttons ──────────────────────────────────────────────────────────────────────────────────────────────
const live = () => screen.value === 'play' && !paused.value && g.status === 'play'
function aRotate(dir: 1 | -1) {
  if (live()) rotate(g, dir)
}
function aDrop() {
  if (live()) hardDrop(g)
}
function aHold() {
  if (live()) holdPiece(g)
}
function aUndo() {
  if (live()) undo(g)
}
function aDiscard() {
  if (live()) discard(g)
}
function aTip() {
  if (!live()) return
  const p = tip(g)
  if (p && g.cur) {
    tipPlace = { shape: g.cur.shape, rot: p.rot, x: p.x, y: p.y }
    tipT = 5
    play('found')
  }
}

// ── the touch ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
let pt: { x0: number; y0: number; ax: number; ay: number; t0: number; moved: boolean; restPush: number; locked: boolean } | null = null

function pos(e: PointerEvent) {
  const r = canvas.value!.getBoundingClientRect()
  return { x: e.clientX - r.left, y: e.clientY - r.top }
}
function onDown(e: PointerEvent) {
  if (!live()) return
  ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
  const p = pos(e)
  pt = { x0: p.x, y0: p.y, ax: p.x, ay: p.y, t0: performance.now(), moved: false, restPush: 0, locked: false }
}
function onMove(e: PointerEvent) {
  if (!pt || !live()) return
  const p = pos(e)
  const step = cell * 0.9
  const sx = Math.trunc((p.x - pt.ax) / step)
  if (sx !== 0) {
    for (let i = 0; i < Math.abs(sx); i++) move(g, Math.sign(sx))
    pt.ax += sx * step
    pt.moved = true
  }
  const sy = Math.trunc((p.y - pt.ay) / step)
  if (sy > 0) {
    for (let i = 0; i < sy; i++) {
      const r = softDrop(g, false)
      if (r === 'rest') {
        pt.restPush += step
        if (pt.restPush >= step * 2 && !pt.locked) {
          pt.locked = true
          softDrop(g, true)
        }
      }
    }
    pt.ay += sy * step
    pt.moved = true
  } else if (sy < 0) pt.ay = p.y
  if (Math.abs(p.x - pt.x0) > 10 || Math.abs(p.y - pt.y0) > 10) pt.moved = true
}
function onUp(e: PointerEvent) {
  const s = pt
  pt = null
  if (!s || !live()) return
  const p = pos(e)
  const dt = performance.now() - s.t0
  if (!s.moved && dt < 380) rotate(g, 1)
  else if (p.y - s.y0 > cell * 2.4 && dt < 300 && Math.abs(p.x - s.x0) < (p.y - s.y0) * 0.7) hardDrop(g)
}
function onCancel() {
  pt = null
}
function onKey(e: KeyboardEvent) {
  if (!live()) return
  const k = e.key
  if (k === 'ArrowLeft') move(g, -1)
  else if (k === 'ArrowRight') move(g, 1)
  else if (k === 'ArrowDown') softDrop(g, true)
  else if (k === 'ArrowUp' || k === 'x' || k === 'e') rotate(g, 1)
  else if (k === 'z' || k === 'y' || k === 'q') rotate(g, -1)
  else if (k === ' ') hardDrop(g)
  else if (k === 'c') holdPiece(g)
  else if (k === 'u') undo(g)
  else return
  e.preventDefault()
}

// ── the layout and the loop ─────────────────────────────────────────────────────────────────────────────────────────────────
function layout() {
  const c = canvas.value
  if (!c) return
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  const box = c.getBoundingClientRect()
  cvW = box.width || window.innerWidth
  cvH = box.height || window.innerHeight
  c.width = Math.round(cvW * dpr)
  c.height = Math.round(cvH * dpr)
  const land = cvW > cvH * 1.15
  lay.land = land
  const cols = g.cols
  const rows = g.rows
  let ax = 0
  let ay = 0
  let aw = cvW
  let ah = cvH
  if (land) {
    const side = Math.min(170, Math.max(130, cvW * 0.2))
    ax = side
    aw = cvW - side * 2
    const s = 46
    holdBox = { x: 12, y: 112, s }
    nextBoxes = [0, 1, 2].map((k) => ({ x: 12, y: 170 + k * 52, s: 44 }))
  } else {
    const top = 148
    const bottom = 92
    ay = top
    ah = cvH - top - bottom
    holdBox = { x: 10, y: 86, s: 52 }
    nextBoxes = [0, 1, 2].map((k) => ({ x: cvW - 10 - (3 - k) * 54, y: 88, s: 48 }))
  }
  lay.hold = holdBox
  lay.nexts = nextBoxes
  cell = Math.max(12, Math.floor(Math.min((aw - 8) / cols, (ah - 4) / rows)))
  fx = Math.round(ax + (aw - cols * cell) / 2)
  fy = Math.round(ay + (ah - rows * cell) / 2)
}

function frame(now: number) {
  raf = requestAnimationFrame(frame)
  const dt = Math.min(0.05, (now - last) / 1000 || 0)
  last = now
  advance(dt)
  draw(now / 1000, dt)
}

function advance(dt: number) {
  if (screen.value !== 'play') return
  if (!paused.value && g.status === 'play') tick(g, dt)
  onEvents()
  syncHud()
  if (popT < 1) popT += dt
  if (shakeT > 0) shakeT -= dt
  if (tipT > 0) tipT -= dt
  if (winT >= 0) winT += dt
  for (const p of parts) {
    p.t += dt
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.vy += (p.kind === 'dust' ? 3 : 0.8) * dt
  }
  for (let i = parts.length - 1; i >= 0; i--) if (parts[i]!.t > parts[i]!.life) parts.splice(i, 1)
}

function slotColor(shape: ShapeId): number {
  return SHAPE_COLOR[shape]
}

/** One block: a tile of the picture sheet of the chapter, or a plain colour. */
function block(c: CanvasRenderingContext2D, color: number, x: number, y: number, s: number, rubble = false, alpha = 1) {
  const chap = chapterOf(level.value)
  if (alpha < 1) c.globalAlpha = alpha
  const sheet = rubble ? img.spezial : img[`bloecke-${chap + 1}`]
  if (sheet) {
    const cols = rubble ? 3 : 3
    const rowsN = rubble ? 1 : 2
    const tw = sheet.width / cols
    const th = sheet.height / rowsN
    const idx = rubble ? 0 : color
    c.drawImage(sheet, (idx % 3) * tw, Math.floor(idx / 3) * th, tw, th, x, y, s, s)
  } else {
    c.fillStyle = rubble ? '#8d887c' : FLAT[chap]![color % 6]!
    c.fillRect(x, y, s, s)
    c.fillStyle = 'rgba(255,255,255,0.25)'
    c.fillRect(x, y, s, Math.max(1, s * 0.1))
    c.fillStyle = 'rgba(0,0,0,0.22)'
    c.fillRect(x, y + s * 0.9, s, s * 0.1)
  }
  if (alpha < 1) c.globalAlpha = 1
}

/** The outline of a group of cells (a stone): a dark line on every side that has no neighbour of the same stone. */
function outline(c: CanvasRenderingContext2D, cells: [number, number][], ox: number, oy: number, s: number, color: string, w: number) {
  const set = new Set(cells.map(([x, y]) => `${x},${y}`))
  c.strokeStyle = color
  c.lineWidth = w
  c.beginPath()
  for (const [x, y] of cells) {
    const px = ox + x * s
    const py = oy + y * s
    if (!set.has(`${x},${y - 1}`)) {
      c.moveTo(px, py)
      c.lineTo(px + s, py)
    }
    if (!set.has(`${x},${y + 1}`)) {
      c.moveTo(px, py + s)
      c.lineTo(px + s, py + s)
    }
    if (!set.has(`${x - 1},${y}`)) {
      c.moveTo(px, py)
      c.lineTo(px, py + s)
    }
    if (!set.has(`${x + 1},${y}`)) {
      c.moveTo(px + s, py)
      c.lineTo(px + s, py + s)
    }
  }
  c.stroke()
}

function drawMini(c: CanvasRenderingContext2D, shape: ShapeId, decoy: boolean, b: { x: number; y: number; s: number }) {
  const cells = ORIENTS[shape][0]!.cells
  const xs = cells.map((p) => p[0])
  const ys = cells.map((p) => p[1])
  const w = Math.max(...xs) - Math.min(...xs) + 1
  const h = Math.max(...ys) - Math.min(...ys) + 1
  const s = Math.floor(Math.min((b.s - 8) / Math.max(w, h, 3), 16))
  const ox = b.x + (b.s - w * s) / 2 - Math.min(...xs) * s
  const oy = b.y + (b.s - h * s) / 2 - Math.min(...ys) * s
  for (const [x, y] of cells) block(c, slotColor(shape), ox + x * s, oy + y * s, s, decoy)
  outline(c, cells, ox, oy, s, 'rgba(40,20,0,0.6)', 1.2)
}

function panel(c: CanvasRenderingContext2D, b: { x: number; y: number; s: number }, dashed = false) {
  c.fillStyle = 'rgba(255,248,226,0.82)'
  c.strokeStyle = 'rgba(120,80,30,0.7)'
  c.lineWidth = 2
  c.setLineDash(dashed ? [5, 4] : [])
  c.beginPath()
  c.roundRect(b.x, b.y, b.s, b.s, 10)
  c.fill()
  c.stroke()
  c.setLineDash([])
}

function sprite(c: CanvasRenderingContext2D, name: string, cx: number, bottom: number, height: number, alpha = 1) {
  const i = img[name]
  if (!i) return
  const wd = (i.width / i.height) * height
  if (alpha < 1) c.globalAlpha = alpha
  c.drawImage(i, cx - wd / 2, bottom - height, wd, height)
  if (alpha < 1) c.globalAlpha = 1
}

function draw(time: number, dt: number) {
  void dt
  const c = ctx
  if (!c || !loaded.value) return
  c.setTransform(dpr, 0, 0, dpr, 0, 0)
  c.fillStyle = '#2a1d12'
  c.fillRect(0, 0, cvW, cvH)
  if (screen.value === 'menu') return
  const chap = chapterOf(level.value)
  const bg = img[`szene-${chap + 1}`]
  if (bg) {
    const k = Math.max(cvW / bg.width, cvH / bg.height)
    c.drawImage(bg, (cvW - bg.width * k) / 2, (cvH - bg.height * k) / 2, bg.width * k, bg.height * k)
    c.fillStyle = 'rgba(30,18,6,0.28)'
    c.fillRect(0, 0, cvW, cvH)
  }
  const cols = g.cols
  const rows = g.rows
  const sh = shakeT > 0 ? Math.sin(shakeT * 90) * 2.2 * (shakeT / 0.16) : 0
  c.save()
  c.translate(0, sh)
  const slot = (x: number, y: number) => x >= 0 && y >= 0 && x < cols && y < rows && g.kind[y * cols + x] === SLOT
  const wallGate = (x: number, y: number) => {
    if (g.kind[y * cols + x] !== WALL) return false
    for (let yy = y - 1; yy >= 0; yy--) if (g.kind[yy * cols + x] === SLOT) return true
    return false
  }

  // the plan: parchment under the empty slots, a golden outline around the whole plan, the openings of the gates
  const planCells: [number, number][] = []
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = y * cols + x
      if (g.kind[i] === SLOT) {
        planCells.push([x, y])
        if (g.fill[i] === 0) {
          const px = fx + x * cell
          const py = fy + y * cell
          const perg = img.pergament
          if (perg) {
            c.globalAlpha = 0.9
            c.drawImage(perg, (x % 4) * (perg.width / 4), (y % 4) * (perg.height / 4), perg.width / 4, perg.height / 4, px, py, cell, cell)
            c.globalAlpha = 1
          } else {
            c.fillStyle = 'rgba(255,244,214,0.78)'
            c.fillRect(px, py, cell, cell)
          }
          c.strokeStyle = 'rgba(120,84,40,0.28)'
          c.lineWidth = 1
          c.strokeRect(px + 0.5, py + 0.5, cell - 1, cell - 1)
        }
      } else if (wallGate(x, y)) {
        const sheet = img.spezial
        const px = fx + x * cell
        const py = fy + y * cell
        if (sheet) {
          const tw = sheet.width / 3
          c.drawImage(sheet, tw * 2, 0, tw, sheet.height, px, py, cell, cell)
          c.fillStyle = 'rgba(20,10,0,0.38)'
          c.fillRect(px, py, cell, cell)
        } else {
          c.fillStyle = 'rgba(60,36,16,0.8)'
          c.fillRect(px, py, cell, cell)
        }
      }
    }
  }
  void AIR

  // the placed stones
  const pulse = popT < 1 ? Math.sin(popT * Math.PI * 3) * (1 - popT) * 0.12 : 0
  g.placed.forEach((p) => {
    const cells: [number, number][] = p.cells.map((i) => [i % cols, Math.floor(i / cols)])
    for (const [x, y] of cells) {
      const popped = popCells.has(y * cols + x) && popT < 1
      const s = cell * (popped ? 1 + pulse : 1)
      const off = (cell - s) / 2
      block(c, slotColor(p.shape), fx + x * cell + off, fy + y * cell + off, s, p.decoy)
    }
    outline(c, cells, fx, fy, cell, g.status === 'won' ? 'rgba(40,20,0,0.25)' : 'rgba(40,20,0,0.6)', g.status === 'won' ? 1 : 2)
  })

  // the golden outline of the plan
  const glowA = 0.65 + 0.3 * Math.sin(time * 2.2)
  c.save()
  c.shadowColor = 'rgba(255,214,90,0.9)'
  c.shadowBlur = 6
  outline(c, planCells, fx, fy, cell, `rgba(244,190,60,${glowA})`, 2.4)
  c.restore()

  // the tip, the ghost and the stone in the hand
  const cur = g.cur
  if (cur && g.status === 'play') {
    const gy = ghostY(g)
    const ok = lockable(g, cur.shape, cur.rot, cur.x, gy)
    if (!cur.decoy) {
      const gc = cellsAt(cur.shape, cur.rot, cur.x, gy)
      c.fillStyle = ok ? 'rgba(255,255,255,0.22)' : 'rgba(210,60,40,0.22)'
      for (const [x, y] of gc) c.fillRect(fx + x * cell + 1, fy + y * cell + 1, cell - 2, cell - 2)
      outline(c, gc, fx, fy, cell, ok ? 'rgba(255,255,255,0.9)' : 'rgba(220,70,50,0.9)', 2)
    }
    if (tipPlace && tipT > 0) {
      const tc = cellsAt(tipPlace.shape, tipPlace.rot, tipPlace.x, tipPlace.y)
      const a = 0.45 + 0.4 * Math.sin(time * 7)
      c.fillStyle = `rgba(255,214,70,${a * 0.6})`
      for (const [x, y] of tc) c.fillRect(fx + x * cell + 1, fy + y * cell + 1, cell - 2, cell - 2)
      outline(c, tc, fx, fy, cell, `rgba(255,200,40,${0.6 + a * 0.4})`, 3)
    }
    const cc = cellsAt(cur.shape, cur.rot, cur.x, cur.y)
    const rest = resting(g) ? 0.5 + 0.5 * Math.sin(time * 6) : 0
    for (const [x, y] of cc) block(c, slotColor(cur.shape), fx + x * cell, fy + y * cell, cell, cur.decoy)
    outline(c, cc, fx, fy, cell, 'rgba(40,20,0,0.75)', 2)
    if (rest > 0.2) {
      c.strokeStyle = `rgba(255,236,150,${rest * 0.8})`
      c.lineWidth = 2
      for (const [x, y] of cc) c.strokeRect(fx + x * cell + 2, fy + y * cell + 2, cell - 4, cell - 4)
    }
  }

  // the finished wall: flags on the tops and olive trees at the sides
  if (winT >= 0) {
    const k = Math.min(1, winT / 0.7)
    const topByCol: number[] = []
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) if (g.kind[y * cols + x] === SLOT) {
        topByCol[x] = y
        break
      }
    }
    const tops = topByCol.map((y, x) => ({ x, y })).filter((p) => p.y !== undefined)
    if (tops.length) {
      const pick = [tops[0]!, tops[Math.floor(tops.length / 2)]!, tops[tops.length - 1]!]
      const names = ['deko-fahne-rot', 'deko-fahne-blau', 'deko-fahne-rot']
      pick.forEach((p, i) => sprite(c, names[i]!, fx + (p.x + 0.5) * cell, fy + p.y * cell + cell * 0.2, cell * 2.6 * k))
      const first = tops[0]!
      const lastTop = tops[tops.length - 1]!
      sprite(c, 'deko-olive', fx + (first.x - 0.6) * cell, fy + rows * cell, cell * 4 * k)
      sprite(c, 'deko-olive', fx + (lastTop.x + 1.6) * cell, fy + rows * cell, cell * 4 * k)
    }
  }

  // the particles
  for (const p of parts) {
    const k = p.t / p.life
    const px = fx + p.x * cell
    const py = fy + p.y * cell
    if (p.kind === 'spark' && glow.complete && glow.naturalWidth) {
      c.globalAlpha = 1 - k
      const s = p.r * cell
      c.drawImage(glow, px - s / 2, py - s / 2, s, s)
      c.globalAlpha = 1
    } else {
      c.globalAlpha = (1 - k) * 0.85
      c.fillStyle = p.color
      c.beginPath()
      c.arc(px, py, p.r * cell * (1 + k * 0.6), 0, Math.PI * 2)
      c.fill()
      c.globalAlpha = 1
    }
  }
  c.restore()

  // the reserve and the next stones
  panel(c, holdBox, true)
  if (g.hold) {
    c.globalAlpha = g.holdUsed ? 0.45 : 1
    drawMini(c, g.hold.shape, g.hold.decoy, holdBox)
    c.globalAlpha = 1
  } else {
    const hi = img['sym-hold']
    if (hi) {
      c.globalAlpha = 0.5
      c.drawImage(hi, holdBox.x + holdBox.s * 0.18, holdBox.y + holdBox.s * 0.18, holdBox.s * 0.64, holdBox.s * 0.64)
      c.globalAlpha = 1
    }
  }
  nextBoxes.forEach((b, k) => {
    panel(c, b)
    const q = g.queue[k]
    if (q) drawMini(c, q.shape, q.decoy, b)
  })
}

// ── the page ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const hideBroken = (e: Event) => {
  ;(e.target as HTMLElement).style.display = 'none'
}
const sym = (n: string) => pic(`sym-${n}`)
const resultText = computed(() => {
  if (outcome.phase === 'lost') return t('app.bigGames.nehemia.lost')
  return t(`app.bigGames.nehemia.won${Math.max(1, outcome.stars)}`)
})
const timeLine = computed(() => t('app.bigGames.nehemia.lineTime', { have: outcome.time, need: outcome.par }))
const rewardChapter = computed(() => (outcome.phase === 'won' && LEVELS[level.value]?.index === LEVELS_PER_CHAPTER - 1 ? LEVELS[level.value]!.chapter : -1))
const holdStyle = computed(() => ({ left: `${lay.hold.x}px`, top: `${lay.hold.y}px`, width: `${lay.hold.s}px`, height: `${lay.hold.s}px` }))
const timeStyle = computed(() => ({ width: `${Math.round(hud.timeFrac * 100)}%` }))
const bannerSrc = (c: number) => pic(`szene-${c + 1}`)
const rewardSrc = (c: number) => pic(`wand-${c + 1}`)

function leave() {
  emit('leave')
}

function setProbe() {
  if (window.location.hash.includes('probe=1')) {
    ;(window as unknown as { __nehemia?: unknown }).__nehemia = {
      get g() {
        return g
      },
      begin,
      advance: (sec = 0.02) => advance(sec),
      draw: () => draw(performance.now() / 1000, 0),
      move: (dx: number) => move(g, dx),
      rotate: (d: 1 | -1 = 1) => rotate(g, d),
      drop: () => hardDrop(g)
    }
  }
}

let bodyOverflow = ''
onMounted(async () => {
  bodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  ctx = canvas.value?.getContext('2d') ?? null
  layout()
  window.addEventListener('resize', layout)
  window.addEventListener('keydown', onKey)
  music.playGame('memory')
  setProbe()
  await loadAll()
  last = performance.now()
  raf = requestAnimationFrame(frame)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  window.clearTimeout(endTimer)
  window.clearTimeout(hintTimer)
  music.stop('game')
  window.removeEventListener('resize', layout)
  window.removeEventListener('keydown', onKey)
  document.body.style.overflow = bodyOverflow
})
</script>

<template lang="pug">
  div(:class="['nm', { 'nm--land': lay.land }]")
    canvas(
      ref="canvas"
      class="nm-canvas"
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onCancel"
    )

    div(v-if="!loaded" class="nm-center")
      div(class="nm-spinner")

    //- the overview: the story, the chapters and the pieces of wall
    div(v-else-if="screen === 'menu'" class="nm-menu")
      div(class="nm-card")
        h1(class="nm-title") {{ t('app.bigGames.nehemia.title') }}
        p(class="nm-text") {{ t('app.bigGames.nehemia.story') }}
        p(class="nm-text nm-text--task") {{ t('app.bigGames.nehemia.task') }}
        p(v-if="allDone" class="nm-done") {{ t('app.bigGames.nehemia.allDone') }}
        div(v-for="(ct, c) in chapterTexts" :key="c" class="nm-chapter")
          div(class="nm-banner")
            img(:src="bannerSrc(c)" alt="" class="nm-banner-pic" @error="hideBroken")
            div(class="nm-banner-text")
              span(class="nm-ch-name") {{ ct.name }}
              span(class="nm-ch-ref") {{ ct.ref }}
              span(class="nm-ch-stars") ★ {{ chapterStars(c) }} / {{ LEVELS_PER_CHAPTER * 3 }}
            img(v-if="chapterDone(c)" :src="rewardSrc(c)" alt="" class="nm-reward" @error="hideBroken")
          p(class="nm-ch-story") {{ ct.story }}
          div(class="nm-levels")
            button(
              v-for="i in chapterLevels(c)"
              :key="i"
              type="button"
              class="nm-level"
              :data-test="'nehemia-level-' + i"
              @click="begin(i)"
            )
              span(class="nm-level-no") {{ i - c * LEVELS_PER_CHAPTER + 1 }}
              AdventureStars(:stars="levelStars[i] ?? 0" :size="16")
        p(class="nm-rules") {{ t('app.bigGames.nehemia.starRules') }}
        div(class="nm-menu-buttons")
          AdvButton(tone="blau" small data-test="nehemia-how" @click="how = true") {{ t('app.bigGames.nehemia.howTitle') }}
          AdvButton(tone="blau" small @click="leave") {{ t('app.bigGames.nehemia.leave') }}

    //- the game
    template(v-else-if="screen === 'play'")
      div(class="nm-top")
        div(class="nm-top-btns")
          button(type="button" class="nm-btn" :aria-label="t('app.bigGames.nehemia.pause')" data-test="nehemia-pause" @click="paused = true") ❚❚
          button(type="button" class="nm-btn" :aria-label="t('app.bigGames.nehemia.restart')" data-test="nehemia-restart" @click="begin(level)") ↻
          button(type="button" class="nm-btn" :aria-label="t('app.bigGames.nehemia.tip')" data-test="nehemia-tip" @click="aTip")
            img(:src="sym('tip')" alt="" class="nm-btn-pic" @error="hideBroken")
        div(class="nm-info")
          span(class="nm-level-label") {{ chapterTexts[chapterOf(level)]?.name }} · {{ levelLabel(level) }}
          div(class="nm-stars-live" :aria-label="t('app.bigGames.nehemia.starRules')")
            span(class="nm-star is-on") ★
            span(:class="['nm-star', { 'is-on': hud.s2 }]") ★
            span(:class="['nm-star', { 'is-on': hud.s3 }]") ★
          div(class="nm-timebar")
            div(class="nm-timefill" :style="timeStyle")
          span(class="nm-left") {{ t('app.bigGames.nehemia.pieces') }}: {{ hud.left }}
      button(
        type="button"
        class="nm-holdbox"
        :style="holdStyle"
        :aria-label="t('app.bigGames.nehemia.hold')"
        data-test="nehemia-hold"
        @click="aHold"
      )

      div(class="nm-ctrl")
        button(type="button" class="nm-cbtn" :aria-label="t('app.bigGames.nehemia.rotL')" data-test="nehemia-rotl" @click="aRotate(-1)")
          img(:src="sym('rotl')" alt="" class="nm-cpic" @error="hideBroken")
        button(type="button" class="nm-cbtn nm-cbtn--big" :aria-label="t('app.bigGames.nehemia.drop')" data-test="nehemia-drop" @click="aDrop")
          img(:src="sym('drop')" alt="" class="nm-cpic" @error="hideBroken")
        button(type="button" class="nm-cbtn" :aria-label="t('app.bigGames.nehemia.rotR')" data-test="nehemia-rotr" @click="aRotate(1)")
          img(:src="sym('rotr')" alt="" class="nm-cpic" @error="hideBroken")
        button(type="button" :class="['nm-cbtn', { 'is-glow': hud.stuck && hud.undoLeft > 0 }]" :disabled="hud.undoLeft <= 0" :aria-label="t('app.bigGames.nehemia.undo')" data-test="nehemia-undo" @click="aUndo")
          img(:src="sym('undo')" alt="" class="nm-cpic" @error="hideBroken")
          span(class="nm-count") {{ hud.undoLeft }}
        button(v-if="hud.decoy" type="button" class="nm-cbtn is-glow" :aria-label="t('app.bigGames.nehemia.discard')" data-test="nehemia-discard" @click="aDiscard")
          img(:src="sym('trash')" alt="" class="nm-cpic" @error="hideBroken")
        div(v-else class="nm-cbtn nm-cbtn--info" :aria-label="t('app.bigGames.nehemia.clay')")
          img(:src="sym('clay')" alt="" class="nm-cpic" @error="hideBroken")
          span(class="nm-count") {{ hud.clay }}
      div(v-if="hud.stuck" class="nm-stuck" data-test="nehemia-stuck") {{ t('app.bigGames.nehemia.stuck') }}
      div(v-else-if="hintShown" class="nm-tip") {{ hintText }}

      div(v-if="paused && !how && chapterCard < 0" class="nm-menu nm-menu--dim")
        div(class="nm-card nm-card--small")
          h2(class="nm-title") {{ t('app.bigGames.nehemia.pause') }}
          AdvButton(data-test="nehemia-resume" @click="paused = false") {{ t('app.bigGames.nehemia.resume') }}
          AdvButton(tone="blau" data-test="nehemia-tempo" @click="toggleTempo") {{ t('app.bigGames.nehemia.tempo') }}: {{ mem.quick ? t('app.bigGames.nehemia.quick') : t('app.bigGames.nehemia.calm') }}
          AdvButton(tone="blau" data-test="nehemia-pause-again" @click="begin(level)") {{ t('app.bigGames.nehemia.again') }}
          AdvButton(tone="blau" data-test="nehemia-menu" @click="toMenu") {{ t('app.bigGames.nehemia.menu') }}

    //- the end of a round
    div(v-else-if="screen === 'result'" class="nm-menu nm-menu--dim")
      div(class="nm-card nm-card--small")
        h2(class="nm-title") {{ chapterTexts[chapterOf(level)]?.name }} · {{ levelLabel(level) }}
        img(v-if="rewardChapter >= 0" :src="rewardSrc(rewardChapter)" alt="" class="nm-result-pic" @error="hideBroken")
        AdventureStars(:stars="outcome.stars" :size="56" celebrate)
        p(class="nm-text") {{ resultText }}
        p(v-if="outcome.patched > 0" class="nm-line") {{ t('app.bigGames.nehemia.patched') }}
        div(v-if="outcome.phase === 'won'" class="nm-lines")
          p(class="nm-line is-on") ✓ {{ t('app.bigGames.nehemia.lineBuilt') }}
          p(:class="['nm-line', { 'is-on': !outcome.helped }]") {{ outcome.helped ? '○' : '✓' }} {{ t('app.bigGames.nehemia.lineNoHelp') }}
          p(:class="['nm-line', { 'is-on': outcome.stars >= 3 }]") {{ outcome.stars >= 3 ? '✓' : '○' }} {{ timeLine }}
        p(v-if="rewardChapter >= 0" class="nm-line is-on") {{ t('app.bigGames.nehemia.chapterDone') }}
        p(v-if="rewardChapter === 5" class="nm-text") {{ t('app.bigGames.nehemia.allDone') }}
        AdvButton(v-if="outcome.phase === 'won' && hasNext" data-test="nehemia-next" @click="begin(level + 1)") {{ t('app.bigGames.nehemia.next') }}
        AdvButton(:tone="outcome.phase === 'won' && hasNext ? 'blau' : 'gold'" data-test="nehemia-again" @click="begin(level)") {{ t('app.bigGames.nehemia.again') }}
        AdvButton(tone="blau" data-test="nehemia-menu" @click="toMenu") {{ t('app.bigGames.nehemia.menu') }}

    //- the story of a chapter (once)
    div(v-if="chapterCard >= 0 && loaded && !how" class="nm-menu nm-menu--dim")
      div(class="nm-card nm-card--small")
        img(:src="bannerSrc(chapterCard)" alt="" class="nm-result-pic" @error="hideBroken")
        h2(class="nm-title") {{ chapterTexts[chapterCard]?.name }}
        p(class="nm-ch-ref-line") {{ chapterTexts[chapterCard]?.ref }}
        p(class="nm-text") {{ chapterTexts[chapterCard]?.story }}
        p(class="nm-text nm-text--task") {{ chapterTexts[chapterCard]?.task }}
        AdvButton(data-test="nehemia-chapter-go" @click="closeCard") {{ t('app.bigGames.nehemia.go') }}

    //- the explanation (once; the question mark in the menu brings it back)
    div(v-if="how && loaded" class="nm-menu nm-menu--dim")
      div(class="nm-card nm-how")
        h2(class="nm-title") {{ t('app.bigGames.nehemia.title') }}
        p(class="nm-text") {{ t('app.bigGames.nehemia.story') }}
        p(class="nm-text nm-text--task") {{ t('app.bigGames.nehemia.task') }}
        div(class="nm-how-row")
          span(class="nm-how-sign") ↔
          p(class="nm-how-line") {{ t('app.bigGames.nehemia.howMove') }}
        div(class="nm-how-row")
          span(class="nm-how-sign") 👆
          p(class="nm-how-line") {{ t('app.bigGames.nehemia.howTurn') }}
        div(class="nm-how-row")
          span(class="nm-how-sign") ↓
          p(class="nm-how-line") {{ t('app.bigGames.nehemia.howDrop') }}
        div(class="nm-how-row")
          img(:src="sym('hold')" alt="" class="nm-how-pic" @error="hideBroken")
          p(class="nm-how-line") {{ t('app.bigGames.nehemia.howReserve') }}
        div(class="nm-how-row")
          span(class="nm-how-sign") ★
          p(class="nm-how-line") {{ t('app.bigGames.nehemia.howStars') }}
        AdvButton(data-test="nehemia-go" @click="closeHow") {{ t('app.bigGames.nehemia.go') }}
</template>

<style scoped lang="sass">
.nm
  position: fixed
  inset: 0
  z-index: 60
  background: #2a1d12
  overflow: hidden
  user-select: none
  -webkit-user-select: none
  touch-action: none

.nm-canvas
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  touch-action: none

.nm-center
  position: absolute
  inset: 0
  display: grid
  place-items: center

.nm-spinner
  width: 46px
  height: 46px
  border-radius: 50%
  border: 5px solid rgba(255, 255, 255, 0.25)
  border-top-color: #f5c84a
  animation: nm-spin 0.9s linear infinite

@keyframes nm-spin
  to
    transform: rotate(360deg)

.nm-menu
  position: absolute
  inset: 0
  display: grid
  place-items: start center
  padding: 16px
  overflow-y: auto
  background: linear-gradient(180deg, rgba(30, 18, 8, 0.72), rgba(30, 18, 8, 0.86))

  &--dim
    place-items: center
    background: rgba(24, 14, 6, 0.62)
    z-index: 5

.nm-card
  width: min(640px, 100%)
  padding: 22px 20px 18px
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

.nm-title
  margin: 0
  font-size: 1.6rem
  font-weight: 800

.nm-text
  margin: 0
  line-height: 1.4

  &--task
    font-weight: 800

.nm-done
  margin: 0
  padding: 8px 12px
  border-radius: 14px
  background: #fff1c2
  font-weight: 800

.nm-rules
  margin: 0
  font-size: 0.85rem
  color: var(--lk-muted, #7a6b4f)

.nm-chapter
  width: 100%
  display: flex
  flex-direction: column
  gap: 8px

.nm-banner
  position: relative
  height: 92px
  border-radius: 16px
  overflow: hidden
  background: #4a3320

.nm-banner-pic
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  object-fit: cover
  object-position: 50% 80%

.nm-banner-text
  position: absolute
  inset: 0
  display: flex
  flex-direction: column
  align-items: flex-start
  justify-content: flex-end
  gap: 1px
  padding: 8px 12px
  color: #fff6dc
  text-align: left
  background: linear-gradient(0deg, rgba(20, 10, 4, 0.78), rgba(20, 10, 4, 0.05))
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6)

.nm-reward
  position: absolute
  right: 8px
  bottom: 8px
  width: 84px
  height: 56px
  object-fit: cover
  border-radius: 10px
  border: 2px solid #ffe27a

.nm-ch-name
  font-size: 1.05rem
  font-weight: 800

.nm-ch-ref
  font-size: 0.78rem
  font-weight: 600
  opacity: 0.9

.nm-ch-stars
  position: absolute
  right: 12px
  top: 8px
  font-weight: 800
  font-size: 0.9rem
  color: #ffe27a

.nm-ch-story, .nm-ch-ref-line
  margin: 0
  font-size: 0.88rem
  line-height: 1.35
  color: var(--lk-muted, #7a6b4f)
  text-align: left

.nm-levels
  display: grid
  grid-template-columns: repeat(5, minmax(0, 1fr))
  gap: 8px
  width: 100%

.nm-level
  display: flex
  flex-direction: column
  align-items: center
  gap: 4px
  min-height: 56px
  padding: 8px 4px
  border: 2px solid var(--lk-line, #e3d7bb)
  border-radius: 16px
  background: var(--lk-surface-2, #f6efdc)
  color: inherit
  font: inherit
  cursor: pointer

.nm-level-no
  display: grid
  place-items: center
  width: 30px
  height: 30px
  border-radius: 50%
  background: var(--lk-accent, #1f6a6a)
  color: var(--lk-on-accent, #fff)
  font-weight: 800

.nm-menu-buttons
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 10px

.nm-top
  position: absolute
  top: 0
  left: 0
  right: 0
  height: 58px
  display: flex
  align-items: flex-start
  gap: 8px
  padding: max(6px, env(safe-area-inset-top)) max(8px, env(safe-area-inset-right)) 0 max(8px, env(safe-area-inset-left))
  pointer-events: none

.nm-top > *
  pointer-events: auto

.nm-top-btns
  display: flex
  gap: 6px

.nm-btn
  display: grid
  place-items: center
  width: 48px
  height: 48px
  padding: 0
  border: none
  border-radius: 50%
  background: rgba(255, 250, 235, 0.92)
  color: #2a2418
  font-size: 1.1rem
  font-weight: 800
  cursor: pointer
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3)

.nm-btn-pic
  width: 34px
  height: 34px
  object-fit: contain

.nm-info
  flex: 1
  min-width: 0
  display: flex
  flex-direction: column
  align-items: center
  gap: 2px
  padding: 3px 8px
  border-radius: 14px
  background: rgba(255, 250, 235, 0.88)
  font-weight: 800
  text-align: center

.nm-level-label
  font-size: 0.82rem
  line-height: 1.15
  white-space: nowrap
  overflow: hidden
  text-overflow: ellipsis
  max-width: 100%

.nm-left
  font-size: 0.72rem
  font-weight: 700
  color: #6b5a3a

.nm-stars-live
  display: flex
  gap: 1px

.nm-star
  font-size: 1rem
  color: #b9ae96

  &.is-on
    color: #f0a812
    text-shadow: 0 0 6px rgba(255, 210, 80, 0.8)

.nm-timebar
  width: 100%
  height: 6px
  border-radius: 3px
  background: rgba(120, 90, 40, 0.25)
  overflow: hidden

.nm-timefill
  height: 100%
  background: linear-gradient(90deg, #f0a812, #ffe27a)
  transition: width 0.3s linear

.nm-holdbox
  position: absolute
  padding: 0
  border: none
  border-radius: 10px
  background: transparent
  cursor: pointer

.nm-ctrl
  position: absolute
  left: 0
  right: 0
  bottom: 0
  display: flex
  justify-content: center
  align-items: center
  gap: 8px
  padding: 6px max(8px, env(safe-area-inset-right)) max(8px, env(safe-area-inset-bottom)) max(8px, env(safe-area-inset-left))

.nm-cbtn
  position: relative
  display: grid
  place-items: center
  width: 58px
  height: 58px
  padding: 0
  border: none
  border-radius: 50%
  background: rgba(255, 250, 235, 0.92)
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35)
  cursor: pointer

  &--big
    width: 70px
    height: 70px

  &--info
    cursor: default
    background: rgba(255, 250, 235, 0.7)

  &:disabled
    opacity: 0.45

  &.is-glow
    animation: nm-glow 1s ease-in-out infinite

.nm-cpic
  width: 84%
  height: 84%
  object-fit: contain

.nm-count
  position: absolute
  right: -2px
  bottom: -2px
  min-width: 22px
  height: 22px
  padding: 0 4px
  border-radius: 11px
  background: #2a2418
  color: #fff6dc
  font-size: 0.8rem
  font-weight: 800
  line-height: 22px
  text-align: center

@keyframes nm-glow
  0%, 100%
    box-shadow: 0 0 0 0 rgba(255, 210, 80, 0.9)
  50%
    box-shadow: 0 0 0 10px rgba(255, 210, 80, 0)

.nm-stuck, .nm-tip
  position: absolute
  left: 50%
  top: 150px
  transform: translateX(-50%)
  max-width: min(520px, 92vw)
  padding: 10px 18px
  border-radius: 18px
  background: rgba(255, 250, 235, 0.95)
  color: #2a2418
  font-weight: 700
  text-align: center
  pointer-events: none

.nm-stuck
  background: #ffe9c2

.nm-result-pic
  width: 100%
  max-height: 160px
  object-fit: cover
  border-radius: 14px

.nm-lines
  display: flex
  flex-direction: column
  gap: 2px
  align-items: flex-start

.nm-line
  margin: 0
  font-size: 0.92rem
  color: var(--lk-muted, #7a6b4f)

  &.is-on
    color: var(--lk-text, #2a2418)
    font-weight: 700

.nm-how
  gap: 10px

.nm-how-row
  display: flex
  align-items: center
  gap: 12px
  width: 100%

.nm-how-pic
  width: 44px
  height: 44px
  object-fit: contain
  flex: none

.nm-how-sign
  width: 44px
  flex: none
  font-size: 1.7rem
  color: #f0a812

.nm-how-line
  margin: 0
  text-align: left
  font-size: 0.95rem
  line-height: 1.35

// turned: the buttons stand in columns left and right of the field
.nm--land
  .nm-top
    width: 170px
    right: auto
    height: auto
    flex-direction: column
    gap: 6px
  .nm-info
    flex: none
    width: 100%
  .nm-stuck, .nm-tip
    top: auto
    bottom: 14px
  .nm-ctrl
    left: auto
    width: 170px
    top: 0
    flex-wrap: wrap
    align-content: center
    gap: 10px
</style>
