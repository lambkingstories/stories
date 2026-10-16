/**
 * The time-lapse of a painting ("So ist dein Bild entstanden"). While a child paints, every change (a stroke, a fill, a
 * clearing) is remembered as a small picture of the area it touched, at half size. Played one after the other on the line
 * art they show the picture growing. That needs far less room than a video, and the video is only made when it is wanted
 * (see `ColoringTimelapse.vue`). Everything stays on the device.
 */

/** The log works at this fraction of the painting's size. */
export const LOG_SCALE = 0.5
/** More steps than this are merged into one base picture, so the log (and the video) stay small. */
export const MAX_STEPS = 400
const MERGE_STEPS = 200
/** A time-lapse with fewer steps is not worth showing. */
export const MIN_STEPS = 3

export interface TimelapseStep {
  /** The area, in log pixels. */
  x: number
  y: number
  w: number
  h: number
  /** What the area looked like after the change (transparent where there was no paint). */
  blob: Blob | Promise<Blob>
}

export interface TimelapseData {
  /** Size of the log's picture in log pixels. */
  w: number
  h: number
  base: Blob | null
  steps: { x: number; y: number; w: number; h: number; blob: Blob }[]
}

export class TimelapseLog {
  w = 0
  h = 0
  base: Blob | null = null
  steps: TimelapseStep[] = []
  /** How many steps are in the picture (undo takes steps back, redo brings them again). */
  applied = 0

  /** Starts an empty log for a painting of `fullW × fullH` pixels. */
  reset(fullW: number, fullH: number) {
    this.w = Math.max(1, Math.round(fullW * LOG_SCALE))
    this.h = Math.max(1, Math.round(fullH * LOG_SCALE))
    this.base = null
    this.steps = []
    this.applied = 0
  }

  load(data: TimelapseData) {
    this.w = data.w
    this.h = data.h
    this.base = data.base
    this.steps = data.steps.map((s) => ({ ...s }))
    this.applied = this.steps.length
  }

  /** Steps that show in the picture now. */
  get count(): number {
    return this.applied
  }

  /** Adds a change; a change after an undo ends the line of steps that were taken back. */
  add(step: TimelapseStep) {
    this.steps.length = this.applied
    this.steps.push(step)
    this.applied = this.steps.length
    if (this.steps.length > MAX_STEPS) void this.merge()
  }

  undo(): boolean {
    if (this.applied <= 0) return false
    this.applied--
    return true
  }

  redo(): boolean {
    if (this.applied >= this.steps.length) return false
    this.applied++
    return true
  }

  /** The oldest steps become the base picture, so there is no limit to how long a painting may take. */
  private async merge() {
    const old = this.steps.splice(0, MERGE_STEPS)
    this.applied = Math.max(0, this.applied - old.length)
    const c = makeCanvas(this.w, this.h)
    const ctx = c.getContext('2d')
    if (!ctx) return
    if (this.base) ctx.drawImage(await createImageBitmap(this.base), 0, 0, this.w, this.h)
    for (const s of old) {
      const bmp = await createImageBitmap(await s.blob)
      ctx.clearRect(s.x, s.y, s.w, s.h)
      ctx.drawImage(bmp, s.x, s.y, s.w, s.h)
    }
    this.base = await canvasBlob(c)
  }

  /** The steps that show now, with their pictures ready (for playing and saving). */
  async snapshot(): Promise<TimelapseData> {
    const steps = await Promise.all(this.steps.slice(0, this.applied).map(async (s) => ({ x: s.x, y: s.y, w: s.w, h: s.h, blob: await s.blob })))
    return { w: this.w, h: this.h, base: this.base, steps }
  }
}

function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

function canvasBlob(c: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error('no picture'))), 'image/webp', 0.72))
}

/**
 * Remembers what the area `x0, y0 – x1, y1` (in painting pixels) of `source` looks like now, as one step of the log.
 * The picture is made in the background; the step is in the log at once, so the order never gets mixed up.
 */
export function recordStep(log: TimelapseLog, source: HTMLCanvasElement, x0: number, y0: number, x1: number, y1: number) {
  const fw = source.width
  const fh = source.height
  const sx = Math.max(0, Math.floor(x0))
  const sy = Math.max(0, Math.floor(y0))
  const sw = Math.min(fw, Math.ceil(x1)) - sx
  const sh = Math.min(fh, Math.ceil(y1)) - sy
  if (sw < 1 || sh < 1) return
  // the area in log pixels (rounded outwards, so neighbouring steps leave no seam)
  const lx = Math.floor(sx * LOG_SCALE)
  const ly = Math.floor(sy * LOG_SCALE)
  const lw = Math.max(1, Math.min(log.w - lx, Math.ceil((sx + sw) * LOG_SCALE) - lx))
  const lh = Math.max(1, Math.min(log.h - ly, Math.ceil((sy + sh) * LOG_SCALE) - ly))
  const c = makeCanvas(lw, lh)
  const ctx = c.getContext('2d')
  if (!ctx) return
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(source, lx / LOG_SCALE, ly / LOG_SCALE, lw / LOG_SCALE, lh / LOG_SCALE, 0, 0, lw, lh)
  log.add({ x: lx, y: ly, w: lw, h: lh, blob: canvasBlob(c) })
}

// ── Saving in one piece -------------------------------------------------------------------------------------------

/** Packs the log into one blob: [4 bytes: length of the header][header as JSON][base picture][step pictures one after the other]. */
export function packTimelapse(data: TimelapseData): Blob | null {
  if (data.steps.length < MIN_STEPS) return null
  const header = JSON.stringify({
    v: 1,
    w: data.w,
    h: data.h,
    base: data.base ? data.base.size : 0,
    steps: data.steps.map((s) => ({ x: s.x, y: s.y, w: s.w, h: s.h, n: s.blob.size }))
  })
  const head = new TextEncoder().encode(header)
  const len = new Uint8Array(4)
  new DataView(len.buffer).setUint32(0, head.length, true)
  return new Blob([len, head, ...(data.base ? [data.base] : []), ...data.steps.map((s) => s.blob)], { type: 'application/octet-stream' })
}

/** The bytes of a blob (older engines have no `blob.arrayBuffer()`). */
export function blobBytes(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === 'function') return blob.arrayBuffer()
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as ArrayBuffer)
    r.onerror = () => reject(r.error)
    r.readAsArrayBuffer(blob)
  })
}

export async function unpackTimelapse(blob: Blob): Promise<TimelapseData | null> {
  try {
    const headLen = new DataView(await blobBytes(blob.slice(0, 4))).getUint32(0, true)
    const header = JSON.parse(new TextDecoder().decode(await blobBytes(blob.slice(4, 4 + headLen)))) as {
      v: number
      w: number
      h: number
      base: number
      steps: { x: number; y: number; w: number; h: number; n: number }[]
    }
    if (header.v !== 1) return null
    let at = 4 + headLen
    const base = header.base > 0 ? blob.slice(at, at + header.base, 'image/webp') : null
    at += header.base
    const steps = header.steps.map((s) => {
      const part = blob.slice(at, at + s.n, 'image/webp')
      at += s.n
      return { x: s.x, y: s.y, w: s.w, h: s.h, blob: part }
    })
    return { w: header.w, h: header.h, base, steps }
  } catch {
    return null
  }
}

// ── Playing -----------------------------------------------------------------------------------------------------------

export const FPS = 30

/**
 * When each step shows in the film: the film is as long as the painting has steps (about 70 ms each, at least 5 and at most
 * 14 seconds), with a short look at the empty line art at the start and a longer look at the finished picture at the end.
 */
export function frameSchedule(steps: number, fps = FPS): { frames: number; stepAt: number[] } {
  const holdStart = Math.round(0.6 * fps)
  const holdEnd = Math.round(2 * fps)
  const body = Math.round(Math.min(14, Math.max(5, steps * 0.07)) * fps)
  const stepAt: number[] = []
  for (let i = 0; i < steps; i++) stepAt.push(holdStart + Math.min(body - 1, Math.floor((i * body) / Math.max(1, steps))))
  return { frames: holdStart + body + holdEnd, stepAt }
}

/** The kind of video this browser can make (a phone's own player takes mp4 best), or null when it cannot make one. */
export function pickVideoType(isSupported: (type: string) => boolean): string | null {
  const candidates = ['video/mp4;codecs=avc1.42E01E', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
  return candidates.find((t) => isSupported(t)) ?? null
}

export const videoExtension = (type: string) => (type.startsWith('video/mp4') ? 'mp4' : 'webm')
