/**
 * The new games of "Adam und Eva" (no game of Josef or Noah is repeated there): each is mounted with sample data and used: right and wrong
 * moves, the rounds (at most two), the goal for the stars of "Go on" (`useTaskProgress`), the end with its stars, German and English words.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import useTaskProgress from '@/use/useTaskProgress'
import { partialStars } from '@/utils/adventureScore'
import type { LightGame, OrderGame, WaterGame } from '@/types/adventure'

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
/** Tap a piece (a press and a release without moving chooses it), as the game's second way to move a piece. */
const choose = async (el: Element) => {
  el.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 5, clientY: 5 }))
  window.dispatchEvent(new MouseEvent('pointerup', { clientX: 5, clientY: 5 }))
  await flushPromises()
}

// ---------------------------------------------------------------- put in order
describe('Reihenfolge legen (order)', () => {
  const game: OrderGame = {
    cards: [
      { id: 'a', image: 'images/x/a.webp', label: 'Das Licht' },
      { id: 'b', image: 'images/x/b.webp', label: 'Der Himmel' },
      { id: 'c', image: 'images/x/c.webp', label: 'Das Land' },
      { id: 'd', image: 'images/x/d.webp', label: 'Die Pflanzen' }
    ],
    rounds: [
      { hint: 'Runde eins: Lege die Bilder der Reihe nach.', numbered: true, cards: ['a', 'b', 'd'] },
      { hint: 'Runde zwei: ohne Punkte.', numbered: false, cards: ['a', 'b', 'c', 'd'] }
    ]
  }
  const mount1 = async (locale: 'de' | 'en' = 'de') => {
    const { default: Order } = await import('@/components/molecules/games/GameOrder.vue')
    const w = mount(Order, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  const cardEl = (w: ReturnType<typeof mount>, label: string) => w.findAll('.od-card').find((c) => c.attributes('aria-label')!.includes(label))!
  const slotEl = (w: ReturnType<typeof mount>, n: number) => w.findAll('.od-slot')[n - 1]!
  /** Lay one card on one place the tap-tap way. */
  const lay = async (w: ReturnType<typeof mount>, label: string, slot: number) => {
    await choose(cardEl(w, label).element)
    await slotEl(w, slot).trigger('click')
    await flushPromises()
  }

  it('round 1: three cards, three places with dots; the cards are mixed (never in the right order); two rounds at most', async () => {
    expect(game.rounds.length).toBeLessThanOrEqual(2)
    const w = await mount1()
    expect(w.findAll('.od-slot')).toHaveLength(3)
    expect(w.findAll('.od-card')).toHaveLength(3)
    expect(w.findAll('.od-slot').map((s) => s.findAll('.od-dot').length)).toEqual([1, 2, 3])
    const order = w.findAll('.od-card').map((c) => c.attributes('aria-label'))
    expect(order).not.toEqual(['Bild: Das Licht', 'Bild: Der Himmel', 'Bild: Die Pflanzen'])
    expect(w.find('.od-round').text()).toContain('Runde 1 von 2')
    expect(w.find('.od-hint').text()).toContain('Runde eins')
    expect(useTaskProgress().goal.value).toBe(7)
    expect(problems()).toEqual([])
  })

  it('a card stays on its right place (tick, snap tone, one part counted); a wrong place is a mistake: cross, the card stays in the tray', async () => {
    const w = await mount1()
    await lay(w, 'Das Licht', 2)
    expect(slotEl(w, 2).find('.gm.bad').exists()).toBe(true)
    expect(w.findAll('.od-card')).toHaveLength(3)
    expect(w.find('.od-fb').text()).toBe('Das kommt an eine andere Stelle.')
    expect(played).toContain('wrong')
    expect(useTaskProgress().parts.value).toBe(0)
    await tick(1000)
    await lay(w, 'Das Licht', 1)
    expect(slotEl(w, 1).find('.gm.good').exists()).toBe(true)
    expect(slotEl(w, 1).classes()).toContain('filled')
    expect(w.findAll('.od-card')).toHaveLength(2)
    expect(played).toContain('snap')
    expect(useTaskProgress().parts.value).toBe(1)
    // a taken place does not take a second card and costs nothing
    await lay(w, 'Der Himmel', 1)
    expect(w.findAll('.od-card')).toHaveLength(2)
    expect(slotEl(w, 1).find('.gm.bad').exists()).toBe(false)
  })

  it('every place and card has a name for screen readers; a filled place says which card lies there', async () => {
    const w = await mount1()
    expect(slotEl(w, 3).attributes('aria-label')).toBe('Platz 3')
    expect(cardEl(w, 'Die Pflanzen').attributes('aria-label')).toBe('Bild: Die Pflanzen')
    await lay(w, 'Das Licht', 1)
    expect(slotEl(w, 1).attributes('aria-label')).toBe('Platz 1: Das Licht')
  })

  it('after two wrong tries with a card its right place glows softly', async () => {
    const w = await mount1()
    await lay(w, 'Der Himmel', 3)
    await tick(1000)
    expect(slotEl(w, 2).classes()).not.toContain('glow')
    await lay(w, 'Der Himmel', 1)
    await tick(1000)
    expect(slotEl(w, 2).classes()).toContain('glow')
  })

  it('all the way through: round 2 has four places without dots; a clean game is three stars, the numbers in the English words', async () => {
    const w = await mount1()
    await lay(w, 'Das Licht', 1)
    await lay(w, 'Der Himmel', 2)
    await lay(w, 'Die Pflanzen', 3)
    await tick(1600)
    expect(w.find('.od-round').text()).toContain('Runde 2 von 2')
    expect(w.findAll('.od-slot')).toHaveLength(4)
    expect(w.findAll('.od-dot')).toHaveLength(0)
    expect(w.find('.od-hint').text()).toContain('Runde zwei')
    await lay(w, 'Das Licht', 1)
    await lay(w, 'Der Himmel', 2)
    await lay(w, 'Das Land', 3)
    await lay(w, 'Die Pflanzen', 4)
    await tick(800)
    expect(useTaskProgress().parts.value).toBe(7)
    expect(useTaskProgress().finished.value).toBe(true)
    expect(w.text()).toContain('Die Geschichte ist in der richtigen Reihenfolge!')
    expect(w.findAll('.gd-stars [aria-label="3 / 3"], [aria-label="3 / 3"]').length).toBeGreaterThan(0)
    await w.find('.gd button').trigger('click')
    expect(w.emitted('done')).toEqual([[3]])
    expect(problems()).toEqual([])
  })

  it('mistakes cost stars: three mistakes two stars, six mistakes one star', async () => {
    for (const [mistakes, stars] of [[3, 2], [6, 1]] as const) {
      useTaskProgress().reset()
      const w = await mount1()
      for (let i = 0; i < mistakes; i++) {
        await lay(w, 'Das Licht', 2)
        await tick(1000)
      }
      await lay(w, 'Das Licht', 1)
      await lay(w, 'Der Himmel', 2)
      await lay(w, 'Die Pflanzen', 3)
      await tick(1600)
      await lay(w, 'Das Licht', 1)
      await lay(w, 'Der Himmel', 2)
      await lay(w, 'Das Land', 3)
      await lay(w, 'Die Pflanzen', 4)
      await tick(800)
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${mistakes} mistakes`).toEqual([[stars]])
      w.unmount()
    }
  })

  it('the steps of "Go on": 3 of 7 cards one star, 5 two stars, fewer none (skipping earns nothing)', () => {
    expect([0, 1, 2, 3, 4, 5, 6].map((d) => partialStars(d, 7))).toEqual([0, 0, 0, 1, 1, 2, 2])
  })

  it('English: the words of the game', async () => {
    const w = await mount1('en')
    expect(w.find('.od-round').text()).toBe('Round 1 of 2')
    expect(slotEl(w, 1).attributes('aria-label')).toBe('Place 1')
    await lay(w, 'Der Himmel', 3)
    expect(w.find('.od-fb').text()).toBe('That one comes at a different place.')
  })
})

// ---------------------------------------------------------------- fill and water
describe('Füllen und Gießen (water)', () => {
  const game: WaterGame = {
    scene: 'images/x/garten.webp',
    river: { x: 2, y: 20, w: 20, h: 50 },
    jugEmpty: 'images/x/krug-leer.webp',
    jugFull: 'images/x/krug-voll.webp',
    plants: [
      { id: 'blume', small: 'images/x/blume-klein.webp', grown: 'images/x/blume-gross.webp', label: 'Blume', x: 40, y: 60, w: 14, need: 1 },
      { id: 'rebe', small: 'images/x/rebe-klein.webp', grown: 'images/x/rebe-gross.webp', label: 'Weinrebe', x: 60, y: 62, w: 16, need: 1 },
      { id: 'feige', small: 'images/x/feige-klein.webp', grown: 'images/x/feige-gross.webp', label: 'Feigenbaum', x: 78, y: 70, w: 20, need: 2 }
    ],
    rounds: [
      { hint: 'Fülle den Krug am Strom und gieße die Pflanzen.', plants: ['blume', 'rebe'] },
      { hint: 'Die Bäume sind durstiger: zwei Krüge.', plants: ['blume', 'feige'] }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    const { default: Water } = await import('@/components/molecules/games/GameWater.vue')
    const w = mount(Water, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  const river = (w: ReturnType<typeof mount>) => w.find('.wt-river')
  const plant = (w: ReturnType<typeof mount>, name: string) => w.findAll('.wt-plant').find((p) => p.attributes('aria-label')!.includes(name))!
  const jug = (w: ReturnType<typeof mount>) => w.find('.wt-jug')
  /** Fill the jug at the stream and water a plant. */
  const water = async (w: ReturnType<typeof mount>, name: string) => {
    await river(w).trigger('click')
    await plant(w, name).trigger('click')
    await flushPromises()
  }

  it('round 1: the stream, an empty jug and two small plants; two rounds at most; the goal is the number of jugs (2 + 1 + 2 = 5)', async () => {
    expect(game.rounds.length).toBeLessThanOrEqual(2)
    const w = await open()
    expect(w.findAll('.wt-plant')).toHaveLength(2)
    expect(jug(w).attributes('aria-label')).toBe('Der Krug, leer')
    expect(plant(w, 'Blume').attributes('aria-label')).toBe('Pflanze: Blume, noch klein')
    expect(river(w).attributes('aria-label')).toBe('Der Strom: den Krug füllen')
    expect(w.find('.wt-round').text()).toContain('Runde 1 von 2')
    expect(useTaskProgress().goal.value).toBe(1 + 1 + 1 + 2)
    expect(problems()).toEqual([])
  })

  it('the stream fills the jug; a plant that is watered grows and the jug is empty again', async () => {
    const w = await open()
    await river(w).trigger('click')
    expect(jug(w).attributes('aria-label')).toBe('Der Krug, voll Wasser')
    expect(jug(w).find('img').attributes('src')).toContain('krug-voll')
    await plant(w, 'Blume').trigger('click')
    expect(plant(w, 'Blume').attributes('aria-label')).toBe('Pflanze: Blume, gewachsen')
    expect(plant(w, 'Blume').find('img').attributes('src')).toContain('blume-gross')
    expect(plant(w, 'Blume').find('.gm.good').exists()).toBe(true)
    expect(jug(w).attributes('aria-label')).toBe('Der Krug, leer')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(played).toEqual(expect.arrayContaining(['basket', 'right']))
  })

  it('an empty jug at a plant is a mistake ("fill it at the stream first"); a plant that has had enough is a mistake, too; nothing is counted', async () => {
    const w = await open()
    await plant(w, 'Weinrebe').trigger('click')
    expect(plant(w, 'Weinrebe').find('.gm.bad').exists()).toBe(true)
    expect(w.find('.wt-fb').text()).toBe('Fülle den Krug zuerst am Strom.')
    expect(useTaskProgress().parts.value).toBe(0)
    await tick(1000)
    await water(w, 'Blume')
    await tick(1000)
    await river(w).trigger('click')
    await plant(w, 'Blume').trigger('click')
    expect(w.find('.wt-fb').text()).toBe('Diese Pflanze hat genug getrunken.')
    expect(useTaskProgress().parts.value).toBe(1)
    // the jug stays full after a wrong pour
    expect(jug(w).attributes('aria-label')).toBe('Der Krug, voll Wasser')
  })

  it('the thirsty tree needs two jugs: after the first it stays small with one drop filled', async () => {
    const w = await open()
    await water(w, 'Blume')
    await water(w, 'Weinrebe')
    await tick(2000)
    expect(w.find('.wt-round').text()).toContain('Runde 2 von 2')
    expect(w.findAll('.wt-plant')).toHaveLength(2)
    await water(w, 'Feigenbaum')
    expect(plant(w, 'Feigenbaum').attributes('aria-label')).toBe('Pflanze: Feigenbaum, noch klein')
    expect(plant(w, 'Feigenbaum').findAll('.wt-drop.on')).toHaveLength(1)
    expect(plant(w, 'Feigenbaum').findAll('.wt-drop')).toHaveLength(2)
    expect(w.find('.wt-fb').text()).toContain('noch einen Krug')
    await tick(1000)
    await water(w, 'Feigenbaum')
    expect(plant(w, 'Feigenbaum').attributes('aria-label')).toBe('Pflanze: Feigenbaum, gewachsen')
  })

  it('all the way through: a clean game is three stars; mistakes cost stars (three: two, six: one)', async () => {
    for (const [mistakes, stars] of [[0, 3], [3, 2], [6, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      for (let i = 0; i < mistakes; i++) {
        await plant(w, 'Weinrebe').trigger('click')
        await tick(1000)
      }
      await water(w, 'Blume')
      await water(w, 'Weinrebe')
      await tick(2000)
      await water(w, 'Blume')
      await water(w, 'Feigenbaum')
      await water(w, 'Feigenbaum')
      await tick(1200)
      expect(useTaskProgress().parts.value, `${mistakes} mistakes`).toBe(5)
      expect(useTaskProgress().finished.value).toBe(true)
      expect(w.text()).toContain('Der ganze Garten grünt und blüht!')
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${mistakes} mistakes`).toEqual([[stars]])
      w.unmount()
    }
  })

  it('English: the words of the game', async () => {
    const w = await open('en')
    expect(w.find('.wt-round').text()).toBe('Round 1 of 2')
    expect(jug(w).attributes('aria-label')).toBe('The jug, empty')
    await plant(w, 'Weinrebe').trigger('click')
    expect(w.find('.wt-fb').text()).toBe('Fill the jug at the stream first.')
  })
})

// ---------------------------------------------------------------- collect the lights
describe('Lichter sammeln (lights)', () => {
  const game: LightGame = {
    scene: 'images/x/nacht.webp',
    light: 'images/x/licht.webp',
    rounds: [
      {
        hint: 'Tippe die Lichter an, eins nach dem anderen.',
        spots: [
          { x: 20, y: 30, w: 14 },
          { x: 70, y: 25, w: 14 },
          { x: 45, y: 60, w: 14 }
        ]
      },
      {
        hint: 'Jetzt leuchten mehrere zugleich.',
        together: 3,
        spots: [
          { x: 15, y: 20, w: 10 },
          { x: 50, y: 15, w: 10 },
          { x: 85, y: 22, w: 10 },
          { x: 30, y: 70, w: 10 }
        ]
      }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    const { default: Lights } = await import('@/components/molecules/games/GameLights.vue')
    const w = mount(Lights, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  const lights = (w: ReturnType<typeof mount>) => w.findAll('.lt-light')
  const dark = (w: ReturnType<typeof mount>) => Number(w.find('.lt-dark').attributes('style')!.match(/opacity:\s*([\d.]+)/)![1])
  /** Tap every light that shines, until none is left (the next ones appear after a moment). */
  const collectRound = async (w: ReturnType<typeof mount>, n: number) => {
    for (let k = 0; k < n; k++) {
      await lights(w)[0]!.trigger('click')
      await tick(700)
    }
  }

  it('round 1: one light shines, the picture is dark; the goal is the number of all the lights (3 + 4 = 7); two rounds at most', async () => {
    expect(game.rounds.length).toBeLessThanOrEqual(2)
    const w = await open()
    expect(lights(w)).toHaveLength(1)
    expect(dark(w)).toBeCloseTo(0.8, 2)
    expect(w.find('.lt-round').text()).toContain('Runde 1 von 2')
    expect(w.find('.lt-count').text()).toBe('Lichter: 0 von 7')
    expect(useTaskProgress().goal.value).toBe(7)
    expect(lights(w)[0]!.attributes('aria-label')).toBe('Ein Licht')
    expect(problems()).toEqual([])
  })

  it('a light that is tapped is collected (a part counted), the next one appears after a moment, the picture gets brighter', async () => {
    const w = await open()
    await lights(w)[0]!.trigger('click')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(lights(w)).toHaveLength(0)
    expect(played).toContain('found')
    await tick(700)
    expect(lights(w)).toHaveLength(1)
    expect(dark(w)).toBeCloseTo(0.8 * (1 - 1 / 7), 2)
    expect(w.find('.lt-count').text()).toBe('Lichter: 1 von 7')
  })

  it('a tap beside the lights is a small slip (a faint ring, no mistake message, nothing is lost)', async () => {
    const w = await open()
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, right: 300, bottom: 400, width: 300, height: 400, x: 0, y: 0, toJSON: () => ({}) })
    await w.find('.lt-field').trigger('click', { clientX: 40, clientY: 40 })
    expect(w.find('.lt-ring').exists()).toBe(true)
    expect(lights(w)).toHaveLength(1)
    expect(useTaskProgress().parts.value).toBe(0)
    await tick(800)
    expect(w.find('.lt-ring').exists()).toBe(false)
  })

  it('round 2: several lights shine at once; all the way through the picture is bright and a game with few slips is three stars', async () => {
    const w = await open()
    await collectRound(w, 3)
    await tick(1600)
    expect(w.find('.lt-round').text()).toContain('Runde 2 von 2')
    expect(lights(w)).toHaveLength(3)
    expect(w.find('.lt-hint').text()).toContain('mehrere zugleich')
    await collectRound(w, 4)
    await tick(1200)
    expect(useTaskProgress().parts.value).toBe(7)
    expect(useTaskProgress().finished.value).toBe(true)
    expect(w.text()).toContain('Es ist wieder hell!')
    await w.find('.gd button').trigger('click')
    expect(w.emitted('done')).toEqual([[3]])
    expect(problems()).toEqual([])
  })

  it('slips cost stars only after a few: three slips still three stars, four two stars, nine one star', async () => {
    for (const [slips, stars] of [[3, 3], [4, 2], [9, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      for (let i = 0; i < slips; i++) await w.find('.lt-field').trigger('click', { clientX: 30, clientY: 30 })
      await collectRound(w, 3)
      await tick(1600)
      await collectRound(w, 4)
      await tick(1200)
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${slips} slips`).toEqual([[stars]])
      w.unmount()
    }
  })

  it('the steps of "Go on": 7 lights: 3 collected one star, 5 two stars, fewer none', () => {
    expect([2, 3, 4, 5].map((d) => partialStars(d, 7))).toEqual([0, 1, 1, 2])
  })

  it('English: the words of the game', async () => {
    const w = await open('en')
    expect(w.find('.lt-round').text()).toBe('Round 1 of 2')
    expect(w.find('.lt-count').text()).toBe('Lights: 0 of 7')
    expect(lights(w)[0]!.attributes('aria-label')).toBe('A light')
  })
})
