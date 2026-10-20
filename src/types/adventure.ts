/**
 * Adventure ("Abenteuer"): a journey through a Bible story, told in stages. Every stage has a short text, one task (a game, a
 * coloring page or a quiz) that earns up to three stars, and one to three questions. At the end of a journey comes an
 * exam, and from all the stars and the exam a cup (bronze, silver, gold) and a coloring page as a present.
 */

/** The kinds of tasks. `quiz` means the questions of the stage are the task. */
export type TaskKind = 'quiz' | 'zaehlen' | 'ausmalen' | 'puzzle' | 'weg' | 'ernten' | 'memory' | 'sortieren' | 'wimmelbild' | 'teilen' | 'bauen' | 'punkte' | 'steuern' | 'reihenfolge' | 'giessen' | 'lichter' | 'lueckenvers' | 'echo' | 'kanaele' | 'spiegeln' | 'saeen' | 'hueten' | 'fehlt' | 'wischen' | 'kette' | 'stapeln' | 'spur' | 'waage' | 'sternbild' | 'schieben' | 'kurbel' | 'halten' | 'jahre' | 'fangen' | 'schaetzen' | 'bund' | 'staffel' | 'kreis' | 'voegel' | 'ringe' | 'silber' | 'hinweise' | 'packen' | 'verstecken' | 'abseilen' | 'schritt' | 'backen' | 'still' | 'hoehle' | 'worfeln' | 'wort' | 'tau' | 'weiche' | 'schleichen' | 'zeichen'

export interface AdventureQuestion {
  q: string
  options: string[]
  /** Index of the right option. */
  answer: number
}

/** The puzzle: one painted picture, cut into `cols` x `rows` pieces. */
export interface PuzzleGame {
  image: string
  cols: number
  rows: number
}

/** The way game: at every fork the child taps the way that leads to the goal. The walker faces right (it is turned for the left). */
export interface WayScene {
  image: string
  /** Which way leads to the goal. */
  goal: 'left' | 'right' | 'middle'
  /** How many ways the fork has (2 by default; with 3 there is a middle way, too). */
  paths?: 2 | 3
}
export interface WayGame {
  scenes: WayScene[]
  walker: string
}

/** The harvest: tap the ripe things in the field, not the stones and thorns. */
export interface HarvestGame {
  field: string
  basket: string
  fruits: string[]
  weeds: string[]
  /** How many ripe things lie in the field (the pictures are used one after the other). */
  count: number
}

/** The memory: two equal cards per picture. */
export interface MemoryPair {
  /** The picture of the first card (and of the second one, when `imageB` is not given). */
  image: string
  /** A second, different picture: the two cards of the pair are not alike (male and female). */
  imageB?: string
  /** What the two cards are called (for screen readers when they are turned up). */
  labels?: [string, string]
  /** What the picture is in the story, shown when the pair is found. */
  text: string
}
export interface MemoryGame {
  back: string
  pairs: MemoryPair[]
}

/** The sorting game: sacks go into the storehouse of their color. */
export interface SortBin {
  id: string
  house: string
  sack: string
}
/** One round of the sorting game; the rounds get harder: a cue is taken away. */
export interface SortRound {
  /** Sacks per storehouse in this round. */
  perBin: number
  /** The sacks are shown without their color: only the shape on them is left. */
  graySacks?: boolean
  /** The storehouses are shown without their color. */
  grayHouses?: boolean
  /** What the child is told in this round. */
  hint: string
}

export interface SortGame {
  bins: SortBin[]
  /** Sacks per storehouse (when there are no rounds). */
  perBin: number
  /** Rounds one after the other, from easy to hard. Without rounds the game is one easy round. */
  rounds?: SortRound[]
}

/** The hidden-picture game: things stand on a painted scene, some of them half behind something in front. */
export interface FindThing {
  image: string
  /** Middle of the bottom edge and width, as a percentage of the scene. */
  x: number
  y: number
  w: number
}
export interface FindGame {
  /** What the things are called (read out for screen readers), one per find; "Brother" when left out. */
  labels?: string[]
  /** The line at the end of the game; "You found all eleven brothers!" when left out. */
  doneText?: string
  scene: string
  finds: FindThing[]
  covers: FindThing[]
}

/** A group of things in the counting game. */
export interface CountGroup {
  image: string
  imageOff?: string
  count: number
}

/** The sharing game: baskets are brought to a family and to groups of animals until everybody has enough. */
export interface ShareReceiver {
  id: string
  image: string
  /** What the receiver is called (read out for screen readers). */
  label: string
  /** The kinds of basket this receiver takes (`ShareBasket.id`). */
  accepts: string[]
  /** What is said when the wrong food is given ("Die Taube frisst kein Heu."), by kind of basket; `*` is for all the other kinds. */
  rejects?: Record<string, string>
  /** An animal takes just one basket of food; a second one springs back ("enough already"). The family takes several. */
  single?: boolean
}
export interface ShareBasket {
  id: string
  image: string
  label: string
  /** A distractor: nobody takes it. Whoever gets it is wrong (red cross); it stays in the tray and does not hold up the end of the round. */
  nobody?: boolean
}
export interface ShareRound {
  /** What the child is told in this round. */
  hint: string
  /** Who takes part in this round (ids of `ShareGame.receivers`); without it everybody (a later round has more animals). */
  receivers?: string[]
  /** The kinds of basket in the tray, one entry per basket. */
  baskets: string[]
  /** Place marks: how many baskets each receiver gets (by receiver id). Without marks the receivers take what fits them. */
  marks?: Record<string, number>
  /** A basket only goes to a receiver that takes its kind (otherwise any basket goes anywhere, up to the marks). */
  checkContent?: boolean
  /** The child shares freely and then taps "Done"; nobody must be left with nothing. */
  free?: boolean
}
export interface ShareGame {
  /** The picture behind the game (the barn). */
  scene: string
  /** The empty basket: the faded place mark. */
  empty: string
  receivers: ShareReceiver[]
  baskets: ShareBasket[]
  rounds: ShareRound[]
}

/** A part of the building game. The place is a box (percentage of the plan); a piece may also be a polygon cut out of the shared picture. */
export interface BuildPiece {
  id: string
  label: string
  /** The picture of the part (its own sprite). */
  image: string
  /** The place in the plan: top left corner, width and height, as a percentage of the plan. */
  x: number
  y: number
  w: number
  h: number
  /** For a piece cut out of one picture (the altar): the corners of its outline, as a percentage of the picture; not used by the ark. */
  polygon?: [number, number][]
  /** For the altar: the course (layer) of stones the piece lies in; not used by the ark. */
  layer?: number
}
export interface BuildRound {
  hint: string
  /** The plan shows as a blue shadow: the child sees where the parts go. */
  outline?: boolean
  /** The round is the pitch: the child smears pitch along the seams in the wooden wall with a finger. */
  pitch?: boolean
}
/** A seam in the wall that the pitch fills: a line of points [x, y] as a percentage of the wall picture, from left to right (straight, gently curved or zigzag). */
export interface BuildSeam {
  points: [number, number][]
}
export interface BuildGame {
  /** The plan of the whole ark as a blue shadow (the pieces lie on it); the altar has none (its shadow is the outline of the stone). */
  shadow?: string
  /** Width divided by height of the plan. */
  aspect: number
  /** The ark: every part is its own sprite. The altar: ONE picture that is cut into stones along the `polygon` of every piece. */
  image?: string
  /** The altar: the picture behind the altar (the plain ground the altar stands on). */
  background?: string
  pieces: BuildPiece[]
  /** The parts have to be put in a fixed order (the order of `pieces`, the altar from the bottom up); the ark is built in any order. */
  ordered?: boolean
  /** The parts are turned by a tap (a quarter turn) before they are set (the altar); the ark has no turning. */
  rotate?: boolean
  rounds: BuildRound[]
  /** The wall with the seams and the pot of pitch (for the round with `pitch`). */
  pitch?: {
    wall: string
    pot: string
    seams: BuildSeam[]
    /** How far the finger may stray from the line, as a percentage of the width of the wall (default 5.5). */
    tolerance?: number
    /** The seams are not in the picture (yet): they are shown as a dark groove. */
    guide?: boolean
  }
}

/** Connect the dots: numbered dots along a line in a dimmed picture; every right dot shows more of the picture in colour. */
export interface DotsGame {
  /** The picture (3:4); it is shown dimmed first and in colour as the dots are found. */
  image: string
  /** The dots in the order they are tapped, from left to right: [x, y] as a percentage of the picture. */
  points: [number, number][]
}

/** A thing the dove can touch in the steering game: a soft light, or the olive leaf. */
export interface FlyTarget {
  kind: 'light' | 'leaf'
  /** The middle, as a percentage of the width (x) and of the height (y) of the sky. */
  x: number
  y: number
}
export interface FlyRound {
  hint: string
  /** The sky of this round (3:4). */
  background: string
  targets: FlyTarget[]
  /** The dove must have the olive leaf to land in the ark (round 2). */
  needLeaf?: boolean
}
/** The steering game: the dove follows the finger; it flies through lights, takes the leaf, and lands in the ark window. */
export interface FlyGame {
  /** The dove with its wings up and down (it faces right). */
  dove: [string, string]
  /** The olive leaf the dove carries. */
  leaf: string
  /** The ark window where the dove starts and lands (a picture) and where it is, as a percentage of the sky. */
  ark: string
  home: { x: number; y: number }
  rounds: FlyRound[]
}

/** A picture card of the story-ordering game (one scene of the story). */
export interface OrderCard {
  id: string
  /** The picture of the card (4:3, a path below `public/`). */
  image: string
  /** What the card shows, in a few words (read out for screen readers). */
  label: string
}
export interface OrderRound {
  hint: string
  /** The places carry dots (one, two, three ...) in this round; without them the child remembers the story. */
  numbered: boolean
  /** The cards of this round (ids of `OrderGame.cards`) in the RIGHT order, from the first place to the last. */
  cards: string[]
}
/** The ordering game: the cards of a story lie mixed and are laid in the order of the story (at most two rounds). */
export interface OrderGame {
  cards: OrderCard[]
  rounds: OrderRound[]
}

/** A plant of the watering game: a small one that grows when it has had enough water. */
export interface WaterPlant {
  id: string
  /** The plant before it is watered, and after it has had all its jugs (paths below `public/`). */
  small: string
  grown: string
  /** What it is, in a few words (read out for screen readers). */
  label: string
  /** The middle of its foot and its width, as a percentage of the garden picture. */
  x: number
  y: number
  w: number
  /** How many jugs it needs (1, or 2 for a thirsty tree). */
  need: 1 | 2
}
export interface WaterRound {
  hint: string
  /** The plants of this round (ids of `WaterGame.plants`). */
  plants: string[]
}
/** The watering game: fill the jug at the stream and water the plants (at most two rounds). */
export interface WaterGame {
  /** The garden (3:4) with the stream. */
  scene: string
  /** Where the stream is, as a percentage of the garden picture (a tap or a drop there fills the jug). */
  river: { x: number; y: number; w: number; h: number }
  jugEmpty: string
  jugFull: string
  plants: WaterPlant[]
  rounds: WaterRound[]
}

/** A light in the dark picture of the light-collecting game: the middle and the width, as a percentage of the picture. */
export interface LightSpot {
  x: number
  y: number
  w: number
}
export interface LightRound {
  hint: string
  spots: LightSpot[]
  /** How many lights glimmer at the same time (1: one after the other). */
  together: number
}
/** The light-collecting game: the picture is dimmed, the lights are tapped and it gets bright again (at most two rounds). The glimmer is made by the app. */
export interface LightGame {
  /** The bright picture (3:4); the code dims it and brightens it again. */
  scene: string
  rounds: LightRound[]
}

export interface VerseRound {
  hint: string
  /** The pieces of the sentence around the gaps: one more piece than there are gaps. */
  parts: string[]
  /** The words on the leaves (the right ones and the wrong ones); the English file keeps the same order, so that `answers` fits both. */
  words: string[]
  /** For each gap, from left to right: the index of the right word in `words`. */
  answers: number[]
}
/** The verse game: leaves with words are dragged into the gaps of a sentence of the story (at most two rounds). */
export interface VerseGame {
  /** The picture behind the board (the stage picture, 3:2 or 3:4), the wooden board under the sentence, and the leaf that carries a word. */
  background: string
  board: string
  leaf: string
  rounds: VerseRound[]
}

/** A sound blossom of the call-and-answer game and the pitch of its tone (the playback rate of the marimba tone). The shining is made by the app. */
export interface EchoNote {
  id: string
  image: string
  rate: number
}
export interface EchoRound {
  hint: string
  /** The calls of this round: each is a series of blossoms (indexes in `EchoGame.notes`) in the order they ring. */
  calls: number[][]
}
/** The call-and-answer game: a call rings and shines, the child plays it back (four blossoms, at most two rounds). */
export interface EchoGame {
  /** The picture behind the blossoms (the stage picture). */
  background: string
  notes: EchoNote[]
  rounds: EchoRound[]
}

/** A tile of the channel game: what it is, how it lies at the start (quarter turns, clockwise), and for a plant its id. */
export type ChannelKind = 'straight' | 'corner' | 'tee' | 'empty' | 'source' | 'goal'
export interface ChannelTile {
  kind: ChannelKind
  /** The quarter turns at the start (0 to 3). A source opens to the right and a goal to the left when `rot` is 0. */
  rot: number
  /** For a goal: the id of its plant in `ChannelGame.goals`. */
  goal?: string
}
export interface ChannelGoal {
  /** What the plant is called (screen readers), and its picture before and after the water has reached it. */
  label: string
  wilted: string
  bloom: string
}
export interface ChannelRound {
  hint: string
  /** The tiles row by row; the stream (a `source`) sits at the left edge. */
  grid: ChannelTile[][]
}
/** The channel game: pieces of the garden's water channels are turned until the water reaches the plants (at most two rounds). */
export interface ChannelGame {
  /**
   * The picture of every kind of tile (seen from above, 200 x 200): a straight piece runs left to right, a curve from left to down, a fork has
   * its stem to the bottom (left, right, down), the source opens to the right; a goal sits on the ground tile. The wet pictures exist for
   * the pieces that carry water.
   */
  tiles: Record<ChannelKind, string>
  wet: Record<'straight' | 'corner' | 'tee' | 'source', string>
  goals: Record<string, ChannelGoal>
  rounds: ChannelRound[]
}

/** A flower stone of the mirror game: its picture (160 x 160) and what it is, in a few words (screen readers). */
export interface MirrorStone {
  id: string
  image: string
  label: string
}
export interface MirrorRound {
  hint: string
  /** How many columns and rows each bank has (the left pattern and the right fields are the same size). */
  cols: number
  rows: number
  /** The pattern on the left bank: the ids of the stones, row by row. The right bank is its mirror image: right[r][c] = left[r][cols - 1 - c]. */
  left: string[][]
}
/** The mirror game: the left bank has a pattern, the child completes the right bank as its mirror image (at most two rounds). */
export interface MirrorGame {
  /** The picture behind the board (the stage picture). */
  background: string
  /** The picture of an empty field. */
  empty: string
  stones: MirrorStone[]
  rounds: MirrorRound[]
}

/** A furrow of the sowing game: its middle and size, as a percentage of the field picture (a seed that lands in it, with some room to spare, sows it). */
export interface SowFurrow {
  id: string
  x: number
  y: number
  w: number
  h: number
}
export interface SowRound {
  hint: string
  /** The furrows of this round (ids of `SowGame.furrows`). */
  furrows: string[]
  /** The wind from -1 (to the left) to 1 (to the right); 0 is calm. */
  wind: number
}
/** The sowing game: the seed bag is pulled back and let go, the seed flies in an arc into a furrow (at most two rounds). */
export interface SowGame {
  /** The field (3:4), the seed bag, one seed, the sprout in two stages (young, grown), and the little flag that shows the wind (a path below `public/`). */
  field: string
  bag: string
  seed: string
  sprout: [string, string]
  vane: string
  furrows: SowFurrow[]
  rounds: SowRound[]
}

/** An animal of the herding game: its picture (looking right), what it is (screen readers) and how wide it is (percent of the meadow). */
export interface HerdAnimal {
  id: string
  image: string
  label: string
  w: number
}
export interface HerdRound {
  hint: string
  /** The animal the child leads with a finger, and the ones that follow it in a row on its trail. */
  leader: HerdAnimal
  followers: HerdAnimal[]
  /** Where the leader stands at the start, the resting place (percent of the meadow; r is a share of its width) and, if there is one, a pond in the way. */
  start: { x: number; y: number }
  rest: { x: number; y: number; r: number }
  obstacle?: { x: number; y: number; r: number }
}
/** The herding game: the finger leads one animal to the resting place and the herd follows in a row (at most two rounds, no mistakes). */
export interface HerdGame {
  /** The meadow (3:4) with the two resting places and the pond. */
  scene: string
  rounds: HerdRound[]
}

/** A person of the caravan in the memory game "Who is missing?": a picture (200 x 320, standing) and a few words for screen readers. */
export interface MissingPerson {
  id: string
  image: string
  label: string
  /** How big the person stands compared with the others (1 when left out; a child is smaller). */
  scale?: number
}
/** One task: the people of the row (ids, in the order of the places) and who is gone when the dust cloud has passed (one or two of them). */
export interface MissingTask {
  row: string[]
  gone: string[]
}
export interface MissingRound {
  hint: string
  /** Three tasks per round. */
  tasks: MissingTask[]
}
/** "Who is missing from the caravan?": look at the row, a dust cloud passes, somebody is gone, and the child picks who it was (at most two rounds). */
export interface MissingGame {
  /** The picture behind the row (the stage picture) and the dust cloud (900 x 300, transparent). */
  background: string
  cloud: string
  people: MissingPerson[]
  /** How wide a person stands, in percent of the picture (11 when left out). */
  personWidth?: number
  /** The places of the row, as [x, y] (the feet of a person) in percent of the picture; a row uses the first places it needs. */
  slots: [number, number][]
  rounds: MissingRound[]
}

/** A part of the picture to wipe free, as a percentage of the picture. */
export interface WipeRound {
  hint: string
  region: { x: number; y: number; w: number; h: number }
}
/** "Wipe away the fog": soft evening fog lies over the picture, the finger wipes it away; the child has to free a part of the picture (at most two rounds). */
export interface WipeGame {
  /** The picture below (the stage picture) and the fog over it (a soft picture with an alpha channel). */
  background: string
  mist: string
  rounds: WipeRound[]
}

/** A round of the brick chain: how many people stand in the row, what comes out of the oven one after the other, and where everything is (percent of the picture). */
export interface ChainRound {
  hint: string
  people: number
  items: ('brick' | 'pitch')[]
  /** The places of the people, from the oven to the stack (`slots.length` equals `people`), the oven's mouth and the middle of the stack. */
  slots: [number, number][]
  source: [number, number]
  sink: [number, number]
}
/** "The brick chain": the builders pass bricks and pots of pitch from hand to hand from the oven to the stack (at most two rounds). */
export interface ChainGame {
  background: string
  worker: string
  brick: string
  pitch: string
  rounds: ChainRound[]
}

/** A round of the tower-stacking game. */
export interface StackRound {
  hint: string
  /** How many steps are put on the tower in this round. */
  layers: number
  /** The width of the step below the first block, in percent of the picture width. */
  baseWidth: number
  /** How much narrower every step is than the one below (0 to 1). */
  shrink: number
  /** How fast the block glides along the beam, in picture widths per second (0.15 to 0.35). */
  speed: number
}
/** "Stack the stepped tower": a block glides to and fro on a beam, a tap lowers it onto the step below; the tower never falls (at most two rounds). */
export interface StackGame {
  background: string
  block: string
  beam: string
  rounds: StackRound[]
}

/** A road of the tracing game: its line (percent of the picture), half its width, and where it leads (`mountains`, `river`, `palms`, `hills`). */
export interface TracePath {
  id: string
  points: [number, number][]
  r: number
  goal: string
}
export interface TraceRound {
  hint: string
  paths: TracePath[]
}
/** "Trace the roads": roads lead from the unfinished tower into the plain; the child follows each with a finger and a little walker goes along (at most two rounds). */
export interface TraceGame {
  scene: string
  walker: string
  rounds: TraceRound[]
}

/** A pack of the camel game: its picture, its weight (1 light, 2 middle, 3 heavy; the app shows it as dots on the pack) and a few words for screen readers. */
export interface BalancePack {
  id: string
  image: string
  weight: 1 | 2 | 3
  label: string
}
/** A camel and the packs it has to carry (ids of `BalanceGame.packs`): they can be spread over the two baskets so that both sides weigh the same. */
export interface BalanceCamel {
  packs: string[]
}
export interface BalanceRound {
  hint: string
  camels: BalanceCamel[]
}
/**
 * The camel game "Load the camels": packs are put into the two baskets of a camel; it leans to the heavier side and stands straight when both sides weigh the same
 * (at most two rounds). `baskets` are the places where the baskets hang on the camel (percent of the picture, the middle of the basket's top edge).
 */
export interface BalanceGame {
  /** The picture behind the camel (the stage picture, 3:2). */
  background: string
  camel: string
  basket: string
  packs: BalancePack[]
  /** Where the left and the right basket hang (percent of the picture). */
  baskets?: [[number, number], [number, number]]
  rounds: BalanceRound[]
}

/** A round of the slide puzzle: the number of columns and rows of the tiles, how many moves the mixing makes from the finished picture, and the seed of the mixing (fixed, so that a round is the same every time and can be tested). */
export interface SlideRound {
  hint: string
  cols: number
  rows: number
  moves: number
  seed: number
}
/** The slide puzzle "Stairway": the picture is cut into tiles, one is missing, and a tile next to the gap is slid into it until the picture is whole again (at most two rounds). The tiles are cut by the app. */
export interface SlideGame {
  /** The picture (3:2, the stage picture). */
  image: string
  rounds: SlideRound[]
}

/** A round of the crank game: how many buckets are drawn from the well. */
export interface CrankRound {
  hint: string
  buckets: number
}
/**
 * The crank game: the finger turns the crank and the bucket rises out of the well; at the top it pours itself into the trough. Positions are percent of the picture
 * (`crankAt` the middle of the crank, `bucketAt` the x of the rope and the y of the bucket when it is up and when it is down, `troughAt` x, y and the width of the trough).
 */
export interface CrankGame {
  background: string
  crank: string
  bucket: string
  troughEmpty: string
  troughFull: string
  crankAt: [number, number]
  bucketAt: [number, number, number]
  troughAt: [number, number, number]
  rounds: CrankRound[]
}

/** A round of the holding game: how many seconds the light has to be held in all, and the way the light wanders (percent of the picture); without a way it stands still. */
export interface HoldRound {
  hint: string
  seconds: number
  path?: [number, number][]
}
/** The holding game: a soft light lies on the ground; as long as the finger holds it, the morning comes (nothing is lost when the finger lets go). `start` is where the light lies (percent of the picture). */
export interface HoldGame {
  background: string
  spark: string
  start: [number, number]
  rounds: HoldRound[]
}

/** A sign of a season in the cycle game: its picture (160 x 160) and a few words for screen readers. */
export interface CycleToken {
  id: string
  image: string
  label: string
}
/** A round of the cycle game: the signs in their order (`cycle`, repeated again and again), how many places the row has, and which places are empty (indices). */
export interface CycleRound {
  hint: string
  cycle: string[]
  length: number
  gaps: number[]
}
/** The cycle game "Years go by": a row of places in which the signs of the seasons come again and again; the gaps are filled with the right sign (at most two rounds). */
export interface CycleGame {
  background: string
  tokens: CycleToken[]
  rounds: CycleRound[]
}

/** A child in the catch game: its picture (120 x 180) and how wide it stands (percent of the picture, 6 to 8). */
export interface CatchKid {
  id: string
  image: string
  w: number
}
/** A round of the catch game: which children (ids, a child may be used several times) walk about, and how fast (picture widths a second, 0.04 to 0.09). */
export interface CatchRound {
  hint: string
  kids: string[]
  speed: number
}
/**
 * The catch game "Call the children to the tent": children walk about on the meadow, a tap sends one to the tent (nothing runs out, nobody is lost).
 * `tent` is the place of the tent and `field` the meadow, in percent of the picture.
 */
export interface CatchGame {
  background: string
  kids: CatchKid[]
  tent: [number, number]
  field: { x: number; y: number; w: number; h: number }
  rounds: CatchRound[]
}

/** An animal of the guessing game: its picture and how wide it stands (percent of the picture). */
export interface GuessAnimal {
  id: string
  image: string
  w: number
}
/**
 * A task of the guessing game: the herd `a` (and, to compare, a second herd `b`), or the three ranges to choose from (`ranges`, the right one is the range that
 * contains `a.count`); `seed` places the animals on the meadow (always the same).
 */
export interface GuessTask {
  a: { animal: string; count: number }
  b?: { animal: string; count: number }
  ranges?: [number, number][]
  seed: number
}
export interface GuessRound {
  hint: string
  mode: 'compare' | 'range'
  tasks: GuessTask[]
}
/** The guessing game "Which herd is bigger": herds too big to count are compared and estimated (at most two rounds). `region` is the meadow in percent of the picture. */
export interface GuessGame {
  background: string
  animals: GuessAnimal[]
  region: { x: number; y: number; w: number; h: number }
  rounds: GuessRound[]
}

/** A round of the cairn game: how many stones are brought to the heap and how many steps each side has to go to the middle. */
export interface CairnRound {
  hint: string
  stones: number
  steps: number
}
/**
 * The cairn game "A heap for two": two big stones are pushed to the middle together, a step on each side in turn (two fingers, or one finger left and right in turn);
 * when both have come equally far they meet and lie on the heap. Positions in percent of the picture.
 */
export interface CairnGame {
  background: string
  stoneLeft: string
  stoneRight: string
  stoneSmall: string
  centre: [number, number]
  leftStart: [number, number]
  rightStart: [number, number]
  rounds: CairnRound[]
}

/** A herd of the relay game: its picture (260 x 160) and how wide it is (percent of the picture). */
export interface RelayHerd {
  id: string
  image: string
  w: number
}
/** A round of the relay game: the herds in the order they wait (ids), the room that has to stay between two herds (percent of the length of the road), and how fast a herd goes (road lengths a second). */
export interface RelayRound {
  hint: string
  herds: string[]
  minGap: number
  speed: number
}
/** The relay game "Leave room between the herds": herds are sent along a road one after the other; the one behind keeps its distance. `road` is a line in percent of the picture. */
export interface RelayGame {
  background: string
  herds: RelayHerd[]
  road: [number, number][]
  rounds: RelayRound[]
}

/** A round of the ring game: how many sons are put round the altar and how far (degrees) the gaps between neighbours may differ from the ideal one. */
export interface RingRound {
  hint: string
  count: number
  tolerance: number
}
/** The ring game "Twelve sons": figures are put on a ring round the altar so that all gaps are the same. `centre` and `radius` are in percent of the picture (the radius of the width). */
export interface RingGame {
  background: string
  altar: string
  tokens: string[]
  centre: [number, number]
  radius: number
  rounds: RingRound[]
}

/** A bird of the birds game: where it starts in the sky (percent of the picture) and how much of the way to the meeting point is drawn (0.3 to 0.7). */
export interface BirdsBird {
  from: [number, number]
  shown: number
}
/** A task of the birds game: the meeting point `target` of the flight paths on the ground, the birds that fly to it and, in round 2, a decoy bird whose path aims at `to` instead. */
export interface BirdsTask {
  target: [number, number]
  birds: BirdsBird[]
  decoy?: { from: [number, number]; to: [number, number]; shown: number }
}
export interface BirdsRound {
  hint: string
  tasks: BirdsTask[]
}
/**
 * The birds game "Where do the birds fly?": the flight paths of the birds end in the air, the child taps where they would meet, there lies the spring. `bird` are the two wing
 * positions, `spring` the picture that appears at the meeting point, `radius` the circle of a hit (percent of the width of the picture).
 */
export interface BirdsGame {
  background: string
  bird: [string, string]
  spring: string
  radius: number
  rounds: BirdsRound[]
}

/** A round of the rings game: the turn of every ring in twelfths (1 to 11, never 0) and the pairs `[a, b]` where turning ring `a` turns ring `b` the other way. */
export interface RingsRound {
  hint: string
  start: number[]
  couple: [number, number][]
}
/** The rings game "The light through the rings": rings (outside to inside) are turned until the light shines through all gaps; the hub and the beam are pictures, too. */
export interface RingsGame {
  background: string
  rings: string[]
  hub: string
  beam: string
  rounds: RingsRound[]
}

/** A piece of silver of the silver game: its picture (small, middle or big heap) and its worth (a multiple of 25). */
export interface SilverPiece {
  id: string
  image: string
  value: number
}
/** A round of the silver game: the price, the pieces that lie ready (ids) and whether the sum on the cloth is shown. */
export interface SilverRound {
  hint: string
  price: number
  pieces: string[]
  showSum: boolean
}
export interface SilverGame {
  background: string
  cloth: string
  purse: string
  pieces: SilverPiece[]
  rounds: SilverRound[]
}

/** A blanket of the clues game: its picture, its colour name (the first word of the clue cards) and its pattern (written below it, for those who cannot tell the colours apart). */
export interface CluesBlanket {
  id: string
  image: string
  label: string
  pattern: string
}
/** A clue card, written by the app: a blanket lies at a place (1 = at the well) or not, one lies nearer to the well than another, or two lie right next to each other. */
export type Clue = { kind: 'at' | 'notAt'; blanket: string; slot: number } | { kind: 'before' | 'next'; a: string; b: string }
export interface CluesRound {
  hint: string
  blankets: string[]
  clues: Clue[]
  /** The blanket at every place, from the well on. */
  solution: string[]
}
/** The clues game "Who kneels where?": blankets are laid on the kneeling camels so that every clue card is true. `slots` are the feet of the camels (percent of the picture), `camelWidth` their width. */
export interface CluesGame {
  background: string
  camel: string
  card: string
  blankets: CluesBlanket[]
  slots: [number, number][]
  camelWidth: number
  rounds: CluesRound[]
}

/** A thing of the packing game: its picture and its size in cells of the basket (1 or 2 each way). */
export interface PackItem {
  id: string
  image: string
  w: number
  h: number
}
/** A round of the packing game: the size of the grid in the basket and the things to pack (ids). */
export interface PackRound {
  hint: string
  cols: number
  rows: number
  items: string[]
}
/** The packing game "Pack the supplies": things of different shapes are fitted into the grid of a basket (a tap on a packed thing turns it). `area` is the grid in percent of the picture. */
export interface PackGame {
  background: string
  basket: string
  items: PackItem[]
  area: { x: number; y: number; w: number; h: number }
  rounds: PackRound[]
}

/** A bundle of flax of the hiding game: its picture and its size in percent of the width of the roof (both ways). */
export interface HideBundle {
  id: string
  image: string
  w: number
  h: number
}
/** A man who lies on the roof: his picture and his place (percent of the picture of the roof, the top left corner and the size). */
export interface HideMan {
  id: string
  image: string
  x: number
  y: number
  w: number
  h: number
}
export interface HideRound {
  hint: string
  men: string[]
  bundles: string[]
}
/** The hiding game "Under the flax": bundles of flax are laid over the men on the roof until nobody can be seen; then the messengers look up from far away and go on. */
export interface HideGame {
  background: string
  messenger: string
  men: HideMan[]
  bundles: HideBundle[]
  rounds: HideRound[]
}

/** A man on the rope of the lowering game: his picture (with the rope) and his width (percent of the picture). */
export interface LowerMan {
  id: string
  image: string
  w: number
}
/** A round of the lowering game: the man, the steps down, the time of one swing (seconds), the swing (degrees) and how far from the wall the rope has to swing to be free (degrees). */
export interface LowerRound {
  hint: string
  man: string
  steps: number
  period: number
  amplitude: number
  threshold: number
}
/** The lowering game "Down the rope": the man swings on the rope; a tap while he swings away from the wall lets him down a step. `window` is where the rope hangs, `ground` the height of the ground (percent of the picture). */
export interface LowerGame {
  background: string
  men: LowerMan[]
  window: [number, number]
  ground: number
  rounds: LowerRound[]
}

/** A round of the step game: the beats a minute, the steps to take and how far from the beat a tap may be (seconds). */
export interface StepRound {
  hint: string
  bpm: number
  steps: number
  tolerance: number
}
/** The step game "In step": the bearers walk along `path` (percent of the picture) one step at every beat the child taps in time; the footprints show the way. */
export interface StepGame {
  background: string
  bearers: string
  print: string
  path: [number, number][]
  rounds: StepRound[]
}

/** A round of the baking game: the dough balls to bake, the hot stones, and the seconds after which a flatbread is golden and after which it is too dark. */
export interface BakeRound {
  hint: string
  dough: number
  stones: number
  goldenFrom: number
  goldenTo: number
}
/** The baking game "Bake flatbreads": a flatbread on a hot stone is raw, then golden, then too dark; it is turned at the right time. Places in percent of the picture. */
export interface BakeGame {
  background: string
  dough: string
  raw: string
  golden: string
  dark: string
  stack: string
  stonesAt: [number, number][]
  stackAt: [number, number]
  rounds: BakeRound[]
}

/** A place at the side of the road for an animal of the hush game (percent of the picture, `w` its width). */
export interface HushSpot {
  id: string
  animal: string
  image: string
  x: number
  y: number
  w: number
}
/** A round of the hush game: the animals to calm, the most clouds at once, the seconds until a cloud is loud, and the seed of the order in which they come. */
export interface HushRound {
  hint: string
  calms: number
  maxClouds: number
  grow: number
  seed: number
}
/** The hush game "Keep quiet": little clouds of noise grow over the animals at the side of the road; a tap calms the animal before the cloud is loud. */
export interface HushGame {
  background: string
  clouds: [string, string, string]
  spots: HushSpot[]
  rounds: HushRound[]
}

/** A puzzle of the cave game: the size of the cave, rock, niches (places for the sacks), sacks and the man at the start; a place is (column, row). */
export interface CaveLevel {
  hint: string
  cols: number
  rows: number
  walls: [number, number][]
  niches: [number, number][]
  sacks: [number, number][]
  man: [number, number]
}
/** The cave game "Sacks into the cave": the child leads a small man who pushes sacks into the niches (only pushing, one sack at a time). `area` is the grid in percent of the picture. */
export interface CaveGame {
  background: string
  man: string
  sack: string
  niche: string
  wall: string
  area: { x: number; y: number; w: number; h: number }
  rounds: CaveLevel[]
}

/** A round of the winnowing game: the pieces of chaff and the grains in the tray, the right wind (percent), how much the wind swings and the seed of the order. */
export interface WinnowRound {
  hint: string
  chaff: number
  grains: number
  window: [number, number]
  gust: number
  seed: number
}
/** The winnowing game "Chaff in the wind": the wind is set so that the light chaff flies away and the heavy grains stay. `trayBox` is the tray in percent of the picture. */
export interface WinnowGame {
  background: string
  tray: string
  grain: string
  chaffImage: string
  handle: string
  trayBox: { x: number; y: number; w: number; h: number }
  rounds: WinnowRound[]
}

/** A round of the word game: the word (in capitals) and the extra letters. */
export interface WordRound {
  hint: string
  word: string
  extra: string[]
}
/** The word game "Lay the word": letter tiles are put in the boxes (the words are written for each language). */
export interface WordGame {
  background: string
  rounds: WordRound[]
}

/** A round of the dew game: where the dew lies (on the fleece or on the ground) and the places of the drops (percent of the threshing floor). */
export interface DewRound {
  hint: string
  wet: 'fleece' | 'ground'
  spots: [number, number][]
}
/** The dew game "The night goes by": the moon is drawn across the sky to the morning; then the drops glitter, and the child taps them where the dew lies. */
export interface DewGame {
  background: string
  fleece: string
  bowl: string
  moon: string
  sun: string
  fleeceBox: { x: number; y: number; w: number; h: number }
  rounds: DewRound[]
}

/** A man of the switch game: his picture and his width (percent of the picture). */
export interface SwitchMan {
  id: string
  image: string
  w: number
}
/** A round of the switch game: what each man wants (go home or stay), how many wait at the same time, and after how long the bubble goes away. */
export interface SwitchRound {
  hint: string
  men: ('home' | 'stay')[]
  hideBubbleMs?: number
  queue: number
}
/** The switch game "Who goes home?": the men come down the path to a fork; the child sets the switch so that each goes where he wants. `fork` is the place of the fork (percent of the picture). */
export interface SwitchGame {
  background: string
  men: SwitchMan[]
  bubbleHome: string
  bubbleHorn: string
  leverLeft: string
  leverRight: string
  fork: [number, number]
  rounds: SwitchRound[]
}

/** A watcher and his cone of light: his place (percent of the picture), the two ends of the swing (degrees), the time of one swing and how far the light reaches (percent of the width). */
export interface SneakWatcher {
  x: number
  y: number
  from: number
  to: number
  periodMs: number
  reach: number
}
export interface SneakRound {
  hint: string
  stops: [number, number][]
  watchers: SneakWatcher[]
}
/** The sneak game "Quietly down the slope": the pair is led along `path` from one place in the shadow to the next, and waits whenever a cone of light comes. */
export interface SneakGame {
  background: string
  pair: string
  watcherImages: string[]
  path: [number, number][]
  rounds: SneakRound[]
}

/** A group of men with jars, and the place where they stand (percent of the picture). */
export interface CueGroup {
  id: string
  image: string
  x: number
  y: number
  jars: number
}
/** A round of the signal game: the signals, the false signals that must not be answered, and the shortest and longest wait (ms). */
export interface CueRound {
  hint: string
  signals: number
  decoys: ('owl' | 'wind')[]
  waitMs: [number, number]
}
/** The signal game "On Gideon's sign": wait for the horn, then answer in the right order (`leader` Gideon's jar first, then the `groups`); `front` is the group that stands round Gideon (only to look at). */
export interface CueGame {
  background: string
  groups: CueGroup[]
  leader: CueGroup
  front: CueGroup
  horn: string
  decoyImages: Record<string, string>
  shards: string
  rounds: CueRound[]
}

/** A round of the constellation game: the stars of the model as points in the frame (0 to 100 each way), and whether the model stays in view. */
export interface ConstellationRound {
  hint: string
  targets: [number, number][]
  showAlways: boolean
}
/**
 * The constellation game: a model of stars is looked at and then laid again in an empty frame in the night sky (at most two rounds). `frame` is the empty
 * frame as a part of the picture (percent of the picture); the model and everything else is drawn by the app.
 */
export interface ConstellationGame {
  /** The picture of the night sky above the tent (the stage picture, 3:2). */
  background: string
  /** The picture of a star (a path below `public/`). */
  star: string
  frame: { x: number; y: number; w: number; h: number }
  rounds: ConstellationRound[]
}

/** The tools and colours a picture of an adventure can ask for. */
export type PaintToolName = 'pencil' | 'felt' | 'watercolor' | 'graphite' | 'chalk' | 'oil' | 'fill'
export type PaintColor = 'yellow' | 'blue' | 'brown' | 'green' | 'red' | 'orange' | 'purple' | 'pink'

/** One element of the picture (the rainbow, the sun): the closed fields of the line art that belong to it, found by one point inside each (percent of the picture). */
export interface PaintZone {
  seeds: [number, number][]
}

/** One task of a picture to paint: an element of the picture (a zone) has to be painted with a tool and/or in a colour; the rest the child chooses. */
export interface PaintJob {
  /** The name of the element in `StageTask.zones`. */
  zone: string
  /** Painted with this tool (and, when `color` is given too, in this colour as well) ... */
  tool?: PaintToolName
  /** ... or in this colour family ("green" takes light green, green and dark green). */
  color?: PaintColor
  /** The task as the child reads it ("Male den Regenbogen mit Wasserfarbe."). */
  hint: string
}

export interface StageTask {
  kind: TaskKind
  /** One line that says what to do. */
  hint?: string
  /** `ausmalen`: the elements of the picture that conditions can speak about. */
  zones?: Record<string, PaintZone>
  /** `ausmalen`: the pool of tasks; at every start of the stage `jobCount` of them (for different zones) are drawn by chance. Every task that is done is one star. */
  jobs?: PaintJob[]
  /** `ausmalen`: how many tasks are drawn from the pool (3). */
  jobCount?: number
  /** `ausmalen`: the line art; `zaehlen`: the picture of the things to count (a path below `public/`; `{n}` is 1–3, a variant). */
  image?: string
  /** `zaehlen`: the same things when they are not counted yet. */
  imageOff?: string
  /** `zaehlen`: the picture behind the things (a path below `public/`). */
  background?: string
  /** `zaehlen`: how many things there are. */
  count?: number
  /** `zaehlen`: several kinds of things (cows, fat and thin) mixed; the child counts them all. */
  groups?: CountGroup[]
  /** `zaehlen`: the question after counting, when it is not the plain "how many". */
  question?: string
  puzzle?: PuzzleGame
  way?: WayGame
  harvest?: HarvestGame
  memory?: MemoryGame
  sort?: SortGame
  find?: FindGame
  share?: ShareGame
  build?: BuildGame
  dots?: DotsGame
  fly?: FlyGame
  order?: OrderGame
  water?: WaterGame
  lights?: LightGame
  verse?: VerseGame
  echo?: EchoGame
  channels?: ChannelGame
  mirror?: MirrorGame
  sow?: SowGame
  herd?: HerdGame
  missing?: MissingGame
  wipe?: WipeGame
  chain?: ChainGame
  stack?: StackGame
  trace?: TraceGame
  balance?: BalanceGame
  slide?: SlideGame
  crank?: CrankGame
  hold?: HoldGame
  cycle?: CycleGame
  catch?: CatchGame
  guess?: GuessGame
  cairn?: CairnGame
  relay?: RelayGame
  ring?: RingGame
  birds?: BirdsGame
  rings?: RingsGame
  silver?: SilverGame
  clues?: CluesGame
  pack?: PackGame
  hide?: HideGame
  lower?: LowerGame
  step?: StepGame
  bake?: BakeGame
  hush?: HushGame
  cave?: CaveGame
  winnow?: WinnowGame
  word?: WordGame
  dew?: DewGame
  swit?: SwitchGame
  sneak?: SneakGame
  cue?: CueGame
  constellation?: ConstellationGame
}

export interface AdventureStage {
  id: number
  title: string
  /** The Bible passage the stage retells. */
  ref: string
  /** The text, one paragraph per entry. */
  text: string[]
  /** The recording of the text (a path below `public/`); until it exists the device's own voice reads the text. */
  audio?: string
  /** The big picture of the stage (3:2). */
  image?: string
  task: StageTask
  questions: AdventureQuestion[]
  /** The stage is not ready yet (texts or pictures are still missing): it shows "soon", cannot be opened, and its files are not downloaded. */
  soon?: boolean
}

/** A place on the painted map that can be tapped: the middle of a round picture, as a share of the whole map picture. */
export interface MapSpot {
  /** From the left edge, as a share of the width of the map. */
  x: number
  /** From the top edge, as a share of the height of the map. */
  y: number
  /** Diameter of the round picture (its gold ring), as a share of the width of the map. */
  d: number
}

/** The painted map: one wide picture that scrolls sideways; the round pictures on it are the stages, the dotted way joins them. */
export interface JourneyMap {
  /** The map picture in pieces side by side (one picture, cut so that every device can load it); the pieces overlap by a few pixels. */
  images: string[]
  /** The empty gold ring that lies over the round picture of every station. */
  ring: string
  /** Width divided by height of the whole map picture. */
  aspect: number
  /** Width of the whole map picture in pixels (9824 when left out); the pieces overlap by 4 px of it. */
  widthPx?: number
  /** One spot per stage, in the order of the stages. */
  stages: MapSpot[]
  exam: MapSpot
  /** The beads of the dotted way, one list per stretch between two stages (the last one leads to the exam): [x, y] as shares of the map. */
  path: [number, number][][]
}

export interface Journey {
  id: string
  title: string
  subtitle: string
  /** The age group the texts are written for. */
  age: '8-10'
  stages: AdventureStage[]
  /** The questions of the exam at the end of the journey. */
  exam: AdventureQuestion[]
  map: JourneyMap
  /** The painted medal that stands for the journey on the adventure page. */
  medal: string
  /** A picture for the card on the start page ("continue") and for the choice of the journeys. */
  cover?: string
  /** About how many MB the one-time download is (shown before it starts). */
  downloadMb?: number
  /**
   * The background music of this journey: files below `public/` (`audio/abenteuer/<id>/musik-....mp3`), calm whole pieces of one to two
   * minutes that follow one another at random with a soft crossfade. Every journey has its own, so that the journeys sound different;
   * without it the general pieces play.
   */
  music?: string[]
  /** The present for finishing the journey. */
  gift: { title: string; image: string }
}

/** What a child has done in one stage. */
export interface StageProgress {
  /** Stars of the task (0–3); for a quiz stage the stars of its questions. */
  stars: number
  /** Stars of the game alone (best try); older saves only have `stars`. */
  gameStars?: number
  /** The stars that count: the game's stars minus one for every wrong answer to the questions (best try). */
  finalStars?: number
  /** The questions of the stage were answered: how many were right. */
  quizCorrect?: number
  /** The stage was gone through to the end (text, task, questions): the next stage opens. */
  done: boolean
}

export interface JourneyProgress {
  stages: Record<number, StageProgress>
  exam?: { correct: number; total: number }
}

export type Medal = 'bronze' | 'silver' | 'gold'
