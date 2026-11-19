/**
 * "Familien-Spiele v2", Bible Words (id `activity`) and Who am I? (id `who`) built on the course Start -> Lobby -> Game -> End (19 Nov 2026):
 * title screen with the name from the texts of the game, the teams / players page with the settings of the game in the slot, the bar of the game
 * ("End the game?"), the podium; the rules and settings of the games are unchanged; the new texts (de, en, es); no old pieces, no fixed colours.
 */
import { readFileSync } from 'node:fs'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import { BIG_GAME_TEXTS, withGameTexts } from '@/i18n/bigGames'
import FamilyChoice from '@/components/molecules/family/FamilyChoice.vue'
import { resetTokens } from '@/use/useFamilyTokens'
import { ACTIVITY_MODES, CARD_CHOICES, SECOND_CHOICES } from '@/utils/familyActivity'
import { MAX_QUESTIONS, WHO_ROUND_CHOICES, pointsFor } from '@/utils/whoAmI'

vi.mock('@/use/useSfx', () => ({ default: () => ({ play: vi.fn(), tap: vi.fn() }) }))
vi.mock('@/use/useMusic', () => ({ default: () => ({ playFamily: vi.fn(), playGame: vi.fn(), stop: vi.fn() }) }))
const showUpsell = vi.fn()
const premium = { teaser: false }
vi.mock('@/use/usePremium', () => ({
  get PREMIUM_TEASER() {
    return premium.teaser
  },
  hasFeature: () => false,
  showUpsell: (...a: unknown[]) => showUpsell(...a)
}))
const push = vi.fn()
const replace = vi.fn()
const route = { params: {}, query: {} as Record<string, string>, name: 'app-family-activity' }
vi.mock('vue-router', async (orig) => ({
  ...(await orig<typeof import('vue-router')>()),
  useRoute: () => route,
  useRouter: () => ({ push, replace, back: vi.fn(), resolve: () => ({ path: '/app/familien-spiele' }), beforeEach: vi.fn(), afterEach: vi.fn(), onError: vi.fn(), options: { history: { state: {} } } })
}))
vi.stubGlobal('APP_VERSION', 'test')
Element.prototype.scrollIntoView = vi.fn()
vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn() }))

const all = withGameTexts(messages as never) as { de: Record<string, any>; en: Record<string, any> }
const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'de', messages: { de: all.de, en: all.en } as never, missingWarn: false, fallbackWarn: false })
const opts = { global: { plugins: [i18n], stubs: { RouterLink: true, PlusBadge: true } }, attachTo: document.body }
const src = (p: string) => readFileSync(p, 'utf8').replace(/\r/g, '')

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  resetTokens()
  vi.clearAllMocks()
  premium.teaser = false
  route.query = {}
})

async function open(name: 'Activity' | 'Who') {
  const { default: View } = await import(`../src/views/app/AppFamily${name}View.vue`)
  const w = mount(View, opts)
  await flushPromises()
  return w
}
type Wrapper = Awaited<ReturnType<typeof open>>

async function toLobby(w: Wrapper) {
  await w.find('.fam-start-play').trigger('click')
  await flushPromises()
}

describe('FamilyChoice plain (no letter badge)', () => {
  it('keeps the colour and the text, but has no letter A to D', () => {
    const w = mount(FamilyChoice, { props: { index: 1, text: 'Nein', plain: true } })
    expect(w.find('.fam-choice-letter').exists()).toBe(false)
    expect(w.classes()).toContain('is-plain')
    expect(w.classes()).toContain('fam-choice--1')
    expect(w.text()).toBe('Nein')
    const normal = mount(FamilyChoice, { props: { index: 1, text: 'Nein' } })
    expect(normal.find('.fam-choice-letter').text()).toBe('B')
  })
})

describe('Bible Words (activity): Start -> Lobby -> Game -> End', () => {
  it('the title screen has the picture, the name and the line from the texts of the game, and the five lines of "How to play"', async () => {
    const w = await open('Activity')
    expect(w.find('.mt').classes()).toContain('fam-game--activity')
    expect(w.find('.fam-start .fam-hero').exists()).toBe(true)
    expect(w.find('.fam-start-name').text()).toBe(all.de.app.family.hub_activity)
    expect(w.find('.fam-start-name').text()).toBe('Bibel-Begriffe')
    expect(w.find('.fam-start-line').text()).toBe(all.de.app.family.hub_activitySub)
    await w.find('.fam-start-how').trigger('click')
    const rules = w.findAll('.fam-start-list li').map((l) => l.text())
    expect(rules).toHaveLength(5)
    expect(rules[0]).toContain(all.de.app.activity.handover)
    expect(rules[1]).toContain(all.de.app.activity.sub)
    expect(rules[3]).toContain(all.de.app.activity.pointRule)
    expect(w.find('.fam-start-resume').exists()).toBe(false)
    w.unmount()
  })

  it('the teams page: two to four teams with figure and name, the settings in cards, and the old ones (words, ways, number, time) are all there', async () => {
    const w = await open('Activity')
    await toLobby(w)
    expect(w.find('.fam-lobby-title').text()).toBe(all.de.app.activity.teams)
    expect(w.findAll('.fam-lobby-count .fam-chip')).toHaveLength(3)
    expect(w.findAll('.fam-lobby-seat')).toHaveLength(2)
    expect((w.findAll('.fam-lobby-name')[0]!.element as HTMLInputElement).placeholder).toBe('Team 1')
    const heads = w.findAll('.fam-lobby-settings .fam-card-title').map((h) => h.text())
    expect(heads).toEqual([all.de.app.activity.words, all.de.app.activity.ways, all.de.app.activity.cards, all.de.app.activity.time])
    const chips = w.findAll('.fam-lobby-settings .fam-chip')
    // 3 kinds + 3 ways + the card choices + the time choices
    expect(chips).toHaveLength(3 + ACTIVITY_MODES.length + CARD_CHOICES.length + SECOND_CHOICES.length)
    expect(w.findAll('.fam-lobby-settings [role="checkbox"]')).toHaveLength(3)
    expect(w.find('.fam-lobby-go .fam-btn').attributes('disabled')).toBeUndefined()
    w.unmount()
  })

  it('without any way chosen the capsule is off and the hint says so', async () => {
    const w = await open('Activity')
    await toLobby(w)
    for (const c of w.findAll('.fam-lobby-settings [role="checkbox"]')) await c.trigger('click')
    expect(w.find('.fam-lobby-go .fam-btn').attributes('disabled')).toBeDefined()
    expect(w.find('.fa-error').text()).toBe(all.de.app.activity.noWay)
    await w.findAll('.fam-lobby-settings [role="checkbox"]')[0]!.trigger('click')
    expect(w.find('.fam-lobby-go .fam-btn').attributes('disabled')).toBeUndefined()
    w.unmount()
  })

  async function startRound(w: Wrapper, ways: ('explain' | 'draw' | 'act')[]) {
    await toLobby(w)
    // three words for each team, ways as asked
    await w.findAll('.fam-lobby-settings .fam-chip.is-round')[0]!.trigger('click')
    const boxes = w.findAll('.fam-lobby-settings [role="checkbox"]')
    for (const [i, m] of ACTIVITY_MODES.entries()) {
      const on = boxes[i]!.attributes('aria-checked') === 'true'
      if (on !== ways.includes(m)) await boxes[i]!.trigger('click')
    }
    await w.find('.fam-lobby-go .fam-btn').trigger('click')
    await flushPromises()
  }

  it('plays a round with three teams-worth of turns: hand-over, word, who guessed, podium', async () => {
    const w = await open('Activity')
    await startRound(w, ['explain'])
    expect(w.find('.fam-bar').exists()).toBe(true)
    expect(w.find('.fam-bar-title').text()).toBe('Bibel-Begriffe')
    expect(w.findAll('.fam-bar-chip')).toHaveLength(2)
    expect(w.find('.fam-bar-chip.is-turn').text()).toContain('Team 1')
    let guard = 0
    let turns = 0
    while (!w.find('.fam-pod').exists() && guard++ < 20) {
      expect(w.find('.fa-hand').exists()).toBe(true)
      await w.find('.fa-show').trigger('click')
      await flushPromises()
      expect(w.find('.fa-word').text().length).toBeGreaterThan(1)
      expect(w.find('[role="timer"]').exists()).toBe(true)
      expect(w.findAll('.fa-fig')).toHaveLength(2)
      // team 1 always guesses it
      await w.findAll('.fa-fig')[0]!.trigger('click')
      await flushPromises()
      turns++
    }
    // two teams, three words each
    expect(turns).toBe(6)
    expect(w.find('.fam-pod').exists()).toBe(true)
    expect(w.find('.fam-pod-head').text()).toContain('Team 1')
    expect(w.findAll('.fam-pod-col')).toHaveLength(2)
    expect(w.find('.fam-pod-again').text()).toBe('Nochmal')
    expect(w.find('.fam-pod-change').text()).toBe('Neue Runde mit anderen Spielern')
    // the round is over: nothing to continue
    expect(localStorage.getItem('lk-family-save-activity')).toBeNull()
    w.unmount()
  })

  it('nobody guessed: no point, and "Neue Runde mit anderen Spielern" leads back to the teams page', async () => {
    const w = await open('Activity')
    await startRound(w, ['explain'])
    let guard = 0
    while (!w.find('.fam-pod').exists() && guard++ < 20) {
      await w.find('.fa-show').trigger('click')
      await w.find('.fa-nobody').trigger('click')
      await flushPromises()
    }
    expect(w.findAll('.fam-pod-col')).toHaveLength(2)
    expect(w.find('.fam-pod-head').text()).toBe(all.de.app.activity.winners.replace('{names}', 'Team 1 & Team 2'))
    await w.find('.fam-pod-change').trigger('click')
    expect(w.find('.fam-lobby').exists()).toBe(true)
    w.unmount()
  })

  it('"Nochmal" starts the same round again (new words, the points at zero)', async () => {
    const w = await open('Activity')
    await startRound(w, ['explain'])
    let guard = 0
    while (!w.find('.fam-pod').exists() && guard++ < 20) {
      await w.find('.fa-show').trigger('click')
      await w.findAll('.fa-fig')[1]!.trigger('click')
      await flushPromises()
    }
    await w.find('.fam-pod-again').trigger('click')
    await flushPromises()
    expect(w.find('.fa-hand').exists()).toBe(true)
    expect(w.findAll('.fam-bar-score').map((s) => s.text())).toEqual(['0', '0'])
    w.unmount()
  })

  it('leaving: "Spiel beenden?" asks, "Weiterspielen" stays, "Beenden" goes to the title screen, which offers to continue the kept round', async () => {
    const w = await open('Activity')
    await startRound(w, ['explain'])
    await w.find('.fam-bar-btn').trigger('click')
    expect(w.find('.fam-bar-q').text()).toBe('Spiel beenden?')
    expect(w.find('.fam-bar-t').text()).toBe(all.de.app.bigGames.familyFlow.leaveKept)
    await w.find('.fam-bar-stay').trigger('click')
    expect(w.find('.fa-hand').exists()).toBe(true)
    await w.find('.fam-bar-btn').trigger('click')
    await w.find('.fam-bar-end').trigger('click')
    await flushPromises()
    expect(w.find('.fam-start').exists()).toBe(true)
    expect(w.find('.fam-bar').exists()).toBe(false)
    expect(w.find('.fam-start-resume').exists()).toBe(true)
    expect(w.find('.fam-start-info').text()).toBe(all.de.app.activity.cardOf.replace('{n}', '1').replace('{total}', '6'))
    await w.find('.fam-start-resume').trigger('click')
    await flushPromises()
    expect(w.find('.fa-hand').exists()).toBe(true)
    expect(w.find('.fam-bar-sub').text()).toBe(all.de.app.activity.cardOf.replace('{n}', '1').replace('{total}', '6'))
    w.unmount()
  })

  it('the back button: teams page to the title screen, title screen to the games', async () => {
    const w = await open('Activity')
    await toLobby(w)
    await w.find('.mt-back').trigger('click')
    expect(w.find('.fam-start').exists()).toBe(true)
    await w.find('.mt-back').trigger('click')
    expect(replace.mock.calls.length + push.mock.calls.length).toBeGreaterThan(0)
    w.unmount()
  })

  it('a word that is painted goes to the painting program and comes back to the same card, which asks who guessed it', async () => {
    const w = await open('Activity')
    await startRound(w, ['draw'])
    await w.find('.fa-show').trigger('click')
    await flushPromises()
    expect(w.find('.fa-paint').exists()).toBe(true)
    expect(w.find('[role="timer"]').exists()).toBe(false)
    expect(w.find('.fa-fig').exists()).toBe(false)
    await w.find('.fa-paint').trigger('click')
    expect(push).toHaveBeenCalledWith({ name: 'app-coloring', query: { activity: '1' } })
    w.unmount()
    // back from the painting program
    route.query = { from: 'paint' }
    const back = await open('Activity')
    expect(back.find('.fa-fig').exists()).toBe(true)
    expect(back.find('.fa-paint').exists()).toBe(false)
    expect(back.find('.fa-word').exists()).toBe(true)
    expect(replace).toHaveBeenCalledWith({ name: 'app-family-activity' })
    back.unmount()
  })

  it('without Plus: the title screen says so, and "Play" opens the Plus sheet instead of the teams page', async () => {
    premium.teaser = true
    const w = await open('Activity')
    expect(w.find('.fa-locked').text()).toContain(all.de.app.activity.locked)
    await w.find('.fam-start-play').trigger('click')
    expect(showUpsell).toHaveBeenCalledWith('family')
    expect(w.find('.fam-lobby').exists()).toBe(false)
    showUpsell.mockClear()
    await w.find('.fa-locked-btn').trigger('click')
    expect(showUpsell).toHaveBeenCalledWith('family')
    w.unmount()
  })
})

describe('Who am I? (who): Start -> Lobby -> Game -> End', () => {
  it('the title screen has the name and the line from the texts, and the four rules of the game plus the winner line', async () => {
    const w = await open('Who')
    expect(w.find('.mt').classes()).toContain('fam-game--who')
    expect(w.find('.fam-start-name').text()).toBe(all.de.app.family.hub_who)
    expect(w.find('.fam-start-line').text()).toBe(all.de.app.family.hub_whoSub)
    await w.find('.fam-start-how').trigger('click')
    const rules = w.findAll('.fam-start-list li').map((l) => l.text())
    expect(rules).toHaveLength(5)
    expect(rules[2]).toContain(`Höchstens ${MAX_QUESTIONS} Fragen`)
    expect(rules[3]).toContain(all.de.app.who.rule4)
    expect(rules[4]).toContain(all.de.app.bigGames.whoFlow.ruleWin)
    w.unmount()
  })

  it('the players page: two to eight players with figure and name, and how often everybody guesses', async () => {
    const w = await open('Who')
    await toLobby(w)
    expect(w.find('.fam-lobby-title').text()).toBe('Wer spielt mit?')
    expect(w.findAll('.fam-lobby-count .fam-chip')).toHaveLength(7)
    expect(w.findAll('.fam-lobby-seat')).toHaveLength(3)
    expect(w.find('.fam-lobby-settings .fam-card-title').text()).toBe(all.de.app.who.rounds)
    expect(w.findAll('.fam-lobby-settings .fam-chip')).toHaveLength(WHO_ROUND_CHOICES.length)
    expect(w.find('.fam-lobby-settings .fw-fine').text()).toBe(all.de.app.who.total.replace('{n}', '3'))
    await w.findAll('.fam-lobby-settings .fam-chip')[1]!.trigger('click')
    expect(w.find('.fam-lobby-settings .fw-fine').text()).toBe(all.de.app.who.total.replace('{n}', '6'))
    w.unmount()
  })

  async function startRound(w: Wrapper) {
    await toLobby(w)
    await w.find('.fam-lobby-go .fam-btn').trigger('click')
    await flushPromises()
  }

  it('plays three cards: hand-over, the card with the name, facts and three answer tiles, the verdict, the podium', async () => {
    const w = await open('Who')
    await startRound(w)
    expect(w.find('.fam-bar-title').text()).toBe(all.de.app.family.hub_who)
    expect(w.findAll('.fam-bar-chip')).toHaveLength(3)
    let guard = 0
    let cards = 0
    while (!w.find('.fam-pod').exists() && guard++ < 10) {
      expect(w.find('.fw-hand').exists()).toBe(true)
      expect(w.find('.fam-bar-chip.is-turn').text()).toContain(`Spieler ${cards + 1}`)
      await w.find('.fw-show').trigger('click')
      await flushPromises()
      expect(w.find('.fw-warn').exists()).toBe(true)
      expect(w.find('.fam-q-text').text().length).toBeGreaterThan(1)
      expect(w.findAll('.fw-fact').length).toBeGreaterThan(0)
      const tiles = w.findAll('.fam-choice')
      expect(tiles).toHaveLength(3)
      expect(tiles.map((t) => t.text())).toEqual(['Ja', 'Nein', 'Weiß nicht'])
      expect(w.find('.fam-choice-letter').exists()).toBe(false)
      expect(w.find('.fw-undo').attributes('disabled')).toBeDefined()
      await tiles[0]!.trigger('click')
      await tiles[1]!.trigger('click')
      expect(w.find('.fw-counter-n').text()).toContain('2')
      expect(w.findAll('.fw-dot.is-yes')).toHaveLength(1)
      expect(w.findAll('.fw-dot.is-no')).toHaveLength(1)
      await w.find('.fw-undo').trigger('click')
      expect(w.findAll('.fw-dot.is-no')).toHaveLength(0)
      // the first capsule: it was guessed (with one question: three points)
      await w.find('.fw-go').trigger('click')
      expect(w.find('.fw-verdict').exists()).toBe(true)
      expect(w.find('.fw-verdict-t').text()).toContain(`${pointsFor(1)} Punkte`)
      expect(w.find('.fam-bar-chip.is-turn .fam-bar-score').text()).toBe('3')
      await w.find('.fw-go').trigger('click')
      await flushPromises()
      cards++
    }
    expect(cards).toBe(3)
    expect(w.find('.fam-pod').exists()).toBe(true)
    expect(w.findAll('.fam-pod-col')).toHaveLength(3)
    expect(w.find('.fam-pod-exit').text()).toBe('Zur Auswahl')
    expect(localStorage.getItem('lk-family-save-who')).toBeNull()
    w.unmount()
  })

  it('giving up gives no point; the twenty-first question is not possible and the warning shows', async () => {
    const w = await open('Who')
    await startRound(w)
    await w.find('.fw-show').trigger('click')
    for (let i = 0; i < MAX_QUESTIONS + 3; i++) await w.findAll('.fam-choice')[2]!.trigger('click')
    expect(w.find('.fw-counter-n').text()).toContain(String(MAX_QUESTIONS))
    expect(w.findAll('.fam-choice')[0]!.attributes('disabled')).toBeDefined()
    expect(w.findAll('.fw-dot.is-maybe')).toHaveLength(MAX_QUESTIONS)
    const buttons = w.findAll('.fw-go')
    await buttons[1]!.trigger('click')
    expect(w.find('.fw-verdict-t').text()).toBe(all.de.app.who.gotNothing.replace('{name}', 'Spieler 1'))
    w.unmount()
  })

  it('leaving in the middle of a card keeps the questions: after "Weiterspielen" the device goes to the other person first, and the questions stay', async () => {
    const w = await open('Who')
    await startRound(w)
    await w.find('.fw-show').trigger('click')
    await w.findAll('.fam-choice')[0]!.trigger('click')
    await w.find('.fam-bar-btn').trigger('click')
    expect(w.find('.fam-bar-t').text()).toBe(all.de.app.bigGames.familyFlow.leaveKept)
    await w.find('.fam-bar-end').trigger('click')
    await flushPromises()
    expect(w.find('.fam-start').exists()).toBe(true)
    expect(w.find('.fam-start-info').text()).toBe(all.de.app.who.cardOf.replace('{n}', '1').replace('{total}', '3'))
    await w.find('.fam-start-resume').trigger('click')
    await flushPromises()
    expect(w.find('.fw-hand').exists()).toBe(true)
    await w.find('.fw-show').trigger('click')
    expect(w.find('.fw-counter-n').text()).toContain('1')
    w.unmount()
  })

  it('without Plus: the title screen says so, and "Play" opens the Plus sheet', async () => {
    premium.teaser = true
    const w = await open('Who')
    expect(w.find('.fw-locked').text()).toContain(all.de.app.who.locked)
    await w.find('.fam-start-play').trigger('click')
    expect(showUpsell).toHaveBeenCalledWith('family')
    expect(w.find('.fam-lobby').exists()).toBe(false)
    w.unmount()
  })
})

describe('the tap areas of the two games are 48 px or more', () => {
  const rule = (file: string, selector: string) => {
    const text = src(file)
    const at = text.indexOf(`\n${selector}\n`)
    expect(at, selector).toBeGreaterThan(-1)
    return text.slice(at, text.indexOf('\n\n', at + 2))
  }
  it('the figure buttons of the guess (64 px) and the undo button (48 px)', () => {
    expect(rule('src/views/app/AppFamilyActivityView.vue', '.fa-fig')).toMatch(/min-height: 64px/)
    expect(rule('src/views/app/AppFamilyWhoView.vue', '.fw-undo')).toMatch(/min-height: 48px/)
  })
})

describe('the two games keep no old design', () => {
  for (const [name, file] of [
    ['Bible Words', 'src/views/app/AppFamilyActivityView.vue'],
    ['Who am I?', 'src/views/app/AppFamilyWhoView.vue']
  ] as const) {
    it(`${name}: no parchment, medals, brass, seal, wreath, serif font or fixed colours, and the name is never fixed text`, () => {
      const text = src(file)
      for (const old of ['MapPaper', 'MapCoin', 'MapButton', 'MapSeats', 'MapResult', 'MapResume', 'MapMedallion', 'MapScoreBar', 'mp-serif', 'mp-cream', 'parchment', 'papyrus', 'brass', 'fa-plate', 'fw-plate', 'fa-disc', 'fw-disc', 'Medallion', 'sanduhr', 'rahmen-wer']) {
        // the head comment may name the game ("activity" as the id), the code may not use the old things
        expect(text.replace(/\/\*[^]*?\*\//g, '').includes(old), old).toBe(false)
      }
      // the name of the game is never fixed in the page (it is read from the texts); the protected name has no place in the template
      expect(text.slice(text.indexOf('<template'), text.indexOf('<style')).includes('Activity')).toBe(false)
      const style = text.slice(text.indexOf('<style'))
      expect(style).not.toMatch(/#[0-9a-fA-F]{3,6}\b/)
      expect(style).not.toMatch(/rgba\(\s*(58|20|28|226)\s*,/)
    })
    it(`${name}: every animation stands in "no-preference"`, () => {
      const style = src(file).slice(src(file).indexOf('<style'))
      const noMotion = style.indexOf('prefers-reduced-motion: no-preference')
      expect(noMotion).toBeGreaterThan(-1)
      for (const m of style.matchAll(/^\s+animation: /gm)) expect(m.index ?? 0).toBeGreaterThan(noMotion)
    })
  }
})

describe('the new texts (de, en, es)', () => {
  it('activityFlow and whoFlow: the same keys in all three languages, none empty, the protected name never in them', () => {
    for (const id of ['activityFlow', 'whoFlow']) {
      const de = Object.keys((BIG_GAME_TEXTS.de as Record<string, Record<string, string>>)[id]!)
      expect(de.length).toBeGreaterThan(0)
      for (const lang of ['en', 'es'] as const) {
        const t = (BIG_GAME_TEXTS[lang] as Record<string, Record<string, string>>)[id]!
        expect(Object.keys(t).sort(), `${id} ${lang}`).toEqual([...de].sort())
        for (const k of de) expect(t[k]!.trim().length, `${id}.${lang}.${k}`).toBeGreaterThan(0)
      }
      expect(JSON.stringify(BIG_GAME_TEXTS)).not.toContain('Activity"')
    }
    const flow = JSON.stringify((BIG_GAME_TEXTS.de as Record<string, unknown>).activityFlow) + JSON.stringify((BIG_GAME_TEXTS.en as Record<string, unknown>).activityFlow)
    expect(flow).not.toMatch(/Activity|Bibel-Begriffe|Bible Words/)
  })
  it('the name of the games comes from the old texts and is the protected-name-free one in all three languages', () => {
    expect(all.de.app.family.hub_activity).toBe('Bibel-Begriffe')
    expect(all.en.app.family.hub_activity).toBe('Bible Words')
    expect(all.de.app.family.hub_who).toBe('Wer bin ich?')
    expect(all.en.app.family.hub_who).toBe('Who am I?')
    const es = src('src/i18n/es/teil3.ts')
    expect(es).toContain("hub_activity: 'Palabras bíblicas'")
    expect(es).toContain("hub_who: '¿Quién soy?'")
  })
})
