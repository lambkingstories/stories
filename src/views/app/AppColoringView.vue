<script setup lang="ts">
/**
 *
 * Two stacked canvases:
 *   - `bgCanvas`: the source artwork (image or rendered PDF page).
 *   - `drawCanvas`: the user's painted layer; flood-fill writes here too.
 *
 * The flood-fill operates on the *merged* view (bg + draw). For real
 * coloring artwork — strong black outlines on white — that means:
 *   - The seed pixel is the white area the user tapped.
 *   - The tolerance check (`tol = 35`) treats anything close to that
 *     white as the same field, and stops at the bold outlines (which are
 *     well outside ±35 from white). The result behaves like a paint
 *     bucket bounded by black borders, which is what the prompt asks for.
 *
 * Tools: felt / watercolor / pencil (crayon) / graphite / fill / eraser.
 * Quick-access strip (fill, pencil, eraser) lives in the top-right of
 * the header so kids don't have to open the toolbox to switch between
 * the most common actions; the rest stays in the floating minibar.
 *
 * The view also accepts a `?source=<url>&type=image|pdf` query so the
 * BookDetail "Use in coloring app" CTA can drop straight into the
 * artwork, without going through the upload card.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import ZBackButton from '@/components/atoms/ZBackButton.vue'
import { prependBaseUrl } from '@/utils/function'
import { isIOS } from '@/utils/platform'
import * as pdfjsLib from 'pdfjs-dist'
// `?worker&inline` makes Vite inline the worker source into the chunk as
// a blob — no separate asset file (which the production obfuscator drops),
// and the CSP's `worker-src 'self' blob:` accepts it.
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker&inline'

pdfjsLib.GlobalWorkerOptions.workerPort = new PdfWorker()

// pdf.js is bundled as a regular npm dep so it ships in the same lazy
// chunk as this view (the router already imports `AppColoringView.vue`
// dynamically). cMaps come from jsdelivr — the CSP's
// `connect-src 'self' https:` allows any https origin for fetches.
const PDFJS_CMAP = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/'

const { t } = useI18n({ useScope: 'global' })
const route = useRoute()
const router = useRouter()

// ── Source from query --------------------------------------------------------

const querySource = computed<string>(() => {
  const v = route.query.source
  return typeof v === 'string' ? v : ''
})
const querySourceType = computed<'image' | 'pdf' | ''>(() => {
  const v = route.query.type
  if (v === 'image' || v === 'pdf') return v
  if (querySource.value && /\.pdf(?:\?.*)?$/i.test(querySource.value)) return 'pdf'
  if (querySource.value) return 'image'
  return ''
})

// ── Backdrop -----------------------------------------------------------------

// Two artworks — a tall one for portrait, a wide one for landscape. The
// swap itself happens in CSS (`@media (orientation: …)`); we only feed the
// base-url-corrected `url()` values in as custom properties, because the
// files live in `public/` and a bare `url(…)` inside the SFC style block
// would be resolved by Vite as a bundled asset.
const backdropVars = computed(() => ({
  '--ac-bg-portrait': `url(${prependBaseUrl('images/bg/ausmalen_portrait.webp')})`,
  '--ac-bg-landscape': `url(${prependBaseUrl('images/bg/ausmalen_landscape.webp')})`
}))

// ── Tool & paint state -------------------------------------------------------

type ToolId = 'felt' | 'watercolor' | 'pencil' | 'graphite' | 'fill' | 'eraser'

const FULL_PALETTE = [
  '#F5A5A5', '#F47B7B', '#F5C78F', '#F5E490',
  '#C8E5A0', '#8FC88F', '#9ED8D8', '#A5C8F0',
  '#A8A8E0', '#C896D8', '#F09EC8', '#D4A874',
  '#7B2FBE', '#4A7B9D', '#B94A3E', '#5A8F5C',
  '#C8963E', '#1A0A2E'
]
const GRAY_PALETTE = ['#FFFFFF', '#CCCCCC', '#999999', '#555555', '#111111']

const tool = ref<ToolId>('felt')
const color = ref<string>(FULL_PALETTE[0]!)
const customColor = ref<string | null>(null)
const brushSize = ref<number>(10)
const alphaSliderValue = ref<number>(0)
const opacity = computed(() => 1 - alphaSliderValue.value / 100)

const palette = computed(() =>
  tool.value === 'eraser' ? [] : tool.value === 'graphite' ? GRAY_PALETTE : FULL_PALETTE
)
const isGraphitePal = computed(() => tool.value === 'graphite')

function pickPreset(c: string) {
  color.value = c
  customColor.value = null
}

function pickCustom(c: string) {
  color.value = c
  customColor.value = c
}

function isPresetActive(c: string) {
  return color.value === c && !customColor.value
}

watch(tool, (next) => {
  if (next === 'graphite' && !GRAY_PALETTE.includes(color.value)) {
    color.value = '#111111'
    customColor.value = null
  }
})

// ── Canvas refs --------------------------------------------------------------

const bgCanvas = ref<HTMLCanvasElement | null>(null)
const drawCanvas = ref<HTMLCanvasElement | null>(null)
const canvasWrap = ref<HTMLDivElement | null>(null)
const mainEl = ref<HTMLElement | null>(null)
const cursorRing = ref<HTMLDivElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const colorPickerEl = ref<HTMLInputElement | null>(null)

let bgCtx: CanvasRenderingContext2D | null = null
let drawCtx: CanvasRenderingContext2D | null = null

const hasImage = ref(false)
const isLoading = ref(false)
const dropOver = ref(false)

let pdfDoc: any = null
const totalPages = ref(1)
const currentPage = ref(1)
const pageDrawings: Record<number, string> = {}

const MAX_HIST = 10
let historyStack: ImageData[] = []
let historyIdx = -1
const canUndo = ref(false)
const canRedo = ref(false)

let drawing = false
let lastX = 0
let lastY = 0
let activeTouchId: number | null = null

const zoom = {
  scale: 1,
  minScale: 1,
  maxScale: 5,
  panX: 0,
  panY: 0,
  baseW: 0,
  baseH: 0
}

const minibarVisible = ref(false)
const minibarCollapsed = ref(true)
const minibarPos = ref<{ left: number; top: number }>({ left: 0, top: 0 })
const minibarDragging = ref(false)
const isFullscreen = ref(false)
const minibarRoot = ref<HTMLDivElement | null>(null)

// ── Bottom nav ---------------------------------------------------------------

// ── Unsaved-changes guard ----------------------------------------------------
// `hasUserAction` flips true the moment the user commits anything to the
// canvas (a stroke, a flood-fill, a clear). It resets when a fresh image is
// loaded. Both router navigations and full page reloads are gated against
// it so kids don't lose minutes of coloring to a stray tap.

const hasUserAction = ref(false)
const showLeaveConfirm = ref(false)
let pendingLeave: (() => void) | null = null

function onBack() {
  // Drives the same router exit as the bottom-nav used to. The route guard
  // installed below intercepts when there are unsaved changes.
  if (window.history.length > 1) router.back()
  else router.push({ name: 'app-main' })
}

function cancelLeave() {
  showLeaveConfirm.value = false
  pendingLeave = null
}

function confirmLeave() {
  showLeaveConfirm.value = false
  const proceed = pendingLeave
  pendingLeave = null
  hasUserAction.value = false // user accepted the loss; allow nav through.
  proceed?.()
}

function onBeforeUnload(e: BeforeUnloadEvent) {
  if (!hasUserAction.value) return
  // The browser shows its own native dialog — `returnValue` is the legacy
  // contract; modern browsers ignore the message and use a generic prompt
  // but the truthy `returnValue` is what triggers the dialog.
  e.preventDefault()
  e.returnValue = ''
}


// ── Loading sources ----------------------------------------------------------

async function loadFromUrl(url: string, type: 'image' | 'pdf') {
  if (!url) return
  showMinibar()
  isLoading.value = true
  try {
    if (type === 'pdf') {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`PDF fetch failed (${res.status})`)
      const buf = new Uint8Array(await res.arrayBuffer())
      await openPdfBytes(buf)
    } else {
      await openImageUrl(url)
    }
  } catch (err) {
    console.error('coloring source load error', err)
    alert((err as Error).message || 'Bild konnte nicht geladen werden')
  } finally {
    isLoading.value = false
  }
}

function openImageUrl(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const bg = bgCanvas.value, dc = drawCanvas.value
      if (!bg || !dc || !bgCtx || !drawCtx) return reject(new Error('canvas not ready'))
      const MAX_DIM = 4096
      const r = Math.min(MAX_DIM / img.width, MAX_DIM / img.height, 1)
      const w = Math.max(1, Math.round(img.width * r))
      const h = Math.max(1, Math.round(img.height * r))
      bg.width = w
      bg.height = h
      dc.width = w
      dc.height = h
      bgCtx.fillStyle = '#ffffff'
      bgCtx.fillRect(0, 0, w, h)
      bgCtx.drawImage(img, 0, 0, w, h)
      drawCtx.clearRect(0, 0, w, h)
      pdfDoc = null
      totalPages.value = 1
      currentPage.value = 1
      hasImage.value = true
      fitCanvas()
      resetHistory()
      resolve()
    }
    img.onerror = () => reject(new Error('Bild konnte nicht geladen werden'))
    img.src = url
  })
}

async function openPdfBytes(data: Uint8Array) {
  pdfDoc = await pdfjsLib.getDocument({ data, cMapUrl: PDFJS_CMAP, cMapPacked: true }).promise
  totalPages.value = pdfDoc.numPages
  currentPage.value = 1
  Object.keys(pageDrawings).forEach((k) => delete pageDrawings[Number(k)])
  await renderPdfPage(1)
}

function readFileAsUint8Array(file: File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(new Uint8Array(r.result as ArrayBuffer))
    r.onerror = () => reject(r.error || new Error('Datei konnte nicht gelesen werden'))
    r.readAsArrayBuffer(file)
  })
}

async function openFile(file: File) {
  showMinibar()
  isLoading.value = true
  try {
    if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
      const buf = await readFileAsUint8Array(file)
      await openPdfBytes(buf)
    } else {
      const url = URL.createObjectURL(file)
      try {
        await openImageUrl(url)
      } finally {
        URL.revokeObjectURL(url)
      }
    }
  } catch (err) {
    console.error('open file failed', err)
    alert((err as Error).message || 'Datei konnte nicht geladen werden')
  } finally {
    isLoading.value = false
  }
}

async function renderPdfPage(num: number) {
  if (!pdfDoc) return
  isLoading.value = true
  try {
    const page = await pdfDoc.getPage(num)
    const MAX_DIM = 4096
    const MAX_AREA = 16777216
    const baseVp = page.getViewport({ scale: 1 })
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let s = dpr * 1.5
    s = Math.min(s, MAX_DIM / baseVp.width, MAX_DIM / baseVp.height)
    s = Math.min(s, Math.sqrt(MAX_AREA / (baseVp.width * baseVp.height)))
    s = Math.max(1, s)
    const vp = page.getViewport({ scale: s })
    const bg = bgCanvas.value, dc = drawCanvas.value
    if (!bg || !dc || !bgCtx || !drawCtx) return
    bg.width = Math.floor(vp.width)
    bg.height = Math.floor(vp.height)
    dc.width = bg.width
    dc.height = bg.height
    bgCtx.fillStyle = '#ffffff'
    bgCtx.fillRect(0, 0, bg.width, bg.height)
    await page.render({ canvasContext: bgCtx, viewport: vp }).promise
    drawCtx.clearRect(0, 0, dc.width, dc.height)
    hasImage.value = true
    currentPage.value = num
    fitCanvas()

    const saved = pageDrawings[num]
    if (saved) {
      await new Promise<void>((resolve) => {
        const img = new Image()
        img.onload = () => {
          drawCtx!.drawImage(img, 0, 0, dc.width, dc.height)
          resolve()
        }
        img.onerror = () => resolve()
        img.src = saved
      })
    }
    resetHistory()
  } finally {
    isLoading.value = false
  }
}

function savePageDrawing() {
  const dc = drawCanvas.value
  if (!dc || !hasImage.value) return
  try {
    pageDrawings[currentPage.value] = dc.toDataURL('image/png')
  } catch {
    // tainted canvas etc — ignore
  }
}

function gotoPage(delta: 1 | -1) {
  if (!pdfDoc) return
  const next = currentPage.value + delta
  if (next < 1 || next > totalPages.value) return
  savePageDrawing()
  void renderPdfPage(next)
}

// ── Fit / zoom ---------------------------------------------------------------

// `fitCanvas` is called from many places (after image load, on resize, on
// fullscreen toggle). On the very first source load the grid hasn't always
// settled when our promise resolves — `mainEl.getBoundingClientRect()`
// returns zero dimensions and the canvas-wrap stays at 0×0. We defer the
// measurement to the next animation frame, and retry once if the layout
// still hasn't shaken out (mobile browsers sometimes need a second tick
// after dvh recalculation).
let fitRetry = 0
function fitCanvas() {
  requestAnimationFrame(() => {
    const bg = bgCanvas.value, wrap = canvasWrap.value, m = mainEl.value
    if (!bg || !wrap || !m) return
    // Use `clientWidth`/`clientHeight` instead of `getBoundingClientRect`
    // because the global page-pop-scale route transition wraps every
    // mounted view in a transient `transform: scale(0.65 → 1)`. The bounding
    // rect reports the *transformed* size, so an image that finishes
    // loading mid-animation would lock the canvas at 65% of the final
    // layout. `clientWidth` reads the layout box unaffected by transforms.
    const r = { width: m.clientWidth, height: m.clientHeight }
    if (r.width <= 0 || r.height <= 0) {
      if (fitRetry < 4) {
        fitRetry++
        requestAnimationFrame(fitCanvas)
      }
      return
    }
    fitRetry = 0
    fitCanvasInner(bg, wrap, r as DOMRect)
  })
}

function fitCanvasInner(bg: HTMLCanvasElement, wrap: HTMLDivElement, r: DOMRect) {
  // Contain-fit dimensions — the largest the unscaled artwork can be
  // while staying entirely inside the canvas area. Centering is then
  // handled inside applyTransform based on whether we're in fullscreen.
  const aw = r.width
  const ah = r.height
  const ratio = bg.width / bg.height
  let w = aw, h = aw / ratio
  if (h > ah) {
    h = ah
    w = ah * ratio
  }
  w = Math.max(1, Math.round(w))
  h = Math.max(1, Math.round(h))
  zoom.baseW = w
  zoom.baseH = h
  wrap.style.width = `${w}px`
  wrap.style.height = `${h}px`
  zoom.scale = 1
  zoom.panX = 0
  zoom.panY = 0
  applyTransform()
}

function applyTransform() {
  const wrap = canvasWrap.value, m = mainEl.value
  if (!wrap || !m) return
  // Layout-box dims so the math survives the route-transition's
  // page-pop-scale transform (see fitCanvas).
  const r = { width: m.clientWidth, height: m.clientHeight }
  // transform-origin is 0,0 on the wrap, so the visible size is the
  // scaled dims; centring the scaled box puts the artwork in the
  // geometric middle of the canvas area in every mode.
  const sw = zoom.baseW * zoom.scale
  const sh = zoom.baseH * zoom.scale
  const baseLeft = (r.width - sw) / 2
  const baseTop = (r.height - sh) / 2
  wrap.style.transform = `translate(${baseLeft + zoom.panX}px, ${baseTop + zoom.panY}px) scale(${zoom.scale})`
}

function clampPan() {
  const m = mainEl.value
  if (!m) return
  if (zoom.scale <= 1) {
    zoom.panX = 0
    zoom.panY = 0
    return
  }
  // Layout-box dims (see fitCanvas note).
  const aw = m.clientWidth
  const ah = m.clientHeight
  const sw = zoom.baseW * zoom.scale
  const sh = zoom.baseH * zoom.scale
  const maxX = Math.max(0, (sw - aw) / 2 + 40)
  const maxY = Math.max(0, (sh - ah) / 2 + 40)
  zoom.panX = Math.max(-maxX, Math.min(maxX, zoom.panX))
  zoom.panY = Math.max(-maxY, Math.min(maxY, zoom.panY))
}

function onResize() {
  fitCanvas()
  // Keep the floating toolbox inside the viewport after a rotation /
  // window resize. Without this re-clamp, a toolbox positioned at the
  // right edge in landscape ends up off-screen once the device flips
  // to portrait (narrower width), so the kid can't grab it any more
  // to drag it back into view.
  if (minibarVisible.value && minibarRoot.value) {
    const r = minibarRoot.value.getBoundingClientRect()
    clampMinibar(r.left, r.top)
  }
}

// ── Cursor ring --------------------------------------------------------------

function hexToRgba(hex: string, a: number) {
  if (!hex) return `rgba(0,0,0,${a})`
  const c = hex.replace('#', '')
  if (c.length === 3) {
    const r = parseInt(c[0]! + c[0], 16)
    const g = parseInt(c[1]! + c[1], 16)
    const b = parseInt(c[2]! + c[2], 16)
    return `rgba(${r},${g},${b},${a})`
  }
  if (c.length < 6) return `rgba(0,0,0,${a})`
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${a})`
}

function updateCursorRing() {
  const ring = cursorRing.value
  if (!ring) return
  const isErase = tool.value === 'eraser'
  ring.style.width = `${brushSize.value}px`
  ring.style.height = `${brushSize.value}px`
  ring.classList.toggle('eraser-cursor', isErase)
  ring.style.background = isErase
    ? 'rgba(192,82,106,.10)'
    : hexToRgba(tool.value === 'graphite' ? '#111111' : color.value, 0.15)
}

// ── Drawing engine ----------------------------------------------------------

interface PaintPos {
  x: number;
  y: number;
  pressure: number
}

function getPosFromClient(cx: number, cy: number, pressure = 1): PaintPos {
  const dc = drawCanvas.value!
  const r = dc.getBoundingClientRect()
  const sx = dc.width / r.width
  const sy = dc.height / r.height
  return { x: (cx - r.left) * sx, y: (cy - r.top) * sy, pressure }
}

function applyStyle(p: PaintPos) {
  const ctx = drawCtx!
  const a = opacity.value
  const sz = brushSize.value
  const col = tool.value === 'graphite' ? (customColor.value ?? color.value) : color.value
  ctx.globalCompositeOperation = 'source-over'
  switch (tool.value) {
    case 'felt':
      ctx.globalAlpha = a * p.pressure
      ctx.strokeStyle = ctx.fillStyle = col
      ctx.lineWidth = sz * p.pressure
      ctx.lineCap = ctx.lineJoin = 'round'
      break
    case 'watercolor':
      ctx.globalAlpha = Math.min(0.16, a * 0.20) * p.pressure
      ctx.strokeStyle = ctx.fillStyle = col
      ctx.lineWidth = sz * p.pressure * 1.7
      ctx.lineCap = ctx.lineJoin = 'round'
      break
    case 'pencil':
      ctx.globalAlpha = 0
      ctx.strokeStyle = ctx.fillStyle = col
      ctx.lineWidth = Math.max(1, sz * 0.6 * p.pressure)
      ctx.lineCap = ctx.lineJoin = 'round'
      break
    case 'graphite':
      ctx.globalAlpha = Math.min(0.50, a * 0.45) * p.pressure
      ctx.strokeStyle = ctx.fillStyle = col
      ctx.lineWidth = Math.max(0.8, sz * 0.55 * p.pressure)
      ctx.lineCap = ctx.lineJoin = 'round'
      break
    case 'eraser':
      ctx.globalCompositeOperation = 'destination-out'
      ctx.globalAlpha = Math.min(1, a * 1.2) * p.pressure
      ctx.strokeStyle = ctx.fillStyle = 'rgba(0,0,0,1)'
      ctx.lineWidth = sz * 1.5 * p.pressure
      ctx.lineCap = ctx.lineJoin = 'round'
      break
  }
}

function graphiteTexture(x: number, y: number, p: PaintPos) {
  const ctx = drawCtx!
  const sz = Math.max(1, brushSize.value * 0.65)
  const spread = sz * 0.8
  const n = Math.floor(sz * 1.4)
  const ba = Math.min(0.22, opacity.value * 0.20) * p.pressure
  ctx.globalCompositeOperation = 'source-over'
  ctx.fillStyle = color.value
  for (let i = 0; i < n; i++) {
    const dx = (Math.random() - 0.5) * spread * 2
    const dy = (Math.random() - 0.5) * spread * 2
    const r = Math.random() * (sz * 0.22) + 0.25
    ctx.globalAlpha = ba * (0.35 + Math.random() * 0.65)
    ctx.beginPath()
    ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2)
    ctx.fill()
  }
}

function watercolorBlob(x: number, y: number, p: PaintPos) {
  const ctx = drawCtx!
  const sz = brushSize.value * 1.5 * p.pressure
  ctx.globalCompositeOperation = 'source-over'
  ctx.fillStyle = color.value
  for (let i = 0; i < 6; i++) {
    const dx = (Math.random() - 0.5) * sz * 0.8
    const dy = (Math.random() - 0.5) * sz * 0.8
    const r = sz * (0.3 + Math.random() * 0.45)
    ctx.globalAlpha = Math.min(0.055, opacity.value * 0.08) * p.pressure
    ctx.beginPath()
    ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2)
    ctx.fill()
  }
}

function crayonStroke(x1: number, y1: number, x2: number, y2: number, pressure: number) {
  const ctx = drawCtx!
  const sz = brushSize.value
  const a = opacity.value
  const col = color.value
  const dx = x2 - x1, dy = y2 - y1
  const len = Math.hypot(dx, dy)
  if (len < 0.5) {
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = Math.min(0.9, a * 0.95) * pressure
    ctx.fillStyle = col
    ctx.beginPath()
    ctx.arc(x1, y1, sz * 0.45 * pressure, 0, Math.PI * 2)
    ctx.fill()
    return
  }
  const ux = dx / len, uy = dy / len
  const px = -uy, py = ux
  const numStripes = Math.max(3, Math.floor(sz * 0.58))
  ctx.globalCompositeOperation = 'source-over'
  for (let i = 0; i < numStripes; i++) {
    const t = numStripes === 1 ? 0 : (i / (numStripes - 1)) - 0.5
    const baseOff = t * sz * 0.88
    const jitter = (Math.random() - 0.5) * sz * 0.14
    const off = baseOff + jitter
    const sx = x1 + px * off + ux * (Math.random() - 0.4) * sz * 0.10
    const sy = y1 + py * off + uy * (Math.random() - 0.4) * sz * 0.10
    const ex = x2 + px * (off + (Math.random() - 0.5) * sz * 0.07)
    const ey = y2 + py * (off + (Math.random() - 0.5) * sz * 0.07)
    const midX = (sx + ex) / 2 + (Math.random() - 0.5) * 2.2
    const midY = (sy + ey) / 2 + (Math.random() - 0.5) * 2.2
    const stripeW = (sz / numStripes) * (0.45 + Math.random() * 1.05) * pressure
    const stripeA = Math.min(0.88, a * 0.90) * pressure * (0.48 + Math.random() * 0.52)
    ctx.globalAlpha = stripeA
    ctx.strokeStyle = col
    ctx.lineWidth = Math.max(0.4, stripeW)
    ctx.lineCap = 'butt'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(sx, sy)
    ctx.quadraticCurveTo(midX, midY, ex, ey)
    ctx.stroke()
  }
  const grainCount = Math.floor(sz * len * 0.045)
  ctx.fillStyle = col
  for (let i = 0; i < grainCount; i++) {
    const gt = Math.random()
    const gx = x1 + dx * gt + px * (Math.random() - 0.5) * sz * 1.05
    const gy = y1 + dy * gt + py * (Math.random() - 0.5) * sz * 1.05
    ctx.globalAlpha = Math.min(0.42, opacity.value * 0.48) * pressure * Math.random()
    ctx.beginPath()
    ctx.arc(gx, gy, Math.random() * sz * 0.055 + 0.2, 0, Math.PI * 2)
    ctx.fill()
  }
}

// Flood fill — paint-bucket bounded by black outlines. Reads the merged
// (bg + draw) canvas so users can repaint already-painted regions.
function floodFill(sx: number, sy: number) {
  const dc = drawCanvas.value, bg = bgCanvas.value
  if (!dc || !bg || !drawCtx || !bgCtx) return
  const cw = dc.width, ch = dc.height
  if (sx < 0 || sy < 0 || sx >= cw || sy >= ch) return
  const merged = document.createElement('canvas')
  merged.width = cw
  merged.height = ch
  const mCtx = merged.getContext('2d')!
  mCtx.drawImage(bg, 0, 0)
  mCtx.drawImage(dc, 0, 0)
  const mData = mCtx.getImageData(0, 0, cw, ch).data
  const drawImg = drawCtx.getImageData(0, 0, cw, ch)
  const dData = drawImg.data
  const ti = (sy * cw + sx) * 4
  const tR = mData[ti]!, tG = mData[ti + 1]!, tB = mData[ti + 2]!
  const fR = parseInt(color.value.slice(1, 3), 16)
  const fG = parseInt(color.value.slice(3, 5), 16)
  const fB = parseInt(color.value.slice(5, 7), 16)
  const fA = Math.round(opacity.value * 255)
  if (Math.abs(tR - fR) < 3 && Math.abs(tG - fG) < 3 && Math.abs(tB - fB) < 3) return
  const tol = 35
  const ok = (i: number) =>
    Math.abs(mData[i]! - tR) <= tol && Math.abs(mData[i + 1]! - tG) <= tol && Math.abs(mData[i + 2]! - tB) <= tol
  const vis = new Uint8Array(cw * ch)
  const stk: [number, number][] = [[sx, sy]]
  while (stk.length > 0) {
    const top = stk.pop()!
    let x = top[0], y = top[1]
    if (y < 0 || y >= ch) continue
    while (x > 0 && ok((y * cw + x - 1) * 4) && !vis[y * cw + x - 1]) x--
    let sa = false, sb = false
    while (x < cw) {
      const mi = (y * cw + x) * 4, pi = y * cw + x
      if (!ok(mi) || vis[pi]) break
      vis[pi] = 1
      dData[mi] = fR
      dData[mi + 1] = fG
      dData[mi + 2] = fB
      dData[mi + 3] = fA
      if (y > 0) {
        const ai = (y - 1) * cw + x
        if (ok(ai * 4) && !vis[ai]) {
          if (!sa) {
            stk.push([x, y - 1])
            sa = true
          }
        } else sa = false
      }
      if (y < ch - 1) {
        const bi = (y + 1) * cw + x
        if (ok(bi * 4) && !vis[bi]) {
          if (!sb) {
            stk.push([x, y + 1])
            sb = true
          }
        } else sb = false
      }
      x++
    }
  }
  drawCtx.putImageData(drawImg, 0, 0)
}

function onPointerDown(e: PointerEvent) {
  if (!hasImage.value) return
  if (activeTouchId !== null) return
  if (e.pointerType === 'touch') return
  e.preventDefault()
  try {
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId)
  } catch { /* ignore */
  }
  const p = getPosFromClient(e.clientX, e.clientY, e.pointerType === 'pen' && e.pressure !== 0.5 ? Math.max(0.1, e.pressure) : 1)
  beginStroke(p)
}

function onPointerMove(e: PointerEvent) {
  const ring = cursorRing.value
  if (ring) {
    ring.style.left = `${e.clientX}px`
    ring.style.top = `${e.clientY}px`
    ring.classList.add('show')
  }
  if (!drawing) return
  if (activeTouchId !== null) return
  if (e.pointerType === 'touch') return
  e.preventDefault()
  const p = getPosFromClient(e.clientX, e.clientY, e.pointerType === 'pen' && e.pressure !== 0.5 ? Math.max(0.1, e.pressure) : 1)
  continueStroke(p)
}

function onPointerEnd(e: PointerEvent) {
  if (!drawing) return
  drawing = false
  drawCtx!.globalCompositeOperation = 'source-over'
  drawCtx!.globalAlpha = 1
  try {
    (e.currentTarget as Element).releasePointerCapture?.(e.pointerId)
  } catch { /* ignore */
  }
  saveHistory()
}

function onPointerLeaveCanvas() {
  cursorRing.value?.classList.remove('show')
}

const gesture = {
  mode: null as null | 'draw' | 'pinch',
  startDist: 0,
  startScale: 1,
  startPanX: 0,
  startPanY: 0,
  startMidX: 0,
  startMidY: 0
}

function tDist(t1: Touch, t2: Touch) {
  return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
}

function tMid(t1: Touch, t2: Touch) {
  return { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 }
}

function onTouchStart(e: TouchEvent) {
  if (!hasImage.value) return
  e.preventDefault()
  if (e.touches.length >= 2) {
    if (drawing) {
      drawing = false
      activeTouchId = null
      drawCtx!.globalCompositeOperation = 'source-over'
      drawCtx!.globalAlpha = 1
    }
    gesture.mode = 'pinch'
    const t1 = e.touches[0]!, t2 = e.touches[1]!
    gesture.startDist = tDist(t1, t2)
    gesture.startScale = zoom.scale
    gesture.startPanX = zoom.panX
    gesture.startPanY = zoom.panY
    const mid = tMid(t1, t2)
    gesture.startMidX = mid.x
    gesture.startMidY = mid.y
    return
  }
  if (activeTouchId !== null) return
  gesture.mode = 'draw'
  const t = e.changedTouches[0]
  if (!t) return
  activeTouchId = t.identifier
  const p = getPosFromClient(t.clientX, t.clientY, t.force && t.force > 0 ? t.force : 1)
  beginStroke(p)
}

function onTouchMove(e: TouchEvent) {
  e.preventDefault()
  if (gesture.mode === 'pinch' && e.touches.length >= 2) {
    const t1 = e.touches[0]!, t2 = e.touches[1]!
    const ratio = tDist(t1, t2) / gesture.startDist
    const mid = tMid(t1, t2)
    let s = gesture.startScale * ratio
    s = Math.max(zoom.minScale, Math.min(zoom.maxScale, s))
    zoom.scale = s
    zoom.panX = gesture.startPanX + (mid.x - gesture.startMidX)
    zoom.panY = gesture.startPanY + (mid.y - gesture.startMidY)
    clampPan()
    applyTransform()
    return
  }
  if (gesture.mode !== 'draw' || activeTouchId === null || !drawing) return
  let t: Touch | null = null
  for (let i = 0; i < e.changedTouches.length; i++) {
    if (e.changedTouches[i]!.identifier === activeTouchId) {
      t = e.changedTouches[i]!
      break
    }
  }
  if (!t) return
  const ring = cursorRing.value
  if (ring) {
    ring.style.left = `${t.clientX}px`
    ring.style.top = `${t.clientY}px`
  }
  const p = getPosFromClient(t.clientX, t.clientY, t.force && t.force > 0 ? t.force : 1)
  continueStroke(p)
}

function onTouchEnd(e: TouchEvent) {
  if (gesture.mode === 'pinch') {
    if (e.touches.length < 2) gesture.mode = null
    return
  }
  if (activeTouchId === null) return
  let ended = false
  for (let i = 0; i < e.changedTouches.length; i++) {
    if (e.changedTouches[i]!.identifier === activeTouchId) {
      ended = true
      break
    }
  }
  if (!ended) return
  activeTouchId = null
  gesture.mode = null
  if (!drawing) return
  drawing = false
  drawCtx!.globalCompositeOperation = 'source-over'
  drawCtx!.globalAlpha = 1
  saveHistory()
}

function beginStroke(p: PaintPos) {
  if (tool.value === 'fill') {
    floodFill(Math.round(p.x), Math.round(p.y))
    saveHistory()
    return
  }
  drawing = true
  lastX = p.x
  lastY = p.y
  if (tool.value === 'pencil') {
    drawCtx!.globalCompositeOperation = 'source-over'
    drawCtx!.globalAlpha = Math.min(0.85, opacity.value * 0.88) * p.pressure
    drawCtx!.fillStyle = color.value
    drawCtx!.beginPath()
    drawCtx!.arc(p.x, p.y, brushSize.value * 0.38 * p.pressure, 0, Math.PI * 2)
    drawCtx!.fill()
    drawCtx!.globalAlpha = 1
  } else {
    drawCtx!.save()
    applyStyle(p)
    const r = (drawCtx!.lineWidth || brushSize.value * p.pressure) / 2
    drawCtx!.beginPath()
    drawCtx!.arc(p.x, p.y, r, 0, Math.PI * 2)
    drawCtx!.fill()
    drawCtx!.restore()
  }
  if (tool.value === 'graphite') graphiteTexture(p.x, p.y, p)
  if (tool.value === 'watercolor') watercolorBlob(p.x, p.y, p)
}

function continueStroke(p: PaintPos) {
  if (tool.value === 'pencil') {
    crayonStroke(lastX, lastY, p.x, p.y, p.pressure)
  } else {
    drawCtx!.save()
    applyStyle(p)
    drawCtx!.beginPath()
    drawCtx!.moveTo(lastX, lastY)
    drawCtx!.lineTo(p.x, p.y)
    drawCtx!.stroke()
    drawCtx!.restore()
    if (tool.value === 'graphite') {
      const dist = Math.hypot(p.x - lastX, p.y - lastY)
      const steps = Math.max(1, Math.floor(dist / 4))
      for (let i = 0; i < steps; i++) {
        const t = i / steps
        graphiteTexture(lastX + (p.x - lastX) * t, lastY + (p.y - lastY) * t, {
          x: 0,
          y: 0,
          pressure: p.pressure * 0.35
        })
      }
    }
    if (tool.value === 'watercolor') watercolorBlob(p.x, p.y, p)
  }
  lastX = p.x
  lastY = p.y
}

// ── History ----------------------------------------------------------------

function saveHistory() {
  const dc = drawCanvas.value
  if (!dc || !drawCtx) return
  historyStack = historyStack.slice(0, historyIdx + 1)
  historyStack.push(drawCtx.getImageData(0, 0, dc.width, dc.height))
  if (historyStack.length > MAX_HIST) historyStack.shift()
  historyIdx = historyStack.length - 1
  refreshHistButtons()
  // The user just committed something — undo/redo/clear all go through here,
  // so this is the single place we flip the unsaved-changes flag.
  hasUserAction.value = true
}

function resetHistory() {
  const dc = drawCanvas.value
  if (!dc || !drawCtx) return
  historyStack = [drawCtx.getImageData(0, 0, dc.width, dc.height)]
  historyIdx = 0
  refreshHistButtons()
  // Loading a fresh image is a clean slate — drop the dirty flag.
  hasUserAction.value = false
}

function refreshHistButtons() {
  canUndo.value = historyIdx > 0
  canRedo.value = historyIdx < historyStack.length - 1
}

function undo() {
  if (historyIdx <= 0) return
  historyIdx--
  const dc = drawCanvas.value!
  drawCtx!.clearRect(0, 0, dc.width, dc.height)
  drawCtx!.putImageData(historyStack[historyIdx]!, 0, 0)
  refreshHistButtons()
}

function redo() {
  if (historyIdx >= historyStack.length - 1) return
  historyIdx++
  const dc = drawCanvas.value!
  drawCtx!.clearRect(0, 0, dc.width, dc.height)
  drawCtx!.putImageData(historyStack[historyIdx]!, 0, 0)
  refreshHistButtons()
}

function clearAll() {
  if (!hasImage.value) return
  if (!confirm('Alle Farben löschen?')) return
  const dc = drawCanvas.value!
  drawCtx!.clearRect(0, 0, dc.width, dc.height)
  delete pageDrawings[currentPage.value]
  saveHistory()
}

function buildExportFilename(): string {
  return `Ausmalbild_S${currentPage.value}_${new Date().toISOString().slice(0, 10)}.png`
}

function flattenCanvas(): HTMLCanvasElement | null {
  const bg = bgCanvas.value, dc = drawCanvas.value
  if (!bg || !dc || !hasImage.value) return null
  const out = document.createElement('canvas')
  out.width = bg.width
  out.height = bg.height
  const oCtx = out.getContext('2d')!
  oCtx.drawImage(bg, 0, 0)
  oCtx.drawImage(dc, 0, 0)
  return out
}

function downloadPng() {
  const out = flattenCanvas()
  if (!out) return
  // The iOS app's WKWebView ignores `<a download>` — the tap would do
  // nothing — so the picture goes straight into Photos instead.
  if (isIOS) {
    void saveToPhotos(out)
    return
  }
  const a = document.createElement('a')
  a.download = buildExportFilename()
  a.href = out.toDataURL('image/png')
  a.click()
}

// Short confirmation under the header after a save to Photos. One message at
// a time; a new one restarts the timer.
const saveNotice = ref<'saved' | 'denied' | null>(null)
let saveNoticeTimer: ReturnType<typeof setTimeout> | undefined

function showSaveNotice(kind: 'saved' | 'denied') {
  saveNotice.value = kind
  clearTimeout(saveNoticeTimer)
  saveNoticeTimer = setTimeout(() => { saveNotice.value = null }, kind === 'saved' ? 2500 : 5000)
}

async function saveToPhotos(out: HTMLCanvasElement) {
  const data = out.toDataURL('image/png').split(',')[1]
  try {
    const { invoke } = await import('@tauri-apps/api/core')
    const res = await invoke<{ status: 'saved' | 'denied' }>('plugin:save-photo|save', { data })
    showSaveNotice(res.status)
  } catch (err) {
    // The plugin is missing (an older build) or Photos refused the write —
    // the share sheet still lets the user save or send the picture.
    console.warn('save to Photos failed', err)
    void shareCanvas()
  }
}

// Web Share API surfaces the OS share sheet — WhatsApp, Telegram, Mail,
// AirDrop, etc. — so kids can ping the finished artwork to a parent in one
// tap. We feature-detect at runtime; on browsers without `canShare({files})`
// (older Firefox, desktop without sharing), the button stays hidden and the
// regular Save still works.
const canShareCanvas = ref(
  typeof navigator !== 'undefined' &&
  typeof navigator.canShare === 'function' &&
  typeof navigator.share === 'function'
)

async function shareCanvas() {
  const out = flattenCanvas()
  if (!out) return
  const blob: Blob | null = await new Promise((resolve) =>
    out.toBlob((b) => resolve(b), 'image/png')
  )
  if (!blob) return
  const file = new File([blob], buildExportFilename(), { type: 'image/png' })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: 'Mein Ausmalbild',
        text: 'Mein Ausmalbild aus der LambKing-App'
      })
    } catch (err) {
      // AbortError = user dismissed the share sheet — silent.
      if ((err as Error).name !== 'AbortError') {
        console.warn('share failed', err)
      }
    }
  } else {
    // Sharing files isn't supported (Safari sometimes blocks file shares
    // over http) — fall back to a plain download.
    downloadPng()
  }
}

// ── Minibar ----------------------------------------------------------------

function showMinibar() {
  if (minibarVisible.value) return
  // Default position sits just above the sticky fullscreen toggle in
  // the bottom-right corner so the two don't visually fight on first
  // open. The toolbox stays freely draggable afterwards.
  minibarPos.value = {
    left: window.innerWidth - 68,
    top: window.innerHeight - 68 - 64
  }
  minibarVisible.value = true
}

const mb = {
  active: false,
  dragging: false,
  pointerId: -2,
  startX: 0,
  startY: 0,
  offsetX: 0,
  offsetY: 0,
  moved: false,
  timer: null as ReturnType<typeof setTimeout> | null
}
const DRAG_THRESHOLD = 5
const LONG_PRESS_MS = 260

function clampMinibar(left: number, top: number) {
  const el = minibarRoot.value
  if (!el) return
  const r = el.getBoundingClientRect()
  const pad = 6
  const x = Math.max(pad, Math.min(left, window.innerWidth - r.width - pad))
  const y = Math.max(pad, Math.min(top, window.innerHeight - r.height - pad))
  minibarPos.value = { left: x, top: y }
}

function mbStart(clientX: number, clientY: number, pointerId: number) {
  const el = minibarRoot.value
  if (!el) return
  mb.active = true
  mb.moved = false
  mb.dragging = false
  mb.pointerId = pointerId
  const r = el.getBoundingClientRect()
  mb.offsetX = clientX - r.left
  mb.offsetY = clientY - r.top
  mb.startX = clientX
  mb.startY = clientY
  if (!minibarCollapsed.value) {
    mb.dragging = true
    minibarDragging.value = true
  } else {
    mb.timer = setTimeout(() => {
      if (!mb.active) return
      mb.dragging = true
      minibarDragging.value = true
    }, LONG_PRESS_MS)
  }
}

function mbMove(clientX: number, clientY: number) {
  if (!mb.active) return
  const dx = clientX - mb.startX, dy = clientY - mb.startY
  if (!mb.moved && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
    mb.moved = true
    if (minibarCollapsed.value && mb.timer) {
      clearTimeout(mb.timer)
      mb.timer = null
      mb.dragging = true
      minibarDragging.value = true
    }
  }
  if (!mb.dragging) return
  clampMinibar(clientX - mb.offsetX, clientY - mb.offsetY)
}

function mbEnd() {
  if (!mb.active) return
  if (mb.timer) {
    clearTimeout(mb.timer)
    mb.timer = null
  }
  const wasDrag = mb.dragging
  mb.active = false
  mb.dragging = false
  mb.pointerId = -2
  minibarDragging.value = false
  if (minibarCollapsed.value && !wasDrag && !mb.moved) {
    expandMinibar()
  }
}

function expandMinibar() {
  minibarCollapsed.value = false
  void nextTick(() => {
    const el = minibarRoot.value
    if (!el) return
    const r = el.getBoundingClientRect()
    clampMinibar(r.left, r.top)
  })
}

function collapseMinibar() {
  minibarCollapsed.value = true
  void nextTick(() => {
    const el = minibarRoot.value
    if (!el) return
    const r = el.getBoundingClientRect()
    clampMinibar(r.left, r.top)
  })
}

function onMinibarHandleDown(e: PointerEvent) {
  e.stopPropagation()
  mbStart(e.clientX, e.clientY, e.pointerId)
}

function onMinibarHandleTouchStart(e: TouchEvent) {
  e.stopPropagation()
  const t = e.touches[0]
  if (t) mbStart(t.clientX, t.clientY, -1)
}

function onDocPointerMove(e: PointerEvent) {
  if (!mb.active) return
  if (mb.pointerId !== -1 && mb.pointerId !== e.pointerId) return
  if (mb.dragging) e.preventDefault()
  mbMove(e.clientX, e.clientY)
}

function onDocTouchMove(e: TouchEvent) {
  if (!mb.active || mb.pointerId !== -1) return
  const t = e.touches[0]
  if (!t) return
  if (mb.dragging) e.preventDefault()
  mbMove(t.clientX, t.clientY)
}

function onDocPointerUp(e: PointerEvent) {
  if (!mb.active) return
  if (mb.pointerId !== -1 && mb.pointerId !== e.pointerId) return
  mbEnd()
}

function onDocTouchEnd() {
  if (!mb.active || mb.pointerId !== -1) return
  mbEnd()
}

function onOutsidePointerDown(e: PointerEvent) {
  if (minibarCollapsed.value) return
  if (!minibarVisible.value) return
  const el = minibarRoot.value
  if (!el) return
  if (el.contains(e.target as Node)) return
  collapseMinibar()
}

function enterFullscreen() {
  isFullscreen.value = true
  void nextTick(fitCanvas)
}

function exitFullscreen() {
  isFullscreen.value = false
  void nextTick(fitCanvas)
}

function toggleFullscreen() {
  if (isFullscreen.value) exitFullscreen()
  else enterFullscreen()
}

// ── File upload --------------------------------------------------------------

function pickFile() {
  fileInput.value?.click()
}

function onFileInput(e: Event) {
  const inp = e.target as HTMLInputElement
  const f = inp.files?.[0]
  if (f) void openFile(f)
  inp.value = ''
}

function onMainDragOver(e: DragEvent) {
  e.preventDefault()
  dropOver.value = true
}

function onMainDragLeave(e: DragEvent) {
  if (!(e.currentTarget as Element).contains(e.relatedTarget as Node)) {
    dropOver.value = false
  }
}

function onMainDrop(e: DragEvent) {
  e.preventDefault()
  dropOver.value = false
  const f = e.dataTransfer?.files?.[0]
  if (f) void openFile(f)
}

function onColorPickerInput(e: Event) {
  pickCustom((e.target as HTMLInputElement).value)
}

// ── Lifecycle --------------------------------------------------------------

// SPA navigation guard — pause and surface the modal when there are
// uncommitted changes; the user's choice resolves through `confirmLeave` /
// `cancelLeave`.
onBeforeRouteLeave((_to, _from, next) => {
  if (!hasUserAction.value) {
    next()
    return
  }
  pendingLeave = () => next()
  showLeaveConfirm.value = true
  next(false)
})

let mainResizeObserver: ResizeObserver | null = null

onMounted(() => {
  bgCtx = bgCanvas.value?.getContext('2d') ?? null
  drawCtx = drawCanvas.value?.getContext('2d', { willReadFrequently: true }) ?? null
  window.addEventListener('resize', onResize)
  window.addEventListener('orientationchange', onResize)
  window.addEventListener('beforeunload', onBeforeUnload)
  document.addEventListener('pointermove', onDocPointerMove)
  document.addEventListener('touchmove', onDocTouchMove, { passive: false })
  document.addEventListener('pointerup', onDocPointerUp)
  document.addEventListener('touchend', onDocTouchEnd)
  document.addEventListener('pointercancel', onDocPointerUp)
  document.addEventListener('touchcancel', onDocTouchEnd)
  document.addEventListener('pointerdown', onOutsidePointerDown, { capture: true })

  // Observe the canvas main area so the artwork re-fits whenever the
  // area's size changes — covers initial layout settle (deferred
  // address-bar collapse, dvh recalc), fullscreen toggles, and any
  // future chrome that shrinks/grows the row. Catches cases the 4-frame
  // retry in `fitCanvas` would otherwise give up on.
  if (typeof ResizeObserver !== 'undefined' && mainEl.value) {
    mainResizeObserver = new ResizeObserver(() => {
      if (hasImage.value) fitCanvas()
    })
    mainResizeObserver.observe(mainEl.value)
  }

  updateCursorRing()

  if (querySource.value && querySourceType.value) {
    void loadFromUrl(querySource.value, querySourceType.value as 'image' | 'pdf')
  }
})
onBeforeUnmount(() => {
  clearTimeout(saveNoticeTimer)
  mainResizeObserver?.disconnect()
  mainResizeObserver = null
  window.removeEventListener('resize', onResize)
  window.removeEventListener('orientationchange', onResize)
  window.removeEventListener('beforeunload', onBeforeUnload)
  document.removeEventListener('pointermove', onDocPointerMove)
  document.removeEventListener('touchmove', onDocTouchMove)
  document.removeEventListener('pointerup', onDocPointerUp)
  document.removeEventListener('touchend', onDocTouchEnd)
  document.removeEventListener('pointercancel', onDocPointerUp)
  document.removeEventListener('touchcancel', onDocTouchEnd)
  document.removeEventListener('pointerdown', onOutsidePointerDown, true)
})

watch([tool, brushSize, color], updateCursorRing)
watch([querySource, querySourceType], ([url, type]) => {
  if (url && (type === 'image' || type === 'pdf')) void loadFromUrl(url, type as 'image' | 'pdf')
})
</script>

<template lang="pug">
  div(
    class="ac-app"
    :class="{ 'is-fullscreen': isFullscreen }"
    :style="backdropVars"
  )
    header(class="ac-hdr")
      //- Shared back button matches the rest of the app (parchment glyph
      //- on a flat cream surface). Goes through the router so the
      //- unsaved-changes guard can intercept and prompt.
      ZBackButton(
        variant="flat"
        :size="40"
        class="ac-back-btn"
        :aria-label="t('app.coloring.back')"
        @click="onBack"
      )
      div(class="ac-title") {{ t('app.coloring.title') }}

      div(class="ac-pages" v-if="pdfDoc && totalPages > 1")
        button(class="ac-pg-btn" :disabled="currentPage <= 1" @click="gotoPage(-1)") ‹
        span(class="ac-pg-info") {{ currentPage }} / {{ totalPages }}
        button(class="ac-pg-btn" :disabled="currentPage >= totalPages" @click="gotoPage(1)") ›

      div(class="ac-spacer")

      //- Quick-tools strip — always visible top-right so kids don't have
      //- to reopen the toolbox to switch between fill / pencil / eraser.
      div(class="ac-quick" v-if="hasImage")
        button(
          type="button"
          class="ac-q"
          :class="{ active: tool === 'fill' }"
          :title="t('app.coloring.toolFill')"
          @click="tool = 'fill'"
        )
          svg(viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round")
            path(d="M8 4 C 8 1.5, 16 1.5, 16 4")
            path(d="M5 5 L19 5 L17 19 C 17 20.5, 7 20.5, 7 19 Z" fill="currentColor" fill-opacity=".18")
            ellipse(cx="12" cy="5" rx="7" ry="1.2" fill="currentColor" fill-opacity=".3")
            circle(cx="20" cy="15" r="1.3" fill="currentColor" stroke="none")
        button(
          type="button"
          class="ac-q"
          :class="{ active: tool === 'pencil' }"
          :title="t('app.coloring.toolPencil')"
          @click="tool = 'pencil'"
        )
          svg(viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round")
            path(d="m18 2 4 4-14 14H4v-4Z")
            path(d="m14.5 5.5 4 4")
        button(
          type="button"
          class="ac-q ac-q-eraser"
          :class="{ active: tool === 'eraser' }"
          :title="t('app.coloring.toolEraser')"
          @click="tool = 'eraser'"
        )
          svg(viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round")
            rect(x="2" y="8" width="20" height="11" rx="2.5")
            line(x1="8" y1="8" x2="8" y2="19")
            line(x1="2" y1="14.5" x2="22" y2="14.5" stroke-width="1" opacity=".45")

      div(class="ac-actions")
        button(class="ac-h-btn" :disabled="!canUndo" :title="t('app.coloring.undo')" @click="undo")
          svg(viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round")
            path(d="M3 7v6h6")
            path(d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6.7 2.9L3 13")
        button(class="ac-h-btn" :disabled="!canRedo" :title="t('app.coloring.redo')" @click="redo")
          svg(viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round")
            path(d="M21 7v6h-6")
            path(d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6.7 2.9L21 13")
        button(
          v-if="canShareCanvas"
          class="ac-h-btn"
          :disabled="!hasImage"
          :title="t('app.coloring.share')"
          @click="shareCanvas"
        )
          svg(viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round")
            circle(cx="18" cy="5" r="3")
            circle(cx="6" cy="12" r="3")
            circle(cx="18" cy="19" r="3")
            line(x1="8.6" y1="13.5" x2="15.4" y2="17.5")
            line(x1="15.4" y1="6.5" x2="8.6" y2="10.5")
        button(class="ac-h-btn ac-save" :disabled="!hasImage" :title="t('app.coloring.savePng')" @click="downloadPng")
          svg(viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round")
            path(d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4")
            polyline(points="7 10 12 15 17 10")
            line(x1="12" y1="15" x2="12" y2="3")

    main(
      ref="mainEl"
      class="ac-main"
      :class="{ 'drop-over': dropOver }"
      @dragover.prevent="onMainDragOver"
      @dragleave="onMainDragLeave"
      @drop="onMainDrop"
    )
      div(
        v-show="!hasImage"
        class="ac-upload"
      )
        div(class="ac-upload-icon") 🖼️
        div(class="ac-upload-title") {{ t('app.coloring.emptyTitle') }}
        div(class="ac-upload-text") {{ t('app.coloring.uploadHint') }}
        button(type="button" class="ac-upload-btn" @click="pickFile")
          svg(viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round")
            path(d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4")
            polyline(points="17 8 12 3 7 8")
            line(x1="12" y1="3" x2="12" y2="15")
          | {{ t('app.coloring.uploadButton') }}

      div(
        ref="canvasWrap"
        class="ac-canvas-wrap"
        :class="{ active: hasImage }"
      )
        canvas(ref="bgCanvas" class="ac-bg")
        canvas(
          ref="drawCanvas"
          class="ac-draw"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerEnd"
          @pointercancel="onPointerEnd"
          @pointerleave="onPointerLeaveCanvas"
          @touchstart.prevent="onTouchStart"
          @touchmove.prevent="onTouchMove"
          @touchend.prevent="onTouchEnd"
          @touchcancel.prevent="onTouchEnd"
        )
        div(v-show="isLoading" class="ac-loading")
          div(class="ac-spinner")
          div(class="ac-loading-txt") {{ t('app.coloring.loading') }}

    //- ───────── Floating minibar — full toolbox ─────────
    div(
      v-if="minibarVisible"
      ref="minibarRoot"
      class="ac-minibar"
      :class="{ collapsed: minibarCollapsed, dragging: minibarDragging }"
      :style="{ left: minibarPos.left + 'px', top: minibarPos.top + 'px' }"
    )
      div(
        class="ac-mb-handle"
        @pointerdown="onMinibarHandleDown"
        @touchstart.passive="onMinibarHandleTouchStart"
      )
        div(class="ac-mb-color-dot" :style="{ background: color }")

      div(class="ac-mb-panel" v-show="!minibarCollapsed")
        div(
          class="ac-mb-dragbar"
          @pointerdown="onMinibarHandleDown"
          @touchstart.passive="onMinibarHandleTouchStart"
        )
          div(class="ac-mb-grip")
            span
            span
            span
          span(class="ac-mb-label") {{ t('app.coloring.toolbox') }}
          button(
            type="button"
            class="ac-mb-x"
            :title="t('app.coloring.minimize')"
            @click.stop="collapseMinibar"
          )
            svg(viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round")
              polyline(points="6 9 12 15 18 9")

        div(
          class="ac-mb-pal"
          :class="{ 'is-graphite': isGraphitePal }"
          v-if="palette.length"
        )
          button(
            v-for="c in palette"
            :key="c"
            type="button"
            class="ac-sw"
            :class="{ active: isPresetActive(c) }"
            :style="{ background: c }"
            :title="c"
            @click="pickPreset(c)"
          )
          button(
            v-if="!isGraphitePal"
            type="button"
            class="ac-sw ac-sw-rainbow"
            :class="{ active: !!customColor }"
            :title="t('app.coloring.customColor')"
            :style="customColor ? { background: customColor } : undefined"
            @click="colorPickerEl?.click()"
          )

        div(class="ac-mb-tools")
          button(
            type="button"
            class="ac-tb"
            :class="{ active: tool === 'felt' }"
            @click="tool = 'felt'"
          )
            svg(viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round")
              path(d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z")
            | {{ t('app.coloring.toolFelt') }}
          button(
            type="button"
            class="ac-tb"
            :class="{ active: tool === 'watercolor' }"
            @click="tool = 'watercolor'"
          )
            svg(viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round")
              path(d="M3 21 L15 9" stroke-width="1.8")
              path(d="M5 21 L17 9" stroke-width="1.8")
              path(d="M14 8 L17 11 L19.5 8.5 L16.5 5.5 Z" fill="currentColor" stroke="currentColor")
              path(d="M17 5.5 Q 21 4, 21.5 2.5 Q 19 2, 16.5 5.5 Z" fill="currentColor" stroke="currentColor")
            | {{ t('app.coloring.toolWatercolor') }}
          button(
            type="button"
            class="ac-tb"
            :class="{ active: tool === 'pencil' }"
            @click="tool = 'pencil'"
          )
            svg(viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round")
              path(d="m18 2 4 4-14 14H4v-4Z")
              path(d="m14.5 5.5 4 4")
            | {{ t('app.coloring.toolPencil') }}
          button(
            type="button"
            class="ac-tb"
            :class="{ active: tool === 'graphite' }"
            @click="tool = 'graphite'"
          )
            svg(viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round")
              path(d="M12 20h9")
              path(d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z")
            | {{ t('app.coloring.toolGraphite') }}
          button(
            type="button"
            class="ac-tb"
            :class="{ active: tool === 'fill' }"
            @click="tool = 'fill'"
          )
            svg(viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round")
              path(d="M8 4 C 8 1.5, 16 1.5, 16 4")
              path(d="M5 5 L19 5 L17 19 C 17 20.5, 7 20.5, 7 19 Z" fill="currentColor" fill-opacity=".15")
              ellipse(cx="12" cy="5" rx="7" ry="1.2" fill="currentColor" fill-opacity=".3")
              circle(cx="20" cy="15" r="1.3" fill="currentColor" stroke="none")
            | {{ t('app.coloring.toolFill') }}
          button(
            type="button"
            class="ac-tb ac-tb-eraser"
            :class="{ active: tool === 'eraser' }"
            @click="tool = 'eraser'"
          )
            svg(viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round")
              rect(x="2" y="8" width="20" height="11" rx="2.5")
              line(x1="8" y1="8" x2="8" y2="19")
            | {{ t('app.coloring.toolEraser') }}

        div(class="ac-mb-sliders")
          div(class="ac-sl-group")
            div(class="ac-sl-label")
              | {{ t('app.coloring.size') }}
              b {{ Math.round(brushSize) }}
            input(type="range" min="1" max="100" v-model.number="brushSize")
          div(class="ac-sl-group")
            div(class="ac-sl-label")
              | {{ t('app.coloring.transparency') }}
              b {{ alphaSliderValue }}%
            input(type="range" min="0" max="95" v-model.number="alphaSliderValue")

        div(class="ac-mb-acts")
          button(class="ac-act-btn" :disabled="!canUndo" @click="undo")
            svg(viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round")
              path(d="M3 7v6h6")
              path(d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6.7 2.9L3 13")
            | {{ t('app.coloring.undo') }}
          button(class="ac-act-btn" :disabled="!canRedo" @click="redo")
            svg(viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round")
              path(d="M21 7v6h-6")
              path(d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6.7 2.9L21 13")
            | {{ t('app.coloring.redo') }}
          button(class="ac-act-btn danger" :disabled="!hasImage" @click="clearAll")
            svg(viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round")
              path(d="M20 5H9l-7 7 7 7h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z")
              line(x1="18" y1="9" x2="12" y2="15")
              line(x1="12" y1="9" x2="18" y2="15")
            | {{ t('app.coloring.clear') }}

        div(class="ac-mb-fs-row")
          button(class="ac-fs-btn enter" v-if="!isFullscreen" @click="enterFullscreen")
            svg(viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round")
              path(d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3")
            | {{ t('app.coloring.fullscreen') }}
          button(class="ac-fs-btn exit" v-else @click="exitFullscreen")
            svg(viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round")
              path(d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7")
            | {{ t('app.coloring.fullscreenExit') }}

    //- ───────── Sticky fullscreen toggle ─────────
    //- Lives outside the grid so it stays pinned to the bottom-right of
    //- the viewport in both the normal and fullscreen layouts. The same
    //- button toggles in either direction.
    button(
      type="button"
      class="ac-fs-floating"
      :class="{ 'is-on': isFullscreen }"
      :aria-label="isFullscreen ? t('app.coloring.fullscreenExit') : t('app.coloring.fullscreen')"
      :title="isFullscreen ? t('app.coloring.fullscreenExit') : t('app.coloring.fullscreen')"
      @click="toggleFullscreen"
    )
      svg(
        v-if="!isFullscreen"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
      )
        path(d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3")
      svg(
        v-else
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
      )
        path(d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7")

    transition(name="ac-notice")
      p(
        v-if="saveNotice"
        :class="['ac-save-notice', { 'is-denied': saveNotice === 'denied' }]"
        role="status"
      ) {{ t(saveNotice === 'saved' ? 'app.coloring.savedToPhotos' : 'app.coloring.photosDenied') }}

    div(ref="cursorRing" class="ac-cursor-ring")

    input(
      ref="fileInput"
      type="file"
      accept="application/pdf,image/*"
      class="ac-vh"
      @change="onFileInput"
    )
    input(
      ref="colorPickerEl"
      type="color"
      class="ac-vh"
      :value="customColor || color"
      @input="onColorPickerInput"
      @change="onColorPickerInput"
    )

    //- ===== Unsaved-changes confirmation modal =====
    div(
      v-if="showLeaveConfirm"
      class="ac-confirm-overlay"
      role="dialog"
      aria-modal="true"
      @click.self="cancelLeave"
    )
      div(class="ac-confirm-dialog")
        h2(class="ac-confirm-title") {{ t('app.coloring.leaveTitle') }}
        p(class="ac-confirm-body") {{ t('app.coloring.leaveBody') }}
        div(class="ac-confirm-actions")
          button(type="button" class="ac-confirm-stay" @click="cancelLeave") {{ t('app.coloring.leaveStay') }}
          button(type="button" class="ac-confirm-leave" @click="confirmLeave") {{ t('app.coloring.leaveDiscard') }}
</template>

<style scoped lang="sass">
// LambKing parchment palette. Variable names kept as `$p*` to minimise
// churn — they're sprinkled across hundreds of rules below.
//   $p / $p-dark / $p-mid → navy primary (used for action gradients)
//   $p-bg / $p-pale       → cream parchment surfaces
//   $p-bdr                → warm border
//   $text / $text-m / $text-l → navy + warm-brown text tones
$p: #21406a
$p-dark: #142a47
$p-mid: #2b4d7a
$p-bg: #f3e6c4
$p-pale: #fdf8ed
$p-bdr: #e6d6b5
$text: #1a2f4a
$text-m: #7a6b55
$text-l: #a08962

// `100dvh` follows mobile address-bar collapse/expand; the static `100vh`
// is the iOS<15.4 fallback. Padding-bottom carves out the bottom nav (and
// home-indicator safe area) inside the grid so the canvas never sits under
// the nav. In fullscreen mode the nav is hidden, so we drop the padding.
// The coloring view owns the full viewport — no bottom-nav reservation,
// no edge padding. The header sits flush at the top (the safe-area inset
// only adds the iOS notch reserve, nothing else); the canvas main area
// fills the rest edge-to-edge so kids paint right up to the device frame.
// The backdrop illustration is `contain`-fitted so it is *never* cropped by
// a viewport edge, whatever the screen ratio — the leftover strip on the
// short axis falls back to the cream parchment colour. The two artworks
// (tall / wide) come in as custom properties from the component so the
// production base-url stays correct; the orientation swap is pure CSS.
.ac-app
  position: fixed
  inset: 0
  display: grid
  grid-template-rows: auto 1fr
  background-color: $p-bg
  background-image: var(--ac-bg-portrait)
  background-repeat: no-repeat
  background-position: center
  background-size: cover
  color: $text
  user-select: none
  overflow: hidden
  height: 100vh
  height: 100dvh

@media (orientation: landscape)
  .ac-app
    background-image: var(--ac-bg-landscape)

.ac-app.is-fullscreen .ac-hdr
  // Take the header out of the grid flow so .ac-main can stretch to
  // the full viewport, then float it back on top as a translucent
  // strip so the back / undo / save controls are still reachable.
  position: absolute
  top: 0
  left: 0
  right: 0
  z-index: 50
  background: transparent
  //backdrop-filter: blur(10px)
  -webkit-backdrop-filter: blur(10px)
  border-bottom: 0px solid rgba(230, 214, 181, 0.5)

// Cream parchment header — same surface as the rest of the app so the
// coloring screen reads as a continuation of LambKing's design.
.ac-hdr
  background: transparent
  border-bottom: 1px solid $p-bdr
  display: flex
  align-items: center
  gap: 8px
  min-height: 52px
  padding: 8px 12px
  padding-top: max(env(safe-area-inset-top, 0px), 8px)

// `.ac-back-btn` is now a styling hook for the shared ZBackButton; the
// component already paints itself with the parchment palette so we only
// need the position marker.
.ac-back-btn
  flex-shrink: 0
  //color: $text!important
  --back-icon-color: #1a2f4a !important

.ac-title
  font-weight: 700
  font-size: 1.05rem
  color: $text
  flex-shrink: 0

.ac-pages
  display: flex
  align-items: center
  gap: 5px
  flex-shrink: 0

// Cream pill buttons matching the rest of the app's flat-cream surface.
.ac-pg-btn
  width: 28px
  height: 28px
  border-radius: 50%
  background: $p-pale
  border: 1px solid $p-bdr
  color: $text
  font-size: 0.9rem
  font-weight: 700
  cursor: pointer
  transition: background 0.13s, transform 0.1s

  &:hover
    background: #ffffff

  &:active
    transform: scale(0.94)

  &:disabled
    opacity: 0.35
    cursor: default

.ac-pg-info
  font-size: 0.78rem
  color: $text-m
  font-weight: 700

.ac-spacer
  flex: 1

.ac-quick
  display: flex
  gap: 5px

.ac-q
  width: 32px
  height: 32px
  border-radius: 10px
  background: $p-pale
  border: 1px solid $p-bdr
  color: $text
  cursor: pointer
  display: grid
  place-items: center
  transition: background 0.13s, transform 0.1s

  &:hover
    background: #ffffff

  &:active
    transform: scale(0.94)

  // Active tool — solid navy pill with cream icon, mirrors the "Lesen"
  // button's primary look elsewhere in the app.
  &.active
    background: linear-gradient(180deg, $p 0%, $p-dark 100%)
    color: #ffffff
    border-color: $p-dark
    box-shadow: 0 4px 10px -4px rgba(10, 26, 48, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.18)

  svg
    width: 16px
    height: 16px

// Eraser keeps the wine-red accent so it reads as the destructive tool.
.ac-q-eraser.active
  background: linear-gradient(180deg, #b94535 0%, #8e2f23 100%)
  color: #ffffff
  border-color: #5b1a12
  box-shadow: 0 4px 10px -4px rgba(91, 26, 18, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.18)

.ac-actions
  display: flex
  gap: 5px

.ac-h-btn
  width: 32px
  height: 32px
  border-radius: 50%
  background: $p-pale
  border: 1px solid $p-bdr
  color: $text
  display: grid
  place-items: center
  cursor: pointer
  transition: background 0.13s, transform 0.1s

  &:hover
    background: #ffffff

  &:active
    transform: scale(0.94)

  &:disabled
    opacity: 0.35
    cursor: not-allowed

  svg
    width: 15px
    height: 15px

  // "Save" stands out as a navy primary so it reads as the commit action.
  &.ac-save
    background: linear-gradient(180deg, $p 0%, $p-dark 100%)
    color: #ffffff
    border-color: $p-dark
    box-shadow: 0 4px 10px -4px rgba(10, 26, 48, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.18)

// Transparent so the .ac-app backdrop illustration shows through the whole
// canvas area (the canvas wrap itself only covers the artwork's own box).
.ac-main
  position: relative
  overflow: hidden
  background: transparent
  padding: 0

.ac-app.is-fullscreen .ac-main
  // Lift .ac-main out of the grid in fullscreen so it covers the entire
  // viewport directly — the `auto 1fr` grid was sometimes leaving an
  // implicit-sized first track even though the header is absolutely
  // positioned, which pushed the canvas wrap down by ~50 px and left a
  // dead cream strip across the bottom of the artwork. inset:0 makes
  // the box edge-to-edge with the .ac-app (which is itself fixed inset:0).
  position: absolute
  inset: 0
  padding: 0
  background: transparent

.ac-main.drop-over::after
  content: '🎨'
  position: absolute
  inset: 0
  background: rgba(33, 64, 106, 0.07)
  border: 3px dashed $p-mid
  border-radius: 12px
  display: flex
  align-items: center
  justify-content: center
  font-size: 1rem
  font-weight: 700
  color: $p
  z-index: 50
  pointer-events: none

.ac-upload
  position: absolute
  top: 50%
  left: 50%
  transform: translate(-50%, -50%)
  display: flex
  flex-direction: column
  align-items: center
  text-align: center
  max-width: 340px
  padding: 28px 22px
  background: #fff
  border-radius: 24px
  opacity: 0.8
  box-shadow: 0 8px 32px rgba(33, 64, 106, 0.22)

.ac-upload-icon
  width: 64px
  height: 64px
  border-radius: 18px
  background: $p-bg
  display: grid
  place-items: center
  font-size: 32px
  margin-bottom: 14px

.ac-upload-title
  font-weight: 700
  font-size: 1.3rem
  margin-bottom: 6px

.ac-upload-text
  color: $text-m
  font-size: 0.85rem
  margin-bottom: 18px

.ac-upload-btn
  display: inline-flex
  align-items: center
  gap: 8px
  padding: 12px 26px
  border-radius: 50px
  background: linear-gradient(135deg, $p-dark, $p-mid)
  color: #fff
  border: none
  cursor: pointer
  font: inherit
  font-weight: 700
  font-size: 0.92rem
  box-shadow: 0 4px 16px rgba(33, 64, 106, 0.38)

  svg
    width: 15px
    height: 15px

.ac-canvas-wrap
  position: relative
  display: none
  // No border-radius — coloring sheets should sit edge-to-edge with
  // square corners so the kid's lines reach the paper boundary instead
  // of being clipped into a rounded mask.
  overflow: hidden
  box-shadow: 0 8px 40px rgba(33, 64, 106, 0.22)
  transform-origin: 0 0
  will-change: transform
  touch-action: none

  &.active
    display: block

// Both canvases must lay out at the wrap's pixel size, not their internal
// resolution. The internal `<canvas width="…" height="…">` keeps the
// rasterisation grid at the source image's true resolution (so flood-fill,
// pixel reads, and PNG export are pixel-perfect), while the CSS sizing
// scales the displayed bitmap to whatever the wrap was fitted to. Without
// `width: 100% / height: 100%` on `.ac-bg`, the bg canvas would render at
// its intrinsic 4096-ish pixel size and overflow the wrap — that's why the
// art looked "original size" before.
.ac-bg
  display: block
  width: 100%
  height: 100%

.ac-draw
  position: absolute
  inset: 0
  display: block
  width: 100%
  height: 100%
  touch-action: none
  -webkit-user-select: none
  user-select: none
  cursor: none

.ac-loading
  position: absolute
  inset: 0
  background: rgba(245, 240, 255, 0.92)
  display: grid
  place-items: center
  z-index: 20

.ac-spinner
  width: 38px
  height: 38px
  border: 3px solid $p-bdr
  border-top-color: $p
  border-radius: 50%
  animation: ac-spin 0.7s linear infinite

@keyframes ac-spin
  to
    transform: rotate(360deg)

.ac-loading-txt
  color: $p
  font-size: 0.85rem
  font-weight: 700
  margin-top: 12px

.ac-cursor-ring
  position: fixed
  pointer-events: none
  border-radius: 50%
  z-index: 9000
  transform: translate(-50%, -50%)
  border: 2px solid rgba(33, 64, 106, 0.7)
  opacity: 0
  transition: opacity 0.12s, width 0.08s, height 0.08s

  &.show
    opacity: 1

  &.eraser-cursor
    border-color: rgba(192, 82, 106, 0.75)

// Sticky fullscreen toggle — pinned to the bottom-right of the
// viewport in every layout so the kid can flip in and out at any time.
// Sits below the toolbox z-layer so a dragged toolbox can park on top
// of it instead of being permanently obscured by it.
.ac-fs-floating
  position: fixed
  right: calc(env(safe-area-inset-right, 0px) + 16px)
  bottom: calc(env(safe-area-inset-bottom, 0px) + 16px)
  z-index: 350
  width: 44px
  height: 44px
  border-radius: 999px
  display: inline-flex
  align-items: center
  justify-content: center
  background: rgba(253, 248, 237, 0.92)
  border: 1px solid $p-bdr
  color: $text
  cursor: pointer
  box-shadow: 0 8px 22px -8px rgba(10, 26, 48, 0.45), 0 2px 6px -2px rgba(58, 42, 18, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.55)
  backdrop-filter: blur(8px)
  -webkit-backdrop-filter: blur(8px)
  transition: transform 150ms ease-out, background-color 150ms ease-out
  -webkit-tap-highlight-color: transparent

  &:hover
    background: #ffffff
    transform: translateY(-1px)

  &:active
    transform: scale(0.94)

  &.is-on
    background: linear-gradient(180deg, $p 0%, $p-dark 100%)
    color: #ffffff
    border-color: $p-dark
    box-shadow: 0 8px 22px -6px rgba(10, 26, 48, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.18)

  svg
    width: 22px
    height: 22px

.ac-minibar
  position: fixed
  z-index: 400
  user-select: none
  -webkit-user-select: none
  transition: width 0.24s cubic-bezier(0.34, 1.2, 0.64, 1), height 0.24s, border-radius 0.24s

.ac-minibar.collapsed
  width: 52px
  height: 52px
  border-radius: 50%
  cursor: pointer
  filter: drop-shadow(0 4px 14px rgba(33, 64, 106, 0.55))

.ac-minibar.collapsed .ac-mb-panel
  display: none

.ac-mb-handle
  width: 100%
  height: 100%
  display: grid
  place-items: center
  background: linear-gradient(135deg, $p-dark, $p-mid)
  border-radius: 50%

.ac-mb-color-dot
  width: 26px
  height: 26px
  border-radius: 50%
  border: 2.5px solid rgba(255, 255, 255, 0.75)
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25)

.ac-minibar:not(.collapsed) .ac-mb-handle
  display: none

.ac-minibar.dragging
  transition: none !important
  transform: scale(1.06)
  filter: drop-shadow(0 12px 30px rgba(33, 64, 106, 0.6))

.ac-minibar:not(.collapsed)
  background: #fff
  border-radius: 12px
  box-shadow: 0 8px 32px rgba(33, 64, 106, 0.22)
  border: 1.5px solid $p-bdr
  overflow: hidden

.ac-mb-panel
  display: flex
  flex-direction: column
  gap: 7px
  padding: 8px
  width: min(230px, calc(100vw - 24px))
  max-height: calc(100dvh - 24px)
  overflow-y: auto

.ac-mb-dragbar
  display: flex
  align-items: center
  justify-content: space-between
  padding-bottom: 8px
  border-bottom: 1.5px solid $p-bdr
  cursor: grab

.ac-mb-dragbar:active
  cursor: grabbing

.ac-mb-grip
  display: flex
  flex-direction: column
  gap: 3px

.ac-mb-grip span
  width: 18px
  height: 2.5px
  background: $p-bdr
  border-radius: 2px
  display: block

.ac-mb-label
  font-size: 0.68rem
  font-weight: 700
  letter-spacing: 0.08em
  text-transform: uppercase
  color: $p

.ac-mb-x
  width: 22px
  height: 22px
  border-radius: 50%
  background: $p-pale
  border: none
  cursor: pointer
  display: grid
  place-items: center
  color: $text-m

  svg
    width: 11px
    height: 11px

.ac-mb-pal
  display: grid
  grid-template-columns: repeat(7, 1fr)
  gap: 4px

.ac-mb-pal.is-graphite
  grid-template-columns: repeat(5, 1fr)

.ac-sw
  width: 24px
  height: 24px
  border-radius: 50%
  border: 2px solid #fff
  box-shadow: 0 0 0 1.2px $p-bdr
  cursor: pointer
  margin: 0 auto

  &.active
    box-shadow: 0 0 0 2.5px $p-mid
    transform: scale(1.15)

.ac-sw-rainbow
  background: conic-gradient(red, #ff0, lime, cyan, blue, magenta, red)

.ac-mb-tools
  display: grid
  grid-template-columns: 1fr 1fr 1fr
  gap: 4px

.ac-tb
  display: flex
  flex-direction: column
  align-items: center
  gap: 2px
  padding: 6px 2px 4px
  border-radius: 11px
  background: $p-pale
  border: 2px solid transparent
  cursor: pointer
  font: inherit
  font-size: 0.58rem
  font-weight: 700
  color: $text-m

  svg
    width: 18px
    height: 18px

  &.active
    background: linear-gradient(135deg, $p-dark, $p-mid)
    color: #fff

.ac-tb.ac-tb-eraser
  background: #FFF5F7
  color: #B04060

  &.active
    background: linear-gradient(135deg, #B04060, #D05080)
    color: #fff

.ac-mb-sliders
  display: flex
  flex-direction: column
  gap: 7px

.ac-sl-group
  display: flex
  flex-direction: column
  gap: 3px

.ac-sl-label
  display: flex
  justify-content: space-between
  font-size: 0.65rem
  font-weight: 700
  color: $text-l
  text-transform: uppercase
  letter-spacing: 0.04em

  b
    color: $p
    font-weight: 700

input[type=range]
  -webkit-appearance: none
  appearance: none
  width: 100%
  height: 6px
  border-radius: 50px
  background: $p-bg
  outline: none
  cursor: pointer

input[type=range]::-webkit-slider-thumb
  -webkit-appearance: none
  width: 18px
  height: 18px
  border-radius: 50%
  background: #fff
  border: 2.5px solid $p
  cursor: pointer

input[type=range]::-moz-range-thumb
  width: 18px
  height: 18px
  border-radius: 50%
  background: #fff
  border: 2.5px solid $p
  cursor: pointer

.ac-mb-acts
  display: grid
  grid-template-columns: 1fr 1fr 1fr
  gap: 5px

.ac-act-btn
  display: flex
  align-items: center
  justify-content: center
  gap: 4px
  padding: 7px 4px
  border-radius: 10px
  background: $p-pale
  border: none
  cursor: pointer
  font: inherit
  font-size: 0.68rem
  font-weight: 700
  color: $text-m

  &:disabled
    opacity: 0.3
    cursor: not-allowed

  svg
    width: 13px
    height: 13px
    flex-shrink: 0

  &.danger
    background: #FFF5F7
    color: #B04060

.ac-mb-fs-row
  display: flex
  gap: 5px

.ac-fs-btn
  flex: 1
  padding: 8px
  border-radius: 50px
  border: none
  cursor: pointer
  font: inherit
  font-size: 0.74rem
  font-weight: 700
  display: flex
  align-items: center
  justify-content: center
  gap: 5px

  svg
    width: 13px
    height: 13px

  &.enter
    background: linear-gradient(135deg, $p-dark, $p-mid)
    color: #fff
    box-shadow: 0 3px 10px rgba(33, 64, 106, 0.35)

  &.exit
    background: $p-pale
    color: $p
    border: 1.5px solid $p-bdr

.ac-save-notice
  position: fixed
  top: calc(max(env(safe-area-inset-top, 0px), 8px) + 56px)
  left: 50%
  transform: translateX(-50%)
  z-index: 60
  max-width: min(90vw, 360px)
  margin: 0
  padding: 8px 16px
  border-radius: 999px
  background: $p
  color: #ffffff
  font-size: 14px
  font-weight: 700
  text-align: center
  box-shadow: 0 8px 20px -8px rgba(10, 26, 48, 0.5)
  pointer-events: none

  &.is-denied
    border-radius: 16px
    background: $p-pale
    color: $text
    border: 1px solid $p-bdr

.ac-notice-enter-active, .ac-notice-leave-active
  transition: opacity 200ms ease-out, transform 200ms ease-out

.ac-notice-enter-from, .ac-notice-leave-to
  opacity: 0
  transform: translate(-50%, -6px)

.ac-vh
  position: absolute
  opacity: 0
  pointer-events: none
  width: 1px
  height: 1px

// Responsive header — phones in portrait have very little horizontal room
// once the page nav, quick-tools, and action buttons all line up. We hide
// the title text below 480px so the actually-useful controls keep their
// minimum tap target. Below 360px (smallest common phones), the page
// counter shrinks too.
@media (max-width: 480px)
  .ac-title
    font-size: 0
  .ac-q
    width: 30px
    height: 30px
  .ac-h-btn
    width: 30px
    height: 30px

@media (max-width: 360px)
  .ac-hdr
    gap: 4px
    padding: 8px 8px
    padding-top: max(8px, env(safe-area-inset-top))
  .ac-quick
    gap: 3px
  .ac-actions
    gap: 3px
  .ac-q,
  .ac-h-btn
    width: 28px
    height: 28px
  .ac-pg-btn
    width: 22px
    height: 22px

// Tablets / desktop — keep the same edge-to-edge fit as on phones per
// product call. (The previous gutter on >=900px was removed.)

// ── Unsaved-changes confirmation modal ───────────────────────────────────
.ac-confirm-overlay
  position: fixed
  inset: 0
  z-index: 1000
  background: rgba(20, 6, 38, 0.55)
  display: flex
  align-items: center
  justify-content: center
  padding: 20px
  backdrop-filter: blur(2px)
  -webkit-backdrop-filter: blur(2px)
  animation: ac-fade-in 0.16s ease-out

.ac-confirm-dialog
  width: 100%
  max-width: 360px
  background: #fff
  border-radius: 18px
  padding: 22px 22px 18px
  box-shadow: 0 20px 60px -16px rgba(20, 6, 38, 0.55), 0 6px 20px -6px rgba(20, 6, 38, 0.3)
  animation: ac-pop-in 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)

.ac-confirm-title
  margin: 0 0 8px
  font-size: 1.15rem
  font-weight: 700
  color: $text

.ac-confirm-body
  margin: 0 0 18px
  font-size: 0.92rem
  line-height: 1.45
  color: $text-m

.ac-confirm-actions
  display: flex
  gap: 8px
  justify-content: flex-end
  flex-wrap: wrap

.ac-confirm-stay,
.ac-confirm-leave
  font: inherit
  font-weight: 700
  font-size: 0.88rem
  border: none
  cursor: pointer
  padding: 10px 18px
  border-radius: 999px
  transition: background 0.13s, transform 0.1s

  &:active
    transform: scale(0.96)

.ac-confirm-stay
  background: $p-pale
  color: $p
  border: 1.5px solid $p-bdr

  &:hover
    background: $p-bg

.ac-confirm-leave
  background: linear-gradient(135deg, #B04060, #D05080)
  color: #fff
  box-shadow: 0 4px 12px -4px rgba(176, 64, 96, 0.45)

@keyframes ac-fade-in
  from
    opacity: 0
  to
    opacity: 1

@keyframes ac-pop-in
  from
    opacity: 0
    transform: scale(0.92)
  to
    opacity: 1
    transform: scale(1)
</style>
