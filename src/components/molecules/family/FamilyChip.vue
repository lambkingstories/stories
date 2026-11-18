<script setup lang="ts">
/**
 * Familien-Spiele v2: a chip to choose with (replaces the brass tabs, round marks and switches). Rounded pill, or with `round` a circle for
 * a number (number of players 2 to 8, questions per player 3/5/8). Not chosen: white with a line. Chosen: filled gold, dark text, a small
 * tick at the corner. At least 48 px. `role` is `radio` (one of a group, `aria-checked`), `checkbox` or `button` (`aria-pressed`).
 */
import { computed } from 'vue'

const props = withDefaults(defineProps<{ selected?: boolean; round?: boolean; disabled?: boolean; role?: 'radio' | 'checkbox' | 'button' }>(), { selected: false, round: false, disabled: false, role: 'radio' })
const emit = defineEmits<{ click: [e: MouseEvent] }>()
const aria = computed(() => (props.role === 'button' ? { 'aria-pressed': props.selected } : { 'aria-checked': props.selected }))
</script>

<template lang="pug">
  button(type="button" :role="role" v-bind="aria" :disabled="disabled" :class="['fam-chip', { 'is-on': selected, 'is-round': round }]" @click="emit('click', $event)")
    span(class="fam-chip-text")
      slot
    span(v-if="selected" class="fam-chip-tick" aria-hidden="true")
</template>

<style scoped lang="sass">
.fam-chip
  position: relative
  box-sizing: border-box
  display: inline-flex
  align-items: center
  justify-content: center
  min-width: 48px
  min-height: 48px
  padding: 6px 18px
  border: 2px solid var(--fam-line-strong)
  border-radius: var(--fam-r-chip)
  background: var(--fam-card)
  color: var(--fam-ink)
  font: inherit
  font-size: 1.05rem
  font-weight: 700
  line-height: 1.15
  text-align: center
  cursor: pointer
  touch-action: manipulation
  -webkit-tap-highlight-color: transparent
  transition: transform 0.12s, background 0.2s, border-color 0.2s, box-shadow 0.2s

  &:focus-visible
    outline: 3px solid var(--fam-focus)
    outline-offset: 2px

  &:active:not(:disabled)
    transform: scale(0.96)

  &:disabled
    opacity: 0.4
    cursor: default

  &.is-on
    background: var(--fam-gold)
    border-color: var(--fam-gold-deep)
    color: var(--fam-on-gold)
    font-weight: 800
    box-shadow: 0 3px 0 var(--fam-gold-deep)

  &.is-round
    width: 52px
    height: 52px
    padding: 0
    border-radius: 50%
    font-size: 1.3rem
    font-weight: 800

.fam-chip-text
  display: block
  text-align: center

// the small tick at the corner of a chosen chip: a round teal tag with a white check mark (drawn by its borders)
.fam-chip-tick
  position: absolute
  top: -6px
  right: -6px
  width: 20px
  height: 20px
  border-radius: 50%
  background: var(--fam-primary)
  box-shadow: 0 0 0 2px var(--fam-card)

  &::after
    content: ''
    position: absolute
    left: 7px
    top: 3px
    width: 5px
    height: 10px
    border: solid #fff
    border-width: 0 2.5px 2.5px 0
    transform: rotate(45deg)
</style>
