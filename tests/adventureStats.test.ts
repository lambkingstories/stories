/**
 * The statistics of a journey (opened from the cup on the map), the celebration of the cup, the way back from a stage that was played again
 * and from the present, and the order on the map (first the stars, then the way).
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { journeys } from '@/data/adventures'
import messages from '@/i18n/app'
import { clearViaStats, isViaStats, markViaStats, medalRank, nextMedal, takeMedalBefore } from '@/utils/adventureStats'

const push = vi.fn()
const replace = vi.fn()
const route = { params: { journeyId: 'josef', stageId: '2' } as Record<string, string>, query: {} as Record<string, string>, name: 'app-adventure-stats' }
vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => ({ push, replace, back: vi.fn(), beforeEach: vi.fn(), afterEach: vi.fn(), onError: vi.fn() })
}))

const played: string[] = []
vi.mock('@/use/useSfx', () => ({
  default: () => ({ play: (n: string) => played.push(n), preload: vi.fn(), enabled: { value: true }, setEnabled: vi.fn(), toggle: vi.fn(), playedSince: () => true })
}))
const burst = vi.fn()
vi.mock('canvas-confetti', () => ({ default: (...a: unknown[]) => burst(...a) }))

const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'de', messages: messages as never, missingWarn: false, fallbackWarn: false })
const opts = { global: { plugins: [i18n], stubs: { RouterLink: true } }, attachTo: document.body }
const josef = journeys.find((j) => j.id === 'josef')!

let warnings: string[] = []
beforeEach(() => {
  played.length = 0
  burst.mockClear()
  push.mockClear()
  replace.mockClear()
  warnings = []
  localStorage.clear()
  sessionStorage.clear()
  route.params = { journeyId: 'josef', stageId: '2' }
  route.query = {}
  vi.useFakeTimers()
  vi.spyOn(console, 'warn').mockImplementation((...a) => {
    warnings.push(a.map(String).join(' '))
  })
  vi.spyOn(console, 'error').mockImplementation((...a) => {
    warnings.push('ERROR ' + a.map(String).join(' '))
  })
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})
const problems = () => warnings.filter((w) => /not defined on instance|is not a function|Unhandled error|ERROR/.test(w))
const tick = async (ms: number) => {
  await vi.advanceTimersByTimeAsync(ms)
  await flushPromises()
}

/** The child has played some stages: the stars of every stage in the list (the rest not played). */
async function play(stars: number[], exam?: number) {
  const { default: useAdventure } = await import('@/use/useAdventure')
  const adv = useAdventure()
  adv.reset('josef')
  stars.forEach((n, i) => {
    adv.recordStars('josef', i + 1, n)
    adv.recordFinal('josef', i + 1, n)
    adv.completeStage('josef', i + 1)
  })
  if (exam !== undefined) adv.recordExam('josef', exam, josef.exam.length)
  return adv
}

describe('helpers of the statistics', () => {
  it('the cups rank bronze < silver < gold; the next cup and the missing points', () => {
    expect([null, 'bronze', 'silver', 'gold'].map((m) => medalRank(m as never))).toEqual([0, 1, 2, 3])
    expect(nextMedal(0, 42)).toEqual({ medal: 'bronze', missing: 21 })
    expect(nextMedal(21, 42)).toEqual({ medal: 'silver', missing: 11 })
    expect(nextMedal(32, 42)).toEqual({ medal: 'gold', missing: 6 })
    expect(nextMedal(38, 42)).toBeNull()
  })

  it('playing again from the statistics is marked for that one stage; the mark goes; the cup from before is read once', () => {
    markViaStats('josef', '3', 'silver')
    expect(isViaStats('josef', '3')).toBe(true)
    expect(isViaStats('josef', '4')).toBe(false)
    expect(isViaStats('noah', '3')).toBe(false)
    clearViaStats()
    expect(isViaStats('josef', '3')).toBe(false)
    expect(takeMedalBefore()).toBe('silver')
    expect(takeMedalBefore()).toBeUndefined()
    markViaStats('josef', 'pruefung', null)
    expect(takeMedalBefore()).toBeNull()
  })
})

describe('the celebration of a cup', () => {
  const celebrateWith = async (medal: 'bronze' | 'silver' | 'gold' | null) => {
    const { default: useCelebration } = await import('@/use/useCelebration')
    const { defineComponent, h } = await import('vue')
    let api!: ReturnType<typeof useCelebration>
    const w = mount(defineComponent({ setup() { api = useCelebration(); return () => h('div') } }), opts)
    api.celebrate(medal)
    return { w, api }
  }

  it('no cup, no celebration', async () => {
    await celebrateWith(null)
    await tick(5000)
    expect(played).toEqual([])
    expect(burst).not.toHaveBeenCalled()
  })

  it('bronze is quiet: the cup sound and one small shower', async () => {
    await celebrateWith('bronze')
    await tick(5000)
    expect(played).toEqual(['trophy'])
    expect(burst).toHaveBeenCalledTimes(1)
    expect((burst.mock.calls[0]![0] as { particleCount: number }).particleCount).toBeLessThan(50)
  })

  it('silver is a little more: the cup sound and a tone of a star, two showers', async () => {
    await celebrateWith('silver')
    await tick(5000)
    expect(played).toEqual(['trophy', 'star'])
    expect(burst).toHaveBeenCalledTimes(2)
  })

  it('gold is the full party: the fanfare, the cup sound, fireworks that go up one after the other for a few seconds', async () => {
    await celebrateWith('gold')
    await tick(300)
    expect(played).toEqual(['fanfare'])
    await tick(5000)
    expect(played).toEqual(['fanfare', 'trophy'])
    // six fireworks and one last shower, spread over time (not all at once)
    expect(burst.mock.calls.length).toBeGreaterThanOrEqual(7)
    for (const c of burst.mock.calls) expect((c[0] as { disableForReducedMotion?: boolean }).disableForReducedMotion).toBe(true)
  })

  it('the party is more than the one of silver and bronze', async () => {
    const counts: number[] = []
    for (const m of ['bronze', 'silver', 'gold'] as const) {
      burst.mockClear()
      const { w } = await celebrateWith(m)
      await tick(6000)
      counts.push(burst.mock.calls.reduce((n, c) => n + (c[0] as { particleCount: number }).particleCount, 0))
      w.unmount()
    }
    expect(counts[0]!).toBeLessThan(counts[1]!)
    expect(counts[1]!).toBeLessThan(counts[2]!)
  })

  it('leaving the page stops what is still to come', async () => {
    const { w } = await celebrateWith('gold')
    await tick(100)
    w.unmount()
    played.length = 0
    burst.mockClear()
    await tick(6000)
    expect(played).toEqual([])
    expect(burst).not.toHaveBeenCalled()
  })
})

describe('the statistics page', () => {
  const mountStats = async () => {
    const { default: Stats } = await import('@/views/app/AppAdventureStatsView.vue')
    const w = mount(Stats, opts)
    await flushPromises()
    return w
  }

  it('shows the stars of every stage and the exam, the sum, the cup and what is missing for the next one', async () => {
    await play([3, 2, 3, 1, 3, 3, 3, 3, 3, 3, 3, 3], 5)
    const w = await mountStats()
    const rows = w.findAll('.stats-row')
    expect(rows).toHaveLength(josef.stages.length + 1)
    expect(rows[0]!.find('.stats-name').text()).toBe(josef.stages[0]!.title)
    expect(rows.slice(0, 4).map((r) => r.find('[aria-label$="/ 3"]').attributes('aria-label'))).toEqual(['3 / 3', '2 / 3', '3 / 3', '1 / 3'])
    expect(rows[josef.stages.length]!.text()).toContain('5 von')
    const max = josef.stages.length * 3 + josef.exam.length
    const points = 3 + 2 + 3 + 1 + 8 * 3 + 5
    expect(w.find('.stats-total').text()).toBe(`Zusammen ${points} von ${max} Punkten`)
    expect(w.find('.stats-sum').text()).toBe(`Zusammen ${points} von ${max} Punkten`)
    expect(w.find('.stats-medal').text()).toBe('Pokal in Gold')
    expect(w.find('.stats-next').exists()).toBe(false)
    expect(problems()).toEqual([])
  })

  it('a cup that is not gold says how many points are missing for the next one; without the exam there is no cup yet', async () => {
    await play([3, 3, 3, 3, 3, 3, 1, 1, 1, 1, 1, 1], 3)
    const w = await mountStats()
    expect(w.find('.stats-medal').text()).toMatch(/Silber|Bronze/)
    expect(w.find('.stats-next').text()).toMatch(/noch \d+ Punkte/)
    await play([3, 3])
    const v = await mountStats()
    expect(v.find('.stats-cup-img').exists()).toBe(false)
    expect(v.find('.stats-line').text()).toContain('Prüfung')
    expect(v.text()).toContain('noch nicht')
    expect(v.find('.stats-cup .lk-btn').exists()).toBe(false)
  })

  it('"play again" is offered for stages that were played and have less than three stars, and for an exam with a wrong answer; the new result replaces the old one', async () => {
    await play([3, 2, 1, 3], 4)
    const w = await mountStats()
    const again = w.findAll('.stats-again')
    expect(again.map((b) => b.attributes('aria-label'))).toEqual([`Neu spielen: ${josef.stages[1]!.title}`, `Neu spielen: ${josef.stages[2]!.title}`, `Neu spielen: ${josef.exam.length ? 'Abenteuer-Prüfung' : ''}`])
    // a stage that was never played has no button
    expect(w.findAll('.stats-row')[5]!.find('.stats-again').exists()).toBe(false)
    await again[0]!.trigger('click')
    expect(push).toHaveBeenLastCalledWith({ name: 'app-adventure-stage', params: { journeyId: 'josef', stageId: String(josef.stages[1]!.id) } })
    expect(isViaStats('josef', String(josef.stages[1]!.id))).toBe(true)
    await again[2]!.trigger('click')
    expect(push).toHaveBeenLastCalledWith({ name: 'app-adventure-stage', params: { journeyId: 'josef', stageId: 'pruefung' } })
  })

  it('the present can be looked at as often as you like; "back" in the painting program is to lead back here (it carries the way back)', async () => {
    await play(Array(12).fill(3), 6)
    const w = await mountStats()
    const gift = w.findAll('button').find((b) => /^Geschenk/.test(b.text()))!
    await gift.trigger('click')
    await gift.trigger('click')
    expect(push).toHaveBeenCalledTimes(2)
    const to = push.mock.calls[1]![0] as { name: string; query: Record<string, string> }
    expect(to.name).toBe('app-coloring')
    expect(to.query).toMatchObject({ type: 'image', ret: 'stats:josef' })
    expect(to.query.source).toContain(josef.gift.image)
  })

  it('"back to the map" goes to the map; the page is a page of the journeys (a no-journey address shows nothing)', async () => {
    await play([3])
    const w = await mountStats()
    await w.find('.stats-back').trigger('click')
    expect(push).toHaveBeenLastCalledWith({ name: 'app-adventure-map', params: { journeyId: 'josef' } })
  })

  it('back from a stage that was played again to a better cup: the celebration once more; to the same cup or a worse one: none', async () => {
    const adv = await play([3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1, 1], 4)
    // silver before; now more stars: gold
    markViaStats('josef', '11', 'silver')
    adv.recordStars('josef', 11, 3)
    adv.recordFinal('josef', 11, 3)
    adv.recordStars('josef', 12, 3)
    adv.recordFinal('josef', 12, 3)
    adv.recordExam('josef', 6, josef.exam.length)
    const w = await mountStats()
    expect(w.find('.stats-medal').text()).toBe('Pokal in Gold')
    await tick(5000)
    expect(played).toContain('fanfare')
    expect(burst).toHaveBeenCalled()
    w.unmount()
    played.length = 0
    burst.mockClear()
    // the same cup as before: nothing
    markViaStats('josef', '11', 'gold')
    await mountStats()
    await tick(5000)
    expect(played).toEqual([])
    expect(burst).not.toHaveBeenCalled()
    // opened from the map (no replay): nothing
    await mountStats()
    await tick(5000)
    expect(burst).not.toHaveBeenCalled()
  })
})

describe('the way back from a stage that was played again', () => {
  const mountStage = async (stageId: string) => {
    route.params = { journeyId: 'josef', stageId }
    route.name = 'app-adventure-stage'
    const { default: Stage } = await import('@/views/app/AppAdventureStageView.vue')
    const w = mount(Stage, opts)
    await flushPromises()
    return w
  }

  it('the arrow back and "Zur Karte" of a stage that was opened from the statistics lead back to the statistics (once); a normal visit leads to the map', async () => {
    await play([3, 1])
    markViaStats('josef', '2', 'bronze')
    const w = await mountStage('2')
    await w.find('.stage-back').trigger('click')
    expect(replace).toHaveBeenLastCalledWith({ name: 'app-adventure-stats', params: { journeyId: 'josef' } })
    // the mark is used up: the second way back leads to the map
    const x = await mountStage('2')
    await x.find('.stage-back').trigger('click')
    expect(replace.mock.calls[replace.mock.calls.length - 1]![0].name).toBe('app-adventure-map')
  })

  it('a stage that was not opened from the statistics is not touched by the mark of another stage', async () => {
    await play([3, 1, 1])
    markViaStats('josef', '3', 'bronze')
    const w = await mountStage('2')
    await w.find('.stage-back').trigger('click')
    expect(replace.mock.calls[replace.mock.calls.length - 1]![0].name).toBe('app-adventure-map')
  })

  it('the exam result celebrates the cup: gold with the fanfare, fireworks; the result page tells the points', async () => {
    await play(Array(12).fill(3))
    const w = await mountStage('pruefung')
    expect(w.find('.quiz-q').exists()).toBe(true)
    for (let i = 0; i < josef.exam.length; i++) {
      const q = josef.exam[i]!
      const right = w.findAll('.quiz-option').find((o) => o.find('.quiz-text').text() === q.options[q.answer])!
      await right.trigger('click')
      await w.find('.quiz-next button').trigger('click')
      await flushPromises()
    }
    await tick(5000)
    expect(w.find('.result-medal').text()).toBe('Pokal in Gold')
    expect(played).toContain('fanfare')
    expect(burst).toHaveBeenCalled()
  })
})

describe('the map: the cup opens the statistics; first the stars, then the way', () => {
  const mountMap = async (query: Record<string, string> = {}) => {
    route.params = { journeyId: 'josef' }
    route.query = query
    route.name = 'app-adventure-map'
    const { default: MapView } = await import('@/views/app/AppAdventureView.vue')
    const w = mount(MapView, opts)
    await flushPromises()
    return w
  }

  it('the cup over the last station is a button that opens the statistics, with a label for screen readers; without a cup there is none', async () => {
    await play(Array(12).fill(3), 6)
    const w = await mountMap()
    const cup = w.find('button.spot-cup')
    expect(cup.exists()).toBe(true)
    expect(cup.attributes('aria-label')).toBe('Dein Pokal und deine Sterne')
    await cup.trigger('click')
    expect(push).toHaveBeenLastCalledWith({ name: 'app-adventure-stats', params: { journeyId: 'josef' } })
    await play([3, 3])
    const v = await mountMap()
    expect(v.find('button.spot-cup').exists()).toBe(false)
    expect(problems()).toEqual([])
  })

  it('coming back from a finished stage: the star tones ring first (no fanfare over them), and only then the coin and the beads of the way', async () => {
    await play([3, 3])
    await mountMap({ from: '2' })
    // the stars of stage 2: three tones, one after the other, nothing else yet
    await tick(1400)
    expect(played.filter((p) => p === 'star')).toHaveLength(3)
    expect(played).not.toContain('fanfare')
    expect(played).not.toContain('coin')
    expect(played).not.toContain('bead')
    // then the way lights up
    await tick(3000)
    expect(played).toContain('coin')
    expect(played).toContain('bead')
    const firstStarAt = played.indexOf('star')
    expect(played.indexOf('coin')).toBeGreaterThan(firstStarAt)
    expect(played.lastIndexOf('star')).toBeLessThan(played.indexOf('coin'))
  })

  it('a replay (at): the stars light up, the way does not', async () => {
    await play([3, 2])
    await mountMap({ at: '2' })
    await tick(5000)
    expect(played.filter((p) => p === 'star')).toHaveLength(2)
    expect(played).not.toContain('coin')
    expect(played).not.toContain('bead')
  })
})
