/**
 * Feedback of 21.11.2026 (a tester with the app in English): German books are not hidden but carry a small flag on the cover; the end of a story has less text and no
 * operating-system emoji, its "new" sign follows the language; the bookmark shows when it is saved; the status bar does not run over the page.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { describe, expect, it } from 'vitest'
import messages from '@/i18n/app'
import BookLangFlag from '@/components/atoms/BookLangFlag.vue'
import { bookFlagLanguage } from '@/utils/bookLanguage'

const read = (p: string) => readFileSync(resolve(process.cwd(), 'src', p), 'utf8')
const germanOnly = { localizations: { de: { title: 'Noah' } }, previewImage: { de: 'noah-de.webp' } }
const both = { localizations: { de: { title: 'Noah' }, en: { title: 'Noah' } }, previewImage: { de: 'noah-de.webp', en: 'noah-en.webp' } }
const englishTextGermanCover = { localizations: { de: { title: 'Noah' }, en: { title: 'Noah' } }, previewImage: { de: 'noah-de.webp' } }

describe('which flag a book gets', () => {
  it('a German-only book in the English app carries the German flag', () => {
    expect(bookFlagLanguage(germanOnly, 'en')).toBe('de')
    expect(bookFlagLanguage(germanOnly, 'es')).toBe('de')
  })
  it('a book with English texts and an English cover carries no flag', () => {
    expect(bookFlagLanguage(both, 'en')).toBeNull()
  })
  it('English texts but only a German cover: the cover is German, so the flag is shown', () => {
    expect(bookFlagLanguage(englishTextGermanCover, 'en')).toBe('de')
  })
  it('in the German app a German book has no flag', () => {
    expect(bookFlagLanguage(germanOnly, 'de')).toBeNull()
    expect(bookFlagLanguage(both, 'de')).toBeNull()
  })
  it('an English-only book in the German app carries the flag of English', () => {
    expect(bookFlagLanguage({ localizations: { en: { title: 'Noah' } } }, 'de')).toBe('en')
  })
  it('no book, no flag', () => {
    expect(bookFlagLanguage(null, 'en')).toBeNull()
  })
})

describe('the flag on the cover', () => {
  const mountFlag = (props: Record<string, unknown>, locale: 'de' | 'en') =>
    mount(BookLangFlag, { props, global: { plugins: [createI18n({ legacy: false, locale, fallbackLocale: 'de', messages: messages as never })] } })

  it('shows up with a text for screen readers when the book is German in the English app', () => {
    const w = mountFlag({ book: germanOnly }, 'en')
    expect(w.find('[data-test="book-flag"]').exists()).toBe(true)
    expect(w.find('[data-test="book-flag"]').attributes('aria-label')).toBe('This book is in German')
  })
  it('draws nothing when the book fits the screen', () => {
    expect(mountFlag({ book: both }, 'en').find('[data-test="book-flag"]').exists()).toBe(false)
  })
  it('takes the language directly where the list holds no whole book', () => {
    expect(mountFlag({ language: 'en' }, 'de').find('[data-test="book-flag"]').exists()).toBe(true)
    expect(mountFlag({ language: null }, 'de').find('[data-test="book-flag"]').exists()).toBe(false)
  })
})

describe('the flag is on the covers of the lists', () => {
  it.each([
    ['views/app/AppHomeView.vue', 'BookLangFlag(:book="book")'],
    ['views/app/AppAllNewBooksView.vue', 'BookLangFlag(:book="book")'],
    ['views/app/AppAllBooksView.vue', 'BookLangFlag(:book="book")'],
    ['views/app/AppBookSeriesView.vue', 'BookLangFlag(:book="c.book")'],
    ['views/app/AppBookDetailView.vue', 'BookLangFlag(:book="book")'],
    ['views/app/AppColoringBooksView.vue', 'BookLangFlag(:language="c.flag")'],
    ['components/molecules/ColoringMenu.vue', 'BookLangFlag(:language="b.flag ?? null")']
  ])('%s', (file, line) => {
    expect(read(file)).toContain(line)
  })
})

describe('the end of a story', () => {
  const s = read('views/app/AppReaderView.vue')
  it('has no operating-system emoji and no extra label over the next story', () => {
    expect(s).not.toContain('🎉')
    expect(s).not.toContain("t('app.reader.nextStoryWaiting')")
    expect(s).not.toContain("t('app.reader.askKicker')")
  })
  it('writes the sign of the next story in the language of the app', () => {
    expect(s).not.toContain('badge="NEU"')
    expect(s).toContain(":badge=\"t('app.read.newBadge')\"")
  })
  it('keeps the lamb whole (no pull into the next element)', () => {
    expect(s).not.toContain('margin: 0 auto -10px')
  })
})

describe('the bookmark and the status bar', () => {
  it('the saved bookmark looks different (class and filled icon)', () => {
    const s = read('views/app/AppBookDetailView.vue')
    expect(s).toContain("'save-btn', { 'is-saved'")
    expect(s).toContain('.save-btn.is-saved')
  })
  it('a strip in the colour of the page lies over the place of the status bar', () => {
    const s = read('App.vue')
    expect(s).toMatch(/#app-root::before[\s\S]*height: env\(safe-area-inset-top, 0px\)/)
    expect(s).toContain('pointer-events: none')
  })
})
