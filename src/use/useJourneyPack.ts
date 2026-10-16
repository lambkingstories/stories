/**
 * The one-time download of a journey: all its pictures and sounds are fetched once (with a progress) and kept on the device, so
 * the journey opens at once and also works without a net. Only files of our own server are fetched; nothing about the child is
 * sent (the requests are plain downloads of the same files the journey shows anyway). The files are kept in the browser's cache
 * storage under the name `lk-v1-pack-<journey>`, which the service worker (`public/sw.js`) serves from.
 */
import { computed, reactive, ref } from 'vue'
import type { Journey } from '@/types/adventure'
import { journeyFiles, PACK_VERSION } from '@/utils/journeyFiles'
import { prependBaseUrl } from '@/utils/function'

const KEY = 'lk-journey-packs'
const CACHE_PREFIX = 'lk-v1-pack-'
const cacheName = (id: string) => `${CACHE_PREFIX}${id}-v${PACK_VERSION}`

interface PackInfo {
  /** When it was downloaded. */
  at: number
  files: number
  /** `PACK_VERSION` when it was downloaded; an older pack is loaded again. */
  v?: number
  /** How many bytes it was (as far as the server said). */
  bytes: number
}

function load(): Record<string, PackInfo> {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Record<string, PackInfo> | null
    if (raw && typeof raw === 'object') return raw
  } catch {
    // none yet
  }
  return {}
}

const packs = reactive<Record<string, PackInfo>>(load())

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(packs))
  } catch {
    // a private window: nothing is remembered
  }
}

const supported = typeof caches !== 'undefined'

/** Runs `worker` over the items, a few at a time. */
async function pool<T>(items: T[], size: number, worker: (item: T) => Promise<void>, stopped: () => boolean) {
  let next = 0
  const run = async () => {
    while (next < items.length && !stopped()) {
      const item = items[next++]!
      await worker(item)
    }
  }
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, run))
}

export default function useJourneyPack() {
  /** Journey that is being downloaded now, and how far it is (0–1). */
  const busy = ref<string | null>(null)
  const progress = ref(0)
  const failed = ref(false)
  let cancelled = false

  const isReady = (id: string) => !!packs[id] && packs[id]!.v === PACK_VERSION
  const infoOf = (id: string): PackInfo | undefined => packs[id]

  /** Downloads all files of the journey. Resolves `true` when everything is there. */
  async function download(journey: Journey): Promise<boolean> {
    if (busy.value) return false
    const urls = journeyFiles(journey)
    busy.value = journey.id
    progress.value = 0
    failed.value = false
    cancelled = false
    let done = 0
    let bytes = 0
    try {
      // the old packs of this journey go: they would be served instead of the new files
      if (supported) for (const k of await caches.keys()) if (k.startsWith(CACHE_PREFIX + journey.id)) await caches.delete(k)
      const cache = supported ? await caches.open(cacheName(journey.id)) : null
      await pool(
        urls,
        4,
        async (path) => {
          const url = prependBaseUrl(path)
          const res = await fetch(url)
          if (!res.ok) throw new Error(`${res.status} ${path}`)
          bytes += Number(res.headers.get('content-length') ?? 0)
          if (cache) await cache.put(url, res)
          else await res.arrayBuffer()
          done++
          progress.value = done / urls.length
        },
        () => cancelled
      )
      if (cancelled) return false
      packs[journey.id] = { at: Date.now(), files: urls.length, bytes, v: PACK_VERSION }
      save()
      return true
    } catch {
      failed.value = true
      return false
    } finally {
      busy.value = null
    }
  }

  function cancel() {
    cancelled = true
  }

  /** Removes the downloaded files again (the progress of the child stays). */
  async function remove(id: string) {
    delete packs[id]
    save()
    if (supported) for (const k of await caches.keys()) if (k.startsWith(CACHE_PREFIX + id)) await caches.delete(k)
  }

  return { busy, progress, failed, isReady, infoOf, download, cancel, remove, supported, anyReady: computed(() => Object.keys(packs).length > 0) }
}
