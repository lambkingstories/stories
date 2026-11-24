/**
 * The pure parts of the three new games of "Johannes der Täufer" (id `johannes`, Luke 1 and 3, John 1 and 3); the components only draw and listen:
 * 1. "Show them" (`gebaerde`, field `gestures`, Luke 1,21-22): Zacharias comes out of the temple and cannot speak. The child speaks for him with his hands: it is told what Zacharias wants to say
 *    and chooses, among three postures of Zacharias, the one that the people understand. Which signs Zacharias made is not in the Bible; the four postures and their meaning are a rule of the game.
 * 2. "Whoever has two gives one away" (`abgeben`, field `giveAway`, Luke 3,11): people stand in a row at the Jordan, each has something (coats, bread) or nothing. Whoever has more than one passes
 *    one to the NEIGHBOUR, until everybody has exactly one. "Only to the neighbour" and "exactly enough" are rules of the game, not words of the Bible.
 * 3. "Where does John point?" (`zeigen`, field `pointing`, John 1,29.35-37): John points with his stretched arm; the child extends the line in its mind and taps the man he points at (Jesus).
 *    That John points with his arm is a picture of the plan, not a word of the verses; the other men are scenery.
 * All places are percent of the picture (width and height, 3:2 unless `ratio` says otherwise); a width is percent of the width of the picture. The arithmetic has no clock and no dice.
 */

export interface Pt {
  x: number
  y: number
}

/** The width of the screen the sizes are checked against (pixels). */
export const JOHANNES_PHONE_W = 360
/** The smallest finger target (pixels). */
export const JOHANNES_TOUCH = 44
/** A percent of the width of the picture in pixels on a phone. */
const pxW = (w: number) => (w / 100) * JOHANNES_PHONE_W
/** A percent of the height of the picture in pixels on a phone (the picture is `ratio` times as wide as high). */
const pxH = (h: number, ratio: number) => (h / 100) * (JOHANNES_PHONE_W / ratio)

/** A box in percent of the picture: `x`, `y` the middle, `w` the width (percent of the width), `h` the height (percent of the height). */
export interface Box {
  x: number
  y: number
  w: number
  h: number
}
const boxInside = (b: Box): boolean => b.x - b.w / 2 >= 0 && b.x + b.w / 2 <= 100 && b.y - b.h / 2 >= 0 && b.y + b.h / 2 <= 100
const boxesMeet = (a: Box, b: Box): boolean => Math.abs(a.x - b.x) < (a.w + b.w) / 2 && Math.abs(a.y - b.y) < (a.h + b.h) / 2
/** The box of a sprite whose lower middle (the feet) is at `x`, `y`: `w` its width, `ratio` its picture ratio (width / height), `pic` the ratio of the whole picture. */
const spriteBox = (s: { x: number; y: number; w: number; ratio: number }, pic: number): Box => {
  const h = (s.w * pic) / s.ratio
  return { x: s.x, y: s.y - h / 2, w: s.w, h }
}

// ================================================================ 1. show them (`gebaerde`)

/** A posture of Zacharias on a card (420 x 620 each): its picture and the name that a screen reader says. */
export interface GesturePose {
  id: string
  image: string
  label: string
}
export interface GestureRound {
  hint: string
  /** The id of the posture the people understand. */
  right: string
  /** The three cards of the round (ids of `poses`), the right one among them; the order is the order on the table. (Not called `options`: that name is the answers of a question, a text to translate.) */
  cards: string[]
}
/**
 * The game "Show them" (`gebaerde`): the forecourt of the temple (3:2, morning, nobody in it). Zacharias stands on the left (`zacharias`: the neutral posture, `x`, `y` the middle of his feet, `w`
 * his width, `ratio` width / height of the picture), the people on the right (`crowd`: one picture puzzled, one understanding; 900 x 420), the three cards of the round lie below the picture.
 */
export interface GestureGame {
  background: string
  ratio?: number
  zacharias: { image: string; x: number; y: number; w: number; ratio: number }
  crowd: { puzzled: string; understood: string; x: number; y: number; w: number; ratio: number }
  poses: GesturePose[]
  rounds: GestureRound[]
}

/** The size of a card on the table (pixels; the component draws it at least this big): at least 88 x 120. */
export const GESTURE_CARD_W = 96
export const GESTURE_CARD_H = 128
export const GESTURE_ROUND_MAX_MS = 45000

export const gesturePose = (game: GestureGame, id: string): GesturePose | undefined => game.poses.find((p) => p.id === id)
/** Is the card `id` the posture the people understand? */
export const gestureCheck = (round: GestureRound, id: string): boolean => round.right === id
/** What "Help me" shows: the right card of the round (nothing when it is not among the cards). */
export const gestureHelp = (round: GestureRound): string | null => (round.cards.includes(round.right) ? round.right : null)

/** The problems of the data of `gebaerde` (an empty list is good). */
export function gestureProblems(game: GestureGame): string[] {
  const out: string[] = []
  const ratio = game.ratio ?? 1.5
  if (!game.background) out.push('no picture of the forecourt')
  const z = game.zacharias
  const c = game.crowd
  if (!z?.image) out.push('no picture of Zacharias')
  if (!c?.puzzled || !c?.understood) out.push('the people need two pictures (puzzled and understanding)')
  for (const [name, s] of [['Zacharias', z], ['the people', c]] as const) {
    if (!s) continue
    if (!(s.ratio > 0.2 && s.ratio < 5)) out.push(`the ratio of the picture of ${name} is not sensible`)
    const b = spriteBox({ x: s.x, y: s.y, w: s.w, ratio: s.ratio }, ratio)
    if (!boxInside(b)) out.push(`${name} lies outside the picture`)
  }
  if (z && c && boxesMeet(spriteBox({ x: z.x, y: z.y, w: z.w, ratio: z.ratio }, ratio), spriteBox({ x: c.x, y: c.y, w: c.w, ratio: c.ratio }, ratio))) out.push('Zacharias and the people lie on top of each other')
  if (z && c && !(z.x < c.x)) out.push('Zacharias stands on the left, the people on the right')
  // ---- the postures
  const ids = game.poses.map((p) => p.id)
  if (new Set(ids).size !== ids.length) out.push('two postures have the same id')
  if (game.poses.length < 4) out.push('four postures are needed (two right ones, two that mean nothing)')
  for (const p of game.poses) if (!p.image || !p.label) out.push(`${p.id}: needs a picture and a name`)
  // ---- the rounds
  if (game.rounds.length !== 2) out.push('there must be two rounds')
  game.rounds.forEach((r, i) => {
    const n = i + 1
    if (!r.hint) out.push(`round ${n} has no hint`)
    if (r.cards.length !== 3) out.push(`round ${n} needs exactly three cards`)
    if (new Set(r.cards).size !== r.cards.length) out.push(`round ${n}: a card lies twice`)
    for (const o of r.cards) if (!ids.includes(o)) out.push(`round ${n}: ${o} is no posture`)
    if (!r.cards.includes(r.right)) out.push(`round ${n}: the right posture is not among the cards`)
    // no second right answer: the right posture of the other round means something else, so it is not a card here
    const other = game.rounds[1 - i]
    if (other && r.cards.includes(other.right)) out.push(`round ${n}: the card ${other.right} is the right one of the other round and would be a second right answer`)
    if (!gestureHelp(r)) out.push(`round ${n}: the help finds nothing`)
    if (3 * 9000 > GESTURE_ROUND_MAX_MS) out.push(`round ${n}: lasts longer than ${GESTURE_ROUND_MAX_MS / 1000} seconds`)
  })
  if (game.rounds.length === 2 && game.rounds[0]!.right === game.rounds[1]!.right) out.push('the two rounds need different right postures')
  if (GESTURE_CARD_W < 88 || GESTURE_CARD_H < 120) out.push('the cards are too small')
  if (3 * GESTURE_CARD_W + 2 * 8 > JOHANNES_PHONE_W - 24) out.push('three cards do not fit next to each other on a phone')
  return out
}

// ================================================================ 2. whoever has two gives one away (`abgeben`)

export type GiveItem = 'rock' | 'brot'
/** A person of the row (260 x 420): the picture and the name that a screen reader says. */
export interface GivePerson {
  image: string
  label: string
}
export interface GiveRound {
  hint: string
  item: GiveItem
  /** How many pieces each person has at the start, from the left; the sum is the number of people. */
  start: number[]
}
/**
 * The game "Whoever has two gives one away" (`abgeben`): the bank of the Jordan in the morning (3:2, nobody in it). The people stand in a row on the lower strip (the first four in round 1, five in
 * round 2), spread evenly; in front of each lies a mat with the pieces. `layout`: the width of a person, the middle of the feet, the width and the middle of the mat, the width and the middle of the
 * pieces on it (percent of the picture).
 */
export interface GiveAwayGame {
  background: string
  ratio?: number
  persons: GivePerson[]
  /** Width / height of the picture of a person (260 x 420). */
  personRatio: number
  mat: string
  /** Width / height of the picture of the mat (260 x 70). */
  matRatio: number
  items: Record<GiveItem, string>
  /** Width / height of the pictures of the pieces (a coat 200 x 160, a loaf 160 x 120). */
  itemRatio: Record<GiveItem, number>
  layout: { personW: number; feetY: number; matW: number; matY: number; pieceW: number; pieceY: number }
  rounds: GiveRound[]
}

/** How long one move takes a child who is not in a hurry (milliseconds), and the longest round. */
export const GIVE_STEP_MS = 9000
export const GIVE_ROUND_MAX_MS = 60000
/** The smallest width of a person on a phone (pixels). */
export const GIVE_PERSON_PX = 56

/** The middle of the slot of person `k` of `n` (percent of the width of the picture). */
export const giveSlotX = (n: number, k: number): number => ((k + 0.5) * 100) / n
/** The slot at a place of the picture (percent of the width), or -1 outside. */
export const giveSlotAt = (n: number, x: number): number => (x < 0 || x > 100 ? -1 : Math.min(n - 1, Math.floor((x / 100) * n)))
/** May person `i` give a piece away? Only who has more than one. */
export const giveCan = (counts: readonly number[], i: number): boolean => i >= 0 && i < counts.length && (counts[i] ?? 0) >= 2
/** The state after person `i` gave one piece to the neighbour on the side `dir` (-1 left, +1 right), or null when that is not allowed. */
export function giveMove(counts: readonly number[], i: number, dir: -1 | 1): number[] | null {
  const j = i + dir
  if (!giveCan(counts, i) || j < 0 || j >= counts.length) return null
  const next = [...counts]
  next[i] = next[i]! - 1
  next[j] = next[j]! + 1
  return next
}
/** Does everybody have exactly one? */
export const giveDone = (counts: readonly number[]): boolean => counts.length > 0 && counts.every((c) => c === 1)
/** A move: person `from` gives to the neighbour `to`. */
export interface GiveStep {
  from: number
  to: number
}
/** The shortest way from a state to "everybody has one" (breadth-first search over all states), or null when there is none. */
export function giveSolve(counts: readonly number[]): GiveStep[] | null {
  const key = (c: readonly number[]) => c.join(',')
  const start = [...counts]
  if (giveDone(start)) return []
  const prev = new Map<string, { from: string; step: GiveStep }>()
  const seen = new Set<string>([key(start)])
  let frontier: number[][] = [start]
  while (frontier.length) {
    const next: number[][] = []
    for (const c of frontier) {
      for (let i = 0; i < c.length; i++) {
        for (const dir of [-1, 1] as const) {
          const n = giveMove(c, i, dir)
          if (!n || seen.has(key(n))) continue
          seen.add(key(n))
          prev.set(key(n), { from: key(c), step: { from: i, to: i + dir } })
          if (giveDone(n)) {
            const path: GiveStep[] = []
            let k = key(n)
            while (prev.has(k)) {
              const p = prev.get(k)!
              path.unshift(p.step)
              k = p.from
            }
            return path
          }
          next.push(n)
        }
      }
    }
    frontier = next
  }
  return null
}
/** What "Help me" shows: the first move of a shortest way from the CURRENT state. */
export const giveHint = (counts: readonly number[]): GiveStep | null => giveSolve(counts)?.[0] ?? null
/** The people who have nothing at the start of a round (each gets a point when they first receive something). */
export const giveNeedy = (start: readonly number[]): number[] => start.flatMap((c, i) => (c === 0 ? [i] : []))
/** How many parts the whole game has (the people who start with nothing, in both rounds). */
export const giveGoal = (game: GiveAwayGame): number => game.rounds.reduce((n, r) => n + giveNeedy(r.start).length, 0)

/** The problems of the data of `abgeben` (an empty list is good). */
export function giveAwayProblems(game: GiveAwayGame): string[] {
  const out: string[] = []
  const ratio = game.ratio ?? 1.5
  if (!game.background) out.push('no picture of the bank')
  if (!game.mat || !game.items?.rock || !game.items?.brot) out.push('the mat, the coat and the loaf need pictures')
  if (!(game.personRatio > 0.2 && game.personRatio < 3)) out.push('the ratio of the picture of a person is not sensible')
  if (!(game.matRatio > 1 && game.matRatio < 10)) out.push('the ratio of the picture of the mat is not sensible')
  const L = game.layout
  if (!L) return [...out, 'no layout']
  const most = Math.max(0, ...game.rounds.map((r) => r.start.length))
  if (game.persons.length < most) out.push(`${most} people are needed`)
  if (new Set(game.persons.map((p) => p.image)).size !== game.persons.length) out.push('two people have the same picture')
  for (const p of game.persons) if (!p.image || !p.label) out.push('a person needs a picture and a name')
  // ---- on a phone: a person wide enough, a slot wide enough for a finger, everything in the picture
  if (pxW(L.personW) < GIVE_PERSON_PX) out.push(`a person is narrower than ${GIVE_PERSON_PX} pixels on a phone`)
  if (pxW(100 / Math.max(1, most)) < JOHANNES_TOUCH) out.push('a slot is narrower than 44 pixels on a phone')
  const personH = (L.personW * ratio) / game.personRatio
  if (L.feetY - personH < 0 || L.feetY > 100) out.push('the people lie outside the picture')
  if (L.matY + ((L.matW * ratio) / game.matRatio) / 2 > 100) out.push('the mats lie outside the picture')
  if (L.matW * most > 100) out.push('the mats do not fit next to each other')
  if (L.personW > 100 / Math.max(1, most)) out.push('the people stand on each other')
  // ---- the rounds
  if (game.rounds.length !== 2) out.push('there must be two rounds')
  const want = [2, 4]
  game.rounds.forEach((r, i) => {
    const n = i + 1
    if (!r.hint) out.push(`round ${n} has no hint`)
    if (r.start.length < 3 || r.start.length > 5) out.push(`round ${n} needs three to five people`)
    if (r.start.reduce((a, b) => a + b, 0) !== r.start.length) out.push(`round ${n}: the number of pieces must be the number of people`)
    if (!r.start.some((c) => c === 0)) out.push(`round ${n}: somebody must have nothing`)
    if (!r.start.some((c) => c > 1)) out.push(`round ${n}: somebody must have more than one`)
    if (r.start.some((c) => c < 0 || c > 4)) out.push(`round ${n}: nobody has fewer than none or more than four`)
    if (giveDone(r.start)) out.push(`round ${n} is solved at the start`)
    const way = giveSolve(r.start)
    if (!way) out.push(`round ${n} cannot be solved`)
    else if (way.length !== want[i]) out.push(`round ${n}: the shortest way has ${way.length} moves, ${want[i]} wanted`)
    if ((way?.length ?? 0) * GIVE_STEP_MS > GIVE_ROUND_MAX_MS) out.push(`round ${n}: lasts longer than ${GIVE_ROUND_MAX_MS / 1000} seconds`)
    // the help solves the round without a mistake and without a dead end
    let cur: number[] = [...r.start]
    for (let k = 0; k < 20 && !giveDone(cur); k++) {
      const h = giveHint(cur)
      const next = h ? giveMove(cur, h.from, h.to > h.from ? 1 : -1) : null
      if (!next) {
        out.push(`round ${n}: the help finds nothing`)
        break
      }
      cur = next
    }
    if (!giveDone(cur)) out.push(`round ${n}: the help does not solve it`)
    if (!game.items[r.item]) out.push(`round ${n} has no pieces`)
  })
  if (JOHANNES_TOUCH > 44) out.push('the finger target is too big')
  return out
}

// ================================================================ 3. where does John point? (`zeigen`)

/** A man in the picture (the middle of his feet at `x`, `y`; `w` his width; `ratio` width / height of his picture); `flip` mirrors him (he goes the other way). */
export interface PointMan {
  id: string
  image: string
  label: string
  x: number
  y: number
  w: number
  ratio: number
  flip?: boolean
}
export interface PointRound {
  hint: string
  /** John: the picture (520 x 700), the middle of his feet, his width, the ratio of his picture. */
  johannes: { image: string; x: number; y: number; w: number; ratio: number }
  /** The tip of his finger (percent of the picture), measured on the painted picture. */
  tip: Pt
  /** The direction of his arm in degrees: 0 = to the right, positive = upwards (measured on the painted picture). */
  angle: number
  /** How many degrees beside the line still count as "on the line" (7). */
  tolerance?: number
  men: PointMan[]
  /** The id of the man he points at (Jesus). */
  right: string
  /** The two disciples (round 2): their picture and where they go (an offset in percent of the picture) when the right man is found. */
  disciples?: { image: string; x: number; y: number; w: number; ratio: number; follow: Pt }
}
export interface PointGame {
  background: string
  ratio?: number
  rounds: PointRound[]
}

export const POINT_TOLERANCE = 7
/** The width of a tap target next to the body of a man (pixels): at least this big. */
export const POINT_HIT_PX = JOHANNES_TOUCH
/** The smallest width of a man on a phone (pixels): the figures must be seen well (about 40). */
export const POINT_MAN_PX = 38
export const POINT_ROUND_MAX_MS = 40000

export const pointTolerance = (round: PointRound): number => round.tolerance ?? POINT_TOLERANCE
/** The height of a man in percent of the height of the picture. */
export const pointManH = (game: PointGame, m: PointMan): number => (m.w * (game.ratio ?? 1.5)) / m.ratio
/** The middle of a man's body (where the line is meant to go through). */
export const pointManCenter = (game: PointGame, m: PointMan): Pt => ({ x: m.x, y: m.y - pointManH(game, m) / 2 })
/** The direction in degrees (0 = right, positive = up) from `from` to `to` (both percent of the picture, the picture is `ratio` times as wide as high). */
export function pointAngle(from: Pt, to: Pt, ratio = 1.5): number {
  return (Math.atan2(from.y - to.y, (to.x - from.x) * ratio) * 180) / Math.PI
}
/** How many degrees the man lies beside the line of the arm. */
export function pointOff(game: PointGame, round: PointRound, m: PointMan): number {
  const d = Math.abs(pointAngle(round.tip, pointManCenter(game, m), game.ratio ?? 1.5) - round.angle)
  return d > 180 ? 360 - d : d
}
/** Does the line of the arm pass through the man (within the tolerance)? */
export const pointOnLine = (game: PointGame, round: PointRound, m: PointMan): boolean => pointOff(game, round, m) <= pointTolerance(round)
/** What a tap on a man means. */
export const pointTap = (round: PointRound, id: string): boolean => round.right === id
/** The length of the golden line of the help in percent of the width of the picture: from the tip to the edge of the picture. */
export function pointLineLength(game: PointGame, round: PointRound): number {
  const ratio = game.ratio ?? 1.5
  const a = (round.angle * Math.PI) / 180
  const cos = Math.cos(a)
  const sin = Math.sin(a)
  const horizontal = cos > 1e-6 ? (100 - round.tip.x) / cos : Infinity
  // a percent of the height is 1 / ratio of a percent of the width
  const room = sin > 0 ? round.tip.y : 100 - round.tip.y
  const vertical = Math.abs(sin) > 1e-6 ? room / ratio / Math.abs(sin) : Infinity
  return Math.min(horizontal, vertical)
}
/** The finger target of a man on a phone in pixels (at least `POINT_HIT_PX`). */
export function pointHitPx(game: PointGame, m: PointMan): { w: number; h: number } {
  return { w: Math.max(POINT_HIT_PX, pxW(m.w)), h: Math.max(POINT_HIT_PX, pxH(pointManH(game, m), game.ratio ?? 1.5)) }
}
/** The box of the finger target of a man (percent of the picture), at least 44 pixels each way on a phone. */
export function pointHitBox(game: PointGame, m: PointMan): Box {
  const ratio = game.ratio ?? 1.5
  const px = pointHitPx(game, m)
  const c = pointManCenter(game, m)
  return { x: c.x, y: c.y, w: (px.w / JOHANNES_PHONE_W) * 100, h: (px.h / (JOHANNES_PHONE_W / ratio)) * 100 }
}

/** The problems of the data of `zeigen` (an empty list is good). */
export function pointProblems(game: PointGame): string[] {
  const out: string[] = []
  const ratio = game.ratio ?? 1.5
  if (!game.background) out.push('no picture of the river')
  if (game.rounds.length !== 2) out.push('there must be two rounds')
  game.rounds.forEach((r, i) => {
    const n = i + 1
    const tol = pointTolerance(r)
    if (!r.hint) out.push(`round ${n} has no hint`)
    if (!r.johannes?.image) out.push(`round ${n}: no picture of John`)
    if (r.johannes) {
      const jb = spriteBox(r.johannes, ratio)
      if (!boxInside(jb)) out.push(`round ${n}: John lies outside the picture`)
      if (pxW(r.johannes.w) < 40) out.push(`round ${n}: John is narrower than 40 pixels on a phone`)
      if (!(r.tip.x >= 0 && r.tip.x <= 100 && r.tip.y >= 0 && r.tip.y <= 100)) out.push(`round ${n}: the finger tip lies outside the picture`)
      for (const m of r.men) if (boxesMeet(jb, spriteBox(m, ratio))) out.push(`round ${n}: ${m.id} stands on John`)
      if (r.disciples && boxesMeet(jb, spriteBox(r.disciples, ratio)) && Math.abs(r.disciples.x - r.johannes.x) < r.johannes.w * 0.3) out.push(`round ${n}: the disciples stand on John`)
    }
    if (!(r.angle > -60 && r.angle < 60)) out.push(`round ${n}: the arm points in a strange direction`)
    if (!(tol >= 3 && tol <= 12)) out.push(`round ${n}: the tolerance is not sensible`)
    const want = i === 0 ? 3 : 4
    if (r.men.length !== want) out.push(`round ${n} needs ${want} men`)
    const ids = r.men.map((m) => m.id)
    if (new Set(ids).size !== ids.length) out.push(`round ${n}: two men have the same id`)
    if (!ids.includes(r.right)) out.push(`round ${n}: the man he points at is not there`)
    for (const m of r.men) {
      if (!m.image || !m.label) out.push(`round ${n}: ${m.id} needs a picture and a name`)
      if (!(m.ratio > 0.15 && m.ratio < 3)) out.push(`round ${n}: ${m.id} has no sensible ratio`)
      if (!boxInside(spriteBox(m, ratio))) out.push(`round ${n}: ${m.id} lies outside the picture`)
      if (pxW(m.w) < POINT_MAN_PX) out.push(`round ${n}: ${m.id} is narrower than ${POINT_MAN_PX} pixels on a phone`)
      if (/lamm|tier|schaf|taube|esel|lamb|animal|sheep|dove|donkey/i.test(m.label)) out.push(`round ${n}: ${m.id} carries an animal`)
    }
    // exactly one man on the line (the right one), the others at least three tolerances beside it
    for (const m of r.men) {
      const off = pointOff(game, r, m)
      if (m.id === r.right && off > tol) out.push(`round ${n}: the right man is ${off.toFixed(1)} degrees beside the line (more than ${tol})`)
      if (m.id !== r.right && off < 3 * tol) out.push(`round ${n}: ${m.id} is only ${off.toFixed(1)} degrees beside the line (at least ${3 * tol} wanted)`)
    }
    // the finger targets do not touch each other
    const boxes = r.men.map((m) => [m.id, pointHitBox(game, m)] as const)
    for (let a = 0; a < boxes.length; a++)
      for (let b = a + 1; b < boxes.length; b++) if (boxesMeet(boxes[a]![1], boxes[b]![1])) out.push(`round ${n}: the finger targets of ${boxes[a]![0]} and ${boxes[b]![0]} touch`)
    for (const [id, b] of boxes) if (!boxInside(b)) out.push(`round ${n}: the finger target of ${id} reaches over the edge`)
    // the help line meets the right man
    const right = r.men.find((m) => m.id === r.right)
    if (right) {
      const c = pointManCenter(game, right)
      const len = pointLineLength(game, r)
      // how far to the right the line goes (percent of the width): it must reach the man, who must stand in front of John's hand
      const reach = len * Math.cos((r.angle * Math.PI) / 180)
      if (c.x <= r.tip.x) out.push(`round ${n}: the right man stands behind John`)
      else if (!(len > 0) || c.x - r.tip.x > reach + 1e-6) out.push(`round ${n}: the help line does not reach the right man`)
    }
    if (i === 1 && !r.disciples) out.push('round 2 needs the two disciples')
    if (i === 0 && r.disciples) out.push('round 1 has no disciples')
    if (r.disciples) {
      const f = r.disciples.follow
      const x = r.disciples.x + f.x
      const y = r.disciples.y + f.y
      if (x < 0 || x > 100 || y < 0 || y > 100) out.push(`round ${n}: the disciples leave the picture`)
    }
    if (3 * 8000 > POINT_ROUND_MAX_MS) out.push(`round ${n}: lasts longer than ${POINT_ROUND_MAX_MS / 1000} seconds`)
  })
  return out
}
