/**
 * The 40 levels of "Bezalels Werkstatt" in 4 chapters of 10: the pieces, the silhouette (the way the pieces lie in the finished figure; found and
 * checked by `scripts/bezalel-design.ts`, see `bezalelLevelData.ts`), and the picture that appears when the figure is finished (`o01` to `o40`).
 */
import { LEVEL_DATA } from './bezalelLevelData'
import { bbox, outlineOf, placementPoly, type PieceId, type Placement, type Pt, type Seg } from './bezalelTangram'

export const CHAPTER_COUNT = 4
export const LEVELS_PER_CHAPTER = 10

/** The picture of the object of every level (the pictures o01 to o40 were painted in the order of the story, the levels are ordered by their figures). */
const PICTURE = [1, 3, 2, 4, 5, 6, 7, 9, 8, 10, 12, 14, 15, 16, 17, 13, 11, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40]

export interface Level {
  /** 0 to 39. */
  index: number
  chapter: number
  /** 0 to 9 in the chapter. */
  pos: number
  id: string
  /** The name of the picture of the finished object (`images/spiele-gross/bezalel/<picture>.webp`). */
  picture: string
  pieces: PieceId[]
  solution: Placement[]
  /** The polygons of the finished figure (every piece where it lies in the solution). */
  polys: Pt[][]
  /** The outline of the figure (the edges and the corners where it turns). */
  edges: Seg[]
  corners: Pt[]
  box: { x0: number; y0: number; x1: number; y1: number }
  /** How many ways the solver finds to fill the figure (equal pieces swapping places are one way). */
  ways: number
}

export const LEVELS: Level[] = LEVEL_DATA.map((d, i) => {
  const polys = d.solution.map(placementPoly)
  const o = outlineOf(polys)
  return {
    index: i,
    chapter: Math.floor(i / LEVELS_PER_CHAPTER),
    pos: i % LEVELS_PER_CHAPTER,
    id: d.id,
    picture: `o${String(PICTURE[i]!).padStart(2, '0')}`,
    pieces: d.pieces,
    solution: d.solution,
    polys,
    edges: o.edges,
    corners: o.corners,
    box: bbox(polys),
    ways: d.ways
  }
})
