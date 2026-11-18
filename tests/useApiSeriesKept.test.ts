import { beforeEach, describe, expect, it, vi } from 'vitest'

const h = vi.hoisted(() => ({ list: vi.fn() }))
vi.mock('@/api/seriesApi', () => ({ seriesApi: { list: h.list } }))

const A = { seriesId: 'a', name: 'Alt', prefix: 'a', coverImage: '', sortOrder: 1 }
const B = { seriesId: 'b', name: 'Neu', prefix: 'b', coverImage: '', sortOrder: 2 }

async function fresh() {
  vi.resetModules()
  const { default: useApiSeries } = await import('@/use/useApiSeries')
  return useApiSeries()
}

beforeEach(() => {
  h.list.mockReset()
  localStorage.clear()
})

describe('series list kept on the device', () => {
  it('is known at once at the start when a list of the last visit lies on the device', async () => {
    localStorage.setItem('lk-series-v1', JSON.stringify([A]))
    const api = await fresh()
    expect(api.state.all?.map((s) => s.seriesId)).toEqual(['a'])
    expect(api.getById('a')?.name).toBe('Alt')
  })

  it('is refreshed from the net once, and the new list is kept', async () => {
    localStorage.setItem('lk-series-v1', JSON.stringify([A]))
    h.list.mockResolvedValue([B])
    const api = await fresh()
    await api.loadAll()
    expect(api.state.all?.map((s) => s.seriesId)).toEqual(['b'])
    expect(JSON.parse(localStorage.getItem('lk-series-v1') ?? '[]')).toEqual([B])
    await api.loadAll()
    expect(h.list).toHaveBeenCalledTimes(1)
  })

  it('keeps the old list when the net fails', async () => {
    localStorage.setItem('lk-series-v1', JSON.stringify([A]))
    h.list.mockRejectedValue(new Error('offline'))
    const api = await fresh()
    await api.loadAll()
    expect(api.state.all?.map((s) => s.seriesId)).toEqual(['a'])
    expect(api.state.error).toBe('offline')
  })

  it('starts empty without a kept list, and does not break on a broken one', async () => {
    const api1 = await fresh()
    expect(api1.state.all).toBeNull()
    localStorage.setItem('lk-series-v1', '{not json')
    const api2 = await fresh()
    expect(api2.state.all).toBeNull()
  })
})
