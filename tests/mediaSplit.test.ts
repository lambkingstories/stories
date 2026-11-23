import { afterEach, describe, expect, it, vi } from 'vitest'

/**
 * Media outside the program file (the test for 1.3, see src/utils/mediaSplit.ts and vite.config.media.ts).
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
    expect(m.isSplitPath('images/abenteuer/elia/x.webp')).toBe(false)
    await m.initMediaSplit()
    expect(m.prependBaseUrl('images/abenteuer/elia/x.webp')).toBe('/images/abenteuer/elia/x.webp')
  })

  it('knows which paths belong to the adventure (pictures, pictures of its games, sounds) and no others', async () => {
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
    expect(m.splitDirsOf('elia')).toEqual(['images/abenteuer/elia', 'images/abenteuer/spiele/elia', 'audio/abenteuer/elia'])
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
    vi.doMock('@tauri-apps/api/path', () => ({ resourceDir: async () => '/private/var/App.app/' }))
    vi.doMock('@tauri-apps/api/core', () => ({ convertFileSrc: (p: string) => `asset://localhost/${encodeURIComponent(p)}` }))
    // a picture "loads" only in the place `_up_/dist-media` (what a build with the array form of `bundle.resources` makes)
    class FakeImage {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      set src(url: string) {
        const ok = decodeURIComponent(url).endsWith('/App.app/_up_/dist-media/__sentinel.png')
        setTimeout(() => (ok ? this.onload?.() : this.onerror?.()), 0)
      }
    }
    vi.stubGlobal('Image', FakeImage)
    const m = await load({ VITE_MEDIA_SPLIT: 'elia' })
    await m.initMediaSplit()
    vi.unstubAllGlobals()
    expect(m.mediaSplitReport.mode).toBe('asset')
    expect(m.mediaSplitReport.resourceDir).toBe('/private/var/App.app')
    expect(m.mediaSplitReport.chosen).toBe('_up_/dist-media')
    expect(m.mediaSplitReport.tried.length).toBe(m.CANDIDATES.length)
    expect(m.mediaSplitReport.tried.filter((t) => t.ok).map((t) => t.where)).toEqual(['_up_/dist-media'])
    expect(decodeURIComponent(m.prependBaseUrl('images/abenteuer/elia/x.webp'))).toBe('asset://localhost//private/var/App.app/_up_/dist-media/images/abenteuer/elia/x.webp')
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
    const m = await load({ VITE_MEDIA_SPLIT: 'elia' })
    await m.initMediaSplit()
    vi.unstubAllGlobals()
    expect(m.mediaSplitReport.chosen).toBe('')
    expect(m.prependBaseUrl('images/abenteuer/elia/x.webp')).toBe('/images/abenteuer/elia/x.webp')
  })
})
