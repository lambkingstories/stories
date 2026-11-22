/**
 * The way from the painting program to the paint shelf (Anton, 18.11.2026): "Malen" opens the painting program as before. The big door "Dein Malregal ist noch leer" (and the
 * button to all coloring books) leads to the list of coloring books with the chip "Meine" switched on (`?from=shelf`). A tap on a book that is mine does not open it, it
 * puts it on the paint shelf (a short transfer, which a tap skips) and leads back to the painting program, where the book is lifted once. Books that are not mine, and the list
 * reached any other way, behave as before.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, reactive } from 'vue'
import { readFileSync } from 'node:fs'
import messages from '@/i18n/app'
import { routeToNav } from '@/use/useAppNav'

const h = vi.hoisted(() => ({
  state: null as unknown as { all: unknown[] | null; listReady: boolean; listFailed: boolean; listLoading: boolean },
  loadAllBooks: vi.fn(async () => [] as unknown[]),
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  query: {} as Record<string, string>,
  plus: false,
  bought: [] as string[]
}))

function routerMock() {
  return {
    useRoute: () => ({ params: {}, query: h.query, name: 'x' }),
    useRouter: () => ({ push: h.push, back: h.back, replace: h.replace, resolve: (to: { name: string }) => ({ path: '/' + to.name }) })
  }
}
vi.mock('vue-router', () => routerMock())
vi.mock('@/use/useApiBooks', () => ({ default: () => ({ state: h.state, loadAllBooks: h.loadAllBooks }) }))
vi.mock('@/use/useArtworks', async (orig) => ({ ...(await orig<typeof import('@/use/useArtworks')>()), listArtworks: async () => [] }))
vi.mock('@/components/molecules/AppHeader.vue', () => ({ default: { name: 'AppHeader', template: '<header />' } }))
vi.mock('@/components/molecules/LkPageHead.vue', () => ({ default: { name: 'LkPageHead', template: '<header />' } }))
vi.mock('@/components/atoms/LkCompanion.vue', () => ({ default: { name: 'LkCompanion', template: '<span />' } }))
vi.mock('@/utils/readingAreas', () => ({ booksOfArea: (books: unknown[]) => books }))
// the books are for sale: the free book and the ones bought or opened by Plus belong to the child, the rest does not
vi.mock('@/use/usePremium', async (orig) => ({
  ...(await orig<typeof import('@/use/usePremium')>()),
  PREMIUM_TEASER: true,
  hasFeature: () => h.plus,
  ownsBook: (id: string) => h.bought.includes(id)
}))

const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'de', messages: messages as never, missingWarn: false, fallbackWarn: false })

const page = (n: number) => ({ page: n, title: 'S' + n, text: '', image: `https://x/${n}.webp`, reference: '' })
const book = (bookId: string, title: string, badge: string, releaseDate: string) => ({
  bookId, kind: 'coloring', category: 'Ausmalbücher', bookSeriesId: 's', releaseDate, badges: [badge, 'Ausmalen'], previewImage: 'https://x/cover.webp',
  localizations: { de: { title, content: [page(1), page(2), page(3)] } }
})
// the one free book, a book of the same series for sale, and two books for sale from the series for 9 to 12 (also "Die Schöpfung": not free any more)
const BOOKS = [
  book('ba-02-gott-erschafft-die-welt', 'Mit Buntstift durch die Bibel: Gott erschafft die Welt (Band 1)', 'ab 5 Jahren', '2026-10-01'),
  book('m2', 'Mit Buntstift durch die Bibel: Noah, die Arche und der Regenbogen (Band 2)', 'ab 5 Jahren', '2026-10-10'),
  book('ba-11-schoepfung-gott-macht-die-welt', 'Bibelgeschichten zum Ausmalen: Band 1 - Die Schöpfung - Gott macht die Welt', 'ab 9 Jahren', '2026-09-01'),
  book('b10', 'Bibelgeschichten zum Ausmalen: Band 10 - Ostern - Jesus lebt!', 'ab 9 Jahren', '2026-09-04')
]

beforeEach(() => {
  localStorage.clear()
  h.state = reactive({ all: BOOKS, listReady: true, listFailed: false, listLoading: false })
  h.query = {}
  h.plus = false
  h.bought = []
  for (const f of [h.push, h.replace, h.back, h.loadAllBooks]) f.mockClear()
  vi.spyOn(console, 'warn').mockImplementation(() => undefined)
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

async function list(reset = true) {
  if (reset) vi.resetModules()
  const { default: View } = await import('@/views/app/AppColoringBooksView.vue')
  const w = mount(View, { global: { plugins: [i18n] }, attachTo: document.body })
  await flushPromises()
  return w
}
const shelfModule = async () => (await import('@/use/useColoringShelf')).default()
const names = (w: Awaited<ReturnType<typeof list>>) => w.findAll('.cb-card').map((c) => c.attributes('aria-label'))

describe('the way into the painting area is as before', () => {
  it('the tab "Malen" leads straight to the painting program', async () => {
    vi.resetModules()
    vi.doMock('vue-router', () => ({ useRoute: () => ({ name: 'app-main' }), useRouter: () => ({ push: h.push }) }))
    const { default: useAppNav } = await import('@/use/useAppNav')
    useAppNav(((k: string) => k) as never).onNav('malen')
    vi.doMock('vue-router', () => routerMock())
    expect(h.push).toHaveBeenCalledWith({ name: 'app-coloring' })
    expect(routeToNav('app-coloring')).toBe('malen')
  })

  it('the start page card still opens the painting program, and the old choice page is gone', () => {
    expect(readFileSync('src/views/app/AppHomeView.vue', 'utf8')).not.toContain('app-coloring-pick')
    expect(readFileSync('src/router/index.ts', 'utf8')).not.toContain('app-coloring-pick')
  })

  it('the big door and the button of the shelf lead to the list with "Meine" (from=shelf)', () => {
    const view = readFileSync('src/views/app/AppColoringView.vue', 'utf8')
    expect(view).toContain("@to-books=\"router.push({ name: 'app-coloring-books', query: { from: 'shelf' } })\"")
  })
})

describe('the list from the paint shelf (from=shelf)', () => {
  it('starts with the chip "Meine": only the free book (no book still to buy, also not "Die Schöpfung")', async () => {
    h.query = { from: 'shelf' }
    const w = await list()
    expect(names(w)).toEqual(['Gott erschafft die Welt'])
    expect(w.find('.own-chip.is-on').text()).toContain('Meine')
  })

  it('adds a book that was bought, and every book with Plus', async () => {
    h.query = { from: 'shelf' }
    h.bought = ['ba-11-schoepfung-gott-macht-die-welt']
    let w = await list()
    expect(names(w)).toEqual(['Gott erschafft die Welt', 'Die Schöpfung - Gott macht die Welt'])
    w.unmount()
    h.bought = []
    h.plus = true
    w = await list()
    expect(names(w)).toHaveLength(4)
  })

  it('there are two chips, "Alle" and "Meine" (the chip "still to buy" is gone), and they can be changed', async () => {
    h.query = { from: 'shelf' }
    const w = await list()
    const chips = w.findAll('.own-chip')
    expect(chips).toHaveLength(2)
    expect(chips.some((c) => c.text().includes('Noch zu kaufen'))).toBe(false)
    await chips.find((c) => c.text().includes('Alle'))!.trigger('click')
    expect(names(w)).toHaveLength(4)
    await chips.find((c) => c.text().includes('Meine'))!.trigger('click')
    expect(names(w).length).toBeLessThan(4)
  })

  it('a tap on a book that is mine does not open it: it goes on the shelf and the transfer shows', async () => {
    h.query = { from: 'shelf' }
    const w = await list()
    const shelf = await shelfModule()
    expect(shelf.has('ba-02-gott-erschafft-die-welt')).toBe(false)
    await w.find('.cb-card').trigger('click')
    expect(shelf.has('ba-02-gott-erschafft-die-welt')).toBe(true)
    expect(h.push).not.toHaveBeenCalled()
    const t = w.find('[data-test="transfer"]')
    expect(t.exists()).toBe(true)
    expect(t.text()).toContain('Dein Malbuch liegt im Malregal')
  })

  it('after about 1.5 seconds it leads back to the painting program, and the book is marked to be lifted once', async () => {
    vi.useFakeTimers()
    h.query = { from: 'shelf' }
    const w = await list()
    await w.find('.cb-card').trigger('click')
    vi.advanceTimersByTime(1400)
    expect(h.replace).not.toHaveBeenCalled()
    vi.advanceTimersByTime(200)
    await nextTick()
    expect(h.replace).toHaveBeenCalledTimes(1)
    expect(h.replace).toHaveBeenCalledWith({ name: 'app-coloring' })
    expect((await shelfModule()).fresh.value).toBe('ba-02-gott-erschafft-die-welt')
    expect(w.find('[data-test="transfer"]').exists()).toBe(false)
  })

  it('a tap skips the transfer (once only)', async () => {
    vi.useFakeTimers()
    h.query = { from: 'shelf' }
    const w = await list()
    await w.find('.cb-card').trigger('click')
    await w.find('[data-test="transfer"]').trigger('click')
    expect(h.replace).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(3000)
    expect(h.replace).toHaveBeenCalledTimes(1)
  })

  it('a book that already stood on the shelf stays there (once) and the words say so', async () => {
    h.query = { from: 'shelf' }
    vi.resetModules()
    const shelf = await shelfModule()
    shelf.add('ba-02-gott-erschafft-die-welt')
    const w = await list(false)
    await w.find('.cb-card').trigger('click')
    expect(shelf.ids.value.filter((i) => i === 'ba-02-gott-erschafft-die-welt')).toHaveLength(1)
    expect(w.find('[data-test="transfer"]').text()).toContain('liegt schon im Malregal')
  })

  it('a book that is NOT mine opens the book view with the way to buy it, as before', async () => {
    h.query = { from: 'shelf' }
    const w = await list()
    await w.findAll('.own-chip').find((c) => c.text().includes('Alle'))!.trigger('click')
    const noah = w.findAll('.cb-card').find((c) => c.attributes('aria-label')!.includes('Noah'))!
    await noah.trigger('click')
    expect(h.push).toHaveBeenCalledWith({ name: 'app-coloring-book', params: { bookId: 'm2' } })
    expect(w.find('[data-test="transfer"]').exists()).toBe(false)
    expect((await shelfModule()).has('m2')).toBe(false)
  })

  it('the way back leads to the painting program', () => {
    const src = readFileSync('src/views/app/AppColoringBooksView.vue', 'utf8')
    expect(src).toContain("fromPainting = computed(() => route.query.from === 'malen' || fromShelf.value)")
  })
})

describe('the list reached any other way (Lesen -> Malbücher) stays as before', () => {
  it('shows all books with the chip "Alle", and a tap opens the book', async () => {
    const w = await list()
    expect(names(w)).toHaveLength(4)
    expect(w.find('.own-chip.is-on').text()).toContain('Alle')
    await w.find('.cb-card').trigger('click')
    expect(h.push).toHaveBeenCalledWith({ name: 'app-coloring-book', params: { bookId: 'ba-02-gott-erschafft-die-welt' } })
    expect(w.find('[data-test="transfer"]').exists()).toBe(false)
    expect((await shelfModule()).has('ba-02-gott-erschafft-die-welt')).toBe(false)
  })
})

describe('the transfer', () => {
  it('is calm for people who ask for less motion, and plays no sound', () => {
    const src = readFileSync('src/components/molecules/ColoringTransfer.vue', 'utf8')
    expect(src).toMatch(/prefers-reduced-motion: reduce[\s\S]*animation: none/)
    expect(src).not.toMatch(/useSfx|Audio\(/)
  })
})

describe('the painting program after the transfer', () => {
  async function menu(books: Array<{ bookId: string; title: string }>, fresh = '') {
    vi.resetModules()
    if (fresh) (await shelfModule()).markFresh(fresh)
    const { default: Menu } = await import('@/components/molecules/ColoringMenu.vue')
    const card = (b: { bookId: string; title: string }) => ({ bookId: b.bookId, title: b.title, cover: 'https://x/c.webp', total: 30, done: 0, updatedAt: 0 })
    const w = mount(Menu, {
      props: { books: books.map(card), works: [], groups: [], exhibitionWorks: [], rewards: [], backupBusy: false, backupMessage: '' },
      global: { plugins: [i18n], stubs: { ArtworkViewer: true } },
      attachTo: document.body
    })
    await flushPromises()
    return w
  }

  it('lifts the book that just arrived once, and no other', async () => {
    const w = await menu([{ bookId: 'a', title: 'A' }, { bookId: 'b', title: 'B' }], 'b')
    expect(w.findAll('.ac-bigbook-wrap').map((x) => x.classes().includes('is-lifted'))).toEqual([false, true])
    // the mark is used up: another visit does not lift it again
    expect((await shelfModule()).fresh.value).toBe('')
  })

  it('lifts nothing when no book just arrived', async () => {
    const w = await menu([{ bookId: 'a', title: 'A' }])
    expect(w.find('.is-lifted').exists()).toBe(false)
  })

  it('the lift ends by itself (no lasting glow)', async () => {
    vi.useFakeTimers()
    const w = await menu([{ bookId: 'a', title: 'A' }], 'a')
    expect(w.find('.is-lifted').exists()).toBe(true)
    vi.advanceTimersByTime(3000)
    await nextTick()
    expect(w.find('.is-lifted').exists()).toBe(false)
  })

  it('a tap on the book on the shelf asks to open it (the book view), it does not paint', async () => {
    const w = await menu([{ bookId: 'a', title: 'A' }])
    await w.find('.ac-bigbook').trigger('click')
    expect(w.emitted('open-book')![0]![0]).toMatchObject({ bookId: 'a' })
  })

  it('the big door and the button to all books say so (they lead to the list)', async () => {
    const w = await menu([])
    await w.find('.ac-door').trigger('click')
    expect(w.emitted('to-books')).toHaveLength(1)
  })

  it('the heading stands in the middle', () => {
    const src = readFileSync('src/components/molecules/ColoringMenu.vue', 'utf8')
    expect(src).toMatch(/\.ac-head\r?\n[\s\S]*?align-items: center\r?\n[\s\S]*?text-align: center/)
  })
})

describe('the book view', () => {
  it('shows the whole name of the book over two lines (not cut off after one) and a friendly note when the store has no such book', () => {
    const src = readFileSync('src/views/app/AppColoringBookView.vue', 'utf8')
    expect(src).toMatch(/\.bk-title[\s\S]*?-webkit-line-clamp: 2/)
    expect(src).not.toMatch(/\.bk-title[\s\S]{0,200}white-space: nowrap/)
    expect(src).toContain('data-test="book-status"')
    // the head shows the name of the book without the long series start
    expect(src).toContain('shortColoringTitle(title.value)')
  })
})
