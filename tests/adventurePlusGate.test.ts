/**
 * An adventure of Plus without Plus (Anton, 17 Nov 2026): the Plus window comes at once, before anything is downloaded; the button in the
 * window of the adventure says so ("About LambKing Plus") instead of "Begin adventure".
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'

const push = vi.fn()
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: {}, query: {}, name: 'app-adventure' }),
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn(), beforeEach: vi.fn(), afterEach: vi.fn(), onError: vi.fn() })
}))
// the first adventure is "of Plus" and Plus is not there
vi.mock('@/utils/adventureAccess', async (orig) => ({ ...(await orig<typeof import('@/utils/adventureAccess')>()), isJourneyPlusLocked: () => true }))
const showUpsell = vi.fn()
vi.mock('@/use/usePremium', async (orig) => ({ ...(await orig<typeof import('@/use/usePremium')>()), showUpsell }))
const download = vi.fn(async () => true)
vi.mock('@/use/useJourneyPack', () => ({
  default: () => ({ isReady: () => false, supported: true, failed: { value: false }, busy: { value: false }, progress: { value: 0 }, download, cancel: vi.fn(), remove: vi.fn() })
}))

const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'de', messages: messages as never, missingWarn: false, fallbackWarn: false })
const opts = { global: { plugins: [i18n], stubs: { RouterLink: true } }, attachTo: document.body }

beforeEach(() => {
  localStorage.clear()
  push.mockClear()
  showUpsell.mockClear()
  download.mockClear()
})

describe('a Plus adventure without Plus', () => {
  it('opens the Plus window at once and downloads nothing', async () => {
    const { default: Home } = await import('@/views/app/AppAdventureHomeView.vue')
    const w = mount(Home, opts)
    await flushPromises()
    await w.get('button.tile').trigger('click')
    await flushPromises()
    const button = Array.from(document.body.querySelectorAll('button')).find((b) => /Mehr über LambKing Plus/.test(b.textContent ?? ''))
    expect(button, 'the button of the window says it is Plus').toBeTruthy()
    expect(document.body.textContent).not.toContain('Abenteuer beginnen')
    button!.click()
    await flushPromises()
    expect(showUpsell).toHaveBeenCalledWith('adventure')
    expect(download).not.toHaveBeenCalled()
    expect(push).not.toHaveBeenCalled()
    expect(document.body.textContent).not.toMatch(/Lade|lädt/)
    w.unmount()
  })
})
