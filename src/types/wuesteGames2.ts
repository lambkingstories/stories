/**
 * The types of seven new games of "The People in the Desert" (`wueste`): water jugs (Exodus 17), "Enough!" (Exodus 36), quails in the wind (Numbers 11), Aaron's staff (Numbers 17),
 * the bronze sign on the pole (Numbers 21), the donkey (Numbers 22) and Joshua's commission (Numbers 27). Their words (hints, messages, labels) lie in the data, so the English overlay
 * of the journey (`en/wueste.en.ts`) translates them like all other texts. Places are percent of the picture (4:3), `y` of a thing is its bottom edge, `x` its middle, `w` its width.
 */

/** A person (a picture, a name for the screen reader and its place). */
export interface WuestePerson {
  id: string
  image: string
  label: string
  x: number
  y: number
  w: number
}

// ------------------------------------------------------------------ Water jugs (Exodus 17,6)
export interface JugsRound {
  hint: string
  /** Which people (numbers into `people`) are thirsty in this round. */
  people: number[]
}
export interface JugsTexts {
  field: string
  /** A person was tapped with an empty jug. */
  empty: string
  /** The jug is full already, it must go to a person. */
  full: string
  /** The jug was filled at the rock. */
  filled: string
  /** A person drank. */
  served: string
  /** "{name}: thirsty" / "{name}: has water" (screen reader). */
  thirsty: string
  drank: string
  jug: string
  spring: string
  count: string
  done: string
}
/** The game "Water for everybody" (Exodus 17,6): the child fills a jug at the rock and brings it to a thirsty person, one after the other. */
export interface JugsGame {
  /** The cliff with the cleft and the camp (4:3). */
  background: string
  /** The water pouring from the rock: its picture, its width and where its top lies (x middle, y top). */
  spring: { image: string; x: number; y: number; w: number; /** the tap place (percent rectangle). */ zone: { x1: number; y1: number; x2: number; y2: number } }
  jug: { empty: string; full: string; w: number; /** where the jug waits (middle of its bottom edge). */ x: number; y: number }
  people: WuestePerson[]
  rounds: JugsRound[]
  texts: JugsTexts
}

// ------------------------------------------------------------------ Enough! (Exodus 36,5-7)
export interface EnoughRound {
  hint: string
  /** How many gifts the work needs (the mark on the heap). */
  need: number
  /** Milliseconds between two people who bring a gift. */
  every: number
  /** How many gifts more than `need` may come before Moses calls "enough" himself (that counts as a mistake). */
  over: number
}
export interface EnoughTexts {
  field: string
  /** Tapped too early. */
  early: string
  /** Called at the right time. */
  ok: string
  /** Too many gifts came, Moses called by himself. */
  late: string
  count: string
  moses: string
  done: string
}
/** The game "Enough!" (Exodus 36,5-7): the people bring more and more gifts for the tent; the child taps Moses to call "Enough!" when the heap has reached the mark. */
export interface EnoughGame {
  background: string
  gifts: { id: string; image: string; w: number }[]
  /** The people who walk in (side view), their width and the line they walk along: from the left edge to the heap. */
  walkers: { id: string; image: string; w: number }[]
  /** The walkers' ground line (y of their feet) and the middle of the heap's base. */
  path: { y: number; toX: number }
  /** The heap: its middle (x) and base line (y) and the width of the base. */
  heap: { x: number; y: number; w: number }
  mose: { image: string; x: number; y: number; w: number }
  rounds: EnoughRound[]
  texts: EnoughTexts
}

// ------------------------------------------------------------------ Quails (Numbers 11,31-32)
export interface QuailsRound {
  hint: string
  /** How many quails come down in this round. */
  total: number
  /** Milliseconds between two quails coming down. */
  every: number
  /** How long a quail stays on the ground before it flies on (ms). */
  stay: number
}
export interface QuailsTexts {
  field: string
  caught: string
  gone: string
  count: string
  basket: string
  quail: string
  done: string
}
/** The game "The wind brings quails" (Numbers 11,31): quails come down around the camp, the child tips each into the basket before it flies on. */
export interface QuailsGame {
  background: string
  quails: { id: string; image: string; w: number }[]
  basket: { image: string; x: number; y: number; w: number }
  /** The ground where quails land: from y1 to y2 (percent of the height) and from x1 to x2 (percent of the width). */
  ground: { x1: number; x2: number; y1: number; y2: number }
  rounds: QuailsRound[]
  texts: QuailsTexts
}

// ------------------------------------------------------------------ Aaron's staff (Numbers 17)
export interface StaffsRound {
  hint: string
}
export interface StaffsTexts {
  field: string
  /** "Staff {n} of {total}" (screen reader). */
  staff: string
  /** The staff of Aaron (label for the screen reader). */
  aaron: string
  wrong: string
  night: string
  found: string
  stage: string
  count: string
  done: string
}
/** The game "Twelve staffs for the night" (Numbers 17,16-23): twelve staffs are laid down before God; the next morning the child finds the one that has blossomed and sees what grew. */
export interface StaffsGame {
  /** The inside of the tent (4:3). */
  background: string
  /** The dry staffs (several pictures, used in turn) and the three stages of Aaron's staff (shoots, blossoms, almonds). */
  dry: string[]
  bloom: string[]
  /** The width of a staff (percent of the picture) and its height (the pictures are the same ratio). */
  w: number
  h: number
  /** The width of the box of the blossoming staff (its leaves and almonds are wider than a dry staff; the same height). */
  bloomW: number
  /** Where the staffs lie in a pile at the left, and the row where they stand (y of the foot, x of the first and the last). */
  pile: { x: number; y: number }
  row: { y: number; x1: number; x2: number }
  /** Which place of the twelve is Aaron's staff (0 to 11). */
  aaron: number
  /** The big staff at the end (middle x, foot y, width, height). */
  big: { x: number; y: number; w: number; h: number }
  rounds: StaffsRound[]
  texts: StaffsTexts
}

// ------------------------------------------------------------------ The bronze sign (Numbers 21,8-9)
export interface SerpentTexts {
  field: string
  pole: string
  /** "{name}: weak" / "{name}: looks up" (screen reader). */
  weak: string
  well: string
  /** The pole is not straight yet. */
  lean: string
  stands: string
  count: string
  done: string
}
export interface SerpentRound {
  hint: string
}
/** The game "Raise the sign" (Numbers 21,8-9): the child lifts the pole with the bronze sign until it stands, then the weak people look up at it, one after the other. */
export interface SerpentGame {
  background: string
  /** The pole (picture, width, where its foot stands, and its ratio height to width). */
  pole: { image: string; x: number; y: number; w: number; ratio: number }
  /** The six people: weak and well (the same order and place). */
  people: { id: string; label: string; weak: string; well: string; x: number; y: number; w: number }[]
  rounds: SerpentRound[]
  texts: SerpentTexts
}

// ------------------------------------------------------------------ The donkey (Numbers 22,23-27)
export interface DonkeyStep {
  hint: string
  /** The place (4:3) of this step and where the donkey stands, where the light stands, and where the tap is right. */
  background: string
  donkey: { x: number; y: number; w: number }
  light: { x: number; y: number; w: number }
  zone: { x1: number; y1: number; x2: number; y2: number }
  /** The name of the right place for the screen reader ("the field", "the wall", "the donkey"). */
  label: string
  /** Where the donkey goes after the right tap, turned by `rot` degrees and moved down by `drop` percent of its width. */
  goTo: { x: number; y: number; rot: number }
  /** What is said after the right tap. */
  ok: string
}
export interface DonkeyTexts {
  field: string
  donkey: string
  light: string
  wrong: string
  eyes: string
  count: string
  done: string
}
/** The game "Follow the donkey" (Numbers 22,23-27): the donkey sees the light on the way that Balaam does not see; three times the child shows where she turns. */
export interface DonkeyGame {
  donkey: string
  light: string
  steps: DonkeyStep[]
  texts: DonkeyTexts
}

// ------------------------------------------------------------------ Joshua's commission (Numbers 27,18-23)
export interface CommissionRound {
  hint: string
}
export interface CommissionTexts {
  field: string
  joshua: string
  spot: string
  wrong: string
  placed: string
  hold: string
  laid: string
  count: string
  done: string
}
/** The game "Joshua is set apart" (Numbers 27,18-23): the child leads Joshua to the place before the priest Eleazar and the whole community, then Moses lays his hands on him (hold the finger on Joshua). */
export interface CommissionGame {
  background: string
  mose: { image: string; blessing: string; x: number; y: number; w: number }
  eleasar: { image: string; x: number; y: number; w: number }
  community: { image: string; x: number; y: number; w: number }
  joshua: { image: string; w: number; /** where he waits and where he must stand: middle of his bottom edge. */ start: { x: number; y: number }; spot: { x: number; y: number } }
  /** How near (percent of the picture width) he must be to the spot. */
  radius: number
  /** How long the finger must lie on Joshua in the second round (ms). */
  holdMs: number
  rounds: CommissionRound[]
  texts: CommissionTexts
}
