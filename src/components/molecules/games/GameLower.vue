<script setup lang="ts">
/**
 * Down the rope: from the window in the high wall of the city a rope hangs, and a man hangs on it. The wind swings him slowly to and fro. A tap (on the picture, the button "Let down", or
 * Enter and the space key) while he swings away from the wall lets him down one step. If he swings towards the wall he touches it gently: a cross, a dull sound, a mistake, and he stays
 * where he is. While the rope is free a little arrow "away from the wall" shows (the rope does not only turn green). Round 1: one man, five steps, calm wind; round 2: another man,
 * six steps, a stronger wind (a shorter free time). Nobody falls and nothing is lost. The swing is `angle` and `isFree` in `utils/josuaGames.ts`.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { angle, isFree } from '@/utils/josuaGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { LowerGame, LowerMan } from '@/types/adventure'

const props = defineProps<{ game: LowerGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every step down of every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.steps, 0))

/** The picture of the man is 160 x 560 pixels; the field is 3 : 4, so a width of the picture is three quarters of that in height. */
const MAN_RATIO = 560 / 160
const FIELD_ASPECT = 4 / 3
/** Nothing counts for this long (ms) after a step down, so that one free swing is one step. */
const LOCK_MS = 500

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)
const man = computed<LowerMan | undefined>(() => props.game.men.find((m) => m.id === current.value.man))
const manW = computed(() => man.value?.w ?? 16)
/** The height of the man in percent of the height of the field. */
const manH = computed(() => (manW.value * MAN_RATIO) / FIELD_ASPECT)
/** From the window to the ground, in percent of the height of the field. */
const span = computed(() => props.game.ground - props.game.window[1])
/** How far down the man can go (percent of the height of the field). */
const room = computed(() => Math.max(0, span.value - manH.value))

const down = ref(0)
const mistakes = ref(0)
const busy = ref(false)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const flash = ref<'good' | 'bad' | null>(null)
const touching = ref(false)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => mistakeStars(mistakes.value, 2, 4))

// the swing: the time since the start of the game in seconds
const t0 = Date.now()
const time = ref(0)
const timer = window.setInterval(() => (time.value = (Date.now() - t0) / 1000), 33)
onBeforeUnmount(() => window.clearInterval(timer))
const swing = computed(() => angle(time.value, current.value.amplitude, current.value.period))
const free = computed(() => isFree(swing.value, current.value.threshold))

function flashOn(kind: 'good' | 'bad') {
  flash.value = kind
  later(() => {
    flash.value = null
  }, 700)
}

function lower() {
  if (busy.value || between.value || finished.value) return
  if (!free.value) {
    mistakes.value++
    play('wrong')
    flashOn('bad')
    message.value = t('app.adventure.lowerWall')
    touching.value = true
    later(() => {
      touching.value = false
    }, 600)
    return
  }
  down.value++
  busy.value = true
  progress.mark()
  play('tap')
  message.value = ''
  flashOn('good')
  later(() => {
    busy.value = false
  }, LOCK_MS)
  if (down.value >= current.value.steps) roundOver()
}

function roundOver() {
  if (lastRound.value) {
    later(() => {
      finished.value = true
      play('star')
    }, 1000)
    return
  }
  between.value = true
  message.value = t('app.adventure.gameNext')
  later(() => {
    round.value++
    down.value = 0
    between.value = false
    message.value = ''
  }, 1800)
}

function key(e: KeyboardEvent) {
  if ((e.key !== 'Enter' && e.key !== ' ') || (e.target as HTMLElement | null)?.tagName === 'BUTTON') return
  e.preventDefault()
  lower()
}

const ropeStyle = computed(() => ({
  left: `${props.game.window[0]}%`,
  top: `${props.game.window[1]}%`,
  width: `${manW.value}%`,
  height: `${span.value}%`,
  transform: `translateX(-50%) rotate(${-swing.value}deg)`
}))
const dropPercent = computed(() => (span.value ? ((current.value.steps ? (down.value / current.value.steps) * room.value : 0) / span.value) * 100 : 0))
const lineStyle = computed(() => ({ height: `${dropPercent.value}%` }))
const manStyle = computed(() => ({ top: `${dropPercent.value}%` }))
</script>

<template lang="pug">
  div(class="lw" tabindex="-1" @keydown="key")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="lw-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="lw-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      div(class="lw-field" role="group" :aria-label="t('app.adventure.lowerField', { n: down, total: current.steps })" :style="{ backgroundImage: `url(${src(game.background)})` }" @pointerdown="lower")
        div(class="lw-rope" :class="{ free, touching }" :style="ropeStyle" aria-hidden="true")
          span(class="lw-line" :style="lineStyle")
          span(class="lw-man" :style="manStyle")
            GameImage(:src="man ? man.image : ''" :ratio="160 / 560" colour="#c9895a")
        span(v-if="free && !between" class="lw-arrow" aria-hidden="true") →
        GameMark(v-if="flash" :kind="flash" class="lw-mark")
      p(class="lw-fb" role="status") {{ message }}
      AdvButton(tone="gold" class="lw-go" :disabled="between" @click.stop="lower") {{ t('app.adventure.lowerButton') }}
      p(class="lw-count") {{ t('app.adventure.lowerCount', { n: down, total: current.steps }) }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.lowerDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.lw
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e6dcb4
  box-shadow: inset 0 0 18px rgba(80, 50, 10, 0.25)
  outline: none

.lw-round
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

.lw-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.92)

.lw-field
  position: relative
  width: 100%
  max-width: 420px
  aspect-ratio: 3 / 4
  align-self: center
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #cbb994
  background-size: cover
  background-position: center
  touch-action: manipulation

// the rope turns about the window; the line is the rope above the man (the picture of the man has its own piece of rope)
.lw-rope
  position: absolute
  transform-origin: 50% 0
  pointer-events: none

  &.touching .lw-man
    filter: drop-shadow(0 0 6px rgba(200, 50, 50, 0.95))

.lw-line
  position: absolute
  left: 50%
  top: 0
  width: 4px
  margin-left: -2px
  background: #8a2f2a
  border-radius: 2px
  transition: height 400ms ease

.lw-rope.free .lw-line
  background: #2fae54
  box-shadow: 0 0 6px rgba(60, 200, 90, 0.9)

.lw-man
  position: absolute
  left: 0
  width: 100%
  transition: top 400ms ease

// the arrow "away from the wall": the rope is free
.lw-arrow
  position: absolute
  top: 6px
  left: 50%
  padding: 0 12px
  transform: translateX(-50%)
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-size: 1.4rem
  font-weight: 900
  color: #1f7a3a
  z-index: 5

.lw-mark
  position: absolute
  top: 8px
  right: 8px
  z-index: 6

.lw-fb
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

.lw-go
  align-self: center
  min-height: 60px

.lw-count
  margin: 0
  text-align: center
  font-weight: 800
  color: #5f4f35

@media (prefers-reduced-motion: reduce)
  .lw-line, .lw-man
    transition: none
</style>
