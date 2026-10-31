/**
 * The new games of "Christmas" (`krippe`, `zeichen`): each is mounted with sample data and used: right and wrong moves, the rounds, the goal for the stars of "Go on" (`useTaskProgress`), the end with its stars,
 * German and English words.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import useTaskProgress from '@/use/useTaskProgress'
import GameCrib from '@/components/molecules/games/GameCrib.vue'
import GameSign from '@/components/molecules/games/GameSign.vue'
import type { CribGame, SignGame } from '@/types/adventure'

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

// ---------------------------------------------------------------- the manger
describe('Das Kind in die Krippe legen (krippe)', () => {
  const items = [
    ['windeln', 'Windeln'],
    ['koenigstuch', 'Königsmantel'],
    ['fell', 'Tierfell'],
    ['krippe', 'Krippe'],
    ['bett', 'Goldenes Bett'],
    ['korb', 'Korb']
  ].map(([id, label]) => ({ id: id!, image: `images/x/${id}.webp`, label: label!, w: 20 }))
  const game: CribGame = {
    background: 'images/x/stall.webp',
    parents: 'images/x/eltern.webp',
    parentsAt: { x: 26, y: 66 },
    parentsW: 30,
    baby: 'images/x/kind.webp',
    babyAt: { x: 55, y: 66 },
    babyW: 18,
    manger: 'images/x/krippe-kind.webp',
    mangerAt: { x: 62, y: 70 },
    mangerW: 34,
    items,
    rounds: [
      { hint: 'Womit wickelt Maria das Kind?', options: ['koenigstuch', 'windeln', 'fell'], right: 'windeln' },
      { hint: 'Wohin legt Maria das Kind?', options: ['bett', 'korb', 'krippe'], right: 'krippe' }
    ]
  }
  const mountIt = (locale: 'de' | 'en' = 'de') => mount(GameCrib, { props: { game }, ...opts(locale) })
  const pick = async (w: ReturnType<typeof mountIt>, label: string) => {
    await w.find(`button[aria-label="${label}"]`).trigger('click')
    await flushPromises()
  }

  it('the goal is one choice per round; the hint, Mary and Joseph and three cloths are there, no baby yet', async () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(2)
    expect(w.text()).toContain('Womit wickelt Maria das Kind?')
    expect(w.findAll('.gm-option')).toHaveLength(3)
    expect(w.find('img.gm-parents').exists()).toBe(true)
    expect(w.find('img.gm-baby').exists()).toBe(false)
    expect(problems()).toEqual([])
  })

  it('a wrong cloth is a mistake (a cross, a word) and nothing changes; the swaddling cloths make the wrapped baby appear', async () => {
    const w = mountIt()
    await pick(w, 'Königsmantel')
    expect(played).toContain('wrong')
    expect(w.text()).toContain('Nicht dieses')
    expect(w.find('.gm-cross').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(0)
    expect(w.find('img.gm-baby').exists()).toBe(false)
    await tick(1000)
    await pick(w, 'Windeln')
    expect(played).toContain('snap')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.find('img.gm-baby').exists()).toBe(true)
    expect(w.text()).toContain('Maria wickelt ihren ersten Sohn in Windeln')
  })

  it('round two offers three beds; the manger lays the baby into it; the end', async () => {
    const w = mountIt()
    await pick(w, 'Windeln')
    await tick(2400)
    expect(w.text()).toContain('Wohin legt Maria das Kind?')
    expect(w.findAll('.gm-option')).toHaveLength(3)
    await pick(w, 'Goldenes Bett')
    expect(w.find('img.gm-manger').exists()).toBe(false)
    await tick(1000)
    await pick(w, 'Krippe')
    expect(useTaskProgress().parts.value).toBe(2)
    expect(w.find('img.gm-manger').exists()).toBe(true)
    expect(w.find('img.gm-baby').exists()).toBe(false)
    expect(w.text()).toContain('keinen Raum in der Herberge')
    await tick(3000)
    expect(w.text()).toContain('Maria wickelte ihren ersten Sohn in Windeln und legte ihn in eine Krippe')
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = mountIt('en')
    await pick(w, 'Königsmantel')
    expect(w.text()).toContain('Not this one')
    expect(problems()).toEqual([])
  })
})

// ---------------------------------------------------------------- the sign
describe('Das Zeichen finden (zeichen)', () => {
  const places = ['haus1', 'haus2', 'haus3', 'haus4', 'leer', 'stall'].map((id) => ({ id, image: `images/x/${id}.webp`, label: id === 'stall' ? 'Unterstand' : `Ort ${id}` }))
  const slots = [
    { x: 26, y: 57, w: 26 },
    { x: 55, y: 57, w: 26 },
    { x: 84, y: 57, w: 26 },
    { x: 26, y: 89, w: 26 },
    { x: 55, y: 89, w: 26 },
    { x: 84, y: 89, w: 26 }
  ]
  const game: SignGame = {
    background: 'images/x/strasse.webp',
    places,
    slots,
    walker: 'images/x/hirten.webp',
    walkerW: 12,
    start: { x: 7, y: 98 },
    rounds: [
      { hint: 'Suche das Zeichen.', order: ['haus1', 'stall', 'haus2', 'leer', 'haus3', 'haus4'], right: 'stall' },
      { hint: 'Noch einmal.', order: ['leer', 'haus3', 'haus4', 'stall', 'haus1', 'haus2'], right: 'stall' }
    ]
  }
  const mountIt = (locale: 'de' | 'en' = 'de') => mount(GameSign, { props: { game }, ...opts(locale) })
  const place = async (w: ReturnType<typeof mountIt>, slot: number) => {
    await w.findAll('.gm-place')[slot]!.trigger('click')
    await flushPromises()
  }

  it('the goal is one find per round; the hint, six places and the shepherds are there', async () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(2)
    expect(w.text()).toContain('Suche das Zeichen.')
    expect(w.findAll('.gm-place')).toHaveLength(6)
    expect(w.find('img.gm-walker').exists()).toBe(true)
    expect(problems()).toEqual([])
  })

  it('a wrong place is a mistake: the shepherds walk there, a cross and a word come, they walk back; nothing is counted', async () => {
    const w = mountIt()
    await place(w, 0)
    expect(w.find('img.gm-walker').attributes('style')).toContain('left: 26%')
    await tick(1000)
    expect(played).toContain('wrong')
    expect(w.text()).toContain('Nicht hier')
    expect(w.find('.gm-cross').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(0)
    await tick(1500)
    expect(w.find('img.gm-walker').attributes('style')).toContain('left: 7%')
    expect(w.find('.gm-cross').exists()).toBe(false)
  })

  it('the right place counts and the shepherds stay; the next round has another order; the end', async () => {
    const w = mountIt()
    await place(w, 1)
    await tick(1000)
    expect(played).toContain('snap')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.text()).toContain('Die Hirten finden Maria und Josef')
    await tick(2500)
    expect(w.text()).toContain('Noch einmal.')
    await place(w, 3)
    await tick(1000)
    expect(useTaskProgress().parts.value).toBe(2)
    await tick(3000)
    expect(w.text()).toContain('Die Hirten fanden es genau so')
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = mountIt('en')
    await place(w, 0)
    await tick(1000)
    expect(w.text()).toContain('Not here')
    expect(problems()).toEqual([])
  })
})
