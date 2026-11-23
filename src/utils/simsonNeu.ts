/**
 * The pure parts of the three new games of "Simson" (id `simson`, Judges 13 to 16); the components only draw and listen:
 * 1. "What must she avoid?" (`meiden`, field `avoid`, Judges 13,4.13-14): the angel tells Manoah what his wife must avoid. On the table in the yard stand jugs and food; the child puts into
 *    the basket what the woman may eat and drink and lays aside on the cloth what the angel forbade (wine, strong drink and everything that comes from the vine). There is no rule of colour or
 *    shape: only the word of the angel decides. "Unclean" is not part of the game (it could not be decided without an explanation).
 * 2. "Sweet and strong" (`raetsel`, field `riddle`, Judges 14,14.18): cards are laid on the steps of a stair, from the top down: the sweetest (the strongest) at the very top. Round 1: bread,
 *    grapes, honey; round 2: hare, sheep, donkey, lion. The lion is a calm card (standing, mouth closed); the game never says where the honey came from.
 * 3. "Lift out the gate" (`torheben`, field `gateLift`, Judges 16,3): the gate of Gaza at night; a part can be lifted only when nothing holds it any more (the bar first, then a door, then its
 *    post). Every lifted part goes onto Samson's shoulders. The order is a rule of the game, not a word of the Bible (the Bible says he took everything together, bar and all).
 * All places are percent of the picture (width and height, 3:2 unless `ratio` says otherwise); a width is percent of the width of the picture. The arithmetic has no clock and no dice.
 */

export interface Pt {
  x: number
  y: number
}

/** The width of the screen the sizes are checked against (pixels). */
export const SIMSON_PHONE_W = 360
/** The smallest finger target (pixels). */
export const SIMSON_TOUCH = 44
/** A percent of the width of the picture in pixels on a phone. */
const pxW = (w: number) => (w / 100) * SIMSON_PHONE_W
/** A percent of the height of the picture in pixels on a phone (the picture is `ratio` times as wide as high). */
const pxH = (h: number, ratio: number) => (h / 100) * (SIMSON_PHONE_W / ratio)

/** A box in percent of the picture: `x`, `y` the middle, `w` the width (percent of the width), `h` the height (percent of the height). */
export interface Box {
  x: number
  y: number
  w: number
  h: number
}
export const inBox = (b: Box, at: Pt, grow = 0): boolean => Math.abs(at.x - b.x) <= b.w / 2 + grow && Math.abs(at.y - b.y) <= b.h / 2 + grow
const boxInside = (b: Box): boolean => b.x - b.w / 2 >= 0 && b.x + b.w / 2 <= 100 && b.y - b.h / 2 >= 0 && b.y + b.h / 2 <= 100
const boxesMeet = (a: Box, b: Box): boolean => Math.abs(a.x - b.x) < (a.w + b.w) / 2 && Math.abs(a.y - b.y) < (a.h + b.h) / 2

// ================================================================ 1. what must she avoid? (`meiden`)

/** `darf`: the woman may eat or drink it (into the basket); `nicht`: the angel forbade it (aside, onto the cloth). */
export type AvoidKind = 'darf' | 'nicht'
/** Where a thing is put: the basket or the cloth. */
export type AvoidTarget = 'korb' | 'tuch'
/**
 * A thing on the table (200 x 200): `kind` says where it belongs; `vine` marks what comes from the vine although it does not look like wine (grapes, raisins, grape juice): the right
 * answer then says "That comes from the vine."
 */
export interface AvoidItem {
  id: string
  image: string
  label: string
  kind: AvoidKind
  vine?: boolean
}
export interface AvoidRound {
  hint: string
  /** The things of the round, in the order they stand on the table (and in which "Help me" shows them). */
  itemIds: string[]
}
/**
 * The game "What must she avoid?" (`meiden`): the yard before Manoah's house (3:2, morning, a table, nobody in it), the basket on the left and the cloth on the right (boxes in percent of the
 * picture), the woman sitting at the edge (a sprite, 320 x 360; `x`, `y` the middle of her lower edge, `w` her width), ten things and two rounds.
 */
export interface AvoidGame {
  background: string
  ratio?: number
  basket: { image: string; box: Box }
  cloth: { image: string; box: Box }
  woman: { image: string; x: number; y: number; w: number }
  /** Width / height of the picture of the woman (320 x 360). */
  womanRatio: number
  items: AvoidItem[]
  rounds: AvoidRound[]
}

/** The answer to a thing put somewhere: right (allowed, forbidden, from the vine) or wrong (a forbidden thing in the basket, an allowed thing aside). */
export type AvoidAnswer = 'ok' | 'banned' | 'vine' | 'wrongBanned' | 'wrongAllowed'
/** The things the angel forbade (Judges 13,4.14) and what comes from the vine (Numbers 6,3-4: "frische noch dürre Weinbeeren", "nichts, das aus Weinbeeren gemacht wird"). */
export const AVOID_BANNED_IDS = ['wein', 'starkes', 'trauben', 'rosinen', 'traubensaft']
/** How long one thing takes a child who is not in a hurry (milliseconds), and the longest round. */
export const AVOID_STEP_MS = 7000
export const AVOID_ROUND_MAX_MS = 70000
/** The smallest tile of a thing on the tray (pixels; the component draws it at least this big). */
export const AVOID_TILE_PX = 72

export const avoidItem = (game: AvoidGame, id: string): AvoidItem | undefined => game.items.find((i) => i.id === id)
/** Where a thing belongs. */
export const avoidTargetOf = (item: AvoidItem): AvoidTarget => (item.kind === 'darf' ? 'korb' : 'tuch')
/** What putting the thing `id` onto `target` means. */
export function avoidAnswer(game: AvoidGame, id: string, target: AvoidTarget): AvoidAnswer {
  const it = avoidItem(game, id)
  if (!it) return 'wrongAllowed'
  if (avoidTargetOf(it) !== target) return it.kind === 'nicht' ? 'wrongBanned' : 'wrongAllowed'
  if (it.kind === 'darf') return 'ok'
  return it.vine ? 'vine' : 'banned'
}
export const avoidRight = (a: AvoidAnswer): boolean => a === 'ok' || a === 'banned' || a === 'vine'
/** The basket or the cloth at a place of the picture (a thing let go there), or none (letting go elsewhere is no mistake). The boxes are a little larger for a child's finger. */
export function avoidTargetAt(game: AvoidGame, at: Pt): AvoidTarget | null {
  if (inBox(game.basket.box, at, 3)) return 'korb'
  if (inBox(game.cloth.box, at, 3)) return 'tuch'
  return null
}
/** What "Help me" shows: the next thing of the round that is not put away yet, and where it belongs. */
export function avoidHelp(game: AvoidGame, round: number, done: readonly string[]): { itemId: string; target: AvoidTarget } | null {
  const r = game.rounds[round]
  if (!r) return null
  for (const id of r.itemIds) {
    if (done.includes(id)) continue
    const it = avoidItem(game, id)
    if (it) return { itemId: id, target: avoidTargetOf(it) }
  }
  return null
}
/** The height of the woman in percent of the height of the picture. */
export const avoidWomanHeight = (game: AvoidGame): number => (game.woman.w * (game.ratio ?? 1.5)) / game.womanRatio
export const avoidRoundMs = (game: AvoidGame, round: number): number => (game.rounds[round]?.itemIds.length ?? 0) * AVOID_STEP_MS

/** The problems of the data of `meiden` (an empty list is good). */
export function avoidProblems(game: AvoidGame): string[] {
  const out: string[] = []
  const ratio = game.ratio ?? 1.5
  if (!game.background) out.push('no picture of the yard')
  if (!game.basket?.image || !game.cloth?.image) out.push('the basket and the cloth need pictures')
  if (!game.woman?.image) out.push('no picture of the woman')
  if (!(game.womanRatio > 0.3 && game.womanRatio < 3)) out.push('the ratio of the picture of the woman is not sensible')
  // ---- the basket and the cloth: in the picture, apart, big enough for a finger
  for (const [name, b] of [['basket', game.basket?.box], ['cloth', game.cloth?.box]] as const) {
    if (!b) continue
    if (!boxInside(b)) out.push(`the ${name} lies outside the picture`)
    if (pxW(b.w) < SIMSON_TOUCH || pxH(b.h, ratio) < SIMSON_TOUCH) out.push(`the ${name} is smaller than ${SIMSON_TOUCH} x ${SIMSON_TOUCH} pixels on a phone`)
  }
  if (game.basket?.box && game.cloth?.box && boxesMeet({ ...game.basket.box, w: game.basket.box.w + 6, h: game.basket.box.h + 6 }, { ...game.cloth.box, w: game.cloth.box.w + 6, h: game.cloth.box.h + 6 }))
    out.push('the basket and the cloth lie too close together')
  if (game.basket?.box && game.cloth?.box && !(game.basket.box.x < game.cloth.box.x)) out.push('the basket lies on the left, the cloth on the right')
  // ---- the woman: in the picture, not on the basket or the cloth
  if (game.woman) {
    const h = avoidWomanHeight(game)
    const w = game.woman
    if (w.x - w.w / 2 < 0 || w.x + w.w / 2 > 100 || w.y > 100 || w.y - h < 0) out.push('the woman lies outside the picture')
    const wb: Box = { x: w.x, y: w.y - h / 2, w: w.w, h }
    if ((game.basket?.box && boxesMeet(wb, game.basket.box)) || (game.cloth?.box && boxesMeet(wb, game.cloth.box))) out.push('the woman covers the basket or the cloth')
  }
  // ---- the ten things
  if (game.items.length !== 10) out.push('ten things are needed')
  const ids = game.items.map((i) => i.id)
  if (new Set(ids).size !== ids.length) out.push('two things have the same id')
  for (const it of game.items) {
    if (!it.image || !it.label) out.push(`${it.id}: needs a picture and a label`)
    const banned = AVOID_BANNED_IDS.includes(it.id)
    if (it.kind === 'nicht' && !banned) out.push(`${it.id}: the angel did not forbid it`)
    if (it.kind === 'darf' && banned) out.push(`${it.id}: comes from the vine or is strong drink, the woman must avoid it`)
    if (it.vine && it.kind !== 'nicht') out.push(`${it.id}: what comes from the vine must be laid aside`)
  }
  // ---- the rounds: four drinks (two and two), six things to eat and drink (three and three)
  if (game.rounds.length !== 2) out.push('there must be two rounds')
  const used: string[] = []
  game.rounds.forEach((r, i) => {
    const n = i + 1
    if (!r.hint) out.push(`round ${n} has no hint`)
    const want = i === 0 ? 4 : 6
    if (r.itemIds.length !== want) out.push(`round ${n} needs ${want} things`)
    for (const id of r.itemIds) if (!ids.includes(id)) out.push(`round ${n}: ${id} is no thing`)
    const items = r.itemIds.map((id) => avoidItem(game, id)).filter((x): x is AvoidItem => !!x)
    const ok = items.filter((x) => x.kind === 'darf').length
    if (ok !== want / 2 || items.length - ok !== want / 2) out.push(`round ${n}: half of the things are allowed, half forbidden`)
    // the first thing of a round must not already be sorted by its look: the round mixes both kinds in the first two
    if (items.length >= 2 && items[0]!.kind === items[1]!.kind && items.every((x, k) => k < want / 2 ? x.kind === items[0]!.kind : x.kind !== items[0]!.kind))
      out.push(`round ${n}: the things stand sorted on the table`)
    used.push(...r.itemIds)
    if (avoidRoundMs(game, i) > AVOID_ROUND_MAX_MS) out.push(`round ${n}: lasts longer than ${AVOID_ROUND_MAX_MS / 1000} seconds`)
    // the help solves the round without a mistake
    const done: string[] = []
    for (let k = 0; k < r.itemIds.length; k++) {
      const h = avoidHelp(game, i, done)
      if (!h) {
        out.push(`round ${n}: the help finds nothing`)
        break
      }
      if (!avoidRight(avoidAnswer(game, h.itemId, h.target))) out.push(`round ${n}: the help puts ${h.itemId} in the wrong place`)
      done.push(h.itemId)
    }
  })
  if (new Set(used).size !== used.length) out.push('a thing comes twice')
  for (const id of ids) if (!used.includes(id)) out.push(`${id} is never used`)
  if (AVOID_TILE_PX < SIMSON_TOUCH) out.push('the tiles of the things are too small')
  return out
}

// ================================================================ 2. sweet and strong (`raetsel`)

/** A card (220 x 220, a round clay tablet with a picture). */
export interface RiddleCard {
  id: string
  image: string
  label: string
}
/** `sweet`: round 1 (the sweetest at the top), `strong`: round 2 (the strongest at the top); the words of the answers depend on it. */
export type RiddleQuality = 'sweet' | 'strong'
export interface RiddleRound {
  hint: string
  quality: RiddleQuality
  /** The word at the top of the stair ("am süßesten"). */
  ladderLabel: string
  /** The cards in the RIGHT order from the bottom to the top (the last one belongs on the top step). */
  cards: RiddleCard[]
  /** The ids of the cards in the order they lie on the tray (mixed, never already the right order). */
  mix: string[]
}
/**
 * The game "Sweet and strong" (`raetsel`): the yard of the feast in Timnah (3:2, evening, no people), the stair on the right (`ladder`: the middle of its lowest step `x`, `y` = lower edge,
 * and the width of a step `w`, percent), the picture of a step (420 x 140), the soft glow (400 x 400) and two rounds.
 */
export interface RiddleGame {
  background: string
  ratio?: number
  step: string
  /** Width / height of the picture of a step (420 x 140 = 3). */
  stepRatio: number
  glow: string
  ladder: { x: number; y: number; w: number }
  rounds: RiddleRound[]
}

/** How much narrower every higher step is (share of the width of the lowest step). */
export const RIDDLE_NARROW = 0.08
/** The smallest card on the tray (pixels; the component draws them this big). */
export const RIDDLE_CARD_PX = 76
export const RIDDLE_STEP_MS = 6500
export const RIDDLE_ROUND_MAX_MS = 60000

/** The height of a step in percent of the height of the picture. */
export const riddleStepH = (game: RiddleGame): number => (game.ladder.w * (game.ratio ?? 1.5)) / game.stepRatio
/** The box of step `i` (0 = the lowest) of a stair of `n` steps. */
export function riddleStepBox(game: RiddleGame, i: number): Box {
  const h = riddleStepH(game)
  const w = game.ladder.w * (1 - i * RIDDLE_NARROW)
  return { x: game.ladder.x, y: game.ladder.y - h * (i + 0.5), w, h }
}
/** The step a card is wanted on now: from the top down (`placed` cards lie already). */
export const riddleWanted = (round: RiddleRound, placed: number): number => round.cards.length - 1 - placed
/** Is `cardId` the card for the step that is wanted now? */
export function riddleCheck(round: RiddleRound, placed: number, cardId: string): boolean {
  const i = riddleWanted(round, placed)
  return i >= 0 && round.cards[i]?.id === cardId
}
/** The step at a place of the picture (a card let go there), or none. */
export function riddleStepAt(game: RiddleGame, round: RiddleRound, at: Pt): number | null {
  for (let i = 0; i < round.cards.length; i++) if (inBox(riddleStepBox(game, i), at, 2)) return i
  return null
}
/** What "Help me" shows: the card for the step that is wanted now. */
export function riddleHelp(round: RiddleRound, placed: number): string | null {
  const i = riddleWanted(round, placed)
  return i >= 0 ? (round.cards[i]?.id ?? null) : null
}
export const riddleCard = (round: RiddleRound, id: string): RiddleCard | undefined => round.cards.find((c) => c.id === id)

/** The problems of the data of `raetsel` (an empty list is good). */
export function riddleProblems(game: RiddleGame): string[] {
  const out: string[] = []
  const ratio = game.ratio ?? 1.5
  if (!game.background) out.push('no picture of the yard')
  if (!game.step) out.push('no picture of a step')
  if (!game.glow) out.push('no picture of the glow')
  if (!(game.stepRatio > 1 && game.stepRatio < 8)) out.push('the ratio of the picture of a step is not sensible')
  if (game.rounds.length !== 2) out.push('there must be two rounds')
  const qualities = game.rounds.map((r) => r.quality)
  if (qualities.join() !== 'sweet,strong') out.push('round 1 asks for the sweetest, round 2 for the strongest')
  game.rounds.forEach((r, i) => {
    const n = i + 1
    if (!r.hint || !r.ladderLabel) out.push(`round ${n} needs a hint and the word of the stair`)
    const want = i === 0 ? 3 : 4
    if (r.cards.length !== want) out.push(`round ${n} needs ${want} cards`)
    const ids = r.cards.map((c) => c.id)
    if (new Set(ids).size !== ids.length) out.push(`round ${n}: two cards have the same id (two cards equally ${r.quality})`)
    for (const c of r.cards) if (!c.image || !c.label) out.push(`round ${n}: ${c.id} needs a picture and a label`)
    if (r.mix.length !== ids.length || [...r.mix].sort().join() !== [...ids].sort().join()) out.push(`round ${n}: the mix must hold every card once`)
    if (r.mix.join() === ids.join() || r.mix.join() === [...ids].reverse().join()) out.push(`round ${n}: the mix lies already in order`)
    // the steps lie in the picture and are big enough for a finger
    for (let k = 0; k < r.cards.length; k++) {
      const b = riddleStepBox(game, k)
      if (!boxInside(b)) out.push(`round ${n}: step ${k + 1} lies outside the picture`)
      if (pxW(b.w) < SIMSON_TOUCH || pxH(b.h, ratio) < SIMSON_TOUCH) out.push(`round ${n}: step ${k + 1} is smaller than ${SIMSON_TOUCH} pixels on a phone`)
    }
    if (r.cards.length * RIDDLE_STEP_MS > RIDDLE_ROUND_MAX_MS) out.push(`round ${n}: lasts longer than ${RIDDLE_ROUND_MAX_MS / 1000} seconds`)
    // the help solves the round without a mistake
    for (let placed = 0; placed < r.cards.length; placed++) {
      const h = riddleHelp(r, placed)
      if (!h || !riddleCheck(r, placed, h)) out.push(`round ${n}: the help does not find the card for step ${r.cards.length - placed}`)
    }
  })
  if (RIDDLE_CARD_PX < SIMSON_TOUCH) out.push('the cards are too small')
  return out
}

// ================================================================ 3. lift out the gate (`torheben`)

/**
 * A part of the gate: its picture, its place (`x`, `y` the middle, percent of the picture), its width (`w`, percent of the width) and the ratio of its picture (`ratio`, width / height:
 * the bar 700 x 120, a door 300 x 620, a post 140 x 700). `holds` are the parts that still hold it: it is free when all of them are lifted.
 */
export interface GatePart {
  id: string
  image: string
  label: string
  x: number
  y: number
  w: number
  ratio: number
  holds: string[]
}
export interface GateRound {
  hint: string
  parts: GatePart[]
}
/**
 * The game "Lift out the gate" (`torheben`): the city wall of Gaza at night with an empty gateway (3:2, nobody in it), Samson beside the gate (a sprite, 420 x 520: `x`, `y` the middle of his
 * lower edge, `w` his width), his shoulders (`shoulder`: where the first lifted part lies, how much higher every next one lies, how wide a carried part is drawn; percent) and two rounds.
 */
export interface GateLiftGame {
  background: string
  ratio?: number
  strong: { image: string; x: number; y: number; w: number; ratio: number }
  shoulder: { x: number; y: number; step: number; w: number }
  rounds: GateRound[]
}

/** The smallest finger target of a part (pixels; the component draws the target at least this big, also when the picture is narrower, like the bar). */
export const GATE_HIT_PX = SIMSON_TOUCH
export const GATE_STEP_MS = 6000
export const GATE_ROUND_MAX_MS = 60000

export const gatePart = (round: GateRound, id: string): GatePart | undefined => round.parts.find((p) => p.id === id)
/** The height of a part in percent of the height of the picture. */
export const gatePartH = (game: GateLiftGame, p: GatePart): number => (p.w * (game.ratio ?? 1.5)) / p.ratio
/** The box of a part in percent of the picture. */
export const gateBox = (game: GateLiftGame, p: GatePart): Box => ({ x: p.x, y: p.y, w: p.w, h: gatePartH(game, p) })
/** Is the part free (not lifted, and nothing holds it any more)? */
export function gateFree(round: GateRound, lifted: readonly string[], id: string): boolean {
  const p = gatePart(round, id)
  return !!p && !lifted.includes(id) && p.holds.every((h) => lifted.includes(h))
}
/** What a tap on a part does: it is lifted (`ok`), it still holds (`held`) or it was lifted already (`gone`). */
export function gateTry(round: GateRound, lifted: readonly string[], id: string): 'ok' | 'held' | 'gone' {
  if (lifted.includes(id)) return 'gone'
  return gateFree(round, lifted, id) ? 'ok' : 'held'
}
/** What "Help me" shows: the first free part (in the order of the data). */
export const gateHelp = (round: GateRound, lifted: readonly string[]): string | null => round.parts.find((p) => gateFree(round, lifted, p.id))?.id ?? null
/** One way to lift every part (by always lifting the first free one), or null when the round cannot be solved (a part that holds itself, a circle). */
export function gateSolve(round: GateRound): string[] | null {
  const lifted: string[] = []
  while (lifted.length < round.parts.length) {
    const next = gateHelp(round, lifted)
    if (!next) return null
    lifted.push(next)
  }
  return lifted
}
/** The top of the load on Samson's shoulders after `n` parts (percent of the height). */
export const gateLoadTop = (game: GateLiftGame, n: number): number => game.shoulder.y - Math.max(0, n) * game.shoulder.step
/** The height of Samson in percent of the height of the picture. */
export const gateStrongH = (game: GateLiftGame): number => (game.strong.w * (game.ratio ?? 1.5)) / game.strong.ratio
/** Samson's box (the place where a part can be let go). */
export const gateStrongBox = (game: GateLiftGame): Box => {
  const h = gateStrongH(game)
  return { x: game.strong.x, y: game.strong.y - h / 2, w: game.strong.w, h }
}
/** The size of the finger target of a part in pixels on a phone (at least `GATE_HIT_PX`). */
export function gateHitPx(game: GateLiftGame, p: GatePart): { w: number; h: number } {
  const b = gateBox(game, p)
  return { w: Math.max(GATE_HIT_PX, pxW(b.w)), h: Math.max(GATE_HIT_PX, pxH(b.h, game.ratio ?? 1.5)) }
}

/** The problems of the data of `torheben` (an empty list is good). */
export function gateLiftProblems(game: GateLiftGame): string[] {
  const out: string[] = []
  if (!game.background) out.push('no picture of the gate at night')
  if (!game.strong?.image) out.push('no picture of Samson')
  if (game.strong) {
    const h = gateStrongH(game)
    const s = game.strong
    if (s.x - s.w / 2 < 0 || s.x + s.w / 2 > 100 || s.y > 100 || s.y - h < 0) out.push('Samson lies outside the picture')
    if (pxW(s.w) < SIMSON_TOUCH) out.push('Samson is too small for a finger')
  }
  if (!(game.shoulder?.step > 0) || !(game.shoulder?.w > 0)) out.push('the shoulders need a step and a width')
  if (game.rounds.length !== 2) out.push('there must be two rounds')
  game.rounds.forEach((r, i) => {
    const n = i + 1
    if (!r.hint) out.push(`round ${n} has no hint`)
    const want = i === 0 ? 3 : 5
    if (r.parts.length !== want) out.push(`round ${n} needs ${want} parts`)
    const ids = r.parts.map((p) => p.id)
    if (new Set(ids).size !== ids.length) out.push(`round ${n}: two parts have the same id`)
    for (const p of r.parts) {
      if (!p.image || !p.label) out.push(`round ${n}: ${p.id} needs a picture and a label`)
      if (!(p.ratio > 0.05 && p.ratio < 20)) out.push(`round ${n}: ${p.id} has no sensible ratio`)
      for (const h of p.holds) if (!ids.includes(h)) out.push(`round ${n}: ${p.id} is held by ${h}, which is not there`)
      if (p.holds.includes(p.id)) out.push(`round ${n}: ${p.id} holds itself`)
      if (!boxInside(gateBox(game, p))) out.push(`round ${n}: ${p.id} lies outside the picture`)
      const px = gateHitPx(game, p)
      if (px.w < SIMSON_TOUCH || px.h < SIMSON_TOUCH) out.push(`round ${n}: ${p.id} is smaller than ${SIMSON_TOUCH} pixels on a phone`)
      if (game.strong && boxesMeet(gateBox(game, p), gateStrongBox(game))) out.push(`round ${n}: ${p.id} lies on Samson`)
    }
    // at the start at least one part is free, and the way to the last part can be gone (no circle)
    if (!r.parts.some((p) => gateFree(r, [], p.id))) out.push(`round ${n}: no part is free at the start`)
    if (!gateSolve(r)) out.push(`round ${n}: the gate cannot be lifted (the parts hold each other in a circle)`)
    // not everything is free at the start (else there is nothing to think)
    if (r.parts.every((p) => gateFree(r, [], p.id))) out.push(`round ${n}: every part is free at the start`)
    // the load stays in the picture
    if (game.shoulder && gateLoadTop(game, r.parts.length) - game.shoulder.step < 0) out.push(`round ${n}: the load on the shoulders goes over the edge of the picture`)
    if (r.parts.length * GATE_STEP_MS > GATE_ROUND_MAX_MS) out.push(`round ${n}: lasts longer than ${GATE_ROUND_MAX_MS / 1000} seconds`)
  })
  return out
}
