/**
 * Helpers for the pitch round of the building game: the child smears pitch along a seam with a finger. A seam is a polyline;
 * all numbers here are in one flat coordinate system (the units of the wall picture), so distances are the same in every direction.
 */
export type Pt = [number, number]

/** The point of the segment a-b that is nearest to p. */
function nearestOnSegment(p: Pt, a: Pt, b: Pt): Pt {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const len2 = dx * dx + dy * dy
  if (len2 === 0) return [a[0], a[1]]
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2))
  return [a[0] + t * dx, a[1] + t * dy]
}

export const dist = (a: Pt, b: Pt): number => Math.hypot(a[0] - b[0], a[1] - b[1])

/** The distance from p to the polyline and the point of the line that is nearest to p. */
export function nearestOnPolyline(p: Pt, line: Pt[]): { d: number; at: Pt } {
  let best: { d: number; at: Pt } = { d: Infinity, at: line[0] ?? p }
  for (let i = 0; i + 1 < line.length; i++) {
    const at = nearestOnSegment(p, line[i]!, line[i + 1]!)
    const d = dist(p, at)
    if (d < best.d) best = { d, at }
  }
  return best
}

export function polylineLength(line: Pt[]): number {
  let sum = 0
  for (let i = 0; i + 1 < line.length; i++) sum += dist(line[i]!, line[i + 1]!)
  return sum
}

/** n points spread evenly along the polyline (the first and the last point of the line included). */
export function sampleAlong(line: Pt[], n: number): Pt[] {
  const total = polylineLength(line)
  const out: Pt[] = []
  if (line.length === 0 || n < 2 || total === 0) return line.slice(0, 1)
  let seg = 0
  let passed = 0
  for (let k = 0; k < n; k++) {
    const target = (total * k) / (n - 1)
    while (seg + 2 < line.length && passed + dist(line[seg]!, line[seg + 1]!) < target) {
      passed += dist(line[seg]!, line[seg + 1]!)
      seg++
    }
    const a = line[seg]!
    const b = line[seg + 1]!
    const len = dist(a, b)
    const t = len === 0 ? 0 : Math.min(1, Math.max(0, (target - passed) / len))
    out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t])
  }
  return out
}
