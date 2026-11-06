<script setup lang="ts">
/**
 * Find Saul again (Acts 11,25-26: "Then departed Barnabas to Tarsus, for to seek Saul: And when he had found him, he brought him unto Antioch").
 * First a painted wooden frame shows Saul (head and shoulders) for a few seconds: "This is what Saul looks like." Then the frame is gone, and people walk through a lane of Tarsus
 * by the river: Saul and others who look like him, each different in one thing only (a grey beard, another cloak, a turban), and a few who look quite different.
 * Barnabas stands on the left and looks out. The child taps Saul (every person is a button: Tab and Enter work, the names never give Saul away): Barnabas has found him,
 * the picture of the two embracing, a tick. Anyone else: he stops a moment, shakes his head in a friendly way and walks on, a cross and "That is not Saul.", a mistake.
 * When Saul walks out of the picture untapped, nothing is lost: everybody comes by again after a pause ("He will come by again").
 * Round 1: Saul and four others in one row, the picture of Saul four seconds; round 2: Saul and six others in two rows, three seconds.
 * "Help me" after fifteen seconds shows the frame with Saul again for two seconds. Less motion: the people move in small jumps. Nothing is drawn. Stars: `osterStars(mistakes)`.
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
import { refindCycle, refindTap, refindX } from '@/utils/paulusNeuA'
import type { RefindGame } from '@/utils/paulusNeuA'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: RefindGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.rounds.length)

const TICK_MS = 50
const IDLE_SECONDS = 15
const HELP_MS = 2000
const NO_MS = 900
const FOUND_MS = 2800
/** Less motion: the people jump this often (ms). */
const JUMP_MS = 600
const still = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const phase = ref<'show' | 'walk' | 'found'>('show')
const time = ref(0)
const helpLeft = ref(0)
/** Walkers that just shook their heads (index -> ms left). */
const no = ref<Record<number, number>>({})
const mistakes = ref(0)
const idle = ref(0)
const finished = ref(false)
const mark = ref<'good' | 'bad' | null>(null)
const message = ref('')
let messageSeq = 0
let saulWasIn = false
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => osterStars(mistakes.value))

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
    if (mark.value === kind) mark.value = null
  }, 900)
}

function startRound() {
  phase.value = 'show'
  time.value = 0
  no.value = {}
  saulWasIn = false
  say(t('app.adventure.refindLook'), current.value.show)
  later(() => {
    phase.value = 'walk'
    idle.value = 0
  }, current.value.show)
}
startRound()

const person = (id: string) => props.game.people.find((p) => p.id === id)
const shownTime = computed(() => (still ? Math.floor(time.value / JUMP_MS) * JUMP_MS : time.value))
const walkers = computed(() =>
  current.value.walkers
    .map((w, k) => {
      const lane = props.game.lanes[w.lane]!
      const x = refindX(current.value, lane, w, shownTime.value, props.game.personW)
      return { k, w, lane, x, p: person(w.id) }
    })
    .filter((v) => v.x !== null && v.p)
)

function loop() {
  if (finished.value) return
  later(loop, TICK_MS)
  if (helpLeft.value > 0) helpLeft.value = Math.max(0, helpLeft.value - TICK_MS)
  const nos = Object.entries(no.value)
  if (nos.length) no.value = Object.fromEntries(nos.map(([k, v]) => [k, v - TICK_MS] as const).filter(([, v]) => v > 0))
  if (phase.value !== 'walk') return
  idle.value += TICK_MS / 1000
  time.value += TICK_MS
  // Saul went by untapped: he comes again (no mistake)
  const saulIn = walkers.value.some((v) => v.p?.saul)
  if (saulWasIn && !saulIn) say(t('app.adventure.refindAgain'), 2600)
  saulWasIn = saulIn
}
later(loop, TICK_MS)

function tapPerson(k: number, id: string) {
  if (phase.value !== 'walk' || finished.value) return
  idle.value = 0
  if (refindTap(props.game, id) === 'saul') {
    progress.mark()
    flash('good')
    play('right')
    phase.value = 'found'
    say(t('app.adventure.refindRight'), 0)
    later(() => {
      if (lastRound.value) {
        play('star')
        finished.value = true
        return
      }
      say(t('app.adventure.gameNext'), 1400)
      round.value++
      startRound()
    }, FOUND_MS)
    return
  }
  if (no.value[k]) return
  mistakes.value++
  play('wrong')
  flash('bad')
  no.value = { ...no.value, [k]: NO_MS }
  say(t('app.adventure.refindWrong'), 2400)
}

/** "Help me": the frame with Saul shows again for two seconds. */
function helpMe() {
  idle.value = 0
  helpLeft.value = HELP_MS
  say(t('app.adventure.refindHelpSay'), HELP_MS + 600)
}

const showFrame = computed(() => phase.value === 'show' || helpLeft.value > 0)
const cycle = computed(() => refindCycle(current.value))
</script>

<template lang="pug">
  div(class="gm" :class="{ still }")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        v-if="phase !== 'found'"
        class="gm-field"
        role="group"
        :aria-label="t('app.adventure.refindField')"
        :data-cycle="cycle"
        :style="{ backgroundImage: `url(${src(game.street)})` }"
      )
        div(class="gm-barnabas" :style="{ width: `${game.barnabasW}%` }" role="img" :aria-label="t('app.adventure.refindBarnabas')")
          GameImage(:src="game.barnabas" :ratio="220 / 330" colour="#9a7a5a" label="barnabas")
        template(v-if="phase === 'walk'")
          button(
            v-for="v in walkers"
            :key="`${round}-${v.k}`"
            type="button"
            class="gm-person"
            :class="{ left: v.lane.dir === -1, no: !!no[v.k] }"
            :data-person="v.w.id"
            :style="{ left: `${v.x}%`, width: `${game.personW}%`, bottom: `${100 - v.lane.y}%`, zIndex: Math.round(v.lane.y) }"
            :aria-label="v.p.name"
            @click="tapPerson(v.k, v.w.id)"
          )
            GameImage(:src="v.p.image" :ratio="200 / 330" colour="#8a6a4a" :label="v.w.id")
            span(v-if="no[v.k]" class="gm-no") ✕
        div(v-if="showFrame" class="gm-frame" role="img" :aria-label="t('app.adventure.refindFrame')")
          span(class="gm-portrait")
            GameImage(:src="game.portrait" :ratio="340 / 400" colour="#b89a7a" label="saulus-bild")
          span(class="gm-frame-pic")
            GameImage(:src="game.frame" :ratio="420 / 480" colour="transparent" label="erinnerung-rahmen")
          span(class="gm-frame-word") {{ t('app.adventure.refindLook') }}
        span(v-if="mark" class="gm-mark")
          GameMark(:kind="mark")
      div(v-else class="gm-field gm-end" :style="{ backgroundImage: `url(${src(game.found)})` }" role="img" :aria-label="t('app.adventure.refindFound')")
        span(v-if="mark" class="gm-mark")
          GameMark(:kind="mark")
      AdvButton(v-if="idle > IDLE_SECONDS && phase === 'walk' && !helpLeft" tone="blau" @click="helpMe") {{ t('app.adventure.refindHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.refindDone')" @next="emit('done', stars)")
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
  color: #5f4f35

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
  background-color: #d8c49a
  background-size: cover
  background-position: center

.gm-barnabas
  position: absolute
  left: 1%
  bottom: 2%
  z-index: 100
  pointer-events: none

.gm-person
  position: absolute
  display: block
  min-width: 44px
  min-height: 44px
  padding: 0
  border: 0
  background: none
  transform: translateX(-50%)
  cursor: pointer
  filter: drop-shadow(0 3px 4px rgba(40, 25, 5, 0.35))

  &.left :deep(.gi)
    transform: scaleX(-1)

  &.no
    animation: gm-shake 450ms ease-in-out 2

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 2px
    border-radius: 8px

.gm-no
  position: absolute
  top: -6px
  left: 50%
  transform: translateX(-50%)
  padding: 0 7px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  color: #8a2a1a

.gm-frame
  position: absolute
  top: 4%
  left: 50%
  width: 34%
  transform: translateX(-50%)
  z-index: 200
  pointer-events: none

.gm-portrait
  position: absolute
  left: 10%
  right: 10%
  top: 9%
  display: block

.gm-frame-pic
  position: relative
  display: block

.gm-frame-word
  display: block
  margin-top: 4px
  padding: 2px 8px
  border-radius: 10px
  background: rgba(255, 246, 220, 0.94)
  text-align: center
  font-weight: 800
  font-size: 1rem
  color: #3f321b

.gm-mark
  position: absolute
  top: 6%
  right: 6%
  display: block
  z-index: 300

.gm-end
  background-size: cover
  background-position: center

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

@keyframes gm-shake
  0%, 100%
    margin-left: 0
  30%
    margin-left: -4px
  70%
    margin-left: 4px

.still .gm-person.no
  animation: none

@media (prefers-reduced-motion: reduce)
  .gm-person.no
    animation: none
</style>
