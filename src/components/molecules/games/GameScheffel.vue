<script setup lang="ts">
/**
 * Where does the light belong? (Matthew 5,15-16: "Neither do men light a candle, and put it under a bushel, but on a candlestick; and it giveth light unto all that are in the house"). A room seen
 * from the side. Round 1: a small room, the lamp burns under an upturned basket on the table and it is almost dark. The child taps the basket (it slides away and the lamp shines, the table gets light),
 * then puts the lamp on the lampstand in the corner: now the whole room is light. Round 2: a bigger room with five people in different places, the basket is gone and the lamp burns on the table; the child
 * puts the lamp on the floor, on the table or on the lampstand (a tap on the place, or the lamp dragged there). The light is a soft circle whose size depends on the place: only the lampstand reaches
 * everybody. Whoever the light does not reach stays dark (a line says who). Right: a tick, a bright tone, "Everyone in the house has light." Wrong in round 2: a cross, a low tone, a line of words, a
 * mistake; the lamp may be put somewhere else. "Help me" after fifteen seconds makes the basket (then the lampstand) shine. Keyboard: the basket and the places are buttons. Less motion: the basket
 * and the light switch instead of gliding. Nothing is shown by colour alone. Stars: `bergStars(mistakes)`.
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
import { bergStars } from '@/utils/bergpredigtGames'
import { LIGHT_SPOT_PX, lightDark, lightHelp, lightHeight, lightReaches, lightSpotAt, lightSpotOf } from '@/utils/bergpredigtNeu'
import type { LightPerson, LightSpot, LightSpotId, LightStandGame } from '@/utils/bergpredigtNeu'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: LightStandGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the steps: round 1 the basket and the lamp on the lampstand, round 2 the lamp on the lampstand
progress.setGoal(props.game.rooms.reduce((n, r) => n + (r.basket ? 2 : 1), 0))

const IDLE_SECONDS = 15
const still = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const round = ref(0)
const room = computed(() => props.game.rooms[Math.min(round.value, props.game.rooms.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rooms.length - 1)
const ratio = computed(() => props.game.ratio ?? 1.5)
const basketGone = ref(!props.game.rooms[0]!.basket)
const lampAt = ref<LightSpotId>('tisch')
const lampLit = ref(!props.game.rooms[0]!.basket)
const between = ref(false)
const mistakes = ref(0)
const idle = ref(0)
const helping = ref(false)
const finished = ref(false)
const message = ref('')
const cross = ref<{ x: number; y: number } | null>(null)
const wrapEl = ref<HTMLElement | null>(null)
const fieldEl = ref<HTMLElement | null>(null)
const drag = reactive<{ on: boolean; x: number; y: number; moved: number }>({ on: false, x: 0, y: 0, moved: 0 })
const downAt = ref({ x: 0, y: 0 })
let messageSeq = 0

const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => bergStars(mistakes.value))
const spot = computed<LightSpot | undefined>(() => lightSpotOf(room.value, lampAt.value))
/** Who has light now: nobody while the lamp is covered, otherwise the people the lamp reaches. */
const lit = computed<string[]>(() => (lampLit.value && spot.value ? room.value.people.filter((p) => lightReaches(props.game, spot.value!, p)).map((p) => p.id) : []))
const help = computed(() => (helping.value && !between.value ? lightHelp(props.game, round.value, basketGone.value) : null))
const countText = computed(() => t('app.adventure.lampStandCount', { n: progress.parts.value, total: progress.goal.value }))
const spotLabel = (id: LightSpotId) => t(id === 'boden' ? 'app.adventure.lampStandSpotBoden' : id === 'tisch' ? 'app.adventure.lampStandSpotTisch' : 'app.adventure.lampStandSpotLeuchter')

function say(text: string, ms = 3400) {
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

function startRoom() {
  const r = room.value
  basketGone.value = !r.basket
  lampAt.value = 'tisch'
  lampLit.value = !r.basket
  between.value = false
  cross.value = null
  touched()
}

function takeBasket() {
  if (between.value || basketGone.value || finished.value) return
  touched()
  basketGone.value = true
  lampLit.value = true
  progress.mark()
  play('right')
  say(t('app.adventure.lampStandBasketOff'), 3000)
}

/** The lamp is put on a place (tap on the place or dragged there). */
function putLamp(id: LightSpotId) {
  if (between.value || !lampLit.value || finished.value) return
  touched()
  const same = lampAt.value === id
  lampAt.value = id
  const dark = lightDark(props.game, room.value, id)
  if (dark.length === 0) {
    progress.mark()
    play('right')
    between.value = true
    say(t(round.value === 0 ? 'app.adventure.lampStandAll1' : 'app.adventure.lampStandAll2'), 0)
    if (lastRound.value) {
      later(() => {
        play('star')
        finished.value = true
      }, 2400)
      return
    }
    later(() => {
      round.value++
      startRoom()
      say('', 1)
    }, 2600)
    return
  }
  const sp = lightSpotOf(room.value, id)
  say(t('app.adventure.lampStandDark', { who: dark[0]!.label }), 4200)
  if (same) return
  if (round.value === 0) {
    play('tap')
    return
  }
  mistakes.value++
  play('wrong')
  if (sp) cross.value = { x: sp.x, y: sp.y }
  later(() => (cross.value = null), 1000)
}

function helpMe() {
  touched()
  if (between.value) return
  helping.value = true
  say(t(basketGone.value ? 'app.adventure.lampStandHelpSpot' : 'app.adventure.lampStandHelpBasket'), 4200)
}

// ---- the lamp can also be dragged to a place
function toPercent(e: { clientX: number; clientY: number }): { x: number; y: number } | null {
  const r = fieldEl.value?.getBoundingClientRect()
  if (!r || r.width <= 0 || r.height <= 0) return null
  return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }
}
function down(e: PointerEvent) {
  if (between.value || !lampLit.value || finished.value) return
  touched()
  const p = toPercent(e)
  drag.on = true
  drag.x = p?.x ?? 50
  drag.y = p?.y ?? 50
  drag.moved = 0
  downAt.value = { x: e.clientX, y: e.clientY }
  ;(wrapEl.value as HTMLElement | null)?.setPointerCapture?.(e.pointerId)
}
function move(e: PointerEvent) {
  if (!drag.on) return
  const p = toPercent(e)
  if (p) {
    drag.x = p.x
    drag.y = p.y
  }
  drag.moved = Math.max(drag.moved, Math.hypot(e.clientX - downAt.value.x, e.clientY - downAt.value.y))
}
function up(e: PointerEvent) {
  if (!drag.on) return
  const moved = drag.moved
  drag.on = false
  if (moved < 8) return
  const p = toPercent(e)
  const id = p ? lightSpotAt(props.game, room.value, p) : null
  if (id) putLamp(id)
}

// ---- looks
const personStyle = (p: LightPerson) => {
  const h = lightHeight(props.game, p)
  return { left: `${p.x - p.w / 2}%`, top: `${p.y - h}%`, width: `${p.w}%`, zIndex: String(Math.round(p.y * 10)) }
}
/** The soft circle of light: the picture of the lit room is shown inside an ellipse (a circle in the picture) round the lamp. */
const maskStyle = computed(() => {
  const s = spot.value
  if (!s || !lampLit.value) return {}
  const m = `radial-gradient(ellipse ${s.radius}% ${s.radius * ratio.value}% at ${s.x}% ${s.y}%, #000 62%, rgba(0,0,0,0) 100%)`
  return { backgroundImage: `url(${src(room.value.bright)})`, maskImage: m, WebkitMaskImage: m } as Record<string, string>
})
const darkStyle = computed(() => ({ backgroundImage: `url(${src(room.value.dark ?? room.value.bright)})` }))
const lampStyle = computed(() => {
  const s = spot.value
  return s ? { left: `${s.x}%`, top: `${s.y}%`, width: `${props.game.lampW}%` } : {}
})
const markStyle = (s: LightSpot) => ({ left: `${s.x}%`, top: `${s.y}%`, minWidth: `${LIGHT_SPOT_PX}px`, minHeight: `${LIGHT_SPOT_PX}px` })
const standSpot = computed(() => lightSpotOf(room.value, 'leuchter'))
</script>

<template lang="pug">
  div(class="gm" :class="{ still }")
    template(v-if="!finished")
      p(v-if="game.rooms.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rooms.length }) }}
      p(class="gm-hint") {{ room.hint }}
      div(ref="wrapEl" class="gm-wrap" @pointermove="move" @pointerup="up" @pointercancel="up" @contextmenu.prevent)
        div(
          ref="fieldEl"
          class="gm-field"
          :style="{ aspectRatio: String(ratio) }"
          role="group"
          :aria-label="t('app.adventure.lampStandField')"
        )
          //- the room in the dark; the lit room shows through a soft circle round the lamp
          div(class="gm-dark" :class="{ dimmed: !room.dark }" :style="darkStyle" aria-hidden="true")
          div(v-if="lampLit" :key="`${round}-${lampAt}`" class="gm-lit" :style="maskStyle" aria-hidden="true")
          span(v-if="standSpot" class="gm-stand" :style="{ left: `${standSpot.x}%`, top: `${standSpot.y}%`, width: `${game.stand.w}%` }" aria-hidden="true")
            GameImage(:src="game.stand.image" :ratio="0.385" colour="#8a6a3a" label="leuchter")
          span(
            v-for="p in room.people"
            :key="p.id"
            class="gm-person"
            :class="{ lit: lit.includes(p.id) }"
            :data-person="p.id"
            :data-lit="lit.includes(p.id) ? 'yes' : 'no'"
            :style="personStyle(p)"
            role="img"
            :aria-label="p.label"
          )
            GameImage(:src="p.image" :ratio="game.peopleRatio" colour="#b79a6a" :label="p.id")
          //- the lamp: covered by the basket in round 1 until the basket is taken away
          span(
            v-if="basketGone || !room.basket"
            class="gm-lamp"
            :class="{ on: lampLit }"
            :data-lamp="lampAt"
            :style="lampStyle"
            role="img"
            :aria-label="t('app.adventure.lampStandLamp')"
            @pointerdown.prevent="down"
          )
            GameImage(:src="lampLit ? game.lampOn : game.lampOff" :ratio="1.143" colour="#d9b86a" label="lampe")
          button(
            v-if="room.basket && !basketGone"
            type="button"
            class="gm-basket"
            :class="{ shine: help === 'basket' }"
            :style="{ left: `${room.basket.x}%`, top: `${room.basket.y}%`, width: `${room.basket.w}%` }"
            :aria-label="t('app.adventure.lampStandBasket')"
            @click="takeBasket"
          )
            GameImage(:src="game.basket" :ratio="1.385" colour="#a98a58" label="korb")
          template(v-if="lampLit")
            button(
              v-for="s in room.spots"
              :key="s.id"
              type="button"
              class="gm-spot"
              :class="{ here: lampAt === s.id, shine: help === s.id }"
              :data-spot="s.id"
              :style="markStyle(s)"
              :aria-label="spotLabel(s.id)"
              :aria-pressed="lampAt === s.id"
              @click="putLamp(s.id)"
            )
          span(v-if="cross" class="gm-cross" :style="{ left: `${cross.x}%`, top: `${cross.y}%` }" aria-hidden="true")
            GameMark(kind="bad")
          span(v-if="lampLit && between" class="gm-tick" aria-hidden="true")
            GameMark(kind="good")
        img(v-if="drag.on && drag.moved >= 8" class="gm-ghost" :src="src(game.lampOn)" alt="" :style="{ left: `${drag.x}%`, top: `${drag.y}%` }")
      p(class="gm-count" aria-live="polite") {{ countText }}
      div(class="gm-actions")
        AdvButton(v-if="idle >= IDLE_SECONDS && !between" tone="gold" @click="helpMe") {{ t('app.adventure.lampStandHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.lampStandDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e6d6b2
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
  display: flex
  flex-direction: column
  gap: 8px
  touch-action: none

.gm-field
  position: relative
  width: 100%
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #1d1b2c

.gm-dark, .gm-lit
  position: absolute
  inset: 0
  background-size: cover
  background-position: center
  pointer-events: none

// without a painted dark room the lit one is darkened by the code
.gm-dark.dimmed
  filter: brightness(0.3) saturate(0.7)

.gm-lit
  animation: gm-fade 500ms ease

.gm-stand, .gm-person, .gm-lamp, .gm-basket
  position: absolute
  display: block

.gm-stand
  // the picture hangs from the place with its bowl a little below the top edge: the lamp stands in the bowl, not above it
  transform: translate(-50%, -8%)
  pointer-events: none

.gm-person
  pointer-events: none
  filter: brightness(0.42) saturate(0.7)
  transition: filter 500ms ease

  &.lit
    filter: none

.gm-lamp
  transform: translate(-50%, -100%)
  cursor: grab
  touch-action: none
  z-index: 800

  // the lamp is small on a phone: its finger area reaches beyond the picture
  &::after
    content: ''
    position: absolute
    inset: -12px

.gm-basket
  transform: translate(-50%, -100%)
  box-sizing: border-box
  min-width: 56px
  min-height: 48px
  padding: 0
  border: 3px solid transparent
  border-radius: 14px
  background: transparent
  cursor: pointer
  z-index: 801

  &:focus-visible
    outline: 3px solid #2f6b8a
    outline-offset: 2px

  &.shine
    animation: gm-pulse 1300ms ease-in-out infinite
    border-color: #f2c46a
    background: rgba(255, 236, 170, 0.3)

.gm-spot
  position: absolute
  display: block
  box-sizing: border-box
  padding: 0
  transform: translate(-50%, -50%)
  border: 3px dashed rgba(255, 233, 150, 0.95)
  border-radius: 50%
  background: rgba(255, 233, 150, 0.14)
  box-shadow: 0 0 10px rgba(255, 220, 110, 0.7)
  cursor: pointer
  z-index: 900

  &.here
    border-style: solid
    background: rgba(255, 233, 150, 0.32)
    // the lamp stands here: a finger meets the lamp (to drag it away), not the ring over it
    pointer-events: none

  &.shine
    animation: gm-pulse 1300ms ease-in-out infinite
    border-color: #fff
    background: rgba(255, 236, 170, 0.6)

  &:focus-visible
    outline: 3px solid #2f6b8a
    outline-offset: 2px

.gm-cross
  position: absolute
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 950

.gm-tick
  position: absolute
  top: 8px
  right: 8px
  pointer-events: none
  z-index: 950

.gm-ghost
  position: absolute
  display: block
  width: 9%
  height: auto
  transform: translate(-50%, -100%)
  pointer-events: none
  z-index: 9999

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
    opacity: 0.75
  50%
    opacity: 1

@keyframes gm-fade
  from
    opacity: 0
  to
    opacity: 1

@media (prefers-reduced-motion: reduce)
  .gm-lit
    animation: none

  .gm-person
    transition: none

  .gm-spot.shine, .gm-basket.shine
    animation: none
</style>
