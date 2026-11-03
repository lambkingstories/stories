/**
 * The languages the app offers. German and English are complete (screens, stories, adventures, recordings); Spanish is complete for the
 * screens only, so it is switched off for now: it is not offered in the language buttons, a device in Spanish starts in English, and a
 * saved choice of Spanish is read as English. To offer it again, set `SPANISH_ENABLED` to `true`.
 */
export const SPANISH_ENABLED = false

/** The language to use for a code that was saved or detected: Spanish becomes English while it is switched off. */
export function offeredLanguage<T extends string>(code: T): T | 'en' {
  return !SPANISH_ENABLED && code === 'es' ? 'en' : code
}
