<script setup lang="ts">
/**
 * The time line of the Bible as a picture to wipe through: from left to right the epochs, in each one the adventures as medals that hang
 * above and below a line, one after the other (Adam and Eve at the left, Paul at the right). Old and New Testament are two big bands. An epoch's
 * name stays at the left edge of the screen while its medals go by. The adventure the child goes on with has a flag. A tap on a medal is
 * handed to the page (it opens the same window as in the list). Adventures that are not built stand closed in their place.
 */
import { computed, nextTick, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdventureStars from '@/components/molecules/AdventureStars.vue'
import PlusBadge from '@/components/atoms/PlusBadge.vue'
import type { EpochGroup } from '@/data/adventures/timeline'
import { prependBaseUrl } from '@/utils/function'
import { medalThumb, onThumbError } from '@/utils/medalThumb'

export interface TimelineItem {
  journey: { id: string; title: string; medal: string }
  medal: string | null
  stars: number
  plus: boolean
  begun: boolean
  doneCount: number
  total: number
}

const props = defineProps<{
  groups: EpochGroup<TimelineItem>[]
  /** The adventure to go on with: it gets the flag and the screen opens at it. */
  currentId: string | null
}>()
const emit = defineEmits<{ pick: [id: string]; epoch: [id: string] }>()

const { t } = useI18n({ useScope: 'global' })
const ui = (name: string) => prependBaseUrl(`images/abenteuer/ui/${name}.webp`)
const cupOf = (m: string) => ui(`pokal-${m === 'silver' ? 'silber' : m}`)

/** The colour of every epoch (the line, the dots, the name). */
const COLORS: Record<string, string> = {
  anfang: '#3f9a86',
  erzvaeter: '#d58a2e',
  auszug: '#c4603a',
  koenige: '#8657b4',
  propheten: '#3a76c2',
  jesus: '#c99a14',
  gemeinde: '#cf5468'
}
const colorOf = (id: string) => COLORS[id] ?? '#777777'

const NEW_EPOCHS = ['jesus', 'gemeinde']
const parts = computed(() => [
  { id: 'old', label: t('app.adventure.timelineOld'), groups: props.groups.filter((g) => !NEW_EPOCHS.includes(g.epoch.id)) },
  { id: 'new', label: t('app.adventure.timelineNew'), groups: props.groups.filter((g) => NEW_EPOCHS.includes(g.epoch.id)) }
])

const scroller = ref<HTMLElement | null>(null)

/** The epoch whose band is under the left edge of the screen (told to the page, so its chips can mark it). */
function onScroll() {
  const sc = scroller.value
  if (!sc) return
  const edge = sc.getBoundingClientRect().left + 60
  let on = ''
  for (const el of sc.querySelectorAll<HTMLElement>('.tl-epoch')) {
    if (el.getBoundingClientRect().left <= edge) on = el.id.replace('tl-epoch-', '')
  }
  if (on) emit('epoch', on)
}

function scrollToEl(el: Element | null, where: 'start' | 'center') {
  const sc = scroller.value
  if (!el || !sc) return
  const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
  const box = sc.getBoundingClientRect()
  const r = el.getBoundingClientRect()
  const left = sc.scrollLeft + (r.left - box.left) - (where === 'center' ? (box.width - r.width) / 2 : 12)
  sc.scrollTo({ left: Math.max(0, left), behavior: reduce ? 'auto' : 'smooth' })
}

function scrollToEpoch(id: string) {
  scrollToEl(scroller.value?.querySelector(`#tl-epoch-${id}`) ?? null, 'start')
}

function scrollToCurrent(smooth = false) {
  const sc = scroller.value
  const el = props.currentId ? sc?.querySelector(`[data-id="${props.currentId}"]`) : null
  if (!sc) return
  if (!el) {
    sc.scrollLeft = 0
    return
  }
  if (smooth) scrollToEl(el, 'center')
  else {
    const box = sc.getBoundingClientRect()
    const r = el.getBoundingClientRect()
    sc.scrollLeft = Math.max(0, sc.scrollLeft + (r.left - box.left) - (box.width - r.width) / 2)
  }
}

onMounted(() => {
  void nextTick(() => {
    scrollToCurrent()
    onScroll()
  })
})

defineExpose({ scrollToEpoch, scrollToCurrent })
</script>

<template lang="pug">
  div(class="tl" ref="scroller" role="group" :aria-label="t('app.adventure.timelineLabel')" @scroll.passive="onScroll")
    div(class="tl-track")
      section(v-for="part in parts" :key="part.id" :class="['tl-part', `is-${part.id}`]")
        div(class="tl-part-head")
          span(class="tl-part-label") {{ part.label }}
        div(class="tl-epochs")
          article(v-for="g in part.groups" :key="g.epoch.id" :id="`tl-epoch-${g.epoch.id}`" class="tl-epoch" :style="{ '--c': colorOf(g.epoch.id) }")
            header(class="tl-epoch-head")
              span(class="tl-epoch-name") {{ g.title }}
              small(class="tl-epoch-sub") {{ g.sub }}
            div(class="tl-lane" :style="{ width: g.entries.length * 124 + 'px' }")
              div(class="tl-line" aria-hidden="true")
              div(v-for="(e, i) in g.entries" :key="e.id" :data-id="e.id" :class="['tl-node', i % 2 ? 'is-down' : 'is-up', { 'is-current': e.id === currentId, 'is-closed': !e.item, 'is-done': !!e.item?.medal }]")
                span(class="tl-dot") {{ e.nr }}
                span(class="tl-stem" aria-hidden="true")
                button(v-if="e.item" type="button" class="tl-card" @click="emit('pick', e.item.journey.id)")
                  span(v-if="e.id === currentId" class="tl-flag") {{ t('app.adventure.timelineHere') }}
                  span(v-if="e.item.plus" class="tl-plus")
                    PlusBadge(size="small")
                  span(class="tl-art")
                    img(:src="prependBaseUrl(medalThumb(e.item.journey.medal))" alt="" draggable="false" @error="(ev) => onThumbError(ev, prependBaseUrl(e.item?.journey.medal ?? ''))")
                    img(v-if="e.item.medal" :src="cupOf(e.item.medal)" alt="" class="tl-cup" draggable="false")
                  span(class="tl-name") {{ e.title }}
                  span(v-if="e.item.begun && !e.item.medal" class="tl-bar" aria-hidden="true")
                    span(class="tl-fill" :style="{ width: Math.round((e.item.doneCount / e.item.total) * 100) + '%' }")
                  AdventureStars(:stars="e.item.stars" :size="14")
                div(v-else class="tl-card is-closed")
                  span(class="tl-art")
                    img(:src="ui('coin-locked')" alt="" draggable="false")
                    img(:src="ui('lock')" alt="" class="tl-lock" draggable="false")
                  span(class="tl-name") {{ e.title }}
                  span(class="tl-soon") {{ t('app.adventure.soonLabel') }}
      //- the end of the line: an arrow that points on
      div(class="tl-end" aria-hidden="true") ›
</template>

<style scoped lang="sass">
$ink: var(--lk-text)
$lane: 440px
$gap: 30px

.tl
  position: relative
  overflow-x: auto
  overflow-y: hidden
  padding: 6px 0 14px
  background: linear-gradient(180deg, color-mix(in srgb, var(--lk-accent) 7%, var(--lk-bg)) 0%, var(--lk-bg) 100%)
  border-top: 1px solid var(--lk-line)
  border-bottom: 1px solid var(--lk-line)
  -webkit-overflow-scrolling: touch
  overscroll-behavior-x: contain
  scrollbar-width: thin

.tl-track
  display: flex
  align-items: stretch
  width: max-content
  padding: 0 24px 0 34px

// the two big bands: Old and New Testament
.tl-part
  display: flex
  flex-direction: column
  margin-right: 18px

.tl-part-head
  position: sticky
  left: 12px
  z-index: 4
  align-self: flex-start
  padding: 8px 0 2px

.tl-part-label
  display: inline-block
  padding: 6px 16px
  border-radius: 999px
  font-size: 0.82rem
  font-weight: 800
  letter-spacing: 0.08em
  text-transform: uppercase
  color: #fff
  box-shadow: 0 3px 10px rgba(30, 40, 60, 0.22)

.is-old .tl-part-label
  background: linear-gradient(135deg, #b9803a, #8f5c26)

.is-new .tl-part-label
  background: linear-gradient(135deg, #3d78c4, #2a559a)

.tl-epochs
  display: flex
  align-items: stretch
  border-top: 3px solid color-mix(in srgb, var(--lk-line) 80%, transparent)
  margin-top: 4px

.tl-epoch
  position: relative
  display: flex
  flex-direction: column
  padding: 0 44px 0 0
  border-left: 2px dashed color-mix(in srgb, var(--c) 55%, transparent)

  &:first-child
    border-left-color: transparent

// the name of the epoch stays at the left edge while its medals go by
.tl-epoch-head
  position: sticky
  left: 14px
  z-index: 3
  align-self: flex-start
  display: flex
  flex-direction: column
  max-width: 82vw
  margin: 10px 0 0 12px
  padding: 8px 14px 9px
  border-radius: 14px
  background: color-mix(in srgb, var(--c) 14%, var(--lk-surface))
  border: 1px solid color-mix(in srgb, var(--c) 45%, transparent)
  box-shadow: 0 3px 10px rgba(30, 40, 60, 0.1)

.tl-epoch-name
  font-size: 1.08rem
  font-weight: 800
  line-height: 1.15
  color: color-mix(in srgb, var(--c) 78%, #1a1a1a)

.tl-epoch-sub
  margin-top: 1px
  font-size: 0.78rem
  font-weight: 600
  line-height: 1.25
  color: var(--lk-muted)

.tl-lane
  position: relative
  height: $lane
  margin-left: 6px
  display: flex

// the line the medals hang on
.tl-line
  position: absolute
  left: 0
  right: -46px
  top: calc(50% + 14px)
  height: 10px
  transform: translateY(-50%)
  border-radius: 999px
  background: linear-gradient(180deg, color-mix(in srgb, var(--c) 100%, #fff 18%), var(--c))
  box-shadow: 0 2px 6px color-mix(in srgb, var(--c) 40%, transparent)

.tl-node
  position: relative
  flex: 0 0 124px
  height: 100%

.tl-dot
  position: absolute
  left: 50%
  top: calc(50% + 14px)
  z-index: 2
  display: grid
  place-items: center
  width: 28px
  height: 28px
  transform: translate(-50%, -50%)
  border-radius: 50%
  background: var(--lk-surface)
  border: 3px solid var(--c)
  color: var(--c)
  font-size: 0.72rem
  font-weight: 800
  font-variant-numeric: tabular-nums
  box-shadow: 0 2px 6px rgba(30, 40, 60, 0.25)

.is-done .tl-dot
  background: #e9b72c
  border-color: #b8860b
  color: #5a3d05

.is-closed .tl-dot
  border-style: dashed
  color: var(--lk-muted)
  border-color: color-mix(in srgb, var(--c) 40%, #999)

.tl-stem
  position: absolute
  left: 50%
  width: 3px
  height: $gap
  margin-left: -1.5px
  background: color-mix(in srgb, var(--c) 70%, transparent)
  border-radius: 2px

.is-up .tl-stem
  bottom: calc(50% - 14px + 12px)

.is-down .tl-stem
  top: calc(50% + 14px + 12px)

.tl-card
  position: absolute
  left: 50%
  width: 168px
  transform: translateX(-50%)
  display: flex
  flex-direction: column
  align-items: center
  gap: 4px
  padding: 10px 6px 8px
  border: 1px solid var(--lk-line)
  border-radius: 18px
  background: var(--lk-surface)
  box-shadow: var(--lk-shadow)
  font: inherit
  color: $ink
  text-align: center
  cursor: pointer
  -webkit-tap-highlight-color: transparent
  touch-action: manipulation

  &:active:not(.is-closed)
    transform: translateX(-50%) scale(0.97)

  &.is-closed
    cursor: default
    opacity: 0.8

// above the line: the card ends at the stem; below: it starts under the stem
.is-up .tl-card
  bottom: calc(50% - 14px + 12px + #{$gap})

.is-down .tl-card
  top: calc(50% + 14px + 12px + #{$gap})

.is-current .tl-card
  border-color: #e0a820
  box-shadow: 0 0 0 3px rgba(224, 168, 32, 0.35), var(--lk-shadow)

.is-current .tl-dot
  animation: tl-pulse 2s ease-in-out infinite

@keyframes tl-pulse
  0%, 100%
    box-shadow: 0 0 0 0 rgba(224, 168, 32, 0.55), 0 2px 6px rgba(30, 40, 60, 0.25)
  50%
    box-shadow: 0 0 0 9px rgba(224, 168, 32, 0), 0 2px 6px rgba(30, 40, 60, 0.25)

@media (prefers-reduced-motion: reduce)
  .is-current .tl-dot
    animation: none

.tl-flag
  position: absolute
  top: -13px
  left: 50%
  transform: translateX(-50%)
  padding: 2px 10px
  border-radius: 999px
  background: #e0a820
  color: #3a2a18
  font-size: 0.7rem
  font-weight: 800
  white-space: nowrap
  box-shadow: 0 2px 6px rgba(60, 40, 10, 0.3)

.tl-plus
  position: absolute
  right: 6px
  top: 6px
  z-index: 1

.tl-art
  position: relative
  display: block
  width: 86px
  height: 86px

  img
    display: block
    width: 100%
    height: 100%
    object-fit: contain
    pointer-events: none

.tl-cup
  position: absolute
  right: -10px
  bottom: -4px
  width: 38px !important
  height: 38px !important

.tl-lock
  position: absolute
  left: 50%
  top: 50%
  width: 34px !important
  height: 34px !important
  transform: translate(-50%, -50%)

.tl-name
  padding: 0 6px
  font-weight: 800
  font-size: 0.92rem
  line-height: 1.2
  min-height: 2.4em
  display: flex
  align-items: center

.tl-soon
  font-size: 0.78rem
  font-weight: 700
  color: var(--lk-muted)

.tl-bar
  display: block
  width: 70%
  height: 6px
  border-radius: 999px
  background: var(--lk-track)
  overflow: hidden

.tl-fill
  display: block
  height: 100%
  border-radius: 999px
  background: #c9962a

.tl-end
  align-self: center
  margin: 0 0 0 4px
  padding-bottom: 6px
  font-size: 3rem
  font-weight: 800
  line-height: 1
  color: color-mix(in srgb, var(--lk-muted) 60%, transparent)
</style>
