/**
 * "Karawane über die Dünen": drawing helpers that need no state of the page: the paper-doll animal (body, tail, four legs in two pieces each,
 * moved by the angles of `karawaneRig.ts`) and the light over the picture (sun or moon glow, vignette, twinkling stars).
 * The world is drawn with y up as -y (the canvas is turned that way by the page), lengths in metres.
 */
import { RIG_ART, meta } from '@/utils/karawaneArt'
import { RIG_PARAMS, newPose, rigPose, type Pose, type RigState } from '@/utils/karawaneRig'
import type { AnimalId } from '@/utils/karawaneUpgrades'

export type Images = Record<string, HTMLImageElement | undefined>

const pose: Pose = newPose()

/** Whether all pieces of an animal are loaded. */
export function hasRig(images: Images, animal: AnimalId): boolean {
  const pre = RIG_ART[animal].prefix
  for (let k = 1; k <= 6; k++) if (!images[`${pre}${k}`]) return false
  return true
}

/**
 * Draws the animal standing with its feet on the ground at (fx, fy), turned by `ang`. Returns where the collar ring is in the world (for the
 * strap of the pole). The legs are drawn first (far ones before near ones), then the tail, then the body on top.
 */
export function drawRigAnimal(
  c: CanvasRenderingContext2D,
  images: Images,
  animal: AnimalId,
  state: RigState,
  fx: number,
  fy: number,
  ang: number,
  out: { x: number; y: number }
): void {
  const art = RIG_ART[animal]
  const P = RIG_PARAMS[animal]
  rigPose(state, P, pose)
  const pre = art.prefix
  const body = images[`${pre}1`]!
  const tail = images[`${pre}2`]!
  const legsImg = [images[`${pre}3`]!, images[`${pre}4`]!, images[`${pre}5`]!, images[`${pre}6`]!]
  // the size of a picture pixel of the sheet in metres: a leg (from its fixing to the hoof) is `legLen` long
  const legRawH = meta(`${pre}3`, 'h', legsImg[0]!.height)
  const Hl = P.legLen / 0.97
  const k = Hl / legRawH
  const bodyW = meta(`${pre}1`, 'w', body.width) * k
  const bodyH = meta(`${pre}1`, 'h', body.height) * k
  const foreX0 = (art.fore.x - 0.5) * bodyW
  const hindX0 = (art.hind.x - 0.5) * bodyW
  const shift = -(foreX0 + hindX0) / 2
  const foreX = foreX0 + shift
  const hindX = hindX0 + shift
  const hipY = P.legLen
  const cs = Math.cos(ang)
  const sn = Math.sin(ang)

  c.save()
  c.translate(fx, -fy)
  c.rotate(-ang)

  // the legs: far fore, far hind, near fore, near hind
  const order = [1, 3, 0, 2]
  for (const li of order) {
    const im = legsImg[li]!
    const fore = li < 2
    const lw = (im.width / im.height) * Hl
    const px = fore ? foreX : hindX
    const lp = pose.legs[li]!
    const knee = art.knee[li]!
    const pivX = art.legX[li]! * lw
    c.save()
    c.translate(px, -(hipY + pose.bodyY))
    c.rotate(-lp.hip)
    // the upper part, from the fixing to the knee (a little more than that, so that the bend shows no gap)
    const upper = knee * im.height
    c.drawImage(im, 0, 0, im.width, upper + im.height * 0.015, -pivX, -0.03 * Hl, lw, (knee + 0.015) * Hl)
    // the lower part swings back at the knee
    c.translate(0, (knee - 0.03) * Hl)
    c.rotate(lp.knee)
    c.drawImage(im, 0, upper, im.width, im.height - upper, -pivX, 0, lw, (1 - knee) * Hl)
    c.restore()
  }

  // the body, with the tail behind it, bobbing and nodding around the hips
  c.translate(0, -(hipY + pose.bodyY))
  c.rotate(-pose.bodyPitch)
  const bx = foreX - art.fore.x * bodyW
  const by = -art.fore.y * bodyH
  const tw = (tail.width / tail.height) * (meta(`${pre}2`, 'h', tail.height) * k)
  const th = meta(`${pre}2`, 'h', tail.height) * k
  c.save()
  c.translate(bx + art.tailAt.x * bodyW, by + art.tailAt.y * bodyH)
  c.rotate(-pose.tail)
  c.drawImage(tail, -art.tailPivot.x * tw, -art.tailPivot.y * th, tw, th)
  c.restore()
  c.drawImage(body, bx, by, bodyW, bodyH)
  c.restore()

  // the collar ring in the world: in the body frame, then turned by the nod and the slope
  const rx = bx + art.ring.x * bodyW
  const ry = by + art.ring.y * bodyH
  const pc = Math.cos(pose.bodyPitch)
  const ps = Math.sin(pose.bodyPitch)
  // body frame (x right, y down) -> animal frame (y up): rotate by the pitch (counter-clockwise), lift by the hip height
  const ax = rx * pc - -ry * ps
  const ay = -ry * pc + rx * ps + hipY + pose.bodyY
  out.x = fx + ax * cs - ay * sn
  out.y = fy + ax * sn + ay * cs
}

// ── light and sky effects ──────────────────────────────────────────────────────────────────────────────────────────────────
/** The colour and the place (as shares of the screen) of the sun or moon glow of each mood, and how strong it is. */
export const GLOWS: Record<string, { rgb: string; x: number; y: number; a: number }> = {
  day: { rgb: '255,222,150', x: 0.78, y: 0.14, a: 0.28 },
  dusk: { rgb: '255,150,90', x: 0.12, y: 0.52, a: 0.32 },
  night: { rgb: '170,195,255', x: 0.72, y: 0.1, a: 0.16 },
  morning: { rgb: '255,240,190', x: 0.2, y: 0.2, a: 0.26 },
  bright: { rgb: '255,250,225', x: 0.62, y: 0.08, a: 0.26 },
  gold: { rgb: '255,205,120', x: 0.2, y: 0.36, a: 0.3 }
}

/** Soft light over the whole picture (in screen pixels) and a vignette that darkens the corners a little. */
export function drawLight(c: CanvasRenderingContext2D, mood: string, w: number, h: number, time: number): void {
  const g = GLOWS[mood] ?? GLOWS.day!
  const pulse = 1 + 0.06 * Math.sin(time * 0.6)
  const rad = Math.max(w, h) * 0.75
  const grad = c.createRadialGradient(g.x * w, g.y * h, 0, g.x * w, g.y * h, rad)
  grad.addColorStop(0, `rgba(${g.rgb},${g.a * pulse})`)
  grad.addColorStop(1, `rgba(${g.rgb},0)`)
  c.save()
  c.globalCompositeOperation = 'lighter'
  c.fillStyle = grad
  c.fillRect(0, 0, w, h)
  c.restore()
  const v = c.createRadialGradient(w / 2, h * 0.55, Math.min(w, h) * 0.45, w / 2, h * 0.55, Math.max(w, h) * 0.75)
  v.addColorStop(0, 'rgba(20,10,0,0)')
  v.addColorStop(1, mood === 'night' ? 'rgba(0,0,30,0.38)' : 'rgba(40,15,0,0.22)')
  c.fillStyle = v
  c.fillRect(0, 0, w, h)
}

const STARS: { x: number; y: number; r: number; p: number }[] = []
for (let i = 0; i < 46; i++) {
  // a fixed scatter (no random numbers at run time: the same sky every time)
  const a = Math.sin(i * 12.9898) * 43758.5453
  const b = Math.sin(i * 78.233) * 12543.2189
  STARS.push({ x: a - Math.floor(a), y: (b - Math.floor(b)) * 0.55, r: 0.8 + ((i * 7) % 5) * 0.35, p: i * 1.7 })
}

/** Twinkling stars in the upper part of a night sky. */
export function drawStars(c: CanvasRenderingContext2D, w: number, h: number, time: number): void {
  c.save()
  c.fillStyle = '#fffbe0'
  for (const s of STARS) {
    c.globalAlpha = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(time * 1.8 + s.p))
    c.beginPath()
    c.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2)
    c.fill()
  }
  c.restore()
}
