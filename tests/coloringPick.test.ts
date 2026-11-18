/**
 * The new way into the painting area (Anton, 18.11.2026): "Malen" first asks "Such dir ein Malbuch aus" (only the books the child has), a tap on a
 * book does not start painting but puts the book on the shelf of the painting program (the short transfer, which a tap skips), the painting program then
 * shows the book on its shelf, lifted once, and a tap on it opens the book. The ways back run choice <- painting program <- book.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, reactive } from 'vue'
import messages from '@/i18n/app'
import { routeToNav } from '@/use/useAppNav'

const h = vi.hoisted(() => ({
  state: null as unknown as { all: unknown[] | null; listReady: boolean; listFailed: boolean; listLoading: boolean },
  loadAllBooks: vi.fn(async () => [] as unknown[]),
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  works: [] as unknown[],
  plus: false,
  bought: [] as string[]
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: {}, query: {}, name: 'x' }),
  useRouter: () => ({ push: h.push, back: h.back, replace: h.replace, resolve: (to: { name: string }) => ({ path: '/' + to.name }) })
}))
vi.mock('@/use/useApiBooks', () => ({ default: () => ({ state: h.state, loadAllBooks: h.loadAllBooks }) }))
vi.mock('@/use/useArtworks', async (orig) => ({ ...(await orig<typeof import('@/use/useArtworks')>()), listArtworks: async () => h.works }))
vi.mock('@/components/molecules/AppHeader.vue', () => ({ default: { name: 'AppHeader', template: '<header />' } }))
vi.mock('@/components/molecules/LkPageHead.vue', () => ({ default: { name: 'LkPageHead', template: '<header />' } }))
vi.mock('@/components/atoms/LkCompanion.vue', () => ({ default: { name: 'LkCompanion', template: '<span />' } }))
vi.mock('@/utils/readingAreas', () => ({ booksOfArea: (books: unknown[]) => books }))
// the teaser is on (the books are for sale): the free books and the ones bought or opened by Plus belong to the child, the rest does not
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
// the two free books (Band 1 of each series) and two that are for sale
const BOOKS = [
  book('ba-02-gott-erschafft-die-welt', 'Mit Buntstift durch die Bibel: Gott erschafft die Welt (Band 1)', 'ab 5 Jahren', '2026-10-01'),
  book('m2', 'Mit Buntstift durch die Bibel: Noah, die Arche und der Regenbogen (Band 2)', 'ab 5 Jahren', '2026-10-10'),
  book('ba-11-schoepfung-gott-macht-die-welt', 'Bibelgeschichten zum Ausmalen: Band 1 - Die Schöpfung - Gott macht die Welt', 'ab 9 Jahren', '2026-09-01'),
  book('b10', 'Bibelgeschichten zum Ausmalen: Band 10 - Ostern - Jesus lebt!', 'ab 9 Jahren', '2026-09-04')
]

beforeEach(() => {
  localStorage.clear()
  h.state = reactive({ all: BOOKS, listReady: true, listFailed: false, listLoading: false })
  h.works = []
  h.plus = false
  h.bought = []
  h.push.mockClear()
  h.replace.mockClear()
  h.back.mockClear()
  h.loadAllBooks.mockClear()
  vi.spyOn(console, 'warn').mockImplementation(() => undefined)
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

async function pick() {
  vi.resetModules()
  const { default: View } = await import('@/views/app/AppColoringPickView.vue')
  const w = mount(View, { global: { plugins: [i18n] }, attachTo: document.body })
  await flushPromises()
  return w
}
const shelfModule = async () => (await import('@/use/useColoringShelf')).default()

describe('the way into the painting area', () => {
  it('"Malen" belongs to the tab Malen: the choice page, the painting program, the book and the list', () => {
    for (const name of ['app-coloring-pick', 'app-coloring', 'app-coloring-book', 'app-coloring-books']) expect(routeToNav(name)).toBe('malen')
  })

  it('the tab "Malen" leads to the choice page, not to the painting program', async () => {
    vi.resetModules()
    vi.doMock('vue-router', () => ({
      useRoute: () => ({ name: 'app-main' }),
      useRouter: () => ({ push: h.push })
    }))
    const { default: useAppNav } = await import('@/use/useAppNav')
    const nav = useAppNav(((k: string) => k) as never)
    nav.onNav('malen')
    expect(h.push).toHaveBeenCalledWith({ name: 'app-coloring-pick' })
  })

  it('the start page card "Malen" (nothing painted yet) leads to the choice page, a painted picture still opens straight', async () => {
    const src = (await import('node:fs')).readFileSync('src/views/app/AppHomeView.vue', 'utf8')
    expect(src).toContain("{ name: 'app-coloring-pick' }")
    expect(src).toContain("{ name: 'app-coloring', query: { work: work.id } }")
  })
})

describe('"Such dir ein Malbuch aus"', () => {
  it('shows only the books the child has: the free ones (no book still to buy)', async () => {
    const w = await pick()
    const ids = w.findAll('[data-test="pick-book"]').map((b) => b.attributes('data-book'))
    expect(ids).toEqual(['ba-02-gott-erschafft-die-welt', 'ba-11-schoepfung-gott-macht-die-welt'])
    expect(w.text()).not.toContain('Ostern')
    expect(w.text()).not.toContain('Noah')
  })

  it('adds a book that was bought, and every book with Plus', async () => {
    h.bought = ['b10']
    let w = await pick()
    expect(w.findAll('[data-test="pick-book"]').map((b) => b.attributes('data-book'))).toContain('b10')
    expect(w.findAll('[data-test="pick-book"]').map((b) => b.attributes('data-book'))).not.toContain('m2')
    w.unmount()
    h.bought = []
    h.plus = true
    w = await pick()
    expect(w.findAll('[data-test="pick-book"]')).toHaveLength(4)
  })

  it('has the two age groups, "Ab 5 Jahren" first, and the name of the book without the long start', async () => {
    const w = await pick()
    expect(w.findAll('[data-test="pick-section"]').map((s) => s.find('.cp-sec-title').text())).toEqual(['Ab 5 Jahren', 'Ab 9 Jahren'])
    expect(w.findAll('.cp-name').map((n) => n.text())).toEqual(['Gott erschafft die Welt', 'Die Schöpfung - Gott macht die Welt'])
  })

  it('has the button "Zur Mal-App" (at least 48 px) that opens the painting program, and the quiet link to all books', async () => {
    const w = await pick()
    const toApp = w.find('[data-test="pick-to-app"]')
    expect(toApp.text()).toContain('Zur Mal-App')
    await toApp.trigger('click')
    expect(h.push).toHaveBeenCalledWith({ name: 'app-coloring' })
    await w.find('[data-test="pick-more"]').trigger('click')
    expect(h.push).toHaveBeenCalledWith({ name: 'app-coloring-books', query: { from: 'pick' } })
    expect(w.find('[data-test="pick-more"]').text()).toContain('Weitere Malbücher entdecken')
  })

  it('shows "Weitermalen" with the picture painted last, and it opens that picture', async () => {
    h.works = [
      { id: 'old', title: 'Altes Bild', thumb: 'data:x', updatedAt: 1, done: false, w: 1200, h: 1600 },
      { id: 'new', title: 'Neues Bild', thumb: 'data:x', updatedAt: 9, done: false, w: 1200, h: 1600 }
    ]
    const w = await pick()
    const card = w.find('[data-test="pick-continue"]')
    expect(card.text()).toContain('Weitermalen')
    expect(card.text()).toContain('Neues Bild')
    await card.trigger('click')
    expect(h.push).toHaveBeenCalledWith({ name: 'app-coloring', query: { work: 'new' } })
  })

  it('has no "Weitermalen" card before anything was painted', async () => {
    const w = await pick()
    expect(w.find('[data-test="pick-continue"]').exists()).toBe(false)
  })

  it('without any book of the child it shows the friendly note, the way to the books and to the painting program', async () => {
    h.state.all = [BOOKS[1]!, BOOKS[3]!]
    const w = await pick()
    expect(w.find('[data-test="pick-empty"]').exists()).toBe(true)
    expect(w.findAll('[data-test="pick-book"]')).toHaveLength(0)
    expect(w.find('[data-test="pick-to-app"]').exists()).toBe(true)
    expect(w.find('[data-test="pick-more"]').exists()).toBe(true)
  })
})

describe('the transfer', () => {
  it('a tap on a book does not paint: it puts the book on the shelf and shows the transfer', async () => {
    const w = await pick()
    const shelf = await shelfModule()
    expect(shelf.has('ba-02-gott-erschafft-die-welt')).toBe(false)
    await w.find('[data-book="ba-02-gott-erschafft-die-welt"]').trigger('click')
    expect(shelf.has('ba-02-gott-erschafft-die-welt')).toBe(true)
    expect(w.find('[data-test="transfer"]').exists()).toBe(true)
    expect(w.find('[data-test="transfer"]').text()).toContain('Dein Malbuch kommt in die Mal-App')
    // nothing was opened yet, no painting
    expect(h.push).not.toHaveBeenCalled()
  })

  it('after about 1.5 seconds the painting program opens, and the book is marked to be lifted once', async () => {
    vi.useFakeTimers()
    const w = await pick()
    await w.find('[data-book="ba-02-gott-erschafft-die-welt"]').trigger('click')
    vi.advanceTimersByTime(1400)
    expect(h.push).not.toHaveBeenCalled()
    vi.advanceTimersByTime(200)
    await nextTick()
    expect(h.push).toHaveBeenCalledTimes(1)
    expect(h.push).toHaveBeenCalledWith({ name: 'app-coloring' })
    const shelf = await shelfModule()
    expect(shelf.fresh.value).toBe('ba-02-gott-erschafft-die-welt')
    expect(w.find('[data-test="transfer"]').exists()).toBe(false)
  })

  it('a tap skips the transfer (once only)', async () => {
    vi.useFakeTimers()
    const w = await pick()
    await w.find('[data-book="ba-11-schoepfung-gott-macht-die-welt"]').trigger('click')
    await w.find('[data-test="transfer"]').trigger('click')
    expect(h.push).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(3000)
    expect(h.push).toHaveBeenCalledTimes(1)
  })

  it('a book that already stood on the shelf stays there (once) and the words say that it is waiting', async () => {
    const shelf = await shelfModule()
    shelf.add('ba-02-gott-erschafft-die-welt')
    const w = await pick()
    await w.find('[data-book="ba-02-gott-erschafft-die-welt"]').trigger('click')
    expect(shelf.ids.value.filter((i) => i === 'ba-02-gott-erschafft-die-welt')).toHaveLength(1)
    expect(w.find('[data-test="transfer"]').text()).toContain('wartet schon in der Mal-App')
  })

  it('a device that painted before keeps the books it painted in on the shelf when a book is added', async () => {
    h.works = [{ id: 'src:https://x/1.webp#1', title: 'Bild', thumb: 'data:x', updatedAt: 1, done: false, w: 1200, h: 1600 }]
    vi.resetModules()
    const w = await pick()
    const shelf = await shelfModule()
    await w.find('[data-book="ba-11-schoepfung-gott-macht-die-welt"]').trigger('click')
    expect(shelf.has('ba-11-schoepfung-gott-macht-die-welt')).toBe(true)
  })

  it('the cover stays calm for people who ask for less motion (no moving rules left without the motion media query)', async () => {
    const src = (await import('node:fs')).readFileSync('src/components/molecules/ColoringTransfer.vue', 'utf8')
    expect(src).toMatch(/prefers-reduced-motion: reduce[\s\S]*animation: none/)
    // and it plays no sound
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
    const wraps = w.findAll('.ac-bigbook-wrap')
    expect(wraps.map((x) => x.classes().includes('is-lifted'))).toEqual([false, true])
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
    expect(w.emitted('open-book')).toHaveLength(1)
    expect(w.emitted('open-book')![0]![0]).toMatchObject({ bookId: 'a' })
  })

  it('has a back button (48 px) to the choice of a book', async () => {
    const w = await menu([{ bookId: 'a', title: 'A' }])
    const back = w.find('[data-test="menu-back"]')
    expect(back.text()).toContain('Buch aussuchen')
    await back.trigger('click')
    expect(w.emitted('back')).toHaveLength(1)
  })
})

describe('the ways back', () => {
  it('the painting program takes the way back to the choice page, the list of books from the choice page too', async () => {
    const view = (await import('node:fs')).readFileSync('src/views/app/AppColoringView.vue', 'utf8')
    expect(view).toContain("@back=\"goBackTo(router, { name: 'app-coloring-pick' })\"")
    const list = (await import('node:fs')).readFileSync('src/views/app/AppColoringBooksView.vue', 'utf8')
    expect(list).toContain("fromPick.value ? 'app-coloring-pick'")
  })

  it('the book view goes back to the painting program (the step it came from)', async () => {
    const view = (await import('node:fs')).readFileSync('src/views/app/AppColoringBookView.vue', 'utf8')
    expect(view).toContain("goBackTo(router, { name: 'app-coloring' })")
  })

  it('the choice page is a tab page (the tab bar stays) and the painting program lies one step deeper', async () => {
    const app = (await import('node:fs')).readFileSync('src/App.vue', 'utf8')
    expect(app).toMatch(/'app-coloring-pick': 0, 'app-coloring': 1/)
    expect(app).toMatch(/NAV_ROUTES[\s\S]*'app-coloring-pick'/)
  })
})
