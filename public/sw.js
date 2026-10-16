/* LambKing: a small service worker for the web version, so the app opens and the coloring screen works without a net.
 *
 * It keeps lean on purpose: it only remembers what the app has already loaded (nothing is fetched ahead), it never
 * touches other hosts (the API), it leaves out the big audio files, and it keeps at most MAX_ENTRIES files.
 *  - /assets/…  files carry a hash in their name and never change: remembered for good (cache first).
 *  - /images/…  can change with a new version: shown from the memory at once and refreshed in the background.
 *  - the page itself: from the net, and from the memory when there is no net.
 *  - /images/abenteuer/ and /audio/abenteuer/ : the downloaded journeys (`lk-v1-pack-<journey>`, filled by the app on request) come from the
 *    memory first, with no check on the net; what was not downloaded is loaded as usual.
 */
const VERSION = 'lk-v1'
// `files2`: the first file memory could hold the page for a picture that was not there yet (the host answers every unknown address with the page)
const FILES = `${VERSION}-files2`
const MAX_ENTRIES = 260

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (!key.startsWith(VERSION) || key === `${VERSION}-files`) await caches.delete(key)
      await self.clients.claim()
    })()
  )
})

/** The oldest files go first when there are too many. */
async function trim(cache) {
  const keys = await cache.keys()
  for (let i = 0; i < keys.length - MAX_ENTRIES; i++) await cache.delete(keys[i])
}

async function put(cache, request, response) {
  if (!response || response.status !== 200 || response.type === 'opaque') return
  // a picture, font or sound is never a web page: the host answers unknown addresses with the page, which must not be kept as a picture
  const isPage = new URL(request.url).pathname === new URL(self.registration.scope).pathname
  if (!isPage && (response.headers.get('content-type') || '').includes('text/html')) return
  await cache.put(request, response.clone())
  await trim(cache)
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  // other hosts (the API, the book server) are not ours to keep
  if (url.origin !== self.location.origin) return
  const path = url.pathname

  // the page: from the net, from the memory when offline
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(FILES)
        try {
          // `no-cache`: ask the server whether the page changed. A back step from another site would otherwise be answered
          // from the browser's old copy of the page, which still points to the old app files.
          const fresh = await fetch(request.url, { cache: 'no-cache', credentials: 'same-origin' })
          await put(cache, new Request(self.registration.scope), fresh)
          return fresh
        } catch {
          return (await cache.match(self.registration.scope)) || (await cache.match(request)) || Response.error()
        }
      })()
    )
    return
  }

  if (path.includes('/audiobooks/') || path.endsWith('/sw.js')) return

  // a downloaded journey: from its pack at once (in whatever cache it lies), otherwise from the net
  if (path.includes('/images/abenteuer/') || path.includes('/audio/abenteuer/')) {
    event.respondWith(
      (async () => {
        const hit = await caches.match(request)
        if (hit) return hit
        const fresh = await fetch(request)
        if (path.includes('/images/abenteuer/')) {
          const cache = await caches.open(FILES)
          await put(cache, request, fresh)
        }
        return fresh
      })()
    )
    return
  }

  // files with a hash in their name: never change
  if (path.includes('/assets/')) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(FILES)
        const hit = await cache.match(request)
        if (hit) return hit
        const fresh = await fetch(request)
        await put(cache, request, fresh)
        return fresh
      })()
    )
    return
  }

  // pictures: from the memory at once, and made fresh in the background
  if (path.includes('/images/') || /\.(webp|png|jpg|jpeg|svg|woff2?|ttf)$/i.test(path)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(FILES)
        const hit = await cache.match(request)
        const refresh = fetch(request)
          .then(async (fresh) => {
            await put(cache, request, fresh)
            return fresh
          })
          .catch(() => null)
        if (hit) {
          event.waitUntil(refresh)
          return hit
        }
        return (await refresh) || Response.error()
      })()
    )
  }
})
