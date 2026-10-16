<script setup lang="ts">
/**
 * Shared "book list with layout toggle" section — the "Bücher der
 * Serie" block extracted from AppBookSeriesView so the Categories page
 * can render the exact same cards. Owns the 3-col / 2-col / list
 * layout switch (persisted per device via useAppPrefs), the NEU badge,
 * the list-mode badge chips, and the empty state. Card clicks navigate
 * to the BookDetail view.
 */
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import ZBadge from '@/components/atoms/ZBadge.vue'
import ZIconography from '@/components/atoms/ZIconography.vue'
import useCatalogNames from '@/use/useCatalogNames'
import { isMobileLandscape } from '@/use/useUser'
import type { ApiBook, Locale } from '@/types/apiBook'
import { pickLocalizedImage } from '@/types/apiBook'
import { onImgFallback, withPlaceholder } from '@/utils/placeholder'
import { GAME_BOOK_SERIES_LAYOUT } from '@/utils/constants'
import { getPref, setPref } from '@/use/useAppPrefs'

const props = defineProps<{
  books: ApiBook[]
  title: string
  emptyText: string
}>()

const { t, locale } = useI18n({ useScope: 'global' })
const router = useRouter()
const { badgeLabel } = useCatalogNames()

const lang = computed<Locale>(() => (locale.value === 'en' ? 'en' : 'de'))

function localizedTitle(book: ApiBook): string {
  return book.localizations?.[lang.value]?.title || book.localizations?.de?.title || ''
}

function pageCount(book: ApiBook): number {
  return book.localizations?.[lang.value]?.content?.length
    || book.localizations?.de?.content?.length
    || 0
}

function isNew(iso: string) {
  return Date.now() - new Date(iso).getTime() < 1000 * 60 * 60 * 24 * 90
}

function isComingSoon(book: ApiBook): boolean {
  return new Date(book.releaseDate).getTime() > Date.now() || pageCount(book) === 0
}

function openBook(bookId: string) {
  router.push({ name: 'app-book', params: { bookId } })
}

// Layout-switch state. Three modes share the same card markup; CSS
// alone reshapes them via the `.is-<mode>` class on .book-grid. The
// chosen mode persists per device (via IndexedDB through useAppPrefs)
// so a parent who prefers the list view doesn't have to re-pick it on
// every visit — the pref is shared between the series and category
// pages. List is the default — long German titles read better when the
// row gives them full horizontal space.
type LayoutMode = 'grid-3' | 'grid-2' | 'list'
const LAYOUT_MODES: LayoutMode[] = ['grid-3', 'grid-2', 'list']

const layoutMode = ref<LayoutMode>('list')

// IDB is async, so the default ('list') paints first and the stored
// preference (if any) swaps in once the open + get round-trips finish.
// `userTouchedLayout` guards against a race where the user taps the
// toggle while the read is still in flight — once they've chosen, we
// stop overwriting their pick with whatever IDB returns.
let userTouchedLayout = false
let suppressLayoutPersist = true

onMounted(async () => {
  const stored = await getPref<LayoutMode>(GAME_BOOK_SERIES_LAYOUT)
  if (
    !userTouchedLayout
    && stored
    && (LAYOUT_MODES as string[]).includes(stored)
  ) {
    layoutMode.value = stored
  }
  suppressLayoutPersist = false
})

watch(layoutMode, (v) => {
  if (suppressLayoutPersist) return
  void setPref(GAME_BOOK_SERIES_LAYOUT, v)
})

function setLayout(mode: LayoutMode) {
  userTouchedLayout = true
  layoutMode.value = mode
}
</script>

<template lang="pug">
  div(:class="['book-grid-section', isMobileLandscape ? 'is-landscape' : '']")
    div(class="books-head")
      h3(class="section-title") {{ props.title }}

      //- Layout switch — 3 icons; the active one is filled. The icons
      //- are deliberately small and minimal so they don't distract
      //- from the cover artwork below.
      div(class="layout-toggle" role="group" aria-label="Card layout")
        button(
          v-for="mode in LAYOUT_MODES"
          :key="mode"
          type="button"
          :class="['layout-toggle-btn', { 'is-active': layoutMode === mode }]"
          :aria-pressed="layoutMode === mode ? 'true' : 'false'"
          :aria-label="mode === 'grid-3' ? t('app.bookSeries.layoutThree') : (mode === 'grid-2' ? t('app.bookSeries.layoutTwo') : t('app.bookSeries.layoutList'))"
          @click="setLayout(mode)"
        )
          ZIconography(
            :name="mode === 'list' ? 'rows' : (mode === 'grid-2' ? 'grid-2' : 'grid-3')"
            :size="18"
          )

    div(:class="['book-grid', `is-${layoutMode}`]")
      div(
        v-for="book in props.books"
        :key="book.bookId"
        class="book-card"
        :class="{ 'is-soon': isComingSoon(book) }"
        @click="openBook(book.bookId)"
      )
        div(class="book-card-img-wrap")
          img(
            :src="withPlaceholder(pickLocalizedImage(book.previewImage, lang))"
            :alt="localizedTitle(book)"
            class="book-card-img"
            loading="lazy"
            @error="onImgFallback"
          )
          ZBadge(
            v-if="isNew(book.releaseDate) && !isComingSoon(book)"
            variant="hot"
            size="sm"
            position="top-left"
            :label="t('app.bookSeries.new').toUpperCase()"
          )
        div(class="book-card-meta")
          h4(class="book-card-title") {{ localizedTitle(book) }}
          //- List-view tag row — uses `book.badges` from the API (e.g.
          //- "Abenteuer", "ab 7 Jahren", "15min"). The API stores them in
          //- German only, so each chip goes through `badgeLabel` for its
          //- localized form. Hidden in the compact grid modes where
          //- there's no horizontal room for chips.
          div(
            v-if="layoutMode === 'list' && book.badges?.length"
            class="book-card-badges"
          )
            span(
              v-for="badge in book.badges"
              :key="badge"
              class="book-card-badge-chip"
            ) {{ badgeLabel(badge) }}

    div(
      v-if="!props.books.length"
      class="empty-card"
    ) {{ props.emptyText }}
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

.book-grid-section
  display: flex
  flex-direction: column
  gap: 14px

.section-title
  font-size: 16px
  font-weight: 700
  color: $navy
  margin: 4px 0 0
  letter-spacing: -0.005em

// ===== Books header row =====
// Title on the left, layout-toggle pinned to the right edge.
.books-head
  display: flex
  align-items: center
  justify-content: space-between
  gap: 12px

// ===== Layout toggle (3 icons) =====
// Pill container with three icon buttons. The active mode gets a navy
// fill so it reads at a glance from across the section header. Hit
// area is generous (28px) even though the icon itself is only 18px.
.layout-toggle
  display: inline-flex
  align-items: center
  gap: 2px
  padding: 3px
  background-color: $cream-card
  border: 1px solid $border
  border-radius: 999px
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7), 0 2px 5px -2px rgba(58, 42, 18, 0.12)

.layout-toggle-btn
  display: inline-flex
  align-items: center
  justify-content: center
  width: 28px
  height: 28px
  border-radius: 999px
  border: none
  background: transparent
  color: $brown
  cursor: pointer
  padding: 0
  transition: background-color 180ms ease-out, color 180ms ease-out, transform 180ms ease-out
  -webkit-tap-highlight-color: transparent

  // ZIconography hard-codes the outline-icon color; opt back into the
  // button's `color` so active vs inactive theming actually shows up.
  & :deep(.z-icon-outline)
    color: currentColor

  &:hover
    color: $navy
    background-color: rgba(212, 168, 62, 0.18)

  &:active
    transform: scale(0.92)

  &.is-active
    color: $cream-card
    background: var(--lk-accent)
    box-shadow: 0 2px 6px -2px rgba(10, 26, 48, 0.45)

// Default tracks: three equal columns. `minmax(0, 1fr)` lets long
// German titles wrap inside the card without forcing the row to
// overflow horizontally. The `.is-<mode>` modifier overrides the
// column template for the 2-col and list modes.
.book-grid
  display: grid
  gap: 8px
  grid-template-columns: repeat(3, minmax(0, 1fr))
  margin-top: 4px

.book-grid.is-grid-3
  grid-template-columns: repeat(3, minmax(0, 1fr))

.book-grid.is-grid-2
  grid-template-columns: repeat(2, minmax(0, 1fr))
  gap: 12px

.book-grid.is-list
  grid-template-columns: minmax(0, 1fr)
  gap: 10px

.book-card
  position: relative
  display: flex
  flex-direction: column
  gap: 6px
  cursor: pointer
  background: $cream-card
  border: 1px solid $border
  border-radius: 14px
  padding: 6px 6px 10px
  min-width: 0
  width: 100%
  box-shadow: 0 6px 16px -10px rgba(58, 42, 18, 0.3)
  transition: transform 180ms ease-out, box-shadow 180ms ease-out

  &:hover
    transform: translateY(-3px)
    box-shadow: 0 12px 22px -10px rgba(212, 168, 62, 0.4)

  &:active
    transform: scale(0.98)

  &.is-soon
    .book-card-img-wrap
      filter: grayscale(0.85)
      opacity: 0.75

// Image well sized to the actual book-cover aspect (3:4 portrait). The
// `padding-bottom: 133.333%` trick is the legacy bulletproof way to lock
// a box's height to a percentage of its width — it computes BEFORE any
// `aspect-ratio` support is required, so cache-busted older builds,
// quirky browser engines (looking at you, Tauri WebView), and the few
// platforms that still don't honour `aspect-ratio` on grid items all
// render the well at the right size. `aspect-ratio` stays as a hint for
// future stylesheets but is no longer load-bearing.
.book-card-img-wrap
  position: relative
  display: block
  width: 100%
  height: 0
  padding-bottom: 133.333%
  aspect-ratio: 3 / 4
  border-radius: 10px
  overflow: hidden
  background: var(--lk-surface-2)
  border: 1px solid $border

.book-card-img
  position: absolute
  inset: 0
  width: 100% !important
  height: 100% !important
  max-width: 100%
  max-height: 100%
  object-fit: cover
  display: block

.book-card-meta
  display: flex
  flex-direction: column
  align-items: center
  gap: 2px
  padding: 4px 2px 0
  text-align: center

.book-card-title
  font-size: 11px
  font-weight: 700
  color: $navy
  margin: 0
  line-height: 1.2
  display: -webkit-box
  // Long German titles (e.g. "Selbstbeherrschung") used to overflow
  // the narrow 3-col card; allow up to 4 wrapped lines and let the
  // browser break inside a word as a last resort so the full title
  // stays inside the card boundary instead of bleeding past it.
  -webkit-line-clamp: 4
  -webkit-box-orient: vertical
  overflow: hidden
  overflow-wrap: anywhere
  word-break: break-word
  hyphens: auto

// ===== 2-column grid tweaks =====
// Same card shape as the 3-col layout, but slightly larger title size
// and padding so the extra horizontal room is actually used.
.is-grid-2 .book-card
  padding: 8px 8px 12px
  gap: 8px

.is-grid-2 .book-card-title
  font-size: 13px
  // 2-col cards have more horizontal room than 3-col but still need
  // to wrap long compound nouns rather than truncate with ellipsis.
  -webkit-line-clamp: 4

// ===== List view =====
// Image on the left (capped at 160px tall, width follows the 3:4 cover
// aspect ≈ 120px), text + metadata on the right. The image well drops
// the percentage-padding height trick because the height is fixed.
.is-list .book-card
  flex-direction: row
  align-items: stretch
  gap: 14px
  padding: 10px

.is-list .book-card-img-wrap
  flex: 0 0 auto
  height: 160px
  width: 120px
  padding-bottom: 0
  aspect-ratio: 3 / 4
  border-radius: 10px

.is-list .book-card-meta
  flex: 1 1 auto
  min-width: 0
  align-items: flex-start
  text-align: left
  padding: 4px 4px 4px 0
  gap: 4px

.is-list .book-card-title
  font-size: 15px
  font-weight: 700
  line-height: 1.25
  color: $navy
  // Long German titles like "Selbstbeherrschung" can outrun the meta
  // column — let the browser break inside a word as a last resort and
  // drop the truncation clamp so the full title always renders.
  display: block
  overflow: visible
  -webkit-line-clamp: unset
  -webkit-box-orient: unset
  overflow-wrap: anywhere
  word-break: break-word
  hyphens: auto

// Badges row — pushed to the bottom of the meta column via margin-top:
// auto so the chips visually anchor to the card base regardless of how
// many lines the title wraps to.
.is-list .book-card-badges
  display: flex
  flex-wrap: wrap
  gap: 6px
  margin-top: auto
  padding-top: 8px

.is-list .book-card-badge-chip
  display: inline-flex
  align-items: center
  font-size: 11px
  font-weight: 700
  color: $brown
  background-color: rgba(212, 168, 62, 0.12)
  border: 1px solid rgba(212, 168, 62, 0.35)
  border-radius: 999px
  padding: 3px 10px
  white-space: nowrap

.empty-card
  text-align: center
  background: $cream-card
  border: 1px dashed $border
  border-radius: 18px
  padding: 28px 18px
  color: $brown
  font-size: 14px

// ===== Mobile landscape =====
// Each landscape layout gets +1 column over its portrait count so the
// wider viewport is actually used; list mode also splits into 2 rows
// side-by-side instead of one comically wide row.
.is-landscape
  .book-grid.is-grid-3
    grid-template-columns: repeat(4, minmax(0, 1fr))

  .book-grid.is-grid-2
    grid-template-columns: repeat(3, minmax(0, 1fr))

  .book-grid.is-list
    grid-template-columns: repeat(2, minmax(0, 1fr))
</style>
