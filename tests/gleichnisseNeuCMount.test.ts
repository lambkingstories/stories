/**
 * The two games of the stages 11 and 12 of "Geschichten von Jesus" (rebuild of 10.11.2026), each mounted with sample data and played through:
 * GameBaugrund (knocking, the house dragged or chosen, rain / water / wind, the rock and the sand, the second round with four knocks, help, keys, stars, the verse)
 * and GameEinladen (guests that wave and go away, the tap, the hop, the lamps, the pair, the second round behind hedges, help, keys, stars, the verse), German, English and Spanish words.
 * The new words are not in `i18n/app.ts` yet: they are mixed in here (`gleichnisseNeuCI18n.ts`, written by tools/i18n_neu_c_gleichnisse.py from the INTEGRATION.json).
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import spanish from '@/i18n/app.es'
import useTaskProgress from '@/use/useTaskProgress'
import GameBaugrund from '@/components/molecules/games/GameBaugrund.vue'
import GameEinladen from '@/components/molecules/games/GameEinladen.vue'
import { GROUND_SINK_MS, GROUND_WEATHER_MS, groundProblems, inviteProblems } from '@/utils/gleichnisseNeuC'
import { GLEICHNISSE_C_WORDS } from './gleichnisseNeuCI18n'
import { GROUND, INVITE } from './gleichnisseNeuCSamples'

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

type Tree = Record<string, Record<string, Record<string, unknown>>>
function allMessages() {
  const base = { ...(messages as object), ...(spanish as object) } as Tree
  const out: Tree = {}
  for (const loc of ['de', 'en', 'es'] as const) {
    const b = base[loc] ?? {}
    const app = (b.app ?? {}) as Record<string, unknown>
    out[loc] = { ...b, app: { ...app, adventure: { ...((app.adventure as object) ?? {}), ...GLEICHNISSE_C_WORDS[loc] } } }
  }
  return out
}
const mk = (locale: 'de' | 'en' | 'es') => createI18n({ legacy: false, locale, fallbackLocale: 'de', messages: allMessages() as never, missingWarn: false, fallbackWarn: false })
const opts = (locale: 'de' | 'en' | 'es' = 'de') => ({ global: { plugins: [mk(locale)], stubs: { RouterLink: true } }, attachTo: document.body })

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
const problems = () => warnings.filter((w) => /not defined on instance|is not a function|Unhandled error|ERROR|Missing required prop|Not found/.test(w))
const tick = async (ms: number) => {
  await vi.advanceTimersByTimeAsync(ms)
  await flushPromises()
}
const count = (name: string) => played.filter((p) => p === name).length
const pointer = (el: Element | Window, type: 'pointerdown' | 'pointerup' | 'pointermove', x = 0, y = 0) =>
  el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, buttons: type === 'pointerup' ? 0 : 1, clientX: x, clientY: y }))
const key = (el: Element, type: 'keydown' | 'keyup', k: string) => el.dispatchEvent(new KeyboardEvent(type, { key: k, bubbles: true, cancelable: true }))
/** from the end of the weather to the next round (the win is shown, then "Well done", then the next round) */
const NEXT_ROUND = 3700
/** from the end of the weather to the end page, after the last win */
const TO_END = 3500
const until = async (cond: () => boolean, maxSeconds = 30) => {
  for (let i = 0; i < maxSeconds * 10 && !cond(); i++) await tick(100)
  return cond()
}

// ================================================================ 1. where does the house stand safely?
describe('Baugrund (GameBaugrund)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameBaugrund, { props: { game: GROUND }, ...opts(locale) })
  type Wr = ReturnType<typeof mountIt>
  const plot = (w: Wr, i: number) => w.findAll('.gm-plot')[i]!
  const houseButton = (w: Wr) => w.find('button.gm-house-tray')
  /** the whole weather plus the end of it */
  const weatherDone = (ms = 0) => tick(GROUND_WEATHER_MS * 3 + 100 + ms)
  /** choose the house with a tap, then tap the plot */
  const build = async (w: Wr, i: number) => {
    pointer(houseButton(w).element, 'pointerdown', 10, 10)
    pointer(window, 'pointerup', 10, 10)
    await flushPromises()
    await plot(w, i).trigger('click')
  }

  it('the sample data are in order; the valley, four plots as buttons, the house in its tray; the goal is the two rounds', () => {
    expect(groundProblems(GROUND)).toEqual([])
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(2)
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.text()).toContain('Klopfe den Boden ab.')
    expect(w.findAll('.gm-plot')).toHaveLength(4)
    expect(plot(w, 0).element.tagName).toBe('BUTTON')
    expect(plot(w, 0).attributes('aria-label')).toBe('Bauplatz 1 von 4')
    expect(plot(w, 0).attributes('data-drop')).toBe('plot-0')
    expect(w.find('.gm-field').attributes('aria-label')).toContain('stilles Tal')
    expect(houseButton(w).exists()).toBe(true)
    expect(houseButton(w).attributes('aria-label')).toContain('Ziehe es auf einen Bauplatz')
    expect(w.find('.gm-tray').exists()).toBe(true)
    expect(w.text()).not.toContain('Klopfer übrig')
    expect(problems()).toEqual([])
  })

  it('knocking is never a mistake: the rock rings hard (sound, sparks, a tick and the words), the sand is soft (dull sound, dust, a cross and the words)', async () => {
    const w = mountIt()
    await plot(w, 1).trigger('click')
    expect(w.text()).toContain('Weich wie Sand')
    expect(count('sack')).toBe(1)
    expect(plot(w, 1).find('.gm-mark').exists()).toBe(true)
    expect(plot(w, 1).classes()).toContain('soft')
    expect(w.find('.gm-mallet').exists()).toBe(true)
    expect(w.find('.gm-burst.soft').exists()).toBe(true)
    await plot(w, 0).trigger('click')
    expect(w.text()).toContain('Hart wie Stein')
    expect(count('tap')).toBe(1)
    expect(w.find('.gm-burst.hard').exists()).toBe(true)
    expect(plot(w, 0).attributes('aria-label')).toBe('Bauplatz 1 von 4, Hart wie Stein')
    expect(count('wrong')).toBe(0)
    await tick(1200)
    expect(w.find('.gm-mallet').exists()).toBe(false)
    // as many knocks as one likes in round 1
    for (let i = 0; i < 6; i++) await plot(w, 2).trigger('click')
    expect(w.text()).toContain('Weich wie Sand')
    expect(problems()).toEqual([])
  })

  it('the house on the sand: rain, water and wind come in turn, the sand gives way (a mistake), the house goes back to its tray and that plot is marked; the rock holds', async () => {
    const w = mountIt()
    await build(w, 3)
    expect(houseButton(w).exists()).toBe(false)
    expect(w.find('.gm-house').exists()).toBe(true)
    // nothing else can be done while the weather is on
    await plot(w, 0).trigger('click')
    expect(w.text()).not.toContain('Hart wie Stein')
    await tick(100)
    expect(w.text()).toContain('Es regnet.')
    expect(w.find('.gm-rain').exists()).toBe(true)
    await tick(GROUND_WEATHER_MS)
    expect(w.text()).toContain('Wasser kommt.')
    expect(w.find('.gm-water').exists()).toBe(true)
    await tick(GROUND_WEATHER_MS)
    expect(w.text()).toContain('Der Wind weht.')
    expect(w.find('.gm-wind').exists()).toBe(true)
    await tick(GROUND_WEATHER_MS)
    expect(w.text()).toContain('Der Sand gibt nach.')
    expect(w.find('.gm-house.tilted').exists()).toBe(true)
    expect(count('wrong')).toBe(1)
    expect(w.find('.gm-rain').exists()).toBe(false)
    await tick(GROUND_SINK_MS + 100)
    expect(w.text()).toContain('Das Haus steht wieder unten links.')
    expect(houseButton(w).exists()).toBe(true)
    expect(w.find('.gm-house').exists()).toBe(false)
    expect(plot(w, 3).find('.gm-mark').exists()).toBe(true)
    expect(plot(w, 3).classes()).toContain('soft')
    expect(useTaskProgress().parts.value).toBe(0)
    // the same plot again: it only says that the sand has given way
    await build(w, 3)
    expect(w.text()).toContain('Hier hat der Sand schon nachgegeben.')
    expect(w.find('.gm-house').exists()).toBe(false)
    // the rock
    await plot(w, 0).trigger('click')
    await build(w, 0)
    await weatherDone()
    expect(w.text()).toContain('Das Haus steht fest auf dem Felsen.')
    expect(count('right')).toBe(1)
    expect(useTaskProgress().parts.value).toBe(1)
    await tick(NEXT_ROUND)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(problems()).toEqual([])
  })

  it('round 2: six plots, only four knocks, the result is a sound and a word but no sign; when the knocks are used up one builds on a hunch; the second win ends with the verse and three stars', async () => {
    const w = mountIt()
    // round 1: straight to the rock
    await build(w, 0)
    await weatherDone(NEXT_ROUND)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.findAll('.gm-plot')).toHaveLength(6)
    expect(w.text()).toContain('Du hast nur vier Klopfer.')
    expect(w.text()).toContain('Klopfer übrig: 4')
    expect(w.findAll('.gm-knock-icon.used')).toHaveLength(0)
    await plot(w, 0).trigger('click')
    expect(w.text()).toContain('Weich.')
    expect(plot(w, 0).find('.gm-mark').exists()).toBe(false)
    expect(plot(w, 0).classes()).not.toContain('soft')
    expect(w.text()).toContain('Klopfer übrig: 3')
    await plot(w, 2).trigger('click')
    expect(w.text()).toContain('Hart.')
    expect(plot(w, 2).find('.gm-mark').exists()).toBe(false)
    expect(plot(w, 2).attributes('aria-label')).toBe('Bauplatz 3 von 6')
    await plot(w, 1).trigger('click')
    await plot(w, 3).trigger('click')
    expect(w.text()).toContain('Klopfer übrig: 0')
    expect(w.findAll('.gm-knock-icon.used')).toHaveLength(4)
    const before = count('tap') + count('sack')
    await plot(w, 4).trigger('click')
    expect(w.text()).toContain('Die Klopfer sind verbraucht. Jetzt baust du auf Verdacht.')
    expect(count('tap') + count('sack')).toBe(before)
    // building is still allowed: with the space bar on a plot (no house chosen), on the rock
    key(plot(w, 2).element, 'keydown', ' ')
    await flushPromises()
    expect(w.find('.gm-house').exists()).toBe(true)
    await weatherDone(TO_END)
    // no mistakes, no help: three stars, the verse
    expect(w.text()).toContain('Darum, wer diese meine Rede hört und tut sie')
    expect(w.text()).toContain('(Matthäus 7,24)')
    expect(useTaskProgress().finished.value).toBe(true)
    expect(useTaskProgress().parts.value).toBe(2)
    expect(count('star')).toBe(1)
    await w.find('button.adv-btn').trigger('click')
    expect(w.emitted('done')![0]).toEqual([3])
    expect(problems()).toEqual([])
  })

  it('three mistakes (the house sank three times) are two stars; with help never more than two', async () => {
    const w = mountIt()
    for (const i of [1, 2, 3]) {
      await build(w, i)
      await weatherDone(GROUND_SINK_MS + 100)
    }
    expect(w.findAll('.gm-mark')).toHaveLength(3)
    await build(w, 0)
    await weatherDone(NEXT_ROUND)
    // round 2: help
    await tick(16000)
    const help = w.findAll('button').find((b) => b.text() === 'Hilf mir')!
    expect(help).toBeTruthy()
    await help.trigger('click')
    expect(plot(w, 2).classes()).toContain('hinted')
    expect(w.text()).toContain('Hier ist Fels.')
    expect(document.activeElement).toBe(plot(w, 2).element)
    key(plot(w, 2).element, 'keydown', ' ')
    await flushPromises()
    await weatherDone(TO_END)
    await w.find('button.adv-btn').trigger('click')
    // three mistakes = 2 stars, help also 2
    expect(w.emitted('done')![0]).toEqual([2])
  })

  it('"Help me" comes after fifteen seconds only, and the arrow keys go from plot to plot; Enter knocks', async () => {
    const w = mountIt()
    expect(w.text()).not.toContain('Hilf mir')
    await tick(14000)
    expect(w.text()).not.toContain('Hilf mir')
    await tick(2000)
    expect(w.text()).toContain('Hilf mir')
    expect(plot(w, 0).attributes('tabindex')).toBe('0')
    key(plot(w, 0).element, 'keydown', 'ArrowRight')
    await flushPromises()
    expect(document.activeElement).toBe(plot(w, 1).element)
    expect(plot(w, 1).attributes('tabindex')).toBe('0')
    key(plot(w, 1).element, 'keydown', 'Enter')
    await flushPromises()
    expect(w.text()).toContain('Weich wie Sand')
    expect(w.find('.gm-house').exists()).toBe(false)
    // a key that means nothing is let through
    key(plot(w, 1).element, 'keydown', 'a')
    expect(problems()).toEqual([])
  })

  it('the house is also dragged to a plot; the chosen house is shown with a ring; Enter on the house chooses it', async () => {
    const w = mountIt()
    const p = plot(w, 0).element
    ;(document as unknown as { elementFromPoint: unknown }).elementFromPoint = vi.fn(() => p)
    pointer(houseButton(w).element, 'pointerdown', 10, 90)
    pointer(window, 'pointermove', 60, 40)
    pointer(window, 'pointerup', 60, 40)
    await flushPromises()
    expect(w.find('.gm-house').exists()).toBe(true)
    delete (document as unknown as { elementFromPoint?: unknown }).elementFromPoint
    await weatherDone(NEXT_ROUND)
    // round 2: choose the house with the keyboard
    key(houseButton(w).element, 'keydown', 'Enter')
    await flushPromises()
    expect(houseButton(w).classes()).toContain('chosen')
    expect(houseButton(w).attributes('aria-pressed')).toBe('true')
    expect(houseButton(w).attributes('aria-label')).toBe('Das Haus ist gewählt. Tippe auf einen Bauplatz.')
    await plot(w, 2).trigger('click')
    expect(w.find('.gm-house').exists()).toBe(true)
    expect(problems()).toEqual([])
  })

  it('English and Spanish words', () => {
    const en = mountIt('en')
    expect(en.find('.gm-field').attributes('aria-label')).toContain('quiet valley')
    expect(en.findAll('.gm-plot')[0]!.attributes('aria-label')).toBe('Building plot 1 of 4')
    const es = mountIt('es')
    expect(es.find('.gm-field').attributes('aria-label')).toContain('valle tranquilo')
    expect(es.findAll('.gm-plot')[0]!.attributes('aria-label')).toBe('Solar 1 de 4')
  })
})

// ================================================================ 2. come, all things are ready!
describe('Einladen (GameEinladen)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameEinladen, { props: { game: INVITE }, ...opts(locale) })
  type Wr = ReturnType<typeof mountIt>
  const guests = (w: Wr) => w.findAll('button.gm-guest')
  const sitting = (w: Wr) => w.findAll('.gm-sit')
  const lit = (w: Wr) => w.findAll('.gm-lamp.lit')
  /** waits until somebody waves, taps him; returns his name */
  const inviteOne = async (w: Wr) => {
    expect(await until(() => guests(w).length > 0, 20)).toBe(true)
    const g = guests(w)[0]!
    const name = g.attributes('aria-label')!
    await g.trigger('click')
    return name
  }

  it('the sample data are in order; the lane, the servant, the table with twelve lamps and "Seats free: 12"; the goal is every guest of both rounds', () => {
    expect(inviteProblems(INVITE)).toEqual([])
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(11)
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.text()).toContain('Tippe die Gäste an, die dir zuwinken.')
    expect(w.find('.gm-field').attributes('aria-label')).toContain('Haus des Gastgebers')
    expect(w.find('.gm-field').attributes('tabindex')).toBe('0')
    expect(w.find('.gm-servant').exists()).toBe(true)
    expect(w.find('.gm-table').exists()).toBe(true)
    expect(w.findAll('.gm-lamp')).toHaveLength(12)
    expect(lit(w)).toHaveLength(0)
    expect(w.text()).toContain('Plätze frei: 12')
    expect(guests(w)).toHaveLength(0)
    expect(problems()).toEqual([])
  })

  it('a guest comes after a moment, waves as a button with words, and goes away when nobody taps him; at most two wave at once in round 1', async () => {
    const w = mountIt()
    await tick(500)
    expect(guests(w)).toHaveLength(1)
    expect(guests(w)[0]!.attributes('aria-label')).toBe('Frau mit Korb winkt')
    expect(guests(w)[0]!.element.tagName).toBe('BUTTON')
    await tick(2500)
    expect(guests(w)).toHaveLength(2)
    await tick(2500)
    // the first has waved for five seconds: he is gone, a new one came
    expect(guests(w).map((g) => g.attributes('aria-label'))).not.toContain('Frau mit Korb winkt')
    for (let i = 0; i < 100; i++) {
      await tick(500)
      expect(guests(w).length).toBeLessThanOrEqual(2)
    }
    expect(w.text()).toContain('Plätze frei: 12')
    expect(useTaskProgress().parts.value).toBe(0)
    expect(count('wrong')).toBe(0)
  })

  it('a tap invites: the servant calls "Come!", the guest hops to the table and sits, his lamp lights, the seats free go down; the tap is one part of the task', async () => {
    const w = mountIt()
    await tick(500)
    await guests(w)[0]!.trigger('click')
    expect(w.text()).toContain('Kommt!')
    expect(w.text()).toContain('Plätze frei: 11')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(count('bead')).toBe(1)
    expect(w.find('.gm-hop').exists()).toBe(true)
    expect(guests(w).map((g) => g.attributes('aria-label'))).not.toContain('Frau mit Korb winkt')
    expect(lit(w)).toHaveLength(0)
    await tick(1000)
    expect(w.text()).toContain('Kommt!')
    expect(w.find('.gm-hop').exists()).toBe(false)
    expect(sitting(w)).toHaveLength(1)
    expect(sitting(w)[0]!.attributes('aria-label')).toBe('Frau mit Korb sitzt')
    expect(lit(w)).toHaveLength(1)
    await tick(700)
    expect(w.text()).not.toContain('Kommt!')
    // the lamp stands over the first place
    expect((lit(w)[0]!.element as HTMLElement).style.left).toBe(`${INVITE.tableSeats[0]!.x}%`)
    expect(problems()).toEqual([])
  })

  it('both rounds: six guests, "There is still room!", then the pair behind hedges and fences, "The house is full!", twelve lamps, the verse, three stars', async () => {
    const w = mountIt()
    const names: string[] = []
    for (let i = 0; i < 6; i++) names.push(await inviteOne(w))
    expect(new Set(names).size).toBe(6)
    expect(w.text()).toContain('Plätze frei: 6')
    await tick(1500)
    expect(w.text()).toContain('Es ist noch Platz da!')
    expect(count('star')).toBe(1)
    expect(sitting(w)).toHaveLength(6)
    expect(lit(w)).toHaveLength(6)
    await tick(2800)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.text()).toContain('Jetzt hinaus auf die Landstraßen.')
    // the six who sit stay at the table; the places of round 2 are the next six
    expect(sitting(w)).toHaveLength(6)
    expect(lit(w)).toHaveLength(6)
    expect(w.findAll('.gm-cover')).toHaveLength(6)
    expect(w.text()).toContain('Plätze frei: 6')
    for (let i = 0; i < 5; i++) {
      const n = await inviteOne(w)
      if (i === 0) expect(n).toBe('Wanderer winkt')
    }
    expect(w.text()).toContain('Plätze frei: 0')
    await tick(1400)
    expect(w.text()).toContain('Das Haus ist voll!')
    expect(lit(w)).toHaveLength(12)
    expect(sitting(w)).toHaveLength(11)
    await tick(2700)
    expect(w.text()).toContain('Kommt, denn es ist alles bereit!')
    expect(w.text()).toContain('(Lukas 14,17)')
    expect(useTaskProgress().parts.value).toBe(11)
    expect(useTaskProgress().finished.value).toBe(true)
    await w.find('button.adv-btn').trigger('click')
    expect(w.emitted('done')![0]).toEqual([3])
    expect(count('wrong')).toBe(0)
    expect(problems()).toEqual([])
  })

  it('"Help me" comes after fifteen seconds only; the servant turns toward the guest, who stays until he is tapped; with help at most two stars', async () => {
    const w = mountIt()
    await tick(14000)
    expect(w.text()).not.toContain('Hilf mir')
    await tick(2000)
    const help = w.findAll('button').find((b) => b.text() === 'Hilf mir')!
    expect(help).toBeTruthy()
    await help.trigger('click')
    expect(w.text()).toContain('Dieser Gast winkt dir zu.')
    const pinned = w.find('button.gm-guest.hinted')
    expect(pinned.exists()).toBe(true)
    expect(document.activeElement).toBe(pinned.element)
    const label = pinned.attributes('aria-label')
    await tick(20000)
    expect(w.find('button.gm-guest.hinted').attributes('aria-label')).toBe(label)
    await pinned.trigger('click')
    expect(w.find('button.gm-guest.hinted').exists()).toBe(false)
    // the rest of the game
    for (let i = 0; i < 5; i++) await inviteOne(w)
    await tick(5000)
    for (let i = 0; i < 5; i++) await inviteOne(w)
    await tick(6000)
    await w.find('button.adv-btn').trigger('click')
    expect(w.emitted('done')![0]).toEqual([2])
  })

  it('the space bar on the field invites the guest who has waited longest; Tab reaches the waving guests', async () => {
    const w = mountIt()
    await tick(500)
    const field = w.find('.gm-field').element
    key(field, 'keydown', ' ')
    await flushPromises()
    expect(w.text()).toContain('Plätze frei: 11')
    expect(useTaskProgress().parts.value).toBe(1)
    // nobody waves just now: nothing happens, and nothing breaks
    key(field, 'keydown', 'Enter')
    key(field, 'keydown', 'a')
    await flushPromises()
    expect(w.text()).toContain('Plätze frei: 11')
    expect(problems()).toEqual([])
  })

  it('English and Spanish words', async () => {
    const en = mountIt('en')
    expect(en.text()).toContain('Seats free: 12')
    expect(en.find('.gm-field').attributes('aria-label')).toContain('house of the host')
    await tick(500)
    await en.find('button.gm-guest').trigger('click')
    expect(en.text()).toContain('Come!')
    const es = mountIt('es')
    expect(es.text()).toContain('Sitios libres: 12')
    expect(es.find('.gm-field').attributes('aria-label')).toContain('casa del anfitrión')
  })
})
