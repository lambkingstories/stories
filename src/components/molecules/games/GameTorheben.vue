<script setup lang="ts">
/**
 * Lift out the gate (Judges 16,3): the city gate of Gaza at night, Samson beside the empty gateway. The parts of the gate lie in the gateway: the bar across both doors, the doors, the posts
 * (round 2). A part can be lifted only when nothing holds it any more: first the bar, then a door, then its post. A tap on a free part (or dragging it to Samson) lifts it out: it goes onto
 * Samson's shoulders and the load grows. A tap on a part that still holds: it wiggles and stays, a cross, a low tone, "Das hält noch.", a mistake. At the end of round 2 Samson carries the whole
 * load a little to the right, out of the picture (the moon stays), then the verse. Nobody else is in the picture: no guards, no weapons.
 * "Help me" after fifteen seconds makes the next free part shine. Keyboard: Tab to a part, Enter lifts it. Less motion: nothing wiggles, Samson does not walk. Nothing is shown by colour alone.
 * Stars: `simsonStars(mistakes)`.
 */
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { simsonStars } from '@/utils/simsonGames'
import { gateBox, gateHelp, gatePart, gateStrongBox, gateStrongH, gateTry, inBox } from '@/utils/simsonNeu'
import type { GateLiftGame, GatePart } from '@/utils/simsonNeu'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: GateLiftGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
const total = props.game.rounds.reduce((n, r) => n + r.parts.length, 0)
progress.setGoal(total)

const IDLE_SECONDS = 15
const still = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const round = ref(0)
const phase = ref<'play' | 'between' | 'away'>('play')
/** The parts of this round on Samson's shoulders, in the order they were lifted. */
const lifted = ref<string[]>([])
const mistakes = ref(0)
const idle = ref(0)
const helping = ref(false)
const finished = ref(false)
const message = ref('')
const wiggle = ref<string | null>(null)
const picked = ref<{ id: string; kind: 'good' | 'bad' } | null>(null)
const wrapEl = ref<HTMLElement | null>(null)
const fieldEl = ref<HTMLElement | null>(null)
const drag = reactive<{ part: string; moved: number }>({ part: '', moved: 0 })
const downAt = ref({ x: 0, y: 0 })
let messageSeq = 0
let pickSeq = 0

const src = (p: string) => prependBaseUrl(p)
const ratio = computed(() => props.game.ratio ?? 1.5)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const stars = computed(() => simsonStars(mistakes.value))
const countText = computed(() => t('app.adventure.gateHeaveCount', { n: progress.parts.value, total }))
/** The parts that are still in the gate. */
const standing = computed(() => current.value.parts.filter((p) => !lifted.value.includes(p.id)))
/** The parts on the shoulders. */
const load = computed(() => lifted.value.map((id) => gatePart(current.value, id)).filter((p): p is GatePart => !!p))
const help = computed(() => (helping.value && phase.value === 'play' ? gateHelp(current.value, lifted.value) : null))

function say(text: string, ms = 3200) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}
function mark(id: string, kind: 'good' | 'bad') {
  const n = ++pickSeq
  picked.value = { id, kind }
  later(() => {
    if (pickSeq === n) picked.value = null
  }, 1100)
}
function touched() {
  idle.value = 0
  helping.value = false
}
function tickIdle() {
  if (finished.value) return
  later(tickIdle, 1000)
  if (phase.value === 'play') idle.value++
}
later(tickIdle, 1000)

// ---- a tap (click, also the keyboard) lifts a part; dragging a part to Samson does the same
function partClick(id: string) {
  if (phase.value !== 'play' || finished.value) return
  touched()
  lift(id)
}
function toPercent(e: { clientX: number; clientY: number }): { x: number; y: number } | null {
  const r = fieldEl.value?.getBoundingClientRect()
  if (!r || r.width <= 0 || r.height <= 0) return null
  return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }
}
function down(e: PointerEvent, id: string) {
  if (phase.value !== 'play' || finished.value) return
  drag.part = id
  drag.moved = 0
  downAt.value = { x: e.clientX, y: e.clientY }
}
function move(e: PointerEvent) {
  if (!drag.part) return
  drag.moved = Math.max(drag.moved, Math.hypot(e.clientX - downAt.value.x, e.clientY - downAt.value.y))
}
function up(e: PointerEvent) {
  if (!drag.part) return
  const id = drag.part
  const moved = drag.moved
  drag.part = ''
  if (moved < 8) return // a tap: the click lifts it
  const p = toPercent(e)
  if (p && inBox(gateStrongBox(props.game), p, 4)) {
    touched()
    lift(id)
  }
}

function lift(id: string) {
  const r = gateTry(current.value, lifted.value, id)
  if (r === 'gone') return
  if (r === 'held') {
    mistakes.value++
    play('wrong')
    mark(id, 'bad')
    wiggle.value = id
    later(() => (wiggle.value = null), 600)
    say(t('app.adventure.gateHeaveHeld'), 3200)
    return
  }
  lifted.value = [...lifted.value, id]
  progress.mark()
  play('right')
  say(t('app.adventure.gateHeaveOk'), 2400)
  if (lifted.value.length >= current.value.parts.length) endRound()
}

function endRound() {
  phase.value = 'between'
  later(() => say(t('app.adventure.gateHeaveRoundDone'), 0), 900)
  later(() => {
    if (round.value >= props.game.rounds.length - 1) {
      // the end: Samson carries the whole load out of the picture (the moon stays), then the verse
      phase.value = 'away'
      say('', 1)
      play('star')
      later(() => (finished.value = true), still ? 600 : 2400)
      return
    }
    round.value++
    lifted.value = []
    phase.value = 'play'
    say('', 1)
  }, 2800)
}

function helpMe() {
  touched()
  if (phase.value !== 'play') return
  helping.value = true
  say(t('app.adventure.gateHeaveHelpGo'), 4200)
}

// ---- looks
/** A part that holds others lies above them. */
const zOf = (p: GatePart) => 10 + current.value.parts.filter((q) => q.holds.includes(p.id)).length
const partStyle = (p: GatePart) => {
  const b = gateBox(props.game, p)
  return { left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%`, zIndex: String(zOf(p)) }
}
const strongStyle = computed(() => {
  const s = props.game.strong
  const h = gateStrongH(props.game)
  return { left: `${s.x - s.w / 2}%`, top: `${s.y - h}%`, width: `${s.w}%` }
})
/** The place of the k-th carried part on the shoulders: a flat slot (the width of the load, one step high); every next part lies one step higher. */
const loadStyle = (k: number) => {
  const s = props.game.shoulder
  return { left: `${s.x - s.w / 2}%`, top: `${s.y - (k + 1) * s.step}%`, width: `${s.w}%`, height: `${s.step}%`, zIndex: String(60 + k) }
}
/** A standing part (a door, a post) lies flat on the shoulders: turned a quarter, as long as the slot is wide (its width is `ratio` times the width of the slot). */
const carriedStyle = (p: GatePart) => (p.ratio < 1 ? { width: `${p.ratio * 100}%` } : { width: '100%' })
</script>

<template lang="pug">
  div(class="gm" :class="{ still }")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(ref="wrapEl" class="gm-wrap" @pointermove="move" @pointerup="up" @pointercancel="up" @contextmenu.prevent)
        div(
          ref="fieldEl"
          class="gm-field"
          :style="{ backgroundImage: `url(${src(game.background)})`, aspectRatio: String(ratio) }"
          role="group"
          :aria-label="t('app.adventure.gateHeaveField')"
        )
          button(
            v-for="p in standing"
            :key="`${round}-${p.id}`"
            type="button"
            class="gm-part"
            :class="{ wiggle: wiggle === p.id, shine: help === p.id }"
            :data-part="p.id"
            :style="partStyle(p)"
            :aria-label="p.label"
            @pointerdown="down($event, p.id)"
            @click="partClick(p.id)"
          )
            GameImage(:src="p.image" :ratio="p.ratio" colour="#6a4a2a" :label="p.id")
            span(v-if="picked && picked.id === p.id" class="gm-mark")
              GameMark(:kind="picked.kind")
          div(class="gm-strong" :class="{ away: phase === 'away' }" :style="strongStyle" role="img" :aria-label="t('app.adventure.gateHeaveStrong')")
            GameImage(:src="game.strong.image" :ratio="game.strong.ratio" colour="#8a7050" :label="'simson'")
          div(class="gm-load" :class="{ away: phase === 'away' }" role="list" :aria-label="t('app.adventure.gateHeaveLoad')")
            span(
              v-for="(p, k) in load"
              :key="`${round}-load-${p.id}`"
              class="gm-carried"
              :class="{ lying: p.ratio < 1 }"
              :data-carried="p.id"
              :style="loadStyle(k)"
              role="listitem"
              :aria-label="p.label"
            )
              span(class="gm-carried-in" :style="carriedStyle(p)")
                GameImage(:src="p.image" :ratio="p.ratio" colour="#6a4a2a" :label="p.id")
      p(class="gm-count" aria-live="polite") {{ countText }}
      div(class="gm-actions")
        AdvButton(v-if="idle >= IDLE_SECONDS && phase === 'play'" tone="gold" @click="helpMe") {{ t('app.adventure.gateHeaveHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.gateHeaveDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e8dcb8
  box-shadow: inset 0 0 18px rgba(90, 60, 20, 0.25)
  user-select: none
  -webkit-user-select: none
  touch-action: none

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

.gm-wrap
  position: relative
  touch-action: none

.gm-field
  position: relative
  width: 100%
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #23304a
  background-size: cover
  background-position: center

.gm-part
  position: absolute
  display: flex
  align-items: center
  justify-content: center
  box-sizing: border-box
  padding: 0
  border: 3px solid transparent
  border-radius: 8px
  background: transparent
  transform: translate(-50%, -50%)
  cursor: pointer

  // the picture keeps its painted size (the posts and the bar are narrow); the finger target is at least 44 x 44 px (seen in the browser 23.11.2026: min-width blew up the posts)
  &::before
    content: ''
    position: absolute
    left: 50%
    top: 50%
    width: max(100%, 44px)
    height: max(100%, 44px)
    transform: translate(-50%, -50%)

  &:focus-visible
    outline: 3px solid #f2c46a
    outline-offset: 2px

  &.shine
    animation: gm-pulse 1300ms ease-in-out infinite
    border-color: #f2c46a
    background: rgba(255, 236, 170, 0.25)

  &.wiggle
    animation: gm-wiggle 500ms ease

.gm-mark
  position: absolute
  top: -6px
  right: -6px
  pointer-events: none

.gm-strong
  position: absolute
  display: block
  pointer-events: none
  transition: transform 2000ms ease-in, opacity 2000ms ease-in
  z-index: 50

  &.away
    transform: translateX(160%)
    opacity: 0

.gm-load
  position: absolute
  inset: 0
  pointer-events: none
  transition: transform 2000ms ease-in, opacity 2000ms ease-in
  z-index: 55

  &.away
    transform: translateX(60%)
    opacity: 0

.gm-carried
  position: absolute
  display: block

.gm-carried-in
  position: absolute
  display: block
  left: 50%
  top: 50%
  transform: translate(-50%, -50%)

.gm-carried.lying .gm-carried-in
  transform: translate(-50%, -50%) rotate(90deg)

.gm-actions
  display: flex
  justify-content: center
  gap: 10px
  flex-wrap: wrap
  margin-top: 8px

  &:empty
    display: none

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

.still
  .gm-strong, .gm-load
    transition: none

  .gm-part.shine, .gm-part.wiggle
    animation: none

@keyframes gm-pulse
  0%, 100%
    opacity: 0.75
  50%
    opacity: 1

@keyframes gm-wiggle
  0%, 100%
    transform: translate(-50%, -50%) rotate(0)
  25%
    transform: translate(-50%, -50%) rotate(-3deg)
  75%
    transform: translate(-50%, -50%) rotate(3deg)

@media (prefers-reduced-motion: reduce)
  .gm-strong, .gm-load
    transition: none

  .gm-part.shine, .gm-part.wiggle
    animation: none
</style>
