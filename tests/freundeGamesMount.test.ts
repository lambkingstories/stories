/**
 * The new games of "Jesus Calls His Friends" (`boote`, `dach`): each is mounted with sample data and used: right and wrong moves, the rounds, the goal for the stars of "Go on" (`useTaskProgress`), the end with its stars,
 * German and English words.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import useTaskProgress from '@/use/useTaskProgress'
import GameBoats from '@/components/molecules/games/GameBoats.vue'
import GameRoof from '@/components/molecules/games/GameRoof.vue'
import type { BoatsGame, RoofGame } from '@/types/adventure'

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

// ---------------------------------------------------------------- fill both boats
describe('Beide Boote füllen (boote)', () => {
  const game: BoatsGame = {
    background: 'images/x/see.webp',
    boats: [
      { id: 'k', image: 'images/x/boot-klein.webp', label: 'Kleines Boot', w: 36, ratio: 1.67, x: 27, y: 90, deck: { x: 16, y: 30, w: 66, h: 40 } },
      { id: 'g', image: 'images/x/boot-gross.webp', label: 'Großes Boot', w: 44, ratio: 1.67, x: 71, y: 90, deck: { x: 14, y: 30, w: 70, h: 40 } }
    ],
    fish: [
      { id: 'blau', image: 'images/x/f1.webp', w: 6.5 },
      { id: 'gold', image: 'images/x/f2.webp', w: 6.5 }
    ],
    pile: 'images/x/haufen.webp',
    pileAt: { x: 50, y: 30, w: 24 },
    rounds: [
      { hint: 'Fülle beide Boote.', capacity: [1, 2] },
      { hint: 'Noch einmal.', capacity: [2, 2] }
    ]
  }
  const mountIt = (locale: 'de' | 'en' = 'de') => mount(GameBoats, { props: { game }, ...opts(locale) })

  it('the goal is every fish of every round; the two boats, the empty places and the hint are there', () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(7)
    expect(w.findAll('button.gm-boat')).toHaveLength(2)
    expect(w.findAll('.gm-slot')).toHaveLength(3)
    expect(w.text()).toContain('Fülle beide Boote.')
    expect(w.find('button.gm-boat').attributes('aria-label')).toContain('Kleines Boot: 0 von 1')
    expect(problems()).toEqual([])
  })

  it('a tap sends one fish into the boat; a tap on a full boat is a mistake (a cross, a word), nothing is counted', async () => {
    const w = mountIt()
    const small = w.findAll('button.gm-boat')[0]!
    await small.trigger('click')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.findAll('img.gm-fish')).toHaveLength(1)
    expect(played).toContain('snap')
    await small.trigger('click')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(played).toContain('wrong')
    expect(w.text()).toContain('schon voll')
    expect(w.find('.gm-cross').exists()).toBe(true)
    await tick(1000)
    expect(w.find('.gm-cross').exists()).toBe(false)
  })

  it('when both boats are full the next round comes; the end gives the stars', async () => {
    const w = mountIt()
    await w.findAll('button.gm-boat')[0]!.trigger('click')
    await w.findAll('button.gm-boat')[1]!.trigger('click')
    await w.findAll('button.gm-boat')[1]!.trigger('click')
    expect(useTaskProgress().parts.value).toBe(3)
    await tick(700)
    expect(w.text()).toContain('Beide Boote sind so voll')
    await tick(2200)
    expect(w.text()).toContain('Noch einmal.')
    expect(w.findAll('img.gm-fish')).toHaveLength(0)
    expect(w.findAll('.gm-slot')).toHaveLength(4)
    for (const i of [0, 0, 1, 1]) await w.findAll('button.gm-boat')[i]!.trigger('click')
    expect(useTaskProgress().parts.value).toBe(7)
    await tick(3200)
    expect(w.text()).toContain('Simon und seine Gefährten fingen')
    expect(played).toContain('star')
    expect(problems()).toEqual([])
  })

  it('has English words', () => {
    const w = mountIt('en')
    expect(w.text()).toContain('Fish in the boats: 0 of 7')
  })
})

// ---------------------------------------------------------------- open the roof
describe('Das Dach öffnen (dach)', () => {
  const game: RoofGame = {
    background: 'images/x/haus.webp',
    roof: 'images/x/dach.webp',
    area: { x: 14, y: 26, w: 72, h: 9 },
    floor: 90,
    jesus: { image: 'images/x/jesus.webp', label: 'Jesus sitzt und lehrt', w: 12 },
    people: [
      { id: 'l1', image: 'images/x/l1.webp', label: 'Zwei Männer', w: 13 },
      { id: 'l2', image: 'images/x/l2.webp', label: 'Frau mit Kind', w: 13 }
    ],
    mat: { image: 'images/x/matte.webp', label: 'Der Gelähmte auf seinem Bett', w: 14, ratio: 0.5 },
    rope: { image: 'images/x/seil.webp', w: 2.2 },
    carriers: { image: 'images/x/traeger.webp', w: 34 },
    rounds: [
      {
        hint: 'Öffne das Dach über Jesus.',
        cols: 8,
        free: [3, 4],
        jesusX: 45,
        matX: 52,
        spots: [
          { person: 'l1', x: 19 },
          { person: 'l2', x: 31 },
          { person: 'l1', x: 70 },
          { person: 'l2', x: 80 }
        ]
      },
      {
        hint: 'Noch einmal.',
        cols: 10,
        free: [5, 6, 7],
        jesusX: 55,
        matX: 64,
        spots: [
          { person: 'l1', x: 20 },
          { person: 'l2', x: 31 },
          { person: 'l1', x: 42 },
          { person: 'l2', x: 83 }
        ]
      }
    ]
  }
  const mountIt = (locale: 'de' | 'en' = 'de') => mount(GameRoof, { props: { game }, ...opts(locale) })

  it('the goal is every free piece of every round; the pieces, Jesus, the people and the hint are there', () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(5)
    expect(w.findAll('button.gm-tile')).toHaveLength(8)
    expect(w.findAll('img.gm-person')).toHaveLength(4)
    expect(w.find('img.gm-jesus').exists()).toBe(true)
    expect(w.text()).toContain('Öffne das Dach über Jesus.')
    expect(problems()).toEqual([])
  })

  it('a piece above people stays (a cross, a word, the people duck), nothing is counted', async () => {
    const w = mountIt()
    await w.findAll('button.gm-tile')[1]!.trigger('click')
    expect(played).toContain('wrong')
    expect(w.text()).toContain('Unter diesem Stück sitzen Menschen')
    expect(w.find('.gm-cross').exists()).toBe(true)
    expect(w.findAll('img.gm-person.duck').length).toBeGreaterThan(0)
    expect(useTaskProgress().parts.value).toBe(0)
    expect(w.findAll('button.gm-tile')[1]!.classes()).not.toContain('gone')
    await tick(1000)
    expect(w.find('.gm-cross').exists()).toBe(false)
    expect(w.findAll('img.gm-person.duck')).toHaveLength(0)
  })

  it('the free pieces come off; then the four friends let the bed down; the next round has another place; the end gives the stars', async () => {
    const w = mountIt()
    await w.findAll('button.gm-tile')[3]!.trigger('click')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.findAll('button.gm-tile')[3]!.classes()).toContain('gone')
    expect(w.find('img.gm-mat').exists()).toBe(false)
    await w.findAll('button.gm-tile')[4]!.trigger('click')
    expect(useTaskProgress().parts.value).toBe(2)
    expect(w.text()).toContain('Das Dach ist offen')
    await tick(800)
    expect(w.find('img.gm-mat').exists()).toBe(true)
    expect(w.find('img.gm-rope').exists()).toBe(true)
    expect(w.find('img.gm-carriers').classes()).toContain('here')
    await tick(2000)
    expect(w.text()).toContain('Das Bett steht vor Jesus')
    expect(played).toContain('star')
    await tick(2400)
    expect(w.text()).toContain('Noch einmal.')
    expect(w.findAll('button.gm-tile')).toHaveLength(10)
    expect(w.find('img.gm-mat').exists()).toBe(false)
    for (const c of [5, 6, 7]) await w.findAll('button.gm-tile')[c]!.trigger('click')
    expect(useTaskProgress().parts.value).toBe(5)
    await tick(5000)
    expect(w.text()).toContain('Vier Männer deckten das Dach')
    expect(problems()).toEqual([])
  })

  it('has English words', () => {
    const w = mountIt('en')
    expect(w.text()).toContain('Pieces of the roof taken off: 0 of 5')
  })
})
