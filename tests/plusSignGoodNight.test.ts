/**
 * "Good night" is part of LambKing Plus (the stories are read aloud), so it carries the Plus sign from the start: on its tile in "Lesen" and
 * at the top of its own page, not only after a story was picked. Without the Plus teaser (nothing for sale yet) there is no sign.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: {}, query: {}, name: 'app-read' }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), resolve: (to: { name: string }) => ({ path: '/' + to.name }), beforeEach: vi.fn(), afterEach: vi.fn(), onError: vi.fn() })
}))
vi.mock('@/use/useApiBooks', () => ({ default: () => ({ state: { all: [] }, loadAllBooks: vi.fn(async () => []) }) }))
vi.mock('@/use/useApiSeries', () => ({ default: () => ({ state: { all: [] }, loadAll: vi.fn(async () => []) }) }))
vi.mock('@/use/useVoices', () => ({ listVoices: vi.fn(async () => []), getVoiceBlob: vi.fn(async () => null) }))

const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'de', messages: messages as never, missingWarn: false, fallbackWarn: false })

async function load(env: Record<string, string>) {
  vi.resetModules()
  localStorage.clear()
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v)
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
  localStorage.clear()
  document.body.innerHTML = ''
})

describe('the Plus sign of Good night', () => {
  it('sits on the Good-night tile of "Lesen" (and on no other tile) once Plus is shown', async () => {
    await load({ VITE_PREMIUM_TEASER: 'true' })
    const { default: View } = await import('@/views/app/AppReadView.vue')
    const w = mount(View, { global: { plugins: [i18n] }, attachTo: document.body })
    await flushPromises()
    expect(w.findAll('.door').length).toBe(4)
    expect(w.findAll('.door-plus').length).toBe(1)
    expect(w.find('.door.is-goodnight .door-plus .plus-badge').exists()).toBe(true)
  })

  it('has no sign while nothing is for sale', async () => {
    await load({ VITE_PREMIUM_TEASER: 'false' })
    const { default: View } = await import('@/views/app/AppReadView.vue')
    const w = mount(View, { global: { plugins: [i18n] }, attachTo: document.body })
    await flushPromises()
    expect(w.find('.door-plus').exists()).toBe(false)
  })

  it('has no sign for a person with Plus', async () => {
    await load({ VITE_PREMIUM_TEASER: 'true', VITE_PLUS_TEST: 'true' })
    const premium = await import('@/use/usePremium')
    premium.setTestPlus(true)
    const { default: View } = await import('@/views/app/AppReadView.vue')
    const w = mount(View, { global: { plugins: [i18n] }, attachTo: document.body })
    await flushPromises()
    expect(w.find('.door-plus').exists()).toBe(false)
  })

  it('stands at the top of the Good-night page', async () => {
    await load({ VITE_PREMIUM_TEASER: 'true' })
    const { default: View } = await import('@/views/app/AppGoodNightView.vue')
    const w = mount(View, { global: { plugins: [i18n] }, attachTo: document.body })
    await flushPromises()
    expect(w.find('.gn-plus .plus-badge').exists()).toBe(true)
    w.unmount()
  })

  it('is missing from the Good-night page when Plus is not shown', async () => {
    await load({ VITE_PREMIUM_TEASER: 'false' })
    const { default: View } = await import('@/views/app/AppGoodNightView.vue')
    const w = mount(View, { global: { plugins: [i18n] }, attachTo: document.body })
    await flushPromises()
    expect(w.find('.gn-plus').exists()).toBe(false)
    w.unmount()
  })
})
