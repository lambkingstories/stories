<script setup lang="ts">
/**
 * "Moses Körbchen": the big rope puzzle (rules and physics in `utils/moseKorbGame.ts`, levels in `utils/moseKorbLevels.ts`; this file draws it and takes the touch).
 * The basket of Moses hangs on reed ropes; a swipe cuts them; the basket swings, falls, slides and lands softly in the hands of the daughter of Pharaoh.
 * Nobody can lose: a basket that sinks floats calmly, and the child tries again. The canvas is measured at every touch (a tablet's browser bar slides
 * in and out), and by a ResizeObserver. The pictures are painted by the image model; while one is missing a plain placeholder stands in.
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import useCanvasGuard from '@/use/useCanvasGuard'
import AdvButton from '@/components/atoms/AdvButton.vue'
import AdventureStars from '@/components/molecules/AdventureStars.vue'
import GameIntroBox from '@/components/molecules/games/GameIntroBox.vue'
import useBigGames, { howSeen, markHowSeen } from '@/use/useBigGames'
import useSfx from '@/use/useSfx'
import useMusic from '@/use/useMusic'
import { prependBaseUrl } from '@/utils/function'
import { BASKET_R, H, W, cutAt, ropeHolds, starsOf, step, tap, type Collider, type Game, type GameEvent, type Rope } from '@/utils/moseKorbGame'
import { CHAPTER_COUNT, LEVELS, LEVELS_PER_CHAPTER, levelGame } from '@/utils/moseKorbLevels'

const emit = defineEmits<{ leave: [] }>()
const { t, te, tm, rt } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const music = useMusic()
const progress = useBigGames()
const ID = 'mose'

// ── the pictures ────────────────────────────────────────────────────────────────────────────────────────────────────────────
const NAMES = [
  'korb', 'seil', 'anker', 'libelle', 'lotos-zu', 'lotos-auf', 'papyrus', 'seerose', 'tochter', 'mutter', 'mirjam', 'nest', 'wippe', 'wasserrad', 'ente', 'fisch',
  'schilfwand', 'fels', 'feder', 'faecher', 'tex-schilf', 'tex-fels', 'tex-holz', 'tex-lehm', 'bg-1', 'bg-2', 'bg-3', 'bg-4', 'kachel'
]
const img: Record<string, HTMLImageElement | undefined> = {}
const pat: Record<string, CanvasPattern | null | undefined> = {}
const loaded = ref(false)
const glow = new Image()
glow.src = prependBaseUrl('images/abenteuer/ui/sternglanz.webp')
const pic = (n: string) => prependBaseUrl(`images/spiele-gross/mose/${n}.webp`)

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

/** The plain colours that stand in for a texture or a sprite that is missing. */
const FLAT: Record<string, string> = { reed: '#b9a247', rock: '#9b9082', wood: '#7b5431', clay: '#b98c5c', feder: '#f2ead6' }
const TEX: Record<string, string> = { reed: 'tex-schilf', rock: 'tex-fels', wood: 'tex-holz', clay: 'tex-lehm' }

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
const chapterTexts = computed(() => ((tm('app.bigGames.mose.chapters') as unknown as ChapterText[]) ?? []).map((m) => ({ name: rt(m.name), ref: rt(m.ref), story: rt(m.story), task: rt(m.task) })))
const levelStars = computed(() => progress.levels(ID))
const chapterOf = (i: number) => LEVELS[i]?.chapter ?? 0
const chapterLevels = (c: number) => Array.from({ length: LEVELS_PER_CHAPTER }, (_, k) => c * LEVELS_PER_CHAPTER + k)
const chapterStars = (c: number) => chapterLevels(c).reduce((n, i) => n + (levelStars.value[i] ?? 0), 0)
const chapterDone = (c: number) => chapterLevels(c).every((i) => (levelStars.value[i] ?? 0) >= 1)
const allDone = computed(() => Array.from({ length: CHAPTER_COUNT }, (_, c) => c).every(chapterDone))
const hasNext = computed(() => level.value < LEVELS.length - 1)
const isLast = computed(() => level.value === LEVELS.length - 1)
const levelLabel = (i: number) => `${t('app.bigGames.mose.level')} ${(LEVELS[i]?.index ?? 0) + 1}`

const hud = reactive({ got: [false, false, false], retry: false, retryText: '' })
const outcome = reactive({ stars: 0 })

// ── local memory (chapters seen, hints seen) ────────────────────────────────────────────────────────────────────────────────
const MEM_KEY = 'lk-mose-v1'
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
// the picture of the canvas always has the shape of its box, also after a turn of the phone (see `useCanvasGuard`)
useCanvasGuard(canvas, () => layout())
let ctx: CanvasRenderingContext2D | null = null
let raf = 0
let last = 0
let dpr = 1
let cvW = 1
let cvH = 1
/** The pixels per world unit and the place of the world's top left corner on the canvas. */
let sc = 1
let ox = 0
let oy = 0
const land = ref(false)
let ro: ResizeObserver | null = null
let clock = 0

/** The little effects: drops, fibres, sparks, rings, hearts, petals (a pool: nothing is created while playing). */
interface Part {
  on: boolean
  kind: 0 | 1 | 2 | 3 | 4 | 5
  x: number
  y: number
  vx: number
  vy: number
  t: number
  life: number
  r: number
}
const parts: Part[] = Array.from({ length: 200 }, () => ({ on: false, kind: 0, x: 0, y: 0, vx: 0, vy: 0, t: 0, life: 1, r: 1 }))
let partAt = 0
function spawn(kind: Part['kind'], x: number, y: number, vx: number, vy: number, life: number, r: number) {
  for (let k = 0; k < parts.length; k++) {
    const p = parts[(partAt + k) % parts.length]!
    if (!p.on) {
      partAt = (partAt + k + 1) % parts.length
      p.on = true
      p.kind = kind
      p.x = x
      p.y = y
      p.vx = vx
      p.vy = vy
      p.t = 0
      p.life = life
      p.r = r
      return
    }
  }
}
let rngState = 7777
const rand = () => {
  rngState = (rngState * 1664525 + 1013904223) >>> 0
  return rngState / 4294967296
}

/** The swipe track: the last points with their age. */
const TRAIL = 28
const trail = Array.from({ length: TRAIL }, () => ({ x: 0, y: 0, t: -9 }))
let trailAt = 0
function trailPush(x: number, y: number) {
  const p = trail[trailAt]!
  p.x = x
  p.y = y
  p.t = clock
  trailAt = (trailAt + 1) % TRAIL
}

const bloomT = [-9, -9, -9]
let celT = -1
let sqT = 9
let sqAmp = 0
let endTimer = 0
let retryTimer = 0
let tipUntil = 0
let tipRopeId = -1
let ending = false

function begin(i: number) {
  level.value = i
  g = levelGame(i)
  for (const p of parts) p.on = false
  for (const p of trail) p.t = -9
  bloomT[0] = bloomT[1] = bloomT[2] = -9
  celT = -1
  sqT = 9
  tipUntil = 0
  ending = false
  window.clearTimeout(endTimer)
  window.clearTimeout(retryTimer)
  hud.retry = false
  hud.got = [false, false, false]
  screen.value = 'play'
  const L = LEVELS[i]!
  pendingCard = L.index === 0 && !mem.chapters[L.chapter] ? L.chapter : -1
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
  chapterCard.value = screen.value === 'play' ? pendingCard : -1
  paused.value = chapterCard.value >= 0
  if (!paused.value && screen.value === 'play') hintOnce(LEVELS[level.value]?.intro)
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
  window.clearTimeout(retryTimer)
}

function say(text: string, ms = 6500) {
  hintText.value = text
  hintShown.value = true
  window.clearTimeout(hintTimer)
  hintTimer = window.setTimeout(() => (hintShown.value = false), ms)
}

function hintOnce(intro: string | undefined) {
  if (!intro || mem.hints[intro]) return
  const key = `app.bigGames.mose.hint.${intro}`
  if (!te(key)) return
  mem.hints[intro] = true
  saveMem()
  say(t(key), 8000)
}

/** The tip: a pulsing ring at the rope that is cut first (the first cut of the stored way that still holds). */
function showTip() {
  if (screen.value !== 'play' || g.status !== 'play') return
  const cuts = LEVELS[level.value]?.solutions[0]?.cuts ?? []
  const c = cuts.find((x) => ropeHolds(g, x.rope))
  if (!c) return
  tipRopeId = c.rope
  tipUntil = clock + 5
  paused.value = false
  say(t('app.bigGames.mose.tipShown'), 4000)
}

// ── the events of the rules: sounds and effects ─────────────────────────────────────────────────────────────────────────────
function onEvents() {
  for (const e of g.events as GameEvent[]) {
    if (e.t === 'cut') {
      play('snap', 0.85)
      navigator.vibrate?.(10)
      for (let k = 0; k < 7; k++) spawn(1, e.x, e.y, (rand() - 0.5) * 120, (rand() - 0.2) * 90, 0.5 + rand() * 0.3, 1.5 + rand() * 1.5)
      spawn(2, e.x, e.y, 0, 0, 0.35, 22)
    } else if (e.t === 'star') {
      play('star')
      bloomT[e.i] = clock
      hud.got = g.got.slice()
      for (let k = 0; k < 9; k++) spawn(5, e.x, e.y, (rand() - 0.5) * 150, -rand() * 120, 0.7 + rand() * 0.4, 3 + rand() * 2)
      spawn(2, e.x, e.y, 0, 0, 0.6, 46)
    } else if (e.t === 'bubble') {
      play('bead', 0.8)
    } else if (e.t === 'pop') {
      play('tap', 0.8)
      spawn(3, e.x, e.y, 0, 0, 0.4, 14)
      for (let k = 0; k < 10; k++) {
        const a = rand() * Math.PI * 2
        spawn(0, e.x + Math.cos(a) * 20, e.y + Math.sin(a) * 20, Math.cos(a) * 80, Math.sin(a) * 80, 0.45, 2.2)
      }
    } else if (e.t === 'fan') {
      play('flip', 0.7)
    } else if (e.t === 'bounce') {
      play('basket', Math.min(1, e.speed / 500))
      sqT = 0
      sqAmp = Math.min(0.32, e.speed / 1800)
      for (let k = 0; k < 6; k++) spawn(2, e.x + (rand() - 0.5) * 30, e.y + 14, (rand() - 0.5) * 60, -rand() * 50, 0.4, 8)
    } else if (e.t === 'land') {
      play('sack', Math.min(1, e.speed / 600))
      sqT = 0
      sqAmp = Math.min(0.28, e.speed / 2000)
    } else if (e.t === 'splash') {
      play('wrong', 0.3)
      spawn(3, e.x, e.y, 0, 0, 0.9, 30)
      spawn(3, e.x, e.y, 0, 0, 1.3, 50)
      for (let k = 0; k < 16; k++) spawn(0, e.x + (rand() - 0.5) * 20, e.y, (rand() - 0.5) * 140, -120 - rand() * 160, 0.8, 2 + rand() * 2)
      window.clearTimeout(retryTimer)
      retryTimer = window.setTimeout(() => {
        if (screen.value !== 'play') return
        hud.retryText = t('app.bigGames.mose.splash')
        hud.retry = true
      }, 900)
    } else if (e.t === 'caught') {
      play('found')
      celT = 0
      const tg = g.def.target
      for (let k = 0; k < 14; k++) spawn(k % 2 ? 4 : 2, tg.x + (rand() - 0.5) * 40, tg.y, (rand() - 0.5) * 90, -40 - rand() * 90, 1.2 + rand() * 0.6, k % 2 ? 11 : 20)
    } else if (e.t === 'win') {
      play('fanfare')
      finish()
    }
  }
  g.events.length = 0
}

function finish() {
  if (ending) return
  ending = true
  outcome.stars = starsOf(g)
  progress.record(ID, level.value, outcome.stars)
  window.clearTimeout(endTimer)
  endTimer = window.setTimeout(() => {
    if (screen.value !== 'play') return
    screen.value = 'result'
    play('result')
  }, 1300)
}

// ── the touch (the canvas is measured at every touch) ───────────────────────────────────────────────────────────────────────
const live = () => screen.value === 'play' && !paused.value && g.status === 'play'
let sw: { x0: number; y0: number; lx: number; ly: number; moved: boolean } | null = null

/** A touch as a point of the world (the real size of the canvas now, not the one of the last resize). */
function pos(e: PointerEvent): { x: number; y: number } {
  const c = canvas.value!
  const r = c.getBoundingClientRect()
  const kx = r.width > 0 ? cvW / r.width : 1
  const ky = r.height > 0 ? cvH / r.height : 1
  return { x: ((e.clientX - r.left) * kx - ox) / sc, y: ((e.clientY - r.top) * ky - oy) / sc }
}
function onDown(e: PointerEvent) {
  if (!live()) return
  ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
  const p = pos(e)
  sw = { x0: p.x, y0: p.y, lx: p.x, ly: p.y, moved: false }
  trailPush(p.x, p.y)
}
function onMove(e: PointerEvent) {
  if (!sw || !live()) return
  const p = pos(e)
  if (Math.hypot(p.x - sw.x0, p.y - sw.y0) * sc > 7) sw.moved = true
  if (sw.moved) {
    cutAt(g, sw.lx, sw.ly, p.x, p.y)
    trailPush(p.x, p.y)
  }
  sw.lx = p.x
  sw.ly = p.y
}
function onUp(e: PointerEvent) {
  const s = sw
  sw = null
  if (!s || !live()) return
  if (!s.moved) {
    const p = pos(e)
    if (!tap(g, p.x, p.y)) cutAt(g, p.x, p.y, p.x, p.y)
  }
}
function onCancel() {
  sw = null
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
  land.value = cvW > cvH * 1.05
  if (land.value) {
    sc = (cvH - 8) / H
    ox = (cvW - W * sc) / 2
    oy = 4
  } else {
    sc = Math.min(cvW / W, (cvH - 78) / H)
    ox = (cvW - W * sc) / 2
    oy = cvH - H * sc - 2
  }
}

function frame(now: number) {
  raf = requestAnimationFrame(frame)
  const dt = Math.min(0.05, (now - last) / 1000 || 0)
  last = now
  advance(dt)
  draw(now / 1000)
}

function advance(dt: number) {
  clock += dt
  if (screen.value !== 'play') return
  if (!paused.value) {
    step(g, dt)
    if (celT >= 0) celT += dt
    sqT += dt
    for (const p of parts) {
      if (!p.on) continue
      p.t += dt
      if (p.t > p.life) {
        p.on = false
        continue
      }
      p.x += p.vx * dt
      p.y += p.vy * dt
      if (p.kind === 0 || p.kind === 1 || p.kind === 5) p.vy += 420 * dt
      else if (p.kind === 4) p.vy -= 30 * dt
    }
  }
  onEvents()
  if (g.stuck && g.status === 'play' && !hud.retry) {
    hud.retryText = t('app.bigGames.mose.stuck')
    hud.retry = true
  } else if (!g.stuck && g.status === 'play' && hud.retry) hud.retry = false
}

// ── drawing ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
/** A picture centred at (x, y), `w` wide (the height follows its shape). */
function spr(c: CanvasRenderingContext2D, name: string, x: number, y: number, w: number): boolean {
  const i = img[name]
  if (!i) return false
  c.drawImage(i, x - w / 2, y - (w * i.height) / i.width / 2, w, (w * i.height) / i.width)
  return true
}
/** A picture standing on a line: centred at x, its lower edge at `by`, `h` high. */
function sprB(c: CanvasRenderingContext2D, name: string, x: number, by: number, h: number): boolean {
  const i = img[name]
  if (!i) return false
  const wd = (i.width / i.height) * h
  c.drawImage(i, x - wd / 2, by - h, wd, h)
  return true
}

function drawBg(c: CanvasRenderingContext2D, chap: number) {
  const bg = img[`bg-${chap + 1}`]
  if (bg) {
    const k = Math.max(cvW / bg.width, cvH / bg.height)
    const wd = bg.width * k
    const ht = bg.height * k
    c.drawImage(bg, (cvW - wd) / 2, cvH - ht, wd, ht)
  } else {
    const grad = c.createLinearGradient(0, 0, 0, cvH)
    const sky = [['#f6e0a8', '#cfe3d0'], ['#cfe6c4', '#9cc7a0'], ['#bfe0f0', '#e8f2ea'], ['#f2ddb0', '#c8dfa8']][chap] ?? ['#f6e0a8', '#cfe3d0']
    grad.addColorStop(0, sky[0]!)
    grad.addColorStop(1, sky[1]!)
    c.fillStyle = grad
    c.fillRect(0, 0, cvW, cvH)
  }
}

function drawWall(c: CanvasRenderingContext2D, w: Collider) {
  const kind = w.kind
  if (kind === 'feder') {
    const len = Math.hypot(w.x2 - w.x1, w.y2 - w.y1) + w.t * 2
    c.save()
    c.translate((w.x1 + w.x2) / 2, (w.y1 + w.y2) / 2)
    c.rotate(Math.atan2(w.y2 - w.y1, w.x2 - w.x1))
    const i = img['feder']
    if (i) c.drawImage(i, -len / 2, -w.t - 7, len, w.t * 2 + 14)
    else {
      c.fillStyle = FLAT.feder!
      c.strokeStyle = '#c8b894'
      c.lineWidth = 2
      c.beginPath()
      c.roundRect(-len / 2, -w.t - 3, len, w.t * 2 + 6, 8)
      c.fill()
      c.stroke()
    }
    c.restore()
    return
  }
  const fill = pat[TEX[kind] ?? 'tex-holz'] ?? FLAT[kind] ?? '#888'
  const round = w.x1 === w.x2 && w.y1 === w.y2
  c.lineCap = 'round'
  c.lineJoin = 'round'
  if (round) {
    c.fillStyle = 'rgba(50,30,10,0.55)'
    c.beginPath()
    c.arc(w.x1, w.y1, w.t + 1.6, 0, Math.PI * 2)
    c.fill()
    c.fillStyle = fill
    c.beginPath()
    c.arc(w.x1, w.y1, w.t, 0, Math.PI * 2)
    c.fill()
    return
  }
  c.strokeStyle = 'rgba(50,30,10,0.55)'
  c.lineWidth = w.t * 2 + 3.2
  c.beginPath()
  c.moveTo(w.x1, w.y1)
  c.lineTo(w.x2, w.y2)
  c.stroke()
  c.strokeStyle = fill
  c.lineWidth = w.t * 2
  c.stroke()
  // a light edge on the upper side
  const dx = w.x2 - w.x1
  const dy = w.y2 - w.y1
  const l = Math.hypot(dx, dy) || 1
  let nx = dy / l
  let ny = -dx / l
  if (ny > 0) {
    nx = -nx
    ny = -ny
  }
  c.strokeStyle = 'rgba(255,240,200,0.4)'
  c.lineWidth = 1.6
  c.beginPath()
  c.moveTo(w.x1 + nx * (w.t - 1), w.y1 + ny * (w.t - 1))
  c.lineTo(w.x2 + nx * (w.t - 1), w.y2 + ny * (w.t - 1))
  c.stroke()
}

function drawRope(c: CanvasRenderingContext2D, r: Rope) {
  const pts = r.pts
  const seil = img['seil']
  if (r.fade < 1) c.globalAlpha = Math.max(0, r.fade)
  if (seil) {
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i]!
      const b = pts[i + 1]!
      const len = Math.hypot(b.x - a.x, b.y - a.y) + 3
      c.save()
      c.translate((a.x + b.x) / 2, (a.y + b.y) / 2)
      c.rotate(Math.atan2(b.y - a.y, b.x - a.x))
      c.drawImage(seil, -len / 2, -3.4, len, 6.8)
      c.restore()
    }
  } else {
    c.lineCap = 'round'
    c.lineJoin = 'round'
    c.beginPath()
    c.moveTo(pts[0]!.x, pts[0]!.y)
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i]!.x, pts[i]!.y)
    c.strokeStyle = '#6a4a22'
    c.lineWidth = 5.4
    c.stroke()
    c.strokeStyle = '#d6b56a'
    c.lineWidth = 3
    c.stroke()
    c.strokeStyle = 'rgba(110,78,30,0.8)'
    c.lineWidth = 1
    c.setLineDash([2.5, 3.5])
    c.stroke()
    c.setLineDash([])
  }
  c.globalAlpha = 1
}

function drawAnchor(c: CanvasRenderingContext2D, x: number, y: number) {
  if (spr(c, 'anker', x, y, 22)) return
  c.fillStyle = '#6a4a22'
  c.beginPath()
  c.arc(x, y, 6.5, 0, Math.PI * 2)
  c.fill()
  c.fillStyle = '#d6b56a'
  c.beginPath()
  c.arc(x, y, 3.2, 0, Math.PI * 2)
  c.fill()
}

function drawBasket(c: CanvasRenderingContext2D, time: number) {
  const b = g.basket
  let x = b.x
  let y = b.y
  let tilt = b.tilt
  if (g.status === 'splash') {
    // floats calmly
    y = Math.min(y, g.waterY - 6) + Math.sin(time * 2.2) * 2
    tilt = Math.sin(time * 1.6) * 0.12
  }
  // soft landing: squash and a little spring back
  let kx = 1
  let ky = 1
  if (sqT < 0.7) {
    const s = sqAmp * Math.exp(-7 * sqT) * Math.cos(26 * sqT)
    kx = 1 + s
    ky = 1 - s
  }
  c.save()
  c.translate(x, y + BASKET_R * 0.55)
  c.rotate(tilt)
  c.scale(kx, ky)
  const w = BASKET_R * 2.7
  if (!spr(c, 'korb', 0, -BASKET_R * 0.55, w)) {
    c.fillStyle = '#b08a48'
    c.strokeStyle = '#5c4020'
    c.lineWidth = 2
    c.beginPath()
    c.ellipse(0, -BASKET_R * 0.2, BASKET_R * 1.15, BASKET_R * 0.8, 0, 0, Math.PI * 2)
    c.fill()
    c.stroke()
    c.fillStyle = '#f6ecd6'
    c.beginPath()
    c.arc(0, -BASKET_R * 0.85, BASKET_R * 0.5, Math.PI, 0)
    c.fill()
    c.stroke()
  }
  c.restore()
}

function drawLotus(c: CanvasRenderingContext2D, i: number, time: number) {
  const s = g.def.stars[i]!
  const bt = bloomT[i]!
  if (!g.got[i]) {
    const bob = Math.sin(time * 2 + i) * 2
    if (glow.complete && glow.naturalWidth) {
      c.globalAlpha = 0.45 + 0.25 * Math.sin(time * 3 + i)
      c.drawImage(glow, s.x - 24, s.y - 24 + bob, 48, 48)
      c.globalAlpha = 1
    }
    if (!spr(c, 'lotos-zu', s.x, s.y + bob, 28)) {
      c.fillStyle = '#f2c6d6'
      c.strokeStyle = '#b86a86'
      c.lineWidth = 1.6
      c.beginPath()
      c.ellipse(s.x, s.y + bob, 8, 12, 0, 0, Math.PI * 2)
      c.fill()
      c.stroke()
    }
  } else if (clock - bt < 0.9) {
    const k = (clock - bt) / 0.9
    c.globalAlpha = 1 - k * k
    const w = 28 + 30 * Math.min(1, k * 2.2)
    if (!spr(c, 'lotos-auf', s.x, s.y - k * 14, w)) {
      c.fillStyle = '#f7d2dc'
      c.beginPath()
      c.arc(s.x, s.y - k * 14, w / 2, 0, Math.PI * 2)
      c.fill()
    }
    c.globalAlpha = 1
  }
}

function drawBubble(c: CanvasRenderingContext2D, i: number, time: number) {
  const b = g.bubbles[i]!
  if (b.state === 'popped') return
  const r = b.r * (1 + Math.sin(time * 3 + i) * 0.03)
  const grad = c.createRadialGradient(b.x - r * 0.3, b.y - r * 0.35, r * 0.1, b.x, b.y, r)
  grad.addColorStop(0, 'rgba(255,255,255,0.55)')
  grad.addColorStop(0.7, 'rgba(190,230,255,0.22)')
  grad.addColorStop(1, 'rgba(160,215,250,0.5)')
  c.fillStyle = grad
  c.beginPath()
  c.arc(b.x, b.y, r, 0, Math.PI * 2)
  c.fill()
  c.strokeStyle = 'rgba(255,255,255,0.8)'
  c.lineWidth = 1.6
  c.stroke()
  c.fillStyle = 'rgba(255,255,255,0.85)'
  c.beginPath()
  c.ellipse(b.x - r * 0.38, b.y - r * 0.45, r * 0.2, r * 0.11, -0.7, 0, Math.PI * 2)
  c.fill()
  if (b.state === 'carry') {
    c.strokeStyle = `rgba(255,255,255,${0.35 + 0.3 * Math.sin(time * 6)})`
    c.lineWidth = 2
    c.beginPath()
    c.arc(b.x, b.y, r + 5, 0, Math.PI * 2)
    c.stroke()
  }
}

function drawRotor(c: CanvasRenderingContext2D, ri: number) {
  const r = g.rotors[ri]!
  const d = r.def
  if (d.kind === 'wheel') {
    let reach = 20
    for (const s of d.segs) reach = Math.max(reach, Math.hypot(s.x2, s.y2), Math.hypot(s.x1, s.y1))
    const i = img['wasserrad']
    if (i) {
      c.save()
      c.translate(d.x, d.y)
      c.rotate(r.angle)
      c.drawImage(i, -reach - 6, -reach - 6, (reach + 6) * 2, (reach + 6) * 2)
      c.restore()
      return
    }
    for (const w of r.cols) drawWall(c, w)
    return
  }
  for (const w of r.cols) drawWall(c, w)
  const i = img['wippe']
  if (i && d.kind === 'seesaw') {
    // the support under the pivot (the lower part of the picture)
    const wd = 46
    const hh = (wd * i.height) / i.width
    c.drawImage(i, 0, i.height * 0.45, i.width, i.height * 0.55, d.x - wd / 2, d.y + 2, wd, hh * 0.55)
  } else drawAnchor(c, d.x, d.y)
}

function drawMover(c: CanvasRenderingContext2D, mi: number, time: number) {
  const m = g.movers[mi]!
  const d = m.def
  const bob = Math.sin(time * 3 + mi * 2) * 1.6
  const name = d.kind === 'duck' ? 'ente' : 'fisch'
  const i = img[name]
  const dir = m.vx < -2 ? -1 : 1
  c.save()
  c.translate(m.x, m.y + bob)
  c.scale(dir, 1)
  if (i) {
    const wd = d.hw * 2.5
    const ht = (wd * i.height) / i.width
    const tilt = d.kind === 'fish' ? Math.atan2(m.vy, Math.abs(m.vx) + 30) * 0.8 : 0
    c.rotate(tilt)
    c.drawImage(i, -wd / 2, -ht * 0.45, wd, ht)
  } else {
    c.fillStyle = d.kind === 'duck' ? '#d8b878' : '#8fb8a8'
    c.strokeStyle = '#5c4020'
    c.lineWidth = 1.6
    c.beginPath()
    c.ellipse(0, 6, d.hw * 1.05, 11, 0, 0, Math.PI * 2)
    c.fill()
    c.stroke()
  }
  c.restore()
}

function drawFan(c: CanvasRenderingContext2D, fi: number, time: number) {
  const f = g.fans[fi]!
  const ang = f.def.angle + Math.PI / 2 + (f.on > 0 ? Math.sin(time * 26) * 0.22 : 0)
  c.save()
  c.translate(f.def.x, f.def.y)
  c.rotate(ang)
  if (!spr(c, 'faecher', 0, -6, 52)) {
    c.fillStyle = '#f6f0e0'
    c.strokeStyle = '#9a8a60'
    c.lineWidth = 2
    c.beginPath()
    c.arc(0, -10, 20, Math.PI, 0)
    c.closePath()
    c.fill()
    c.stroke()
  }
  c.restore()
  if (f.on > 0) {
    const ca = Math.cos(f.def.angle)
    const sa = Math.sin(f.def.angle)
    c.strokeStyle = 'rgba(255,255,255,0.7)'
    c.lineWidth = 2
    c.lineCap = 'round'
    c.beginPath()
    for (let k = 0; k < 7; k++) {
      const off = ((time * 260 + k * 37) % 170) + 18
      const side = ((k * 29) % 46) - 23
      const x0 = f.def.x + ca * off - sa * side
      const y0 = f.def.y + sa * off + ca * side
      c.moveTo(x0, y0)
      c.lineTo(x0 + ca * 22, y0 + sa * 22)
    }
    c.stroke()
  }
}

function drawFigures(c: CanvasRenderingContext2D, time: number) {
  const tg = g.def.target
  const hop = celT >= 0 ? Math.abs(Math.sin(celT * 9)) * 9 * Math.min(1, celT * 3) : 0
  const sway = celT >= 0 ? Math.sin(celT * 8) * 0.06 : 0
  // the ones that cheer
  for (const ch of g.def.cheer ?? []) {
    const name = ch.who === 'mutter' ? 'mutter' : 'mirjam'
    c.save()
    c.translate(ch.x, ch.y - hop)
    c.rotate(sway)
    if (!sprB(c, name, 0, 0, 84)) {
      c.fillStyle = ch.who === 'mutter' ? '#6a86a8' : '#b8a888'
      c.beginPath()
      c.ellipse(0, -34, 16, 34, 0, 0, Math.PI * 2)
      c.fill()
      c.fillStyle = '#e8c8a0'
      c.beginPath()
      c.arc(0, -72, 9, 0, Math.PI * 2)
      c.fill()
    }
    c.restore()
  }
  // the one who catches
  if (tg.figure === 'nest') {
    if (!spr(c, 'nest', tg.x, tg.y + 14, tg.r * 2.6)) {
      c.fillStyle = '#b8a050'
      c.strokeStyle = '#6a5428'
      c.lineWidth = 2
      c.beginPath()
      c.ellipse(tg.x, tg.y + 16, tg.r * 1.25, tg.r * 0.55, 0, 0, Math.PI)
      c.fill()
      c.stroke()
    }
  } else {
    const dir = tg.x > W / 2 ? 1 : -1
    const fx = Math.max(34, Math.min(W - 34, tg.x + dir * 30))
    const name = tg.figure === 'tochter' ? 'tochter' : 'mirjam'
    c.save()
    c.translate(fx, tg.y + 30 - hop * 0.6)
    c.rotate(sway * 0.5)
    // the painted figure faces right with her arms out: on the right bank she turns to the basket
    if (dir > 0) c.scale(-1, 1)
    if (!sprB(c, name, 0, 0, 104)) {
      c.fillStyle = tg.figure === 'tochter' ? '#f2ecd8' : '#c8b898'
      c.strokeStyle = '#8a7a50'
      c.lineWidth = 2
      c.beginPath()
      c.ellipse(0, -44, 18, 44, 0, 0, Math.PI * 2)
      c.fill()
      c.stroke()
      c.fillStyle = '#e8c8a0'
      c.beginPath()
      c.arc(0, -92, 11, 0, Math.PI * 2)
      c.fill()
    }
    c.restore()
  }
  void time
}

function drawParts(c: CanvasRenderingContext2D) {
  for (const p of parts) {
    if (!p.on) continue
    const k = p.t / p.life
    if (p.kind === 0) {
      c.globalAlpha = (1 - k) * 0.9
      c.fillStyle = '#e8f6ff'
      c.beginPath()
      c.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      c.fill()
    } else if (p.kind === 1) {
      c.globalAlpha = 1 - k
      c.fillStyle = '#b8924a'
      c.fillRect(p.x, p.y, p.r * 2, p.r * 0.8)
    } else if (p.kind === 2) {
      if (glow.complete && glow.naturalWidth) {
        c.globalAlpha = 1 - k
        const s = p.r * (1 + k * 0.5)
        c.drawImage(glow, p.x - s / 2, p.y - s / 2, s, s)
      }
    } else if (p.kind === 3) {
      c.globalAlpha = (1 - k) * 0.8
      c.strokeStyle = '#ffffff'
      c.lineWidth = 1.6
      c.beginPath()
      c.ellipse(p.x, p.y, p.r * (0.3 + k * 1.2), p.r * (0.3 + k * 1.2) * 0.35, 0, 0, Math.PI * 2)
      c.stroke()
    } else if (p.kind === 4) {
      c.globalAlpha = 1 - k
      c.fillStyle = '#e8506a'
      c.font = `${p.r}px sans-serif`
      c.fillText('♥', p.x, p.y)
    } else {
      c.globalAlpha = 1 - k
      c.fillStyle = '#f7bfd0'
      c.beginPath()
      c.ellipse(p.x, p.y, p.r, p.r * 0.6, p.t * 4, 0, Math.PI * 2)
      c.fill()
    }
  }
  c.globalAlpha = 1
}

function drawWater(c: CanvasRenderingContext2D, time: number) {
  const top = oy + (g.waterY - 12) * sc
  if (top > cvH) return
  const grad = c.createLinearGradient(0, top, 0, cvH)
  grad.addColorStop(0, 'rgba(112,184,196,0.82)')
  grad.addColorStop(0.35, 'rgba(58,134,160,0.9)')
  grad.addColorStop(1, 'rgba(30,86,116,0.95)')
  c.fillStyle = grad
  c.beginPath()
  c.moveTo(0, cvH)
  for (let x = 0; x <= cvW + 12; x += 12) c.lineTo(x, top + Math.sin(x * 0.045 + time * 1.7) * 3 + Math.sin(x * 0.11 - time * 1.1) * 1.6)
  c.lineTo(cvW, cvH)
  c.closePath()
  c.fill()
  // light lines and sparkles
  c.strokeStyle = 'rgba(255,255,255,0.35)'
  c.lineWidth = 1.5
  for (let row = 0; row < 3; row++) {
    const y = top + 14 * sc * (row + 1) * 0.9
    if (y > cvH) break
    c.beginPath()
    for (let x = 0; x <= cvW + 10; x += 10) {
      const yy = y + Math.sin(x * 0.06 + time * (1.2 + row * 0.4) + row * 2) * 2.2
      if (x === 0) c.moveTo(x, yy)
      else c.lineTo(x, yy)
    }
    c.stroke()
  }
  c.fillStyle = 'rgba(255,255,255,0.8)'
  for (let k = 0; k < 9; k++) {
    const sx = ((k * 83.7 + time * 6) % cvW)
    const sy = top + 8 + ((k * 41) % 30) * sc
    if (Math.sin(time * 2.4 + k * 1.7) > 0.55) c.fillRect(sx, sy, 2.4, 2.4)
  }
}

function draw(time: number) {
  const c = ctx
  if (!c || !loaded.value) return
  c.setTransform(dpr, 0, 0, dpr, 0, 0)
  c.fillStyle = '#cfe3d0'
  c.fillRect(0, 0, cvW, cvH)
  if (screen.value === 'menu') return
  const chap = LEVELS[level.value]?.chapter ?? 0
  drawBg(c, chap)

  // the world
  c.save()
  c.translate(ox, oy)
  c.scale(sc, sc)

  // the decoration far behind: papyrus at the banks, lily pads, dragonflies
  c.globalAlpha = 0.6
  sprB(c, 'papyrus', 20, g.waterY + 10, 130)
  sprB(c, 'papyrus', W - 20, g.waterY + 10, 130)
  c.globalAlpha = 1
  spr(c, 'seerose', 70, g.waterY + 4 + Math.sin(time * 1.3) * 1, 46)
  spr(c, 'seerose', 290, g.waterY + 8 + Math.sin(time * 1.1 + 1) * 1, 40)
  for (let k = 0; k < 2; k++) {
    const x = W / 2 + Math.sin(time * 0.5 + k * 3) * 120
    const y = 150 + k * 90 + Math.sin(time * 0.9 + k * 2) * 24
    c.save()
    c.translate(x, y)
    c.scale(Math.cos(time * 0.5 + k * 3) > 0 ? 1 : -1, 1)
    c.globalAlpha = 0.9
    spr(c, 'libelle', 0, 0, 26 + Math.sin(time * 40) * 1.2)
    c.restore()
  }

  for (const w of g.statics) drawWall(c, w)
  for (let i = 0; i < g.rotors.length; i++) drawRotor(c, i)
  for (let i = 0; i < g.movers.length; i++) drawMover(c, i, time)
  drawFigures(c, time)
  for (let i = 0; i < g.fans.length; i++) drawFan(c, i, time)
  for (let i = 0; i < g.def.stars.length; i++) drawLotus(c, i, time)

  // the tip: a pulsing ring at the rope to cut first
  if (clock < tipUntil) {
    const r = g.ropes.find((q) => q.live && q.id === tipRopeId)
    if (r) {
      const m = r.pts[Math.floor(r.pts.length / 2)]!
      const pulse = 0.5 + 0.5 * Math.sin(clock * 7)
      c.strokeStyle = `rgba(255,214,90,${0.6 + 0.4 * pulse})`
      c.lineWidth = 3
      c.beginPath()
      c.arc(m.x, m.y, 16 + pulse * 6, 0, Math.PI * 2)
      c.stroke()
      if (glow.complete && glow.naturalWidth) c.drawImage(glow, m.x - 30, m.y - 30, 60, 60)
    }
  }

  // the ropes (the pieces fade), the anchors, the basket
  for (const r of g.ropes) drawRope(c, r)
  for (let i = 0; i < g.def.ropes.length; i++) drawAnchor(c, g.def.ropes[i]!.ax, g.def.ropes[i]!.ay)
  drawBasket(c, time)
  for (let i = 0; i < g.bubbles.length; i++) drawBubble(c, i, time)
  c.restore()

  drawWater(c, time)

  // the effects and the swipe track
  c.save()
  c.translate(ox, oy)
  c.scale(sc, sc)
  drawParts(c)
  c.lineCap = 'round'
  for (let k = 1; k < TRAIL; k++) {
    const a = trail[(trailAt + k - 1) % TRAIL]!
    const b = trail[(trailAt + k) % TRAIL]!
    const age = clock - b.t
    if (age > 0.4 || age < 0 || clock - a.t > 0.4 || b.t < a.t) continue
    c.globalAlpha = 1 - age / 0.4
    c.strokeStyle = 'rgba(255,238,170,0.55)'
    c.lineWidth = 9
    c.beginPath()
    c.moveTo(a.x, a.y)
    c.lineTo(b.x, b.y)
    c.stroke()
    c.strokeStyle = '#ffffff'
    c.lineWidth = 3
    c.stroke()
  }
  c.globalAlpha = 1
  c.restore()
}

// ── the page ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const hideBroken = (e: Event) => {
  ;(e.target as HTMLElement).style.display = 'none'
}
const resultText = computed(() => t(`app.bigGames.mose.won${Math.max(1, outcome.stars)}`))
const bannerSrc = (c: number) => pic(`bg-${c + 1}`)
const rewardChapter = computed(() => (LEVELS[level.value]?.index === LEVELS_PER_CHAPTER - 1 ? LEVELS[level.value]!.chapter : -1))

function leave() {
  emit('leave')
}

function setProbe() {
  if (window.location.hash.includes('probe=1')) {
    ;(window as unknown as { __mose?: unknown }).__mose = {
      get g() {
        return g
      },
      begin,
      advance: (sec = 0.02) => {
        step(g, sec)
        advance(0)
      },
      draw: () => draw(performance.now() / 1000),
      cut: (id: number) => {
        const r = g.ropes.find((q) => q.live && q.id === id)
        if (!r) return 0
        const m = r.pts[Math.floor(r.pts.length / 2)]!
        const n = cutAt(g, m.x, m.y, m.x, m.y)
        onEvents()
        return n
      },
      tap: (x: number, y: number) => tap(g, x, y),
      swipe: (x1: number, y1: number, x2: number, y2: number) => {
        trailPush(x1, y1)
        const n = cutAt(g, x1, y1, x2, y2)
        trailPush(x2, y2)
        onEvents()
        return n
      }
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
  if (typeof ResizeObserver !== 'undefined' && canvas.value) {
    ro = new ResizeObserver(() => layout())
    ro.observe(canvas.value)
  }
  music.playGame('water')
  setProbe()
  await loadAll()
  if (ctx) {
    for (const n of Object.values(TEX)) {
      const i = img[n]
      if (!i) continue
      const p = ctx.createPattern(i, 'repeat')
      const sk = 44 / Math.max(1, i.height)
      try {
        p?.setTransform(new DOMMatrix([sk, 0, 0, sk, 0, 0]))
      } catch {
        // an old browser: the texture stays big
      }
      pat[n] = p
    }
  }
  last = performance.now()
  raf = requestAnimationFrame(frame)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  window.clearTimeout(endTimer)
  window.clearTimeout(retryTimer)
  window.clearTimeout(hintTimer)
  ro?.disconnect()
  music.stop('game')
  window.removeEventListener('resize', layout)
  window.visualViewport?.removeEventListener('resize', layout)
  document.body.style.overflow = bodyOverflow
})
</script>

<template lang="pug">
  div(class="mk" :class="{ 'mk--land': land }")
    canvas(
      ref="canvas"
      class="mk-canvas"
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onCancel"
    )

    div(v-if="!loaded" class="mk-center")
      div(class="mk-spinner")

    //- the overview: the story, the chapters and the ropes
    div(v-else-if="screen === 'menu'" class="mk-menu")
      div(class="mk-card")
        GameIntroBox(
          :title="t('app.bigGames.mose.title')"
          :label="t('app.bigGames.common.intro')"
          :story="t('app.bigGames.mose.story')"
          :task="t('app.bigGames.mose.task')"
        )
        p(v-if="allDone" class="mk-done") {{ t('app.bigGames.mose.allDone') }}
        div(v-for="(ct, c) in chapterTexts" :key="c" class="mk-chapter")
          div(class="mk-banner")
            img(:src="bannerSrc(c)" alt="" class="mk-banner-pic" @error="hideBroken")
            div(class="mk-banner-text")
              span(class="mk-ch-name") {{ ct.name }}
              span(class="mk-ch-ref") {{ ct.ref }}
              span(class="mk-ch-stars") ★ {{ chapterStars(c) }} / {{ LEVELS_PER_CHAPTER * 3 }}
          p(class="mk-ch-story") {{ ct.story }}
          div(class="mk-levels")
            button(
              v-for="i in chapterLevels(c)"
              :key="i"
              type="button"
              class="mk-level"
              :data-test="'mose-level-' + i"
              @click="begin(i)"
            )
              span(class="mk-level-no") {{ i - c * LEVELS_PER_CHAPTER + 1 }}
              AdventureStars(:stars="levelStars[i] ?? 0" :size="16")
        p(class="mk-rules") {{ t('app.bigGames.mose.starRules') }}
        div(class="mk-menu-buttons")
          AdvButton(tone="blau" small data-test="mose-how" @click="how = true") ? {{ t('app.bigGames.mose.howTitle') }}
          AdvButton(tone="blau" small data-test="mose-leave" @click="leave") {{ t('app.bigGames.common.leave') }}

    //- the game
    template(v-else-if="screen === 'play'")
      div(class="mk-top")
        div(class="mk-top-btns")
          button(type="button" class="mk-btn" :aria-label="t('app.bigGames.mose.pause')" data-test="mose-pause" @click="paused = true") ❚❚
          button(type="button" class="mk-btn" :aria-label="t('app.bigGames.mose.restart')" data-test="mose-restart" @click="begin(level)") ↻
          button(type="button" class="mk-btn" :aria-label="t('app.bigGames.mose.tip')" data-test="mose-tip" @click="showTip") 💡
        div(class="mk-info")
          span(class="mk-level-label") {{ chapterTexts[chapterOf(level)]?.name }} · {{ levelLabel(level) }}
          div(class="mk-lotus" :aria-label="t('app.bigGames.mose.lotus')")
            span(v-for="(on, k) in hud.got" :key="k" :class="['mk-star', { 'is-on': on }]") ✿
      div(v-if="hintShown" class="mk-tip") {{ hintText }}
      div(v-if="hud.retry && !paused" class="mk-retry")
        span(class="mk-retry-text") {{ hud.retryText }}
        AdvButton(small data-test="mose-retry" @click="begin(level)") {{ t('app.bigGames.mose.again') }}

      div(v-if="paused && !how && chapterCard < 0" class="mk-menu mk-menu--dim")
        div(class="mk-card mk-card--small")
          h2(class="mk-title") {{ t('app.bigGames.mose.pause') }}
          AdvButton(data-test="mose-resume" @click="paused = false") {{ t('app.bigGames.mose.resume') }}
          AdvButton(tone="blau" data-test="mose-pause-again" @click="begin(level)") {{ t('app.bigGames.mose.again') }}
          AdvButton(tone="blau" data-test="mose-menu" @click="toMenu") {{ t('app.bigGames.mose.menu') }}
          AdvButton(tone="blau" data-test="mose-pause-leave" @click="leave") {{ t('app.bigGames.common.leave') }}

    //- the end of a round
    div(v-else-if="screen === 'result'" class="mk-menu mk-menu--dim")
      div(class="mk-card mk-card--small")
        h2(class="mk-title") {{ chapterTexts[chapterOf(level)]?.name }} · {{ levelLabel(level) }}
        AdventureStars(:stars="outcome.stars" :size="56" celebrate)
        p(class="mk-text") {{ resultText }}
        div(class="mk-lines")
          p(class="mk-line is-on") ✓ {{ t('app.bigGames.mose.lineLanded') }}
          p(:class="['mk-line', { 'is-on': outcome.stars >= 2 }]") {{ outcome.stars >= 2 ? '✓' : '○' }} {{ t('app.bigGames.mose.lineLotus', { n: outcome.stars >= 2 ? outcome.stars : 0 }) }}
        p(v-if="rewardChapter >= 0" class="mk-line is-on") {{ t('app.bigGames.mose.chapterDone') }}
        template(v-if="isLast")
          img(:src="pic('kachel')" alt="" class="mk-result-pic" @error="hideBroken")
          p(class="mk-text mk-text--task" data-test="mose-all-done") {{ t('app.bigGames.mose.allDone') }}
        AdvButton(v-if="hasNext" data-test="mose-next" @click="begin(level + 1)") {{ t('app.bigGames.mose.next') }}
        AdvButton(:tone="hasNext ? 'blau' : 'gold'" data-test="mose-again" @click="begin(level)") {{ t('app.bigGames.mose.again') }}
        AdvButton(tone="blau" data-test="mose-menu" @click="toMenu") {{ t('app.bigGames.mose.menu') }}

    //- the story of a chapter (once)
    div(v-if="chapterCard >= 0 && loaded && !how" class="mk-menu mk-menu--dim")
      div(class="mk-card mk-card--small")
        img(:src="bannerSrc(chapterCard)" alt="" class="mk-result-pic" @error="hideBroken")
        h2(class="mk-title") {{ chapterTexts[chapterCard]?.name }}
        p(class="mk-ch-ref-line") {{ chapterTexts[chapterCard]?.ref }}
        p(class="mk-text") {{ chapterTexts[chapterCard]?.story }}
        p(class="mk-text mk-text--task") {{ chapterTexts[chapterCard]?.task }}
        AdvButton(data-test="mose-chapter-go" @click="closeCard") {{ t('app.bigGames.mose.go') }}

    //- the explanation (once; the question mark in the menu brings it back)
    div(v-if="how && loaded" class="mk-menu mk-menu--dim")
      div(class="mk-card mk-how")
        h2(class="mk-title") {{ t('app.bigGames.mose.howTitle') }}
        div(class="mk-how-row")
          span(class="mk-how-sign") ✂
          p(class="mk-how-line") {{ t('app.bigGames.mose.howCut') }}
        div(class="mk-how-row")
          span(class="mk-how-sign") 👆
          p(class="mk-how-line") {{ t('app.bigGames.mose.howTap') }}
        div(class="mk-how-row")
          span(class="mk-how-sign") ✿
          p(class="mk-how-line") {{ t('app.bigGames.mose.howLotus') }}
        AdvButton(data-test="mose-go" @click="closeHow") {{ t('app.bigGames.mose.go') }}
</template>

<style scoped lang="sass">
.mk
  position: fixed
  inset: 0
  z-index: 60
  background: #cfe3d0
  overflow: hidden
  user-select: none
  -webkit-user-select: none
  touch-action: none

.mk-canvas
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  touch-action: none

.mk-center
  position: absolute
  inset: 0
  display: grid
  place-items: center

.mk-spinner
  width: 46px
  height: 46px
  border-radius: 50%
  border: 5px solid rgba(60, 90, 70, 0.25)
  border-top-color: #e0a830
  animation: mk-spin 0.9s linear infinite

@keyframes mk-spin
  to
    transform: rotate(360deg)

.mk-menu
  position: absolute
  inset: 0
  display: grid
  place-items: start center
  padding: 16px
  overflow-y: auto
  background: linear-gradient(180deg, rgba(20, 44, 40, 0.74), rgba(20, 44, 40, 0.88))

  &--dim
    display: flex
    background: rgba(18, 36, 34, 0.6)
    z-index: 5

    > .mk-card
      margin: auto

.mk-card
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

.mk-title
  margin: 0
  font-size: 1.6rem
  font-weight: 800

.mk-text
  margin: 0
  font-size: 1.15rem
  line-height: 1.4

  &--task
    font-weight: 800

.mk-done
  margin: 0
  padding: 8px 12px
  border-radius: 14px
  background: #fff1c2
  font-weight: 800

.mk-rules
  margin: 0
  font-size: 0.85rem
  color: var(--lk-muted, #7a6b4f)

.mk-chapter
  width: 100%
  display: flex
  flex-direction: column
  gap: 8px

.mk-banner
  position: relative
  height: 92px
  border-radius: 16px
  overflow: hidden
  background: #4a7a60

.mk-banner-pic
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  object-fit: cover
  object-position: 50% 60%

.mk-banner-text
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
  background: linear-gradient(0deg, rgba(10, 30, 26, 0.78), rgba(10, 30, 26, 0.05))
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6)

.mk-ch-name
  font-size: 1.05rem
  font-weight: 800

.mk-ch-ref
  font-size: 0.78rem
  font-weight: 600
  opacity: 0.9

.mk-ch-stars
  position: absolute
  right: 12px
  top: 8px
  font-weight: 800
  font-size: 0.9rem
  color: #ffe27a

.mk-ch-story, .mk-ch-ref-line
  margin: 0
  font-size: 0.88rem
  line-height: 1.35
  color: var(--lk-muted, #7a6b4f)
  text-align: left

.mk-levels
  display: grid
  grid-template-columns: repeat(5, minmax(0, 1fr))
  gap: 8px
  width: 100%

.mk-level
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

.mk-level-no
  display: grid
  place-items: center
  width: 30px
  height: 30px
  border-radius: 50%
  background: var(--lk-accent, #1f6a6a)
  color: var(--lk-on-accent, #fff)
  font-weight: 800

.mk-menu-buttons
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 10px

.mk-top
  position: absolute
  top: 0
  left: 0
  right: 0
  height: 76px
  display: flex
  align-items: flex-start
  gap: 8px
  padding: max(6px, env(safe-area-inset-top)) max(8px, env(safe-area-inset-right)) 0 max(8px, env(safe-area-inset-left))
  pointer-events: none

.mk-top > *
  pointer-events: auto

.mk-top-btns
  display: flex
  gap: 6px

.mk-btn
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

.mk-info
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

.mk-level-label
  font-size: 0.82rem
  line-height: 1.15
  white-space: nowrap
  overflow: hidden
  text-overflow: ellipsis
  max-width: 100%

.mk-lotus
  display: flex
  gap: 4px

.mk-star
  font-size: 1.2rem
  color: #b9ae96

  &.is-on
    color: #e0568a
    text-shadow: 0 0 6px rgba(255, 150, 190, 0.9)

.mk-tip
  position: absolute
  left: 50%
  top: 84px
  transform: translateX(-50%)
  max-width: min(520px, 92vw)
  padding: 10px 18px
  border-radius: 18px
  background: rgba(255, 250, 235, 0.95)
  color: #2a2418
  font-weight: 700
  text-align: center
  pointer-events: none

.mk-retry
  position: absolute
  left: 50%
  bottom: max(14px, env(safe-area-inset-bottom))
  transform: translateX(-50%)
  display: flex
  align-items: center
  gap: 12px
  width: min(520px, 94vw)
  padding: 8px 12px 8px 18px
  border-radius: 26px
  background: rgba(255, 250, 235, 0.96)
  color: #2a2418
  font-weight: 700
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3)
  animation: mk-pop 0.35s ease-out

.mk-retry-text
  flex: 1
  font-size: 0.9rem
  line-height: 1.25

.mk-retry > :last-child
  flex: none
  min-width: 118px
  white-space: nowrap

@keyframes mk-pop
  from
    transform: translateX(-50%) translateY(20px)
    opacity: 0

.mk-result-pic
  width: 100%
  max-height: 160px
  object-fit: cover
  border-radius: 14px

.mk-lines
  display: flex
  flex-direction: column
  gap: 2px
  align-items: flex-start

.mk-line
  margin: 0
  font-size: 0.92rem
  color: var(--lk-muted, #7a6b4f)

  &.is-on
    color: var(--lk-text, #2a2418)
    font-weight: 700

.mk-how
  gap: 20px

.mk-how-row
  display: flex
  align-items: center
  gap: 16px
  width: 100%

.mk-how-sign
  width: 56px
  flex: none
  font-size: 2.2rem
  text-align: center
  color: #f0a812

.mk-how-line
  margin: 0
  text-align: left
  font-size: 1.2rem
  font-weight: 700
  line-height: 1.3

@media (max-height: 520px)
  .mk-card
    padding: 12px 14px
    gap: 6px

  .mk-title
    font-size: 1.2rem

  .mk-card--small
    flex-direction: row
    flex-wrap: wrap
    justify-content: center
    width: min(640px, 100%)

    > .mk-title, > .mk-text, > .mk-lines
      flex: 1 1 100%

// landscape: the buttons stand in a column on the left, the rest of the screen is the world
.mk--land
  .mk-top
    right: auto
    width: 64px
    height: auto
    bottom: 0
    flex-direction: column
    padding: max(6px, env(safe-area-inset-top)) 4px 6px max(8px, env(safe-area-inset-left))

  .mk-top-btns
    flex-direction: column

  .mk-info
    position: fixed
    top: 6px
    right: max(8px, env(safe-area-inset-right))
    flex: none
    width: auto
    max-width: 38vw

  .mk-tip
    top: 8px
    max-width: min(420px, 50vw)

// short screens: the explanation card closer together
@media (max-height: 520px)
  .mk-how
    gap: 8px
  .mk-how-row
    gap: 12px
  .mk-how-sign
    width: 40px
    font-size: 1.5rem
  .mk-how-line
    font-size: 1.05rem
</style>
