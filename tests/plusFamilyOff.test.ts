/**
 * Anton 13.11.2026: in the Android build the family plan is not offered for now (only the single plans, monthly and yearly).
 * `VITE_PLUS_FAMILY: "false"` (android-build.yml) hides it on the Plus page; everywhere else it stays.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: {}, query: {}, name: 'app-plus' }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), beforeEach: vi.fn(), afterEach: vi.fn(), onError: vi.fn() })
}))

const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'de', messages: messages as never, missingWarn: false, fallbackWarn: false })
const opts = { global: { plugins: [i18n], stubs: { RouterLink: true, LkPageHead: true } } }

async function mountPlus() {
  vi.resetModules()
  const { default: AppPlusView } = await import('@/views/app/AppPlusView.vue')
  const w = mount(AppPlusView, opts)
  await flushPromises()
  return w
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('the family plan on the Plus page', () => {
  it('is offered by default (iOS, web)', async () => {
    const w = await mountPlus()
    expect(w.find('.plus-family-title').exists()).toBe(true)
    expect(w.findAll('.plus-plan').length).toBeGreaterThanOrEqual(2)
    w.unmount()
  })

  it('is not offered when the build says so (Android for now): no family title, text, prices or note', async () => {
    vi.stubEnv('VITE_PLUS_FAMILY', 'false')
    const w = await mountPlus()
    expect(w.find('.plus-family-title').exists()).toBe(false)
    expect(w.find('.plus-family-text').exists()).toBe(false)
    expect(w.text()).not.toContain('Plus für die ganze Familie')
    w.unmount()
  })
})
