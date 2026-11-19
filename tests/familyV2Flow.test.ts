/**
 * "Familien-Spiele v2", the course of a game (19 Nov 2026): title screen (FamilyStart, FamilyHero), players page (FamilyLobby), bar of the game
 * (FamilyGameBar), podium (FamilyPodium) and the quiz that is built with them (Start -> Lobby -> Game -> End).
 */
import { readFileSync } from 'node:fs'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import { BIG_GAME_TEXTS, withGameTexts } from '@/i18n/bigGames'
import FamilyGameBar from '@/components/molecules/family/FamilyGameBar.vue'
import FamilyHero from '@/components/molecules/family/FamilyHero.vue'
import FamilyLobby from '@/components/molecules/family/FamilyLobby.vue'
import FamilyPodium from '@/components/molecules/family/FamilyPodium.vue'
import FamilyStart from '@/components/molecules/family/FamilyStart.vue'
import { FAMILY_GAMES } from '@/components/molecules/family/familyGames'
import useFamilyTokens, { resetTokens } from '@/use/useFamilyTokens'

const play = vi.fn()
vi.mock('@/use/useSfx', () => ({ default: () => ({ play, tap: vi.fn() }) }))
vi.mock('@/use/useMusic', () => ({ default: () => ({ playFamily: vi.fn(), playGame: vi.fn(), stop: vi.fn() }) }))
const replace = vi.fn()
vi.mock('vue-router', async (orig) => ({
  ...(await orig<typeof import('vue-router')>()),
  useRoute: () => ({ params: {}, query: {}, name: 'app-family-quiz' }),
  useRouter: () => ({ push: vi.fn(), replace, back: vi.fn(), resolve: () => ({ path: '/app/familien-spiele' }), beforeEach: vi.fn(), afterEach: vi.fn(), onError: vi.fn(), options: { history: { state: {} } } })
}))
vi.stubGlobal('APP_VERSION', 'test')
Element.prototype.scrollIntoView = vi.fn()
vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn() }))

const all = withGameTexts(messages as never) as { de: Record<string, any>; en: Record<string, any> }
const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'de', messages: { de: all.de, en: all.en } as never, missingWarn: false, fallbackWarn: false })
const opts = { global: { plugins: [i18n], stubs: { RouterLink: true } }, attachTo: document.body }
const src = (p: string) => readFileSync(p, 'utf8').replace(/\r/g, '')
const DIR = 'src/components/molecules/family/'

beforeEach(() => {
  localStorage.clear()
  resetTokens()
  vi.clearAllMocks()
})

describe('FamilyHero', () => {
  it('shows the symbol of the game on its colour while there is no picture, and the picture on top as soon as it has loaded', async () => {
    const w = mount(FamilyHero, { props: { game: 'who' } })
    expect(w.find('.fam-hero-symbol').attributes('src')).toContain('symbole/who.webp')
    const img = w.find('.fam-hero-img')
    expect(img.attributes('src')).toMatch(/images\/familie\/hero\/who(-klein)?\.webp$/)
    expect(w.classes()).not.toContain('is-loaded')
    await img.trigger('load')
    expect(w.classes()).toContain('is-loaded')
  })
  it('a missing picture: it tries the other file, and then it stays with the stand-in (no broken picture)', async () => {
    const w = mount(FamilyHero, { props: { game: 'quiz' } })
    const first = w.find('.fam-hero-img').attributes('src')
    await w.find('.fam-hero-img').trigger('error')
    const second = w.find('.fam-hero-img').attributes('src')
    expect(second).not.toBe(first)
    expect([first, second].sort().join('|')).toMatch(/quiz-klein\.webp\|.*quiz\.webp$/)
    await w.find('.fam-hero-img').trigger('error')
    expect(w.find('.fam-hero-img').exists()).toBe(false)
    expect(w.find('.fam-hero-symbol').exists()).toBe(true)
  })
})

describe('FamilyStart', () => {
  it('shows the name, the line, "Spielen" and the folding rules', async () => {
    const w = mount(FamilyStart, { props: { game: 'order', name: 'Reihenfolge-Rennen', tagline: 'Stationen ordnen', rules: ['Eins', 'Zwei'] }, ...opts })
    expect(w.find('.fam-start-name').text()).toBe('Reihenfolge-Rennen')
    expect(w.find('.fam-start-line').text()).toBe('Stationen ordnen')
    expect(w.find('.fam-start-play').text()).toBe('Spielen')
    expect(w.find('.fam-start-play').classes()).toContain('fam-btn--primary')
    expect(w.find('.fam-hero').exists()).toBe(true)
    const how = w.find('.fam-start-how')
    expect(how.attributes('aria-expanded')).toBe('false')
    expect(w.find('.fam-start-fold').classes()).not.toContain('is-open')
    await how.trigger('click')
    expect(how.attributes('aria-expanded')).toBe('true')
    expect(w.find('.fam-start-fold').classes()).toContain('is-open')
    expect(w.findAll('.fam-start-list li')).toHaveLength(2)
    await w.find('.fam-start-play').trigger('click')
    expect(w.emitted('play')).toHaveLength(1)
    w.unmount()
  })
  it('no rules: no "So geht\'s" button; a begun round: "Weiterspielen" is the main capsule and "Neues Spiel" the quiet one', async () => {
    const plain = mount(FamilyStart, { props: { game: 'memory', name: 'Memory' }, ...opts })
    expect(plain.find('.fam-start-how').exists()).toBe(false)
    plain.unmount()
    const w = mount(FamilyStart, { props: { game: 'memory', name: 'Memory', resumeInfo: 'Frage 3 von 10' }, ...opts })
    expect(w.find('.fam-start-info').text()).toBe('Frage 3 von 10')
    expect(w.find('.fam-start-resume').text()).toBe('Weiterspielen')
    expect(w.find('.fam-start-resume').classes()).toContain('fam-btn--primary')
    expect(w.find('.fam-start-play').text()).toBe('Neues Spiel')
    expect(w.find('.fam-start-play').classes()).toContain('fam-btn--secondary')
    await w.find('.fam-start-resume').trigger('click')
    expect(w.emitted('resume')).toHaveLength(1)
    w.unmount()
  })
})

describe('FamilyLobby', () => {
  const props = { game: 'quiz' as const, count: 3, names: ['Anna', '', ''], min: 2, max: 8 }

  it('number chips from the minimum, a card with figure and name for every player, the capsule at the foot', async () => {
    const w = mount(FamilyLobby, { props, ...opts })
    expect(w.find('.fam-lobby-title').text()).toBe('Wer spielt mit?')
    expect(w.findAll('.fam-lobby-count .fam-chip')).toHaveLength(7)
    expect(w.findAll('.fam-lobby-count .fam-chip.is-on')).toHaveLength(1)
    expect(w.findAll('.fam-lobby-seat')).toHaveLength(3)
    expect(w.findAll('.fam-lobby-fig')).toHaveLength(3)
    expect((w.findAll('.fam-lobby-name')[0]!.element as HTMLInputElement).value).toBe('Anna')
    await w.findAll('.fam-lobby-count .fam-chip')[4]!.trigger('click')
    expect(w.emitted('update:count')?.[0]).toEqual([6])
    await w.findAll('.fam-lobby-name')[1]!.setValue('Ben')
    expect(w.emitted('update:names')?.[0]).toEqual([['Anna', 'Ben', '']])
    await w.find('.fam-lobby-go .fam-btn').trigger('click')
    expect(w.emitted('go')).toHaveLength(1)
    w.unmount()
  })

  it('a tap on the figure gives the next free one; two players never have the same figure', async () => {
    const { tokens } = useFamilyTokens()
    const w = mount(FamilyLobby, { props: { ...props, count: 3 }, ...opts })
    expect(tokens.value.slice(0, 3)).toEqual([0, 1, 2])
    await w.findAll('.fam-lobby-fig')[0]!.trigger('click')
    // 1 and 2 belong to the others: the first one is 3
    expect(tokens.value[0]).toBe(3)
    await w.findAll('.fam-lobby-fig')[0]!.trigger('click')
    expect(tokens.value[0]).toBe(4)
    const used = tokens.value.slice(0, 3)
    expect(new Set(used).size).toBe(3)
    expect(new Set(tokens.value).size).toBe(8)
    w.unmount()
  })

  it('with eight players all figures are taken: a tap swaps with the next one, nobody has two', async () => {
    const { tokens } = useFamilyTokens()
    const w = mount(FamilyLobby, { props: { ...props, count: 8, names: [] }, ...opts })
    await w.findAll('.fam-lobby-fig')[0]!.trigger('click')
    expect(tokens.value[0]).toBe(1)
    expect(tokens.value[1]).toBe(0)
    expect(new Set(tokens.value).size).toBe(8)
    w.unmount()
  })

  it('the choice alone / in two teams (only with team-option) and the team of every card', async () => {
    const off = mount(FamilyLobby, { props, ...opts })
    expect(off.find('.fam-lobby-teams').exists()).toBe(false)
    off.unmount()
    const w = mount(FamilyLobby, { props: { ...props, teamOption: true, teams: false }, ...opts })
    expect(w.findAll('.fam-lobby-teamchip')).toHaveLength(2)
    expect(w.find('.fam-lobby-team').exists()).toBe(false)
    await w.findAll('.fam-lobby-teamchip')[1]!.trigger('click')
    expect(w.emitted('update:teams')?.[0]).toEqual([true])
    await w.setProps({ teams: true })
    const tags = w.findAll('.fam-lobby-team').map((t) => t.text())
    expect(tags).toEqual(['Team 1', 'Team 2', 'Team 1'])
    w.unmount()
  })

  it('fixed number (no chips), no capsule with hide-go, a disabled capsule, and the slots top and settings', async () => {
    const w = mount(FamilyLobby, {
      props: { ...props, count: 1, fixed: true, hideGo: true },
      slots: { top: '<div class="in-top">Wie</div>', settings: '<div class="in-settings">Einstellungen</div>' },
      ...opts
    })
    expect(w.find('.fam-lobby-count').exists()).toBe(false)
    expect(w.findAll('.fam-lobby-seat')).toHaveLength(1)
    expect(w.find('.fam-lobby-go').exists()).toBe(false)
    expect(w.find('.fam-lobby-top .in-top').exists()).toBe(true)
    expect(w.find('.fam-lobby-settings .in-settings').exists()).toBe(true)
    w.unmount()
    const off = mount(FamilyLobby, { props: { ...props, canGo: false, goLabel: 'Weiter' }, ...opts })
    expect(off.find('.fam-lobby-go .fam-btn').attributes('disabled')).toBeDefined()
    expect(off.find('.fam-lobby-go .fam-btn').text()).toBe('Weiter')
    off.unmount()
  })

  it('the figure button and the name field are at least 48 px for small fingers', () => {
    const css = src(DIR + 'FamilyLobby.vue')
    expect(css).toMatch(/\.fam-lobby-fig\n[^]*?width: 108px/)
    expect(css).toMatch(/\.fam-lobby-name\n[^]*?min-height: 48px/)
    // the capsule sticks to the foot and keeps clear of the safe area
    expect(css).toMatch(/\.fam-lobby-go\n\s+position: sticky\n\s+bottom: 0/)
    expect(css).toContain('safe-area-inset-bottom')
  })
})

describe('FamilyGameBar', () => {
  const players = [
    { name: 'Anna', score: 2, index: 0, turn: true },
    { name: 'Ben', score: 1, index: 1 }
  ]
  it('shows the name of the game, the line, a chip for every player and the gold chip of the one who is on', () => {
    const w = mount(FamilyGameBar, { props: { game: 'who', title: 'Wer bin ich?', subtitle: 'Karte 2 von 6', players }, ...opts })
    expect(w.classes()).toContain('fam-game--who')
    expect(w.find('.fam-bar-title').text()).toBe('Wer bin ich?')
    expect(w.find('.fam-bar-sub').text()).toBe('Karte 2 von 6')
    expect(w.findAll('.fam-bar-chip')).toHaveLength(2)
    expect(w.findAll('.fam-bar-chip.is-turn')).toHaveLength(1)
    expect(w.find('.fam-bar-chip.is-turn').text()).toContain('Anna')
    expect(w.find('.fam-bar-chip.is-turn .fam-bar-score').text()).toBe('2')
    // music and sound
    expect(w.findAll('.fam-snd-btn')).toHaveLength(2)
    w.unmount()
  })
  it('leaving asks "Spiel beenden?" first: "Weiterspielen" stays, "Beenden" gives the event', async () => {
    const w = mount(FamilyGameBar, { props: { game: 'quiz', title: 'Quiz', players, leaveText: 'Gespeichert.' }, ...opts })
    expect(w.find('.fam-bar-dialog').exists()).toBe(false)
    await w.find('.fam-bar-btn').trigger('click')
    expect(w.find('.fam-bar-dialog').exists()).toBe(true)
    expect(w.find('.fam-bar-q').text()).toBe('Spiel beenden?')
    expect(w.find('.fam-bar-t').text()).toBe('Gespeichert.')
    await w.find('.fam-bar-stay').trigger('click')
    expect(w.find('.fam-bar-dialog').exists()).toBe(false)
    expect(w.emitted('leave')).toBeUndefined()
    await w.find('.fam-bar-btn').trigger('click')
    await w.find('.fam-bar-end').trigger('click')
    expect(w.emitted('leave')).toHaveLength(1)
    expect(w.find('.fam-bar-dialog').exists()).toBe(false)
    w.unmount()
  })
  it('without the question (confirm = false) it leaves at once', async () => {
    const w = mount(FamilyGameBar, { props: { game: 'quiz', title: 'Quiz', confirm: false }, ...opts })
    await w.find('.fam-bar-btn').trigger('click')
    expect(w.emitted('leave')).toHaveLength(1)
    expect(w.find('.fam-bar-dialog').exists()).toBe(false)
    w.unmount()
  })
})

describe('FamilyPodium', () => {
  const rows = [
    { rank: 1, name: 'Anna', score: '5 Punkte', index: 0 },
    { rank: 2, name: 'Ben', score: '3 Punkte', index: 1 },
    { rank: 3, name: 'Cora', score: '1 Punkt', index: 2 },
    { rank: 4, name: 'Dan', score: '0 Punkte', index: 3 }
  ]
  it('the first three stand on the stage as second, first, third; the others are listed below', () => {
    const w = mount(FamilyPodium, { props: { headline: 'Anna hat gewonnen!', rows, game: 'quiz' }, ...opts })
    expect(w.find('.fam-pod-head').text()).toBe('Anna hat gewonnen!')
    const cols = w.findAll('.fam-pod-col')
    expect(cols.map((c) => c.find('.fam-pod-name').text())).toEqual(['Ben', 'Anna', 'Cora'])
    expect(cols.map((c) => c.classes().find((k) => k.startsWith('is-place-')))).toEqual(['is-place-2', 'is-place-1', 'is-place-3'])
    expect(cols[1]!.find('.fam-pod-place').text()).toBe('1')
    expect(w.findAll('.fam-pod-rest li')).toHaveLength(1)
    expect(w.find('.fam-pod-rest').text()).toContain('Dan')
    w.unmount()
  })
  it('a tie shares the place; two players make two columns', () => {
    const w = mount(FamilyPodium, {
      props: {
        headline: 'Unentschieden',
        rows: [
          { rank: 1, name: 'Anna', score: '2 Punkte', index: 0 },
          { rank: 1, name: 'Ben', score: '2 Punkte', index: 1 }
        ]
      },
      ...opts
    })
    expect(w.findAll('.fam-pod-col.is-place-1')).toHaveLength(2)
    w.unmount()
  })
  it('one person or no ranking: the winner stands alone on the golden disc', () => {
    const w = mount(FamilyPodium, { props: { headline: '8 von 10 richtig', winnerIndex: 0 }, ...opts })
    expect(w.find('.fam-pod-solo').exists()).toBe(true)
    expect(w.find('.fam-pod-stage').exists()).toBe(false)
    w.unmount()
  })
  it('the three buttons say again, new round with other players, back to the games, and give the events; the slot actions replaces them', async () => {
    const w = mount(FamilyPodium, { props: { headline: 'x', rows }, ...opts })
    expect(w.find('.fam-pod-again').text()).toBe('Nochmal')
    expect(w.find('.fam-pod-change').text()).toBe('Neue Runde mit anderen Spielern')
    expect(w.find('.fam-pod-exit').text()).toBe('Zur Auswahl')
    await w.find('.fam-pod-again').trigger('click')
    await w.find('.fam-pod-change').trigger('click')
    await w.find('.fam-pod-exit').trigger('click')
    expect(w.emitted('again')).toHaveLength(1)
    expect(w.emitted('change')).toHaveLength(1)
    expect(w.emitted('exit')).toHaveLength(1)
    w.unmount()
    const own = mount(FamilyPodium, { props: { headline: 'x', rows }, slots: { actions: '<button class="mine">Mein Knopf</button>', extra: '<p class="more">Mehr</p>' }, ...opts })
    expect(own.find('.fam-pod-again').exists()).toBe(false)
    expect(own.find('.mine').exists()).toBe(true)
    expect(own.find('.fam-pod-extra .more').exists()).toBe(true)
    own.unmount()
  })
})

describe('the quiz: Start -> Lobby -> Game -> End', () => {
  async function open() {
    const { default: View } = await import('@/views/app/AppFamilyQuizView.vue')
    const w = mount(View, opts)
    await flushPromises()
    return w
  }
  async function toLobby(w: Awaited<ReturnType<typeof open>>) {
    await w.find('.fam-start-play').trigger('click')
    await flushPromises()
    for (let i = 0; i < 40 && w.find('.fam-lobby-go .fam-btn').attributes('disabled') !== undefined; i++) {
      await new Promise((r) => setTimeout(r, 25))
      await flushPromises()
    }
  }
  async function answerAll(w: Awaited<ReturnType<typeof open>>, pick: (i: number) => number) {
    let guard = 0
    while (!w.find('.fam-pod').exists() && guard++ < 40) {
      await w.findAll('.fam-choice')[pick(guard)]!.trigger('click')
      await w.find('.fq-reveal .fam-btn').trigger('click')
      await flushPromises()
    }
  }

  it('the title screen has the picture, the name and the line of the texts of the game, and the four rules', async () => {
    const w = await open()
    expect(w.find('.fam-start .fam-hero').exists()).toBe(true)
    expect(w.find('.fam-start-name').text()).toBe(all.de.app.family.hub_quiz)
    expect(w.find('.fam-start-line').text()).toBe(all.de.app.family.hub_quizSub)
    await w.find('.fam-start-how').trigger('click')
    expect(w.findAll('.fam-start-list li')).toHaveLength(4)
    // no round yet: no "Weiterspielen"
    expect(w.find('.fam-start-resume').exists()).toBe(false)
    w.unmount()
  })

  it('the back button: lobby to title screen, title screen to the games', async () => {
    const w = await open()
    await toLobby(w)
    expect(w.find('.fam-lobby').exists()).toBe(true)
    await w.find('.mt-back').trigger('click')
    expect(w.find('.fam-start').exists()).toBe(true)
    expect(replace).not.toHaveBeenCalled()
    w.unmount()
  })

  it('three players: the bar shows all three, the one on the turn is gold, the podium has three columns and "Nochmal" begins again', async () => {
    const w = await open()
    await toLobby(w)
    await w.findAll('.fam-lobby-count .fam-chip')[1]!.trigger('click')
    expect(w.findAll('.fam-lobby-seat')).toHaveLength(3)
    await w.findAll('.fam-lobby-name')[0]!.setValue('Anna')
    await w.find('.fam-lobby-go .fam-btn').trigger('click')
    await flushPromises()
    expect(w.find('.fam-bar-title').text()).toBe(all.de.app.family.hub_quiz)
    expect(w.findAll('.fam-bar-chip')).toHaveLength(3)
    expect(w.find('.fam-bar-chip.is-turn').text()).toContain('Anna')
    // the main header of the table is replaced by the bar
    expect(w.find('.mt-top').exists()).toBe(false)
    // answer right (the right tile is shown after the first try): the score of the first one goes up
    await w.findAll('.fam-choice')[0]!.trigger('click')
    const right = w.find('.fam-choice.is-right')
    expect(right.exists()).toBe(true)
    await answerAll(w, () => 0)
    expect(w.findAll('.fam-pod-col')).toHaveLength(3)
    await w.find('.fam-pod-again').trigger('click')
    await flushPromises()
    expect(w.find('.fam-bar').exists()).toBe(true)
    expect(w.find('.fam-pod').exists()).toBe(false)
    w.unmount()
  })

  it('"New round with other players" goes to the players page, "To the games" goes back to the games', async () => {
    const w = await open()
    await toLobby(w)
    await w.find('.fam-lobby-go .fam-btn').trigger('click')
    await flushPromises()
    await answerAll(w, () => 0)
    await w.find('.fam-pod-change').trigger('click')
    expect(w.find('.fam-lobby').exists()).toBe(true)
    await w.find('.fam-lobby-go .fam-btn').trigger('click')
    await flushPromises()
    await answerAll(w, () => 0)
    await w.find('.fam-pod-exit').trigger('click')
    expect(replace).toHaveBeenCalledWith({ name: 'app-family' })
    w.unmount()
  })

  it('leaving a round asks first and keeps it: the title screen offers "Weiterspielen" with the question where it stood', async () => {
    const w = await open()
    await toLobby(w)
    await w.find('.fam-lobby-go .fam-btn').trigger('click')
    await flushPromises()
    await w.findAll('.fam-choice')[0]!.trigger('click')
    await w.find('.fq-reveal .fam-btn').trigger('click')
    await flushPromises()
    await w.find('.fam-bar-btn').trigger('click')
    expect(w.find('.fam-bar-dialog').exists()).toBe(true)
    expect(w.find('.fam-bar-t').text()).toBe(all.de.app.bigGames.familyFlow.leaveKept)
    await w.find('.fam-bar-end').trigger('click')
    await flushPromises()
    expect(w.find('.fam-start').exists()).toBe(true)
    expect(w.find('.fam-start-info').text()).toContain('2')
    await w.find('.fam-start-resume').trigger('click')
    await flushPromises()
    expect(w.find('.fam-bar-sub').text()).toContain('2')
    w.unmount()
  })

  it('two teams: the capsule of the page has the choice, the cards say Team 1 and Team 2, the podium has the two teams', async () => {
    const w = await open()
    await toLobby(w)
    await w.findAll('.fam-lobby-teamchip')[1]!.trigger('click')
    expect(w.findAll('.fam-lobby-team').map((t) => t.text())).toEqual(['Team 1', 'Team 2'])
    await w.find('.fam-lobby-go .fam-btn').trigger('click')
    await flushPromises()
    await answerAll(w, () => 0)
    expect(w.findAll('.fam-pod-col')).toHaveLength(2)
    expect(w.find('.fam-pod-sub').exists()).toBe(true)
    expect(w.findAll('.fq-endlist li')).toHaveLength(2)
    w.unmount()
  })

  it('several phones: one card for the person, no number chips, no capsule, and the three cards (day, new round, code)', async () => {
    const w = await open()
    await toLobby(w)
    await w.findAll('.fq-modes .fam-chip')[1]!.trigger('click')
    expect(w.findAll('.fam-lobby-seat')).toHaveLength(1)
    expect(w.find('.fam-lobby-count').exists()).toBe(false)
    expect(w.find('.fam-lobby-go').exists()).toBe(false)
    expect(w.findAll('.fq-thing')).toHaveLength(3)
    expect(w.find('.fam-name-input.is-code').exists()).toBe(true)
    w.unmount()
  })
})

describe('the new pieces: no fixed game names, no old design, no fixed colours', () => {
  const FILES = ['FamilyStart', 'FamilyHero', 'FamilyLobby', 'FamilyGameBar', 'FamilyPodium', 'FamilySoundButtons']
  it('the pieces know no name of a game (it comes in as a prop), also not the protected one', () => {
    for (const f of FILES) {
      const text = src(DIR + f + '.vue')
      // the text without the comments of the head of the file
      const code = text.replace(/\/\*[^]*?\*\//g, '')
      for (const bad of ['Activity', 'Bibel-Begriffe', 'Bible terms', 'Wer bin ich', 'Bibel-Bingo', 'Wortreise', 'Reihenfolge-Rennen']) expect(code, `${f} has "${bad}"`).not.toContain(bad)
    }
    const flow = JSON.stringify(BIG_GAME_TEXTS.de.familyFlow) + JSON.stringify(BIG_GAME_TEXTS.en.familyFlow) + JSON.stringify(BIG_GAME_TEXTS.es.familyFlow)
    expect(flow).not.toMatch(/Activity|Bibel-Begriffe/)
  })
  it('no parchment, papyrus, wax seal, wreath, brass or medal pieces, no serif font', () => {
    for (const f of FILES) {
      const text = src(DIR + f + '.vue')
      for (const old of ['MapPaper', 'MapButton', 'MapCoin', 'MapMedallion', 'MapSeats', 'MapResult', 'mp-serif', 'parchment', 'papyrus', 'lorbeer', 'siegel', 'medaillon', 'knopf.webp']) expect(text, `${f} has "${old}"`).not.toContain(old)
    }
  })
  it('the styles hold only tokens and colour mixes (no hex colours; white and black appear only in mixes and shadows)', () => {
    for (const f of FILES) {
      const text = src(DIR + f + '.vue')
      const style = text.slice(text.indexOf('<style'))
      expect(style, f).not.toMatch(/#[0-9a-fA-F]{3,6}\b/)
    }
  })
  it('motion only without "less motion": every animation of the new pieces stands in a media query', () => {
    for (const f of ['FamilyStart', 'FamilyLobby', 'FamilyPodium', 'FamilyGameBar']) {
      const text = src(DIR + f + '.vue')
      const style = text.slice(text.indexOf('<style'))
      const noMotion = style.indexOf('prefers-reduced-motion: no-preference')
      for (const m of style.matchAll(/^\s+animation: /gm)) expect(m.index ?? 0, `${f}: an animation outside "no-preference"`).toBeGreaterThan(noMotion)
      expect(noMotion, f).toBeGreaterThan(-1)
    }
  })
})

describe('the texts of the course (de, en, es)', () => {
  it('every key is there in all three languages, and no text is empty', () => {
    const de = Object.keys(BIG_GAME_TEXTS.de.familyFlow ?? {})
    expect(de.length).toBeGreaterThan(15)
    for (const lang of ['en', 'es'] as const) {
      const t = BIG_GAME_TEXTS[lang].familyFlow as Record<string, string>
      expect(Object.keys(t).sort(), lang).toEqual(de.sort())
      for (const k of de) expect(String(t[k]).trim().length, `${lang}.${k}`).toBeGreaterThan(0)
    }
    expect((BIG_GAME_TEXTS.de.familyFlow as Record<string, string>).leaveTitle).toBe('Spiel beenden?')
  })
  it('the seven games are still the same seven', () => {
    expect(FAMILY_GAMES).toHaveLength(7)
  })
})
