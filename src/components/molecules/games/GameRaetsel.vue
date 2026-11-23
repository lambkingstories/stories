<script setup lang="ts">
/**
 * Sweet and strong (Judges 14,14.18): in the yard of the feast in Timnah stands a stair of wooden steps; the cards (round clay tablets with a picture) lie mixed under the picture. The child lays
 * them on the steps from the top down: first the sweetest (the strongest) on the top step, then the next one below, until the stair is full. Round 1: bread, grapes, honey; round 2: hare, sheep,
 * donkey, lion. Drag a card onto the shining step, or tap the card and then the step. Right: a tick, a bright tone, "Das ist süßer." / "Das ist stärker.", the card stays on its step. Wrong:
 * the card springs back, a cross, a low tone, "Es gibt Süßeres." / "Es gibt Stärkeres.", a mistake. A card let go on another step or beside the stair is no mistake. At the end of a round the
 * top card shines; at the end of the game the honey and the lion shine side by side, then the riddle stands as the verse. The game never says where the honey came from.
 * "Help me" after fifteen seconds makes the right card shine. Keyboard: Tab to a card, Enter takes it up, Tab to the step, Enter lays it there. Less motion: nothing springs, nothing pulses.
 * Stars: `simsonStars(mistakes)`.
 */
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { simsonStars } from '@/utils/simsonGames'
import { riddleCard, riddleCheck, riddleHelp, riddleStepAt, riddleStepBox, riddleWanted } from '@/utils/simsonNeu'
import type { RiddleCard, RiddleGame } from '@/utils/simsonNeu'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: RiddleGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
const total = props.game.rounds.reduce((n, r) => n + r.cards.length, 0)
progress.setGoal(total)

const IDLE_SECONDS = 15
const still = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const round = ref(0)
const phase = ref<'play' | 'between' | 'final'>('play')
/** How many cards lie on the stair in this round (from the top down). */
const placed = ref(0)
const held = ref<string | null>(null)
const mistakes = ref(0)
const idle = ref(0)
const helping = ref(false)
const finished = ref(false)
const message = ref('')
const bounce = ref<string | null>(null)
const picked = ref<{ step: number; kind: 'good' | 'bad' } | null>(null)
const wrapEl = ref<HTMLElement | null>(null)
const fieldEl = ref<HTMLElement | null>(null)
const drag = reactive<{ card: string; x: number; y: number; moved: number }>({ card: '', x: 0, y: 0, moved: 0 })
const downAt = ref({ x: 0, y: 0 })
let messageSeq = 0
let pickSeq = 0

const src = (p: string) => prependBaseUrl(p)
const ratio = computed(() => props.game.ratio ?? 1.5)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const stars = computed(() => simsonStars(mistakes.value))
const countText = computed(() => t('app.adventure.sweetStrongCount', { n: progress.parts.value, total }))
const wanted = computed(() => (phase.value === 'play' ? riddleWanted(current.value, placed.value) : -1))
/** The card that lies on step `i` (the steps from the top down are filled). */
const onStep = (i: number): RiddleCard | undefined => (i > current.value.cards.length - 1 - placed.value ? current.value.cards[i] : undefined)
/** The cards on the tray, in the mixed order. */
const tray = computed(() => current.value.mix.filter((id) => !current.value.cards.some((c, i) => c.id === id && onStep(i))).map((id) => riddleCard(current.value, id)).filter((c): c is RiddleCard => !!c))
const help = computed(() => (helping.value && phase.value === 'play' ? riddleHelp(current.value, placed.value) : null))
const steps = computed(() => current.value.cards.map((_, i) => i))
/** The two cards of the end (the top card of every round). */
const crowns = computed(() => props.game.rounds.map((r) => r.cards[r.cards.length - 1]).filter((c): c is RiddleCard => !!c))

function say(text: string, ms = 3200) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}
function mark(step: number, kind: 'good' | 'bad') {
  const n = ++pickSeq
  picked.value = { step, kind }
  later(() => {
    if (pickSeq === n) picked.value = null
  }, 1100)
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

// ---- the pointer: drag a card (or tap it and then the step)
function toPercent(e: { clientX: number; clientY: number }): { x: number; y: number } | null {
  const r = fieldEl.value?.getBoundingClientRect()
  if (!r || r.width <= 0 || r.height <= 0) return null
  return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }
}
function down(e: PointerEvent, id: string) {
  if (phase.value !== 'play' || finished.value) return
  touched()
  const p = toPercent(e)
  drag.card = id
  drag.x = p?.x ?? 50
  drag.y = p?.y ?? 50
  drag.moved = 0
  downAt.value = { x: e.clientX, y: e.clientY }
  ;(wrapEl.value as HTMLElement | null)?.setPointerCapture?.(e.pointerId)
}
function move(e: PointerEvent) {
  if (!drag.card) return
  const p = toPercent(e)
  if (p) {
    drag.x = p.x
    drag.y = p.y
  }
  drag.moved = Math.max(drag.moved, Math.hypot(e.clientX - downAt.value.x, e.clientY - downAt.value.y))
}
function up(e: PointerEvent) {
  if (!drag.card) return
  const id = drag.card
  const moved = drag.moved
  drag.card = ''
  if (moved < 8) {
    toggleHeld(id)
    return
  }
  const p = toPercent(e)
  const step = p ? riddleStepAt(props.game, current.value, p) : null
  if (step !== null) lay(id, step)
}
function cardClick(e: MouseEvent, id: string) {
  if (e.detail !== 0) return
  touched()
  toggleHeld(id)
}
function toggleHeld(id: string) {
  if (phase.value !== 'play') return
  held.value = held.value === id ? null : id
  if (held.value) say(t('app.adventure.sweetStrongPick'), 0)
  else say('', 1)
}
function stepClick(i: number) {
  if (phase.value !== 'play' || finished.value) return
  touched()
  if (!held.value) {
    say(t('app.adventure.sweetStrongTake'), 3000)
    return
  }
  lay(held.value, i)
}

const sweet = computed(() => current.value.quality === 'sweet')
function lay(cardId: string, step: number) {
  if (phase.value !== 'play') return
  touched()
  held.value = null
  if (step !== wanted.value) {
    // another step: not its turn yet (no mistake)
    say(t('app.adventure.sweetStrongNotHere'), 3000)
    return
  }
  if (!riddleCheck(current.value, placed.value, cardId)) {
    mistakes.value++
    play('wrong')
    mark(step, 'bad')
    bounce.value = cardId
    later(() => (bounce.value = null), 600)
    say(t(sweet.value ? 'app.adventure.sweetStrongWrongSweet' : 'app.adventure.sweetStrongWrongStrong'), 3600)
    return
  }
  placed.value++
  progress.mark()
  play('right')
  mark(step, 'good')
  say(t(sweet.value ? 'app.adventure.sweetStrongRightSweet' : 'app.adventure.sweetStrongRightStrong'), 2600)
  if (placed.value >= current.value.cards.length) endRound()
}

function endRound() {
  phase.value = 'between'
  later(() => say(t('app.adventure.sweetStrongRoundDone'), 0), 900)
  later(() => {
    if (round.value >= props.game.rounds.length - 1) {
      // the end: the honey and the lion shine side by side, then the riddle as the verse
      phase.value = 'final'
      say('', 1)
      play('star')
      later(() => (finished.value = true), 2600)
      return
    }
    round.value++
    placed.value = 0
    phase.value = 'play'
    say('', 1)
  }, 2800)
}

function helpMe() {
  touched()
  if (phase.value !== 'play') return
  helping.value = true
  say(t('app.adventure.sweetStrongHelpGo'), 4200)
}

// ---- looks
const stepStyle = (i: number) => {
  const b = riddleStepBox(props.game, i)
  return { left: `${b.x - b.w / 2}%`, top: `${b.y - b.h / 2}%`, width: `${b.w}%`, height: `${b.h}%` }
}
const topLabelStyle = computed(() => {
  const b = riddleStepBox(props.game, current.value.cards.length - 1)
  return { left: `${b.x}%`, top: `${b.y - b.h / 2}%` }
})
const roundDone = computed(() => phase.value !== 'play' && placed.value >= current.value.cards.length)
const ghostImage = computed(() => (drag.card ? src(riddleCard(current.value, drag.card)?.image ?? '') : ''))
</script>

<template lang="pug">
  div(class="gm" :class="{ still }")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(ref="wrapEl" class="gm-wrap" @pointermove="move" @pointerup="up" @pointercancel="up" @contextmenu.prevent)
        div(
          ref="fieldEl"
          class="gm-field"
          :style="{ backgroundImage: `url(${src(game.background)})`, aspectRatio: String(ratio) }"
          role="group"
          :aria-label="t('app.adventure.sweetStrongField')"
        )
          template(v-if="phase !== 'final'")
            span(class="gm-top" :style="topLabelStyle") {{ current.ladderLabel }}
            button(
              v-for="i in steps"
              :key="`${round}-${i}`"
              type="button"
              class="gm-step"
              :class="{ want: wanted === i, full: !!onStep(i) }"
              :data-step="i"
              :style="stepStyle(i)"
              :aria-label="t('app.adventure.sweetStrongStep', { n: i + 1, total: current.cards.length }) + (onStep(i) ? `: ${onStep(i)?.label}` : '')"
              @click="stepClick(i)"
            )
              GameImage(:src="game.step" :ratio="game.stepRatio" colour="#8a6a3e" :label="'stufe'")
              span(v-if="onStep(i)" class="gm-on" :data-on="onStep(i)?.id")
                span(v-if="roundDone && i === current.cards.length - 1" class="gm-glow" aria-hidden="true")
                  GameImage(:src="game.glow" :ratio="1" colour="#f2d98a" round :label="'glanz'")
                GameImage(:src="onStep(i)?.image ?? ''" :ratio="1" colour="#d9b86a" round :label="onStep(i)?.id ?? ''")
              span(v-if="picked && picked.step === i" class="gm-mark")
                GameMark(:kind="picked.kind")
          div(v-else class="gm-final" data-final="1")
            span(v-for="c in crowns" :key="c.id" class="gm-crown" :data-crown="c.id")
              span(class="gm-glow" aria-hidden="true")
                GameImage(:src="game.glow" :ratio="1" colour="#f2d98a" round :label="'glanz'")
              GameImage(:src="c.image" :ratio="1" colour="#d9b86a" round :label="c.id")
              span(class="gm-cap") {{ c.label }}
        div(v-if="phase !== 'final'" class="gm-tray" role="group" :aria-label="t('app.adventure.sweetStrongCards')")
          button(
            v-for="c in tray"
            :key="c.id"
            type="button"
            class="gm-card"
            :class="{ sel: held === c.id, held: drag.card === c.id && drag.moved >= 8, bounce: bounce === c.id, shine: help === c.id }"
            :data-card="c.id"
            :aria-label="c.label"
            :aria-pressed="held === c.id"
            @pointerdown.prevent="down($event, c.id)"
            @click="cardClick($event, c.id)"
          )
            GameImage(:src="c.image" :ratio="1" colour="#d9b86a" round :label="c.id")
        img(v-if="drag.card && drag.moved >= 8" class="gm-ghost" :src="ghostImage" alt="" :style="{ left: `${drag.x}%`, top: `${drag.y}%` }")
      p(class="gm-count" aria-live="polite") {{ countText }}
      div(class="gm-actions")
        AdvButton(v-if="idle >= IDLE_SECONDS && phase === 'play'" tone="gold" @click="helpMe") {{ t('app.adventure.sweetStrongHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.sweetStrongDone')" @next="emit('done', stars)")
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
  touch-action: none

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
  touch-action: none

.gm-field
  position: relative
  width: 100%
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #8a6a4a
  background-size: cover
  background-position: center

.gm-top
  position: absolute
  transform: translate(-50%, -115%)
  padding: 1px 10px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.95)
  font-weight: 800
  font-size: 1rem
  color: #3f321b
  white-space: nowrap
  pointer-events: none
  z-index: 5

.gm-step
  position: absolute
  display: block
  box-sizing: border-box
  min-height: 44px
  padding: 0
  border: 3px solid transparent
  border-radius: 10px
  background: transparent
  cursor: pointer

  &:focus-visible
    outline: 3px solid #2f6b8a
    outline-offset: 2px

  &.want
    border-style: dashed
    border-color: #f2c46a
    animation: gm-pulse 1300ms ease-in-out infinite

.gm-on
  position: absolute
  left: 50%
  top: 50%
  // measured on the painted step (23.11.2026): the tablet stands on the face of the step, about as wide as half the step
  width: 48%
  transform: translate(-50%, -56%)
  pointer-events: none
  z-index: 2

.gm-glow
  position: absolute
  left: 50%
  top: 50%
  width: 190%
  transform: translate(-50%, -50%)
  pointer-events: none
  z-index: -1

.gm-mark
  position: absolute
  top: -6px
  right: -6px
  pointer-events: none

.gm-final
  position: absolute
  inset: 0
  display: flex
  align-items: center
  justify-content: center
  gap: 8%

.gm-crown
  position: relative
  display: flex
  flex-direction: column
  align-items: center
  width: 26%

.gm-cap
  margin-top: 4px
  padding: 1px 10px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.95)
  font-weight: 800
  font-size: 1rem
  color: #3f321b

.gm-tray
  display: flex
  flex-wrap: wrap
  justify-content: center
  align-items: flex-start
  gap: 10px
  min-height: 84px

.gm-card
  display: block
  box-sizing: border-box
  width: 80px
  min-height: 76px
  padding: 4px
  border: 3px solid #d4a83e
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  cursor: grab
  touch-action: none
  font-family: inherit
  transition: transform 200ms ease

  &:focus-visible
    outline: 3px solid #2f6b8a
    outline-offset: 2px

  &.sel
    border-color: #2f7bd6
    transform: scale(1.08)
    box-shadow: 0 0 0 3px rgba(47, 123, 214, 0.35)

  &.held
    opacity: 0.45

  &.shine
    animation: gm-pulse 1300ms ease-in-out infinite
    box-shadow: 0 0 10px rgba(255, 220, 110, 0.9)

  &.bounce
    animation: gm-bounce 500ms ease

.gm-ghost
  position: absolute
  display: block
  width: 16%
  height: auto
  transform: translate(-50%, -50%)
  pointer-events: none
  z-index: 9999
  filter: drop-shadow(0 6px 6px rgba(40, 25, 5, 0.45))

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
  .gm-card
    transition: none

  .gm-step.want, .gm-card.shine, .gm-card.bounce
    animation: none

@keyframes gm-pulse
  0%, 100%
    opacity: 0.75
  50%
    opacity: 1

@keyframes gm-bounce
  0%, 100%
    transform: translateY(0)
  30%
    transform: translateY(-8px)
  60%
    transform: translateY(2px)

@media (prefers-reduced-motion: reduce)
  .gm-card
    transition: none

  .gm-step.want, .gm-card.shine, .gm-card.bounce
    animation: none
</style>
