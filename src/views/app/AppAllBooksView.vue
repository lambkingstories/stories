<script setup lang="ts">
/**
 * "Lesen": the shelves. One row per series (the name on the left, "Alle" on the right); the books of the series stand on a
 * board and can be swiped sideways. A tap on a book opens it, a tap on the name or on "Alle" opens the whole series.
 * Publishers other than LambKing get their own shelf with the same look (a series of theirs is a row like any other).
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import ZIconography from '@/components/atoms/ZIconography.vue'
import LkCompanion from '@/components/atoms/LkCompanion.vue'
import AppHeader from '@/components/molecules/AppHeader.vue'
import useModels from '@/use/useModels'
import useApiBooks from '@/use/useApiBooks'
import useApiSeries from '@/use/useApiSeries'
import useCatalogNames from '@/use/useCatalogNames'
import type { ApiBook, Locale } from '@/types/apiBook'
import { pickLocalizedImage } from '@/types/apiBook'
import { onImgFallback, withPlaceholder } from '@/utils/placeholder'

const { t, locale } = useI18n({ useScope: 'global' })
const router = useRouter()
const { getSeries } = useModels()
const apiBooks = useApiBooks()
const apiSeries = useApiSeries()
const { seriesName } = useCatalogNames()

// no net: the page says so and offers to try again
const online = ref(typeof navigator === 'undefined' ? true : navigator.onLine)
const setOnline = () => {
  online.value = navigator.onLine
}

function reload() {
  void apiBooks.loadAllBooks()
  void apiSeries.loadAll()
}

onMounted(() => {
  reload()
  window.addEventListener('online', setOnline)
  window.addEventListener('offline', setOnline)
})
onBeforeUnmount(() => {
  window.removeEventListener('online', setOnline)
  window.removeEventListener('offline', setOnline)
})

const lang = computed<Locale>(() => (locale.value === 'en' ? 'en' : 'de'))
const allBooks = computed<ApiBook[]>(() => (apiBooks.state.all ?? []) as ApiBook[])

interface Shelf {
  seriesId: string
  name: string
  books: ApiBook[]
  /** The main picture of the series: the cover from the AdminUI, else the first book's picture. */
  cover: string
  /** Display position from the AdminUI — lower first. */
  sortOrder: number
}

// A series the editor has never positioned (or one the app knows only from its books) sorts after every positioned one.
const UNPOSITIONED = Number.MAX_SAFE_INTEGER
const NEW_DAYS = 90

function humaniseId(id: string): string {
  return id
    .split(/[-_]/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ')
}

const shelves = computed<Shelf[]>(() => {
  void apiSeries.state.all
  const groups = new Map<string, ApiBook[]>()
  for (const b of allBooks.value) {
    const sid = b.bookSeriesId || 'misc'
    const arr = groups.get(sid) ?? []
    arr.push(b)
    groups.set(sid, arr)
  }
  const list: Shelf[] = []
  for (const [sid, books] of groups) {
    const apiMeta = apiSeries.getById(sid)
    const legacyMeta = getSeries(sid)
    const ofSeries = apiBooks.booksOfSeries(sid).length ? apiBooks.booksOfSeries(sid) : books
    const first = ofSeries[0]
    list.push({
      seriesId: sid,
      name: seriesName(sid, apiMeta?.name || legacyMeta?.name || humaniseId(sid)),
      books: ofSeries,
      cover: apiMeta?.coverImage || legacyMeta?.coverImage || (first ? pickLocalizedImage(first.previewImage, lang.value) : ''),
      sortOrder: apiMeta?.sortOrder && apiMeta.sortOrder > 0 ? apiMeta.sortOrder : UNPOSITIONED
    })
  }
  return list.sort((a, b) => (a.sortOrder !== b.sortOrder ? a.sortOrder - b.sortOrder : a.name.localeCompare(b.name)))
})

// Search: a part of the title (German or English), the author or the name of the series.
const query = ref('')
const isSearching = computed(() => query.value.trim().length > 0)

const results = computed<ApiBook[]>(() => {
  const term = query.value.trim().toLowerCase()
  if (!term) return []
  const nameOf = new Map(shelves.value.map((sh) => [sh.seriesId, sh.name.toLowerCase()]))
  return allBooks.value.filter((b) => {
    const de = b.localizations?.de?.title?.toLowerCase() ?? ''
    const en = b.localizations?.en?.title?.toLowerCase() ?? ''
    const author = b.author?.toLowerCase() ?? ''
    const series = nameOf.get(b.bookSeriesId || 'misc') ?? ''
    return de.includes(term) || en.includes(term) || author.includes(term) || series.includes(term)
  })
})

function isNew(book: ApiBook): boolean {
  const age = Date.now() - new Date(book.releaseDate).getTime()
  return age >= 0 && age < NEW_DAYS * 86400000
}

function bookTitle(book: ApiBook): string {
  return book.localizations?.[lang.value]?.title || book.localizations?.de?.title || ''
}

function openSeries(seriesId: string) {
  void router.push({ name: 'app-series', params: { seriesId } })
}

function openBook(bookId: string) {
  void router.push({ name: 'app-book', params: { bookId } })
}
</script>

<template lang="pug">
  div(class="read-page")
    AppHeader

    main(class="read-body")
      h1(class="read-title") {{ t('app.allBooks.title') }}
      //- the question of the lamb is the search field: "Which book shall we read?" is typed over
      label(class="ask")
        LkCompanion(class="ask-lamb" pose="lesen" :size="64")
        input(
          v-model="query"
          type="text"
          class="ask-input"
          :placeholder="t('app.read.ask')"
          :aria-label="t('app.read.ask')"
          autocomplete="off"
          enterkeyhint="search"
          @keydown.esc="query = ''"
        )
        button(v-if="isSearching" type="button" class="search-clear" :aria-label="t('app.parent.close')" @click.prevent="query = ''")
          ZIconography(name="plus" :size="20" class="close-x")
        ZIconography(v-else name="search" :size="22" class="ask-search")

      //- results replace the shelves while something is typed
      section(v-if="isSearching" class="results")
        p(v-if="!results.length" class="results-empty") {{ t('app.main.searchEmpty') }}
        div(v-else class="results-grid")
          button(
            v-for="book in results"
            :key="book.bookId"
            type="button"
            class="result"
            @click="openBook(book.bookId)"
          )
            span(class="result-cover")
              img(
                :src="withPlaceholder(pickLocalizedImage(book.previewImage, lang))"
                :alt="bookTitle(book)"
                loading="lazy"
                draggable="false"
                @error="onImgFallback"
              )
              span(v-if="isNew(book)" class="new-badge") {{ t('app.read.newBadge') }}
            span(class="result-title") {{ bookTitle(book) }}

      template(v-else)
        section(v-for="shelf in shelves" :key="shelf.seriesId" class="shelf lk-panel")
          div(class="shelf-head")
            button(type="button" class="shelf-name" @click="openSeries(shelf.seriesId)") {{ shelf.name }}
            button(type="button" class="shelf-all lk-btn lk-btn--outline lk-btn--small" @click="openSeries(shelf.seriesId)")
              span {{ t('app.read.all') }}
              ZIconography(name="chevron-right" :size="18")
          button(type="button" class="shelf-hero" :aria-label="shelf.name" @click="openSeries(shelf.seriesId)")
            img(
              :src="withPlaceholder(shelf.cover)"
              :alt="shelf.name"
              loading="lazy"
              draggable="false"
              @error="onImgFallback"
            )
          div(class="shelf-row")
            button(
              v-for="book in shelf.books"
              :key="book.bookId"
              type="button"
              class="shelf-book"
              :aria-label="bookTitle(book)"
              @click="openBook(book.bookId)"
            )
              img(
                :src="withPlaceholder(pickLocalizedImage(book.previewImage, lang))"
                :alt="bookTitle(book)"
                loading="lazy"
                draggable="false"
                @error="onImgFallback"
              )
              span(v-if="isNew(book)" class="new-badge") {{ t('app.read.newBadge') }}
          div(class="shelf-board" aria-hidden="true")

      div(v-if="!shelves.length && !isSearching" class="empty lk-panel")
        LkCompanion(class="empty-lamb" :pose="!online ? 'offline' : 'leer'" :size="110")
        template(v-if="!online")
          h2(class="empty-title") {{ t('app.state.offlineTitle') }}
          p(class="empty-sub") {{ t('app.state.offlineText') }}
          button(type="button" class="lk-btn lk-btn--outline" @click="reload")
            ZIconography(name="restart" :size="22")
            span {{ t('app.state.reconnect') }}
        template(v-else-if="apiBooks.state.error")
          h2(class="empty-title") {{ t('app.state.errorTitle') }}
          p(class="empty-sub") {{ t('app.state.errorText') }}
          button(type="button" class="lk-btn" @click="reload")
            ZIconography(name="restart" :size="22")
            span {{ t('app.state.retry') }}
        template(v-else)
          h2(class="empty-title") {{ t('app.allBooks.emptyTitle') }}
          p(class="empty-sub") {{ t('app.allBooks.emptySub') }}
</template>

<style scoped lang="sass">
button
  -webkit-tap-highlight-color: transparent
  font-family: inherit

.read-page
  min-height: 100vh
  background: var(--lk-bg)
  color: var(--lk-text)
  padding-bottom: calc(6.5rem + env(safe-area-inset-bottom, 0px))

.read-body
  max-width: 980px
  margin: 0 auto
  padding: 0 16px
  display: flex
  flex-direction: column
  gap: 28px

.read-title
  margin: 0
  font-weight: 800
  font-size: 1.9rem

.search-clear
  width: 36px
  height: 36px
  border: none
  border-radius: 50%
  background: var(--lk-surface-2)
  color: var(--lk-text)
  display: flex
  align-items: center
  justify-content: center
  cursor: pointer

  .close-x
    transform: rotate(45deg)

  :deep(.z-icon-outline)
    color: currentColor

.results-empty
  margin: 20px 0
  text-align: center
  color: var(--lk-muted)

.results-grid
  display: grid
  grid-template-columns: repeat(3, minmax(0, 1fr))
  gap: 16px 12px

.result
  display: flex
  flex-direction: column
  gap: 6px
  min-width: 0
  padding: 0
  border: none
  background: transparent
  color: var(--lk-text)
  text-align: left
  cursor: pointer

.result-cover
  position: relative
  display: block
  aspect-ratio: 3 / 4
  border-radius: 12px
  overflow: hidden
  background: var(--lk-surface-2)
  box-shadow: var(--lk-shadow)

  img
    width: 100%
    height: 100%
    object-fit: cover
    display: block

.result-title
  font-weight: 700
  font-size: 0.92rem
  line-height: 1.2
  display: -webkit-box
  -webkit-line-clamp: 3
  -webkit-box-orient: vertical
  overflow: hidden

.ask
  position: relative
  display: flex
  align-items: center
  gap: 8px
  min-height: 60px
  margin-top: 18px
  padding: 0 12px 0 84px
  cursor: text
  border: 1px solid var(--lk-line)
  border-radius: 28px
  background: var(--lk-surface)

.ask-lamb
  position: absolute
  left: 10px
  bottom: 0

.ask-input
  flex: 1
  min-width: 0
  height: 56px
  border: none
  outline: none
  background: transparent
  color: var(--lk-text)
  font-family: inherit
  font-weight: 700
  font-size: 1.05rem

  &::placeholder
    color: var(--lk-text)
    opacity: 1

.ask-search
  flex: 0 0 auto
  color: var(--lk-muted)

  :deep(.z-icon-outline)
    color: currentColor

.shelf
  padding: 14px 14px 16px
  overflow: hidden

.shelf-head
  display: flex
  align-items: center
  justify-content: space-between
  gap: 8px
  margin-bottom: 6px

.shelf-name
  min-height: 44px
  padding: 0
  border: none
  background: transparent
  color: var(--lk-text)
  font-weight: 800
  font-size: 1.3rem
  text-align: left
  cursor: pointer

.shelf-all
  gap: 2px
  padding: 0 12px 0 18px

.shelf-hero
  display: block
  width: 100%
  aspect-ratio: 16 / 9
  margin: 0 0 12px
  padding: 0
  border: none
  border-radius: var(--lk-r-card)
  overflow: hidden
  background: var(--lk-surface-2)
  box-shadow: var(--lk-shadow)
  cursor: pointer

  img
    width: 100%
    height: 100%
    object-fit: cover
    display: block

.shelf-row
  display: flex
  gap: 10px
  overflow-x: auto
  scroll-snap-type: x proximity
  margin: 0 -14px
  padding: 0 14px 4px
  scroll-padding-left: 14px
  scrollbar-width: none

  &::-webkit-scrollbar
    display: none

.shelf-book
  position: relative
  flex: 0 0 29%
  max-width: 190px
  aspect-ratio: 3 / 4
  padding: 0
  border: none
  border-radius: 10px
  overflow: hidden
  background: var(--lk-surface-2)
  box-shadow: var(--lk-shadow)
  scroll-snap-align: start
  cursor: pointer

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

// the board the books stand on
.shelf-board
  height: 12px
  margin-top: -2px
  border-radius: 8px
  background: var(--lk-shelf)

.empty
  display: flex
  flex-direction: column
  align-items: center
  gap: 6px
  padding: 16px 20px 24px
  text-align: center

.empty-lamb
  margin-top: -64px

.empty-title
  margin: 0 0 6px
  font-size: 1.2rem
  font-weight: 800

.empty-sub
  margin: 0
  color: var(--lk-muted)

@media (min-width: 720px)
  .read-body
    padding: 0 28px

  .shelf-row
    margin: 0 -28px
    padding-left: 28px
    padding-right: 28px
    scroll-padding-left: 28px

  .shelf-book
    flex-basis: 150px

  .shelf-hero
    aspect-ratio: 21 / 8
</style>
