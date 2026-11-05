<script setup lang="ts">
/**
 * The wine press (Genesis 40,11: "I took the grapes, and pressed them into Pharaoh's cup"). The cupbearer's dream: under the vine stands Pharaoh's golden cup, above it hangs a bunch
 * of grapes. Pressing and holding the grapes (or the button "Press", or Space/Enter held) squeezes them: the juice drops into the cup, faster the longer the press is held. Letting go when the
 * cup is full to the brim fills it ("The cup is full!"); letting go earlier is fine, the child presses again. Holding too long lets it run over: a cross, "It ran over!" (a mistake),
 * the cup is emptied and filled again. Round 1: one cup, the juice runs slowly; round 2: two cups, the juice runs faster. After fifteen seconds without a press the button "Help me"
 * fills the cup by itself and lets go at the right moment. With reduced motion no drops fall. Nothing is shown by colour alone (tick, cross, words, the fill in words).
 * The arithmetic is `utils/josefNeu.ts`; stars: `josefStars(mistakes)`.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { josefStars, winePress, wineRelease, wineStage } from '@/utils/josefNeu'
import type { WinePressGame } from '@/utils/josefNeu'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: WinePressGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.rounds.reduce((n, r) => n + r.cups, 0))

const TICK = 0.05
const IDLE_SECONDS = 15

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
/** The cup of this round that is being filled (0, 1, ...). */
const cup = ref(0)
const level = ref(0)
const held = ref(0)
const pressing = ref(false)
const helping = ref(false)
const spilled = ref(false)
const mark = ref<'good' | 'bad' | ''>('')
const mistakes = ref(0)
const idle = ref(0)
const finished = ref(false)
const between = ref(false)
const message = ref('')
let messageSeq = 0
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => josefStars(mistakes.value))
const stage = computed(() => wineStage(level.value, current.value.full))
const percent = computed(() => Math.min(100, Math.round(level.value * 100)))

function say(text: string, ms = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}
function flash(kind: 'good' | 'bad') {
  mark.value = kind
  later(() => {
    if (mark.value === kind) mark.value = ''
  }, 1000)
}

function loop() {
  if (!finished.value && !between.value) {
    if (pressing.value && !spilled.value) {
      const r = winePress(current.value, level.value, held.value, TICK)
      level.value = r.level
      held.value = r.held
      if (helping.value && level.value >= (current.value.full + 1) / 2) release()
      else if (r.over) overflow()
    } else if (!pressing.value && !spilled.value && !helping.value) idle.value += TICK
  }
  later(loop, TICK * 1000)
}
later(loop, TICK * 1000)

function press() {
  if (between.value || finished.value || spilled.value || helping.value) return
  if (!pressing.value) {
    pressing.value = true
    held.value = 0
    idle.value = 0
    play('tap')
  }
}
function release() {
  if (!pressing.value) return
  pressing.value = false
  const helped = helping.value
  helping.value = false
  if (spilled.value || between.value) return
  if (wineRelease(current.value, level.value) === 'full') {
    cupFull(helped)
    return
  }
  if (level.value > 0.02) say(t('app.adventure.winePressMore', { n: percent.value }), 2200)
}
function overflow() {
  pressing.value = false
  spilled.value = true
  mistakes.value++
  play('wrong')
  flash('bad')
  say(t('app.adventure.winePressOver'), 3000)
  later(() => {
    level.value = 0
    held.value = 0
    spilled.value = false
    idle.value = 0
  }, 2200)
}
function cupFull(helped: boolean) {
  progress.mark()
  play('right')
  flash('good')
  say(t(helped ? 'app.adventure.winePressHelped' : 'app.adventure.winePressFull'), 2400)
  between.value = true
  if (cup.value < current.value.cups - 1) {
    later(() => {
      cup.value++
      level.value = 0
      held.value = 0
      between.value = false
      idle.value = 0
      say(t('app.adventure.winePressNextCup'), 2200)
    }, 2400)
    return
  }
  later(() => say(t('app.adventure.winePressRoundDone'), 0), 1200)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 4000)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 3000)
  later(() => {
    round.value++
    cup.value = 0
    level.value = 0
    held.value = 0
    between.value = false
    idle.value = 0
    message.value = ''
  }, 4400)
}

// ---- pointer and keys: hold to press
function down(e: PointerEvent) {
  e.preventDefault()
  ;(e.currentTarget as HTMLElement | null)?.setPointerCapture?.(e.pointerId)
  press()
}
function up() {
  if (!helping.value) release()
}
function onKeyDown(e: KeyboardEvent) {
  if (e.key !== ' ' && e.key !== 'Enter') return
  e.preventDefault()
  if (!e.repeat) press()
}
function onKeyUp(e: KeyboardEvent) {
  if (e.key !== ' ' && e.key !== 'Enter') return
  e.preventDefault()
  up()
}
/** The button for those who are stuck: the cupbearer presses by himself and lets go in the middle of the right moment. */
function helpMe() {
  if (between.value || spilled.value || pressing.value) return
  idle.value = 0
  helping.value = true
  pressing.value = true
  held.value = 0
  say(t('app.adventure.winePressHelping'), 0)
}
onBeforeUnmount(() => {
  pressing.value = false
})

// ---- looks
const cupStyle = computed(() => {
  const c = props.game.cup
  return { left: `${c.x - c.w / 2}%`, top: `${c.y - ((c.w / props.game.cupRatio) * props.game.ratio)}%`, width: `${c.w}%` }
})
const grapesStyle = computed(() => {
  const g = props.game.grapes
  return { left: `${g.x - g.w / 2}%`, top: `${g.y - ((g.w / g.ratio) * props.game.ratio) / 2}%`, width: `${g.w}%` }
})
const dropStyle = computed(() => {
  const c = props.game.cup
  const g = props.game.grapes
  const from = g.y + ((g.w / g.ratio) * props.game.ratio) / 2 - 2
  const to = c.y - ((c.w / props.game.cupRatio) * props.game.ratio) * 0.7
  return { left: `${c.x - 2.5}%`, top: `${from}%`, width: '5%', '--from': `${from}%`, '--to': `${Math.max(from, to)}%` }
})
/** The spilled juice lies on the table round the foot of the cup (the picture is 2 : 1, behind the cup). */
const puddleStyle = computed(() => {
  const c = props.game.cup
  const w = c.w * 0.9
  return { left: `${c.x - w / 2}%`, top: `${c.y - (w / 2) * props.game.ratio * 0.75}%`, width: `${w}%` }
})
const markStyle = computed(() => ({ left: `${props.game.cup.x}%`, top: `${props.game.cup.y - ((props.game.cup.w / props.game.cupRatio) * props.game.ratio) * 1.05}%` }))
</script>

<template lang="pug">
  div(class="gw")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gw-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gw-hint") {{ current.hint }}
      div(
        class="gw-field"
        :style="{ backgroundImage: `url(${src(game.background)})`, aspectRatio: String(game.ratio) }"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.winePressField')"
        @keydown="onKeyDown"
        @keyup="onKeyUp"
      )
        div(class="gw-puddle" v-if="spilled" :style="puddleStyle")
          GameImage(:src="game.puddle" colour="#7a1d2c" label="lache")
        div(class="gw-cup" :style="cupStyle" role="meter" :aria-label="t('app.adventure.winePressCup')" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="percent" :data-stage="stage")
          GameImage(:src="game.cups[stage]" :ratio="game.cupRatio" colour="#d4a83e" :label="`becher-${stage}`")
        div(v-if="pressing" class="gw-drop" :style="dropStyle")
          GameImage(:src="game.drop" colour="#7a1d2c" label="tropfen")
        button(
          type="button"
          class="gw-grapes"
          :class="{ pressing, help: helping }"
          :style="grapesStyle"
          :aria-label="t('app.adventure.winePressGrapes')"
          tabindex="-1"
          @pointerdown="down"
          @pointerup="up"
          @pointercancel="up"
          @pointerleave="up"
          @contextmenu.prevent
        )
          GameImage(:src="game.grapes.image" :ratio="game.grapes.ratio" colour="#4b2a5a" label="trauben")
        span(v-if="mark" class="gw-mark" :style="markStyle")
          GameMark(:kind="mark")
      p(class="gw-count" aria-live="polite") {{ t('app.adventure.winePressCount', { n: percent, cup: cup + 1, cups: current.cups }) }}
      button(
        type="button"
        class="gw-press"
        :class="{ pressing }"
        :disabled="between || spilled || helping"
        @pointerdown="down"
        @pointerup="up"
        @pointercancel="up"
        @pointerleave="up"
        @keydown="onKeyDown"
        @keyup="onKeyUp"
        @contextmenu.prevent
      ) {{ t('app.adventure.winePressHold') }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between && !helping && !spilled" tone="gold" @click="helpMe") {{ t('app.adventure.winePressHelp') }}
      p(class="gw-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.winePressDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gw
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #ece0c2
  box-shadow: inset 0 0 18px rgba(90, 70, 30, 0.25)
  user-select: none
  -webkit-user-select: none

.gw-round
  margin: 0
  align-self: center
  padding: 1px 12px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.92)
  font-weight: 800
  font-size: 1rem
  letter-spacing: 0.06em
  text-transform: uppercase
  color: #5a4a2c

.gw-hint
  margin: 0
  text-align: center
  font-weight: 700
  font-size: 1rem
  color: #5a4a2c

.gw-field
  position: relative
  width: 100%
  max-width: 420px
  align-self: center
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #e9d29a
  background-size: cover
  background-position: center

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

.gw-cup, .gw-puddle, .gw-drop
  position: absolute
  pointer-events: none

.gw-cup
  filter: drop-shadow(0 4px 4px rgba(40, 25, 5, 0.35))

.gw-drop
  animation: gw-fall 420ms linear infinite

.gw-grapes
  position: absolute
  padding: 0
  border: 3px solid transparent
  border-radius: 18px
  background: transparent
  cursor: pointer
  min-width: 44px
  min-height: 44px
  touch-action: none
  transition: transform 160ms ease-out
  transform-origin: 50% 0

  &.pressing
    transform: scale(0.94, 0.86)

  &.help
    border-color: #fff6dc
    border-style: dashed

.gw-mark
  position: absolute
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 30

.gw-count
  margin: 0
  align-self: center
  padding: 2px 14px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  color: #5a4a2c

.gw-press
  align-self: center
  min-width: 180px
  min-height: 52px
  padding: 8px 22px
  border-radius: 999px
  border: 3px solid #8a5a2b
  background: #f6e6b8
  font-weight: 800
  font-size: 1.05rem
  color: #4a3218
  touch-action: none
  cursor: pointer

  &.pressing
    background: #e8c977
    transform: translateY(2px)

  &:disabled
    opacity: 0.6

.gw-fb
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

@keyframes gw-fall
  0%
    top: var(--from)
    opacity: 1
  100%
    top: var(--to)
    opacity: 0.6

// less motion: no drops fall, the grapes do not squash
@media (prefers-reduced-motion: reduce)
  .gw-drop
    display: none

  .gw-grapes
    transition: none

    &.pressing
      transform: none
</style>
