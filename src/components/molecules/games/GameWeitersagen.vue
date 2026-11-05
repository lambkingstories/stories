<script setup lang="ts">
/**
 * Spread the word (Luke 2,17). The village of Bethlehem seen from above: the shelter with the manger, where the shepherds set out, and houses around it. The shepherds go from house to house and tell what they have
 * heard; every house must hear it once. Their way is a footpath from door to door, and the paths must never cross (and may not run through another door). The child leads them with a finger: it takes the shepherds
 * from where they stand (a line follows the finger) and lets go over the next house; or it taps the next house; with the keyboard the arrow keys choose a house and Enter goes there. A crossing path or a path through
 * another house is a mistake (a cross and a word, the shepherds stay); a house that has heard the news already, or a place where the way is stuck, is only told in words (no mistake): "Take back the last way"
 * (a button, no mistake) leads the shepherds one house back. Round 1: four houses; round 2: seven houses, where a wrong order gets stuck. Whoever does not go on gets "Help me" after fifteen seconds: the next
 * house of a way that works is ringed (or the last way is taken back). With reduced motion the shepherds do not glide. Nothing is shown by colour alone (tick, cross, words).
 * The arithmetic is `utils/weihnachtenNeu.ts`; stars: `osterStars(mistakes)`.
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
import { TELL_RATIO, TELL_SPRITE, tellHelp, tellOptions, tellPlaceAt, tellPoints, tellTry, wnNeighbour } from '@/utils/weihnachtenNeu'
import type { Pt, TellGame, TellHouse } from '@/utils/weihnachtenNeu'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: TellGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every house that is reached (the shelter is where they set out)
progress.setGoal(props.game.rounds.reduce((n, r) => n + r.houses.length, 0))

const IDLE_SECONDS = 15
const MOVE_PX = 8
/** How thick a footpath is (percent of the width of the village). */
const PATH_T = 4

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const pts = computed(() => tellPoints(current.value))
const route = ref<number[]>([0])
const cursor = ref(-1)
const hintPlace = ref(-1)
/** The finger, while the shepherds are taken along (percent of the village). */
const carry = ref<Pt | null>(null)
const mistakes = ref(0)
const idle = ref(0)
const finished = ref(false)
const between = ref(false)
const message = ref('')
const markAt = ref<{ at: Pt; kind: 'good' | 'bad' } | null>(null)
let credited = 0
let messageSeq = 0
let markSeq = 0
const field = ref<HTMLElement | null>(null)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => osterStars(mistakes.value))
const last = computed(() => route.value[route.value.length - 1]!)
const visited = computed(() => route.value.length - 1)

function say(text: string, ms = 3000) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}
function flash(at: Pt, kind: 'good' | 'bad') {
  const id = ++markSeq
  markAt.value = { at, kind }
  later(() => {
    if (markSeq === id) markAt.value = null
  }, 1300)
}

function idleLoop() {
  if (!between.value && !finished.value && !carry.value) idle.value += 0.25
  later(idleLoop, 250)
}
later(idleLoop, 250)

/** The shepherds go on to place `j`: the way is free, it crosses another way, or it runs through a door. */
function go(j: number) {
  if (between.value || finished.value || j < 0) return
  idle.value = 0
  hintPlace.value = -1
  const p = pts.value
  const v = tellTry(p, route.value, j)
  const name = p[j]!.name
  if (v.kind === 'same') return
  if (v.kind === 'told') {
    say(t('app.adventure.tellTold', { name }), 2800)
    return
  }
  if (v.kind === 'cross') {
    mistakes.value++
    play('wrong')
    flash(v.at, 'bad')
    say(t('app.adventure.tellCross'), 3200)
    return
  }
  if (v.kind === 'house') {
    mistakes.value++
    play('wrong')
    flash(p[v.house]!, 'bad')
    say(t('app.adventure.tellThrough', { name: p[v.house]!.name }), 3200)
    return
  }
  route.value = [...route.value, j]
  play('bead')
  flash(p[j]!, 'good')
  if (visited.value > credited) {
    progress.mark()
    credited = visited.value
  }
  if (route.value.length === p.length) {
    endRound()
    return
  }
  if (!tellOptions(p, route.value).length) say(t('app.adventure.tellStuck'), 0)
  else say(t('app.adventure.tellHeard', { name }), 2400)
}

function endRound() {
  between.value = true
  later(() => play('right'), 250)
  say(t('app.adventure.tellAll'), 0)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 2200)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 1400)
  later(() => {
    round.value++
    route.value = [0]
    cursor.value = -1
    credited = 0
    between.value = false
    idle.value = 0
    message.value = ''
  }, 2800)
}

/** "Take back the last way": the shepherds stand one house back (no mistake). */
function undo() {
  if (between.value || finished.value || route.value.length < 2) return
  idle.value = 0
  hintPlace.value = -1
  route.value = route.value.slice(0, -1)
  play('tap')
  message.value = ''
}

// ---- the finger: a line from the shepherds, or a tap on a house
let dragging = false
let sx = 0
let sy = 0
let moved = 0

function pointAt(e: { clientX: number; clientY: number }): Pt | null {
  const r = field.value?.getBoundingClientRect()
  if (!r || !r.width || !r.height) return null
  return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }
}
function onMove(e: PointerEvent) {
  if (!dragging) return
  moved = Math.max(moved, Math.hypot(e.clientX - sx, e.clientY - sy))
  const p = pointAt(e)
  if (p && moved >= MOVE_PX) carry.value = p
}
function stopDrag(e?: PointerEvent) {
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', stopDrag)
  window.removeEventListener('pointercancel', stopDrag)
  dragging = false
  carry.value = null
  if (!e || e.type !== 'pointerup') return
  const p = pointAt(e)
  if (!p) return
  go(tellPlaceAt(pts.value, p))
}
function down(e: PointerEvent) {
  if (e.button > 0 || between.value || finished.value) return
  const p = pointAt(e)
  if (!p) return
  e.preventDefault()
  field.value?.focus({ preventScroll: true })
  idle.value = 0
  dragging = true
  sx = e.clientX
  sy = e.clientY
  moved = 0
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', stopDrag)
  window.addEventListener('pointercancel', stopDrag)
}
onBeforeUnmount(() => stopDrag())

const centres = computed(() => pts.value.map((h) => ({ x: h.x, y: h.y - heightOf(h) / 2 })))
function onKey(e: KeyboardEvent) {
  if (between.value || finished.value) return
  const arrows: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
  const a = arrows[e.key]
  if (a) {
    e.preventDefault()
    idle.value = 0
    cursor.value = cursor.value < 0 ? last.value : wnNeighbour(centres.value, cursor.value, a[0], a[1], TELL_RATIO)
    say(pts.value[cursor.value]!.name, 0)
    return
  }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    if (cursor.value < 0) {
      cursor.value = last.value
      say(t('app.adventure.tellKeys'), 3600)
      return
    }
    go(cursor.value)
    return
  }
  if (e.key === 'Backspace' || e.key === 'Escape') {
    e.preventDefault()
    undo()
  }
}

/** The button for those who do not go on: the next house of a way that works is ringed, or the last way is taken back. */
function helpMe() {
  idle.value = 0
  const h = tellHelp(pts.value, route.value)
  if (!h) return
  if ('undo' in h) {
    undo()
    say(t('app.adventure.tellHelpUndo'), 4000)
    return
  }
  hintPlace.value = h.next
  say(t('app.adventure.tellHelpSay', { name: pts.value[h.next]!.name }), 4000)
}

// ---- looks
const z = (y: number) => Math.round(y * 10) + 10
const heightOf = (h: TellHouse): number => (h.w / TELL_SPRITE) * TELL_RATIO
const houseStyle = (h: TellHouse) => ({ left: `${h.x}%`, top: `${h.y}%`, width: `${h.w}%`, zIndex: z(h.y) })
const ringStyle = (h: TellHouse | undefined) => (!h ? {} : { left: `${h.x}%`, top: `${h.y - heightOf(h) / 2}%`, width: `${h.w}%`, height: `${heightOf(h)}%` })
/** A footpath from a to b: a strip of the picture as long as the way, turned (units of the width: the vertical difference is divided by the ratio). */
function wayStyle(a: Pt, b: Pt, ghost = false) {
  const dx = b.x - a.x
  const dy = (b.y - a.y) / TELL_RATIO
  const len = Math.max(0.1, Math.hypot(dx, dy))
  return {
    left: `${a.x}%`,
    top: `${a.y}%`,
    width: `${len}%`,
    aspectRatio: String(len / PATH_T),
    transform: `translateY(-50%) rotate(${(Math.atan2(dy, dx) * 180) / Math.PI}deg)`,
    backgroundImage: `url(${src(props.game.path)})`,
    zIndex: ghost ? 2 : 1
  }
}
const ways = computed(() => route.value.slice(1).map((j, k) => ({ key: `${round.value}-${k}`, style: wayStyle(pts.value[route.value[k]!]!, pts.value[j]!) })))
const preview = computed(() => (carry.value ? wayStyle(pts.value[last.value]!, carry.value, true) : null))
const walkerStyle = computed(() => {
  const p = pts.value[last.value]!
  // the shepherds stand at the lower right corner of the house at the door (so that they do not hide what the house shows), inside the picture
  const w = props.game.walkerW
  return { left: `${Math.min(100 - w / 2, p.x + p.w * 0.36)}%`, top: `${Math.min(100, p.y + 1.5)}%`, width: `${w}%`, zIndex: 4000 }
})
const markStyle = computed(() => ({ left: `${markAt.value?.at.x ?? 0}%`, top: `${markAt.value?.at.y ?? 0}%` }))
const placeLabel = (i: number) => {
  const h = pts.value[i]!
  if (i === 0) return h.name
  return `${h.name}. ${t(route.value.includes(i) ? 'app.adventure.tellHouseTold' : 'app.adventure.tellHouseWaits')}`
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
        :style="{ backgroundImage: `url(${src(game.background)})`, aspectRatio: String(TELL_RATIO) }"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.tellField')"
        @pointerdown="down"
        @keydown="onKey"
      )
        div(v-for="w in ways" :key="w.key" class="gm-way" :style="w.style" aria-hidden="true")
        div(v-if="preview" class="gm-way preview" :style="preview" aria-hidden="true")
        div(
          v-for="(h, i) in pts"
          :key="`h-${round}-${i}`"
          class="gm-house"
          :class="{ told: route.includes(i) && i > 0, start: i === 0 }"
          :data-place="i"
          :style="houseStyle(h)"
          role="img"
          :aria-label="placeLabel(i)"
        )
          GameImage(:src="h.image" :ratio="TELL_SPRITE" colour="#b79a6a" :label="h.name")
          span(v-if="route.includes(i) && i > 0" class="gm-tick" aria-hidden="true")
            GameMark(kind="good")
        div(v-if="hintPlace >= 0" class="gm-ring hint" :style="ringStyle(pts[hintPlace])" aria-hidden="true")
        div(v-if="cursor >= 0" class="gm-ring cursor" :style="ringStyle(pts[cursor])" aria-hidden="true")
        div(class="gm-walker" :style="walkerStyle" role="img" :aria-label="t('app.adventure.tellShepherds')")
          GameImage(:src="game.walker" :ratio="400 / 420" colour="#8a7a62" label="hirten")
        div(v-if="markAt" class="gm-mark" :style="markStyle" aria-hidden="true")
          GameMark(:kind="markAt.kind")
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.tellCount', { n: visited, total: pts.length - 1 }) }}
      div(class="gm-buttons")
        AdvButton(v-if="route.length > 1 && !between" tone="blau" @click="undo") {{ t('app.adventure.tellUndo') }}
        AdvButton(v-if="idle > IDLE_SECONDS && !between" tone="gold" @click="helpMe") {{ t('app.adventure.tellHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.tellDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e3d6b0
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

.gm-hint
  margin: 0
  text-align: center
  font-weight: 700
  font-size: 1rem
  color: #5a4a2c

.gm-field
  position: relative
  width: 100%
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #8fa862
  background-size: cover
  background-position: center
  touch-action: none
  cursor: pointer

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

// a footpath: a strip of the painted path, as long as the way
.gm-way
  position: absolute
  display: block
  transform-origin: 0 50%
  background-repeat: repeat-x
  background-size: auto 100%
  background-position: left center
  pointer-events: none

  &.preview
    opacity: 0.55

.gm-house
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none
  filter: drop-shadow(0 3px 3px rgba(50, 35, 10, 0.4))

  &.told
    filter: drop-shadow(0 3px 3px rgba(50, 35, 10, 0.4)) brightness(1.08)

.gm-tick
  position: absolute
  right: 4%
  top: 2%
  display: block
  z-index: 3

.gm-ring
  position: absolute
  display: block
  transform: translate(-50%, -50%)
  border: 3px dashed #fff6dc
  border-radius: 14px
  box-shadow: 0 0 0 2px rgba(80, 45, 10, 0.6)
  pointer-events: none
  z-index: 3900

  &.cursor
    border-style: solid

.gm-walker
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none
  filter: drop-shadow(0 3px 3px rgba(50, 35, 10, 0.5))
  transition: left 500ms ease-in-out, top 500ms ease-in-out

.gm-mark
  position: absolute
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 4100

.gm-count
  margin: 0
  align-self: center
  padding: 2px 14px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  color: #5a4a2c

.gm-buttons
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 10px

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

// less motion: the shepherds do not glide
@media (prefers-reduced-motion: reduce)
  .gm-walker
    transition: none
</style>
