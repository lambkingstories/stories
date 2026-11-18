/**
 * "Familien-Spiele v2": the seven family games with their colour and their painted symbol. One place, so that every game (and the
 * cards, headings and tiles of `components/molecules/family/`) agree. The colours are the ones of the boxes on the page of the family
 * games (`AppFamilyGamesView.vue`); the CSS twin of this list is `src/assets/css/family-v2.css` (`.fam-game--<key>`).
 */
import { prependBaseUrl } from '@/utils/function'

export type FamilyGameKey = 'quiz' | 'activity' | 'who' | 'order' | 'bingo' | 'memory' | 'wortreise'

export const FAMILY_GAMES: FamilyGameKey[] = ['quiz', 'activity', 'who', 'order', 'bingo', 'memory', 'wortreise']

/** The accent of every game (the same as the box on the page of the family games). */
export const FAMILY_ACCENT: Record<FamilyGameKey, string> = {
  quiz: '#2f5fb0',
  activity: '#23808a',
  who: '#b0402f',
  order: '#3d7f76',
  bingo: '#7d52a6',
  memory: '#7a5a30',
  wortreise: '#b45a1f'
}

// the bingo symbol was painted again (the first lamb had too many legs): its file has a new name, so no phone keeps the old picture
const FILE: Partial<Record<FamilyGameKey, string>> = { bingo: 'bingo-2' }

/** The address of the painted symbol of a game (the lamb with a crown); `symbole/<name>.webp`. */
export function familySymbol(key: FamilyGameKey): string {
  return prependBaseUrl(`images/familie/symbole/${FILE[key] ?? key}.webp`)
}
