/**
 * Two cleanups of 17 Nov 2026 (Anton):
 *  1. The unreachable "Hören" page (a 9,000 px list of red play buttons that led to the book page anyway) is gone. Listening starts on the page of a book
 *     ("Anhören", a Plus feature with its Plus badge); old addresses lead to "Lesen".
 *  2. There are seven family games (quiz, memory, bingo, Bible Words (id activity), who am I, order race, word journey) and every text that counts them says seven.
 */
import { existsSync, readFileSync } from 'node:fs'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import { withGameTexts } from '@/i18n/bigGames'
import { routeToNav } from '@/use/useAppNav'

vi.mock('@/use/useSfx', () => ({ default: () => ({ play: vi.fn(), tap: vi.fn() }) }))
vi.mock('@/use/useMusic', () => ({ default: () => ({ playFamily: vi.fn(), playGame: vi.fn(), stop: vi.fn() }) }))
const showUpsell = vi.fn()
vi.mock('@/use/usePremium', () => ({ PREMIUM_TEASER: true, hasFeature: () => false, showUpsell: (...a: unknown[]) => showUpsell(...a) }))
const push = vi.fn()
vi.mock('vue-router', async (orig) => ({
  ...(await orig<typeof import('vue-router')>()),
  useRoute: () => ({ params: {}, query: {}, name: 'app-family' }),
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn(), beforeEach: vi.fn(), afterEach: vi.fn(), onError: vi.fn(), options: { history: { state: {} } } })
}))

vi.stubGlobal('APP_VERSION', 'test')
vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn() }))

const all = withGameTexts(messages as never) as { de: Record<string, any>; en: Record<string, any> }
const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'de', messages: { de: all.de, en: all.en } as never, missingWarn: false, fallbackWarn: false })
const opts = { global: { plugins: [i18n], stubs: { RouterLink: true, PlusBadge: true } }, attachTo: document.body }

describe('the "Hören" page is gone', () => {
  it('has no view file, no route name, no nav entry and no texts', () => {
    expect(existsSync('src/views/app/AppHoerenView.vue')).toBe(false)
    const router = readFileSync('src/router/index.ts', 'utf8')
    expect(router).not.toContain('AppHoerenView')
    expect(router).not.toContain("name: 'app-hoeren'")
    expect(router).toMatch(/path: '\/app\/hoeren', redirect: \{ name: 'app-read' \}/)
    expect(routeToNav('app-hoeren')).toBe('home')
    for (const lang of ['de', 'en'] as const) {
      expect(all[lang].app.hoeren).toBeUndefined()
      expect(all[lang].app.nav.hoeren).toBeUndefined()
    }
  })

  it('listening is on the page of a book and carries the Plus badge there', () => {
    const view = readFileSync('src/views/app/AppBookDetailView.vue', 'utf8')
    expect(view).toMatch(/PlusBadge\(v-if="PREMIUM_TEASER && !hasFeature\('readAloud'\)"/)
    // the feature list names the button the way it is called in the app
    expect(all.de.app.features.s1f2Where).toContain('„Anhören“')
    expect(all.en.app.features.s1f2Where).toContain('"Listen"')
    expect(all.de.app.bookDetail.listen).toBe('Anhören')
    expect(all.en.app.bookDetail.listen).toBe('Listen')
  })
})

const GAME_WORDS = {
  de: ['Quiz', 'Bibel-Begriffe', 'Wer bin ich?', 'Reihenfolge-Rennen', 'Bibel-Bingo', 'Paare finden', 'Wortreise'],
  en: ['quiz', 'Bible Words', 'Who am I?', 'order race', 'Bible bingo', 'Find the Pairs', 'Word Journey']
}

describe('seven family games', () => {
  beforeEach(() => {
    showUpsell.mockClear()
    push.mockClear()
  })

  it('the hub has seven places: the quiz opens, the six others ask for Plus without Plus', async () => {
    const { default: Hub } = await import('@/views/app/AppFamilyGamesView.vue')
    const w = mount(Hub, opts)
    await flushPromises()
    const places = w.findAll('.fh-box')
    expect(places.length).toBe(7)
    await places[0]!.trigger('click')
    expect(push).toHaveBeenLastCalledWith({ name: 'app-family-quiz' })
    expect(showUpsell).not.toHaveBeenCalled()
    for (let i = 1; i < 7; i++) await places[i]!.trigger('click')
    expect(showUpsell).toHaveBeenCalledTimes(6)
    expect(push).toHaveBeenCalledTimes(1)
    w.unmount()
  })

  it('every Plus game shows the lock without Plus and opens the Plus sheet; the quiz does not lock', async () => {
    const views = ['Activity', 'Who', 'Order', 'Bingo', 'Memory', 'Wortreise']
    for (const name of views) {
      showUpsell.mockClear()
      const { default: View } = await import(`../src/views/app/AppFamily${name}View.vue`)
      const w = mount(View, opts)
      await flushPromises()
      const lock = w.find('button.mb')
      expect(lock.exists(), `${name} shows the lock`).toBe(true)
      await lock.trigger('click')
      expect(showUpsell, name).toHaveBeenCalledWith('family')
      w.unmount()
    }
    const quiz = readFileSync('src/views/app/AppFamilyQuizView.vue', 'utf8')
    expect(quiz).not.toContain("showUpsell('family')")
  })

  for (const lang of ['de', 'en'] as const) {
    it(`${lang}: the Plus page and the feature list name all seven games`, () => {
      const plus = all[lang].app.plus
      const feat = all[lang].app.features
      const count = lang === 'de' ? 'Sieben' : 'Seven'
      expect(feat.s2f8Text.startsWith(count)).toBe(true)
      expect(plus.card3Text.startsWith(count)).toBe(true)
      for (const word of GAME_WORDS[lang]) {
        expect(feat.s2f8Text.toLowerCase(), `features: ${word}`).toContain(word.toLowerCase())
        expect(plus.card3Text.toLowerCase(), `plus card: ${word}`).toContain(word.toLowerCase())
      }
      for (const word of GAME_WORDS[lang].slice(1)) expect(plus.area2Get5.toLowerCase(), `area list: ${word}`).toContain(word.toLowerCase())
      expect(plus.familyText.toLowerCase()).toContain(lang === 'de' ? 'wortreise' : 'word journey')
      // the quiz stays free in every text that says so
      expect(all[lang].app.family.hubNote.toLowerCase()).toContain(lang === 'de' ? 'quiz ist gratis' : 'quiz is free')
    })
  }

  it('Spanish names the seventh game too', () => {
    const es = readFileSync('src/i18n/es/teil3.ts', 'utf8')
    expect(es).toContain('Siete juegos para toda la familia')
    expect(es).toContain('Siete juegos para la familia')
    expect(es).not.toContain('Seis juegos para toda la familia')
  })
})
