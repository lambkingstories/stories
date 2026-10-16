/**
 * Coloring pages that ship inside the app, so the coloring screen is never
 * empty (works offline, no admin upload needed). Line art in
 * `public/images/ausmalbilder/`, black on white with crisp edges so the paint
 * bucket stops at the lines. Add a page: drop the PNG there and list it here.
 */
export interface BuiltinColoringPage {
  id: string
  /** Path below `public/`, passed through `prependBaseUrl` by the caller. */
  file: string
}

export const BUILTIN_COLORING_PAGES: BuiltinColoringPage[] = [
  { id: 'lamm-krone-bibel', file: 'images/ausmalbilder/lamm-krone-bibel.png' },
  { id: 'zachaeus', file: 'images/ausmalbilder/zachaeus.png' },
  { id: 'schoepfung', file: 'images/ausmalbilder/schoepfung.png' },
  { id: 'brot-und-fische', file: 'images/ausmalbilder/brot-und-fische.png' }
]
