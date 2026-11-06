<script setup lang="ts">
/**
 * The card of the Bible bingo on the map table: one sheet of parchment with sixteen small linen tiles (picture and name of a person of
 * the Bible) in four rows. A tap on a tile lets a wax seal fall on it (a second tap lifts it again). Whenever a whole row, column or
 * diagonal carries seals, the tiles of that line glow golden. In the preview (`readonly`) nothing can be tapped. The pictures are in
 * `public/images/spiele-personen/` and are numbered like `WHO_PEOPLE`; the seals in `public/images/familie/karte/siegel-1..4.webp`.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { WHO_PEOPLE } from '@/data/whoAmI'
import type { ActivityLocale } from '@/data/activityWords'
import { BINGO_LINES, BINGO_SIZE } from '@/utils/bibleBingo'
import { prependBaseUrl } from '@/utils/function'
import MapPaper from '@/components/molecules/map/MapPaper.vue'

const props = withDefaults(defineProps<{ card: number[]; marked: boolean[]; readonly?: boolean; seal?: number }>(), { readonly: false, seal: 1 })
const emit = defineEmits<{ (e: 'toggle', place: number): void }>()

const { locale } = useI18n({ useScope: 'global' })
const lang = computed<ActivityLocale>(() => (locale.value.startsWith('en') ? 'en' : locale.value.startsWith('es') ? 'es' : 'de'))
const nameOf = (person: number) => WHO_PEOPLE[person]?.name[lang.value] ?? ''
const picture = (person: number) => prependBaseUrl(`images/spiele-personen/${String(person).padStart(2, '0')}.webp`)
const sealSrc = computed(() => prependBaseUrl(`images/familie/karte/siegel-${((props.seal - 1) % 4) + 1}.webp`))

/** The places that belong to a line with seals all the way (they glow). */
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

/** No picture of the seal (yet): a plain dark red wax disc takes its place. */
const sealBroken = ref(false)
</script>

<template lang="pug">
  MapPaper(kind="card" class="bg-sheet")
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
        span(:class="['bg-name', { 'is-long': nameOf(person).length > 12 }]") {{ nameOf(person) }}
        span(v-if="props.marked[i]" class="bg-seal" aria-hidden="true")
          img(v-if="!sealBroken" :src="sealSrc" alt="" draggable="false" @error="sealBroken = true")
          span(v-else class="bg-seal-disc")
</template>

<style scoped lang="sass">
// the sheet: its own inner margin (the parchment brings a ragged border), the card stays as big as the width (and the height) allows
.bg-sheet
  :deep(.mpa-in)
    padding: 7% 6.5% 6.5%

.bg-grid
  display: grid
  grid-template-columns: repeat(var(--bg-size), minmax(0, 1fr))
  gap: 5px

.bg-cell
  position: relative
  display: flex
  flex-direction: column
  box-sizing: border-box
  min-width: 0
  aspect-ratio: var(--bg-ratio, 1 / 1.08)
  padding: 2px
  border: 1px solid rgba(70, 46, 16, 0.55)
  border-radius: 3px
  background: linear-gradient(160deg, #eadbb6, #d6bf8c)
  color: #3a2812
  font: inherit
  overflow: hidden
  cursor: pointer
  box-shadow: 0 2px 3px rgba(20, 10, 0, 0.4), inset 0 0 0 1px rgba(255, 244, 210, 0.45)
  transition: box-shadow 0.3s, border-color 0.3s, transform 0.2s
  -webkit-tap-highlight-color: transparent

  &:active:not(.is-readonly)
    transform: scale(0.97)

  &.is-readonly
    cursor: default

  // the line is done: gold around the tiles
  &.is-line
    border-color: #f0c85a
    box-shadow: 0 0 0 2px #f6d77a, 0 0 12px 2px rgba(255, 205, 90, 0.95), inset 0 0 10px rgba(255, 215, 120, 0.8)
    animation: bg-glow 2.4s ease-in-out infinite

.bg-pic
  position: relative
  flex: 1 1 auto
  min-height: 0
  overflow: hidden
  border-radius: 2px
  background: #8a7347

.bg-img
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  object-fit: cover
  transform: scale(1.08)
  filter: sepia(0.35) saturate(0.85) contrast(0.95)
  transition: filter 0.3s

.is-on .bg-img
  filter: sepia(0.5) saturate(0.7) brightness(0.72)

.bg-name
  flex: none
  display: flex
  align-items: center
  justify-content: center
  min-height: 2.3em
  padding: 1px 1px 0
  font-family: var(--mp-serif, Georgia, serif)
  font-size: 0.74rem
  font-weight: 800
  line-height: 1.08
  text-align: center
  hyphens: auto
  overflow-wrap: anywhere

  &.is-long
    font-size: 0.62rem

// the wax seal falls on the tile
.bg-seal
  position: absolute
  left: 50%
  top: 38%
  width: 64%
  aspect-ratio: 1
  margin: -32% 0 0 -32%
  animation: bg-drop 0.34s cubic-bezier(0.3, 0.7, 0.4, 1) both
  filter: drop-shadow(0 3px 3px rgba(10, 4, 0, 0.7))
  pointer-events: none

  img
    display: block
    width: 100%
    height: 100%
    object-fit: contain

.bg-seal-disc
  display: block
  width: 100%
  height: 100%
  border-radius: 50%
  background: radial-gradient(circle at 38% 32%, #b8453a, #7a1d17 60%, #4a0f0b)
  box-shadow: inset 0 0 0 3px rgba(60, 8, 4, 0.5), inset 0 2px 3px rgba(255, 190, 170, 0.35)

@keyframes bg-drop
  0%
    transform: translateY(-70%) scale(1.9) rotate(-14deg)
    opacity: 0
  55%
    opacity: 1
  78%
    transform: translateY(0) scale(0.92) rotate(2deg)
  100%
    transform: translateY(0) scale(1) rotate(0)

@keyframes bg-glow
  0%, 100%
    box-shadow: 0 0 0 2px #f6d77a, 0 0 9px 1px rgba(255, 205, 90, 0.8), inset 0 0 8px rgba(255, 215, 120, 0.7)
  50%
    box-shadow: 0 0 0 2px #fbe39a, 0 0 16px 4px rgba(255, 215, 110, 1), inset 0 0 12px rgba(255, 225, 140, 0.9)

// the phone lies on its side: less margin on the sheet, so that the tiles stay big enough
@media (orientation: landscape) and (max-height: 700px)
  .bg-sheet
    :deep(.mpa-in)
      padding: 5% 5.5% 5%

  .bg-name
    min-height: 1.25em
    font-size: 0.7rem

    &.is-long
      font-size: 0.56rem

@media (prefers-reduced-motion: reduce)
  .bg-seal,
  .bg-cell.is-line
    animation: none
</style>
