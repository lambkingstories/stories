<script setup lang="ts">
/**
 * Crank the well: at a stone well a crank sits at the side, a bucket hangs on a rope in the deep. The child puts a finger on the crank and circles (in either direction;
 * the first direction draws the bucket up, turning back lets it down again, nothing is lost). The crank turns, the bucket rises out of the deep, and at the top it pours
 * itself into the trough; the sheep drink. Three turns make a bucket. Round 1: one bucket; round 2: three buckets, and the trough fills bit by bit. There are no mistakes and no
 * clock. For everybody who cannot circle there is the button "Crank" (every tap turns a part), and Enter or space on the crank does the same. The arithmetic is in `utils/jakobGames.ts`.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { angleOf, bucketLevel, crank, crankStep, FULL, grab, release, startCrank, type CrankState } from '@/utils/jakobGames'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { CrankGame } from '@/types/adventure'

const props = defineProps<{ game: CrankGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every bucket of every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.buckets, 0))

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)

const state = ref<CrankState>(startCrank())
/** How many buckets of this round have been poured into the trough. */
const poured = ref(0)
const pouring = ref(false)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const stars = 3
const src = (p: string) => prependBaseUrl(p)

const level = computed(() => bucketLevel(state.value))
/** The crank turns the way the finger turns; the picture keeps what has been turned. */
const rotation = computed(() => (state.value.dir || 1) * state.value.turned)
const bucketStyle = computed(() => {
  const [x, up, down] = props.game.bucketAt
  return { left: `${x}%`, top: `${down + (up - down) * level.value}%` }
})
const crankStyle = computed(() => ({ left: `${props.game.crankAt[0]}%`, top: `${props.game.crankAt[1]}%` }))
const troughStyle = computed(() => ({ left: `${props.game.troughAt[0]}%`, top: `${props.game.troughAt[1]}%`, width: `${props.game.troughAt[2]}%` }))
const troughLevel = computed(() => Math.min(1, poured.value / Math.max(1, current.value.buckets)))

const crankEl = ref<HTMLElement | null>(null)
function fingerAngle(e: PointerEvent): number {
  const box = crankEl.value?.getBoundingClientRect()
  const cx = box ? box.left + box.width / 2 : 0
  const cy = box ? box.top + box.height / 2 : 0
  return angleOf({ x: cx, y: cy }, { x: e.clientX, y: e.clientY })
}

function down(e: PointerEvent) {
  if (e.button > 0 || pouring.value || between.value || finished.value) return
  state.value = grab(state.value, fingerAngle(e))
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', up)
  window.addEventListener('pointercancel', up)
}
function move(e: PointerEvent) {
  if (state.value.last === null || pouring.value) return
  state.value = crank(state.value, fingerAngle(e))
  full()
}
function up() {
  state.value = release(state.value)
  window.removeEventListener('pointermove', move)
  window.removeEventListener('pointerup', up)
  window.removeEventListener('pointercancel', up)
}
onBeforeUnmount(up)

/** A step without circling: the button, or Enter and space on the crank. */
function step() {
  if (pouring.value || between.value || finished.value) return
  state.value = crankStep(state.value)
  play('tap')
  full()
}
function onCrankClick(e: MouseEvent) {
  // a click from the keyboard (Enter, space) turns a step; a finger that only taps does not
  if (e.detail === 0) step()
}

/** The bucket is all the way up: it tips into the trough. */
function full() {
  if (state.value.turned < FULL || pouring.value) return
  pouring.value = true
  up()
  play('sack')
  message.value = t('app.adventure.crankPour')
  later(() => {
    poured.value++
    progress.mark()
    play('snap')
    state.value = startCrank()
    pouring.value = false
    message.value = ''
    if (poured.value >= current.value.buckets) roundOver()
  }, 900)
}

function roundOver() {
  if (lastRound.value) {
    later(() => {
      finished.value = true
      play('star')
    }, 900)
    return
  }
  between.value = true
  message.value = t('app.adventure.gameNext')
  later(() => {
    round.value++
    poured.value = 0
    state.value = startCrank()
    between.value = false
    message.value = ''
  }, 1500)
}
</script>

<template lang="pug">
  div(class="cr")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="cr-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="cr-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      div(class="cr-field" role="group" :aria-label="t('app.adventure.crankField')" :style="{ backgroundImage: `url(${src(game.background)})` }")
        div(class="cr-trough" :style="troughStyle" role="img" :aria-label="t('app.adventure.crankTrough', { n: poured, total: current.buckets })")
          img(:src="src(game.troughEmpty)" alt="" draggable="false")
          img(:src="src(game.troughFull)" alt="" draggable="false" class="cr-water" :style="{ opacity: String(troughLevel) }")
        img(:src="src(game.bucket)" alt="" draggable="false" class="cr-bucket" :class="{ pouring }" :style="bucketStyle")
        button(
          ref="crankEl"
          type="button"
          class="cr-crank"
          :style="crankStyle"
          :aria-label="t('app.adventure.crankHandle')"
          @pointerdown.prevent="down"
          @click="onCrankClick"
        )
          img(:src="src(game.crank)" alt="" draggable="false" :style="{ transform: `rotate(${rotation}deg)` }")
      p(class="cr-fb" role="status") {{ message }}
      div(class="cr-actions")
        AdvButton(tone="blau" small :disabled="pouring || between" @click="step") {{ t('app.adventure.crankButton') }}
      p(class="cr-count") {{ t('app.adventure.crankCount', { n: poured, total: current.buckets }) }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.crankDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.cr
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #ecdcb6
  box-shadow: inset 0 0 18px rgba(80, 50, 10, 0.25)

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
  aspect-ratio: 3 / 2
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #cdb98e
  background-size: cover
  background-position: center
  user-select: none
  -webkit-user-select: none

.cr-crank
  position: absolute
  width: 18%
  aspect-ratio: 1
  min-width: 44px
  padding: 0
  border: 0
  border-radius: 50%
  background: transparent
  transform: translate(-50%, -50%)
  cursor: grab
  touch-action: none
  -webkit-tap-highlight-color: transparent

  img
    display: block
    width: 100%
    height: 100%
    pointer-events: none
    filter: drop-shadow(0 3px 3px rgba(60, 40, 10, 0.5))

  &:focus-visible
    outline: 3px solid rgba(255, 255, 255, 0.95)

// the bucket hangs on its rope: its middle is at the place of the data
.cr-bucket
  position: absolute
  width: 12%
  height: auto
  transform: translate(-50%, -50%)
  pointer-events: none
  filter: drop-shadow(0 3px 3px rgba(40, 30, 10, 0.5))

  &.pouring
    animation: cr-tip 900ms ease-in-out

.cr-trough
  position: absolute
  transform: translate(-50%, -50%)
  pointer-events: none

  img
    display: block
    width: 100%
    height: auto

  .cr-water
    position: absolute
    left: 0
    top: 0
    transition: opacity 700ms ease-out

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

.cr-actions
  display: flex
  justify-content: center

.cr-count
  margin: 0
  text-align: center
  font-weight: 800
  color: #5f4f35

@keyframes cr-tip
  0%, 100%
    transform: translate(-50%, -50%) rotate(0deg)
  50%
    transform: translate(-50%, -50%) rotate(-25deg)

@media (prefers-reduced-motion: reduce)
  .cr-bucket.pouring
    animation: none

  .cr-trough .cr-water
    transition: none
</style>
