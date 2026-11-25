import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// The one-time download of an adventure (useJourneyPack) asks the net for the files. In a store build with separate media (iOS next to the program, Android in
// the Play packs) the files are not on a server: the download would fail ("Das Laden hat nicht geklappt") and block the adventure. There it must not be offered;
// the adventure opens at once, and on Android the router fetches the Play pack with a loading screen (found on Anton's phone, 25.11.2026).
describe('one-time download of an adventure and the separate media', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubGlobal('caches', { keys: async () => [], open: async () => ({ put: async () => undefined }), delete: async () => true })
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('is offered in the web app (no separate media)', async () => {
    vi.stubEnv('VITE_MEDIA_SPLIT', '')
    const { default: useJourneyPack } = await import('@/use/useJourneyPack')
    expect(useJourneyPack().supported).toBe(true)
  })

  it('is not offered in a store build with separate media: the adventure opens at once', async () => {
    vi.stubEnv('VITE_MEDIA_SPLIT', '*')
    const { default: useJourneyPack } = await import('@/use/useJourneyPack')
    expect(useJourneyPack().supported).toBe(false)
  })

  it('is still offered in the web test of the separate media', async () => {
    vi.stubEnv('VITE_MEDIA_SPLIT', '*')
    vi.stubEnv('VITE_MEDIA_SPLIT_WEB', 'true')
    const { default: useJourneyPack } = await import('@/use/useJourneyPack')
    expect(useJourneyPack().supported).toBe(true)
  })
})
