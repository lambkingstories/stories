<script setup lang="ts">
/**
 * Gather the sticks (Acts 28,3: "Paul gathered a bundle of sticks and laid them on the fire"). The beach of Malta in the rain, a fire at the left, heaps of dry sticks, stones, a shell,
 * seaweed and wet driftwood on the open ground. The child draws a loop with a finger (a trail of little twig dots follows it). A closed loop (its end near its beginning) gathers what lies
 * inside: only dry sticks (at least two heaps): they fly together to a bundle, Paulus carries it to the fire, the fire grows a step, a tick. Something that does not burn inside: the loop
 * falls apart, a cross and "There is something in it that does not burn", a mistake, everything stays. Fewer than two heaps: "Gather more!" (no mistake). An open loop fades (no mistake).
 * Keyboard: the arrow keys choose a thing, Enter marks it, the button "Gather" gathers everything marked (the same check). "Help me" after fifteen seconds shows a pale loop around a good pair.
 * Round 1: three bundles; round 2: four bundles, the sticks lie between stones and wet wood. Stars: `osterStars(mistakes)`.
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
import { prDist } from '@/utils/paulusromNeuA'
import type { PrPt } from '@/utils/paulusromNeuA'
import { brushFireLevel, brushHelp, brushInside, brushJudge, brushLoopClosed } from '@/utils/paulusromNeuB'
import type { BrushwoodGame } from '@/utils/paulusromNeuB'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: BrushwoodGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.rounds.reduce((s, r) => s + r.bundles, 0))

const IDLE_SECONDS = 15
/** A new point of the trail only when the finger moved at least this far (units). */
const STEP = 0.8
const MAX_POINTS = 400

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const ratio = computed(() => props.game.ratio ?? 1.5)
/** The things (indices) that are gathered into bundles already. */
const taken = ref<number[]>([])
const bundles = ref(0)
const trail = ref<PrPt[]>([])
const drawing = ref(false)
const marked = ref<number[]>([])
const cursor = ref(-1)
const carrying = ref(false)
const helpPair = ref<[number, number] | null>(null)
const mistakes = ref(0)
const idle = ref(0)
const between = ref(false)
const finished = ref(false)
const finale = ref(false)
const crossAt = ref<PrPt | null>(null)
const tickAt = ref<PrPt | null>(null)
const message = ref('')
let messageSeq = 0
let markSeq = 0
const field = ref<HTMLElement | null>(null)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => osterStars(mistakes.value))
const fire = computed(() => brushFireLevel(current.value, bundles.value))
const left = computed(() => current.value.things.map((_, i) => i).filter((i) => !taken.value.includes(i)))

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
  if (!between.value && !finished.value && !drawing.value) idle.value += 0.25
  later(idleLoop, 250)
}
later(idleLoop, 250)

const centre = (held: number[]): PrPt => {
  const ts = held.map((i) => current.value.things[i]!)
  return { x: ts.reduce((s, p) => s + p.x, 0) / ts.length, y: ts.reduce((s, p) => s + p.y, 0) / ts.length }
}

/** Something was gathered (by a loop or by the button): `held` are the things inside. */
function gather(held: number[]) {
  if (between.value || finished.value) return
  idle.value = 0
  helpPair.value = null
  const verdict = brushJudge(current.value, held)
  if (verdict === 'bad') {
    mistakes.value++
    play('wrong')
    flash('bad', centre(held))
    say(t('app.adventure.brushwoodBad'))
    marked.value = []
    return
  }
  if (verdict === 'few') {
    say(t('app.adventure.brushwoodFew'))
    return
  }
  const at = centre(held)
  taken.value = [...taken.value, ...held]
  marked.value = []
  bundles.value++
  progress.mark()
  play('found')
  flash('good', at)
  say(t('app.adventure.brushwoodRight'), 2000)
  carrying.value = true
  later(() => (carrying.value = false), 1300)
  const dryLeft = current.value.things.filter((th, i) => th.dry && !taken.value.includes(i)).length
  if (bundles.value >= current.value.bundles || dryLeft < 2) later(endRound, 1400)
}

function endRound() {
  between.value = true
  cursor.value = -1
  later(() => play('right'), 300)
  if (lastRound.value) {
    finale.value = true
    say(t('app.adventure.brushwoodAll'), 0)
    later(() => {
      play('star')
      finished.value = true
    }, 3200)
    return
  }
  say(t('app.adventure.brushwoodRoundDone'), 0)
  later(() => say(t('app.adventure.gameNext'), 0), 1300)
  later(() => {
    round.value++
    taken.value = []
    bundles.value = 0
    marked.value = []
    trail.value = []
    between.value = false
    idle.value = 0
    message.value = ''
  }, 2800)
}

// ---- the finger draws a loop
function percentAt(e: { clientX: number; clientY: number }): PrPt | null {
  const r = field.value?.getBoundingClientRect()
  if (!r || !r.width || !r.height) return null
  const pc = (v: number) => Math.round(Math.max(0, Math.min(100, v)) * 100) / 100
  return { x: pc(((e.clientX - r.left) / r.width) * 100), y: pc(((e.clientY - r.top) / r.height) * 100) }
}
function addPoint(p: PrPt | null) {
  if (!p || trail.value.length >= MAX_POINTS) return
  const last = trail.value[trail.value.length - 1]
  if (!last || prDist(last, p, ratio.value) >= STEP) trail.value = [...trail.value, p]
}
function onMove(e: PointerEvent) {
  if (drawing.value) addPoint(percentAt(e))
}
function unlisten() {
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', stopDraw)
  window.removeEventListener('pointercancel', stopDraw)
}
function stopDraw(e?: PointerEvent) {
  unlisten()
  if (!drawing.value) return
  drawing.value = false
  if (e && e.type === 'pointerup') addPoint(percentAt(e))
  const pts = trail.value
  if (e && e.type === 'pointerup' && pts.length >= 2) {
    if (!brushLoopClosed(pts, ratio.value, props.game.closeDist ?? 8)) {
      if (pts.length >= 6) say(t('app.adventure.brushwoodOpen'))
    } else {
      const held = left.value.filter((i) => brushInside(pts, current.value.things[i]!, ratio.value))
      if (held.length) gather(held)
      else say(t('app.adventure.brushwoodFew'))
    }
  }
  later(() => {
    if (!drawing.value) trail.value = []
  }, 450)
}
function down(e: PointerEvent) {
  if (e.button > 0 || between.value || finished.value) return
  idle.value = 0
  helpPair.value = null
  drawing.value = true
  trail.value = []
  addPoint(percentAt(e))
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', stopDraw)
  window.addEventListener('pointercancel', stopDraw)
}
onBeforeUnmount(() => unlisten())

// ---- the keyboard
function onKey(e: KeyboardEvent) {
  if (between.value || finished.value) return
  const k = e.key
  if (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown') {
    e.preventDefault()
    idle.value = 0
    const list = left.value
    if (!list.length) return
    const at = list.indexOf(cursor.value)
    const dir = k === 'ArrowRight' || k === 'ArrowDown' ? 1 : -1
    cursor.value = list[at < 0 ? (dir > 0 ? 0 : list.length - 1) : (at + dir + list.length) % list.length]!
    say(t(marked.value.includes(cursor.value) ? 'app.adventure.brushwoodMarked' : 'app.adventure.brushwoodThing', { name: current.value.things[cursor.value]!.name }), 0)
    return
  }
  if (k === 'Enter' || k === ' ') {
    e.preventDefault()
    if (cursor.value < 0 || taken.value.includes(cursor.value)) return
    marked.value = marked.value.includes(cursor.value) ? marked.value.filter((i) => i !== cursor.value) : [...marked.value, cursor.value]
    say(t(marked.value.includes(cursor.value) ? 'app.adventure.brushwoodMarked' : 'app.adventure.brushwoodThing', { name: current.value.things[cursor.value]!.name }), 0)
  }
}
function gatherMarked() {
  if (!marked.value.length) {
    say(t('app.adventure.brushwoodNone'))
    return
  }
  gather([...marked.value])
}

/** "Help me": a pale loop shows around a pair of dry heaps that can be gathered. */
function helpMe() {
  idle.value = 0
  helpPair.value = brushHelp(current.value, taken.value, bundles.value, ratio.value)
  say(t('app.adventure.brushwoodHelpSay'), 4000)
}

// ---- looks
const thingStyle = (i: number) => {
  const th = current.value.things[i]!
  return { left: `${th.x}%`, top: `${th.y}%`, width: `${th.w}%` }
}
const fireStyle = computed(() => ({ left: `${props.game.fireAt.x}%`, top: `${props.game.fireAt.y}%`, width: `${props.game.fireW}%` }))
const paulusStyle = computed(() => ({ left: `${props.game.paulusAt.x}%`, top: `${props.game.paulusAt.y}%`, width: `${props.game.paulusW}%` }))
const bundleStyle = computed(() => ({ left: `${props.game.paulusAt.x + props.game.paulusW * 0.45}%`, top: `${props.game.paulusAt.y - 8}%`, width: `${props.game.paulusW * 0.8}%` }))
/** The dots of the trail: about every third point, so that the twigs lie apart. */
const dots = computed(() => trail.value.filter((_, i) => i % 3 === 0))
const dotStyle = (p: PrPt) => ({ left: `${p.x}%`, top: `${p.y}%` })
const markStyle = (p: PrPt) => ({ left: `${p.x}%`, top: `${p.y}%` })
const helpStyle = computed(() => {
  const h = helpPair.value
  if (!h) return {}
  const a = current.value.things[h[0]]!
  const b = current.value.things[h[1]]!
  const d = prDist(a, b, ratio.value)
  const angle = (Math.atan2((b.y - a.y) / ratio.value, b.x - a.x) * 180) / Math.PI
  const w = d + 16
  return { left: `${(a.x + b.x) / 2}%`, top: `${(a.y + b.y) / 2}%`, width: `${w}%`, aspectRatio: String(w / 14), transform: `translate(-50%, -50%) rotate(${angle}deg)` }
})
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        v-if="!finale"
        ref="field"
        class="gm-field"
        :style="{ backgroundImage: `url(${src(game.beach)})`, aspectRatio: String(ratio) }"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.brushwoodField')"
        :aria-description="t('app.adventure.brushwoodKeys')"
        @pointerdown.prevent="down($event)"
        @keydown="onKey"
      )
        span(class="gm-fire" data-fire :data-level="fire" :style="fireStyle" role="img" :aria-label="t('app.adventure.brushwoodFire', { n: fire })")
          GameImage(:src="game.fire[fire - 1] ?? ''" :ratio="1" colour="#d2672a" label="feuer")
        span(class="gm-paulus" :style="paulusStyle" aria-hidden="true")
          GameImage(:src="game.paulus" :ratio="0.667" colour="#c9b48a" label="paulus-buendel")
        span(v-if="carrying" class="gm-bundle" data-bundle :style="bundleStyle" aria-hidden="true")
          GameImage(:src="game.bundle" :ratio="1.43" colour="#b08a4a" label="buendel")
        span(v-if="helpPair" class="gm-help" data-help :style="helpStyle" aria-hidden="true")
        template(v-for="(th, i) in current.things" :key="`thing-${round}-${th.id}`")
          button(
            v-if="!taken.includes(i)"
            type="button"
            class="gm-thing"
            :class="{ marked: marked.includes(i), cursor: cursor === i, glow: helpPair && helpPair.includes(i) }"
            :data-thing="th.id"
            :style="thingStyle(i)"
            :aria-label="marked.includes(i) ? t('app.adventure.brushwoodMarked', { name: th.name }) : t('app.adventure.brushwoodThing', { name: th.name })"
            :aria-pressed="marked.includes(i) ? 'true' : 'false'"
            tabindex="-1"
          )
            GameImage(:src="th.image" :ratio="1" colour="#a88c5a" :label="th.id")
            span(v-if="marked.includes(i)" class="gm-ok" aria-hidden="true") ✓
        span(v-for="(p, pi) in dots" :key="`dot-${pi}`" class="gm-dot" data-dot :style="dotStyle(p)" aria-hidden="true")
          GameImage(:src="game.dot" :ratio="1" colour="#8a6a35" label="")
        span(v-if="crossAt" class="gm-mark" :style="markStyle(crossAt)")
          GameMark(kind="bad")
        span(v-if="tickAt" class="gm-mark" :style="markStyle(tickAt)")
          GameMark(kind="good")
      div(v-else class="gm-finale" role="img" :aria-label="t('app.adventure.brushwoodAll')" data-finale)
        GameImage(:src="game.finale" :ratio="1.5" colour="#c9b48a" label="am-feuer")
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.brushwoodCount', { n: bundles, total: current.bundles }) }}
      AdvButton(v-if="marked.length && !between" tone="gold" data-gather @click="gatherMarked") {{ t('app.adventure.brushwoodGather') }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between" tone="gold" @click="helpMe") {{ t('app.adventure.brushwoodHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.brushwoodDone')" @next="emit('done', stars)")
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
  background-color: #8c8f86
  background-size: cover
  background-position: center
  touch-action: none
  cursor: crosshair

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

.gm-finale
  width: 100%
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e

.gm-fire
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none
  z-index: 2

.gm-paulus
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none
  z-index: 3
  filter: drop-shadow(0 3px 4px rgba(40, 25, 5, 0.45))

.gm-bundle
  position: absolute
  display: block
  transform: translate(-50%, -50%)
  pointer-events: none
  z-index: 4
  animation: gm-pop 400ms ease

.gm-thing
  position: absolute
  display: block
  min-width: 36px
  min-height: 36px
  padding: 0
  transform: translate(-50%, -50%)
  border: 3px solid transparent
  border-radius: 50%
  background: transparent
  pointer-events: none
  z-index: 3
  filter: drop-shadow(0 2px 3px rgba(40, 25, 5, 0.45))

  &.marked
    border-color: #fff6dc
    border-style: dashed
    background: rgba(255, 246, 220, 0.3)

  &.cursor
    border-color: #fff6dc
    box-shadow: 0 0 0 3px rgba(40, 25, 5, 0.55)

  &.glow
    box-shadow: 0 0 14px 4px rgba(255, 233, 160, 0.9)

.gm-ok
  position: absolute
  top: -4px
  right: -4px
  width: 20px
  height: 20px
  display: flex
  align-items: center
  justify-content: center
  border-radius: 50%
  border: 2px solid #fff
  background: #2f6b3f
  color: #fff
  font-weight: 900
  font-size: 0.8rem
  line-height: 1

.gm-dot
  position: absolute
  display: block
  width: 3.4%
  transform: translate(-50%, -50%)
  pointer-events: none
  z-index: 5
  opacity: 0.9

.gm-help
  position: absolute
  display: block
  border-radius: 50%
  border: 3px dashed #fff6dc
  background: rgba(255, 246, 220, 0.18)
  pointer-events: none
  z-index: 2
  animation: gm-glow 1400ms ease-in-out infinite

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

@keyframes gm-pop
  from
    transform: translate(-50%, -50%) scale(0.2)
  to
    transform: translate(-50%, -50%) scale(1)

@keyframes gm-glow
  0%, 100%
    opacity: 0.6
  50%
    opacity: 1

@media (prefers-reduced-motion: reduce)
  .gm-bundle, .gm-help
    animation: none
</style>
