/**
 * The five new games of "Der Turm von Babel" (no game of Josef, Noah or Adam und Eva is repeated there): each is mounted with sample data and used:
 * right and wrong moves, the rounds (at most two), the goal for the stars of "Go on" (`useTaskProgress`), the end with its stars, German and English words.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import useTaskProgress from '@/use/useTaskProgress'
import type { ChainGame, MissingGame, StackGame, TraceGame, WipeGame } from '@/types/adventure'

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
/** The picture area has 100 x 100 pixels, so that the position of a finger in pixels is its position in percent. */
const boxOf100 = () => vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100, x: 0, y: 0, toJSON: () => ({}) })
const pointer = (el: Element, type: 'pointerdown' | 'pointermove' | 'pointerup', x = 0, y = 0) =>
  el.dispatchEvent(new MouseEvent(type, { bubbles: true, button: 0, buttons: type === 'pointerup' ? 0 : 1, clientX: x, clientY: y }))
const press = (el: Element) => el.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }))

// ---------------------------------------------------------------- who is missing
describe('Wer fehlt im Zug (missing)', () => {
  const person = (n: number, label: string) => ({ id: `p${n}`, image: `images/x/p${n}.webp`, label })
  const game: MissingGame = {
    background: 'images/x/bg.webp',
    cloud: 'images/x/cloud.webp',
    people: [person(1, 'Anna'), person(2, 'Ben'), person(3, 'Carl'), person(4, 'Dora'), person(5, 'Emil'), person(6, 'Fine')],
    slots: [[14, 84], [28, 84], [42, 84], [56, 84], [70, 84], [84, 84]],
    rounds: [
      {
        hint: 'Runde eins: Wer ist weg?',
        tasks: [
          { row: ['p1', 'p2', 'p3', 'p4'], gone: ['p3'] },
          { row: ['p5', 'p2', 'p6', 'p1'], gone: ['p2'] }
        ]
      },
      { hint: 'Jetzt fehlen zwei.', tasks: [{ row: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'], gone: ['p2', 'p5'] }] }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    const { default: Missing } = await import('@/components/molecules/games/GameMissing.vue')
    const w = mount(Missing, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  const look = async (w: Awaited<ReturnType<typeof open>>) => {
    await w.findAll('button').find((b) => b.text().includes('Fertig geschaut'))!.trigger('click')
    await tick(1700)
  }
  const pick = async (w: Awaited<ReturnType<typeof open>>, label: string) => {
    await w.findAll('.ms-choice').find((c) => c.attributes('aria-label')!.startsWith(label))!.trigger('click')
    await flushPromises()
  }

  it('the goal is everybody who is missing in all tasks; the row stands complete at first and shows the choices only after the cloud', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(1 + 1 + 2)
    expect(w.find('.ms-round').text()).toContain('Runde 1 von 2')
    expect(w.findAll('.ms-person')).toHaveLength(4)
    expect(w.findAll('.ms-gap')).toHaveLength(0)
    expect(w.findAll('.ms-choice')).toHaveLength(0)
    await look(w)
    expect(w.findAll('.ms-gap')).toHaveLength(1)
    expect(w.findAll('.ms-person')).toHaveLength(3)
    expect(w.findAll('.ms-choice')).toHaveLength(4)
    expect(w.find('.ms-hint').text()).toBe('Wer fehlt?')
  })

  it('the right person comes back (a tick, a part of the task), a wrong one is a cross and nothing is lost', async () => {
    const w = await open()
    await look(w)
    await pick(w, 'Anna')
    expect(played).toContain('wrong')
    expect(w.find('.ms-choice.wrong').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(0)
    expect(w.findAll('.ms-gap')).toHaveLength(1)
    await tick(1000)
    await pick(w, 'Carl')
    expect(played).toContain('snap')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.findAll('.ms-gap')).toHaveLength(0)
    // the next task starts with a complete row again
    await tick(1100)
    expect(w.findAll('.ms-person')).toHaveLength(4)
    expect(w.findAll('.ms-gap')).toHaveLength(0)
    expect(w.findAll('.ms-choice')).toHaveLength(0)
  })

  it('"Look again" shows the whole row for a moment, costs nothing and the choices cannot be tapped meanwhile', async () => {
    const w = await open()
    await look(w)
    await w.findAll('button').find((b) => b.text().includes('Noch einmal schauen'))!.trigger('click')
    expect(w.findAll('.ms-person')).toHaveLength(4)
    expect(w.findAll('.ms-gap')).toHaveLength(0)
    expect(w.find('.ms-choice').attributes('disabled')).toBeDefined()
    await tick(2700)
    expect(w.findAll('.ms-gap')).toHaveLength(1)
    expect(w.find('.ms-choice').attributes('disabled')).toBeUndefined()
    expect(played).not.toContain('wrong')
  })

  it('round 2: six people and two are missing (both have to be found); the whole game gives three stars without slips', async () => {
    const w = await open()
    await look(w)
    await pick(w, 'Carl')
    await tick(1100)
    await look(w)
    await pick(w, 'Ben')
    await tick(1100 + 1400)
    expect(w.find('.ms-round').text()).toContain('Runde 2 von 2')
    expect(w.findAll('.ms-person')).toHaveLength(6)
    await look(w)
    expect(w.findAll('.ms-gap')).toHaveLength(2)
    expect(w.find('.ms-hint').text()).toContain('Zwei fehlen')
    await pick(w, 'Ben')
    expect(useTaskProgress().parts.value).toBe(3)
    expect(w.findAll('.ms-gap')).toHaveLength(1)
    await pick(w, 'Emil')
    await tick(1200)
    expect(useTaskProgress().parts.value).toBe(4)
    expect(useTaskProgress().finished.value).toBe(true)
    expect(w.text()).toContain('Die ganze Karawane ist wieder beisammen!')
    await w.find('.gd button').trigger('click')
    expect(w.emitted('done')).toEqual([[3]])
    expect(problems()).toEqual([])
  })

  it('slips cost stars: three slips two stars, six slips one star', async () => {
    for (const [slips, stars] of [[3, 2], [6, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      await look(w)
      for (let i = 0; i < slips; i++) await pick(w, 'Anna')
      await pick(w, 'Carl')
      await tick(1100)
      await look(w)
      await pick(w, 'Ben')
      await tick(1100 + 1400)
      await look(w)
      await pick(w, 'Ben')
      await pick(w, 'Emil')
      await tick(1200)
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${slips} slips`).toEqual([[stars]])
      w.unmount()
    }
  })

  it('speaks English', async () => {
    const w = await open('en')
    expect(w.text()).toContain('Done looking')
    await w.findAll('button').find((b) => b.text().includes('Done looking'))!.trigger('click')
    await tick(1700)
    expect(w.find('.ms-hint').text()).toBe('Who is missing?')
    expect(w.text()).toContain('Look again')
  })
})

// ---------------------------------------------------------------- brick chain
describe('Ziegelkette (chain)', () => {
  const game: ChainGame = {
    background: 'images/x/bg.webp',
    worker: 'images/x/w.webp',
    brick: 'images/x/brick.webp',
    pitch: 'images/x/pitch.webp',
    rounds: [
      { hint: 'Runde eins.', people: 2, items: ['brick', 'brick'], slots: [[40, 76], [60, 76]], source: [24, 66], sink: [86, 80] },
      { hint: 'Jetzt mit Pech.', people: 3, items: ['brick', 'pitch'], slots: [[34, 76], [50, 76], [66, 76]], source: [22, 66], sink: [89, 80] }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    const { default: Chain } = await import('@/components/molecules/games/GameChain.vue')
    const w = mount(Chain, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  const tap = async (w: Awaited<ReturnType<typeof open>>, n: number) => {
    await w.findAll('.ch-worker')[n]!.trigger('click')
    await flushPromises()
  }
  /** What the builders hold, as letters (`-` for empty hands). */
  const hands = (w: Awaited<ReturnType<typeof open>>) =>
    w.findAll('.ch-worker').map((b) => (b.find('.ch-load').exists() ? (b.find('.ch-load').attributes('src')!.includes('pitch') ? 'p' : 'b') : '-')).join('')

  it('the goal is every brick and pot; the first brick is in the first pair of hands; passing on moves it, a full next pair of hands only wobbles', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(4)
    expect(hands(w)).toBe('b-')
    await tap(w, 0)
    expect(hands(w)).toBe('bb')
    await tap(w, 0)
    // the next one still has full hands: a friendly wobble, not a mistake
    expect(hands(w)).toBe('bb')
    expect(w.find('.ch-worker.wobble').exists()).toBe(true)
    expect(played).not.toContain('wrong')
    expect(w.find('.ch-fb').text()).toContain('volle Hände')
  })

  it('a tap on empty hands is a small cross, and putting on the stack is a part of the task', async () => {
    const w = await open()
    await tap(w, 1)
    expect(played).toContain('wrong')
    expect(w.find('.ch-mark').exists()).toBe(true)
    await tap(w, 0)
    await tap(w, 1)
    expect(hands(w)).toBe('b-')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.find('.ch-count').text()).toBe('Auf dem Stapel: 1 von 2')
  })

  it('round 2: four things with a pot of pitch in between; the whole game with one slip is three stars', async () => {
    const w = await open()
    await tap(w, 1) // one slip
    await tap(w, 0)
    await tap(w, 1)
    await tap(w, 0)
    await tap(w, 1)
    await tick(1500)
    expect(w.find('.ch-round').text()).toContain('Runde 2 von 2')
    expect(w.findAll('.ch-worker')).toHaveLength(3)
    expect(hands(w)).toBe('b--')
    await tap(w, 0)
    expect(hands(w)).toBe('pb-')
    await tap(w, 1)
    await tap(w, 2)
    expect(useTaskProgress().parts.value).toBe(3)
    await tap(w, 0)
    expect(played).toContain('sack')
    await tap(w, 1)
    await tap(w, 2)
    await tick(900)
    expect(useTaskProgress().parts.value).toBe(4)
    expect(useTaskProgress().finished.value).toBe(true)
    await w.find('.gd button').trigger('click')
    expect(w.emitted('done')).toEqual([[3]])
    expect(problems()).toEqual([])
  })

  it('slips cost stars: three slips two stars, six slips one star', async () => {
    for (const [slips, stars] of [[3, 2], [6, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      for (let i = 0; i < slips; i++) await tap(w, 1)
      await tap(w, 0)
      await tap(w, 1)
      await tap(w, 0)
      await tap(w, 1)
      await tick(1500)
      await tap(w, 0)
      await tap(w, 1)
      await tap(w, 2)
      await tap(w, 0)
      await tap(w, 1)
      await tap(w, 2)
      await tick(900)
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${slips} slips`).toEqual([[stars]])
      w.unmount()
    }
  })

  it('speaks English', async () => {
    const w = await open('en')
    expect(w.find('.ch-count').text()).toBe('On the stack: 0 of 2')
    await tap(w, 1)
    expect(w.find('.ch-fb').text()).toContain('hands are empty')
  })
})

// ---------------------------------------------------------------- stepped tower
describe('Stufenturm stapeln (stack)', () => {
  const still = 0.0001 // the block hardly moves: it stays at the left edge
  const good: StackGame = {
    background: 'images/x/bg.webp',
    block: 'images/x/block.webp',
    beam: 'images/x/beam.webp',
    rounds: [
      { hint: 'Runde eins.', layers: 2, baseWidth: 90, shrink: 0.1, speed: still },
      { hint: 'Runde zwei.', layers: 2, baseWidth: 90, shrink: 0.1, speed: still }
    ]
  }
  /** A tower whose foundation is narrow and in the middle: a block at the left edge is far outside. */
  const bad = (layers: number): StackGame => ({ ...good, rounds: [{ hint: 'Eine Runde.', layers, baseWidth: 40, shrink: 0.02, speed: still }] })
  const open = async (game: StackGame, locale: 'de' | 'en' = 'de') => {
    const { default: Stack } = await import('@/components/molecules/games/GameStack.vue')
    const w = mount(Stack, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  const drop = async (w: Awaited<ReturnType<typeof open>>) => {
    await w.find('.sk-field').trigger('pointerdown')
    await tick(450)
  }

  it('the goal is every step of every round; the block hangs on the beam; a tap lets it down onto the step (a tick when it sits right)', async () => {
    const w = await open(good)
    expect(useTaskProgress().goal.value).toBe(4)
    expect(w.findAll('.sk-step')).toHaveLength(1)
    expect(w.find('.sk-block').exists()).toBe(true)
    await tick(1000)
    await drop(w)
    expect(w.findAll('.sk-step')).toHaveLength(2)
    expect(played).toContain('snap')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.find('.sk-count').text()).toBe('Stufen: 1 von 2')
    expect(w.find('.sk-fb').text()).toBe('Richtig!')
  })

  it('the block glides to and fro with the speed of the round and waits for as long as the child likes', async () => {
    const fast: StackGame = { ...good, rounds: [{ hint: 'Schnell.', layers: 2, baseWidth: 52, shrink: 0.08, speed: 0.2 }] }
    const w = await open(fast)
    const left = () => parseFloat(w.find('.sk-block').attributes('style')!.match(/left: ([\d.]+)%/)![1]!)
    await tick(1000)
    expect(left()).toBeGreaterThan(17)
    expect(left()).toBeLessThan(23)
    await tick(30000)
    expect(w.findAll('.sk-step')).toHaveLength(1)
    expect(useTaskProgress().parts.value).toBe(0)
    expect(played).not.toContain('wrong')
  })

  it('a block far outside the step slides to the middle: a cross, a mistake, but the step is there and the tower stands', async () => {
    const w = await open(bad(2))
    await drop(w)
    expect(played).toContain('wrong')
    expect(w.findAll('.sk-step')).toHaveLength(2)
    expect(w.find('.sk-step.slid').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.find('.sk-fb').text()).toContain('in die Mitte gerutscht')
    // it sits on the middle of the step below (40 wide from 30; the block 39.2 wide)
    const style = w.findAll('.sk-step')[1]!.attributes('style')!
    expect(parseFloat(style.match(/left: ([\d.]+)%/)![1]!)).toBeCloseTo(30.4, 1)
  })

  it('a second tap while the block comes down does nothing', async () => {
    const w = await open(good)
    await w.find('.sk-field').trigger('pointerdown')
    await w.find('.sk-field').trigger('pointerdown')
    await tick(450)
    expect(w.findAll('.sk-step')).toHaveLength(2)
  })

  it('the keyboard works, too (Enter or space)', async () => {
    const w = await open(good)
    await w.find('.sk-field').trigger('keydown', { key: 'Enter' })
    await tick(450)
    expect(w.findAll('.sk-step')).toHaveLength(2)
    await w.find('.sk-field').trigger('keydown', { key: ' ' })
    await tick(450)
    expect(w.findAll('.sk-step')).toHaveLength(3)
  })

  it('two rounds of two steps: the second starts with a fresh foundation; without slips three stars', async () => {
    const w = await open(good)
    await drop(w)
    await drop(w)
    await tick(1700)
    expect(w.find('.sk-round').text()).toContain('Runde 2 von 2')
    expect(w.findAll('.sk-step')).toHaveLength(1)
    await drop(w)
    await drop(w)
    await tick(1000)
    expect(useTaskProgress().parts.value).toBe(4)
    expect(useTaskProgress().finished.value).toBe(true)
    expect(w.text()).toContain('Der Stufenturm steht!')
    await w.find('.gd button').trigger('click')
    expect(w.emitted('done')).toEqual([[3]])
    expect(problems()).toEqual([])
  })

  it('slips cost stars: three slips two stars, five slips one star', async () => {
    for (const [slips, stars] of [[3, 2], [5, 1]] as const) {
      useTaskProgress().reset()
      const w = await open(bad(slips))
      for (let i = 0; i < slips; i++) await drop(w)
      await tick(1000)
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${slips} slips`).toEqual([[stars]])
      w.unmount()
    }
  })

  it('speaks English', async () => {
    const w = await open(bad(2), 'en')
    await drop(w)
    expect(w.find('.sk-count').text()).toBe('Steps: 1 of 2')
    expect(w.find('.sk-fb').text()).toContain('slid to the middle')
  })
})

// ---------------------------------------------------------------- wipe the fog
describe('Nebel wegwischen (wipe)', () => {
  const game: WipeGame = {
    background: 'images/x/bg.webp',
    mist: 'images/x/mist.webp',
    rounds: [
      { hint: 'Wische den Nebel vom Turm.', region: { x: 28, y: 4, w: 44, h: 50 } },
      { hint: 'Jetzt die Stadt.', region: { x: 4, y: 52, w: 92, h: 44 } }
    ]
  }
  const context = {
    globalCompositeOperation: '',
    fillStyle: '',
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    createRadialGradient: () => ({ addColorStop: vi.fn() })
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as never)
    boxOf100()
    const { default: Wipe } = await import('@/components/molecules/games/GameWipe.vue')
    const w = mount(Wipe, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  /** Wipe horizontal lines through the whole picture at the given heights. */
  const stripes = async (w: Awaited<ReturnType<typeof open>>, ys: number[]) => {
    const field = w.find('.wp-field').element
    for (const y of ys) {
      pointer(field, 'pointerdown', 0, y)
      pointer(field, 'pointermove', 50, y)
      pointer(field, 'pointermove', 100, y)
      pointer(field, 'pointerup', 100, y)
    }
    await flushPromises()
  }

  it('the goal is 50 parts for every round; nothing is free at the start', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(100)
    expect(w.find('.wp-count').text()).toBe('Frei: 0 %')
    expect(w.find('canvas').exists()).toBe(true)
    expect(w.find('.wp-hint').text()).toContain('vom Turm')
  })

  it('wiping a little earns a little of the task, wiping the part clears the fog (the rest drifts away) and round 2 begins', async () => {
    const w = await open()
    await stripes(w, [20])
    const little = useTaskProgress().parts.value
    expect(little).toBeGreaterThan(0)
    expect(little).toBeLessThan(50)
    expect(w.find('.wp-count').text()).not.toBe('Frei: 0 %')
    await stripes(w, [8, 28, 38, 48, 14])
    expect(w.find('.wp-fb').text()).toBe('Es ist klar!')
    expect(w.find('.wp-fog.gone').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(50)
    expect(played).toContain('star')
    await tick(1500 + 700)
    expect(w.find('.wp-round').text()).toContain('Runde 2 von 2')
    expect(w.find('.wp-count').text()).toBe('Frei: 0 %')
    expect(w.find('.wp-fog.gone').exists()).toBe(false)
    expect(w.find('.wp-hint').text()).toContain('die Stadt')
  })

  it('both parts cleared: always three stars (nothing can go wrong), the picture and the line at the end', async () => {
    const w = await open()
    await stripes(w, [8, 28, 38, 48, 14, 20])
    await tick(2200)
    await stripes(w, [56, 66, 76, 86, 94, 60])
    await tick(1600)
    expect(useTaskProgress().parts.value).toBe(100)
    expect(useTaskProgress().finished.value).toBe(true)
    expect(w.text()).toContain('Der Nebel hat sich gelichtet')
    await w.find('.gd button').trigger('click')
    expect(w.emitted('done')).toEqual([[3]])
    expect(problems()).toEqual([])
  })

  it('"Help" lets a shimmer show the part for a few seconds', async () => {
    const w = await open()
    expect(w.find('.wp-shimmer').exists()).toBe(false)
    await w.findAll('button').find((b) => b.text() === 'Hilfe')!.trigger('click')
    expect(w.find('.wp-shimmer').exists()).toBe(true)
    await tick(4100)
    expect(w.find('.wp-shimmer').exists()).toBe(false)
  })

  it('a wiper can be moved with the arrow keys', async () => {
    const w = await open()
    for (let i = 0; i < 6; i++) await w.find('.wp-field').trigger('keydown', { key: 'ArrowUp' })
    for (let i = 0; i < 5; i++) await w.find('.wp-field').trigger('keydown', { key: 'ArrowRight' })
    expect(w.find('.wp-count').text()).not.toBe('Frei: 0 %')
    expect(useTaskProgress().parts.value).toBeGreaterThan(0)
  })

  it('speaks English', async () => {
    const w = await open('en')
    expect(w.find('.wp-count').text()).toBe('Free: 0 %')
    expect(w.text()).toContain('Help')
  })
})

// ---------------------------------------------------------------- follow the roads
describe('Wegen nachfahren (trace)', () => {
  const game: TraceGame = {
    scene: 'images/x/scene.webp',
    walker: 'images/x/walker.webp',
    rounds: [
      {
        hint: 'Fahre die beiden Wege nach.',
        paths: [
          { id: 'berge', points: [[54, 50], [60, 49], [66, 48], [72, 47], [78, 45], [84, 43], [90, 40]], r: 4, goal: 'berge' },
          { id: 'fluss', points: [[46, 50], [40, 51], [34, 52], [28, 54], [22, 56], [16, 59], [10, 62]], r: 4, goal: 'fluss' }
        ]
      },
      {
        hint: 'Jetzt vier Wege.',
        paths: [
          { id: 'berge', points: [[53, 47], [58, 42], [62, 36], [67, 30], [72, 25], [77, 20], [82, 16]], r: 3, goal: 'berge' },
          { id: 'fluss', points: [[47, 47], [42, 42], [38, 36], [32, 31], [27, 26], [22, 21], [17, 17]], r: 3, goal: 'fluss' },
          { id: 'palmen', points: [[53, 54], [58, 59], [63, 64], [69, 68], [75, 72], [81, 75], [87, 78]], r: 3, goal: 'palmen' },
          { id: 'huegel', points: [[47, 54], [42, 59], [36, 64], [30, 68], [24, 72], [18, 75], [12, 78]], r: 3, goal: 'huegel' }
        ]
      }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    boxOf100()
    const { default: Trace } = await import('@/components/molecules/games/GameTrace.vue')
    const w = mount(Trace, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  /** The finger follows a road from the first to the last of its points. */
  const follow = async (w: Awaited<ReturnType<typeof open>>, points: [number, number][]) => {
    const field = w.find('.tr-field').element
    pointer(field, 'pointerdown', points[0]![0], points[0]![1])
    for (const p of points.slice(1)) pointer(field, 'pointermove', p[0], p[1])
    pointer(field, 'pointerup', points[points.length - 1]![0], points[points.length - 1]![1])
    await flushPromises()
  }
  const road = (round: number, id: string) => game.rounds[round]!.paths.find((p) => p.id === id)!.points

  it('the goal is every road of every round; the walkers stand at the tower and a goal is drawn at the end of every road', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(6)
    expect(w.findAll('.tr-walker')).toHaveLength(2)
    expect(w.findAll('.tr-goal')).toHaveLength(2)
    expect(w.find('.tr-count').text()).toBe('Wege: 0 von 2')
    const style = w.find('.tr-walker').attributes('style')!
    expect(style).toContain('left: 54%')
  })

  it('the walker goes as far as the finger follows and arrives; the goal lights up (a part of the task)', async () => {
    const w = await open()
    const field = w.find('.tr-field').element
    pointer(field, 'pointerdown', 54, 50)
    pointer(field, 'pointermove', 66, 48)
    await flushPromises()
    const left = parseFloat(w.find('.tr-walker').attributes('style')!.match(/left: ([\d.]+)%/)![1]!)
    expect(left).toBeGreaterThan(60)
    expect(left).toBeLessThan(70)
    await flushPromises()
    expect(useTaskProgress().parts.value).toBe(0)
    pointer(field, 'pointerup', 66, 48)
    await follow(w, road(0, 'berge'))
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.find('.tr-goal.lit').exists()).toBe(true)
    expect(played).toContain('found')
    expect(w.find('.tr-fb').text()).toContain('bei den Bergen')
    expect(w.find('.tr-count').text()).toBe('Wege: 1 von 2')
  })

  it('a finger far from the road stops the walker (it wobbles, one mistake); after putting the finger down again it goes on', async () => {
    const w = await open()
    const field = w.find('.tr-field').element
    pointer(field, 'pointerdown', 54, 50)
    pointer(field, 'pointermove', 66, 48)
    pointer(field, 'pointermove', 66, 85)
    await flushPromises()
    expect(played).toContain('wrong')
    expect(w.find('.tr-walker.wobble').exists()).toBe(true)
    expect(w.find('.tr-fb').text()).toContain('Weg verloren')
    // while the finger is down the walker does not move any more, and one stray is one mistake
    pointer(field, 'pointermove', 72, 47)
    expect(played.filter((p) => p === 'wrong')).toHaveLength(1)
    pointer(field, 'pointerup', 72, 47)
    await tick(700)
    expect(w.find('.tr-walker.wobble').exists()).toBe(false)
    await follow(w, road(0, 'berge').slice(2))
    expect(useTaskProgress().parts.value).toBe(1)
  })

  it('skipping a bend with the finger does not bring the walker ahead; a finger put down beside the road does nothing', async () => {
    const w = await open()
    const field = w.find('.tr-field').element
    pointer(field, 'pointerdown', 90, 40) // far ahead on the road
    pointer(field, 'pointermove', 90, 40)
    pointer(field, 'pointerup', 90, 40)
    expect(useTaskProgress().parts.value).toBe(0)
    pointer(field, 'pointerdown', 70, 90)
    pointer(field, 'pointermove', 71, 90)
    pointer(field, 'pointerup', 71, 90)
    expect(played).not.toContain('wrong')
    expect(w.findAll('.tr-goal.lit')).toHaveLength(0)
  })

  it('both roads of round 1 bring round 2 with four roads; all of them earn three stars without a stray', async () => {
    const w = await open()
    await follow(w, road(0, 'berge'))
    await follow(w, road(0, 'fluss'))
    await tick(1700)
    expect(w.find('.tr-round').text()).toContain('Runde 2 von 2')
    expect(w.findAll('.tr-walker')).toHaveLength(4)
    for (const id of ['berge', 'fluss', 'palmen', 'huegel']) await follow(w, road(1, id))
    await tick(1100)
    expect(useTaskProgress().parts.value).toBe(6)
    expect(useTaskProgress().finished.value).toBe(true)
    expect(w.text()).toContain('Alle Wege führen vom Turm hinaus!')
    await w.find('.gd button').trigger('click')
    expect(w.emitted('done')).toEqual([[3]])
    expect(problems()).toEqual([])
  })

  it('strays cost stars: four strays two stars, nine strays one star', async () => {
    for (const [strays, stars] of [[4, 2], [9, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      const field = w.find('.tr-field').element
      for (let i = 0; i < strays; i++) {
        pointer(field, 'pointerdown', 54, 50)
        pointer(field, 'pointermove', 60, 49)
        pointer(field, 'pointermove', 60, 90)
        pointer(field, 'pointerup', 60, 90)
      }
      await follow(w, road(0, 'berge'))
      await follow(w, road(0, 'fluss'))
      await tick(1700)
      for (const id of ['berge', 'fluss', 'palmen', 'huegel']) await follow(w, road(1, id))
      await tick(1100)
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${strays} strays`).toEqual([[stars]])
      w.unmount()
    }
  })

  it('without a finger the keyboard walks a road (Enter on its goal); a mouse click does not', async () => {
    const w = await open()
    const keys = w.findAll('.tr-key')
    expect(keys).toHaveLength(2)
    expect(keys[0]!.attributes('aria-label')).toContain('bei den Bergen')
    press(keys[0]!.element)
    expect(useTaskProgress().parts.value).toBe(0)
    await keys[0]!.trigger('click')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.findAll('.tr-key')[0]!.attributes('aria-label')).toContain('gegangen')
    await w.findAll('.tr-key')[1]!.trigger('click')
    await tick(1700)
    expect(w.find('.tr-round').text()).toContain('Runde 2 von 2')
  })

  it('speaks English', async () => {
    const w = await open('en')
    expect(w.find('.tr-count').text()).toBe('Roads: 0 of 2')
    await follow(w, road(0, 'berge'))
    expect(w.find('.tr-fb').text()).toContain('at the mountains')
  })
})
