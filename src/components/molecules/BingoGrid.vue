<script setup lang="ts">
/**
 * The card of the Bible bingo, in the light look of "Familien-Spiele v2": one white board with sixteen light fields (picture and name of a person
 * of the Bible) in four rows. A tap on a field ticks it: a round teal badge with a white check lies on the picture (a second tap takes it away).
 * Whenever a whole row, column or diagonal is ticked, the fields of that line get a gold frame (it stays, nothing blinks). In the preview
 * (`readonly`) nothing can be tapped. The pictures are in `public/images/spiele-personen/` and are numbered like `WHO_PEOPLE`.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { WHO_PEOPLE } from '@/data/whoAmI'
import type { ActivityLocale } from '@/data/activityWords'
import { BINGO_LINES, BINGO_SIZE } from '@/utils/bibleBingo'
import { prependBaseUrl } from '@/utils/function'

const props = withDefaults(defineProps<{ card: number[]; marked: boolean[]; readonly?: boolean }>(), { readonly: false })
const emit = defineEmits<{ (e: 'toggle', place: number): void }>()

const { locale } = useI18n({ useScope: 'global' })
const lang = computed<ActivityLocale>(() => (locale.value.startsWith('en') ? 'en' : locale.value.startsWith('es') ? 'es' : 'de'))
const nameOf = (person: number) => WHO_PEOPLE[person]?.name[lang.value] ?? ''
const picture = (person: number) => prependBaseUrl(`images/spiele-personen/${String(person).padStart(2, '0')}.webp`)

/** The places that belong to a line that is ticked all the way (they get the gold frame). */
const inLine = computed(() => {
  const on = new Set<number>()
  for (const line of BINGO_LINES) if (line.every((p) => props.marked[p])) line.forEach((p) => on.add(p))
  return on
})

/** A picture that is not there (yet) is left out; the name stays. */
function hideBroken(e: Event) {
  const el = e.target
  if (el instanceof HTMLElement) el.style.display = 'none'
}
</script>

<template lang="pug">
  div(class="bg-sheet")
    div(class="bg-grid" :style="{ '--bg-size': BINGO_SIZE }")
      component(
        :is="readonly ? 'span' : 'button'"
        v-for="(person, i) in props.card"
        :key="i"
        :type="readonly ? undefined : 'button'"
        :aria-pressed="readonly ? undefined : !!props.marked[i]"
        :aria-label="nameOf(person)"
        :class="['bg-cell', { 'is-on': props.marked[i], 'is-line': inLine.has(i), 'is-readonly': readonly }]"
        @click="!readonly && emit('toggle', i)"
      )
        span(class="bg-pic")
          img(:src="picture(person)" alt="" class="bg-img" draggable="false" @error="hideBroken")
          span(v-if="props.marked[i]" class="bg-tick" aria-hidden="true")
        span(:class="['bg-name', { 'is-long': nameOf(person).length > 11 }]") {{ nameOf(person) }}
</template>

<style scoped lang="sass">
// the board: a white card of the app, the card stays as big as the width (and the height) allows
.bg-sheet
  box-sizing: border-box
  width: 100%
  padding: 8px
  border: 1.5px solid var(--fam-line)
  border-radius: var(--fam-r-card, 24px)
  background: var(--fam-card)
  box-shadow: var(--fam-shadow)

.bg-grid
  display: grid
  grid-template-columns: repeat(var(--bg-size), minmax(0, 1fr))
  gap: 6px

.bg-cell
  position: relative
  display: flex
  flex-direction: column
  gap: 2px
  box-sizing: border-box
  min-width: 0
  aspect-ratio: var(--bg-ratio, 1 / 1.08)
  padding: 3px
  border: 1.5px solid var(--fam-line-strong)
  border-radius: 14px
  background: var(--fam-card)
  color: var(--fam-ink)
  font: inherit
  overflow: hidden
  cursor: pointer
  touch-action: manipulation
  transition: box-shadow 0.25s, border-color 0.25s, background 0.25s, transform 0.15s
  -webkit-tap-highlight-color: transparent

  &:focus-visible
    outline: 3px solid var(--fam-focus)
    outline-offset: 2px

  &:active:not(.is-readonly)
    transform: scale(0.97)

  &.is-readonly
    cursor: default

  // ticked: a teal frame and the badge
  &.is-on
    border-color: var(--fam-primary)
    box-shadow: 0 0 0 1.5px var(--fam-primary)

  // the line is done: gold around the fields
  &.is-line
    border-color: var(--fam-gold-deep)
    background: color-mix(in srgb, var(--fam-gold) 24%, var(--fam-card))
    box-shadow: 0 0 0 3px var(--fam-gold)

.bg-pic
  position: relative
  flex: 1 1 auto
  min-height: 0
  overflow: hidden
  border-radius: 10px
  background: var(--fam-field)

.bg-img
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  object-fit: cover
  transition: opacity 0.25s

.is-on .bg-img
  opacity: 0.5

// the badge of a ticked field: a round teal tag with a white check mark (drawn by its borders)
.bg-tick
  position: absolute
  left: 50%
  top: 50%
  width: 46%
  aspect-ratio: 1
  transform: translate(-50%, -50%)
  border-radius: 50%
  background: var(--fam-primary)
  box-shadow: 0 0 0 3px var(--fam-card), 0 4px 8px rgba(0, 0, 0, 0.25)

  &::after
    content: ''
    position: absolute
    left: 36%
    top: 20%
    width: 17%
    height: 34%
    border: solid var(--fam-on-primary)
    border-width: 0 3px 3px 0
    transform: rotate(45deg)

.bg-name
  flex: none
  display: flex
  align-items: center
  justify-content: center
  min-height: 2.25em
  padding: 0 1px
  color: var(--fam-ink)
  font-size: 0.8rem
  font-weight: 800
  line-height: 1.08
  text-align: center
  hyphens: auto
  overflow-wrap: anywhere

  &.is-long
    font-size: 0.68rem

// a tick drops onto the field (only for those who do not ask for less movement)
@media (prefers-reduced-motion: no-preference)
  .bg-tick
    animation: bg-drop 0.3s cubic-bezier(0.3, 1.4, 0.5, 1) both

  .bg-cell.is-line
    animation: bg-line 0.5s ease-out 1

@keyframes bg-drop
  from
    opacity: 0
    transform: translate(-50%, -50%) scale(0.4)

@keyframes bg-line
  50%
    transform: scale(1.05)

// the phone lies on its side: less room around the fields, so that they stay big enough
@media (orientation: landscape) and (max-height: 700px)
  .bg-sheet
    padding: 6px

  .bg-grid
    gap: 5px

  .bg-name
    min-height: 1.25em
    font-size: 0.72rem

    &.is-long
      font-size: 0.6rem
</style>
