<script setup lang="ts">
/**
 * Build the throne: Solomon's throne of ivory and gold stands in the hall with its six steps still empty (a painted picture). Under the picture the golden lions wait in a row; each looks to the left or to the right.
 * The child drags a lion (or taps it and then taps a slot) to the step: on every step stands one lion on the left of the throne and one on the right, and they look toward the middle, so a lion that looks to the
 * right belongs on the left, and the other way round. A lion on the wrong side or on a slot that is taken springs back (a cross, a mistake); letting go beside the slots is no mistake. Round 1 the three lower steps,
 * round 2 the three upper steps, round 3 the two lions at the armrests: twelve and two. When the throne is built the child hears how many lions stand on it. The arithmetic is in `utils/salomoGames.ts`.
 */
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { placeLion, slotAt, type ThroneSide } from '@/utils/salomoGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { ThroneGame } from '@/types/adventure'

const props = defineProps<{ game: ThroneGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every lion
progress.setGoal(props.game.rounds.reduce((n, r) => n + r.slots.length, 0))

const round = ref(0)
const wrapEl = ref<HTMLElement | null>(null)
const fieldEl = ref<HTMLElement | null>(null)
/** For each slot of the round the lion that stands on it (-1 = empty). */
const taken = ref<number[]>(props.game.rounds[0]!.slots.map(() => -1))
const selected = ref(-1)
const drag = reactive<{ lion: number; x: number; y: number; moved: number }>({ lion: -1, x: 0, y: 0, moved: 0 })
const downAt = ref({ x: 0, y: 0 })
const crossAt = ref<{ x: number; y: number } | null>(null)
const bounce = ref(-1)
const misses = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const src = (p: string) => prependBaseUrl(p)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const stars = computed(() => mistakeStars(misses.value, 2, 5))
/** Every lion that stands on the throne: place, width and the way it looks (the lions of the finished rounds stay). */
const stack = ref<{ x: number; y: number; w: number; facing: ThroneSide }[]>([])
const lionsOnThrone = computed(() => stack.value.length)

function lionUsed(i: number): boolean {
  return taken.value.includes(i)
}
function toPercent(e: { clientX: number; clientY: number }): { x: number; y: number } | null {
  const r = fieldEl.value?.getBoundingClientRect()
  if (!r || r.width <= 0 || r.height <= 0) return null
  return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }
}

function down(e: PointerEvent, i: number) {
  if (between.value || finished.value || lionUsed(i)) return
  const p = toPercent(e)
  if (!p) return
  message.value = ''
  drag.lion = i
  drag.x = p.x
  drag.y = p.y
  drag.moved = 0
  downAt.value = { x: e.clientX, y: e.clientY }
  ;(wrapEl.value as HTMLElement | null)?.setPointerCapture?.(e.pointerId)
}
function move(e: PointerEvent) {
  if (drag.lion < 0) return
  const p = toPercent(e)
  if (!p) return
  drag.x = p.x
  drag.y = p.y
  drag.moved = Math.max(drag.moved, Math.hypot(e.clientX - downAt.value.x, e.clientY - downAt.value.y))
}
function up(e: PointerEvent) {
  if (drag.lion < 0) return
  const i = drag.lion
  const moved = drag.moved
  drag.lion = -1
  if (moved < 8) {
    // a tap: the lion is picked up, the next tap on a slot puts it down
    selected.value = selected.value === i ? -1 : i
    return
  }
  const p = toPercent(e)
  if (p) put(i, slotAt(p, current.value.slots), p)
}

function tapSlot(s: number) {
  if (selected.value < 0 || between.value || finished.value) return
  const c = current.value.slots[s]!
  put(selected.value, s, { x: c.x, y: c.y })
}
/** A tap on the picture puts the picked-up lion on the nearest free slot (the circles of neighbouring steps overlap on a small screen, so the finger decides, not the topmost circle). */
function fieldClick(e: MouseEvent) {
  if (e.detail === 0 || selected.value < 0 || between.value || finished.value) return
  const p = toPercent(e)
  if (!p) return
  const free = current.value.slots.map((s, i) => ({ ...s, i })).filter((s) => taken.value[s.i]! < 0)
  const k = slotAt(p, free)
  if (k >= 0) tapSlot(free[k]!.i)
}

function put(lion: number, slot: number, at: { x: number; y: number }) {
  if (slot < 0) {
    selected.value = -1
    return
  }
  const facing: ThroneSide = current.value.lions[lion]!
  const s = current.value.slots[slot]!
  const r = placeLion(facing, s.side, taken.value[slot]! >= 0)
  selected.value = -1
  if (r !== 'ok') {
    misses.value++
    play('wrong')
    message.value = r === 'full' ? t('app.adventure.throneFull') : t('app.adventure.throneSide')
    crossAt.value = { x: s.x, y: s.y }
    bounce.value = lion
    later(() => {
      crossAt.value = null
      bounce.value = -1
    }, 900)
    return
  }
  taken.value[slot] = lion
  stack.value.push({ x: s.x, y: s.y, w: s.w, facing })
  progress.mark()
  play('snap')
  message.value = ''
  if (taken.value.every((x) => x >= 0)) endRound()
}

function endRound() {
  between.value = true
  if (lastRound.value) {
    message.value = t('app.adventure.throneCount', { n: props.game.rounds.reduce((n, r) => n + r.slots.length, 0) })
    later(() => {
      play('star')
      finished.value = true
    }, 2200)
    return
  }
  message.value = t('app.adventure.throneStepsDone')
  later(() => {
    round.value++
    taken.value = current.value.slots.map(() => -1)
    selected.value = -1
    between.value = false
    message.value = ''
  }, 1900)
}

</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(ref="wrapEl" class="gm-wrap" @pointermove="move" @pointerup="up" @pointercancel="up" @contextmenu.prevent)
        div(
          ref="fieldEl"
          class="gm-field"
          :style="{ backgroundImage: `url(${src(game.background)})` }"
          role="img"
          :aria-label="t('app.adventure.throneHall')"
          @click="fieldClick"
        )
          //- the lions that stand on the throne
          img(v-for="(d, di) in stack" :key="`d${di}`" class="gm-lion done" :class="{ flip: d.facing === 'right' }" :src="src(game.lion)" alt="" :style="{ left: `${d.x}%`, top: `${d.y}%`, width: `${d.w}%`, zIndex: Math.round(d.y) }")
          //- the free slots of this round
          template(v-for="(s, si) in current.slots" :key="`s${si}`")
            button(
              v-if="taken[si] < 0"
              type="button"
              class="gm-slot"
              :class="{ hint: selected >= 0 }"
              :style="{ left: `${s.x}%`, top: `${s.y}%`, width: `${s.w}%` }"
              :aria-label="t('app.adventure.throneSlot', { n: si + 1 })"
              @click="tapSlot(si)"
            )
          span(v-if="crossAt" class="gm-cross" :style="{ left: `${crossAt.x}%`, top: `${crossAt.y}%` }" aria-hidden="true")
            GameMark(kind="bad")
        //- the waiting lions
        div(class="gm-tray")
          button(
            v-for="(f, li) in current.lions"
            :key="`l${li}`"
            type="button"
            class="gm-wait"
            :class="{ gone: lionUsed(li), sel: selected === li, held: drag.lion === li, bounce: bounce === li }"
            :aria-label="t(f === 'right' ? 'app.adventure.throneLionRight' : 'app.adventure.throneLionLeft')"
            :disabled="lionUsed(li)"
            @pointerdown.prevent="down($event, li)"
          )
            img(:src="src(game.lion)" alt="" draggable="false" :class="{ flip: f === 'right' }")
        //- the lion in the hand
        img(v-if="drag.lion >= 0 && drag.moved >= 8" class="gm-ghost" :class="{ flip: current.lions[drag.lion] === 'right' }" :src="src(game.lion)" alt="" :style="{ left: `${drag.x}%`, top: `${drag.y}%`, width: `${game.lionW}%` }")
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.throneOn', { n: lionsOnThrone }) }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.throneDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e7d9b4
  box-shadow: inset 0 0 18px rgba(90, 60, 20, 0.25)
  user-select: none
  -webkit-user-select: none
  touch-action: none

.gm-round
  margin: 0
  align-self: center
  padding: 1px 12px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.92)
  font-weight: 800
  font-size: 1rem
  letter-spacing: 0.06em
  text-transform: uppercase
  color: #5f4f35

.gm-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #5f4f35

.gm-wrap
  position: relative
  display: flex
  flex-direction: column
  gap: 8px
  touch-action: none

.gm-field
  position: relative
  width: 100%
  aspect-ratio: 4 / 3
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #6a5a48
  background-size: cover
  background-position: center

.gm-slot
  position: absolute
  display: block
  aspect-ratio: 1 / 1
  min-width: 44px
  min-height: 44px
  padding: 0
  transform: translate(-50%, -50%)
  border: 3px dashed rgba(255, 233, 150, 0.95)
  border-radius: 50%
  background: rgba(255, 233, 150, 0.14)
  box-shadow: 0 0 10px rgba(255, 220, 110, 0.7)
  cursor: pointer
  pointer-events: none
  z-index: 90

  &.hint
    background: rgba(255, 233, 150, 0.34)

  &.taken
    border-style: solid
    background: transparent
    box-shadow: none
    cursor: default

.gm-lion
  display: block
  width: 100%
  height: auto
  pointer-events: none

  &.done
    position: absolute
    transform: translate(-50%, -50%)

  &.flip
    transform: scaleX(-1)

  &.done.flip
    transform: translate(-50%, -50%) scaleX(-1)

.gm-tray
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 8px
  min-height: 70px

.gm-wait
  width: 70px
  height: 70px
  padding: 4px
  border: 3px solid #d4a83e
  border-radius: 14px
  background: rgba(255, 246, 220, 0.94)
  cursor: grab
  touch-action: none
  transition: opacity 200ms ease, transform 200ms ease

  img
    display: block
    width: 100%
    height: 100%
    object-fit: contain
    pointer-events: none

  img.flip
    transform: scaleX(-1)

  &.gone
    opacity: 0.18
    cursor: default

  &.sel
    border-color: #2f7bd6
    transform: scale(1.1)
    box-shadow: 0 0 0 3px rgba(47, 123, 214, 0.35)

  &.held
    opacity: 0.45

  &.bounce
    animation: gm-bounce 500ms ease

.gm-ghost
  position: absolute
  display: block
  height: auto
  transform: translate(-50%, -50%)
  pointer-events: none
  z-index: 9
  filter: drop-shadow(0 6px 6px rgba(40, 25, 5, 0.45))

  &.flip
    transform: translate(-50%, -50%) scaleX(-1)

.gm-cross
  position: absolute
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 8

.gm-count
  margin: 0
  align-self: center
  padding: 2px 14px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  color: #5f4f35

.gm-fb
  margin: 0
  min-height: 1.4em
  text-align: center
  font-weight: 800
  color: #3f321b
  align-self: center
  padding: 4px 14px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.94)

  &:empty
    display: none

@keyframes gm-bounce
  0%, 100%
    transform: translateY(0)
  30%
    transform: translateY(-8px)
  60%
    transform: translateY(2px)

@media (prefers-reduced-motion: reduce)
  .gm-wait
    transition: none
    &.bounce
      animation: none
</style>
