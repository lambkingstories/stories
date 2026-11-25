<script setup lang="ts">
/**
 * Meeting in the rock (2 Kings 20,20; 2 Chronicles 32,30): the rock seen from above, the spring on the left edge, the pool on the right edge. Two crews start at the two ends, at different heights.
 * In every move the child chooses for each crew the direction of the next piece (up, straight on, down; each turn is 20 degrees and the crew keeps its direction; after "Dig" both choices are back on "straight on") and taps "Dig": both crews dig one piece.
 * Dark rock layers (pictures with slanting grain) push the tunnel aside while it passes through them: down for "ab", up for "auf" (the push comes when digging, not in the preview). A little arrow shows the
 * planned direction. After every piece both crews knock three times (rings at the tips); in round 1 a golden arrow at each tip always points to the other crew, in round 2 only after "Listen". After the last piece
 * the tunnels should meet in the middle: the nearer the tips, the more stars (3 almost exactly, 2 near, 1 just joined); when they miss, "Undo" or "Start again" (no penalty); the last accepted meeting counts.
 * Then the water flows (a picture laid along the tunnel). That two crews dug from both sides is not in the Bible: here it is a rule of the game. "Help me" after fifteen seconds makes the two best direction buttons
 * and "Dig" shine (round 2 also shows the arrows); it costs nothing. Alternative to the buttons: tap a crew, then tap above or below its tip. Keyboard: Tab through the buttons, Enter or Space.
 * Less motion: the knocking and the water appear at once, nothing pulses. Nothing is shown by colour alone. Points (for "Go on"): every piece of a crew counts once in its round.
 * Stars: the two meetings (`meetStars`), `stollenStars`: the sum divided by two, rounded down, at least one.
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
import { meetStars, stollenStars } from '@/utils/hiskiaGames'
import { bestNext, digPiece, tunnelGap, tunnelHeight, tunnelTip, tunnelWalk } from '@/utils/hiskiaNeu'
import type { Pt, TunnelCrew, TunnelGame, TunnelPiece } from '@/utils/hiskiaNeu'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: TunnelGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
const total = props.game.rounds.reduce((n, r) => n + 2 * r.pieces, 0)
progress.setGoal(total)

const IDLE_SECONDS = 15
const still = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const round = ref(0)
const phase = ref<'play' | 'water' | 'between'>('play')
/** The chosen direction of the next piece for each crew: -1 down, 0 straight on, +1 up. */
const pick = ref<{ left: number; right: number }>({ left: 0, right: 0 })
/** The choices of the pieces dug so far. */
const dug = ref<{ left: number[]; right: number[] }>({ left: [], right: [] })
/** How many pieces of the round were counted for "Go on" (the most that was dug, so that "Undo" and digging again never count twice). */
const counted = ref(0)
const meets = ref<number[]>([])
const idle = ref(0)
const helping = ref(false)
const best = ref<{ left: number; right: number } | null>(null)
const listening = ref(false)
const finished = ref(false)
const message = ref('')
const knock = ref(0)
const selCrew = ref<TunnelCrew | null>(null)
const verdict = ref<'good' | 'bad' | null>(null)
const fieldEl = ref<HTMLElement | null>(null)
let messageSeq = 0
let verdictSeq = 0

const src = (p: string) => prependBaseUrl(p)
const ratio = computed(() => props.game.ratio ?? 1.5)
const height = computed(() => tunnelHeight(props.game))
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const stars = computed(() => stollenStars(meets.value[0] ?? 0, meets.value[1] ?? 0))
const left = computed(() => tunnelWalk(current.value, 'left', dug.value.left, height.value))
const right = computed(() => tunnelWalk(current.value, 'right', dug.value.right, height.value))
const tipL = computed<Pt>(() => tunnelTip(current.value, 'left', dug.value.left, height.value))
const tipR = computed<Pt>(() => tunnelTip(current.value, 'right', dug.value.right, height.value))
const tiltOf = (w: TunnelPiece[]) => w[w.length - 1]?.tilt ?? 0
const full = computed(() => dug.value.left.length >= current.value.pieces)
const gap = computed(() => tunnelGap(current.value, dug.value.left, dug.value.right, height.value))
const outcomeNow = computed(() => (full.value ? meetStars(gap.value, props.game.tolerance) : -1))
const countText = computed(() => t('app.adventure.meetRockCount', { n: dug.value.left.length, total: current.value.pieces }))
const showPointers = computed(() => current.value.listen === 'always' || listening.value)
/** The planned direction of each crew: the piece is drawn without the push of a layer (the push comes when digging). */
const plan = computed(() => {
  const open = { ...current.value, bands: [] }
  return {
    left: digPiece(open, 'left', tipL.value, tiltOf(left.value), pick.value.left, height.value),
    right: digPiece(open, 'right', tipR.value, tiltOf(right.value), pick.value.right, height.value)
  }
})
const helpNow = computed(() => (helping.value && phase.value === 'play' && !full.value ? best.value : null))

function say(text: string, ms = 3600) {
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
  if (phase.value === 'play') idle.value++
}
later(tickIdle, 1000)

function choose(crew: TunnelCrew, dir: number) {
  if (phase.value !== 'play' || finished.value) return
  touched()
  pick.value = { ...pick.value, [crew]: dir }
}

function dig() {
  if (phase.value !== 'play' || finished.value || full.value) return
  touched()
  const rd = current.value
  dug.value = { left: [...dug.value.left, pick.value.left], right: [...dug.value.right, pick.value.right] }
  pick.value = { left: 0, right: 0 } // every move starts with "straight on": a turn is chosen anew for each piece
  play('tap')
  knock.value++
  later(() => {
    if (knock.value > 0) knock.value = 0
  }, still ? 400 : 1100)
  const n = dug.value.left.length
  while (counted.value < n) {
    counted.value++
    progress.mark()
    progress.mark()
  }
  if (n < rd.pieces) return
  const g = tunnelGap(rd, dug.value.left, dug.value.right, height.value)
  const s = meetStars(g, props.game.tolerance)
  if (s === 0) {
    play('wrong')
    flash('bad')
    say(t('app.adventure.meetRockMissed'), 0)
    return
  }
  meets.value = Object.assign([...meets.value], { [round.value]: s })
  phase.value = 'water'
  play('right')
  flash('good')
  say(t(s === 3 ? 'app.adventure.meetRockThree' : s === 2 ? 'app.adventure.meetRockTwo' : 'app.adventure.meetRockJoin'), 0)
  later(() => {
    phase.value = 'between'
    later(nextRound, 1500)
  }, still ? 600 : 3200)
}
function flash(kind: 'good' | 'bad') {
  const k = ++verdictSeq
  verdict.value = kind
  later(() => {
    if (verdictSeq === k) verdict.value = null
  }, 1600)
}
function nextRound() {
  if (round.value >= props.game.rounds.length - 1) {
    play('star')
    finished.value = true
    return
  }
  round.value++
  dug.value = { left: [], right: [] }
  pick.value = { left: 0, right: 0 }
  counted.value = 0
  listening.value = false
  selCrew.value = null
  phase.value = 'play'
  say('', 1)
}

function undo() {
  if (phase.value !== 'play' || dug.value.left.length === 0) return
  touched()
  dug.value = { left: dug.value.left.slice(0, -1), right: dug.value.right.slice(0, -1) }
  say('', 1)
}
function again() {
  if (phase.value !== 'play') return
  touched()
  dug.value = { left: [], right: [] }
  pick.value = { left: 0, right: 0 }
  say('', 1)
}
function listen() {
  if (phase.value !== 'play') return
  touched()
  listening.value = true
}
function helpMe() {
  touched()
  if (phase.value !== 'play' || full.value) return
  helping.value = true
  best.value = bestNext(current.value, dug.value.left, dug.value.right, height.value)
  if (current.value.listen === 'button') listening.value = true
  say(t('app.adventure.meetRockHelpGo'), 4200)
}

// ---- the alternative to the buttons: tap a crew, then tap above or below its tip
function crewTap(crew: TunnelCrew) {
  if (phase.value !== 'play') return
  touched()
  selCrew.value = selCrew.value === crew ? null : crew
}
function fieldTap(e: MouseEvent) {
  if (!selCrew.value || phase.value !== 'play' || (e.target as HTMLElement | null)?.closest?.('button')) return
  const r = fieldEl.value?.getBoundingClientRect()
  if (!r || r.height <= 0) return
  const y = ((e.clientY - r.top) / r.height) * height.value // units of the width
  const tip = selCrew.value === 'left' ? tipL.value : tipR.value
  const dir = y < tip.y - 3 ? 1 : y > tip.y + 3 ? -1 : 0
  choose(selCrew.value, dir)
}

// ---- looks (units: percent of the width; a height in percent of the height is units x ratio)
const topPct = (y: number) => y * ratio.value
const springStyle = computed(() => {
  const g = props.game.spring
  return { left: `${g.x - g.w / 2}%`, top: `${topPct(current.value.left.y) - (g.w * ratio.value) / 2}%`, width: `${g.w}%` }
})
const poolStyle = computed(() => {
  const g = props.game.pool
  return { left: `${g.x - g.w / 2}%`, top: `${topPct(current.value.right.y) - (g.w * ratio.value) / 2}%`, width: `${g.w}%` }
})
const bandStyle = (b: { x0: number; x1: number }) => ({ left: `${b.x0}%`, width: `${b.x1 - b.x0}%`, top: '0%', height: '100%' })
/** A stripe from one place to another: a piece of tunnel or of water, stretched and turned. */
function stripe(a: Pt, b: Pt, thick: number) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.hypot(dx, dy) + 0.9
  return {
    left: `${(a.x + b.x) / 2 - len / 2}%`,
    top: `${topPct((a.y + b.y) / 2) - (thick * ratio.value) / 2}%`,
    width: `${len}%`,
    aspectRatio: `${len} / ${thick}`,
    transform: `rotate(${(Math.atan2(dy, dx) * 180) / Math.PI}deg)`
  }
}
const pieces = computed(() => [...left.value, ...right.value].map((p, i) => ({ key: `p${i}`, delay: i, style: stripe(p.from, p.to, props.game.tile.w) })))
const joint = computed(() => (full.value && gap.value > 0.3 && outcomeNow.value > 0 ? stripe(tipL.value, tipR.value, props.game.tile.w) : null))
const waterThick = computed(() => props.game.tile.w * 0.6)
const waters = computed(() => (phase.value === 'water' || phase.value === 'between' ? [...left.value, ...right.value].map((p, i) => ({ key: `w${i}`, delay: i, style: stripe(p.from, p.to, waterThick.value) })) : []))
const waterJoint = computed(() => (joint.value && (phase.value === 'water' || phase.value === 'between') ? stripe(tipL.value, tipR.value, waterThick.value) : null))
const crewStyle = (crew: TunnelCrew) => {
  const tip = crew === 'left' ? tipL.value : tipR.value
  const w = props.game.crews.w
  // the crew stands a little behind and above the tip, so that the piece of tunnel it has just dug can be seen
  const x = tip.x + (crew === 'left' ? -w * 0.3 : w * 0.3)
  const y = Math.max(w / 2, tip.y - w * 0.5)
  return { left: `${x - w / 2}%`, top: `${topPct(y) - (w * ratio.value) / 2}%`, width: `${w}%` }
}
const knockStyle = (tip: Pt) => ({ left: `${tip.x - 5}%`, top: `${topPct(tip.y) - 5 * ratio.value}%`, width: '10%' })
const POINTER_W = 5.4
const pointerAt = (tip: Pt, angle: number, w = POINTER_W) => ({ left: `${tip.x - w / 2}%`, top: `${topPct(tip.y) - (w * ratio.value) / 2}%`, width: `${w}%`, transform: `rotate(${angle}deg)` })
/** The angle of the planned piece (degrees, 0 = to the right, screen turn). */
const planAngle = (crew: TunnelCrew) => (crew === 'left' ? -plan.value.left.tilt : 180 + plan.value.right.tilt)
/** The angle from a tip to the other tip (the knocking). */
const towards = (from: Pt, to: Pt) => (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI
const previewPt = (crew: TunnelCrew) => (crew === 'left' ? plan.value.left.to : plan.value.right.to)
const dirs = [
  { dir: 1, key: 'meetRockUp', glyph: '▲' },
  { dir: 0, key: 'meetRockStraight', glyph: '' },
  { dir: -1, key: 'meetRockDown', glyph: '▼' }
]
const glyphOf = (crew: TunnelCrew, d: { dir: number; glyph: string }) => (d.dir === 0 ? (crew === 'left' ? '►' : '◄') : d.glyph)
const bandLabel = (b: { image: string }) => t(b.image === 'ab' ? 'app.adventure.meetRockLayerDown' : 'app.adventure.meetRockLayerUp')
const crewLabel = (crew: TunnelCrew) => (crew === 'left' ? props.game.crews.labelLeft : props.game.crews.labelRight)
</script>

<template lang="pug">
  div(class="gm" :class="{ still }")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(class="gm-wrap")
        div(
          ref="fieldEl"
          class="gm-field"
          :style="{ backgroundImage: `url(${src(game.background)})`, aspectRatio: String(ratio) }"
          role="group"
          :aria-label="t('app.adventure.meetRockField')"
          @click="fieldTap"
        )
          span(v-for="(b, i) in current.bands" :key="`b${i}`" class="gm-band" :style="bandStyle(b)" role="img" :aria-label="bandLabel(b)")
            GameImage(:src="game.bands[b.image]" :ratio="420 / 1000" colour="#6a6258" :label="`schicht-${b.image}`")
          span(class="gm-spot" :style="springStyle" role="img" :aria-label="game.spring.label")
            GameImage(:src="game.spring.image" :ratio="1" colour="#7ab0c8" label="quelle")
          span(class="gm-spot" :style="poolStyle" role="img" :aria-label="game.pool.label")
            GameImage(:src="game.pool.image" :ratio="1" colour="#7ab0c8" label="teich")
          span(v-for="p in pieces" :key="p.key" class="gm-gang" :style="p.style" aria-hidden="true")
            GameImage(:src="game.tile.gang" :ratio="160 / 90" colour="#3a2f24" label="gang")
          span(v-if="joint" class="gm-gang" :style="joint" aria-hidden="true")
            GameImage(:src="game.tile.gang" :ratio="160 / 90" colour="#3a2f24" label="gang")
          span(v-for="p in waters" :key="p.key" class="gm-water" :class="{ flow: !still }" :style="{ ...p.style, animationDelay: `${p.delay * 220}ms` }" aria-hidden="true")
            GameImage(:src="game.tile.water" :ratio="160 / 60" colour="#5aa0d0" label="wasser")
          span(v-if="waterJoint" class="gm-water" :class="{ flow: !still }" :style="{ ...waterJoint, animationDelay: `${(pieces.length + 1) * 220}ms` }" aria-hidden="true")
            GameImage(:src="game.tile.water" :ratio="160 / 60" colour="#5aa0d0" label="wasser")
          template(v-if="knock > 0 && phase === 'play'")
            span(class="gm-knock" :style="knockStyle(tipL)" aria-hidden="true")
              GameImage(:src="game.knock" :ratio="1" colour="#d8d0b0" round label="klopf")
            span(class="gm-knock" :style="knockStyle(tipR)" aria-hidden="true")
              GameImage(:src="game.knock" :ratio="1" colour="#d8d0b0" round label="klopf")
          template(v-if="showPointers && phase === 'play' && !full")
            span(class="gm-ptr listen" data-listen="left" :style="pointerAt(tipL, towards(tipL, tipR), POINTER_W * 1.15)" role="img" :aria-label="t('app.adventure.meetRockKnock')")
              GameImage(:src="game.pointer" :ratio="1" colour="#e0b040" label="zeiger")
            span(class="gm-ptr listen" data-listen="right" :style="pointerAt(tipR, towards(tipR, tipL), POINTER_W * 1.15)" aria-hidden="true")
              GameImage(:src="game.pointer" :ratio="1" colour="#e0b040" label="zeiger")
          template(v-if="phase === 'play' && !full")
            span(class="gm-ptr plan" data-plan="left" :style="pointerAt(previewPt('left'), planAngle('left'))" role="img" :aria-label="t('app.adventure.meetRockPlan')")
              GameImage(:src="game.pointer" :ratio="1" colour="#f0d070" label="zeiger")
            span(class="gm-ptr plan" data-plan="right" :style="pointerAt(previewPt('right'), planAngle('right'))" aria-hidden="true")
              GameImage(:src="game.pointer" :ratio="1" colour="#f0d070" label="zeiger")
          button(type="button" class="gm-crew" data-crew="left" :class="{ sel: selCrew === 'left' }" :style="crewStyle('left')" :aria-label="crewLabel('left')" :aria-pressed="selCrew === 'left'" :disabled="phase !== 'play'" @click.stop="crewTap('left')")
            GameImage(:src="game.crews.left" :ratio="1" colour="#8aa070" label="trupp-links")
          button(type="button" class="gm-crew" data-crew="right" :class="{ sel: selCrew === 'right' }" :style="crewStyle('right')" :aria-label="crewLabel('right')" :aria-pressed="selCrew === 'right'" :disabled="phase !== 'play'" @click.stop="crewTap('right')")
            GameImage(:src="game.crews.right" :ratio="1" colour="#c0a060" label="trupp-rechts")
          span(v-if="verdict" class="gm-mark" aria-hidden="true")
            GameMark(:kind="verdict")
      div(class="gm-pads")
        div(class="gm-pad" role="group" :aria-label="t('app.adventure.meetRockGroupLeft')")
          button(
            v-for="d in dirs"
            :key="`l${d.dir}`"
            type="button"
            class="gm-dir"
            :class="{ on: pick.left === d.dir, shine: helpNow?.left === d.dir }"
            :data-dir="`left${d.dir}`"
            :aria-label="t(`app.adventure.${d.key}`)"
            :aria-pressed="pick.left === d.dir"
            :disabled="phase !== 'play'"
            @click="choose('left', d.dir)"
          ) {{ glyphOf('left', d) }}
        div(class="gm-pad" role="group" :aria-label="t('app.adventure.meetRockGroupRight')")
          button(
            v-for="d in dirs"
            :key="`r${d.dir}`"
            type="button"
            class="gm-dir"
            :class="{ on: pick.right === d.dir, shine: helpNow?.right === d.dir }"
            :data-dir="`right${d.dir}`"
            :aria-label="t(`app.adventure.${d.key}`)"
            :aria-pressed="pick.right === d.dir"
            :disabled="phase !== 'play'"
            @click="choose('right', d.dir)"
          ) {{ glyphOf('right', d) }}
      p(class="gm-count" aria-live="polite") {{ countText }}
      div(class="gm-actions")
        button(type="button" class="gm-dig" :class="{ shine: !!helpNow }" :disabled="phase !== 'play' || full" @click="dig") {{ t('app.adventure.meetRockDig') }}
        AdvButton(v-if="current.listen === 'button'" tone="blau" small :disabled="phase !== 'play'" @click="listen") {{ t('app.adventure.meetRockListen') }}
      div(class="gm-actions")
        AdvButton(tone="blau" small :disabled="phase !== 'play' || dug.left.length === 0" @click="undo") {{ t('app.adventure.meetRockUndo') }}
        AdvButton(tone="blau" small :disabled="phase !== 'play'" @click="again") {{ t('app.adventure.meetRockAgain') }}
        AdvButton(v-if="idle >= IDLE_SECONDS && phase === 'play'" tone="gold" small @click="helpMe") {{ t('app.adventure.meetRockHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.meetRockDone')" @next="emit('done', stars)")
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

.gm-field
  position: relative
  width: 100%
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #c8c0a8
  background-size: cover
  background-position: center

.gm-band, .gm-spot, .gm-gang, .gm-water, .gm-knock, .gm-ptr, .gm-mark
  position: absolute
  display: block
  pointer-events: none

// stretched pictures: a layer, a piece of tunnel, a piece of water fill their box
.gm-band, .gm-gang, .gm-water
  :deep(.gi), :deep(img), :deep(.gi-stand)
    width: 100%
    height: 100%

  :deep(img)
    object-fit: fill

.gm-gang, .gm-water
  transform-origin: 50% 50%

.gm-water.flow
  animation: gm-flow 600ms ease-out both

.gm-knock
  animation: gm-ring 1000ms ease-out both

.gm-ptr
  transform-origin: 50% 50%

  &.listen
    filter: drop-shadow(0 0 4px rgba(255, 220, 110, 0.95))

  &.plan
    opacity: 0.92

.gm-mark
  top: 8px
  right: 10px

.gm-crew
  position: absolute
  display: block
  box-sizing: border-box
  min-width: 44px
  padding: 0
  border: 0
  border-radius: 12px
  background: transparent
  cursor: pointer
  font-family: inherit

  &:focus-visible
    outline: 3px solid #2f6b8a
    outline-offset: 2px

  &:disabled
    cursor: default

  &.sel
    box-shadow: 0 0 0 3px #d4a83e, 0 0 12px rgba(255, 220, 110, 0.95)
    background: rgba(255, 246, 220, 0.35)

.gm-pads
  display: flex
  justify-content: space-between
  gap: 12px

.gm-pad
  display: flex
  gap: 6px

.gm-dir
  min-width: 46px
  min-height: 46px
  padding: 0 6px
  border: 3px solid #b8892a
  border-radius: 12px
  background: #f4ecd2
  color: #3f321b
  font-family: inherit
  font-weight: 900
  font-size: 1.1rem
  cursor: pointer

  &.on
    background: #d4a83e
    border-color: #7a5a14
    box-shadow: inset 0 0 0 2px #fff6dc

  &:focus-visible
    outline: 3px solid #2f6b8a
    outline-offset: 2px

  &:disabled
    opacity: 0.6
    cursor: default

  &.shine
    box-shadow: 0 0 10px rgba(255, 220, 110, 0.95)
    animation: gm-pulse 1300ms ease-in-out infinite

.gm-actions
  display: flex
  justify-content: center
  align-items: center
  gap: 10px
  flex-wrap: wrap

.gm-dig
  min-width: 140px
  min-height: 56px
  padding: 8px 28px
  border: 3px solid #b8892a
  border-radius: 999px
  background: #d4a83e
  color: #3f321b
  font-family: inherit
  font-weight: 900
  font-size: 1.15rem
  cursor: pointer

  &:focus-visible
    outline: 3px solid #2f6b8a
    outline-offset: 2px

  &:disabled
    opacity: 0.55
    cursor: default

  &.shine
    box-shadow: 0 0 12px rgba(255, 220, 110, 0.95)
    animation: gm-pulse 1300ms ease-in-out infinite

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
  .gm-knock, .gm-water.flow, .gm-dir.shine, .gm-dig.shine
    animation: none

@keyframes gm-pulse
  0%, 100%
    opacity: 0.75
  50%
    opacity: 1

@keyframes gm-flow
  0%
    opacity: 0
  100%
    opacity: 1

@keyframes gm-ring
  0%
    opacity: 0.9
    transform: scale(0.5)
  100%
    opacity: 0
    transform: scale(1.3)

@media (prefers-reduced-motion: reduce)
  .gm-knock, .gm-water.flow, .gm-dir.shine, .gm-dig.shine
    animation: none
</style>
