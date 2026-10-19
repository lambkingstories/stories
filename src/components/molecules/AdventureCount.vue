<script setup lang="ts">
/**
 * The counting game: things are scattered over the picture, the child taps each one while counting, and then says how many there
 * were. Right the first time gives three stars, the second time two, later one (see `adventureScore`). A right answer is shown
 * and confirmed with a button; the stage only goes on from there.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import AdventureStars from '@/components/molecules/AdventureStars.vue'
import { attemptStars } from '@/utils/adventureScore'
import type { CountGroup } from '@/types/adventure'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'

/** `image` and `imageOff`: the things lit and not yet counted; `{n}` (1–3) is a variant of the picture. */
const props = defineProps<{ count: number; image: string; imageOff?: string; background?: string; groups?: CountGroup[]; question?: string }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const progress = useTaskProgress()

/** The things to count: one kind (`image`), or several kinds mixed (`groups`, for example fat and thin cows). */
const things = computed(() => {
  const groups = props.groups?.length ? props.groups : [{ image: props.image, imageOff: props.imageOff, count: props.count }]
  const list: { on: string; off: string }[] = []
  for (const g of groups) for (let i = 0; i < g.count; i++) list.push({ on: g.image, off: g.imageOff ?? g.image })
  // mixed in a fixed order
  let seed = list.length * 5113 + 7
  for (let i = list.length - 1; i > 0 && groups.length > 1; i--) {
    seed = (seed * 9301 + 49297) % 233280
    const j = Math.floor((seed / 233280) * (i + 1))
    ;[list[i], list[j]] = [list[j]!, list[i]!]
  }
  return list
})
const total = computed(() => things.value.length)
const wide = computed(() => !!props.groups?.length)

/** Places on a loose grid, the same every time (a small deterministic scatter). */
const spots = computed(() => {
  const cols = Math.ceil(Math.sqrt(total.value * (wide.value ? 0.9 : 1.3)))
  const rows = Math.ceil(total.value / cols)
  const out: { x: number; y: number; r: number }[] = []
  let seed = total.value * 9301 + 49297
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
  for (let i = 0; i < total.value; i++) {
    const c = i % cols
    const r = Math.floor(i / cols)
    out.push({
      // kept a little away from the edges, so that nothing is cut off
      x: 8 + ((c + 0.5 + (rnd() - 0.5) * 0.5) / cols) * 84,
      y: 9 + ((r + 0.5 + (rnd() - 0.5) * 0.5) / rows) * 82,
      r: (rnd() - 0.5) * 30
    })
  }
  return out
})

const PENTATONIC = [1, 1.125, 1.25, 1.5, 1.667, 2, 2.25, 2.5]

const picture = (i: number, on: boolean) => {
  const t = things.value[i]
  const src = (on ? t?.on : t?.off) ?? ''
  return prependBaseUrl(src.replace('{n}', String((i % 3) + 1)))
}


const tapped = ref<boolean[]>(Array.from({ length: total.value }, () => false))
const counted = computed(() => tapped.value.filter(Boolean).length)
const allTapped = computed(() => counted.value >= total.value)

/** Three numbers to choose from, the right one among them. */
const choices = computed(() => {
  const set = new Set<number>([total.value])
  for (const d of [1, -1, 2, -2, 3]) {
    if (set.size >= 3) break
    if (total.value + d > 0) set.add(total.value + d)
  }
  return [...set].sort((a, b) => a - b)
})

const attempts = ref(0)
const wrong = ref<number[]>([])
const finished = ref(false)
const stars = computed(() => attemptStars(attempts.value))

function tap(i: number) {
  if (finished.value) return
  // a bright little bell, one note higher with every one that is counted
  if (!tapped.value[i]) play('bead', 1.1, PENTATONIC[counted.value % PENTATONIC.length]!)
  tapped.value[i] = true
  progress.mark()
}

function choose(n: number) {
  if (finished.value || wrong.value.includes(n)) return
  attempts.value++
  if (n === total.value) {
    finished.value = true
    play('right')
  } else {
    wrong.value.push(n)
    play('wrong')
  }
}
</script>

<template lang="pug">
  div(class="count")
    div(class="count-sky" :class="{ wide }" :style="background ? { backgroundImage: `url(${prependBaseUrl(background)})` } : undefined")
      button(
        v-for="(s, i) in spots"
        :key="i"
        type="button"
        class="count-item"
        :class="{ on: tapped[i] }"
        :style="{ left: `${s.x}%`, top: `${s.y}%`, transform: `translate(-50%, -50%) rotate(${s.r}deg)` }"
        :aria-label="t('app.adventure.countItem', { n: i + 1 })"
        @click="tap(i)"
      )
        img(:src="picture(i, tapped[i] === true)" alt="" draggable="false")
    //- while counting: how many so far; when everything is counted the question takes its place
    p(v-if="!allTapped" class="count-now" aria-live="polite") {{ t('app.adventure.counted', { n: counted }) }}
    div(v-else class="count-ask")
      h3(class="count-q") {{ question || t('app.adventure.howMany') }}
      div(class="count-choices")
        button(
          v-for="n in choices"
          :key="n"
          type="button"
          class="count-choice"
          :class="{ wrong: wrong.includes(n), right: finished && n === total }"
          :disabled="wrong.includes(n) || finished"
          @click="choose(n)"
        )
          span {{ n }}
      p(v-if="wrong.length && !finished" class="count-hint" role="status") {{ t('app.adventure.tryAgain') }}
      template(v-if="finished")
        p(class="count-hint good" role="status") {{ t('app.adventure.countRight', { n: total }) }}
        AdventureStars(:stars="stars" :size="48" celebrate class="count-stars")
        div(class="count-next")
          AdvButton(tone="gold" @click="emit('done', stars)") {{ t('app.adventure.next') }}
</template>

<style scoped lang="sass">
.count
  display: flex
  flex-direction: column
  gap: 12px

.count-sky
  position: relative
  height: min(46vh, 340px)

  &.wide
    height: min(62vh, 470px)
  border-radius: 20px
  // the picture behind the things is set from the code
  background: #1c3556 center / cover no-repeat
  overflow: hidden
  box-shadow: inset 0 0 0 3px rgba(212, 168, 62, 0.7)

.count-item
  position: absolute
  width: 54px
  height: 54px

  .wide &
    width: 84px
    height: 64px
  padding: 0
  border: 0
  background: transparent
  cursor: pointer
  -webkit-tap-highlight-color: transparent
  touch-action: manipulation
  transition: scale 160ms ease-out

  img
    width: 100%
    height: 100%
    object-fit: contain
    pointer-events: none

  &.on
    scale: 1.15

.count-now
  margin: 0
  text-align: center
  font-size: 1.1rem
  font-weight: 800
  color: var(--lk-text)

.count-ask
  text-align: center

.count-q
  margin: 0 0 10px
  font-weight: 800
  font-size: 1.4rem
  color: var(--lk-text)

.count-choices
  display: flex
  justify-content: center
  gap: 12px

// the number lies in the middle of its plaque
.count-choice
  display: grid
  place-items: center
  min-width: 84px
  height: 64px
  padding: 0 16px
  border: 1.5px solid var(--lk-line)
  border-radius: var(--lk-r-btn)
  background: var(--lk-surface)
  color: var(--lk-text)
  cursor: pointer
  touch-action: manipulation
  -webkit-tap-highlight-color: transparent
  transition: transform 80ms ease-out

  &:active:not(:disabled)
    transform: translateY(1px)

  span
    font-weight: 800
    font-size: 1.8rem
    line-height: 1

  &.right
    border-color: var(--lk-ok)
    box-shadow: inset 0 0 0 1.5px var(--lk-ok)

  &.wrong
    border-color: var(--lk-new)
    box-shadow: inset 0 0 0 1.5px var(--lk-new)
    opacity: 0.6

  &:disabled
    cursor: default

.count-hint
  margin: 10px 0 0
  font-weight: 700
  color: var(--lk-muted)

  &.good
    color: var(--lk-ok)
    font-size: 1.1rem

.count-stars
  margin: 8px 0 14px

.count-next
  margin-top: 6px

@media (prefers-reduced-motion: reduce)
  *
    transition: none
</style>
