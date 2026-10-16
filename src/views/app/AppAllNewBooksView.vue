<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import LkPageHead from '@/components/molecules/LkPageHead.vue'
import ZIconography from '@/components/atoms/ZIconography.vue'
import ZBadge from '@/components/atoms/ZBadge.vue'
import useApiBooks from '@/use/useApiBooks'
import { isMobileLandscape } from '@/use/useUser'
import type { ApiBook, Locale } from '@/types/apiBook'
import { pickLocalizedImage } from '@/types/apiBook'
import { onImgFallback, withPlaceholder } from '@/utils/placeholder'
import { prependBaseUrl } from '@/utils/function'

const { t, locale } = useI18n({ useScope: 'global' })
const router = useRouter()
const apiBooks = useApiBooks()

onMounted(() => {
  void apiBooks.loadAllBooks()
})

const lang = computed<Locale>(() => (locale.value === 'en' ? 'en' : 'de'))
const THREE_MONTHS_MS = 1000 * 60 * 60 * 24 * 90

// Backdrop — a tall artwork for portrait, a wide one for landscape. The swap
// itself happens in CSS (`@media (orientation: …)`); we only feed the
// base-url-corrected `url()` values in as custom properties, because the
// files live in `public/` and a bare `url(…)` inside the SFC style block
// would be resolved by Vite as a bundled asset.
const backdropVars = computed(() => ({
  '--series-bg-portrait': `url(${prependBaseUrl('images/bg/series_portrait.webp')})`,
  '--series-bg-landscape': `url(${prependBaseUrl('images/bg/series_landscape.webp')})`
}))

function localizedTitle(book: ApiBook): string {
  return book.localizations?.[lang.value]?.title || book.localizations?.de?.title || ''
}

const allBooks = computed<ApiBook[]>(() => (apiBooks.state.all ?? []) as ApiBook[])

const newBooks = computed<ApiBook[]>(() => {
  const now = Date.now()
  return allBooks.value
    .filter((b) => now - new Date(b.releaseDate).getTime() < THREE_MONTHS_MS)
    .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())
})

function openBook(bookId: string) {
  router.push({ name: 'app-book', params: { bookId } })
}

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push({ name: 'app-main' })
}
</script>

<template lang="pug">
  div(
    :class="['new-books-page', isMobileLandscape ? 'is-landscape' : '', 'min-h-screen w-full pb-[calc(8rem+env(safe-area-inset-bottom,0px))]']"
    :style="backdropVars"
  )
    LkPageHead(:title="t('app.home.newTitle')" :subtitle="t('app.newBooks.sub')" @back="goBack")

    div(class="page-content")
      div(v-if="newBooks.length" class="tile-grid")
        div(
          v-for="(book, idx) in newBooks"
          :key="book.bookId"
          class="book-tile"
          @click="openBook(book.bookId)"
        )
          div(class="book-tile-text")
            ZBadge(
              variant="hot"
              size="sm"
              position="top-right"
              :label="t('app.bookSeries.new').toUpperCase()"
            )
            //span(class="book-tile-band") {{ t('app.bookSeries.bandLabel', { n: idx + 1 }) }}
            h3(class="book-tile-name") {{ localizedTitle(book) }}

          div(class="book-tile-image")
            img(
              :src="withPlaceholder(pickLocalizedImage(book.previewImage, lang))"
              :alt="localizedTitle(book)"
              class="book-tile-img"
              loading="lazy"
              @error="onImgFallback"
            )

      div(
        v-else
        class="empty-card"
      ) {{ t('app.newBooks.empty') }}
</template>

<style scoped lang="sass">
$cream-bg: var(--lk-bg)
$cream-card: var(--lk-surface)
$navy: var(--lk-text)
$brown: var(--lk-muted)
$gold: var(--lk-accent)
$border: var(--lk-line)

button
  -webkit-tap-highlight-color: transparent

// The backdrop artwork lives on a viewport-pinned ::before layer instead of
// on the page box: the page scrolls (and is taller than the screen), so a
// plain background would scroll away and be sized against the whole document
// rather than the screen. `cover` keeps it filling the viewport edge-to-edge
// at every aspect ratio, with the beige palette colour underneath as a
// paint-in fallback while the artwork loads.
//
// `position: relative` + `z-index: 0` makes .new-books-page its own stacking
// context so the `z-index: -1` layer stays above #app-root's opaque
// background (which would otherwise hide it) while still sitting behind the
// page content.
.new-books-page
  position: relative
  z-index: 0
  background: transparent
  color: $navy

.new-books-page::before
  content: ''
  position: fixed
  top: 0
  left: 0
  width: 100%
  // Sized instead of `inset: 0` on purpose: during the page-pop-scale route
  // animation the transform on .new-books-page turns it into the containing
  // block for this fixed layer, and `bottom: 0` would then stretch the
  // artwork over the full document height and snap back when the animation
  // ends. A viewport-height box looks identical in both states.
  height: 100vh
  height: 100dvh
  z-index: -1
  pointer-events: none
  background-color: $cream-bg
  background-image: none
  background-repeat: no-repeat
  background-position: center
  background-size: cover

@media (orientation: landscape)
  .new-books-page::before
    background-image: none

.page-header
  position: relative
  padding: max(env(safe-area-inset-top), 0.75rem) 20px 8px
  max-width: 28rem
  margin: 0 auto

// Back button floats over the centred title block so the crown +
// title stack stays optically centred regardless of side widgets.
.page-back
  position: absolute
  top: calc(max(env(safe-area-inset-top), 0.75rem))
  left: 12px
  --back-icon-color: var(--lk-text) !important

.title-cluster
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  gap: 2px

.page-crown
  width: 28px
  height: auto
  object-fit: contain
  filter: drop-shadow(0 2px 4px rgba(58, 42, 18, 0.3))

.page-title
  font-size: 24px
  font-weight: 700
  color: $navy
  letter-spacing: -0.01em
  margin: 0
  line-height: 1.1

.page-content
  max-width: 28rem
  margin: 0 auto
  padding: 4px 20px 0
  display: flex
  flex-direction: column
  gap: 14px

.page-breadcrumb
  font-size: 11px
  font-weight: 700
  letter-spacing: 0.18em
  color: $brown
  text-transform: uppercase

.tile-grid
  display: flex
  flex-direction: column
  gap: 12px

.book-tile
  position: relative
  display: grid
  grid-template-columns: 1.25fr 1fr
  background: var(--lk-surface)
  border: 1.5px solid $border
  border-radius: 12px
  overflow: hidden
  cursor: pointer
  min-height: 130px
  box-shadow: 0 10px 26px -14px rgba(58, 42, 18, 0.3)
  transition: transform 200ms ease-out, box-shadow 200ms ease-out

  &:hover
    transform: translateY(-3px)
    box-shadow: 0 16px 32px -12px rgba(212, 168, 62, 0.4)

  &:active
    transform: scale(0.995)

.book-tile-text
  padding: 16px 14px 14px
  display: flex
  flex-direction: column
  gap: 6px
  min-width: 0

.book-tile-band
  font-size: 11px
  font-weight: 700
  letter-spacing: 0.12em
  text-transform: uppercase
  color: $gold

.book-tile-name
  font-size: 14px
  font-weight: 700
  color: $navy
  margin: 0
  line-height: 1.2
  display: -webkit-box
  -webkit-line-clamp: 4
  -webkit-box-orient: vertical
  overflow: hidden
  word-break: break-word

.book-tile-image
  position: relative
  overflow: hidden
  background: var(--lk-surface-2)
  display: flex
  align-items: stretch
  justify-content: center

.book-tile-img
  height: 100%
  width: auto
  max-width: 100%
  object-fit: contain
  display: block

.empty-card
  text-align: center
  background: $cream-card
  border: 1px dashed $border
  border-radius: 18px
  padding: 28px 18px
  color: $brown
  font-size: 14px

// ===== Mobile landscape =====
.is-landscape
  .page-content
    max-width: 64rem

  .tile-grid
    display: grid
    grid-template-columns: 1fr 1fr
    gap: 14px
</style>
