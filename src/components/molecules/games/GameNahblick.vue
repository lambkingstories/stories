<script setup lang="ts">
/**
 * Look closely (Matthew 6,28: "Consider the lilies of the field, how they grow"): a meadow of flowers in golden light and a wreath of olive twigs, the child's window. Inside the wreath a blossom shows
 * itself close up (a painted close-up picture of every blossom, a soft change); on some blossoms a small guest sits (a bee, a ladybird, a butterfly, a cricket) that cannot be seen without the wreath.
 * The child moves the wreath (a finger or the mouse button held down; a tap beside the wreath puts it there; the arrow keys) and taps the guests inside it. A guest that is found rises a little and
 * joins the row below the picture. A tap on a blossom without a guest says "Nobody sits here." and is a mistake (once for each blossom); beside the guest on a blossom that has one it is no mistake.
 * Round 1: three blossoms on the left can be seen (the others lie under a soft haze) and two guests sit on them. Round 2: all seven blossoms, four guests, three blossoms without one. There is no
 * time and no punishment for looking. "Help me" after fifteen seconds without a find makes a soft ring shine round the nearest blossom with a guest. Keyboard: the field takes the focus, the arrow
 * keys move the wreath, Enter taps in its middle. Less motion: the change and the rising switch. Nothing is shown by colour alone. Stars: `bergStars(mistakes)`.
 */
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { bergStars } from '@/utils/bergpredigtGames'
import { NEAR_INNER, NEAR_KEY_STEP, bergClamp, nearActive, nearBloom, nearGuestKind, nearHelp, nearSitOn, nearTap, nearVisible } from '@/utils/bergpredigtNeu'
import type { NearBloom, NearViewGame, Pt } from '@/utils/bergpredigtNeu'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: NearViewGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.rounds.reduce((n, r) => n + r.sits.length, 0))

const IDLE_SECONDS = 15
const still = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const ratio = computed(() => props.game.ratio ?? 1.5)
const wreath = ref<Pt>({ x: 50, y: 50 })
/** The blossoms whose guest has been found in this round. */
const found = ref<string[]>([])
/** The blossoms without a guest that were tapped (one mistake each). */
const emptyTapped = ref<string[]>([])
const mistakes = ref(0)
const idle = ref(0)
const helping = ref(false)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const cross = ref<Pt | null>(null)
const hop = ref<string | null>(null)
const fieldEl = ref<HTMLElement | null>(null)
let messageSeq = 0
const grab = { down: false, inside: false, moved: 0, startX: 0, startY: 0, offX: 0, offY: 0 }

const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => bergStars(mistakes.value))
const active = computed<NearBloom | null>(() => (between.value ? null : nearActive(props.game, current.value, wreath.value)))
const sit = computed(() => (active.value ? nearSitOn(current.value, active.value.id) : undefined))
const guestHere = computed(() => (sit.value ? nearGuestKind(props.game, sit.value.guestId) : undefined))
const helpBloom = computed(() => (helping.value && !between.value ? nearHelp(props.game, current.value, found.value, wreath.value) : null))
const foundGuests = computed(() =>
  found.value.map((id) => {
    const s = nearSitOn(current.value, id)
    return s ? nearGuestKind(props.game, s.guestId) : undefined
  })
)
const countText = computed(() => t('app.adventure.wreathLookCount', { n: found.value.length, total: current.value.sits.length }))
const nearText = computed(() => (active.value ? t('app.adventure.wreathLookNear') : ''))
/** Where the haze starts (percent of the width): between the last blossom that can be seen and the first one under the haze. */
const hazeFrom = computed(() => {
  const hid = current.value.hidden.map((id) => nearBloom(props.game, id)?.x ?? 100)
  if (!hid.length) return 100
  const vis = nearVisible(current.value).map((id) => nearBloom(props.game, id)?.x ?? 0)
  return Math.max(0, (Math.max(0, ...vis) + Math.min(...hid)) / 2 - 2)
})

function say(text: string, ms = 3200) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}
function touched() {
  idle.value = 0
  helping.value = false
}
function tickIdle() {
  if (finished.value) return
  later(tickIdle, 1000)
  if (!between.value) idle.value++
}
later(tickIdle, 1000)

function clampWreath(p: Pt): Pt {
  const hw = props.game.wreath.w / 2
  const hh = (props.game.wreath.w * ratio.value) / 2
  return { x: bergClamp(p.x, hw * 0.4, 100 - hw * 0.4), y: bergClamp(p.y, hh * 0.4, 100 - hh * 0.4) }
}
function toPercent(e: { clientX: number; clientY: number }): Pt | null {
  const r = fieldEl.value?.getBoundingClientRect()
  if (!r || r.width <= 0 || r.height <= 0) return null
  return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }
}

// ---- the pointer
function down(e: PointerEvent) {
  if (between.value || finished.value) return
  const p = toPercent(e)
  if (!p) return
  touched()
  const inside = Math.hypot(p.x - wreath.value.x, (p.y - wreath.value.y) / ratio.value) <= props.game.wreath.w / 2
  grab.down = true
  grab.inside = inside
  grab.moved = 0
  grab.startX = e.clientX
  grab.startY = e.clientY
  grab.offX = inside ? wreath.value.x - p.x : 0
  grab.offY = inside ? wreath.value.y - p.y : 0
  // a press beside the wreath puts it there; a press inside it is a tap (or the start of a drag)
  if (!inside) wreath.value = clampWreath(p)
  ;(fieldEl.value as HTMLElement | null)?.setPointerCapture?.(e.pointerId)
}
function move(e: PointerEvent) {
  if (!grab.down) return
  grab.moved = Math.max(grab.moved, Math.hypot(e.clientX - grab.startX, e.clientY - grab.startY))
  if (grab.inside && grab.moved < 8) return
  const p = toPercent(e)
  if (p) wreath.value = clampWreath({ x: p.x + grab.offX, y: p.y + grab.offY })
}
function up(e: PointerEvent) {
  if (!grab.down) return
  grab.down = false
  if (grab.inside && grab.moved < 8) {
    const p = toPercent(e)
    if (p) tapAt(p)
  }
}

// ---- the keyboard
function onKey(e: KeyboardEvent) {
  if (between.value || finished.value) return
  const step = NEAR_KEY_STEP
  const d: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step * ratio.value], ArrowDown: [0, step * ratio.value] }
  const m = d[e.key]
  if (m) {
    e.preventDefault()
    touched()
    wreath.value = clampWreath({ x: wreath.value.x + m[0], y: wreath.value.y + m[1] })
    return
  }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    touched()
    tapAt({ ...wreath.value })
  }
}

// ---- a tap inside the wreath
function tapAt(p: Pt) {
  if (between.value || finished.value) return
  const what = nearTap(props.game, current.value, wreath.value, p)
  const b = active.value
  if (!b || (what !== 'guest' && what !== 'bloom')) return
  const s = nearSitOn(current.value, b.id)
  if (what === 'guest' && s) {
    if (found.value.includes(b.id)) {
      say(t('app.adventure.wreathLookAlready'), 2600)
      return
    }
    found.value = [...found.value, b.id]
    progress.mark()
    play('found')
    hop.value = b.id
    later(() => (hop.value = null), 900)
    say(t('app.adventure.wreathLookFound', { who: nearGuestKind(props.game, s.guestId)?.label ?? '' }), 3000)
    if (found.value.length >= current.value.sits.length) endRound()
    return
  }
  if (s) {
    // beside the guest: no mistake
    say(t('app.adventure.wreathLookAlmost'), 2600)
    return
  }
  // a blossom without a guest
  say(t('app.adventure.wreathLookNobody'), 2800)
  cross.value = { ...p }
  later(() => (cross.value = null), 900)
  if (!emptyTapped.value.includes(b.id)) {
    emptyTapped.value = [...emptyTapped.value, b.id]
    mistakes.value++
    play('wrong')
  } else play('tap')
}

function endRound() {
  between.value = true
  later(() => say(t('app.adventure.wreathLookRoundDone'), 0), 1200)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 3200)
    return
  }
  later(() => {
    round.value++
    found.value = []
    emptyTapped.value = []
    wreath.value = { x: 50, y: 50 }
    between.value = false
    touched()
    say('', 1)
  }, 3400)
}

function helpMe() {
  touched()
  if (between.value) return
  helping.value = true
  say(t('app.adventure.wreathLookHelpGo'), 4200)
}

watch(round, () => (helping.value = false))

// ---- looks
const wreathStyle = computed(() => ({ left: `${wreath.value.x}%`, top: `${wreath.value.y}%`, width: `${props.game.wreath.w}%` }))
const innerInset = `${((1 - NEAR_INNER) / 2) * 100}%`
const hazeMask = computed(() => {
  const m = `linear-gradient(to right, rgba(0,0,0,0) ${hazeFrom.value}%, #000 ${Math.min(100, hazeFrom.value + 14)}%)`
  return { maskImage: m, WebkitMaskImage: m } as Record<string, string>
})
const ringStyle = (b: NearBloom) => ({ left: `${b.x}%`, top: `${b.y}%`, width: `${Math.max(b.w * 2, 14)}%` })
const visibleBlooms = computed(() => nearVisible(current.value))
</script>

<template lang="pug">
  div(class="gm" :class="{ still }")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        ref="fieldEl"
        class="gm-field"
        :style="{ backgroundImage: `url(${src(game.background)})`, aspectRatio: String(ratio) }"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.wreathLookField')"
        :aria-description="t('app.adventure.wreathLookKeys')"
        @pointerdown.prevent="down"
        @pointermove="move"
        @pointerup="up"
        @pointercancel="up"
        @keydown="onKey"
        @contextmenu.prevent
      )
        div(v-if="current.hidden.length" class="gm-haze" :style="hazeMask" aria-hidden="true")
          GameImage(:src="game.haze" :ratio="1.5" colour="rgba(255,255,255,0.45)" label="dunst")
        span(v-if="helpBloom" class="gm-helpring" :data-help="helpBloom.id" :style="ringStyle(helpBloom)" aria-hidden="true")
        span(class="gm-wreath" :data-wreath="`${Math.round(wreath.x)},${Math.round(wreath.y)}`" :style="wreathStyle" role="img" :aria-label="t('app.adventure.wreathLookWreath')")
          span(class="gm-inner" :style="{ inset: innerInset }")
            span(v-if="active" :key="active.id" class="gm-near" :data-near="active.id")
              GameImage(:src="active.nearImage" :ratio="1" colour="#8fae5c" :label="`nah-${active.id}`")
              span(
                v-if="sit && guestHere"
                class="gm-guest"
                :class="{ hop: hop === active.id, got: found.includes(active.id) }"
                :data-guest="sit.guestId"
                :style="{ left: `${active.spot.nx}%`, top: `${active.spot.ny}%`, width: `${active.spot.nw}%` }"
              )
                GameImage(:src="guestHere.image" :ratio="1" colour="#d9b86a" :label="guestHere.id")
              span(v-if="sit && found.includes(active.id)" class="gm-tickmark" aria-hidden="true")
                GameMark(kind="good")
          span(class="gm-ring")
            GameImage(:src="game.wreath.image" :ratio="1" colour="rgba(80,110,50,0.55)" round label="kranz")
        span(v-if="cross" class="gm-cross" :style="{ left: `${cross.x}%`, top: `${cross.y}%` }" aria-hidden="true")
          GameMark(kind="bad")
      p(class="gm-sr" aria-live="polite") {{ nearText }}
      ul(class="gm-found" :aria-label="t('app.adventure.wreathLookRow')")
        li(v-for="(g, i) in foundGuests" :key="`f${i}`" class="gm-foundone")
          GameImage(v-if="g" :src="g.image" :ratio="1" colour="#d9b86a" :label="g.id")
          span(v-if="g" class="gm-foundname") {{ g.label }}
      p(class="gm-count" aria-live="polite") {{ countText }}
      div(class="gm-actions")
        AdvButton(v-if="idle >= IDLE_SECONDS && !between" tone="gold" @click="helpMe") {{ t('app.adventure.wreathLookHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.wreathLookDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #ecdfb8
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
  background-color: #9bb866
  background-size: cover
  background-position: center
  touch-action: none
  cursor: crosshair

  &:focus-visible
    outline: 3px solid #2f6b8a
    outline-offset: 2px

.gm-haze
  position: absolute
  inset: 0
  pointer-events: none
  z-index: 5

.gm-haze :deep(.gi), .gm-haze :deep(img)
  height: 100%
  object-fit: cover

.gm-helpring
  position: absolute
  display: block
  aspect-ratio: 1 / 1
  transform: translate(-50%, -50%)
  border: 3px solid #fff
  border-radius: 50%
  box-shadow: 0 0 12px rgba(255, 240, 160, 0.95)
  pointer-events: none
  z-index: 6
  animation: gm-pulse 1300ms ease-in-out infinite

.gm-wreath
  position: absolute
  display: block
  aspect-ratio: 1 / 1
  transform: translate(-50%, -50%)
  pointer-events: none
  z-index: 10

.gm-inner
  position: absolute
  overflow: hidden
  border-radius: 50%

.gm-near
  position: absolute
  inset: 0
  display: block
  animation: gm-fade 260ms ease

  :deep(.gi)
    height: 100%

  :deep(img)
    height: 100%
    object-fit: cover

.gm-guest
  position: absolute
  display: block
  transform: translate(-50%, -50%)

  &.hop
    animation: gm-hop 800ms ease

.gm-tickmark
  position: absolute
  bottom: 10%
  left: 50%
  margin-left: -15px

.gm-ring
  position: absolute
  inset: 0
  display: block

.gm-cross
  position: absolute
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 20

.gm-sr
  position: absolute
  width: 1px
  height: 1px
  margin: -1px
  overflow: hidden
  clip: rect(0, 0, 0, 0)

.gm-found
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 8px
  margin: 0
  padding: 0
  list-style: none
  min-height: 8px

.gm-foundone
  display: flex
  flex-direction: column
  align-items: center
  box-sizing: border-box
  min-width: 64px
  max-width: 150px
  padding: 4px 8px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.94)
  border: 2px solid #d4a83e

  :deep(.gi)
    width: 52px

.gm-foundname
  font-size: 1rem
  overflow-wrap: anywhere
  font-weight: 800
  line-height: 1.1
  text-align: center
  color: #3f321b

.gm-actions
  display: flex
  justify-content: center
  gap: 10px
  flex-wrap: wrap

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

@keyframes gm-pulse
  0%, 100%
    opacity: 0.6
  50%
    opacity: 1

@keyframes gm-fade
  from
    opacity: 0
  to
    opacity: 1

@keyframes gm-hop
  0%, 100%
    transform: translate(-50%, -50%)
  40%
    transform: translate(-50%, -90%) scale(1.15)

@media (prefers-reduced-motion: reduce)
  .gm-near
    animation: none

  .gm-guest.hop
    animation: none

  .gm-helpring
    animation: none
</style>
