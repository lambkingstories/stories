/**
 * "Gather the sticks" (`reisig` = GameReisig) and "Welcome everyone" (`besuch` = GameBesuch) of "Bis nach Rom", mounted with sample data and played through: loops drawn with a finger
 * (closed, open, with something that does not burn inside), the stool of the soldier and the chain of Paulus, right and wrong tries (a cross, a word, a low tone, a mistake), the keyboard,
 * "Help me" after fifteen seconds, the rounds, the goal for "Go on" (`useTaskProgress`), the end with its stars and the words of the Bible, German, English and Spanish words.
 * The new words are mixed into the messages of the app here (`paulusromNeuI18n.ts`), so that the test does not wait for them to be in `i18n/app.ts`.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import spanish from '@/i18n/app.es'
import useTaskProgress from '@/use/useTaskProgress'
import GameReisig from '@/components/molecules/games/GameReisig.vue'
import GameBesuch from '@/components/molecules/games/GameBesuch.vue'
import { osterStars } from '@/utils/osternGames'
import { BRUSH, VISIT } from './paulusromSamples'
import { PAULUSROM_WORDS } from './paulusromNeuI18n'

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
    out[lang] = { ...base[lang], app: { ...app, adventure: { ...app.adventure, ...PAULUSROM_WORDS[lang] } } }
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
const helpButton = (w: Wr, label: string) => w.findAll('button').find((b) => b.text() === label)

// ---------------------------------------------------------------- reisig
/** A round loop around (cx, cy), `r` units wide and `r * 1.5` percent high (so it is round on the screen); `n` points, the last one near the first. */
const circle = (cx: number, cy: number, r: number, n = 18) => Array.from({ length: n }, (_, i) => ({ x: cx + r * Math.cos((i / n) * 2 * Math.PI), y: cy + r * 1.5 * Math.sin((i / n) * 2 * Math.PI) }))
const rect = (l: number, t: number, r: number, b: number) => [
  [l, t], [(l + r) / 2, t], [r, t], [r, (t + b) / 2], [r, b], [(l + r) / 2, b], [l, b], [l, (t + b) / 2], [l + 1, t + 2]
].map(([x, y]) => ({ x: x!, y: y! }))

describe('Reisig zusammenraffen (reisig)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameReisig, { props: { game: BRUSH }, ...opts(locale) })
  /** The finger draws the points one after the other. */
  const draw = async (w: Wr, pts: { x: number; y: number }[]) => {
    pointer(w.find('.gm-field').element, 'pointerdown', pts[0]!.x, pts[0]!.y)
    for (const p of pts.slice(1)) pointer(window, 'pointermove', p.x, p.y)
    pointer(window, 'pointerup', pts[pts.length - 1]!.x, pts[pts.length - 1]!.y)
    await flushPromises()
  }

  it('the goal is five bundles; five things on the beach, the fire at step 1, Paulus, the hint, the counter, the labels', () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(5)
    expect(w.findAll('.gm-thing')).toHaveLength(5)
    expect(w.find('[data-fire]').attributes('data-level')).toBe('1')
    expect(w.find('[data-fire]').attributes('aria-label')).toBe('Das Feuer: Stufe 1 von 4')
    expect(w.text()).toContain('Zieh einen Kreis um das Reisig.')
    expect(w.text()).toContain('Bündel: 0 von 2')
    expect(w.find('.gm-field').attributes('aria-label')).toBe('Der Strand von Malta im Regen. Zieh mit dem Finger einen Kreis um das trockene Reisig.')
    expect(w.find('.gm-fb').attributes('role')).toBe('status')
    expect(w.find('svg').exists()).toBe(false)
    expect(w.find('[data-thing="r1"]').attributes('aria-label')).toBe('Trockenes Reisig')
    expect(problems()).toEqual([])
  })

  it('a closed loop around two heaps: they are gathered into a bundle, Paulus carries it, the fire grows a step, a tick and a bright tone', async () => {
    const w = mountIt()
    await draw(w, circle(36, 31, 12))
    expect(count('found')).toBe(1)
    expect(w.text()).toContain('Das Reisig ist beisammen!')
    expect(w.text()).toContain('Bündel: 1 von 2')
    expect(w.findAll('.gm-thing')).toHaveLength(3)
    expect(w.find('[data-thing="r1"]').exists()).toBe(false)
    expect(w.find('[data-bundle]').exists()).toBe(true)
    expect(w.find('[data-fire]').attributes('data-level')).toBe('2')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.find('.gm-mark').exists()).toBe(true)
    expect(w.findAll('[data-dot]').length).toBeGreaterThan(3)
    await tick(500)
    expect(w.findAll('[data-dot]')).toHaveLength(0)
    await tick(1000)
    expect(w.find('[data-bundle]').exists()).toBe(false)
  })

  it('something that does not burn inside: a cross, "Da ist etwas dabei, das nicht brennt.", a low tone, a mistake, everything stays', async () => {
    const w = mountIt()
    await draw(w, rect(24, 24, 90, 90))
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('Da ist etwas dabei, das nicht brennt.')
    expect(w.findAll('.gm-thing')).toHaveLength(5)
    expect(useTaskProgress().parts.value).toBe(0)
    expect(w.find('[data-fire]').attributes('data-level')).toBe('1')
  })

  it('one heap only: "Raff mehr zusammen!", no mistake; an open loop fades: "Zieh den Kreis ganz zu.", no mistake; a little scribble is nothing', async () => {
    const w = mountIt()
    await draw(w, circle(30, 30, 8))
    expect(w.text()).toContain('Raff mehr zusammen!')
    await tick(3000)
    await draw(w, circle(36, 31, 12).slice(0, 10))
    expect(w.text()).toContain('Zieh den Kreis ganz zu.')
    await tick(3000)
    await draw(w, [{ x: 60, y: 60 }, { x: 61.5, y: 60 }, { x: 63, y: 60 }])
    expect(count('wrong')).toBe(0)
    expect(w.findAll('.gm-thing')).toHaveLength(5)
  })

  it('both rounds played through (one mistake): the fire grows, the finishing picture, then the verse and the stars', async () => {
    const w = mountIt()
    await draw(w, rect(24, 24, 90, 90)) // wrong
    await tick(500)
    await draw(w, circle(36, 31, 12))
    await tick(500)
    await draw(w, circle(36, 63, 12))
    expect(w.find('[data-fire]').attributes('data-level')).toBe('4')
    await tick(1500)
    expect(w.text()).toContain('Das Feuer brennt wieder hoch!')
    await tick(2900)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.text()).toContain('Bündel: 0 von 3')
    expect(w.find('[data-fire]').attributes('data-level')).toBe('2')
    expect(w.findAll('.gm-thing')).toHaveLength(8)
    for (const [cx, cy] of [[36, 24], [36, 50], [36, 80]] as const) {
      await draw(w, circle(cx, cy, 10))
      await tick(600)
    }
    await tick(900)
    expect(w.find('[data-finale]').exists()).toBe(true)
    expect(w.text()).toContain('Alle sitzen am Feuer und wärmen sich.')
    expect(useTaskProgress().parts.value).toBe(5)
    await tick(3300)
    expect(count('star')).toBe(1)
    expect(w.text()).toContain('Die Leutlein aber erzeigten uns nicht geringe Freundschaft')
    await w.find('button').trigger('click')
    expect(w.emitted('done')![0]).toEqual([osterStars(1)])
    expect(problems()).toEqual([])
  })

  it('the round ends when no bundle can be made any more (a wide loop took three heaps)', async () => {
    const w = mountIt()
    await draw(w, rect(24, 22, 48, 70)) // r1, r2, r3, r4 and nothing else: four heaps in one loop
    expect(w.text()).toContain('Bündel: 1 von 2')
    await tick(1500)
    expect(w.text()).toContain('Das Feuer brennt wieder hoch!')
    await tick(2900)
    expect(w.text()).toContain('Runde 2 von 2')
  })

  it('the keyboard: the arrows choose a thing, Enter marks it, the button gathers everything marked (the same check); "Help me" shows a pale loop', async () => {
    const w = mountIt()
    const f = w.find('.gm-field')
    expect(w.find('[data-gather]').exists()).toBe(false)
    await f.trigger('keydown', { key: 'ArrowRight' })
    expect(w.text()).toContain('Trockenes Reisig')
    await f.trigger('keydown', { key: 'Enter' })
    expect(w.text()).toContain('Trockenes Reisig, markiert')
    expect(w.find('[data-thing="r1"]').attributes('aria-pressed')).toBe('true')
    expect(w.find('[data-gather]').exists()).toBe(true)
    await w.find('[data-gather]').trigger('click') // one heap only
    expect(w.text()).toContain('Raff mehr zusammen!')
    await f.trigger('keydown', { key: 'ArrowRight' })
    await f.trigger('keydown', { key: 'Enter' })
    await w.find('[data-gather]').trigger('click')
    expect(count('found')).toBe(1)
    expect(w.text()).toContain('Bündel: 1 von 2')
    expect(w.find('[data-gather]').exists()).toBe(false)
    // a stone marked together with sticks is a mistake
    await f.trigger('keydown', { key: 'ArrowLeft' }) // the stone (the last of the list)
    await f.trigger('keydown', { key: 'Enter' })
    await f.trigger('keydown', { key: 'ArrowRight' })
    await f.trigger('keydown', { key: 'Enter' })
    await w.find('[data-gather]').trigger('click')
    expect(count('wrong')).toBe(1)
    await tick(15500)
    const help = helpButton(w, 'Hilf mir')!
    expect(help).toBeTruthy()
    await help.trigger('click')
    expect(w.find('[data-help]').exists()).toBe(true)
    expect(w.findAll('.gm-thing.glow')).toHaveLength(2)
  })

  it('English and Spanish words', () => {
    const en = mountIt('en')
    expect(en.text()).toContain('Round 1 of 2')
    expect(en.text()).toContain('Bundles: 0 of 2')
    en.unmount()
    const es = mountIt('es')
    expect(es.text()).toContain('Haces: 0 de 2')
    expect(problems()).toEqual([])
  })
})

// ---------------------------------------------------------------- besuch
describe('Alle aufnehmen (besuch)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameBesuch, { props: { game: VISIT }, ...opts(locale) })
  const CARRY = 800
  const WALK = 1000
  const TALK = 1300
  const tapStool = async (w: Wr, s: number) => {
    await w.find(`[data-stool="${s}"]`).trigger('click')
    await flushPromises()
  }

  it('the goal is seven guests; one guest comes in, the soldier sits on the first mat, Paulus beside him, the chain, three mats, the hint, the labels', () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(7)
    expect(w.findAll('[data-stool]')).toHaveLength(3)
    expect(w.findAll('[data-guest]')).toHaveLength(1)
    expect(w.find('[data-guest]').attributes('aria-label')).toBe('Ein Ältester')
    expect(w.text()).toContain('Ein Gast kommt herein.')
    expect(w.find('[data-soldier]').attributes('style')).toContain('left: 22%')
    expect(w.find('[data-paulus]').attributes('data-pose')).toBe('stand')
    expect(w.find('[data-chain]').exists()).toBe(true)
    expect(w.text()).toContain('Gäste: 0 von 7')
    expect(w.text()).toContain('Stell den Hocker so hin, dass Paulus jeden Gast erreicht.')
    expect(w.find('[data-stool="1"]').attributes('aria-label')).toBe('Platz 2 für den Hocker')
    expect(w.find('.gm-fb').attributes('role')).toBe('status')
    expect(w.find('svg').exists()).toBe(false)
    expect(problems()).toEqual([])
  })

  it('round 1: a first tap shows the circle of the chain, a second tap sets the soldier there', async () => {
    const w = mountIt()
    await tapStool(w, 1)
    expect(w.find('[data-reach]').exists()).toBe(true)
    expect(w.find('[data-reach]').attributes('style')).toContain('left: 50%')
    expect(w.text()).toContain('So weit reicht die Kette. Tipp noch einmal, dann setzt sich der Soldat dorthin.')
    expect(w.find('[data-stool="1"]').attributes('aria-pressed')).toBe('true')
    await tapStool(w, 0) // another mat: the circle moves
    expect(w.find('[data-reach]').attributes('style')).toContain('left: 22%')
    await tapStool(w, 0)
    expect(w.find('[data-reach]').exists()).toBe(false)
    expect(w.find('[data-soldier] img').attributes('src')).toContain('soldat-traegt')
    expect(count('wrong')).toBe(0)
  })

  it('too far: Paulus walks to the end of the chain and stops, a cross, "Die Kette reicht nicht bis dorthin.", a low tone, a mistake; then the child chooses again', async () => {
    const w = mountIt()
    await tapStool(w, 1)
    await tapStool(w, 1)
    await tick(CARRY)
    expect(w.find('[data-soldier]').attributes('style')).toContain('left: 50%')
    expect(w.find('[data-soldier] img').attributes('src')).toContain('soldat-hocker')
    expect(w.find('[data-paulus]').attributes('data-pose')).toBe('walk')
    await tick(WALK)
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('Die Kette reicht nicht bis dorthin.')
    expect(w.find('.gm-mark').exists()).toBe(true)
    expect(w.find('[data-guest]').attributes('aria-label')).toBe('Ein Ältester')
    await tapStool(w, 2) // still busy: nothing happens
    expect(w.find('[data-soldier]').attributes('style')).toContain('left: 50%')
    await tick(1000)
    await tapStool(w, 0)
    await tapStool(w, 0)
    await tick(CARRY + WALK)
    expect(w.find('[data-paulus]').attributes('data-pose')).toBe('talk')
    expect(w.find('[data-guest]').attributes('aria-label')).toBe('Ein Ältester, hört zu')
    expect(count('found')).toBe(1)
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.text()).toContain('Gäste: 1 von 7')
    expect(w.text()).toContain('Paulus geht zum Gast und erzählt ihm von Jesus.')
  })

  it('both rounds played through (one mistake): the second guest, round 2 without the circle, two guests at once, the finishing picture, the verse and the stars', async () => {
    const w = mountIt()
    await tapStool(w, 1)
    await tapStool(w, 1)
    await tick(CARRY + WALK + 1000) // wrong, once
    await tapStool(w, 0)
    await tapStool(w, 0)
    await tick(CARRY + WALK + TALK)
    expect(w.findAll('[data-guest]')).toHaveLength(2) // the second guest comes in
    await tapStool(w, 1)
    await tapStool(w, 1)
    await tick(CARRY + WALK + TALK)
    expect(w.text()).toContain('Alle haben Platz und hören zu!')
    await tick(2900)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.findAll('[data-stool]')).toHaveLength(4)
    expect(w.findAll('[data-guest]')).toHaveLength(1)
    // round 2: one tap is enough, no circle
    await tapStool(w, 0)
    expect(w.find('[data-reach]').exists()).toBe(false)
    await tick(CARRY + WALK + TALK)
    expect(w.text()).toContain('Zwei Gäste kommen herein.')
    expect(w.findAll('[data-guest]')).toHaveLength(3)
    await tapStool(w, 3)
    await tick(CARRY + WALK)
    expect(w.findAll('[data-guest].listens')).toHaveLength(2) // the first of the two listens (and the one of the first visit)
    await tick(TALK + WALK + TALK)
    expect(w.text()).toContain('Zwei Gäste kommen herein.')
    await tapStool(w, 2)
    await tick(CARRY + WALK + TALK + WALK + TALK)
    expect(useTaskProgress().parts.value).toBe(7)
    expect(w.find('[data-finale]').exists()).toBe(true)
    expect(w.text()).toContain('Paulus nimmt alle auf, die zu ihm kommen.')
    await tick(3300)
    expect(count('star')).toBe(1)
    expect(w.text()).toContain('Paulus aber blieb zwei Jahre in seinem eigenen Gedinge')
    await w.find('button').trigger('click')
    expect(w.emitted('done')![0]).toEqual([osterStars(1)])
    expect(problems()).toEqual([])
  })

  it('round 2, two guests at once, a place that reaches only one: a mistake and Paulus stops at the end of the chain', async () => {
    const w = mountIt()
    for (const s of [0, 1]) {
      await tapStool(w, s)
      await tapStool(w, s)
      await tick(CARRY + WALK + TALK)
    }
    await tick(2900)
    await tapStool(w, 0)
    await tick(CARRY + WALK + TALK)
    await tapStool(w, 0) // reaches the guest at (30, 44) but not the one at (66, 40)
    await tick(CARRY + WALK)
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('Die Kette reicht nicht bis dorthin.')
    await tick(1000)
    expect(w.findAll('[data-guest].listens')).toHaveLength(1) // only the guest of the first visit of this round
  })

  it('the keyboard: the arrows choose a mat, Enter sets the soldier (the first Enter in round 1 shows the circle); "Help me" after fifteen seconds shows the right mat and its circle', async () => {
    const w = mountIt()
    const f = w.find('.gm-field')
    await f.trigger('keydown', { key: 'ArrowRight' })
    expect(w.text()).toContain('Platz 1 für den Hocker')
    expect(w.find('[data-stool="0"]').classes()).toContain('cursor')
    await f.trigger('keydown', { key: 'ArrowRight' })
    expect(w.text()).toContain('Platz 2 für den Hocker')
    await tick(15500)
    const help = helpButton(w, 'Hilf mir')!
    expect(help).toBeTruthy()
    await help.trigger('click')
    expect(w.find('[data-stool="0"]').classes()).toContain('help')
    expect(w.find('[data-reach]').attributes('style')).toContain('left: 22%')
    expect(w.text()).toContain('Dieser Platz passt.')
    await f.trigger('keydown', { key: 'ArrowLeft' })
    await f.trigger('keydown', { key: 'Enter' })
    expect(w.find('[data-reach]').exists()).toBe(true)
    await f.trigger('keydown', { key: 'Enter' })
    await tick(CARRY + WALK)
    expect(w.find('[data-paulus]').attributes('data-pose')).toBe('talk')
  })

  it('English and Spanish words', () => {
    const en = mountIt('en')
    expect(en.text()).toContain('Round 1 of 2')
    expect(en.text()).toContain('A guest comes in.')
    expect(en.text()).toContain('Guests: 0 of 7')
    en.unmount()
    const es = mountIt('es')
    expect(es.text()).toContain('Visitantes: 0 de 7')
    expect(problems()).toEqual([])
  })
})
