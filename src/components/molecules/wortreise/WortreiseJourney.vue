<script setup lang="ts">
/**
 * The journey of the Wortreise as a dotted road over the map: one brass stop for every stage with the name of the place under it. A stop that
 * was reached carries the travel token of the person who filled the last square of that stage; the stage that is played now shines.
 */
import MapToken from '@/components/molecules/map/MapToken.vue'

export interface JourneyPlace {
  name: string
}
defineProps<{ places: JourneyPlace[]; current: number; winners: number[] }>()
</script>

<template lang="pug">
  ol(class="wj" :aria-label="places.map((p) => p.name).join(', ')")
    li(v-for="(p, i) in places" :key="i" :class="['wj-stop', { 'is-done': i < winners.length, 'is-now': i === current && i >= winners.length }]")
      span(class="wj-dot")
        MapToken(v-if="i < winners.length" :index="winners[i] ?? 0" :size="30" lit)
        span(v-else class="wj-n") {{ i + 1 }}
      span(class="wj-name") {{ p.name }}
</template>

<style scoped lang="sass">
.wj
  position: relative
  display: flex
  justify-content: space-between
  gap: 2px
  width: 100%
  margin: 0
  padding: 0
  list-style: none
  font-family: var(--mp-serif, Georgia, serif)

  // the dotted road behind the stops
  &::before
    content: ''
    position: absolute
    left: 6%
    right: 6%
    top: 17px
    border-top: 3px dotted rgba(226, 189, 102, 0.75)

.wj-stop
  position: relative
  flex: 1
  min-width: 0
  display: flex
  flex-direction: column
  align-items: center
  gap: 3px
  color: rgba(246, 234, 208, 0.85)
  text-align: center

.wj-dot
  display: grid
  place-items: center
  width: 34px
  height: 34px
  border-radius: 50%
  border: 2px solid rgba(226, 189, 102, 0.55)
  background: rgba(28, 19, 10, 0.82)
  color: rgba(246, 234, 208, 0.75)
  font-size: 1rem
  font-weight: 800
  transition: transform 0.3s, box-shadow 0.3s

.wj-n
  line-height: 1

.wj-name
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.95), 0 0 8px rgba(0, 0, 0, 0.6)
  max-width: 100%
  overflow: hidden
  text-overflow: ellipsis
  white-space: nowrap
  font-size: 0.82rem
  font-weight: 700
  line-height: 1.1

.is-done
  color: #f6ead0

  .wj-dot
    border-color: #f3d98a
    background: radial-gradient(circle at 35% 30%, #c79a45, #7d5a22 70%)

.is-now
  color: #ffe08a

  .wj-dot
    border-color: #ffe08a
    background: rgba(120, 82, 24, 0.92)
    box-shadow: 0 0 14px rgba(255, 205, 100, 0.85)
    transform: scale(1.12)
    color: #fff3cf
</style>
