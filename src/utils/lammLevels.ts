/**
 * The levels of "Das verlorene Lamm": data only (see `lammGame.ts` for the signs of the layers and the rules). Five chapters after Psalm 23.
 * `min` is the fewest moves that win (the tests prove it with the solver), `par` the moves for three stars (best way with all flowers plus a little slack).
 * The levels were made with a tool (`Bonusspiele-Paket/lamm/tools/levels.ts`) and are kept here as plain data.
 */
import type { LevelDef } from '@/utils/lammGame'

export interface ChapterDef {
  /** Number of the picture (background) of the chapter. */
  bg: number
  /** The top and side material of the fixed floors. */
  floor: 'gras' | 'wiese' | 'kiesel' | 'nacht' | 'hof'
}

export const CHAPTERS: ChapterDef[] = [
  { bg: 1, floor: 'gras' },
  { bg: 2, floor: 'wiese' },
  { bg: 3, floor: 'kiesel' },
  { bg: 4, floor: 'nacht' },
  { bg: 5, floor: 'hof' }
]

export const LEVELS: LevelDef[] = [
  {
    id: 'huegel-1', chapter: 0, intro: 'stairs', min: 0, par: 1,
    layers: [
      ['S#>.'],
      ['...#o', '....#', '....G']
    ],
    groups: [],
    controls: [],
    deco: [{ s: 'busch', x: 0.7, y: -0.3, z: 0, k: 0.5, flip: true }, { s: 'busch', x: 3.7, y: 0.7, z: 1, k: 0.5, flip: true }, { s: 'baum', x: -0.32, y: -0.32, z: 0, k: 0.8 }]
  },
  {
    id: 'huegel-2', chapter: 0, intro: 'turn', min: 1, par: 2,
    layers: [
      ['..a..', 'S.a.G', '..a.o']
    ],
    groups: [{ id: 'a', kind: 'turn', pivot: [2, 1] }],
    controls: [{ h: [1, 3, 0], g: 'a' }],
    deco: [{ s: 'baum', x: -0.32, y: 0.68, z: 0, k: 0.8, flip: true }]
  },
  {
    id: 'huegel-3', chapter: 0, min: 3, par: 4,
    layers: [
      ['..a....', 'S.a.#..', '..a...o', '...bb.G', '....b..']
    ],
    groups: [{ id: 'a', kind: 'turn', pivot: [2, 1] }, { id: 'b', kind: 'turn', pivot: [4, 3] }],
    controls: [{ h: [0, 3, 0], g: 'a' }, { h: [5.5, 5, 0], g: 'b' }],
    deco: [{ s: 'busch', x: 3.7, y: 0.7, z: 0, k: 0.5 }, { s: 'baum', x: -0.32, y: 0.68, z: 0, k: 0.8, flip: true }]
  },
  {
    id: 'huegel-4', chapter: 0, intro: 'slide', min: 2, par: 3,
    layers: [
      ['S#..#G', '......', '..Aa..']
    ],
    groups: [{ id: 'a', kind: 'slide', step: [0, -1, 0], n: 2 }],
    controls: [{ h: [1, 3, 0], g: 'a' }],
    deco: [{ s: 'zaun', x: 0.7, y: -0.3, z: 0, k: 0.7, flip: true }, { s: 'baum', x: -0.32, y: -0.32, z: 0, k: 0.8 }]
  },
  {
    id: 'huegel-5', chapter: 0, intro: 'ride', min: 1, par: 2,
    layers: [
      ['.....', '.....', 'SaaA.', '.....', '..G..']
    ],
    groups: [{ id: 'a', kind: 'turn', pivot: [2, 2] }],
    controls: [{ h: [4, 4, 0], g: 'a' }],
    deco: [{ s: 'baum', x: -0.32, y: 1.68, z: 0, k: 0.8, flip: true }]
  },
  {
    id: 'huegel-6', chapter: 0, intro: 'perspective', min: 1, par: 2,
    layers: [
      ['S#'],
      ['.....', '.....', '..aaa', '.....', '...Go']
    ],
    groups: [{ id: 'a', kind: 'turn', pivot: [3, 2] }],
    controls: [{ h: [0, 3, 1], g: 'a' }],
    deco: [{ s: 'zaun', x: 0.7, y: -0.3, z: 0, k: 0.7 }, { s: 'baum', x: -0.32, y: -0.32, z: 0, k: 0.8, flip: true }]
  },
  {
    id: 'auen-1', chapter: 1, intro: 'lift', min: 1, par: 2,
    layers: [
      ['S#a..', '.o...'],
      ['...#G']
    ],
    groups: [{ id: 'a', kind: 'slide', step: [0, 0, 1], n: 1 }],
    controls: [{ h: [3, 1, 0], g: 'a' }],
    deco: [{ s: 'schilf', x: 2.7, y: -0.3, z: 1, k: 0.5 }, { s: 'baum', x: -0.32, y: -0.32, z: 0, k: 0.8, flip: true }]
  },
  {
    id: 'auen-2', chapter: 1, intro: 'fold', min: 2, par: 3,
    layers: [
      ['SAa#.', '.....', '..bbb', '.....', '...G.']
    ],
    groups: [{ id: 'a', kind: 'fold' }, { id: 'b', kind: 'turn', pivot: [3, 2] }],
    controls: [{ h: [0, 2, 0], g: 'a' }, { h: [1, 3, 0], g: 'b' }],
    deco: [{ s: 'busch', x: 2.7, y: -0.3, z: 0, k: 0.5 }, { s: 'baum', x: -0.32, y: -0.32, z: 0, k: 0.8 }]
  },
  {
    id: 'auen-3', chapter: 1, intro: 'link', min: 2, par: 3,
    layers: [
      ['..a......', 'S.a.#bbbG', '..a....o.']
    ],
    groups: [{ id: 'a', kind: 'turn', pivot: [2, 1] }, { id: 'b', kind: 'turn', pivot: [6, 1] }],
    controls: [{ h: [1, 3.2, 0], g: 'ab' }, { h: [7, 3.2, 0], g: 'b' }],
    deco: [{ s: 'busch', x: 3.7, y: 0.7, z: 0, k: 0.5, flip: true }, { s: 'baum', x: -0.32, y: 0.68, z: 0, k: 0.8 }]
  },
  {
    id: 'auen-4', chapter: 1, min: 2, par: 3,
    layers: [
      ['S#'],
      ['....', '.a..', '.a..', '.a..', '...Go']
    ],
    groups: [{ id: 'a', kind: 'slide', step: [1, 0, 0], n: 2 }],
    controls: [{ h: [0, 4, 1], g: 'a' }],
    deco: [{ s: 'busch', x: 0.7, y: -0.3, z: 0, k: 0.5, flip: true }, { s: 'baum', x: -0.32, y: -0.32, z: 0, k: 0.8 }]
  },
  {
    id: 'auen-5', chapter: 1, min: 2, par: 3,
    layers: [
      ['S#a..', '.....'],
      ['...o.', '.....'],
      ['...#G']
    ],
    groups: [{ id: 'a', kind: 'slide', step: [0, 0, 1], n: 2 }],
    controls: [{ h: [2, 2, 0], g: 'a' }],
    deco: [{ s: 'busch', x: 2.7, y: -0.3, z: 2, k: 0.5 }, { s: 'busch', x: 0.7, y: -0.3, z: 0, k: 0.5, flip: true }, { s: 'baum', x: -0.32, y: -0.32, z: 0, k: 0.8 }]
  },
  {
    id: 'auen-6', chapter: 1, min: 1, par: 4,
    layers: [
      ['..o......', '......b..', 'Saaa#.b.G', '......b..', '..o......']
    ],
    groups: [{ id: 'a', kind: 'turn', pivot: [2, 2] }, { id: 'b', kind: 'turn', pivot: [6, 2] }],
    controls: [{ h: [0, 4, 0], g: 'a' }, { h: [8, 4, 0], g: 'b' }],
    deco: [{ s: 'busch', x: 3.7, y: 1.7, z: 0, k: 0.5, flip: true }, { s: 'baum', x: -0.32, y: 1.68, z: 0, k: 0.8, flip: true }]
  },
  {
    id: 'auen-7', chapter: 1, min: 3, par: 4,
    layers: [
      ['', '', '', '', '', '', '.......^', '.......S'],
      ['', '', '', '...b', '...#.a', '...#.A.#', '.....a', ''],
      ['', '', 'GcC#', '', '', '', '', '']
    ],
    groups: [{ id: 'a', kind: 'turn', pivot: [5, 5] }, { id: 'b', kind: 'slide', step: [0, 0, 1], n: 1 }, { id: 'c', kind: 'fold' }],
    controls: [{ h: [5, 2.1, 1], g: 'a' }, { h: [1.1, 3, 1], g: 'b' }, { h: [1.5, 0.1, 2], g: 'c' }],
    deco: [{ s: 'fels', x: 2.7, y: 1.7, z: 2, k: 0.5, flip: true }, { s: 'busch', x: 2.7, y: 3.7, z: 1, k: 0.5 }, { s: 'fels', x: 6.7, y: 4.7, z: 1, k: 0.5 }, { s: 'zypresse', x: -0.32, y: 1.68, z: 2, k: 0.8 }]
  },
  {
    id: 'wasser-1', chapter: 2, intro: 'gate', min: 1, par: 2,
    layers: [
      ['S#a#G', '...o.']
    ],
    groups: [{ id: 'a', kind: 'gate' }],
    controls: [{ h: [2, 2, 0], g: 'a' }],
    deco: [{ s: 'schilf', x: 0.7, y: -0.3, z: 0, k: 0.5, flip: true }, { s: 'baum', x: -0.32, y: -0.32, z: 0, k: 0.8, flip: true }]
  },
  {
    id: 'wasser-2', chapter: 2, min: 1, par: 2,
    layers: [
      ['S#a#bG', '....o.']
    ],
    groups: [{ id: 'a', kind: 'gate', start: 1 }, { id: 'b', kind: 'gate' }],
    controls: [{ h: [3, 2, 0], g: 'ab' }],
    deco: [{ s: 'schilf', x: 0.7, y: -0.3, z: 0, k: 0.5 }, { s: 'baum', x: -0.32, y: -0.32, z: 0, k: 0.8 }]
  },
  {
    id: 'wasser-3', chapter: 2, min: 4, par: 5,
    layers: [
      ['..#b.', '.....', 'Sa..G']
    ],
    groups: [{ id: 'a', kind: 'slide', step: [0, -1, 0], n: 2 }, { id: 'b', kind: 'slide', step: [0, 1, 0], n: 2 }],
    controls: [{ h: [1, 4, 0], g: 'a' }, { h: [3, -1, 0], g: 'b' }],
    deco: [{ s: 'schilf', x: 1.7, y: -0.3, z: 0, k: 0.5 }, { s: 'baum', x: -0.32, y: 1.68, z: 0, k: 0.8, flip: true }]
  },
  {
    id: 'wasser-4', chapter: 2, min: 2, par: 3,
    layers: [
      ['S>', '', '', '', ''],
      ['..#', '..A', '..a.b', '..#.b.G', '....b']
    ],
    groups: [{ id: 'a', kind: 'fold' }, { id: 'b', kind: 'turn', pivot: [4, 3] }],
    controls: [{ h: [3.9, 1.5, 1], g: 'a' }, { h: [4, 5.9, 1], g: 'b' }],
    deco: [{ s: 'busch', x: 1.7, y: -0.3, z: 1, k: 0.5, flip: true }, { s: 'baum', x: -0.32, y: -0.32, z: 0, k: 0.8, flip: true }]
  },
  {
    id: 'wasser-5', chapter: 2, min: 3, par: 4,
    layers: [
      ['', '', '.cc', '', 'G..##', '', '...bBb', '', '....#aS']
    ],
    groups: [{ id: 'a', kind: 'gate' }, { id: 'b', kind: 'turn', pivot: [4, 6] }, { id: 'c', kind: 'slide', step: [0, 1, 0], n: 2 }],
    controls: [{ h: [5, 6.1, 0], g: 'ab' }, { h: [1.5, 0.6, 0], g: 'c' }],
    deco: [{ s: 'busch', x: 2.7, y: 3.7, z: 0, k: 0.5, flip: true }, { s: 'busch', x: 3.7, y: 3.7, z: 0, k: 0.5, flip: true }, { s: 'zypresse', x: -0.32, y: 3.68, z: 0, k: 0.8, flip: true }]
  },
  {
    id: 'wasser-6', chapter: 2, min: 3, par: 4,
    layers: [
      ['', '', 'S', '', '', '', '', ''],
      ['', '', '', '..a', '..a.#', '..a.B', '....b', '....###cG']
    ],
    groups: [{ id: 'a', kind: 'turn', pivot: [2, 4] }, { id: 'b', kind: 'fold' }, { id: 'c', kind: 'gate' }],
    controls: [{ h: [3, 0.8, 1], g: 'a' }, { h: [5.9, 5.5, 1], g: 'b' }, { h: [7, 8.9, 1], g: 'c' }],
    deco: [{ s: 'schilf', x: 3.7, y: 3.7, z: 1, k: 0.5 }, { s: 'schilf', x: 3.7, y: 6.7, z: 1, k: 0.5 }, { s: 'baum', x: -0.32, y: 1.68, z: 0, k: 0.8, flip: true }]
  },
  {
    id: 'wasser-7', chapter: 2, min: 4, par: 5,
    layers: [
      ['', '', '', '', '', '....aS'],
      ['...##', '', '..bbb', '', '...#', '...#'],
      ['', '....c', '....C', '....c', '......G', '']
    ],
    groups: [{ id: 'a', kind: 'slide', step: [0, 0, 1], n: 1 }, { id: 'b', kind: 'turn', pivot: [3, 2] }, { id: 'c', kind: 'slide', step: [1, 0, 0], n: 2 }],
    controls: [{ h: [4, 3.1, 0], g: 'a' }, { h: [0.1, 2, 1], g: 'b' }, { h: [2.8, 3, 2], g: 'c' }],
    deco: [{ s: 'schilf', x: 2.7, y: -0.3, z: 1, k: 0.5, flip: true }, { s: 'fels', x: 3.7, y: -0.3, z: 1, k: 0.5, flip: true }]
  },
  {
    id: 'nacht-1', chapter: 3, min: 3, par: 4,
    layers: [
      ['', '', '', '..b', '..#', '..#.a', '..#.a.S', '....a'],
      ['', '', 'Gc#', '', '', '', '', '']
    ],
    groups: [{ id: 'a', kind: 'turn', pivot: [4, 6] }, { id: 'b', kind: 'slide', step: [0, 0, 1], n: 1 }, { id: 'c', kind: 'gate' }],
    controls: [{ h: [4, 3.1, 0], g: 'a' }, { h: [0.1, 3, 0], g: 'b' }, { h: [1, 0.1, 1], g: 'c' }],
    deco: [{ s: 'fels', x: 1.7, y: 5.7, z: 0, k: 0.5, flip: true }, { s: 'fels', x: 1.7, y: 1.7, z: 1, k: 0.5, flip: true }, { s: 'fels', x: 1.7, y: 3.7, z: 0, k: 0.5, flip: true }, { s: 'zypresse', x: -0.32, y: 1.68, z: 1, k: 0.8 }]
  },
  {
    id: 'nacht-2', chapter: 3, min: 3, par: 4,
    layers: [
      ['S', 'a', 'a.#', 'a.B', '..b.c', '..#.c.G', '....c']
    ],
    groups: [{ id: 'a', kind: 'turn', pivot: [0, 2] }, { id: 'b', kind: 'fold' }, { id: 'c', kind: 'turn', pivot: [4, 5] }],
    controls: [{ h: [2, 4, 0], g: 'a' }, { h: [3.9, 3.5, 0], g: 'b' }, { h: [4, 7.9, 0], g: 'c' }],
    deco: [{ s: 'fels', x: 1.7, y: 4.7, z: 0, k: 0.5 }, { s: 'baum', x: -0.32, y: -0.32, z: 0, k: 0.8, flip: true }]
  },
  {
    id: 'nacht-3', chapter: 3, min: 4, par: 5,
    layers: [
      ['', '', 'S', '', '', '', '', '', '', ''],
      ['', '', '', '..a', '..a.#', '..a.b', '....b.#', '....b...C', '........c', '......G']
    ],
    groups: [{ id: 'a', kind: 'turn', pivot: [2, 4] }, { id: 'b', kind: 'turn', pivot: [4, 6] }, { id: 'c', kind: 'slide', step: [-1, 0, 0], n: 2 }],
    controls: [{ h: [3, 0.8, 1], g: 'a' }, { h: [6, 8, 1], g: 'b' }, { h: [9.4, 7.5, 1], g: 'c' }],
    deco: [{ s: 'busch', x: 5.7, y: 5.7, z: 1, k: 0.5 }, { s: 'baum', x: -0.32, y: 1.68, z: 0, k: 0.8, flip: true }]
  },
  {
    id: 'nacht-4', chapter: 3, min: 4, par: 5,
    layers: [
      ['', '', '', '', '', '', '.......aS'],
      ['', '', '', '', '', '', '......o'],
      ['..G', '..d', '..#cc##', '', '.....bbb', '', '......#']
    ],
    groups: [{ id: 'a', kind: 'slide', step: [0, 0, 1], n: 2 }, { id: 'b', kind: 'turn', pivot: [6, 4] }, { id: 'c', kind: 'fold' }, { id: 'd', kind: 'gate' }],
    controls: [{ h: [7, 4.1, 0], g: 'a' }, { h: [3.1, 4, 2], g: 'bc' }, { h: [0.1, 1, 2], g: 'd' }],
    deco: [{ s: 'busch', x: 5.7, y: 1.7, z: 2, k: 0.5, flip: true }, { s: 'fels', x: 5.7, y: 5.7, z: 2, k: 0.5, flip: true }, { s: 'zypresse', x: 1.68, y: -0.32, z: 2, k: 0.8 }]
  },
  {
    id: 'nacht-5', chapter: 3, min: 4, par: 5,
    layers: [
      ['Saaa', '', '..#', '..#', '', '', '', '', '', ''],
      ['', '', '', '...bbb', '', '......##', '', '', '', ''],
      ['', '', '', '', '', '', '', '........ccc', '', '.........G']
    ],
    groups: [{ id: 'a', kind: 'turn', pivot: [2, 0] }, { id: 'b', kind: 'slide', step: [0, 1, 0], n: 2 }, { id: 'c', kind: 'turn', pivot: [9, 7] }],
    controls: [{ h: [4, 2, 0], g: 'a' }, { h: [5, 1.8, 1], g: 'b' }, { h: [5.8, 8, 2], g: 'c' }],
    deco: [{ s: 'busch', x: 5.7, y: 4.7, z: 1, k: 0.5 }, { s: 'busch', x: 6.7, y: 4.7, z: 1, k: 0.5 }, { s: 'fels', x: 1.7, y: 1.7, z: 0, k: 0.5, flip: true }, { s: 'fels', x: 1.7, y: 2.7, z: 0, k: 0.5, flip: true }, { s: 'baum', x: -0.32, y: -0.32, z: 0, k: 0.8 }]
  },
  {
    id: 'nacht-6', chapter: 3, min: 5, par: 6,
    layers: [
      ['', '', '.aS', '', '', '', '', '', '', '', ''],
      ['', '', '#', '#', '#', '', '', '', '', '', ''],
      ['', '', '', '', '', '..b...c', '..b.#.C.#', '..b...c.#', '..........d', '..........d', '........G']
    ],
    groups: [{ id: 'a', kind: 'slide', step: [0, 0, 1], n: 1 }, { id: 'b', kind: 'turn', pivot: [2, 6] }, { id: 'c', kind: 'turn', pivot: [6, 6] }, { id: 'd', kind: 'slide', step: [-1, 0, 0], n: 2 }],
    controls: [{ h: [1, 0.1, 0], g: 'a' }, { h: [3, 2.8, 2], g: 'b' }, { h: [6, 8.9, 2], g: 'c' }, { h: [11.4, 8.5, 2], g: 'd' }],
    deco: [{ s: 'fels', x: 7.7, y: 5.7, z: 2, k: 0.5 }, { s: 'fels', x: 7.7, y: 6.7, z: 2, k: 0.5 }, { s: 'busch', x: 3.7, y: 5.7, z: 2, k: 0.5 }, { s: 'fels', x: -0.3, y: 3.7, z: 1, k: 0.5 }]
  },
  {
    id: 'nacht-7', chapter: 3, min: 5, par: 7,
    layers: [
      ['.S', '', 'aaa', '', '.#', '', '', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '...b', '...b.o#c', '...b', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '........o', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '........#', '........#', '........#', '........d', '........d', '........#', '........#', '', ''],
      ['', '', '', '', '', '', '', '', '', '', '', '', '.........eee', '', '............G']
    ],
    groups: [{ id: 'a', kind: 'turn', pivot: [1, 2] }, { id: 'b', kind: 'turn', pivot: [3, 6] }, { id: 'c', kind: 'slide', step: [0, 0, 1], n: 2 }, { id: 'd', kind: 'fold' }, { id: 'e', kind: 'slide', step: [0, 1, 0], n: 2 }],
    controls: [{ h: [3.9, 2, 0], g: 'a' }, { h: [4, 2.8, 1], g: 'b' }, { h: [7, 7.9, 1], g: 'c' }, { h: [9.9, 9.5, 3], g: 'd' }, { h: [11, 10.8, 4], g: 'e' }],
    deco: [{ s: 'fels', x: 7.7, y: 7.7, z: 3, k: 0.5, flip: true }, { s: 'fels', x: 7.7, y: 11.7, z: 3, k: 0.5, flip: true }, { s: 'busch', x: 0.7, y: 3.7, z: 0, k: 0.5, flip: true }, { s: 'busch', x: 7.7, y: 5.7, z: 3, k: 0.5 }, { s: 'baum', x: 0.68, y: -0.32, z: 0, k: 0.8, flip: true }]
  },
  {
    id: 'hof-1', chapter: 4, min: 4, par: 5,
    layers: [
      ['', '', '', '', '', '...b', '...#.a', '...#.a.#', '.....a.S'],
      ['', '', '.cc', '', 'G..#', '', '', '', '']
    ],
    groups: [{ id: 'a', kind: 'turn', pivot: [5, 7] }, { id: 'b', kind: 'slide', step: [0, 0, 1], n: 1 }, { id: 'c', kind: 'slide', step: [0, 1, 0], n: 2 }],
    controls: [{ h: [5, 4.1, 0], g: 'a' }, { h: [1.1, 5, 0], g: 'b' }, { h: [1.5, 0.6, 1], g: 'c' }],
    deco: [{ s: 'zaun', x: 6.7, y: 6.7, z: 0, k: 0.7, flip: true }, { s: 'zaun', x: 2.7, y: 3.7, z: 1, k: 0.7, flip: true }, { s: 'zypresse', x: -0.32, y: 3.68, z: 1, k: 0.8, flip: true }]
  },
  {
    id: 'hof-2', chapter: 4, min: 3, par: 4,
    layers: [
      ['', '', '', '', '', '...S', '', '', ''],
      ['', '', '', '', '', '.......b', '.....a.#', '.....a.#', '.....a'],
      ['...G', '', '..ddd', '', '...oc###', '', '', '', '']
    ],
    groups: [{ id: 'a', kind: 'turn', pivot: [5, 7] }, { id: 'b', kind: 'slide', step: [0, 0, 1], n: 1 }, { id: 'c', kind: 'gate' }, { id: 'd', kind: 'turn', pivot: [3, 2] }],
    controls: [{ h: [6, 3.8, 1], g: 'ac' }, { h: [5.1, 5, 1], g: 'b' }, { h: [0.1, 2, 2], g: 'd' }],
    deco: [{ s: 'busch', x: 5.7, y: 3.7, z: 2, k: 0.5 }, { s: 'fels', x: 6.7, y: 3.7, z: 2, k: 0.5, flip: true }, { s: 'fels', x: 6.7, y: 5.7, z: 1, k: 0.5 }, { s: 'baum', x: 2.68, y: 4.68, z: 0, k: 0.8 }, { s: 'zypresse', x: 2.68, y: -0.32, z: 2, k: 0.8, flip: true }]
  },
  {
    id: 'hof-3', chapter: 4, min: 5, par: 6,
    layers: [
      ['S', '..a', '..a', '##bbB', '', '...#', '', '', '', '', ''],
      ['', '', '', '', '', '', '.....c', '.....c.#', '.....c.d', '.......d', '.......G']
    ],
    groups: [{ id: 'a', kind: 'slide', step: [-1, 0, 0], n: 2 }, { id: 'b', kind: 'turn', pivot: [3, 3] }, { id: 'c', kind: 'turn', pivot: [5, 7] }, { id: 'd', kind: 'fold' }],
    controls: [{ h: [3.4, 1.5, 0], g: 'a' }, { h: [5, 5, 0], g: 'b' }, { h: [6, 3.8, 1], g: 'c' }, { h: [8.9, 8.5, 1], g: 'd' }],
    deco: [{ s: 'busch', x: 2.7, y: 4.7, z: 0, k: 0.5 }, { s: 'busch', x: 6.7, y: 6.7, z: 1, k: 0.5 }, { s: 'baum', x: -0.32, y: -0.32, z: 0, k: 0.8, flip: true }]
  },
  {
    id: 'hof-4', chapter: 4, min: 5, par: 6,
    layers: [
      ['', '', '...aS', '', '', '', '', '', '', '', ''],
      ['', '', '..o', '', '', '', '', '', '', '', ''],
      ['', '', '..#', '', '', '', '', '', '', '', ''],
      ['', '', '', '..b', '..b', '..b', '....#', '', '...cCc', '', '....##dG']
    ],
    groups: [{ id: 'a', kind: 'slide', step: [0, 0, 1], n: 2 }, { id: 'b', kind: 'slide', step: [1, 0, 0], n: 2 }, { id: 'c', kind: 'turn', pivot: [4, 8] }, { id: 'd', kind: 'gate' }],
    controls: [{ h: [3, 0.1, 0], g: 'a' }, { h: [0.8, 5, 3], g: 'b' }, { h: [6.9, 8, 3], g: 'c' }, { h: [6, 11.9, 3], g: 'd' }],
    deco: [{ s: 'busch', x: 3.7, y: 9.7, z: 3, k: 0.5, flip: true }, { s: 'zaun', x: 4.7, y: 9.7, z: 3, k: 0.7 }, { s: 'busch', x: 1.7, y: 1.7, z: 2, k: 0.5 }, { s: 'fels', x: 3.7, y: 5.7, z: 3, k: 0.5 }]
  },
  {
    id: 'hof-5', chapter: 4, min: 4, par: 5,
    layers: [
      ['', '', 'S', '', '', '', '', '', '', '', '', ''],
      ['', '', '', '..a', '..a.#', '..a.#', '....#', '', '', '', '', ''],
      ['', '', '', '', '', '', '.....bbb', '', '........#', '........c', '........c.G', '........C']
    ],
    groups: [{ id: 'a', kind: 'turn', pivot: [2, 4] }, { id: 'b', kind: 'slide', step: [0, 1, 0], n: 2 }, { id: 'c', kind: 'turn', pivot: [8, 10] }],
    controls: [{ h: [3, 0.8, 1], g: 'a' }, { h: [7, 4.8, 2], g: 'b' }, { h: [10, 12, 2], g: 'c' }],
    deco: [{ s: 'busch', x: 3.7, y: 5.7, z: 1, k: 0.5 }, { s: 'fels', x: 7.7, y: 7.7, z: 2, k: 0.5, flip: true }, { s: 'busch', x: 3.7, y: 4.7, z: 1, k: 0.5, flip: true }, { s: 'baum', x: -0.32, y: 1.68, z: 0, k: 0.8, flip: true }]
  },
  {
    id: 'hof-6', chapter: 4, min: 6, par: 7,
    layers: [
      ['.S', '', 'aaa', '', '.###b', '', '', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '.....#', '.....#', '.....#', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '.......c', '.......c.o', '.......c...d', '...........d', '.........#e#', '...........f', '...........f', '...........G']
    ],
    groups: [{ id: 'a', kind: 'turn', pivot: [1, 2] }, { id: 'b', kind: 'slide', step: [0, 0, 1], n: 1 }, { id: 'c', kind: 'turn', pivot: [7, 8] }, { id: 'd', kind: 'slide', step: [-1, 0, 0], n: 2 }, { id: 'e', kind: 'gate' }, { id: 'f', kind: 'fold' }],
    controls: [{ h: [3.9, 2, 0], g: 'a' }, { h: [4, 5.9, 0], g: 'b' }, { h: [8, 4.8, 2], g: 'c' }, { h: [12.4, 9.5, 2], g: 'd' }, { h: [10, 12.9, 2], g: 'e' }, { h: [12.9, 12.5, 2], g: 'f' }],
    deco: [{ s: 'busch', x: 4.7, y: 5.7, z: 1, k: 0.5 }, { s: 'busch', x: 10.7, y: 10.7, z: 2, k: 0.5, flip: true }, { s: 'busch', x: 4.7, y: 3.7, z: 1, k: 0.5, flip: true }, { s: 'baum', x: 0.68, y: -0.32, z: 0, k: 0.8, flip: true }]
  },
  {
    id: 'hof-7', chapter: 4, min: 6, par: 8,
    layers: [
      ['', 'S>', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['....a', '..#.a.#', '....a', '', '', '', '', '', '', '', '', '', '', ''],
      ['', '', '', '.......bbb', '', '........occc', '', '..........#', '..........#', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', '...........ddd', '', '..............#', '..............#', '..............e', ''],
      ['', '', '', '', '', '', '', '', '', '', '', '', '', '..............o'],
      ['', '', '', '', '', '', '', '', '', '', '', '', '', '..............##FfG']
    ],
    groups: [{ id: 'a', kind: 'turn', pivot: [4, 1] }, { id: 'b', kind: 'turn', pivot: [8, 3] }, { id: 'c', kind: 'turn', pivot: [10, 5] }, { id: 'd', kind: 'slide', step: [0, 1, 0], n: 2 }, { id: 'e', kind: 'slide', step: [0, 0, 1], n: 2 }, { id: 'f', kind: 'fold' }],
    controls: [{ h: [4, 3.9, 1], g: 'a' }, { h: [4.8, 4, 2], g: 'b' }, { h: [12, 7, 2], g: 'c' }, { h: [13, 6.8, 3], g: 'd' }, { h: [15.9, 12, 3], g: 'e' }, { h: [16.5, 14.9, 5], g: 'f' }],
    deco: [{ s: 'busch', x: 13.7, y: 10.7, z: 3, k: 0.5, flip: true }, { s: 'zaun', x: 14.7, y: 12.7, z: 5, k: 0.7 }, { s: 'busch', x: 9.7, y: 6.7, z: 2, k: 0.5, flip: true }, { s: 'zaun', x: 9.7, y: 7.7, z: 2, k: 0.7, flip: true }, { s: 'fels', x: 5.7, y: 0.7, z: 1, k: 0.5 }, { s: 'baum', x: -0.32, y: 0.68, z: 0, k: 0.8 }]
  }
]
