/**
 * Things of 22.11.2026: the rewards line of the adventures leads to "My rewards"; English books are English all through (series, title, text, cover) and a book without an
 * English edition is not shown in English; the preview of the history book is gone from the app.
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { storeBookIn, storeBooks, type StoreBook } from '@/data/storeBooks'
import { bookDestination } from '@/utils/readingAreas'

const read = (p: string) => readFileSync(resolve(process.cwd(), 'src', p), 'utf8')

describe('books in English', () => {
  const sample: StoreBook = { ...storeBooks[0]!, coverEn: 'images/buecher/x-en.webp' }

  it('are shown only when they have an English cover and an English title; German is always there', () => {
    expect(storeBookIn(storeBooks[0]!, 'de')).toBe(true)
    expect(storeBookIn({ ...storeBooks[0]!, coverEn: undefined }, 'en')).toBe(false)
    expect(storeBookIn(sample, 'en')).toBe(true)
    expect(storeBookIn({ ...sample, title: { de: 'A', en: '' } }, 'en')).toBe(false)
  })

  it('the picture book has its English series name (not the German one)', () => {
    expect(storeBooks[0]!.series).toBe('Der Mann im Baum')
    expect(storeBooks[0]!.seriesEn).toBe('The Man in the Tree')
  })

  it('the shelf takes series, cover and shape from the English edition in English and says so when there is none', () => {
    const s = read('views/app/AppBooksView.vue')
    expect(s).toContain('storeBooks.filter((b) => storeBookIn(b, lang.value))')
    expect(s).toContain("lang.value === 'en' ? (b.seriesEn ?? b.series) : b.series")
    expect(s).toContain("lang.value === 'en' ? (b.coverEn ?? b.cover) : b.cover")
    expect(s).toContain("t('app.read.booksNoneInLanguage')")
  })
})

describe('the preview of the history book is gone', () => {
  it('"Völker der Bibel" is no longer a book of the app, and its pictures are no longer shipped', () => {
    expect(storeBooks.map((b) => b.id)).toEqual(['der-mann-im-baum-zachaeus'])
    expect(JSON.stringify(storeBooks)).not.toContain('Völker')
    expect(existsSync(resolve(process.cwd(), 'public/images/buecher/voelker-der-bibel'))).toBe(false)
    expect(read('data/bookPages.ts')).not.toContain('voelker')
  })
})

describe('the rewards line of the adventures', () => {
  it('leads to "My rewards"', () => {
    expect(read('views/app/AppAdventureHomeView.vue')).toContain("router-link(:to=\"{ name: 'app-collection' }\" :class=\"['rewards-line'")
  })
})

describe('the slides of the start page', () => {
  it('have their buttons on the same line (the actions are pushed to the foot of the card)', () => {
    const s = read('components/molecules/HomeHero.vue')
    expect(s).toMatch(/\.hero-actions[\s\S]*?margin-top: auto/)
  })
})

describe('arranging the start page and the history (Anton 22.11.2026)', () => {
  it('the sign ?arrange=1 does not make the screen new and plays no screen change', () => {
    const s = read('App.vue')
    expect(s).toContain('component(:is="Component" :key="pageKey(route)")')
    expect(s).toMatch(/router\.beforeEach\(\(to, from\) => \{\s*if \(from\.name && from\.path === to\.path && pageKey\(from\) === pageKey\(to\)\) return true/)
  })
  it('the hint beside the lone tile is a div with words (no pulsing plus, no button)', () => {
    const s = read('components/molecules/HomeTileGrid.vue')
    expect(s).not.toContain('hg-hint-ring')
    expect(s).not.toContain('@keyframes hg-hold')
    expect(s).toContain('@pointerdown="hintDown"')
  })
})

describe('the chips above the lists of books (Anton 22.11.2026)', () => {
  it('are two: "All" and the ones I have; the chip "still to buy" is gone', () => {
    const s = read('components/molecules/OwnFilter.vue')
    expect(s).toContain("const VALUES: OwnFilterValue[] = ['all', 'mine']")
    expect(s).not.toContain("'buy'")
  })
})

describe('"The Man in the Tree – Zacchaeus meets Jesus!" in English (Anton 22.11.2026)', () => {
  it('has its English cover, and so it is an English book', () => {
    const b = storeBooks[0]!
    expect(b.coverEn).toBe('images/buecher/zachaeus-cover-en.webp')
    expect(existsSync(resolve(process.cwd(), 'public', b.coverEn!))).toBe(true)
    expect(storeBookIn(b, 'en')).toBe(true)
  })
  it('has no preview and no digital book in English until the English pages are there (only the store button)', () => {
    const b = storeBooks[0]!
    expect(b.previewEn).toBeUndefined()
    expect(b.digitalEn).toBeUndefined()
    const s = read('views/app/AppBooksView.vue')
    expect(s).toContain("preview: !!(lang.value === 'en' ? b.previewEn : b.preview)?.pages.length")
    expect(s).toContain("digital: !!(lang.value === 'en' ? b.digitalEn : b.digital)")
  })
})

describe('the page of a coloring book that is new (Anton 22.11.2026)', () => {
  const s = read('views/app/AppBookDetailView.vue')
  it('has the cover in the middle, the title under it, and one button "to the book"', () => {
    expect(s).toContain("['hero-row', { 'is-coloring': isColoring }]")
    expect(s).toContain('.hero-row.is-coloring')
    expect(s).toContain('data-test="to-book"')
    expect(s).not.toContain('onPaintBook')
    expect(s).not.toContain("t('app.bookDetail.paint')")
  })
  it('the button opens the book in the reading mode, and the book page does so at once and clears the sign', () => {
    expect(s).toContain("router.push({ name: 'app-coloring-book', params: { bookId: book.value.bookId }, query: { read: '1' } })")
    const v = read('views/app/AppColoringBookView.vue')
    expect(v).toContain("route.query.read === '1'")
    expect(v).toContain('void openReader()')
  })
})

describe('a book of "New for you" opens in its own area (Anton 22.11.2026)', () => {
  it('a coloring book opens on its page in the coloring books, a printed book at its card in the books, a story on its page', () => {
    expect(bookDestination({ bookId: 'ba-02', kind: 'coloring' })).toEqual({ name: 'app-coloring-book', params: { bookId: 'ba-02' } })
    expect(bookDestination({ bookId: 'x', bookSeriesId: 'einzelne-bucher' })).toEqual({ name: 'app-books', query: { book: 'x' } })
    expect(bookDestination({ bookId: 'story-1', bookSeriesId: 'talheim' })).toEqual({ name: 'app-book', params: { bookId: 'story-1' } })
    // an old coloring book without a kind is known by its category
    expect(bookDestination({ bookId: 'old', category: 'Ausmalbücher' })).toEqual({ name: 'app-coloring-book', params: { bookId: 'old' } })
  })
  it('the start page and the list of new books use it', () => {
    expect(read('views/app/AppHomeView.vue')).toContain('bookDestination(allBooks.value.find')
    expect(read('views/app/AppAllNewBooksView.vue')).toContain('bookDestination(allBooks.value.find')
  })
  it('the shelf of books brings the asked card into view', () => {
    const s = read('views/app/AppBooksView.vue')
    expect(s).toContain(':data-book-id="c.id"')
    expect(s).toContain("route?.query?.book")
  })
})
