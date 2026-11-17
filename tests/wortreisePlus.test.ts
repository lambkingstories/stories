/**
 * The Wortreise is part of LambKing Plus like the other family games (except the quiz): without Plus the page shows the lock, and the hub opens the
 * Plus sheet instead of the game.
 */
import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import app from '../src/i18n/app'
import { withGameTexts } from '../src/i18n/bigGames'

vi.mock('@/use/useSfx', () => ({ default: () => ({ play: vi.fn() }) }))
vi.mock('@/use/useMusic', () => ({ default: () => ({ playFamily: vi.fn(), playGame: vi.fn(), stop: vi.fn() }) }))
const showUpsell = vi.fn()
vi.mock('@/use/usePremium', () => ({ PREMIUM_TEASER: true, hasFeature: () => false, showUpsell: (...a: unknown[]) => showUpsell(...a) }))
const push = vi.fn()
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: {}, query: {}, name: 'app-family-wortreise' }),
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn(), beforeEach: vi.fn(), afterEach: vi.fn(), onError: vi.fn(), options: { history: { state: {} } } })
}))

import AppFamilyWortreiseView from '@/views/app/AppFamilyWortreiseView.vue'
import AppFamilyGamesView from '@/views/app/AppFamilyGamesView.vue'

const messages = withGameTexts(app as never) as { de: object; en: object }
const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'de', messages: { de: messages.de, en: messages.en } as never, missingWarn: false, fallbackWarn: false })
const opts = { global: { plugins: [i18n], stubs: { RouterLink: true, PlusBadge: true } }, attachTo: document.body }

describe('Wortreise and Plus', () => {
  it('shows the lock instead of the setup and opens the Plus sheet from its button', async () => {
    showUpsell.mockClear()
    const w = mount(AppFamilyWortreiseView, opts)
    await flushPromises()
    expect(w.text()).toContain('gehört zu LambKing Plus')
    expect(w.find('.wr-setup').exists()).toBe(false)
    await w.find('button.mb').trigger('click')
    expect(showUpsell).toHaveBeenCalledWith('family')
    w.unmount()
  })

  it('the hub opens the Plus sheet and not the game', async () => {
    showUpsell.mockClear()
    push.mockClear()
    const w = mount(AppFamilyGamesView, opts)
    await flushPromises()
    const places = w.findAll('.fh-box')
    await places[6]!.trigger('click')
    expect(showUpsell).toHaveBeenCalledWith('family')
    expect(push).not.toHaveBeenCalled()
    // the quiz stays free
    await places[0]!.trigger('click')
    expect(push).toHaveBeenCalledWith({ name: 'app-family-quiz' })
    w.unmount()
  })
})
