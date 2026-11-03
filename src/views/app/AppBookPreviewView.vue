<script setup lang="ts">
/**
 * "Lesen → Books → Vorschau": a look inside a printed book of the store, like the sample pages on the landing page. The cover and
 * the first pages can be turned (arrows, dots, a swipe, the arrow keys); the last page says that the whole book can be bought and
 * has the button to the store (it leaves the app through `openExternal`, which asks the parents first). A book that is also for sale as a
 * digital book (`digital` in `storeBooks`) has the button "Digital kaufen" there, too (one purchase of the store); who owns it finds
 * "Jetzt lesen" and "Als PDF speichern" there instead, and the route "lesen" shows all its pages. For a book that is not in the
 * store yet ("coming soon") the last page says that it comes soon and has no button. Every picture keeps its own shape (a single page
 * stands upright, a double page lies wide), and all of them are equally high: a double page is twice as wide as a single page. Where
 * the screen is too narrow for that (a phone) the double page can be moved sideways with a finger.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import ZIconography from '@/components/atoms/ZIconography.vue'
import BookFlip from '@/components/molecules/BookFlip.vue'
import AppHeader from '@/components/molecules/AppHeader.vue'
import { storeBooks } from '@/data/storeBooks'
import { bookProductId } from '@/data/plusProducts'
import usePremium, { PLUS_TEST } from '@/use/usePremium'
import usePurchases from '@/use/usePurchases'
import { goBackTo } from '@/utils/navBack'
import { openExternal } from '@/utils/openExternal'
import { prependBaseUrl } from '@/utils/function'
import { contentLocale } from '@/utils/contentLocale'

const { t, locale } = useI18n({ useScope: 'global' })
const route = useRoute()
const router = useRouter()

const lang = computed<'de' | 'en'>(() => (contentLocale(locale.value)))
const book = computed(() => storeBooks.find((b) => b.id === String(route.params.bookId)) ?? null)
const cover = computed(() => (book.value ? prependBaseUrl(book.value.cover) : ''))

const { ownsBook, setTestBook } = usePremium()
const purchases = usePurchases()
/** The person has bought this book as a digital book. */
const owned = computed(() => !!book.value?.digital && ownsBook(book.value.id))
/** The whole book is read (the route "lesen", and the book is owned); anything else is the look inside. */
const fullBook = computed(() => route.name === 'app-book-read' && owned.value)
const price = computed(() => (book.value?.digital ? (purchases.prices.value[bookProductId(book.value.id)] ?? book.value.digital.price) : ''))

/** The pictures: the cover and the sample pages (and, last, the page about buying), or all the pages of the book. */
const pages = computed(() => (fullBook.value ? book.value!.digital!.pages : [{ src: book.value?.cover ?? '', ratio: book.value?.coverRatio ?? 1 }, ...(book.value?.preview?.pages ?? [])]))
const pictures = computed(() => (book.value ? pages.value.map((p) => prependBaseUrl(p.src)) : []))
/** Width divided by height of every picture (the cover first), so that the frame fits the picture. */
const ratios = computed(() => (book.value ? pages.value.map((p) => p.ratio) : []))
const comingSoon = computed(() => !!book.value?.comingSoon)
const total = computed(() => (pictures.value.length ? pictures.value.length + (fullBook.value ? 0 : 1) : 0))

const index = ref(0)
const isBuyPage = computed(() => !fullBook.value && total.value > 0 && index.value === total.value - 1)
const picture = computed(() => pictures.value[index.value] ?? '')
/**
 * The picture is as high as a single page would be at this width (`--wr` is the width/height ratio of a single page: the page itself, or
 * 0.75 for a double page), so a double page stands as high as a single one and is twice as wide.
 */
const sheetStyle = computed(() => {
  if (isBuyPage.value) return {}
  const r = ratios.value[index.value] ?? 1
  return { '--r': String(r), '--wr': String(r > 1 ? 0.75 : r) }
})

// a double page that is wider than the screen can be moved sideways; then a swipe moves it and does not turn the page
const sheetEl = ref<HTMLElement | null>(null)
const canPan = ref(false)
function measure() {
  const el = sheetEl.value
  canPan.value = !!el && !isBuyPage.value && el.scrollWidth > el.clientWidth + 2
}
watch(index, () => void nextTick(measure))
// from the look inside to the whole book (and back): the first page again
watch(fullBook, () => (index.value = 0))

function go(i: number) {
  if (i < 0 || i >= total.value) return
  index.value = i
}

function goBack() {
  goBackTo(router, { name: 'app-books' })
}

function toStore() {
  if (book.value) void openExternal(book.value.url)
}

/** The digital book is bought through the store of the phone (the parental gate comes first); the test build only pretends. */
function buyDigital() {
  if (book.value) void purchases.buyBook(book.value.id)
}

/** The whole book, page by page. */
function toRead() {
  if (!book.value) return
  index.value = 0
  void router.push({ name: 'app-book-read', params: { bookId: book.value.id } })
}

/** The whole book as a file: the PDF is laid on the device. */
function download() {
  if (!book.value?.digital) return
  const a = document.createElement('a')
  a.href = prependBaseUrl(book.value.digital.pdf)
  a.download = `${book.value.title.de}.pdf`
  a.target = '_blank'
  a.rel = 'noopener'
  a.click()
}

/** Said under the buy button when the purchase did not go through. */
const buyMessage = computed(() => {
  const s = purchases.status.value
  if (s === 'pending') return t('app.read.digitalPending')
  if (s === 'failed') return t('app.read.digitalFailed')
  if (s === 'unavailable') return t('app.read.digitalUnavailable')
  return ''
})

// a swipe to the side turns the page
let startX = 0
let startY = 0
function onTouchStart(e: TouchEvent) {
  const p = e.touches[0]
  if (!p) return
  startX = p.clientX
  startY = p.clientY
}
function onTouchEnd(e: TouchEvent) {
  const p = e.changedTouches[0]
  if (!p) return
  const dx = p.clientX - startX
  const dy = p.clientY - startY
  if (canPan.value) return
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) go(index.value + (dx < 0 ? 1 : -1))
}
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowRight') go(index.value + 1)
  else if (e.key === 'ArrowLeft') go(index.value - 1)
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('resize', measure)
  purchases.resetPurchaseStatus()
  if (book.value?.digital) void purchases.loadBookPrice(book.value.id)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('resize', measure)
})
</script>

<template lang="pug">
  div(class="bp-page" @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd")
    //- the whole book: a full-screen reader on top of everything (the page below stays empty)
    Teleport(v-if="fullBook && book" to="body")
      BookFlip(:pages="pictures" @close="goBack")
    template(v-if="!fullBook")
      AppHeader
      div(class="bp-top")
        button(type="button" class="bp-back lk-btn lk-btn--outline lk-btn--small" @click="goBack")
          ZIconography(name="chevron-left" :size="20")
          span {{ t('app.read.back') }}
        span(v-if="total" class="bp-count") {{ t('app.read.previewCount', { n: index + 1, total }) }}

      main(v-if="book" class="bp-body")
        h1(class="bp-title") {{ book.title[lang] }}
        p(class="bp-sub") {{ fullBook ? t('app.read.digitalReading') : t('app.read.previewTitle') }}

        div(class="bp-stage")
          button(type="button" class="bp-arrow bp-prev lk-btn lk-btn--outline" :disabled="index === 0" :aria-label="t('app.read.previewPrev')" @click="go(index - 1)")
            ZIconography(name="chevron-left" :size="26")

          div(class="bp-cell")
            div(ref="sheetEl" :class="['bp-sheet', { 'is-buy': isBuyPage }]" :style="sheetStyle")
              img(
                v-if="!isBuyPage"
                :key="index"
                :src="picture"
                :alt="t('app.read.previewPage', { n: index + 1 })"
                class="bp-picture"
                draggable="false"
                decoding="async"
                @load="measure"
              )
              div(v-else class="bp-buy lk-panel")
                img(:src="cover" alt="" class="bp-buy-cover" draggable="false")
                template(v-if="comingSoon")
                  span(class="bp-soon-badge") {{ t('app.read.comingSoon') }}
                  h2(class="bp-buy-title") {{ t('app.read.previewSoonTitle') }}
                  p(class="bp-buy-text") {{ t('app.read.previewSoonText') }}
                template(v-else-if="owned")
                  h2(class="bp-buy-title") {{ t('app.read.digitalOwned') }}
                  p(class="bp-buy-text") {{ t('app.read.digitalOwnedText') }}
                  button(type="button" class="lk-btn bp-buy-btn bp-read" @click="toRead")
                    span {{ t('app.read.digitalRead') }}
                    ZIconography(name="chevron-right" :size="22")
                  button(type="button" class="lk-btn lk-btn--outline bp-buy-btn bp-download" @click="download")
                    span {{ t('app.read.digitalDownload') }}
                  button(v-if="PLUS_TEST" type="button" class="bp-test-undo" @click="setTestBook(book.id, false)") {{ t('app.read.digitalTestUndo') }}
                template(v-else-if="book.digital")
                  h2(class="bp-buy-title") {{ t('app.read.previewBuyTitle') }}
                  p(class="bp-buy-text") {{ t('app.read.digitalBuyText') }}
                  button(type="button" class="lk-btn bp-buy-btn bp-digital" :disabled="purchases.status.value === 'purchasing'" @click="buyDigital")
                    span {{ t('app.read.digitalBuy', { price }) }}
                  p(v-if="buyMessage" class="bp-buy-note bp-buy-message" role="status") {{ buyMessage }}
                  p(v-else class="bp-buy-note") {{ t('app.read.digitalNote') }}
                  button(type="button" class="lk-btn lk-btn--outline bp-buy-btn bp-store" @click="toStore")
                    ZIconography(name="shop" :size="24")
                    span {{ t('app.read.printedBook') }}
                    ZIconography(name="chevron-right" :size="22")
                template(v-else)
                  h2(class="bp-buy-title") {{ t('app.read.previewBuyTitle') }}
                  p(class="bp-buy-text") {{ t('app.read.previewBuyText') }}
                  button(type="button" class="lk-btn bp-buy-btn bp-store" @click="toStore")
                    ZIconography(name="shop" :size="24")
                    span {{ t('app.read.storeButton') }}
                    ZIconography(name="chevron-right" :size="22")
                  p(class="bp-buy-note") {{ t('app.read.storeParents') }}

          p(v-if="canPan" class="bp-pan") {{ t('app.read.previewPan') }}

          button(type="button" class="bp-arrow bp-next lk-btn" :disabled="index >= total - 1" :aria-label="t('app.read.previewNext')" @click="go(index + 1)")
            ZIconography(name="chevron-right" :size="26")

        //- a short look inside has a dot for every page; the whole book (29 pages) only has the count at the top
        div(v-if="total <= 12" class="bp-dots" role="group" :aria-label="t('app.read.previewTitle')")
          button(
            v-for="i in total"
            :key="i"
            type="button"
            :class="['bp-dot', { on: i - 1 === index }]"
            :aria-label="t('app.read.previewPage', { n: i })"
            :aria-current="i - 1 === index ? 'true' : undefined"
            @click="go(i - 1)"
          )
      p(v-else class="bp-empty") {{ t('app.read.booksEmpty') }}
</template>

<style scoped lang="sass">
button
  -webkit-tap-highlight-color: transparent
  font-family: inherit

.bp-page
  min-height: 100vh
  background: var(--lk-bg)
  color: var(--lk-text)
  padding-bottom: calc(2rem + env(safe-area-inset-bottom, 0px))

.bp-top
  max-width: 1000px
  margin: 0 auto
  padding: 0 16px
  display: flex
  align-items: center
  justify-content: space-between

.bp-back
  gap: 4px
  padding: 0 18px 0 10px

.bp-count
  color: var(--lk-muted)
  font-weight: 700

.bp-body
  max-width: 1000px
  margin: 0 auto
  padding: 8px 16px 0
  display: flex
  flex-direction: column
  gap: 14px

.bp-title
  margin: 0
  font-family: 'Fraunces', Georgia, serif
  font-weight: 800
  font-size: 1.7rem
  line-height: 1.15
  text-align: center

.bp-sub
  margin: -8px 0 0
  text-align: center
  color: var(--lk-muted)
  font-weight: 700

.bp-stage
  display: grid
  grid-template-columns: auto minmax(0, 1fr) auto
  align-items: center
  gap: 10px

.bp-cell
  min-width: 0
  display: flex
  flex-direction: column
  align-items: center
  // the sheet is measured against the width of this cell (container units)
  container-type: inline-size

// a picture page: as high as a single page would be at this width, as wide as its picture; wider than the cell = it can be moved sideways
.bp-sheet
  width: fit-content
  max-width: 100%
  height: min(62vh, 560px, calc(100cqw / var(--wr, 1)))
  display: flex
  border-radius: var(--lk-r-card)
  overflow-x: auto
  overflow-y: hidden
  background: var(--lk-surface)
  box-shadow: var(--lk-shadow)
  -webkit-overflow-scrolling: touch

.bp-sheet.is-buy
  width: 100%
  height: auto
  overflow: visible
  min-height: 240px

.bp-picture
  flex: none
  display: block
  height: 100%
  width: auto
  aspect-ratio: var(--r, 1)
  max-width: none
  margin-inline: auto
  object-fit: contain
  user-select: none

.bp-pan
  margin: 8px 0 0
  text-align: center
  color: var(--lk-muted)
  font-size: 0.9rem
  font-weight: 700

.bp-arrow
  flex: none
  width: 48px
  min-width: 48px
  height: 48px
  padding: 0

  :deep(.z-icon-outline)
    color: currentColor

  &:disabled
    opacity: 0.3

.bp-buy
  width: 100%
  box-sizing: border-box
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  gap: 8px
  padding: 14px 16px
  text-align: center
  border: none
  box-shadow: none

.bp-soon-badge
  display: inline-block
  padding: 4px 14px
  border-radius: 999px
  background: var(--lk-accent)
  color: var(--lk-on-accent)
  font-weight: 800
  font-size: 0.85rem
  letter-spacing: 0.06em
  text-transform: uppercase

.bp-buy-cover
  width: min(32%, 120px)
  border-radius: var(--lk-r-cover)
  box-shadow: var(--lk-shadow)

.bp-buy-title
  margin: 4px 0 0
  font-weight: 800
  font-size: 1.35rem
  line-height: 1.15

.bp-buy-text
  margin: 0
  font-size: 1.05rem
  line-height: 1.4

.bp-buy-btn
  gap: 10px
  margin-top: 6px
  padding: 0 18px 0 20px

  :deep(.z-icon-outline)
    color: currentColor

.bp-buy-note
  margin: 0
  font-size: 0.85rem
  color: var(--lk-muted)

.bp-buy-message
  color: var(--lk-text)
  font-weight: 700

// the test build only: takes the pretended purchase back
.bp-test-undo
  margin-top: 4px
  padding: 4px 8px
  border: none
  background: transparent
  color: var(--lk-muted)
  font-size: 0.8rem
  text-decoration: underline
  cursor: pointer

.bp-dots
  display: flex
  justify-content: center
  flex-wrap: wrap
  gap: 4px

// the dot is small to look at, but its touch area is large enough for a child's finger
.bp-dot
  width: 28px
  height: 28px
  padding: 0
  border: none
  background: transparent
  display: flex
  align-items: center
  justify-content: center

  &::after
    content: ''
    width: 10px
    height: 10px
    border-radius: 50%
    background: var(--lk-line)

  &.on::after
    background: var(--lk-accent)
    width: 14px
    height: 14px

.bp-empty
  text-align: center
  color: var(--lk-muted)
  margin: 32px 0

// a phone: the picture takes the whole width, the two arrows sit under it
@media (max-width: 640px)
  .bp-stage
    grid-template-columns: 1fr 1fr
    gap: 10px 12px

  .bp-cell
    grid-column: 1 / -1
    grid-row: 1

  .bp-prev
    grid-column: 1
    grid-row: 2
    justify-self: start

  .bp-next
    grid-column: 2
    grid-row: 2
    justify-self: end

  .bp-pan
    grid-column: 1 / -1
    grid-row: 3
</style>
