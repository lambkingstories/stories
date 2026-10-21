/**
 * Start page extras: "Dein Bild" opens the picture itself, and the sponsors slide appears only when there are sponsors.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'

const push = vi.fn()
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: {}, query: {}, name: 'app-main' }),
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn(), beforeEach: vi.fn(), afterEach: vi.fn(), onError: vi.fn() })
}))

vi.mock('@/use/useArtworks', () => ({
  listArtworks: async () => [
    { id: 'src:a#1', title: 'Alt', kind: 'page', sourceUrl: 'a', sourceType: 'image', page: 1, width: 1, height: 1, thumb: '', updatedAt: 1 },
    { id: 'src:b#1', title: 'Neu', kind: 'page', sourceUrl: 'b', sourceType: 'image', page: 1, width: 1, height: 1, thumb: '', updatedAt: 9 }
  ]
}))

vi.mock('@/data/sponsors', () => ({
  sponsors: [{ id: 's1', name: 'Beispiel GmbH', url: 'https://example.org' }]
}))

vi.mock('@/components/molecules/AppHeader.vue', () => ({
  default: { name: 'AppHeader', template: '<header class="app-header-stub" />' }
}))

const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'de', messages: messages as never, missingWarn: false, fallbackWarn: false })

beforeEach(() => {
  push.mockClear()
  localStorage.clear()
})
afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('start page extras', () => {
  it('"Dein Bild" opens the picture that was painted last', async () => {
    const { default: Home } = await import('@/views/app/AppHomeView.vue')
    const wrapper = mount(Home, { global: { plugins: [i18n], stubs: { RouterLink: true } }, attachTo: document.body })
    await flushPromises()
    const card = wrapper.findAll('.resume-card')[1]!
    expect(card.text()).toContain('Neu')
    await card.trigger('click')
    expect(push).toHaveBeenCalledWith({ name: 'app-coloring', query: { work: 'src:b#1' } })
  })

  it('the sponsors slide is there when there are sponsors and names them', async () => {
    const { default: Home } = await import('@/views/app/AppHomeView.vue')
    const wrapper = mount(Home, { global: { plugins: [i18n], stubs: { RouterLink: true } }, attachTo: document.body })
    await flushPromises()
    const slides = wrapper.findAll('.hero-slide')
    expect(slides).toHaveLength(5)
    // the sponsors come after the shop, then asking for support; the partnership with REACH Ministries is the last slide
    expect(slides[2]!.text()).toContain('Unsere Sponsoren')
    expect(slides[2]!.text()).toContain('Beispiel GmbH')
    expect(slides[3]!.text()).toContain('Unterstütze unsere Mission')
    expect(slides[4]!.text()).toContain('Reach Kids Ministries')
  })
})
