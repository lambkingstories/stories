import { Book, type BookDocument } from '../models/Book.js'
import { CacheService } from './CacheService.js'
import { HttpError } from '../utils/httpError.js'
import { HIDDEN_CATEGORY } from '../config/categories.js'
import type { CreateBookInput, UpdateBookInput } from '../validators/book.schema.js'
import { logger } from '../config/logger.js'
import { absolutizeBook, absolutizeBooks, relativizeBook } from '../utils/bookUrls.js'
import { leanBook } from '../utils/leanBook.js'

function toDTO(doc: { toJSON: () => unknown }): unknown {
  return doc.toJSON()
}

function fillBadgeLocaleFallback<T extends { achievementBadge?: { de?: string; en?: string } }>(input: T): T {
  const ab = input.achievementBadge
  if (!ab) return input
  const de = ab.de?.trim() ?? ''
  const en = ab.en?.trim() ?? ''
  if (de && !en) return { ...input, achievementBadge: { de, en: de } }
  if (en && !de) return { ...input, achievementBadge: { de: en, en } }
  return input
}

export const BookService = {
  async list(opts: { includeHidden?: boolean; lean?: boolean } = {}) {
    const cached = await CacheService.getBooksList<unknown[]>()
    let docs: unknown[]
    let cacheHit: boolean
    if (cached) {
      docs = cached
      cacheHit = true
    } else {
      docs = await Book.find({}).sort({ updatedDate: -1 }).lean().exec()
      await CacheService.setBooksList(docs)
      cacheHit = false
    }
    let books = absolutizeBooks(docs)
    if (!opts.includeHidden) {
      books = books.filter((b) => (b as { category?: string }).category !== HIDDEN_CATEGORY)
    }
    // the slim list leaves the text of the story pages out (about three quarters of its size)
    if (opts.lean) books = books.map((b) => leanBook(b))
    return { books, cacheHit }
  },

  async getById(bookId: string) {
    const cached = await CacheService.getBook<unknown>(bookId)
    if (cached) return { book: absolutizeBook(cached), cacheHit: true }
    const doc = await Book.findOne({ bookId }).lean().exec()
    if (!doc) throw HttpError.notFound(`Book with id "${bookId}" not found`)
    await CacheService.setBook(bookId, doc)
    return { book: absolutizeBook(doc), cacheHit: false }
  },

  async create(input: CreateBookInput) {
    const existing = await Book.findOne({ bookId: input.bookId }).lean().exec()
    if (existing) {
      throw HttpError.conflict(`Book with id "${input.bookId}" already exists`, [
        { field: 'bookId', message: 'already exists' }
      ])
    }
    const normalized = fillBadgeLocaleFallback(relativizeBook(input))
    const doc = await Book.create({
      ...normalized,
      releaseDate: new Date(normalized.releaseDate),
      updatedDate: new Date()
    })
    await CacheService.invalidateBooks(doc.bookId)
    logger.info('book created', { bookId: doc.bookId, title: doc.localizations?.de?.title })
    return absolutizeBook(toDTO(doc as unknown as { toJSON: () => unknown }))
  },

  async update(bookId: string, input: UpdateBookInput) {
    const normalized = fillBadgeLocaleFallback(relativizeBook(input))
    const updates: Partial<BookDocument> = { ...normalized } as Partial<BookDocument>
    if (normalized.releaseDate) updates.releaseDate = new Date(normalized.releaseDate)
    updates.updatedDate = new Date()
    const doc = await Book.findOneAndUpdate({ bookId }, updates, { new: true, runValidators: true }).exec()
    if (!doc) throw HttpError.notFound(`Book with id "${bookId}" not found`)
    await CacheService.invalidateBooks(bookId)
    logger.info('book updated', { bookId })
    return absolutizeBook(toDTO(doc as unknown as { toJSON: () => unknown }))
  },

  // Returns true if any book's page text in any locale still references the
  // image URL. Strips scheme+host so absolutized callers (admin UI) match
  // the relative form stored in MongoDB.
  async isContentImageReferenced(rawUrl: string): Promise<boolean> {
    if (!rawUrl) return false
    const rel = rawUrl
      .replace(/^https?:\/\/[^/]+/i, '')
      .replace(/^\/+/, '/')
    if (!rel.includes('/uploads/')) return false
    // Match either the relative path or any absolutized variant — a page
    // text might hold either, depending on whether the absolutizer ran on
    // its way through the read pipeline.
    const escaped = rel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const filenameOnly = rel.split('/').pop() ?? ''
    const filenameEscaped = filenameOnly.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = `(${escaped}|${filenameEscaped})`
    const regex = new RegExp(pattern)
    const hit = await Book.findOne({
      $or: [
        { 'localizations.de.content.text': { $regex: regex } },
        { 'localizations.en.content.text': { $regex: regex } }
      ]
    }).select({ bookId: 1 }).lean().exec()
    return Boolean(hit)
  },

  async remove(bookId: string) {
    const doc = await Book.findOneAndDelete({ bookId }).exec()
    if (!doc) throw HttpError.notFound(`Book with id "${bookId}" not found`)
    await CacheService.invalidateBooks(bookId)
    logger.info('book deleted', { bookId })
    return { deleted: true }
  }
}
