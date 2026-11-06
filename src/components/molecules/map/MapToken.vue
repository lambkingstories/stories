<script setup lang="ts">
/** A travel token of a player (caravan, ship, camel, tent, tower, well, harp, fish): eight of them, each with its own colored rim. `lit` shines while it is the player's turn. */
import { computed, ref } from 'vue'
import { prependBaseUrl } from '@/utils/function'
import { TOKEN_COLORS } from './tokenColors'
import { tokenOf } from '@/use/useFamilyTokens'

/**
 * `index` is the SEAT of a player (0 for the first one): the token that seat has chosen is shown (see useFamilyTokens). With `raw` the index
 * is the token itself (the choice row on the setup page shows all eight).
 */
const props = withDefaults(defineProps<{ index: number; size?: number; lit?: boolean; dim?: boolean; raw?: boolean }>(), { size: 56, lit: false, dim: false, raw: false })
const token = computed(() => (props.raw ? ((props.index % 8) + 8) % 8 : tokenOf(props.index)))
const src = computed(() => prependBaseUrl(`images/familie/karte/token-${token.value + 1}.webp`))
const color = computed(() => TOKEN_COLORS[token.value])
/** The picture is missing: a colored disc stands in. */
const failed = ref(false)
</script>

<template lang="pug">
  span(:class="['mtk', { 'is-lit': lit, 'is-dim': dim, 'is-failed': failed }]" :style="{ width: size + 'px', height: size + 'px', '--c': color }")
    img(:src="src" alt="" draggable="false" @error="failed = true")
</template>

<style scoped lang="sass">
.mtk
  position: relative
  display: inline-grid
  place-items: center
  flex: none
  transition: transform 0.25s, filter 0.25s, opacity 0.25s

  img
    display: block
    width: 100%
    height: 100%
    object-fit: contain
    filter: drop-shadow(0 4px 4px rgba(10, 5, 0, 0.6))

  &.is-failed
    border-radius: 50%
    background: radial-gradient(circle at 40% 35%, color-mix(in srgb, var(--c) 70%, #fff), var(--c))

    img
      display: none

  &.is-lit
    transform: translateY(-3px) scale(1.12)

    img
      filter: drop-shadow(0 0 10px rgba(255, 215, 110, 1)) drop-shadow(0 0 4px rgba(255, 240, 170, 0.9)) drop-shadow(0 4px 4px rgba(10, 5, 0, 0.6))

    &.is-failed
      filter: drop-shadow(0 0 12px rgba(255, 215, 110, 1))

  &.is-dim
    opacity: 0.45
    filter: grayscale(0.6)
</style>
