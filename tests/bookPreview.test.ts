/**
 * The look inside a printed book (Books → Vorschau): seven pages (the cover, five sample pages, the page about buying), the last one offers
 * the digital book (a purchase in the app) and the printed book (a button to the store, which leaves the app through openExternal).
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import { storeBooks } from '@/data/storeBooks'

const push = vi.fn()
const current = vi.hoisted(() => ({ bookId: 'der-mann-im-baum-zachaeus', name: 'app-book-preview' }))
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { bookId: current.bookId }, query: {}, name: current.name }),
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn(), resolve: (to: { name: string }) => ({ path: '/' + to.name }), beforeEach: vi.fn(), afterEach: vi.fn(), onError: vi.fn() })
}))
const openExternal = vi.fn()
vi.mock('@/utils/openExternal', () => ({ openExternal: (...a: unknown[]) => openExternal(...a) }))

// the test build: a purchase is only pretended (read when `usePremium` is loaded, which happens inside the tests)
vi.stubEnv('VITE_PLUS_TEST', 'true')

const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'de', messages: messages as never, missingWarn: false, fallbackWarn: false })

let warnings: string[] = []
beforeEach(() => {
  warnings = []
  openExternal.mockClear()
  vi.spyOn(console, 'warn').mockImplementation((...a) => {
    warnings.push(a.map(String).join(' '))
  })
  vi.spyOn(console, 'error').mockImplementation((...a) => {
    warnings.push('ERROR ' + a.map(String).join(' '))
  })
})
afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('the preview of "Zachäus begegnet Jesus"', () => {
  it('has five sample pages in the data (the last picture of the landing page is left out, the end stays a surprise)', () => {
    const b = storeBooks.find((x) => x.id === 'der-mann-im-baum-zachaeus')!
    expect(b.preview?.pages).toHaveLength(5)
    expect(b.preview!.pages.map((p) => p.src).join(' ')).not.toContain('seite-6')
  })

  it('can be paged through to page 7, which offers the digital book and the printed book', async () => {
    const { default: View } = await import('@/views/app/AppBookPreviewView.vue')
    const wrapper = mount(View, { global: { plugins: [i18n] }, attachTo: document.body })
    await flushPromises()
    expect(wrapper.find('.bp-count').text()).toBe('1 / 7')
    expect(wrapper.findAll('.bp-dot')).toHaveLength(7)
    expect(wrapper.find('.bp-picture').attributes('src')).toContain('zachaeus-cover.webp')
    const next = () => wrapper.findAll('.bp-arrow')[1]!
    for (let i = 0; i < 5; i++) await next().trigger('click')
    expect(wrapper.find('.bp-count').text()).toBe('6 / 7')
    expect(wrapper.find('.bp-picture').attributes('src')).toContain('seite-5.webp')
    await next().trigger('click')
    expect(wrapper.find('.bp-count').text()).toBe('7 / 7')
    expect(wrapper.find('.bp-buy').text()).toContain('Gefällt dir das Buch?')
    expect(wrapper.find('.bp-digital').text()).toBe('Digital kaufen · 2,99 €')
    expect(next().attributes('disabled')).toBeDefined()
    // the printed book is in the store
    await wrapper.find('.bp-store').trigger('click')
    expect(openExternal).toHaveBeenCalledWith('https://lambking.store/buch/der-mann-im-baum-zachaeus-begegnet-jesus/')
    // back with the first arrow
    await wrapper.findAll('.bp-arrow')[0]!.trigger('click')
    expect(wrapper.find('.bp-count').text()).toBe('6 / 7')
    expect(warnings.filter((w) => /not defined on instance|is not a function|ERROR/.test(w))).toEqual([])
  })

  it('the digital book is bought (the test build pretends), then it is read page by page and can be downloaded', async () => {
    const { default: View } = await import('@/views/app/AppBookPreviewView.vue')
    const { setTestBook, ownsBook } = await import('@/use/usePremium')
    const b = storeBooks.find((x) => x.id === 'der-mann-im-baum-zachaeus')!
    expect(b.digital?.pages).toHaveLength(29)
    expect(ownsBook(b.id)).toBe(false)
    // not owned: even on the route "lesen" only the look inside is shown
    current.name = 'app-book-read'
    let wrapper = mount(View, { global: { plugins: [i18n] }, attachTo: document.body })
    await flushPromises()
    expect(wrapper.find('.bp-count').text()).toBe('1 / 7')
    wrapper.unmount()
    // owned: the buy page says so, and the route "lesen" has all 29 pages and no page about buying
    setTestBook(b.id, true)
    current.name = 'app-book-preview'
    wrapper = mount(View, { global: { plugins: [i18n] }, attachTo: document.body })
    await flushPromises()
    for (let i = 0; i < 6; i++) await wrapper.findAll('.bp-arrow')[1]!.trigger('click')
    expect(wrapper.find('.bp-buy').text()).toContain('Dieses Buch gehört dir.')
    expect(wrapper.find('.bp-digital').exists()).toBe(false)
    await wrapper.find('.bp-read').trigger('click')
    expect(push).toHaveBeenCalledWith({ name: 'app-book-read', params: { bookId: b.id } })
    wrapper.unmount()
    current.name = 'app-book-read'
    wrapper = mount(View, { global: { plugins: [i18n] }, attachTo: document.body })
    await flushPromises()
    // the whole book is a full-screen reader on top of everything: no header, no count, no buy page, only the book and a back button
    expect(document.body.querySelector('.bf-root')).not.toBeNull()
    expect(document.body.querySelectorAll('.bf-back')).toHaveLength(1)
    expect(wrapper.find('.bp-count').exists()).toBe(false)
    // lying on its side (the test window is wider than high) the cover is alone on the right
    expect(document.body.querySelector('.bf-right img')?.getAttribute('src')).toContain('seite-01.webp')
    expect(document.body.querySelector('.bf-left img')).toBeNull()
    expect(wrapper.find('.bp-buy').exists()).toBe(false)
    setTestBook(b.id, false)
    wrapper.unmount()
    current.name = 'app-book-preview'
    expect(warnings.filter((w) => /not defined on instance|is not a function|ERROR/.test(w))).toEqual([])
  })
})
