<script setup lang="ts">
/**
 * Familien-Spiele v2: the name of a player (replaces the line on parchment). A white row with the painted figure of the player at the left
 * (`seat`: the number of the seat; a tap on it emits `token`, to choose another figure) and a name field in the style of the app (radius 16,
 * a line, 48 px high, text centred). Without `seat` it is just the field (also used for a code). `v-model` holds the text.
 */
import MapToken from '@/components/molecules/map/MapToken.vue'

withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    ariaLabel?: string
    maxlength?: number
    /** The seat whose figure is shown (0 for the first one). */
    seat?: number
    /** The figure row of this seat is open (for `aria-expanded`). */
    open?: boolean
    /** Capital letters, wide spacing: for a code. */
    code?: boolean
    tokenLabel?: string
  }>(),
  { placeholder: '', ariaLabel: '', maxlength: 16, seat: undefined, open: false, code: false, tokenLabel: '' }
)
const emit = defineEmits<{ 'update:modelValue': [text: string]; token: []; enter: [] }>()
// (the cast to the input lives here: TypeScript is not allowed inside the pug template)
function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}
</script>

<template lang="pug">
  div(:class="['fam-name', { 'has-seat': seat !== undefined }]")
    button(v-if="seat !== undefined" type="button" class="fam-name-token" :aria-label="tokenLabel" :aria-expanded="open" @click="emit('token')")
      MapToken(:index="seat" :size="38")
      span(class="fam-name-swap" aria-hidden="true") ⇅
    input(
      :value="modelValue"
      :class="['fam-name-input', { 'is-code': code }]"
      type="text"
      :maxlength="maxlength"
      :placeholder="placeholder"
      :aria-label="ariaLabel || placeholder"
      :autocapitalize="code ? 'characters' : undefined"
      :autocomplete="code ? 'off' : undefined"
      :spellcheck="code ? false : undefined"
      @input="onInput"
      @keyup.enter="emit('enter')"
    )
</template>

<style scoped lang="sass">
.fam-name
  display: flex
  align-items: center
  gap: 6px
  box-sizing: border-box
  width: 100%
  min-width: 0

.fam-name.has-seat
  padding: 6px 8px 6px 4px
  border: 1.5px solid var(--fam-line)
  border-radius: 20px
  background: var(--fam-card)
  box-shadow: var(--fam-shadow)

.fam-name-token
  flex: none
  display: flex
  align-items: center
  justify-content: center
  gap: 1px
  min-width: 52px
  min-height: 48px
  padding: 0
  border: 0
  background: transparent
  color: var(--fam-muted)
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  &:focus-visible
    outline: 3px solid var(--fam-focus)
    outline-offset: 1px
    border-radius: 14px

.fam-name-swap
  font-size: 0.8rem
  line-height: 1
  opacity: 0.7

.fam-name-input
  flex: 1
  min-width: 0
  width: 100%
  box-sizing: border-box
  min-height: 48px
  padding: 4px 12px
  border: 1.5px solid var(--fam-line-strong)
  border-radius: var(--fam-r-field)
  background: var(--fam-field)
  color: var(--fam-ink)
  font: inherit
  font-size: 1.1rem
  font-weight: 700
  text-align: center
  outline: none
  transition: border-color 0.2s, box-shadow 0.2s

  &::placeholder
    color: var(--fam-muted)
    opacity: 0.75
    font-weight: 600

  &:focus
    border-color: var(--fam-gold)
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--fam-focus) 45%, transparent)

.fam-name-input.is-code
  font-size: 1.3rem
  letter-spacing: 0.12em
  text-transform: uppercase
</style>
