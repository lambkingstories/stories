/**
 * The texts of all big games are short (Anton, 17 Nov 2026: "kein Mensch liest sich das durch, geschweige denn ein Kind"):
 * the explanation card has at most 3 lines of at most 8 words, the background text at most 25 words, a task at most 12 words, the text of a
 * chapter or world at most 15 words, a hint in the game at most 10 words, a level name at most 3 words. German, english and spanish all keep to it.
 *
 * A new game adds one entry to `SPECS` (the paths of its texts in `app.bigGames.<id>`, `*` stands for every item of a list).
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createI18n } from 'vue-i18n'
import rawApp from '../src/i18n/app'
import teil3 from '../src/i18n/es/teil3'
import { BIG_GAME_TEXTS } from '../src/i18n/bigGames'

type Lang = 'de' | 'en' | 'es'
const LANGS: Lang[] = ['de', 'en', 'es']

interface Spec {
  id: string
  /** The lines of the explanation card (one key each). */
  explain: string[]
  /** The component that shows the card (its source is read to count the lines it really shows). */
  component: string
  /** The background texts (what the game is about): at most 25 words each. */
  background: string[]
  /** The tasks ("Deine Aufgabe: …"): at most 12 words each (without the label). */
  tasks: string[]
  /** The texts of a chapter or a world: at most 15 words each. */
  chapters: string[]
  /** The short hints in the game: at most 10 words each. */
  hints: string[]
  /** The level names: at most 3 words each. */
  levels: string[]
  /** Texts that are knowingly longer than the limits (the returned game "arche", texts kept as they were; to be shortened later, Anton decides): the length checks skip it. */
  longTexts?: boolean
}

const SPECS: Spec[] = [
  { id: 'david', component: 'BigGameDavid', explain: ['howPull', 'howFar', 'howAnimals'], background: ['story', 'goliathStory'], tasks: ['task', 'goliathTask'], chapters: [], hints: ['tip', 'tipEagle', 'tipRocks', 'tipGoliath', 'rotate'], levels: ['levels.*'] },
  { id: 'elia', component: 'BigGameElia', explain: ['howLanes', 'howJump', 'howSlide'], background: ['story'], tasks: ['task'], chapters: ['worldStories.*'], hints: ['tip', 'hungryBanner', 'ravenBanner', 'stumbleBanner', 'rotate'], levels: [] },
  { id: 'wasser', component: 'BigGameWasser', explain: ['howDig', 'howJar', 'howFlowers'], background: ['intro'], tasks: ['story.*.task'], chapters: ['story.*.text'], hints: ['hint.*', 'tipText', 'tipDone', 'goalPending'], levels: ['levels.*'] },
  { id: 'nehemia', component: 'BigGameNehemia', explain: ['howMove', 'howTurn', 'howDrop'], background: ['story'], tasks: ['task', 'chapters.*.task'], chapters: ['chapters.*.story'], hints: ['hint.*', 'lostOne', 'helping', 'quake'], levels: [] },
  { id: 'karawane', component: 'BigGameKarawane', explain: ['howGas', 'howBrake', 'howWater'], background: ['story'], tasks: ['task', 'routeTask.*'], chapters: ['routeStory.*'], hints: ['warn.*', 'tip', 'hopHint', 'rotate'], levels: ['route.*'] },
  { id: 'memory', component: 'BigGameMemory', explain: ['howTurn', 'howPair', 'howMiss'], background: ['story'], tasks: ['task'], chapters: [], hints: ['quiet', 'first', 'miss', 'tipPartner', 'tipKnown', 'tipNone'], levels: [] },
  { id: 'lamm', component: 'BigGameLamm', explain: ['howTap', 'howCrank', 'howFlowers'], background: ['intro'], tasks: ['task', 'story.*.task'], chapters: ['story.*.text'], hints: ['hint.*', 'tipWalk', 'tipNone', 'tipRide', 'tipCrank', 'noWay', 'standing', 'inTheWay', 'called'], levels: ['levels.*'] },
  { id: 'mose', component: 'BigGameMose', explain: ['howCut', 'howTap', 'howLotus'], background: ['story'], tasks: ['task', 'chapters.*.task'], chapters: ['chapters.*.story'], hints: ['hint.*', 'splash', 'stuck', 'tipShown'], levels: [] },
  { id: 'bogen', component: 'BigGameBogen', explain: ['howPull', 'howPower', 'howGoal'], background: ['story', 'ending.text'], tasks: ['task', 'chapters.*.task'], chapters: ['chapters.*.story'], hints: ['hint.*', 'tipWait', 'tipNone', 'tooWeak', 'turn'], levels: ['names.*'] },
  { id: 'bezalel', component: 'BigGameBezalel', explain: ['howMove', 'howTurn', 'howFit'], background: ['story'], tasks: ['task', 'chapters.*.task'], chapters: ['chapters.*.story'], hints: ['hint.*', 'tipShown'], levels: ['levels.*'] },
  { id: 'arche', component: 'BigGameArche', explain: ['howSwap', 'howRow', 'howSpecial'], background: ['story', 'intro'], tasks: ['task', 'chapterTasks.*'], chapters: ['chapterStories.*'], hints: ['tip1', 'tip3', 'tip4', 'tip5', 'tip6', 'tip7', 'tip9', 'tip11', 'tip13', 'tip21', 'tip22', 'bonus', 'flood', 'shuffled', 'hammerHint', 'swapHint'], levels: [], longTexts: true },
  { id: 'wortreise', component: '', explain: [], background: ['sub', 'rule'], tasks: [], chapters: [], hints: ['startHint', 'drawHint', 'freeLetter', 'freeLetterAlone', 'again', 'no', 'noLens', 'letterShown'], levels: [] }
]

const bigGamesOf = (lang: Lang): Record<string, Record<string, unknown>> => {
  const fromApp = (rawApp as unknown as Record<string, { app: { bigGames: Record<string, Record<string, unknown>> } }>)[lang === 'es' ? 'en' : lang].app.bigGames
  const own = lang === 'es' ? (teil3 as unknown as { bigGames: Record<string, Record<string, unknown>> }).bigGames : fromApp
  return { ...own, ...BIG_GAME_TEXTS[lang] }
}

/** Every string at a path (`*` goes through a list or an object). */
function pick(node: unknown, path: string): string[] {
  const [head, ...rest] = path.split('.')
  if (head === undefined) return typeof node === 'string' ? [node] : []
  if (node === null || typeof node !== 'object') return []
  if (head === '*') {
    const items = Array.isArray(node) ? node : Object.values(node as Record<string, unknown>)
    return items.flatMap((x) => (rest.length ? pick(x, rest.join('.')) : typeof x === 'string' ? [x] : []))
  }
  const child = (node as Record<string, unknown>)[head]
  if (rest.length === 0) return typeof child === 'string' ? [child] : []
  return pick(child, rest.join('.'))
}

/** The words of a text: the label of a task ("Deine Aufgabe:") and the Bible references in brackets do not count. */
function words(text: string): number {
  const bare = text
    .replace(/^(Deine Aufgabe|Your task|Tu tarea)\s*:\s*/i, '')
    .replace(/\([^)]*\d[^)]*\)/g, '')
    .trim()
  return bare.split(/\s+/).filter(Boolean).length
}

describe('the texts of the big games are short', () => {
  for (const spec of SPECS) {
    describe(spec.id, () => {
      for (const lang of LANGS) {
        const game = () => bigGamesOf(lang)[spec.id]

        it(`${lang}: every text exists`, () => {
          for (const group of [spec.explain, spec.background, spec.tasks, spec.chapters, spec.hints, spec.levels]) {
            for (const p of group) expect(pick(game(), p).length, `${lang} ${spec.id}.${p}`).toBeGreaterThan(0)
          }
        })

        it(`${lang}: the explanation card has at most 3 lines of at most 8 words`, () => {
          if (spec.longTexts) return
          expect(spec.explain.length).toBeLessThanOrEqual(3)
          for (const k of spec.explain) for (const s of pick(game(), k)) expect(words(s), `${lang} ${spec.id}.${k}: ${s}`).toBeLessThanOrEqual(8)
        })

        it(`${lang}: background at most 25 words, task at most 12, chapter at most 15, hint at most 10, level name at most 3`, () => {
          if (spec.longTexts) return
          const tooLong: string[] = []
          const limit = (paths: string[], max: number, what: string) => {
            for (const p of paths) for (const s of pick(game(), p)) if (words(s) > max) tooLong.push(`${lang} ${spec.id}.${p} (${what}, ${words(s)} words, at most ${max}): ${s}`)
          }
          limit(spec.background, 25, 'background')
          limit(spec.tasks, 12, 'task')
          limit(spec.chapters, 15, 'chapter')
          limit(spec.hints, 10, 'hint')
          limit(spec.levels, 3, 'level')
          expect(tooLong).toEqual([])
        })
      }

      it('german, english and spanish have the same number of level names, chapter texts and tasks', () => {
        for (const group of [spec.tasks, spec.chapters, spec.levels]) {
          for (const p of group) {
            const n = pick(bigGamesOf('de')[spec.id], p).length
            expect(pick(bigGamesOf('en')[spec.id], p).length, `en ${p}`).toBe(n)
            expect(pick(bigGamesOf('es')[spec.id], p).length, `es ${p}`).toBe(n)
          }
        }
      })

      if (spec.component && !spec.longTexts) {
        it('the component shows only the lines of the card (no more than three)', () => {
          const src = readFileSync(resolve(process.cwd(), 'src/components/molecules/games', `${spec.component}.vue`), 'utf8')
          const used = new Set([...src.matchAll(new RegExp(`${spec.id}\\.(how[A-Z][A-Za-z]*)|TX\\('(how[A-Z][A-Za-z]*)'\\)`, 'g'))].map((m) => m[1] ?? m[2]!))
          used.delete('howTitle')
          expect([...used].sort(), spec.id).toEqual([...spec.explain].sort())
        })
      }
    })
  }
})

describe('every text of the big games compiles as a vue-i18n message (no stray @, |, { or } in a text)', () => {
  const leaves = (node: unknown, path: string): string[] => {
    if (typeof node === 'string') return [path]
    if (Array.isArray(node)) return node.flatMap((x, i) => leaves(x, `${path}.${i}`))
    if (node && typeof node === 'object') return Object.entries(node as Record<string, unknown>).flatMap(([k, v]) => leaves(v, `${path}.${k}`))
    return []
  }
  for (const lang of LANGS) {
    it(lang, () => {
      const games = bigGamesOf(lang)
      const i18n = createI18n({ legacy: false, locale: lang, messages: { [lang]: { bigGames: games } }, missingWarn: false, fallbackWarn: false })
      const args = { n: 1, all: 2, have: 1, need: 2, par: 3, title: 'x', word: 'x', points: 1, ref: 'x', name: 'x', place: 'x', total: 3, m: 1, s: 1, v: 1 }
      const bad: string[] = []
      for (const path of leaves(games, 'bigGames')) {
        const out = i18n.global.t(path, args)
        if (out === path || /\{[a-z]+\}/i.test(out)) bad.push(path)
      }
      expect(bad).toEqual([])
    })
  }
})
