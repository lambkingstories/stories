/**
 * "To the uttermost part of the earth" (`zeugen` = GameZeugen), "Everyone hears it" (`sprachen` = GameSprachen) and "Fill the baskets" (`koerbe` = GameKoerbe) of "Pfingsten",
 * mounted with sample data and played through: right and wrong drops (a cross, a word, a low tone, a mistake), the keyboard, "Help me" after fifteen seconds, the rounds,
 * the goal for "Go on" (`useTaskProgress`), the end with its stars and the words of the Bible, German, English and Spanish words.
 * The new words are mixed into the messages of the app here (`pfingstenNeuI18n.ts`), so that the test does not wait for them to be in `i18n/app.ts`.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import spanish from '@/i18n/app.es'
import useTaskProgress from '@/use/useTaskProgress'
import GameZeugen from '@/components/molecules/games/GameZeugen.vue'
import GameSprachen from '@/components/molecules/games/GameSprachen.vue'
import GameKoerbe from '@/components/molecules/games/GameKoerbe.vue'
import { osterStars } from '@/utils/osternGames'
import { FILL, TONGUES, WITNESS } from './pfingstenSamples'
import { PFINGSTEN_WORDS } from './pfingstenNeuI18n'

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
    out[lang] = { ...base[lang], app: { ...app, adventure: { ...app.adventure, ...PFINGSTEN_WORDS[lang] } } }
  }
  return out
}
const MESSAGES = allMessages()
const mk = (locale: 'de' | 'en' | 'es') => createI18n({ legacy: false, locale, fallbackLocale: 'de', messages: MESSAGES as never, missingWarn: false, fallbackWarn: false })
const opts = (locale: 'de' | 'en' | 'es' = 'de') => ({ global: { plugins: [mk(locale)], stubs: { RouterLink: true } }, attachTo: document.body })

let warnings: string[] = []
const boxes = new WeakMap<Element, { left: number; top: number; right: number; bottom: number }>()
const box = (left: number, top: number, w: number, h: number) => ({ left, top, right: left + w, bottom: top + h, width: w, height: h, x: left, y: top, toJSON: () => ({}) })
beforeEach(() => {
  played.length = 0
  warnings = []
  useTaskProgress().reset()
  vi.useFakeTimers()
  // every element is 100 x 100 pixels at the top left unless the test says otherwise: a click at (x, y) is (x %, y %) of the field
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
})
const problems = () => warnings.filter((w) => /not defined on instance|is not a function|Unhandled error|ERROR|Missing required prop|Not found/.test(w))
const tick = async (ms: number) => {
  await vi.advanceTimersByTimeAsync(ms)
  await flushPromises()
}
const count = (name: string) => played.filter((p) => p === name).length
const pointer = (el: Element | Window, type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel', x = 0, y = 0) =>
  el.dispatchEvent(new MouseEvent(type, { bubbles: true, button: 0, buttons: type === 'pointerup' ? 0 : 1, clientX: x, clientY: y }))
type Wr = ReturnType<typeof mount>
/** A tap on a button of a strip (pointer down and up at the same place). */
const tapThing = async (w: Wr, sel: string) => {
  const el = w.find(sel).element
  pointer(el, 'pointerdown', 5, 5)
  pointer(window, 'pointerup', 6, 5)
  await flushPromises()
}

// ---------------------------------------------------------------- zeugen
describe('Bis an das Ende der Erde (zeugen)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameZeugen, { props: { game: WITNESS }, ...opts(locale) })
  /** Round 1: a place is chosen in the strip and the field is tapped at (x, y) percent. */
  const put = async (w: Wr, id: string, x: number, y = 50) => {
    await tapThing(w, `[data-item="${id}"]`)
    pointer(w.find('.gm-field').element, 'pointerdown', x, y)
    await flushPromises()
  }
  /** Round 2: the finger pulls from the middle and lets go at radius `r`. */
  const pull = async (w: Wr, r: number) => {
    pointer(w.find('.gm-field').element, 'pointerdown', 52, 50)
    pointer(window, 'pointermove', 50 + r - 2, 50)
    pointer(window, 'pointerup', 50 + r, 50)
    await flushPromises()
  }

  it('the goal is four places and three stretches; four rings, the strip with four places, the round, the hint', () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(7)
    expect(w.findAll('.gm-ring')).toHaveLength(4)
    expect(w.findAll('.gm-thing')).toHaveLength(4)
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.text()).toContain('Leg die Orte in die Ringe.')
    expect(w.find('.gm-field').attributes('aria-label')).toBe('Die Karte von oben. In der Mitte liegt Jerusalem, ringsum die Ringe.')
    expect(w.find('.gm-fb').attributes('role')).toBe('status')
    expect(w.find('svg').exists()).toBe(false)
    expect(problems()).toEqual([])
  })

  it('round 1: the right place into the next ring stays (tick, click); a place out of order springs back with a cross, a word and a low tone', async () => {
    const w = mountIt()
    await put(w, 'ort-jerusalem', 50)
    expect(w.find('[data-place="ort-jerusalem"]').exists()).toBe(true)
    expect(count('snap')).toBe(1)
    expect(w.find('.gm-mark').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(1)
    await put(w, 'ort-samarien', 50 + 30)
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('Noch nicht. Zuerst kommt: Judäa.')
    expect(w.find('[data-place="ort-samarien"]').exists()).toBe(false)
    expect(w.find('[data-item="ort-samarien"]').exists()).toBe(true)
  })

  it('both rounds played through: too short is no mistake, too far is one; the end shows the verse and gives the stars', async () => {
    const w = mountIt()
    await put(w, 'ort-jerusalem', 50)
    await put(w, 'ort-judaea', 50 + 18)
    await put(w, 'ort-ende', 50 + 42)
    await put(w, 'ort-samarien', 50 + 30)
    await put(w, 'ort-ende', 50 + 42)
    expect(w.text()).toContain('Alle Orte liegen in ihren Ringen!')
    await tick(2900)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.findAll('.gm-thing')).toHaveLength(0)
    expect(w.findAll('.gm-place')).toHaveLength(4)
    await pull(w, 15)
    expect(w.text()).toContain('Weiter hinaus!')
    expect(count('wrong')).toBe(1)
    await pull(w, 34)
    expect(count('wrong')).toBe(2)
    expect(w.text()).toContain('Zu weit! Erst bis hier: Judäa.')
    await pull(w, 25)
    await pull(w, 37)
    await pull(w, 47)
    expect(useTaskProgress().parts.value).toBe(7)
    expect(w.text()).toContain('Das Licht reicht bis an das Ende der Erde!')
    await tick(2500)
    expect(count('star')).toBe(1)
    expect(w.text()).toContain('meine Zeugen sein zu Jerusalem und in ganz Judäa und Samarien und bis an das Ende der Erde')
    await w.find('button').trigger('click')
    expect(w.emitted('done')![0]).toEqual([osterStars(2)])
    expect(problems()).toEqual([])
  })

  it('the keyboard: right/left choose a place, up/down a ring, Enter puts it; in round 2 the arrows move the light and Enter lets go', async () => {
    const w = mountIt()
    const f = w.find('.gm-field')
    // the strip is mixed: find Jerusalem by stepping to the right
    for (let k = 0; k < 4 && !w.find('[data-item="ort-jerusalem"]').classes().includes('sel'); k++) await f.trigger('keydown', { key: 'ArrowRight' })
    expect(w.find('[data-item="ort-jerusalem"]').classes()).toContain('sel')
    await f.trigger('keydown', { key: 'ArrowUp' })
    expect(w.text()).toContain('Jerusalem in Ring 1')
    await f.trigger('keydown', { key: 'Enter' })
    expect(w.find('[data-place="ort-jerusalem"]').exists()).toBe(true)
  })

  it('"Help me" comes after fifteen seconds and marks the ring of the next place', async () => {
    const w = mountIt()
    await tick(14000)
    expect(w.text()).not.toContain('Hilf mir')
    await tick(2000)
    const help = w.findAll('button').find((b) => b.text() === 'Hilf mir')!
    await help.trigger('click')
    expect(w.find('[data-ring="0"]').classes()).toContain('help')
    expect(w.text()).toContain('Zuerst kommt: Jerusalem.')
  })

  it('English and Spanish words', async () => {
    const en = mountIt('en')
    expect(en.find('.gm-field').attributes('aria-label')).toContain('Jerusalem lies in the middle')
    const es = mountIt('es')
    expect(es.find('.gm-field').attributes('aria-label')).toContain('Jerusalén está en el centro')
  })
})

// ---------------------------------------------------------------- sprachen
describe('Jeder hört es (sprachen)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameSprachen, { props: { game: TONGUES }, ...opts(locale) })
  const bring = async (w: Wr, guest: string, land: string) => {
    await tapThing(w, `[data-guest="${guest}"]`)
    await w.find(`[data-land="${land}"]`).trigger('click')
  }

  it('the goal is every guest; the lands are buttons with names; round 1 shows the home pictures', () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(5)
    expect(w.findAll('.gm-land')).toHaveLength(4)
    expect(w.find('[data-land="rom"]').attributes('aria-label')).toBe('Rom')
    expect(w.findAll('.gm-guest')).toHaveLength(2)
    expect(w.findAll('.gm-homepic')).toHaveLength(2)
    expect(problems()).toEqual([])
  })

  it('a guest on a wrong land: a cross, "Das ist nicht seine Heimat", a mistake; on his own land he stays with the ear', async () => {
    const w = mountIt()
    await bring(w, 'rom', 'kreta')
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('Das ist nicht seine Heimat.')
    expect(w.find('[data-arrived="rom"]').exists()).toBe(false)
    await bring(w, 'rom', 'rom')
    expect(w.find('[data-arrived="rom"]').exists()).toBe(true)
    expect(w.text()).toContain('Ein Gast aus Rom hört es in seiner Sprache!')
    expect(useTaskProgress().parts.value).toBe(1)
  })

  it('a guest can be dragged; letting go beside the lands is no mistake', async () => {
    const w = mountIt()
    const g = w.find('[data-guest="kreta"]').element
    pointer(g, 'pointerdown', 10, 90)
    pointer(window, 'pointermove', 60, 10)
    pointer(window, 'pointerup', 60, 10)
    await flushPromises()
    expect(w.text()).toContain('Bring den Gast auf ein Land.')
    expect(count('wrong')).toBe(0)
    pointer(w.find('[data-guest="kreta"]').element, 'pointerdown', 10, 90)
    pointer(window, 'pointermove', 30, 60)
    pointer(window, 'pointerup', 35, 55)
    await flushPromises()
    expect(w.find('[data-arrived="kreta"]').exists()).toBe(true)
  })

  it('both rounds: round 2 has no home pictures, "Help me" shows one and marks the land; the end gives the verse and the stars', async () => {
    const w = mountIt()
    await bring(w, 'rom', 'rom')
    await bring(w, 'kreta', 'kreta')
    await tick(2900)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.findAll('.gm-homepic')).toHaveLength(0)
    await tick(16000)
    await w.findAll('button').find((b) => b.text() === 'Hilf mir')!.trigger('click')
    expect(w.findAll('.gm-homepic')).toHaveLength(1)
    expect(w.find('[data-land="parther"]').classes()).toContain('help')
    await bring(w, 'parther', 'aegypten')
    await bring(w, 'parther', 'parther')
    await bring(w, 'aegypten', 'aegypten')
    await bring(w, 'rom', 'rom')
    await tick(2500)
    expect(w.text()).toContain('Wir hören sie mit unsern Zungen die großen Taten Gottes reden.')
    await w.find('button').trigger('click')
    expect(w.emitted('done')![0]).toEqual([osterStars(1)])
  })

  it('the keyboard: right chooses a guest, down a land, Enter brings him', async () => {
    const w = mountIt()
    const f = w.find('.gm-field')
    await f.trigger('keydown', { key: 'ArrowRight' })
    await f.trigger('keydown', { key: 'ArrowDown' })
    expect(w.text()).toContain('Ein Gast aus Rom: Rom.')
    await f.trigger('keydown', { key: 'Enter' })
    expect(w.find('[data-arrived="rom"]').exists()).toBe(true)
  })

  it('English words', () => {
    const w = mountIt('en')
    expect(w.find('.gm-field').attributes('aria-label')).toBe('The map with the lands around Jerusalem.')
  })
})

// ---------------------------------------------------------------- koerbe
describe('Körbe füllen (koerbe)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameKoerbe, { props: { game: FILL }, ...opts(locale) })
  const give = async (w: Wr, gift: number, family: number) => {
    await tapThing(w, `[data-gift="${gift}"]`)
    await w.find(`[data-family="${family}"]`).trigger('click')
  }

  it('the goal is every family; the families show their need as empty loaf outlines; the gifts show their size as loaf marks', () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(7)
    expect(w.findAll('.gm-fam')).toHaveLength(3)
    expect(w.find('[data-family="2"]').findAll('.gm-need .gm-loaf')).toHaveLength(3)
    expect(w.find('[data-gift="2"]').findAll('.gm-marks .gm-loaf')).toHaveLength(2)
    expect(w.find('[data-family="1"]').attributes('aria-label')).toBe('Der Vater mit seinem Kind: 0 von 2 Broten')
    expect(problems()).toEqual([])
  })

  it('too much for a family: a cross, a word, a mistake; a gift in a basket can be taken back without a mistake', async () => {
    const w = mountIt()
    await give(w, 2, 0)
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('Das ist mehr, als sie braucht.')
    await give(w, 0, 2)
    expect(w.find('[data-family="2"]').attributes('aria-label')).toBe('Die Mutter mit zwei Kindern: 1 von 3 Broten')
    await w.find('[data-chip="0"]').trigger('click')
    expect(w.text()).toContain('Die Gabe liegt wieder auf der Matte.')
    expect(w.find('[data-gift="0"]').exists()).toBe(true)
    expect(count('wrong')).toBe(1)
  })

  it('a dead end: when nothing fits any more the game says so, and "Help me" takes a gift back', async () => {
    const w = mountIt()
    await give(w, 0, 2)
    await give(w, 1, 1)
    await give(w, 2, 2)
    expect(w.text()).toContain('Nimm eine Gabe zurück und probier es anders.')
    await tick(16000)
    await w.findAll('button').find((b) => b.text() === 'Hilf mir')!.trigger('click')
    expect(w.find('[data-gift="2"]').exists()).toBe(true)
  })

  it('both rounds played through: every family glad, the verse, the stars', async () => {
    const w = mountIt()
    await give(w, 0, 0)
    await give(w, 2, 1)
    await give(w, 1, 2)
    await give(w, 3, 2)
    expect(w.text()).toContain('Jede Familie hat genug, und nichts ist übrig!')
    expect(useTaskProgress().parts.value).toBe(3)
    await tick(3100)
    expect(w.text()).toContain('Runde 2 von 2')
    // needs 2, 3, 4, 5; gifts 1, 1, 2, 2, 3, 5
    await give(w, 5, 3)
    await give(w, 4, 1)
    await give(w, 2, 2)
    await give(w, 3, 2)
    await give(w, 0, 0)
    await give(w, 1, 0)
    await tick(2700)
    expect(w.text()).toContain('Und man gab einem jeglichen, was ihm not war.')
    await w.find('button').trigger('click')
    expect(w.emitted('done')![0]).toEqual([osterStars(0)])
  })

  it('the keyboard: right chooses a gift, down a family, Enter gives it, Delete takes it back', async () => {
    const w = mountIt()
    const f = w.find('.gm-field')
    await f.trigger('keydown', { key: 'ArrowRight' })
    await f.trigger('keydown', { key: 'ArrowDown' })
    await f.trigger('keydown', { key: 'Enter' })
    expect(w.find('[data-family="0"]').attributes('aria-label')).toBe('Die alte Frau: 1 von 1 Broten')
    await f.trigger('keydown', { key: 'Delete' })
    expect(w.find('[data-family="0"]').attributes('aria-label')).toBe('Die alte Frau: 0 von 1 Broten')
  })

  it('English words', () => {
    const w = mountIt('en')
    expect(w.find('[data-family="0"]').attributes('aria-label')).toBe('Die alte Frau: 0 of 1 loaves')
  })
})
