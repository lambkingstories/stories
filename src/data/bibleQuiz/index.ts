/**
 * The Bible quiz: real questions with three levels (1 easy, 2 medium, 3 hard), each with the Bible passage that holds the answer. They are
 * independent of the adventures. The questions are written in German, English and Spanish with the same ids; the language of the app
 * decides which file is loaded (German when there is none).
 */
import type { FamilyQuestion } from '@/utils/familyQuiz'

export type QuizLevel = 1 | 2 | 3

export interface BibleQuizItem {
  id: string
  level: QuizLevel
  q: string
  options: string[]
  /** Index of the right option. */
  answer: number
  /** The passage that holds the answer, e.g. "1. Mose 7,12". */
  ref: string
}

const LOADERS: Record<string, () => Promise<{ default: BibleQuizItem[] }>> = {
  de: () => import('./de.json') as Promise<{ default: BibleQuizItem[] }>,
  en: () => import('./en.json') as Promise<{ default: BibleQuizItem[] }>,
  es: () => import('./es.json') as Promise<{ default: BibleQuizItem[] }>
}

/** A usable item: a text, at least two different options and a right answer among them. */
export function isValidItem(x: unknown): x is BibleQuizItem {
  const i = x as BibleQuizItem
  return !!i && typeof i.q === 'string' && !!i.q && Array.isArray(i.options) && i.options.length >= 2 && new Set(i.options).size === i.options.length && Number.isInteger(i.answer) && !!i.options[i.answer] && (i.level === 1 || i.level === 2 || i.level === 3)
}

export function toQuestion(i: BibleQuizItem): FamilyQuestion {
  return { q: i.q, options: [...i.options], answer: i.answer, from: i.ref, journey: '', stage: '', level: i.level, ref: i.ref }
}

/** All questions of the Bible quiz in this language (the order of the file, the same on every phone). */
export async function loadBibleQuiz(lang: string): Promise<FamilyQuestion[]> {
  const load = LOADERS[lang.slice(0, 2)] ?? LOADERS.de!
  try {
    const items = (await load()).default
    const list = items.filter(isValidItem)
    if (list.length) return list.map(toQuestion)
  } catch {
    // below: German
  }
  const items = (await LOADERS.de!()).default
  return items.filter(isValidItem).map(toQuestion)
}
