<script setup lang="ts">
/**
 * Familien-Spiele v2: the end of a game (replaces `MapResult`, same props, so a game swaps one for the other). The figure of the winner on a
 * soft golden disc (no wreath), the headline in the middle, the ranking on a white card (rank tag, figure, name, score; with `symbol` it also gets the head stripe of the game). The buttons go in the slot.
 */
import FamilyCard from './FamilyCard.vue'
import MapToken from '@/components/molecules/map/MapToken.vue'
import type { FamilyGameKey } from './familyGames'

export interface FamilyResultRow {
  rank: number
  name: string
  /** The score as text ("7 pairs"). */
  score: string
  index: number
}

withDefaults(defineProps<{ headline: string; rows?: FamilyResultRow[]; winnerIndex?: number; symbol?: FamilyGameKey }>(), { rows: () => [], winnerIndex: undefined, symbol: undefined })
</script>

<template lang="pug">
  div(class="fam-res")
    div(v-if="winnerIndex !== undefined" class="fam-res-crown")
      MapToken(:index="winnerIndex" :size="88" lit)
    h2(class="fam-res-head") {{ headline }}
    FamilyCard(v-if="rows.length > 1" class="fam-res-card" :symbol="symbol")
      ol(class="fam-res-rank")
        li(v-for="r in rows" :key="r.name + r.rank" :class="{ 'is-first': r.rank === 1 }")
          span(class="fam-res-n") {{ r.rank }}
          MapToken(:index="r.index" :size="34")
          span(class="fam-res-name") {{ r.name }}
          span(class="fam-res-score") {{ r.score }}
    div(class="fam-res-actions")
      slot
</template>

<style scoped lang="sass">
.fam-res
  display: flex
  flex-direction: column
  align-items: center
  gap: 16px
  width: 100%
  max-width: 28rem
  margin: 0 auto
  padding-top: 10px

.fam-res-crown
  display: grid
  place-items: center
  width: 148px
  height: 148px
  border: 3px solid var(--fam-gold)
  border-radius: 50%
  background: radial-gradient(circle at 50% 38%, color-mix(in srgb, var(--fam-gold) 38%, var(--fam-card)), var(--fam-card) 72%)
  box-shadow: 0 0 0 8px color-mix(in srgb, var(--fam-gold) 22%, transparent), var(--fam-shadow)

.fam-res-head
  margin: 0
  color: var(--fam-ink)
  font-size: 1.7rem
  font-weight: 800
  line-height: 1.15
  text-align: center

.fam-res-card
  :deep(.fam-card-body)
    padding: 14px 12px

.fam-res-rank
  list-style: none
  display: grid
  gap: 8px
  width: 100%
  margin: 0
  padding: 0

  li
    display: grid
    grid-template-columns: 34px 38px minmax(0, 1fr) auto
    align-items: center
    gap: 10px
    min-height: 48px
    padding: 4px 12px 4px 8px
    border-radius: 16px
    background: var(--fam-field)
    font-size: 1.1rem
    font-weight: 700

    &.is-first
      background: color-mix(in srgb, var(--fam-gold) 30%, var(--fam-card))
      box-shadow: inset 0 0 0 2px var(--fam-gold)
      font-size: 1.2rem

.fam-res-n
  display: grid
  place-items: center
  width: 30px
  height: 30px
  border-radius: 50%
  background: var(--fam-accent)
  color: var(--fam-on-accent)
  font-size: 0.95rem
  font-weight: 800

.is-first .fam-res-n
  background: var(--fam-gold)
  color: var(--fam-on-gold)

.fam-res-name
  overflow: hidden
  text-overflow: ellipsis
  white-space: nowrap
  text-align: left

.fam-res-score
  font-weight: 800
  white-space: nowrap

.fam-res-actions
  display: flex
  flex-direction: column
  align-items: center
  gap: 12px
  width: 100%
  padding-bottom: 16px
</style>
