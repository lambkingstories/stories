<script setup lang="ts">
/**
 * "Gideons Nacht": the big game (rules and physics in `utils/gideonSim.ts`, levels in `utils/gideonLevels.ts`; this file draws it and takes the touch).
 * Gideon's catapult throws jars, a trumpet and torch jars into the camp of the Midianites. The structures are real physics; a guard who is hit or
 * startled runs away shouting for help. The level is won when every guard has run away. Nobody is hurt. The canvas is measured at every touch
 * (a tablet's browser bar slides in and out) and by a ResizeObserver.
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import AdventureStars from '@/components/molecules/AdventureStars.vue'
import useBigGames, { howSeen, markHowSeen } from '@/use/useBigGames'
import useSfx from '@/use/useSfx'
import useMusic from '@/use/useMusic'
import { prependBaseUrl } from '@/utils/function'
import { AMMO, BLAST_R, CATAPULT, DT, LIGHT_R, MAX_PULL, MIN_POWER, SETTLE_STEPS, Sim, previewPath, pullToShot, type Ammo, type Guard, type Part, type SimEvent } from '@/utils/gideonSim'
import { CHAPTER_COUNT, LEVELS, LEVELS_PER_CHAPTER } from '@/utils/gideonLevels'

const emit = defineEmits<{ leave: [] }>()
const { t, tm, rt } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const music = useMusic()
const progress = useBigGames()
const ID = 'gideon'
const TX = (k: string, p?: Record<string, unknown>) => t(`app.bigGames.${ID}.${k}`, p ?? {})

// ── the pictures (a missing picture is replaced by a plain shape, so the game can be played before they are there) ──────────
const NAMES = [
  'bg-1', 'bg-2', 'bg-3', 'bg-4',
  'katapult-gestell', 'katapult-arm', 'katapult-schale',
  'krug', 'stein', 'posaune', 'fackel', 'ruf', 'scherben',
  'm-holz', 'm-stroh', 'm-stein', 'm-zelt',
  'fass', 'sack', 'fackelstaender', 'amphore',
  ...[0, 1, 2].flatMap((k) => [`w${k}-stand`, `w${k}-scared`, `w${k}-run`]),
  'g-stand', 'g-cheer', 'g-horn', 'g-torch'
]
const img: Record<string, HTMLImageElement | undefined> = {}
const loaded = ref(false)
const glow = new Image()
glow.src = prependBaseUrl('images/abenteuer/ui/sternglanz.webp')
const pic = (n: string) => prependBaseUrl(`images/spiele-gross/gideon/${n}.webp`)

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

/** The colours of the things when their picture is missing. */
const FLAT: Record<string, string> = { wood: '#b9854f', straw: '#d9b85c', stone: '#9a9488', cloth: '#d6bf96', barrel: '#a8683a', rock: '#6f675c' }
const SKY: [string, string][] = [['#20254a', '#e0905a'], ['#0b1233', '#2a3b78'], ['#1b1736', '#7a4a52'], ['#e7a58c', '#f6dca0']]
const JAR_ICON: Record<Ammo, string> = { krug: '🏺', stein: '🪨', posaune: '🎺', fackel: '💡', ruf: '✨' }
const SPRITE_OF: Record<Ammo, string> = { krug: 'krug', stein: 'stein', posaune: 'posaune', fackel: 'fackel', ruf: 'ruf' }

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
type ChapterText = { name: Parameters<typeof rt>[0]; ref: Parameters<typeof rt>[0]; story: Parameters<typeof rt>[0]; task: Parameters<typeof rt>[0] }
const chapterTexts = computed(() => ((tm(`app.bigGames.${ID}.chapters`) as unknown as ChapterText[]) ?? []).map((m) => ({ name: rt(m.name), ref: rt(m.ref), story: rt(m.story), task: rt(m.task) })))
const levelNames = computed(() => ((tm(`app.bigGames.${ID}.levels`) as unknown as Parameters<typeof rt>[0][]) ?? []).map((m) => rt(m)))
const helpText = computed(() => TX('help'))
const levelStars = computed(() => progress.levels(ID))
const chapterLevels = (c: number) => Array.from({ length: LEVELS_PER_CHAPTER }, (_, k) => c * LEVELS_PER_CHAPTER + k)
const chapterStars = (c: number) => chapterLevels(c).reduce((n, i) => n + (levelStars.value[i] ?? 0), 0)
const chapterDone = (c: number) => chapterLevels(c).every((i) => (levelStars.value[i] ?? 0) >= 1)
const allDone = computed(() => Array.from({ length: CHAPTER_COUNT }, (_, c) => c).every(chapterDone))
const hasNext = computed(() => level.value < LEVELS.length - 1)
const chapterOf = (i: number) => LEVELS[i]?.chapter ?? 0

const hud = reactive({ scared: 0, all: 0, used: 0, left: 0, par: 0, tappable: false, wind: 0, next: 'krug' as Ammo | '', queue: [] as Ammo[], tapAmmo: 'krug' as Ammo })
const outcome = reactive({ stars: 0, used: 0, par: 0, scared: 0, all: 0, lost: false })

// ── local memory (chapters seen, hints seen) ────────────────────────────────────────────────────────────────────────────────
const MEM_KEY = 'lk-gideon-v1'
interface Mem {
  chapters: boolean[]
  hints: Record<string, boolean>
}
function loadMem(): Mem {
  try {
    const m = JSON.parse(localStorage.getItem(MEM_KEY) ?? 'null') as Mem | null
    if (m && typeof m === 'object') return { chapters: m.chapters ?? [], hints: m.hints ?? {} }
  } catch {
    // start fresh
  }
  return { chapters: [], hints: {} }
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
let sim: Sim = new Sim(LEVELS[0]!)
const canvas = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let raf = 0
let last = 0
let acc = 0
let dpr = 1
let cvW = 1
let cvH = 1
let portrait = false
let groundY = 0
let ro: ResizeObserver | null = null
/** The camera: the world x at the middle of the screen and the pixels per metre, both smoothly moving to their targets. */
const view = { x: 20, s: 20, tx: 20, ts: 20 }
type CamMode = 'overview' | 'aim' | 'follow' | 'hold' | 'free'
let camMode: CamMode = 'overview'
let camHold = 0
let overviewUntil = 0
let aimScale = 20
/** The right edge of the camp (the last guard, block or rock). */
let farX = 30
let overScale = 12

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  t: number
  life: number
  r: number
  kind: 'dust' | 'chip' | 'straw' | 'shard' | 'spark' | 'puff' | 'cloth'
  color: string
  rot: number
}
interface Ring {
  x: number
  y: number
  t: number
  life: number
  r: number
  kind: 'blast' | 'light' | 'klirr'
}
interface Runner {
  x: number
  y: number
  vy: number
  kind: number
  t: number
}
const parts: Particle[] = []
const rings: Ring[] = []
const runners: Runner[] = []
const trails = new Map<object, { x: number; y: number }[]>()
let rngState = 4242
const rand = () => {
  rngState = (rngState * 1664525 + 1013904223) >>> 0
  return rngState / 4294967296
}
function spawn(p: Omit<Particle, 't'>) {
  if (parts.length >= 320) parts.shift()
  parts.push({ ...p, t: 0 })
}
/** The aim: the pull of the finger from the resting cup (in metres), or null. */
let aim: { dx: number; dy: number } | null = null
/** The cup and arm spring: how far the arm is pulled back (degrees) and how fast it moves. */
const arm = { off: 0, vel: 0 }
let flash = 0
let winT = -1
let slowT = 0
let loseTimer = 0
let endTimer = 0
let giTime = 0
let gideonPose: 'stand' | 'cheer' | 'horn' | 'torch' = 'stand'
let poseT = 0

function begin(i: number) {
  level.value = i
  const L = LEVELS[i]!
  sim = new Sim(L)
  farX = Math.max(30, ...L.guards.map((g) => g.x + 0.5), ...L.parts.map((p) => p.x + p.w / 2), ...(L.rocks ?? []).map((r) => r.x + r.w / 2))
  for (let k = 0; k < SETTLE_STEPS + 2; k++) sim.step()
  sim.events.length = 0
  acc = 0
  parts.length = 0
  rings.length = 0
  runners.length = 0
  trails.clear()
  aim = null
  arm.off = 0
  arm.vel = 0
  winT = -1
  slowT = 0
  flash = 0
  gideonPose = 'stand'
  window.clearTimeout(loseTimer)
  window.clearTimeout(endTimer)
  screen.value = 'play'
  pendingCard = L.index === 0 && !mem.chapters[L.chapter] ? L.chapter : -1
  how.value = !howSeen(ID)
  chapterCard.value = how.value ? -1 : pendingCard
  paused.value = how.value || chapterCard.value >= 0
  hintShown.value = false
  layout()
  camMode = 'overview'
  view.s = view.ts = overScale
  view.x = view.tx = (L.width + 2) / 2
  overviewUntil = performance.now() + 1700
  syncHud()
  setProbe()
  if (!paused.value) hintOnce(L.intro)
  tryLandscape()
}

/** On a phone the game asks for the wide screen (like the game of David); upright it still works, with a note. */
function tryLandscape() {
  try {
    if (!window.matchMedia('(pointer: coarse)').matches) return
    void document.documentElement.requestFullscreen?.().then(() => (screen as unknown as { orientation?: { lock?: (o: string) => Promise<void> } }).orientation?.lock?.('landscape')).catch(() => undefined)
  } catch {
    // not possible here: the note asks to turn the phone
  }
}

function closeHow() {
  how.value = false
  markHowSeen(ID)
  chapterCard.value = pendingCard
  paused.value = chapterCard.value >= 0
  if (!paused.value) hintOnce(LEVELS[level.value]?.intro)
  noteRotate()
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
  noteRotate()
}
/** Held upright, the picture is small: a note (once for each start of the game) says that turning the phone helps. */
let rotateNoted = false
function noteRotate() {
  if (rotateNoted || !portrait || screen.value !== 'play') return
  rotateNoted = true
  window.setTimeout(() => {
    if (portrait && screen.value === 'play' && !hintShown.value) say(TX('rotate'), 6000)
  }, 400)
}
function toMenu() {
  screen.value = 'menu'
  paused.value = false
  window.clearTimeout(loseTimer)
  window.clearTimeout(endTimer)
}
function say(text: string, ms = 7000) {
  hintText.value = text
  hintShown.value = true
  window.clearTimeout(hintTimer)
  hintTimer = window.setTimeout(() => (hintShown.value = false), ms)
}
function hintOnce(intro: string | undefined) {
  if (!intro || mem.hints[intro]) return
  mem.hints[intro] = true
  saveMem()
  say(TX(`hint.${intro}`), 8500)
}

function syncHud() {
  const d = sim.def
  const scared = sim.scaredCount
  if (hud.scared !== scared) hud.scared = scared
  if (hud.all !== sim.guards.length) hud.all = sim.guards.length
  if (hud.used !== sim.used) hud.used = sim.used
  if (hud.left !== sim.shotsLeft) hud.left = sim.shotsLeft
  if (hud.par !== d.par) hud.par = d.par
  const tp = sim.tappable
  if (hud.tappable !== tp) hud.tappable = tp
  if (tp) {
    const p = [...sim.projs].reverse().find((q) => !q.dead && !q.used && (q.ammo === 'posaune' || q.ammo === 'fackel' || q.ammo === 'ruf'))
    if (p && hud.tapAmmo !== p.ammo) hud.tapAmmo = p.ammo
  }
  const w = Math.round((d.wind / 2) * 10) / 10
  if (hud.wind !== w) hud.wind = w
  const next = sim.nextAmmo ?? ''
  if (hud.next !== next) hud.next = next
  const q = d.ammo.slice(sim.used)
  if (hud.queue.length !== q.length || hud.queue.some((a, i) => a !== q[i])) hud.queue = q
}

// ── the events of the rules: sounds and effects ─────────────────────────────────────────────────────────────────────────────
const MAT_COLOR: Record<string, string> = { wood: '#b9854f', straw: '#e6c56a', stone: '#a7a195', cloth: '#d9c39a', barrel: '#a8683a', rock: '#8a8478' }
function onEvents() {
  for (const e of sim.events) handleEvent(e)
  sim.events.length = 0
}
function handleEvent(e: SimEvent) {
  switch (e.t) {
    case 'launch':
      play('flip', 0.9)
      arm.off = 0
      if (e.ammo === 'posaune') pose('horn', 0.9)
      else if (e.ammo === 'fackel') pose('torch', 0.9)
      else pose('stand', 0)
      for (let k = 0; k < 6; k++) spawn({ x: e.x, y: e.y, vx: (rand() - 0.2) * 3, vy: (rand() - 0.5) * 3, life: 0.4, r: 0.12, kind: 'dust', color: '#e8d6b0', rot: 0 })
      camMode = 'follow'
      break
    case 'hit': {
      const strong = e.power > 0.45
      if (e.m === 'stone' || e.m === 'rock') play('clunk', 0.4 + e.power * 0.5)
      else if (e.m === 'straw' || e.m === 'cloth') play('sack', 0.4 + e.power * 0.4)
      else play('hit', 0.35 + e.power * 0.5)
      spawn({ x: e.x, y: e.y, vx: 0, vy: 0.4, life: 0.45, r: 0.45 + e.power * 0.7, kind: 'puff', color: '#fff3d6', rot: 0 })
      const n = strong ? 8 : 4
      for (let k = 0; k < n; k++) spawn({ x: e.x, y: e.y, vx: (rand() - 0.5) * 7, vy: rand() * 5 + 1, life: 0.6, r: 0.07 + rand() * 0.08, kind: 'dust', color: '#cdb78f', rot: 0 })
      break
    }
    case 'break': {
      play(e.m === 'stone' ? 'clunk' : e.m === 'straw' || e.m === 'cloth' ? 'sack' : 'hit', 0.8)
      const n = e.m === 'straw' ? 16 : e.m === 'cloth' ? 10 : 12
      for (let k = 0; k < n; k++) {
        const kind = e.m === 'straw' ? 'straw' : e.m === 'cloth' ? 'cloth' : 'chip'
        spawn({
          x: e.x + (rand() - 0.5) * e.w * 0.8,
          y: e.y + (rand() - 0.5) * e.h * 0.8,
          vx: e.vx * 0.4 + (rand() - 0.5) * 6,
          vy: e.vy * 0.3 + rand() * 5,
          life: 0.9 + rand() * 0.5,
          r: 0.08 + rand() * 0.12,
          kind,
          color: MAT_COLOR[e.m] ?? '#b9854f',
          rot: rand() * 6
        })
      }
      spawn({ x: e.x, y: e.y, vx: 0, vy: 0.3, life: 0.6, r: 0.9, kind: 'puff', color: '#f4e6c4', rot: 0 })
      break
    }
    case 'klirr':
      play('snap', 0.9)
      rings.push({ x: e.x, y: e.y, t: 0, life: 0.45, r: e.r, kind: 'klirr' })
      for (let k = 0; k < 12; k++) spawn({ x: e.x, y: e.y, vx: (rand() - 0.5) * 9, vy: rand() * 6, life: 0.9, r: 0.08 + rand() * 0.1, kind: 'shard', color: '#c8754a', rot: rand() * 6 })
      spawn({ x: e.x, y: e.y, vx: 0, vy: 0.4, life: 0.5, r: 1.0, kind: 'puff', color: '#fff0d0', rot: 0 })
      break
    case 'blast':
      play('caravan', 0.9)
      rings.push({ x: e.x, y: e.y, t: 0, life: 0.7, r: e.r, kind: 'blast' }, { x: e.x, y: e.y, t: -0.12, life: 0.7, r: e.r * 0.8, kind: 'blast' }, { x: e.x, y: e.y, t: -0.24, life: 0.7, r: e.r * 0.6, kind: 'blast' })
      flash = 0.3
      break
    case 'light':
      play('star', 0.9)
      rings.push({ x: e.x, y: e.y, t: 0, life: 0.9, r: e.r, kind: 'light' })
      flash = 0.9
      for (let k = 0; k < 10; k++) spawn({ x: e.x, y: e.y, vx: (rand() - 0.5) * 5, vy: rand() * 4, life: 0.8, r: 0.5, kind: 'spark', color: '#ffe08a', rot: 0 })
      break
    case 'split':
      play('bead', 0.8)
      for (let k = 0; k < 8; k++) spawn({ x: e.x, y: e.y, vx: (rand() - 0.5) * 4, vy: (rand() - 0.5) * 4, life: 0.6, r: 0.4, kind: 'spark', color: '#ffd45a', rot: 0 })
      break
    case 'scare':
      play('tap', 0.8)
      spawn({ x: e.x, y: e.y + 0.9, vx: 0, vy: 1.2, life: 0.5, r: 0.5, kind: 'spark', color: '#fff6c0', rot: 0 })
      break
    case 'run':
      runners.push({ x: e.x, y: e.y, vy: 0, kind: e.kind, t: 0 })
      break
    case 'won':
      winT = 0
      slowT = 1.6
      play('found', 1)
      pose('cheer', 6)
      camMode = 'hold'
      camHold = 2.4
      finish(false)
      break
    case 'lost':
      loseTimer = window.setTimeout(() => finish(true), 900)
      break
  }
}
function pose(p: typeof gideonPose, seconds: number) {
  gideonPose = p
  poseT = seconds
}

function finish(lost: boolean) {
  if (screen.value !== 'play') return
  outcome.lost = lost
  outcome.stars = lost ? 0 : sim.stars
  outcome.used = sim.used
  outcome.par = sim.def.par
  outcome.scared = sim.scaredCount
  outcome.all = sim.guards.length
  if (!lost) progress.record(ID, level.value, outcome.stars)
  window.clearTimeout(endTimer)
  endTimer = window.setTimeout(
    () => {
      if (screen.value !== 'play') return
      screen.value = 'result'
      play(lost ? 'wrong' : 'result', 0.9)
    },
    lost ? 50 : 2600
  )
}

// ── the touch (the canvas is measured at every touch) ──────────────────────────────────────────────────────────────────────
type Drag = { kind: 'aim' } | { kind: 'pan'; x0: number; vx0: number; moved: boolean }
let drag: Drag | null = null
const live = () => screen.value === 'play' && !paused.value

function pos(e: PointerEvent): { x: number; y: number } {
  const c = canvas.value!
  const r = c.getBoundingClientRect()
  const kx = r.width > 0 ? cvW / r.width : 1
  const ky = r.height > 0 ? cvH / r.height : 1
  return { x: (e.clientX - r.left) * kx, y: (e.clientY - r.top) * ky }
}
const sxOf = (x: number) => (x - view.x) * view.s + cvW / 2
const syOf = (y: number) => groundY - y * view.s
const wxOf = (px: number) => (px - cvW / 2) / view.s + view.x
const wyOf = (py: number) => (groundY - py) / view.s

function updateAim(p: { x: number; y: number }) {
  let dx = wxOf(p.x) - CATAPULT.x
  let dy = wyOf(p.y) - CATAPULT.y
  const len = Math.hypot(dx, dy)
  if (len > MAX_PULL) {
    dx = (dx / len) * MAX_PULL
    dy = (dy / len) * MAX_PULL
  }
  aim = { dx, dy }
}
function onDown(e: PointerEvent) {
  if (!live() || sim.status !== 'play') return
  ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
  const p = pos(e)
  const cx = sxOf(CATAPULT.x)
  const cy = syOf(CATAPULT.y)
  const near = Math.hypot(p.x - cx, p.y - cy) < Math.max(96, 3.6 * view.s)
  if (near && sim.nextAmmo) {
    drag = { kind: 'aim' }
    camMode = 'aim'
    updateAim(p)
  } else if (hud.tappable) {
    doTap()
  } else {
    drag = { kind: 'pan', x0: p.x, vx0: view.x, moved: false }
  }
}
function onMove(e: PointerEvent) {
  if (!drag || !live()) return
  const p = pos(e)
  if (drag.kind === 'aim') updateAim(p)
  else {
    if (Math.abs(p.x - drag.x0) > 6) drag.moved = true
    if (drag.moved) {
      camMode = 'free'
      view.tx = drag.vx0 - (p.x - drag.x0) / view.s
      view.x = view.tx
    }
  }
}
function onUp() {
  const d = drag
  drag = null
  if (!d || !live()) return
  if (d.kind === 'aim' && aim) {
    const a = aim
    aim = null
    if (-a.dx > 0.25 && Math.hypot(a.dx, a.dy) >= MIN_POWER * MAX_PULL) {
      const s = pullToShot(a.dx, a.dy)
      const frac = Math.hypot(a.dx, a.dy) / MAX_PULL
      if (sim.fire(s.a, s.p)) {
        arm.off = frac * ARM_BACK
        arm.vel = -frac * 700
        launchFrom = { x: CATAPULT.x + a.dx, y: CATAPULT.y + a.dy, t: 0 }
        onEvents()
        syncHud()
      }
    }
  }
}
function onCancel() {
  drag = null
  aim = null
}
function doTap() {
  if (!live()) return
  if (sim.tap()) {
    onEvents()
    syncHud()
  }
}
function onKey(e: KeyboardEvent) {
  if (!live()) return
  if (e.key === ' ' || e.key === 'Enter') {
    doTap()
    e.preventDefault()
  }
}
function toggleOverview() {
  if (camMode === 'overview') camMode = 'aim'
  else {
    camMode = 'overview'
    overviewUntil = performance.now() + 60000
  }
}
let launchFrom: { x: number; y: number; t: number } | null = null

// ── the layout and the loop ─────────────────────────────────────────────────────────────────────────────────────────────────
const ARM_BACK = 62
function layout() {
  const c = canvas.value
  if (!c) return
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  const box = c.getBoundingClientRect()
  cvW = box.width || window.innerWidth
  cvH = box.height || window.innerHeight
  c.width = Math.round(cvW * dpr)
  c.height = Math.round(cvH * dpr)
  portrait = cvH > cvW * 1.05
  groundY = Math.round(cvH * (portrait ? 0.74 : 0.82))
  const width = sim.def.width
  // the picture shows the whole camp from the catapult to the last tower, as long as the things do not get too small
  const base = portrait ? cvW / 24 : Math.min(cvW / 27, cvH / 11.5)
  const fit = cvW / (farX + 4.4)
  aimScale = portrait ? base : Math.min(base, Math.max(fit, cvW / 46))
  overScale = Math.min(aimScale, cvW / (width + 4))
}
const aimCenter = () => -1.4 + cvW / aimScale / 2

function frame(now: number) {
  raf = requestAnimationFrame(frame)
  const dt = Math.min(0.05, (now - last) / 1000 || 0)
  last = now
  update(dt)
  draw(now / 1000)
}

function update(dt: number) {
  giTime += dt
  if (screen.value !== 'play') return
  if (!paused.value) {
    if (slowT > 0) slowT -= dt
    acc += dt * (slowT > 0 ? 0.3 : 1)
    let n = 0
    while (acc >= DT && n < 5) {
      sim.step()
      acc -= DT
      n++
      if (sim.events.length) onEvents()
    }
    if (n === 5) acc = 0
    syncHud()
    if (winT >= 0) winT += dt
    if (poseT > 0) {
      poseT -= dt
      if (poseT <= 0) gideonPose = sim.status === 'won' ? 'cheer' : 'stand'
    }
    // the spring of the arm
    const k = 520
    const c = 20
    arm.vel += (-k * arm.off - c * arm.vel) * dt
    arm.off += arm.vel * dt
    if (Math.abs(arm.off) < 0.05 && Math.abs(arm.vel) < 0.5) arm.off = arm.vel = 0
    if (launchFrom) {
      launchFrom.t += dt
      if (launchFrom.t > 0.07) launchFrom = null
    }
    if (flash > 0) flash -= dt
    updateCamera(dt)
    for (const p of parts) {
      p.t += dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vy -= (p.kind === 'dust' || p.kind === 'puff' ? 1 : p.kind === 'spark' ? -0.5 : 9) * dt
      if (p.kind !== 'spark' && p.kind !== 'puff' && p.y < 0.05 && p.vy < 0) {
        p.y = 0.05
        p.vy *= -0.2
        p.vx *= 0.6
      }
    }
    for (let i = parts.length - 1; i >= 0; i--) if (parts[i]!.t > parts[i]!.life) parts.splice(i, 1)
    for (const r of rings) r.t += dt
    for (let i = rings.length - 1; i >= 0; i--) if (rings[i]!.t > rings[i]!.life) rings.splice(i, 1)
    for (const r of runners) {
      r.t += dt
      r.x += 6.2 * dt
      r.vy -= 18 * dt
      r.y = Math.max(0, r.y + r.vy * dt)
      if (r.y === 0) r.vy = 0
    }
    for (let i = runners.length - 1; i >= 0; i--) if (runners[i]!.x > sim.def.width + 14) runners.splice(i, 1)
    for (const p of sim.projs) {
      if (p.dead || !p.body) continue
      let tr = trails.get(p)
      if (!tr) trails.set(p, (tr = []))
      const q = p.body.getPosition()
      tr.push({ x: q.x, y: q.y })
      if (tr.length > 16) tr.shift()
    }
  }
}

function updateCamera(dt: number) {
  const L = sim.def
  const now = performance.now()
  const viewW = cvW / aimScale
  const lo = aimCenter()
  const hi = Math.max(lo, L.width + 2 - viewW / 2 + 1)
  if (camMode === 'overview' && now > overviewUntil) camMode = 'aim'
  if (camMode === 'overview') {
    view.ts = overScale
    view.tx = (L.width + 2) / 2
  } else if (camMode === 'aim') {
    view.ts = aimScale
    view.tx = lo
  } else if (camMode === 'follow') {
    view.ts = aimScale
    const pr = [...sim.projs].reverse().find((p) => !p.dead && p.body)
    if (pr?.body) view.tx = Math.min(hi, Math.max(lo, pr.body.getPosition().x + viewW * 0.18))
    else {
      camMode = 'hold'
      camHold = 1.4
    }
  } else if (camMode === 'hold') {
    camHold -= dt
    if (camHold <= 0 && sim.status === 'play') camMode = 'aim'
  }
  const k = 1 - Math.exp(-dt * (camMode === 'follow' ? 6 : 3.2))
  if (camMode !== 'free') {
    view.x += (view.tx - view.x) * k
    view.s += (view.ts - view.s) * k
  }
}

// ── drawing ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const patterns: Record<string, CanvasPattern | null> = {}
const MAT_IMG: Record<string, string> = { wood: 'm-holz', straw: 'm-stroh', stone: 'm-stein', cloth: 'm-zelt', rock: 'm-stein', barrel: 'm-holz' }
const patMatrix = typeof DOMMatrix !== 'undefined' ? new DOMMatrix() : null
function patternFor(c: CanvasRenderingContext2D, mat: string): CanvasPattern | null {
  if (mat in patterns) return patterns[mat]!
  const name = MAT_IMG[mat]
  const im = name ? img[name] : undefined
  patterns[mat] = im ? c.createPattern(im, 'repeat') : null
  return patterns[mat]!
}
/** Fills the rectangle (in the turned local frame, in pixels) with the material: a painted tile, or a flat colour. */
function fillMat(c: CanvasRenderingContext2D, mat: string, x: number, y: number, w: number, h: number, vertical: boolean, tileM = 2) {
  const pat = patternFor(c, mat)
  const im = img[MAT_IMG[mat] ?? '']
  if (pat && im && patMatrix) {
    const k = (tileM * view.s) / im.width
    patMatrix.a = vertical ? 0 : k
    patMatrix.b = vertical ? k : 0
    patMatrix.c = vertical ? -k : 0
    patMatrix.d = vertical ? 0 : k
    patMatrix.e = x
    patMatrix.f = y
    pat.setTransform(patMatrix)
    c.fillStyle = pat
  } else c.fillStyle = FLAT[mat] ?? '#aaa'
  c.fillRect(x, y, w, h)
}

function drawPart(c: CanvasRenderingContext2D, p: Part) {
  const d = p.def
  const pos = p.body.getPosition()
  const ang = p.body.getAngle()
  const s = view.s
  const px = sxOf(pos.x)
  const py = syOf(pos.y)
  if (px < -200 || px > cvW + 200) return
  c.save()
  c.translate(px, py)
  c.rotate(-ang)
  const hw = (d.w / 2) * s
  const hh = (d.h / 2) * s
  const shape = d.s ?? (d.m === 'barrel' ? 'circle' : 'box')
  const ratio = p.hp / p.maxHp
  if (shape === 'circle') {
    const im = img['fass']
    if (im) c.drawImage(im, -hw * 1.08, -hh * 1.1, hw * 2.16, hh * 2.2)
    else {
      c.fillStyle = FLAT.barrel!
      c.beginPath()
      c.arc(0, 0, hw, 0, Math.PI * 2)
      c.fill()
      c.strokeStyle = '#3b2412'
      c.lineWidth = 2
      c.stroke()
      c.beginPath()
      c.moveTo(-hw, -hh * 0.4)
      c.lineTo(hw, -hh * 0.4)
      c.moveTo(-hw, hh * 0.4)
      c.lineTo(hw, hh * 0.4)
      c.stroke()
    }
  } else if (shape === 'tent') {
    c.beginPath()
    c.moveTo(-hw, hh)
    c.lineTo(hw, hh)
    c.lineTo(hw * 0.1, -hh)
    c.lineTo(-hw * 0.1, -hh)
    c.closePath()
    c.save()
    c.clip()
    fillMat(c, 'cloth', -hw, -hh, hw * 2, hh * 2, false, 3)
    c.fillStyle = 'rgba(70,40,20,0.18)'
    c.fillRect(-hw, -hh, hw * 2, hh * 2)
    c.restore()
    c.strokeStyle = 'rgba(50,28,12,0.85)'
    c.lineWidth = 2
    c.stroke()
    c.beginPath()
    c.moveTo(0, -hh)
    c.lineTo(0, hh)
    c.strokeStyle = 'rgba(50,28,12,0.4)'
    c.lineWidth = 1.5
    c.stroke()
  } else {
    const vertical = d.h > d.w * 1.3
    const mat = d.m
    c.beginPath()
    c.roundRect(-hw, -hh, hw * 2, hh * 2, Math.min(4, hw, hh))
    c.save()
    c.clip()
    fillMat(c, mat, -hw, -hh, hw * 2, hh * 2, vertical, mat === 'straw' ? 1.6 : mat === 'stone' ? 1.8 : 2)
    c.fillStyle = 'rgba(255,240,200,0.22)'
    c.fillRect(-hw, -hh, hw * 2, Math.min(3, hh * 0.3))
    c.fillStyle = 'rgba(30,16,6,0.28)'
    c.fillRect(-hw, hh - Math.min(3, hh * 0.3), hw * 2, Math.min(3, hh * 0.3))
    if (ratio < 0.7) {
      c.strokeStyle = 'rgba(30,16,6,0.6)'
      c.lineWidth = 1.5
      c.beginPath()
      const n = ratio < 0.35 ? 3 : 2
      for (let k = 0; k < n; k++) {
        const u = -0.6 + k * (1.2 / n)
        c.moveTo(u * hw, -hh)
        c.lineTo(u * hw + hw * 0.15, -hh * 0.2)
        c.lineTo(u * hw - hw * 0.1, hh * 0.3)
        c.lineTo(u * hw + hw * 0.12, hh)
      }
      c.stroke()
    }
    c.restore()
    c.strokeStyle = 'rgba(40,22,8,0.8)'
    c.lineWidth = 2
    c.stroke()
  }
  c.restore()
}

function drawRock(c: CanvasRenderingContext2D, r: { x: number; y: number; w: number; h: number }) {
  const s = view.s
  const x0 = sxOf(r.x - r.w / 2)
  const y0 = syOf(r.y + r.h / 2)
  const w = r.w * s
  const h = r.h * s
  if (r.w < 1 && r.h < 1) {
    // the foot of a seesaw: a wedge of wood
    c.beginPath()
    c.moveTo(sxOf(r.x) - w * 1.3, syOf(0))
    c.lineTo(sxOf(r.x) + w * 1.3, syOf(0))
    c.lineTo(sxOf(r.x), y0)
    c.closePath()
    c.save()
    c.clip()
    fillMat(c, 'wood', sxOf(r.x) - w * 1.3, y0, w * 2.6, h, false, 1.4)
    c.restore()
    c.strokeStyle = 'rgba(40,22,8,0.85)'
    c.lineWidth = 2
    c.stroke()
    return
  }
  c.save()
  c.beginPath()
  c.roundRect(x0, y0, w, h + 4, 6)
  c.clip()
  fillMat(c, 'rock', x0, y0, w, h + 4, false, 3)
  c.fillStyle = 'rgba(40,36,34,0.35)'
  c.fillRect(x0, y0, w, h + 4)
  c.fillStyle = 'rgba(200,190,150,0.35)'
  c.fillRect(x0, y0, w, 4)
  c.restore()
  c.strokeStyle = 'rgba(30,24,20,0.85)'
  c.lineWidth = 2.5
  c.beginPath()
  c.roundRect(x0, y0, w, h + 4, 6)
  c.stroke()
}

function bodyAngleOf(g: Guard): number {
  return g.body ? g.body.getAngle() : 0
}
function drawGuardAt(c: CanvasRenderingContext2D, x: number, y: number, ang: number, kind: number, pose: 'stand' | 'scared' | 'run', t: number) {
  const s = view.s
  const px = sxOf(x)
  const py = syOf(y)
  c.save()
  c.translate(px, py)
  c.rotate(-ang)
  const im = img[`w${kind}-${pose}`]
  const h = 1.95 * s
  if (im) {
    const w = (im.width / im.height) * h
    c.drawImage(im, -w / 2, 0.78 * s - h, w, h)
  } else {
    const bw = 0.76 * s
    const bh = 1.56 * s
    const col = ['#c9a96b', '#b8473a', '#4f8a5a'][kind % 3]!
    c.fillStyle = col
    c.beginPath()
    c.roundRect(-bw / 2, -bh / 2 + bh * 0.28, bw, bh * 0.72, 8)
    c.fill()
    c.fillStyle = '#e8c9a0'
    c.beginPath()
    c.arc(0, -bh / 2 + bh * 0.2, bw * 0.42, 0, Math.PI * 2)
    c.fill()
    c.fillStyle = ['#f3efe6', '#9b2d28', '#35703f'][kind % 3]!
    c.beginPath()
    c.arc(0, -bh / 2 + bh * 0.1, bw * 0.46, Math.PI, 0)
    c.fill()
    c.fillStyle = '#2a1a10'
    const ey = -bh / 2 + bh * 0.2
    if (pose === 'stand') {
      c.fillRect(-bw * 0.18, ey, 3, 3)
      c.fillRect(bw * 0.12, ey, 3, 3)
    } else {
      c.beginPath()
      c.arc(-bw * 0.16, ey, 4, 0, Math.PI * 2)
      c.arc(bw * 0.16, ey, 4, 0, Math.PI * 2)
      c.fill()
      c.beginPath()
      c.arc(0, ey + bw * 0.22, 4, 0, Math.PI * 2)
      c.fill()
      c.strokeStyle = col
      c.lineWidth = 4
      c.beginPath()
      c.moveTo(-bw / 2, -bh * 0.1)
      c.lineTo(-bw * 0.9, -bh * 0.5 + Math.sin(t * 20) * 4)
      c.moveTo(bw / 2, -bh * 0.1)
      c.lineTo(bw * 0.9, -bh * 0.5 - Math.sin(t * 20) * 4)
      c.stroke()
    }
  }
  c.restore()
}

function drawBubble(c: CanvasRenderingContext2D, x: number, y: number, text: string) {
  const s = view.s
  const px = sxOf(x)
  const py = syOf(y)
  const fs = Math.max(11, Math.min(20, s * 0.7))
  c.font = `800 ${fs}px system-ui, sans-serif`
  const w = c.measureText(text).width + 14
  const h = fs + 10
  c.fillStyle = 'rgba(255,255,250,0.96)'
  c.strokeStyle = 'rgba(60,40,20,0.8)'
  c.lineWidth = 2
  c.beginPath()
  c.roundRect(px - w / 2, py - h, w, h, 10)
  c.fill()
  c.stroke()
  c.beginPath()
  c.moveTo(px - 5, py)
  c.lineTo(px + 3, py + 8)
  c.lineTo(px + 6, py)
  c.closePath()
  c.fill()
  c.fillStyle = '#7a1d12'
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  c.fillText(text, px, py - h / 2 + 1)
}

function drawJar(c: CanvasRenderingContext2D, ammo: Ammo, x: number, y: number, ang: number, scale = 1) {
  const s = view.s
  const info = AMMO[ammo]
  const px = sxOf(x)
  const py = syOf(y)
  c.save()
  c.translate(px, py)
  c.rotate(-ang)
  const im = img[SPRITE_OF[ammo]]
  if (im) {
    const long = ammo === 'posaune' ? 2.5 : 2.4
    const h = info.r * long * s * scale
    const w = (im.width / im.height) * h
    c.drawImage(im, -w / 2, -h / 2, w, h)
  } else {
    const r = info.r * s * scale
    c.fillStyle = ammo === 'stein' ? '#8a847a' : ammo === 'posaune' ? '#c9a24a' : '#c8754a'
    c.beginPath()
    c.arc(0, 0, r, 0, Math.PI * 2)
    c.fill()
    c.strokeStyle = '#3b2412'
    c.lineWidth = 2
    c.stroke()
    if (ammo === 'fackel') {
      c.fillStyle = '#ffd24a'
      c.beginPath()
      c.arc(0, -r, r * 0.4, 0, Math.PI * 2)
      c.fill()
    } else if (ammo === 'ruf') {
      c.strokeStyle = '#ffd24a'
      c.lineWidth = 3
      c.beginPath()
      c.moveTo(-r, -r * 0.2)
      c.lineTo(r, -r * 0.2)
      c.stroke()
    } else if (ammo === 'posaune') {
      c.fillStyle = '#5a3a14'
      c.fillRect(-r * 0.9, -r * 0.2, r * 1.8, r * 0.4)
    }
  }
  c.restore()
}

const ARM_PIVOT = { x: 1.55, y: 1.5 }
const ARM_REST_DEG = 28
function drawCatapult(c: CanvasRenderingContext2D) {
  const s = view.s
  // the frame
  const fr = img['katapult-gestell']
  const fh = 2.8 * s
  const fw = fr ? (fr.width / fr.height) * fh : 3.4 * s
  const fx = sxOf(1.75)
  const fy = syOf(0)
  if (fr) c.drawImage(fr, fx - fw / 2, fy - fh, fw, fh)
  else {
    c.fillStyle = '#8a5a2e'
    c.fillRect(fx - fw / 2, fy - fh * 0.5, fw, fh * 0.12)
    c.fillRect(fx - fw * 0.38, fy - fh * 0.9, fw * 0.1, fh * 0.9)
    c.fillRect(fx + fw * 0.28, fy - fh * 0.9, fw * 0.1, fh * 0.9)
    c.fillStyle = '#4a3220'
    c.beginPath()
    c.arc(fx - fw * 0.3, fy - fh * 0.07, fh * 0.1, 0, Math.PI * 2)
    c.arc(fx + fw * 0.3, fy - fh * 0.07, fh * 0.1, 0, Math.PI * 2)
    c.fill()
  }
  // the arm turns back when the cup is pulled (and swings forward when it is let go)
  const pull = aim ? Math.hypot(aim.dx, aim.dy) / MAX_PULL : 0
  const angDeg = ARM_REST_DEG + (aim ? pull * ARM_BACK : arm.off)
  const a = (angDeg * Math.PI) / 180
  const armLen = 2.0
  const tip = { x: ARM_PIVOT.x + Math.cos(a) * armLen, y: ARM_PIVOT.y + Math.sin(a) * armLen }
  const armIm = img['katapult-arm']
  c.save()
  c.translate(sxOf(ARM_PIVOT.x), syOf(ARM_PIVOT.y))
  c.rotate(-a)
  const al = (armLen + 0.9) * s
  const ah = Math.max(8, 0.34 * s)
  if (armIm) {
    const h2 = (armIm.height / armIm.width) * al
    c.drawImage(armIm, -0.9 * s, -h2 / 2, al, h2)
  } else {
    c.fillStyle = '#7a4f28'
    c.fillRect(-0.9 * s, -ah / 2, al, ah)
    c.strokeStyle = '#3b2412'
    c.lineWidth = 2
    c.strokeRect(-0.9 * s, -ah / 2, al, ah)
  }
  c.restore()
  // the cup: at the rest place, or pulled by the finger, or snapping back
  let cup = { x: CATAPULT.x, y: CATAPULT.y }
  if (aim) cup = { x: CATAPULT.x + aim.dx, y: CATAPULT.y + aim.dy }
  else if (arm.off !== 0) cup = { x: tip.x + 0.1, y: tip.y - 0.05 }
  // ropes from the tip of the arm to the cup (and the spring rope to the frame)
  c.strokeStyle = '#5b3a1a'
  c.lineWidth = Math.max(2, 0.09 * s)
  c.lineCap = 'round'
  c.beginPath()
  c.moveTo(sxOf(tip.x), syOf(tip.y))
  c.lineTo(sxOf(cup.x), syOf(cup.y + 0.08))
  c.moveTo(sxOf(tip.x), syOf(tip.y - 0.12))
  c.lineTo(sxOf(cup.x), syOf(cup.y - 0.08))
  c.stroke()
  c.strokeStyle = '#c9a24a'
  c.lineWidth = Math.max(1.5, 0.05 * s)
  c.beginPath()
  const bx = sxOf(ARM_PIVOT.x - 0.4)
  const by = syOf(ARM_PIVOT.y - 0.3)
  const ex = sxOf(ARM_PIVOT.x + Math.cos(a + Math.PI) * 0.8)
  const ey = syOf(ARM_PIVOT.y + Math.sin(a + Math.PI) * 0.8)
  c.moveTo(bx, by)
  for (let k = 1; k <= 8; k++) c.lineTo(bx + ((ex - bx) * k) / 8, by + ((ey - by) * k) / 8 + (k % 2 ? -4 : 4))
  c.stroke()
  // the pouch and the loaded jar
  const pouch = img['katapult-schale']
  const pw = 1.5 * s
  if (pouch) {
    const ph = (pouch.height / pouch.width) * pw
    c.drawImage(pouch, sxOf(cup.x) - pw / 2, syOf(cup.y) - ph * 0.5, pw, ph)
  } else {
    c.fillStyle = '#7a5a30'
    c.beginPath()
    c.arc(sxOf(cup.x), syOf(cup.y), 0.45 * s, 0, Math.PI)
    c.fill()
  }
  if (sim.nextAmmo && !launchFrom) drawJar(c, sim.nextAmmo, cup.x, cup.y + 0.22, 0, 1)
}

function drawGideon(c: CanvasRenderingContext2D) {
  const nm = gideonPose === 'stand' ? 'g-stand' : gideonPose === 'cheer' ? 'g-cheer' : gideonPose === 'horn' ? 'g-horn' : 'g-torch'
  const im = img[nm]
  const s = view.s
  const h = 1.9 * s
  const jump = gideonPose === 'cheer' ? Math.abs(Math.sin(giTime * 7)) * 0.55 : 0
  const x = sxOf(-0.2)
  const y = syOf(jump)
  if (im) {
    const w = (im.width / im.height) * h
    c.drawImage(im, x - w / 2, y - h, w, h)
  } else {
    c.fillStyle = '#7a5a3a'
    c.beginPath()
    c.roundRect(x - 0.3 * s, y - 1.5 * s, 0.6 * s, 1.5 * s, 8)
    c.fill()
    c.fillStyle = '#e8c9a0'
    c.beginPath()
    c.arc(x, y - 1.65 * s, 0.26 * s, 0, Math.PI * 2)
    c.fill()
  }
}

function drawRing(c: CanvasRenderingContext2D, r: Ring) {
  if (r.t < 0) return
  const k = r.t / r.life
  const rad = r.r * view.s * (0.15 + 0.85 * k)
  const px = sxOf(r.x)
  const py = syOf(r.y)
  c.globalAlpha = Math.max(0, 1 - k)
  if (r.kind === 'light') {
    const g = c.createRadialGradient(px, py, 0, px, py, rad)
    g.addColorStop(0, 'rgba(255,248,200,0.95)')
    g.addColorStop(0.5, 'rgba(255,220,120,0.5)')
    g.addColorStop(1, 'rgba(255,200,80,0)')
    c.fillStyle = g
    c.beginPath()
    c.arc(px, py, rad, 0, Math.PI * 2)
    c.fill()
  } else {
    c.strokeStyle = r.kind === 'blast' ? 'rgba(255,236,170,0.95)' : 'rgba(255,255,255,0.8)'
    c.lineWidth = r.kind === 'blast' ? 7 * (1 - k) + 2 : 3
    c.beginPath()
    c.arc(px, py, rad, 0, Math.PI * 2)
    c.stroke()
  }
  c.globalAlpha = 1
}

function drawParticle(c: CanvasRenderingContext2D, p: Particle) {
  const k = p.t / p.life
  const px = sxOf(p.x)
  const py = syOf(p.y)
  const s = view.s
  c.globalAlpha = Math.max(0, 1 - k) * (p.kind === 'puff' ? 0.85 : 1)
  if (p.kind === 'puff') {
    c.fillStyle = p.color
    c.beginPath()
    c.arc(px, py, p.r * s * (0.5 + k), 0, Math.PI * 2)
    c.arc(px + p.r * s * 0.5 * (0.5 + k), py - p.r * s * 0.25, p.r * s * 0.6 * (0.5 + k), 0, Math.PI * 2)
    c.arc(px - p.r * s * 0.5 * (0.5 + k), py - p.r * s * 0.15, p.r * s * 0.55 * (0.5 + k), 0, Math.PI * 2)
    c.fill()
  } else if (p.kind === 'spark') {
    const g = glow.complete && glow.naturalWidth ? glow : null
    const sz = p.r * s * (1 - k * 0.4)
    if (g) c.drawImage(g, px - sz / 2, py - sz / 2, sz, sz)
    else {
      c.fillStyle = p.color
      c.beginPath()
      c.arc(px, py, sz / 3, 0, Math.PI * 2)
      c.fill()
    }
  } else if (p.kind === 'straw') {
    c.strokeStyle = p.color
    c.lineWidth = 2
    c.beginPath()
    const a = p.rot + p.t * 6
    c.moveTo(px - Math.cos(a) * p.r * s, py - Math.sin(a) * p.r * s)
    c.lineTo(px + Math.cos(a) * p.r * s, py + Math.sin(a) * p.r * s)
    c.stroke()
  } else if (p.kind === 'shard') {
    const sh = img['scherben']
    c.save()
    c.translate(px, py)
    c.rotate(p.rot + p.t * 9)
    if (sh) c.drawImage(sh, -p.r * s * 1.5, -p.r * s * 1.5, p.r * s * 3, p.r * s * 3)
    else {
      c.fillStyle = p.color
      c.beginPath()
      c.moveTo(-p.r * s, p.r * s * 0.6)
      c.lineTo(p.r * s, p.r * s * 0.2)
      c.lineTo(0, -p.r * s)
      c.fill()
    }
    c.restore()
  } else if (p.kind === 'chip' || p.kind === 'cloth') {
    c.save()
    c.translate(px, py)
    c.rotate(p.rot + p.t * 8)
    c.fillStyle = p.color
    c.fillRect(-p.r * s, -p.r * s * 0.4, p.r * s * 2, p.r * s * 0.8)
    c.restore()
  } else {
    c.fillStyle = p.color
    c.beginPath()
    c.arc(px, py, Math.max(1.5, p.r * s), 0, Math.PI * 2)
    c.fill()
  }
  c.globalAlpha = 1
}

function drawPennant(c: CanvasRenderingContext2D, time: number) {
  const w = sim.def.wind
  if (!w) return
  const s = view.s
  const x = sxOf(7.5)
  const y0 = syOf(0)
  c.strokeStyle = '#5a3a1a'
  c.lineWidth = Math.max(2, 0.12 * s)
  c.beginPath()
  c.moveTo(x, y0)
  c.lineTo(x, syOf(5))
  c.stroke()
  const len = (0.6 + Math.min(1.6, Math.abs(w) * 0.55)) * s
  const dir = w > 0 ? 1 : -1
  c.fillStyle = '#e0b030'
  c.strokeStyle = '#6b4a10'
  c.lineWidth = 1.5
  c.beginPath()
  c.moveTo(x, syOf(5))
  for (let k = 1; k <= 6; k++) c.lineTo(x + (dir * len * k) / 6, syOf(5) + Math.sin(time * 6 + k) * 3 * (k / 6) + (k / 6) * 6)
  for (let k = 6; k >= 1; k--) c.lineTo(x + (dir * len * k) / 6, syOf(5) + 0.45 * s * (1 - k / 7) + Math.sin(time * 6 + k + 1) * 3 * (k / 6) + 4)
  c.closePath()
  c.fill()
  c.stroke()
}

function draw(time: number) {
  const c = ctx
  if (!c || !loaded.value) return
  c.setTransform(dpr, 0, 0, dpr, 0, 0)
  c.fillStyle = '#10142a'
  c.fillRect(0, 0, cvW, cvH)
  if (screen.value === 'menu') return
  const L = LEVELS[level.value]!
  const chap = L.chapter
  // the sky and the hills: the picture is laid so that its horizon (at 68 % of its height) lies on the ground line
  const bg = img[`bg-${chap + 1}`]
  if (bg) {
    const k = Math.max(cvW / bg.width, (cvH - groundY + groundY / 0.68 * 0.68) / bg.height, groundY / (0.68 * bg.height))
    const bw = bg.width * k
    const bh = bg.height * k
    const shift = (view.x - 20) * view.s * 0.04
    c.drawImage(bg, (cvW - bw) / 2 - Math.max(-(bw - cvW) / 2, Math.min((bw - cvW) / 2, shift)), groundY - bh * 0.68, bw, bh)
    if (groundY - bh * 0.68 + bh < cvH) {
      c.fillStyle = '#6b5a40'
      c.fillRect(0, groundY - bh * 0.68 + bh - 1, cvW, cvH)
    }
  } else {
    const [a, b] = SKY[chap]!
    const g = c.createLinearGradient(0, 0, 0, groundY)
    g.addColorStop(0, a)
    g.addColorStop(1, b)
    c.fillStyle = g
    c.fillRect(0, 0, cvW, groundY)
    c.fillStyle = '#6b5a3c'
    c.fillRect(0, groundY, cvW, cvH - groundY)
  }
  // the ground line
  c.fillStyle = 'rgba(40,26,12,0.42)'
  c.fillRect(0, groundY, cvW, 3)
  c.fillStyle = 'rgba(255,230,170,0.18)'
  c.fillRect(0, groundY + 3, cvW, 2)
  const shake = sim.status === 'won' && winT >= 0 && winT < 0.5 ? Math.sin(time * 90) * 3 * (1 - winT / 0.5) : 0
  c.save()
  c.translate(shake, 0)
  drawPennant(c, time)
  drawCatapult(c)
  drawGideon(c)
  for (const r of sim.def.rocks ?? []) drawRock(c, r)
  // the ropes of the swinging logs
  for (const r of sim.ropes) {
    if (r.part.dead) continue
    const top = r.part.body.getWorldPoint({ x: r.lx, y: r.ly } as never)
    c.strokeStyle = '#5b3a1a'
    c.lineWidth = Math.max(2, 0.1 * view.s)
    c.beginPath()
    c.moveTo(sxOf(r.x), syOf(r.y))
    c.lineTo(sxOf(top.x), syOf(top.y))
    c.stroke()
  }
  for (const p of sim.parts) if (!p.dead) drawPart(c, p)
  for (const g of sim.guards) {
    if (!g.body) continue
    const pos = g.body.getPosition()
    drawGuardAt(c, pos.x, pos.y, bodyAngleOf(g), g.def.kind, g.scared ? 'scared' : 'stand', g.since + time)
    if (g.scared) drawBubble(c, pos.x, pos.y + 1.2, helpText.value)
  }
  for (const r of runners) {
    const bob = Math.abs(Math.sin(r.t * 14)) * 0.14
    drawGuardAt(c, r.x, r.y + 0.78 + bob, 0.1 * Math.sin(r.t * 14), r.kind, 'run', r.t)
    if (r.t < 2.4) drawBubble(c, r.x, r.y + 2.3, helpText.value)
  }
  // the thrown things with their trails
  for (const [pr, tr] of trails) {
    const p = pr as { dead: boolean }
    if (p.dead && tr.length) tr.shift()
    if (!tr.length) {
      trails.delete(pr)
      continue
    }
    for (let i = 0; i < tr.length; i++) {
      c.globalAlpha = (i / tr.length) * 0.5
      c.fillStyle = '#fff4cf'
      c.beginPath()
      c.arc(sxOf(tr[i]!.x), syOf(tr[i]!.y), Math.max(1.5, view.s * 0.1 * (i / tr.length)), 0, Math.PI * 2)
      c.fill()
    }
    c.globalAlpha = 1
  }
  for (const p of sim.projs) {
    if (p.dead || !p.body) continue
    const q = p.body.getPosition()
    let x = q.x
    let y = q.y
    if (launchFrom && p.age < 0.08) {
      const k = Math.min(1, launchFrom.t / 0.07)
      x = launchFrom.x + (q.x - launchFrom.x) * k
      y = launchFrom.y + (q.y - launchFrom.y) * k
    }
    const small = p.ammo === 'ruf' && p.body.getFixtureList()?.getShape().getRadius() === 0.36
    drawJar(c, p.ammo, x, y, p.body.getAngle(), small ? 0.86 : 1)
    if (hud.tappable && !p.used && (p.ammo === 'posaune' || p.ammo === 'fackel' || p.ammo === 'ruf')) {
      c.strokeStyle = `rgba(255,236,150,${0.5 + 0.4 * Math.sin(time * 10)})`
      c.lineWidth = 3
      c.beginPath()
      c.arc(sxOf(x), syOf(y), view.s * (AMMO[p.ammo].r + 0.35), 0, Math.PI * 2)
      c.stroke()
    }
  }
  // the preview of the throw
  if (aim && live()) {
    const sh = pullToShot(aim.dx, aim.dy)
    const path = previewPath(sh.a, sh.p, sim.def.wind, 16, 4)
    for (let i = 0; i < path.length; i++) {
      c.globalAlpha = 1 - i / (path.length + 2)
      c.fillStyle = '#fff6d0'
      c.strokeStyle = 'rgba(60,36,10,0.7)'
      c.lineWidth = 1.2
      c.beginPath()
      c.arc(sxOf(path[i]!.x), syOf(path[i]!.y), Math.max(2.5, view.s * 0.13 * (1 - i / 24)), 0, Math.PI * 2)
      c.fill()
      c.stroke()
    }
    c.globalAlpha = 1
  }
  for (const r of rings) drawRing(c, r)
  for (const p of parts) drawParticle(c, p)
  // a trumpet blast or a torch light brightens the picture for a moment
  if (flash > 0) {
    c.fillStyle = `rgba(255,244,200,${Math.min(0.35, flash * 0.4)})`
    c.fillRect(-10, -10, cvW + 20, cvH + 20)
  }
  c.restore()
  // the cheer after the win: golden sparkles rise from the camp
  if (winT >= 0 && glow.complete && glow.naturalWidth) {
    for (let i = 0; i < 14; i++) {
      const t = (winT * 0.6 + i / 14) % 1
      const x = ((i * 0.37 + 0.1) % 1) * cvW
      const y = cvH * (0.85 - t * 0.7)
      c.globalAlpha = Math.sin(t * Math.PI) * 0.9
      const sz = 26 + (i % 3) * 12
      c.drawImage(glow, x - sz / 2, y - sz / 2, sz, sz)
    }
    c.globalAlpha = 1
  }
}

// ── the page ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const hideBroken = (e: Event) => {
  ;(e.target as HTMLElement).style.display = 'none'
}
const bannerSrc = (c: number) => pic(`bg-${c + 1}`)
const jarSrc = (a: string) => pic(SPRITE_OF[a as Ammo] ?? 'krug')
const icon = (a: string) => JAR_ICON[a as Ammo] ?? '🏺'
const levelNo = (i: number) => (LEVELS[i]?.index ?? 0) + 1
const resultText = computed(() => (outcome.lost ? TX('lost') : TX(`won${Math.max(1, outcome.stars)}`)))
const stars2 = computed(() => hud.used <= hud.par + 1)
const stars3 = computed(() => hud.used <= hud.par)
const windText = computed(() => {
  const w = hud.wind
  if (Math.abs(w) < 0.1) return ''
  return (w > 0 ? '→' : '←').repeat(Math.min(3, Math.ceil(Math.abs(w) * 1.5)))
})
const lastChapterLevel = computed(() => LEVELS[level.value]?.index === LEVELS_PER_CHAPTER - 1 && !outcome.lost)

function leave() {
  emit('leave')
}

function setProbe() {
  if (window.location.hash.includes('probe=1')) {
    ;(window as unknown as { __gideon?: unknown }).__gideon = {
      get sim() {
        return sim
      },
      begin,
      fire: (a: number, p: number, tap?: number) => {
        const ok = sim.fire(a, p, tap)
        onEvents()
        syncHud()
        return ok
      },
      tap: doTap,
      advance: (sec = 0.5) => {
        for (let i = 0; i < Math.round(sec / DT); i++) {
          sim.step()
          if (sim.events.length) onEvents()
        }
        syncHud()
      },
      draw: () => draw(performance.now() / 1000)
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
  window.visualViewport?.addEventListener('resize', layout)
  window.addEventListener('keydown', onKey)
  if (typeof ResizeObserver !== 'undefined' && canvas.value) {
    ro = new ResizeObserver(() => layout())
    ro.observe(canvas.value)
  }
  music.playGame('memory')
  setProbe()
  await loadAll()
  last = performance.now()
  raf = requestAnimationFrame(frame)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  window.clearTimeout(endTimer)
  window.clearTimeout(loseTimer)
  window.clearTimeout(hintTimer)
  ro?.disconnect()
  music.stop('game')
  window.removeEventListener('resize', layout)
  window.visualViewport?.removeEventListener('resize', layout)
  window.removeEventListener('keydown', onKey)
  document.body.style.overflow = bodyOverflow
})
void BLAST_R
void LIGHT_R
</script>

<template lang="pug">
  div(class="gd")
    canvas(
      ref="canvas"
      class="gd-canvas"
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onCancel"
    )

    div(v-if="!loaded" class="gd-center")
      div(class="gd-spinner")

    //- the overview: the story, the chapters and the levels
    div(v-else-if="screen === 'menu'" class="gd-menu")
      div(class="gd-card")
        h1(class="gd-title") {{ TX('title') }}
        p(class="gd-text") {{ TX('story') }}
        p(class="gd-text gd-text--task") {{ TX('task') }}
        p(v-if="allDone" class="gd-done") {{ TX('allDone') }}
        div(v-for="(ct, c) in chapterTexts" :key="c" class="gd-chapter")
          div(class="gd-banner")
            img(:src="bannerSrc(c)" alt="" class="gd-banner-pic" @error="hideBroken")
            div(class="gd-banner-text")
              span(class="gd-ch-name") {{ ct.name }}
              span(class="gd-ch-ref") {{ ct.ref }}
              span(class="gd-ch-stars") ★ {{ chapterStars(c) }} / {{ LEVELS_PER_CHAPTER * 3 }}
          p(class="gd-ch-story") {{ ct.story }}
          div(class="gd-levels")
            button(
              v-for="i in chapterLevels(c)"
              :key="i"
              type="button"
              class="gd-level"
              :aria-label="levelNames[i]"
              :data-test="'gideon-level-' + i"
              @click="begin(i)"
            )
              span(class="gd-level-no") {{ i - c * LEVELS_PER_CHAPTER + 1 }}
              span(class="gd-level-name") {{ levelNames[i] }}
              AdventureStars(:stars="levelStars[i] ?? 0" :size="16")
        p(class="gd-rules") {{ TX('starRules') }}
        div(class="gd-menu-buttons")
          AdvButton(tone="blau" small data-test="gideon-how" @click="how = true; screen = 'play'; begin(0)") {{ TX('howTitle') }}
          AdvButton(tone="blau" small @click="leave") {{ TX('leave') }}

    //- the game
    template(v-else-if="screen === 'play'")
      div(class="gd-top")
        div(class="gd-top-btns")
          button(type="button" class="gd-btn" :aria-label="TX('pause')" data-test="gideon-pause" @click="paused = true") ❚❚
          button(type="button" class="gd-btn" :aria-label="TX('restart')" data-test="gideon-restart" @click="begin(level)") ↻
          button(type="button" class="gd-btn" :aria-label="TX('overview')" data-test="gideon-overview" @click="toggleOverview") ⤢
        div(class="gd-info")
          span(class="gd-level-label") {{ chapterTexts[chapterOf(level)]?.name }} · {{ TX('level') }} {{ levelNo(level) }}
          div(class="gd-stars-live")
            span(class="gd-star is-on") ★
            span(:class="['gd-star', { 'is-on': stars2 }]") ★
            span(:class="['gd-star', { 'is-on': stars3 }]") ★
          span(class="gd-left" data-test="gideon-guards") {{ TX('scaredOf', { n: hud.scared, all: hud.all }) }}
        div(v-if="windText" class="gd-wind" aria-hidden="true") 💨 {{ windText }}

      div(class="gd-queue")
        div(
          v-for="(a, i) in hud.queue"
          :key="i"
          :class="['gd-q', { 'is-next': i === 0 }]"
          :title="TX('ammo.' + a)"
        )
          span(class="gd-q-icon") {{ icon(a) }}
          img(:src="jarSrc(a)" alt="" class="gd-q-pic" @error="hideBroken")

      button(
        v-if="hud.tappable"
        type="button"
        class="gd-tap"
        data-test="gideon-tap"
        @click="doTap"
      )
        span(class="gd-tap-icon") {{ icon(hud.tapAmmo) }}
        span {{ TX('tapNow') }}
      div(v-if="hintShown" class="gd-tip") {{ hintText }}

      div(v-if="paused && !how && chapterCard < 0" class="gd-menu gd-menu--dim")
        div(class="gd-card gd-card--small")
          h2(class="gd-title") {{ TX('pause') }}
          AdvButton(data-test="gideon-resume" @click="paused = false") {{ TX('resume') }}
          AdvButton(tone="blau" data-test="gideon-pause-again" @click="begin(level)") {{ TX('again') }}
          AdvButton(tone="blau" data-test="gideon-menu" @click="toMenu") {{ TX('menu') }}

    //- the end of a round
    div(v-else-if="screen === 'result'" class="gd-menu gd-menu--dim")
      div(class="gd-card gd-card--small")
        h2(class="gd-title") {{ levelNames[level] }}
        AdventureStars(v-if="!outcome.lost" :stars="outcome.stars" :size="56" celebrate)
        p(class="gd-text") {{ resultText }}
        div(class="gd-lines")
          p(:class="['gd-line', { 'is-on': !outcome.lost }]") {{ outcome.lost ? '○' : '✓' }} {{ TX('lineScared', { have: outcome.scared, all: outcome.all }) }}
          p(v-if="!outcome.lost" :class="['gd-line', { 'is-on': outcome.stars >= 3 }]") {{ outcome.stars >= 3 ? '✓' : '○' }} {{ TX('lineThrows', { have: outcome.used, par: outcome.par }) }}
        p(v-if="lastChapterLevel" class="gd-line is-on") {{ TX('chapterDone') }}
        p(v-if="lastChapterLevel && level === LEVELS.length - 1" class="gd-text") {{ TX('allDone') }}
        AdvButton(v-if="hasNext && !outcome.lost" data-test="gideon-next" @click="begin(level + 1)") {{ TX('next') }}
        AdvButton(:tone="hasNext && !outcome.lost ? 'blau' : 'gold'" data-test="gideon-again" @click="begin(level)") {{ TX('again') }}
        AdvButton(tone="blau" data-test="gideon-menu" @click="toMenu") {{ TX('menu') }}

    //- the story of a chapter (once)
    div(v-if="chapterCard >= 0 && loaded && !how" class="gd-menu gd-menu--dim")
      div(class="gd-card gd-card--small")
        img(:src="bannerSrc(chapterCard)" alt="" class="gd-result-pic" @error="hideBroken")
        h2(class="gd-title") {{ chapterTexts[chapterCard]?.name }}
        p(class="gd-ch-ref-line") {{ chapterTexts[chapterCard]?.ref }}
        p(class="gd-text") {{ chapterTexts[chapterCard]?.story }}
        p(class="gd-text gd-text--task") {{ chapterTexts[chapterCard]?.task }}
        AdvButton(data-test="gideon-chapter-go" @click="closeCard") {{ TX('go') }}

    //- the explanation (once; the button in the overview brings it back)
    div(v-if="how && loaded" class="gd-menu gd-menu--dim")
      div(class="gd-card gd-how")
        h2(class="gd-title") {{ TX('howTitle') }}
        div(class="gd-how-row")
          span(class="gd-how-sign") 👆
          p(class="gd-how-line") {{ TX('howPull') }}
        div(class="gd-how-row")
          span(class="gd-how-sign") 💬
          p(class="gd-how-line") {{ TX('howGuards') }}
        div(class="gd-how-row")
          span(class="gd-how-sign") ★
          p(class="gd-how-line") {{ TX('howStars') }}
        AdvButton(data-test="gideon-go" @click="closeHow") {{ TX('go') }}
</template>

<style scoped lang="sass">
.gd
  position: fixed
  inset: 0
  z-index: 60
  background: #10142a
  overflow: hidden
  user-select: none
  -webkit-user-select: none
  touch-action: none

.gd-canvas
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  touch-action: none

.gd-center
  position: absolute
  inset: 0
  display: grid
  place-items: center

.gd-spinner
  width: 46px
  height: 46px
  border-radius: 50%
  border: 5px solid rgba(255, 255, 255, 0.25)
  border-top-color: #f5c84a
  animation: gd-spin 0.9s linear infinite

@keyframes gd-spin
  to
    transform: rotate(360deg)

.gd-menu
  position: absolute
  inset: 0
  display: grid
  place-items: start center
  padding: 16px
  overflow-y: auto
  background: linear-gradient(180deg, rgba(14, 16, 40, 0.74), rgba(14, 16, 40, 0.88))

  &--dim
    place-items: center
    background: rgba(12, 12, 30, 0.62)
    z-index: 5

.gd-card
  width: min(660px, 100%)
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
    width: min(430px, 100%)

.gd-title
  margin: 0
  font-size: 1.6rem
  font-weight: 800

.gd-text
  margin: 0
  font-size: 1.15rem
  line-height: 1.4

  &--task
    font-weight: 800

.gd-done
  margin: 0
  padding: 8px 12px
  border-radius: 14px
  background: #fff1c2
  font-weight: 800

.gd-rules
  margin: 0
  font-size: 0.85rem
  color: var(--lk-muted, #7a6b4f)

.gd-chapter
  width: 100%
  display: flex
  flex-direction: column
  gap: 8px

.gd-banner
  position: relative
  height: 92px
  border-radius: 16px
  overflow: hidden
  background: #2a3158

.gd-banner-pic
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  object-fit: cover
  object-position: 50% 50%

.gd-banner-text
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
  background: linear-gradient(0deg, rgba(10, 10, 30, 0.8), rgba(10, 10, 30, 0.05))
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6)

.gd-ch-name
  font-size: 1.05rem
  font-weight: 800

.gd-ch-ref
  font-size: 0.78rem
  font-weight: 600
  opacity: 0.9

.gd-ch-stars
  position: absolute
  right: 12px
  top: 8px
  font-weight: 800
  font-size: 0.9rem
  color: #ffe27a

.gd-ch-story, .gd-ch-ref-line
  margin: 0
  font-size: 0.88rem
  line-height: 1.35
  color: var(--lk-muted, #7a6b4f)
  text-align: left

.gd-levels
  display: grid
  grid-template-columns: repeat(3, minmax(0, 1fr))
  gap: 8px
  width: 100%

.gd-level
  display: flex
  flex-direction: column
  align-items: center
  gap: 3px
  min-height: 74px
  padding: 8px 4px
  border: 2px solid var(--lk-line, #e3d7bb)
  border-radius: 16px
  background: var(--lk-surface-2, #f6efdc)
  color: inherit
  font: inherit
  cursor: pointer

.gd-level-no
  display: grid
  place-items: center
  width: 28px
  height: 28px
  border-radius: 50%
  background: var(--lk-accent, #1f6a6a)
  color: var(--lk-on-accent, #fff)
  font-weight: 800

.gd-level-name
  font-size: 0.74rem
  line-height: 1.1
  font-weight: 700
  text-align: center

.gd-menu-buttons
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 10px

.gd-top
  position: absolute
  top: 0
  left: 0
  right: 0
  height: 80px
  display: flex
  align-items: flex-start
  gap: 8px
  padding: max(6px, env(safe-area-inset-top)) max(8px, env(safe-area-inset-right)) 0 max(8px, env(safe-area-inset-left))
  pointer-events: none

.gd-top > *
  pointer-events: auto

.gd-top-btns
  display: flex
  gap: 6px

.gd-btn
  position: relative
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

.gd-info
  flex: 1
  min-width: 0
  display: flex
  flex-direction: column
  align-items: center
  gap: 1px
  padding: 3px 8px
  border-radius: 14px
  background: rgba(255, 250, 235, 0.88)
  font-weight: 800
  text-align: center

.gd-level-label
  font-size: 0.82rem
  line-height: 1.15
  white-space: nowrap
  overflow: hidden
  text-overflow: ellipsis
  max-width: 100%

.gd-left
  font-size: 0.72rem
  font-weight: 700
  color: #6b5a3a

.gd-stars-live
  display: flex
  gap: 1px

.gd-star
  font-size: 1rem
  color: #b9ae96

  &.is-on
    color: #f0a812
    text-shadow: 0 0 6px rgba(255, 210, 80, 0.8)

.gd-wind
  align-self: center
  padding: 4px 8px
  border-radius: 12px
  background: rgba(255, 250, 235, 0.88)
  font-weight: 800
  font-size: 0.8rem
  white-space: nowrap

.gd-queue
  position: absolute
  left: max(8px, env(safe-area-inset-left))
  bottom: max(8px, env(safe-area-inset-bottom))
  display: flex
  gap: 6px
  align-items: flex-end
  pointer-events: none

.gd-q
  position: relative
  display: grid
  place-items: center
  width: 40px
  height: 40px
  border-radius: 12px
  background: rgba(255, 250, 235, 0.82)
  border: 2px solid rgba(120, 80, 30, 0.5)
  font-size: 1.3rem

  &.is-next
    width: 52px
    height: 52px
    border-color: #f0a812
    background: rgba(255, 250, 235, 0.96)
    box-shadow: 0 0 12px rgba(255, 210, 80, 0.7)

.gd-q-pic
  position: absolute
  inset: 4px
  width: calc(100% - 8px)
  height: calc(100% - 8px)
  object-fit: contain
  background: rgba(255, 250, 235, 1)
  border-radius: 8px

.gd-tap
  position: absolute
  right: max(12px, env(safe-area-inset-right))
  bottom: max(12px, env(safe-area-inset-bottom))
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  gap: 2px
  width: 84px
  height: 84px
  border: none
  border-radius: 50%
  background: #f5c84a
  color: #3b2a08
  font: inherit
  font-weight: 800
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45), 0 0 0 5px rgba(255, 236, 150, 0.5)
  animation: gd-pulse 0.7s ease-in-out infinite
  cursor: pointer
  touch-action: none

@keyframes gd-pulse
  50%
    transform: scale(1.08)

.gd-tap-icon
  font-size: 1.6rem

.gd-tip
  position: absolute
  left: 50%
  top: 92px
  transform: translateX(-50%)
  max-width: min(520px, 92vw)
  padding: 10px 18px
  border-radius: 18px
  background: rgba(255, 250, 235, 0.95)
  color: #2a2418
  font-weight: 700
  text-align: center
  pointer-events: none

.gd-result-pic
  width: 100%
  max-height: 150px
  object-fit: cover
  border-radius: 14px

.gd-lines
  display: flex
  flex-direction: column
  gap: 2px
  align-items: flex-start

.gd-line
  margin: 0
  font-size: 0.92rem
  color: var(--lk-muted, #7a6b4f)

  &.is-on
    color: var(--lk-text, #2a2418)
    font-weight: 700

.gd-how
  gap: 20px

.gd-how-row
  display: flex
  align-items: center
  gap: 16px
  width: 100%

.gd-how-sign
  width: 56px
  flex: none
  font-size: 2.2rem
  text-align: center
  color: #f0a812

.gd-how-line
  margin: 0
  text-align: left
  font-size: 1.2rem
  font-weight: 700
  line-height: 1.3

// short screens: the explanation card closer together
@media (max-height: 520px)
  .gd-how
    gap: 8px
  .gd-how-row
    gap: 12px
  .gd-how-sign
    width: 40px
    font-size: 1.5rem
  .gd-how-line
    font-size: 1.05rem
</style>
