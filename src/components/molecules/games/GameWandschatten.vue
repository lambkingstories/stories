<script setup lang="ts">
/**
 * Shadows on the wall (Acts 20,8: "many lights in the upper chamber"). The room in Troas at night: many little lamps, a bright wall, below a row of listeners. The lamps throw a shadow on
 * the wall, a painted dark shape without a face. The child taps the person who casts it. Right: the person nods, a tick, the shadow wanders down to him and fades. Wrong: a cross and
 * "Look closely at the shape", the shadow stays, a mistake. A person who has found his shadow cannot be tapped again. Round 1: four people with very different shapes, the shadows as they are;
 * round 2: six people with similar shapes, the shadows bigger or turned round (the lamp stands nearer or on the other side). "Help me" after fifteen seconds lights the right person.
 * Keyboard: left/right choose a person, Enter taps. Nothing is shown by colour alone (tick, cross, words). Stars: `osterStars(mistakes)`.
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
import { wallFits, wallPersonW, wallPersonX, wallShadowSize } from '@/utils/paulusromNeuA'
import type { PrPt, WallPerson, WallShadowGame } from '@/utils/paulusromNeuA'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: WallShadowGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.rounds.reduce((s, r) => s + r.shadows.length, 0))

const IDLE_SECONDS = 15

const round = ref(0)
const step = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const ratio = computed(() => props.game.ratio ?? 1.5)
const row = computed<WallPerson[]>(() => current.value.people.map((id) => props.game.people.find((p) => p.id === id)!).filter(Boolean))
const shadow = computed(() => (step.value < current.value.shadows.length ? current.value.shadows[step.value]! : null))
const shadowPerson = computed(() => props.game.people.find((p) => p.id === shadow.value?.id))
/** The people whose shadow is found in this round. */
const found = ref<string[]>([])
const settled = ref(false)
const nod = ref('')
const cursor = ref(-1)
const helpOn = ref(false)
const mistakes = ref(0)
const idle = ref(0)
const between = ref(false)
const finished = ref(false)
const crossAt = ref<PrPt | null>(null)
const tickAt = ref<PrPt | null>(null)
const message = ref('')
let messageSeq = 0
let markSeq = 0
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => osterStars(mistakes.value))
const personW = computed(() => wallPersonW(props.game, row.value.length))

function say(text: string, ms = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}
function flash(kind: 'good' | 'bad', at: PrPt) {
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
  if (!between.value && !finished.value && !settled.value) idle.value += 0.25
  later(idleLoop, 250)
}
later(idleLoop, 250)

const spotOf = (i: number): PrPt => ({ x: wallPersonX(row.value.length, i), y: props.game.rowY - 12 })

/** Person `i` was tapped. */
function choose(i: number) {
  const p = row.value[i]
  const sh = shadow.value
  if (between.value || finished.value || settled.value || !p || !sh) return
  idle.value = 0
  helpOn.value = false
  if (found.value.includes(p.id)) {
    say(t('app.adventure.wallShadowsTaken'))
    return
  }
  if (!wallFits(sh, p)) {
    mistakes.value++
    play('wrong')
    flash('bad', spotOf(i))
    say(t('app.adventure.wallShadowsWrong'))
    return
  }
  found.value.push(p.id)
  settled.value = true
  nod.value = p.id
  progress.mark()
  play('found')
  flash('good', spotOf(i))
  say(t('app.adventure.wallShadowsRight', { name: p.name }), 2000)
  later(() => {
    nod.value = ''
  }, 700)
  later(() => {
    settled.value = false
    step.value++
    if (step.value >= current.value.shadows.length) endRound()
  }, 1100)
}

function endRound() {
  between.value = true
  cursor.value = -1
  later(() => play('right'), 300)
  say(t('app.adventure.wallShadowsRoundDone'), 0)
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
    step.value = 0
    found.value = []
    between.value = false
    idle.value = 0
    message.value = ''
  }, 2800)
}

// ---- the keyboard
function onKey(e: KeyboardEvent) {
  if (between.value || finished.value) return
  const k = e.key
  const n = row.value.length
  if (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown') {
    e.preventDefault()
    idle.value = 0
    const dir = k === 'ArrowRight' || k === 'ArrowDown' ? 1 : -1
    cursor.value = cursor.value < 0 ? (dir > 0 ? 0 : n - 1) : (cursor.value + dir + n) % n
    say(t('app.adventure.wallShadowsCursor', { name: row.value[cursor.value]!.name }), 0)
    return
  }
  if (k === 'Enter' || k === ' ') {
    e.preventDefault()
    if (cursor.value < 0) {
      cursor.value = 0
      say(t('app.adventure.wallShadowsCursor', { name: row.value[0]!.name }), 0)
      return
    }
    choose(cursor.value)
  }
}
/** "Help me": the person who casts the shadow lights up. */
function helpMe() {
  idle.value = 0
  helpOn.value = true
  say(t('app.adventure.wallShadowsHelpSay'), 4000)
}

// ---- looks
const personStyle = (i: number) => ({ left: `${wallPersonX(row.value.length, i)}%`, top: `${props.game.rowY}%`, width: `${personW.value}%` })
const shadowStyle = computed(() => {
  const sh = shadow.value
  if (!sh) return {}
  const size = wallShadowSize(props.game, sh.scale)
  const i = row.value.findIndex((p) => p.id === sh.id)
  const to = settled.value && i >= 0 ? { left: wallPersonX(row.value.length, i), top: props.game.rowY - 6 } : { left: props.game.wall.x, top: props.game.wall.base }
  return {
    left: `${to.left}%`,
    top: `${to.top}%`,
    width: `${size.w}%`,
    transform: `translate(-50%, -100%) scale(${settled.value ? 0.45 : 1}) scaleX(${sh.flip ? -1 : 1})`
  }
})
const markStyle = (p: PrPt) => ({ left: `${p.x}%`, top: `${p.y}%` })
const isHelp = (p: WallPerson) => helpOn.value && shadow.value?.id === p.id
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        class="gm-field"
        :style="{ backgroundImage: `url(${src(game.room)})`, aspectRatio: String(ratio) }"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.wallShadowsField')"
        @keydown="onKey"
      )
        div(
          v-if="shadow && shadowPerson"
          :key="`shadow-${round}-${step}`"
          class="gm-shadow"
          :class="{ settled }"
          data-shadow
          :data-shadow-id="shadow.id"
          :style="shadowStyle"
          role="img"
          :aria-label="t('app.adventure.wallShadowsWall', { name: shadowPerson.shadowName })"
        )
          GameImage(:src="shadowPerson.shadow" :ratio="0.714" colour="#3a2e22" :label="shadowPerson.shadowName")
        div(class="gm-row" role="group" :aria-label="t('app.adventure.wallShadowsRow')")
          button(
            v-for="(p, i) in row"
            :key="`person-${round}-${p.id}`"
            type="button"
            class="gm-person"
            :class="{ nod: nod === p.id, cursor: cursor === i, help: isHelp(p), found: found.includes(p.id) }"
            :data-person="p.id"
            :style="personStyle(i)"
            :aria-label="found.includes(p.id) ? t('app.adventure.wallShadowsFound', { name: p.name }) : p.name"
            tabindex="-1"
            @click="choose(i)"
          )
            GameImage(:src="p.image" :ratio="0.667" colour="#c9b48a" :label="p.name")
            span(v-if="found.includes(p.id)" class="gm-ok" aria-hidden="true") ✓
        span(v-if="crossAt" class="gm-mark" :style="markStyle(crossAt)")
          GameMark(kind="bad")
        span(v-if="tickAt" class="gm-mark" :style="markStyle(tickAt)")
          GameMark(kind="good")
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.wallShadowsCount', { n: Math.min(step, current.shadows.length), total: current.shadows.length }) }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between" tone="gold" @click="helpMe") {{ t('app.adventure.wallShadowsHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.wallShadowsDone')" @next="emit('done', stars)")
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
  background-color: #6b5b45
  background-size: cover
  background-position: center

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

// the shadow on the wall: it fades in softly; when found it shrinks and wanders down to its person
.gm-shadow
  position: absolute
  display: block
  opacity: 0.92
  pointer-events: none
  z-index: 2
  transition: left 800ms ease, top 800ms ease, transform 800ms ease, opacity 800ms ease
  animation: gm-appear 600ms ease

  &.settled
    opacity: 0

.gm-row
  position: absolute
  inset: 0
  pointer-events: none

.gm-person
  position: absolute
  display: block
  min-width: 44px
  min-height: 44px
  padding: 0
  transform: translate(-50%, -100%)
  border: 3px solid transparent
  border-radius: 12px
  background: transparent
  cursor: pointer
  pointer-events: auto
  z-index: 3
  filter: drop-shadow(0 3px 4px rgba(20, 10, 0, 0.5))

  &.cursor
    border-color: #fff6dc
    box-shadow: 0 0 0 3px rgba(40, 25, 5, 0.55)

  &.help
    border-color: #fff6dc
    border-style: dashed
    box-shadow: 0 0 14px 4px rgba(255, 233, 160, 0.9)

  &.found
    opacity: 0.8

  &.nod
    animation: gm-nod 600ms ease

.gm-ok
  position: absolute
  top: -6px
  right: -6px
  width: 22px
  height: 22px
  display: flex
  align-items: center
  justify-content: center
  border-radius: 50%
  border: 2px solid #fff
  background: #2f6b3f
  color: #fff
  font-weight: 900
  font-size: 0.9rem
  line-height: 1

.gm-mark
  position: absolute
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 6

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

@keyframes gm-appear
  from
    opacity: 0
  to
    opacity: 0.92

@keyframes gm-nod
  0%, 100%
    transform: translate(-50%, -100%)
  35%
    transform: translate(-50%, calc(-100% + 6px))
  65%
    transform: translate(-50%, calc(-100% - 3px))

@media (prefers-reduced-motion: reduce)
  .gm-shadow
    transition: none
    animation: none

  .gm-person.nod
    animation: none
</style>
