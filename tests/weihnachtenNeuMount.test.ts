/**
 * The four new games of "Weihnachten" (Antons Regel 5.11.2026), mounted with the real data of the adventure and played through:
 * "The census" (`zaehlung` = GameZaehlung), "The shepherds' fire" (`hirtenfeuer` = GameHirtenfeuer), "Spread the word" (`weitersagen` = GameWeitersagen) and "Follow the star" (`stern` = GameStern).
 * The tap, the drag with the finger, the keyboard, the mistakes (a cross, a word, a low tone), "Help me" after fifteen seconds, the two rounds, the goal for "Go on" (`useTaskProgress`), the less motion,
 * the end with its stars and the words of the Bible in German, English and Spanish. The new words are mixed into the messages of the app here (they come from the file for the leadership,
 * `D:/Claude/Spiele-Neu/weihnachten/INTEGRATION.json`), so that the test does not wait for them to be in `i18n/app.ts`.
 */
import { readFileSync } from 'node:fs'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { weihnachten } from '@/data/adventures/weihnachten'
import messages from '@/i18n/app'
import spanish from '@/i18n/app.es'
import useTaskProgress from '@/use/useTaskProgress'
import GameHirtenfeuer from '@/components/molecules/games/GameHirtenfeuer.vue'
import GameStern from '@/components/molecules/games/GameStern.vue'
import GameWeitersagen from '@/components/molecules/games/GameWeitersagen.vue'
import GameZaehlung from '@/components/molecules/games/GameZaehlung.vue'
import { partialStars } from '@/utils/adventureScore'
import { osterStars } from '@/utils/osternGames'
import { TELL_RATIO, TELL_SPRITE, tellPoints, tellSolve, tellTry, wnNeighbour } from '@/utils/weihnachtenNeu'
import type { CensusGame, FireGame, StarGame, TellGame } from '@/utils/weihnachtenNeu'

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

const NEW = (JSON.parse(readFileSync('D:/Claude/Spiele-Neu/weihnachten/INTEGRATION.json', 'utf-8')) as { i18n: Record<'de' | 'en' | 'es', Record<string, string>> }).i18n

type Tree = Record<string, Record<string, { adventure: Record<string, unknown> } & Record<string, unknown>>>
/** The messages of the app with the new words mixed into `app.adventure` (German, English, Spanish). */
function allMessages() {
  const base = { ...(messages as unknown as Tree), ...(spanish as unknown as Tree) }
  const out: Record<string, unknown> = {}
  for (const lang of ['de', 'en', 'es'] as const) {
    const app = base[lang]!.app!
    out[lang] = { ...base[lang], app: { ...app, adventure: { ...app.adventure, ...NEW[lang] } } }
  }
  return out
}
const MESSAGES = allMessages()
const mk = (locale: 'de' | 'en' | 'es') => createI18n({ legacy: false, locale, fallbackLocale: 'de', messages: MESSAGES as never, missingWarn: false, fallbackWarn: false })
const opts = (locale: 'de' | 'en' | 'es' = 'de') => ({ global: { plugins: [mk(locale)], stubs: { RouterLink: true } }, attachTo: document.body })

let warnings: string[] = []
const boxes = new WeakMap<Element, { left: number; top: number; right: number; bottom: number }>()
const box = (left: number, top: number, w: number, h: number) => ({ left, top, right: left + w, bottom: top + h, width: w, height: h, x: left, y: top, toJSON: () => ({}) })
const originalMatchMedia = window.matchMedia
beforeEach(() => {
  played.length = 0
  warnings = []
  useTaskProgress().reset()
  vi.useFakeTimers()
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const b = boxes.get(this)
    return (b ? box(b.left, b.top, b.right - b.left, b.bottom - b.top) : box(0, 0, 100, 100)) as DOMRect
  })
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
  window.matchMedia = originalMatchMedia
})
const problems = () => warnings.filter((w) => /not defined on instance|is not a function|Unhandled error|ERROR|Missing required prop|Not found/.test(w))
const tick = async (ms: number) => {
  await vi.advanceTimersByTimeAsync(ms)
  await flushPromises()
}
const count = (name: string) => played.filter((p) => p === name).length
const pointer = (el: Element | Window, type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel', x = 0, y = 0) =>
  el.dispatchEvent(new MouseEvent(type, { bubbles: true, button: 0, buttons: type === 'pointerup' ? 0 : 1, clientX: x, clientY: y }))
const stage = (n: number) => weihnachten.stages[n - 1]!
const task = <T,>(n: number, field: string): T => (stage(n).task as unknown as Record<string, T>)[field]!
const adv = async (w: { find: (s: string) => { trigger: (e: string) => Promise<void> } }) => w.find('button.adv-btn').trigger('click')

// ================================================================ 1. the census
describe('Die Zählung (zaehlung)', () => {
  const G = () => task<CensusGame>(4, 'census')
  const W = 200
  const H = 300
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => {
    const w = mount(GameZaehlung, { props: { game: G() }, ...opts(locale) })
    boxes.set(w.find('.gm-field').element, { left: 0, top: 0, right: W, bottom: H })
    return w
  }
  type Wr = ReturnType<typeof mountIt>
  const town = (w: Wr, id: string) => w.find(`[data-town="${id}"]`)
  /** The traveler on the card. */
  const now = (w: Wr) => w.find('.gm-person')
  const nowName = (w: Wr) => w.find('.gm-pname').text()
  const at = (id: string) => {
    const t = G().towns.find((x) => x.id === id)!
    return { x: (t.x / 100) * W, y: (t.y / 100) * H }
  }
  /** All travelers of a round, each to his town by a tap. */
  const bringAll = async (w: Wr, ri: number) => {
    for (const p of G().rounds[ri]!.people) await town(w, p.town).trigger('click')
  }

  it('six towns with their names on the map, the first traveler on the card with his clue, round 1 of 2, the goal is every traveler of both rounds (11)', () => {
    const w = mountIt()
    expect(w.findAll('.gm-town')).toHaveLength(6)
    expect(w.findAll('.gm-name').map((n) => n.text())).toEqual(['Kapernaum', 'Nazareth', 'Jerusalem', 'Jericho', 'Bethlehem', 'Hebron'])
    expect(nowName(w)).toBe('Josef')
    expect(w.find('.gm-clue').text()).toBe('Er ist aus dem Haus Davids. Er geht nach Bethlehem.')
    expect(w.find('.gm-ask').text()).toContain('Zu welcher Stadt gehört das?')
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.text()).toContain('Angekommen: 0 von 4')
    expect(useTaskProgress().goal.value).toBe(11)
    expect(w.find('.gm-field').attributes('aria-label')).toContain('sechs Städten')
    expect(now(w).attributes('aria-label')).toContain('Josef. Er ist aus dem Haus Davids')
    expect(w.find('.gm-fb').attributes('role')).toBe('status')
    expect(w.find('svg').exists()).toBe(false)
    expect(problems()).toEqual([])
  })

  it('a wrong town: a cross, a word, a low tone, the traveler stays on the card; the right town: he stands there, a tick, a click, one part for "Go on", the next one comes', async () => {
    const w = mountIt()
    await town(w, 'jericho').trigger('click')
    expect(town(w, 'jericho').find('.gm-mark').text()).toBe('✕')
    expect(w.text()).toContain('Jericho ist nicht die Heimatstadt von Josef.')
    expect(count('wrong')).toBe(1)
    expect(nowName(w)).toBe('Josef')
    expect(w.findAll('.gm-stand')).toHaveLength(0)
    await town(w, 'bethlehem').trigger('click')
    expect(w.findAll('.gm-stand')).toHaveLength(1)
    expect(nowName(w)).toBe('Maria')
    expect(w.text()).toContain('Josef ist in Bethlehem angekommen.')
    expect(count('snap')).toBe(1)
    expect(town(w, 'bethlehem').find('.gm-mark').text()).toBe('✓')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.text()).toContain('Angekommen: 1 von 4')
    await tick(1300)
    expect(town(w, 'bethlehem').find('.gm-mark').exists()).toBe(false)
  })

  it('two travelers in one town stand side by side', async () => {
    const w = mountIt()
    await town(w, 'bethlehem').trigger('click')
    await town(w, 'bethlehem').trigger('click')
    const xs = w.findAll('.gm-stand').map((s) => parseFloat((s.element as HTMLElement).style.left))
    expect(xs).toHaveLength(2)
    expect(xs[1]!).toBeGreaterThan(xs[0]!)
  })

  it('a drag of the card with the finger: it follows the finger and is let go over a town; over open ground only a word (no mistake); a tap without a move only says what to do', async () => {
    const w = mountIt()
    pointer(now(w).element, 'pointerdown', 20, 40)
    pointer(window, 'pointermove', 60, 100)
    await flushPromises()
    expect(w.find('.gm-ghost').exists()).toBe(true)
    pointer(window, 'pointerup', 5, 5)
    await flushPromises()
    expect(w.find('.gm-ghost').exists()).toBe(false)
    expect(w.find('.gm-fb').text()).toContain('Lass den Reisenden über einer Stadt los')
    expect(count('wrong')).toBe(0)
    expect(nowName(w)).toBe('Josef')
    // to a wrong town: a mistake
    const hebron = at('hebron')
    pointer(now(w).element, 'pointerdown', 20, 40)
    pointer(window, 'pointermove', 60, 100)
    pointer(window, 'pointerup', hebron.x + 3, hebron.y + 2)
    await flushPromises()
    expect(w.text()).toContain('Hebron ist nicht die Heimatstadt von Josef.')
    expect(count('wrong')).toBe(1)
    // to the right one
    const b = at('bethlehem')
    pointer(now(w).element, 'pointerdown', 20, 40)
    pointer(window, 'pointermove', 60, 100)
    pointer(window, 'pointerup', b.x - 4, b.y + 3)
    await flushPromises()
    expect(nowName(w)).toBe('Maria')
    expect(w.text()).toContain('Josef ist in Bethlehem angekommen.')
    // a pointer tap (no move) on the card
    pointer(now(w).element, 'pointerdown', 20, 40)
    pointer(window, 'pointerup', 21, 41)
    await flushPromises()
    expect(w.find('.gm-fb').text()).toContain('Zu welcher Stadt gehört das?')
    expect(nowName(w)).toBe('Maria')
    expect(problems()).toEqual([])
  })

  it('the keyboard: the arrow keys go from town to town, Enter on a town (a click without a pointer) brings the traveler', async () => {
    const w = mountIt()
    const towns = G().towns
    const start = towns.findIndex((t) => t.id === 'jerusalem')
    ;(w.findAll('.gm-town')[start]!.element as HTMLElement).focus()
    await w.findAll('.gm-town')[start]!.trigger('keydown', { key: 'ArrowDown' })
    const next = wnNeighbour(towns, start, 0, 1, 2 / 3)
    expect(next).not.toBe(start)
    expect(document.activeElement).toBe(w.findAll('.gm-town')[next]!.element)
    await w.find('[data-town="bethlehem"]').trigger('keydown', { key: 'Enter' })
    expect(w.findAll('.gm-stand')).toHaveLength(1)
    expect(nowName(w)).toBe('Maria')
    await now(w).trigger('click')
    expect(w.find('.gm-fb').text()).toContain('Zu welcher Stadt gehört das?')
    expect(w.findAll('.gm-town').every((b) => b.attributes('aria-label')!.length > 3)).toBe(true)
  })

  it('a button "Hilf mir" shows after fifteen seconds: it rings the town of the traveler on the card', async () => {
    const w = mountIt()
    expect(w.text()).not.toContain('Hilf mir')
    await tick(15600)
    const btn = w.findAll('button').find((b) => b.text() === 'Hilf mir')!
    expect(btn).toBeTruthy()
    await btn.trigger('click')
    expect(town(w, 'bethlehem').classes()).toContain('hint')
    expect(w.text()).toContain('Bring Josef nach Bethlehem.')
    expect(w.text()).not.toContain('Hilf mir')
    await town(w, 'bethlehem').trigger('click')
    expect(town(w, 'bethlehem').classes()).not.toContain('hint')
  })

  it('both rounds: round 2 brings seven travelers with clues of the land; at the end the stars and the words of the Bible; "Go on" gets every part', async () => {
    const w = mountIt()
    await bringAll(w, 0)
    expect(w.text()).toContain('Alle Reisenden sind in ihrer Stadt angekommen!')
    await tick(300)
    expect(played).toContain('right')
    expect(useTaskProgress().parts.value).toBe(4)
    await tick(2900)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.findAll('.gm-stand')).toHaveLength(0)
    expect(nowName(w)).toBe('Josef')
    expect(w.find('.gm-clue').text()).toContain('Stadt Davids')
    expect(partialStars(useTaskProgress().parts.value, useTaskProgress().goal.value)).toBeGreaterThanOrEqual(1)
    // one mistake in round 2
    await town(w, 'hebron').trigger('click')
    await bringAll(w, 1)
    expect(w.text()).toContain('Alle Reisenden sind in ihrer Stadt angekommen!')
    await tick(2300)
    expect(played).toContain('star')
    expect(w.text()).toContain('ein jeglicher in seine Stadt')
    expect(useTaskProgress().finished.value).toBe(true)
    expect(useTaskProgress().parts.value).toBe(11)
    await adv(w)
    expect(w.emitted('done')![0]).toEqual([3])
    expect(problems()).toEqual([])
  })

  it('five mistakes: one star', async () => {
    const w = mountIt()
    for (let k = 0; k < 5; k++) await town(w, 'hebron').trigger('click')
    expect(count('wrong')).toBe(5)
    await bringAll(w, 0)
    await tick(2900)
    await bringAll(w, 1)
    await tick(2300)
    await adv(w)
    expect(w.emitted('done')![0]).toEqual([osterStars(5)])
    expect(osterStars(5)).toBe(1)
  })

  it('English and Spanish words (the verse of the end: KJV and Reina-Valera)', async () => {
    for (const [loc, bible, ready] of [['en', 'every one into his own city', 'Arrived: 0 of 4'], ['es', 'cada uno a su ciudad', 'Han llegado: 0 de 4']] as const) {
      const w = mountIt(loc)
      expect(w.text()).toContain(ready)
      await bringAll(w, 0)
      await tick(2900)
      await bringAll(w, 1)
      await tick(2300)
      expect(w.text()).toContain(bible)
      w.unmount()
      useTaskProgress().reset()
      played.length = 0
    }
    expect(problems()).toEqual([])
  })
})

// ================================================================ 2. the shepherds' fire
describe('Das Hirtenfeuer (hirtenfeuer)', () => {
  const G = () => task<FireGame>(6, 'fire')
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameHirtenfeuer, { props: { game: G() }, ...opts(locale) })
  type Wr = ReturnType<typeof mountIt>
  const fires = (w: Wr) => w.findAll('.gm-fire')
  const needy = (w: Wr) => fires(w).filter((f) => f.classes().includes('needs'))
  /** A perfect player: taps every fire as soon as it is small, until the end of the game. */
  const playPerfect = async (w: Wr, maxSeconds: number, until: string) => {
    for (let i = 0; i < maxSeconds * 10 && !w.text().includes(until); i++) {
      await tick(100)
      for (const f of needy(w)) await f.trigger('click')
    }
  }

  it('one fire in round 1: big, a word for its size, the moon in the sky, the goal is every feed of both rounds (12)', () => {
    const w = mountIt()
    expect(fires(w)).toHaveLength(1)
    expect(fires(w)[0]!.attributes('aria-label')).toContain('groß')
    expect(fires(w)[0]!.find('.gm-state').text()).toBe('groß')
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.text()).toContain('Holz nachgelegt: 0 von 4')
    expect(useTaskProgress().goal.value).toBe(12)
    expect(w.find('.gm-moon').exists()).toBe(true)
    expect(w.find('.gm-field').attributes('aria-label')).toContain('Feuer')
    expect(w.find('svg').exists()).toBe(false)
    expect(w.find('.gm-fb').attributes('role')).toBe('status')
    expect(problems()).toEqual([])
  })

  it('wood laid on too early is wasted: a cross, a word, a low tone, no part, a mistake', async () => {
    const w = mountIt()
    await fires(w)[0]!.trigger('click')
    expect(w.text()).toContain('Es brennt noch hell. Warte, bis es klein wird.')
    expect(w.find('.gm-fire .gm-mark').text()).toBe('✕')
    expect(count('wrong')).toBe(1)
    expect(useTaskProgress().parts.value).toBe(0)
    expect(w.text()).toContain('Holz nachgelegt: 0 von 4')
  })

  it('the fire burns down by itself: the picture and the word change, a small bundle of wood says "now"; then the wood is right', async () => {
    const w = mountIt()
    const first = fires(w)[0]!.find('img').attributes('src')
    await tick(4000)
    expect(fires(w)[0]!.find('.gm-state').text()).toBe('mittel')
    expect(fires(w)[0]!.find('img').attributes('src')).not.toBe(first)
    expect(needy(w)).toHaveLength(0)
    await tick(2200)
    expect(needy(w)).toHaveLength(1)
    expect(fires(w)[0]!.find('.gm-state').text()).toBe('klein')
    expect(fires(w)[0]!.find('.gm-cue').exists()).toBe(true)
    expect(fires(w)[0]!.attributes('aria-label')).toContain('Jetzt Holz nachlegen!')
    await fires(w)[0]!.trigger('click')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(count('bead')).toBe(1)
    expect(w.find('.gm-wood').exists()).toBe(true)
    expect(w.find('.gm-fire .gm-mark').text()).toBe('✓')
    expect(fires(w)[0]!.find('.gm-state').text()).toBe('groß')
    expect(fires(w)[0]!.classes()).not.toContain('needs')
    expect(w.text()).toContain('Holz nachgelegt: 1 von 4')
    await tick(900)
    expect(w.find('.gm-wood').exists()).toBe(false)
  })

  it('the moon goes on while the wood is laid on', async () => {
    const w = mountIt()
    const x0 = parseFloat((w.find('.gm-moon').element as HTMLElement).style.left)
    await tick(6200)
    await fires(w)[0]!.trigger('click')
    const x1 = parseFloat((w.find('.gm-moon').element as HTMLElement).style.left)
    expect(x1).toBeGreaterThan(x0)
  })

  it('a fire that goes out is a mistake (once): it is dark for a moment, the shepherds light it again, small', async () => {
    const w = mountIt()
    await tick(11200)
    expect(w.text()).toContain('Das Feuer ist ausgegangen!')
    expect(fires(w)[0]!.find('.gm-state').text()).toBe('aus')
    expect(fires(w)[0]!.classes()).toContain('out')
    expect(count('wrong')).toBe(1)
    await fires(w)[0]!.trigger('click')
    expect(w.text()).toContain('Das Feuer ist aus. Die Hirten zünden es gleich wieder an.')
    expect(useTaskProgress().parts.value).toBe(0)
    await tick(1300)
    expect(w.text()).toContain('Die Hirten haben das Feuer wieder angezündet.')
    expect(fires(w)[0]!.find('.gm-state').text()).toBe('klein')
    expect(count('wrong')).toBe(1)
  })

  it('a button "Hilf mir" shows after fifteen seconds: the fire that needs wood most gets it; when all burn bright it only says to wait', async () => {
    const w = mountIt()
    expect(w.text()).not.toContain('Hilf mir')
    await tick(15600)
    const btn = w.findAll('button').find((b) => b.text() === 'Hilf mir')!
    expect(btn).toBeTruthy()
    await btn.trigger('click')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.text()).not.toContain('Hilf mir')
    // right after the wood all burns bright: after fifteen seconds without a tap the fire needs wood again, so the help works
    await tick(15600)
    const again = w.findAll('button').find((b) => b.text() === 'Hilf mir')
    expect(again).toBeTruthy()
  })

  it('the arrow keys go from fire to fire in round 2 (two fires)', async () => {
    const w = mountIt()
    await playPerfect(w, 60, 'Das Feuer brennt weiter. Gut gemacht!')
    // round 1 is over: wait for round 2
    expect(w.text()).toContain('Das Feuer brennt weiter. Gut gemacht!')
    await tick(2900)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(fires(w)).toHaveLength(2)
    ;(fires(w)[0]!.element as HTMLElement).focus()
    await fires(w)[0]!.trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement).toBe(fires(w)[1]!.element)
    await fires(w)[1]!.trigger('keydown', { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(fires(w)[0]!.element)
  })

  it('a perfect player wins both rounds with three stars; the words of the Bible; "Go on" gets every feed', async () => {
    const w = mountIt()
    await playPerfect(w, 60, 'Das Feuer brennt weiter. Gut gemacht!')
    expect(w.text()).toContain('Das Feuer brennt weiter. Gut gemacht!')
    expect(useTaskProgress().parts.value).toBe(4)
    await tick(2900)
    expect(w.text()).toContain('Runde 2 von 2')
    await playPerfect(w, 120, 'Das Feuer brennt weiter. Gut gemacht!')
    await tick(2300)
    expect(played).toContain('star')
    expect(w.text()).toContain('hüteten des Nachts ihre Herde')
    expect(useTaskProgress().finished.value).toBe(true)
    expect(useTaskProgress().parts.value).toBe(12)
    await adv(w)
    expect(w.emitted('done')![0]).toEqual([3])
    expect(count('wrong')).toBe(0)
    expect(problems()).toEqual([])
  })

  it('English and Spanish words', async () => {
    for (const [loc, text] of [['en', 'Wood laid on: 0 of 4'], ['es', 'Leña echada: 0 de 4']] as const) {
      const w = mountIt(loc)
      expect(w.text()).toContain(text)
      expect(fires(w)[0]!.find('.gm-state').text()).toBe(loc === 'en' ? 'big' : 'grande')
      w.unmount()
    }
  })
})

// ================================================================ 3. spread the word
describe('Weitersagen (weitersagen)', () => {
  const G = () => task<TellGame>(7, 'tell')
  const W = 400
  const H = 300
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => {
    const w = mount(GameWeitersagen, { props: { game: G() }, ...opts(locale) })
    boxes.set(w.find('.gm-field').element, { left: 0, top: 0, right: W, bottom: H })
    return w
  }
  type Wr = ReturnType<typeof mountIt>
  const pts = (ri: number) => tellPoints(G().rounds[ri]!)
  /** The middle of the picture of place `i` of round `ri`, in pixels of the field. */
  const mid = (ri: number, i: number) => {
    const h = pts(ri)[i]!
    return { x: (h.x / 100) * W, y: ((h.y - ((h.w / TELL_SPRITE) * TELL_RATIO) / 2) / 100) * H }
  }
  /** The way of a tap: the finger goes down and up on the house. */
  const tap = async (w: Wr, ri: number, i: number) => {
    const p = mid(ri, i)
    pointer(w.find('.gm-field').element, 'pointerdown', p.x, p.y)
    pointer(window, 'pointerup', p.x + 1, p.y + 1)
    await flushPromises()
  }
  const walkerAt = (w: Wr) => {
    const s = (w.find('.gm-walker').element as HTMLElement).style
    return { x: parseFloat(s.left), y: parseFloat(s.top) }
  }
  /** Where the shepherds stand at place `i`: at the lower right corner of the house, inside the picture. */
  const spot = (ri: number, i: number) => {
    const h = pts(ri)[i]!
    return { x: Math.min(100 - G().walkerW / 2, h.x + h.w * 0.36), y: Math.min(100, h.y + 1.5) }
  }
  const solveRound = async (w: Wr, ri: number) => {
    for (const j of tellSolve(pts(ri), [0])!) await tap(w, ri, j)
  }

  it('the village, the shelter and the houses, the shepherds at the shelter, round 1 of 2; the goal is every house of both rounds', () => {
    const w = mountIt()
    const g = G()
    expect(w.findAll('.gm-house')).toHaveLength(g.rounds[0]!.houses.length + 1)
    expect(w.find('.gm-house.start').exists()).toBe(true)
    expect(walkerAt(w).x).toBeCloseTo(spot(0, 0).x, 5)
    expect(walkerAt(w).y).toBeCloseTo(spot(0, 0).y, 5)
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.text()).toContain(`Gehört haben es: 0 von ${g.rounds[0]!.houses.length}`)
    expect(useTaskProgress().goal.value).toBe(g.rounds.reduce((n, r) => n + r.houses.length, 0))
    expect(w.find('.gm-field').attributes('tabindex')).toBe('0')
    expect(w.find('svg').exists()).toBe(false)
    expect(w.findAll('.gm-way')).toHaveLength(0)
    expect(w.text()).not.toContain('Weg zurück')
    expect(problems()).toEqual([])
  })

  it('a tap on a free house: the shepherds go there, a path is laid (a picture strip), a tick, a click, one part for "Go on"', async () => {
    const w = mountIt()
    const route = tellSolve(pts(0), [0])!
    await tap(w, 0, route[0]!)
    expect(w.findAll('.gm-way')).toHaveLength(1)
    expect(w.find('.gm-way').attributes('style')).toContain('pfad.webp')
    expect(walkerAt(w).x).toBeCloseTo(spot(0, route[0]!).x, 5)
    expect(count('bead')).toBe(1)
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.find(`[data-place="${route[0]}"] .gm-tick`).exists()).toBe(true)
    expect(w.find('.gm-mark').text()).toBe('✓')
    expect(w.text()).toContain('Sie haben es gehört!')
    expect(w.text()).toContain('Weg zurück')
    // a house that has heard it already: only a word
    await tap(w, 0, route[0]!)
    expect(count('wrong')).toBe(0)
    await tap(w, 0, 0)
    expect(w.text()).toContain('hat es schon gehört.')
    expect(count('wrong')).toBe(0)
  })

  it('a way through the door of another house is a mistake: a cross, a word, a low tone, the shepherds stay', async () => {
    const w = mountIt()
    const p = pts(0)
    const j = p.findIndex((_, k) => k > 0 && tellTry(p, [0], k).kind === 'house')
    expect(j, 'round 1 must have a way that runs through another door').toBeGreaterThan(0)
    await tap(w, 0, j)
    expect(count('wrong')).toBe(1)
    expect(w.find('.gm-mark').text()).toBe('✕')
    expect(w.text()).toContain('Der Weg geht durch die Tür von:')
    expect(w.findAll('.gm-way')).toHaveLength(0)
    expect(walkerAt(w).x).toBeCloseTo(spot(0, 0).x, 5)
    expect(useTaskProgress().parts.value).toBe(0)
  })

  it('a path that crosses another path is a mistake (a cross where they would meet); "Take back" lets the shepherds go one house back, no mistake, and no part is counted twice', async () => {
    const w = mountIt()
    // find in the solver tree of round 2 a route and a house where the way would cross
    const p = pts(1)
    let found: { route: number[]; j: number } | null = null
    const search = (route: number[]) => {
      if (found || route.length > 4) return
      for (let j = 1; j < p.length; j++) {
        if (route.includes(j)) continue
        const v = tellTry(p, route, j)
        if (v.kind === 'cross') {
          found = { route, j }
          return
        }
        if (v.kind === 'ok') search([...route, j])
      }
    }
    search([0])
    expect(found, 'round 2 must have a crossing').not.toBeNull()
    // play round 1 first
    await solveRound(w, 0)
    await tick(2900)
    expect(w.text()).toContain('Runde 2 von 2')
    boxes.set(w.find('.gm-field').element, { left: 0, top: 0, right: W, bottom: H })
    const f = found as unknown as { route: number[]; j: number }
    for (const j of f.route.slice(1)) await tap(w, 1, j)
    const before = useTaskProgress().parts.value
    await tap(w, 1, f.j)
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('Die Wege dürfen sich nicht kreuzen.')
    expect(w.find('.gm-mark').text()).toBe('✕')
    expect(useTaskProgress().parts.value).toBe(before)
    // take back the last way: no mistake, the shepherds stand one house back
    const ways = w.findAll('.gm-way').length
    await w.findAll('button').find((b) => b.text() === 'Weg zurück')!.trigger('click')
    expect(w.findAll('.gm-way')).toHaveLength(ways - 1)
    expect(count('wrong')).toBe(1)
    // the same way again does not count a second time
    await tap(w, 1, f.route[f.route.length - 1]!)
    expect(useTaskProgress().parts.value).toBe(before)
  })

  it('the keyboard: the arrow keys choose a house, Enter goes there, the back key takes the way back', async () => {
    const w = mountIt()
    const route = tellSolve(pts(0), [0])!
    const field = w.find('.gm-field')
    await field.trigger('keydown', { key: 'Enter' })
    expect(w.text()).toContain('Mit den Pfeiltasten wählst du ein Haus')
    expect(w.find('.gm-ring.cursor').exists()).toBe(true)
    // go to the first house of the solution with the keys: from the shelter always the nearest one in a direction; here simply set it with the arrows until the cursor is there
    const p = pts(0)
    const centres = p.map((h) => ({ x: h.x, y: h.y - ((h.w / TELL_SPRITE) * TELL_RATIO) / 2 }))
    let cur = 0
    const target = route[0]!
    for (let guard = 0; guard < 12 && cur !== target; guard++) {
      let best = { k: 'ArrowLeft', i: cur }
      for (const [k, d] of [['ArrowLeft', [-1, 0]], ['ArrowRight', [1, 0]], ['ArrowUp', [0, -1]], ['ArrowDown', [0, 1]]] as const) {
        const i = wnNeighbour(centres, cur, d[0], d[1], TELL_RATIO)
        if (i !== cur && Math.hypot(centres[i]!.x - centres[target]!.x, (centres[i]!.y - centres[target]!.y) / TELL_RATIO) < Math.hypot(centres[best.i]!.x - centres[target]!.x, (centres[best.i]!.y - centres[target]!.y) / TELL_RATIO)) best = { k, i }
      }
      if (best.i === cur) break
      await field.trigger('keydown', { key: best.k })
      cur = best.i
    }
    expect(cur).toBe(target)
    await field.trigger('keydown', { key: 'Enter' })
    expect(useTaskProgress().parts.value).toBe(1)
    await field.trigger('keydown', { key: 'Backspace' })
    expect(w.findAll('.gm-way')).toHaveLength(0)
    expect(walkerAt(w).x).toBeCloseTo(spot(0, 0).x, 5)
  })

  it('the finger takes the shepherds along: a line follows it, and it is let go over a house', async () => {
    const w = mountIt()
    const route = tellSolve(pts(0), [0])!
    const s = mid(0, 0)
    const e = mid(0, route[0]!)
    pointer(w.find('.gm-field').element, 'pointerdown', s.x, s.y)
    pointer(window, 'pointermove', (s.x + e.x) / 2, (s.y + e.y) / 2)
    await flushPromises()
    expect(w.find('.gm-way.preview').exists()).toBe(true)
    pointer(window, 'pointerup', e.x, e.y)
    await flushPromises()
    expect(w.find('.gm-way.preview').exists()).toBe(false)
    expect(w.findAll('.gm-way')).toHaveLength(1)
    // let go over open ground: nothing happens, no mistake
    pointer(w.find('.gm-field').element, 'pointerdown', e.x, e.y)
    pointer(window, 'pointermove', 5, 5)
    pointer(window, 'pointerup', 2, 2)
    await flushPromises()
    expect(w.findAll('.gm-way')).toHaveLength(1)
    expect(count('wrong')).toBe(0)
  })

  it('a button "Hilf mir" shows after fifteen seconds: it rings the next house of a way that works', async () => {
    const w = mountIt()
    expect(w.text()).not.toContain('Hilf mir')
    await tick(15600)
    const btn = w.findAll('button').find((b) => b.text() === 'Hilf mir')!
    expect(btn).toBeTruthy()
    await btn.trigger('click')
    const ring = w.find('.gm-ring.hint')
    expect(ring.exists()).toBe(true)
    expect(w.text()).toContain('Geh als Nächstes zu:')
    const route = tellSolve(pts(0), [0])!
    expect(w.text()).toContain(pts(0)[route[0]!]!.name)
    expect(w.text()).not.toContain('Hilf mir')
  })

  it('a dead end in round 2: a word, no mistake; "Hilf mir" takes the last way back', async () => {
    const w = mountIt()
    await solveRound(w, 0)
    await tick(2900)
    boxes.set(w.find('.gm-field').element, { left: 0, top: 0, right: W, bottom: H })
    const p = pts(1)
    // walk into a dead end
    let route = [0]
    const walk = (r: number[]): number[] | null => {
      const opts = p.map((_, j) => j).filter((j) => j > 0 && !r.includes(j) && tellTry(p, r, j).kind === 'ok')
      if (!opts.length) return r.length < p.length ? r : null
      for (const j of opts) {
        const f = walk([...r, j])
        if (f) return f
      }
      return null
    }
    route = walk([0])!
    expect(route).not.toBeNull()
    for (const j of route.slice(1)) await tap(w, 1, j)
    expect(w.text()).toContain('Hier geht es nicht weiter. Nimm den letzten Weg zurück.')
    expect(count('wrong')).toBe(0)
    await tick(15600)
    const waysBefore = w.findAll('.gm-way').length
    await w.findAll('button').find((b) => b.text() === 'Hilf mir')!.trigger('click')
    expect(w.findAll('.gm-way')).toHaveLength(waysBefore - 1)
    expect(w.text()).toContain('Die Hirten gehen einen Weg zurück.')
  })

  it('both rounds: round 2 brings more houses; at the end three stars, the words of the Bible, every house counts for "Go on"', async () => {
    const w = mountIt()
    const g = G()
    await solveRound(w, 0)
    expect(w.text()).toContain('Alle im Dorf haben es gehört!')
    await tick(300)
    expect(played).toContain('right')
    expect(useTaskProgress().parts.value).toBe(g.rounds[0]!.houses.length)
    await tick(2900)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.findAll('.gm-house')).toHaveLength(g.rounds[1]!.houses.length + 1)
    expect(w.findAll('.gm-way')).toHaveLength(0)
    boxes.set(w.find('.gm-field').element, { left: 0, top: 0, right: W, bottom: H })
    await solveRound(w, 1)
    expect(w.text()).toContain('Alle im Dorf haben es gehört!')
    await tick(2300)
    expect(played).toContain('star')
    expect(w.text()).toContain('breiteten sie das Wort aus')
    expect(useTaskProgress().finished.value).toBe(true)
    expect(useTaskProgress().parts.value).toBe(g.rounds[0]!.houses.length + g.rounds[1]!.houses.length)
    await adv(w)
    expect(w.emitted('done')![0]).toEqual([3])
    expect(count('wrong')).toBe(0)
    expect(problems()).toEqual([])
  })

  it('English and Spanish words', async () => {
    for (const [loc, text] of [['en', 'Heard it: 0 of'], ['es', 'Lo han oído: 0 de']] as const) {
      const w = mountIt(loc)
      expect(w.text()).toContain(text)
      expect(w.find('.gm-walker').attributes('aria-label')).toBe(loc === 'en' ? 'The shepherds' : 'Los pastores')
      w.unmount()
    }
  })
})

// ================================================================ 4. follow the star
describe('Dem Stern folgen (stern)', () => {
  const G = () => task<StarGame>(8, 'star')
  const W = 300
  const H = 200
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => {
    const w = mount(GameStern, { props: { game: G() }, ...opts(locale) })
    boxes.set(w.find('.gm-field').element, { left: 0, top: 0, right: W, bottom: H })
    return w
  }
  type Wr = ReturnType<typeof mountIt>
  const left = (w: Wr, sel: string) => parseFloat((w.find(sel).element as HTMLElement).style.left)
  const px = (pct: number) => (pct / 100) * W
  const holdAt = async (w: Wr) => {
    pointer(w.find('.gm-field').element, 'pointerdown', px(left(w, '.gm-star')), 150)
    await flushPromises()
  }
  /** A finger that stays under the star until the round is won (or `max` seconds are over). */
  const follow = async (w: Wr, until: string, max: number) => {
    for (let i = 0; i < max * 20 && !w.text().includes(until); i++) {
      pointer(window, 'pointermove', px(left(w, '.gm-star')), 150)
      await tick(50)
    }
  }

  it('the night road, the star in the sky, the wise men under it, the house at the end, round 1 of 2; the goal is four parts a round (8)', () => {
    const w = mountIt()
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.find('.gm-star').exists()).toBe(true)
    expect(w.find('.gm-walker').exists()).toBe(true)
    expect(w.find('.gm-house').exists()).toBe(true)
    expect(useTaskProgress().goal.value).toBe(8)
    expect(left(w, '.gm-star')).toBeCloseTo(G().rounds[0]!.stops[0]!, 5)
    expect(w.find('.gm-walker').attributes('aria-label')).toBe('Die Weisen, unter dem Stern')
    expect(w.text()).toContain('Die Weisen sind unter dem Stern.')
    expect(w.find('.gm-walker .gm-mark').text()).toBe('✓')
    expect(w.text()).toContain('Unter dem Stern gegangen: 0 von 14 Sekunden')
    expect(w.find('.gm-field').attributes('tabindex')).toBe('0')
    expect(w.find('svg').exists()).toBe(false)
    expect(w.find('.gm-fb').attributes('role')).toBe('status')
    expect(problems()).toEqual([])
  })

  it('the star waits, then goes on towards the house; it never goes back', async () => {
    const w = mountIt()
    const xs: number[] = []
    for (let i = 0; i < 100; i++) {
      await tick(200)
      xs.push(left(w, '.gm-star'))
    }
    for (let i = 1; i < xs.length; i++) expect(xs[i]!).toBeGreaterThanOrEqual(xs[i - 1]! - 1e-9)
    expect(xs[0]!).toBeCloseTo(G().rounds[0]!.stops[0]!, 3)
    expect(xs[xs.length - 1]!).toBeGreaterThan(xs[0]! + 20)
  })

  it('a finger that is held moves the wise men, they follow it faster than the star, and look the way they go', async () => {
    const w = mountIt()
    pointer(w.find('.gm-field').element, 'pointerdown', px(80), 150)
    await tick(1000)
    const x = left(w, '.gm-walker')
    expect(x).toBeGreaterThan(G().rounds[0]!.stops[0]! + 10)
    expect(w.find('.gm-flip').attributes('style')).toContain('scaleX(1)')
    pointer(window, 'pointermove', px(10), 150)
    await tick(500)
    expect(left(w, '.gm-walker')).toBeLessThan(x)
    expect(w.find('.gm-flip').attributes('style')).toContain('scaleX(-1)')
    pointer(window, 'pointerup', px(10), 150)
  })

  it('who stands still loses the star: after a moment a cross and a word, a low tone, one mistake only; going back under it finds it again', async () => {
    const w = mountIt()
    await tick(4500)
    expect(w.find('.gm-walker').attributes('aria-label')).toBe('Die Weisen')
    expect(w.text()).toContain('Der Stern ist nicht über den Weisen.')
    await tick(2500)
    expect(w.text()).toContain('Der Stern ist weit weg! Geh zurück unter ihn.')
    expect(count('wrong')).toBe(1)
    expect(w.find('.gm-walker .gm-mark').text()).toBe('✕')
    await tick(8000)
    expect(count('wrong')).toBe(1)
    // the finger brings them back
    pointer(w.find('.gm-field').element, 'pointerdown', px(left(w, '.gm-star')), 150)
    for (let i = 0; i < 60; i++) {
      pointer(window, 'pointermove', px(left(w, '.gm-star')), 150)
      await tick(50)
    }
    expect(w.text()).toContain('Sie sind wieder unter dem Stern.')
    expect(w.find('.gm-walker .gm-mark').text()).toBe('✓')
  })

  it('the keyboard: the arrow keys walk, Enter goes under the star', async () => {
    const w = mountIt()
    const field = w.find('.gm-field')
    await field.trigger('keydown', { key: 'ArrowRight' })
    await tick(600)
    expect(left(w, '.gm-walker')).toBeGreaterThan(G().rounds[0]!.stops[0]! + 5)
    await field.trigger('keydown', { key: 'ArrowLeft' })
    await field.trigger('keydown', { key: 'ArrowLeft' })
    await tick(2000)
    expect(left(w, '.gm-walker')).toBeLessThan(G().rounds[0]!.stops[0]!)
    await field.trigger('keydown', { key: 'Enter' })
    expect(w.text()).toContain('Pfeiltasten: nach links oder rechts gehen. Enter: unter den Stern.')
    await tick(2500)
    expect(Math.abs(left(w, '.gm-walker') - left(w, '.gm-star'))).toBeLessThan(G().rounds[0]!.tolerance)
  })

  it('a button "Hilf mir" shows after fifteen seconds: the wise men follow the star by themselves for a few seconds', async () => {
    const w = mountIt()
    expect(w.text()).not.toContain('Hilf mir')
    await tick(15600)
    const btn = w.findAll('button').find((b) => b.text() === 'Hilf mir')!
    expect(btn).toBeTruthy()
    await btn.trigger('click')
    expect(w.text()).toContain('Die Weisen gehen ein Stück allein mit dem Stern.')
    expect(w.text()).not.toContain('Hilf mir')
    await tick(3500)
    expect(Math.abs(left(w, '.gm-walker') - left(w, '.gm-star'))).toBeLessThan(G().rounds[0]!.tolerance)
    expect(w.find('.gm-walker').attributes('aria-label')).toBe('Die Weisen, unter dem Stern')
  })

  it('both rounds with a finger that stays under the star: the star stops over the house, the parts count for "Go on", three stars, the words of the Bible', async () => {
    const w = mountIt()
    await holdAt(w)
    await follow(w, 'Der Stern steht über dem Haus!', 60)
    expect(w.text()).toContain('Der Stern steht über dem Haus!')
    expect(played).toContain('bead')
    expect(useTaskProgress().parts.value).toBe(4)
    expect(count('wrong')).toBe(0)
    await tick(2900)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(left(w, '.gm-star')).toBeCloseTo(G().rounds[1]!.stops[0]!, 3)
    await follow(w, 'Der Stern steht über dem Haus!', 60)
    expect(w.text()).toContain('Der Stern steht über dem Haus!')
    await tick(2500)
    expect(played).toContain('star')
    expect(w.text()).toContain('stand oben über, da das Kindlein war')
    expect(useTaskProgress().finished.value).toBe(true)
    expect(useTaskProgress().parts.value).toBe(8)
    expect(count('wrong')).toBe(0)
    pointer(window, 'pointerup', 0, 0)
    await adv(w)
    expect(w.emitted('done')![0]).toEqual([3])
    expect(problems()).toEqual([])
  })

  it('the partial parts: a quarter of the way is one part, so that "Go on" gives a star for what was done', async () => {
    const w = mountIt()
    await holdAt(w)
    await follow(w, 'xxxx nie', 9)
    pointer(window, 'pointerup', 0, 0)
    expect(useTaskProgress().parts.value).toBeGreaterThanOrEqual(2)
    expect(partialStars(useTaskProgress().parts.value, useTaskProgress().goal.value)).toBeGreaterThanOrEqual(0)
  })

  it('less motion: the star goes slower', async () => {
    const fast = mountIt()
    await tick(3000)
    const xFast = left(fast, '.gm-star')
    fast.unmount()
    window.matchMedia = ((q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, onchange: null, dispatchEvent: () => false })) as never
    const slow = mountIt()
    await tick(3000)
    expect(left(slow, '.gm-star')).toBeLessThan(xFast - 0.5)
  })

  it('English and Spanish words', async () => {
    for (const [loc, text] of [['en', 'Walked under the star: 0 of 14 seconds'], ['es', 'Caminado bajo la estrella: 0 de 14 segundos']] as const) {
      const w = mountIt(loc)
      expect(w.text()).toContain(text)
      w.unmount()
    }
  })
})
