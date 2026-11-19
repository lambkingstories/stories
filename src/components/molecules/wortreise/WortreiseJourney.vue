<script setup lang="ts">
/**
 * The journey of the Wortreise as a dotted road in the light look of "Familien-Spiele v2": one round stop for every stage with the name of the place under it.
 * A stop that was reached carries the travel token of the person who filled the last square of that stage; the stage that is played now is teal.
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

  // the dotted road behind the stops
  &::before
    content: ''
    position: absolute
    left: 6%
    right: 6%
    top: 20px
    border-top: 3px dotted var(--fam-line-strong)

.wj-stop
  position: relative
  flex: 1
  min-width: 0
  display: flex
  flex-direction: column
  align-items: center
  gap: 4px
  color: var(--fam-muted)
  text-align: center

.wj-dot
  box-sizing: border-box
  display: grid
  place-items: center
  width: 40px
  height: 40px
  border: 2px solid var(--fam-line-strong)
  border-radius: 50%
  background: var(--fam-card)
  color: var(--fam-muted)
  font-size: 1.05rem
  font-weight: 800
  transition: transform 0.3s, background-color 0.3s

.wj-n
  line-height: 1

.wj-name
  max-width: 100%
  font-size: clamp(0.72rem, 2.9vw, 0.9rem)
  font-weight: 700
  line-height: 1.1
  overflow-wrap: anywhere

// a stop that was reached: the token of the person, on a gold ring
.is-done
  color: var(--fam-ink)

  .wj-dot
    border-color: var(--fam-gold-deep)
    background: color-mix(in srgb, var(--fam-gold) 34%, var(--fam-card))

// the stage that is played now
.is-now
  color: var(--fam-ink)

  .wj-dot
    border-color: var(--fam-primary)
    background: var(--fam-primary)
    color: var(--fam-on-primary)
    transform: scale(1.1)

@media (prefers-reduced-motion: reduce)
  .wj-dot
    transition: none
</style>
