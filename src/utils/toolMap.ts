/**
 * Which tool painted what. The pictures of an adventure can ask for a tool ("paint with the felt-tip marker"), so the painting screen
 * keeps a small map beside the picture: for every cell of a coarse grid the tool that painted it last (0 = nothing, or not known).
 * After every action (a stroke, a fill, the eraser) the picture before and after is compared on that grid: where it changed and
 * is painted, the tool of the action is written; the eraser clears the cells that are bare again. Undo and redo go along.
 * "What counts is the paint that is visible now": a place that is painted over belongs to the tool that painted it last.
 */

import { labelAt, type RegionMap } from '@/utils/coloringRegions'
import type { PaintColor, PaintToolName } from '@/types/adventure'

export type PaintTool = PaintToolName

export const TOOL_CODES: Record<PaintTool, number> = { pencil: 1, felt: 2, watercolor: 3, graphite: 4, chalk: 5, oil: 6, fill: 7 }

/** The grid is this many cells along its longer side. */
export const GRID_LONG_SIDE = 240
/** A cell counts as painted from this alpha on (0 to 255). */
export const PAINTED_ALPHA = 16
/** A task is done when this share of the zone is painted as asked (with the tool and/or in the colour family). */
export const FILL_SHARE = 0.8
/** Paint that is wrong for the task counts as "wrong" (and not only "not enough") from this share of the zone. */
export const WRONG_SHARE = 0.25
/** Wrong paint has to be at least this strong to count as wrong (a faint rest of an earlier colour does not). */
const WRONG_ALPHA = 48
/** How many actions undo can take back (as many as the picture's own history). */
const MAX_STEPS = 40

export function gridSize(w: number, h: number): { w: number; h: number } {
  const k = GRID_LONG_SIDE / Math.max(1, Math.max(w, h))
  return { w: Math.max(1, Math.round(w * k)), h: Math.max(1, Math.round(h * k)) }
}

export class ToolMap {
  codes: Uint8Array
  /** The states after each action; the first is the one before the first action. */
  private stack: Uint8Array[]
  private applied = 0

  constructor(readonly w: number, readonly h: number, codes?: Uint8Array) {
    this.codes = codes && codes.length === w * h ? codes.slice() : new Uint8Array(w * h)
    this.stack = [this.codes.slice()]
  }

  /** The state now is the new beginning (a picture was loaded): nothing to undo. */
  rebase() {
    this.stack = [this.codes.slice()]
    this.applied = 0
  }

  /**
   * An action ended. `code` is the tool (1 and up) or 0 for the eraser; `before` and `after` are the picture on the grid (RGBA).
   * Painting writes the tool where the picture changed and is painted; the eraser clears the cells that are bare now.
   */
  record(code: number, before: ArrayLike<number>, after: ArrayLike<number>) {
    const n = this.w * this.h
    for (let i = 0; i < n; i++) {
      const o = i * 4
      const painted = after[o + 3]! >= PAINTED_ALPHA
      if (code > 0) {
        const d = Math.abs(after[o]! - before[o]!) + Math.abs(after[o + 1]! - before[o + 1]!) + Math.abs(after[o + 2]! - before[o + 2]!) + Math.abs(after[o + 3]! - before[o + 3]!)
        if (painted && d > 12) this.codes[i] = code
      } else if (!painted) {
        this.codes[i] = 0
      }
    }
    this.stack = this.stack.slice(0, this.applied + 1)
    this.stack.push(this.codes.slice())
    if (this.stack.length > MAX_STEPS + 1) this.stack.shift()
    this.applied = this.stack.length - 1
  }

  undo(): boolean {
    if (this.applied <= 0) return false
    this.codes.set(this.stack[--this.applied]!)
    return true
  }

  redo(): boolean {
    if (this.applied >= this.stack.length - 1) return false
    this.codes.set(this.stack[++this.applied]!)
    return true
  }

  /** A short text of the map (runs of equal cells), for keeping it with the saved picture. */
  encode(): string {
    const out: string[] = []
    let i = 0
    while (i < this.codes.length) {
      let j = i
      while (j < this.codes.length && this.codes[j] === this.codes[i]) j++
      out.push(`${this.codes[i]}x${j - i}`)
      i = j
    }
    return `${this.w}:${this.h}:${out.join(',')}`
  }

  /** The map from `encode`, or `null` when it is not of this size (a picture of another size starts without one). */
  static decode(text: string | null, w: number, h: number): ToolMap | null {
    if (!text) return null
    const [sw, sh, runs] = text.split(':')
    if (Number(sw) !== w || Number(sh) !== h || !runs) return null
    const codes = new Uint8Array(w * h)
    let at = 0
    for (const run of runs.split(',')) {
      const [c, n] = run.split('x').map(Number) as [number, number]
      if (!Number.isFinite(c) || !Number.isFinite(n) || n < 0 || at + n > codes.length) return null
      codes.fill(c, at, at + n)
      at += n
    }
    return at === codes.length ? new ToolMap(w, h, codes) : null
  }
}

/**
 * The cells of the grid that belong to a zone: the fields of the line art that hold one of the seed points (percent of the picture).
 * `map` is the map of fields of the picture (`utils/coloringRegions.ts`); a seed on an outline takes the field next to it.
 */
export function zoneCells(map: RegionMap, seeds: [number, number][], gw: number, gh: number): Uint8Array {
  const wanted = new Set<number>()
  for (const [sx, sy] of seeds) {
    const x = Math.min(map.w - 1, Math.max(0, Math.round((sx / 100) * map.w)))
    const y = Math.min(map.h - 1, Math.max(0, Math.round((sy / 100) * map.h)))
    const label = labelAt(map as RegionMap, x, y)
    if (label > 0) wanted.add(label)
  }
  const mask = new Uint8Array(gw * gh)
  if (!wanted.size) return mask
  for (let y = 0; y < gh; y++) {
    const my = Math.min(map.h - 1, Math.floor(((y + 0.5) / gh) * map.h))
    for (let x = 0; x < gw; x++) {
      const mx = Math.min(map.w - 1, Math.floor(((x + 0.5) / gw) * map.w))
      if (wanted.has(map.labels[my * map.w + mx]!)) mask[y * gw + x] = 1
    }
  }
  return mask
}

/**
 * The colour family of a paint colour (red, green, blue, 0 to 255), by its hue with a generous span of lightness: light green, green and dark
 * green are all "green". Grey, white and almost black belong to no family. Orange and brown differ by how strong the colour is, pink is a
 * light red or a red-violet.
 */
export function colorFamilyOf(r: number, g: number, b: number): PaintColor | null {
  const mx = Math.max(r, g, b) / 255
  const mn = Math.min(r, g, b) / 255
  const d = mx - mn
  const l = (mx + mn) / 2
  if (d < 0.12 || l < 0.1 || l > 0.93) return null
  const s = d / (1 - Math.abs(2 * l - 1))
  if (s < 0.2) return null
  let h: number
  if (mx === r / 255) h = (((g - b) / 255 / d) % 6) * 60
  else if (mx === g / 255) h = ((b - r) / 255 / d + 2) * 60
  else h = ((r - g) / 255 / d + 4) * 60
  h = (h + 360) % 360
  if (h >= 345 || h < 10) return l > 0.72 ? 'pink' : 'red'
  if (h >= 10 && h < 36) return s >= 0.75 && l >= 0.4 ? 'orange' : 'brown'
  if (h >= 36 && h < 45) return s < 0.75 && l < 0.45 ? 'brown' : l >= 0.4 ? 'yellow' : 'brown'
  if (h < 70) return l >= 0.4 ? 'yellow' : 'brown'
  if (h < 165) return 'green'
  if (h < 260) return 'blue'
  if (h < 300) return 'purple'
  return 'pink'
}

export type JobStatus = 'met' | 'wrong' | 'more'

export interface JobVerdict {
  status: JobStatus
  /** The cells of the zone. */
  cells: number
  /** Cells of the zone that are painted as asked. */
  right: number
  /** The share of the zone that is painted as asked (0 to 1). */
  fill: number
  /** The share of the zone that is painted, but not as asked (strong paint only). */
  wrong: number
}

/**
 * Is a task done? Only the paint inside the `zone` counts (the rest of the picture is the child's choice). A place is right when it is painted
 * and, if a tool is asked, was painted with that tool (the map of tools: a place whose tool is not known does NOT count), and, if a colour is
 * asked, has a colour of that family (both, when both are asked). `rgba` is the paint on the grid. Done = 80 % of the zone is right. Otherwise
 * it is "wrong" when a good part of the zone is painted the wrong way, and "more" when there is simply not enough yet.
 */
export function evaluateJob(opts: { codes: Uint8Array; rgba: ArrayLike<number>; zone: Uint8Array; tool?: PaintTool; color?: PaintColor }): JobVerdict {
  const { codes, rgba, zone } = opts
  const want = opts.tool ? TOOL_CODES[opts.tool] : 0
  let cells = 0
  let right = 0
  let wrong = 0
  for (let i = 0; i < zone.length; i++) {
    if (!zone[i]) continue
    cells++
    const alpha = rgba[i * 4 + 3]!
    if (alpha < PAINTED_ALPHA) continue
    let ok = true
    if (opts.tool && codes[i] !== want) ok = false
    if (ok && opts.color && colorFamilyOf(rgba[i * 4]!, rgba[i * 4 + 1]!, rgba[i * 4 + 2]!) !== opts.color) ok = false
    if (ok) right++
    else if (alpha >= WRONG_ALPHA) wrong++
  }
  const fill = cells > 0 ? right / cells : 0
  const wrongShare = cells > 0 ? wrong / cells : 0
  const status: JobStatus = fill >= FILL_SHARE ? 'met' : wrongShare >= WRONG_SHARE ? 'wrong' : 'more'
  return { status, cells, right, fill, wrong: wrongShare }
}
