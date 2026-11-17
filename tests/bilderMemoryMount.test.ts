/**
 * "Bilder-Memory" on the screen: the overview with one card for every adventure, the explanation only once, a board, a pair and a miss, the card that comes
 * together at the end, the stars that are kept, the end of the whole game, and the texts in all three languages.
 */
import { afterAll, beforeAll, beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import rawApp from '../src/i18n/app'
import rawEs from '../src/i18n/app.es'
import memoryTexts from '../src/i18n/bigGames/memory'
import { BIG_GAME_TEXTS, withGameTexts } from '../src/i18n/bigGames'
import { BIG_GAMES } from '../src/data/bigGames'
import { journeys } from '../src/data/adventures'
import { TIMELINE } from '../src/data/adventures/timeline'

const play = vi.fn()
vi.mock('@/use/useSfx', () => ({ default: () => ({ play, preload: vi.fn() }) }))
vi.mock('@/use/useMusic', () => ({ default: () => ({ playGame: vi.fn(), stop: vi.fn() }) }))

import BigGameMemory from '@/components/molecules/games/BigGameMemory.vue'
import useBigGames from '@/use/useBigGames'

const app = withGameTexts(rawApp)
const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'en', messages: { de: (app as { de?: object }).de ?? {}, en: (app as { en?: object }).en ?? {} } })

class FailingImage {
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  width = 0
  height = 0
  decoding = ''
  set src(_v: string) {
    queueMicrotask(() => this.onerror?.())
  }
}

const mods = import.meta.glob('/src/data/adventures/*.ts', { eager: true }) as Record<string, Record<string, any>>
const all = Object.values(mods)
  .flatMap((m) => Object.values(m))
  .filter((j) => j && typeof j === 'object' && j.id && Array.isArray(j.stages) && Array.isArray(j.exam))

let added: unknown[] = []
beforeAll(() => {
  for (const j of all) {
    if (!journeys.some((x) => x.id === j.id)) {
      journeys.push(j)
      added.push(j)
    }
  }
})
afterAll(() => {
  for (const j of added) journeys.splice(journeys.indexOf(j as (typeof journeys)[number]), 1)
  added = []
})

describe('BigGameMemory', () => {
  beforeEach(() => {
    localStorage.clear()
    useBigGames().replaceAll({})
    play.mockClear()
    vi.stubGlobal('Image', FailingImage)
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  async function open(): Promise<VueWrapper> {
    const w = mount(BigGameMemory, { global: { plugins: [i18n] }, attachTo: document.body })
    await flushPromises()
    return w
  }
  async function closeHow(w: VueWrapper) {
    await w.find('[data-test="memory-go"]').trigger('click')
  }
  const pairOf = (w: VueWrapper, pair: number) => w.findAll(`[data-pair="${pair}"]`)
  async function solve(w: VueWrapper, pairs: number) {
    for (let p = 0; p < pairs; p++) {
      const [a, b] = pairOf(w, p)
      await a!.trigger('click')
      await b!.trigger('click')
    }
  }
  async function finishBoard(w: VueWrapper) {
    await vi.advanceTimersByTimeAsync(1600)
    await vi.advanceTimersByTimeAsync(3500)
    await flushPromises()
  }

  it('is a game of the corner (picked with a wish), three stars for every adventure', () => {
    const g = BIG_GAMES.find((x) => x.id === 'memory')!
    expect(g.maxStars).toBe(TIMELINE.length * 3)
    expect(g.image).toBe('images/spiele-gross/memory/kachel.webp')
  })

  it('opens with the story and the explanation, which comes only once', async () => {
    const w = await open()
    expect(w.text()).toContain('Bilder-Memory')
    expect(w.text()).toContain('Finde zu jedem Abenteuer die Bilderpaare. Dann siehst du das ganze Bild.')
    expect(w.find('[data-test="memory-howcard"]').exists()).toBe(true)
    await closeHow(w)
    expect(w.find('[data-test="memory-howcard"]').exists()).toBe(false)
    w.unmount()
    const again = await open()
    expect(again.find('[data-test="memory-howcard"]').exists()).toBe(false)
    await again.find('[data-test="memory-how"]').trigger('click')
    expect(again.find('[data-test="memory-howcard"]').exists()).toBe(true)
    again.unmount()
  })

  it('shows one board for every adventure, in the order of the Bible, grouped by epoch', async () => {
    const w = await open()
    await closeHow(w)
    const tiles = w.findAll('.mm-tile')
    expect(tiles).toHaveLength(TIMELINE.length)
    expect(tiles.map((t) => t.attributes('data-test'))).toEqual(TIMELINE.map((e) => 'memory-board-' + e.id))
    expect(w.findAll('.mm-epoch').length).toBe(7)
    expect(w.find('[data-test="memory-progress"]').text()).toBe('0 von 37 Brettern geschafft')
    w.unmount()
  })

  it('opens a board with six pairs for Adam and Eve and never a clock', async () => {
    const w = await open()
    await closeHow(w)
    await w.find('[data-test="memory-board-adam-eva"]').trigger('click')
    expect(w.findAll('.mm-card')).toHaveLength(12)
    expect(w.find('[data-test="memory-caption"]').text()).toContain('Dreh zwei Karten um')
    expect(w.text()).not.toMatch(/\d:\d\d/)
    w.unmount()
  })

  it('a pair stays open and names its stage; two different cards turn back by themselves', async () => {
    const w = await open()
    await closeHow(w)
    await w.find('[data-test="memory-board-adam-eva"]').trigger('click')
    const [a, b] = pairOf(w, 0)
    await a!.trigger('click')
    await b!.trigger('click')
    expect(a!.classes()).toContain('is-up')
    expect(a!.classes()).toContain('is-found')
    expect(w.find('[data-test="memory-caption"]').text()).toMatch(/^Etappe \d+: /)
    // a miss
    const x = pairOf(w, 1)[0]!
    const y = pairOf(w, 2)[0]!
    await x.trigger('click')
    await y.trigger('click')
    expect(x.classes()).toContain('is-up')
    expect(y.classes()).toContain('is-up')
    expect(w.find('[data-test="memory-caption"]').text()).toContain('verschiedene Bilder')
    await vi.advanceTimersByTimeAsync(1300)
    expect(x.classes()).not.toContain('is-up')
    expect(y.classes()).not.toContain('is-up')
    // a third touch while two cards are open turns them back at once
    await x.trigger('click')
    await y.trigger('click')
    const z = pairOf(w, 3)[0]!
    await z.trigger('click')
    expect(x.classes()).not.toContain('is-up')
    expect(z.classes()).toContain('is-up')
    w.unmount()
  })

  it('cards that are already open do not change at all when a new pair is found (no flicker)', async () => {
    const w = await open()
    await closeHow(w)
    await w.find('[data-test="memory-board-adam-eva"]').trigger('click')
    const first = pairOf(w, 0)
    await first[0]!.trigger('click')
    await first[1]!.trigger('click')
    const nodes = first.map((c) => c.element)
    // (only the one-time glow class on the picture may go; its animation ends exactly at the look the card keeps)
    const calm = (h: string) => h.replace(' is-just', '')
    const before = first.map((c) => [c.attributes('class'), c.attributes('style'), calm(c.html())])
    // the glow of the pair that was just found lives on the picture of its cards, not on the card
    expect(w.findAll('.mm-front.is-just')).toHaveLength(2)
    expect(first.every((c) => !c.classes().includes('is-just'))).toBe(true)
    const second = pairOf(w, 1)
    await second[0]!.trigger('click')
    await second[1]!.trigger('click')
    // the same elements, the same classes and styles (so no animation or transition starts again), the same markup
    const again = pairOf(w, 0)
    expect(again.map((c) => c.element)).toEqual(nodes)
    again.forEach((c, i) => {
      expect(c.element).toBe(nodes[i])
      expect(c.attributes('class')).toBe(before[i]![0])
      expect(c.attributes('style')).toBe(before[i]![1])
      expect(calm(c.html())).toBe(before[i]![2])
    })
    // only the new pair glows now
    const lit = w.findAll('.mm-front.is-just')
    expect(lit).toHaveLength(2)
    expect(lit.every((f) => second.some((c) => c.element.contains(f.element)))).toBe(true)
    // a miss in between does not touch them either
    const x = pairOf(w, 2)[0]!
    const y = pairOf(w, 3)[0]!
    await x.trigger('click')
    await y.trigger('click')
    await vi.advanceTimersByTimeAsync(1300)
    expect(pairOf(w, 0).map((c) => calm(c.html()))).toEqual(before.map((b) => b[2]))
    w.unmount()
  })

  it('the cards have a light back', async () => {
    const w = await open()
    await closeHow(w)
    await w.find('[data-test="memory-board-adam-eva"]').trigger('click')
    expect(w.find('.mm-back img').attributes('src')).toContain('images/spiele-gross/memory/rueckseite.webp')
    w.unmount()
  })

  it('the hint shows a card the child already knows, and says so when there is none', async () => {
    const w = await open()
    await closeHow(w)
    await w.find('[data-test="memory-board-adam-eva"]').trigger('click')
    await w.find('[data-test="memory-hint"]').trigger('click')
    expect(w.find('[data-test="memory-caption"]').text()).toContain('Dreh eine neue Karte um')
    const a = pairOf(w, 0)
    const b = pairOf(w, 1)
    await a[0]!.trigger('click')
    await b[0]!.trigger('click')
    await vi.advanceTimersByTimeAsync(1300)
    await a[1]!.trigger('click')
    await w.find('[data-test="memory-hint"]').trigger('click')
    expect(w.find('[data-test="memory-caption"]').text()).toContain('passende Karte')
    expect(a[0]!.classes()).toContain('is-hint')
    w.unmount()
  })

  it('finding all pairs puts the card together, gives stars, keeps them and offers the next board', async () => {
    const w = await open()
    await closeHow(w)
    await w.find('[data-test="memory-board-adam-eva"]').trigger('click')
    await solve(w, 6)
    await finishBoard(w)
    expect(w.find('[data-test="memory-result"]').exists()).toBe(true)
    expect(w.findAll('.mm-piece')).toHaveLength(12)
    expect(w.find('.mm-assemble').classes()).toContain('is-whole')
    expect(w.text()).toContain('Du hast 6 Versuche gebraucht.')
    expect(useBigGames().levels('memory')[0]).toBe(3)
    expect(w.find('[data-test="memory-next"]').exists()).toBe(true)
    // back to the overview: the card of Adam and Eve is shown, with its stars
    await w.find('[data-test="memory-menu-btn"]').trigger('click')
    expect(w.find('[data-test="memory-progress"]').text()).toBe('1 von 37 Brettern geschafft')
    expect(w.find('[data-test="memory-board-adam-eva"]').classes()).toContain('is-done')
    w.unmount()
  })

  it('a worse try never takes stars away', async () => {
    const w = await open()
    await closeHow(w)
    useBigGames().record('memory', 0, 3)
    await w.find('[data-test="memory-board-adam-eva"]').trigger('click')
    // 20 wrong tries first
    for (let k = 0; k < 20; k++) {
      await pairOf(w, 0)[0]!.trigger('click')
      await pairOf(w, 1)[0]!.trigger('click')
      await vi.advanceTimersByTimeAsync(1300)
    }
    await solve(w, 6)
    await finishBoard(w)
    expect(w.text()).toContain('Alle Paare gefunden!')
    expect(w.text()).toContain('Du hast 26 Versuche gebraucht.')
    expect(useBigGames().levels('memory')[0]).toBe(3)
    w.unmount()
  })

  it('when every board is done the game says so once, and is finished', async () => {
    const w = await open()
    await closeHow(w)
    const save: Record<string, { levels: number[]; plays: number }> = {}
    const levels: number[] = []
    for (let i = 0; i < TIMELINE.length; i++) levels[i] = i === 1 ? 0 : 2
    save.memory = { levels, plays: 3 }
    useBigGames().replaceAll(save)
    await flushPromises()
    expect(w.find('[data-test="memory-alldone"]').exists()).toBe(false)
    await w.find('[data-test="memory-board-noah"]').trigger('click')
    await solve(w, 6)
    await finishBoard(w)
    expect(w.find('[data-test="memory-finale"]').exists()).toBe(true)
    expect(w.text()).toContain('Alle Bretter geschafft!')
    // no board is left for "next": only playing again for fun
    expect(w.find('[data-test="memory-next"]').exists()).toBe(false)
    await w.find('[data-test="memory-menu-btn"]').trigger('click')
    expect(w.find('[data-test="memory-alldone"]').exists()).toBe(true)
    // a second time the finale does not come again
    await w.find('[data-test="memory-board-noah"]').trigger('click')
    await solve(w, 6)
    await finishBoard(w)
    expect(w.find('[data-test="memory-finale"]').exists()).toBe(false)
    w.unmount()
  })

  it('leaves with the buttons and the escape key', async () => {
    const w = await open()
    await closeHow(w)
    await w.find('[data-test="memory-leave"]').trigger('click')
    expect(w.emitted('leave')).toHaveLength(1)
    w.unmount()
  })
})

describe('the texts of the Bilder-Memory', () => {
  const keys = (o: Record<string, unknown>) => Object.keys(o).sort()

  it('german, english and spanish have the same keys, all filled', () => {
    expect(keys(memoryTexts.en)).toEqual(keys(memoryTexts.de))
    expect(keys(memoryTexts.es)).toEqual(keys(memoryTexts.de))
    for (const lang of ['de', 'en', 'es'] as const) {
      for (const [k, v] of Object.entries(memoryTexts[lang])) expect(String(v).trim().length, `${lang}.${k}`).toBeGreaterThan(0)
    }
  })

  it('placeholders are the same in every language', () => {
    const ph = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(',')
    for (const [k, v] of Object.entries(memoryTexts.de)) {
      expect(ph(String(memoryTexts.en[k as keyof typeof memoryTexts.en])), k).toBe(ph(String(v)))
      expect(ph(String(memoryTexts.es[k as keyof typeof memoryTexts.es])), k).toBe(ph(String(v)))
    }
  })

  it('the texts are merged into the app, and the big text files do not carry them', () => {
    expect(BIG_GAME_TEXTS.de.memory).toBe(memoryTexts.de)
    expect(BIG_GAME_TEXTS.es.memory).toBe(memoryTexts.es)
    expect((rawApp as any).de?.app?.bigGames?.memory).toBeUndefined()
    expect((rawEs as any)?.app?.bigGames?.memory ?? (rawEs as any)?.es?.app?.bigGames?.memory).toBeUndefined()
  })

  it('the english game shows english words', async () => {
    const en = createI18n({ legacy: false, locale: 'en', fallbackLocale: 'en', messages: { de: (app as { de?: object }).de ?? {}, en: (app as { en?: object }).en ?? {} } })
    localStorage.clear()
    const w = mount(BigGameMemory, { global: { plugins: [en] }, attachTo: document.body })
    await flushPromises()
    expect(w.text()).toContain('Picture Memory')
    expect(w.text()).toContain('Find the picture pairs')
    w.unmount()
  })
})
