<script setup lang="ts">
/**
 * One coloring book as a real coloring book: the pages can be turned, every page
 * shows how far it is painted, and from here the child goes on painting (the
 * current page) or wipes the colours of a single page to start it again.
 * The paintings live on the device (see `useArtworks`); the pages come from the
 * book in the backend.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import useApiBooks from '@/use/useApiBooks'
import type { ApiBook } from '@/types/apiBook'
import { coloringPagesOfBook, type ColoringBookPage } from '@/utils/coloringBook'
import { deleteArtwork, getDrawing, listArtworks, pageArtworkId, type ArtworkMeta } from '@/use/useArtworks'
import { LINE_ICONS } from '@/data/coloringKits'
import { prependBaseUrl } from '@/utils/function'
import { goBackTo } from '@/utils/navBack'
import { cacheUrlToBlobUrl } from '@/use/useBookCache'
import { allowedPages, freePageCount } from '@/use/useBookAccess'
import usePremium from '@/use/usePremium'
import { pickLocalizedImage } from '@/types/apiBook'
import { openExternal } from '@/utils/openExternal'

const { t, locale } = useI18n({ useScope: 'global' })
const route = useRoute()
const router = useRouter()
const { loadBook } = useApiBooks()
const { showUpsell } = usePremium()

const bookId = computed(() => String(route.params.bookId))
const title = ref('')
const shopLink = ref('')
/** Where the printed book is sold (Amazon) in the language of the app; empty when there is none for this language. */
const printedLink = ref('')
/** The number of free pictures of this book, when it has its own (see the AdminUI). */
const ownFree = ref<number | null>(null)
const pages = ref<ColoringBookPage[]>([])
const loading = ref(true)
const failed = ref(false)

/** Saved paintings of this device, by artwork id. */
const works = ref<Record<string, ArtworkMeta>>({})
/** The painted layer of the page on show (object URL), by page index. */
const layers = ref<Record<number, string>>({})

const index = ref(0)
const page = computed(() => pages.value[index.value] ?? null)
const idOf = (p: ColoringBookPage) => pageArtworkId(p.url, 1)
const isPainted = (p: ColoringBookPage) => !!works.value[idOf(p)]
const starImage = prependBaseUrl('images/awards/star.webp')
const thumbOf = (p: ColoringBookPage) => works.value[idOf(p)]?.thumb ?? ''
const paintedCount = computed(() => pages.value.filter(isPainted).length)
/** Pictures that may be painted: all of them, or the free ones while the book is locked. */
const allowed = computed(() => allowedPages(bookId.value, 'coloring', pages.value.length, ownFree.value))
const isLockedPage = (i: number) => i >= allowed.value
const pageLocked = computed(() => isLockedPage(index.value))

function unlock() {
  showUpsell('book', {
    bookId: bookId.value,
    kind: 'coloring',
    title: title.value,
    freePages: freePageCount('coloring', pages.value.length, ownFree.value),
    totalPages: pages.value.length,
    shopLink: shopLink.value || undefined
  })
}

const current = computed(() => (page.value ? works.value[idOf(page.value)] ?? null : null))

async function refreshWorks() {
  const map: Record<string, ArtworkMeta> = {}
  for (const w of await listArtworks()) map[w.id] = w
  works.value = map
}

/** The line art of pages, from the device when the book was opened before (so it also shows without a connection). */
const lines = ref<Record<string, string>>({})

async function loadLine(i: number) {
  const p = pages.value[i]
  if (!p || lines.value[p.url]) return
  const src = await cacheUrlToBlobUrl(p.url, bookId.value)
  lines.value = { ...lines.value, [p.url]: src }
}

/** Loads the painted layer of a page so it shows in full size, not just as a thumbnail. */
async function loadLayer(i: number) {
  const p = pages.value[i]
  if (!p || layers.value[i] || !isPainted(p)) return
  const blob = await getDrawing(idOf(p))
  if (blob) layers.value = { ...layers.value, [i]: URL.createObjectURL(blob) }
}

function dropLayers() {
  for (const url of Object.values(layers.value)) URL.revokeObjectURL(url)
  layers.value = {}
  for (const [orig, url] of Object.entries(lines.value)) if (url !== orig) URL.revokeObjectURL(url)
  lines.value = {}
}

// ── Turning pages -----------------------------------------------------------------------

function go(i: number) {
  if (i < 0 || i >= pages.value.length) return
  index.value = i
}

let startX: number | null = null
let startY = 0

function onPointerDown(e: PointerEvent) {
  startX = e.clientX
  startY = e.clientY
}

function onPointerUp(e: PointerEvent) {
  if (startX === null) return
  const dx = e.clientX - startX
  const dy = e.clientY - startY
  startX = null
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) go(index.value + (dx < 0 ? 1 : -1))
}

function onKeydown(e: KeyboardEvent) {
  if (confirming.value) return
  if (e.key === 'ArrowRight') go(index.value + 1)
  else if (e.key === 'ArrowLeft') go(index.value - 1)
}

// The strip of small pages keeps the page on show in view.
const strip = ref<HTMLElement | null>(null)

function scrollStrip() {
  void nextTick(() => {
    const el = strip.value
    const cur = el?.querySelector<HTMLElement>('.bk-thumb.current')
    if (!el || !cur) return
    el.scrollTo({ left: cur.offsetLeft - (el.clientWidth - cur.offsetWidth) / 2, behavior: 'smooth' })
  })
}

/** The next page's picture is fetched ahead, so turning the page is instant. */
function prefetch(i: number) {
  void loadLine(i)
}

watch(index, (i) => {
  void loadLine(i)
  void loadLayer(i)
  scrollStrip()
  prefetch(i + 1)
})

// ── Painting and starting again ---------------------------------------------------------

function paint() {
  const p = page.value
  if (!p) return
  if (pageLocked.value) {
    unlock()
    return
  }
  // in place of the overview: the history keeps only the menu, so one step back leaves the book again
  void router.replace({ name: 'app-coloring', query: { book: bookId.value, p: String(p.n) } })
}

const confirming = ref(false)

async function resetPage() {
  confirming.value = false
  const p = page.value
  if (!p) return
  await deleteArtwork(idOf(p))
  const url = layers.value[index.value]
  if (url) URL.revokeObjectURL(url)
  const rest = { ...layers.value }
  delete rest[index.value]
  layers.value = rest
  await refreshWorks()
}

function back() {
  goBackTo(router, { name: 'app-coloring' })
}

// ── Start ---------------------------------------------------------------------------------

async function start() {
  loading.value = true
  failed.value = false
  try {
    const [book] = await Promise.all([loadBook(bookId.value), refreshWorks()])
    const list = book ? coloringPagesOfBook(book as ApiBook, locale.value) : []
    if (!book || !list.length) {
      failed.value = true
      return
    }
    const loc = book.localizations as Record<string, { title?: string } | null | undefined>
    title.value = (loc[locale.value]?.title || loc.de?.title || bookId.value).replace(/^Buch\s*\d+\s*[–-]\s*/i, '')
    pages.value = list
    ownFree.value = (book as ApiBook).freePages ?? null
    shopLink.value = pickLocalizedImage((book as ApiBook).etsyLink, locale.value === 'en' ? 'en' : 'de')
    printedLink.value = (book as ApiBook).etsyLink?.[locale.value === 'en' ? 'en' : 'de'] ?? ''
    // Back from the editor the page that was painted last is open (or the one named in the address);
    // a new book starts at page one.
    const wanted = Number(route.query.p)
    if (Number.isFinite(wanted) && wanted >= 1 && wanted <= list.length) {
      index.value = wanted - 1
    } else {
      let best = -1
      let when = 0
      list.forEach((p, i) => {
        const w = works.value[idOf(p)]
        if (w && w.updatedAt > when) {
          when = w.updatedAt
          best = i
        }
      })
      index.value = Math.max(0, best)
    }
    await Promise.all([loadLine(index.value), loadLayer(index.value)])
    scrollStrip()
  } catch (err) {
    console.error('coloring book load error', err)
    failed.value = true
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  void start()
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  dropLayers()
})
watch(bookId, () => {
  dropLayers()
  void start()
})
</script>

<template lang="pug">
  div(class="bk")
    header(class="bk-top")
      button(type="button" class="bk-btn" :aria-label="t('app.coloring.back')" @click="back")
        img(:src="LINE_ICONS.back" alt="" draggable="false")
      div(class="bk-head")
        h1(class="bk-title") {{ title || t('app.coloring.books') }}
        p(v-if="pages.length" class="bk-progress") {{ t('app.coloring.pagesPainted', { done: paintedCount, total: pages.length }) }}

    p(v-if="loading" class="bk-note") {{ t('app.coloring.loading') }}
    p(v-else-if="failed" class="bk-note") {{ t('app.coloring.bookFailed') }}

    template(v-else-if="page")
      main(class="bk-stage")
        button(
          type="button"
          class="bk-arrow bk-prev"
          :disabled="index <= 0"
          :aria-label="t('app.coloring.prevPage')"
          @click="go(index - 1)"
        ) ‹

        //- The page as it looks now: the child's paint underneath, the line art multiplied on top.
        div(
          class="bk-sheet"
          :key="page.url"
          @pointerdown="onPointerDown"
          @pointerup="onPointerUp"
          @pointercancel="startX = null"
        )
          img(v-if="layers[index]" class="bk-paint" :src="layers[index]" alt="" draggable="false")
          img(class="bk-line" :class="{ faded: pageLocked }" :src="lines[page.url] || page.url" :alt="page.title" draggable="false")
          span(v-if="pageLocked" class="bk-lock" aria-hidden="true") 🔒

        button(
          type="button"
          class="bk-arrow bk-next"
          :disabled="index >= pages.length - 1"
          :aria-label="t('app.coloring.nextPage')"
          @click="go(index + 1)"
        ) ›

      section(class="bk-info")
        p(class="bk-page-no") {{ t('app.coloring.pageOf', { n: index + 1, total: pages.length }) }}
        h2(class="bk-page-title") {{ page.title }}
        p(v-if="page.reference" class="bk-ref") {{ page.reference }}
        p(v-if="page.text" class="bk-text") {{ page.text }}

      div(class="bk-actions")
        button(type="button" class="bk-primary" @click="paint") {{ pageLocked ? t('app.coloring.unlockBook') : current ? t('app.coloring.continuePaint') : t('app.coloring.startPaint') }}
        button(v-if="current" type="button" class="bk-secondary" @click="confirming = true") {{ t('app.coloring.resetPage') }}

      button(v-if="printedLink" type="button" class="bk-printed" @click="openExternal(printedLink)") {{ t('app.coloring.printedAt') }} ›

      nav(ref="strip" class="bk-strip" :aria-label="t('app.coloring.books')")
        button(
          v-for="(p, i) in pages"
          :key="p.url"
          type="button"
          class="bk-thumb"
          :class="{ current: i === index, painted: isPainted(p), locked: isLockedPage(i) }"
          :aria-label="t('app.coloring.pageOf', { n: i + 1, total: pages.length })"
          @click="go(i)"
        )
          //- Only painted pages have a small picture (saved with the painting); the others are plain sheets,
          //- so the strip does not have to download every page of the book.
          img(v-if="thumbOf(p)" :src="thumbOf(p)" alt="" draggable="false")
          span(class="bk-thumb-n") {{ isLockedPage(i) ? '🔒' : i + 1 }}
          img(v-if="works[idOf(p)]?.done" class="bk-thumb-star" :src="starImage" alt="" draggable="false")

    div(
      v-if="confirming"
      class="bk-overlay"
      role="dialog"
      aria-modal="true"
      @click.self="confirming = false"
    )
      div(class="bk-dialog")
        h2 {{ t('app.coloring.resetTitle') }}
        p {{ t('app.coloring.resetBody') }}
        div(class="bk-dialog-actions")
          button(type="button" class="bk-secondary" @click="confirming = false") {{ t('app.coloring.deleteNo') }}
          button(type="button" class="bk-danger" @click="resetPage") {{ t('app.coloring.resetYes') }}
</template>

<style scoped lang="sass">
$ink: #22262e
$muted: #6c7280
$accent: #1f3a5f
$glass: rgba(252, 251, 248, 0.88)

.bk
  position: fixed
  inset: 0
  display: flex
  flex-direction: column
  align-items: center
  gap: 10px
  padding: max(env(safe-area-inset-top, 0px), 10px) 12px max(env(safe-area-inset-bottom, 0px), 10px)
  background: radial-gradient(ellipse at 50% 30%, #fff2d9 0%, #fbdcae 55%, #f3c58b 100%)
  color: $ink
  overflow-y: auto
  -webkit-overflow-scrolling: touch

.bk-top
  width: 100%
  max-width: 980px
  display: flex
  align-items: center
  gap: 12px

.bk-btn
  flex: 0 0 auto
  width: 42px
  height: 42px
  display: grid
  place-items: center
  border: 1px solid rgba(20, 24, 32, 0.1)
  border-radius: 12px
  background: $glass
  box-shadow: 0 2px 10px rgba(20, 24, 32, 0.15)
  cursor: pointer

  img
    width: 20px
    height: 20px
    object-fit: contain

.bk-head
  min-width: 0

.bk-title
  margin: 0
  font-size: 1.05rem
  font-weight: 800
  line-height: 1.2
  overflow: hidden
  text-overflow: ellipsis
  white-space: nowrap

.bk-progress
  margin: 2px 0 0
  font-size: 0.8rem
  font-weight: 600
  color: $muted

.bk-printed
  min-height: 44px
  padding: 0 18px
  border: 1px solid rgba(20, 24, 32, 0.12)
  border-radius: 12px
  background: $glass
  color: $accent
  font-family: inherit
  font-weight: 700
  font-size: 0.95rem
  cursor: pointer

.bk-note
  margin: 40px 0
  font-weight: 700
  color: $muted

.bk-stage
  width: 100%
  max-width: 980px
  flex: 1 1 auto
  min-height: 260px
  display: flex
  align-items: center
  justify-content: center
  gap: 8px

.bk-arrow
  flex: 0 0 auto
  width: 44px
  height: 64px
  border: 1px solid rgba(20, 24, 32, 0.1)
  border-radius: 14px
  background: $glass
  color: $ink
  font-size: 1.8rem
  font-weight: 800
  line-height: 1
  cursor: pointer
  box-shadow: 0 2px 10px rgba(20, 24, 32, 0.15)

  &:disabled
    opacity: 0.35
    cursor: default

// The sheet keeps the picture's 3:4 shape and takes as much room as there is.
.bk-sheet
  position: relative
  height: 100%
  max-height: calc(100vh - 330px)
  min-height: 220px
  aspect-ratio: 3 / 4
  max-width: calc(100% - 104px)
  background: #ffffff
  border-radius: 4px
  box-shadow: 0 14px 34px -14px rgba(60, 40, 10, 0.55)
  touch-action: pan-y
  user-select: none

  img
    position: absolute
    inset: 0
    width: 100%
    height: 100%
    object-fit: contain
    pointer-events: none

.bk-line
  mix-blend-mode: multiply

  &.faded
    opacity: 0.35

.bk-lock
  position: absolute
  left: 50%
  top: 50%
  transform: translate(-50%, -50%)
  font-size: 2.4rem
  filter: drop-shadow(0 2px 6px rgba(20, 24, 32, 0.35))

.bk-info
  width: 100%
  max-width: 640px
  text-align: center

.bk-page-no
  margin: 0
  font-size: 0.72rem
  font-weight: 800
  letter-spacing: 0.08em
  text-transform: uppercase
  color: $muted

.bk-page-title
  margin: 2px 0 0
  font-size: 1.05rem
  font-weight: 800

.bk-ref
  margin: 2px 0 0
  font-size: 0.8rem
  font-weight: 700
  color: $accent

.bk-text
  margin: 6px 0 0
  font-size: 0.88rem
  line-height: 1.45
  color: #3b4150

.bk-actions
  display: flex
  flex-wrap: wrap
  gap: 10px
  justify-content: center

.bk-primary,
.bk-secondary,
.bk-danger
  font: inherit
  font-weight: 800
  font-size: 0.95rem
  min-height: 46px
  padding: 0 22px
  border-radius: 999px
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  &:active
    transform: scale(0.97)

.bk-primary
  border: 0
  background: $accent
  color: #ffffff
  box-shadow: 0 8px 18px -8px rgba(31, 58, 95, 0.7)

.bk-secondary
  border: 1px solid rgba(20, 24, 32, 0.18)
  background: $glass
  color: $ink

.bk-danger
  border: 0
  background: #a93d2e
  color: #ffffff

.bk-strip
  width: 100%
  max-width: 980px
  display: flex
  gap: 8px
  padding: 6px 4px 8px
  overflow-x: auto
  scrollbar-width: none
  &::-webkit-scrollbar
    display: none

.bk-thumb
  position: relative
  flex: 0 0 auto
  width: 54px
  aspect-ratio: 3 / 4
  padding: 0
  border: 2px solid transparent
  border-radius: 6px
  background: #ffffff
  overflow: hidden
  cursor: pointer
  box-shadow: 0 3px 8px -4px rgba(60, 40, 10, 0.5)

  img
    width: 100%
    height: 100%
    object-fit: cover
    display: block

  &.current
    border-color: $accent

.bk-thumb .bk-thumb-star
  position: absolute
  right: 1px
  top: 1px
  width: 18px
  height: 18px
  object-fit: contain
  filter: drop-shadow(0 1px 2px rgba(20, 24, 32, 0.4))

.bk-thumb-n
  position: absolute
  left: 2px
  bottom: 2px
  min-width: 16px
  padding: 0 3px
  border-radius: 6px
  background: rgba(252, 251, 248, 0.9)
  font-size: 0.62rem
  font-weight: 800
  line-height: 15px
  text-align: center

.bk-thumb:not(.painted) .bk-thumb-n
  left: 0
  bottom: 0
  right: 0
  top: 0
  display: grid
  place-items: center
  background: transparent
  font-size: 0.85rem
  color: $muted

.bk-overlay
  position: fixed
  inset: 0
  z-index: 50
  display: flex
  align-items: center
  justify-content: center
  padding: 20px
  background: rgba(20, 14, 6, 0.55)

.bk-dialog
  width: 100%
  max-width: 360px
  padding: 22px 22px 18px
  border-radius: 20px
  background: #fffaf0
  box-shadow: 0 20px 60px -16px rgba(58, 42, 18, 0.5)

  h2
    margin: 0 0 8px
    font-size: 1.15rem
    font-weight: 800

  p
    margin: 0 0 18px
    font-size: 0.95rem
    line-height: 1.45
    color: #3b4150

.bk-dialog-actions
  display: flex
  gap: 8px
  justify-content: flex-end
  flex-wrap: wrap

@media (max-width: 640px)
  .bk-arrow
    width: 34px
    height: 52px
  .bk-sheet
    max-width: calc(100% - 84px)
    max-height: calc(100vh - 360px)
</style>
