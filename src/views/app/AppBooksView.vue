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
import { STORE_URL, digitalBooks, storeBooks } from '@/data/storeBooks'
import { bookProductId } from '@/data/plusProducts'
import usePremium from '@/use/usePremium'
import usePurchases from '@/use/usePurchases'
import { booksOfArea } from '@/utils/readingAreas'
import { pickLocalizedImage, type ApiBook, type Locale } from '@/types/apiBook'
import { goBackTo } from '@/utils/navBack'
import { onImgFallback, withPlaceholder } from '@/utils/placeholder'
import { openExternal } from '@/utils/openExternal'
import { prependBaseUrl } from '@/utils/function'
import { contentLocale } from '@/utils/contentLocale'

const { t, locale } = useI18n({ useScope: 'global' })
const router = useRouter()
const apiBooks = useApiBooks()
const purchases = usePurchases()
const { ownsBook } = usePremium()

const lang = computed<Locale>(() => (contentLocale(locale.value)))

onMounted(() => {
  void apiBooks.loadAllBooks()
  purchases.resetPurchaseStatus()
  for (const b of digitalBooks()) void purchases.loadBookPrice(b.id)
})

interface BookCardData {
  id: string
  series: string
  title: string
  text: string
  cover: string
  /** Width divided by height of the cover (a square one is 1). */
  ratio: number
  url: string
  /** The book is announced and not in the store yet. */
  comingSoon: boolean
  /** The book has a look inside (a preview that can be paged through). */
  preview: boolean
  /** The book can also be bought as a digital book in the app. */
  digital: boolean
}

const cards = computed<BookCardData[]>(() => {
  const own: BookCardData[] = storeBooks.map((b) => ({
    id: b.id,
    series: b.series,
    title: b.title[lang.value],
    text: b.text[lang.value],
    cover: prependBaseUrl(b.cover),
    ratio: b.coverRatio ?? 1,
    url: b.url,
    comingSoon: !!b.comingSoon,
    preview: !!b.preview?.pages.length,
    digital: !!b.digital
  }))
  const fromBackend = booksOfArea((apiBooks.state.all ?? []) as ApiBook[], 'books').map((b) => ({
    id: b.bookId,
    series: '',
    title: b.localizations?.[lang.value]?.title || b.localizations?.de?.title || '',
    text: b.localizations?.[lang.value]?.shortDescription || b.localizations?.de?.shortDescription || '',
    cover: withPlaceholder(pickLocalizedImage(b.previewImage, lang.value)),
    ratio: 1,
    url: pickLocalizedImage(b.etsyLink, lang.value) || STORE_URL,
    comingSoon: false,
    preview: false,
    digital: false
  }))
  return [...own, ...fromBackend]
})

function goBack() {
  goBackTo(router, { name: 'app-read' })
}

function toStore(url: string) {
  void openExternal(url)
}

function toPreview(id: string) {
  void router.push({ name: 'app-book-preview', params: { bookId: id } })
}

/** A digital book: the price of the store (or the one of the data until the store has answered), whether it is bought, buying and reading. */
const priceOf = (id: string) => purchases.prices.value[bookProductId(id)] ?? storeBooks.find((b) => b.id === id)?.digital?.price ?? ''
const isOwned = (id: string) => ownsBook(id)
/** Said above the list when a purchase did not go through. */
const buyMessage = computed(() => {
  const s = purchases.status.value
  if (s === 'pending') return t('app.read.digitalPending')
  if (s === 'failed') return t('app.read.digitalFailed')
  if (s === 'unavailable') return t('app.read.digitalUnavailable')
  return ''
})
function buyDigital(id: string) {
  void purchases.buyBook(id)
}
function toRead(id: string) {
  void router.push({ name: 'app-book-read', params: { bookId: id } })
}
</script>

<template lang="pug">
  div(class="books-page")
    LkPageHead(:title="t('app.read.booksTitle')" :subtitle="t('app.read.storeNote')" @back="goBack")

    main(class="books-body")
      p(v-if="buyMessage" class="books-msg lk-panel" role="status") {{ buyMessage }}
      ul(v-if="cards.length" class="book-list")
        li(v-for="c in cards" :key="c.id" class="book-card lk-panel")
          span(:class="['book-cover', { tall: c.ratio < 0.9 }]" :style="{ aspectRatio: String(c.ratio) }")
            img(:src="c.cover" :alt="c.title" loading="lazy" draggable="false" @error="onImgFallback")
          span(class="book-info")
            span(v-if="c.comingSoon" class="book-soon") {{ t('app.read.comingSoon') }}
            span(v-if="c.series" class="book-series") {{ c.series }}
            h2(class="book-title") {{ c.title }}
            p(v-if="c.text" class="book-text") {{ c.text }}
            div(class="book-actions")
              button(v-if="c.preview" type="button" class="lk-btn lk-btn--outline book-preview" @click="toPreview(c.id)")
                span {{ t('app.read.preview') }}
              button(v-if="c.digital && isOwned(c.id)" type="button" class="lk-btn book-digital" @click="toRead(c.id)")
                span {{ t('app.read.digitalRead') }}
                ZIconography(name="chevron-right" :size="22")
              button(v-else-if="c.digital" type="button" class="lk-btn book-digital" :disabled="purchases.status.value === 'purchasing'" @click="buyDigital(c.id)")
                span {{ t('app.read.digitalBuy', { price: priceOf(c.id) }) }}
              button(v-if="!c.comingSoon" type="button" :class="['lk-btn book-store', { 'lk-btn--outline': c.digital }]" @click="toStore(c.url)")
                ZIconography(name="shop" :size="24")
                span {{ c.digital ? t('app.read.printedBook') : t('app.read.storeButton') }}
                ZIconography(name="chevron-right" :size="22")
            p(v-if="c.digital && !c.comingSoon" class="book-note") {{ isOwned(c.id) ? t('app.read.digitalOwned') : t('app.read.digitalNote') }}
            p(v-else-if="!c.comingSoon" class="book-note") {{ t('app.read.storeParents') }}
            p(v-else class="book-note") {{ t('app.read.soonNote') }}
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

  &.tall
    width: min(56%, 220px)

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

.book-soon
  align-self: flex-start
  padding: 4px 14px
  border-radius: 999px
  background: var(--lk-accent)
  color: var(--lk-on-accent)
  font-weight: 800
  font-size: 0.85rem
  letter-spacing: 0.06em
  text-transform: uppercase

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

.book-actions
  display: flex
  flex-wrap: wrap
  gap: 10px
  margin-top: 6px

.book-preview
  padding: 0 22px

.books-msg
  margin: 0 0 14px
  padding: 12px 16px
  font-weight: 700
  text-align: center

.book-digital
  padding: 0 22px

.book-store
  align-self: flex-start
  gap: 10px
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

    &.tall
      width: 210px
</style>
