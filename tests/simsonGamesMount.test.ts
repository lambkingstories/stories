/**
 * The three new games of "Simson" (`simson`), mounted with sample data and played through:
 * - `meiden` = GameMeiden ("What must she avoid?"): a thing put by a tap or by dragging, right and wrong (with the words of the angel), the woman who nods, round 2 with the things from the vine,
 *   "Help me" after fifteen seconds, the keyboard, the end with its stars and the verse (Judges 13,14), English and Spanish;
 * - `raetsel` = GameRaetsel ("Sweet and strong"): the stair from the top down, a card on the wrong step, a card dragged, the end with the honey and the lion side by side and the riddle as the verse;
 * - `torheben` = GameTorheben ("Lift out the gate"): the bar first, a part that still holds, the load on Samson's shoulders, dragging a part to Samson, round 2 with the posts, the end.
 * The new words are mixed into the messages of the app here (`simsonNeuI18n.ts`), so that the test does not depend on their place in `i18n/app.ts`.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import spanish from '@/i18n/app.es'
import useTaskProgress from '@/use/useTaskProgress'
import GameMeiden from '@/components/molecules/games/GameMeiden.vue'
import GameRaetsel from '@/components/molecules/games/GameRaetsel.vue'
import GameTorheben from '@/components/molecules/games/GameTorheben.vue'
import { simsonStars } from '@/utils/simsonGames'
import { AVOID, GATE, RIDDLE } from './simsonSamples'
import { SIMSON_WORDS } from './simsonNeuI18n'

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
    out[lang] = { ...base[lang], app: { ...app, adventure: { ...app.adventure, ...SIMSON_WORDS[lang] } } }
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

// ================================================================ meiden
describe('Was soll sie meiden? (meiden)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameMeiden, { props: { game: AVOID }, ...opts(locale) })
  const item = (w: Wr, id: string) => w.find(`[data-item="${id}"]`)
  const target = (w: Wr, t: 'korb' | 'tuch') => w.find(`[data-target="${t}"]`)
  /** Puts a thing by a tap on it and a tap on the basket or the cloth (what the keyboard does). */
  const put = async (w: Wr, id: string, t: 'korb' | 'tuch') => {
    await item(w, id).trigger('click')
    await target(w, t).trigger('click')
  }
  const R1 = [['wasser', 'korb'], ['wein', 'tuch'], ['milch', 'korb'], ['starkes', 'tuch']] as const
  const R2 = [['brot', 'korb'], ['trauben', 'tuch'], ['feigen', 'korb'], ['rosinen', 'tuch'], ['oliven', 'korb'], ['traubensaft', 'tuch']] as const
  const playRound = async (w: Wr, moves: readonly (readonly [string, 'korb' | 'tuch'])[]) => {
    for (const [id, t] of moves) await put(w, id, t)
    await tick(3000)
  }

  it('the goal is every thing (4 + 6); the hint, the round, the field as one group, the basket and the cloth as buttons, four things on the table; no drawing', () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(10)
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.text()).toContain('Was darf die Frau trinken? Der Engel hat Wein und starkes Getränk verboten.')
    expect(w.find('.gm-field').attributes('aria-label')).toContain('Der Hof vor Manoachs Haus')
    expect(w.find('.gm-fb').attributes('role')).toBe('status')
    expect(w.find('svg').exists()).toBe(false)
    expect(w.findAll('button.gm-target')).toHaveLength(2)
    expect(target(w, 'korb').attributes('aria-label')).toBe('Der Korb: Das darf sie essen und trinken.')
    expect(w.findAll('button.gm-item').map((b) => b.attributes('data-item'))).toEqual(['wasser', 'wein', 'milch', 'starkes'])
    expect(item(w, 'wein').attributes('aria-label')).toBe('ein Becher Wein')
    expect(w.text()).toContain('Gelegt: 0 von 10')
    expect(helpButton(w)).toBeUndefined()
    expect(problems()).toEqual([])
  })

  it('a right place: a tick, a bright tone, the words, the thing lies in the basket and the woman nods; a forbidden thing on the cloth: "Das hat der Engel verboten."', async () => {
    const w = mountIt()
    await put(w, 'wasser', 'korb')
    expect(count('right')).toBe(1)
    expect(w.text()).toContain('Das darf sie.')
    expect(target(w, 'korb').find('.gm-mark').exists()).toBe(true)
    expect(target(w, 'korb').find('[data-in="wasser"]').exists()).toBe(true)
    expect(w.find('.gm-woman').classes()).toContain('nod')
    expect(item(w, 'wasser').exists()).toBe(false)
    expect(useTaskProgress().parts.value).toBe(1)
    await put(w, 'wein', 'tuch')
    expect(w.text()).toContain('Das hat der Engel verboten.')
    expect(target(w, 'tuch').find('[data-in="wein"]').exists()).toBe(true)
    expect(w.text()).toContain('Gelegt: 2 von 10')
  })

  it('a wrong place: the thing stays on the table, a cross, a low tone, the words of the angel, a mistake; a tap on the basket without a thing says to take one first', async () => {
    const w = mountIt()
    await target(w, 'korb').trigger('click')
    expect(w.text()).toContain('Nimm zuerst etwas vom Tisch.')
    await put(w, 'wein', 'korb')
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('Das hat der Engel verboten.')
    expect(target(w, 'korb').find('.gm-mark').exists()).toBe(true)
    expect(item(w, 'wein').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(0)
    await tick(3700)
    await put(w, 'milch', 'tuch')
    expect(count('wrong')).toBe(2)
    expect(w.text()).toContain('Das hat der Engel nicht verboten.')
    expect(problems()).toEqual([])
  })

  it('a thing can be dragged onto the basket or the cloth; letting go elsewhere is no mistake', async () => {
    const w = mountIt()
    const wrap = w.find('.gm-wrap').element
    await ptr(item(w, 'starkes').element, 'pointerdown', 50, 95)
    await ptr(wrap, 'pointermove', 50, 60)
    expect(w.find('.gm-ghost').exists()).toBe(true)
    await ptr(wrap, 'pointerup', 50, 10) // over the woman, not on a place
    expect(count('wrong') + count('right')).toBe(0)
    expect(item(w, 'starkes').exists()).toBe(true)
    await ptr(item(w, 'starkes').element, 'pointerdown', 50, 95)
    await ptr(wrap, 'pointermove', 70, 80)
    await ptr(wrap, 'pointerup', 80, 74) // on the cloth
    expect(count('right')).toBe(1)
    expect(target(w, 'tuch').find('[data-in="starkes"]').exists()).toBe(true)
  })

  it('a tap on a thing takes it up and a second tap puts it down (aria-pressed)', async () => {
    const w = mountIt()
    await item(w, 'milch').trigger('click')
    expect(item(w, 'milch').classes()).toContain('sel')
    expect(item(w, 'milch').attributes('aria-pressed')).toBe('true')
    expect(w.text()).toContain('Tippe jetzt auf den Korb oder auf das Tuch.')
    expect(target(w, 'korb').classes()).toContain('armed')
    await item(w, 'milch').trigger('click')
    expect(item(w, 'milch').attributes('aria-pressed')).toBe('false')
  })

  it('"Help me" after fifteen seconds makes the next thing and its place shine and costs nothing', async () => {
    const w = mountIt()
    await tick(14000)
    expect(helpButton(w)).toBeUndefined()
    await tick(2000)
    await helpButton(w)!.trigger('click')
    expect(item(w, 'wasser').classes()).toContain('shine')
    expect(target(w, 'korb').classes()).toContain('shine')
    expect(target(w, 'tuch').classes()).not.toContain('shine')
    expect(w.text()).toContain('Ein Ding leuchtet und auch der Platz, wo es hingehört.')
    await put(w, 'wasser', 'korb')
    expect(item(w, 'wein').classes()).not.toContain('shine')
    expect(helpButton(w)).toBeUndefined()
  })

  it('round 2: six things; raisins and grape juice "come from the vine"; the end shows the verse (Judges 13,14); no mistake gives three stars', async () => {
    const w = mountIt()
    await playRound(w, R1)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.text()).toContain('Alles, was vom Weinstock kommt, soll sie meiden.')
    expect(w.findAll('button.gm-item')).toHaveLength(6)
    expect(w.find('[data-in="wasser"]').exists()).toBe(false) // a new round: the basket is empty again
    await put(w, 'rosinen', 'tuch')
    expect(w.text()).toContain('Das kommt vom Weinstock.')
    await put(w, 'traubensaft', 'tuch')
    expect(w.text()).toContain('Das kommt vom Weinstock.')
    await put(w, 'trauben', 'tuch')
    expect(w.text()).toContain('Das hat der Engel verboten.')
    for (const id of ['brot', 'feigen', 'oliven']) await put(w, id, 'korb')
    expect(useTaskProgress().parts.value).toBe(10)
    await tick(1000)
    expect(w.text()).toContain('Alles liegt an seinem Platz.')
    await tick(2000)
    expect(count('star')).toBe(1)
    expect(w.text()).toContain('Alles, was ich ihr geboten habe, soll sie halten.')
    await w.find('button').trigger('click')
    expect(w.emitted('done')![0]).toEqual([3])
    expect(problems()).toEqual([])
  })

  it('five mistakes give one star', async () => {
    const w = mountIt()
    for (let i = 0; i < 5; i++) await put(w, 'starkes', 'korb')
    await playRound(w, R1)
    await playRound(w, R2)
    await w.find('button').trigger('click')
    expect(w.emitted('done')![0]).toEqual([simsonStars(5)])
    expect(simsonStars(5)).toBe(1)
  })

  it('English and Spanish words; less motion: the woman does not nod', async () => {
    const en = mountIt('en')
    expect(en.find('.gm-field').attributes('aria-label')).toContain('Manoah’s house')
    await en.find('[data-item="wein"]').trigger('click')
    await en.find('[data-target="tuch"]').trigger('click')
    expect(en.text()).toContain('The angel forbade that.')
    en.unmount()
    const es = mountIt('es')
    await es.find('[data-item="wasser"]').trigger('click')
    await es.find('[data-target="korb"]').trigger('click')
    expect(es.text()).toContain('Eso sí puede tomarlo.')
    es.unmount()
    stillMotion()
    const w = mountIt()
    expect(w.find('.gm').classes()).toContain('still')
  })
})

// ================================================================ raetsel
describe('Süß und stark (raetsel)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameRaetsel, { props: { game: RIDDLE }, ...opts(locale) })
  const card = (w: Wr, id: string) => w.find(`[data-card="${id}"]`)
  const step = (w: Wr, i: number) => w.find(`[data-step="${i}"]`)
  const lay = async (w: Wr, id: string, i: number) => {
    await card(w, id).trigger('click')
    await step(w, i).trigger('click')
  }

  it('the goal is every card (3 + 4); the stair has three steps, the top one is wanted and says "am süßesten"; the cards lie mixed', () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(7)
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.text()).toContain('Was ist am süßesten? Lege es ganz nach oben.')
    expect(w.findAll('button.gm-step')).toHaveLength(3)
    expect(step(w, 2).classes()).toContain('want')
    expect(step(w, 0).classes()).not.toContain('want')
    expect(step(w, 2).attributes('aria-label')).toBe('Stufe 3 von 3')
    expect(w.find('.gm-top').text()).toBe('am süßesten')
    expect(w.findAll('button.gm-card').map((b) => b.attributes('data-card'))).toEqual(['karte-trauben', 'karte-honig', 'karte-brot'])
    expect(w.find('svg').exists()).toBe(false)
    expect(problems()).toEqual([])
  })

  it('from the top down: honey, grapes, bread; a wrong card is a mistake ("Es gibt Süßeres."); a card on a step that is not wanted is no mistake', async () => {
    const w = mountIt()
    await lay(w, 'karte-trauben', 2)
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('Es gibt Süßeres.')
    expect(step(w, 2).find('.gm-mark').exists()).toBe(true)
    expect(card(w, 'karte-trauben').exists()).toBe(true)
    await lay(w, 'karte-brot', 0)
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('Lege die Karte auf die leuchtende Stufe.')
    await lay(w, 'karte-honig', 2)
    expect(count('right')).toBe(1)
    expect(w.text()).toContain('Das ist süßer.')
    expect(step(w, 2).find('[data-on="karte-honig"]').exists()).toBe(true)
    expect(step(w, 2).attributes('aria-label')).toBe('Stufe 3 von 3: Honig')
    expect(step(w, 1).classes()).toContain('want')
    await lay(w, 'karte-trauben', 1)
    await lay(w, 'karte-brot', 0)
    expect(useTaskProgress().parts.value).toBe(3)
    await tick(1000)
    expect(w.text()).toContain('Die Treppe ist voll.')
    expect(step(w, 2).find('.gm-glow').exists()).toBe(true)
  })

  it('a card dragged onto the wanted step', async () => {
    const w = mountIt()
    const wrap = w.find('.gm-wrap').element
    await ptr(card(w, 'karte-honig').element, 'pointerdown', 50, 95)
    await ptr(wrap, 'pointermove', 70, 50)
    expect(w.find('.gm-ghost').exists()).toBe(true)
    // the top step of three: the lowest step ends at 96 %, a step is 19 % high
    await ptr(wrap, 'pointerup', 74, 96 - 19 * 2.5)
    expect(count('right')).toBe(1)
    expect(step(w, 2).find('[data-on="karte-honig"]').exists()).toBe(true)
  })

  it('"Help me" makes the right card shine', async () => {
    const w = mountIt()
    await tick(16000)
    await helpButton(w)!.trigger('click')
    expect(card(w, 'karte-honig').classes()).toContain('shine')
    expect(card(w, 'karte-brot').classes()).not.toContain('shine')
    expect(w.text()).toContain('Eine Karte leuchtet. Lege sie auf die leuchtende Stufe.')
  })

  it('round 2: four steps, the lion on top ("Das ist stärker."), "Es gibt Stärkeres."; at the end the honey and the lion shine side by side, then the riddle as the verse', async () => {
    const w = mountIt()
    for (const [id, i] of [['karte-honig', 2], ['karte-trauben', 1], ['karte-brot', 0]] as const) await lay(w, id, i)
    await tick(3000)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.findAll('button.gm-step')).toHaveLength(4)
    expect(w.find('.gm-top').text()).toBe('am stärksten')
    await lay(w, 'karte-esel', 3)
    expect(w.text()).toContain('Es gibt Stärkeres.')
    await lay(w, 'karte-loewe', 3)
    expect(w.text()).toContain('Das ist stärker.')
    for (const [id, i] of [['karte-esel', 2], ['karte-schaf', 1], ['karte-hase', 0]] as const) await lay(w, id, i)
    expect(useTaskProgress().parts.value).toBe(7)
    await tick(3000)
    expect(w.find('[data-final]').exists()).toBe(true)
    expect(w.findAll('[data-crown]').map((c) => c.attributes('data-crown'))).toEqual(['karte-honig', 'karte-loewe'])
    expect(count('star')).toBe(1)
    await tick(2700)
    expect(w.text()).toContain('Speise ging von dem Fresser und Süßigkeit von dem Starken.')
    expect(w.text()).not.toMatch(/Aas|Fresser hat/)
    await w.find('button').trigger('click')
    expect(w.emitted('done')![0]).toEqual([3])
    expect(problems()).toEqual([])
  })

  it('English words', async () => {
    const w = mountIt('en')
    await card(w, 'karte-brot').trigger('click')
    await step(w, 2).trigger('click')
    expect(w.text()).toContain('There is something sweeter.')
  })
})

// ================================================================ torheben
describe('Das Tor ausheben (torheben)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameTorheben, { props: { game: GATE }, ...opts(locale) })
  const part = (w: Wr, id: string) => w.find(`[data-part="${id}"]`)

  it('the goal is every part (3 + 5); the gate at night as a group, three parts as buttons, Samson; no drawing', () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(8)
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.text()).toContain('Hebe die Teile des Tores aus. Was noch hält, lässt sich nicht anheben.')
    expect(w.find('.gm-field').attributes('aria-label')).toBe('Das Stadttor von Gaza bei Nacht. Neben dem Tor steht Simson.')
    expect(w.findAll('button.gm-part').map((b) => b.attributes('data-part'))).toEqual(['riegel', 'fluegel-links', 'fluegel-rechts'])
    expect(part(w, 'riegel').attributes('aria-label')).toBe('Der Riegel')
    expect(w.find('.gm-strong').attributes('aria-label')).toBe('Simson')
    expect(w.find('svg').exists()).toBe(false)
    expect(problems()).toEqual([])
  })

  it('a door that the bar still holds wiggles and stays ("Das hält noch.", a mistake); the bar is lifted and goes onto the shoulders; then the doors', async () => {
    const w = mountIt()
    await part(w, 'fluegel-links').trigger('click')
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('Das hält noch.')
    expect(part(w, 'fluegel-links').classes()).toContain('wiggle')
    expect(part(w, 'fluegel-links').find('.gm-mark').exists()).toBe(true)
    await part(w, 'riegel').trigger('click')
    expect(count('right')).toBe(1)
    expect(w.text()).toContain('Simson hebt es aus.')
    expect(part(w, 'riegel').exists()).toBe(false)
    expect(w.find('[data-carried="riegel"]').exists()).toBe(true)
    await part(w, 'fluegel-rechts').trigger('click')
    await part(w, 'fluegel-links').trigger('click')
    expect(w.findAll('[data-carried]')).toHaveLength(3)
    expect(w.find('[data-carried="fluegel-links"]').classes()).toContain('lying')
    expect(useTaskProgress().parts.value).toBe(3)
    await tick(1000)
    expect(w.text()).toContain('Das Tor ist ausgehoben.')
  })

  it('a part dragged to Samson is lifted; let go elsewhere, nothing happens', async () => {
    const w = mountIt()
    const wrap = w.find('.gm-wrap').element
    await ptr(part(w, 'riegel').element, 'pointerdown', 57, 50)
    await ptr(wrap, 'pointermove', 40, 60)
    await ptr(wrap, 'pointerup', 90, 10)
    expect(count('right') + count('wrong')).toBe(0)
    await ptr(part(w, 'riegel').element, 'pointerdown', 57, 50)
    await ptr(wrap, 'pointermove', 30, 70)
    await ptr(wrap, 'pointerup', 17, 75) // on Samson
    expect(count('right')).toBe(1)
    expect(w.find('[data-carried="riegel"]').exists()).toBe(true)
  })

  it('"Help me" makes the next free part shine', async () => {
    const w = mountIt()
    await tick(16000)
    await helpButton(w)!.trigger('click')
    expect(part(w, 'riegel').classes()).toContain('shine')
    expect(part(w, 'fluegel-links').classes()).not.toContain('shine')
    expect(w.text()).toContain('Ein Teil leuchtet. Nichts hält es mehr.')
  })

  it('round 2: the posts are held by their doors; at the end Samson carries the load away, then the verse (Judges 16,3); two mistakes still give three stars', async () => {
    const w = mountIt()
    for (const id of ['riegel', 'fluegel-links', 'fluegel-rechts']) await part(w, id).trigger('click')
    await tick(3000)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.findAll('button.gm-part')).toHaveLength(5)
    expect(w.findAll('[data-carried]')).toHaveLength(0)
    await part(w, 'pfosten-links').trigger('click')
    await part(w, 'riegel').trigger('click')
    await part(w, 'pfosten-links').trigger('click')
    expect(count('wrong')).toBe(2)
    for (const id of ['fluegel-links', 'pfosten-links', 'fluegel-rechts', 'pfosten-rechts']) await part(w, id).trigger('click')
    expect(useTaskProgress().parts.value).toBe(8)
    await tick(3000)
    expect(w.find('.gm-strong').classes()).toContain('away')
    expect(count('star')).toBe(1)
    await tick(2500)
    expect(w.text()).toContain('Da stand er auf zu Mitternacht und ergriff beide Türen an der Stadt Tor samt den Pfosten')
    await w.find('button').trigger('click')
    expect(w.emitted('done')![0]).toEqual([3])
    expect(problems()).toEqual([])
  })

  it('English and Spanish words', async () => {
    const en = mountIt('en')
    await en.find('[data-part="fluegel-links"]').trigger('click')
    expect(en.text()).toContain('That still holds.')
    en.unmount()
    const es = mountIt('es')
    await es.find('[data-part="riegel"]').trigger('click')
    expect(es.text()).toContain('Sansón la saca.')
  })
})
