<script setup lang="ts">
/**
 * Embrace (Genesis 45,14-15: "he fell upon his brother Benjamin's neck, and wept ... Moreover he kissed all his brethren"). Joseph's hall in Egypt: the brothers stand there frightened,
 * because Joseph has just said "I am Joseph". The child leads Joseph: a tap on a brother, and Joseph walks to him and embraces him; the frightened face becomes glad (a tick).
 * Benjamin comes first: a tap on another brother before Benjamin is a cross and "First go to Benjamin, the youngest!" (a mistake). Round 1: Benjamin and four brothers, Benjamin has a ring;
 * round 2: all eleven in two rows, and Benjamin must be found without a ring. Left/right choose a brother, Enter leads Joseph to him. After fifteen seconds without a tap the button
 * "Help me" leads Joseph to the next brother. With reduced motion Joseph is there at once. Nothing is shown by colour alone (tick, cross, words).
 * The arithmetic is `utils/josefNeu.ts`; stars: `josefStars(mistakes)`.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { embraceNext, embraceSpot, embraceTap, figureWidth, josefDist, josefStars } from '@/utils/josefNeu'
import type { EmbraceBrother, EmbraceGame, Pt } from '@/utils/josefNeu'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: EmbraceGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.rounds.reduce((n, r) => n + r.brothers.length, 0))

const TICK = 0.05
const IDLE_SECONDS = 15
const reduced = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const glad = ref<string[]>([])
const gladSet = computed(() => new Set(glad.value))
const josef = ref<Pt>({ ...current.value.start })
const goingTo = ref('')
const facing = ref(1)
const cursor = ref(-1)
const helpId = ref('')
const crossAt = ref<Pt | null>(null)
const tickAt = ref<Pt | null>(null)
const shake = ref('')
const mistakes = ref(0)
const idle = ref(0)
const finished = ref(false)
const between = ref(false)
const message = ref('')
let messageSeq = 0
let markSeq = 0
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => josefStars(mistakes.value))

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
const headOf = (b: EmbraceBrother): Pt => ({ x: b.x, y: b.y - b.h * 0.9 })

function loop() {
  if (!finished.value && !between.value) {
    if (goingTo.value) {
      const b = current.value.brothers.find((x) => x.id === goingTo.value)!
      const to = embraceSpot(props.game, b)
      const d = josefDist(josef.value, to, props.game.ratio)
      const step = props.game.speed * TICK
      if (reduced || d <= step) {
        josef.value = to
        arrive(b)
      } else {
        const k = step / d
        facing.value = to.x >= josef.value.x ? 1 : -1
        josef.value = { x: josef.value.x + (to.x - josef.value.x) * k, y: josef.value.y + (to.y - josef.value.y) * k }
      }
    } else if (!helpId.value) idle.value += TICK
  }
  later(loop, TICK * 1000)
}
later(loop, TICK * 1000)

function tap(id: string, helped = false) {
  if (between.value || finished.value || goingTo.value) return
  const b = current.value.brothers.find((x) => x.id === id)
  if (!b) return
  idle.value = 0
  const verdict = embraceTap(current.value, gladSet.value, id)
  if (verdict === 'glad') {
    say(t('app.adventure.embrace2Already', { name: b.name }), 2000)
    return
  }
  if (verdict === 'benjamin') {
    mistakes.value++
    play('wrong')
    flash('bad', headOf(b))
    shake.value = id
    later(() => {
      if (shake.value === id) shake.value = ''
    }, 600)
    say(t('app.adventure.embrace2Benjamin'), 3000)
    return
  }
  if (!helped) helpId.value = ''
  goingTo.value = id
  play('tap')
}

function arrive(b: EmbraceBrother) {
  goingTo.value = ''
  helpId.value = ''
  glad.value = [...glad.value, b.id]
  progress.mark()
  play('snap')
  flash('good', headOf(b))
  say(t(b.benjamin ? 'app.adventure.embrace2BenjaminGlad' : 'app.adventure.embrace2Glad', { name: b.name }), 2400)
  if (glad.value.length >= current.value.brothers.length) endRound()
}

function endRound() {
  between.value = true
  cursor.value = -1
  later(() => play('right'), 600)
  later(() => say(t('app.adventure.embrace2RoundDone'), 0), 1200)
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
    glad.value = []
    josef.value = { ...current.value.start }
    between.value = false
    idle.value = 0
    message.value = ''
  }, 4800)
}

const order = computed(() => current.value.brothers.map((b, i) => ({ b, i })).filter(({ b }) => !gladSet.value.has(b.id)).sort((a, b) => a.b.x - b.b.x || a.b.y - b.b.y).map((x) => x.i))
function onKey(e: KeyboardEvent) {
  if (between.value || finished.value) return
  const list = order.value
  if (!list.length) return
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    e.preventDefault()
    idle.value = 0
    const at = list.indexOf(cursor.value)
    const step = e.key === 'ArrowRight' ? 1 : -1
    cursor.value = list[at < 0 ? (step > 0 ? 0 : list.length - 1) : (at + step + list.length) % list.length]!
    say(current.value.brothers[cursor.value]!.name, 0)
    return
  }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    if (cursor.value < 0 || !list.includes(cursor.value)) {
      cursor.value = list[0]!
      say(`${current.value.brothers[cursor.value]!.name}. ${t('app.adventure.embrace2Keys')}`, 0)
      return
    }
    tap(current.value.brothers[cursor.value]!.id)
  }
}

/** The button for those who are stuck: Joseph goes to Benjamin, or to the nearest brother who is still frightened. */
function helpMe() {
  const b = embraceNext(current.value, gladSet.value, josef.value, props.game.ratio)
  if (!b) return
  idle.value = 0
  helpId.value = b.id
  say(t('app.adventure.embrace2Helping', { name: b.name }), 2400)
  later(() => {
    if (helpId.value === b.id) tap(b.id, true)
  }, 1200)
}

// ---- looks
function figStyle(b: EmbraceBrother) {
  const w = figureWidth(props.game, b.h)
  return { left: `${b.x - w / 2}%`, top: `${b.y - b.h}%`, width: `${w}%`, zIndex: Math.round(b.y * 10) }
}
const josefStyle = computed(() => {
  const w = figureWidth(props.game, props.game.josefH)
  return { left: `${josef.value.x - w / 2}%`, top: `${josef.value.y - props.game.josefH}%`, width: `${w}%`, zIndex: Math.round(josef.value.y * 10) + 5 }
})
</script>

<template lang="pug">
  div(class="gu")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gu-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gu-hint") {{ current.hint }}
      div(
        class="gu-field"
        :style="{ backgroundImage: `url(${src(game.background)})`, aspectRatio: String(game.ratio) }"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.embrace2Field')"
        @keydown="onKey"
      )
        button(
          v-for="(b, i) in current.brothers"
          :key="`b-${round}-${b.id}`"
          type="button"
          class="gu-bro"
          :class="{ glad: gladSet.has(b.id), ring: current.showBenjamin && b.benjamin && !gladSet.has(b.id), cursor: cursor === i, help: helpId === b.id, shake: shake === b.id }"
          :style="figStyle(b)"
          :data-brother="b.id"
          :aria-label="`${b.name}: ${t(gladSet.has(b.id) ? 'app.adventure.embrace2IsGlad' : 'app.adventure.embrace2IsScared')}`"
          tabindex="-1"
          @click="tap(b.id)"
        )
          span(class="gu-pic" :class="{ flip: b.flip }")
            GameImage(:src="gladSet.has(b.id) ? b.glad : b.scared" :ratio="game.figureRatio" colour="#b98b5a" :label="b.id")
        div(class="gu-josef" :class="{ walking: !!goingTo }" :style="josefStyle" role="img" :aria-label="t('app.adventure.embrace2Josef')")
          span(class="gu-pic" :class="{ flip: facing < 0 }")
            GameImage(:src="game.josef" :ratio="game.figureRatio" colour="#efe6cf" label="josef")
        span(v-if="crossAt" class="gu-mark" :style="{ left: `${crossAt.x}%`, top: `${crossAt.y}%` }")
          GameMark(kind="bad")
        span(v-if="tickAt" class="gu-mark" :style="{ left: `${tickAt.x}%`, top: `${tickAt.y}%` }")
          GameMark(kind="good")
      p(class="gu-count" aria-live="polite") {{ t('app.adventure.embrace2Count', { n: glad.length, total: current.brothers.length }) }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between && !helpId && !goingTo" tone="gold" @click="helpMe") {{ t('app.adventure.embrace2Help') }}
      p(class="gu-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.embrace2Done')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gu
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

.gu-round
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

.gu-hint
  margin: 0
  text-align: center
  font-weight: 700
  font-size: 1rem
  color: #5a4a2c

.gu-field
  position: relative
  width: 100%
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #d9c9a3
  background-size: cover
  background-position: center

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

.gu-bro
  position: absolute
  display: block
  min-width: 44px
  padding: 0
  border: 3px solid transparent
  border-radius: 14px
  background: transparent
  cursor: pointer
  filter: drop-shadow(0 3px 3px rgba(40, 25, 5, 0.3))

  &.ring
    border-color: #fff6dc
    box-shadow: 0 0 0 3px rgba(212, 168, 62, 0.9)

  &.cursor
    border-color: #fff6dc
    box-shadow: 0 0 0 3px rgba(40, 25, 5, 0.55)

  &.help
    border-color: #fff6dc
    border-style: dashed

  &.glad
    cursor: default

  &.shake
    animation: gu-shake 500ms ease-in-out

.gu-pic
  display: block

  &.flip
    transform: scaleX(-1)

.gu-josef
  position: absolute
  pointer-events: none
  filter: drop-shadow(0 4px 4px rgba(40, 25, 5, 0.35))

  &.walking .gu-pic
    animation: gu-walk 500ms ease-in-out infinite

.gu-mark
  position: absolute
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 3000

.gu-count
  margin: 0
  align-self: center
  padding: 2px 14px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  color: #5a4a2c

.gu-fb
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

@keyframes gu-shake
  0%, 100%
    rotate: 0deg
  25%
    rotate: -4deg
  75%
    rotate: 4deg

@keyframes gu-walk
  0%, 100%
    translate: 0 0
  50%
    translate: 0 -2%

// less motion: Joseph is there at once (in the script), nothing shakes or bobs
@media (prefers-reduced-motion: reduce)
  .gu-bro.shake, .gu-josef.walking .gu-pic
    animation: none
</style>
