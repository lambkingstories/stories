/**
 * The three new games of "Die Bergpredigt" (`bergpredigt`), mounted with sample data and played through:
 * - `selig` = GameSelig ("Whom is the word for?"): the sentence and its gift, a gift given by a tap or by dragging, right and wrong, the listeners who lift their heads, round 2 with six gifts for four
 *   listeners (two go into the basket), the four sentences once more, "Help me" after fifteen seconds, the keyboard, less motion, the end with its stars and the words of the Bible, German, English and Spanish;
 * - `scheffel` = GameScheffel ("Where does the light belong?"): the basket, the lamp, the circle of light on the floor, the table and the lampstand, who stays in the dark, round 1 without a mistake,
 *   round 2 with mistakes, the lamp dragged to a place, "Help me", the keyboard, the end;
 * - `nahblick` = GameNahblick ("Look closely"): the wreath moved by a press beside it, by dragging and by the arrow keys, the close-up of a blossom, the guest found, a blossom without a guest (one mistake
 *   for each), beside the guest (no mistake), the haze of round 1, round 2, "Help me", the end.
 * The new words are mixed into the messages of the app here (`bergpredigtNeuI18n.ts`), so that the test does not wait for them to be in `i18n/app.ts`.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import spanish from '@/i18n/app.es'
import useTaskProgress from '@/use/useTaskProgress'
import GameSelig from '@/components/molecules/games/GameSelig.vue'
import GameScheffel from '@/components/molecules/games/GameScheffel.vue'
import GameNahblick from '@/components/molecules/games/GameNahblick.vue'
import { bergStars } from '@/utils/bergpredigtGames'
import { BLESSED, LIGHT, NEAR } from './bergpredigtSamples'
import { BERGPREDIGT_WORDS } from './bergpredigtNeuI18n'

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
    out[lang] = { ...base[lang], app: { ...app, adventure: { ...app.adventure, ...BERGPREDIGT_WORDS[lang] } } }
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
const helpButton = (w: Wr) => w.findAll('button').find((b) => b.text() === 'Hilf mir')
/** A pointer event at a place given in percent of the picture (the picture is 400 x 300 pixels in the test). */
const ptr = async (el: Element, type: 'pointerdown' | 'pointermove' | 'pointerup', x: number, y: number) => {
  el.dispatchEvent(new MouseEvent(type, { bubbles: true, button: 0, clientX: x * 4, clientY: y * 3 }))
  await flushPromises()
}

// ================================================================ selig
describe('Wem gilt das Wort? (selig)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameSelig, { props: { game: BLESSED }, ...opts(locale) })
  const gift = (w: Wr, id: string) => w.find(`[data-gift="${id}"]`)
  const person = (w: Wr, id: string) => w.find(`[data-person="${id}"]`)
  /** Gives a gift by a tap on the gift and a tap on the listener (what the keyboard does). */
  const give = async (w: Wr, giftId: string, personId: string) => {
    await gift(w, giftId).trigger('click')
    await person(w, personId).trigger('click')
  }
  const R1 = [
    ['gabe-himmelreich', 'mann-leer'],
    ['gabe-trost', 'frau-traenen'],
    ['gabe-land', 'hirte'],
    ['gabe-brot', 'junger-mann']
  ] as const
  /** Round 1 played through; round 2 begins. */
  const playRound1 = async (w: Wr) => {
    for (const [g, p] of R1) {
      await give(w, g, p)
      await tick(1800)
    }
    await tick(3200)
  }

  it('the goal is every handing over (4 + 4); the hint, the round, the field as one group, four listeners as buttons, the sentence and its gift; no drawing', () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(8)
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.text()).toContain('Gib jedem Zuhörer, was Jesus ihm zusagt.')
    expect(w.find('.gm-field').attributes('aria-label')).toContain('Eine Wiese am Berghang')
    expect(w.find('.gm-fb').attributes('role')).toBe('status')
    expect(w.find('svg').exists()).toBe(false)
    expect(w.findAll('button.gm-person')).toHaveLength(4)
    expect(person(w, 'hirte').attributes('aria-label')).toBe('der Hirte mit seinem Stab')
    expect(w.text()).toContain('Jesus sagt: „Selig sind, die arm sind vor Gott. Denn das Himmelreich gehört ihnen.“')
    expect(w.findAll('button.gm-gift')).toHaveLength(1)
    expect(gift(w, 'gabe-himmelreich').classes()).toContain('shine')
    expect(gift(w, 'gabe-himmelreich').text()).toContain('Himmelreich')
    expect(w.text()).toContain('Zusagen: 0 von 8')
    expect(helpButton(w)).toBeUndefined()
    expect(problems()).toEqual([])
  })

  it('a right gift: a tick, a bright tone, the words, the listener lifts his head with the glow under him; then the next sentence and its gift', async () => {
    const w = mountIt()
    await give(w, 'gabe-himmelreich', 'mann-leer')
    expect(count('right')).toBe(1)
    expect(count('wrong')).toBe(0)
    expect(w.text()).toContain('Das ist ihm zugesagt.')
    expect(person(w, 'mann-leer').classes()).toContain('lifted')
    expect(person(w, 'mann-leer').find('.gm-mark').exists()).toBe(true)
    expect(w.find('[data-glow="mann-leer"]').exists()).toBe(true)
    expect(w.find('[data-given="mann-leer"]').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.text()).toContain('Zusagen: 1 von 8')
    expect(w.findAll('button.gm-gift')).toHaveLength(0)
    await tick(1800)
    expect(w.findAll('button.gm-gift')).toHaveLength(1)
    expect(gift(w, 'gabe-trost').exists()).toBe(true)
    expect(w.text()).toContain('Jesus sagt: „Selig sind, die Leid tragen. Denn sie sollen getröstet werden.“')
    expect(w.text()).not.toContain('Das ist ihm zugesagt.')
  })

  it('a wrong listener: the gift stays, a cross, a low tone, "This word fits someone else.", a mistake; a tap on a listener without a gift says to take a gift first', async () => {
    const w = mountIt()
    await person(w, 'hirte').trigger('click')
    expect(w.text()).toContain('Nimm zuerst eine Gabe.')
    expect(count('wrong')).toBe(0)
    await give(w, 'gabe-himmelreich', 'hirte')
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('Dieses Wort passt zu einem anderen.')
    expect(w.text()).not.toContain('meint einen anderen')
    expect(person(w, 'hirte').find('.gm-mark').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(0)
    expect(gift(w, 'gabe-himmelreich').exists()).toBe(true)
    expect(person(w, 'hirte').classes()).not.toContain('lifted')
    await give(w, 'gabe-himmelreich', 'mann-leer')
    expect(count('right')).toBe(1)
    expect(problems()).toEqual([])
  })

  it('a gift can be dragged to the listener; letting go beside the listeners is no mistake and the gift stays', async () => {
    const w = mountIt()
    const wrap = w.find('.gm-wrap').element
    const g = gift(w, 'gabe-himmelreich')
    await ptr(g.element, 'pointerdown', 50, 95)
    await ptr(wrap, 'pointermove', 40, 70)
    expect(w.find('.gm-ghost').exists()).toBe(true)
    await ptr(wrap, 'pointerup', 4, 4) // beside everybody
    expect(count('wrong')).toBe(0)
    expect(count('right')).toBe(0)
    expect(w.find('.gm-ghost').exists()).toBe(false)
    expect(gift(w, 'gabe-himmelreich').exists()).toBe(true)
    await ptr(gift(w, 'gabe-himmelreich').element, 'pointerdown', 50, 95)
    await ptr(wrap, 'pointermove', 40, 70)
    await ptr(wrap, 'pointerup', 36, 60) // on the man with the empty hands
    expect(count('right')).toBe(1)
    expect(useTaskProgress().parts.value).toBe(1)
    expect(person(w, 'mann-leer').classes()).toContain('lifted')
  })

  it('a tap on a gift takes it up (and a second tap puts it down); the pointer tap works as the click does', async () => {
    const w = mountIt()
    const wrap = w.find('.gm-wrap').element
    await ptr(gift(w, 'gabe-himmelreich').element, 'pointerdown', 50, 95)
    await ptr(wrap, 'pointerup', 50, 95)
    expect(gift(w, 'gabe-himmelreich').classes()).toContain('sel')
    expect(gift(w, 'gabe-himmelreich').attributes('aria-pressed')).toBe('true')
    expect(w.text()).toContain('Tippe jetzt auf den Zuhörer.')
    await ptr(gift(w, 'gabe-himmelreich').element, 'pointerdown', 50, 95)
    await ptr(wrap, 'pointerup', 50, 95)
    expect(gift(w, 'gabe-himmelreich').classes()).not.toContain('sel')
    await ptr(gift(w, 'gabe-himmelreich').element, 'pointerdown', 50, 95)
    await ptr(wrap, 'pointerup', 50, 95)
    await person(w, 'mann-leer').trigger('click')
    expect(count('right')).toBe(1)
  })

  it('"Help me" comes after fifteen seconds, makes the listener (and in round 1 only his gift) shine, and costs nothing', async () => {
    const w = mountIt()
    await tick(14000)
    expect(helpButton(w)).toBeUndefined()
    await tick(2000)
    await helpButton(w)!.trigger('click')
    expect(person(w, 'mann-leer').classes()).toContain('shine')
    expect(person(w, 'hirte').classes()).not.toContain('shine')
    expect(w.text()).toContain('Ein Zuhörer leuchtet. Welche Gabe passt zu ihm?')
    await give(w, 'gabe-himmelreich', 'mann-leer')
    expect(count('right')).toBe(1)
    expect(count('wrong')).toBe(0)
    expect(person(w, 'mann-leer').classes()).not.toContain('shine')
    expect(helpButton(w)).toBeUndefined()
  })

  it('round 2: six gifts and the basket, no sentence; a gift of nobody on a listener is a mistake; a right gift in any order; the two gifts of nobody go into the basket; the four sentences once more; the verse; no mistake but one gives three stars', async () => {
    const w = mountIt()
    await playRound1(w)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.text()).toContain('Wer bekommt welche Gabe? Zwei Gaben bleiben übrig.')
    expect(w.findAll('button.gm-gift')).toHaveLength(6)
    expect(w.find('.gm-basket').exists()).toBe(true)
    expect(w.find('.gm-says').exists()).toBe(false)
    expect(w.find('[data-glow]').exists()).toBe(false) // a new round: nobody has a gift yet
    expect(useTaskProgress().parts.value).toBe(4)
    await give(w, 'ablenker-truhe', 'hirte')
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('Das hat Jesus ihm nicht zugesagt.')
    expect(w.findAll('button.gm-gift')).toHaveLength(6)
    await tick(3700)
    for (const [g, p] of [['gabe-brot', 'junger-mann'], ['gabe-land', 'hirte'], ['gabe-trost', 'frau-traenen']] as const) await give(w, g, p)
    expect(w.findAll('button.gm-gift')).toHaveLength(3) // himmelreich and the two others
    await give(w, 'gabe-himmelreich', 'mann-leer')
    expect(useTaskProgress().parts.value).toBe(8)
    await tick(1600)
    expect(w.text()).toContain('Die gehören keinem von ihnen.')
    expect(w.findAll('button.gm-gift')).toHaveLength(0)
    expect(w.find('.gm-basket').classes()).toContain('full')
    await tick(1900)
    expect(w.text()).toContain('Noch einmal, was Jesus ihnen sagt.')
    await tick(1700)
    expect(w.text()).toContain('Jesus sagt: „Selig sind, die arm sind vor Gott. Denn das Himmelreich gehört ihnen.“')
    await tick(2400)
    expect(w.text()).toContain('Jesus sagt: „Selig sind, die Leid tragen. Denn sie sollen getröstet werden.“')
    await tick(2400 * 2 + 3000)
    expect(w.text()).not.toContain('Jesus sagt:')
    expect(count('star')).toBeGreaterThanOrEqual(1)
    expect(w.text()).toContain('Selig sind, die da Leid tragen; denn sie sollen getröstet werden.')
    await w.find('button').trigger('click')
    expect(w.emitted('done')![0]).toEqual([3])
    expect(problems()).toEqual([])
  })

  it('five mistakes give one star, two or fewer three stars', async () => {
    const w = mountIt()
    await playRound1(w)
    for (let i = 0; i < 5; i++) {
      await give(w, 'ablenker-mantel', 'frau-traenen')
      await tick(100)
    }
    expect(count('wrong')).toBe(5)
    for (const [g, p] of [['gabe-brot', 'junger-mann'], ['gabe-land', 'hirte'], ['gabe-trost', 'frau-traenen'], ['gabe-himmelreich', 'mann-leer']] as const) await give(w, g, p)
    await tick(20000)
    await w.find('button').trigger('click')
    expect(w.emitted('done')![0]).toEqual([bergStars(5)])
    expect(bergStars(5)).toBe(1)
    expect(bergStars(2)).toBe(3)
  })

  it('round 2 "Help me" names the listener of the gift in the hand', async () => {
    const w = mountIt()
    await playRound1(w)
    await gift(w, 'gabe-land').trigger('click')
    await tick(16000)
    await helpButton(w)!.trigger('click')
    expect(person(w, 'hirte').classes()).toContain('shine')
    expect(person(w, 'mann-leer').classes()).not.toContain('shine')
  })

  it('the keyboard: the gifts and the listeners are buttons; Enter on a gift takes it up, Enter on a listener gives it', async () => {
    const w = mountIt()
    expect(w.findAll('button.gm-gift').every((b) => b.element.tagName === 'BUTTON')).toBe(true)
    expect(w.findAll('button.gm-person').every((b) => b.element.tagName === 'BUTTON')).toBe(true)
    await gift(w, 'gabe-himmelreich').trigger('click')
    expect(gift(w, 'gabe-himmelreich').attributes('aria-pressed')).toBe('true')
    await person(w, 'mann-leer').trigger('click')
    expect(count('right')).toBe(1)
  })

  it('with less motion the page says so (the CSS stops the sliding and the pulses)', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    const w = mountIt()
    expect(w.classes()).toContain('still')
  })

  it('English and Spanish words', () => {
    expect(mountIt('en').find('.gm-field').attributes('aria-label')).toContain('A meadow on a hillside')
    expect(mountIt('es').find('.gm-field').attributes('aria-label')).toContain('Un prado en la ladera')
    expect(mountIt('en').text()).toContain('Promises: 0 of 8')
    expect(mountIt('es').text()).toContain('Jesús dice: «Selig sind')
  })
})

// ================================================================ scheffel
describe('Wohin gehört das Licht? (scheffel)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameScheffel, { props: { game: LIGHT }, ...opts(locale) })
  const spot = (w: Wr, id: string) => w.find(`[data-spot="${id}"]`)
  const person = (w: Wr, id: string) => w.find(`[data-person="${id}"]`)
  const lit = (w: Wr, id: string) => person(w, id).attributes('data-lit')
  /** Round 1 played through; round 2 begins. */
  const playRound1 = async (w: Wr) => {
    await w.find('button.gm-basket').trigger('click')
    await spot(w, 'leuchter').trigger('click')
    await tick(2700)
  }

  it('the goal is three steps (the basket, the lamp on the lampstand, and the lamp of round 2); the hint, the round, the room as one group; the basket lies over the lamp; nobody has light; no drawing', () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(3)
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.text()).toContain('Hebe den Korb ab und stelle die Lampe auf den Leuchter.')
    expect(w.find('.gm-field').attributes('aria-label')).toContain('Eine Stube')
    expect(w.find('.gm-fb').attributes('role')).toBe('status')
    expect(w.find('svg').exists()).toBe(false)
    expect(w.find('button.gm-basket').exists()).toBe(true)
    expect(w.find('[data-lamp]').exists()).toBe(false)
    expect(w.findAll('button.gm-spot')).toHaveLength(0)
    expect(lit(w, 'mutter')).toBe('no')
    expect(lit(w, 'kind')).toBe('no')
    expect(w.findAll('[data-person]')).toHaveLength(2)
    expect(w.text()).toContain('Schritte: 0 von 3')
    expect(helpButton(w)).toBeUndefined()
    expect(problems()).toEqual([])
  })

  it('the basket is taken away: a tick, "The lamp is shining.", the lamp and the three places appear, the table has light and the child on the floor has not', async () => {
    const w = mountIt()
    await w.find('button.gm-basket').trigger('click')
    expect(count('right')).toBe(1)
    expect(w.text()).toContain('Die Lampe leuchtet.')
    expect(w.find('button.gm-basket').exists()).toBe(false)
    expect(w.find('[data-lamp="tisch"]').exists()).toBe(true)
    expect(w.findAll('button.gm-spot')).toHaveLength(3)
    expect(lit(w, 'mutter')).toBe('yes')
    expect(lit(w, 'kind')).toBe('no')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.find('.gm-lit').exists()).toBe(true)
    expect(w.text()).toContain('Schritte: 1 von 3')
  })

  it('round 1 has no mistakes: a place that leaves somebody dark says who, a soft tone; the lampstand lights the room; the goal grows; round 2 follows', async () => {
    const w = mountIt()
    await w.find('button.gm-basket').trigger('click')
    await spot(w, 'boden').trigger('click')
    expect(w.text()).toContain('Die Mutter bleibt noch im Dunkeln.')
    expect(count('wrong')).toBe(0)
    expect(w.find('[data-lamp="boden"]').exists()).toBe(true)
    await spot(w, 'leuchter').trigger('click')
    expect(w.text()).toContain('Jetzt sehen alle im Haus das Licht.')
    expect(lit(w, 'mutter')).toBe('yes')
    expect(lit(w, 'kind')).toBe('yes')
    expect(useTaskProgress().parts.value).toBe(2)
    await tick(2700)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.text()).toContain('Stelle die Lampe so hin, dass alle im Haus ihr Licht sehen.')
    expect(w.findAll('[data-person]')).toHaveLength(5)
    expect(w.find('button.gm-basket').exists()).toBe(false)
    expect(w.find('[data-lamp="tisch"]').exists()).toBe(true)
  })

  it('round 2: a place that leaves somebody dark is a mistake (a cross, a low tone, who stays dark); the lampstand gives light to all five; the verse; two mistakes still give three stars', async () => {
    const w = mountIt()
    await playRound1(w)
    expect(Object.fromEntries(['grossvater', 'maedchen', 'kind', 'vater', 'mutter'].map((id) => [id, lit(w, id)]))).toEqual({ grossvater: 'yes', maedchen: 'no', kind: 'yes', vater: 'yes', mutter: 'no' })
    await spot(w, 'boden').trigger('click')
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('Der Großvater bleibt noch im Dunkeln.')
    expect(w.find('.gm-cross').exists()).toBe(true)
    await spot(w, 'tisch').trigger('click')
    expect(count('wrong')).toBe(2)
    await spot(w, 'leuchter').trigger('click')
    expect(w.text()).toContain('Alle im Haus haben Licht.')
    for (const id of ['grossvater', 'maedchen', 'kind', 'vater', 'mutter']) expect(lit(w, id)).toBe('yes')
    expect(useTaskProgress().parts.value).toBe(3)
    await tick(2600)
    expect(count('star')).toBeGreaterThanOrEqual(1)
    expect(w.text()).toContain('Also lasst euer Licht leuchten vor den Leuten, dass sie eure guten Werke sehen und euren Vater im Himmel preisen.')
    await w.find('button').trigger('click')
    expect(w.emitted('done')![0]).toEqual([3])
    expect(problems()).toEqual([])
  })

  it('the same place again is no new mistake; five mistakes give one star', async () => {
    const w = mountIt()
    await playRound1(w)
    await spot(w, 'tisch').trigger('click') // the lamp stands there already
    expect(count('wrong')).toBe(0)
    for (let i = 0; i < 5; i++) await spot(w, i % 2 ? 'tisch' : 'boden').trigger('click')
    expect(count('wrong')).toBe(5)
    await spot(w, 'leuchter').trigger('click')
    await tick(5000)
    await w.find('button').trigger('click')
    expect(w.emitted('done')![0]).toEqual([bergStars(5)])
    expect(bergStars(5)).toBe(1)
  })

  it('the lamp can be dragged to a place; letting go far from every place changes nothing', async () => {
    const w = mountIt()
    await playRound1(w)
    const wrap = w.find('.gm-wrap').element
    await ptr(w.find('[data-lamp]').element, 'pointerdown', 48, 62)
    await ptr(wrap, 'pointermove', 70, 20)
    expect(w.find('.gm-ghost').exists()).toBe(true)
    await ptr(wrap, 'pointerup', 90, 5)
    expect(w.find('.gm-ghost').exists()).toBe(false)
    expect(w.find('[data-lamp="tisch"]').exists()).toBe(true)
    expect(count('wrong')).toBe(0)
    await ptr(w.find('[data-lamp]').element, 'pointerdown', 48, 62)
    await ptr(wrap, 'pointermove', 52, 40)
    await ptr(wrap, 'pointerup', 50, 40)
    expect(w.find('[data-lamp="leuchter"]').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(3)
    expect(w.text()).toContain('Alle im Haus haben Licht.')
  })

  it('"Help me" comes after fifteen seconds: first the basket shines, then (after the basket) the lampstand', async () => {
    const w = mountIt()
    await tick(14000)
    expect(helpButton(w)).toBeUndefined()
    await tick(2000)
    await helpButton(w)!.trigger('click')
    expect(w.find('button.gm-basket').classes()).toContain('shine')
    expect(w.text()).toContain('Der Korb leuchtet. Tippe ihn an.')
    await w.find('button.gm-basket').trigger('click')
    expect(helpButton(w)).toBeUndefined()
    await tick(16000)
    await helpButton(w)!.trigger('click')
    expect(spot(w, 'leuchter').classes()).toContain('shine')
    expect(spot(w, 'boden').classes()).not.toContain('shine')
    expect(w.text()).toContain('Ein Platz leuchtet. Stelle die Lampe dorthin.')
    await spot(w, 'leuchter').trigger('click')
    expect(count('wrong')).toBe(0)
  })

  it('the keyboard: the basket and the places are buttons with a name of their own; the place that has the lamp is marked', async () => {
    const w = mountIt()
    expect(w.find('button.gm-basket').attributes('aria-label')).toBe('Der Korb über der Lampe')
    await w.find('button.gm-basket').trigger('click')
    expect(spot(w, 'boden').attributes('aria-label')).toBe('Die Lampe auf den Boden stellen')
    expect(spot(w, 'tisch').attributes('aria-label')).toBe('Die Lampe auf den Tisch stellen')
    expect(spot(w, 'leuchter').attributes('aria-label')).toBe('Die Lampe auf den Leuchter stellen')
    expect(spot(w, 'tisch').attributes('aria-pressed')).toBe('true')
    expect(spot(w, 'boden').attributes('aria-pressed')).toBe('false')
    expect(w.findAll('button.gm-spot').every((b) => b.element.tagName === 'BUTTON')).toBe(true)
  })

  it('with less motion the page says so; English and Spanish words', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    expect(mountIt().classes()).toContain('still')
    expect(mountIt('en').find('.gm-field').attributes('aria-label')).toContain('A room with a lamp')
    expect(mountIt('es').find('.gm-field').attributes('aria-label')).toContain('Una sala con una lámpara')
    expect(mountIt('en').text()).toContain('Steps: 0 of 3')
  })
})

// ================================================================ nahblick
describe('Schau genau hin (nahblick)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameNahblick, { props: { game: NEAR }, ...opts(locale) })
  const field = (w: Wr) => w.find('.gm-field').element
  const wreathAt = (w: Wr) => w.find('[data-wreath]').attributes('data-wreath')
  const near = (w: Wr, id: string) => w.find(`[data-near="${id}"]`)
  /** A press beside the wreath puts it there (the middle of the wreath is at the place). */
  const moveTo = async (w: Wr, x: number, y: number) => {
    await ptr(field(w), 'pointerdown', x, y)
    await ptr(field(w), 'pointerup', x, y)
  }
  /** The tap on the guest of a blossom: the place of the guest in the close-up (nx, ny) for a wreath whose middle is on the blossom. */
  const tapGuest = async (w: Wr, bx: number, by: number, nx: number, ny: number) => {
    const x = bx + ((nx - 50) / 100) * 27.2
    const y = by + ((ny - 50) / 100) * 27.2 * 1.5
    await ptr(field(w), 'pointerdown', x, y)
    await ptr(field(w), 'pointerup', x, y)
  }
  /** Round 1 played through; round 2 begins. */
  const playRound1 = async (w: Wr) => {
    await moveTo(w, 12, 24)
    await tapGuest(w, 12, 24, 68, 70)
    await moveTo(w, 37, 24)
    await tapGuest(w, 37, 24, 68, 70)
    await tick(3500)
  }

  it('the goal is every guest (2 + 4); the hint, the round, the field as one group that takes the focus, the haze over the right blossoms; the wreath in the middle; nothing close up yet; no drawing', () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(6)
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.text()).toContain('Fahre mit dem Kranz über die Blumen und finde, wer in den Blüten sitzt.')
    expect(w.find('.gm-field').attributes('aria-label')).toContain('Eine Blumenwiese')
    expect(w.find('.gm-field').attributes('tabindex')).toBe('0')
    expect(w.find('.gm-fb').attributes('role')).toBe('status')
    expect(w.find('svg').exists()).toBe(false)
    expect(w.find('.gm-haze').exists()).toBe(true)
    expect(wreathAt(w)).toBe('50,50')
    expect(w.find('[data-near]').exists()).toBe(false)
    expect(w.find('[data-wreath]').attributes('aria-label')).toBe('Der Kranz aus Olivenzweigen')
    expect(w.text()).toContain('Gäste: 0 von 2')
    expect(helpButton(w)).toBeUndefined()
    expect(problems()).toEqual([])
  })

  it('a press beside the wreath puts it there; over a blossom it shows the blossom close up with its guest; over the meadow nothing', async () => {
    const w = mountIt()
    await moveTo(w, 12, 24)
    expect(wreathAt(w)).toBe('12,24')
    expect(near(w, 'b1').exists()).toBe(true)
    expect(w.find('[data-guest="biene"]').exists()).toBe(true)
    expect(near(w, 'b1').find('img').attributes('src')).toContain('nah-1')
    await moveTo(w, 24, 74)
    expect(near(w, 'b1').exists()).toBe(false)
    expect(near(w, 'b2').exists()).toBe(true)
    expect(w.find('[data-guest]').exists()).toBe(false) // a blossom without a guest in this round
    await moveTo(w, 50, 50)
    expect(w.find('[data-near]').exists()).toBe(false)
    // a blossom under the haze in round 1 is not shown
    await moveTo(w, 56, 74)
    expect(w.find('[data-near]').exists()).toBe(false)
    expect(w.find('.gm-sr').text()).toBe('')
    await moveTo(w, 12, 24)
    expect(w.find('.gm-sr').text()).toBe('Du siehst eine Blüte ganz nah.')
  })

  it('a tap on the guest: it is found (a tone, "Eine Biene!", the picture joins the row), one more part of the goal; the same guest again says so; no mistake', async () => {
    const w = mountIt()
    await moveTo(w, 12, 24)
    await tapGuest(w, 12, 24, 68, 70)
    expect(count('found')).toBe(1)
    expect(w.text()).toContain('Eine Biene!')
    expect(w.findAll('.gm-foundone')).toHaveLength(1)
    expect(w.find('.gm-foundone').text()).toContain('Eine Biene')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.text()).toContain('Gäste: 1 von 2')
    expect(w.find('[data-guest="biene"]').classes()).toContain('got')
    await tapGuest(w, 12, 24, 68, 70)
    expect(w.text()).toContain('Den hast du schon gefunden.')
    expect(count('found')).toBe(1)
    expect(count('wrong')).toBe(0)
  })

  it('beside the guest is no mistake; a blossom without a guest says "Nobody sits here." and is one mistake, however often it is tapped', async () => {
    const w = mountIt()
    await moveTo(w, 12, 24)
    await ptr(field(w), 'pointerdown', 12, 24) // the middle of the blossom, far from the guest
    await ptr(field(w), 'pointerup', 12, 24)
    expect(w.text()).toContain('Fast. Tippe genau auf den Gast.')
    expect(count('wrong')).toBe(0)
    await moveTo(w, 24, 74)
    await ptr(field(w), 'pointerdown', 24, 74)
    await ptr(field(w), 'pointerup', 24, 74)
    expect(w.text()).toContain('Hier sitzt niemand.')
    expect(count('wrong')).toBe(1)
    expect(w.find('.gm-cross').exists()).toBe(true)
    await ptr(field(w), 'pointerdown', 24, 74)
    await ptr(field(w), 'pointerup', 24, 74)
    expect(count('wrong')).toBe(1)
    expect(useTaskProgress().parts.value).toBe(0)
  })

  it('a press on the wreath and a drag moves it (no tap); the wreath keeps inside the picture', async () => {
    const w = mountIt()
    await moveTo(w, 12, 24)
    await ptr(field(w), 'pointerdown', 12, 24)
    await ptr(field(w), 'pointermove', 30, 40)
    await ptr(field(w), 'pointermove', 60, 55)
    await ptr(field(w), 'pointerup', 60, 55)
    expect(wreathAt(w)).toBe('60,55')
    expect(count('wrong')).toBe(0)
    await moveTo(w, 100, 100)
    const [x, y] = wreathAt(w)!.split(',').map(Number)
    expect(x).toBeLessThanOrEqual(94)
    expect(y).toBeLessThanOrEqual(95)
  })

  it('round 1 played through: both guests found, "All the guests are found.", round 2 with all seven blossoms and no haze', async () => {
    const w = mountIt()
    await playRound1(w)
    expect(useTaskProgress().parts.value).toBe(2)
    await tick(100)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.text()).toContain('Schau jede Blüte genau an. Vier Gäste sitzen auf der Wiese.')
    expect(w.find('.gm-haze').exists()).toBe(false)
    expect(w.text()).toContain('Gäste: 0 von 4')
    expect(w.findAll('.gm-foundone')).toHaveLength(0)
    expect(wreathAt(w)).toBe('50,50')
    await moveTo(w, 56, 74)
    expect(near(w, 'b4').exists()).toBe(true) // now the blossom of the right is there
  })

  it('round 2: four guests, three blossoms without one; the verse and the stars at the end (one mistake still gives three stars)', async () => {
    const w = mountIt()
    await playRound1(w)
    await moveTo(w, 12, 24) // a blossom without a guest in round 2
    await ptr(field(w), 'pointerdown', 12, 24)
    await ptr(field(w), 'pointerup', 12, 24)
    expect(count('wrong')).toBe(1)
    for (const [bx, by, nx, ny] of [[24, 74, 32, 70], [56, 74, 32, 70], [82, 74, 32, 70], [88, 24, 68, 70]] as const) {
      await moveTo(w, bx, by)
      await tapGuest(w, bx, by, nx, ny)
    }
    expect(useTaskProgress().parts.value).toBe(6)
    expect(w.findAll('.gm-foundone')).toHaveLength(4)
    expect(w.text()).toContain('Gäste: 4 von 4')
    await tick(1300)
    expect(w.text()).toContain('Alle Gäste sind gefunden.')
    await tick(2200)
    expect(count('star')).toBeGreaterThanOrEqual(1)
    expect(w.text()).toContain('Schaut die Lilien auf dem Felde, wie sie wachsen: sie arbeiten nicht, auch spinnen sie nicht.')
    await w.find('button').trigger('click')
    expect(w.emitted('done')![0]).toEqual([3])
    expect(problems()).toEqual([])
  })

  it('three mistakes (three blossoms without a guest) give two stars', async () => {
    const w = mountIt()
    await playRound1(w)
    for (const [bx, by] of [[12, 24], [37, 24], [62, 24]] as const) {
      await moveTo(w, bx, by)
      await ptr(field(w), 'pointerdown', bx, by)
      await ptr(field(w), 'pointerup', bx, by)
    }
    expect(count('wrong')).toBe(3)
    expect(bergStars(3)).toBe(2)
    await moveTo(w, 24, 74)
    await tapGuest(w, 24, 74, 32, 70)
    for (const [bx, by, nx, ny] of [[56, 74, 32, 70], [82, 74, 32, 70], [88, 24, 68, 70]] as const) {
      await moveTo(w, bx, by)
      await tapGuest(w, bx, by, nx, ny)
    }
    await tick(5000)
    await w.find('button').trigger('click')
    expect(w.emitted('done')![0]).toEqual([2])
  })

  it('the keyboard: the field takes the focus, the arrow keys move the wreath, Enter taps in its middle', async () => {
    const w = mountIt()
    const f = w.find('.gm-field')
    await f.trigger('keydown', { key: 'ArrowRight' })
    expect(wreathAt(w)).toBe('54,50')
    await f.trigger('keydown', { key: 'ArrowDown' })
    expect(wreathAt(w)).toBe('54,56')
    await f.trigger('keydown', { key: 'ArrowLeft' })
    await f.trigger('keydown', { key: 'ArrowUp' })
    expect(wreathAt(w)).toBe('50,50')
    await moveTo(w, 24, 74)
    await f.trigger('keydown', { key: 'Enter' })
    expect(w.text()).toContain('Hier sitzt niemand.')
    expect(count('wrong')).toBe(1)
    await moveTo(w, 12, 24)
    await f.trigger('keydown', { key: ' ' })
    expect(w.text()).toContain('Fast. Tippe genau auf den Gast.')
  })

  it('"Help me" comes after fifteen seconds without a find and shows a soft ring round the nearest blossom with a guest that has not been found; it costs nothing', async () => {
    const w = mountIt()
    await tick(14000)
    expect(helpButton(w)).toBeUndefined()
    await tick(2000)
    await helpButton(w)!.trigger('click')
    expect(w.find('[data-help="b3"]').exists()).toBe(true) // from the middle of the picture b3 is nearer than b1
    expect(w.text()).toContain('Ein Ring zeigt eine Blüte. Schau dort genau hin.')
    await moveTo(w, 37, 24)
    expect(w.find('[data-help]').exists()).toBe(false) // any action puts the help away
    expect(count('wrong')).toBe(0)
  })

  it('with less motion the page says so; English and Spanish words', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    expect(mountIt().classes()).toContain('still')
    expect(mountIt('en').find('.gm-field').attributes('aria-label')).toContain('A meadow of flowers')
    expect(mountIt('es').find('.gm-field').attributes('aria-label')).toContain('Un prado de flores')
    expect(mountIt('en').text()).toContain('Guests: 0 of 2')
  })
})
