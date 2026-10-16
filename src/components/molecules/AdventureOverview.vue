<script setup lang="ts">
/**
 * The overview of a stage: its parts one under the other (story, game, questions), each with a coin that shows whether it is
 * done, the one that comes next, or still to come, and a short line about it (the stars of the game, the right answers).
 */
import AdventureStars from '@/components/molecules/AdventureStars.vue'
import { prependBaseUrl } from '@/utils/function'

export interface OverviewRow {
  key: string
  label: string
  state: 'done' | 'now' | 'todo'
  detail?: string
  /** Shows the stars of the part (0–3) instead of the line. */
  stars?: number
}

defineProps<{ rows: OverviewRow[] }>()
const coin = (state: string) => prependBaseUrl(`images/abenteuer/ui/${state === 'todo' ? 'coin-locked' : 'coin'}.webp`)
const check = prependBaseUrl('images/abenteuer/ui/check.webp')
</script>

<template lang="pug">
  ol(class="ov")
    li(v-for="(r, i) in rows" :key="r.key" class="ov-row" :class="r.state")
      span(class="ov-coin")
        img(:src="coin(r.state)" alt="" draggable="false")
        img(v-if="r.state === 'done'" :src="check" alt="" class="ov-check" draggable="false")
        span(v-else class="ov-n") {{ i + 1 }}
      span(class="ov-text")
        span(class="ov-label") {{ r.label }}
        span(v-if="r.detail" class="ov-detail") {{ r.detail }}
      AdventureStars(v-if="r.stars !== undefined" :stars="r.stars" :size="26" class="ov-stars")
</template>

<style scoped lang="sass">
.ov
  list-style: none
  margin: 14px 0
  padding: 0
  display: grid
  gap: 10px
  text-align: left

.ov-row
  display: flex
  align-items: center
  gap: 12px
  padding: 8px 12px
  border-radius: 16px
  background: rgba(255, 255, 255, 0.55)
  border: 2px solid rgba(212, 168, 62, 0.35)

  &.now
    background: rgba(255, 238, 170, 0.75)
    border-color: #d4a83e
    box-shadow: 0 0 0 3px rgba(255, 214, 90, 0.45)

  &.todo
    opacity: 0.6

.ov-coin
  position: relative
  flex: 0 0 40px
  width: 40px
  height: 40px
  display: grid
  place-items: center

  img
    grid-area: 1 / 1
    width: 100%
    height: 100%
    object-fit: contain

  .ov-check
    width: 58%
    height: 58%

.ov-n
  grid-area: 1 / 1
  font-family: 'Fraunces', serif
  font-weight: 700
  font-size: 1.1rem
  color: #4a3208

.ov-text
  display: flex
  flex-direction: column
  flex: 1
  min-width: 0

.ov-label
  font-family: 'Fraunces', serif
  font-weight: 700
  font-size: 1.1rem
  color: #3b2a12

.ov-detail
  font-size: 0.9rem
  font-weight: 700
  color: #6b5a3a
</style>
