/**
 * Small versions of the pictures that come from the book server (covers, series pictures): `…/uploads/previews/abc.jpg` becomes
 * `…/uploads/previews/abc.jpg?w=320`, and a server that knows the parameter answers a small WebP (320 pixels wide, about 30 KB instead of
 * up to 1.2 MB). A server that does not know it (the old one) ignores the parameter and sends the original, so nothing breaks.
 * The widths are the ones the server makes (server/src/middleware/thumbnail.ts).
 */
export const SIZED_WIDTHS = [160, 240, 320, 480, 720, 960] as const

/** True for a picture of the book server (the folder `uploads`) that may get a width. */
function isServerPicture(url: string): boolean {
  return /^https?:\/\/[^/]+\/uploads\//i.test(url) && !url.includes('?') && /\.(jpe?g|png|webp)$/i.test(url)
}

/** The smallest offered width that still looks sharp on this screen (`cssWidth` in CSS pixels; the pixel density counts up to 3). */
export function widthFor(cssWidth: number, density = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1): number {
  const need = cssWidth * Math.min(Math.max(density, 1), 3)
  return SIZED_WIDTHS.find((w) => w >= need) ?? SIZED_WIDTHS[SIZED_WIDTHS.length - 1]!
}

/** The URL of a picture of the book server in a size for `cssWidth`; every other URL (a file of the app, a blob, empty) stays as it is. */
export function sizedImage(url: string | undefined | null, cssWidth: number): string {
  if (!url) return url ?? ''
  if (!isServerPicture(url)) return url
  return `${url}?w=${widthFor(cssWidth)}`
}
