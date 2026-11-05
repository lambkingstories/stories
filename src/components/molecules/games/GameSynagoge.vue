<script setup lang="ts">
/**
 * The synagogue (Luke 7,5: "he loveth our nation, and he hath built us a synagogue"). The empty building site in Capernaum, straight from the front: a stone platform. Under the picture a strip
 * with the parts (column, beam, roof, each with how many are left). The child drags a part onto the site (or taps the part and then its place; on the keyboard left/right choose a part,
 * up/down a place, Enter sets it). A part finds the nearest free place of its kind. It must be carried: a beam only lies on its columns, the roof only on its beams. A beam set before its columns
 * stand, or a part on a place of another kind, goes back (a cross and a word, a mistake). Letting go far beside the places is no mistake.
 * Round 1: four columns and one long beam, the places are shown as dashed outlines. Round 2: six columns, two beams and the roof, the places only show while a part is in the hand.
 * Whoever does not go on gets "Help me" after fifteen seconds: the next part is set. Nothing is shown by colour alone (tick, cross, words). With reduced motion nothing bounces.
 * The arithmetic is `utils/heilungNeu.ts`; stars: `heilungStars(mistakes)`.
 */
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { SYNAGOGUE_KINDS, heilungStars, synagogueDone, synagogueDrop, synagogueFits, synagogueHelp, synagogueLeft, synagogueMid } from '@/utils/heilungNeu'
import type { Pt, SynagogueGame, SynagoguePartKind, SynagogueSlot } from '@/utils/heilungNeu'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: SynagogueGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.rounds.reduce((n, r) => n + r.slots.length, 0))

const IDLE_SECONDS = 15
const TAP_PX = 8

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const filled = ref<Set<string>>(new Set())
/** The part chosen by a tap or the keyboard. */
const selected = ref<SynagoguePartKind | null>(null)
/** The place chosen with the keyboard. */
const cursor = ref(-1)
const drag = reactive({ kind: null as SynagoguePartKind | null, x: 0, y: 0, sx: 0, sy: 0, moved: 0, px: 0 })
const crossAt = ref<Pt | null>(null)
const tickAt = ref<Pt | null>(null)
const bounce = ref<SynagoguePartKind | null>(null)
const helpSlot = ref('')
const mistakes = ref(0)
const idle = ref(0)
const finished = ref(false)
const between = ref(false)
const message = ref('')
let messageSeq = 0
let markSeq = 0
const field = ref<HTMLElement | null>(null)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => heilungStars(mistakes.value))
const total = computed(() => current.value.slots.length)
const setCount = computed(() => filled.value.size)
const partName = (k: SynagoguePartKind) => props.game.parts[k].name
/** The parts of the strip that are still needed in this round. */
const tray = computed(() => SYNAGOGUE_KINDS.filter((k) => synagogueLeft(current.value, filled.value, k) > 0))

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
  if (!between.value && !finished.value && !drag.kind) idle.value += 0.25
  later(idleLoop, 250)
}
later(idleLoop, 250)

/** A part of `kind` is set on place `slotId`: it stays, or it goes back with a cross. */
function put(kind: SynagoguePartKind, slotId: string, helped = false) {
  if (between.value || finished.value) return
  const s = current.value.slots.find((x) => x.id === slotId)
  if (!s) return
  idle.value = 0
  selected.value = null
  helpSlot.value = ''
  const verdict = synagogueFits(current.value, filled.value, kind, slotId)
  if (verdict !== 'ok') {
    mistakes.value++
    play('wrong')
    flash('bad', synagogueMid(s))
    bounce.value = kind
    later(() => {
      if (bounce.value === kind) bounce.value = null
    }, 600)
    if (verdict === 'needs') say(t(kind === 'roof' ? 'app.adventure.synagogueNeedsRoof' : 'app.adventure.synagogueNeedsBeam'))
    else say(t(verdict === 'full' ? 'app.adventure.synagogueFull' : 'app.adventure.synagogueKind'))
    return
  }
  const next = new Set(filled.value)
  next.add(slotId)
  filled.value = next
  progress.mark()
  play('snap')
  flash('good', synagogueMid(s))
  say(t(helped ? 'app.adventure.synagogueHelped' : 'app.adventure.synagogueRight'), 1800)
  if (synagogueDone(current.value, filled.value)) endRound()
}

function endRound() {
  between.value = true
  cursor.value = -1
  later(() => play('right'), 300)
  if (lastRound.value) {
    say(t('app.adventure.synagogueBuilt'), 0)
    later(() => {
      play('star')
      finished.value = true
    }, 3200)
    return
  }
  say(t('app.adventure.synagogueRoundDone'), 0)
  later(() => say(t('app.adventure.gameNext'), 0), 1400)
  later(() => {
    round.value++
    filled.value = new Set()
    selected.value = null
    between.value = false
    idle.value = 0
    message.value = ''
  }, 2800)
}

// ---- the finger: drag a part, or tap it and then a place
function percentAt(e: { clientX: number; clientY: number }): Pt | null {
  const r = field.value?.getBoundingClientRect()
  if (!r || !r.width || !r.height) return null
  return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }
}
function onMove(e: PointerEvent) {
  if (!drag.kind) return
  drag.x = e.clientX
  drag.y = e.clientY
  drag.moved = Math.max(drag.moved, Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy))
}
function stopDrag(e?: PointerEvent) {
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', stopDrag)
  window.removeEventListener('pointercancel', stopDrag)
  const k = drag.kind
  drag.kind = null
  if (!k || !e || e.type !== 'pointerup') return
  const moved = Math.max(drag.moved, Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy))
  if (moved < TAP_PX) {
    pick(k)
    return
  }
  const p = percentAt(e)
  const slot = p ? synagogueDrop(current.value, filled.value, k, p, props.game.ratio) : null
  if (!slot) {
    say(t('app.adventure.synagogueBack'))
    return
  }
  put(k, slot)
}
function down(e: PointerEvent, k: SynagoguePartKind) {
  if (e.button > 0 || between.value || finished.value) return
  idle.value = 0
  drag.kind = k
  drag.sx = drag.x = e.clientX
  drag.sy = drag.y = e.clientY
  drag.moved = 0
  drag.px = field.value?.getBoundingClientRect().width ?? 300
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', stopDrag)
  window.addEventListener('pointercancel', stopDrag)
}
onBeforeUnmount(() => stopDrag())

function pick(k: SynagoguePartKind) {
  if (between.value || finished.value) return
  idle.value = 0
  selected.value = selected.value === k ? null : k
  if (selected.value) say(t('app.adventure.synagoguePicked', { part: partName(k) }), 3200)
}
/** A button of the strip clicked from the keyboard (a click of the finger is handled by the pointer). */
function partClick(e: MouseEvent, k: SynagoguePartKind) {
  if (e.detail === 0) pick(k)
}
function tapSlot(s: SynagogueSlot) {
  if (between.value || finished.value) return
  if (!selected.value) {
    say(t('app.adventure.synagoguePickFirst'))
    return
  }
  put(selected.value, s.id)
}

function cyclePart(step: number) {
  const list = tray.value
  if (!list.length) return
  const at = selected.value ? list.indexOf(selected.value) : -1
  selected.value = list[at < 0 ? (step > 0 ? 0 : list.length - 1) : (at + step + list.length) % list.length]!
}
function announce(extra = '') {
  const part = selected.value ? partName(selected.value) : ''
  const place = current.value.slots[cursor.value]?.name ?? ''
  if (part && place) say(`${t('app.adventure.synagogueChoice', { part, place })}${extra}`, 0)
  else if (part) say(t('app.adventure.synagoguePicked', { part }), 0)
  else if (place) say(place, 0)
}
function onKey(e: KeyboardEvent) {
  if (between.value || finished.value) return
  const n = current.value.slots.length
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    e.preventDefault()
    idle.value = 0
    cyclePart(e.key === 'ArrowRight' ? 1 : -1)
    announce()
    return
  }
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault()
    idle.value = 0
    const step = e.key === 'ArrowDown' ? 1 : -1
    cursor.value = cursor.value < 0 ? (step > 0 ? 0 : n - 1) : (cursor.value + step + n) % n
    announce()
    return
  }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    idle.value = 0
    if (selected.value && cursor.value >= 0) {
      put(selected.value, current.value.slots[cursor.value]!.id)
      return
    }
    if (!selected.value) cyclePart(1)
    if (cursor.value < 0) cursor.value = 0
    announce(` ${t('app.adventure.synagogueKeys')}`)
    return
  }
  if (e.key === 'Escape') {
    selected.value = null
    cursor.value = -1
    message.value = ''
  }
}

/** The button for those who do not know what comes next: the next part is set. */
function helpMe() {
  const s = synagogueHelp(current.value, filled.value)
  if (!s) return
  helpSlot.value = s.id
  put(s.kind, s.id, true)
}

// ---- looks
const ratio = computed(() => String(props.game.ratio))
const box = (s: SynagogueSlot) => ({ left: `${s.x}%`, top: `${s.y}%`, width: `${s.w}%`, height: `${s.h}%` })
/** The columns stand at the back, the beams lie over their tops, the roof lies over the beams. */
const layer: Record<SynagoguePartKind, number> = { column: 2, beam: 3, roof: 4 }
const armed = computed(() => !!selected.value || !!drag.kind)
const ghostStyle = computed(() => {
  const k = drag.kind
  const s = k ? current.value.slots.find((x) => x.kind === k) : null
  const w = s ? Math.max(44, (s.w / 100) * drag.px) : 60
  const h = s ? Math.max(44, ((s.h / 100) * drag.px) / props.game.ratio) : 60
  return { left: `${drag.x}px`, top: `${drag.y}px`, width: `${w}px`, height: `${h}px` }
})
const markStyle = (p: Pt) => ({ left: `${p.x}%`, top: `${p.y}%` })
/** A place as a button: around the middle of the place, at least 44 pixels each way. */
const slotStyle = (s: SynagogueSlot) => ({ left: `${s.x + s.w / 2}%`, top: `${s.y + s.h / 2}%`, width: `max(44px, ${s.w}%)`, height: `max(44px, ${s.h}%)`, zIndex: layer[s.kind] + 4 })
</script>

<template lang="pug">
  div(class="gs")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gs-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gs-hint") {{ current.hint }}
      div(
        ref="field"
        class="gs-field"
        :style="{ backgroundImage: `url(${src(game.background)})`, aspectRatio: ratio }"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.synagogueField')"
        @keydown="onKey"
      )
        //- the parts that stand
        template(v-for="s in current.slots" :key="`set-${round}-${s.id}`")
          div(v-if="filled.has(s.id)" class="gs-part" :data-set="s.id" :style="{ ...box(s), zIndex: layer[s.kind] }" role="img" :aria-label="s.name")
            GameImage(:src="game.parts[s.kind].image" :ratio="s.w / s.h * game.ratio" colour="#d9c9a3" :label="s.kind")
        //- the places: buttons (a dashed outline in round 1, or while a part is in the hand)
        button(
          v-for="(s, si) in current.slots"
          v-show="!filled.has(s.id)"
          :key="`slot-${round}-${s.id}`"
          type="button"
          class="gs-slot"
          :class="{ shown: current.outline || armed, cursor: cursor === si, help: helpSlot === s.id, [s.kind]: true }"
          :data-slot="s.id"
          :style="slotStyle(s)"
          :aria-label="s.name"
          tabindex="-1"
          @click="tapSlot(s)"
        )
        span(v-if="crossAt" class="gs-mark" :style="markStyle(crossAt)")
          GameMark(kind="bad")
        span(v-if="tickAt" class="gs-mark" :style="markStyle(tickAt)")
          GameMark(kind="good")
      //- the parts that wait
      div(class="gs-tray" role="group" :aria-label="t('app.adventure.synagogueTray')")
        button(
          v-for="k in tray"
          :key="`part-${round}-${k}`"
          type="button"
          class="gs-thing"
          :class="{ sel: selected === k, held: drag.kind === k && drag.moved >= 8, bounce: bounce === k, [k]: true }"
          :data-part="k"
          :aria-label="t('app.adventure.synagogueLeft', { part: partName(k), n: current.slots.filter((s) => s.kind === k && !filled.has(s.id)).length })"
          :aria-pressed="selected === k ? 'true' : 'false'"
          :disabled="between"
          @pointerdown.prevent="down($event, k)"
          @click="partClick($event, k)"
        )
          span(class="gs-pic")
            GameImage(:src="game.parts[k].image" :ratio="1" colour="#d9c9a3" :label="k")
          span(class="gs-badge" aria-hidden="true") {{ current.slots.filter((s) => s.kind === k && !filled.has(s.id)).length }}
      //- the part in the hand
      div(v-if="drag.kind && drag.moved >= 8" class="gs-ghost" :style="ghostStyle" aria-hidden="true")
        GameImage(:src="game.parts[drag.kind].image" :ratio="1" colour="#d9c9a3")
      p(class="gs-count" aria-live="polite") {{ t('app.adventure.synagogueCount', { n: setCount, total }) }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between" tone="gold" @click="helpMe") {{ t('app.adventure.synagogueHelp') }}
      p(class="gs-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.synagogueDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gs
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

.gs-round
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

.gs-hint
  margin: 0
  text-align: center
  font-weight: 700
  font-size: 1rem
  color: #5a4a2c

.gs-field
  position: relative
  width: 100%
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #a9c4d8
  background-size: cover
  background-position: center
  touch-action: none

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

// a part that stands: the picture fills its place (scaled to the place)
.gs-part
  position: absolute
  pointer-events: none
  filter: drop-shadow(0 3px 3px rgba(40, 25, 5, 0.35))

  :deep(.gi), :deep(img), :deep(.gi-stand)
    width: 100%
    height: 100%

// a place: an invisible button of at least 44 pixels; a dashed outline shows it in round 1 or while a part is in the hand
.gs-slot
  position: absolute
  display: block
  padding: 0
  transform: translate(-50%, -50%)
  border: 3px dashed transparent
  border-radius: 8px
  background: transparent
  cursor: pointer

  &.shown
    border-color: rgba(255, 246, 220, 0.95)
    background: rgba(255, 246, 220, 0.18)

  &.cursor
    border-color: #fff6dc
    border-style: solid
    box-shadow: 0 0 0 3px rgba(40, 25, 5, 0.55)

  &.help
    border-color: #fff6dc
    border-style: solid

.gs-mark
  position: absolute
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 12

.gs-tray
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 10px
  min-height: 80px

.gs-thing
  position: relative
  width: 84px
  height: 84px
  padding: 6px
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
    transform: scale(1.08)

  &.held
    opacity: 0.4

  &.bounce
    animation: gs-bounce 500ms ease

.gs-pic
  display: flex
  align-items: center
  justify-content: center
  width: 100%
  height: 100%

  :deep(.gi)
    max-height: 100%

  :deep(img)
    max-height: 66px
    object-fit: contain

.gs-badge
  position: absolute
  right: -8px
  top: -8px
  min-width: 28px
  height: 28px
  padding: 0 6px
  border-radius: 999px
  border: 2px solid #fff
  background: #5a4a2c
  color: #fff
  font-weight: 900
  font-size: 1rem
  line-height: 24px

.gs-ghost
  position: fixed
  display: block
  transform: translate(-50%, -50%)
  pointer-events: none
  z-index: 50
  filter: drop-shadow(0 6px 6px rgba(40, 25, 5, 0.45))

  :deep(.gi), :deep(img)
    width: 100%
    height: 100%

.gs-count
  margin: 0
  align-self: center
  padding: 2px 14px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  color: #5a4a2c

.gs-fb
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

@keyframes gs-bounce
  0%, 100%
    transform: translateY(0)
  30%
    transform: translateY(-8px)
  60%
    transform: translateY(2px)

// less motion: nothing bounces or grows
@media (prefers-reduced-motion: reduce)
  .gs-thing
    transition: none

    &.bounce
      animation: none

    &.sel
      transform: none
</style>
