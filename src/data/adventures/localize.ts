/**
 * English texts for the adventures without a second copy of the data. The German data stay as they are (pictures, positions, rules);
 * a file in `en/` holds only the words in the same shape (titles, stories, questions, hints, labels, the path of the English recording),
 * and `localize()` lays them over the German ones: every text becomes a property that answers with the English or the German words,
 * depending on `adventureLanguage`. Because the answer is read when a screen is drawn, the screens follow a change of the language.
 *
 * Rules for an English file: the same shape and the same number of entries as the German data (the right answer is the first option
 * in both languages; the test `adventureEnglish.test.ts` compares them), only strings, nothing else.
 */
import { adventureLanguage } from '@/use/adventureLanguage'

/** The shape of the English file for a piece of data: the same keys, only the text parts, everything optional. */
export type TextOverlay<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? TextOverlay<U>[]
    : T extends object
      ? { [K in keyof T]?: TextOverlay<T[K]> }
      : never

const english = new WeakMap<object, unknown>()

/** The English texts that were laid over a piece of data (for the list of files to download and for the tests). */
export function englishTextsOf(target: object): unknown {
  return english.get(target)
}

const isTextList = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string')

function lay(target: any, en: any): void {
  if (!target || typeof target !== 'object' || !en || typeof en !== 'object') return
  for (const key of Object.keys(en)) {
    const e = en[key]
    if (e === undefined || e === null) continue
    const de = target[key]
    if (typeof e === 'string') {
      if (typeof de !== 'string') continue
      let german: string = de
      Object.defineProperty(target, key, {
        get: () => (adventureLanguage.value === 'en' ? e : german),
        set: (v: string) => {
          german = v
        },
        enumerable: true,
        configurable: true
      })
    } else if (isTextList(e)) {
      if (!isTextList(de)) continue
      let german: string[] = de
      Object.defineProperty(target, key, {
        get: () => (adventureLanguage.value === 'en' ? e : german),
        set: (v: string[]) => {
          german = v
        },
        enumerable: true,
        configurable: true
      })
    } else if (Array.isArray(e)) {
      if (Array.isArray(de)) e.forEach((item, i) => lay(de[i], item))
    } else {
      lay(de, e)
    }
  }
}

/** Lays the English texts over the data of an adventure (once) and returns the same object. */
export function localize<T extends object>(target: T, en: TextOverlay<T>): T {
  if (english.has(target)) return target
  english.set(target, en)
  lay(target, en)
  return target
}
