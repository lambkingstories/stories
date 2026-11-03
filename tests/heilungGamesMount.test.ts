/**
 * The two new games of "Jesus heals" (`umkehr` = GameTurnBack, `ruf` = GameShout): each is mounted with sample data (the same as the sample blocks in the report to the leader) and played through:
 * right and wrong taps, the rounds, the time that runs out, the goal for the stars of "Go on" (`useTaskProgress`), the glow after two mistakes, the end with its stars, German and English words.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import spanish from '@/i18n/app.es'
import useTaskProgress from '@/use/useTaskProgress'
import GameTurnBack from '@/components/molecules/games/GameTurnBack.vue'
import GameShout from '@/components/molecules/games/GameShout.vue'
import { partialStars } from '@/utils/adventureScore'
import { shoutRoundProblems, turnRoundProblems } from '@/utils/heilungGames'
import type { ShoutGame, TurnBackGame } from '@/types/adventure'

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
const problems = () => warnings.filter((w) => /not defined on instance|is not a function|Unhandled error|ERROR/.test(w))
const tick = async (ms: number) => {
  await vi.advanceTimersByTimeAsync(ms)
  await flushPromises()
}
const count = (name: string) => played.filter((p) => p === name).length

const H = 'images/abenteuer/spiele/heilung/'

// ---------------------------------------------------------------- who turns back?
const UMKEHR: TurnBackGame = {
  background: `${H}umkehr/strasse.webp`,
  men: [1, 2, 3, 4, 5, 6].map((n) => ({ image: `${H}umkehr/mann-${n}.webp`, label: `Mann ${n}`, w: 9 })),
  samaritan: { image: `${H}umkehr/samariter.webp`, label: 'Der Samariter mit dem blau-weiß gestreiften Kopftuch', w: 9.5 },
  jesus: { image: `${H}umkehr/jesus.webp`, label: 'Jesus mit zwei Jüngern', w: 15, x: 9, y: 80 },
  road: { y: 78, spread: 10, startX: 22, gap: 5.4, houseX: 86 },
  rounds: [
    { hint: 'Die Männer gehen zum Haus der Priester. Tippe auf den, der umkehrt.', seconds: 4, crossing: false },
    { hint: 'Jetzt kreuzen sie sich. Achte auf den Streifen am Kopftuch.', seconds: 4, crossing: true }
  ]
}

describe('Wer kehrt um? (umkehr)', () => {
  const mountIt = (game: TurnBackGame = UMKEHR, locale: 'de' | 'en' | 'es' = 'de') => mount(GameTurnBack, { props: { game }, ...opts(locale) })
  type W = ReturnType<typeof mountIt>
  const men = (w: W) => w.findAll('button.gm-man')
  const left = (b: ReturnType<W['find']>) => Number(/left: ([\d.]+)%/.exec(b.attributes('style') ?? '')![1])
  const turned = (w: W) => w.find('button.gm-man.turned')
  /** A man who is not the one who turns back. */
  const other = (w: W) => men(w).find((b) => !b.classes().includes('turned'))!
  const toTurn = async (w: W) => {
    await tick(4000)
    expect(turned(w).exists()).toBe(true)
  }
  /** The right tap, and the run to Jesus up to the thanks. */
  const win = async (w: W) => {
    await toTurn(w)
    await turned(w).trigger('click')
    await tick(3200)
  }

  it('the sample data are in order', () => {
    for (const r of UMKEHR.rounds) expect(turnRoundProblems({ ...UMKEHR.road, jesusX: UMKEHR.jesus.x }, r)).toEqual([])
    expect(UMKEHR.men).toHaveLength(6)
  })

  it('the goal is three parts a round; ten men, Jesus, the hint and the count are there', () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(6)
    expect(men(w)).toHaveLength(10)
    expect(w.find('.gm-jesus').exists()).toBe(true)
    expect(w.text()).toContain('Tippe auf den, der umkehrt.')
    expect(w.text()).toContain('Runden geschafft: 0 von 2')
    expect(w.text()).toContain('Runde 1 von 2')
    expect(men(w)[0]!.attributes('aria-label')).toBe('Mann 1')
    expect(problems()).toEqual([])
  })

  it('the men walk to the right; the hands show clean (a tick over every man and a word); then one turns round', async () => {
    const w = mountIt()
    const left0 = men(w)[0]!.attributes('style')
    await tick(1000)
    expect(men(w)[0]!.attributes('style')).not.toBe(left0)
    expect(w.findAll('.gm-clean')).toHaveLength(0)
    await tick(1600)
    expect(w.findAll('.gm-clean')).toHaveLength(10)
    expect(w.text()).toContain('Ihre Hände sind rein!')
    expect(played).toContain('bead')
    expect(turned(w).exists()).toBe(false)
    await tick(1500)
    expect(w.findAll('.gm-clean')).toHaveLength(0)
    expect(turned(w).exists()).toBe(true)
    expect(turned(w).attributes('aria-label')).toContain('kehrt um')
    expect(w.text()).toContain('Einer kehrt um! Tippe auf ihn.')
  })

  it('a tap before the turn only says "wait": no mistake, no dull sound', async () => {
    const w = mountIt()
    await tick(1000)
    await men(w)[3]!.trigger('click')
    expect(w.text()).toContain('Warte noch')
    expect(count('wrong')).toBe(0)
    expect(useTaskProgress().parts.value).toBe(0)
  })

  it('a wrong man wobbles, gets a cross, a word and a dull sound; the same man twice is one mistake; the next one counts', async () => {
    const w = mountIt()
    await toTurn(w)
    const first = other(w)
    const label = first.attributes('aria-label')
    await first.trigger('click')
    expect(count('wrong')).toBe(1)
    expect(w.find('.gm-cross').exists()).toBe(true)
    expect(men(w).find((b) => b.attributes('aria-label') === label)!.classes()).toContain('wobble')
    expect(w.text()).toContain('Das war nicht der Mann, der umkehrt')
    expect(useTaskProgress().parts.value).toBe(1)
    await men(w).find((b) => b.attributes('aria-label') === label)!.trigger('click')
    expect(count('wrong')).toBe(2)
    expect(useTaskProgress().parts.value).toBe(1)
    await tick(1000)
    expect(w.find('.gm-cross').exists()).toBe(false)
    const second = men(w).find((b) => !b.classes().includes('turned') && b.attributes('aria-label') !== label)!
    await second.trigger('click')
    expect(useTaskProgress().parts.value).toBe(2)
  })

  it('two mistakes in the first round give "Go on (1 star)" (a third of the task); one is not enough', async () => {
    const w = mountIt()
    await toTurn(w)
    const goal = useTaskProgress().goal.value
    const labels = men(w).filter((b) => !b.classes().includes('turned')).map((b) => b.attributes('aria-label'))
    await men(w).find((b) => b.attributes('aria-label') === labels[0])!.trigger('click')
    expect(partialStars(useTaskProgress().parts.value, goal)).toBe(0)
    await men(w).find((b) => b.attributes('aria-label') === labels[1])!.trigger('click')
    expect(partialStars(useTaskProgress().parts.value, goal)).toBe(1)
    // more mistakes bring no further parts
    await men(w).find((b) => b.attributes('aria-label') === labels[2])!.trigger('click')
    expect(useTaskProgress().parts.value).toBe(2)
  })

  it('after two mistakes the Samaritan glows and a tip is given', async () => {
    const w = mountIt()
    await toTurn(w)
    expect(turned(w).classes()).not.toContain('glow')
    const labels = men(w).filter((b) => !b.classes().includes('turned')).map((b) => b.attributes('aria-label'))
    await men(w).find((b) => b.attributes('aria-label') === labels[0])!.trigger('click')
    await men(w).find((b) => b.attributes('aria-label') === labels[1])!.trigger('click')
    expect(turned(w).classes()).toContain('glow')
    expect(w.text()).toContain('gestreiften Kopftuch')
  })

  it('when the time is over: a mistake, a word, a dull sound; the round begins again with the men at the start', async () => {
    const w = mountIt()
    const left0 = left(men(w)[0]!)
    await toTurn(w)
    await tick(4000)
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('Zu spät!')
    expect(useTaskProgress().parts.value).toBe(1)
    // the men stand still while the word is read; the Samaritan is not tappable any more
    expect(men(w).every((b) => b.attributes('disabled') !== undefined)).toBe(true)
    await tick(1900)
    expect(w.text()).not.toContain('Zu spät!')
    expect(turned(w).exists()).toBe(false)
    // back at the start (a tenth of a second has gone by since the new try began)
    expect(left(men(w)[0]!)).toBeLessThan(left0 + 1)
    expect(men(w).every((b) => b.attributes('disabled') === undefined)).toBe(true)
    // and it can be played again
    await win(w)
    expect(w.find('.gm-bubble').exists()).toBe(true)
  })

  it('the right man: a bright sound, he runs to Jesus, kneels and says "Danke!"; the round counts all three parts', async () => {
    const w = mountIt()
    await toTurn(w)
    const xBefore = turned(w).attributes('style')
    await turned(w).trigger('click')
    expect(played).toContain('right')
    expect(w.find('.gm-bubble').exists()).toBe(false)
    await tick(500)
    expect(turned(w).attributes('style')).not.toBe(xBefore)
    await tick(2700)
    expect(turned(w).classes()).toContain('kneel')
    expect(w.find('.gm-bubble').text()).toBe('Danke!')
    expect(w.text()).toContain('Er ist zurückgekehrt und dankt Jesus.')
    expect(useTaskProgress().parts.value).toBe(3)
    expect(w.text()).toContain('Runden geschafft: 1 von 2')
    expect(played).toContain('found')
    // the others walk on to the house and are gone (not tappable) when they have come
    expect(men(w).some((b) => b.classes().includes('away'))).toBe(true)
  })

  it('a second tap on the Samaritan after the first changes nothing', async () => {
    const w = mountIt()
    await toTurn(w)
    await turned(w).trigger('click')
    await turned(w).trigger('click')
    await tick(3000)
    expect(useTaskProgress().parts.value).toBe(3)
    expect(count('right')).toBe(1)
  })

  it('round 2 follows with its own hint; both rounds without a mistake give three stars and the end shows the words of the Bible', async () => {
    const w = mountIt()
    await win(w)
    await tick(3300)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.text()).toContain('Jetzt kreuzen sie sich.')
    expect(useTaskProgress().parts.value).toBe(3)
    expect(men(w)).toHaveLength(10)
    await win(w)
    expect(useTaskProgress().parts.value).toBe(6)
    await tick(2500)
    expect(w.text()).toContain('Einer aber unter ihnen')
    expect(w.text()).toContain('Und das war ein Samariter.')
    expect(played).toContain('star')
    expect(w.findAll('.gd-stars').length).toBeGreaterThan(0)
    await w.find('button.adv-btn').trigger('click')
    expect(w.emitted('done')![0]).toEqual([3])
    expect(problems()).toEqual([])
  })

  it('mistakes cost stars: three mistakes in all give two stars, six give one', async () => {
    const two = mountIt()
    await toTurn(two)
    for (const b of men(two).filter((x) => !x.classes().includes('turned')).slice(0, 3)) await b.trigger('click')
    await turned(two).trigger('click')
    await tick(3200)
    await tick(3300)
    await win(two)
    await tick(2900)
    await two.find('button.adv-btn').trigger('click')
    expect(two.emitted('done')![0]).toEqual([2])
    two.unmount()

    played.length = 0
    const one = mountIt()
    // six tries that run out of time (eight seconds each and the pause)
    for (let i = 0; i < 6; i++) await tick(8000 + 1900)
    expect(count('wrong')).toBe(6)
    await win(one)
    await tick(3300)
    await win(one)
    await tick(2900)
    await one.find('button.adv-btn').trigger('click')
    expect(one.emitted('done')![0]).toEqual([1])
  })

  it('has English and Spanish words', () => {
    const en = mountIt(UMKEHR, 'en')
    expect(en.text()).toContain('Rounds done: 0 of 2')
    expect(en.find('button.gm-man').attributes('aria-label')).toBe('Man 1')
    const es = mountIt(UMKEHR, 'es')
    expect(es.text()).toContain('Rondas conseguidas: 0 de 2')
  })

  it('does not run on after it is gone (the clock stops)', async () => {
    const w = mountIt()
    w.unmount()
    await tick(20000)
    expect(problems()).toEqual([])
  })
})

// ---------------------------------------------------------------- shout louder
const RUF: ShoutGame = {
  background: `${H}ruf/weg.webp`,
  bartimaeus: { image: `${H}ruf/bartimaeus.webp`, label: 'Bartimäus am Wegrand', w: 13, x: 20, y: 94 },
  group: { image: `${H}ruf/zug.webp`, label: 'Jesus, seine Jünger und eine Menge', w: 34, y: 56, from: 22, to: 62 },
  waver: { image: `${H}ruf/mann-winkt.webp`, label: 'Ein Mann winkt', w: 9, dx: 4, y: 72 },
  rounds: [
    { hint: 'Tippe schnell auf „Rufen“, damit Jesus dich hört.', seconds: 12, need: 25, hushes: 2 },
    { hint: 'Noch einmal. Die Menge ist lauter. Ruf lauter!', seconds: 14, need: 35, hushes: 4 }
  ]
}

describe('Lauter rufen (ruf)', () => {
  const mountIt = (game: ShoutGame = RUF, locale: 'de' | 'en' | 'es' = 'de') => mount(GameShout, { props: { game }, ...opts(locale) })
  type W = ReturnType<typeof mountIt>
  const button = (w: W) => w.find('button.gm-shout')
  const meter = (w: W) => Number(w.find('.gm-meter').attributes('aria-valuenow'))
  /** `n` calls, `ms` apart. */
  const calls = async (w: W, n: number, ms = 150) => {
    for (let i = 0; i < n; i++) {
      await button(w).trigger('click')
      if (ms) await tick(ms)
    }
  }
  /** Calls fast until the round is won (4 a second). */
  const shoutUntilWon = async (w: W) => {
    for (let i = 0; i < 80 && !w.find('.gm-waver').exists() && !w.text().includes('Und Jesus stand still'); i++) {
      await button(w).trigger('click')
      await tick(220)
    }
  }

  it('the sample data are in order', () => {
    for (const r of RUF.rounds) expect(shoutRoundProblems(r)).toEqual([])
  })

  it('the goal is ten steps a round; the big button, Bartimaeus, the empty bar, the group and the hint are there', () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(20)
    expect(button(w).exists()).toBe(true)
    expect(button(w).text()).toContain('Rufen!')
    expect(w.find('button.gm-bart').exists()).toBe(true)
    expect(w.find('button.gm-bart').attributes('aria-label')).toContain('Bartimäus')
    expect(meter(w)).toBe(0)
    expect(w.find('.gm-meter').attributes('role')).toBe('progressbar')
    expect(w.find('.gm-group').exists()).toBe(true)
    expect(w.find('.gm-waver').exists()).toBe(false)
    expect(w.text()).toContain('Tippe schnell auf')
    expect(w.text()).toContain('Runden geschafft: 0 von 2')
    expect(problems()).toEqual([])
  })

  it('nothing happens to the clock before the first call: no hurry, no loss', async () => {
    const w = mountIt()
    await tick(40000)
    expect(count('wrong')).toBe(0)
    expect(w.find('.gm-psst').exists()).toBe(false)
    expect(w.find('.gm-group').attributes('style')).toContain('left: 22%')
  })

  it('every call fills the bar by a share, with a sound, a ring and the first words of Bartimaeus; the number is written in the bar', async () => {
    const w = mountIt()
    await button(w).trigger('click')
    expect(meter(w)).toBe(4)
    expect(w.find('.gm-pct').text()).toBe('4 %')
    expect(played).toContain('tap')
    expect(w.find('.gm-wave').exists()).toBe(true)
    expect(w.text()).toContain('Jesu, du Sohn Davids, erbarme dich mein!')
    await w.find('button.gm-bart').trigger('click')
    expect(meter(w)).toBe(8)
    expect(useTaskProgress().parts.value).toBe(0)
  })

  it('the group walks on while the clock runs', async () => {
    const w = mountIt()
    await button(w).trigger('click')
    const left0 = w.find('.gm-group').attributes('style')
    await tick(3000)
    expect(w.find('.gm-group').attributes('style')).not.toBe(left0)
  })

  it('the crowd hushes: a bubble with a word (not only a sign), a soft sound, the bar is pushed back', async () => {
    const w = mountIt()
    await calls(w, 10, 0)
    expect(meter(w)).toBe(40)
    let seen = ''
    for (let i = 0; i < 100 && !seen; i++) {
      await tick(100)
      if (w.find('.gm-psst').exists()) seen = w.find('.gm-psst').text()
    }
    expect(['Still!', 'Sei ruhig!', 'Psst!']).toContain(seen)
    expect(count('flip')).toBeGreaterThanOrEqual(1)
    expect(meter(w)).toBe(28)
    // the bubble goes away again
    await tick(2000)
    expect(w.find('.gm-psst').exists()).toBe(false)
    // pushed back, but the parts stay (ten calls were 40 percent: four steps)
    expect(useTaskProgress().parts.value).toBe(4)
  })

  it('from 60 percent in round 1 the task has a third done: "Go on (1 star)"; before that it has not', async () => {
    const w = mountIt()
    const goal = useTaskProgress().goal.value
    await calls(w, 14, 0)
    expect(partialStars(useTaskProgress().parts.value, goal)).toBe(0)
    await calls(w, 1, 0)
    expect(partialStars(useTaskProgress().parts.value, goal)).toBe(1)
  })

  it('the bar full in time: the group stops, a man waves "Komm!", the round counts all ten parts', async () => {
    const w = mountIt()
    await shoutUntilWon(w)
    expect(w.find('.gm-waver').exists()).toBe(true)
    expect(w.find('.gm-waver').text()).toContain('Komm!')
    expect(w.text()).toContain('Jesus bleibt stehen')
    expect(useTaskProgress().parts.value).toBe(10)
    expect(count('right')).toBe(1)
    expect(w.text()).toContain('Runden geschafft: 1 von 2')
    const left = w.find('.gm-group').attributes('style')
    await tick(1000)
    expect(w.find('.gm-group').attributes('style')).toBe(left)
    expect(button(w).attributes('disabled')).toBeDefined()
    expect(count('wrong')).toBe(0)
  })

  it('the time over: a mistake, a cross, a word, a dull sound, the group walks out; then the round begins again with an empty bar', async () => {
    const w = mountIt()
    await calls(w, 6, 0)
    await tick(12100)
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('Der Zug ist weitergegangen')
    expect(w.find('.gm-group').classes()).toContain('leaving')
    expect(w.find('.gm-group').attributes('style')).toContain('left: 120%')
    expect(w.find('.gm-bart .gm-cross').exists()).toBe(true)
    expect(button(w).attributes('disabled')).toBeDefined()
    await tick(2100)
    expect(meter(w)).toBe(0)
    expect(w.find('.gm-group').classes()).not.toContain('leaving')
    expect(w.text()).not.toContain('Der Zug ist weitergegangen')
    expect(button(w).attributes('disabled')).toBeUndefined()
    // the parts of the first try stay (six calls: two steps), and a second try is possible
    expect(useTaskProgress().parts.value).toBe(2)
    await shoutUntilWon(w)
    expect(w.find('.gm-waver').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(10)
  })

  it('round 2 asks for more calls and more hushes; the end gives three stars for a game without a mistake', async () => {
    const w = mountIt()
    await shoutUntilWon(w)
    await tick(3300)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.text()).toContain('Noch einmal. Die Menge ist lauter.')
    expect(meter(w)).toBe(0)
    expect(w.find('.gm-waver').exists()).toBe(false)
    await shoutUntilWon(w)
    expect(useTaskProgress().parts.value).toBe(20)
    await tick(2900)
    expect(w.text()).toContain('Und Jesus stand still und ließ ihn rufen.')
    expect(played).toContain('star')
    await w.find('button.adv-btn').trigger('click')
    expect(w.emitted('done')![0]).toEqual([3])
    expect(problems()).toEqual([])
  })

  it('mistakes cost stars: three rounds that ran out of time give two stars, six give one', async () => {
    const two = mountIt()
    for (let i = 0; i < 3; i++) {
      await calls(two, 2, 0)
      await tick(12100 + 2100)
    }
    await shoutUntilWon(two)
    await tick(3300)
    await shoutUntilWon(two)
    await tick(2900)
    await two.find('button.adv-btn').trigger('click')
    expect(two.emitted('done')![0]).toEqual([2])
    two.unmount()

    const one = mountIt()
    for (let i = 0; i < 6; i++) {
      await calls(one, 2, 0)
      await tick(12100 + 2100)
    }
    await shoutUntilWon(one)
    await tick(3300)
    await shoutUntilWon(one)
    await tick(2900)
    await one.find('button.adv-btn').trigger('click')
    expect(one.emitted('done')![0]).toEqual([1])
  })

  it('has English and Spanish words', () => {
    const en = mountIt(RUF, 'en')
    expect(en.text()).toContain('Rounds done: 0 of 2')
    expect(en.find('button.gm-shout').text()).toContain('Call out!')
    const es = mountIt(RUF, 'es')
    expect(es.find('button.gm-shout').text()).toContain('Gritar')
  })

  it('does not run on after it is gone (the clock stops)', async () => {
    const w = mountIt()
    await calls(w, 3, 0)
    w.unmount()
    await tick(30000)
    expect(problems()).toEqual([])
  })
})
