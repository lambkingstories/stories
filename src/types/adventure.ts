/**
 * Adventure ("Abenteuer"): a journey through a Bible story, told in stages. Every stage has a short text, one task (a game, a
 * coloring page or a quiz) that earns up to three stars, and one to three questions. At the end of a journey comes an
 * exam, and from all the stars and the exam a cup (bronze, silver, gold) and a coloring page as a present.
 */

import type { JugsGame, EnoughGame, QuailsGame, StaffsGame, SerpentGame, DonkeyGame, CommissionGame } from './wuesteGames2'

/** The kinds of tasks. `quiz` means the questions of the stage are the task. */
export type TaskKind = 'quiz' | 'zaehlen' | 'ausmalen' | 'puzzle' | 'weg' | 'ernten' | 'memory' | 'sortieren' | 'wimmelbild' | 'teilen' | 'bauen' | 'punkte' | 'steuern' | 'reihenfolge' | 'giessen' | 'lichter' | 'lueckenvers' | 'echo' | 'kanaele' | 'spiegeln' | 'saeen' | 'hueten' | 'fehlt' | 'wischen' | 'kette' | 'stapeln' | 'spur' | 'waage' | 'sternbild' | 'schieben' | 'kurbel' | 'halten' | 'jahre' | 'fangen' | 'schaetzen' | 'bund' | 'staffel' | 'kreis' | 'voegel' | 'ringe' | 'silber' | 'hinweise' | 'fokus' | 'packen' | 'verstecken' | 'abseilen' | 'schritt' | 'backen' | 'still' | 'hoehle' | 'worfeln' | 'wort' | 'tau' | 'weiche' | 'schleichen' | 'zeichen' | 'flechten' | 'leuchten' | 'unterschied' | 'takt' | 'manna' | 'worte' | 'wolke' | 'jordan' | 'suppe' | 'bord' | 'strand' | 'saecke' | 'schatten' | 'tage' | 'standbild' | 'lampe' | 'zeiten' | 'raben' | 'hoehlen' | 'regen' | 'sausen' | 'nachlese' | 'epha' | 'aelteste' | 'wiege' | 'oberkleid' | 'kuehe' | 'stein' | 'suchen' | 'gepaeck' | 'volk' | 'harfe' | 'hirte' | 'kiesel' | 'schleuder' | 'pfeil' | 'zipfel' | 'leise' | 'thron' | 'kruege' | 'tauchen' | 'schmuecken' | 'ehren' | 'ritt' | 'posaune' | 'friede' | 'schmieden' | 'krippe' | 'zeichen' | 'bahn' | 'netz' | 'boote' | 'dach' | 'arme' | 'richter' | 'signal' | 'traube' | 'krug' | 'genug' | 'wachteln' | 'stab' | 'schlange' | 'eselin' | 'einsetzen' | 'schoepfen' | 'gedraenge' | 'buendel' | 'brote' | 'rudern' | 'umkehr' | 'ruf' | 'graben' | 'muenze' | 'entgegen'

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
  /** Own words for another journey than Egypt: the hint (`{n}` of `{total}` forks), the line for the right way, for the wrong way and at the end. */
  texts?: { hint: string; right: string; wrong: string; done: string }
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
  /** Own words for the messages of the game (the standard words are about a stream and a garden), e.g. when oil is poured: the name of the place to fill, "fill first", "enough", "one more", the end. */
  texts?: { river?: string; fillFirst?: string; enough?: string; once?: string; done?: string }
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
  /** The picture is drawn soft (blur) and a little darker behind the board; for a stage picture with big figures. */
  soft?: boolean
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
  /** How many fields are free (default 1): with two the tiles move much more easily. */
  gaps?: number
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
  /** The picture of the tent that stands at `tent` (the number of the children inside lies on it); only the number when left out. */
  tentImage?: string
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

/** One of the three things next to the pot of the stew game: its picture and where it lies (middle of the picture, percent of the scene). */
export interface StewSource {
  image: string
  at: [number, number]
}

/**
 * The stew game "Cook the soup before Esau comes": a pot stands on the fireplace in front of the tent; far away on the road Esau appears and walks to the tent. The child taps (or drags
 * to the pot) lentils, water and wood, in any order, until the soup steams. One round, nothing is lost, a try that is too slow starts again by itself, and Esau walks a little slower each time.
 * The pot has four pictures at the same place (empty, lentils, water, soup); two logs make the fire grow (the one picture of the flame is shown 1.6 times as big). All places are percent of the scene.
 */
export interface StewGame {
  hint: string
  /** the scene (3 : 4), without figures */
  scene: string
  pot: { empty: string; lentils: string; water: string; soup: string }
  logs: string
  flame: string
  steam: string
  sources: { bowl: StewSource; jug: StewSource; wood: StewSource }
  esau: string
  /** the middle of the pot */
  potAt: [number, number]
  /** Esau's way from the fields to the tent (the feet) */
  path: [number, number][]
  /** how long Esau walks the first time, how much longer each new try, the longest, and how long the soup simmers (ms) */
  walkMs: number
  slowerMs: number
  maxWalkMs: number
  simmerMs: number
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
  /** The small stone that lies on the heap; the big stone at half the size when left out. */
  stoneSmall?: string
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
  /** A herd is a troop of this many animals of the picture side by side (1 when left out). */
  copies?: number
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
  /** The beam of light as a picture; the app paints a gradient when it is left out. */
  beam?: string
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
  /** The purse that is given away when the price is paid; left out in Abraham v3. */
  purse?: string
  pieces: SilverPiece[]
  rounds: SilverRound[]
}

/** A round of the focus game: the picture that lies blurred and the place of the slider (percent of its length) where it is sharp. */
export interface FocusRound {
  hint: string
  image: string
  sharpAt: number
}
/** The focus game "Look into the distance": a slider is moved until a blurred picture is sharp (at most two rounds, no mistake is possible). */
export interface FocusGame {
  rounds: FocusRound[]
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
  /** What the thing is called (screen readers and the tip); the app has names for the things of the basket when this is left out. */
  label?: string
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
/** A round of the lowering game: the man, how long he needs down the rope while it is held (ms), how often the guard comes and the pause between two passes (ms). */
export interface LowerRound {
  hint: string
  man: string
  descentMs: number
  passes: number
  gapMs: number
}
/**
 * The lowering game "The red rope": the child holds the rope (finger on the picture, the button, or Enter and the space key) and the man goes down; when it lets go he stops. At the foot of the wall a guard with a torch
 * walks by (a small figure with a circle of light, drawn by the app); while he is near the sign says "Wait", and holding in his light lets the man be seen: he climbs back to the last of the four red knots (no loss, no restart).
 * `window` is where the rope hangs and `ground` the height of the ground, `road` the height of the road the guard walks on (percent of the picture), `guardSpeed` percent of the width a second, `lightRadius` the radius of the light
 * and `warnLead` how far before the light "Wait" shows (percent of the width), `knots` the red knots on the rope.
 */
export interface LowerGame {
  background: string
  men: LowerMan[]
  guard: string
  window: [number, number]
  ground: number
  road: number
  guardSpeed: number
  lightRadius: number
  warnLead: number
  knots: number
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
  /** The ball of dough in the tray; the raw flatbread when left out. */
  dough?: string
  raw: string
  golden: string
  dark: string
  /** The stack of turned flatbreads and its place; only the number of them, at a fixed place, when left out. */
  stack?: string
  stonesAt: [number, number][]
  stackAt?: [number, number]
  rounds: BakeRound[]
}

/** A round of the crossing game: only the hint (the two rounds are fixed: the chest into the river, then the groups over). */
export interface CrossRound {
  hint: string
}
/**
 * The crossing game "Through the Jordan": the golden chest is pulled into the middle of the river, then the groups of the people are sent over the dry bed. All places are percent of the picture:
 * the chest starts at `start` and clicks into place at `middle`, the groups wait at `groups`, and they land on the far bank near `farBank`.
 */
export interface CrossGame {
  background: string
  chest: string
  group: string
  start: [number, number]
  middle: [number, number]
  groups: [number, number][]
  farBank: [number, number]
  rounds: CrossRound[]
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
  /** The picture of a rock in the cave; left out when no round has rocks. */
  wall?: string
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
  /** The left lever; the right lever turned round when left out (one picture for both). */
  leverLeft?: string
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

/** A round of the plaiting game: the number of stakes and rows and whether every row begins like the one before (`same`) or the other way round (`alternate`). */
export interface WeaveRound {
  hint: string
  stakes: number
  rows: number
  pattern: 'same' | 'alternate'
}
/** The plaiting game "Plait the little basket": the cells where the reed runs in front of the stakes are tapped; `tiles` are the pictures of a cell (192 x 192) and `done` the finished basket. */
export interface WeaveGame {
  background: string
  tiles: { stake: string; front: string; behind: string; active: string }
  done: string
  rounds: WeaveRound[]
}

/** A round of the glow game: the picture, the place where Moses starts and where the bush stands (percent of the picture), how close he has to come and an optional layer of rocks in front. */
export interface GlowRound {
  hint: string
  background: string
  start: [number, number]
  target: [number, number]
  threshold: number
  cover?: string
}
/** The glow game "Follow the glow": Moses is led over the slope towards a glow that gets brighter the closer he comes. */
export interface GlowGame {
  walker: string
  bush: string
  rounds: GlowRound[]
}

/** A thing that is added in the right picture (its middle and width, percent of the picture). */
export interface DiffItem {
  image: string
  x: number
  y: number
  w: number
}
export interface DiffRound {
  hint: string
  base: string
  items: DiffItem[]
}
/** The differences game "Find the differences": two pictures side by side, the right one has some things more; they are tapped in the right picture. */
export interface DiffGame {
  rounds: DiffRound[]
}

/** A round of the drum game: the beats a minute and the slots of the pattern (`1` a ring comes, `0` a pause). */
export interface BeatRound {
  hint: string
  bpm: number
  pattern: (0 | 1)[]
}
/** The drum game "Miriam's drum": rings run towards the drum and the child taps it when a ring reaches it. */
export interface BeatGame {
  background: string
  drum: string
  ring: string
  rounds: BeatRound[]
}

/** A day of the manna game: how many jars are needed (`0` is the day of rest). */
export interface MannaDay {
  jars: number
}
export interface MannaRound {
  hint: string
  days: MannaDay[]
}
/** The manna game "Gather manna": grains are gathered into jars, day after day, the right amount (twice as much on the sixth day, nothing on the seventh). */
export interface MannaGame {
  background: string
  flakes: string[]
  jar: string
  jarFull: string
  dwellers: string
  flakesPerJar: number
  rounds: MannaRound[]
}

export interface WordsRound {
  hint: string
  sentences: string[]
}
/** The words game "Put the words in order": the words of a sentence lie on stone chips in a mixed order and are put in the strip one after the other. */
export interface WordsGame {
  background: string
  chip: string
  strip: string
  rounds: WordsRound[]
}

/** One trial of the cloud game: the pillar rises or stays, and what moves round it as a distraction. */
export interface CloudTrial {
  pillar: 'rises' | 'stays'
  distractors: ('smoke' | 'birds' | 'banner' | 'sparks')[]
}
export interface CloudRound {
  hint: string
  mode: 'day' | 'night'
  trials: CloudTrial[]
}
/** The cloud game "Follow the cloud": the child decides whether the people break up (the pillar rises) or stay (it does not). */
export interface CloudGame {
  dayScene: string
  nightScene: string
  pillarDay: string
  pillarNight: string
  extras: Record<string, string>
  rounds: CloudRound[]
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

/** A kind of cargo of the overboard game: its picture and its width (percent of the picture). */
export interface OverboardKind {
  id: string
  image: string
  w: number
}
/** A piece of cargo: its kind, where it lies on the deck (percent of the picture), how far it slides to and fro (percent) and how long a slide takes (ms). */
export interface OverboardPiece {
  kind: string
  x: number
  amp: number
  periodMs: number
  phase?: number
}
export interface OverboardRound {
  hint: string
  pieces: OverboardPiece[]
}
/** The game "Cargo overboard": the cargo of the ship slides to and fro in the storm; the child taps each piece to throw it into the sea. `deck` is the strip of the deck (percent of the picture). */
export interface OverboardGame {
  background: string
  ship: string
  /** The ship: its place (middle of the lower edge, percent of the picture) and width (percent). */
  shipBox: { x: number; y: number; w: number }
  /** The deck strip on which the cargo slides: top, height (percent of the picture). */
  deck: { y: number; h: number }
  kinds: OverboardKind[]
  rounds: OverboardRound[]
}

/** A shell lies on the beach at this place (percent of the beach picture); `kind` is the index of its picture. */
export interface ShoreShell {
  x: number
  y: number
  kind: number
}
/** A round of the shore game: how long a wave takes to come and go (ms), how far up the beach it reaches (percent from the top) and where it starts (percent from the top), and the shells. */
export interface ShoreRound {
  hint: string
  periodMs: number
  /** The highest place of the wave front (percent from the top of the beach; smaller = higher up). */
  high: number
  /** The lowest place of the wave front (percent from the top; the sea lies below). */
  low: number
  shells: ShoreShell[]
}
/** The game "Shells before the wave": the wave runs up the beach and back; the child collects the shells on the dry sand before the wave washes them away. */
export interface ShoreGame {
  background: string
  /** The pictures of the kinds of shells (the index is `ShoreShell.kind`). */
  shells: string[]
  bucket: string
  foam: string
  rounds: ShoreRound[]
}

/** A figure of the sacks game: who it is (a child, a grown-up, an animal), its two pictures (in its clothes, in the sack) and its place and width (percent of the street). */
export interface SacksFigure {
  id: string
  who: 'child' | 'adult' | 'animal'
  image: string
  imageSack: string
  x: number
  y: number
  w: number
}
export interface SacksRound {
  hint: string
  figures: SacksFigure[]
}
/** The game "Sacks for great and small": small sacks for the children, big sacks for the grown-ups and the animals. */
export interface SacksGame {
  background: string
  sackSmall: string
  sackBig: string
  rounds: SacksRound[]
}

/** A round of the shade game: how long Jonah has to sit in the shade (seconds), how long the sun takes for its way (seconds) and how wide the shade is (percent of the picture width). */
export interface ShadeRound {
  hint: string
  seconds: number
  sunSeconds: number
  tolerance: number
}
/** The game "Keep the shade": the sun travels over the sky; the child pulls the leafy roof of the castor-oil plant between the sun and Jonah. */
export interface ShadeGame {
  background: string
  jonah: string
  roof: string
  sun: string
  /** Where Jonah sits (his middle, percent of the picture) and how wide he is (percent). */
  jonahBox: { x: number; y: number; w: number }
  /** The width of the roof (percent of the picture). */
  roofW: number
  rounds: ShadeRound[]
}

/** A dish of the days game: what it is (vegetables and water are Daniel's food, meat and sweets are the king's), its picture. */
export interface DaysDish {
  id: string
  kind: 'veg' | 'water' | 'meat' | 'sweet'
  image: string
}
/** The game "Ten days": every day four dishes stand on the table; the child taps the two that Daniel eats (vegetables and water), not the king's food. */
export interface DaysGame {
  background: string
  /** All the dishes (two or more of every kind); every day takes one of each kind. */
  dishes: DaysDish[]
  /** How many days the test lasts (ten). */
  days: number
  /** The strip of the table where the dishes stand: top and height (percent of the picture) and the width of a dish (percent). */
  table: { y: number; h: number; w: number }
  /** How many seconds a day lasts: days 1 to 3, days 4 to 7, days 8 to 10. */
  limits: [number, number, number]
}

/** A disc of the statue: its picture, its real size and place in the finished statue (the middle and the width in percent of the picture), and how much bigger it is drawn while it waits (a finger needs more than a head). */
export interface StatuePiece {
  id: string
  image: string
  /** The name on the label of the first round. */
  label: string
  w: number
  at: { x: number; y: number }
  /** The disc is drawn this many times bigger while it waits at the side. */
  wait: number
}
/** A place of the statue (middle and size in percent of the picture); the discs snap to it. */
export interface StatueSlot {
  x: number
  y: number
  w: number
  h: number
}
export interface StatueRound {
  hint: string
  /** The labels with the names of the metals are on the discs in this round. */
  labels: boolean
  /** Where each disc waits in this round (middle, percent of the picture), one for every piece in the order of `StatueGame.pieces`. */
  homes: { x: number; y: number }[]
}
/** The game "The statue": the five discs of the dream are put in their places, then the stone rolls and the statue falls to dust. */
export interface StatueGame {
  background: string
  /** The pieces from the head (index 0) to the feet (index 4). */
  pieces: StatuePiece[]
  /** The places from the head to the feet (the chest place is the body only: the arms hang beside the belly and the legs). */
  slots: StatueSlot[]
  stone: string
  mountain: string
  rounds: StatueRound[]
}

/** A sign on the wall: where it shines (middle, percent of the picture) and its picture (golden on black, blended with `screen`). */
export interface LampSign {
  image: string
  x: number
  y: number
  w: number
}
export interface LampRound {
  hint: string
  /** The radius of the circle of light (percent of the picture width). */
  radius: number
  /** The flame flickers (the circle breathes) and goes out when the lamp is moved too fast. */
  flicker: boolean
  signs: LampSign[]
}
/** The game "The light on the wall": the lamp is pulled over the dark wall; the glowing signs show only in its light. */
export interface LampGame {
  background: string
  lamp: string
  /** The width of the lamp (percent of the picture). */
  lampW: number
  rounds: LampRound[]
}

/** A round of the hours game: how long a day takes (seconds), how many days, and how many seconds around a prayer time count. */
export interface HoursRound {
  hint: string
  dayMs: number
  days: number
  windowMs: number
}
/** The game "Three times a day": the sun crosses the sky and the child taps Daniel at the three golden marks. */
export interface HoursGame {
  /** The opening of the window in the frame (percent of the picture): the sun crosses the sky inside it. */
  window: { x: number; y: number; w: number; h: number }
  sky: string
  frame: string
  standing: string
  kneeling: string
  sun: string
  rounds: HoursRound[]
}

/** What a raven carries in the ravens game: bread and meat are food (right to tap), the twig and nothing are not. */
export type RavenKind = 'bread' | 'meat' | 'twig' | 'empty'
/** One raven of a round: what it carries, how high it flies (percent of the picture height), when it enters (ms after the start of the round) and how long it takes to cross the picture. */
export interface RavenFlight {
  kind: RavenKind
  y: number
  at: number
  dur: number
}
export interface RavensRound {
  hint: string
  flights: RavenFlight[]
}
/** The game "Ravens coming in": the ravens fly across the valley of the brook Cherith; the child taps those that bring bread or meat, they land at Elijah's rock; a tap on a raven with a twig or with nothing is a mistake. */
export interface RavensGame {
  background: string
  /** The flying raven for each kind (a sprite that flies to the left). */
  ravens: Record<RavenKind, string>
  /** The food that lies on the rock after a raven has been tapped. */
  food: { bread: string; meat: string }
  /** The rock beside Elijah: the middle of the first piece of food, the step to the next one, and the width of a piece (percent of the picture). */
  rock: { x: number; y: number; step: number; w: number }
  /** The width of a raven (percent of the picture width). */
  ravenW: number
  rounds: RavensRound[]
}

/** A prophet that waits in the yard of the caves game. */
export interface CavesProphet {
  id: string
  image: string
  /** Read out for screen readers. */
  label: string
}
/** A cave mouth: the place where a prophet is put (percent of the picture). */
export interface CavesCave {
  x: number
  y: number
  w: number
  h: number
}
export interface CavesRound {
  hint: string
  /** How many prophets this round has (the first ones of `CavesGame.prophets`); an even number. */
  count: number
}
/** The game "In two caves": the prophets wait in the yard, the child brings each one into one of the two caves; both caves must get the same number. */
export interface CavesGame {
  background: string
  prophets: CavesProphet[]
  /** The left and the right cave. */
  caves: [CavesCave, CavesCave]
  /** The yard where the prophets wait: the left and right end of the row (percent of the picture width), the feet line (percent of the height) of the first row, the distance to a second row, and the width of a prophet. */
  yard: { x0: number; x1: number; y: number; row: number; w: number }
  rounds: CavesRound[]
}

/** A cloud of the rain game: how high it drifts (percent of the picture height), when it enters (ms) and how long it takes to cross the picture. */
export interface RainCloud {
  y: number
  at: number
  dur: number
}
export interface RainRound {
  hint: string
  /** `grow`: one tiny cloud rises from the sea, two taps make it rain; `pass`: several clouds drift across, each must be tapped once. */
  mode: 'grow' | 'pass'
  clouds: RainCloud[]
}
/** The game "Clouds that bring rain": the dry mountain turns green with every cloud that rains. */
export interface RainGame {
  dry: string
  green: string
  /** The cloud in three sizes: tiny (like a hand), medium, big and heavy. */
  clouds: [string, string, string]
  /** The widths of the three sizes (percent of the picture width). */
  cloudW: [number, number, number]
  drops: string
  /** Where the tiny cloud rises from the sea (the middle, percent of the picture). */
  sea: { x: number; y: number }
  rounds: RainRound[]
}

/** What is loud in the whisper game. */
export type LoudKind = 'wind' | 'quake' | 'fire'
export interface WhisperRound {
  hint: string
  /** The loud things in the order they come. */
  order: LoudKind[]
  /** How long each loud thing lasts, the pause between two, and the stillness before the quiet sound comes (ms). */
  loudMs: number
  gapMs: number
  silenceMs: number
}
/** The game "The still small sound": wind, earthquake and fire come one after the other, God is not in them; the child must not tap them and taps only the quiet sound at the end. */
export interface WhisperGame {
  background: string
  /** Elijah standing and listening, and Elijah with the cloak over his face (sprites). */
  standing: string
  veiled: string
  /** The cave mouth where Elijah stands: the middle of his feet (percent of the picture) and his width. */
  elia: { x: number; y: number; w: number }
  wind: string
  fire: string
  cracks: string
  feather: string
  rounds: WhisperRound[]
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
  stew?: StewGame
  cairn?: CairnGame
  relay?: RelayGame
  ring?: RingGame
  birds?: BirdsGame
  rings?: RingsGame
  silver?: SilverGame
  clues?: CluesGame
  focus?: FocusGame
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
  weave?: WeaveGame
  glow?: GlowGame
  diff?: DiffGame
  beat?: BeatGame
  manna?: MannaGame
  words?: WordsGame
  cross?: CrossGame
  cloud?: CloudGame
  constellation?: ConstellationGame
  overboard?: OverboardGame
  shore?: ShoreGame
  sacks?: SacksGame
  shade?: ShadeGame
  days?: DaysGame
  statue?: StatueGame
  lamp?: LampGame
  hours?: HoursGame
  ravens?: RavensGame
  caves?: CavesGame
  rain?: RainGame
  whisper?: WhisperGame
  glean?: GleanGame
  measure?: MeasureGame
  elders?: EldersGame
  cradle?: CradleGame
  coat?: CoatGame
  cows?: CowsGame
  stone?: StoneGame
  search?: SearchGame
  baggage?: BaggageGame
  gather?: GatherGame
  harp?: HarpGame
  shepherd?: ShepherdGame
  pebbles?: PebblesGame
  sling?: SlingGame
  arrow?: ArrowGame
  hem?: HemGame
  quiet?: QuietGame
  throne?: ThroneGame
  jars?: JarGame
  dive?: DiveGame
  decor?: DecorGame
  honor?: HonorGame
  ride?: RideGame
  post?: PostGame
  peace?: PeaceGame
  forge?: ForgeGame
  crib?: CribGame
  sign?: SignGame
  road?: RoadGame
  net?: NetGame
  boats?: BoatsGame
  roof?: RoofGame
  bail?: BailGame
  crowd?: CrowdGame
  bundle?: BundleGame
  bread?: BreadGame
  row?: RowGame
  turnBack?: TurnBackGame
  shout?: ShoutGame
  dig?: DigGame
  coin?: CoinGame
  meet?: MeetGame
  jugs?: JugsGame
  enough?: EnoughGame
  quails?: QuailsGame
  staffs?: StaffsGame
  serpent?: SerpentGame
  donkey?: DonkeyGame
  commission?: CommissionGame
  arms?: ArmsGame
  judges?: JudgesGame
  signal?: SignalGame
  grapes?: GrapesGame
}

/** One reaper of the gleaning game: the lane he cuts along (index into `GleanGame.lanes`), when he starts (ms after the lead), how long he needs to cross the picture, his picture (index into `GleanGame.reapers`) and the places (percent of the picture width) of the clumps of barley that stand in his lane. */
export interface GleanReaper {
  lane: number
  at: number
  dur: number
  sprite: number
  clumps: number[]
}
export interface GleanRound {
  hint: string
  reapers: GleanReaper[]
}
/** The game "Ears behind the reapers": the reapers cut the standing clumps of a lane from left to right and an ear stays lying where a clump fell; the child taps the lying ears into Ruth's basket; a tap on a clump that still stands is a mistake. */
export interface GleanGame {
  /** The field with the lanes (4:3). */
  background: string
  /** The feet of the reapers and the ground of the clumps and ears: the height of each lane (percent of the picture height). */
  lanes: number[]
  /** The reapers (walking to the right and bent over), the standing clumps and the lying ears (each in a few kinds, the app takes them in turn). */
  reapers: string[]
  clumps: string[]
  ears: string[]
  /** Ruth's basket (a picture) and where it stands (middle, foot and width in percent). */
  basket: string
  basketPos: { x: number; y: number; w: number }
  /** Widths of a reaper, of a clump and of an ear (percent of the picture width). */
  reaperW: number
  clumpW: number
  earW: number
  rounds: GleanRound[]
}

export interface MeasureRound {
  hint: string
  /** The level to reach (1 = to the brim, 0.5 = half); the child may be 8 percent off. */
  mark: number
}
/** The game "Fill the measure": the child holds a finger on the heap of barley, the grain runs into the measure, and lets go at the golden mark; too much spills (a mistake) and the measure is empty again. */
export interface MeasureGame {
  /** The picture of the place (4:3) with the heap of grain. */
  background: string
  /** The measure in five pictures of the same size (empty, a quarter, half, three quarters, full); the app fades between the two nearest ones. */
  states: string[]
  /** Where the measure stands (middle, foot, width in percent of the picture) and where the grain inside is: level 0 at `bottom` and level 1 at `top` (percent of the height of the measure picture, from its top). */
  measure: { x: number; y: number; w: number; top: number; bottom: number }
  /** The heap to hold the finger on (percent of the picture) and where the falling grains begin. */
  heap: { x: number; y: number; w: number; h: number }
  /** The little group of grains that falls (a picture) and its width (percent of the picture width). */
  grain: string
  grainW: number
  /** The golden mark (an arrow that points to the left) and its width (percent of the picture width). */
  markImage: string
  markW: number
  rounds: MeasureRound[]
}

/** One person who walks across the square in front of the gate. */
export interface EldersWalker {
  kind: 'elder' | 'other'
  /** The index into `EldersGame.elders` (elder) or `EldersGame.others` (other). */
  sprite: number
  at: number
  dur: number
  /** The foot line of the walker (percent of the picture height). */
  y: number
}
export interface EldersRound {
  hint: string
  walkers: EldersWalker[]
}
/** The game "Call ten elders to the gate": people walk across the square, the child taps the old men with gray beards; they walk to their seats in a half circle; a tap on anybody else is a mistake. */
export interface EldersGame {
  /** The square before the gate (4:3). */
  background: string
  /** The ten standing elders and the eight other people (pictures of the same size). */
  elders: string[]
  others: string[]
  /** The ten elders sitting in a half circle (one picture) and where it lies (middle, foot, width in percent) - it fades in when all ten have come. */
  seated: string
  seatedBox: { x: number; y: number; w: number }
  /** The ten places where a called elder stops (the middle of his foot, percent of the picture). */
  seats: { x: number; y: number }[]
  /** The width of a walker and of a called elder (percent of the picture width). */
  walkerW: number
  seatW: number
  rounds: EldersRound[]
}

export interface CradleRound {
  hint: string
  /** How many calm rocks this round needs. */
  calm: number
  /** The next side to tap glows softly (only in the first round). */
  guide: boolean
}
/** The game "Rock the cradle": the child taps the left and the right side of the cradle one after the other, calmly; the baby gets sleepy and falls asleep; too fast, too slow a rhythm, or the same side twice make it restless. */
export interface CradleGame {
  /** The room (4:3) and the cradle in three pictures of the same size (awake, sleepy, asleep). */
  background: string
  states: [string, string, string]
  /** Where the cradle stands (middle, foot, width in percent of the picture). */
  cradle: { x: number; y: number; w: number }
  rounds: CradleRound[]
}

/** One round of the game "The little robe": which of the three boys stands there (index into `CoatGame.boys`), the widths of the robes on offer (percent of the picture width, left to right). Exactly one of them fits (`coatFits`). */
export interface CoatRound {
  hint: string
  boy: number
  coats: number[]
}
/** The game "The little robe": every year Hannah brings Samuel a new robe; he has grown. The child taps the robe that fits (not too small, not too big) from three; a wrong one is a mistake. */
export interface CoatGame {
  /** The room (4:3). */
  background: string
  /** Samuel (one picture, the app shows it in three sizes: he grows) and the width of the picture at each age (percent of the picture width). */
  boy: string
  boyW: number[]
  /** Where Samuel stands (the middle of his foot, percent of the picture). */
  boyPos: { x: number; y: number }
  /** The one picture of the robe (it is shown larger or smaller) and where the robes lie: the foot line (percent of the picture height) and the stretch (percent of the picture width) they are spread over. */
  coat: string
  shelf: { y: number; x0: number; x1: number }
  /** How wide a robe is that fits, compared with the boy (the robe is a little narrower than the boy with his arms out: 0.8). */
  ratio: number
  rounds: CoatRound[]
}

/** One round of the game "Two cows pull home": how strongly the cart drifts to the side (percent of half the road per second) and how long the way is (ms). */
export interface CowsRound {
  hint: string
  drift: number
  dur: number
}
/** The game "Two cows pull home": the cart with the ark goes straight up the road, but the cows are drawn to the grass left and right; the child taps the left or the right half of the picture and the cart is nudged back to the middle. If a wheel touches the grass the cows stop to graze (a mistake) and the cart stands in the middle again. */
export interface CowsGame {
  /** The road (4:3) runs from the bottom toward a town in the distance: where the middle of the cart is at the start (`y0`) and at the end (`y1`, percent of the picture height), the middle of the road there (`cx0`, `cx1`) and half of its width (`half0`, `half1`, percent of the picture width). */
  background: string
  road: { y0: number; y1: number; cx0: number; cx1: number; half0: number; half1: number }
  /** The cart with the two cows and the ark (one picture, seen from behind) and its width at the start (percent of the picture width); it gets smaller with the road. */
  cart: string
  cartW: number
  /** Tufts of grass that stand at the edges of the road (pictures) and where (left/top in percent). */
  tufts: { image: string; x: number; y: number; w: number }[]
  rounds: CowsRound[]
}

/** One pair of landmarks between which a stone must stand: their pictures (index into `StoneGame.marks`) and their places (the middle of their foot, percent of the picture width). */
export interface StonePair {
  a: { image: number; x: number }
  b: { image: number; x: number }
}
export interface StoneRound {
  hint: string
  /** A groove marks the middle of the way (only in the first round). */
  notch: boolean
  pairs: StonePair[]
}
/** The game "The stone of help": the child drags a stone to the middle between two landmarks (the town and the rock) and lets go; eight percent of the distance too far to one side is still right, more is a mistake and the stone goes back. */
export interface StoneGame {
  /** The country (4:3). */
  background: string
  /** The landmarks (pictures of the same scale) and their widths (percent of the picture width). */
  marks: string[]
  markW: number[]
  /** The stone (one picture) and its width; the ground line where the stone stands and where the landmarks stand (percent of the picture height); where the stone waits. */
  stone: string
  stoneW: number
  groundY: number
  startPos: { x: number; y: number }
  rounds: StoneRound[]
}

/** A place of the game "Follow the donkeys": the middle of the round area that is tapped (percent of the picture); the place itself is painted into the map. */
export interface SearchPlace {
  /** The name of the place (it stands under the area). */
  label: string
  x: number
  y: number
  /** The width of the area (percent of the picture width). */
  w: number
}
export interface SearchRound {
  hint: string
  /** The footprints show the way from place to place (only in the first round). */
  prints: boolean
  /** The order in which the places must be visited (indexes into `SearchGame.places`). */
  order: number[]
}
/** The game "Follow the donkeys": Saul and his servant look for the lost donkeys; the child taps the five places in the order of the story; a wrong place is a mistake. */
export interface SearchGame {
  /** The map of the hills (4:3). */
  background: string
  places: SearchPlace[]
  /** The footprints (pictures, the app takes them in turn) that lie between two places in the first round; the width of one (percent of the picture width). */
  prints: string[]
  printW: number
  /** Saul (a picture) who stands at the place that was visited last, and his width (percent of the picture width). */
  saul: string
  saulW: number
  rounds: SearchRound[]
}

/** A pile of baggage: its picture (index into `BaggageGame.piles`), the middle of its foot (percent of the picture) and its height (percent of the picture height). */
export interface BaggagePile {
  kind: number
  x: number
  y: number
  /** How large the pile is shown compared with its picture (1 = the full size, a tall one that can hide Saul; smaller ones cannot). */
  scale?: number
}
export interface BaggageRound {
  hint: string
  piles: BaggagePile[]
  /** Where Saul hides (index into `piles`). */
  hidden: number
}
/** The game "Where is Saul?": the people look for Saul between the piles of baggage; the child lifts a pile with a tap; under the wrong pile there is only baggage (a mistake). Saul is a head taller than everyone: only a tall pile can hide him. */
export interface BaggageGame {
  /** The camp (4:3). */
  background: string
  /** The piles (pictures of one scale, from low to tall), their widths and their heights (percent of the picture). */
  piles: string[]
  pileW: number[]
  pileH: number[]
  /** Saul behind the pile (a picture), his width and his height (percent of the picture height). */
  saul: string
  saulW: number
  saulH: number
  /** The little things that lie under the piles that hide nobody (a jar, a kid, a basket: the app takes them in turn) and the width of one (percent of the picture width). */
  things: string[]
  thingW: number
  rounds: BaggageRound[]
}

/** A man of the game "Hold the people together": where he stands (the middle of his foot, percent of the picture), his picture (index into `GatherGame.men`) and which way he runs when he leaves (-1 left, 1 right). */
export interface GatherMan {
  sprite: number
  x: number
  y: number
  dir: -1 | 1
}
/** The moment (ms after the start) when a man begins to leave. */
export interface GatherLeave {
  man: number
  at: number
}
export interface GatherRound {
  hint: string
  /** How many days of waiting (every day the sun moves on by one step) and how long a day is (ms). */
  days: number
  dayMs: number
  leaves: GatherLeave[]
}
/** The game "Hold the people together": Saul waits seven days for Samuel; day by day the men get restless and walk away; the child taps a walking man and he comes back. A man who reaches the edge is gone (a mistake, he comes back later, ashamed). At the end Samuel arrives. */
export interface GatherGame {
  /** The hill with the altar (4:3). */
  background: string
  /** The men (pictures of one scale) and the width of one (percent of the picture width). */
  men: string[]
  manW: number
  homes: GatherMan[]
  /** Saul in his red mantle who stands at the altar (a picture and where: the middle of his foot). */
  saul: string
  saulPos: { x: number; y: number; w: number }
  /** The sun that moves from day to day (one picture) and Samuel who arrives (one picture and where he stands: the middle of his foot). */
  sun: string
  samuel: string
  samuelPos: { x: number; y: number; w: number }
  rounds: GatherRound[]
}

/** One round of the game "Calm Saul": how many calm notes Saul needs and how long the pause between two notes must be at least (ms) for a note to be calm. */
export interface HarpRound {
  hint: string
  need: number
  minGap: number
}
/** The game "Calm Saul": Saul sits restless in the hall (three painted states: restless, tired, calm) and David's harp lies in front of the child. Stroking slowly over the eight strings plucks them and calms Saul; fast, jangling strokes make him restless again. */
export interface HarpGame {
  /** The hall (4:3). */
  background: string
  /** Saul in three states (one scale, one place): restless, tired, calm; where he sits (the middle of the chair's foot, percent of the picture) and his width (percent of the picture width). */
  saul: string[]
  saulPos: { x: number; y: number; w: number }
  /** The harp (one picture, seen from the front) and where it stands (the middle of its foot) with its width; where the strings lie inside the picture (fractions of its width and height). */
  harp: string
  harpPos: { x: number; y: number; w: number }
  strings: { n: number; x0: number; x1: number; y0: number; y1: number }
  rounds: HarpRound[]
}

/** A beast that comes toward a lamb: which picture (index into `ShepherdGame.animals`), from which side it comes, which lamb it goes for (index into `lambPos`), when it starts (ms) and how long it needs to reach the lamb (ms). */
export interface ShepherdThreat {
  animal: number
  from: 'left' | 'right'
  lamb: number
  delay: number
  dur: number
}
export interface ShepherdRound {
  hint: string
  threats: ShepherdThreat[]
}
/** The game "Protect the flock": David stands in the pasture, a lion or a bear walks slowly toward a lamb; the child moves David to the lamb that is in danger. If David stands there, the beast stops, hesitates and trots away; if the beast reaches the lamb first, the lamb runs frightened to David (a mistake) and the beast leaves too. Nothing is hurt, nothing is fought. */
export interface ShepherdGame {
  /** The pasture (4:3). */
  background: string
  /** David (one picture), his width (percent of the picture width) and where he starts (the middle of his foot). */
  david: string
  davidW: number
  davidStart: { x: number; y: number }
  /** The beasts (pictures that look to the left; the app mirrors them) and the width of each (percent of the picture width). */
  animals: string[]
  animalW: number[]
  /** The lambs (pictures, the app takes them in turn), the width of one and where each stands (the middle of its foot). */
  lambs: string[]
  lambW: number
  lambPos: { x: number; y: number }[]
  /** Where the beasts come in from (the middle of their foot, percent of the picture): the left and the right edge. */
  edge: { left: { x: number; y: number }; right: { x: number; y: number } }
  /** How near David must stand to a lamb to guard it (percent of the picture width). */
  guard: number
  rounds: ShepherdRound[]
}

/** A stone of the game "Smooth stones": which picture (index into `smooth` or `rough`), the middle of its foot (percent of the picture) and its width (percent of the picture width). */
export interface PebbleStone {
  sprite: number
  x: number
  y: number
  w: number
}
export interface PebbleRound {
  hint: string
  smooth: PebbleStone[]
  rough: PebbleStone[]
}
/** The game "Smooth stones": David picks smooth stones from the brook for his shepherd's bag. The child taps the smooth ones, they fly into the bag; a rough, jagged stone wobbles and stays (a mistake). */
export interface PebblesGame {
  /** The brook (4:3). */
  background: string
  /** The smooth stones and the rough stones (pictures of one scale, the app takes the ones named in a round). */
  smooth: string[]
  rough: string[]
  /** The shepherd's bag (one picture) and where it lies (the middle of its foot) with its width. */
  bag: string
  bagPos: { x: number; y: number; w: number }
  rounds: PebbleRound[]
}

/** One round of the game "The sling": how long the stone needs for one turn (ms), how many degrees the aim may be off, and where Goliath stands (the middle of his foot, percent of the picture) with his width and the place of his forehead. */
export interface SlingRound {
  hint: string
  period: number
  tol: number
  goliat: { x: number; y: number; w: number }
  head: { x: number; y: number }
}
/** The game "The sling": David swings the sling, the stone circles round his hand; a fine ray shows where the stone would fly if it were let go and lights up when it points at Goliath. A tap lets the stone go. A hit makes Goliath fall (a second picture, calm, no blood); a miss is a mistake. */
export interface SlingGame {
  /** The valley (4:3). */
  background: string
  /** David (one picture), his width and where he stands (the middle of his foot); the hand with the sling (percent of the picture) and the radius of the turn (percent of the picture width). */
  david: string
  davidPos: { x: number; y: number; w: number }
  hand: { x: number; y: number }
  radius: number
  /** Goliath standing and Goliath on the ground (pictures of one scale); the stone (one picture) and its width. */
  goliat: string
  goliatFallen: string
  /** How wide the picture of Goliath on the ground is compared with the picture of Goliath standing (both painted at one scale). */
  fallenScale: number
  stone: string
  stoneW: number
  rounds: SlingRound[]
}

/** One round of the game "The sign of the arrows": which sign Jonathan sends, how many arrows, and where the arrow must land (percent of the picture width, from–to). */
export interface ArrowRound {
  hint: string
  sign: 'peace' | 'flee'
  arrows: number
  zone: { from: number; to: number }
}
/** The game "The sign of the arrows": the child pulls the string back and lets go; the farther it is pulled, the farther the arrow flies. In the first round the arrow must land behind the boy (the sign of peace), in the second before him (the sign to flee). */
export interface ArrowGame {
  /** The field (4:3). */
  background: string
  /** Jonathan (one picture, seen from the side), where he stands and his width; the boy (one picture) and where he stands. */
  jonatan: string
  jonatanPos: { x: number; y: number; w: number }
  boy: string
  boyPos: { x: number; y: number; w: number }
  /** The arrow (one picture, pointing right), its width, where it leaves the bow, the ground line where it lands (percent of the picture height) and the landing places for a pull of 0 and of 1 (percent of the picture width). */
  arrow: string
  arrowW: number
  shootFrom: { x: number; y: number }
  groundY: number
  range: { min: number; max: number }
  rounds: ArrowRound[]
}

/** One round of the game "The hem": how far off the seam the finger may wander (percent of the picture width) and the seam itself (points, percent of the picture). */
export interface HemRound {
  hint: string
  tol: number
  path: { x: number; y: number }[]
}
/** The game "The hem": in the cave Saul stands with his back to David; the child follows the seam of the mantle with a finger, quietly. Wandering off the seam is a mistake (Saul looks around) and the stroke begins again. When the seam is done the picture changes to David with the corner in his hand. */
export interface HemGame {
  /** The cave with Saul from behind (4:3). */
  background: string
  /** David holding the corner (4:3), shown when the last seam is done. */
  reward: string
  rounds: HemRound[]
}

/** One gap in the foundation of the game "Lay the stones quietly": where a stone comes to lie (the middle, percent of the picture) and how wide it is. */
export interface QuietGap {
  x: number
  y: number
  w: number
}
/** One round: the gaps, where the stones wait (the middle of each stone, percent of the picture) and how fast a stone may be pulled at most (percent of the picture width per second). */
export interface QuietRound {
  hint: string
  gaps: QuietGap[]
  starts: { x: number; y: number }[]
  max: number
}
/** The game "Lay the stones quietly": on the building site of God's house the child pulls smooth stones to the gaps of the foundation, slowly and without clatter; a stone that is pulled too fast clacks and goes back (a mistake). */
export interface QuietGame {
  /** The building site (4:3). */
  background: string
  /** The pictures of the stones (taken in turn) and the width of one (percent of the picture width). */
  stones: string[]
  stoneW: number
  rounds: QuietRound[]
}

/** A place for a lion on the throne: the middle (percent of the picture), the width of the circle and which side of the throne it is on. */
export interface ThroneSlot {
  x: number
  y: number
  w: number
  side: 'left' | 'right' | 'arm-left' | 'arm-right'
}
/** One round of the game "Build the throne": the slots to fill and the lions that wait (the way each looks; as many as there are slots). */
export interface ThroneRound {
  hint: string
  slots: ThroneSlot[]
  lions: ('left' | 'right')[]
}
/** The game "Build the throne": the ivory throne with six empty steps; the child puts the golden lions on the steps, one on the left and one on the right of every step (they look toward the middle), and two at the armrests. */
export interface ThroneGame {
  /** The hall with the empty throne (4:3). */
  background: string
  /** One lion that looks to the left (the app mirrors it) and the width of the lion in the hand (percent of the picture width). */
  lion: string
  lionW: number
  rounds: ThroneRound[]
}

/** One jar of the game "Fill the jars": the middle of its foot (percent of the picture), its width, which picture it uses and how long it takes to fill (ms). */
export interface JarSlot {
  x: number
  y: number
  w: number
  sprite: number
  ms: number
}
/** One round: the jars that stand in a row on the ground. */
export interface JarRound {
  hint: string
  jars: JarSlot[]
}
/** The game "Fill the jars": the widow's oil does not stop; the child moves the oil jug over the jars one after the other. A jar that is already full and still gets oil spills over (a mistake). */
export interface JarGame {
  /** The courtyard (4:3). */
  background: string
  /** The pictures of the empty jars (taken by `JarSlot.sprite`). */
  jars: string[]
  /** The oil jug, its width (percent of the picture width) and where it hangs at the start (the middle of the jug, percent of the picture). */
  jug: string
  jugW: number
  jugStart: { x: number; y: number }
  rounds: JarRound[]
}

/** The game "Dip seven times": Naaman stands in the Jordan; the child taps when the water is calm and he dips; seven dips make him well. */
export interface DiveGame {
  /** The river (4:3). */
  background: string
  /** Naaman standing in the water (cut off at the hips), and the same man healthy with raised arms; both picture files have the same size and place. */
  naaman: string
  naamanNew: string
  /** The ring of water that spreads after every dip. */
  ripple: string
  /** The middle of the bottom edge of Naaman's picture and its width (percent of the picture). */
  pos: { x: number; y: number; w: number }
  /** The middle and the width of the ring on the water. */
  ripplePos: { x: number; y: number; w: number }
  /** How many dips (seven), how long he stays under water and how long the water needs to calm down (ms). */
  dips: number
  underMs: number
  calmMs: number
  hint: string
}

/** One place on the picture of the game "Decorate the feast": the middle (percent of the picture) and the width. */
export interface DecorSlot {
  x: number
  y: number
  w: number
}
/** One thing that waits in the row: its picture and the design it has (two things with the same design are twins). */
export interface DecorItem {
  image: string
  key: string
}
/** One round of "Decorate the feast". `order`: place i takes only the thing named in `want[i]`; `distinct`: every place takes any thing, but a design that is already on the table is refused. */
export interface DecorRound {
  hint: string
  mode: 'order' | 'distinct'
  slots: DecorSlot[]
  items: DecorItem[]
  want?: string[]
  /** The width of the thing in the hand (percent of the picture). */
  ghostW: number
}
/** The game "Decorate the feast": the garden court in Susa is decorated the way the text says (cloths on the pillars, the marble floor, the cups on the table). */
export interface DecorGame {
  /** The garden court (4:3). */
  background: string
  rounds: DecorRound[]
}

/** One choice of a round of "Honor the man": the picture, whether it is what Haman named, and a short name for the screen reader. */
export interface HonorChoice {
  image: string
  right: boolean
  label: string
}
/** One round: the king's man names one kind of thing (clothes, something for the head, an animal) and four things lie in a row. */
export interface HonorRound {
  hint: string
  choices: HonorChoice[]
}
/** The game "Honor the man": in three rounds the child finds what Haman named (royal clothes, a crown, the king's horse); then the street shows Mordecai on the horse, led by Haman. */
export interface HonorGame {
  /** The street of Susa (4:3), and the picture of the finished parade (4:3). */
  background: string
  parade: string
  rounds: HonorRound[]
}

/** One place on the map of the night ride: its name (shown under it), the middle (percent of the picture) and the width of its ring. */
export interface RideSpot {
  id: string
  label: string
  x: number
  y: number
  w: number
}
/** One round of the night ride: the places in the order of the text, and whether the list of the places is shown above the picture. */
export interface RideRound {
  hint: string
  order: string[]
  showList: boolean
}
/** The game "The ride by night": Nehemiah rides around the broken wall; the child taps the five places in the order of the text. */
export interface RideGame {
  /** The night picture of the city (4:3). */
  background: string
  /** Nehemiah on the donkey (a picture), its width (percent of the picture) and where the ride starts (the middle of its feet, percent). */
  rider: string
  riderW: number
  start: { x: number; y: number }
  spots: RideSpot[]
  rounds: RideRound[]
}

/** A builder of the game "The trumpet calls": the middle of his feet (percent of the picture) and, when it differs from the others, his width. */
export interface PostWorker {
  x: number
  y: number
  w?: number
}
/** One round: where the trumpeter stands and where the builders stand. */
export interface PostRound {
  hint: string
  horn: { x: number; y: number }
  workers: PostWorker[]
}
/** The game "The trumpet calls": the builders stand far apart along the wall; the child taps each one and he walks to the trumpeter. */
export interface PostGame {
  /** The wall (4:3). */
  background: string
  /** The pictures of the builders (they are used in turn), their usual width (percent). */
  workers: string[]
  workerW: number
  /** Nehemiah with the trumpeter (a picture) and its width, and the golden arcs of the sound. */
  horn: string
  hornW: number
  wave: string
  rounds: PostRound[]
}

/** One animal of the game "Peace among the animals": its picture, its name and its width (percent of the picture). */
export interface PeaceAnimal {
  id: string
  image: string
  label: string
  w: number
}
/** One pair of the text: the animal that is dangerous (the predator) and the one that lives safely beside it (the prey). */
export interface PeacePair {
  predator: string
  prey: string
}
/** One round of the game: the order of the prey on the strip below (from left to right) and whether the list of the pairs is shown above the picture. */
export interface PeaceRound {
  hint: string
  showList: boolean
  preyOrder: string[]
}
/** The game "Peace among the animals" (Isaiah 11,6-9): the child brings the animals together as the text says. */
export interface PeaceGame {
  /** The meadow (4:3). */
  background: string
  animals: PeaceAnimal[]
  pairs: PeacePair[]
  /** Where the predators stand, one place per pair (the middle of their feet, percent of the picture); the prey walks up beside them. */
  spots: { x: number; y: number }[]
  /** The height of the strip where the prey waits (percent). */
  stripY: number
  /** The little boy who comes in at the end, and his width (percent). */
  boy: string
  boyW: number
  rounds: PeaceRound[]
}

/** One thing of the game "The forge": a weapon, a tool, the hammer or the glowing metal (a picture, its name and its width in percent). */
export interface ForgeItem {
  id: string
  image: string
  label: string
  w: number
}
/** One round of the forge: the weapon on the anvil, the tool it becomes, the tools to choose from and the number of blows. */
export interface ForgeRound {
  hint: string
  item: string
  result: string
  options: string[]
  hits: number
}
/** The game "The forge" (Micah 4,3): the child beats a sword into a plowshare and a spear into a pruning hook. */
export interface ForgeGame {
  /** The smithy (4:3). */
  background: string
  items: ForgeItem[]
  /** The id of the glowing metal and of the hammer among the items. */
  hot: string
  hammer: string
  /** The middle of the foot of the anvil's top (percent) and the usual width of a thing on it (percent). */
  anvil: { x: number; y: number }
  itemW: number
  rounds: ForgeRound[]
}

/** One thing of the game "The manger": a cloth or a bed to choose from (a picture, its name and its width in percent of the picture). */
export interface CribItem {
  id: string
  image: string
  label: string
  w: number
}
/** One round of the manger: the three things to choose from and the right one (the cloth the child is wrapped in, the bed he is laid in). */
export interface CribRound {
  hint: string
  options: string[]
  right: string
}
/** The game "The manger" (Luke 2,7): the child helps Mary to wrap the newborn baby in swaddling cloths and to lay him in the manger. */
export interface CribGame {
  /** The simple shelter (4:3). */
  background: string
  /** Mary and Joseph (a picture) with their middle and width, the wrapped baby and the manger with the baby (pictures) with their place and width (percent of the picture). */
  parents: string
  parentsAt: { x: number; y: number }
  parentsW: number
  baby: string
  babyAt: { x: number; y: number }
  babyW: number
  manger: string
  mangerAt: { x: number; y: number }
  mangerW: number
  items: CribItem[]
  rounds: CribRound[]
}

/** One place of the game "Find the sign": a house, an empty house or the shelter with the manger (a picture and its name). */
export interface SignPlace {
  id: string
  image: string
  label: string
}
/** One round: which place stands in which of the six slots (from the top left to the bottom right) and the right place. */
export interface SignRound {
  hint: string
  order: string[]
  right: string
}
/** The game "Find the sign" (Luke 2,12.16): the shepherds look for the child in swaddling cloths in a manger; the child taps the places. */
export interface SignGame {
  /** The street (4:3). */
  background: string
  places: SignPlace[]
  /** The six slots: middle of the bottom edge of a place and its width (percent of the picture). */
  slots: { x: number; y: number; w: number }[]
  /** The shepherds (a picture), their width and where they stand at the start (middle of their feet, percent). */
  walker: string
  walkerW: number
  start: { x: number; y: number }
  rounds: SignRound[]
}

/** One thing of the game "Prepare the way": a stone, a thornbush, a branch or a traveler (a picture, its name and its width in percent of the picture). */
export interface RoadItem {
  id: string
  image: string
  label: string
  w: number
}
/** A place on the road: which thing stands there (the middle of its bottom edge, percent of the picture); a traveler (`keep`) must not be tapped. */
export interface RoadSpot {
  item: string
  x: number
  y: number
  keep?: boolean
}
/** One round of the road: the hint and the things that lie on it. */
export interface RoadRound {
  hint: string
  spots: RoadSpot[]
}
/** The game "Prepare the way" (Matthew 3,3): the child clears the road of stones, thorns and branches for the Lord and leaves the travelers alone. */
export interface RoadGame {
  /** The empty road in the wilderness (4:3). */
  background: string
  items: RoadItem[]
  rounds: RoadRound[]
}

/** A kind of fish in the net game (a picture facing right, its width in percent of the picture). */
export interface NetFish {
  id: string
  image: string
  w: number
}
/** One round of the net game: which fish swim (ids, a kind may be used several times), how fast (picture widths a second) and the hint. */
export interface NetRound {
  hint: string
  fish: string[]
  speed: number
}
/** The game "Cast the net" (Matthew 4,18): fish swim in the lake; a tap casts the round net there and takes in every fish under it. */
export interface NetGame {
  /** The lake (4:3). */
  background: string
  fish: NetFish[]
  /** The spread net (a picture), its width in percent of the picture and the reach in percent of the width inside which fish are caught. */
  net: string
  netW: number
  reach: number
  /** Where the fish may swim (percent of the picture). */
  area: { x: number; y: number; w: number; h: number }
  rounds: NetRound[]
}

/** A boat of the game "Fill both boats": its picture (a raised side view, ratio width to height), its name, its width in percent of the picture, where the middle of its water line lies, and the place for the fish inside (percent of the boat's picture). */
export interface BoatsBoat {
  id: string
  image: string
  label: string
  w: number
  ratio: number
  x: number
  y: number
  deck: { x: number; y: number; w: number; h: number }
}
/** A kind of fish that jumps into the boats (a picture, its width in percent of the picture). */
export interface BoatsFish {
  id: string
  image: string
  w: number
}
/** One round of the boats: the hint and how many fish each boat holds (one number for every boat). */
export interface BoatsRound {
  hint: string
  capacity: number[]
}
/** The game "Fill both boats" (Luke 5,7): fish from the full net are sent into two boats until both are full to the mark, so full that they almost sink. */
export interface BoatsGame {
  /** The lake (4:3). */
  background: string
  boats: BoatsBoat[]
  fish: BoatsFish[]
  /** The net full of fish above the lake: its picture and where the middle of its bottom edge lies (percent of the picture) and its width. */
  pile: string
  pileAt: { x: number; y: number; w: number }
  rounds: BoatsRound[]
}

/** A person (or a group) who sits in the house of the roof game: a picture, its name and its width in percent of the picture. */
export interface RoofPerson {
  id: string
  image: string
  label: string
  w: number
}
/** Where a person sits: the middle of the person on the floor (percent of the picture width). */
export interface RoofSpot {
  person: string
  x: number
}
/** One round of the roof: the hint, how many pieces the roof has, which of them (numbers from 0) lie above the free place, where Jesus sits and where the bed lands, and the people. */
export interface RoofRound {
  hint: string
  cols: number
  free: number[]
  jesusX: number
  matX: number
  spots: RoofSpot[]
}
/** The game "Open the roof" (Mark 2,4): the roof is taken off above Jesus (and only there), then four friends let the bed with the sick man down. */
export interface RoofGame {
  /** The house without a roof, seen from the side (4:3). */
  background: string
  /** The strip of the roof (a picture) and where it lies (percent of the picture); it is cut in `cols` pieces. */
  roof: string
  area: { x: number; y: number; w: number; h: number }
  /** The height of the floor where the people sit (percent of the picture). */
  floor: number
  jesus: { image: string; label: string; w: number }
  people: RoofPerson[]
  /** The bed with the man (ratio width to height) and the rope (a picture that is stretched down), and the four friends at the hole. */
  mat: { image: string; label: string; w: number; ratio: number }
  rope: { image: string; w: number }
  carriers: { image: string; w: number }
  rounds: RoofRound[]
}

/** A picture of a place on a game field: a name for the screen reader and the width in percent of the picture (the height follows the picture). */
export interface WunderSprite {
  image: string
  label: string
  w: number
}

/** A form of puddle of the game "Bail out the boat": its picture and its width in percent of the picture when the puddle is full. */
export interface BailPuddleKind {
  id: string
  image: string
  w: number
}
/** One round of the bailing: the hint, how many puddles are to be scooped away in all, and the seconds between two waves. */
export interface BailRound {
  hint: string
  total: number
  every: number
}
/** The game "Bail out the boat" (Mark 4,37): the waves throw water into the boat; a tap on a puddle scoops a cup of it overboard (three scoops for one puddle). Four puddles at once flood the boat (one mistake a round). */
export interface BailGame {
  /** The inside of the boat seen from above (3:2). */
  background: string
  /** The forms of the puddle (a place always has the same form: the place number modulo the number of forms). */
  puddles: BailPuddleKind[]
  cup: { image: string; w: number }
  /** The places where a puddle can lie (the middle, percent of the picture); at least five. */
  spots: { x: number; y: number }[]
  rounds: BailRound[]
}

/** One round of the crowd: the hint and the rows of people, the top row first (five places per row, 0 = free, 1 or more = the picture of the person); they stand right above the place where the pair starts. */
export interface CrowdRound {
  hint: string
  rows: number[][]
}
/** The game "Through the crowd" (Mark 5,24): the street is a grid of 5 × 6 places; a tap makes a person step aside (when the place beside him is free), the pair of Jesus and Jairus walks up the middle column as soon as the place in front of it is free. */
export interface CrowdGame {
  /** The street seen from above, the house of Jairus at the top (3:2). */
  background: string
  /** The grid of the street (percent of the picture): 5 columns, 6 rows. */
  area: { x: number; y: number; w: number; h: number }
  /** Jesus and Jairus (one picture), `w` is its width in percent of the picture. */
  pair: WunderSprite
  /** The pictures of the people (the number 1 in a row is the first one, and so on round again). */
  people: WunderSprite[]
  /** The door of the house (the middle of the pair when it has come in, percent of the picture). */
  door: { x: number; y: number }
  rounds: CrowdRound[]
}

/** A thing of the cloth: its picture, its name (also written under it) and its width in percent of the picture. */
export interface BundleThing extends WunderSprite {
  id: string
}
/** A thing on the cloth in a round: which one, whether Jesus allowed it, and the middle of its place (percent of the picture). */
export interface BundleItem {
  thing: string
  allowed: boolean
  x: number
  y: number
}
/** One round of the bundle: the hint and the things on the cloth. */
export interface BundleRound {
  hint: string
  items: BundleItem[]
}
/** The game "Pack the bundle" (Mark 6,8-9): only a staff, sandals and one shirt may go with the disciples; a tap on an allowed thing sends it into the bundle, a forbidden thing stays (a cross). */
export interface BundleGame {
  /** The table with the cloth (3:2). */
  background: string
  things: BundleThing[]
  /** The bundle (its place is the middle of its picture, percent of the picture) and the disciple who stands beside it. */
  bundle: WunderSprite & { x: number; y: number }
  disciple: WunderSprite & { x: number; y: number }
  rounds: BundleRound[]
}

/** A group of people on the grass: a picture, a name, the middle of the group and its width (percent of the picture). */
export interface BreadGroup extends WunderSprite {
  id: string
  x: number
  y: number
}
/** One round of the bread: the hint and what the child does (`feed` the groups, `collect` the baskets with the leftovers). */
export interface BreadRound {
  hint: string
  kind: 'feed' | 'collect'
}
/** The game "Share the bread" (Mark 6,39-43): a tap on a group has a disciple bring bread and fish to it (the basket stays full); then the twelve baskets with the leftovers are gathered. */
export interface BreadGame {
  /** The green meadow (3:2). */
  background: string
  groups: BreadGroup[]
  /** The basket with the five loaves and the two fish (the middle of its bottom edge, percent of the picture). */
  basket: WunderSprite & { x: number; y: number }
  /** The disciple who brings the bread (one picture). */
  disciple: { image: string; w: number }
  /** The baskets with the leftovers: one picture shown `count` times, the area where they lie (percent of the picture). */
  leftover: { image: string; label: string; w: number; count: number; area: { x: number; y: number; w: number; h: number } }
  rounds: BreadRound[]
}

/** One round of the rowing: the hint, how many strokes the way takes and the wind (degrees a second that the wind turns the bow; positive to the right). */
export interface RowRound {
  hint: string
  distance: number
  wind: number
}
/** The game "Row against the wind" (Mark 6,48): two big areas, left and right oar; the wind turns the boat, whoever rows left and right in turn keeps it straight and gets on; whoever rows on one side only turns it. */
export interface RowGame {
  /** The lake at night seen from above, the far shore at the top (3:2). */
  background: string
  /** The boat seen from above with its two oars (ratio width to height). */
  boat: WunderSprite & { ratio: number }
  /** Jesus on the water, who stands beside the boat at the end (the middle, percent of the picture). */
  jesus: WunderSprite & { x: number; y: number }
  /** The height of the middle of the boat at the start and at the end of a round (percent from the top). */
  start: number
  goal: number
  rounds: RowRound[]
}

/** One round of "Who turns back?": the hint, the seconds the child has to find the man who turns back (4), and whether the men wander over the road and cross each other (round 2). */
export interface TurnBackRound {
  hint: string
  seconds: number
  crossing: boolean
}
/**
 * The game "Who turns back?" (Luke 17,14-16): ten men walk in a row along a country road to the house of the priests (a house at the right edge of the picture), Jesus stands with two disciples at the left edge.
 * After a few seconds the hands of the men show clean (sparkles and ticks), then one of them, the Samaritan, turns round and runs slowly back to Jesus; the child taps him within `seconds`.
 * A tap on another man is a mistake (the man wobbles, a cross), a round that runs out of time is a mistake and starts again. The right man runs to Jesus and kneels ("Thank you!"), the other nine walk on.
 * Two mistakes in a round already give "Go on (1 star)". Stars: `heilungStars(mistakes, rounds)`.
 */
export interface TurnBackGame {
  /** The country road seen from the side with the house of the priests at the right edge (3:2). */
  background: string
  /** The six pictures of the nine other men (a picture used a second time is mirrored); `w` is the width in percent of the picture. */
  men: WunderSprite[]
  /** The Samaritan with the blue and white striped headscarf. */
  samaritan: WunderSprite
  /** Jesus with two disciples at the left edge: his picture, and the middle of his feet (percent of the picture). */
  jesus: WunderSprite & { x: number; y: number }
  /**
   * The road (percent of the picture): `y` the height of the feet of the row, `spread` the band in which the men cross each other (round 2), `startX` the middle of the last man of the row at the start,
   * `gap` the distance between two men, `houseX` the place at the door where the men stop.
   */
  road: { y: number; spread: number; startX: number; gap: number; houseX: number }
  rounds: TurnBackRound[]
}

/** One round of "Shout louder": the hint, the seconds (they run from the first tap), the taps that fill the bar, how often the crowd says "Quiet!", and how far it pushes the bar back (in taps; 3 when not given). */
export interface ShoutRound {
  hint: string
  seconds: number
  need: number
  hushes: number
  push?: number
}
/**
 * The game "Shout louder" (Mark 10,46-49): Bartimaeus sits by the road before Jericho; Jesus, the disciples and a crowd walk by on the road above. A big button "Call out" (and Bartimaeus himself) fills a bar with every tap.
 * From time to time the crowd says "Quiet!" (speech bubbles at the top) and pushes the bar back a little. Bar full in time: the group stops, a man of the crowd waves "Come!". Time over: a mistake, the group walks on, the round begins again;
 * from 60 % of the bar in the first round "Go on (1 star)" is offered. Stars: `heilungStars(mistakes, rounds)`.
 */
export interface ShoutGame {
  /** The road before Jericho (3:2). */
  background: string
  /** Bartimaeus by the road: his picture and the middle of his feet. */
  bartimaeus: WunderSprite & { x: number; y: number }
  /** The group of Jesus, the disciples and the crowd: one picture that walks from `from` to `to` (the middle, percent of the width) at the height `y` (the feet) while the round runs. */
  group: WunderSprite & { y: number; from: number; to: number }
  /** The man of the crowd who waves "Come!": his picture, his place beside the group (`dx` percent of the width to the right of the middle of the group) and the height of his feet. */
  waver: WunderSprite & { dx: number; y: number }
  rounds: ShoutRound[]
}

/** A helper of the game "Hold the arms" (Aaron on the left, Hur on the right): his picture (kneeling, one arm stretched up), his name, his width (percent of the picture) and the middle of his bottom edge. */
export interface ArmsHelper {
  id: string
  image: string
  label: string
  w: number
  x: number
  y: number
}
/** One round of the arms: the hint, whether Aaron and Hur help (then the child taps them one after the other), how many seconds the arms have to stay up, and how fast they sink (a share of the way per second). */
export interface ArmsRound {
  hint: string
  helpers: boolean
  goal: number
  sink: number
}
/** The game "Hold the arms" (Exodus 17,11-12): while Moses holds his hands up Israel wins; the child holds them up until the sun goes down. */
export interface ArmsGame {
  /** The hilltop (4:3). */
  background: string
  /** Moses on his stone with the arms down, halfway up and up (the same size, the same stone). */
  poses: [string, string, string]
  moses: { label: string; w: number; x: number; y: number }
  helpers: ArmsHelper[]
  rounds: ArmsRound[]
}

/** A seat of the game "Share the cases": one of the men who judge (the picture of a man, his name, his width in percent of the picture and the middle of his feet); Moses sits at the one with `moses`. */
export interface JudgeSeat {
  id: string
  image: string
  label: string
  w: number
  x: number
  y: number
  moses?: boolean
}
/** A case (a quarrel): its picture, what it is, and whether it is a small matter (any judge decides it) or a great one (it goes to Moses). */
export interface JudgeCase {
  id: string
  image: string
  label: string
  weight: 'small' | 'great'
}
export interface JudgesRound {
  hint: string
  /** The cases of this round (ids of `JudgesGame.cases`). */
  cases: string[]
}
/** The game "Share the cases" (Exodus 18,22): small cases go to the men who judge, the great ones to Moses. */
export interface JudgesGame {
  /** The court (4:3). */
  background: string
  seats: JudgeSeat[]
  cases: JudgeCase[]
  /** The width of a case card in percent of the picture. */
  caseW: number
  rounds: JudgesRound[]
}

export type SignalId = 'all' | 'leaders' | 'break'
/** An answer picture of the signal game: what the sound means (the whole people gathers, only the leaders come, the camp breaks up). */
export interface SignalChoice {
  id: SignalId
  image: string
  label: string
}
/** One round of the signals: the hint and its questions; a question is a row of signals that is blown (one in round 1, three in a row in round 2) and that the child answers in the same order. */
export interface SignalRound {
  hint: string
  questions: SignalId[][]
}
/** The game "The silver trumpets" (Numbers 10,1-10): two trumpets mean the whole people comes together, one means the leaders come, another blast means the camp breaks up. */
export interface SignalGame {
  /** The camp (4:3). */
  background: string
  /** The two priests with their trumpets (one picture, the middle of its bottom edge and its width in percent of the picture). */
  priests: { image: string; label: string; w: number; x: number; y: number }
  /** The sound files of the three signals and how long each lasts (seconds). */
  sounds: Record<SignalId, { file: string; seconds: number }>
  choices: SignalChoice[]
  rounds: SignalRound[]
}

/** One round of the grapes: the hint, how many seconds the way takes, how strongly the pole wobbles (0 to 1) and whether the way goes over hills. */
export interface GrapesRound {
  hint: string
  seconds: number
  wobble: number
  hills: boolean
}
/** The game "Carry the grapes" (Numbers 13,23): two men carry a huge cluster of grapes on a pole; the child keeps the pole level. */
export interface GrapesGame {
  /** The way along the brook Eshcol (4:3). */
  background: string
  /** The two scouts (one picture each, seen from the side walking to the right): the one at the back and the one in front; their width and where they stand (middle of their feet, percent of the picture). */
  men: { image: string; label: string; w: number; x: number; y: number }[]
  /** The pole with the cluster (one picture; its width, the middle of the pole in percent of the picture). */
  pole: { image: string; label: string; w: number; x: number; y: number }
  /** A berry that falls off. */
  berry: { image: string; w: number }
  /** How many berries the cluster has (a berry falls when the pole tips too far). */
  berries: number
  rounds: GrapesRound[]
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
  /** The most stars any try has given (a worse try later never takes stars away). */
  bestStars?: number
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


/** A picture on the field of one of the three games of "Stories of Jesus" (`dig`, `coin`, `meet`): its file, a name for the screen reader and its width in percent of the picture (the height follows the picture). */
export interface GleichnisSprite {
  image: string
  label: string
  w: number
}

/**
 * One round of "Dig for the treasure" (Matthew 13,44-46). Round `field`: twelve mounds (four to a row) lie on the field, one of them hides the chest; `treasure` is its column and row (from 0),
 * `cells` the middles of the twelve mounds (percent of the picture, row by row). Round `pearls`: five pearls lie on the table of the merchant at the places `slots` (middles, percent), the best one
 * (the biggest, round, white one) at place `best`.
 */
export interface DigRound {
  kind: 'field' | 'pearls'
  hint: string
  treasure?: [number, number]
  cells?: [number, number][]
  best?: number
  slots?: [number, number][]
}
/**
 * The game "Dig for the treasure" (Matthew 13,44-46; `dig`): round 1, the field: a tap on a mound digs it open; an empty hole shows a small arrow that points towards the chest (eight directions,
 * a mistake without any loss); the chest opens (coins glimmer). Round 2, the pearl: the merchant has five pearls on his table, the child taps the most precious one (the biggest, round, white one);
 * a wrong pearl wobbles and gets a cross. Stars: `gleichnisStars(holes + wrong pearls, rounds)` in `utils/gleichnisseGames.ts`.
 */
export interface DigGame {
  /** The field seen from above with a spade at its edge (3:2). */
  field: string
  mound: GleichnisSprite
  hole: GleichnisSprite
  chest: GleichnisSprite
  chestOpen: GleichnisSprite
  /** The market stall of the merchant (3:2). */
  stall: string
  /** The five pearls: the best one first (`perle-1`), then four smaller, grey or crooked ones. */
  pearls: GleichnisSprite[]
  rounds: DigRound[]
}

/** A thing that lies free on the floor of the room and only looks like a coin (a lid of brass, a pebble): a tap on it is a mistake. The middle of the thing, percent of the picture. */
export interface CoinDecoy {
  kind: 'lid' | 'pebble'
  x: number
  y: number
}
/** One round of "Sweep for the coin": the hint, the room (3:2), the middle of the coin (percent of the picture) and the things that look like a coin. */
export interface CoinRound {
  hint: string
  room: string
  coin: [number, number]
  decoys?: CoinDecoy[]
}
/**
 * The game "Sweep for the coin" (Luke 15,8-10; `coin`): the room of the house is dark; a tap on the lamp lights it. Dust lies on the floor (a canvas, soft, brown-grey); the finger is the broom and sweeps it away
 * (the grid and the share are those of the wiping game, `utils/wipe.ts`). When 60 % of the place of the coin is free the coin glints; a tap on it lifts it, and it flies into the hand of the woman. Round 2 has things on the
 * floor that look like a coin (a tap on them is a mistake) and a "Help" button that makes the place of the coin glimmer (no loss, but no third star). Stars: `coinStars(mistakes, rounds, helped)`.
 */
export interface CoinGame {
  /** The oil lamp: its middle (percent of the picture). */
  lamp: GleichnisSprite & { x: number; y: number }
  coin: GleichnisSprite
  /** The woman kneeling with an open hand: the bottom middle (percent of the picture); the coin flies to her hand. */
  woman: GleichnisSprite & { x: number; y: number }
  /** The broom that follows the finger (only a sign). */
  broom: GleichnisSprite
  lid: GleichnisSprite
  pebble: GleichnisSprite
  rounds: CoinRound[]
}

/** The three gifts of the father (Luke 15,22): the robe, the ring, the shoes. */
export type MeetGiftId = 'kleid' | 'ring' | 'schuhe'
/** One round of "Meet the son": `run` (tap the feet in turn, the father runs) or `gifts` (bring robe, ring and shoes to the son). */
export interface MeetRound {
  kind: 'run' | 'gifts'
  hint: string
}
/**
 * The game "Meet the son" (Luke 15,20-24; `entgegen`). Round 1, the run: the son stands at the left on the country road, the father in the gate at the right; two big feet are the buttons, and the father runs
 * one step when the child taps them in turn, left, right, left, right (`steps` steps; the same foot twice only says "In turn!", no mistake). At the end he falls on the neck of his son (`embrace` replaces both).
 * Round 2, the gifts: in the yard stands the son in rags; the child drags robe, ring and shoes to him (or taps a gift and then the son), in any order; nothing can be wrong, all three stars at the end.
 */
export interface MeetGame {
  /** The country road to the estate (3:2) and the yard (3:2). */
  road: string
  yard: string
  /** The father in the gate at the start (the middle of his feet, percent of the picture) and the son at the left. */
  father: GleichnisSprite & { x: number; y: number }
  son: GleichnisSprite & { x: number; y: number }
  /** The embrace of the two: shown at the middle between the son and the place `meet` where the father stops. */
  embrace: GleichnisSprite
  meet: number
  /** How many steps the father runs (twelve). */
  steps: number
  /** The son in the yard: in rags, with the robe, and in robe, ring and shoes (all the same pose); the middle of his feet. */
  ragged: GleichnisSprite & { x: number; y: number }
  robed: GleichnisSprite
  dressed: GleichnisSprite
  gifts: (GleichnisSprite & { id: MeetGiftId })[]
  rounds: MeetRound[]
}
