/**
 * "Der Töpfer": the picture of a vessel, made from its profile. A small software renderer for a body of revolution (no canvas needed,
 * so it can be tested): for every pixel of the vessel it works out the angle on the turned body, the surface normal (light from the left,
 * soft light from the right, a gloss that depends on the surface) and the place in the texture. Those maps (`buildMaps`) change only when
 * the profile changes; for the turning of the wheel only the texture is shifted (`paintVessel`), which is cheap.
 * The textures are painted pictures: the clay (`ton.webp`) and the ornaments (`muster-*.webp`); this file only wraps them round the body.
 */
import { DY, TILT, radiusAt, type Profile } from './toepferGame'

export const TEX = 512
export const TEX_MASK = TEX - 1
/** The ornaments: eight copies of a motif round the vessel. */
export const PAT_CELLS = 8
export const PAT_H = TEX / PAT_CELLS
const R_REF = 0.6
/** The world size of one ornament, and the gap between two rows of them. */
export const CELL_WORLD = (2 * Math.PI * R_REF) / PAT_CELLS
const PERIOD = CELL_WORLD * 1.9
const NO_PAT = 0xffff

export interface Look {
  /** The brightness of the shadow side (0 = black, 1 = as bright as the light side). */
  ambient: number
  /** The strength of the gloss (0..255) and how small it is (the exponent of the highlight). */
  spec: number
  shine: number
}

/** Wet clay on the wheel: a soft, moist gloss. Fired clay: matt. Glaze: bright, small highlights. */
export const LOOK_WET: Look = { ambient: 0.4, spec: 70, shine: 18 }
export const LOOK_FIRED: Look = { ambient: 0.42, spec: 14, shine: 8 }
export const LOOK_GLAZE: Look = { ambient: 0.4, spec: 150, shine: 38 }

export interface Maps {
  w: number
  h: number
  n: number
  /** The pixel column of the axis, the row of the rim (the middle of the rim ellipse), the radius of the rim in pixels, the row of the foot. */
  cx: number
  rimRow: number
  rimR: number
  baseRow: number
  u: Uint16Array
  v: Uint16Array
  pv: Uint16Array
  sh: Uint8Array
  sp: Uint8Array
  cov: Uint8Array
}

// the light: from the left, above and in front
const LX = -0.62
const LY = 0.42
const LZ = 0.66
const LL = Math.hypot(LX, LY, LZ)
const lx = LX / LL
const ly = LY / LL
const lz = LZ / LL
// the half vector between the light and the eye (the eye looks along z)
const HX = lx
const HY = ly
const HZ = lz + 1
const HL = Math.hypot(HX, HY, HZ)
const hx = HX / HL
const hy = HY / HL
const hz = HZ / HL

const mod = (a: number, n: number) => ((a % n) + n) % n

/** The widest radius of a vessel. */
export function maxRadius(p: Profile): number {
  let m = 0
  const top = Math.min(p.r.length - 1, Math.ceil(p.h / DY))
  for (let i = 0; i <= top; i++) m = Math.max(m, p.r[i]!)
  return m
}

/** The height of the ornaments: the widest place of the body between the foot and the neck (never the flared rim itself). */
export function bellyOf(p: Profile): number {
  let best = 0
  let at = p.h * 0.5
  const lo = Math.floor((p.h * 0.18) / DY)
  const hi = Math.floor((p.h * 0.72) / DY)
  for (let i = lo; i <= hi; i++) {
    if (p.r[i]! > best) {
      best = p.r[i]!
      at = i * DY
    }
  }
  return at
}

/**
 * The maps of a vessel at the scale `S` (pixels per world unit). `band` is the height of the middle of the first row of ornaments
 * (NaN: no ornaments). Allocates the arrays; call it only when the profile or the size changes.
 */
export function buildMaps(p: Profile, S: number, look: Look, band: number): Maps {
  const rmax = maxRadius(p) * S + 2
  const rim = radiusAt(p, p.h) * S
  const foot = radiusAt(p, 0) * S
  const w = Math.ceil(2 * rmax) + 4
  const padTop = Math.ceil(TILT * rim) + 3
  const bodyH = Math.ceil(p.h * S)
  const capH = Math.ceil(TILT * foot) + 2
  const h = padTop + bodyH + capH
  const n = w * h
  const m: Maps = {
    w,
    h,
    n,
    cx: w / 2,
    rimRow: padTop,
    rimR: rim,
    baseRow: padTop + p.h * S,
    u: new Uint16Array(n),
    v: new Uint16Array(n),
    pv: new Uint16Array(n).fill(NO_PAT),
    sh: new Uint8Array(n),
    sp: new Uint8Array(n),
    cov: new Uint8Array(n)
  }
  const rowBase = m.baseRow
  const kv = TEX / (2 * Math.PI * R_REF)
  const withBand = Number.isFinite(band)
  for (let j = 0; j < h; j++) {
    const yw = (rowBase - (j + 0.5)) / S
    const off = j * w
    if (yw > p.h) continue
    if (yw >= 0) {
      const r = radiusAt(p, yw) * S
      if (r <= 0) continue
      const r1 = radiusAt(p, Math.min(p.h, yw + DY))
      const r0 = radiusAt(p, Math.max(0, yw - DY))
      const slope = (r1 - r0) / (Math.min(p.h, yw + DY) - Math.max(0, yw - DY) || 1)
      const sq = Math.sqrt(1 + slope * slope)
      const vrow = mod(Math.floor(yw * kv), TEX)
      let pvrow = NO_PAT
      if (withBand && yw > 0.1 && yw < p.h - 0.08) {
        const rel = mod(yw - (band - CELL_WORLD / 2), PERIOD)
        if (rel < CELL_WORLD) pvrow = PAT_H - 1 - Math.min(PAT_H - 1, Math.floor((rel / CELL_WORLD) * PAT_H))
      }
      const i0 = Math.max(0, Math.floor(m.cx - r - 1))
      const i1 = Math.min(w - 1, Math.ceil(m.cx + r + 1))
      for (let i = i0; i <= i1; i++) {
        const dx = i + 0.5 - m.cx
        const cov = Math.max(0, Math.min(1, r + 0.5 - Math.abs(dx)))
        if (cov <= 0) continue
        const s = Math.max(-1, Math.min(1, dx / r))
        const th = Math.asin(s)
        const cs = Math.sqrt(1 - s * s)
        const nx = s / sq
        const ny = -slope / sq
        const nz = cs / sq
        const diff = Math.max(0, nx * lx + ny * ly + nz * lz)
        const back = Math.max(0, nx * 0.85 + nz * 0.1)
        let mult = look.ambient + (1 - look.ambient) * diff * 1.18 + 0.16 * back * back
        mult *= 0.84 + 0.16 * Math.min(1, cs * 1.6)
        const nh = Math.max(0, nx * hx + ny * hy + nz * hz)
        const sp = Math.pow(nh, look.shine) * look.spec
        const k = off + i
        m.cov[k] = Math.round(cov * 255)
        m.u[k] = Math.floor((th / (2 * Math.PI)) * TEX + TEX)
        m.v[k] = vrow
        m.pv[k] = pvrow
        m.sh[k] = Math.max(0, Math.min(255, Math.round(mult * 128)))
        m.sp[k] = Math.max(0, Math.min(255, Math.round(sp)))
      }
    } else {
      // the foot seen from above: the wall goes on round the bottom ellipse, in front of the base line (darker, near the wheel)
      const dj = -yw * S
      const ry = TILT * foot
      if (dj > ry) continue
      const half = foot * Math.sqrt(Math.max(0, 1 - (dj / ry) * (dj / ry)))
      const r1 = radiusAt(p, DY)
      const slope = (r1 - radiusAt(p, 0)) / DY
      const sq = Math.sqrt(1 + slope * slope)
      const vcap = mod(Math.floor(yw * kv), TEX)
      const near = 0.62 + 0.38 * (1 - dj / (ry + 0.001))
      const i0 = Math.max(0, Math.floor(m.cx - half - 1))
      const i1 = Math.min(w - 1, Math.ceil(m.cx + half + 1))
      for (let i = i0; i <= i1; i++) {
        const dx = i + 0.5 - m.cx
        const cov = Math.max(0, Math.min(1, half + 0.5 - Math.abs(dx)))
        if (cov <= 0) continue
        const s = Math.max(-1, Math.min(1, dx / foot))
        const cs = Math.sqrt(1 - s * s)
        const nx = s / sq
        const ny = -slope / sq
        const nz = cs / sq
        const diff = Math.max(0, nx * lx + ny * ly + nz * lz)
        const mult = (look.ambient + (1 - look.ambient) * diff * 1.18) * near
        const k = off + i
        m.cov[k] = Math.round(cov * 255)
        m.u[k] = Math.floor((Math.asin(s) / (2 * Math.PI)) * TEX + TEX)
        m.v[k] = vcap
        m.sh[k] = Math.max(0, Math.min(255, Math.round(mult * 128)))
        m.sp[k] = 0
      }
    }
  }
  return m
}

/** The colours of a texture: `clay` is the RGBA data of `ton.webp` at TEX x TEX. */
export type SkinKind = 'wet' | 'fired' | 'glaze'

const pack = (r: number, g: number, b: number) => (255 << 24) | (Math.max(0, Math.min(255, b | 0)) << 16) | (Math.max(0, Math.min(255, g | 0)) << 8) | Math.max(0, Math.min(255, r | 0))

/** The skin (the colour wrapped round the vessel) for wet clay, fired clay or one glaze colour. */
export function makeSkin(clay: Uint8ClampedArray, kind: SkinKind, glaze: readonly [number, number, number] = [200, 200, 200]): Uint32Array {
  const out = new Uint32Array(TEX * TEX)
  let mean = 0
  for (let i = 0; i < TEX * TEX; i++) mean += 0.3 * clay[i * 4]! + 0.59 * clay[i * 4 + 1]! + 0.11 * clay[i * 4 + 2]!
  mean /= TEX * TEX
  for (let i = 0; i < TEX * TEX; i++) {
    const r = clay[i * 4]!
    const g = clay[i * 4 + 1]!
    const b = clay[i * 4 + 2]!
    const lum = 0.3 * r + 0.59 * g + 0.11 * b
    if (kind === 'wet') {
      const mix = 0.3
      out[i] = pack((r * (1 - mix) + lum * mix) * 0.66, (g * (1 - mix) + lum * mix) * 0.6, (b * (1 - mix) + lum * mix) * 0.58)
    } else if (kind === 'fired') {
      const mix = 0.12
      out[i] = pack((r * (1 - mix) + lum * mix) * 1.04, (g * (1 - mix) + lum * mix) * 1.0, (b * (1 - mix) + lum * mix) * 0.92)
    } else {
      const f = Math.max(0.78, Math.min(1.22, 0.96 + 0.5 * (lum / mean - 1)))
      out[i] = pack(glaze[0] * f, glaze[1] * f, glaze[2] * f)
    }
  }
  return out
}

/**
 * One row of ornaments as an ink map (0 = no ink, 255 = full ink), TEX wide and PAT_H high: the motif `tile` (RGBA, `tw` x `th`, dark ink on
 * white) scaled to the height of a cell and repeated PAT_CELLS times round.
 */
export function makePattern(tile: Uint8ClampedArray, tw: number, th: number): Uint8Array {
  const cell = new Uint8Array(PAT_H * PAT_H)
  for (let y = 0; y < PAT_H; y++) {
    for (let x = 0; x < PAT_H; x++) {
      const x0 = Math.floor((x * tw) / PAT_H)
      const x1 = Math.max(x0 + 1, Math.floor(((x + 1) * tw) / PAT_H))
      const y0 = Math.floor((y * th) / PAT_H)
      const y1 = Math.max(y0 + 1, Math.floor(((y + 1) * th) / PAT_H))
      let sum = 0
      let cnt = 0
      for (let yy = y0; yy < y1; yy++) {
        for (let xx = x0; xx < x1; xx++) {
          const k = (yy * tw + xx) * 4
          sum += 0.3 * tile[k]! + 0.59 * tile[k + 1]! + 0.11 * tile[k + 2]!
          cnt++
        }
      }
      cell[y * PAT_H + x] = Math.max(0, Math.min(255, Math.round((1 - sum / cnt / 255) * 255 * 1.15)))
    }
  }
  const out = new Uint8Array(TEX * PAT_H)
  for (let y = 0; y < PAT_H; y++) for (let c = 0; c < PAT_CELLS; c++) for (let x = 0; x < PAT_H; x++) out[y * TEX + c * PAT_H + x] = cell[y * PAT_H + x]!
  return out
}

export interface Skin {
  colour: Uint32Array
  /** The ornaments (an ink map) and the colour of the ink, or null for none. */
  pattern: Uint8Array | null
  ink: readonly [number, number, number]
}

/**
 * Paints the vessel into `out` (RGBA, straight alpha, one 32 bit value per pixel of `m`): the skin turned by `turn` columns of the texture,
 * the ornaments over it, the shading and the gloss on top.
 */
export function paintVessel(m: Maps, out: Uint32Array, skin: Skin, turn: number): void {
  const colour = skin.colour
  const pat = skin.pattern
  const ir = skin.ink[0]
  const ig = skin.ink[1]
  const ib = skin.ink[2]
  const t = Math.floor(turn)
  const { u, v, pv, sh, sp, cov, n } = m
  for (let i = 0; i < n; i++) {
    const a = cov[i]!
    if (a === 0) {
      out[i] = 0
      continue
    }
    const ux = (u[i]! + t) & TEX_MASK
    const c = colour[(v[i]! << 9) | ux]!
    let r = c & 255
    let g = (c >> 8) & 255
    let b = (c >> 16) & 255
    if (pat !== null) {
      const row = pv[i]!
      if (row !== NO_PAT) {
        const ink = pat[row * TEX + ux]!
        if (ink > 0) {
          r += ((ir - r) * ink) >> 8
          g += ((ig - g) * ink) >> 8
          b += ((ib - b) * ink) >> 8
        }
      }
    }
    const s = sh[i]!
    const hl = sp[i]!
    r = (r * s) >> 7
    g = (g * s) >> 7
    b = (b * s) >> 7
    r += hl
    g += hl
    b += hl
    out[i] = (a << 24) | ((b > 255 ? 255 : b) << 16) | ((g > 255 ? 255 : g) << 8) | (r > 255 ? 255 : r)
  }
}
