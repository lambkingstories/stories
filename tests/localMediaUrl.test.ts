import { afterEach, describe, expect, it, vi } from 'vitest'
import { localMediaPath, prependBaseUrl } from '@/utils/function'
import { pageArtworkId } from '@/use/useArtworks'

// In a store build the pictures of an adventure are addressed on the device (Android: the media server on 127.0.0.1; iOS: the asset protocol). A page hands
// such a finished address to a component that calls prependBaseUrl again: it must not be prefixed a second time (collection card without a picture on Anton's
// phone, 25.11.2026), and a painting must not be filed under an address that changes.
const android = 'http://127.0.0.1:47321/images/abenteuer/wueste/karte-vorn.webp'
const ios = 'asset://localhost/%2Fvar%2Fcontainers%2FBundle%2FApplication%2FAB12%2FLambKing.app%2Fassets%2F_up_%2Fdist-media%2Fimages%2Fabenteuer%2Fwueste%2Fkarte-vorn.webp'
const path = '/images/abenteuer/wueste/karte-vorn.webp'

describe('addresses of media files on the device', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('finds the path in a device address and leaves every other address alone', () => {
    expect(localMediaPath(android)).toBe(path)
    expect(localMediaPath(ios)).toBe(path)
    expect(localMediaPath('https://lbs-be.onrender.com/images/x.webp')).toBeNull()
    expect(localMediaPath('blob:https://tauri.localhost/1234')).toBeNull()
    expect(localMediaPath(path)).toBeNull()
  })

  it('never prefixes a finished address a second time', () => {
    for (const url of ['https://lbs-be.onrender.com/api/x.png', 'blob:https://x/1', 'data:image/png;base64,AAAA']) expect(prependBaseUrl(url)).toBe(url)
    expect(prependBaseUrl(prependBaseUrl(path))).toBe(prependBaseUrl(path))
    expect(prependBaseUrl(android)).toBe(prependBaseUrl(path))
  })

  it('with separate media the card picture survives a second call', async () => {
    vi.resetModules()
    vi.stubEnv('VITE_MEDIA_SPLIT', '*')
    const split = await import('@/utils/mediaSplit')
    const fn = await import('@/utils/function')
    vi.spyOn(split, 'splitUrl')
    const once = fn.prependBaseUrl('images/abenteuer/wueste/karte-vorn.webp')
    const twice = fn.prependBaseUrl(once)
    expect(twice).toBe(once)
    expect(twice).not.toContain('http://127.0.0.1:47321/http')
    expect(fn.prependBaseUrl(android)).not.toContain('127.0.0.1:47321/http')
  })

  it('files a painting under the same name, however the line art is addressed', () => {
    expect(pageArtworkId(android, 1)).toBe(`src:${path}#1`)
    expect(pageArtworkId(ios, 1)).toBe(`src:${path}#1`)
    // the name that paintings of the earlier store builds have
    expect(pageArtworkId(path, 1)).toBe(`src:${path}#1`)
    expect(pageArtworkId('https://x.de/a.png', 2)).toBe('src:https://x.de/a.png#2')
  })
})
