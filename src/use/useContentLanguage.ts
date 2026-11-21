/**
 * The language of the content (stories, books, coloring books), which a child or a parent can switch on the shelves (Anton 21.11.2026: round flags on top of the shelf; only the
 * books that exist in that language are shown; better than a flag on every cover). By default it is the language of the screen (`contentLocale`); a choice is kept on the device
 * and holds only while the screen has the language it was made in (switch the whole app to another language and the content follows the screen again).
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { contentLocale, type ContentLocale } from '@/utils/contentLocale'

const KEY = 'lk-content-lang-v1'

interface Choice {
  lang: ContentLocale
  ui: string
}

function read(): Choice | null {
  try {
    const c = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Choice | null
    return c && (c.lang === 'de' || c.lang === 'en') && typeof c.ui === 'string' ? c : null
  } catch {
    return null
  }
}

const choice = ref<Choice | null>(read())

/** What is needed of a book to tell the languages it exists in (a book has German always, English when the server holds the English version). */
export interface HasLanguages {
  readonly localizations?: { readonly de?: unknown; readonly en?: unknown }
}

/** True when the book exists in this language. */
export function bookIn(book: HasLanguages | null | undefined, lang: ContentLocale): boolean {
  if (!book) return false
  return lang === 'de' ? !!book.localizations?.de : !!book.localizations?.en
}

/** The languages that a list of books has (German first). Empty list: none. */
export function languagesOf(books: readonly HasLanguages[]): ContentLocale[] {
  const out: ContentLocale[] = []
  if (books.some((b) => bookIn(b, 'de'))) out.push('de')
  if (books.some((b) => bookIn(b, 'en'))) out.push('en')
  return out
}

export default function useContentLanguage() {
  const { locale } = useI18n({ useScope: 'global' })
  /** The language of the content now: the choice (while the screen still has the language of that moment), else the one of the screen. */
  const lang = computed<ContentLocale>(() => (choice.value && choice.value.ui === locale.value ? choice.value.lang : contentLocale(locale.value)))
  function setLang(value: ContentLocale) {
    choice.value = { lang: value, ui: locale.value }
    try {
      localStorage.setItem(KEY, JSON.stringify(choice.value))
    } catch {
      // no storage: the choice only lasts until the app is closed
    }
  }
  /**
   * The language a shelf shows: the content language, or, when the shelf has no book in it, the first language it has (an English shelf of coloring books
   * that does not exist yet shows the German ones instead of nothing).
   */
  function shelfLanguage(books: readonly HasLanguages[]): ContentLocale {
    const have = languagesOf(books)
    return have.length === 0 || have.includes(lang.value) ? lang.value : have[0]!
  }
  return { lang, setLang, shelfLanguage, languagesOf, bookIn }
}
