/**
 * The hidden previews of Noah and of Adam und Eva: a journey is only added when the build contains it AND the device was unlocked with its link
 * (`?noah=<code>`, `?adam=<code>`); `?noah=off` / `?adam=off` lock it again; a normal build never adds either, and the list shows both only as coming soon.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const load = async () => {
  vi.resetModules()
  return import('@/data/adventures')
}
const open = (query: string) => window.history.replaceState(null, '', `/${query}`)

beforeEach(() => {
  localStorage.clear()
  open('')
})
afterEach(() => {
  vi.unstubAllEnvs()
  open('')
})

describe('the hidden journey Noah', () => {
  it('a normal build (without Noah) never adds it, even with the unlock link', async () => {
    vi.stubEnv('VITE_INCLUDE_NOAH', 'false')
    open(`?noah=noah-vorschau-7k3q`)
    const m = await load()
    await m.loadPreviewJourneys()
    expect(m.journeys.map((j) => j.id)).toEqual(['josef'])
    expect(m.comingSoon.some((c) => c.id === 'noah')).toBe(true)
  })

  it('the test build without the link does not show it', async () => {
    vi.stubEnv('VITE_INCLUDE_NOAH', 'true')
    const m = await load()
    await m.loadPreviewJourneys()
    expect(m.journeys.map((j) => j.id)).toEqual(['josef'])
    expect(m.journeyById('noah')).toBeUndefined()
  })

  it('a wrong code does not unlock it', async () => {
    vi.stubEnv('VITE_INCLUDE_NOAH', 'true')
    open('?noah=raten')
    const m = await load()
    await m.loadPreviewJourneys()
    expect(m.journeys.map((j) => j.id)).toEqual(['josef'])
    expect(localStorage.getItem(m.PREVIEW_KEY)).toBeNull()
  })

  it('the unlock link shows it, takes the code out of the address bar and is remembered on the device', async () => {
    vi.stubEnv('VITE_INCLUDE_NOAH', 'true')
    const first = await load()
    open(`?noah=${first.NOAH_UNLOCK_CODE}#/app/adventure`)
    await first.loadPreviewJourneys()
    expect(first.journeys.map((j) => j.id)).toEqual(['josef', 'noah'])
    expect(first.comingSoon.some((c) => c.id === 'noah')).toBe(false)
    expect(window.location.search).toBe('')
    expect(window.location.hash).toBe('#/app/adventure')
    // the next start without the link: still there
    const again = await load()
    await again.loadPreviewJourneys()
    expect(again.journeys.map((j) => j.id)).toEqual(['josef', 'noah'])
    expect(again.journeyById('noah')?.stages.length).toBe(9)
  })

  it('?noah=off locks it again', async () => {
    vi.stubEnv('VITE_INCLUDE_NOAH', 'true')
    const m = await load()
    localStorage.setItem(m.PREVIEW_KEY, '1')
    open('?noah=off')
    const again = await load()
    await again.loadPreviewJourneys()
    expect(again.journeys.map((j) => j.id)).toEqual(['josef'])
    expect(localStorage.getItem(again.PREVIEW_KEY)).toBeNull()
  })

  it('loading it twice adds it only once', async () => {
    vi.stubEnv('VITE_SHOW_NOAH', 'true')
    const m = await load()
    await m.loadPreviewJourneys()
    await m.loadPreviewJourneys()
    expect(m.journeys.filter((j) => j.id === 'noah')).toHaveLength(1)
  })
})

describe('the hidden journey Adam und Eva (id adam-eva)', () => {
  it('a normal build (without Adam) never adds it, even with the unlock link; the list shows it only as "coming soon"', async () => {
    vi.stubEnv('VITE_INCLUDE_ADAM', 'false')
    open('?adam=adam-vorschau-m4k7')
    const m = await load()
    await m.loadPreviewJourneys()
    expect(m.journeys.map((j) => j.id)).toEqual(['josef'])
    expect(m.comingSoon.map((c) => c.id)).toEqual(expect.arrayContaining(['adam-eva', 'noah']))
  })

  it('a normal build without any flag: neither Noah nor Adam is playable, both are only announced', async () => {
    vi.stubEnv('VITE_INCLUDE_NOAH', 'false')
    vi.stubEnv('VITE_INCLUDE_ADAM', 'false')
    open('?noah=noah-vorschau-7k3q')
    const m = await load()
    await m.loadPreviewJourneys()
    expect(m.journeys.map((j) => j.id)).toEqual(['josef'])
    expect(m.journeyById('adam-eva')).toBeUndefined()
    expect(m.journeyById('noah')).toBeUndefined()
    expect(m.comingSoon.map((c) => c.id).sort()).toEqual(['adam-eva', 'noah'])
  })

  it('the test build without the link does not show it; a wrong code does not unlock it', async () => {
    vi.stubEnv('VITE_INCLUDE_ADAM', 'true')
    const m = await load()
    await m.loadPreviewJourneys()
    expect(m.journeys.map((j) => j.id)).toEqual(['josef'])
    open('?adam=raten')
    const again = await load()
    await again.loadPreviewJourneys()
    expect(again.journeys.map((j) => j.id)).toEqual(['josef'])
    expect(localStorage.getItem(again.ADAM_PREVIEW_KEY)).toBeNull()
  })

  it('the unlock link shows it (the code leaves the address bar), the device remembers it, and the entry leaves the "coming soon" list', async () => {
    vi.stubEnv('VITE_INCLUDE_ADAM', 'true')
    const first = await load()
    open(`?adam=${first.ADAM_UNLOCK_CODE}#/app/adventure`)
    await first.loadPreviewJourneys()
    expect(first.ADAM_UNLOCK_CODE).toBe('adam-vorschau-m4k7')
    expect(first.journeys.map((j) => j.id)).toEqual(['josef', 'adam-eva'])
    expect(first.comingSoon.some((c) => c.id === 'adam-eva')).toBe(false)
    expect(first.comingSoon.some((c) => c.id === 'noah')).toBe(true)
    expect(localStorage.getItem('lk-preview-adam')).toBe('1')
    expect(window.location.search).toBe('')
    expect(window.location.hash).toBe('#/app/adventure')
    const again = await load()
    await again.loadPreviewJourneys()
    expect(again.journeyById('adam-eva')?.stages.length).toBe(9)
  })

  it('?adam=off locks it again', async () => {
    vi.stubEnv('VITE_INCLUDE_ADAM', 'true')
    const m = await load()
    localStorage.setItem(m.ADAM_PREVIEW_KEY, '1')
    open('?adam=off')
    const again = await load()
    await again.loadPreviewJourneys()
    expect(again.journeys.map((j) => j.id)).toEqual(['josef'])
    expect(localStorage.getItem(again.ADAM_PREVIEW_KEY)).toBeNull()
  })

  it('the two unlocks are independent: the Noah link does not open Adam and the other way round; both together show both', async () => {
    vi.stubEnv('VITE_INCLUDE_NOAH', 'true')
    vi.stubEnv('VITE_INCLUDE_ADAM', 'true')
    open('?noah=noah-vorschau-7k3q')
    const onlyNoah = await load()
    await onlyNoah.loadPreviewJourneys()
    expect(onlyNoah.journeys.map((j) => j.id)).toEqual(['josef', 'noah'])
    expect(localStorage.getItem('lk-preview-adam')).toBeNull()
    localStorage.clear()
    open('?adam=adam-vorschau-m4k7')
    const onlyAdam = await load()
    await onlyAdam.loadPreviewJourneys()
    expect(onlyAdam.journeys.map((j) => j.id)).toEqual(['josef', 'adam-eva'])
    // both unlocked on one device
    localStorage.setItem('lk-preview-noah', '1')
    const both = await load()
    await both.loadPreviewJourneys()
    expect(both.journeys.map((j) => j.id).sort()).toEqual(['adam-eva', 'josef', 'noah'])
    expect(both.comingSoon).toEqual([])
    // the Noah link keeps working as before; it takes Noah away again and leaves Adam alone
    open('?noah=off')
    const noNoah = await load()
    await noNoah.loadPreviewJourneys()
    expect(noNoah.journeys.map((j) => j.id).sort()).toEqual(['adam-eva', 'josef'])
  })

  it('local mode (VITE_SHOW_ADAM) shows it on every device and loading twice adds it once', async () => {
    vi.stubEnv('VITE_SHOW_ADAM', 'true')
    const m = await load()
    await m.loadPreviewJourneys()
    await m.loadPreviewJourneys()
    expect(m.journeys.filter((j) => j.id === 'adam-eva')).toHaveLength(1)
  })
})
