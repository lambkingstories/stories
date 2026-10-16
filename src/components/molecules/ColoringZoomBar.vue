<script setup lang="ts">
/**
 * Zoom for a mouse: the hand moves the sheet, minus and plus zoom, and the percentage brings the whole sheet back. It sits in
 * the top bar (or in a corner of the picture in full screen). A touch screen zooms with two fingers and only shows the
 * percentage button once the sheet is zoomed.
 */
import { useI18n } from 'vue-i18n'
import { LINE_ICONS } from '@/data/coloringKits'

interface Props {
  percent: number
  /** The hand tool is on (a drag moves the sheet). */
  pan: boolean
  /** With a mouse: show the hand, minus and plus as well. */
  mouse: boolean
  /** Sits in the top bar (glass buttons) or quietly in a corner of the picture. */
  variant?: 'bar' | 'corner'
}

defineProps<Props>()
const emit = defineEmits<{
  'zoom-in': []
  'zoom-out': []
  reset: []
  'toggle-pan': []
}>()

const { t } = useI18n({ useScope: 'global' })
</script>

<template lang="pug">
  div(class="zb" :class="`is-${variant ?? 'bar'}`" role="group" :aria-label="t('app.coloring.zoom')")
    button(
      v-if="mouse"
      type="button"
      class="zb-btn zb-extra"
      :class="{ on: pan }"
      :aria-pressed="pan"
      :aria-label="t('app.coloring.panSheet')"
      :title="t('app.coloring.panSheet')"
      @click="emit('toggle-pan')"
    )
      img(:src="LINE_ICONS.hand" alt="" draggable="false")
    button(v-if="mouse" type="button" class="zb-btn zb-extra" :aria-label="t('app.coloring.zoomOut')" :title="t('app.coloring.zoomOut')" @click="emit('zoom-out')")
      img(:src="LINE_ICONS.zoomOut" alt="" draggable="false")
    button(type="button" class="zb-btn zb-pct" :aria-label="t('app.coloring.zoomFit')" :title="t('app.coloring.zoomFit')" @click="emit('reset')") {{ percent }}%
    button(v-if="mouse" type="button" class="zb-btn zb-extra" :aria-label="t('app.coloring.zoomIn')" :title="t('app.coloring.zoomIn')" @click="emit('zoom-in')")
      img(:src="LINE_ICONS.zoomIn" alt="" draggable="false")
</template>

<style scoped lang="sass">
$ink: #22262e
$line: rgba(20, 24, 32, 0.1)
$glass: rgba(252, 251, 248, 0.88)

.zb
  display: flex
  align-items: center
  gap: 4px
  pointer-events: auto

.zb-btn
  display: grid
  place-items: center
  min-width: 36px
  height: 38px
  padding: 0
  border: 1px solid $line
  border-radius: 12px
  background: $glass
  backdrop-filter: blur(14px)
  -webkit-backdrop-filter: blur(14px)
  box-shadow: 0 2px 10px rgba(20, 24, 32, 0.15)
  color: $ink
  cursor: pointer
  -webkit-tap-highlight-color: transparent
  transition: transform 100ms ease-out, background 120ms ease-out

  img
    width: 19px
    height: 19px
    object-fit: contain
    pointer-events: none

  &:active
    transform: scale(0.94)

  &.on
    background: rgba(31, 58, 95, 0.16)

.zb-pct
  padding: 0 10px
  font-size: 0.8rem
  font-weight: 800

// in a corner of the picture: quieter
.zb.is-corner .zb-btn
  background: rgba(252, 251, 248, 0.6)
  box-shadow: none
  opacity: 0.7

  &:active,
  &.on
    opacity: 1

// not much room: only the percentage stays, it brings the whole sheet back
@media (max-width: 700px)
  .zb.is-bar .zb-extra
    display: none
</style>
