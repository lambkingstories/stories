<script setup lang="ts">
/**
 * "Give back the pledge" (Nehemiah 5,11-12): a square in Jerusalem, the open chest in front, the families behind it. Above every family hangs, pale, the paper it waits for:
 * its field, its vineyard, its olive grove or its house. The child pulls the next pledge paper out of the chest (press the chest and drag the paper to a family, or tap the chest and then
 * the family; Enter on the chest and on a family, the arrow keys go from one to the next). The right family takes it: the paper is bright, a tick and "The field is theirs again!".
 * The wrong family: a cross, "That is not their pledge", the paper goes back above the chest (a mistake). Round 2 has four families in another order.
 * The button "Help me" comes after fifteen seconds without a move; it shows the family that waits for the paper in the hand (or the chest). The arithmetic is `utils/nehemiaNeu.ts`; stars: `osterStars(mistakes)`.
 */
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { osterStars } from '@/utils/osternGames'
import { pledgeBadge, pledgeGive, pledgeOwner } from '@/utils/nehemiaNeu'
import type { PledgeGame, PledgeKind, Pt } from '@/utils/nehemiaNeu'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: PledgeGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.rounds.reduce((a, r) => a + r.spots.length, 0))

const IDLE_SECONDS = 15
const ratio = computed(() => props.game.ratio ?? 1.5)
const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
/** the papers already pulled out of the chest (the next one is `draw[drawn]`) */
const drawn = ref(0)
/** the spots that have their paper again */
const given = ref<number[]>([])
/** the paper in the hand (null: none) and where it is while the finger drags it (percent; null: above the chest) */
const hand = ref<PledgeKind | null>(null)
const dragAt = ref<Pt | null>(null)
const wrongAt = ref(-1)
const helpAt = ref(-2)
const mistakes = ref(0)
const idle = ref(0)
const finished = ref(false)
const between = ref(false)
const message = ref('')
const field = ref<HTMLElement | null>(null)
const famEls = ref<HTMLElement[]>([])
const chestEl = ref<HTMLElement | null>(null)
let messageSeq = 0
let pressAt: Pt | null = null
let moved = false
const stars = computed(() => osterStars(mistakes.value))
/** the papers still in the chest */
const left = computed(() => current.value.draw.length - drawn.value - (hand.value ? 1 : 0))
function setFam(el: unknown, i: number) {
  if (el) famEls.value[i] = el as HTMLElement
}

function say(text: string, ms = 2800) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}

// the clock of "Help me"
function tickIdle() {
  if (!finished.value && !between.value) idle.value += 1
  later(tickIdle, 1000)
}
later(tickIdle, 1000)
const busy = () => {
  idle.value = 0
  helpAt.value = -2
}

const slipLabel = (k: PledgeKind) => props.game.slips[k]?.label ?? k

function take(): boolean {
  if (hand.value || finished.value || between.value) return !!hand.value
  const k = current.value.draw[drawn.value]
  if (!k) return false
  hand.value = k
  play('tap')
  say(t('app.adventure.pledgesTaken', { thing: slipLabel(k) }), 2600)
  return true
}

function give(spot: number) {
  if (finished.value || between.value) return
  busy()
  const kind = hand.value
  if (!kind) {
    say(t('app.adventure.pledgesFirst'), 2400)
    return
  }
  const res = pledgeGive(current.value, given.value, kind, spot)
  dragAt.value = null
  if (res === 'given') {
    say(t('app.adventure.pledgesAlready'), 2400)
    return
  }
  if (res === 'wrong') {
    mistakes.value++
    wrongAt.value = spot
    play('wrong')
    say(t('app.adventure.pledgesWrong', { thing: slipLabel(kind) }), 3000)
    later(() => {
      if (wrongAt.value === spot) wrongAt.value = -1
    }, 1400)
    return
  }
  given.value = [...given.value, spot]
  hand.value = null
  drawn.value++
  progress.mark()
  play('right')
  say(t('app.adventure.pledgesRight', { thing: slipLabel(kind) }), 2600)
  if (given.value.length >= current.value.spots.length) roundDone()
}

function roundDone() {
  between.value = true
  later(() => play('bead'), 200)
  say(t('app.adventure.pledgesRoundDone'), 0)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 2400)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 1500)
  later(() => {
    round.value++
    drawn.value = 0
    given.value = []
    hand.value = null
    dragAt.value = null
    between.value = false
    message.value = ''
  }, 2900)
}

// ---- the finger: press the chest and drag the paper to a family (or tap the chest, then a family)
function pointAt(e: PointerEvent): Pt | null {
  const r = field.value?.getBoundingClientRect()
  if (!r || !r.width || !r.height) return null
  return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }
}
function pressChest(e: PointerEvent) {
  if (e.button > 0 || finished.value || between.value) return
  e.preventDefault()
  busy()
  if (!take()) return
  pressAt = pointAt(e)
  moved = false
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', release)
  window.addEventListener('pointercancel', cancel)
}
function move(e: PointerEvent) {
  const p = pointAt(e)
  if (!p) return
  if (pressAt && Math.hypot(p.x - pressAt.x, (p.y - pressAt.y) / ratio.value) > 3) moved = true
  if (moved) dragAt.value = p
}
function stopListening() {
  window.removeEventListener('pointermove', move)
  window.removeEventListener('pointerup', release)
  window.removeEventListener('pointercancel', cancel)
}
function release(e: PointerEvent) {
  stopListening()
  if (!moved) return
  // over which family was the paper let go?
  const spot = famEls.value.findIndex((el) => {
    const r = el?.getBoundingClientRect()
    return !!r && r.width > 0 && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
  })
  if (spot >= 0) give(spot)
  else dragAt.value = null
}
function cancel() {
  stopListening()
  dragAt.value = null
}
onBeforeUnmount(stopListening)

function chestKey(e: KeyboardEvent) {
  if (e.key !== 'Enter' && e.key !== ' ') return
  e.preventDefault()
  busy()
  take()
}
/** the arrow keys go along the row: chest (-1) and the families */
function arrows(e: KeyboardEvent, at: number) {
  const n = current.value.spots.length
  let next: number | null = null
  if (e.key === 'ArrowRight') next = at + 1 >= n ? -1 : at + 1
  else if (e.key === 'ArrowLeft') next = at - 1 < -1 ? n - 1 : at - 1
  else if (e.key === 'ArrowDown') next = -1
  else if (e.key === 'ArrowUp' && at < 0) next = 0
  if (next === null) return
  e.preventDefault()
  const el = next < 0 ? chestEl.value : famEls.value[next]
  void nextTick(() => el?.focus())
}

const showHelp = computed(() => idle.value >= IDLE_SECONDS && !between.value && !finished.value && helpAt.value === -2)
function helpMe() {
  idle.value = 0
  if (!hand.value) {
    helpAt.value = -1
    say(t('app.adventure.pledgesHelpChest'), 3200)
    return
  }
  helpAt.value = pledgeOwner(current.value, given.value, hand.value)
  say(t('app.adventure.pledgesHelping', { thing: slipLabel(hand.value) }), 3200)
}

// ---- looks
const g = computed(() => props.game)
const famStyle = (i: number) => {
  const s = current.value.spots[i]!
  return { left: `${s.x}%`, top: `${s.y}%`, width: `${s.w}%`, zIndex: 10 }
}
const badgeStyle = (i: number) => {
  const s = current.value.spots[i]!
  const b = pledgeBadge(props.game, s)
  return { left: `${b.x}%`, top: `${b.y}%`, width: `${g.value.slipW}%`, zIndex: 12 }
}
const chestStyle = computed(() => ({ left: `${g.value.chest.x}%`, top: `${g.value.chest.y}%`, width: `${g.value.chest.w}%`, zIndex: 20 }))
const handStyle = computed(() => {
  const p = dragAt.value ?? { x: g.value.chest.x, y: g.value.chest.y - g.value.chest.w * ratio.value * 0.62 }
  return { left: `${p.x}%`, top: `${p.y}%`, width: `${g.value.slipW * 1.1}%`, zIndex: 40 }
})
const familyText = (i: number) => {
  const s = current.value.spots[i]!
  const name = g.value.families[s.family]?.label ?? ''
  return given.value.includes(i) ? t('app.adventure.pledgesFamilyHas', { family: name, thing: slipLabel(s.kind) }) : t('app.adventure.pledgesFamilyWaits', { family: name, thing: slipLabel(s.kind) })
}
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        ref="field"
        class="gm-field"
        :style="{ backgroundImage: `url(${prependBaseUrl(game.background)})`, aspectRatio: String(ratio) }"
        role="group"
        :aria-label="t('app.adventure.pledgesField')"
        @contextmenu.prevent
      )
        template(v-for="(s, i) in current.spots" :key="`f-${round}-${i}`")
          span(class="gm-badge" :class="{ back: given.includes(i) }" :style="badgeStyle(i)" aria-hidden="true")
            GameImage(:src="game.slips[s.kind].image" :ratio="1" colour="#e8d9b0" :label="game.slips[s.kind].label")
          button(
            :ref="(el) => setFam(el, i)"
            type="button"
            class="gm-fam"
            :class="{ help: helpAt === i, back: given.includes(i) }"
            :style="famStyle(i)"
            :aria-label="familyText(i)"
            @click="give(i)"
            @keydown="arrows($event, i)"
          )
            GameImage(:src="game.families[s.family]?.image ?? ''" :ratio="0.8" colour="#a08060" :label="game.families[s.family]?.label")
            span(v-if="given.includes(i)" class="gm-mark")
              GameMark(kind="good")
            span(v-if="wrongAt === i" class="gm-mark")
              GameMark(kind="bad")
        button(
          ref="chestEl"
          type="button"
          class="gm-chest"
          :class="{ help: helpAt === -1, empty: left <= 0 }"
          :style="chestStyle"
          :aria-label="t('app.adventure.pledgesChest', { n: left })"
          @pointerdown="pressChest"
          @keydown="chestKey($event); arrows($event, -1)"
        )
          GameImage(:src="game.chest.image" :ratio="1" colour="#7a5a32" :label="game.chest.label")
        div(v-if="hand" class="gm-slip" :class="{ drag: !!dragAt }" :style="handStyle" role="img" :aria-label="t('app.adventure.pledgesInHand', { thing: slipLabel(hand) })")
          GameImage(:src="game.slips[hand].image" :ratio="1" colour="#e8d9b0" :label="slipLabel(hand)")
      p(class="gm-count") {{ t('app.adventure.pledgesCount', { n: given.length, total: current.spots.length }) }}
      AdvButton(v-if="showHelp" tone="gold" @click="helpMe") {{ t('app.adventure.pledgesHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.pledgesDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
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

.gm-round
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

.gm-hint, .gm-count
  margin: 0
  text-align: center
  font-weight: 700
  font-size: 1rem
  color: #5a4a2c

.gm-field
  position: relative
  align-self: center
  width: min(100%, 92vh)
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #d8c08e
  background-size: cover
  background-position: center
  touch-action: none
  -webkit-touch-callout: none

.gm-fam, .gm-chest
  position: absolute
  display: block
  min-width: 44px
  min-height: 44px
  padding: 0
  border: 0
  border-radius: 14px
  background: transparent
  transform: translate(-50%, -100%)
  cursor: pointer
  touch-action: none
  filter: drop-shadow(0 3px 3px rgba(50, 35, 10, 0.35))

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 2px

  &.help
    outline: 4px dashed #fff2b8
    outline-offset: 3px
    animation: gm-pulse 900ms ease-in-out infinite

.gm-chest.empty
  opacity: 0.75

.gm-badge
  position: absolute
  display: block
  transform: translate(-50%, -50%)
  pointer-events: none
  padding: 3px
  border-radius: 12px
  border: 2px dashed rgba(255, 246, 220, 0.95)
  background: rgba(255, 246, 220, 0.45)
  filter: grayscale(0.85) opacity(0.75)
  transition: filter 300ms ease

  &.back
    border-style: solid
    border-color: #4f8a3c
    filter: none

.gm-slip
  position: absolute
  display: block
  transform: translate(-50%, -50%)
  pointer-events: none
  filter: drop-shadow(0 4px 5px rgba(50, 35, 10, 0.45))
  transition: left 180ms ease, top 180ms ease

  &.drag
    transition: none

.gm-mark
  position: absolute
  left: 50%
  top: 30%
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 3

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

@keyframes gm-pulse
  0%, 100%
    outline-color: #fff2b8
  50%
    outline-color: #d4a83e

@media (prefers-reduced-motion: reduce)
  .gm-fam.help, .gm-chest.help
    animation: none

  .gm-slip, .gm-badge
    transition: none
</style>
