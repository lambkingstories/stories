/**
 * The three new games of "Zachäus und Lazarus" (`klettern` = GameClimb, `halbieren` = GameHalve, `loesen` = GameUnwrap): each is mounted with sample data and played through: right and wrong taps,
 * dragging, the rounds, the goal for the stars of "Go on" (`useTaskProgress`), the end with its stars and the words of the Bible, German, English and Spanish words, and the keyboard.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import spanish from '@/i18n/app.es'
import useTaskProgress from '@/use/useTaskProgress'
import GameClimb from '@/components/molecules/games/GameClimb.vue'
import GameHalve from '@/components/molecules/games/GameHalve.vue'
import GameUnwrap from '@/components/molecules/games/GameUnwrap.vue'
import { partialStars } from '@/utils/adventureScore'
import { climbProblems, halveProblems, unwrapProblems } from '@/utils/zachaeusGames'
import { zachaeus } from '@/data/adventures/zachaeus'
import type { ClimbGame, HalveGame, UnwrapGame } from '@/types/adventure'

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
const problems = () => warnings.filter((w) => /not defined on instance|is not a function|Unhandled error|ERROR|Missing required prop/.test(w))
const tick = async (ms: number) => {
  await vi.advanceTimersByTimeAsync(ms)
  await flushPromises()
}
const count = (name: string) => played.filter((p) => p === name).length
const boxOf100 = () => vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100, x: 0, y: 0, toJSON: () => ({}) })
const pointer = (el: Element | Window, type: 'pointerdown' | 'pointermove' | 'pointerup', x = 0, y = 0) =>
  el.dispatchEvent(new MouseEvent(type, { bubbles: true, button: 0, buttons: type === 'pointerup' ? 0 : 1, clientX: x, clientY: y }))

// the sample data are the data of the adventure (so the test also plays what the child plays)
const CLIMB: ClimbGame = zachaeus.stages[1]!.task.climb!
const HALVE: HalveGame = zachaeus.stages[3]!.task.halve!
const UNWRAP: UnwrapGame = zachaeus.stages[8]!.task.unwrap!

// ---------------------------------------------------------------- up the tree
describe('Auf den Baum (klettern)', () => {
  const mountIt = (game: ClimbGame = CLIMB, locale: 'de' | 'en' | 'es' = 'de') => mount(GameClimb, { props: { game }, ...opts(locale) })
  type W = ReturnType<typeof mountIt>
  const branch = (w: W, side: 'L' | 'R', n: number) => w.find(`button[aria-label="${side === 'L' ? 'Linker' : 'Rechter'} Ast, Höhe ${n}"]`)
  /** Climb a whole round without a mistake. */
  const climbRound = async (w: W, r: number) => {
    const levels = CLIMB.rounds[r]!.levels
    for (const [i, lv] of levels.entries()) await branch(w, lv.strong === 'l' ? 'L' : 'R', i + 1).trigger('click')
  }

  it('the sample data are in order; the goal is every height (3 + 4); two branches of the first height, the hint, the round', () => {
    expect(climbProblems(CLIMB)).toEqual([])
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(7)
    expect(w.findAll('button.gm-branch')).toHaveLength(2)
    expect(branch(w, 'L', 1).exists()).toBe(true)
    expect(branch(w, 'R', 1).exists()).toBe(true)
    expect(w.text()).toContain('Wähle immer den starken Ast.')
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.text()).toContain('Höhe: 0 von 3')
    expect(w.find('.gm-climber').attributes('style')).toContain('top: 94%')
    expect(problems()).toEqual([])
  })

  it('the weak branch creaks and wobbles, Zacchaeus stays (a cross and a word, one mistake per height)', async () => {
    const w = mountIt()
    // the strong branch of height 1 is on the right
    await branch(w, 'L', 1).trigger('click')
    expect(branch(w, 'L', 1).classes()).toContain('creak')
    expect(branch(w, 'L', 1).find('.gm-mark').exists()).toBe(true)
    expect(w.text()).toContain('Knack! Der Ast ist zu dünn.')
    expect(count('wrong')).toBe(1)
    expect(w.find('.gm-climber').attributes('style')).toContain('top: 94%')
    expect(useTaskProgress().parts.value).toBe(0)
    expect(w.text()).toContain('Höhe: 0 von 3')
  })

  it('the strong branch: he climbs, the next height shows, the climbed branch stays', async () => {
    const w = mountIt()
    await branch(w, 'R', 1).trigger('click')
    expect(played).toContain('snap')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.text()).toContain('Höhe: 1 von 3')
    expect(w.find('.gm-climber').attributes('style')).toContain('top: 70%')
    expect(branch(w, 'L', 2).exists()).toBe(true)
    expect(branch(w, 'R', 1).exists()).toBe(false)
    expect(w.findAll('.gm-branch.done')).toHaveLength(1)
  })

  it('at the top the view down the road shows, then round 2 with four heights, then the end with three stars and the words of the Bible', async () => {
    const w = mountIt()
    await climbRound(w, 0)
    expect(played).toContain('right')
    await tick(700)
    expect(w.find('.gm-view').exists()).toBe(true)
    expect(w.text()).toContain('Oben!')
    await tick(2200)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.text()).toContain('Höhe: 0 von 4')
    expect(w.find('.gm-view').exists()).toBe(false)
    await climbRound(w, 1)
    await tick(2500)
    expect(w.text()).toContain('Maulbeerbaum, auf dass er ihn sähe')
    expect(played).toContain('star')
    expect(useTaskProgress().finished.value).toBe(true)
    await w.find('button.adv-btn').trigger('click')
    expect(w.emitted('done')![0]).toEqual([3])
    expect(problems()).toEqual([])
  })

  it('mistakes cost stars: three weak branches give two stars', async () => {
    const w = mountIt()
    const levels = CLIMB.rounds[0]!.levels
    for (const [i, lv] of levels.entries()) {
      await branch(w, lv.strong === 'l' ? 'R' : 'L', i + 1).trigger('click')
      await branch(w, lv.strong === 'l' ? 'L' : 'R', i + 1).trigger('click')
    }
    await tick(2900)
    await climbRound(w, 1)
    await tick(2500)
    await w.find('button.adv-btn').trigger('click')
    expect(w.emitted('done')![0]).toEqual([2])
  })

  it('"Go on" gives one star after a third of the heights; English and Spanish words', async () => {
    const w = mountIt()
    const goal = useTaskProgress().goal.value
    await climbRound(w, 0)
    expect(partialStars(useTaskProgress().parts.value, goal)).toBe(1)
    const en = mountIt(CLIMB, 'en')
    expect(en.find('button[aria-label="Left branch, height 1"]').exists()).toBe(true)
    expect(en.text()).toContain('Height: 0 of 3')
    const es = mountIt(CLIMB, 'es')
    expect(es.find('button[aria-label="Rama izquierda, altura 1"]').exists()).toBe(true)
    expect(es.text()).toContain('Altura: 0 de 3')
  })
})

// ---------------------------------------------------------------- half to the poor
describe('Die Hälfte den Armen (halbieren)', () => {
  const mountIt = (game: HalveGame = HALVE, locale: 'de' | 'en' | 'es' = 'de') => {
    boxOf100()
    return mount(GameHalve, { props: { game }, ...opts(locale) })
  }
  type W = ReturnType<typeof mountIt>
  const divider = (w: W) => w.find('button.gm-divider')
  const done = (w: W) => w.findAll('button.adv-btn').find((b) => b.text() === 'Fertig')!
  const stepRight = (w: W) => w.find('button[aria-label="Teiler nach rechts schieben"]')
  const stepLeft = (w: W) => w.find('button[aria-label="Teiler nach links schieben"]')
  const goTo = async (w: W, k: number) => {
    let now = Number(divider(w).attributes('aria-valuenow'))
    while (now < k) {
      await stepRight(w).trigger('click')
      now++
    }
    while (now > k) {
      await stepLeft(w).trigger('click')
      now--
    }
  }

  it('the sample data are in order; ten coins, the divider after two, the poor part is tinted, the names under the bowls', () => {
    expect(halveProblems(HALVE)).toEqual([])
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(2)
    expect(w.findAll('.gm-coin')).toHaveLength(10)
    expect(divider(w).attributes('aria-valuenow')).toBe('2')
    expect(divider(w).attributes('aria-valuetext')).toBe('2 Münzen links, 8 rechts')
    expect(w.findAll('.gm-coin.poor')).toHaveLength(8)
    expect(w.text()).toContain('Zachäus')
    expect(w.text()).toContain('Die Armen')
    expect(w.text()).toContain('Teile die Münzen genau in der Mitte.')
    expect(problems()).toEqual([])
  })

  it('a wrong "Done" jingles and says where to go (arrow and numbers); the same place twice is one mistake', async () => {
    const w = mountIt()
    await done(w).trigger('click')
    expect(w.text()).toContain('Noch nicht die Mitte: 2 links, 8 rechts. Schiebe den Teiler nach rechts.')
    expect(w.find('.gm-arrow').text()).toBe('→')
    expect(count('wrong')).toBe(1)
    expect(useTaskProgress().parts.value).toBe(0)
    await goTo(w, 7)
    await done(w).trigger('click')
    expect(w.text()).toContain('Schiebe den Teiler nach links.')
    expect(w.find('.gm-arrow').text()).toBe('←')
  })

  it('dragging the divider snaps it between two coins', async () => {
    const w = mountIt()
    pointer(divider(w).element, 'pointerdown', 20, 50)
    pointer(window, 'pointermove', 51, 50)
    pointer(window, 'pointerup', 51, 50)
    await flushPromises()
    expect(divider(w).attributes('aria-valuenow')).toBe('5')
    expect(divider(w).attributes('style')).toContain('left: 50%')
    expect(w.findAll('.gm-coin.poor')).toHaveLength(5)
    expect(played).toContain('tap')
  })

  it('the keyboard: arrows move the divider, Enter is "Done"', async () => {
    const w = mountIt()
    for (let i = 0; i < 3; i++) await divider(w).trigger('keydown', { key: 'ArrowRight' })
    expect(divider(w).attributes('aria-valuenow')).toBe('5')
    await divider(w).trigger('keydown', { key: 'Enter' })
    expect(w.text()).toContain('Genau die Hälfte: 5 und 5!')
  })

  it('exactly the middle: the coins roll into the bowls, the poor are glad, round 2 with fourteen coins, then the end with three stars', async () => {
    const w = mountIt()
    await goTo(w, 5)
    await done(w).trigger('click')
    expect(w.find('.gm-poor.glad').exists()).toBe(true)
    expect(w.find('.gm-poor .gm-mark').exists()).toBe(true)
    expect(w.findAll('.gm-coin.rolled')).toHaveLength(10)
    expect(played).toContain('coin')
    expect(useTaskProgress().parts.value).toBe(1)
    await tick(2900)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.findAll('.gm-coin')).toHaveLength(14)
    expect(divider(w).attributes('aria-valuenow')).toBe('11')
    await goTo(w, 7)
    await done(w).trigger('click')
    await tick(2500)
    expect(w.text()).toContain('die Hälfte meiner Güter gebe ich den Armen')
    await w.find('button.adv-btn').trigger('click')
    expect(w.emitted('done')![0]).toEqual([3])
    expect(problems()).toEqual([])
  })

  it('"Help" shows the middle for a moment and leaves at most two stars', async () => {
    const w = mountIt()
    await w.findAll('button.adv-btn').find((b) => b.text() === 'Hilfe')!.trigger('click')
    expect(w.find('.gm-middle').exists()).toBe(true)
    expect(w.find('.gm-middle').attributes('style')).toContain('left: 50%')
    await tick(3100)
    expect(w.find('.gm-middle').exists()).toBe(false)
    await goTo(w, 5)
    await done(w).trigger('click')
    await tick(2900)
    await goTo(w, 7)
    await done(w).trigger('click')
    await tick(2500)
    await w.find('button.adv-btn').trigger('click')
    expect(w.emitted('done')![0]).toEqual([2])
  })

  it('English and Spanish words', async () => {
    const en = mountIt(HALVE, 'en')
    expect(en.text()).toContain('The poor')
    expect(en.find('button.gm-divider').attributes('aria-valuetext')).toBe('2 coins on the left, 8 on the right')
    await en.findAll('button.adv-btn').find((b) => b.text() === 'Done')!.trigger('click')
    expect(en.text()).toContain('Move the divider to the right.')
    const es = mountIt(HALVE, 'es')
    expect(es.text()).toContain('Los pobres')
    expect(es.findAll('button.adv-btn').some((b) => b.text() === 'Listo')).toBe(true)
  })
})

// ---------------------------------------------------------------- loose him
describe('Löst ihn auf (loesen)', () => {
  const mountIt = (game: UnwrapGame = UNWRAP, locale: 'de' | 'en' | 'es' = 'de') => {
    boxOf100()
    return mount(GameUnwrap, { props: { game }, ...opts(locale) })
  }
  type W = ReturnType<typeof mountIt>
  const end = (w: W, label: string) => w.findAll('button.gm-end').find((b) => (b.attributes('aria-label') ?? '').startsWith(`${label}:`))
  const tap3 = async (w: W, label: string) => {
    for (let i = 0; i < 3; i++) await end(w, label)!.trigger('click')
  }
  const help = (w: W) => w.findAll('button.adv-btn').find((b) => b.text() === 'Hilfe')!

  it('the sample data are in order; five loose ends, the one on the head is shut; the goal is five', () => {
    expect(unwrapProblems(UNWRAP)).toEqual([])
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(5)
    expect(w.findAll('button.gm-end')).toHaveLength(5)
    expect(w.findAll('button.gm-end.shut')).toHaveLength(1)
    expect(end(w, 'Das Tuch am Kopf')!.attributes('aria-label')).toBe('Das Tuch am Kopf: das kommt später')
    expect(w.text()).toContain('Tücher gelöst: 0 von 5')
    expect(problems()).toEqual([])
  })

  it('three taps loose a strip (it slides and falls, a rustle); the head cloth waits until two are off', async () => {
    const w = mountIt()
    await end(w, 'Das Tuch am Kopf')!.trigger('click')
    expect(w.text()).toContain('Löse erst noch 2 andere Tücher')
    expect(useTaskProgress().parts.value).toBe(0)
    await end(w, 'Das Tuch an den Händen')!.trigger('click')
    expect(w.text()).toContain('Tücher gelöst: 0 von 5')
    await end(w, 'Das Tuch an den Händen')!.trigger('click')
    await end(w, 'Das Tuch an den Händen')!.trigger('click')
    expect(played).toContain('flip')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.find('.gm-strip.fall').exists()).toBe(true)
    expect(end(w, 'Das Tuch an den Händen')).toBeUndefined()
    await tick(700)
    expect(w.find('.gm-strip.fall').exists()).toBe(false)
    await end(w, 'Das Tuch am Kopf')!.trigger('click')
    expect(w.text()).toContain('Löse erst noch ein anderes Tuch')
    await tap3(w, 'Das Tuch an den Füßen')
    expect(w.findAll('button.gm-end.shut')).toHaveLength(0)
  })

  it('pulling along the strip takes it off; pulling the other way does nothing', async () => {
    const w = mountIt()
    const s = UNWRAP.strips[0]!
    const b = end(w, s.label)!
    // against the pull: nothing
    pointer(b.element, 'pointerdown', 50, 50)
    pointer(window, 'pointermove', 50 - s.dir[0] * 30, 50)
    pointer(window, 'pointerup', 50 - s.dir[0] * 30, 50)
    await flushPromises()
    expect(useTaskProgress().parts.value).toBe(0)
    // along the pull (the box is 100 x 100 pixels: 30 pixels to the right is 30 % of the width)
    const sign = s.dir[0] < 0 ? -1 : 1
    pointer(end(w, s.label)!.element, 'pointerdown', 50, 50)
    pointer(window, 'pointermove', 50 + sign * 10, 52)
    await flushPromises()
    expect(useTaskProgress().parts.value).toBe(0)
    pointer(window, 'pointermove', 50 + sign * 30, 56)
    pointer(window, 'pointerup', 50 + sign * 30, 56)
    await flushPromises()
    expect(useTaskProgress().parts.value).toBe(1)
    expect(end(w, s.label)).toBeUndefined()
  })

  it('all five off: Lazarus raises his hand, Mary runs to him, three stars and the words of the Bible', async () => {
    const w = mountIt()
    for (const s of UNWRAP.strips) await tap3(w, s.label)
    expect(useTaskProgress().parts.value).toBe(5)
    await tick(800)
    expect(w.find('.gm-maria').exists()).toBe(true)
    expect(w.find('.gm-figure').attributes('aria-label')).toBe(UNWRAP.free.label)
    expect(w.text()).toContain('Lazarus ist frei! Maria läuft zu ihm.')
    expect(w.find('.gm-maria').attributes('style')).toContain(`left: ${UNWRAP.maria.x}%`)
    await tick(2600)
    expect(w.text()).toContain('Löset ihn auf und lasset ihn gehen!')
    expect(useTaskProgress().finished.value).toBe(true)
    await w.find('button.adv-btn').trigger('click')
    expect(w.emitted('done')![0]).toEqual([3])
    expect(problems()).toEqual([])
  })

  it('"Help" lets the open loose ends blink and leaves two stars', async () => {
    const w = mountIt()
    await help(w).trigger('click')
    expect(w.findAll('button.gm-end.blink')).toHaveLength(4)
    await tick(4100)
    expect(w.findAll('button.gm-end.blink')).toHaveLength(0)
    for (const s of UNWRAP.strips) await tap3(w, s.label)
    await tick(3300)
    await w.find('button.adv-btn').trigger('click')
    expect(w.emitted('done')![0]).toEqual([2])
  })

  it('"Go on" gives two stars after four strips; English and Spanish words', async () => {
    const w = mountIt()
    const goal = useTaskProgress().goal.value
    for (const s of UNWRAP.strips.slice(0, 4)) await tap3(w, s.label)
    expect(partialStars(useTaskProgress().parts.value, goal)).toBe(2)
    const en = mountIt(UNWRAP, 'en')
    expect(en.text()).toContain('Cloths loosed: 0 of 5')
    expect(en.findAll('button.gm-end').filter((b) => (b.attributes('aria-label') ?? '').endsWith(': pull at the loose end or tap it three times'))).toHaveLength(4)
    const es = mountIt(UNWRAP, 'es')
    expect(es.text()).toContain('Vendas sueltas: 0 de 5')
  })
})
