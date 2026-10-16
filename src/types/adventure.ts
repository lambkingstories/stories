/**
 * Adventure ("Abenteuer"): a journey through a Bible story, told in stages. Every stage has a short text, one task (a game, a
 * coloring page or a quiz) that earns up to three stars, and one to three questions. At the end of a journey comes an
 * exam, and from all the stars and the exam a cup (bronze, silver, gold) and a coloring page as a present.
 */

/** The kinds of tasks. `quiz` means the questions of the stage are the task. */
export type TaskKind = 'quiz' | 'zaehlen' | 'ausmalen' | 'puzzle' | 'weg' | 'ernten' | 'memory' | 'sortieren' | 'wimmelbild'

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
  image: string
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

export interface StageTask {
  kind: TaskKind
  /** One line that says what to do. */
  hint?: string
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
  age: '5-8' | '9-12'
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
