/**
 * The medals of the adventures are big pictures (800 px); the lists and the picture on the adventure page show them small. For every medal
 * there is a small copy next to it (`<name>-klein.webp`, 256 px, a tenth of the size), so that the page does not have to load a megabyte
 * before it looks finished. A medal without a small copy shows the big one (`onThumbError`).
 */
export const medalThumb = (path: string): string => path.replace(/\.webp$/i, '-klein.webp')

/** The small copy is missing: the big picture takes its place (once). */
export function onThumbError(e: Event, original: string): void {
  const img = e.target as HTMLImageElement | null
  if (img && !img.dataset.big) {
    img.dataset.big = '1'
    img.src = original
  }
}
