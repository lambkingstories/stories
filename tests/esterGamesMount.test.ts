/**
 * The new games of "Esther" (`schmuecken`, `ehren`): each is mounted with sample data and used: right and wrong moves, the rounds, the goal for the stars of "Go on" (`useTaskProgress`), the end with its stars,
 * German and English words.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import useTaskProgress from '@/use/useTaskProgress'
import GameDecor from '@/components/molecules/games/GameDecor.vue'
import GameHonor from '@/components/molecules/games/GameHonor.vue'
import type { DecorGame, HonorGame } from '@/types/adventure'

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

// ---------------------------------------------------------------- decorate the feast
describe('Das Fest schmücken (schmuecken)', () => {
  const game: DecorGame = {
    background: 'images/x/halle.webp',
    rounds: [
      {
        hint: 'Hänge die Tücher an die Säulen: erst weiß, dann rot.',
        mode: 'order',
        slots: [{ x: 30, y: 40, w: 12 }, { x: 70, y: 40, w: 12 }],
        items: [{ image: 'images/x/rot.webp', key: 'rot' }, { image: 'images/x/weiss.webp', key: 'weiss' }],
        want: ['weiss', 'rot'],
        ghostW: 12
      },
      {
        hint: 'Stelle die Becher auf den Tisch.',
        mode: 'distinct',
        slots: [{ x: 30, y: 70, w: 10 }, { x: 70, y: 70, w: 10 }],
        items: [{ image: 'images/x/b1.webp', key: 'b1' }, { image: 'images/x/b1.webp', key: 'b1' }, { image: 'images/x/b2.webp', key: 'b2' }],
        ghostW: 10
      }
    ]
  }
  const mountIt = (locale: 'de' | 'en' = 'de') => {
    box400x300()
    return mount(GameDecor, { props: { game }, ...opts(locale) })
  }
  const pick = async (w: ReturnType<typeof mountIt>, i: number) => {
    const el = w.findAll('.gm-wait')[i]!.element
    await ptr(el, 'pointerdown', 100, 320)
    await ptr(el, 'pointerup', 100, 320)
  }
  const slot = async (w: ReturnType<typeof mountIt>, i: number) => {
    await w.findAll('.gm-slot')[i]!.trigger('click')
    await flushPromises()
  }

  it('the goal is every place of all rounds; the hint, the free places and the waiting things are there', async () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(4)
    expect(w.text()).toContain('Hänge die Tücher an die Säulen')
    expect(w.findAll('.gm-slot')).toHaveLength(2)
    expect(w.findAll('.gm-wait')).toHaveLength(2)
    expect(w.find('.gm-count').text()).toContain('0')
    expect(problems()).toEqual([])
  })

  it('the right cloth on its place counts and stays; the wrong cloth is a mistake (a cross, a word) and nothing is placed', async () => {
    const w = mountIt()
    await pick(w, 0)
    await slot(w, 0)
    expect(played).toContain('wrong')
    expect(w.text()).toContain('Das gehört nicht hierher')
    expect(w.find('.gm-cross').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(0)
    await tick(1000)
    await pick(w, 1)
    await slot(w, 0)
    expect(played).toContain('snap')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.findAll('.gm-slot')).toHaveLength(1)
    expect(w.findAll('img.gm-done')).toHaveLength(1)
    expect(w.findAll('.gm-wait')[1]!.classes()).toContain('gone')
  })

  it('a dragged cloth lands on the place under the finger; letting go beside the places is no mistake', async () => {
    const w = mountIt()
    const el = w.findAll('.gm-wait')[1]!.element
    await ptr(el, 'pointerdown', 100, 320)
    await ptr(w.find('.gm-wrap').element, 'pointermove', 150, 150)
    await ptr(w.find('.gm-wrap').element, 'pointerup', 120, 120)
    expect(useTaskProgress().parts.value).toBe(1)
    const el2 = w.findAll('.gm-wait')[0]!.element
    await ptr(el2, 'pointerdown', 100, 320)
    await ptr(w.find('.gm-wrap').element, 'pointermove', 200, 280)
    await ptr(w.find('.gm-wrap').element, 'pointerup', 200, 280)
    expect(played).not.toContain('wrong')
    expect(useTaskProgress().parts.value).toBe(1)
  })

  it('round two: the same cup twice is refused as a twin; both rounds and the end', async () => {
    const w = mountIt()
    await pick(w, 1)
    await slot(w, 0)
    await pick(w, 0)
    await slot(w, 0)
    await tick(2000)
    expect(w.text()).toContain('Stelle die Becher auf den Tisch.')
    await pick(w, 0)
    await slot(w, 0)
    await pick(w, 1)
    await slot(w, 0)
    expect(played).toContain('wrong')
    expect(w.text()).toContain('So einen Becher gibt es schon')
    await tick(1000)
    await pick(w, 2)
    await slot(w, 0)
    expect(useTaskProgress().parts.value).toBe(4)
    await tick(2500)
    expect(w.text()).toContain('Der Garten ist geschmückt')
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = mountIt('en')
    await pick(w, 0)
    await slot(w, 0)
    expect(w.text()).toContain('That does not belong here')
    expect(problems()).toEqual([])
  })
})

// ---------------------------------------------------------------- honor the man
describe('Den Mann ehren (ehren)', () => {
  const game: HonorGame = {
    background: 'images/x/hof.webp',
    parade: 'images/x/umzug.webp',
    rounds: [
      { hint: 'Tippe das königliche Gewand an.', choices: [{ image: 'images/x/k1.webp', right: false, label: 'Sack' }, { image: 'images/x/k2.webp', right: true, label: 'Königsgewand' }, { image: 'images/x/k3.webp', right: false, label: 'Mantel' }, { image: 'images/x/k4.webp', right: false, label: 'Wolle' }] },
      { hint: 'Tippe die Krone an.', choices: [{ image: 'images/x/h1.webp', right: true, label: 'Krone' }, { image: 'images/x/h2.webp', right: false, label: 'Hut' }, { image: 'images/x/h3.webp', right: false, label: 'Kranz' }, { image: 'images/x/h4.webp', right: false, label: 'Tuch' }] },
      { hint: 'Tippe das Pferd an.', choices: [{ image: 'images/x/t1.webp', right: false, label: 'Esel' }, { image: 'images/x/t2.webp', right: false, label: 'Ochse' }, { image: 'images/x/t3.webp', right: true, label: 'Pferd' }, { image: 'images/x/t4.webp', right: false, label: 'Kamel' }] }
    ]
  }
  const mountIt = (locale: 'de' | 'en' = 'de') => mount(GameHonor, { props: { game }, ...opts(locale) })

  it('the goal is one choice per round; the hint, three frames and four choices are there', async () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(3)
    expect(w.text()).toContain('Tippe das königliche Gewand an.')
    expect(w.findAll('.gm-frame')).toHaveLength(3)
    expect(w.findAll('.gm-choice')).toHaveLength(4)
    expect(problems()).toEqual([])
  })

  it('a wrong choice is a mistake (a cross, a word) and is crossed out; the right one counts, fills a frame and the next round comes', async () => {
    const w = mountIt()
    await w.findAll('.gm-choice')[0]!.trigger('click')
    expect(played).toContain('wrong')
    expect(w.text()).toContain('Das hat Haman nicht genannt')
    expect(w.findAll('.gm-choice')[0]!.classes()).toContain('crossed')
    expect(w.find('.gm-cross').exists()).toBe(true)
    await w.findAll('.gm-choice')[0]!.trigger('click')
    expect(useTaskProgress().parts.value).toBe(0)
    await w.findAll('.gm-choice')[1]!.trigger('click')
    expect(played).toContain('snap')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.findAll('.gm-frame.full')).toHaveLength(1)
    await tick(1300)
    expect(w.text()).toContain('Tippe die Krone an.')
    expect(w.findAll('.gm-choice').every((c) => !c.classes().includes('crossed'))).toBe(true)
  })

  it('all three rounds, then the parade and the end', async () => {
    const w = mountIt()
    await w.findAll('.gm-choice')[1]!.trigger('click')
    await tick(1300)
    await w.findAll('.gm-choice')[0]!.trigger('click')
    await tick(1300)
    await w.findAll('.gm-choice')[2]!.trigger('click')
    expect(useTaskProgress().parts.value).toBe(3)
    await tick(1300)
    expect(w.text()).toContain('Mordechai reitet durch die Stadt')
    expect(w.findAll('.gm-choice')).toHaveLength(0)
    await tick(3500)
    expect(w.text()).toContain('Der König ehrt Mordechai')
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = mountIt('en')
    await w.findAll('.gm-choice')[0]!.trigger('click')
    expect(w.text()).toContain('Haman did not name that')
    expect(problems()).toEqual([])
  })
})
