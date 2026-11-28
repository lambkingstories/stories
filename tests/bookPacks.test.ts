/**
 * Android: the whole digital books (pages and PDF) lie in their own Play pack, so that the program file stays small. One list (src/data/bookMedia.json) is used
 * by the build, the media server and the app; it must match the books of the app.
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import bookMedia from '../src/data/bookMedia.json'
import { digitalBooks } from '../src/data/storeBooks'
import { splitMediaFiles } from '../vite.config.media'

const root = resolve(__dirname, '..')
const text = (f: string) => readFileSync(resolve(root, f), 'utf8')

describe('the list of the book files', () => {
  it('has every digital book of the app, with its folder of pages and its PDF', () => {
    expect(bookMedia.map((b) => b.id).sort()).toEqual(digitalBooks().map((b) => b.id).sort())
    for (const book of digitalBooks()) {
      const entry = bookMedia.find((b) => b.id === book.id)!
      expect(entry.pdf).toBe(book.digital!.pdf)
      for (const page of book.digital!.pages) expect(page.src.startsWith(`${entry.folder}/`), page.src).toBe(true)
      expect(existsSync(resolve(root, 'public', entry.pdf)), entry.pdf).toBe(true)
      expect(existsSync(resolve(root, 'public', book.digital!.pages[0]!.src))).toBe(true)
      // cover and sample pages are shown before the purchase: they stay in the program
      for (const shown of [book.cover, ...(book.preview?.pages ?? []).map((p) => p.src)]) expect(shown.startsWith(`${entry.folder}/`)).toBe(false)
    }
  })
})

describe('taking the books out of the build', () => {
  it('moves the pages and the PDF, and leaves the cover', () => {
    const base = mkdtempSync(join(tmpdir(), 'lk-books-'))
    const out = join(base, 'dist')
    const put = (f: string) => {
      mkdirSync(join(out, f, '..'), { recursive: true })
      writeFileSync(join(out, f), 'x')
    }
    put('images/buecher/b-voll/seite-01.webp')
    put('images/buecher/b-cover.webp')
    put('downloads/b.pdf')
    splitMediaFiles(out, base, [], false, [{ folder: 'images/buecher/b-voll', pdf: 'downloads/b.pdf' }])
    expect(existsSync(join(base, 'dist-media/images/buecher/b-voll/seite-01.webp'))).toBe(true)
    expect(existsSync(join(base, 'dist-media/downloads/b.pdf'))).toBe(true)
    expect(existsSync(join(out, 'downloads/b.pdf'))).toBe(false)
    expect(existsSync(join(out, 'images/buecher/b-cover.webp'))).toBe(true)
  })
})

describe('the app and the media server', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  async function load(env: Record<string, string>) {
    vi.resetModules()
    for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v)
    return import('@/utils/mediaSplit')
  }
  const page = 'images/buecher/nacht-voll-r8m4/seite-01.webp'
  const pdf = 'downloads/Eine-Nacht-voller-Freude-r8m4.pdf'

  it('looks for the book files outside the program only where the build took them out', async () => {
    const on = await load({ VITE_MEDIA_SPLIT: '*', VITE_MEDIA_SPLIT_BOOKS: 'true' })
    expect(on.isSplitPath(page)).toBe(true)
    expect(on.isSplitPath(pdf)).toBe(true)
    expect(on.isSplitPath('images/buecher/nacht-cover.webp')).toBe(false)
    // the iOS build splits the adventures only
    const ios = await load({ VITE_MEDIA_SPLIT: '*', VITE_MEDIA_SPLIT_BOOKS: '' })
    expect(ios.isSplitPath(page)).toBe(false)
    expect(ios.isSplitPath(pdf)).toBe(false)
  })

  it('names the packs as Google Play allows, and waits for nothing outside Android', async () => {
    const m = await load({ VITE_MEDIA_SPLIT: '*', VITE_MEDIA_SPLIT_BOOKS: 'true' })
    for (const b of bookMedia) expect(m.bookPackNameOf(b.id)).toMatch(/^[a-zA-Z][a-zA-Z0-9_]*$/)
    expect(m.bookNeedsPack('eine-nacht-voller-freude')).toBe(false)
    expect(await m.ensureBookPack('eine-nacht-voller-freude')).toBe(true)
  })

  it('the pack script and the media server know the books; only the Android pack build splits them', () => {
    expect(text('scripts/patch-android-assetpack.mjs')).toContain('src/data/bookMedia.json')
    expect(text('scripts/patch-android-assetpack.mjs')).toContain('__BOOKS__')
    expect(text('scripts/android-pack/LkMedia.kt')).toContain('mapOf(__BOOKS__)')
    expect(text('.github/workflows/android-pack-build.yml')).toContain('VITE_MEDIA_SPLIT_BOOKS: "true"')
    expect(text('.github/workflows/ios-build.yml')).not.toContain('VITE_MEDIA_SPLIT_BOOKS')
  })

  it('the loading screen lies above the book reader', () => {
    expect(text('src/components/molecules/MediaPackGate.vue')).toContain('z-index: 9600')
    expect(text('src/views/app/AppBookPreviewView.vue')).toContain('BookFlip(v-if="!waitsForPack"')
  })
})
