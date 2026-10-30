/**
 * The new games of "The King Is Coming" (`friede`, `schmieden`): each is mounted with sample data and used: right and wrong moves, the rounds, the goal for the stars of "Go on" (`useTaskProgress`), the end with its stars,
 * German and English words.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import useTaskProgress from '@/use/useTaskProgress'
import GamePeace from '@/components/molecules/games/GamePeace.vue'
import GameForge from '@/components/molecules/games/GameForge.vue'
import type { ForgeGame, PeaceGame } from '@/types/adventure'

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

// ---------------------------------------------------------------- peace among the animals
describe('Frieden unter den Tieren (friede)', () => {
  const animals = [
    ['wolf', 'Wolf'],
    ['leopard', 'Leopard'],
    ['loewe', 'Löwe'],
    ['baer', 'Bär'],
    ['lamm', 'Lamm'],
    ['zicklein', 'Zicklein'],
    ['kalb', 'Kalb'],
    ['kuh', 'Kuh']
  ].map(([id, label]) => ({ id: id!, image: `images/x/${id}.webp`, label: label!, w: 16 }))
  const game: PeaceGame = {
    background: 'images/x/wiese.webp',
    animals,
    pairs: [
      { predator: 'wolf', prey: 'lamm' },
      { predator: 'leopard', prey: 'zicklein' },
      { predator: 'loewe', prey: 'kalb' },
      { predator: 'baer', prey: 'kuh' }
    ],
    spots: [
      { x: 14, y: 46 },
      { x: 60, y: 46 },
      { x: 14, y: 70 },
      { x: 60, y: 70 }
    ],
    stripY: 94,
    boy: 'images/x/knabe.webp',
    boyW: 13,
    rounds: [
      { hint: 'Bringe die Tiere zusammen.', showList: true, preyOrder: ['kuh', 'lamm', 'kalb', 'zicklein'] },
      { hint: 'Noch einmal ohne Liste.', showList: false, preyOrder: ['kalb', 'zicklein', 'kuh', 'lamm'] }
    ]
  }
  const mountIt = (locale: 'de' | 'en' = 'de') => mount(GamePeace, { props: { game }, ...opts(locale) })
  const animal = async (w: ReturnType<typeof mountIt>, label: string) => {
    await w.find(`button[aria-label="${label}"]`).trigger('click')
    await flushPromises()
  }
  const pair = async (w: ReturnType<typeof mountIt>, a: string, b: string) => {
    await animal(w, a)
    await animal(w, b)
  }

  it('the goal is every pair of both rounds; the hint, the list of the pairs and eight animals are there', async () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(8)
    expect(w.text()).toContain('Bringe die Tiere zusammen.')
    expect(w.findAll('.gm-list li')).toHaveLength(4)
    expect(w.findAll('.gm-animal')).toHaveLength(8)
    expect(problems()).toEqual([])
  })

  it('a wrong partner is a mistake (a cross, a word) and nothing moves; the right partner walks up to the predator', async () => {
    const w = mountIt()
    await pair(w, 'Wolf', 'Kuh')
    expect(played).toContain('wrong')
    expect(w.text()).toContain('Nicht dieses Tier')
    expect(w.find('.gm-cross').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(0)
    await tick(1000)
    await pair(w, 'Wolf', 'Lamm')
    expect(played).toContain('snap')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.find('button[aria-label="Lamm"]').classes()).toContain('together')
    expect(w.find('button[aria-label="Lamm"]').attributes('style')).toContain('left: 37%')
    expect(w.find('button[aria-label="Lamm"]').attributes('style')).toContain('top: 46%')
  })

  it('the partner can be tapped first and the predator second; two animals of the same kind just change the choice', async () => {
    const w = mountIt()
    await pair(w, 'Lamm', 'Wolf')
    expect(useTaskProgress().parts.value).toBe(1)
    await animal(w, 'Bär')
    await animal(w, 'Löwe')
    expect(played).not.toContain('wrong')
    await pair(w, 'Kalb', 'Löwe')
    expect(useTaskProgress().parts.value).toBe(2)
  })

  it('round two has no list and another order of the strip; both rounds and the end with the boy', async () => {
    const w = mountIt()
    for (const [a, b] of [['Wolf', 'Lamm'], ['Leopard', 'Zicklein'], ['Löwe', 'Kalb'], ['Bär', 'Kuh']] as const) await pair(w, a, b)
    expect(w.text()).toContain('Noch einmal, aus dem Kopf')
    await tick(2100)
    expect(w.findAll('.gm-list')).toHaveLength(0)
    expect(w.text()).toContain('Noch einmal ohne Liste.')
    for (const [a, b] of [['Wolf', 'Lamm'], ['Leopard', 'Zicklein'], ['Löwe', 'Kalb'], ['Bär', 'Kuh']] as const) await pair(w, a, b)
    expect(useTaskProgress().parts.value).toBe(8)
    await tick(900)
    expect(w.find('img.gm-boy').exists()).toBe(true)
    await tick(3000)
    expect(w.text()).toContain('Der Wolf wird bei dem Lamm wohnen')
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = mountIt('en')
    await pair(w, 'Wolf', 'Kuh')
    expect(w.text()).toContain('Not this animal')
    expect(problems()).toEqual([])
  })
})

// ---------------------------------------------------------------- the forge
describe('Die Schmiede (schmieden)', () => {
  const items = [
    ['schwert', 'Schwert'],
    ['speer', 'Speer'],
    ['pflugschar', 'Pflugschar'],
    ['sichel', 'Sichel'],
    ['hammer', 'Hammer'],
    ['glut', 'Glühendes Metall']
  ].map(([id, label]) => ({ id: id!, image: `images/x/${id}.webp`, label: label!, w: 22 }))
  const game: ForgeGame = {
    background: 'images/x/schmiede.webp',
    items,
    hot: 'glut',
    hammer: 'hammer',
    anvil: { x: 50, y: 72 },
    itemW: 24,
    rounds: [
      { hint: 'Schlage dreimal auf den Amboss.', item: 'schwert', result: 'pflugschar', options: ['sichel', 'pflugschar', 'hammer'], hits: 3 },
      { hint: 'Jetzt der Speer.', item: 'speer', result: 'sichel', options: ['pflugschar', 'hammer', 'sichel'], hits: 3 }
    ]
  }
  const mountIt = (locale: 'de' | 'en' = 'de') => mount(GameForge, { props: { game }, ...opts(locale) })
  const strikeThree = async (w: ReturnType<typeof mountIt>) => {
    for (let i = 0; i < 3; i++) {
      await w.find('.gm-anvil').trigger('click')
      await tick(400)
    }
    await tick(500)
  }

  it('the goal is every blow and every choice (two rounds of 3 + 1); the hint, the anvil and the sword are there', async () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(8)
    expect(w.text()).toContain('Schlage dreimal auf den Amboss.')
    expect(w.find('.gm-anvil').exists()).toBe(true)
    expect(w.find('img.gm-item').attributes('src')).toContain('schwert')
    expect(w.findAll('.gm-option')).toHaveLength(0)
    expect(problems()).toEqual([])
  })

  it('after three blows the metal glows and three tools are offered; the blows count; the hammer swings', async () => {
    const w = mountIt()
    await w.find('.gm-anvil').trigger('click')
    expect(w.find('img.gm-hammer').classes()).toContain('swing')
    await tick(400)
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.findAll('.gm-option')).toHaveLength(0)
    await w.find('.gm-anvil').trigger('click')
    await tick(400)
    await w.find('.gm-anvil').trigger('click')
    await tick(600)
    expect(useTaskProgress().parts.value).toBe(3)
    expect(w.find('img.gm-item').attributes('src')).toContain('glut')
    expect(w.findAll('.gm-option')).toHaveLength(3)
    expect(w.find('.gm-anvil').exists()).toBe(false)
  })

  it('a wrong tool is a mistake (a cross, a word) and the metal stays; the right tool is made and the next round comes', async () => {
    const w = mountIt()
    await strikeThree(w)
    await w.find('button[aria-label="Sichel"]').trigger('click')
    await flushPromises()
    expect(played).toContain('wrong')
    expect(w.text()).toContain('Nicht dieses')
    expect(w.find('.gm-cross').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(3)
    await tick(1000)
    await w.find('button[aria-label="Pflugschar"]').trigger('click')
    await flushPromises()
    expect(useTaskProgress().parts.value).toBe(4)
    expect(w.find('img.gm-item').attributes('src')).toContain('pflugschar')
    expect(w.text()).toContain('Werkzeug für die Felder')
    await tick(2200)
    expect(w.text()).toContain('Jetzt der Speer.')
    expect(w.find('img.gm-item').attributes('src')).toContain('speer')
  })

  it('both rounds and the end', async () => {
    const w = mountIt()
    await strikeThree(w)
    await w.find('button[aria-label="Pflugschar"]').trigger('click')
    await tick(2200)
    await strikeThree(w)
    await w.find('button[aria-label="Sichel"]').trigger('click')
    await flushPromises()
    expect(useTaskProgress().parts.value).toBe(8)
    await tick(2600)
    expect(w.text()).toContain('Aus Schwertern werden Pflugscharen')
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = mountIt('en')
    await strikeThree(w)
    expect(w.text()).toContain('The metal glows')
    expect(problems()).toEqual([])
  })
})
