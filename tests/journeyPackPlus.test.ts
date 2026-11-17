/**
 * A pack of an adventure behind LambKing Plus is never loaded without Plus: asking for it opens the Plus sheet and fetches nothing.
 * (The 15 MB used to be loaded first and the Plus sheet came only at "Weiter" on the map.)
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { noah } from '@/data/adventures/noah'
import { mose } from '@/data/adventures/mose'

async function load(env: Record<string, string>) {
  vi.resetModules()
  localStorage.clear()
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v)
  const pack = (await import('@/use/useJourneyPack')).default()
  const premium = await import('@/use/usePremium')
  return { pack, premium }
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.resetModules()
  localStorage.clear()
})

describe('the download of an adventure behind Plus', () => {
  it('opens the Plus sheet and loads nothing for a Plus adventure without Plus', async () => {
    const fetchMock = vi.fn(async () => new Response('x'))
    vi.stubGlobal('fetch', fetchMock)
    const { pack, premium } = await load({ VITE_PREMIUM_TEASER: 'true' })
    const ok = await pack.download(mose)
    expect(ok).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(premium.default().upsellFeature.value).toBe('adventure')
    expect(pack.busy.value).toBeFalsy()
  })

  it('still loads a free adventure (and shows no sheet)', async () => {
    const fetchMock = vi.fn(async () => new Response('x', { headers: { 'content-length': '1' } }))
    vi.stubGlobal('fetch', fetchMock)
    const { pack, premium } = await load({ VITE_PREMIUM_TEASER: 'true' })
    const ok = await pack.download(noah)
    expect(ok).toBe(true)
    expect(fetchMock).toHaveBeenCalled()
    expect(premium.default().upsellFeature.value).toBeNull()
  })

  it('loads a Plus adventure for a person with Plus', async () => {
    const fetchMock = vi.fn(async () => new Response('x'))
    vi.stubGlobal('fetch', fetchMock)
    const { pack, premium } = await load({ VITE_PREMIUM_TEASER: 'true', VITE_PLUS_TEST: 'true' })
    premium.setTestPlus(true)
    expect(await pack.download(mose)).toBe(true)
    expect(fetchMock).toHaveBeenCalled()
  })
})
