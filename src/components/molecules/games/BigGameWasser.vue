<script setup lang="ts">
/**
 * "Wasser für das Volk": the big game (rules and physics in `utils/wasserGame.ts`, the levels in `utils/wasserLevels.ts`; this file draws it and takes the touch).
 * The finger digs through earth and sand, the water runs down the way that is dug into the vessel. Three worlds (Moses in the desert, Elijah and the rain, the
 * wells of the fathers). The field is 2:3; it is fitted into the screen (upright or turned).
 *
 * Drawing: the earth is one picture (a canvas, cut out of the painted textures with soft edges and redrawn only where something changed), the water another
 * (a smooth field of the masses, drawn only where there is water); sprites, plants and particles are drawn over them.
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import AdventureStars from '@/components/molecules/AdventureStars.vue'
import useBigGames, { howSeen, markHowSeen } from '@/use/useBigGames'
import useSfx from '@/use/useSfx'
import useMusic from '@/use/useMusic'
import { prependBaseUrl } from '@/utils/function'
import { AIR, DIG_R, DIRT, H, K, MUD, ROCK, SAND, SALT, SIM_HZ, W, WALL, WOOD, digLine, dig, efficiency, finished, newWorld, start, step, type Stroke, type World } from '@/utils/wasserGame'
import { LEVELS, WORLDS } from '@/utils/wasserLevels'

const emit = defineEmits<{ leave: [] }>()
const { t, tm, rt } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const music = useMusic()
const progress = useBigGames()
const ID = 'wasser'

// ── the pictures ────────────────────────────────────────────────────────────────────────────────────────────────────────────
const TILES = ['erde-1', 'erde-2', 'erde-3', 'fels-1', 'fels-2', 'fels-3', 'sand', 'schlamm', 'salz', 'holz', 'ton', 'stein']
const SPRITES = [
  'bg-mose', 'bg-elia', 'bg-vaeter', 'krug', 'trog', 'brunnen', 'becken', 'rad', 'hebel-aus', 'hebel-an', 'quelle', 'wolke',
  'blume-1-durstig', 'blume-1-bluehend', 'dorn-1-durstig', 'dorn-1-bluehend', 'blume-2-durstig', 'blume-2-bluehend', 'dorn-2-durstig', 'dorn-2-bluehend', 'blume-3-durstig', 'blume-3-bluehend', 'dorn-3-durstig', 'dorn-3-bluehend'
]
const img: Record<string, HTMLImageElement | undefined> = {}
const loaded = ref(false)
const glow = new Image()
glow.src = prependBaseUrl('images/abenteuer/ui/sternglanz.webp')
const pic = (n: string) => prependBaseUrl(`images/spiele-gross/wasser/${n}.webp`)

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

/** The size of a texture tile; a tile is 384 pixels, the earth picture 4 pixels per cell, so a tile is as wide as the field. */
const TW = 384
/** The pixels of the earth picture and of the water picture per cell. */
const TS = 4
const WS = 3
const tiles: Record<string, Uint32Array | undefined> = {}
/** The colour of each material when its picture is missing (and the mean colour for the dust). */
const FLAT: Record<number, number> = { [DIRT]: 0xff8abbd9, [ROCK]: 0xff68696c, [SAND]: 0xff7ad2f0, [MUD]: 0xff223a5a, [SALT]: 0xfff0eaf4, [WOOD]: 0xff22487a, [WALL]: 0xff3a6bb8 }
const meanColor: Record<number, string> = {}

function makeTile(n: string) {
  const i = img[n]
  if (!i) return
  const c = document.createElement('canvas')
  c.width = TW
  c.height = TW
  const x = c.getContext('2d', { willReadFrequently: true })
  if (!x) return
  x.drawImage(i, 0, 0, TW, TW)
  tiles[n] = new Uint32Array(x.getImageData(0, 0, TW, TW).data.buffer)
}

async function loadAll() {
  await Promise.all([...TILES, ...SPRITES].map(loadImage))
  for (const n of TILES) makeTile(n)
  loaded.value = true
}

// ── the screens ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
type Screen = 'menu' | 'play' | 'result'
const screen = ref<Screen>('menu')
const level = ref(0)
const paused = ref(false)
const how = ref(false)
const tipShown = ref(false)
const levelNames = computed(() => ((tm('app.bigGames.wasser.levels') as unknown as Parameters<typeof rt>[0][]) ?? []).map((m) => rt(m)))
const worldTexts = computed(() => ((tm('app.bigGames.wasser.worlds') as unknown as { name: Parameters<typeof rt>[0]; ref: Parameters<typeof rt>[0] }[]) ?? []).map((m) => ({ name: rt(m.name), ref: rt(m.ref) })))
const levelStars = computed(() => progress.levels(ID))
const levelTitle = (i: number) => levelNames.value[i] ?? String(i + 1)
const worldOf = (i: number) => LEVELS[i]?.world ?? 0
const worldStars = (wi: number) => LEVELS.reduce((n, l, i) => (l.world === wi ? n + (levelStars.value[i] ?? 0) : n), 0)
const worldMax = (wi: number) => LEVELS.filter((l) => l.world === wi).length * 3
const worldLevels = (wi: number) => LEVELS.map((l, i) => ({ l, i })).filter((x) => x.l.world === wi)
const hasNext = computed(() => level.value < LEVELS.length - 1)

/** What the page shows while it plays (the game itself is not reactive). */
const hud = reactive({ fill: 0, flowers: [] as boolean[], won: false, drowned: false, thorns: [] as boolean[] })
const outcome = reactive({ phase: 'won' as 'won' | 'lost', stars: 0, plants: 0, plantsMax: 3, eff: 0, effNeed: 0, filled: false })

// ── the game ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
let w: World = newWorld(LEVELS[0]!)
const canvas = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let raf = 0
let last = 0
let acc = 0
let dpr = 1
/** The field on the screen (css pixels): left, top, size of one cell. */
let fx = 0
let fy = 0
let cell = 1
let cvW = 1
let cvH = 1

// the two pictures of the field
let terrCanvas: HTMLCanvasElement | null = null
let terrCtx: CanvasRenderingContext2D | null = null
let terrData: ImageData | null = null
let terr32: Uint32Array | null = null
let waterCanvas: HTMLCanvasElement | null = null
let waterCtx: CanvasRenderingContext2D | null = null
let waterData: ImageData | null = null
let water32: Uint32Array | null = null
let waterBox = { x0: 0, y0: 0, x1: -1, y1: -1 }
let seenTerrain = 0

function makeLayers() {
  terrCanvas = document.createElement('canvas')
  terrCanvas.width = W * TS
  terrCanvas.height = H * TS
  terrCtx = terrCanvas.getContext('2d')
  terrData = terrCtx?.createImageData(W * TS, H * TS) ?? null
  terr32 = terrData ? new Uint32Array(terrData.data.buffer) : null
  waterCanvas = document.createElement('canvas')
  waterCanvas.width = W * WS
  waterCanvas.height = H * WS
  waterCtx = waterCanvas.getContext('2d')
  waterData = waterCtx?.createImageData(W * WS, H * WS) ?? null
  water32 = waterData ? new Uint32Array(waterData.data.buffer) : null
}

/** The texture of each material for the level at hand (the wall of the vessel is a jar of clay, a wooden trough or a well of stone). */
function textureFor(mat: number): Uint32Array | undefined {
  const wi = worldOf(level.value) + 1
  if (mat === DIRT) return tiles[`erde-${wi}`]
  if (mat === ROCK) return tiles[`fels-${wi}`]
  if (mat === SAND) return tiles.sand
  if (mat === MUD) return tiles.schlamm
  if (mat === SALT) return tiles.salz
  if (mat === WOOD) return tiles.holz
  if (mat === WALL) {
    const v = LEVELS[level.value]!.vessel
    return v === 'trog' ? tiles.holz : v === 'brunnen' ? tiles.stein : tiles.ton
  }
  return undefined
}

/** Draws the earth picture again inside a rectangle of cells. */
function paintTerrain(cx0: number, cy0: number, cx1: number, cy1: number) {
  if (!terr32 || !terrCtx || !terrData) return
  const px0 = Math.max(0, (cx0 - 1) * TS)
  const py0 = Math.max(0, (cy0 - 1) * TS)
  const px1 = Math.min(W * TS - 1, (cx1 + 2) * TS)
  const py1 = Math.min(H * TS - 1, (cy1 + 2) * TS)
  const mat = w.mat
  const tex: (Uint32Array | undefined)[] = []
  for (let m = 0; m < 8; m++) tex[m] = textureFor(m)
  const rowW = W * TS
  for (let py = py0; py <= py1; py++) {
    const v = (py + 0.5) / TS - 0.5
    const j0 = Math.floor(v)
    const fyy = v - j0
    const ty = (py % TW) * TW
    for (let px = px0; px <= px1; px++) {
      const u = (px + 0.5) / TS - 0.5
      const i0 = Math.floor(u)
      const fxx = u - i0
      const w00 = (1 - fxx) * (1 - fyy)
      const w10 = fxx * (1 - fyy)
      const w01 = (1 - fxx) * fyy
      const w11 = fxx * fyy
      const m00 = i0 < 0 || j0 < 0 || i0 >= W || j0 >= H ? ROCK : mat[j0 * W + i0]!
      const m10 = i0 + 1 < 0 || j0 < 0 || i0 + 1 >= W || j0 >= H ? ROCK : mat[j0 * W + i0 + 1]!
      const m01 = i0 < 0 || j0 + 1 < 0 || i0 >= W || j0 + 1 >= H ? ROCK : mat[(j0 + 1) * W + i0]!
      const m11 = i0 + 1 < 0 || j0 + 1 < 0 || i0 + 1 >= W || j0 + 1 >= H ? ROCK : mat[(j0 + 1) * W + i0 + 1]!
      const a00 = m00 !== AIR ? w00 : 0
      const a10 = m10 !== AIR ? w10 : 0
      const a01 = m01 !== AIR ? w01 : 0
      const a11 = m11 !== AIR ? w11 : 0
      const d = a00 + a10 + a01 + a11
      const o = py * rowW + px
      if (d < 0.42) {
        terr32[o] = 0
        continue
      }
      const alpha = d < 0.5 ? (d - 0.42) / 0.08 : 1
      const tx = px % TW
      let r = 0
      let g = 0
      let b = 0
      for (let k = 0; k < 4; k++) {
        const wt = k === 0 ? a00 : k === 1 ? a10 : k === 2 ? a01 : a11
        if (wt <= 0) continue
        const m = k === 0 ? m00 : k === 1 ? m10 : k === 2 ? m01 : m11
        const tl = tex[m]
        const c = tl ? tl[ty + tx]! : FLAT[m]!
        r += wt * (c & 255)
        g += wt * ((c >> 8) & 255)
        b += wt * ((c >> 16) & 255)
      }
      // the rim is darker (a soft outline), the inside keeps the colours of the painting
      const shade = 0.62 + 0.38 * Math.min(1, Math.max(0, (d - 0.5) / 0.42))
      const kk = shade / d
      terr32[o] = (Math.round(alpha * 255) << 24) | (Math.min(255, Math.round(b * kk)) << 16) | (Math.min(255, Math.round(g * kk)) << 8) | Math.min(255, Math.round(r * kk))
    }
  }
  terrCtx.putImageData(terrData, 0, 0, px0, py0, px1 - px0 + 1, py1 - py0 + 1)
}

function paintAllTerrain() {
  paintTerrain(0, 0, W - 1, H - 1)
  w.dirty.on = false
  seenTerrain = w.terrain
  // the mean colour of each material (for the dust)
  for (const m of [DIRT, ROCK, SAND, MUD, SALT, WOOD, WALL]) {
    const tl = textureFor(m)
    let r = 0
    let g = 0
    let b = 0
    let n = 0
    for (let i = 0; i < 4000; i += 7) {
      const c = tl ? tl[(i * 97) % (TW * TW)]! : FLAT[m]!
      r += c & 255
      g += (c >> 8) & 255
      b += (c >> 16) & 255
      n++
    }
    meanColor[m] = `rgb(${Math.round(r / n)},${Math.round(g / n)},${Math.round(b / n)})`
  }
}

/** The water picture: a smooth field of the masses (a bilinear mix, cut at a soft level), lighter at the surface. */
function paintWater(time: number) {
  if (!water32 || !waterCtx || !waterData) return
  // the rows and columns that hold water now
  let x0 = W
  let x1 = -1
  let y0 = H
  let y1 = -1
  const m = w.m
  for (let y = 0; y < H; y++) {
    const o = y * W
    for (let x = 0; x < W; x++) {
      if (m[o + x]! > 0.02) {
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        if (y > y1) y1 = y
      }
    }
  }
  // clear what was drawn before (the old box), then draw the new one
  const ux0 = Math.min(x0, waterBox.x0 < 0 ? x0 : waterBox.x0)
  const ux1 = Math.max(x1, waterBox.x1)
  const uy0 = Math.min(y0, waterBox.y0 < 0 ? y0 : waterBox.y0)
  const uy1 = Math.max(y1, waterBox.y1)
  waterBox = { x0, y0, x1, y1 }
  if (ux1 < ux0 || uy1 < uy0) return
  const px0 = Math.max(0, (ux0 - 2) * WS)
  const py0 = Math.max(0, (uy0 - 2) * WS)
  const px1 = Math.min(W * WS - 1, (ux1 + 3) * WS)
  const py1 = Math.min(H * WS - 1, (uy1 + 3) * WS)
  const rowW = W * WS
  const shimmer = time * 3
  for (let py = py0; py <= py1; py++) {
    const v = (py + 0.5) / WS - 0.5
    const j0 = Math.floor(v)
    const fyy = v - j0
    for (let px = px0; px <= px1; px++) {
      const o = py * rowW + px
      const u = (px + 0.5) / WS - 0.5
      const i0 = Math.floor(u)
      const fxx = u - i0
      let d = 0
      let up = 0
      for (let k = 0; k < 4; k++) {
        const ii = i0 + (k & 1)
        const jj = j0 + (k >> 1)
        if (ii < 0 || jj < 0 || ii >= W || jj >= H) continue
        const mm = m[jj * W + ii]!
        const wt = (k & 1 ? fxx : 1 - fxx) * (k >> 1 ? fyy : 1 - fyy)
        d += wt * (mm > 1 ? 1 : mm)
      }
      if (d < 0.09) {
        water32[o] = 0
        continue
      }
      // is there water above this pixel? (not: the surface, lighter)
      const ci = Math.min(W - 1, Math.max(0, Math.round(u)))
      const cj = Math.min(H - 1, Math.max(0, Math.round(v)))
      up = cj > 0 ? m[(cj - 1) * W + ci]! : 1
      const air = up > 1 ? 0 : 1 - up
      const alpha = d >= 0.4 ? 1 : (d - 0.09) / 0.31
      let r = 34 + 40 * air
      let g = 112 + 56 * air
      let b = 196 + 30 * air
      // a soft shine on the rim and moving glints
      const rim = d < 0.62 ? (0.62 - d) * 1.4 : 0
      const glint = air > 0.5 ? 0.06 * Math.sin(shimmer + px * 0.35) : 0
      const add = (rim + glint) * 255
      r = Math.min(255, r + add * 0.6)
      g = Math.min(255, g + add * 0.8)
      b = Math.min(255, b + add)
      water32[o] = (Math.round(alpha * 235) << 24) | (Math.round(b) << 16) | (Math.round(g) << 8) | Math.round(r)
    }
  }
  waterCtx.putImageData(waterData, 0, 0, px0, py0, px1 - px0 + 1, py1 - py0 + 1)
}

// ── particles (dust, droplets, sparkles) ────────────────────────────────────────────────────────────────────────────────────
interface Part {
  x: number
  y: number
  vx: number
  vy: number
  t: number
  life: number
  r: number
  kind: 'dust' | 'drop' | 'spark'
  color: string
}
const parts: Part[] = []
const MAX_PARTS = 260
let rngState = 12345
const rand = () => {
  rngState = (rngState * 1664525 + 1013904223) >>> 0
  return rngState / 4294967296
}
function spawn(p: Omit<Part, 't'>) {
  if (parts.length >= MAX_PARTS) parts.shift()
  parts.push({ ...p, t: 0 })
}

let lastDigSound = 0
function onEvents(now: number) {
  for (const e of w.events) {
    if (e.type === 'dug') {
      for (let i = 0; i < 3; i++) {
        const a = rand() * Math.PI * 2
        spawn({ x: e.x + Math.cos(a) * 2, y: e.y + Math.sin(a) * 2, vx: Math.cos(a) * (4 + rand() * 10), vy: -6 - rand() * 12, life: 0.45 + rand() * 0.3, r: 0.7 + rand() * 0.9, kind: 'dust', color: meanColor[e.mat] ?? '#c9a56a' })
      }
      if (now - lastDigSound > 220) {
        lastDigSound = now
        play('sack')
      }
    } else if (e.type === 'splash') {
      const n = 2
      for (let i = 0; i < n; i++) spawn({ x: e.x + rand() * 2 - 1, y: e.y + 1, vx: (rand() - 0.5) * 22, vy: -10 - rand() * 18, life: 0.5 + rand() * 0.3, r: 0.45 + rand() * 0.45, kind: 'drop', color: '#a8dcff' })
    } else if (e.type === 'bloom') {
      const p = w.plants[e.i]
      if (p) for (let i = 0; i < 12; i++) spawn({ x: p.x, y: p.y - 5, vx: (rand() - 0.5) * 30, vy: -8 - rand() * 22, life: 0.8 + rand() * 0.5, r: 1.2 + rand() * 1.4, kind: 'spark', color: '#ffe27a' })
      play('found')
    } else if (e.type === 'drown') play('wrong')
    else if (e.type === 'gate') play('clunk')
    else if (e.type === 'sensor') play('snap')
    else if (e.type === 'goal') {
      play('fanfare')
      hud.won = true
    } else if (e.type === 'end') finish(e.phase)
  }
  w.events.length = 0
}

function finish(phase: 'won' | 'lost') {
  outcome.phase = phase
  outcome.stars = phase === 'won' ? w.stars : 0
  outcome.plants = w.plants.filter((p) => p.bloomed).length
  outcome.plantsMax = w.plants.length
  outcome.eff = Math.round(efficiency(w) * 100)
  outcome.effNeed = Math.round(w.def.eff * 100)
  outcome.filled = phase === 'won'
  progress.record(ID, level.value, outcome.stars)
  window.setTimeout(() => {
    if (screen.value !== 'play') return
    screen.value = 'result'
    play(phase === 'won' ? 'result' : 'wrong')
  }, phase === 'won' ? 500 : 900)
}

// ── starting a level ────────────────────────────────────────────────────────────────────────────────────────────────────────
function begin(i: number) {
  level.value = i
  w = newWorld(LEVELS[i]!)
  parts.length = 0
  waterBox = { x0: 0, y0: 0, x1: -1, y1: -1 }
  if (water32) water32.fill(0)
  waterCtx?.clearRect(0, 0, W * WS, H * WS)
  paintAllTerrain()
  hud.fill = 0
  hud.won = false
  hud.flowers = w.plants.map(() => false)
  hud.thorns = w.plants.map((p) => p.thorn)
  hud.drowned = false
  acc = 0
  screen.value = 'play'
  how.value = !howSeen(ID)
  paused.value = how.value
  tipShown.value = false
  tipT = 0
  hintAfter = 0
  setProbe()
  if (!how.value) hintOnce(w.def.intro)
}

function closeHow() {
  how.value = false
  markHowSeen(ID)
  if (screen.value === 'play') {
    paused.value = false
    hintOnce(w.def.intro)
  }
}

function toMenu() {
  screen.value = 'menu'
  paused.value = false
}

// ── the tip: a short line that shows where one can dig ──────────────────────────────────────────────────────────────────────
let tipT = 0
let hintAfter = 0
/** The line of the tip button (a short way that can be dug) is shown for a few seconds. */
function showTip(sec = 4.5) {
  tipT = sec
  tipText.value = t('app.bigGames.wasser.tipText')
  tipShown.value = true
  window.clearTimeout(tipTimer)
  tipTimer = window.setTimeout(() => (tipShown.value = false), sec * 1000)
}
let tipTimer = 0
const tipText = ref('')

/** The first level of a thing says a word about it (once on a device). */
const HINTS_KEY = 'lk-wasser-hints-v1'
function hintOnce(intro: string | undefined) {
  if (!intro || intro === 'mix' || intro === 'pressure') return
  let seen: Record<string, boolean> = {}
  try {
    seen = JSON.parse(localStorage.getItem(HINTS_KEY) ?? '{}') as Record<string, boolean>
  } catch {
    seen = {}
  }
  if (seen[intro]) return
  seen[intro] = true
  try {
    localStorage.setItem(HINTS_KEY, JSON.stringify(seen))
  } catch {
    // not remembered: the word comes again
  }
  tipText.value = t(`app.bigGames.wasser.hint.${intro}`)
  tipShown.value = true
  window.clearTimeout(tipTimer)
  tipTimer = window.setTimeout(() => (tipShown.value = false), 8000)
}
function tipLine(): Stroke {
  return w.def.tip
}

// ── the touch ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
let pressing = false
let lastP: { x: number; y: number } | null = null
let pointer: { x: number; y: number } | null = null

function cellPos(e: PointerEvent): { x: number; y: number } {
  const c = canvas.value!
  const r = c.getBoundingClientRect()
  return { x: (e.clientX - r.left - fx) / cell, y: (e.clientY - r.top - fy) / cell }
}
function onDown(e: PointerEvent) {
  if (screen.value !== 'play' || paused.value) return
  ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
  pressing = true
  const p = cellPos(e)
  lastP = p
  pointer = p
  tipT = 0
  dig(w, p.x, p.y)
}
function onMove(e: PointerEvent) {
  const p = cellPos(e)
  pointer = p
  if (!pressing || !lastP || screen.value !== 'play' || paused.value) return
  digLine(w, lastP.x, lastP.y, p.x, p.y)
  lastP = p
}
function onUp() {
  pressing = false
  lastP = null
  pointer = null
}

// ── the loop ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
function resize() {
  const c = canvas.value
  if (!c) return
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  const box = c.getBoundingClientRect()
  cvW = box.width || window.innerWidth
  cvH = box.height || window.innerHeight
  c.width = Math.round(cvW * dpr)
  c.height = Math.round(cvH * dpr)
  cell = Math.min(cvW / W, cvH / H)
  fx = (cvW - W * cell) / 2
  fy = (cvH - H * cell) / 2
}

function frame(now: number) {
  raf = requestAnimationFrame(frame)
  const dt = Math.min(0.05, (now - last) / 1000 || 0)
  last = now
  advance(dt, now)
  draw(now / 1000, dt)
}

/** Runs the simulation for the time that has passed (fixed steps). */
function advance(dt: number, now: number) {
  if (screen.value !== 'play' || paused.value) return
  acc += dt
  let n = 0
  while (acc >= 1 / SIM_HZ && n < 8) {
    step(w)
    acc -= 1 / SIM_HZ
    n++
    if (w.events.length > 200) onEvents(now)
  }
  if (acc > 0.2) acc = 0
  onEvents(now)
  // the page: the jar, the flowers
  const fill = Math.min(1, w.vesselMass / Math.max(1, w.goal))
  if (Math.abs(hud.fill - fill) > 0.004) hud.fill = fill
  for (let i = 0; i < w.plants.length; i++) {
    if (hud.flowers[i] !== w.plants[i]!.bloomed) hud.flowers[i] = w.plants[i]!.bloomed
  }
  if (w.plants.some((p) => p.drowned) && !hud.drowned) hud.drowned = true
  for (const p of parts) {
    p.t += dt
    p.x += p.vx * dt
    p.y += p.vy * dt
    if (p.kind !== 'spark') p.vy += 60 * dt
    else p.vy += 8 * dt
  }
  for (let i = parts.length - 1; i >= 0; i--) if (parts[i]!.t > parts[i]!.life) parts.splice(i, 1)
}

function sprite(c: CanvasRenderingContext2D, name: string, cx: number, bottom: number, height: number, rot = 0, alpha = 1) {
  const i = img[name]
  if (!i) return
  const wd = (i.width / i.height) * height
  c.save()
  c.translate(cx, bottom)
  if (rot) c.rotate(rot)
  if (alpha < 1) c.globalAlpha = alpha
  c.drawImage(i, -wd / 2, -height, wd, height)
  c.restore()
}

function draw(time: number, dt: number) {
  const c = ctx
  const cv = canvas.value
  if (!c || !cv || !loaded.value) return
  const L = LEVELS[level.value]!
  const wi = L.world
  const bg = img[['bg-mose', 'bg-elia', 'bg-vaeter'][wi]!]
  c.setTransform(dpr, 0, 0, dpr, 0, 0)
  c.fillStyle = '#2a1d12'
  c.fillRect(0, 0, cvW, cvH)
  if (screen.value === 'menu') return
  // the whole screen behind the field: the same painting, dimmed
  if (bg) {
    const k = Math.max(cvW / bg.width, cvH / bg.height)
    c.globalAlpha = 0.55
    c.drawImage(bg, (cvW - bg.width * k) / 2, (cvH - bg.height * k) / 2, bg.width * k, bg.height * k)
    c.globalAlpha = 1
    c.fillStyle = 'rgba(20,12,6,0.45)'
    c.fillRect(0, 0, cvW, cvH)
  }
  c.save()
  c.beginPath()
  c.rect(fx, fy, W * cell, H * cell)
  c.clip()
  c.setTransform(dpr * cell, 0, 0, dpr * cell, dpr * fx, dpr * fy)
  if (bg) c.drawImage(bg, 0, 0, W, H)
  else {
    c.fillStyle = '#7a5a3c'
    c.fillRect(0, 0, W, H)
  }

  // the earth is redrawn where something changed
  if (w.terrain !== seenTerrain) {
    const d = w.dirty
    if (d.on) paintTerrain(Math.max(0, d.x0), Math.max(0, d.y0), Math.min(W - 1, d.x1), Math.min(H - 1, d.y1))
    d.on = false
    seenTerrain = w.terrain
  }
  paintWater(time)
  if (waterCanvas) {
    c.imageSmoothingEnabled = true
    c.drawImage(waterCanvas, 0, 0, W, H)
  }
  if (terrCanvas) c.drawImage(terrCanvas, 0, 0, W, H)

  // the sources: a spring rock, a cloud
  for (const s of w.sources) {
    if (s.cloud) {
      const grow = 0.72 + 0.4 * Math.min(1, w.clock / 6)
      sprite(c, 'wolke', s.x0 + K / 2, s.y0 + 8 + Math.sin(time * 0.8) * 0.8, 20 * grow)
    } else {
      sprite(c, 'quelle', s.x0 + K / 2, s.y0 + K + 3, 14)
    }
  }
  // the mark of the vessel
  drawMark(c, time)

  // the sensors
  for (const s of w.sensors) {
    const cxm = (s.x0 + s.x1 + 1) / 2
    if (s.kind === 'wheel') {
      const size = Math.max(10, (s.x1 - s.x0 + 1) * 1.15)
      sprite(c, 'rad', cxm, (s.y0 + s.y1 + 1) / 2 + size / 2, size, s.angle)
    } else {
      sprite(c, s.on ? 'hebel-an' : 'hebel-aus', cxm, s.y1 + 1, 9)
    }
  }
  // the plants
  w.plants.forEach((p, i) => {
    const t = wi + 1
    const kind = p.thorn ? 'dorn' : 'blume'
    const h = p.thorn ? 9 : 10
    if (p.bloomed) {
      const k = Math.min(1, p.age / 0.5)
      const pop = 1 + 0.25 * Math.sin(k * Math.PI) * (1 - k)
      sprite(c, `${kind}-${t}-bluehend`, p.x, p.y, h * pop)
    } else sprite(c, `${kind}-${t}-durstig`, p.x, p.y, h, 0, p.drowned ? 0.45 : 1)
    void i
  })

  // the tip
  if (tipT > 0) {
    tipT -= dt
    drawTip(c, time)
  }

  // the particles
  for (const p of parts) {
    const k = p.t / p.life
    if (p.kind === 'spark' && glow.complete) {
      c.globalAlpha = 1 - k
      const s = p.r * 4
      c.drawImage(glow, p.x - s / 2, p.y - s / 2, s, s)
      c.globalAlpha = 1
    } else {
      c.globalAlpha = (1 - k) * (p.kind === 'dust' ? 0.9 : 0.85)
      c.fillStyle = p.color
      c.beginPath()
      c.arc(p.x, p.y, p.r * (p.kind === 'dust' ? 1 + k * 0.4 : 1), 0, Math.PI * 2)
      c.fill()
      c.globalAlpha = 1
    }
  }
  // the finger
  if (pointer && screen.value === 'play' && !paused.value) {
    c.strokeStyle = 'rgba(255,255,255,0.55)'
    c.lineWidth = 0.5
    c.beginPath()
    c.arc(pointer.x, pointer.y, DIG_R, 0, Math.PI * 2)
    c.stroke()
  }
  c.restore()
}

function drawMark(c: CanvasRenderingContext2D, time: number) {
  // the vessel: the line up to which it must be filled
  const y = w.markY
  let x0 = W
  let x1 = -1
  for (let x = 0; x < W; x++)
    if (w.vmask[y * W + x]) {
      if (x < x0) x0 = x
      if (x > x1) x1 = x
    }
  if (x1 < x0) return
  const pulse = hud.won ? 0.5 + 0.5 * Math.sin(time * 8) : 0.5
  c.strokeStyle = hud.won ? `rgba(255,226,110,${0.7 + 0.3 * pulse})` : 'rgba(255,236,150,0.9)'
  c.lineWidth = 1
  c.setLineDash([2.5, 2])
  c.beginPath()
  c.moveTo(x0 - 1, y)
  c.lineTo(x1 + 2, y)
  c.stroke()
  c.setLineDash([])
  c.fillStyle = 'rgba(255,236,150,0.95)'
  c.beginPath()
  c.moveTo(x0 - 3.5, y - 1.8)
  c.lineTo(x0 - 0.5, y)
  c.lineTo(x0 - 3.5, y + 1.8)
  c.closePath()
  c.fill()
  c.beginPath()
  c.moveTo(x1 + 4.5, y - 1.8)
  c.lineTo(x1 + 1.5, y)
  c.lineTo(x1 + 4.5, y + 1.8)
  c.closePath()
  c.fill()
}

function drawTip(c: CanvasRenderingContext2D, time: number) {
  const pts = tipLine().pts
  if (pts.length < 2) return
  c.fillStyle = 'rgba(255,245,200,0.95)'
  let len = 0
  const segs: number[] = []
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot((pts[i]![0] - pts[i - 1]![0]) * K, (pts[i]![1] - pts[i - 1]![1]) * K)
    segs.push(l)
    len += l
  }
  const head = ((time * 40) % (len + 20))
  for (let d = 0; d < len; d += 5) {
    let rem = d
    let i = 0
    while (i < segs.length && rem > segs[i]!) {
      rem -= segs[i]!
      i++
    }
    if (i >= segs.length) break
    const a = pts[i]!
    const b = pts[i + 1]!
    const f = segs[i]! > 0 ? rem / segs[i]! : 0
    const x = (a[0] + (b[0] - a[0]) * f) * K
    const y = (a[1] + (b[1] - a[1]) * f) * K
    const near = Math.abs(d - head)
    c.globalAlpha = near < 14 ? 1 : 0.55
    c.beginPath()
    c.arc(x, y, near < 14 ? 1.6 : 1.0, 0, Math.PI * 2)
    c.fill()
  }
  c.globalAlpha = 1
}

// ── the page ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const vesselSrc = computed(() => pic(LEVELS[level.value]?.vessel ?? 'krug'))
const flowerSrc = (i: number, on: boolean) => {
  const wi = worldOf(level.value) + 1
  const thorn = hud.thorns[i]
  return pic(`${thorn ? 'dorn' : 'blume'}-${wi}-${on ? 'bluehend' : 'durstig'}`)
}
const fillStyle = computed(() => ({ clipPath: `inset(${Math.round((1 - hud.fill) * 100)}% 0 0 0)` }))
const starsLive = computed(() => (hud.won ? 1 : 0) + (hud.won && hud.flowers.length > 0 && hud.flowers.every(Boolean) ? 1 : 0))
const resultText = computed(() => {
  if (outcome.phase === 'lost') return t('app.bigGames.wasser.lost')
  return t(`app.bigGames.wasser.won${Math.max(1, outcome.stars)}`)
})
const hideBroken = (e: Event) => {
  ;(e.target as HTMLElement).style.display = 'none'
}
const bannerSrc = (wi: number) => pic(['bg-mose', 'bg-elia', 'bg-vaeter'][wi]!)
const effLine = computed(() => t('app.bigGames.wasser.lineWater', { have: outcome.eff, need: outcome.effNeed }))
const plantsLine = computed(() => t('app.bigGames.wasser.linePlants', { have: outcome.plants, all: outcome.plantsMax }))

function leave() {
  emit('leave')
}

function setProbe() {
  if (window.location.hash.includes('probe=1')) {
    ;(window as unknown as { __wasser?: unknown }).__wasser = {
      get w() {
        return w
      },
      step: (n = 1) => {
        for (let i = 0; i < n; i++) step(w)
        w.events.length = 0
      },
      begin,
      start: () => start(w),
      advance: (sec = 0.02) => advance(sec, performance.now()),
      draw: () => draw(performance.now() / 1000, 0),
      finished: () => finished(w)
    }
  }
}

let bodyOverflow = ''
onMounted(async () => {
  bodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  ctx = canvas.value?.getContext('2d') ?? null
  makeLayers()
  resize()
  window.addEventListener('resize', resize)
  music.playGame('water')
  setProbe()
  await loadAll()
  paintAllTerrain()
  last = performance.now()
  raf = requestAnimationFrame(frame)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  music.stop('game')
  window.removeEventListener('resize', resize)
  document.body.style.overflow = bodyOverflow
})
</script>

<template lang="pug">
  div(class="wg")
    canvas(
      ref="canvas"
      class="wg-canvas"
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onUp"
    )

    //- while the pictures load
    div(v-if="!loaded" class="wg-center")
      div(class="wg-spinner")

    //- the worlds and levels
    div(v-else-if="screen === 'menu'" class="wg-menu")
      div(class="wg-card")
        h1(class="wg-title") {{ t('app.bigGames.wasser.title') }}
        p(class="wg-text") {{ t('app.bigGames.wasser.intro') }}
        div(v-for="(wt, wi) in worldTexts" :key="wi" class="wg-world")
          div(class="wg-banner")
            img(:src="bannerSrc(wi)" alt="" class="wg-banner-pic" @error="hideBroken")
            div(class="wg-banner-text")
              span(class="wg-world-name") {{ wt.name }}
              span(class="wg-world-ref") {{ wt.ref }}
              span(class="wg-world-stars") ★ {{ worldStars(wi) }} / {{ worldMax(wi) }}
          div(class="wg-levels")
            button(
              v-for="x in worldLevels(wi)"
              :key="x.i"
              type="button"
              class="wg-level"
              :data-test="'wasser-level-' + x.i"
              @click="begin(x.i)"
            )
              span(class="wg-level-no") {{ x.i - worldLevels(wi)[0].i + 1 }}
              span(class="wg-level-name") {{ levelTitle(x.i) }}
              AdventureStars(:stars="levelStars[x.i] ?? 0" :size="18")
        p(class="wg-rules") {{ t('app.bigGames.wasser.starRules') }}
        div(class="wg-menu-buttons")
          AdvButton(tone="blau" small data-test="wasser-how" @click="how = true") {{ t('app.bigGames.wasser.howTitle') }}
          AdvButton(tone="blau" small @click="leave") {{ t('app.bigGames.wasser.leave') }}

    //- the game
    template(v-else-if="screen === 'play'")
      div(class="wg-hud")
        div(class="wg-hud-left")
          button(type="button" class="wg-btn" :aria-label="t('app.bigGames.wasser.pause')" data-test="wasser-pause" @click="paused = true") ❚❚
          button(type="button" class="wg-btn" :aria-label="t('app.bigGames.wasser.restart')" data-test="wasser-restart" @click="begin(level)") ↻
          button(type="button" class="wg-btn" :aria-label="t('app.bigGames.wasser.tip')" data-test="wasser-tip" @click="showTip()") 💡
        div(class="wg-hud-mid")
          span(class="wg-level-label") {{ levelTitle(level) }}
          div(class="wg-flowers")
            img(v-for="(on, i) in hud.flowers" :key="i" :src="flowerSrc(i, on)" alt="" :class="['wg-flower', { 'is-on': on }]" @error="hideBroken")
        div(class="wg-hud-right")
          div(class="wg-jar" :aria-label="t('app.bigGames.wasser.jar')")
            img(:src="vesselSrc" alt="" class="wg-jar-base" @error="hideBroken")
            img(:src="vesselSrc" alt="" class="wg-jar-fill" :style="fillStyle" @error="hideBroken")
          div(class="wg-stars-live" :aria-label="t('app.bigGames.wasser.stars')")
            span(v-for="n in 3" :key="n" :class="['wg-star', { 'is-on': n <= starsLive }]") ★
      div(v-if="tipShown" class="wg-tip") {{ tipText }}

      div(v-if="paused && !how" class="wg-menu wg-menu--dim")
        div(class="wg-card wg-card--small")
          h2(class="wg-title") {{ t('app.bigGames.wasser.pause') }}
          AdvButton(data-test="wasser-resume" @click="paused = false") {{ t('app.bigGames.wasser.resume') }}
          AdvButton(tone="blau" data-test="wasser-pause-again" @click="begin(level)") {{ t('app.bigGames.wasser.again') }}
          AdvButton(tone="blau" data-test="wasser-menu" @click="toMenu") {{ t('app.bigGames.wasser.menu') }}

    //- the end of a round
    div(v-else-if="screen === 'result'" class="wg-menu wg-menu--dim")
      div(class="wg-card wg-card--small")
        h2(class="wg-title") {{ levelTitle(level) }}
        AdventureStars(:stars="outcome.stars" :size="56" celebrate)
        p(class="wg-text") {{ resultText }}
        div(v-if="outcome.phase === 'won'" class="wg-lines")
          p(class="wg-line is-on") ✓ {{ t('app.bigGames.wasser.lineJar') }}
          p(:class="['wg-line', { 'is-on': outcome.plants === outcome.plantsMax }]") {{ outcome.plants === outcome.plantsMax ? '✓' : '○' }} {{ plantsLine }}
          p(:class="['wg-line', { 'is-on': outcome.stars >= 3 }]") {{ outcome.stars >= 3 ? '✓' : '○' }} {{ effLine }}
        AdvButton(v-if="outcome.phase === 'won' && hasNext" data-test="wasser-next" @click="begin(level + 1)") {{ t('app.bigGames.wasser.next') }}
        AdvButton(:tone="outcome.phase === 'won' && hasNext ? 'blau' : 'gold'" data-test="wasser-again" @click="begin(level)") {{ t('app.bigGames.wasser.again') }}
        AdvButton(tone="blau" data-test="wasser-menu" @click="toMenu") {{ t('app.bigGames.wasser.menu') }}

    //- the explanation (once; the question mark in the menu brings it back)
    div(v-if="how && loaded" class="wg-menu wg-menu--dim")
      div(class="wg-card wg-how")
        h2(class="wg-title") {{ t('app.bigGames.wasser.howTitle') }}
        div(class="wg-how-row")
          span(class="wg-how-sign") 👆
          p(class="wg-how-line") {{ t('app.bigGames.wasser.howDig') }}
        div(class="wg-how-row")
          img(:src="pic('krug')" alt="" class="wg-how-pic" @error="hideBroken")
          p(class="wg-how-line") {{ t('app.bigGames.wasser.howJar') }}
        div(class="wg-how-row")
          img(:src="pic('blume-1-bluehend')" alt="" class="wg-how-pic" @error="hideBroken")
          p(class="wg-how-line") {{ t('app.bigGames.wasser.howFlowers') }}
        div(class="wg-how-row")
          span(class="wg-how-sign") ★
          p(class="wg-how-line") {{ t('app.bigGames.wasser.howStars') }}
        AdvButton(data-test="wasser-go" @click="closeHow") {{ t('app.bigGames.wasser.go') }}
</template>

<style scoped lang="sass">
.wg
  position: fixed
  inset: 0
  z-index: 60
  background: #2a1d12
  overflow: hidden
  user-select: none
  -webkit-user-select: none
  touch-action: none

.wg-canvas
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  touch-action: none
  cursor: crosshair

.wg-center
  position: absolute
  inset: 0
  display: grid
  place-items: center

.wg-spinner
  width: 46px
  height: 46px
  border-radius: 50%
  border: 5px solid rgba(255, 255, 255, 0.25)
  border-top-color: #f5c84a
  animation: wg-spin 0.9s linear infinite

@keyframes wg-spin
  to
    transform: rotate(360deg)

.wg-menu
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

.wg-card
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

.wg-title
  margin: 0
  font-size: 1.6rem
  font-weight: 800

.wg-text
  margin: 0
  line-height: 1.4

.wg-rules
  margin: 0
  font-size: 0.85rem
  color: var(--lk-muted, #7a6b4f)

.wg-world
  width: 100%
  display: flex
  flex-direction: column
  gap: 8px

.wg-banner
  position: relative
  height: 84px
  border-radius: 16px
  overflow: hidden
  background: #4a3320

.wg-banner-pic
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  object-fit: cover
  object-position: 50% 8%

.wg-banner-text
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

.wg-world-name
  font-size: 1.05rem
  font-weight: 800

.wg-world-ref
  font-size: 0.78rem
  font-weight: 600
  opacity: 0.9

.wg-world-stars
  position: absolute
  right: 12px
  top: 8px
  font-weight: 800
  font-size: 0.9rem
  color: #ffe27a

.wg-levels
  display: grid
  grid-template-columns: repeat(4, minmax(0, 1fr))
  gap: 8px
  width: 100%

.wg-level
  display: flex
  flex-direction: column
  align-items: center
  gap: 4px
  min-height: 48px
  padding: 8px 4px
  border: 2px solid var(--lk-line, #e3d7bb)
  border-radius: 16px
  background: var(--lk-surface-2, #f6efdc)
  color: inherit
  font: inherit
  cursor: pointer

.wg-level-no
  display: grid
  place-items: center
  width: 30px
  height: 30px
  border-radius: 50%
  background: var(--lk-accent, #1f6a6a)
  color: var(--lk-on-accent, #fff)
  font-weight: 800

.wg-level-name
  font-size: 0.74rem
  font-weight: 800
  line-height: 1.15

@media (max-width: 460px)
  .wg-levels
    grid-template-columns: repeat(3, minmax(0, 1fr))

.wg-menu-buttons
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 10px

.wg-hud
  position: absolute
  top: 0
  left: 0
  right: 0
  display: flex
  align-items: flex-start
  justify-content: space-between
  gap: 8px
  padding: max(8px, env(safe-area-inset-top)) max(10px, env(safe-area-inset-right)) 8px max(10px, env(safe-area-inset-left))
  pointer-events: none

.wg-hud > *
  pointer-events: auto

.wg-hud-left
  display: flex
  flex-direction: column
  gap: 8px

.wg-btn
  width: 48px
  height: 48px
  border: none
  border-radius: 50%
  background: rgba(255, 250, 235, 0.9)
  color: #2a2418
  font-size: 1.15rem
  font-weight: 800
  cursor: pointer
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3)

.wg-hud-mid
  display: flex
  flex-direction: column
  align-items: center
  gap: 4px
  padding: 4px 12px
  border-radius: 16px
  background: rgba(255, 250, 235, 0.86)
  font-weight: 800
  max-width: 44vw
  text-align: center

.wg-level-label
  font-size: 0.9rem
  line-height: 1.15

.wg-flowers
  display: flex
  gap: 4px
  min-height: 30px

.wg-flower
  height: 30px
  width: auto
  filter: grayscale(0.55) brightness(0.9)
  transition: filter 0.4s, transform 0.4s

  &.is-on
    filter: none
    transform: scale(1.15)

.wg-hud-right
  display: flex
  flex-direction: column
  align-items: center
  gap: 6px

.wg-jar
  position: relative
  width: 54px
  height: 54px
  padding: 4px
  border-radius: 14px
  background: rgba(255, 250, 235, 0.86)

.wg-jar-base, .wg-jar-fill
  position: absolute
  left: 4px
  top: 4px
  width: 46px
  height: 46px
  object-fit: contain

.wg-jar-base
  filter: grayscale(1) brightness(0.55) contrast(0.9)

.wg-stars-live
  display: flex
  gap: 1px
  padding: 2px 8px
  border-radius: 999px
  background: rgba(255, 250, 235, 0.86)

.wg-star
  font-size: 1.15rem
  color: #b9ae96

  &.is-on
    color: #f0a812
    text-shadow: 0 0 6px rgba(255, 210, 80, 0.8)

.wg-tip
  position: absolute
  left: 50%
  bottom: max(18px, env(safe-area-inset-bottom))
  transform: translateX(-50%)
  max-width: min(560px, 92vw)
  padding: 10px 18px
  border-radius: 999px
  background: rgba(255, 250, 235, 0.94)
  color: #2a2418
  font-weight: 700
  text-align: center
  pointer-events: none

.wg-lines
  display: flex
  flex-direction: column
  gap: 2px
  align-items: flex-start

.wg-line
  margin: 0
  font-size: 0.92rem
  color: var(--lk-muted, #7a6b4f)

  &.is-on
    color: var(--lk-text, #2a2418)
    font-weight: 700

.wg-how
  gap: 10px

.wg-how-row
  display: flex
  align-items: center
  gap: 12px
  width: 100%

.wg-how-pic
  width: 44px
  height: 44px
  object-fit: contain
  flex: none

.wg-how-sign
  width: 44px
  flex: none
  font-size: 1.7rem
  color: #f0a812

.wg-how-line
  margin: 0
  text-align: left
  font-size: 0.95rem
  line-height: 1.35
</style>
