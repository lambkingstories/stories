<script setup lang="ts">
/**
 * Twelve staffs for the night (Numbers 17,16-23): Moses lays twelve staffs down before God in the tent, and the next morning only the staff of Aaron has blossomed. Round 1: the child lays the twelve staffs
 * in a row (a tap on a staff), then the night falls. Round 2: in the morning the child finds the one that has blossomed (a tap on a dry staff is a mistake) and watches what grew on it: buds, blossoms, almonds.
 */
import { computed, reactive, ref } from 'vue'
import GameMark from '@/components/atoms/GameMark.vue'
import WuesteFrame from '@/components/molecules/games/WuesteFrame.vue'
import useTimers from '@/use/useTimers'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { mistakeStars } from '@/utils/adventureScore'
import { prependBaseUrl } from '@/utils/function'
import { staffSlot } from '@/utils/wuesteGames2'
import type { StaffsGame } from '@/types/wuesteGames2'

const props = defineProps<{ game: StaffsGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
const N = 12
progress.setGoal(N + 1)

const src = (p: string) => prependBaseUrl(p)
const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
/** The place of every staff in the row (null while it lies in the pile). */
const slot = reactive<(number | null)[]>(Array.from({ length: N }, () => null))
const laid = ref(0)
const night = ref(false)
const found = ref(false)
const stage = ref(0)
const misses = ref(0)
const wrongAt = ref<number | null>(null)
const finished = ref(false)
const message = ref('')
const stars = computed(() => mistakeStars(misses.value, 1, 4))
const t = computed(() => props.game.texts)
const count = computed(() => t.value.count.replace('{n}', String(progress.parts.value)).replace('{total}', String(progress.goal.value)))
const dryOf = (i: number) => props.game.dry[i % props.game.dry.length]!
const slotAt = (n: number) => staffSlot(n, N, props.game.row)
const aaronIndex = computed(() => slot.findIndex((s) => s === props.game.aaron))
/** The picture of a staff: dry, or (in the morning) Aaron's with the fruit on it. */
const imgOf = (i: number) => (round.value === 1 && i === aaronIndex.value ? props.game.bloom[props.game.bloom.length - 1] ?? '' : dryOf(i))
const bloomNow = computed(() => props.game.bloom[stage.value] ?? '')

function pos(i: number) {
  const s = slot[i]
  if (s === null || s === undefined) return { x: props.game.pile.x + (i - (N - 1) / 2) * 1.5, y: props.game.pile.y }
  return slotAt(s)
}

function tap(i: number) {
  if (night.value || finished.value) return
  if (round.value === 0) {
    if (slot[i] !== null) return
    slot[i] = laid.value++
    progress.mark()
    play('snap')
    if (laid.value === N) {
      message.value = t.value.night
      night.value = true
      later(() => {
        night.value = false
        round.value = 1
        message.value = ''
      }, 2200)
    }
    return
  }
  if (found.value) return
  if (i === aaronIndex.value) {
    found.value = true
    progress.mark()
    play('found')
    message.value = t.value.found
    return
  }
  misses.value++
  play('wrong')
  message.value = t.value.wrong
  wrongAt.value = i
  later(() => {
    if (wrongAt.value === i) wrongAt.value = null
  }, 900)
}

function grow() {
  if (!found.value || finished.value) return
  if (stage.value < props.game.bloom.length - 1) {
    stage.value++
    play('tap')
    message.value = t.value.stage.replace('{n}', String(stage.value + 1))
    if (stage.value === props.game.bloom.length - 1) {
      later(() => {
        play('star')
        finished.value = true
      }, 1700)
    }
  }
}
</script>

<template lang="pug">
  WuesteFrame(
    :background="game.background"
    :hint="current.hint"
    :round="round"
    :rounds="game.rounds.length"
    :label="t.field"
    :count="count"
    :message="message"
    :finished="finished"
    :stars="stars"
    :done-text="t.done"
    @next="emit('done', stars)"
  )
    button(
      v-for="(s, i) in slot"
      :key="`s${i}`"
      type="button"
      class="gs-staff"
      :class="{ laid: s !== null, bloom: round === 1 && i === aaronIndex, hide: found && i === aaronIndex }"
      :style="{ left: `${pos(i).x}%`, top: `${pos(i).y}%`, width: `${round === 1 && i === aaronIndex ? game.bloomW : game.w}%`, height: `${game.h}%` }"
      :aria-label="i === aaronIndex && round === 1 ? t.aaron : t.staff.replace('{n}', String(s === null ? i + 1 : s + 1)).replace('{total}', String(12))"
      :disabled="night || found"
      @click="tap(i)"
    )
      img(:src="src(imgOf(i))" alt="" draggable="false")
      span(v-if="wrongAt === i" class="gs-mark" aria-hidden="true")
        GameMark(kind="bad")
    button(
      v-if="found"
      type="button"
      class="gs-big"
      :class="{ done: stage >= game.bloom.length - 1 }"
      :style="{ left: `${game.big.x}%`, top: `${game.big.y}%`, width: `${game.big.w}%`, height: `${game.big.h}%` }"
      :aria-label="t.aaron"
      @click="grow"
    )
      img(:src="src(bloomNow)" alt="" draggable="false")
    div(v-if="night" class="gs-night" aria-hidden="true")
</template>

<style scoped lang="sass">
.gs-staff
  position: absolute
  display: block
  min-width: 26px
  padding: 0
  border: 0
  background: transparent
  transform: translate(-50%, -100%)
  cursor: pointer
  z-index: 2
  touch-action: manipulation
  -webkit-tap-highlight-color: transparent
  transition: left 500ms ease-in-out, top 500ms ease-in-out
  filter: drop-shadow(0 3px 2px rgba(40, 25, 5, 0.4))

  img
    display: block
    width: 100%
    height: 100%
    object-fit: contain
    object-position: bottom
    pointer-events: none

  &.hide
    opacity: 0

  &:focus-visible
    outline: 3px solid #fff6dc
    border-radius: 12px

.gs-mark
  position: absolute
  left: 50%
  top: 10%
  margin-left: -15px
  pointer-events: none

.gs-big
  position: absolute
  display: block
  padding: 0
  border: 0
  background: transparent
  transform: translate(-50%, -100%)
  cursor: pointer
  z-index: 4
  touch-action: manipulation
  filter: drop-shadow(0 0 14px rgba(255, 240, 180, 0.9))
  animation: gs-pop 400ms ease-out

  img
    display: block
    width: 100%
    height: 100%
    object-fit: contain
    object-position: bottom
    pointer-events: none

  &:focus-visible
    outline: 3px solid #fff6dc
    border-radius: 12px

.gs-night
  position: absolute
  inset: 0
  z-index: 8
  background: rgba(10, 14, 40, 0.72)
  pointer-events: none
  animation: gs-dark 2200ms ease-in-out

@keyframes gs-pop
  from
    scale: 0.7
    opacity: 0
  to
    scale: 1
    opacity: 1

@keyframes gs-dark
  0%
    opacity: 0
  35%, 65%
    opacity: 1
  100%
    opacity: 0

@media (prefers-reduced-motion: reduce)
  .gs-staff
    transition: none

  .gs-big, .gs-night
    animation: none
</style>
