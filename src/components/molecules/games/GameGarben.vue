<script setup lang="ts">
/**
 * The sheaves bow (Genesis 37,7: "my sheaf arose and stood; and your sheaves stood round about and bowed to my sheaf"). The harvested field from above; in the middle stands Joseph's sheaf,
 * round it lie eleven sheaves whose ears point every which way. A tap turns a sheaf a step clockwise; when its ears point to Joseph's sheaf it bows (a tick, "This sheaf bows").
 * A tap on a sheaf that bows already: a cross and "It bows already. Leave it so." (a mistake; it stays). When all eleven bow, the round is won. Round 1: one ring, eighth turns;
 * round 2: two rings, twelfth turns (finer). Left/right choose a sheaf, Enter turns it. After fifteen seconds without a tap the button "Help me" turns the next sheaf until it bows.
 * With reduced motion the sheaves turn at once. Nothing is shown by colour alone (tick, cross, words). The arithmetic is `utils/josefNeu.ts`; stars: `josefStars(mistakes)`.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { josefStars, sheafBows, sheafTap, sheafTarget, sheafTaps } from '@/utils/josefNeu'
import type { Pt, SheavesGame } from '@/utils/josefNeu'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: SheavesGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.rounds.reduce((n, r) => n + r.sheaves.length, 0))

const IDLE_SECONDS = 15

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
/** The direction of every sheaf (degrees; it only grows, so that the picture turns on clockwise). */
const angles = ref<number[]>(current.value.sheaves.map((s) => s.start))
const cursor = ref(-1)
const helping = ref(-1)
const crossAt = ref<Pt | null>(null)
const tickAt = ref<Pt | null>(null)
const shake = ref(-1)
const mistakes = ref(0)
const idle = ref(0)
const finished = ref(false)
const between = ref(false)
const allBow = ref(false)
const message = ref('')
let messageSeq = 0
let markSeq = 0
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => josefStars(mistakes.value))
const targets = computed(() => current.value.sheaves.map((s) => sheafTarget(s, current.value.center)))
const bows = computed(() => angles.value.map((a, i) => sheafBows(a, targets.value[i]!, current.value.step)))
const bowCount = computed(() => bows.value.filter(Boolean).length)

function say(text: string, ms = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}
function flash(kind: 'good' | 'bad', at: Pt) {
  const id = ++markSeq
  tickAt.value = kind === 'good' ? at : null
  crossAt.value = kind === 'bad' ? at : null
  later(() => {
    if (markSeq !== id) return
    tickAt.value = null
    crossAt.value = null
  }, 900)
}

function idleLoop() {
  if (!between.value && !finished.value && helping.value < 0) idle.value += 0.25
  later(idleLoop, 250)
}
later(idleLoop, 250)

/** A tap on sheaf `i`. */
function tap(i: number, helped = false) {
  if (between.value || finished.value) return
  if (helping.value >= 0 && !helped) return
  const s = current.value.sheaves[i]
  if (!s) return
  idle.value = 0
  const res = sheafTap(angles.value[i]!, targets.value[i]!, current.value.step)
  if (res.verdict === 'already') {
    mistakes.value++
    play('wrong')
    flash('bad', s)
    shake.value = i
    later(() => {
      if (shake.value === i) shake.value = -1
    }, 600)
    say(t('app.adventure.sheavesBowAlready'), 2800)
    return
  }
  // the picture turns on clockwise: the angle grows by one step
  angles.value = angles.value.map((a, k) => (k === i ? a + current.value.step : a))
  if (res.bows) {
    progress.mark()
    play('snap')
    flash('good', s)
    say(t(helped ? 'app.adventure.sheavesBowHelped' : 'app.adventure.sheavesBowRight', { n: bowCount.value, total: current.value.sheaves.length }), 2000)
    if (bows.value.every(Boolean)) endRound()
  } else play('tap')
}

function endRound() {
  between.value = true
  cursor.value = -1
  helping.value = -1
  later(() => {
    allBow.value = true
    play('right')
    say(t('app.adventure.sheavesBowRoundDone'), 0)
  }, 700)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 4400)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 3400)
  later(() => {
    round.value++
    angles.value = current.value.sheaves.map((s) => s.start)
    allBow.value = false
    between.value = false
    idle.value = 0
    message.value = ''
  }, 4800)
}

function onKey(e: KeyboardEvent) {
  if (between.value || finished.value) return
  const n = current.value.sheaves.length
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault()
    idle.value = 0
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1
    cursor.value = cursor.value < 0 ? (step > 0 ? 0 : n - 1) : (cursor.value + step + n) % n
    say(t('app.adventure.sheavesBowSheaf', { n: cursor.value + 1 }) + (bows.value[cursor.value] ? ` (${t('app.adventure.sheavesBowBowing')})` : ''), 0)
    return
  }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    if (cursor.value < 0) {
      cursor.value = 0
      say(t('app.adventure.sheavesBowKeys'), 0)
      return
    }
    tap(cursor.value)
  }
}

/** The button for those who are stuck: the next sheaf that does not bow yet turns until it bows. */
function helpMe() {
  const i = bows.value.findIndex((b) => !b)
  if (i < 0) return
  idle.value = 0
  helping.value = i
  say(t('app.adventure.sheavesBowHelping'), 0)
  const k = sheafTaps(angles.value[i]!, targets.value[i]!, current.value.step)
  for (let j = 0; j < k; j++)
    later(() => {
      if (helping.value === i) tap(i, true)
      if (j === k - 1) helping.value = -1
    }, 500 * (j + 1))
}

// ---- looks
const sheafStyle = (i: number) => {
  const s = current.value.sheaves[i]!
  const w = props.game.sheafW
  return { left: `${s.x - w / 2}%`, top: `${s.y - w / 2}%`, width: `${w}%`, height: `${w}%` }
}
const josefStyle = computed(() => {
  const c = current.value.center
  const w = props.game.josefW
  return { left: `${c.x - w / 2}%`, top: `${c.y - w / 2}%`, width: `${w}%` }
})
const markStyle = (p: Pt) => ({ left: `${p.x}%`, top: `${p.y}%` })
const shownAngle = (i: number) => angles.value[i]!
</script>

<template lang="pug">
  div(class="gg")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gg-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gg-hint") {{ current.hint }}
      div(
        class="gg-field"
        :class="{ bow: allBow }"
        :style="{ backgroundImage: `url(${src(game.field)})` }"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.sheavesBowField')"
        @keydown="onKey"
      )
        div(class="gg-josef" :style="josefStyle" role="img" :aria-label="t('app.adventure.sheavesBowJosef')")
          GameImage(:src="game.josef" colour="#d9b45a" label="josef")
        button(
          v-for="(s, i) in current.sheaves"
          :key="`s-${round}-${i}`"
          type="button"
          class="gg-sheaf"
          :class="{ bows: bows[i], cursor: cursor === i, help: helping === i, shake: shake === i }"
          :style="sheafStyle(i)"
          :data-sheaf="i"
          :aria-label="t('app.adventure.sheavesBowSheaf', { n: i + 1 }) + (bows[i] ? `, ${t('app.adventure.sheavesBowBowing')}` : '')"
          tabindex="-1"
          @click="tap(i)"
        )
          span(class="gg-turn" :style="{ transform: `rotate(${shownAngle(i)}deg)` }")
            GameImage(:src="s.image" colour="#d9b45a" :label="`garbe-${i + 1}`")
        span(v-if="crossAt" class="gg-mark" :style="markStyle(crossAt)")
          GameMark(kind="bad")
        span(v-if="tickAt" class="gg-mark" :style="markStyle(tickAt)")
          GameMark(kind="good")
      p(class="gg-count" aria-live="polite") {{ t('app.adventure.sheavesBowCount', { n: bowCount, total: current.sheaves.length }) }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between && helping < 0" tone="gold" @click="helpMe") {{ t('app.adventure.sheavesBowHelp') }}
      p(class="gg-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.sheavesBowDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gg
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
  color: #5a4a2c

.gg-hint
  margin: 0
  text-align: center
  font-weight: 700
  font-size: 1rem
  color: #5a4a2c

.gg-field
  position: relative
  width: 100%
  aspect-ratio: 1
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #d8bd73
  background-size: cover
  background-position: center

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

.gg-josef
  position: absolute
  pointer-events: none
  filter: drop-shadow(0 4px 4px rgba(40, 25, 5, 0.35))

.gg-sheaf
  position: absolute
  display: block
  min-width: 44px
  min-height: 44px
  padding: 0
  border: 3px solid transparent
  border-radius: 50%
  background: transparent
  cursor: pointer

  &.cursor
    border-color: #fff6dc
    box-shadow: 0 0 0 3px rgba(40, 25, 5, 0.55)

  &.help
    border-color: #fff6dc
    border-style: dashed

  &.bows
    background: rgba(255, 246, 220, 0.18)

  &.shake .gg-turn
    animation: gg-shake 500ms ease-in-out

.gg-turn
  display: block
  width: 100%
  height: 100%
  transition: transform 350ms ease-out
  filter: drop-shadow(0 3px 3px rgba(40, 25, 5, 0.35))

// at the end all sheaves bow a little deeper toward the middle
.gg-field.bow .gg-sheaf.bows .gg-turn
  animation: gg-bow 900ms ease-in-out 2

.gg-mark
  position: absolute
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 30

.gg-count
  margin: 0
  align-self: center
  padding: 2px 14px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  color: #5a4a2c

.gg-fb
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

@keyframes gg-shake
  0%, 100%
    translate: 0 0
  25%
    translate: -4px 0
  75%
    translate: 4px 0

@keyframes gg-bow
  0%, 100%
    scale: 1
  50%
    scale: 0.88

// less motion: the sheaves turn at once, nothing shakes or bows
@media (prefers-reduced-motion: reduce)
  .gg-turn
    transition: none

  .gg-sheaf.shake .gg-turn, .gg-field.bow .gg-sheaf.bows .gg-turn
    animation: none
</style>
