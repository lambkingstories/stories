<script setup lang="ts">
/** The right page of a coloring book that is lying open: the picture as it looks now (the child's paint underneath, the line art multiplied on top). */
defineProps<{ line: string; layer?: string; alt: string; faded?: boolean }>()
</script>

<template lang="pug">
  div(class="sp-art")
    img(v-if="layer" class="sp-paint" :src="layer" alt="" draggable="false")
    img(class="sp-line" :class="{ faded }" :src="line" :alt="alt" draggable="false")
    //- a picture that is not open yet lies under a bright golden veil (Anton, 19.11.2026: not the dull grey blur): it can be made out, but not painted
    span(v-if="faded" class="sp-veil" aria-hidden="true")
</template>

<style scoped lang="sass">
.sp-art
  position: absolute
  inset: 0
  container-type: inline-size
  padding: clamp(6px, 3%, 18px)
  background: #ffffff

  img
    position: absolute
    inset: clamp(6px, 3%, 18px)
    width: calc(100% - 2 * clamp(6px, 3%, 18px))
    height: calc(100% - 2 * clamp(6px, 3%, 18px))
    object-fit: contain
    pointer-events: none
    user-select: none

.sp-line
  mix-blend-mode: multiply

  // a picture that is not open yet (Antons Wunsch 6.11.2026): so blurred that the edges are not clear, but the picture can still be made
  // out. The contrast lifts the soft grey back up, so it does not just fade away.
  // (the blur grows with the width of the page: `cqw` is one hundredth of it; the first line is for old phones)
  &.faded
    filter: blur(3px)
    filter: blur(clamp(2px, 1.1cqw, 7px))
    opacity: 0.8

// the veil: light, warm and a little shining, so a locked page looks special and not dull
.sp-veil
  position: absolute
  inset: 0
  pointer-events: none
  background: radial-gradient(ellipse at 50% 38%, rgba(255, 250, 232, 0.66), rgba(255, 238, 190, 0.55) 62%, rgba(246, 214, 140, 0.5))
  box-shadow: inset 0 0 0 2px rgba(214, 170, 70, 0.35)
</style>
