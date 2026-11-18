<script setup lang="ts">
/**
 * "Der Töpfer" (Jeremiah 18): the big pottery game. The rules are in `utils/toepferGame.ts`, the levels in `utils/toepferLevels.ts`, the picture of
 * the turned vessel in `utils/toepferRender.ts`; this file takes the touch and draws the workshop. The clay turns on the wheel, the finger forms it
 * from the side (the wall follows the finger) or pulls the rim up; a faint template shows the goal and turns green where it is met. When the vessel
 * fits, it goes into the kiln, is painted and stands on the shelf "My pottery". Nobody can lose, there is no time and no shop; only stars.
 * The canvas is measured at every touch (a tablet's browser bar slides in and out) and by a ResizeObserver.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import AdventureStars from '@/components/molecules/AdventureStars.vue'
import GameIntroBox from '@/components/molecules/games/GameIntroBox.vue'
import useBigGames, { howSeen, markHowSeen } from '@/use/useBigGames'
import useSfx from '@/use/useSfx'
import useMusic from '@/use/useMusic'
import { prependBaseUrl } from '@/utils/function'
import { DY, TILT, cloneProfile, copyInto, dragAt, formLikeFinger, profileFromPoints, pullTo, radiusAt, similarity, smooth, starsOf, type Limits, type Profile } from '@/utils/toepferGame'
import { CHAPTER_COUNT, LEVELS, LEVELS_PER_CHAPTER, LEVEL_COUNT, levelStart, levelTarget, levelThresholds, levelView } from '@/utils/toepferLevels'
import { LOOK_FIRED, LOOK_GLAZE, LOOK_WET, TEX, bellyOf, buildMaps, makePattern, makeSkin, maxRadius, paintVessel, type Look, type Maps, type Skin } from '@/utils/toepferRender'

const emit = defineEmits<{ leave: [] }>()
const { t, tm, rt } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const music = useMusic()
const progress = useBigGames()
const ID = 'toepfer'

// ── the pictures ────────────────────────────────────────────────────────────────────────────────────────────────────────────
const NAMES = ['ton', 'scheibe', 'ofen', 'hand', 'werkstatt-quer', 'werkstatt-hoch', 'brett', 'muster-1', 'muster-2', 'muster-3', 'muster-4']
const img: Record<string, HTMLImageElement | undefined> = {}
const loaded = ref(false)
const glow = new Image()
glow.src = prependBaseUrl('images/abenteuer/ui/sternglanz.webp')
const pic = (n: string) => prependBaseUrl(`images/spiele-gross/toepfer/${n}.webp`)

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

/** The glaze colours (the pots on the paint panel), and the colour of the ornament ink on each (light ink on the dark glazes). */
const GLAZES: ReadonlyArray<readonly [number, number, number]> = [
  [236, 224, 192],
  [42, 88, 176],
  [98, 134, 64],
  [228, 168, 44]
]
const INK_DARK = [58, 36, 26] as const
const INK_LIGHT = [244, 232, 204] as const

let clayData: Uint8ClampedArray | null = null
const patterns: (Uint8Array | null)[] = [null, null, null, null]
const skinCache = new Map<string, Uint32Array>()

function buildTextures() {
  const clay = img['ton']
  const cv = document.createElement('canvas')
  cv.width = TEX
  cv.height = TEX
  const c = cv.getContext('2d', { willReadFrequently: true })
  if (c && clay) {
    c.drawImage(clay, 0, 0, TEX, TEX)
    clayData = c.getImageData(0, 0, TEX, TEX).data
  } else {
    // the picture is missing: a flat terracotta so that the game still works
    clayData = new Uint8ClampedArray(TEX * TEX * 4)
    for (let i = 0; i < TEX * TEX; i++) {
      clayData[i * 4] = 200
      clayData[i * 4 + 1] = 100
      clayData[i * 4 + 2] = 55
      clayData[i * 4 + 3] = 255
    }
  }
  for (let k = 0; k < 4; k++) {
    const im = img[`muster-${k + 1}`]
    if (!im || !c) continue
    const tc = document.createElement('canvas')
    tc.width = 256
    tc.height = 256
    const x = tc.getContext('2d', { willReadFrequently: true })
    if (!x) continue
    x.drawImage(im, 0, 0, 256, 256)
    patterns[k] = makePattern(x.getImageData(0, 0, 256, 256).data, 256, 256)
  }
}

function skinColour(kind: 'wet' | 'fired' | 'glaze', glaze = 0): Uint32Array {
  const key = kind === 'glaze' ? `g${glaze}` : kind
  let s = skinCache.get(key)
  if (!s) {
    s = makeSkin(clayData!, kind, kind === 'glaze' ? GLAZES[glaze - 1] : undefined)
    skinCache.set(key, s)
  }
  return s
}

/** The skin of a vessel: wet clay, fired clay, or a glaze with an ornament (1..4 = glaze colour, 0 = clay; ornament 0 = none). */
function skinOf(wet: boolean, glaze: number, pattern: number): Skin {
  if (wet) return { colour: skinColour('wet'), pattern: null, ink: INK_DARK }
  const colour = glaze > 0 ? skinColour('glaze', glaze) : skinColour('fired')
  return { colour, pattern: pattern > 0 ? patterns[pattern - 1] ?? null : null, ink: glaze === 2 || glaze === 3 ? INK_LIGHT : INK_DARK }
}
const lookOf = (wet: boolean, glaze: number): Look => (wet ? LOOK_WET : glaze > 0 ? LOOK_GLAZE : LOOK_FIRED)
/** The colours of the rim and of the inside of the opening for the canvas. */
function capColours(wet: boolean, glaze: number): { rim: string; inner0: string; inner1: string } {
  if (wet) return { rim: '#9a6a4c', inner0: '#6b4230', inner1: '#2f1a10' }
  if (glaze === 1) return { rim: '#f2e8cc', inner0: '#b9a77f', inner1: '#6e5a3a' }
  if (glaze === 2) return { rim: '#4f7fd0', inner0: '#1f3f80', inner1: '#0d1c40' }
  if (glaze === 3) return { rim: '#8fb26a', inner0: '#4a6b2c', inner1: '#1f3012' }
  if (glaze === 4) return { rim: '#f0c25a', inner0: '#a8761c', inner1: '#4f330a' }
  return { rim: '#d98a52', inner0: '#8f4a22', inner1: '#40200e' }
}

// ── the screens ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
type Screen = 'menu' | 'play' | 'result' | 'shelf'
type Phase = 'shape' | 'fire' | 'paint'
const screen = ref<Screen>('menu')
const phase = ref<Phase>('shape')
const level = ref(0)
const paused = ref(false)
const how = ref(false)
const chapterCard = ref(-1)
let pendingCard = -1
const hintText = ref('')
const hintShown = ref(false)
let hintTimer = 0
const glazeSel = ref(0)
const patSel = ref(0)
const root = ref<HTMLElement | null>(null)
const resultCanvas = ref<HTMLCanvasElement | null>(null)

type ChapterText = { name: Parameters<typeof rt>[0]; ref: Parameters<typeof rt>[0]; story: Parameters<typeof rt>[0]; task: Parameters<typeof rt>[0] }
const chapterTexts = computed(() => ((tm('app.bigGames.toepfer.chapters') as unknown as ChapterText[]) ?? []).map((m) => ({ name: rt(m.name), ref: rt(m.ref), story: rt(m.story), task: rt(m.task) })))
const levelNames = computed(() => ((tm('app.bigGames.toepfer.levels') as unknown as Parameters<typeof rt>[0][]) ?? []).map((m) => rt(m)))
const glazeNames = computed(() => ((tm('app.bigGames.toepfer.glaze') as unknown as Parameters<typeof rt>[0][]) ?? []).map((m) => rt(m)))
const patternNames = computed(() => ((tm('app.bigGames.toepfer.pattern') as unknown as Parameters<typeof rt>[0][]) ?? []).map((m) => rt(m)))
const levelStars = computed(() => progress.levels(ID))
const chapterOf = (i: number) => LEVELS[i]?.chapter ?? 0
const chapterLevels = (c: number) => Array.from({ length: LEVELS_PER_CHAPTER }, (_, k) => c * LEVELS_PER_CHAPTER + k)
const chapterStars = (c: number) => chapterLevels(c).reduce((n, i) => n + (levelStars.value[i] ?? 0), 0)
const hasNext = computed(() => level.value < LEVEL_COUNT - 1)

const hud = reactive({ score: 0, stars: 0, ready: false, help: false })
const outcome = reactive({ stars: 0, fit: 0 })

// ── what is kept on the device: the chapters seen, the hints seen, the vessels on the shelf ──────────────────────────────────
const MEM_KEY = 'lk-toepfer-v1'
interface Vessel {
  stars: number
  h: number
  /** The radius at 36 even heights from the foot to the rim. */
  r: number[]
  glaze: number
  pattern: number
}
interface Mem {
  chapters: boolean[]
  hints: Record<string, boolean>
  vessels: Record<number, Vessel>
}
function loadMem(): Mem {
  try {
    const m = JSON.parse(localStorage.getItem(MEM_KEY) ?? 'null') as Mem | null
    if (m && typeof m === 'object') return { chapters: m.chapters ?? [], hints: m.hints ?? {}, vessels: m.vessels ?? {} }
  } catch {
    // start fresh
  }
  return { chapters: [], hints: {}, vessels: {} }
}
const mem = reactive<Mem>(loadMem())
function saveMem() {
  try {
    localStorage.setItem(MEM_KEY, JSON.stringify(mem))
  } catch {
    // a private window: not remembered
  }
}
const SAMPLES = 36
function vesselOf(p: Profile, stars: number, glaze: number, pattern: number): Vessel {
  const r: number[] = []
  for (let k = 0; k < SAMPLES; k++) r.push(Math.round(radiusAt(p, (p.h * k) / (SAMPLES - 1)) * 1000) / 1000)
  return { stars, h: Math.round(p.h * 1000) / 1000, r, glaze, pattern }
}
function profileOf(v: Vessel): Profile {
  return profileFromPoints(v.r.map((r, k) => [(v.h * k) / (SAMPLES - 1), r] as const))
}
const shelfCount = computed(() => Object.values(mem.vessels).filter((v) => v.stars >= 1).length)
const allDone = computed(() => shelfCount.value >= LEVEL_COUNT)

// ── the game ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const canvas = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let raf = 0
let last = 0
let lastDraw = 0
let dpr = 1
let cvW = 1
let cvH = 1
let ro: ResizeObserver | null = null
/** The layout: the pixels per world unit, the axis, the foot of the vessel, the free area. */
let S = 100
let cx = 0
let baseY = 0
let area = { x: 0, y: 0, w: 1, h: 1 }
let land = false

let prof: Profile = cloneProfile(levelStart(0))
let target: Profile = levelTarget(0)
let view = levelView(0)
let lim: Limits = { rMax: view.rMax, hMax: view.hMax }
let thr = levelThresholds(0)
const history: Profile[] = []
let dirty = true
let turn = 0

// the picture of the vessel (the maps change with the profile, the colours with the phase)
let maps: Maps | null = null
let mapsKey = ''
let res = 1
let buf: HTMLCanvasElement | null = null
let bufCtx: CanvasRenderingContext2D | null = null
let imgData: ImageData | null = null
let out32: Uint32Array | null = null
let wetNow = true
let skinNow: Skin | null = null

// the kiln
const FIRE_END = 4.0
let fireT = -1
let fireSwapped = false

function setLevelData(i: number) {
  prof = cloneProfile(levelStart(i))
  target = levelTarget(i)
  view = levelView(i)
  lim = { rMax: view.rMax, hMax: view.hMax }
  thr = levelThresholds(i)
  history.length = 0
  dirty = true
}

function begin(i: number) {
  level.value = i
  setLevelData(i)
  screen.value = 'play'
  phase.value = 'shape'
  fireT = -1
  wetNow = true
  glazeSel.value = 0
  patSel.value = 0
  hud.help = false
  hud.score = 0
  hud.stars = 0
  hud.ready = false
  const L = LEVELS[i]!
  pendingCard = L.place === 0 && !mem.chapters[L.chapter] ? L.chapter : -1
  how.value = !howSeen(ID)
  chapterCard.value = how.value ? -1 : pendingCard
  paused.value = how.value || chapterCard.value >= 0
  hintShown.value = false
  if (!paused.value) startHints()
  layout()
  updateScore()
  setProbe()
  kick()
}

function startHints() {
  const L = LEVELS[level.value]!
  if (L.spoiled && !mem.hints['spoiled']) {
    mem.hints['spoiled'] = true
    saveMem()
    say(t('app.bigGames.toepfer.hint.spoiled'), 7000)
  } else if (!mem.hints['start']) {
    mem.hints['start'] = true
    saveMem()
    say(t('app.bigGames.toepfer.hint.start'), 6000)
  } else if (!mem.hints['top'] && level.value >= 2) {
    mem.hints['top'] = true
    saveMem()
    say(t('app.bigGames.toepfer.hint.top'), 6000)
  }
}

function closeHow() {
  how.value = false
  markHowSeen(ID)
  chapterCard.value = pendingCard
  paused.value = chapterCard.value >= 0
  if (!paused.value) startHints()
  kick()
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
  startHints()
  kick()
}

function toMenu() {
  screen.value = 'menu'
  paused.value = false
  fireT = -1
  stopLoop()
  void nextTick(drawThumbs)
}

function toShelf() {
  screen.value = 'shelf'
  stopLoop()
  void nextTick(drawThumbs)
}

function say(text: string, ms = 5000) {
  hintText.value = text
  hintShown.value = true
  window.clearTimeout(hintTimer)
  hintTimer = window.setTimeout(() => (hintShown.value = false), ms)
}

// ── score ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────
let wasStars = 0
function updateScore() {
  const s = similarity(prof, target)
  hud.score = s
  const st = starsOf(s, thr)
  if (st > wasStars && st > 0) play('found', 0.5)
  wasStars = st
  hud.stars = st
  const ready = s >= thr[0]
  if (ready && !hud.ready && phase.value === 'shape') say(t('app.bigGames.toepfer.hint.ready'), 3500)
  hud.ready = ready
}

// ── the actions of the buttons ──────────────────────────────────────────────────────────────────────────────────────────────
const live = () => screen.value === 'play' && !paused.value && phase.value === 'shape'

function pushHistory() {
  history.push(cloneProfile(prof))
  if (history.length > 40) history.shift()
}
function aUndo() {
  if (!live() || !history.length) return
  copyInto(prof, history.pop()!)
  dirty = true
  play('tap', 0.5)
  kick()
}
function aReset() {
  if (!live()) return
  pushHistory()
  copyInto(prof, levelStart(level.value))
  dirty = true
  play('tap', 0.5)
  kick()
}
let helpTimer = 0
function aHelp() {
  if (!live()) return
  hud.help = !hud.help
  window.clearTimeout(helpTimer)
  if (hud.help) {
    say(t('app.bigGames.toepfer.hint.help'), 3000)
    helpTimer = window.setTimeout(() => (hud.help = false, kick()), 12000)
  }
  play('tap', 0.5)
  kick()
}

/** "Fertig": the vessel fits, it goes into the kiln (the stars are kept at once). */
function aDone() {
  if (!live()) return
  if (!hud.ready) {
    say(t('app.bigGames.toepfer.hint.notyet'), 3500)
    play('tap', 0.4)
    return
  }
  const s = similarity(prof, target)
  const stars = Math.max(1, starsOf(s, thr))
  outcome.stars = stars
  outcome.fit = Math.round(s * 100)
  progress.record(ID, level.value, stars)
  const old = mem.vessels[level.value]
  savedThis = !old || stars >= old.stars
  if (savedThis) {
    mem.vessels[level.value] = vesselOf(prof, stars, 0, 0)
    saveMem()
  }
  phase.value = 'fire'
  fireT = 0
  fireSwapped = false
  hud.help = false
  hintShown.value = false
  play('clunk', 0.5)
  kick()
}
let savedThis = false

function aFireSkip() {
  if (phase.value === 'fire' && fireT >= 0) fireT = Math.max(fireT, FIRE_END - 0.05)
}

function aPaintDone() {
  if (phase.value !== 'paint') return
  if (savedThis && mem.vessels[level.value]) {
    mem.vessels[level.value] = { ...mem.vessels[level.value]!, glaze: glazeSel.value, pattern: patSel.value }
    saveMem()
  }
  screen.value = 'result'
  stopLoop()
  play('result')
  void nextTick(() => drawVesselInto(resultCanvas.value, prof, glazeSel.value, patSel.value, false, false))
}

function pickGlaze(g: number) {
  glazeSel.value = g
  mapsKey = ''
  play('tap', 0.5)
  kick()
}
function pickPattern(p: number) {
  patSel.value = p
  mapsKey = ''
  play('tap', 0.5)
  kick()
}

// ── the touch (the canvas is measured at every touch) ───────────────────────────────────────────────────────────────────────
interface Touch {
  mode: 'body' | 'top'
  y0: number
  h0: number
  px: number
  py: number
}
let pt: Touch | null = null
const finger = reactive({ on: false, x: 0, y: 0 })

function pos(e: PointerEvent): { x: number; y: number } {
  const c = canvas.value!
  const r = c.getBoundingClientRect()
  const kx = r.width > 0 ? cvW / r.width : 1
  const ky = r.height > 0 ? cvH / r.height : 1
  return { x: (e.clientX - r.left) * kx, y: (e.clientY - r.top) * ky }
}
const toWorld = (p: { x: number; y: number }) => ({ x: (p.x - cx) / S, y: (baseY - p.y) / S })

/** The finger at a point of the screen: the wall at that height goes to the distance of the finger from the axis. */
function touchAt(p: { x: number; y: number }, from: { x: number; y: number } | null) {
  const s = pt
  if (!s) return
  const w = toWorld(p)
  const apply = (wx: number, wy: number) => {
    if (s.mode === 'top') {
      pullTo(prof, s.h0 + (wy - s.y0), lim)
      dragAt(prof, prof.h, Math.abs(wx), view.sigma, lim, 0.8)
    } else {
      dragAt(prof, wy, Math.abs(wx), view.sigma, lim, 0.85)
    }
  }
  if (from) {
    const a = toWorld(from)
    const dist = Math.hypot(w.x - a.x, w.y - a.y)
    const steps = Math.max(1, Math.ceil(dist / (view.sigma / 3)))
    for (let k = 1; k <= steps; k++) apply(a.x + ((w.x - a.x) * k) / steps, a.y + ((w.y - a.y) * k) / steps)
  } else apply(w.x, w.y)
  dirty = true
}

function onDown(e: PointerEvent) {
  if (screen.value === 'play' && phase.value === 'fire') {
    aFireSkip()
    return
  }
  if (!live()) return
  try {
    ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
  } catch {
    // a touch that has ended already: nothing to hold
  }
  const p = pos(e)
  const w = toWorld(p)
  pushHistory()
  const zone = Math.max(0.07, view.sigma * 0.9)
  pt = { mode: w.y >= prof.h - zone ? 'top' : 'body', y0: w.y, h0: prof.h, px: p.x, py: p.y }
  finger.on = true
  finger.x = p.x
  finger.y = p.y
  hintShown.value = false
  touchAt(p, null)
  kick()
}
function onMove(e: PointerEvent) {
  if (!pt) return
  const p = pos(e)
  touchAt(p, { x: pt.px, y: pt.py })
  pt.px = p.x
  pt.py = p.y
  finger.x = p.x
  finger.y = p.y
  kick()
}
function onUp() {
  if (!pt) return
  pt = null
  finger.on = false
  smooth(prof, 1, 0.25)
  dirty = true
  kick()
}

// ── the layout ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
function layout() {
  const c = canvas.value
  if (!c) return
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  const box = c.getBoundingClientRect()
  cvW = box.width || window.innerWidth
  cvH = box.height || window.innerHeight
  c.width = Math.round(cvW * dpr)
  c.height = Math.round(cvH * dpr)
  land = cvW > cvH * 1.15
  if (land) area = { x: 8, y: 56, w: cvW - 130 - 8, h: cvH - 56 - 8 }
  else area = { x: 8, y: 64, w: cvW - 16, h: cvH - 64 - 200 }
  const needH = view.hMax + TILT * 1.3 + 0.4
  S = Math.max(40, Math.min(area.h / needH, area.w / (2 * view.rMax + 0.1)))
  cx = area.x + area.w / 2
  baseY = area.y + area.h - 0.38 * S
  mapsKey = ''
  dirty = true
  drawNow()
}

// ── the vessel ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
/** Builds the maps of the vessel for the current look (allocates: call it only when the profile, the size or the look changed). */
function buildVessel(p: Profile, wet: boolean, glaze: number, pattern: number): void {
  const aw = 2 * maxRadius(p) * S + 8
  const ah = (p.h + TILT * 1.5) * S + 8
  res = Math.max(0.6, Math.min(Math.min(dpr, 1.6), Math.sqrt(230000 / (aw * ah))))
  maps = buildMaps(p, S * res, lookOf(wet, glaze), pattern > 0 && !wet ? bellyOf(p) : NaN)
  ensureBuffer()
}

function ensureBuffer() {
  const m = maps!
  if (!buf) {
    buf = document.createElement('canvas')
    bufCtx = buf.getContext('2d')
  }
  if (buf.width !== m.w || buf.height !== m.h) {
    buf.width = m.w
    buf.height = m.h
    imgData = new ImageData(m.w, m.h)
    out32 = new Uint32Array(imgData.data.buffer)
  }
}

/** The vessel of the game, with the foot at the origin of the context (the caller moves and scales the context). */
function drawVesselHere(c: CanvasRenderingContext2D) {
  if (!maps || !buf || !bufCtx || !imgData || !out32 || !skinNow) return
  paintVessel(maps, out32, skinNow, turn)
  bufCtx.putImageData(imgData, 0, 0)
  c.imageSmoothingEnabled = true
  c.drawImage(buf, -maps.cx / res, -maps.baseRow / res, maps.w / res, maps.h / res)
  drawRim(c, 0, -prof.h * S, radiusAt(prof, prof.h) * S, capColours(wetNow, phase.value === 'paint' ? glazeSel.value : 0))
}

function drawRim(c: CanvasRenderingContext2D, x: number, y: number, rx: number, col: { rim: string; inner0: string; inner1: string }) {
  const ry = rx * TILT
  const thick = Math.max(2.5, Math.min(rx * 0.22, S * 0.05))
  c.save()
  c.fillStyle = col.rim
  c.beginPath()
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
  c.fill()
  const irx = Math.max(1, rx - thick)
  const iry = Math.max(0.6, ry - thick * TILT * 1.2)
  const g = c.createLinearGradient(0, y - iry, 0, y + iry)
  g.addColorStop(0, col.inner0)
  g.addColorStop(1, col.inner1)
  c.fillStyle = g
  c.beginPath()
  c.ellipse(x, y + iry * 0.04, irx, iry, 0, 0, Math.PI * 2)
  c.fill()
  c.strokeStyle = 'rgba(40,20,8,0.4)'
  c.lineWidth = 1
  c.beginPath()
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
  c.stroke()
  c.restore()
}

/** A small picture of a vessel in a canvas (the menu, the shelf and the result): finished, or the faint shape of the template. */
function drawVesselInto(cv: HTMLCanvasElement | null, p: Profile, glaze: number, pattern: number, ghost: boolean, common: boolean) {
  if (!cv || !clayData) return
  const d = Math.min(window.devicePixelRatio || 1, 2)
  const w = cv.clientWidth || cv.width
  const h = cv.clientHeight || cv.height
  if (cv.width !== Math.round(w * d)) {
    cv.width = Math.round(w * d)
    cv.height = Math.round(h * d)
  }
  const c = cv.getContext('2d')
  if (!c) return
  c.setTransform(1, 0, 0, 1, 0, 0)
  c.clearRect(0, 0, cv.width, cv.height)
  c.setTransform(d, 0, 0, d, 0, 0)
  const floor = common ? 0.97 : 0.92
  const sc = common ? Math.min((w * 0.94) / 2.3, (h * 0.86) / 2.35) : Math.min((w * 0.9) / (2 * maxRadius(p) + 0.1), (h * 0.84) / (p.h + 0.3))
  if (ghost) {
    c.fillStyle = 'rgba(110,70,35,0.2)'
    c.beginPath()
    const top = Math.floor(p.h / DY)
    c.moveTo(w / 2 - p.r[0]! * sc, h * floor)
    for (let i = 0; i <= top; i++) c.lineTo(w / 2 - p.r[i]! * sc, h * floor - i * DY * sc)
    for (let i = top; i >= 0; i--) c.lineTo(w / 2 + p.r[i]! * sc, h * floor - i * DY * sc)
    c.closePath()
    c.fill()
    return
  }
  const m = buildMaps(p, sc * d, glaze > 0 ? LOOK_GLAZE : LOOK_FIRED, pattern > 0 ? bellyOf(p) : NaN)
  const tmp = document.createElement('canvas')
  tmp.width = m.w
  tmp.height = m.h
  const id = new ImageData(m.w, m.h)
  paintVessel(m, new Uint32Array(id.data.buffer), skinOf(false, glaze, pattern), 0)
  tmp.getContext('2d')!.putImageData(id, 0, 0)
  c.save()
  c.translate(w / 2, h * floor)
  c.drawImage(tmp, -m.cx / d, -m.baseRow / d, m.w / d, m.h / d)
  drawRim(c, 0, -p.h * sc, radiusAt(p, p.h) * sc, capColours(false, glaze))
  c.restore()
}

function drawThumbs() {
  const host = root.value
  if (!host || !clayData) return
  host.querySelectorAll<HTMLCanvasElement>('canvas[data-lv]').forEach((cv) => {
    const i = Number(cv.dataset.lv)
    const v = mem.vessels[i]
    const common = cv.classList.contains('tp-thumb--shelf')
    if (v && v.stars >= 1) drawVesselInto(cv, profileOf(v), v.glaze, v.pattern, false, common)
    else drawVesselInto(cv, levelTarget(i), 0, 0, true, common)
  })
}

// ── the loop ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const running = () => screen.value === 'play' && loaded.value && !document.hidden
function kick() {
  if (!raf && running()) {
    last = performance.now()
    raf = requestAnimationFrame(frame)
  }
  if (!running()) drawNow()
}
function stopLoop() {
  cancelAnimationFrame(raf)
  raf = 0
}

function frame(now: number) {
  raf = 0
  if (!running()) return
  const dt = Math.min(0.1, (now - last) / 1000 || 0)
  last = now
  advance(dt)
  // the turning wheel is drawn 30 times a second; a paused game is drawn once and then rests
  if (!paused.value || dirty) {
    if (now - lastDraw >= 30 || fireT >= 0) {
      lastDraw = now
      draw(now / 1000)
    }
  }
  if (!paused.value || dirty || fireT >= 0) raf = requestAnimationFrame(frame)
}

function advance(dt: number) {
  if (paused.value) return
  if (phase.value === 'fire' && fireT >= 0) {
    fireT += dt
    if (!fireSwapped && fireT >= 2.8) {
      fireSwapped = true
      wetNow = false
      mapsKey = ''
      play('found', 0.5)
    }
    if (fireT >= FIRE_END) {
      fireT = -1
      phase.value = 'paint'
      say(t('app.bigGames.toepfer.hint.paint'), 4000)
    }
  }
  turn += dt * TEX * (phase.value === 'shape' ? 0.12 : 0.09)
  if (dirty && phase.value === 'shape') updateScore()
}

function drawNow() {
  if (!loaded.value) return
  draw(performance.now() / 1000)
}

function drawBackground(c: CanvasRenderingContext2D) {
  const bg = cvH > cvW ? img['werkstatt-hoch'] : img['werkstatt-quer']
  c.fillStyle = '#7a4f2c'
  c.fillRect(0, 0, cvW, cvH)
  if (bg) {
    const k = Math.max(cvW / bg.width, cvH / bg.height)
    c.drawImage(bg, (cvW - bg.width * k) / 2, (cvH - bg.height * k) / 2, bg.width * k, bg.height * k)
  }
  c.fillStyle = 'rgba(45,24,10,0.2)'
  c.fillRect(0, 0, cvW, cvH)
}

const WHEEL = { w: 1100, h: 650, cx: 0.495, cy: 0.145, a: 0.35 }
function drawWheel(c: CanvasRenderingContext2D) {
  const wi = img['scheibe']
  if (!wi) return
  const rh = Math.max(view.rMax * 1.12, 0.95)
  const iw = (rh * S) / WHEEL.a
  const ih = (iw * WHEEL.h) / WHEEL.w
  c.drawImage(wi, cx - WHEEL.cx * iw, baseY - WHEEL.cy * ih, iw, ih)
}

function drawShadow(c: CanvasRenderingContext2D) {
  const r = Math.max(radiusAt(prof, 0), 0.3) * S * 1.18
  c.save()
  c.translate(cx + r * 0.14, baseY + r * TILT * 0.15)
  c.scale(1, TILT * 1.15)
  const g = c.createRadialGradient(0, 0, r * 0.2, 0, 0, r)
  g.addColorStop(0, 'rgba(30,15,5,0.42)')
  g.addColorStop(1, 'rgba(30,15,5,0)')
  c.fillStyle = g
  c.beginPath()
  c.arc(0, 0, r, 0, Math.PI * 2)
  c.fill()
  c.restore()
}

/** The faint template of the vessel: its outline turns green where the clay is right, gold where it is nearly right. */
function drawTemplate(c: CanvasRenderingContext2D, part: 'fill' | 'line') {
  const strong = hud.help
  const th = target.h
  const n = Math.max(2, Math.round(th / (DY * 2)))
  const ys: number[] = []
  const rs: number[] = []
  const cls: number[] = []
  for (let k = 0; k <= n; k++) {
    const y = (k / n) * th
    const rt0 = radiusAt(target, Math.min(th, y))
    const rp = radiusAt(prof, y)
    const e = Math.abs(rp - rt0) / Math.max(rt0, 0.35)
    ys.push(y)
    rs.push(rt0)
    cls.push(e < 0.05 ? 2 : e < 0.1 ? 1 : 0)
  }
  c.save()
  if (part === 'fill') {
    // the shape, faintly filled (behind the clay)
    c.beginPath()
    c.moveTo(cx - rs[0]! * S, baseY)
    for (let k = 0; k <= n; k++) c.lineTo(cx - rs[k]! * S, baseY - ys[k]! * S)
    for (let k = n; k >= 0; k--) c.lineTo(cx + rs[k]! * S, baseY - ys[k]! * S)
    c.closePath()
    c.fillStyle = strong ? 'rgba(255,248,220,0.3)' : 'rgba(255,248,220,0.1)'
    c.fill()
    c.restore()
    return
  }
  const colours = ['rgba(255,250,235,A)', 'rgba(255,214,90,A)', 'rgba(120,230,130,A)']
  const alpha = strong ? 1 : 0.8
  for (let cl = 0; cl < 3; cl++) {
    c.beginPath()
    for (const side of [-1, 1]) {
      for (let k = 0; k < n; k++) {
        if (cls[k] !== cl) continue
        c.moveTo(cx + side * rs[k]! * S, baseY - ys[k]! * S)
        c.lineTo(cx + side * rs[k + 1]! * S, baseY - ys[k + 1]! * S)
      }
    }
    c.strokeStyle = colours[cl]!.replace('A', String(alpha))
    c.lineWidth = cl === 2 ? (strong ? 4.5 : 3.5) : strong ? 3.5 : 2.5
    c.setLineDash(cl === 2 ? [] : [7, 6])
    c.lineCap = 'round'
    c.stroke()
  }
  // the height of the rim
  const rtop = rs[n]! * S
  const hOk = Math.abs(prof.h - th) < 0.045
  c.beginPath()
  c.ellipse(cx, baseY - th * S, rtop, rtop * TILT, 0, 0, Math.PI * 2)
  c.strokeStyle = hOk ? `rgba(120,230,130,${alpha})` : `rgba(255,250,235,${alpha})`
  c.lineWidth = hOk ? 3.5 : 2.5
  c.setLineDash(hOk ? [] : [7, 6])
  c.stroke()
  c.restore()
}

function drawHand(c: CanvasRenderingContext2D) {
  const hi = img['hand']
  if (!hi || !finger.on) return
  const w = Math.max(110, Math.min(220, S * 1.1))
  const h = (w * hi.height) / hi.width
  const right = finger.x >= cx
  c.save()
  c.translate(finger.x, finger.y)
  if (!right) c.scale(-1, 1)
  // the tip of the finger is at the left edge of the picture, a third from the top
  c.globalAlpha = 0.92
  c.drawImage(hi, -w * 0.02, -h * 0.36, w, h)
  c.restore()
}

function drawKiln(c: CanvasRenderingContext2D, time: number) {
  const ki = img['ofen']
  if (!ki) return
  const kw = Math.min(cvW * 0.78, area.h * 0.8, 520)
  const kh = (kw * ki.height) / ki.width
  const kx = area.x + area.w / 2
  const ky = area.y + area.h / 2 - kh * 0.46
  const fadeIn = Math.min(1, fireT / 0.45)
  const fadeOut = fireT > 3.3 ? Math.max(0, 1 - (fireT - 3.3) / 0.6) : 1
  c.save()
  c.globalAlpha = fadeIn * fadeOut
  c.drawImage(ki, kx - kw / 2, ky, kw, kh)
  // the glow in the opening
  const mx = kx - kw * 0.01
  const my = ky + kh * 0.77
  const glowOn = fireT > 1 && fireT < 3.5 ? Math.min(1, (fireT - 1) / 0.4, (3.5 - fireT) / 0.5) : 0
  if (glowOn > 0) {
    const pulse = 0.8 + 0.2 * Math.sin(time * 6)
    c.globalCompositeOperation = 'lighter'
    const g = c.createRadialGradient(mx, my, 0, mx, my, kw * 0.3)
    g.addColorStop(0, `rgba(255,190,80,${0.7 * glowOn * pulse})`)
    g.addColorStop(1, 'rgba(255,120,30,0)')
    c.fillStyle = g
    c.beginPath()
    c.arc(mx, my, kw * 0.3, 0, Math.PI * 2)
    c.fill()
    if (glow.complete && glow.naturalWidth) {
      for (let k = 0; k < 6; k++) {
        const ph = (time * 0.5 + k * 0.17) % 1
        const gx = mx + Math.sin(k * 2.3 + time) * kw * 0.1
        const gy = my - ph * kw * 0.5
        c.globalAlpha = (1 - ph) * 0.7 * glowOn
        c.drawImage(glow, gx - 12, gy - 12, 24, 24)
      }
    }
  }
  c.restore()
  return { mx, my, kw }
}

function draw(time: number) {
  const c = ctx
  if (!c || !loaded.value || screen.value === 'menu' || screen.value === 'shelf') return
  c.setTransform(dpr, 0, 0, dpr, 0, 0)
  drawBackground(c)
  drawWheel(c)

  // the vessel: its maps are rebuilt only when it changed
  const fired = phase.value !== 'shape' && !(phase.value === 'fire' && !fireSwapped)
  wetNow = !fired
  const glaze = phase.value === 'paint' ? glazeSel.value : 0
  const pat = phase.value === 'paint' ? patSel.value : 0
  const key = `${S.toFixed(2)}|${wetNow}|${glaze}|${pat}`
  if (!maps || dirty || mapsKey !== key) {
    buildVessel(prof, wetNow, glaze, pat)
    mapsKey = key
    dirty = false
  }
  skinNow = skinOf(wetNow, glaze, pat)
  drawShadow(c)
  if (phase.value === 'shape') drawTemplate(c, 'fill')

  let vx = cx
  let vy = baseY
  let vk = 1
  let va = 1
  let kiln: { mx: number; my: number; kw: number } | undefined
  if (phase.value === 'fire' && fireT >= 0) {
    kiln = drawKiln(c, time)
    const out = Math.min(1, fireT / 1.1)
    const back = Math.max(0, Math.min(1, (fireT - 2.8) / 1.0))
    if (kiln) {
      const e = out * out * (3 - 2 * out)
      if (fireT < 2.8) {
        vx = cx + (kiln.mx - cx) * e
        vy = baseY + (kiln.my - baseY) * e
        vk = 1 - 0.78 * e
        va = 1 - Math.max(0, (out - 0.75) / 0.25)
      } else {
        const b = back * back * (3 - 2 * back)
        vx = kiln.mx + (cx - kiln.mx) * b
        vy = kiln.my + (baseY - kiln.my) * b
        vk = 0.22 + 0.78 * b
        va = Math.min(1, back / 0.3)
      }
    }
  }
  if (va > 0.01) {
    c.save()
    c.globalAlpha = va
    c.translate(vx, vy)
    c.scale(vk, vk)
    drawVesselHere(c)
    c.restore()
  }
  if (phase.value === 'shape') drawTemplate(c, 'line')
  drawHand(c)
}

// ── the page ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const hideBroken = (e: Event) => {
  ;(e.target as HTMLElement).style.display = 'none'
}
const POTS = [1, 2, 3, 4]
const potSrc = (g: number) => pic(`farbtopf-${g}`)
const patSrc = (p: number) => pic(`muster-${p}`)
const claySrc = pic('ton')
const plankSrc = pic('brett')
const handSrc = pic('hand')
const resultText = computed(() => t(`app.bigGames.toepfer.won${Math.max(1, outcome.stars)}`))
const rewardChapter = computed(() => {
  const c = LEVELS[level.value]?.chapter ?? 0
  return chapterLevels(c).every((i) => (levelStars.value[i] ?? 0) >= 1) ? c : -1
})
const meterPct = computed(() => Math.max(0, Math.min(100, Math.round(((hud.score - 0.5) / 0.5) * 100))))
const tickPct = (i: number) => Math.round(((thr[i]! - 0.5) / 0.5) * 100)
const levelLabel = (i: number) => levelNames.value[i] ?? ''
const shelfCols = ref(5)
const shelfRows = computed(() => Array.from({ length: Math.ceil(LEVEL_COUNT / shelfCols.value) }, (_, r) => Array.from({ length: shelfCols.value }, (_, k) => r * shelfCols.value + k).filter((i) => i < LEVEL_COUNT)))
const phaseTitle = computed(() => (phase.value === 'fire' ? t('app.bigGames.toepfer.fireTitle') : phase.value === 'paint' ? t('app.bigGames.toepfer.paintTitle') : ''))

function leave() {
  emit('leave')
}

function setProbe() {
  if (window.location.hash.includes('probe=1')) {
    ;(window as unknown as { __toepfer?: unknown }).__toepfer = {
      get prof() {
        return prof
      },
      get target() {
        return target
      },
      begin,
      score: () => similarity(prof, target),
      /** Forms the vessel like a patient finger (for screenshots and tests). */
      solve: (shake = 0) => {
        formLikeFinger(prof, target, view, { shake })
        dirty = true
        updateScore()
        drawNow()
      },
      done: aDone,
      skip: aFireSkip,
      toShelf,
      touchAt: (x: number, y: number) => {
        pt = { mode: 'body', y0: 0, h0: prof.h, px: x, py: y }
        touchAt({ x, y }, null)
        pt = null
      },
      layout: () => ({ S, cx, baseY, cvW, cvH, area, land }),
      draw: () => drawNow()
    }
  }
}

watch([screen, paused, loaded], () => {
  if (running() && !paused.value) kick()
  else if (screen.value !== 'play') stopLoop()
})
watch(chapterCard, () => kick())

function onVisibility() {
  if (!document.hidden) kick()
}
function onResize() {
  layout()
  shelfCols.value = cvW >= 700 ? 6 : 5
}

let bodyOverflow = ''
onMounted(async () => {
  bodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  ctx = canvas.value?.getContext('2d') ?? null
  layout()
  shelfCols.value = cvW >= 700 ? 6 : 5
  window.addEventListener('resize', onResize)
  window.visualViewport?.addEventListener('resize', onResize)
  document.addEventListener('visibilitychange', onVisibility)
  if (typeof ResizeObserver !== 'undefined' && canvas.value) {
    ro = new ResizeObserver(() => layout())
    ro.observe(canvas.value)
  }
  music.playGame('quiet')
  setProbe()
  await Promise.all(NAMES.map(loadImage))
  buildTextures()
  loaded.value = true
  await nextTick()
  drawThumbs()
})
onBeforeUnmount(() => {
  stopLoop()
  window.clearTimeout(hintTimer)
  window.clearTimeout(helpTimer)
  ro?.disconnect()
  music.stop('game')
  window.removeEventListener('resize', onResize)
  window.visualViewport?.removeEventListener('resize', onResize)
  document.removeEventListener('visibilitychange', onVisibility)
  document.body.style.overflow = bodyOverflow
})
</script>

<template lang="pug">
  div(ref="root" class="tp")
    canvas(
      ref="canvas"
      class="tp-canvas"
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onUp"
    )

    div(v-if="!loaded" class="tp-center")
      div(class="tp-spinner")

    //- the overview: the story, the chapters and the levels
    div(v-else-if="screen === 'menu'" class="tp-menu")
      div(class="tp-card")
        GameIntroBox(
          :title="t('app.bigGames.toepfer.title')"
          :label="t('app.bigGames.common.intro')"
          :story="t('app.bigGames.toepfer.story')"
          :task="t('app.bigGames.toepfer.task')"
        )
        button(type="button" class="tp-shelfbtn" data-test="toepfer-shelf" @click="toShelf")
          img(:src="plankSrc" alt="" class="tp-shelfbtn-pic" @error="hideBroken")
          span(class="tp-shelfbtn-text") {{ t('app.bigGames.toepfer.shelf') }} · {{ shelfCount }} / {{ LEVEL_COUNT }}
        p(v-if="allDone" class="tp-done") {{ t('app.bigGames.toepfer.allDone') }}
        div(v-for="(ct, c) in chapterTexts" :key="c" class="tp-chapter")
          div(class="tp-banner")
            span(class="tp-ch-name") {{ ct.name }}
            span(class="tp-ch-ref") {{ ct.ref }}
            span(class="tp-ch-stars") ★ {{ chapterStars(c) }} / {{ LEVELS_PER_CHAPTER * 3 }}
          p(class="tp-ch-story") {{ ct.story }}
          div(class="tp-levels")
            button(
              v-for="i in chapterLevels(c)"
              :key="i"
              type="button"
              class="tp-level"
              :data-test="'toepfer-level-' + i"
              @click="begin(i)"
            )
              canvas(class="tp-thumb" :data-lv="i")
              span(class="tp-level-name") {{ levelLabel(i) }}
              AdventureStars(:stars="levelStars[i] ?? 0" :size="16")
        p(class="tp-rules") {{ t('app.bigGames.toepfer.starRules') }}
        div(class="tp-menu-buttons")
          AdvButton(tone="blau" small data-test="toepfer-how" @click="how = true") {{ t('app.bigGames.toepfer.howTitle') }}
          AdvButton(tone="blau" small @click="leave") {{ t('app.bigGames.toepfer.leave') }}

    //- my pottery: the shelf with all vessels
    div(v-else-if="screen === 'shelf'" class="tp-menu tp-menu--shelf")
      div(class="tp-card tp-card--shelf")
        h1(class="tp-title") {{ t('app.bigGames.toepfer.shelf') }} · {{ shelfCount }} / {{ LEVEL_COUNT }}
        p(v-if="allDone" class="tp-done") {{ t('app.bigGames.toepfer.allDone') }}
        p(v-else-if="shelfCount === 0" class="tp-rules") {{ t('app.bigGames.toepfer.shelfEmpty') }}
        div(v-for="(row, r) in shelfRows" :key="r" class="tp-shelfrow")
          button(
            v-for="i in row"
            :key="i"
            type="button"
            class="tp-slot"
            :aria-label="levelLabel(i)"
            :data-test="'toepfer-slot-' + i"
            @click="begin(i)"
          )
            canvas(class="tp-thumb tp-thumb--shelf" :data-lv="i")
          img(:src="plankSrc" alt="" class="tp-plank" @error="hideBroken")
        div(class="tp-menu-buttons")
          AdvButton(tone="blau" data-test="toepfer-shelf-back" @click="toMenu") {{ t('app.bigGames.toepfer.menu') }}

    //- the game
    template(v-else-if="screen === 'play'")
      div(class="tp-top")
        button(type="button" class="tp-btn" :aria-label="t('app.bigGames.toepfer.pause')" data-test="toepfer-pause" @click="paused = true") ❚❚
        div(class="tp-info")
          span(class="tp-level-label") {{ phase === 'shape' ? chapterTexts[chapterOf(level)]?.name + ' · ' + levelLabel(level) : phaseTitle || levelLabel(level) }}
          div(v-if="phase === 'shape'" class="tp-meter" :aria-label="t('app.bigGames.toepfer.starRules')" data-test="toepfer-meter")
            div(class="tp-meter-bar")
              div(class="tp-meter-fill" :style="{ width: meterPct + '%' }")
              span(v-for="i in 3" :key="i" class="tp-tick" :style="{ left: tickPct(i - 1) + '%' }")
            span(class="tp-meter-stars")
              span(v-for="i in 3" :key="i" :class="['tp-star', { 'is-on': hud.stars >= i }]") ★

      div(v-if="hintShown" class="tp-tip") {{ hintText }}

      //- the tools while forming
      div(v-if="phase === 'shape'" class="tp-tools")
        button(type="button" :class="['tp-done-btn', { 'is-off': !hud.ready }]" :aria-disabled="!hud.ready" data-test="toepfer-done" @click="aDone")
          span ✓ {{ t('app.bigGames.toepfer.done') }}
        button(type="button" class="tp-tool" :aria-label="t('app.bigGames.toepfer.undoAria')" data-test="toepfer-undo" @click="aUndo")
          span(class="tp-glyph") ↶
          span(class="tp-tool-label") {{ t('app.bigGames.toepfer.undo') }}
        button(type="button" :class="['tp-tool', { 'is-on': hud.help }]" :aria-label="t('app.bigGames.toepfer.helpAria')" data-test="toepfer-help" @click="aHelp")
          span(class="tp-glyph") ?
          span(class="tp-tool-label") {{ t('app.bigGames.toepfer.help') }}
        button(type="button" class="tp-tool" :aria-label="t('app.bigGames.toepfer.resetAria')" data-test="toepfer-reset" @click="aReset")
          span(class="tp-glyph") ↻
          span(class="tp-tool-label") {{ t('app.bigGames.toepfer.reset') }}

      //- the paint panel
      div(v-else-if="phase === 'paint'" class="tp-tools tp-tools--paint")
        button(type="button" class="tp-done-btn" data-test="toepfer-paint-done" @click="aPaintDone")
          span ✓ {{ t('app.bigGames.toepfer.done') }}
        div(class="tp-chips")
          button(type="button" :class="['tp-chip', 'tp-chip--clay', { 'is-sel': glazeSel === 0 }]" :aria-label="glazeNames[0]" data-test="toepfer-glaze-0" :style="{ backgroundImage: 'url(' + claySrc + ')' }" @click="pickGlaze(0)")
          button(v-for="g in POTS" :key="g" type="button" :class="['tp-chip', 'tp-chip--pot', { 'is-sel': glazeSel === g }]" :aria-label="glazeNames[g]" :data-test="'toepfer-glaze-' + g" @click="pickGlaze(g)")
            img(:src="potSrc(g)" alt="" @error="hideBroken")
        div(class="tp-chips")
          button(type="button" :class="['tp-chip', 'tp-chip--none', { 'is-sel': patSel === 0 }]" :aria-label="patternNames[0]" data-test="toepfer-pattern-0" @click="pickPattern(0)") ✕
          button(v-for="p in POTS" :key="p" type="button" :class="['tp-chip', 'tp-chip--pat', { 'is-sel': patSel === p }]" :aria-label="patternNames[p]" :data-test="'toepfer-pattern-' + p" :style="{ backgroundImage: 'url(' + patSrc(p) + ')' }" @click="pickPattern(p)")

      div(v-if="phase === 'fire'" class="tp-fire-skip" @pointerdown="aFireSkip")

      div(v-if="paused && !how && chapterCard < 0" class="tp-menu tp-menu--dim")
        div(class="tp-card tp-card--small")
          h2(class="tp-title") {{ t('app.bigGames.toepfer.pause') }}
          AdvButton(data-test="toepfer-resume" @click="paused = false; kick()") {{ t('app.bigGames.toepfer.resume') }}
          AdvButton(tone="blau" data-test="toepfer-pause-again" @click="begin(level)") {{ t('app.bigGames.toepfer.again') }}
          AdvButton(tone="blau" data-test="toepfer-menu" @click="toMenu") {{ t('app.bigGames.toepfer.menu') }}

    //- the end of a round
    div(v-else-if="screen === 'result'" class="tp-menu tp-menu--dim")
      div(class="tp-card tp-card--small")
        h2(class="tp-title") {{ chapterTexts[chapterOf(level)]?.name }} · {{ levelLabel(level) }}
        canvas(ref="resultCanvas" class="tp-result-pic")
        AdventureStars(:stars="outcome.stars" :size="56" celebrate)
        p(class="tp-text") {{ resultText }}
        p(class="tp-line is-on") {{ t('app.bigGames.toepfer.lineFit', { n: outcome.fit }) }}
        p(v-if="rewardChapter >= 0" class="tp-line is-on") {{ t('app.bigGames.toepfer.chapterDone') }}
        p(v-if="allDone" class="tp-text") {{ t('app.bigGames.toepfer.allDone') }}
        AdvButton(v-if="hasNext" data-test="toepfer-next" @click="begin(level + 1)") {{ t('app.bigGames.toepfer.next') }}
        AdvButton(:tone="hasNext ? 'blau' : 'gold'" data-test="toepfer-again" @click="begin(level)") {{ t('app.bigGames.toepfer.again') }}
        AdvButton(tone="blau" data-test="toepfer-to-shelf" @click="toShelf") {{ t('app.bigGames.toepfer.shelf') }}
        AdvButton(tone="blau" data-test="toepfer-menu" @click="toMenu") {{ t('app.bigGames.toepfer.menu') }}

    //- the story of a chapter (once)
    div(v-if="chapterCard >= 0 && loaded && !how" class="tp-menu tp-menu--dim")
      div(class="tp-card tp-card--small")
        h2(class="tp-title") {{ chapterTexts[chapterCard]?.name }}
        p(class="tp-ch-ref-line") {{ chapterTexts[chapterCard]?.ref }}
        p(class="tp-text") {{ chapterTexts[chapterCard]?.story }}
        p(class="tp-text tp-text--task") {{ chapterTexts[chapterCard]?.task }}
        AdvButton(data-test="toepfer-chapter-go" @click="closeCard") {{ t('app.bigGames.toepfer.go') }}

    //- the explanation (once; the question mark in the menu brings it back)
    div(v-if="how && loaded" class="tp-menu tp-menu--dim")
      div(class="tp-card tp-how")
        h2(class="tp-title") {{ t('app.bigGames.toepfer.howTitle') }}
        div(class="tp-how-row")
          img(:src="handSrc" alt="" class="tp-how-hand" @error="hideBroken")
          p(class="tp-how-line") {{ t('app.bigGames.toepfer.howShape') }}
        div(class="tp-how-row")
          span(class="tp-how-sign") ⇧
          p(class="tp-how-line") {{ t('app.bigGames.toepfer.howTop') }}
        div(class="tp-how-row")
          span(class="tp-how-sign") ✓
          p(class="tp-how-line") {{ t('app.bigGames.toepfer.howFire') }}
        AdvButton(data-test="toepfer-go" @click="closeHow") {{ t('app.bigGames.toepfer.go') }}
</template>

<style scoped lang="sass">
.tp
  position: fixed
  inset: 0
  z-index: 60
  background: #3a2414
  overflow: hidden
  user-select: none
  -webkit-user-select: none
  touch-action: none

.tp-canvas
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  touch-action: none

.tp-center
  position: absolute
  inset: 0
  display: grid
  place-items: center

.tp-spinner
  width: 46px
  height: 46px
  border-radius: 50%
  border: 5px solid rgba(255, 255, 255, 0.25)
  border-top-color: #f5c84a
  animation: tp-spin 0.9s linear infinite

@keyframes tp-spin
  to
    transform: rotate(360deg)

.tp-menu
  position: absolute
  inset: 0
  display: grid
  place-items: start center
  padding: 16px
  overflow-y: auto
  background: linear-gradient(180deg, rgba(40, 22, 10, 0.78), rgba(40, 22, 10, 0.9))
  touch-action: pan-y

  &--dim
    place-items: center
    background: rgba(30, 16, 6, 0.62)
    z-index: 5

.tp-card
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

  &--shelf
    width: min(760px, 100%)

.tp-title
  margin: 0
  font-size: 1.5rem
  font-weight: 800

.tp-text
  margin: 0
  font-size: 1.1rem
  line-height: 1.4

  &--task
    font-weight: 800

.tp-done
  margin: 0
  padding: 8px 12px
  border-radius: 14px
  background: #fff1c2
  font-weight: 800

.tp-rules
  margin: 0
  font-size: 0.85rem
  color: var(--lk-muted, #7a6b4f)

.tp-shelfbtn
  position: relative
  width: 100%
  min-height: 56px
  padding: 0
  border: none
  border-radius: 16px
  overflow: hidden
  background: #8a5a30
  cursor: pointer

.tp-shelfbtn-pic
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  object-fit: fill

.tp-shelfbtn-text
  position: relative
  display: block
  padding: 16px 12px
  color: #fff6dc
  font-size: 1.1rem
  font-weight: 800
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7)

.tp-chapter
  width: 100%
  display: flex
  flex-direction: column
  gap: 8px

.tp-banner
  position: relative
  display: flex
  flex-direction: column
  align-items: flex-start
  gap: 1px
  padding: 8px 12px
  border-radius: 14px
  background: linear-gradient(90deg, #8a4a24, #b8703a)
  color: #fff6dc
  text-align: left

.tp-ch-name
  font-size: 1.05rem
  font-weight: 800

.tp-ch-ref
  font-size: 0.78rem
  font-weight: 600
  opacity: 0.9

.tp-ch-stars
  position: absolute
  right: 12px
  top: 8px
  font-weight: 800
  font-size: 0.9rem
  color: #ffe27a

.tp-ch-story, .tp-ch-ref-line
  margin: 0
  font-size: 0.88rem
  line-height: 1.35
  color: var(--lk-muted, #7a6b4f)
  text-align: left

.tp-levels
  display: grid
  grid-template-columns: repeat(auto-fill, minmax(92px, 1fr))
  gap: 8px
  width: 100%

.tp-level
  display: flex
  flex-direction: column
  align-items: center
  gap: 2px
  min-height: 120px
  padding: 6px 4px
  border: 2px solid var(--lk-line, #e3d7bb)
  border-radius: 16px
  background: var(--lk-surface-2, #f6efdc)
  color: inherit
  font: inherit
  cursor: pointer

.tp-thumb
  width: 64px
  height: 72px

  &--shelf
    width: 100%
    height: 100%

.tp-level-name
  font-size: 0.78rem
  font-weight: 700
  line-height: 1.1
  min-height: 1.7em
  display: flex
  align-items: center

.tp-menu-buttons
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 10px

.tp-shelfrow
  position: relative
  display: grid
  grid-auto-flow: column
  grid-auto-columns: 1fr
  gap: 4px
  width: 100%
  padding-bottom: 14px

.tp-slot
  position: relative
  z-index: 1
  min-height: 92px
  padding: 0
  border: none
  background: transparent
  cursor: pointer

.tp-plank
  position: absolute
  left: -2%
  right: -2%
  bottom: -6px
  width: 104%
  height: 28px
  object-fit: fill
  z-index: 0

.tp-top
  position: absolute
  top: 0
  left: 0
  right: 0
  display: flex
  align-items: flex-start
  gap: 8px
  padding: max(6px, env(safe-area-inset-top)) max(8px, env(safe-area-inset-right)) 0 max(8px, env(safe-area-inset-left))
  pointer-events: none

.tp-top > *
  pointer-events: auto

.tp-btn
  display: grid
  place-items: center
  flex: none
  width: 48px
  height: 48px
  padding: 0
  border: none
  border-radius: 50%
  background: rgba(255, 250, 235, 0.94)
  color: #2a2418
  font-size: 1.1rem
  font-weight: 800
  cursor: pointer
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3)

.tp-info
  flex: 1
  min-width: 0
  max-width: 420px
  display: flex
  flex-direction: column
  align-items: center
  gap: 2px
  padding: 4px 10px
  border-radius: 14px
  background: rgba(255, 250, 235, 0.92)
  font-weight: 800
  text-align: center

.tp-level-label
  font-size: 0.85rem
  line-height: 1.15
  white-space: nowrap
  overflow: hidden
  text-overflow: ellipsis
  max-width: 100%

.tp-meter
  display: flex
  align-items: center
  gap: 8px
  width: 100%

.tp-meter-bar
  position: relative
  flex: 1
  height: 10px
  border-radius: 6px
  background: rgba(120, 90, 50, 0.25)

.tp-meter-fill
  height: 100%
  border-radius: 6px
  background: linear-gradient(90deg, #d9a43a, #7ac26a)
  transition: width 0.15s

.tp-tick
  position: absolute
  top: -2px
  width: 2px
  height: 14px
  background: rgba(60, 36, 14, 0.6)

.tp-meter-stars
  display: flex
  gap: 1px

.tp-star
  font-size: 1rem
  color: #b9ae96

  &.is-on
    color: #f0a812
    text-shadow: 0 0 6px rgba(255, 210, 80, 0.8)

.tp-tip
  position: absolute
  left: 50%
  top: 74px
  transform: translateX(-50%)
  max-width: min(520px, 92vw)
  padding: 10px 18px
  border-radius: 18px
  background: rgba(255, 250, 235, 0.96)
  color: #2a2418
  font-weight: 700
  text-align: center
  pointer-events: none

// the tools: a row at the bottom (upright) or a column at the right (wide)
.tp-tools
  position: absolute
  left: 0
  right: 0
  bottom: 0
  display: flex
  flex-wrap: wrap
  justify-content: center
  align-items: center
  gap: 10px
  padding: 8px max(10px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(10px, env(safe-area-inset-left))
  pointer-events: none

.tp-tools > *
  pointer-events: auto

.tp-tool
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  gap: 0
  width: 72px
  min-height: 64px
  padding: 4px
  border: none
  border-radius: 18px
  background: rgba(255, 250, 235, 0.94)
  color: #4a3010
  cursor: pointer
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35)

  &.is-on
    background: #ffe27a

.tp-glyph
  font-size: 1.5rem
  font-weight: 800
  line-height: 1.1

.tp-tool-label
  font-size: 0.72rem
  font-weight: 800

.tp-done-btn
  order: 5
  min-width: 132px
  min-height: 64px
  padding: 0 22px
  border: none
  border-radius: 32px
  background: linear-gradient(180deg, #f6c64a, #e09a1c)
  color: #3a2208
  font-size: 1.25rem
  font-weight: 900
  cursor: pointer
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.4)

  &.is-off
    background: rgba(240, 228, 200, 0.9)
    color: #8a7a5a

.tp-chips
  display: flex
  gap: 6px
  align-items: center

.tp-chip
  position: relative
  display: grid
  place-items: center
  width: 48px
  height: 56px
  padding: 0
  border: 3px solid rgba(255, 250, 235, 0.6)
  border-radius: 16px
  background-color: rgba(255, 250, 235, 0.92)
  background-size: cover
  background-position: center
  color: #6a4a20
  font-weight: 800
  cursor: pointer
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35)

  img
    width: 100%
    height: 100%
    object-fit: contain
    pointer-events: none

  &--clay
    border-radius: 50%
    height: 48px

  &--pat
    height: 48px
    background-size: 135%
    border-radius: 50%
    background-color: #f6ecd4

  &--none
    height: 48px
    border-radius: 50%

  &.is-sel
    border-color: #ffd23a
    box-shadow: 0 0 0 3px rgba(255, 210, 58, 0.7), 0 2px 8px rgba(0, 0, 0, 0.35)

.tp-tools--paint
  gap: 8px

.tp-fire-skip
  position: absolute
  inset: 0

.tp-result-pic
  width: 140px
  height: 170px

.tp-line
  margin: 0
  font-size: 0.92rem
  color: var(--lk-muted, #7a6b4f)

  &.is-on
    color: var(--lk-text, #2a2418)
    font-weight: 700

.tp-how
  gap: 20px

.tp-how-row
  display: flex
  align-items: center
  gap: 16px
  width: 100%

.tp-how-sign, .tp-how-hand
  width: 72px
  flex: none
  text-align: center

.tp-how-sign
  font-size: 2.2rem
  color: #d9922a

.tp-how-hand
  height: auto

.tp-how-line
  margin: 0
  text-align: left
  font-size: 1.2rem
  font-weight: 700
  line-height: 1.3

@media (max-height: 520px)
  .tp-how
    gap: 8px
  .tp-how-row
    gap: 12px
  .tp-how-sign
    width: 40px
    font-size: 1.5rem
  .tp-how-hand
    width: 56px
  .tp-how-line
    font-size: 1.05rem

// the wide (lying) phone: the tools stand in a column at the right edge
@media (min-aspect-ratio: 23/20)
  .tp-tools
    left: auto
    top: 52px
    bottom: 0
    width: 122px
    flex-direction: column
    flex-wrap: nowrap
    justify-content: flex-start
    gap: 8px
    padding: 4px max(8px, env(safe-area-inset-right)) 8px 4px

  .tp-done-btn
    order: 0
    min-width: 0
    width: 100%
    min-height: 56px
    padding: 0
    font-size: 1.1rem

  .tp-tool
    width: 100%
    min-height: 52px
    flex-direction: row
    gap: 8px

  .tp-tools--paint
    justify-content: flex-start
    gap: 6px

  .tp-chips
    flex-wrap: wrap
    justify-content: center
    gap: 4px

  .tp-chip
    width: 44px
    height: 44px

    &--pot
      height: 48px

  .tp-info
    max-width: 320px
</style>
