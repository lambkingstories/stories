/**
 * "Familien-Spiele v2", the course of two more games (19 Nov 2026): "Find the Pairs" (id `memory`) and "Word Journey" (id `wortreise`), both built like the
 * quiz: title screen (name, line, Play, How to play), players page with the settings of the game, the game with the bar of the game, the podium, leaving
 * asks first and the round is kept. Also: the new texts (de, en, es), the game names, no old design (parchment, brass, medals, serif) and no fixed colours.
 */
import { readFileSync } from 'node:fs'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import { BIG_GAME_TEXTS, withGameTexts } from '@/i18n/bigGames'
import { resetTokens } from '@/use/useFamilyTokens'
import { MEMORY_SIZES } from '@/utils/memoryGame'
import { puzzleOf, parseGame } from '@/utils/wortreiseGame'
import WortreiseWheel from '@/components/molecules/wortreise/WortreiseWheel.vue'

const play = vi.fn()
vi.mock('@/use/useSfx', () => ({ default: () => ({ play, tap: vi.fn() }) }))
vi.mock('@/use/useMusic', () => ({ default: () => ({ playFamily: vi.fn(), playGame: vi.fn(), stop: vi.fn() }) }))
const replace = vi.fn()
vi.mock('vue-router', async (orig) => ({
  ...(await orig<typeof import('vue-router')>()),
  useRoute: () => ({ params: {}, query: {}, name: 'app-family-memory' }),
  useRouter: () => ({ push: vi.fn(), replace, back: vi.fn(), resolve: () => ({ path: '/app/familien-spiele' }), beforeEach: vi.fn(), afterEach: vi.fn(), onError: vi.fn(), options: { history: { state: {} } } })
}))
vi.stubGlobal('APP_VERSION', 'test')
Element.prototype.scrollIntoView = vi.fn()
vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn() }))

import AppFamilyMemoryView from '@/views/app/AppFamilyMemoryView.vue'
import AppFamilyWortreiseView from '@/views/app/AppFamilyWortreiseView.vue'

const all = withGameTexts(messages as never) as { de: Record<string, any>; en: Record<string, any> }
const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'de', messages: { de: all.de, en: all.en } as never, missingWarn: false, fallbackWarn: false })
const opts = { global: { plugins: [i18n], stubs: { RouterLink: true } }, attachTo: document.body }
const src = (p: string) => readFileSync(p, 'utf8').replace(/\r/g, '')

beforeEach(() => {
  localStorage.clear()
  resetTokens()
  vi.clearAllMocks()
})
afterEach(() => {
  vi.useRealTimers()
})

const keptMemory = () => JSON.parse(localStorage.getItem('lk-family-save-memory') ?? 'null')?.state
const keptWortreise = () => JSON.parse(localStorage.getItem('lk-family-save-wortreise') ?? 'null')?.state

// ══ Find the Pairs ═══════════════════════════════════════════════════════════════════════════════════════════════
async function openMemory() {
  const w = mount(AppFamilyMemoryView, opts)
  await flushPromises()
  return w
}
const toMemoryLobby = async (w: ReturnType<typeof mount>) => {
  await w.find('.fam-start-play').trigger('click')
  await flushPromises()
}
const startMemory = async (w: ReturnType<typeof mount>) => {
  await w.find('.fam-lobby-go .fam-btn').trigger('click')
  await flushPromises()
}

describe('Find the Pairs: title screen and players page', () => {
  it('the title screen has the name (never "Memory"), the line, the pill "Spielen", "So geht\'s" with five lines', async () => {
    const w = await openMemory()
    expect(w.find('.fam-start-name').text()).toBe('Paare finden')
    expect(w.find('.fam-start-line').text()).toBe('Große Bibel-Bilder')
    expect(w.find('.fam-start-play').text()).toBe('Spielen')
    expect(w.find('.fam-start-how').text()).toContain('So geht’s')
    expect(w.findAll('.fam-start-list li').map((li) => li.text().replace(/^\d/, ''))).toEqual([
      'Alle Karten liegen verdeckt auf dem Tisch.',
      'Dreh zwei Karten um.',
      'Zeigen beide dasselbe Bild, gehört dir das Paar und du darfst gleich noch einmal.',
      'Sonst werden sie wieder umgedreht und der Nächste ist dran.',
      'Wer am Ende die meisten Paare hat, gewinnt. Wer allein spielt, zählt die Züge.'
    ])
    expect(w.text()).not.toContain('Memory')
    // the old pieces are gone
    expect(w.find('.fm-setup').exists()).toBe(false)
    expect(w.find('.mb').exists()).toBe(false)
    expect(w.find('.mt-title').exists()).toBe(false)
    w.unmount()
  })

  it('the players page: figures and names for one to four, the size small / medium / large, the capsule', async () => {
    const w = await openMemory()
    await toMemoryLobby(w)
    expect(w.find('.fam-lobby-title').text()).toBe('Wer spielt mit?')
    expect(w.findAll('.fam-lobby-count .fam-chip').map((c) => c.text())).toEqual(['1', '2', '3', '4'])
    expect(w.findAll('.fam-lobby-seat')).toHaveLength(2)
    const sizes = w.findAll('.fm-size')
    expect(sizes.map((s) => s.find('.fm-size-name').text())).toEqual(['Klein', 'Mittel', 'Groß'])
    expect(sizes.map((s) => s.find('.fm-size-pairs').text())).toEqual(['6 Paare', '10 Paare', '15 Paare'])
    expect(sizes[1]!.attributes('aria-checked')).toBe('true')
    await sizes[0]!.trigger('click')
    expect(sizes[0]!.attributes('aria-checked')).toBe('true')
    expect(w.find('.fam-lobby-go .fam-btn').text()).toBe("Los geht's")
    // back goes to the title screen, back again to the games
    await w.find('.mt-back').trigger('click')
    expect(w.find('.fam-start').exists()).toBe(true)
    await w.find('.mt-back').trigger('click')
    expect(replace).toHaveBeenCalledWith({ name: 'app-family' })
    w.unmount()
  })
})

describe('Find the Pairs: the game', () => {
  it('three players, small: the bar shows them, a miss gives the turn on, pairs count, the podium has three columns', async () => {
    vi.useFakeTimers()
    const w = await openMemory()
    await toMemoryLobby(w)
    await w.findAll('.fam-lobby-count .fam-chip')[2]!.trigger('click')
    await w.findAll('.fam-lobby-name')[0]!.setValue('Anna')
    await w.findAll('.fm-size')[0]!.trigger('click')
    await startMemory(w)
    expect(w.find('.fam-bar-title').text()).toBe('Paare finden')
    expect(w.find('.fam-bar-sub').text()).toBe('Paare 0/6')
    expect(w.findAll('.fam-bar-chip')).toHaveLength(3)
    expect(w.find('.fam-bar-chip.is-turn').text()).toContain('Anna')
    expect(w.find('.mt-top').exists()).toBe(false)
    const cards = w.findAll('.fm-card')
    expect(cards).toHaveLength(MEMORY_SIZES.small.pairs * 2)
    // a card that is turned shows the name of its scene; none of the old parchment bands or linen
    expect(w.find('.fm-band').exists()).toBe(true)
    const st = keptMemory()
    const byScene = new Map<number, number[]>()
    for (const c of st.cards as { id: number; scene: number }[]) byScene.set(c.scene, [...(byScene.get(c.scene) ?? []), c.id])
    const pairs = [...byScene.values()]
    // a miss (two cards of two scenes): the next person is on turn after a moment
    await cards[pairs[0]![0]!]!.trigger('click')
    await cards[pairs[1]![0]!]!.trigger('click')
    expect(w.findAll('.fm-card.is-face')).toHaveLength(2)
    await vi.advanceTimersByTimeAsync(1200)
    expect(w.findAll('.fm-card.is-face')).toHaveLength(0)
    expect(w.find('.fam-bar-chip.is-turn').text()).toContain('Spieler 2')
    // the second person finds a pair and goes on, then the pairs are all found
    for (const [a, b] of pairs.slice(0, 3)) {
      await cards[a!]!.trigger('click')
      await cards[b!]!.trigger('click')
    }
    expect(w.find('.fam-bar-chip.is-turn').text()).toContain('Spieler 2')
    expect(w.find('.fam-bar-sub').text()).toBe('Paare 3/6')
    for (const [a, b] of pairs.slice(3)) {
      await cards[a!]!.trigger('click')
      await cards[b!]!.trigger('click')
    }
    await vi.advanceTimersByTimeAsync(1300)
    await flushPromises()
    expect(w.find('.fam-pod').exists()).toBe(true)
    expect(w.find('.fam-pod-head').text()).toContain('Spieler 2')
    expect(w.findAll('.fam-pod-col').length).toBeGreaterThanOrEqual(2)
    expect(w.find('.fam-pod-again').text()).toBe('Nochmal')
    expect(w.find('.fam-pod-change').text()).toBe('Neue Runde mit anderen Spielern')
    expect(w.find('.fam-pod-exit').text()).toBe('Zur Auswahl')
    // the round is forgotten at the end; "Nochmal" begins a new one with the same settings
    expect(keptMemory()).toBeFalsy()
    await w.find('.fam-pod-again').trigger('click')
    await flushPromises()
    expect(w.findAll('.fm-card')).toHaveLength(12)
    expect(w.find('.fam-bar-sub').text()).toBe('Paare 0/6')
    w.unmount()
  })

  it('one person alone: the moves are counted, the end is the golden disc with the moves in the headline', async () => {
    vi.useFakeTimers()
    localStorage.setItem('lk-family-names', JSON.stringify(['Anna']))
    const w = await openMemory()
    await toMemoryLobby(w)
    expect(w.findAll('.fam-lobby-seat')).toHaveLength(1)
    await w.findAll('.fm-size')[0]!.trigger('click')
    await startMemory(w)
    expect(w.findAll('.fam-bar-chip')).toHaveLength(1)
    expect(w.find('.fam-bar-chip').text()).toContain('Züge')
    const cards = w.findAll('.fm-card')
    const byScene = new Map<number, number[]>()
    for (const c of keptMemory().cards as { id: number; scene: number }[]) byScene.set(c.scene, [...(byScene.get(c.scene) ?? []), c.id])
    for (const [a, b] of byScene.values()) {
      await cards[a!]!.trigger('click')
      await cards[b!]!.trigger('click')
    }
    await vi.advanceTimersByTimeAsync(1300)
    await flushPromises()
    expect(w.find('.fam-pod-solo').exists()).toBe(true)
    expect(w.find('.fam-pod-head').text()).toBe('Geschafft in 6 Zügen!')
    w.unmount()
  })

  it('leaving asks first and keeps the round: the title screen offers "Weiterspielen" with the pairs, and the round goes on', async () => {
    const w = await openMemory()
    await toMemoryLobby(w)
    await startMemory(w)
    const cards = w.findAll('.fm-card')
    expect(cards).toHaveLength(MEMORY_SIZES.medium.pairs * 2)
    await w.find('.fam-bar-btn').trigger('click')
    expect(w.find('.fam-bar-dialog').exists()).toBe(true)
    expect(w.find('.fam-bar-q').text()).toBe('Spiel beenden?')
    expect(w.find('.fam-bar-t').text()).toBe(all.de.app.bigGames.familyFlow.leaveKept)
    // "Weiterspielen" closes the question and the game stays
    await w.find('.fam-bar-stay').trigger('click')
    expect(w.find('.fam-bar-dialog').exists()).toBe(false)
    expect(w.find('.fam-bar').exists()).toBe(true)
    await w.find('.fam-bar-btn').trigger('click')
    await w.find('.fam-bar-end').trigger('click')
    await flushPromises()
    expect(w.find('.fam-start').exists()).toBe(true)
    expect(w.find('.fam-start-info').text()).toBe('Paare 0/10')
    await w.find('.fam-start-resume').trigger('click')
    await flushPromises()
    expect(w.find('.fam-bar-sub').text()).toBe('Paare 0/10')
    expect(w.findAll('.fm-card')).toHaveLength(20)
    w.unmount()
  })

  it('the cards are as big as the room allows: the width of a card follows the measured board', async () => {
    const w = await openMemory()
    await toMemoryLobby(w)
    await startMemory(w)
    const board = w.find('.fm-board')
    const width = parseInt(String(board.attributes('style')).match(/--fm-w:\s*(\d+)px/)![1]!, 10)
    expect(width).toBeGreaterThanOrEqual(56)
    expect(width).toBeLessThanOrEqual(220)
    expect(String(board.attributes('style'))).toContain('--fm-cols: 4')
    w.unmount()
  })
})

describe('Find the Pairs and Plus', () => {
  it('without Plus the title screen shows the lock card, and the pill and the button open the Plus sheet', async () => {
    vi.resetModules()
    const showUpsell = vi.fn()
    vi.doMock('@/use/usePremium', () => ({ PREMIUM_TEASER: true, hasFeature: () => false, showUpsell: (...a: unknown[]) => showUpsell(...a) }))
    const { default: View } = await import('@/views/app/AppFamilyMemoryView.vue')
    const w = mount(View, opts)
    await flushPromises()
    expect(w.text()).toContain('gehört zu LambKing Plus')
    expect(w.find('.fam-start-how').exists()).toBe(false)
    await w.find('.fm-lock').trigger('click')
    expect(showUpsell).toHaveBeenCalledWith('family')
    showUpsell.mockClear()
    await w.find('.fam-start-play').trigger('click')
    expect(showUpsell).toHaveBeenCalledWith('family')
    expect(w.find('.fam-lobby').exists()).toBe(false)
    w.unmount()
    vi.doUnmock('@/use/usePremium')
  })
})

// ══ Word Journey ═════════════════════════════════════════════════════════════════════════════════════════════════
async function openWortreise() {
  const w = mount(AppFamilyWortreiseView, opts)
  await flushPromises()
  return w
}
const press = async (w: ReturnType<typeof mount>, text: string) => {
  const b = w.findAll('button').find((x) => x.text().includes(text))
  expect(b, `button ${text}`).toBeTruthy()
  await b!.trigger('click')
  await flushPromises()
}

describe('Word Journey: title screen and players page', () => {
  it('the title screen has the name, the line, "Spielen" and the five lines of "So geht\'s"; the page has no title of its own', async () => {
    const w = await openWortreise()
    expect(w.find('.fam-start-name').text()).toBe('Wortreise')
    expect(w.find('.fam-start-line').text()).toBe('Wörter aus der Bibel finden')
    expect(w.findAll('.fam-start-list li')).toHaveLength(5)
    expect(w.find('.mt-title').exists()).toBe(false)
    w.unmount()
  })

  it('the players page: up to six people, the level as three chips with their line, the stages 3, 5, 7 as round chips', async () => {
    const w = await openWortreise()
    await press(w, 'Spielen')
    expect(w.findAll('.fam-lobby-count .fam-chip').map((c) => c.text())).toEqual(['1', '2', '3', '4', '5', '6'])
    const levels = w.findAll('.wr-level')
    expect(levels.map((l) => l.find('.wr-level-t').text())).toEqual(['Kinder', 'Familie', 'Profis'])
    expect(levels[1]!.find('.wr-level-s').text()).toBe('6 Buchstaben')
    expect(levels[1]!.attributes('aria-checked')).toBe('true')
    await levels[2]!.trigger('click')
    expect(levels[2]!.attributes('aria-checked')).toBe('true')
    expect(w.findAll('.wr-mark').map((m) => m.text())).toEqual(['3', '5', '7'])
    expect(w.find('.wr-mark[aria-checked="true"]').text()).toBe('5')
    w.unmount()
  })
})

describe('Word Journey: the game', () => {
  it('the bar of the game shows the stage and the place; whose turn it is stands on a card; the grid, the circle and the helps are in the new look', async () => {
    const w = await openWortreise()
    await press(w, 'Spielen')
    await w.findAll('.fam-lobby-name')[0]!.setValue('Anna')
    await press(w, "Los geht's")
    expect(w.find('.fam-bar-title').text()).toBe('Wortreise')
    expect(w.find('.fam-bar-sub').text()).toMatch(/^Etappe 1 von 5 · /)
    expect(w.findAll('.fam-bar-chip')).toHaveLength(2)
    expect(w.find('.fam-bar-chip.is-turn').text()).toContain('Anna')
    expect(w.find('.wr-hand h2').text()).toBe('Anna ist dran')
    expect(w.find('.wj').exists()).toBe(true)
    await press(w, "Los geht's")
    expect(w.find('.ww-board').exists()).toBe(true)
    expect(w.find('.wg').exists()).toBe(true)
    expect(w.findAll('.wr-act').map((b) => b.text().replace(/\s+/g, ' '))).toEqual(['Lupe · 5', 'Passen'])
    expect(w.find('.wr-bonus').exists()).toBe(true)
    // a word of the grid: the bar counts the points of Anna
    const p = puzzleOf(parseGame(keptWortreise().game)!)
    w.findComponent(WortreiseWheel).vm.$emit('submit', p.words[0]!.key)
    await flushPromises()
    const score = keptWortreise().game.scores[0]
    expect(score).toBeGreaterThan(0)
    expect(w.find('.fam-bar-chip.is-turn .fam-bar-score').text()).toBe(String(score))
    expect(w.find('.wr-next').text()).toBe('Weiter an Spieler 2')
    w.unmount()
  })

  it('leaving asks first and keeps the game: the title screen offers "Weiterspielen" with the stage and the person on turn', async () => {
    const w = await openWortreise()
    await press(w, 'Spielen')
    await press(w, "Los geht's")
    await press(w, "Los geht's")
    await w.find('.fam-bar-btn').trigger('click')
    expect(w.find('.fam-bar-q').text()).toBe('Spiel beenden?')
    expect(w.find('.fam-bar-t').text()).toBe(all.de.app.bigGames.familyFlow.leaveKept)
    await w.find('.fam-bar-end').trigger('click')
    await flushPromises()
    expect(w.find('.fam-start').exists()).toBe(true)
    expect(w.find('.fam-start-info').text()).toBe('Etappe 1 von 5, Spieler 1 ist dran')
    await w.find('.fam-start-resume').trigger('click')
    await flushPromises()
    expect(w.find('.ww-board').exists()).toBe(true)
    w.unmount()
  })

  it('"Neue Runde mit anderen Spielern" opens the players page, "Zur Auswahl" goes back to the games', async () => {
    localStorage.setItem('lk-family-names', JSON.stringify(['Anna']))
    const w = await openWortreise()
    await press(w, 'Spielen')
    await w.findAll('.wr-mark')[0]!.trigger('click')
    await press(w, "Los geht's")
    for (let guard = 0; guard < 80 && !w.find('.fam-pod').exists(); guard++) {
      const next = w.findAll('button').find((b) => /^(Zur nächsten Etappe|Zum Ergebnis|Weiter|Los geht)/.test(b.text()))
      if (next) {
        await next.trigger('click')
        await flushPromises()
        continue
      }
      const st = keptWortreise()
      const p = puzzleOf(parseGame(st.game)!)
      const left = p.words.find((x) => !st.game.progress.found.includes(x.key))!
      w.findComponent(WortreiseWheel).vm.$emit('submit', left.key)
      await flushPromises()
    }
    // one person alone: the golden disc, the points in the headline, the line of the journey
    expect(w.find('.fam-pod-solo').exists()).toBe(true)
    expect(w.find('.fam-pod-head').text()).toContain('Punkte')
    expect(w.text()).toContain('Ihr seid in Jericho angekommen')
    await w.find('.fam-pod-change').trigger('click')
    expect(w.find('.fam-lobby').exists()).toBe(true)
    await press(w, "Los geht's")
    await press(w, "Los geht's")
    expect(w.find('.ww-board').exists()).toBe(true)
    w.unmount()
  })
})

// ══ texts and design ═════════════════════════════════════════════════════════════════════════════════════════════
describe('the new texts and the look', () => {
  const KEYS = ['rule1', 'rule2', 'rule3', 'rule4', 'rule5']
  for (const flow of ['memoryFlow', 'wortreiseFlow'] as const) {
    it(`${flow}: the five lines exist in german, english and spanish, none is empty, none holds a name of a game`, () => {
      for (const lang of ['de', 'en', 'es'] as const) {
        const texts = BIG_GAME_TEXTS[lang][flow] as Record<string, string>
        expect(Object.keys(texts).sort(), `${flow} ${lang}`).toEqual(KEYS)
        for (const k of KEYS) {
          expect(texts[k]!.length, `${flow} ${lang} ${k}`).toBeGreaterThan(10)
          expect(texts[k]!, `${flow} ${lang} ${k}`).not.toMatch(/Memory|Wortreise|Word Journey|Viaje de palabras|Paare finden|Find the Pairs|Encuentra las parejas/)
        }
      }
    })
  }

  it('the names of the two games come from the texts of the games, in all three languages', () => {
    const es = readFileSync('src/i18n/es/teil3.ts', 'utf8')
    expect(es).toContain("hub_memory: 'Encuentra las parejas'")
    expect((BIG_GAME_TEXTS.es.wortreise as Record<string, string>).hub).toBe('Viaje de palabras')
    expect((BIG_GAME_TEXTS.en.wortreise as Record<string, string>).hub).toBe('Word Journey')
    expect(all.en.app.family.hub_memory).toBe('Find the Pairs')
    expect(all.de.app.family.hub_memory).toBe('Paare finden')
  })

  const VIEWS = ['src/views/app/AppFamilyMemoryView.vue', 'src/views/app/AppFamilyWortreiseView.vue', 'src/components/molecules/wortreise/WortreiseGrid.vue', 'src/components/molecules/wortreise/WortreiseJourney.vue', 'src/components/molecules/wortreise/WortreiseWheel.vue']
  it('no parchment, brass, medal, wax, laurel, no serif font and none of the old pieces and pictures in the two games', () => {
    for (const f of VIEWS) {
      const text = src(f)
      for (const old of ['MapPaper', 'MapButton', 'MapCoin', 'MapMedallion', 'MapSeats', 'MapResult', 'MapResume', 'MapScoreBar', 'MapRoute', 'mp-serif', 'parchment', 'papyrus', 'lorbeer', 'siegel', 'medaillon', 'knopf.webp', 'karten-rueck', 'pergament', 'scheibe.webp', 'stein.webp']) {
        expect(text.toLowerCase(), `${f} has "${old}"`).not.toContain(old.toLowerCase())
      }
      expect(text, f).not.toMatch(/\bbrass\b|\bbronze\b|\bmedal\b|\blinen\b/i)
    }
  })
  it('the styles hold only tokens and colour mixes (no hex colours)', () => {
    for (const f of VIEWS) {
      const text = src(f)
      const style = text.slice(text.indexOf('<style'))
      expect(style, f).not.toMatch(/#[0-9a-fA-F]{3,6}\b/)
      expect(style, f).not.toContain('--mp-')
    }
  })
  it('motion (animation) is only used where motion is welcome', () => {
    for (const f of VIEWS) {
      const text = src(f)
      const style = text.slice(text.indexOf('<style'))
      // every `animation:` line sits under a block "(prefers-reduced-motion: no-preference)"
      const lines = style.split('\n')
      lines.forEach((line, i) => {
        if (!/^\s+animation:/.test(line)) return
        const before = lines.slice(0, i).reverse().find((l) => /^@media/.test(l))
        expect(before ?? '', `${f}: ${line.trim()}`).toContain('no-preference')
      })
    }
  })
  it('the tap areas are at least 48 px: the cards, the buttons under the circle, the little round buttons', () => {
    const wr = src('src/views/app/AppFamilyWortreiseView.vue')
    expect(wr).toMatch(/\.wr-mini\n\s+display: grid[^]*?width: 48px\n\s+height: 48px/)
    const wheel = src('src/components/molecules/wortreise/WortreiseWheel.vue')
    expect(wheel).toMatch(/min-width: 48px\n\s+min-height: 48px/)
    const mem = src('src/views/app/AppFamilyMemoryView.vue')
    expect(mem).toMatch(/\.fm-rotate\n[^]*?width: 48px\n\s+height: 48px/)
  })
})
