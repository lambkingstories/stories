<script setup lang="ts">
/**
 * Call ten elders to the gate: people walk across the square in front of the gate of Bethlehem from the left to the right, old men with gray beards among younger men, women and children. The child taps the old men:
 * each one stops, walks to his seat in the half circle before the gate and stays there. A tap on anybody else is a mistake (a cross; he only shakes his head and walks on). Round 1 has five elders among twelve people,
 * round 2 the other five among twelve. When the people have all gone by and an elder was missed, they walk past once more (nothing is lost, there is no clock). When all ten sit, a picture of ten elders sitting in the half
 * circle fades in. The first walker enters a moment after the picture is there, never at once. Where a walker is at a time is `walkerX` in `utils/rutGames.ts`.
 */
import { computed, nextTick, onBeforeUnmount, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { allWalkersOver, eldersCalled, seatFor, walkerX } from '@/utils/rutGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { EldersGame } from '@/types/adventure'

const props = defineProps<{ game: EldersGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every elder of every round
progress.setGoal(props.game.rounds.reduce((n, r) => n + r.walkers.filter((w) => w.kind === 'elder').length, 0))

/** The time between the picture standing there and the first walker entering, and the same when the people walk past once more. */
const LEAD_MS = 2200
const AGAIN_MS = 1200
const reduced = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
/** With "reduce motion" the people take half as long again to cross. */
const SLOW = reduced ? 1.5 : 1

const round = ref(0)
const elapsed = ref(-LEAD_MS)
/** The walkers of this round that were called (elders), by their index in the round. */
const taken = ref<Set<number>>(new Set())
/** How many elders were called in all rounds: the next one goes to this seat. */
const calledTotal = ref(0)
/** The called elders: where they stop, and whether they are on their way (x, y of the walker when he was tapped, then the seat). */
const seated = reactive<Record<string, { sprite: number; x: number; y: number }>>({})
const wrong = ref<{ at: number; k: number } | null>(null)
let wrongKey = 0
const misses = ref(0)
const between = ref(false)
const finished = ref(false)
const group = ref(false)
const message = ref('')
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => mistakeStars(misses.value, 2, 5))
const walkers = computed(() => props.game.rounds[round.value]!.walkers.map((w) => ({ ...w, dur: w.dur * SLOW })))
const total = computed(() => props.game.rounds.reduce((n, r) => n + r.walkers.filter((w) => w.kind === 'elder').length, 0))
const calledInRound = ref(0)

let last = Date.now()
const timer = window.setInterval(() => {
  const now = Date.now()
  const dt = Math.min(250, now - last)
  last = now
  if (between.value || finished.value) return
  elapsed.value += dt
  if (allWalkersOver(elapsed.value, walkers.value, taken.value)) {
    // somebody was missed: all the people walk past once more
    elapsed.value = -AGAIN_MS
    message.value = t('app.adventure.eldersAgain')
  }
}, 50)
onBeforeUnmount(() => window.clearInterval(timer))

/** The people who are in the picture now (entered, not yet gone, not called), with their place. */
const visible = computed(() =>
  walkers.value
    .map((w, i) => ({ i, kind: w.kind, sprite: w.sprite, y: w.y, x: walkerX(elapsed.value, w) }))
    .filter((w): w is { i: number; kind: 'elder' | 'other'; sprite: number; y: number; x: number } => w.x !== null && w.x < 108 && !taken.value.has(w.i))
)
const spriteOf = (kind: 'elder' | 'other', n: number) => (kind === 'elder' ? props.game.elders : props.game.others)[n % (kind === 'elder' ? props.game.elders : props.game.others).length]!
const labelOf = (kind: 'elder' | 'other') => t(kind === 'elder' ? 'app.adventure.eldersElder' : 'app.adventure.eldersOther')
const seatedList = computed(() => Object.entries(seated).map(([key, s]) => ({ key, ...s })))

function tap(i: number) {
  if (between.value || finished.value || taken.value.has(i)) return
  const w = walkers.value[i]!
  if (w.kind === 'other') {
    misses.value++
    play('wrong')
    message.value = t('app.adventure.eldersBad')
    const k = ++wrongKey
    wrong.value = { at: i, k }
    later(() => {
      if (wrong.value?.k === k) wrong.value = null
    }, 800)
    return
  }
  const x = walkerX(elapsed.value, w) ?? 50
  taken.value = new Set(taken.value).add(i)
  const seat = seatFor(calledTotal.value, props.game.seats)
  const key = `${round.value}-${i}`
  seated[key] = { sprite: w.sprite, x, y: w.y }
  calledTotal.value++
  calledInRound.value++
  progress.mark()
  play('tap')
  message.value = ''
  nextTick(() => {
    seated[key] = { sprite: w.sprite, x: seat.x, y: seat.y }
  })
  if (eldersCalled(walkers.value, calledInRound.value)) roundOver()
}

function roundOver() {
  between.value = true
  if (calledTotal.value >= total.value) {
    message.value = t('app.adventure.eldersAll')
    later(() => {
      group.value = true
      play('star')
    }, 1200)
    later(() => {
      finished.value = true
    }, 3400)
    return
  }
  message.value = t('app.adventure.eldersRound_over', { n: calledTotal.value })
  later(() => {
    round.value++
    elapsed.value = -LEAD_MS
    taken.value = new Set()
    calledInRound.value = 0
    last = Date.now()
    between.value = false
    message.value = ''
  }, 1800)
}

const hint = computed(() => props.game.rounds[round.value]!.hint)
</script>

<template lang="pug">
  div(class="el")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="el-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      div(class="el-field" :style="{ backgroundImage: `url(${src(game.background)})` }")
        //- the elders that sit in the half circle (they walk to their seats); when all ten are there, the picture of ten sitting elders fades in
        span(
          v-for="s in seatedList"
          :key="`seat-${s.key}`"
          class="el-seat"
          :class="{ gone: group }"
          :style="{ left: `${s.x}%`, top: `${s.y}%`, width: `${game.seatW}%` }"
          aria-hidden="true"
        )
          GameImage(:src="spriteOf('elder', s.sprite)" colour="#8a6a3a")
        span(
          class="el-group"
          :class="{ on: group }"
          :style="{ left: `${game.seatedBox.x}%`, top: `${game.seatedBox.y}%`, width: `${game.seatedBox.w}%` }"
          aria-hidden="true"
        )
          GameImage(:src="game.seated" colour="#8a6a3a")
        //- the people on the square
        button(
          v-for="w in visible"
          :key="`walker-${round}-${w.i}`"
          type="button"
          class="el-walker"
          :class="{ shake: wrong && wrong.at === w.i }"
          :style="{ left: `${w.x}%`, top: `${w.y}%`, width: `${game.walkerW}%`, zIndex: Math.round(w.y) }"
          :disabled="between"
          :aria-label="labelOf(w.kind)"
          @click="tap(w.i)"
        )
          GameImage(:src="spriteOf(w.kind, w.sprite)" colour="#8a6a3a")
          span(v-if="wrong && wrong.at === w.i" :key="wrong.k" class="el-miss" aria-hidden="true")
            GameMark(kind="bad")
      p(class="el-hint") {{ hint }}
      p(class="el-count" aria-live="polite") {{ t('app.adventure.eldersCount', { n: calledTotal, total }) }}
      p(class="el-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.eldersDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.el
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e7d9b4
  box-shadow: inset 0 0 18px rgba(90, 60, 20, 0.25)

.el-round
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

.el-field
  position: relative
  width: 100%
  aspect-ratio: 4 / 3
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #cfae6a
  background-size: cover
  background-position: center

// a walker is a button: its picture keeps its size, only the area to tap grows
.el-walker
  position: absolute
  padding: 0
  border: 0
  background: transparent
  cursor: pointer
  transform: translate(-50%, -100%)
  -webkit-tap-highlight-color: transparent

  &::after
    content: ''
    position: absolute
    inset: -8px

  &:focus-visible
    outline: 3px solid #fff
    outline-offset: 2px
    border-radius: 8px

  &.shake
    animation: el-shake 380ms ease

.el-seat
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none
  transition: left 900ms ease-in-out, top 900ms ease-in-out, opacity 600ms ease

  &.gone
    opacity: 0

.el-group
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none
  opacity: 0
  transition: opacity 700ms ease

  &.on
    opacity: 1

.el-miss
  position: absolute
  left: 50%
  top: 12%
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none

.el-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #5f4f35

.el-count
  margin: 0
  text-align: center
  font-weight: 800
  color: #5f4f35

.el-fb
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

@keyframes el-shake
  0%, 100%
    transform: translate(-50%, -100%)
  25%
    transform: translate(calc(-50% - 5px), -100%)
  75%
    transform: translate(calc(-50% + 5px), -100%)

@media (prefers-reduced-motion: reduce)
  .el-walker.shake
    animation: none
  .el-seat
    transition: none
</style>
