<script setup lang="ts">
/** The scores of the players as a row of small brass tags with the travel token, the name and the points; the player whose turn it is shines. */
import MapToken from './MapToken.vue'

export interface MapScorePlayer {
  name: string
  score: number | string
  /** Which token (0 to 7): the position of the player. */
  index: number
  turn?: boolean
}

defineProps<{ players: MapScorePlayer[] }>()
</script>

<template lang="pug">
  div(class="msb")
    div(v-for="(p, i) in players" :key="i" :class="['msb-p', { 'is-turn': p.turn }]")
      MapToken(:index="p.index" :size="30" :lit="p.turn")
      span(class="msb-name") {{ p.name }}
      span(class="msb-score") {{ p.score }}
</template>

<style scoped lang="sass">
.msb
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 6px

.msb-p
  display: inline-flex
  align-items: center
  gap: 7px
  padding: 3px 12px 3px 6px
  border-radius: 999px
  border: 1px solid var(--lk-line, #c9dad5)
  background: var(--lk-surface, #fff)
  color: var(--mp-board, #1f3a36)
  font-family: var(--mp-serif, Georgia, serif)
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.12)
  transition: background 0.25s, border-color 0.25s

  &.is-turn
    border-color: #d4a83e
    border-width: 2px
    background: #f6e3a8
    transform: translateY(-2px) scale(1.05)
    box-shadow: 0 0 12px rgba(255, 205, 100, 0.8), 0 2px 5px rgba(0, 0, 0, 0.15)

    .msb-name
      color: #4a3608

.msb-name
  max-width: 7.5em
  overflow: hidden
  text-overflow: ellipsis
  white-space: nowrap
  font-size: 1rem
  font-weight: 700

.msb-score
  min-width: 1.2em
  text-align: center
  font-size: 1.15rem
  font-weight: 800
  color: #8a5f0a
</style>
