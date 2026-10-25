/**
 * The new games of "Samuel und Saul" (`oberkleid`, `kuehe`, `stein`, `suchen`, `gepaeck`, `volk`): each is mounted with sample data and used: right and wrong moves, the rounds, the goal for the stars of "Go on"
 * (`useTaskProgress`), the end with its stars, German and English words.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import useTaskProgress from '@/use/useTaskProgress'
import type { BaggageGame, CoatGame, CowsGame, GatherGame, SearchGame, StoneGame } from '@/types/adventure'

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

// ---------------------------------------------------------------- the little robe
describe('Das kleine Oberkleid (coat)', () => {
  const game: CoatGame = {
    background: 'images/x/stube.webp',
    boy: 'images/x/samuel.webp',
    boyW: [18, 24, 30],
    boyPos: { x: 50, y: 80 },
    coat: 'images/x/kleid.webp',
    shelf: { y: 95, x0: 0, x1: 100 },
    ratio: 0.8,
    rounds: [
      { hint: 'Das erste Jahr.', boy: 0, coats: [10.4, 14.4, 18.7] },
      { hint: 'Das zweite Jahr.', boy: 1, coats: [19.2, 13.8, 25] },
      { hint: 'Das dritte Jahr.', boy: 2, coats: [31, 24, 17.3] }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    const { default: Coat } = await import('@/components/molecules/games/GameCoat.vue')
    const w = mount(Coat, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  const coats = (w: W) => w.findAll('.gc-coat')

  it('the goal is one robe for each round; three robes lie on the shelf and Samuel stands there', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(3)
    expect(w.find('.gc-round').text()).toContain('Runde 1 von 3')
    expect(w.find('.gc-hint').text()).toBe('Das erste Jahr.')
    expect(coats(w)).toHaveLength(3)
    expect(w.find('.gc-boy').attributes('style')).toContain('width: 18%')
  })

  it('a robe that is too small or too big is a mistake with a cross and a word, and cannot be tapped again; the right one counts a part', async () => {
    const w = await open()
    await coats(w)[0]!.trigger('click')
    expect(played).toContain('wrong')
    expect(w.find('.gc-fb').text()).toContain('Zu klein')
    expect(w.find('.gm.bad').exists()).toBe(true)
    expect(coats(w)[0]!.attributes('disabled')).toBeDefined()
    await coats(w)[2]!.trigger('click')
    expect(w.find('.gc-fb').text()).toContain('Zu groß')
    expect(useTaskProgress().parts.value).toBe(0)
    await coats(w)[1]!.trigger('click')
    expect(played).toContain('star')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.find('.gc-fb').text()).toBe('Es passt!')
    expect(coats(w)[1]!.classes()).toContain('worn')
    await tick(1800)
    expect(w.find('.gc-round').text()).toContain('Runde 2 von 3')
    expect(w.find('.gc-boy').attributes('style')).toContain('width: 24%')
    expect(problems()).toEqual([])
  })

  it('all rounds and the end: no mistake three stars, one still three, two or three two, more one', async () => {
    const right = [1, 0, 1]
    const wrongOnes = [[0, 2], [1, 2], [0, 2]]
    for (const [wrong, stars] of [[0, 3], [1, 3], [2, 2], [3, 2], [4, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      let left = wrong
      for (let r = 0; r < 3; r++) {
        for (const bad of wrongOnes[r]!) {
          if (left > 0) {
            await coats(w)[bad]!.trigger('click')
            left--
          }
        }
        await coats(w)[right[r]!]!.trigger('click')
        await tick(1800)
      }
      expect(useTaskProgress().parts.value, `${wrong} wrong`).toBe(3)
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${wrong} wrong`).toEqual([[stars]])
      w.unmount()
    }
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = await open('en')
    await coats(w)[0]!.trigger('click')
    expect(w.find('.gc-fb').text()).toBe('Too small. He has grown.')
    expect(w.find('.gc-round').text()).toContain('Round 1 of 3')
  })
})

// ---------------------------------------------------------------- two cows pull home
describe('Zwei Kühe ziehen heim (cows)', () => {
  const game: CowsGame = {
    background: 'images/x/strasse.webp',
    road: { y0: 90, y1: 50, cx0: 50, cx1: 50, half0: 20, half1: 8 },
    cart: 'images/x/wagen.webp',
    cartW: 14,
    tufts: [{ image: 'images/x/gras-1.webp', x: 20, y: 40, w: 8 }, { image: 'images/x/gras-2.webp', x: 80, y: 60, w: 8 }],
    rounds: [
      { hint: 'Die Kühe ziehen die Lade.', drift: 44, dur: 16000 },
      { hint: 'Jetzt ziehen sie stärker.', drift: 48, dur: 20000 }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    const { default: Cows } = await import('@/components/molecules/games/GameCows.vue')
    const w = mount(Cows, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  const cartLeft = (w: W) => Number.parseFloat(/left: ([\d.-]+)%/.exec(w.find('.gw-cart').attributes('style') ?? '')?.[1] ?? '50')
  /** A child who always nudges the cart back toward the middle (every 400 ms). */
  const steer = async (w: W, ms: number) => {
    for (let t = 0; t < ms; t += 400) {
      await tick(400)
      const x = cartLeft(w)
      if (Math.abs(x - 50) > 3) await w.find(x > 50 ? '.gw-side.left' : '.gw-side.right').trigger('pointerdown')
    }
  }

  it('the goal is one way home for each round; the cart stands in the middle at the bottom of the road', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(2)
    expect(w.find('.gw-round').text()).toContain('Runde 1 von 2')
    expect(w.findAll('.gw-tuft')).toHaveLength(2)
    expect(cartLeft(w)).toBeCloseTo(50)
    expect(w.find('.gw-cart').attributes('style')).toContain('top: 90%')
    expect(w.find('.gw-cart').attributes('style')).toContain('width: 14%')
  })

  it('without a tap the cows reach the grass: a cross, one mistake, a pause, and the cart stands in the middle again', async () => {
    const w = await open()
    await tick(2800)
    expect(played).toContain('wrong')
    expect(w.find('.gw-fb').text()).toContain('fressen')
    expect(w.find('.gm.bad').exists()).toBe(true)
    expect(w.find('.gw-cart').classes()).toContain('graze')
    await tick(1400)
    expect(w.find('.gw-cart').classes()).not.toContain('graze')
    // the cart stands in the middle again and drifts on from there (a few hundred milliseconds already)
    expect(cartLeft(w)).toBeGreaterThanOrEqual(50)
    expect(cartLeft(w)).toBeLessThan(58)
    expect(problems()).toEqual([])
  })

  it('a tap on the left half nudges the cart to the left, on the right half to the right', async () => {
    const w = await open()
    await tick(1000)
    const drifted = cartLeft(w)
    expect(drifted).toBeGreaterThan(50)
    await w.find('.gw-side.left').trigger('pointerdown')
    expect(cartLeft(w)).toBeLessThan(drifted)
    await w.find('.gw-side.right').trigger('pointerdown')
    expect(cartLeft(w)).toBeCloseTo(drifted, 5)
  })

  it('a child who steers brings the cart home in both rounds without a mistake: three stars', async () => {
    const w = await open()
    await steer(w, 16200)
    expect(w.find('.gw-fb').text()).toBe('Die Lade ist daheim!')
    expect(useTaskProgress().parts.value).toBe(1)
    await tick(1700)
    expect(w.find('.gw-round').text()).toContain('Runde 2 von 2')
    await steer(w, 20200)
    await tick(1700)
    expect(useTaskProgress().parts.value).toBe(2)
    expect(useTaskProgress().finished.value).toBe(true)
    await w.find('.gd button').trigger('click')
    expect(w.emitted('done')).toEqual([[3]])
    expect(problems()).toEqual([])
  })

  it('a child who never taps reaches the grass again and again: every time is a mistake, so one star at the end', async () => {
    const w = await open()
    await tick(60000)
    await tick(1700)
    await tick(60000)
    await tick(2000)
    expect(w.find('.gd').exists()).toBe(true)
    await w.find('.gd button').trigger('click')
    expect(w.emitted('done')).toEqual([[1]])
  })

  it('speaks English', async () => {
    const w = await open('en')
    await tick(2800)
    expect(w.find('.gw-fb').text()).toBe('The cows stop to graze. Back to the road!')
    expect(w.find('.gw-round').text()).toContain('Round 1 of 2')
  })
})

// ---------------------------------------------------------------- the stone of help
describe('Der Stein der Hilfe (stone)', () => {
  const game: StoneGame = {
    background: 'images/x/land.webp',
    marks: ['images/x/stadt.webp', 'images/x/fels.webp'],
    markW: [14, 12],
    stone: 'images/x/stein.webp',
    stoneW: 9,
    groundY: 70,
    startPos: { x: 50, y: 92 },
    rounds: [
      { hint: 'Zwischen Mizpa und dem Felsen.', notch: true, pairs: [{ a: { image: 0, x: 20 }, b: { image: 1, x: 80 } }, { a: { image: 0, x: 15 }, b: { image: 1, x: 65 } }] },
      { hint: 'Noch einmal, ohne Kerbe.', notch: false, pairs: [{ a: { image: 1, x: 30 }, b: { image: 0, x: 90 } }, { a: { image: 0, x: 10 }, b: { image: 1, x: 50 } }] }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    const { default: Stone } = await import('@/components/molecules/games/GameStone.vue')
    const w = mount(Stone, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  /** Drag the stone to x percent of the 400-pixel-wide picture and let go. */
  const drag = async (w: W, xPercent: number) => {
    const el = w.find('.gs-stone').element
    el.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 200, clientY: 276 }))
    await flushPromises()
    el.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: (xPercent / 100) * 400, clientY: 210 }))
    await flushPromises()
    el.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, clientX: (xPercent / 100) * 400, clientY: 210 }))
    await flushPromises()
  }

  it('the goal is one stone for every pair of landmarks; the groove shows only in round one', async () => {
    box400x300()
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(4)
    expect(w.find('.gs-round').text()).toContain('Runde 1 von 2')
    expect(w.find('.gs-notch').exists()).toBe(true)
    expect(w.find('.gs-notch').attributes('style')).toContain('left: 50%')
    expect(w.findAll('.gs-mark')).toHaveLength(2)
  })

  it('a stone that is let go too near to one landmark is a mistake with a word and goes back; in the middle it stays', async () => {
    box400x300()
    const w = await open()
    await drag(w, 30)
    expect(played).toContain('wrong')
    expect(w.find('.gs-fb').text()).toContain('Zu weit links')
    expect(w.find('.gm.bad').exists()).toBe(true)
    expect(w.find('.gs-stone').attributes('style')).toContain('left: 50%')
    await drag(w, 72)
    expect(w.find('.gs-fb').text()).toContain('Zu weit rechts')
    await drag(w, 10)
    expect(w.find('.gs-fb').text()).toContain('zwischen den beiden')
    expect(useTaskProgress().parts.value).toBe(0)
    await drag(w, 51)
    expect(played).toContain('star')
    expect(w.find('.gs-fb').text()).toBe('In der Mitte. Der Stein steht!')
    expect(useTaskProgress().parts.value).toBe(1)
    await tick(1700)
    expect(w.find('.gs-round').text()).toContain('Runde 1 von 2')
    expect(w.find('.gs-fb').text()).toBe('')
    expect(problems()).toEqual([])
  })

  it('the arrow keys and Enter do the same without a finger', async () => {
    box400x300()
    const w = await open()
    const stone = w.find('.gs-stone')
    // the stone waits at 50 percent: the middle of the first pair (20 and 80) is 50, so Enter at once is right
    await stone.trigger('keydown', { key: 'ArrowLeft' })
    await stone.trigger('keydown', { key: 'ArrowLeft' })
    await stone.trigger('keydown', { key: 'ArrowLeft' })
    await stone.trigger('keydown', { key: 'Enter' })
    expect(w.find('.gs-fb').text()).toContain('Zu weit links')
    // the wrong stone went back to the middle of the picture, which is also the middle of this pair
    await stone.trigger('keydown', { key: 'Enter' })
    expect(useTaskProgress().parts.value).toBe(1)
  })

  it('all four stones and the end: up to two mistakes three stars, three to five two, six one', async () => {
    box400x300()
    const middles = [50, 40, 60, 30]
    for (const [wrong, stars] of [[0, 3], [2, 3], [3, 2], [5, 2], [6, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      for (let i = 0; i < wrong; i++) await drag(w, 2)
      for (const m of middles) {
        await drag(w, m)
        await tick(1700)
      }
      expect(useTaskProgress().parts.value, `${wrong} wrong`).toBe(4)
      expect(useTaskProgress().finished.value, `${wrong} wrong`).toBe(true)
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${wrong} wrong`).toEqual([[stars]])
      w.unmount()
    }
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    box400x300()
    const w = await open('en')
    await drag(w, 30)
    expect(w.find('.gs-fb').text()).toBe('Too far to the left. Look for the middle.')
  })
})

// ---------------------------------------------------------------- follow the donkeys
describe('Folge den Eselinnen (search)', () => {
  const place = (label: string, x: number, y: number) => ({ label, x, y, w: 14 })
  const game: SearchGame = {
    background: 'images/x/karte.webp',
    places: [place('Ephraim', 20, 40), place('Schalischa', 40, 60), place('Schaalim', 60, 40), place('Benjamin', 75, 70), place('Zuf', 88, 45)],
    prints: ['images/x/spuren-1.webp', 'images/x/spuren-2.webp'],
    printW: 4,
    saul: 'images/x/saul.webp',
    saulW: 8,
    rounds: [
      { hint: 'Folge den Spuren.', prints: true, order: [0, 1, 2, 3, 4] },
      { hint: 'Ohne Spuren.', prints: false, order: [0, 1, 2, 3, 4] }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    const { default: Search } = await import('@/components/molecules/games/GameSearch.vue')
    const w = mount(Search, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  const places = (w: W) => w.findAll('.gf-place')

  it('the goal is every place of both rounds; the footprints show only in round one', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(10)
    expect(places(w)).toHaveLength(5)
    expect(w.findAll('.gf-print')).toHaveLength(5)
    expect(w.text()).toContain('Ephraim')
    expect(w.find('.gf-saul').attributes('style')).toContain('left: 8%')
  })

  it('a wrong place is a mistake with a cross; the places in the right order count a part each and get a tick', async () => {
    const w = await open()
    await places(w)[3]!.trigger('click')
    expect(played).toContain('wrong')
    expect(w.find('.gf-fb').text()).toContain('Nicht dieser Ort')
    expect(w.find('.gm.bad').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(0)
    await places(w)[0]!.trigger('click')
    await places(w)[1]!.trigger('click')
    expect(useTaskProgress().parts.value).toBe(2)
    expect(w.findAll('.gm.good')).toHaveLength(2)
    expect(places(w)[0]!.attributes('disabled')).toBeDefined()
    // Saul has walked on to the place he visited last
    expect(w.find('.gf-saul').attributes('style')).toContain('left: 47%')
  })

  it('both rounds and the end: up to two mistakes three stars, then two, six one', async () => {
    for (const [wrong, stars] of [[0, 3], [2, 3], [3, 2], [5, 2], [6, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      for (let i = 0; i < wrong; i++) await places(w)[4]!.trigger('click')
      for (let r = 0; r < 2; r++) {
        for (let i = 0; i < 5; i++) await places(w)[i]!.trigger('click')
        await tick(1800)
      }
      expect(useTaskProgress().parts.value, `${wrong} wrong`).toBe(10)
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${wrong} wrong`).toEqual([[stars]])
      w.unmount()
    }
    expect(problems()).toEqual([])
  })

  it('round two has no footprints; speaks English', async () => {
    const w = await open('en')
    for (let i = 0; i < 5; i++) await places(w)[i]!.trigger('click')
    await tick(1800)
    expect(w.find('.gf-round').text()).toContain('Round 2 of 2')
    expect(w.findAll('.gf-print')).toHaveLength(0)
    await places(w)[3]!.trigger('click')
    expect(w.find('.gf-fb').text()).toBe('Not this place. Think of the story.')
  })
})

// ---------------------------------------------------------------- where is Saul
describe('Wo ist Saul? (baggage)', () => {
  const game: BaggageGame = {
    background: 'images/x/lager.webp',
    piles: ['images/x/stapel-1.webp', 'images/x/stapel-2.webp', 'images/x/stapel-3.webp', 'images/x/stapel-4.webp'],
    pileW: [12, 12, 13, 14],
    pileH: [14, 20, 28, 34],
    saul: 'images/x/saul.webp',
    saulW: 10,
    saulH: 27,
    things: ['images/x/krug.webp', 'images/x/zicklein.webp', 'images/x/korb.webp'],
    thingW: 7,
    rounds: [
      { hint: 'Saul ist größer als alle.', hidden: 3, piles: [{ kind: 0, x: 15, y: 60 }, { kind: 1, x: 35, y: 70 }, { kind: 3, x: 55, y: 62 }, { kind: 3, x: 75, y: 72 }, { kind: 2, x: 90, y: 66 }].map((p) => p) },
      { hint: 'Jetzt mehr Stapel.', hidden: 6, piles: [0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({ kind: i % 4, x: 10 + i * 11, y: 60 + (i % 3) * 6 })) }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    const { default: Baggage } = await import('@/components/molecules/games/GameBaggage.vue')
    const w = mount(Baggage, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  const piles = (w: W) => w.findAll('.gp-pile')

  it('the goal is Saul found once in each round; five piles in round one, eight in round two; Saul is not on the picture yet', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(2)
    expect(piles(w)).toHaveLength(5)
    expect(w.find('.gp-saul').exists()).toBe(false)
    expect(w.find('.gp-hint').text()).toBe('Saul ist größer als alle.')
  })

  it('under a wrong pile there is only baggage (a mistake, the pile stays lifted); under the right one Saul stands', async () => {
    const w = await open()
    await piles(w)[0]!.trigger('click')
    expect(played).toContain('wrong')
    expect(w.find('.gp-fb').text()).toContain('Nur Gepäck')
    expect(piles(w)[0]!.classes()).toContain('lifted')
    expect(piles(w)[0]!.attributes('disabled')).toBeDefined()
    // a little thing lies under the pile that hid nobody
    expect(w.findAll('.gp-thing')).toHaveLength(1)
    expect(w.find('.gm.bad').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(0)
    await piles(w)[3]!.trigger('click')
    expect(played).toContain('star')
    expect(w.find('.gp-saul').exists()).toBe(true)
    expect(w.find('.gp-fb').text()).toBe('Da ist er!')
    expect(useTaskProgress().parts.value).toBe(1)
    await tick(2000)
    expect(piles(w)).toHaveLength(8)
    expect(w.find('.gp-saul').exists()).toBe(false)
  })

  it('both rounds and the end: up to three empty piles three stars, to seven two, more one', async () => {
    for (const [empty, stars] of [[0, 3], [3, 3], [4, 2], [7, 2], [8, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      let left = empty
      for (const bad of [0, 1, 2, 4]) {
        if (left > 0) {
          await piles(w)[bad]!.trigger('click')
          left--
        }
      }
      await piles(w)[3]!.trigger('click')
      await tick(2000)
      for (const bad of [0, 1, 2, 3]) {
        if (left > 0) {
          await piles(w)[bad]!.trigger('click')
          left--
        }
      }
      await piles(w)[6]!.trigger('click')
      await tick(2000)
      expect(useTaskProgress().parts.value, `${empty} empty`).toBe(2)
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${empty} empty`).toEqual([[stars]])
      w.unmount()
    }
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = await open('en')
    await piles(w)[0]!.trigger('click')
    expect(w.find('.gp-fb').text()).toBe('Only baggage. Saul is taller than everybody.')
  })
})

// ---------------------------------------------------------------- hold the people together
describe('Das Volk zusammenhalten (gather)', () => {
  const game: GatherGame = {
    background: 'images/x/gilgal.webp',
    men: ['images/x/m1.webp', 'images/x/m2.webp'],
    manW: 10,
    homes: [
      { sprite: 0, x: 30, y: 70, dir: -1 },
      { sprite: 1, x: 50, y: 78, dir: 1 },
      { sprite: 0, x: 70, y: 70, dir: 1 }
    ],
    saul: 'images/x/saul.webp',
    saulPos: { x: 50, y: 62, w: 12 },
    sun: 'images/x/sonne.webp',
    samuel: 'images/x/samuel.webp',
    samuelPos: { x: 88, y: 80, w: 12 },
    rounds: [
      { hint: 'Drei Tage.', days: 3, dayMs: 3000, leaves: [{ man: 0, at: 500 }, { man: 2, at: 2500 }, { man: 1, at: 4500 }] },
      { hint: 'Sieben Tage.', days: 7, dayMs: 3000, leaves: [{ man: 1, at: 500 }, { man: 0, at: 3000 }, { man: 2, at: 5500 }, { man: 1, at: 8000 }, { man: 0, at: 10500 }, { man: 2, at: 13000 }, { man: 1, at: 15500 }] }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    const { default: Gather } = await import('@/components/molecules/games/GameGather.vue')
    const w = mount(Gather, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  const men = (w: W) => w.findAll('.gg-man')

  it('the goal is every man who walks away; the day counter and the sun are there; everybody stands at home first', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(10)
    expect(w.find('.gg-day').text()).toBe('Tag 1 von 3')
    expect(men(w)).toHaveLength(3)
    expect(men(w).every((m) => !m.classes().includes('walking'))).toBe(true)
    expect(w.find('.gg-samuel').exists()).toBe(false)
    expect(w.find('.gg-saul').exists()).toBe(true)
  })

  it('a man who walks away is tapped and comes back (a part); a man who is not walking cannot be tapped', async () => {
    const w = await open()
    await tick(700)
    expect(men(w)[0]!.classes()).toContain('walking')
    expect(w.find('.gg-fb').text()).toBe('Ein Mann geht weg!')
    expect(men(w)[1]!.attributes('disabled')).toBeDefined()
    const before = men(w)[0]!.attributes('style')
    await tick(1000)
    expect(men(w)[0]!.attributes('style')).not.toBe(before)
    await men(w)[0]!.trigger('click')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(men(w)[0]!.classes()).not.toContain('walking')
    expect(men(w)[0]!.attributes('style')).toContain('left: 30%')
    expect(problems()).toEqual([])
  })

  it('a man who reaches the edge is lost (a cross, one mistake) and comes back later; Samuel arrives after the days', async () => {
    const w = await open()
    // man 0 leaves at 500 and has reached the edge 3800 ms later
    await tick(500 + 3900)
    expect(played).toContain('wrong')
    expect(w.find('.gg-fb').text()).toContain('weg')
    expect(men(w)[0]!.classes()).toContain('gone')
    expect(w.find('.gm.bad').exists()).toBe(true)
    await tick(1900)
    expect(men(w)[0]!.classes()).not.toContain('gone')
    // the others are brought back; then the nine seconds are over and Samuel comes
    for (const m of [2, 1]) {
      if (men(w)[m]!.classes().includes('walking')) await men(w)[m]!.trigger('click')
    }
    await tick(3000)
    expect(w.find('.gg-samuel').exists()).toBe(true)
    expect(w.find('.gg-fb').text()).toBe('Samuel kommt.')
    expect(w.find('.gg-day').text()).toBe('Tag 3 von 3')
  })

  it('both rounds: all men brought back is three stars; up to three lost still three; four to eight two; nine one', async () => {
    for (const [lose, stars] of [[0, 3], [3, 3], [4, 2], [8, 2], [9, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      // a child who taps every man who walks away at once, except the first `lose` ones
      const seen = new Set<number>()
      const skip = new Set<number>()
      let events = 0
      for (let i = 0; i < 3000 && !useTaskProgress().finished.value; i++) {
        await tick(50)
        men(w).forEach((m, idx) => {
          const now = m.classes().includes('walking')
          if (now && !seen.has(idx)) {
            seen.add(idx)
            if (events < lose) {
              events++
              skip.add(idx)
            }
          }
          if (!now) {
            seen.delete(idx)
            skip.delete(idx)
          }
        })
        for (const idx of [...seen]) {
          if (skip.has(idx)) continue
          await men(w)[idx]!.trigger('click')
          seen.delete(idx)
        }
      }
      expect(useTaskProgress().finished.value, `${lose} lost`).toBe(true)
      expect(useTaskProgress().parts.value, `${lose} lost`).toBe(10 - lose)
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${lose} lost`).toEqual([[stars]])
      w.unmount()
    }
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = await open('en')
    expect(w.find('.gg-day').text()).toBe('Day 1 of 3')
    await tick(700)
    expect(w.find('.gg-fb').text()).toBe('A man is walking away!')
  })
})
