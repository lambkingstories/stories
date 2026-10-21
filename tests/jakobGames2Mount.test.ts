/**
 * The six new games of "Jakob" (stages 5 to 9 and 12), each mounted with sample data and used: right and wrong moves, the rounds (at most two), the goal for the stars of
 * "Go on" (`useTaskProgress`), the end with its stars, German and English words, and the stand-in for pictures that are not painted yet.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import useTaskProgress from '@/use/useTaskProgress'
import type { CairnGame, CatchGame, CycleGame, GuessGame, RelayGame, RingGame, StewGame } from '@/types/adventure'

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
    // one wrong answer on the way: two stars (no mistake would be three)
    expect(w.emitted('done')).toEqual([[2]])
    expect(problems()).toEqual([])
  })

  it('stars follow the mistakes: no mistake three stars, one or two two stars, three one star', async () => {
    for (const [mistakes, stars] of [[0, 3], [1, 2], [2, 2], [3, 1]] as const) {
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

  it('stars follow the mistakes: two mistakes three stars, four two stars, five one star', async () => {
    for (const [mistakes, stars] of [[2, 3], [3, 2], [4, 2], [5, 1]] as const) {
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

// ---------------------------------------------------------------- the ring of the sons
describe('Zwölferkreis (ring)', () => {
  const game: RingGame = {
    background: 'images/x/tree.webp',
    altar: 'images/x/altar.webp',
    tokens: ['images/x/a.webp', 'images/x/b.webp', 'images/x/c.webp'],
    centre: [50, 58],
    radius: 22,
    rounds: [
      { hint: 'Runde eins.', count: 4, tolerance: 25 },
      { hint: 'Runde zwei.', count: 12, tolerance: 14 }
    ]
  }
  // the field is 300 x 200 pixels: a point in percent of the picture is three pixels (wide) and two pixels (high) for each percent
  const open = async (locale: 'de' | 'en' = 'de') => {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 300, height: 200, right: 300, bottom: 200, x: 0, y: 0, toJSON: () => ({}) })
    const { default: Ring } = await import('@/components/molecules/games/GameRing.vue')
    const w = mount(Ring, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  const spot = (angle: number, away = 1) => {
    const rad = (angle * Math.PI) / 180
    const r = game.radius * away
    return { clientX: (50 + r * Math.cos(rad)) * 3, clientY: (58 + r * Math.sin(rad) * 1.5) * 2 }
  }
  /** Choose the son (a press and a release without moving), then tap a place of the field. */
  const put = async (w: W, son: number, angle: number, away = 1) => {
    const el = w.findAll('.rg-token').find((x) => x.attributes('aria-label') === `Sohn ${son + 1}`)!.element
    el.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 5, clientY: 5 }))
    window.dispatchEvent(new MouseEvent('pointerup', { clientX: 5, clientY: 5 }))
    await flushPromises()
    await w.find('.rg-field').trigger('click', spot(angle, away))
    await flushPromises()
  }
  const roundOne = async (w: W) => {
    await put(w, 0, 270)
    await put(w, 1, 0)
    await put(w, 2, 90)
    await put(w, 3, 180)
  }
  const roundTwo = async (w: W) => {
    for (let i = 0; i < 12; i++) await put(w, i, 270 + i * 30)
  }

  it('the goal is every son of both rounds; four sons wait, the ring is empty, the altar stands in the middle', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(16)
    expect(w.find('.rg-round').text()).toContain('Runde 1 von 2')
    expect(w.findAll('.rg-token')).toHaveLength(4)
    expect(w.findAll('.rg-son')).toHaveLength(0)
    expect(w.find('.rg-altar').exists()).toBe(true)
    expect(w.find('.rg-count').text()).toBe('Söhne am Altar: 0 von 4')
  })

  it('the first son cannot be wrong; the app snaps him to the ring, even if he was let go beside it', async () => {
    const w = await open()
    await put(w, 0, 0, 1.25)
    expect(w.findAll('.rg-son')).toHaveLength(1)
    expect(w.find('.rg-son').attributes('style')).toContain('left: 72%')
    expect(played).toContain('snap')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.findAll('.rg-token')).toHaveLength(3)
  })

  it('a son let go far from the ring is not placed and it is no mistake (a friendly line)', async () => {
    const w = await open()
    await put(w, 0, 0, 0.1)
    expect(w.findAll('.rg-son')).toHaveLength(0)
    expect(w.find('.rg-fb').text()).toContain('hellen Kreis')
    expect(played).not.toContain('wrong')
    expect(w.findAll('.rg-token')).toHaveLength(4)
  })

  it('a son let go between two places snaps to the nearest free place; a taken place is not used, he goes to the next free one; nothing is a mistake', async () => {
    const w = await open()
    await put(w, 0, 270)
    await put(w, 1, 40)
    // 40 degrees lies nearest to the place at 0 degrees (right of the altar): 72 % from the left
    expect(w.findAll('.rg-son')).toHaveLength(2)
    expect(w.findAll('.rg-son')[1]!.attributes('style')).toContain('left: 72%')
    await put(w, 2, 275)
    // 275 degrees is the place at the top, but it is taken: the nearest free place is the one at 180 degrees (28 % from the left)
    expect(w.findAll('.rg-son')).toHaveLength(3)
    expect(w.findAll('.rg-son')[2]!.attributes('style')).toContain('left: 28%')
    expect(played).not.toContain('wrong')
    expect(w.findAll('.rg-token')).toHaveLength(1)
  })

  it('the free places are seen as pale rings (four in round 1, fewer as the sons stand); the help lets the next free one glow for three seconds', async () => {
    const w = await open()
    expect(w.findAll('.rg-place')).toHaveLength(4)
    await put(w, 0, 270)
    expect(w.findAll('.rg-place')).toHaveLength(3)
    expect(w.findAll('.rg-place.glow')).toHaveLength(0)
    await w.find('.rg-btn').trigger('click')
    expect(w.findAll('.rg-place.glow')).toHaveLength(1)
    expect(w.find('.rg-btn').attributes('disabled')).toBeDefined()
    await tick(3100)
    expect(w.findAll('.rg-place.glow')).toHaveLength(0)
    expect(w.find('.rg-btn').attributes('disabled')).toBeUndefined()
  })

  it('from the keyboard: choose a son with Enter, Enter on the field puts him at the next free place', async () => {
    const w = await open()
    await w.findAll('.rg-token')[0]!.trigger('keydown', { key: 'Enter' })
    await w.find('.rg-field').trigger('keydown', { key: 'Enter' })
    expect(w.findAll('.rg-son')).toHaveLength(1)
    await w.findAll('.rg-token')[0]!.trigger('keydown', { key: 'Enter' })
    await w.find('.rg-field').trigger('keydown', { key: 'Enter' })
    expect(w.findAll('.rg-son')).toHaveLength(2)
    expect(played).not.toContain('wrong')
  })

  it('round 2 has twelve sons like the hours of a clock; all placed: the end with three stars when nothing went wrong', async () => {
    const w = await open()
    await roundOne(w)
    await tick(1600)
    expect(w.find('.rg-round').text()).toContain('Runde 2 von 2')
    expect(w.findAll('.rg-token')).toHaveLength(12)
    expect(w.findAll('.rg-son')).toHaveLength(0)
    await roundTwo(w)
    await tick(1100)
    expect(useTaskProgress().parts.value).toBe(16)
    expect(useTaskProgress().finished.value).toBe(true)
    expect(w.text()).toContain('ein Kreis ohne Lücke')
    await w.find('.gd button').trigger('click')
    expect(w.emitted('done')).toEqual([[3]])
    expect(problems()).toEqual([])
  })

  it('stars follow the helps: one help three stars, up to four two stars, more one star', async () => {
    for (const [helps, stars] of [[0, 3], [1, 3], [2, 2], [4, 2], [5, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      for (let i = 0; i < helps; i++) {
        await w.find('.rg-btn').trigger('click')
        await tick(3100)
      }
      await roundOne(w)
      await tick(1600)
      await roundTwo(w)
      await tick(1100)
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${helps} helps`).toEqual([[stars]])
      w.unmount()
    }
  })

  it('speaks English', async () => {
    const w = await open('en')
    expect(w.find('.rg-count').text()).toBe('Sons at the altar: 0 of 4')
    expect(w.find('.rg-btn').text()).toBe('Help')
    await w.findAll('.rg-token')[0]!.trigger('keydown', { key: 'Enter' })
    await w.find('.rg-field').trigger('click', spot(0, 0.1))
    expect(w.find('.rg-fb').text()).toContain('light ring')
  })
})

// ---------------------------------------------------------------- the children at the tent
describe('Kinder zum Zelt rufen (catch)', () => {
  const game: CatchGame = {
    background: 'images/x/camp.webp',
    kids: [1, 2].map((n) => ({ id: `kind-${n}`, image: `images/x/kind-${n}.webp`, w: 7 })),
    tent: [80, 50],
    field: { x: 10, y: 58, w: 60, h: 32 },
    rounds: [
      { hint: 'Runde eins.', kids: ['kind-1', 'kind-2'], speed: 0.04 },
      { hint: 'Runde zwei.', kids: ['kind-1', 'kind-2', 'kind-1'], speed: 0.07 }
    ]
  }
  // the field is 300 x 200 pixels: a percent of the picture is three pixels (wide) and two pixels (high)
  const open = async (locale: 'de' | 'en' = 'de') => {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 300, height: 200, right: 300, bottom: 200, x: 0, y: 0, toJSON: () => ({}) })
    const { default: Catch } = await import('@/components/molecules/games/GameCatch.vue')
    const w = mount(Catch, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  /** The places of the children that walk about (feet, percent of the picture). */
  const feet = (w: W) =>
    w
      .findAll('.ct-kid:not(.going)')
      .map((k) => /left: ([\d.]+)%; top: ([\d.]+)%/.exec(k.attributes('style') ?? ''))
      .map((m) => ({ x: Number(m![1]), y: Number(m![2]) }))
  const press = async (w: W, x: number, y: number) => {
    w.find('.ct-field').element.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: x * 3, clientY: y * 2 }))
    await flushPromises()
  }
  /** Tap the middle of the child (a child is one and a half times as high as wide, 7 percent of the width). */
  const tapKid = async (w: W, i = 0) => {
    const f = feet(w)[i]!
    await press(w, f.x, f.y - 7 * 1.125)
  }

  it('the goal is every child of both rounds; two children walk on the meadow, the tent counts none, no help button yet', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(5)
    expect(w.find('.ct-round').text()).toContain('Runde 1 von 2')
    expect(w.findAll('.ct-kid')).toHaveLength(2)
    expect(w.find('.ct-tent').text()).toBe('0')
    expect(w.find('.ct-count').text()).toBe('Kinder am Zelt: 0 von 2')
    expect(w.find('.ct-all').exists()).toBe(false)
  })

  it('a tap on a child sends it to the tent: it runs, then the number at the tent grows and the tick sounds', async () => {
    const w = await open()
    await tapKid(w, 0)
    expect(w.findAll('.ct-kid.going')).toHaveLength(1)
    expect(w.find('.ct-kid.going').attributes('style')).toContain('left: 80%')
    expect(useTaskProgress().parts.value).toBe(0)
    await tick(800)
    expect(w.findAll('.ct-kid')).toHaveLength(1)
    expect(w.find('.ct-tent').text()).toBe('1')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(played).toContain('snap')
  })

  it('a tap into the empty does nothing: no mistake, no sound, nobody runs', async () => {
    const w = await open()
    const far = feet(w).map((f) => f.x)
    // the corner of the picture lies far from the meadow
    await press(w, 2, 2)
    expect(w.findAll('.ct-kid.going')).toHaveLength(0)
    expect(played).toHaveLength(0)
    expect(feet(w).map((f) => f.x)).toEqual(far)
  })

  it('the children walk about and stay on the meadow all the time', async () => {
    const w = await open()
    const before = feet(w)
    let moved = false
    for (let i = 0; i < 12; i++) {
      await tick(1000)
      for (const f of feet(w)) {
        expect(f.x).toBeGreaterThanOrEqual(10)
        expect(f.x).toBeLessThanOrEqual(70)
        expect(f.y).toBeGreaterThanOrEqual(58)
        expect(f.y).toBeLessThanOrEqual(90)
      }
      if (feet(w).some((f, k) => Math.hypot(f.x - before[k]!.x, f.y - before[k]!.y) > 1)) moved = true
    }
    expect(moved).toBe(true)
  })

  it('after twenty seconds without a tap "Call all" shows: all children come by themselves, one after the other', async () => {
    const w = await open()
    await tick(19000)
    expect(w.find('.ct-all').exists()).toBe(false)
    await tick(2000)
    expect(w.find('.ct-all').exists()).toBe(true)
    await w.find('.ct-all').trigger('click')
    await tick(2000)
    expect(useTaskProgress().parts.value).toBe(2)
    await tick(1600)
    expect(w.find('.ct-round').text()).toContain('Runde 2 von 2')
    expect(w.find('.ct-all').exists()).toBe(false)
  })

  it('the Enter key calls the next child; round 2 has three children; all of them at the tent: the end with three stars', async () => {
    const w = await open()
    await w.find('.ct-field').trigger('keydown', { key: 'Enter' })
    await w.find('.ct-field').trigger('keydown', { key: 'Enter' })
    await tick(2300)
    expect(w.find('.ct-round').text()).toContain('Runde 2 von 2')
    expect(w.findAll('.ct-kid')).toHaveLength(3)
    for (let i = 0; i < 3; i++) await w.find('.ct-field').trigger('keydown', { key: 'Enter' })
    await tick(2200)
    expect(useTaskProgress().parts.value).toBe(5)
    expect(useTaskProgress().finished.value).toBe(true)
    expect(w.text()).toContain('Die Familie wächst')
    await w.find('.gd button').trigger('click')
    expect(w.emitted('done')).toEqual([[3]])
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = await open('en')
    expect(w.find('.ct-count').text()).toBe('Children at the tent: 0 of 2')
    await tick(21000)
    expect(w.find('.ct-all').text()).toBe('Call everyone')
  })
})

// ---------------------------------------------------------------- the herds on the road
describe('Herden mit Abstand losschicken (relay)', () => {
  const game: RelayGame = {
    background: 'images/x/road.webp',
    herds: [
      { id: 'ziegen', image: 'images/x/ziegen.webp', w: 16 },
      { id: 'schafe', image: 'images/x/schafe.webp', w: 16 }
    ],
    // a straight road over the whole width: a percent of the road is a percent of the width
    road: [[0, 80], [100, 80]],
    rounds: [
      { hint: 'Runde eins.', herds: ['ziegen', 'schafe'], minGap: 30, speed: 0.2 },
      { hint: 'Runde zwei.', herds: ['ziegen', 'schafe', 'ziegen'], minGap: 20, speed: 0.25 }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    const { default: Relay } = await import('@/components/molecules/games/GameRelay.vue')
    const w = mount(Relay, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  const go = async (w: W) => {
    await w.find('.rl-go').trigger('click')
    await flushPromises()
  }
  /** The herds that walk (not the one that waits at the start): how far they are, percent of the width. */
  const walkers = (w: W) => w.findAll('.rl-herd:not(.waiting)').map((h) => Number(/left: ([\d.]+)%/.exec(h.attributes('style') ?? '')![1]))
  const roundOne = async (w: W) => {
    await go(w)
    await tick(1600)
    await go(w)
    await tick(5200)
  }
  const roundTwo = async (w: W) => {
    await go(w)
    await tick(900)
    await go(w)
    await tick(900)
    await go(w)
    await tick(4200)
  }

  it('the goal is every herd of both rounds; the first herd waits at the start, nobody walks, no band', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(5)
    expect(w.find('.rl-round').text()).toContain('Runde 1 von 2')
    expect(w.find('.rl-herd.waiting').exists()).toBe(true)
    expect(walkers(w)).toHaveLength(0)
    expect(w.find('.rl-band polyline').exists()).toBe(false)
    expect(w.find('.rl-count').text()).toBe('Herden losgeschickt: 0 von 2')
  })

  it('"Go" sends the herd along the road; a light band shows the room behind it; the next herd waits at the start', async () => {
    const w = await open()
    await go(w)
    expect(useTaskProgress().parts.value).toBe(1)
    expect(played).toContain('tap')
    expect(walkers(w)).toHaveLength(1)
    await tick(1000)
    const at = walkers(w)[0]!
    expect(at).toBeGreaterThan(15)
    expect(at).toBeLessThan(25)
    expect(w.find('.rl-band polyline').exists()).toBe(true)
    expect(w.find('.rl-herd.waiting').exists()).toBe(true)
    expect(w.find('.rl-count').text()).toBe('Herden losgeschickt: 1 von 2')
  })

  it('"Go" too soon: red, a cross, a dull sound, a mistake; the herd stays at the start; later it goes', async () => {
    const w = await open()
    await go(w)
    await tick(500)
    await go(w)
    expect(played).toContain('wrong')
    expect(w.find('.rl-fb').text()).toContain('Zu nah')
    expect(walkers(w)).toHaveLength(1)
    expect(useTaskProgress().parts.value).toBe(1)
    await tick(1500)
    await go(w)
    expect(walkers(w)).toHaveLength(2)
    expect(useTaskProgress().parts.value).toBe(2)
  })

  it('sending late is no mistake: the herds wait as long as they like', async () => {
    const w = await open()
    await go(w)
    await tick(30000)
    await go(w)
    expect(played).not.toContain('wrong')
    expect(walkers(w)).toHaveLength(1)
  })

  it('when every herd of round 1 has come to the end of the road, round 2 begins with three herds', async () => {
    const w = await open()
    await roundOne(w)
    await tick(1600)
    expect(w.find('.rl-round').text()).toContain('Runde 2 von 2')
    expect(w.find('.rl-count').text()).toBe('Herden losgeschickt: 0 von 3')
    expect(walkers(w)).toHaveLength(0)
    expect(played).not.toContain('wrong')
  })

  it('the whole game without a mistake: the end with three stars', async () => {
    const w = await open()
    await roundOne(w)
    await tick(1600)
    await roundTwo(w)
    await tick(1000)
    expect(useTaskProgress().parts.value).toBe(5)
    expect(useTaskProgress().finished.value).toBe(true)
    expect(w.text()).toContain('mit Raum dazwischen')
    await w.find('.gd button').trigger('click')
    expect(w.emitted('done')).toEqual([[3]])
    expect(problems()).toEqual([])
  })

  it('stars follow the mistakes: two mistakes three stars, four two stars, five one star', async () => {
    for (const [mistakes, stars] of [[2, 3], [3, 2], [4, 2], [5, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      await go(w)
      for (let i = 0; i < mistakes; i++) await go(w)
      await tick(1600)
      await go(w)
      await tick(5200)
      await tick(1600)
      await roundTwo(w)
      await tick(1000)
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${mistakes} mistakes`).toEqual([[stars]])
      w.unmount()
    }
  })

  it('speaks English', async () => {
    const w = await open('en')
    expect(w.find('.rl-go').text()).toBe('Go!')
    await go(w)
    await go(w)
    expect(w.find('.rl-fb').text()).toContain('Too close')
  })
})

// ---------------------------------------------------------------- the stew (stage 1)
describe('Die Suppe kochen, bevor Esau kommt (stew)', () => {
  const game: StewGame = {
    hint: 'Koche die Suppe.',
    scene: 'images/x/szene.webp',
    pot: { empty: 'images/x/topf-leer.webp', lentils: 'images/x/topf-linsen.webp', water: 'images/x/topf-wasser.webp', soup: 'images/x/topf-suppe.webp' },
    logs: 'images/x/scheite.webp',
    flame: 'images/x/flamme.webp',
    steam: 'images/x/dampf.webp',
    sources: { bowl: { image: 'images/x/schale.webp', at: [18, 88] }, jug: { image: 'images/x/krug.webp', at: [50, 90] }, wood: { image: 'images/x/holz.webp', at: [82, 88] } },
    esau: 'images/x/esau.webp',
    potAt: [50, 66],
    path: [[82, 10], [32, 52]],
    walkMs: 32000,
    slowerMs: 6000,
    maxWalkMs: 50000,
    simmerMs: 2500
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 300, height: 400, right: 300, bottom: 400, x: 0, y: 0, toJSON: () => ({}) })
    const { default: Stew } = await import('@/components/molecules/games/GameStew.vue')
    const w = mount(Stew, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  const src = (w: W, i: number) => w.findAll('.st-src')[i]!
  const tap = async (w: W, i: number) => {
    await src(w, i).trigger('click')
    await flushPromises()
  }
  /** Lentils, water and the wood twice. */
  const cook = async (w: W) => {
    for (const i of [0, 1, 2, 2]) await tap(w, i)
  }
  const potPicture = (w: W) => w.find('.st-pot img').attributes('src')
  const esauX = (w: W) => Number(/left: ([\d.]+)%/.exec(w.find('.st-esau').attributes('style') ?? '')![1])

  it('one soup is the goal; hint, scene, pot, three sources with names, no counter, no hourglass; Esau stands far away at the start of the road', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(1)
    expect(w.find('.st-hint').text()).toBe('Koche die Suppe.')
    expect(w.findAll('.st-src').map((b) => b.attributes('aria-label'))).toEqual(['Linsenschale', 'Wasserkrug', 'Holzstapel'])
    expect(potPicture(w)).toContain('topf-leer')
    expect(w.find('.st-logs').exists()).toBe(false)
    expect(w.find('.st-flame').exists()).toBe(false)
    expect(w.find('.st-esau').attributes('style')).toContain('left: 82%')
    expect(w.find('.st-esau').attributes('style')).toContain('scale(0.55)')
    expect(w.find('.st-fb').text()).toBe('')
    expect(w.text()).not.toMatch(/\d+ von \d+/)
    expect(problems()).toEqual([])
  })

  it('a tap puts a thing into the pot: lentils, water, then the soup; a tick shows the source is used; the first log is a small flame, the second a big one', async () => {
    const w = await open()
    await tap(w, 0)
    expect(potPicture(w)).toContain('topf-linsen')
    expect(src(w, 0).find('.gm').exists()).toBe(true)
    expect(src(w, 0).classes()).toContain('spent')
    await tap(w, 1)
    expect(potPicture(w)).toContain('topf-suppe')
    await tap(w, 2)
    expect(w.find('.st-logs').exists()).toBe(true)
    expect(w.find('.st-flame').classes()).not.toContain('big')
    expect(src(w, 2).find('.gm').exists()).toBe(false)
    expect(w.findAll('.st-dot.on')).toHaveLength(1)
    await tap(w, 2)
    expect(w.find('.st-flame').classes()).toContain('big')
    expect(w.findAll('.st-dot.on')).toHaveLength(2)
    expect(played.filter((n) => n === 'snap')).toHaveLength(4)
  })

  it('any order is fine: the wood first, the water, the lentils last; the soup cooks only when all four things are there', async () => {
    const w = await open()
    for (const i of [2, 2, 1]) await tap(w, i)
    expect(w.find('.st-steam').exists()).toBe(false)
    await tap(w, 0)
    expect(w.find('.st-steam').exists()).toBe(true)
  })

  it('a thing that is already in the pot only shakes softly and says so: no mistake, nothing else changes', async () => {
    const w = await open()
    await tap(w, 0)
    played.length = 0
    await tap(w, 0)
    expect(w.find('.st-fb').text()).toBe('Das ist schon im Topf.')
    expect(src(w, 0).classes()).toContain('wiggle')
    expect(potPicture(w)).toContain('topf-linsen')
    expect(played).toEqual([])
    await tick(600)
    expect(src(w, 0).classes()).not.toContain('wiggle')
    await tap(w, 1)
    expect(w.find('.st-fb').text()).toBe('')
  })

  it('when all is there the soup simmers for two and a half seconds, then "The soup is ready" with three stars; the one star of the goal counts', async () => {
    const w = await open()
    await cook(w)
    expect(w.find('.st-steam').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(0)
    await tick(2000)
    expect(w.find('.gd').exists()).toBe(false)
    await tick(600)
    expect(w.find('.gd').exists()).toBe(true)
    expect(w.find('.gd').text()).toContain('Die Suppe ist fertig!')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(played).toContain('star')
    await w.find('.gd button').trigger('click')
    expect(w.emitted('done')).toEqual([[3]])
    expect(problems()).toEqual([])
  })

  it('Esau walks on his own: after half of the time he is further down the road; the sources still work while he walks', async () => {
    const w = await open()
    const x0 = esauX(w)
    await tick(16000)
    const x1 = esauX(w)
    expect(x1).toBeLessThan(x0)
    expect(x1).toBeCloseTo(57, 0)
    expect(w.find('.st-esau').attributes('style')).toContain('scale(0.775)')
    await tap(w, 0)
    expect(potPicture(w)).toContain('topf-linsen')
  })

  it('a screen reader hears how far Esau is (a third, two thirds, nearly there) in a polite live region', async () => {
    const w = await open()
    expect(w.find('.st-sr').attributes('aria-live')).toBe('polite')
    expect(w.find('.st-sr').text()).toBe('')
    await tick(11000)
    expect(w.find('.st-sr').text()).toBe('Esau ist noch weit weg.')
    await tick(11000)
    expect(w.find('.st-sr').text()).toBe('Esau kommt näher.')
    await tick(7000)
    expect(w.find('.st-sr').text()).toBe('Esau ist fast da.')
  })

  it('Esau is at the tent first: a kind sentence, after two seconds everything starts again (pot empty, Esau at the top), and the next try is six seconds longer', async () => {
    const w = await open()
    await tap(w, 0)
    await tick(32000)
    expect(w.find('.st-fb').text()).toBe('Esau wartet hungrig. Versuche es noch einmal.')
    expect(w.find('.gd').exists()).toBe(false)
    // nothing is taken while the sentence stands
    await tap(w, 1)
    expect(potPicture(w)).toContain('topf-linsen')
    await tick(2000)
    expect(w.find('.st-fb').text()).toBe('')
    expect(potPicture(w)).toContain('topf-leer')
    expect(src(w, 0).classes()).not.toContain('spent')
    expect(esauX(w)).toBe(82)
    // the second try: still walking after 32 seconds, at the tent after 38
    await tick(32000)
    expect(w.find('.st-fb').text()).toBe('')
    await tick(6000)
    expect(w.find('.st-fb').text()).toContain('Esau wartet')
    expect(useTaskProgress().parts.value).toBe(0)
  })

  it('the stars: no restart or one restart 3 stars, up to three restarts 2 stars, then 1; the walk never gets longer than 50 seconds', async () => {
    for (const [restarts, stars] of [[0, 3], [1, 3], [2, 2], [3, 2], [4, 1]] as const) {
      const w = await open()
      const waits = [32000, 38000, 44000, 50000]
      for (let r = 0; r < restarts; r++) await tick(waits[Math.min(r, 3)]! + 2000)
      await cook(w)
      await tick(2500)
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${restarts} restarts`).toEqual([[stars]])
      w.unmount()
      useTaskProgress().reset()
    }
  })

  it('a drag of a source onto the pot does the same as a tap, and the click after it is not used a second time; a drag into the empty does nothing', async () => {
    const w = await open()
    const el = src(w, 0).element
    const fire = (type: string, x: number, y: number) => (type === 'pointerdown' ? el : window).dispatchEvent(new MouseEvent(type, { bubbles: true, clientX: x, clientY: y }))
    // far outside the pot (the pot is the whole mocked box of 300 x 400)
    fire('pointerdown', 50, 350)
    fire('pointermove', 900, 900)
    await flushPromises()
    expect(src(w, 0).attributes('style')).toContain('translate(calc(-50% + 850px)')
    fire('pointerup', 900, 900)
    await flushPromises()
    expect(potPicture(w)).toContain('topf-leer')
    await tick(10)
    // onto the pot
    fire('pointerdown', 50, 350)
    fire('pointermove', 150, 200)
    fire('pointerup', 150, 200)
    await flushPromises()
    expect(potPicture(w)).toContain('topf-linsen')
    // the click that follows a drag does not count as a second use (no "already in the pot")
    await src(w, 0).trigger('click')
    expect(w.find('.st-fb').text()).toBe('')
    await tick(10)
    await src(w, 0).trigger('click')
    expect(w.find('.st-fb').text()).toBe('Das ist schon im Topf.')
    expect(played.filter((n) => n === 'snap')).toHaveLength(1)
  })

  it('a short move is only a tap (the click uses the thing once)', async () => {
    const w = await open()
    const el = src(w, 1).element
    el.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 10, clientY: 10 }))
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 14, clientY: 12 }))
    window.dispatchEvent(new MouseEvent('pointerup', { clientX: 14, clientY: 12 }))
    await src(w, 1).trigger('click')
    expect(potPicture(w)).toContain('topf-wasser')
    expect(played.filter((n) => n === 'snap')).toHaveLength(1)
  })

  it('the sources are buttons: the keyboard (Tab, Enter) works with the clicks; the spent one is marked, not disabled', async () => {
    const w = await open()
    expect(w.findAll('button.st-src')).toHaveLength(3)
    await tap(w, 1)
    expect(src(w, 1).attributes('aria-disabled')).toBe('true')
    expect(src(w, 1).attributes('disabled')).toBeUndefined()
    expect(src(w, 0).attributes('aria-disabled')).toBeUndefined()
  })

  it('with reduced motion Esau jumps in six steps and the steam does not move', async () => {
    const old = window.matchMedia
    window.matchMedia = ((q: string) => ({ matches: /reduce/.test(q), media: q, addEventListener: () => undefined, removeEventListener: () => undefined, addListener: () => undefined, removeListener: () => undefined, onchange: null, dispatchEvent: () => false })) as never
    try {
      const w = await open()
      expect(w.find('.st-esau').classes()).toContain('still')
      await tick(2000)
      expect(esauX(w)).toBe(82)
      await tick(4000)
      expect(esauX(w)).toBeLessThan(82)
      await cook(w)
      expect(w.find('.st-steam').classes()).toContain('still')
    } finally {
      window.matchMedia = old
    }
  })

  it('speaks English', async () => {
    const w = await open('en')
    expect(w.findAll('.st-src').map((b) => b.attributes('aria-label'))).toEqual(['Bowl of lentils', 'Water jug', 'Pile of wood'])
    await tap(w, 0)
    await tap(w, 0)
    expect(w.find('.st-fb').text()).toBe('That is already in the pot.')
    await tick(11000)
    expect(w.find('.st-sr').text()).toBe('Esau is still far away.')
    await tick(21000)
    expect(w.find('.st-fb').text()).toBe('Esau is waiting, hungry. Try once more.')
    await tick(2000)
    await cook(w)
    await tick(2500)
    expect(w.find('.gd').text()).toContain('The soup is ready!')
  })
})
