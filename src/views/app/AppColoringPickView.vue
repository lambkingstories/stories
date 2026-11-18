<script setup lang="ts">
/**
 * "Malen" opens here first (Anton, 18.11.2026): "Such dir ein Malbuch aus". Only the coloring books that the child HAS are shown (free, bought, or opened by
 * LambKing Plus; the books that still have to be bought are not). A tap on a book does not start painting: the book is put on the shelf of the painting
 * program (the short transfer, `ColoringTransfer`), and then the painting program opens, where the book stands on the shelf and can be opened, leafed
 * through and painted in. Above the books stand a small "Keep painting" card (the picture painted last) and the button "Zur Mal-App" (the whole painting
 * program: exhibition, galleries, a blank sheet), so nobody who only wants to go on or to paint freely is stuck here. Under the books a quiet link leads to the list with all coloring books
 * (where buying and Plus stay behind the parental gate, as before). All words stand in the middle.
 */
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/molecules/AppHeader.vue'
import BookListError from '@/components/molecules/BookListError.vue'
import BookListSkeleton from '@/components/molecules/BookListSkeleton.vue'
import ColoringTransfer from '@/components/molecules/ColoringTransfer.vue'
import LkCompanion from '@/components/atoms/LkCompanion.vue'
import ZIconography from '@/components/atoms/ZIconography.vue'
import OwnBadge from '@/components/atoms/OwnBadge.vue'
import useApiBooks from '@/use/useApiBooks'
import useColoringShelf from '@/use/useColoringShelf'
import { listArtworks, pageArtworkId, type ArtworkMeta } from '@/use/useArtworks'
import { booksOfArea } from '@/utils/readingAreas'
import { coloringPagesOfBook } from '@/utils/coloringBook'
import { pickLocalizedImage, type ApiBook, type Locale } from '@/types/apiBook'
import { sizedImage } from '@/utils/sizedImage'
import { onImgFallback, withPlaceholder } from '@/utils/placeholder'
import { contentLocale } from '@/utils/contentLocale'
import { frameRatio } from '@/utils/coloringThumb'
import { PREMIUM_TEASER, hasFeature, ownsBook } from '@/use/usePremium'
import { FREE_COLORING_BOOKS } from '@/use/useBookAccess'
import { ownershipOf, type Ownership } from '@/utils/bookOwnership'
import { coloringAgeGroup, groupColoringBooks, splitColoringTitle, type ColoringAgeGroup, type ColoringTitleParts } from '@/utils/coloringTitles'

const { t, locale } = useI18n({ useScope: 'global' })
const router = useRouter()
const apiBooks = useApiBooks()
const shelf = useColoringShelf()

const lang = computed<Locale>(() => contentLocale(locale.value))
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
  /** The name of the book (no series, no volume). */
  title: string
  parts: ColoringTitleParts
  group: ColoringAgeGroup
  cover: string
  released: number
  total: number
  done: number
  own: Ownership
}

/** All coloring books with what the person has of them. */
const allCards = computed<Card[]>(() => {
  const painted = new Set(works.value.map((w) => w.id))
  const list: Card[] = []
  for (const book of booksOfArea((apiBooks.state.all ?? []) as ApiBook[], 'coloring')) {
    const pages = coloringPagesOfBook(book, locale.value)
    const title = book.localizations?.[lang.value]?.title || book.localizations?.de?.title || book.bookId
    const parts = splitColoringTitle(title)
    list.push({
      bookId: book.bookId,
      title: parts.name,
      parts,
      group: coloringAgeGroup(book, title),
      cover: withPlaceholder(sizedImage(pickLocalizedImage(book.previewImage, lang.value), 260)),
      released: Date.parse(book.releaseDate) || 0,
      total: pages.length,
      done: pages.filter((p) => painted.has(pageArtworkId(p.url, 1))).length,
      own: ownershipOf({ free: !PREMIUM_TEASER || FREE_COLORING_BOOKS.includes(book.bookId), owned: ownsBook(book.bookId), plus: hasFeature('allBooks') })
    })
  }
  return list
})
/** The books the child has: free, bought or opened by Plus. The ones still to buy are not shown here. */
const mine = computed(() => allCards.value.filter((c) => c.own !== 'locked'))
const sections = computed(() => groupColoringBooks(mine.value))

/** The picture painted last (one that is not finished first): the card "Keep painting". */
const continueWork = computed<ArtworkMeta | null>(() => {
  const sorted = [...works.value].sort((a, b) => b.updatedAt - a.updatedAt)
  return sorted.find((w) => !w.done) ?? sorted[0] ?? null
})
const continueSub = computed(() => {
  const w = continueWork.value
  if (!w) return ''
  if (w.bookId && w.bookPage) {
    const card = allCards.value.find((c) => c.bookId === w.bookId)
    return card ? t('app.coloring.pageOfBook', { title: card.title, n: w.bookPage, total: card.total }) : t('app.coloring.pageNumber', { n: w.bookPage })
  }
  return w.done ? t('app.coloring.finishedTag') : ''
})
const frameStyle = (w: ArtworkMeta) => ({ aspectRatio: String(frameRatio(w)) })

/** The list could not be fetched and there is nothing on the device. */
const retrying = ref(false)
const showError = computed(() => !allCards.value.length && apiBooks.state.listReady && apiBooks.state.listFailed && !retrying.value)
const loadingList = computed(() => !apiBooks.state.listReady || retrying.value)
function retry() {
  retrying.value = true
  void apiBooks.loadAllBooks().finally(() => {
    retrying.value = false
  })
}

// ── The transfer ------------------------------------------------------------------------

const moving = ref<{ card: Card; already: boolean } | null>(null)

/** A tap on a book: it goes on the shelf of the painting program (it stays there when it already stood there), and the short transfer shows it. */
function pickBook(card: Card) {
  if (moving.value) return
  // a device that painted before gets the books it painted in on its shelf first (once), so adding a book does not push them off
  shelf.seedShelf(allCards.value.filter((c) => c.done > 0).map((c) => c.bookId))
  const already = shelf.has(card.bookId)
  shelf.add(card.bookId)
  moving.value = { card, already }
}

/** The transfer is over (time or tap): the painting program opens, and the book is lifted on its shelf once. */
function arrived() {
  const m = moving.value
  if (!m) return
  moving.value = null
  shelf.markFresh(m.card.bookId)
  void router.push({ name: 'app-coloring' })
}

function toPaintApp() {
  void router.push({ name: 'app-coloring' })
}
function keepPainting(w: ArtworkMeta) {
  void router.push({ name: 'app-coloring', query: { work: w.id } })
}
function toAllBooks() {
  void router.push({ name: 'app-coloring-books', query: { from: 'pick' } })
}
</script>

<template lang="pug">
  div(class="cp")
    AppHeader(class="cp-apphead")

    main(class="cp-body")
      header(class="cp-head")
        LkCompanion(class="cp-lamb" pose="stift" :size="92")
        h1(class="cp-title") {{ t('app.coloring.bookPickTitle') }}
        p(class="cp-sub") {{ t('app.coloring.bookPickSub') }}

      //- the way into the painting program for everybody who only goes on or paints freely
      section(class="cp-top")
        button(v-if="continueWork" type="button" class="cp-continue lk-panel" data-test="pick-continue" @click="keepPainting(continueWork)")
          span(class="cp-cont-pic")
            img(:src="continueWork.thumb" alt="" draggable="false" :style="frameStyle(continueWork)")
          span(class="cp-cont-text")
            span(class="cp-cont-kicker") {{ t('app.coloring.keepPainting') }}
            span(class="cp-cont-title") {{ continueWork.title }}
            span(v-if="continueSub" class="cp-cont-sub") {{ continueSub }}
        button(type="button" class="cp-app lk-btn" data-test="pick-to-app" @click="toPaintApp")
          ZIconography(name="brush" :size="24")
          span(class="cp-app-text")
            span(class="cp-app-title") {{ t('app.coloring.pickToApp') }}
            span(class="cp-app-sub") {{ t('app.coloring.pickToAppSub') }}

      //- the books the child has, in the two age groups
      template(v-if="sections.length")
        section(v-for="sec in sections" :key="sec.group" class="cp-section" :data-group="sec.group" data-test="pick-section")
          header(class="cp-sec-head")
            h2(class="cp-sec-title") {{ t('app.read.coloringAge_' + sec.group) }}
            p(v-if="sec.series" class="cp-sec-series") {{ sec.series }}
          ul(class="cp-grid")
            li(v-for="c in sec.cards" :key="c.bookId")
              button(type="button" class="cp-card" data-test="pick-book" :data-book="c.bookId" :aria-label="t('app.coloring.pickBookLabel', { title: c.title })" @click="pickBook(c)")
                span(class="cp-cover")
                  img(:src="c.cover" :alt="c.title" loading="lazy" draggable="false" @error="onImgFallback")
                span(v-if="PREMIUM_TEASER" class="cp-own")
                  OwnBadge(:state="c.own")
                span(class="cp-name") {{ c.title }}
                span(v-if="c.parts.volume" class="cp-vol") {{ t('app.read.volumeNo', { n: c.parts.volume }) }}
                span(v-if="c.total" class="cp-meta") {{ c.done > 0 ? t('app.read.paintedOf', { done: c.done, total: c.total }) : t('app.read.pictures', { n: c.total }) }}
      BookListError(v-else-if="showError" @retry="retry")
      BookListSkeleton(v-else-if="loadingList" variant="grid" :count="4")
      //- the child has no coloring book (hardly possible: Band 1 of both series is free): the way to the books and to the painting program
      section(v-else class="cp-empty lk-panel" data-test="pick-empty")
        h2(class="cp-empty-title") {{ t('app.coloring.pickEmptyTitle') }}
        p(class="cp-empty-text") {{ t('app.coloring.pickEmptyText') }}

      //- quiet: all coloring books (buying and Plus stay behind the parents' gate there)
      button(v-if="!loadingList || sections.length" type="button" class="cp-more lk-btn lk-btn--outline" data-test="pick-more" @click="toAllBooks")
        span {{ t('app.coloring.pickMore') }}
        ZIconography(name="chevron-right" :size="20")

    ColoringTransfer(
      v-if="moving"
      :cover="moving.card.cover"
      :title="moving.card.title"
      :already="moving.already"
      @done="arrived"
    )
</template>

<style scoped lang="sass">
button
  -webkit-tap-highlight-color: transparent
  font-family: inherit
  touch-action: manipulation

.cp
  min-height: 100vh
  background: var(--lk-bg)
  color: var(--lk-text)
  text-align: center
  padding: 0 16px calc(7rem + env(safe-area-inset-bottom, 0px))

.cp-apphead
  width: 100%
  max-width: 980px
  margin: 0 auto 8px
  padding-left: 0
  padding-right: 0

.cp-body
  max-width: 980px
  margin: 0 auto
  display: flex
  flex-direction: column
  gap: 22px

// ── the heading: the lamb and the words, in the middle ──
.cp-head
  display: flex
  flex-direction: column
  align-items: center
  gap: 2px

.cp-lamb
  margin-bottom: -2px

.cp-title
  margin: 0
  font-size: 1.9rem
  font-weight: 800
  line-height: 1.15

.cp-sub
  margin: 4px 0 0
  color: var(--lk-muted)
  font-size: 1.05rem
  line-height: 1.35

// ── keep painting + to the painting program ──
.cp-top
  display: flex
  flex-direction: column
  gap: 12px

.cp-continue
  display: flex
  align-items: center
  gap: 14px
  width: 100%
  padding: 12px
  border: 1px solid var(--lk-line)
  color: var(--lk-text)
  text-align: center
  cursor: pointer

  &:active
    transform: translateY(1px)

  &:focus-visible
    outline: 3px solid var(--lk-accent)
    outline-offset: 2px

.cp-cont-pic
  flex: 0 0 auto
  display: grid
  place-items: center
  width: 84px

  img
    display: block
    width: 100%
    max-height: 110px
    object-fit: cover
    border: 3px solid #d9a93a
    border-radius: 4px
    background: #ffffff
    box-shadow: 0 6px 14px rgba(70, 45, 10, 0.28)

.cp-cont-text
  flex: 1 1 auto
  min-width: 0
  display: flex
  flex-direction: column
  align-items: center
  gap: 3px
  min-height: 48px
  justify-content: center

.cp-cont-kicker
  font-size: 0.95rem
  font-weight: 800
  letter-spacing: 0.03em
  color: var(--lk-accent)

.cp-cont-title
  font-size: 1.15rem
  font-weight: 800
  line-height: 1.2
  overflow-wrap: anywhere

.cp-cont-sub
  color: var(--lk-muted)
  font-size: 0.9rem
  line-height: 1.3

.cp-app
  min-height: 56px
  gap: 12px
  justify-content: center
  text-align: center

.cp-app-text
  display: flex
  flex-direction: column
  align-items: center
  gap: 1px

.cp-app-title
  font-size: 1.1rem
  font-weight: 800

.cp-app-sub
  font-size: 0.82rem
  font-weight: 600
  opacity: 0.9

// ── the books ──
.cp-section + .cp-section
  margin-top: 4px

.cp-sec-head
  margin: 0 0 12px

.cp-sec-title
  margin: 0
  font-size: 1.3rem
  font-weight: 800

.cp-sec-series
  margin: 2px 0 0
  color: var(--lk-muted)
  font-size: 0.92rem
  font-weight: 700

// the books stand in the middle of the rows (also one book alone, or an odd one in the last row)
.cp-grid
  list-style: none
  margin: 0
  padding: 0
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 20px 14px

  li
    flex: 0 0 calc((100% - 14px) / 2)
    max-width: 210px

.cp-card
  display: flex
  flex-direction: column
  align-items: center
  gap: 6px
  width: 100%
  min-height: 48px
  padding: 0
  border: none
  background: transparent
  color: var(--lk-text)
  text-align: center
  cursor: pointer

  &:active
    transform: translateY(1px)

  &:focus-visible
    outline: 3px solid var(--lk-accent)
    outline-offset: 3px
    border-radius: 12px

.cp-cover
  position: relative
  display: block
  width: 100%
  aspect-ratio: 3 / 4
  overflow: hidden
  border-radius: 6px 14px 14px 6px
  background: var(--lk-surface-2)
  box-shadow: 0 16px 24px -12px rgba(60, 40, 10, 0.55), 0 2px 5px rgba(60, 40, 10, 0.26)

  img
    display: block
    width: 100%
    height: 100%
    object-fit: cover

.cp-own
  display: flex
  justify-content: center
  margin-top: 4px

.cp-name
  margin-top: 2px
  font-weight: 800
  font-size: 1.1rem
  line-height: 1.2
  display: -webkit-box
  -webkit-line-clamp: 3
  -webkit-box-orient: vertical
  overflow: hidden

.cp-vol
  color: var(--lk-muted)
  font-size: 0.85rem
  font-weight: 700

.cp-meta
  color: var(--lk-muted)
  font-size: 0.9rem

.cp-empty
  padding: 22px 18px
  display: flex
  flex-direction: column
  align-items: center
  gap: 6px

.cp-empty-title
  margin: 0
  font-size: 1.25rem
  font-weight: 800

.cp-empty-text
  margin: 0
  color: var(--lk-muted)

.cp-more
  align-self: center
  min-height: 52px
  gap: 6px

@media (min-width: 720px)
  .cp-body
    padding: 0 12px

  .cp-top
    flex-direction: row
    align-items: stretch

  .cp-continue,
  .cp-app
    flex: 1 1 0

  .cp-grid
    gap: 24px 18px

    li
      flex-basis: calc((100% - 54px) / 4)

@media (max-height: 450px) and (orientation: landscape)
  .cp
    padding-bottom: calc(4rem + env(safe-area-inset-bottom, 0px))

  .cp-lamb
    display: none
</style>
