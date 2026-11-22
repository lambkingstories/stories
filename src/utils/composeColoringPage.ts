/**
 * A coloring page as the child has painted it, in one picture (Anton 22.11.2026: reading a coloring book shows the pages as they were painted). The painting is a layer with
 * transparent spots, the line art lies on top and is multiplied, exactly as the book on the screen shows it (`ColoringSpreadArt`). The result is a picture on a white ground.
 */

/** The longest side of the finished picture (a page of a book does not need more on a phone, and it spares the memory). */
export const COMPOSE_MAX_SIDE = 1400

/** Loads a picture (a blob address of the device, so the canvas stays clean). */
export function loadPicture(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('picture did not load'))
    img.src = src
  })
}

/** The size of the finished picture: the size of the line art, not larger than the limit. */
export function composedSize(width: number, height: number, max = COMPOSE_MAX_SIDE): { w: number; h: number } {
  if (!(width > 0) || !(height > 0)) return { w: 1, h: 1 }
  const k = Math.min(1, max / Math.max(width, height))
  return { w: Math.max(1, Math.round(width * k)), h: Math.max(1, Math.round(height * k)) }
}

/**
 * Puts the painting under the line art. `lineSrc` is the line art, `layer` the painting (a blob of a transparent picture). Gives the address of the new picture (the caller
 * lets it go with `URL.revokeObjectURL`); on any trouble it rejects, and the caller shows the line art alone.
 */
export async function composeColoringPage(lineSrc: string, layer: Blob): Promise<string> {
  const layerUrl = URL.createObjectURL(layer)
  try {
    const [line, paint] = await Promise.all([loadPicture(lineSrc), loadPicture(layerUrl)])
    const { w, h } = composedSize(line.naturalWidth || line.width, line.naturalHeight || line.height)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('no canvas')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    ctx.drawImage(paint, 0, 0, w, h)
    ctx.globalCompositeOperation = 'multiply'
    ctx.drawImage(line, 0, 0, w, h)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9))
    if (!blob) throw new Error('no picture')
    return URL.createObjectURL(blob)
  } finally {
    URL.revokeObjectURL(layerUrl)
  }
}
