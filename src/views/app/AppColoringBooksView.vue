<script setup lang="ts">
/**
 * "Malen → Malbücher": all coloring books (the one place for them; "Lesen" has a door that leads here). A tap opens the book (`AppColoringBookView`), where the pages can be turned and
 * painted. A card shows the cover, the name of the book, the number of pictures and, once the child has begun, how many are painted. The books stand in two groups, "Ab 5 Jahren"
 * and "Ab 9 Jahren" (the series 5 to 8 and 9 to 12), and the series ("Mit Buntstift durch die Bibel") is a small heading over a group instead of a long start of every title.
 * Without a net and with nothing kept on the device the page says so and offers "Try again".
 */
import { computed, onMounted, ref } from 'vue'
import { sizedImage } from '@/utils/sizedImage'
import BookListSkeleton from '@/components/molecules/BookListSkeleton.vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import ContentLanguageSwitch from '@/components/molecules/ContentLanguageSwitch.vue'
import useContentLanguage, { bookIn } from '@/use/useContentLanguage'
import LkPageHead from '@/components/molecules/LkPageHead.vue'
import useApiBooks from '@/use/useApiBooks'
import { listArtworks, pageArtworkId, type ArtworkMeta } from '@/use/useArtworks'
import { booksOfArea } from '@/utils/readingAreas'
import { coloringPagesOfBook } from '@/utils/coloringBook'
import { pickLocalizedImage, type ApiBook, type Locale } from '@/types/apiBook'
import { goBackTo } from '@/utils/navBack'
import useColoringShelf from '@/use/useColoringShelf'
import ColoringTransfer from '@/components/molecules/ColoringTransfer.vue'
import { PREMIUM_TEASER, hasFeature, ownsBook } from '@/use/usePremium'
import { FREE_COLORING_BOOKS } from '@/use/useBookAccess'
import OwnBadge from '@/components/atoms/OwnBadge.vue'
import OwnFilter from '@/components/molecules/OwnFilter.vue'
import { matchesOwnFilter, ownCounts, ownershipOf, type OwnFilterValue, type Ownership } from '@/utils/bookOwnership'
import { onImgFallback, withPlaceholder } from '@/utils/placeholder'
import { contentLocale } from '@/utils/contentLocale'
import BookListError from '@/components/molecules/BookListError.vue'
import { coloringAgeGroup, groupColoringBooks, splitColoringTitle, type ColoringAgeGroup, type ColoringTitleParts } from '@/utils/coloringTitles'

const { t, locale } = useI18n({ useScope: 'global' })
const route = useRoute()
const router = useRouter()
/** Opened from the painting program: the way back leads there; from the door in "Lesen" it leads back to "Lesen". */
/** `from=shelf`: opened from the big door / the button of the paint shelf in the painting program: the chip "Habe ich" is on, and a book that is mine goes onto the shelf. */
const fromShelf = computed(() => route.query.from === 'shelf')
const fromPainting = computed(() => route.query.from === 'malen' || fromShelf.value)
const apiBooks = useApiBooks()

const { shelfLanguage } = useContentLanguage()
const works = ref<ArtworkMeta[]>([])

onMounted(() => {
  void apiBooks.loadAllBooks()
  listArtworks()
    .then((list) => {
      works.value = list
    })
    .catch(() => {
      works.value = []
    })
})

interface Card {
  bookId: string
  /** The name of the book (no series, no volume): what the card shows. */
  title: string
  /** The parts of the whole title: series and volume. */
  parts: ColoringTitleParts
  group: ColoringAgeGroup
  cover: string
  /** The cover a little larger, for the transfer. */
  coverBig: string
  /** For the order: the import gives the volumes rising dates, so Band 1 comes before Band 2. */
  released: number
  total: number
  done: number
  /** What the person has of this book: free, bought, with Plus, or still to buy. */
  own: Ownership
}

/** All coloring books; the shelf shows those that exist in the language of the round flags on top. */
const coloringBooks = computed<ApiBook[]>(() => booksOfArea((apiBooks.state.all ?? []) as ApiBook[], 'coloring'))
const lang = computed<Locale>(() => shelfLanguage(coloringBooks.value))

const cards = computed<Card[]>(() => {
  const painted = new Set(works.value.map((w) => w.id))
  const list: Card[] = []
  for (const book of coloringBooks.value.filter((b) => bookIn(b, lang.value))) {
    const pages = coloringPagesOfBook(book, locale.value)
    const title = book.localizations?.[lang.value]?.title || book.localizations?.de?.title || book.bookId
    const parts = splitColoringTitle(title)
    list.push({
      bookId: book.bookId,
      title: parts.name,
      parts,
      group: coloringAgeGroup(book, title),
      cover: withPlaceholder(sizedImage(pickLocalizedImage(book.previewImage, lang.value), 170)),
      coverBig: withPlaceholder(sizedImage(pickLocalizedImage(book.previewImage, lang.value), 260)),
      released: Date.parse(book.releaseDate) || 0,
      total: pages.length,
      done: pages.filter((p) => painted.has(pageArtworkId(p.url, 1))).length,
      own: ownershipOf({ free: !PREMIUM_TEASER || FREE_COLORING_BOOKS.includes(book.bookId), owned: ownsBook(book.bookId), plus: hasFeature('allBooks') })
    })
  }
  return list.sort((a, b) => a.released - b.released || a.bookId.localeCompare(b.bookId))
})

// from the paint shelf the books that are mine come first (the chips can still be changed to "Alle" or "Zu kaufen")
const filter = ref<OwnFilterValue>(fromShelf.value ? 'mine' : 'all')
const counts = computed(() => ownCounts(cards.value.map((c) => c.own)))
/** The books of the chosen chip (the whole shelf is on show with "Alle"). */
const shown = computed(() => cards.value.filter((c) => matchesOwnFilter(c.own, filter.value)))
/** The books in their age groups, the volumes rising. */
const sections = computed(() => groupColoringBooks(shown.value))

/** The list could not be fetched and there is nothing on the device: a friendly note with "Try again" (the first loading shows placeholders). */
const retrying = ref(false)
const showError = computed(() => !cards.value.length && apiBooks.state.listReady && apiBooks.state.listFailed && !retrying.value)
function retry() {
  retrying.value = true
  void apiBooks.loadAllBooks().finally(() => {
    retrying.value = false
  })
}

function goBack() {
  goBackTo(router, { name: fromPainting.value ? 'app-coloring' : 'app-read' })
}

const paintShelf = useColoringShelf()
/** The book that is going onto the paint shelf (the short transfer is on show). */
const moving = ref<{ card: Card; already: boolean } | null>(null)

function openBook(card: Card) {
  if (moving.value) return
  if (fromShelf.value && card.own !== 'locked') {
    // a book that is mine is not opened here: it goes straight onto the paint shelf (a device that painted before keeps the books it painted in)
    paintShelf.seedShelf(cards.value.filter((c) => c.done > 0).map((c) => c.bookId))
    const already = paintShelf.has(card.bookId)
    paintShelf.add(card.bookId)
    moving.value = { card, already }
    return
  }
  // opened from "Lesen" the tab bar keeps "Lesen" (the sign `from=read` travels on to the book)
  const to = { name: 'app-coloring-book', params: { bookId: card.bookId } }
  void router.push(route.query.from === 'read' ? { ...to, query: { from: 'read' } } : to)
}

/** The transfer is over (time or tap): back to the painting program, where the book stands on the shelf and is lifted once. */
function arrived() {
  const m = moving.value
  if (!m) return
  moving.value = null
  paintShelf.markFresh(m.card.bookId)
  goBackTo(router, { name: 'app-coloring' })
}
</script>

<template lang="pug">
  div(class="cb-page")
    LkPageHead(:title="t('app.read.coloringTitle')" :subtitle="t('app.read.coloringSub')" @back="goBack")
      template(#tools)
        ContentLanguageSwitch(:books="coloringBooks")

    main(class="cb-body")
      OwnFilter(v-if="PREMIUM_TEASER && cards.length" v-model="filter" :counts="counts")
      template(v-if="sections.length")
        section(v-for="sec in sections" :key="sec.group" class="cb-section" :data-group="sec.group")
          header(class="cb-sec-head")
            h2(class="cb-sec-title") {{ t('app.read.coloringAge_' + sec.group) }}
            p(v-if="sec.series" class="cb-sec-series") {{ sec.series }}
          ul(class="cb-grid")
            li(v-for="c in sec.cards" :key="c.bookId")
              button(type="button" :class="['cb-card', { 'is-locked': c.own === 'locked' }]" :aria-label="c.title" @click="openBook(c)")
                span(class="cb-cover")
                  img(:src="c.cover" :alt="c.title" loading="lazy" draggable="false" @error="onImgFallback")
                //- the sign (free, to buy…) stands under the cover, never over its title
                span(v-if="PREMIUM_TEASER" class="cb-own")
                  OwnBadge(:state="c.own")
                span(class="cb-title") {{ c.title }}
                span(v-if="c.parts.volume || (c.parts.series && c.parts.series !== sec.series)" class="cb-vol")
                  | {{ [c.parts.series && c.parts.series !== sec.series ? c.parts.series : '', c.parts.volume ? t('app.read.volumeNo', { n: c.parts.volume }) : ''].filter(Boolean).join(' · ') }}
                span(v-if="c.total" class="cb-meta") {{ c.done > 0 ? t('app.read.paintedOf', { done: c.done, total: c.total }) : t('app.read.pictures', { n: c.total }) }}
                span(v-if="c.done > 0 && c.total" class="cb-bar")
                  span(class="cb-bar-fill" :style="{ width: Math.round((c.done / c.total) * 100) + '%' }")
      p(v-else-if="cards.length" class="cb-empty") {{ t('app.read.ownNone') }}
      BookListError(v-else-if="showError" @retry="retry")
      BookListSkeleton(v-else-if="!apiBooks.state.listReady || retrying" variant="grid" :count="4")
      p(v-else class="cb-empty") {{ t('app.read.coloringEmpty') }}

    ColoringTransfer(
      v-if="moving"
      :cover="moving.card.coverBig"
      :title="moving.card.title"
      :already="moving.already"
      @done="arrived"
    )
</template>

<style scoped lang="sass">
button
  -webkit-tap-highlight-color: transparent
  font-family: inherit

.cb-page
  min-height: 100vh
  background: var(--lk-bg)
  color: var(--lk-text)
  padding-bottom: calc(6.5rem + env(safe-area-inset-bottom, 0px))

.cb-body
  max-width: 980px
  margin: 0 auto
  padding: 12px 16px 0

.cb-grid
  list-style: none
  margin: 0
  padding: 0
  display: grid
  grid-template-columns: repeat(2, minmax(0, 1fr))
  gap: 18px 14px

.cb-card
  display: flex
  flex-direction: column
  gap: 6px
  width: 100%
  padding: 0
  border: none
  background: transparent
  color: var(--lk-text)
  text-align: left
  cursor: pointer
  touch-action: manipulation

  &:active
    transform: translateY(1px)

  &:focus-visible
    outline: 3px solid var(--lk-accent)
    outline-offset: 3px
    border-radius: 12px

.cb-section + .cb-section
  margin-top: 26px

.cb-sec-head
  margin: 0 0 12px

.cb-sec-title
  margin: 0
  font-size: 1.3rem
  font-weight: 800

// the series, a small heading over the group
.cb-sec-series
  margin: 2px 0 0
  color: var(--lk-muted)
  font-size: 0.92rem
  font-weight: 700

.cb-own
  display: flex
  margin-top: 8px

.cb-vol
  color: var(--lk-muted)
  font-size: 0.85rem
  font-weight: 700

.cb-card.is-locked .cb-cover img
  filter: saturate(0.8)

.cb-cover
  position: relative
  display: block
  aspect-ratio: 3 / 4
  border-radius: var(--lk-r-cover)
  overflow: hidden
  background: var(--lk-surface-2)
  box-shadow: var(--lk-shadow)

  img
    width: 100%
    height: 100%
    object-fit: cover
    display: block

.cb-title
  margin-top: 2px
  font-weight: 800
  font-size: 1.05rem
  line-height: 1.2
  display: -webkit-box
  -webkit-line-clamp: 3
  -webkit-box-orient: vertical
  overflow: hidden

.cb-meta
  font-size: 0.92rem
  color: var(--lk-muted)

.cb-bar
  display: block
  height: 7px
  border-radius: 999px
  background: var(--lk-track)
  overflow: hidden

.cb-bar-fill
  display: block
  height: 100%
  border-radius: 999px
  background: var(--lk-fill)

.cb-empty
  text-align: center
  color: var(--lk-muted)
  margin: 32px 0

@media (min-width: 720px)
  .cb-body
    padding: 12px 28px 0

  .cb-grid
    grid-template-columns: repeat(4, minmax(0, 1fr))
    gap: 22px 18px
</style>
