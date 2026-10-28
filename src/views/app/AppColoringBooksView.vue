<script setup lang="ts">
/**
 * "Lesen → Malbücher": all coloring books. A tap opens the book (`AppColoringBookView`), where the pages can be turned and
 * painted. A card shows the cover, the title, the number of pictures and, once the child has begun, how many are painted.
 */
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import LkPageHead from '@/components/molecules/LkPageHead.vue'
import useApiBooks from '@/use/useApiBooks'
import { listArtworks, pageArtworkId, type ArtworkMeta } from '@/use/useArtworks'
import { booksOfArea } from '@/utils/readingAreas'
import { coloringPagesOfBook } from '@/utils/coloringBook'
import { pickLocalizedImage, type ApiBook, type Locale } from '@/types/apiBook'
import { goBackTo } from '@/utils/navBack'
import { onImgFallback, withPlaceholder } from '@/utils/placeholder'

const { t, locale } = useI18n({ useScope: 'global' })
const route = useRoute()
const router = useRouter()
/** Opened from the painting program: the way back leads there and not to "Lesen". */
const fromPainting = computed(() => route.query.from === 'malen')
const apiBooks = useApiBooks()

const lang = computed<Locale>(() => (locale.value === 'en' ? 'en' : 'de'))
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
  title: string
  cover: string
  /** For the order: the import gives the volumes rising dates, so Band 1 comes before Band 2. */
  released: number
  total: number
  done: number
}

/** The title without a leading "Buch 01 –" of the old books. */
function cleanTitle(s: string): string {
  return s.replace(/^Buch\s*\d+\s*[–-]\s*/i, '')
}

const cards = computed<Card[]>(() => {
  const painted = new Set(works.value.map((w) => w.id))
  const list: Card[] = []
  for (const book of booksOfArea((apiBooks.state.all ?? []) as ApiBook[], 'coloring')) {
    const pages = coloringPagesOfBook(book, locale.value)
    const title = book.localizations?.[lang.value]?.title || book.localizations?.de?.title || book.bookId
    list.push({
      bookId: book.bookId,
      title: cleanTitle(title),
      cover: withPlaceholder(pickLocalizedImage(book.previewImage, lang.value)),
      released: Date.parse(book.releaseDate) || 0,
      total: pages.length,
      done: pages.filter((p) => painted.has(pageArtworkId(p.url, 1))).length
    })
  }
  return list.sort((a, b) => a.released - b.released || a.bookId.localeCompare(b.bookId))
})

function goBack() {
  goBackTo(router, { name: fromPainting.value ? 'app-coloring' : 'app-read' })
}

function openBook(bookId: string) {
  void router.push({ name: 'app-coloring-book', params: { bookId } })
}
</script>

<template lang="pug">
  div(class="cb-page")
    LkPageHead(:title="t('app.read.coloringTitle')" :subtitle="t('app.read.coloringSub')" @back="goBack")

    main(class="cb-body")
      ul(v-if="cards.length" class="cb-grid")
        li(v-for="c in cards" :key="c.bookId")
          button(type="button" class="cb-card" :aria-label="c.title" @click="openBook(c.bookId)")
            span(class="cb-cover")
              img(:src="c.cover" :alt="c.title" loading="lazy" draggable="false" @error="onImgFallback")
            span(class="cb-title") {{ c.title }}
            span(v-if="c.total" class="cb-meta") {{ c.done > 0 ? t('app.read.paintedOf', { done: c.done, total: c.total }) : t('app.read.pictures', { n: c.total }) }}
            span(v-if="c.done > 0 && c.total" class="cb-bar")
              span(class="cb-bar-fill" :style="{ width: Math.round((c.done / c.total) * 100) + '%' }")
      p(v-else class="cb-empty") {{ t('app.read.coloringEmpty') }}
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

.cb-cover
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
  margin-top: 4px
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
