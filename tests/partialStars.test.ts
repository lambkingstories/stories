/**
 * Stars for a game that is left unfinished (Anton, 19.10.2026): the same rule for every game of Josef and Noah. The share of the task that was done
 * decides: the whole task 3 stars (by playing it to the end), at least two thirds 2 stars, at least 30 % one star, below that none; "Skip" earns no
 * star, and the button says the exact number ("Weiter (2 Sterne)" / "Go on (2 stars)"). Painting tasks follow the same steps.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { journeys as baseJourneys } from '@/data/adventures'
import { noah } from '@/data/adventures/noah'
import messages from '@/i18n/app'
import { maxPoints, medalFor, partialStars, paintStars, quizStars } from '@/utils/adventureScore'

const push = vi.fn()
const replace = vi.fn()
const route = { params: { journeyId: 'josef', stageId: '2' } as Record<string, string>, query: {} as Record<string, string>, name: 'app-adventure-stage' }
vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => ({ push, replace, back: vi.fn(), beforeEach: vi.fn(), afterEach: vi.fn(), onError: vi.fn() })
}))
vi.mock('@/data/adventures', async (original) => {
  const real = await original<typeof import('@/data/adventures')>()
  const { noah: n } = await import('@/data/adventures/noah')
  return { ...real, journeyById: (id: string) => (id === 'noah' ? n : real.journeyById(id)) }
})
vi.mock('@/use/useSfx', () => ({
  default: () => ({ play: vi.fn(), preload: vi.fn(), stopAll: vi.fn(), lengthOf: () => 0, enabled: { value: true }, setEnabled: vi.fn(), toggle: vi.fn(), playedSince: () => true })
}))

const journeys = [...baseJourneys, noah]
const mk = (locale: 'de' | 'en') => createI18n({ legacy: false, locale, fallbackLocale: 'de', messages: messages as never, missingWarn: false, fallbackWarn: false })
const opts = (locale: 'de' | 'en' = 'de') => ({ global: { plugins: [mk(locale)], stubs: { RouterLink: true } }, attachTo: document.body })

beforeEach(() => {
  localStorage.clear()
  push.mockClear()
  replace.mockClear()
  vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})
afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('the steps', () => {
  it('whole task 3, two thirds 2, 30 % one, less none; nothing done earns nothing', () => {
    const at = (goal: number) => Array.from({ length: goal + 1 }, (_, d) => partialStars(d, goal))
    // 11 things (the brothers): 10 of 11 two stars, 8 two stars (73 %), 7 one star (64 %), 4 one star (36 %), 3 none (27 %)
    expect(at(11)).toEqual([0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 3])
    // 3 tasks of a picture: 2 of 3 two stars, 1 of 3 one star
    expect(at(3)).toEqual([0, 1, 2, 3])
    // 6 pieces: 4 of 6 is two thirds exactly
    expect(at(6)).toEqual([0, 0, 1, 1, 2, 2, 3])
    // 14 baskets (sharing): 5 is the first with one star (36 %), 10 the first with two (71 %)
    expect(at(14).indexOf(1)).toBe(5)
    expect(at(14).indexOf(2)).toBe(10)
    // nothing, or no goal, or more than the goal
    expect(partialStars(0, 10)).toBe(0)
    expect(partialStars(5, 0)).toBe(0)
    expect(partialStars(12, 11)).toBe(3)
    // one task of one: all done
    expect(partialStars(1, 1)).toBe(3)
  })

  it('painting without tasks: 30 % one star, 40 % two, 70 % three, less none (no star for a try)', () => {
    expect([0, 0.1, 0.29, 0.3, 0.39, 0.4, 0.69, 0.7, 1].map((x) => paintStars(x))).toEqual([0, 0, 0, 1, 1, 2, 2, 3, 3])
    expect(paintStars(0.9, false)).toBe(0)
  })

  it('the cup does not move: a stage still has at most 3 stars, the thresholds of the cup are the old ones', () => {
    for (const j of journeys) {
      const max = maxPoints(j)
      expect(max, j.id).toBe(j.stages.filter((s) => !s.soon).length * 3 + j.exam.length)
      // bronze from half of the points, silver from three quarters, gold from nine tenths (the rule of the cup is unchanged)
      expect(medalFor(Math.ceil(max * 0.5) - 1, max), j.id).toBeNull()
      expect(medalFor(Math.ceil(max * 0.5), max), j.id).toBe('bronze')
    }
    // the questions: no star for answering alone
    expect(quizStars(0, 3)).toBe(0)
  })
})

/** What a game must report as its whole task (the number of right moves that finish it), worked out from its data. */
function expectedGoal(task: NonNullable<(typeof journeys)[number]['stages'][number]['task']>): number | null {
  if (task.kind === 'zaehlen') return task.groups?.length ? task.groups.reduce((s, g) => s + g.count, 0) : (task.count ?? null)
  if (task.puzzle) return task.puzzle.cols * task.puzzle.rows
  if (task.way) return task.way.scenes.length
  if (task.harvest) return task.harvest.count
  if (task.memory) return task.memory.pairs.length
  if (task.sort) {
    const rounds = task.sort.rounds?.length ? task.sort.rounds : [{ perBin: task.sort.perBin }]
    return rounds.reduce((s, r) => s + r.perBin * task.sort!.bins.length, 0)
  }
  if (task.find) return task.find.finds.length
  if (task.share) return task.share.rounds.reduce((s, r) => s + r.baskets.filter((k) => !task.share!.baskets.find((b) => b.id === k)?.nobody).length, 0)
  if (task.build?.ordered) return task.build.pieces.length * task.build.rounds.length
  if (task.build) return task.build.rounds.reduce((s, r) => s + (r.pitch ? (task.build!.pitch?.seams.length ?? 0) : task.build!.pieces.length), 0)
  if (task.dots) return task.dots.points.length
  if (task.fly) return task.fly.rounds.reduce((s, r) => s + r.targets.length + 1, 0)
  return null
}

describe('every game says how much its whole task is (Josef and Noah)', () => {
  it('the goal of every game of every stage is the number of right moves that finish it', async () => {
    const { default: Stage } = await import('@/views/app/AppAdventureStageView.vue')
    const { default: useTaskProgress } = await import('@/use/useTaskProgress')
    const seen: string[] = []
    for (const j of journeys) {
      for (const s of j.stages) {
        const want = expectedGoal(s.task)
        if (want === null) continue
        route.params = { journeyId: j.id, stageId: String(s.id) }
        const w = mount(Stage, opts())
        await flushPromises()
        const go = w.findAll('button').find((x) => /Zur Aufgabe/.test(x.text()))
        expect(go, `${j.id} ${s.id} task button`).toBeTruthy()
        await go!.trigger('click')
        await flushPromises()
        expect(useTaskProgress().goal.value, `${j.id} stage ${s.id} (${s.task.kind})`).toBe(want)
        expect(want, `${j.id} stage ${s.id}`).toBeGreaterThan(0)
        seen.push(`${j.id}:${s.id}`)
        w.unmount()
      }
    }
    expect(seen.length).toBeGreaterThanOrEqual(12)
  })
})

describe('the button of a game that is left unfinished', () => {
  const josef = journeys.find((j) => j.id === 'josef')!
  const findStage = josef.stages.find((s) => s.task.find)!
  const things = findStage.task.find!.finds.length

  const openFind = async (locale: 'de' | 'en' = 'de') => {
    const { default: Stage } = await import('@/views/app/AppAdventureStageView.vue')
    route.params = { journeyId: 'josef', stageId: String(findStage.id) }
    const w = mount(Stage, opts(locale))
    await flushPromises()
    await w.findAll('button').find((x) => /Zur Aufgabe|To the task|Task/.test(x.text()))!.trigger('click')
    await flushPromises()
    return w
  }
  const label = (w: ReturnType<typeof mount>) => w.findAll('button').find((x) => x.classes().includes('stage-skip'))?.text()

  it('the wimmelbild with 11 things: 10 found two stars, 4 found one star, 3 found only "Skip" (no star)', async () => {
    expect(things).toBe(11)
    const w = await openFind()
    expect(label(w)).toBe('Überspringen (ohne Sterne)')
    const tap = async (n: number) => {
      const buttons = w.findAll('.fd-thing').filter((b) => !b.classes().includes('found'))
      for (let i = 0; i < n; i++) await buttons[i]!.trigger('click')
      await flushPromises()
    }
    await tap(3)
    expect(label(w)).toBe('Überspringen (ohne Sterne)')
    await tap(1)
    expect(label(w)).toBe('Weiter (1 Stern)')
    await tap(6)
    expect(label(w)).toBe('Weiter (2 Sterne)')
    // 10 of 11: two stars, not the one star of before and not the three of a whole game
    const { default: useAdventure } = await import('@/use/useAdventure')
    await w.findAll('button').find((x) => x.classes().includes('stage-part'))!.trigger('click')
    await flushPromises()
    expect(useAdventure().stageOf('josef', findStage.id)?.stars).toBe(2)
  })

  it('skipping gives no star (also after a try that stays under 30 %)', async () => {
    const { default: adv } = await import('@/use/useAdventure')
    adv().reset('josef')
    const w = await openFind()
    await w.findAll('.fd-thing')[0]!.trigger('click')
    await flushPromises()
    expect(label(w)).toBe('Überspringen (ohne Sterne)')
    await w.findAll('button').find((x) => x.classes().includes('stage-skip'))!.trigger('click')
    await flushPromises()
    const { default: useAdventure } = await import('@/use/useAdventure')
    const st = useAdventure().stageOf('josef', findStage.id)
    expect(st?.stars ?? 0).toBe(0)
    expect(w.text()).toContain('Die Etappe ist noch nicht zu Ende')
  })

  it('English: "Go on (2 stars)", "Go on (1 star)", "Skip (no stars)"', async () => {
    const w = await openFind('en')
    expect(label(w)).toBe('Skip (no stars)')
    const buttons = w.findAll('.fd-thing')
    for (let i = 0; i < 4; i++) await buttons[i]!.trigger('click')
    await flushPromises()
    expect(label(w)).toBe('Go on (1 star)')
    for (let i = 4; i < 9; i++) await buttons[i]!.trigger('click')
    await flushPromises()
    expect(label(w)).toBe('Go on (2 stars)')
  })

  it('a game that is finished has no such button (its stars are its result); the stage without any game gives no star', async () => {
    const { default: useTaskProgress } = await import('@/use/useTaskProgress')
    const w = await openFind()
    const buttons = w.findAll('.fd-thing')
    for (const b of buttons) await b.trigger('click')
    await flushPromises()
    expect(useTaskProgress().finished.value).toBe(true)
    expect(label(w)).toBeUndefined()
  })
})

describe('painting tasks follow the same steps', () => {
  it('all tasks met 3 stars, two thirds 2, a third 1, none 0 (3 tasks), and with seven tasks the same shares', () => {
    expect([0, 1, 2, 3].map((m) => partialStars(m, 3))).toEqual([0, 1, 2, 3])
    expect([0, 1, 2, 3, 4, 5, 6, 7].map((m) => partialStars(m, 7))).toEqual([0, 0, 0, 1, 1, 2, 2, 3])
  })
})

describe('the questions: no minimum star (Anton, 19.10.2026)', () => {
  const josef = baseJourneys.find((j) => j.id === 'josef')!
  const quizOnly = josef.stages.find((s) => s.task.kind === 'quiz')!

  /** Answer every question of the open stage: `right(i)` says whether question i is answered right. */
  const answer = async (w: ReturnType<typeof mount>, questions: { options: string[]; answer: number }[], right: (i: number) => boolean) => {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]!
      const want = right(i) ? q.options[q.answer] : q.options.find((_, k) => k !== q.answer)
      const opt = w.findAll('.quiz-option').find((o) => o.find('.quiz-text').text() === want)
      expect(opt, `question ${i + 1}`).toBeTruthy()
      await opt!.trigger('click')
      await w.find('.quiz-next button').trigger('click')
      await flushPromises()
    }
  }
  const press = async (w: ReturnType<typeof mount>, text: RegExp) => {
    const b = w.findAll('button').find((x) => text.test(x.text()))
    expect(b, `button ${text}`).toBeTruthy()
    await b!.trigger('click')
    await flushPromises()
  }

  it('a game skipped and every question wrong: 0 stars, a friendly line (no "almost"), and the way to try again stays', async () => {
    const { default: Stage } = await import('@/views/app/AppAdventureStageView.vue')
    const { default: useAdventure } = await import('@/use/useAdventure')
    for (const [locale, line, again] of [['de', 'Diesmal ist noch kein Stern dabei. Versuch es gern noch einmal!', /Nochmal versuchen/], ['en', 'No star yet this time. Try again whenever you like!', /Try again/]] as const) {
      useAdventure().reset('josef')
      route.params = { journeyId: 'josef', stageId: '2' }
      const w = mount(Stage, opts(locale))
      await flushPromises()
      await press(w, /Zur Aufgabe|To the task/)
      await press(w, /Überspringen|Skip/)
      await press(w, /Zu den Fragen|To the questions/)
      await answer(w, josef.stages[1]!.questions, () => false)
      expect(w.text(), locale).toContain(line)
      expect(w.text()).not.toMatch(/Fast|Almost/)
      expect(useAdventure().stageOf('josef', 2)?.finalStars).toBe(0)
      expect(w.findAll('button').some((b) => again.test(b.text())), `${locale} again`).toBe(true)
      w.unmount()
    }
  })

  it('a stage that is only questions: nothing right 0 stars, one right one star, all right three', async () => {
    const { default: Stage } = await import('@/views/app/AppAdventureStageView.vue')
    const { default: useAdventure } = await import('@/use/useAdventure')
    const n = quizOnly.questions.length
    for (const [rights, stars] of [[0, 0], [1, 1], [n, 3]] as const) {
      useAdventure().reset('josef')
      route.params = { journeyId: 'josef', stageId: String(quizOnly.id) }
      const w = mount(Stage, opts())
      await flushPromises()
      await press(w, /Zu den Fragen/)
      await answer(w, quizOnly.questions, (i) => i < rights)
      expect(useAdventure().stageOf('josef', quizOnly.id)?.finalStars, `${rights} right`).toBe(stars)
      w.unmount()
    }
  })

  it('the exam: no star either; the points are the right answers alone (nothing right is 0 points and no cup)', async () => {
    const { default: Stage } = await import('@/views/app/AppAdventureStageView.vue')
    const { default: useAdventure } = await import('@/use/useAdventure')
    const { pointsOf } = await import('@/utils/adventureScore')
    useAdventure().reset('josef')
    route.params = { journeyId: 'josef', stageId: 'pruefung' }
    const w = mount(Stage, opts())
    await flushPromises()
    await answer(w, josef.exam, () => false)
    const prog = useAdventure().progressOf('josef')
    expect(prog?.exam?.correct).toBe(0)
    expect(pointsOf(prog)).toBe(0)
    expect(w.find('.result-medal').exists()).toBe(false)
  })
})
