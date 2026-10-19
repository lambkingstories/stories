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
import { sampleAlong } from '@/utils/pitchSmear'

const push = vi.fn()
const replace = vi.fn()
const route = { params: { journeyId: 'josef', stageId: '2' } as Record<string, string>, query: {} as Record<string, string>, name: 'app-adventure-stage' }

vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => ({ push, replace, back: vi.fn(), beforeEach: vi.fn(), afterEach: vi.fn(), onError: vi.fn() })
}))

vi.mock('@/use/useSfx', () => ({
  default: () => ({ play: vi.fn(), preload: vi.fn(), enabled: { value: true }, setEnabled: vi.fn(), toggle: vi.fn(), playedSince: () => true })
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
    // the new result replaces the old one: no "best result" line any more, and the stage shows the new stars
    expect(w.text()).not.toContain('Dein bestes Ergebnis')
    expect(useAdventure().stageOf('josef', 2)?.finalStars).toBe(1)
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

describe('the stars of a journey are counted the same way everywhere', () => {
  it('the home page and the head of the map both count the stars of the stages plus the exam (at most 3 per stage plus the questions of the exam)', async () => {
    const { default: Home } = await import('@/views/app/AppAdventureHomeView.vue')
    const { default: MapView } = await import('@/views/app/AppAdventureView.vue')
    const { default: useAdventure } = await import('@/use/useAdventure')
    const { maxPoints } = await import('@/utils/adventureScore')
    const adv = useAdventure()
    adv.reset('josef')
    adv.recordStars('josef', 1, 3)
    adv.recordFinal('josef', 1, 3)
    adv.completeStage('josef', 1)
    adv.recordStars('josef', 2, 2)
    adv.recordFinal('josef', 2, 2)
    adv.completeStage('josef', 2)
    adv.recordExam('josef', 4, journeys[0]!.exam.length)
    const max = maxPoints(journeys[0]!)
    expect(max).toBe(journeys[0]!.stages.length * 3 + journeys[0]!.exam.length)
    const home = mount(Home, opts)
    await flushPromises()
    route.params = { journeyId: 'josef' }
    const map = mount(MapView, opts)
    await flushPromises()
    // 3 + 2 stars + 4 right answers of the exam
    expect(home.find('.stars-count').text()).toBe(`9 / ${max}`)
    expect(map.find('.map-points').text()).toBe(`9 / ${max}`)
    adv.reset('josef')
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

describe('the new games of Noah (build, share)', () => {
  const grab = async (el: { element: Element }) => {
    // a tap on a piece: pointer down and up without moving chooses it (the second way to play, next to dragging)
    el.element.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 5, clientY: 5 }))
    window.dispatchEvent(new MouseEvent('pointerup', { clientX: 5, clientY: 5 }))
    await flushPromises()
  }
  type Wrapper = ReturnType<typeof mount>
  const emitted = (w: Wrapper) => w.emitted('done') as number[][] | undefined
  const finish = async (w: Wrapper) => {
    const b = w.findAll('button').find((x) => /^Weiter$/.test(x.text()))
    expect(b, 'the "Weiter" button at the end of the game').toBeTruthy()
    await b!.trigger('click')
  }
  const tick = async (ms: number) => {
    await vi.advanceTimersByTimeAsync(ms)
    await flushPromises()
  }
  const parts = async () => {
    const { default: useTaskProgress } = await import('@/use/useTaskProgress')
    return useTaskProgress().parts.value
  }
  beforeEach(async () => {
    vi.useFakeTimers()
    const { default: useTaskProgress } = await import('@/use/useTaskProgress')
    useTaskProgress().reset()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  // ---- Teilen / Verteilen ----
  describe('share', () => {
    const mountShare = async () => {
      const { default: Share } = await import('@/components/molecules/games/GameShare.vue')
      const { noah } = await import('@/data/adventures/noah')
      return mount(Share, { ...opts, props: { game: noah.stages[2]!.task.share! } })
    }
    const give = async (w: Wrapper, basket: number, receiver: number) => {
      await grab(w.findAll('.sh-basket')[basket]!)
      await w.findAll('.sh-card')[receiver]!.trigger('click')
    }
    const indexOfKind = (w: Wrapper, re: RegExp) => w.findAll('.sh-basket').findIndex((b) => re.test(b.attributes('aria-label') ?? ''))
    const FRUIT = /Feigen|Datteln|Trauben|Granatäpfeln|Oliven/
    const NOBODY = /leeren Krug|Holzhammer/
    // the cards of round 1: the family, the dove, the camel, the sheep; round 2 adds the goat and the donkey
    const [FAMILY, DOVE, CAMEL, SHEEP, GOAT, DONKEY] = [0, 1, 2, 3, 4, 5]
    /** Round 1 right: fruit to the family, grain to the dove, hay to the camel and the sheep; the distractor stays. */
    const round1 = async (w: Wrapper) => {
      let hay = 0
      for (;;) {
        const i = w.findAll('.sh-basket').findIndex((b) => !NOBODY.test(b.attributes('aria-label') ?? ''))
        if (i < 0) break
        const label = w.findAll('.sh-basket')[i]!.attributes('aria-label') ?? ''
        await give(w, i, FRUIT.test(label) ? FAMILY : /Futterkörnern/.test(label) ? DOVE : hay++ % 2 ? SHEEP : CAMEL)
      }
      await tick(600 + 1400)
    }
    /** Round 2: fruit to the family, grain to the dove, hay to the four others (one each, then the rest); then "Done". */
    const round2 = async (w: Wrapper) => {
      let hay = 0
      for (;;) {
        const i = w.findAll('.sh-basket').findIndex((b) => !NOBODY.test(b.attributes('aria-label') ?? ''))
        if (i < 0) break
        const label = w.findAll('.sh-basket')[i]!.attributes('aria-label') ?? ''
        await give(w, i, FRUIT.test(label) ? FAMILY : /Futterkörnern/.test(label) ? DOVE : [CAMEL, SHEEP, GOAT, DONKEY][hay++ % 4]!)
      }
      await press(w, /^Fertig$/)
    }

    it('round 1: the family and three animals, six things in the tray, and nothing shown beforehand (no target baskets, no food on the cards, no numbers)', async () => {
      const w = await mountShare()
      expect(w.findAll('.sh-card').length).toBe(4)
      expect(w.findAll('.sh-card').map((c) => c.attributes('aria-label')).join(' ')).toMatch(/Noahs Familie.*die Taube.*das Kamel.*das Schaf/)
      expect(w.findAll('.sh-basket').length).toBe(6)
      expect(w.findAll('.sh-slot').length).toBe(0)
      for (const c of w.findAll('.sh-card')) expect(c.findAll('img').length, c.attributes('aria-label')).toBe(1)
      expect(w.find('.sh-round').text()).toContain('Runde 1 von 2')
      expect(w.text()).not.toMatch(/Marke|Zahl/)
      expect(problems()).toEqual([])
    })

    it('the family gets different fruits (five kinds that look different); every animal its own food: the dove grain, the others hay', async () => {
      const { noah } = await import('@/data/adventures/noah')
      const share = noah.stages[2]!.task.share!
      const family = share.receivers[0]!
      expect(family.accepts).toHaveLength(5)
      const fruitImages = share.baskets.filter((b) => family.accepts.includes(b.id)).map((b) => b.image)
      expect(new Set(fruitImages).size).toBe(5)
      expect(share.receivers.find((r) => r.id === 'taube')!.accepts).toEqual(['korn'])
      for (const id of ['kamel', 'schaf', 'ziege', 'esel']) expect(share.receivers.find((r) => r.id === id)!.accepts, id).toEqual(['heu'])
      const w = await mountShare()
      const fruits = w.findAll('.sh-basket').filter((b) => FRUIT.test(b.attributes('aria-label') ?? ''))
      expect(fruits.length).toBe(2)
      expect(new Set(fruits.map((f) => f.attributes('aria-label'))).size).toBe(2)
    })

    it('the right food gets a green tick and stays: fruit to the family, grain to the dove, hay to the camel', async () => {
      const w = await mountShare()
      await give(w, indexOfKind(w, FRUIT), FAMILY)
      expect(w.findAll('.sh-card')[FAMILY]!.find('.gm.good').exists()).toBe(true)
      await give(w, indexOfKind(w, /Futterkörnern/), DOVE)
      expect(w.findAll('.sh-card')[DOVE]!.find('.gm.good').exists()).toBe(true)
      await give(w, indexOfKind(w, /Heu/), CAMEL)
      expect(w.findAll('.sh-card')[CAMEL]!.find('.gm.good').exists()).toBe(true)
      expect(w.findAll('.sh-slot.filled').length).toBe(3)
      expect(w.findAll('.sh-basket').length).toBe(3)
      expect(await parts()).toBe(3)
    })

    it('the wrong food gets a red cross and a short sentence, and springs back (the dove eats no hay, the camel likes no grain, the family eats no hay)', async () => {
      const w = await mountShare()
      const before = w.findAll('.sh-basket').length
      const wrong = async (basket: RegExp, receiver: number, sentence: string) => {
        await give(w, indexOfKind(w, basket), receiver)
        expect(w.findAll('.sh-card')[receiver]!.find('.gm.bad').exists(), sentence).toBe(true)
        expect(w.find('.sh-fb').text()).toBe(sentence)
        expect(w.findAll('.sh-basket').length).toBe(before)
        await tick(1000)
      }
      await wrong(/Heu/, DOVE, 'Die Taube frisst kein Heu.')
      await wrong(/Futterkörnern/, CAMEL, 'Das Kamel mag keine Körner.')
      await wrong(/Futterkörnern/, SHEEP, 'Das Schaf mag keine Körner.')
      await wrong(/Heu/, FAMILY, 'Noahs Familie isst kein Heu.')
      await wrong(/Futterkörnern/, FAMILY, 'Noahs Familie isst keine Futterkörner.')
      await wrong(FRUIT, CAMEL, 'Das ist nichts für das Kamel.')
      await wrong(FRUIT, DOVE, 'Das ist nichts für die Taube.')
      expect(await parts()).toBe(0)
    })

    it('what nobody needs (empty jug, wooden hammer) is a mistake with a red cross wherever it goes, and it does not hold up the end of the round', async () => {
      const w = await mountShare()
      await give(w, indexOfKind(w, /leeren Krug/), FAMILY)
      expect(w.findAll('.sh-card')[FAMILY]!.find('.gm.bad').exists()).toBe(true)
      expect(w.find('.sh-fb').text()).toContain('niemand')
      expect(w.findAll('.sh-basket').length).toBe(6)
      await tick(1000)
      await round1(w)
      // round 1 is over although the empty jug is still in the tray; round 2 has more animals and more things
      expect(w.find('.sh-round').text()).toContain('Runde 2 von 2')
      expect(w.findAll('.sh-card').length).toBe(6)
      expect(w.findAll('.sh-basket').length).toBe(11)
      await give(w, indexOfKind(w, /Holzhammer/), GOAT)
      expect(w.findAll('.sh-card')[GOAT]!.find('.gm.bad').exists()).toBe(true)
      expect(w.find('.sh-fb').text()).toContain('niemand')
      expect(w.findAll('.sh-basket').length).toBe(11)
    })

    it('round 2 is free sharing: the goat and the donkey take hay, "Done" with somebody empty only wiggles (the first time no mistake); sharing right gives three stars', async () => {
      const w = await mountShare()
      await round1(w)
      expect(w.find('.sh-finish').exists()).toBe(true)
      await press(w, /^Fertig$/)
      expect(w.findAll('.sh-card.wobble').length).toBe(6)
      expect(w.find('.sh-fb').text()).toContain('nichts')
      await tick(1000)
      await give(w, indexOfKind(w, /Heu/), GOAT)
      expect(w.findAll('.sh-card')[GOAT]!.find('.gm.good').exists()).toBe(true)
      await give(w, indexOfKind(w, /Heu/), DONKEY)
      expect(w.findAll('.sh-card')[DONKEY]!.find('.gm.good').exists()).toBe(true)
      await tick(1000)
      await round2(w)
      await tick(0)
      expect(w.text()).toContain('Jeder hat genug')
      await finish(w)
      expect(emitted(w)).toEqual([[3]])
      expect(problems()).toEqual([])
    })

    it('mistakes cost stars: three wrong ones and a second empty "Done" leave two stars; six mistakes one star', async () => {
      for (const [mistakes, stars] of [[3, 2], [6, 1]] as const) {
        const w = await mountShare()
        for (let i = 0; i < mistakes; i++) await give(w, indexOfKind(w, /Heu/), DOVE)
        await round1(w)
        if (mistakes === 3) {
          await press(w, /^Fertig$/)
          await press(w, /^Fertig$/)
        }
        await round2(w)
        await tick(0)
        await finish(w)
        // 3 + 1 mistakes: up to 5 mistakes are two stars
        expect(emitted(w), `${mistakes} mistakes`).toEqual([[stars]])
        w.unmount()
      }
    })
  })

  // ---- Arche bauen ----
  describe('build', () => {
    /** `rounds`: another set of rounds for the same ark (the game can also show a round without the outline). */
    const mountBuild = async (rounds?: BuildRounds) => {
      const { default: Build } = await import('@/components/molecules/games/GameBuild.vue')
      const { noah } = await import('@/data/adventures/noah')
      const game = { ...noah.stages[1]!.task.build!, ...(rounds ? { rounds } : {}) }
      return { w: mount(Build, { ...opts, props: { game } }), game }
    }
    type BuildRounds = NonNullable<ReturnType<typeof import('@/data/adventures/noah').noah.stages[1]['task']['build']>>['rounds']
    type BuildData = NonNullable<Awaited<ReturnType<typeof mountBuild>>['game']>
    const IDS = ['oben', 'mitte', 'unten', 'tuer', 'fenster', 'rampe']
    const set = async (w: Wrapper, game: BuildData, id: string, zone = id) => {
      const label = game.pieces.find((p) => p.id === id)!.label
      const piece = w.findAll('.bd-piece').find((p) => p.attributes('aria-label') === `Teil: ${label}`)!
      await grab(piece)
      await w.find(`.bd-zone[data-drop="${zone}"]`).trigger('click')
    }
    const buildRound = async (w: Wrapper, game: BuildData) => {
      for (const id of IDS) await set(w, game, id)
      await tick(700 + 1400)
    }

    it('the window band is only 13 px high, but a part set a finger-width beside it still lands (the place is at least 48 px), and one set far away does not', async () => {
      const { w, game } = await mountBuild()
      const board = w.find('.bd-board').element as HTMLElement
      board.getBoundingClientRect = () => ({ left: 0, top: 0, right: 600, bottom: 143, width: 600, height: 143, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect
      const band = game.pieces.find((p) => p.id === 'fenster')!
      const cx = ((band.x + band.w / 2) / 100) * 600
      const cy = ((band.y + band.h / 2) / 100) * 143
      expect((band.h / 100) * 143).toBeLessThan(20)
      const tapAt = async (y: number) => {
        const piece = w.findAll('.bd-piece').find((p) => p.attributes('aria-label') === `Teil: ${band.label}`)!
        await grab(piece)
        board.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: cx, clientY: y }))
        await flushPromises()
      }
      await tapAt(cy + 40)
      expect(w.find('.bd-board .gm.bad').exists()).toBe(true)
      expect(w.findAll('.bd-placed').length).toBe(0)
      await tick(1000)
      await tapAt(cy + 20)
      expect(w.findAll('.bd-placed').length).toBe(1)
    })

    it('round 1 shows the shadow of the plan and six parts in the tray', async () => {
      const { w } = await mountBuild()
      expect(w.find('.bd-shadow').exists()).toBe(true)
      expect(w.findAll('.bd-piece').length).toBe(6)
      expect(w.findAll('.bd-zone.shown').length).toBe(6)
      expect(w.find('.bd-round').text()).toContain('Runde 1 von 2')
      expect(problems()).toEqual([])
    })

    it('a part at its place stays (green tick); at a wrong place it springs back (red cross); any order works', async () => {
      const { w, game } = await mountBuild()
      await set(w, game, 'tuer', 'oben')
      expect(w.find('.bd-board .gm.bad').exists()).toBe(true)
      expect(w.findAll('.bd-piece').length).toBe(6)
      // the ramp first, the top deck last: the order is free
      await set(w, game, 'rampe')
      expect(w.findAll('.bd-placed').length).toBe(1)
      expect(w.find('.bd-board .gm.good').exists()).toBe(true)
      expect(w.findAll('.bd-piece').length).toBe(5)
      expect(await parts()).toBe(1)
    })

    it('round 2 has no shadow; after two wrong tries the right place glows', async () => {
      // the data has two rounds now; this is the round without outline for an ark with three
      const { w, game } = await mountBuild([{ hint: 'Runde 1: mit Umriss', outline: true }, { hint: 'Runde 2: ohne Umriss' }, { hint: 'Runde 3: Pech', pitch: true }])
      await buildRound(w, game)
      expect(w.find('.bd-round').text()).toContain('Runde 2 von 3')
      expect(w.find('.bd-shadow').exists()).toBe(false)
      expect(w.findAll('.bd-piece').length).toBe(6)
      expect(w.findAll('.bd-zone.glow').length).toBe(0)
      await set(w, game, 'tuer', 'mitte')
      await set(w, game, 'tuer', 'unten')
      expect(w.findAll('.bd-zone.glow').length).toBe(1)
      expect(w.find('.bd-zone.glow').attributes('data-drop')).toBe('tuer')
    })

    // ---- the pitch: the finger smears along the seams ----
    type Seam = [number, number][]
    /** The wall of the pitch round in a box of 900 x 1200 (jsdom has no layout), so that a pixel is a unit of the picture. */
    const mountPitch = async () => {
      const m = await mountBuild([{ hint: 'Pech', pitch: true }])
      const wall = m.w.find('.bd-wall').element as HTMLElement
      wall.getBoundingClientRect = () => ({ left: 0, top: 0, right: 900, bottom: 1200, width: 900, height: 1200, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect
      const seams: Seam[] = m.game.pitch!.seams.map((sm) => sm.points.map(([x, y]) => [(x * 900) / 100, (y * 1200) / 100] as [number, number]))
      return { ...m, wall, seams }
    }
    const pointer = (el: Element, type: string, x: number, y: number) =>
      el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y }))
    /** The finger goes along the points (shifted by `dy`), `share` of the way; then it is lifted. */
    const smear = async (wall: HTMLElement, line: Seam, opts2: { dy?: number; share?: number } = {}) => {
      const dy = opts2.dy ?? 0
      const dense = sampleAlong(line, 40)
      const pts = dense.slice(0, Math.max(2, Math.round(dense.length * (opts2.share ?? 1))))
      pointer(wall, 'pointerdown', pts[0]![0], pts[0]![1] + dy)
      for (const [x, y] of pts.slice(1)) pointer(wall, 'pointermove', x, y + dy)
      pointer(wall, 'pointerup', pts[pts.length - 1]![0], pts[pts.length - 1]![1] + dy)
      await flushPromises()
    }
    const open = (w: Wrapper) => w.findAll('.bd-sr').filter((b) => !(b.element as HTMLButtonElement).disabled).length

    it('round 2: three seams, nothing is closed by tapping, the wall does not scroll under the finger', async () => {
      const { w, wall, seams } = await mountPitch()
      expect(w.findAll('.bd-sr').length).toBe(3)
      expect(w.find('.bd-count').text()).toContain('0 von 3')
      // a tap is not enough: a tap on the seam does not close it
      const mid = sampleAlong(seams[0]!, 5)[2]!
      pointer(wall, 'pointerdown', mid[0], mid[1])
      pointer(wall, 'pointerup', mid[0], mid[1])
      await flushPromises()
      expect(open(w)).toBe(3)
      expect(w.find('.bd-count').text()).toContain('0 von 3')
      expect(w.find('.bd-tray, .bd-zone').exists()).toBe(false)
      expect(problems()).toEqual([])
    })

    it('smearing along a seam draws black pitch that follows the finger; when 90 % are covered the seam is done (green tick)', async () => {
      const { w, wall, seams } = await mountPitch()
      // 50 % of the way: pitch lies there, but the seam is not done
      await smear(wall, seams[0]!, { share: 0.5 })
      expect(w.findAll('polyline.bd-ink').length).toBeGreaterThan(0)
      expect(w.find('.bd-pot').exists()).toBe(true)
      expect(open(w)).toBe(3)
      // the whole way: done, tick, counted
      await smear(wall, seams[0]!)
      expect(open(w)).toBe(2)
      expect(w.find('.bd-wall .gm.good').exists()).toBe(true)
      expect(w.find('.bd-count').text()).toContain('1 von 3')
      expect(await parts()).toBe(1)
      expect(w.find('.gm.bad').exists()).toBe(false)
    })

    it('a stroke a bit beside the seam (within the tolerance) still counts; beside that nothing sticks and a red cross shows', async () => {
      const { w, wall, seams } = await mountPitch()
      await smear(wall, seams[0]!, { dy: 30 })
      expect(open(w)).toBe(2)
      // 150 units beside the second seam: no pitch, red cross, one mistake
      const before = w.findAll('polyline.bd-ink').length
      await smear(wall, seams[1]!, { dy: 150 })
      expect(w.findAll('polyline.bd-ink').length).toBe(before)
      expect(w.find('.bd-wall .gm.bad').exists()).toBe(true)
      expect(w.find('.bd-fb').text()).toContain('neben der Fuge')
      expect(open(w)).toBe(2)
    })

    it('every stray counts once (at most every 0.8 s): five strays are two stars, six are one star', async () => {
      for (const [strays, stars] of [[5, 2], [6, 1]] as const) {
        const { w, wall, seams } = await mountPitch()
        for (let i = 0; i < strays; i++) {
          await smear(wall, seams[1]!, { dy: 150 })
          await tick(900)
        }
        for (const b of w.findAll('.bd-sr')) await b.trigger('click')
        await tick(1300)
        await finish(w)
        expect(emitted(w), `${strays} strays`).toEqual([[stars]])
      }
    })

    it('a wiggle that strays is one mistake, not one per move', async () => {
      const { w, wall, seams } = await mountPitch()
      pointer(wall, 'pointerdown', seams[1]![0]![0], seams[1]![0]![1] + 200)
      for (let k = 0; k < 15; k++) pointer(wall, 'pointermove', 100 + k * 30, seams[1]![0]![1] + 200)
      pointer(wall, 'pointerup', 500, seams[1]![0]![1] + 200)
      await flushPromises()
      for (const b of w.findAll('.bd-sr')) await b.trigger('click')
      await tick(1300)
      await finish(w)
      expect(emitted(w)).toEqual([[3]])
    })

    it('all three seams (straight, curved, zigzag) smeared: "Dicht!", three stars without a mistake', async () => {
      const { w, wall, seams } = await mountPitch()
      for (const line of seams) await smear(wall, line)
      expect(w.find('.bd-tight').text()).toContain('Dicht')
      expect(w.find('.bd-count').text()).toContain('3 von 3')
      await tick(1300)
      expect(w.text()).toContain('Die Arche steht und ist dicht')
      await finish(w)
      expect(emitted(w)).toEqual([[3]])
      expect(problems()).toEqual([])
    })

    it('a quick swipe (few reports of the finger) leaves no holes', async () => {
      const { w, wall, seams } = await mountPitch()
      // only the two ends of the straight seam are reported: the way between is walked in small steps
      pointer(wall, 'pointerdown', seams[0]![0]![0], seams[0]![0]![1])
      pointer(wall, 'pointermove', seams[0]![1]![0], seams[0]![1]![1])
      pointer(wall, 'pointerup', seams[0]![1]![0], seams[0]![1]![1])
      await flushPromises()
      expect(open(w)).toBe(2)
    })

    it('without a finger: every seam has a button for screen readers and the keyboard', async () => {
      const { w } = await mountPitch()
      const buttons = w.findAll('.bd-sr')
      expect(buttons.map((b) => b.attributes('aria-label'))).toEqual([1, 2, 3].map((n) => `Fuge ${n} mit Pech füllen (ohne Wischen)`))
      for (const b of buttons) await b.trigger('click')
      expect(w.find('.bd-count').text()).toContain('3 von 3')
      await tick(1300)
      await finish(w)
      expect(emitted(w)).toEqual([[3]])
    })

    it('the help in the pitch round: after five quiet seconds the open seams glow; every smear starts the wait again', async () => {
      const { w, wall, seams } = await mountPitch()
      const glowing = () => w.findAll('polyline.bd-help').filter((l) => (l.element as SVGElement).style.display !== 'none').length
      expect(glowing()).toBe(0)
      await tick(4000)
      expect(glowing()).toBe(0)
      await tick(1100)
      expect(glowing()).toBe(3)
      await smear(wall, seams[0]!)
      expect(glowing()).toBe(0)
      await tick(5100)
      // the seam that is done does not glow any more
      expect(glowing()).toBe(2)
    })

    it('the whole ark: round 1 with parts, round 2 the pitch, in the data as it is', async () => {
      const { w, game } = await mountBuild()
      await buildRound(w, game)
      expect(w.find('.bd-round').text()).toContain('Runde 2 von 2')
      expect(w.find('.bd-wall').exists()).toBe(true)
      expect(w.findAll('.bd-sr').length).toBe(3)
    })

    it('six mistakes with the parts are one star, and nothing is lost on the way', async () => {
      const { w, game } = await mountBuild()
      for (let i = 0; i < 6; i++) await set(w, game, 'tuer', 'oben')
      await buildRound(w, game)
      for (const b of w.findAll('.bd-sr')) await b.trigger('click')
      await tick(1300)
      await finish(w)
      expect(emitted(w)).toEqual([[1]])
    })
  })
})

describe('the games of Noah, wave 2 (dots, steering, altar)', () => {
  type Wrapper = ReturnType<typeof mount>
  const emitted = (w: Wrapper) => w.emitted('done') as number[][] | undefined
  const finish = async (w: Wrapper) => {
    const b = w.findAll('button').find((x) => /^Weiter$/.test(x.text()))
    expect(b, 'the "Weiter" button at the end of the game').toBeTruthy()
    await b!.trigger('click')
  }
  const tick = async (ms: number) => {
    await vi.advanceTimersByTimeAsync(ms)
    await flushPromises()
  }
  const parts = async () => {
    const { default: useTaskProgress } = await import('@/use/useTaskProgress')
    return useTaskProgress().parts.value
  }
  const noahStage = async (id: number) => (await import('@/data/adventures/noah')).noah.stages[id - 1]!
  /** A box of a fixed size for the playing field (jsdom has no layout). */
  const sized = (w: Wrapper, selector: string, width: number, height: number) => {
    const el = w.find(selector).element
    el.getBoundingClientRect = () => ({ left: 0, top: 0, right: width, bottom: height, width, height, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect
  }
  beforeEach(async () => {
    vi.useFakeTimers()
    const { default: useTaskProgress } = await import('@/use/useTaskProgress')
    useTaskProgress().reset()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  // ---- Punkte verbinden ----
  describe('dots', () => {
    const mountDots = async () => {
      const { default: Dots } = await import('@/components/molecules/games/GameDots.vue')
      const game = (await noahStage(6)).task.dots!
      return mount(Dots, { ...opts, props: { game } })
    }
    const dot = (w: Wrapper, i: number) => w.findAll('.dt-dot')[i]!
    // the number of dots is the one of the painted picture (measured), the parts of the help are thirds of it
    const N = 16
    const THIRD = Math.ceil(N / 3)

    it('the tap area of a dot is 44 px, but never reaches into the next dot (no two areas overlap), and a dot at the edge stays inside the picture', async () => {
      const w = await mountDots()
      const { noah } = await import('@/data/adventures/noah')
      const pts = noah.stages[5]!.task.dots!.points
      const side = (i: number, width: number) => {
        const m = /--s:\s*min\(44px,\s*([\d.]+)cqw\)/.exec(dot(w, i).attributes('style') ?? '')
        return m ? Math.min(44, (Number(m[1]) * width) / 100) : 44
      }
      for (const width of [280, 340, 420]) {
        for (let i = 0; i < pts.length; i++) {
          expect(side(i, width), `dot ${i + 1}`).toBeLessThanOrEqual(44)
          for (let j = i + 1; j < pts.length; j++) {
            // the picture is 3 : 4, the areas are circles
            const d = Math.hypot((pts[i]![0] - pts[j]![0]) * (width / 100), (pts[i]![1] - pts[j]![1]) * ((width * 4) / 3 / 100))
            expect((side(i, width) + side(j, width)) / 2, `dots ${i + 1} and ${j + 1} at ${width} px`).toBeLessThanOrEqual(d + 0.01)
          }
        }
      }
      // wherever there is room the area is the full 44 px, and every dot at the edge is clamped to lie inside
      expect(dot(w, 0).attributes('style')).toContain('clamp(')
      expect(dot(w, 0).attributes('style')).toMatch(/left:\s*clamp\(calc\(var\(--s\) \/ 2\), 3%/)
    })

    it('shows all the dots, the picture is dimmed and nothing is shown in colour yet', async () => {
      const w = await mountDots()
      expect(w.findAll('.dt-dot').length).toBe(N)
      expect(w.find('.dt-color').attributes('style')).toContain('inset(0 100% 0 0)')
      expect(w.find('.dt-count').text()).toContain(`0 von ${N}`)
      expect(dot(w, 0).classes()).toContain('pulse')
      expect(problems()).toEqual([])
    })

    it('a right dot turns green and shows more of the picture; a wrong one gets a red cross and is no step', async () => {
      const w = await mountDots()
      await dot(w, 3).trigger('click')
      expect(dot(w, 3).find('.gm.bad').exists()).toBe(true)
      expect(w.find('.dt-count').text()).toContain(`0 von ${N}`)
      expect(await parts()).toBe(0)
      await dot(w, 0).trigger('click')
      await dot(w, 1).trigger('click')
      expect(dot(w, 0).classes()).toContain('done')
      expect(dot(w, 0).attributes('disabled')).toBeDefined()
      expect(w.find('.dt-count').text()).toContain(`2 von ${N}`)
      expect(w.find('.dt-color').attributes('style')).not.toContain('inset(0 100% 0 0)')
      expect(await parts()).toBe(2)
    })

    it('the help gets less: it pulses always in part 1, only after a wrong tap in part 2, and in part 3 only after three wrong taps', async () => {
      const w = await mountDots()
      for (let i = 0; i < THIRD; i++) await dot(w, i).trigger('click')
      expect(dot(w, THIRD).classes()).not.toContain('pulse')
      await dot(w, N - 1).trigger('click')
      expect(dot(w, THIRD).classes()).toContain('pulse')
      await dot(w, THIRD).trigger('click')
      expect(dot(w, THIRD + 1).classes()).not.toContain('pulse')
      for (let i = THIRD + 1; i < 2 * THIRD; i++) await dot(w, i).trigger('click')
      expect(dot(w, 2 * THIRD).classes()).not.toContain('pulse')
      for (const i of [N - 1, N - 1, N - 1]) await dot(w, i).trigger('click')
      expect(dot(w, 2 * THIRD).classes()).toContain('pulse')
    })

    it('all dots: the whole picture in colour; three stars with up to three mistakes, one star after nine', async () => {
      const w = await mountDots()
      await dot(w, 5).trigger('click')
      for (let i = 0; i < N; i++) await dot(w, i).trigger('click')
      expect(w.find('.dt-color').attributes('style')).toContain('inset(0 0% 0 0)')
      await tick(300)
      await finish(w)
      expect(emitted(w)).toEqual([[3]])
      const v = await mountDots()
      for (let k = 0; k < 9; k++) await dot(v, N - 1).trigger('click')
      for (let i = 0; i < N; i++) await dot(v, i).trigger('click')
      await finish(v)
      expect(emitted(v)).toEqual([[1]])
      expect(problems()).toEqual([])
    })
  })

  // ---- Steuern ----
  describe('steering', () => {
    const mountFly = async () => {
      const { default: Fly } = await import('@/components/molecules/games/GameFly.vue')
      const game = (await noahStage(7)).task.fly!
      const w = mount(Fly, { ...opts, props: { game } })
      sized(w, '.fl-sky', 300, 400)
      return { w, game }
    }
    const sky = (w: Wrapper) => w.find('.fl-sky').element
    const at = (type: string, x: number, y: number) => new MouseEvent(type, { bubbles: true, button: 0, clientX: (x / 100) * 300, clientY: (y / 100) * 400 })
    /** The finger goes down at the first point and moves on through the others (percent of the sky). */
    const fly = async (w: Wrapper, path: [number, number][]) => {
      sky(w).dispatchEvent(at('pointerdown', path[0]![0], path[0]![1]))
      for (const [x, y] of path.slice(1)) sky(w).dispatchEvent(at('pointermove', x, y))
      sky(w).dispatchEvent(at('pointerup', path[path.length - 1]![0], path[path.length - 1]![1]))
      await flushPromises()
    }
    const ROUND1: [number, number][] = [[17, 80], [30, 72], [46, 64], [60, 55], [72, 46], [60, 38], [44, 35], [30, 50], [17, 80]]
    const ROUND2: [number, number][] = [[17, 80], [28, 70], [40, 62], [62, 44], [79, 17], [50, 50], [30, 70], [17, 80]]

    it('shows the sky, the dove at the ark window, three lights, and the first hint', async () => {
      const { w } = await mountFly()
      expect(w.findAll('.fl-target.light').length).toBe(3)
      expect(w.find('.fl-dove').exists()).toBe(true)
      expect(w.find('.fl-home').exists()).toBe(true)
      expect(w.find('.fl-round').text()).toContain('Runde 1 von 2')
      // the counter counts the lights of this round (three in the first)
      expect(w.find('.fl-count').text()).toContain('0 von 3')
      expect(problems()).toEqual([])
    })

    it('a finger path through the lights touches them (a ticked light), even when a swipe jumps over one', async () => {
      const { w } = await mountFly()
      await fly(w, [[17, 80], [95, 20]])
      // the straight line from the ark to the top right passes two of the three lights
      expect(w.findAll('.fl-target.light.caught').length).toBeGreaterThanOrEqual(1)
      expect(w.find('.fl-target.light.caught .gm.good').exists()).toBe(true)
      expect(await parts()).toBeGreaterThanOrEqual(1)
    })

    it('a mouse or a finger that is not pressed does not steer, a pressed one does', async () => {
      const { w } = await mountFly()
      sky(w).dispatchEvent(at('pointermove', 46, 64))
      await flushPromises()
      expect(w.findAll('.fl-target.light.caught').length).toBe(0)
      await fly(w, [[17, 80], [46, 64]])
      expect(w.findAll('.fl-target.light.caught').length).toBe(1)
    })

    it('the arrow keys steer too', async () => {
      const { w } = await mountFly()
      for (let i = 0; i < 6; i++) await w.find('.fl-sky').trigger('keydown', { key: 'ArrowRight' })
      for (let i = 0; i < 4; i++) await w.find('.fl-sky').trigger('keydown', { key: 'ArrowUp' })
      expect(w.find('.fl-dove').attributes('style')).toContain('left: 65%')
      expect(w.find('.fl-dove').attributes('style')).toContain('top: 56%')
    })

    it('round 1 ends with the dove in the ark; round 2 needs the leaf: without it only a gentle "not yet", with it the game is done with three stars', async () => {
      const { w } = await mountFly()
      await fly(w, ROUND1)
      expect(w.findAll('.fl-target.light.caught').length).toBe(3)
      await tick(1500)
      expect(w.find('.fl-round').text()).toContain('Runde 2 von 2')
      expect(w.findAll('.fl-target').length).toBe(3)
      // home without the leaf
      await fly(w, [[17, 80], [40, 62], [62, 44], [40, 70], [17, 80]])
      expect(w.find('.fl-fb').text()).toContain('kein Blatt')
      expect(w.find('.fl-home .gm.bad').exists()).toBe(true)
      expect(w.find('.fl-round').text()).toContain('Runde 2 von 2')
      // the leaf, then home
      await fly(w, [[17, 80], [40, 60], [79, 17]])
      expect(w.find('.fl-carried').exists()).toBe(true)
      await fly(w, [[50, 50], [30, 70], [17, 80]])
      await tick(900)
      expect(w.text()).toContain('Die Taube ist zurück')
      await finish(w)
      expect(emitted(w)).toEqual([[3]])
      expect(problems()).toEqual([])
    })

    it('missed lights only count as missed: three of five lights are two stars, and the dove may go home at any time in round 1', async () => {
      const { w } = await mountFly()
      // round 1: only the first light, then straight home
      await fly(w, [[17, 80], [30, 72], [46, 64], [30, 72], [17, 80]])
      expect(w.findAll('.fl-target.light.caught').length).toBe(1)
      await tick(1500)
      expect(w.find('.fl-round').text()).toContain('Runde 2 von 2')
      // round 2: both lights, the leaf, home -> 3 of 5
      await fly(w, ROUND2)
      await tick(900)
      await finish(w)
      expect(emitted(w)).toEqual([[2]])
    })
  })

  // ---- Altar bauen ----
  describe('stones', () => {
    const mountStones = async () => {
      const { default: Stones } = await import('@/components/molecules/games/GameStones.vue')
      const game = (await noahStage(8)).task.build!
      return mount(Stones, { ...opts, props: { game } })
    }
    const rotation = (w: Wrapper) => w.find('.st-stone').attributes('style') ?? ''
    /** The angle of the stone in degrees (it only grows: a tap is always a quarter clockwise). */
    const angle = (w: Wrapper) => Number(/rotate\((-?[\d.]+)deg\)/.exec(rotation(w))![1])
    /** A tap on the stone turns it a quarter. */
    const turn = async (w: Wrapper) => {
      w.find('.st-grab').element.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 5, clientY: 5 }))
      window.dispatchEvent(new MouseEvent('pointerup', { clientX: 5, clientY: 5 }))
      await flushPromises()
    }
    const turnRight = async (w: Wrapper) => {
      for (let i = 0; i < 4 && angle(w) % 360 !== 0; i++) await turn(w)
      expect(angle(w) % 360).toBe(0)
    }
    const place = async (w: Wrapper, n: number) => {
      await w.find(`.st-zone[data-drop="s${n}"]`).trigger('click')
    }
    /** One whole altar from the bottom up; `wrong` stones are first tried at a wrong place (no turn needed for that). */
    const build = async (w: Wrapper) => {
      for (let n = 1; n <= 12; n++) {
        await turnRight(w)
        await place(w, n)
      }
    }

    it('shows the altar, one stone in the tray (turned, never the right way up), the outline in round 1', async () => {
      const w = await mountStones()
      expect(w.find('.st-board').exists()).toBe(true)
      expect(w.find('.st-shadow').exists()).toBe(true)
      expect(w.find('.st-stone').exists()).toBe(true)
      expect(angle(w) % 360).not.toBe(0)
      expect(w.find('.st-count').text()).toContain('0 von 12')
      // one round only: no round sign
      expect(w.find('.st-round').exists()).toBe(false)
      expect(problems()).toEqual([])
    })

    it('a tap turns the stone by a quarter clockwise, every time the same way, and is never a mistake', async () => {
      const w = await mountStones()
      const before = angle(w)
      let last = before
      // five taps: the angle grows by 90 degrees every time (never back, never to and fro), also past the full turn
      for (let i = 0; i < 5; i++) {
        await turn(w)
        expect(angle(w) - last, `tap ${i + 1}`).toBe(90)
        last = angle(w)
      }
      expect((angle(w) - before) % 360).toBe(90)
      expect(w.find('.st-board .gm').exists()).toBe(false)
      expect(await parts()).toBe(0)
      // there is no button for the other direction
      expect(w.findAll('button').filter((b) => /links|gegen|zurück/i.test(b.text() + (b.attributes('aria-label') ?? ''))).length).toBe(0)
      expect(w.find('.st-grab').attributes('aria-label')).toContain('Uhrzeigersinn')
    })

    it('the right place with the wrong turn is a mistake with its own hint; the wrong place is a mistake; the stone stays on turn', async () => {
      const w = await mountStones()
      await place(w, 1)
      expect(w.find('.st-board .gm.bad').exists()).toBe(true)
      expect(w.find('.st-fb').text()).toContain('gedreht')
      expect(w.find('.st-count').text()).toContain('0 von 12')
      await turnRight(w)
      await w.find('.st-board').trigger('click')
      expect(w.find('.st-fb').text()).toContain('Nicht ganz')
      expect(w.find('.st-count').text()).toContain('0 von 12')
      expect(await parts()).toBe(0)
    })

    it('a stone that sits snaps in (green tick); the next stone is on turn, from the bottom up', async () => {
      const w = await mountStones()
      await turnRight(w)
      await place(w, 1)
      expect(w.find('.st-board .gm.good').exists()).toBe(true)
      expect(w.findAll('.st-placed').length).toBe(1)
      expect(w.find('.st-count').text()).toContain('1 von 12')
      expect(w.find('.st-grab').attributes('aria-label')).toContain('Stein 2 von 12')
      expect(await parts()).toBe(1)
    })

    it('one round with all twelve stones (outline), then the altar stands; three stars without mistakes', async () => {
      const w = await mountStones()
      expect(w.find('.st-shadow').exists()).toBe(true)
      await build(w)
      await tick(0)
      expect(w.text()).toContain('Der Altar steht')
      expect(w.find('.st-round').exists()).toBe(false)
      await finish(w)
      expect(emitted(w)).toEqual([[3]])
      expect(problems()).toEqual([])
    })

    it('mistakes over the one round: two wrong tries are still three stars, six are one star; nothing is lost on the way', async () => {
      const w = await mountStones()
      for (let i = 0; i < 2; i++) await w.find('.st-board').trigger('click')
      await build(w)
      await tick(0)
      await finish(w)
      expect(emitted(w)).toEqual([[3]])
      const v = await mountStones()
      for (let i = 0; i < 6; i++) await v.find('.st-board').trigger('click')
      expect(v.find('.st-count').text()).toContain('0 von 12')
      await build(v)
      await tick(0)
      await finish(v)
      expect(emitted(v)).toEqual([[1]])
    })
  })
})

describe('a picture to paint that asks for a tool', () => {
  const mountStage = async (journeyId: string, stageId: string, query: Record<string, string>) => {
    const { default: Stage } = await import('@/views/app/AppAdventureStageView.vue')
    const { default: useAdventure } = await import('@/use/useAdventure')
    useAdventure().reset(journeyId)
    route.params = { journeyId, stageId }
    route.query = query
    const w = mount(Stage, opts)
    await flushPromises()
    return w
  }

  it.each([['6'], ['11']])('Josef %s: "Male das Bild voll aus." and three tasks for three different elements of the pool under it, never a word about the rest', async (stage) => {
    const { josef } = await import('@/data/adventures/josef')
    const pool = josef.stages.find((x) => x.id === Number(stage))!.task.jobs!
    const w = await mountStage('josef', stage, {})
    await press(w, /Zur Aufgabe/)
    expect(w.find('.stage-hint').text()).toBe('Male das Bild voll aus.')
    const shown = w.findAll('.stage-job').map((x) => x.text())
    expect(shown).toHaveLength(3)
    const zones = shown.map((t) => pool.find((j) => j.hint === t)!.zone)
    expect(new Set(zones).size).toBe(3)
    for (const t of shown) expect(t).not.toMatch(/egal|Rest/)
    route.query = {}
  })

  it('no tasks in the stage: the usual words and no list; painting on is offered all the same (the picture stays, the next "done" counts again)', async () => {
    const w = await mountStage('josef', '6', { back: 'task', done: '1', stars: '3' })
    expect(w.find('.result-wrong').exists()).toBe(false)
    expect(w.text()).toContain('Dein Bild ist fertig')
    expect(w.findAll('button').some((b) => /Weitermalen/.test(b.text()))).toBe(true)
    expect(w.findAll('button').some((b) => /^Weiter$/.test(b.text()))).toBe(true)
    route.query = {}
  })

  it('"Weitermalen" goes back into the painting program for the same picture and touches nothing: stars and the saved picture stay', async () => {
    const { default: useAdventure } = await import('@/use/useAdventure')
    const w = await mountStage('josef', '6', { back: 'task', done: '1', stars: '2' })
    useAdventure().recordStars('josef', 6, 2)
    localStorage.setItem('lk-toolmap:josef-6', 'kept')
    push.mockClear()
    await press(w, /Weitermalen/)
    expect(push).toHaveBeenCalledTimes(1)
    const to = push.mock.calls[0]![0]
    expect(to.name).toBe('app-coloring')
    expect(to.query).toMatchObject({ adv: 'josef:6', type: 'image' })
    expect(to.query.source).toContain('etappe-06')
    // nothing is deleted or reset on the way
    expect(useAdventure().stageOf('josef', 6)?.stars).toBe(2)
    expect(localStorage.getItem('lk-toolmap:josef-6')).toBe('kept')
    route.query = {}
  })

  it('a worse picture the second time replaces the stars of the first (the newest result counts)', async () => {
    const { default: useAdventure } = await import('@/use/useAdventure')
    useAdventure().reset('josef')
    useAdventure().recordStars('josef', 6, 3)
    useAdventure().recordStars('josef', 6, 1)
    expect(useAdventure().stageOf('josef', 6)?.stars).toBe(1)
  })

  it('a stage without a game for painting shows no rule', async () => {
    const w = await mountStage('josef', '2', {})
    await press(w, /Zur Aufgabe/)
    expect(w.find('.stage-jobs').exists()).toBe(false)
    route.query = {}
  })
})

describe('playing a stage again and the camera of the map', () => {
  const finishStage = async (w: ReturnType<typeof mount>) => {
    for (let i = 0; i < 2; i++) {
      const right = w.findAll('.quiz-option').find((x) => /Garben|Josefs Vater/.test(x.text()))!
      await right.trigger('click')
      await press(w, /^(Weiter|Fertig)$/)
    }
  }

  it('the first time a stage is finished the map slides on (from); a replay leaves it where it is (at)', async () => {
    const { default: Stage } = await import('@/views/app/AppAdventureStageView.vue')
    const { default: useAdventure } = await import('@/use/useAdventure')
    useAdventure().reset('josef')
    useAdventure().recordStars('josef', 2, 3)
    route.params = { journeyId: 'josef', stageId: '2' }
    route.query = { back: 'task', stars: '3' }
    const w = mount(Stage, opts)
    await flushPromises()
    await press(w, /Zu den Fragen/)
    await finishStage(w)
    await press(w, /Zur Karte/)
    expect(replace).toHaveBeenLastCalledWith({ name: 'app-adventure-map', params: { journeyId: 'josef' }, query: { from: '2' } })
    // again: the stage is done now, so this is a replay (a fresh screen, as when the child opens the stage again)
    route.query = { back: 'task', stars: '2' }
    const x = mount(Stage, opts)
    await flushPromises()
    await press(x, /Zu den Fragen/)
    await finishStage(x)
    expect(x.text()).not.toContain('Dein bestes Ergebnis')
    await press(x, /Zur Karte/)
    expect(replace).toHaveBeenLastCalledWith({ name: 'app-adventure-map', params: { journeyId: 'josef' }, query: { at: '2' } })
    // the arrow at the top of the result does the same
    await x.find('.stage-back').trigger('click')
    expect(replace).toHaveBeenLastCalledWith({ name: 'app-adventure-map', params: { journeyId: 'josef' }, query: { at: '2' } })
    route.query = {}
  })

  it('the map: coming back from a first finish lights up the way, coming back from a replay does not', async () => {
    const { default: MapView } = await import('@/views/app/AppAdventureView.vue')
    const { default: useAdventure } = await import('@/use/useAdventure')
    useAdventure().reset('josef')
    useAdventure().completeStage('josef', 1)
    useAdventure().completeStage('josef', 2)
    route.params = { journeyId: 'josef' }
    route.query = { from: '2' }
    const first = mount(MapView, opts)
    await flushPromises()
    expect(first.findAll('.bead.run').length).toBeGreaterThan(0)
    route.query = { at: '2' }
    const again = mount(MapView, opts)
    await flushPromises()
    expect(again.findAll('.bead.run').length).toBe(0)
    route.query = {}
    expect(problems()).toEqual([])
  })

  it('the map: the stars of the stage you come back from light up once more, one after the other, after a first finish and after a replay; with no stars nothing', async () => {
    const { default: MapView } = await import('@/views/app/AppAdventureView.vue')
    const { default: useAdventure } = await import('@/use/useAdventure')
    useAdventure().reset('josef')
    useAdventure().recordStars('josef', 1, 3)
    useAdventure().recordFinal('josef', 1, 3)
    useAdventure().completeStage('josef', 1)
    useAdventure().recordStars('josef', 2, 2)
    useAdventure().recordFinal('josef', 2, 2)
    useAdventure().completeStage('josef', 2)
    route.params = { journeyId: 'josef' }
    const celebrating = (w: ReturnType<typeof mount>) => w.findAll('.spot-stars.celebrate').length
    // first finish of stage 2: its stars celebrate (and only its stars)
    route.query = { from: '2' }
    const first = mount(MapView, opts)
    await flushPromises()
    expect(celebrating(first)).toBe(1)
    expect(first.find('.spot-stars.celebrate').attributes('aria-label')).toBe('2 / 3')
    expect(first.findAll('.bead.run').length).toBeGreaterThan(0)
    // a replay: the stars light up as well, the way does not
    route.query = { at: '1' }
    const again = mount(MapView, opts)
    await flushPromises()
    expect(celebrating(again)).toBe(1)
    expect(again.find('.spot-stars.celebrate').attributes('aria-label')).toBe('3 / 3')
    expect(again.findAll('.bead.run').length).toBe(0)
    // plain arrival: nothing
    route.query = {}
    expect(celebrating(mount(MapView, opts))).toBe(0)
    // a stage without stars: nothing to light
    useAdventure().recordStars('josef', 2, 0)
    useAdventure().recordFinal('josef', 2, 0)
    route.query = { at: '2' }
    expect(celebrating(mount(MapView, opts))).toBe(0)
    route.query = {}
  })
})
