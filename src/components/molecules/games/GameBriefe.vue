<script setup lang="ts">
/**
 * Seven letters (Rev 1,11; 2-3). A painted map of the coast of Asia with a road that runs in a ring through seven cities, every city with a big painted landmark (no writing). A messenger
 * walks the road and stops at every gate. In the satchel below lie the letters, equal rolls, each with a seal that shows the landmark of its city and the name of the city under it. The child
 * gives the messenger the letter of the city he stands in (a tap on the letter). Right: he takes it, a little golden lamp lights in the gate (Rev 1,20: the seven lampstands are the seven
 * churches), a tick and a bright tone, and he walks on. Wrong: a cross and "That is not the letter for this city", a mistake; the messenger waits as long as it takes. Round 1: the first three cities,
 * the names stand at the gates. Round 2: all seven, no names at the gates (the landmark and the seal tell). "Help me" after fifteen seconds lifts the right letter. Keyboard: Tab to a letter and
 * Enter, or the arrow keys between the letters. Less motion: the messenger does not walk but stands at the next gate. Nothing is shown by colour alone. Stars: `osterStars(mistakes)`.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { osterStars } from '@/utils/osternGames'
import { lettersFits, lettersGate, lettersLength, lettersPointAt } from '@/utils/offenbarungNeuA'
import type { LettersCity, LettersGame, Pt } from '@/utils/offenbarungNeuA'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: LettersGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.rounds.reduce((s, r) => s + r.cities.length, 0))

const TICK_MS = 50
const IDLE_SECONDS = 15
const still = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const ratio = computed(() => props.game.ratio ?? 1.5)
const total = computed(() => lettersLength(props.game.path, ratio.value))
const cityOf = (id: string): LettersCity => props.game.cities.find((c) => c.id === id)!
/** The cities of the round in the order of the visit. */
const stops = computed<LettersCity[]>(() => current.value.cities.map(cityOf))
/** The city the messenger is walking to or standing in. */
const stop = ref(0)
const pos = ref(0)
const walking = ref(false)
const waiting = ref(false)
const lamps = ref<string[]>([])
const tray = ref<string[]>([...current.value.tray])
const wiggle = ref('')
const helpLetter = ref<string | null>(null)
const mistakes = ref(0)
const idle = ref(0)
const between = ref(false)
const finished = ref(false)
const frame = ref(0)
const tickAt = ref<Pt | null>(null)
const crossAt = ref<Pt | null>(null)
const message = ref('')
let messageSeq = 0
let markSeq = 0
let stepMs = 0
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => osterStars(mistakes.value))
const here = computed(() => stops.value[stop.value])
const messengerAt = computed<Pt>(() => lettersPointAt(props.game.path, pos.value, ratio.value))
const showNames = computed(() => current.value.names)

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

function startWalk() {
  const c = here.value
  if (!c || between.value || finished.value) return
  helpLetter.value = null
  if (still) {
    pos.value = c.at
    arrive()
    return
  }
  walking.value = true
}
function arrive() {
  walking.value = false
  waiting.value = true
  idle.value = 0
  const c = here.value
  say(showNames.value && c ? t('app.adventure.lettersAt', { name: c.name }) : t('app.adventure.lettersAtGate'), 0)
}

function step() {
  if (finished.value) return
  later(step, TICK_MS)
  if (between.value) return
  if (waiting.value) idle.value += TICK_MS / 1000
  if (!walking.value) return
  const c = here.value
  if (!c) return
  const dt = TICK_MS / 1000
  pos.value = Math.min(c.at, pos.value + (props.game.speed * dt) / Math.max(1, total.value))
  stepMs += TICK_MS
  if (stepMs >= 250) {
    stepMs = 0
    frame.value = (frame.value + 1) % 2
  }
  if (pos.value >= c.at - 1e-9) {
    pos.value = c.at
    arrive()
  }
}
later(step, TICK_MS)
later(startWalk, 700)

/** The letter of city `id` is given to the messenger. */
function give(id: string) {
  const c = here.value
  if (!waiting.value || !c || between.value || finished.value || !tray.value.includes(id)) return
  idle.value = 0
  const g = lettersGate(props.game, c)
  if (!lettersFits(c.id, id)) {
    mistakes.value++
    play('wrong')
    flash('bad', g)
    wiggle.value = id
    later(() => {
      if (wiggle.value === id) wiggle.value = ''
    }, 600)
    say(t('app.adventure.lettersWrong'), 2800)
    return
  }
  waiting.value = false
  helpLetter.value = null
  tray.value = tray.value.filter((x) => x !== id)
  lamps.value.push(c.id)
  progress.mark()
  play('found')
  flash('good', g)
  say(showNames.value ? t('app.adventure.lettersRight', { name: c.name }) : t('app.adventure.lettersRightGate'), 2000)
  stop.value++
  if (stop.value >= stops.value.length) {
    endRound()
    return
  }
  later(startWalk, 900)
}

function endRound() {
  between.value = true
  later(() => play('right'), 300)
  say(t('app.adventure.lettersRoundDone'), 0)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 2600)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 1300)
  later(() => {
    round.value++
    stop.value = 0
    pos.value = 0
    lamps.value = []
    tray.value = [...current.value.tray]
    between.value = false
    idle.value = 0
    message.value = ''
    later(startWalk, 500)
  }, 2800)
}

// ---- the keyboard: arrow keys move between the letters
function onTrayKey(e: KeyboardEvent) {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
  const box = e.currentTarget as HTMLElement | null
  if (!box) return
  e.preventDefault()
  const all = Array.from(box.querySelectorAll<HTMLElement>('button'))
  if (!all.length) return
  const at = all.indexOf(document.activeElement as HTMLElement)
  const next = all[(at < 0 ? 0 : at + (e.key === 'ArrowRight' ? 1 : -1) + all.length) % all.length]
  next?.focus()
}

/** "Help me": the right letter lifts out of the satchel. */
function helpMe() {
  idle.value = 0
  const c = here.value
  if (!c || !waiting.value) return
  helpLetter.value = c.id
  say(t('app.adventure.lettersHelpSay'), 4000)
}

// ---- looks
const pointStyle = (p: Pt) => ({ left: `${p.x}%`, top: `${p.y}%` })
const gateStyle = (c: LettersCity) => ({ ...pointStyle(lettersGate(props.game, c)), width: `${props.game.gateR * 2}%` })
const lampStyle = (c: LettersCity) => ({ ...pointStyle(lettersGate(props.game, c)), width: `${props.game.lampW}%` })
const messengerStyle = computed(() => ({ ...pointStyle(messengerAt.value), width: `${props.game.messengerW}%` }))
const messengerPic = computed(() => props.game.messenger[frame.value % 2]!)
const isNow = (c: LettersCity) => waiting.value && here.value?.id === c.id
const lit = (c: LettersCity) => lamps.value.includes(c.id)
</script>

<template lang="pug">
  div(class="gm" :class="{ still }")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ game.rounds[round]?.hint }}
      div(
        class="gm-field"
        :style="{ backgroundImage: `url(${src(game.map)})`, aspectRatio: String(ratio) }"
        role="group"
        :aria-label="t('app.adventure.lettersField')"
      )
        div(
          v-for="c in stops"
          :key="`gate-${round}-${c.id}`"
          class="gm-gate"
          :class="{ now: isNow(c), lit: lit(c) }"
          :data-gate="c.id"
          :style="gateStyle(c)"
          role="img"
          :aria-label="t('app.adventure.lettersGate', { name: c.name })"
        )
          span(v-if="showNames" class="gm-gname") {{ c.name }}
        span(v-for="c in stops" :key="`lamp-${round}-${c.id}`" v-show="lit(c)" class="gm-lamp" :data-lamp="c.id" :style="lampStyle(c)" aria-hidden="true")
          GameImage(:src="game.lamp" :ratio="0.667" colour="#f2c46a" label="leuchter")
        div(class="gm-messenger" :class="{ walk: walking }" :style="messengerStyle" role="img" :aria-label="t('app.adventure.lettersMessenger')")
          GameImage(:src="messengerPic" :ratio="0.615" colour="#c9b48a" label="bote")
        span(v-if="crossAt" class="gm-mark" :style="pointStyle(crossAt)")
          GameMark(kind="bad")
        span(v-if="tickAt" class="gm-mark" :style="pointStyle(tickAt)")
          GameMark(kind="good")
      div(class="gm-tray" role="group" :aria-label="t('app.adventure.lettersTray')" @keydown="onTrayKey")
        button(
          v-for="id in tray"
          :key="`letter-${round}-${id}`"
          type="button"
          class="gm-letter"
          :class="{ wiggle: wiggle === id, help: helpLetter === id }"
          :data-letter="id"
          :disabled="!waiting || between"
          :aria-label="t('app.adventure.lettersLetter', { name: cityOf(id).name })"
          @click="give(id)"
        )
          GameImage(:src="cityOf(id).letter" :ratio="1.833" colour="#e6d3a5" :label="cityOf(id).id")
          span(class="gm-lname") {{ cityOf(id).name }}
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.lettersCount', { n: lamps.length, total: stops.length }) }}
      AdvButton(v-if="idle > IDLE_SECONDS && waiting && !between" tone="gold" @click="helpMe") {{ t('app.adventure.lettersHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.lettersDone')" @next="emit('done', stars)")
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

.gm-field
  position: relative
  width: 100%
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #b9a77a
  background-size: cover
  background-position: center

// a gate: a thin ring on the map; the one the messenger stands in is drawn solid
.gm-gate
  position: absolute
  display: block
  aspect-ratio: 1 / 1
  transform: translate(-50%, -50%)
  border: 3px dashed rgba(255, 246, 220, 0.9)
  border-radius: 50%
  box-shadow: 0 0 0 2px rgba(40, 25, 5, 0.45)
  pointer-events: none
  z-index: 2

  &.now
    border-style: solid
    border-color: #fff6dc
    box-shadow: 0 0 0 3px rgba(40, 25, 5, 0.65)

  &.lit
    border-style: double

.gm-gname
  position: absolute
  left: 50%
  top: 100%
  transform: translate(-50%, 2px)
  padding: 0 8px
  border-radius: 10px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  line-height: 1.3
  white-space: nowrap
  color: #3f321b

.gm-lamp
  position: absolute
  display: block
  transform: translate(25%, -95%)
  pointer-events: none
  z-index: 4
  filter: drop-shadow(0 0 6px rgba(255, 220, 120, 0.9))

.gm-messenger
  position: absolute
  display: block
  min-width: 40px
  transform: translate(-50%, -92%)
  pointer-events: none
  z-index: 5
  filter: drop-shadow(0 3px 3px rgba(40, 25, 5, 0.45))

.gm-mark
  position: absolute
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 7

.gm-tray
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 6px
  min-height: 90px

.gm-letter
  position: relative
  display: flex
  flex-direction: column
  align-items: center
  gap: 2px
  width: calc(25% - 6px)
  min-width: 80px
  min-height: 64px
  padding: 4px
  border: 3px solid #d4a83e
  border-radius: 14px
  background: rgba(255, 246, 220, 0.94)
  cursor: pointer
  transition: transform 200ms ease

  &:disabled
    cursor: default
    opacity: 0.75

  &:focus-visible
    outline: 3px solid #2f6b8a
    outline-offset: 2px

  &.help
    transform: translateY(-8px)
    border-color: #2f6b8a
    border-style: double
    border-width: 5px

  &.wiggle
    animation: gm-wiggle 500ms ease

.gm-lname
  font-weight: 800
  font-size: 1rem
  line-height: 1.15
  text-align: center
  overflow-wrap: anywhere
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

@keyframes gm-wiggle
  0%, 100%
    transform: translateX(0)
  25%
    transform: translateX(-6px)
  75%
    transform: translateX(6px)

@media (prefers-reduced-motion: reduce)
  .gm-letter
    transition: none

    &.wiggle
      animation: none
</style>
