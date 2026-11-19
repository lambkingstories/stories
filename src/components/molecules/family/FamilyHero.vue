<script setup lang="ts">
/**
 * Familien-Spiele v2: the title picture of a game, a wide strip with rounded corners (the painted pictures live in
 * `public/images/familie/hero/<id>.webp` and `<id>-klein.webp`, id = the key of the game). While the picture is missing (or still loading) the strip
 * shows the painted symbol of the game on a gradient of the colour of the game; as soon as the picture is there, it fades in over it. So the piece
 * looks right with and without the picture and needs no change of code when the picture arrives. A small phone gets the small file first.
 */
import { computed, ref } from 'vue'
import { prependBaseUrl } from '@/utils/function'
import { familySymbol, type FamilyGameKey } from './familyGames'

const props = withDefaults(defineProps<{ game: FamilyGameKey }>(), {})
/** A narrow window takes the small file (the big one is the second try). */
const small = typeof window !== 'undefined' && window.innerWidth <= 700
const files = computed(() => {
  const big = prependBaseUrl(`images/familie/hero/${props.game}.webp`)
  const klein = prependBaseUrl(`images/familie/hero/${props.game}-klein.webp`)
  return small ? [klein, big] : [big, klein]
})
/** Which file is tried now; `files.length` = none worked. */
const attempt = ref(0)
const loaded = ref(false)
const src = computed(() => files.value[attempt.value] ?? '')
const symbol = computed(() => familySymbol(props.game))
const symbolBroken = ref(false)

function onError() {
  loaded.value = false
  attempt.value++
}
</script>

<template lang="pug">
  div(:class="['fam-hero', { 'is-loaded': loaded }]")
    //- the stand-in: the symbol of the game on the colour of the game
    div(class="fam-hero-fallback" aria-hidden="true")
      span(class="fam-hero-glow")
      img(v-if="!symbolBroken" class="fam-hero-symbol" :src="symbol" alt="" draggable="false" @error="symbolBroken = true")
    img(v-if="src" :key="src" class="fam-hero-img" :src="src" alt="" draggable="false" @load="loaded = true" @error="onError")
</template>

<style scoped lang="sass">
.fam-hero
  position: relative
  box-sizing: border-box
  width: 100%
  aspect-ratio: 16 / 10
  overflow: hidden
  border-radius: 28px
  background: var(--fam-accent)
  box-shadow: 0 18px 30px -18px color-mix(in srgb, var(--fam-accent) 70%, black), var(--fam-shadow)

.fam-hero-fallback
  position: absolute
  inset: 0
  display: grid
  place-items: center
  background: linear-gradient(150deg, color-mix(in srgb, var(--fam-accent) 72%, white) 0%, var(--fam-accent) 48%, color-mix(in srgb, var(--fam-accent) 70%, black) 100%)

.fam-hero-glow
  position: absolute
  width: 72%
  aspect-ratio: 1
  border-radius: 50%
  background: radial-gradient(circle, rgba(255, 255, 255, 0.34), transparent 66%)

.fam-hero-symbol
  position: absolute
  top: 6%
  left: 0
  display: block
  width: 100%
  height: 88%
  object-fit: contain
  filter: drop-shadow(0 8px 12px rgba(0, 0, 0, 0.35))

.fam-hero-img
  position: absolute
  inset: 0
  display: block
  width: 100%
  height: 100%
  object-fit: cover
  opacity: 0
  transition: opacity 0.5s ease

.is-loaded .fam-hero-img
  opacity: 1

@media (prefers-reduced-motion: reduce)
  .fam-hero-img
    transition: none
</style>
