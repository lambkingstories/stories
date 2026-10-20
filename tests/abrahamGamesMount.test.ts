/**
 * The two new games of "Abraham" (no game of Josef, Noah, Adam und Eva or Babel is repeated there): each is mounted with sample data and used: right and wrong
 * moves, the rounds (at most two), the goal for the stars of "Go on" (`useTaskProgress`), the end with its stars, German and English words.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import useTaskProgress from '@/use/useTaskProgress'
import type { BalanceGame, ConstellationGame, SilverGame } from '@/types/adventure'

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
const boxOf100 = () => vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100, x: 0, y: 0, toJSON: () => ({}) })

// ---------------------------------------------------------------- load the camels
describe('Kamele beladen (balance)', () => {
  const pack = (id: string, weight: 1 | 2 | 3, label: string) => ({ id, image: `images/x/${id}.webp`, weight, label })
  const game: BalanceGame = {
    background: 'images/x/bg.webp',
    camel: 'images/x/camel.webp',
    basket: 'images/x/basket.webp',
    packs: [pack('a', 1, 'Sack A'), pack('b', 2, 'Schlauch B'), pack('c', 3, 'Sack C'), pack('d', 1, 'Sack D'), pack('e', 1, 'Sack E'), pack('f', 2, 'Schlauch F')],
    rounds: [
      { hint: 'Runde eins: gleich schwer.', camels: [{ packs: ['a', 'b', 'c'] }, { packs: ['d', 'e', 'f'] }] },
      { hint: 'Runde zwei: wieder.', camels: [{ packs: ['a', 'b', 'c'] }] }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    const { default: Balance } = await import('@/components/molecules/games/GameBalance.vue')
    const w = mount(Balance, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  const packBtn = (w: W, label: string) => w.findAll('.bl-pack').find((p) => p.attributes('aria-label')!.includes(label))!
  /** Tap a pack and then a basket (0 left, 1 right). */
  const put = async (w: W, label: string, basket: 0 | 1) => {
    await packBtn(w, label).trigger('click')
    await w.findAll('.bl-basket')[basket]!.trigger('click')
    await flushPromises()
  }
  const lean = (w: W) => parseFloat(w.find('.bl-camel').attributes('style')!.match(/rotate\((-?[\d.]+)deg\)/)![1]!)

  it('the goal is every camel of both rounds; the packs lie on the ground and the camel stands straight', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(3)
    expect(w.find('.bl-round').text()).toContain('Runde 1 von 2')
    expect(w.findAll('.bl-pack')).toHaveLength(3)
    expect(w.findAll('.bl-basket')).toHaveLength(2)
    expect(lean(w)).toBe(0)
    expect(w.find('.bl-count').text()).toBe('Kamele: 0 von 3')
    expect(w.find('.bl-hint').text()).toContain('gleich schwer')
    expect(packBtn(w, 'Schlauch B').attributes('aria-label')).toBe('Paket: Schlauch B, Gewicht 2')
    expect(packBtn(w, 'Schlauch B').find('.bl-dots').text()).toBe('●●')
  })

  it('a pack goes into a basket (tap the pack, tap the basket); the camel leans to the heavier side; a pack in a basket can be taken out again', async () => {
    const w = await open()
    await put(w, 'Sack C', 0)
    expect(w.findAll('.bl-basket')[0]!.findAll('.bl-load img')).toHaveLength(1)
    expect(w.findAll('.bl-basket')[0]!.attributes('aria-label')).toBe('Linker Korb, Gewicht 3')
    // the heavier side is the left one: the camel leans to the left
    expect(lean(w)).toBe(-9)
    await put(w, 'Sack A', 1)
    expect(lean(w)).toBe(-6)
    expect(packBtn(w, 'Sack A').classes()).toContain('away')
    // taking a pack out: tap it in the tray
    await packBtn(w, 'Sack C').trigger('click')
    expect(w.findAll('.bl-basket')[0]!.findAll('.bl-load img')).toHaveLength(0)
    expect(lean(w)).toBe(3)
    expect(useTaskProgress().parts.value).toBe(0)
    expect(played).not.toContain('wrong')
  })

  it('a basket without a chosen pack says what to do; a chosen pack can be un-chosen by tapping it again', async () => {
    const w = await open()
    await w.findAll('.bl-basket')[0]!.trigger('click')
    expect(w.find('.bl-fb').text()).toContain('Tippe erst ein Paket an')
    await packBtn(w, 'Sack A').trigger('click')
    expect(packBtn(w, 'Sack A').classes()).toContain('chosen')
    await packBtn(w, 'Sack A').trigger('click')
    expect(packBtn(w, 'Sack A').classes()).not.toContain('chosen')
  })

  it('all packs in the baskets but not the same weight: the camel only leans on (a friendly line, no mistake, nothing counted); the right way makes it stand straight', async () => {
    const w = await open()
    await put(w, 'Sack A', 0)
    await put(w, 'Schlauch B', 0)
    await put(w, 'Sack C', 0)
    expect(w.find('.bl-fb').text()).toContain('Noch nicht gleich schwer')
    expect(useTaskProgress().parts.value).toBe(0)
    expect(played).not.toContain('wrong')
    // the 3 over to the right: 1 + 2 = 3
    await packBtn(w, 'Sack C').trigger('click')
    await put(w, 'Sack C', 1)
    expect(w.find('.bl-fb').text()).toBe('Das Kamel steht gerade!')
    expect(lean(w)).toBe(0)
    expect(played).toContain('snap')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.find('.bl-count').text()).toBe('Kamele: 1 von 3')
    // the next camel comes with its own packs
    await tick(1400)
    expect(w.findAll('.bl-pack').map((p) => p.attributes('aria-label'))).toEqual(['Paket: Sack D, Gewicht 1', 'Paket: Sack E, Gewicht 1', 'Paket: Schlauch F, Gewicht 2'])
    expect(w.findAll('.bl-load img')).toHaveLength(0)
  })

  it('the tip lets one pack blink and names the basket', async () => {
    const w = await open()
    await w.findAll('button').find((b) => b.text() === 'Tipp')!.trigger('click')
    expect(w.findAll('.bl-pack.blink')).toHaveLength(1)
    expect(w.find('.bl-fb').text()).toMatch(/Lege das blinkende Paket in den (linken|rechten) Korb/)
  })

  it('the rounds: two camels in round 1, one in round 2; a game without a tip is three stars, one tip two stars, three tips one star', async () => {
    for (const [tips, stars] of [[0, 3], [1, 2], [3, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      for (let i = 0; i < tips; i++) {
        await w.findAll('button').find((b) => b.text() === 'Tipp')!.trigger('click')
        await tick(5000)
      }
      await put(w, 'Sack A', 0)
      await put(w, 'Schlauch B', 0)
      await put(w, 'Sack C', 1)
      await tick(1400)
      await put(w, 'Sack D', 0)
      await put(w, 'Sack E', 0)
      await put(w, 'Schlauch F', 1)
      await tick(1400 + 1500)
      expect(w.find('.bl-round').text()).toContain('Runde 2 von 2')
      expect(w.find('.bl-hint').text()).toContain('wieder')
      await put(w, 'Sack A', 0)
      await put(w, 'Schlauch B', 0)
      await put(w, 'Sack C', 1)
      await tick(1400)
      expect(useTaskProgress().parts.value).toBe(3)
      expect(useTaskProgress().finished.value).toBe(true)
      expect(w.text()).toContain('Alle Kamele sind beladen und stehen gerade!')
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${tips} tips`).toEqual([[stars]])
      w.unmount()
    }
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = await open('en')
    expect(w.find('.bl-count').text()).toBe('Camels: 0 of 3')
    expect(packBtn(w, 'Sack A').attributes('aria-label')).toBe('Pack: Sack A, weight 1')
    await w.findAll('.bl-basket')[1]!.trigger('click')
    expect(w.find('.bl-fb').text()).toContain('Tap a pack first')
    await w.findAll('button').find((b) => b.text() === 'Tip')!.trigger('click')
    expect(w.find('.bl-fb').text()).toMatch(/Put the blinking pack in the (left|right) basket/)
  })
})

// ---------------------------------------------------------------- copy the constellation
describe('Sternbild nachlegen (constellation)', () => {
  const game: ConstellationGame = {
    background: 'images/x/night.webp',
    star: 'images/abenteuer/ui/stern-gold-1.webp',
    frame: { x: 30, y: 6, w: 60, h: 44 },
    rounds: [
      { hint: 'Runde eins: das Vorbild bleibt.', showAlways: true, targets: [[20, 70], [70, 30]] },
      { hint: 'Runde zwei: Schau gut hin.', showAlways: false, targets: [[10, 20], [50, 50], [85, 75]] }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    boxOf100()
    const { default: Constellation } = await import('@/components/molecules/games/GameConstellation.vue')
    const w = mount(Constellation, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  /** A tap in the frame: the pixels are percents of the frame (the frame has 100 x 100 pixels). */
  const lay = async (w: W, x: number, y: number) => {
    w.find('.cn-frame').element.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: x, clientY: y }))
    await flushPromises()
  }
  const laid = (w: W) => w.findAll('.cn-star').filter((s) => !s.attributes('style')!.includes('display: none')).length
  const btn = (w: W, text: string) => w.findAll('button').find((b) => b.text() === text)

  it('the goal is every star of both rounds; in round 1 the model stays in view and the frame is ready', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(5)
    expect(w.find('.cn-round').text()).toContain('Runde 1 von 2')
    expect(w.find('.cn-model').exists()).toBe(true)
    expect(w.findAll('.cn-model .cn-dot')).toHaveLength(2)
    expect(w.find('.cn-frame').classes()).not.toContain('off')
    expect(w.find('.cn-hint').text()).toContain('das Vorbild bleibt')
    expect(w.find('.cn-count').text()).toBe('Sterne: 0 von 2')
    expect(laid(w)).toBe(0)
    expect(btn(w, 'Nochmal zeigen')).toBeUndefined()
  })

  it('a star near a star of the model sits on its place (a tick, a part of the task); in any order', async () => {
    const w = await open()
    await lay(w, 72, 32)
    expect(laid(w)).toBe(1)
    expect(played).toContain('snap')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.find('.cn-fb').text()).toBe('Richtig!')
    // the star stands at the place of the model (frame x 30 + 70 % of 60 = 72 % of the picture)
    expect(w.findAll('.cn-star')[1]!.attributes('style')).toContain('left: 72%')
    await lay(w, 18, 68)
    expect(laid(w)).toBe(2)
  })

  it('a star far from all stars of the model is a cross, a mistake and is gone again; a second star at a place that is taken does not count either', async () => {
    const w = await open()
    await lay(w, 50, 50)
    expect(laid(w)).toBe(0)
    expect(played).toContain('wrong')
    expect(w.find('.cn-wrong').exists()).toBe(true)
    expect(w.find('.cn-fb').text()).toContain('kein Stern')
    expect(useTaskProgress().parts.value).toBe(0)
    await tick(1000)
    expect(w.find('.cn-wrong').exists()).toBe(false)
    await lay(w, 70, 30)
    await lay(w, 71, 31)
    expect(laid(w)).toBe(1)
    expect(played.filter((p) => p === 'wrong')).toHaveLength(2)
  })

  it('the keyboard lays a star: arrow keys move a cursor, Enter lays a star there', async () => {
    const w = await open()
    for (let i = 0; i < 5; i++) await w.find('.cn-frame').trigger('keydown', { key: 'ArrowLeft' })
    for (let i = 0; i < 3; i++) await w.find('.cn-frame').trigger('keydown', { key: 'ArrowDown' })
    expect(w.find('.cn-cursor').exists()).toBe(true)
    await w.find('.cn-frame').trigger('keydown', { key: 'Enter' })
    expect(laid(w)).toBe(1)
    expect(useTaskProgress().parts.value).toBe(1)
  })

  it('round 2: the model is looked at first (the frame waits), then it is hidden; "Show again" shows it for a moment at no cost', async () => {
    const w = await open()
    await lay(w, 70, 30)
    await lay(w, 20, 70)
    await tick(1800)
    expect(w.find('.cn-round').text()).toContain('Runde 2 von 2')
    expect(w.find('.cn-hint').text()).toContain('Schau das Vorbild genau an')
    expect(w.findAll('.cn-model .cn-dot')).toHaveLength(3)
    expect(w.find('.cn-frame').classes()).toContain('off')
    // nothing happens before the model has been looked at
    await lay(w, 10, 20)
    expect(laid(w)).toBe(0)
    expect(played).not.toContain('wrong')
    await btn(w, 'Ich habe es gesehen')!.trigger('click')
    expect(w.find('.cn-model').exists()).toBe(false)
    expect(w.find('.cn-hint').text()).toContain('Schau gut hin')
    await btn(w, 'Nochmal zeigen')!.trigger('click')
    expect(w.find('.cn-model').exists()).toBe(true)
    // while the model is shown nothing is laid
    await lay(w, 10, 20)
    expect(laid(w)).toBe(0)
    await tick(2700)
    expect(w.find('.cn-model').exists()).toBe(false)
    await lay(w, 10, 20)
    expect(laid(w)).toBe(1)
    expect(played).not.toContain('wrong')
  })

  it('all stars in place join in a glow and the next round or the end follows; a game with three mistakes or fewer is three stars, then two, then one', async () => {
    for (const [mistakes, stars] of [[0, 3], [3, 3], [4, 2], [8, 2], [9, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      for (let i = 0; i < mistakes; i++) await lay(w, 50, 50)
      await lay(w, 70, 30)
      await lay(w, 20, 70)
      expect(w.find('.cn-star.glow').exists()).toBe(true)
      await tick(1800)
      await btn(w, 'Ich habe es gesehen')!.trigger('click')
      await lay(w, 10, 20)
      await lay(w, 50, 50.2)
      await lay(w, 85, 75)
      await tick(1800)
      expect(useTaskProgress().parts.value, `${mistakes} mistakes`).toBe(5)
      expect(useTaskProgress().finished.value).toBe(true)
      expect(w.text()).toContain('Das Sternbild leuchtet!')
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${mistakes} mistakes`).toEqual([[stars]])
      w.unmount()
    }
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = await open('en')
    expect(w.find('.cn-count').text()).toBe('Stars: 0 of 2')
    await lay(w, 50, 50)
    expect(w.find('.cn-fb').text()).toContain('There is no star there in the model')
    await lay(w, 70, 30)
    await lay(w, 20, 70)
    await tick(1800)
    expect(w.find('.cn-hint').text()).toContain('Look closely at the model')
    expect(btn(w, 'I have looked')).toBeDefined()
  })
})

// ---------------------------------------------------------------- pay exactly
describe('Passend bezahlen (silver)', () => {
  const piece = (id: string, value: number) => ({ id, image: `images/x/${id}.webp`, value })
  const game: SilverGame = {
    background: 'images/x/gate.webp',
    cloth: 'images/x/cloth.webp',
    purse: 'images/x/purse.webp',
    pieces: [piece('a1', 200), piece('a2', 100), piece('a3', 100), piece('a4', 50), piece('b1', 150), piece('b2', 125), piece('b3', 75), piece('b4', 50), piece('b5', 100)],
    rounds: [
      { hint: 'Runde eins.', price: 400, pieces: ['a1', 'a2', 'a3', 'a4'], showSum: true },
      { hint: 'Runde zwei.', price: 400, pieces: ['b1', 'b2', 'b3', 'b4', 'b5'], showSum: false }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    const { default: Silver } = await import('@/components/molecules/games/GameSilver.vue')
    const w = mount(Silver, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  /** Put the pieces with these places in the tray (from the left) on the cloth with the Enter key. */
  const lay = async (w: W, ...places: number[]) => {
    // the places count in the tray as it is now: after each laid piece the rest moves up
    for (const place of places) {
      await w.findAll('.sv-tray .sv-piece')[place]!.trigger('keydown', { key: 'Enter' })
      await flushPromises()
    }
  }
  const pay = async (w: W) => {
    await w.find('.sv-pay').trigger('click')
    await flushPromises()
  }

  it('the goal is every round; the price is called, the sum is shown in round 1, all pieces wait in the tray with their worth', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(2)
    expect(w.find('.sv-round').text()).toContain('Runde 1 von 2')
    expect(w.find('.sv-price-text').text()).toBe('Preis: 400 Silberstücke')
    expect(w.find('.sv-sum').text()).toBe('Auf dem Tuch: 0')
    expect(w.findAll('.sv-tray .sv-piece')).toHaveLength(4)
    expect(w.findAll('.sv-tray .sv-value').map((v) => v.text())).toEqual(['200', '100', '100', '50'])
  })

  it('a piece is chosen with a tap and laid with a tap on the cloth; a tap on a piece on the cloth takes it back', async () => {
    const w = await open()
    const el = w.findAll('.sv-tray .sv-piece')[0]!.element
    el.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 5, clientY: 5 }))
    window.dispatchEvent(new MouseEvent('pointerup', { clientX: 5, clientY: 5 }))
    await flushPromises()
    await w.find('.sv-cloth').trigger('click')
    expect(w.findAll('.sv-laid .sv-piece')).toHaveLength(1)
    expect(w.findAll('.sv-tray .sv-piece')).toHaveLength(3)
    expect(w.find('.sv-sum').text()).toBe('Auf dem Tuch: 200')
    await w.find('.sv-laid .sv-piece').trigger('click')
    expect(w.findAll('.sv-laid .sv-piece')).toHaveLength(0)
    expect(w.find('.sv-sum').text()).toBe('Auf dem Tuch: 0')
  })

  it('too little and too much are a cross with a sentence and a mistake, the pieces stay; paying with nothing on the cloth is no mistake', async () => {
    const w = await open()
    await pay(w)
    expect(w.find('.sv-fb').text()).toContain('Lege Silberstücke')
    expect(played).not.toContain('wrong')
    await lay(w, 0, 0)
    await pay(w)
    expect(played).toContain('wrong')
    expect(w.find('.sv-fb').text()).toBe('Es fehlt noch etwas.')
    expect(w.findAll('.sv-laid .sv-piece')).toHaveLength(2)
    await lay(w, 0, 0)
    await pay(w)
    expect(w.find('.sv-fb').text()).toBe('Das ist zu viel.')
    expect(useTaskProgress().parts.value).toBe(0)
  })

  it('exactly four hundred is paid: the purse is given away, a tick, the next round has no sum and other pieces', async () => {
    const w = await open()
    await lay(w, 0, 0, 0)
    expect(w.find('.sv-sum').text()).toBe('Auf dem Tuch: 400')
    await pay(w)
    expect(w.find('.sv-purse').classes()).toContain('gone')
    expect(played).toContain('star')
    expect(useTaskProgress().parts.value).toBe(1)
    await tick(2000)
    expect(w.find('.sv-round').text()).toContain('Runde 2 von 2')
    expect(w.find('.sv-sum').exists()).toBe(false)
    expect(w.findAll('.sv-tray .sv-piece')).toHaveLength(5)
    expect(w.find('.sv-purse').classes()).not.toContain('gone')
  })

  it('the key B pays', async () => {
    const w = await open()
    await lay(w, 0, 0, 0)
    await w.find('.sv').trigger('keydown', { key: 'b' })
    expect(useTaskProgress().parts.value).toBe(1)
  })

  it('both rounds paid: the end; the stars follow the false payments (one three stars, three two stars, four one star)', async () => {
    for (const [mistakes, stars] of [[0, 3], [1, 3], [2, 2], [3, 2], [4, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      for (let i = 0; i < mistakes; i++) {
        await lay(w, 0)
        await pay(w)
        await w.find('.sv-laid .sv-piece').trigger('click')
      }
      await lay(w, 0, 0, 0)
      await pay(w)
      await tick(2000)
      // round 2: 150 + 125 + 75 + 50 = 400 (always the first place, as the tray moves up)
      await lay(w, 0, 0, 0, 0)
      expect(w.find('.sv-sum').exists()).toBe(false)
      await pay(w)
      await tick(1300)
      expect(useTaskProgress().parts.value).toBe(2)
      expect(useTaskProgress().finished.value).toBe(true)
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${mistakes} mistakes`).toEqual([[stars]])
      w.unmount()
    }
  })

  it('speaks English', async () => {
    const w = await open('en')
    expect(w.find('.sv-price-text').text()).toBe('Price: 400 pieces of silver')
    expect(w.find('.sv-pay').text()).toBe('Pay')
    await lay(w, 0)
    await pay(w)
    expect(w.find('.sv-fb').text()).toBe('Something is still missing.')
  })
})
