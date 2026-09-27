import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import { ADMIN_AUTH, createApp, sampleBook } from './helpers.js'

describe('public-read client-key gate', () => {
  describe('CLIENT_KEYS empty (legacy behaviour)', () => {
    let app: Awaited<ReturnType<typeof createApp>>
    beforeEach(async () => {
      // Force a re-parse of env with no CLIENT_KEYS set so the middleware
      // takes its no-op path.
      delete process.env.CLIENT_KEYS
      app = await createApp()
    })

    it('allows GET /api/books without an X-Client-Key header', async () => {
      const res = await request(app).get('/api/books')
      expect(res.status).toBe(200)
    })
  })

  describe('CLIENT_KEYS populated', () => {
    let app: Awaited<ReturnType<typeof createApp>>
    beforeEach(async () => {
      // The env module caches its parsed result on first import, so we
      // can't simply set the env here and re-import to flip behaviour. Use
      // the live env: set a known key, build the app, and rely on the
      // already-cached env having seen the value (test runner imports each
      // test file fresh).
      process.env.CLIENT_KEYS = 'tauri:test-key-tauri,pages:test-key-pages'
      // Bust the env module from the loader cache so the next createApp
      // sees the updated CLIENT_KEYS string.
      const env = await import('../src/config/env.js')
      ;(env as { env: { CLIENT_KEYS: Map<string, string> } }).env.CLIENT_KEYS = new Map([
        ['test-key-tauri', 'tauri'],
        ['test-key-pages', 'pages']
      ])
      app = await createApp()
    })

    afterEach(async () => {
      // Restore the empty default so other test files are unaffected.
      const env = await import('../src/config/env.js')
      ;(env as { env: { CLIENT_KEYS: Map<string, string> } }).env.CLIENT_KEYS = new Map()
      delete process.env.CLIENT_KEYS
    })

    it('rejects GET /api/books without X-Client-Key (401 MISSING_CLIENT_KEY)', async () => {
      const res = await request(app).get('/api/books')
      expect(res.status).toBe(401)
      expect(res.body.error.code).toBe('MISSING_CLIENT_KEY')
    })

    it('rejects GET /api/books with an unknown key (401 INVALID_CLIENT_KEY)', async () => {
      const res = await request(app).get('/api/books').set('X-Client-Key', 'not-a-real-key')
      expect(res.status).toBe(401)
      expect(res.body.error.code).toBe('INVALID_CLIENT_KEY')
    })

    it('accepts GET /api/books with a known key', async () => {
      const res = await request(app).get('/api/books').set('X-Client-Key', 'test-key-tauri')
      expect(res.status).toBe(200)
    })

    it('lets older app builds that still send X-User-Uuid through the preflight', async () => {
      const preflight = await request(app)
        .options('/api/books')
        .set('Origin', 'http://tauri.localhost')
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Headers', 'x-client-key,x-user-uuid')
      expect(preflight.status).toBe(204)
      expect(preflight.headers['access-control-allow-origin']).toBe('*')
      expect(preflight.headers['access-control-allow-headers'].toLowerCase()).toContain('x-user-uuid')

      const res = await request(app)
        .get('/api/books')
        .set('Origin', 'http://tauri.localhost')
        .set('X-Client-Key', 'test-key-tauri')
        .set('X-User-Uuid', '00000000-0000-4000-8000-000000000000')
      expect(res.status).toBe(200)
    })

    it('does not gate admin write endpoints — 401 still comes from basic auth, not the client-key middleware', async () => {
      const res = await request(app).post('/api/books').send(sampleBook())
      // Without basic-auth header → basicAuthGuard 401, not the
      // client-key middleware (which would return code MISSING_CLIENT_KEY).
      expect(res.status).toBe(401)
      expect(res.body?.error?.code).not.toBe('MISSING_CLIENT_KEY')
      expect(res.body?.error?.code).not.toBe('INVALID_CLIENT_KEY')
    })

    it('admin write succeeds with basic auth alone (no X-Client-Key needed)', async () => {
      const res = await request(app)
        .post('/api/books')
        .set('Authorization', ADMIN_AUTH)
        .send(sampleBook())
      expect(res.status).toBe(201)
    })
  })
})
