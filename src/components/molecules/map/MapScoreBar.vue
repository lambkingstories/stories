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
  border: 1px solid rgba(226, 189, 102, 0.55)
  background: rgba(28, 19, 10, 0.72)
  color: var(--mp-cream, #f6ead0)
  font-family: var(--mp-serif, Georgia, serif)
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.5)
  transition: background 0.25s, border-color 0.25s

  &.is-turn
    border-color: #ffe08a
    border-width: 2px
    background: rgba(120, 82, 24, 0.92)
    transform: translateY(-2px) scale(1.05)
    box-shadow: 0 0 16px rgba(255, 205, 100, 0.85), 0 2px 5px rgba(0, 0, 0, 0.5)

    .msb-name
      color: #fff3cf

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
  color: var(--mp-gold, #e2bd66)
</style>
