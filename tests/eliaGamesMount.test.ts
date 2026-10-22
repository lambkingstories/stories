/**
 * The new games of "Elia" (`raben`, `hoehlen`, `regen`, `sausen`): each is mounted with sample data and used: right and wrong moves, the rounds, the goal for the stars of "Go on"
 * (`useTaskProgress`), the end with its stars, German and English words.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import useTaskProgress from '@/use/useTaskProgress'
import type { CavesGame, RainGame, RavensGame, WhisperGame } from '@/types/adventure'

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

// ---------------------------------------------------------------- ravens
describe('Raben im Anflug (ravens)', () => {
  const game: RavensGame = {
    background: 'images/x/tal.webp',
    ravens: { bread: 'images/x/rb.webp', meat: 'images/x/rf.webp', twig: 'images/x/rz.webp', empty: 'images/x/rl.webp' },
    food: { bread: 'images/x/brot.webp', meat: 'images/x/fleisch.webp' },
    rock: { x: 60, y: 74, step: 9, w: 8 },
    ravenW: 16,
    rounds: [
      {
        hint: 'Morgen: Tippe die Raben an.',
        flights: [
          { kind: 'bread', y: 24, at: 0, dur: 4000 },
          { kind: 'twig', y: 36, at: 500, dur: 4000 }
        ]
      },
      { hint: 'Abend.', flights: [{ kind: 'meat', y: 20, at: 0, dur: 3000 }] }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    const { default: Ravens } = await import('@/components/molecules/games/GameRavens.vue')
    const w = mount(Ravens, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  const ravens = (w: W) => w.findAll('.rv-raven')
  const food = (w: W) => ravens(w).filter((b) => /^(Rabe mit Essen|Raven with food)$/.test(b.attributes('aria-label') ?? ''))
  const twig = (w: W) => ravens(w).filter((b) => /Zweig|twig/.test(b.attributes('aria-label') ?? ''))

  it('the goal is every raven with food of both rounds; no raven comes before the lead of a moment is over', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(2)
    expect(w.find('.rv-round').text()).toBe('Morgen')
    expect(ravens(w)).toHaveLength(0)
    await tick(2000)
    expect(ravens(w)).toHaveLength(0)
    await tick(400)
    expect(food(w)).toHaveLength(1)
  })

  it('a raven with bread is tapped: it counts a part, a tone sounds, the bread lies on the rock; a raven with a twig is a mistake with a cross and flies on', async () => {
    const w = await open()
    await tick(3000)
    expect(twig(w)).toHaveLength(1)
    await twig(w)[0]!.trigger('click')
    expect(played).toContain('wrong')
    expect(w.find('.rv-fb').text()).toContain('Dieser Rabe bringt kein Essen')
    expect(w.find('.gm.bad').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(0)
    expect(twig(w)).toHaveLength(1)
    await food(w)[0]!.trigger('click')
    expect(played).toContain('basket')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.findAll('.rv-food')).toHaveLength(1)
    await tick(1600)
    expect(food(w)).toHaveLength(0)
  })

  it('a raven that is not tapped flies on and is no mistake; when all have crossed the round is over and the next one begins (the evening)', async () => {
    const w = await open()
    await tick(2200 + 4600)
    expect(ravens(w)).toHaveLength(0)
    expect(w.find('.rv-fb').text()).toContain('weitergeflogen')
    expect(useTaskProgress().parts.value).toBe(0)
    await tick(1800)
    expect(w.find('.rv-round').text()).toBe('Abend')
    expect(w.findAll('.rv-food')).toHaveLength(0)
  })

  it('both rounds and the end: no mistake three stars, up to two mistakes still three, up to five two, more one', async () => {
    for (const [wrong, stars] of [[0, 3], [2, 3], [3, 2], [5, 2], [6, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      await tick(2900)
      for (let i = 0; i < wrong; i++) await twig(w)[0]!.trigger('click')
      await food(w)[0]!.trigger('click')
      await tick(4600)
      await tick(1800)
      await tick(2400)
      await food(w)[0]!.trigger('click')
      await tick(3200)
      await tick(1600)
      expect(useTaskProgress().parts.value, `${wrong} wrong`).toBe(2)
      expect(useTaskProgress().finished.value).toBe(true)
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${wrong} wrong`).toEqual([[stars]])
      w.unmount()
    }
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = await open('en')
    await tick(3000)
    await twig(w)[0]!.trigger('click')
    expect(w.find('.rv-fb').text()).toBe('That raven brings no food.')
    expect(w.find('.rv-round').text()).toBe('Morning')
  })
})

// ---------------------------------------------------------------- caves
describe('In zwei Höhlen (caves)', () => {
  const game: CavesGame = {
    background: 'images/x/hang.webp',
    prophets: [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ id: `p${n}`, image: `images/x/p${n}.webp`, label: `Prophet ${n}` })),
    caves: [
      { x: 25, y: 45, w: 17, h: 24 },
      { x: 75, y: 45, w: 17, h: 24 }
    ],
    yard: { x0: 14, x1: 86, y: 76, row: 19, w: 9.5 },
    rounds: [
      { hint: 'Bringe die Propheten in die Höhlen.', count: 4 },
      { hint: 'Jetzt mehr.', count: 8 }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    box400x300()
    const { default: Caves } = await import('@/components/molecules/games/GameCaves.vue')
    const w = mount(Caves, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  /** Chooses a prophet with the keyboard (Enter), then taps a cave (0 left, 1 right). */
  const put = async (w: W, prophet: number, cave: 0 | 1) => {
    await w.findAll('.cv-body')[prophet]!.trigger('keydown', { key: 'Enter' })
    await w.findAll('.cv-cave')[cave]!.trigger('click')
    await flushPromises()
  }

  it('the goal is every prophet of both rounds; round 1 shows four prophets and two caves, both empty', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(12)
    expect(w.find('.cv-round').text()).toContain('Runde 1 von 2')
    expect(w.findAll('.cv-prophet')).toHaveLength(4)
    expect(w.findAll('.cv-cave')).toHaveLength(2)
    expect(w.findAll('.cv-count').map((c) => c.text())).toEqual(['0', '0'])
    expect(w.find('.cv-fb').text()).toBe('0 von 4 Propheten sind in einer Höhle.')
  })

  it('a prophet that is put into a cave counts there; the same number in both caves is right (a tone, all prophets count, the next round)', async () => {
    const w = await open()
    await put(w, 0, 0)
    expect(played).toContain('basket')
    expect(w.findAll('.cv-count').map((c) => c.text())).toEqual(['1', '0'])
    await put(w, 1, 1)
    await put(w, 2, 0)
    await put(w, 3, 1)
    expect(w.findAll('.cv-count').map((c) => c.text())).toEqual(['2', '2'])
    expect(played).toContain('star')
    expect(w.find('.cv-fb').text()).toContain('In beiden Höhlen gleich viele: 2 und 2')
    expect(useTaskProgress().parts.value).toBe(4)
    await tick(2100)
    expect(w.find('.cv-round').text()).toContain('Runde 2 von 2')
    expect(w.findAll('.cv-prophet')).toHaveLength(8)
    expect(w.findAll('.cv-count').map((c) => c.text())).toEqual(['0', '0'])
  })

  it('uneven caves are a mistake: the prophet of the cave with too many comes out again and the round goes on', async () => {
    const w = await open()
    await put(w, 0, 0)
    await put(w, 1, 0)
    await put(w, 2, 0)
    await put(w, 3, 1)
    expect(played).toContain('wrong')
    expect(w.find('.cv-fb').text()).toContain('Nicht gleich viele')
    expect(w.find('.gm.bad').exists()).toBe(true)
    await tick(600)
    expect(w.findAll('.cv-count').map((c) => c.text())).toEqual(['2', '1'])
    expect(useTaskProgress().parts.value).toBe(0)
    await put(w, 2, 1)
    expect(w.findAll('.cv-count').map((c) => c.text())).toEqual(['2', '2'])
    expect(useTaskProgress().parts.value).toBe(4)
  })

  it('a prophet that is already in a cave can be moved to the other one', async () => {
    const w = await open()
    await put(w, 0, 0)
    await put(w, 0, 1)
    expect(w.findAll('.cv-count').map((c) => c.text())).toEqual(['0', '1'])
  })

  it('both rounds and the end: right the first time three stars, one mistake still three, up to three two, more one', async () => {
    for (const [wrong, stars] of [[0, 3], [1, 3], [2, 2], [3, 2], [4, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      if (wrong === 0) {
        for (const [p, c] of [[0, 0], [1, 0], [2, 1], [3, 1]] as const) await put(w, p, c)
      } else {
        // three into the left cave and one into the right: uneven, one comes out; put him left again for every further mistake
        for (const p of [0, 1, 2]) await put(w, p, 0)
        await put(w, 3, 1)
        await tick(600)
        for (let m = 1; m < wrong; m++) {
          await put(w, 2, 0)
          await tick(600)
        }
        await put(w, 2, 1)
      }
      await tick(2100)
      for (const p of [0, 1, 2, 3]) await put(w, p, 0)
      for (const p of [4, 5, 6, 7]) await put(w, p, 1)
      await tick(1700)
      expect(useTaskProgress().parts.value, `${wrong} wrong`).toBe(12)
      expect(useTaskProgress().finished.value).toBe(true)
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${wrong} wrong`).toEqual([[stars]])
      w.unmount()
    }
    expect(problems()).toEqual([])
  })

  it('the whole game with one mistake in round 2 gives three stars and the end sends the stars', async () => {
    const w = await open()
    for (const [p, c] of [[0, 0], [1, 0], [2, 1], [3, 1]] as const) await put(w, p, c)
    await tick(2100)
    for (const p of [0, 1, 2, 3, 4]) await put(w, p, 0)
    for (const p of [5, 6, 7]) await put(w, p, 1)
    await tick(600)
    await put(w, 4, 1)
    expect(w.findAll('.cv-count').map((c) => c.text())).toEqual(['4', '4'])
    expect(useTaskProgress().parts.value).toBe(12)
    await tick(1700)
    expect(useTaskProgress().finished.value).toBe(true)
    await w.find('.gd button').trigger('click')
    expect(w.emitted('done')).toEqual([[3]])
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = await open('en')
    expect(w.find('.cv-fb').text()).toBe('0 of 4 prophets are in a cave.')
    await put(w, 0, 0)
    await put(w, 1, 0)
    await put(w, 2, 0)
    await put(w, 3, 1)
    expect(w.find('.cv-fb').text()).toBe('Not the same number. A prophet comes out again.')
  })
})

// ---------------------------------------------------------------- rain
describe('Wolken zum Regnen bringen (rain)', () => {
  const game: RainGame = {
    dry: 'images/x/trocken.webp',
    green: 'images/x/gruen.webp',
    clouds: ['images/x/w1.webp', 'images/x/w2.webp', 'images/x/w3.webp'],
    cloudW: [9.5, 27, 46],
    drops: 'images/x/tropfen.webp',
    sea: { x: 62, y: 44 },
    rounds: [
      { hint: 'Eine winzige Wolke steigt auf.', mode: 'grow', clouds: [{ y: 44, at: 0, dur: 0 }] },
      {
        hint: 'Sechs Wolken ziehen herein.',
        mode: 'pass',
        clouds: [0, 1, 2, 3, 4, 5].map((i) => ({ y: 14 + i * 3, at: i * 1500, dur: 6000 }))
      }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    const { default: Rain } = await import('@/components/molecules/games/GameRain.vue')
    const w = mount(Rain, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  const clouds = (w: W) => w.findAll('.rn-cloud')
  const green = (w: W) => Number(/opacity:\s*([\d.]+)/.exec(w.find('.rn-green').attributes('style') ?? '')?.[1] ?? 0)

  it('the goal is seven rains (one and six); the tiny cloud comes after the lead, the picture is dry', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(7)
    expect(clouds(w)).toHaveLength(0)
    expect(green(w)).toBe(0)
    await tick(2300)
    expect(clouds(w)).toHaveLength(1)
  })

  it('round 1: a first tap lets the cloud grow, the second makes it rain (a part, a tone, the picture turns a seventh green) and the second round begins', async () => {
    const w = await open()
    await tick(2300)
    const before = clouds(w)[0]!.attributes('style')
    await clouds(w)[0]!.trigger('click')
    expect(played).toContain('basket')
    expect(useTaskProgress().parts.value).toBe(0)
    expect(clouds(w)[0]!.attributes('style')).not.toBe(before)
    await clouds(w)[0]!.trigger('click')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(played).toContain('star')
    expect(w.find('.rn-drops').exists()).toBe(true)
    expect(green(w)).toBeCloseTo(1 / 7, 2)
    await tick(3100)
    expect(w.find('.rn-fb').text()).toContain('Es regnet')
    await tick(2300)
    expect(w.find('.rn-round').text()).toContain('Runde 2 von 2')
  })

  const toRoundTwo = async (w: W) => {
    await tick(2300)
    await clouds(w)[0]!.trigger('click')
    await clouds(w)[0]!.trigger('click')
    await tick(3100)
    await tick(2300)
  }

  it('round 2: every cloud that is tapped before it has passed rains; a cloud that drifts by is a mistake', async () => {
    const w = await open()
    await toRoundTwo(w)
    await tick(2300)
    expect(clouds(w).length).toBeGreaterThan(0)
    await clouds(w)[0]!.trigger('click')
    expect(useTaskProgress().parts.value).toBe(2)
    expect(green(w)).toBeCloseTo(2 / 7, 2)
    await tick(2000 + 6000)
    expect(played).toContain('wrong')
    expect(w.find('.rn-fb').text().length).toBeGreaterThan(0)
  })

  it('all six clouds tapped: the end with three stars; a few missed clouds cost stars (up to two mistakes three, up to four two, more one)', async () => {
    for (const [missed, stars] of [[0, 3], [2, 3], [3, 2], [4, 2], [5, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      await toRoundTwo(w)
      // the clouds come every 1.5 s after the lead; tap the first ones as they come, let the last `missed` ones pass
      const tapN = 6 - missed
      for (let i = 0; i < tapN; i++) {
        await tick(i === 0 ? 2300 : 1500)
        const c = clouds(w).filter((x) => !x.attributes('disabled'))
        if (c.length) await c[c.length - 1]!.trigger('click')
      }
      await tick(20000)
      await tick(4000)
      expect(useTaskProgress().finished.value, `${missed} missed`).toBe(true)
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${missed} missed`).toEqual([[stars]])
      w.unmount()
    }
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = await open('en')
    await tick(2300)
    expect(clouds(w)[0]!.attributes('aria-label')).toBe('Cloud')
    await clouds(w)[0]!.trigger('click')
    await clouds(w)[0]!.trigger('click')
    await tick(3100)
    expect(w.find('.rn-fb').text()).toBe('It rains, and the land turns green.')
  })
})

// ---------------------------------------------------------------- whisper
describe('Das stille Sausen (whisper)', () => {
  const game: WhisperGame = {
    background: 'images/x/horeb.webp',
    standing: 'images/x/steht.webp',
    veiled: 'images/x/verhuellt.webp',
    elia: { x: 31, y: 72, w: 14 },
    wind: 'images/x/wirbel.webp',
    fire: 'images/x/flammen.webp',
    cracks: 'images/x/risse.webp',
    feather: 'images/x/feder.webp',
    rounds: [
      { hint: 'Warte.', order: ['wind', 'quake', 'fire'], loudMs: 1000, gapMs: 400, silenceMs: 1000 },
      { hint: 'Noch einmal.', order: ['fire', 'wind', 'quake'], loudMs: 1500, gapMs: 300, silenceMs: 1500 }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    const { default: Whisper } = await import('@/components/molecules/games/GameWhisper.vue')
    const w = mount(Whisper, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  const loud = (w: W) => w.findAll('.wh-loud')
  const feather = (w: W) => w.find('.wh-feather')

  it('the goal is the quiet sound of both rounds; the picture begins calm: nothing loud, no feather, Elijah stands', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(2)
    expect(loud(w)).toHaveLength(0)
    expect(feather(w).exists()).toBe(false)
    expect(w.find('.wh-fb').text()).toBe('Warte ...')
    await tick(1900)
    expect(loud(w)).toHaveLength(0)
  })

  it('wind, earthquake and fire come in the order of the round, one after the other; the feather is not there before the stillness is over', async () => {
    const w = await open()
    await tick(2100)
    expect(loud(w)[0]!.classes()).toContain('wh-wind')
    await tick(1000)
    expect(loud(w)).toHaveLength(0)
    await tick(400)
    expect(loud(w)[0]!.classes()).toContain('wh-quake')
    await tick(1400)
    expect(loud(w)[0]!.classes()).toContain('wh-fire')
    expect(feather(w).exists()).toBe(false)
    await tick(1000)
    expect(loud(w)).toHaveLength(0)
    expect(feather(w).exists()).toBe(false)
    await tick(1100)
    expect(feather(w).exists()).toBe(true)
  })

  it('a tap on something loud is a mistake (a cross, a sound, "God was not in it"); the quiet sound is tapped: a part, Elijah covers his face, round 2', async () => {
    const w = await open()
    await tick(2100)
    await loud(w)[0]!.trigger('click')
    expect(played).toContain('wrong')
    expect(w.find('.wh-fb').text()).toContain('Gott war nicht darin')
    expect(w.find('.gm.bad').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(0)
    await tick(2000 + 1000 + 1100 + 1000)
    expect(feather(w).exists()).toBe(true)
    await feather(w).trigger('click')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(played).toContain('star')
    expect(w.find('.wh-elia img').attributes('src')).toContain('verhuellt')
    expect(w.find('.wh-fb').text()).toContain('verhüllt sein Gesicht')
    await tick(2700)
    expect(w.find('.wh-round').text()).toContain('Runde 2 von 2')
    expect(w.find('.wh-elia img').attributes('src')).toContain('steht')
    expect(feather(w).exists()).toBe(false)
  })

  it('both rounds and the end: no mistake three stars, one still three, up to three two, more one', async () => {
    for (const [wrong, stars] of [[0, 3], [1, 3], [2, 2], [3, 2], [4, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      await tick(2100)
      for (let i = 0; i < wrong; i++) await loud(w)[0]?.trigger('click')
      await tick(8000)
      await feather(w).trigger('click')
      await tick(2700)
      await tick(9000)
      await feather(w).trigger('click')
      await tick(2300)
      expect(useTaskProgress().parts.value, `${wrong} wrong`).toBe(2)
      expect(useTaskProgress().finished.value).toBe(true)
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${wrong} wrong`).toEqual([[stars]])
      w.unmount()
    }
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = await open('en')
    expect(w.find('.wh-fb').text()).toBe('Wait ...')
    await tick(2100)
    await loud(w)[0]!.trigger('click')
    expect(w.find('.wh-fb').text()).toBe('God was not in it. Wait for the quiet sound.')
  })
})
