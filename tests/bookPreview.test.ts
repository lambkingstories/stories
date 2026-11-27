/**
 * The look inside a printed book (Books → Vorschau): read full screen with turning pages like the bought book (Anton 27.11.2026): seven pages
 * (the cover, five sample pages, the closing page), the last one offers the digital book (a purchase in the app) and the printed book.
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

  it('is read full screen like the bought book; page 7 offers the digital book and the printed book', async () => {
    const { default: View } = await import('@/views/app/AppBookPreviewView.vue')
    const { default: Flip } = await import('@/components/molecules/BookFlip.vue')
    const wrapper = mount(View, { global: { plugins: [i18n] }, attachTo: document.body })
    await flushPromises()
    const flip = wrapper.findComponent(Flip)
    expect(flip.exists()).toBe(true)
    expect(document.body.querySelector('.bf-root')).not.toBeNull()
    const pages = flip.props('pages') as unknown[]
    expect(pages).toHaveLength(7)
    expect(String(pages[0])).toContain('zachaeus-cover.webp')
    expect(String(pages[5])).toContain('seite-5.webp')
    // the window of the test is wider than high: two pages side by side; turn to the end
    for (let i = 0; i < 4; i++) {
      ;(flip.vm as unknown as { go: (d: 1 | -1) => void }).go(1)
      await new Promise((r) => setTimeout(r, 900))
    }
    const end = document.body.querySelector('[data-test="book-end-page"]')!
    expect(end.textContent).toContain('Gefällt dir das Buch?')
    expect(end.querySelector('.bp-digital')!.textContent).toBe('Digital kaufen · 2,99 €')
    // the printed book is in the store
    ;(end.querySelector('.bp-store') as HTMLButtonElement).click()
    expect(openExternal).toHaveBeenCalledWith('https://lambking.store/buch/der-mann-im-baum-zachaeus-begegnet-jesus/')
    expect(warnings.filter((w) => /not defined on instance|is not a function|ERROR/.test(w))).toEqual([])
    wrapper.unmount()
  }, 15000)

  it('the digital book is bought (the test build pretends), then it is read page by page and can be downloaded', async () => {
    const { default: View } = await import('@/views/app/AppBookPreviewView.vue')
    const { default: Flip } = await import('@/components/molecules/BookFlip.vue')
    const { setTestBook, ownsBook } = await import('@/use/usePremium')
    const b = storeBooks.find((x) => x.id === 'der-mann-im-baum-zachaeus')!
    expect(b.digital?.pages).toHaveLength(29)
    expect(ownsBook(b.id)).toBe(false)
    const pagesOf = async () => {
      const wrapper = mount(View, { global: { plugins: [i18n] }, attachTo: document.body })
      await flushPromises()
      return { wrapper, pages: wrapper.findComponent(Flip).props('pages') as unknown[] }
    }
    // not owned: even on the route "lesen" only the look inside is shown
    current.name = 'app-book-read'
    let { wrapper, pages } = await pagesOf()
    expect(pages).toHaveLength(7)
    wrapper.unmount()
    // owned: the closing page says so and offers reading and the PDF, no buying
    setTestBook(b.id, true)
    current.name = 'app-book-preview'
    ;({ wrapper, pages } = await pagesOf())
    const end = (pages[6] as { end: { title: string; buttons: { testid: string; action: () => void }[] } }).end
    expect(end.title).toContain('Dieses Buch gehört dir.')
    expect(end.buttons.map((x) => x.testid)).toEqual(['bp-read', 'bp-download', 'bp-test-undo'])
    end.buttons[0]!.action()
    expect(push).toHaveBeenCalledWith({ name: 'app-book-read', params: { bookId: b.id } })
    wrapper.unmount()
    // the route "lesen" has all 29 pages and no closing page
    current.name = 'app-book-read'
    ;({ wrapper, pages } = await pagesOf())
    expect(pages).toHaveLength(29)
    expect(String(pages[0])).toContain('seite-01.webp')
    expect(pages.every((x) => typeof x === 'string')).toBe(true)
    expect(document.body.querySelectorAll('.bf-back')).toHaveLength(1)
    setTestBook(b.id, false)
    wrapper.unmount()
    current.name = 'app-book-preview'
    expect(warnings.filter((w) => /not defined on instance|is not a function|ERROR/.test(w))).toEqual([])
  })
})
