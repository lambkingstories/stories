import { mkdirSync, mkdtempSync, rmSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mediaDirsOf, splitMediaFiles } from '../vite.config.media'

/**
 * Media outside the program file (iOS, proven on a real iPad on 24.11.2026; see src/utils/mediaSplit.ts and vite.config.media.ts).
 */
describe('media outside the program file', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
    vi.doUnmock('@tauri-apps/api/path')
    vi.doUnmock('@tauri-apps/api/core')
    delete (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__
  })

  async function load(env: Record<string, string> = {}) {
    vi.resetModules()
    for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v)
    const split = await import('@/utils/mediaSplit')
    const fn = await import('@/utils/function')
    return { ...split, prependBaseUrl: fn.prependBaseUrl }
  }

  it('changes nothing in a normal build', async () => {
    const m = await load()
    expect(m.MEDIA_SPLIT_ON).toBe(false)
    expect(m.MEDIA_TEST_LINK).toBe(false)
    expect(m.isSplitPath('images/abenteuer/elia/x.webp')).toBe(false)
    await m.initMediaSplit()
    expect(m.prependBaseUrl('images/abenteuer/elia/x.webp')).toBe('/images/abenteuer/elia/x.webp')
  })

  it('knows which paths belong to the named adventure (pictures, pictures of its games, sounds) and no others', async () => {
    const m = await load({ VITE_MEDIA_SPLIT: 'elia' })
    expect(m.isSplitPath('images/abenteuer/elia/etappe-bild-01.webp')).toBe(true)
    expect(m.isSplitPath('images/abenteuer/spiele/elia/regen/a.webp')).toBe(true)
    expect(m.isSplitPath('audio/abenteuer/elia/geschichte-01-v1.mp3')).toBe(true)
    // another adventure with a similar name, the shared signs and the big games stay where they are
    expect(m.isSplitPath('images/abenteuer/elisa/x.webp')).toBe(false)
    expect(m.isSplitPath('images/abenteuer/elia-lauf/x.webp')).toBe(false)
    expect(m.isSplitPath('images/abenteuer/ui/coin.webp')).toBe(false)
    expect(m.isSplitPath('images/spiele-gross/elia/kachel.webp')).toBe(false)
    expect(m.isSplitPath('audio/abenteuer/musik-karte.mp3')).toBe(false)
  })

  it('with * every adventure is split, except the signs of the adventure screens and the loose sound effects', async () => {
    const m = await load({ VITE_MEDIA_SPLIT: '*' })
    expect(m.MEDIA_SPLIT_ON).toBe(true)
    for (const p of [
      'images/abenteuer/david/etappe-bild-01.webp',
      'images/abenteuer/spiele/sortieren/a.webp',
      'images/abenteuer/josef/karte.webp',
      'audio/abenteuer/noah/geschichte-01.mp3'
    ])
      expect(m.isSplitPath(p)).toBe(true)
    for (const p of [
      'images/abenteuer/ui/coin.webp',
      'audio/abenteuer/klang-richtig.mp3',
      'audio/abenteuer/musik-karte.mp3',
      'images/spiele-gross/david/kachel.webp',
      'images/buecher/x.webp'
    ])
      expect(m.isSplitPath(p)).toBe(false)
  })

  it('shows the test button only in a test build', async () => {
    expect((await load({ VITE_MEDIA_SPLIT: '*' })).MEDIA_TEST_LINK).toBe(false)
    expect((await load({ VITE_MEDIA_SPLIT: '*', VITE_MEDIA_TEST: 'true' })).MEDIA_TEST_LINK).toBe(true)
    // the test button alone (without the split) leads nowhere
    vi.unstubAllEnvs()
    expect((await load({ VITE_MEDIA_TEST: 'true' })).MEDIA_TEST_LINK).toBe(false)
  })

  it('uses the old address until the folder is found, then the new one (browser check)', async () => {
    const m = await load({ VITE_MEDIA_SPLIT: 'elia', VITE_MEDIA_SPLIT_WEB: 'true' })
    expect(m.prependBaseUrl('images/abenteuer/elia/x.webp')).toBe('/images/abenteuer/elia/x.webp')
    await m.initMediaSplit()
    expect(m.mediaSplitReport.mode).toBe('web')
    expect(m.prependBaseUrl('images/abenteuer/elia/x.webp')).toBe('/__media__/images/abenteuer/elia/x.webp')
    expect(m.prependBaseUrl('audio/abenteuer/elia/g-01.mp3')).toBe('/__media__/audio/abenteuer/elia/g-01.mp3')
    expect(m.prependBaseUrl('images/abenteuer/ui/coin.webp')).toBe('/images/abenteuer/ui/coin.webp')
    expect(m.prependBaseUrl('images/abenteuer/david/x.webp')).toBe('/images/abenteuer/david/x.webp')
  })

  it('in the app: tries the places, takes the first that answers and builds asset addresses', async () => {
    ;(window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = {}
    vi.doMock('@tauri-apps/api/path', () => ({ resourceDir: async () => '/private/var/App.app/assets/' }))
    vi.doMock('@tauri-apps/api/core', () => ({ convertFileSrc: (p: string) => `asset://localhost/${encodeURIComponent(p)}` }))
    // a picture "loads" only in the place `_up_/dist-media` (what the real iPad showed on 24.11.2026)
    class FakeImage {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      set src(url: string) {
        const ok = decodeURIComponent(url).endsWith('/App.app/assets/_up_/dist-media/__sentinel.png')
        setTimeout(() => (ok ? this.onload?.() : this.onerror?.()), 0)
      }
    }
    vi.stubGlobal('Image', FakeImage)
    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('Load failed')))
    const m = await load({ VITE_MEDIA_SPLIT: '*' })
    await m.initMediaSplit()
    vi.unstubAllGlobals()
    expect(m.mediaSplitReport.mode).toBe('asset')
    expect(m.mediaSplitReport.resourceDir).toBe('/private/var/App.app/assets')
    expect(m.mediaSplitReport.chosen).toBe('_up_/dist-media')
    // every place was tried; a failed one says why
    expect(m.mediaSplitReport.tried.length).toBe(m.CANDIDATES.length)
    expect(m.mediaSplitReport.tried.find((t) => t.where === 'media')?.note).toContain('Load failed')
    expect(m.mediaSplitReport.tried.filter((t) => t.ok).map((t) => t.where)).toEqual(['_up_/dist-media'])
    expect(decodeURIComponent(m.prependBaseUrl('images/abenteuer/elia/x.webp'))).toBe('asset://localhost//private/var/App.app/assets/_up_/dist-media/images/abenteuer/elia/x.webp')
    // what is not part of the split keeps the old address
    expect(m.prependBaseUrl('images/abenteuer/ui/coin.webp')).toBe('/images/abenteuer/ui/coin.webp')
  })

  it('stays on the old addresses when no place answers (and says so)', async () => {
    ;(window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = {}
    vi.doMock('@tauri-apps/api/path', () => ({ resourceDir: async () => '/x' }))
    vi.doMock('@tauri-apps/api/core', () => ({ convertFileSrc: (p: string) => `asset://localhost/${encodeURIComponent(p)}` }))
    class NoImage {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      set src(_u: string) {
        setTimeout(() => this.onerror?.(), 0)
      }
    }
    vi.stubGlobal('Image', NoImage)
    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('Load failed')))
    const m = await load({ VITE_MEDIA_SPLIT: 'elia' })
    await m.initMediaSplit()
    vi.unstubAllGlobals()
    expect(m.mediaSplitReport.chosen).toBe('')
    expect(m.prependBaseUrl('images/abenteuer/elia/x.webp')).toBe('/images/abenteuer/elia/x.webp')
  })
})

describe('Android: one Play pack per adventure', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.resetModules()
    delete (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__
  })

  /** A fake media server: lkcore is ready, the adventure pack is 'none' at first, then 'downloading' for two answers, then 'ready'. */
  function fakeServer() {
    const calls: string[] = []
    let adv = 0
    vi.stubGlobal('fetch', async (url: string) => {
      calls.push(url)
      const pack = new URL(url).searchParams.get('pack')
      let body = { status: 'ready', percent: 100, detail: '' }
      if (pack && pack !== 'lkcore') {
        adv++
        body = adv < 2 ? { status: 'none', percent: 0, detail: '' } : adv < 4 ? { status: 'downloading', percent: adv * 30, detail: '' } : { status: 'ready', percent: 100, detail: '' }
      }
      return { json: async () => body }
    })
    vi.stubGlobal('Image', class { onload: (() => void) | null = null; set src(_u: string) { setTimeout(() => this.onload?.(), 0) } })
    return calls
  }

  it('names the pack like the patch script and the server on the phone', async () => {
    vi.resetModules()
    vi.stubEnv('VITE_MEDIA_SPLIT', '*')
    const m = await import('@/utils/mediaSplit')
    expect(m.packNameOf('david')).toBe('adv_david')
    expect(m.packNameOf('adam-eva')).toBe('adv_adam_eva')
  })

  it('does nothing outside Android (the router never waits)', async () => {
    vi.resetModules()
    vi.stubEnv('VITE_MEDIA_SPLIT', '*')
    const m = await import('@/utils/mediaSplit')
    expect(await m.ensureAdventurePack('david')).toBe(true)
  })

  it('waits until the pack of the adventure is ready, shows the progress and asks Google to download it', async () => {
    ;(window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = {}
    vi.stubGlobal('navigator', { ...navigator, userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/120' })
    const calls = fakeServer()
    vi.resetModules()
    vi.stubEnv('VITE_MEDIA_SPLIT', '*')
    const m = await import('@/utils/mediaSplit')
    await m.initMediaSplit()
    expect(m.mediaSplitReport.mode).toBe('android')
    expect(m.androidPackReady()).toBe(true)
    vi.useFakeTimers()
    const done = m.ensureAdventurePack('david')
    await vi.advanceTimersByTimeAsync(5000)
    expect(await done).toBe(true)
    vi.useRealTimers()
    expect(calls.some((c) => c.includes('__fetch?pack=adv_david'))).toBe(true)
    expect(m.adventureWait.id).toBe('')
    // a second time it is known: no more questions
    const before = calls.length
    expect(await m.ensureAdventurePack('david')).toBe(true)
    expect(calls.length).toBe(before)
  })
})

describe('taking the media out of a build (vite.config.media.ts)', () => {
  function fakeBuild() {
    const root = mkdtempSync(join(tmpdir(), 'lk-media-'))
    const out = join(root, 'dist')
    for (const d of ['images/abenteuer/ui', 'images/abenteuer/david', 'images/abenteuer/spiele/david', 'images/abenteuer/spiele/sortieren', 'audio/abenteuer/david', 'audio/abenteuer/noah', 'images/buecher']) {
      mkdirSync(join(out, d), { recursive: true })
      writeFileSync(join(out, d, 'f.bin'), 'x')
    }
    writeFileSync(join(out, 'audio/abenteuer/klang-richtig.mp3'), 'x')
    return { root, out }
  }

  it('names the folders of the named adventures, or of all of them with *', () => {
    const { root, out } = fakeBuild()
    expect(mediaDirsOf(out, ['david'])).toEqual(['images/abenteuer/david', 'images/abenteuer/spiele/david', 'audio/abenteuer/david'])
    expect(mediaDirsOf(out, ['*']).sort()).toEqual(
      ['images/abenteuer/david', 'images/abenteuer/spiele', 'audio/abenteuer/david', 'audio/abenteuer/noah'].sort()
    )
    rmSync(root, { recursive: true, force: true })
  })

  it('moves them next to the build and leaves the signs, the loose sounds and everything else', () => {
    const { root, out } = fakeBuild()
    const r = splitMediaFiles(out, root, ['*'], false)
    expect(r.target).toBe(join(root, 'dist-media'))
    expect(existsSync(join(root, 'dist-media/images/abenteuer/david/f.bin'))).toBe(true)
    expect(existsSync(join(root, 'dist-media/images/abenteuer/spiele/sortieren/f.bin'))).toBe(true)
    expect(existsSync(join(root, 'dist-media/audio/abenteuer/noah/f.bin'))).toBe(true)
    expect(existsSync(join(root, 'dist-media/__sentinel.png'))).toBe(true)
    // gone from the build
    expect(existsSync(join(out, 'images/abenteuer/david'))).toBe(false)
    expect(existsSync(join(out, 'audio/abenteuer/noah'))).toBe(false)
    // stays
    expect(existsSync(join(out, 'images/abenteuer/ui/f.bin'))).toBe(true)
    expect(existsSync(join(out, 'audio/abenteuer/klang-richtig.mp3'))).toBe(true)
    expect(existsSync(join(out, 'images/buecher/f.bin'))).toBe(true)
    rmSync(root, { recursive: true, force: true })
  })

  it('for the check in the browser the media go to __media__ inside the build', () => {
    const { root, out } = fakeBuild()
    const r = splitMediaFiles(out, root, ['david'], true)
    expect(r.target).toBe(join(out, '__media__'))
    expect(existsSync(join(out, '__media__/audio/abenteuer/david/f.bin'))).toBe(true)
    expect(existsSync(join(out, 'audio/abenteuer/noah/f.bin'))).toBe(true)
    rmSync(root, { recursive: true, force: true })
  })
})
