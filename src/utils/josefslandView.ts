/**
 * "Josefs Land": the maths between the finger and the land (no Vue, so it can be tested). A touch gives `clientX/clientY`; the canvas lies at
 * `rect` on the page and the game thinks of it as `W` x `H` units. If the page was resized without the game being told (a tablet whose browser
 * bar slides away does that), the game's `W`/`H` and the real size of the canvas differ; the touch is then scaled by the real size, so that the
 * finger always hits what it touches.
 */
export interface Cam {
  x: number
  y: number
  z: number
}
export interface Rect {
  left: number
  top: number
  width: number
  height: number
}

/** A touch on the page as a point of the canvas, in the units that the game draws with (`W` x `H`). */
export function clientToLocal(rect: Rect, W: number, H: number, clientX: number, clientY: number): [number, number] {
  const kx = rect.width > 0 ? W / rect.width : 1
  const ky = rect.height > 0 ? H / rect.height : 1
  return [(clientX - rect.left) * kx, (clientY - rect.top) * ky]
}
export const localToWorld = (cam: Cam, W: number, H: number, sx: number, sy: number): [number, number] => [(sx - W / 2) / cam.z + cam.x, (sy - H / 2) / cam.z + cam.y]
export const worldToLocal = (cam: Cam, W: number, H: number, wx: number, wy: number): [number, number] => [(wx - cam.x) * cam.z + W / 2, (wy - cam.y) * cam.z + H / 2]

export interface HitBox {
  x0: number
  y0: number
  x1: number
  y1: number
  prio: number
}
/** The box under a point of the world: the highest priority wins, then the one that stands nearer to the viewer (lower foot line). */
export function pickBox<T extends HitBox>(boxes: readonly T[], wx: number, wy: number): T | null {
  let best: T | null = null
  for (const b of boxes) {
    if (wx < b.x0 || wx > b.x1 || wy < b.y0 || wy > b.y1) continue
    if (!best || b.prio > best.prio || (b.prio === best.prio && b.y1 > best.y1)) best = b
  }
  return best
}
