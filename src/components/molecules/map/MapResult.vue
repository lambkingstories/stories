<script setup lang="ts">
/** The end of a game on the map table: the winner's token in a laurel wreath, the headline and the ranking on parchment. The buttons go in the slot. */
import { prependBaseUrl } from '@/utils/function'
import MapPaper from './MapPaper.vue'
import MapToken from './MapToken.vue'

export interface MapResultRow {
  rank: number
  name: string
  /** The score as text ("7 pairs"). */
  score: string
  index: number
}

defineProps<{ headline: string; rows?: MapResultRow[]; winnerIndex?: number }>()
const wreath = prependBaseUrl('images/familie/karte/lorbeer.webp')
function hide(e: Event) {
  ;(e.target as HTMLElement).style.display = 'none'
}
</script>

<template lang="pug">
  div(class="mre")
    div(class="mre-crown")
      img(:src="wreath" alt="" class="mre-wreath" draggable="false" @error="hide")
      MapToken(v-if="winnerIndex !== undefined" :index="winnerIndex" :size="84" lit class="mre-token")
    h2(class="mre-head") {{ headline }}
    MapPaper(v-if="rows && rows.length > 1" kind="card" class="mre-paper")
      ol(class="mre-rank")
        li(v-for="r in rows" :key="r.name + r.rank" :class="{ 'is-first': r.rank === 1 }")
          span(class="mre-n") {{ r.rank }}
          MapToken(:index="r.index" :size="28")
          span(class="mre-name") {{ r.name }}
          span(class="mre-score") {{ r.score }}
    div(class="mre-actions")
      slot
</template>

<style scoped lang="sass">
.mre
  display: flex
  flex-direction: column
  align-items: center
  gap: 14px
  width: 100%
  max-width: 28rem
  margin: 0 auto
  padding-top: 10px

.mre-crown
  position: relative
  display: grid
  place-items: center
  width: 190px
  height: 190px

.mre-wreath
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  object-fit: contain
  filter: drop-shadow(0 6px 8px rgba(10, 5, 0, 0.6))

.mre-token
  position: relative
  margin-top: 6px

.mre-head
  margin: 0
  text-align: center
  font-family: var(--mp-serif, Georgia, serif)
  font-size: 1.7rem
  font-weight: 800
  line-height: 1.15
  color: var(--mp-cream, #f6ead0)
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.9)

.mre-paper
  :deep(.mpa-in)
    padding: 18% 9% 12%

.mre-rank
  list-style: none
  margin: 0
  padding: 0
  display: grid
  gap: 6px

  li
    display: grid
    grid-template-columns: 1.4em 34px minmax(0, 1fr) auto
    align-items: center
    gap: 8px
    text-align: left
    font-size: 1.1rem
    font-weight: 700

    &.is-first
      color: #7a4d00
      font-size: 1.25rem

.mre-name
  overflow: hidden
  text-overflow: ellipsis
  white-space: nowrap

.mre-score
  font-weight: 800

.mre-actions
  display: flex
  flex-direction: column
  align-items: center
  gap: 10px
  padding-bottom: 12px
</style>
