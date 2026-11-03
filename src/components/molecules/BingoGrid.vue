<script setup lang="ts">
/**
 * The card of the Bible bingo: sixteen people (picture and name) in four rows. A tap ticks a person (a golden frame and a star); in the
 * preview (`readonly`) nothing can be tapped. The pictures are in `public/images/spiele-personen/` and are numbered like `WHO_PEOPLE`.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { WHO_PEOPLE } from '@/data/whoAmI'
import type { ActivityLocale } from '@/data/activityWords'
import { BINGO_SIZE } from '@/utils/bibleBingo'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ card: number[]; marked: boolean[]; readonly?: boolean }>()
const emit = defineEmits<{ (e: 'toggle', place: number): void }>()

const { locale } = useI18n({ useScope: 'global' })
const lang = computed<ActivityLocale>(() => (locale.value.startsWith('en') ? 'en' : locale.value.startsWith('es') ? 'es' : 'de'))
const nameOf = (person: number) => WHO_PEOPLE[person]?.name[lang.value] ?? ''
const picture = (person: number) => prependBaseUrl(`images/spiele-personen/${String(person).padStart(2, '0')}.webp`)

/** A picture that is not there (yet) is left out; the name stays. */
function hideBroken(e: Event) {
  const el = e.target
  if (el instanceof HTMLElement) el.style.display = 'none'
}
</script>

<template lang="pug">
  div(class="bg-grid" :style="{ '--bg-size': BINGO_SIZE }")
    component(
      :is="readonly ? 'span' : 'button'"
      v-for="(person, i) in props.card"
      :key="i"
      :type="readonly ? undefined : 'button'"
      :aria-pressed="readonly ? undefined : !!props.marked[i]"
      :class="['bg-cell', { 'is-on': props.marked[i], 'is-readonly': readonly }]"
      @click="!readonly && emit('toggle', i)"
    )
      img(:src="picture(person)" alt="" class="bg-img" draggable="false" @error="hideBroken")
      span(class="bg-name") {{ nameOf(person) }}
      span(v-if="props.marked[i]" class="bg-mark" aria-hidden="true") ★
</template>

<style scoped lang="sass">
.bg-grid
  display: grid
  grid-template-columns: repeat(var(--bg-size), minmax(0, 1fr))
  gap: 6px

.bg-cell
  position: relative
  display: flex
  flex-direction: column
  align-items: center
  justify-content: flex-end
  gap: 2px
  aspect-ratio: var(--bg-ratio, 3 / 4)
  padding: 3px 3px 5px
  border: 2px solid var(--lk-line)
  border-radius: 12px
  background: var(--lk-surface)
  color: var(--lk-text)
  font: inherit
  overflow: hidden
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  &.is-readonly
    cursor: default

  &.is-on
    border-color: #e0bd62
    background: linear-gradient(160deg, #fdf5dc, #f3d484)
    color: #3a2c10
    box-shadow: inset 0 0 0 2px rgba(230, 184, 64, 0.6)

.bg-img
  flex: 1 1 auto
  min-height: 0
  width: 100%
  object-fit: cover
  border-radius: 8px

.bg-name
  flex: none
  max-width: 100%
  font-size: 0.66rem
  font-weight: 800
  line-height: 1.1
  text-align: center
  overflow-wrap: anywhere

.bg-mark
  position: absolute
  top: 3px
  right: 5px
  font-size: 1.3rem
  line-height: 1
  color: #b8860b
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.9)
</style>
