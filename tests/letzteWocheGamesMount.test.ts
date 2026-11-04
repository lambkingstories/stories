/**
 * The three new games of "Die letzte Woche" (`bereiten` = GamePrepare, `lampen` = GameLamps, `helfen` = GameHelp): each is mounted with sample data and played through: right and wrong moves, dragging, tapping,
 * the keyboard, the rounds, the goal for the stars of "Go on" (`useTaskProgress`), the end with its stars and the words of the Bible, German, English and Spanish words.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import spanish from '@/i18n/app.es'
import useTaskProgress from '@/use/useTaskProgress'
import GamePrepare from '@/components/molecules/games/GamePrepare.vue'
import GameLamps from '@/components/molecules/games/GameLamps.vue'
import GameHelp from '@/components/molecules/games/GameHelp.vue'
import { partialStars } from '@/utils/adventureScore'
import { helpProblems, lampProblems, prepareProblems } from '@/utils/letzteWocheGames'
import { HELP, LAMPS, PREPARE } from './letzteWocheSamples'
import type { HelpGame, OilLampGame, PrepareGame } from '@/types/adventure'

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

const mk = (locale: 'de' | 'en' | 'es') => createI18n({ legacy: false, locale, fallbackLocale: 'de', messages: { ...(messages as object), ...(spanish as object) } as never, missingWarn: false, fallbackWarn: false })
const opts = (locale: 'de' | 'en' | 'es' = 'de') => ({ global: { plugins: [mk(locale)], stubs: { RouterLink: true } }, attachTo: document.body })

let warnings: string[] = []
/** The boxes the elements have on the "screen" (jsdom has no layout): an element without an entry is a box of 100 x 100. */
const boxes = new WeakMap<Element, { left: number; top: number; right: number; bottom: number }>()
const box = (left: number, top: number, w: number, h: number) => ({ left, top, right: left + w, bottom: top + h, width: w, height: h, x: left, y: top, toJSON: () => ({}) })
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
})
const problems = () => warnings.filter((w) => /not defined on instance|is not a function|Unhandled error|ERROR|Missing required prop/.test(w))
const tick = async (ms: number) => {
  await vi.advanceTimersByTimeAsync(ms)
  await flushPromises()
}
const count = (name: string) => played.filter((p) => p === name).length
const pointer = (el: Element | Window, type: 'pointerdown' | 'pointermove' | 'pointerup', x = 0, y = 0) =>
  el.dispatchEvent(new MouseEvent(type, { bubbles: true, button: 0, buttons: type === 'pointerup' ? 0 : 1, clientX: x, clientY: y }))

// ---------------------------------------------------------------- prepare the way
describe('Den Weg bereiten (bereiten)', () => {
  const mountIt = (game: PrepareGame = PREPARE, locale: 'de' | 'en' | 'es' = 'de') => mount(GamePrepare, { props: { game }, ...opts(locale) })
  type W = ReturnType<typeof mountIt>
  const pile = (w: W, kind: 'cloak' | 'branch' | 'stone') => w.find(`button.gm-pile.${kind}`)
  const spot = (w: W, i: number) => w.find(`[data-spot="${i}"]`)
  /** Put a pile on a place by tapping the pile and then the place. */
  const lay = async (w: W, kind: 'cloak' | 'branch' | 'stone', i: number) => {
    await pile(w, kind).trigger('click')
    await spot(w, i).trigger('click')
  }
  /** Give every place of the screen its own box (the places lie side by side, 30 pixels apart). */
  const layout = (w: W) => w.findAll('[data-spot]').forEach((el) => boxes.set(el.element, { left: Number(el.attributes('data-spot')) * 30, top: 40, right: Number(el.attributes('data-spot')) * 30 + 24, bottom: 64 }))
  const coveredCount = (w: W) => w.findAll('.gm-laid[data-spot]').length

  it('the sample data are in order; the goal is every place (3 + 5); three bare places, two decorated ones, three piles; the hint and the round', () => {
    expect(prepareProblems(PREPARE)).toEqual([])
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(8)
    expect(w.findAll('button.gm-spot')).toHaveLength(3)
    expect(w.findAll('.gm-laid.deco')).toHaveLength(2)
    expect(w.findAll('button.gm-pile')).toHaveLength(3)
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.text()).toContain('Stellen bedeckt: 0 von 3')
    expect(w.find('.gm-donkey').attributes('style')).toContain('left: 10%')
    expect(w.find('button.gm-spot').attributes('aria-label')).toBe('Stelle 1 von 3, kahl')
    expect(problems()).toEqual([])
  })

  it('tap the cloak, then a bare place: it is laid (a tick), the donkey walks to it, the people cry Hosanna', async () => {
    const w = mountIt()
    await pile(w, 'cloak').trigger('click')
    expect(pile(w, 'cloak').attributes('aria-pressed')).toBe('true')
    expect(w.text()).toContain('Mäntel gewählt. Tippe jetzt eine kahle Stelle an.')
    await spot(w, 0).trigger('click')
    expect(w.find('.gm-laid[data-spot="0"]').exists()).toBe(true)
    expect(w.find('.gm-laid[data-spot="0"] .gm-mark').exists()).toBe(true)
    expect(w.find('.gm-laid[data-spot="0"]').attributes('aria-label')).toBe('Stelle 1 von 3, bedeckt')
    expect(w.find('.gm-donkey').attributes('style')).toContain('left: 24%')
    expect(w.find('.gm-hosanna').text()).toContain('Hosianna!')
    expect(w.text()).toContain('Stellen bedeckt: 1 von 3')
    expect(played).toContain('snap')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(pile(w, 'cloak').attributes('aria-pressed')).toBe('false')
    expect(problems()).toEqual([])
  })

  it('branches work, too, and a place can be laid ahead of the donkey (it waits until the places before are laid)', async () => {
    const w = mountIt()
    await lay(w, 'branch', 2)
    expect(coveredCount(w)).toBe(1)
    expect(w.find('.gm-donkey').attributes('style')).toContain('left: 10%')
    await lay(w, 'cloak', 0)
    // the first of the three places is the first of the five (x 24)
    expect(w.find('.gm-donkey').attributes('style')).toContain('left: 24%')
    await lay(w, 'cloak', 1)
    expect(w.find('.gm-donkey').attributes('style')).toContain('left: 84.2%')
  })

  it('a stone does not belong on the road: it wobbles, a cross and a word, one mistake; nothing is laid', async () => {
    const w = mountIt()
    await lay(w, 'stone', 1)
    expect(w.find('button.gm-spot.wobble').exists()).toBe(true)
    expect(w.find('button.gm-spot.wobble .gm-mark').exists()).toBe(true)
    expect(w.text()).toContain('Ein Stein gehört nicht auf die Straße. Er springt zurück.')
    expect(count('wrong')).toBe(1)
    expect(coveredCount(w)).toBe(0)
    expect(useTaskProgress().parts.value).toBe(0)
    await tick(1800)
    expect(w.find('button.gm-spot.wobble').exists()).toBe(false)
  })

  it('a cloak on a place that is covered already does not work and costs nothing; a tap on a place without a pile says so', async () => {
    const w = mountIt()
    await lay(w, 'cloak', 0)
    await tick(300)
    await pile(w, 'branch').trigger('click')
    await spot(w, 0).trigger('click')
    expect(w.text()).toContain('Hier liegt schon etwas. Nimm eine kahle Stelle.')
    expect(coveredCount(w)).toBe(1)
    expect(count('wrong')).toBe(0)
    await spot(w, 1).trigger('click')
    expect(w.text()).toContain('Nimm erst Mäntel oder Zweige.')
  })

  it('dragging a pile onto a place lays it; a drop beside the places does nothing', async () => {
    const w = mountIt()
    layout(w)
    // beside all places
    pointer(pile(w, 'cloak').element, 'pointerdown', 5, 5)
    pointer(window, 'pointermove', 90, 90)
    await flushPromises()
    expect(w.find('.gm-ghost').exists()).toBe(true)
    pointer(window, 'pointerup', 90, 90)
    await flushPromises()
    expect(w.find('.gm-ghost').exists()).toBe(false)
    expect(coveredCount(w)).toBe(0)
    // onto the second place (index 1, box from x = 30 to 54)
    pointer(pile(w, 'branch').element, 'pointerdown', 5, 5)
    pointer(window, 'pointermove', 40, 50)
    pointer(window, 'pointerup', 40, 50)
    await flushPromises()
    expect(w.find('.gm-laid[data-spot="1"]').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(1)
    // a stone dragged onto a bare place is a mistake, onto the covered one nothing happens (the covered place is a new element: give it its box again)
    layout(w)
    pointer(pile(w, 'stone').element, 'pointerdown', 5, 5)
    pointer(window, 'pointermove', 70, 50)
    pointer(window, 'pointerup', 70, 50)
    await flushPromises()
    expect(count('wrong')).toBe(1)
    await tick(100)
    layout(w)
    pointer(pile(w, 'stone').element, 'pointerdown', 5, 5)
    pointer(window, 'pointermove', 40, 50)
    pointer(window, 'pointerup', 40, 50)
    await flushPromises()
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('Hier liegt schon etwas.')
  })

  it('a tap without moving is a tap, not a drag (the pile is chosen)', async () => {
    const w = mountIt()
    pointer(pile(w, 'cloak').element, 'pointerdown', 5, 5)
    pointer(window, 'pointerup', 5, 5)
    await pile(w, 'cloak').trigger('click')
    expect(pile(w, 'cloak').attributes('aria-pressed')).toBe('true')
  })

  it('all three places: the donkey goes to the gate, round 2 has five places and the donkey walks on slowly; then the end with three stars and the words of the Bible', async () => {
    const w = mountIt()
    await lay(w, 'cloak', 0)
    await lay(w, 'branch', 1)
    await lay(w, 'cloak', 2)
    expect(w.find('.gm-donkey').attributes('style')).toContain('transition-duration: 1500ms')
    await tick(700)
    expect(played).toContain('right')
    expect(w.text()).toContain('Am Stadttor! Alle rufen: Hosianna!')
    await tick(3000)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.findAll('button.gm-spot')).toHaveLength(5)
    expect(w.findAll('.gm-laid.deco')).toHaveLength(0)
    expect(w.text()).toContain('Stellen bedeckt: 0 von 5')
    expect(w.find('.gm-donkey').attributes('style')).toContain('transition-duration: 2600ms')
    for (let i = 0; i < 5; i++) await lay(w, i % 2 ? 'branch' : 'cloak', i)
    await tick(700 + 3000)
    expect(w.text()).toContain('breitete die Kleider auf den Weg')
    expect(played).toContain('star')
    expect(useTaskProgress().finished.value).toBe(true)
    await w.find('button.adv-btn').trigger('click')
    expect(w.emitted('done')![0]).toEqual([3])
    expect(problems()).toEqual([])
  })

  it('mistakes cost stars: three stones give two stars, six give one', async () => {
    const w = mountIt()
    for (let i = 0; i < 3; i++) {
      await lay(w, 'stone', i)
      await tick(100)
    }
    await lay(w, 'cloak', 0)
    await lay(w, 'cloak', 1)
    await lay(w, 'cloak', 2)
    await tick(3700)
    for (let i = 0; i < 5; i++) await lay(w, 'cloak', i)
    await tick(3700)
    await w.find('button.adv-btn').trigger('click')
    expect(w.emitted('done')![0]).toEqual([2])
    const v = mountIt()
    for (let i = 0; i < 6; i++) await lay(v, 'stone', i % 3)
    for (let i = 0; i < 3; i++) await lay(v, 'cloak', i)
    await tick(3700)
    for (let i = 0; i < 5; i++) await lay(v, 'cloak', i)
    await tick(3700)
    await v.find('button.adv-btn').trigger('click')
    expect(v.emitted('done')![0]).toEqual([1])
  })

  it('"Go on" gives one star after a third of the places; English and Spanish words', async () => {
    const w = mountIt()
    const goal = useTaskProgress().goal.value
    await lay(w, 'cloak', 0)
    await lay(w, 'cloak', 1)
    expect(partialStars(useTaskProgress().parts.value, goal)).toBe(0)
    await lay(w, 'cloak', 2)
    expect(partialStars(useTaskProgress().parts.value, goal)).toBe(1)
    const en = mountIt(PREPARE, 'en')
    expect(en.find('button.gm-spot').attributes('aria-label')).toBe('Place 1 of 3, bare')
    expect(en.text()).toContain('Places covered: 0 of 3')
    const es = mountIt(PREPARE, 'es')
    expect(es.find('button.gm-spot').attributes('aria-label')).toBe('Lugar 1 de 3, desnudo')
    expect(es.text()).toContain('Lugares cubiertos: 0 de 3')
  })
})

// ---------------------------------------------------------------- fill the lamps
describe('Die Lampen füllen (lampen)', () => {
  const mountIt = (game: OilLampGame = LAMPS, locale: 'de' | 'en' | 'es' = 'de') => mount(GameLamps, { props: { game }, ...opts(locale) })
  type W = ReturnType<typeof mountIt>
  const jug = (w: W) => w.find('button.gm-jug')
  const level = (w: W) => Number(w.find('[role="meter"]').attributes('aria-valuenow'))
  const lampEl = (w: W) => w.find('.gm-lamp')
  /** Hold the jug for `ms` milliseconds with the finger and let go. */
  const hold = async (w: W, ms: number) => {
    pointer(jug(w).element, 'pointerdown', 5, 5)
    await tick(ms)
    pointer(window, 'pointerup', 5, 5)
    await flushPromises()
  }
  /** The time that pours up to `mark` percent. */
  const toMark = (mark: number) => Math.round((mark / 22) * 1000)

  it('the sample data are in order; the goal is every lamp (3 + 3); the lamp, the ring, the jug, the empty glass, the hint and the round', () => {
    expect(lampProblems(LAMPS)).toEqual([])
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(6)
    expect(lampEl(w).attributes('aria-label')).toBe('lampe')
    expect(w.find('.gm-mark-ring').exists()).toBe(true)
    expect(w.find('.gm-mark-ring').attributes('style')).toContain('top: 41.2%')
    expect(level(w)).toBe(0)
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.text()).toContain('Lampen: 0 von 6')
    expect(w.find('button.gm-jug').attributes('aria-label')).toContain('Ölkrug')
    expect(problems()).toEqual([])
  })

  it('holding the jug pours: the level rises with the time, the jug tips; letting go at the mark lights the lamp (a tick)', async () => {
    const w = mountIt()
    pointer(jug(w).element, 'pointerdown', 5, 5)
    await tick(1000)
    expect(jug(w).classes()).toContain('pouring')
    expect(level(w)).toBe(22)
    await tick(1730)
    pointer(window, 'pointerup', 5, 5)
    await flushPromises()
    expect(jug(w).classes()).not.toContain('pouring')
    expect(lampEl(w).classes()).toContain('lit')
    expect(lampEl(w).attributes('aria-label')).toBe('lampe-brennt')
    expect(lampEl(w).find('.gm-sign').exists()).toBe(true)
    expect(w.text()).toContain('Die Lampe brennt!')
    expect(played).toContain('right')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.text()).toContain('Lampen: 1 von 6')
    await tick(1600)
    expect(level(w)).toBe(0)
    expect(lampEl(w).classes()).not.toContain('lit')
    expect(w.findAll('.gm-tiny')).toHaveLength(1)
  })

  it('too little: the lamp flickers and goes out (a cross and "Fülle mehr"), the oil stays and one pours on; no mistake', async () => {
    const w = mountIt()
    await hold(w, 1000)
    expect(lampEl(w).classes()).toContain('cold')
    expect(lampEl(w).attributes('aria-label')).toBe('lampe-aus')
    expect(lampEl(w).find('.gm-sign').exists()).toBe(true)
    expect(w.text()).toContain('Fülle mehr!')
    expect(level(w)).toBe(22)
    expect(useTaskProgress().parts.value).toBe(0)
    await hold(w, 1700)
    expect(level(w)).toBe(59)
    expect(lampEl(w).classes()).toContain('lit')
    // all other lamps without a mistake: three stars at the end
    await tick(1600)
    await hold(w, toMark(80))
    await tick(1600)
    await hold(w, toMark(45))
    await tick(1600 + 1400)
    expect(w.text()).toContain('Runde 2 von 2')
    for (const m of [70, 50, 85]) {
      await hold(w, toMark(m))
      await tick(1600)
    }
    await tick(2900)
    await w.find('button.adv-btn').trigger('click')
    expect(w.emitted('done')![0]).toEqual([3])
  })

  it('too much: the oil runs over (drops, a cross, one mistake), the level goes back to the mark and the lamp burns', async () => {
    const w = mountIt()
    await hold(w, 4000)
    expect(lampEl(w).find('.gm-drops').exists()).toBe(true)
    expect(lampEl(w).find('.gm-sign').exists()).toBe(true)
    expect(w.text()).toContain('Zu viel! Das Öl läuft über.')
    expect(count('wrong')).toBe(1)
    expect(level(w)).toBe(88)
    await tick(1000)
    expect(level(w)).toBe(60)
    expect(lampEl(w).classes()).toContain('lit')
    expect(useTaskProgress().parts.value).toBe(1)
    // a jug that is held on stops by itself at the top: too much, too
    await tick(1600)
    pointer(jug(w).element, 'pointerdown', 5, 5)
    await tick(4700)
    expect(level(w)).toBe(100)
    expect(count('wrong')).toBe(2)
    expect(lampEl(w).find('.gm-drops').exists()).toBe(true)
    pointer(window, 'pointerup', 5, 5)
  })

  it('a lamp that burns takes no more oil while the next one is not ready', async () => {
    const w = mountIt()
    await hold(w, toMark(60))
    pointer(jug(w).element, 'pointerdown', 5, 5)
    await tick(500)
    pointer(window, 'pointerup', 5, 5)
    expect(level(w)).toBe(60)
  })

  it('the keyboard: holding Space pours, letting go ends it', async () => {
    const w = mountIt()
    await jug(w).trigger('keydown', { key: ' ' })
    await jug(w).trigger('keydown', { key: ' ', repeat: true })
    await tick(toMark(60))
    expect(level(w)).toBeGreaterThan(55)
    await jug(w).trigger('keyup', { key: ' ' })
    expect(level(w)).toBe(60)
    expect(lampEl(w).classes()).toContain('lit')
  })

  it('the button "Eingießen" pours as long as it is held', async () => {
    const w = mountIt()
    const b = w.find('button.gm-btn.pour')
    pointer(b.element, 'pointerdown', 5, 5)
    await tick(toMark(60))
    pointer(window, 'pointerup', 5, 5)
    await flushPromises()
    expect(lampEl(w).classes()).toContain('lit')
  })

  it('"Tippen statt Halten": every tap pours a little, the lamp lights as soon as the oil stands at the mark; no mistake is possible', async () => {
    const w = mountIt()
    await w.findAll('button.gm-btn').find((b) => b.text() === 'Tippen statt Halten')!.trigger('click')
    expect(w.text()).toContain('Tippe auf den Krug, bis das Öl bei der Marke steht.')
    for (let i = 0; i < 6; i++) await jug(w).trigger('click')
    expect(level(w)).toBe(45)
    expect(lampEl(w).classes()).not.toContain('lit')
    await jug(w).trigger('click')
    expect(level(w)).toBe(53)
    expect(lampEl(w).classes()).toContain('lit')
    expect(count('wrong')).toBe(0)
  })

  it('a click without a press (a screen reader) pours one tap', async () => {
    const w = mountIt()
    await jug(w).trigger('click')
    expect(level(w)).toBe(8)
  })

  it('round 2 has a narrower tolerance, at the end the six lamps stand in a row; four overflows give two stars; the words of the Bible', async () => {
    const w = mountIt()
    // overflow on the first three lamps, then right
    for (let i = 0; i < 3; i++) {
      await hold(w, 4400)
      await tick(1000 + 1600)
    }
    await tick(1400)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.text()).toContain('Lampen: 3 von 6')
    // 70 %: 77 % is outside the narrower tolerance of 7 (it would have been right with 10)
    await hold(w, toMark(78))
    expect(count('wrong')).toBe(4)
    await tick(1000 + 1600)
    for (const m of [50, 85]) {
      await hold(w, toMark(m))
      await tick(1600)
    }
    expect(w.find('.gm-view').exists()).toBe(true)
    expect(w.text()).toContain('Sechs Lampen brennen in der Nacht')
    await tick(2900)
    expect(w.text()).toContain('nahmen Öl in ihren Gefäßen mit ihren Lampen')
    expect(useTaskProgress().finished.value).toBe(true)
    await w.find('button.adv-btn').trigger('click')
    expect(w.emitted('done')![0]).toEqual([2])
    expect(problems()).toEqual([])
  })

  it('"Go on" gives two stars after four lamps; English and Spanish words', async () => {
    const w = mountIt()
    const goal = useTaskProgress().goal.value
    for (const m of [60, 80, 45]) {
      await hold(w, toMark(m))
      await tick(1600)
    }
    await tick(1400)
    await hold(w, toMark(70))
    expect(partialStars(useTaskProgress().parts.value, goal)).toBe(2)
    const en = mountIt(LAMPS, 'en')
    expect(en.text()).toContain('Lamps: 0 of 6')
    expect(en.findAll('button.gm-btn').some((b) => b.text() === 'Pour')).toBe(true)
    const es = mountIt(LAMPS, 'es')
    expect(es.text()).toContain('Lámparas: 0 de 6')
    expect(es.findAll('button.gm-btn').some((b) => b.text() === 'Verter')).toBe(true)
  })
})

// ---------------------------------------------------------------- who needs what
describe('Wer braucht was? (helfen)', () => {
  const mountIt = (game: HelpGame = HELP, locale: 'de' | 'en' | 'es' = 'de') => mount(GameHelp, { props: { game }, ...opts(locale) })
  type W = ReturnType<typeof mountIt>
  const card = (w: W, id: string) => w.find(`button.gm-card[aria-label$="Karte ${id}: zu einem Menschen ziehen oder antippen"]`)
  const person = (w: W, id: string) => w.find(`[data-person="${id}"]`)
  /** Tap the card, then the person. */
  const give = async (w: W, c: string, p: string) => {
    await card(w, c).trigger('click')
    await person(w, p).trigger('click')
  }
  /** The people stand side by side on the "screen", 30 pixels apart. */
  const layout = (w: W) => w.findAll('[data-person]').forEach((el, i) => boxes.set(el.element, { left: i * 30, top: 40, right: i * 30 + 24, bottom: 90 }))

  it('the sample data are in order; the goal is six; three people in need, three cards in a row, the hint and the round', () => {
    expect(helpProblems(HELP)).toEqual([])
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(6)
    expect(w.findAll('button.gm-person')).toHaveLength(3)
    expect(w.findAll('button.gm-card')).toHaveLength(3)
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.text()).toContain('Geholfen: 0 von 6')
    expect(person(w, 'hunger').attributes('aria-label')).toBe('Mensch hunger: wartet auf Hilfe')
    expect(w.find('[data-person="frieren"]').exists()).toBe(false)
    expect(problems()).toEqual([])
  })

  it('the right card: the person is glad (the glad picture, a tick), the card stays with him, a soft tone', async () => {
    const w = mountIt()
    await card(w, 'hunger').trigger('click')
    expect(card(w, 'hunger').attributes('aria-pressed')).toBe('true')
    expect(w.text()).toContain('Karte hunger gewählt. Tippe jetzt den Menschen an, der das braucht.')
    await person(w, 'hunger').trigger('click')
    expect(person(w, 'hunger').classes()).toContain('glad')
    expect(person(w, 'hunger').html()).toContain('mensch-hunger-froh')
    expect(person(w, 'durst').html()).toContain('mensch-durst.webp'.replace('.webp', ''))
    expect(person(w, 'durst').html()).not.toContain('froh')
    expect(person(w, 'hunger').find('.gm-mark').exists()).toBe(true)
    expect(person(w, 'hunger').attributes('aria-label')).toBe('Mensch hunger: ist froh')
    expect(w.findAll('.gm-given')).toHaveLength(1)
    expect(w.findAll('button.gm-card')).toHaveLength(2)
    expect(played).toContain('right')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.text()).toContain('Geholfen: 1 von 6')
    expect(w.text()).toContain('Richtig! Das hilft, und der Mensch freut sich.')
    expect(problems()).toEqual([])
  })

  it('the wrong card wobbles and stays in the row (a cross and a word); the same pair twice is one mistake', async () => {
    const w = mountIt()
    await give(w, 'durst', 'hunger')
    expect(card(w, 'durst').classes()).toContain('wobble')
    expect(person(w, 'hunger').find('.gm-mark').exists()).toBe(true)
    expect(w.text()).toContain('Das passt nicht. Schau noch einmal, wer das braucht.')
    expect(count('wrong')).toBe(1)
    expect(w.findAll('button.gm-card')).toHaveLength(3)
    expect(useTaskProgress().parts.value).toBe(0)
    await tick(1800)
    expect(card(w, 'durst').classes()).not.toContain('wobble')
    await give(w, 'durst', 'hunger')
    expect(count('wrong')).toBe(2)
    // four more different pairs: five mistakes in all are two stars; the same pair again would have made six
    for (const [c, p] of [['durst', 'fremd'], ['hunger', 'durst'], ['hunger', 'fremd'], ['fremd', 'hunger']] as const) await give(w, c, p)
    for (const [c, p] of [['hunger', 'hunger'], ['durst', 'durst'], ['fremd', 'fremd']] as const) await give(w, c, p)
    await tick(2800)
    for (const [c, p] of [['frieren', 'frieren'], ['krank', 'krank'], ['gefangen', 'gefangen']] as const) await give(w, c, p)
    await tick(2100)
    await w.find('button.adv-btn').trigger('click')
    expect(w.emitted('done')![0]).toEqual([2])
  })

  it('dragging a card to the person who needs it; a drop beside the people does nothing; on someone who is glad already: "Dem ist schon geholfen"', async () => {
    const w = mountIt()
    layout(w)
    const c = card(w, 'durst')
    pointer(c.element, 'pointerdown', 5, 5)
    pointer(window, 'pointermove', 90, 20)
    await flushPromises()
    expect(w.find('.gm-ghost').exists()).toBe(true)
    pointer(window, 'pointerup', 90, 20)
    await flushPromises()
    expect(w.find('.gm-ghost').exists()).toBe(false)
    expect(count('wrong')).toBe(0)
    // the thirsty one is the second person (box from x = 30 to 54)
    pointer(c.element, 'pointerdown', 5, 5)
    pointer(window, 'pointermove', 40, 60)
    pointer(window, 'pointerup', 40, 60)
    await flushPromises()
    expect(person(w, 'durst').classes()).toContain('glad')
    expect(useTaskProgress().parts.value).toBe(1)
    // a card dropped on the thirsty one again
    pointer(card(w, 'fremd').element, 'pointerdown', 5, 5)
    pointer(window, 'pointermove', 40, 60)
    pointer(window, 'pointerup', 40, 60)
    await flushPromises()
    expect(w.text()).toContain('Dem ist schon geholfen.')
    expect(count('wrong')).toBe(0)
  })

  it('all three: round 2 with the others, the first three stand glad in the village; then the end with three stars and the words of the Bible', async () => {
    const w = mountIt()
    await give(w, 'hunger', 'hunger')
    await give(w, 'durst', 'durst')
    await give(w, 'fremd', 'fremd')
    expect(w.text()).toContain('Allen ist geholfen!')
    await tick(2800)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.findAll('button.gm-person')).toHaveLength(3)
    expect(w.findAll('.gm-person.glad')).toHaveLength(3)
    expect(w.findAll('button.gm-card')).toHaveLength(3)
    expect(person(w, 'frieren').exists()).toBe(true)
    await give(w, 'frieren', 'frieren')
    await give(w, 'krank', 'krank')
    await give(w, 'gefangen', 'gefangen')
    await tick(2100)
    expect(w.text()).toContain('einem unter diesen meinen geringsten Brüdern')
    expect(played).toContain('star')
    expect(useTaskProgress().finished.value).toBe(true)
    await w.find('button.adv-btn').trigger('click')
    expect(w.emitted('done')![0]).toEqual([3])
    expect(problems()).toEqual([])
  })

  it('"Go on" gives one star after two of six people; English and Spanish words', async () => {
    const w = mountIt()
    const goal = useTaskProgress().goal.value
    await give(w, 'hunger', 'hunger')
    expect(partialStars(useTaskProgress().parts.value, goal)).toBe(0)
    await give(w, 'durst', 'durst')
    expect(partialStars(useTaskProgress().parts.value, goal)).toBe(1)
    const en = mountIt(HELP, 'en')
    expect(en.text()).toContain('Helped: 0 of 6')
    expect(en.find('[data-person="hunger"]').attributes('aria-label')).toBe('Mensch hunger: waiting for help')
    const es = mountIt(HELP, 'es')
    expect(es.text()).toContain('Ayudados: 0 de 6')
    expect(es.find('[data-person="hunger"]').attributes('aria-label')).toBe('Mensch hunger: espera ayuda')
  })
})
