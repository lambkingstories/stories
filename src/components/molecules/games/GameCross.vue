<script setup lang="ts">
/**
 * Through the Jordan: the river lies high and calm, on the left bank the priests stand with the golden chest of the covenant. Round 1: the child pulls the chest with a finger into the middle of the river (a tap
 * on the chest moves it a quarter of the way, the right arrow key and Enter push it, too). The further it comes the drier the river bed gets behind it (a light strip grows); in the middle the chest clicks into
 * place and a tick shines. Round 2: three groups of the people wait on the bank; each tap sends one group over the dry bed to the other bank (Enter sends the next one). Nothing can go wrong and there is no
 * clock, so the end always gives three stars. With reduced motion the chest and the groups jump instead of gliding. The places are percent of the picture; the way of the chest and the groups is `crossAt`
 * in `utils/josuaGames.ts`.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameImage from '@/components/atoms/GameImage.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { crossAt, crossShare, groupLanding } from '@/utils/josuaGames'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { CrossGame } from '@/types/adventure'

const props = defineProps<{ game: CrossGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: the chest into the middle, then every group over
progress.setGoal(1 + props.game.groups.length)

/** How far (share of the way) a tap on the chest or a key moves it, and how near to the middle the chest clicks into place. */
const TAP_STEP = 0.25
const SNAP = 0.92
const still = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const round = ref(0)
const hint = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]?.hint ?? '')
const share = ref(0)
const chestIn = ref(false)
const sent = ref<number[]>([])
const finished = ref(false)
const message = ref('')
const field = ref<HTMLElement | null>(null)
const dragging = ref(false)
const src = (p: string) => prependBaseUrl(p)

const chestPos = computed(() => crossAt(props.game.start, props.game.middle, share.value))
/** The light strip of the dry river bed: from the left bank to the chest, later all the way to the far bank. */
const dryStyle = computed(() => {
  const left = props.game.start[0]
  const to = round.value === 0 ? chestPos.value.x : props.game.farBank[0]
  return { left: `${left}%`, width: `${Math.max(0, to - left)}%`, top: `${props.game.middle[1] - 7}%` }
})
const chestStyle = computed(() => ({ left: `${chestPos.value.x}%`, top: `${chestPos.value.y}%` }))
const groupStyle = (i: number) => {
  const p = sent.value.includes(i) ? groupLanding(props.game.farBank, i) : { x: props.game.groups[i]![0], y: props.game.groups[i]![1] }
  return { left: `${p.x}%`, top: `${p.y}%` }
}
const count = computed(() => (chestIn.value ? 1 : 0) + sent.value.length)

function setShare(s: number) {
  if (chestIn.value) return
  share.value = Math.min(1, Math.max(0, s))
  if (share.value >= SNAP) arrive()
}

function arrive() {
  if (chestIn.value) return
  share.value = 1
  chestIn.value = true
  dragging.value = false
  progress.mark()
  play('found')
  message.value = t('app.adventure.crossChest')
  later(() => {
    round.value = 1
    message.value = ''
  }, 1700)
}

function fromPointer(e: PointerEvent) {
  const r = field.value?.getBoundingClientRect()
  if (!r || !r.width) return
  const x = ((e.clientX - r.left) / r.width) * 100
  setShare(crossShare(props.game.start, props.game.middle, x))
}
let moved = false
function pointerMove(e: PointerEvent) {
  if (!dragging.value) return
  moved = true
  fromPointer(e)
}
function stopDrag() {
  const wasDragging = dragging.value
  dragging.value = false
  window.removeEventListener('pointermove', pointerMove)
  window.removeEventListener('pointerup', stopDrag)
  window.removeEventListener('pointercancel', stopDrag)
  // a tap without moving pushes the chest a step
  if (wasDragging && !moved && !chestIn.value) setShare(share.value + TAP_STEP)
}
function chestDown(e: PointerEvent) {
  if (round.value !== 0 || chestIn.value || e.button > 0) return
  dragging.value = true
  moved = false
  window.addEventListener('pointermove', pointerMove)
  window.addEventListener('pointerup', stopDrag)
  window.addEventListener('pointercancel', stopDrag)
}
onBeforeUnmount(stopDrag)

function send(i: number) {
  if (round.value !== 1 || finished.value || sent.value.includes(i)) return
  sent.value = [...sent.value, i]
  progress.mark()
  play('snap')
  if (sent.value.length < props.game.groups.length) {
    message.value = t('app.adventure.crossGroup')
    return
  }
  message.value = t('app.adventure.crossAll')
  later(() => {
    finished.value = true
    play('star')
  }, 1800)
}

function key(e: KeyboardEvent) {
  if (round.value === 0 && (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault()
    setShare(share.value + TAP_STEP)
  } else if (round.value === 1 && e.key === 'Enter') {
    e.preventDefault()
    const next = props.game.groups.findIndex((_, i) => !sent.value.includes(i))
    if (next >= 0) send(next)
  }
}
</script>

<template lang="pug">
  div(class="cr" tabindex="-1" @keydown="key")
    template(v-if="!finished")
      p(class="cr-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="cr-hint") {{ hint }}
      div(ref="field" class="cr-field" role="group" :aria-label="t('app.adventure.crossField', { n: count, total: 1 + game.groups.length })" :style="{ backgroundImage: `url(${src(game.background)})` }")
        span(class="cr-dry" :style="dryStyle" aria-hidden="true")
        button(
          v-if="round === 0 || chestIn"
          type="button"
          class="cr-chest"
          :class="{ held: dragging, still, in: chestIn }"
          :style="chestStyle"
          :disabled="round !== 0 || chestIn"
          :aria-label="t('app.adventure.crossChestLabel')"
          @pointerdown.prevent="chestDown"
        )
          GameImage(:src="game.chest" :ratio="1.2" colour="#d4a83e")
        button(
          v-for="(g, i) in game.groups"
          :key="`g-${i}`"
          type="button"
          class="cr-group"
          :class="{ gone: sent.includes(i), still }"
          :style="groupStyle(i)"
          :disabled="round !== 1 || sent.includes(i)"
          :aria-label="t(sent.includes(i) ? 'app.adventure.crossGroupOver' : 'app.adventure.crossGroupLabel', { n: i + 1 })"
          @click="send(i)"
        )
          GameImage(:src="game.group" :ratio="1.3" colour="#b08a5a")
      p(class="cr-fb" role="status") {{ message }}
      p(class="cr-count") {{ t('app.adventure.crossCount', { n: count, total: 1 + game.groups.length }) }}
    GameDone(v-else :stars="3" :text="t('app.adventure.crossDone')" @next="emit('done', 3)")
</template>

<style scoped lang="sass">
.cr
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e6dcb4
  box-shadow: inset 0 0 18px rgba(80, 50, 10, 0.25)
  outline: none

.cr-round
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

.cr-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.92)

.cr-field
  position: relative
  width: 100%
  aspect-ratio: 4 / 3
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #8fb4c9
  background-size: cover
  background-position: center
  touch-action: none

// the dry river bed behind the chest
.cr-dry
  position: absolute
  display: block
  height: 14%
  border-radius: 999px
  background: rgba(238, 218, 168, 0.8)
  box-shadow: 0 0 14px 4px rgba(238, 218, 168, 0.6)
  transition: width 120ms linear
  pointer-events: none

.cr-chest
  position: absolute
  width: 16%
  padding: 0
  border: 0
  background: transparent
  transform: translate(-50%, -80%)
  cursor: grab
  touch-action: none
  z-index: 3
  -webkit-tap-highlight-color: transparent
  transition: left 120ms linear, top 120ms linear

  &.held
    cursor: grabbing
    filter: drop-shadow(0 0 10px rgba(255, 224, 120, 1))

  &.in
    filter: drop-shadow(0 0 14px rgba(255, 224, 120, 1))

  &.still
    transition: none

  &:disabled
    cursor: default

.cr-group
  position: absolute
  width: 15%
  min-height: 44px
  padding: 0
  border: 0
  background: transparent
  transform: translate(-50%, -100%)
  cursor: pointer
  z-index: 2
  -webkit-tap-highlight-color: transparent
  transition: left 1.2s ease-in-out, top 1.2s ease-in-out

  &.still
    transition: none

  &:disabled
    cursor: default

  &:not(.gone):not(:disabled)
    filter: drop-shadow(0 0 8px rgba(255, 224, 120, 0.95))

.cr-fb
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

.cr-count
  margin: 0
  text-align: center
  font-weight: 800
  color: #5f4f35
</style>
