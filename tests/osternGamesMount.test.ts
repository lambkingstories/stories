/**
 * The two new games of "Ostern" (`fischzug` = GameFischzug, `weiden` = GameGraze): each is mounted with sample data and played through: aiming and casting (finger, tap, keyboard), the swarms and the
 * catch, the empty cast, the new try of a round, walking the shepherd (drag, tap, keys), the animals that join and follow, the thorns, the brook with its bridge, the pen, the rounds, the goal for the stars
 * of "Go on" (`useTaskProgress`), the end with its stars and the words of the Bible, German, English and Spanish words.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import spanish from '@/i18n/app.es'
import useTaskProgress from '@/use/useTaskProgress'
import GameFischzug from '@/components/molecules/games/GameFischzug.vue'
import GameGraze from '@/components/molecules/games/GameGraze.vue'
import { partialStars } from '@/utils/adventureScore'
import { fischzugProblems, grazeProblems, osterDist, osterStars } from '@/utils/osternGames'
import type { Pt } from '@/utils/osternGames'
import { FISCH, GRAZE } from './osternSamples'
import type { FischzugGame, GrazeGame } from '@/types/adventure'

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
const pointer = (el: Element | Window, type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel', x = 0, y = 0) =>
  el.dispatchEvent(new MouseEvent(type, { bubbles: true, button: 0, buttons: type === 'pointerup' ? 0 : 1, clientX: x, clientY: y }))

/** The field is 300 x 200 pixels: a place in percent is three pixels across and two pixels down per percent. */
const px = (p: Pt) => ({ x: (p.x / 100) * 300, y: (p.y / 100) * 200 })
const num = (s: string) => parseFloat(s)

// ---------------------------------------------------------------- the net on the right
describe('Das Netz zur Rechten (fischzug)', () => {
  const mountIt = (game: FischzugGame = FISCH, locale: 'de' | 'en' | 'es' = 'de') => {
    const w = mount(GameFischzug, { props: { game }, ...opts(locale) })
    layout(w)
    return w
  }
  type W = ReturnType<typeof mountIt>
  /** The field is 300 x 200 pixels, the boat lies at the lower left (30 x 40 pixels). */
  const layout = (w: W) => {
    boxes.set(w.find('.gm-field').element, { left: 0, top: 0, right: 300, bottom: 200 })
    boxes.set(w.find('.gm-boat').element, { left: 10, top: 150, right: 60, bottom: 195 })
  }
  /** Where the fish swim now (percent), by index; the caught ones that flew to the basket are marked. */
  const fishAt = (w: W) => w.findAll('.gm-fish').map((el) => ({ i: Number(el.attributes('data-fish')), x: num((el.element as HTMLElement).style.left), y: num((el.element as HTMLElement).style.top), gone: el.classes().includes('gone') }))
  const free = (w: W) => fishAt(w).filter((f) => !f.gone)
  const radius = FISCH.net.w / 2
  const middle = (ps: Pt[]): Pt => ({ x: ps.reduce((n, p) => n + p.x, 0) / ps.length, y: ps.reduce((n, p) => n + p.y, 0) / ps.length })
  /** A place on the water where a cast takes in no fish at all. */
  const emptySpot = (w: W): Pt => {
    const ps = free(w)
    for (let x = 12; x <= 88; x += 2)
      for (let y = 34; y <= 76; y += 2) if (ps.every((p) => osterDist(p, { x, y }) > radius + 4)) return { x, y }
    throw new Error('no empty place')
  }
  /** A place where a cast takes in exactly `n` of the free fish. */
  const spotWith = (w: W, n: number): Pt => {
    const ps = free(w)
    for (let x = 6; x <= 94; x += 1)
      for (let y = 30; y <= 78; y += 1) if (ps.filter((p) => osterDist(p, { x, y }) <= radius).length === n) return { x, y }
    throw new Error(`no place with ${n} fish`)
  }
  /** Tap the water (a pointer down and up at the same place) and wait until the net is back. */
  const castAt = async (w: W, at: Pt, wait = 1700) => {
    const p = px(at)
    pointer(w.find('.gm-field').element, 'pointerdown', p.x, p.y)
    pointer(window, 'pointerup', p.x, p.y)
    await flushPromises()
    await tick(wait)
  }
  const castEmpty = async (w: W) => castAt(w, emptySpot(w))

  it('the sample data are in order; the goal is every fish that is enough (4 + 6); five shadows, the boat, the basket, the hint, the round and the casts', () => {
    expect(fischzugProblems(FISCH)).toEqual([])
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(10)
    expect(w.findAll('.gm-fish')).toHaveLength(5)
    expect(w.find('.gm-boat').exists()).toBe(true)
    expect(w.find('.gm-basket').exists()).toBe(true)
    expect(w.find('.gm-aim').exists()).toBe(false)
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.text()).toContain('Gefangen: 0 von 4')
    expect(w.text()).toContain('Würfe übrig: 3 von 3')
    expect(w.find('.gm-field').attributes('aria-label')).toBe('Der See am frühen Morgen mit dem Boot und den Fischen unter dem Wasser')
    expect(w.find('.gm-field').attributes('tabindex')).toBe('0')
    expect(w.find('.gm-boat').attributes('aria-label')).toBe('boot')
    expect(problems()).toEqual([])
  })

  it('the fish swim slowly and look the way they swim', async () => {
    const w = mountIt()
    const before = fishAt(w)
    await tick(3000)
    const after = fishAt(w)
    const moved = after.filter((f, k) => osterDist(f, before[k]!) > 3)
    expect(moved.length).toBeGreaterThan(0)
    // never farther than about 4 units a second
    after.forEach((f, k) => expect(osterDist(f, before[k]!)).toBeLessThan(3 * 4.5 + 3))
    expect(w.findAll('.gm-fish .gm-flip').every((el) => /scaleX\((1|-1)\)/.test(el.attributes('style') ?? ''))).toBe(true)
  })

  it('the finger pulls the circle onto the water (the size of the net), it follows the finger and lets go: the net is cast', async () => {
    const w = mountIt()
    const field = w.find('.gm-field').element
    const a = px({ x: 30, y: 50 })
    pointer(field, 'pointerdown', a.x, a.y)
    await flushPromises()
    let aim = w.find('.gm-aim')
    expect(aim.exists()).toBe(true)
    expect((aim.element as HTMLElement).style.width).toBe('30%')
    expect(num((aim.element as HTMLElement).style.left)).toBeCloseTo(30)
    const b = px({ x: 70, y: 40 })
    pointer(window, 'pointermove', b.x, b.y)
    await flushPromises()
    aim = w.find('.gm-aim')
    expect(num((aim.element as HTMLElement).style.left)).toBeCloseTo(70)
    expect(num((aim.element as HTMLElement).style.top)).toBeCloseTo(40)
    pointer(window, 'pointerup', b.x, b.y)
    await flushPromises()
    expect(w.find('.gm-aim').exists()).toBe(false)
    expect(w.find('.gm-net').exists()).toBe(true)
    expect(w.text()).toContain('Würfe übrig: 2 von 3')
    // while the net is in the water a second cast does nothing
    pointer(field, 'pointerdown', a.x, a.y)
    pointer(window, 'pointerup', a.x, a.y)
    await flushPromises()
    expect(w.text()).toContain('Würfe übrig: 2 von 3')
    await tick(1700)
    expect(w.find('.gm-net').exists()).toBe(false)
  })

  it('a cast over the swarm takes in every fish under the net: they glitter, a tick, the count rises, the goal for "Go on" is marked', async () => {
    const w = mountIt()
    const at = middle(free(w))
    const p = px(at)
    pointer(w.find('.gm-field').element, 'pointerdown', p.x, p.y)
    pointer(window, 'pointerup', p.x, p.y)
    await flushPromises()
    await tick(30 + 450 + 10)
    expect(w.find('.gm-net.sink').exists()).toBe(true)
    expect(w.find('.gm-net .gm-mark').exists()).toBe(true)
    expect(w.findAll('.gm-fish.glint')).toHaveLength(5)
    expect(w.text()).toContain('Gefangen! Die Fische glitzern im Netz.')
    expect(w.text()).toContain('Gefangen: 5 von 4')
    expect(count('bead')).toBe(1)
    expect(useTaskProgress().parts.value).toBe(4)
    await tick(350 + 20)
    expect(w.findAll('.gm-fish.gone')).toHaveLength(5)
    expect(count('wrong')).toBe(0)
    expect(problems()).toEqual([])
  })

  it('the fish stand still while the net is in the air (what was aimed at is what the net meets)', async () => {
    const w = mountIt()
    const p = px(emptySpot(w))
    pointer(w.find('.gm-field').element, 'pointerdown', p.x, p.y)
    pointer(window, 'pointerup', p.x, p.y)
    await flushPromises()
    const before = fishAt(w)
    await tick(400)
    expect(fishAt(w)).toEqual(before)
    await tick(1500)
    expect(fishAt(w)).not.toEqual(before)
  })

  it('a cast without a catch is a mistake: a cross and a word, a low tone, the net comes back; the cast is used up', async () => {
    const w = mountIt()
    const p = px(emptySpot(w))
    pointer(w.find('.gm-field').element, 'pointerdown', p.x, p.y)
    pointer(window, 'pointerup', p.x, p.y)
    await flushPromises()
    await tick(30 + 450 + 10)
    expect(w.find('.gm-net.empty').exists()).toBe(true)
    expect(w.find('.gm-net .gm-mark').exists()).toBe(true)
    expect(w.text()).toContain('Das Netz ist leer. Wirf dorthin, wo die Fische schwimmen.')
    expect(count('wrong')).toBe(1)
    expect(w.findAll('.gm-fish.glint')).toHaveLength(0)
    await tick(1200)
    expect(w.find('.gm-net').exists()).toBe(false)
    expect(w.text()).toContain('Würfe übrig: 2 von 3')
    expect(w.text()).toContain('Gefangen: 0 von 4')
    expect(useTaskProgress().parts.value).toBe(0)
  })

  it('letting go over the boat takes the cast back: no cast, no mistake', async () => {
    const w = mountIt()
    const field = w.find('.gm-field').element
    const a = px({ x: 50, y: 50 })
    pointer(field, 'pointerdown', a.x, a.y)
    pointer(window, 'pointermove', 30, 170)
    pointer(window, 'pointerup', 30, 170)
    await flushPromises()
    expect(w.find('.gm-net').exists()).toBe(false)
    expect(w.find('.gm-aim').exists()).toBe(false)
    expect(w.text()).toContain('Würfe übrig: 3 von 3')
    expect(w.text()).toContain('Zieh das Netz aufs Wasser und lass dort los.')
    expect(count('wrong')).toBe(0)
  })

  it('a cancelled touch (pointercancel) takes the cast back', async () => {
    const w = mountIt()
    const a = px({ x: 50, y: 50 })
    pointer(w.find('.gm-field').element, 'pointerdown', a.x, a.y)
    await flushPromises()
    expect(w.find('.gm-aim').exists()).toBe(true)
    pointer(window, 'pointercancel', a.x, a.y)
    await flushPromises()
    expect(w.find('.gm-aim').exists()).toBe(false)
    expect(w.text()).toContain('Würfe übrig: 3 von 3')
  })

  it('the keyboard: Enter shows the circle, the arrows move it by three, Enter casts, Escape puts it away', async () => {
    const w = mountIt()
    const field = w.find('.gm-field')
    await field.trigger('keydown', { key: 'Enter' })
    expect(w.find('.gm-aim').exists()).toBe(true)
    expect(w.text()).toContain('Mit den Pfeiltasten verschiebst du den Kreis')
    expect(num((w.find('.gm-aim').element as HTMLElement).style.left)).toBe(50)
    await field.trigger('keydown', { key: 'ArrowRight' })
    await field.trigger('keydown', { key: 'ArrowRight' })
    expect(num((w.find('.gm-aim').element as HTMLElement).style.left)).toBe(56)
    await field.trigger('keydown', { key: 'ArrowUp' })
    expect(num((w.find('.gm-aim').element as HTMLElement).style.top)).toBeCloseTo(54 - 4.5)
    await field.trigger('keydown', { key: 'Escape' })
    expect(w.find('.gm-aim').exists()).toBe(false)
    await field.trigger('keydown', { key: 'ArrowLeft' })
    expect(num((w.find('.gm-aim').element as HTMLElement).style.left)).toBe(47)
    await field.trigger('keydown', { key: ' ' })
    expect(w.find('.gm-net').exists()).toBe(true)
    expect(w.text()).toContain('Würfe übrig: 2 von 3')
    await tick(1700)
  })

  it('a button "Wirf für mich" shows after fifteen seconds without a cast and casts where most fish are', async () => {
    const w = mountIt()
    expect(w.text()).not.toContain('Wirf für mich')
    await tick(15500)
    expect(w.text()).toContain('Wirf für mich')
    const btn = w.findAll('button').find((b) => b.text() === 'Wirf für mich')!
    await btn.trigger('click')
    await tick(30 + 450 + 10)
    expect(w.find('.gm-net.sink').exists()).toBe(true)
    expect(w.findAll('.gm-fish.glint').length).toBeGreaterThanOrEqual(3)
    await tick(1500)
    expect(w.text()).not.toContain('Wirf für mich')
  })

  it('"Go on" gives one star after three of the ten fish; casts that find nothing and a new try of the round do not count a fish twice', async () => {
    const w = mountIt()
    const goal = useTaskProgress().goal.value
    await castAt(w, spotWith(w, 3))
    expect(useTaskProgress().parts.value).toBe(3)
    expect(partialStars(useTaskProgress().parts.value, goal)).toBe(1)
    await castEmpty(w)
    await castEmpty(w)
    // the casts are used up: the fish have moved on, the round begins again
    expect(w.text()).toContain('Die Fische sind weitergezogen. Versuch es noch einmal.')
    await tick(2300)
    expect(w.findAll('.gm-fish')).toHaveLength(5)
    expect(w.findAll('.gm-fish.gone')).toHaveLength(0)
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.text()).toContain('Würfe übrig: 3 von 3')
    expect(w.text()).toContain('Gefangen: 0 von 4')
    expect(useTaskProgress().parts.value).toBe(3)
    // all five this time: only one more fish counts for the goal of four
    await castAt(w, middle(free(w)))
    expect(useTaskProgress().parts.value).toBe(4)
  })

  it('both rounds: five fish in one swarm, then eight in two swarms of four; then the full net on the shore with the words of the Bible and three stars', async () => {
    const w = mountIt()
    await castAt(w, middle(free(w)), 1600)
    expect(w.text()).toContain('Das Netz ist voll!')
    expect(played).toContain('right')
    await tick(3200)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.findAll('.gm-fish')).toHaveLength(8)
    expect(w.text()).toContain('Gefangen: 0 von 6')
    expect(w.text()).toContain('Würfe übrig: 4 von 4')
    // the two swarms: the fish are dealt round by round, so the even ones are one swarm and the odd ones the other
    const school = (k: number) => free(w).filter((f) => f.i % 2 === k)
    await castAt(w, middle(school(0)))
    expect(w.text()).toContain('Gefangen: 4 von 6')
    expect(w.text()).not.toContain('Das Netz ist voll!')
    expect(useTaskProgress().parts.value).toBe(4 + 4)
    await castAt(w, middle(school(1)), 1600)
    expect(w.text()).toContain('Das Netz ist voll!')
    await tick(2500)
    expect(played).toContain('star')
    expect(w.find('.gm-full').exists()).toBe(true)
    expect(w.find('.gm-full .gm-mark').exists()).toBe(true)
    expect(w.text()).toContain('Werfet das Netz zur Rechten des Schiffs')
    expect(useTaskProgress().finished.value).toBe(true)
    expect(useTaskProgress().parts.value).toBe(10)
    await w.find('button.adv-btn').trigger('click')
    expect(w.emitted('done')![0]).toEqual([3])
    expect(problems()).toEqual([])
  })

  it('mistakes cost stars: three empty casts give two stars, six give one', async () => {
    const run = async (empties: number) => {
      const w = mountIt()
      for (let i = 0; i < empties; i++) {
        await castEmpty(w)
        if ((i + 1) % 3 === 0) await tick(2300)
      }
      await castAt(w, middle(free(w)), 1600)
      await tick(3200)
      await castAt(w, middle(free(w).filter((f) => f.i % 2 === 0)))
      await castAt(w, middle(free(w)), 1600)
      await tick(2500)
      await w.find('button.adv-btn').trigger('click')
      return w.emitted('done')![0]
    }
    expect(await run(3)).toEqual([2])
    expect(osterStars(3)).toBe(2)
    expect(await run(6)).toEqual([1])
    expect(osterStars(6)).toBe(1)
  })

  it('English and Spanish words', () => {
    const en = mountIt(FISCH, 'en')
    expect(en.text()).toContain('Caught: 0 of 4')
    expect(en.text()).toContain('Casts left: 3 of 3')
    expect(en.find('.gm-field').attributes('aria-label')).toContain('The lake in the early morning')
    const es = mountIt(FISCH, 'es')
    expect(es.text()).toContain('Pescados: 0 de 4')
    expect(es.text()).toContain('Lanzamientos que quedan: 3 de 3')
  })
})

// ---------------------------------------------------------------- lead the lambs
describe('Die Lämmer führen (weiden)', () => {
  const mountIt = (game: GrazeGame = GRAZE, locale: 'de' | 'en' | 'es' = 'de') => {
    const w = mount(GameGraze, { props: { game }, ...opts(locale) })
    layout(w)
    return w
  }
  type W = ReturnType<typeof mountIt>
  const layout = (w: W) => boxes.set(w.find('.gm-field').element, { left: 0, top: 0, right: 300, bottom: 200 })
  const hirte = (w: W): Pt => ({ x: num((w.find('.gm-hirte').element as HTMLElement).style.left), y: num((w.find('.gm-hirte').element as HTMLElement).style.top) })
  const animalAt = (w: W, i: number): Pt => ({ x: num((w.find(`[data-animal="${i}"]`).element as HTMLElement).style.left), y: num((w.find(`[data-animal="${i}"]`).element as HTMLElement).style.top) })
  const field = (w: W) => w.find('.gm-field').element
  /** Touch the meadow at a place and let go (the shepherd walks there). */
  const goTo = async (w: W, at: Pt, seconds: number) => {
    const p = px(at)
    pointer(field(w), 'pointerdown', p.x, p.y)
    pointer(window, 'pointerup', p.x, p.y)
    await flushPromises()
    await tick(seconds * 1000)
  }
  /** Let time pass in small steps until the condition is true (at most `maxSeconds`): the words on the screen stay only a few seconds. */
  const until = async (cond: () => boolean, maxSeconds = 30) => {
    for (let i = 0; i < maxSeconds * 10 && !cond(); i++) await tick(100)
    return cond()
  }
  const said = (w: W, text: string) => w.text().includes(text)
  const brook: GrazeGame = { ...GRAZE, rounds: [GRAZE.rounds[1]!] }
  const lane = (GRAZE.stream.top + GRAZE.stream.bottom) / 2

  it('the sample data are in order; the goal is every animal (4 + 4); the title of the round, four animals, a thornbush, the pen, no bridge in round 1; the shepherd at his place', () => {
    expect(grazeProblems(GRAZE)).toEqual([])
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(8)
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.text()).toContain('Weide meine Lämmer!')
    expect(w.text()).toContain('Auf der Weide: 0 von 4')
    expect(w.findAll('.gm-animal')).toHaveLength(4)
    expect(w.findAll('.gm-thorn')).toHaveLength(1)
    expect(w.find('.gm-pen').exists()).toBe(true)
    expect(w.find('.gm-bridge').exists()).toBe(false)
    expect(w.find('.gm-target').exists()).toBe(false)
    expect(hirte(w)).toEqual({ x: 8, y: 72 })
    expect(animalAt(w, 0)).toEqual({ x: 22, y: 66 })
    expect(w.find('[data-animal="0"]').attributes('aria-label')).toBe('lamm-1: wartet')
    expect(w.find('.gm-field').attributes('tabindex')).toBe('0')
    expect(problems()).toEqual([])
  })

  it('a tap on the meadow sends the shepherd there at 22 units a second (a ring of at least 44 pixels shows where); he turns round and stops at the place', async () => {
    const w = mountIt()
    const p = px({ x: 60, y: 72 })
    pointer(field(w), 'pointerdown', p.x, p.y)
    pointer(window, 'pointerup', p.x, p.y)
    await flushPromises()
    expect(w.find('.gm-target').exists()).toBe(true)
    await tick(1000)
    expect(hirte(w).x).toBeGreaterThan(8 + 18)
    expect(hirte(w).x).toBeLessThan(8 + 26)
    expect(w.find('.gm-hirte').classes()).toContain('walking')
    await tick(3000)
    expect(hirte(w).x).toBeCloseTo(60, 0)
    expect(w.find('.gm-target').exists()).toBe(false)
    expect(w.find('.gm-hirte').classes()).not.toContain('walking')
    // back to the left: he looks to the left
    await goTo(w, { x: 30, y: 72 }, 0.5)
    expect(w.find('.gm-hirte .gm-flip').attributes('style')).toContain('scaleX(-1)')
  })

  it('dragging moves the shepherd after the finger', async () => {
    const w = mountIt()
    const a = px({ x: 10, y: 72 })
    pointer(field(w), 'pointerdown', a.x, a.y)
    const b = px({ x: 20, y: 60 })
    pointer(window, 'pointermove', b.x, b.y)
    await flushPromises()
    await tick(2000)
    expect(hirte(w).x).toBeCloseTo(20, 0)
    expect(hirte(w).y).toBeCloseTo(60, 0)
    pointer(window, 'pointerup', b.x, b.y)
  })

  it('the arrow keys walk the shepherd: six units across, as much on the screen down', async () => {
    const w = mountIt()
    await w.find('.gm-field').trigger('keydown', { key: 'ArrowRight' })
    await tick(1000)
    expect(hirte(w).x).toBeCloseTo(14, 0)
    await w.find('.gm-field').trigger('keydown', { key: 'ArrowUp' })
    await tick(1000)
    expect(hirte(w).y).toBeCloseTo(72 - 9, 0)
  })

  it('an animal that is near enough joins: a tone, a word, and it walks after him', async () => {
    const w = mountIt()
    await goTo(w, { x: 24, y: 70 }, 1.5)
    expect(count('tap')).toBeGreaterThanOrEqual(1)
    expect(w.text()).toContain('Es kommt mit!')
    expect(w.find('[data-animal="0"]').attributes('aria-label')).toBe('lamm-1: folgt dir')
    expect(w.find('[data-animal="0"]').classes()).toContain('follow')
    await goTo(w, { x: 40, y: 70 }, 3)
    expect(osterDist(animalAt(w, 0), hirte(w))).toBeLessThan(12)
  })

  it('a thornbush stops an animal that walks into it: a cross and "Mäh!", a low tone, a mistake; the animal stands', async () => {
    const w = mountIt()
    const p = px({ x: 90, y: 72 })
    pointer(field(w), 'pointerdown', p.x, p.y)
    pointer(window, 'pointerup', p.x, p.y)
    expect(await until(() => w.findAll('.gm-animal.stuck').length >= 1)).toBe(true)
    expect(w.find('.gm-animal.stuck .gm-sign.bad').exists()).toBe(true)
    expect(w.find('.gm-animal.stuck .gm-sign.bad').text()).toContain('Mäh!')
    expect(w.find('.gm-animal.stuck').attributes('aria-label')).toContain('steht im Dornbusch')
    expect(w.text()).toContain('Ein Dornbusch! Das Tier bleibt stehen und meckert. Geh zu ihm.')
    await tick(9000)
    expect(count('wrong')).toBeGreaterThanOrEqual(1)
    expect(count('wrong')).toBe(w.findAll('.gm-animal.stuck').length)
    // the others went into the pen or stand: nobody is in the bush
    const bush = GRAZE.rounds[0]!.thorns[0]!
    for (let i = 0; i < 4; i++) expect(osterDist(animalAt(w, i), bush)).toBeGreaterThanOrEqual(GRAZE.thorn.w * 0.4 - 0.01)
  })

  it('the shepherd goes back to a stopped animal and calls it: it follows again and walks round the thorns, and every animal ends in the pen', async () => {
    const w = mountIt()
    await goTo(w, { x: 90, y: 72 }, 9)
    const wrongBefore = count('wrong')
    expect(wrongBefore).toBeGreaterThanOrEqual(1)
    const p = px({ x: 47, y: 62 })
    pointer(field(w), 'pointerdown', p.x, p.y)
    pointer(window, 'pointerup', p.x, p.y)
    expect(await until(() => said(w, 'Es folgt dir wieder.'), 12)).toBe(true)
    await goTo(w, { x: 62, y: 60 }, 3)
    await goTo(w, { x: 88, y: 72 }, 3)
    expect(await until(() => useTaskProgress().parts.value === 4, 40)).toBe(true)
    expect(count('wrong')).toBe(wrongBefore)
    expect(played).toContain('right')
  })

  it('a hint button "Hilf mir" shows after twenty seconds and sends the shepherd to the nearest animal', async () => {
    const w = mountIt()
    expect(w.text()).not.toContain('Hilf mir')
    await tick(20500)
    const btn = w.findAll('button').find((b) => b.text() === 'Hilf mir')!
    expect(btn).toBeTruthy()
    await btn.trigger('click')
    expect(w.find('.gm-target').exists()).toBe(true)
    await tick(1200)
    expect(hirte(w).x).toBeGreaterThan(8 + 10)
    expect(w.find('[data-animal="0"]').attributes('aria-label')).toBe('lamm-1: folgt dir')
    await tick(2000)
    expect(w.text()).not.toContain('Hilf mir')
  })

  it('round 2: the brook with its bridge; the shepherd does not walk through the water', async () => {
    const w = mountIt(brook)
    expect(w.text()).toContain('Hüte meine Schafe!')
    expect(w.find('.gm-bridge').exists()).toBe(true)
    expect(w.find('.gm-field').attributes('style')).toContain('wiese-bach')
    expect(w.find('[data-animal="2"]').attributes('aria-label')).toBe('schaf: wartet')
    const p = px({ x: 88, y: 72 })
    pointer(field(w), 'pointerdown', p.x, p.y)
    pointer(window, 'pointerup', p.x, p.y)
    expect(await until(() => said(w, 'Die Tiere gehen nicht ins Wasser. Nimm den Steg.'), 12)).toBe(true)
    expect(hirte(w).x).toBeLessThanOrEqual(GRAZE.stream.from + 0.1)
    await tick(1000)
    expect(w.find('.gm-target').exists()).toBe(false)
  })

  it('both rounds over the meadow and the bridge: all animals in the pen, the next round, the words of Jesus, three stars', async () => {
    const w = mountIt()
    // round 1: past the animals, round the bush, into the pen
    await goTo(w, { x: 40, y: 70 }, 2)
    await goTo(w, { x: 45, y: 60 }, 1)
    await goTo(w, { x: 65, y: 60 }, 1.2)
    await goTo(w, { x: 88, y: 72 }, 1.5)
    expect(await until(() => said(w, 'Alle sind auf der Weide!'), 30)).toBe(true)
    expect(count('wrong')).toBe(0)
    expect(played).toContain('right')
    expect(useTaskProgress().parts.value).toBe(4)
    await tick(3200)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.text()).toContain('Hüte meine Schafe!')
    expect(w.text()).toContain('Auf der Weide: 0 von 4')
    expect(w.find('.gm-bridge').exists()).toBe(true)
    expect(hirte(w)).toEqual({ x: 8, y: 72 })
    // round 2: past the animals, over the bridge (the lane), into the pen
    await goTo(w, { x: 34, y: 70 }, 2.5)
    await goTo(w, { x: 38, y: lane }, 1)
    await goTo(w, { x: 62, y: lane }, 1.5)
    await goTo(w, { x: 88, y: 72 }, 2)
    expect(await until(() => said(w, 'Alle sind auf der Weide!'), 40)).toBe(true)
    expect(count('wrong')).toBe(0)
    await tick(2500)
    expect(played).toContain('star')
    expect(w.text()).toContain('Weide meine Schafe!')
    expect(useTaskProgress().finished.value).toBe(true)
    expect(useTaskProgress().parts.value).toBe(8)
    await w.find('button.adv-btn').trigger('click')
    expect(w.emitted('done')![0]).toEqual([3])
    expect(problems()).toEqual([])
  })

  it('the stars follow the animals that walked into the bush: with the mistakes of the straight way the end gives osterStars(mistakes)', async () => {
    const w = mountIt({ ...GRAZE, rounds: [GRAZE.rounds[0]!] })
    await goTo(w, { x: 90, y: 72 }, 9)
    const wrong = count('wrong')
    expect(wrong).toBeGreaterThanOrEqual(1)
    await goTo(w, { x: 47, y: 62 }, 5)
    await goTo(w, { x: 62, y: 60 }, 3)
    await goTo(w, { x: 88, y: 72 }, 3)
    expect(await until(() => said(w, 'Alle sind auf der Weide!'), 40)).toBe(true)
    expect(count('wrong')).toBe(wrong)
    await tick(2500)
    await w.find('button.adv-btn').trigger('click')
    expect(w.emitted('done')![0]).toEqual([osterStars(wrong)])
  })

  it('"Go on" gives one star after three of the eight animals', async () => {
    const w = mountIt()
    const goal = useTaskProgress().goal.value
    expect(goal).toBe(8)
    await goTo(w, { x: 40, y: 70 }, 2)
    await goTo(w, { x: 45, y: 60 }, 1)
    await goTo(w, { x: 65, y: 60 }, 1.2)
    await goTo(w, { x: 88, y: 72 }, 1.5)
    expect(await until(() => useTaskProgress().parts.value >= 1, 20)).toBe(true)
    expect(await until(() => useTaskProgress().parts.value === 4, 30)).toBe(true)
    expect(partialStars(4, goal)).toBe(1)
    expect(partialStars(2, goal)).toBe(0)
  })

  it('English and Spanish words', () => {
    const en = mountIt(GRAZE, 'en')
    expect(en.text()).toContain('In the pasture: 0 of 4')
    expect(en.find('[data-animal="0"]').attributes('aria-label')).toBe('lamm-1: is waiting')
    const es = mountIt(GRAZE, 'es')
    expect(es.text()).toContain('En el pasto: 0 de 4')
    expect(es.find('[data-animal="0"]').attributes('aria-label')).toBe('lamm-1: espera')
  })
})
