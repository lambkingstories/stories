/**
 * Backup of the children's paintings. The paintings live only on the device (see `useArtworks`), so a parent can
 * pack all of them into one ZIP and keep it safe, and put it back on this or another device.
 *
 * The ZIP holds, for people: `bilder/` with every picture as it looks (paint and line art together), and for the
 * app: `sicherung/` with the painted layers and an index. Nothing leaves the device unless the parent shares the file.
 */
import { getArtwork, listArtworks, saveArtwork, type ArtworkMeta } from '@/use/useArtworks'
import { unzip, zip, type ZipEntry } from '@/utils/zipStore'

const INDEX = 'sicherung/index.json'

interface BackupIndex {
  app: 'lambking'
  version: 1
  exportedAt: string
  works: { meta: ArtworkMeta; file: string }[]
}

const safeName = (s: string) => s.replace(/[\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60) || 'Bild'

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = url
  })
}

async function toPng(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'))
  return new Uint8Array(await (blob ?? new Blob()).arrayBuffer())
}

/** The picture as it looks: white paper, the paint, the line art on top. Without the line art (offline) just the paint. */
async function composite(meta: ArtworkMeta, drawing: Blob): Promise<Uint8Array> {
  const bmp = await createImageBitmap(drawing)
  const c = document.createElement('canvas')
  c.width = bmp.width
  c.height = bmp.height
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, c.width, c.height)
  ctx.drawImage(bmp, 0, 0)
  bmp.close?.()
  if (meta.kind === 'page' && meta.sourceType === 'image' && meta.sourceUrl) {
    const line = await loadImage(meta.sourceUrl)
    if (line) {
      ctx.globalCompositeOperation = 'multiply'
      ctx.drawImage(line, 0, 0, c.width, c.height)
    }
  }
  return toPng(c)
}

/** Packs every saved painting into a ZIP. `onProgress` gets (done, total). */
export async function buildBackup(onProgress?: (done: number, total: number) => void): Promise<{ blob: Blob; count: number }> {
  const metas = await listArtworks()
  const files: ZipEntry[] = []
  const index: BackupIndex = { app: 'lambking', version: 1, exportedAt: new Date().toISOString(), works: [] }
  let n = 0
  for (const meta of metas) {
    onProgress?.(n, metas.length)
    const rec = await getArtwork(meta.id)
    if (!rec) continue
    n++
    const key = String(n).padStart(3, '0')
    const layer = new Uint8Array(await rec.drawing.arrayBuffer())
    files.push({ name: `sicherung/${key}.png`, data: layer })
    index.works.push({ meta, file: `sicherung/${key}.png` })
    try {
      files.push({ name: `bilder/${key}-${safeName(meta.title)}.png`, data: await composite(meta, rec.drawing) })
    } catch (err) {
      console.warn('picture for the backup could not be made', err)
    }
  }
  files.push({ name: INDEX, data: new TextEncoder().encode(JSON.stringify(index)) })
  onProgress?.(metas.length, metas.length)
  return { blob: new Blob([zip(files) as BlobPart], { type: 'application/zip' }), count: n }
}

/** Gives the file to the system share sheet when there is one (the apps), otherwise downloads it. */
export async function deliverBackup(blob: Blob, filename: string): Promise<void> {
  const file = new File([blob], filename, { type: 'application/zip' })
  if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'LambKing Bilder' })
      return
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      // sharing did not work: download instead
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/** Puts the paintings of a backup file back. A painting that is newer on this device stays as it is. */
export async function restoreBackup(file: File): Promise<{ restored: number; kept: number }> {
  const entries = await unzip(new Uint8Array(await file.arrayBuffer()))
  const byName = new Map(entries.map((e) => [e.name, e.data]))
  const raw = byName.get(INDEX)
  if (!raw) throw new Error('This is not a LambKing backup.')
  const index = JSON.parse(new TextDecoder().decode(raw)) as BackupIndex
  if (index.app !== 'lambking' || !Array.isArray(index.works)) throw new Error('This is not a LambKing backup.')
  let restored = 0
  let kept = 0
  for (const w of index.works) {
    const data = byName.get(w.file)
    if (!data || !w.meta?.id) continue
    const existing = (await listArtworks()).find((a) => a.id === w.meta.id)
    if (existing && existing.updatedAt >= w.meta.updatedAt) {
      kept++
      continue
    }
    await saveArtwork(w.meta, new Blob([data as BlobPart], { type: 'image/png' }))
    restored++
  }
  return { restored, kept }
}
