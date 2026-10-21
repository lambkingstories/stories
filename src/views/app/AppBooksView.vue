<script setup lang="ts">
/**
 * "Lesen → Books": printed books of LambKing Stories that are sold in the store. Each is a card with the cover, a short text and a
 * button to the store. Links leave the app through `openExternal`, which asks the parents first. The books are the entries of
 * `storeBooks` and the books of the backend series "Einzelne Bücher".
 */
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import ZIconography from '@/components/atoms/ZIconography.vue'
import LkPageHead from '@/components/molecules/LkPageHead.vue'
import useApiBooks from '@/use/useApiBooks'
import { STORE_URL, storeBooks } from '@/data/storeBooks'
import { booksOfArea } from '@/utils/readingAreas'
import { pickLocalizedImage, type ApiBook, type Locale } from '@/types/apiBook'
import { goBackTo } from '@/utils/navBack'
import { onImgFallback, withPlaceholder } from '@/utils/placeholder'
import { openExternal } from '@/utils/openExternal'
import { prependBaseUrl } from '@/utils/function'

const { t, locale } = useI18n({ useScope: 'global' })
const router = useRouter()
const apiBooks = useApiBooks()

const lang = computed<Locale>(() => (locale.value === 'en' ? 'en' : 'de'))

onMounted(() => {
  void apiBooks.loadAllBooks()
})

interface BookCardData {
  id: string
  series: string
  title: string
  text: string
  cover: string
  url: string
}

const cards = computed<BookCardData[]>(() => {
  const own: BookCardData[] = storeBooks.map((b) => ({
    id: b.id,
    series: b.series,
    title: b.title[lang.value],
    text: b.text[lang.value],
    cover: prependBaseUrl(b.cover),
    url: b.url
  }))
  const fromBackend = booksOfArea((apiBooks.state.all ?? []) as ApiBook[], 'books').map((b) => ({
    id: b.bookId,
    series: '',
    title: b.localizations?.[lang.value]?.title || b.localizations?.de?.title || '',
    text: b.localizations?.[lang.value]?.shortDescription || b.localizations?.de?.shortDescription || '',
    cover: withPlaceholder(pickLocalizedImage(b.previewImage, lang.value)),
    url: pickLocalizedImage(b.etsyLink, lang.value) || STORE_URL
  }))
  return [...own, ...fromBackend]
})

function goBack() {
  goBackTo(router, { name: 'app-read' })
}

function toStore(url: string) {
  void openExternal(url)
}
</script>

<template lang="pug">
  div(class="books-page")
    LkPageHead(:title="t('app.read.booksTitle')" :subtitle="t('app.read.storeNote')" @back="goBack")

    main(class="books-body")
      ul(v-if="cards.length" class="book-list")
        li(v-for="c in cards" :key="c.id" class="book-card lk-panel")
          span(class="book-cover")
            img(:src="c.cover" :alt="c.title" loading="lazy" draggable="false" @error="onImgFallback")
          span(class="book-info")
            span(v-if="c.series" class="book-series") {{ c.series }}
            h2(class="book-title") {{ c.title }}
            p(v-if="c.text" class="book-text") {{ c.text }}
            button(type="button" class="lk-btn book-store" @click="toStore(c.url)")
              ZIconography(name="shop" :size="24")
              span {{ t('app.read.storeButton') }}
              ZIconography(name="chevron-right" :size="22")
            p(class="book-note") {{ t('app.read.storeParents') }}
      p(v-else class="books-empty") {{ t('app.read.booksEmpty') }}
</template>

<style scoped lang="sass">
button
  -webkit-tap-highlight-color: transparent
  font-family: inherit

.books-page
  min-height: 100vh
  background: var(--lk-bg)
  color: var(--lk-text)
  padding-bottom: calc(6.5rem + env(safe-area-inset-bottom, 0px))

.books-body
  max-width: 980px
  margin: 0 auto
  padding: 12px 16px 0

.book-list
  list-style: none
  margin: 0
  padding: 0
  display: flex
  flex-direction: column
  gap: 18px

.book-card
  display: flex
  flex-direction: column
  gap: 16px
  padding: 16px

.book-cover
  display: block
  align-self: center
  width: min(70%, 280px)
  aspect-ratio: 1 / 1
  border-radius: var(--lk-r-cover)
  overflow: hidden
  background: var(--lk-surface-2)
  box-shadow: var(--lk-shadow)

  img
    width: 100%
    height: 100%
    object-fit: cover
    display: block

.book-info
  display: flex
  flex-direction: column
  gap: 8px
  min-width: 0

.book-series
  font-weight: 800
  font-size: 0.85rem
  letter-spacing: 0.06em
  text-transform: uppercase
  color: var(--lk-muted)

.book-title
  margin: 0
  font-weight: 800
  font-size: 1.5rem
  line-height: 1.15

.book-text
  margin: 0
  font-size: 1.05rem
  line-height: 1.45

.book-store
  align-self: flex-start
  gap: 10px
  margin-top: 6px
  padding: 0 18px 0 20px

  :deep(.z-icon-outline)
    color: currentColor

.book-note
  margin: 0
  font-size: 0.9rem
  color: var(--lk-muted)

.books-empty
  text-align: center
  color: var(--lk-muted)
  margin: 32px 0

@media (min-width: 720px)
  .books-body
    padding: 12px 28px 0

  .book-card
    flex-direction: row
    align-items: center
    gap: 28px
    padding: 22px

  .book-cover
    flex: none
    width: 260px
</style>
