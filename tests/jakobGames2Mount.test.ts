/**
 * The six new games of "Jakob" (stages 5 to 9 and 12), each mounted with sample data and used: right and wrong moves, the rounds (at most two), the goal for the stars of
 * "Go on" (`useTaskProgress`), the end with its stars, German and English words, and the stand-in for pictures that are not painted yet.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import useTaskProgress from '@/use/useTaskProgress'
import type { CairnGame, CycleGame, GuessGame } from '@/types/adventure'

const played: string[] = []
vi.mock('@/use/useSfx', () => ({
  default: () => ({
    play: (n: string) => {
      played.push(n)
      return Promise.resolve()
    },
    preload: vi.fn(),
    stopAll: vi.fn(),
    lengthOf: () => 0,
    enabled: { value: true },
    setEnabled: vi.fn(),
    toggle: vi.fn(),
    playedSince: () => true
  })
}))

const mk = (locale: 'de' | 'en') => createI18n({ legacy: false, locale, fallbackLocale: 'de', messages: messages as never, missingWarn: false, fallbackWarn: false })
const opts = (locale: 'de' | 'en' = 'de') => ({ global: { plugins: [mk(locale)], stubs: { RouterLink: true } }, attachTo: document.body })

let warnings: string[] = []
beforeEach(() => {
  played.length = 0
  warnings = []
  useTaskProgress().reset()
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

// ---------------------------------------------------------------- guessing the herds
describe('Herden schätzen (guess)', () => {
  const game: GuessGame = {
    background: 'images/x/pasture.webp',
    animals: [
      { id: 'schaf', image: 'images/x/schaf.webp', w: 6 },
      { id: 'ziege', image: 'images/x/ziege.webp', w: 6 }
    ],
    region: { x: 8, y: 52, w: 84, h: 40 },
    rounds: [
      {
        hint: 'Runde eins: Welche Herde ist größer?',
        mode: 'compare',
        tasks: [
          { a: { animal: 'schaf', count: 12 }, b: { animal: 'ziege', count: 30 }, seed: 1 },
          { a: { animal: 'ziege', count: 25 }, b: { animal: 'schaf', count: 14 }, seed: 2 }
        ]
      },
      {
        hint: 'Runde zwei: Wie viele etwa?',
        mode: 'range',
        tasks: [{ a: { animal: 'schaf', count: 28 }, ranges: [[5, 15], [20, 40], [50, 70]], seed: 3 }]
      }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    const { default: Guess } = await import('@/components/molecules/games/GameGuess.vue')
    const w = mount(Guess, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  const btn = (w: W, text: string) => w.findAll('.gs-choices button').find((b) => b.text() === text)!
  const animals = (w: W) => w.findAll('.gs-animal').length

  it('the goal is every task of both rounds; both herds stand on the meadow with as many animals as the data says', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(3)
    expect(w.find('.gs-round').text()).toContain('Runde 1 von 2')
    expect(animals(w)).toBe(12 + 30)
    expect(w.find('.gs-hint').text()).toContain('Welche Herde ist größer')
    expect(w.find('.gs-count').text()).toBe('Aufgaben: 0 von 3')
    // the picture file is not there: a stand-in takes its place (no error, no empty hole)
    expect(w.find('.gi').exists()).toBe(true)
  })

  it('the bigger herd is right (a tick, a part of the task) and the next task follows', async () => {
    const w = await open()
    await btn(w, 'Die rechte Herde').trigger('click')
    expect(played).toContain('snap')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.find('.gs-fb').text()).toBe('Richtig!')
    expect(w.find('.gs-mark').exists()).toBe(true)
    await tick(1100)
    expect(animals(w)).toBe(25 + 14)
    expect(w.find('.gs-count').text()).toBe('Aufgaben: 1 von 3')
  })

  it('the smaller herd is a cross and a mistake; the child looks again and may answer once more; nothing is lost', async () => {
    const w = await open()
    await btn(w, 'Die linke Herde').trigger('click')
    expect(played).toContain('wrong')
    expect(w.find('.gs-fb').text()).toBe('Schau noch einmal genau hin.')
    expect(w.find('.gs-choices .wrong').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(0)
    await tick(1000)
    expect(w.find('.gs-choices .wrong').exists()).toBe(false)
    await btn(w, 'Die rechte Herde').trigger('click')
    expect(useTaskProgress().parts.value).toBe(1)
  })

  it('round 2 asks for the range: three choices ("about ten, about thirty, about sixty"), one herd; the range with the number is right', async () => {
    const w = await open()
    await btn(w, 'Die rechte Herde').trigger('click')
    await tick(1100)
    await btn(w, 'Die linke Herde').trigger('click')
    await tick(1100 + 1400)
    expect(w.find('.gs-round').text()).toContain('Runde 2 von 2')
    expect(animals(w)).toBe(28)
    expect(w.findAll('.gs-choices button').map((b) => b.text())).toEqual(['etwa 10', 'etwa 30', 'etwa 60'])
    await btn(w, 'etwa 60').trigger('click')
    expect(played).toContain('wrong')
    await tick(1000)
    await btn(w, 'etwa 30').trigger('click')
    await tick(1100)
    expect(useTaskProgress().parts.value).toBe(3)
    expect(useTaskProgress().finished.value).toBe(true)
    expect(w.text()).toContain('Du hast die Herden gut geschätzt!')
    await w.find('.gd button').trigger('click')
    expect(w.emitted('done')).toEqual([[3]])
    expect(problems()).toEqual([])
  })

  it('stars follow the mistakes: one mistake three stars, two or three two stars, four one star', async () => {
    for (const [mistakes, stars] of [[0, 3], [1, 3], [2, 2], [3, 2], [4, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      for (let i = 0; i < mistakes; i++) {
        await btn(w, 'Die linke Herde').trigger('click')
        await tick(1000)
      }
      await btn(w, 'Die rechte Herde').trigger('click')
      await tick(1100)
      await btn(w, 'Die linke Herde').trigger('click')
      await tick(1100 + 1400)
      await btn(w, 'etwa 30').trigger('click')
      await tick(1100)
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${mistakes} mistakes`).toEqual([[stars]])
      w.unmount()
    }
  })

  it('speaks English', async () => {
    const w = await open('en')
    expect(w.find('.gs-count').text()).toBe('Tasks: 0 of 3')
    expect(w.findAll('.gs-choices button').map((b) => b.text())).toEqual(['The left herd', 'The right herd'])
    await btn(w, 'The left herd').trigger('click')
    expect(w.find('.gs-fb').text()).toBe('Look again, closely.')
  })
})

// ---------------------------------------------------------------- seasons of the years
describe('Jahreszeiten fortsetzen (cycle)', () => {
  const tok = (id: string, label: string) => ({ id, image: `images/x/${id}.webp`, label })
  const game: CycleGame = {
    background: 'images/x/field.webp',
    tokens: [tok('fruehling', 'Frühling'), tok('sommer', 'Sommer'), tok('herbst', 'Herbst'), tok('winter', 'Winter')],
    rounds: [
      { hint: 'Runde eins: zwei Jahre.', cycle: ['fruehling', 'sommer', 'herbst', 'winter'], length: 8, gaps: [2, 5] },
      { hint: 'Runde zwei: mehr Jahre.', cycle: ['fruehling', 'sommer', 'herbst', 'winter'], length: 12, gaps: [1, 10, 11] }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    const { default: Cycle } = await import('@/components/molecules/games/GameCycle.vue')
    const w = mount(Cycle, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  const SIGNS = ['Frühling', 'Sommer', 'Herbst', 'Winter']
  const gap = (w: W, index: number) => w.find(`[data-drop="gap-${index}"]`)
  /** Tap a sign (a press and a release without moving chooses it), then tap a gap. */
  const put = async (w: W, sign: string, index: number) => {
    const el = w.findAll('.cy-token')[SIGNS.indexOf(sign)]!.element
    el.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 5, clientY: 5 }))
    window.dispatchEvent(new MouseEvent('pointerup', { clientX: 5, clientY: 5 }))
    await flushPromises()
    await gap(w, index).trigger('click')
    await flushPromises()
  }

  it('the goal is every gap of both rounds; the row has the places of two years, two of them are gaps; the tally stick has no notch yet', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(5)
    expect(w.find('.cy-round').text()).toContain('Runde 1 von 2')
    expect(w.findAll('.cy-place')).toHaveLength(8)
    expect(w.findAll('.cy-place.gap')).toHaveLength(2)
    expect(w.findAll('.cy-token')).toHaveLength(4)
    expect(w.findAll('.cy-notch')).toHaveLength(2)
    expect(w.findAll('.cy-notch.lit')).toHaveLength(0)
    expect(w.find('.cy-years').text()).toBe('Jahre: 0 von 2')
    expect(gap(w, 2).attributes('aria-label')).toBe('Lücke an Platz 3')
  })

  it('the right sign clicks into the gap (a tick, a part of the task); a wrong sign is a cross, a mistake, and nothing is placed', async () => {
    const w = await open()
    await put(w, 'Winter', 2)
    expect(played).toContain('wrong')
    expect(w.find('.cy-fb').text()).toContain('nicht die nächste Jahreszeit')
    expect(gap(w, 2).classes()).not.toContain('filled')
    expect(gap(w, 2).find('.gi').exists()).toBe(false)
    expect(useTaskProgress().parts.value).toBe(0)
    await put(w, 'Herbst', 2)
    expect(played).toContain('snap')
    expect(gap(w, 2).classes()).toContain('filled')
    expect(gap(w, 2).attributes('aria-label')).toBe('Platz 3: Herbst')
    expect(useTaskProgress().parts.value).toBe(1)
  })

  it('a year is complete when its row has no gap left: the tally stick gets a notch (year one has the first gap, year two the second one)', async () => {
    const w = await open()
    await put(w, 'Herbst', 2)
    expect(w.findAll('.cy-notch.lit')).toHaveLength(1)
    expect(w.find('.cy-years').text()).toBe('Jahre: 1 von 2')
    await put(w, 'Sommer', 5)
    expect(w.findAll('.cy-notch.lit')).toHaveLength(2)
  })

  it('a gap that is filled cannot be filled again, and tapping a gap without a chosen sign does nothing', async () => {
    const w = await open()
    await gap(w, 2).trigger('click')
    expect(played).not.toContain('wrong')
    await put(w, 'Herbst', 2)
    await put(w, 'Winter', 2)
    expect(played.filter((p) => p === 'wrong')).toHaveLength(0)
    expect(useTaskProgress().parts.value).toBe(1)
  })

  it('round 2: a longer row with three gaps, two of them at the very end ("what comes next?"); all gaps filled: the end with the stars', async () => {
    const w = await open()
    await put(w, 'Herbst', 2)
    await put(w, 'Sommer', 5)
    await tick(1600)
    expect(w.find('.cy-round').text()).toContain('Runde 2 von 2')
    expect(w.findAll('.cy-place')).toHaveLength(12)
    expect(w.findAll('.cy-place.gap')).toHaveLength(3)
    await put(w, 'Sommer', 1)
    await put(w, 'Herbst', 10)
    await put(w, 'Winter', 11)
    await tick(1100)
    expect(useTaskProgress().parts.value).toBe(5)
    expect(useTaskProgress().finished.value).toBe(true)
    expect(w.text()).toContain('Die Jahre vergehen, sieben Jahre für Rahel!')
    await w.find('.gd button').trigger('click')
    expect(w.emitted('done')).toEqual([[3]])
    expect(problems()).toEqual([])
  })

  it('stars follow the mistakes: two mistakes three stars, five two stars, six one star', async () => {
    for (const [mistakes, stars] of [[2, 3], [3, 2], [5, 2], [6, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      for (let i = 0; i < mistakes; i++) await put(w, 'Winter', 2)
      await put(w, 'Herbst', 2)
      await put(w, 'Sommer', 5)
      await tick(1600)
      await put(w, 'Sommer', 1)
      await put(w, 'Herbst', 10)
      await put(w, 'Winter', 11)
      await tick(1100)
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${mistakes} mistakes`).toEqual([[stars]])
      w.unmount()
    }
  })

  it('speaks English', async () => {
    const w = await open('en')
    expect(w.find('.cy-years').text()).toBe('Years: 0 of 2')
    expect(gap(w, 2).attributes('aria-label')).toBe('Gap at place 3')
    await put(w, 'Winter', 2)
    expect(w.find('.cy-fb').text()).toContain('not the next season')
  })
})

// ---------------------------------------------------------------- the cairn
describe('Steinhaufen zu zweit (cairn)', () => {
  const game: CairnGame = {
    background: 'images/x/hill.webp',
    stoneLeft: 'images/x/left.webp',
    stoneRight: 'images/x/right.webp',
    stoneSmall: 'images/x/small.webp',
    centre: [50, 70],
    leftStart: [10, 66],
    rightStart: [90, 66],
    rounds: [
      { hint: 'Runde eins.', stones: 2, steps: 2 },
      { hint: 'Runde zwei.', stones: 3, steps: 3 }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    const { default: Cairn } = await import('@/components/molecules/games/GameCairn.vue')
    const w = mount(Cairn, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  const push = async (w: W, side: 'left' | 'right') => {
    await w.find(`.ca-big.${side}`).trigger('click')
    await flushPromises()
  }
  const both = async (w: W, steps: number) => {
    for (let i = 0; i < steps; i++) {
      await push(w, 'left')
      await push(w, 'right')
    }
    await tick(600)
  }

  it('the goal is every small stone of both rounds; the big stones stand at their start, the heap is empty', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(5)
    expect(w.find('.ca-round').text()).toContain('Runde 1 von 2')
    expect(w.find('.ca-big.left').attributes('style')).toContain('left: 10%')
    expect(w.find('.ca-big.right').attributes('style')).toContain('left: 90%')
    expect(w.findAll('.ca-small')).toHaveLength(0)
    expect(w.find('.ca-count').text()).toBe('Steine am Haufen: 0 von 2')
    expect(w.findAll('.ca-btn')).toHaveLength(2)
  })

  it('a tap on a side pushes its stone one step towards the middle (the buttons do the same as the stones)', async () => {
    const w = await open()
    await w.findAll('.ca-btn')[0]!.trigger('click')
    expect(w.find('.ca-big.left').attributes('style')).toContain('left: 27.5%')
    expect(w.find('.ca-big.right').attributes('style')).toContain('left: 90%')
    await w.findAll('.ca-btn')[1]!.trigger('click')
    expect(w.find('.ca-big.right').attributes('style')).toContain('left: 72.5%')
  })

  it('a side that is a step ahead waits: no step, no mistake, no cross, a friendly line', async () => {
    const w = await open()
    await push(w, 'left')
    await push(w, 'left')
    expect(w.find('.ca-big.left').attributes('style')).toContain('left: 27.5%')
    expect(w.find('.ca-fb').text()).toContain('Warte kurz')
    expect(played).not.toContain('wrong')
    await push(w, 'right')
    expect(w.find('.ca-fb').text()).toBe('')
  })

  it('the arrow keys push the left and the right stone', async () => {
    const w = await open()
    await w.find('.ca-field').trigger('keydown', { key: 'ArrowRight' })
    expect(w.find('.ca-big.right').attributes('style')).toContain('left: 72.5%')
    await w.find('.ca-field').trigger('keydown', { key: 'ArrowLeft' })
    expect(w.find('.ca-big.left').attributes('style')).toContain('left: 27.5%')
  })

  it('both stones in turn meet in the middle: a small stone lies on the heap, the big ones go back to the start', async () => {
    const w = await open()
    await both(w, 2)
    expect(w.findAll('.ca-small')).toHaveLength(1)
    expect(played).toContain('snap')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.find('.ca-big.left').attributes('style')).toContain('left: 10%')
    expect(w.find('.ca-count').text()).toBe('Steine am Haufen: 1 von 2')
  })

  it('round 2 has three stones and longer ways; the end always gives three stars (nothing can go wrong)', async () => {
    const w = await open()
    await both(w, 2)
    await both(w, 2)
    expect(w.find('.ca-field').classes()).toContain('lit')
    await tick(1600)
    expect(w.find('.ca-round').text()).toContain('Runde 2 von 2')
    expect(w.findAll('.ca-small')).toHaveLength(0)
    for (let i = 0; i < 3; i++) await both(w, 3)
    await tick(1100)
    expect(useTaskProgress().parts.value).toBe(5)
    expect(useTaskProgress().finished.value).toBe(true)
    expect(w.text()).toContain('Der Steinhaufen ist ein Zeichen')
    await w.find('.gd button').trigger('click')
    expect(w.emitted('done')).toEqual([[3]])
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = await open('en')
    expect(w.find('.ca-count').text()).toBe('Stones on the heap: 0 of 2')
    expect(w.findAll('.ca-btn')[1]!.text()).toBe("Push Laban's stone")
    await push(w, 'left')
    await push(w, 'left')
    expect(w.find('.ca-fb').text()).toContain('Wait a moment')
  })
})
