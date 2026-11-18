import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type { RequestHandler, Response } from 'express'
import { logger } from '../config/logger.js'

/**
 * Small versions of the uploaded pictures: `GET /uploads/previews/abc.jpg?w=320` answers a WebP that is 320 pixels wide.
 *
 * Why: the book covers are uploaded in their full size (often 1 MB) and the app shows them as small tiles. A list of 269 books
 * would send 93 MB of pictures to a phone for tiles that are 95 pixels wide.
 *
 * Safe on purpose:
 *  - The original file is NEVER touched. The small version is made from it and kept in a cache folder (temp folder of the machine;
 *    it fills again by itself after a restart).
 *  - Only the widths in `THUMB_WIDTHS` are made, only for pictures below the uploads folder; everything else (no `w`, another
 *    width, a sound, a missing file) goes on to the normal file server, which sends the original.
 *  - Old apps do not send `w`, so they get the original as before. Without the image library (`sharp`), or when making the small
 *    version fails, the original is sent too.
 *  - At most 2 small versions are made at a time, so a burst of requests cannot use up the small machine.
 */
export const THUMB_WIDTHS = [160, 240, 320, 480, 720, 960] as const
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp'])
const MAX_PARALLEL = 2
const CACHE_CONTROL = 'public, max-age=604800'

type Sharp = (input: string) => {
  rotate: () => ReturnType<Sharp>
  resize: (o: { width: number; withoutEnlargement: boolean }) => ReturnType<Sharp>
  webp: (o: { quality: number }) => ReturnType<Sharp>
  toFile: (file: string) => Promise<unknown>
}

let sharpPromise: Promise<Sharp | null> | undefined
function loadSharp(): Promise<Sharp | null> {
  // the name is held in a variable on purpose: the build must not fail (no types) on a machine where the optional library is missing
  const name = 'sharp'
  sharpPromise ??= import(name)
    .then((m: { default?: unknown }) => (m.default ?? m) as unknown as Sharp)
    .catch((err) => {
      logger.warn('sharp is not available: pictures are sent in their original size', { error: (err as Error).message })
      return null
    })
  return sharpPromise
}

let running = 0
const waiting: Array<() => void> = []
async function slot<T>(job: () => Promise<T>): Promise<T> {
  if (running >= MAX_PARALLEL) await new Promise<void>((resolve) => waiting.push(resolve))
  running++
  try {
    return await job()
  } finally {
    running--
    waiting.shift()?.()
  }
}

const inFlight = new Map<string, Promise<string | null>>()

async function makeThumb(source: string, target: string, width: number): Promise<string | null> {
  const sharp = await loadSharp()
  if (!sharp) return null
  fs.mkdirSync(path.dirname(target), { recursive: true })
  const tmp = `${target}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`
  try {
    await sharp(source).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 80 }).toFile(tmp)
    // a small version that is not smaller than the original is of no use
    if (fs.statSync(tmp).size >= fs.statSync(source).size) {
      fs.rmSync(tmp, { force: true })
      fs.writeFileSync(target + '.skip', '')
      return null
    }
    fs.renameSync(tmp, target)
    return target
  } catch (err) {
    fs.rmSync(tmp, { force: true })
    logger.warn('small version could not be made', { source, width, error: (err as Error).message })
    return null
  }
}

export function thumbnailMiddleware(uploadsDir: string, setCors: (res: Response) => void): RequestHandler {
  const root = path.resolve(uploadsDir)
  const cacheDir = path.join(os.tmpdir(), 'lk-thumbs')
  return async (req, res, next) => {
    try {
      if ((req.method !== 'GET' && req.method !== 'HEAD') || typeof req.query.w !== 'string') return next()
      const width = Number(req.query.w)
      if (!(THUMB_WIDTHS as readonly number[]).includes(width)) return next()
      const rel = decodeURIComponent(req.path)
      if (!IMAGE_EXT.has(path.extname(rel).toLowerCase())) return next()
      const source = path.resolve(root, '.' + path.posix.normalize('/' + rel))
      if (!source.startsWith(root + path.sep) || !fs.existsSync(source) || !fs.statSync(source).isFile()) return next()
      const st = fs.statSync(source)
      const key = crypto.createHash('sha1').update(`${rel}|${st.size}|${st.mtimeMs}|${width}`).digest('hex')
      const target = path.join(cacheDir, `${key}.webp`)
      if (fs.existsSync(target + '.skip')) return next()
      let file: string | null = fs.existsSync(target) ? target : null
      if (!file) {
        let job = inFlight.get(key)
        if (!job) {
          job = slot(() => makeThumb(source, target, width)).finally(() => inFlight.delete(key))
          inFlight.set(key, job)
        }
        file = await job
      }
      if (!file) return next()
      const size = fs.statSync(file).size
      const etag = `"${key}"`
      setCors(res)
      res.setHeader('Cache-Control', CACHE_CONTROL)
      res.setHeader('ETag', etag)
      res.setHeader('Content-Type', 'image/webp')
      res.setHeader('Vary', 'Accept-Encoding')
      if (req.headers['if-none-match'] === etag) {
        res.status(304).end()
        return
      }
      res.setHeader('Content-Length', String(size))
      if (req.method === 'HEAD') {
        res.end()
        return
      }
      fs.createReadStream(file).on('error', () => res.destroy()).pipe(res)
    } catch (err) {
      logger.warn('small version failed, sending the original', { error: (err as Error).message })
      next()
    }
  }
}
