/**
 * The new games of "Nehemiah" (`ritt`, `posaune`): each is mounted with sample data and used: right and wrong moves, the rounds, the goal for the stars of "Go on" (`useTaskProgress`), the end with its stars,
 * German and English words.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import useTaskProgress from '@/use/useTaskProgress'
import GameRide from '@/components/molecules/games/GameRide.vue'
import GamePost from '@/components/molecules/games/GamePost.vue'
import type { PostGame, RideGame } from '@/types/adventure'

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
const ptr = async (el: Element, type: 'pointerdown' | 'pointermove' | 'pointerup', x: number, y: number) => {
  el.dispatchEvent(new MouseEvent(type, { bubbles: true, button: 0, clientX: x, clientY: y }))
  await flushPromises()
}

// ---------------------------------------------------------------- the ride by night
describe('Der nächtliche Ritt (ritt)', () => {
  const game: RideGame = {
    background: 'images/x/karte.webp',
    rider: 'images/x/esel.webp',
    riderW: 14,
    start: { x: 6, y: 90 },
    spots: [
      { id: 'a', label: 'Taltor', x: 20, y: 70, w: 14 },
      { id: 'b', label: 'Schlangenquelle', x: 50, y: 85, w: 14 },
      { id: 'c', label: 'Misttor', x: 80, y: 70, w: 14 }
    ],
    rounds: [
      { hint: 'Reite zu den Orten in der Reihenfolge des Textes.', order: ['a', 'b', 'c'], showList: true },
      { hint: 'Noch einmal ohne Liste.', order: ['a', 'b', 'c'], showList: false }
    ]
  }
  const mountIt = (locale: 'de' | 'en' = 'de') => mount(GameRide, { props: { game }, ...opts(locale) })
  const spot = async (w: ReturnType<typeof mountIt>, i: number) => {
    await w.findAll('.gm-spot')[i]!.trigger('click')
    await flushPromises()
  }

  it('the goal is every place of both rounds; the hint, the list of the places, three spots and the rider are there', async () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(6)
    expect(w.text()).toContain('Reite zu den Orten')
    expect(w.findAll('.gm-list li')).toHaveLength(3)
    expect(w.findAll('.gm-spot')).toHaveLength(3)
    expect(w.find('img.gm-rider').exists()).toBe(true)
    expect(problems()).toEqual([])
  })

  it('a place out of order is a mistake (a cross, a word) and the rider stays; the right place makes him ride there', async () => {
    const w = mountIt()
    await spot(w, 1)
    expect(played).toContain('wrong')
    expect(w.text()).toContain('Nicht dieser Ort')
    expect(w.find('.gm-cross').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(0)
    await tick(1000)
    await spot(w, 0)
    expect(played).toContain('snap')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.findAll('.gm-spot')[0]!.classes()).toContain('reached')
    expect(w.find('img.gm-rider').attributes('style')).toContain('left: 20%')
  })

  it('a place that was already reached is no mistake', async () => {
    const w = mountIt()
    await spot(w, 0)
    await spot(w, 0)
    expect(played).not.toContain('wrong')
    expect(useTaskProgress().parts.value).toBe(1)
  })

  it('round two has no list; both rounds and the end', async () => {
    const w = mountIt()
    for (const i of [0, 1, 2]) await spot(w, i)
    await tick(2100)
    expect(w.findAll('.gm-list')).toHaveLength(0)
    expect(w.text()).toContain('Noch einmal ohne Liste.')
    for (const i of [0, 1, 2]) await spot(w, i)
    expect(useTaskProgress().parts.value).toBe(6)
    await tick(3000)
    expect(w.text()).toContain('Nehemia hat die ganze zerbrochene Mauer gesehen')
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = mountIt('en')
    await spot(w, 2)
    expect(w.text()).toContain('Not this place')
    expect(problems()).toEqual([])
  })
})

// ---------------------------------------------------------------- the trumpet calls
describe('Die Posaune ruft (posaune)', () => {
  const game: PostGame = {
    background: 'images/x/mauer.webp',
    workers: ['images/x/b1.webp', 'images/x/b2.webp'],
    workerW: 10,
    horn: 'images/x/posaune.webp',
    hornW: 16,
    wave: 'images/x/welle.webp',
    rounds: [
      { hint: 'Die Posaune ruft! Tippe die Bauleute an.', horn: { x: 50, y: 60 }, workers: [{ x: 10, y: 75 }, { x: 90, y: 75 }] },
      { hint: 'Jetzt am linken Ende.', horn: { x: 14, y: 60 }, workers: [{ x: 40, y: 75 }, { x: 60, y: 75 }, { x: 85, y: 75 }] }
    ]
  }
  const mountIt = (locale: 'de' | 'en' = 'de') => mount(GamePost, { props: { game }, ...opts(locale) })
  const call = async (w: ReturnType<typeof mountIt>, i: number) => {
    await w.findAll('.gm-worker')[i]!.trigger('click')
    await flushPromises()
  }

  it('the goal is every builder of all rounds; the hint, the builders, the trumpeter and the sound arcs are there', async () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(5)
    expect(w.text()).toContain('Die Posaune ruft!')
    expect(w.findAll('.gm-worker')).toHaveLength(2)
    expect(w.find('img.gm-horn').exists()).toBe(true)
    expect(w.find('img.gm-wave').exists()).toBe(true)
    expect(problems()).toEqual([])
  })

  it('a tapped builder walks to the trumpeter, counts once and cannot be called again', async () => {
    const w = mountIt()
    await call(w, 0)
    expect(played).toContain('snap')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.findAll('.gm-worker')[0]!.classes()).toContain('gone')
    expect(w.findAll('.gm-worker')[0]!.attributes('style')).not.toContain('left: 10%')
    await call(w, 0)
    expect(useTaskProgress().parts.value).toBe(1)
  })

  it('the sound arcs go away after a moment', async () => {
    const w = mountIt()
    await tick(2600)
    expect(w.find('img.gm-wave').exists()).toBe(false)
  })

  it('when all are gathered the next round comes with more builders; at the end three stars (nobody can do it wrong)', async () => {
    const w = mountIt()
    await call(w, 0)
    await call(w, 1)
    expect(w.text()).toContain('Alle haben sich bei der Posaune versammelt')
    await tick(2000)
    expect(w.text()).toContain('Jetzt am linken Ende.')
    expect(w.findAll('.gm-worker')).toHaveLength(3)
    for (const i of [0, 1, 2]) await call(w, i)
    expect(useTaskProgress().parts.value).toBe(5)
    await tick(2500)
    expect(w.text()).toContain('Wo die Posaune erklingt')
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = mountIt('en')
    await call(w, 0)
    await call(w, 1)
    expect(w.text()).toContain('Everyone has gathered at the trumpet')
    expect(problems()).toEqual([])
  })
})
