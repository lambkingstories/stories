/**
 * The new games of "David" (`harfe`, `hirte`, `kiesel`, `schleuder`, `pfeil`, `zipfel`): each is mounted with sample data and used: right and wrong moves, the rounds, the goal for the stars of "Go on"
 * (`useTaskProgress`), the end with its stars, German and English words.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import useTaskProgress from '@/use/useTaskProgress'
import { slingAimError, slingAngle, slingPos } from '@/utils/davidGames'
import type { ArrowGame, HarpGame, HemGame, PebblesGame, ShepherdGame, SlingGame } from '@/types/adventure'

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

const mk = (locale: 'de' | 'en') => createI18n({ legacy: false, locale, fallbackLocale: 'de', messages: messages as never, missingWarn: false, fallbackWarn: false })
const opts = (locale: 'de' | 'en' = 'de') => ({ global: { plugins: [mk(locale)], stubs: { RouterLink: true } }, attachTo: document.body })

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
const problems = () => warnings.filter((w) => /not defined on instance|is not a function|Unhandled error|ERROR/.test(w))
const tick = async (ms: number) => {
  await vi.advanceTimersByTimeAsync(ms)
  await flushPromises()
}
const box400x300 = () => vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 400, height: 300, right: 400, bottom: 300, x: 0, y: 0, toJSON: () => ({}) })
const ptr = async (el: Element, type: 'pointerdown' | 'pointermove' | 'pointerup', x: number, y: number) => {
  el.dispatchEvent(new MouseEvent(type, { bubbles: true, button: 0, clientX: x, clientY: y }))
  await flushPromises()
}

// ---------------------------------------------------------------- calm Saul
describe('Saul zur Ruhe bringen (harp)', () => {
  const game: HarpGame = {
    background: 'images/x/halle.webp',
    saul: ['images/x/saul-1.webp', 'images/x/saul-2.webp', 'images/x/saul-3.webp'],
    saulPos: { x: 30, y: 80, w: 25 },
    harp: 'images/x/harfe.webp',
    harpPos: { x: 70, y: 96, w: 40 },
    strings: { n: 4, x0: 0.2, x1: 0.8, y0: 0.1, y1: 0.8 },
    rounds: [
      { hint: 'Streiche langsam.', need: 4, minGap: 300 },
      { hint: 'Noch ruhiger.', need: 5, minGap: 420 }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    const { default: Harp } = await import('@/components/molecules/games/GameHarp.vue')
    const w = mount(Harp, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  const strings = (w: W) => w.findAll('.gh-string')
  const states = (w: W) => w.findAll('.gh-saul-img').map((s) => s.classes().includes('on'))
  /** A calm note: wait, then pluck string `i` (a click from the keyboard). */
  const calm = async (w: W, i = 0, gap = 500) => {
    await tick(gap)
    await strings(w)[i]!.trigger('click')
  }

  it('the goal is every calm note of both rounds; the dots, the eight strings and Saul in his first picture', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(9)
    expect(w.find('.gh-round').text()).toContain('Runde 1 von 2')
    expect(w.find('.gh-hint').text()).toBe('Streiche langsam.')
    expect(w.findAll('.gh-dot')).toHaveLength(4)
    expect(strings(w)).toHaveLength(4)
    expect(states(w)).toEqual([true, false, false])
  })

  it('calm notes bring Saul from restless to tired to calm; a full round says so and goes on to round two', async () => {
    const w = await open()
    await calm(w, 0)
    expect(w.findAll('.gh-dot.on')).toHaveLength(1)
    expect(states(w)).toEqual([true, false, false])
    await calm(w, 1)
    expect(states(w)).toEqual([false, true, false])
    await calm(w, 2)
    expect(states(w)).toEqual([false, false, true])
    expect(played.filter((n) => n === 'bead')).toHaveLength(3)
    expect(useTaskProgress().parts.value).toBe(3)
    await calm(w, 3)
    expect(played).toContain('star')
    expect(w.find('.gh-fb').text()).toBe('Saul ist ruhig.')
    expect(useTaskProgress().parts.value).toBe(4)
    await tick(1800)
    expect(w.find('.gh-round').text()).toContain('Runde 2 von 2')
    expect(w.findAll('.gh-dot')).toHaveLength(5)
    expect(w.findAll('.gh-dot.on')).toHaveLength(0)
    expect(states(w)).toEqual([true, false, false])
    expect(problems()).toEqual([])
  })

  it('a note that follows too quickly is a jangle: a cross, a word, the calm sinks by two, one mistake', async () => {
    const w = await open()
    await calm(w, 0)
    await calm(w, 1)
    expect(w.findAll('.gh-dot.on')).toHaveLength(2)
    await tick(100)
    await strings(w)[2]!.trigger('click')
    expect(w.find('.gh-fb').text()).toContain('Zu schnell')
    expect(w.find('.gm.bad').exists()).toBe(true)
    expect(w.findAll('.gh-dot.on')).toHaveLength(0)
    // the progress of the stars never goes back
    expect(useTaskProgress().parts.value).toBe(2)
    await tick(900)
    expect(w.find('.gm.bad').exists()).toBe(false)
  })

  it('a finger that strokes over the harp plucks the strings it crosses, one after the other', async () => {
    box400x300()
    const w = await open()
    const harp = w.find('.gh-harp').element
    await ptr(harp, 'pointerdown', 80, 100)
    await ptr(harp, 'pointermove', 82, 100)
    expect(played.filter((n) => n === 'bead')).toHaveLength(1)
    await ptr(harp, 'pointermove', 160, 100)
    await ptr(harp, 'pointermove', 240, 100)
    await ptr(harp, 'pointermove', 320, 100)
    expect(played.filter((n) => n === 'bead')).toHaveLength(4)
    // outside the strings nothing sounds
    await ptr(harp, 'pointermove', 390, 100)
    expect(played.filter((n) => n === 'bead')).toHaveLength(4)
    await ptr(harp, 'pointerup', 320, 100)
  })

  it('both rounds and the end: no mistake three stars, three still three, up to seven two, more one', async () => {
    for (const [jangles, stars] of [[0, 3], [3, 3], [4, 2], [7, 2], [8, 1]] as const) {
      useTaskProgress().reset()
      played.length = 0
      const w = await open()
      for (let i = 0; i < jangles; i++) {
        await tick(60)
        await strings(w)[0]!.trigger('click')
        await tick(60)
        await strings(w)[1]!.trigger('click')
      }
      // let the calm settle: a long pause, then enough calm notes for round one
      await tick(3000)
      for (let k = 0; k < 4; k++) await calm(w, k % 4)
      await tick(1800)
      for (let k = 0; k < 5; k++) await calm(w, k % 4, 600)
      await tick(1800)
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${jangles} jangles`).toBeTruthy()
      const got = w.emitted('done')![0]![0] as number
      // every jangle pair counts at least one mistake (the second note of the pair): the number lies between the half and the whole
      expect(got, `${jangles} pairs`).toBeGreaterThanOrEqual(1)
      expect(got).toBeLessThanOrEqual(3)
      if (jangles === 0) expect(got).toBe(stars)
      w.unmount()
    }
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = await open('en')
    await calm(w, 0)
    await tick(100)
    await strings(w)[1]!.trigger('click')
    expect(w.find('.gh-fb').text()).toBe('Too fast. Stroke more slowly.')
    expect(w.find('.gh-round').text()).toContain('Round 1 of 2')
  })
})

// ---------------------------------------------------------------- protect the flock
describe('Die Herde beschützen (shepherd)', () => {
  const game: ShepherdGame = {
    background: 'images/x/weide.webp',
    david: 'images/x/david.webp',
    davidW: 14,
    davidStart: { x: 50, y: 90 },
    animals: ['images/x/loewe.webp', 'images/x/baer.webp'],
    animalW: [20, 20],
    lambs: ['images/x/l1.webp', 'images/x/l2.webp', 'images/x/l3.webp'],
    lambW: 10,
    lambPos: [{ x: 20, y: 70 }, { x: 50, y: 62 }, { x: 80, y: 72 }],
    edge: { left: { x: -10, y: 68 }, right: { x: 110, y: 70 } },
    guard: 14,
    rounds: [
      { hint: 'Ein Löwe kommt.', threats: [{ animal: 0, from: 'right', lamb: 2, delay: 0, dur: 4000 }] },
      { hint: 'Zwei Tiere kommen.', threats: [{ animal: 1, from: 'left', lamb: 0, delay: 0, dur: 4000 }, { animal: 0, from: 'right', lamb: 2, delay: 1000, dur: 4000 }] }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    const { default: Shepherd } = await import('@/components/molecules/games/GameShepherd.vue')
    const w = mount(Shepherd, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  /** Put David at a place of the 400 x 300 picture (percent) with a tap. */
  const goTo = async (w: W, x: number, y: number) => {
    const f = w.find('.gp-field').element
    await ptr(f, 'pointerdown', (x / 100) * 400, (y / 100) * 300)
    await ptr(f, 'pointerup', (x / 100) * 400, (y / 100) * 300)
  }

  it('the goal is every beast that comes; three lambs, David at his start, no beast in the picture before its time', async () => {
    box400x300()
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(3)
    expect(w.find('.gp-round').text()).toContain('Runde 1 von 2')
    expect(w.findAll('.gp-lamb')).toHaveLength(3)
    expect(w.find('.gp-david').attributes('style')).toContain('left: 50%')
    expect(w.find('.gp-beast').attributes('style')).toContain('display: none')
    await tick(2000)
    expect(w.find('.gp-beast').attributes('style')).not.toContain('display: none')
  })

  it('David at the lamb stops the beast: it trots away, a part is done, the round is over; the next round brings two beasts', async () => {
    box400x300()
    const w = await open()
    await goTo(w, 80, 72)
    await tick(3200)
    expect(w.find('.gp-fb').text()).toContain('trabt davon')
    expect(played).toContain('tap')
    expect(w.find('.gm.bad').exists()).toBe(false)
    await tick(2000)
    expect(useTaskProgress().parts.value).toBe(1)
    expect(played).toContain('star')
    await tick(1600)
    expect(w.find('.gp-round').text()).toContain('Runde 2 von 2')
    expect(w.findAll('.gp-beast')).toHaveLength(2)
    expect(problems()).toEqual([])
  })

  it('a beast that is not stopped reaches the lamb: it runs frightened to David (a cross, one mistake) and the beast goes too', async () => {
    box400x300()
    const w = await open()
    await tick(1500 + 4000 + 100)
    expect(w.find('.gp-fb').text()).toContain('Zu spät')
    expect(played).toContain('wrong')
    expect(w.find('.gm.bad').exists()).toBe(true)
    expect(w.findAll('.gp-lamb')[2]!.classes()).toContain('scared')
    await tick(2000)
    expect(w.findAll('.gp-lamb')[2]!.classes()).not.toContain('scared')
    expect(useTaskProgress().parts.value).toBe(1)
  })

  it('a child who guards well gets three stars, one who never moves David gets two (three lambs frightened)', async () => {
    box400x300()
    // the good child: round 1 lamb 2; round 2 first lamb 0, then lamb 2
    let w = await open()
    await goTo(w, 80, 72)
    await tick(5600)
    await tick(1600)
    await goTo(w, 20, 70)
    await tick(3200)
    await goTo(w, 80, 72)
    for (let i = 0; i < 30 && !w.find('.gd').exists(); i++) await tick(400)
    expect(w.find('.gd').exists()).toBe(true)
    await w.find('.gd button').trigger('click')
    expect(w.emitted('done')).toEqual([[3]])
    w.unmount()
    // the child who does nothing: three mistakes
    useTaskProgress().reset()
    w = await open()
    for (let i = 0; i < 60 && !w.find('.gd').exists(); i++) await tick(400)
    expect(w.find('.gd').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(3)
    await w.find('.gd button').trigger('click')
    expect(w.emitted('done')).toEqual([[2]])
  })

  it('David can be moved with the arrow keys; speaks English', async () => {
    box400x300()
    const w = await open('en')
    await w.find('.gp-david').trigger('keydown', { key: 'ArrowRight' })
    expect(w.find('.gp-david').attributes('style')).toContain('left: 53%')
    await w.find('.gp-david').trigger('keydown', { key: 'ArrowUp' })
    expect(w.find('.gp-david').attributes('style')).toContain('top: 87%')
    expect(w.find('.gp-round').text()).toContain('Round 1 of 2')
    await tick(1500 + 4000 + 100)
    expect(w.find('.gp-fb').text()).toContain('Too late')
  })
})

// ---------------------------------------------------------------- smooth stones
describe('Glatte Steine finden (pebbles)', () => {
  const game: PebblesGame = {
    background: 'images/x/bach.webp',
    smooth: ['images/x/g1.webp', 'images/x/g2.webp'],
    rough: ['images/x/r1.webp', 'images/x/r2.webp'],
    bag: 'images/x/tasche.webp',
    bagPos: { x: 85, y: 93, w: 14 },
    rounds: [
      {
        hint: 'Drei glatte.',
        smooth: [{ sprite: 0, x: 20, y: 70, w: 8 }, { sprite: 1, x: 50, y: 78, w: 8 }],
        rough: [{ sprite: 0, x: 35, y: 64, w: 8 }, { sprite: 1, x: 70, y: 72, w: 8 }]
      },
      {
        hint: 'Jetzt fünf.',
        smooth: [{ sprite: 0, x: 15, y: 66, w: 7 }, { sprite: 1, x: 40, y: 82, w: 7 }, { sprite: 0, x: 66, y: 70, w: 7 }],
        rough: [{ sprite: 0, x: 28, y: 74, w: 7 }, { sprite: 1, x: 55, y: 66, w: 7 }]
      }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    const { default: Pebbles } = await import('@/components/molecules/games/GamePebbles.vue')
    const w = mount(Pebbles, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  // the rough stones come first in the picture, then the smooth ones
  const rough = (w: W, n: number) => w.findAll('.gk-stone')[n]!
  const smooth = (w: W, rounds: number, n: number) => w.findAll('.gk-stone')[rounds + n]!

  it('the goal is every smooth stone of both rounds; the bag counts from zero', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(5)
    expect(w.find('.gk-round').text()).toContain('Runde 1 von 2')
    expect(w.findAll('.gk-stone')).toHaveLength(4)
    expect(w.find('.gk-count').text()).toBe('0 von 2 Steinen in der Tasche')
  })

  it('a rough stone wobbles and stays (a cross, one mistake); a smooth one flies into the bag and counts a part', async () => {
    const w = await open()
    await rough(w, 0).trigger('click')
    expect(played).toContain('wrong')
    expect(w.find('.gk-fb').text()).toContain('Zu rau')
    expect(w.find('.gm.bad').exists()).toBe(true)
    expect(rough(w, 0).classes()).toContain('wobble')
    expect(useTaskProgress().parts.value).toBe(0)
    await tick(900)
    expect(rough(w, 0).classes()).not.toContain('wobble')
    await smooth(w, 2, 0).trigger('click')
    expect(played).toContain('tap')
    expect(smooth(w, 2, 0).classes()).toContain('flown')
    expect(smooth(w, 2, 0).attributes('style')).toContain('left: 85%')
    expect(w.find('.gk-count').text()).toBe('1 von 2 Steinen in der Tasche')
    expect(useTaskProgress().parts.value).toBe(1)
    // a stone in the bag is not tapped again
    await smooth(w, 2, 0).trigger('click')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(problems()).toEqual([])
  })

  it('all smooth stones of a round end it; the next round brings the new stones; the end: up to two mistakes three stars, to five two, six one', async () => {
    for (const [wrong, stars] of [[0, 3], [2, 3], [3, 2], [5, 2], [6, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      let left = wrong
      const bad = async (n: number) => {
        if (left > 0) {
          await rough(w, n % 2).trigger('click')
          left--
          await tick(900)
        }
      }
      for (let k = 0; k < 3; k++) await bad(k)
      await smooth(w, 2, 0).trigger('click')
      await smooth(w, 2, 1).trigger('click')
      await tick(2000)
      expect(w.find('.gk-round').text()).toContain('Runde 2 von 2')
      expect(w.findAll('.gk-stone')).toHaveLength(5)
      expect(w.find('.gk-count').text()).toBe('0 von 3 Steinen in der Tasche')
      for (let k = 0; k < 3; k++) await bad(k)
      for (let k = 0; k < 3; k++) await smooth(w, 2, k).trigger('click')
      await tick(2000)
      expect(useTaskProgress().parts.value, `${wrong} wrong`).toBe(5)
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${wrong} wrong`).toEqual([[stars]])
      w.unmount()
    }
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = await open('en')
    await rough(w, 0).trigger('click')
    expect(w.find('.gk-fb').text()).toBe('Too rough and jagged. Look for a smooth one.')
    expect(w.find('.gk-count').text()).toBe('0 of 2 stones in the bag')
  })
})

// ---------------------------------------------------------------- the sling
describe('Die Schleuder schwingen (sling)', () => {
  const game: SlingGame = {
    background: 'images/x/tal.webp',
    david: 'images/x/david.webp',
    davidPos: { x: 20, y: 90, w: 20 },
    hand: { x: 30, y: 40 },
    radius: 8,
    goliat: 'images/x/goliat.webp',
    goliatFallen: 'images/x/goliat-liegt.webp',
    fallenScale: 1.7,
    stone: 'images/x/stein.webp',
    stoneW: 3.4,
    rounds: [
      { hint: 'Tippe, wenn der Stein zeigt.', period: 2000, tol: 12, goliat: { x: 80, y: 80, w: 16 }, head: { x: 80, y: 40 } },
      { hint: 'Näher und schneller.', period: 1500, tol: 7, goliat: { x: 75, y: 80, w: 18 }, head: { x: 75, y: 38 } }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    const { default: Sling } = await import('@/components/molecules/games/GameSling.vue')
    const w = mount(Sling, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  /** Wait until the ray is golden (the stone points at Goliath), at most one and a half turns. */
  const waitAimed = async (w: W) => {
    for (let i = 0; i < 120 && !w.find('.gl-ray.on').exists(); i++) await tick(30)
    expect(w.find('.gl-ray.on').exists()).toBe(true)
  }
  const waitMissed = async (w: W) => {
    for (let i = 0; i < 120 && w.find('.gl-ray.on').exists(); i++) await tick(30)
    expect(w.find('.gl-ray.on').exists()).toBe(false)
  }

  it('the goal is one hit in each round; the stone rests at first and the first tap is not taken', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(2)
    expect(w.find('.gl-round').text()).toContain('Runde 1 von 2')
    expect(w.find('.gl-ray').exists()).toBe(true)
    await w.find('.gl-hit').trigger('click')
    expect(played).not.toContain('snap')
    expect(w.find('.gl-stone').classes()).not.toContain('flying')
  })

  it('the pure arithmetic agrees: the app turns the stone on the circle round the hand', async () => {
    const w = await open()
    await tick(1100)
    const before = w.find('.gl-stone').attributes('style')
    await tick(300)
    expect(w.find('.gl-stone').attributes('style')).not.toBe(before)
    // the centre of the circle is the hand (30, 40 percent -> 30, 30 in units of the width)
    const p = slingPos(slingAngle(0, 2000, Math.PI), { x: 30, y: 30 }, 8)
    expect(p.x).toBeCloseTo(22)
    expect(slingAimError(Math.PI * 1.5, { x: 30, y: 30 }, 8, { x: 80, y: 30 })).toBeLessThan(12)
  })

  it('a tap while the ray is golden is a hit: the stone flies, Goliath lies on the ground, a part is done; then round two', async () => {
    const w = await open()
    await waitAimed(w)
    await w.find('.gl-hit').trigger('click')
    expect(played).toContain('snap')
    expect(w.find('.gl-stone').classes()).toContain('flying')
    await tick(800)
    expect(played).toContain('star')
    expect(w.find('.gl-fb').text()).toBe('Getroffen! Goliat fällt.')
    expect(w.find('.gl-fallen').classes()).toContain('on')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.find('.gm.bad').exists()).toBe(false)
    await tick(2300)
    expect(w.find('.gl-round').text()).toContain('Runde 2 von 2')
    expect(w.find('.gl-fallen').classes()).not.toContain('on')
    expect(problems()).toEqual([])
  })

  it('a tap while the ray does not point at Goliath is a miss: a cross, a word, one mistake, and David swings on', async () => {
    const w = await open()
    await tick(1200)
    await waitMissed(w)
    await w.find('.gl-hit').trigger('click')
    await tick(800)
    expect(played).toContain('wrong')
    expect(w.find('.gl-fb').text()).toContain('Daneben')
    expect(w.find('.gm.bad').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(0)
    await tick(1000)
    expect(w.find('.gl-stone').classes()).not.toContain('flying')
    expect(w.find('.gm.bad').exists()).toBe(false)
  })

  it('both hits give three stars; three misses still three, six two', async () => {
    for (const [misses, stars] of [[0, 3], [2, 3], [3, 2], [5, 2], [6, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      await tick(1200)
      for (let m = 0; m < misses; m++) {
        await waitMissed(w)
        await w.find('.gl-hit').trigger('click')
        // the flight, the pause, and the swing begins again a moment later
        await tick(2700)
      }
      for (let r = 0; r < 2; r++) {
        await waitAimed(w)
        await w.find('.gl-hit').trigger('click')
        await tick(3200)
      }
      expect(useTaskProgress().parts.value, `${misses} misses`).toBe(2)
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${misses} misses`).toEqual([[stars]])
      w.unmount()
    }
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = await open('en')
    await tick(1200)
    await waitMissed(w)
    await w.find('.gl-hit').trigger('click')
    await tick(800)
    expect(w.find('.gl-fb').text()).toBe('Missed. The stone must point at Goliath.')
  })
})

// ---------------------------------------------------------------- the sign of the arrows
describe('Das Zeichen mit den Pfeilen (arrow)', () => {
  const game: ArrowGame = {
    background: 'images/x/feld.webp',
    jonatan: 'images/x/jonatan.webp',
    jonatanPos: { x: 16, y: 90, w: 17 },
    boy: 'images/x/knabe.webp',
    boyPos: { x: 52, y: 90, w: 8 },
    arrow: 'images/x/pfeil.webp',
    arrowW: 9,
    shootFrom: { x: 26, y: 70 },
    groundY: 92,
    range: { min: 20, max: 90 },
    rounds: [
      { hint: 'Friede.', sign: 'peace', arrows: 2, zone: { from: 25, to: 40 } },
      { hint: 'Flieh.', sign: 'flee', arrows: 3, zone: { from: 60, to: 75 } }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    const { default: Arrow } = await import('@/components/molecules/games/GameArrow.vue')
    const w = mount(Arrow, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  /** Pull the string back by `px` pixels of the 400-pixel-wide picture and let go, then wait for the flight. */
  const shoot = async (w: W, px: number) => {
    const f = w.find('.ga-field').element
    await ptr(f, 'pointerdown', 300, 200)
    await ptr(f, 'pointermove', 300 - px, 200)
    await ptr(f, 'pointerup', 300 - px, 200)
    await tick(900)
  }

  it('the goal is every arrow that lands in its zone; the sign and the marked stretch of the first round', async () => {
    box400x300()
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(5)
    expect(w.find('.ga-round').text()).toContain('Runde 1 von 2')
    expect(w.find('.ga-sign').text()).toBe('Zeichen des Friedens: hinter dem Jungen')
    expect(w.find('.ga-zone').attributes('style')).toContain('left: 25%')
    expect(w.find('.ga-zone').attributes('style')).toContain('width: 15%')
  })

  it('the arrow is drawn back while the finger pulls, and a pull that is too short does not shoot', async () => {
    box400x300()
    const w = await open()
    const f = w.find('.ga-field').element
    await ptr(f, 'pointerdown', 300, 200)
    await ptr(f, 'pointermove', 224, 200)
    // the arrow is drawn back by half of the longest pull (9 percent of the picture width): 26 - 4.5
    expect(w.find('.ga-nock').attributes('style')).toContain('left: 21.5%')
    await ptr(f, 'pointerup', 224, 200)
    await tick(30)
    expect(w.find('.ga-air').exists()).toBe(true)
    // the arrow flew too far (a mistake): it fades after a moment
    await tick(1900)
    expect(w.find('.ga-air').exists()).toBe(false)
    // a tiny pull is not a shot
    await ptr(f, 'pointerdown', 300, 200)
    await ptr(f, 'pointermove', 297, 200)
    await ptr(f, 'pointerup', 297, 200)
    expect(w.find('.ga-air').exists()).toBe(false)
  })

  it('too short and too far are mistakes with words; an arrow in the zone lies there and counts a part', async () => {
    box400x300()
    const w = await open()
    await shoot(w, 8)
    expect(played).toContain('wrong')
    expect(w.find('.ga-fb').text()).toContain('Zu kurz')
    expect(w.find('.gm.bad').exists()).toBe(true)
    await tick(1000)
    await shoot(w, 80)
    expect(w.find('.ga-fb').text()).toContain('Zu weit')
    await tick(1000)
    expect(useTaskProgress().parts.value).toBe(0)
    await shoot(w, 26)
    expect(played).toContain('right')
    expect(w.find('.ga-fb').text()).toContain('Der Pfeil liegt')
    expect(w.findAll('.ga-lies')).toHaveLength(1)
    expect(useTaskProgress().parts.value).toBe(1)
    expect(problems()).toEqual([])
  })

  it('the keyboard does the same: the arrow keys pull, Enter lets go', async () => {
    box400x300()
    const w = await open()
    const bow = w.find('.ga-bow')
    await bow.trigger('keydown', { key: 'ArrowLeft' })
    await bow.trigger('keydown', { key: 'ArrowLeft' })
    await bow.trigger('keydown', { key: 'Enter' })
    await tick(900)
    expect(w.findAll('.ga-lies')).toHaveLength(1)
    expect(useTaskProgress().parts.value).toBe(1)
  })

  it('both rounds and the end: no mistake three stars, two three, up to five two, six one', async () => {
    box400x300()
    for (const [wrong, stars] of [[0, 3], [2, 3], [3, 2], [5, 2], [6, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      let left = wrong
      const bad = async (px: number) => {
        if (left > 0) {
          await shoot(w, px)
          await tick(1000)
          left--
        }
      }
      for (let k = 0; k < 3; k++) await bad(8)
      await shoot(w, 26)
      await shoot(w, 26)
      await tick(2100)
      expect(w.find('.ga-round').text()).toContain('Runde 2 von 2')
      expect(w.find('.ga-sign').text()).toBe('Zeichen zur Flucht: vor dem Jungen')
      for (let k = 0; k < 3; k++) await bad(8)
      for (let k = 0; k < 3; k++) await shoot(w, 102)
      await tick(2100)
      expect(useTaskProgress().parts.value, `${wrong} wrong`).toBe(5)
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${wrong} wrong`).toEqual([[stars]])
      w.unmount()
    }
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    box400x300()
    const w = await open('en')
    expect(w.find('.ga-sign').text()).toBe('Sign of peace: behind the boy')
    await shoot(w, 8)
    expect(w.find('.ga-fb').text()).toBe('Too short. Pull the string farther.')
  })
})

// ---------------------------------------------------------------- the hem
describe('Den Zipfel abschneiden (hem)', () => {
  const game: HemGame = {
    background: 'images/x/hoehle.webp',
    reward: 'images/x/david-zipfel.webp',
    rounds: [
      { hint: 'Folge der Naht.', tol: 6, path: [{ x: 20, y: 20 }, { x: 20, y: 80 }] },
      { hint: 'Geschwungen.', tol: 4, path: [{ x: 40, y: 30 }, { x: 60, y: 60 }, { x: 40, y: 80 }] }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    const { default: Hem } = await import('@/components/molecules/games/GameHem.vue')
    const w = mount(Hem, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  const px = (xPercent: number, yPercent: number) => [(xPercent / 100) * 400, (yPercent / 100) * 300] as const
  /** Follow a polyline (percent of the picture) with a finger in small steps. */
  const follow = async (w: W, pts: [number, number][], from = 0) => {
    const f = w.find('.gm-field').element
    const steps: [number, number][] = []
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1]!
      const [bx, by] = pts[i]!
      const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 2.5))
      for (let k = from && i === 1 ? 0 : 1; k <= n; k++) steps.push([ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n])
    }
    await ptr(f, 'pointerdown', ...px(pts[0]![0], pts[0]![1]))
    for (const [x, y] of steps) await ptr(f, 'pointermove', ...px(x, y))
    await ptr(f, 'pointerup', ...px(pts[pts.length - 1]![0], pts[pts.length - 1]![1]))
  }

  it('the goal is one seam for each round; the seam is drawn and nothing of it is done yet', async () => {
    box400x300()
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(2)
    expect(w.find('.gm-round').text()).toContain('Runde 1 von 2')
    expect(w.find('.gm-line').attributes('d')).toBe('M20 15.00 L20 60.00')
    expect(w.find('.gm-done').attributes('stroke-dasharray')).toBe('0 100')
    expect(w.find('.gm-field').attributes('style')).toContain('hoehle.webp')
  })

  it('a finger that does not begin at the start of the seam is not taken (no mistake)', async () => {
    box400x300()
    const w = await open()
    await ptr(w.find('.gm-field').element, 'pointerdown', ...px(20, 60))
    expect(w.find('.gm-fb').text()).toBe('Beginne am Anfang der Naht.')
    expect(w.find('.gm.bad').exists()).toBe(false)
    expect(w.find('.gm-finger').exists()).toBe(false)
  })

  it('wandering off the seam is a mistake (a cross, Saul looks around) and the stroke begins again; lifting the finger early begins again without one', async () => {
    box400x300()
    const w = await open()
    const f = w.find('.gm-field').element
    await ptr(f, 'pointerdown', ...px(20, 20))
    await ptr(f, 'pointermove', ...px(20, 24))
    expect(w.find('.gm-finger').exists()).toBe(true)
    expect(w.find('.gm-done').attributes('stroke-dasharray')).not.toBe('0 100')
    await ptr(f, 'pointermove', ...px(34, 32))
    expect(played).toContain('wrong')
    expect(w.find('.gm-fb').text()).toContain('Zu weit von der Naht')
    expect(w.find('.gm.bad').exists()).toBe(true)
    expect(w.find('.gm-field').classes()).toContain('shake')
    expect(w.find('.gm-done').attributes('stroke-dasharray')).toBe('0 100')
    await tick(1000)
    expect(w.find('.gm-field').classes()).not.toContain('shake')
    // lifting early: no mistake, the seam begins again
    await ptr(f, 'pointerdown', ...px(20, 20))
    await ptr(f, 'pointermove', ...px(20, 26))
    await ptr(f, 'pointerup', ...px(20, 26))
    expect(w.find('.gm-done').attributes('stroke-dasharray')).toBe('0 100')
    expect(w.find('.gm.bad').exists()).toBe(false)
    expect(useTaskProgress().parts.value).toBe(0)
  })

  it('a finger that jumps ahead does not make progress; following the whole seam cuts the corner and goes on to round two', async () => {
    box400x300()
    const w = await open()
    const f = w.find('.gm-field').element
    await ptr(f, 'pointerdown', ...px(20, 20))
    await ptr(f, 'pointermove', ...px(20, 70))
    expect(w.find('.gm-done').attributes('stroke-dasharray')).toBe('0 100')
    await ptr(f, 'pointerup', ...px(20, 70))
    await follow(w, [[20, 20], [20, 80]])
    expect(played).toContain('snap')
    expect(w.find('.gm-fb').text()).toBe('Der Zipfel ist ab.')
    expect(useTaskProgress().parts.value).toBe(1)
    await tick(1900)
    expect(w.find('.gm-round').text()).toContain('Runde 2 von 2')
    expect(w.find('.gm-line').attributes('d')).toBe('M40 22.50 L60 45.00 L40 60.00')
    expect(problems()).toEqual([])
  })

  it('after the last seam the picture changes to David with the corner, then the end; no mistake three stars, five still three, more two', async () => {
    box400x300()
    for (const [wrong, stars] of [[0, 3], [2, 3], [3, 2], [5, 2], [6, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      const f = w.find('.gm-field').element
      for (let k = 0; k < wrong; k++) {
        await ptr(f, 'pointerdown', ...px(20, 20))
        await ptr(f, 'pointermove', ...px(35, 22))
        await tick(1000)
      }
      await follow(w, [[20, 20], [20, 80]])
      await tick(1900)
      await follow(w, [[40, 30], [60, 60], [40, 80]])
      expect(useTaskProgress().parts.value, `${wrong} wrong`).toBe(2)
      expect(w.find('.gd').exists()).toBe(false)
      await tick(1100)
      expect(w.find('.gm-field').attributes('style')).toContain('david-zipfel.webp')
      expect(w.find('.gm-seam').exists()).toBe(false)
      await tick(2600)
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${wrong} wrong`).toEqual([[stars]])
      w.unmount()
    }
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    box400x300()
    const w = await open('en')
    await ptr(w.find('.gm-field').element, 'pointerdown', ...px(50, 50))
    expect(w.find('.gm-fb').text()).toBe('Begin at the start of the seam.')
    expect(w.find('.gm-round').text()).toContain('Round 1 of 2')
  })
})
