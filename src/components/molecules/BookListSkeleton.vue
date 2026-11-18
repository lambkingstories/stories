<script setup lang="ts">
/**
 * Placeholders while the list of books is on its way (instead of a text like "no series yet", which would be wrong): grey shapes in the
 * size of the real shelves or book tiles, with a soft shimmer (still when the device asks for less motion). Replaced by the real
 * things as soon as the list is there, without a jump.
 */
import { useI18n } from 'vue-i18n'

withDefaults(defineProps<{ variant?: 'shelves' | 'grid'; count?: number }>(), { variant: 'shelves', count: 2 })
const { t } = useI18n({ useScope: 'global' })
</script>

<template lang="pug">
  div(class="bls" role="status" aria-live="polite" data-test="book-skeleton")
    span(class="bls-sr") {{ t('app.state.listLoading') }}
    template(v-if="variant === 'shelves'")
      section(v-for="n in count" :key="n" class="bls-shelf lk-panel" aria-hidden="true")
        div(class="bls-name bls-shape")
        div(class="bls-hero bls-shape")
        div(class="bls-row")
          div(v-for="k in 4" :key="k" class="bls-book bls-shape")
        div(class="bls-board")
    div(v-else class="bls-grid" aria-hidden="true")
      div(v-for="n in count" :key="n" class="bls-tile")
        div(class="bls-cover bls-shape")
        div(class="bls-line bls-shape")
</template>

<style scoped lang="sass">
.bls
  display: flex
  flex-direction: column
  gap: 28px

.bls-sr
  position: absolute
  width: 1px
  height: 1px
  overflow: hidden
  clip: rect(0 0 0 0)
  white-space: nowrap

// the same measures as the real shelf (AppAllBooksView): name, 16:9 picture, a row of 3:4 books on a board
.bls-shelf
  padding: 14px 14px 16px
  overflow: hidden

.bls-name
  width: 55%
  height: 28px
  margin: 8px 0 14px
  border-radius: 8px

.bls-hero
  width: 100%
  aspect-ratio: 16 / 9
  margin: 0 0 12px
  border-radius: var(--lk-r-card)

.bls-row
  display: flex
  gap: 10px
  overflow: hidden
  margin: 0 -14px
  padding: 0 14px 4px

.bls-book
  flex: 0 0 29%
  max-width: 190px
  aspect-ratio: 3 / 4
  border-radius: 10px

.bls-board
  height: 12px
  margin-top: -2px
  border-radius: 8px
  background: var(--lk-shelf)

.bls-grid
  display: grid
  grid-template-columns: repeat(3, minmax(0, 1fr))
  gap: 16px 12px

.bls-tile
  display: flex
  flex-direction: column
  gap: 8px

.bls-cover
  aspect-ratio: 3 / 4
  border-radius: 12px

.bls-line
  height: 14px
  width: 80%
  border-radius: 6px

.bls-shape
  background: linear-gradient(100deg, var(--lk-surface-2) 30%, var(--lk-surface) 50%, var(--lk-surface-2) 70%)
  background-size: 300% 100%
  animation: bls-shimmer 1.6s ease-in-out infinite

@keyframes bls-shimmer
  from
    background-position: 100% 0
  to
    background-position: 0 0

@media (prefers-reduced-motion: reduce)
  .bls-shape
    animation: none
    background: var(--lk-surface-2)
</style>
