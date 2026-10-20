<script setup lang="ts">
/**
 * On Gideon's sign: in the dark valley round the camp stand the three hundred in three groups, each with jars in their hands; Gideon stands in front. Above them hangs a horn that is still dark.
 * The child waits (two to five seconds, every time different). Then the horn lights up and sounds. First the child taps Gideon's jar (it breaks, the torch glows), then the group on the left and the group on
 * the right in any order (their jars break, their arc of light shines). When the ring is closed the valley shines. After the horn there is no hurry. A tap before the horn, or on anything while the child
 * should wait, makes the men say "pst" (the jars wobble, a cross, a dull sound, a mistake), and the waiting begins anew. In round 2 false signals come while the child waits (an owl calls, a gust sweeps through
 * the grass) with another picture and another sound: they must not be answered. The horn is a picture, too, for children who do not hear. The order is `cuePhase`, the waiting time `waitTime`, in
 * `utils/gideonGames.ts`.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { cuePhase, waitTime, type CueState } from '@/utils/gideonGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { CueGame } from '@/types/adventure'

const props = defineProps<{ game: CueGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every signal of every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.signals, 0))

/** How long a false signal shows (ms), the part of the waiting time after which it comes, and how long the ring shines before the next signal. */
const DECOY_MS = 1400
const DECOY_AT = 0.4
const SHINE_MS = 1700

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)
const groupIds = computed(() => props.game.groups.map((g) => g.id))
const cue = ref<CueState>({ step: 'wait', done: [] })
const signalNo = ref(0)
const decoy = ref<'owl' | 'wind' | null>(null)
const decoyDone = ref<number[]>([])
const mistakes = ref(0)
const between = ref(false)
const finished = ref(false)
const pst = ref(false)
const message = ref('')
const flash = ref<'bad' | null>(null)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => mistakeStars(mistakes.value, 2, 5))

let attempts = 0
let hornTimer = 0
let decoyTimer = 0
function clearTimers() {
  window.clearTimeout(hornTimer)
  window.clearTimeout(decoyTimer)
}
onBeforeUnmount(clearTimers)

/** The waiting for the next signal begins: the horn comes after a time that is different every time; a false signal may come before it. */
function beginWait() {
  clearTimers()
  cue.value = { step: 'wait', done: [] }
  const ms = waitTime(round.value * 31 + 7, attempts++, current.value.waitMs)
  hornTimer = window.setTimeout(sound, ms)
  const d = current.value.decoys[signalNo.value]
  if (d && !decoyDone.value.includes(signalNo.value)) {
    decoyTimer = window.setTimeout(() => {
      decoyDone.value = [...decoyDone.value, signalNo.value]
      decoy.value = d
      play('flip')
      later(() => {
        decoy.value = null
      }, DECOY_MS)
    }, Math.round(ms * DECOY_AT))
  }
}
beginWait()

function sound() {
  if (between.value || finished.value) return
  cue.value = cuePhase(cue.value, { type: 'horn' }, groupIds.value).state
  play('fanfare')
}

function early() {
  mistakes.value++
  play('wrong')
  message.value = t('app.adventure.cueEarly')
  flash.value = 'bad'
  pst.value = true
  later(() => {
    pst.value = false
    flash.value = null
  }, 600)
  beginWait()
}

/** A tap on Gideon's jar, on a group, or (`null`) on anything else. */
function tap(target: string | null) {
  if (between.value || finished.value || cue.value.step === 'ring') return
  if (cue.value.step === 'wait') {
    early()
    return
  }
  if (target === null) return
  const r = cuePhase(cue.value, { type: 'tap', target }, groupIds.value)
  cue.value = r.state
  if (r.result === 'order') message.value = t('app.adventure.cueOrder')
  else if (r.result === 'ok') {
    play('snap')
    message.value = ''
  } else if (r.result === 'ring') {
    play('star')
    progress.mark()
    message.value = t('app.adventure.cueRing')
    later(next, SHINE_MS)
  }
}

function fieldClick(e: MouseEvent) {
  const hit = e.target instanceof Element ? e.target.closest('[data-cue]') : null
  tap(hit instanceof HTMLElement ? (hit.dataset.cue ?? null) : null)
}

function next() {
  message.value = ''
  signalNo.value++
  if (signalNo.value < current.value.signals) {
    beginWait()
    return
  }
  clearTimers()
  if (lastRound.value) {
    finished.value = true
    return
  }
  between.value = true
  message.value = t('app.adventure.gameNext')
  later(() => {
    round.value++
    signalNo.value = 0
    decoyDone.value = []
    between.value = false
    message.value = ''
    beginWait()
  }, 1600)
}

const broken = (id: string) => cue.value.done.includes(id)
const nameOf = (id: string) => t(`app.adventure.cueName${id.charAt(0).toUpperCase()}${id.slice(1)}`)
const place = (g: { x: number; y: number }) => ({ left: `${g.x}%`, top: `${g.y}%` })
const decoyImage = computed(() => (decoy.value ? (props.game.decoyImages[decoy.value] ?? '') : ''))
</script>

<template lang="pug">
  div(class="cu")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="cu-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="cu-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      div(class="cu-field" :class="{ shine: cue.step === 'ring', pst }" role="group" :aria-label="t('app.adventure.cueField', { n: signalNo, total: current.signals })" :style="{ backgroundImage: `url(${src(game.background)})` }" @click="fieldClick")
        span(class="cu-horn" :class="{ lit: cue.step !== 'wait' }" role="img" :aria-label="cue.step === 'wait' ? t('app.adventure.cueHornDark') : t('app.adventure.cueHornLit')")
          GameImage(:src="game.horn" colour="#d9b45a" round)
        span(v-if="decoy" class="cu-decoy" role="img" :aria-label="decoy === 'owl' ? t('app.adventure.cueDecoyOwl') : t('app.adventure.cueDecoyWind')")
          GameImage(:src="decoyImage" colour="#8c9aa8" round)
        template(v-if="!between")
          span(class="cu-front" :style="place(game.front)" aria-hidden="true")
            GameImage(:src="game.front.image" :ratio="1" colour="#4a4252")
          button(
            v-for="g in game.groups"
            :key="`${round}-${g.id}`"
            type="button"
            class="cu-group"
            :class="{ broken: broken(g.id) }"
            :style="place(g)"
            :data-cue="g.id"
            :aria-label="broken(g.id) ? t('app.adventure.cueGroupDone', { name: nameOf(g.id) }) : nameOf(g.id)"
          )
            GameImage(:src="g.image" :ratio="1" colour="#4a4252")
            span(v-if="broken(g.id)" class="cu-shards" aria-hidden="true")
              GameImage(:src="game.shards" :ratio="180 / 120" colour="#b58a5a")
          button(
            type="button"
            class="cu-leader"
            :class="{ broken: broken('leader') }"
            :style="place(game.leader)"
            data-cue="leader"
            :aria-label="broken('leader') ? t('app.adventure.cueLeaderDone') : t('app.adventure.cueLeader')"
          )
            GameImage(:src="game.leader.image" :ratio="200 / 260" colour="#5a4a62")
            span(v-if="broken('leader')" class="cu-shards" aria-hidden="true")
              GameImage(:src="game.shards" :ratio="180 / 120" colour="#b58a5a")
        GameMark(v-if="flash" kind="bad" class="cu-mark")
      p(class="cu-fb" role="status") {{ message }}
      p(class="cu-count") {{ t('app.adventure.cueCount', { n: signalNo, total: current.signals }) }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.cueDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.cu
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e6dcb4
  box-shadow: inset 0 0 18px rgba(80, 50, 10, 0.25)

.cu-round
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

.cu-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.92)

.cu-field
  position: relative
  width: 100%
  aspect-ratio: 4 / 3
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #2b2a46
  background-size: cover
  background-position: center
  touch-action: manipulation

  &.shine
    box-shadow: inset 0 0 40px 10px rgba(255, 224, 120, 0.85)

// the horn is dark while the child waits and shines at the sign
.cu-horn
  position: absolute
  left: 50%
  top: 3%
  display: block
  width: 15%
  transform: translateX(-50%)
  opacity: 0.35
  filter: grayscale(0.8)
  pointer-events: none

  &.lit
    opacity: 1
    filter: drop-shadow(0 0 12px rgba(255, 230, 120, 1))

// the false sign: another picture, shown for a moment
.cu-decoy
  position: absolute
  right: 6%
  top: 6%
  display: block
  width: 13%
  pointer-events: none
  z-index: 6

.cu-front
  position: absolute
  display: block
  width: 22%
  transform: translate(-50%, -100%)
  pointer-events: none

// a group of men with jars, a big thumb target; their jars are broken after the answer
.cu-group, .cu-leader
  position: absolute
  display: block
  padding: 0
  border: 0
  background: transparent
  transform: translate(-50%, -100%)
  cursor: pointer
  -webkit-tap-highlight-color: transparent
  touch-action: manipulation

.cu-group
  width: 22%
  min-width: 56px

.cu-leader
  width: 15%
  min-width: 56px

  &.broken, .broken
    filter: drop-shadow(0 0 10px rgba(255, 220, 110, 1))

.cu-group.broken
  filter: drop-shadow(0 0 10px rgba(255, 220, 110, 1))

.cu-shards
  position: absolute
  left: 50%
  bottom: -4%
  display: block
  width: 60%
  transform: translateX(-50%)
  pointer-events: none

.cu-field.pst .cu-group, .cu-field.pst .cu-leader
  animation: cu-wobble 480ms ease-in-out

.cu-mark
  position: absolute
  top: 8px
  left: 8px
  z-index: 8

.cu-fb
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

.cu-count
  margin: 0
  text-align: center
  font-weight: 800
  color: #5f4f35

@keyframes cu-wobble
  0%, 100%
    transform: translate(-50%, -100%)
  25%
    transform: translate(calc(-50% - 5px), -100%)
  75%
    transform: translate(calc(-50% + 5px), -100%)

@media (prefers-reduced-motion: reduce)
  .cu-field.pst .cu-group, .cu-field.pst .cu-leader
    animation: none
</style>
