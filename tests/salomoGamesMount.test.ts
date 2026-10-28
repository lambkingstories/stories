/**
 * The new games of "Solomon" (`leise`, `thron`): each is mounted with sample data and used: right and wrong moves, the rounds, the goal for the stars of "Go on" (`useTaskProgress`), the end with its stars,
 * German and English words.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import useTaskProgress from '@/use/useTaskProgress'
import GameQuiet from '@/components/molecules/games/GameQuiet.vue'
import GameThrone from '@/components/molecules/games/GameThrone.vue'
import type { QuietGame, ThroneGame } from '@/types/adventure'

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

// ---------------------------------------------------------------- lay the stones quietly
describe('Steine leise legen (quiet)', () => {
  const game: QuietGame = {
    background: 'images/x/bauplatz.webp',
    stones: ['images/x/stein-1.webp', 'images/x/stein-2.webp', 'images/x/stein-3.webp'],
    stoneW: 17,
    rounds: [
      { hint: 'Ziehe den Stein ganz langsam.', gaps: [{ x: 50, y: 60, w: 17 }], starts: [{ x: 14, y: 80 }], max: 70 },
      { hint: 'Jetzt zwei.', gaps: [{ x: 35, y: 60, w: 17 }, { x: 65, y: 60, w: 17 }], starts: [{ x: 14, y: 80 }, { x: 14, y: 62 }], max: 52 }
    ]
  }
  const mountIt = (locale: 'de' | 'en' = 'de') => {
    box400x300()
    return mount(GameQuiet, { props: { game }, ...opts(locale) })
  }
  /** Pulls a stone slowly (about 20 percent of the width per second) from its start to a place and lets go there. */
  const pull = async (w: ReturnType<typeof mountIt>, stone: number, from: [number, number], to: [number, number], stepMs = 50, steps = 24) => {
    const el = w.findAll('.gm-stone')[stone]!.element
    const field = w.find('.gm-field').element
    await ptr(el, 'pointerdown', from[0], from[1])
    for (let i = 1; i <= steps; i++) {
      await tick(stepMs)
      await ptr(field, 'pointermove', from[0] + ((to[0] - from[0]) * i) / steps, from[1] + ((to[1] - from[1]) * i) / steps)
    }
    await ptr(field, 'pointerup', to[0], to[1])
  }

  it('the goal is every stone of both rounds; the hint, the meter and the stone are there', async () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(3)
    expect(w.text()).toContain('Ziehe den Stein ganz langsam.')
    expect(w.find('.gm-meter').text()).toContain('leise')
    expect(w.findAll('.gm-stone')).toHaveLength(1)
    expect(w.findAll('.gm-gap')).toHaveLength(1)
    expect(problems()).toEqual([])
  })

  it('a slow pull to the gap lays the stone (a soft sound, a part done); round one is over and round two comes', async () => {
    const w = mountIt()
    await pull(w, 0, [56, 240], [200, 180])
    expect(played).toContain('snap')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.find('.gm-gap').classes()).toContain('filled')
    await tick(2000)
    expect(w.text()).toContain('Jetzt zwei.')
    expect(w.findAll('.gm-stone')).toHaveLength(2)
    expect(problems()).toEqual([])
  })

  it('a pull that is too fast clacks: a cross, a word, one mistake, the stone goes back to its place', async () => {
    const w = mountIt()
    const el = w.find('.gm-stone').element
    const field = w.find('.gm-field').element
    await ptr(el, 'pointerdown', 56, 240)
    await tick(50)
    await ptr(field, 'pointermove', 180, 180)
    await tick(50)
    await ptr(field, 'pointermove', 220, 170)
    expect(played).toContain('wrong')
    expect(w.text()).toContain('Klack')
    expect(w.find('.gm-cloud').exists()).toBe(true)
    await ptr(field, 'pointerup', 220, 170)
    expect(useTaskProgress().parts.value).toBe(0)
    await tick(1000)
    expect(w.find('.gm-cloud').exists()).toBe(false)
    // the stone can be pulled again and the second try, slowly, works
    await pull(w, 0, [56, 240], [200, 180])
    expect(useTaskProgress().parts.value).toBe(1)
  })

  it('letting go beside the gap is no mistake: the stone goes back and the game goes on', async () => {
    const w = mountIt()
    await pull(w, 0, [56, 240], [330, 120])
    expect(played).not.toContain('wrong')
    expect(useTaskProgress().parts.value).toBe(0)
    await pull(w, 0, [56, 240], [200, 180])
    expect(useTaskProgress().parts.value).toBe(1)
  })

  it('both rounds and the end: no mistake gives three stars', async () => {
    const w = mountIt()
    await pull(w, 0, [56, 240], [200, 180])
    await tick(2000)
    await pull(w, 0, [56, 240], [140, 180])
    await pull(w, 1, [56, 186], [260, 180])
    expect(useTaskProgress().parts.value).toBe(3)
    await tick(2500)
    expect(w.text()).toContain('leise gelegt')
    expect(w.findAll('.gm-stone')).toHaveLength(0)
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = mountIt('en')
    expect(w.find('.gm-meter').text()).toContain('quiet')
    await pull(w, 0, [56, 240], [200, 180])
    expect(w.text()).toContain('lies in its place')
  })
})

// ---------------------------------------------------------------- build the throne
describe('Den Thron bauen (throne)', () => {
  const game: ThroneGame = {
    background: 'images/x/saal.webp',
    lion: 'images/x/loewe.webp',
    lionW: 12,
    rounds: [
      {
        hint: 'Setze die Löwen auf die unteren Stufen.',
        slots: [{ x: 30, y: 80, w: 10, side: 'left' }, { x: 70, y: 80, w: 10, side: 'right' }],
        lions: ['right', 'left']
      },
      {
        hint: 'Jetzt die Armlehnen.',
        slots: [{ x: 40, y: 30, w: 8, side: 'arm-left' }, { x: 60, y: 30, w: 8, side: 'arm-right' }],
        lions: ['left', 'right']
      }
    ]
  }
  const mountIt = (locale: 'de' | 'en' = 'de') => {
    box400x300()
    return mount(GameThrone, { props: { game }, ...opts(locale) })
  }
  const pick = async (w: ReturnType<typeof mountIt>, lion: number) => {
    const el = w.findAll('.gm-wait')[lion]!.element
    await ptr(el, 'pointerdown', 100, 320)
    await ptr(el, 'pointerup', 100, 320)
  }
  const slot = async (w: ReturnType<typeof mountIt>, i: number) => {
    await w.findAll('.gm-slot')[i]!.trigger('click')
    await flushPromises()
  }

  it('the goal is every lion of all rounds; the hint, the free slots and the waiting lions are there; no lion stands on the throne yet', async () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(4)
    expect(w.text()).toContain('Setze die Löwen auf die unteren Stufen.')
    expect(w.findAll('.gm-slot')).toHaveLength(2)
    expect(w.findAll('.gm-wait')).toHaveLength(2)
    expect(w.find('.gm-count').text()).toContain('0')
    expect(problems()).toEqual([])
  })

  it('a lion that looks to the right goes to the left slot: picked up, then the slot is tapped; the lion stands there and counts', async () => {
    const w = mountIt()
    await pick(w, 0)
    expect(w.findAll('.gm-wait')[0]!.classes()).toContain('sel')
    await slot(w, 0)
    expect(played).toContain('snap')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.findAll('.gm-slot')).toHaveLength(1)
    expect(w.findAll('img.gm-lion.done')).toHaveLength(1)
    expect(w.findAll('.gm-wait')[0]!.classes()).toContain('gone')
    expect(w.find('.gm-count').text()).toContain('1')
  })

  it('the wrong side is a mistake (a cross, a word) and the lion stays on its place; the right side then works', async () => {
    const w = mountIt()
    await pick(w, 0)
    await slot(w, 1)
    expect(played).toContain('wrong')
    expect(w.text()).toContain('Nicht diese Seite')
    expect(w.find('.gm-cross').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(0)
    await tick(1000)
    await pick(w, 0)
    await slot(w, 0)
    expect(useTaskProgress().parts.value).toBe(1)
  })

  it('a dragged lion lands on the slot under the finger; letting go beside the slots is no mistake', async () => {
    const w = mountIt()
    const lion = w.findAll('.gm-wait')[1]!.element
    const wrap = w.find('.gm-wrap').element
    await ptr(lion, 'pointerdown', 150, 320)
    await ptr(wrap, 'pointermove', 200, 100)
    await ptr(wrap, 'pointerup', 200, 100)
    expect(played).not.toContain('wrong')
    expect(useTaskProgress().parts.value).toBe(0)
    // the lion that looks to the left goes to the right slot at x = 70 percent (280 px), y = 80 percent (240 px)
    await ptr(lion, 'pointerdown', 150, 320)
    await ptr(wrap, 'pointermove', 280, 245)
    await ptr(wrap, 'pointerup', 280, 245)
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.findAll('img.gm-lion.done')).toHaveLength(1)
  })

  it('both rounds and the end: the lions of round one stay, round two has the armrests; no mistake gives three stars', async () => {
    const w = mountIt()
    await pick(w, 0)
    await slot(w, 0)
    await pick(w, 1)
    await slot(w, 0)
    expect(w.text()).toContain('Diese Stufen sind fertig')
    await tick(2200)
    expect(w.text()).toContain('Jetzt die Armlehnen.')
    expect(w.findAll('img.gm-lion.done')).toHaveLength(2)
    // round 2: the first lion looks to the left (goes right), the second to the right (goes left)
    await pick(w, 1)
    await slot(w, 0)
    await pick(w, 0)
    await slot(w, 0)
    expect(useTaskProgress().parts.value).toBe(4)
    expect(w.text()).toContain('zusammen 4 Löwen')
    await tick(2500)
    expect(w.text()).toContain('sechs Stufen und vierzehn Löwen')
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = mountIt('en')
    expect(w.find('.gm-count').text()).toContain('Lions on the throne')
    await pick(w, 0)
    await slot(w, 1)
    expect(w.text()).toContain('Not this side')
  })
})
