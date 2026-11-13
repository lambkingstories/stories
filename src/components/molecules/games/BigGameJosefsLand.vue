<script setup lang="ts">
/**
 * "Josefs Land": the fourth big game, a farm game like Hay Day (rules in `utils/josefslandGame.ts`, content in `utils/josefslandData.ts`;
 * this file draws the land and takes the touch). The child plants fields and garden beds, harvests, makes bread and cloth in workshops,
 * keeps animals, fills the orders on the board and expands the land. Seven good years are followed by seven lean ones (Genesis 41): the
 * grain in the granary feeds the people. Nothing costs real money, nothing spoils, there is nothing to lose: times are points in time, so
 * a closed game simply goes on. The land is painted on one canvas (drag to move, pinch or wheel to zoom, swipe over plots to plant and harvest).
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
  ALL_PICTURES,
  ANIMAL_FILE,
  BUILDING_FILE,
  CROP_FILE,
  DIR,
  LATE_PICTURES,
  S as PX,
  animalPic,
  barnPic,
  buildingPic,
  decorPic,
  fallbackColor,
  fallbackSize,
  fieldPic,
  goodPic,
  granaryPic
} from '@/utils/josefslandArt'
import {
  ANIMALS,
  ANIMAL_IDS,
  BUILDINGS,
  BUILDING_IDS,
  CROPS,
  CROP_IDS,
  DECORS,
  DECOR_IDS,
  FAT_YEARS,
  CYCLE_YEARS,
  GOODS,
  GOOD_IDS,
  PARCELS,
  PARCEL_H,
  PARCEL_W,
  PEN_PLACES,
  PEN_SLOTS,
  RECIPES,
  RECIPE_IDS,
  RIVER_H,
  SPOT_BY_ID,
  STORES,
  WORLD_H,
  WORLD_W,
  leanNeed,
  levelCoins,
  orderSlots,
  xpToNext,
  LEVEL_MAX,
  type AnimalId,
  type BuildingId,
  type CropId,
  type DecorId,
  type GoodId,
  type ParcelDef,
  type RecipeId,
  type Spot,
  type StoreId
} from '@/utils/josefslandData'
import {
  ALBUM_ITEMS,
  CHAPTERS,
  GAME_ID,
  MAX_STARS,
  addXp,
  advanceYear,
  animalCount,
  animalPrice,
  animalReady,
  buyAnimal,
  buyParcel,
  build,
  canFill,
  capacity,
  chapterDone,
  chapterGoals,
  collectAnimal,
  collectJobs,
  currentChapter,
  dailyReward,
  drainEvents,
  enqueue,
  feed,
  fillOrder,
  goalProgress,
  harvest,
  harvestYield,
  jobSeconds,
  load as loadGame,
  newState,
  nextBuildingUpgrade,
  nextPenUpgrade,
  nextStoreUpgrade,
  penCapacity,
  persist,
  placeDecor,
  plant,
  plotPhase,
  plotProgress,
  plotStage,
  queueCap,
  readyJobs,
  readySummary,
  room,
  sell,
  skipOrder,
  starsOfChapter,
  stat,
  tick,
  unlocked,
  upgradeBuilding,
  upgradePen,
  upgradeStore,
  useSilt,
  yearView,
  clearDecor,
  type GameEvent,
  type GameState,
  type Order,
  type Reason,
  type Result
} from '@/utils/josefslandGame'

const emit = defineEmits<{ leave: [] }>()
const { t } = useI18n({ useScope: 'global' })
const T = (k: string, p?: Record<string, unknown>): string => t(`app.bigGames.josefsland.${k}`, p ?? {})
const { play } = useSfx()
const music = useMusic()
const progress = useBigGames()
const nowMs = (): number => Date.now()

// ── the pictures ────────────────────────────────────────────────────────────────────────────────────────────────────────────
const img: Record<string, HTMLImageElement | undefined> = {}
const loaded = ref(false)
const pic = (n: string) => prependBaseUrl(`${DIR}${n}.webp`)
const coinIcon = prependBaseUrl('images/abenteuer/ui/coin.webp')
const lockIcon = prependBaseUrl('images/abenteuer/ui/lock.webp')
const hideBroken = (e: Event) => {
  ;(e.target as HTMLElement).style.display = 'none'
}

let loadedCount = 0
function loadPictures(names: string[]): Promise<void> {
  return Promise.all(
    names
      .filter((n) => !img[n])
      .map(
        (n) =>
          new Promise<void>((resolve) => {
            const i = new Image()
            i.onload = () => {
              img[n] = i
              loadedCount++
              resolve()
            }
            i.onerror = () => resolve()
            i.src = pic(n)
          })
      )
  ).then(() => undefined)
}

/** The size of a picture in world units (a missing one has a fixed fallback). */
function sizeOf(name: string): [number, number] {
  const i = img[name]
  return i ? [i.width / PX, i.height / PX] : fallbackSize(name)
}

// ── the game and what the page shows ────────────────────────────────────────────────────────────────────────────────────────
/** The game is not reactive (it is read every picture); the page reads it again whenever `rev` changes. */
let G: GameState = newState(undefined, nowMs())
const rev = ref(0)
const refresh = () => {
  rev.value++
}
let dirty = false

const how = ref(false)
const intro = ref(true)
const panel = ref<null | { kind: 'board' | 'store' | 'land' | 'goals' | 'seed' | 'build' | 'pen' | 'parcel' | 'decor' | 'year'; ref?: string }>(null)
const goalsTab = ref<'chapters' | 'daily' | 'album'>('chapters')
const goalTabs: Array<'chapters' | 'daily' | 'album'> = ['chapters', 'daily', 'album']
const setTab = (k: 'chapters' | 'daily' | 'album') => {
  goalsTab.value = k
}
const seed = ref<CropId | null>(null)
const modals = ref<Array<{ kind: 'level' | 'lean' | 'fat' | 'chapter'; data: Record<string, unknown> }>>([])
const toasts = ref<Array<{ id: number; text: string; icon?: string; tone?: 'gold' | 'good' | 'bad' }>>([])
const plotInfo = ref<null | { id: string; until: number }>(null)
const tip = ref('')
let toastId = 0

const view = computed(() => {
  void rev.value
  const y = yearView(G)
  const need = xpToNext(G.level)
  return {
    coins: G.coins,
    level: G.level,
    xpShare: G.level >= LEVEL_MAX ? 1 : G.xp / need,
    xp: G.xp,
    xpNeed: need,
    year: y,
    fillable: G.orders.filter((o) => o && canFill(G, o)).length,
    stars: G.chapterStars.reduce((a, b) => a + b, 0),
    barnUsed: GOOD_IDS.filter((g) => GOODS[g].store === 'barn').reduce((n, g) => n + G.inv[g], 0),
    granaryUsed: GOOD_IDS.filter((g) => GOODS[g].store === 'granary').reduce((n, g) => n + G.inv[g], 0),
    silt: G.inv.silt
  }
})
const T0 = performance.now()
/** A time that moves on while the page is open (the page reads times of the game, which are points in time). */
const clockTick = ref(0)
const tNow = () => nowMs() + 0 * clockTick.value

function toast(text: string, icon?: string, tone: 'gold' | 'good' | 'bad' = 'gold') {
  const id = ++toastId
  toasts.value.push({ id, text, icon, tone })
  if (toasts.value.length > 4) toasts.value.shift()
  window.setTimeout(() => (toasts.value = toasts.value.filter((x) => x.id !== id)), 3600)
}
const goodName = (g: GoodId) => T(`good.${g}`)
const iconUrl = (name: string) => pic(name)
const goodIcon = (g: GoodId) => pic(goodPic(g))
const showHint = (r: Result, extra?: Record<string, unknown>) => {
  if (r.ok) return
  const reason: Reason = r.reason ?? 'none'
  play('wrong', 0.35)
  toast(T(`hint.${reason}`, extra), undefined, 'bad')
}

/** The name of a piece of land (a pen is named after its animal). */
function roleName(p: { role: string; animal?: string }): string {
  return p.role === 'pen' && p.animal ? T(`penName.${p.animal}`) : T(`role.${p.role}`)
}

// ── time texts ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
function timeText(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000))
  if (s < 60) return `${s} ${T('sec')}`
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')} ${T('min')}`
}

// ── the canvas, the camera ──────────────────────────────────────────────────────────────────────────────────────────────────
const canvas = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let raf = 0
let last = 0
let dpr = 1
let W = 800
let H = 600
const cam = { x: PARCEL_W * 1.5, y: RIVER_H + PARCEL_H, z: 0.9 }
const MARGIN = 40
/** How far the ground reaches above the land (a soft edge that runs into the painted view). */
const TERRAIN_TOP = 60
const ZOOM_MAX = 1.7
let zoomMin = 0.45
let clock = 0
let sinceSlow = 0
let sinceSave = 0
let sinceHud = 0
let ended = false

function clampCam() {
  // zoomed out as far as the land fills the screen (no empty edge)
  zoomMin = Math.max(0.35, Math.min(1.2, Math.max(W / (WORLD_W + 2 * MARGIN), H / (WORLD_H + 190))))
  cam.z = Math.max(zoomMin, Math.min(ZOOM_MAX, cam.z))
  const hw = W / 2 / cam.z
  const hh = H / 2 / cam.z
  const x0 = -MARGIN + hw
  const x1 = WORLD_W + MARGIN - hw
  cam.x = x0 > x1 ? WORLD_W / 2 : Math.max(x0, Math.min(x1, cam.x))
  const y0 = -330 + hh
  const y1 = WORLD_H + 30 - hh
  cam.y = y0 > y1 ? (y0 + y1) / 2 : Math.max(y0, Math.min(y1, cam.y))
}
const toWorld = (sx: number, sy: number): [number, number] => [(sx - W / 2) / cam.z + cam.x, (sy - H / 2) / cam.z + cam.y]
const toScreen = (wx: number, wy: number): [number, number] => [(wx - cam.x) * cam.z + W / 2, (wy - cam.y) * cam.z + H / 2]

function resize() {
  const c = canvas.value
  if (!c) return
  dpr = Math.min(2, window.devicePixelRatio || 1)
  W = c.clientWidth || 800
  H = c.clientHeight || 600
  c.width = Math.round(W * dpr)
  c.height = Math.round(H * dpr)
  clampCam()
}

function zoomAt(sx: number, sy: number, factor: number) {
  const [wx, wy] = toWorld(sx, sy)
  cam.z = Math.max(zoomMin, Math.min(ZOOM_MAX, cam.z * factor))
  // the point under the finger stays where it is
  cam.x = wx - (sx - W / 2) / cam.z
  cam.y = wy - (sy - H / 2) / cam.z
  clampCam()
}
const zoomBy = (f: number) => zoomAt(W / 2, H / 2, f)

function goTo(parcelId: number) {
  const p = PARCELS[parcelId]
  if (!p) return
  cam.x = p.col * PARCEL_W + PARCEL_W / 2
  cam.y = RIVER_H + p.row * PARCEL_H + PARCEL_H / 2
  cam.z = Math.max(cam.z, Math.min(1, zoomMin * 1.6))
  clampCam()
  panel.value = null
}

/** The first view: the land the child starts with (fields above, the farm yard below). */
function homeView() {
  const ps = G.parcels.map((id) => PARCELS[id]!).filter(Boolean)
  const x0 = Math.min(...ps.map((p) => p.col)) * PARCEL_W
  const x1 = (Math.max(...ps.map((p) => p.col)) + 1) * PARCEL_W
  const y0 = RIVER_H + Math.min(...ps.map((p) => p.row)) * PARCEL_H
  const y1 = RIVER_H + (Math.max(...ps.map((p) => p.row)) + 1) * PARCEL_H
  const fit = Math.min(W / (x1 - x0 + 30), H / (y1 - y0 + 150))
  cam.z = Math.min(1, Math.max(0.4, fit * 0.9))
  cam.x = (x0 + x1) / 2
  // a little of the painted Nile is seen above the land
  cam.y = (y0 + y1) / 2 - 20 / cam.z
  clampCam()
}

// ── the terrain (drawn once for the land that is open, then copied every picture) ───────────────────────────────────────────
let terrain: HTMLCanvasElement | null = null
let terrainKey = ''

function fillTile(x: CanvasRenderingContext2D, name: string, fallback: string, rx: number, ry: number, rw: number, rh: number, scale = 0.5) {
  const im = img[name]
  x.save()
  if (im) {
    x.scale(scale, scale)
    x.fillStyle = x.createPattern(im, 'repeat') ?? fallback
    x.fillRect(rx / scale, ry / scale, rw / scale, rh / scale)
  } else {
    x.fillStyle = fallback
    x.fillRect(rx, ry, rw, rh)
  }
  x.restore()
}

function roundRect(x: CanvasRenderingContext2D, rx: number, ry: number, rw: number, rh: number, r: number) {
  x.beginPath()
  x.moveTo(rx + r, ry)
  x.arcTo(rx + rw, ry, rx + rw, ry + rh, r)
  x.arcTo(rx + rw, ry + rh, rx, ry + rh, r)
  x.arcTo(rx, ry + rh, rx, ry, r)
  x.arcTo(rx, ry, rx + rw, ry, r)
  x.closePath()
}

/** A piece of ground with a soft edge: the same shape laid several times with growing insets and a little see-through each. */
function softGround(x: CanvasRenderingContext2D, tile: string, fallback: string, rx: number, ry: number, rw: number, rh: number, radius: number, soft = 16, steps = 6) {
  for (let i = 0; i < steps; i++) {
    const inset = (soft * (steps - 1 - i)) / (steps - 1) * 0 + (soft * (steps - 1 - i)) / steps
    x.save()
    roundRect(x, rx + (soft - inset), ry + (soft - inset), rw - 2 * (soft - inset), rh - 2 * (soft - inset), Math.max(4, radius - (soft - inset)))
    x.clip()
    x.globalAlpha = 0.5
    fillTile(x, tile, fallback, rx, ry, rw, rh)
    x.restore()
  }
}

function buildTerrain() {
  const key = `${G.parcels.length}|${G.parcels.reduce((a, b) => a + b * 7, 0)}|${loadedCount}`
  if (terrain && key === terrainKey) return
  terrainKey = key
  const c = terrain ?? document.createElement('canvas')
  c.width = WORLD_W + 2 * MARGIN
  c.height = WORLD_H + MARGIN + TERRAIN_TOP
  terrain = c
  const x = c.getContext('2d')
  if (!x) return
  x.clearRect(0, 0, c.width, c.height)
  x.save()
  x.translate(MARGIN, TERRAIN_TOP)
  // the sand of the whole land
  fillTile(x, 'kachel-sand', '#e6cd96', -MARGIN, -TERRAIN_TOP, WORLD_W + 2 * MARGIN, WORLD_H + MARGIN + TERRAIN_TOP)
  // the bank of the Nile at the top: a meadow that runs into the painted bank behind it
  softGround(x, 'kachel-wiese', '#7da244', -MARGIN, -TERRAIN_TOP, WORLD_W + 2 * MARGIN, RIVER_H + TERRAIN_TOP - 10, 30, 36, 7)
  for (const p of PARCELS) {
    if (!G.parcels.includes(p.id)) continue
    const rx = p.col * PARCEL_W + 4
    const ry = RIVER_H + p.row * PARCEL_H + 4
    const rw = PARCEL_W - 8
    const rh = PARCEL_H - 8
    if (p.role === 'yard') {
      softGround(x, 'kachel-weg', '#c8a472', rx, ry, rw, rh, 26, 18)
      softGround(x, 'kachel-pflaster', '#d9c9a0', rx + 60, ry + 196, rw - 120, 84, 24, 16)
    } else if (p.role === 'works' || p.role === 'works2') {
      softGround(x, 'kachel-weg', '#c8a472', rx, ry, rw, rh, 26, 18)
      softGround(x, 'kachel-pflaster', '#d9c9a0', rx + 14, ry + 14, rw - 28, rh - 28, 20, 14)
    } else if (p.role === 'pen') {
      softGround(x, 'kachel-weg', '#c8a472', rx, ry, rw, rh, 26, 18)
    } else {
      softGround(x, 'kachel-wiese', '#7da244', rx, ry, rw, rh, 26, 18)
    }
    if (p.role === 'pen') {
      const sp = p.spots.find((s) => s.kind === 'pen')!
      const im = img['leer-stroh']
      const px = sp.x - 150
      const py = sp.y - 170
      if (im) x.drawImage(im, px, py, 300, 172)
      else {
        x.fillStyle = '#d9b865'
        roundRect(x, px, py, 300, 172, 20)
        x.fill()
      }
    }
  }
  x.restore()
  // the top edge fades into the painted backdrop
  x.save()
  x.globalCompositeOperation = 'destination-out'
  const g = x.createLinearGradient(0, 0, 0, 100)
  g.addColorStop(0, 'rgba(0,0,0,1)')
  g.addColorStop(1, 'rgba(0,0,0,0)')
  x.fillStyle = g
  x.fillRect(0, 0, c.width, 100)
  x.restore()
}

// ── what is drawn: pieces that are sorted by their foot line ────────────────────────────────────────────────────────────────
interface Box {
  x0: number
  y0: number
  x1: number
  y1: number
  prio: number
  kind: 'plot' | 'bed' | 'building' | 'barn' | 'granary' | 'board' | 'pen' | 'decor' | 'animal' | 'parcel' | 'slot'
  id: string
  ref?: string
  slot?: number
}
interface Item {
  y: number
  fn: () => void
}
interface Bubble {
  x: number
  y: number
  icon: string
  ring?: boolean
  badge?: string
}
const items: Item[] = []
const boxes: Box[] = []
const bubbles: Bubble[] = []

function sprite(name: string, x: number, y: number, opts?: { alpha?: number; sway?: number; flip?: boolean; wobble?: number; scale?: number }) {
  if (!ctx) return
  const [w0, h0] = sizeOf(name)
  const sc = opts?.scale ?? 1
  const w = w0 * sc
  const h = h0 * sc
  const im = img[name]
  ctx.save()
  if (opts?.alpha !== undefined) ctx.globalAlpha = opts.alpha
  ctx.translate(x, y)
  if (opts?.sway) ctx.transform(1, 0, opts.sway, 1, 0, 0)
  if (opts?.wobble) ctx.scale(1 + opts.wobble, 1 - opts.wobble)
  if (opts?.flip) ctx.scale(-1, 1)
  if (im) ctx.drawImage(im, -w / 2, -h, w, h)
  else {
    ctx.fillStyle = fallbackColor(name)
    roundRect(ctx, -w / 2, -h, w, h, 10)
    ctx.fill()
  }
  ctx.restore()
}

function groundShadow(x: number, y: number, w: number, h = 8) {
  if (!ctx) return
  ctx.save()
  ctx.fillStyle = 'rgba(60, 40, 10, 0.16)'
  ctx.beginPath()
  ctx.ellipse(x, y - 1, w / 2, h / 2, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawTag(x: number, y: number, text: string, icon?: string, tone: 'cost' | 'lock' = 'cost') {
  if (!ctx) return
  ctx.save()
  ctx.font = '700 15px system-ui, -apple-system, sans-serif'
  const tw = ctx.measureText(text).width
  const iw = icon ? 18 : 0
  const w = tw + iw + 20
  const h = 26
  ctx.fillStyle = tone === 'lock' ? 'rgba(60,45,30,0.82)' : 'rgba(255,250,236,0.94)'
  roundRect(ctx, x - w / 2, y - h / 2, w, h, 13)
  ctx.fill()
  ctx.strokeStyle = tone === 'lock' ? 'rgba(255,255,255,0.25)' : 'rgba(150,110,40,0.55)'
  ctx.lineWidth = 1.5
  ctx.stroke()
  const ic = icon ? img[icon] ?? (icon === 'coin' ? coinImg : icon === 'lock' ? lockImg : undefined) : undefined
  let cx = x - w / 2 + 10
  if (icon) {
    if (ic) ctx.drawImage(ic, cx, y - 9, 18, 18)
    cx += 22
  }
  ctx.fillStyle = tone === 'lock' ? '#fff6dc' : '#5a3d14'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, cx, y + 1)
  ctx.restore()
}
let coinImg: HTMLImageElement | undefined
let lockImg: HTMLImageElement | undefined

function bar(x: number, y: number, w: number, share: number, color = '#f2b93b') {
  if (!ctx) return
  ctx.save()
  ctx.fillStyle = 'rgba(40,28,10,0.5)'
  roundRect(ctx, x - w / 2, y, w, 7, 3.5)
  ctx.fill()
  ctx.fillStyle = color
  roundRect(ctx, x - w / 2 + 1, y + 1, Math.max(3, (w - 2) * share), 5, 2.5)
  ctx.fill()
  ctx.restore()
}

function addBox(b: Box) {
  boxes.push(b)
}

const PLOT_HIT_W = 120
function addSpot(sp: Spot, now: number) {
  const x = sp.x
  const y = sp.y
  if (sp.kind === 'plot' || sp.kind === 'bed') {
    const ph = plotPhase(G, sp.id, now)
    const p = G.plots[sp.id]
    const name = ph === 'empty' || !p?.crop ? (sp.kind === 'plot' ? 'leer-trocken' : 'leer-beet') : fieldPic(p.crop, plotStage(G, sp.id, now))
    const [, h] = sizeOf(name)
    items.push({
      y,
      fn: () => {
        const sway = ph === 'ripe' ? Math.sin(clock * 1.7 + x * 0.05) * 0.012 : ph === 'growing' ? Math.sin(clock * 1.2 + x * 0.05) * 0.005 : 0
        sprite(name, x, y, { sway })
        if (ph === 'growing' && cam.z > 0.6) bar(x, y + 2, 50, plotProgress(G, sp.id, now), '#7bbf4f')
      }
    })
    if (ph === 'ripe' && p?.crop) bubbles.push({ x, y: y - Math.min(h, 90) - 4, icon: goodPic(p.crop), ring: true })
    addBox({ x0: x - PLOT_HIT_W / 2, y0: y - 80, x1: x + PLOT_HIT_W / 2, y1: y, prio: 2, kind: sp.kind, id: sp.id })
    return
  }
  if (sp.kind === 'barn' || sp.kind === 'granary') {
    const name = sp.kind === 'barn' ? barnPic(G.barn) : granaryPic(G.granary)
    const [w, h] = sizeOf(name)
    items.push({
      y,
      fn: () => {
        groundShadow(x, y, w * 0.8, 12)
        sprite(name, x, y)
      }
    })
    const store: StoreId = sp.kind
    const full = (store === 'barn' ? view.value.barnUsed : view.value.granaryUsed) >= capacity(G, store)
    if (full) bubbles.push({ x: x + w * 0.3, y: y - h * 0.85, icon: 'z-truhe', badge: '!' })
    addBox({ x0: x - w / 2, y0: y - h, x1: x + w / 2, y1: y, prio: 2, kind: sp.kind, id: sp.id })
    return
  }
  if (sp.kind === 'board') {
    const [w, h] = sizeOf('brett')
    items.push({ y, fn: () => sprite('brett', x, y) })
    const n = view.value.fillable
    if (n > 0) bubbles.push({ x: x + w * 0.35, y: y - h - 2, icon: 'z-rolle', badge: String(n) })
    addBox({ x0: x - w / 2 - 6, y0: y - h, x1: x + w / 2 + 6, y1: y, prio: 2, kind: 'board', id: sp.id })
    return
  }
  if (sp.kind === 'building') {
    const b = sp.ref as BuildingId
    const bs = G.buildings[b]
    const def = BUILDINGS[b]
    const name = buildingPic(b, bs.level)
    const [w, h] = sizeOf(name)
    const levelOk = G.level >= def.level
    items.push({
      y,
      fn: () => {
        if (bs.built) {
          groundShadow(x, y, w * 0.8, 12)
          sprite(name, x, y)
          const q = bs.queue
          if (q.length) {
            const first = q[0]!
            const total = jobSeconds(G, first.recipe) * 1000
            const left = Math.max(0, first.doneAt - now)
            if (left > 0 && cam.z > 0.6) bar(x, y + 2, 56, 1 - left / total)
          }
        } else {
          sprite(name, x, y, { alpha: levelOk ? 0.42 : 0.2 })
          drawTag(x, y - h * 0.45, levelOk ? String(def.cost) : T('levelShort', { n: def.level }), levelOk ? 'coin' : 'lock', levelOk ? 'cost' : 'lock')
        }
      }
    })
    if (bs.built) {
      const ready = readyJobs(G, b, now)
      if (ready > 0) bubbles.push({ x: x + w * 0.28, y: y - h - 2, icon: goodPic(bs.queue[0]!.recipe as GoodId), ring: true, badge: ready > 1 ? String(ready) : undefined })
    }
    addBox({ x0: x - w / 2, y0: y - h, x1: x + w / 2, y1: y, prio: 2, kind: 'building', id: sp.id, ref: b })
    return
  }
  if (sp.kind === 'pen') {
    const a = sp.ref as AnimalId
    const pen = G.pens[a]
    const cap = penCapacity(G, a)
    const ox = x - 190
    const oy = y - 270
    // the fence: two pieces at the back, two at the front with the gate in the middle, posts at the sides
    const fy = oy + 112
    for (const fx of [ox + 90, ox + 190, ox + 290]) items.push({ y: fy, fn: () => sprite('zaun', fx, fy) })
    items.push({ y: y + 2, fn: () => sprite('zaun', ox + 88, y + 2) })
    items.push({ y: y + 2, fn: () => sprite('tor', ox + 190, y + 2) })
    items.push({ y: y + 2, fn: () => sprite('zaun', ox + 292, y + 2) })
    for (const px of [ox + 36, ox + 344]) items.push({ y: oy + 205, fn: () => sprite('pfosten', px, oy + 205) })
    items.push({ y: oy + 150, fn: () => sprite('futtertrog', ox + 190, oy + 150) })
    items.push({ y: oy + 190, fn: () => sprite('wassertrog', ox + 190, oy + 190) })
    items.push({ y: oy + 154, fn: () => sprite('heu', ox + 64, oy + 154) })
    addBox({ x0: ox + 36, y0: oy + 80, x1: ox + 344, y1: y + 4, prio: 1, kind: 'pen', id: sp.id, ref: a })
    for (let i = 0; i < cap; i++) {
      const [dx, dy] = PEN_PLACES[i]!
      const ax = x + dx
      const ay = y + dy
      const slot = pen.slots[i]
      if (!slot) {
        if (G.level >= ANIMALS[a].level) {
          items.push({
            y: ay,
            fn: () => {
              if (!ctx) return
              ctx.save()
              ctx.globalAlpha = 0.5 + 0.2 * Math.sin(clock * 3 + i)
              ctx.fillStyle = 'rgba(255,250,236,0.85)'
              ctx.beginPath()
              ctx.arc(ax, ay - 22, 17, 0, Math.PI * 2)
              ctx.fill()
              ctx.fillStyle = '#7a5410'
              ctx.font = '800 24px system-ui, sans-serif'
              ctx.textAlign = 'center'
              ctx.textBaseline = 'middle'
              ctx.fillText('+', ax, ay - 21)
              ctx.restore()
            }
          })
          addBox({ x0: ax - 30, y0: ay - 50, x1: ax + 30, y1: ay, prio: 3, kind: 'slot', id: sp.id, ref: a, slot: i })
        }
        continue
      }
      const hungry = slot.readyAt === 0
      const ready = animalReady(G, a, i, now)
      const grazing = !hungry && !ready
      const eating = grazing && Math.floor(clock / 2.4 + i * 0.7) % 2 === 0
      const flip = i % 2 === 1
      const name = animalPic(a, eating)
      const [aw, ah] = sizeOf(name)
      items.push({
        y: ay,
        fn: () => {
          groundShadow(ax, ay, aw * 0.8, 9)
          const hop = ready ? Math.abs(Math.sin(clock * 5 + i)) * 3 : 0
          const wob = hungry ? Math.sin(clock * 2 + i * 2) * 0.012 : eating ? Math.sin(clock * 5 + i) * 0.01 : 0
          sprite(name, ax, ay - hop, { flip, wobble: wob })
          if (grazing && cam.z > 0.6) bar(ax, ay + 2, 40, 1 - Math.max(0, slot.readyAt - now) / (ANIMALS[a].time * 1000), '#7bbf4f')
        }
      })
      if (hungry) bubbles.push({ x: ax + (flip ? -10 : 10), y: ay - ah - 6, icon: goodPic(ANIMALS[a].feed) })
      else if (ready) bubbles.push({ x: ax + (flip ? -10 : 10), y: ay - ah - 6, icon: goodPic(ANIMALS[a].product), ring: true })
      addBox({ x0: ax - aw / 2, y0: ay - ah, x1: ax + aw / 2, y1: ay, prio: 3, kind: 'animal', id: sp.id, ref: a, slot: i })
    }
    return
  }
  if (sp.kind === 'decor') {
    const d = G.decor[sp.id]
    if (d) {
      const name = decorPic(d)
      const [w, h] = sizeOf(name)
      items.push({
        y,
        fn: () => {
          groundShadow(x, y, w * 0.7, 10)
          sprite(name, x, y, { sway: d === 'palm' || d === 'youngpalm' || d === 'fig' || d === 'papyrus' ? Math.sin(clock * 1.1 + x * 0.03) * 0.012 : 0 })
        }
      })
      addBox({ x0: x - w / 2, y0: y - h, x1: x + w / 2, y1: y, prio: 1, kind: 'decor', id: sp.id })
    } else {
      items.push({
        y,
        fn: () => {
          if (!ctx) return
          ctx.save()
          ctx.globalAlpha = 0.32
          ctx.strokeStyle = '#6b4a14'
          ctx.setLineDash([4, 5])
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.ellipse(x, y - 8, 22, 11, 0, 0, Math.PI * 2)
          ctx.stroke()
          ctx.restore()
        }
      })
      addBox({ x0: x - 28, y0: y - 30, x1: x + 28, y1: y + 6, prio: 0.5, kind: 'decor', id: sp.id })
    }
  }
}

// little people and the caravan that walk about (only to look at)
interface Walker {
  pic: string
  y: number
  x: number
  v: number
  from: number
  to: number
}
const walkers: Walker[] = [
  { pic: 'figur-0', y: RIVER_H + 6, x: 300, v: 14, from: 120, to: 900 },
  { pic: 'figur-1', y: RIVER_H + 20, x: 1100, v: -11, from: 700, to: 1400 },
  { pic: 'figur-2', y: RIVER_H + 298, x: 600, v: 9, from: 480, to: 800 },
  { pic: 'figur-3', y: RIVER_H + 14, x: 520, v: 7, from: 380, to: 700 }
]
const caravan = { x: -400, y: 30, active: false, timer: 18 }
/** The messenger of the palace walks to the board when a special order has come (Pharaoh's dream, the brothers). */
const messenger = { active: false, x: 0, y: 0, tx: 0, wait: 0 }
function sendMessenger() {
  const board = SPOT_BY_ID['p5-board']
  if (!board) return
  messenger.active = true
  messenger.x = board.x - 330
  messenger.y = board.y + 4
  messenger.tx = board.x - 52
  messenger.wait = 0
}
/** Things that always stand at the bank of the Nile (only to look at). */
const SCENERY: Array<{ pic: string; x: number; y: number }> = [
  { pic: 'brunnen', x: 1400, y: RIVER_H + 2 },
  { pic: 'brunnen', x: 130, y: RIVER_H - 6 }
]

function drawWalkers(dt: number) {
  for (const sc of SCENERY) {
    if (img[sc.pic]) items.push({ y: sc.y, fn: () => sprite(sc.pic, sc.x, sc.y) })
  }
  for (const w of walkers) {
    if (!img[w.pic]) continue
    w.x += w.v * dt
    if (w.x > w.to) w.v = -Math.abs(w.v)
    if (w.x < w.from) w.v = Math.abs(w.v)
    const bob = Math.abs(Math.sin(clock * 6 + w.x * 0.1)) * 2.2
    items.push({ y: w.y, fn: () => sprite(w.pic, w.x, w.y - bob, { flip: w.v < 0 }) })
  }
  if (messenger.active && img['figur-1']) {
    if (messenger.x < messenger.tx) messenger.x += 70 * dt
    else {
      messenger.wait += dt
      if (messenger.wait > 3.5) messenger.active = false
    }
    const walking = messenger.x < messenger.tx
    const bob = walking ? Math.abs(Math.sin(clock * 9)) * 2.5 : 0
    items.push({ y: messenger.y, fn: () => sprite('figur-1', messenger.x, messenger.y - bob) })
    bubbles.push({ x: messenger.x, y: messenger.y - 76, icon: 'z-siegel', ring: true })
  }
  if (!img.karawane) return
  caravan.timer -= dt
  if (!caravan.active && caravan.timer <= 0) {
    caravan.active = true
    caravan.x = -380
    play('caravan', 0.35)
  }
  if (caravan.active) {
    caravan.x += 26 * dt
    if (caravan.x > WORLD_W + 380) {
      caravan.active = false
      caravan.timer = 60 + Math.random() * 60
    }
    const cy = 52
    items.push({ y: cy, fn: () => sprite('karawane', caravan.x, cy + Math.abs(Math.sin(clock * 3)) * 1.5, { scale: 0.55 }) })
  }
}

// ── particles and flying goods ──────────────────────────────────────────────────────────────────────────────────────────────
interface Spark {
  x: number
  y: number
  vx: number
  vy: number
  t: number
  life: number
  r: number
  c: string
}
const sparks: Spark[] = []
function burst(x: number, y: number, color = '#ffd35a', n = 8) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2
    const v = 30 + Math.random() * 60
    sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, t: 0, life: 0.5 + Math.random() * 0.4, r: 2 + Math.random() * 3, c: color })
  }
  if (sparks.length > 160) sparks.splice(0, sparks.length - 160)
}
interface Fly {
  name: string
  sx: number
  sy: number
  tx: number
  ty: number
  t: number
  dur: number
  label?: string
}
const flies: Fly[] = []
const storeBtn = ref<HTMLElement | null>(null)
const ordersBtn = ref<HTMLElement | null>(null)
const coinBox = ref<HTMLElement | null>(null)
function targetOf(el: HTMLElement | null): [number, number] {
  const c = canvas.value
  if (!el || !c) return [W / 2, H - 40]
  const r = el.getBoundingClientRect()
  const cr = c.getBoundingClientRect()
  return [r.left - cr.left + r.width / 2, r.top - cr.top + r.height / 2]
}
function flyGood(good: string, wx: number, wy: number, n: number, to: 'store' | 'orders' | 'coins' = 'store', label?: string) {
  const [sx, sy] = toScreen(wx, wy)
  const [tx, ty] = targetOf(to === 'store' ? storeBtn.value : to === 'orders' ? ordersBtn.value : coinBox.value)
  for (let i = 0; i < Math.min(3, n); i++) flies.push({ name: good, sx: sx + (i - 1) * 14, sy: sy - i * 6, tx, ty, t: -i * 0.09, dur: 0.75, label: i === 0 ? label : undefined })
}

/** Wind that blows soft sand across the land now and then (only for looking at). */
interface Puff {
  x: number
  y: number
  r: number
  v: number
  t: number
  life: number
}
const puffs: Puff[] = []
let puffTimer = 6
function stepPuffs(dt: number) {
  puffTimer -= dt
  if (puffTimer <= 0) {
    puffTimer = 8 + Math.random() * 10
    const y = RIVER_H + 80 + Math.random() * (WORLD_H - RIVER_H - 160)
    const x = Math.random() * WORLD_W * 0.6
    for (let i = 0; i < 7; i++) puffs.push({ x: x + i * 26, y: y + Math.sin(i) * 12, r: 26 + Math.random() * 22, v: 55 + Math.random() * 25, t: -i * 0.15, life: 3.4 })
  }
  for (let i = puffs.length - 1; i >= 0; i--) {
    const p = puffs[i]!
    p.t += dt
    if (p.t > 0) {
      p.x += p.v * dt
      p.y -= 6 * dt
    }
    if (p.t >= p.life) puffs.splice(i, 1)
  }
}
function drawPuffs() {
  if (!ctx) return
  for (const p of puffs) {
    if (p.t <= 0) continue
    const k = p.t / p.life
    const a = Math.sin(k * Math.PI) * 0.22
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * (0.7 + k))
    g.addColorStop(0, `rgba(236,214,160,${a})`)
    g.addColorStop(1, 'rgba(236,214,160,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r * (0.7 + k), 0, Math.PI * 2)
    ctx.fill()
  }
}

interface Floater {
  text: string
  x: number
  y: number
  t: number
  color: string
}
const floaters: Floater[] = []
function floatText(text: string, wx: number, wy: number, color = '#fff4c8') {
  floaters.push({ text, x: wx, y: wy, t: 0, color })
  if (floaters.length > 8) floaters.shift()
}

// ── drawing ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
/** The painted view: this share of its height is scenery (the rest is empty ground under the land), and that edge lies at this height of the world. */
const BAND_CONTENT = 0.61
const BAND_ANCHOR = 30

function drawBackdrop() {
  if (!ctx) return
  // the view grows greener with the level and with the land (from level 6 to 16)
  const lush = Math.min(1, Math.max(0, (Math.max(G.level, G.parcels.length * 2 + 2) - 6) / 10))
  const a = img['fern-1']
  const b = img['fern-2']
  // the sky when no picture is there yet
  const sky = ctx.createLinearGradient(0, 0, 0, H)
  sky.addColorStop(0, '#9fd0f0')
  sky.addColorStop(0.5, '#f6e7bd')
  sky.addColorStop(1, '#e6cd96')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, W, H)
  // the painted view moves a little slower than the land (parallax) and ends in the bank at the top of the land
  const par = 0.55
  const bw = WORLD_W + 500
  const camBx = WORLD_W / 2 + (cam.x - WORLD_W / 2) * par
  const draw = (im: HTMLImageElement | undefined, alpha: number) => {
    if (!im || !ctx || alpha <= 0) return
    const bh = (bw * im.height) / im.width
    const sx = (WORLD_W / 2 - bw / 2 - camBx) * cam.z + W / 2
    const sy = (BAND_ANCHOR - BAND_CONTENT * bh - cam.y) * cam.z + H / 2
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.drawImage(im, sx, sy, bw * cam.z, bh * cam.z)
    ctx.restore()
  }
  draw(a ?? b, 1)
  if (a && b) draw(b, lush)
}

function drawLockedParcels() {
  if (!ctx) return
  for (const p of PARCELS) {
    if (G.parcels.includes(p.id)) continue
    const rx = p.col * PARCEL_W + 6
    const ry = RIVER_H + p.row * PARCEL_H + 6
    ctx.save()
    ctx.fillStyle = 'rgba(120, 85, 35, 0.16)'
    roundRect(ctx, rx, ry, PARCEL_W - 12, PARCEL_H - 12, 28)
    ctx.fill()
    ctx.setLineDash([10, 8])
    ctx.strokeStyle = 'rgba(100, 70, 25, 0.45)'
    ctx.lineWidth = 3
    ctx.stroke()
    ctx.restore()
    const cx = rx + (PARCEL_W - 12) / 2
    const cy = ry + (PARCEL_H - 12) / 2
    const ok = G.level >= p.level
    drawTag(cx, cy - 16, ok ? String(p.cost) : T('levelShort', { n: p.level }), ok ? 'coin' : 'lock', ok ? 'cost' : 'lock')
    drawTag(cx, cy + 18, roleName(p), undefined, ok ? 'cost' : 'lock')
    addBox({ x0: rx, y0: ry, x1: rx + PARCEL_W - 12, y1: ry + PARCEL_H - 12, prio: 0, kind: 'parcel', id: String(p.id) })
  }
}

function drawBubble(b: Bubble) {
  if (!ctx) return
  const bob = Math.sin(clock * 4 + b.x * 0.1) * 3
  const x = b.x
  const y = b.y + bob
  ctx.save()
  ctx.fillStyle = 'rgba(255,250,236,0.95)'
  ctx.strokeStyle = b.ring ? '#f2b93b' : 'rgba(120,90,40,0.5)'
  ctx.lineWidth = b.ring ? 3 : 1.5
  ctx.beginPath()
  ctx.arc(x, y - 16, 17, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  // the little tail
  ctx.beginPath()
  ctx.moveTo(x - 4, y - 1)
  ctx.lineTo(x + 4, y - 1)
  ctx.lineTo(x, y + 5)
  ctx.closePath()
  ctx.fillStyle = 'rgba(255,250,236,0.95)'
  ctx.fill()
  const im = img[b.icon]
  if (im) {
    const s = 25
    const k = Math.min(s / im.width, s / im.height)
    ctx.drawImage(im, x - (im.width * k) / 2, y - 16 - (im.height * k) / 2, im.width * k, im.height * k)
  }
  if (b.badge) {
    ctx.fillStyle = '#d24b3a'
    ctx.beginPath()
    ctx.arc(x + 13, y - 30, 9, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = '800 12px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(b.badge, x + 13, y - 30)
  }
  ctx.restore()
}

function frameDraw(dt: number, now: number) {
  if (!ctx || !canvas.value) return
  const c = ctx
  c.setTransform(dpr, 0, 0, dpr, 0, 0)
  c.clearRect(0, 0, W, H)
  drawBackdrop()
  buildTerrain()
  // the world
  c.setTransform(dpr * cam.z, 0, 0, dpr * cam.z, dpr * (W / 2 - cam.x * cam.z), dpr * (H / 2 - cam.y * cam.z))
  if (terrain) c.drawImage(terrain, -MARGIN, -TERRAIN_TOP)
  items.length = 0
  boxes.length = 0
  bubbles.length = 0
  drawLockedParcels()
  for (const p of PARCELS) {
    if (!G.parcels.includes(p.id)) continue
    for (const sp of p.spots) addSpot(sp, now)
  }
  drawWalkers(dt)
  items.sort((a, b) => a.y - b.y)
  for (const it of items) it.fn()
  drawPuffs()
  for (const b of bubbles) drawBubble(b)
  // sparks and floating words
  for (const s of sparks) {
    const k = s.t / s.life
    c.globalAlpha = Math.max(0, 1 - k)
    c.fillStyle = s.c
    c.beginPath()
    c.arc(s.x, s.y, s.r * (1 - k * 0.5), 0, Math.PI * 2)
    c.fill()
  }
  c.globalAlpha = 1
  c.font = '800 19px system-ui, sans-serif'
  c.textAlign = 'center'
  for (const f of floaters) {
    const k = f.t / 1.1
    c.globalAlpha = Math.max(0, 1 - k * k)
    c.lineWidth = 4
    c.strokeStyle = 'rgba(60,40,10,0.7)'
    c.strokeText(f.text, f.x, f.y - 50 * k)
    c.fillStyle = f.color
    c.fillText(f.text, f.x, f.y - 50 * k)
  }
  c.globalAlpha = 1
  // flying goods in screen space
  c.setTransform(dpr, 0, 0, dpr, 0, 0)
  for (const f of flies) {
    if (f.t < 0) continue
    const k = Math.min(1, f.t / f.dur)
    const e = k * k * (3 - 2 * k)
    const x = f.sx + (f.tx - f.sx) * e
    const y = f.sy + (f.ty - f.sy) * e - Math.sin(k * Math.PI) * 50
    const im = img[f.name]
    const s = 30 * (1 - 0.4 * k)
    if (im) c.drawImage(im, x - s / 2, y - s / 2, s, s * (im.height / im.width))
  }
}

function stepAnimations(dt: number) {
  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i]!
    s.t += dt
    s.x += s.vx * dt
    s.y += s.vy * dt
    s.vy += 160 * dt
    if (s.t >= s.life) sparks.splice(i, 1)
  }
  for (let i = floaters.length - 1; i >= 0; i--) {
    const f = floaters[i]!
    f.t += dt
    if (f.t > 1.1) floaters.splice(i, 1)
  }
  for (let i = flies.length - 1; i >= 0; i--) {
    const f = flies[i]!
    f.t += dt
    if (f.t >= f.dur) flies.splice(i, 1)
  }
}

// ── the actions of the child (each one asks the rules and shows what happened) ──────────────────────────────────────────────────
function changed() {
  dirty = true
  refresh()
  handleEvents()
}

function doHarvest(id: string): boolean {
  const sp = SPOT_BY_ID[id]!
  const crop = G.plots[id]?.crop
  const r = harvest(G, id, nowMs())
  if (!r.ok) {
    if (r.reason === 'full') showHint(r)
    return false
  }
  play('basket', 0.4, 0.9 + Math.random() * 0.3)
  burst(sp.x, sp.y - 40, '#ffe28a', 9)
  if (crop) flyGood(goodPic(crop), sp.x, sp.y - 40, r.n ?? 1, 'store')
  floatText(`+${r.n}`, sp.x, sp.y - 70)
  changed()
  return true
}

function doPlant(id: string, crop: CropId): boolean {
  const sp = SPOT_BY_ID[id]!
  const r = plant(G, id, crop, nowMs())
  if (!r.ok) {
    if (r.reason === 'coins' || r.reason === 'level') showHint(r)
    return false
  }
  play('tap', 0.4, 0.9 + Math.random() * 0.4)
  burst(sp.x, sp.y - 20, '#a0743c', 5)
  changed()
  return true
}

function doCollectJobs(b: BuildingId) {
  const sp = SPOT_BY_ID[`p${BUILDINGS[b].parcel}-${b}`]!
  const first = G.buildings[b].queue[0]
  const r = collectJobs(G, b, nowMs())
  if (!r.ok) {
    if (r.reason === 'full') showHint(r)
    return
  }
  play('found', 0.5)
  burst(sp.x, sp.y - 50, '#ffe28a', 8)
  if (first) flyGood(goodPic(first.recipe as GoodId), sp.x, sp.y - 60, r.n ?? 1, 'store')
  floatText(`+${r.n}`, sp.x, sp.y - 90)
  changed()
}

function doFeed(a: AnimalId, i: number) {
  const pen = SPOT_BY_ID[`p${ANIMALS[a].parcel}-pen`]!
  const r = feed(G, a, i, nowMs())
  if (!r.ok) {
    if (r.reason === 'goods') {
      play('wrong', 0.3)
      toast(T('needFeed', { n: ANIMALS[a].feedN, good: goodName(ANIMALS[a].feed) }), goodPic(ANIMALS[a].feed), 'bad')
    }
    return
  }
  play('sack', 0.4)
  const [dx, dy] = PEN_PLACES[i]!
  burst(pen.x + dx, pen.y + dy - 20, '#9bd36a', 5)
  changed()
}

function doCollectAnimal(a: AnimalId, i: number) {
  const pen = SPOT_BY_ID[`p${ANIMALS[a].parcel}-pen`]!
  const r = collectAnimal(G, a, i, nowMs())
  if (!r.ok) {
    if (r.reason === 'full') showHint(r)
    return
  }
  play('found', 0.5, 1.1)
  const [dx, dy] = PEN_PLACES[i]!
  burst(pen.x + dx, pen.y + dy - 30, '#ffe28a', 8)
  flyGood(goodPic(ANIMALS[a].product), pen.x + dx, pen.y + dy - 30, 1, 'store')
  floatText('+1', pen.x + dx, pen.y + dy - 60)
  changed()
}

function tapBox(b: Box, down: boolean) {
  const now = nowMs()
  plotInfo.value = null
  switch (b.kind) {
    case 'plot':
    case 'bed': {
      const ph = plotPhase(G, b.id, now)
      if (ph === 'ripe') doHarvest(b.id)
      else if (ph === 'empty') {
        const kind = b.kind
        if (seed.value && CROPS[seed.value].kind === kind) doPlant(b.id, seed.value)
        else panel.value = { kind: 'seed', ref: b.id }
      } else if (ph === 'growing') {
        plotInfo.value = { id: b.id, until: now + 5000 }
        play('tap', 0.2)
      }
      break
    }
    case 'building': {
      const bs = G.buildings[b.ref as BuildingId]
      if (bs.built && readyJobs(G, b.ref as BuildingId, now) > 0) doCollectJobs(b.ref as BuildingId)
      else panel.value = { kind: 'build', ref: b.ref }
      break
    }
    case 'barn':
    case 'granary':
      play('button', 0.3)
      panel.value = { kind: 'store' }
      break
    case 'board':
      play('button', 0.3)
      panel.value = { kind: 'board' }
      break
    case 'animal': {
      const a = b.ref as AnimalId
      const i = b.slot ?? 0
      if (animalReady(G, a, i, now)) doCollectAnimal(a, i)
      else if (G.pens[a].slots[i]?.readyAt === 0) doFeed(a, i)
      else {
        const sl = G.pens[a].slots[i]!
        toast(T('animalBusy', { time: timeText(sl.readyAt - now) }), goodPic(ANIMALS[a].product), 'gold')
      }
      break
    }
    case 'slot':
    case 'pen':
      panel.value = { kind: 'pen', ref: b.ref }
      break
    case 'decor':
      panel.value = { kind: 'decor', ref: b.id }
      break
    case 'parcel':
      panel.value = { kind: 'parcel', ref: b.id }
      break
  }
  void down
}

// ── touch ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────
interface Ptr {
  x: number
  y: number
  sx: number
  sy: number
  t: number
}
const ptrs = new Map<number, Ptr>()
let tapBoxHit: Box | null = null
let moved = false
let paint: null | 'harvest' | 'plant' = null
const painted = new Set<string>()
let pinch: null | { d: number; z: number } = null
let vel = { x: 0, y: 0 }

function hit(wx: number, wy: number): Box | null {
  let best: Box | null = null
  for (const b of boxes) {
    if (wx < b.x0 || wx > b.x1 || wy < b.y0 || wy > b.y1) continue
    if (!best || b.prio > best.prio || (b.prio === best.prio && b.y1 > best.y1)) best = b
  }
  return best
}

function localPoint(e: PointerEvent): [number, number] {
  const r = canvas.value!.getBoundingClientRect()
  return [e.clientX - r.left, e.clientY - r.top]
}

function onDown(e: PointerEvent) {
  if (!loaded.value || intro.value || how.value || modals.value.length || panel.value) return
  try {
    canvas.value?.setPointerCapture(e.pointerId)
  } catch {
    // not needed
  }
  const [sx, sy] = localPoint(e)
  ptrs.set(e.pointerId, { x: sx, y: sy, sx, sy, t: performance.now() })
  vel = { x: 0, y: 0 }
  if (ptrs.size === 2) {
    const [p, q] = [...ptrs.values()]
    pinch = { d: Math.hypot(p!.x - q!.x, p!.y - q!.y), z: cam.z }
    paint = null
    tapBoxHit = null
    return
  }
  const [wx, wy] = toWorld(sx, sy)
  const b = hit(wx, wy)
  tapBoxHit = b
  moved = false
  paint = null
  painted.clear()
  if (b && (b.kind === 'plot' || b.kind === 'bed')) {
    const ph = plotPhase(G, b.id, nowMs())
    if (ph === 'ripe') {
      paint = 'harvest'
      painted.add(b.id)
      doHarvest(b.id)
      tapBoxHit = null
    } else if (ph === 'empty' && seed.value && CROPS[seed.value].kind === b.kind) {
      paint = 'plant'
      painted.add(b.id)
      doPlant(b.id, seed.value)
      tapBoxHit = null
    }
  }
}

function onMove(e: PointerEvent) {
  const p = ptrs.get(e.pointerId)
  if (!p) return
  const [sx, sy] = localPoint(e)
  if (pinch && ptrs.size === 2) {
    const dx = sx - p.x
    const dy = sy - p.y
    p.x = sx
    p.y = sy
    const [a, b] = [...ptrs.values()]
    const d = Math.hypot(a!.x - b!.x, a!.y - b!.y)
    zoomAt((a!.x + b!.x) / 2, (a!.y + b!.y) / 2, (pinch.z * d) / pinch.d / cam.z)
    cam.x -= dx / 2 / cam.z
    cam.y -= dy / 2 / cam.z
    clampCam()
    return
  }
  if (paint) {
    const [wx, wy] = toWorld(sx, sy)
    const b = hit(wx, wy)
    p.x = sx
    p.y = sy
    if (b && (b.kind === 'plot' || b.kind === 'bed') && !painted.has(b.id)) {
      painted.add(b.id)
      const ph = plotPhase(G, b.id, nowMs())
      if (paint === 'harvest' && ph === 'ripe') doHarvest(b.id)
      else if (paint === 'plant' && ph === 'empty' && seed.value && CROPS[seed.value].kind === b.kind) doPlant(b.id, seed.value)
    }
    return
  }
  const dx = sx - p.x
  const dy = sy - p.y
  if (!moved && Math.hypot(sx - p.sx, sy - p.sy) > 9) moved = true
  if (moved) {
    cam.x -= dx / cam.z
    cam.y -= dy / cam.z
    vel = { x: -dx / cam.z, y: -dy / cam.z }
    clampCam()
  }
  p.x = sx
  p.y = sy
}

function onUp(e: PointerEvent) {
  const p = ptrs.get(e.pointerId)
  ptrs.delete(e.pointerId)
  if (ptrs.size < 2) pinch = null
  if (!p) return
  if (ptrs.size === 0) {
    if (!moved && !paint && tapBoxHit) tapBox(tapBoxHit, false)
    else if (!moved && !paint && !tapBoxHit) {
      plotInfo.value = null
      if (seed.value) seed.value = null
    }
    tapBoxHit = null
    paint = null
  }
}

function onWheel(e: WheelEvent) {
  const [sx, sy] = [e.offsetX, e.offsetY]
  zoomAt(sx, sy, e.deltaY < 0 ? 1.12 : 1 / 1.12)
}

// ── events from the rules: the screen tells them ────────────────────────────────────────────────────────────────────────────
function unlockThumb(u: string): string {
  const [kind, id] = u.split(':') as [string, string]
  if (kind === 'crop') return goodPic(id as GoodId)
  if (kind === 'recipe') return goodPic(id as GoodId)
  if (kind === 'building') return `${BUILDING_FILE[id as BuildingId]}-0`
  if (kind === 'animal') return `${ANIMAL_FILE[id as AnimalId]}-a`
  if (kind === 'decor') return decorPic(id as DecorId)
  return 'leer-trocken'
}
function unlockName(u: string): string {
  const [kind, id] = u.split(':') as [string, string]
  if (kind === 'crop' || kind === 'recipe') return goodName(id as GoodId)
  if (kind === 'building') return T(`building.${id}`)
  if (kind === 'animal') return T(`animal.${id}`)
  if (kind === 'decor') return T(`decor.${id}`)
  return T(`role.${id}`)
}

let lastChapterShown = 0
function handleEvents() {
  const ev: GameEvent[] = drainEvents(G)
  for (const e of ev) {
    if (e.kind === 'level') {
      play('fanfare', 0.5)
      modals.value.push({ kind: 'level', data: { level: e.level, coins: e.coins, unlocks: e.unlocks } })
    } else if (e.kind === 'leanStart') {
      play('trophy', 0.5)
      modals.value.push({ kind: 'lean', data: { ...e } })
    } else if (e.kind === 'fatStart') {
      play('trophy', 0.5)
      modals.value.push({ kind: 'fat', data: { cycle: e.cycle } })
    } else if (e.kind === 'yearEnd') {
      play('result', 0.35)
      toast(T(e.phase === 'fat' ? 'yearEndFat' : 'yearEndLean', { n: (e.index % CYCLE_YEARS) % FAT_YEARS + 1 }), 'z-aehre-voll', 'good')
    } else if (e.kind === 'goal') {
      play('star', 0.4)
      toast(T('goalDone', { text: goalText(e.id) }), 'z-truhe', 'good')
    } else if (e.kind === 'stars') {
      progress.record(GAME_ID, e.chapter, e.stars)
      toast(T('chapterStars', { n: e.stars, chapter: T(`chapter.${e.chapter}.title`) }), undefined, 'good')
    } else if (e.kind === 'daily') {
      play('result', 0.4)
      toast(T('dailyDone'), 'z-sichel', 'good')
    } else if (e.kind === 'special') {
      play('caravan', 0.5)
      toast(T(e.order === 'dream' ? 'specialDream' : 'specialBrothers'), 'z-siegel', 'gold')
      sendMessenger()
    }
  }
  // a new chapter begins: its story is told
  const ch = currentChapter(G)
  const seen = Math.max(lastChapterShown, stat(G, 'chapterSeen'))
  if (ch > seen) {
    G.stats.chapterSeen = ch
    lastChapterShown = ch
    modals.value.push({ kind: 'chapter', data: { chapter: ch } })
  } else lastChapterShown = seen
}

// ── texts of goals and tasks ────────────────────────────────────────────────────────────────────────────────────────────────
function goalText(id: string): string {
  const g = chapterGoals(Number(id.slice(1, 2))).find((x) => x.id === id)
  if (!g) return ''
  return T(`goalStat.${g.stat}`, { n: g.target })
}

// ── lists for the panels ────────────────────────────────────────────────────────────────────────────────────────────────────
const kindIcon: Record<string, string> = { caravan: 'z-karawane', village: 'figur-0', palace: 'z-siegel', hunger: 'figur-3', brothers: 'z-karawane', dream: 'z-siegel' }
const boardList = computed(() => {
  void rev.value
  void clockTick.value
  return G.orders.map((o, i) => {
    if (!o) return { i, order: null as Order | null, lines: [] as Array<{ good: GoodId; n: number; have: number; ok: boolean }>, can: false, wait: Math.max(0, (G.refill[i] ?? 0) - nowMs()) }
    return {
      i,
      order: o,
      lines: o.lines.map((l) => ({ good: l.good, n: l.n, have: G.inv[l.good], ok: G.inv[l.good] >= l.n })),
      can: canFill(G, o),
      wait: 0
    }
  })
})
const whoPic = (o: Order): string => (o.kind === 'village' ? `figur-${o.who}` : kindIcon[o.kind]!)

const storeGoods = computed(() => {
  void rev.value
  return GOOD_IDS.filter((g) => G.inv[g] > 0).map((g) => ({ good: g, n: G.inv[g] }))
})

interface UpgradeView {
  coins: number
  level: number
  goods: Array<{ good: GoodId; n: number; ok: boolean }>
  ok: boolean
  levelOk: boolean
}
function upgradeView(up: { level: number; coins: number; goods?: Partial<Record<GoodId, number>> } | null): UpgradeView | null {
  if (!up) return null
  const goods = (Object.entries(up.goods ?? {}) as Array<[GoodId, number]>).map(([good, n]) => ({ good, n, ok: G.inv[good] >= n }))
  const levelOk = G.level >= up.level
  return { coins: up.coins, level: up.level, goods, levelOk, ok: levelOk && G.coins >= up.coins && goods.every((g) => g.ok) }
}

const storeViews = computed(() => {
  void rev.value
  return (['granary', 'barn'] as StoreId[]).map((s) => ({
    id: s,
    level: s === 'barn' ? G.barn : G.granary,
    used: s === 'barn' ? view.value.barnUsed : view.value.granaryUsed,
    cap: capacity(G, s),
    up: upgradeView(nextStoreUpgrade(G, s))
  }))
})

const landList = computed(() => {
  void rev.value
  return PARCELS.map((p) => ({
    id: p.id,
    role: p.role,
    name: roleName(p),
    open: G.parcels.includes(p.id),
    cost: p.cost,
    level: p.level,
    levelOk: G.level >= p.level,
    afford: G.coins >= p.cost
  })).sort((a, b) => Number(b.open) - Number(a.open) || a.level - b.level)
})

const buildPanel = computed(() => {
  void rev.value
  void clockTick.value
  const p = panel.value
  if (!p || p.kind !== 'build') return null
  const id = p.ref as BuildingId
  const def = BUILDINGS[id]
  const bs = G.buildings[id]
  const now = nowMs()
  return {
    id,
    def,
    built: bs.built,
    level: bs.level,
    parcelOpen: G.parcels.includes(def.parcel),
    levelOk: G.level >= def.level,
    affordable: G.coins >= def.cost,
    up: upgradeView(nextBuildingUpgrade(G, id)),
    cap: queueCap(G, id),
    queue: bs.queue.map((j) => ({ good: j.recipe as GoodId, left: Math.max(0, j.doneAt - now), ready: j.doneAt <= now })),
    ready: readyJobs(G, id, now),
    recipes: RECIPE_IDS.filter((r) => RECIPES[r].building === id).map((r) => {
      const def2 = RECIPES[r]
      const inputs = (Object.entries(def2.inputs) as Array<[GoodId, number]>).map(([good, n]) => ({ good, n, ok: G.inv[good] >= n }))
      return { id: r as RecipeId, good: r as GoodId, level: def2.level, levelOk: G.level >= def2.level, inputs, ok: inputs.every((x) => x.ok), secs: jobSeconds(G, r), full: bs.queue.length >= queueCap(G, id) }
    })
  }
})

const penPanel = computed(() => {
  void rev.value
  void clockTick.value
  const p = panel.value
  if (!p || p.kind !== 'pen') return null
  const a = p.ref as AnimalId
  const def = ANIMALS[a]
  const pen = G.pens[a]
  const now = nowMs()
  const hungry = pen.slots.filter((s, i) => s && s.readyAt === 0 && i < PEN_SLOTS[pen.level - 1]!).length
  return {
    id: a,
    def,
    count: animalCount(G, a),
    cap: penCapacity(G, a),
    price: animalPrice(G, a),
    levelOk: G.level >= def.level,
    afford: G.coins >= animalPrice(G, a),
    full: animalCount(G, a) >= penCapacity(G, a),
    up: nextPenUpgrade(G, a) ? upgradeView({ ...nextPenUpgrade(G, a)!, goods: {} }) : null,
    hungry,
    feedHave: G.inv[def.feed],
    ready: pen.slots.filter((_, i) => animalReady(G, a, i, now)).length
  }
})

const seedList = computed(() => {
  void rev.value
  const p = panel.value
  if (!p || p.kind !== 'seed') return []
  const sp = SPOT_BY_ID[p.ref ?? '']
  if (!sp) return []
  return CROP_IDS.filter((c) => CROPS[c].kind === sp.kind).map((c) => ({ id: c, def: CROPS[c], levelOk: G.level >= CROPS[c].level, afford: G.coins >= CROPS[c].seed, yield: harvestYield(G, c) }))
})

const decorList = computed(() => {
  void rev.value
  return DECOR_IDS.map((d) => ({ id: d, def: DECORS[d], levelOk: G.level >= DECORS[d].level, afford: G.coins >= DECORS[d].cost })).sort((a, b) => a.def.level - b.def.level)
})
const parcelPanel = computed(() => {
  void rev.value
  const p = panel.value
  if (!p || p.kind !== 'parcel') return null
  const def = PARCELS[Number(p.ref)]!
  return { def, levelOk: G.level >= def.level, afford: G.coins >= def.cost }
})

const chapters = computed(() => {
  void rev.value
  return Array.from({ length: CHAPTERS }, (_, c) => ({
    c,
    done: chapterDone(G, c),
    stars: starsOfChapter(chapterDone(G, c)),
    goals: chapterGoals(c).map((g) => ({ id: g.id, text: T(`goalStat.${g.stat}`, { n: g.target }), done: G.goalsDone.includes(g.id), have: goalProgress(G, g), target: g.target, coins: g.coins })),
    current: currentChapter(G) === c
  }))
})
const dailyList = computed(() => {
  void rev.value
  return G.daily.tasks.map((tk) => ({ id: tk.id, text: T(`daily.${tk.id}`, { n: tk.target }), have: Math.min(tk.target, stat(G, tk.stat) - tk.base), target: tk.target, done: tk.done }))
})
const dailyPay = computed(() => {
  void rev.value
  return dailyReward(G)
})
const album = computed(() => {
  void rev.value
  const sections: Array<{ key: string; items: Array<{ key: string; pic: string; name: string; seen: boolean }> }> = [
    { key: 'goods', items: GOOD_IDS.map((g) => ({ key: `good:${g}`, pic: goodPic(g), name: goodName(g), seen: G.seen.includes(`good:${g}`) })) },
    { key: 'animals', items: ANIMAL_IDS.map((a) => ({ key: `animal:${a}`, pic: `${ANIMAL_FILE[a]}-a`, name: T(`animal.${a}`), seen: G.seen.includes(`animal:${a}`) })) },
    { key: 'buildings', items: BUILDING_IDS.map((b) => ({ key: `building:${b}`, pic: `${BUILDING_FILE[b]}-0`, name: T(`building.${b}`), seen: G.seen.includes(`building:${b}`) })) },
    { key: 'decor', items: DECOR_IDS.map((d) => ({ key: `decor:${d}`, pic: decorPic(d), name: T(`decor.${d}`), seen: G.seen.includes(`decor:${d}`) })) }
  ]
  return { sections, count: G.seen.length, total: ALBUM_ITEMS.length }
})
const yearEars = computed(() => {
  void rev.value
  const y = view.value.year
  const inCycle = y.index % CYCLE_YEARS
  return Array.from({ length: CYCLE_YEARS }, (_, i) => ({ fat: i < FAT_YEARS, done: i < inCycle, now: i === inCycle }))
})
const tipText = computed(() => {
  void rev.value
  if (intro.value || how.value) return ''
  if (stat(G, 'planted') === 0) return T('tip.plant')
  const ripe = readySummary(G, nowMs()).plots
  if (stat(G, 'harvested') === 0) return ripe > 0 ? T('tip.harvest') : T('tip.wait')
  if (stat(G, 'ordersDone') === 0) return T('tip.order')
  return ''
})

// ── panel buttons ─────────────────────────────────────────────────────────────────────────────────────────────────────────
function closePanel() {
  panel.value = null
}
function chooseSeed(c: CropId) {
  const ref = panel.value?.ref
  seed.value = c
  panel.value = null
  if (ref) doPlant(ref, c)
  if (seed.value) toast(T('seedChosen', { good: goodName(c) }), goodPic(c), 'gold')
}
function fill(i: number) {
  const o = G.orders[i]
  if (!o) return
  const r = fillOrder(G, i, nowMs())
  if (!r.ok) return showHint(r)
  play('right', 0.5)
  play('coin', 0.4, 1.1)
  const sp = SPOT_BY_ID['p5-board']!
  flyGood('z-truhe', sp.x, sp.y - 40, 1, 'coins')
  floatText(`+${o.coins}`, sp.x, sp.y - 70, '#ffe28a')
  burst(sp.x, sp.y - 40, '#ffe28a', 10)
  changed()
}
function skip(i: number) {
  skipOrder(G, i, nowMs())
  play('tap', 0.3)
  changed()
}
function sellOne(g: GoodId, all = false) {
  const r = sell(G, g, all ? G.inv[g] : 1)
  if (r.ok) {
    play('coin', 0.5)
    changed()
  }
}
function buyLand(id: number) {
  const r = buyParcel(G, id)
  if (!r.ok) return showHint(r)
  play('result', 0.5)
  burst(PARCELS[id]!.col * PARCEL_W + PARCEL_W / 2, RIVER_H + PARCELS[id]!.row * PARCEL_H + PARCEL_H / 2, '#ffe28a', 20)
  terrainKey = ''
  panel.value = null
  toast(T('landBought'), undefined, 'good')
  changed()
  goTo(id)
}
function buildHere(b: BuildingId) {
  const r = build(G, b)
  if (!r.ok) return showHint(r)
  play('snap', 0.6)
  play('result', 0.4)
  const sp = SPOT_BY_ID[`p${BUILDINGS[b].parcel}-${b}`]!
  burst(sp.x, sp.y - 40, '#ffe28a', 16)
  changed()
}
function doUpgradeBuilding(b: BuildingId) {
  const r = upgradeBuilding(G, b)
  if (!r.ok) return showHint(r)
  play('result', 0.5)
  const sp = SPOT_BY_ID[`p${BUILDINGS[b].parcel}-${b}`]!
  burst(sp.x, sp.y - 40, '#ffe28a', 16)
  changed()
}
function doUpgradeStore(s: StoreId) {
  const r = upgradeStore(G, s)
  if (!r.ok) return showHint(r)
  play('result', 0.5)
  const sp = SPOT_BY_ID[s === 'barn' ? 'p5-barn' : 'p5-granary']!
  burst(sp.x, sp.y - 50, '#ffe28a', 16)
  changed()
}
function makeRecipe(r: RecipeId) {
  const b = RECIPES[r].building
  const res = enqueue(G, b, r, nowMs())
  if (!res.ok) return showHint(res)
  play('tap', 0.5)
  changed()
}
function collectBuilding() {
  const id = panel.value?.ref as BuildingId
  if (id) doCollectJobs(id)
}
function buyAnimalHere(a: AnimalId) {
  const r = buyAnimal(G, a)
  if (!r.ok) return showHint(r)
  play('found', 0.5)
  const pen = SPOT_BY_ID[`p${ANIMALS[a].parcel}-pen`]!
  burst(pen.x, pen.y - 60, '#ffe28a', 12)
  changed()
}
function feedAll(a: AnimalId) {
  let n = 0
  for (let i = 0; i < 4; i++) if (feed(G, a, i, nowMs()).ok) n++
  if (n === 0) {
    play('wrong', 0.3)
    toast(T('needFeed', { n: ANIMALS[a].feedN, good: goodName(ANIMALS[a].feed) }), goodPic(ANIMALS[a].feed), 'bad')
    return
  }
  play('sack', 0.4)
  changed()
}
function collectAll(a: AnimalId) {
  for (let i = 0; i < 4; i++) if (animalReady(G, a, i, nowMs())) doCollectAnimal(a, i)
}
function doUpgradePen(a: AnimalId) {
  const r = upgradePen(G, a)
  if (!r.ok) return showHint(r)
  play('result', 0.4)
  changed()
}
function putDecor(d: DecorId) {
  const ref = panel.value?.ref
  if (!ref) return
  const r = placeDecor(G, ref, d)
  if (!r.ok) return showHint(r)
  play('snap', 0.5)
  const sp = SPOT_BY_ID[ref]!
  burst(sp.x, sp.y - 30, '#ffe28a', 10)
  panel.value = null
  changed()
}
function removeDecor() {
  const ref = panel.value?.ref
  if (!ref) return
  clearDecor(G, ref)
  panel.value = null
  changed()
}
function useSiltOn() {
  const id = plotInfo.value?.id
  if (!id) return
  const r = useSilt(G, id, nowMs())
  if (!r.ok) return showHint(r)
  play('found', 0.4)
  plotInfo.value = null
  changed()
}
function closeModal() {
  modals.value.shift()
  play('button', 0.3)
}
function closeHow() {
  how.value = false
  markHowSeen(GAME_ID)
}
function startPlaying() {
  intro.value = false
  how.value = !howSeen(GAME_ID)
  play('button', 0.3)
}
function openPanel(kind: 'board' | 'store' | 'land' | 'goals') {
  play('button', 0.3)
  seed.value = null
  panel.value = { kind }
}
function leave() {
  save()
  emit('leave')
}
function save() {
  persist(G, nowMs())
  dirty = false
}

const plotInfoText = computed(() => {
  void clockTick.value
  void rev.value
  const pi = plotInfo.value
  if (!pi) return null
  const p = G.plots[pi.id]
  if (!p?.crop) return null
  return { name: goodName(p.crop), pic: goodPic(p.crop), left: timeText(p.readyAt - nowMs()), silt: G.inv.silt > 0 }
})

// ── the loop ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
function frame(ts: number) {
  const dt = Math.min(0.05, Math.max(0, (ts - last) / 1000))
  last = ts
  const playing = loaded.value && !intro.value
  clock += dt
  const now = nowMs()
  if (playing) {
    advanceYear(G, dt)
    sinceSlow += dt
    if (sinceSlow >= 1) {
      sinceSlow = 0
      tick(G, now)
      clockTick.value++
      handleEvents()
      refresh()
    }
    sinceSave += dt
    if (sinceSave >= 10) {
      sinceSave = 0
      if (dirty || true) save()
    }
    if (plotInfo.value && plotInfo.value.until < now) plotInfo.value = null
  }
  // glide after a swipe
  if (ptrs.size === 0 && (Math.abs(vel.x) > 0.05 || Math.abs(vel.y) > 0.05)) {
    cam.x += vel.x
    cam.y += vel.y
    vel = { x: vel.x * 0.9, y: vel.y * 0.9 }
    clampCam()
  }
  stepAnimations(dt)
  stepPuffs(dt)
  if (loaded.value) frameDraw(dt, now)
  sinceHud += dt
  raf = requestAnimationFrame(frame)
}

function onKey(e: KeyboardEvent) {
  if (e.key === '+' || e.key === '=') zoomBy(1.15)
  else if (e.key === '-') zoomBy(1 / 1.15)
  else if (e.key === 'Escape') {
    if (panel.value) closePanel()
    else if (seed.value) seed.value = null
  }
}

let bodyOverflow = ''
const onVisibility = () => {
  if (document.hidden) save()
}
onMounted(async () => {
  bodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  ctx = canvas.value?.getContext('2d') ?? null
  G = loadGame(nowMs())
  how.value = false
  resize()
  window.addEventListener('resize', resize)
  window.addEventListener('keydown', onKey)
  document.addEventListener('visibilitychange', onVisibility)
  music.playGame('graze')
  coinImg = new Image()
  coinImg.src = coinIcon
  lockImg = new Image()
  lockImg.src = lockIcon
  if (typeof location !== 'undefined' && location.href.includes('probe=1')) {
    ;(window as unknown as { __josefsland?: unknown }).__josefsland = {
      get game() {
        return G
      },
      get cam() {
        return cam
      },
      advance(sec: number) {
        const steps = Math.ceil(sec / 4.9)
        for (let i = 0; i < steps; i++) advanceYear(G, 4.9)
        changed()
      },
      refresh: changed,
      goTo,
      panel
    }
  }
  // the stars of the chapters are kept in the progress of the big games as well (a save that is older than that is brought up to date)
  G.chapterStars.forEach((st, c) => {
    if (st > (progress.levels(GAME_ID)[c] ?? 0)) progress.record(GAME_ID, c, st)
  })
  await loadPictures(ALL_PICTURES)
  homeView()
  tick(G, nowMs())
  loaded.value = true
  handleEvents()
  // a game that was closed goes on: what is ready now is told
  const r = readySummary(G, nowMs())
  if (r.plots + r.jobs + r.animals > 0) toast(T('welcomeBack', { n: r.plots + r.jobs + r.animals }), undefined, 'good')
  refresh()
  void loadPictures(LATE_PICTURES).then(refresh)
  last = performance.now()
  raf = requestAnimationFrame(frame)
})
onBeforeUnmount(() => {
  save()
  cancelAnimationFrame(raf)
  music.stop('game')
  window.removeEventListener('resize', resize)
  window.removeEventListener('keydown', onKey)
  document.removeEventListener('visibilitychange', onVisibility)
  document.body.style.overflow = bodyOverflow
  void T0
  void ended
  void addXp
  void levelCoins
  void orderSlots
  void STORES
  void goodIcon
})

const levelModal = computed(() => {
  const m = modals.value[0]
  return m && m.kind === 'level' ? (m.data as { level: number; coins: number; unlocks: string[] }) : null
})
const leanModal = computed(() => {
  const m = modals.value[0]
  return m && m.kind === 'lean' ? (m.data as { index: number; need: number; given: number; coins: number; xp: number; factor: number }) : null
})
const fatModal = computed(() => {
  const m = modals.value[0]
  return m && m.kind === 'fat' ? (m.data as { cycle: number }) : null
})
const chapterModal = computed(() => {
  const m = modals.value[0]
  return m && m.kind === 'chapter' ? (m.data as { chapter: number }) : null
})
const leanShare = computed(() => {
  const m = leanModal.value
  return m ? Math.round((m.given / Math.max(1, m.need)) * 100) : 0
})
const needGrain = computed(() => leanNeed(view.value.level))
const yearNth = computed(() => ((view.value.year.index % CYCLE_YEARS) % FAT_YEARS) + 1)
</script>

<template lang="pug">
  div(class="jl" data-test="jl")
    canvas(
      ref="canvas"
      class="jl-canvas"
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onUp"
      @wheel.prevent="onWheel"
    )

    div(v-if="!loaded" class="jl-center")
      div(class="jl-spinner")

    //- the top: back, level, coins, the years
    template(v-if="loaded && !intro")
      div(class="jl-top")
        button(type="button" class="jl-round" :aria-label="T('leave')" data-test="jl-leave" @click="leave") ←
        div(class="jl-level" :style="{ '--p': Math.round(view.xpShare * 100) + '%' }" :title="view.xp + ' / ' + view.xpNeed")
          span(class="jl-level-n") {{ view.level }}
        div(ref="coinBox" class="jl-coins" data-test="jl-coins")
          img(:src="coinIcon" alt="" class="jl-coin" @error="hideBroken")
          span {{ view.coins }}
        button(type="button" class="jl-years" :class="'is-' + view.year.phase" data-test="jl-year" :aria-label="T('yearTitle')" @click="panel = { kind: 'year' }")
          span(class="jl-ears")
            img(v-for="(e, i) in yearEars" :key="i" :src="iconUrl(e.fat ? 'z-aehre-voll' : 'z-aehre-duenn')" alt="" class="jl-ear" :class="{ 'is-done': e.done, 'is-now': e.now }" @error="hideBroken")
          span(class="jl-year-bar")
            span(class="jl-year-fill" :style="{ width: Math.round((view.year.points / view.year.len) * 100) + '%' }")

      div(class="jl-zoom")
        button(type="button" class="jl-round" aria-label="+" @click="zoomBy(1.25)") +
        button(type="button" class="jl-round" aria-label="−" @click="zoomBy(1 / 1.25)") −

      div(v-if="tipText" class="jl-tip") {{ tipText }}
      div(v-if="seed" class="jl-seed" data-test="jl-seed")
        img(:src="goodIcon(seed)" alt="" class="jl-seed-ico" @error="hideBroken")
        span {{ T('seedOn', { good: goodName(seed) }) }}
        button(type="button" class="jl-x" :aria-label="T('close')" @click="seed = null") ✕

      div(v-if="plotInfoText" class="jl-info" data-test="jl-plotinfo")
        img(:src="iconUrl(plotInfoText.pic)" alt="" class="jl-info-ico" @error="hideBroken")
        span {{ plotInfoText.name }}: {{ plotInfoText.left }}
        button(v-if="plotInfoText.silt" type="button" class="jl-mini" data-test="jl-silt" @click="useSiltOn")
          img(:src="goodIcon('silt')" alt="" @error="hideBroken")
          | {{ T('useSilt') }}

      //- the bottom bar
      div(class="jl-bar")
        button(ref="ordersBtn" type="button" class="jl-btn" data-test="jl-orders" @click="openPanel('board')")
          img(:src="iconUrl('z-rolle')" alt="" class="jl-btn-ico" @error="hideBroken")
          span(class="jl-btn-l") {{ T('orders') }}
          span(v-if="view.fillable > 0" class="jl-badge") {{ view.fillable }}
        button(ref="storeBtn" type="button" class="jl-btn" data-test="jl-store" @click="openPanel('store')")
          img(:src="iconUrl('scheune-0')" alt="" class="jl-btn-ico" @error="hideBroken")
          span(class="jl-btn-l") {{ T('store') }}
        button(type="button" class="jl-btn" data-test="jl-land" @click="openPanel('land')")
          img(:src="iconUrl('leer-trocken')" alt="" class="jl-btn-ico" @error="hideBroken")
          span(class="jl-btn-l") {{ T('land') }}
        button(type="button" class="jl-btn" data-test="jl-goals" @click="openPanel('goals')")
          img(:src="iconUrl('z-truhe')" alt="" class="jl-btn-ico" @error="hideBroken")
          span(class="jl-btn-l") {{ T('goals') }}
          span(class="jl-badge jl-badge--star") {{ view.stars }}

    //- toasts
    div(class="jl-toasts")
      div(v-for="x in toasts" :key="x.id" class="jl-toast" :class="'is-' + x.tone")
        img(v-if="x.icon" :src="iconUrl(x.icon)" alt="" class="jl-toast-ico" @error="hideBroken")
        span {{ x.text }}

    //- the story card (every time the game opens)
    div(v-if="loaded && intro" class="jl-dim jl-dim--full" data-test="jl-intro")
      div(class="jl-card jl-intro")
        img(:src="iconUrl('traum')" alt="" class="jl-intro-pic" @error="hideBroken")
        h1(class="jl-title") {{ T('title') }}
        p(class="jl-ref") {{ T('ref') }}
        p(class="jl-text") {{ T('intro.story') }}
        p(class="jl-text jl-task") {{ T('intro.task') }}
        AdvButton(data-test="jl-start" @click="startPlaying") {{ T('go') }}

    //- how to play (once)
    div(v-if="loaded && how && !intro" class="jl-dim jl-dim--full")
      div(class="jl-card jl-how" data-test="jl-how")
        h2(class="jl-title") {{ T('how.title') }}
        div(class="jl-how-row")
          img(:src="iconUrl('z-samen')" alt="" class="jl-how-ico" @error="hideBroken")
          p {{ T('how.plant') }}
        div(class="jl-how-row")
          img(:src="iconUrl('z-sichel')" alt="" class="jl-how-ico" @error="hideBroken")
          p {{ T('how.harvest') }}
        div(class="jl-how-row")
          img(:src="iconUrl('z-rolle')" alt="" class="jl-how-ico" @error="hideBroken")
          p {{ T('how.orders') }}
        div(class="jl-how-row")
          img(:src="iconUrl('z-aehre-voll')" alt="" class="jl-how-ico" @error="hideBroken")
          p {{ T('how.years') }}
        AdvButton(data-test="jl-how-go" @click="closeHow") {{ T('go') }}

    //- big messages (level, years, chapters), one after the other
    div(v-if="levelModal" class="jl-dim jl-dim--full")
      div(class="jl-card jl-small" data-test="jl-level-modal")
        h2(class="jl-title") {{ T('levelUp', { n: levelModal.level }) }}
        div(class="jl-big-level") {{ levelModal.level }}
        p(class="jl-text") {{ T('levelCoins', { n: levelModal.coins }) }}
        div(v-if="levelModal.unlocks.length" class="jl-unlocks")
          p(class="jl-text jl-text--s") {{ T('levelOpens') }}
          div(class="jl-unlock-row")
            div(v-for="u in levelModal.unlocks" :key="u" class="jl-unlock")
              img(:src="iconUrl(unlockThumb(u))" alt="" @error="hideBroken")
              span {{ unlockName(u) }}
        AdvButton(@click="closeModal") {{ T('great') }}
    div(v-else-if="leanModal" class="jl-dim jl-dim--full")
      div(class="jl-card jl-small" data-test="jl-lean-modal")
        h2(class="jl-title") {{ T('leanTitle') }}
        img(:src="iconUrl('z-aehre-duenn')" alt="" class="jl-modal-ico" @error="hideBroken")
        p(class="jl-text") {{ T('leanText') }}
        p(v-if="leanModal.given > 0" class="jl-text jl-good") {{ T('leanGave', { n: leanModal.given, need: leanModal.need }) }}
        p(v-if="leanModal.given > 0" class="jl-text jl-text--s") {{ T('leanReward', { coins: leanModal.coins, xp: leanModal.xp }) }}
        p(v-else class="jl-text") {{ T('leanNone') }}
        p(class="jl-text jl-text--s") {{ T('leanFactor', { p: Math.round(leanModal.factor * 100) }) }}
        AdvButton(@click="closeModal") {{ T('ok') }}
    div(v-else-if="fatModal" class="jl-dim jl-dim--full")
      div(class="jl-card jl-small" data-test="jl-fat-modal")
        h2(class="jl-title") {{ T('fatTitle') }}
        img(:src="iconUrl('z-aehre-voll')" alt="" class="jl-modal-ico" @error="hideBroken")
        p(class="jl-text") {{ T('fatText', { n: fatModal.cycle }) }}
        AdvButton(@click="closeModal") {{ T('ok') }}
    div(v-else-if="chapterModal" class="jl-dim jl-dim--full")
      div(class="jl-card jl-small" data-test="jl-chapter-modal")
        h2(class="jl-title") {{ T(`chapter.${chapterModal.chapter}.title`) }}
        p(class="jl-text") {{ T(`chapter.${chapterModal.chapter}.story`) }}
        p(class="jl-text jl-task") {{ T(`chapter.${chapterModal.chapter}.task`) }}
        AdvButton(@click="closeModal") {{ T('go') }}

    //- panels
    div(v-if="panel && loaded" class="jl-dim" @click.self="closePanel")
      div(class="jl-sheet")
        button(type="button" class="jl-sheet-x" :aria-label="T('close')" data-test="jl-close" @click="closePanel") ✕

        //- the board
        template(v-if="panel.kind === 'board'")
          h2(class="jl-title") {{ T('orders') }}
          p(class="jl-text jl-text--s") {{ T('ordersInfo') }}
          div(class="jl-orders" data-test="jl-board")
            div(v-for="b in boardList" :key="b.i" class="jl-order" :class="{ 'is-can': b.can, 'is-empty': !b.order }")
              template(v-if="b.order")
                div(class="jl-who")
                  img(:src="iconUrl(whoPic(b.order))" alt="" @error="hideBroken")
                  span {{ T('kind.' + b.order.kind) }}
                div(class="jl-lines")
                  div(v-for="l in b.lines" :key="l.good" class="jl-line" :class="{ 'is-ok': l.ok }")
                    img(:src="goodIcon(l.good)" alt="" @error="hideBroken")
                    b {{ l.have > l.n ? l.n : l.have }}/{{ l.n }}
                div(class="jl-pay")
                  span(class="jl-pay-c")
                    img(:src="coinIcon" alt="" class="jl-coin jl-coin--s" @error="hideBroken")
                    | {{ b.order.coins }}
                  span(class="jl-pay-x") {{ b.order.xp }} XP
                p(v-if="b.order.kind === 'dream'" class="jl-order-note") {{ T('dreamNote') }}
                div(class="jl-order-btns")
                  button(type="button" class="jl-go" :disabled="!b.can" :data-test="'jl-fill-' + b.i" @click="fill(b.i)") {{ b.order.kind === 'dream' ? T('show') : T('deliver') }}
                  button(type="button" class="jl-skip" :aria-label="T('skip')" @click="skip(b.i)") ✕
              template(v-else)
                span(class="jl-wait") {{ T('nextOrder') }}

        //- the store
        template(v-else-if="panel.kind === 'store'")
          h2(class="jl-title") {{ T('store') }}
          div(class="jl-stores")
            div(v-for="sv in storeViews" :key="sv.id" class="jl-store")
              div(class="jl-store-head")
                img(:src="iconUrl(sv.id === 'barn' ? 'scheune-0' : 'speicher-0')" alt="" class="jl-store-ico" @error="hideBroken")
                div(class="jl-store-text")
                  b {{ T(sv.id === 'barn' ? 'barn' : 'granary') }} · {{ T('levelShort', { n: sv.level }) }}
                  span {{ sv.used }} / {{ sv.cap }}
                  span(class="jl-meter")
                    span(:style="{ width: Math.min(100, (sv.used / sv.cap) * 100) + '%' }")
              div(v-if="sv.up" class="jl-up")
                div(class="jl-cost")
                  span(v-if="!sv.up.levelOk" class="jl-lock") {{ T('levelShort', { n: sv.up.level }) }}
                  span(class="jl-cost-i")
                    img(:src="coinIcon" alt="" class="jl-coin jl-coin--s" @error="hideBroken")
                    | {{ sv.up.coins }}
                  span(v-for="g in sv.up.goods" :key="g.good" class="jl-cost-i" :class="{ 'is-bad': !g.ok }")
                    img(:src="goodIcon(g.good)" alt="" @error="hideBroken")
                    | {{ g.n }}
                button(type="button" class="jl-go" :disabled="!sv.up.ok" :data-test="'jl-up-' + sv.id" @click="doUpgradeStore(sv.id)") {{ T('upgrade') }}
              p(v-else class="jl-text jl-text--s") {{ T('maxed') }}
          p(v-if="!storeGoods.length" class="jl-text") {{ T('storeEmpty') }}
          div(class="jl-goods")
            div(v-for="g in storeGoods" :key="g.good" class="jl-good")
              img(:src="goodIcon(g.good)" alt="" @error="hideBroken")
              b {{ g.n }}
              span {{ goodName(g.good) }}
              button(type="button" class="jl-sell" :data-test="'jl-sell-' + g.good" @click="sellOne(g.good)")
                img(:src="coinIcon" alt="" class="jl-coin jl-coin--s" @error="hideBroken")
                | {{ GOODS[g.good].price }}
          p(class="jl-text jl-text--s") {{ T('sellInfo') }}

        //- the land
        template(v-else-if="panel.kind === 'land'")
          h2(class="jl-title") {{ T('land') }}
          div(class="jl-landlist")
            button(v-for="p in landList" :key="p.id" type="button" class="jl-landrow" :class="{ 'is-open': p.open }" :data-test="'jl-landrow-' + p.id" @click="p.open ? goTo(p.id) : (panel = { kind: 'parcel', ref: String(p.id) })")
              span(class="jl-land-name") {{ p.name }}
              span(v-if="p.open" class="jl-land-go") {{ T('show') }}
              span(v-else class="jl-cost")
                span(v-if="!p.levelOk" class="jl-lock") {{ T('levelShort', { n: p.level }) }}
                span(class="jl-cost-i" :class="{ 'is-bad': !p.afford }")
                  img(:src="coinIcon" alt="" class="jl-coin jl-coin--s" @error="hideBroken")
                  | {{ p.cost }}
          h3(class="jl-sub") {{ T('buildings') }}
          div(class="jl-landlist")
            button(v-for="b in BUILDING_IDS" :key="b" type="button" class="jl-landrow" :class="{ 'is-open': G.buildings[b].built }" @click="panel = { kind: 'build', ref: b }")
              img(:src="iconUrl(BUILDING_FILE[b] + '-0')" alt="" class="jl-land-pic" @error="hideBroken")
              span(class="jl-land-name") {{ T('building.' + b) }}
              span(v-if="G.buildings[b].built" class="jl-land-go") {{ T('levelShort', { n: G.buildings[b].level }) }}
              span(v-else-if="G.level < BUILDINGS[b].level" class="jl-lock") {{ T('levelShort', { n: BUILDINGS[b].level }) }}
              span(v-else class="jl-land-go") {{ BUILDINGS[b].cost }}
          h3(class="jl-sub") {{ T('animals') }}
          div(class="jl-landlist")
            button(v-for="a in ANIMAL_IDS" :key="a" type="button" class="jl-landrow" :class="{ 'is-open': animalCount(G, a) > 0 }" @click="panel = { kind: 'pen', ref: a }")
              img(:src="iconUrl(ANIMAL_FILE[a] + '-a')" alt="" class="jl-land-pic" @error="hideBroken")
              span(class="jl-land-name") {{ T('animal.' + a) }}
              span(v-if="G.level < ANIMALS[a].level" class="jl-lock") {{ T('levelShort', { n: ANIMALS[a].level }) }}
              span(v-else class="jl-land-go") {{ animalCount(G, a) }}/{{ penCapacity(G, a) }}

        //- the seeds
        template(v-else-if="panel.kind === 'seed'")
          h2(class="jl-title") {{ T('seedTitle') }}
          div(class="jl-seeds")
            button(v-for="s in seedList" :key="s.id" type="button" class="jl-seedrow" :class="{ 'is-locked': !s.levelOk }" :disabled="!s.levelOk" :data-test="'jl-seed-' + s.id" @click="chooseSeed(s.id)")
              img(:src="goodIcon(s.id)" alt="" @error="hideBroken")
              span(class="jl-seed-name") {{ goodName(s.id) }}
              span(class="jl-seed-info") {{ s.def.grow }} {{ T('sec') }} · ×{{ s.yield }}
              span(v-if="!s.levelOk" class="jl-lock") {{ T('levelShort', { n: s.def.level }) }}
              span(v-else class="jl-cost-i" :class="{ 'is-bad': !s.afford }")
                img(:src="coinIcon" alt="" class="jl-coin jl-coin--s" @error="hideBroken")
                | {{ s.def.seed }}
          p(class="jl-text jl-text--s") {{ T('seedInfo') }}

        //- a workshop
        template(v-else-if="panel.kind === 'build' && buildPanel")
          h2(class="jl-title") {{ T('building.' + buildPanel.id) }}
          img(:src="iconUrl(BUILDING_FILE[buildPanel.id] + '-' + (buildPanel.level >= 3 ? 1 : 0))" alt="" class="jl-panel-pic" @error="hideBroken")
          p(class="jl-text jl-text--s") {{ T('buildingInfo.' + buildPanel.id) }}
          template(v-if="!buildPanel.built")
            p(v-if="!buildPanel.parcelOpen" class="jl-text") {{ T('needLand') }}
            p(v-else-if="!buildPanel.levelOk" class="jl-text") {{ T('needLevel', { n: buildPanel.def.level }) }}
            div(v-else class="jl-cost")
              span(class="jl-cost-i" :class="{ 'is-bad': !buildPanel.affordable }")
                img(:src="coinIcon" alt="" class="jl-coin jl-coin--s" @error="hideBroken")
                | {{ buildPanel.def.cost }}
            AdvButton(:disabled="!buildPanel.parcelOpen || !buildPanel.levelOk || !buildPanel.affordable" data-test="jl-build" @click="buildHere(buildPanel.id)") {{ T('buildIt') }}
          template(v-else)
            div(class="jl-queue")
              span(class="jl-queue-l") {{ T('queue') }} {{ buildPanel.queue.length }}/{{ buildPanel.cap }}
              div(class="jl-queue-row")
                span(v-for="(q, i) in buildPanel.queue" :key="i" class="jl-qslot" :class="{ 'is-ready': q.ready }")
                  img(:src="goodIcon(q.good)" alt="" @error="hideBroken")
                  small(v-if="!q.ready") {{ timeText(q.left) }}
                span(v-for="k in Math.max(0, buildPanel.cap - buildPanel.queue.length)" :key="'e' + k" class="jl-qslot is-empty")
            button(v-if="buildPanel.ready > 0" type="button" class="jl-go jl-go--wide" data-test="jl-collect" @click="collectBuilding") {{ T('collect', { n: buildPanel.ready }) }}
            div(class="jl-recipes")
              div(v-for="r in buildPanel.recipes" :key="r.id" class="jl-recipe" :class="{ 'is-locked': !r.levelOk }")
                img(:src="goodIcon(r.good)" alt="" class="jl-recipe-pic" @error="hideBroken")
                div(class="jl-recipe-t")
                  b {{ goodName(r.good) }}
                  span(class="jl-recipe-in")
                    span(v-for="x in r.inputs" :key="x.good" class="jl-cost-i" :class="{ 'is-bad': !x.ok }")
                      img(:src="goodIcon(x.good)" alt="" @error="hideBroken")
                      | {{ x.n }}
                    span(v-if="!r.inputs.length") {{ T('free') }}
                    span(class="jl-time") {{ r.secs }} {{ T('sec') }}
                span(v-if="!r.levelOk" class="jl-lock") {{ T('levelShort', { n: r.level }) }}
                button(v-else type="button" class="jl-go" :disabled="!r.ok || r.full" :data-test="'jl-make-' + r.id" @click="makeRecipe(r.id)") {{ T('make') }}
            div(v-if="buildPanel.up" class="jl-up")
              div(class="jl-cost")
                span(v-if="!buildPanel.up.levelOk" class="jl-lock") {{ T('levelShort', { n: buildPanel.up.level }) }}
                span(class="jl-cost-i")
                  img(:src="coinIcon" alt="" class="jl-coin jl-coin--s" @error="hideBroken")
                  | {{ buildPanel.up.coins }}
                span(v-for="g in buildPanel.up.goods" :key="g.good" class="jl-cost-i" :class="{ 'is-bad': !g.ok }")
                  img(:src="goodIcon(g.good)" alt="" @error="hideBroken")
                  | {{ g.n }}
              button(type="button" class="jl-go" :disabled="!buildPanel.up.ok" data-test="jl-upgrade" @click="doUpgradeBuilding(buildPanel.id)") {{ T('upgrade') }} ({{ buildPanel.level }}→{{ buildPanel.level + 1 }})
            p(v-else class="jl-text jl-text--s") {{ T('maxed') }}

        //- a pen
        template(v-else-if="panel.kind === 'pen' && penPanel")
          h2(class="jl-title") {{ T('animal.' + penPanel.id) }}
          img(:src="iconUrl(ANIMAL_FILE[penPanel.id] + '-a')" alt="" class="jl-panel-pic" @error="hideBroken")
          p(class="jl-text jl-text--s") {{ T('animalInfo', { feed: goodName(penPanel.def.feed), n: penPanel.def.feedN, product: goodName(penPanel.def.product), s: penPanel.def.time }) }}
          p(v-if="penPanel.id === 'donkey'" class="jl-text jl-text--s") {{ T('siltInfo') }}
          p(class="jl-text") {{ penPanel.count }} / {{ penPanel.cap }}
          p(v-if="!penPanel.levelOk" class="jl-text") {{ T('needLevel', { n: penPanel.def.level }) }}
          div(v-else class="jl-pen-btns")
            button(type="button" class="jl-go" :disabled="penPanel.full || !penPanel.afford" data-test="jl-buy-animal" @click="buyAnimalHere(penPanel.id)")
              img(:src="coinIcon" alt="" class="jl-coin jl-coin--s" @error="hideBroken")
              | {{ penPanel.price }} · {{ T('buyAnimal') }}
            button(v-if="penPanel.hungry > 0" type="button" class="jl-go" data-test="jl-feed-all" @click="feedAll(penPanel.id)")
              img(:src="goodIcon(penPanel.def.feed)" alt="" class="jl-coin jl-coin--s" @error="hideBroken")
              | {{ T('feedAll') }}
            button(v-if="penPanel.ready > 0" type="button" class="jl-go" @click="collectAll(penPanel.id)")
              img(:src="goodIcon(penPanel.def.product)" alt="" class="jl-coin jl-coin--s" @error="hideBroken")
              | {{ T('collectAll') }}
          div(v-if="penPanel.up" class="jl-up")
            div(class="jl-cost")
              span(v-if="!penPanel.up.levelOk" class="jl-lock") {{ T('levelShort', { n: penPanel.up.level }) }}
              span(class="jl-cost-i")
                img(:src="coinIcon" alt="" class="jl-coin jl-coin--s" @error="hideBroken")
                | {{ penPanel.up.coins }}
            button(type="button" class="jl-go" :disabled="!penPanel.up.ok" @click="doUpgradePen(penPanel.id)") {{ T('bigger') }}

        //- a piece of land
        template(v-else-if="panel.kind === 'parcel' && parcelPanel")
          h2(class="jl-title") {{ roleName(parcelPanel.def) }}
          p(class="jl-text") {{ T('roleInfo.' + parcelPanel.def.role) }}
          p(v-if="!parcelPanel.levelOk" class="jl-text") {{ T('needLevel', { n: parcelPanel.def.level }) }}
          div(v-else class="jl-cost")
            span(class="jl-cost-i" :class="{ 'is-bad': !parcelPanel.afford }")
              img(:src="coinIcon" alt="" class="jl-coin jl-coin--s" @error="hideBroken")
              | {{ parcelPanel.def.cost }}
          AdvButton(:disabled="!parcelPanel.levelOk || !parcelPanel.afford" data-test="jl-buy-land" @click="buyLand(parcelPanel.def.id)") {{ T('buyLand') }}

        //- decoration
        template(v-else-if="panel.kind === 'decor'")
          h2(class="jl-title") {{ T('decorTitle') }}
          div(class="jl-decors")
            button(v-for="d in decorList" :key="d.id" type="button" class="jl-decor" :class="{ 'is-locked': !d.levelOk, 'is-bad': d.levelOk && !d.afford }" :disabled="!d.levelOk" :data-test="'jl-decor-' + d.id" @click="putDecor(d.id)")
              img(:src="iconUrl('d-' + d.id)" alt="" @error="hideBroken")
              span {{ T('decor.' + d.id) }}
              span(v-if="!d.levelOk" class="jl-lock") {{ T('levelShort', { n: d.def.level }) }}
              span(v-else class="jl-cost-i")
                img(:src="coinIcon" alt="" class="jl-coin jl-coin--s" @error="hideBroken")
                | {{ d.def.cost }}
          button(v-if="G.decor[panel.ref ?? '']" type="button" class="jl-skip jl-skip--wide" @click="removeDecor") {{ T('removeDecor') }}

        //- the years
        template(v-else-if="panel.kind === 'year'")
          h2(class="jl-title") {{ T('yearTitle') }}
          div(class="jl-ears-big")
            img(v-for="(e, i) in yearEars" :key="i" :src="iconUrl(e.fat ? 'z-aehre-voll' : 'z-aehre-duenn')" alt="" class="jl-ear-big" :class="{ 'is-done': e.done, 'is-now': e.now }" @error="hideBroken")
          p(class="jl-text jl-good") {{ T(view.year.phase === 'fat' ? 'yearNowFat' : 'yearNowLean', { n: yearNth }) }}
          p(class="jl-text") {{ T('yearStory') }}
          p(class="jl-text jl-text--s") {{ T('yearRule') }}
          p(class="jl-text jl-good") {{ T('yearGrain', { n: view.granaryUsed, need: needGrain }) }}
          p(class="jl-text jl-text--s") {{ T('yearFactor', { p: Math.round(view.year.factor * 100) }) }}
          p(class="jl-text jl-text--s") {{ T('yearRef') }}

        //- goals
        template(v-else-if="panel.kind === 'goals'")
          h2(class="jl-title") {{ T('goals') }}
          div(class="jl-tabs")
            button(v-for="k in goalTabs" :key="k" type="button" class="jl-tab" :class="{ 'is-on': goalsTab === k }" :data-test="'jl-tab-' + k" @click="setTab(k)") {{ T('tab.' + k) }}
          template(v-if="goalsTab === 'chapters'")
            p(class="jl-text jl-text--s") {{ T('starsTotal', { n: view.stars, max: MAX_STARS }) }}
            div(v-for="ch in chapters" :key="ch.c" class="jl-chapter" :class="{ 'is-current': ch.current }")
              div(class="jl-chapter-head")
                b {{ ch.c + 1 }}. {{ T('chapter.' + ch.c + '.title') }}
                AdventureStars(:stars="ch.stars" :size="20")
              p(v-if="ch.current" class="jl-text jl-text--s") {{ T('chapter.' + ch.c + '.story') }}
              p(v-if="ch.current" class="jl-text jl-task") {{ T('chapter.' + ch.c + '.task') }}
              div(v-for="g in ch.goals" :key="g.id" class="jl-goal" :class="{ 'is-done': g.done }")
                span(class="jl-goal-check") {{ g.done ? '✔' : '○' }}
                span(class="jl-goal-text") {{ g.text }}
                span(v-if="!g.done" class="jl-goal-n") {{ g.have }}/{{ g.target }}
                span(v-else class="jl-goal-n") +{{ g.coins }}
          template(v-else-if="goalsTab === 'daily'")
            p(class="jl-text jl-text--s") {{ T('dailyInfo', { coins: dailyPay.coins, xp: dailyPay.xp }) }}
            div(v-for="d in dailyList" :key="d.id" class="jl-goal jl-goal--big" :class="{ 'is-done': d.done }")
              span(class="jl-goal-check") {{ d.done ? '✔' : '○' }}
              span(class="jl-goal-text") {{ d.text }}
              span(class="jl-goal-n") {{ d.have }}/{{ d.target }}
          template(v-else)
            p(class="jl-text jl-text--s") {{ T('albumInfo', { n: album.count, max: album.total }) }}
            div(v-for="s in album.sections" :key="s.key" class="jl-album-sec")
              h3(class="jl-sub") {{ T('album.' + s.key) }}
              div(class="jl-album")
                div(v-for="it in s.items" :key="it.key" class="jl-album-item" :class="{ 'is-seen': it.seen }")
                  img(:src="iconUrl(it.pic)" alt="" @error="hideBroken")
                  small {{ it.seen ? it.name : '?' }}
</template>

<style scoped lang="sass">
.jl
  position: fixed
  inset: 0
  z-index: 60
  background: #e6cd96
  overflow: hidden
  user-select: none
  -webkit-user-select: none
  touch-action: none
  font-family: inherit

.jl-canvas
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  touch-action: none

.jl-center
  position: absolute
  inset: 0
  display: grid
  place-items: center

.jl-spinner
  width: 46px
  height: 46px
  border-radius: 50%
  border: 5px solid rgba(255, 255, 255, 0.4)
  border-top-color: #f5c84a
  animation: jl-spin 0.9s linear infinite

@keyframes jl-spin
  to
    transform: rotate(360deg)

// ── the top ──────────────────────────────────────────────────────────────────
.jl-top
  position: absolute
  top: 0
  left: 0
  right: 0
  display: flex
  align-items: center
  gap: 10px
  flex-wrap: wrap
  padding: max(8px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) 4px max(12px, env(safe-area-inset-left))
  pointer-events: none

.jl-top > *
  pointer-events: auto

.jl-round
  width: 48px
  height: 48px
  border: none
  border-radius: 50%
  background: rgba(255, 252, 240, 0.92)
  color: #4a3410
  font-size: 1.5rem
  font-weight: 800
  box-shadow: 0 3px 10px rgba(60, 40, 10, 0.3)
  cursor: pointer

.jl-level
  --p: 0%
  position: relative
  width: 52px
  height: 52px
  border-radius: 50%
  display: grid
  place-items: center
  background: conic-gradient(#f2b93b var(--p), rgba(255, 252, 240, 0.55) 0)
  box-shadow: 0 3px 10px rgba(60, 40, 10, 0.3)

.jl-level::before
  content: ''
  position: absolute
  inset: 5px
  border-radius: 50%
  background: #fffaf0

.jl-level-n
  position: relative
  font-weight: 900
  font-size: 1.25rem
  color: #5a3d14

.jl-coins
  display: flex
  align-items: center
  gap: 6px
  padding: 8px 16px 8px 10px
  border-radius: 24px
  background: rgba(255, 252, 240, 0.92)
  font-weight: 900
  font-size: 1.2rem
  color: #5a3d14
  box-shadow: 0 3px 10px rgba(60, 40, 10, 0.3)

.jl-coin
  height: 28px
  width: auto
  vertical-align: middle

  &--s
    height: 18px
    margin-right: 3px

.jl-years
  flex: 1 1 100%
  display: flex
  flex-direction: column
  align-items: center
  gap: 3px
  max-width: 340px
  margin: 0 auto
  padding: 5px 10px 6px
  border: none
  border-radius: 14px
  background: rgba(255, 252, 240, 0.88)
  cursor: pointer
  box-shadow: 0 3px 10px rgba(60, 40, 10, 0.25)

.jl-ears
  display: flex
  gap: 2px

.jl-ear
  width: 20px
  height: 28px
  object-fit: contain
  opacity: 0.4

  &.is-done
    opacity: 0.85

  &.is-now
    opacity: 1
    transform: scale(1.3) translateY(-2px)
    filter: drop-shadow(0 0 3px #f2b93b)

.jl-year-bar
  width: 100%
  height: 6px
  border-radius: 3px
  background: rgba(90, 60, 20, 0.22)
  overflow: hidden

.jl-year-fill
  display: block
  height: 100%
  background: #7bbf4f

.jl-years.is-lean .jl-year-fill
  background: #c4863a

.jl-zoom
  position: absolute
  right: max(12px, env(safe-area-inset-right))
  top: 50%
  transform: translateY(-50%)
  display: flex
  flex-direction: column
  gap: 8px

.jl-tip
  position: absolute
  left: 50%
  bottom: calc(96px + env(safe-area-inset-bottom))
  transform: translateX(-50%)
  max-width: min(92vw, 420px)
  padding: 10px 18px
  border-radius: 20px
  background: rgba(60, 40, 10, 0.86)
  color: #fff6dc
  font-weight: 700
  text-align: center
  pointer-events: none

.jl-seed
  position: absolute
  left: 50%
  bottom: calc(150px + env(safe-area-inset-bottom))
  transform: translateX(-50%)
  display: flex
  align-items: center
  gap: 8px
  padding: 6px 8px 6px 12px
  border-radius: 26px
  background: rgba(255, 252, 240, 0.95)
  font-weight: 800
  color: #5a3d14
  box-shadow: 0 3px 10px rgba(60, 40, 10, 0.3)

.jl-seed-ico
  height: 34px
  width: auto

.jl-x
  width: 46px
  height: 46px
  border: none
  border-radius: 50%
  background: #e9dcc0
  font-weight: 800
  cursor: pointer

.jl-info
  position: absolute
  left: 50%
  bottom: calc(150px + env(safe-area-inset-bottom))
  transform: translateX(-50%)
  display: flex
  align-items: center
  gap: 10px
  padding: 8px 12px
  border-radius: 24px
  background: rgba(255, 252, 240, 0.96)
  font-weight: 800
  color: #5a3d14
  box-shadow: 0 3px 10px rgba(60, 40, 10, 0.3)

.jl-info-ico
  height: 32px
  width: auto

.jl-mini
  display: flex
  align-items: center
  gap: 5px
  min-height: 44px
  padding: 4px 12px
  border: none
  border-radius: 22px
  background: #8a6a3a
  color: #fff
  font-weight: 800
  cursor: pointer

  img
    height: 26px

// ── the bottom bar ───────────────────────────────────────────────────────────
.jl-bar
  position: absolute
  left: 0
  right: 0
  bottom: 0
  display: flex
  justify-content: center
  gap: 10px
  padding: 8px max(10px, env(safe-area-inset-right)) calc(10px + env(safe-area-inset-bottom)) max(10px, env(safe-area-inset-left))
  background: linear-gradient(180deg, rgba(60, 40, 10, 0), rgba(60, 40, 10, 0.32))
  pointer-events: none

.jl-bar > *
  pointer-events: auto

.jl-btn
  position: relative
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  gap: 2px
  width: 78px
  min-height: 70px
  padding: 6px 4px
  border: none
  border-radius: 20px
  background: rgba(255, 252, 240, 0.96)
  color: #5a3d14
  font-weight: 800
  cursor: pointer
  box-shadow: 0 4px 12px rgba(60, 40, 10, 0.35)

  &:active
    transform: scale(0.96)

.jl-btn-ico
  height: 38px
  width: auto
  max-width: 60px
  object-fit: contain

.jl-btn-l
  font-size: 0.78rem
  line-height: 1

.jl-badge
  position: absolute
  top: -6px
  right: -4px
  min-width: 24px
  height: 24px
  padding: 0 6px
  display: grid
  place-items: center
  border-radius: 12px
  background: #d24b3a
  color: #fff
  font-size: 0.85rem
  font-weight: 900

  &--star
    background: #e0a526
    color: #4a3410

.jl-toasts
  position: absolute
  top: calc(112px + env(safe-area-inset-top))
  left: 50%
  transform: translateX(-50%)
  display: flex
  flex-direction: column
  align-items: center
  gap: 6px
  width: min(92vw, 420px)
  pointer-events: none

.jl-toast
  display: flex
  align-items: center
  gap: 8px
  padding: 8px 16px
  border-radius: 20px
  background: rgba(255, 252, 240, 0.96)
  color: #5a3d14
  font-weight: 800
  box-shadow: 0 3px 10px rgba(60, 40, 10, 0.3)
  animation: jl-pop 0.25s ease-out

  &.is-bad
    background: #fbe3d6

  &.is-good
    background: #e7f4d2

.jl-toast-ico
  height: 28px
  width: auto

@keyframes jl-pop
  from
    transform: scale(0.8)
    opacity: 0

// ── cards and sheets ─────────────────────────────────────────────────────────
.jl-dim
  position: absolute
  inset: 0
  display: flex
  align-items: flex-end
  justify-content: center
  background: rgba(30, 20, 8, 0.45)

  &--full
    align-items: center
    padding: 14px
    overflow-y: auto

.jl-card
  width: min(520px, 100%)
  max-height: 100%
  overflow-y: auto
  padding: 18px 20px 16px
  border-radius: 24px
  background: var(--lk-surface, #fffaf0)
  color: var(--lk-text, #2a2418)
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.45)
  display: flex
  flex-direction: column
  align-items: center
  gap: 10px
  text-align: center

.jl-small
  width: min(420px, 100%)

.jl-intro-pic
  width: 100%
  max-height: 34vh
  object-fit: cover
  border-radius: 16px

.jl-title
  margin: 0
  font-size: 1.45rem
  font-weight: 800
  line-height: 1.15

.jl-sub
  margin: 8px 0 2px
  font-size: 1.05rem
  font-weight: 800
  align-self: flex-start

.jl-ref
  margin: -6px 0 0
  font-size: 0.85rem
  color: var(--lk-muted, #7a6b4f)

.jl-text
  margin: 0
  line-height: 1.4

  &--s
    font-size: 0.86rem
    color: var(--lk-muted, #7a6b4f)

.jl-task
  font-weight: 800
  color: #8a5a10

.jl-good
  font-weight: 800
  color: #3f7d2a

.jl-modal-ico
  height: 90px
  width: auto

.jl-big-level
  display: grid
  place-items: center
  width: 96px
  height: 96px
  border-radius: 50%
  background: radial-gradient(circle at 35% 30%, #ffe28a, #e0a526)
  font-size: 3rem
  font-weight: 900
  color: #5a3d14
  box-shadow: 0 6px 18px rgba(120, 80, 10, 0.5)

.jl-unlock-row
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 10px

.jl-unlock
  display: flex
  flex-direction: column
  align-items: center
  gap: 2px
  width: 84px
  font-size: 0.78rem
  font-weight: 700

  img
    height: 54px
    width: auto
    max-width: 80px
    object-fit: contain

.jl-how
  width: min(460px, 100%)

.jl-how-row
  display: flex
  align-items: center
  gap: 12px
  text-align: left
  width: 100%

  p
    margin: 0
    line-height: 1.35

.jl-how-ico
  height: 50px
  width: 50px
  object-fit: contain
  flex: none

.jl-sheet
  position: relative
  width: min(720px, 100%)
  max-height: 82vh
  overflow-y: auto
  padding: 16px 16px calc(18px + env(safe-area-inset-bottom))
  border-radius: 26px 26px 0 0
  background: var(--lk-surface, #fffaf0)
  color: var(--lk-text, #2a2418)
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.4)
  display: flex
  flex-direction: column
  gap: 10px
  align-items: stretch
  text-align: center

.jl-sheet-x
  position: absolute
  top: 10px
  right: 10px
  width: 44px
  height: 44px
  border: none
  border-radius: 50%
  background: #efe3c6
  font-size: 1.1rem
  font-weight: 800
  cursor: pointer

.jl-panel-pic
  align-self: center
  max-height: 120px
  width: auto
  max-width: 60%
  object-fit: contain

// orders
.jl-orders
  display: grid
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr))
  gap: 10px

.jl-order
  display: flex
  flex-direction: column
  gap: 6px
  padding: 10px
  border: 2px solid var(--lk-line, #e3d7bb)
  border-radius: 18px
  background: var(--lk-surface-2, #f6efdc)

  &.is-can
    border-color: #7bbf4f
    background: #eef7dc

  &.is-empty
    place-items: center
    justify-content: center
    min-height: 90px
    opacity: 0.7

.jl-wait
  color: var(--lk-muted, #7a6b4f)
  font-weight: 700

.jl-who
  display: flex
  align-items: center
  gap: 8px
  font-weight: 800
  font-size: 0.85rem
  text-align: left

  img
    height: 40px
    width: auto
    max-width: 52px
    object-fit: contain

.jl-lines
  display: flex
  flex-wrap: wrap
  gap: 6px
  justify-content: center

.jl-line
  display: flex
  align-items: center
  gap: 4px
  padding: 3px 8px 3px 4px
  border-radius: 14px
  background: #fff
  font-size: 0.9rem

  img
    height: 34px
    width: 34px
    object-fit: contain

  b
    color: #b5472f

  &.is-ok b
    color: #3f7d2a

.jl-pay
  display: flex
  justify-content: center
  gap: 14px
  font-weight: 800

.jl-pay-c
  display: flex
  align-items: center

.jl-pay-x
  color: #3b6fa3

.jl-order-note
  margin: 0
  font-size: 0.8rem
  color: var(--lk-muted, #7a6b4f)

.jl-order-btns
  display: flex
  gap: 8px
  justify-content: center

// buttons in sheets
.jl-go
  display: inline-flex
  align-items: center
  justify-content: center
  gap: 6px
  min-height: 48px
  padding: 8px 18px
  border: none
  border-radius: 24px
  background: var(--lk-accent, #1f6a6a)
  color: var(--lk-on-accent, #fff)
  font: inherit
  font-weight: 800
  cursor: pointer

  &:disabled
    opacity: 0.45
    cursor: default

  &--wide
    align-self: center

.jl-skip
  width: 48px
  min-height: 48px
  border: none
  border-radius: 24px
  background: #efe3c6
  font-weight: 800
  cursor: pointer

  &--wide
    width: auto
    padding: 0 18px
    align-self: center

.jl-cost
  display: flex
  flex-wrap: wrap
  align-items: center
  justify-content: center
  gap: 8px

.jl-cost-i
  display: inline-flex
  align-items: center
  gap: 3px
  padding: 2px 8px 2px 4px
  border-radius: 12px
  background: #fff
  font-weight: 800
  color: #5a3d14

  img
    height: 22px
    width: auto
    max-width: 30px
    object-fit: contain

  &.is-bad
    color: #b5472f
    background: #fbe3d6

.jl-lock
  padding: 2px 10px
  border-radius: 12px
  background: #4c3a24
  color: #fff6dc
  font-weight: 800
  font-size: 0.85rem

.jl-up
  display: flex
  flex-direction: column
  align-items: center
  gap: 8px
  padding-top: 8px
  border-top: 1px dashed var(--lk-line, #e3d7bb)

// the store
.jl-stores
  display: grid
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr))
  gap: 10px

.jl-store
  display: flex
  flex-direction: column
  gap: 8px
  padding: 10px
  border-radius: 18px
  background: var(--lk-surface-2, #f6efdc)

.jl-store-head
  display: flex
  align-items: center
  gap: 10px
  text-align: left

.jl-store-ico
  height: 64px
  width: auto
  max-width: 90px
  object-fit: contain

.jl-store-text
  display: flex
  flex-direction: column
  gap: 2px
  flex: 1

.jl-meter
  display: block
  height: 8px
  border-radius: 4px
  background: rgba(90, 60, 20, 0.2)
  overflow: hidden

  span
    display: block
    height: 100%
    background: #e0a526

.jl-goods
  display: grid
  grid-template-columns: repeat(auto-fill, minmax(104px, 1fr))
  gap: 8px

.jl-good
  display: flex
  flex-direction: column
  align-items: center
  gap: 2px
  padding: 8px 4px
  border-radius: 14px
  background: var(--lk-surface-2, #f6efdc)
  font-size: 0.8rem

  img
    height: 44px
    width: 44px
    object-fit: contain

  b
    font-size: 1.05rem

.jl-sell
  display: inline-flex
  align-items: center
  min-height: 40px
  padding: 4px 12px
  border: none
  border-radius: 20px
  background: #e9dcc0
  font-weight: 800
  cursor: pointer

// land list
.jl-landlist
  display: flex
  flex-direction: column
  gap: 6px

.jl-landrow
  display: flex
  align-items: center
  gap: 10px
  min-height: 52px
  padding: 6px 14px
  border: 2px solid var(--lk-line, #e3d7bb)
  border-radius: 16px
  background: var(--lk-surface-2, #f6efdc)
  color: inherit
  font: inherit
  font-weight: 700
  text-align: left
  cursor: pointer

  &.is-open
    background: #eef7dc
    border-color: #a7cf80

.jl-land-name
  flex: 1

.jl-land-go
  font-weight: 800
  color: #3f7d2a

.jl-land-pic
  height: 38px
  width: 46px
  object-fit: contain

// seeds
.jl-seeds
  display: flex
  flex-direction: column
  gap: 8px

.jl-seedrow
  display: flex
  align-items: center
  gap: 10px
  min-height: 64px
  padding: 6px 14px
  border: 2px solid var(--lk-line, #e3d7bb)
  border-radius: 18px
  background: var(--lk-surface-2, #f6efdc)
  color: inherit
  font: inherit
  text-align: left
  cursor: pointer

  img
    height: 48px
    width: 48px
    object-fit: contain

  &.is-locked
    opacity: 0.55

.jl-seed-name
  font-weight: 800
  flex: 1

.jl-seed-info
  font-size: 0.85rem
  color: var(--lk-muted, #7a6b4f)

// workshops
.jl-queue
  display: flex
  flex-direction: column
  align-items: center
  gap: 6px

.jl-queue-row
  display: flex
  gap: 8px
  flex-wrap: wrap
  justify-content: center

.jl-qslot
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  width: 64px
  height: 64px
  border-radius: 14px
  background: var(--lk-surface-2, #f6efdc)
  border: 2px dashed var(--lk-line, #e3d7bb)
  font-size: 0.7rem

  img
    height: 36px
    width: 36px
    object-fit: contain

  &.is-ready
    border: 2px solid #7bbf4f
    background: #eef7dc

  &.is-empty
    opacity: 0.5

.jl-recipes
  display: flex
  flex-direction: column
  gap: 8px

.jl-recipe
  display: flex
  align-items: center
  gap: 10px
  padding: 6px 10px
  border-radius: 16px
  background: var(--lk-surface-2, #f6efdc)
  text-align: left

  &.is-locked
    opacity: 0.55

.jl-recipe-pic
  height: 52px
  width: 52px
  object-fit: contain

.jl-recipe-t
  display: flex
  flex-direction: column
  gap: 2px
  flex: 1

.jl-recipe-in
  display: flex
  align-items: center
  flex-wrap: wrap
  gap: 6px
  font-size: 0.85rem

.jl-time
  color: var(--lk-muted, #7a6b4f)

.jl-pen-btns
  display: flex
  flex-wrap: wrap
  gap: 8px
  justify-content: center

// decor
.jl-decors
  display: grid
  grid-template-columns: repeat(auto-fill, minmax(112px, 1fr))
  gap: 8px

.jl-decor
  display: flex
  flex-direction: column
  align-items: center
  gap: 3px
  padding: 8px 4px
  border: 2px solid var(--lk-line, #e3d7bb)
  border-radius: 16px
  background: var(--lk-surface-2, #f6efdc)
  color: inherit
  font: inherit
  font-size: 0.82rem
  font-weight: 700
  cursor: pointer

  img
    height: 56px
    width: auto
    max-width: 90px
    object-fit: contain

  &.is-locked
    opacity: 0.5

// years
.jl-ears-big
  display: flex
  justify-content: center
  flex-wrap: wrap
  gap: 3px

.jl-ear-big
  width: 38px
  height: 54px
  object-fit: contain
  opacity: 0.45

  &.is-done
    opacity: 0.9

  &.is-now
    opacity: 1
    transform: scale(1.25)
    filter: drop-shadow(0 0 4px #f2b93b)

// goals
.jl-tabs
  display: flex
  gap: 6px
  justify-content: center

.jl-tab
  min-height: 44px
  padding: 6px 16px
  border: none
  border-radius: 22px
  background: #efe3c6
  font: inherit
  font-weight: 800
  cursor: pointer

  &.is-on
    background: var(--lk-accent, #1f6a6a)
    color: var(--lk-on-accent, #fff)

.jl-chapter
  display: flex
  flex-direction: column
  gap: 4px
  padding: 10px 12px
  border-radius: 16px
  background: var(--lk-surface-2, #f6efdc)
  text-align: left

  &.is-current
    border: 2px solid #e0a526

.jl-chapter-head
  display: flex
  align-items: center
  justify-content: space-between
  gap: 8px

.jl-goal
  display: flex
  align-items: center
  gap: 8px
  font-size: 0.9rem

  &.is-done
    color: #3f7d2a
    font-weight: 700

  &--big
    padding: 10px 12px
    border-radius: 14px
    background: var(--lk-surface-2, #f6efdc)
    font-size: 1rem

.jl-goal-text
  flex: 1
  text-align: left

.jl-goal-n
  font-weight: 800

.jl-album
  display: grid
  grid-template-columns: repeat(auto-fill, minmax(78px, 1fr))
  gap: 6px

.jl-album-item
  display: flex
  flex-direction: column
  align-items: center
  gap: 2px
  padding: 6px 2px
  border-radius: 12px
  background: var(--lk-surface-2, #f6efdc)
  opacity: 0.5

  img
    height: 40px
    width: auto
    max-width: 64px
    object-fit: contain
    filter: grayscale(1) brightness(0.55)

  small
    font-size: 0.68rem
    line-height: 1.1

  &.is-seen
    opacity: 1

    img
      filter: none

@media (min-width: 720px)
  .jl-dim
    align-items: center

  .jl-sheet
    border-radius: 26px

@media (max-height: 520px)
  .jl-btn
    min-height: 56px
    width: 70px

  .jl-btn-ico
    height: 28px
</style>
