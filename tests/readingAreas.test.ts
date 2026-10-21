/**
 * "Lesen" has three areas (Stories, Books, Malbücher): every book belongs to exactly one, and the three views are mounted and
 * used (Pug templates are not checked by the type checker).
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import { BOOKS_SERIES_ID, booksOfArea, readingAreaOf } from '@/utils/readingAreas'
import { storeBooks } from '@/data/storeBooks'

const push = vi.fn()
const replace = vi.fn()
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: {}, query: {}, name: 'app-read' }),
  useRouter: () => ({
    push,
    replace,
    back: vi.fn(),
    resolve: (to: { name: string }) => ({ path: '/' + to.name }),
    beforeEach: vi.fn(),
    afterEach: vi.fn(),
    onError: vi.fn()
  })
}))

const openExternal = vi.fn()
vi.mock('@/utils/openExternal', () => ({ openExternal: (...a: unknown[]) => openExternal(...a) }))

const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'de', messages: messages as never, missingWarn: false, fallbackWarn: false })

let warnings: string[] = []
beforeEach(() => {
  warnings = []
  push.mockClear()
  replace.mockClear()
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

describe('the area of a book', () => {
  it('puts coloring books into Malbücher, books of the store series into Books and everything else into Stories', () => {
    expect(readingAreaOf({ kind: 'coloring' })).toBe('coloring')
    expect(readingAreaOf({ category: 'Ausmalbücher', bookSeriesId: 'bibelgeschichten-zum-ausmalen' })).toBe('coloring')
    expect(readingAreaOf({ category: 'Ausmahlbücher' })).toBe('coloring')
    expect(readingAreaOf({ category: 'Gute Nacht Geschichten', bookSeriesId: 'die-tiere-von-talheim' })).toBe('stories')
    expect(readingAreaOf({ category: 'Abenteuer', bookSeriesId: 'levi-in-der-welt-der-bibel' })).toBe('stories')
    expect(readingAreaOf({ category: 'Bilderbuch', bookSeriesId: BOOKS_SERIES_ID })).toBe('books')
    expect(readingAreaOf(null)).toBe('stories')
  })

  it('never loses a book: the three areas together are the whole list', () => {
    const list = [
      { bookId: 'a', category: 'Gute Nacht Geschichten', bookSeriesId: 'x' },
      { bookId: 'b', category: 'Ausmalbücher', bookSeriesId: 'y' },
      { bookId: 'c', category: 'Bilderbuch', bookSeriesId: BOOKS_SERIES_ID },
      { bookId: 'd', kind: 'story', category: 'Ausmalbücher', bookSeriesId: 'z' }
    ]
    const parts = [...booksOfArea(list, 'stories'), ...booksOfArea(list, 'books'), ...booksOfArea(list, 'coloring')]
    expect(parts.map((b) => b.bookId).sort()).toEqual(['a', 'b', 'c', 'd'])
    expect(booksOfArea(list, 'coloring').map((b) => b.bookId)).toEqual(['b'])
  })
})

describe('Lesen: the front door', () => {
  it('shows three tiles that lead to Stories, Books and Malbücher', async () => {
    const { default: View } = await import('@/views/app/AppReadView.vue')
    const wrapper = mount(View, { global: { plugins: [i18n] }, attachTo: document.body })
    await flushPromises()
    const doors = wrapper.findAll('.door')
    expect(doors.map((d) => d.find('.door-title').text())).toEqual(['Stories', 'Books', 'Malbücher'])
    const routes = ['app-all-books', 'app-books', 'app-coloring-books']
    for (let i = 0; i < doors.length; i++) {
      push.mockClear()
      await doors[i]!.trigger('click')
      expect(push).toHaveBeenCalledWith({ name: routes[i] })
    }
    expect(warnings.filter((w) => /not defined on instance|is not a function|ERROR/.test(w))).toEqual([])
  })

  it('has English words for every tile', () => {
    const en = (messages as Record<string, { app: { read: Record<string, string> } }>).en.app.read
    for (const k of ['hubTitle', 'storiesTitle', 'booksTitle', 'coloringTitle', 'storeNote', 'storeButton']) expect(en[k], k).toBeTruthy()
  })
})

describe('Books', () => {
  it('shows "Zachäus begegnet Jesus" with the store note, and the button leaves the app through openExternal', async () => {
    vi.doMock('@/use/useApiBooks', () => ({ default: () => ({ state: { all: [] }, loadAllBooks: vi.fn() }) }))
    vi.resetModules()
    const { default: View } = await import('@/views/app/AppBooksView.vue')
    const wrapper = mount(View, { global: { plugins: [i18n] }, attachTo: document.body })
    await flushPromises()
    expect(wrapper.text()).toContain('Zachäus begegnet Jesus')
    expect(wrapper.text()).toContain('Diese Bücher finden Sie auch in unserem Store')
    await wrapper.find('.book-store').trigger('click')
    expect(openExternal).toHaveBeenCalledWith(storeBooks[0]!.url)
    expect(storeBooks[0]!.url).toBe('https://lambking.store')
    expect(warnings.filter((w) => /not defined on instance|is not a function|ERROR/.test(w))).toEqual([])
    vi.doUnmock('@/use/useApiBooks')
  })
})
