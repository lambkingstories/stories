/**
 * The four new games of "The People in the Desert" (`arme`, `richter`, `signal`, `traube`): each is mounted with sample data and used: right and wrong moves, the rounds, the goal for the stars of "Go on"
 * (`useTaskProgress`), the end with its stars, German and English words.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import useTaskProgress from '@/use/useTaskProgress'
import GameArms from '@/components/molecules/games/GameArms.vue'
import GameJudges from '@/components/molecules/games/GameJudges.vue'
import GameSignal from '@/components/molecules/games/GameSignal.vue'
import GameGrapes from '@/components/molecules/games/GameGrapes.vue'
import type { ArmsGame, GrapesGame, JudgesGame, SignalGame } from '@/types/adventure'

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

const rung: string[] = []
class FakeAudio {
  src: string
  volume = 1
  currentTime = 0
  preload = ''
  constructor(src: string) {
    this.src = src
  }
  play() {
    rung.push(this.src)
    return Promise.resolve()
  }
  pause() {}
}

const mk = (locale: 'de' | 'en') => createI18n({ legacy: false, locale, fallbackLocale: 'de', messages: messages as never, missingWarn: false, fallbackWarn: false })
const opts = (locale: 'de' | 'en' = 'de') => ({ global: { plugins: [mk(locale)], stubs: { RouterLink: true } }, attachTo: document.body })

let warnings: string[] = []
beforeEach(() => {
  played.length = 0
  rung.length = 0
  warnings = []
  useTaskProgress().reset()
  vi.useFakeTimers()
  vi.stubGlobal('Audio', FakeAudio)
  vi.spyOn(console, 'warn').mockImplementation((...a) => {
    warnings.push(a.map(String).join(' '))
  })
  vi.spyOn(console, 'error').mockImplementation((...a) => {
    warnings.push('ERROR ' + a.map(String).join(' '))
  })
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})
const problems = () => warnings.filter((w) => /not defined on instance|is not a function|Unhandled error|ERROR/.test(w))
const tick = async (ms: number) => {
  await vi.advanceTimersByTimeAsync(ms)
  await flushPromises()
}

// ---------------------------------------------------------------- hold the arms
describe('Die Arme des Mose (arme)', () => {
  const game: ArmsGame = {
    background: 'images/x/hang.webp',
    poses: ['images/x/m1.webp', 'images/x/m2.webp', 'images/x/m3.webp'],
    moses: { label: 'Mose auf seinem Stein', w: 46, x: 50, y: 90 },
    helpers: [
      { id: 'aaron', image: 'images/x/aaron.webp', label: 'Aaron', w: 24, x: 20, y: 92 },
      { id: 'hur', image: 'images/x/hur.webp', label: 'Hur', w: 24, x: 80, y: 92 }
    ],
    rounds: [
      { hint: 'Halte den Finger auf Mose.', helpers: false, goal: 3, sink: 0.2 },
      { hint: 'Jetzt helfen Aaron und Hur.', helpers: true, goal: 3, sink: 0.28 }
    ]
  }
  const mountIt = (locale: 'de' | 'en' = 'de') => mount(GameArms, { props: { game }, ...opts(locale) })

  it('the goal is every second of every round; Moses, three pictures and the big hold button are there', () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(6)
    expect(w.find('button.gm-moses').exists()).toBe(true)
    expect(w.findAll('img.gm-pose')).toHaveLength(3)
    expect(w.find('button.gm-hold').exists()).toBe(true)
    expect(w.findAll('button.gm-helper')).toHaveLength(0)
    expect(w.text()).toContain('Halte den Finger auf Mose.')
    expect(problems()).toEqual([])
  })

  it('holding lifts the arms and counts the seconds; the first round ends, the helpers come in the second', async () => {
    const w = mountIt()
    await w.find('button.gm-hold').trigger('pointerdown')
    await tick(1500)
    expect(w.findAll('img.gm-pose')[2]!.classes()).toContain('on')
    await tick(2500)
    expect(useTaskProgress().parts.value).toBeGreaterThanOrEqual(3)
    expect(played).toContain('right')
    expect(w.text()).toContain('Die Sonne geht unter')
    await tick(2500)
    expect(w.text()).toContain('Runde 2')
    expect(w.findAll('button.gm-helper')).toHaveLength(2)
    expect(w.find('button.gm-hold').exists()).toBe(false)
    expect(problems()).toEqual([])
  })

  it('in round 2 the helpers are tapped one after the other; the same man twice is a cross; the end gives three stars when the arms never sank', async () => {
    const w = mountIt()
    await w.find('button.gm-hold').trigger('pointerdown')
    await tick(6500)
    const [aaron, hur] = w.findAll('button.gm-helper')
    await aaron!.trigger('click')
    await aaron!.trigger('click')
    expect(w.text()).toContain('der andere dran')
    expect(w.find('.gm-cross').exists()).toBe(true)
    await tick(1000)
    for (let i = 0; i < 30; i++) {
      await (i % 2 === 0 ? hur! : aaron!).trigger('click')
      await tick(350)
      if (w.find('.gd').exists()) break
    }
    await tick(4000)
    expect(w.find('.gd').exists()).toBe(true)
    expect(played).toContain('star')
    expect(problems()).toEqual([])
  })

  it('shows English words', () => {
    const w = mountIt('en')
    expect(w.find('button.gm-hold').text()).toContain('Hold the hands of Moses up')
  })
})

// ---------------------------------------------------------------- share the cases
describe('Fälle zuteilen (richter)', () => {
  const game: JudgesGame = {
    background: 'images/x/platz.webp',
    seats: [
      { id: 'r1', image: 'images/x/r1.webp', label: 'Erster Richter', w: 16, x: 20, y: 80 },
      { id: 'r2', image: 'images/x/r2.webp', label: 'Zweiter Richter', w: 16, x: 45, y: 80 },
      { id: 'mose', image: 'images/x/mose.webp', label: 'Mose', w: 19, x: 80, y: 82, moses: true }
    ],
    cases: [
      { id: 'krug', image: 'images/x/f1.webp', label: 'Krug', weight: 'small' },
      { id: 'lamm', image: 'images/x/f2.webp', label: 'Lamm', weight: 'small' },
      { id: 'brunnen', image: 'images/x/f5.webp', label: 'Brunnen', weight: 'great' }
    ],
    caseW: 22,
    rounds: [
      { hint: 'Erst ein Fall, dann ein Richter.', cases: ['krug', 'brunnen'] },
      { hint: 'Noch einmal.', cases: ['lamm', 'brunnen'] }
    ]
  }
  const mountIt = (locale: 'de' | 'en' = 'de') => mount(GameJudges, { props: { game }, ...opts(locale) })

  it('the goal is every case of every round; seats and cases are there', () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(4)
    expect(w.findAll('button.gm-seat')).toHaveLength(3)
    expect(w.findAll('button.gm-case')).toHaveLength(2)
    expect(w.text()).toContain('Erst ein Fall, dann ein Richter.')
    expect(problems()).toEqual([])
  })

  it('a seat without a chosen case asks for a case; a small case goes to a man, a great one to Moses; a wrong seat is a cross and a mistake', async () => {
    const w = mountIt()
    const [r1, , mose] = w.findAll('button.gm-seat')
    await r1!.trigger('click')
    expect(w.text()).toContain('zuerst auf einen Fall')
    await w.findAll('button.gm-case')[0]!.trigger('click') // krug (small)
    await mose!.trigger('click')
    expect(played).toContain('wrong')
    expect(w.text()).toContain('kleine Sache')
    expect(w.find('.gm-cross').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(0)
    await r1!.trigger('click')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.findAll('button.gm-case')).toHaveLength(1)
    await w.find('button.gm-case').trigger('click') // brunnen (great)
    await r1!.trigger('click')
    expect(w.text()).toContain('große Sache')
    expect(useTaskProgress().parts.value).toBe(1)
    await mose!.trigger('click')
    expect(useTaskProgress().parts.value).toBe(2)
    expect(problems()).toEqual([])
  })

  it('the second round comes, and the end gives two stars after a mistake', async () => {
    const w = mountIt()
    const seats = () => w.findAll('button.gm-seat')
    await w.findAll('button.gm-case')[0]!.trigger('click')
    await seats()[0]!.trigger('click')
    await w.find('button.gm-case').trigger('click')
    await seats()[2]!.trigger('click')
    await tick(3000)
    expect(w.text()).toContain('Runde 2')
    await w.findAll('button.gm-case')[0]!.trigger('click') // lamm
    await seats()[1]!.trigger('click')
    await w.find('button.gm-case').trigger('click') // brunnen
    await seats()[2]!.trigger('click')
    await tick(3000)
    expect(w.find('.gd').exists()).toBe(true)
    expect(played).toContain('star')
    expect(useTaskProgress().parts.value).toBe(4)
    expect(problems()).toEqual([])
  })
})

// ---------------------------------------------------------------- the silver trumpets
describe('Trompetenzeichen (signal)', () => {
  const game: SignalGame = {
    background: 'images/x/lager.webp',
    priests: { image: 'images/x/priester.webp', label: 'Zwei Priester', w: 50, x: 50, y: 90 },
    sounds: {
      all: { file: 'audio/x/beide.mp3', seconds: 2 },
      leaders: { file: 'audio/x/eine.mp3', seconds: 1.5 },
      break: { file: 'audio/x/aufbruch.mp3', seconds: 2 }
    },
    choices: [
      { id: 'all', image: 'images/x/a1.webp', label: 'Das ganze Volk versammelt sich' },
      { id: 'leaders', image: 'images/x/a2.webp', label: 'Nur die Anführer kommen' },
      { id: 'break', image: 'images/x/a3.webp', label: 'Das Lager bricht auf' }
    ],
    rounds: [
      { hint: 'Höre und tippe.', questions: [['leaders']] },
      { hint: 'Drei Zeichen.', questions: [['all', 'break', 'leaders']] }
    ]
  }
  const mountIt = (locale: 'de' | 'en' = 'de') => mount(GameSignal, { props: { game }, ...opts(locale) })
  const choices = (w: ReturnType<typeof mountIt>) => w.findAll('button.gm-choice')

  it('the goal is every question; the answers wait until the signal has been heard', async () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(2)
    expect(choices(w)).toHaveLength(3)
    expect(choices(w)[0]!.attributes('disabled')).toBeDefined()
    await w.find('button.adv-btn, button').trigger('click')
    expect(w.text()).not.toContain('Welches Zeichen')
    await tick(3000)
    expect(rung).toEqual(['/audio/x/eine.mp3'])
    expect(choices(w)[0]!.attributes('disabled')).toBeUndefined()
    expect(problems()).toEqual([])
  })

  it('a wrong picture is a cross and a mistake; the right one is counted; round 2 wants the row in the same order', async () => {
    const w = mountIt()
    const listen = () => w.findAll('button').find((b) => /Anhören|Noch einmal hören/.test(b.text()))!
    await listen().trigger('click')
    await tick(3000)
    await choices(w)[0]!.trigger('click') // all (wrong, expected leaders)
    expect(played).toContain('wrong')
    expect(w.find('.gm-cross').exists()).toBe(true)
    await choices(w)[1]!.trigger('click') // leaders
    expect(useTaskProgress().parts.value).toBe(1)
    await tick(2500)
    expect(w.text()).toContain('Runde 2')
    await listen().trigger('click')
    await tick(8500)
    expect(rung.slice(-3)).toEqual(['/audio/x/beide.mp3', '/audio/x/aufbruch.mp3', '/audio/x/eine.mp3'])
    await choices(w)[0]!.trigger('click') // all
    await choices(w)[2]!.trigger('click') // break
    expect(useTaskProgress().parts.value).toBe(1)
    await choices(w)[1]!.trigger('click') // leaders
    expect(useTaskProgress().parts.value).toBe(2)
    await tick(3000)
    expect(w.find('.gd').exists()).toBe(true)
    expect(played).toContain('star')
    expect(problems()).toEqual([])
  })
})

// ---------------------------------------------------------------- carry the grapes
describe('Die Traube tragen (traube)', () => {
  const game: GrapesGame = {
    background: 'images/x/weg.webp',
    men: [
      { image: 'images/x/m1.webp', label: 'Hinten', w: 18, x: 30, y: 78 },
      { image: 'images/x/m2.webp', label: 'Vorn', w: 18, x: 70, y: 78 }
    ],
    pole: { image: 'images/x/stange.webp', label: 'Stange', w: 56, x: 50, y: 42 },
    berry: { image: 'images/x/beere.webp', w: 4 },
    berries: 6,
    rounds: [
      { hint: 'Halte die Stange gerade.', seconds: 6, wobble: 1, hills: true },
      { hint: 'Noch einmal.', seconds: 4, wobble: 0.3, hills: false }
    ]
  }
  const mountIt = (locale: 'de' | 'en' = 'de') => mount(GameGrapes, { props: { game }, ...opts(locale) })

  it('the goal is every second of the way; the pole, the men and the two buttons are there', () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(10)
    expect(w.findAll('img.gm-man')).toHaveLength(2)
    expect(w.find('.gm-pole').exists()).toBe(true)
    expect(w.findAll('button.gm-key')).toHaveLength(2)
    expect(w.text()).toContain('Beeren an der Traube: 6 von 6')
    expect(problems()).toEqual([])
  })

  it('the pole tips when nobody holds it: a berry falls (a cross, a word); the way is walked to the end, round 2 comes, the end gives stars', async () => {
    const w = mountIt()
    await tick(5900)
    expect(played).toContain('wrong')
    expect(w.text()).toContain('Beere ist abgefallen')
    await tick(4000)
    expect(w.text()).toContain('Runde 2')
    await tick(5000)
    expect(w.find('.gd').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(10)
    expect(played).toContain('star')
    expect(problems()).toEqual([])
  })

  it('a held button is shown as pressed and lets go again', async () => {
    const w = mountIt()
    const back = w.findAll('button.gm-key')[0]!
    await back.trigger('pointerdown')
    expect(back.classes()).toContain('on')
    await back.trigger('pointerup')
    expect(back.classes()).not.toContain('on')
  })

  it('shows English words', () => {
    const w = mountIt('en')
    expect(w.text()).toContain('Lift the back end')
  })
})
