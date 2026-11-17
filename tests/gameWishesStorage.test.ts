/**
 * The picks of the big games after a restart of the app: they are read from the device again (a fresh module, as after reloading the page);
 * a damaged save is thrown away. (Own file: the modules are loaded anew here, which would split the state of the other tests.)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

beforeEach(() => {
  localStorage.clear()
  vi.resetModules()
})

describe('the saved picks', () => {
  it('come back after a restart, each game once', async () => {
    localStorage.setItem('lk-biggames-picks-v1', JSON.stringify(['lamm', 'david', 'lamm', 7]))
    const bg = (await import('@/use/useBigGames')).default()
    expect(bg.picked()).toEqual(['lamm', 'david'])
    expect(bg.isPicked('lamm')).toBe(true)
    expect(bg.isPicked('elia')).toBe(false)
  })

  it('are written when a game is picked, and picking twice changes nothing', async () => {
    const bg = (await import('@/use/useBigGames')).default()
    bg.addPick('mose')
    bg.addPick('mose')
    expect(JSON.parse(localStorage.getItem('lk-biggames-picks-v1')!)).toEqual(['mose'])
  })

  it('a damaged save is thrown away', async () => {
    localStorage.setItem('lk-biggames-picks-v1', '{"not":"a list"}')
    expect((await import('@/use/useBigGames')).default().picked()).toEqual([])
    localStorage.setItem('lk-biggames-picks-v1', 'not json at all')
    vi.resetModules()
    expect((await import('@/use/useBigGames')).default().picked()).toEqual([])
  })

  it('a device that cannot save still works (the picks are kept until the page closes)', async () => {
    const bg = (await import('@/use/useBigGames')).default()
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('private window')
    })
    expect(() => bg.addPick('elia')).not.toThrow()
    expect(bg.isPicked('elia')).toBe(true)
    spy.mockRestore()
  })
})
