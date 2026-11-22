<script setup lang="ts">
/**
 * "Lesen → Stories": the shelves (coloring books and printed store books are not here, they have their own areas). One row per series (the name on the left, "Alle" on the right); the books of the series stand on a
 * board and can be swiped sideways. A tap on a book opens it, a tap on the name or on "Alle" opens the whole series.
 * Publishers other than LambKing get their own shelf with the same look (a series of theirs is a row like any other).
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import ZIconography from '@/components/atoms/ZIconography.vue'
import LkCompanion from '@/components/atoms/LkCompanion.vue'
import BookListSkeleton from '@/components/molecules/BookListSkeleton.vue'
import BookListError from '@/components/molecules/BookListError.vue'
import { sizedImage } from '@/utils/sizedImage'
import AppHeader from '@/components/molecules/AppHeader.vue'
import useAskedBook from '@/use/useAskedBook'
import ContentLanguageSwitch from '@/components/molecules/ContentLanguageSwitch.vue'
import useContentLanguage, { bookIn } from '@/use/useContentLanguage'
import useModels from '@/use/useModels'
import useApiBooks from '@/use/useApiBooks'
import useApiSeries from '@/use/useApiSeries'
import useOfflineStories, { type OfflineItem } from '@/use/useOfflineStories'
import { cachedBlobUrl } from '@/use/useBookCache'
import useCatalogNames from '@/use/useCatalogNames'
import type { ApiBook, Locale } from '@/types/apiBook'
import { pickLocalizedImage } from '@/types/apiBook'
import { onImgFallback, withPlaceholder } from '@/utils/placeholder'
import { booksOfArea } from '@/utils/readingAreas'
import { goBackTo } from '@/utils/navBack'
import { contentLocale } from '@/utils/contentLocale'
import { displayTitles } from '@/utils/seriesNumbering'

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
  // the net is back: the list is fetched again and the page changes from "readable without a net" to the shelves
  if (online.value) reload()
}

function reload() {
  void apiBooks.loadAllBooks().then(loadOfflineList)
  void apiSeries.loadAll()
}

// ----- Without a net: the stories that lie on the device (text and cover) -----
const offlineStories = useOfflineStories()
const offlineItems = ref<OfflineItem[]>([])
const offlineCovers = ref<Record<string, string>>({})
/** No net, or the server does not answer: only what lies on the device can be opened. */
const offlineMode = computed(() => !online.value || !!apiBooks.state.listFailed)

function releaseCovers() {
  for (const url of Object.values(offlineCovers.value)) {
    try {
      URL.revokeObjectURL(url)
    } catch {
      // nothing to let go of
    }
  }
  offlineCovers.value = {}
}

async function loadOfflineList() {
  if (!offlineMode.value) return
  try {
    const items = await offlineStories.list()
    const covers: Record<string, string> = {}
    for (const item of items) {
      const blob = await cachedBlobUrl(pickLocalizedImage(item.book.previewImage, lang.value))
      if (blob) covers[item.book.bookId] = blob
    }
    releaseCovers()
    offlineItems.value = items
    offlineCovers.value = covers
  } catch {
    offlineItems.value = []
  }
}

onMounted(() => {
  reload()
  window.addEventListener('online', setOnline)
  window.addEventListener('offline', setOnline)
  if (offlineMode.value) void loadOfflineList()
})
onBeforeUnmount(() => {
  window.removeEventListener('online', setOnline)
  window.removeEventListener('offline', setOnline)
  releaseCovers()
})

const { shelfLanguage } = useContentLanguage()
// a book of "New for you" leads here with `?book=<id>` (see `useAskedBook`)
const { asked } = useAskedBook()
watch(offlineMode, (off) => {
  if (off) void loadOfflineList()
})
// only the stories: coloring books are in "Malbücher", printed store books in "Books"
const storyBooks = computed<ApiBook[]>(() => booksOfArea((apiBooks.state.all ?? []) as ApiBook[], 'stories'))
// the language of the shelf (the round flags on top): only the stories that exist in it are shown
const lang = computed<Locale>(() => shelfLanguage(storyBooks.value))
const allBooks = computed<ApiBook[]>(() => storyBooks.value.filter((b) => bookIn(b, lang.value)))

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
    const inSeries = booksOfArea(apiBooks.booksOfSeries(sid), 'stories').filter((b) => bookIn(b, lang.value))
    const ofSeries = inSeries.length ? inSeries : books
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

// without a net the search runs over the stories on the device
const offlineShown = computed<OfflineItem[]>(() => {
  const term = query.value.trim().toLowerCase()
  if (!term) return offlineItems.value
  return offlineItems.value.filter(({ book }) => {
    const de = book.localizations?.de?.title?.toLowerCase() ?? ''
    const en = book.localizations?.en?.title?.toLowerCase() ?? ''
    return de.includes(term) || en.includes(term) || (book.author?.toLowerCase() ?? '').includes(term)
  })
})
const showOffline = computed(() => offlineMode.value && offlineItems.value.length > 0)
const nothingToShow = computed(() => !shelves.value.length && !isSearching.value && !showOffline.value)
// The names, order and pictures of the series come with their own (tiny) list; the shelves wait for it a moment (at most 2.5 s), so that they are
// not drawn with made-up names first and then jump into their order.
const seriesWait = ref(true)
const seriesWaitTimer = setTimeout(() => (seriesWait.value = false), 2500)
onBeforeUnmount(() => clearTimeout(seriesWaitTimer))
const seriesReady = computed(() => apiSeries.state.all !== null || !!apiSeries.state.error || !seriesWait.value)
/** The first answer is not there yet: placeholders instead of an empty page (and instead of shelves that would still jump). */
const showSkeleton = computed(
  () => online.value && !isSearching.value && !showOffline.value && ((!shelves.value.length && !apiBooks.state.listReady) || (shelves.value.length > 0 && !seriesReady.value))
)
/** The server did not answer and the device has nothing: a friendly note and a button. */
const showError = computed(() => nothingToShow.value && online.value && apiBooks.state.listReady && apiBooks.state.listFailed)
const offlineText = computed(() => (online.value ? t('app.offline.listTextServer') : t('app.offline.listText')))

function isNew(book: ApiBook): boolean {
  const age = Date.now() - new Date(book.releaseDate).getTime()
  return age >= 0 && age < NEW_DAYS * 86400000
}

function rawTitle(book: ApiBook): string {
  return book.localizations?.[lang.value]?.title || book.localizations?.de?.title || ''
}

// a series whose numbers stand twice is numbered again in the order of its shelf (old books that are still published)
const shownTitle = computed(() => {
  const map = new Map<string, string>()
  for (const sh of shelves.value) {
    const shown = displayTitles(sh.books.map(rawTitle))
    sh.books.forEach((b, i) => map.set(b.bookId, shown[i] ?? rawTitle(b)))
  }
  return map
})

function bookTitle(book: ApiBook): string {
  return shownTitle.value.get(book.bookId) ?? rawTitle(book)
}

function goBack() {
  goBackTo(router, { name: 'app-read' })
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
      div(class="read-top")
        button(type="button" class="read-back lk-btn lk-btn--outline lk-btn--small" @click="goBack")
          ZIconography(name="chevron-left" :size="20")
          span {{ t('app.read.back') }}
        ContentLanguageSwitch(:books="storyBooks")
      h1(class="read-title") {{ t('app.read.storiesTitle') }}
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

      //- without a net (or with a server that does not answer): the stories that lie on the device, instead of shelves that cannot be opened
      section(v-if="showOffline" class="offline-list lk-panel" data-test="offline-list")
        h2(class="offline-title") {{ t('app.offline.listTitle') }}
        p(class="offline-text") {{ offlineText }}
        p(v-if="isSearching && !offlineShown.length" class="results-empty") {{ t('app.main.searchEmpty') }}
        div(class="results-grid")
          button(
            v-for="item in offlineShown"
            :key="item.book.bookId"
            type="button"
            class="result"
            data-test="offline-item"
            @click="openBook(item.book.bookId)"
          )
            span(class="result-cover")
              img(
                :src="offlineCovers[item.book.bookId] || withPlaceholder(pickLocalizedImage(item.book.previewImage, lang))"
                :alt="bookTitle(item.book)"
                draggable="false"
                @error="onImgFallback"
              )
              span(v-if="item.meta.pinned" class="pin-mark" role="img" :aria-label="t('app.offline.pinnedMark')")
                ZIconography(name="check" :size="16")
            span(class="result-title") {{ bookTitle(item.book) }}
        button(type="button" class="lk-btn lk-btn--outline offline-retry" @click="reload")
          ZIconography(name="restart" :size="22")
          span {{ t('app.state.reconnect') }}

      //- results replace the shelves while something is typed
      section(v-else-if="isSearching" class="results")
        p(v-if="!results.length" class="results-empty") {{ t('app.main.searchEmpty') }}
        div(v-else class="results-grid")
          button(
            v-for="book in results"
            :key="book.bookId"
            type="button"
            :class="['result', { 'is-asked': asked === book.bookId }]"
            :data-book-id="book.bookId"
            @click="openBook(book.bookId)"
          )
            span(class="result-cover")
              img(
                :src="withPlaceholder(sizedImage(pickLocalizedImage(book.previewImage, lang), 112))"
                :alt="bookTitle(book)"
                loading="lazy"
                draggable="false"
                @error="onImgFallback"
              )
              span(v-if="isNew(book)" class="new-badge") {{ t('app.read.newBadge') }}
            span(class="result-title") {{ bookTitle(book) }}

      template(v-else-if="seriesReady")
        section(v-for="shelf in shelves" :key="shelf.seriesId" class="shelf lk-panel")
          div(class="shelf-head")
            button(type="button" class="shelf-name" @click="openSeries(shelf.seriesId)") {{ shelf.name }}
            button(type="button" class="shelf-all lk-btn lk-btn--outline lk-btn--small" @click="openSeries(shelf.seriesId)")
              span {{ t('app.read.all') }}
              ZIconography(name="chevron-right" :size="18")
          button(type="button" class="shelf-hero" :aria-label="shelf.name" @click="openSeries(shelf.seriesId)")
            img(
              :src="withPlaceholder(sizedImage(shelf.cover, 330))"
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
              :class="['shelf-book', { 'is-asked': asked === book.bookId }]"
              :data-book-id="book.bookId"
              :aria-label="bookTitle(book)"
              @click="openBook(book.bookId)"
            )
              img(
                :src="withPlaceholder(sizedImage(pickLocalizedImage(book.previewImage, lang), 100))"
                :alt="bookTitle(book)"
                loading="lazy"
                draggable="false"
                @error="onImgFallback"
              )
              span(v-if="isNew(book)" class="new-badge") {{ t('app.read.newBadge') }}
          div(class="shelf-board" aria-hidden="true")

      //- while the list is on its way: placeholders in the size of the shelves (never "no series yet", which would be wrong)
      BookListSkeleton(v-if="showSkeleton" variant="shelves")
      //- the server did not answer and nothing is kept: a friendly note with a button
      BookListError(v-else-if="showError" @retry="reload")
      div(v-else-if="!shelves.length && !isSearching && !showOffline" class="empty lk-panel")
        LkCompanion(class="empty-lamb" :pose="!online ? 'offline' : 'leer'" :size="110")
        template(v-if="!online")
          h2(class="empty-title") {{ t('app.offline.emptyTitle') }}
          p(class="empty-sub") {{ t('app.offline.emptyText') }}
          button(type="button" class="lk-btn lk-btn--outline" @click="reload")
            ZIconography(name="restart" :size="22")
            span {{ t('app.state.reconnect') }}
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

.read-top
  display: flex
  align-items: center
  justify-content: space-between
  gap: 12px
  margin-bottom: -14px

.read-back
  align-self: center
  margin-bottom: 0
  gap: 4px
  padding: 0 18px 0 10px

  :deep(.z-icon-outline)
    color: currentColor

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

.offline-list
  padding: 16px 14px 18px

.offline-title
  margin: 0 0 4px
  font-weight: 800
  font-size: 1.3rem

.offline-text
  margin: 0 0 14px
  color: var(--lk-muted)
  font-size: 1rem
  line-height: 1.35

.offline-retry
  margin: 16px auto 0
  display: flex

// a small check on the cover of a story that is saved "for the road"
.pin-mark
  position: absolute
  right: 6px
  bottom: 6px
  width: 26px
  height: 26px
  border-radius: 50%
  display: flex
  align-items: center
  justify-content: center
  background: var(--lk-accent)
  color: var(--lk-on-accent)

  :deep(.z-icon-outline)
    color: currentColor

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

// the book that was asked for (from "New for you") shows a ring for a moment
.shelf-book.is-asked,
.result.is-asked
  outline: 3px solid var(--lk-accent)
  outline-offset: 3px
  border-radius: 14px
</style>
