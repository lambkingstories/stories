/**
 * The new games of "Rut" (`nachlese`, `epha`, `aelteste`, `wiege`): each is mounted with sample data and used: right and wrong moves, the rounds, the goal for the stars of "Go on"
 * (`useTaskProgress`), the end with its stars, German and English words.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import useTaskProgress from '@/use/useTaskProgress'
import type { CradleGame, EldersGame, GleanGame, MeasureGame } from '@/types/adventure'

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

// ---------------------------------------------------------------- gleaning
describe('Ähren hinter den Schnittern (glean)', () => {
  const game: GleanGame = {
    background: 'images/x/feld.webp',
    lanes: [50, 70],
    reapers: ['images/x/s1.webp', 'images/x/s2.webp'],
    clumps: ['images/x/h1.webp'],
    ears: ['images/x/a1.webp'],
    basket: 'images/x/korb.webp',
    basketPos: { x: 11, y: 97, w: 17 },
    reaperW: 17,
    clumpW: 10,
    earW: 8,
    rounds: [
      { hint: 'Runde eins.', reapers: [{ lane: 0, at: 0, dur: 4000, sprite: 0, clumps: [30, 60] }] },
      { hint: 'Runde zwei.', reapers: [{ lane: 1, at: 0, dur: 3000, sprite: 1, clumps: [40] }] }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    const { default: Glean } = await import('@/components/molecules/games/GameGlean.vue')
    const w = mount(Glean, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  const clumps = (w: W) => w.findAll('.gl-clump')
  const ears = (w: W) => w.findAll('.gl-ear')

  it('the goal is every ear of both rounds; the clumps stand before the reaper comes and nothing lies on the ground', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(3)
    expect(w.find('.gl-round').text()).toContain('Runde 1 von 2')
    expect(clumps(w)).toHaveLength(2)
    expect(ears(w)).toHaveLength(0)
    expect(w.find('.gl-hint').text()).toBe('Runde eins.')
  })

  it('a tap on a clump that still stands is a mistake with a cross; when the reaper has come to it an ear lies there, and tapping it counts a part and puts it into the basket', async () => {
    const w = await open()
    await clumps(w)[0]!.trigger('click')
    expect(played).toContain('wrong')
    expect(w.find('.gl-fb').text()).toContain('Warte')
    expect(w.find('.gm.bad').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(0)
    // the lead (2200) and the time the reaper needs to reach 30 percent: (30 + 8) / 116 * 4000 = 1310
    await tick(2200 + 1400)
    expect(clumps(w)).toHaveLength(1)
    expect(ears(w)).toHaveLength(1)
    await ears(w)[0]!.trigger('click')
    expect(played).toContain('basket')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(ears(w)).toHaveLength(0)
    await tick(700)
    expect(w.find('.gl-count').text()).toBe('1')
    expect(problems()).toEqual([])
  })

  it('an ear that is not picked up is no mistake; the round ends a while after the reaper has gone and the next round begins', async () => {
    const w = await open()
    await tick(2200 + 4000 + 4600)
    expect(w.find('.gl-fb').text()).toContain('vorbei')
    expect(useTaskProgress().parts.value).toBe(0)
    await tick(1800)
    expect(w.find('.gl-round').text()).toContain('Runde 2 von 2')
    expect(clumps(w)).toHaveLength(1)
    expect(ears(w)).toHaveLength(0)
  })

  it('both rounds and the end: no mistake three stars, two mistakes still three, three two, six one', async () => {
    for (const [wrong, stars] of [[0, 3], [2, 3], [3, 2], [6, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      for (let i = 0; i < wrong; i++) await clumps(w)[0]!.trigger('click')
      await tick(2200 + 3300)
      for (const e of ears(w)) await e.trigger('click')
      await tick(700 + 1400)
      await tick(1800)
      await tick(2200 + 1600)
      for (const e of ears(w)) await e.trigger('click')
      await tick(3000)
      expect(useTaskProgress().parts.value, `${wrong} wrong`).toBe(3)
      expect(useTaskProgress().finished.value, `${wrong} wrong`).toBe(true)
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${wrong} wrong`).toEqual([[stars]])
      w.unmount()
    }
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = await open('en')
    await clumps(w)[0]!.trigger('click')
    expect(w.find('.gl-fb').text()).toBe('Wait until the reaper has passed.')
    expect(w.find('.gl-round').text()).toContain('Round 1 of 2')
  })
})

// ---------------------------------------------------------------- measure
describe('Das Maß füllen (measure)', () => {
  const game: MeasureGame = {
    background: 'images/x/hof.webp',
    states: [0, 1, 2, 3, 4].map((n) => `images/x/m${n}.webp`),
    measure: { x: 30, y: 90, w: 24, top: 23, bottom: 44 },
    heap: { x: 72, y: 46, w: 50, h: 44 },
    grain: 'images/x/korn.webp',
    grainW: 4,
    markImage: 'images/x/marke.webp',
    markW: 6,
    rounds: [
      { hint: 'Bis zum Rand.', mark: 1 },
      { hint: 'Halb.', mark: 0.5 }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    box400x300()
    const { default: Measure } = await import('@/components/molecules/games/GameMeasure.vue')
    const w = mount(Measure, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  const hold = async (w: W, ms: number) => {
    await w.find('.ms-heap').trigger('pointerdown')
    await tick(ms)
    await w.find('.ms-heap').trigger('pointerup')
    await flushPromises()
  }

  it('the goal is one measure for each round; the golden mark sits at the height of the round and moves down in round 2', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(2)
    expect(w.find('.ms-round').text()).toContain('Runde 1 von 2')
    expect(w.find('.ms-hint').text()).toBe('Bis zum Rand.')
    const top1 = parseFloat((w.find('.ms-mark').element as HTMLElement).style.top)
    expect(top1).toBeCloseTo(23)
  })

  it('letting go too early changes nothing and the finger may go on; letting go at the mark finishes the round with a tone', async () => {
    const w = await open()
    await hold(w, 1500)
    expect(w.find('.ms-fb').text()).toContain('Noch ein wenig')
    expect(useTaskProgress().parts.value).toBe(0)
    await hold(w, 2400)
    expect(useTaskProgress().parts.value).toBe(1)
    expect(played).toContain('star')
    expect(w.find('.ms-fb').text()).toContain('Genau richtig')
    await tick(1700)
    expect(w.find('.ms-round').text()).toContain('Runde 2 von 2')
    expect(parseFloat((w.find('.ms-mark').element as HTMLElement).style.top)).toBeCloseTo(33.5)
  })

  it('holding on after the mark spills the grain: a cross, a mistake, the measure is empty again and the finger has to lift first', async () => {
    const w = await open()
    await w.find('.ms-heap').trigger('pointerdown')
    await tick(4800)
    expect(played).toContain('wrong')
    expect(w.find('.ms-fb').text()).toContain('Zu viel')
    expect(w.find('.gm.bad').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(0)
    await w.find('.ms-heap').trigger('pointerup')
    await tick(1200)
    expect(w.find('.gm.bad').exists()).toBe(false)
    // a new try works
    await hold(w, 4200)
    expect(useTaskProgress().parts.value).toBe(1)
  })

  it('both rounds and the end: no spill three stars, one spill three, two two, four one', async () => {
    for (const [spills, stars] of [[0, 3], [1, 3], [2, 2], [4, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      for (let i = 0; i < spills; i++) {
        await w.find('.ms-heap').trigger('pointerdown')
        await tick(4800)
        await w.find('.ms-heap').trigger('pointerup')
        await tick(1200)
      }
      await hold(w, 4200)
      await tick(1700)
      await hold(w, 2100)
      await tick(1600)
      expect(useTaskProgress().parts.value, `${spills} spills`).toBe(2)
      expect(useTaskProgress().finished.value).toBe(true)
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${spills} spills`).toEqual([[stars]])
      w.unmount()
    }
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = await open('en')
    await hold(w, 1000)
    expect(w.find('.ms-fb').text()).toBe('A little more.')
  })
})

// ---------------------------------------------------------------- elders
describe('Älteste an das Tor rufen (elders)', () => {
  const game: EldersGame = {
    background: 'images/x/tor.webp',
    elders: ['images/x/a1.webp', 'images/x/a2.webp', 'images/x/a3.webp'],
    others: ['images/x/o1.webp', 'images/x/o2.webp'],
    seated: 'images/x/sitzend.webp',
    seatedBox: { x: 50, y: 95, w: 92 },
    seats: [
      { x: 20, y: 85 },
      { x: 40, y: 80 },
      { x: 60, y: 80 },
      { x: 80, y: 85 }
    ],
    walkerW: 14,
    seatW: 11,
    rounds: [
      {
        hint: 'Rufe die Ältesten.',
        walkers: [
          { kind: 'other', sprite: 0, at: 0, dur: 4000, y: 65 },
          { kind: 'elder', sprite: 0, at: 800, dur: 4000, y: 70 }
        ]
      },
      {
        hint: 'Jetzt die nächsten.',
        walkers: [
          { kind: 'elder', sprite: 1, at: 0, dur: 3000, y: 68 },
          { kind: 'other', sprite: 1, at: 900, dur: 3000, y: 72 }
        ]
      }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    const { default: Elders } = await import('@/components/molecules/games/GameElders.vue')
    const w = mount(Elders, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  const walkers = (w: W) => w.findAll('.el-walker')
  const label = (b: { attributes: (n: string) => string | undefined }) => b.attributes('aria-label') ?? ''
  const elder = (w: W) => walkers(w).find((b) => /grauem Bart|gray beard/.test(label(b)))
  const other = (w: W) => walkers(w).find((b) => /kein Ältester|not an elder/.test(label(b)))

  it('the goal is every elder of both rounds; nobody walks before the lead of a moment is over', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(2)
    expect(w.find('.el-round').text()).toContain('Runde 1 von 2')
    expect(walkers(w)).toHaveLength(0)
    await tick(2000)
    expect(walkers(w)).toHaveLength(0)
    await tick(900)
    expect(walkers(w)).toHaveLength(1)
    expect(w.find('.el-count').text()).toContain('0 von 2')
  })

  it('a tap on somebody who is not an elder is a mistake with a cross and he walks on; a tap on an elder counts a part and he goes to the first seat', async () => {
    const w = await open()
    await tick(2200 + 1500)
    expect(walkers(w)).toHaveLength(2)
    await other(w)!.trigger('click')
    expect(played).toContain('wrong')
    expect(w.find('.el-fb').text()).toContain('keiner der Ältesten')
    expect(w.find('.gm.bad').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(0)
    await elder(w)!.trigger('click')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(played).toContain('tap')
    await tick(100)
    const seat = w.find('.el-seat')
    expect(seat.exists()).toBe(true)
    expect((seat.element as HTMLElement).style.left).toBe('20%')
    expect(w.find('.el-count').text()).toContain('1 von 2')
  })

  it('when an elder was missed the people walk past once more (nothing is lost)', async () => {
    const w = await open()
    await tick(2200 + 5000 + 2000)
    expect(w.find('.el-fb').text()).toContain('noch einmal')
    await tick(1200 + 1500)
    expect(elder(w)).toBeDefined()
    expect(useTaskProgress().parts.value).toBe(0)
  })

  it('both rounds, the picture of the ten sitting elders fades in, the end: no mistake three stars, two three, three two, six one', async () => {
    for (const [wrong, stars] of [[0, 3], [2, 3], [3, 2], [6, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      await tick(2200 + 1500)
      for (let i = 0; i < wrong; i++) await other(w)!.trigger('click')
      await elder(w)!.trigger('click')
      await tick(1800)
      expect(w.find('.el-round').text()).toContain('Runde 2 von 2')
      await tick(2200 + 300)
      await elder(w)!.trigger('click')
      await tick(1300)
      expect(w.find('.el-group').classes()).toContain('on')
      await tick(2300)
      expect(useTaskProgress().parts.value, `${wrong} wrong`).toBe(2)
      expect(useTaskProgress().finished.value, `${wrong} wrong`).toBe(true)
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${wrong} wrong`).toEqual([[stars]])
      w.unmount()
    }
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = await open('en')
    await tick(2200 + 1500)
    await other(w)!.trigger('click')
    expect(w.find('.el-fb').text()).toBe('He is not one of the elders. Look for the gray beards.')
  })
})

// ---------------------------------------------------------------- cradle
describe('Die Wiege schaukeln (cradle)', () => {
  const game: CradleGame = {
    background: 'images/x/stube.webp',
    states: ['images/x/w0.webp', 'images/x/w1.webp', 'images/x/w2.webp'],
    cradle: { x: 50, y: 90, w: 30 },
    rounds: [
      { hint: 'Ganz ruhig.', calm: 2, guide: true },
      { hint: 'Noch einmal.', calm: 2, guide: false }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    const { default: Cradle } = await import('@/components/molecules/games/GameCradle.vue')
    const w = mount(Cradle, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  const left = (w: W) => w.find('.cr-side.left')
  const right = (w: W) => w.find('.cr-side.right')
  const calm = async (w: W, first: 'left' | 'right', n: number) => {
    let side = first
    for (let i = 0; i < n; i++) {
      await (side === 'left' ? left(w) : right(w)).trigger('click')
      await tick(900)
      side = side === 'left' ? 'right' : 'left'
    }
  }

  it('the goal is every calm rock of both rounds; round 1 lets the next side glow, the baby is awake', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(4)
    expect(w.find('.cr-round').text()).toContain('Runde 1 von 2')
    expect(left(w).classes()).toContain('guide')
    expect(right(w).classes()).not.toContain('guide')
    expect(w.find('.cr-cradle').attributes('aria-label')).toBe('Das Kind ist wach')
    expect(w.find('.cr-count').text()).toContain('0 von 4')
  })

  it('the first rock is only a start, the other side after a calm pause counts, and the glow moves to the other side', async () => {
    const w = await open()
    await left(w).trigger('click')
    expect(useTaskProgress().parts.value).toBe(0)
    expect(right(w).classes()).toContain('guide')
    await tick(900)
    await right(w).trigger('click')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(played).toContain('bead')
    expect(w.find('.cr-count').text()).toContain('1 von 4')
  })

  it('the same side twice, or a rock that is too fast, is a mistake: a cross and the baby opens its eyes; a long break is only a new start', async () => {
    const w = await open()
    await left(w).trigger('click')
    await tick(900)
    await left(w).trigger('click')
    expect(played).toContain('wrong')
    expect(w.find('.cr-fb').text()).toContain('andere Seite')
    expect(w.find('.gm.bad').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(0)
    await tick(300)
    await right(w).trigger('click')
    expect(w.find('.cr-fb').text()).toContain('schnell')
    await tick(1300)
    expect(w.find('.gm.bad').exists()).toBe(false)
    // a long break: no mistake, only a start
    await tick(3000)
    await left(w).trigger('click')
    expect(w.find('.cr-fb').text()).toContain('schneller')
  })

  it('both rounds and the end: the baby falls asleep; no mistake three stars, two three, three two, six one', async () => {
    for (const [wrong, stars] of [[0, 3], [2, 3], [3, 2], [6, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      for (let i = 0; i < wrong; i++) {
        await left(w).trigger('click')
        await tick(900)
        await left(w).trigger('click')
        await tick(1300)
        await tick(2000)
      }
      await tick(2000)
      await calm(w, 'left', 3)
      expect(w.find('.cr-fb').text()).toContain('müde')
      await tick(2000)
      await calm(w, 'left', 3)
      expect(useTaskProgress().parts.value, `${wrong} wrong`).toBe(4)
      expect(w.find('.cr-fb').text()).toContain('schläft')
      await tick(2300)
      expect(useTaskProgress().finished.value).toBe(true)
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${wrong} wrong`).toEqual([[stars]])
      w.unmount()
    }
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = await open('en')
    expect(w.find('.cr-cradle').attributes('aria-label')).toBe('The baby is awake')
    await left(w).trigger('click')
    await tick(900)
    await left(w).trigger('click')
    expect(w.find('.cr-fb').text()).toBe('The other side! The baby is restless.')
  })
})
