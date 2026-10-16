/**
 * Makes a picture of a coloring page small before it is uploaded: line art needs neither colour nor more than about 1400 pixels
 * of width (the coloring screen never uses more). The result is a grey WebP, about a third of the size of the PNG. This happens
 * in the browser of the person who uploads, so the server does no image work.
 */
export const MAX_COLORING_WIDTH = 1400

export async function optimizeColoringImage(file: File, maxWidth = MAX_COLORING_WIDTH): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') return file
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return file
  }
  const scale = Math.min(1, maxWidth / bitmap.width)
  const w = Math.max(1, Math.round(bitmap.width * scale))
  const h = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close?.()
  // to grey (the canvas filter "grayscale" is not available everywhere)
  const img = ctx.getImageData(0, 0, w, h)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    const g = (d[i]! * 299 + d[i + 1]! * 587 + d[i + 2]! * 114) / 1000
    d[i] = d[i + 1] = d[i + 2] = g
  }
  ctx.putImageData(img, 0, 0)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.7))
  // a browser that cannot write WebP hands back a PNG: keep the original then
  if (!blob || blob.type !== 'image/webp' || blob.size >= file.size) return file
  return new File([blob], file.name.replace(/\.[a-z0-9]+$/i, '') + '.webp', { type: 'image/webp' })
}
