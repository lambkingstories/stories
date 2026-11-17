<script setup lang="ts">
/**
 * "Davids Schleuder": the big game (rules and physics in `utils/davidGame.ts`, this file draws it and takes the touch).
 * Ten levels: wolves, bears, lions and the pack, at the end Goliath. The picture is 16:9; on a phone held upright a note asks to turn it.
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
import { approach, stepCount, walkPose } from '@/utils/davidWalk'
import { RIG_PICTURES, createRig } from '@/utils/davidRig'
import {
  GOLIATH_LEVEL,
  KINDS,
  GROUND,
  H,
  LEVELS,
  MAX_PULL,
  SHEEP_LINE,
  SLING,
  STONE_R,
  W,
  body,
  clampPull,
  forehead,
  newGame,
  preview,
  shoot,
  starsFor,
  step,
  walked,
  type Animal,
  type Game,
  type Kind
} from '@/utils/davidGame'

const emit = defineEmits<{ leave: [] }>()
const { t, tm, rt } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const music = useMusic()
const progress = useBigGames()
const ID = 'david'

// ── the pictures ────────────────────────────────────────────────────────────────────────────────────────────────────────────
const NAMES = [
  'wiese', 'david-bereit', 'david-spannt', 'david-spannt-koerper', 'david-arm', 'david-schiesst', 'stein', 'schaf', 'schaf-grasen', 'lamm', 'busch', 'fels-gross', 'fels-mittel', 'fels-klein',
  'wolf-a', 'wolf-b', 'wolf-treffer', 'baer-a', 'baer-b', 'baer-treffer', 'loewe-a', 'loewe-b', 'loewe-treffer', 'adler-a', 'adler-b', 'adler-treffer',
  // the painted parts of Goliath
  ...RIG_PICTURES
]
const img: Record<string, HTMLImageElement | undefined> = {}
const loaded = ref(false)
const glow = new Image()
glow.src = prependBaseUrl('images/abenteuer/ui/sternglanz.webp')

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
          i.src = prependBaseUrl(`images/spiele-gross/david/${n}.webp`)
        })
    )
  ).then(() => {
    loaded.value = true
  })
}

// ── the screens ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
type Screen = 'menu' | 'play' | 'result'
const screen = ref<Screen>('menu')
const level = ref(0)
const paused = ref(false)
const portrait = ref(false)
const showRotateAnyway = ref(false)
const levelNames = computed(() => ((tm('app.bigGames.david.levels') as unknown as Parameters<typeof rt>[0][]) ?? []).map((m) => rt(m)))
const levelStars = computed(() => progress.levels(ID))
// every level can be played at once (Anton, 12.11.2026)
const unlocked = (_i: number) => true

// what the page shows while it plays (the game itself is not reactive)
const hud = reactive({ sheep: 3, stones: 0 })
const outcome = reactive({ phase: 'play' as 'play' | 'won' | 'lost', stars: 0, noStones: false })

// ── the game ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
let g: Game = newGame(LEVELS[0]!)
const canvas = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let raf = 0
let last = 0
let scale = 1
let ox = 0
let oy = 0
let dpr = 1

interface Aim {
  sx: number
  sy: number
  px: number
  py: number
}
let aim: Aim | null = null
/** The seconds the "throw" pose of David is shown. */
let throwPose = 0
interface Puff {
  x: number
  y: number
  t: number
  kind: 'star' | 'dust'
}
let puffs: Puff[] = []
/** Sheep that were scared away: they run off to the left. */
let runners: { x: number; t: number }[] = []

function start(i: number) {
  level.value = i
  g = newGame(LEVELS[i]!)
  aim = null
  puffs = []
  runners = []
  gait = new Map()
  goliath = { shieldK: 0, steps: 0, shake: 0 }
  throwPose = 0
  outcome.phase = 'play'
  outcome.stars = 0
  outcome.noStones = false
  hud.sheep = g.sheep
  hud.stones = g.stonesLeft
  screen.value = 'play'
  paused.value = false
  // in the first rounds the card explains the game first (the game waits)
  how.value = !howSeen(ID)
  goliathCard.value = false
  maybeGoliathStory()
  paused.value = how.value || goliathCard.value
  tipShown.value = !paused.value && (i === 0 || i === EAGLE_TIP_LEVEL || i === ROCK_TIP_LEVEL || i === GOLIATH_LEVEL)
  window.setTimeout(() => (tipShown.value = false), 6500)
  tryLandscape()
}
const tipShown = ref(false)
/** Before Goliath comes (the first time): who he is and what the task is, on a card (not at every level). */
const goliathCard = ref(false)
function maybeGoliathStory() {
  goliathCard.value = !how.value && level.value === GOLIATH_LEVEL && !howSeen(`${ID}-goliath`)
  if (goliathCard.value) paused.value = true
}
function closeGoliathStory() {
  markHowSeen(`${ID}-goliath`)
  goliathCard.value = false
  paused.value = false
  tipShown.value = true
  window.setTimeout(() => (tipShown.value = false), 6500)
}
/** The first level with eagles gets a word about them. */
const EAGLE_TIP_LEVEL = LEVELS.findIndex((l) => l.waves.some((w) => w.kind === 'eagle'))
/** The first level with boulders gets a word about them (the explanation card no longer lists them). */
const ROCK_TIP_LEVEL = LEVELS.findIndex((l) => l.boulders.length > 0)
/** The card that explains the game: pull back and let go (in the first rounds, and from the button in the levels list). */
const how = ref(false)
/** A picture that is missing is not shown. */
const hideBroken = (e: Event) => {
  ;(e.target as HTMLElement).style.display = 'none'
}
function closeHow() {
  how.value = false
  markHowSeen(ID)
  if (screen.value === 'play') {
    maybeGoliathStory()
    if (goliathCard.value) return
    paused.value = false
    // the card is gone for good: a short hint in the game takes its place
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

function toMenu() {
  screen.value = 'menu'
  paused.value = false
}

function end(phase: 'won' | 'lost') {
  const stars = starsFor(g)
  outcome.phase = phase
  outcome.stars = stars
  outcome.noStones = phase === 'lost' && g.sheep > 0
  progress.record(ID, level.value, stars)
  window.setTimeout(() => {
    screen.value = 'result'
    if (phase === 'won') play('result')
    else play('wrong')
  }, 900)
}

function sound(events: Game['events']) {
  for (const e of events) {
    if (e.type === 'shot') play('flip')
    else if (e.type === 'bounce') play('tap')
    else if (e.type === 'hit') {
      // a stone that hits something: a dull thud, not a tone
      play('hit')
      puffs.push({ x: e.x, y: e.y, t: 0, kind: 'star' })
    } else if (e.type === 'scare') play('right')
    else if (e.type === 'block') play('clunk')
    else if (e.type === 'loss') {
      play('wrong')
      runners.push({ x: 150, t: 0 })
    } else if (e.type === 'fall') play('fanfare')
    else if (e.type === 'end') end(e.phase)
    if (e.type === 'bounce') puffs.push({ x: e.x, y: e.y, t: 0, kind: 'dust' })
  }
}

// ── the touch ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
function scenePos(e: PointerEvent): { x: number; y: number } {
  const c = canvas.value!
  const r = c.getBoundingClientRect()
  return { x: ((e.clientX - r.left) / r.width * c.width / dpr - ox) / scale, y: ((e.clientY - r.top) / r.height * c.height / dpr - oy) / scale }
}
function onDown(e: PointerEvent) {
  if (screen.value !== 'play' || paused.value || g.phase !== 'play') return
  ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
  const p = scenePos(e)
  aim = { sx: p.x, sy: p.y, px: 0, py: 0 }
}
function onMove(e: PointerEvent) {
  if (!aim) return
  const p = scenePos(e)
  const c = clampPull(p.x - aim.sx, p.y - aim.sy)
  aim.px = c.x
  aim.py = c.y
}
function onUp() {
  if (!aim) return
  const a = aim
  aim = null
  if (screen.value !== 'play' || paused.value) return
  if (shoot(g, a.px, a.py)) {
    throwPose = 0.28
    hud.stones = g.stonesLeft
  }
}

// ── the loop ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
function resize() {
  const c = canvas.value
  if (!c) return
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  // the size of the box the canvas fills (not the window: a page scroll bar would take some of it)
  const box = c.getBoundingClientRect()
  const vw = box.width || window.innerWidth
  const vh = box.height || window.innerHeight
  portrait.value = vh > vw
  c.width = Math.round(vw * dpr)
  c.height = Math.round(vh * dpr)
  scale = Math.min(vw / W, vh / H)
  ox = (vw - W * scale) / 2
  oy = (vh - H * scale) / 2
}

/** One step of the whole game (rules, legs, puffs), `dt` seconds. */
function update(dt: number) {
  step(g, dt)
  stepGait()
  stepGoliath(dt)
  sound(g.events)
  if (throwPose > 0) throwPose -= dt
  for (const p of puffs) p.t += dt
  puffs = puffs.filter((p) => p.t < 0.6)
  for (const r of runners) {
    r.t += dt
    r.x -= 300 * dt
  }
  runners = runners.filter((r) => r.x > -150)
  if (hud.sheep !== g.sheep) hud.sheep = g.sheep
  if (hud.stones !== g.stonesLeft) hud.stones = g.stonesLeft
}

function frame(now: number) {
  raf = requestAnimationFrame(frame)
  const dt = Math.min(0.033, (now - last) / 1000 || 0)
  last = now
  if (screen.value === 'play' && !paused.value && !(portrait.value && !showRotateAnyway.value)) update(dt)
  draw(now / 1000)
}

function sprite(ctx2: CanvasRenderingContext2D, name: string, cx: number, bottom: number, height: number, flip = false, rot = 0) {
  const i = img[name]
  if (!i) {
    // a picture that is missing: a plain block, so the game can still be played
    ctx2.fillStyle = 'rgba(120,90,50,0.6)'
    ctx2.fillRect(cx - height / 4, bottom - height, height / 2, height)
    return
  }
  const w = (i.width / i.height) * height
  ctx2.save()
  ctx2.translate(cx, bottom)
  if (rot) ctx2.rotate(rot)
  if (flip) ctx2.scale(-1, 1)
  ctx2.drawImage(i, -w / 2, -height, w, height)
  ctx2.restore()
}

/** A picture at a scale (all the poses of one figure are drawn at the same scale, so the figure does not change its size). */
function spr(c: CanvasRenderingContext2D, name: string, cx: number, bottom: number, k: number, flip = false, rot = 0) {
  const i = img[name]
  sprite(c, name, cx, bottom, i ? i.height * k : 100 * k, flip, rot)
}

const KIND_SPRITE: Record<Exclude<Kind, 'goliath'>, { a: string; b: string; hit: string; k: number }> = {
  wolf: { a: 'wolf-a', b: 'wolf-b', hit: 'wolf-treffer', k: 0.5 },
  bear: { a: 'baer-a', b: 'baer-b', hit: 'baer-treffer', k: 0.77 },
  lion: { a: 'loewe-a', b: 'loewe-b', hit: 'loewe-treffer', k: 0.57 },
  eagle: { a: 'adler-a', b: 'adler-b', hit: 'adler-treffer', k: 0.42 }
}

/** Goliath is a puppet of painted parts (see `utils/davidRig.ts` and `utils/davidWalk.ts`): the feet stand still on the ground while he walks. */
const rig = createRig(img)
/** What happens around Goliath: how far his shield is raised (0 to 1, softly), the steps counted, the shake of the ground. */
let goliath = { shieldK: 0, steps: 0, shake: 0 }

function stepGoliath(dt: number) {
  const a = g.animals.find((x) => x.kind === 'goliath')
  goliath.shake = Math.max(0, goliath.shake - dt * 3.2)
  if (!a) return
  goliath.shieldK = approach(goliath.shieldK, a.shield > 0 ? 1 : 0, 11, dt)
  if (a.mode !== 'come') return
  const n = stepCount(walked(a), KINDS.goliath.speed)
  if (n > goliath.steps) {
    goliath.steps = n
    // a heavy foot comes down: dust at the foot, the ground trembles a little
    const pose = walkPose(walked(a), KINDS.goliath.speed)
    const leg = n % 2 === 1 ? pose.far : pose.near
    const fx = a.x + 3 - leg.footX
    puffs.push({ x: fx, y: GROUND - 6, t: 0, kind: 'dust' }, { x: fx + 26, y: GROUND - 2, t: 0.12, kind: 'dust' })
    goliath.shake = 1
  }
}

function drawAnimal(c: CanvasRenderingContext2D, a: Animal) {
  const bottom = GROUND - a.lift + 8
  if (a.kind === 'goliath') {
    const ease = a.fall * a.fall * (3 - 2 * a.fall)
    rig.draw(c, { x: a.x + 3, ground: GROUND + 8, walked: walked(a), speed: KINDS.goliath.speed, fall: ease, shield: goliath.shieldK })
    return
  }
  const s = KIND_SPRITE[a.kind]
  const flee = a.mode === 'flee'
  const hurt = a.hit < 0.25
  if (a.kind === 'eagle') {
    // the eagle beats its wings slower than a runner steps, and has no steps to bob
    const wings = Math.floor(a.t * (flee ? 8 : 3.5)) % 2 ? s.b : s.a
    spr(c, hurt ? s.hit : wings, a.x, bottom, s.k, flee)
    return
  }
  // The legs of the runners: one phase that grows with the DISTANCE the animal really ran (so the feet follow the ground at any speed, also
  // when it is knocked back or runs off), the two leg pictures change at the turning points of the stride, and the body hops and rocks with
  // the same phase (so nothing twitches against anything else).
  const ph = gait.get(a.id)?.ph ?? 0
  const air = a.lift > 4
  const w = Math.sin(ph * Math.PI * 2)
  const name = hurt ? s.hit : air ? s.a : w >= 0 ? s.a : s.b
  const hop = air || hurt ? 0 : Math.abs(w) * GAIT_HOP[a.kind]
  const rock = air || hurt ? 0 : Math.sin(ph * Math.PI * 4 + 0.6) * 0.03
  spr(c, name, a.x, bottom - hop, s.k, flee, flee ? -rock : rock)
}

/** The length of one stride (two leg pictures) of the runners, and how high the body hops with it. */
const STRIDE: Record<Exclude<Kind, 'goliath' | 'eagle'>, number> = { wolf: 64, bear: 88, lion: 78 }
const GAIT_HOP: Record<Exclude<Kind, 'goliath' | 'eagle'>, number> = { wolf: 5, bear: 3, lion: 6 }
/** The phase of the stride of every running animal (in strides), by its id. */
let gait = new Map<number, { ph: number; x: number }>()
function stepGait() {
  for (const a of g.animals) {
    if (a.kind === 'goliath' || a.kind === 'eagle') continue
    let s = gait.get(a.id)
    if (!s) {
      s = { ph: 0, x: a.x }
      gait.set(a.id, s)
    }
    s.ph += Math.abs(a.x - s.x) / STRIDE[a.kind]
    s.x = a.x
  }
  if (gait.size > 40) gait = new Map([...gait].filter(([id]) => g.animals.some((a) => a.id === id)))
}

function draw(time: number) {
  const c = ctx
  const cv = canvas.value
  if (!c || !cv) return
  c.setTransform(1, 0, 0, 1, 0, 0)
  c.fillStyle = '#1a2a1c'
  c.fillRect(0, 0, cv.width, cv.height)
  c.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * ox, dpr * oy)
  c.save()
  c.beginPath()
  c.rect(0, 0, W, H)
  c.clip()
  // a heavy step of Goliath makes the ground tremble a little
  if (goliath.shake > 0.01) c.translate(0, Math.sin(time * 70) * goliath.shake * 2.4)

  // the meadow (the picture is 3:2, the scene 16:9: the ground line of the picture is put on the ground of the scene)
  const bg = img.wiese
  if (bg) {
    const cropH = (bg.width * H) / W
    const sy = Math.max(0, Math.min(bg.height - cropH, bg.height * 0.8 - cropH * (GROUND / H)))
    c.drawImage(bg, 0, sy, bg.width, cropH, 0, 0, W, H)
  } else {
    c.fillStyle = '#9ac26a'
    c.fillRect(0, 0, W, H)
  }

  // boulders and bushes
  for (const b of g.level.boulders) sprite(c, b.r >= 65 ? 'fels-gross' : b.r >= 45 ? 'fels-mittel' : 'fels-klein', b.x, b.y + b.r + 6, b.r * 2.1)
  sprite(c, 'busch', 520, GROUND + 4, 96)

  // the sheep (three places; the ones that were lost are gone)
  const places = [
    { x: 78, h: 92, n: 'schaf-grasen' },
    { x: 150, h: 98, n: 'schaf' },
    { x: 214, h: 64, n: 'lamm' }
  ]
  for (let i = 0; i < Math.min(3, g.sheep); i++) {
    const p = places[i]!
    sprite(c, p.n, p.x, GROUND + 14, p.h + Math.sin(time * 1.5 + i) * 1.5)
  }
  for (const r of runners) sprite(c, 'schaf', r.x, GROUND + 14 - Math.abs(Math.sin(r.t * 14)) * 14, 98, true)

  // David
  const pulling = !!aim && (aim.px !== 0 || aim.py !== 0)
  const armPic = img['david-arm']
  if (throwPose <= 0 && pulling && aim && armPic) {
    // David pulls with his back arm: it follows the finger, so it swings and stretches with the aim. The arm is drawn first, behind the body (the sleeve covers the joint).
    // The picture of the pose is 254 x 237 and drawn at 1.23 times its size around x = 226; the shoulder lies at (112, 82) in the picture.
    const K = 1.23
    const sh = { x: 226 + (112 - 127) * K, y: GROUND + 10 - (237 - 82) * K }
    const tx = SLING.x + aim.px
    const ty = SLING.y + aim.py
    let ang = Math.atan2(ty - sh.y, tx - sh.x)
    if (ang < 0) ang += Math.PI * 2
    // he only pulls backwards: the arm stays in a fan around "straight back"
    ang = Math.min(Math.PI + 1.15, Math.max(Math.PI - 1.15, ang))
    const reach = Math.hypot(tx - sh.x, ty - sh.y)
    const stretch = Math.min(1.9, Math.max(0.85, reach / 58))
    c.save()
    c.translate(sh.x, sh.y)
    c.rotate(ang - Math.PI)
    c.scale(stretch * K, K)
    c.drawImage(armPic, -62, -22)
    c.restore()
    spr(c, 'david-spannt-koerper', 226, GROUND + 10, K)
  } else {
    const pose = throwPose > 0 ? 'david-schiesst' : pulling ? 'david-spannt' : 'david-bereit'
    spr(c, pose, 226, GROUND + 10, 1.23)
  }

  // the animals, the ones in the back first
  const sorted = [...g.animals].sort((a, b) => a.x - b.x)
  for (const a of sorted) drawAnimal(c, a)

  // Goliath's forehead is marked while the shield is down
  for (const a of g.animals) {
    if (a.kind === 'goliath' && a.mode === 'come' && a.shield <= 0) {
      const pulse = 0.5 + 0.5 * Math.sin(time * 6)
      c.strokeStyle = `rgba(255,215,90,${0.45 + 0.4 * pulse})`
      c.lineWidth = 4
      c.setLineDash([8, 8])
      c.beginPath()
      const f = forehead(a)
      c.arc(f.x, f.y, f.r + 4 + pulse * 4, 0, Math.PI * 2)
      c.stroke()
      c.setLineDash([])
    }
  }

  // the sling and the aim
  if (aim && g.phase === 'play' && g.stonesLeft > 0) {
    const sx = SLING.x + aim.px
    const sy = SLING.y + aim.py
    c.strokeStyle = '#6b4423'
    c.lineWidth = 5
    c.lineCap = 'round'
    c.beginPath()
    c.moveTo(SLING.x - 4, SLING.y - 14)
    c.lineTo(sx, sy)
    c.moveTo(SLING.x - 4, SLING.y + 14)
    c.lineTo(sx, sy)
    c.stroke()
    const dots = preview(g, aim.px, aim.py)
    dots.forEach((d, i) => {
      c.fillStyle = `rgba(255,255,255,${0.85 - i * 0.05})`
      c.beginPath()
      c.arc(d.x, d.y, 6 - i * 0.25, 0, Math.PI * 2)
      c.fill()
    })
    sprite(c, 'stein', sx, sy + STONE_R, STONE_R * 2.2)
    // how far the sling is pulled
    c.strokeStyle = 'rgba(255,255,255,0.35)'
    c.lineWidth = 3
    c.beginPath()
    c.arc(SLING.x, SLING.y, MAX_PULL, 0, Math.PI * 2)
    c.setLineDash([6, 10])
    c.stroke()
    c.setLineDash([])
  }

  // the stones in the air
  for (const s of g.stones) sprite(c, 'stein', s.x, s.y + STONE_R, STONE_R * 2.2, false, s.age * 9)

  // the puffs
  for (const p of puffs) {
    const k = p.t / 0.6
    if (p.kind === 'star' && glow.complete) {
      c.globalAlpha = 1 - k
      const s = 90 + k * 90
      c.drawImage(glow, p.x - s / 2, p.y - s / 2, s, s)
      c.globalAlpha = 1
    } else {
      c.globalAlpha = 0.5 * (1 - k)
      c.fillStyle = '#d8c79a'
      c.beginPath()
      c.arc(p.x, p.y, 10 + k * 26, 0, Math.PI * 2)
      c.fill()
      c.globalAlpha = 1
    }
  }

  // the line the sheep are behind (only when an animal is near)
  const near = g.animals.some((a) => a.mode === 'come' && a.x < SHEEP_LINE + 260)
  if (near) {
    c.fillStyle = 'rgba(255,90,60,0.12)'
    c.fillRect(0, 0, SHEEP_LINE, H)
  }
  c.restore()
  void body
}

// ── the page ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const stonesRow = computed(() => Array.from({ length: hud.stones }, (_, i) => i))
const wonText = computed(() => (level.value === GOLIATH_LEVEL ? t('app.bigGames.david.wonGoliath') : t('app.bigGames.david.won')))
const resultText = computed(() => (outcome.phase === 'won' ? wonText.value : outcome.noStones ? t('app.bigGames.david.noStones') : t('app.bigGames.david.lost')))
const levelTitle = (i: number) => levelNames.value[i] ?? String(i + 1)
const pic = (n: string) => prependBaseUrl(`images/spiele-gross/david/${n}.webp`)
const arrowSrc = prependBaseUrl('images/spiele-gross/elia/wisch-pfeil.webp')

function leave() {
  leaveFullscreen()
  emit('leave')
}

let bodyOverflow = ''
onMounted(async () => {
  // the page behind the game does not scroll
  bodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  ctx = canvas.value?.getContext('2d') ?? null
  // with `?probe=1` the game can be looked at from the console (to check the pictures and the stride)
  if (window.location.href.includes('probe=1')) (window as unknown as { __david?: unknown }).__david = { start, advance(seconds: number) { for (let t = 0; t < seconds; t += 1 / 60) update(1 / 60); draw(performance.now() / 1000) }, get game() { return g }, get goliath() { return goliath }, get paused() { return paused.value }, set paused(v: boolean) { paused.value = v } }
  resize()
  window.addEventListener('resize', resize)
  // the fighting music of the game (it stops with the game)
  music.playDavid()
  await loadAll()
  last = performance.now()
  raf = requestAnimationFrame(frame)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  music.stop('game')
  window.removeEventListener('resize', resize)
  document.body.style.overflow = bodyOverflow
  leaveFullscreen()
})
</script>

<template lang="pug">
  div(class="dg")
    canvas(
      ref="canvas"
      class="dg-canvas"
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onUp"
    )

    //- while the pictures load
    div(v-if="!loaded" class="dg-center")
      div(class="dg-spinner")

    //- the levels
    div(v-else-if="screen === 'menu'" class="dg-menu")
      div(class="dg-card")
        GameIntroBox(
          :title="t('app.bigGames.david.title')"
          :label="t('app.bigGames.david.storyHead')"
          :story="t('app.bigGames.david.story')"
          :story-ref="t('app.bigGames.david.storyRef')"
          :task="t('app.bigGames.david.task')"
          test-id="david-story"
        )
        div(class="dg-levels")
          button(
            v-for="(n, i) in levelNames"
            :key="i"
            type="button"
            :class="['dg-level', { 'is-locked': !unlocked(i) }]"
            :disabled="!unlocked(i)"
            :title="unlocked(i) ? '' : t('app.bigGames.david.levelLocked')"
            @click="start(i)"
          )
            span(class="dg-level-no") {{ i + 1 }}
            span(class="dg-level-name") {{ levelTitle(i) }}
            AdventureStars(:stars="levelStars[i] ?? 0" :size="20")
        p(class="dg-rules") {{ t('app.bigGames.david.starRules') }}
        div(class="dg-menu-buttons")
          AdvButton(tone="blau" small data-test="david-how" @click="how = true") {{ t('app.bigGames.david.howTitle') }}
          AdvButton(tone="blau" small @click="leave") {{ t('app.bigGames.david.leave') }}

    //- the game
    template(v-else-if="screen === 'play'")
      div(class="dg-hud")
        button(type="button" class="dg-btn" :aria-label="t('app.bigGames.david.pause')" @click="paused = true") ❚❚
        div(class="dg-hud-group" :aria-label="t('app.bigGames.david.sheep')")
          img(v-for="n in hud.sheep" :key="n" :src="pic('schaf')" alt="" class="dg-ico")
        div(class="dg-hud-mid")
          span(class="dg-level-label") {{ levelTitle(level) }}
        div(class="dg-hud-group dg-hud-stones" :aria-label="t('app.bigGames.david.stones')")
          img(v-for="n in stonesRow" :key="n" :src="pic('stein')" alt="" class="dg-ico dg-ico--stone")
      div(v-if="tipShown" class="dg-tip") {{ level === GOLIATH_LEVEL ? t('app.bigGames.david.tipGoliath') : level === EAGLE_TIP_LEVEL ? t('app.bigGames.david.tipEagle') : level === ROCK_TIP_LEVEL ? t('app.bigGames.david.tipRocks') : t('app.bigGames.david.tip') }}

      //- before Goliath (once): who he is, and the task
      div(v-if="goliathCard && !how" class="dg-menu dg-menu--dim")
        div(class="dg-card dg-card--small dg-story-card" data-test="david-goliath-story")
          span(class="dg-story-head") {{ levelTitle(level) }}
          p(class="dg-story-text") {{ t('app.bigGames.david.goliathStory') }}
          span(class="dg-story-ref") {{ t('app.bigGames.david.goliathRef') }}
          p(class="dg-story-task") {{ t('app.bigGames.david.goliathTask') }}
          AdvButton(data-test="david-goliath-go" @click="closeGoliathStory") {{ t('app.bigGames.david.go') }}

      div(v-else-if="paused && !how" class="dg-menu dg-menu--dim")
        div(class="dg-card dg-card--small")
          h2(class="dg-title") {{ t('app.bigGames.david.pause') }}
          AdvButton(@click="paused = false") {{ t('app.bigGames.david.resume') }}
          AdvButton(tone="blau" @click="start(level)") {{ t('app.bigGames.david.again') }}
          AdvButton(tone="blau" @click="toMenu") {{ t('app.bigGames.david.menu') }}

    //- the end of a round
    div(v-else-if="screen === 'result'" class="dg-menu dg-menu--dim")
      div(class="dg-card dg-card--small")
        h2(class="dg-title") {{ levelTitle(level) }}
        AdventureStars(:stars="outcome.stars" :size="56" celebrate)
        p(class="dg-text") {{ resultText }}
        AdvButton(v-if="outcome.phase === 'won' && level < GOLIATH_LEVEL" @click="start(level + 1)") {{ t('app.bigGames.david.next') }}
        AdvButton(:tone="outcome.phase === 'won' && level < GOLIATH_LEVEL ? 'blau' : 'gold'" @click="start(level)") {{ t('app.bigGames.david.again') }}
        AdvButton(tone="blau" @click="toMenu") {{ t('app.bigGames.david.menu') }}

    //- the explanation: pull back, let go
    div(v-if="how && loaded" class="dg-menu dg-menu--dim")
      div(class="dg-card dg-how")
        h2(class="dg-title") {{ t('app.bigGames.david.howTitle') }}
        //- the golden arrow of the swipe cross of Elijah's game, turned to the left: pull back
        div(class="dg-how-row")
          img(:src="arrowSrc" alt="" class="dg-how-pic" @error="hideBroken")
          p(class="dg-how-line") {{ t('app.bigGames.david.howPull') }}
        div(class="dg-how-row")
          img(:src="pic('stein')" alt="" class="dg-how-img" @error="hideBroken")
          p(class="dg-how-line") {{ t('app.bigGames.david.howFar') }}
        div(class="dg-how-row")
          img(:src="pic('schaf')" alt="" class="dg-how-img" @error="hideBroken")
          p(class="dg-how-line") {{ t('app.bigGames.david.howAnimals') }}
        AdvButton(data-test="david-go" @click="closeHow") {{ t('app.bigGames.david.go') }}

    //- upright: the note to turn the phone
    div(v-if="portrait && screen === 'play' && !showRotateAnyway" class="dg-rotate")
      div(class="dg-rotate-icon" aria-hidden="true") ⟳
      p {{ t('app.bigGames.david.rotate') }}
      AdvButton(tone="blau" small @click="showRotateAnyway = true") {{ t('app.bigGames.david.rotateAnyway') }}
</template>

<style scoped lang="sass">
.dg
  position: fixed
  inset: 0
  z-index: 60
  background: #1a2a1c
  overflow: hidden
  user-select: none
  -webkit-user-select: none
  touch-action: none

.dg-canvas
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  touch-action: none
  cursor: crosshair

.dg-center
  position: absolute
  inset: 0
  display: grid
  place-items: center

.dg-spinner
  width: 46px
  height: 46px
  border-radius: 50%
  border: 5px solid rgba(255, 255, 255, 0.25)
  border-top-color: #f5c84a
  animation: dg-spin 0.9s linear infinite

@keyframes dg-spin
  to
    transform: rotate(360deg)

.dg-menu
  position: absolute
  inset: 0
  display: grid
  place-items: center
  padding: 16px
  overflow-y: auto
  background: linear-gradient(180deg, rgba(10, 20, 14, 0.2), rgba(10, 20, 14, 0.45))

  &--dim
    background: rgba(10, 16, 12, 0.6)

.dg-card
  width: min(620px, 100%)
  padding: 22px 22px 18px
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

.dg-title
  margin: 0
  font-size: 1.6rem
  font-weight: 800

.dg-text
  margin: 0
  line-height: 1.4

.dg-rules
  margin: 0
  font-size: 0.85rem
  color: var(--lk-muted, #7a6b4f)

// the story box of the first Goliath level (the box of the menu is `GameIntroBox`)
.dg-story-head
  font-size: 0.72rem
  font-weight: 800
  letter-spacing: 0.08em
  text-transform: uppercase
  color: #8a5a12

.dg-story-text
  margin: 0
  font-size: 1rem
  line-height: 1.35
  color: #3a2c12

.dg-story-ref
  font-size: 0.75rem
  font-weight: 700
  font-style: italic
  color: #8a5a12

.dg-story-task
  margin: 2px 0 0
  padding-top: 6px
  border-top: 1px dashed #d9a93a
  font-size: 1rem
  font-weight: 800
  line-height: 1.3
  color: #2a2418

.dg-story-card
  text-align: left

  .dg-story-text
    font-size: 1rem

.dg-levels
  display: grid
  grid-template-columns: repeat(5, minmax(0, 1fr))
  gap: 8px
  width: 100%

.dg-level
  display: flex
  flex-direction: column
  align-items: center
  gap: 4px
  padding: 10px 4px
  border: 2px solid var(--lk-line, #e3d7bb)
  border-radius: 16px
  background: var(--lk-surface-2, #f6efdc)
  color: inherit
  font: inherit
  cursor: pointer

  &.is-locked
    opacity: 0.45
    cursor: default

.dg-level-no
  display: grid
  place-items: center
  width: 30px
  height: 30px
  border-radius: 50%
  background: var(--lk-accent, #1f6a6a)
  color: var(--lk-on-accent, #fff)
  font-weight: 800

.dg-level-name
  font-size: 0.78rem
  font-weight: 800
  line-height: 1.15

@media (max-width: 560px)
  .dg-levels
    grid-template-columns: repeat(3, minmax(0, 1fr))

.dg-hud
  position: absolute
  top: 0
  left: 0
  right: 0
  display: flex
  align-items: center
  justify-content: space-between
  gap: 10px
  padding: max(8px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) 8px max(12px, env(safe-area-inset-left))
  pointer-events: none

.dg-hud > *
  pointer-events: auto

.dg-btn
  width: 44px
  height: 44px
  border: none
  border-radius: 50%
  background: rgba(255, 255, 255, 0.85)
  color: #2a2418
  font-weight: 800
  cursor: pointer

.dg-hud-group
  display: flex
  gap: 4px
  padding: 4px 10px
  border-radius: 999px
  background: rgba(255, 255, 255, 0.78)
  min-height: 44px
  align-items: center
  flex-wrap: wrap
  max-width: 34vw

.dg-ico
  height: 28px
  width: auto

.dg-ico--stone
  height: 18px

.dg-hud-mid
  display: flex
  flex-direction: column
  align-items: center
  padding: 4px 14px
  border-radius: 16px
  background: rgba(255, 255, 255, 0.78)
  font-weight: 800

.dg-level-label
  font-size: 0.95rem

.dg-menu-buttons
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 10px

.dg-how
  gap: 20px

.dg-how-row
  display: flex
  align-items: center
  gap: 16px
  width: 100%

.dg-how-pic
  display: block
  flex: none
  width: 56px
  height: auto
  transform: rotate(-90deg)

.dg-how-img
  flex: none
  width: 56px
  height: 56px
  object-fit: contain

.dg-how-line
  margin: 0
  text-align: left
  font-size: 1.2rem
  font-weight: 700
  line-height: 1.3

.dg-tip
  position: absolute
  left: 50%
  bottom: 22px
  transform: translateX(-50%)
  max-width: min(560px, 92vw)
  padding: 10px 18px
  border-radius: 999px
  background: rgba(255, 250, 235, 0.92)
  color: #2a2418
  font-weight: 700
  text-align: center
  pointer-events: none

.dg-rotate
  position: absolute
  inset: 0
  z-index: 5
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  gap: 14px
  padding: 24px
  background: rgba(14, 22, 18, 0.92)
  color: #fff6dc
  text-align: center
  font-size: 1.1rem
  font-weight: 700

.dg-rotate-icon
  font-size: 4rem
  animation: dg-turn 2s ease-in-out infinite

@keyframes dg-turn
  0%, 20%
    transform: rotate(0)
  60%, 100%
    transform: rotate(90deg)

// short screens: the explanation card closer together
@media (max-height: 520px)
  .dg-how
    gap: 8px
  .dg-how-row
    gap: 12px
  .dg-how-pic
    width: 40px
    font-size: 1.5rem
    height: 40px
  .dg-how-img
    width: 40px
    font-size: 1.5rem
    height: 40px
  .dg-how-line
    font-size: 1.05rem
</style>
