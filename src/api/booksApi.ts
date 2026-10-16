import type { ApiBook, ApiBookListResponse, ApiBookResponse } from '@/types/apiBook'
import { getApiBase } from '@/use/useApiConfig'
import { buildApiHeaders } from '@/api/apiHeaders'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // Resolve the base at request time — the runtime feature flag in
  // `useApiConfig` may have flipped between Render and a local dev
  // server after module load.
  const apiBase = getApiBase()
  const res = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: buildApiHeaders(init?.headers)
  })
  if (!res.ok) {
    throw new Error(`API ${res.status} ${res.statusText} on ${path}`)
  }
  return (await res.json()) as T
}

export const booksApi = {
  get apiBase(): string {
    return getApiBase()
  },

  /**
   * All books, slim: the server leaves the text of the story pages out (about three quarters of the list). Such a book has
   * `lean: true`; the text comes with `getById` when the book is opened. A server that does not know `lean` sends everything.
   */
  async list(): Promise<ApiBook[]> {
    const data = await request<ApiBookListResponse>('/api/books?lean=1')
    return data.books ?? []
  },

  async getById(bookId: string): Promise<ApiBook> {
    const data = await request<ApiBookResponse>(`/api/book/${encodeURIComponent(bookId)}`)
    return data.book
  }
}
