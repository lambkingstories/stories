<script setup lang="ts">
/**
 * Where does John point? (John 1,29.35-37): the valley of the Jordan seen from a hill. John stands on the left with his arm stretched out, across the river stand and walk a few men. The child
 * reads the direction of the arm, extends the line in its mind and taps the man John points at (Jesus; the other men are scenery). Round 2: the two disciples stand beside John and look the same
 * way; when the right man is found they go a little after him. That John points with his arm is the picture of the plan, not a word of the verses.
 * Right: a tick, a bright tone, a soft glow on the man (an area, no ring round his head), "Yes, John points at him.". Wrong: the man wiggles, a cross, a low tone, "John does not point there.",
 * a mistake; he can be tapped again. "Help me" after fifteen seconds: a fine golden line grows from the finger tip along the arm and stays until the child taps (it costs no star).
 * Keyboard: Tab to a man, Enter taps him. Less motion: nothing wiggles, the line is there at once, the disciples jump. Nothing is shown by colour alone.
 * Stars: `johannesStars(mistakes)`.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { johannesStars } from '@/utils/johannesGames'
import { pointHitBox, pointLineLength, pointTap } from '@/utils/johannesNeu'
import type { PointGame, PointMan } from '@/utils/johannesNeu'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: PointGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
const total = props.game.rounds.length
progress.setGoal(total)

const IDLE_SECONDS = 15
const still = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const round = ref(0)
const phase = ref<'play' | 'between'>('play')
/** The man that was found (the right one). */
const found = ref<string | null>(null)
const mistakes = ref(0)
const idle = ref(0)
const helping = ref(false)
const finished = ref(false)
const message = ref('')
const wiggle = ref<string | null>(null)
const picked = ref<{ id: string; kind: 'good' | 'bad' } | null>(null)
const followed = ref(false)
let messageSeq = 0
let pickSeq = 0

const src = (p: string) => prependBaseUrl(p)
const ratio = computed(() => props.game.ratio ?? 1.5)
const current = computed(() => props.game.rounds[Math.min(round.value, total - 1)]!)
const stars = computed(() => johannesStars(mistakes.value))
const countText = computed(() => t('app.adventure.johnPointsCount', { n: progress.parts.value, total }))
const help = computed(() => helping.value && phase.value === 'play')

function say(text: string, ms = 3200) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}
function mark(id: string, kind: 'good' | 'bad') {
  const k = ++pickSeq
  picked.value = { id, kind }
  later(() => {
    if (pickSeq === k) picked.value = null
  }, 1400)
}
function touched() {
  idle.value = 0
  helping.value = false
}
function tickIdle() {
  if (finished.value) return
  later(tickIdle, 1000)
  if (phase.value === 'play') idle.value++
}
later(tickIdle, 1000)

function tap(id: string) {
  if (phase.value !== 'play' || finished.value) return
  touched()
  if (!pointTap(current.value, id)) {
    mistakes.value++
    play('wrong')
    wiggle.value = id
    later(() => (wiggle.value = null), 600)
    mark(id, 'bad')
    say(t('app.adventure.johnPointsNo'), 3600)
    return
  }
  found.value = id
  phase.value = 'between'
  progress.mark()
  play('right')
  mark(id, 'good')
  say(t('app.adventure.johnPointsYes'), 0)
  if (current.value.disciples) later(() => (followed.value = true), 600)
  later(
    () => {
      if (round.value >= total - 1) {
        play('star')
        finished.value = true
        return
      }
      round.value++
      found.value = null
      followed.value = false
      phase.value = 'play'
      say('', 1)
    },
    current.value.disciples ? 3800 : 2800
  )
}

function helpMe() {
  touched()
  if (phase.value !== 'play') return
  helping.value = true
  say(t('app.adventure.johnPointsHelpGo'), 4200)
}

// ---- looks: a sprite stands with the middle of its feet at `x`, `y`
const spriteStyle = (s: { x: number; y: number; w: number; ratio: number }) => {
  const h = (s.w * ratio.value) / s.ratio
  return { left: `${s.x - s.w / 2}%`, top: `${s.y - h}%`, width: `${s.w}%` }
}
const johnStyle = computed(() => spriteStyle(current.value.johannes))
const discStyle = computed(() => {
  const d = current.value.disciples
  if (!d) return {}
  const f = followed.value ? d.follow : { x: 0, y: 0 }
  return spriteStyle({ ...d, x: d.x + f.x, y: d.y + f.y })
})
/** The finger target of a man: at least 44 pixels each way on a phone; the picture of the man sits in its middle. */
function hitStyle(m: PointMan) {
  const b = pointHitBox(props.game, m)
  return { left: `${b.x - b.w / 2}%`, top: `${b.y - b.h / 2}%`, width: `${b.w}%`, height: `${b.h}%` }
}
const inner = (m: PointMan) => ({ width: `${Math.min(100, (m.w / pointHitBox(props.game, m).w) * 100)}%` })
const lineStyle = computed(() => {
  const r = current.value
  return { left: `${r.tip.x}%`, top: `${r.tip.y}%`, width: `${pointLineLength(props.game, r)}%`, transform: `rotate(${-r.angle}deg)` }
})
</script>

<template lang="pug">
  div(class="gm" :class="{ still }")
    template(v-if="!finished")
      p(v-if="total > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total }) }}
      p(class="gm-hint") {{ current.hint }}
      div(class="gm-wrap")
        div(
          class="gm-field"
          :style="{ backgroundImage: `url(${src(game.background)})`, aspectRatio: String(ratio) }"
          role="group"
          :aria-label="t('app.adventure.johnPointsField')"
        )
          span(class="gm-john" :style="johnStyle" aria-hidden="true")
            GameImage(:src="current.johannes.image" :ratio="current.johannes.ratio" colour="#8aa0b8" :label="`johannes-zeigt-${round + 1}`")
          span(v-if="current.disciples" class="gm-disc" :style="discStyle" aria-hidden="true")
            GameImage(:src="current.disciples.image" :ratio="current.disciples.ratio" colour="#a0a8b8" label="juenger")
          div(v-if="help" class="gm-line" :style="lineStyle" aria-hidden="true")
          div(class="gm-men" role="group" :aria-label="t('app.adventure.johnPointsMen')")
            button(
              v-for="m in current.men"
              :key="m.id"
              type="button"
              class="gm-man"
              :class="{ glow: found === m.id, wiggle: wiggle === m.id }"
              :data-man="m.id"
              :style="hitStyle(m)"
              :aria-label="m.label"
              :disabled="phase !== 'play'"
              @click="tap(m.id)"
            )
              span(class="gm-sprite" :class="{ flip: m.flip }" :style="inner(m)")
                GameImage(:src="m.image" :ratio="m.ratio" colour="#a89870" :label="m.id")
              span(v-if="picked && picked.id === m.id" class="gm-mark")
                GameMark(:kind="picked.kind")
      p(class="gm-count" aria-live="polite") {{ countText }}
      div(class="gm-actions")
        AdvButton(v-if="idle >= IDLE_SECONDS && phase === 'play'" tone="gold" @click="helpMe") {{ t('app.adventure.johnPointsHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.johnPointsDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e8dcb8
  box-shadow: inset 0 0 18px rgba(90, 60, 20, 0.25)
  user-select: none
  -webkit-user-select: none

.gm-round, .gm-count
  margin: 0
  align-self: center
  padding: 1px 12px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  color: #5f4f35

.gm-round
  letter-spacing: 0.06em
  text-transform: uppercase

.gm-hint
  margin: 0
  text-align: center
  font-weight: 700
  font-size: 1rem
  color: #5f4f35

.gm-wrap
  position: relative
  display: flex
  flex-direction: column
  gap: 8px

.gm-field
  position: relative
  width: 100%
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #b89a68
  background-size: cover
  background-position: center

.gm-john, .gm-disc
  position: absolute
  display: block
  pointer-events: none

.gm-disc
  transition: left 1500ms ease, top 1500ms ease

.gm-line
  position: absolute
  height: 3px
  margin-top: -1px
  transform-origin: 0 50%
  pointer-events: none
  border-radius: 2px
  background: linear-gradient(90deg, rgba(255, 214, 90, 0.95), rgba(255, 214, 90, 0.35))
  box-shadow: 0 0 6px rgba(255, 214, 90, 0.8)
  animation: gm-grow 1400ms ease-out both

.gm-men
  position: absolute
  inset: 0
  pointer-events: none

.gm-man
  position: absolute
  display: flex
  align-items: center
  justify-content: center
  box-sizing: border-box
  min-width: 44px
  min-height: 44px
  padding: 0
  border: 0
  border-radius: 12px
  background: transparent
  cursor: pointer
  pointer-events: auto

  &:focus-visible
    outline: 3px solid #2f6b8a
    outline-offset: 2px

  &:disabled
    cursor: default

  &.glow
    background: radial-gradient(ellipse at center, rgba(255, 236, 170, 0.6), rgba(255, 236, 170, 0) 70%)

  &.wiggle
    animation: gm-wiggle 500ms ease

.gm-sprite
  display: block
  pointer-events: none

  &.flip
    transform: scaleX(-1)

.gm-mark
  position: absolute
  top: -6px
  right: -6px
  pointer-events: none

.gm-actions
  display: flex
  justify-content: center
  gap: 10px
  flex-wrap: wrap

  &:empty
    display: none

.gm-fb
  margin: 0
  min-height: 1.4em
  text-align: center
  font-weight: 800
  font-size: 1rem
  color: #3f321b
  align-self: center
  padding: 4px 14px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.94)

  &:empty
    display: none

.still
  .gm-disc
    transition: none

  .gm-line, .gm-man.wiggle
    animation: none

@keyframes gm-grow
  from
    clip-path: inset(0 100% 0 0)
  to
    clip-path: inset(0 0 0 0)

@keyframes gm-wiggle
  0%, 100%
    transform: translateX(0)
  25%
    transform: translateX(-4px)
  75%
    transform: translateX(4px)

@media (prefers-reduced-motion: reduce)
  .gm-disc
    transition: none

  .gm-line, .gm-man.wiggle
    animation: none
</style>
