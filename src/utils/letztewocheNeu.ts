/**
 * The pure parts of the new game of "Die letzte Woche" (the component only shows and listens):
 * "Two halves" (`gebote`, Matthew 22,37-39): the greatest commandment is to love God, the second is like it, to love your neighbour.
 * Every painted picture (3:2) shows one deed of love in everyday life (praying, praising, giving thanks; sharing, helping, visiting). The app cuts it into a left and
 * a right half (code only cuts, it draws nothing); the halves lie turned in the tray. The child turns a half until it stands upright, lays it on its place of the
 * workbench (the left half on the left, the right half on the right) and, when the two halves make one picture, chooses the half of the heart it belongs to:
 * "Love God" (a half heart with the light of the sky) or "Love your neighbour" (a half heart with the neighbours). At the end the two halves of the heart become one.
 * The arithmetic has no clock and no dice.
 */

/** Which of the two commandments a picture shows. */
export type CommandKind = 'god' | 'neighbor'
/** The side of a half: `L` the left half of the picture, `R` the right half. */
export type CommandSide = 'L' | 'R'
/** Where a half lies: in the tray, on the left or the right place of the workbench, or sorted into the heart (`done`). */
export type CommandSpot = 'tray' | CommandSide | 'done'

/** One painted picture (3:2, cut into two halves of 3:4 by the app) with its words and the commandment it shows. */
export interface CommandCard {
  id: string
  image: string
  label: string
  kind: CommandKind
}
/** A half in the tray: of which picture, which side, and how far it is turned at the start (degrees clockwise: 90, 180 or 270). */
export interface CommandPiece {
  card: string
  side: CommandSide
  turn: number
}
/** One round: the hint and the halves in the order of the tray (both halves of every picture of the round). */
export interface CommandRound {
  hint: string
  pieces: CommandPiece[]
}
/** The heart (one painted picture 3:2): its left half belongs to "love God", its right half to "love your neighbour". */
export interface CommandHeart {
  image: string
  label: string
}
/** The game "Two halves" (`gebote`). */
export interface CommandGame {
  cards: CommandCard[]
  heart: CommandHeart
  rounds: CommandRound[]
}

/** Width to height of a whole painted picture (a half is 3:4). */
export const COMMAND_RATIO = 1.5
/** The side of the heart that belongs to a commandment. */
export const COMMAND_HEART_SIDE: Record<CommandKind, CommandSide> = { god: 'L', neighbor: 'R' }

/** A turn by a quarter: `step` 1 clockwise, -1 the other way; always 0, 90, 180 or 270. */
export function commandTurnBy(turn: number, step: 1 | -1): number {
  return (((turn + 90 * step) % 360) + 360) % 360
}
/** How many quarter turns a half needs at least to stand upright (0, 1 or 2). */
export function commandTurnsLeft(turn: number): number {
  const t = (((turn % 360) + 360) % 360) / 90
  return Math.min(t, 4 - t)
}

/** The pictures of a round in the order in which their first half lies in the tray. */
export function commandCardsOf(round: CommandRound): string[] {
  const out: string[] = []
  for (const p of round.pieces) if (!out.includes(p.card)) out.push(p.card)
  return out
}

/** The piece that lies on a place of the workbench (-1: the place is free). */
export function commandAt(spots: readonly CommandSpot[], side: CommandSide): number {
  return spots.indexOf(side)
}

/**
 * Can half `i` be laid on place `side`? `turn`: it is not upright yet; `side`: it is the other half of the picture; `busy`: a half lies there already;
 * `gone`: it is not in the tray. None of these is a mistake: the half simply stays where it was.
 */
export function commandPlaceVerdict(round: CommandRound, turns: readonly number[], spots: readonly CommandSpot[], i: number, side: CommandSide): 'ok' | 'turn' | 'side' | 'busy' | 'gone' {
  const p = round.pieces[i]
  if (!p || spots[i] !== 'tray') return 'gone'
  if (((turns[i] ?? 0) % 360) !== 0) return 'turn'
  if (p.side !== side) return 'side'
  if (commandAt(spots, side) >= 0) return 'busy'
  return 'ok'
}

/** Both places are full: do the two halves make one picture? `null` while a place is free. */
export function commandJoined(round: CommandRound, spots: readonly CommandSpot[]): { card: string } | 'mismatch' | null {
  const l = commandAt(spots, 'L')
  const r = commandAt(spots, 'R')
  if (l < 0 || r < 0) return null
  const a = round.pieces[l]!.card
  return a === round.pieces[r]!.card ? { card: a } : 'mismatch'
}

/** The kind of a picture (undefined for an unknown id). */
export function commandKindOf(game: CommandGame, card: string): CommandKind | undefined {
  return game.cards.find((c) => c.id === card)?.kind
}

/** All halves of the round are sorted into the heart. */
export const commandRoundDone = (spots: readonly CommandSpot[]): boolean => spots.length > 0 && spots.every((s) => s === 'done')

/**
 * The next step of "Help me": the picture whose half lies on the workbench is finished (its other half is laid down upright),
 * a finished picture is sorted into its half of the heart, and on an empty workbench the left half of the first picture that is not sorted is laid down.
 */
export function commandHelp(game: CommandGame, round: CommandRound, spots: readonly CommandSpot[]): { piece: number; side: CommandSide } | { sort: CommandKind } | null {
  const joined = commandJoined(round, spots)
  if (joined && joined !== 'mismatch') {
    const kind = commandKindOf(game, joined.card)
    return kind ? { sort: kind } : null
  }
  const l = commandAt(spots, 'L')
  const r = commandAt(spots, 'R')
  const lying = l >= 0 ? l : r
  const card = lying >= 0 ? round.pieces[lying]!.card : commandCardsOf(round).find((c) => round.pieces.some((p, k) => p.card === c && spots[k] === 'tray'))
  if (!card) return null
  const side: CommandSide = lying >= 0 ? (l >= 0 ? 'R' : 'L') : 'L'
  const piece = round.pieces.findIndex((p, k) => p.card === card && p.side === side && spots[k] === 'tray')
  return piece >= 0 ? { piece, side } : null
}

/** The places of a round at the start (every half in the tray) and the turns at the start. */
export const commandStart = (round: CommandRound): { spots: CommandSpot[]; turns: number[] } => ({ spots: round.pieces.map(() => 'tray'), turns: round.pieces.map((p) => p.turn) })

/**
 * Plays a round with "Help me" only (as a child who is stuck at every step) and counts the steps; `null` when the help gets stuck or makes a mistake.
 */
export function commandHelpRun(game: CommandGame, round: CommandRound): number | null {
  const { spots, turns } = commandStart(round)
  for (let step = 1; step <= round.pieces.length * 3; step++) {
    const h = commandHelp(game, round, spots)
    if (!h) return null
    if ('sort' in h) {
      const j = commandJoined(round, spots)
      if (!j || j === 'mismatch' || commandKindOf(game, j.card) !== h.sort) return null
      spots[commandAt(spots, 'L')] = 'done'
      spots[commandAt(spots, 'R')] = 'done'
      if (commandRoundDone(spots)) return step
      continue
    }
    turns[h.piece] = 0
    if (commandPlaceVerdict(round, turns, spots, h.piece, h.side) !== 'ok') return null
    spots[h.piece] = h.side
    if (commandJoined(round, spots) === 'mismatch') return null
  }
  return null
}

/** The checks of the data (an empty list: the game can be played). */
export function commandProblems(game: CommandGame): string[] {
  const out: string[] = []
  const ids = new Set<string>()
  game.cards.forEach((c, k) => {
    if (!c.id) out.push(`picture ${k + 1} has no id`)
    if (ids.has(c.id)) out.push(`the picture "${c.id}" is there twice`)
    ids.add(c.id)
    if (!c.image) out.push(`the picture "${c.id}" has no file`)
    if (!c.label.trim()) out.push(`the picture "${c.id}" has no words`)
    if (c.kind !== 'god' && c.kind !== 'neighbor') out.push(`the picture "${c.id}" belongs to no commandment`)
  })
  if (new Set(game.cards.map((c) => c.image)).size !== game.cards.length) out.push('two pictures use the same file')
  if (!game.heart.image) out.push('no picture of the heart')
  if (!game.heart.label.trim()) out.push('the heart has no words')
  if (game.rounds.length < 2) out.push('at least two rounds')
  const used = new Set<string>()
  game.rounds.forEach((r, i) => {
    const n = i + 1
    if (!r.hint.trim()) out.push(`round ${n}: no hint`)
    const cards = commandCardsOf(r)
    if (r.pieces.length !== cards.length * 2) out.push(`round ${n}: every picture needs exactly two halves`)
    if (r.pieces.length > 8) out.push(`round ${n}: more than 8 halves do not fit into the tray`)
    for (const c of cards) {
      if (!ids.has(c)) out.push(`round ${n}: the picture "${c}" is not there`)
      if (used.has(c)) out.push(`round ${n}: the picture "${c}" was in a round before`)
      used.add(c)
      const sides = r.pieces.filter((p) => p.card === c).map((p) => p.side).sort().join('')
      if (sides !== 'LR') out.push(`round ${n}: the picture "${c}" needs one left and one right half`)
    }
    const kinds = new Set(cards.map((c) => commandKindOf(game, c)))
    if (!kinds.has('god') || !kinds.has('neighbor')) out.push(`round ${n}: pictures of both commandments are needed`)
    r.pieces.forEach((p, k) => {
      if (![90, 180, 270].includes(p.turn)) out.push(`round ${n}: half ${k + 1} must lie turned (90, 180 or 270 degrees)`)
    })
    // the two halves of one picture do not lie side by side in the tray as a ready pair
    for (let k = 0; k + 1 < r.pieces.length; k++) {
      const a = r.pieces[k]!
      const b = r.pieces[k + 1]!
      if (a.card === b.card && a.side === 'L' && b.side === 'R') out.push(`round ${n}: the halves of "${a.card}" lie side by side in the right order`)
    }
    if (commandHelpRun(game, r) === null) out.push(`round ${n}: "Help me" cannot finish the round`)
  })
  // round 2 is harder: more pictures, two of the same commandment, and a half turned upside down
  const [r1, r2] = game.rounds
  if (r1 && r2) {
    if (r2.pieces.length <= r1.pieces.length) out.push('round 2 needs more halves than round 1')
    if (!r2.pieces.some((p) => p.turn === 180)) out.push('round 2 needs a half that lies upside down')
    const k2 = commandCardsOf(r2).map((c) => commandKindOf(game, c))
    if (k2.filter((k) => k === 'god').length < 2 || k2.filter((k) => k === 'neighbor').length < 2) out.push('round 2 needs two pictures of each commandment')
    const sum = (r: CommandRound) => r.pieces.reduce((s, p) => s + commandTurnsLeft(p.turn), 0)
    if (sum(r2) <= sum(r1)) out.push('round 2 needs more turning than round 1')
  }
  return out
}
