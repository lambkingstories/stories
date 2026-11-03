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
import { goBackTo, previousPath } from '@/utils/navBack'
import useColoringShelf from '@/use/useColoringShelf'
import { cacheUrlToBlobUrl } from '@/use/useBookCache'
import { allowedPages, freePageCount } from '@/use/useBookAccess'
import usePremium from '@/use/usePremium'
import usePurchases from '@/use/usePurchases'
import { plusOffer } from '@/data/plus'
import { bookProductId } from '@/data/plusProducts'
import { requireParent } from '@/use/useParentalGate'
import { pickLocalizedImage } from '@/types/apiBook'
import { openExternal } from '@/utils/openExternal'
import ColoringSpread from '@/components/molecules/ColoringSpread.vue'
import { contentLocale } from '@/utils/contentLocale'

const { t, locale } = useI18n({ useScope: 'global' })
const route = useRoute()
const router = useRouter()
const { loadBook } = useApiBooks()
const { showUpsell } = usePremium()
const paintShelf = useColoringShelf()

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
/** The book is not open in full: the card with the two ways to unlock it is on show. */
const bookLocked = computed(() => pages.value.length > 0 && allowed.value < pages.value.length)

const purchases = usePurchases()
const bookPrice = computed(() => purchases.prices.value[bookProductId(bookId.value)] ?? plusOffer.book)
watch(bookId, (id) => {
  if (id) void purchases.loadBookPrice(id)
}, { immediate: true })

/** Plus is a matter for grown-ups: the way to its page leads through the parental gate. */
async function openPlus() {
  if (!(await requireParent())) return
  void router.push({ name: 'app-plus' })
}

/** Buying the single book: in the app from the store the purchase starts, elsewhere the sheet says it is coming. */
function buyBook() {
  if (purchases.available) void purchases.buyBook(bookId.value)
  else unlock()
}

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

const spread = ref<InstanceType<typeof ColoringSpread> | null>(null)
const crown = prependBaseUrl('images/icons/navi/plus.webp')
const brush = prependBaseUrl('images/icons/navi/malen.webp')
const share = computed(() => (pages.value.length ? Math.round((paintedCount.value / pages.value.length) * 100) : 0))

/** Turns to a page: the open book turns the leaf, then the page number is set (see `ColoringSpread`). */
function go(i: number) {
  if (i < 0 || i >= pages.value.length) return
  if (spread.value) void spread.value.flip(i)
  else index.value = i
}

/** The book has turned to this page. */
function setIndex(i: number) {
  if (i >= 0 && i < pages.value.length) index.value = i
}

/** The pictures of a page are ready before the leaf turns to it. */
async function prepare(i: number) {
  await Promise.all([loadLine(i), loadLayer(i)])
}
const lineOf = (p: ColoringBookPage) => lines.value[p.url] || p.url
const layerOf = (i: number) => layers.value[i] ?? ''

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
  // a book that is painted in stands on the paint shelf
  paintShelf.add(bookId.value)
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
  // opened from the list of coloring books: one step back leads to the list again
  if (previousPath()?.startsWith('/app/coloring-books')) {
    router.back()
    return
  }
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
    shopLink.value = pickLocalizedImage((book as ApiBook).etsyLink, contentLocale(locale.value))
    printedLink.value = (book as ApiBook).etsyLink?.[contentLocale(locale.value)] ?? ''
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
        span(v-if="pages.length" class="bk-meter" aria-hidden="true")
          span(class="bk-meter-fill" :style="{ width: share + '%' }")

    p(v-if="loading" class="bk-note") {{ t('app.coloring.loading') }}
    p(v-else-if="failed" class="bk-note") {{ t('app.coloring.bookFailed') }}

    template(v-else-if="page")
      //- the book lies open: the words on the left, the picture on the right
      main(class="bk-stage")
        ColoringSpread(
          ref="spread"
          :pages="pages"
          :index="index"
          :line-of="lineOf"
          :layer-of="layerOf"
          :is-locked="isLockedPage"
          :prepare="prepare"
          :arrows="false"
          @go="setIndex"
          @paint="paint"
        )

      //- everything the child can do with the page, in one place
      section(class="bk-dock")
        div(class="bk-row")
          button(type="button" class="bk-nav" :disabled="index <= 0" :aria-label="t('app.coloring.prevPage')" @click="go(index - 1)") ‹
          button(type="button" class="bk-primary" @click="paint")
            span(class="bk-primary-ico")
              img(:src="pageLocked ? crown : brush" alt="" draggable="false")
            span {{ pageLocked ? t('app.coloring.unlockBook') : current ? t('app.coloring.continuePaint') : t('app.coloring.startPaint') }}
          button(type="button" class="bk-nav" :disabled="index >= pages.length - 1" :aria-label="t('app.coloring.nextPage')" @click="go(index + 1)") ›

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
            //- Only painted pages have a small picture (saved with the painting); the others are plain chips,
            //- so the strip does not have to download every page of the book.
            img(v-if="thumbOf(p)" :src="thumbOf(p)" alt="" draggable="false")
            img(v-if="isLockedPage(i)" class="bk-thumb-crown" :src="crown" alt="" draggable="false")
            span(v-else class="bk-thumb-n") {{ i + 1 }}
            img(v-if="works[idOf(p)]?.done" class="bk-thumb-star" :src="starImage" alt="" draggable="false")

        //- the two ways to open the whole book: Plus (all books) or this one book
        div(v-if="bookLocked" class="bk-offer")
          p(class="bk-offer-title") {{ t('app.coloring.offerTitle') }}
          div(class="bk-offer-cols")
            button(type="button" class="bk-offer-opt is-plus" @click="openPlus")
              span(class="bk-offer-name")
                img(:src="crown" alt="" draggable="false")
                | {{ t('app.premium.optPlus') }}
              span(class="bk-offer-price") {{ plusOffer.month }}
              span(class="bk-offer-text") {{ t('app.premium.optPlusMonth') }}
            button(type="button" class="bk-offer-opt is-plus is-best" @click="openPlus")
              span(class="bk-offer-name")
                img(:src="crown" alt="" draggable="false")
                | {{ t('app.premium.optPlus') }}
              span(class="bk-offer-price") {{ plusOffer.year }}
              span(class="bk-offer-text") {{ t('app.premium.optPlusYear') }} · {{ t('app.plus.cheaper') }}
            button(type="button" class="bk-offer-opt is-book" @click="buyBook")
              span(class="bk-offer-name") {{ t('app.premium.optBook') }}
              span(class="bk-offer-price") {{ bookPrice }}

        div(v-if="current || printedLink" class="bk-links")
          button(v-if="current" type="button" class="bk-link" @click="confirming = true") {{ t('app.coloring.resetPage') }}
          button(v-if="printedLink" type="button" class="bk-link" @click="openExternal(printedLink)") {{ t('app.coloring.printedAt') }} ›

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
$ink: var(--lk-text)
$muted: var(--lk-muted)
$accent: var(--lk-accent)

.bk
  position: fixed
  inset: 0
  display: flex
  flex-direction: column
  align-items: center
  gap: 12px
  padding: max(env(safe-area-inset-top, 0px), 10px) 14px max(env(safe-area-inset-bottom, 0px), 12px)
  background: var(--lk-bg)
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
  width: 44px
  height: 44px
  display: grid
  place-items: center
  border: 1px solid var(--lk-line)
  border-radius: 50%
  background: var(--lk-surface)
  box-shadow: var(--lk-shadow)
  cursor: pointer

  img
    width: 20px
    height: 20px
    object-fit: contain

.bk-head
  flex: 1 1 auto
  min-width: 0

.bk-title
  margin: 0
  font-size: 1.1rem
  font-weight: 800
  line-height: 1.2
  overflow: hidden
  text-overflow: ellipsis
  white-space: nowrap

.bk-progress
  margin: 2px 0 6px
  font-size: 0.8rem
  font-weight: 600
  color: $muted

.bk-meter
  display: block
  height: 6px
  border-radius: 6px
  background: var(--lk-track)
  overflow: hidden

.bk-meter-fill
  display: block
  height: 100%
  border-radius: 6px
  background: var(--lk-fill)
  transition: width 0.4s ease

.bk-note
  margin: 40px 0
  font-weight: 700
  color: $muted

.bk-stage
  width: 100%
  max-width: 1040px
  flex: 1 1 auto
  min-height: 340px
  display: flex
  justify-content: center

// one calm card under the book
.bk-dock
  width: 100%
  max-width: 560px
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px
  border: 1px solid var(--lk-line)
  border-radius: 26px
  background: var(--lk-surface)
  box-shadow: var(--lk-shadow)

.bk-row
  display: flex
  align-items: center
  gap: 10px

// what it costs to open the whole book: two calm choices side by side
.bk-offer
  padding: 12px
  border-radius: 18px
  background: var(--lk-accent-soft)

.bk-offer-title
  margin: 0 0 8px
  font-weight: 800
  font-size: 0.95rem
  text-align: center

.bk-offer-cols
  display: grid
  grid-template-columns: 1fr 1fr
  gap: 8px

.bk-offer-opt
  display: flex
  flex-direction: column
  align-items: center
  gap: 3px
  padding: 10px 8px
  border: 1px solid var(--lk-line)
  border-radius: 14px
  background: var(--lk-surface)
  color: $ink
  font: inherit
  text-align: center
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  &.is-plus
    border: 2px solid var(--lk-gold)

.bk-offer-opt.is-book
  grid-column: 1 / -1

.bk-offer-name
  display: flex
  align-items: center
  gap: 5px
  font-weight: 800
  font-size: 0.95rem

  img
    width: 22px
    height: 22px
    object-fit: contain

.bk-offer-text
  font-size: 0.8rem
  line-height: 1.25
  color: $muted

.bk-offer-price
  margin-top: 2px
  font-weight: 800
  font-size: 1rem
  color: $accent

.bk-nav
  flex: 0 0 auto
  width: 46px
  height: 46px
  border: 1px solid var(--lk-line)
  border-radius: 50%
  background: transparent
  color: $ink
  font: inherit
  font-size: 1.6rem
  font-weight: 700
  line-height: 1
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  &:disabled
    opacity: 0.3
    cursor: default

.bk-primary,
.bk-secondary,
.bk-danger
  font: inherit
  font-weight: 800
  font-size: 1rem
  min-height: 48px
  padding: 0 22px
  border-radius: 999px
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  &:active
    transform: scale(0.98)

.bk-primary
  flex: 1 1 auto
  display: flex
  align-items: center
  justify-content: center
  gap: 10px
  min-height: 50px
  border: 0
  background: var(--lk-accent)
  color: var(--lk-on-accent)

.bk-primary-ico
  display: grid
  place-items: center
  width: 30px
  height: 30px
  border-radius: 50%
  background: #fff

  img
    width: 24px
    height: 24px
    object-fit: contain

.bk-secondary
  border: 1px solid var(--lk-line)
  background: var(--lk-surface)
  color: $ink

.bk-danger
  border: 0
  background: #a93d2e
  color: #ffffff

// the pages as small chips, painted ones show their picture
.bk-strip
  display: flex
  gap: 8px
  padding: 4px 2px
  overflow-x: auto
  scrollbar-width: none
  &::-webkit-scrollbar
    display: none

.bk-thumb
  position: relative
  flex: 0 0 auto
  width: 40px
  height: 40px
  padding: 0
  border: 2px solid transparent
  border-radius: 12px
  background: var(--lk-bg)
  overflow: hidden
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  img
    width: 100%
    height: 100%
    object-fit: cover
    display: block

  &.current
    border-color: $accent
    box-shadow: 0 0 0 3px var(--lk-accent-soft)

.bk-thumb .bk-thumb-star
  position: absolute
  right: 0
  top: 0
  width: 16px
  height: 16px
  object-fit: contain
  filter: drop-shadow(0 1px 2px rgba(20, 24, 32, 0.4))

.bk-thumb .bk-thumb-crown
  position: absolute
  left: 50%
  top: 50%
  width: 62%
  height: auto
  object-fit: contain
  transform: translate(-50%, -50%)

.bk-thumb-n
  position: absolute
  inset: 0
  display: grid
  place-items: center
  font-size: 0.85rem
  font-weight: 800
  color: $muted

.bk-thumb.painted .bk-thumb-n
  inset: auto 2px 2px auto
  min-width: 16px
  padding: 0 3px
  border-radius: 6px
  background: rgba(250, 252, 250, 0.9)
  color: var(--lk-text)
  font-size: 0.62rem
  line-height: 15px

.bk-links
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 4px 18px

.bk-link
  min-height: 36px
  padding: 0 4px
  border: 0
  background: transparent
  color: $accent
  font: inherit
  font-size: 0.9rem
  font-weight: 700
  cursor: pointer

.bk-overlay
  position: fixed
  inset: 0
  z-index: 50
  display: flex
  align-items: center
  justify-content: center
  padding: 20px
  background: rgba(10, 25, 30, 0.55)

.bk-dialog
  width: 100%
  max-width: 360px
  padding: 22px 22px 18px
  border-radius: 24px
  background: var(--lk-surface)
  box-shadow: 0 20px 60px -16px rgba(10, 25, 30, 0.5)

  h2
    margin: 0 0 8px
    font-size: 1.15rem
    font-weight: 800

  p
    margin: 0 0 18px
    font-size: 0.95rem
    line-height: 1.45
    color: $muted

.bk-dialog-actions
  display: flex
  gap: 8px
  justify-content: flex-end
  flex-wrap: wrap

</style>
