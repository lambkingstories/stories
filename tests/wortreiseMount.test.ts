/**
 * The Wortreise on the screen: the setup page, the hand-over, a word that is drawn on the circle (also with the keys), the points, the pass,
 * the helps, the end of a stage and of the journey, keeping the game and taking it up again, and the hub with its seventh place.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import app from '../src/i18n/app'
import { withGameTexts } from '../src/i18n/bigGames'

vi.mock('@/use/useSfx', () => ({ default: () => ({ play: vi.fn() }) }))
vi.mock('@/use/useMusic', () => ({ default: () => ({ playFamily: vi.fn(), playGame: vi.fn(), stop: vi.fn() }) }))
const push = vi.fn()
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: {}, query: {}, name: 'app-family-wortreise' }),
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn(), beforeEach: vi.fn(), afterEach: vi.fn(), onError: vi.fn(), options: { history: { state: {} } } })
}))

import AppFamilyWortreiseView from '@/views/app/AppFamilyWortreiseView.vue'
import AppFamilyGamesView from '@/views/app/AppFamilyGamesView.vue'
import WortreiseWheel from '@/components/molecules/wortreise/WortreiseWheel.vue'
import { puzzleOf, parseGame } from '@/utils/wortreiseGame'

function i18nFor(locale: 'de' | 'en') {
  const messages = withGameTexts(app as never) as { de: object; en: object }
  return createI18n({ legacy: false, locale, fallbackLocale: 'de', messages: { de: messages.de, en: messages.en } as never, missingWarn: false, fallbackWarn: false })
}

const stubs = { RouterLink: true, PlusBadge: true }

async function open(locale: 'de' | 'en' = 'de') {
  const w = mount(AppFamilyWortreiseView, { global: { plugins: [i18nFor(locale)], stubs }, attachTo: document.body })
  await flushPromises()
  return w
}

const kept = () => JSON.parse(localStorage.getItem('lk-family-save-wortreise') ?? 'null')?.state

const press = async (w: ReturnType<typeof mount>, text: string) => {
  const b = w.findAll('button').find((x) => x.text().includes(text))
  expect(b, `button ${text}`).toBeTruthy()
  await b!.trigger('click')
  await flushPromises()
}

/** From the title screen to the players page ("Play"). */
const toLobby = async (w: ReturnType<typeof mount>, text = 'Spielen') => press(w, text)

/** Draws a word on the circle (the wheel hands it over like a finger that is lifted). */
async function draw(w: ReturnType<typeof mount>, word: string) {
  w.findComponent(WortreiseWheel).vm.$emit('submit', word)
  await flushPromises()
}

describe('Wortreise view', () => {
  beforeEach(() => {
    localStorage.clear()
    push.mockClear()
  })

  it('opens with the title screen (name, line, Play, How to play) and goes on to the players page: seats, three levels, three lengths of the journey and the start', async () => {
    const w = await open()
    expect(w.find('.fam-start-name').text()).toBe('Wortreise')
    expect(w.find('.fam-start-line').text()).toBe('Wörter aus der Bibel finden')
    expect(w.find('.fam-start-play').text()).toBe('Spielen')
    expect(w.findAll('.fam-start-list li')).toHaveLength(5)
    expect(w.find('.wr-level').exists()).toBe(false)
    await toLobby(w)
    expect(w.text()).toContain('Wer spielt mit?')
    expect(w.findAll('.fam-lobby-seat')).toHaveLength(2)
    expect(w.findAll('.wr-level')).toHaveLength(3)
    expect(w.findAll('.wr-mark').map((b) => b.text())).toEqual(['3', '5', '7'])
    expect(w.find('.fam-lobby-go .fam-btn').exists()).toBe(true)
    w.unmount()
  })

  it('starts: whose turn it is, then the circle with its letters and the grid', async () => {
    const w = await open()
    await toLobby(w)
    await press(w, "Los geht's")
    expect(w.text()).toContain('Spieler 1 ist dran')
    expect(w.text()).toContain('Etappe 1 von 5')
    await press(w, "Los geht's")
    expect(w.find('.ww-board').exists()).toBe(true)
    const game = parseGame(kept().game)!
    expect(game).toBeTruthy()
    expect(w.findAll('.ww-node')).toHaveLength(6)
    expect(w.findAll('.ww-node').map((n) => n.text()).sort()).toEqual([...puzzleOf(game).circle].sort())
    expect(w.findAll('.wg-sq').length).toBeGreaterThan(10)
    w.unmount()
  })

  it('a wrong word shakes and tells so; a word of the grid fills it, gives points and hands over to the next person', async () => {
    const w = await open()
    await toLobby(w)
    await press(w, "Los geht's")
    await press(w, "Los geht's")
    const game = parseGame(kept().game)!
    const p = puzzleOf(game)
    await draw(w, 'QQQ')
    expect(w.find('.wr-msg').text()).toContain('gibt es hier nicht')
    const word = p.words[0]!.key
    await draw(w, word)
    expect(w.find('.wr-msg').text()).toContain('+')
    expect(w.findAll('.wg-sq.is-on').length).toBeGreaterThanOrEqual(word.length)
    expect(kept().game.scores[0]).toBeGreaterThan(0)
    // the circle rests until the device is passed on
    await draw(w, p.words[1]!.key)
    expect(kept().game.progress.found).toHaveLength(1)
    await press(w, 'Weiter an Spieler 2')
    expect(w.text()).toContain('Spieler 2 ist dran')
    w.unmount()
  })

  it('a bonus word gives points and the turn goes on', async () => {
    const w = await open()
    await toLobby(w)
    await press(w, "Los geht's")
    await press(w, "Los geht's")
    const p = puzzleOf(parseGame(kept().game)!)
    const b = p.bonus[0]
    if (!b) return
    await draw(w, b)
    expect(w.find('.wr-msg').text()).toContain('Bonuswort')
    expect(kept().game.scores[0]).toBeGreaterThan(0)
    expect(kept().game.turn).toBe(0)
    await draw(w, b)
    expect(w.find('.wr-msg').text()).toContain('schon')
    w.unmount()
  })

  it('a help shows a letter and counts down; passing hands over to the next person', async () => {
    const w = await open()
    await toLobby(w)
    await press(w, "Los geht's")
    await press(w, "Los geht's")
    await press(w, 'Lupe')
    expect(kept().game.progress.shown).toHaveLength(1)
    expect(kept().game.hints).toBe(4)
    await press(w, 'Passen')
    expect(w.text()).toContain('Spieler 2 ist dran')
    expect(kept().game.turn).toBe(1)
    w.unmount()
  })

  it('plays a whole journey of three stages to the result and forgets the kept game', async () => {
    localStorage.setItem('lk-family-names', JSON.stringify(['Anna', 'Ben']))
    const w = await open()
    await toLobby(w)
    await w.findAll('.wr-mark')[0]!.trigger('click')
    await press(w, "Los geht's")
    for (let guard = 0; guard < 80; guard++) {
      if (w.find('.fam-pod-again').exists()) break
      const next = w.findAll('button').find((b) => /^(Zur nächsten Etappe|Zum Ergebnis)/.test(b.text()))
      if (next) {
        await next.trigger('click')
        await flushPromises()
        continue
      }
      const go = w.findAll('button').find((b) => b.text().includes("Los geht's"))
      if (go) {
        await go.trigger('click')
        await flushPromises()
        continue
      }
      const done = w.findAll('button').find((b) => /^Weiter/.test(b.text()))
      if (done) {
        await done.trigger('click')
        await flushPromises()
        continue
      }
      const st = kept()
      const p = puzzleOf(parseGame(st.game)!)
      const left = p.words.find((x) => !st.game.progress.found.includes(x.key))!
      await draw(w, left.key)
    }
    expect(w.find('.fam-pod-head').text()).toContain('gewonnen')
    expect(w.findAll('.fam-pod-col')).toHaveLength(2)
    expect(w.text()).toContain('Punkte')
    expect(w.text()).toContain('Jericho')
    expect(w.find('.fam-pod-again').text()).toBe('Nochmal')
    expect(w.find('.fam-pod-change').text()).toBe('Neue Runde mit anderen Spielern')
    expect(w.find('.fam-pod-exit').text()).toBe('Zur Auswahl')
    expect(kept()).toBeFalsy()
    w.unmount()
  })

  it('a person who plays alone goes on without a hand-over', async () => {
    localStorage.setItem('lk-family-names', JSON.stringify(['Anna']))
    const w = await open()
    await toLobby(w)
    await press(w, "Los geht's")
    await press(w, "Los geht's")
    const p = puzzleOf(parseGame(kept().game)!)
    await draw(w, p.words[0]!.key)
    await press(w, 'Weiter')
    expect(w.find('.ww-board').exists()).toBe(true)
    expect(w.text()).not.toContain('ist dran')
    expect(kept().game.turn).toBe(0)
    await press(w, 'Passen')
    expect(w.find('.ww-board').exists()).toBe(true)
    w.unmount()
  })

  it('keeps the game and offers to keep playing after the page was left', async () => {
    let w = await open()
    await toLobby(w)
    await press(w, "Los geht's")
    await press(w, "Los geht's")
    const p = puzzleOf(parseGame(kept().game)!)
    await draw(w, p.words[0]!.key)
    const scoreBefore = kept().game.scores[0]
    w.unmount()
    w = await open()
    expect(w.text()).toContain('Weiterspielen')
    expect(w.text()).toContain('Etappe 1 von 5')
    await press(w, 'Weiterspielen')
    expect(w.find('.ww-board').exists() || w.text().includes('ist dran')).toBe(true)
    expect(kept().game.scores[0]).toBe(scoreBefore)
    w.unmount()
  })

  it('throws away a kept game that does not fit', async () => {
    localStorage.setItem('lk-family-save-wortreise', JSON.stringify({ v: 1, at: Date.now(), state: { phase: 'play', game: { nope: 1 }, names: [], level: 'kids', circle: [] } }))
    const w = await open()
    expect(w.text()).not.toContain('Weiterspielen')
    expect(localStorage.getItem('lk-family-save-wortreise')).toBeNull()
    w.unmount()
  })

  it('speaks english', async () => {
    const w = await open('en')
    expect(w.text()).toContain('Word Journey')
    await toLobby(w, 'Play')
    expect(w.text()).toContain('Who is playing?')
    w.unmount()
  })
})

describe('Family hub', () => {
  it('has the Wortreise as the seventh place and opens it', async () => {
    push.mockClear()
    const w = mount(AppFamilyGamesView, { global: { plugins: [i18nFor('de')], stubs }, attachTo: document.body })
    await flushPromises()
    const places = w.findAll('.fh-box')
    expect(places).toHaveLength(7)
    expect(places[6]!.text()).toContain('Wortreise')
    await places[6]!.trigger('click')
    expect(push).toHaveBeenCalledWith({ name: 'app-family-wortreise' })
    w.unmount()
  })
})
