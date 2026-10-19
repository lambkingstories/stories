/**
 * Adventure ("Abenteuer"): a journey through a Bible story, told in stages. Every stage has a short text, one task (a game, a
 * coloring page or a quiz) that earns up to three stars, and one to three questions. At the end of a journey comes an
 * exam, and from all the stars and the exam a cup (bronze, silver, gold) and a coloring page as a present.
 */

/** The kinds of tasks. `quiz` means the questions of the stage are the task. */
export type TaskKind = 'quiz' | 'zaehlen' | 'ausmalen' | 'puzzle' | 'weg' | 'ernten' | 'memory' | 'sortieren' | 'wimmelbild' | 'teilen' | 'bauen' | 'punkte' | 'steuern' | 'reihenfolge' | 'giessen' | 'lichter' | 'lueckenvers' | 'echo' | 'kanaele' | 'spiegeln' | 'saeen' | 'hueten'

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
