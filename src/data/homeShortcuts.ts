/**
 * The shortcuts that can be put on the start page besides the five main tiles (see `utils/homeTiles`): where each one leads, its painted symbol and the
 * texts. The main tiles (adventure, book, picture, games, family) are made by the start page itself, because they show where the child stands.
 */
import type { HomeTileId } from '@/utils/homeTiles'

export interface HomeShortcut {
  /** The route name, or `null` for LambKing Plus (it goes through the parental gate, which the start page handles). */
  to: string | null
  /** The painted symbol (under `public/`). */
  image: string
  /** The small icon on the label (see `ZIconography`). */
  icon: string
  /** The small label on the tile: a key of `app.bigGames.home` (`kind…`) or of another text group. */
  kind: string
  title: string
  meta: string
}

const navi = (n: string) => `images/icons/navi/${n}.webp`
const kachel = (n: string) => `images/icons/kacheln/${n}.webp`
const symbol = (n: string) => `images/familie/symbole/${n}.webp`

const family = (to: string, file: string, titleKey: string): HomeShortcut => ({
  to,
  icon: 'profile',
  image: symbol(file),
  kind: 'app.bigGames.rooms.kindFamily',
  title: titleKey,
  meta: 'app.bigGames.home.familyMeta'
})

/** The extra tiles: the keys are text keys (the start page translates them). */
export const HOME_SHORTCUTS: Record<string, HomeShortcut> = {
  stageGames: { to: 'app-games-stage', icon: 'star', image: kachel('kachel-mini-c'), kind: 'app.home.kindGames', title: 'app.bigGames.home.stageGames', meta: 'app.bigGames.home.stageGamesMeta' },
  cards: { to: 'app-collection', icon: 'star', image: kachel('kachel-karten-c'), kind: 'app.bigGames.home.kindRewards', title: 'app.bigGames.home.cards', meta: 'app.bigGames.home.cardsMeta' },
  journal: { to: 'app-journal', icon: 'profile', image: kachel('kachel-ich-tagebuch'), kind: 'app.bigGames.home.kindMe', title: 'app.bigGames.home.journal', meta: 'app.bigGames.home.journalMeta' },
  goodnight: { to: 'app-goodnight', icon: 'series', image: navi('lesen'), kind: 'app.bigGames.home.kindRead', title: 'app.bigGames.home.goodnight', meta: 'app.bigGames.home.goodnightMeta' },
  coloringBooks: { to: 'app-coloring-books', icon: 'brush', image: navi('malen'), kind: 'app.bigGames.home.kindPaint', title: 'app.bigGames.home.coloringBooks', meta: 'app.bigGames.home.coloringBooksMeta' },
  plus: { to: null, icon: 'star', image: navi('plus'), kind: 'app.bigGames.home.kindPlus', title: 'app.bigGames.home.plus', meta: 'app.bigGames.home.plusMeta' },
  quiz: family('app-family-quiz', 'quiz', 'app.family.hub_quiz'),
  activity: family('app-family-activity', 'activity', 'app.family.hub_activity'),
  who: family('app-family-who', 'who', 'app.family.hub_who'),
  order: family('app-family-order', 'order', 'app.family.hub_order'),
  bingo: family('app-family-bingo', 'bingo-2', 'app.family.hub_bingo'),
  memory: family('app-family-memory', 'memory', 'app.family.hub_memory'),
  wortreise: family('app-family-wortreise', 'wortreise', 'app.bigGames.wortreise.hub')
}

export const isShortcut = (id: HomeTileId): boolean => id in HOME_SHORTCUTS
