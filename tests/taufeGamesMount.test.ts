/**
 * The new games of "The Young Jesus and His Baptism" (`bahn`, `netz`): each is mounted with sample data and used: right and wrong moves, the rounds, the goal for the stars of "Go on" (`useTaskProgress`), the end with its
 * stars, German and English words.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import useTaskProgress from '@/use/useTaskProgress'
import GameRoad from '@/components/molecules/games/GameRoad.vue'
import GameNet from '@/components/molecules/games/GameNet.vue'
import type { NetGame, RoadGame } from '@/types/adventure'

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
const box400x300 = () => vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 400, height: 300, right: 400, bottom: 300, x: 0, y: 0, toJSON: () => ({}) })
const down = async (el: Element, x: number, y: number) => {
  el.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: x, clientY: y }))
  await flushPromises()
}

// ---------------------------------------------------------------- prepare the way
describe('Den Weg bereiten (bahn)', () => {
  const items = [
    { id: 'fels', image: 'images/x/fels.webp', label: 'Felsbrocken', w: 16 },
    { id: 'dorn', image: 'images/x/dorn.webp', label: 'Dornenstrauch', w: 14 },
    { id: 'mann', image: 'images/x/mann.webp', label: 'Wanderer', w: 12 }
  ]
  const game: RoadGame = {
    background: 'images/x/weg.webp',
    items,
    rounds: [
      {
        hint: 'Räume den Weg frei.',
        spots: [
          { item: 'fels', x: 30, y: 80 },
          { item: 'dorn', x: 55, y: 60 },
          { item: 'mann', x: 85, y: 50, keep: true }
        ]
      },
      {
        hint: 'Noch einmal.',
        spots: [
          { item: 'dorn', x: 25, y: 85 },
          { item: 'fels', x: 50, y: 70 },
          { item: 'dorn', x: 70, y: 55 },
          { item: 'mann', x: 15, y: 45, keep: true }
        ]
      }
    ]
  }
  const mountIt = (locale: 'de' | 'en' = 'de') => mount(GameRoad, { props: { game }, ...opts(locale) })

  it('the goal is every obstacle of every round (the travelers do not count)', () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(5)
    expect(w.findAll('button.gm-thing')).toHaveLength(3)
    expect(w.text()).toContain('Räume den Weg frei.')
    expect(problems()).toEqual([])
  })

  it('tapping a traveler is a mistake (a cross, a word), nothing is counted', async () => {
    const w = mountIt()
    await w.find('button[aria-label="Wanderer"]').trigger('click')
    expect(played).toContain('wrong')
    expect(w.text()).toContain('Lass die Wanderer in Ruhe')
    expect(w.find('.gm-cross').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(0)
    await tick(1000)
    expect(w.find('.gm-cross').exists()).toBe(false)
  })

  it('stones and thorns are cleared; when the road is clear the next round comes; the end gives the stars', async () => {
    const w = mountIt()
    await w.find('button[aria-label="Felsbrocken"]').trigger('click')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.find('button[aria-label="Felsbrocken"]').classes()).toContain('away')
    await w.find('button[aria-label="Dornenstrauch"]').trigger('click')
    expect(useTaskProgress().parts.value).toBe(2)
    expect(w.text()).toContain('Der Weg ist frei')
    await tick(2400)
    expect(w.text()).toContain('Noch einmal.')
    expect(w.findAll('button.gm-thing')).toHaveLength(4)
    for (const b of w.findAll('button.gm-thing').filter((x) => x.attributes('aria-label') !== 'Wanderer')) {
      await b.trigger('click')
    }
    expect(useTaskProgress().parts.value).toBe(5)
    await tick(2500)
    expect(w.text()).toContain('Der Weg ist bereitet')
    expect(played).toContain('star')
    expect(problems()).toEqual([])
  })

  it('has English words', () => {
    const w = mountIt('en')
    expect(w.text()).toContain('Cleared: 0 of 5')
  })
})

// ---------------------------------------------------------------- cast the net
describe('Das Netz auswerfen (netz)', () => {
  const game: NetGame = {
    background: 'images/x/see.webp',
    fish: [
      { id: 'blau', image: 'images/x/f1.webp', w: 12 },
      { id: 'gold', image: 'images/x/f2.webp', w: 12 }
    ],
    net: 'images/x/netz.webp',
    netW: 30,
    reach: 12,
    // a point: every fish lies in the middle of the lake until the clock runs
    area: { x: 50, y: 50, w: 0, h: 0 },
    rounds: [
      { hint: 'Wirf das Netz aus.', fish: ['blau', 'gold'], speed: 0.01 },
      { hint: 'Noch einmal.', fish: ['gold', 'blau', 'blau'], speed: 0.01 }
    ]
  }
  const mountIt = (locale: 'de' | 'en' = 'de') => mount(GameNet, { props: { game }, ...opts(locale) })

  it('the goal is every fish of every round; the fish and the hint are there', () => {
    box400x300()
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(5)
    expect(w.findAll('img.gm-fish')).toHaveLength(2)
    expect(w.text()).toContain('Wirf das Netz aus.')
    expect(problems()).toEqual([])
  })

  it('a cast where no fish swims is a mistake (a cross, a word, the net comes up empty)', async () => {
    box400x300()
    const w = mountIt()
    await down(w.find('.gm-field').element, 40, 30)
    expect(w.find('.gm-net').exists()).toBe(true)
    expect(w.find('.gm-cross').exists()).toBe(true)
    await tick(300)
    expect(played).toContain('wrong')
    expect(w.text()).toContain('Das Netz ist leer')
    expect(useTaskProgress().parts.value).toBe(0)
    await tick(900)
    expect(w.find('.gm-net').exists()).toBe(false)
  })

  it('a cast over the fish takes them all in; the next round comes; the end gives the stars', async () => {
    box400x300()
    const w = mountIt()
    await down(w.find('.gm-field').element, 200, 150)
    await tick(400)
    expect(useTaskProgress().parts.value).toBe(2)
    expect(w.text()).toContain('Ein guter Fang!')
    await tick(1800)
    expect(w.text()).toContain('Noch einmal.')
    expect(w.findAll('img.gm-fish')).toHaveLength(3)
    await down(w.find('.gm-field').element, 200, 150)
    await tick(1400)
    expect(useTaskProgress().parts.value).toBe(5)
    expect(w.text()).toContain('Simon und Andreas waren Fischer')
    expect(played).toContain('star')
    expect(problems()).toEqual([])
  })

  it('a second cast while the net is out is ignored', async () => {
    box400x300()
    const w = mountIt()
    await down(w.find('.gm-field').element, 200, 150)
    await down(w.find('.gm-field').element, 40, 30)
    await tick(400)
    expect(useTaskProgress().parts.value).toBe(2)
    expect(w.find('.gm-cross').exists()).toBe(false)
  })

  it('after fifteen seconds without a tap the button "Wirf für mich" casts over a fish', async () => {
    box400x300()
    const w = mountIt()
    expect(w.text()).not.toContain('Wirf für mich')
    await tick(16000)
    expect(w.text()).toContain('Wirf für mich')
    await w.find('button.ct-all, button').trigger('click')
    await tick(400)
    expect(useTaskProgress().parts.value).toBeGreaterThan(0)
  })

  it('has English words', () => {
    box400x300()
    const w = mountIt('en')
    expect(w.text()).toContain('Caught: 0 of 5')
  })
})
