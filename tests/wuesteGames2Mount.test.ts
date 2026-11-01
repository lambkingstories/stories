/**
 * The seven new games of "The People in the Desert" (jugs, enough, quails, staffs, serpent, donkey, commission): each is mounted with the real data and played through with right and wrong moves:
 * the rounds, the mistakes, the goal for the stars of "Go on" (`useTaskProgress`), the end with its stars and the English words.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import useTaskProgress from '@/use/useTaskProgress'
import GameJugs from '@/components/molecules/games/GameJugs.vue'
import GameEnough from '@/components/molecules/games/GameEnough.vue'
import GameQuails from '@/components/molecules/games/GameQuails.vue'
import GameStaffs from '@/components/molecules/games/GameStaffs.vue'
import GameSerpent from '@/components/molecules/games/GameSerpent.vue'
import GameDonkey from '@/components/molecules/games/GameDonkey.vue'
import GameCommission from '@/components/molecules/games/GameCommission.vue'
import { KRUG, GENUG, WACHTELN, STAB, SCHLANGE, ESELIN, EINSETZEN } from '@/data/adventures/wuesteGames2'

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
const starsOf = (w: { find: (s: string) => { exists: () => boolean } }) => w.find('.gd-stars').exists()

describe('Wasser holen (jugs)', () => {
  it('fills at the rock, serves the thirsty, two rounds, three stars; an empty jug is a mistake', async () => {
    const w = mount(GameJugs, { props: { game: KRUG }, ...opts() })
    expect(useTaskProgress().goal.value).toBe(8)
    // mistake: a person with an empty jug
    await w.findAll('.gj-person')[0]!.trigger('click')
    expect(played).toContain('wrong')
    for (let round = 0; round < 2; round++) {
      const n = round === 0 ? 3 : 5
      expect(w.findAll('.gj-person')).toHaveLength(n)
      for (let k = 0; k < n; k++) {
        await w.find('.gj-zone').trigger('click')
        expect(w.find('.gj-jug img').attributes('src')).toContain('krug-voll')
        await w.findAll('.gj-person')[k]!.trigger('click')
        expect(w.find('.gj-jug img').attributes('src')).toContain('krug-leer')
      }
      await tick(1700)
    }
    expect(useTaskProgress().parts.value).toBe(8)
    expect(w.text()).toContain('Mose schlug auf den Felsen')
    await w.find('button.adv-btn, .gd button').trigger('click')
    expect(w.emitted('done')?.[0]).toEqual([3])
    expect(problems()).toEqual([])
  })

  it('five wrong taps still end the game (fewer stars)', async () => {
    const w = mount(GameJugs, { props: { game: KRUG }, ...opts() })
    for (let i = 0; i < 6; i++) await w.findAll('.gj-person')[0]!.trigger('click')
    for (let round = 0; round < 2; round++) {
      const n = round === 0 ? 3 : 5
      for (let k = 0; k < n; k++) {
        await w.find('.gj-zone').trigger('click')
        await w.findAll('.gj-person')[k]!.trigger('click')
      }
      await tick(1700)
    }
    await w.find('.gd button').trigger('click')
    expect(w.emitted('done')?.[0]).toEqual([1])
  })

  it('English words', async () => {
    const w = mount(GameJugs, { props: { game: KRUG }, ...opts('en') })
    expect(w.find('.wf-hint').text().length).toBeGreaterThan(10)
  })
})

describe('Genug! (enough)', () => {
  it('too early is a mistake, the right moment ends the round, two rounds', async () => {
    const w = mount(GameEnough, { props: { game: GENUG }, ...opts() })
    await tick(2000)
    await w.find('.ge-mose').trigger('click')
    expect(w.text()).toContain('Es reicht noch nicht')
    expect(played).toContain('wrong')
    await tick(8600 - 2000)
    expect(w.findAll('.ge-gift').length).toBe(8)
    await w.find('.ge-mose').trigger('click')
    expect(w.text()).toContain('Genug!')
    await tick(2000)
    // round two: need 12, every 750 ms
    expect(w.text()).toContain('Runde 2')
    await tick(9900)
    expect(w.findAll('.ge-gift').length).toBe(12)
    await w.find('.ge-mose').trigger('click')
    await tick(2000)
    expect(w.find('.gd').exists()).toBe(true)
    await w.find('.gd button').trigger('click')
    expect(w.emitted('done')?.[0]).toEqual([3])
    expect(problems()).toEqual([])
  })

  it('waiting too long: Moses calls by himself (a mistake)', async () => {
    const w = mount(GameEnough, { props: { game: GENUG }, ...opts() })
    await tick(1560 + 12 * 1000)
    expect(w.text()).toContain('Mose ruft jetzt selbst')
    expect(played).toContain('wrong')
    await tick(2000)
    expect(w.text()).toContain('Runde 2')
  })
})

describe('Wachteln (quails)', () => {
  it('every quail that is tapped hops into the basket; all caught gives three stars', async () => {
    const w = mount(GameQuails, { props: { game: WACHTELN }, ...opts() })
    expect(useTaskProgress().goal.value).toBe(20)
    for (let i = 0; i < 400 && !w.find('.gd').exists(); i++) {
      for (const b of w.findAll('.gq-quail:not([disabled])')) await b.trigger('click')
      await tick(300)
    }
    expect(w.find('.gd').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(20)
    await w.find('.gd button').trigger('click')
    expect(w.emitted('done')?.[0]).toEqual([3])
    expect(problems()).toEqual([])
  })

  it('quails that are not taken walk on, the game still ends (one star at least)', async () => {
    const w = mount(GameQuails, { props: { game: WACHTELN }, ...opts() })
    for (let i = 0; i < 200 && !w.find('.gd').exists(); i++) await tick(1000)
    expect(w.find('.gd').exists()).toBe(true)
    await w.find('.gd button').trigger('click')
    expect(w.emitted('done')?.[0]).toEqual([1])
  })
})

describe('Aarons Stab (staffs)', () => {
  it('lays twelve staffs, the night, finds Aaron among them, watches the bloom', async () => {
    const w = mount(GameStaffs, { props: { game: STAB }, ...opts() })
    expect(useTaskProgress().goal.value).toBe(13)
    const staffs = () => w.findAll('.gs-staff')
    for (let i = 0; i < 12; i++) await staffs()[i]!.trigger('click')
    expect(w.find('.gs-night').exists()).toBe(true)
    await tick(2300)
    expect(w.text()).toContain('Runde 2')
    // the seventh staff that was laid is Aaron's (place 6)
    await staffs()[0]!.trigger('click')
    expect(w.text()).toContain('trocken und kahl')
    await staffs()[STAB.aaron]!.trigger('click')
    expect(w.find('.gs-big').exists()).toBe(true)
    await w.find('.gs-big').trigger('click')
    await w.find('.gs-big').trigger('click')
    await tick(1800)
    await w.find('.gd button').trigger('click')
    expect(w.emitted('done')?.[0]).toEqual([3])
    expect(problems()).toEqual([])
  })
})

describe('Das Zeichen aus Bronze (serpent)', () => {
  it('four taps raise the pole, then six people look up', async () => {
    const w = mount(GameSerpent, { props: { game: SCHLANGE }, ...opts() })
    expect(useTaskProgress().goal.value).toBe(7)
    const pole = () => w.find('.gp-pole')
    for (let i = 0; i < 4; i++) {
      await pole().trigger('pointerdown')
      await pole().trigger('pointerup')
    }
    expect(w.find('.gp-pole.standing').exists()).toBe(true)
    await tick(1800)
    expect(w.text()).toContain('Runde 2')
    for (let i = 0; i < 6; i++) await w.findAll('.gp-person')[i]!.trigger('click')
    await tick(1600)
    await w.find('.gd button').trigger('click')
    expect(w.emitted('done')?.[0]).toEqual([3])
    expect(problems()).toEqual([])
  })
})

describe('Der Eselin folgen (donkey)', () => {
  it('three places; a tap beside the right place is a mistake', async () => {
    const w = mount(GameDonkey, { props: { game: ESELIN }, ...opts() })
    expect(useTaskProgress().goal.value).toBe(3)
    await tick(1000)
    await w.find('.gd-back').trigger('click')
    expect(w.text()).toContain('Dorthin geht die Eselin nicht')
    for (let step = 0; step < 3; step++) {
      await w.find('.gd-zone').trigger('click')
      expect(w.find('.gd-donkey.turned').exists()).toBe(true)
      if (step < 2) await tick(2100 + 1000)
    }
    await tick(1500 + 2200)
    expect(w.find('.gd').exists()).toBe(true)
    await w.find('.gd button').trigger('click')
    expect(w.emitted('done')?.[0]).toEqual([3])
    expect(problems()).toEqual([])
  })
})

describe('Josua einsetzen (commission)', () => {
  it('a tap on Joshua and a tap on the place, then the finger rests until the bar is full', async () => {
    const w = mount(GameCommission, { props: { game: EINSETZEN }, ...opts() })
    expect(useTaskProgress().goal.value).toBe(2)
    await w.find('.gc-josh').trigger('pointerdown')
    await w.find('.gc-josh').trigger('pointerup')
    expect(w.find('.gc-josh.selected').exists()).toBe(true)
    await w.find('.gc-spot').trigger('click')
    expect(w.text()).toContain('steht vor Eleasar')
    await tick(1800)
    expect(w.text()).toContain('Runde 2')
    // a finger that lets go too early starts again
    await w.find('.gc-josh').trigger('pointerdown')
    await tick(500)
    await w.find('.gc-josh').trigger('pointerup')
    expect(w.text()).toContain('Halte den Finger')
    await w.find('.gc-josh').trigger('pointerdown')
    await tick(EINSETZEN.holdMs + 200)
    expect(w.text()).toContain('Mose legt seine Hände')
    await tick(2100)
    await w.find('.gd button').trigger('click')
    expect(w.emitted('done')?.[0]).toEqual([3])
    expect(problems()).toEqual([])
  })
})
