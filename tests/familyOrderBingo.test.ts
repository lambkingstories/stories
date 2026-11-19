/**
 * "Familien-Spiele v2", the course of the order race and of the Bible bingo (19 Nov 2026): title screen (FamilyStart), players page (FamilyLobby),
 * bar of the game (FamilyGameBar), podium (FamilyPodium), the cards and the board of the bingo in the light look.
 */
import { readFileSync } from 'node:fs'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import { BIG_GAME_TEXTS, withGameTexts } from '@/i18n/bigGames'
import { resetTokens } from '@/use/useFamilyTokens'
import { WHO_PEOPLE } from '@/data/whoAmI'

vi.mock('@/use/useSfx', () => ({ default: () => ({ play: vi.fn(), tap: vi.fn() }) }))
vi.mock('@/use/useMusic', () => ({ default: () => ({ playFamily: vi.fn(), playGame: vi.fn(), stop: vi.fn() }) }))
vi.mock('@/use/usePremium', () => ({ PREMIUM_TEASER: false, hasFeature: () => true, showUpsell: vi.fn() }))
const replace = vi.fn()
vi.mock('vue-router', async (orig) => ({
  ...(await orig<typeof import('vue-router')>()),
  useRoute: () => ({ params: {}, query: {}, name: 'app-family-order' }),
  useRouter: () => ({ push: vi.fn(), replace, back: vi.fn(), resolve: () => ({ path: '/app/familien-spiele' }), beforeEach: vi.fn(), afterEach: vi.fn(), onError: vi.fn(), options: { history: { state: {} } } })
}))
vi.stubGlobal('APP_VERSION', 'test')
Element.prototype.scrollIntoView = vi.fn()
vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn() }))

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

/** The "animation:" lines of a file stand only after the media query for those who do not ask for less movement. */
function animationsOnlyWithMotion(file: string) {
  const text = src(file)
  const style = text.slice(text.indexOf('<style'))
  const gate = style.indexOf('prefers-reduced-motion: no-preference')
  const lines = [...style.matchAll(/^\s+animation:/gm)]
  for (const m of lines) expect(gate, `${file}: an animation outside the motion media query`).toBeGreaterThan(-1)
  for (const m of lines) expect(m.index ?? 0, file).toBeGreaterThan(gate)
}

describe('the texts of the order race and of the Bible bingo course', () => {
  it('have the same keys in german, english and spanish, and never hold the name of a game', () => {
    for (const id of ['orderFlow', 'bingoFlow']) {
      const de = Object.keys(BIG_GAME_TEXTS.de[id]!).sort()
      expect(de.length).toBeGreaterThan(2)
      expect(Object.keys(BIG_GAME_TEXTS.en[id]!).sort(), id).toEqual(de)
      expect(Object.keys(BIG_GAME_TEXTS.es[id]!).sort(), id).toEqual(de)
      for (const lang of ['de', 'en', 'es'] as const) {
        for (const [k, v] of Object.entries(BIG_GAME_TEXTS[lang][id]!)) {
          expect(String(v).length, `${lang} ${id}.${k}`).toBeGreaterThan(8)
          expect(String(v), `${lang} ${id}.${k}`).not.toMatch(/Reihenfolge-Rennen|Bibel-Bingo|order race|Bible bingo|carrera|bingo bíblico/i)
        }
      }
    }
  })
})

describe('the order race in the new look', () => {
  async function toPlay(w: ReturnType<typeof mount>, players = 2) {
    await w.find('.fam-start-play').trigger('click')
    await flushPromises()
    const chips = w.findAll('.fam-lobby-count .fam-chip')
    await chips[players - 1]!.trigger('click')
    await w.find('.fam-lobby-go .fam-btn').trigger('click')
    await flushPromises()
  }
  /** Taps the cards until the row is right (a wrong card wobbles and stays, so it tries the next one). */
  async function solve(w: ReturnType<typeof mount>) {
    let guard = 0
    while (w.findAll('.fo-card').length && guard++ < 80) {
      const before = w.findAll('.fo-card').length
      for (const c of w.findAll('.fo-card')) {
        await c.trigger('click')
        await flushPromises()
        if (w.findAll('.fo-card').length < before) break
      }
    }
  }

  it('opens with the title screen: the name and the line of the game, "Play", the rules; the old pieces are gone', async () => {
    const { default: View } = await import('@/views/app/AppFamilyOrderView.vue')
    const w = mount(View, opts)
    await flushPromises()
    expect(w.find('.mt').classes()).toContain('fam-game--order')
    expect(w.find('.fam-start-name').text()).toBe('Reihenfolge-Rennen')
    expect(w.find('.fam-start-line').text()).toBe('Stationen ordnen')
    expect(w.findAll('.fam-start-list li')).toHaveLength(5)
    expect(w.find('.fam-start-resume').exists()).toBe(false)
    for (const old of ['.mpa', '.mb', '.ms-own', '.mc']) expect(w.find(old).exists(), old).toBe(false)
    w.unmount()
  })

  it('the players page: the number, the cards with names, the stations, the turns, the adventure', async () => {
    const { default: View } = await import('@/views/app/AppFamilyOrderView.vue')
    const w = mount(View, opts)
    await flushPromises()
    await w.find('.fam-start-play').trigger('click')
    await flushPromises()
    expect(w.find('.fam-lobby').exists()).toBe(true)
    expect(w.findAll('.fam-lobby-seat')).toHaveLength(2)
    await w.findAll('.fam-lobby-count .fam-chip')[2]!.trigger('click')
    expect(w.findAll('.fam-lobby-seat')).toHaveLength(3)
    const heads = w.findAll('.fam-card-title').map((h) => h.text())
    expect(heads).toEqual(expect.arrayContaining(['Wie viele Stationen?', 'Wie oft ist jeder dran?', 'Aus welchem Abenteuer?']))
    expect(w.findAll('.fo-marks .fam-chip')).toHaveLength(6)
    expect(w.find('select.fo-select').exists()).toBe(true)
    // the stations: chosen = gold with a tick
    const fives = w.findAll('.fo-marks')[0]!.findAll('.fam-chip')
    expect(fives[1]!.classes()).toContain('is-on')
    await fives[2]!.trigger('click')
    expect(fives[2]!.classes()).toContain('is-on')
    w.unmount()
  })

  it('plays with three players to the podium; leaving asks first and "Continue" takes the round up again', async () => {
    const { default: View } = await import('@/views/app/AppFamilyOrderView.vue')
    const w = mount(View, opts)
    await flushPromises()
    await toPlay(w, 3)
    // whose turn: the bar of the game with three chips, the card of the turn
    expect(w.find('.fam-bar').exists()).toBe(true)
    expect(w.find('.fam-bar-title').text()).toBe('Reihenfolge-Rennen')
    expect(w.findAll('.fam-bar-chip')).toHaveLength(3)
    expect(w.findAll('.fam-bar-chip')[0]!.classes()).toContain('is-turn')
    expect(w.find('.fo-hand').exists()).toBe(true)
    await w.find('.fo-show').trigger('click')
    await flushPromises()
    expect(w.findAll('.fo-slot').length).toBeGreaterThanOrEqual(4)
    expect(w.findAll('.fo-card').length).toBe(w.findAll('.fo-slot').length)
    // leave: asked first, then to the title screen with "Continue"
    await w.find('.fam-bar-btn').trigger('click')
    expect(w.find('.fam-bar-dialog').exists()).toBe(true)
    await w.find('.fam-bar-stay').trigger('click')
    expect(w.find('.fam-bar-dialog').exists()).toBe(false)
    await w.find('.fam-bar-btn').trigger('click')
    await w.find('.fam-bar-end').trigger('click')
    await flushPromises()
    expect(w.find('.fam-start').exists()).toBe(true)
    expect(w.find('.fam-start-resume').exists()).toBe(true)
    await w.find('.fam-start-resume').trigger('click')
    await flushPromises()
    expect(w.findAll('.fo-card').length).toBe(w.findAll('.fo-slot').length)
    // play all three turns
    for (let k = 0; k < 3; k++) {
      if (k > 0) {
        expect(w.find('.fo-hand').exists()).toBe(true)
        await w.find('.fo-show').trigger('click')
        await flushPromises()
      }
      await solve(w)
      expect(w.find('.fo-done').exists()).toBe(true)
      expect(w.findAll('.fo-slot.is-full').length).toBe(w.findAll('.fo-slot').length)
      await w.find('.fo-done .fam-btn').trigger('click')
      await flushPromises()
    }
    expect(w.find('.fam-pod').exists()).toBe(true)
    expect(w.findAll('.fam-pod-col')).toHaveLength(3)
    expect(w.find('.fam-pod-head').text().length).toBeGreaterThan(3)
    // the buttons of the end: again, new players, to the games
    expect(w.find('.fam-pod-again').exists()).toBe(true)
    await w.find('.fam-pod-change').trigger('click')
    expect(w.find('.fam-lobby').exists()).toBe(true)
    w.unmount()
  })

  it('does not use the old pieces (parchment, seal, brass, serif) and no fixed colours', () => {
    const view = src('src/views/app/AppFamilyOrderView.vue')
    for (const old of ['MapPaper', 'MapButton', 'MapSeats', 'MapResult', 'MapResume', 'MapScoreBar', 'siegel', 'seal', 'mp-serif', 'parchment', 'papyrus', 'brass']) {
      expect(view, old).not.toContain(old)
    }
    expect(view.slice(view.indexOf('<style'))).not.toMatch(/#[0-9a-fA-F]{3,6}\b/)
    animationsOnlyWithMotion('src/views/app/AppFamilyOrderView.vue')
  })
})

describe('the Bible bingo in the new look', () => {
  async function toLobby(w: ReturnType<typeof mount>) {
    await w.find('.fam-start-play').trigger('click')
    await flushPromises()
  }
  const button = (w: ReturnType<typeof mount>, text: string) => w.findAll('.fam-btn').find((b) => b.text() === text)

  it('opens with the title screen: the name, the line and four rules', async () => {
    const { default: View } = await import('@/views/app/AppFamilyBingoView.vue')
    const w = mount(View, opts)
    await flushPromises()
    expect(w.find('.mt').classes()).toContain('fam-game--bingo')
    expect(w.find('.fam-start-name').text()).toBe('Bibel-Bingo')
    expect(w.find('.fam-start-line').text()).toBe('Personen ankreuzen')
    expect(w.findAll('.fam-start-list li')).toHaveLength(4)
    for (const old of ['.mpa', '.mb', '.mmd']) expect(w.find(old).exists(), old).toBe(false)
    w.unmount()
  })

  it('the page of the person: one card, the way, the level, and the buttons to begin (table: read aloud or a card; phones: a code)', async () => {
    const { default: View } = await import('@/views/app/AppFamilyBingoView.vue')
    const w = mount(View, opts)
    await flushPromises()
    await toLobby(w)
    expect(w.find('.fam-lobby-title').text()).toBe('Wer spielt auf diesem Handy?')
    expect(w.findAll('.fam-lobby-seat')).toHaveLength(1)
    expect(w.find('.fam-lobby-count').exists()).toBe(false)
    expect(w.find('.fam-lobby-go').exists()).toBe(false)
    expect(w.findAll('.fb-ways .fam-chip')).toHaveLength(2)
    expect(w.findAll('.fb-ways .fam-chip')[0]!.classes()).toContain('is-on')
    expect(button(w, 'Ich lese vor')).toBeTruthy()
    expect(button(w, 'Ich spiele mit (meine Karte)')).toBeTruthy()
    // several phones: a new round with a code, join with a code
    await w.findAll('.fb-ways .fam-chip')[1]!.trigger('click')
    expect(button(w, 'Ich lese vor')).toBeUndefined()
    expect(button(w, 'Neue Runde mit Code')).toBeTruthy()
    expect(w.find('.fam-name-input.is-code').exists()).toBe(true)
    expect(button(w, 'Mitspielen')!.attributes('disabled')).toBeDefined()
    await w.find('.fam-name-input').setValue('ABC')
    await w.find('.fam-name-input').trigger('keyup.enter')
    expect(w.find('.fb-error').exists()).toBe(true)
    w.unmount()
  })

  it('reads aloud at the table with a board of sixteen fields; a tap ticks one with a badge, the bar shows how many', async () => {
    const { default: View } = await import('@/views/app/AppFamilyBingoView.vue')
    const w = mount(View, opts)
    await flushPromises()
    await toLobby(w)
    await w.find('.fam-lobby-name').setValue('Lena')
    await button(w, 'Ich lese vor')!.trigger('click')
    await flushPromises()
    expect(w.find('.fam-bar').exists()).toBe(true)
    expect(w.find('.fam-bar-title').text()).toBe('Bibel-Bingo')
    expect(w.find('.fam-bar-chip .fam-bar-name').text()).toBe('Lena')
    expect(w.find('.fam-bar-chip .fam-bar-score').text()).toBe('0/16')
    expect(w.findAll('.bg-cell')).toHaveLength(16)
    expect(w.findAll('.bg-tick')).toHaveLength(0)
    await w.findAll('.bg-cell')[5]!.trigger('click')
    expect(w.findAll('.bg-tick')).toHaveLength(1)
    expect(w.findAll('.bg-cell')[5]!.attributes('aria-pressed')).toBe('true')
    expect(w.find('.fam-bar-chip .fam-bar-score').text()).toBe('1/16')
    // the call: the name of a person, in a white card; "Next person"
    expect(w.find('.fb-name').text().length).toBeGreaterThan(2)
    expect(button(w, 'Nächste Person')).toBeTruthy()
    // a row of four: the gold frame and the gold "Bingo!" button
    for (const i of [4, 6, 7]) await w.findAll('.bg-cell')[i]!.trigger('click')
    expect(w.findAll('.bg-cell.is-line')).toHaveLength(4)
    expect(w.find('.fb-bingo').classes()).toContain('is-lit')
    // the name is kept for the family games
    expect(JSON.parse(localStorage.getItem('lk-family-names') ?? '[]')[0]).toBe('Lena')
    w.unmount()
  })

  it('the hints: three hints one after the other, then the name', async () => {
    const { default: View } = await import('@/views/app/AppFamilyBingoView.vue')
    const w = mount(View, opts)
    await flushPromises()
    await toLobby(w)
    await w.findAll('.fb-levels .fam-chip')[1]!.trigger('click')
    await button(w, 'Ich lese vor')!.trigger('click')
    await flushPromises()
    expect(w.find('.fb-q').exists()).toBe(true)
    expect(w.findAll('.fb-hint')).toHaveLength(1)
    await button(w, 'Nächster Hinweis')!.trigger('click')
    expect(w.findAll('.fb-hint')).toHaveLength(2)
    await button(w, 'Auflösen')!.trigger('click')
    expect(w.findAll('.fb-hint')).toHaveLength(3)
    expect(w.find('.fb-name').exists()).toBe(true)
    w.unmount()
  })

  it('a card at the table: "Bingo!" says whether a line is full; leaving asks first and "Continue" gives the card back', async () => {
    const { default: View } = await import('@/views/app/AppFamilyBingoView.vue')
    const w = mount(View, opts)
    await flushPromises()
    await toLobby(w)
    await button(w, 'Ich spiele mit (meine Karte)')!.trigger('click')
    await flushPromises()
    await w.findAll('.bg-cell')[0]!.trigger('click')
    await w.find('.fb-bingo').trigger('click')
    expect(w.find('.fb-msg').text()).toBe('Noch keine volle Reihe, Spalte oder Diagonale.')
    for (const i of [1, 2, 3]) await w.findAll('.bg-cell')[i]!.trigger('click')
    await w.find('.fb-bingo').trigger('click')
    expect(w.find('.fb-msg').text()).toContain('Volle Reihe')
    await w.find('.fam-bar-btn').trigger('click')
    await w.find('.fam-bar-end').trigger('click')
    await flushPromises()
    expect(w.find('.fam-start-resume').exists()).toBe(true)
    expect(w.find('.fam-start-info').text()).toBe('Am Tisch')
    await w.find('.fam-start-resume').trigger('click')
    await flushPromises()
    expect(w.findAll('.bg-cell.is-line')).toHaveLength(4)
    w.unmount()
  })

  it('with a round code: code, card, "Go", the clock; Bingo with every person called wins, and the end has the podium; the end of the people too', async () => {
    vi.useFakeTimers()
    const { default: View } = await import('@/views/app/AppFamilyBingoView.vue')
    const w = mount(View, opts)
    await flushPromises()
    await toLobby(w)
    await w.findAll('.fb-ways .fam-chip')[1]!.trigger('click')
    await button(w, 'Neue Runde mit Code')!.trigger('click')
    await flushPromises()
    expect(w.find('.fb-code').text()).toMatch(/^[A-Z0-9]{3}-[A-Z0-9]{3}$/)
    expect(w.findAll('.bg-cell.is-readonly')).toHaveLength(16)
    await button(w, 'Los!')!.trigger('click')
    await flushPromises()
    expect(w.find('.fb-callcard').exists()).toBe(true)
    expect(w.find('.fb-callcard .fam-q-chip').text()).toContain('Person 1 von')
    // a wrong "Bingo!": a message, the game goes on
    await w.find('.fb-bingo').trigger('click')
    expect(w.find('.fb-msg[role="alert"]').exists()).toBe(true)
    // everybody is called after (n - 1) steps of 20 seconds: all fields ticked, "Bingo!" is true
    vi.advanceTimersByTime((WHO_PEOPLE.length - 1) * 20000 + 1000)
    await flushPromises()
    for (let i = 0; i < 16; i++) {
      if (w.findAll('.bg-cell')[i]!.attributes('aria-pressed') !== 'true') await w.findAll('.bg-cell')[i]!.trigger('click')
    }
    await w.find('.fb-bingo').trigger('click')
    await flushPromises()
    expect(w.find('.fam-pod').exists()).toBe(true)
    expect(w.find('.fam-pod-head').text()).toBe('Bingo!')
    expect(w.find('.fam-pod-solo').exists()).toBe(true)
    expect(w.find('.fb-grid--small').exists()).toBe(true)
    // "Again": a new round with a new code
    await w.find('.fam-pod-again').trigger('click')
    await flushPromises()
    expect(w.find('.fb-code').exists()).toBe(true)
    await button(w, 'Los!')!.trigger('click')
    await flushPromises()
    vi.advanceTimersByTime(WHO_PEOPLE.length * 20000 + 2000)
    await flushPromises()
    expect(w.find('.fam-pod-head').text()).toBe('Alle Personen sind genannt')
    expect(w.find('.fam-pod-solo').exists()).toBe(false)
    w.unmount()
  })

  it('the board is a white card of the app: no parchment, no wax seal, no fixed colours, nothing that blinks', () => {
    for (const file of ['src/views/app/AppFamilyBingoView.vue', 'src/components/molecules/BingoGrid.vue']) {
      const text = src(file)
      for (const old of ['MapPaper', 'MapButton', 'MapMedallion', 'MapResult', 'MapResume', 'siegel', 'seal', 'mp-serif', 'parchment', 'papyrus', 'brass', 'sepia', 'infinite']) {
        expect(text, `${file} ${old}`).not.toContain(old)
      }
      expect(text.slice(text.indexOf('<style')), file).not.toMatch(/#[0-9a-fA-F]{3,6}\b/)
      animationsOnlyWithMotion(file)
    }
  })

  it('the fields are as big as the width allows and the name is readable (at least 0.68 rem)', () => {
    const grid = src('src/components/molecules/BingoGrid.vue')
    expect(grid).toMatch(/\.bg-name[\s\S]*?font-size: 0\.8rem/)
    expect(grid).toMatch(/&\.is-long\n\s+font-size: 0\.68rem/)
    expect(grid).toMatch(/aspect-ratio: var\(--bg-ratio, 1 \/ 1\.08\)/)
  })
})
