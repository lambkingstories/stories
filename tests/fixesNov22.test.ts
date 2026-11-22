/**
 * Things of 22.11.2026: the rewards line of the adventures leads to "My rewards"; English books are English all through (series, title, text, cover) and a book without an
 * English edition is not shown in English; the preview of the history book is gone from the app.
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { storeBookIn, storeBooks, type StoreBook } from '@/data/storeBooks'

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
    expect(storeBooks[0]!.seriesEn).toBe('Little Bible Stories')
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
