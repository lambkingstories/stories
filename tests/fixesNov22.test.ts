/**
 * Things of 22.11.2026: the rewards line of the adventures leads to "My rewards"; English books are English all through (series, title, text, cover) and a book without an
 * English edition is not shown in English; the preview of the history book is gone from the app.
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { storeBookIn, storeBooks, type StoreBook } from '@/data/storeBooks'
import { bookListDestination } from '@/utils/readingAreas'

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
    expect(storeBooks.map((b) => b.id)).toEqual(['der-mann-im-baum-zachaeus', 'eine-nacht-voller-freude'])
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
    expect(s).toContain("['hero-row', { 'is-coloring': toList }]")
    expect(s).toContain('.hero-row.is-coloring')
    expect(s).toContain('data-test="to-book"')
    expect(s).not.toContain('onPaintBook')
    expect(s).not.toContain("t('app.bookDetail.paint')")
  })
})

describe('"To the book" on the page of a new book leads into its area (Anton 22.11.2026)', () => {
  it('a coloring book leads to the coloring books, a printed book to the books, a story to the stories, each with the book that is asked for', () => {
    expect(bookListDestination({ bookId: 'ba-02', kind: 'coloring' })).toEqual({ name: 'app-coloring-books', query: { book: 'ba-02' } })
    expect(bookListDestination({ bookId: 'x', bookSeriesId: 'einzelne-bucher' })).toEqual({ name: 'app-books', query: { book: 'x' } })
    expect(bookListDestination({ bookId: 'story-1', bookSeriesId: 'talheim' })).toEqual({ name: 'app-all-books', query: { book: 'story-1' } })
    // an old coloring book without a kind is known by its category
    expect(bookListDestination({ bookId: 'old', category: 'Ausmalbücher' })).toEqual({ name: 'app-coloring-books', query: { book: 'old' } })
  })
  it('a tap on a book in "New for you" opens its page first (the start page and the list of new books)', () => {
    for (const f of ['views/app/AppHomeView.vue', 'views/app/AppAllNewBooksView.vue']) {
      const s = read(f)
      expect(s, f).toContain("router.push({ name: 'app-book', params: { bookId } })")
      expect(s, f).not.toContain('bookDestination')
    }
  })
  it('the page of a coloring book or a printed book has one button, "To the book", that goes into the area', () => {
    const s = read('views/app/AppBookDetailView.vue')
    expect(s).toContain("const toList = computed(() => isColoring.value || readingAreaOf(book.value) === 'books')")
    expect(s).toContain('data-test="to-book" @click="onToBook"')
    expect(s).toContain('router.push(bookListDestination(book.value))')
    expect(s).not.toContain("query: { read: '1' }")
  })
  it('the three lists mark their cards and bring the asked one into view', () => {
    for (const f of ['views/app/AppBooksView.vue', 'views/app/AppColoringBooksView.vue', 'views/app/AppAllBooksView.vue']) {
      const s = read(f)
      expect(s, f).toContain('useAskedBook()')
      expect(s, f).toContain('data-book-id')
      expect(s, f).toContain('is-asked')
    }
  })
  it('the ring comes once: the sign is taken from the address, and for these lists it is no part of the key of the screen', () => {
    expect(read('use/useAskedBook.ts')).toContain('void router.replace({ query: rest })')
    const app = read('App.vue')
    expect(app).toContain("k === 'book' && ASKED_LISTS.includes(String(name))")
  })
})
