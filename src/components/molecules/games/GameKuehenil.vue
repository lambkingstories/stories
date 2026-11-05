<script setup lang="ts">
/**
 * Cows by the Nile (Genesis 41,2-3: "there came up out of the river seven well favoured kine and fatfleshed ... and seven other kine came up after them, ill favoured and leanfleshed").
 * The meadow by the river: one cow after another comes up out of the water and walks across the meadow and out of the picture on the left. The child taps the fat ones: such a cow goes to
 * the meadow below the picture (a tick, "A fat cow!"). A tap on a lean cow: a cross, "This cow is lean. Let it walk by." (a mistake). A fat cow that walks by without a tap is a mistake too
 * ("A fat cow walked by. It comes once more."), and it comes up out of the river again later. When the seven fat ones are in the meadow and all the cows have come, the round is won.
 * Round 1: first the seven fat, then the seven lean ones, as in Pharaoh's dream, slowly; round 2: fat and lean mixed, faster, on two ways.
 * Left/right choose a cow that is there, Enter taps it. After fifteen seconds without a tap the button "Help me" shows the next fat cow and taps it. The lean cows only look thin and sad.
 * With reduced motion the cows do not sway. Nothing is shown by colour alone (tick, cross, words). The arithmetic is `utils/josefNeu.ts`; stars: `josefStars(mistakes)`.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { cowAt, cowTap, cowWalkTime, cowsAgain, josefStars } from '@/utils/josefNeu'
import type { NileCow, NileCowsGame, Pt } from '@/utils/josefNeu'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: NileCowsGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.rounds.length * 7)

const TICK = 0.05
const IDLE_SECONDS = 15
/** A fat cow that walked by comes up again this many seconds later (after the last cow). */
const AGAIN = 1.6

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
/** The cows of this round (a fat cow that walked by is added once more). */
const cows = ref<NileCow[]>([...current.value.cows])
const clock = ref(0)
const taken = ref<number[]>([])
const missed = ref<number[]>([])
const cursor = ref(-1)
const helpCow = ref(-1)
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
const stars = computed(() => josefStars(mistakes.value))
const fatTaken = computed(() => taken.value.length)
const places = computed(() => cows.value.map((c) => cowAt(props.game, current.value, c, clock.value)))
/** The cows that can be tapped now (they have come and not left, and are not in the meadow). */
const present = computed(() => cows.value.map((_, i) => i).filter((i) => !taken.value.includes(i) && (places.value[i]!.phase === 'rise' || places.value[i]!.phase === 'walk')))

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
const headOf = (i: number): Pt => {
  const p = places.value[i]!
  return { x: p.x, y: p.y - (p.w / props.game.cowRatio) * props.game.ratio * 0.8 }
}

function loop() {
  if (!finished.value && !between.value) {
    clock.value += TICK
    if (helpCow.value < 0) idle.value += TICK
    // a fat cow that walked by: a mistake, and it comes once more
    places.value.forEach((p, i) => {
      const c = cows.value[i]!
      if (p.phase !== 'gone' || c.kind !== 'fat' || taken.value.includes(i) || missed.value.includes(i)) return
      missed.value = [...missed.value, i]
      mistakes.value++
      play('wrong')
      say(t('app.adventure.nileCowsMissed'), 3000)
      const last = Math.max(clock.value, ...cows.value.map((x) => x.at))
      cows.value = [...cows.value, cowsAgain(c, last + AGAIN)]
    })
    const allThere = cows.value.every((c, i) => taken.value.includes(i) || clock.value > c.at + props.game.rise + cowWalkTime(props.game, current.value, c.lane))
    if (fatTaken.value >= 7 && allThere) endRound()
  }
  later(loop, TICK * 1000)
}
later(loop, TICK * 1000)

function tap(i: number, helped = false) {
  if (between.value || finished.value) return
  const c = cows.value[i]
  if (!c) return
  const p = places.value[i]!
  const verdict = cowTap(c, taken.value.includes(i), p.phase)
  if (verdict === 'none') return
  idle.value = 0
  if (verdict === 'lean') {
    mistakes.value++
    play('wrong')
    flash('bad', headOf(i))
    say(t('app.adventure.nileCowsLean'), 3000)
    return
  }
  flash('good', headOf(i))
  taken.value = [...taken.value, i]
  if (helpCow.value === i) helpCow.value = -1
  progress.mark()
  play('snap')
  say(t(helped ? 'app.adventure.nileCowsHelped' : 'app.adventure.nileCowsFat', { n: fatTaken.value }), 2000)
  if (cursor.value === i) cursor.value = -1
}

function endRound() {
  between.value = true
  cursor.value = -1
  helpCow.value = -1
  later(() => play('right'), 300)
  say(t('app.adventure.nileCowsRoundDone'), 0)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 3600)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 2400)
  later(() => {
    round.value++
    cows.value = [...current.value.cows]
    clock.value = 0
    taken.value = []
    missed.value = []
    between.value = false
    idle.value = 0
    message.value = ''
  }, 3800)
}

function onKey(e: KeyboardEvent) {
  if (between.value || finished.value) return
  const list = present.value
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    e.preventDefault()
    idle.value = 0
    if (!list.length) return
    // from left to right on the screen
    const order = [...list].sort((a, b) => places.value[a]!.x - places.value[b]!.x)
    const at = order.indexOf(cursor.value)
    const step = e.key === 'ArrowRight' ? 1 : -1
    cursor.value = order[at < 0 ? (step > 0 ? 0 : order.length - 1) : (at + step + order.length) % order.length]!
    say(t('app.adventure.nileCowsChosen'), 0)
    return
  }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    if (cursor.value < 0 || !list.includes(cursor.value)) {
      say(t('app.adventure.nileCowsKeys'), 0)
      if (list.length) cursor.value = [...list].sort((a, b) => places.value[a]!.x - places.value[b]!.x)[0]!
      return
    }
    tap(cursor.value)
  }
}

/** The button for those who are stuck: the next fat cow is shown and taps itself (when none is there, the next one that comes). */
function helpMe() {
  idle.value = 0
  say(t('app.adventure.nileCowsHelping'), 0)
  const watch = () => {
    if (between.value || finished.value) return
    const i = present.value.find((k) => cows.value[k]!.kind === 'fat')
    if (i === undefined) {
      helpCow.value = -2
      later(watch, 200)
      return
    }
    helpCow.value = i
    later(() => {
      if (helpCow.value === i && !taken.value.includes(i)) tap(i, true)
      helpCow.value = -1
    }, 1000)
  }
  watch()
}

// ---- looks
function cowStyle(i: number) {
  const p = places.value[i]!
  const h = (p.w / props.game.cowRatio) * props.game.ratio
  const rise = p.phase === 'rise' ? 1 - p.u : 0
  return {
    left: `${p.x - p.w / 2}%`,
    top: `${p.y - h}%`,
    width: `${p.w}%`,
    opacity: p.phase === 'rise' ? String(0.25 + 0.75 * p.u) : '1',
    clipPath: rise > 0 ? `inset(0 0 ${Math.round(rise * 60)}% 0)` : undefined,
    transform: rise > 0 ? `translateY(${Math.round(rise * 35)}%)` : undefined,
    zIndex: Math.round(p.y * 10)
  }
}
</script>

<template lang="pug">
  div(class="gn")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gn-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gn-hint") {{ current.hint }}
      div(
        class="gn-field"
        :style="{ backgroundImage: `url(${src(game.background)})`, aspectRatio: String(game.ratio) }"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.nileCowsField')"
        @keydown="onKey"
      )
        template(v-for="(c, i) in cows" :key="`c-${round}-${i}`")
          button(
            v-if="present.includes(i)"
            type="button"
            class="gn-cow"
            :class="{ cursor: cursor === i, help: helpCow === i, walk: places[i].phase === 'walk' }"
            :style="cowStyle(i)"
            :data-cow="i"
            :data-kind="c.kind"
            :aria-label="t(c.kind === 'fat' ? 'app.adventure.nileCowsFatName' : 'app.adventure.nileCowsLeanName')"
            tabindex="-1"
            @pointerdown.prevent="tap(i)"
          )
            span(class="gn-turn" :class="{ left: c.faceLeft }")
              GameImage(:src="c.image" :ratio="game.cowRatio" colour="#b07a45" :label="c.kind")
        span(v-if="crossAt" class="gn-mark" :style="{ left: `${crossAt.x}%`, top: `${crossAt.y}%` }")
          GameMark(kind="bad")
        span(v-if="tickAt" class="gn-mark" :style="{ left: `${tickAt.x}%`, top: `${tickAt.y}%` }")
          GameMark(kind="good")
      div(class="gn-meadow" :aria-label="t('app.adventure.nileCowsMeadow')" role="img")
        span(v-for="k in 7" :key="k" class="gn-slot" :class="{ full: k <= fatTaken }")
          GameImage(v-if="k <= fatTaken" :src="cows[taken[k - 1]]?.image ?? ''" :ratio="game.cowRatio" colour="#b07a45" label="dick")
      p(class="gn-count" aria-live="polite") {{ t('app.adventure.nileCowsCount', { n: fatTaken, total: 7 }) }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between && helpCow === -1" tone="gold" @click="helpMe") {{ t('app.adventure.nileCowsHelp') }}
      p(class="gn-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.nileCowsDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gn
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

.gn-round
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

.gn-hint
  margin: 0
  text-align: center
  font-weight: 700
  font-size: 1rem
  color: #5a4a2c

.gn-field
  position: relative
  width: 100%
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #9fbf6a
  background-size: cover
  background-position: center

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

.gn-cow
  position: absolute
  display: block
  min-width: 44px
  min-height: 44px
  padding: 0
  border: 3px solid transparent
  border-radius: 14px
  background: transparent
  cursor: pointer
  filter: drop-shadow(0 3px 3px rgba(40, 25, 5, 0.3))

  &.cursor
    border-color: #fff6dc
    box-shadow: 0 0 0 3px rgba(40, 25, 5, 0.55)

  &.help
    border-color: #fff6dc
    border-style: dashed
    background: rgba(255, 246, 220, 0.2)

// the pictures face right, the cows walk to the left (a picture that looks left already stays as it is)
.gn-turn
  display: block
  transform: scaleX(-1)

  &.left
    transform: none

.gn-cow.walk .gn-turn
  animation: gn-sway 900ms ease-in-out infinite

.gn-mark
  position: absolute
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 3000

.gn-meadow
  display: flex
  justify-content: center
  gap: 4px
  padding: 4px
  border-radius: 12px
  background: rgba(150, 190, 100, 0.55)

.gn-slot
  display: block
  width: 12%
  max-width: 54px
  aspect-ratio: 1.35
  border-radius: 8px
  border: 2px dashed rgba(70, 90, 40, 0.5)

  &.full
    border-style: solid
    border-color: rgba(255, 246, 220, 0.9)

.gn-count
  margin: 0
  align-self: center
  padding: 2px 14px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  color: #5a4a2c

.gn-fb
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

@keyframes gn-sway
  0%, 100%
    rotate: 0deg
  50%
    rotate: -1.5deg

// less motion: the cows walk without swaying
@media (prefers-reduced-motion: reduce)
  .gn-cow.walk .gn-turn
    animation: none
</style>
