<script setup lang="ts">
/**
 * One series: its picture and name on top, below it all its books as a grid with the state of each (read, how far, not
 * started). A tap on a book opens it.
 */
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import ZIconography from '@/components/atoms/ZIconography.vue'
import LkCompanion from '@/components/atoms/LkCompanion.vue'
import AppHeader from '@/components/molecules/AppHeader.vue'
import useModels from '@/use/useModels'
import useApiBooks from '@/use/useApiBooks'
import useApiSeries from '@/use/useApiSeries'
import useCatalogNames from '@/use/useCatalogNames'
import useReadingProgress from '@/use/useReadingProgress'
import type { ApiBook, Locale } from '@/types/apiBook'
import { pickLocalizedImage } from '@/types/apiBook'
import { onImgFallback, withPlaceholder, PLACEHOLDER_IMAGE } from '@/utils/placeholder'

const { t, locale } = useI18n({ useScope: 'global' })
const route = useRoute()
const router = useRouter()
const { getSeries } = useModels()
const apiBooks = useApiBooks()
const apiSeries = useApiSeries()
const { seriesName } = useCatalogNames()
const { getPct } = useReadingProgress()

onMounted(() => {
  void apiBooks.loadAllBooks()
  void apiSeries.loadAll()
})

const lang = computed<Locale>(() => (locale.value === 'en' ? 'en' : 'de'))
const seriesId = computed(() => String(route.params.seriesId))
const seriesMeta = computed(() => getSeries(seriesId.value))

const books = computed<ApiBook[]>(() => {
  void apiBooks.state.all
  return apiBooks.booksOfSeries(seriesId.value)
})

// Picture of the series: the server record (cover from the AdminUI), then the catalogue, then the first book.
const heroImage = computed<string>(() => {
  void apiSeries.state.all
  const apiMeta = apiSeries.getById(seriesId.value)
  if (apiMeta?.coverImage) return apiMeta.coverImage
  if (seriesMeta.value?.coverImage) return seriesMeta.value.coverImage
  const first = books.value[0]
  if (first) return pickLocalizedImage(first.previewImage, lang.value)
  return PLACEHOLDER_IMAGE
})

const description = computed<string>(() => {
  void apiSeries.state.all
  return apiSeries.getById(seriesId.value)?.description || seriesMeta.value?.description || ''
})

const seriesTitle = computed<string>(() => {
  void apiSeries.state.all
  const apiMeta = apiSeries.getById(seriesId.value)
  return seriesName(seriesId.value, apiMeta?.name || seriesMeta.value?.name || '')
})

const NEW_DAYS = 90

interface Cell {
  book: ApiBook
  title: string
  isNew: boolean
  /** done = read to the end, going = begun, open = not started */
  state: 'done' | 'going' | 'open'
  pct: number
  pages: number
  page: number
}

function titleOf(book: ApiBook): string {
  return book.localizations?.[lang.value]?.title || book.localizations?.de?.title || ''
}

const cells = computed<Cell[]>(() =>
  books.value.map((book) => {
    const pages = book.localizations?.[lang.value]?.content?.length || book.localizations?.de?.content?.length || 0
    const pct = getPct(book.bookId, pages)
    const age = Date.now() - new Date(book.releaseDate).getTime()
    return {
      book,
      title: titleOf(book),
      isNew: age >= 0 && age < NEW_DAYS * 86400000,
      state: pct >= 0.98 ? 'done' : pct > 0 ? 'going' : 'open',
      pct,
      pages,
      page: Math.max(1, Math.round(pct * pages))
    }
  })
)

function goBack() {
  if (window.history.length > 1) router.back()
  else void router.push({ name: 'app-all-books' })
}

function openBook(bookId: string) {
  void router.push({ name: 'app-book', params: { bookId } })
}
</script>

<template lang="pug">
  div(class="series-page")
    AppHeader

    main(class="series-body")
      button(type="button" class="back lk-btn lk-btn--outline lk-btn--small" @click="goBack")
        ZIconography(name="chevron-left" :size="20")
        span {{ t('app.read.back') }}

      //- the picture of the series with its name below; the lamb sits on the rim
      div(class="hero lk-panel")
        img(
          :src="withPlaceholder(heroImage)"
          :alt="seriesTitle"
          class="hero-img"
          loading="eager"
          draggable="false"
          @error="onImgFallback"
        )
        div(class="hero-text")
          LkCompanion(class="hero-lamb" pose="sitzen" :size="84")
          h1(class="series-title") {{ seriesTitle }}
          p(v-if="description" class="series-desc") {{ description }}

      section(class="all lk-panel")
        h2(class="grid-title") {{ t('app.read.allBooks') }}
        div(v-if="cells.length" class="grid")
          button(
            v-for="c in cells"
            :key="c.book.bookId"
            type="button"
            class="cell"
            @click="openBook(c.book.bookId)"
          )
            span(class="cell-cover")
              img(
                :src="withPlaceholder(pickLocalizedImage(c.book.previewImage, lang))"
                :alt="c.title"
                loading="lazy"
                draggable="false"
                @error="onImgFallback"
              )
              span(v-if="c.isNew" class="new-badge") {{ t('app.read.newBadge') }}
            span(class="cell-title") {{ c.title }}
            span(v-if="c.state !== 'done'" class="cell-bar")
              span(class="cell-bar-fill" :style="{ width: Math.round(c.pct * 100) + '%' }")
            span(v-if="c.state === 'going'" class="cell-meta") {{ t('app.read.pageShort', { n: c.page, total: c.pages }) }}
            span(v-else-if="c.state === 'open'" class="cell-meta") {{ t('app.read.open') }}
            span(v-else class="cell-meta cell-done")
              ZIconography(name="check" :size="16")
              span {{ t('app.read.done') }}
        p(v-else class="series-desc") {{ t('app.read.booksInSeries') }}
</template>

<style scoped lang="sass">
button
  -webkit-tap-highlight-color: transparent
  font-family: inherit

.series-page
  min-height: 100vh
  background: var(--lk-bg)
  color: var(--lk-text)
  padding-bottom: calc(6.5rem + env(safe-area-inset-bottom, 0px))

.series-body
  max-width: 980px
  margin: 0 auto
  padding: 0 16px
  display: flex
  flex-direction: column
  gap: 8px

.back
  align-self: flex-start
  gap: 4px
  padding: 0 18px 0 10px

  :deep(.z-icon-outline)
    color: currentColor

.hero
  position: relative
  border-radius: var(--lk-r-panel)
  overflow: hidden
  margin-top: 8px

.hero-img
  width: 100%
  aspect-ratio: 16 / 9
  object-fit: cover
  display: block
  background: var(--lk-surface-2)

.hero-text
  position: relative
  padding: 34px 18px 20px

.hero-lamb
  position: absolute
  right: 14px
  top: -56px

.all
  margin-top: 20px
  padding: 18px 14px 20px

.series-title
  margin: 0
  font-weight: 800
  font-size: 1.9rem
  line-height: 1.15

.series-desc
  margin: 0
  color: var(--lk-muted)
  font-size: 1.05rem
  line-height: 1.4

.grid-title
  margin: 0 0 10px
  font-weight: 800
  font-size: 1.4rem

.grid
  display: grid
  grid-template-columns: repeat(3, minmax(0, 1fr))
  gap: 16px 12px
  margin-top: 6px

.cell
  display: flex
  flex-direction: column
  gap: 4px
  min-width: 0
  padding: 0
  border: none
  background: transparent
  color: var(--lk-text)
  text-align: left
  cursor: pointer

.cell-cover
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

.new-badge
  position: absolute
  top: 8px
  left: 8px
  padding: 2px 8px
  border-radius: 6px
  background: var(--lk-new)
  color: #fff
  font-size: 0.72rem
  font-weight: 800
  letter-spacing: 0.04em

.cell-title
  margin-top: 4px
  font-weight: 700
  font-size: 0.95rem
  line-height: 1.2
  display: -webkit-box
  -webkit-line-clamp: 3
  -webkit-box-orient: vertical
  overflow: hidden

.cell-bar
  display: block
  height: 6px
  border-radius: 999px
  background: var(--lk-track)
  overflow: hidden

.cell-bar-fill
  display: block
  height: 100%
  border-radius: 999px
  background: var(--lk-fill)

.cell-meta
  font-size: 0.88rem
  color: var(--lk-muted)

.cell-done
  display: inline-flex
  align-items: center
  gap: 6px
  color: var(--lk-ok)
  font-weight: 700

  :deep(.z-icon-outline),
  :deep(svg)
    color: currentColor

@media (min-width: 720px)
  .series-body
    padding: 0 28px

  .grid
    grid-template-columns: repeat(4, minmax(0, 1fr))
    gap: 22px 16px
</style>
