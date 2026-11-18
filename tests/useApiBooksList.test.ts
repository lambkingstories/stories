/**
 * The list of books: the list of the last visit is there at once, the net refreshes it; screens know when the first answer is in
 * (`listReady`), so that they show placeholders before and a real "nothing here" only after.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ApiBook } from '@/types/apiBook'

const h = vi.hoisted(() => ({
  list: vi.fn(),
  read: vi.fn(),
  write: vi.fn(async () => undefined)
}))

vi.mock('@/api/booksApi', () => ({ booksApi: { list: h.list, getById: vi.fn() } }))
vi.mock('@/utils/bookListCache', async (orig) => ({ ...(await orig<typeof import('@/utils/bookListCache')>()), readBookList: h.read, writeBookList: h.write }))
vi.mock('@/use/useOfflineStories', () => ({
  default: () => ({ init: async () => undefined, list: async () => [], isStored: () => false, noteOpened: async () => undefined, refreshSize: async () => undefined })
}))
vi.mock('@/use/useBookCache', () => ({
  default: () => ({ saveBook: async () => undefined, getCached: async () => null, invalidateBookBlobs: async () => undefined, prefetchBlobs: async () => undefined })
}))

const book = (id: string, over: Record<string, unknown> = {}): ApiBook =>
  ({ bookId: id, author: 'A', category: 'c', bookSeriesId: 's', releaseDate: '2026-01-01', updatedDate: '2026-01-01', badges: [], isPublished: true, localizations: { de: { title: id, shortDescription: '', description: '', content: [] } }, ...over }) as unknown as ApiBook

async function fresh() {
  vi.resetModules()
  const { default: useApiBooks } = await import('@/use/useApiBooks')
  return useApiBooks()
}

beforeEach(() => {
  h.list.mockReset()
  h.read.mockReset()
  h.write.mockClear()
})

describe('loadAllBooks: the list kept on the device and the first answer', () => {
  it('is not ready before the first answer', async () => {
    h.read.mockResolvedValue(null)
    h.list.mockReturnValue(new Promise(() => undefined))
    const api = await fresh()
    void api.loadAllBooks()
    expect(api.state.listReady).toBe(false)
    expect(api.state.all).toBeNull()
  })

  it('shows the kept list at once while the net is slow, then the fresh one', async () => {
    h.read.mockResolvedValue({ books: [book('old-1')], savedAt: 1 })
    let answer!: (b: ApiBook[]) => void
    h.list.mockReturnValue(new Promise<ApiBook[]>((resolve) => (answer = resolve)))
    const api = await fresh()
    const done = api.loadAllBooks()
    await vi.waitFor(() => expect(api.state.all?.map((b) => b.bookId)).toEqual(['old-1']))
    expect(api.state.listReady).toBe(true)
    answer([book('new-1'), book('new-2')])
    await done
    expect(api.state.all?.map((b) => b.bookId)).toEqual(['new-1', 'new-2'])
    expect(api.state.listFailed).toBe(false)
    expect(h.write).toHaveBeenCalledTimes(1)
  })

  it('ignores the kept list when the net was faster', async () => {
    h.read.mockReturnValue(new Promise(() => undefined))
    h.list.mockResolvedValue([book('net-1')])
    const api = await fresh()
    await api.loadAllBooks()
    expect(api.state.all?.map((b) => b.bookId)).toEqual(['net-1'])
    expect(api.state.listReady).toBe(true)
  })

  it('keeps the kept list when the net fails, and says that it failed', async () => {
    h.read.mockResolvedValue({ books: [book('old-1')], savedAt: 1 })
    h.list.mockRejectedValue(new Error('Failed to fetch'))
    const api = await fresh()
    await api.loadAllBooks()
    expect(api.state.all?.map((b) => b.bookId)).toEqual(['old-1'])
    expect(api.state.listFailed).toBe(true)
    expect(api.state.listReady).toBe(true)
  })

  it('without a net and without a kept list: ready and failed (the screen shows the friendly note)', async () => {
    h.read.mockResolvedValue(null)
    h.list.mockRejectedValue(new Error('Failed to fetch'))
    const api = await fresh()
    await api.loadAllBooks()
    expect(api.state.listReady).toBe(true)
    expect(api.state.listFailed).toBe(true)
    expect(api.state.error).toBe('Failed to fetch')
    expect(h.write).not.toHaveBeenCalled()
  })

  it('a slim entry of the kept list never replaces a whole book that is known', async () => {
    h.read.mockResolvedValue({ books: [book('b1', { lean: true })], savedAt: 1 })
    h.list.mockResolvedValue([book('b1', { lean: true })])
    const api = await fresh()
    await api.loadAllBooks()
    expect(api.getById('b1')?.lean).toBe(true)
  })

  it('a book that is hidden is not shown from the kept list either', async () => {
    h.read.mockResolvedValue({ books: [book('keep-1'), book('ba-01-die-schoepfung-der-welt'), book('g-1', { bookSeriesId: 'gute-nacht-lilly' })], savedAt: 1 })
    h.list.mockReturnValue(new Promise(() => undefined))
    const api = await fresh()
    void api.loadAllBooks()
    await vi.waitFor(() => expect(api.state.listReady).toBe(true))
    expect(api.state.all?.map((b) => b.bookId)).toEqual(['keep-1'])
  })
})
