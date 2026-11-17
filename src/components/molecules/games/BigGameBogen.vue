<script setup lang="ts">
/**
 * "Jonatans Pfeile": the big archery game (rules and physics in `utils/bogenGame.ts`, levels in `utils/bogenLevels.ts`; this file draws it and takes
 * the touch). The child puts a finger anywhere, pulls back and lets go; the arrow flies the other way under gravity and wind. Targets, bells, jars
 * and flags have to be hit, switches open gates, ropes let weights fall, stones and shields throw the arrow back. The canvas is measured at every
 * touch (a tablet's browser bar slides in and out), and by a ResizeObserver.
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import AdventureStars from '@/components/molecules/AdventureStars.vue'
import useBigGames, { howSeen, markHowSeen } from '@/use/useBigGames'
import useSfx from '@/use/useSfx'
import useMusic from '@/use/useMusic'
import { prependBaseUrl } from '@/utils/function'
import { aimPoints, advance as advanceGame, arrowsLeft, cloneGame, itemPos, needsAll, needsLeft, previewPath, shoot, starsOf, windAt, type Game, type ItemDef, type Poly } from '@/utils/bogenGame'
import { CHAPTER_COUNT, LEVELS, LEVELS_PER_CHAPTER, levelGame } from '@/utils/bogenLevels'
import { findHintAsync } from '@/utils/bogenSolve'
import { MIN_PULL_PX, clientToLocal, maxPullOf, pullToAim } from '@/utils/bogenView'

const emit = defineEmits<{ leave: [] }>()
const { t, tm, rt } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const music = useMusic()
const progress = useBigGames()
const ID = 'bogen'

// ── the pictures ────────────────────────────────────────────────────────────────────────────────────────────────────────────
const NAMES = [
  'jonatan', 'arm', 'bogen', 'pfeil', 'scheibe', 'glocke', 'krug', 'fahne-zu', 'fahne-auf', 'scherben', 'schalter', 'schalter-an',
  'tor', 'schild', 'rad', 'gewicht', 'seil', 'balken', 'steinhaufen', 'galgen', 'tex-erde', 'tex-stein', 'tex-holz', 'tex-ziegel',
  'boden-1', 'boden-2', 'boden-3', 'boden-4', 'bg-1', 'bg-2', 'bg-3', 'bg-4', 'abschluss'
]
const img: Record<string, HTMLImageElement | undefined> = {}
const loaded = ref(false)
const glow = new Image()
glow.src = prependBaseUrl('images/abenteuer/ui/sternglanz.webp')
const pic = (n: string) => prependBaseUrl(`images/spiele-gross/bogen/${n}.webp`)
const picOf = (n: string) => img[n]

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
const tipBusy = ref(false)
/** The phone stands upright: a little note asks to turn it. */
const portrait = ref(false)
type ChapterText = { name: Parameters<typeof rt>[0]; ref: Parameters<typeof rt>[0]; story: Parameters<typeof rt>[0]; task: Parameters<typeof rt>[0] }
const chapterTexts = computed(() => ((tm('app.bigGames.bogen.chapters') as unknown as ChapterText[]) ?? []).map((m) => ({ name: rt(m.name), ref: rt(m.ref), story: rt(m.story), task: rt(m.task) })))
const names = computed(() => ((tm('app.bigGames.bogen.names') as unknown as Parameters<typeof rt>[0][]) ?? []).map((m) => rt(m)))
const levelStars = computed(() => progress.levels(ID))
const chapterLevels = (c: number) => Array.from({ length: LEVELS_PER_CHAPTER }, (_, k) => c * LEVELS_PER_CHAPTER + k)
const chapterStars = (c: number) => chapterLevels(c).reduce((n, i) => n + (levelStars.value[i] ?? 0), 0)
const chapterDone = (c: number) => chapterLevels(c).every((i) => (levelStars.value[i] ?? 0) >= 1)
const allDone = computed(() => Array.from({ length: CHAPTER_COUNT }, (_, c) => c).every(chapterDone))
const hasNext = computed(() => level.value < LEVELS.length - 1)
const chapterOf = (i: number) => LEVELS[i]?.chapter ?? 0
const levelName = (i: number) => names.value[i] ?? ''
const levelLabel = (i: number) => `${t('app.bigGames.bogen.level')} ${i + 1}`

const hud = reactive({ left: 0, supply: 0, goals: 0, all: 0, s2: true, s3: true, wind: 0, windMax: 1, think: false })
const outcome = reactive({ stars: 0, left: 0 })

// ── local memory (chapters seen, hints seen) ────────────────────────────────────────────────────────────────────────────────
const MEM_KEY = 'lk-bogen-v1'
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
let g: Game = levelGame(0)
const canvas = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let raf = 0
let last = 0
let dpr = 1
let cvW = 1
let cvH = 1
let ro: ResizeObserver | null = null
const VIEW_MAX = 34

/** The camera: the world point in the middle of the screen, the zoom, and the base scale (pixels per unit when the whole level is seen). */
let S = 24
let viewW = 34
let groundY = 300
let camCx = 17
let camCy = 5
let zoom = 1
let idleT = 0
let timeScale = 1
let slowT = 0
const sx = (x: number) => cvW / 2 + (x - camCx) * S * zoom
const sy = (y: number) => cvH / 2 - (y - camCy) * S * zoom
const u = () => S * zoom

interface Part {
  x: number
  y: number
  vx: number
  vy: number
  t: number
  life: number
  r: number
  kind: 'dust' | 'spark' | 'chip' | 'shard' | 'ring'
  rot: number
  vr: number
}
const parts: Part[] = []
let rngState = 4242
const rand = () => {
  rngState = (rngState * 1664525 + 1013904223) >>> 0
  return rngState / 4294967296
}
function spawn(kind: Part['kind'], x: number, y: number, vx: number, vy: number, life: number, r: number) {
  if (parts.length >= 260) parts.shift()
  parts.push({ x, y, vx, vy, t: 0, life, r, kind, rot: rand() * 6, vr: (rand() - 0.5) * 12 })
}
function burst(kind: Part['kind'], x: number, y: number, n: number, speed: number, life: number, r: number) {
  for (let i = 0; i < n; i++) {
    const a = rand() * Math.PI * 2
    const v = speed * (0.4 + rand() * 0.8)
    spawn(kind, x, y, Math.cos(a) * v, Math.sin(a) * v + speed * 0.3, life * (0.7 + rand() * 0.5), r * (0.6 + rand() * 0.8))
  }
}

/** The trails of the flying arrows (the last points of each). */
const trails = new Map<number, number[]>()
/** The bow: the aim now and the string after the release. */
const bow = { angle: 35, pull: 0, drawn: false, shotT: 9, shotPull: 0, shotAngle: 35, cool: 0 }
/** The finger. */
let pt: { id: number; x0: number; y0: number; x: number; y: number; ok: boolean; angle: number; f: number } | null = null
const previewPts: number[] = []
/** The hint: where to aim and when. */
let tipShot: { a: number; f: number; at: number; until: number; path: number[] } | null = null
let endTimer = 0
let winSlowAt = -1

function begin(i: number) {
  level.value = i
  g = levelGame(i)
  parts.length = 0
  trails.clear()
  tipShot = null
  pt = null
  bow.drawn = false
  bow.pull = 0
  bow.shotT = 9
  bow.cool = 0
  bow.angle = 38
  timeScale = 1
  slowT = 0
  winSlowAt = -1
  idleT = 0
  window.clearTimeout(endTimer)
  const L = LEVELS[i]!
  screen.value = 'play'
  pendingCard = L.index === 0 && !mem.chapters[L.chapter] ? L.chapter : -1
  how.value = !howSeen(ID)
  chapterCard.value = how.value ? -1 : pendingCard
  paused.value = how.value || chapterCard.value >= 0
  hintShown.value = false
  tipBusy.value = false
  syncHud()
  layout()
  camCx = viewW / 2
  camCy = (groundY - cvH / 2) / S
  zoom = 1
  if (!paused.value) hintOnce(L.intro)
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
  say(t(`app.bigGames.bogen.hint.${intro}`), 9000)
}

function syncHud() {
  const left = arrowsLeft(g)
  if (hud.left !== left) hud.left = left
  if (hud.supply !== g.supply) hud.supply = g.supply
  const all = needsAll(g.def)
  const goals = all - needsLeft(g)
  if (hud.goals !== goals) hud.goals = goals
  if (hud.all !== all) hud.all = all
  const s2 = left >= 1
  const s3 = left >= 2
  if (hud.s2 !== s2) hud.s2 = s2
  if (hud.s3 !== s3) hud.s3 = s3
  const w = g.def.wind
  if (hud.wind !== w) hud.wind = w
  const wm = Math.max(1, Math.abs(w), ...(g.def.zones ?? []).map((z) => Math.abs(z.wx)))
  if (hud.windMax !== wm) hud.windMax = wm
}

// ── the events of the rules: sounds and effects ─────────────────────────────────────────────────────────────────────────────
function onEvents() {
  for (const e of g.events) {
    if (e.t === 'shoot') {
      bow.shotT = 0
      bow.shotPull = bow.drawn ? bow.pull : 0.6
      bow.shotAngle = bow.angle
      bow.cool = 0.22
      bow.drawn = false
      bow.pull = 0
      tipShot = null
      play('flip', 0.9)
    } else if (e.t === 'stick') {
      if (e.mat === 'item') play('hit', 0.8)
      else if (e.mat === 'dirt') {
        play('sack', 0.5)
        burst('dust', e.x, Math.max(0.1, e.y), 5, 2, 0.5, 0.18)
      } else {
        play('clunk', 0.6)
        burst('chip', e.x, e.y, 7, 3.5, 0.6, 0.12)
      }
    } else if (e.t === 'bounce') {
      play(e.mat === 'shield' ? 'clunk' : 'snap', 0.8)
      burst('spark', e.x, e.y, 6, 3, 0.45, 0.7)
    } else if (e.t === 'hit') {
      const it = g.def.items[e.item]!
      if (it.kind === 'bell') {
        play('trophy', 0.9)
        for (let k = 0; k < 3; k++) spawn('ring', e.x, e.y, 0, 0, 0.9 + k * 0.15, 1.0 + k * 0.5)
      } else if (it.kind === 'jar') {
        play('sack', 0.8)
        burst('shard', e.x, e.y, 14, 4.5, 1.0, 0.22)
      } else if (it.kind === 'flag') {
        play('star', 0.9)
        burst('spark', e.x, e.y, 8, 3, 0.7, 0.8)
      } else if (it.kind === 'switch') {
        play('button', 0.9)
        burst('spark', e.x, e.y, 6, 2.5, 0.5, 0.6)
      } else {
        play('found', 0.8)
        burst('spark', e.x, e.y, 10, 3.5, 0.7, 0.9)
      }
    } else if (e.t === 'rope') {
      play('snap', 0.8)
      burst('chip', e.x, e.y, 4, 1.5, 0.5, 0.1)
    } else if (e.t === 'gate') {
      play('caravan', 0.5)
    } else if (e.t === 'land') {
      play('clunk', 0.9)
      burst('dust', e.x, e.y + 0.1, 8, 3, 0.7, 0.3)
    } else if (e.t === 'win') {
      timeScale = 0.28
      slowT = 1.3
      winSlowAt = 0
      if (g.lastHit) burst('spark', g.lastHit.x, g.lastHit.y, 20, 5.5, 1.4, 1.1)
      play('fanfare')
      finish()
    } else if (e.t === 'lost') {
      play('wrong', 0.7)
      finish()
    }
  }
  g.events.length = 0
}

function finish() {
  window.clearTimeout(endTimer)
  if (g.status === 'won') {
    outcome.stars = starsOf(g)
    outcome.left = g.left
    progress.record(ID, level.value, outcome.stars)
  } else {
    outcome.stars = 0
    outcome.left = 0
  }
  endTimer = window.setTimeout(() => {
    if (screen.value !== 'play') return
    screen.value = 'result'
    play(g.status === 'won' ? 'result' : 'wrong', 0.8)
  }, g.status === 'won' ? 2300 : 900)
}

// ── the touch (the canvas is measured at every touch) ───────────────────────────────────────────────────────────────────────
const live = () => screen.value === 'play' && !paused.value && g.status === 'play'

/** A touch as a point of the canvas in the units that the game draws with (the real size of the canvas now, not the one of the last resize). */
function pos(e: PointerEvent): { x: number; y: number } {
  const c = canvas.value!
  const [x, y] = clientToLocal(c.getBoundingClientRect(), cvW, cvH, e.clientX, e.clientY)
  return { x, y }
}

function onDown(e: PointerEvent) {
  if (!live() || pt) return
  try {
    ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
  } catch {
    // a finger that is not known to the page: the touch still works without the capture
  }
  const p = pos(e)
  pt = { id: e.pointerId, x0: p.x, y0: p.y, x: p.x, y: p.y, ok: false, angle: bow.angle, f: 0 }
}
function onMove(e: PointerEvent) {
  if (!pt || e.pointerId !== pt.id || !live()) return
  const p = pos(e)
  pt.x = p.x
  pt.y = p.y
  const a = pullToAim(p.x - pt.x0, p.y - pt.y0, maxPullOf(cvW, cvH))
  pt.ok = a.ok
  if (a.ok) {
    pt.angle = a.angle
    pt.f = a.f
    bow.angle = a.angle
    bow.pull = a.f
    bow.drawn = true
    // wide levels look ahead while the bow is drawn
    idleT = 0
  } else {
    bow.drawn = false
    bow.pull = 0
  }
}
function onUp(e: PointerEvent) {
  const s = pt
  if (!s || e.pointerId !== s.id) return
  pt = null
  previewPts.length = 0
  if (!live()) {
    bow.drawn = false
    bow.pull = 0
    return
  }
  // the last position before the finger left counts (lifting the finger moves it a little)
  if (s.ok) {
    shoot(g, s.angle, s.f)
  } else {
    bow.drawn = false
    bow.pull = 0
  }
}
function onCancel() {
  pt = null
  bow.drawn = false
  bow.pull = 0
  previewPts.length = 0
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'p' || e.key === 'Escape') {
    if (screen.value === 'play' && !how.value && chapterCard.value < 0) paused.value = !paused.value
  }
}

// ── the tip: a shot found by the simulator ──────────────────────────────────────────────────────────────────────────────────
function askTip() {
  if (!live() || tipBusy.value) return
  tipBusy.value = true
  say(t('app.bigGames.bogen.tipThink'), 2500)
  const level0 = level.value
  const shots0 = g.shots
  // the search runs on a copy (the game goes on meanwhile); its time axis is the game's own
  const snap = cloneGame(g)
  void findHintAsync(snap).then((h) => {
    tipBusy.value = false
    // the child may have shot or left meanwhile: then the hint is old
    if (level.value !== level0 || g.shots !== shots0 || screen.value !== 'play') return
    if (!h) {
      say(t('app.bigGames.bogen.tipNone'), 5000)
      return
    }
    const path = previewPath(snap, h.a, h.f, 5, [])
    tipShot = { a: h.a, f: h.f, at: snap.t + h.wait, until: g.t + h.wait + 14, path }
    bow.angle = h.a
    if (h.wait > 0.4) say(t('app.bigGames.bogen.tipWait'), 6000)
    else hintShown.value = false
  })
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
  viewW = Math.min(g.def.w, VIEW_MAX)
  const p = cvH > cvW * 1.15
  if (portrait.value !== p) portrait.value = p
  groundY = cvH * (p ? 0.7 : 0.86)
  S = cvW / viewW
  // sideways the top of the tallest things (the hooks of the gallows) must stay below the bar of the buttons
  if (!p) S = Math.min(S, (groundY - 78) / 11.7)
}

function frame(now: number) {
  raf = requestAnimationFrame(frame)
  const real = Math.min(0.05, (now - last) / 1000 || 0)
  last = now
  if (slowT > 0) {
    slowT -= real
    if (slowT <= 0) timeScale = 1
  }
  step(real * timeScale, real)
  draw(now / 1000)
}

function step(dt: number, real: number) {
  if (screen.value !== 'play') return
  if (!paused.value) {
    advanceGame(g, dt)
    bow.shotT += dt
    if (bow.cool > 0) bow.cool -= dt
    for (const p of parts) {
      p.t += dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      if (p.kind === 'dust' || p.kind === 'chip' || p.kind === 'shard') p.vy -= 9 * dt
      else if (p.kind === 'spark') p.vy -= 1.5 * dt
      p.rot += p.vr * dt
    }
    for (let i = parts.length - 1; i >= 0; i--) if (parts[i]!.t > parts[i]!.life) parts.splice(i, 1)
    for (const a of g.arrows) {
      if (a.state !== 'fly') continue
      let tr = trails.get(a.id)
      if (!tr) trails.set(a.id, (tr = []))
      tr.push(a.x, a.y)
      if (tr.length > 36) tr.splice(0, 2)
    }
    // trails of arrows that landed fade away
    for (const [id, tr] of trails) {
      const a = g.arrows.find((x) => x.id === id)
      if (!a || a.state !== 'fly') {
        if (tr.length > 2) tr.splice(0, 2)
        else trails.delete(id)
      }
    }
  }
  onEvents()
  syncHud()
  if (g.status === 'play' && !paused.value && bow.cool <= 0 && !pt) idleT += real
  // the preview line while the bow is drawn
  if (pt && pt.ok && live()) {
    const secs = LEVELS[level.value]!.def.preview * (g.shots >= 3 && g.items.every((i) => !i.done) ? 1.7 : 1)
    previewPath(g, pt.angle, pt.f, secs, previewPts)
  } else previewPts.length = 0
  if (tipShot && g.t > tipShot.until) tipShot = null
  moveCamera(real)
}

function moveCamera(dt: number) {
  const view = g.def.w
  let tx = viewW / 2
  let ty = (groundY - cvH / 2) / S
  let tz = 1
  const fly = [...g.arrows].reverse().find((a) => a.state === 'fly')
  if (g.status === 'won' && g.lastHit && winSlowAt >= 0 && g.winT < 1.9) {
    tx = g.lastHit.x
    ty = g.lastHit.y
    tz = 1.45
    // keep the picture inside the world
    tx = Math.max(viewW / (2 * tz), Math.min(view - viewW / (2 * tz) + 4, tx))
    ty = Math.max(ty, (groundY - cvH / 2) / (S * tz) + 0.2)
  } else if (view > viewW) {
    const lo = viewW / 2
    const hi = view - viewW / 2
    if (fly) tx = Math.max(lo, Math.min(hi, fly.x + viewW * 0.1))
    else if (pt && pt.ok) tx = lo + (hi - lo) * Math.min(1, pt.f * 1.15)
    else if (g.arrows.some((a) => a.state === 'stuck') && idleT < 1.2) tx = camCx
  }
  if (fly && g.status !== 'won') {
    const topWorld = camCy + cvH / (2 * S)
    if (fly.y > topWorld - 2) ty = Math.min(camCy + (fly.y - topWorld + 3), ty + 16)
    else if (fly.y > ty + cvH / (2 * S) - 2) ty = fly.y
  }
  const k = Math.min(1, dt * (tz > 1 ? 4 : 3.2))
  camCx += (tx - camCx) * k
  camCy += (ty - camCy) * k
  zoom += (tz - zoom) * Math.min(1, dt * 4)
  if (g.winT >= 1.9) zoom += (1 - zoom) * Math.min(1, dt * 4)
}

// ── drawing ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
/** A picture centred at (cx, cy) in screen pixels, `w` x `h` pixels, turned by `rot`; returns false when the picture is missing. */
function spr(c: CanvasRenderingContext2D, name: string, cx: number, cy: number, w: number, h: number, rot = 0, alpha = 1, flip = false): boolean {
  const i = picOf(name)
  if (!i || !i.width) return false
  c.save()
  c.translate(cx, cy)
  if (rot) c.rotate(rot)
  if (flip) c.scale(-1, 1)
  if (alpha < 1) c.globalAlpha = alpha
  c.drawImage(i, -w / 2, -h / 2, w, h)
  c.restore()
  return true
}
/** The same, as a picture of a given height in world units (the width follows the picture). */
function sprH(c: CanvasRenderingContext2D, name: string, x: number, y: number, hWorld: number, rot = 0, alpha = 1, flip = false, anchor: 'c' | 'b' | 't' = 'c'): boolean {
  const i = picOf(name)
  if (!i || !i.width) return false
  const h = hWorld * u()
  const w = (i.width / i.height) * h
  const cy = anchor === 'c' ? sy(y) : anchor === 'b' ? sy(y) - h / 2 : sy(y) + h / 2
  return spr(c, name, sx(x), cy, w, h, rot, alpha, flip)
}

const GROUND_COLOUR = ['#6b4a28', '#6a4a2a', '#7a5a30', '#5a3a2a']
const SKY = [['#a9d2ee', '#e8f0d8'], ['#9ec8e8', '#f1e4b8'], ['#aebfcc', '#e9dfc6'], ['#e9a97a', '#f6d79a']]

function drawBackground(c: CanvasRenderingContext2D, chap: number) {
  const bg = picOf(`bg-${chap + 1}`)
  const sky = c.createLinearGradient(0, 0, 0, groundY)
  sky.addColorStop(0, SKY[chap]![0]!)
  sky.addColorStop(1, SKY[chap]![1]!)
  c.fillStyle = sky
  c.fillRect(0, 0, cvW, cvH)
  if (!bg) return
  const w = Math.max(cvW * 1.1, (groundY / 0.62) * (bg.width / bg.height))
  const h = (bg.height / bg.width) * w
  const par = -(camCx - viewW / 2) * S * 0.12
  const horizon = h * 0.56
  const y0 = groundY - horizon + (camCy - (groundY - cvH / 2) / S) * S * 0.12
  c.drawImage(bg, (cvW - w) / 2 + par, y0, w, h)
}

function drawGround(c: CanvasRenderingContext2D, chap: number) {
  const y = sy(0)
  if (y > cvH) return
  const strip = picOf(`boden-${chap + 1}`)
  c.fillStyle = GROUND_COLOUR[chap]!
  const tileW = 12 * u()
  if (!strip) {
    c.fillRect(0, y, cvW, cvH - y)
    c.fillStyle = '#7ba05b'
    c.fillRect(0, y - 3, cvW, 7)
    return
  }
  const th = (strip.height / strip.width) * tileW
  // below the strip: the colour of its lower edge
  c.fillRect(0, y + th * 0.7, cvW, cvH)
  const x0 = cvW / 2 - camCx * u()
  const k0 = Math.floor((0 - x0) / tileW) - 1
  const k1 = Math.floor((cvW - x0) / tileW) + 1
  for (let k = k0; k <= k1; k++) {
    const x = x0 + k * tileW
    c.save()
    c.translate(x, y - th * 0.16)
    if (k & 1) {
      c.translate(tileW, 0)
      c.scale(-1, 1)
    }
    c.drawImage(strip, 0, 0, tileW + 1, th)
    c.restore()
  }
}

/** The colours of a polygon when its texture is missing. */
const MAT_COLOUR = { dirt: '#8a6a44', wood: '#9a6a3a', stone: '#9a9a92', shield: '#8a5a2a' } as const
const MAT_TEX = { dirt: 'tex-erde', wood: 'tex-holz', stone: 'tex-stein', shield: 'tex-holz' } as const

function drawPoly(c: CanvasRenderingContext2D, p: Poly) {
  const pts = p.pts
  if (p.mat === 'shield') return drawShieldBar(c, p)
  let x0 = 1e9
  let y0 = 1e9
  let x1 = -1e9
  let y1 = -1e9
  for (const q of pts) {
    x0 = Math.min(x0, q[0])
    x1 = Math.max(x1, q[0])
    y0 = Math.min(y0, q[1])
    y1 = Math.max(y1, q[1])
  }
  if (sx(x1) < -20 || sx(x0) > cvW + 20) return
  c.save()
  c.beginPath()
  pts.forEach((q, i) => (i ? c.lineTo(sx(q[0]), sy(q[1])) : c.moveTo(sx(q[0]), sy(q[1]))))
  c.closePath()
  c.fillStyle = MAT_COLOUR[p.mat]
  c.fill()
  c.clip()
  const tex = picOf(MAT_TEX[p.mat])
  if (tex) {
    const tile = 3.2 * u()
    const a0 = Math.floor(x0 / 3.2)
    const a1 = Math.ceil(x1 / 3.2)
    const b0 = Math.floor(y0 / 3.2)
    const b1 = Math.ceil(y1 / 3.2)
    for (let a = a0; a < a1; a++) for (let b = b0; b < b1; b++) c.drawImage(tex, sx(a * 3.2), sy((b + 1) * 3.2), tile + 1, tile + 1)
  }
  // a little light on the top edge and shade on the bottom
  const gr = c.createLinearGradient(0, sy(y1), 0, sy(y0))
  gr.addColorStop(0, 'rgba(255,240,200,0.28)')
  gr.addColorStop(0.18, 'rgba(255,240,200,0)')
  gr.addColorStop(1, 'rgba(30,15,0,0.28)')
  c.fillStyle = gr
  c.fillRect(sx(x0), sy(y1), sx(x1) - sx(x0), sy(y0) - sy(y1))
  c.restore()
  c.beginPath()
  pts.forEach((q, i) => (i ? c.lineTo(sx(q[0]), sy(q[1])) : c.moveTo(sx(q[0]), sy(q[1]))))
  c.closePath()
  c.strokeStyle = 'rgba(45,28,10,0.85)'
  c.lineWidth = Math.max(1.5, u() * 0.07)
  c.lineJoin = 'round'
  c.stroke()
}

/** A shield wall: round shields in a row along the bar. */
function drawShieldBar(c: CanvasRenderingContext2D, p: Poly) {
  // the bar goes from the middle of the first short side to the middle of the opposite one
  const [a, b, d, e] = p.pts as unknown as [number[], number[], number[], number[]]
  const x0 = (a[0]! + e[0]!) / 2
  const y0 = (a[1]! + e[1]!) / 2
  const x1 = (b[0]! + d[0]!) / 2
  const y1 = (b[1]! + d[1]!) / 2
  const len = Math.hypot(x1 - x0, y1 - y0)
  const n = Math.max(1, Math.round(len / 2.2))
  const size = len / n
  for (let k = 0; k < n; k++) {
    const t0 = (k + 0.5) / n
    const x = x0 + (x1 - x0) * t0
    const y = y0 + (y1 - y0) * t0
    if (!spr(c, 'schild', sx(x), sy(y), size * u() * 1.02, size * u() * 1.02)) {
      c.fillStyle = '#8a5a2a'
      c.strokeStyle = '#3a2410'
      c.lineWidth = 2
      c.beginPath()
      c.arc(sx(x), sy(y), (size * u()) / 2, 0, Math.PI * 2)
      c.fill()
      c.stroke()
    }
  }
}

function drawGallows(c: CanvasRenderingContext2D, x: number, h: number, w: number) {
  const i = picOf('galgen')
  if (i && i.width) {
    // the picture: post at the left, arm at the top reaching right (a square-ish picture): stretch it to the size
    c.drawImage(i, sx(x - 0.4), sy(h + 0.4), (w + 0.9) * u(), (h + 0.4) * u())
    return
  }
  c.strokeStyle = '#6a4424'
  c.lineWidth = Math.max(4, u() * 0.32)
  c.lineCap = 'round'
  c.beginPath()
  c.moveTo(sx(x), sy(0))
  c.lineTo(sx(x), sy(h))
  c.lineTo(sx(x + w), sy(h))
  c.moveTo(sx(x), sy(h - 1.6))
  c.lineTo(sx(x + 1.4), sy(h))
  c.stroke()
  c.lineCap = 'butt'
}

/** A rope between two world points (the picture of a rope stretched along it, or a plain line). */
function drawRope(c: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, th = 0.26, sag = 0) {
  const ax = sx(x0)
  const ay = sy(y0)
  const bx = sx(x1)
  const by = sy(y1)
  const len = Math.hypot(bx - ax, by - ay)
  const rope = picOf('seil')
  if (rope && rope.width && sag === 0) {
    c.save()
    c.translate(ax, ay)
    c.rotate(Math.atan2(by - ay, bx - ax))
    c.drawImage(rope, 0, (-th * u()) / 2, len, th * u())
    c.restore()
    return
  }
  c.strokeStyle = '#c9a874'
  c.lineWidth = Math.max(2, th * u() * 0.7)
  c.lineCap = 'round'
  c.beginPath()
  c.moveTo(ax, ay)
  if (sag) c.quadraticCurveTo((ax + bx) / 2 + sag * u(), (ay + by) / 2, bx, by)
  else c.lineTo(bx, by)
  c.stroke()
  c.strokeStyle = '#7a5a30'
  c.lineWidth = 1
  c.stroke()
  c.lineCap = 'butt'
}

function drawItem(c: CanvasRenderingContext2D, i: number, time: number) {
  const it = g.def.items[i]! as ItemDef
  const st = g.items[i]!
  const x = st.x
  const y = st.y
  const r = it.r
  const sinceHit = g.t - st.hitT
  const px = sx(x)
  const py = sy(y)
  if (px < -120 || px > cvW + 120) return
  const need = it.kind !== 'switch' && it.need !== false
  // a ring for what has to be hit
  if (need && !st.done && screen.value === 'play') {
    const pulse = 0.5 + 0.5 * Math.sin(time * 3 + x)
    c.strokeStyle = `rgba(255,236,150,${0.35 + 0.35 * pulse})`
    c.lineWidth = Math.max(2, u() * 0.1)
    c.setLineDash([u() * 0.28, u() * 0.22])
    c.beginPath()
    c.arc(px, py, r * 1.38 * u() + pulse * u() * 0.08, 0, Math.PI * 2)
    c.stroke()
    c.setLineDash([])
  }
  const m = it.motion
  if (m && m.k === 'swing') {
    // the chain from the hook and the thing turned along it
    const ang = Math.atan2(x - m.px, m.py - y)
    drawRope(c, m.px, m.py, x, y + r * 0.8, 0.14)
    if (it.kind === 'bell') {
      const ringK = sinceHit < 1.2 ? Math.sin(sinceHit * 22) * Math.exp(-sinceHit * 3) * 0.22 : 0
      if (!spr(c, 'glocke', px, py, r * 2.2 * u() * 0.95, r * 2.4 * u(), ang + ringK)) drawBellFallback(c, px, py, r)
      return
    }
  } else if (m && m.k === 'slide') {
    // a rail and a cart with wheels
    const beam = picOf('balken')
    const bx0 = sx(Math.min(m.x0, m.x1) - 1.4)
    const bx1 = sx(Math.max(m.x0, m.x1) + 1.4)
    const by = sy(Math.min(m.y0, m.y1) - r - 0.3)
    if (beam && beam.width) c.drawImage(beam, bx0, by - 0.18 * u(), bx1 - bx0, 0.46 * u())
    else {
      c.fillStyle = '#7a5530'
      c.fillRect(bx0, by - 0.1 * u(), bx1 - bx0, 0.3 * u())
    }
    const turn = (x * 1.2) / 0.55
    for (const dx of [-0.85, 0.85]) {
      if (!spr(c, 'rad', sx(x + dx * r * 0.8), sy(y - r * 0.95), r * 1.0 * u(), r * 1.0 * u(), turn)) {
        c.fillStyle = '#4a3220'
        c.beginPath()
        c.arc(sx(x + dx * r * 0.8), sy(y - r * 0.95), r * 0.5 * u(), 0, Math.PI * 2)
        c.fill()
      }
    }
  } else if (it.kind === 'bell') {
    // a standing bell hangs on its own chain from the top (drawn by the level's deco)
  }
  const bump = sinceHit < 0.3 ? 1 + Math.sin((sinceHit / 0.3) * Math.PI) * 0.12 : 1
  if (it.kind === 'target') {
    if (!spr(c, 'scheibe', px, py, r * 2 * u() * bump, r * 2 * u() * bump)) drawTargetFallback(c, px, py, r * u() * bump)
    if (st.done) {
      c.fillStyle = 'rgba(255,225,120,0.22)'
      c.beginPath()
      c.arc(px, py, r * u(), 0, Math.PI * 2)
      c.fill()
    }
  } else if (it.kind === 'bell') {
    if (!m) {
      const ringK = sinceHit < 1.2 ? Math.sin(sinceHit * 22) * Math.exp(-sinceHit * 3) * 0.28 : 0
      c.save()
      c.translate(px, py - r * u() * 1.0)
      c.rotate(ringK)
      if (!spr(c, 'glocke', 0, r * u() * 1.0, r * 2.2 * u() * 0.95, r * 2.4 * u())) {
        c.translate(0, r * u())
        drawBellFallback(c, 0, 0, r)
      }
      c.restore()
    }
  } else if (it.kind === 'jar') {
    if (!st.done) {
      if (!spr(c, 'krug', px, py, r * 1.9 * u(), r * 2.3 * u())) {
        c.fillStyle = '#c0703a'
        c.strokeStyle = '#4a2a10'
        c.lineWidth = 2
        c.beginPath()
        c.ellipse(px, py, r * 0.85 * u(), r * 1.1 * u(), 0, 0, Math.PI * 2)
        c.fill()
        c.stroke()
      }
    } else if (!spr(c, 'scherben', px, sy(0.45), r * 2.6 * u(), r * 1.1 * u(), 0, Math.max(0.35, 1 - sinceHit / 6))) {
      c.fillStyle = '#9a5a2a'
      c.fillRect(px - r * u(), sy(0.4), r * 2 * u(), 0.4 * u())
    }
  } else if (it.kind === 'flag') {
    const waving = st.done
    const sway = waving ? Math.sin(time * 5 + x) * 0.05 : 0
    const i = picOf(waving ? 'fahne-auf' : 'fahne-zu')
    if (i && i.width) {
      // the picture is a pole with the cloth near its top (both pictures have the foot of the pole in the middle): it stands on the ground
      const hTop = y + r * 1.5
      const h = hTop * u()
      const w = (i.width / i.height) * h
      c.save()
      c.translate(px, sy(0))
      c.rotate(sway)
      c.drawImage(i, -w * 0.5, -h, w, h)
      c.restore()
    } else {
      // no picture: a pole and a cloth
      c.strokeStyle = '#6b4a2a'
      c.lineWidth = Math.max(3, u() * 0.16)
      c.beginPath()
      c.moveTo(px, sy(0))
      c.lineTo(px, py - r * u() * 1.2)
      c.stroke()
      c.fillStyle = waving ? '#c8402a' : '#9a5a4a'
      const cw = r * 1.6 * u() * (waving ? 1 : 0.45)
      c.fillRect(px, py - r * u() * 1.2, cw, r * u() * 1.0)
    }
    if (waving && sinceHit < 1.2) {
      c.globalAlpha = 1 - sinceHit / 1.2
      if (glow.complete && glow.naturalWidth) c.drawImage(glow, px - r * u() * 1.6, py - r * u() * 1.6, r * u() * 3.2, r * u() * 3.2)
      c.globalAlpha = 1
    }
  } else if (it.kind === 'switch') {
    const nm = st.done ? 'schalter-an' : 'schalter'
    if (!spr(c, nm, px, py + r * u() * 0.35, r * 2.0 * u(), r * 2.7 * u())) {
      c.fillStyle = st.done ? '#c9a24a' : '#7a5530'
      c.strokeStyle = '#2a1608'
      c.lineWidth = 2
      c.beginPath()
      c.arc(px, py, r * u(), 0, Math.PI * 2)
      c.fill()
      c.stroke()
    }
  }
}

function drawTargetFallback(c: CanvasRenderingContext2D, px: number, py: number, rr: number) {
  const cols = ['#e9dcb4', '#b83a2a', '#e9dcb4', '#d9a82a']
  cols.forEach((col, k) => {
    c.fillStyle = col
    c.beginPath()
    c.arc(px, py, rr * (1 - k * 0.24), 0, Math.PI * 2)
    c.fill()
  })
  c.strokeStyle = '#4a2a10'
  c.lineWidth = 2
  c.beginPath()
  c.arc(px, py, rr, 0, Math.PI * 2)
  c.stroke()
}
function drawBellFallback(c: CanvasRenderingContext2D, px: number, py: number, r: number) {
  c.fillStyle = '#c99a3a'
  c.strokeStyle = '#4a3010'
  c.lineWidth = 2
  c.beginPath()
  c.moveTo(px - r * u() * 0.9, py + r * u() * 0.8)
  c.quadraticCurveTo(px - r * u() * 0.9, py - r * u() * 0.9, px, py - r * u() * 0.9)
  c.quadraticCurveTo(px + r * u() * 0.9, py - r * u() * 0.9, px + r * u() * 0.9, py + r * u() * 0.8)
  c.closePath()
  c.fill()
  c.stroke()
}

function drawArrow(c: CanvasRenderingContext2D, x: number, y: number, ang: number, len = 1.55, alpha = 1) {
  const px = sx(x)
  const py = sy(y)
  const L = len * u()
  const i = picOf('pfeil')
  c.save()
  c.translate(px, py)
  c.rotate(-ang)
  if (alpha < 1) c.globalAlpha = alpha
  if (i && i.width) c.drawImage(i, -L, (-0.17 * u() * len) / 1.55, L * 1.04, ((i.height / i.width) * L * 1.04))
  else {
    c.strokeStyle = '#6a4a2a'
    c.lineWidth = Math.max(2, u() * 0.07)
    c.beginPath()
    c.moveTo(-L, 0)
    c.lineTo(0, 0)
    c.stroke()
    c.fillStyle = '#3a3a3a'
    c.beginPath()
    c.moveTo(0, 0)
    c.lineTo(-u() * 0.3, -u() * 0.11)
    c.lineTo(-u() * 0.3, u() * 0.11)
    c.fill()
    c.fillStyle = '#e9e2cc'
    c.fillRect(-L, -u() * 0.1, u() * 0.3, u() * 0.2)
  }
  c.restore()
}

/** Jonatan with his arms and the bow, drawn for the aim `ang` (degrees) and the pull `pull` (0..1); `ghost` draws it faint. */
function drawArcher(c: CanvasRenderingContext2D, angDeg: number, pull: number, ghost = false, tint = '') {
  const def = g.def
  const ang = (angDeg * Math.PI) / 180
  const ap = aimPoints(def, ang)
  const dirx = Math.cos(ang)
  const diry = Math.sin(ang)
  // after the release the string swings forward and back
  let back = 0.5 + 0.7 * pull
  let nockedArrow = pull > 0 || bow.shotT > bow.cool + 0.05
  if (!ghost && bow.shotT < 0.4) {
    const k = Math.exp(-bow.shotT * 11) * Math.cos(bow.shotT * 46)
    back = 0.5 + 0.7 * bow.shotPull * k
    nockedArrow = false
  }
  if (!ghost && arrowsLeft(g) <= 0) nockedArrow = false
  if (ghost) c.globalAlpha = 0.55
  const recoil = !ghost && bow.shotT < 0.25 ? -Math.exp(-bow.shotT * 14) * 0.08 * bow.shotPull : 0
  // the body
  const hBody = 2.15
  const body = picOf('jonatan')
  const bx = def.archer.x + recoil
  if (body && body.width) {
    const h = hBody * u()
    const w = (body.width / body.height) * h
    c.drawImage(body, sx(bx) - w * 0.5, sy(def.archer.y) - h + 0.04 * u(), w, h)
  } else {
    c.fillStyle = '#c98a3a'
    c.fillRect(sx(bx) - 0.4 * u(), sy(def.archer.y + 1.5), 0.8 * u(), 1.5 * u())
    c.fillStyle = '#d9a37a'
    c.beginPath()
    c.arc(sx(bx), sy(def.archer.y + 1.85), 0.3 * u(), 0, Math.PI * 2)
    c.fill()
  }
  const sh = { x: ap.sx + recoil, y: ap.sy }
  const grip = { x: ap.gx + recoil, y: ap.gy }
  const nock = { x: grip.x - dirx * back, y: grip.y - diry * back }
  const rearSh = { x: sh.x - 0.14, y: sh.y - 0.05 }
  // the bow
  // (the tips: one on each side of the grip, perpendicular to the aim)
  const upTip = { x: grip.x - diry * 1.2 - dirx * 0.2, y: grip.y + dirx * 1.2 - diry * 0.2 }
  const dnTip = { x: grip.x + diry * 1.2 - dirx * 0.2, y: grip.y - dirx * 1.2 - diry * 0.2 }
  const bi = picOf('bogen')
  const bh = 2.5 * u()
  if (!spr(c, 'bogen', sx(grip.x), sy(grip.y), bi && bi.width ? (bi.width / bi.height) * bh : 0.5 * bh, bh, -ang)) {
    c.strokeStyle = tint || '#7a4a22'
    c.lineWidth = Math.max(3, u() * 0.16)
    c.beginPath()
    c.moveTo(sx(upTip.x), sy(upTip.y))
    c.quadraticCurveTo(sx(grip.x + dirx * 0.9), sy(grip.y + diry * 0.9), sx(dnTip.x), sy(dnTip.y))
    c.stroke()
  }
  // the string
  c.strokeStyle = 'rgba(245,238,214,0.95)'
  c.lineWidth = Math.max(1.2, u() * 0.035)
  c.beginPath()
  c.moveTo(sx(upTip.x), sy(upTip.y))
  c.lineTo(sx(nock.x), sy(nock.y))
  c.lineTo(sx(dnTip.x), sy(dnTip.y))
  c.stroke()
  // the arrow on the string
  if (nockedArrow) drawArrow(c, nock.x + dirx * 1.55, nock.y + diry * 1.55, ang, 1.55)
  // the arms
  const arm = picOf('arm')
  const drawArm = (fx: number, fy: number, tx: number, ty: number, th: number) => {
    const ax = sx(fx)
    const ay = sy(fy)
    const bx2 = sx(tx)
    const by2 = sy(ty)
    const len = Math.hypot(bx2 - ax, by2 - ay) + 0.12 * u()
    c.save()
    c.translate(ax, ay)
    c.rotate(Math.atan2(by2 - ay, bx2 - ax))
    if (arm && arm.width) c.drawImage(arm, 0, (-th * u()) / 2, len, th * u())
    else {
      c.fillStyle = '#d9a37a'
      c.fillRect(0, (-th * u()) / 2, len, th * u())
    }
    c.restore()
  }
  drawArm(rearSh.x, rearSh.y, nock.x, nock.y, 0.36)
  drawArm(sh.x, sh.y, grip.x, grip.y, 0.38)
  if (ghost) c.globalAlpha = 1
}

function draw(time: number) {
  const c = ctx
  if (!c || !loaded.value) return
  c.setTransform(dpr, 0, 0, dpr, 0, 0)
  c.fillStyle = '#2a1d12'
  c.fillRect(0, 0, cvW, cvH)
  if (screen.value === 'menu') return
  const chap = LEVELS[level.value]?.chapter ?? 0
  drawBackground(c, chap)
  // the wind: streaks that drift (stronger wind, more and faster)
  drawWindStreaks(c, time)
  drawGround(c, chap)
  const def = g.def

  // wind zones
  if (def.zones)
    for (const z of def.zones) {
      const x0 = sx(z.x0)
      const x1 = sx(z.x1)
      const y0 = sy(Math.min(z.y1, 14))
      const y1 = sy(Math.max(z.y0, 0))
      const grad = c.createLinearGradient(x0, y0, x1, y1)
      grad.addColorStop(0, 'rgba(255,255,255,0.10)')
      grad.addColorStop(1, 'rgba(180,220,255,0.18)')
      c.fillStyle = grad
      c.fillRect(x0, y0, x1 - x0, y1 - y0)
      c.strokeStyle = 'rgba(255,255,255,0.5)'
      c.lineWidth = Math.max(2, u() * 0.08)
      c.setLineDash([u() * 0.5, u() * 0.4])
      const dir = Math.abs(z.wy) > Math.abs(z.wx) ? (z.wy > 0 ? 'up' : 'down') : z.wx > 0 ? 'right' : 'left'
      const n = 6
      for (let k = 0; k < n; k++) {
        const f = ((time * 0.35 + k / n) % 1)
        let ax: number
        let ay: number
        let bx: number
        let by: number
        if (dir === 'up' || dir === 'down') {
          ax = bx = x0 + ((k + 0.5) / n) * (x1 - x0)
          const yy = dir === 'up' ? y1 - f * (y1 - y0) : y0 + f * (y1 - y0)
          ay = yy
          by = yy + (dir === 'up' ? -1 : 1) * u() * 1.6
        } else {
          ay = by = y0 + ((k + 0.5) / n) * (y1 - y0) * 0.9
          const xx = dir === 'right' ? x0 + f * (x1 - x0) : x1 - f * (x1 - x0)
          ax = xx
          bx = xx + (dir === 'right' ? 1 : -1) * u() * 1.6
        }
        c.beginPath()
        c.moveTo(ax, ay)
        c.lineTo(bx, by)
        c.stroke()
      }
      c.setLineDash([])
    }

  // decor: gallows, chains, cairns
  for (const d of def.deco ?? []) {
    if (d.kind === 'gallows') drawGallows(c, d.x, d.h ?? 8, d.w ?? 2.5)
    else if (d.kind === 'chain') drawRope(c, d.x, d.y, d.w!, d.h!, 0.14)
    else if (d.kind === 'cairn') {
      if (!sprH(c, 'steinhaufen', d.x, d.y - 0.1, d.h ?? 2.6, 0, 1, false, 'b')) {
        c.fillStyle = '#8a8478'
        c.beginPath()
        c.moveTo(sx(d.x - (d.w ?? 3) / 2), sy(d.y))
        c.lineTo(sx(d.x), sy(d.y + (d.h ?? 2.6)))
        c.lineTo(sx(d.x + (d.w ?? 3) / 2), sy(d.y))
        c.fill()
      }
    }
  }
  // walls, hills, huts
  for (const p of def.polys) drawPoly(c, p)

  // gates
  if (def.gates)
    for (let i = 0; i < def.gates.length; i++) {
      const q = def.gates[i]!
      const st = g.gates[i]!
      if (st.open && st.off >= q.h) continue
      const top = q.y0 + q.h - st.off
      const bot = Math.max(0, q.y0 - st.off)
      c.save()
      c.beginPath()
      c.rect(sx(q.x - q.w), sy(top) - 1, q.w * 2 * u(), sy(0) - sy(top) + 1)
      c.clip()
      const gi = picOf('tor')
      if (gi && gi.width) c.drawImage(gi, sx(q.x - q.w / 2), sy(top), q.w * u(), (top - (q.y0 - st.off)) * u())
      else {
        c.fillStyle = '#7a5530'
        c.fillRect(sx(q.x - q.w / 2), sy(top), q.w * u(), (top - bot) * u())
      }
      c.strokeStyle = 'rgba(40,24,8,0.8)'
      c.lineWidth = 2
      c.strokeRect(sx(q.x - q.w / 2), sy(top), q.w * u(), (top - (q.y0 - st.off)) * u())
      c.restore()
    }

  // ropes (a cut rope hangs in two pieces)
  if (def.ropes)
    for (let i = 0; i < def.ropes.length; i++) {
      const r = def.ropes[i]!
      const st = g.ropes[i]!
      if (!st.cut) drawRope(c, r.x0, r.y0, r.x1, r.y1, 0.26)
      else {
        const since = g.t - st.cutT
        const k = Math.max(0, 1 - since * 0.5)
        const sway = Math.sin(since * 9) * 0.35 * Math.exp(-since * 2)
        drawRope(c, r.x0, r.y0, r.x0 + (st.cutX - r.x0) * 0.2 + sway * 0.2, r.y0 + (st.cutY - r.y0) * 0.45 * k, 0.26)
      }
    }
  // weights
  if (def.weights)
    for (let i = 0; i < def.weights.length; i++) {
      const w = def.weights[i]!
      const st = g.weights[i]!
      if (!spr(c, 'gewicht', sx(w.x), sy(st.y), w.w * u(), w.h * u() * 1.12)) {
        c.fillStyle = '#7f7f7a'
        c.strokeStyle = '#2a2a28'
        c.lineWidth = 2
        c.fillRect(sx(w.x - w.w / 2), sy(st.y + w.h / 2), w.w * u(), w.h * u())
        c.strokeRect(sx(w.x - w.w / 2), sy(st.y + w.h / 2), w.w * u(), w.h * u())
      }
    }

  // the things to hit
  for (let i = 0; i < def.items.length; i++) drawItem(c, i, time)

  // stuck arrows and flying arrows with their trails
  for (const [id, tr] of trails) {
    if (tr.length < 4) continue
    const a = g.arrows.find((x) => x.id === id)
    const n = tr.length / 2
    for (let k = 1; k < n; k++) {
      const f = k / n
      c.strokeStyle = `rgba(255,250,235,${f * (a?.state === 'fly' ? 0.8 : 0.5)})`
      c.lineWidth = Math.max(1, u() * 0.075 * f)
      c.beginPath()
      c.moveTo(sx(tr[(k - 1) * 2]!), sy(tr[(k - 1) * 2 + 1]!))
      c.lineTo(sx(tr[k * 2]!), sy(tr[k * 2 + 1]!))
      c.stroke()
    }
  }
  for (const a of g.arrows) {
    if (a.state === 'gone') continue
    if (a.state === 'stuck') drawArrow(c, a.x + Math.cos(a.ang) * 0.35, a.y + Math.sin(a.ang) * 0.35, a.ang, 1.55)
    else drawArrow(c, a.x, a.y, Math.atan2(a.vy, a.vx), 1.55)
  }

  // Jonatan
  drawArcher(c, bow.angle, bow.drawn ? bow.pull : 0)

  // the tip: the way of the arrow, and the bow in the aim
  if (tipShot && !pt) {
    const now = Math.abs(g.t - tipShot.at) < 0.35
    c.strokeStyle = now ? 'rgba(120,255,150,0.95)' : 'rgba(255,225,110,0.9)'
    c.lineWidth = Math.max(2, u() * 0.1)
    c.setLineDash([u() * 0.4, u() * 0.3])
    c.beginPath()
    for (let k = 0; k < tipShot.path.length; k += 2) {
      if (k === 0) c.moveTo(sx(tipShot.path[k]!), sy(tipShot.path[k + 1]!))
      else c.lineTo(sx(tipShot.path[k]!), sy(tipShot.path[k + 1]!))
    }
    c.stroke()
    c.setLineDash([])
    drawArcher(c, tipShot.a, tipShot.f, true)
  }

  // the preview of the shot
  if (previewPts.length >= 4) {
    const n = previewPts.length / 2
    for (let k = 0; k < n; k++) {
      const f = 1 - k / n
      c.fillStyle = `rgba(255,255,255,${0.25 + 0.7 * f})`
      c.strokeStyle = 'rgba(60,40,10,0.45)'
      c.lineWidth = 1
      c.beginPath()
      c.arc(sx(previewPts[k * 2]!), sy(previewPts[k * 2 + 1]!), Math.max(2, u() * (0.09 + 0.07 * f)), 0, Math.PI * 2)
      c.fill()
      c.stroke()
    }
  }

  // the pull: the rubber band from where the finger went down
  if (pt && pt.ok) {
    const maxPull = maxPullOf(cvW, cvH)
    c.strokeStyle = 'rgba(255,255,255,0.55)'
    c.lineWidth = 2
    c.setLineDash([6, 6])
    c.beginPath()
    c.arc(pt.x0, pt.y0, maxPull, 0, Math.PI * 2)
    c.stroke()
    c.setLineDash([])
    c.strokeStyle = 'rgba(255,255,255,0.9)'
    c.lineWidth = 3
    c.beginPath()
    c.moveTo(pt.x0, pt.y0)
    c.lineTo(pt.x, pt.y)
    c.stroke()
    c.fillStyle = '#fff1b0'
    c.beginPath()
    c.arc(pt.x0, pt.y0, 7, 0, Math.PI * 2)
    c.fill()
    c.beginPath()
    c.arc(pt.x, pt.y, 10, 0, Math.PI * 2)
    c.fill()
  } else if (pt) {
    c.strokeStyle = 'rgba(255,255,255,0.35)'
    c.lineWidth = 2
    c.beginPath()
    c.arc(pt.x0, pt.y0, MIN_PULL_PX, 0, Math.PI * 2)
    c.stroke()
  }

  // the particles
  for (const p of parts) {
    const k = p.t / p.life
    const px = sx(p.x)
    const py = sy(p.y)
    c.globalAlpha = Math.max(0, 1 - k)
    if (p.kind === 'spark') {
      if (glow.complete && glow.naturalWidth) {
        const s = p.r * u() * (1 - k * 0.4)
        c.drawImage(glow, px - s / 2, py - s / 2, s, s)
      }
    } else if (p.kind === 'ring') {
      c.strokeStyle = '#ffe9a0'
      c.lineWidth = 3
      c.beginPath()
      c.arc(px, py, p.r * u() * (0.4 + k * 2.2), 0, Math.PI * 2)
      c.stroke()
    } else {
      c.save()
      c.translate(px, py)
      c.rotate(p.rot)
      c.fillStyle = p.kind === 'dust' ? '#d9c19a' : p.kind === 'chip' ? '#9a6a3a' : '#c0703a'
      if (p.kind === 'dust') {
        c.globalAlpha = Math.max(0, (1 - k) * 0.6)
        c.beginPath()
        c.arc(0, 0, p.r * u() * (1 + k), 0, Math.PI * 2)
        c.fill()
      } else c.fillRect(-p.r * u(), -p.r * u() * 0.5, p.r * u() * 2, p.r * u())
      c.restore()
    }
    c.globalAlpha = 1
  }

  // an arrow above the picture: a small mark at the top edge
  for (const a of g.arrows) {
    if (a.state !== 'fly') continue
    const py = sy(a.y)
    if (py < 6) {
      const px = Math.max(12, Math.min(cvW - 12, sx(a.x)))
      c.fillStyle = 'rgba(255,250,235,0.9)'
      c.strokeStyle = 'rgba(60,40,10,0.7)'
      c.lineWidth = 2
      c.beginPath()
      c.moveTo(px, 8)
      c.lineTo(px - 9, 26)
      c.lineTo(px + 9, 26)
      c.closePath()
      c.fill()
      c.stroke()
    }
  }
  // the dark edge of the slow motion
  if (timeScale < 1) {
    const vg = c.createRadialGradient(cvW / 2, cvH / 2, Math.min(cvW, cvH) * 0.3, cvW / 2, cvH / 2, Math.max(cvW, cvH) * 0.75)
    vg.addColorStop(0, 'rgba(0,0,0,0)')
    vg.addColorStop(1, 'rgba(20,10,0,0.45)')
    c.fillStyle = vg
    c.fillRect(0, 0, cvW, cvH)
  }
}

/** Light streaks that drift with the wind over the whole picture. */
function drawWindStreaks(c: CanvasRenderingContext2D, time: number) {
  const w = g.def.wind
  if (Math.abs(w) < 0.4) return
  const n = Math.min(14, Math.round(4 + Math.abs(w) * 2.4))
  c.strokeStyle = 'rgba(255,255,255,0.28)'
  c.lineWidth = 2
  c.lineCap = 'round'
  const speed = Math.sign(w) * (0.05 + Math.abs(w) * 0.035)
  for (let i = 0; i < n; i++) {
    const f = (((i * 0.6180339) % 1) + time * speed + 10) % 1
    const x = f * (cvW + 120) - 60
    const y = groundY * (0.15 + ((i * 0.37) % 1) * 0.7)
    const len = 22 + (i % 3) * 14
    c.beginPath()
    c.moveTo(x, y)
    c.lineTo(x + Math.sign(w) * len, y + Math.sin(time * 1.5 + i) * 3)
    c.stroke()
  }
  c.lineCap = 'butt'
}

// ── the page ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const hideBroken = (e: Event) => {
  ;(e.target as HTMLElement).style.display = 'none'
}
const bannerSrc = (cNo: number) => pic(`bg-${cNo + 1}`)
const resultText = computed(() => (outcome.stars > 0 ? t(`app.bigGames.bogen.won${outcome.stars}`) : t('app.bigGames.bogen.lost')))
const isLast = computed(() => level.value === LEVELS.length - 1)
const rewardChapter = computed(() => (LEVELS[level.value]?.index === LEVELS_PER_CHAPTER - 1 && outcome.stars > 0 ? LEVELS[level.value]!.chapter : -1))
const windText = computed(() => {
  const w = hud.wind
  if (Math.abs(w) < 0.3) return '·'
  return (w > 0 ? '→' : '←').repeat(Math.min(4, Math.max(1, Math.round(Math.abs(w) / 1.2))))
})
const windFlagStyle = computed(() => {
  const w = hud.wind
  const k = Math.min(1, Math.abs(w) / 4)
  return { transform: `scaleX(${w < 0 ? -1 : 1}) rotate(${(1 - k) * 14}deg)` }
})
const flagSrc = pic('fahne-auf')
const arrowSrc = pic('pfeil')
const quiver = computed(() => Array.from({ length: hud.supply }, (_, k) => k < hud.left))

function leave() {
  emit('leave')
}

function tryLandscape() {
  try {
    if (!window.matchMedia('(pointer: coarse)').matches) return
    void document.documentElement.requestFullscreen?.().then(() => (screen as unknown as { orientation?: { lock?: (o: string) => Promise<void> } }).orientation?.lock?.('landscape')).catch(() => undefined)
  } catch {
    // not possible here: the player turns the phone
  }
}

function leaveFullscreen() {
  try {
    if (document.fullscreenElement) void document.exitFullscreen()
  } catch {
    // nothing to leave
  }
}

function setProbe() {
  if (window.location.hash.includes('probe=1')) {
    ;(window as unknown as { __bogen?: unknown }).__bogen = {
      get g() {
        return g
      },
      begin,
      shoot: (a: number, f: number) => shoot(g, a, f),
      advance: (sec = 0.05) => {
        advanceGame(g, sec)
        step(0, 0)
      },
      draw: () => draw(performance.now() / 1000),
      cam: () => ({ S, viewW, groundY, camCx, camCy, zoom, cvW, cvH }),
      solution: (n = level.value) => LEVELS[n]!.solution,
      itemPos: (i: number) => itemPos(g.def.items[i]!, g.t, { x: 0, y: 0 }),
      windAt: () => windAt(g.def, 0, 0, { x: 0, y: 0 })
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
  music.playGame('quiet')
  setProbe()
  tryLandscape()
  await loadAll()
  last = performance.now()
  raf = requestAnimationFrame(frame)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  window.clearTimeout(endTimer)
  window.clearTimeout(hintTimer)
  ro?.disconnect()
  music.stop('game')
  window.removeEventListener('resize', layout)
  window.visualViewport?.removeEventListener('resize', layout)
  window.removeEventListener('keydown', onKey)
  document.body.style.overflow = bodyOverflow
  leaveFullscreen()
})
</script>

<template lang="pug">
  div(class="bo")
    canvas(
      ref="canvas"
      class="bo-canvas"
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onCancel"
    )

    div(v-if="!loaded" class="bo-center")
      div(class="bo-spinner")

    //- the overview: the story, the chapters and the levels
    div(v-else-if="screen === 'menu'" class="bo-menu")
      div(class="bo-card")
        h1(class="bo-title") {{ t('app.bigGames.bogen.title') }}
        p(class="bo-text") {{ t('app.bigGames.bogen.story') }}
        p(class="bo-text bo-text--task") {{ t('app.bigGames.bogen.task') }}
        p(v-if="allDone" class="bo-done") {{ t('app.bigGames.bogen.ending.done') }}
        div(v-for="(ct, c) in chapterTexts" :key="c" class="bo-chapter")
          div(class="bo-banner")
            img(:src="bannerSrc(c)" alt="" class="bo-banner-pic" @error="hideBroken")
            div(class="bo-banner-text")
              span(class="bo-ch-name") {{ ct.name }}
              span(class="bo-ch-ref") {{ ct.ref }}
              span(class="bo-ch-stars") ★ {{ chapterStars(c) }} / {{ LEVELS_PER_CHAPTER * 3 }}
          p(class="bo-ch-story") {{ ct.story }}
          div(class="bo-levels")
            button(
              v-for="i in chapterLevels(c)"
              :key="i"
              type="button"
              class="bo-level"
              :data-test="'bogen-level-' + i"
              @click="begin(i)"
            )
              span(class="bo-level-no") {{ i - c * LEVELS_PER_CHAPTER + 1 }}
              AdventureStars(:stars="levelStars[i] ?? 0" :size="13")
        p(class="bo-rules") {{ t('app.bigGames.bogen.starRules') }}
        div(class="bo-menu-buttons")
          AdvButton(tone="blau" small data-test="bogen-how" @click="how = true") {{ t('app.bigGames.bogen.howTitle') }}
          AdvButton(tone="blau" small @click="leave") {{ t('app.bigGames.bogen.leave') }}

    //- the game
    template(v-else-if="screen === 'play'")
      div(class="bo-top")
        div(class="bo-top-btns")
          button(type="button" class="bo-btn" :aria-label="t('app.bigGames.bogen.pause')" data-test="bogen-pause" @click="paused = true") ❚❚
          button(type="button" class="bo-btn" :aria-label="t('app.bigGames.bogen.restart')" data-test="bogen-restart" @click="begin(level)") ↻
          button(type="button" class="bo-btn bo-btn--tip" :aria-label="t('app.bigGames.bogen.tip')" data-test="bogen-tip" :disabled="tipBusy" @click="askTip") 💡
        div(class="bo-info")
          span(class="bo-level-label") {{ levelLabel(level) }} · {{ levelName(level) }}
          div(class="bo-stars-live" :aria-label="t('app.bigGames.bogen.starRules')")
            span(class="bo-star is-on") ★
            span(:class="['bo-star', { 'is-on': hud.s2 }]") ★
            span(:class="['bo-star', { 'is-on': hud.s3 }]") ★
          div(class="bo-quiver" data-test="bogen-arrows" :aria-label="t('app.bigGames.bogen.arrows')")
            img(v-for="(on, k) in quiver" :key="k" :src="arrowSrc" alt="" :class="['bo-q', { 'is-off': !on }]" @error="hideBroken")
            span(class="bo-q-text") {{ t('app.bigGames.bogen.arrows') }} {{ hud.left }} · {{ t('app.bigGames.bogen.goals') }} {{ hud.goals }}/{{ hud.all }}
        div(class="bo-wind" :aria-label="t('app.bigGames.bogen.wind')")
          img(:src="flagSrc" alt="" class="bo-wind-flag" :style="windFlagStyle" @error="hideBroken")
          span(class="bo-wind-text") {{ t('app.bigGames.bogen.wind') }} {{ windText }}
      div(v-if="hintShown" class="bo-tip") {{ hintText }}
      div(v-if="portrait && !paused" class="bo-turn") ⟳ {{ t('app.bigGames.bogen.turn') }}

      div(v-if="paused && !how && chapterCard < 0" class="bo-menu bo-menu--dim")
        div(class="bo-card bo-card--small")
          h2(class="bo-title") {{ t('app.bigGames.bogen.pause') }}
          div(class="bo-btn-row")
            AdvButton(small data-test="bogen-resume" @click="paused = false") {{ t('app.bigGames.bogen.resume') }}
            AdvButton(small tone="blau" data-test="bogen-pause-again" @click="begin(level)") {{ t('app.bigGames.bogen.again') }}
            AdvButton(small tone="blau" data-test="bogen-menu" @click="toMenu") {{ t('app.bigGames.bogen.menu') }}

    //- the end of a round
    div(v-else-if="screen === 'result'" class="bo-menu bo-menu--dim")
      div(class="bo-card bo-card--small")
        h2(class="bo-title") {{ levelLabel(level) }} · {{ levelName(level) }}
        img(v-if="isLast && outcome.stars > 0" :src="pic('abschluss')" alt="" class="bo-result-pic" @error="hideBroken")
        AdventureStars(v-if="outcome.stars > 0" :stars="outcome.stars" :size="56" celebrate)
        p(class="bo-text") {{ resultText }}
        p(v-if="outcome.stars > 0" class="bo-line is-on") {{ t('app.bigGames.bogen.leftLine', { n: outcome.left }) }}
        p(v-if="rewardChapter >= 0 && !isLast" class="bo-line is-on") ✓ {{ chapterTexts[rewardChapter]?.name }}
        template(v-if="isLast && outcome.stars > 0")
          h3(class="bo-sub") {{ t('app.bigGames.bogen.ending.title') }} · {{ t('app.bigGames.bogen.ending.ref') }}
          p(class="bo-text") {{ t('app.bigGames.bogen.ending.text') }}
          p(class="bo-text bo-text--task") {{ t('app.bigGames.bogen.ending.done') }}
        div(class="bo-btn-row")
          AdvButton(v-if="hasNext && outcome.stars > 0" small data-test="bogen-next" @click="begin(level + 1)") {{ t('app.bigGames.bogen.next') }}
          AdvButton(small :tone="hasNext && outcome.stars > 0 ? 'blau' : 'gold'" data-test="bogen-again" @click="begin(level)") {{ t('app.bigGames.bogen.again') }}
          AdvButton(small tone="blau" data-test="bogen-menu" @click="toMenu") {{ t('app.bigGames.bogen.menu') }}

    //- the story of a chapter (once)
    div(v-if="chapterCard >= 0 && loaded && !how" class="bo-menu bo-menu--dim")
      div(class="bo-card bo-card--small")
        img(:src="bannerSrc(chapterCard)" alt="" class="bo-result-pic" @error="hideBroken")
        h2(class="bo-title") {{ chapterTexts[chapterCard]?.name }}
        p(class="bo-ch-ref-line") {{ chapterTexts[chapterCard]?.ref }}
        p(class="bo-text") {{ chapterTexts[chapterCard]?.story }}
        p(class="bo-text bo-text--task") {{ chapterTexts[chapterCard]?.task }}
        AdvButton(data-test="bogen-chapter-go" @click="closeCard") {{ t('app.bigGames.bogen.go') }}

    //- the explanation (once; the button in the overview brings it back)
    div(v-if="how && loaded" class="bo-menu bo-menu--dim")
      div(class="bo-card bo-how")
        h2(class="bo-title") {{ t('app.bigGames.bogen.howTitle') }}
        div(class="bo-how-row")
          span(class="bo-how-sign") ☝
          p(class="bo-how-line") {{ t('app.bigGames.bogen.howPull') }}
        div(class="bo-how-row")
          span(class="bo-how-sign") ➶
          p(class="bo-how-line") {{ t('app.bigGames.bogen.howPower') }}
        div(class="bo-how-row")
          span(class="bo-how-sign") ◎
          p(class="bo-how-line") {{ t('app.bigGames.bogen.howGoal') }}
        AdvButton(data-test="bogen-go" @click="closeHow") {{ t('app.bigGames.bogen.go') }}
</template>

<style scoped lang="sass">
.bo
  position: fixed
  inset: 0
  z-index: 60
  background: #2a1d12
  overflow: hidden
  user-select: none
  -webkit-user-select: none
  touch-action: none

.bo-canvas
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  touch-action: none

.bo-center
  position: absolute
  inset: 0
  display: grid
  place-items: center

.bo-spinner
  width: 46px
  height: 46px
  border-radius: 50%
  border: 5px solid rgba(255, 255, 255, 0.25)
  border-top-color: #f5c84a
  animation: bo-spin 0.9s linear infinite

@keyframes bo-spin
  to
    transform: rotate(360deg)

.bo-menu
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

.bo-card
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
    width: min(440px, 100%)

.bo-title
  margin: 0
  font-size: 1.6rem
  font-weight: 800

.bo-sub
  margin: 0
  font-size: 1.05rem
  font-weight: 800

.bo-text
  margin: 0
  font-size: 1.15rem
  line-height: 1.4

  &--task
    font-weight: 800

.bo-done
  margin: 0
  padding: 8px 12px
  border-radius: 14px
  background: #fff1c2
  font-weight: 800

.bo-rules
  margin: 0
  font-size: 0.85rem
  color: var(--lk-muted, #7a6b4f)

.bo-chapter
  width: 100%
  display: flex
  flex-direction: column
  gap: 8px

.bo-banner
  position: relative
  height: 92px
  border-radius: 16px
  overflow: hidden
  background: #4a3320

.bo-banner-pic
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  object-fit: cover
  object-position: 50% 55%

.bo-banner-text
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

.bo-ch-name
  font-size: 1.05rem
  font-weight: 800

.bo-ch-ref
  font-size: 0.78rem
  font-weight: 600
  opacity: 0.9

.bo-ch-stars
  position: absolute
  right: 12px
  top: 8px
  font-weight: 800
  font-size: 0.9rem
  color: #ffe27a

.bo-ch-story, .bo-ch-ref-line
  margin: 0
  font-size: 0.88rem
  line-height: 1.35
  color: var(--lk-muted, #7a6b4f)
  text-align: left

.bo-levels
  display: grid
  grid-template-columns: repeat(auto-fill, minmax(62px, 1fr))
  gap: 8px
  width: 100%

.bo-level
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

.bo-level-no
  display: grid
  place-items: center
  width: 30px
  height: 30px
  border-radius: 50%
  background: var(--lk-accent, #1f6a6a)
  color: var(--lk-on-accent, #fff)
  font-weight: 800

.bo-btn-row
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 8px
  width: 100%

.bo-menu-buttons
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 10px

.bo-top
  position: absolute
  top: 0
  left: 0
  right: 0
  display: flex
  align-items: flex-start
  gap: 8px
  padding: max(6px, env(safe-area-inset-top)) max(8px, env(safe-area-inset-right)) 0 max(8px, env(safe-area-inset-left))
  pointer-events: none

.bo-top > *
  pointer-events: auto

.bo-top-btns
  display: flex
  gap: 6px

.bo-btn
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

  &:disabled
    opacity: 0.6

.bo-info
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

.bo-level-label
  font-size: 0.82rem
  line-height: 1.15
  white-space: nowrap
  overflow: hidden
  text-overflow: ellipsis
  max-width: 100%

.bo-stars-live
  display: flex
  gap: 1px

.bo-star
  font-size: 1rem
  color: #b9ae96

  &.is-on
    color: #f0a812
    text-shadow: 0 0 6px rgba(255, 210, 80, 0.8)

.bo-quiver
  display: flex
  flex-wrap: wrap
  align-items: center
  justify-content: center
  gap: 2px
  max-width: 100%

.bo-q
  height: 12px
  width: auto

  &.is-off
    opacity: 0.22
    filter: grayscale(1)

.bo-q-text
  font-size: 0.72rem
  font-weight: 700
  color: #6b5a3a
  margin-left: 4px

.bo-wind
  align-self: center
  display: flex
  align-items: center
  gap: 4px
  padding: 4px 8px
  border-radius: 12px
  background: rgba(255, 250, 235, 0.88)
  font-weight: 800
  font-size: 0.8rem
  white-space: nowrap

.bo-wind-flag
  height: 32px
  width: auto
  transform-origin: 20% 90%

.bo-tip
  position: absolute
  left: 50%
  top: 118px
  transform: translateX(-50%)
  max-width: min(520px, 92vw)
  padding: 10px 18px
  border-radius: 18px
  background: rgba(255, 250, 235, 0.95)
  color: #2a2418
  font-weight: 700
  text-align: center
  pointer-events: none

.bo-turn
  position: absolute
  left: 50%
  bottom: max(14px, env(safe-area-inset-bottom))
  transform: translateX(-50%)
  padding: 8px 16px
  border-radius: 16px
  background: rgba(255, 250, 235, 0.92)
  color: #2a2418
  font-weight: 700
  font-size: 0.9rem
  text-align: center
  pointer-events: none

.bo-result-pic
  width: 100%
  max-height: 160px
  object-fit: cover
  border-radius: 14px

.bo-line
  margin: 0
  font-size: 0.92rem
  color: var(--lk-muted, #7a6b4f)

  &.is-on
    color: var(--lk-text, #2a2418)
    font-weight: 700

.bo-how
  gap: 20px

.bo-how-row
  display: flex
  align-items: center
  gap: 16px
  width: 100%

.bo-how-sign
  width: 56px
  flex: none
  font-size: 2.2rem
  text-align: center
  color: #f0a812

.bo-how-line
  margin: 0
  text-align: left
  font-size: 1.2rem
  font-weight: 700
  line-height: 1.3

@media (max-height: 460px)
  .bo-tip
    top: 96px
  .bo-menu--dim
    place-items: start center
  .bo-card
    padding: 12px 14px 12px
    gap: 6px
  .bo-title
    font-size: 1.25rem
  .bo-result-pic
    max-height: 64px

// short screens: the explanation card closer together
@media (max-height: 520px)
  .bo-how
    gap: 8px
  .bo-how-row
    gap: 12px
  .bo-how-sign
    width: 40px
    font-size: 1.5rem
  .bo-how-line
    font-size: 1.05rem
</style>
