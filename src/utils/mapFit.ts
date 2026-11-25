import type { JourneyMap, MapSpot } from '@/types/adventure'

/**
 * The adventure map is as high as the screen. Every stage is a round picture with its name under it (and, for the stage that comes next, the "Weiter" button);
 * the tab bar floats over the bottom of the map. When a round picture sits too low, the name and the button lie under the tab bar: the child sees no writing
 * and cannot go on (found on Anton's phone with "Johannes der Täufer", 25.11.2026).
 *
 * The rule, measured on Anton's phone (the tab bar starts at 85 % of the screen height; everything on the map grows with the screen height):
 *   middle of the round picture + half its diameter + the name plate and the button under it  <=  tab bar - a small margin.
 * Written as numbers (shares of the map height): `y + d * aspect / 2 + MAP_BELOW <= MAP_BOTTOM_LIMIT`, so `y` of every stage and of the exam is at most
 * about 0.646 (the value the first adventures were drawn with).
 */

/** Where the tab bar starts, as a share of the screen height (Anton's phone: 1690 of about 1980 px). */
export const MAP_TAB_BAR_TOP = 0.85
/** Free space left above the tab bar. */
export const MAP_MARGIN = 0.01
/** What hangs under the round picture, as a share of the map height: the name plate (0.034) and the button "Weiter" (together 0.092; measured at 812 px: 75 px). */
export const MAP_BELOW = 0.092
/** The lowest a name plate with the button may reach. */
export const MAP_BOTTOM_LIMIT = MAP_TAB_BAR_TOP - MAP_MARGIN
/** A little slack for the rounding of the first adventures (they are drawn at 0.649 where the exact limit is 0.646). */
export const MAP_SLACK = 0.005

/** The lowest share of the map height at which the middle of a round picture may lie. */
export function maxSpotY(d: number, aspect: number): number {
  return MAP_BOTTOM_LIMIT - MAP_BELOW - (d * aspect) / 2
}

/** How far down the name plate (and the button) of a spot reaches, as a share of the map height. */
export function spotBottom(s: MapSpot, aspect: number): number {
  return s.y + (s.d * aspect) / 2 + MAP_BELOW
}

/** The spots of a map that reach below the limit (an empty list is good). */
export function lowSpots(map: JourneyMap): { index: number; y: number; bottom: number }[] {
  return [...map.stages, map.exam]
    .map((s, index) => ({ index, y: s.y, bottom: spotBottom(s, map.aspect) }))
    .filter((s) => s.bottom > MAP_BOTTOM_LIMIT + MAP_SLACK)
}

/**
 * Brings a map into the rule: when a spot sits too low, the whole map layout (stages, exam and the beads of the way) is pressed together towards the top row,
 * so that the lowest spot lies exactly on the limit. A map that keeps the rule is returned as it is.
 */
export function fitMapToScreen(map: JourneyMap): JourneyMap {
  const spots = [...map.stages, map.exam]
  if (!spots.length || lowSpots(map).length === 0) return map
  const top = Math.min(...spots.map((s) => s.y))
  const allowed = Math.min(...spots.map((s) => maxSpotY(s.d, map.aspect)))
  const lowest = Math.max(...spots.map((s) => s.y))
  if (lowest <= allowed || lowest <= top) return map
  const f = (allowed - top) / (lowest - top)
  const squeeze = (y: number) => Math.round((top + (y - top) * f) * 10000) / 10000
  return {
    ...map,
    stages: map.stages.map((s) => ({ ...s, y: squeeze(s.y) })),
    exam: { ...map.exam, y: squeeze(map.exam.y) },
    path: map.path.map((seg) => seg.map(([x, y]) => [x, squeeze(y)] as [number, number]))
  }
}
