/**
 * The five new games of "Jesus' Miracles at the Lake" (`schoepfen`, `gedraenge`, `buendel`, `brote`, `rudern`): each is mounted with sample data (the same as the sample blocks in
 * `D:\Claude\Abenteuer-Wunder\SPIELE-DATEN.md`) and used: right and wrong moves, the rounds, the goal for the stars of "Go on" (`useTaskProgress`), the help after fifteen seconds, the end with its stars, German and English words.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import useTaskProgress from '@/use/useTaskProgress'
import GameBail from '@/components/molecules/games/GameBail.vue'
import GameCrowd from '@/components/molecules/games/GameCrowd.vue'
import GameBundle from '@/components/molecules/games/GameBundle.vue'
import GameBread from '@/components/molecules/games/GameBread.vue'
import GameRow from '@/components/molecules/games/GameRow.vue'
import { bailRoundProblems, bundleProblems, crowdProblems, rowRoundProblems, scatterSpots } from '@/utils/wunderGames'
import type { BailGame, BreadGame, BundleGame, CrowdGame, RowGame } from '@/types/adventure'

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
const count = (name: string) => played.filter((p) => p === name).length

const G = 'images/abenteuer/spiele/wunder/'

// ---------------------------------------------------------------- bail out the boat
const SCHOEPFEN: BailGame = {
  background: `${G}schoepfen/boot-innen.webp`,
  puddles: [
    { id: 'lache-1', image: `${G}schoepfen/lache-1.webp`, w: 20 },
    { id: 'lache-2', image: `${G}schoepfen/lache-2.webp`, w: 20 },
    { id: 'lache-3', image: `${G}schoepfen/lache-3.webp`, w: 20 }
  ],
  cup: { image: `${G}schoepfen/becher.webp`, w: 9 },
  spots: [
    { x: 28, y: 36 },
    { x: 50, y: 30 },
    { x: 72, y: 36 },
    { x: 24, y: 54 },
    { x: 76, y: 54 },
    { x: 38, y: 70 },
    { x: 62, y: 70 }
  ],
  rounds: [
    { hint: 'Schöpfe das Wasser aus dem Boot.', total: 5, every: 5 },
    { hint: 'Die Wellen kommen schneller.', total: 7, every: 4 }
  ]
}

describe('Das Boot ausschöpfen (schoepfen)', () => {
  const mountIt = (game: BailGame = SCHOEPFEN, locale: 'de' | 'en' = 'de') => mount(GameBail, { props: { game }, ...opts(locale) })
  /** A small game: two rounds of two puddles, no wave (all puddles are there from the start). */
  const small: BailGame = { ...SCHOEPFEN, rounds: [{ hint: 'Erste Runde.', total: 2, every: 5 }, { hint: 'Zweite Runde.', total: 2, every: 5 }] }
  const scoopAll = async (w: ReturnType<typeof mountIt>) => {
    for (let i = 0; i < 20 && w.find('button.gm-puddle').exists(); i++) await w.find('button.gm-puddle').trigger('click')
  }

  it('the sample data are in order', () => {
    for (const r of SCHOEPFEN.rounds) expect(bailRoundProblems(r, SCHOEPFEN.spots.length)).toEqual([])
    // no two places lie on top of each other (a full puddle is 20 percent wide, 1.4 times as wide as high)
    const s = SCHOEPFEN.spots
    for (let i = 0; i < s.length; i++) for (let k = i + 1; k < s.length; k++) expect(Math.max(Math.abs(s[i]!.x - s[k]!.x), Math.abs(s[i]!.y - s[k]!.y) * 1.5), `${i}/${k}`).toBeGreaterThanOrEqual(18)
    for (const p of s) {
      expect(p.x).toBeGreaterThan(10)
      expect(p.x).toBeLessThan(90)
    }
  })

  it('the goal is every puddle of every round; two puddles, the hint and the count are there', () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(12)
    expect(w.findAll('button.gm-puddle')).toHaveLength(2)
    expect(w.text()).toContain('Schöpfe das Wasser aus dem Boot.')
    expect(w.text()).toContain('Lachen weggeschöpft: 0 von 12')
    expect(w.find('button.gm-puddle').attributes('aria-label')).toContain('noch 3 Mal')
    expect(problems()).toEqual([])
  })

  it('every scoop makes the puddle smaller (dots and word); the third takes it away and counts one part', async () => {
    const w = mountIt(small)
    const first = () => w.find('button.gm-puddle')
    await first().trigger('click')
    expect(first().attributes('aria-label')).toContain('noch 2 Mal')
    expect(first().find('.gm-pips').text()).toBe('●●')
    expect(played).toContain('snap')
    expect(w.findAll('.gm-cup')).toHaveLength(1)
    await first().trigger('click')
    expect(useTaskProgress().parts.value).toBe(0)
    await first().trigger('click')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.findAll('button.gm-puddle')).toHaveLength(1)
    expect(played).toContain('right')
    await tick(1000)
    expect(w.findAll('.gm-cup')).toHaveLength(0)
  })

  it('a wave brings a new puddle after the seconds of the round, with a word', async () => {
    const w = mountIt({ ...SCHOEPFEN, rounds: [{ hint: 'Runde.', total: 4, every: 5 }] })
    expect(w.findAll('button.gm-puddle')).toHaveLength(2)
    await tick(4800)
    expect(w.findAll('button.gm-puddle')).toHaveLength(2)
    await tick(400)
    expect(w.findAll('button.gm-puddle')).toHaveLength(3)
    expect(w.text()).toContain('Eine Welle spritzt über den Rand')
  })

  it('four puddles at once flood the boat: a cross, a word, a dull sound, once', async () => {
    const w = mountIt({ ...SCHOEPFEN, rounds: [{ hint: 'Runde.', total: 9, every: 3 }] })
    await tick(7000)
    expect(w.findAll('button.gm-puddle')).toHaveLength(4)
    expect(w.find('.gm-cross').exists()).toBe(true)
    expect(w.text()).toContain('Das Boot läuft voll Wasser')
    expect(count('wrong')).toBe(1)
    await tick(10000)
    // never more than four, and no second mistake in the same round
    expect(w.findAll('button.gm-puddle')).toHaveLength(4)
    expect(count('wrong')).toBe(1)
  })

  it('both rounds, the end gives the stars (a clean game three, a flood costs one)', async () => {
    const w = mountIt(small)
    await scoopAll(w)
    expect(useTaskProgress().parts.value).toBe(2)
    await tick(100)
    expect(w.text()).toContain('Geschafft!')
    await tick(1800)
    expect(w.text()).toContain('Zweite Runde.')
    expect(w.findAll('button.gm-puddle')).toHaveLength(2)
    await scoopAll(w)
    expect(useTaskProgress().parts.value).toBe(4)
    await tick(1000)
    expect(w.text()).toContain('Die Wellen schlugen ins Boot')
    expect(played).toContain('star')
    expect(w.findAll('.gd-stars').length).toBeGreaterThan(0)
    expect(problems()).toEqual([])
  })

  it('after fifteen seconds without a tap "Hilf mir schöpfen" scoops once', async () => {
    const w = mountIt(small)
    expect(w.text()).not.toContain('Hilf mir schöpfen')
    await tick(15500)
    expect(w.text()).toContain('Hilf mir schöpfen')
    await w.find('button.adv-btn').trigger('click')
    expect(w.findAll('button.gm-puddle').some((b) => b.attributes('aria-label')?.includes('noch 2 Mal'))).toBe(true)
    expect(w.text()).not.toContain('Hilf mir schöpfen')
  })

  it('has English words', () => {
    const w = mountIt(SCHOEPFEN, 'en')
    expect(w.text()).toContain('Puddles scooped out: 0 of 12')
  })
})

// ---------------------------------------------------------------- through the crowd
const GEDRAENGE: CrowdGame = {
  background: `${G}gedraenge/strasse.webp`,
  area: { x: 10, y: 22, w: 80, h: 74 },
  pair: { image: `${G}gedraenge/paar.webp`, label: 'Jesus und Jairus', w: 18 },
  people: [1, 2, 3, 4, 5, 6].map((n) => ({ image: `${G}gedraenge/mensch-${n}.webp`, label: 'Mensch im Gedränge', w: 13 })),
  door: { x: 50, y: 20 },
  rounds: [
    { hint: 'Tippe auf die Menschen, damit sie Platz machen.', rows: [[0, 0, 1, 0, 0], [0, 2, 3, 4, 0], [5, 0, 6, 0, 0]] },
    { hint: 'Noch einmal, das Gedränge ist größer.', rows: [[0, 1, 2, 0, 3], [4, 5, 6, 0, 0], [0, 3, 4, 5, 0], [1, 0, 2, 6, 5], [0, 6, 5, 1, 0]] }
  ]
}

describe('Durch das Gedränge (gedraenge)', () => {
  /** A small game: one person in round 1; two rows in round 2. */
  const small: CrowdGame = {
    ...GEDRAENGE,
    rounds: [
      { hint: 'Erste Runde.', rows: [[0, 0, 1, 0, 0]] },
      { hint: 'Zweite Runde.', rows: [[0, 2, 3, 4, 0], [6, 0, 5, 0, 6]] }
    ]
  }
  const mountIt = (game: CrowdGame = GEDRAENGE, locale: 'de' | 'en' = 'de') => mount(GameCrowd, { props: { game }, ...opts(locale) })

  it('the sample data are in order: every row can be solved, the pictures are given', () => {
    for (const r of GEDRAENGE.rounds) expect(crowdProblems(r.rows)).toEqual([])
    expect(GEDRAENGE.rounds.map((r) => r.rows.length)).toEqual([3, 5])
    expect(GEDRAENGE.people).toHaveLength(6)
    // the figures are not wider than a bit more than a place
    expect(GEDRAENGE.people[0]!.w).toBeLessThanOrEqual((GEDRAENGE.area.w / 5) * 1.1)
  })

  it('the goal is every row of people; the people, the pair and the hint are there', () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(8)
    expect(w.findAll('button.gm-person')).toHaveLength(6)
    expect(w.find('.gm-pair').exists()).toBe(true)
    expect(w.text()).toContain('Tippe auf die Menschen')
    expect(w.text()).toContain('Reihen geschafft: 0 von 8')
    expect(problems()).toEqual([])
  })

  it('a person with no room beside him wobbles: a cross, a word, a dull sound, nothing counted', async () => {
    const w = mountIt(small)
    await w.find('button.gm-person').trigger('click')
    await tick(1500)
    // round 1 is solved by now; go to round 2
    await tick(6000)
    expect(w.text()).toContain('Zweite Runde.')
    const people = w.findAll('button.gm-person')
    // the middle person of the upper row has people on both sides
    await people[1]!.trigger('click')
    expect(count('wrong')).toBe(1)
    expect(w.find('.gm-cross').exists()).toBe(true)
    expect(w.findAll('button.gm-person')[1]!.classes()).toContain('wobble')
    expect(w.text()).toContain('kein Platz')
    await tick(1000)
    expect(w.find('.gm-cross').exists()).toBe(false)
  })

  it('a tap makes the person step aside; then the pair walks up and the row counts; round 2 follows; the end gives the stars', async () => {
    const w = mountIt(small)
    await tick(800)
    // the person in the middle is in the way: the pair waits
    expect(useTaskProgress().parts.value).toBe(0)
    const person = w.find('button.gm-person')
    const before = person.attributes('style')
    await person.trigger('click')
    expect(w.find('button.gm-person').attributes('style')).not.toBe(before)
    await tick(400)
    expect(useTaskProgress().parts.value).toBe(1)
    // the pair walks on up to the house, then the next round comes
    await tick(6000)
    expect(w.text()).toContain('Zweite Runde.')
    expect(w.findAll('button.gm-person')).toHaveLength(6)
    await tick(800)
    // row 4: the middle person steps right; the pair enters the row at once
    await w.findAll('button.gm-person')[4]!.trigger('click')
    await tick(900)
    expect(useTaskProgress().parts.value).toBe(2)
    // row 3 is jammed: the left one steps away first, then the middle one can go left
    await w.findAll('button.gm-person')[0]!.trigger('click')
    await w.findAll('button.gm-person')[1]!.trigger('click')
    await tick(7000)
    expect(useTaskProgress().parts.value).toBe(3)
    expect(w.text()).toContain('Jesus ging mit Jairus')
    expect(played).toContain('star')
    expect(problems()).toEqual([])
  })

  it('after fifteen seconds without a tap "Hilf mir" lets the person in the way step aside', async () => {
    const w = mountIt(small)
    await tick(800)
    expect(w.text()).not.toContain('Hilf mir')
    await tick(15500)
    expect(w.text()).toContain('Hilf mir')
    await w.find('button.adv-btn').trigger('click')
    await tick(800)
    expect(useTaskProgress().parts.value).toBe(1)
  })

  it('the whole game can be played by the helper alone (no dead end in the sample data)', async () => {
    const w = mountIt()
    for (let i = 0; i < 40 && !w.text().includes('Jesus ging mit Jairus'); i++) {
      await tick(16000)
      const help = w.findAll('button.adv-btn')
      if (help.length) await help[0]!.trigger('click')
    }
    expect(w.text()).toContain('Jesus ging mit Jairus')
    expect(useTaskProgress().parts.value).toBe(8)
  })

  it('has English words', () => {
    const w = mountIt(GEDRAENGE, 'en')
    expect(w.text()).toContain('Rows passed: 0 of 8')
  })
})

// ---------------------------------------------------------------- pack the bundle
const sprite = (id: string, label: string) => ({ id, image: `${G}buendel/ding-${id}.webp`, label, w: 16 })
const BUENDEL: BundleGame = {
  background: `${G}buendel/tuch.webp`,
  things: [sprite('stab', 'Stab'), sprite('sandalen', 'Sandalen'), sprite('hemd', 'Hemd'), sprite('brot', 'Brot'), sprite('tasche', 'Tasche'), sprite('geld', 'Geldbeutel'), sprite('hemd2', 'Zweites Hemd')],
  bundle: { image: `${G}buendel/buendel.webp`, label: 'Das Reisebündel', w: 18, x: 50, y: 84 },
  disciple: { image: `${G}buendel/juenger.webp`, label: 'Ein Jünger', w: 14, x: 86, y: 70 },
  rounds: [
    {
      hint: 'Was darf ins Bündel? Tippe darauf.',
      items: [
        { thing: 'stab', allowed: true, x: 24, y: 28 },
        { thing: 'sandalen', allowed: true, x: 56, y: 28 },
        { thing: 'brot', allowed: false, x: 24, y: 54 },
        { thing: 'geld', allowed: false, x: 56, y: 54 }
      ]
    },
    {
      hint: 'Noch einmal, mit anderen Dingen.',
      items: [
        { thing: 'hemd', allowed: true, x: 24, y: 28 },
        { thing: 'tasche', allowed: false, x: 56, y: 28 },
        { thing: 'hemd2', allowed: false, x: 24, y: 54 },
        { thing: 'stab', allowed: true, x: 56, y: 54 }
      ]
    }
  ]
}

describe('Das Reisebündel packen (buendel)', () => {
  const mountIt = (locale: 'de' | 'en' = 'de') => mount(GameBundle, { props: { game: BUENDEL }, ...opts(locale) })
  const thing = (w: ReturnType<typeof mountIt>, label: string) => w.findAll('button.gm-thing').find((b) => b.attributes('aria-label') === label)!

  it('the sample data are in order: two allowed and two forbidden things in each round, none on top of another, every picture named', () => {
    for (const r of BUENDEL.rounds) {
      expect(bundleProblems(r.items, 16)).toEqual([])
      expect(r.items.filter((i) => i.allowed)).toHaveLength(2)
      for (const i of r.items) expect(BUENDEL.things.some((t) => t.id === i.thing)).toBe(true)
    }
    // the bundle lies below the things, the disciple beside them
    expect(BUENDEL.bundle.y - 0.75 * BUENDEL.bundle.w).toBeGreaterThan(54 + 12)
  })

  it('the goal is every allowed thing; four things with their names, the bundle, the disciple and the hint are there', () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(4)
    expect(w.findAll('button.gm-thing')).toHaveLength(4)
    expect(w.findAll('.gm-name').map((n) => n.text())).toEqual(['Stab', 'Sandalen', 'Brot', 'Geldbeutel'])
    expect(w.find('.gm-bundle').exists()).toBe(true)
    expect(w.find('.gm-disciple').exists()).toBe(true)
    expect(w.text()).toContain('Was darf ins Bündel?')
    expect(problems()).toEqual([])
  })

  it('a forbidden thing wobbles, gets a cross and a word, a dull sound; it stays; nothing counted', async () => {
    const w = mountIt()
    await thing(w, 'Brot').trigger('click')
    expect(count('wrong')).toBe(1)
    expect(w.find('.gm-cross').exists()).toBe(true)
    expect(thing(w, 'Brot').classes()).toContain('wobble')
    expect(thing(w, 'Brot').classes()).not.toContain('packed')
    expect(w.text()).toContain('Das kommt nicht ins Bündel')
    expect(useTaskProgress().parts.value).toBe(0)
    await tick(1000)
    expect(w.find('.gm-cross').exists()).toBe(false)
  })

  it('an allowed thing flies into the bundle and counts; the bundle shows the number', async () => {
    const w = mountIt()
    await thing(w, 'Stab').trigger('click')
    expect(thing(w, 'Stab').classes()).toContain('packed')
    expect(thing(w, 'Stab').attributes('style')).toContain('left: 50%')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(played).toContain('sack')
    expect(w.find('.gm-badge').text()).toBe('1 / 2')
    expect(w.find('.gm-bundle').attributes('aria-label')).toContain('1 Dinge')
  })

  it('when all allowed things are in, round 2 comes; the end gives the stars', async () => {
    const w = mountIt()
    await thing(w, 'Stab').trigger('click')
    await thing(w, 'Sandalen').trigger('click')
    await tick(700)
    expect(w.text()).toContain('Das Bündel ist gepackt')
    await tick(2000)
    expect(w.text()).toContain('Noch einmal, mit anderen Dingen.')
    expect(w.findAll('button.gm-thing').every((b) => !b.classes().includes('packed'))).toBe(true)
    await thing(w, 'Zweites Hemd').trigger('click')
    expect(count('wrong')).toBe(1)
    await thing(w, 'Hemd').trigger('click')
    await thing(w, 'Stab').trigger('click')
    expect(useTaskProgress().parts.value).toBe(4)
    await tick(2500)
    expect(w.text()).toContain('Jesus sandte die Zwölf aus')
    expect(played).toContain('star')
    expect(problems()).toEqual([])
  })

  it('after fifteen seconds without a tap "Hilf mir packen" packs the next allowed thing', async () => {
    const w = mountIt()
    await tick(15500)
    expect(w.text()).toContain('Hilf mir packen')
    await w.find('button.adv-btn').trigger('click')
    expect(thing(w, 'Stab').classes()).toContain('packed')
    expect(useTaskProgress().parts.value).toBe(1)
  })

  it('has English words', () => {
    const w = mountIt('en')
    expect(w.text()).toContain('In the bundle: 0 of 4')
  })
})

// ---------------------------------------------------------------- share the bread
const BROTE: BreadGame = {
  background: `${G}brote/wiese.webp`,
  groups: [
    { id: 'g1', image: `${G}brote/gruppe-1.webp`, label: 'Gruppe 1', x: 18, y: 34, w: 20 },
    { id: 'g2', image: `${G}brote/gruppe-2.webp`, label: 'Gruppe 2', x: 50, y: 30, w: 20 },
    { id: 'g3', image: `${G}brote/gruppe-3.webp`, label: 'Gruppe 3', x: 82, y: 34, w: 20 },
    { id: 'g4', image: `${G}brote/gruppe-4.webp`, label: 'Gruppe 4', x: 30, y: 56, w: 20 },
    { id: 'g5', image: `${G}brote/gruppe-5.webp`, label: 'Gruppe 5', x: 70, y: 56, w: 20 }
  ],
  basket: { image: `${G}brote/korb-voll.webp`, label: 'Korb mit fünf Broten und zwei Fischen', w: 16, x: 50, y: 96 },
  disciple: { image: `${G}brote/juenger-teilt.webp`, w: 9 },
  leftover: { image: `${G}brote/korb-leer.webp`, label: 'Korb mit Resten', w: 9, count: 12, area: { x: 8, y: 22, w: 84, h: 52 } },
  rounds: [
    { hint: 'Tippe auf eine Gruppe, damit ein Jünger sie satt macht.', kind: 'feed' },
    { hint: 'Sammle die Körbe mit den Resten ein.', kind: 'collect' }
  ]
}

describe('Brot austeilen (brote)', () => {
  const mountIt = (locale: 'de' | 'en' = 'de') => mount(GameBread, { props: { game: BROTE }, ...opts(locale) })
  const feedAll = async (w: ReturnType<typeof mountIt>) => {
    for (const g of w.findAll('button.gm-group')) {
      await g.trigger('click')
      await tick(100)
    }
    await tick(1500)
  }

  it('the sample data are in order: five groups, twelve baskets, nothing on top of the full basket', () => {
    expect(BROTE.groups).toHaveLength(5)
    expect(BROTE.leftover.count).toBe(12)
    expect(scatterSpots(12, BROTE.leftover.area, 11)).toHaveLength(12)
    // the groups do not overlap each other
    const g = BROTE.groups
    for (let i = 0; i < g.length; i++) for (let k = i + 1; k < g.length; k++) expect(Math.max(Math.abs(g[i]!.x - g[k]!.x), Math.abs(g[i]!.y - g[k]!.y) * 1.5), `${i}/${k}`).toBeGreaterThanOrEqual(20)
  })

  it('the goal is five groups and twelve baskets; five groups, the full basket and the hint are there', () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(17)
    expect(w.findAll('button.gm-group')).toHaveLength(5)
    expect(w.find('.gm-basket').exists()).toBe(true)
    expect(w.findAll('button.gm-leftover')).toHaveLength(0)
    expect(w.text()).toContain('Tippe auf eine Gruppe')
    expect(w.text()).toContain('Satte Gruppen: 0 von 5')
    expect(problems()).toEqual([])
  })

  it('a tap on a hungry group sends a disciple; then the group is full (a tick), the basket stays full', async () => {
    const w = mountIt()
    await w.find('button.gm-group').trigger('click')
    expect(w.findAll('.gm-walker')).toHaveLength(1)
    expect(played).toContain('basket')
    expect(useTaskProgress().parts.value).toBe(0)
    await tick(900)
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.find('button.gm-group').classes()).toContain('fed')
    expect(w.find('button.gm-group .gm-tick').exists()).toBe(true)
    expect(w.find('button.gm-group').attributes('aria-label')).toContain('satt')
    expect(w.text()).toContain('Satte Gruppen: 1 von 5')
    expect(w.find('.gm-basket').exists()).toBe(true)
    await tick(1000)
    expect(w.findAll('.gm-walker')).toHaveLength(0)
  })

  it('a second tap on a group that is full says so gently (counted as a stray tap, no cross); two taps on the same hungry group send one disciple', async () => {
    const w = mountIt()
    const first = w.find('button.gm-group')
    await first.trigger('click')
    await first.trigger('click')
    expect(w.findAll('.gm-walker')).toHaveLength(1)
    await tick(900)
    await first.trigger('click')
    expect(w.text()).toContain('schon satt')
    expect(w.find('.gm-cross').exists()).toBe(false)
    expect(count('wrong')).toBe(0)
    expect(useTaskProgress().parts.value).toBe(1)
  })

  it('when all five are full the baskets with the leftovers lie in the grass; a tap picks one up; twelve end the game', async () => {
    const w = mountIt()
    await feedAll(w)
    expect(w.text()).toContain('Sie sind alle satt geworden')
    await tick(2200)
    expect(w.text()).toContain('Sammle die Körbe')
    expect(w.findAll('button.gm-leftover')).toHaveLength(12)
    expect(w.text()).toContain('Körbe eingesammelt: 0 von 12')
    await w.find('button.gm-leftover').trigger('click')
    expect(useTaskProgress().parts.value).toBe(6)
    expect(w.text()).toContain('Körbe eingesammelt: 1 von 12')
    for (const b of w.findAll('button.gm-leftover')) await b.trigger('click')
    expect(useTaskProgress().parts.value).toBe(17)
    await tick(1500)
    expect(w.text()).toContain('zwölf Körbe voll')
    expect(played).toContain('star')
    expect(w.findAll('.gd-stars').length).toBeGreaterThan(0)
    expect(problems()).toEqual([])
  })

  it('after fifteen seconds without a tap "Hilf mir austeilen" serves the next hungry group', async () => {
    const w = mountIt()
    await tick(15500)
    expect(w.text()).toContain('Hilf mir austeilen')
    await w.find('button.adv-btn').trigger('click')
    await tick(900)
    expect(w.find('button.gm-group').classes()).toContain('fed')
  })

  it('has English words', () => {
    const w = mountIt('en')
    expect(w.text()).toContain('Groups that are full: 0 of 5')
  })
})

// ---------------------------------------------------------------- row against the wind
const RUDERN: RowGame = {
  background: `${G}rudern/see-nacht.webp`,
  boat: { image: `${G}rudern/boot-oben.webp`, label: 'Das Boot mit zwei Rudern', w: 12, ratio: 0.55 },
  jesus: { image: `${G}rudern/jesus-wasser.webp`, label: 'Jesus auf dem Wasser', w: 9, x: 68, y: 40 },
  start: 76,
  goal: 42,
  rounds: [
    { hint: 'Rudere abwechselnd links und rechts.', distance: 4, wind: 1.5 },
    { hint: 'Der Wind ist stärker.', distance: 6, wind: -3 }
  ]
}

describe('Gegen den Wind rudern (rudern)', () => {
  const mountIt = (game: RowGame = RUDERN, locale: 'de' | 'en' = 'de') => mount(GameRow, { props: { game }, ...opts(locale) })
  const left = (w: ReturnType<typeof mountIt>) => w.find('button.gm-oar.left')
  const right = (w: ReturnType<typeof mountIt>) => w.find('button.gm-oar.right')
  const alternate = async (w: ReturnType<typeof mountIt>, n: number) => {
    for (let i = 0; i < n; i++) {
      await (i % 2 === 0 ? left(w) : right(w)).trigger('click')
      await tick(300)
    }
  }

  it('the sample data are in order (the real strokes of the sample game are shorter than the 30 and 45 of the data block)', () => {
    for (const r of [...RUDERN.rounds, { distance: 30, wind: 1.5 }, { distance: 45, wind: -3 }]) expect(rowRoundProblems(r.distance < 10 ? { ...r, distance: 10 } : r)).toEqual([])
    expect(RUDERN.start).toBeGreaterThan(RUDERN.goal)
  })

  it('the goal is every stroke of both rounds; two big areas (left and right), the boat, the wind and the hint are there', () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(10)
    expect(left(w).exists()).toBe(true)
    expect(right(w).exists()).toBe(true)
    expect(left(w).text()).toContain('Linkes Ruder')
    expect(right(w).text()).toContain('Rechtes Ruder')
    expect(w.find('.gm-boat').exists()).toBe(true)
    expect(w.find('.gm-wind').text()).toContain('Der Wind dreht das Boot nach rechts')
    expect(w.find('.gm-jesus').exists()).toBe(false)
    expect(w.text()).toContain('Rudere abwechselnd links und rechts.')
    expect(w.text()).toContain('Ruderschläge: 0 von 10')
    expect(problems()).toEqual([])
  })

  it('the left oar turns the bow to the right, the right oar to the left; each stroke moves the boat up', async () => {
    const w = mountIt()
    const top0 = w.find('.gm-boat').attributes('style')!
    await left(w).trigger('click')
    expect(w.find('.gm-boat').attributes('style')).toContain('rotate(7deg)')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.find('.gm-boat').attributes('style')).not.toBe(top0)
    expect(w.find('.gm-splash.left').exists()).toBe(true)
    await right(w).trigger('click')
    expect(w.find('.gm-boat').attributes('style')).toContain('rotate(0deg)')
    expect(played).toContain('tap')
  })

  it('rowing on one side only turns the boat round: a word, and the strokes count half', async () => {
    const w = mountIt({ ...RUDERN, rounds: [{ hint: 'Runde.', distance: 30, wind: 1.5 }] })
    for (let i = 0; i < 5; i++) await left(w).trigger('click')
    expect(w.text()).toContain('Das Boot dreht sich')
    // five strokes on one side: four whole ones, the fifth counts half
    expect(useTaskProgress().parts.value).toBe(4)
  })

  it('the wind turns the bow on by itself, but only after the first stroke', async () => {
    const w = mountIt()
    await tick(3000)
    expect(w.find('.gm-boat').attributes('style')).toContain('rotate(0deg)')
    await left(w).trigger('click')
    await right(w).trigger('click')
    await tick(4000)
    // the wind blows to the right (positive): 1.5 degrees a second, about 6 degrees in 4 seconds
    const m = /rotate\((-?[\d.]+)deg\)/.exec(w.find('.gm-boat').attributes('style')!)
    expect(Number(m![1])).toBeGreaterThan(3)
  })

  it('rowing in turn brings the boat over the first way; round 2 follows with Jesus at the end; the end gives the stars', async () => {
    const w = mountIt()
    await alternate(w, 4)
    expect(useTaskProgress().parts.value).toBe(4)
    expect(w.text()).toContain('Geschafft!')
    expect(w.find('.gm-jesus').exists()).toBe(false)
    await tick(2200)
    expect(w.text()).toContain('Der Wind ist stärker.')
    expect(w.text()).toContain('Der Wind dreht das Boot nach links')
    expect(w.find('.gm-boat').attributes('style')).toContain('rotate(0deg)')
    await alternate(w, 6)
    expect(useTaskProgress().parts.value).toBe(10)
    expect(w.find('.gm-jesus').exists()).toBe(true)
    expect(w.text()).toContain('Jesus kommt zu ihnen')
    await tick(3000)
    expect(w.text()).toContain('Die Jünger mühten sich')
    expect(played).toContain('star')
    expect(w.findAll('.gd-stars').length).toBeGreaterThan(0)
    expect(problems()).toEqual([])
  })

  it('the arrow keys row, too (left and right)', async () => {
    const w = mountIt()
    await w.find('.gm').trigger('keydown', { key: 'ArrowLeft' })
    expect(useTaskProgress().parts.value).toBe(1)
    await w.find('.gm').trigger('keydown', { key: 'ArrowRight' })
    expect(useTaskProgress().parts.value).toBe(2)
  })

  it('after fifteen seconds without a stroke "Hilf mir rudern" rows four strokes', async () => {
    const w = mountIt({ ...RUDERN, rounds: [{ hint: 'Runde.', distance: 30, wind: 1.5 }] })
    await left(w).trigger('click')
    expect(w.text()).not.toContain('Hilf mir rudern')
    await tick(15500)
    expect(w.text()).toContain('Hilf mir rudern')
    const before = useTaskProgress().parts.value
    await w.find('button.adv-btn').trigger('click')
    await tick(1500)
    expect(useTaskProgress().parts.value).toBeGreaterThanOrEqual(before + 3)
  })

  it('has English words', () => {
    const w = mountIt(RUDERN, 'en')
    expect(w.text()).toContain('Strokes: 0 of 10')
    expect(w.text()).toContain('Left oar')
  })
})
