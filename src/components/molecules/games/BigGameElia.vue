<script setup lang="ts">
/**
 * "Elia läuft": the second big game, a three-lane runner (rules in `utils/eliaRun.ts`, this file draws it and takes the finger).
 * Elijah runs away from the camera over a path through the land of his story. A swipe to the side changes the lane, a swipe up jumps, a
 * swipe down slides. The track is drawn in perspective: the ground is a picture that is laid over the track line by line, the things on
 * it are painted pictures that grow as they come near. Pictures that are missing are simply not drawn (flat shapes stand in), so
 * the game can be tried while they are painted.
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
import {
  FREE_AFTER,
  FREE_LEVEL,
  HUNGRY,
  LANE_W,
  LEVELS,
  STUMBLE_WINDOW,
  WATER_LEN,
  WORLDS,
  input,
  laneX,
  newRun,
  scoreOf,
  starsFor,
  step,
  type Run
} from '@/utils/eliaRun'

const emit = defineEmits<{ leave: [] }>()
const { t, tm, rt } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const music = useMusic()
const progress = useBigGames()
const ID = 'elia'
const BEST_KEY = 'lk-elia-best-v1'

// ── the picture of the scene ───────────────────────────────────────────────
/** The scene is 1080 x 1920 (9:16); the canvas has two thirds of that. */
const VW = 1080
const VH = 1920
const CS = 2 / 3
const YH = 576 // the horizon
const F = 1700 // the focal length in scene pixels
const CAMH = 3.6 // the camera is this high (metres)
const DCAM = 8.5 // the runner is this far in front of the camera
const FAR = 150
const NEAR = 2.8
const TILE = 12 // metres of ground that one ground picture covers (both ways)

const NAMES = [
  'elia-lauf', 'elia-lauf-b', 'elia-sprung', 'elia-ducken', 'elia-links', 'elia-rechts', 'elia-stolpern', 'elia-sturz', 'elia-jubel',
  'horizont', 'boden', 'bach',
  'kulisse-1', 'kulisse-2', 'kulisse-3', 'kulisse-4', 'kulisse-5', 'kulisse-6',
  'hindernis-1', 'hindernis-2', 'hindernis-3', 'hindernis-4', 'hindernis-5', 'hindernis-6', 'hindernis-7',
  'hindernis-9', 'hindernis-10', 'hindernis-11', 'hindernis-12', 'hindernis-13', 'hindernis-14',
  'brot', 'krug', 'feder', 'mehl', 'oel', 'raben-1', 'raben-2', 'raben-3', 'ziel-krit',
  // the brook across the whole track, with water in it in every world (the mountain worlds have a rocky one)
  'bach-quer', 'bach-quer-berg'
]
/** What every world after the first brings of its own: sky, ground, the things at the side, the obstacles and the goal (folder `welt2` to `welt5`). */
const WORLD_NAMES = [
  'horizont', 'boden', 'kulisse-1', 'kulisse-2', 'kulisse-3', 'kulisse-4', 'kulisse-5', 'kulisse-6',
  'hindernis-1', 'hindernis-2', 'hindernis-3', 'hindernis-4', 'hindernis-5', 'hindernis-6', 'hindernis-7',
  'hindernis-9', 'hindernis-10', 'hindernis-11', 'hindernis-12', 'hindernis-13', 'hindernis-14', 'ziel'
]
const imgs = new Map<string, HTMLImageElement>()
/** The pictures of the worlds 1 to 4 (the second to the fifth), loaded when a level of that world begins. */
const worldImgs = new Map<number, Map<string, HTMLImageElement>>()
/** The world that is played now (0 to 4). */
const curWorld = ref(0)
/** The picture of a name in the world that is played: its own one, else the one of the first world. */
function getImg(name: string): HTMLImageElement | undefined {
  if (curWorld.value > 0) {
    const own = worldImgs.get(curWorld.value)?.get(name)
    if (own) return own
  }
  return imgs.get(name)
}
function loadWorld(w: number): Promise<void> {
  if (w <= 0 || worldImgs.has(w)) return Promise.resolve()
  const map = new Map<string, HTMLImageElement>()
  worldImgs.set(w, map)
  return new Promise((resolve) => {
    let left = WORLD_NAMES.length
    const done = () => {
      if (--left === 0) resolve()
    }
    for (const n of WORLD_NAMES) {
      const im = new Image()
      im.onload = () => {
        map.set(n, im)
        done()
      }
      im.onerror = done
      im.src = prependBaseUrl(`images/spiele-gross/elia/welt${w + 1}/${n}.webp`)
    }
  })
}
const pic = (n: string) => prependBaseUrl(`images/spiele-gross/elia/${n}.webp`)
const loaded = ref(false)

function loadAll(): Promise<void> {
  return new Promise((resolve) => {
    let left = NAMES.length
    const done = () => {
      if (--left === 0) resolve()
    }
    for (const n of NAMES) {
      const im = new Image()
      im.onload = () => {
        imgs.set(n, im)
        done()
      }
      im.onerror = done
      im.src = pic(n)
    }
  })
}

/** How big the things are in the world: height or width in metres (the other side follows the picture). */
// 0-2 low (fallen trunk, thorn bush, brushwood), 3 the trunk on two stumps (slide under it), 4-6 trees (cypress, olive, dead tree)
// 8-10 more low ones, 11 a second narrow beam, 12 and 13 more tall ones (the beams 3 and 11 are drawn one lane wide, see `obstacleDraw`)
const OBST: { h?: number; w?: number }[] = [{ w: 2.0 }, { w: 1.6 }, { w: 1.7 }, { h: 2.2 }, { h: 4.4 }, { h: 3.9 }, { h: 4.2 }, { w: 1 }, { w: 1.8 }, { w: 1.7 }, { w: 1.8 }, { h: 2.2 }, { h: 4.2 }, { h: 3.9 }]
/** The picture of an obstacle: the new ones fall back on an older one of the same kind while a world does not have them. */
function obstacleName(sprite: number): string {
  const own = `hindernis-${sprite + 1}`
  if (getImg(own)) return own
  const base = sprite >= 12 ? sprite - 8 : sprite === 11 ? 3 : sprite >= 8 ? sprite - 8 : sprite
  return `hindernis-${base + 1}`
}
/** How big an obstacle is drawn. A beam stands in ONE lane (it is never wider than the lane, so that it cannot look as if it stood on the next one). */
function obstacleDraw(sprite: number): { h?: number; w?: number } {
  const size = OBST[sprite] ?? { w: 1.5 }
  if (sprite !== 3 && sprite !== 11) return size
  const im = getImg(obstacleName(sprite))
  const asp = im ? im.width / im.height : 0.65
  return { h: Math.min(2.2, 1.4 / asp) }
}
const KUL: { h?: number; w?: number }[] = [{ h: 8 }, { h: 5 }, { w: 3.6 }, { h: 1.9 }, { w: 4.6 }, { h: 1.3 }]
/** The brook: one picture is laid along the left side of the track like the ground (its middle lies this far to the left). */
const BACH_X = -5.4
const BACH_SIZE = 6
const POSE_H: Record<string, number> = { 'elia-lauf': 1.95, 'elia-lauf-b': 1.95, 'elia-sprung': 1.95, 'elia-ducken': 0.95, 'elia-links': 1.95, 'elia-rechts': 1.95, 'elia-stolpern': 1.95, 'elia-sturz': 1.65 }

// ── the screens ───────────────────────────────────────────────────────────
type Screen = 'menu' | 'play' | 'result'
const screen = ref<Screen>('menu')
const level = ref(0)
const paused = ref(false)
const worldNames = computed(() => ((tm('app.bigGames.elia.worlds') as unknown as Parameters<typeof rt>[0][]) ?? []).map((m) => rt(m)))
const worldRefs = computed(() => ((tm('app.bigGames.elia.refs') as unknown as Parameters<typeof rt>[0][]) ?? []).map((m) => rt(m)))
const worldStories = computed(() => ((tm('app.bigGames.elia.worldStories') as unknown as Parameters<typeof rt>[0][]) ?? []).map((m) => rt(m)))
/** The world whose short story is shown on a card (the first time its first level begins). */
const storyWorld = ref(-1)
const levelStars = computed(() => progress.levels(ID))
// every level can be played at once: whoever does not manage one may go on to the next (Anton, 12.11.2026)
const unlocked = (i: number) => !!LEVELS[i]?.ready
const freeOpen = computed(() => (levelStars.value[FREE_AFTER - 1] ?? 0) >= 1)
const isFree = computed(() => level.value === FREE_LEVEL)
const worldOf = (i: number) => LEVELS[i]?.world ?? 0
const levelTitle = (i: number) => (i === FREE_LEVEL ? t('app.bigGames.elia.free') : `${worldNames.value[worldOf(i)] ?? ''} ${(i % 3) + 1}`)
const worldLevels = (w: number) => [w * 3, w * 3 + 1, w * 3 + 2]

function bestFree(): number {
  try {
    return Number(localStorage.getItem(BEST_KEY) ?? 0) || 0
  } catch {
    return 0
  }
}
const best = ref(bestFree())

// ── the game ──────────────────────────────────────────────────────────────
let run: Run = newRun(0)
const hud = reactive({ bread: 0, meters: 0, pct: 0, risk: 0, hunger: 1 })
const outcome = reactive({ won: false, stars: 0, bread: 0, meters: 0, score: 0, newBest: false })
const tipShown = ref(false)
/** The card that explains the game (shown in the first rounds and from the question mark). */
const how = ref(false)
/** A short message in the middle of the screen. */
const banner = ref('')
let bannerTimer = 0
function say(text: string, ms = 3200) {
  banner.value = text
  window.clearTimeout(bannerTimer)
  bannerTimer = window.setTimeout(() => (banner.value = ''), ms)
}
let hungryAt = 0
/** The first raven feather and the first stumble of a visit get one short word (the explanation card does not list them). */
let featherSaid = false
let stumbleSaid = false

let raf = 0
let last = 0
let endTimer = 0
let hudAt = 0
let combo = 0
let comboAt = 0
let shake = 0
let stumbleShow = 0
const particles: { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; color: string }[] = []

/** True while the pictures of a world are loaded (a second tap on a level does nothing). */
let starting = false

async function start(i: number) {
  if (starting) return
  starting = true
  // the world of the level (the free run runs in the first one); its own pictures come first
  curWorld.value = i === FREE_LEVEL ? 0 : worldOf(i)
  try {
    await loadWorld(curWorld.value)
  } finally {
    starting = false
  }
  level.value = i
  run = newRun(i)
  // with `?probe=1` the run can be looked at from the console (to try the pictures of the worlds)
  if (window.location.hash.includes('probe=1')) (window as unknown as { __elia?: unknown }).__elia = { get run() { return run } }
  paused.value = false
  endTimer = 0
  combo = 0
  shake = 0
  stumbleShow = 0
  particles.length = 0
  tipShown.value = false
  banner.value = ''
  hungryAt = 0
  how.value = !howSeen(ID)
  paused.value = how.value
  screen.value = 'play'
  syncHud(true)
  maybeWorldStory()
}

/** The first level of a world: once, a short card says what happens in this part of the story (not at every level). */
function maybeWorldStory() {
  storyWorld.value = -1
  if (how.value || level.value === FREE_LEVEL || level.value % 3 !== 0) return
  const w = worldOf(level.value)
  if (howSeen(`${ID}-w${w}`) || !worldStories.value[w]) return
  storyWorld.value = w
  paused.value = true
}

function closeWorldStory() {
  if (storyWorld.value >= 0) markHowSeen(`${ID}-w${storyWorld.value}`)
  storyWorld.value = -1
  if (screen.value === 'play') paused.value = false
}

function toMenu() {
  screen.value = 'menu'
  storyWorld.value = -1
}

function closeHow() {
  how.value = false
  markHowSeen(ID)
  if (screen.value === 'play') paused.value = false
  maybeWorldStory()
}

function leave() {
  emit('leave')
}

function finish() {
  const won = run.phase === 'won'
  outcome.won = won
  outcome.bread = run.bread
  outcome.meters = Math.floor(run.dist)
  outcome.score = scoreOf(run)
  outcome.stars = starsFor(run)
  outcome.newBest = false
  if (isFree.value) {
    if (outcome.score > best.value) {
      best.value = outcome.score
      outcome.newBest = outcome.score > 0
      try {
        localStorage.setItem(BEST_KEY, String(outcome.score))
      } catch {
        // not remembered
      }
    }
    progress.record(ID, FREE_LEVEL, 0)
  } else {
    progress.record(ID, level.value, outcome.stars)
  }
  screen.value = 'result'
  play(won ? 'result' : 'tap')
}

// ── the touch: swipes ─────────────────────────────────────────────────────
const SWIPE = 28
let sx = 0
let sy = 0
let tracking = false

function onDown(e: PointerEvent) {
  if (screen.value !== 'play' || paused.value) return
  tracking = true
  sx = e.clientX
  sy = e.clientY
  tipShown.value = false
  ;(e.currentTarget as HTMLElement | null)?.setPointerCapture?.(e.pointerId)
}

function onMove(e: PointerEvent) {
  if (!tracking || screen.value !== 'play' || paused.value) return
  const dx = e.clientX - sx
  const dy = e.clientY - sy
  if (Math.abs(dx) < SWIPE && Math.abs(dy) < SWIPE) return
  if (Math.abs(dx) > Math.abs(dy)) command(dx < 0 ? 'left' : 'right')
  else command(dy < 0 ? 'jump' : 'slide')
  // the next swipe may start from here, without lifting the finger
  sx = e.clientX
  sy = e.clientY
}

function onUp() {
  tracking = false
}

function command(what: 'left' | 'right' | 'jump' | 'slide') {
  input(run, what)
}

function onKey(e: KeyboardEvent) {
  if (screen.value !== 'play') return
  const k = e.key
  if (k === 'ArrowLeft' || k === 'a') command('left')
  else if (k === 'ArrowRight' || k === 'd') command('right')
  else if (k === 'ArrowUp' || k === 'w' || k === ' ') command('jump')
  else if (k === 'ArrowDown' || k === 's') command('slide')
  else if (k === 'Escape' || k === 'p') paused.value = !paused.value
  else return
  e.preventDefault()
}

// ── the loop ──────────────────────────────────────────────────────────────
const canvas = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null

function frame(now: number) {
  raf = requestAnimationFrame(frame)
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000))
  last = now
  if (!ctx) return
  if (screen.value === 'play' && !paused.value) {
    // a fixed small step keeps the fast game exact
    let left = dt
    while (left > 0) {
      const d = Math.min(0.016, left)
      step(run, d)
      handleEvents()
      left -= d
    }
    if (run.phase !== 'play') {
      endTimer += dt
      if (endTimer > (run.phase === 'won' ? 0.9 : 1.3)) finish()
    }
    updateParticles(dt)
    syncHud(false, now)
  }
  draw(now / 1000)
}

function handleEvents() {
  for (const ev of run.events) {
    if (ev === 'jump') play('flip', 0.6)
    else if (ev === 'slide') play('tap', 0.5, 0.8)
    else if (ev === 'lane') play('tap', 0.35)
    else if (ev === 'brot') {
      const nowMs = performance.now()
      combo = nowMs - comboAt < 700 ? combo + 1 : 1
      comboAt = nowMs
      play('coin', 0.5, 1 + Math.min(0.6, combo * 0.05))
      burst('#ffd76a', 5)
    } else if (ev === 'krug') {
      play('basket', 0.7)
      burst('#ffe9a8', 12)
    } else if (ev === 'rabe') {
      play('flip', 0.3, 1.5)
    } else if (ev === 'abwurf') {
      play('tap', 0.22, 1.7)
    } else if (ev === 'feder') {
      play('star', 0.7)
      burst('#9cc9ff', 14)
      if (!featherSaid) {
        featherSaid = true
        say(t('app.bigGames.elia.ravenBanner'), 2600)
      }
    } else if (ev === 'stumble') {
      if (!stumbleSaid) {
        stumbleSaid = true
        say(t('app.bigGames.elia.stumbleBanner'), 2600)
      }
      play('clunk', 0.8)
      shake = 1
      stumbleShow = 0.55
      burst('#d9b98a', 12)
    } else if (ev === 'fall') {
      play('hit', 0.8)
      shake = 1.4
      burst('#d9b98a', 22)
    } else if (ev === 'land') {
      burst('#d9b98a', 3)
    } else if (ev === 'tired') {
      play('wrong', 0.6)
      burst('#d9b98a', 8)
    } else if (ev === 'win') {
      play('fanfare', 0.7)
    }
  }
}

function syncHud(force: boolean, now = 0) {
  if (!force && now - hudAt < 90) return
  hudAt = now
  hud.bread = run.bread
  hud.meters = Math.floor(run.dist)
  hud.pct = run.goal > 0 ? Math.min(100, (run.dist / run.goal) * 100) : 0
  hud.risk = run.sinceStumble < STUMBLE_WINDOW ? 1 - run.sinceStumble / STUMBLE_WINDOW : 0
  hud.hunger = run.hunger
  // the first time he gets hungry, a word about it
  if (run.hunger < HUNGRY && run.phase === 'play' && now - hungryAt > 9000) {
    hungryAt = now
    say(t('app.bigGames.elia.hungryBanner'), 2600)
  }
}

// ── the picture ───────────────────────────────────────────────────────────
const sXOf = (X: number, d: number, camX: number) => VW / 2 + (F * (X - camX)) / d
const sYOf = (d: number) => YH + (F * CAMH) / d
const sc = (d: number) => F / d

function burst(color: string, n: number) {
  // at the feet of the runner
  const d = DCAM
  const px = sXOf(run.x, d, camXOf())
  const py = sYOf(d) - run.y * sc(d)
  for (let i = 0; i < n; i++) {
    particles.push({ x: px + (Math.random() - 0.5) * 90, y: py - Math.random() * 60, vx: (Math.random() - 0.5) * 380, vy: -120 - Math.random() * 320, life: 0.6, max: 0.6, size: 6 + Math.random() * 12, color })
  }
}

function updateParticles(dt: number) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]!
    p.life -= dt
    if (p.life <= 0) {
      particles.splice(i, 1)
      continue
    }
    p.vy += 900 * dt
    p.x += p.vx * dt
    p.y += p.vy * dt
  }
}

const camXOf = () => run.x * 0.55

/** A hash of a whole number between 0 and 1 (so the roadside things stand in the same place every time). */
function hash(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

interface Item {
  d: number
  draw: () => void
}

function drawSprite(name: string, X: number, y: number, d: number, camX: number, size: { h?: number; w?: number }, opts: { alpha?: number; flip?: boolean; fallback?: string; squash?: number } = {}) {
  if (!ctx) return
  const im = getImg(name)
  const k = sc(d)
  const x = sXOf(X, d, camX)
  const footY = sYOf(d) - y * k
  let w: number
  let h: number
  if (im) {
    const asp = im.width / im.height
    if (size.h !== undefined) {
      h = size.h * k
      w = size.w !== undefined ? size.w * k : h * asp
    } else {
      w = (size.w ?? 1) * k
      h = w / asp
    }
  } else {
    h = (size.h ?? 1) * k
    w = (size.w ?? (size.h ?? 1) * 0.8) * k
  }
  h *= opts.squash ?? 1
  const fade = Math.max(0, Math.min(1, (FAR - d) / 50))
  ctx.globalAlpha = (opts.alpha ?? 1) * fade
  if (im) {
    if (opts.flip) {
      ctx.save()
      ctx.translate(x, footY)
      ctx.scale(-1, 1)
      ctx.drawImage(im, -w / 2, -h, w, h)
      ctx.restore()
    } else ctx.drawImage(im, x - w / 2, footY - h, w, h)
  } else if (opts.fallback) {
    ctx.fillStyle = opts.fallback
    ctx.fillRect(x - w / 2, footY - h, w, h)
  }
  ctx.globalAlpha = 1
}

function drawSky(time: number) {
  if (!ctx) return
  const im = getImg('horizont')
  const h = YH + 70
  if (!im) {
    const g = ctx.createLinearGradient(0, 0, 0, YH)
    g.addColorStop(0, '#c9b7e8')
    g.addColorStop(1, '#f8d9a0')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, VW, YH + 70)
    return
  }
  const w = h * (im.width / im.height)
  // every second copy is mirrored, so the edges of the pictures always meet
  const shift = camXOf() * 14 + run.dist * 0.5 + time * 3
  const period = w * 2
  const off = ((shift % period) + period) % period
  for (let i = Math.floor(-off / w); -off + i * w < VW; i++) {
    const x = -off + i * w
    if (((i % 2) + 2) % 2 === 0) ctx.drawImage(im, x, 0, w, h)
    else {
      ctx.save()
      ctx.translate(x + w, 0)
      ctx.scale(-1, 1)
      ctx.drawImage(im, 0, 0, w, h)
      ctx.restore()
    }
  }
}

function drawGround() {
  if (!ctx) return
  const im = getImg('boden')
  if (!im) {
    ctx.fillStyle = '#c9a15a'
    ctx.fillRect(0, YH, VW, VH - YH)
    // the track, so that the game can be tried without the picture
    for (let sy2 = YH + 2; sy2 < VH; sy2 += 4) {
      const d = (F * CAMH) / (sy2 - YH)
      ctx.fillStyle = Math.floor((run.dist + d) / 3) % 2 ? '#b97f3d' : '#c78c46'
      ctx.fillRect(sXOf(-3, d, camXOf()), sy2, (6 * F) / d, 4)
    }
    return
  }
  const tw = im.width
  const th = im.height
  const camX = camXOf()
  // the brook along the left side belongs to the first world (Cherith) only
  const bach = curWorld.value === 0 ? imgs.get('bach') : undefined
  const stepPx = 2
  for (let y = YH + 1; y < VH; y += stepPx) {
    const d = (F * CAMH) / (y - YH)
    const d2 = (F * CAMH) / (y + stepPx - YH)
    const wz = run.dist + d - DCAM
    const v = (((wz / TILE) % 1) + 1) % 1
    const v2 = (((run.dist + d2 - DCAM) / TILE) % 1 + 1) % 1
    let srcH = Math.abs(v - v2) * th
    if (srcH > th / 2 || srcH < 1) srcH = 1
    const sy0 = Math.min(th - srcH, v * th)
    const half = (VW / 2 / F) * d
    const first = Math.floor((camX - half + TILE / 2) / TILE)
    const lastI = Math.floor((camX + half + TILE / 2) / TILE)
    const wpx = (TILE * F) / d
    for (let i = first; i <= lastI; i++) {
      const X0 = i * TILE - TILE / 2
      ctx.drawImage(im, 0, sy0, tw, srcH, VW / 2 + (F * (X0 - camX)) / d, y, wpx + 1, stepPx)
    }
    // the brook, a strip of its own along the left side
    if (bach) {
      const vb = (((wz / BACH_SIZE) % 1) + 1) % 1
      const vb2 = (((run.dist + d2 - DCAM) / BACH_SIZE) % 1 + 1) % 1
      let sh = Math.abs(vb - vb2) * bach.height
      if (sh > bach.height / 2 || sh < 1) sh = 1
      ctx.drawImage(bach, 0, Math.min(bach.height - sh, vb * bach.height), bach.width, sh, sXOf(BACH_X - BACH_SIZE / 2, d, camX), y, (BACH_SIZE * F) / d + 1, stepPx)
    }
  }
}

const WATER_FALLBACK = ['#4d9bc4']
/** The brook of the world: Carmel and the mountain of God have a rocky mountain stream (while its picture is missing, the first brook stands in). */
const waterName = () => (curWorld.value >= 3 && imgs.has('bach-quer-berg') ? 'bach-quer-berg' : 'bach-quer')

/**
 * The brooks across the track (with water in every world): a ground strip, drawn line by
 * line like the ground. One picture is laid across the whole width. Without the picture a flat strip stands in, so that it can be seen and jumped.
 */
function drawWater() {
  if (!ctx) return
  const im = imgs.get(waterName())
  const camX = camXOf()
  const stepPx = 2
  // the picture is as long along the track as WATER_LEN; how wide it is across follows from the picture (it can be laid side by side)
  const WATER_TILE_W = im ? WATER_LEN * (im.width / im.height) : 9.6
  for (const o of run.obstacles) {
    if (o.kind !== 'water' || o.lane !== 1) continue
    const z0 = o.z - WATER_LEN / 2
    const z1 = o.z + WATER_LEN / 2
    const dNear = Math.max(NEAR + 0.2, z0 - run.dist + DCAM)
    const dFar = Math.min(FAR, z1 - run.dist + DCAM)
    if (dFar <= dNear) continue
    const yFar = sYOf(dFar)
    const yNear = Math.min(VH, sYOf(dNear))
    ctx.save()
    ctx.globalAlpha = Math.max(0, Math.min(1, (FAR - dFar) / 50))
    for (let y = Math.floor(yFar); y < yNear; y += stepPx) {
      const d = (F * CAMH) / (y - YH)
      const d2 = (F * CAMH) / (y + stepPx - YH)
      const z = run.dist + d - DCAM
      const v = Math.max(0, Math.min(1, (z1 - z) / WATER_LEN))
      if (!im) {
        ctx.fillStyle = WATER_FALLBACK[0]!
        ctx.fillRect(0, y, VW, stepPx)
        continue
      }
      const vNext = Math.max(0, Math.min(1, (z1 - (run.dist + d2 - DCAM)) / WATER_LEN))
      const srcH = Math.max(1, Math.abs(vNext - v) * im.height)
      const sy0 = Math.max(0, Math.min(im.height - srcH, v * im.height))
      const half = (VW / 2 / F) * d
      const first = Math.floor((camX - half + WATER_TILE_W / 2) / WATER_TILE_W)
      const last = Math.floor((camX + half + WATER_TILE_W / 2) / WATER_TILE_W)
      const wpx = (WATER_TILE_W * F) / d
      for (let i = first; i <= last; i++) {
        const X0 = i * WATER_TILE_W - WATER_TILE_W / 2
        ctx.drawImage(im, 0, sy0, im.width, srcH, VW / 2 + (F * (X0 - camX)) / d, y, wpx + 1, stepPx)
      }
    }
    ctx.restore()
  }
}

function drawHaze() {
  if (!ctx) return
  const g = ctx.createLinearGradient(0, YH - 30, 0, YH + 300)
  g.addColorStop(0, 'rgba(250, 222, 176, 0)')
  g.addColorStop(0.12, 'rgba(250, 222, 176, 0.85)')
  g.addColorStop(1, 'rgba(250, 222, 176, 0)')
  ctx.fillStyle = g
  ctx.fillRect(0, YH - 30, VW, 330)
}

function poseOf(): { name: string; flip: boolean; squash: number } {
  const r = run
  if (r.phase === 'over') return { name: 'elia-sturz', flip: false, squash: 1 }
  if (stumbleShow > 0) return { name: 'elia-stolpern', flip: false, squash: 1 }
  if (r.slide > 0) return { name: 'elia-ducken', flip: false, squash: 1 }
  if (r.y > 0.05) return { name: 'elia-sprung', flip: false, squash: 1 }
  const dx = laneX(r.lane) - r.x
  if (Math.abs(dx) > 0.25) return { name: dx < 0 ? 'elia-links' : 'elia-rechts', flip: false, squash: 1 }
  const phase = Math.floor(r.dist / 1.9) % 2
  return { name: phase ? 'elia-lauf-b' : 'elia-lauf', flip: false, squash: 1 }
}

function draw(time: number) {
  const c = ctx
  if (!c) return
  c.setTransform(CS, 0, 0, CS, 0, 0)
  c.clearRect(0, 0, VW, VH)
  const r = run
  const camX = camXOf()
  if (shake > 0) {
    shake = Math.max(0, shake - 0.04)
    c.translate((Math.random() - 0.5) * 26 * shake, (Math.random() - 0.5) * 26 * shake)
  }
  if (stumbleShow > 0) stumbleShow -= 0.016

  drawSky(time)
  drawGround()
  drawWater()
  drawHaze()

  // everything that stands on the track, far to near
  const items: Item[] = []
  const zFrom = r.dist - (DCAM - NEAR)
  const zTo = r.dist + (FAR - DCAM)

  // the sides of the track: a thing every six metres on each side
  const k0 = Math.floor(zFrom / 6)
  const k1 = Math.floor(zTo / 6)
  for (let k = k0; k <= k1; k++) {
    for (const side of [-1, 1]) {
      const h1 = hash(k * 2 + (side > 0 ? 1 : 0))
      const h2 = hash(k * 7.3 + side * 3.1)
      const h3 = hash(k * 3.7 + side * 11.9)
      // 0 tree, 1 olive, 2 boulders, 3 oleander, 5 grass (the brook is a ground picture, not a thing)
      let kind: number
      if (h1 < 0.38) kind = 0
      else if (h1 < 0.56) kind = 1
      else if (h1 < 0.74) kind = 2
      else if (h1 < 0.88) kind = 3
      else kind = 5
      const z = k * 6 + h2 * 4
      // the left side has the brook between 3.9 and 6.9 metres from the middle: things stand beyond it
      const X = side < 0 ? -(7.4 + h3 * 7) : kind === 0 ? 6 + h3 * 8 : 3.9 + h3 * 7
      const d = z - r.dist + DCAM
      if (d < NEAR || d > FAR) continue
      items.push({ d, draw: () => drawSprite(`kulisse-${kind + 1}`, X, 0, d, camX, KUL[kind]!, { fallback: kind === 0 || kind === 1 ? '#5d7a2e' : '#a8998a', flip: h3 > 0.5 }) })
    }
  }

  // the ravens that bring the bread: they come in from behind, fly over Elijah and drop bread into a lane
  for (const rv of r.ravens) {
    const d = rv.lead + DCAM
    if (d < NEAR) continue
    // it carries a piece in its beak until the first one falls
    const carrying = rv.dropped === 0
    const flap = Math.floor(time * 9 + rv.lane) % 4
    const frame = carrying ? 3 : flap === 0 ? 1 : flap === 2 ? 2 : 1
    items.push({
      d,
      draw: () => {
        if (ctx) {
          // its shadow runs over the ground below it and shows where the bread will lie
          const k = sc(d)
          ctx.fillStyle = 'rgba(60, 40, 10, 0.22)'
          ctx.beginPath()
          ctx.ellipse(sXOf(rv.x, d, camX), sYOf(d), 0.9 * k, 0.22 * k, 0, 0, Math.PI * 2)
          ctx.fill()
        }
        drawSprite(`raben-${frame}`, rv.x, rv.y, d, camX, { w: 2.6 }, { fallback: '#222' })
      }
    })
  }

  // the goal behind the end of the way: the brook Krit (1 Kings 17,3-5) in the first world, in the others the gate of Zarephath, the widow's house,
  // the altar on Carmel and the gate of Jezreel (the picture `ziel` of the world)
  if (r.goal > 0 && !isFree.value) {
    const d = r.goal + 16 - r.dist + DCAM
    const goalName = curWorld.value === 0 ? 'ziel-krit' : 'ziel'
    // it comes softly out of the haze, so that it does not pop up
    if (d > NEAR && d < FAR) items.push({ d, draw: () => drawSprite(goalName, 0, 0, d, camX, { w: 16 }, { alpha: Math.max(0, Math.min(1, (FAR - d) / 45)) }) })
  }

  // obstacles and pickups
  for (const o of r.obstacles) {
    // a brook is a strip of the ground, drawn with the ground
    if (o.kind === 'water' || o.z < zFrom || o.z > zTo) continue
    const d = o.z - r.dist + DCAM
    items.push({
      d,
      draw: () => {
        // a soft shadow on the ground in its own lane, so that it is clear where it stands
        if (ctx) {
          const k = sc(d)
          ctx.fillStyle = 'rgba(50, 30, 10, 0.3)'
          ctx.beginPath()
          ctx.ellipse(sXOf(laneX(o.lane), d, camX), sYOf(d), (o.kind === 'high' ? 0.62 : 0.8) * k, 0.15 * k, 0, 0, Math.PI * 2)
          ctx.fill()
        }
        drawSprite(obstacleName(o.sprite), laneX(o.lane), 0, d, camX, obstacleDraw(o.sprite), { fallback: o.kind === 'block' ? '#8a6a45' : o.kind === 'high' ? '#a06a2a' : '#7d7466' })
      }
    })
  }
  for (const p of r.pickups) {
    if (p.got || p.z < zFrom || p.z > zTo) continue
    const d = p.z - r.dist + DCAM
    const bob = Math.sin(time * 5 + p.z) * 0.08
    // in Zarephath the jugs are the jar of flour and the jug of oil that never ran empty (1 Kings 17,14-16)
    const zarpat = curWorld.value === 2 && p.type === 'krug'
    const name = p.type === 'brot' ? 'brot' : p.type === 'krug' ? (zarpat ? (hash(p.z * 1.7) < 0.5 ? 'mehl' : 'oel') : 'krug') : 'feder'
    const w = p.type === 'brot' ? 0.75 : p.type === 'krug' ? (name === 'oel' ? 0.55 : 0.8) : 1.15
    items.push({
      d,
      draw: () => {
        // the feather shines softly, so that it is seen from far away
        if (p.type === 'feder' && ctx) {
          const k = sc(d)
          const gx = sXOf(laneX(p.lane), d, camX)
          const gy = sYOf(d) - (p.y + bob) * k
          const rr = (0.95 + Math.sin(time * 4 + p.z) * 0.12) * k
          const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, rr)
          glow.addColorStop(0, 'rgba(255, 244, 190, 0.85)')
          glow.addColorStop(0.45, 'rgba(255, 220, 120, 0.35)')
          glow.addColorStop(1, 'rgba(255, 210, 100, 0)')
          ctx.fillStyle = glow
          ctx.beginPath()
          ctx.arc(gx, gy, rr, 0, Math.PI * 2)
          ctx.fill()
        }
        // a soft shadow on the ground under it
        if (p.y > 1 && ctx) {
          const k = sc(d)
          ctx.fillStyle = 'rgba(60, 40, 10, 0.25)'
          ctx.beginPath()
          ctx.ellipse(sXOf(laneX(p.lane), d, camX), sYOf(d), 0.35 * k, 0.09 * k, 0, 0, Math.PI * 2)
          ctx.fill()
        }
        drawSprite(name, laneX(p.lane), p.y - w / 2 + bob, d, camX, { w }, { fallback: p.type === 'feder' ? '#234' : '#e2a63a' })
      }
    })
  }

  // Elijah
  items.push({
    d: DCAM,
    draw: () => {
      if (!ctx) return
      const pose = poseOf()
      const k = sc(DCAM)
      const x = sXOf(r.x, DCAM, camX)
      const ground = sYOf(DCAM)
      // the shadow on the ground, smaller in the air
      ctx.fillStyle = `rgba(50, 30, 10, ${0.32 - Math.min(0.18, r.y * 0.1)})`
      ctx.beginPath()
      ctx.ellipse(x, ground, 0.62 * k * (1 - Math.min(0.3, r.y * 0.15)), 0.14 * k, 0, 0, Math.PI * 2)
      ctx.fill()
      const bob = r.phase === 'play' && r.y <= 0.05 && r.slide <= 0 ? Math.abs(Math.sin(r.dist * 1.65)) * 0.1 : 0
      const blink = r.invuln > 0 && r.phase === 'play' ? (Math.floor(time * 14) % 2 ? 0.45 : 1) : 1
      const hgt = POSE_H[pose.name] ?? 1.9
      // lean into the lane change
      ctx.save()
      ctx.translate(x, ground)
      const lean = Math.max(-1, Math.min(1, (laneX(r.lane) - r.x) / LANE_W))
      ctx.rotate(lean * 0.12)
      ctx.translate(-x, -ground)
      drawSprite(pose.name, r.x, r.y + bob, DCAM, camX, { h: hgt }, { alpha: blink, fallback: '#7a4a24', squash: pose.squash })
      ctx.restore()
    }
  })

  items.sort((a, b) => b.d - a.d)
  for (const it of items) it.draw()

  // dust and sparkles
  for (const p of particles) {
    c.globalAlpha = Math.max(0, p.life / p.max)
    c.fillStyle = p.color
    c.beginPath()
    c.arc(p.x, p.y, p.size * (0.6 + 0.4 * (p.life / p.max)), 0, Math.PI * 2)
    c.fill()
  }
  c.globalAlpha = 1

  // a red edge in the first moments after a stumble
  if (stumbleShow > 0) {
    const g = c.createRadialGradient(VW / 2, VH / 2, VH * 0.25, VW / 2, VH / 2, VH * 0.65)
    g.addColorStop(0, 'rgba(200, 40, 20, 0)')
    g.addColorStop(1, `rgba(200, 40, 20, ${Math.min(0.5, stumbleShow)})`)
    c.fillStyle = g
    c.fillRect(0, 0, VW, VH)
  }
}

// ── the page ──────────────────────────────────────────────────────────────
const wrap = ref<HTMLElement | null>(null)
const box = reactive({ w: 360, h: 640 })
const landscape = ref(false)
const showAnyway = ref(false)

function resize() {
  const ww = window.innerWidth
  const wh = window.innerHeight
  landscape.value = ww > wh * 1.05 && ww < 1000
  const h = Math.min(wh, (ww * 16) / 9)
  box.h = Math.floor(h)
  box.w = Math.floor((h * 9) / 16)
  const cv = canvas.value
  if (cv) {
    cv.width = Math.round(VW * CS)
    cv.height = Math.round(VH * CS)
    ctx = cv.getContext('2d')
  }
}

const resultText = computed(() => {
  if (outcome.won) return level.value === LEVELS.length - 1 ? t('app.bigGames.elia.wonLast') : t('app.bigGames.elia.won')
  if (isFree.value) return t('app.bigGames.elia.endedFree', { n: outcome.meters })
  if (run.cause === 'hunger') return t('app.bigGames.elia.fellHunger')
  return run.cause === 'block' ? t('app.bigGames.elia.fellWall') : t('app.bigGames.elia.fell')
})
const riskStyle = computed(() => ({ width: `${Math.round(hud.risk * 100)}%` }))
const nextLevel = computed(() => (!isFree.value && outcome.won && level.value < LEVELS.length - 1 && LEVELS[level.value + 1]?.ready ? level.value + 1 : -1))
const breadSrc = pic('brot')
const crossSrc = pic('wisch-kreuz')
const arrowSrc = pic('wisch-pfeil')
const resultPic = computed(() => pic(outcome.won ? 'elia-jubel' : 'elia-sturz'))
const hideBroken = (e: Event) => {
  const el = e.target
  if (el instanceof HTMLElement) el.style.display = 'none'
}

function onVisibility() {
  if (document.hidden && screen.value === 'play') paused.value = true
}

let bodyOverflow = ''
onMounted(async () => {
  bodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  resize()
  window.addEventListener('resize', resize)
  window.addEventListener('keydown', onKey)
  document.addEventListener('visibilitychange', onVisibility)
  music.playElia()
  await loadAll()
  loaded.value = true
  last = performance.now()
  raf = requestAnimationFrame(frame)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  music.stop('game')
  window.removeEventListener('resize', resize)
  window.removeEventListener('keydown', onKey)
  document.removeEventListener('visibilitychange', onVisibility)
  document.body.style.overflow = bodyOverflow
})
</script>

<template lang="pug">
  div(class="eg" ref="wrap")
    div(class="eg-stage" :style="{ width: box.w + 'px', height: box.h + 'px' }")
      canvas(
        ref="canvas"
        class="eg-canvas"
        data-test="elia-canvas"
        @pointerdown="onDown"
        @pointermove="onMove"
        @pointerup="onUp"
        @pointercancel="onUp"
      )

      //- while the pictures load
      div(v-if="!loaded" class="eg-center")
        div(class="eg-spinner")

      //- the levels
      div(v-else-if="screen === 'menu'" class="eg-menu")
        div(class="eg-card")
          GameIntroBox(
            :title="t('app.bigGames.elia.title')"
            :label="t('app.bigGames.elia.storyHead')"
            :story="t('app.bigGames.elia.story')"
            :story-ref="t('app.bigGames.elia.storyRef')"
            :task="t('app.bigGames.elia.task')"
            test-id="elia-story"
          )
          div(class="eg-worlds")
            div(v-for="(w, wi) in WORLDS" :key="w" class="eg-world")
              div(class="eg-world-head")
                span(class="eg-world-name") {{ worldNames[wi] }}
                span(class="eg-world-ref") {{ worldRefs[wi] }}
              div(class="eg-levels")
                button(
                  v-for="i in worldLevels(wi)"
                  :key="i"
                  type="button"
                  :class="['eg-level', { 'is-locked': !unlocked(i) }]"
                  :disabled="!unlocked(i)"
                  :data-test="'elia-level-' + i"
                  @click="start(i)"
                )
                  span(class="eg-level-no") {{ (i % 3) + 1 }}
                  AdventureStars(v-if="LEVELS[i]?.ready" :stars="levelStars[i] ?? 0" :size="18")
                  span(v-else class="eg-soon") {{ t('app.bigGames.elia.soon') }}
          button(
            type="button"
            :class="['eg-free', { 'is-locked': !freeOpen }]"
            :disabled="!freeOpen"
            data-test="elia-free"
            @click="start(FREE_LEVEL)"
          )
            span(class="eg-free-name") {{ t('app.bigGames.elia.free') }}
            span(v-if="freeOpen" class="eg-free-best") {{ t('app.bigGames.elia.best', { n: best }) }}
            span(v-else class="eg-free-best") {{ t('app.bigGames.elia.freeLocked') }}
          p(class="eg-rules") {{ t('app.bigGames.elia.starRules') }}
          AdvButton(tone="gold" small data-test="elia-how" @click="how = true") {{ t('app.bigGames.elia.howTitle') }}
          AdvButton(tone="blau" small @click="leave") {{ t('app.bigGames.elia.leave') }}

      //- the game
      template(v-else-if="screen === 'play'")
        div(class="eg-hud")
          button(type="button" class="eg-btn" :aria-label="t('app.bigGames.elia.pause')" @click="paused = true") ❚❚
          div(class="eg-hud-mid")
            span(class="eg-level-label") {{ levelTitle(level) }}
            div(v-if="!isFree" class="eg-progress")
              div(class="eg-progress-bar" :style="{ width: hud.pct + '%' }")
            span(v-else class="eg-meters") {{ hud.meters }} m
          div(class="eg-hud-group")
            img(:src="breadSrc" alt="" class="eg-ico" @error="hideBroken")
            span(class="eg-count" data-test="elia-bread") {{ hud.bread }}
        div(:class="['eg-hunger', { 'is-low': hud.hunger < 0.25 }]" :aria-label="t('app.bigGames.elia.hunger')")
          img(:src="breadSrc" alt="" class="eg-hunger-ico" @error="hideBroken")
          div(class="eg-hunger-track")
            div(class="eg-hunger-bar" :style="{ width: Math.round(hud.hunger * 100) + '%' }")
        div(v-if="banner" class="eg-banner") {{ banner }}
        div(v-if="hud.risk > 0" class="eg-risk" :title="t('app.bigGames.elia.risk')")
          span(class="eg-risk-text") {{ t('app.bigGames.elia.risk') }}
          div(class="eg-risk-track")
            div(class="eg-risk-bar" :style="riskStyle")
        div(v-if="tipShown" class="eg-tip") {{ t('app.bigGames.elia.tip') }}

        //- the first level of a world: what happens in this part of the story
        div(v-if="storyWorld >= 0 && !how" class="eg-menu eg-menu--dim")
          div(class="eg-card eg-card--small eg-story-card" data-test="elia-world-story")
            span(class="eg-story-head") {{ worldNames[storyWorld] }}
            p(class="eg-story-text") {{ worldStories[storyWorld] }}
            AdvButton(data-test="elia-world-go" @click="closeWorldStory") {{ t('app.bigGames.elia.go') }}

        div(v-else-if="paused" class="eg-menu eg-menu--dim")
          div(class="eg-card eg-card--small")
            h2(class="eg-title") {{ t('app.bigGames.elia.pause') }}
            AdvButton(@click="paused = false") {{ t('app.bigGames.elia.resume') }}
            AdvButton(tone="blau" @click="start(level)") {{ t('app.bigGames.elia.again') }}
            AdvButton(tone="blau" @click="toMenu") {{ t('app.bigGames.elia.menu') }}

      //- the end of a round
      div(v-else-if="screen === 'result'" class="eg-menu eg-menu--dim")
        div(class="eg-card eg-card--small")
          h2(class="eg-title") {{ levelTitle(level) }}
          img(:src="resultPic" alt="" class="eg-result-pic" @error="hideBroken")
          AdventureStars(v-if="!isFree" :stars="outcome.stars" :size="52" celebrate)
          p(class="eg-text") {{ resultText }}
          p(class="eg-stats")
            span {{ outcome.meters }} m
            span(class="eg-stats-bread")
              img(:src="breadSrc" alt="" class="eg-ico" @error="hideBroken")
              | {{ outcome.bread }}
          p(v-if="isFree" class="eg-stats") {{ t('app.bigGames.elia.score', { n: outcome.score }) }}
          p(v-if="outcome.newBest" class="eg-new") {{ t('app.bigGames.elia.newBest') }}
          AdvButton(v-if="nextLevel >= 0" @click="start(nextLevel)") {{ t('app.bigGames.elia.next') }}
          AdvButton(:tone="nextLevel >= 0 ? 'blau' : 'gold'" @click="start(level)") {{ t('app.bigGames.elia.again') }}
          AdvButton(tone="blau" @click="toMenu") {{ t('app.bigGames.elia.menu') }}

    //- the explanation: swipes, hunger, ravens
    div(v-if="how" class="eg-how-wrap" :style="{ width: box.w + 'px', height: box.h + 'px' }")
      div(class="eg-card eg-how")
        h2(class="eg-title") {{ t('app.bigGames.elia.howTitle') }}
        //- a cross of four arrows: where one can swipe
        img(:src="crossSrc" alt="" class="eg-how-cross" @error="hideBroken")
        div(class="eg-how-row")
          span(class="eg-how-arrows")
            img(:src="arrowSrc" alt="" class="eg-how-arrow is-left" @error="hideBroken")
            img(:src="arrowSrc" alt="" class="eg-how-arrow is-right" @error="hideBroken")
          span {{ t('app.bigGames.elia.howLanes') }}
        div(class="eg-how-row")
          span(class="eg-how-arrows")
            img(:src="arrowSrc" alt="" class="eg-how-arrow is-up" @error="hideBroken")
          span {{ t('app.bigGames.elia.howJump') }}
        div(class="eg-how-row")
          span(class="eg-how-arrows")
            img(:src="arrowSrc" alt="" class="eg-how-arrow is-down" @error="hideBroken")
          span {{ t('app.bigGames.elia.howSlide') }}
        AdvButton(data-test="elia-go" @click="closeHow") {{ t('app.bigGames.elia.go') }}

    //- sideways: the note to hold the phone upright
    div(v-if="landscape && screen === 'play' && !showAnyway" class="eg-rotate")
      div(class="eg-rotate-icon" aria-hidden="true") ⟲
      p {{ t('app.bigGames.elia.rotate') }}
      AdvButton(tone="blau" small @click="showAnyway = true") {{ t('app.bigGames.elia.rotateAnyway') }}
</template>

<style scoped lang="sass">
.eg
  position: fixed
  inset: 0
  z-index: 60
  display: grid
  place-items: center
  background: #1c130a
  overflow: hidden
  user-select: none
  -webkit-user-select: none
  touch-action: none

.eg-stage
  position: relative
  overflow: hidden
  background: #f1c88a

.eg-canvas
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  touch-action: none

.eg-center
  position: absolute
  inset: 0
  display: grid
  place-items: center

.eg-spinner
  width: 46px
  height: 46px
  border-radius: 50%
  border: 5px solid rgba(255, 255, 255, 0.3)
  border-top-color: #f5c84a
  animation: eg-spin 0.9s linear infinite

@keyframes eg-spin
  to
    transform: rotate(360deg)

.eg-menu
  position: absolute
  inset: 0
  display: grid
  place-items: center
  padding: 12px
  overflow-y: auto
  background: linear-gradient(180deg, rgba(30, 18, 6, 0.25), rgba(30, 18, 6, 0.5))

  &--dim
    background: rgba(24, 14, 6, 0.62)

.eg-card
  width: 100%
  padding: 18px 16px 14px
  border-radius: 24px
  background: var(--lk-surface, #fffaf0)
  color: var(--lk-text, #2a2418)
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.45)
  display: flex
  flex-direction: column
  align-items: center
  gap: 8px
  text-align: center

.eg-title
  margin: 0
  font-size: 1.5rem
  font-weight: 800

.eg-text
  margin: 0
  line-height: 1.35
  font-size: 0.95rem

.eg-rules
  margin: 0
  font-size: 0.8rem
  color: var(--lk-muted, #7a6b4f)

// the story card of a world (the box of the menu is `GameIntroBox`)
.eg-story-head
  font-size: 0.72rem
  font-weight: 800
  letter-spacing: 0.08em
  text-transform: uppercase
  color: #8a5a12

.eg-story-text
  margin: 0
  font-size: 1rem
  line-height: 1.35
  color: #3a2c12

.eg-story-ref
  font-size: 0.75rem
  font-weight: 700
  font-style: italic
  color: #8a5a12

.eg-story-task
  margin: 2px 0 0
  padding-top: 6px
  border-top: 1px dashed #d9a93a
  font-size: 1rem
  font-weight: 800
  line-height: 1.3
  color: #2a2418

.eg-story-card
  text-align: left

  .eg-story-text
    font-size: 1rem

.eg-worlds
  display: flex
  flex-direction: column
  gap: 6px
  width: 100%

.eg-world
  display: flex
  align-items: center
  justify-content: space-between
  gap: 8px
  padding: 6px 8px
  border-radius: 14px
  background: var(--lk-surface-2, #f6efdc)

.eg-world-head
  display: flex
  flex-direction: column
  align-items: flex-start
  text-align: left
  min-width: 0

.eg-world-name
  font-weight: 800
  font-size: 0.88rem

.eg-world-ref
  font-size: 0.7rem
  color: var(--lk-muted, #7a6b4f)

.eg-levels
  display: flex
  gap: 6px

.eg-level
  display: flex
  flex-direction: column
  align-items: center
  gap: 2px
  min-width: 62px
  padding: 6px 4px
  border: 2px solid var(--lk-line, #e3d7bb)
  border-radius: 12px
  background: var(--lk-surface, #fffaf0)
  color: inherit
  font: inherit
  cursor: pointer

  &.is-locked
    opacity: 0.45
    cursor: default

.eg-level-no
  display: grid
  place-items: center
  width: 24px
  height: 24px
  border-radius: 50%
  background: var(--lk-accent, #1f6a6a)
  color: var(--lk-on-accent, #fff)
  font-weight: 800
  font-size: 0.85rem

.eg-soon
  font-size: 0.65rem
  color: var(--lk-muted, #7a6b4f)

.eg-free
  display: flex
  flex-direction: column
  align-items: center
  width: 100%
  padding: 8px 10px
  border: 2px solid var(--lk-accent, #1f6a6a)
  border-radius: 14px
  background: var(--lk-surface, #fffaf0)
  color: inherit
  font: inherit
  cursor: pointer

  &.is-locked
    opacity: 0.45
    cursor: default
    border-color: var(--lk-line, #e3d7bb)

.eg-free-name
  font-weight: 800

.eg-free-best
  font-size: 0.78rem
  color: var(--lk-muted, #7a6b4f)

.eg-hud
  position: absolute
  top: 0
  left: 0
  right: 0
  display: flex
  align-items: center
  justify-content: space-between
  gap: 8px
  padding: max(10px, env(safe-area-inset-top)) 10px 8px 10px
  pointer-events: none

.eg-hud > *
  pointer-events: auto

.eg-btn
  width: 42px
  height: 42px
  border: none
  border-radius: 50%
  background: rgba(255, 255, 255, 0.85)
  color: #2a2418
  font-weight: 800
  cursor: pointer

.eg-hud-mid
  flex: 1
  display: flex
  flex-direction: column
  align-items: center
  gap: 4px
  padding: 4px 12px
  border-radius: 16px
  background: rgba(255, 255, 255, 0.78)
  font-weight: 800
  min-width: 0

.eg-level-label
  font-size: 0.85rem
  white-space: nowrap
  overflow: hidden
  text-overflow: ellipsis
  max-width: 100%

.eg-progress
  width: 100%
  height: 8px
  border-radius: 999px
  background: rgba(60, 40, 10, 0.2)
  overflow: hidden

.eg-progress-bar
  height: 100%
  background: linear-gradient(90deg, #f0a52a, #e0652a)

.eg-meters
  font-size: 0.85rem

.eg-hud-group
  display: flex
  align-items: center
  gap: 6px
  padding: 4px 12px
  border-radius: 999px
  background: rgba(255, 255, 255, 0.78)
  min-height: 42px
  font-weight: 800

.eg-ico
  height: 26px
  width: auto

.eg-count
  font-size: 1.1rem
  min-width: 1.4em
  text-align: center

.eg-hunger
  position: absolute
  left: 50%
  top: 60px
  transform: translateX(-50%)
  display: flex
  align-items: center
  gap: 8px
  width: min(64%, 260px)
  padding: 4px 12px 4px 8px
  border-radius: 999px
  background: rgba(255, 250, 235, 0.88)
  pointer-events: none

.eg-hunger-ico
  height: 22px
  width: auto

.eg-hunger-track
  flex: 1
  height: 12px
  border-radius: 999px
  background: rgba(60, 40, 10, 0.2)
  overflow: hidden

.eg-hunger-bar
  height: 100%
  border-radius: 999px
  background: linear-gradient(90deg, #7bbf3c, #e0b82a)
  transition: width 0.2s linear

.eg-hunger.is-low
  animation: eg-pulse 0.7s ease-in-out infinite

  .eg-hunger-bar
    background: #d6482a

@keyframes eg-pulse
  50%
    transform: translateX(-50%) scale(1.06)

.eg-banner
  position: absolute
  left: 50%
  top: 26%
  transform: translateX(-50%)
  width: calc(100% - 40px)
  padding: 10px 16px
  border-radius: 18px
  background: rgba(255, 250, 235, 0.94)
  color: #2a2418
  font-weight: 800
  text-align: center
  pointer-events: none

.eg-how-wrap
  position: absolute
  inset: auto
  z-index: 6
  display: grid
  place-items: safe center
  padding: 10px
  background: rgba(24, 14, 6, 0.7)
  overflow-y: auto

.eg-how
  gap: 16px
  text-align: left

.eg-how-cross
  display: block
  width: 34%
  max-width: 110px
  height: auto
  margin: 0 auto 2px

.eg-how-row
  display: flex
  align-items: center
  gap: 14px
  width: 100%
  font-size: 1.15rem
  font-weight: 700
  line-height: 1.3

.eg-how-key
  flex: none
  display: grid
  place-items: center
  width: 40px
  height: 40px
  border-radius: 12px
  background: var(--lk-accent, #1f6a6a)
  color: var(--lk-on-accent, #fff)
  font-size: 1.4rem
  font-weight: 800

/* the golden arrow of the swipe cross, turned to each direction (left and right side by side) */
.eg-how-arrows
  flex: none
  display: flex
  align-items: center
  justify-content: center
  gap: 2px
  width: 56px
  height: 56px

.eg-how-arrow
  width: 26px
  height: auto
  &.is-up
    width: 38px
  &.is-down
    width: 38px
    transform: rotate(180deg)
  &.is-left
    transform: rotate(-90deg)
  &.is-right
    transform: rotate(90deg)

.eg-how-pic
  flex: none
  width: 40px
  height: 40px
  object-fit: contain

.eg-risk
  position: absolute
  left: 50%
  top: 98px
  transform: translateX(-50%)
  display: flex
  align-items: center
  gap: 8px
  padding: 4px 12px
  border-radius: 999px
  background: rgba(255, 244, 222, 0.88)
  pointer-events: none

.eg-risk-text
  font-size: 0.75rem
  font-weight: 800
  color: #a2371c

.eg-risk-track
  width: 70px
  height: 7px
  border-radius: 999px
  background: rgba(160, 55, 28, 0.2)
  overflow: hidden

.eg-risk-bar
  height: 100%
  background: #d6482a

.eg-tip
  position: absolute
  left: 50%
  bottom: 18px
  transform: translateX(-50%)
  width: calc(100% - 28px)
  padding: 10px 16px
  border-radius: 18px
  background: rgba(255, 250, 235, 0.94)
  color: #2a2418
  font-weight: 700
  text-align: center
  pointer-events: none

.eg-stats
  display: flex
  gap: 16px
  align-items: center
  justify-content: center
  margin: 0
  font-weight: 800
  font-size: 1.05rem

.eg-stats-bread
  display: inline-flex
  align-items: center
  gap: 6px

.eg-new
  margin: 0
  font-weight: 800
  color: #c4571a

.eg-result-pic
  height: 120px
  width: auto
  object-fit: contain

.eg-rotate
  position: absolute
  inset: 0
  z-index: 5
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  gap: 14px
  padding: 24px
  background: rgba(24, 14, 6, 0.94)
  color: #fff6dc
  text-align: center
  font-size: 1.1rem
  font-weight: 700

.eg-rotate-icon
  font-size: 4rem
  animation: eg-turn 2s ease-in-out infinite

@keyframes eg-turn
  0%, 20%
    transform: rotate(0)
  60%, 100%
    transform: rotate(-90deg)

// short screens: the explanation card closer together
@media (max-height: 520px)
  .eg-how
    gap: 8px
  .eg-how-row
    gap: 12px
  .eg-how-arrows
    width: 44px
    height: 44px
  .eg-how-cross
    max-width: 70px
  .eg-how-row
    font-size: 1.05rem
</style>
