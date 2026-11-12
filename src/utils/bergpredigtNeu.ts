/**
 * The pure parts of the three new games of "Die Bergpredigt" (id `bergpredigt`); the components only draw and listen:
 * 1. "Whom is the word for?" (`selig`, field `blessed`, Matthew 5,3-6): four listeners sit on the meadow; Jesus says a blessing to each of them; the child gives every listener the gift that
 *    belongs to his blessing (the kingdom of heaven, comfort, the land, to be filled). In round 2 six gifts lie ready for four people: two belong to nobody.
 * 2. "Where does the light belong?" (`scheffel`, field `lightStand`, Matthew 5,15-16): a lamp burns under a basket in a dark room; the child lifts the basket and puts the lamp where everyone
 *    in the house has light. The reach of the light depends on the place (floor, table, lampstand): only the lampstand reaches everybody.
 * 3. "Look closely" (`nahblick`, field `nearView`, Matthew 6,28): a wreath of olive twigs is the child's window over a meadow of flowers; inside it every blossom shows itself close up, and on some
 *    of them a small guest sits (a bee, a ladybird, a butterfly, a cricket) that cannot be seen without the wreath. The child taps the guests.
 * All places are percent of the picture (width and height, 3:2); distances are in "units" (percent of the width), the vertical difference is shortened by the ratio of the picture.
 * The arithmetic has no clock and no dice of its own: the component says how many milliseconds have passed.
 */

export interface Pt {
  x: number
  y: number
}

/** The distance of two places in units (percent of the width); the vertical difference is shortened by the ratio of the picture (width / height). */
export function bergDist(a: Pt, b: Pt, ratio = 1.5): number {
  return Math.hypot(a.x - b.x, (a.y - b.y) / ratio)
}
export const bergClamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v))

/** The width of the screen the sizes are checked against (pixels). */
export const BERG_PHONE_W = 360
/** The smallest finger target (pixels). */
export const BERG_TOUCH = 44

// ================================================================ 1. whom is the word for? (`selig`)

/** A listener on the meadow: `x`, `y` is the middle of his seat on the ground (percent of the picture), `w` the width of the figure (percent of the width). */
export interface BlessedPerson {
  id: string
  image: string
  /** For screen readers (who it is and what he does). */
  label: string
  x: number
  y: number
  w: number
}
/** A gift. `forPerson` is the listener whose blessing it is; a gift without it belongs to nobody (a chest of gold, a king's cloak). `caption` is the short word under the gift. */
export interface BlessedGift {
  id: string
  image: string
  label: string
  caption: string
  forPerson?: string
}
/** What Jesus says to one listener (word for word the sentences of the story). */
export interface BlessedSentence {
  personId: string
  text: string
}
/**
 * `sentence`: round 1, the sentence is on, its gift lies alone and shines, the child gives it to the listener it is meant for.
 * `free`: round 2, six gifts for four listeners, in any order; no sentence is shown. `order` is the order in which the listeners are served (round 1) or helped (round 2).
 */
export interface BlessedRound {
  hint: string
  mode: 'sentence' | 'free'
  order: string[]
}
/**
 * The game "Whom is the word for?" (`selig`): the hillside meadow (3:2, early morning, no people, no animals), the four listeners, six gifts (200 x 200), the basket for the gifts that belong
 * to nobody, the soft glow that rises under a listener (400 x 400), the four sentences in the order of the story and two rounds.
 */
export interface BlessedGame {
  background: string
  ratio?: number
  /** Width / height of the picture of a listener (320 x 360). */
  peopleRatio: number
  people: BlessedPerson[]
  gifts: BlessedGift[]
  basket: string
  glow: string
  sentences: BlessedSentence[]
  rounds: BlessedRound[]
}

/** What a gift on a listener means: right, a gift that belongs to nobody, a gift that is meant for another listener, a listener who has his gift already. */
export type BlessedPlace = 'ok' | 'stranger' | 'wrong' | 'taken'

/** How long one handing over takes a child who is not in a hurry (milliseconds); the sentences of the end are read one after the other. */
export const BLESSED_STEP_MS = 5500
export const BLESSED_RECAP_MS = 2400
/** A round may take at most this long (milliseconds, "in a calm game"). */
export const BLESSED_ROUND_MAX_MS = 70000

export const blessedPerson = (game: BlessedGame, id: string): BlessedPerson | undefined => game.people.find((p) => p.id === id)
export const blessedGift = (game: BlessedGame, id: string): BlessedGift | undefined => game.gifts.find((g) => g.id === id)
/** The gift that belongs to a listener. */
export const blessedGiftOf = (game: BlessedGame, personId: string): BlessedGift | undefined => game.gifts.find((g) => g.forPerson === personId)
/** The sentence of a listener. */
export const blessedSentenceOf = (game: BlessedGame, personId: string): BlessedSentence | undefined => game.sentences.find((s) => s.personId === personId)
/** The gifts that belong to nobody. */
export const blessedStrangers = (game: BlessedGame): BlessedGift[] => game.gifts.filter((g) => !g.forPerson)

/** What happens when `giftId` is given to `personId`; `served` are the listeners who have their gift. */
export function blessedPlace(game: BlessedGame, giftId: string, personId: string, served: readonly string[]): BlessedPlace {
  const g = blessedGift(game, giftId)
  if (!g || !blessedPerson(game, personId)) return 'wrong'
  if (!g.forPerson) return 'stranger'
  if (g.forPerson !== personId) return 'wrong'
  return served.includes(personId) ? 'taken' : 'ok'
}

/** The height of a listener in percent of the height of the picture. */
export const blessedHeight = (game: BlessedGame, p: BlessedPerson): number => (p.w * (game.ratio ?? 1.5)) / game.peopleRatio
/** The size of the finger target of a listener in pixels on a phone. */
export function blessedPersonPx(game: BlessedGame, p: BlessedPerson): { w: number; h: number } {
  const w = (p.w / 100) * BERG_PHONE_W
  return { w, h: w / game.peopleRatio }
}
/**
 * The listener at a place of the picture (a gift is let go there): the one whose figure the place lies in (the nearest middle if two figures overlap), or none (letting go beside the listeners is
 * no mistake). The box is a little larger than the figure, so that a child's finger does not have to be exact.
 */
export function blessedPersonAt(game: BlessedGame, at: Pt): string | null {
  const ratio = game.ratio ?? 1.5
  let best: { id: string; d: number } | null = null
  for (const p of game.people) {
    const h = blessedHeight(game, p)
    const inX = Math.abs(at.x - p.x) <= (p.w / 2) * 1.15
    const inY = at.y >= p.y - h * 1.05 && at.y <= p.y + h * 0.08
    if (!inX || !inY) continue
    const d = bergDist(at, { x: p.x, y: p.y - h / 2 }, ratio)
    if (!best || d < best.d) best = { id: p.id, d }
  }
  return best ? best.id : null
}

/**
 * What "Help me" shows: the listener (and his gift) that is next. Round 1: the listener of the sentence that is on. Round 2: the listener of the gift the child holds, if that gift belongs to
 * somebody who has not been served; otherwise the next listener in the order of the round who has not been served.
 */
export function blessedHelp(game: BlessedGame, round: number, served: readonly string[], held?: string): { personId: string; giftId: string } | null {
  const r = game.rounds[round]
  if (!r) return null
  const heldGift = held ? blessedGift(game, held) : undefined
  let personId: string | undefined
  if (r.mode === 'free' && heldGift?.forPerson && !served.includes(heldGift.forPerson)) personId = heldGift.forPerson
  else personId = r.order.find((id) => !served.includes(id))
  if (!personId) return null
  const gift = blessedGiftOf(game, personId)
  return gift ? { personId, giftId: gift.id } : null
}
/** How long a round takes a calm child (milliseconds). */
export const blessedRoundMs = (game: BlessedGame, round: number): number =>
  game.people.length * BLESSED_STEP_MS + (game.rounds[round]?.mode === 'free' ? game.sentences.length * BLESSED_RECAP_MS : 0)

/** The problems of the data of `selig` (an empty list is good). */
export function blessedProblems(game: BlessedGame): string[] {
  const out: string[] = []
  const ratio = game.ratio ?? 1.5
  if (!game.background) out.push('no picture of the meadow')
  if (!game.basket) out.push('no picture of the basket')
  if (!game.glow) out.push('no picture of the glow')
  if (!(game.peopleRatio > 0.3 && game.peopleRatio < 3)) out.push('the ratio of the pictures of the listeners is not sensible')
  // ---- the four listeners
  if (game.people.length !== 4) out.push('four listeners are needed')
  const ids = game.people.map((p) => p.id)
  if (new Set(ids).size !== ids.length) out.push('two listeners have the same id')
  for (const p of game.people) {
    if (!p.image) out.push(`${p.id}: no picture`)
    if (!p.label) out.push(`${p.id}: no label`)
    const px = blessedPersonPx(game, p)
    if (px.w < BERG_TOUCH || px.h < BERG_TOUCH) out.push(`${p.id}: smaller than ${BERG_TOUCH} x ${BERG_TOUCH} pixels on a phone`)
    const h = blessedHeight(game, p)
    if (p.x - p.w / 2 < 0 || p.x + p.w / 2 > 100 || p.y > 100 || p.y - h < 0) out.push(`${p.id}: lies outside the picture`)
  }
  game.people.forEach((a, i) =>
    game.people.forEach((b, k) => {
      if (k > i && bergDist({ x: a.x, y: a.y - blessedHeight(game, a) / 2 }, { x: b.x, y: b.y - blessedHeight(game, b) / 2 }, ratio) < Math.min(a.w, b.w) * 0.6) out.push(`${a.id} and ${b.id} sit on top of each other`)
    })
  )
  // ---- the six gifts: four belong to one listener each, two to nobody
  if (game.gifts.length !== 6) out.push('six gifts are needed')
  const gids = game.gifts.map((g) => g.id)
  if (new Set(gids).size !== gids.length) out.push('two gifts have the same id')
  for (const g of game.gifts) {
    if (!g.image) out.push(`${g.id}: no picture`)
    if (!g.label || !g.caption) out.push(`${g.id}: no label or caption`)
    if (g.forPerson && !ids.includes(g.forPerson)) out.push(`${g.id}: belongs to a listener who is not there`)
  }
  for (const id of ids) if (game.gifts.filter((g) => g.forPerson === id).length !== 1) out.push(`${id}: needs exactly one gift`)
  if (blessedStrangers(game).length !== 2) out.push('two gifts must belong to nobody')
  // ---- the sentences: one for each listener, in the order of the story
  if (game.sentences.length !== game.people.length) out.push('one sentence for each listener is needed')
  game.sentences.forEach((s, i) => {
    if (!s.text) out.push(`sentence ${i + 1} has no text`)
    if (!ids.includes(s.personId)) out.push(`sentence ${i + 1} names a listener who is not there`)
  })
  if (new Set(game.sentences.map((s) => s.personId)).size !== game.sentences.length) out.push('two sentences are for the same listener')
  // ---- the rounds
  if (game.rounds.length !== 2) out.push('there must be two rounds')
  game.rounds.forEach((r, i) => {
    const n = i + 1
    if (!r.hint) out.push(`round ${n} has no hint`)
    if (r.order.length !== game.people.length || new Set(r.order).size !== r.order.length || r.order.some((id) => !ids.includes(id))) out.push(`round ${n}: the order names every listener once`)
    if (blessedRoundMs(game, i) > BLESSED_ROUND_MAX_MS) out.push(`round ${n}: lasts longer than ${BLESSED_ROUND_MAX_MS / 1000} seconds`)
    // the help names the right listener in every state of the round: it solves the round without a mistake
    const served: string[] = []
    for (const id of r.order) {
      const h = blessedHelp(game, i, served)
      if (!h || h.personId !== id) out.push(`round ${n}: the help does not name ${id}`)
      else if (blessedPlace(game, h.giftId, h.personId, served) !== 'ok') out.push(`round ${n}: the gift of the help does not fit ${id}`)
      served.push(id)
    }
  })
  if (game.rounds[0] && game.rounds[0].mode !== 'sentence') out.push('round 1 is the round of the sentences')
  if (game.rounds[1] && game.rounds[1].mode !== 'free') out.push('round 2 is the round of the free choice')
  if (game.rounds[0] && game.sentences.length === game.people.length && game.rounds[0].order.some((id, k) => game.sentences[k]?.personId !== id)) out.push('round 1 follows the order of the sentences')
  return out
}

// ================================================================ 2. where does the light belong? (`scheffel`)

export type LightSpotId = 'boden' | 'tisch' | 'leuchter'
/** A person in the room: `x`, `y` is the middle of the feet (percent of the picture), `w` the width of the figure (percent of the width). */
export interface LightPerson {
  id: string
  image: string
  label: string
  x: number
  y: number
  w: number
}
/** A place for the lamp: `x`, `y` where the lamp stands (percent of the picture), `radius` how far its light reaches (percent of the width; the light is a circle). */
export interface LightSpot {
  id: LightSpotId
  x: number
  y: number
  radius: number
}
/**
 * A room (seen from the side, 3:2). `bright` is the painted room with light, `dark` the same room dark; without `dark` the code darkens the bright picture. `basket` is the basket that lies over the
 * lamp at the start (round 1; the middle of its lower edge and its width).
 */
export interface LightRoom {
  hint: string
  bright: string
  dark?: string
  people: LightPerson[]
  spots: LightSpot[]
  basket?: { x: number; y: number; w: number }
}
export interface LightStandGame {
  ratio?: number
  /** Width / height of the picture of a person (220 x 320). */
  peopleRatio: number
  basket: string
  lampOff: string
  lampOn: string
  /** The width of the lamp (percent of the width of the room). */
  lampW: number
  /** The lampstand (200 x 520): its width; its top (the bowl) stands at the place of the lampstand. */
  stand: { image: string; w: number }
  rooms: LightRoom[]
}

/** The height of a person in percent of the height of the picture. */
export const lightHeight = (game: LightStandGame, p: LightPerson): number => (p.w * (game.ratio ?? 1.5)) / game.peopleRatio
/** The middle of a person (where the light has to reach). */
export const lightCentre = (game: LightStandGame, p: LightPerson): Pt => ({ x: p.x, y: p.y - lightHeight(game, p) / 2 })
export const lightSpotOf = (room: LightRoom, id: LightSpotId): LightSpot | undefined => room.spots.find((s) => s.id === id)
/** Does the light of the lamp on `spot` reach `person`? */
export const lightReaches = (game: LightStandGame, spot: LightSpot, p: LightPerson): boolean => bergDist(spot, lightCentre(game, p), game.ratio ?? 1.5) <= spot.radius
/** The people the light of the lamp on `spotId` does not reach. */
export function lightDark(game: LightStandGame, room: LightRoom, spotId: LightSpotId): LightPerson[] {
  const s = lightSpotOf(room, spotId)
  return s ? room.people.filter((p) => !lightReaches(game, s, p)) : room.people.slice()
}
/** The places that give every person light. */
export const lightSolvers = (game: LightStandGame, room: LightRoom): LightSpotId[] => room.spots.filter((s) => lightDark(game, room, s.id).length === 0).map((s) => s.id)
/** The place nearest to a point of the picture when the lamp is let go there, or none when no place is near (units). */
export function lightSpotAt(game: LightStandGame, room: LightRoom, at: Pt, within = 16): LightSpotId | null {
  let best: { id: LightSpotId; d: number } | null = null
  for (const s of room.spots) {
    const d = bergDist(at, s, game.ratio ?? 1.5)
    if (d <= within && (!best || d < best.d)) best = { id: s.id, d }
  }
  return best ? best.id : null
}
/** What "Help me" shows: the basket first (while it lies over the lamp), then the place that solves the room. */
export function lightHelp(game: LightStandGame, room: number, basketGone: boolean): 'basket' | LightSpotId | null {
  const r = game.rooms[room]
  if (!r) return null
  if (r.basket && !basketGone) return 'basket'
  return lightSolvers(game, r)[0] ?? null
}
/** The size of a mark of a place in pixels on a phone: it is at least a finger target (the component draws it at least that big). */
export const LIGHT_SPOT_PX = 48

/** The problems of the data of `scheffel` (an empty list is good). */
export function lightStandProblems(game: LightStandGame): string[] {
  const out: string[] = []
  const ratio = game.ratio ?? 1.5
  if (!game.basket || !game.lampOff || !game.lampOn || !game.stand?.image) out.push('the basket, the lamp (off, on) and the lampstand need pictures')
  if (!(game.peopleRatio > 0.3 && game.peopleRatio < 3)) out.push('the ratio of the pictures of the people is not sensible')
  if (game.rooms.length !== 2) out.push('there must be two rooms')
  game.rooms.forEach((room, i) => {
    const n = i + 1
    if (!room.hint) out.push(`room ${n} has no hint`)
    if (!room.bright) out.push(`room ${n}: no picture of the lit room`)
    const want = i === 0 ? 2 : 5
    if (room.people.length !== want) out.push(`room ${n} needs ${want} people`)
    const ids = room.people.map((p) => p.id)
    if (new Set(ids).size !== ids.length) out.push(`room ${n}: two people have the same id`)
    for (const p of room.people) {
      if (!p.image || !p.label) out.push(`room ${n}: ${p.id} needs a picture and a label`)
      const h = lightHeight(game, p)
      if (p.x - p.w / 2 < 0 || p.x + p.w / 2 > 100 || p.y > 100 || p.y - h < 0) out.push(`room ${n}: ${p.id} lies outside the picture`)
    }
    // the three places
    const sids = room.spots.map((s) => s.id).sort()
    if (sids.join() !== 'boden,leuchter,tisch') out.push(`room ${n}: the places are the floor, the table and the lampstand`)
    for (const s of room.spots) {
      if (s.x < 0 || s.x > 100 || s.y < 0 || s.y > 100) out.push(`room ${n}: ${s.id} lies outside the picture`)
      if (!(s.radius > 4)) out.push(`room ${n}: ${s.id} has no reach`)
      for (const p of room.people) {
        const h = lightHeight(game, p)
        if (Math.abs(s.x - p.x) < p.w / 2 && s.y >= p.y - h && s.y <= p.y) out.push(`room ${n}: ${p.id} stands on the place ${s.id}`)
      }
    }
    room.spots.forEach((a, k) =>
      room.spots.forEach((b, m) => {
        if (m > k && bergDist(a, b, ratio) * (BERG_PHONE_W / 100) < LIGHT_SPOT_PX) out.push(`room ${n}: the places ${a.id} and ${b.id} are too close for a finger`)
      })
    )
    // only the lampstand gives light to everybody; the table and the floor leave somebody in the dark
    const solvers = lightSolvers(game, room)
    if (solvers.length !== 1 || solvers[0] !== 'leuchter') out.push(`room ${n}: only the lampstand must reach everybody (now: ${solvers.join(', ') || 'nobody'})`)
    if (room.spots.length === 3) {
      if (lightDark(game, room, 'tisch').length < 1) out.push(`room ${n}: the table must leave at least one person in the dark`)
      const need = i === 0 ? 1 : 3
      if (lightDark(game, room, 'boden').length < need) out.push(`room ${n}: the floor must leave at least ${need} in the dark`)
    }
    // the basket lies over the lamp on the table in round 1
    if (i === 0) {
      if (!room.basket) out.push('room 1 needs the basket over the lamp')
      else if (room.basket.w < 8) out.push('room 1: the basket is too small')
    }
    // the help (first the basket, then the place) solves the room without a mistake
    const h = lightHelp(game, i, true)
    if (h !== 'leuchter') out.push(`room ${n}: the help does not name the lampstand`)
  })
  return out
}

// ================================================================ 3. look closely (`nahblick`)

/** The kind of guests: a picture (300 x 300) and a name ("Eine Biene"). */
export interface NearGuestKind {
  id: string
  image: string
  label: string
}
/**
 * A blossom of the meadow: its middle (`x`, `y`) and the width of its head (`w`), both percent of the picture; `nearImage` is the close-up picture (700 x 700); `spot` is the free place in the
 * close-up on which a guest can sit (middle and width in percent of the close-up picture).
 */
export interface NearBloom {
  id: string
  x: number
  y: number
  w: number
  nearImage: string
  spot: { nx: number; ny: number; nw: number }
}
/** A guest on a blossom in one round. */
export interface NearSit {
  bloomId: string
  guestId: string
}
/** `bloomIds`: the blossoms that can be seen in this round; `hidden`: the others (they lie under the haze); `sits`: who sits where. */
export interface NearRound {
  hint: string
  bloomIds: string[]
  hidden: string[]
  sits: NearSit[]
}
export interface NearViewGame {
  background: string
  ratio?: number
  /** The soft haze that lies over the blossoms that cannot be seen yet (1500 x 1000, transparent). */
  haze: string
  /** The wreath of olive twigs: its picture (700 x 700, the inside free), its width (percent of the width of the picture) and how much of a blossom it must cover to show it close up. */
  wreath: { image: string; w: number; minCover: number }
  blooms: NearBloom[]
  guests: NearGuestKind[]
  rounds: NearRound[]
}

/** The part of the wreath that shows the close-up: the circle inside the twigs, as a share of the width of the wreath. */
export const NEAR_INNER = 0.8
/** The smallest guest in the wreath (pixels on a phone). */
export const NEAR_GUEST_PX = 36
/** The step of the arrow keys (percent of the width). */
export const NEAR_KEY_STEP = 4

export const nearBloom = (game: NearViewGame, id: string): NearBloom | undefined => game.blooms.find((b) => b.id === id)
export const nearGuestKind = (game: NearViewGame, id: string): NearGuestKind | undefined => game.guests.find((g) => g.id === id)
/** The blossoms that can be reached in a round. */
export const nearVisible = (round: NearRound): string[] => round.bloomIds.filter((id) => !round.hidden.includes(id))
/** The guest on a blossom in a round. */
export const nearSitOn = (round: NearRound, bloomId: string): NearSit | undefined => round.sits.find((s) => s.bloomId === bloomId)

/** The share of the disc of radius `rb` (the blossom) that the disc of radius `rw` (the wreath) covers, for a distance `d` of the middles (all in units). */
export function nearOverlap(rw: number, rb: number, d: number): number {
  if (rb <= 0) return 0
  if (d >= rw + rb) return 0
  if (d <= Math.abs(rw - rb)) return rb <= rw ? 1 : (rw * rw) / (rb * rb)
  const a = rw * rw * Math.acos((d * d + rw * rw - rb * rb) / (2 * d * rw))
  const b = rb * rb * Math.acos((d * d + rb * rb - rw * rw) / (2 * d * rb))
  const c = 0.5 * Math.sqrt((-d + rw + rb) * (d + rw - rb) * (d - rw + rb) * (d + rw + rb))
  return bergClamp((a + b - c) / (Math.PI * rb * rb), 0, 1)
}
/** How much of a blossom the wreath at `at` covers (0 to 1). */
export function nearCover(game: NearViewGame, at: Pt, bloom: NearBloom): number {
  const ratio = game.ratio ?? 1.5
  return nearOverlap(game.wreath.w / 2, bloom.w / 2, bergDist(at, bloom, ratio))
}
/** The blossom the wreath shows close up: of the visible blossoms the one it covers most, if that is at least `minCover`; otherwise none. */
export function nearActive(game: NearViewGame, round: NearRound, at: Pt): NearBloom | null {
  let best: { b: NearBloom; c: number } | null = null
  for (const id of nearVisible(round)) {
    const b = nearBloom(game, id)
    if (!b) continue
    const c = nearCover(game, at, b)
    if (c >= game.wreath.minCover && (!best || c > best.c)) best = { b, c }
  }
  return best ? best.b : null
}
/** A point of the picture in the close-up picture of the wreath at `centre` (percent of the close-up), and whether it lies inside the circle of the wreath. */
export function nearToClose(game: NearViewGame, centre: Pt, at: Pt): { nx: number; ny: number; inside: boolean } {
  const ratio = game.ratio ?? 1.5
  const side = game.wreath.w * NEAR_INNER
  const nx = 50 + ((at.x - centre.x) / side) * 100
  const ny = 50 + ((at.y - centre.y) / (side * ratio)) * 100
  return { nx, ny, inside: bergDist(at, centre, ratio) <= game.wreath.w / 2 }
}
/** The smallest distance in the close-up picture at which a tap meets a guest (percent of the close-up): the guest itself or a finger target of `BERG_TOUCH` pixels, the larger. */
export const nearHitRadius = (game: NearViewGame, nw: number): number => Math.max(nw * 0.6, (BERG_TOUCH / 2 / (game.wreath.w * NEAR_INNER * (BERG_PHONE_W / 100))) * 100)
/** What a tap in the wreath meets: the guest, the blossom (without the guest), nothing (outside the circle of the wreath). */
export function nearTap(game: NearViewGame, round: NearRound, centre: Pt, at: Pt): 'guest' | 'bloom' | 'out' | 'none' {
  const b = nearActive(game, round, centre)
  const c = nearToClose(game, centre, at)
  if (!c.inside) return 'out'
  if (!b) return 'none'
  const sit = nearSitOn(round, b.id)
  if (!sit) return 'bloom'
  return Math.hypot(c.nx - b.spot.nx, c.ny - b.spot.ny) <= nearHitRadius(game, b.spot.nw) ? 'guest' : 'bloom'
}
/** What "Help me" shows: the blossom with a guest that has not been found, nearest to the wreath. */
export function nearHelp(game: NearViewGame, round: NearRound, found: readonly string[], centre: Pt): NearBloom | null {
  const ratio = game.ratio ?? 1.5
  let best: { b: NearBloom; d: number } | null = null
  for (const s of round.sits) {
    if (found.includes(s.bloomId) || round.hidden.includes(s.bloomId)) continue
    const b = nearBloom(game, s.bloomId)
    if (!b) continue
    const d = bergDist(centre, b, ratio)
    if (!best || d < best.d) best = { b, d }
  }
  return best ? best.b : null
}
/** How many blossoms the wreath can show at the same time at its best place (a search over the whole picture). */
export function nearMostCovered(game: NearViewGame, round: NearRound): number {
  const ratio = game.ratio ?? 1.5
  let most = 0
  for (let x = 0; x <= 100; x += 1)
    for (let y = 0; y <= 100; y += 1 * ratio) {
      let n = 0
      for (const id of nearVisible(round)) {
        const b = nearBloom(game, id)
        if (b && nearCover(game, { x, y }, b) >= game.wreath.minCover) n++
      }
      most = Math.max(most, n)
    }
  return most
}

/** The problems of the data of `nahblick` (an empty list is good). */
export function nearViewProblems(game: NearViewGame): string[] {
  const out: string[] = []
  if (!game.background) out.push('no picture of the meadow')
  if (!game.haze) out.push('no picture of the haze')
  if (!game.wreath?.image) out.push('no picture of the wreath')
  if (!(game.wreath.w >= 20 && game.wreath.w <= 40)) out.push('the wreath is between 20 and 40 percent of the width')
  if (!(game.wreath.minCover > 0 && game.wreath.minCover <= 0.8)) out.push('the wreath must show a blossom when it covers at least half of it (minCover between 0 and 0.8)')
  if (game.blooms.length !== 7) out.push('seven blossoms are needed')
  const bids = game.blooms.map((b) => b.id)
  if (new Set(bids).size !== bids.length) out.push('two blossoms have the same id')
  for (const b of game.blooms) {
    if (!b.nearImage) out.push(`${b.id}: no close-up picture`)
    if (b.x - b.w / 2 < 0 || b.x + b.w / 2 > 100 || b.y < 0 || b.y > 100) out.push(`${b.id}: lies outside the picture`)
    if (b.w < 6) out.push(`${b.id}: too small to be seen`)
    const { nx, ny, nw } = b.spot
    if (Math.hypot(nx - 50, ny - 50) + nw / 2 > 50) out.push(`${b.id}: the place of the guest lies outside the circle of the wreath`)
    if (nw * game.wreath.w * NEAR_INNER * (BERG_PHONE_W / 100 / 100) < NEAR_GUEST_PX) out.push(`${b.id}: a guest on this blossom would be smaller than ${NEAR_GUEST_PX} pixels on a phone`)
  }
  const gids = game.guests.map((g) => g.id)
  if (new Set(gids).size !== gids.length || game.guests.length < 4) out.push('at least four guests with different ids are needed')
  for (const g of game.guests) if (!g.image || !g.label) out.push(`${g.id}: needs a picture and a label`)
  if (game.rounds.length !== 2) out.push('there must be two rounds')
  game.rounds.forEach((r, i) => {
    const n = i + 1
    if (!r.hint) out.push(`round ${n} has no hint`)
    for (const id of r.bloomIds) if (!bids.includes(id)) out.push(`round ${n}: ${id} is no blossom`)
    for (const id of r.hidden) if (!r.bloomIds.includes(id)) out.push(`round ${n}: ${id} lies under the haze but is not in the round`)
    const want = i === 0 ? 2 : 4
    if (r.sits.length !== want) out.push(`round ${n} needs exactly ${want} guests`)
    if (new Set(r.sits.map((s) => s.bloomId)).size !== r.sits.length) out.push(`round ${n}: two guests sit on one blossom`)
    if (new Set(r.sits.map((s) => s.guestId)).size !== r.sits.length) out.push(`round ${n}: one kind of guest twice`)
    for (const s of r.sits) {
      if (!nearGuestKind(game, s.guestId)) out.push(`round ${n}: ${s.guestId} is no guest`)
      if (!nearVisible(r).includes(s.bloomId)) out.push(`round ${n}: the guest on ${s.bloomId} cannot be reached`)
    }
    if (i === 0 && nearVisible(r).length !== 3) out.push('round 1 shows three blossoms')
    if (i === 1 && nearVisible(r).length !== 7) out.push('round 2 shows all seven blossoms')
    if (nearVisible(r).length - r.sits.length < 1) out.push(`round ${n}: at least one blossom must have no guest`)
    if (i === 1 && nearVisible(r).length - r.sits.length !== 3) out.push('round 2: three blossoms without a guest')
    // the haze lies on the right of all the blossoms that can be seen
    if (r.hidden.length) {
      const maxVisible = Math.max(...nearVisible(r).map((id) => nearBloom(game, id)?.x ?? 0))
      const minHidden = Math.min(...r.hidden.map((id) => nearBloom(game, id)?.x ?? 100))
      if (minHidden - maxVisible < game.wreath.w / 2) out.push(`round ${n}: the hidden blossoms must lie well to the right of the others`)
    }
    // the wreath shows at most two blossoms at once
    if (nearMostCovered(game, r) > 2) out.push(`round ${n}: the wreath covers more than two blossoms at once`)
    // every blossom can be shown, every guest found
    for (const id of nearVisible(r)) {
      const b = nearBloom(game, id)
      if (b && nearActive(game, r, { x: b.x, y: b.y })?.id !== id) out.push(`round ${n}: ${id} cannot be shown close up`)
    }
    // the help names a guest at every state
    const found: string[] = []
    for (const s of r.sits) {
      const h = nearHelp(game, r, found, { x: 50, y: 50 })
      if (!h) out.push(`round ${n}: the help finds no guest`)
      found.push(h?.id ?? s.bloomId)
    }
  })
  return out
}
