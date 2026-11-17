<script setup lang="ts">
/**
 * "Karawane über die Dünen": the third big game, a driving game like Hill Climb Racing (rules and physics in `utils/karawaneGame.ts`, the
 * workshop in `utils/karawaneUpgrades.ts`; this file draws and takes the touch). A cart pulled by an animal drives over hills and dunes of
 * six routes. The screen is split in two: touching the right half is gas, the left half is brake. Coins buy better parts in the workshop.
 * The picture is drawn with a fixed step of the physics; on a phone held upright a note asks to turn it.
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
import { META } from '@/utils/karawaneArtMeta'
import {
  FOOT_R,
  ROUTES,
  ROUTE_COUNT,
  generateTrack,
  heightAt,
  hop,
  newRun,
  speedLimit,
  starsForTime,
  stepRun,
  winBonus,
  zoneAt,
  START_X,
  type GameEvent,
  type Input,
  type Run,
  type Track,
  type Zone
} from '@/utils/karawaneGame'
import {
  ANIMAL_IDS,
  ANIMALS,
  UPGRADES,
  UPGRADE_IDS,
  addCoins,
  buyAnimal,
  buyUpgrade,
  canBuyUpgrade,
  loadSave,
  persist,
  recordBest,
  selectAnimal,
  statsFor,
  upgradeCost,
  wagonTier,
  wheelLook,
  type AnimalId,
  type UpgradeId
} from '@/utils/karawaneUpgrades'
import { RIG_PARAMS, newRigState, stepRig } from '@/utils/karawaneRig'
import { drawLight, drawRigAnimal, drawStars, hasRig } from '@/utils/karawaneRender'
import {
  ANIMAL_ART,
  AXLE_X,
  AXLE_Y,
  BAND_M,
  CART_IMAGES,
  COMMON_IMAGES,
  DECOR_H,
  DIR,
  LOAD_ITEMS,
  LOOKS,
  PICKUP_H,
  PICKUP_IMAGE,
  TIER_KEYS,
  WHEEL_IMAGES,
  backgroundBands,
  cartMeta,
  meta,
  routeImages
} from '@/utils/karawaneArt'

/** How far down in the bridge picture the deck lies (a share of its height). */
const DECK_TOP = 0.41
void zoneAt
void speedLimit
type _Z = Zone
const emit = defineEmits<{ leave: [] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const music = useMusic()
const progress = useBigGames()
const ID = 'karawane'

// ── the pictures ────────────────────────────────────────────────────────────────────────────────────────────────────────────
const img: Record<string, HTMLImageElement | undefined> = {}
/** The strip of ground of a route, laid twice next to each other (so a piece of it can be cut anywhere without a wrap). */
const bandDouble: Record<number, HTMLCanvasElement | undefined> = {}
const loaded = ref(false)
const pic = (n: string) => prependBaseUrl(`${DIR}${n}.webp`)
const coinIcon = prependBaseUrl('images/abenteuer/ui/coin.webp')
const sunPic = prependBaseUrl('images/abenteuer/ui/sternglanz.webp')
const arrowLeft = prependBaseUrl('images/abenteuer/ui/pfeil-links.webp')
const hideBroken = (e: Event) => {
  ;(e.target as HTMLElement).style.display = 'none'
}

function load(names: string[]): Promise<void> {
  return Promise.all(
    names
      .filter((n) => !img[n])
      .map(
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
  ).then(() => undefined)
}

function makeBand(route: number) {
  const b = img[`boden-${route + 1}`]
  if (!b || bandDouble[route]) return
  const c = document.createElement('canvas')
  c.width = b.width * 2
  c.height = b.height
  const x = c.getContext('2d')
  if (!x) return
  x.drawImage(b, 0, 0)
  x.drawImage(b, b.width, 0)
  bandDouble[route] = c
}

// ── the screens ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
type Screen = 'menu' | 'play' | 'result'
const screen = ref<Screen>('menu')
const route = ref(0)
const paused = ref(false)
const how = ref(false)
const shop = ref(false)
const portrait = ref(false)
const showRotateAnyway = ref(false)
const tipShown = ref(false)
const busy = ref(false)

const save = reactive(loadSave())
const levelStars = computed(() => progress.levels(ID))
const routeName = (i: number) => t(`app.bigGames.karawane.route.${ROUTES[i]!.id}`)
const routeRef = (i: number) => t(`app.bigGames.karawane.routeRef.${ROUTES[i]!.id}`)
const thumb = (i: number) => pic(`karte-${i + 1}`)

// what the page shows while it plays (the game itself is not reactive)
const hud = reactive({ meters: 0, coins: 0, stamina: 1, best: 0, gas: false, brake: false, low: false, poppedCoins: 0, hasHop: false, hopReady: 1, sun: 0, dusk: 0.8, trial: false })
/** The route whose story card is open (-1: none). */
const storyRoute = ref(-1)
const outcome = reactive({
  phase: 'play' as 'won' | 'crash' | 'tired',
  crashKind: 'load' as 'load' | 'animal',
  stars: 0,
  meters: 0,
  found: 0,
  bonus: 0,
  total: 0,
  record: false,
  checkpoint: 0,
  clock: 0,
  jars: 0,
  winBonus: 0,
  practice: false,
  trialS: 0,
  trialV: 0,
  arrivedText: ''
})
/** The time of the day of the last oasis (a restart goes on from there), the best speed of the round, and whether it is a test drive. */
let lastCpClock = 0
let topV = 0
let practiceMode = false

// ── the game ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
let track: Track = generateTrack(0)
let run: Run = newRun(track, statsFor(save))
const canvas = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let raf = 0
let last = 0
let dpr = 1
let wPx = 800
let hPx = 400
let ppm = 40
let camX = 0
let camY = 0
let viewM = 7.4
let timeScale = 1
let shake = 0
let clock = 0
let wheelAng = 0
let dustClock = 0
let endTimer = 0
let ended = false
const rigState = newRigState()
const ringOut = { x: 0, y: 0 }
/** How the cart looks (from the bought parts): the cart picture and the wheel picture. */
const wagon = { tier: 0, wheel: 0 }
function updateWagon() {
  wagon.tier = wagonTier(save)
  wagon.wheel = wheelLook(save)
}
updateWagon()

const input: Input = { gas: false, brake: false }
const keys = { gas: false, brake: false }
const touches = new Map<number, 'gas' | 'brake'>()

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  t: number
  life: number
  r: number
  kind: 'dust' | 'spark' | 'shard' | 'coin'
  rot: number
  vr: number
}
const particles: Particle[] = []
for (let i = 0; i < 90; i++) particles.push({ x: 0, y: 0, vx: 0, vy: 0, t: 99, life: 1, r: 0.2, kind: 'dust', rot: 0, vr: 0 })
let pcur = 0
function emitParticle(kind: Particle['kind'], x: number, y: number, vx: number, vy: number, life: number, r: number): void {
  const p = particles[pcur]!
  pcur = (pcur + 1) % particles.length
  p.kind = kind
  p.x = x
  p.y = y
  p.vx = vx
  p.vy = vy
  p.t = 0
  p.life = life
  p.r = r
  p.rot = Math.random() * 6
  p.vr = (Math.random() - 0.5) * 12
}

interface Floater {
  text: string
  x: number
  y: number
  t: number
  color: string
}
const floaters: Floater[] = []
function floatText(text: string, x: number, y: number, color = '#fff4c8'): void {
  floaters.push({ text, x, y, t: 0, color })
  if (floaters.length > 6) floaters.shift()
}

/** The jars on the cart: each bobs a little on its own spring. */
const bob = { y: [0, 0, 0, 0], v: [0, 0, 0, 0] }
let lastVy = 0
/** The pieces of the jars that flew off in a crash. */
let jarsGone = false

async function start(i: number, fromCheckpoint = 0, practice = false) {
  if (busy.value) return
  bankRun()
  busy.value = true
  route.value = i
  how.value = !howSeen(ID)
  paused.value = how.value
  await load(routeImages((practice ? 0 : i) + 1))
  makeBand(i)
  practiceMode = practice
  track = generateTrack(practice ? 0 : i)
  updateWagon()
  run = newRun(track, statsFor(save), fromCheckpoint, fromCheckpoint > 0 ? lastCpClock : 0)
  if (practice) run.goalX = START_X + 160
  topV = 0
  hud.hasHop = run.stats.hopV > 0
  hud.sun = run.clock / (ROUTES[practice ? 0 : i]!.times[1] / hud.dusk)
  hud.hopReady = 1
  hud.meters = Math.max(0, Math.floor(run.meters))
  hud.coins = 0
  hud.stamina = 1
  hud.best = save.best[i] ?? 0
  hud.gas = false
  hud.brake = false
  hud.low = false
  camX = run.x + 4
  camY = run.y + 1.8
  viewM = 7.4
  timeScale = 1
  shake = 0
  endTimer = 0
  ended = false
  jarsGone = false
  floaters.length = 0
  for (const p of particles) p.t = 99
  bob.y.fill(0)
  bob.v.fill(0)
  lastVy = 0
  keys.gas = false
  keys.brake = false
  touches.clear()
  screen.value = 'play'
  tipShown.value = !how.value
  window.setTimeout(() => (tipShown.value = false), 6500)
  busy.value = false
  tryLandscape()
}

function closeHow() {
  how.value = false
  markHowSeen(ID)
  if (screen.value === 'play') {
    paused.value = false
    tipShown.value = true
    window.setTimeout(() => (tipShown.value = false), 6500)
  }
}

function tryLandscape() {
  try {
    if (!window.matchMedia('(pointer: coarse)').matches) return
    void document.documentElement.requestFullscreen?.().then(() => (screen as unknown as { orientation?: { lock?: (o: string) => Promise<void> } }).orientation?.lock?.('landscape')).catch(() => undefined)
  } catch {
    // not possible here: the note asks to turn the phone
  }
}

function leaveFullscreen() {
  try {
    if (document.fullscreenElement) void document.exitFullscreen()
  } catch {
    // nothing to leave
  }
}

/** A round that is left on purpose (the pause menu, the back button): what was found and reached is kept all the same. */
function bankRun() {
  if (ended || screen.value !== 'play' || practiceMode) return
  ended = true
  const meters = Math.floor(run.meters)
  const coins = run.coins + Math.floor(meters / 12)
  if (meters > 0 || coins > 0) {
    recordBest(save, route.value, meters)
    addCoins(save, coins)
    persist(save)
  }
}

function toMenu() {
  bankRun()
  screen.value = 'menu'
  paused.value = false
  shop.value = false
  hud.gas = false
  hud.brake = false
  void load(routeImages(route.value + 1)).then(() => makeBand(route.value))
}

/** The round is over: the coins are banked, the stars and the record are kept, the result shows. */
/** The time of the day as a clock time: the sun goes down at six in the evening, the way starts at eight. */
function clockText(r: number, clock: number): string {
  const hours = 8 + (clock / ROUTES[r]!.times[1]) * 10
  const h = Math.floor(hours)
  const m = Math.floor((hours - h) * 60)
  return `${h}:${String(m).padStart(2, '0')} ${t('app.bigGames.karawane.clockUnit')}`
}

function finish() {
  if (ended) return
  ended = true
  lastCpClock = run.cpClock
  outcome.practice = practiceMode
  outcome.checkpoint = run.checkpoint
  if (practiceMode) {
    outcome.phase = run.phase === 'won' ? 'won' : 'crash'
    outcome.crashKind = run.crashKind ?? 'load'
    outcome.stars = 0
    outcome.trialS = Math.round(run.t * 10) / 10
    outcome.trialV = Math.round(topV * 3.6)
    outcome.found = 0
    outcome.bonus = 0
    outcome.winBonus = 0
    outcome.total = 0
    outcome.record = false
    outcome.meters = Math.floor(run.meters)
    screen.value = 'result'
    play(run.phase === 'won' ? 'result' : 'wrong', 0.5)
    return
  }
  const won = run.phase === 'won'
  const meters = Math.floor(run.meters)
  const bonus = Math.floor(meters / 12)
  const found = run.coins
  const wb = won ? winBonus(route.value, run.jars) : 0
  const stars = won ? starsForTime(route.value, run.clock) : 0
  const rec = recordBest(save, route.value, meters)
  addCoins(save, found + bonus + wb)
  persist(save)
  progress.record(ID, route.value, stars)
  outcome.phase = won ? 'won' : run.phase === 'tired' ? 'tired' : 'crash'
  outcome.crashKind = run.crashKind ?? 'load'
  outcome.stars = stars
  outcome.meters = meters
  outcome.found = found
  outcome.bonus = bonus
  outcome.winBonus = wb
  outcome.total = found + bonus + wb
  outcome.record = rec && meters > 30
  outcome.clock = run.clock
  outcome.jars = run.jars
  outcome.arrivedText = clockText(route.value, run.clock)
  screen.value = 'result'
  if (won) play('result')
  else play('wrong', 0.5)
}

function handle(e: GameEvent): void {
  const x = run.x
  const y = run.y
  if (e.type === 'pickup') {
    hud.poppedCoins++
    if (e.kind === 'coin') play('coin', 0.5, 1 + Math.min(0.5, (run.coins % 100) / 200))
    else if (e.kind === 'date') play('tap', 0.4, 1.3)
    else if (e.kind === 'skin') play('found', 0.6)
    else play('trophy', 0.5)
    for (let k = 0; k < 4; k++) emitParticle('spark', e.x, e.y, (Math.random() - 0.5) * 4, 1 + Math.random() * 3, 0.5, 0.18)
    if (e.coins > 0 && e.kind !== 'coin') floatText(`+${e.coins}`, e.x, e.y + 0.8, '#ffe27a')
  } else if (e.type === 'oasis') {
    play('caravan', 0.6)
    floatText(t('app.bigGames.karawane.floatOasis'), x, y + 2.6, '#c8f4ff')
    for (let k = 0; k < 10; k++) emitParticle('spark', x + (Math.random() - 0.5) * 3, y + 0.8, (Math.random() - 0.5) * 5, 2 + Math.random() * 3, 0.7, 0.2)
  } else if (e.type === 'jump') {
    play('star', 0.6)
    floatText(`${t('app.bigGames.karawane.floatJump')} +${e.coins}`, x, y + 2.4, '#fff0a0')
  } else if (e.type === 'flip') {
    play('star', 0.7, 1.2)
    floatText(`${t('app.bigGames.karawane.floatFlip')} +${e.coins}`, x, y + 3.2, '#ffd0f0')
  } else if (e.type === 'land') {
    if (e.speed > 3.5) {
      play('clunk', Math.min(0.6, e.speed / 12))
      shake = Math.min(0.5, e.speed / 16)
      for (let k = 0; k < 6; k++) emitParticle('dust', run.rear.cx, heightAt(track, run.rear.cx) + 0.1, (Math.random() - 0.3) * 3, Math.random() * 2, 0.7, 0.35)
    }
  } else if (e.type === 'crash') {
    play('hit', 0.8)
    timeScale = 0.35
    shake = 0.6
    if (e.kind === 'load') {
      jarsGone = true
      for (let k = 0; k < 9; k++) emitParticle('shard', x - 1, y + 0.6, (Math.random() - 0.5) * 7, 2 + Math.random() * 5, 1.4, 0.22)
    }
  } else if (e.type === 'won') {
    play('fanfare', 0.7)
    for (let k = 0; k < 30; k++) emitParticle('spark', x + (Math.random() - 0.5) * 6, y + 1 + Math.random() * 3, (Math.random() - 0.5) * 6, 2 + Math.random() * 5, 1.2, 0.22)
  } else if (e.type === 'station') {
    play('caravan', 0.6)
    floatText(t('app.bigGames.karawane.stationOpen'), x, y + 2.6, '#c8f4ff')
    for (let k = 0; k < 12; k++) emitParticle('spark', x + 2 + (Math.random() - 0.5) * 3, y + 1, (Math.random() - 0.5) * 5, 2 + Math.random() * 3, 0.7, 0.2)
  } else if (e.type === 'warn') {
    play('tap', 0.5, 0.8)
    floatText(t(`app.bigGames.karawane.warn.${e.kind}`), x + 3, y + 2.8, '#ffd0a0')
  } else if (e.type === 'jar') {
    play('clunk', 0.6)
    floatText(t('app.bigGames.karawane.jarBroken'), x, y + 2.4, '#ffb090')
    for (let k = 0; k < 4; k++) emitParticle('shard', x - 1, y + 0.8, (Math.random() - 0.5) * 5, 2 + Math.random() * 3, 1, 0.2)
  } else if (e.type === 'bump') {
    play('hit', 0.6)
    shake = 0.35
    floatText(t('app.bigGames.karawane.gateBump'), x, y + 2.6, '#ffb090')
  } else if (e.type === 'hop') {
    play('flip', 0.7, 1.5)
    for (let k = 0; k < 5; k++) emitParticle('dust', run.rear.cx, heightAt(track, run.rear.cx) + 0.1, (Math.random() - 0.5) * 3, Math.random() * 1.4, 0.6, 0.3)
  } else if (e.type === 'low') {
    play('wrong', 0.3)
    floatText(t('app.bigGames.karawane.floatLow'), x, y + 2.8, '#ffd9b0')
  }
}

// ── the touch and the keys ──────────────────────────────────────────────────────────────────────────────────────────────────
function refreshInput() {
  let g = keys.gas
  let b = keys.brake
  for (const v of touches.values()) {
    if (v === 'gas') g = true
    else b = true
  }
  input.gas = g
  input.brake = b
  hud.gas = g
  hud.brake = b
}
function onDown(e: PointerEvent) {
  if (screen.value !== 'play' || paused.value) return
  ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
  touches.set(e.pointerId, e.clientX - r.left < r.width * 0.42 ? 'brake' : 'gas')
  refreshInput()
}
function onUp(e: PointerEvent) {
  if (touches.delete(e.pointerId)) refreshInput()
}
/** The hop (the part "Federkraft"): a short push up. */
function doHop() {
  if (screen.value !== 'play' || paused.value || how.value) return
  hop(run)
}
function onKey(e: KeyboardEvent) {
  const down = e.type === 'keydown'
  if (down && !e.repeat && (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W')) {
    doHop()
    e.preventDefault()
    return
  }
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' || e.key === ' ') {
    keys.gas = down
    e.preventDefault()
  } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' || e.key === 'ArrowDown') {
    keys.brake = down
    e.preventDefault()
  } else if (down && (e.key === 'Escape' || e.key === 'p') && screen.value === 'play' && !how.value) {
    paused.value = !paused.value
  }
  refreshInput()
}

// ── the loop ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
function resize() {
  const c = canvas.value
  if (!c) return
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  const box = c.getBoundingClientRect()
  wPx = box.width || window.innerWidth
  hPx = box.height || window.innerHeight
  portrait.value = hPx > wPx
  c.width = Math.round(wPx * dpr)
  c.height = Math.round(hPx * dpr)
}

function frame(now: number) {
  raf = requestAnimationFrame(frame)
  advance(Math.min(0.05, (now - last) / 1000 || 0))
  last = now
}

/** One picture of the game: the physics for `dt` seconds, the camera, the effects, and the drawing. Also called by the test probe. */
function advance(dt: number) {
  clock += dt
  const playing = screen.value === 'play' && !paused.value && !(portrait.value && !showRotateAnyway.value)
  if (playing) {
    const slow = run.phase === 'crash' ? timeScale : 1
    const sdt = dt * slow
    stepRun(run, sdt, input)
    for (const e of run.events) handle(e)
    run.events.length = 0
    // the effects
    wheelAng += (run.vx / Math.max(0.3, run.stats.wheelR)) * sdt
    dustClock += sdt
    if (dustClock > 0.06) {
      dustClock = 0
      if (run.rear.contact && Math.abs(run.vx) > 2.5 && run.phase === 'play') {
        emitParticle('dust', run.rear.cx - 0.2, heightAt(track, run.rear.cx) + 0.12, -run.vx * 0.15 - Math.random(), 0.3 + Math.random() * 0.9, 0.7, 0.28 + Math.random() * 0.2)
      }
      if (run.front.contact && run.gas && run.vx < 4 && run.phase === 'play') {
        emitParticle('dust', run.front.cx, heightAt(track, run.front.cx) + 0.1, -1.5, 0.8, 0.6, 0.22)
      }
    }
    // the jars bob on their own springs (driven by how the cart is shaken)
    const ay = (run.vy - lastVy) / Math.max(sdt, 1e-4)
    lastVy = run.vy
    for (let i = 0; i < 4; i++) {
      const target = -Math.max(-3, Math.min(3, ay * 0.012)) * (1 + i * 0.1)
      bob.v[i]! += ((target - bob.y[i]!) * 90 - bob.v[i]! * 7) * sdt
      bob.y[i]! += bob.v[i]! * sdt
      bob.y[i] = Math.max(-0.25, Math.min(0.3, bob.y[i]!))
    }
    // the counters
    if (run.vx > topV) topV = run.vx
    hud.sun = run.clock / (ROUTES[run.route]!.times[1] / hud.dusk)
    if (hud.hasHop) {
      const rdy = run.hopCd > 0 ? 1 - run.hopCd / run.stats.hopCool : 1
      if (Math.abs(hud.hopReady - rdy) > 0.02) hud.hopReady = rdy
    }
    const m = Math.max(0, Math.floor(run.meters))
    if (hud.meters !== m) hud.meters = m
    if (hud.coins !== run.coins) hud.coins = run.coins
    const st = Math.round(run.stamina * 100) / 100
    if (hud.stamina !== st) hud.stamina = st
    hud.low = run.stamina < 0.22 && run.phase === 'play'
    // the end of the round: after a short slow end
    if (run.phase !== 'play') {
      endTimer += dt
      if (!ended && endTimer > (run.phase === 'crash' ? 1.5 : 1.1)) finish()
    }
  }
  // the legs of the animal (they rest while it stands, also behind the menu)
  stepRig(rigState, RIG_PARAMS[run.stats.animal], dt * (run.phase === 'crash' ? timeScale : 1), playing ? run.vx : 0, playing && run.touching === 0 && run.airT > 0.08)
  if (shake > 0) shake = Math.max(0, shake - dt * 1.6)
  updateCamera(dt)
  for (const p of particles) {
    if (p.t >= p.life) continue
    p.t += dt
    p.x += p.vx * dt
    p.y += p.vy * dt
    if (p.kind === 'shard' || p.kind === 'spark') p.vy -= 9 * dt
    else p.vy += 0.4 * dt
    p.rot += p.vr * dt
  }
  for (const f of floaters) f.t += dt
  while (floaters.length && floaters[0]!.t > 1.6) floaters.shift()
  draw(clock)
}

function updateCamera(dt: number) {
  const wM = wPx / ppm
  const tx = run.x + wM * 0.12 + Math.min(wM * 0.14, Math.max(-1, run.vx) * 0.42)
  const ground = heightAt(track, run.x)
  const air = Math.max(0, run.y - ground - 1.2)
  const ty = run.y + 1.35 - Math.min(2.2, air * 0.18)
  const k = 1 - Math.exp(-5 * dt)
  const ky = 1 - Math.exp(-3.2 * dt)
  camX += (tx - camX) * k
  camY += (ty - camY) * ky
  const wantView = 7.4 + Math.min(4.5, air * 0.55) + Math.min(1.6, Math.max(0, run.vx - 9) * 0.25)
  viewM += (wantView - viewM) * (1 - Math.exp(-2 * dt))
  ppm = hPx / viewM
}

// ── the drawing ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
function sprite(c: CanvasRenderingContext2D, name: string, x: number, y: number, h: number, ax = 0.5, ay = 1): void {
  const i = img[name]
  if (!i) return
  const w = (i.width / i.height) * h
  c.drawImage(i, x - ax * w, -y - ay * h, w, h)
}

function layerSky(c: CanvasRenderingContext2D, look: (typeof LOOKS)[number], r: number) {
  const b = backgroundBands(look, hPx, camY, ppm)
  const s = img[`fern-${r + 1}`]
  c.fillStyle = look.skyColor
  c.fillRect(0, 0, wPx, hPx)
  if (!s) return
  const w = b.skyH * (s.width / s.height)
  // the clouds drift a little by themselves
  const scroll = ((((camX * ppm * look.skyPar) + clock * 5) % w) + w) % w
  for (let x = -scroll; x < wPx; x += w) c.drawImage(s, x, b.skyTop, w + 1, b.skyH)
}

/** Two layers of hills (a far, pale, small one and a near one) and, below their bottom edge, a fill in their colour down to the bottom of the screen: no bar shows in a jump. */
function layerMid(c: CanvasRenderingContext2D, look: (typeof LOOKS)[number], r: number) {
  const m = img[`mitte-${r + 1}`]
  if (!m) return
  const b = backgroundBands(look, hPx, camY, ppm)
  const col = (META[`mitte-${r + 1}`]?.bottom as number[] | undefined) ?? [200, 150, 90]
  // the far layer: smaller, slower, paler
  const hf = b.midH * 0.68
  const wf = hf * (m.width / m.height)
  const sf = (((camX * ppm * look.midPar * 0.45) % wf) + wf) % wf
  c.globalAlpha = 0.6
  for (let x = -sf; x < wPx; x += wf) c.drawImage(m, x, b.midBottom - hf - b.midH * 0.16, wf + 1, hf)
  c.globalAlpha = 1
  const w = b.midH * (m.width / m.height)
  const scroll = (((camX * ppm * look.midPar) % w) + w) % w
  for (let x = -scroll; x < wPx; x += w) c.drawImage(m, x, b.midBottom - b.midH, w + 1, b.midH)
  if (b.fillTo > b.fillFrom) {
    c.fillStyle = `rgb(${col[0]},${col[1]},${col[2]})`
    c.fillRect(0, b.fillFrom, wPx, b.fillTo - b.fillFrom + 1)
  }
}

/** The ground as it is drawn: under a bridge it falls away into a ravine (the cart drives on the deck, which is the real ground). */
function visH(x: number): number {
  let dip = 0
  for (const z of track.zones) {
    if (z.kind !== 'bridge' || x < z.x0 - 3 || x > z.x1 + 3) continue
    const u = Math.min(1, Math.min(x - (z.x0 - 3), z.x1 + 3 - x) / 3)
    dip = Math.max(dip, 3.4 * u * u * (3 - 2 * u))
  }
  return heightAt(track, x) - dip
}

function drawTerrain(c: CanvasRenderingContext2D, r: number) {
  const x0 = camX - wPx / ppm / 2 - 1
  const x1 = camX + wPx / ppm / 2 + 1
  const stepM = 0.5
  const toX = (x: number) => (x - camX) * ppm + wPx / 2
  const toY = (y: number) => hPx / 2 + (camY - y) * ppm
  const m = META[`boden-${r + 1}`]
  const top = (m?.fillTop as number[] | undefined) ?? [200, 160, 90]
  const bottom = (m?.fillBottom as number[] | undefined) ?? [120, 80, 40]
  const path = new Path2D()
  const first = Math.floor(x0 / stepM) * stepM
  path.moveTo(toX(first), hPx + 4)
  let minY = hPx
  let last = first
  for (let x = first; x <= x1 + stepM; x += stepM) {
    const sy = toY(visH(x))
    if (sy < minY) minY = sy
    path.lineTo(toX(x), sy)
    last = x
  }
  path.lineTo(toX(last), hPx + 4)
  path.closePath()
  // the ground is out of sight (a high jump): nothing to draw
  if (minY > hPx + 8) return
  const g = c.createLinearGradient(0, Math.max(0, minY), 0, Math.max(hPx, minY + 1))
  g.addColorStop(0, `rgb(${top[0]},${top[1]},${top[2]})`)
  g.addColorStop(1, `rgb(${bottom[0]},${bottom[1]},${bottom[2]})`)
  c.fillStyle = g
  c.fill(path)
  // the painted strip along the top
  const band = bandDouble[r]
  const b = img[`boden-${r + 1}`]
  if (!band || !b) {
    c.strokeStyle = 'rgba(90,45,10,0.6)'
    c.lineWidth = 3
    c.stroke(path)
    return
  }
  const anchor = meta(`boden-${r + 1}`, 'anchor', 0.05)
  const pxPerM = b.width / BAND_M
  const dw = 0.55
  const dh = (b.height / pxPerM) * ppm
  for (let x = first; x <= x1; x += dw) {
    const cx = x + dw / 2
    const sy = toY(visH(cx))
    if (sy > hPx + dh) continue
    const slope = (visH(cx + 0.3) - visH(cx - 0.3)) / 0.6
    const ang = -Math.atan(slope)
    const sx = (((x * pxPerM) % b.width) + b.width) % b.width
    c.save()
    c.translate(toX(cx), sy)
    c.rotate(ang)
    c.drawImage(band, sx, 0, dw * pxPerM + 1, b.height, -dw * ppm * 0.5 - 1, -anchor * dh, dw * ppm + 2, dh)
    c.restore()
  }
  // the ground is a little darker than the dunes behind it, deeper down more so, and its edge is drawn with a soft brown line
  const shade = c.createLinearGradient(0, Math.max(0, minY), 0, Math.max(hPx, minY + 1))
  shade.addColorStop(0, 'rgba(110,55,10,0.10)')
  shade.addColorStop(0.5, 'rgba(90,40,5,0.28)')
  shade.addColorStop(1, 'rgba(60,25,0,0.5)')
  c.fillStyle = shade
  c.fill(path)
  c.lineJoin = 'round'
  c.strokeStyle = 'rgba(120,65,15,0.55)'
  c.lineWidth = Math.max(2, ppm * 0.06)
  c.beginPath()
  for (let x = first; x <= x1 + stepM; x += stepM) {
    if (x === first) c.moveTo(toX(x), toY(visH(x)))
    else c.lineTo(toX(x), toY(visH(x)))
  }
  c.stroke()
}

function drawCart(c: CanvasRenderingContext2D) {
  const st = run.stats
  const a = ANIMAL_ART[st.animal]
  const frameB = Math.floor(run.x * 0.9) % 2 === 1
  const hasGround = run.front.contact || run.rear.contact
  const walking = run.phase === 'play' && hasGround && Math.abs(run.vx) > 0.4
  const useB = walking ? frameB : false

  // the animal (its feet stand on the ground under the front support)
  const f = run.front
  const fx = f.cx
  const fy = f.cy - FOOT_R
  const ang = run.a * 0.45 + f.slope * 0.55
  let ringWX = fx + 0.6
  let ringWY = fy + 0.8
  if (hasRig(img, st.animal)) {
    drawRigAnimal(c, img, st.animal, rigState, fx, fy, ang, ringOut)
    ringWX = ringOut.x
    ringWY = ringOut.y
  } else {
    // the two pictures of a walking animal, while the pieces are not there
    const ai = img[`${a.file}-${useB ? 'b' : 'a'}`] ?? img[`${a.file}-a`]
    if (ai) {
      const hh = a.h
      const ww = (ai.width / ai.height) * hh
      const bobY = walking ? Math.abs(Math.sin(run.x * 1.4)) * 0.05 : 0
      c.save()
      c.translate(fx, -(fy + bobY))
      c.rotate(-ang)
      c.drawImage(ai, -a.footX * ww, -hh, ww, hh)
      c.restore()
      const lx = (a.ringX - a.footX) * ww
      const ly = (1 - a.ringY) * hh
      ringWX = fx + lx * Math.cos(ang) - ly * Math.sin(ang)
      ringWY = fy + bobY + lx * Math.sin(ang) + ly * Math.cos(ang)
    }
  }

  // the cart body: it grows with the parts that were bought
  const cs = Math.cos(run.a)
  const sn = Math.sin(run.a)
  const toW = (lx: number, ly: number): [number, number] => [run.x + lx * cs - ly * sn, run.y + lx * sn + ly * cs]
  const cartName = img[CART_IMAGES[wagon.tier]!] ? CART_IMAGES[wagon.tier]! : 'karren'
  const cm = cartMeta(cartName)
  const car = img[cartName]
  const bedY = AXLE_Y + (cm.ay - cm.bed) * cm.mh
  c.save()
  c.translate(run.x, -run.y)
  c.rotate(-run.a)
  if (car) {
    c.drawImage(car, AXLE_X - cm.ax * cm.mw, -AXLE_Y - cm.ay * cm.mh, cm.mw, cm.mh)
  } else {
    c.fillStyle = '#a8742f'
    c.fillRect(-2.1, 0, 2.1, 0.4)
  }
  // the load on the bed: more of it with a better tarp (a covered wagon hides it)
  if (!jarsGone && wagon.tier < 2) {
    const n = Math.min(LOAD_ITEMS.length, 2 + save.up.cover)
    const bedLeft = AXLE_X - cm.ax * cm.mw
    for (let i = 0; i < n; i++) {
      const it = LOAD_ITEMS[i]!
      sprite(c, it.image, bedLeft + it.x + 0.0, bedY + 0.03 + bob.y[i]!, it.h, 0.5, 1)
    }
    if (save.up.cover >= 3) {
      const pl = img.plane
      if (pl) {
        const w = 1.9
        const h = (pl.height / pl.width) * w
        c.drawImage(pl, bedLeft + 0.2, -(bedY + 0.02) - h + 0.08, w, h)
      }
    }
  }
  c.restore()

  // the pole is tied to the collar with a strap
  const [tx, ty] = toW(AXLE_X - cm.ax * cm.mw + cm.tx * cm.mw, AXLE_Y + (cm.ay - cm.ty) * cm.mh)
  c.strokeStyle = '#7a4a22'
  c.lineWidth = 0.07
  c.lineCap = 'round'
  c.beginPath()
  c.moveTo(tx, -ty)
  c.quadraticCurveTo((tx + ringWX) / 2, -((ty + ringWY) / 2) + 0.12, ringWX, -ringWY)
  c.stroke()

  // the wheel
  const wr = st.wheelR
  const wi = img[WHEEL_IMAGES[wagon.wheel]!] ?? img.rad
  c.save()
  c.translate(run.rear.cx, -run.rear.cy)
  c.rotate(wheelAng)
  if (wi) c.drawImage(wi, -wr, -wr, wr * 2, wr * 2)
  else {
    c.strokeStyle = '#5a3a1a'
    c.lineWidth = 0.1
    c.beginPath()
    c.arc(0, 0, wr, 0, Math.PI * 2)
    c.stroke()
  }
  c.restore()
}

/** The things that stand on the ground behind the cart: the oases, the gate, and the decor, with their feet in the ground (the ground is drawn after them and covers their lower edge). */
function drawStanding(c: CanvasRenderingContext2D, r: number, xMin: number, xMax: number) {
  for (const o of track.oases) {
    if (o > xMin - 8 && o < xMax + 8) sprite(c, 'oase', o, heightAt(track, o) - 0.2, 3.6, 0.5, 1)
  }
  if (track.finishX > xMin - 6 && track.finishX < xMax + 6) sprite(c, 'ziel', track.finishX, heightAt(track, track.finishX) - 0.2, 5.2, 0.5, 1)
  const heights = DECOR_H[r + 1] ?? []
  for (const d of track.decor) {
    if (d.x < xMin - 6 || d.x > xMax + 6) continue
    const im = img[`deko-${r + 1}-${d.kind + 1}`]
    if (!im) continue
    const h = (heights[d.kind] ?? 2) * d.scale
    const w = (im.width / im.height) * h
    // the lowest and the highest ground under the foot of the thing: it stands on the lowest point, and the higher ground covers its lower edge
    let lo = 1e9
    let hi = -1e9
    for (let q = -2; q <= 2; q++) {
      const gy = heightAt(track, d.x + q * w * 0.2)
      if (gy < lo) lo = gy
      if (gy > hi) hi = gy
    }
    // a thing on a steep slope would stand crooked: it is left out there
    if (hi - lo > Math.max(0.5, h * 0.55)) continue
    c.save()
    c.translate(d.x, -(lo - Math.min(0.3, h * 0.07)))
    if (d.flip) c.scale(-1, 1)
    c.drawImage(im, -w / 2, -h, w, h)
    c.restore()
  }
}

/** The marks of the special stretches that stand behind the cart: signs before bridges, steps and boulders, the halt zone with its markers, the toll gate (shut or open) and a trough. */
function drawZonesBack(c: CanvasRenderingContext2D, xMin: number, xMax: number) {
  for (let k = 0; k < track.zones.length; k++) {
    const z = track.zones[k]!
    if (z.x1 < xMin - 10 || z.x0 > xMax + 20) continue
    if (z.kind === 'bridge' || z.kind === 'ledges' || z.kind === 'rocks') sprite(c, 'zonen-4', z.x0 - 12, heightAt(track, z.x0 - 12) - 0.1, 1.7, 0.5, 1)
    if (z.kind === 'stop') {
      sprite(c, 'zonen-4', z.x0 - 22, heightAt(track, z.x0 - 22) - 0.1, 1.7, 0.5, 1)
      sprite(c, 'zonen-3', z.x0, heightAt(track, z.x0) - 0.1, 1.9, 0.5, 1)
      sprite(c, 'zonen-3', z.x1, heightAt(track, z.x1) - 0.1, 1.9, 0.5, 1)
      sprite(c, 'zonen-5', z.x0 + 5, heightAt(track, z.x0 + 5) - 0.1, 1.2, 0.5, 1)
      if (z.gate !== undefined) sprite(c, run.zoneDone[k] ? (img['zonen-2'] ? 'zonen-2' : 'ziel') : img['zonen-1'] ? 'zonen-1' : 'ziel', z.gate + 1.4, heightAt(track, z.gate) - 0.15, 3.2, 0.5, 1)
    }
  }
}

/** What lies on the ground in front of the terrain: the plank deck of a bridge, the dark patch of a sand or mud hole. */
function drawZonesFront(c: CanvasRenderingContext2D, xMin: number, xMax: number, r: number) {
  const mud = ROUTES[r]!.mood === 'morning'
  for (const z of track.zones) {
    if (z.x1 < xMin || z.x0 > xMax) continue
    if (z.kind === 'pit') {
      c.fillStyle = mud ? 'rgba(70,45,25,0.5)' : 'rgba(150,100,40,0.38)'
      c.beginPath()
      c.moveTo(z.x0, -heightAt(track, z.x0))
      for (let x = z.x0; x <= z.x1; x += 1) c.lineTo(x, -heightAt(track, x))
      for (let x = z.x1; x >= z.x0; x -= 1) c.lineTo(x, -heightAt(track, x) + 0.9)
      c.closePath()
      c.fill()
    } else if (z.kind === 'bridge') {
      const im = img.steg
      if (!im) {
        // until the painted bridge is there: a plain plank deck
        c.fillStyle = '#8a5a2b'
        c.fillRect(z.x0 - 1, -heightAt(track, z.x0) - 0.05, z.x1 - z.x0 + 2, 0.32)
        c.fillStyle = '#5e3a18'
        c.fillRect(z.x0 - 1, -heightAt(track, z.x0) + 0.2, z.x1 - z.x0 + 2, 0.08)
        continue
      }
      const h = 1.3
      const w = (im.width / im.height) * h
      // the deck line lies this share down in the picture
      const top = DECK_TOP * h
      for (let x = z.x0 - 1; x < z.x1 + 1; x += w) {
        const piece = Math.min(w, z.x1 + 1 - x)
        c.drawImage(im, 0, 0, im.width * (piece / w), im.height, x, -heightAt(track, x) - top, piece, h)
      }
    }
  }
}

/** Plants and stones in front of the cart, a little bigger and faster than the ground (a near layer that gives depth). */
function drawForeground(c: CanvasRenderingContext2D, r: number, xMin: number, xMax: number) {
  const names = [1, 2, 3, 4, 5].map((k) => img[`vorn-${r + 1}-${k}`])
  if (!names[0] && !names[1]) return
  const Z = 1.22
  c.save()
  // scale about the middle of the view: things move faster than the ground
  c.translate(camX, -camY)
  c.scale(Z, Z)
  c.translate(-camX, camY)
  const lo = Math.floor((camX + (xMin - camX) / Z) / 9)
  const hi = Math.ceil((camX + (xMax - camX) / Z) / 9)
  for (let cell = lo; cell <= hi; cell++) {
    // one or two things in every cell of nine metres, at fixed places (a hash of the cell, no random numbers at run time)
    for (let n = 0; n < 2; n++) {
      const hsh = Math.sin((cell * 2 + n) * 12.9898 + r * 4.1) * 43758.5453
      const u = hsh - Math.floor(hsh)
      const v = Math.sin((cell * 2 + n) * 78.233 + r) * 9127.31
      const w2 = v - Math.floor(v)
      if (u < 0.35) continue
      const im = names[Math.floor(w2 * 5)]
      if (!im) continue
      const x = cell * 9 + n * 4.5 + u * 3
      const h = 0.5 + w2 * 0.6
      const wImg = (im.width / im.height) * h
      c.drawImage(im, x - wImg / 2, -(heightAt(track, x) - 0.15 - w2 * 0.5), wImg, h)
    }
  }
  c.restore()
}

function draw(time: number) {
  const c = ctx
  const cv = canvas.value
  if (!c || !cv) return
  const r = route.value
  const look = LOOKS[r]!
  c.setTransform(dpr, 0, 0, dpr, 0, 0)
  layerSky(c, look, r)
  if (ROUTES[r]!.mood === 'night') drawStars(c, wPx, hPx * 0.55, time)
  layerMid(c, look, r)

  // the world (y points up in the game, so the picture is drawn at -y)
  const k = ppm * dpr
  const sh = shake > 0 ? (Math.random() - 0.5) * shake * 0.25 : 0
  const shy = shake > 0 ? (Math.random() - 0.5) * shake * 0.25 : 0
  const worldT = () => c.setTransform(k, 0, 0, k, k * (wPx / ppm / 2 - camX + sh), k * (hPx / ppm / 2 + camY + shy))
  const xMin = camX - wPx / ppm / 2 - 6
  const xMax = camX + wPx / ppm / 2 + 6
  worldT()
  drawStanding(c, r, xMin, xMax)
  drawZonesBack(c, xMin, xMax)
  // the ground covers the feet of everything that stands behind the cart
  c.setTransform(dpr, 0, 0, dpr, 0, 0)
  drawTerrain(c, r)
  worldT()
  drawZonesFront(c, xMin, xMax, r)

  // the pickups
  for (let i = 0; i < track.pickups.length; i++) {
    const p = track.pickups[i]!
    if (p.x < xMin || p.x > xMax || run.taken[i]) continue
    const name = PICKUP_IMAGE[p.kind]
    const im = img[name]
    const h = PICKUP_H[p.kind]
    const bobY = Math.sin(time * 3 + p.x * 0.7) * 0.08
    if (im) {
      let w = (im.width / im.height) * h
      if (p.kind === 'coin') w *= Math.abs(Math.cos(time * 3.2 + p.x * 0.5)) * 0.8 + 0.2
      c.drawImage(im, p.x - w / 2, -(p.y + bobY) - h / 2, w, h)
    } else {
      c.fillStyle = '#f3c84a'
      c.beginPath()
      c.arc(p.x, -(p.y + bobY), 0.3, 0, Math.PI * 2)
      c.fill()
    }
  }

  drawCart(c)

  // the particles
  for (const p of particles) {
    if (p.t >= p.life) continue
    const q = p.t / p.life
    if (p.kind === 'dust') {
      c.globalAlpha = 0.5 * (1 - q)
      c.fillStyle = `rgb(${look.dust})`
      c.beginPath()
      c.arc(p.x, -p.y, p.r * (1 + q * 1.6), 0, Math.PI * 2)
      c.fill()
    } else if (p.kind === 'spark') {
      c.globalAlpha = 1 - q
      c.fillStyle = '#fff2b0'
      c.beginPath()
      c.arc(p.x, -p.y, p.r * (1 - q * 0.6), 0, Math.PI * 2)
      c.fill()
    } else if (p.kind === 'shard') {
      c.globalAlpha = 1 - q * q
      const im = img.scherben
      if (im) {
        c.save()
        c.translate(p.x, -p.y)
        c.rotate(p.rot)
        const h = 0.5
        const w = (im.width / im.height) * h
        c.drawImage(im, -w / 2, -h / 2, w, h)
        c.restore()
      }
    }
  }
  c.globalAlpha = 1
  drawForeground(c, r, xMin, xMax)

  // the light over everything, then the words that rise
  c.setTransform(dpr, 0, 0, dpr, 0, 0)
  drawLight(c, ROUTES[r]!.mood, wPx, hPx, time)
  // the sun goes down: from the late afternoon the picture turns warm, after the evening it darkens
  if (screen.value === 'play' && ROUTES[r]!.mood !== 'night') {
    const f = run.clock / ROUTES[r]!.times[1]
    const warm = Math.max(0, Math.min(1, (f - 0.65) / 0.4))
    const dark = Math.max(0, Math.min(1, (f - 1.05) / 0.6))
    if (warm > 0) {
      c.fillStyle = `rgba(230,110,40,${0.2 * warm})`
      c.fillRect(0, 0, wPx, hPx)
    }
    if (dark > 0) {
      c.fillStyle = `rgba(20,25,70,${0.4 * dark})`
      c.fillRect(0, 0, wPx, hPx)
    }
  }
  c.textAlign = 'center'
  c.lineJoin = 'round'
  for (const f of floaters) {
    const q = f.t / 1.6
    const sx = (f.x - camX) * ppm + wPx / 2
    const sy = hPx / 2 + (camY - f.y) * ppm - q * ppm * 1.6
    c.globalAlpha = Math.min(1, (1 - q) * 2)
    const size = Math.round(Math.max(18, Math.min(34, hPx * 0.06)) * (1 + Math.max(0, 0.25 - f.t) * 1.2))
    c.font = `800 ${size}px Fraunces, Georgia, serif`
    c.strokeStyle = 'rgba(70,40,10,0.85)'
    c.lineWidth = 5
    c.strokeText(f.text, sx, sy)
    c.fillStyle = f.color
    c.fillText(f.text, sx, sy)
  }
  c.globalAlpha = 1
}

// ── the page ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const progressShare = computed(() => Math.min(1, hud.meters / ROUTES[route.value]!.length))
const goalMarks = computed(() => {
  const r = ROUTES[route.value]!
  return r.goals.map((g) => ({ left: (g / r.length) * 100, done: hud.meters >= g }))
})
const resultText = computed(() => {
  if (outcome.phase === 'won') return t('app.bigGames.karawane.won')
  if (outcome.phase === 'tired') return t('app.bigGames.karawane.tired')
  return outcome.crashKind === 'animal' ? t('app.bigGames.karawane.lostAnimal') : t('app.bigGames.karawane.lostLoad')
})
const canResume = computed(() => outcome.checkpoint > 0 && outcome.phase !== 'won')
const nextRoute = computed(() => (outcome.phase === 'won' && route.value < ROUTE_COUNT - 1 ? route.value + 1 : -1))

/** Picks a route: the first time its story card comes (what it is about and what the task is), after that the route starts at once. */
function pick(i: number) {
  if (!save.seen.includes(i)) {
    storyRoute.value = i
    return
  }
  void start(i)
}
function storyGo() {
  const i = storyRoute.value
  storyRoute.value = -1
  if (i < 0) return
  if (!save.seen.includes(i)) save.seen.push(i)
  persist(save)
  void start(i)
}
const SYMBOL: Record<string, string> = { sand: 'sym-1', steep: 'sym-2', wind: 'sym-3', slippery: 'sym-4', hills: 'sym-5', festive: 'sym-6' }
const symbol = (ch: string) => pic(SYMBOL[ch] ?? 'sym-5')
const storyOf = (i: number) => t(`app.bigGames.karawane.routeStory.${ROUTES[i]!.id}`)
const taskOf = (i: number) => t(`app.bigGames.karawane.routeTask.${ROUTES[i]!.id}`)

// the wagon in the workshop: the cart with its wheel, drawn from the painted pictures
const wagonView = computed(() => {
  const st = save
  const tier = wagonTier(st)
  const name = CART_IMAGES[tier]!
  const m = cartMeta(name)
  const wr = statsFor(st).wheelR
  const W = 170
  const k = W / m.mw
  const yMin = Math.min(0, m.ay * m.mh - wr)
  const yMax = Math.max(m.mh, m.ay * m.mh + wr)
  return {
    tier,
    cart: pic(name),
    wheel: pic(WHEEL_IMAGES[wheelLook(st)]!),
    box: { width: `${W}px`, height: `${(yMax - yMin) * k}px` },
    cartStyle: { width: `${W}px`, top: `${-yMin * k}px` },
    wheelStyle: { width: `${2 * wr * k}px`, left: `${(m.ax * m.mw - wr) * k}px`, top: `${(m.ay * m.mh - wr - yMin) * k}px` }
  }
})
/** The numbers of the cart as they are now, and what one more step of a part (or another animal) would make of them. */
const statNow = computed(() => statsFor(save))
function statFor(id: UpgradeId): { label: string; from: string; to: string } | null {
  const before = statsFor(save)
  if (save.up[id] >= UPGRADES[id].max) return null
  const next = { ...save, up: { ...save.up, [id]: save.up[id] + 1 }, owned: [...save.owned] }
  const after = statsFor(next)
  const kmh = (v: number) => `${Math.round(v * 3.6)} ${t('app.bigGames.karawane.statUnit.kmh')}`
  switch (id) {
    case 'wheels':
      return { label: t('app.bigGames.karawane.stats.grip'), from: String(Math.round(before.mu * 100)), to: String(Math.round(after.mu * 100)) }
    case 'suspension':
      return { label: t('app.bigGames.karawane.stats.bridge'), from: kmh(before.bridgeV), to: kmh(after.bridgeV) }
    case 'water':
      return { label: t('app.bigGames.karawane.stats.stamina'), from: `${Math.round(before.staminaSec)} ${t('app.bigGames.karawane.statUnit.s')}`, to: `${Math.round(after.staminaSec)} ${t('app.bigGames.karawane.statUnit.s')}` }
    case 'cover':
      return { label: t('app.bigGames.karawane.stats.coins'), from: `×${before.coinMult.toFixed(2)}`, to: `×${after.coinMult.toFixed(2)}` }
    case 'harness':
      return { label: t('app.bigGames.karawane.stats.pull'), from: before.power.toFixed(1), to: after.power.toFixed(1) }
    default:
      return { label: t('app.bigGames.karawane.stats.hop'), from: before.hopV > 0 ? before.hopV.toFixed(1) : '–', to: after.hopV.toFixed(1) }
  }
}
function animalStat(id: AnimalId): { speed: string; pull: string; stamina: string } {
  const cur = statsFor(save)
  const other = statsFor({ ...save, animal: id, owned: [...save.owned] })
  const d = (a: number, b: number, f: (v: number) => string) => (Math.abs(a - b) < 0.01 ? f(b) : `${f(a)} → ${f(b)}`)
  return {
    speed: d(cur.vmax * 3.6, other.vmax * 3.6, (v) => `${Math.round(v)} km/h`),
    pull: d(cur.power, other.power, (v) => v.toFixed(1)),
    stamina: d(cur.staminaSec, other.staminaSec, (v) => `${Math.round(v)} s`)
  }
}
function startTrial() {
  shop.value = false
  void start(0, 0, true)
}
const trialText = computed(() => t('app.bigGames.karawane.trialResult', { m: 160, s: outcome.trialS, v: outcome.trialV }))
const tierName = computed(() => t(`app.bigGames.karawane.tier.${TIER_KEYS[wagonView.value.tier]}`))

const stamBar = computed(() => `${Math.round(hud.stamina * 100)}%`)

function levelOf(id: UpgradeId): number {
  return save.up[id]
}
function pips(id: UpgradeId): number[] {
  return Array.from({ length: UPGRADES[id].max }, (_, i) => i)
}
/** Behind the menu and the workshop the cart stands with the parts that were bought. */
function refreshScene() {
  updateWagon()
  if (screen.value !== 'play') run = newRun(track, statsFor(save))
}
function buyPart(id: UpgradeId) {
  if (buyUpgrade(save, id)) {
    persist(save)
    refreshScene()
    play('found', 0.6)
  } else play('wrong', 0.3)
}
function animalAction(id: AnimalId) {
  if (save.owned.includes(id)) {
    if (selectAnimal(save, id)) {
      persist(save)
      refreshScene()
      play('tap', 0.6)
    }
  } else if (buyAnimal(save, id)) {
    persist(save)
    refreshScene()
    play('found', 0.7)
  } else play('wrong', 0.3)
}
const animalThumb = (id: AnimalId) => pic(`${ANIMAL_ART[id].file}-stand`)
const partThumb = (id: UpgradeId) => pic({ wheels: 'rad-2', suspension: 'feder', water: 'schlauch', cover: 'krug-gross', harness: 'esel-a', hop: 'sym-5' }[id])

function leave() {
  leaveFullscreen()
  emit('leave')
}

let bodyOverflow = ''
onMounted(async () => {
  bodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  ctx = canvas.value?.getContext('2d') ?? null
  resize()
  window.addEventListener('resize', resize)
  window.addEventListener('keydown', onKey)
  window.addEventListener('keyup', onKey)
  music.playGame('festMarch')
  // with `?probe=1` the game can be looked at and stepped from the console (the test browser draws no animation)
  if (window.location.hash.includes('probe=1')) {
    ;(window as unknown as { __karawane?: unknown }).__karawane = {
      get run() {
        return run
      },
      get track() {
        return track
      },
      get save() {
        return save
      },
      start,
      advance,
      finish,
      input
    }
  }
  await load(COMMON_IMAGES)
  await load(routeImages(1))
  makeBand(0)
  loaded.value = true
  last = performance.now()
  raf = requestAnimationFrame(frame)
})
onBeforeUnmount(() => {
  bankRun()
  cancelAnimationFrame(raf)
  music.stop('game')
  window.removeEventListener('resize', resize)
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('keyup', onKey)
  document.body.style.overflow = bodyOverflow
  leaveFullscreen()
})
</script>

<template lang="pug">
  div(class="kg")
    canvas(
      ref="canvas"
      class="kg-canvas"
      @pointerdown="onDown"
      @pointerup="onUp"
      @pointercancel="onUp"
      @pointerleave="onUp"
    )

    //- while the pictures load
    div(v-if="!loaded" class="kg-center")
      div(class="kg-spinner")

    //- the routes
    div(v-else-if="screen === 'menu'" v-show="!shop && !how && storyRoute < 0" class="kg-menu")
      div(class="kg-card")
        GameIntroBox(
          :title="t('app.bigGames.karawane.title')"
          :label="t('app.bigGames.common.intro')"
          :story="t('app.bigGames.karawane.story')"
          :task="t('app.bigGames.karawane.taskLabel') + ': ' + t('app.bigGames.karawane.task')"
        )
        div(class="kg-purse")
          img(:src="coinIcon" alt="" class="kg-coin" @error="hideBroken")
          span(class="kg-purse-n") {{ save.coins }}
          span(class="kg-purse-l") {{ t('app.bigGames.karawane.coins') }}
        div(class="kg-routes")
          button(
            v-for="(r, i) in ROUTES"
            :key="r.id"
            type="button"
            class="kg-route"
            :data-test="`karawane-route-${i}`"
            @click="pick(i)"
          )
            img(:src="thumb(i)" alt="" class="kg-route-pic" loading="lazy" @error="hideBroken")
            span(class="kg-route-no") {{ i + 1 }}
            span(class="kg-route-name") {{ routeName(i) }}
            span(class="kg-route-ref") {{ routeRef(i) }}
            span(class="kg-chips")
              span(v-for="ch in r.chars" :key="ch" class="kg-chip")
                img(:src="symbol(ch)" alt="" @error="hideBroken")
                | {{ t('app.bigGames.karawane.chars.' + ch) }}
            span(class="kg-route-foot")
              AdventureStars(:stars="levelStars[i] ?? 0" :size="18")
              span(v-if="(save.best[i] ?? 0) > 0" class="kg-route-best") {{ t('app.bigGames.karawane.best') }} {{ save.best[i] }} {{ t('app.bigGames.karawane.meters') }}
        p(class="kg-rules") {{ t('app.bigGames.karawane.starRules') }}
        div(class="kg-menu-buttons")
          AdvButton(data-test="karawane-shop" @click="shop = true") {{ t('app.bigGames.karawane.workshop') }}
          AdvButton(tone="blau" small data-test="karawane-how" @click="how = true") {{ t('app.bigGames.karawane.howTitle') }}
          AdvButton(tone="blau" small @click="leave") {{ t('app.bigGames.karawane.leave') }}

    //- the game
    template(v-else-if="screen === 'play'")
      div(class="kg-hud")
        button(type="button" class="kg-pause" :aria-label="t('app.bigGames.karawane.pause')" @click="paused = true") ❚❚
        div(class="kg-hud-mid")
          div(class="kg-meters")
            span(class="kg-meters-n") {{ hud.meters }}
            span(class="kg-meters-u") {{ t('app.bigGames.karawane.meters') }}
          div(class="kg-track")
            div(class="kg-track-fill" :style="{ width: progressShare * 100 + '%' }")
          div(v-if="!hud.trial" class="kg-sun" :aria-label="t('app.bigGames.karawane.sunUp')" data-test="karawane-sun")
            div(class="kg-sun-track")
              span(class="kg-sun-dusk" :style="{ left: hud.dusk * 100 + '%' }")
              img(:src="sunPic" alt="" class="kg-sun-ball" :style="{ left: Math.min(1, hud.sun) * 100 + '%' }" @error="hideBroken")
          div(class="kg-stam" :class="{ 'is-low': hud.low }" :aria-label="t('app.bigGames.karawane.stamina')")
            img(:src="pic('schlauch')" alt="" class="kg-stam-ico" @error="hideBroken")
            div(class="kg-stam-bar")
              div(class="kg-stam-fill" :style="{ width: stamBar }")
        div(class="kg-hud-right")
          div(class="kg-coins")
            img(:src="coinIcon" alt="" class="kg-coin" @error="hideBroken")
            span(:key="hud.poppedCoins" class="kg-coins-n" :class="{ 'kg-pop': hud.poppedCoins > 0 }") {{ hud.coins }}
          div(v-if="hud.best > 0" class="kg-best") {{ t('app.bigGames.karawane.best') }} {{ hud.best }} {{ t('app.bigGames.karawane.meters') }}
      //- the two pedals (the whole halves of the screen work; these only show what is pressed)
      button(
        v-if="hud.hasHop"
        type="button"
        class="kg-hop"
        :class="{ 'is-ready': hud.hopReady >= 1 }"
        :style="{ '--ready': hud.hopReady }"
        :aria-label="t('app.bigGames.karawane.hopButton')"
        data-test="karawane-hop"
        @pointerdown.stop.prevent="doHop"
      )
        img(:src="pic('feder')" alt="" @error="hideBroken")
      img(:src="arrowLeft" alt="" class="kg-pedal kg-pedal--brake" :class="{ 'is-on': hud.brake }" @error="hideBroken")
      img(:src="arrowLeft" alt="" class="kg-pedal kg-pedal--gas" :class="{ 'is-on': hud.gas }" @error="hideBroken")
      div(v-if="tipShown" class="kg-tip") {{ hud.hasHop ? t('app.bigGames.karawane.hopHint') : t('app.bigGames.karawane.tip') }}

      div(v-if="paused && !how" class="kg-menu kg-menu--dim")
        div(class="kg-card kg-card--small")
          h2(class="kg-title") {{ t('app.bigGames.karawane.pause') }}
          AdvButton(@click="paused = false") {{ t('app.bigGames.karawane.resume') }}
          AdvButton(tone="blau" @click="start(route)") {{ t('app.bigGames.karawane.again') }}
          AdvButton(tone="blau" @click="toMenu") {{ t('app.bigGames.karawane.menu') }}

    //- the end of a round
    div(v-else-if="screen === 'result'" class="kg-menu kg-menu--dim")
      div(class="kg-card kg-card--small")
        h2(class="kg-title") {{ routeName(route) }}
        AdventureStars(:stars="outcome.stars" :size="52" celebrate)
        p(class="kg-text") {{ resultText }}
        p(v-if="outcome.practice && outcome.phase === 'won'" class="kg-record" data-test="karawane-trial-result") {{ trialText }}
        p(v-if="outcome.record" class="kg-record") {{ t('app.bigGames.karawane.record') }}
        p(v-if="!outcome.practice && outcome.phase === 'won'" class="kg-text" data-test="karawane-arrived") {{ t('app.bigGames.karawane.arrived') }} {{ outcome.arrivedText }} · {{ t('app.bigGames.karawane.jarsWhole') }}: {{ outcome.jars }} / 3
        div(v-if="!outcome.practice" class="kg-tally")
          span {{ t('app.bigGames.karawane.reached') }}
          b {{ outcome.meters }} {{ t('app.bigGames.karawane.meters') }}
          span {{ t('app.bigGames.karawane.found') }}
          b
            img(:src="coinIcon" alt="" class="kg-coin kg-coin--s" @error="hideBroken")
            | {{ outcome.found }}
          span {{ t('app.bigGames.karawane.bonus') }}
          b
            img(:src="coinIcon" alt="" class="kg-coin kg-coin--s" @error="hideBroken")
            | {{ outcome.bonus }}
          span(v-if="outcome.winBonus > 0") {{ t('app.bigGames.karawane.winBonus') }}
          b(v-if="outcome.winBonus > 0")
            img(:src="coinIcon" alt="" class="kg-coin kg-coin--s" @error="hideBroken")
            | {{ outcome.winBonus }}
        AdvButton(v-if="nextRoute >= 0 && !outcome.practice" data-test="karawane-next" @click="start(nextRoute)") {{ t('app.bigGames.karawane.next') }}
        AdvButton(v-if="outcome.practice" data-test="karawane-trial-again" @click="startTrial") {{ t('app.bigGames.karawane.trial') }}
        AdvButton(v-else :tone="nextRoute >= 0 ? 'blau' : 'gold'" data-test="karawane-again" @click="start(route)") {{ t('app.bigGames.karawane.again') }}
        AdvButton(v-if="canResume && !outcome.practice" tone="blau" data-test="karawane-oasis" @click="start(route, outcome.checkpoint)") {{ t('app.bigGames.karawane.fromOasis') }}
        div(class="kg-menu-buttons")
          AdvButton(tone="blau" small @click="shop = true") {{ t('app.bigGames.karawane.workshop') }}
          AdvButton(tone="blau" small @click="toMenu") {{ t('app.bigGames.karawane.menu') }}

    //- the story card of a route (the first time): what it is about and what the task is
    div(v-if="storyRoute >= 0 && loaded" class="kg-menu kg-menu--dim" data-test="karawane-story")
      div(class="kg-card kg-story")
        img(:src="thumb(storyRoute)" alt="" class="kg-story-pic" @error="hideBroken")
        h2(class="kg-title") {{ routeName(storyRoute) }}
        p(class="kg-text") {{ storyOf(storyRoute) }}
        p(class="kg-task")
          b {{ t('app.bigGames.karawane.taskLabel') }}:
          |  {{ taskOf(storyRoute) }}
        AdvButton(data-test="karawane-story-go" @click="storyGo") {{ t('app.bigGames.karawane.routeGo') }}

    //- the workshop: the wagon grows with the parts, six parts and four animals
    div(v-if="shop && loaded" class="kg-menu kg-menu--dim" data-test="karawane-workshop")
      div(class="kg-card kg-shop")
        div(class="kg-shop-head")
          div(class="kg-wagon" data-test="karawane-wagon" :data-tier="wagonView.tier")
            div(class="kg-wagon-fig" :style="wagonView.box")
              img(:src="wagonView.cart" alt="" class="kg-wagon-cart" :style="wagonView.cartStyle" @error="hideBroken")
              img(:src="wagonView.wheel" alt="" class="kg-wagon-wheel" :style="wagonView.wheelStyle" @error="hideBroken")
            span(class="kg-wagon-name") {{ tierName }}
          div(class="kg-shop-title")
            h2(class="kg-title") {{ t('app.bigGames.karawane.workshop') }}
            div(class="kg-purse")
              img(:src="coinIcon" alt="" class="kg-coin" @error="hideBroken")
              span(class="kg-purse-n") {{ save.coins }}
            p(class="kg-rules") {{ t('app.bigGames.karawane.workshopIntro') }}
        div(class="kg-now" data-test="karawane-now")
          span(class="kg-now-chip") {{ t('app.bigGames.karawane.stats.speed') }} {{ Math.round(statNow.vmax * 3.6) }} km/h
          span(class="kg-now-chip") {{ t('app.bigGames.karawane.stats.pull') }} {{ statNow.power.toFixed(1) }}
          span(class="kg-now-chip") {{ t('app.bigGames.karawane.stats.grip') }} {{ Math.round(statNow.mu * 100) }}
          span(class="kg-now-chip") {{ t('app.bigGames.karawane.stats.stamina') }} {{ Math.round(statNow.staminaSec) }} s
          span(class="kg-now-chip") {{ t('app.bigGames.karawane.stats.coins') }} ×{{ statNow.coinMult.toFixed(2) }}
          AdvButton(tone="blau" small data-test="karawane-trial" @click="startTrial") {{ t('app.bigGames.karawane.trial') }}
        div(class="kg-parts")
          div(v-for="id in UPGRADE_IDS" :key="id" class="kg-part")
            img(:src="partThumb(id)" alt="" class="kg-part-pic" @error="hideBroken")
            div(class="kg-part-text")
              b {{ t('app.bigGames.karawane.parts.' + id) }}
              span {{ t('app.bigGames.karawane.partInfo.' + id) }}
              span(v-if="statFor(id)" class="kg-delta" :data-test="`karawane-delta-${id}`") {{ statFor(id).label }}: {{ statFor(id).from }} → {{ statFor(id).to }}
              span(class="kg-pips")
                i(v-for="p in pips(id)" :key="p" :class="{ 'is-on': p < levelOf(id) }")
            button(
              type="button"
              class="kg-buy"
              :class="{ 'is-poor': !canBuyUpgrade(save, id) }"
              :disabled="upgradeCost(save, id) === null"
              :data-test="`karawane-buy-${id}`"
              @click="buyPart(id)"
            )
              template(v-if="upgradeCost(save, id) === null") {{ t('app.bigGames.karawane.maxed') }}
              template(v-else)
                img(:src="coinIcon" alt="" class="kg-coin kg-coin--s" @error="hideBroken")
                | {{ upgradeCost(save, id) }}
        div(class="kg-animals")
          div(v-for="id in ANIMAL_IDS" :key="id" class="kg-animal" :class="{ 'is-on': save.animal === id }")
            img(:src="animalThumb(id)" alt="" class="kg-animal-pic" @error="hideBroken")
            b {{ t('app.bigGames.karawane.animals.' + id) }}
            span {{ t('app.bigGames.karawane.animalInfo.' + id) }}
            span(class="kg-delta" :data-test="`karawane-animal-stat-${id}`") {{ animalStat(id).speed }} · {{ animalStat(id).pull }} · {{ animalStat(id).stamina }}
            button(
              type="button"
              class="kg-buy"
              :class="{ 'is-poor': !save.owned.includes(id) && save.coins < ANIMALS[id].cost }"
              :disabled="save.animal === id"
              :data-test="`karawane-animal-${id}`"
              @click="animalAction(id)"
            )
              template(v-if="save.animal === id") {{ t('app.bigGames.karawane.inUse') }}
              template(v-else-if="save.owned.includes(id)") {{ t('app.bigGames.karawane.harness') }}
              template(v-else)
                img(:src="coinIcon" alt="" class="kg-coin kg-coin--s" @error="hideBroken")
                | {{ ANIMALS[id].cost }}
        AdvButton(data-test="karawane-shop-close" @click="shop = false") {{ t('app.bigGames.karawane.resume') }}

    //- the explanation (once; the question mark in the menu brings it back)
    div(v-if="how && loaded" class="kg-menu kg-menu--dim")
      div(class="kg-card kg-how")
        h2(class="kg-title") {{ t('app.bigGames.karawane.howTitle') }}
        div(class="kg-how-row")
          img(:src="arrowLeft" alt="" class="kg-how-arrow kg-how-arrow--gas" @error="hideBroken")
          p(class="kg-how-line") {{ t('app.bigGames.karawane.howGas') }}
        div(class="kg-how-row")
          img(:src="arrowLeft" alt="" class="kg-how-arrow" @error="hideBroken")
          p(class="kg-how-line") {{ t('app.bigGames.karawane.howBrake') }}
        div(class="kg-how-row")
          img(:src="coinIcon" alt="" class="kg-how-arrow" @error="hideBroken")
          p(class="kg-how-line") {{ t('app.bigGames.karawane.howWater') }}
        AdvButton(data-test="karawane-go" @click="closeHow") {{ t('app.bigGames.karawane.go') }}

    //- upright: the note to turn the phone
    div(v-if="portrait && screen === 'play' && !showRotateAnyway" class="kg-rotate")
      div(class="kg-rotate-icon" aria-hidden="true") ⟳
      p {{ t('app.bigGames.karawane.rotate') }}
      AdvButton(tone="blau" small @click="showRotateAnyway = true") {{ t('app.bigGames.karawane.rotateAnyway') }}
</template>

<style scoped lang="sass">
.kg
  position: fixed
  inset: 0
  z-index: 60
  background: #2a1f14
  overflow: hidden
  user-select: none
  -webkit-user-select: none
  touch-action: none

.kg-canvas
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  touch-action: none

.kg-center
  position: absolute
  inset: 0
  display: grid
  place-items: center

.kg-spinner
  width: 46px
  height: 46px
  border-radius: 50%
  border: 5px solid rgba(255, 255, 255, 0.25)
  border-top-color: #f5c84a
  animation: kg-spin 0.9s linear infinite

@keyframes kg-spin
  to
    transform: rotate(360deg)

.kg-menu
  position: absolute
  inset: 0
  display: grid
  place-items: center
  padding: 14px
  overflow-y: auto
  background: linear-gradient(180deg, rgba(20, 12, 4, 0.18), rgba(20, 12, 4, 0.42))

  &--dim
    background: rgba(20, 12, 6, 0.6)

.kg-card
  width: min(760px, 100%)
  padding: 20px 20px 16px
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
    width: min(440px, 100%)

.kg-title
  margin: 0
  font-size: 1.6rem
  font-weight: 800

.kg-text
  margin: 0
  font-size: 1.15rem
  line-height: 1.4

.kg-rules
  margin: 0
  font-size: 0.85rem
  color: var(--lk-muted, #7a6b4f)

.kg-record
  margin: 0
  font-weight: 800
  color: #b8741a

.kg-coin
  height: 26px
  width: auto
  vertical-align: middle

  &--s
    height: 20px
    margin-right: 4px

.kg-purse
  display: flex
  align-items: center
  gap: 8px
  font-weight: 800

.kg-purse-n
  font-size: 1.4rem

.kg-purse-l
  color: var(--lk-muted, #7a6b4f)
  font-weight: 600

.kg-routes
  display: grid
  grid-template-columns: repeat(3, minmax(0, 1fr))
  gap: 10px
  width: 100%

.kg-route
  position: relative
  display: flex
  flex-direction: column
  align-items: stretch
  gap: 2px
  padding: 0 0 8px
  overflow: hidden
  border: 2px solid var(--lk-line, #e3d7bb)
  border-radius: 16px
  background: var(--lk-surface-2, #f6efdc)
  color: inherit
  font: inherit
  text-align: left
  cursor: pointer

.kg-route-pic
  display: block
  width: 100%
  aspect-ratio: 16 / 9
  object-fit: cover
  background: #e8c99a

.kg-route-no
  position: absolute
  top: 6px
  left: 6px
  display: grid
  place-items: center
  width: 28px
  height: 28px
  border-radius: 50%
  background: var(--lk-accent, #1f6a6a)
  color: var(--lk-on-accent, #fff)
  font-weight: 800

.kg-route-name
  padding: 4px 10px 0
  font-weight: 800
  font-size: 0.9rem
  line-height: 1.15

.kg-route-ref
  padding: 0 10px
  font-size: 0.74rem
  color: var(--lk-muted, #7a6b4f)

.kg-route-foot
  display: flex
  align-items: center
  justify-content: space-between
  gap: 6px
  padding: 2px 10px 0

.kg-route-best
  font-size: 0.74rem
  font-weight: 700
  color: var(--lk-muted, #7a6b4f)

.kg-menu-buttons
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 10px

@media (max-width: 640px)
  .kg-routes
    grid-template-columns: repeat(2, minmax(0, 1fr))

.kg-hud
  position: absolute
  top: 0
  left: 0
  right: 0
  display: flex
  align-items: flex-start
  justify-content: space-between
  gap: 10px
  padding: max(8px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) 8px max(12px, env(safe-area-inset-left))
  pointer-events: none

.kg-hud > *
  pointer-events: auto

.kg-pause
  width: 48px
  height: 48px
  border: none
  border-radius: 50%
  background: rgba(255, 255, 255, 0.88)
  color: #2a2418
  font-weight: 800
  cursor: pointer

.kg-hud-mid
  display: flex
  flex-direction: column
  align-items: center
  gap: 5px
  pointer-events: none

.kg-meters
  display: flex
  align-items: baseline
  gap: 4px
  padding: 2px 16px
  border-radius: 16px
  background: rgba(255, 250, 235, 0.86)
  font-weight: 800

.kg-meters-n
  font-size: 1.7rem
  min-width: 2.2ch
  text-align: right

.kg-meters-u
  font-size: 1rem

.kg-track
  position: relative
  width: min(300px, 38vw)
  height: 10px
  border-radius: 6px
  background: rgba(255, 250, 235, 0.55)

.kg-track-fill
  height: 100%
  border-radius: 6px
  background: #e0a030

.kg-mark
  position: absolute
  top: -9px
  transform: translateX(-50%)
  font-size: 1.15rem
  color: rgba(120, 100, 60, 0.9)
  text-shadow: 0 0 3px rgba(255, 255, 255, 0.9)

  &.is-done
    color: #f3b81a

.kg-stam
  display: flex
  align-items: center
  gap: 6px
  padding: 3px 10px 3px 6px
  border-radius: 999px
  background: rgba(255, 250, 235, 0.86)

  &.is-low
    animation: kg-blink 0.7s ease-in-out infinite

.kg-stam-ico
  height: 26px
  width: auto

.kg-stam-bar
  width: min(160px, 24vw)
  height: 12px
  border-radius: 7px
  background: rgba(90, 70, 40, 0.25)
  overflow: hidden

.kg-stam-fill
  height: 100%
  border-radius: 7px
  background: linear-gradient(90deg, #4aa8d8, #7fd0f0)
  transition: width 0.15s linear

@keyframes kg-blink
  50%
    background: rgba(255, 190, 150, 0.95)

.kg-hud-right
  display: flex
  flex-direction: column
  align-items: flex-end
  gap: 6px
  pointer-events: none

.kg-coins
  display: flex
  align-items: center
  gap: 6px
  padding: 3px 14px 3px 8px
  border-radius: 999px
  background: rgba(255, 250, 235, 0.88)
  font-weight: 800
  font-size: 1.3rem

.kg-pop
  display: inline-block
  animation: kg-pop 0.3s ease-out

@keyframes kg-pop
  0%
    transform: scale(1.5)
  100%
    transform: scale(1)

.kg-best
  padding: 2px 12px
  border-radius: 999px
  background: rgba(255, 250, 235, 0.7)
  font-size: 0.8rem
  font-weight: 700

.kg-pedal
  position: absolute
  bottom: max(18px, env(safe-area-inset-bottom))
  width: 84px
  height: auto
  opacity: 0.45
  pointer-events: none
  transition: opacity 0.1s, transform 0.1s

  &.is-on
    opacity: 1
    transform: scale(1.12)

  &--brake
    left: max(22px, env(safe-area-inset-left))

  &--gas
    right: max(22px, env(safe-area-inset-right))
    transform: scaleX(-1)

    &.is-on
      transform: scaleX(-1.12) scaleY(1.12)

.kg-tip
  position: absolute
  left: 50%
  bottom: 26px
  transform: translateX(-50%)
  max-width: min(520px, 70vw)
  padding: 10px 18px
  border-radius: 999px
  background: rgba(255, 250, 235, 0.94)
  color: #2a2418
  font-weight: 700
  text-align: center
  pointer-events: none

.kg-tally
  display: grid
  grid-template-columns: 1fr auto
  gap: 2px 16px
  width: min(260px, 100%)
  text-align: left

  b
    display: flex
    align-items: center
    justify-content: flex-end

.kg-shop
  gap: 8px
  max-height: calc(100vh - 28px)
  overflow-y: auto

.kg-parts
  display: grid
  grid-template-columns: repeat(2, minmax(0, 1fr))
  gap: 8px
  width: 100%

.kg-part
  display: flex
  align-items: center
  gap: 10px
  padding: 8px
  border: 2px solid var(--lk-line, #e3d7bb)
  border-radius: 16px
  background: var(--lk-surface-2, #f6efdc)
  text-align: left

.kg-part-pic
  height: 54px
  width: 54px
  object-fit: contain

.kg-part-text
  flex: 1
  display: flex
  flex-direction: column
  gap: 2px
  min-width: 0
  font-size: 0.82rem

.kg-pips
  display: flex
  gap: 3px

  i
    display: block
    width: 14px
    height: 8px
    border-radius: 4px
    background: rgba(90, 70, 40, 0.25)

    &.is-on
      background: #e0a030

.kg-buy
  display: inline-flex
  align-items: center
  justify-content: center
  white-space: nowrap
  min-width: 72px
  min-height: 44px
  padding: 6px 12px
  border: none
  border-radius: 999px
  background: var(--lk-accent, #1f6a6a)
  color: var(--lk-on-accent, #fff)
  font: inherit
  font-weight: 800
  cursor: pointer

  &.is-poor
    background: rgba(90, 70, 40, 0.3)
    color: var(--lk-text, #2a2418)

  &:disabled
    background: transparent
    color: var(--lk-muted, #7a6b4f)
    cursor: default

.kg-animals
  display: grid
  grid-template-columns: repeat(3, minmax(0, 1fr))
  gap: 8px
  width: 100%

.kg-animal
  display: flex
  flex-direction: column
  align-items: center
  gap: 3px
  padding: 8px 6px
  border: 2px solid var(--lk-line, #e3d7bb)
  border-radius: 16px
  background: var(--lk-surface-2, #f6efdc)
  font-size: 0.78rem

  &.is-on
    border-color: #e0a030

.kg-animal-pic
  height: 64px
  width: auto
  max-width: 100%
  object-fit: contain

.kg-how
  gap: 20px
  width: min(520px, 100%)

.kg-how-row
  display: flex
  align-items: center
  gap: 16px
  width: 100%

.kg-how-arrow
  width: 56px
  height: 56px
  flex: none
  object-fit: contain

  &--gas
    transform: scaleX(-1)

.kg-how-line
  margin: 0
  text-align: left
  font-size: 1.2rem
  font-weight: 700
  line-height: 1.3

.kg-rotate
  position: absolute
  inset: 0
  z-index: 5
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  gap: 14px
  padding: 24px
  background: rgba(30, 20, 10, 0.92)
  color: #fff6dc
  text-align: center
  font-size: 1.1rem
  font-weight: 700

.kg-rotate-icon
  font-size: 4rem
  animation: kg-turn 2s ease-in-out infinite

@keyframes kg-turn
  0%, 20%
    transform: rotate(0)
  60%, 100%
    transform: rotate(90deg)

// a phone held sideways: the six routes in two rows of three, small, so that the menu fits without scrolling
@media (max-height: 520px) and (min-width: 560px)
  .kg-menu
    padding: 8px

  .kg-card
    padding: 10px 14px 10px
    gap: 6px
    width: min(900px, 100%)

  .kg-title
    font-size: 1.25rem

  .kg-card--small
    gap: 4px

  .kg-card--small :deep(.adv-btn)
    min-height: 40px

  .kg-routes
    grid-template-columns: repeat(6, minmax(0, 1fr))
    gap: 6px

  .kg-route-pic
    aspect-ratio: 16 / 10

  .kg-route-name
    padding: 2px 6px 0
    font-size: 0.68rem

  .kg-route-ref
    display: none

  .kg-route-foot
    padding: 0 6px
    flex-wrap: wrap

  .kg-route-best
    font-size: 0.64rem

  .kg-rules
    display: none

  .kg-shop
    max-height: calc(100vh - 16px)
    gap: 4px

  .kg-parts
    grid-template-columns: repeat(6, minmax(0, 1fr))

  .kg-part
    flex-direction: column
    justify-content: center
    padding: 4px
    gap: 2px
    text-align: center

  .kg-part-pic
    height: 30px
    width: 30px

  .kg-part-text
    align-items: center

  .kg-part-text span:not(.kg-pips)
    display: none

  .kg-animal-pic
    height: 40px

  .kg-animal span
    display: none

// the character of a route (small painted symbols with a word), the story card, the wagon preview in the workshop, the hop button
.kg-chips
  display: flex
  flex-wrap: wrap
  gap: 3px
  padding: 2px 8px 0

.kg-chip
  display: inline-flex
  align-items: center
  gap: 3px
  padding: 1px 6px 1px 2px
  border-radius: 999px
  background: rgba(224, 160, 48, 0.18)
  font-size: 0.66rem
  font-weight: 700
  white-space: nowrap

  img
    height: 16px
    width: auto

.kg-story
  width: min(560px, 100%)
  gap: 8px

.kg-story-pic
  width: 100%
  max-height: 150px
  object-fit: cover
  border-radius: 14px

.kg-task
  margin: 0
  padding: 8px 12px
  border-radius: 14px
  background: rgba(224, 160, 48, 0.2)
  font-size: 1.15rem
  line-height: 1.35

.kg-shop-head
  display: flex
  align-items: center
  justify-content: center
  gap: 16px
  width: 100%

.kg-shop-title
  display: flex
  flex-direction: column
  align-items: center
  gap: 4px

.kg-wagon
  display: flex
  flex-direction: column
  align-items: center
  gap: 2px

.kg-wagon-fig
  position: relative

.kg-wagon-cart
  position: absolute
  left: 0
  height: auto

.kg-wagon-wheel
  position: absolute
  height: auto

.kg-wagon-name
  font-size: 0.8rem
  font-weight: 800

.kg-hop
  position: absolute
  left: max(24px, env(safe-area-inset-left))
  bottom: calc(max(18px, env(safe-area-inset-bottom)) + 78px)
  width: 64px
  height: 64px
  padding: 8px
  border: none
  border-radius: 50%
  background: rgba(255, 250, 235, 0.55)
  opacity: 0.55
  cursor: pointer
  touch-action: none

  img
    width: 100%
    height: 100%
    object-fit: contain
    pointer-events: none

  &.is-ready
    opacity: 1
    background: rgba(255, 250, 235, 0.9)
    box-shadow: 0 0 0 3px rgba(224, 160, 48, 0.8)

// a slimmer top bar: the play field takes the room
.kg-hud
  padding-top: max(4px, env(safe-area-inset-top))
  padding-bottom: 2px

.kg-pause
  width: 38px
  height: 38px
  font-size: 0.8rem

.kg-meters
  padding: 0 12px

.kg-meters-n
  font-size: 1.25rem

.kg-meters-u
  font-size: 0.8rem

.kg-track
  height: 7px

.kg-mark
  top: -8px
  font-size: 0.95rem

.kg-stam
  padding: 1px 8px 1px 4px

.kg-stam-ico
  height: 20px

.kg-stam-bar
  height: 9px

.kg-coins
  padding: 1px 10px 1px 6px
  font-size: 1.05rem

.kg-coins .kg-coin
  height: 20px

.kg-best
  font-size: 0.68rem
  padding: 0 8px

.kg-pedal
  width: 64px
  bottom: max(10px, env(safe-area-inset-bottom))

.kg-tip
  bottom: 14px
  padding: 6px 14px
  font-size: 0.85rem

@media (max-height: 520px) and (min-width: 560px)
  .kg-shop-head
    gap: 10px

  .kg-wagon-fig
    transform: scale(0.75)
    transform-origin: top center
    margin-bottom: -34px

  .kg-story-pic
    max-height: 70px

  .kg-story
    gap: 4px
    padding: 10px 16px

  .kg-story .kg-text, .kg-task
    font-size: 0.82rem
    line-height: 1.25

  .kg-animals
    grid-template-columns: repeat(4, minmax(0, 1fr))

// the sun that wanders (the evening is marked), the numbers of the cart, the before and after of a part
.kg-sun
  width: min(300px, 38vw)

.kg-sun-track
  position: relative
  height: 9px
  border-radius: 6px
  background: linear-gradient(90deg, rgba(255, 214, 110, 0.9), rgba(255, 150, 70, 0.9) 78%, rgba(70, 60, 120, 0.9))

.kg-sun-dusk
  position: absolute
  top: -2px
  width: 2px
  height: 13px
  background: rgba(60, 30, 20, 0.7)

.kg-sun-ball
  position: absolute
  top: 50%
  width: 24px
  height: 24px
  transform: translate(-50%, -50%)
  pointer-events: none

.kg-now
  display: flex
  flex-wrap: wrap
  align-items: center
  justify-content: center
  gap: 4px 6px
  width: 100%

.kg-now-chip
  padding: 1px 8px
  border-radius: 999px
  background: rgba(224, 160, 48, 0.2)
  font-size: 0.72rem
  font-weight: 700
  white-space: nowrap

.kg-delta
  font-size: 0.7rem
  font-weight: 800
  color: #9a6310

// short screens: the explanation card closer together
@media (max-height: 520px)
  .kg-how
    gap: 8px
  .kg-how-row
    gap: 12px
  .kg-how-arrow
    width: 40px
    font-size: 1.5rem
    height: 40px
  .kg-how-line
    font-size: 1.05rem
</style>
