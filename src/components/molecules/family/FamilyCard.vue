<script setup lang="ts">
/**
 * Familien-Spiele v2: a white card of the family games (replaces `MapPaper`, the parchment). Radius 24, soft shadow, thin warm line.
 * With `title`, `symbol` or the `head` slot it gets a head stripe in the colour of the game (`--fam-accent`, set by the class
 * `fam-game--<key>` of the table), the painted symbol of the game small at its left end; without them it is a plain card with a small corner
 * accent in the same colour. `tone` frames the card: `right` (green) or `wrong` (soft red) for the verdict of an answer, `lit` (gold).
 * All text is centred. The content goes in the default slot.
 */
import { computed, ref, useSlots } from 'vue'
import { familySymbol, type FamilyGameKey } from './familyGames'

const props = withDefaults(
  defineProps<{
    /** The heading in the head stripe. */
    title?: string
    /** The game whose painted symbol sits in the head (only with a head). */
    symbol?: FamilyGameKey
    tone?: 'default' | 'right' | 'wrong' | 'lit'
    dim?: boolean
    /** Less padding, for a hint or a line of text. */
    compact?: boolean
    /** No card at all (no surface, line, shadow, accent, padding): only the layout of the content. */
    bare?: boolean
  }>(),
  { title: '', symbol: undefined, tone: 'default', dim: false, compact: false, bare: false }
)
const slots = useSlots()
const hasHead = computed(() => !!props.title || !!props.symbol || !!slots.head)
const src = computed(() => (props.symbol ? familySymbol(props.symbol) : ''))
const broken = ref(false)
</script>

<template lang="pug">
  section(:class="['fam-card', 'fam-card--' + tone, { 'has-head': hasHead, 'is-dim': dim, 'is-compact': compact, 'is-bare': bare }]")
    header(v-if="hasHead" class="fam-card-head")
      span(v-if="symbol && !broken" class="fam-card-symbol" aria-hidden="true")
        img(:src="src" alt="" draggable="false" @error="broken = true")
      slot(name="head")
        h2(v-if="title" class="fam-card-title") {{ title }}
    div(class="fam-card-body")
      slot
</template>

<style scoped lang="sass">
.fam-card
  position: relative
  box-sizing: border-box
  width: 100%
  min-width: 0
  overflow: hidden
  border: 1.5px solid var(--fam-line)
  border-radius: var(--fam-r-card)
  background: var(--fam-card)
  box-shadow: var(--fam-shadow)
  color: var(--fam-ink)
  text-align: center
  transition: opacity 0.25s, border-color 0.25s, box-shadow 0.25s

  // without a head: a small corner accent in the colour of the game
  &.fam-card--default:not(.has-head)::before
    content: ''
    position: absolute
    top: 0
    left: 50%
    width: 56px
    height: 5px
    transform: translateX(-50%)
    border-radius: 0 0 6px 6px
    background: var(--fam-accent)

  &.is-dim
    opacity: 0.55

  &.fam-card--right
    border-color: var(--fam-ok)
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--fam-ok) 35%, transparent), var(--fam-shadow)

  &.fam-card--wrong
    border-color: color-mix(in srgb, var(--fam-bad) 70%, transparent)

  &.fam-card--lit
    border-color: var(--fam-gold)
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--fam-gold) 40%, transparent), var(--fam-shadow)

.fam-card.is-bare
  overflow: visible
  border: 0
  background: transparent
  box-shadow: none

  &::before
    display: none

  .fam-card-body
    padding: 0

.fam-card-head
  position: relative
  display: flex
  align-items: center
  justify-content: center
  min-height: 52px
  padding: 8px 56px
  background: var(--fam-accent)
  color: var(--fam-on-accent)

.fam-card-symbol
  position: absolute
  left: 10px
  top: 50%
  display: block
  width: 40px
  height: 40px
  transform: translateY(-50%)
  border-radius: 50%
  background: rgba(255, 255, 255, 0.24)

  img
    position: absolute
    inset: -6%
    width: 112%
    height: 112%
    object-fit: contain
    filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.3))

.fam-card-title
  margin: 0
  font-size: 1.12rem
  font-weight: 800
  line-height: 1.2
  text-align: center

.fam-card-body
  display: flex
  flex-direction: column
  align-items: center
  gap: 12px
  padding: 18px 16px 18px
  font-size: 1.05rem
  font-weight: 600
  line-height: 1.35

.is-compact .fam-card-body
  gap: 6px
  padding: 14px 14px

.fam-card:not(.has-head) .fam-card-body
  padding-top: 20px

.fam-card:not(.has-head).is-compact .fam-card-body
  padding-top: 16px
</style>
