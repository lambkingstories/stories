/**
 * "Malen → Malbücher" (the list of all coloring books), Anton, 18.11.2026: the books stand in two groups (Ab 5 Jahren, Ab 9 Jahren), the series is a small
 * heading over the group and the card shows only the name of the book, the sign "Gratis"/"Zu kaufen" stands under the cover (never over its title), and
 * without a net (and nothing on the device) there is a friendly note with "Nochmal" instead of "Es gibt noch keine Malbücher.".
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import messages from '@/i18n/app'

const h = vi.hoisted(() => ({
  state: null as unknown as { all: unknown[] | null; listReady: boolean; listFailed: boolean; listLoading: boolean },
  loadAllBooks: vi.fn(async () => [] as unknown[])
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: {}, query: {}, name: 'x' }),
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() })
}))
vi.mock('@/use/useApiBooks', () => ({ default: () => ({ state: h.state, loadAllBooks: h.loadAllBooks }) }))
vi.mock('@/use/useArtworks', async (orig) => ({ ...(await orig<typeof import('@/use/useArtworks')>()), listArtworks: async () => [] }))
vi.mock('@/components/molecules/LkPageHead.vue', () => ({ default: { name: 'LkPageHead', template: '<header />' } }))
vi.mock('@/components/atoms/LkCompanion.vue', () => ({ default: { name: 'LkCompanion', template: '<span />' } }))
vi.mock('@/utils/readingAreas', () => ({ booksOfArea: (books: unknown[]) => books }))

const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'de', messages: messages as never, missingWarn: false, fallbackWarn: false })

const page = (n: number) => ({ page: n, title: 'S' + n, text: '', image: `https://x/${n}.webp`, reference: '' })
const book = (bookId: string, title: string, badge: string, releaseDate: string) => ({
  bookId, kind: 'coloring', category: 'Ausmalbücher', bookSeriesId: 's', releaseDate, badges: [badge, 'Ausmalen'], previewImage: 'https://x/cover.webp',
  localizations: { de: { title, content: [page(1), page(2), page(3)] } }
})
const BOOKS = [
  book('b10', 'Bibelgeschichten zum Ausmalen: Band 10 - Ostern - Jesus lebt!', 'ab 9 Jahren', '2026-09-04'),
  book('m5', 'Mit Buntstift durch die Bibel: Mose – Mit Gott in die Freiheit (Band 5)', 'ab 5 Jahren', '2026-10-13'),
  book('b1', 'Bibelgeschichten zum Ausmalen: Band 1 - Die Schöpfung - Gott macht die Welt', 'ab 9 Jahren', '2026-09-01'),
  book('m2', 'Mit Buntstift durch die Bibel: Noah, die Arche und der Regenbogen (Band 2)', 'ab 5 Jahren', '2026-10-10')
]

beforeEach(() => {
  localStorage.clear()
  h.state = reactive({ all: BOOKS, listReady: true, listFailed: false, listLoading: false })
  h.loadAllBooks.mockClear()
  vi.spyOn(console, 'warn').mockImplementation(() => undefined)
})
afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

async function list() {
  vi.resetModules()
  const { default: View } = await import('@/views/app/AppColoringBooksView.vue')
  const w = mount(View, { global: { plugins: [i18n] }, attachTo: document.body })
  await flushPromises()
  return w
}

describe('the list of coloring books', () => {
  it('has two groups, "Ab 5 Jahren" first, with the series as the small heading', async () => {
    const w = await list()
    const sections = w.findAll('.cb-section')
    expect(sections.map((s) => s.find('.cb-sec-title').text())).toEqual(['Ab 5 Jahren', 'Ab 9 Jahren'])
    expect(sections[0]!.find('.cb-sec-series').text()).toBe('Mit Buntstift durch die Bibel')
    expect(sections[1]!.find('.cb-sec-series').text()).toBe('Bibelgeschichten zum Ausmalen')
  })

  it('shows the name of the book without the long start, the volumes rising', async () => {
    const w = await list()
    const titles = w.findAll('.cb-title').map((t) => t.text())
    expect(titles).toEqual(['Noah, die Arche und der Regenbogen', 'Mose – Mit Gott in die Freiheit', 'Die Schöpfung - Gott macht die Welt', 'Ostern - Jesus lebt!'])
    expect(w.text()).not.toContain('Bibelgeschichten zum Ausmalen: Band')
    // the volume stands in a small line
    expect(w.findAll('.cb-vol').map((t) => t.text())).toEqual(['Band 2', 'Band 5', 'Band 1', 'Band 10'])
  })

  it('has one card per book that opens it', async () => {
    const w = await list()
    expect(w.findAll('.cb-card')).toHaveLength(4)
  })

  it('shows the Gratis/Zu kaufen sign under the cover, not inside it (the title of the cover stays free)', async () => {
    vi.resetModules()
    vi.doMock('@/use/usePremium', async (orig) => ({ ...(await orig<typeof import('@/use/usePremium')>()), PREMIUM_TEASER: true }))
    const { default: View } = await import('@/views/app/AppColoringBooksView.vue')
    const w = mount(View, { global: { plugins: [i18n] }, attachTo: document.body })
    await flushPromises()
    const card = w.find('.cb-card')
    expect(card.find('.cb-own').exists()).toBe(true)
    expect(card.find('.cb-cover .own-badge').exists()).toBe(false)
    expect(card.find('.cb-cover .plus-badge').exists()).toBe(false)
    vi.doUnmock('@/use/usePremium')
  })
})

describe('without a net', () => {
  it('says so kindly, with a button "Nochmal", instead of "Es gibt noch keine Malbücher."', async () => {
    h.state.all = []
    h.state.listFailed = true
    const w = await list()
    expect(w.find('[data-test="book-list-error"]').exists()).toBe(true)
    expect(w.text()).not.toContain('Es gibt noch keine Malbücher')
    const retry = w.find('[data-test="book-list-retry"]')
    expect(retry.exists()).toBe(true)
    await retry.trigger('click')
    expect(h.loadAllBooks).toHaveBeenCalled()
  })

  it('shows placeholders during the first loading, not the empty sentence', async () => {
    h.state.all = null
    h.state.listReady = false
    const w = await list()
    expect(w.find('[data-test="book-skeleton"]').exists()).toBe(true)
    expect(w.text()).not.toContain('Es gibt noch keine Malbücher')
  })

  it('says "no coloring books yet" only when the server answered and there really are none', async () => {
    h.state.all = []
    const w = await list()
    expect(w.text()).toContain('Es gibt noch keine Malbücher')
    expect(w.find('[data-test="book-list-error"]').exists()).toBe(false)
  })
})
