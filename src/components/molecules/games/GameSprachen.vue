<script setup lang="ts">
/**
 * Everyone hears it (Acts 2,5-11). A painted map of the lands around the sea and in the east, every land with a big painted landmark (no writing). In a strip below wait guests from
 * those lands. The child drags a guest onto his land (or taps him, then the land; on the keyboard left/right choose a guest, up/down a land, Enter). Right: the guest stands on his land
 * with a little ear (he hears it in his own language), a tick and a bright tone. Wrong: a cross and "That is not his home", the guest goes back, a mistake. Letting go beside the lands
 * is no mistake. Round 1: four guests with a little home picture over them; round 2: all seven without it ("Help me" after fifteen seconds shows it for one guest and marks his land).
 * Nothing is shown by colour alone (tick, cross, words). Stars: `osterStars(mistakes)`.
 */
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { osterStars } from '@/utils/osternGames'
import { tonguesFits, tonguesLandAt } from '@/utils/pfingstenNeuA'
import type { Pt, TonguesGame, TonguesGuest } from '@/utils/pfingstenNeuA'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: TonguesGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.rounds.reduce((s, r) => s + r.guests.length, 0))

const IDLE_SECONDS = 15
const TAP_PX = 8

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const ratio = computed(() => props.game.ratio ?? 1.5)
const guests = computed<TonguesGuest[]>(() => current.value.guests.map((id) => props.game.guests.find((g) => g.id === id)!).filter(Boolean))
/** The guests (ids) that stand on their land. */
const home = ref<string[]>([])
const selected = ref(-1)
const cursor = ref(-1)
const helpGuest = ref<string | null>(null)
const drag = reactive({ item: -1, x: 0, y: 0, sx: 0, sy: 0, moved: 0 })
const mistakes = ref(0)
const idle = ref(0)
const between = ref(false)
const finished = ref(false)
const crossAt = ref<Pt | null>(null)
const tickAt = ref<Pt | null>(null)
const bounce = ref(-1)
const message = ref('')
let messageSeq = 0
let markSeq = 0
const field = ref<HTMLElement | null>(null)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => osterStars(mistakes.value))
const free = computed(() => guests.value.map((_, i) => i).filter((i) => !home.value.includes(guests.value[i]!.id)))
const landOf = (g: TonguesGuest) => props.game.lands.find((l) => l.id === g.land)!

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
function idleLoop() {
  if (!between.value && !finished.value && drag.item < 0) idle.value += 0.25
  later(idleLoop, 250)
}
later(idleLoop, 250)

/** Guest `i` brought to land `li`. */
function put(i: number, li: number) {
  const g = guests.value[i]
  const land = props.game.lands[li]
  if (between.value || finished.value || !g || !land || home.value.includes(g.id)) return
  idle.value = 0
  selected.value = -1
  if (!tonguesFits(g, land)) {
    mistakes.value++
    play('wrong')
    flash('bad', land)
    bounce.value = i
    later(() => {
      if (bounce.value === i) bounce.value = -1
    }, 600)
    say(t('app.adventure.tonguesWrong'))
    return
  }
  home.value.push(g.id)
  if (helpGuest.value === g.id) helpGuest.value = null
  progress.mark()
  play('found')
  flash('good', land)
  say(t('app.adventure.tonguesRight', { name: g.name }), 2000)
  if (!free.value.length) endRound()
}

function endRound() {
  between.value = true
  cursor.value = -1
  later(() => play('right'), 300)
  say(t('app.adventure.tonguesRoundDone'), 0)
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
    home.value = []
    selected.value = -1
    helpGuest.value = null
    between.value = false
    idle.value = 0
    message.value = ''
  }, 2800)
}

// ---- the finger
function percentAt(e: { clientX: number; clientY: number }): Pt | null {
  const r = field.value?.getBoundingClientRect()
  if (!r || !r.width || !r.height) return null
  return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }
}
function onMove(e: PointerEvent) {
  if (drag.item < 0) return
  drag.x = e.clientX
  drag.y = e.clientY
  drag.moved = Math.max(drag.moved, Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy))
}
function unlisten() {
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', stopDrag)
  window.removeEventListener('pointercancel', stopDrag)
}
function stopDrag(e?: PointerEvent) {
  unlisten()
  const i = drag.item
  drag.item = -1
  if (i < 0 || !e || e.type !== 'pointerup') return
  const moved = Math.max(drag.moved, Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy))
  if (moved < TAP_PX) {
    pick(i)
    return
  }
  dropAt(i, percentAt(e))
}
function dropAt(i: number, p: Pt | null) {
  const li = p ? tonguesLandAt(props.game.lands, p, ratio.value) : -1
  if (li < 0) {
    say(t('app.adventure.tonguesBack'))
    return
  }
  put(i, li)
}
function down(e: PointerEvent, i: number) {
  if (e.button > 0 || between.value || finished.value) return
  idle.value = 0
  drag.item = i
  drag.sx = drag.x = e.clientX
  drag.sy = drag.y = e.clientY
  drag.moved = 0
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', stopDrag)
  window.addEventListener('pointercancel', stopDrag)
}
onBeforeUnmount(() => unlisten())
function pick(i: number) {
  if (between.value || finished.value) return
  idle.value = 0
  selected.value = selected.value === i ? -1 : i
  if (selected.value >= 0) say(t('app.adventure.tonguesPicked', { name: guests.value[i]!.name }), 3200)
}
function guestClick(e: MouseEvent, i: number) {
  if (e.detail === 0) pick(i)
}
function tapLand(li: number) {
  if (between.value || finished.value) return
  if (selected.value < 0) {
    say(t('app.adventure.tonguesPickFirst'))
    return
  }
  put(selected.value, li)
}

// ---- the keyboard
function onKey(e: KeyboardEvent) {
  if (between.value || finished.value) return
  const k = e.key
  const nl = props.game.lands.length
  if (k === 'ArrowLeft' || k === 'ArrowRight') {
    e.preventDefault()
    idle.value = 0
    const list = free.value
    if (!list.length) return
    const at = list.indexOf(selected.value)
    selected.value = list[at < 0 ? 0 : (at + (k === 'ArrowRight' ? 1 : -1) + list.length) % list.length]!
    announce()
    return
  }
  if (k === 'ArrowUp' || k === 'ArrowDown') {
    e.preventDefault()
    idle.value = 0
    cursor.value = cursor.value < 0 ? 0 : (cursor.value + (k === 'ArrowDown' ? 1 : -1) + nl) % nl
    announce()
    return
  }
  if (k === 'Enter' || k === ' ') {
    e.preventDefault()
    if (selected.value < 0 && free.value.length) selected.value = free.value[0]!
    if (cursor.value < 0) {
      cursor.value = 0
      announce()
      return
    }
    if (selected.value >= 0) put(selected.value, cursor.value)
  }
}
function announce() {
  const g = selected.value >= 0 ? guests.value[selected.value] : undefined
  const land = cursor.value >= 0 ? props.game.lands[cursor.value]!.name : ''
  if (g && land) say(t('app.adventure.tonguesChoice', { name: g.name, land }), 0)
  else if (g) say(t('app.adventure.tonguesPicked', { name: g.name }), 0)
}

/** "Help me": the first waiting guest is chosen, his home picture shows, his land is marked. */
function helpMe() {
  idle.value = 0
  const i = free.value[0]
  if (i === undefined) return
  selected.value = i
  helpGuest.value = guests.value[i]!.id
  say(t('app.adventure.tonguesHelpSay', { name: guests.value[i]!.name }), 4000)
}

// ---- looks
const landStyle = (li: number) => {
  const l = props.game.lands[li]!
  return { left: `${l.x}%`, top: `${l.y}%`, width: `${l.r * 2}%` }
}
const guestStyle = (g: TonguesGuest) => {
  const l = landOf(g)
  return { left: `${l.x}%`, top: `${l.y}%`, width: `${props.game.guestW}%` }
}
const showsHome = (g: TonguesGuest) => current.value.showHome || helpGuest.value === g.id
const markStyle = (p: Pt) => ({ left: `${p.x}%`, top: `${p.y}%` })
const ghostStyle = computed(() => ({ left: `${drag.x}px`, top: `${drag.y}px` }))
const helpLand = computed(() => {
  const g = guests.value.find((x) => x.id === helpGuest.value)
  return g ? g.land : null
})
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        ref="field"
        class="gm-field"
        :style="{ backgroundImage: `url(${src(game.map)})`, aspectRatio: String(ratio) }"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.tonguesField')"
        @keydown="onKey"
      )
        button(
          v-for="(l, li) in game.lands"
          :key="`land-${l.id}`"
          type="button"
          class="gm-land"
          :class="{ armed: selected >= 0 || drag.item >= 0, cursor: cursor === li, help: helpLand === l.id }"
          :data-land="l.id"
          :style="landStyle(li)"
          :aria-label="l.name"
          tabindex="-1"
          @click="tapLand(li)"
        )
        template(v-for="g in guests" :key="`home-${round}-${g.id}`")
          div(v-if="home.includes(g.id)" class="gm-arrived" :data-arrived="g.id" :style="guestStyle(g)" role="img" :aria-label="t('app.adventure.tonguesArrived', { name: g.name })")
            GameImage(:src="g.image" :ratio="0.667" colour="#c9b48a" :label="g.name")
            span(class="gm-ear")
              GameImage(:src="game.ear" :ratio="1" colour="#f2c46a" label="ohr")
        span(v-if="crossAt" class="gm-mark" :style="markStyle(crossAt)")
          GameMark(kind="bad")
        span(v-if="tickAt" class="gm-mark" :style="markStyle(tickAt)")
          GameMark(kind="good")
      div(class="gm-tray" role="group" :aria-label="t('app.adventure.tonguesTray')")
        template(v-for="(g, i) in guests" :key="`guest-${round}-${g.id}`")
          button(
            v-if="!home.includes(g.id)"
            type="button"
            class="gm-guest"
            :class="{ sel: selected === i, held: drag.item === i && drag.moved >= TAP_PX, bounce: bounce === i }"
            :data-guest="g.id"
            :aria-label="g.name"
            :aria-pressed="selected === i ? 'true' : 'false'"
            :disabled="between"
            @pointerdown.prevent="down($event, i)"
            @click="guestClick($event, i)"
          )
            span(v-if="showsHome(g)" class="gm-homepic" :data-homepic="g.id")
              GameImage(:src="landOf(g).home" :ratio="1" round colour="#d9c48f" :label="landOf(g).name")
            GameImage(:src="g.image" :ratio="0.667" colour="#c9b48a" :label="g.name")
      div(v-if="drag.item >= 0 && drag.moved >= TAP_PX" class="gm-ghost" :style="ghostStyle" aria-hidden="true")
        GameImage(:src="guests[drag.item]?.image ?? ''" :ratio="0.667" colour="#c9b48a")
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.tonguesCount', { n: home.length, total: guests.length }) }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between" tone="gold" @click="helpMe") {{ t('app.adventure.tonguesHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.tonguesDone')" @next="emit('done', stars)")
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
  touch-action: none

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

// a land: an invisible round button of at least 44 pixels; while a guest is in the hand a dashed ring shows it
.gm-land
  position: absolute
  display: block
  aspect-ratio: 1 / 1
  min-width: 44px
  padding: 0
  transform: translate(-50%, -50%)
  border: 3px dashed transparent
  border-radius: 50%
  background: transparent
  cursor: pointer
  z-index: 2

  &.armed
    border-color: rgba(255, 246, 220, 0.85)

  &.cursor, &.help
    border-color: #fff6dc
    border-style: solid
    box-shadow: 0 0 0 3px rgba(40, 25, 5, 0.55)

.gm-arrived
  position: absolute
  display: block
  transform: translate(-50%, -85%)
  pointer-events: none
  z-index: 3
  filter: drop-shadow(0 3px 4px rgba(40, 25, 5, 0.45))

.gm-ear
  position: absolute
  right: -30%
  top: 0
  width: 45%
  display: block

.gm-mark
  position: absolute
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 6

.gm-tray
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 6px
  min-height: 110px

.gm-guest
  position: relative
  width: 64px
  min-height: 104px
  padding: 4px
  border: 3px solid #d4a83e
  border-radius: 14px
  background: rgba(255, 246, 220, 0.94)
  cursor: grab
  touch-action: none
  transition: transform 200ms ease, opacity 200ms ease

  &.sel
    border-color: #2f6b8a
    border-style: double
    border-width: 5px
    transform: scale(1.06)

  &.held
    opacity: 0.4

  &.bounce
    animation: gm-bounce 500ms ease

.gm-homepic
  position: absolute
  top: -18px
  right: -10px
  width: 36px
  display: block
  z-index: 1

.gm-ghost
  position: fixed
  width: 64px
  display: block
  transform: translate(-50%, -50%)
  pointer-events: none
  z-index: 50

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

@keyframes gm-bounce
  0%, 100%
    transform: translateY(0)
  30%
    transform: translateY(-8px)

@media (prefers-reduced-motion: reduce)
  .gm-guest
    transition: none

    &.bounce
      animation: none
</style>
