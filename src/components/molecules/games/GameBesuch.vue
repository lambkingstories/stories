<script setup lang="ts">
/**
 * Welcome everyone (Acts 28,16.20.30: Paul lives in his own house with a soldier who guards him, he wears a chain, and "received all that came in unto him"). The room in Rome from above; on
 * the floor lie painted mats, the places for the stool of the soldier. A guest comes in and sits down at his place (two at once in round 2). The child chooses the place where the soldier sits
 * down with his stool (a tap on a mat, or the arrow keys and Enter). The chain keeps Paulus near the soldier: if the guest lies within the length of the chain, Paulus walks to him, talks
 * and the guest listens (a tick). If not, Paulus walks to the end of the chain and stops (a cross and "The chain does not reach that far", a mistake) and the child chooses again. In round 1 a
 * first tap on a mat shows the circle of the chain, a second tap sets the soldier there; in round 2 there is no circle. For two guests at once one place reaches both: Paulus goes to them one
 * after the other. "Help me" after fifteen seconds lets the right mat shimmer and shows the circle. Stars: `osterStars(mistakes)`.
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
import type { PrPt } from '@/utils/paulusromNeuA'
import { visitorsEnd, visitorsHelp, visitorsReaches, visitorsReachesAll, visitorsStand } from '@/utils/paulusromNeuB'
import type { VisitorsGame } from '@/utils/paulusromNeuB'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: VisitorsGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.rounds.reduce((s, r) => s + r.visits.reduce((n, v) => n + v.arrivals.length, 0), 0))

const IDLE_SECONDS = 15
/** The painted chain is very fine (a tenth of its picture is chain): the picture is made this many times thicker, so that it can be seen on a phone (only scaled, nothing drawn). */
const CHAIN_THICK = 4
const reduced = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
const CARRY_MS = reduced ? 150 : 800
const WALK_MS = reduced ? 150 : 1000
const TALK_MS = reduced ? 400 : 1300

const round = ref(0)
const visit = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const ratio = computed(() => props.game.ratio ?? 4 / 3)
/** The place (index into `game.stools`) where the soldier sits. */
const stool = ref(current.value.stools[0]!)
const carrying = ref(false)
const preview = ref(-1)
const cursor = ref(-1)
const pose = ref<'stand' | 'walk' | 'talk'>('stand')
const paulusAt = ref<PrPt>(beside(stool.value))
/** The guests who sit in the room: which guest, where, and whether he listens already. */
const seated = ref<{ guest: number; at: PrPt; listens: boolean }[]>([])
const busy = ref(false)
const helpStool = ref(-1)
const mistakes = ref(0)
const idle = ref(0)
const between = ref(false)
const finished = ref(false)
const finale = ref(false)
const crossAt = ref<PrPt | null>(null)
const tickAt = ref<PrPt | null>(null)
const message = ref('')
const welcomed = ref(0)
let messageSeq = 0
let markSeq = 0
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => osterStars(mistakes.value))
const currentVisit = computed(() => current.value.visits[visit.value] ?? null)

function beside(s: number): PrPt {
  const p = props.game.stools[s]!
  return { x: p.x + props.game.beside.x, y: p.y + props.game.beside.y }
}
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
  if (!busy.value && !between.value && !finished.value) idle.value += 0.25
  later(idleLoop, 250)
}
later(idleLoop, 250)

/** The guests of the visit sit down at their places. */
function comeIn() {
  const v = currentVisit.value
  if (!v) return
  for (const a of v.arrivals) seated.value.push({ guest: a.guest, at: { ...a.at }, listens: false })
  say(t(v.arrivals.length > 1 ? 'app.adventure.visitorsComes2' : 'app.adventure.visitorsComes1'), 2400)
}
comeIn()

/** A tap on a mat `s`. */
function pick(s: number) {
  if (busy.value || between.value || finished.value || !current.value.stools.includes(s)) return
  idle.value = 0
  helpStool.value = -1
  if (current.value.showReach && preview.value !== s) {
    preview.value = s
    say(t('app.adventure.visitorsPreview'), 0)
    return
  }
  preview.value = -1
  choose(s)
}

/** The soldier carries his stool to the mat `s`, sits down, and Paulus tries to reach the guests. */
function choose(s: number) {
  const v = currentVisit.value
  if (!v) return
  busy.value = true
  carrying.value = true
  stool.value = s
  paulusAt.value = beside(s)
  pose.value = 'walk'
  later(() => {
    carrying.value = false
    pose.value = 'stand'
    if (visitorsReachesAll(props.game, s, v)) walkTo(s, 0)
    else fail(s)
  }, CARRY_MS)
}

/** Paulus goes to the guest `k` of the visit and talks to him. */
function walkTo(s: number, k: number) {
  const v = currentVisit.value!
  const a = v.arrivals[k]!
  pose.value = 'walk'
  paulusAt.value = visitorsStand(props.game, s, a.at)
  later(() => {
    pose.value = 'talk'
    const guest = seated.value.find((g) => g.guest === a.guest)
    if (guest) guest.listens = true
    welcomed.value++
    progress.mark()
    play('found')
    flash('good', a.at)
    say(t(v.arrivals.length > 1 ? 'app.adventure.visitorsRightTwo' : 'app.adventure.visitorsRight'), 2400)
    later(() => {
      if (k + 1 < v.arrivals.length) walkTo(s, k + 1)
      else nextVisit()
    }, TALK_MS)
  }, WALK_MS)
}

function fail(s: number) {
  const v = currentVisit.value!
  const first = v.arrivals.find((a) => !visitorsReaches(props.game, s, a.at))!
  mistakes.value++
  pose.value = 'walk'
  paulusAt.value = visitorsEnd(props.game, s, first.at)
  later(() => {
    pose.value = 'stand'
    play('wrong')
    flash('bad', paulusAt.value)
    say(t('app.adventure.visitorsWrong'))
    later(() => {
      paulusAt.value = beside(s)
      busy.value = false
    }, 900)
  }, WALK_MS)
}

function nextVisit() {
  pose.value = 'stand'
  paulusAt.value = beside(stool.value)
  visit.value++
  if (visit.value < current.value.visits.length) {
    comeIn()
    busy.value = false
    idle.value = 0
    return
  }
  endRound()
}

function endRound() {
  between.value = true
  later(() => play('right'), 300)
  if (lastRound.value) {
    finale.value = true
    say(t('app.adventure.visitorsAll'), 0)
    later(() => {
      play('star')
      finished.value = true
    }, 3200)
    return
  }
  say(t('app.adventure.visitorsRoundDone'), 0)
  later(() => say(t('app.adventure.gameNext'), 0), 1300)
  later(() => {
    round.value++
    visit.value = 0
    seated.value = []
    stool.value = current.value.stools[0]!
    paulusAt.value = beside(stool.value)
    preview.value = -1
    cursor.value = -1
    between.value = false
    busy.value = false
    idle.value = 0
    message.value = ''
    comeIn()
  }, 2800)
}

// ---- the keyboard
function onKey(e: KeyboardEvent) {
  if (busy.value || between.value || finished.value) return
  const k = e.key
  const list = current.value.stools
  if (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown') {
    e.preventDefault()
    idle.value = 0
    const at = list.indexOf(cursor.value)
    const dir = k === 'ArrowRight' || k === 'ArrowDown' ? 1 : -1
    cursor.value = list[at < 0 ? (dir > 0 ? 0 : list.length - 1) : (at + dir + list.length) % list.length]!
    say(t('app.adventure.visitorsStool', { n: list.indexOf(cursor.value) + 1 }), 0)
    return
  }
  if (k === 'Enter' || k === ' ') {
    e.preventDefault()
    if (cursor.value < 0) {
      cursor.value = list[0]!
      say(t('app.adventure.visitorsStool', { n: 1 }), 0)
      return
    }
    pick(cursor.value)
  }
}

/** "Help me": the mat that reaches every guest of the visit shimmers, and its circle shows. */
function helpMe() {
  idle.value = 0
  const v = currentVisit.value
  const s = v ? visitorsHelp(props.game, current.value, v) : null
  helpStool.value = s === null ? -1 : s
  say(t('app.adventure.visitorsHelpSay'), 4000)
}

// ---- looks
const stoolStyle = (s: number) => ({ left: `${props.game.stools[s]!.x}%`, top: `${props.game.stools[s]!.y}%` })
const soldierStyle = computed(() => ({ left: `${props.game.stools[stool.value]!.x}%`, top: `${props.game.stools[stool.value]!.y}%`, width: `${props.game.soldierW}%` }))
const paulusStyle = computed(() => ({ left: `${paulusAt.value.x}%`, top: `${paulusAt.value.y}%`, width: `${props.game.paulusW}%` }))
const guestStyle = (g: { at: PrPt }) => ({ left: `${g.at.x}%`, top: `${g.at.y}%`, width: `${props.game.guestW}%` })
const reachShown = computed(() => (preview.value >= 0 ? preview.value : helpStool.value))
const reachStyle = computed(() => {
  const s = reachShown.value
  if (s < 0) return {}
  const p = props.game.stools[s]!
  return { left: `${p.x}%`, top: `${p.y}%`, width: `${props.game.chainLen * 2}%` }
})
/** The chain: from the stool to Paulus, as long as the distance (the picture is 10 : 1), turned to point at him. */
const chainStyle = computed(() => {
  const a = props.game.stools[stool.value]!
  const b = paulusAt.value
  const dx = b.x - a.x
  const dy = (b.y - a.y) / ratio.value
  const len = Math.max(0.5, Math.hypot(dx, dy))
  return { left: `${a.x}%`, top: `${a.y}%`, width: `${len}%`, transform: `translate(0, -50%) rotate(${(Math.atan2(dy, dx) * 180) / Math.PI}deg) scaleY(${CHAIN_THICK})` }
})
const markStyle = (p: PrPt) => ({ left: `${p.x}%`, top: `${p.y}%` })
const paulusImage = computed(() => props.game.paulus[pose.value])
const totalGuests = computed(() => props.game.rounds.reduce((s, r) => s + r.visits.reduce((n, v) => n + v.arrivals.length, 0), 0))
type Seated = { guest: number; at: PrPt; listens: boolean }
const guestId = (g: Seated) => props.game.guests[g.guest]?.id ?? ''
const guestPicture = (g: Seated) => (g.listens ? props.game.guests[g.guest]?.listening : props.game.guests[g.guest]?.image) ?? ''
const guestLabel = (g: Seated) => {
  const name = props.game.guests[g.guest]?.name ?? ''
  return g.listens ? t('app.adventure.visitorsGuest', { name }) : name
}
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        v-if="!finale"
        class="gm-field"
        :style="{ backgroundImage: `url(${src(game.room)})`, aspectRatio: String(ratio) }"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.visitorsField')"
        :aria-description="t('app.adventure.visitorsKeys')"
        @keydown="onKey"
      )
        span(v-if="reachShown >= 0" class="gm-reach" data-reach :style="reachStyle" aria-hidden="true")
          GameImage(:src="game.reach" :ratio="1" round colour="rgba(255,246,220,0.3)" label="reichweite")
        span(class="gm-chain" data-chain :style="chainStyle" aria-hidden="true")
          GameImage(:src="game.chain" :ratio="10" colour="#c9c9c9" label="kette")
        button(
          v-for="s in current.stools"
          :key="`stool-${round}-${s}`"
          type="button"
          class="gm-stool"
          :class="{ cursor: cursor === s, armed: preview === s, help: helpStool === s }"
          :data-stool="s"
          :style="stoolStyle(s)"
          :aria-label="t('app.adventure.visitorsStool', { n: current.stools.indexOf(s) + 1 })"
          :aria-pressed="preview === s ? 'true' : 'false'"
          :disabled="busy || between"
          @click="pick(s)"
        )
        span(class="gm-soldier" data-soldier :style="soldierStyle" aria-hidden="true")
          GameImage(:src="carrying ? game.soldier.carry : game.soldier.sit" :ratio="0.786" colour="#9aa0a6" :label="carrying ? 'soldat-traegt' : 'soldat-hocker'")
        span(class="gm-paulus" :class="pose" data-paulus :data-pose="pose" :style="paulusStyle" role="img" aria-label="Paulus")
          GameImage(:src="paulusImage" :ratio="0.667" colour="#c9b48a" :label="`paulus-${pose}`")
        span(
          v-for="(g, gi) in seated"
          :key="`guest-${round}-${gi}`"
          class="gm-guest"
          :class="{ listens: g.listens }"
          :data-guest="g.guest"
          :style="guestStyle(g)"
          role="img"
          :aria-label="guestLabel(g)"
        )
          GameImage(:src="guestPicture(g)" :ratio="0.667" colour="#c9b48a" :label="guestId(g)")
        span(v-if="crossAt" class="gm-mark" :style="markStyle(crossAt)")
          GameMark(kind="bad")
        span(v-if="tickAt" class="gm-mark" :style="markStyle(tickAt)")
          GameMark(kind="good")
      div(v-else class="gm-finale" role="img" :aria-label="t('app.adventure.visitorsAll')" data-finale)
        GameImage(:src="game.finale" :ratio="1.5" colour="#c9b48a" label="alle-hoeren")
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.visitorsCount', { n: welcomed, total: totalGuests }) }}
      AdvButton(v-if="idle > IDLE_SECONDS && !busy && !between" tone="gold" @click="helpMe") {{ t('app.adventure.visitorsHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.visitorsDone')" @next="emit('done', stars)")
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

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

.gm-finale
  width: 100%
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e

.gm-reach
  position: absolute
  display: block
  aspect-ratio: 1 / 1
  transform: translate(-50%, -50%)
  pointer-events: none
  opacity: 0.8
  z-index: 1

.gm-chain
  position: absolute
  display: block
  transform-origin: 0 50%
  pointer-events: none
  z-index: 3
  transition: width 900ms ease, transform 900ms ease

// a mat for the stool: an invisible round button of at least 44 pixels with a dashed ring, so that the places can be found
.gm-stool
  position: absolute
  display: block
  width: 12%
  min-width: 44px
  aspect-ratio: 1 / 1
  padding: 0
  transform: translate(-50%, -50%)
  border: 3px dashed rgba(255, 246, 220, 0.85)
  border-radius: 50%
  background: transparent
  cursor: pointer
  z-index: 4

  &.cursor, &.armed
    border-style: solid
    border-color: #fff6dc
    box-shadow: 0 0 0 3px rgba(40, 25, 5, 0.55)

  &.help
    border-style: solid
    border-color: #fff6dc
    background: rgba(255, 246, 220, 0.35)
    box-shadow: 0 0 14px 5px rgba(255, 233, 160, 0.9)
    animation: gm-glow 1400ms ease-in-out infinite

.gm-soldier
  position: absolute
  display: block
  transform: translate(-50%, -62%)
  pointer-events: none
  z-index: 5
  transition: left 800ms ease, top 800ms ease
  filter: drop-shadow(0 3px 4px rgba(40, 25, 5, 0.45))

.gm-paulus
  position: absolute
  display: block
  transform: translate(-50%, -75%)
  pointer-events: none
  z-index: 6
  transition: left 1000ms ease, top 1000ms ease
  filter: drop-shadow(0 3px 4px rgba(40, 25, 5, 0.45))

.gm-guest
  position: absolute
  display: block
  transform: translate(-50%, -75%)
  pointer-events: none
  z-index: 5
  filter: drop-shadow(0 3px 4px rgba(40, 25, 5, 0.45))
  animation: gm-enter 600ms ease

.gm-mark
  position: absolute
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 8

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

@keyframes gm-enter
  from
    opacity: 0
  to
    opacity: 1

@keyframes gm-glow
  0%, 100%
    opacity: 0.6
  50%
    opacity: 1

@media (prefers-reduced-motion: reduce)
  .gm-soldier, .gm-paulus, .gm-chain
    transition: none

  .gm-guest, .gm-stool.help
    animation: none
</style>
