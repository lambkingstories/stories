/**
 * "Jonatans Pfeile": the little builders of the level data (see `bogenLevelDefs.ts`).
 * 44 levels in four chapters of eleven. The world is a side view, the ground is y = 0, the archer stands at the left. Round things are measured
 * from their middle. Every level can be won in several natural ways: nothing is a pixel-exact trick, the targets are big.
 */
import type { Deco, GateDef, ItemDef, LevelDef, Mat, Motion, Poly, RopeDef, WeightDef, Zone } from './bogenGame'

export const box = (x0: number, y0: number, x1: number, y1: number, mat: Mat = 'wood'): Poly => ({ pts: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], mat })
/** A hill: a flat-topped mound of earth from x0 to x1. */
export const hill = (x0: number, x1: number, h: number, mat: Mat = 'dirt'): Poly => {
  const w = x1 - x0
  return { pts: [[x0, 0], [x0 + w * 0.3, h], [x0 + w * 0.7, h], [x1, 0]], mat }
}
/** A slanted plank or shield: a thin bar from (x0, y0) to (x1, y1). */
export const bar = (x0: number, y0: number, x1: number, y1: number, mat: Mat = 'stone', t = 0.3): Poly => {
  const dx = x1 - x0
  const dy = y1 - y0
  const l = Math.hypot(dx, dy)
  const nx = (-dy / l) * (t / 2)
  const ny = (dx / l) * (t / 2)
  return { pts: [[x0 + nx, y0 + ny], [x1 + nx, y1 + ny], [x1 - nx, y1 - ny], [x0 - nx, y0 - ny]], mat }
}
export const target = (id: string, x: number, y: number, r = 1.4, extra: Partial<ItemDef> = {}): ItemDef => ({ id, kind: 'target', x, y, r, ...extra })
export const bell = (id: string, x: number, y: number, r = 0.95, extra: Partial<ItemDef> = {}): ItemDef => ({ id, kind: 'bell', x, y, r, ...extra })
export const jar = (id: string, x: number, y: number, r = 0.85, extra: Partial<ItemDef> = {}): ItemDef => ({ id, kind: 'jar', x, y, r, ...extra })
export const flag = (id: string, x: number, y: number, r = 1.05, extra: Partial<ItemDef> = {}): ItemDef => ({ id, kind: 'flag', x, y, r, ...extra })
export const sw = (id: string, x: number, y: number, then: ItemDef['then'], r = 0.9): ItemDef => ({ id, kind: 'switch', x, y, r, need: false, then })
export const gate = (id: string, x: number, h: number, w = 0.7, y0 = 0): GateDef => ({ id, x, y0, w, h })
export const rope = (id: string, x0: number, y0: number, x1: number, y1: number, extra: Partial<RopeDef> = {}): RopeDef => ({ id, x0, y0, x1, y1, ...extra })
export const weight = (id: string, x: number, y: number, w = 1.5, h = 1.3): WeightDef => ({ id, x, y, w, h })
export const gallows = (x: number, h: number, w = 2.5): Deco => ({ kind: 'gallows', x, y: 0, w, h })
/** The hook of a gallows: where a hanging thing is tied. */
export const hook = (g: Deco) => [g.x + (g.w ?? 2.5), g.h ?? 8] as const
export const swing = (px: number, py: number, len: number, amp: number, period: number, phase = 0): Motion => ({ k: 'swing', px, py, len, amp, period, phase })
export const slide = (x0: number, y0: number, x1: number, y1: number, period: number, phase = 0): Motion => ({ k: 'slide', x0, y0, x1, y1, period, phase })
export const zone = (x0: number, y0: number, x1: number, y1: number, wx: number, wy = 0): Zone => ({ x0, y0, x1, y1, wx, wy })

type Spec = Omit<LevelDef, 'chapter' | 'index' | 'w' | 'archer' | 'wind' | 'polys' | 'items' | 'preview'> &
  Partial<Pick<LevelDef, 'w' | 'archer' | 'wind' | 'polys' | 'items' | 'preview'>>
export const lv = (chapter: number, index: number, s: Spec): LevelDef => ({ w: 34, archer: { x: 3, y: 0 }, wind: 0, polys: [], items: [], preview: [3, 1.6, 1.1, 0.9][chapter]!, ...s, chapter, index })

export const hang = (g: Deco, drop: number): [number, number] => [hook(g)[0], hook(g)[1] - drop]
export const chain = (g: Deco, x: number, y: number): Deco => ({ kind: 'chain', x: hook(g)[0], y: hook(g)[1], w: x, h: y })
