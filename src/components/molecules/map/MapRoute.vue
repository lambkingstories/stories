<script setup lang="ts">
/**
 * The progress of the players as a journey over the map: one dotted track per player, the travel token moves along it with the points.
 * `max` is the end of the road (a flag at the right end). The player whose turn it is shines.
 */
import MapToken from './MapToken.vue'

export interface MapRoutePlayer {
  name: string
  value: number
  index: number
  turn?: boolean
}

withDefaults(defineProps<{ players: MapRoutePlayer[]; max: number }>(), {})
const at = (v: number, max: number) => `${Math.max(0, Math.min(1, max > 0 ? v / max : 0)) * 100}%`
</script>

<template lang="pug">
  div(class="mr")
    div(v-for="(p, i) in players" :key="i" :class="['mr-row', { 'is-turn': p.turn }]")
      span(class="mr-name") {{ p.name }}
      div(class="mr-track")
        span(class="mr-line")
        span(class="mr-flag" aria-hidden="true") ⚑
        span(class="mr-pos" :style="{ left: at(p.value, max) }")
          MapToken(:index="p.index" :size="30" :lit="p.turn")
      span(class="mr-value") {{ p.value }}
</template>

<style scoped lang="sass">
.mr
  display: grid
  gap: 4px
  padding: 8px 10px
  border-radius: 12px
  background: rgba(28, 19, 10, 0.62)
  border: 1px solid rgba(226, 189, 102, 0.35)

.mr-row
  display: grid
  grid-template-columns: 5.2em minmax(0, 1fr) 1.8em
  align-items: center
  gap: 8px
  color: var(--mp-cream, #f6ead0)
  font-family: var(--mp-serif, Georgia, serif)
  opacity: 0.85

  &.is-turn
    opacity: 1

    .mr-name
      color: var(--mp-gold, #e2bd66)

.mr-name
  overflow: hidden
  text-overflow: ellipsis
  white-space: nowrap
  font-size: 0.95rem
  font-weight: 700

.mr-track
  position: relative
  height: 34px
  margin-right: 18px

.mr-line
  position: absolute
  left: 0
  right: 0
  top: 50%
  border-top: 3px dotted rgba(226, 189, 102, 0.75)

.mr-flag
  position: absolute
  right: -16px
  top: 50%
  transform: translateY(-58%)
  color: var(--mp-gold, #e2bd66)
  font-size: 1.1rem

.mr-pos
  position: absolute
  top: 50%
  transform: translate(-50%, -50%)
  transition: left 0.6s cubic-bezier(0.3, 0.8, 0.3, 1)

.mr-value
  text-align: right
  font-size: 1.05rem
  font-weight: 800
  color: var(--mp-gold, #e2bd66)
</style>
