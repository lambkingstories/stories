<script setup lang="ts">
/**
 * Familien-Spiele v2: an on/off switch of the family games (e.g. "Play in two teams"). A white capsule with the label centred and a small
 * sliding switch at the left; on = teal switch and a gold line. At least 56 px high. `v-model` holds the boolean.
 */
const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [on: boolean] }>()
function flip() {
  emit('update:modelValue', !props.modelValue)
}
</script>

<template lang="pug">
  button(type="button" role="switch" :aria-checked="modelValue" :class="['fam-switch', { 'is-on': modelValue }]" @click="flip")
    span(class="fam-switch-track" aria-hidden="true")
      span(class="fam-switch-knob")
    span(class="fam-switch-text")
      slot
</template>

<style scoped lang="sass">
.fam-switch
  position: relative
  box-sizing: border-box
  display: flex
  align-items: center
  justify-content: center
  width: 100%
  min-height: 56px
  padding: 8px 64px
  border: 2px solid var(--fam-line-strong)
  border-radius: 999px
  background: var(--fam-card)
  box-shadow: var(--fam-shadow)
  color: var(--fam-ink)
  font: inherit
  font-size: 1.05rem
  font-weight: 700
  line-height: 1.2
  text-align: center
  cursor: pointer
  touch-action: manipulation
  -webkit-tap-highlight-color: transparent
  transition: border-color 0.2s

  &:focus-visible
    outline: 3px solid var(--fam-focus)
    outline-offset: 3px

  &.is-on
    border-color: var(--fam-gold)

.fam-switch-track
  position: absolute
  left: 14px
  top: 50%
  width: 44px
  height: 26px
  transform: translateY(-50%)
  border-radius: 999px
  background: var(--fam-line-strong)
  transition: background 0.2s

.fam-switch-knob
  position: absolute
  left: 3px
  top: 3px
  width: 20px
  height: 20px
  border-radius: 50%
  background: #fff
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35)
  transition: transform 0.2s

.is-on .fam-switch-track
  background: var(--fam-primary)

.is-on .fam-switch-knob
  transform: translateX(18px)

.fam-switch-text
  display: block
  text-align: center
</style>
