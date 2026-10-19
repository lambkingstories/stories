/**
 * Adventure ("Abenteuer"): a journey through a Bible story, told in stages. Every stage has a short text, one task (a game, a
 * coloring page or a quiz) that earns up to three stars, and one to three questions. At the end of a journey comes an
 * exam, and from all the stars and the exam a cup (bronze, silver, gold) and a coloring page as a present.
 */

/** The kinds of tasks. `quiz` means the questions of the stage are the task. */
export type TaskKind = 'quiz' | 'zaehlen' | 'ausmalen' | 'puzzle' | 'weg' | 'ernten' | 'memory' | 'sortieren' | 'wimmelbild' | 'teilen' | 'bauen' | 'punkte' | 'steuern'

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
