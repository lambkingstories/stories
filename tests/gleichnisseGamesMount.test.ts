/**
 * The three new games of "Geschichten von Jesus" (`graben` = GameDig, `muenze` = GameCoin, `entgegen` = GameMeet): each is mounted with sample data and played through: right and wrong taps, the rounds,
 * the goal for the stars of "Go on" (`useTaskProgress`), the end with its stars and the words of the Bible, German, English and Spanish words, and the keyboard.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import spanish from '@/i18n/app.es'
import useTaskProgress from '@/use/useTaskProgress'
import GameDig from '@/components/molecules/games/GameDig.vue'
import GameCoin from '@/components/molecules/games/GameCoin.vue'
import GameMeet from '@/components/molecules/games/GameMeet.vue'
import { partialStars } from '@/utils/adventureScore'
import { coinProblems, digProblems, meetProblems } from '@/utils/gleichnisseGames'
import type { CoinGame, DigGame, MeetGame } from '@/types/adventure'

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
const boxOf100 = () => vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100, x: 0, y: 0, toJSON: () => ({}) })
const pointer = (el: Element, type: 'pointerdown' | 'pointermove' | 'pointerup', x = 0, y = 0) =>
  el.dispatchEvent(new MouseEvent(type, { bubbles: true, button: 0, buttons: type === 'pointerup' ? 0 : 1, clientX: x, clientY: y }))

const G = 'images/abenteuer/spiele/gleichnisse/'
const sprite = (file: string, label: string, w: number) => ({ image: `${G}${file}.webp`, label, w })

// ---------------------------------------------------------------- dig for the treasure
const CELLS: [number, number][] = [
  [18, 28], [40, 28], [62, 28], [84, 28],
  [18, 55], [40, 55], [62, 55], [84, 55],
  [18, 82], [40, 82], [62, 82], [84, 82]
]
const GRABEN: DigGame = {
  field: `${G}graben/acker.webp`,
  mound: sprite('graben/haufen', 'Ein Erdhaufen', 14),
  hole: sprite('graben/loch', 'Ein Loch im Acker', 14),
  chest: sprite('graben/truhe', 'Eine Truhe', 16),
  chestOpen: sprite('graben/truhe-offen', 'Die offene Truhe', 18),
  stall: `${G}graben/stand.webp`,
  pearls: [13, 9, 9, 9, 9].map((w, i) => sprite(`graben/perle-${i + 1}`, `Perle ${i + 1}`, w)),
  rounds: [
    { kind: 'field', hint: 'Grabe nach dem Schatz. Der Pfeil im Loch zeigt dir den Weg.', treasure: [2, 1], cells: CELLS },
    { kind: 'pearls', hint: 'Tippe auf die kostbarste Perle.', best: 2, slots: [[14, 62], [32, 62], [50, 62], [68, 62], [86, 62]] }
  ]
}

describe('Der Schatz im Acker (graben)', () => {
  const mountIt = (game: DigGame = GRABEN, locale: 'de' | 'en' | 'es' = 'de') => mount(GameDig, { props: { game }, ...opts(locale) })
  type W = ReturnType<typeof mountIt>
  const mounds = (w: W) => w.findAll('button.gm-mound')
  const mound = (w: W, n: number) => w.find(`button[aria-label="Erdhaufen ${n}: aufgraben"]`)
  const pearls = (w: W) => w.findAll('button.gm-pearl')
  /** The mound over the chest (column 2, row 1) is number 7. */
  const findChest = async (w: W) => {
    await mound(w, 7).trigger('click')
    await tick(2300)
  }
  const pearl = (w: W, slot: number) => pearls(w)[slot]!

  it('the sample data are in order', () => {
    expect(digProblems(GRABEN)).toEqual([])
  })

  it('the goal is one part for each round; twelve mounds, the hint, the round and the count are there', () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(2)
    expect(mounds(w)).toHaveLength(12)
    expect(w.text()).toContain('Grabe nach dem Schatz.')
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.text()).toContain('Runden geschafft: 0 von 2')
    expect(w.find('[role="group"]').attributes('aria-label')).toContain('zwölf Erdhaufen')
    expect(problems()).toEqual([])
  })

  it('an empty mound sinks into a hole with an arrow that points to the chest (with a word for the screen reader); that is a mistake without loss', async () => {
    const w = mountIt()
    // the mound left of the chest: the chest lies to the right
    await mound(w, 6).trigger('click')
    expect(mounds(w)).toHaveLength(11)
    const hole = w.find('.gm-hole')
    expect(hole.exists()).toBe(true)
    expect(hole.attributes('aria-label')).toBe('Loch 6: Der Schatz liegt rechts')
    expect(hole.find('.gm-arrow span').attributes('style')).toContain('rotate(0deg)')
    expect(w.text()).toContain('Hier ist nichts. Der Pfeil zeigt dir den Weg.')
    expect(played).toContain('hit')
    expect(count('wrong')).toBe(0)
    expect(useTaskProgress().parts.value).toBe(0)
    // a mound to the right of the chest: the arrow points to the left
    await mound(w, 8).trigger('click')
    expect(w.find('.gm-hole[aria-label="Loch 8: Der Schatz liegt links"]').exists()).toBe(true)
    // above the chest: down
    await mound(w, 3).trigger('click')
    const above = w.find('.gm-hole[aria-label="Loch 3: Der Schatz liegt unten"]')
    expect(above.exists()).toBe(true)
    expect(above.find('.gm-arrow span').attributes('style')).toContain('rotate(-270deg)')
    expect(w.findAll('.gm-hole')).toHaveLength(3)
  })

  it('the chest: a spade sound, the chest opens (coins glimmer, a tick), a part of the task, and round 2 follows', async () => {
    const w = mountIt()
    await mound(w, 7).trigger('click')
    expect(w.find('.gm-chest').exists()).toBe(true)
    expect(w.text()).toContain('Die Truhe! Münzen schimmern darin.')
    expect(mounds(w).every((b) => b.attributes('disabled') !== undefined)).toBe(true)
    await tick(500)
    expect(w.find('.gm-chest.open').exists()).toBe(true)
    expect(w.find('.gm-glint').exists()).toBe(true)
    expect(played).toContain('coin')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.text()).toContain('Runden geschafft: 1 von 2')
    await tick(2000)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.text()).toContain('Tippe auf die kostbarste Perle.')
    expect(pearls(w)).toHaveLength(5)
    expect(w.find('.gm-hole').exists()).toBe(false)
    expect(problems()).toEqual([])
  })

  it('a second tap on the mound of the chest changes nothing', async () => {
    const w = mountIt()
    await mound(w, 7).trigger('click')
    await w.find('.gm-chest').trigger('click')
    await tick(2300)
    expect(useTaskProgress().parts.value).toBe(1)
    expect(count('coin')).toBe(1)
  })

  it('a wrong pearl wobbles, gets a cross and a word, stays where it lies; the same pearl twice is one mistake; the right one is lifted with a tick', async () => {
    const w = mountIt()
    await findChest(w)
    await pearl(w, 0).trigger('click')
    expect(pearl(w, 0).classes()).toContain('wobble')
    expect(pearl(w, 0).find('.gm-mark').exists()).toBe(true)
    expect(w.text()).toContain('Eine schöne Perle, aber nicht die kostbarste.')
    expect(count('wrong')).toBe(1)
    await pearl(w, 0).trigger('click')
    expect(count('wrong')).toBe(2)
    expect(pearls(w)).toHaveLength(5)
    expect(useTaskProgress().parts.value).toBe(1)
    // the best pearl lies at place 2
    await pearl(w, 2).trigger('click')
    expect(pearl(w, 2).classes()).toContain('lifted')
    expect(pearl(w, 2).find('.gm-mark').exists()).toBe(true)
    expect(played).toContain('right')
    expect(useTaskProgress().parts.value).toBe(2)
    expect(w.text()).toContain('Die kostbarste Perle!')
  })

  it('both rounds without a mistake give three stars and the end shows the words of the Bible', async () => {
    const w = mountIt()
    await findChest(w)
    await pearl(w, 2).trigger('click')
    await tick(2100)
    expect(w.text()).toContain('Abermals ist gleich das Himmelreich einem verborgenen Schatz im Acker')
    expect(played).toContain('star')
    expect(useTaskProgress().finished.value).toBe(true)
    await w.find('button.adv-btn').trigger('click')
    expect(w.emitted('done')![0]).toEqual([3])
    expect(problems()).toEqual([])
  })

  it('mistakes cost stars: three holes and one pearl (four mistakes) give two stars, more than five give one', async () => {
    const two = mountIt()
    for (const n of [1, 2, 3]) await mound(two, n).trigger('click')
    await findChest(two)
    await pearl(two, 0).trigger('click')
    await pearl(two, 2).trigger('click')
    await tick(2100)
    await two.find('button.adv-btn').trigger('click')
    expect(two.emitted('done')![0]).toEqual([2])

    const one = mountIt()
    for (const n of [1, 2, 3, 4, 5]) await mound(one, n).trigger('click')
    await findChest(one)
    await pearl(one, 0).trigger('click')
    await pearl(one, 2).trigger('click')
    await tick(2100)
    await one.find('button.adv-btn').trigger('click')
    expect(one.emitted('done')![0]).toEqual([1])
  })

  it('"Go on" is offered after the first round (half of the task is one star), not before', async () => {
    const w = mountIt()
    const goal = useTaskProgress().goal.value
    expect(partialStars(useTaskProgress().parts.value, goal)).toBe(0)
    await findChest(w)
    expect(partialStars(useTaskProgress().parts.value, goal)).toBe(1)
  })

  it('the mounds and the pearls are buttons (the keyboard works), with a name; English and Spanish words', async () => {
    const w = mountIt()
    expect(mounds(w).every((b) => b.element.tagName === 'BUTTON' && !!b.attributes('aria-label'))).toBe(true)
    const en = mountIt(GRABEN, 'en')
    expect(en.text()).toContain('Round 1 of 2')
    expect(en.text()).toContain('Rounds done: 0 of 2')
    await en.find('button[aria-label="Mound 6: dig it open"]').trigger('click')
    expect(en.text()).toContain('Nothing here. The arrow shows you the way.')
    expect(en.find('.gm-hole').attributes('aria-label')).toBe('Hole 6: the treasure is to the right')
    const es = mountIt(GRABEN, 'es')
    expect(es.text()).toContain('Rondas conseguidas: 0 de 2')
    await es.find('button[aria-label="Montón 6: cavar"]').trigger('click')
    expect(es.text()).toContain('Aquí no hay nada.')
    expect(es.find('.gm-hole').attributes('aria-label')).toBe('Hoyo 6: el tesoro está a la derecha')
    expect(problems()).toEqual([])
  })
})

// ---------------------------------------------------------------- sweep for the coin
const MUENZE: CoinGame = {
  lamp: { ...sprite('muenze/lampe', 'Das Öllämpchen', 9), x: 20, y: 62 },
  coin: sprite('muenze/muenze', 'Eine Silbermünze', 6),
  woman: { ...sprite('muenze/frau', 'Die Frau', 16), x: 88, y: 96 },
  broom: sprite('muenze/besen', 'Ein Besen', 12),
  lid: sprite('muenze/deckel', 'Ein Messingdeckel', 8),
  pebble: sprite('muenze/kiesel', 'Ein Kiesel', 6),
  rounds: [
    { hint: 'Zünde das Licht an und fege den Staub weg. Wo liegt die Münze?', room: `${G}muenze/raum-1.webp`, coin: [58, 62] },
    {
      hint: 'Ein kleinerer Raum mit mehr Möbeln.',
      room: `${G}muenze/raum-2.webp`,
      coin: [32, 72],
      decoys: [
        { kind: 'lid', x: 64, y: 50 },
        { kind: 'pebble', x: 48, y: 82 }
      ]
    }
  ]
}

describe('Die verlorene Münze (muenze)', () => {
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
  const mountIt = (game: CoinGame = MUENZE, locale: 'de' | 'en' | 'es' = 'de') => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as never)
    boxOf100()
    return mount(GameCoin, { props: { game }, ...opts(locale) })
  }
  type W = ReturnType<typeof mountIt>
  const lamp = (w: W) => w.find('button.gm-lamp')
  const coin = (w: W) => w.find('button.gm-coin')
  const decoys = (w: W) => w.findAll('button.gm-decoy')
  const helpButton = (w: W) => w.findAll('button').find((b) => b.text() === 'Hilfe')!
  /** Sweep horizontal lines through the whole picture at the given heights. */
  const stripes = async (w: W, ys: number[]) => {
    const field = w.find('.gm-field').element
    for (const y of ys) {
      pointer(field, 'pointerdown', 0, y)
      pointer(field, 'pointermove', 50, y)
      pointer(field, 'pointermove', 100, y)
      pointer(field, 'pointerup', 100, y)
    }
    await flushPromises()
  }
  const WHOLE = [5, 15, 25, 35, 45, 55, 65, 75, 85, 95]
  /** Light the lamp, sweep, lift the coin of the round. */
  const solveRound = async (w: W, ys: number[] = WHOLE) => {
    await lamp(w).trigger('click')
    await stripes(w, ys)
    await coin(w).trigger('click')
  }

  it('the sample data are in order', () => {
    expect(coinProblems(MUENZE)).toEqual([])
  })

  it('the goal is ten parts for each round; the room is dark, the lamp waits, the help button is off, sweeping does nothing yet', async () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(20)
    expect(w.find('.gm-dark').exists()).toBe(true)
    expect(lamp(w).exists()).toBe(true)
    expect(lamp(w).attributes('aria-label')).toBe('Das Öllämpchen: Licht anzünden')
    expect(w.text()).toContain('Der Raum ist dunkel. Tippe auf das Lämpchen.')
    expect(w.text()).toContain('Zünde das Licht an und fege den Staub weg.')
    expect(helpButton(w).attributes('disabled')).toBeDefined()
    expect(w.find('canvas').exists()).toBe(true)
    await stripes(w, WHOLE)
    expect(useTaskProgress().parts.value).toBe(0)
    expect(coin(w).exists()).toBe(false)
    expect(decoys(w)).toHaveLength(0)
    expect(problems()).toEqual([])
  })

  it('the lamp: it is light, a bright sound, a part of the task, the dust can be swept now', async () => {
    const w = mountIt()
    await lamp(w).trigger('click')
    expect(w.find('.gm-dark').exists()).toBe(false)
    expect(played).toContain('found')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.text()).toContain('Es ist hell! Fege den Staub mit dem Finger weg.')
    expect(w.text()).toContain('Weggefegt: 0 %')
    expect(lamp(w).attributes('disabled')).toBeDefined()
    expect(helpButton(w).attributes('disabled')).toBeUndefined()
    // a second tap on the lamp gives nothing more
    await lamp(w).trigger('click')
    expect(useTaskProgress().parts.value).toBe(1)
  })

  it('sweeping earns a little of the task each time; the coin glints when its place is free (then all eight sweeping parts count)', async () => {
    const w = mountIt()
    await lamp(w).trigger('click')
    await stripes(w, [8])
    const little = useTaskProgress().parts.value
    expect(little).toBeGreaterThan(1)
    expect(little).toBeLessThan(9)
    expect(coin(w).exists()).toBe(false)
    expect(w.text()).not.toContain('Weggefegt: 0 %')
    // the coin lies at 58 / 62
    await stripes(w, [62])
    expect(coin(w).exists()).toBe(true)
    expect(w.text()).toContain('Etwas blitzt! Tippe auf die Münze.')
    expect(useTaskProgress().parts.value).toBe(9)
    expect(w.find('.gm-glint').exists()).toBe(true)
    expect(coin(w).attributes('aria-label')).toBe('Die Münze: aufheben')
  })

  it('the coin is lifted: a coin sound, it flies into the hand of the woman, the last part, and round 2 follows with its own room', async () => {
    const w = mountIt()
    await solveRound(w, [62])
    expect(played).toContain('coin')
    expect(useTaskProgress().parts.value).toBe(10)
    expect(w.text()).toContain('Die Frau hat ihre Münze gefunden!')
    expect(w.text()).toContain('Runden geschafft: 1 von 2')
    expect(coin(w).classes()).toContain('flying')
    expect(coin(w).attributes('style')).toContain('left: 84.8%')
    await tick(1400)
    expect(w.text()).toContain('Geschafft! Die nächste Runde beginnt')
    await tick(1100)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.text()).toContain('Ein kleinerer Raum mit mehr Möbeln.')
    expect(w.find('.gm-dark').exists()).toBe(true)
    expect(coin(w).exists()).toBe(false)
    expect(w.find('.gm-field').attributes('style')).toContain('raum-2.webp')
    // the second lifting of the first coin changes nothing
    expect(useTaskProgress().parts.value).toBe(10)
  })

  it('round 2: two things that look like a coin lie free on the floor; a tap on one is a mistake (wobble, cross, word, dull sound), each thing counts once', async () => {
    const w = mountIt()
    await solveRound(w, [62])
    await tick(2500)
    expect(decoys(w)).toHaveLength(0)
    await lamp(w).trigger('click')
    expect(decoys(w)).toHaveLength(2)
    expect(decoys(w)[0]!.attributes('aria-label')).toBe('Ein Messingdeckel')
    await decoys(w)[0]!.trigger('click')
    expect(count('wrong')).toBe(1)
    expect(decoys(w)[0]!.classes()).toContain('wobble')
    expect(decoys(w)[0]!.find('.gm-mark').exists()).toBe(true)
    expect(w.text()).toContain('Das ist keine Münze.')
    await decoys(w)[0]!.trigger('click')
    expect(count('wrong')).toBe(2)
    // the stars: only one thing was tapped (twice), so one mistake: still three stars at the end
    await stripes(w, [72])
    await coin(w).trigger('click')
    await tick(2100)
    await w.find('button.adv-btn').trigger('click')
    expect(w.emitted('done')![0]).toEqual([3])
  })

  it('both rounds without help and without mistakes: three stars, the words of the Bible at the end, all twenty parts', async () => {
    const w = mountIt()
    await solveRound(w, [62])
    await tick(2500)
    await solveRound(w, [72])
    expect(useTaskProgress().parts.value).toBe(20)
    await tick(2100)
    expect(w.text()).toContain('Freut euch mit mir; denn ich habe meinen Groschen gefunden')
    expect(played).toContain('star')
    expect(useTaskProgress().finished.value).toBe(true)
    await w.find('button.adv-btn').trigger('click')
    expect(w.emitted('done')![0]).toEqual([3])
    expect(problems()).toEqual([])
  })

  it('"Help" lets the place of the coin glimmer for four seconds (no loss of parts) but takes the third star', async () => {
    const w = mountIt()
    await lamp(w).trigger('click')
    expect(w.find('.gm-shimmer').exists()).toBe(false)
    await helpButton(w).trigger('click')
    expect(w.find('.gm-shimmer').exists()).toBe(true)
    expect(w.text()).toContain('Die Stelle mit der Münze glimmt sanft.')
    await tick(4100)
    expect(w.find('.gm-shimmer').exists()).toBe(false)
    await stripes(w, [62])
    await coin(w).trigger('click')
    await tick(2500)
    await solveRound(w, [72])
    await tick(2100)
    await w.find('button.adv-btn').trigger('click')
    expect(w.emitted('done')![0]).toEqual([2])
  })

  it('"Go on" works from a third of the task: the lamp and a little sweeping are enough for one star, the lamp alone is not', async () => {
    const w = mountIt()
    const goal = useTaskProgress().goal.value
    await lamp(w).trigger('click')
    expect(partialStars(useTaskProgress().parts.value, goal)).toBe(0)
    await stripes(w, [62])
    expect(partialStars(useTaskProgress().parts.value, goal)).toBe(1)
  })

  it('the arrow keys move a broom (the field is focusable), the lamp, the coin and the things on the floor are buttons', async () => {
    const w = mountIt()
    expect(w.find('.gm-field').attributes('tabindex')).toBe('0')
    await lamp(w).trigger('click')
    for (let i = 0; i < 12; i++) await w.find('.gm-field').trigger('keydown', { key: 'ArrowRight' })
    expect(w.text()).not.toContain('Weggefegt: 0 %')
    expect(lamp(w).element.tagName).toBe('BUTTON')
  })

  it('English and Spanish words', async () => {
    const en = mountIt(MUENZE, 'en')
    expect(en.text()).toContain('The room is dark. Tap the little lamp.')
    expect(en.text()).toContain('Round 1 of 2')
    expect(en.find('button.gm-lamp').attributes('aria-label')).toBe('The little oil lamp: light it')
    await en.find('button.gm-lamp').trigger('click')
    expect(en.text()).toContain('It is light! Sweep the dust away with your finger.')
    const es = mountIt(MUENZE, 'es')
    expect(es.text()).toContain('La habitación está oscura. Toca la lamparita.')
    expect(es.text()).toContain('Ayuda')
    expect(problems()).toEqual([])
  })
})

// ---------------------------------------------------------------- meet the son
const ENTGEGEN: MeetGame = {
  road: `${G}entgegen/weg.webp`,
  yard: `${G}entgegen/hof.webp`,
  father: { ...sprite('entgegen/vater', 'Der Vater im Tor', 12), x: 80, y: 82 },
  son: { ...sprite('entgegen/sohn', 'Der Sohn', 11), x: 14, y: 86 },
  embrace: sprite('entgegen/umarmung', 'Vater und Sohn in Umarmung', 18),
  meet: 34,
  steps: 12,
  ragged: { ...sprite('entgegen/sohn-lumpen', 'Der Sohn in zerrissenen Kleidern', 20), x: 50, y: 92 },
  robed: sprite('entgegen/sohn-kleid', 'Der Sohn im neuen Kleid', 20),
  dressed: sprite('entgegen/sohn-fertig', 'Der Sohn mit Kleid, Ring und Schuhen', 20),
  gifts: [
    { id: 'kleid', ...sprite('entgegen/kleid', 'Das Kleid', 10) },
    { id: 'ring', ...sprite('entgegen/ring', 'Der Ring', 10) },
    { id: 'schuhe', ...sprite('entgegen/schuhe', 'Die Schuhe', 10) }
  ],
  rounds: [
    { kind: 'run', hint: 'Tippe abwechselnd auf die Füße, damit der Vater zu seinem Sohn läuft.' },
    { kind: 'gifts', hint: 'Ziehe das Kleid, den Ring und die Schuhe zum Sohn.' }
  ]
}

describe('Der Vater läuft ihm entgegen (entgegen)', () => {
  const mountIt = (game: MeetGame = ENTGEGEN, locale: 'de' | 'en' | 'es' = 'de') => mount(GameMeet, { props: { game }, ...opts(locale) })
  type W = ReturnType<typeof mountIt>
  const feet = (w: W) => w.findAll('button.gm-foot')
  const left = (w: W) => feet(w)[0]!
  const right = (w: W) => feet(w)[1]!
  const gifts = (w: W) => w.findAll('button.gm-gift')
  const gift = (w: W, id: string) => w.find(`button[aria-label*="${id}"]`)
  const fatherLeft = (w: W) => Number(/left: ([\d.]+)%/.exec(w.find('.gm-father').attributes('style') ?? '')![1])
  /** Twelve taps in turn: the father arrives. */
  const run = async (w: W) => {
    for (let i = 0; i < 12; i++) await (i % 2 ? right(w) : left(w)).trigger('click')
  }
  const GIFT = { kleid: 'Das Kleid', ring: 'Der Ring', schuhe: 'Die Schuhe' }
  /** A gift by the keyboard: Enter on the gift chooses it, Enter on the son gives it. */
  const give = async (w: W, name: string) => {
    await w.find(`button[aria-label^="${name}"]`).trigger('keydown', { key: 'Enter' })
    await w.find('.gm-yardson').trigger('keydown', { key: 'Enter' })
  }

  it('the sample data are in order', () => {
    expect(meetProblems(ENTGEGEN)).toEqual([])
  })

  it('the goal is the twelve steps and the three gifts; two big feet, the son at the left, the father in the gate, the hint and the count', () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(15)
    expect(feet(w)).toHaveLength(2)
    expect(left(w).attributes('aria-label')).toBe('Linker Fuß')
    expect(right(w).attributes('aria-label')).toBe('Rechter Fuß')
    expect(w.find('.gm-son').exists()).toBe(true)
    expect(w.find('.gm-father').exists()).toBe(true)
    expect(w.text()).toContain('Tippe abwechselnd auf die Füße')
    expect(w.text()).toContain('Schritte: 0 von 12')
    expect(w.text()).toContain('Runde 1 von 2')
    // at the start both feet carry the sign "Now"
    expect(w.findAll('.gm-now')).toHaveLength(2)
    expect(problems()).toEqual([])
  })

  it('a tap runs the father one step; the sign "Now" shows the other foot; the same foot twice only says "Abwechselnd!" (no mistake, no dull sound, no step)', async () => {
    const w = mountIt()
    const x0 = fatherLeft(w)
    await left(w).trigger('click')
    expect(w.text()).toContain('Schritte: 1 von 12')
    expect(fatherLeft(w)).toBeLessThan(x0)
    expect(w.text()).toContain('Sein Vater sieht ihn schon von ferne.')
    expect(w.findAll('.gm-now')).toHaveLength(1)
    expect(right(w).find('.gm-now').exists()).toBe(true)
    await left(w).trigger('click')
    expect(w.text()).toContain('Schritte: 1 von 12')
    expect(w.text()).toContain('Abwechselnd! Tippe auf den anderen Fuß.')
    expect(count('wrong')).toBe(0)
    expect(useTaskProgress().parts.value).toBe(1)
    await right(w).trigger('click')
    expect(w.text()).toContain('Schritte: 2 von 12')
    expect(useTaskProgress().parts.value).toBe(2)
  })

  it('twelve steps in turn: the father falls on the neck of his son (the embrace replaces both), a bright sound, then the gifts', async () => {
    const w = mountIt()
    await run(w)
    expect(w.find('.gm-embrace').exists()).toBe(true)
    expect(w.find('.gm-embrace').attributes('aria-label')).toBe('Vater und Sohn in Umarmung')
    expect(w.find('.gm-father').exists()).toBe(false)
    expect(w.find('.gm-son').exists()).toBe(false)
    expect(w.text()).toContain('Der Vater fällt seinem Sohn um den Hals.')
    expect(played).toContain('right')
    expect(useTaskProgress().parts.value).toBe(12)
    expect(feet(w).every((b) => b.attributes('disabled') !== undefined)).toBe(true)
    await left(w).trigger('click')
    expect(useTaskProgress().parts.value).toBe(12)
    await tick(2700)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.text()).toContain('Ziehe das Kleid, den Ring und die Schuhe zum Sohn.')
    expect(gifts(w)).toHaveLength(3)
    expect(w.findAll('.gm-foot')).toHaveLength(0)
    expect(w.text()).toContain('Gaben gegeben: 0 von 3')
  })

  it('the left and right arrow keys do the same as the feet', async () => {
    const w = mountIt()
    const field = w.find('.gm-field')
    await field.trigger('keydown', { key: 'ArrowLeft' })
    await field.trigger('keydown', { key: 'ArrowRight' })
    await field.trigger('keydown', { key: 'ArrowRight' })
    expect(w.text()).toContain('Schritte: 2 von 12')
    expect(field.attributes('tabindex')).toBe('0')
  })

  it('the gifts, by the keyboard: the son wears the robe, then everything; any order; a gift is given once; every gift is a part of the task', async () => {
    const w = mountIt()
    await run(w)
    await tick(2700)
    const img = () => w.find('.gm-yardson').attributes('aria-label')
    expect(img()).toBe('Der Sohn: die Gabe hierher legen')
    // the ring first
    await give(w, GIFT.ring)
    expect(w.text()).toContain('Gaben gegeben: 1 von 3')
    expect(w.text()).toContain('Der Ring: gegeben!')
    expect(played).toContain('coin')
    expect(w.find('.gm-sparkle').exists()).toBe(true)
    expect(gifts(w)).toHaveLength(2)
    expect(w.findAll('.gm-gift.given')).toHaveLength(1)
    expect(w.find('.gm-gift.given .gm-mark').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(13)
    // the robe
    await give(w, GIFT.kleid)
    expect(w.text()).toContain('Gaben gegeben: 2 von 3')
    expect(useTaskProgress().parts.value).toBe(14)
    // the son without a gift on him: a tap on the son with nothing chosen does nothing
    await w.find('.gm-yardson').trigger('click')
    expect(useTaskProgress().parts.value).toBe(14)
    // the shoes: everything is on him
    await give(w, GIFT.schuhe)
    expect(useTaskProgress().parts.value).toBe(15)
    expect(played).toContain('snap')
    await tick(2100)
    expect(w.text()).toContain('sah ihn sein Vater, und es jammerte ihn, lief und fiel ihm um seinen Hals und küsste ihn')
    expect(played).toContain('star')
    expect(useTaskProgress().finished.value).toBe(true)
    await w.find('button.adv-btn').trigger('click')
    expect(w.emitted('done')![0]).toEqual([3])
    expect(problems()).toEqual([])
  })

  it('a gift is also given by dragging it to the son, or by choosing it and tapping the son', async () => {
    const w = mountIt()
    await run(w)
    await tick(2700)
    const son = w.find('.gm-yardson').element
    const drop = vi.fn(() => son)
    ;(document as unknown as { elementFromPoint: unknown }).elementFromPoint = drop
    // drag the robe: pointer down on the gift, move a long way, let go over the son
    const robe = w.find('button[aria-label^="Das Kleid"]').element
    pointer(robe, 'pointerdown', 10, 90)
    pointer(window as unknown as Element, 'pointermove', 40, 40)
    pointer(window as unknown as Element, 'pointerup', 50, 30)
    await flushPromises()
    expect(w.text()).toContain('Gaben gegeben: 1 von 3')
    expect(w.text()).toContain('Das Kleid: gegeben!')
    // choose the shoes with a tap (pointer down and up in the same place), then tap the son
    const shoes = w.find('button[aria-label^="Die Schuhe"]').element
    pointer(shoes, 'pointerdown', 10, 90)
    pointer(window as unknown as Element, 'pointerup', 10, 90)
    await flushPromises()
    expect(w.find('button[aria-label^="Die Schuhe"]').attributes('aria-pressed')).toBe('true')
    expect(w.find('.gm-yardson').classes()).toContain('ready')
    await w.find('.gm-yardson').trigger('click')
    expect(w.text()).toContain('Gaben gegeben: 2 von 3')
    expect(w.text()).toContain('Die Schuhe: gegeben!')
    delete (document as unknown as { elementFromPoint?: unknown }).elementFromPoint
  })

  it('English and Spanish words', async () => {
    const en = mountIt(ENTGEGEN, 'en')
    expect(en.text()).toContain('Steps: 0 of 12')
    expect(en.find('button.gm-foot').attributes('aria-label')).toBe('Left foot')
    await en.find('button.gm-foot').trigger('click')
    expect(en.text()).toContain('His father sees him while he is still far away.')
    await en.find('button.gm-foot').trigger('click')
    expect(en.text()).toContain('In turn! Tap the other foot.')
    const es = mountIt(ENTGEGEN, 'es')
    expect(es.text()).toContain('Pasos: 0 de 12')
    expect(es.find('button.gm-foot').attributes('aria-label')).toBe('Pie izquierdo')
    expect(problems()).toEqual([])
  })
})
