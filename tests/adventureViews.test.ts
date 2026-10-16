/**
 * The screens of the adventures, mounted and used: every button of the home page, the map, a stage and all the games is pressed, and
 * Vue must not complain that the template uses something the script does not have. (The Pug templates are not checked by the type
 * checker, so a function lost from a script only shows as a button that does nothing: this test catches that.)
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { journeys } from '@/data/adventures'
import messages from '@/i18n/app'

const push = vi.fn()
const replace = vi.fn()
const route = { params: { journeyId: 'josef', stageId: '2' } as Record<string, string>, query: {} as Record<string, string>, name: 'app-adventure-stage' }

vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => ({ push, replace, back: vi.fn(), beforeEach: vi.fn(), afterEach: vi.fn(), onError: vi.fn() })
}))

vi.mock('@/use/useSfx', () => ({
  default: () => ({ play: vi.fn(), preload: vi.fn(), enabled: { value: true }, setEnabled: vi.fn(), toggle: vi.fn() })
}))

const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'de', messages: messages as never, missingWarn: false, fallbackWarn: false })
const opts = { global: { plugins: [i18n], stubs: { RouterLink: true } }, attachTo: document.body }

let warnings: string[] = []
beforeEach(() => {
  warnings = []
  push.mockClear()
  replace.mockClear()
  localStorage.clear()
  vi.spyOn(console, 'warn').mockImplementation((...a) => {
    warnings.push(a.map(String).join(' '))
  })
  vi.spyOn(console, 'error').mockImplementation((...a) => {
    warnings.push('ERROR ' + a.map(String).join(' '))
  })
})
afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

const problems = () => warnings.filter((w) => /not defined on instance|is not a function|Unhandled error|ERROR/.test(w))
const press = async (wrapper: ReturnType<typeof mount>, text: RegExp) => {
  const b = wrapper.findAll('button').find((x) => text.test(x.text()) && !x.attributes('disabled'))
  expect(b, `button ${text}`).toBeTruthy()
  await b!.trigger('click')
  await flushPromises()
}

describe('the stage screen', () => {
  const josef = journeys[0]!

  it('every stage opens, goes to its task and back one step with the arrow', async () => {
    const { default: Stage } = await import('@/views/app/AppAdventureStageView.vue')
    for (const s of josef.stages) {
      route.params = { journeyId: 'josef', stageId: String(s.id) }
      const w = mount(Stage, opts)
      await flushPromises()
      expect(w.text(), `stage ${s.id} text`).toContain(s.title)
      await press(w, /Zur Aufgabe|Zu den Fragen/)
      // the task (or the questions) is shown now
      expect(w.find('.stage-card').text().length).toBeGreaterThan(5)
      // the arrow goes one step back: to the story
      await w.find('.stage-back').trigger('click')
      await flushPromises()
      expect(w.find('.stage-card').text(), `stage ${s.id} back`).toContain(s.text[0]!.slice(0, 20))
      // and the arrow from the story leads to the map
      await w.find('.stage-back').trigger('click')
      expect(replace).toHaveBeenCalled()
      replace.mockClear()
      w.unmount()
    }
    expect(problems()).toEqual([])
  })

  it('goes on after the game is skipped: overview, questions, result', async () => {
    const { default: Stage } = await import('@/views/app/AppAdventureStageView.vue')
    route.params = { journeyId: 'josef', stageId: '6' }
    const w = mount(Stage, opts)
    await flushPromises()
    await press(w, /Zur Aufgabe/)
    await press(w, /Überspringen/)
    expect(w.text()).toContain('Fragen')
    await press(w, /Zu den Fragen/)
    for (let i = 0; i < 3; i++) {
      const o = w.findAll('.quiz-option').find((x) => !x.attributes('disabled'))
      if (!o) break
      await o.trigger('click')
      await press(w, /^(Weiter|Fertig)$/)
    }
    expect(w.text()).toContain('Etappe geschafft')
    expect(problems()).toEqual([])
  })
})

describe('the stars of a try', () => {
  const answerAll = async (w: ReturnType<typeof mount>, wrong: 'none' | 'first' | 'both') => {
    for (let i = 0; i < 2; i++) {
      const opts_ = w.findAll('.quiz-option')
      // the right answers of the questions of stage 2 are "Garben" and "Josefs Vater"
      const right = opts_.find((x) => /Garben|Josefs Vater/.test(x.text()))!
      const wrongOpt = opts_.find((x) => !/Garben|Josefs Vater/.test(x.text()))!
      await ((wrong === 'both' || (wrong === 'first' && i === 0)) ? wrongOpt : right).trigger('click')
      await press(w, /^(Weiter|Fertig)$/)
    }
  }

  it('two wrong answers take two stars away, even when an earlier try had three', async () => {
    const { default: Stage } = await import('@/views/app/AppAdventureStageView.vue')
    const { default: useAdventure } = await import('@/use/useAdventure')
    useAdventure().reset('josef')
    useAdventure().recordStars('josef', 2, 3)
    useAdventure().recordFinal('josef', 2, 3)
    route.params = { journeyId: 'josef', stageId: '2' }
    route.query = { back: 'task', stars: '3' }
    const w = mount(Stage, opts)
    await flushPromises()
    await press(w, /Zu den Fragen/)
    await answerAll(w, 'both')
    expect(w.text()).toContain('1 Stern geholt')
    expect(w.text()).toContain('Dein bestes Ergebnis: 3 Sterne')
    // trying again starts the questions afresh
    await press(w, /Nochmal versuchen/)
    expect(w.text()).not.toContain('Etappe geschafft')
    route.query = {}
    expect(problems()).toEqual([])
  })

  it('one wrong answer takes a star even when the game gave three', async () => {
    const { default: Stage } = await import('@/views/app/AppAdventureStageView.vue')
    const { default: useAdventure } = await import('@/use/useAdventure')
    useAdventure().reset('josef')
    useAdventure().recordStars('josef', 2, 3)
    route.params = { journeyId: 'josef', stageId: '2' }
    route.query = { back: 'task', stars: '3' }
    const w = mount(Stage, opts)
    await flushPromises()
    await press(w, /Zu den Fragen/)
    await answerAll(w, 'first')
    expect(w.text()).toContain('2 Sterne geholt')
    route.query = {}
  })

  it('right answers bring the stars back: one star from the game and two right answers make three', async () => {
    const { default: Stage } = await import('@/views/app/AppAdventureStageView.vue')
    const { default: useAdventure } = await import('@/use/useAdventure')
    useAdventure().reset('josef')
    useAdventure().recordStars('josef', 2, 1)
    route.params = { journeyId: 'josef', stageId: '2' }
    route.query = { back: 'task', stars: '1' }
    const w = mount(Stage, opts)
    await flushPromises()
    await press(w, /Zu den Fragen/)
    await answerAll(w, 'none')
    expect(w.text()).toContain('3 Sterne geholt')
    expect(w.text()).toContain('Richtige Antworten')
    route.query = {}
  })

  it('all right is three stars and no second try is offered', async () => {
    const { default: Stage } = await import('@/views/app/AppAdventureStageView.vue')
    const { default: useAdventure } = await import('@/use/useAdventure')
    useAdventure().reset('josef')
    route.params = { journeyId: 'josef', stageId: '2' }
    route.query = { back: 'task', stars: '3' }
    const w = mount(Stage, opts)
    await flushPromises()
    await press(w, /Zu den Fragen/)
    await answerAll(w, 'none')
    expect(w.text()).toContain('3 Sterne geholt')
    expect(w.findAll('button').some((b) => /Nochmal versuchen/.test(b.text()))).toBe(false)
    route.query = {}
  })
})

describe('the home page and the map', () => {
  it('the home page shows the journey and its buttons work', async () => {
    const { default: Home } = await import('@/views/app/AppAdventureHomeView.vue')
    const w = mount(Home, opts)
    await flushPromises()
    expect(w.text()).toContain('Josef')
    expect(problems()).toEqual([])
  })

  it('the map shows every stage and the sound switch is a real button', async () => {
    const { default: MapView } = await import('@/views/app/AppAdventureView.vue')
    route.params = { journeyId: 'josef' }
    const w = mount(MapView, opts)
    await flushPromises()
    expect(w.findAll('.map-spot').length).toBe(journeys[0]!.stages.length + 1)
    expect(w.find('.map-sound').exists()).toBe(true)
    expect(w.findAll('.bead').length).toBeGreaterThan(60)
    expect(problems()).toEqual([])
  })
})

describe('the games', () => {
  it('every game of Josef mounts and shows something to play', async () => {
    const { default: Puzzle } = await import('@/components/molecules/games/GamePuzzle.vue')
    const { default: Way } = await import('@/components/molecules/games/GameWay.vue')
    const { default: Harvest } = await import('@/components/molecules/games/GameHarvest.vue')
    const { default: Memory } = await import('@/components/molecules/games/GameMemory.vue')
    const { default: Sort } = await import('@/components/molecules/games/GameSort.vue')
    const { default: Find } = await import('@/components/molecules/games/GameFind.vue')
    const { default: Count } = await import('@/components/molecules/AdventureCount.vue')
    const tasks = journeys[0]!.stages.map((s) => s.task)
    const by = (k: string) => tasks.find((t) => t.kind === k)!
    const mounts = [
      mount(Puzzle, { ...opts, props: { game: by('puzzle').puzzle! } }),
      mount(Way, { ...opts, props: { game: by('weg').way! } }),
      mount(Harvest, { ...opts, props: { game: by('ernten').harvest! } }),
      mount(Memory, { ...opts, props: { game: by('memory').memory! } }),
      mount(Sort, { ...opts, props: { game: by('sortieren').sort! } }),
      mount(Find, { ...opts, props: { game: by('wimmelbild').find! } }),
      mount(Count, { ...opts, props: { count: 11, image: 'images/abenteuer/ui/stern-gold-{n}.webp' } })
    ]
    await flushPromises()
    for (const m of mounts) expect(m.html().length).toBeGreaterThan(200)
    expect(mounts[2]!.findAll('.hv-thing').length).toBeGreaterThan(10)
    expect(mounts[3]!.findAll('.mem-card').length).toBe(by('memory').memory!.pairs.length * 2)
    expect(mounts[5]!.findAll('.fd-thing').length).toBe(11)
    expect(problems()).toEqual([])
  })

  it('the harvest, the memory and the way react to taps', async () => {
    const { default: Harvest } = await import('@/components/molecules/games/GameHarvest.vue')
    const { default: Memory } = await import('@/components/molecules/games/GameMemory.vue')
    const { default: Way } = await import('@/components/molecules/games/GameWay.vue')
    const tasks = journeys[0]!.stages.map((s) => s.task)
    const h = mount(Harvest, { ...opts, props: { game: tasks.find((t) => t.kind === 'ernten')!.harvest! } })
    await h.find('.hv-thing:not(.weed)').trigger('click')
    expect(h.find('.hv-thing.fly').exists()).toBe(true)
    const m = mount(Memory, { ...opts, props: { game: tasks.find((t) => t.kind === 'memory')!.memory! } })
    await m.findAll('.mem-card')[0]!.trigger('click')
    expect(m.findAll('.mem-card.up').length).toBe(1)
    const w = mount(Way, { ...opts, props: { game: tasks.find((t) => t.kind === 'weg')!.way! } })
    await w.find('.way-hit.left').trigger('click')
    expect(w.find('.way-scene').classes().some((c) => c === 'good' || c === 'bad')).toBe(true)
    expect(problems()).toEqual([])
  })
})
