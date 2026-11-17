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
import GameIntroBox from '@/components/molecules/games/GameIntroBox.vue'
import useBigGames, { howSeen, markHowSeen } from '@/use/useBigGames'
import useSfx from '@/use/useSfx'
import useMusic from '@/use/useMusic'
import { prependBaseUrl } from '@/utils/function'
import { AIR, DIG_R, DIRT, H, K, MUD, ROCK, SAND, SALT, SIM_HZ, W, WALL, WOOD, digLine, dig, efficiency, finished, newWorld, nextTipStep, plantsPending, start, step, tipSteps, type Pt, type World } from '@/utils/wasserGame'
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
  'fels-zu', 'fels-auf', 'stab', 'detail-1', 'detail-2', 'detail-3', 'detail-4', 'detail-5', 'detail-6', 'detail-7', 'detail-8',
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
let cellY = 1
/** The most a tall screen stretches the field upwards. */
const STRETCH = 1.3
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
const depth = new Uint8Array(W * H)
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

// ── noise for the earth: a soft one (patches, strata that wave) and a fine one (grains) ──────────────────────────────────────
const NS = 256
const noiseLow = new Float32Array(NS * NS)
const noiseHi = new Uint8Array(NS * NS)
;(() => {
  let seed = 987654321
  const r = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
  const G = 16
  const grid = Array.from({ length: G * G }, () => r())
  for (let y = 0; y < NS; y++) {
    for (let x = 0; x < NS; x++) {
      const u = (x / NS) * G
      const v = (y / NS) * G
      const i0 = Math.floor(u)
      const j0 = Math.floor(v)
      const fx = u - i0
      const fy = v - j0
      const sx = fx * fx * (3 - 2 * fx)
      const sy = fy * fy * (3 - 2 * fy)
      const a = grid[(j0 % G) * G + (i0 % G)]!
      const b = grid[(j0 % G) * G + ((i0 + 1) % G)]!
      const c = grid[((j0 + 1) % G) * G + (i0 % G)]!
      const d = grid[((j0 + 1) % G) * G + ((i0 + 1) % G)]!
      noiseLow[y * NS + x] = a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy
      noiseHi[y * NS + x] = Math.floor(r() * 256)
    }
  }
})()

/** Draws the earth picture again inside a rectangle of cells: painted textures that vary from patch to patch, strata that go with the depth, light on the edges (from the upper left), soft shadow in the tunnels. */
function paintTerrain(cx0: number, cy0: number, cx1: number, cy1: number) {
  if (!terr32 || !terrCtx || !terrData) return
  const px0 = Math.max(0, (cx0 - 2) * TS)
  const py0 = Math.max(0, (cy0 - 2) * TS)
  const px1 = Math.min(W * TS - 1, (cx1 + 3) * TS)
  const py1 = Math.min(H * TS - 1, (cy1 + 3) * TS)
  const mat = w.mat
  const tex: (Uint32Array | undefined)[] = []
  for (let m = 0; m < 8; m++) tex[m] = textureFor(m)
  // the mean colour of the earth and the sand of this world (the picture is calmed towards it)
  const means: ([number, number, number] | undefined)[] = []
  for (const m of [DIRT, SAND]) {
    const tl = tex[m]
    if (!tl) continue
    let r0 = 0
    let g0 = 0
    let b0 = 0
    for (let i = 0; i < TW * TW; i += 97) {
      const c0 = tl[i]!
      r0 += c0 & 255
      g0 += (c0 >> 8) & 255
      b0 += (c0 >> 16) & 255
    }
    const n0 = Math.ceil((TW * TW) / 97)
    means[m] = [r0 / n0, g0 / n0, b0 / n0]
  }
  const rowW = W * TS
  const total = H * TS
  /** The share of solid cells around a point of the picture (a bilinear field). */
  const dens = (px: number, py: number): number => {
    const u = (px + 0.5) / TS - 0.5
    const v = (py + 0.5) / TS - 0.5
    const i0 = Math.floor(u)
    const j0 = Math.floor(v)
    const fxx = u - i0
    const fyy = v - j0
    const s = (i: number, j: number) => (i < 0 || j < 0 || i >= W || j >= H ? 1 : mat[j * W + i] !== AIR ? 1 : 0)
    return (1 - fxx) * (1 - fyy) * s(i0, j0) + fxx * (1 - fyy) * s(i0 + 1, j0) + (1 - fxx) * fyy * s(i0, j0 + 1) + fxx * fyy * s(i0 + 1, j0 + 1)
  }
  const matAt = (i: number, j: number) => (i < 0 || j < 0 || i >= W || j >= H ? ROCK : mat[j * W + i]!)
  for (let py = py0; py <= py1; py++) {
    const v = (py + 0.5) / TS - 0.5
    const j0 = Math.floor(v)
    const fyy = v - j0
    const yFrac = py / total
    for (let px = px0; px <= px1; px++) {
      const u = (px + 0.5) / TS - 0.5
      const i0 = Math.floor(u)
      const fxx = u - i0
      const w00 = (1 - fxx) * (1 - fyy)
      const w10 = fxx * (1 - fyy)
      const w01 = (1 - fxx) * fyy
      const w11 = fxx * fyy
      const m00 = matAt(i0, j0)
      const m10 = matAt(i0 + 1, j0)
      const m01 = matAt(i0, j0 + 1)
      const m11 = matAt(i0 + 1, j0 + 1)
      const a00 = m00 !== AIR ? w00 : 0
      const a10 = m10 !== AIR ? w10 : 0
      const a01 = m01 !== AIR ? w01 : 0
      const a11 = m11 !== AIR ? w11 : 0
      const d = a00 + a10 + a01 + a11
      const o = py * rowW + px
      const ni = ((py & (NS - 1)) << 8) | (px & (NS - 1))
      if (d < 0.42) {
        // air: a soft shadow next to the earth (the tunnels look deep)
        if (d > 0.04) {
          const sh = Math.min(1, d / 0.42)
          const al = Math.round(sh * sh * 150)
          terr32[o] = (al << 24) | (8 << 16) | (14 << 8) | 24
        } else terr32[o] = 0
        continue
      }
      const alpha = d < 0.5 ? (d - 0.42) / 0.08 : 1
      const low = noiseLow[ni]!
      const hi = noiseHi[ni]! / 255
      // the patches: the picture is also taken from a place moved against it, and the two are mixed by the soft noise (no tile pattern shows)
      const tx = px % TW
      const ty = (py % TW) * TW
      const tx2 = (px + 131) % TW
      const ty2 = ((py + 97) % TW) * TW
      let r = 0
      let g = 0
      let b = 0
      for (let k = 0; k < 4; k++) {
        const wt = k === 0 ? a00 : k === 1 ? a10 : k === 2 ? a01 : a11
        if (wt <= 0) continue
        const m = k === 0 ? m00 : k === 1 ? m10 : k === 2 ? m01 : m11
        const tl = tex[m]
        let c = FLAT[m]!
        if (tl) {
          const c1 = tl[ty + tx]!
          const c2 = tl[ty2 + tx2]!
          const mix = Math.min(1, Math.max(0, (low - 0.35) * 3))
          const rr = (c1 & 255) * (1 - mix) + (c2 & 255) * mix
          const gg = ((c1 >> 8) & 255) * (1 - mix) + ((c2 >> 8) & 255) * mix
          const bb = ((c1 >> 16) & 255) * (1 - mix) + ((c2 >> 16) & 255) * mix
          c = (255 << 24) | (Math.round(bb) << 16) | (Math.round(gg) << 8) | Math.round(rr)
        }
        r += wt * (c & 255)
        g += wt * ((c >> 8) & 255)
        b += wt * ((c >> 16) & 255)
      }
      r /= d
      g /= d
      b /= d
      const mc = d > 0.5 ? (a00 >= a10 && a00 >= a01 && a00 >= a11 ? m00 : a10 >= a01 && a10 >= a11 ? m10 : a01 >= a11 ? m01 : m11) : m00
      // strata: soft bands go with the depth (humus, loam, gravel), they wave with the noise; deeper is darker and cooler
      let light = 1.1 - 0.26 * yFrac + 0.05 * low - 0.03
      if (mc === DIRT) {
        const band = Math.sin(yFrac * 38 + low * 5)
        light += 0.02 * band
        r *= 1 + 0.015 * band
        b *= 1 - 0.015 * band
        light += (hi - 0.5) * 0.025
      } else if (mc === SAND) {
        // loose sand: grains that glitter, ripples
        light += (hi - 0.5) * 0.05 + 0.02 * Math.sin(px * 0.35 + low * 8)
      } else if (mc === ROCK) {
        light -= 0.05
        light += (hi - 0.5) * 0.03
      } else if (mc === MUD) {
        light += (hi > 0.99 ? 0.15 : 0) - 0.05
      }
      // light on the edges: from the upper left; a lit top edge, a dark underside, an inner edge that is a little darker
      const edge = 1 - Math.min(1, Math.max(0, (d - 0.5) / 0.4))
      if (edge > 0.01) {
        const gy = dens(px, py + 3) - dens(px, py - 3)
        const gx = dens(px + 3, py) - dens(px - 3, py)
        // an edge that faces up or left is lit
        const lit = -(gy * 0.8 + gx * 0.45)
        light += edge * (lit > 0 ? 0.55 * lit : 0.7 * lit)
        light -= edge * 0.18
        if (mc === ROCK) light += edge * (lit > 0 ? 0.35 * lit : 0)
      }
      if (mc === DIRT || mc === SAND) {
        const mm = means[mc]
        if (mm) {
          r = mm[0] + (r - mm[0]) * 0.3
          g = mm[1] + (g - mm[1]) * 0.3
          b = mm[2] + (b - mm[2]) * 0.3
        }
      }
      const k = light
      r = Math.min(255, Math.max(0, r * k))
      g = Math.min(255, Math.max(0, g * k))
      b = Math.min(255, Math.max(0, b * k))
      terr32[o] = (Math.round(alpha * 255) << 24) | (Math.round(b) << 16) | (Math.round(g) << 8) | Math.round(r)
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
  // how deep the water is under the surface (the cells of water above, counted down a column)
  for (let x = Math.max(0, ux0 - 3); x <= Math.min(W - 1, ux1 + 3); x++) {
    let dd = 0
    for (let y = Math.max(0, uy0 - 3); y <= Math.min(H - 1, uy1 + 3); y++) {
      dd = m[y * W + x]! > 0.3 ? Math.min(60, dd + 1) : 0
      depth[y * W + x] = dd
    }
  }
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
      // shallow water is light and green-blue, deep water dark blue
      const dp = Math.min(1, depth[cj * W + ci]! / 22)
      let r = 70 - 52 * dp
      let g = 190 - 100 * dp
      let b = 235 - 60 * dp
      // thin water (a stream, a film) is bright and streaky
      if (d < 0.5) {
        const th = (0.5 - d) / 0.4
        r += 120 * th
        g += 60 * th
        b += 20 * th
      }
      // foam at the surface, a glassy shine below it, moving glints
      const foam = air * (d < 0.8 ? 1 - Math.max(0, (d - 0.4) / 0.4) : 0)
      const glint = air > 0.5 ? 0.5 + 0.5 * Math.sin(shimmer + px * 0.35 + py * 0.1) : 0
      const sheen = air > 0.5 && d >= 0.5 ? 0.25 * glint : 0
      const wh = Math.min(1, foam * 0.75 + sheen)
      r += (240 - r) * wh
      g += (250 - g) * wh
      b += (255 - b) * wh
      // a darker, bluer rim where the water touches the earth (the water is in the earth's shadow)
      const wall = d < 0.7 ? 0 : 0
      void wall
      water32[o] = (Math.round(alpha * 238) << 24) | (Math.round(Math.min(255, b)) << 16) | (Math.round(Math.min(255, g)) << 8) | Math.round(Math.min(255, r))
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
    else if (e.type === 'first') {
      if (hasRock() && !struck) strikeT = 0.0001
    } else if (e.type === 'goal') {
      play('fanfare')
      hud.won = true
      // a plant still waits: the water goes on for a few seconds, one may dig a branch to it
      if (plantsPending(w)) {
        tipText.value = t('app.bigGames.wasser.goalPending')
        tipShown.value = true
        window.clearTimeout(tipTimer)
        tipTimer = window.setTimeout(() => (tipShown.value = false), 9000)
      }
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

// ── the strike of Moses: the staff hits the rock, the cleft opens, then the water comes ─────────────────────────────────────
/** Seconds since the staff began to swing (0: not struck yet); the water waits for STRIKE seconds. */
let strikeT = 0
let struck = false
const SWING = 0.4
const STRIKE = 0.95
const hasRock = () => w.def.world === 0 && w.sources.some((s) => !s.cloud) && !!img['fels-zu'] && !!img['fels-auf']

// ── little things in the earth (pebbles, roots, a fossil, a shard): painted, put in at random, gone when the earth is dug away ──
interface Detail {
  x: number
  y: number
  n: number
  size: number
  rot: number
  cx: number
  cy: number
}
let details: Detail[] = []
function makeDetails() {
  details = []
  let seed = 0
  for (const ch of w.def.id) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
  for (let tries = 0; tries < 400 && details.length < 9; tries++) {
    const x = 6 + rnd() * (W - 12)
    const y = 30 + rnd() * (H - 38)
    const cx = Math.floor(x)
    const cy = Math.floor(y)
    // only deep inside earth or rock (not at an edge: all around is solid)
    let solid = true
    for (let dy = -4; dy <= 4 && solid; dy += 2) for (let dx = -4; dx <= 4; dx += 2) if (w.mat[(cy + dy) * W + cx + dx] === AIR || w.vmask[(cy + dy) * W + cx + dx]) solid = false
    const m = w.mat[cy * W + cx]
    if (!solid || (m !== DIRT && m !== ROCK && m !== SAND)) continue
    // never near a plant or the way of the tip
    const cxc = x / K
    const cyc = y / K
    if (w.plants.some((p) => Math.hypot(p.x - x, p.y - y) < 20)) continue
    if (tipStepsOf.some((st) => st.some((q) => Math.hypot(q[0] - cxc, q[1] - cyc) < 3.5))) continue
    const n = Math.floor(rnd() * 8) + 1
    details.push({ x, y, n, size: 2.4 + rnd() * 1.8, rot: (rnd() - 0.5) * 1.6, cx, cy })
  }
}

// ── starting a level ────────────────────────────────────────────────────────────────────────────────────────────────────────
function begin(i: number) {
  level.value = i
  w = newWorld(LEVELS[i]!)
  tipStepsOf = tipSteps(w.def)
  tipDraw = []
  tipExtra = 0
  lastTipIdx = -2
  strikeT = 0
  struck = false
  makeDetails()
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
  story.value = null
  if (!how.value) maybeStory()
  tipShown.value = false
  tipT = 0
  hintAfter = 0
  setProbe()
  if (!how.value && !story.value) hintOnce(w.def.intro)
}

function closeHow() {
  how.value = false
  markHowSeen(ID)
  if (screen.value === 'play') {
    if (maybeStory()) return
    paused.value = false
    hintOnce(w.def.intro)
  }
}

// ── the story of a world (what it is about, what the task is): shown at the first level of a world once, and from the banner of the list ──
const STORY_KEY = 'lk-wasser-story-v1'
const story = ref<{ world: number } | null>(null)
const storyTexts = computed(() => ((tm('app.bigGames.wasser.story') as unknown as { text: Parameters<typeof rt>[0]; task: Parameters<typeof rt>[0] }[]) ?? []).map((m) => ({ text: rt(m.text), task: rt(m.task) })))
function storySeen(wi: number): boolean {
  try {
    return (JSON.parse(localStorage.getItem(STORY_KEY) ?? '{}') as Record<string, boolean>)[String(wi)] === true
  } catch {
    return false
  }
}
function markStory(wi: number) {
  try {
    const all = JSON.parse(localStorage.getItem(STORY_KEY) ?? '{}') as Record<string, boolean>
    all[String(wi)] = true
    localStorage.setItem(STORY_KEY, JSON.stringify(all))
  } catch {
    // not remembered: the story comes again
  }
}
/** The first level of a world that was not seen yet tells the story first (the game waits). */
function maybeStory(): boolean {
  const wi = w.def.world
  if (level.value !== LEVELS.findIndex((l) => l.world === wi) || storySeen(wi)) return false
  story.value = { world: wi }
  paused.value = true
  return true
}
function openStory(wi: number) {
  story.value = { world: wi }
}
function closeStory() {
  if (story.value) markStory(story.value.world)
  story.value = null
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
function showTip(sec = 5) {
  // the next piece of the kept way that is not dug yet; a second press without progress adds the piece after it
  const idx = nextTipStep(w, tipStepsOf)
  if (idx < 0) {
    tipT = 0
    tipDraw = []
    tipText.value = t('app.bigGames.wasser.tipDone')
  } else {
    tipExtra = idx === lastTipIdx ? Math.min(tipExtra + 1, 3) : 0
    lastTipIdx = idx
    tipDraw = tipStepsOf.slice(idx, idx + 1 + tipExtra)
    tipT = sec
    tipText.value = t('app.bigGames.wasser.tipText')
  }
  tipShown.value = true
  window.clearTimeout(tipTimer)
  tipTimer = window.setTimeout(() => (tipShown.value = false), sec * 1000)
}
let tipTimer = 0
let tipStepsOf: Pt[][] = []
let tipDraw: Pt[][] = []
let tipExtra = 0
let lastTipIdx = -2
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

// ── the touch ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
let pressing = false
let lastP: { x: number; y: number } | null = null
let pointer: { x: number; y: number } | null = null

function cellPos(e: PointerEvent): { x: number; y: number } {
  const c = canvas.value!
  const r = c.getBoundingClientRect()
  // the size is measured again at every touch (a page that changed without a resize event would shift the finger)
  if (Math.abs(r.width - cvW) > 0.5 || Math.abs(r.height - cvH) > 0.5) resize()
  const kx = r.width > 0 ? cvW / r.width : 1
  const ky = r.height > 0 ? cvH / r.height : 1
  return { x: ((e.clientX - r.left) * kx - fx) / cell, y: ((e.clientY - r.top) * ky - fy) / cellY }
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
let sizeObserver: ResizeObserver | null = null
function resize() {
  const c = canvas.value
  if (!c) return
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  const box = c.getBoundingClientRect()
  cvW = box.width || window.innerWidth
  cvH = box.height || window.innerHeight
  c.width = Math.round(cvW * dpr)
  c.height = Math.round(cvH * dpr)
  // the field fills the screen: on a tall screen it is a little stretched upwards (the pictures keep their shape) and sits at the top, under it the bedrock
  const base = Math.min(cvW / W, cvH / H)
  cell = base
  cellY = base
  fx = (cvW - W * cell) / 2
  fy = (cvH - H * cellY) / 2
  if (base === cvW / W && cvH / H > base * 1.02) {
    cellY = Math.min(cvH / H, base * STRETCH)
    fy = 0
  }
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
  // the strike of Moses: the water waits until the cleft is open
  if (strikeT > 0 && strikeT < STRIKE) {
    strikeT += dt
    if (!struck && strikeT >= SWING) {
      struck = true
      play('hit')
      const s0 = w.sources.find((s) => !s.cloud)
      if (s0) for (let i = 0; i < 26; i++) spawn({ x: s0.x0 + K / 2 + (rand() - 0.5) * 8, y: s0.y0 + 6, vx: (rand() - 0.5) * 50, vy: -10 - rand() * 40, life: 0.5 + rand() * 0.5, r: 0.8 + rand() * 1.4, kind: i % 3 === 0 ? 'spark' : 'dust', color: i % 3 === 0 ? '#ffe9a0' : '#cdbb98' })
    }
    for (const p of parts) {
      p.t += dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vy += 60 * dt
    }
    return
  }
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
  // the field may be stretched upwards: the pictures keep their shape
  c.scale(1, cell / cellY)
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
  // under the field (on a tall screen) lies the bedrock
  const fieldBottom = fy + H * cellY
  if (fieldBottom < cvH - 1) {
    const rock = img[`fels-${wi + 1}`]
    if (rock) {
      c.save()
      c.beginPath()
      c.rect(fx, fieldBottom - 1, W * cell, cvH - fieldBottom + 1)
      c.clip()
      c.fillStyle = c.createPattern(rock, 'repeat') ?? '#555'
      c.translate(fx, fieldBottom)
      c.scale(cell * 0.45, cell * 0.45)
      c.fillRect(0, 0, (W * cell) / (cell * 0.45), (cvH - fieldBottom) / (cell * 0.45))
      c.restore()
    }
    const g = c.createLinearGradient(0, fieldBottom, 0, cvH)
    g.addColorStop(0, 'rgba(10,6,3,0.15)')
    g.addColorStop(1, 'rgba(10,6,3,0.8)')
    c.fillStyle = g
    c.fillRect(fx, fieldBottom, W * cell, cvH - fieldBottom)
  }
  c.save()
  c.beginPath()
  c.rect(fx, fy, W * cell, H * cellY)
  c.clip()
  c.setTransform(dpr * cell, 0, 0, dpr * cellY, dpr * fx, dpr * fy)
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

  // little things in the earth: only where the earth is still there
  for (const d of details) {
    if (w.mat[d.cy * W + d.cx] === AIR) continue
    const i = img[`detail-${d.n}`]
    if (!i) continue
    const h = d.size
    c.save()
    c.translate(d.x, d.y)
    c.scale(1, cell / cellY)
    c.rotate(d.rot)
    c.globalAlpha = 0.38
    c.drawImage(i, (-i.width / i.height) * h * 0.5, -h * 0.5, (i.width / i.height) * h, h)
    c.restore()
  }
  // the sources: the cloven rock of Moses, a spring rock, a cloud, and the stream that leaves them (right under them)
  const flowing = w.started && w.phase === 'play' && w.supplyLeft > 0 && !(strikeT > 0 && strikeT < STRIKE)
  for (const s of w.sources) {
    const cx = s.x0 + K / 2
    if (s.cloud) {
      const grow = 0.72 + 0.4 * Math.min(1, w.clock / 6)
      sprite(c, 'wolke', cx, s.y0 + 8 + Math.sin(time * 0.8) * 0.8, 20 * grow)
    } else if (hasRock()) {
      const open = strikeT >= SWING || w.started
      const shake = strikeT > SWING && strikeT < STRIKE ? Math.sin(strikeT * 90) * 0.5 : 0
      sprite(c, open ? 'fels-auf' : 'fels-zu', cx + shake, s.y0 + K + 1, 25)
      // the staff: leans beside the rock, swings over and hits it
      const i = img.stab
      if (i) {
        const t = strikeT <= 0 ? 0 : Math.min(1, strikeT / SWING)
        const ease = t * t * (3 - 2 * t)
        const ang = 1.3 - 1.65 * ease
        c.save()
        c.translate(cx + 10, s.y0 - 6)
        c.scale(1, cell / cellY)
        c.rotate(ang)
        c.globalAlpha = strikeT >= STRIKE ? Math.max(0, 1 - (strikeT - STRIKE) * 4) : 1
        const hh = 22
        c.drawImage(i, -((i.width / i.height) * hh) / 2, 0, (i.width / i.height) * hh, hh)
        c.restore()
      }
    } else {
      sprite(c, 'quelle', cx, s.y0 + K + 3, 14)
    }
    if (flowing && w.m[s.cells[0]!]! > 0.05) drawStream(c, s, cx, time)
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
    const h = p.thorn ? 15 : 16
    // a soft light halo behind the plant (the plants are the aims: they must catch the eye at once)
    const gl = c.createRadialGradient(p.x, p.y - h * 0.5, 1, p.x, p.y - h * 0.5, h * 0.85)
    const pulse = p.bloomed ? 0.3 : 0.45 + 0.15 * Math.sin(time * 3 + i)
    gl.addColorStop(0, p.bloomed ? `rgba(255,245,170,${pulse + 0.2})` : `rgba(255,250,225,${pulse + 0.25})`)
    gl.addColorStop(1, 'rgba(255,250,225,0)')
    c.fillStyle = gl
    c.beginPath()
    c.ellipse(p.x, p.y - h * 0.5, h * 0.85, h * 0.85 * (cell / cellY) * 1.05, 0, 0, Math.PI * 2)
    c.fill()
    c.save()
    c.shadowColor = 'rgba(255,252,230,0.95)'
    c.shadowBlur = 7 * dpr
    if (p.bloomed) {
      const k = Math.min(1, p.age / 0.5)
      const pop = 1 + 0.25 * Math.sin(k * Math.PI) * (1 - k)
      sprite(c, `${kind}-${t}-bluehend`, p.x, p.y, h * pop)
    } else sprite(c, `${kind}-${t}-durstig`, p.x, p.y, h, 0, p.drowned ? 0.45 : 1)
    c.restore()
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

/** The jet or the rain: a bright falling stream from the hole of the rock (or the underside of the cloud) down to where it lands, with a spray at the foot. */
function drawStream(c: CanvasRenderingContext2D, s: { x0: number; y0: number; cloud: boolean }, cx: number, time: number) {
  const top = s.cloud ? s.y0 + 9 : s.y0 + K - 1
  let y = Math.floor(top)
  const col = Math.floor(cx)
  while (y < H - 1 && w.mat[(y + 1) * W + col] === AIR && w.m[(y + 1) * W + col]! < 0.5) y++
  const wd = s.cloud ? 2.2 : 3
  const g = c.createLinearGradient(0, top, 0, y)
  g.addColorStop(0, 'rgba(190,230,255,0.85)')
  g.addColorStop(1, 'rgba(120,190,245,0.6)')
  c.fillStyle = g
  c.fillRect(cx - wd / 2, top, wd, Math.max(0, y - top))
  // bright streaks run down it
  c.fillStyle = 'rgba(255,255,255,0.75)'
  for (let k = 0; k < 4; k++) {
    const yy = top + (((time * 90 + k * 17) % 68) / 68) * Math.max(1, y - top)
    c.fillRect(cx - wd / 2 + (k % 2) * (wd / 2), yy, wd / 2.2, 3.5)
  }
  if (rand() < 0.5) spawn({ x: cx + (rand() - 0.5) * 3, y, vx: (rand() - 0.5) * 36, vy: -8 - rand() * 16, life: 0.4 + rand() * 0.3, r: 0.4 + rand() * 0.5, kind: 'drop', color: '#d8f0ff' })
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
  // a clear light edge around the vessel (it is the aim)
  let vy0 = H
  let vy1 = 0
  let vx0 = W
  let vx1 = 0
  for (const k of w.vcells) {
    const vx = k % W
    const vy = (k - vx) / W
    if (vx < vx0) vx0 = vx
    if (vx > vx1) vx1 = vx
    if (vy < vy0) vy0 = vy
    if (vy > vy1) vy1 = vy
  }
  c.save()
  c.shadowColor = 'rgba(255,250,215,0.95)'
  c.shadowBlur = 8 * dpr
  c.strokeStyle = 'rgba(255,248,215,0.9)'
  c.lineWidth = 1.1
  c.beginPath()
  c.roundRect(vx0 - 5, vy0 - 1.5, vx1 - vx0 + 11, vy1 - vy0 + 7, 3)
  c.stroke()
  c.restore()
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
  const head0 = time * 40
  let base = 0
  for (const pts of tipDraw) {
    const segs: number[] = []
    let len = 0
    for (let i = 1; i < pts.length; i++) {
      const l = Math.hypot((pts[i]![0] - pts[i - 1]![0]) * K, (pts[i]![1] - pts[i - 1]![1]) * K)
      segs.push(l)
      len += l
    }
    const head = head0 % (len + 20)
    // the dots glow golden and the one that travels is bigger
    for (let d = 0; d <= len; d += 4.5) {
      let rem = d
      let i = 0
      while (i < segs.length - 1 && rem > segs[i]!) {
        rem -= segs[i]!
        i++
      }
      const a = pts[i]!
      const b = pts[i + 1] ?? a
      const f = segs[i] ? Math.min(1, rem / segs[i]!) : 0
      const x = (a[0] + (b[0] - a[0]) * f) * K
      const y = (a[1] + (b[1] - a[1]) * f) * K
      const near = Math.abs(d - head)
      c.globalAlpha = near < 12 ? 1 : 0.7
      c.fillStyle = near < 12 ? '#fff6c8' : '#ffd86a'
      c.beginPath()
      c.arc(x, y, near < 12 ? 1.8 : 1.2, 0, Math.PI * 2)
      c.fill()
    }
    base += len
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
  window.visualViewport?.addEventListener('resize', resize)
  if (typeof ResizeObserver !== 'undefined' && canvas.value) {
    sizeObserver = new ResizeObserver(() => resize())
    sizeObserver.observe(canvas.value)
  }
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
  window.visualViewport?.removeEventListener('resize', resize)
  sizeObserver?.disconnect()
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
        GameIntroBox(
          :title="t('app.bigGames.wasser.title')"
          :label="t('app.bigGames.common.intro')"
          :story="t('app.bigGames.wasser.intro')"
        )
        div(v-for="(wt, wi) in worldTexts" :key="wi" class="wg-world")
          div(class="wg-banner" :data-test="'wasser-banner-' + wi" @click="openStory(wi)")
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
          div(class="wg-stars-live" :aria-label="t('app.bigGames.wasser.stars')")
            span(v-for="n in 3" :key="n" :class="['wg-star', { 'is-on': n <= starsLive }]") ★
        div(class="wg-hud-right")
          div(class="wg-jar" :aria-label="t('app.bigGames.wasser.jar')")
            img(:src="vesselSrc" alt="" class="wg-jar-base" @error="hideBroken")
            img(:src="vesselSrc" alt="" class="wg-jar-fill" :style="fillStyle" @error="hideBroken")
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

    //- the story of a world: what it is about and what the task is
    div(v-if="story && loaded" class="wg-menu wg-menu--dim")
      div(class="wg-card wg-story")
        div(class="wg-story-pic")
          img(:src="bannerSrc(story.world)" alt="" class="wg-banner-pic" @error="hideBroken")
        h2(class="wg-title") {{ worldTexts[story.world]?.name }}
        p(class="wg-world-ref wg-story-ref") {{ worldTexts[story.world]?.ref }}
        p(class="wg-story-text") {{ storyTexts[story.world]?.text }}
        p(class="wg-story-task")
          span(class="wg-story-label") {{ t('app.bigGames.wasser.taskLabel') }}
          |  {{ storyTexts[story.world]?.task }}
        AdvButton(data-test="wasser-story-go" @click="closeStory") {{ t('app.bigGames.wasser.go') }}

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
  font-size: 1.15rem
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
  flex-direction: row
  gap: 6px

.wg-btn
  width: 46px
  height: 46px
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
  gap: 2px
  padding: 3px 10px
  border-radius: 16px
  background: rgba(255, 250, 235, 0.86)
  font-weight: 800
  max-width: 40vw
  text-align: center

.wg-level-label
  font-size: 0.9rem
  line-height: 1.15

.wg-flowers
  display: flex
  gap: 4px
  min-height: 26px

.wg-flower
  height: 26px
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
  width: 50px
  height: 50px
  padding: 4px
  border-radius: 14px
  background: rgba(255, 250, 235, 0.86)

.wg-jar-base, .wg-jar-fill
  position: absolute
  left: 4px
  top: 4px
  width: 42px
  height: 42px
  object-fit: contain

.wg-jar-base
  filter: grayscale(1) brightness(0.55) contrast(0.9)

.wg-stars-live
  display: flex
  gap: 1px
  padding: 0

.wg-star
  font-size: 1rem
  line-height: 1
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
  gap: 20px

.wg-how-row
  display: flex
  align-items: center
  gap: 16px
  width: 100%

.wg-how-pic
  width: 56px
  height: 56px
  object-fit: contain
  flex: none

.wg-how-sign
  width: 56px
  flex: none
  font-size: 2.2rem
  text-align: center
  color: #f0a812

.wg-how-line
  margin: 0
  text-align: left
  font-size: 1.2rem
  font-weight: 700
  line-height: 1.3
.wg-banner
  cursor: pointer

.wg-story
  gap: 8px

.wg-story-pic
  position: relative
  width: 100%
  height: 120px
  border-radius: 16px
  overflow: hidden
  background: #4a3320

.wg-story-ref
  margin: -4px 0 0
  color: var(--lk-muted, #7a6b4f)

.wg-story-text
  margin: 0
  line-height: 1.45
  font-size: 1.15rem

.wg-story-task
  margin: 0
  line-height: 1.45
  font-size: 1.15rem
  padding: 8px 12px
  border-radius: 14px
  background: var(--lk-surface-2, #f6efdc)

.wg-story-label
  font-weight: 800
  color: #b87a10

@media (orientation: landscape) and (max-height: 520px)
  .wg-hud-left
    flex-direction: column
  .wg-hud
    padding-top: 6px

// short screens: the explanation card closer together
@media (max-height: 520px)
  .wg-how
    gap: 8px
  .wg-how-row
    gap: 12px
  .wg-how-pic
    width: 40px
    font-size: 1.5rem
    height: 40px
  .wg-how-sign
    width: 40px
    font-size: 1.5rem
  .wg-how-line
    font-size: 1.05rem
</style>
