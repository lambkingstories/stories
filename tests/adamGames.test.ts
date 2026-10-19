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
import { CHANNEL_GRID_1, CHANNEL_GRID_2 } from '@/data/adventures/adamEvaChannels'
import { flow, goalsOf, solve } from '@/utils/channels'
import { landing, pullFor } from '@/utils/sow'
import type { ChannelGame, EchoGame, HerdGame, LightGame, MirrorGame, OrderGame, SowGame, VerseGame, WaterGame } from '@/types/adventure'

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
    glow: 'images/x/glow.webp',
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
          { x: 85, y: 22, w: 10, cloud: 'images/x/wolke-1.webp' },
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

  it('a light behind a cloud: the cloud lies over it, the light is still tapped (through the cloud)', async () => {
    const w = await open()
    await collectRound(w, 3)
    await tick(1600)
    expect(w.findAll('.lt-cloud')).toHaveLength(1)
    expect(w.find('.lt-cloud').attributes('src')).toContain('wolke-1')
    const withCloud = lights(w).find((l) => l.find('.lt-cloud').exists())!
    await withCloud.trigger('click')
    expect(useTaskProgress().parts.value).toBe(4)
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

// ---------------------------------------------------------------- the verse with a gap
describe('Lückenvers (verse)', () => {
  const game: VerseGame = {
    scene: 'images/x/lichtung.webp',
    board: 'images/x/tafel.webp',
    leaf: 'images/x/blatt.webp',
    rounds: [
      {
        hint: 'Ziehe das passende Blatt in die Lücke.',
        words: ['Namen', 'Futter', 'Stall', 'nennte', 'kleidete'],
        verses: [
          { parts: ['Der Mensch gab jedem Tier seinen ', '.'], answers: [0] },
          { parts: ['Gott brachte sie zu dem Menschen, dass er sähe, wie er sie ', '.'], answers: [3] }
        ]
      },
      {
        hint: 'Jetzt fehlen zwei Wörter.',
        words: ['Vieh', 'Vogel', 'Fisch', 'allein', 'Gehilfin', 'Hütte'],
        verses: [
          { parts: ['Der Mensch gab jedem ', ' und ', ' einen Namen.'], answers: [0, 1] },
          { parts: ['Es ist nicht gut, dass der Mensch ', ' sei; ich will ihm eine ', ' machen.'], answers: [3, 4] }
        ]
      }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    const { default: Verse } = await import('@/components/molecules/games/GameVerse.vue')
    const w = mount(Verse, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  const leaf = (w: ReturnType<typeof mount>, word: string) => w.findAll('.vs-leaf').find((l) => l.text() === word)!
  const gaps = (w: ReturnType<typeof mount>) => w.findAll('.vs-gap')
  /** Tap a leaf, then a gap (the second way to move a leaf). */
  const put = async (w: ReturnType<typeof mount>, word: string, gap: number) => {
    await choose(leaf(w, word).element)
    await gaps(w)[gap]!.trigger('click')
    await flushPromises()
  }

  it('round 1: two verses with one gap each and the leaves with their words; the goal is the number of all gaps (1+1+2+2 = 6); two rounds at most', async () => {
    expect(game.rounds.length).toBeLessThanOrEqual(2)
    for (const r of game.rounds) for (const v of r.verses) expect(v.parts.length).toBe(v.answers.length + 1)
    const w = await open()
    expect(gaps(w)).toHaveLength(2)
    expect(w.findAll('.vs-leaf')).toHaveLength(5)
    expect(w.find('.vs-round').text()).toContain('Runde 1 von 2')
    expect(w.findAll('.vs-text')[0]!.text()).toContain('Der Mensch gab jedem Tier seinen')
    expect(useTaskProgress().goal.value).toBe(6)
    expect(gaps(w)[0]!.attributes('aria-label')).toBe('Lücke 1')
    expect(leaf(w, 'Namen').attributes('aria-label')).toBe('Blatt: Namen')
    expect(problems()).toEqual([])
  })

  it('the right word stays in the gap (tick, one part counted, the leaf is used up); a wrong word is a mistake and the leaf stays on the branch', async () => {
    const w = await open()
    await put(w, 'Futter', 0)
    expect(gaps(w)[0]!.find('.gm.bad').exists()).toBe(true)
    expect(w.find('.vs-fb').text()).toBe('Dieses Wort passt hier nicht.')
    expect(w.findAll('.vs-leaf')).toHaveLength(5)
    expect(useTaskProgress().parts.value).toBe(0)
    expect(played).toContain('wrong')
    await tick(1000)
    await put(w, 'Namen', 0)
    expect(gaps(w)[0]!.text()).toContain('Namen')
    expect(gaps(w)[0]!.classes()).toContain('filled')
    expect(gaps(w)[0]!.attributes('aria-label')).toBe('Lücke: Namen')
    expect(w.findAll('.vs-leaf')).toHaveLength(4)
    expect(useTaskProgress().parts.value).toBe(1)
    // a word that belongs to the other verse does not fit here, either
    await put(w, 'kleidete', 1)
    expect(gaps(w)[1]!.find('.gm.bad').exists()).toBe(true)
  })

  it('all the way through: round 2 has verses with two gaps each; a clean game is three stars; mistakes cost stars', async () => {
    for (const [mistakes, stars] of [[0, 3], [3, 2], [6, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      for (let i = 0; i < mistakes; i++) {
        await put(w, 'Stall', 0)
        await tick(1000)
      }
      await put(w, 'Namen', 0)
      await put(w, 'nennte', 1)
      await tick(1700)
      expect(w.find('.vs-round').text()).toContain('Runde 2 von 2')
      expect(gaps(w)).toHaveLength(4)
      await put(w, 'Vieh', 0)
      await put(w, 'Vogel', 1)
      await put(w, 'allein', 2)
      await put(w, 'Gehilfin', 3)
      await tick(1200)
      expect(useTaskProgress().parts.value, `${mistakes} mistakes`).toBe(6)
      expect(useTaskProgress().finished.value).toBe(true)
      expect(w.text()).toContain('Jeder Vers ist wieder ganz!')
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${mistakes} mistakes`).toEqual([[stars]])
      w.unmount()
    }
  })

  it('the gaps can be filled in any order, and the steps of "Go on" for 6 gaps: 2 gaps one star, 4 two stars, one gap nothing', () => {
    expect([1, 2, 3, 4, 5].map((d) => partialStars(d, 6))).toEqual([0, 1, 1, 2, 2])
  })

  it('English: the words of the game', async () => {
    const w = await open('en')
    expect(w.find('.vs-round').text()).toBe('Round 1 of 2')
    expect(gaps(w)[0]!.attributes('aria-label')).toBe('Gap 1')
    await put(w, 'Futter', 0)
    expect(w.find('.vs-fb').text()).toBe('That word does not fit here.')
  })
})

// ---------------------------------------------------------------- call and answer
describe('Ruf und Antwort (echo)', () => {
  const RATES = [1, 1.1225, 1.2599, 1.4983]
  const game: EchoGame = {
    scene: 'images/x/abend.webp',
    notes: RATES.map((rate, i) => ({ id: `n${i}`, image: `images/x/bluete-${i + 1}.webp`, imageOn: `images/x/bluete-${i + 1}-an.webp`, rate })),
    rounds: [
      { hint: 'Hör gut zu und antworte mit denselben Klängen.', calls: [[0, 1, 2], [1, 0, 2], [2, 1, 0]] },
      { hint: 'Jetzt etwas länger.', calls: [[0, 1, 2, 3], [3, 2, 1, 0], [1, 3, 0, 2]] }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    const { default: Echo } = await import('@/components/molecules/games/GameEcho.vue')
    const w = mount(Echo, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  const note = (w: ReturnType<typeof mount>, i: number) => w.findAll('.ec-note')[i]!
  const again = (w: ReturnType<typeof mount>, label = 'Nochmal hören') => w.findAll('button').find((b) => b.text() === label)!
  /** Wait until the call has rung (the blossoms shine one after the other, 750 ms apart) and the child is asked to answer. */
  const heardCall = async (w: ReturnType<typeof mount>, _n: number, text = 'Jetzt du: Spiel es nach.') => {
    for (let waited = 0; waited < 9000 && w.find('.ec-fb').text() !== text; waited += 250) await tick(250)
    expect(w.find('.ec-fb').text(), 'the child is asked to answer').toBe(text)
  }
  const answer = async (w: ReturnType<typeof mount>, call: number[]) => {
    for (const i of call) await note(w, i).trigger('click')
    await flushPromises()
  }

  it('the call rings and shines: the blossoms light up in order with their own tones; the answer is only possible afterwards; the goal is 6 calls; two rounds at most', async () => {
    expect(game.rounds.length).toBeLessThanOrEqual(2)
    expect(game.notes).toHaveLength(4)
    for (const r of game.rounds) for (const c of r.calls) for (const i of c) expect(i >= 0 && i < 4).toBe(true)
    const w = await open()
    expect(w.find('.ec-round').text()).toContain('Runde 1 von 2')
    expect(w.find('.ec-hint').text()).toContain('antworte mit denselben Klängen')
    expect(useTaskProgress().goal.value).toBe(6)
    // while it rings the blossoms cannot be answered with
    expect(w.findAll('.ec-note').every((b) => b.attributes('disabled') !== undefined)).toBe(true)
    await tick(400)
    expect(w.find('.ec-fb').text()).toBe('Hör gut zu ...')
    // the first blossom shines at 300 ms, the next ones every 750 ms
    expect(note(w, 0).classes()).toContain('lit')
    expect(note(w, 0).find('img').attributes('src')).toContain('bluete-1-an')
    await tick(750)
    expect(note(w, 1).classes()).toContain('lit')
    expect(note(w, 0).classes()).not.toContain('lit')
    await tick(750)
    expect(note(w, 2).classes()).toContain('lit')
    await tick(1000)
    expect(played.filter((p) => p === 'bead')).toHaveLength(3)
    expect(w.findAll('.ec-note').every((b) => b.attributes('disabled') === undefined)).toBe(true)
    expect(note(w, 3).attributes('aria-label')).toBe('Blüte 4')
    expect(problems()).toEqual([])
  })

  it('the right answer lights the blossoms and counts one call; a wrong blossom is a mistake and the call is played again', async () => {
    const w = await open()
    await heardCall(w, 3)
    await note(w, 2).trigger('click')
    expect(note(w, 2).find('.gm.bad').exists()).toBe(true)
    expect(w.find('.ec-fb').text()).toBe('Nicht diese. Hör noch einmal zu.')
    expect(played).toContain('wrong')
    expect(useTaskProgress().parts.value).toBe(0)
    // the call is played again by itself
    await heardCall(w, 3)
    await answer(w, [0, 1, 2])
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.find('.ec-fb').text()).toBe('Richtig!')
    expect(w.findAll('.ec-step.on')).toHaveLength(3)
  })

  it('"Listen again" plays the call once more and costs nothing; it is a pill button and only offered while the child may answer', async () => {
    const w = await open()
    expect(again(w).attributes('disabled')).toBeDefined()
    await heardCall(w, 3)
    expect(again(w).attributes('disabled')).toBeUndefined()
    await note(w, 0).trigger('click')
    await again(w).trigger('click')
    expect(w.find('.ec-fb').text()).toBe('Hör gut zu ...')
    await heardCall(w, 3)
    await answer(w, [0, 1, 2])
    expect(useTaskProgress().parts.value).toBe(1)
    expect((again(w).element as HTMLElement).className).toContain('lk-btn')
  })

  it('all the way through: round 2 has longer calls; a clean game is three stars; mistakes cost stars (three: two, six: one)', async () => {
    for (const [mistakes, stars] of [[0, 3], [3, 2], [6, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      await heardCall(w, 3)
      for (let i = 0; i < mistakes; i++) {
        await note(w, 3).trigger('click')
        await heardCall(w, 3)
      }
      await answer(w, [0, 1, 2])
      for (const call of [[1, 0, 2], [2, 1, 0]]) {
        await heardCall(w, 3)
        await answer(w, call)
      }
      await tick(3200)
      expect(w.find('.ec-round').text()).toContain('Runde 2 von 2')
      for (const call of game.rounds[1]!.calls) {
        await heardCall(w, 4)
        await answer(w, call)
      }
      await tick(1500)
      expect(useTaskProgress().parts.value, `${mistakes} mistakes`).toBe(6)
      expect(useTaskProgress().finished.value).toBe(true)
      expect(w.text()).toContain('Du hast jeden Ruf gehört und beantwortet!')
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${mistakes} mistakes`).toEqual([[stars]])
      w.unmount()
    }
  })

  it('the steps of "Go on" for 6 calls: 2 calls one star, 4 calls two stars', () => {
    expect([1, 2, 3, 4, 5].map((d) => partialStars(d, 6))).toEqual([0, 1, 1, 2, 2])
  })

  it('English: the words of the game', async () => {
    const w = await open('en')
    expect(w.find('.ec-round').text()).toBe('Round 1 of 2')
    await tick(400)
    expect(w.find('.ec-fb').text()).toBe('Listen closely ...')
    await heardCall(w, 3, 'Now you: play it back.')
    expect(again(w, 'Listen again')).toBeTruthy()
  })
})

// ---------------------------------------------------------------- turn the channels
describe('Kanäle drehen (channels)', () => {
  const pic = (n: string) => `images/x/${n}.webp`
  const kinds = ['straight', 'corner', 'tee', 'cross', 'empty', 'source', 'goal'] as const
  const game: ChannelGame = {
    tiles: Object.fromEntries(kinds.map((k) => [k, pic(`${k}-trocken`)])) as ChannelGame['tiles'],
    wet: Object.fromEntries(kinds.map((k) => [k, pic(`${k}-nass`)])) as ChannelGame['wet'],
    goals: Object.fromEntries(
      ['feige', 'dattel', 'granatapfel', 'wein', 'olive', 'blumen'].map((id) => [id, { label: id[0]!.toUpperCase() + id.slice(1), wilted: pic(`${id}-welk`), bloom: pic(`${id}-bluete`) }])
    ),
    rounds: [
      { hint: 'Drehe die Stücke, bis das Wasser die Pflanzen erreicht.', grid: CHANNEL_GRID_1 },
      { hint: 'Der Strom teilt sich in vier Arme.', grid: CHANNEL_GRID_2 }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    const { default: Channels } = await import('@/components/molecules/games/GameChannels.vue')
    const w = mount(Channels, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  const tile = (w: ReturnType<typeof mount>, r: number, c: number, cols: number) => w.findAll('.ch-tile')[r * cols + c]!
  /** Turn a tile n quarters. */
  const turn = async (w: ReturnType<typeof mount>, r: number, c: number, cols: number, n: number) => {
    for (let i = 0; i < n; i++) await tile(w, r, c, cols).trigger('click')
    await flushPromises()
  }

  it('both gardens can be solved, nothing reaches a plant at the start, the plants are the garden plants of the stage (no tree of life or of knowledge), two rounds at most', () => {
    expect(game.rounds.length).toBeLessThanOrEqual(2)
    const goalIds = game.rounds.flatMap((r) => r.grid.flat().filter((t) => t.kind === 'goal').map((t) => t.goal!))
    expect(goalIds).toEqual(['feige', 'dattel', 'granatapfel', 'wein', 'olive', 'blumen'])
    expect(goalIds.every((g) => game.goals[g])).toBe(true)
    expect(goalIds.join(' ')).not.toMatch(/leben|erkenntnis|baum/i)
    for (const r of game.rounds) {
      expect(flow(r.grid).reached, 'nothing is wet at the start').toEqual([])
      const sol = solve(r.grid)
      expect(sol, 'the garden has a solution').toBeTruthy()
      const solved = r.grid.map((row, i) => row.map((t, c) => ({ ...t, rot: sol![i]![c]! })))
      expect(flow(solved).reached.length).toBe(goalsOf(r.grid))
    }
    expect(game.rounds.map((r) => goalsOf(r.grid))).toEqual([2, 4])
    // the whole search is quick
    const t0 = Date.now()
    solve(CHANNEL_GRID_2)
    expect(Date.now() - t0).toBeLessThan(500)
  })

  it('round 1: a 4 x 3 garden; the goal is the number of plants (2 + 4 = 6); only turnable pieces can be tapped', async () => {
    const w = await open()
    expect(w.findAll('.ch-tile')).toHaveLength(12)
    expect(w.find('.ch-round').text()).toContain('Runde 1 von 2')
    expect(useTaskProgress().goal.value).toBe(6)
    expect(tile(w, 1, 0, 4).attributes('disabled')).toBeDefined()
    expect(tile(w, 1, 0, 4).attributes('aria-label')).toBe('Der Strom')
    expect(tile(w, 1, 1, 4).attributes('aria-label')).toBe('Kanalstück, Reihe 2, Spalte 2: drehen')
    expect(tile(w, 0, 3, 4).attributes('aria-label')).toBe('Pflanze: Feige, noch welk')
    expect(tile(w, 0, 3, 4).attributes('disabled')).toBeDefined()
    expect(problems()).toEqual([])
  })

  it('turning a piece turns its picture a quarter; when the way is whole the water flows (wet pictures), the plant blooms and a part is counted', async () => {
    const w = await open()
    expect(tile(w, 1, 1, 4).find('.ch-base').attributes('style')).toContain('rotate(90deg)')
    expect(tile(w, 1, 1, 4).find('img').attributes('src')).toContain('tee-trocken')
    // one quarter on: the fork opens to the stream (left), so it is wet already
    await turn(w, 1, 1, 4, 1)
    expect(tile(w, 1, 1, 4).find('.ch-base').attributes('style')).toContain('rotate(180deg)')
    expect(tile(w, 1, 1, 4).find('img').attributes('src')).toContain('tee-nass')
    // tee to 0, the corner above to 1, the straight pieces to 0
    await turn(w, 1, 1, 4, 2)
    await turn(w, 1, 2, 4, 1)
    expect(tile(w, 1, 3, 4).attributes('aria-label')).toBe('Pflanze: Dattel, blühend')
    expect(tile(w, 1, 3, 4).find('.ch-plant').attributes('src')).toContain('dattel-bluete')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.find('.ch-fb').text()).toBe('Das Wasser kommt an und die Pflanze blüht!')
    expect(played).toEqual(expect.arrayContaining(['tap', 'right']))
  })

  it('a plant that has bloomed stays in bloom and is counted once, whatever is turned afterwards', async () => {
    const w = await open()
    await turn(w, 1, 1, 4, 3)
    await turn(w, 1, 2, 4, 1)
    expect(useTaskProgress().parts.value).toBe(1)
    await turn(w, 1, 2, 4, 2)
    await turn(w, 1, 2, 4, 2)
    expect(useTaskProgress().parts.value).toBe(1)
    expect(tile(w, 1, 3, 4).find('.ch-plant').attributes('src')).toContain('dattel-bluete')
  })

  it('all the way through: round 2 is a 5 x 4 garden with four plants; with no hint it is three stars; hints take stars (one: two, two: one); no mistakes exist', async () => {
    for (const [hints, stars] of [[0, 3], [1, 2], [2, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      for (let i = 0; i < hints; i++) {
        await w.findAll('button').find((b) => b.text() === 'Tipp')!.trigger('click')
        expect(w.find('.ch-tile.hint').exists()).toBe(true)
      }
      // round 1: tee 3 turns (1 to 0), corner 1 (0 to 1), straight (0,2) 1, straight (1,2) 1
      await turn(w, 1, 1, 4, 3)
      await turn(w, 0, 1, 4, 1)
      await turn(w, 0, 2, 4, 1)
      await turn(w, 1, 2, 4, 1)
      await tick(2200)
      expect(w.find('.ch-round').text()).toContain('Runde 2 von 2')
      expect(w.findAll('.ch-tile')).toHaveLength(20)
      // round 2 (5 columns): the tees (1,1) 3 turns and (1,3) 2 turns, the corners and straights of the ways
      await turn(w, 1, 1, 5, 3)
      await turn(w, 0, 1, 5, 1)
      await turn(w, 0, 2, 5, 1)
      await turn(w, 0, 3, 5, 1)
      await turn(w, 1, 3, 5, 2)
      await turn(w, 2, 3, 5, 2)
      await turn(w, 2, 2, 5, 1)
      await turn(w, 3, 2, 5, 3)
      await turn(w, 3, 3, 5, 1)
      await tick(1800)
      expect(useTaskProgress().parts.value, `${hints} hints`).toBe(6)
      expect(useTaskProgress().finished.value).toBe(true)
      expect(w.text()).toContain('Der Strom bewässert den ganzen Garten!')
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${hints} hints`).toEqual([[stars]])
      w.unmount()
    }
  })

  it('the hint makes one piece that still has to be turned blink and goes away after a moment', async () => {
    const w = await open()
    await w.findAll('button').find((b) => b.text() === 'Tipp')!.trigger('click')
    const blinking = w.findAll('.ch-tile.hint')
    expect(blinking).toHaveLength(1)
    expect(blinking[0]!.attributes('aria-label')).toContain('Kanalstück')
    await tick(3000)
    expect(w.find('.ch-tile.hint').exists()).toBe(false)
  })

  it('the steps of "Go on" for 6 plants: 2 plants one star, 4 plants two stars', () => {
    expect([1, 2, 3, 4, 5].map((d) => partialStars(d, 6))).toEqual([0, 1, 1, 2, 2])
  })

  it('English: the words of the game', async () => {
    const w = await open('en')
    expect(w.find('.ch-round').text()).toBe('Round 1 of 2')
    expect(tile(w, 1, 0, 4).attributes('aria-label')).toBe('The stream')
    expect(w.findAll('button').some((b) => b.text() === 'Hint')).toBe(true)
  })
})

// ---------------------------------------------------------------- mirror the pattern
describe('Spiegeln (mirror)', () => {
  const game: MirrorGame = {
    scene: 'images/x/wiese.webp',
    empty: 'images/x/leer.webp',
    stones: [
      { id: 'rot', image: 'images/x/stein-rot.webp', label: 'roter Blütenstein' },
      { id: 'gelb', image: 'images/x/stein-gelb.webp', label: 'gelber Blütenstein' },
      { id: 'blau', image: 'images/x/stein-blau.webp', label: 'blauer Blütenstein' }
    ],
    rounds: [
      {
        hint: 'Ergänze die andere Seite, so dass beide Seiten zusammenpassen.',
        cols: 2,
        rows: 3,
        left: [
          ['rot', 'gelb'],
          ['gelb', 'gelb'],
          ['rot', 'rot']
        ]
      },
      {
        hint: 'Jetzt ein größeres Muster.',
        cols: 3,
        rows: 4,
        left: [
          ['rot', 'gelb', 'blau'],
          ['blau', 'rot', 'gelb'],
          ['gelb', 'blau', 'rot'],
          ['rot', 'rot', 'blau']
        ]
      }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    const { default: Mirror } = await import('@/components/molecules/games/GameMirror.vue')
    const w = mount(Mirror, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  const right = (w: ReturnType<typeof mount>) => w.findAll('.mr-cell.right')
  const stone = (w: ReturnType<typeof mount>, label: string) => w.findAll('.mr-stone').find((s) => s.attributes('aria-label')!.includes(label))!
  /** Choose a stone, then tap a field of the right bank (row r, column c, 0-based; `cols` fields per row). */
  const set = async (w: ReturnType<typeof mount>, label: string, r: number, c: number, cols: number) => {
    await choose(stone(w, label).element)
    await right(w)[r * cols + c]!.trigger('click')
    await flushPromises()
  }
  /** Lay the whole right bank of a round as its mirror image. */
  const complete = async (w: ReturnType<typeof mount>, round: MirrorGame['rounds'][number]) => {
    const names: Record<string, string> = { rot: 'roter', gelb: 'gelber', blau: 'blauer' }
    for (let r = 0; r < round.rows; r++) for (let c = 0; c < round.cols; c++) await set(w, names[round.left[r]![round.cols - 1 - c]!]!, r, c, round.cols)
  }

  it('round 1: a 2 x 3 pattern on the left, empty fields on the right, a row of three colours; the goal is the number of right-bank stones (6 + 12 = 18); two rounds at most', async () => {
    expect(game.rounds.length).toBeLessThanOrEqual(2)
    for (const r of game.rounds) {
      expect(r.left).toHaveLength(r.rows)
      for (const row of r.left) expect(row).toHaveLength(r.cols)
    }
    const w = await open()
    expect(w.findAll('.mr-cell.left')).toHaveLength(6)
    expect(right(w)).toHaveLength(6)
    expect(w.findAll('.mr-stone')).toHaveLength(2)
    expect(w.find('.mr-round').text()).toContain('Runde 1 von 2')
    expect(useTaskProgress().goal.value).toBe(18)
    expect(w.findAll('.mr-cell.left')[0]!.attributes('aria-label')).toBe('Linke Seite: roter Blütenstein')
    expect(right(w)[0]!.attributes('aria-label')).toBe('Rechte Seite, Reihe 1, Feld 1')
    expect(problems()).toEqual([])
  })

  it('the right bank is the mirror image: the first field of a row takes the last stone of the left row; a wrong colour is a mistake and the field stays empty', async () => {
    const w = await open()
    // the first row on the left is red, yellow: the right bank is yellow, red
    await set(w, 'roter', 0, 0, 2)
    expect(right(w)[0]!.find('.gm.bad').exists()).toBe(true)
    expect(right(w)[0]!.classes()).not.toContain('filled')
    expect(w.find('.mr-fb').text()).toBe('Der passt hier nicht. Schau auf die andere Seite.')
    expect(useTaskProgress().parts.value).toBe(0)
    expect(played).toContain('wrong')
    await tick(1000)
    await set(w, 'gelber', 0, 0, 2)
    expect(right(w)[0]!.classes()).toContain('filled')
    expect(right(w)[0]!.find('.gm.good').exists()).toBe(true)
    expect(right(w)[0]!.attributes('aria-label')).toBe('Rechte Seite: gelber Blütenstein')
    expect(useTaskProgress().parts.value).toBe(1)
    await set(w, 'roter', 0, 1, 2)
    expect(right(w)[1]!.classes()).toContain('filled')
    // a field that is filled does not take another stone and costs nothing
    await set(w, 'roter', 0, 0, 2)
    expect(right(w)[0]!.find('.gm.bad').exists()).toBe(false)
  })

  it('all the way through: round 2 is 3 x 4 with three colours; a clean game is three stars, three mistakes still three, four two, seven one', async () => {
    for (const [mistakes, stars] of [[0, 3], [3, 3], [4, 2], [7, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      for (let i = 0; i < mistakes; i++) {
        await set(w, 'roter', 0, 0, 2)
        await tick(1000)
      }
      await complete(w, game.rounds[0]!)
      await tick(1800)
      expect(w.find('.mr-round').text()).toContain('Runde 2 von 2')
      expect(right(w)).toHaveLength(12)
      expect(w.findAll('.mr-stone')).toHaveLength(3)
      await complete(w, game.rounds[1]!)
      await tick(1500)
      expect(useTaskProgress().parts.value, `${mistakes} mistakes`).toBe(18)
      expect(useTaskProgress().finished.value).toBe(true)
      expect(w.text()).toContain('Beide Seiten passen zusammen!')
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${mistakes} mistakes`).toEqual([[stars]])
      w.unmount()
    }
  })

  it('the steps of "Go on" for 18 stones: 6 one star, 12 two stars', () => {
    expect([5, 6, 11, 12].map((d) => partialStars(d, 18))).toEqual([0, 1, 1, 2])
  })

  it('English: the words of the game', async () => {
    const w = await open('en')
    expect(w.find('.mr-round').text()).toBe('Round 1 of 2')
    expect(right(w)[0]!.attributes('aria-label')).toBe('Right side, row 1, field 1')
    await set(w, 'roter', 0, 0, 2)
    expect(w.find('.mr-fb').text()).toBe('That one does not match here. Look at the other side.')
  })
})

// ---------------------------------------------------------------- sow the seeds
describe('Säen (sow)', () => {
  const game: SowGame = {
    field: 'images/x/acker.webp',
    bag: 'images/x/beutel.webp',
    seed: 'images/x/samen.webp',
    sprout: 'images/x/spross.webp',
    vane: 'images/x/fahne.webp',
    furrows: [
      { id: 'a', x: 30, y: 52, w: 34, h: 8 },
      { id: 'b', x: 70, y: 52, w: 34, h: 8 },
      { id: 'c', x: 30, y: 36, w: 34, h: 8 },
      { id: 'd', x: 70, y: 36, w: 34, h: 8 },
      { id: 'e', x: 30, y: 22, w: 34, h: 8 },
      { id: 'f', x: 70, y: 22, w: 34, h: 8 }
    ],
    rounds: [
      { hint: 'Ziehe den Beutel zurück und lass los.', furrows: ['a', 'b', 'c', 'd'], wind: 0 },
      { hint: 'Jetzt weht ein leichter Wind.', furrows: ['a', 'b', 'c', 'd', 'e', 'f'], wind: 0.5 }
    ]
  }
  const ORIGIN = { x: 50, y: 90 }
  const W = 300
  const H = 400
  const open = async (locale: 'de' | 'en' = 'de') => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, right: W, bottom: H, width: W, height: H, x: 0, y: 0, toJSON: () => ({}) })
    const { default: Sow } = await import('@/components/molecules/games/GameSow.vue')
    const w = mount(Sow, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  const furrow = (w: ReturnType<typeof mount>, i: number) => w.findAll('.sw-furrow')[i]!
  /** The pull (percent) that lands the seed on a point in spite of the wind (the drift is taken off in a few steps). */
  const pullTo = (target: { x: number; y: number }, wind: number) => {
    let aim = { ...target }
    let pull = pullFor(ORIGIN, aim)
    for (let i = 0; i < 40; i++) {
      const got = landing(ORIGIN, pull, wind)
      aim = { x: aim.x + (target.x - got.x), y: aim.y + (target.y - got.y) }
      pull = pullFor(ORIGIN, aim)
    }
    return pull
  }
  /** Pull the bag back by `pull` (percent of the field) and let go. */
  const pullBag = async (w: ReturnType<typeof mount>, pull: { x: number; y: number }, release = true) => {
    const x0 = 150
    const y0 = 360
    w.find('.sw-bag').element.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: x0, clientY: y0 }))
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: x0 + (pull.x / 100) * W, clientY: y0 + (pull.y / 100) * H }))
    await flushPromises()
    if (release) {
      window.dispatchEvent(new MouseEvent('pointerup', { clientX: x0 + (pull.x / 100) * W, clientY: y0 + (pull.y / 100) * H }))
      await flushPromises()
      await tick(800)
    }
  }
  const throwAt = async (w: ReturnType<typeof mount>, f: (typeof game.furrows)[number], wind: number) => pullBag(w, pullTo({ x: f.x, y: f.y }, wind))
  const missAt = (w: ReturnType<typeof mount>) => pullBag(w, pullTo({ x: 50, y: 70 }, 0))

  it('round 1: four furrows, no wind flag; the goal is the number of all the furrows (4 + 6 = 10); two rounds at most', async () => {
    expect(game.rounds.length).toBeLessThanOrEqual(2)
    const w = await open()
    expect(w.findAll('.sw-furrow')).toHaveLength(4)
    expect(w.find('.sw-vane').exists()).toBe(false)
    expect(w.find('.sw-round').text()).toContain('Runde 1 von 2')
    expect(w.find('.sw-count').text()).toBe('Furchen: 0 von 4')
    expect(useTaskProgress().goal.value).toBe(10)
    expect(w.find('.sw-bag').attributes('aria-label')).toBe('Der Beutel mit Samen')
    expect(problems()).toEqual([])
  })

  it('a ring shows where the seed would land while the bag is held; a short pull is no throw', async () => {
    const w = await open()
    await pullBag(w, { x: 0, y: 10 }, false)
    expect(w.find('.sw-aim').exists()).toBe(true)
    window.dispatchEvent(new MouseEvent('pointerup', { clientX: 150, clientY: 360 + 0.1 * H }))
    await flushPromises()
    await tick(800)
    expect(w.find('.sw-aim').exists()).toBe(false)
    // a tiny pull: nothing flies and nothing is counted as a miss
    await tick(1000)
    expect(w.find('.gm.bad').exists()).toBe(false)
    await pullBag(w, { x: 0, y: 2 })
    expect(w.find('.sw-seed').exists()).toBe(false)
    expect(useTaskProgress().parts.value).toBe(0)
    expect(w.find('.gm.bad').exists()).toBe(false)
  })

  it('a seed that lands in a furrow sows it: a sprout grows (a part counted, the tone of the sack); a miss sinks into the earth (a cross, a mistake)', async () => {
    const w = await open()
    await throwAt(w, game.furrows[0]!, 0)
    expect(furrow(w, 0).classes()).toContain('sown')
    expect(furrow(w, 0).attributes('aria-label')).toBe('Eine Furche mit einem Sprössling')
    expect(w.findAll('.sw-sprout').filter((s) => !s.attributes('style')!.includes('display: none'))).toHaveLength(1)
    expect(useTaskProgress().parts.value).toBe(1)
    expect(played).toContain('sack')
    expect(w.find('.sw-count').text()).toBe('Furchen: 1 von 4')
    await tick(1000)
    expect(w.find('.sw-sprout.grown').exists()).toBe(true)
    await missAt(w)
    expect(w.find('.sw-fb').text()).toBe('Das Samenkorn ist in die Erde gesunken. Versuch es noch einmal.')
    expect(w.find('.gm.bad').exists()).toBe(true)
    expect(played).toContain('wrong')
    expect(useTaskProgress().parts.value).toBe(1)
    // a seed on a furrow that has its sprout already is neither a mistake nor counted
    const before = useTaskProgress().parts.value
    await throwAt(w, game.furrows[0]!, 0)
    expect(useTaskProgress().parts.value).toBe(before)
    expect(w.find('.sw-fb').text()).not.toBe('Das Samenkorn ist in die Erde gesunken. Versuch es noch einmal.')
  })

  it('after three misses in a row a tap helps: the furrows glow and a tap sows; the keyboard (Enter) sows at any time', async () => {
    const w = await open()
    for (let i = 0; i < 3; i++) {
      await missAt(w)
      await tick(1000)
    }
    expect(w.findAll('.sw-furrow.assist')).toHaveLength(4)
    const click = (el: Element, detail: number) => el.dispatchEvent(new MouseEvent('click', { bubbles: true, detail }))
    click(furrow(w, 1).element, 1)
    await flushPromises()
    expect(furrow(w, 1).classes()).toContain('sown')
    expect(useTaskProgress().parts.value).toBe(1)
    // the help is gone after a right one; a touch tap without the help does nothing, a keyboard click (detail 0) sows
    expect(w.findAll('.sw-furrow.assist')).toHaveLength(0)
    click(furrow(w, 2).element, 1)
    await flushPromises()
    expect(furrow(w, 2).classes()).not.toContain('sown')
    click(furrow(w, 2).element, 0)
    await flushPromises()
    expect(furrow(w, 2).classes()).toContain('sown')
  })

  it('round 2: six furrows and a wind flag that shows the way; the wind drives the seed; all the way through three stars with up to three misses', async () => {
    for (const [misses, stars] of [[0, 3], [3, 3], [4, 2], [9, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      for (let i = 0; i < misses; i++) {
        await missAt(w)
        await tick(1000)
      }
      // a miss run of three turns the help on: the tests throw anyway (a throw sows as well)
      for (const f of ['a', 'b', 'c', 'd']) await throwAt(w, game.furrows.find((x) => x.id === f)!, 0)
      await tick(2200)
      expect(w.find('.sw-round').text()).toContain('Runde 2 von 2')
      expect(w.findAll('.sw-furrow')).toHaveLength(6)
      expect(w.find('.sw-vane').exists()).toBe(true)
      expect(w.find('.sw-vane').classes()).toContain('right')
      expect(w.find('.sw-vane').attributes('aria-label')).toBe('Der Wind weht')
      for (const f of ['a', 'b', 'c', 'd', 'e', 'f']) await throwAt(w, game.furrows.find((x) => x.id === f)!, 0.5)
      await tick(2000)
      expect(useTaskProgress().parts.value, `${misses} misses`).toBe(10)
      expect(useTaskProgress().finished.value).toBe(true)
      expect(w.text()).toContain('Das ganze Feld ist gesät!')
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${misses} misses`).toEqual([[stars]])
      w.unmount()
    }
  })

  it('the steps of "Go on" for 10 furrows: 3 one star, 7 two stars', () => {
    expect([2, 3, 6, 7].map((d) => partialStars(d, 10))).toEqual([0, 1, 1, 2])
  })

  it('English: the words of the game', async () => {
    const w = await open('en')
    expect(w.find('.sw-round').text()).toBe('Round 1 of 2')
    expect(w.find('.sw-count').text()).toBe('Furrows: 0 of 4')
    await missAt(w)
    expect(w.find('.sw-fb').text()).toBe('The seed sank into the earth. Try again.')
  })
})

// ---------------------------------------------------------------- herd the animals
describe('Hüten (herd)', () => {
  const H = 400 / 3
  const W = 300
  const game: HerdGame = {
    scene: 'images/x/wiese.webp',
    rest: { x: 70, y: 30, r: 14 },
    animals: [
      { id: 'schaf', image: 'images/x/schaf.webp', label: 'Schaf', x: 30, y: 75, w: 13 },
      { id: 'ziege', image: 'images/x/ziege.webp', label: 'Ziege', x: 42, y: 78, w: 13 },
      { id: 'hirsch', image: 'images/x/hirsch.webp', label: 'Hirsch', x: 55, y: 74, w: 15 },
      { id: 'reh', image: 'images/x/reh.webp', label: 'Reh', x: 36, y: 84, w: 12 },
      { id: 'elefant', image: 'images/x/elefant.webp', label: 'Elefant', x: 50, y: 85, w: 20 },
      { id: 'hase', image: 'images/x/hase.webp', label: 'Hase', x: 15, y: 60, w: 9, shy: true },
      { id: 'pfau', image: 'images/x/pfau.webp', label: 'Pfau', x: 80, y: 88, w: 13, shy: true },
      { id: 'giraffe', image: 'images/x/giraffe.webp', label: 'Giraffe', x: 22, y: 90, w: 14 }
    ],
    rounds: [
      { hint: 'Führe die Tiere sanft in den Schatten.', animals: ['schaf', 'ziege', 'hirsch', 'reh', 'elefant'] },
      { hint: 'Jetzt sind es mehr, und zwei sind scheu.', animals: ['schaf', 'ziege', 'hirsch', 'reh', 'elefant', 'hase', 'pfau', 'giraffe'] }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, right: W, bottom: 400, width: W, height: 400, x: 0, y: 0, toJSON: () => ({}) })
    const { default: Herd } = await import('@/components/molecules/games/GameHerd.vue')
    const w = mount(Herd, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  const field = (w: ReturnType<typeof mount>) => w.find('.hd-field').element
  const ptr = (w: ReturnType<typeof mount>, type: string, px: number, py: number) => field(w).dispatchEvent(new MouseEvent(type, { bubbles: true, button: 0, clientX: px, clientY: py }))
  const animals = (w: ReturnType<typeof mount>) => w.findAll('.hd-animal')
  /** The positions of the animals read from the screen, in width units, and whether they rest. */
  const seen = (w: ReturnType<typeof mount>) =>
    animals(w).map((a) => {
      const st = a.attributes('style')!
      return { x: Number(/left:\s*([\d.]+)%/.exec(st)![1]), y: (Number(/top:\s*([\d.]+)%/.exec(st)![1]) * H) / 100, resting: a.classes().includes('resting') }
    })
  /**
   * A shepherd: the finger stands behind the animal that is farthest from the resting place and glides after it. Returns when the round is done
   * (the count says that all animals rest), or gives up after `limit` seconds.
   */
  const shepherd = async (w: ReturnType<typeof mount>, total: number, limit = 60) => {
    const zone = { x: 70, y: (30 * H) / 100 }
    let finger = { x: 50, y: 120 }
    ptr(w, 'pointerdown', (finger.x / 100) * W, (finger.y / 100) * W)
    for (let t = 0; t < limit * 1000; t += 34) {
      const list = seen(w).filter((a) => !a.resting)
      if (!list.length) break
      const far = list.reduce((m, a) => (Math.hypot(a.x - zone.x, a.y - zone.y) > Math.hypot(m.x - zone.x, m.y - zone.y) ? a : m))
      const dx = zone.x - far.x
      const dy = zone.y - far.y
      const d = Math.hypot(dx, dy) || 1
      const goal = { x: far.x - (dx / d) * 14, y: far.y - (dy / d) * 14 }
      const gx = goal.x - finger.x
      const gy = goal.y - finger.y
      const g = Math.hypot(gx, gy) || 1
      const step = Math.min(g, 3)
      finger = { x: finger.x + (gx / g) * step, y: finger.y + (gy / g) * step }
      ptr(w, 'pointermove', (finger.x / 100) * W, (finger.y / 100) * W)
      await vi.advanceTimersByTimeAsync(34)
    }
    ptr(w, 'pointerup', 0, 0)
    await flushPromises()
    expect(w.text()).toContain(`${total} von ${total}`)
  }

  it('round 1: five animals on the meadow, a resting place, no mistakes to make; the goal is the number of all animals (5 + 8 = 13); two rounds at most', async () => {
    expect(game.rounds.length).toBeLessThanOrEqual(2)
    for (const r of game.rounds) for (const id of r.animals) expect(game.animals.some((a) => a.id === id)).toBe(true)
    const w = await open()
    expect(animals(w)).toHaveLength(5)
    expect(w.find('.hd-zone').exists()).toBe(true)
    expect(w.find('.hd-round').text()).toContain('Runde 1 von 2')
    expect(w.find('.hd-count').text()).toBe('Es ruhen: 0 von 5')
    expect(useTaskProgress().goal.value).toBe(13)
    expect(animals(w)[0]!.attributes('aria-label')).toBe('Tier: Schaf')
    expect(problems()).toEqual([])
  })

  it('the animals step away from the finger and stay still without it', async () => {
    const w = await open()
    const before = seen(w)
    // the finger just right of the first animal (the sheep): it goes left
    const sheep = before[0]!
    ptr(w, 'pointerdown', ((sheep.x + 10) / 100) * W, (sheep.y / 100) * W)
    await tick(600)
    expect(w.find('.hd-staff').exists()).toBe(true)
    expect(seen(w)[0]!.x).toBeLessThan(sheep.x)
    ptr(w, 'pointerup', 0, 0)
    await tick(3000)
    expect(w.find('.hd-staff').exists()).toBe(false)
    const rest = seen(w)
    await tick(1000)
    expect(seen(w).map((a) => Math.round(a.x * 10))).toEqual(rest.map((a) => Math.round(a.x * 10)))
  })

  it('all the way through: the shepherd brings round 1 home (a part for every animal), round 2 with two shy animals, and the game is three stars', async () => {
    const w = await open()
    await shepherd(w, 5)
    expect(useTaskProgress().parts.value).toBe(5)
    expect(w.findAll('.hd-animal.resting')).toHaveLength(5)
    expect(played).toContain('found')
    await tick(2200)
    expect(w.find('.hd-round').text()).toContain('Runde 2 von 2')
    expect(animals(w)).toHaveLength(8)
    expect(w.findAll('.hd-animal.resting')).toHaveLength(0)
    await shepherd(w, 8, 90)
    await tick(2000)
    expect(useTaskProgress().parts.value).toBe(13)
    expect(useTaskProgress().finished.value).toBe(true)
    expect(w.text()).toContain('Alle Tiere ruhen im Schatten!')
    await w.find('.gd button').trigger('click')
    expect(w.emitted('done')).toEqual([[3]])
    expect(problems()).toEqual([])
  })

  it('"Help" shows a soft path to the resting place for a few seconds and costs nothing', async () => {
    const w = await open()
    expect(w.find('.hd-path').exists()).toBe(false)
    const help = w.findAll('button').find((b) => b.text() === 'Hilfe')!
    expect((help.element as HTMLElement).className).toContain('lk-btn')
    await help.trigger('click')
    expect(w.find('.hd-path').exists()).toBe(true)
    await tick(4200)
    expect(w.find('.hd-path').exists()).toBe(false)
    await shepherd(w, 5)
    await tick(2200)
    await shepherd(w, 8, 90)
    await tick(2000)
    await w.find('.gd button').trigger('click')
    expect(w.emitted('done')).toEqual([[3]])
  })

  it('the arrow keys move the staff for those who cannot use a finger', async () => {
    const w = await open()
    await w.find('.hd-field').trigger('keydown', { key: 'ArrowUp' })
    expect(w.find('.hd-staff').exists()).toBe(true)
    await tick(900)
    expect(w.find('.hd-staff').exists()).toBe(false)
  })

  it('the steps of "Go on" for 13 animals: 4 rest one star, 9 two stars', () => {
    expect([3, 4, 8, 9].map((d) => partialStars(d, 13))).toEqual([0, 1, 1, 2])
  })

  it('English: the words of the game', async () => {
    const w = await open('en')
    expect(w.find('.hd-round').text()).toBe('Round 1 of 2')
    expect(w.find('.hd-count').text()).toBe('Resting: 0 of 5')
    expect(animals(w)[0]!.attributes('aria-label')).toBe('Animal: Schaf')
    expect(w.findAll('button').some((b) => b.text() === 'Help')).toBe(true)
  })
})
