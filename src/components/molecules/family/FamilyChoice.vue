<script setup lang="ts">
/**
 * Familien-Spiele v2: an answer tile (replaces `MapCoin`, the medals). A big rounded tile, at least 64 px high, in one of four friendly
 * colours (`index` 0 to 3: teal, coral, blue, gold; the colours repeat after four), a small letter badge A to D at the left, the text centred.
 * `state` shows what happened after the answer: `right` = green ring and a tick, `wrong` = soft red ring, a cross and a gentle shake (only when
 * the device does not ask for less motion), `dim` = the others rest. The answer text comes as `text` (the size follows its length) or in the slot.
 * `plain` = no letter badge and less room at the sides, for short answers that are no choice among A to D.
 */
import { computed } from 'vue'

const props = withDefaults(defineProps<{ index: number; state?: 'idle' | 'right' | 'wrong' | 'dim'; disabled?: boolean; text?: string; plain?: boolean }>(), { state: 'idle', disabled: false, text: '', plain: false })
const emit = defineEmits<{ click: [] }>()
const slot4 = computed(() => ((props.index % 4) + 4) % 4)
const letter = computed(() => String.fromCharCode(65 + slot4.value))
/** Long answers get smaller letters (the tile keeps its size). */
const size = computed(() => {
  const n = props.text.length
  return n <= 18 ? '1.2rem' : n <= 40 ? '1.05rem' : '0.95rem'
})
</script>

<template lang="pug">
  button(type="button" :class="['fam-choice', 'fam-choice--' + slot4, 'is-' + state, { 'is-plain': plain }]" :disabled="disabled" @click="emit('click')")
    span(v-if="!plain" class="fam-choice-letter" aria-hidden="true") {{ letter }}
    span(class="fam-choice-text" :style="{ fontSize: size }")
      slot {{ text }}
    span(v-if="state === 'right'" class="fam-choice-mark is-tick" aria-hidden="true")
    span(v-else-if="state === 'wrong'" class="fam-choice-mark is-cross" aria-hidden="true")
</template>

<style scoped lang="sass">
.fam-choice
  --bg: var(--fam-a-bg)
  --ink: var(--fam-a-ink)
  position: relative
  box-sizing: border-box
  display: flex
  align-items: center
  justify-content: center
  width: 100%
  min-height: 64px
  // the same room at both ends, so that the text lies in the true middle of the tile
  padding: 10px 56px
  border: 0
  border-radius: 22px
  background: var(--bg)
  color: var(--ink)
  font: inherit
  font-weight: 800
  line-height: 1.2
  text-align: center
  cursor: pointer
  touch-action: manipulation
  -webkit-tap-highlight-color: transparent
  box-shadow: 0 4px 0 rgba(0, 0, 0, 0.2), 0 10px 16px -10px rgba(10, 30, 40, 0.5)
  transition: transform 0.15s, box-shadow 0.2s, opacity 0.25s

  &:focus-visible
    outline: 3px solid var(--fam-focus)
    outline-offset: 3px

  &:active:not(:disabled)
    transform: translateY(3px)
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.2)

  // after the answer the buttons are blocked, but they keep their colours (only the others rest)
  &:disabled
    cursor: default

  &.is-right
    box-shadow: 0 0 0 3px var(--fam-card), 0 0 0 7px var(--fam-ok)
    transform: scale(1.015)

  &.is-wrong
    box-shadow: 0 0 0 3px var(--fam-card), 0 0 0 6px color-mix(in srgb, var(--fam-bad) 75%, transparent)
    opacity: 0.85

  &.is-dim
    opacity: 0.55
    box-shadow: none

// `plain`: no letter badge, less room at the sides (short answers such as Yes / No / Don't know, three fit in a row)
.fam-choice.is-plain
  padding: 10px 8px

.fam-choice--0
  --bg: var(--fam-a-bg)
  --ink: var(--fam-a-ink)

.fam-choice--1
  --bg: var(--fam-b-bg)
  --ink: var(--fam-b-ink)

.fam-choice--2
  --bg: var(--fam-c-bg)
  --ink: var(--fam-c-ink)

.fam-choice--3
  --bg: var(--fam-d-bg)
  --ink: var(--fam-d-ink)

// the letter badge A to D
.fam-choice-letter
  position: absolute
  left: 12px
  top: 50%
  display: grid
  place-items: center
  width: 34px
  height: 34px
  transform: translateY(-50%)
  border-radius: 50%
  background: color-mix(in srgb, var(--ink) 20%, transparent)
  font-size: 1.05rem
  font-weight: 800
  line-height: 1

.fam-choice-text
  display: block
  min-width: 0
  text-align: center
  overflow-wrap: anywhere

// tick and cross: a white tag at the right end
.fam-choice-mark
  position: absolute
  right: 12px
  top: 50%
  width: 30px
  height: 30px
  transform: translateY(-50%)
  border-radius: 50%
  background: #fff

  &::before, &::after
    content: ''
    position: absolute

.fam-choice-mark.is-tick
  &::after
    left: 11px
    top: 5px
    width: 7px
    height: 14px
    border: solid var(--fam-ok)
    border-width: 0 3.5px 3.5px 0
    transform: rotate(45deg)

.fam-choice-mark.is-cross
  &::before, &::after
    left: 6px
    top: 13px
    width: 18px
    height: 4px
    border-radius: 2px
    background: #c0392b

  &::before
    transform: rotate(45deg)

  &::after
    transform: rotate(-45deg)

@media (prefers-reduced-motion: no-preference)
  .fam-choice.is-wrong
    animation: fam-shake 0.45s ease-in-out 1

@keyframes fam-shake
  0%, 100%
    transform: translateX(0)
  20%
    transform: translateX(-6px)
  40%
    transform: translateX(5px)
  60%
    transform: translateX(-3px)
  80%
    transform: translateX(2px)
</style>
