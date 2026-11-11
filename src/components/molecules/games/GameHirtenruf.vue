<script setup lang="ts">
/**
 * The call of the shepherd (John 10,3-5: "the sheep hear his voice … and the sheep follow him: for they know his voice. And a stranger will they not follow"). A pasture in the morning with
 * haze. The child does not lead any animal; the sheep come by themselves when they hear the right voice. Round 1: the child taps the shepherd on the hill; a soft golden ring grows over the
 * ground from him, and every further tap within two seconds makes it larger (three sizes, then it begins small again). Sheep inside the ring lift their heads and walk to their places
 * beside the shepherd. A call that reaches no sheep is only "too quiet" (no mistake; round 1 cannot go wrong). Round 2: two callers stand in thick fog, dark shapes; in three passes both
 * call, one after the other (the same ring, so that it betrays nothing), and the four sheep in the middle run to ONE of them and away from the other. The child taps the shepherd. Right: the
 * fog lifts, the shepherd and the stranger are shown, a tick, a bright tone and "That is the shepherd. The sheep know his voice." Wrong: a cross, a low tone, "Look which way the sheep run.",
 * a mistake, and the pass is played once more. In the third pass the stranger stands nearer to the sheep than the shepherd; in the second the sheep run hesitantly.
 * "Help me" after fifteen seconds makes the shepherd shine (round 1) or lays a trail of light to where the sheep run (round 2). Keyboard: Tab to the shepherd and Enter (round 1); in round 2
 * Tab or the arrow keys between the two callers and Enter. Less motion: the sheep jump to their places, the rings and the haze stand still. Nothing is shown by colour alone.
 * Stars: `ichbinStars(mistakes)`.
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
import { ichbinStars } from '@/utils/ichbinGames'
import { HERD_CALLS_AT, HERD_FLAT, HERD_HESITATE_MS, HERD_WINDOW_MS, herdFigureSpots, herdHeard, herdNextRing, herdTrialMs } from '@/utils/ichbinNeu'
import type { HerdCallGame, HerdSide, HerdSpot, Pt } from '@/utils/ichbinNeu'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: HerdCallGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.rounds.length)

const IDLE_SECONDS = 15
const SIDES: HerdSide[] = ['left', 'right']
const STEP_MS = 1800
const still = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const round = ref(0)
const between = ref(false)
const finished = ref(false)
const running = ref(false)
const mistakes = ref(0)
const idle = ref(0)
const helping = ref(false)
const message = ref('')
const markAt = ref<(Pt & { kind: 'good' | 'bad' }) | null>(null)
let messageSeq = 0
let markSeq = 0
const ratio = computed(() => props.game.ratio ?? 1.5)
const stars = computed(() => ichbinStars(mistakes.value))
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const mode = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!.mode)
const src = (p: string) => prependBaseUrl(p)

function say(text: string, ms = 3000) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}
function flash(kind: 'good' | 'bad', at: Pt) {
  const id = ++markSeq
  markAt.value = { ...at, kind }
  later(() => {
    if (markSeq === id) markAt.value = null
  }, 1100)
}
/** The idle seconds are counted by a slow tick as long as the game runs. */
function idleTick() {
  if (finished.value) return
  later(idleTick, 1000)
  if (running.value && !between.value) idle.value++
}
later(idleTick, 1000)

// ================================================================ round 1: the growing ring
const fetched = ref<string[]>([]) // the sheep that have heard, in the order of their places
const going = ref<string[]>([]) // those that have started to walk
const arrived = ref<string[]>([])
const ringIdx = ref(-1)
let windowSeq = 0
interface Ring {
  id: number
  x: number
  y: number
  r: number
  grown: boolean
}
const rings = ref<Ring[]>([])
let ringId = 0

function showRing(at: Pt, r: number) {
  const ring: Ring = { id: ++ringId, x: at.x, y: at.y, r, grown: still }
  rings.value.push(ring)
  if (!still)
    later(() => {
      const f = rings.value.find((x) => x.id === ring.id)
      if (f) f.grown = true
    }, 40)
  later(() => {
    rings.value = rings.value.filter((x) => x.id !== ring.id)
  }, still ? 1600 : 1900)
}

function startRound1() {
  fetched.value = []
  going.value = []
  arrived.value = []
  ringIdx.value = -1
  helping.value = false
  idle.value = 0
  running.value = true
  say(t('app.adventure.shepherdCallStart'), 3200)
}

/** The child taps the shepherd. */
function callShepherd() {
  if (!running.value || between.value || finished.value || mode.value !== 'radius') return
  idle.value = 0
  helping.value = false
  const next = herdNextRing(ringIdx.value, props.game.radii.length)
  ringIdx.value = next
  const seq = ++windowSeq
  later(() => {
    if (windowSeq === seq) ringIdx.value = -1
  }, HERD_WINDOW_MS)
  play('tap')
  showRing(props.game.shepherd, props.game.radii[next]!)
  const heard = herdHeard(props.game, next, fetched.value)
  if (!heard.length) {
    say(t('app.adventure.shepherdCallQuiet'), 2600)
    return
  }
  say(t('app.adventure.shepherdCallHear'), 2600)
  heard.forEach((id, i) => {
    fetched.value.push(id)
    const go = still ? 250 : 500 + i * 250
    later(() => going.value.push(id), go)
    later(() => {
      arrived.value.push(id)
      play('bead')
      if (arrived.value.length === props.game.sheep.length) later(allThere, 500)
    }, go + (still ? 100 : STEP_MS))
  })
}
function allThere() {
  if (between.value) return
  running.value = false
  progress.mark()
  play('right')
  flash('good', { x: props.game.shepherd.x, y: props.game.shepherd.y - 12 })
  say(t('app.adventure.shepherdCallAllHere'), 0)
  later(endRound, 2600)
}

const sheep1 = computed(() =>
  props.game.sheep.map((s) => {
    const k = fetched.value.indexOf(s.id)
    const spot: HerdSpot = k >= 0 && going.value.includes(s.id) ? props.game.slots[k]! : s
    return { key: s.id, spot, up: k >= 0 && !arrived.value.includes(s.id), image: k >= 0 && !arrived.value.includes(s.id) ? s.hearing : s.image }
  })
)

// ================================================================ round 2: who calls?
const trial = ref(0)
type Pass = 'calls' | 'run' | 'ask' | 'result'
const pass = ref<Pass>('calls')
const revealed = ref(false)
const flock = ref<HerdSpot[]>([])
const runMs = ref(STEP_MS)
let trialSeq = 0
const trials = computed(() => props.game.rounds[1]?.trials ?? [])
const tr = computed(() => trials.value[Math.min(trial.value, trials.value.length - 1)]!)
const spots = computed(() => herdFigureSpots(props.game, tr.value))
const sideSpot = (side: HerdSide): HerdSpot => (spots.value.shepherdSide === side ? spots.value.shepherd : spots.value.stranger)

function startRound2() {
  trial.value = 0
  helping.value = false
  running.value = true
  say(t('app.adventure.shepherdCallStartWho'), 3600)
  startTrial()
}
function startTrial() {
  const seq = ++trialSeq
  const t0 = tr.value
  const f = herdFigureSpots(props.game, t0)
  const live = (fn: () => void) => () => {
    if (trialSeq === seq) fn()
  }
  pass.value = 'calls'
  revealed.value = false
  helping.value = false
  idle.value = 0
  runMs.value = 0
  flock.value = props.game.flock.map((p) => ({ ...p }))
  const left = f.shepherdSide === 'left' ? f.shepherd : f.stranger
  const right = f.shepherdSide === 'left' ? f.stranger : f.shepherd
  later(
    live(() => {
      play('tap')
      showRing(left, 24)
    }),
    HERD_CALLS_AT[0]
  )
  later(
    live(() => {
      play('tap')
      showRing(right, 24)
    }),
    HERD_CALLS_AT[1]
  )
  const target = props.game.gather[t0.shepherdSide]
  const toward = (k: number): HerdSpot[] => props.game.flock.map((p, i) => ({ ...p, x: p.x + (target[i]!.x - p.x) * k, y: p.y + (target[i]!.y - p.y) * k, w: p.w + (target[i]!.w - p.w) * k }))
  if (t0.hesitant && !still) {
    later(
      live(() => {
        pass.value = 'run'
        runMs.value = 600
        flock.value = toward(0.3)
      }),
      t0.delay
    )
    later(
      live(() => {
        runMs.value = STEP_MS
        flock.value = toward(1)
      }),
      t0.delay + HERD_HESITATE_MS + 200
    )
  } else {
    later(
      live(() => {
        pass.value = 'run'
        runMs.value = still ? 0 : STEP_MS
        flock.value = toward(1)
      }),
      t0.delay
    )
  }
  later(
    live(() => {
      pass.value = 'ask'
      idle.value = 0
      say(t('app.adventure.shepherdCallAsk'), 0)
    }),
    herdTrialMs(t0) + (still ? 0 : 300)
  )
}

/** The child taps one of the two callers. */
function tapFigure(side: HerdSide) {
  if (pass.value !== 'ask' || between.value || finished.value) return
  idle.value = 0
  const at = sideSpot(side)
  if (side === tr.value.shepherdSide) {
    pass.value = 'result'
    revealed.value = true
    helping.value = false
    if (trial.value + 1 >= trials.value.length) progress.mark()
    play('right')
    flash('good', { x: at.x, y: at.y - 24 })
    say(t('app.adventure.shepherdCallRight'), 0)
    later(nextTrial, 3200)
    return
  }
  mistakes.value++
  pass.value = 'result'
  play('wrong')
  flash('bad', { x: at.x, y: at.y - 24 })
  say(t('app.adventure.shepherdCallWrong'), 0)
  later(() => {
    message.value = ''
    startTrial()
  }, 2600)
}
function nextTrial() {
  message.value = ''
  if (trial.value + 1 < trials.value.length) {
    trial.value++
    startTrial()
    return
  }
  trialSeq++
  running.value = false
  endRound()
}

const sheep2 = computed(() =>
  flock.value.map((p, i) => {
    const s = props.game.sheep[i]!
    return { key: s.id, spot: p, up: false, image: s.image }
  })
)
const sheepView = computed(() => (mode.value === 'radius' ? sheep1.value : sheep2.value))

// ================================================================ rounds
function endRound() {
  between.value = true
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 1400)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 600)
  later(() => {
    round.value++
    between.value = false
    message.value = ''
    startRound2()
  }, 2200)
}
later(startRound1, 600)

/** "Help me": round 1 the shepherd shines, round 2 a trail of light leads to where the sheep run. */
function helpMe() {
  idle.value = 0
  if (between.value) return
  helping.value = true
  say(t(mode.value === 'radius' ? 'app.adventure.shepherdCallHelpRing' : 'app.adventure.shepherdCallHelpWho'), 4200)
}

// ---- the keyboard: the arrow keys move between the two callers of round 2
function onFieldKey(e: KeyboardEvent) {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
  const box = e.currentTarget as HTMLElement | null
  if (!box) return
  const all = Array.from(box.querySelectorAll<HTMLElement>('button.gm-fig')).sort((a, b) => Number(a.dataset.x) - Number(b.dataset.x))
  if (all.length < 2) return
  e.preventDefault()
  const at = all.indexOf(document.activeElement as HTMLElement)
  const next = all[e.key === 'ArrowRight' ? Math.min(all.length - 1, at + 1) : Math.max(0, at < 0 ? 0 : at - 1)]
  next?.focus()
}

// ---- looks
const pct = (v: number) => `${v.toFixed(2)}%`
const sheepStyle = (s: { spot: HerdSpot }) => ({
  left: pct(s.spot.x),
  top: pct(s.spot.y),
  width: pct(s.spot.w),
  zIndex: Math.round(s.spot.y * 10),
  transitionDuration: still ? '0ms' : `${runMs.value}ms`,
  transform: 'translate(-50%, -100%)'
})
const ringStyle = (r: Ring) => ({
  left: pct(r.x),
  top: pct(r.y),
  width: pct(r.grown ? r.r * 2 : 0),
  zIndex: Math.round(r.y * 10) + 1,
  transform: `translate(-50%, -50%) scaleY(${HERD_FLAT})`,
  opacity: still ? '0.9' : r.grown ? '0' : '0.95'
})
const figureStyle = (sp: HerdSpot, z: number) => ({ left: pct(sp.x), top: pct(sp.y), width: pct(sp.w), zIndex: z, transform: 'translate(-50%, -100%)' })
const figureH = (sp: HerdSpot) => (sp.w / props.game.figureRatio) * ratio.value
const buttonStyle = (sp: HerdSpot) => ({ left: pct(sp.x), top: pct(sp.y), width: pct(sp.w), height: pct(figureH(sp)), minWidth: '56px', minHeight: '56px', zIndex: 2000, transform: 'translate(-50%, -100%)' })
const fogStyle = (i: number) => ({ top: pct(props.game.fogTop[i]!), opacity: String(revealed.value ? 0 : mode.value === 'who' ? 0.96 : 0.55) })
/** The trail of light that "Help me" lays in round 2: small rings from the flock to where the sheep run. */
const trail = computed(() => {
  if (!(helping.value && mode.value === 'who' && (pass.value === 'ask' || pass.value === 'run' || pass.value === 'calls'))) return []
  const target = props.game.gather[tr.value.shepherdSide]
  const c = flock.value.length ? flock.value.reduce((s, p) => s + p.x, 0) / flock.value.length : 50
  const y = props.game.flock.reduce((s, p) => s + p.y, 0) / Math.max(1, props.game.flock.length)
  const tx = target.reduce((s, p) => s + p.x, 0) / Math.max(1, target.length)
  return [0.25, 0.5, 0.75].map((k, i) => ({ id: i, x: c + (tx - c) * k, y: y - 2 }))
})
const countText = computed(() =>
  mode.value === 'radius'
    ? t('app.adventure.shepherdCallCountSheep', { n: arrived.value.length, total: props.game.sheep.length })
    : t('app.adventure.shepherdCallCountPass', { n: Math.min(trial.value + 1, trials.value.length), total: trials.value.length })
)
const showHelp = computed(() => idle.value > IDLE_SECONDS && running.value && !between.value && !(mode.value === 'who' && pass.value === 'result'))
const figLabel = (side: HerdSide) => t(side === 'left' ? 'app.adventure.shepherdCallFigureLeft' : 'app.adventure.shepherdCallFigureRight')
</script>

<template lang="pug">
  div(class="gm" :class="{ still }")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ game.rounds[round]?.hint }}
      div(
        class="gm-field"
        :style="{ backgroundImage: `url(${src(game.background)})`, aspectRatio: String(ratio) }"
        role="group"
        :aria-label="t('app.adventure.shepherdCallField')"
        @keydown="onFieldKey"
      )
        span(v-for="(f, i) in game.fog" :key="`fog-${i}`" class="gm-fog" :class="[`f${i + 1}`]" :style="fogStyle(i)" aria-hidden="true")
          GameImage(:src="f" :ratio="3" colour="rgba(255,255,255,0.4)" :label="`nebel-${i + 1}`")
        span(v-for="r in rings" :key="r.id" class="gm-ring" :style="ringStyle(r)" aria-hidden="true")
          GameImage(:src="game.ring" :ratio="1" colour="#f2c46a" round label="ring")
        span(
          v-for="s in sheepView"
          :key="s.key"
          class="gm-sheep"
          :class="{ up: s.up }"
          :data-sheep="s.key"
          :style="sheepStyle(s)"
          aria-hidden="true"
        )
          GameImage(:src="s.image" :ratio="game.sheepRatio" colour="#efe6d0" :label="s.key")
        span(v-for="p in trail" :key="`tr-${p.id}`" class="gm-trail" :style="{ left: pct(p.x), top: pct(p.y), width: '7%', zIndex: 1500 }" aria-hidden="true")
          GameImage(:src="game.ring" :ratio="1" colour="#f2c46a" round label="spur")
        template(v-if="mode === 'radius'")
          span(class="gm-man" :class="{ shine: helping }" :style="figureStyle(game.shepherd, 650)" aria-hidden="true")
            GameImage(:src="game.shepherd.image" :ratio="game.figureRatio" colour="#8a6a3a" label="hirte")
          button(
            type="button"
            class="gm-fig"
            data-figure="shepherd"
            :data-x="game.shepherd.x"
            :style="buttonStyle(game.shepherd)"
            :disabled="!running || between"
            :aria-label="t('app.adventure.shepherdCallShepherd')"
            @click="callShepherd"
          )
        template(v-else)
          template(v-for="side in SIDES" :key="`fg-${side}`")
            span(
              class="gm-man"
              :class="{ dark: !revealed }"
              :data-side="side"
              :style="figureStyle(sideSpot(side), revealed ? 650 : 300)"
              aria-hidden="true"
            )
              GameImage(
                :src="revealed && side !== tr.shepherdSide ? game.stranger.image : game.shepherd.image"
                :ratio="game.figureRatio"
                colour="#6a5a45"
                :label="revealed && side !== tr.shepherdSide ? 'fremder' : 'hirte'"
              )
            button(
              type="button"
              class="gm-fig"
              :data-figure="side"
              :data-x="sideSpot(side).x"
              :style="buttonStyle(sideSpot(side))"
              :disabled="pass !== 'ask' || between"
              :aria-label="figLabel(side)"
              @click="tapFigure(side)"
            )
        span(v-if="markAt" class="gm-mark" :style="{ left: pct(markAt.x), top: pct(markAt.y) }")
          GameMark(:kind="markAt.kind")
      p(class="gm-count" aria-live="polite") {{ countText }}
      AdvButton(v-if="showHelp" tone="gold" @click="helpMe") {{ t('app.adventure.shepherdCallHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.shepherdCallDone')" @next="emit('done', stars)")
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
  background-color: #b9c79a
  background-size: cover
  background-position: center

// the bands of haze drift slowly sideways; in round 2 they are thick, and they lift when the shepherd is found
.gm-fog
  position: absolute
  left: -10%
  width: 120%
  display: block
  pointer-events: none
  z-index: 600
  transition: opacity 1600ms ease
  animation: gm-drift 18s ease-in-out infinite alternate

  &.f2
    animation-duration: 25s
    animation-direction: alternate-reverse

.gm-ring
  position: absolute
  display: block
  aspect-ratio: 1 / 1
  pointer-events: none
  transition: width 900ms ease-out, opacity 1500ms ease-in 300ms

.gm-sheep
  position: absolute
  display: block
  pointer-events: none
  transition-property: left, top, width
  transition-timing-function: ease-in-out

  &.up
    filter: drop-shadow(0 0 4px rgba(255, 220, 120, 0.9))

.gm-trail
  position: absolute
  display: block
  aspect-ratio: 1 / 1
  transform: translate(-50%, -50%) scaleY(0.45)
  pointer-events: none
  animation: gm-pulse 1300ms ease-in-out infinite

.gm-man
  position: absolute
  display: block
  pointer-events: none

  &.dark :deep(.gi)
    filter: brightness(0.12) blur(1.5px)

  &.shine :deep(.gi)
    filter: drop-shadow(0 0 8px rgba(255, 220, 120, 1))
    animation: gm-pulse 1300ms ease-in-out infinite

// the finger target of a caller: a button over the figure, at least 56 x 56 pixels
.gm-fig
  position: absolute
  display: block
  box-sizing: border-box
  padding: 0
  border: 0
  background: transparent
  cursor: pointer

  &:disabled
    cursor: default

  &:focus-visible
    outline: 3px solid #2f6b8a
    outline-offset: 2px
    border-radius: 8px

.gm-mark
  position: absolute
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 2500

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

@keyframes gm-drift
  from
    transform: translateX(-4%)
  to
    transform: translateX(4%)

@keyframes gm-pulse
  0%, 100%
    opacity: 0.65
  50%
    opacity: 1

@media (prefers-reduced-motion: reduce)
  .gm-fog
    animation: none
    transition: none

  .gm-ring
    transition: none

  .gm-man.shine :deep(.gi)
    animation: none

  .gm-trail
    animation: none
</style>
