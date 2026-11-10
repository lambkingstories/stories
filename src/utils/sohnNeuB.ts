/**
 * The pure part of the game "Hand in hand" (`reigen`, field `dance`) of "Der verlorene Sohn" (id `sohn`, Luke 15,24-25: "and they began to be merry ... he heard musick and dancing").
 * The dancers stand in the courtyard; the child joins them with bands, two hands for each dancer, until all of them are one single ring. Then the ring turns.
 * Round 1 (`neighbours`): only the dancer who stands next to you (in the order of the ring) may be joined. Round 2 (`free`): any two dancers may be joined, but no band may cross another,
 * nobody holds more than two hands and a ring that closes before all are in jumps open again.
 * All places are percent of the picture (width and height), the places of the dancers are the middle of the body. Distances are in "units" (percent of the width).
 * The arithmetic has no clock and no dice of its own.
 */
import { offDist } from '@/utils/sohnNeuA'
import type { Pt } from '@/utils/sohnNeuA'

export type { Pt }

/** A dancer: what he is called (screen readers) and his picture (transparent, the whole body, arms a little raised). */
export interface DancerLook {
  id: string
  name: string
  image: string
}
/** Where a dancer stands (the middle of the body, percent). */
export interface DancePlace extends Pt {
  id: string
}
/**
 * A round: the hint, the rule (`neighbours` or `free`), where the dancers stand and the order of one ring through all of them (a closed line without a crossing; the solution,
 * used by "Help me" and by the test). In `neighbours` only the pairs next to each other in `order` may be joined.
 */
export interface DanceRound {
  hint: string
  mode: 'neighbours' | 'free'
  places: DancePlace[]
  order: string[]
}
/**
 * The game "Hand in hand" (`reigen`): the courtyard (3:2, empty in the middle), the golden band (tile, 256 x 48, transparent, horizontally repeatable), three little notes (transparent), the
 * lyre player (transparent, decoration at the edge), the dancers (all the same size: `dancerW` percent of the width, the picture `dancerRatio` times as wide as high), `handR` how far the hands
 * reach from the middle of a dancer (units; the band starts there), `bandH` how thick the band is (units), and `hopMs` how long a dancer needs from one place of the ring to the next while it turns.
 */
export interface DanceGame {
  background: string
  band: string
  notes: string[]
  lyre: string
  lyreAt: Pt & { w: number }
  ratio?: number
  dancers: DancerLook[]
  dancerW: number
  dancerRatio: number
  handR: number
  bandH: number
  hopMs: number
  rounds: DanceRound[]
}

/** A band between two dancers (the ids; the order does not matter). */
export type DanceBand = [string, string]
export const DANCE_PHONE_W = 360
export const DANCE_TOUCH = 44
/** How many times the ring goes round when it turns. */
export const DANCE_LOOPS = 2

export const danceKey = (a: string, b: string): string => (a < b ? `${a}|${b}` : `${b}|${a}`)
export const danceHas = (bands: readonly DanceBand[], a: string, b: string): boolean => bands.some((x) => danceKey(x[0], x[1]) === danceKey(a, b))
export const danceDegree = (bands: readonly DanceBand[], id: string): number => bands.filter((b) => b[0] === id || b[1] === id).length
/** The dancers joined to `id` by bands, directly or through others (including `id`). */
export function danceChain(bands: readonly DanceBand[], id: string): string[] {
  const seen = new Set<string>([id])
  const todo = [id]
  while (todo.length) {
    const cur = todo.pop()!
    for (const [a, b] of bands) {
      const other = a === cur ? b : b === cur ? a : null
      if (other && !seen.has(other)) {
        seen.add(other)
        todo.push(other)
      }
    }
  }
  return [...seen]
}
/** The pairs of the ring (the neighbours in `order`, the last with the first). */
export function danceRingPairs(order: readonly string[]): DanceBand[] {
  return order.map((id, i) => [id, order[(i + 1) % order.length]!] as DanceBand)
}
export const danceNeighbours = (round: Pick<DanceRound, 'order'>, a: string, b: string): boolean => danceHas(danceRingPairs(round.order), a, b)

const orient = (a: Pt, b: Pt, c: Pt, ratio: number): number => (b.x - a.x) * ((c.y - a.y) / ratio) - ((b.y - a.y) / ratio) * (c.x - a.x)
const strictlyInside = (a: Pt, b: Pt, c: Pt, ratio: number): boolean => {
  // c lies on the line ab; is it between a and b (not at an end)?
  const dx = b.x - a.x
  const dy = (b.y - a.y) / ratio
  const t = ((c.x - a.x) * dx + ((c.y - a.y) / ratio) * dy) / (dx * dx + dy * dy || 1)
  return t > 1e-6 && t < 1 - 1e-6
}
/** Do the lines a-b and c-d cross (a touch at an end of the other line counts, a shared end does not; the caller leaves out bands that share a dancer)? */
export function danceCross(a: Pt, b: Pt, c: Pt, d: Pt, ratio = 1.5): boolean {
  const o1 = orient(a, b, c, ratio)
  const o2 = orient(a, b, d, ratio)
  const o3 = orient(c, d, a, ratio)
  const o4 = orient(c, d, b, ratio)
  if (o1 * o2 < 0 && o3 * o4 < 0) return true
  const eps = 1e-9
  if (Math.abs(o1) < eps && strictlyInside(a, b, c, ratio)) return true
  if (Math.abs(o2) < eps && strictlyInside(a, b, d, ratio)) return true
  if (Math.abs(o3) < eps && strictlyInside(c, d, a, ratio)) return true
  if (Math.abs(o4) < eps && strictlyInside(c, d, b, ratio)) return true
  return false
}

export type DanceVerdict =
  | { ok: true; closes: boolean }
  | { ok: false; why: 'same' | 'full' | 'far' | 'cross' | 'early'; mistake: boolean }

const placeOf = (round: Pick<DanceRound, 'places'>, id: string): DancePlace | undefined => round.places.find((p) => p.id === id)

/**
 * May the dancers `a` and `b` be joined now? `same`: they are joined already (nothing happens); `full`: one of them holds two hands already (a soft "no", no mistake);
 * `far` (round 1): not the neighbour in the ring (mistake); `cross`: the band would cross another (mistake); `early`: the ring would close before all are in (mistake).
 * `closes`: the band completes the ring of all the dancers.
 */
export function danceConnect(round: DanceRound, bands: readonly DanceBand[], a: string, b: string, ratio = 1.5): DanceVerdict {
  if (a === b || danceHas(bands, a, b)) return { ok: false, why: 'same', mistake: false }
  if (round.mode === 'neighbours' && !danceNeighbours(round, a, b)) return { ok: false, why: 'far', mistake: true }
  if (danceDegree(bands, a) >= 2 || danceDegree(bands, b) >= 2) return { ok: false, why: 'full', mistake: false }
  const pa = placeOf(round, a)
  const pb = placeOf(round, b)
  if (pa && pb) {
    for (const [c, d] of bands) {
      if (c === a || c === b || d === a || d === b) continue
      const pc = placeOf(round, c)
      const pd = placeOf(round, d)
      if (pc && pd && danceCross(pa, pb, pc, pd, ratio)) return { ok: false, why: 'cross', mistake: true }
    }
  }
  const chain = danceChain(bands, a)
  if (chain.includes(b)) {
    // the ends of one chain: closing it makes a ring
    if (chain.length < round.places.length) return { ok: false, why: 'early', mistake: true }
    return { ok: true, closes: true }
  }
  return { ok: true, closes: false }
}
/** All dancers hold two hands and form one single ring. */
export function danceDone(round: Pick<DanceRound, 'places'>, bands: readonly DanceBand[]): boolean {
  const n = round.places.length
  if (bands.length !== n || n < 3) return false
  if (round.places.some((p) => danceDegree(bands, p.id) !== 2)) return false
  return danceChain(bands, round.places[0]!.id).length === n
}
/** The ring the bands make, as a list of ids from the first dancer round to the last (only when every dancer holds two hands and all are one ring; else `[]`). */
export function danceRingOrder(round: Pick<DanceRound, 'places'>, bands: readonly DanceBand[]): string[] {
  if (!danceDone(round, bands)) return []
  const out = [round.places[0]!.id]
  let prev = ''
  while (out.length < round.places.length) {
    const cur = out[out.length - 1]!
    const next = bands.map((b) => (b[0] === cur ? b[1] : b[1] === cur ? b[0] : null)).find((o): o is string => !!o && o !== prev)
    if (!next) break
    prev = cur
    out.push(next)
  }
  return out
}
/**
 * "Help me": first a band that is not part of the ring of the solution (it is taken away; `remove`), else the next pair of the ring that is not joined yet (`join`).
 * Following the help never costs a mistake. `null` when the ring is complete.
 */
export function danceHelp(round: DanceRound, bands: readonly DanceBand[]): { remove: DanceBand } | { join: DanceBand } | null {
  const ring = danceRingPairs(round.order)
  const stray = bands.find((b) => !danceHas(ring, b[0], b[1]))
  if (stray) return { remove: stray }
  const next = ring.find((p) => !danceHas(bands, p[0], p[1]))
  return next ? { join: next } : null
}

/** The band between two dancers as it is drawn: where it starts (at the hand of the first dancer), how long it is (units), at which angle (degrees) it lies. */
export function danceBandOf(game: Pick<DanceGame, 'handR' | 'ratio'>, pa: Pt, pb: Pt): { x: number; y: number; len: number; angle: number } {
  const ratio = game.ratio ?? 1.5
  const dx = pb.x - pa.x
  const dy = (pb.y - pa.y) / ratio
  const d = Math.hypot(dx, dy) || 1
  const ux = dx / d
  const uy = dy / d
  return { x: pa.x + ux * game.handR, y: pa.y + uy * game.handR * ratio, len: Math.max(0, d - 2 * game.handR), angle: (Math.atan2(dy, dx) * 180) / Math.PI }
}
/** The place of a dancer while the ring turns: `u` is the place on the ring in steps (0 = where he stands; 1 = the place of the next dancer in `order`). */
export function danceRingAt(points: readonly Pt[], u: number): Pt {
  const n = points.length
  if (n === 0) return { x: 0, y: 0 }
  const f = ((u % n) + n) % n
  const i = Math.floor(f)
  const k = f - i
  const a = points[i]!
  const b = points[(i + 1) % n]!
  return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k }
}
/** How long the ring turns (milliseconds). */
export const danceSpinMs = (game: Pick<DanceGame, 'hopMs'>, n: number): number => n * DANCE_LOOPS * game.hopMs

/** The size (pixels) of a finger target of a dancer on a screen as wide as `phoneW`, at least 44 x 44. */
export function danceTouchSize(game: Pick<DanceGame, 'dancerW' | 'dancerRatio'>, phoneW = DANCE_PHONE_W): { w: number; h: number } {
  const w = (game.dancerW / 100) * phoneW
  return { w: Math.max(w, DANCE_TOUCH), h: Math.max(w / game.dancerRatio, DANCE_TOUCH) }
}

const simple = (pts: readonly Pt[], ratio: number): boolean => {
  const n = pts.length
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (j === i + 1 || (i === 0 && j === n - 1)) continue
      if (danceCross(pts[i]!, pts[(i + 1) % n]!, pts[j]!, pts[(j + 1) % n]!, ratio)) return false
    }
  }
  return true
}

/** The problems of the data of `reigen` (an empty list is good). */
export function danceProblems(game: DanceGame): string[] {
  const out: string[] = []
  const ratio = game.ratio ?? 1.5
  if (!game.background) out.push('no picture of the courtyard')
  if (!game.band) out.push('no picture of the band')
  if (game.notes.length < 3 || game.notes.some((n) => !n)) out.push('there must be three pictures of notes')
  if (!game.lyre) out.push('no picture of the lyre player')
  if (game.lyreAt.w < 8) out.push('the lyre player is too small')
  if (game.dancerW < 11 || game.dancerW > 18) out.push('a dancer should be between 11 and 18 percent wide (about 40 to 65 pixels on a phone)')
  if (!(game.dancerRatio > 0.3 && game.dancerRatio < 1.2)) out.push('the ratio of a dancer picture is not sensible')
  if (game.handR < 3 || game.handR > game.dancerW) out.push('the reach of the hands is not sensible (between 3 units and the width of a dancer)')
  if (game.bandH < 1.5 || game.bandH > 6) out.push('the band should be between 1.5 and 6 units thick')
  if (game.hopMs < 300 || game.hopMs > 900) out.push('a turning step should take 300 to 900 milliseconds')
  const ids = game.dancers.map((d) => d.id)
  if (new Set(ids).size !== ids.length) out.push('two dancers have the same id')
  for (const d of game.dancers) if (!d.image || !d.name) out.push(`dancer ${d.id} needs a picture and a name`)
  if (game.rounds.length !== 2) out.push('there must be two rounds')
  const tw = danceTouchSize(game)
  game.rounds.forEach((r, ri) => {
    const n = ri + 1
    const want = ri === 0 ? 'neighbours' : 'free'
    if (r.mode !== want) out.push(`round ${n} should be played with the rule "${want}"`)
    if (!r.hint) out.push(`round ${n} has no hint`)
    const pids = r.places.map((p) => p.id)
    if (new Set(pids).size !== pids.length) out.push(`round ${n}: a dancer stands twice`)
    for (const p of r.places) if (!ids.includes(p.id)) out.push(`round ${n}: unknown dancer ${p.id}`)
    if (r.places.length < 5) out.push(`round ${n}: at least five dancers`)
    if ([...r.order].sort().join() !== [...pids].sort().join()) out.push(`round ${n}: the ring must name every dancer once`)
    const pts = r.order.map((id) => placeOf(r, id)).filter((p): p is DancePlace => !!p)
    if (pts.length === r.places.length) {
      if (!simple(pts, ratio)) out.push(`round ${n}: the ring crosses itself`)
      // the bands of the ring have room (the hands reach, then a bit of band)
      pts.forEach((p, i) => {
        const q = pts[(i + 1) % pts.length]!
        if (offDist(p, q, ratio) - 2 * game.handR < 4) out.push(`round ${n}: ${p.id} and ${q.id} stand too close for a band between their hands`)
      })
      // the 'free' round: the two neighbours of a dancer in the ring are among his three nearest
      if (r.mode === 'free') {
        pts.forEach((p, i) => {
          const near = r.places
            .filter((o) => o.id !== p.id)
            .sort((a, b) => offDist(p, a, ratio) - offDist(p, b, ratio))
            .slice(0, 3)
            .map((o) => o.id)
          for (const q of [pts[(i + 1) % pts.length]!, pts[(i + pts.length - 1) % pts.length]!]) {
            if (!near.includes(q.id)) out.push(`round ${n}: ${q.id} is not among the three nearest of his neighbour ${p.id} (the natural way would not lead to the ring)`)
          }
        })
      }
    }
    // finger targets do not cover each other and stay in the picture
    r.places.forEach((p, i) => {
      const hw = tw.w / 2 / (DANCE_PHONE_W / 100)
      const hh = tw.h / 2 / ((DANCE_PHONE_W / ratio) / 100)
      if (p.x - hw < 0 || p.x + hw > 100 || p.y - hh < 0 || p.y + hh > 100) out.push(`round ${n}: ${p.id} reaches out of the picture`)
      r.places.forEach((o, k) => {
        if (k <= i) return
        const dx = Math.abs(p.x - o.x) * (DANCE_PHONE_W / 100)
        const dy = Math.abs(p.y - o.y) * (DANCE_PHONE_W / ratio / 100)
        if (dx < tw.w && dy < tw.h) out.push(`round ${n}: the finger targets of ${p.id} and ${o.id} overlap`)
      })
    })
    // "Help me" solves the round without a mistake
    let bands: DanceBand[] = []
    let mistakes = 0
    for (let k = 0; k < r.places.length * 3 && !danceDone(r, bands); k++) {
      const h = danceHelp(r, bands)
      if (!h) break
      if ('remove' in h) {
        bands = bands.filter((b) => danceKey(b[0], b[1]) !== danceKey(h.remove[0], h.remove[1]))
        continue
      }
      const v = danceConnect(r, bands, h.join[0], h.join[1], ratio)
      if (!v.ok) {
        mistakes++
        break
      }
      bands.push(h.join)
    }
    if (mistakes > 0 || !danceDone(r, bands)) out.push(`round ${n}: following "Help me" does not solve the round`)
  })
  if (game.rounds.length === 2) {
    if (game.rounds[1]!.places.length <= game.rounds[0]!.places.length) out.push('round 2 should have more dancers than round 1')
    if (game.rounds[1]!.places.length > 12) out.push('more than twelve dancers are too many for a phone')
  }
  return out
}

