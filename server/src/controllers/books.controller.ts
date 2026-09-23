import type { Request, Response } from 'express'
import { BookService } from '../services/BookService.js'
import { UsageService } from '../services/UsageService.js'
import { env } from '../config/env.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const listBooks = asyncHandler(async (req: Request, res: Response) => {
  const includeHidden = req.query.all === 'true'
  const { books, cacheHit } = await BookService.list({ includeHidden })
  res.setHeader('X-Cache', cacheHit ? 'HIT' : 'MISS')
  res.json({ books })
})

export const getBook = asyncHandler(async (req: Request, res: Response) => {
  const { book, cacheHit } = await BookService.getById(req.params.id as string)
  res.setHeader('X-Cache', cacheHit ? 'HIT' : 'MISS')
  // The book detail page is the one screen worth counting, and this is the
  // request it makes. Fire-and-forget on purpose: the counter is a
  // side-effect of the fetch, never a reason for it to be slower or to fail.
  if (env.USAGE_TRACKING_ENABLED) void UsageService.recordBookView()
  res.json({ book })
})

export const createBook = asyncHandler(async (req: Request, res: Response) => {
  const book = await BookService.create(req.body)
  res.status(201).json({ book })
})

export const updateBook = asyncHandler(async (req: Request, res: Response) => {
  const book = await BookService.update(req.params.id as string, req.body)
  res.json({ book })
})

export const deleteBook = asyncHandler(async (req: Request, res: Response) => {
  await BookService.remove(req.params.id as string)
  res.status(204).send()
})
