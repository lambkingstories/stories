<script setup lang="ts">
/**
 * Loose him (John 11,44). Lazarus stands at the entrance of the cave in the morning light; five linen strips lie over him (hands, feet, body, arms, the cloth on the head), each with a loose end
 * (a round sign with an arrow in the direction of the pull). The finger pulls at a loose end and the strip unwinds: it slides along the pull and falls to the ground with a soft rustle. A tap on the end
 * (or Enter) pulls a third of the way, so three taps loose a strip, too. The order is free, but the cloth on the head comes off only when two others are off (a tap on it then only says so).
 * When the last strip is off Lazarus raises his hand (`free` replaces `lazarus`) and Mary runs to him with open arms. Nothing can be wrong: three stars; with "Help" (the loose ends blink) two.
 * The arithmetic is in `utils/zachaeusGames.ts`.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { UNWRAP_PULL, UNWRAP_TAPS, unwrapDir, unwrapOff, unwrapOpen, unwrapPull, unwrapStars } from '@/utils/zachaeusGames'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { UnwrapGame, UnwrapStrip } from '@/types/adventure'

const props = defineProps<{ game: UnwrapGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every strip
progress.setGoal(props.game.strips.length)

/** The height of the scene divided by its width (3 : 2): a percent of the width is 1.5 percent of the height. */
const ASPECT = 2 / 3
const pulled = ref<Record<number, number>>({})
const removed = ref<number[]>([])
const falling = ref<number[]>([])
const wiggle = ref<{ id: number; n: number } | null>(null)
const freed = ref(false)
/** Mary has run to Lazarus (she appears at `from` and runs to her place). */
const mariaHere = ref(false)
const helped = ref(false)
const helping = ref(false)
const finished = ref(false)
const message = ref('')
let messageSeq = 0
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => unwrapStars(helped.value))
const field = ref<HTMLElement | null>(null)
const left = computed(() => props.game.strips.filter((s) => !removed.value.includes(s.id) || falling.value.includes(s.id)))
const isOpen = (s: UnwrapStrip) => unwrapOpen(s, removed.value.length)
const pullOf = (s: UnwrapStrip) => pulled.value[s.id] ?? 0

function say(text: string, ms = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}

/** Where a strip lies now: its place moved along the pull (a falling strip goes on and drops). */
function offset(s: UnwrapStrip): { x: number; y: number } {
  const [ux, uy] = unwrapDir(s.dir)
  const p = falling.value.includes(s.id) ? UNWRAP_PULL * 1.6 : pullOf(s)
  return { x: ux * p, y: (uy * p) / ASPECT + (falling.value.includes(s.id) ? 14 : 0) }
}
const stripStyle = (s: UnwrapStrip) => {
  const o = offset(s)
  return { left: `${s.x + o.x}%`, top: `${s.y + o.y}%`, width: `${s.w}%` }
}
const endStyle = (s: UnwrapStrip) => {
  const o = offset(s)
  return { left: `${s.end[0] + o.x}%`, top: `${s.end[1] + o.y}%` }
}
const arrowTurn = (s: UnwrapStrip) => {
  const [ux, uy] = unwrapDir(s.dir)
  return (Math.atan2(uy, ux) * 180) / Math.PI
}
const lazarusStyle = computed(() => ({ left: `${props.game.lazarus.x}%`, top: `${props.game.lazarus.y}%`, width: `${freed.value ? props.game.free.w : props.game.lazarus.w}%` }))
const mariaStyle = computed(() => ({ left: `${mariaHere.value ? props.game.maria.x : props.game.maria.from}%`, top: `${props.game.maria.y}%`, width: `${props.game.maria.w}%` }))

function locked(s: UnwrapStrip): boolean {
  if (isOpen(s)) return false
  wiggle.value = { id: s.id, n: (wiggle.value?.n ?? 0) + 1 }
  const n = (s.needs ?? 0) - removed.value.length
  say(t(n === 1 ? 'app.adventure.unwrapWait1' : 'app.adventure.unwrapWait', { n }))
  return true
}

/** The strip is pulled to `amount`; when it is far enough it comes off. */
function pullTo(s: UnwrapStrip, amount: number) {
  if (removed.value.includes(s.id) || freed.value) return
  const p = Math.min(UNWRAP_PULL, Math.max(pullOf(s), amount))
  pulled.value = { ...pulled.value, [s.id]: p }
  if (!unwrapOff(p)) return
  removed.value = [...removed.value, s.id]
  falling.value = [...falling.value, s.id]
  progress.mark()
  play('flip')
  say(t('app.adventure.unwrapOff', { name: s.label }), 1800)
  later(() => (falling.value = falling.value.filter((x) => x !== s.id)), 650)
  if (removed.value.length >= props.game.strips.length) {
    later(() => {
      freed.value = true
      helping.value = false
      play('right')
      say(t('app.adventure.unwrapFree'), 0)
      later(() => (mariaHere.value = true), 60)
    }, 700)
    later(() => {
      play('star')
      finished.value = true
    }, 3200)
  }
}

// ---- pulling with the finger: the movement along the direction of the strip
let drag: { s: UnwrapStrip; x: number; y: number; base: number; moved: boolean } | null = null
let skipClick = false
function onMove(e: PointerEvent) {
  if (!drag || !field.value) return
  const box = field.value.getBoundingClientRect()
  if (box.width <= 0 || box.height <= 0) return
  const dx = ((e.clientX - drag.x) / box.width) * 100
  const dy = ((e.clientY - drag.y) / box.height) * 100
  if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 8) drag.moved = true
  if (drag.moved) pullTo(drag.s, drag.base + unwrapPull(dx, dy, drag.s.dir))
}
function stopDrag() {
  if (drag?.moved) skipClick = true
  drag = null
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', stopDrag)
  window.removeEventListener('pointercancel', stopDrag)
}
function down(e: PointerEvent, s: UnwrapStrip) {
  if (e.button > 0 || freed.value) return
  e.preventDefault()
  skipClick = false
  if (!isOpen(s)) return
  drag = { s, x: e.clientX, y: e.clientY, base: pullOf(s), moved: false }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', stopDrag)
  window.addEventListener('pointercancel', stopDrag)
}
onBeforeUnmount(stopDrag)

/** A tap (or Enter) on a loose end pulls a third of the way. */
function tapEnd(s: UnwrapStrip) {
  if (skipClick) {
    skipClick = false
    return
  }
  if (freed.value || removed.value.includes(s.id) || locked(s)) return
  play('tap')
  pullTo(s, pullOf(s) + UNWRAP_PULL / UNWRAP_TAPS + 1e-6)
}

function help() {
  if (freed.value) return
  helped.value = true
  helping.value = true
  say(t('app.adventure.unwrapHelpHint'), 4000)
  later(() => (helping.value = false), 4000)
}
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(class="gm-hint") {{ game.hint }}
      div(
        ref="field"
        class="gm-field"
        :style="{ backgroundImage: `url(${src(game.scene)})` }"
        role="group"
        :aria-label="t('app.adventure.unwrapField')"
      )
        div(class="gm-figure" :style="lazarusStyle" role="img" :aria-label="freed ? game.free.label : game.lazarus.label")
          GameImage(:src="freed ? game.free.image : game.lazarus.image" :ratio="0.42" colour="#c8b48e" :label="freed ? game.free.label : game.lazarus.label")
          span(v-if="freed" class="gm-mark" aria-hidden="true")
            GameMark(kind="good")
        div(v-if="freed" class="gm-figure gm-maria" :style="mariaStyle" role="img" :aria-label="game.maria.label")
          GameImage(:src="game.maria.image" :ratio="0.5" colour="#5d7fa8" :label="game.maria.label")
        template(v-for="s in left" :key="s.id")
          span(
            class="gm-strip"
            :class="{ fall: falling.includes(s.id), wiggle: wiggle && wiggle.id === s.id }"
            :style="stripStyle(s)"
            aria-hidden="true"
          )
            span(:key="wiggle && wiggle.id === s.id ? wiggle.n : 0" class="gm-strip-in")
              GameImage(:src="s.image" :ratio="1.6" colour="#f4efe2" :label="s.label")
          button(
            v-if="!removed.includes(s.id)"
            type="button"
            class="gm-end"
            :class="{ shut: !isOpen(s), blink: helping && isOpen(s) }"
            :style="endStyle(s)"
            :aria-label="isOpen(s) ? t('app.adventure.unwrapEnd', { name: s.label }) : t('app.adventure.unwrapEndShut', { name: s.label })"
            @pointerdown="down($event, s)"
            @click="tapEnd(s)"
          )
            span(v-if="isOpen(s)" class="gm-pull" aria-hidden="true" :style="{ transform: `rotate(${arrowTurn(s)}deg)` }") →
            span(v-else class="gm-pull" aria-hidden="true") ·
      div(class="gm-tools")
        AdvButton(tone="blau" small :disabled="freed" @click="help") {{ t('app.adventure.unwrapHelp') }}
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.unwrapCount', { n: removed.length, total: game.strips.length }) }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.unwrapDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #efe1bb
  box-shadow: inset 0 0 18px rgba(90, 60, 20, 0.25)
  user-select: none
  -webkit-user-select: none

.gm-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #5f4f35

.gm-field
  position: relative
  width: 100%
  aspect-ratio: 3 / 2
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #b9a77a
  background-size: cover
  background-position: center
  touch-action: none

// Lazarus and Mary stand on their lower edge
.gm-figure
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none
  z-index: 1
  filter: drop-shadow(0 3px 3px rgba(40, 25, 5, 0.4))

.gm-maria
  z-index: 2
  transition: left 1100ms ease-out
  animation: gm-run 900ms ease-out both

.gm-strip
  position: absolute
  display: block
  transform: translate(-50%, -50%)
  pointer-events: none
  z-index: 3
  transition: left 120ms linear, top 120ms linear
  filter: drop-shadow(0 1px 1px rgba(40, 25, 5, 0.35))

  &.fall
    transition: left 600ms ease-in, top 600ms ease-in, opacity 600ms ease-in
    opacity: 0

.gm-strip-in
  display: block

.gm-strip.wiggle .gm-strip-in
  animation: gm-wiggle 380ms ease-in-out

// the loose end: a round sign (at least 44 pixels) with an arrow in the direction of the pull
.gm-end
  position: absolute
  display: flex
  align-items: center
  justify-content: center
  width: 46px
  height: 46px
  padding: 0
  transform: translate(-50%, -50%)
  border-radius: 50%
  border: 2px dashed #5f4f35
  background: rgba(255, 250, 235, 0.88)
  color: #3f321b
  font-weight: 900
  font-size: 1.3rem
  cursor: grab
  z-index: 4
  touch-action: none
  -webkit-tap-highlight-color: transparent
  transition: left 120ms linear, top 120ms linear

  &.shut
    border-style: dotted
    opacity: 0.6
    cursor: default

  &.blink
    animation: gm-blink 600ms ease-in-out infinite

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

.gm-pull
  display: block
  line-height: 1

.gm-mark
  position: absolute
  right: -6px
  top: -10px
  z-index: 6
  pointer-events: none

.gm-tools
  display: flex
  justify-content: center

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

@keyframes gm-wiggle
  0%, 100%
    rotate: 0deg
  30%
    rotate: -6deg
  65%
    rotate: 5deg

@keyframes gm-blink
  0%, 100%
    scale: 1
    box-shadow: 0 0 0 0 rgba(255, 246, 220, 0)
  50%
    scale: 1.18
    box-shadow: 0 0 0 6px rgba(255, 246, 220, 0.8)

@keyframes gm-run
  from
    opacity: 0.4
  to
    opacity: 1

// less motion: nothing wiggles, blinks or glides
@media (prefers-reduced-motion: reduce)
  .gm-strip.wiggle .gm-strip-in, .gm-end.blink, .gm-maria
    animation: none

  .gm-strip, .gm-strip.fall, .gm-end, .gm-maria
    transition: none
</style>
