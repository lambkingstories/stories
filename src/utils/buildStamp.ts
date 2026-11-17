/**
 * The "Stand" of the build (date and short commit number), put in by Vite at build time (`__BUILD_STAMP__` in `vite.config.ts`).
 * Where the value does not exist (tests, other build tools) or Git was not available, the text says "Entwicklung" / "development".
 */
declare const __BUILD_STAMP__: { date: string; commit: string } | undefined

export interface BuildStamp {
  /** "17.11." */
  date: string
  /** "4e1f2a3" or "4e1f2a3+" (with changes that were not committed yet); empty without Git */
  commit: string
}

export function buildStamp(): BuildStamp {
  try {
    if (typeof __BUILD_STAMP__ !== 'undefined' && __BUILD_STAMP__) return __BUILD_STAMP__
  } catch {
    /* no stamp */
  }
  return { date: '', commit: '' }
}

/** "Stand 17.11. · 4e1f2a3" (de) / "Build 17.11. · 4e1f2a3" (en); without a commit number "Stand Entwicklung" / "Build development". */
export function buildStampText(stamp: BuildStamp, lang: string): string {
  const en = lang.startsWith('en')
  const word = en ? 'Build' : 'Stand'
  if (!stamp.commit) return `${word} ${en ? 'development' : 'Entwicklung'}`
  return `${word} ${stamp.date} · ${stamp.commit}`
}
