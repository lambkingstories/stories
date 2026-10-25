<script setup lang="ts">
/**
 * Hold the people together: at Gilgal Saul waits for Samuel, who said he would come after seven days. The men stand around the altar, and day by day (the sun moves on and the day counter counts) some of them get restless
 * and walk away toward the edge of the picture. The child taps a man who is walking away and he comes back to his place (one part done). A man who reaches the edge is lost (a cross, one mistake): he comes back a little later,
 * ashamed. When the days are over and nobody is walking any more, Samuel arrives (his picture appears) and the round is done. Round 1 has three days, round 2 seven. There is nothing to offer and nothing to press
 * but the men. The arithmetic is in `utils/samuelGames.ts`.
 */
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { atEdge, daysPassed, dueLeaves, SHAME_MS, waitOver, walkProgress, walkX } from '@/utils/samuelGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { GatherGame } from '@/types/adventure'

const props = defineProps<{ game: GatherGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every man who walks away is brought back (or lost)
progress.setGoal(props.game.rounds.reduce((n, r) => n + r.leaves.length, 0))

const TICK = 50
const round = ref(0)
const elapsed = ref(0)
/** When each man began to walk away (null: he stands at home). */
const leftAt = reactive<Record<number, number | null>>({})
/** The men who are lost (they are away until they come back, ashamed). */
const gone = reactive<Record<number, boolean>>({})
const started = ref<Set<number>>(new Set())
const misses = ref(0)
const arrived = ref(false)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const src = (p: string) => prependBaseUrl(p)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const stars = computed(() => mistakeStars(misses.value, 3, 8))
const day = computed(() => Math.min(current.value.days, daysPassed(elapsed.value, current.value.dayMs) + 1))
const frac = computed(() => Math.min(1, elapsed.value / (current.value.days * current.value.dayMs)))
const sunStyle = computed(() => ({ left: `${8 + 84 * frac.value}%`, top: `${20 - 9 * Math.sin(Math.PI * frac.value)}%`, width: `${props.game.manW * 0.9}%` }))

const timer = window.setInterval(tick, TICK)
onBeforeUnmount(() => window.clearInterval(timer))

function manProgress(m: number): number {
  return walkProgress(elapsed.value, leftAt[m] ?? null)
}
function walking(m: number): boolean {
  const l = leftAt[m]
  return l !== null && l !== undefined && !gone[m]
}
function manStyle(m: number) {
  const h = props.game.homes[m]!
  return { left: `${walkX(h.x, h.dir, manProgress(m))}%`, top: `${h.y}%`, width: `${props.game.manW}%` }
}

function tick() {
  if (between.value || finished.value || arrived.value) return
  elapsed.value += TICK
  for (const i of dueLeaves(current.value.leaves, elapsed.value, started.value)) {
    started.value = new Set([...started.value, i])
    const m = current.value.leaves[i]!.man
    if (!walking(m) && !gone[m]) {
      leftAt[m] = elapsed.value
      message.value = t('app.adventure.gatherLeaving')
    }
  }
  for (let m = 0; m < props.game.homes.length; m++) {
    if (walking(m) && atEdge(manProgress(m))) lose(m)
  }
  if (waitOver(elapsed.value, current.value.days, current.value.dayMs) && !props.game.homes.some((_, m) => walking(m))) arrive()
}

function lose(m: number) {
  gone[m] = true
  leftAt[m] = null
  misses.value++
  play('wrong')
  message.value = t('app.adventure.gatherLost')
  later(() => {
    gone[m] = false
  }, SHAME_MS)
}

function bringBack(m: number) {
  if (between.value || finished.value || arrived.value || !walking(m)) return
  leftAt[m] = null
  progress.mark()
  play('tap')
  message.value = t('app.adventure.gatherBack')
}

function arrive() {
  arrived.value = true
  between.value = true
  play('star')
  message.value = t('app.adventure.gatherSamuel')
  later(() => {
    if (lastRound.value) {
      finished.value = true
      return
    }
    round.value++
    elapsed.value = 0
    started.value = new Set()
    for (const k of Object.keys(leftAt)) leftAt[Number(k)] = null
    for (const k of Object.keys(gone)) gone[Number(k)] = false
    arrived.value = false
    between.value = false
    message.value = ''
  }, 2200)
}
</script>

<template lang="pug">
  div(class="gg")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gg-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gg-hint") {{ current.hint }}
      div(class="gg-field" :style="{ backgroundImage: `url(${src(game.background)})` }")
        span(class="gg-day" aria-live="polite") {{ t('app.adventure.gatherDay', { n: day, total: current.days }) }}
        span(class="gg-sun" :style="sunStyle" aria-hidden="true")
          GameImage(:src="game.sun" colour="#f0c040" round)
        //- the men: a man who walks away is tapped
        button(
          v-for="(h, m) in game.homes"
          :key="`man-${m}`"
          type="button"
          class="gg-man"
          :class="{ walking: walking(m), gone: gone[m] }"
          :style="manStyle(m)"
          :aria-label="walking(m) ? t('app.adventure.gatherMan', { n: m + 1 }) : t('app.adventure.gatherStay', { n: m + 1 })"
          :disabled="between || !walking(m)"
          @click="bringBack(m)"
        )
          GameImage(:src="game.men[h.sprite]" colour="#7a8aa5")
          span(v-if="gone[m]" class="gg-cross" aria-hidden="true")
            GameMark(kind="bad")
        //- Saul stands at the altar
        span(class="gg-saul" :style="{ left: `${game.saulPos.x}%`, top: `${game.saulPos.y}%`, width: `${game.saulPos.w}%` }" role="img" :aria-label="t('app.adventure.gatherSaulPic')")
          GameImage(:src="game.saul" colour="#a5402a")
        //- Samuel arrives
        span(v-if="arrived" class="gg-samuel" :style="{ left: `${game.samuelPos.x}%`, top: `${game.samuelPos.y}%`, width: `${game.samuelPos.w}%` }" role="img" :aria-label="t('app.adventure.gatherSamuelPic')")
          GameImage(:src="game.samuel" colour="#6b8a55")
      p(class="gg-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.gatherDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gg
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

.gg-round
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

.gg-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #5f4f35

.gg-field
  position: relative
  width: 100%
  aspect-ratio: 4 / 3
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #cfae6a
  background-size: cover
  background-position: center

.gg-day
  position: absolute
  left: 8px
  top: 8px
  z-index: 8
  padding: 1px 10px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 0.9rem
  color: #5f4f35

// the sun moves on with the middle of its picture at left/top
.gg-sun
  position: absolute
  display: block
  transform: translate(-50%, -50%)
  transition: left 400ms linear, top 400ms linear
  pointer-events: none
  z-index: 1

// a man stands with the middle of his foot at left/top
.gg-man
  position: absolute
  display: block
  padding: 0
  border: 0
  background: transparent
  cursor: default
  transform: translate(-50%, -100%)
  -webkit-tap-highlight-color: transparent
  z-index: 3

  &.walking
    cursor: pointer
    z-index: 5
    animation: gg-hurry 600ms ease-in-out infinite

    &::after
      content: ''
      position: absolute
      inset: -14% -22%
      border-radius: 50%
      border: 3px dashed rgba(255, 246, 220, 0.9)

  &.gone
    opacity: 0

  &:focus-visible
    outline: 3px solid #fff
    outline-offset: 2px
    border-radius: 10px

.gg-cross
  position: absolute
  left: 50%
  top: 30%
  display: block
  margin: -15px 0 0 -15px

.gg-saul
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none
  z-index: 3

.gg-samuel
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none
  z-index: 4
  animation: gg-arrive 900ms ease both

.gg-fb
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

@keyframes gg-hurry
  0%, 100%
    transform: translate(-50%, -100%)
  50%
    transform: translate(-50%, calc(-100% - 4px))

@keyframes gg-arrive
  from
    opacity: 0
  to
    opacity: 1

@media (prefers-reduced-motion: reduce)
  .gg-man.walking, .gg-samuel
    animation: none
  .gg-sun
    transition: none
</style>
