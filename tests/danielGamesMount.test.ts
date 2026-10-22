/**
 * The new games of "Daniel" (`tage`, `standbild`, `lampe`, `zeiten`): each is mounted with sample data and used: right and wrong moves, the rounds, the goal for the stars of "Go on"
 * (`useTaskProgress`), the end with its stars, German and English words.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import useTaskProgress from '@/use/useTaskProgress'
import type { DaysGame, HoursGame, LampGame, StatueGame } from '@/types/adventure'

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

// ---------------------------------------------------------------- ten days
describe('Zehn Tage (days)', () => {
  const dish = (id: string, kind: 'veg' | 'water' | 'meat' | 'sweet') => ({ id, kind, image: `images/x/${id}.webp` })
  const game: DaysGame = {
    background: 'images/x/tisch.webp',
    dishes: [dish('v1', 'veg'), dish('v2', 'veg'), dish('w1', 'water'), dish('w2', 'water'), dish('m1', 'meat'), dish('m2', 'meat'), dish('s1', 'sweet'), dish('s2', 'sweet')],
    days: 10,
    table: { y: 42, h: 28, w: 18 },
    limits: [7, 5, 4]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    const { default: Days } = await import('@/components/molecules/games/GameDays.vue')
    const w = mount(Days, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  const GOOD = /^(Gemüse|Wasser|Vegetables|Water)$/
  const dishes = (w: W) => w.findAll('.dy-dish')
  const good = (w: W) => dishes(w).filter((d) => GOOD.test(d.attributes('aria-label') ?? ''))
  const bad = (w: W) => dishes(w).filter((d) => !GOOD.test(d.attributes('aria-label') ?? '') && !d.classes().includes('gone') && !/Daniels Platz|Daniel’s place/.test(d.attributes('aria-label') ?? ''))
  const playDay = async (w: W, mistakes = 0) => {
    for (let i = 0; i < mistakes; i++) await bad(w)[0]!.trigger('click')
    for (const g of good(w)) await g.trigger('click')
    await tick(1300)
  }

  it('the goal is every day; day 1 shows four dishes, two of them Daniel’s', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(10)
    expect(w.find('.dy-day').text()).toBe('Tag 1 von 10')
    expect(dishes(w)).toHaveLength(4)
    expect(good(w)).toHaveLength(2)
    expect(w.findAll('.dy-dot')).toHaveLength(10)
  })

  it('the king’s food is a mistake with a cross and stays; both dishes of Daniel make the day done (a sound, a part of the task, the next day)', async () => {
    const w = await open()
    await bad(w)[0]!.trigger('click')
    expect(played).toContain('wrong')
    expect(w.find('.dy-fb').text()).toContain('Das ist des Königs Essen')
    expect(w.find('.gm.bad').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(0)
    const first = good(w)[0]!
    await first.trigger('click')
    expect(first.classes()).toContain('gone')
    expect(useTaskProgress().parts.value).toBe(0)
    await good(w).find((d) => !d.classes().includes('gone'))!.trigger('click')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(played).toContain('star')
    expect(w.findAll('.dy-dot')[0]!.classes()).toContain('ok')
    await tick(1200)
    expect(w.find('.dy-day').text()).toBe('Tag 2 von 10')
    expect(dishes(w).every((d) => !d.classes().includes('gone'))).toBe(true)
  })

  it('the bar waits a moment and runs down in seven seconds on the first days; when it is over the day is a mistake and the next one begins', async () => {
    const w = await open()
    await tick(1000)
    expect(w.find('.dy-bar-fill').attributes('style')).toContain('scaleX(1)')
    await tick(1200 + 3500 - 1000)
    const part = Number(/scaleX\(([\d.]+)\)/.exec(w.find('.dy-bar-fill').attributes('style')!)![1])
    expect(part).toBeGreaterThan(0.3)
    expect(part).toBeLessThan(0.7)
    await tick(3600)
    expect(played).toContain('wrong')
    expect(w.find('.dy-fb').text()).toContain('Zu spät')
    expect(w.findAll('.dy-dot')[0]!.classes()).toContain('bad')
    await tick(1200)
    expect(w.find('.dy-day').text()).toBe('Tag 2 von 10')
    expect(useTaskProgress().parts.value).toBe(0)
  })

  it('ten days and the end; up to two mistakes three stars, up to six two, more one', async () => {
    for (const [wrong, stars] of [[0, 3], [2, 3], [3, 2], [6, 2], [7, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      await playDay(w, wrong)
      for (let d = 1; d < 10; d++) await playDay(w)
      await tick(1500)
      expect(useTaskProgress().parts.value, `${wrong} wrong`).toBe(10)
      expect(useTaskProgress().finished.value).toBe(true)
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${wrong} wrong`).toEqual([[stars]])
      w.unmount()
    }
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = await open('en')
    expect(w.find('.dy-day').text()).toBe('Day 1 of 10')
    await bad(w)[0]!.trigger('click')
    expect(w.find('.dy-fb').text()).toBe('That is the king’s food. Daniel eats vegetables and drinks water.')
  })
})

// ---------------------------------------------------------------- the statue
describe('Das Standbild (statue)', () => {
  const names = ['Gold', 'Silber', 'Erz', 'Eisen', 'Eisen und Ton']
  const ys = [14, 30, 46, 62, 80]
  const game: StatueGame = {
    background: 'images/x/traum.webp',
    pieces: names.map((label, i) => ({ id: `p${i}`, image: `images/x/p${i}.webp`, label, w: 20, at: { x: 50, y: ys[i]! }, wait: 1.5 })),
    slots: ys.map((y) => ({ x: 50, y, w: 20, h: 12 })),
    stone: 'images/x/stein.webp',
    mountain: 'images/x/berg.webp',
    rounds: [
      { hint: 'Setze das Standbild zusammen.', labels: true, homes: [{ x: 85, y: 15 }, { x: 15, y: 30 }, { x: 15, y: 76 }, { x: 85, y: 55 }, { x: 85, y: 85 }] },
      { hint: 'Noch einmal ohne Namen.', labels: false, homes: [{ x: 15, y: 16 }, { x: 85, y: 32 }, { x: 85, y: 78 }, { x: 15, y: 58 }, { x: 15, y: 88 }] }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    box400x300()
    const { default: Statue } = await import('@/components/molecules/games/GameStatue.vue')
    const w = mount(Statue, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  /** Chooses a disc with the keyboard (Enter), then taps the place. */
  const put = async (w: W, piece: number, slot: number) => {
    await w.findAll('.st-disc')[piece]!.trigger('keydown', { key: 'Enter' })
    await w.findAll('.st-slot')[slot]!.trigger('click')
    await flushPromises()
  }
  const round = async (w: W, wrong = 0) => {
    for (let i = 0; i < wrong; i++) await put(w, 0, 3)
    for (let i = 0; i < 5; i++) await put(w, i, i)
  }

  it('the goal is every disc of both rounds; round 1 shows five discs with the names of the metals and five places', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(10)
    expect(w.find('.st-round').text()).toContain('Runde 1 von 2')
    expect(w.findAll('.st-disc')).toHaveLength(5)
    expect(w.findAll('.st-slot')).toHaveLength(5)
    expect(w.findAll('.st-label').map((l) => l.text())).toEqual(names)
    expect(w.find('.st-fb').text()).toBe('Scheiben an ihrem Platz: 0 von 5')
  })

  it('the right disc clicks into its place; a wrong place is a mistake with a cross and the disc stays where it waits', async () => {
    const w = await open()
    const before = w.findAll('.st-piece')[0]!.attributes('style')
    await put(w, 0, 3)
    expect(played).toContain('wrong')
    expect(w.find('.st-fb').text()).toContain('gehört nicht dorthin')
    expect(w.find('.gm.bad').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(0)
    expect(w.findAll('.st-piece')[0]!.attributes('style')).toBe(before)
    await put(w, 0, 0)
    expect(played).toContain('basket')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.findAll('.st-piece')[0]!.classes()).toContain('placed')
    expect(w.findAll('.st-piece')[0]!.attributes('style')).toContain('top: 14%')
    expect(w.find('.st-fb').text()).toBe('Scheiben an ihrem Platz: 1 von 5')
    // a disc that stands does not move again
    await put(w, 0, 2)
    expect(useTaskProgress().parts.value).toBe(1)
  })

  it('round 2 has no names and another order of the waiting places', async () => {
    const w = await open()
    const first = w.findAll('.st-piece').map((p) => p.attributes('style'))
    await round(w)
    expect(played).toContain('star')
    await tick(2300)
    expect(w.find('.st-round').text()).toContain('Runde 2 von 2')
    expect(w.findAll('.st-label')).toHaveLength(0)
    expect(w.findAll('.st-piece').map((p) => p.attributes('style'))).not.toEqual(first)
    expect(w.find('.st-fb').text()).toBe('Scheiben an ihrem Platz: 0 von 5')
  })

  it('both rounds, then the stone rolls, the statue falls and the mountain grows; up to two mistakes three stars, up to six two, more one', async () => {
    for (const [wrong, stars] of [[0, 3], [2, 3], [3, 2], [6, 2], [7, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      await round(w, wrong)
      await tick(2300)
      await round(w)
      await tick(1500)
      expect(w.find('.st-stone').exists()).toBe(true)
      expect(w.find('.st-fb').text()).toBe('Jetzt tippe den Stein an.')
      await w.find('.st-stone').trigger('click')
      expect(w.find('.st-stone').classes()).toContain('roll')
      await tick(1200)
      expect(w.find('.st-piece').classes()).toContain('fall')
      await tick(1500)
      expect(w.find('.st-mountain').exists()).toBe(true)
      await tick(2200)
      expect(useTaskProgress().parts.value, `${wrong} wrong`).toBe(10)
      expect(useTaskProgress().finished.value).toBe(true)
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${wrong} wrong`).toEqual([[stars]])
      w.unmount()
    }
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = await open('en')
    expect(w.find('.st-fb').text()).toBe('Discs in place: 0 of 5')
    await put(w, 0, 3)
    expect(w.find('.st-fb').text()).toBe('That disc does not belong there. Think of the dream.')
  })
})

// ---------------------------------------------------------------- the light on the wall
describe('Das Licht an der Wand (lamp)', () => {
  const sign = (n: number, x: number, y: number) => ({ image: `images/x/z${n}.webp`, x, y, w: 16 })
  const base = (flicker: boolean): LampGame => ({
    background: 'images/x/wand.webp',
    lamp: 'images/x/lampe.webp',
    lampW: 14,
    rounds: [
      { hint: 'Führe die Lampe über die Wand.', radius: 22, flicker, signs: [sign(1, 50, 50), sign(2, 66, 62)] },
      { hint: 'Jetzt flackert die Flamme.', radius: 15, flicker: true, signs: [sign(3, 50, 56), sign(4, 60, 62)] }
    ]
  })
  const open = async (game: LampGame, locale: 'de' | 'en' = 'de') => {
    box400x300()
    const { default: Lamp } = await import('@/components/molecules/games/GameLamp.vue')
    const w = mount(Lamp, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  const mouse = (type: string, x: number, y: number, t: number) => {
    const e = new MouseEvent(type, { clientX: x, clientY: y, bubbles: true })
    Object.defineProperty(e, 'timeStamp', { value: t })
    return e
  }

  it('the goal is every sign of both rounds; round 1 shows two dark signs and the lamp', async () => {
    const w = await open(base(false))
    expect(useTaskProgress().goal.value).toBe(4)
    expect(w.find('.lp-round').text()).toContain('Runde 1 von 2')
    expect(w.findAll('.lp-sign:not(.lp-glow)')).toHaveLength(2)
    expect(w.find('.lp-lamp').exists()).toBe(true)
    expect(w.find('.lp-fb').text()).toBe('Zeichen gefunden: 0 von 2')
  })

  it('a sign shines for good after the lamp rests over it for about a second (a ring fills first)', async () => {
    const w = await open(base(false))
    await tick(500)
    expect(w.find('.lp-ring').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(0)
    await tick(900)
    expect(useTaskProgress().parts.value).toBe(2)
    expect(played).toContain('basket')
    expect(played).toContain('star')
  })

  it('a sign far from the lamp stays dark; the arrow keys move the lamp', async () => {
    const game = base(false)
    game.rounds[0]!.signs[1] = sign(2, 90, 20)
    const w = await open(game)
    const before = w.find('.lp-lamp').attributes('style')
    await tick(1500)
    expect(useTaskProgress().parts.value).toBe(1)
    await w.find('.lp-lamp').trigger('keydown', { key: 'ArrowRight' })
    expect(w.find('.lp-lamp').attributes('style')).not.toBe(before)
  })

  it('a flickering flame goes out when the lamp is pulled too fast (a mistake, a cross, it burns again after a second); slowly pulled it stays', async () => {
    const w = await open(base(true))
    const lamp = w.find('.lp-lamp').element
    lamp.dispatchEvent(mouse('pointerdown', 200, 186, 1000))
    window.dispatchEvent(mouse('pointermove', 204, 186, 1100))
    expect(played).not.toContain('wrong')
    window.dispatchEvent(mouse('pointermove', 380, 186, 1200))
    await flushPromises()
    expect(played).toContain('wrong')
    expect(w.find('.lp-fb').text()).toContain('Die Flamme ist aus')
    expect(w.find('.gm.bad').exists()).toBe(true)
    window.dispatchEvent(mouse('pointerup', 380, 186, 1300))
    await tick(1100)
    expect(w.find('.lp-lamp').classes()).not.toContain('out')
  })

  it('both rounds: four signs, then the words and the end; up to two blown-out flames three stars, up to four two, more one', async () => {
    for (const [out, stars] of [[0, 3], [2, 3], [3, 2], [4, 2], [5, 1]] as const) {
      useTaskProgress().reset()
      const w = await open(base(false))
      await tick(1500)
      expect(played).toContain('star')
      await tick(2300)
      expect(w.find('.lp-round').text()).toContain('Runde 2 von 2')
      expect(w.findAll('.lp-sign:not(.lp-glow)').length).toBeGreaterThanOrEqual(2)
      // blow the flame out as often as wanted in round 2 (before the signs are found)
      const lamp = w.find('.lp-lamp').element
      lamp.dispatchEvent(mouse('pointerdown', 200, 186, 5000))
      for (let i = 0; i < out; i++) {
        window.dispatchEvent(mouse('pointermove', i % 2 ? 200 : 380, 186, 5100 + i * 100))
        await tick(1100)
      }
      // bring the lamp back to the signs slowly
      window.dispatchEvent(mouse('pointermove', 200, 186, 5100 + out * 100 + 3000))
      window.dispatchEvent(mouse('pointerup', 200, 186, 90000))
      await tick(2500)
      expect(useTaskProgress().parts.value, `${out} out`).toBe(4)
      expect(w.find('.lp-words').text()).toBe('Mene · Mene · Tekel · Parsin')
      await tick(2700)
      expect(useTaskProgress().finished.value).toBe(true)
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${out} out`).toEqual([[stars]])
      w.unmount()
    }
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = await open(base(false), 'en')
    expect(w.find('.lp-fb').text()).toBe('Signs found: 0 of 2')
  })
})

// ---------------------------------------------------------------- three times a day
describe('Dreimal am Tag (hours)', () => {
  const game: HoursGame = {
    window: { x: 33, y: 6, w: 38, h: 59 },
    sky: 'images/x/himmel.webp',
    frame: 'images/x/rahmen.webp',
    standing: 'images/x/steht.webp',
    kneeling: 'images/x/kniet.webp',
    sun: 'images/x/sonne.webp',
    rounds: [
      { hint: 'Tippe auf Daniel an den Marken.', dayMs: 12000, days: 1, windowMs: 1100 },
      { hint: 'Zwei Tage, die Sonne ist schneller.', dayMs: 9000, days: 2, windowMs: 750 }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    const { default: Hours } = await import('@/components/molecules/games/GameHours.vue')
    const w = mount(Hours, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  let now = 0
  const at = async (t: number) => {
    await tick(t - now)
    now = t
  }
  const pray = async (w: W) => {
    await w.find('.hr-daniel').trigger('click')
    await flushPromises()
  }
  beforeEach(() => {
    now = 0
  })

  it('the goal is every prayer time of both rounds (3 + 6); the sun waits at the left; three marks and three times are there', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(9)
    expect(w.find('.hr-round').text()).toContain('Runde 1 von 2')
    expect(w.findAll('.hr-mark')).toHaveLength(3)
    expect(w.findAll('.hr-times li').map((l) => l.text())).toEqual(['○Morgen', '○Mittag', '○Abend'])
    const sun = w.find('.hr-sun').attributes('style')
    await at(1500)
    expect(w.find('.hr-sun').attributes('style')).toBe(sun)
  })

  it('a tap at a golden mark is a prayer (Daniel kneels, a tick); a tap at any other time is a mistake; a mark that goes by is a mistake, too', async () => {
    const w = await open()
    await at(2200 + 500) // the first mark is at 2400 ms after the start of the day
    await pray(w)
    expect(played).toContain('wrong')
    expect(w.find('.hr-fb').text()).toContain('Jetzt nicht')
    expect(useTaskProgress().parts.value).toBe(0)
    await at(2200 + 2400)
    expect(w.find('.hr-daniel').classes()).toContain('glow')
    await pray(w)
    expect(played).toContain('basket')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.findAll('.hr-times li')[0]!.text()).toBe('✓Morgen')
    expect(w.find('.hr-fb').text()).toContain('Daniel kniet nieder')
    // a second tap in the same window does nothing
    await pray(w)
    expect(useTaskProgress().parts.value).toBe(1)
    // noon goes by without a tap
    await at(2200 + 6000 + 1100 + 200)
    expect(w.findAll('.hr-times li')[1]!.text()).toBe('✗Mittag')
    expect(w.find('.hr-fb').text()).toContain('Die Zeit zum Beten ist vorbei')
  })

  it('the whole game: one day, then two faster days, then the end; up to two mistakes three stars, up to five two, more one', async () => {
    for (const [wrong, stars] of [[0, 3], [2, 3], [3, 2], [5, 2], [6, 1]] as const) {
      useTaskProgress().reset()
      now = 0
      const w = await open()
      // some taps at the wrong time before the first mark
      for (let i = 0; i < wrong; i++) {
        await at(2200 + 100 + i * 20)
        await pray(w)
      }
      for (const m of [2400, 6000, 9600]) {
        await at(2200 + m)
        await pray(w)
      }
      await at(2200 + 12000 + 100)
      expect(played).toContain('star')
      expect(useTaskProgress().parts.value).toBe(3)
      // round 2: after 2.2 s the new round, then 2.2 s of waiting; the first day
      const day1 = 2200 + 12000 + 2300 + 2200
      for (const m of [1800, 4500, 7200]) {
        await at(day1 + m)
        await pray(w)
      }
      // between the days 1.5 s, then 1.3 s of waiting
      const day2 = day1 + 9000 + 1600 + 1300
      for (const m of [1800, 4500, 7200]) {
        await at(day2 + m)
        await pray(w)
      }
      await at(day2 + 9000 + 2000)
      expect(useTaskProgress().parts.value, `${wrong} wrong`).toBe(9)
      expect(useTaskProgress().finished.value).toBe(true)
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${wrong} wrong`).toEqual([[stars]])
      w.unmount()
    }
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = await open('en')
    expect(w.findAll('.hr-times li').map((l) => l.text())).toEqual(['○Morning', '○Noon', '○Evening'])
    await at(2200 + 500)
    await pray(w)
    expect(w.find('.hr-fb').text()).toBe('Not now. Wait for the golden mark.')
  })
})
