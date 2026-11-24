/**
 * The three new games of "Johannes der Täufer" (`johannes`), mounted with sample data and played through:
 * - `gebaerde` = GameGebaerde ("Show them"): a wrong card (it stays lying, dimmed), the right card (Zacharias takes the posture, the people understand), "Help me", round 2, the end with the verse
 *   (Luke 1,22), stars, English and Spanish;
 * - `abgeben` = GameAbgeben ("Whoever has two gives one away"): giving by taps, by an arrow key and by dragging, taking from somebody who has only one, a person who is no neighbour, "Help me",
 *   round 2 with the bread, the end with the verse (Luke 3,11);
 * - `zeigen` = GameZeigen ("Where does John point?"): the right man, a wrong man (tapped again later), the golden help line, the disciples who follow in round 2, the end (John 1,34).
 * The new words are mixed into the messages of the app here (`johannesNeuI18n.ts`), so that the test does not depend on their place in `i18n/app.ts`.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import spanish from '@/i18n/app.es'
import useTaskProgress from '@/use/useTaskProgress'
import GameGebaerde from '@/components/molecules/games/GameGebaerde.vue'
import GameAbgeben from '@/components/molecules/games/GameAbgeben.vue'
import GameZeigen from '@/components/molecules/games/GameZeigen.vue'
import { johannesStars } from '@/utils/johannesGames'
import { GESTURE, GIVE, POINT } from './johannesSamples'
import { JOHANNES_WORDS } from './johannesNeuI18n'

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

type Tree = Record<string, Record<string, { adventure: Record<string, unknown> } & Record<string, unknown>>>
function allMessages() {
  const base = { ...(messages as unknown as Tree), ...(spanish as unknown as Tree) }
  const out: Record<string, unknown> = {}
  for (const lang of ['de', 'en', 'es'] as const) {
    const app = base[lang]!.app!
    out[lang] = { ...base[lang], app: { ...app, adventure: { ...app.adventure, ...JOHANNES_WORDS[lang] } } }
  }
  return out
}
const MESSAGES = allMessages()
const mk = (locale: 'de' | 'en' | 'es') => createI18n({ legacy: false, locale, fallbackLocale: 'de', messages: MESSAGES as never, missingWarn: false, fallbackWarn: false })
const opts = (locale: 'de' | 'en' | 'es' = 'de') => ({ global: { plugins: [mk(locale)], stubs: { RouterLink: true } }, attachTo: document.body })

let warnings: string[] = []
beforeEach(() => {
  played.length = 0
  warnings = []
  useTaskProgress().reset()
  vi.useFakeTimers()
  // every picture area is 400 x 300 pixels (a percent of the picture is 4 pixels wide and 3 pixels high)
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 400, height: 300, right: 400, bottom: 300, x: 0, y: 0, toJSON: () => ({}) })
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
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})
const problems = () => warnings.filter((w) => /not defined on instance|is not a function|Unhandled error|ERROR|Missing required prop|Not found/.test(w))
const tick = async (ms: number) => {
  await vi.advanceTimersByTimeAsync(ms)
  await flushPromises()
}
const count = (name: string) => played.filter((p) => p === name).length
type Wr = ReturnType<typeof mount>
const helpButton = (w: Wr, label = 'Hilf mir') => w.findAll('button').find((b) => b.text() === label)
/** A pointer event at a place given in percent of the picture (the picture is 400 x 300 pixels in the test). */
const ptr = async (el: Element, type: 'pointerdown' | 'pointermove' | 'pointerup', x: number, y: number) => {
  el.dispatchEvent(new MouseEvent(type, { bubbles: true, button: 0, clientX: x * 4, clientY: y * 3 }))
  await flushPromises()
}
const stillMotion = () =>
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn(), onchange: null, dispatchEvent: vi.fn() }))

// ================================================================ gebaerde
describe('Zeige es ihnen (gebaerde)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameGebaerde, { props: { game: GESTURE }, ...opts(locale) })
  const card = (w: Wr, id: string) => w.find(`[data-card="${id}"]`)
  const pick = async (w: Wr, id: string) => card(w, id).trigger('click')

  it('the goal is the two rounds; the hint, the round, the field as one group, three cards as buttons with the names of the postures, the people puzzled; no drawing', () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(2)
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.text()).toContain('Zeige dem Volk: Du hast im Tempel etwas gesehen.')
    expect(w.find('.gm-field').attributes('aria-label')).toContain('Der Vorplatz des Tempels')
    expect(w.find('.gm-fb').attributes('role')).toBe('status')
    expect(w.find('svg').exists()).toBe(false)
    expect(w.findAll('button.gm-card').map((b) => b.attributes('data-card'))).toEqual(['bauch', 'sehen', 'schlaf'])
    expect(card(w, 'sehen').attributes('aria-label')).toBe('Hand über den Augen, Blick nach oben')
    expect(w.find('.gm-zach img').attributes('src')).toContain('gebaerde/zacharias.webp')
    expect(w.find('.gm-crowd img').attributes('src')).toContain('gebaerde/volk-ratlos.webp')
    expect(w.text()).toContain('Verstanden: 0 von 2')
    expect(helpButton(w)).toBeUndefined()
    expect(problems()).toEqual([])
  })

  it('a wrong card: a cross, a low tone, "Das verstehen sie nicht.", a mistake, the card stays lying and cannot be chosen again; the people tilt', async () => {
    const w = mountIt()
    await pick(w, 'bauch')
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('Das verstehen sie nicht.')
    expect(card(w, 'bauch').classes()).toContain('wrong')
    expect(card(w, 'bauch').attributes('disabled')).toBeDefined()
    expect(card(w, 'bauch').find('.gm-cardmark').exists()).toBe(true)
    expect(w.find('.gm-crowd').classes()).toContain('tilt')
    await pick(w, 'bauch')
    expect(count('wrong')).toBe(1)
    expect(useTaskProgress().parts.value).toBe(0)
    await tick(1000)
    expect(w.find('.gm-crowd').classes()).not.toContain('tilt')
  })

  it('the right card: a tick, a bright tone, "Sie verstehen ihn.", Zacharias takes the posture, the people understand; after a moment round 2', async () => {
    const w = mountIt()
    await pick(w, 'sehen')
    expect(count('right')).toBe(1)
    expect(w.text()).toContain('Sie verstehen ihn.')
    expect(w.find('.gm-zach img').attributes('src')).toContain('gebaerde/zeichen-sehen.webp')
    expect(w.find('.gm-crowd img').attributes('src')).toContain('gebaerde/volk-versteht.webp')
    expect(card(w, 'sehen').classes()).toContain('right')
    expect(useTaskProgress().parts.value).toBe(1)
    // while the people understand, no other card can be picked
    await pick(w, 'schlaf')
    expect(count('wrong')).toBe(0)
    await tick(2900)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.text()).toContain('Zeige dem Volk: Du kannst nicht sprechen.')
    expect(w.findAll('button.gm-card').map((b) => b.attributes('data-card'))).toEqual(['schlaf', 'bauch', 'mund'])
    expect(w.find('.gm-zach img').attributes('src')).toContain('gebaerde/zacharias.webp')
    expect(w.find('.gm-crowd img').attributes('src')).toContain('gebaerde/volk-ratlos.webp')
  })

  it('"Help me" after fifteen seconds makes the right card shine and costs nothing', async () => {
    const w = mountIt()
    await tick(14000)
    expect(helpButton(w)).toBeUndefined()
    await tick(2000)
    await helpButton(w)!.trigger('click')
    expect(card(w, 'sehen').classes()).toContain('shine')
    expect(card(w, 'bauch').classes()).not.toContain('shine')
    expect(w.text()).toContain('Eine Karte leuchtet.')
    await pick(w, 'sehen')
    expect(card(w, 'sehen').classes()).not.toContain('shine')
    await tick(3000)
    expect(helpButton(w)).toBeUndefined()
  })

  it('the end: both rounds right with no mistake give three stars and the verse (Luke 1,22); the button goes on', async () => {
    const w = mountIt()
    await pick(w, 'sehen')
    await tick(3000)
    await pick(w, 'mund')
    expect(useTaskProgress().parts.value).toBe(2)
    await tick(3000)
    expect(count('star')).toBe(1)
    expect(w.text()).toContain('Und er winkte ihnen und blieb stumm.')
    await w.find('button').trigger('click')
    expect(w.emitted('done')![0]).toEqual([3])
    expect(problems()).toEqual([])
  })

  it('five mistakes give one star', async () => {
    const w = mountIt()
    await pick(w, 'bauch')
    await pick(w, 'schlaf')
    await pick(w, 'sehen')
    await tick(3000)
    await pick(w, 'schlaf')
    await pick(w, 'bauch')
    await pick(w, 'mund')
    expect(useTaskProgress().parts.value).toBe(2)
    await tick(3000)
    await w.find('button').trigger('click')
    expect(w.emitted('done')![0]).toEqual([johannesStars(4)])
    expect(johannesStars(4)).toBe(2)
  })

  it('English and Spanish words; less motion: the people do not tilt', async () => {
    const en = mountIt('en')
    await en.find('[data-card="bauch"]').trigger('click')
    expect(en.text()).toContain('They do not understand that.')
    expect(en.find('.gm-field').attributes('aria-label')).toContain('forecourt of the temple')
    en.unmount()
    const es = mountIt('es')
    await es.find('[data-card="sehen"]').trigger('click')
    expect(es.text()).toContain('Lo entienden.')
    es.unmount()
    stillMotion()
    const w = mountIt()
    expect(w.find('.gm').classes()).toContain('still')
  })
})

// ================================================================ abgeben
describe('Wer zwei hat, gibt ab (abgeben)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameAbgeben, { props: { game: GIVE }, ...opts(locale) })
  const slot = (w: Wr, k: number) => w.find(`[data-slot="${k}"]`)
  const pieces = (w: Wr, k: number) => w.findAll(`[data-piece="${k}"]`).length
  const state = (w: Wr, n: number) => Array.from({ length: n }, (_, k) => pieces(w, k))
  /** Gives by two taps (what the keyboard does): the giver, then the neighbour. */
  const give = async (w: Wr, from: number, to: number) => {
    await slot(w, from).trigger('click')
    await slot(w, to).trigger('click')
  }

  it('the goal is everybody who starts with nothing (1 + 3); four people with 2, 1, 0 and 1 pieces; the names say how many; no drawing', () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(4)
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.text()).toContain('Wer zwei Röcke hat, gibt einen dem Nachbarn. Bald hat jeder einen.')
    expect(w.find('.gm-field').attributes('aria-label')).toContain('Das Jordanufer am Morgen')
    expect(w.find('.gm-fb').attributes('role')).toBe('status')
    expect(w.find('svg').exists()).toBe(false)
    expect(w.findAll('button.gm-slot')).toHaveLength(4)
    expect(state(w, 4)).toEqual([2, 1, 0, 1])
    expect(slot(w, 0).attributes('aria-label')).toBe('ein alter Mann mit Kopftuch und Stab: 2')
    expect(slot(w, 2).attributes('aria-label')).toBe('ein Hirte mit Wollmantel: 0')
    expect(w.text()).toContain('Geholfen: 0 von 4')
    expect(helpButton(w)).toBeUndefined()
    expect(problems()).toEqual([])
  })

  it('a right move: the piece goes to the neighbour, a soft tone, "Das hilft.", a tick over everybody who has exactly one; the first piece of somebody who had nothing counts', async () => {
    const w = mountIt()
    await give(w, 0, 1)
    expect(state(w, 4)).toEqual([1, 2, 0, 1])
    expect(count('snap')).toBe(1)
    expect(w.text()).toContain('Das hilft.')
    expect(useTaskProgress().parts.value).toBe(0) // the one who had nothing has none yet
    await give(w, 1, 2)
    expect(state(w, 4)).toEqual([1, 1, 1, 1])
    expect(useTaskProgress().parts.value).toBe(1)
    expect(count('wrong')).toBe(0)
    await tick(1000)
    expect(w.text()).toContain('Jeder hat eins.')
    expect(w.findAll('.gm-tick')).toHaveLength(4)
  })

  it('somebody who has only one cannot give: the mat wiggles, a cross, a low tone, "Er hat nur eins.", a mistake, nothing moves', async () => {
    const w = mountIt()
    await give(w, 1, 2)
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('Er hat nur eins.')
    expect(slot(w, 1).classes()).toContain('wiggle')
    expect(state(w, 4)).toEqual([2, 1, 0, 1])
    expect(w.findAll('.gm-tick').length).toBeGreaterThan(0)
    expect(useTaskProgress().parts.value).toBe(0)
  })

  it('a person who is no neighbour is no mistake: "Reiche es dem Nachbarn."; somebody with nothing: "Da ist nichts zum Abgeben."; a second tap on the giver puts him down', async () => {
    const w = mountIt()
    await give(w, 0, 2)
    expect(w.text()).toContain('Reiche es dem Nachbarn.')
    expect(count('wrong')).toBe(0)
    expect(state(w, 4)).toEqual([2, 1, 0, 1])
    await slot(w, 2).trigger('click') // the giver (0) is still taken up: giving to 2 is not allowed, 2 is no neighbour; a tap on the giver puts him down
    await slot(w, 0).trigger('click')
    expect(slot(w, 0).attributes('aria-pressed')).toBe('false')
    await slot(w, 2).trigger('click')
    expect(w.text()).toContain('Da ist nichts zum Abgeben.')
    expect(count('wrong')).toBe(0)
  })

  it('taking up the giver shows it (aria-pressed) and asks for the neighbour', async () => {
    const w = mountIt()
    await slot(w, 0).trigger('click')
    expect(slot(w, 0).attributes('aria-pressed')).toBe('true')
    expect(slot(w, 0).classes()).toContain('sel')
    expect(w.text()).toContain('Tippe jetzt den Nachbarn an.')
  })

  it('the arrow keys give to the neighbour at once (Right gives to the right); the edge of the row gives nothing', async () => {
    const w = mountIt()
    await slot(w, 0).trigger('keydown', { key: 'ArrowRight' })
    expect(state(w, 4)).toEqual([1, 2, 0, 1])
    await slot(w, 0).trigger('keydown', { key: 'ArrowLeft' })
    expect(state(w, 4)).toEqual([1, 2, 0, 1])
    expect(count('wrong')).toBe(0)
    await slot(w, 1).trigger('keydown', { key: 'ArrowRight' })
    expect(state(w, 4)).toEqual([1, 1, 1, 1])
  })

  it('a piece can be dragged to the neighbour; letting go elsewhere or on a slot that is no neighbour is no mistake', async () => {
    const w = mountIt()
    const wrap = w.find('.gm-wrap').element
    await ptr(slot(w, 0).element, 'pointerdown', 12, 75)
    await ptr(wrap, 'pointermove', 30, 75)
    expect(w.find('.gm-ghost').exists()).toBe(true)
    await ptr(wrap, 'pointerup', 90, 75) // over slot 3: no neighbour
    expect(w.text()).toContain('Reiche es dem Nachbarn.')
    expect(state(w, 4)).toEqual([2, 1, 0, 1])
    await ptr(slot(w, 0).element, 'pointerdown', 12, 75)
    await ptr(wrap, 'pointermove', 30, 75)
    await ptr(wrap, 'pointerup', 37, 75) // over slot 1
    expect(state(w, 4)).toEqual([1, 2, 0, 1])
    expect(count('snap')).toBe(1)
    expect(count('wrong')).toBe(0)
  })

  it('a tap with the pointer (down and up in the same place) takes the giver up', async () => {
    const w = mountIt()
    const wrap = w.find('.gm-wrap').element
    await ptr(slot(w, 0).element, 'pointerdown', 12, 75)
    await ptr(wrap, 'pointerup', 12, 75)
    expect(slot(w, 0).attributes('aria-pressed')).toBe('true')
    await ptr(slot(w, 1).element, 'pointerdown', 37, 75)
    await ptr(wrap, 'pointerup', 37, 75)
    expect(state(w, 4)).toEqual([1, 2, 0, 1])
  })

  it('"Help me" after fifteen seconds makes the next giver and his neighbour shine (from the CURRENT state) and costs nothing', async () => {
    const w = mountIt()
    await tick(14000)
    expect(helpButton(w)).toBeUndefined()
    await tick(2000)
    await helpButton(w)!.trigger('click')
    expect(slot(w, 0).classes()).toContain('shine')
    expect(slot(w, 1).classes()).toContain('shine')
    expect(slot(w, 2).classes()).not.toContain('shine')
    expect(w.text()).toContain('Ein Mensch leuchtet, und sein Nachbar.')
    await give(w, 0, 1)
    await tick(16000)
    await helpButton(w)!.trigger('click')
    expect(slot(w, 1).classes()).toContain('shine')
    expect(slot(w, 2).classes()).toContain('shine')
    expect(slot(w, 0).classes()).not.toContain('shine')
  })

  it('round 2: five people with bread (0, 0, 4, 0, 1), four moves; the end shows the verse (Luke 3,11); no mistake gives three stars', async () => {
    const w = mountIt()
    await give(w, 0, 1)
    await give(w, 1, 2)
    await tick(3000)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.text()).toContain('Jetzt geht es um Brot. Wer mehr als ein Brot hat, gibt eines weiter.')
    expect(w.findAll('button.gm-slot')).toHaveLength(5)
    expect(state(w, 5)).toEqual([0, 0, 4, 0, 1])
    expect(w.find('[data-piece="2"] img').attributes('src')).toContain('abgeben/brot.webp')
    for (const [a, b] of [[2, 1], [2, 1], [1, 0], [2, 3]] as const) await give(w, a, b)
    expect(state(w, 5)).toEqual([1, 1, 1, 1, 1])
    expect(useTaskProgress().parts.value).toBe(4)
    await tick(1000)
    expect(w.text()).toContain('Jeder hat eins.')
    await tick(2000)
    expect(count('star')).toBe(1)
    expect(w.text()).toContain('Wer zwei Röcke hat, der gebe dem, der keinen hat; und wer Speise hat, der tue auch also.')
    await w.find('button').trigger('click')
    expect(w.emitted('done')![0]).toEqual([3])
    expect(problems()).toEqual([])
  })

  it('five mistakes give one star', async () => {
    const w = mountIt()
    for (let i = 0; i < 5; i++) await give(w, 1, 2)
    await give(w, 0, 1)
    await give(w, 1, 2)
    await tick(3000)
    for (const [a, b] of [[2, 1], [2, 1], [1, 0], [2, 3]] as const) await give(w, a, b)
    await tick(3000)
    await w.find('button').trigger('click')
    expect(w.emitted('done')![0]).toEqual([johannesStars(5)])
    expect(johannesStars(5)).toBe(1)
  })

  it('English and Spanish words; less motion: nothing pops', async () => {
    const en = mountIt('en')
    expect(en.find('[data-slot="0"]').attributes('aria-label')).toBe('ein alter Mann mit Kopftuch und Stab: 2')
    await en.find('[data-slot="1"]').trigger('click')
    await en.find('[data-slot="2"]').trigger('click')
    expect(en.text()).toContain('He has only one.')
    en.unmount()
    const es = mountIt('es')
    await es.find('[data-slot="0"]').trigger('click')
    await es.find('[data-slot="1"]').trigger('click')
    expect(es.text()).toContain('Eso ayuda.')
    es.unmount()
    stillMotion()
    const w = mountIt()
    expect(w.find('.gm').classes()).toContain('still')
  })
})

// ================================================================ zeigen
describe('Wohin zeigt Johannes? (zeigen)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameZeigen, { props: { game: POINT }, ...opts(locale) })
  const man = (w: Wr, id: string) => w.find(`[data-man="${id}"]`)

  it('the goal is the two rounds; John, three men as buttons (the right one is not named), the field as one group; no drawing; no help line yet', () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(2)
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.text()).toContain('Am nächsten Tag: Wer kommt zu Johannes? Tippe den Mann an, auf den er zeigt.')
    expect(w.find('.gm-field').attributes('aria-label')).toContain('Das Jordantal von einer Anhöhe')
    expect(w.find('.gm-fb').attributes('role')).toBe('status')
    expect(w.find('svg').exists()).toBe(false)
    expect(w.findAll('button.gm-man').map((b) => b.attributes('data-man'))).toEqual(['jesus', 'fischer', 'bauer'])
    expect(man(w, 'fischer').attributes('aria-label')).toBe('ein Fischer mit Netz auf der Schulter')
    expect(w.find('.gm-john img').attributes('src')).toContain('zeigen/johannes-zeigt-1.webp')
    expect(w.find('.gm-line').exists()).toBe(false)
    expect(w.find('.gm-disc').exists()).toBe(false)
    expect(w.text()).toContain('Gefunden: 0 von 2')
    expect(problems()).toEqual([])
  })

  it('a wrong man: he wiggles, a cross, a low tone, "Dorthin zeigt Johannes nicht.", a mistake; he can be tapped again, nothing is lost', async () => {
    const w = mountIt()
    await man(w, 'bauer').trigger('click')
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('Dorthin zeigt Johannes nicht.')
    expect(man(w, 'bauer').classes()).toContain('wiggle')
    expect(man(w, 'bauer').find('.gm-mark').exists()).toBe(true)
    expect(man(w, 'bauer').attributes('disabled')).toBeUndefined()
    await tick(1500)
    await man(w, 'bauer').trigger('click')
    expect(count('wrong')).toBe(2)
    expect(useTaskProgress().parts.value).toBe(0)
  })

  it('the right man: a tick, a bright tone, a soft glow, "Ja, auf ihn zeigt Johannes."; after a moment round 2 with four men and the two disciples', async () => {
    const w = mountIt()
    await man(w, 'jesus').trigger('click')
    expect(count('right')).toBe(1)
    expect(w.text()).toContain('Ja, auf ihn zeigt Johannes.')
    expect(man(w, 'jesus').classes()).toContain('glow')
    expect(man(w, 'jesus').find('.gm-mark').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(1)
    // while he is found, nobody else can be tapped
    expect(man(w, 'fischer').attributes('disabled')).toBeDefined()
    await tick(2900)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.text()).toContain('Am Tag darauf: Auf wen zeigt Johannes jetzt?')
    expect(w.findAll('button.gm-man').map((b) => b.attributes('data-man'))).toEqual(['jesus', 'hirte', 'traeger', 'fischer'])
    expect(w.find('.gm-john img').attributes('src')).toContain('zeigen/johannes-zeigt-2.webp')
    expect(w.find('.gm-disc').exists()).toBe(true)
  })

  it('"Help me" after fifteen seconds: a golden line grows along the arm (rotated by the angle) and stays until the child taps; it costs nothing', async () => {
    const w = mountIt()
    await tick(14000)
    expect(helpButton(w)).toBeUndefined()
    await tick(2000)
    await helpButton(w)!.trigger('click')
    const line = w.find('.gm-line')
    expect(line.exists()).toBe(true)
    expect(line.attributes('style')).toContain('rotate(-20deg)')
    expect(line.attributes('style')).toContain('left: 27%')
    expect(w.text()).toContain('Eine goldene Linie zeigt, wohin der Arm zeigt.')
    await tick(8000)
    expect(w.find('.gm-line').exists()).toBe(true)
    await man(w, 'jesus').trigger('click')
    expect(w.find('.gm-line').exists()).toBe(false)
    expect(count('wrong')).toBe(0)
  })

  it('round 2: the arm points a little down; the disciples go after Jesus when he is found, then the end shows the verse (John 1,34); two mistakes still give three stars', async () => {
    const w = mountIt()
    await man(w, 'jesus').trigger('click')
    await tick(3000)
    const before = w.find('.gm-disc').attributes('style')
    expect(before).toContain('left: 23.5%')
    await man(w, 'hirte').trigger('click')
    await tick(700)
    await man(w, 'traeger').trigger('click')
    expect(count('wrong')).toBe(2)
    await tick(700)
    await man(w, 'jesus').trigger('click')
    await tick(800)
    expect(w.find('.gm-disc').attributes('style')).toContain('left: 31.5%')
    expect(useTaskProgress().parts.value).toBe(2)
    await tick(3200)
    expect(count('star')).toBe(1)
    expect(w.text()).toContain('Und ich sah es und zeugte, dass dieser ist Gottes Sohn.')
    await w.find('button').trigger('click')
    expect(w.emitted('done')![0]).toEqual([3])
    expect(problems()).toEqual([])
  })

  it('five mistakes give one star', async () => {
    const w = mountIt()
    for (let i = 0; i < 3; i++) {
      await man(w, 'bauer').trigger('click')
      await tick(700)
    }
    await man(w, 'jesus').trigger('click')
    await tick(3000)
    for (let i = 0; i < 2; i++) {
      await man(w, 'hirte').trigger('click')
      await tick(700)
    }
    await man(w, 'jesus').trigger('click')
    await tick(5000)
    await w.find('button').trigger('click')
    expect(w.emitted('done')![0]).toEqual([johannesStars(5)])
  })

  it('English and Spanish words; less motion: nothing wiggles and the disciples do not slide', async () => {
    const en = mountIt('en')
    await en.find('[data-man="bauer"]').trigger('click')
    expect(en.text()).toContain('John does not point there.')
    expect(en.find('.gm-field').attributes('aria-label')).toContain('valley of the Jordan')
    en.unmount()
    const es = mountIt('es')
    await es.find('[data-man="jesus"]').trigger('click')
    expect(es.text()).toContain('Sí, Juan lo señala a él.')
    es.unmount()
    stillMotion()
    const w = mountIt()
    expect(w.find('.gm').classes()).toContain('still')
  })
})
