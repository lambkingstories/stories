<script setup lang="ts">
/**
 * The still small sound: Mount Horeb with the cave, Elijah stands at its mouth and listens. As in the story first a great wind comes (a whirl across the mountain), then an earthquake (the picture shakes,
 * cracks run through the ground), then a fire (a band of flames); God was not in any of them. A tap on something loud is a mistake (a cross, "God was not in it"). After the last loud thing the mountain
 * is still for a moment, then a small soft light with a feather appears: that is the quiet sound, and only that one the child taps: Elijah draws his cloak over his face. Round 2 is the same with
 * the loud things in another order, longer, and a longer stillness before the quiet sound. The picture begins calm; the first loud thing comes after a lead, never at once. Which loud thing is going on
 * and when the quiet sound comes are `loudAt` and `whisperAt` in `utils/eliaGames.ts`.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { loudAt, whisperAt } from '@/utils/eliaGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { LoudKind, WhisperGame } from '@/types/adventure'

const props = defineProps<{ game: WhisperGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: the quiet sound of every round
progress.setGoal(props.game.rounds.length)

/** The calm time before the first loud thing. */
const LEAD_MS = 2000
const reduced = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const elapsed = ref(0)
const veiled = ref(false)
const misses = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const wrong = ref<{ kind: LoudKind; k: number } | null>(null)
let wrongKey = 0
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => mistakeStars(misses.value, 1, 3))
const loud = computed<LoudKind | null>(() => (between.value ? null : loudAt(elapsed.value, current.value, LEAD_MS)))
const quiet = computed(() => !between.value && elapsed.value >= whisperAt(current.value, LEAD_MS))

let last = Date.now()
const timer = window.setInterval(() => {
  const now = Date.now()
  const dt = Math.min(250, now - last)
  last = now
  if (between.value || finished.value) return
  elapsed.value += dt
}, 50)
onBeforeUnmount(() => window.clearInterval(timer))

function tapLoud(kind: LoudKind) {
  if (between.value || finished.value) return
  misses.value++
  play('wrong')
  message.value = t('app.adventure.whisperBad')
  const k = ++wrongKey
  wrong.value = { kind, k }
  later(() => {
    if (wrong.value?.k === k) wrong.value = null
  }, 900)
}

function tapQuiet() {
  if (!quiet.value || between.value) return
  between.value = true
  veiled.value = true
  progress.mark()
  play('star')
  message.value = t('app.adventure.whisperRight')
  if (round.value + 1 >= props.game.rounds.length) {
    later(() => {
      finished.value = true
    }, 2200)
    return
  }
  later(() => {
    round.value++
    elapsed.value = 0
    veiled.value = false
    last = Date.now()
    between.value = false
    message.value = ''
  }, 2600)
}

const eliaStyle = computed(() => ({ left: `${props.game.elia.x}%`, top: `${props.game.elia.y}%`, width: `${props.game.elia.w}%` }))
const featherStyle = computed(() => ({ left: `${Math.min(86, props.game.elia.x + 20)}%`, top: `${props.game.elia.y - 24}%` }))
</script>

<template lang="pug">
  div(class="wh")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="wh-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="wh-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      div(class="wh-field" :class="{ quake: loud === 'quake' && !reduced }" :style="{ backgroundImage: `url(${src(game.background)})` }")
        span(class="wh-elia" :style="eliaStyle")
          GameImage(:src="veiled ? game.veiled : game.standing" colour="#8a6a3c" :ratio="0.55")
        button(
          v-if="loud === 'wind'"
          type="button"
          class="wh-loud wh-wind"
          :aria-label="t('app.adventure.whisperLoud_wind')"
          @click="tapLoud('wind')"
        )
          img(:src="src(game.wind)" alt="" draggable="false")
        button(
          v-if="loud === 'quake'"
          type="button"
          class="wh-loud wh-quake"
          :aria-label="t('app.adventure.whisperLoud_quake')"
          @click="tapLoud('quake')"
        )
          img(:src="src(game.cracks)" alt="" draggable="false")
        button(
          v-if="loud === 'fire'"
          type="button"
          class="wh-loud wh-fire"
          :aria-label="t('app.adventure.whisperLoud_fire')"
          @click="tapLoud('fire')"
        )
          img(:src="src(game.fire)" alt="" draggable="false")
        span(v-if="wrong" :key="wrong.k" class="wh-miss" aria-hidden="true")
          GameMark(kind="bad")
        button(
          v-if="quiet && !veiled"
          type="button"
          class="wh-feather"
          :style="featherStyle"
          :aria-label="t('app.adventure.whisperQuiet')"
          @click="tapQuiet"
        )
          img(:src="src(game.feather)" alt="" draggable="false")
      p(class="wh-fb" role="status") {{ message || (between ? '' : t('app.adventure.whisperWait')) }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.whisperDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.wh
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e7d9b4
  box-shadow: inset 0 0 18px rgba(90, 60, 20, 0.25)

.wh-round
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

.wh-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #5f4f35

.wh-field
  position: relative
  width: 100%
  aspect-ratio: 4 / 3
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #b99863
  background-size: cover
  background-position: center

  // the earthquake: the whole picture shakes a little (not with "reduce motion")
  &.quake
    animation: wh-shake 320ms linear infinite

.wh-elia
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none
  transition: opacity 300ms ease

.wh-loud
  position: absolute
  padding: 0
  border: 0
  background: transparent
  cursor: pointer
  -webkit-tap-highlight-color: transparent
  animation: wh-in 600ms ease both

  img
    display: block
    width: 100%
    height: 100%
    object-fit: contain
    object-position: bottom
    // the effects are painted light on black: they are mixed into the picture
    mix-blend-mode: screen
    pointer-events: none

  &:focus-visible
    outline: 3px solid #fff
    outline-offset: -3px

.wh-wind
  left: 14%
  top: 8%
  width: 72%
  height: 74%

.wh-fire
  left: 6%
  bottom: 0
  width: 88%
  height: 48%

// the cracks are cut out (no black): they lie on the ground in the lower part
.wh-quake
  left: 0
  bottom: 4%
  width: 100%
  height: 24%

  img
    mix-blend-mode: normal
    object-fit: contain
    object-position: bottom

.wh-miss
  position: absolute
  left: 50%
  top: 40%
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none

// the quiet sound: a small soft light that breathes; the area to tap is bigger than the light
.wh-feather
  position: absolute
  width: 22%
  padding: 0
  border: 0
  background: transparent
  cursor: pointer
  transform: translate(-50%, -50%)
  animation: wh-glow 1800ms ease-in-out infinite
  -webkit-tap-highlight-color: transparent

  &::after
    content: ''
    position: absolute
    inset: -12px

  img
    display: block
    width: 100%
    height: auto
    mix-blend-mode: screen
    pointer-events: none

  &:focus-visible
    outline: 3px solid #fff
    outline-offset: 2px
    border-radius: 12px

.wh-fb
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

@keyframes wh-shake
  0%
    transform: translate(0, 0)
  25%
    transform: translate(-3px, 2px)
  50%
    transform: translate(3px, -2px)
  75%
    transform: translate(-2px, -3px)
  100%
    transform: translate(0, 0)

@keyframes wh-in
  from
    opacity: 0
  to
    opacity: 1

@keyframes wh-glow
  0%, 100%
    opacity: 0.75
    transform: translate(-50%, -50%) scale(0.95)
  50%
    opacity: 1
    transform: translate(-50%, -50%) scale(1.06)

@media (prefers-reduced-motion: reduce)
  .wh-field.quake,
  .wh-feather
    animation: none
  .wh-loud
    animation: none
</style>
