/**
 * The real glitter of the glitter markers: places in the paint that flash one after another while the picture is open. The paint itself
 * (with its fine flecks) is in the picture; this is a canvas laid over it that is drawn again and again.
 *
 * A place is only drawn while the paint is still there: after every change (a stroke, the eraser, the bucket, undo, redo) `settle` looks at the
 * picture where each place lies and hides the places whose colour is gone or has changed (they come back when undo/redo brings the paint back).
 * `clear` forgets all places (a new picture). Nothing here is saved: a picture that is opened again has its fine flecks and no flashing.
 *
 * Gentle with the phone: about 30 pictures a second, only while there is glitter and the picture can be seen (a hidden page or a canvas that is scrolled
 * away pauses it), at most `MAX_SITES` places. Where the person wants less movement nothing moves: the flashes stand still, dim. `drawStatic` lays the
 * flashes as still stars on the exported picture.
 */
import { drawTwinkle, twinkle, type GlitterSite } from '@/utils/coloringBrushes'

interface Entry {
  site: GlitterSite
  rgb: [number, number, number]
  tone: string
  alive: boolean
}

/**
 * The overlay is drawn at this share of the size of the picture: the flashes are small and soft, and a quarter of the pixels means a quarter
 * of the work for the phone every time the overlay is drawn and laid over the picture again.
 */
export const OVERLAY_SCALE = 0.5
/** More places than this are too many for a phone: the oldest go first. */
export const MAX_SITES = 1600
/** The brightness of the still flashes where nothing moves, and of those on an exported picture (every second place only, so that it stays quiet). */
export const STATIC_LEVEL = 0.6

/** The light of a flash: white, or gold on a pale ground where white would not show. */
export function toneFor(rgb: [number, number, number]): string {
  const lum = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255
  return lum > 0.78 ? '#FFC93C' : '#FFFFFF'
}

/** Is the colour at a place still the one that was there (a few steps of difference are allowed for the soft edge)? */
export const sameColor = (a: [number, number, number], b: [number, number, number]) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) <= 60

export default function useGlitterTwinkle(getPaint: () => CanvasRenderingContext2D | null, getOverlay: () => HTMLCanvasElement | null) {
  let entries: Entry[] = []
  let pending: GlitterSite[] = []
  let raf = 0
  let start = 0
  let last = 0
  /** While the person paints, moves or zooms the picture the flashes rest (the overlay keeps its last picture): the phone has better things to do. */
  let holdUntil = 0
  /** The canvas can be seen (scrolled into view and the page is shown). */
  let seen = true
  let observer: IntersectionObserver | null = null

  const reduced = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  /**
   * The colour at some places of the picture, read with ONE call (`getImageData` of the box around them). A call of its own for every place
   * costs milliseconds each on a phone (the picture has to be flushed for every read), so a few hundred places froze the app for seconds
   * after every stroke and every undo.
   */
  function reader(ctx: CanvasRenderingContext2D, sites: { x: number; y: number }[]): ((x: number, y: number) => { rgb: [number, number, number]; a: number } | null) | null {
    if (!sites.length) return () => null
    const w = ctx.canvas.width
    const h = ctx.canvas.height
    const cx = (x: number) => Math.max(0, Math.min(w - 1, Math.round(x)))
    const cy = (y: number) => Math.max(0, Math.min(h - 1, Math.round(y)))
    let x0 = w
    let y0 = h
    let x1 = 0
    let y1 = 0
    for (const s of sites) {
      const px = cx(s.x)
      const py = cy(s.y)
      if (px < x0) x0 = px
      if (py < y0) y0 = py
      if (px > x1) x1 = px
      if (py > y1) y1 = py
    }
    const bw = x1 - x0 + 1
    const bh = y1 - y0 + 1
    let data: ArrayLike<number>
    try {
      data = ctx.getImageData(x0, y0, bw, bh).data
    } catch {
      return null
    }
    return (x, y) => {
      const i = ((cy(y) - y0) * bw + (cx(x) - x0)) * 4
      const a = data[i + 3]
      if (a === undefined) return null
      return { rgb: [data[i]!, data[i + 1]!, data[i + 2]!], a }
    }
  }

  /** Places of a piece of a stroke that is being painted: they count once the stroke is finished and the paint is on the picture. */
  function add(sites: GlitterSite[]) {
    if (sites.length) pending.push(...sites)
  }

  /**
   * Looks at the picture again: new places are taken in where paint lies, places without their paint are hidden. `rect` is the part of the
   * picture that just changed (the stroke, or the patch of an undo): only the places inside it are looked at again. Without it all places are.
   * Everything is read from the picture in one go.
   */
  function settle(rect?: { x0: number; y0: number; x1: number; y1: number }) {
    const ctx = getPaint()
    if (!ctx) return
    const pad = 12
    const inside = (e: Entry) => !rect || (e.site.x >= rect.x0 - pad && e.site.x <= rect.x1 + pad && e.site.y >= rect.y0 - pad && e.site.y <= rect.y1 + pad)
    const added = pending
    pending = []
    const recheck = entries.filter(inside)
    const read = reader(ctx, [...added, ...recheck.map((e) => e.site)])
    if (read) {
      for (const site of added) {
        const s = read(site.x, site.y)
        if (s && s.a >= 128) entries.push({ site, rgb: s.rgb, tone: toneFor(s.rgb), alive: true })
      }
      if (entries.length > MAX_SITES) {
        // the places that are hidden go first, then the oldest
        const dead = entries.filter((e) => !e.alive)
        const live = entries.filter((e) => e.alive)
        entries = [...dead, ...live].slice(-MAX_SITES)
      }
      for (const e of recheck) {
        const s = read(e.site.x, e.site.y)
        e.alive = !!s && s.a >= 100 && sameColor(s.rgb, e.rgb)
      }
    }
    if (entries.some((e) => e.alive)) run()
    else halt()
  }

  /** Forgets every place (a new picture, or all the paint cleared). */
  function clear() {
    entries = []
    pending = []
    halt()
  }

  function frame(now: number) {
    raf = requestAnimationFrame(frame)
    // about 30 pictures a second are enough for a twinkle and spare the battery
    if (now - last < 33) return
    if (now < holdUntil) return
    last = now
    const c = getOverlay()
    const ctx = c ? scaledContext(c) : null
    if (!c || !ctx) return
    clearOverlay(c, ctx)
    const t = (now - start) / 1000
    for (const e of entries) if (e.alive) drawTwinkle(ctx, e.site, twinkle(e.site, t), e.tone)
  }

  /** The context of the overlay, with the places given in the pixels of the picture (the overlay itself is smaller). */
  function scaledContext(c: HTMLCanvasElement): CanvasRenderingContext2D | null {
    const ctx = c.getContext('2d')
    ctx?.setTransform(OVERLAY_SCALE, 0, 0, OVERLAY_SCALE, 0, 0)
    return ctx
  }

  function clearOverlay(c: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, c.width, c.height)
    ctx.restore()
  }

  /** The flashes as they stand without movement: dim, every second place. */
  function drawStill(ctx: CanvasRenderingContext2D, scale = 1, every = 1) {
    let n = 0
    for (const e of entries) {
      if (!e.alive || n++ % every !== 0) continue
      drawTwinkle(ctx, scale === 1 ? e.site : { ...e.site, x: e.site.x * scale, y: e.site.y * scale, r: e.site.r * scale }, STATIC_LEVEL, e.tone)
    }
  }

  function watchVisibility() {
    if (observer || typeof IntersectionObserver === 'undefined') return
    const c = getOverlay()
    if (!c) return
    observer = new IntersectionObserver((list) => {
      seen = list.some((i) => i.isIntersecting)
      if (!seen) pause()
      else if (entries.some((e) => e.alive)) run()
    })
    observer.observe(c)
  }

  function run() {
    const c = getOverlay()
    if (reduced()) {
      // no movement: the flashes stand still
      const ctx = c ? scaledContext(c) : null
      if (c && ctx) {
        clearOverlay(c, ctx)
        drawStill(ctx, 1, 2)
      }
      return
    }
    if (raf || !seen || typeof requestAnimationFrame !== 'function') return
    watchVisibility()
    start = performance.now()
    raf = requestAnimationFrame(frame)
  }

  /** Stops the drawing but keeps the places (the canvas is out of sight). */
  function pause() {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
  }

  /** Lays the flashes as still stars on a picture that is exported (`scale` = size of that picture divided by the size of the canvas). */
  function drawStatic(ctx: CanvasRenderingContext2D, scale = 1) {
    drawStill(ctx, scale, 2)
  }

  function halt() {
    pause()
    const c = getOverlay()
    const ctx = c?.getContext('2d')
    if (c && ctx) clearOverlay(c, ctx)
  }

  /** The view is left: stop for good. */
  function stop() {
    halt()
    observer?.disconnect()
    observer = null
  }

  /** The overlay has the size of the picture. */
  function sync() {
    const dc = getPaint()?.canvas
    const c = getOverlay()
    if (!dc || !c) return
    const w = Math.max(1, Math.round(dc.width * OVERLAY_SCALE))
    const h = Math.max(1, Math.round(dc.height * OVERLAY_SCALE))
    if (c.width !== w) c.width = w
    if (c.height !== h) c.height = h
  }

  /** The flashes rest for a moment (the picture is being painted on, moved or zoomed). */
  function hold(ms = 300) {
    holdUntil = performance.now() + ms
  }

  return { add, settle, clear, sync, hold, stop, drawStatic, count: () => entries.filter((e) => e.alive).length }
}
