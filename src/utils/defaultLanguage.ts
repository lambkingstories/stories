/**
 * The language the app starts in before the user has picked one.
 *
 * The website stays German-first (its audience). The native apps follow the
 * device: German devices get German, everything else English — an English
 * iPad otherwise opened a German app, and App Review could not find the
 * "Support us" tip it was told to look for. On iOS `navigator.language` is
 * the bundle localization iOS chose (de.lproj or the English base), so it is
 * always one of the two. Spanish devices get Spanish as soon as it is offered again (`SPANISH_ENABLED`), until then English.
 */
import { offeredLanguage } from '@/utils/languages'

export function defaultLanguage(): 'de' | 'en' | 'es' {
  if (import.meta.env.VITE_APP_NATIVE !== 'true') return 'de'
  const lang = typeof navigator !== 'undefined' ? navigator.language || '' : ''
  const code = lang.toLowerCase()
  return offeredLanguage(code.startsWith('de') ? 'de' : code.startsWith('es') ? 'es' : 'en')
}
