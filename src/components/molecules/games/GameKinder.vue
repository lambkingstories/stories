<script setup lang="ts">
/**
 * To Jesus (Mark 10,13-16). The courtyard with the fig tree: Jesus sits on the bench with his arms open, Simon and John behind him. In front, in a row, the children wait, the little ones on the arm
 * of their mother or father. They come to Jesus one after another, the smallest first: the child taps the smallest of those who still wait, and it walks (or is carried) to Jesus and stays with him.
 * A tap on a child while a smaller one still waits: a cross and "A smaller child is still waiting" (a mistake; with a hint when the smaller one is on an arm). When all are with Jesus he takes them
 * in his arms, lays his hands on them and blesses them (the words of the Bible). Round 1: four children, round 2: six, two of them on the arm and the others closer in height.
 * On the keyboard left/right choose a child, Enter brings it. After fifteen seconds without a tap the button "Help me" shows the smallest child and brings it. With reduced motion the children
 * go at once. Nothing is shown by colour alone (tick, cross, words). The arithmetic is `utils/heilungNeu.ts`; stars: `heilungStars(mistakes)`.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { CHILD_HIT, childrenNext, childrenSpot, childrenTap, childrenWidth, heilungStars } from '@/utils/heilungNeu'
import type { ChildFigure, ChildrenGame, Pt } from '@/utils/heilungNeu'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: ChildrenGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.rounds.reduce((n, r) => n + r.children.length, 0))

const IDLE_SECONDS = 15

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
/** The children with Jesus, in the order they came. */
const come = ref<string[]>([])
const comeSet = computed(() => new Set(come.value))
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
const stars = computed(() => heilungStars(mistakes.value))
const waiting = computed(() => current.value.children.map((c, i) => ({ c, i })).filter(({ c }) => !comeSet.value.has(c.id)))

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
  if (!between.value && !finished.value && !helpId.value) idle.value += 0.25
  later(idleLoop, 250)
}
later(idleLoop, 250)

/** Where a child stands now: in the row, or at its place round Jesus. */
function place(c: ChildFigure, i: number): Pt & { scale: number } {
  const k = come.value.indexOf(c.id)
  if (k >= 0) return { ...props.game.seats[k]!, scale: props.game.seats[k]!.scale }
  return { ...childrenSpot(props.game, current.value, i), scale: 1 }
}
const headOf = (c: ChildFigure, i: number): Pt => {
  const p = place(c, i)
  return { x: p.x, y: p.y - c.h * p.scale * 0.8 }
}

/** A tap on a waiting child. */
function tap(i: number, helped = false) {
  if (between.value || finished.value) return
  const c = current.value.children[i]
  if (!c) return
  idle.value = 0
  const verdict = childrenTap(current.value, comeSet.value, c.id)
  if (verdict === 'already') return
  if (verdict === 'bigger') {
    mistakes.value++
    play('wrong')
    flash('bad', headOf(c, i))
    shake.value = c.id
    later(() => {
      if (shake.value === c.id) shake.value = ''
    }, 600)
    say(t(childrenNext(current.value, comeSet.value)?.carried ? 'app.adventure.childrenBiggerArm' : 'app.adventure.childrenBigger'), 3000)
    return
  }
  helpId.value = ''
  come.value = [...come.value, c.id]
  progress.mark()
  play('snap')
  flash('good', headOf(c, i))
  say(t(helped ? 'app.adventure.childrenHelped' : 'app.adventure.childrenRight', { name: c.name }), 2200)
  const rest = waiting.value
  if (!rest.length) endRound()
  else if (cursor.value >= 0) cursor.value = rest[0]!.i
}

function endRound() {
  between.value = true
  cursor.value = -1
  later(() => play('right'), 600)
  later(() => say(t('app.adventure.childrenRoundDone'), 0), 900)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 4200)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 3400)
  later(() => {
    round.value++
    come.value = []
    between.value = false
    idle.value = 0
    message.value = ''
  }, 4600)
}

function onKey(e: KeyboardEvent) {
  if (between.value || finished.value) return
  const list = waiting.value.map((w) => w.i)
  if (!list.length) return
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    e.preventDefault()
    idle.value = 0
    const at = list.indexOf(cursor.value)
    const step = e.key === 'ArrowRight' ? 1 : -1
    cursor.value = list[at < 0 ? (step > 0 ? 0 : list.length - 1) : (at + step + list.length) % list.length]!
    say(current.value.children[cursor.value]!.name, 0)
    return
  }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    if (cursor.value < 0 || !list.includes(cursor.value)) {
      cursor.value = list[0]!
      say(`${current.value.children[cursor.value]!.name}. ${t('app.adventure.childrenKeys')}`, 0)
      return
    }
    tap(cursor.value)
  }
}

/** The button for those who do not know who is the smallest: the smallest child is shown and comes. */
function helpMe() {
  const c = childrenNext(current.value, comeSet.value)
  if (!c) return
  idle.value = 0
  helpId.value = c.id
  const i = current.value.children.indexOf(c)
  later(() => {
    if (helpId.value === c.id) tap(i, true)
  }, 1200)
}

// ---- looks
const ratio = computed(() => String(props.game.ratio))
function childStyle(c: ChildFigure, i: number) {
  const p = place(c, i)
  return {
    left: `${p.x}%`,
    top: `${p.y}%`,
    width: `${childrenWidth(props.game, c, p.scale)}%`,
    zIndex: Math.round(p.y * 10) + (comeSet.value.has(c.id) ? 0 : 1000)
  }
}
const markStyle = (p: Pt) => ({ left: `${p.x}%`, top: `${p.y}%` })
</script>

<template lang="pug">
  div(class="gk")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gk-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gk-hint") {{ current.hint }}
      div(
        class="gk-field"
        :style="{ backgroundImage: `url(${src(game.background)})`, aspectRatio: ratio }"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.childrenField')"
        @keydown="onKey"
      )
        //- every child: its picture with the feet on its place; a child who waits has a button over the middle of its picture (where the child stands, at least 44 pixels wide)
        template(v-for="(c, i) in current.children" :key="`c-${round}-${c.id}`")
          div(v-if="comeSet.has(c.id)" class="gk-fig gk-child with" :data-child="c.id" :style="childStyle(c, i)" role="img" :aria-label="t('app.adventure.childrenWith', { name: c.name })")
            GameImage(:src="c.image" :ratio="game.figureRatio" colour="#c9a77a" :label="c.id")
          div(v-else class="gk-fig" :class="{ shake: shake === c.id }" :style="childStyle(c, i)")
            GameImage(:src="c.image" :ratio="game.figureRatio" colour="#c9a77a" :label="c.id")
            button(
              type="button"
              class="gk-child wait"
              :class="{ cursor: cursor === i, help: helpId === c.id }"
              :data-child="c.id"
              :style="{ width: `max(44px, ${CHILD_HIT * 100}%)` }"
              :aria-label="c.name"
              tabindex="-1"
              @click="tap(i)"
            )
        span(v-if="crossAt" class="gk-mark" :style="markStyle(crossAt)")
          GameMark(kind="bad")
        span(v-if="tickAt" class="gk-mark" :style="markStyle(tickAt)")
          GameMark(kind="good")
      p(class="gk-count" aria-live="polite") {{ t('app.adventure.childrenCount', { n: come.length, total: current.children.length }) }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between && !helpId" tone="gold" @click="helpMe") {{ t('app.adventure.childrenHelp') }}
      p(class="gk-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.childrenDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gk
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

.gk-round
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

.gk-hint
  margin: 0
  text-align: center
  font-weight: 700
  font-size: 1rem
  color: #5a4a2c

.gk-field
  position: relative
  width: 100%
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #c9b48a
  background-size: cover
  background-position: center

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

// a child: its feet stand on its place; it walks there when it comes to Jesus
.gk-fig
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  transition: left 900ms ease-in-out, top 900ms ease-in-out, width 900ms ease-in-out
  filter: drop-shadow(0 3px 3px rgba(40, 25, 5, 0.35))

  &.with
    pointer-events: none

  &.shake
    animation: gk-shake 500ms ease-in-out

// the button over the middle of a waiting child
.gk-child.wait
  position: absolute
  top: 0
  left: 50%
  height: 100%
  padding: 0
  transform: translateX(-50%)
  border: 3px solid transparent
  border-radius: 12px
  background: transparent
  cursor: pointer

  &.cursor
    border-color: #fff6dc
    box-shadow: 0 0 0 3px rgba(40, 25, 5, 0.55)

  &.help
    border-color: #fff6dc
    border-style: dashed
    background: rgba(255, 246, 220, 0.22)

.gk-mark
  position: absolute
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 3000

.gk-count
  margin: 0
  align-self: center
  padding: 2px 14px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  color: #5a4a2c

.gk-fb
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

@keyframes gk-shake
  0%, 100%
    rotate: 0deg
  25%
    rotate: -4deg
  75%
    rotate: 4deg

// less motion: the children are at Jesus at once, nothing shakes
@media (prefers-reduced-motion: reduce)
  .gk-fig
    transition: none

    &.shake
      animation: none
</style>
