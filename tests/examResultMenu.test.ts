/**
 * The result page at the end of an adventure (Anton, 17.11.2026): the points are worked out (stars + right answers = points), what was won is
 * a clear list, the next adventure is the next one in the order of the Bible (after Adam and Eve comes Noah), the coloring picture is a present
 * of the gold cup only, and the exam that was done before shows this page again (the child can return to it from the map).
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { adamEva } from '@/data/adventures/adamEva'
import { babel } from '@/data/adventures/babel'
import { noah } from '@/data/adventures/noah'
import messages from '@/i18n/app'
import { withGameTexts } from '@/i18n/bigGames'
import { maxPoints, pointsOf } from '@/utils/adventureScore'

const push = vi.fn()
const route = { params: { journeyId: 'adam-eva', stageId: 'pruefung' } as Record<string, string>, query: {} as Record<string, string>, name: 'app-adventure-stage' }
vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn(), beforeEach: vi.fn(), afterEach: vi.fn(), onError: vi.fn() })
}))
vi.mock('@/data/adventures', async () => {
  const { adamEva: a } = await import('@/data/adventures/adamEva')
  const { noah: n } = await import('@/data/adventures/noah')
  const { babel: b } = await import('@/data/adventures/babel')
  const list = [b, a, n]
  return { journeys: list, journeyById: (id: string) => list.find((j) => j.id === id), comingSoon: [] }
})
vi.mock('@/use/useSfx', () => ({
  default: () => ({ play: vi.fn(), preload: vi.fn(), stopAll: vi.fn(), lengthOf: () => 0, enabled: { value: true }, setEnabled: vi.fn(), toggle: vi.fn(), playedSince: () => true })
}))
vi.mock('@/use/useCelebration', () => ({ default: () => ({ celebrate: vi.fn(), stop: vi.fn() }) }))

const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'de', messages: withGameTexts(messages) as never, missingWarn: false, fallbackWarn: false })
const opts = { global: { plugins: [i18n], stubs: { RouterLink: true, AdventureCardReveal: true } }, attachTo: document.body }

/** All stages with three stars, the exam with `correct` right answers. */
async function finish(correct: number) {
  const { default: useAdventure } = await import('@/use/useAdventure')
  const adv = useAdventure()
  adv.reset('adam-eva')
  adv.state['adam-eva'] = {
    stages: Object.fromEntries(adamEva.stages.filter((s) => !s.soon).map((s) => [s.id, { stars: 3, bestStars: 3, done: true }])),
    exam: { correct, total: adamEva.exam.length }
  } as never
  return adv
}

beforeEach(() => {
  localStorage.clear()
  push.mockClear()
  vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})
afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('the result page of the exam', () => {
  it('an exam that was done before shows the result at once (the child can come back to it), not the first question', async () => {
    await finish(2)
    const { default: Stage } = await import('@/views/app/AppAdventureStageView.vue')
    const w = mount(Stage, opts)
    await flushPromises()
    expect(w.find('[data-test="exam-points"]').exists()).toBe(true)
    expect(w.text()).toContain('Geschafft')
    w.unmount()
  })

  it('the points are worked out: the stars and the right answers add up to the points of the cup', async () => {
    const adv = await finish(2)
    const { default: Stage } = await import('@/views/app/AppAdventureStageView.vue')
    const w = mount(Stage, opts)
    await flushPromises()
    const total = pointsOf(adv.progressOf('adam-eva'))
    const max = maxPoints(adamEva)
    const stars = adamEva.stages.filter((s) => !s.soon).length * 3
    const box = w.get('[data-test="exam-points"]').text().replace(/\s+/g, ' ')
    expect(box).toContain(`${stars} von ${stars}`)
    expect(box).toContain(`2 von ${adamEva.exam.length} richtig`)
    expect(box).toContain(`Zusammen ${total} von ${max} Punkten`)
    expect(total).toBe(stars + 2)
    w.unmount()
  })

  it('after Adam and Eve the next adventure is Noah (the order of the Bible), and a tap opens its map', async () => {
    await finish(2)
    const { default: Stage } = await import('@/views/app/AppAdventureStageView.vue')
    const w = mount(Stage, opts)
    await flushPromises()
    const next = w.get('[data-test="next-adventure"]')
    expect(next.text()).toContain(noah.title)
    expect(next.text()).not.toContain(babel.title)
    expect(w.text()).not.toContain('Die Reise geht weiter mit')
    w.unmount()
  })

  it('what was won is a list that is always open; the coloring picture is a present of the gold cup only', async () => {
    // 2 of 6 right: 27 + 2 points, a silver cup: no present
    await finish(2)
    const { default: Stage } = await import('@/views/app/AppAdventureStageView.vue')
    const silver = mount(Stage, opts)
    await flushPromises()
    expect(silver.find('.rw-won').exists()).toBe(true)
    expect(silver.find('.rw-gift').classes()).not.toContain('is-done')
    expect(silver.find('[data-test="rewards-gift"]').exists()).toBe(false)
    expect(silver.find('.rw-toggle').exists()).toBe(false)
    silver.unmount()
    // all right: the gold cup, the present is there and a tap opens the painting program
    await finish(adamEva.exam.length)
    const gold = mount(Stage, opts)
    await flushPromises()
    expect(gold.find('.rw-gift').classes()).toContain('is-done')
    await gold.get('[data-test="rewards-gift"]').trigger('click')
    expect(push).toHaveBeenCalledWith(expect.objectContaining({ name: 'app-coloring' }))
    gold.unmount()
  })

  it('"try again" starts the questions afresh', async () => {
    await finish(2)
    const { default: Stage } = await import('@/views/app/AppAdventureStageView.vue')
    const w = mount(Stage, opts)
    await flushPromises()
    const retry = w.findAll('button').find((b) => b.text() === 'Nochmal versuchen')
    expect(retry).toBeTruthy()
    await retry!.trigger('click')
    await flushPromises()
    expect(w.find('[data-test="exam-points"]').exists()).toBe(false)
    w.unmount()
  })
})

describe('the stage games row of the result page', () => {
  it('says that all stage games are free (and is lit) when every stage has three stars, and does not say "no stage game of its own"', async () => {
    await finish(2)
    const { default: Stage } = await import('@/views/app/AppAdventureStageView.vue')
    const w = mount(Stage, opts)
    await flushPromises()
    const row = w.get('.rw-mini')
    expect(row.classes()).toContain('is-done')
    expect(row.text()).toContain('Alle Etappen-Spiele dieses Abenteuers sind frei')
    expect(row.text()).not.toContain('kein eigenes')
    w.unmount()
  })
})
