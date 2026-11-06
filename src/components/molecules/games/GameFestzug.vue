<script setup lang="ts">
/**
 * The festive procession (2 Samuel 6,5). On the road up to the City of David the priests carry the ark far behind; in front walk four musicians with harp, drum, rattles and cymbals.
 * Round 1: one musician after another lights up (a golden glow, a little hop and a note over the head, and the words "now: the harp"); the child taps the one who lights up. A tap on another
 * one is a mistake (a cross and words); a glow that is missed comes again at the end, without a mistake. Round 2: the musicians play short tunes (two, three, then four notes), the child
 * plays every tune after them; a wrong note is a mistake and the tune is played again. Keys: left/right choose a musician, Enter taps. After fifteen seconds without a tap "Help me" marks the
 * one to tap. With reduced motion nobody hops. Nothing is shown by colour alone (tick, cross, words, the note). The arithmetic is `utils/davidNeu.ts`; stars: `davidNeuStars(mistakes)`.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { davidNeuStars, festEchoRight, festNeed } from '@/utils/davidNeu'
import type { FestMarchGame, FestMusician, Pt } from '@/utils/davidNeu'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: FestMarchGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.rounds.reduce((n, r) => n + festNeed(r), 0))

const IDLE_SECONDS = 15
const TICK = 100
/** The pause between two glows (round 1) and between the notes of a tune (round 2). */
const REST = 350

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
/** Who lights up now (index), or -1. */
const lit = ref(-1)
/** Who was tapped and plays a moment (a little hop), or -1. */
const played = ref(-1)
const cursor = ref(-1)
const helpOn = ref(false)
const crossAt = ref<Pt | null>(null)
const tickAt = ref<Pt | null>(null)
const mistakes = ref(0)
const idle = ref(0)
const finished = ref(false)
const between = ref(false)
const message = ref('')
let messageSeq = 0
let markSeq = 0
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => davidNeuStars(mistakes.value))
const hits = ref(0)

// round 1: the queue of glows (a missed one goes to the end), the glow that is on, and how long it has been on
const queue = ref<number[]>([])
const glowMs = ref(0)
// round 2: the tune (index), how many right notes of it were played, and whether the musicians play it now (`listen`) or the child plays (`play`)
const tune = ref(0)
const playedNotes = ref(0)
const echoPhase = ref<'listen' | 'play'>('listen')

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
const headOf = (m: FestMusician): Pt => ({ x: m.x, y: Math.max(4, m.y - (m.w / props.game.musicianRatio) * props.game.ratio * 0.95) })
const nameOf = (i: number) => props.game.musicians[i]!.name

// ---------------------------------------------------------------- round 1: glow
function startGlowRound() {
  queue.value = [...(current.value.order ?? [])]
  nextGlow(600)
}
function nextGlow(wait = REST) {
  lit.value = -1
  later(() => {
    if (finished.value || between.value) return
    if (!queue.value.length) {
      endRound()
      return
    }
    lit.value = queue.value[0]!
    glowMs.value = 0
    if (helpOn.value) say(t('app.adventure.festMarchHelped', { name: nameOf(lit.value) }), 0)
  }, wait)
}
function glowLoop() {
  if (!finished.value && !between.value && current.value.mode === 'glow' && lit.value >= 0) {
    glowMs.value += TICK
    if (glowMs.value >= (current.value.glowMs ?? 2600)) {
      // missed: the musician comes again at the end, no mistake
      const m = queue.value.shift()!
      queue.value = [...queue.value, m]
      say(t('app.adventure.festMarchMissed'), 1800)
      nextGlow()
    }
  }
  if (!finished.value && !between.value && !helpOn.value) idle.value += TICK / 1000
  later(glowLoop, TICK)
}

// ---------------------------------------------------------------- round 2: echo
const tunes = computed(() => current.value.tunes ?? [])
function listen() {
  echoPhase.value = 'listen'
  playedNotes.value = 0
  lit.value = -1
  const notes = tunes.value[tune.value] ?? []
  const step = current.value.stepMs ?? 800
  say(t('app.adventure.festMarchListen', { n: notes.length }), 0)
  notes.forEach((m, k) => {
    later(() => {
      if (between.value || finished.value) return
      lit.value = m
      play('tap')
    }, 700 + k * (step + REST))
    later(() => {
      if (lit.value === m) lit.value = -1
    }, 700 + k * (step + REST) + step)
  })
  later(() => {
    if (between.value || finished.value) return
    echoPhase.value = 'play'
    say(t('app.adventure.festMarchYourTurn'), 0)
    if (helpOn.value) say(t('app.adventure.festMarchHelped', { name: nameOf(notes[0]!) }), 0)
  }, 700 + notes.length * (step + REST))
}

// ---------------------------------------------------------------- a tap
function tap(i: number) {
  if (between.value || finished.value) return
  const m = props.game.musicians[i]
  if (!m) return
  idle.value = 0
  if (current.value.mode === 'glow') {
    if (lit.value < 0) return
    if (i !== lit.value) {
      mistakes.value++
      play('wrong')
      flash('bad', headOf(m))
      say(t('app.adventure.festMarchWrong', { name: m.name, lit: nameOf(lit.value) }), 2400)
      return
    }
    queue.value = queue.value.slice(1)
    hits.value++
    progress.mark()
    bounce(i)
    play('tap')
    flash('good', headOf(m))
    say(t('app.adventure.festMarchRight', { name: m.name }), 1600)
    nextGlow()
    return
  }
  // echo
  if (echoPhase.value !== 'play') {
    say(t('app.adventure.festMarchWait'), 1800)
    return
  }
  const notes = tunes.value[tune.value] ?? []
  if (!festEchoRight(notes, playedNotes.value, i)) {
    mistakes.value++
    play('wrong')
    flash('bad', headOf(m))
    say(t('app.adventure.festMarchAgain'), 0)
    echoPhase.value = 'listen'
    later(listen, 1400)
    return
  }
  playedNotes.value++
  hits.value++
  progress.mark()
  bounce(i)
  play('tap')
  if (helpOn.value && playedNotes.value < notes.length) say(t('app.adventure.festMarchHelped', { name: nameOf(notes[playedNotes.value]!) }), 0)
  if (playedNotes.value >= notes.length) {
    flash('good', headOf(m))
    echoPhase.value = 'listen'
    if (tune.value + 1 >= tunes.value.length) {
      endRound()
      return
    }
    say(t('app.adventure.festMarchTuneDone'), 0)
    later(() => {
      tune.value++
      listen()
    }, 1600)
  }
}
function bounce(i: number) {
  played.value = i
  later(() => {
    if (played.value === i) played.value = -1
  }, 450)
}

function endRound() {
  between.value = true
  lit.value = -1
  cursor.value = -1
  helpOn.value = false
  later(() => play('right'), 400)
  later(() => say(t('app.adventure.festMarchRoundDone'), 0), 700)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 4200)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 3200)
  later(() => {
    round.value++
    between.value = false
    idle.value = 0
    message.value = ''
    tune.value = 0
    begin()
  }, 4600)
}

function begin() {
  if (current.value.mode === 'glow') startGlowRound()
  else listen()
}

function onKey(e: KeyboardEvent) {
  if (between.value || finished.value) return
  const n = props.game.musicians.length
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    e.preventDefault()
    idle.value = 0
    const step = e.key === 'ArrowRight' ? 1 : -1
    cursor.value = cursor.value < 0 ? (step > 0 ? 0 : n - 1) : (cursor.value + step + n) % n
    say(nameOf(cursor.value), 0)
    return
  }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    if (cursor.value < 0) {
      cursor.value = 0
      say(`${nameOf(0)}. ${t('app.adventure.festMarchKeys')}`, 0)
      return
    }
    tap(cursor.value)
  }
}

/** The button for those who are stuck: the one to tap is marked and named, from now on in this round. */
function helpMe() {
  idle.value = 0
  helpOn.value = true
  if (current.value.mode === 'glow' && lit.value >= 0) say(t('app.adventure.festMarchHelped', { name: nameOf(lit.value) }), 0)
  else if (current.value.mode === 'echo' && echoPhase.value === 'play') {
    const notes = tunes.value[tune.value] ?? []
    say(t('app.adventure.festMarchHelped', { name: nameOf(notes[playedNotes.value]!) }), 0)
  } else say(t('app.adventure.festMarchHelpListen'), 0)
}
/** The musician the help points at now. */
const helpAt = computed(() => {
  if (!helpOn.value || between.value) return -1
  if (current.value.mode === 'glow') return lit.value
  if (echoPhase.value !== 'play') return -1
  return (tunes.value[tune.value] ?? [])[playedNotes.value] ?? -1
})

later(begin, 0)
later(glowLoop, TICK)

// ---- looks
const ratio = computed(() => String(props.game.ratio))
const figStyle = (m: FestMusician) => ({ left: `${m.x}%`, top: `${m.y}%`, width: `${m.w}%`, zIndex: Math.round(m.y * 10) })
const markStyle = (p: Pt) => ({ left: `${p.x}%`, top: `${p.y}%` })
const progressText = computed(() =>
  current.value.mode === 'glow'
    ? t('app.adventure.festMarchCount', { n: hits.value, total: festNeed(props.game.rounds[0]!) })
    : t('app.adventure.festMarchTunes', { n: tune.value + 1, total: tunes.value.length })
)
</script>

<template lang="pug">
  div(class="gf")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gf-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gf-hint") {{ current.hint }}
      div(
        class="gf-field"
        :style="{ backgroundImage: `url(${src(game.background)})`, aspectRatio: ratio }"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.festMarchField')"
        @keydown="onKey"
      )
        button(
          v-for="(m, i) in game.musicians"
          :key="m.instrument"
          type="button"
          class="gf-fig"
          :class="{ lit: lit === i, hop: played === i, cursor: cursor === i, help: helpAt === i }"
          :style="figStyle(m)"
          :data-musician="i"
          :data-instrument="m.instrument"
          :aria-label="lit === i ? t('app.adventure.festMarchLit', { name: m.name }) : m.name"
          tabindex="-1"
          @click="tap(i)"
        )
          GameImage(:src="m.image" :ratio="game.musicianRatio" colour="#c9a77a" :label="m.instrument")
          span(v-if="lit === i" class="gf-note" aria-hidden="true") ♪
        span(v-if="crossAt" class="gf-mark" :style="markStyle(crossAt)")
          GameMark(kind="bad")
        span(v-if="tickAt" class="gf-mark" :style="markStyle(tickAt)")
          GameMark(kind="good")
      p(class="gf-now" aria-live="polite") {{ lit >= 0 ? t('app.adventure.festMarchNow', { name: game.musicians[lit]?.name ?? '' }) : '' }}
      p(class="gf-count") {{ progressText }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between && !helpOn" tone="gold" @click="helpMe") {{ t('app.adventure.festMarchHelp') }}
      p(class="gf-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.festMarchDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gf
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

.gf-round
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

.gf-hint
  margin: 0
  text-align: center
  font-weight: 700
  font-size: 1rem
  color: #5a4a2c

.gf-field
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

// a musician: the feet on the place; the whole figure is the button (at least 44 pixels)
.gf-fig
  position: absolute
  display: block
  min-width: 44px
  padding: 0
  border: 3px solid transparent
  border-radius: 14px
  background: transparent
  transform: translate(-50%, -100%)
  cursor: pointer
  filter: drop-shadow(0 3px 3px rgba(40, 25, 5, 0.3))
  transition: filter 200ms ease, scale 200ms ease

  // lit: a golden glow round the figure, a little bigger, and the note over the head
  &.lit
    filter: drop-shadow(0 0 6px #ffe27a) drop-shadow(0 0 14px #ffc93a)
    scale: 1.06
    animation: gf-hop 700ms ease-in-out infinite

  &.hop
    animation: gf-hop 450ms ease-in-out

  &.cursor
    border-color: #fff6dc
    box-shadow: 0 0 0 3px rgba(40, 25, 5, 0.55)

  &.help
    border-color: #fff6dc
    border-style: dashed
    background: rgba(255, 246, 220, 0.18)

.gf-note
  position: absolute
  left: 50%
  top: -0.2em
  transform: translate(-50%, -100%)
  padding: 0 8px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.95)
  font-size: 1.4rem
  font-weight: 800
  color: #5a4a2c
  line-height: 1.3

.gf-mark
  position: absolute
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 3000

.gf-now
  margin: 0
  min-height: 1.4em
  align-self: center
  font-weight: 800
  font-size: 1.05rem
  color: #3f321b

.gf-count
  margin: 0
  align-self: center
  padding: 2px 14px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  color: #5a4a2c

.gf-fb
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

@keyframes gf-hop
  0%, 100%
    translate: 0 0
  50%
    translate: 0 -4%

// less motion: nobody hops; the glow, the note and the words stay
@media (prefers-reduced-motion: reduce)
  .gf-fig
    transition: none

    &.lit, &.hop
      animation: none
</style>
