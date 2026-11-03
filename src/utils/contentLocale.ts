/**
 * The stories, books and adventures exist in German and English. The language of the screens (`de`, `en`, `es`) is wider than that:
 * for the content, German stays German and every other language gets the English texts (so a Spanish screen shows English stories
 * until Spanish ones exist).
 */
export type ContentLocale = 'de' | 'en'

export function contentLocale(locale: string | undefined | null): ContentLocale {
  return locale === 'de' || locale === undefined || locale === null || locale === '' ? 'de' : locale === 'en' || locale === 'es' ? 'en' : 'de'
}
