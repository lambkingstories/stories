<script setup lang="ts">
/**
 * Leap and praise (Acts 3,8: "walking, and leaping, and praising God"). The temple wall seen from the side (a wide picture, the camera moves along with the man); the stairs are
 * built from two painted step pictures after the data (a low step, a high step, a landing). The man who could never walk stands at the bottom. Below are two big buttons with pictures:
 * "small leap" and "big leap" (round 2 also "praise", two raised hands). The fitting button: he leaps up (a soft arc), a drum sound, a little tick. The wrong one: before a high step he only
 * hops on the spot, before a low one he leaps up and lands on the same step; on a landing he should praise God: a cross and "Look at the step!", a mistake, never a fall.
 * There is no time pressure. Keys: right arrow small, up arrow big, Enter praise (the buttons themselves also work with Tab and Enter). "Help me" after fifteen seconds marks the right button.
 * Less motion: he stands on the next step at once. Nothing is drawn: wall, steps and man are pictures. Stars: `osterStars(mistakes)`.
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
import { osterStars } from '@/utils/osternGames'
import { hopLevels, hopNeed, hopPress } from '@/utils/pfingstenNeuB'
import type { HopChoice, HopGame } from '@/utils/pfingstenNeuB'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: HopGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.rounds.reduce((s, r) => s + r.steps.length, 0))

const IDLE_SECONDS = 15
const LEAP_MS = 520
const still = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const steps = computed(() => current.value.steps)
const levels = computed(() => hopLevels(steps.value))
/** The step the man stands on (-1: on the ground before the stairs). */
const pos = ref(-1)
/** What the man does now: stand, leap up, hop on the spot (`hop`), leap and land again (`bounce`), praise. */
const pose = ref<'stand' | 'leap' | 'hop' | 'bounce' | 'praise'>('stand')
const busy = ref(false)
const mistakes = ref(0)
const idle = ref(0)
const helpBtn = ref<HopChoice | null>(null)
const mark = ref<'good' | 'bad' | null>(null)
const between = ref(false)
const finished = ref(false)
const message = ref('')
let messageSeq = 0
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => osterStars(mistakes.value))
const hasPraise = computed(() => steps.value.includes('L'))
const next = computed(() => steps.value[pos.value + 1])

function say(text: string, ms = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}
function idleLoop() {
  if (!between.value && !finished.value && !busy.value) idle.value += 0.25
  later(idleLoop, 250)
}
later(idleLoop, 250)

/** A button is pressed. */
function press(c: HopChoice) {
  if (between.value || finished.value || busy.value || !next.value) return
  idle.value = 0
  helpBtn.value = null
  const verdict = hopPress(next.value, c)
  busy.value = true
  if (verdict !== 'ok') {
    mistakes.value++
    pose.value = verdict === 'low' ? 'hop' : verdict === 'praise' ? 'praise' : 'bounce'
    mark.value = 'bad'
    play('wrong')
    say(t(verdict === 'landing' ? 'app.adventure.hopLanding' : 'app.adventure.hopLook'), 2800)
    later(() => {
      pose.value = 'stand'
      mark.value = null
      busy.value = false
    }, still ? 300 : LEAP_MS + 200)
    return
  }
  const landing = next.value === 'L'
  pose.value = landing ? 'praise' : 'leap'
  if (landing) say(t('app.adventure.hopPraised'), 1600)
  play(landing ? 'found' : 'tap')
  // on a landing he praises first, then walks on to it
  later(() => {
    pos.value++
    progress.mark()
    mark.value = 'good'
    later(() => (mark.value = null), 500)
    pose.value = 'stand'
    busy.value = false
    if (pos.value >= steps.value.length - 1) endRound()
  }, still ? 60 : landing ? 900 : LEAP_MS)
}

function endRound() {
  between.value = true
  pose.value = 'praise'
  later(() => play('right'), 200)
  say(t('app.adventure.hopTop'), 0)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 2400)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 1300)
  later(() => {
    round.value++
    pos.value = -1
    pose.value = 'stand'
    between.value = false
    idle.value = 0
    message.value = ''
  }, 2800)
}

function onKey(e: KeyboardEvent) {
  const map: Record<string, HopChoice> = { ArrowRight: 'small', ArrowUp: 'big', Enter: 'praise' }
  const c = map[e.key]
  if (!c || (c === 'praise' && !hasPraise.value)) return
  e.preventDefault()
  press(c)
}

/** "Help me": the fitting button is marked and the next step is named. */
function helpMe() {
  idle.value = 0
  if (!next.value) return
  helpBtn.value = hopNeed(next.value)
  say(t(next.value === 'h' ? 'app.adventure.hopHelpHigh' : next.value === 'n' ? 'app.adventure.hopHelpLow' : 'app.adventure.hopHelpLanding'), 4000)
}

// ---- looks: the world is the temple picture (3:1); the field shows half of it (3:2) and follows the man
const colW = computed(() => (props.game.to - props.game.from) / Math.max(1, steps.value.length))
const colX = (k: number) => props.game.from + k * colW.value
const GROUND = 94
const topOf = (k: number) => GROUND - (k < 0 ? 0 : levels.value[k]!) * props.game.unit
/** The blocks of a column, from the top down: the step picture on top, low blocks below it down to the ground. */
function blocks(k: number) {
  const s = steps.value[k]!
  const level = levels.value[k]!
  const out: { top: number; h: number; pic: string }[] = []
  let y = topOf(k)
  if (s === 'h') {
    out.push({ top: y, h: 2 * props.game.unit, pic: props.game.high })
    y += 2 * props.game.unit
  }
  const rest = s === 'h' ? level - 2 : level
  for (let i = 0; i < Math.max(0, rest); i++) {
    out.push({ top: y, h: props.game.unit, pic: props.game.low })
    y += props.game.unit
  }
  if (!out.length) out.push({ top: GROUND - props.game.unit * 0.4, h: props.game.unit * 0.4, pic: props.game.low })
  return out
}
const manW = computed(() => (props.game.manH * 2) / 3 / 3)
// before the stairs he stands half a step to the left, but always wholly inside the picture
const manX = computed(() => (pos.value < 0 ? Math.max(props.game.from - colW.value / 2, manW.value / 2 + 0.5) : colX(pos.value) + colW.value / 2))
const manBottom = computed(() => 100 - topOf(pos.value))
const cam = computed(() => Math.min(50, Math.max(0, manX.value - 17.5)))
const manPic = computed(() => (pose.value === 'praise' ? props.game.man.praise : pose.value === 'stand' ? props.game.man.stand : props.game.man.jump))
const choices = computed<HopChoice[]>(() => (hasPraise.value ? ['small', 'big', 'praise'] : ['small', 'big']))
const btnPic = (c: HopChoice) => props.game.buttons[c]
const stepLabel = computed(() => (next.value ? t(next.value === 'h' ? 'app.adventure.hopNextHigh' : next.value === 'n' ? 'app.adventure.hopNextLow' : 'app.adventure.hopNextLanding') : ''))
</script>

<template lang="pug">
  div(class="gm" :class="{ still }")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(class="gm-field" role="group" tabindex="0" :aria-label="t('app.adventure.hopField')" @keydown="onKey")
        div(class="gm-world" :style="{ transform: `translateX(-${cam}%)`, backgroundImage: `url(${src(game.temple)})` }")
          template(v-for="(s, k) in steps" :key="`col-${round}-${k}`")
            span(
              v-for="(b, bi) in blocks(k)"
              :key="`b-${k}-${bi}`"
              class="gm-block"
              :class="{ landing: s === 'L', next: k === pos + 1 }"
              :data-step="bi === 0 ? `${k}-${s}` : undefined"
              :style="{ left: `${colX(k)}%`, width: `${colW}%`, top: `${b.top}%`, height: `${b.h}%` }"
              aria-hidden="true"
            )
              GameImage(:src="b.pic" :ratio="2.67" colour="#e3d6b8" :label="b.pic === game.high ? 'stufe-hoch' : 'stufe-niedrig'")
          div(
            class="gm-man"
            :class="pose"
            :style="{ left: `${manX}%`, bottom: `${manBottom}%`, width: `${manW}%` }"
            role="img"
            :aria-label="t('app.adventure.hopMan', { n: pos + 1, total: steps.length })"
          )
            GameImage(:src="manPic" :ratio="0.667" colour="#c9b48a" label="mann")
            span(v-if="mark" class="gm-mark")
              GameMark(:kind="mark")
      p(class="gm-next" aria-live="polite") {{ stepLabel }}
      div(class="gm-buttons" role="group" :aria-label="t('app.adventure.hopButtons')")
        button(
          v-for="c in choices"
          :key="c"
          type="button"
          class="gm-btn"
          :class="{ help: helpBtn === c }"
          :data-choice="c"
          :disabled="between || busy"
          @click="press(c)"
        )
          span(class="gm-btn-pic")
            GameImage(:src="btnPic(c)" :ratio="1" colour="#f2c46a" :label="`knopf-${c}`")
          span(class="gm-btn-text") {{ t(`app.adventure.hop${c === 'small' ? 'Small' : c === 'big' ? 'Big' : 'Praise'}`) }}
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.hopCount', { n: pos + 1, total: steps.length }) }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between" tone="gold" @click="helpMe") {{ t('app.adventure.hopHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.hopDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #ead9b6
  box-shadow: inset 0 0 18px rgba(90, 60, 20, 0.25)
  user-select: none
  -webkit-user-select: none

.gm-round, .gm-count, .gm-next
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

.gm-next:empty
  display: none

.gm-hint
  margin: 0
  text-align: center
  font-weight: 700
  font-size: 1rem
  color: #5f4f35

.gm-field
  position: relative
  width: 100%
  aspect-ratio: 3 / 2
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #cdb98f

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

// the world is twice as wide as the field (the temple picture is 3:1)
.gm-world
  position: absolute
  left: 0
  top: 0
  width: 200%
  height: 100%
  background-size: 100% 100%
  transition: transform 500ms ease-in-out

.gm-block
  position: absolute
  display: block
  overflow: hidden

  :deep(.gi), :deep(img), :deep(.gi-stand)
    width: 100%
    height: 100%

  :deep(img)
    object-fit: fill

.gm-man
  position: absolute
  display: block
  transform: translateX(-50%)
  z-index: 3
  transition: left 480ms ease-out, bottom 480ms cubic-bezier(0.2, 1.6, 0.5, 1)
  filter: drop-shadow(0 4px 4px rgba(40, 25, 5, 0.35))

  &.hop
    animation: gm-hop 420ms ease-out

  &.bounce
    animation: gm-up 560ms ease-out

.gm-mark
  position: absolute
  top: -10px
  right: -24px
  display: block

.gm-buttons
  display: flex
  justify-content: center
  gap: 10px

.gm-btn
  display: flex
  flex-direction: column
  align-items: center
  gap: 2px
  min-width: 92px
  min-height: 92px
  padding: 6px 8px
  border: 3px solid #d4a83e
  border-radius: 16px
  background: rgba(255, 246, 220, 0.96)
  font-weight: 800
  font-size: 1rem
  color: #4f3a28
  cursor: pointer

  &.help
    outline: 4px dashed #2f6b8a
    outline-offset: 3px

  &:disabled
    opacity: 0.7

.gm-btn-pic
  width: 56px
  display: block

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

@keyframes gm-hop
  0%, 100%
    transform: translate(-50%, 0)
  40%
    transform: translate(-50%, -8%)

@keyframes gm-up
  0%, 100%
    transform: translate(-50%, 0)
  45%
    transform: translate(-50%, -38%)

// less motion: he stands on the next step at once, the camera jumps, nothing hops
.still
  .gm-world, .gm-man
    transition: none

  .gm-man.hop, .gm-man.bounce
    animation: none

@media (prefers-reduced-motion: reduce)
  .gm-world, .gm-man
    transition: none

  .gm-man.hop, .gm-man.bounce
    animation: none
</style>
