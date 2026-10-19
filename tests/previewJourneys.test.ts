/**
 * The hidden preview of Noah: the journey is only added when the build contains it AND the device was unlocked with the link
 * (`?noah=<code>`); `?noah=off` locks it again; a normal build never adds it.
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
