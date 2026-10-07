<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import ZBackButton from '@/components/atoms/ZBackButton.vue'
import BookGridSection from '@/components/organisms/BookGridSection.vue'
import useModels from '@/use/useModels'
import useApiBooks from '@/use/useApiBooks'
import useApiSeries from '@/use/useApiSeries'
import useCatalogNames from '@/use/useCatalogNames'
import { isMobileLandscape } from '@/use/useUser'
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

onMounted(() => {
  void apiBooks.loadAllBooks()
  // Fetch the live series records so the hero pulls the
  // editor-uploaded `coverImage` instead of falling back to the first
  // book's preview.
  void apiSeries.loadAll()
})

const lang = computed<Locale>(() => (locale.value === 'en' ? 'en' : 'de'))
const seriesId = computed(() => String(route.params.seriesId))

const seriesMeta = computed(() => getSeries(seriesId.value))

const books = computed<ApiBook[]>(() => {
  void apiBooks.state.all
  return apiBooks.booksOfSeries(seriesId.value)
})

// Hero image source priority:
//   1. The server-side series record (carries the cover uploaded via
//      the AdminUI dropzone).
//   2. The hard-coded `useModels` catalogue.
//   3. The first book's preview as a graceful fallback.
//   4. The shared placeholder.
const heroImage = computed<string>(() => {
  void apiSeries.state.all
  const apiMeta = apiSeries.getById(seriesId.value)
  if (apiMeta?.coverImage) return apiMeta.coverImage
  const meta = seriesMeta.value
  if (meta?.coverImage) return meta.coverImage
  const first = books.value[0]
  if (first) return pickLocalizedImage(first.previewImage, lang.value)
  return PLACEHOLDER_IMAGE
})

const description = computed<string>(() => {
  return seriesMeta.value?.description
    || ''
})

// Title priority mirrors the hero image: the server-side series record
// first (the legacy `useModels` catalogue only covers one series, so it
// left the heading blank for every other one), then the localized override
// for the id, then the raw seriesId as a last resort.
const seriesTitle = computed<string>(() => {
  void apiSeries.state.all
  const apiMeta = apiSeries.getById(seriesId.value)
  return seriesName(seriesId.value, apiMeta?.name || seriesMeta.value?.name || '')
})

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push({ name: 'app-all-books' })
}
</script>

<template lang="pug">
  div(:class="['series-detail-page', isMobileLandscape ? 'is-landscape' : '', 'min-h-screen w-full pb-[calc(8rem+env(safe-area-inset-bottom,0px))]']")
    //- ===== Hero image with back arrow (stretched series cover) =====
    div(class="hero")
      img(
        :src="withPlaceholder(heroImage)"
        :alt="seriesTitle"
        class="hero-img"
        loading="eager"
        @error="onImgFallback"
      )
      span(class="hero-fade")
      ZBackButton(
        variant="floating"
        :size="40"
        class="hero-back"
        @click="goBack"
      )

      //- Title + tagline floating on the lower portion of the hero
      div(class="hero-title-block")
        h1(class="hero-title") {{ seriesTitle }}
        p(
          v-if="seriesMeta?.description"
          class="hero-subtitle"
        ) {{ t('app.bookSeries.tagline') }}

    div(class="content")
      p(class="series-desc") {{ description }}

      //- Shared book list (layout toggle + cards) — the same component
      //- renders the Categories page, so the two stay in sync.
      BookGridSection(
        :books="books"
        :title="t('app.bookSeries.books')"
        :empty-text="t('app.bookSeries.empty')"
      )
</template>

<style scoped lang="sass">
$cream-bg: #f3e6c4
$cream-card: #fdf8ed
$navy: #1a2f4a
$brown: #7a6b55
$gold: #d4a83e
$border: #e6d6b5

button
  -webkit-tap-highlight-color: transparent

.series-detail-page
  background: radial-gradient(ellipse at top, #faf2dc 0%, #f3e6c4 60%, #e8d29a 100%)
  color: $navy

.hero
  position: relative
  width: 100%
  max-height: 320px
  aspect-ratio: 4 / 3
  overflow: hidden
  background: linear-gradient(160deg, #f3e6c4 0%, #c89030 100%)

.hero-img
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  object-fit: cover
  object-position: center

.hero-fade
  position: absolute
  inset: 0
  background: linear-gradient(180deg, rgba(20, 14, 6, 0) 40%, rgba(20, 14, 6, 0.55) 100%)
  pointer-events: none

.hero-back
  position: absolute
  top: calc(env(safe-area-inset-top, 0px) + 12px)
  left: 12px
  width: 40px
  height: 40px
  border-radius: 999px
  background-color: rgba(255, 255, 255, 0.85)
  border: 1.5px solid rgba(230, 214, 181, 0.6)
  color: $navy
  display: inline-flex
  align-items: center
  justify-content: center
  cursor: pointer
  box-shadow: 0 6px 14px -6px rgba(0, 0, 0, 0.35)
  transition: transform 150ms ease-out, background-color 150ms ease-out

  &:hover
    background-color: #ffffff
    transform: translateY(-1px)

  &:active
    transform: scale(0.94)

  // Tablet: line the button up with the left edge of the centred 28rem
  // column below instead of leaving it alone in the screen corner.
  @media (min-width: 768px)
    left: calc(50% - 14rem + 8px)

.hero-crest
  position: absolute
  top: calc(env(safe-area-inset-top, 0px) + 12px)
  right: 14px
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.35))

.hero-title-block
  position: absolute
  left: 50%
  transform: translateX(-50%)
  bottom: 14px
  text-align: center
  width: calc(100% - 40px)

.hero-title
  font-size: 26px
  font-weight: 700
  color: #ffffff
  margin: 0
  letter-spacing: -0.005em
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.55)

.hero-subtitle
  font-size: 13px
  color: #fbf1d6
  margin-top: 4px
  font-weight: 700
  letter-spacing: 0.01em
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5)

.content
  max-width: 28rem
  margin: 0 auto
  padding: 14px 20px 0
  display: flex
  flex-direction: column
  gap: 14px

.series-desc
  font-size: 14px
  line-height: 1.5
  color: $navy
  text-align: center
  margin: 0
  padding: 0 4px

// ===== Mobile landscape =====
.is-landscape
  .hero
    max-height: 220px
    aspect-ratio: 16 / 6

  .content
    max-width: 64rem
    grid-template-columns: 1fr 1fr
</style>
