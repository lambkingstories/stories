// The service worker of the web version (public/sw.js), run against a small pretend browser: a cache that remembers
// responses, a net that can go away, and the fetch event.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'

type Handler = (event: unknown) => void

class FakeCache {
  store = new Map<string, Response>()
  async match(req: Request | string) {
    const url = typeof req === 'string' ? req : req.url
    return this.store.get(url)?.clone()
  }
  async put(req: Request | string, res: Response) {
    this.store.set(typeof req === 'string' ? req : req.url, res)
  }
  async keys() {
    return [...this.store.keys()].map((u) => new Request(u))
  }
  async delete(req: Request | string) {
    return this.store.delete(typeof req === 'string' ? req : req.url)
  }
}

function setup() {
  const handlers: Record<string, Handler> = {}
  const caches = new Map<string, FakeCache>()
  const net = { online: true, calls: [] as string[], files: {} as Record<string, string> }
  const fakeCaches = {
    async open(name: string) {
      if (!caches.has(name)) caches.set(name, new FakeCache())
      return caches.get(name)!
    },
    async keys() {
      return [...caches.keys()]
    },
    async delete(name: string) {
      return caches.delete(name)
    }
  }
  const fakeFetch = async (req: Request | string) => {
    const url = typeof req === 'string' ? req : req.url
    net.calls.push(url)
    if (!net.online) throw new TypeError('offline')
    const body = net.files[new URL(url).pathname]
    if (body === undefined) return new Response('nope', { status: 404 })
    return new Response(body, { status: 200 })
  }
  const self = {
    location: { origin: 'https://lk.test' },
    registration: { scope: 'https://lk.test/' },
    clients: { claim: async () => undefined },
    skipWaiting: () => undefined,
    addEventListener: (type: string, fn: Handler) => {
      handlers[type] = fn
    }
  }
  const source = readFileSync(resolve(__dirname, '../public/sw.js'), 'utf-8')
  new Function('self', 'caches', 'fetch', 'Request', 'Response', source)(self, fakeCaches, fakeFetch, Request, Response)

  /** Sends a fetch event; resolves to the response the worker gave, or `null` when it left the request to the browser. */
  async function ask(url: string, mode: RequestMode = 'no-cors') {
    const request = new Request(url)
    Object.defineProperty(request, 'mode', { value: mode })
    let answer: Promise<Response> | null = null
    const waits: Promise<unknown>[] = []
    handlers.fetch!({ request, respondWith: (p: Promise<Response>) => (answer = p), waitUntil: (p: Promise<unknown>) => waits.push(p) })
    const res = answer ? await answer : null
    await Promise.all(waits)
    return res
  }
  return { ask, net, caches, handlers }
}

let sw: ReturnType<typeof setup>

beforeEach(() => {
  sw = setup()
  sw.net.files = {
    '/': '<html>index</html>',
    '/assets/app-abc123.js': 'js-v1',
    '/images/a.webp': 'img-v1',
    '/audiobooks/story.mp3': 'audio'
  }
})

describe('service worker', () => {
  it('leaves other hosts alone (the API), and the big audio files', async () => {
    expect(await sw.ask('https://api.other.test/api/books')).toBeNull()
    expect(await sw.ask('https://lk.test/audiobooks/story.mp3')).toBeNull()
    expect(sw.caches.size).toBe(0)
  })

  it('keeps hashed files for good: the second time they do not touch the net', async () => {
    const first = await sw.ask('https://lk.test/assets/app-abc123.js')
    expect(await first!.text()).toBe('js-v1')
    const before = sw.net.calls.length
    sw.net.online = false
    const second = await sw.ask('https://lk.test/assets/app-abc123.js')
    expect(await second!.text()).toBe('js-v1')
    expect(sw.net.calls.length).toBe(before)
  })

  it('shows pictures from the memory at once and refreshes them in the background', async () => {
    expect(await (await sw.ask('https://lk.test/images/a.webp'))!.text()).toBe('img-v1')
    sw.net.files['/images/a.webp'] = 'img-v2'
    // the old one is shown at once, the new one is fetched for next time
    expect(await (await sw.ask('https://lk.test/images/a.webp'))!.text()).toBe('img-v1')
    expect(await (await sw.ask('https://lk.test/images/a.webp'))!.text()).toBe('img-v2')
  })

  it('opens the page from the memory when there is no net', async () => {
    await sw.ask('https://lk.test/', 'navigate')
    sw.net.online = false
    const offline = await sw.ask('https://lk.test/', 'navigate')
    expect(await offline!.text()).toBe('<html>index</html>')
  })

  it('takes the page from the net when there is one (so a new version is found)', async () => {
    await sw.ask('https://lk.test/', 'navigate')
    sw.net.files['/'] = '<html>index v2</html>'
    expect(await (await sw.ask('https://lk.test/', 'navigate'))!.text()).toBe('<html>index v2</html>')
  })

  it('does not keep an error answer', async () => {
    const res = await sw.ask('https://lk.test/images/missing.webp')
    expect(res!.status).toBe(404)
    sw.net.online = false
    // nothing was kept, so offline there is simply no picture
    await expect(sw.ask('https://lk.test/images/missing.webp')).resolves.toBeInstanceOf(Response)
  })

  it('keeps at most a fixed number of files', async () => {
    for (let i = 0; i < 300; i++) sw.net.files[`/assets/f${i}.js`] = String(i)
    for (let i = 0; i < 300; i++) await sw.ask(`https://lk.test/assets/f${i}.js`)
    const cache = [...sw.caches.values()][0]!
    expect((await cache.keys()).length).toBeLessThanOrEqual(260)
    // the newest are still there
    expect(await cache.match('https://lk.test/assets/f299.js')).toBeDefined()
  })

  it('ignores requests that are not GET', async () => {
    const request = new Request('https://lk.test/assets/app-abc123.js', { method: 'POST' })
    let called = false
    sw.handlers.fetch!({ request, respondWith: () => (called = true) })
    expect(called).toBe(false)
  })
})
