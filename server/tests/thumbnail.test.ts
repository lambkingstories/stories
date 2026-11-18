import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { createApp } from './helpers.js'

const uploads = path.resolve('./tests/.tmp/uploads')
const dir = path.join(uploads, 'previews')
const big = path.join(dir, 'thumb-test-big.png')
const tiny = path.join(dir, 'thumb-test-tiny.png')
let app: Awaited<ReturnType<typeof createApp>>

beforeAll(async () => {
  fs.mkdirSync(dir, { recursive: true })
  // a noisy picture does not compress: the original is large
  const raw = Buffer.alloc(900 * 1200 * 3)
  for (let i = 0; i < raw.length; i++) raw[i] = (i * 7919 + ((i >> 3) ^ (i * 31))) & 255
  await sharp(raw, { raw: { width: 900, height: 1200, channels: 3 } }).png().toFile(big)
  await sharp({ create: { width: 40, height: 40, channels: 3, background: '#336699' } }).png().toFile(tiny)
  fs.writeFileSync(path.join(dir, 'thumb-test.txt'), 'hello')
  app = await createApp()
})

afterAll(() => {
  for (const f of ['thumb-test-big.png', 'thumb-test-tiny.png', 'thumb-test.txt']) fs.rmSync(path.join(dir, f), { force: true })
})

const binary = (res: request.Response, cb: (err: Error | null, body: Buffer) => void) => {
  const chunks: Buffer[] = []
  res.on('data', (c: Buffer) => chunks.push(c))
  res.on('end', () => cb(null, Buffer.concat(chunks)))
}

describe('/uploads small versions (?w=)', () => {
  it('without w the original is sent unchanged', async () => {
    const res = await request(app).get('/uploads/previews/thumb-test-big.png').buffer(true).parse(binary)
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toContain('image/png')
    expect(res.body.length).toBe(fs.statSync(big).size)
  })

  it('w=320 sends a smaller WebP that is 320 pixels wide, with a cache header, and the original stays untouched', async () => {
    const before = fs.statSync(big)
    const res = await request(app).get('/uploads/previews/thumb-test-big.png?w=320').buffer(true).parse(binary)
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toBe('image/webp')
    expect(res.headers['cache-control']).toContain('max-age=604800')
    expect(res.headers['access-control-allow-origin']).toBe('*')
    expect(res.body.length).toBeLessThan(before.size)
    const meta = await sharp(res.body).metadata()
    expect(meta.width).toBe(320)
    expect(meta.height).toBe(427)
    const after = fs.statSync(big)
    expect(after.size).toBe(before.size)
    expect(after.mtimeMs).toBe(before.mtimeMs)
  })

  it('answers 304 for a repeated request with the ETag', async () => {
    const first = await request(app).get('/uploads/previews/thumb-test-big.png?w=480')
    const again = await request(app).get('/uploads/previews/thumb-test-big.png?w=480').set('If-None-Match', first.headers.etag as string)
    expect(again.status).toBe(304)
  })

  it('a width that is not offered gets the original', async () => {
    const res = await request(app).get('/uploads/previews/thumb-test-big.png?w=333').buffer(true).parse(binary)
    expect(res.headers['content-type']).toContain('image/png')
    expect(res.body.length).toBe(fs.statSync(big).size)
  })

  it('a picture that is narrower than the width is never enlarged', async () => {
    const res = await request(app).get('/uploads/previews/thumb-test-tiny.png?w=960').buffer(true).parse(binary)
    expect(res.status).toBe(200)
    expect(res.body.length).toBeLessThanOrEqual(fs.statSync(tiny).size)
    expect((await sharp(res.body).metadata()).width).toBe(40)
  })

  it('files that are not pictures and missing files are handled by the normal file server', async () => {
    const txt = await request(app).get('/uploads/previews/thumb-test.txt?w=320')
    expect(txt.status).toBe(200)
    expect(txt.text).toBe('hello')
    const missing = await request(app).get('/uploads/previews/nope.png?w=320')
    expect(missing.status).toBe(404)
  })

  it('does not leave the uploads folder', async () => {
    const res = await request(app).get('/uploads/..%2f..%2fpackage.json?w=320')
    expect([301, 400, 403, 404]).toContain(res.status)
    const res2 = await request(app).get('/uploads/%2e%2e/package.json?w=320')
    expect([301, 400, 403, 404]).toContain(res2.status)
  })
})
