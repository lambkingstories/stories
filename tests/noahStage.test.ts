/**
 * The stages of Noah that have a new game (2: build the ark, 3: share, 6: dots, 7: steering, 8: altar) inside the real stage page: the game shows up, the
 * button "Überspringen" turns into "Weiter (1 Stern)" after one right move, and the game's stars go on to the questions.
 * Noah is not public yet (not in `journeys`), so the page gets it through a replaced `journeyById`.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import { noah } from '@/data/adventures/noah'
import { saveJobResults } from '@/utils/paintJobs'

const replace = vi.fn()
const push = vi.fn()
const route = { params: { journeyId: 'noah', stageId: '3' } as Record<string, string>, query: {} as Record<string, string>, name: 'app-adventure-stage' }

vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => ({ push, replace, back: vi.fn(), beforeEach: vi.fn(), afterEach: vi.fn(), onError: vi.fn() })
}))
vi.mock('@/use/useSfx', () => ({
  default: () => ({ play: vi.fn(), preload: vi.fn(), enabled: { value: true }, setEnabled: vi.fn(), toggle: vi.fn(), playedSince: () => true })
}))
vi.mock('@/data/adventures', async (original) => {
  const real = await original<typeof import('@/data/adventures')>()
  const { noah: n } = await import('@/data/adventures/noah')
  return { ...real, journeyById: (id: string) => (id === 'noah' ? n : real.journeyById(id)) }
})

const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'de', messages: messages as never, missingWarn: false, fallbackWarn: false })
const opts = { global: { plugins: [i18n], stubs: { RouterLink: true } }, attachTo: document.body }

let warnings: string[] = []
beforeEach(() => {
  warnings = []
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
const press = async (w: ReturnType<typeof mount>, text: RegExp) => {
  const b = w.findAll('button').find((x) => text.test(x.text()) && !x.attributes('disabled'))
  expect(b, `button ${text}`).toBeTruthy()
  await b!.trigger('click')
  await flushPromises()
}
const openTask = async (stageId: number) => {
  route.params = { journeyId: 'noah', stageId: String(stageId) }
  const { default: Stage } = await import('@/views/app/AppAdventureStageView.vue')
  const w = mount(Stage, opts)
  await flushPromises()
  expect(w.text()).toContain(noah.stages[stageId - 1]!.title)
  await press(w, /Zur Aufgabe/)
  return w
}

describe('Noah: the stage page with the new games', () => {
  it('stage 2 shows the building game, stage 3 the sharing game; stage 4 is a memory with six animals (the pairs game is gone)', async () => {
    const a = await openTask(2)
    expect(a.find('.bd-board').exists()).toBe(true)
    expect(a.find('.stage-hint').text()).toContain('Baue die Arche')
    const b = await openTask(3)
    expect(b.findAll('.sh-card').length).toBe(4)
    // stage 4: twelve cards, two of every animal, and the hint with the words "some animals as an example"
    const c = await openTask(4)
    expect(c.findAll('.mem-card').length).toBe(12)
    expect(c.find('.stage-hint').text()).toBe('Finde die gleichen Tiere. Du siehst nur einige Tierarten als Beispiel.')
    const fronts = c.findAll('.mem-front').map((i) => i.attributes('src'))
    expect(new Set(fronts).size).toBe(6)
    for (const f of new Set(fronts)) expect(fronts.filter((x) => x === f)).toHaveLength(2)
    // the two cards of one animal turned up: the sentence of that animal shows and the pair stays
    const first = fronts[0]!
    const same = c.findAll('.mem-card').map((card, i) => (fronts[i] === first ? card : null)).filter(Boolean)
    await same[0]!.trigger('click')
    await same[1]!.trigger('click')
    await flushPromises()
    expect(c.find('.mem-text').text()).toMatch(/Arche|Feld|Wildnis/)
    expect(c.findAll('.mem-card.found')).toHaveLength(2)
    expect(problems()).toEqual([])
  })

  it('stage 6 shows the dots, stage 7 the sky, stage 8 the altar with stones', async () => {
    const a = await openTask(6)
    expect(a.findAll('.dt-dot').length).toBe(16)
    const b = await openTask(7)
    expect(b.find('.fl-sky').exists()).toBe(true)
    const c = await openTask(8)
    expect(c.find('.st-board').exists()).toBe(true)
    expect(c.find('.st-grab').exists()).toBe(true)
    expect(c.find('.stage-hint').text()).toContain('zwölf Steinen')
    expect(problems()).toEqual([])
  })

  it('without a right move the game can only be skipped (no star); with one it goes on and gives one star for it', async () => {
    const w = await openTask(3)
    expect(w.findAll('button').some((x) => /Überspringen/.test(x.text()))).toBe(true)
    expect(w.findAll('button').some((x) => /Weiter \(1 Stern/.test(x.text()))).toBe(false)
    // one basket to the family: tap the basket, then the family
    w.findAll('.sh-basket')[0]!.element.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 5, clientY: 5 }))
    window.dispatchEvent(new MouseEvent('pointerup', { clientX: 5, clientY: 5 }))
    await flushPromises()
    await w.findAll('.sh-card')[0]!.trigger('click')
    expect(w.findAll('button').some((x) => /Überspringen/.test(x.text()))).toBe(false)
    await press(w, /Weiter \(1 Stern/)
    // the overview between the game and the questions, then the questions of the stage
    expect(w.text()).toContain('Zu den Fragen')
    await press(w, /Zu den Fragen/)
    expect(w.text()).toContain(noah.stages[2]!.questions[0]!.q)
    expect(problems()).toEqual([])
  })

  it('skipping goes on to the questions too', async () => {
    const w = await openTask(6)
    await press(w, /Überspringen/)
    await press(w, /Zu den Fragen/)
    expect(w.text()).toContain(noah.stages[5]!.questions[0]!.q)
    expect(problems()).toEqual([])
  })
})

describe('the small sign "play the game again"', () => {
  it('a click starts the game afresh (what was done, mistakes and rounds begin again); text and questions stay', async () => {
    const w = await openTask(3)
    expect(w.find('.stage-restart').attributes('aria-label')).toBe('Spiel wiederholen')
    const tap = async (el: Element) => {
      el.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 5, clientY: 5 }))
      window.dispatchEvent(new MouseEvent('pointerup', { clientX: 5, clientY: 5 }))
      await flushPromises()
    }
    const fruit = w.findAll('.sh-basket').find((b) => /Feigen|Trauben/.test(b.attributes('aria-label') ?? ''))!
    await tap(fruit.element)
    await w.findAll('.sh-card')[0]!.trigger('click')
    expect(w.findAll('.sh-basket').length).toBe(5)
    expect(w.findAll('button').some((x) => /Weiter \(1 Stern/.test(x.text()))).toBe(true)
    await w.find('.stage-restart').trigger('click')
    await flushPromises()
    expect(w.findAll('.sh-basket').length).toBe(6)
    expect(w.findAll('.sh-slot.filled').length).toBe(0)
    expect(w.findAll('button').some((x) => /Weiter \(1 Stern/.test(x.text()))).toBe(false)
    expect(w.findAll('button').some((x) => /Überspringen/.test(x.text()))).toBe(true)
    // the stage is still in its game: the text and the questions were not touched
    expect(w.find('.stage-hint').text()).toContain('Schiebe')
    expect(problems()).toEqual([])
  })

  it('every game of the stages has the sign; the quiz stage and the painting stage have none', async () => {
    for (const id of [1, 2, 3, 4, 6, 7, 8]) {
      const w = await openTask(id)
      expect(w.find('.stage-restart').exists(), `stage ${id}`).toBe(true)
    }
    // the quiz stage has no game at all: the page goes from the story straight to the questions
    for (const id of [5]) {
      route.params = { journeyId: 'noah', stageId: String(id) }
      const { default: Stage } = await import('@/views/app/AppAdventureStageView.vue')
      const quiz = mount(Stage, opts)
      await flushPromises()
      await press(quiz, /Zu den Fragen/)
      expect(quiz.find('.stage-restart').exists(), `stage ${id}`).toBe(false)
    }
    const paint = await openTask(9)
    expect(paint.find('.stage-restart').exists()).toBe(false)
  })
})

describe('Noah: the painted map with the stages that are ready and the ones that are "soon"', () => {
  it('shows nine stations and the goal; the first one is open, the others wait for it', async () => {
    push.mockClear()
    route.params = { journeyId: 'noah' }
    const { default: MapView } = await import('@/views/app/AppAdventureView.vue')
    const w = mount(MapView, opts)
    await flushPromises()
    expect(w.find('.map-list').exists()).toBe(false)
    expect(w.findAll('.map-art').length).toBe(4)
    const spots = w.findAll('.map-spot:not(.exam)')
    expect(spots.length).toBe(9)
    expect(w.find('.map-spot.exam').exists()).toBe(true)
    expect(spots.map((s) => s.find('.spot-hit').attributes('disabled') === undefined)).toEqual([true, false, false, false, false, false, false, false, false])
    expect(spots.filter((s) => s.find('.spot-soon').exists()).length).toBe(0)
    expect(spots[1]!.text()).toContain('Gottes Bauplan')
    expect(w.findAll('.bead').length).toBeGreaterThan(40)
    // the pictures of the stations lie under the rings
    expect(spots[2]!.find('.spot-pic').attributes('style')).toContain('etappe-bild-03.webp')
    expect(w.text()).not.toContain('TODO')
    // a stage that is still shut cannot be opened; the first one can
    await spots[2]!.find('.spot-hit').trigger('click')
    expect(push).not.toHaveBeenCalled()
    await spots[0]!.find('.spot-hit').trigger('click')
    expect(push).toHaveBeenCalledWith({ name: 'app-adventure-stage', params: { journeyId: 'noah', stageId: '1' } })
    expect(problems()).toEqual([])
  })
})

describe('Noah 9: the picture to paint comes with three tasks that are drawn by chance', () => {
  const pool = noah.stages[8]!.task.jobs!
  const rules = pool.map((j) => j.hint)
  const shownOf = (w: ReturnType<typeof mount>) => w.findAll('.stage-job').map((x) => x.text())

  it('the hint says "Male das Bild voll aus." and three tasks for three different elements stand under it', async () => {
    const w = await openTask(9)
    expect(w.find('.stage-hint').text()).toBe('Male das Bild voll aus.')
    const shown = shownOf(w)
    expect(shown).toHaveLength(3)
    for (const t of shown) expect(rules).toContain(t)
    expect(new Set(shown.map((t) => pool.find((j) => j.hint === t)!.zone)).size).toBe(3)
    expect(shown.join(' ')).not.toMatch(/egal/)
  })

  it('entering the stage anew draws again; coming back from the painting program keeps the tasks that were drawn', async () => {
    const seen = new Set<string>()
    for (let i = 0; i < 25; i++) {
      const w = await openTask(9)
      for (const t of shownOf(w)) seen.add(t)
      w.unmount()
    }
    // by chance over 25 starts nearly every task of the pool comes up
    expect(seen.size).toBeGreaterThanOrEqual(8)
    const first = await openTask(9)
    const drawn = shownOf(first)
    saveJobResults('noah', 9, ['met', 'wrong', 'more'])
    route.query = { back: 'task', done: '1', stars: '1' }
    const { default: Stage } = await import('@/views/app/AppAdventureStageView.vue')
    const back = mount(Stage, opts)
    await flushPromises()
    expect(back.findAll('.painted-job-text > span:first-child').map((x) => x.text())).toEqual(drawn)
    route.query = {}
  })

  it('the result page ticks the tasks that are done and crosses the others, says what was wrong, and offers to keep painting', async () => {
    localStorage.setItem('lk-paintjobs:noah:9', JSON.stringify([pool.findIndex((j) => j.hint === 'Male den Regenbogen mit Wasserfarbe.'), pool.findIndex((j) => j.hint === 'Male die Sonne gelb.'), pool.findIndex((j) => j.hint === 'Male die Wiese grün.')]))
    saveJobResults('noah', 9, ['wrong', 'met', 'more'])
    route.query = { back: 'task', done: '1', stars: '1' }
    const { default: Stage } = await import('@/views/app/AppAdventureStageView.vue')
    const w = mount(Stage, opts)
    await flushPromises()
    const rows = w.findAll('.painted-job')
    expect(rows).toHaveLength(3)
    expect(rows.map((r) => r.find('.painted-mark').text())).toEqual(['✗', '✓', '✗'])
    expect(rows[0]!.text()).toContain('Male den Regenbogen mit Wasserfarbe.')
    expect(rows[0]!.text()).toContain('Leider falsches Malwerkzeug verwendet.')
    expect(rows[1]!.text()).toContain('geschafft')
    expect(rows[2]!.text()).toContain('Noch nicht genug gemalt.')
    // the colour of a task that went wrong in colour
    saveJobResults('noah', 9, ['more', 'wrong', 'met'])
    const w2 = mount(Stage, opts)
    await flushPromises()
    expect(w2.findAll('.painted-job')[1]!.text()).toContain('Leider die falsche Farbe verwendet.')
    expect(w.findAll('button').some((b) => /Weitermalen/.test(b.text()))).toBe(true)
    expect(w.text()).toContain('Male weiter, dann bekommst du noch mehr Sterne.')
    route.query = {}
    expect(problems()).toEqual([])
  })

  it('three tasks done: three stars, the usual words, all ticked', async () => {
    saveJobResults('noah', 9, ['met', 'met', 'met'])
    route.query = { back: 'task', done: '1', stars: '3' }
    const { default: Stage } = await import('@/views/app/AppAdventureStageView.vue')
    const w = mount(Stage, opts)
    await flushPromises()
    expect(w.findAll('.painted-mark').map((m) => m.text())).toEqual(['✓', '✓', '✓'])
    expect(w.text()).toContain('Dein Bild ist fertig')
    route.query = {}
  })
})

describe('the small link "Weiter (1 Stern)" belongs to a game that is not finished', () => {
  it('after one right move it is offered, with the exact words; when the game is over (its end page is on) it is gone and cannot be used', async () => {
    const { default: useTaskProgress } = await import('@/use/useTaskProgress')
    const w = await openTask(3)
    const progress = useTaskProgress()
    progress.mark()
    await flushPromises()
    const link = () => w.findAll('button').find((x) => /^Weiter \(1 Stern\)$/.test(x.text()))
    expect(link()).toBeTruthy()
    expect(w.findAll('button').some((x) => /Überspringen/.test(x.text()))).toBe(false)
    // the game is over (GameDone does this when it shows the stars)
    progress.finish()
    await flushPromises()
    expect(link()).toBeUndefined()
    expect(w.findAll('button').some((x) => /Überspringen/.test(x.text()))).toBe(false)
    expect(w.find('.stage-part').exists()).toBe(false)
  })
})
