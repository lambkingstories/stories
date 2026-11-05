<script setup lang="ts">
/**
 * The shepherds' fire (Luke 2,8). The shepherds are in the field by the sheep, and it is night. In front of them burns a campfire (or two); it burns down by itself, big, medium, small, only embers. The child taps the
 * fire at the right moment to lay on wood: when it is small (or only embers glow) the wood is right and the fire is big again; when it still burns big the wood is wasted (a cross and a word, a mistake); when the
 * fire goes out the shepherds light it again, but that is a mistake too. A small wood bundle over a fire says "now". The moon goes over the sky while the night passes; when the wood has been laid on often enough
 * (`feeds`) the round is over. Round 1: one fire that burns slowly; round 2: two fires that burn down at different times and faster. The angel of the story is not in the picture. Fires are buttons (arrow keys between
 * them, Enter lays on wood); whoever does not go on gets "Help me" after fifteen seconds: the fire that needs wood most gets it. With reduced motion nothing bounces. Nothing is shown by colour alone
 * (the wood bundle, a word for the size of each fire, tick, cross). The arithmetic is `utils/weihnachtenNeu.ts`; stars: `osterStars(mistakes)`.
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
import { FIRE_DARK, FIRE_EARLY, FIRE_RATIO, FIRE_SPRITE, FIRE_RELIGHT, fireBurn, fireFeed, fireMoon, fireNeediest, fireStage, fireStart, wnNeighbour } from '@/utils/weihnachtenNeu'
import type { FireGame } from '@/utils/weihnachtenNeu'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: FireGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every time wood is laid on in the right moment
progress.setGoal(props.game.rounds.reduce((n, r) => n + r.feeds, 0))

const TICK = 0.1
const IDLE_SECONDS = 15

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const levels = ref<number[]>(fireStart(props.game.rounds[0]!))
/** Seconds that a fire that went out is still dark; 0 while it burns. */
const dark = ref<number[]>(props.game.rounds[0]!.spots.map(() => 0))
const feeds = ref(0)
const mistakes = ref(0)
const idle = ref(0)
const finished = ref(false)
const between = ref(false)
const message = ref('')
const markAt = ref<{ i: number; kind: 'good' | 'bad' } | null>(null)
/** The fire that just got wood (the bundle falls on it). */
const woodAt = ref(-1)
let messageSeq = 0
let markSeq = 0
let woodSeq = 0
const fires = ref<HTMLElement[]>([])
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => osterStars(mistakes.value))

function say(text: string, ms = 3000) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}
function flash(i: number, kind: 'good' | 'bad') {
  const id = ++markSeq
  markAt.value = { i, kind }
  later(() => {
    if (markSeq === id) markAt.value = null
  }, 1200)
}

/** The night passes: every fire burns down, a fire that went out is lit again after a while. */
function loop() {
  if (!between.value && !finished.value) {
    idle.value += TICK
    current.value.spots.forEach((_, i) => {
      if (dark.value[i]! > 0) {
        dark.value[i] = Math.max(0, dark.value[i]! - TICK)
        if (dark.value[i]! <= 0) {
          levels.value[i] = FIRE_RELIGHT
          say(t('app.adventure.fireRelit'), 2400)
        }
        return
      }
      levels.value[i] = fireBurn(levels.value[i]!, TICK, current.value.burn)
      if (levels.value[i]! <= 0) {
        dark.value[i] = FIRE_DARK
        mistakes.value++
        play('wrong')
        flash(i, 'bad')
        say(t('app.adventure.fireOut'), 3200)
      }
    })
  }
  later(loop, TICK * 1000)
}
later(loop, TICK * 1000)

/** A tap on fire `i` (also Enter on it): lay wood on it. */
function feed(i: number) {
  if (between.value || finished.value) return
  idle.value = 0
  if (dark.value[i]! > 0) {
    say(t('app.adventure.fireDark'), 2400)
    return
  }
  const verdict = fireFeed(levels.value[i]!)
  if (verdict === 'early') {
    mistakes.value++
    play('wrong')
    flash(i, 'bad')
    say(t('app.adventure.fireEarly'), 3200)
    return
  }
  levels.value[i] = 1
  feeds.value++
  progress.mark()
  play('bead')
  flash(i, 'good')
  const id = ++woodSeq
  woodAt.value = i
  later(() => {
    if (woodSeq === id) woodAt.value = -1
  }, 800)
  if (feeds.value >= current.value.feeds) {
    endRound()
    return
  }
  say(t(verdict === 'late' ? 'app.adventure.fireJust' : 'app.adventure.fireRight'), 2200)
}
function feedClick(i: number) {
  feed(i)
}

function endRound() {
  between.value = true
  later(() => play('right'), 250)
  say(t('app.adventure.fireMorning'), 0)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 2200)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 1400)
  later(() => {
    round.value++
    levels.value = fireStart(current.value)
    dark.value = current.value.spots.map(() => 0)
    feeds.value = 0
    between.value = false
    idle.value = 0
    message.value = ''
  }, 2800)
}

function onKey(e: KeyboardEvent, i: number) {
  const arrows: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
  const a = arrows[e.key]
  if (!a) return
  e.preventDefault()
  idle.value = 0
  const k = wnNeighbour(current.value.spots, i, a[0], a[1], FIRE_RATIO)
  fires.value[k]?.focus()
}

/** The button for those who do not go on: the fire that needs wood most gets it (or the word that it burns bright still). */
function helpMe() {
  idle.value = 0
  const i = fireNeediest(levels.value)
  if (i < 0) {
    say(t('app.adventure.fireHelpWait'), 3600)
    return
  }
  fires.value[i]?.focus()
  say(t('app.adventure.fireHelpSay'), 3000)
  feed(i)
}

// ---- looks
const setFire = (el: unknown, i: number) => {
  if (el instanceof HTMLElement) fires.value[i] = el
}
const needs = (i: number): boolean => dark.value[i]! <= 0 && levels.value[i]! > 0 && levels.value[i]! <= FIRE_EARLY
const stageOf = (i: number) => (dark.value[i]! > 0 ? -1 : fireStage(levels.value[i]!))
const picture = (i: number) => props.game.stages[Math.max(0, stageOf(i))]!
const STAGE_KEYS = ['Out', 'Embers', 'Small', 'Medium', 'Big'] as const
const stageWord = (i: number) => t(`app.adventure.fireStage${STAGE_KEYS[stageOf(i) + 1]}`)
const fireLabel = (i: number) => t('app.adventure.fireLabel', { n: i + 1, state: stageWord(i), hint: needs(i) ? t('app.adventure.fireNow') : '' }).trim()
const fireStyle = (i: number) => {
  const s = current.value.spots[i]!
  return { left: `${s.x}%`, top: `${s.y}%`, width: `${s.w}%` }
}
const woodStyle = (i: number) => {
  const s = current.value.spots[i]!
  return { left: `${s.x}%`, top: `${s.y - (s.w / FIRE_SPRITE) * FIRE_RATIO * 0.9}%`, width: `${Math.max(8, s.w * 0.4)}%` }
}
const moon = computed(() => fireMoon(props.game, feeds.value / Math.max(1, current.value.feeds)))
const moonStyle = computed(() => ({ left: `${moon.value.x}%`, top: `${moon.value.y}%`, width: `${props.game.moonW}%` }))
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        class="gm-field"
        :style="{ backgroundImage: `url(${src(game.background)})`, aspectRatio: String(FIRE_RATIO) }"
        role="group"
        :aria-label="t('app.adventure.fireField')"
      )
        div(class="gm-moon" :style="moonStyle" aria-hidden="true")
          GameImage(:src="game.moon" :ratio="1" colour="#e8dcae" label="mond")
        template(v-for="(s, i) in current.spots" :key="`f-${round}-${i}`")
          button(
            :ref="(el) => setFire(el, i)"
            type="button"
            class="gm-fire"
            :class="{ needs: needs(i), out: stageOf(i) < 0 }"
            :data-fire="i"
            :style="fireStyle(i)"
            :aria-label="fireLabel(i)"
            @click="feedClick(i)"
            @keydown="onKey($event, i)"
          )
            span(class="gm-pic" aria-hidden="true")
              GameImage(:src="picture(i)" :ratio="FIRE_SPRITE" colour="#c4743a" label="feuer")
            span(class="gm-state" aria-hidden="true") {{ stageWord(i) }}
            span(v-if="needs(i)" class="gm-cue" aria-hidden="true")
              GameImage(:src="game.wood" :ratio="1" colour="#8a5a2a" label="holz")
            span(v-if="markAt && markAt.i === i" class="gm-mark")
              GameMark(:kind="markAt.kind")
          div(v-if="woodAt === i" class="gm-wood" :style="woodStyle(i)" aria-hidden="true")
            GameImage(:src="game.wood" :ratio="1" colour="#8a5a2a" label="holz")
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.fireCount', { n: feeds, total: current.feeds }) }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between" tone="gold" @click="helpMe") {{ t('app.adventure.fireHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.fireDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #2e3a5c
  box-shadow: inset 0 0 18px rgba(10, 15, 40, 0.5)
  user-select: none
  -webkit-user-select: none

.gm-round
  margin: 0
  align-self: center
  padding: 1px 12px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  letter-spacing: 0.06em
  text-transform: uppercase
  color: #3f321b

.gm-hint
  margin: 0
  text-align: center
  font-weight: 700
  font-size: 1rem
  color: #fff6dc

.gm-field
  position: relative
  width: 100%
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #1f2a4a
  background-size: cover
  background-position: center

.gm-moon
  position: absolute
  display: block
  transform: translate(-50%, -50%)
  pointer-events: none
  transition: left 900ms ease-in-out, top 900ms ease-in-out

// a fire: a button on the fire (the picture is square, its stone ring at the bottom)
.gm-fire
  position: absolute
  display: block
  min-width: 48px
  padding: 0
  transform: translate(-50%, -100%)
  border: 3px solid transparent
  border-radius: 16px
  background: transparent
  cursor: pointer
  -webkit-tap-highlight-color: transparent
  z-index: 3

  &:focus-visible
    border-color: #fff6dc
    box-shadow: 0 0 0 2px rgba(20, 20, 40, 0.8)

  &.needs
    border: 3px dashed #fff6dc

  &.out .gm-pic
    opacity: 0.45

.gm-pic
  display: block
  width: 100%

.gm-state
  position: absolute
  left: 50%
  bottom: 0
  transform: translate(-50%, 55%)
  padding: 0 10px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.95)
  font-weight: 800
  font-size: 1rem
  line-height: 1.5
  white-space: nowrap
  color: #3f321b
  pointer-events: none

// the little bundle of wood over a fire that needs wood now
.gm-cue
  position: absolute
  left: 50%
  top: -4px
  display: block
  width: 40%
  transform: translate(-50%, -60%)
  pointer-events: none
  animation: gm-bob 700ms ease-in-out infinite alternate

.gm-wood
  position: absolute
  display: block
  transform: translate(-50%, 0)
  pointer-events: none
  z-index: 4
  animation: gm-drop 700ms ease-in forwards

.gm-mark
  position: absolute
  left: 50%
  top: 40%
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 3

.gm-count
  margin: 0
  align-self: center
  padding: 2px 14px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  color: #3f321b

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

@keyframes gm-bob
  from
    translate: 0 0
  to
    translate: 0 -8px

@keyframes gm-drop
  from
    translate: 0 -40px
    opacity: 1
  to
    translate: 0 20px
    opacity: 0.2

// less motion: nothing bobs, drops or glides
@media (prefers-reduced-motion: reduce)
  .gm-cue, .gm-wood
    animation: none

  .gm-moon
    transition: none
</style>
