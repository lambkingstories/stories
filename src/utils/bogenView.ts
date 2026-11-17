/**
 * "Jonatans Pfeile": the maths between the finger and the bow (no Vue, so it can be tested). A touch gives `clientX/clientY`; the canvas lies at
 * `rect` on the page and the game draws it as `W` x `H` units. If the page was resized without the game being told (a tablet whose browser bar
 * slides away does that), the game's `W`/`H` and the real size of the canvas differ; the touch is then scaled by the real size, so that the
 * finger always hits what it touches.
 */
import { ANG_MAX, ANG_MIN, F_MIN } from './bogenGame'

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

/** The shortest pull (in pixels) that lets an arrow go; shorter is "put back". */
export const MIN_PULL_PX = 16

/** How far the finger has to go for the full power, from the size of the screen. */
export const maxPullOf = (W: number, H: number): number => Math.max(90, Math.min(150, Math.min(W, H) * 0.34))

export interface Aim {
  /** Degrees, power 0..1 of the full pull, the pulled distance in pixels, and whether it is long enough to shoot. */
  angle: number
  f: number
  pull: number
  ok: boolean
}

/**
 * The aim from a pull: the finger went `dx`, `dy` pixels away from where it touched down (screen: y points down). The arrow flies the other
 * way (pull down and left, it goes up and right). An aim backwards is held at the steepest or the flattest allowed angle.
 */
export function pullToAim(dx: number, dy: number, maxPull: number): Aim {
  const dirx = -dx
  const diry = dy
  const pull = Math.hypot(dx, dy)
  let angle = (Math.atan2(diry, dirx) * 180) / Math.PI
  if (dirx < 0) angle = diry >= 0 ? ANG_MAX : ANG_MIN
  angle = Math.max(ANG_MIN, Math.min(ANG_MAX, angle))
  const f = Math.max(F_MIN, Math.min(1, pull / maxPull))
  return { angle, f, pull, ok: pull >= MIN_PULL_PX }
}
