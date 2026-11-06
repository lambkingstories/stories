<script setup lang="ts">
/**
 * A place for two (Acts 23,19: the captain "took him by the hand and went aside"). The yard of the barracks seen from above, some quiet soldiers, around each a ring of hearing. The child
 * pulls the captain with the young man across the yard (or uses the arrow keys and Enter) and lets go where nobody hears. Outside all rings: the two talk, a tick, the round is done.
 * Inside a ring: the soldier lifts his head, a cross and "Someone is listening there", the two walk back to the gate, a mistake. Pillars and the fountain are in the way: the pair cannot be
 * put down on them (no mistake). Round 1: three soldiers, rings always visible, two big free places; round 2: five soldiers, bigger rings that show only when the pair comes near (one and
 * a half times the radius), one small free place. "Help me" after fifteen seconds lets the free place shimmer. Stars: `osterStars(mistakes)`.
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
import { prDist, quietBestSpot, quietBlockedAt, quietHeardBy } from '@/utils/paulusromNeuA'
import type { PrPt, QuietSpotGame } from '@/utils/paulusromNeuA'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: QuietSpotGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.rounds.length)

const IDLE_SECONDS = 15
const KEY_STEP = 3

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const ratio = computed(() => props.game.ratio ?? 4 / 3)
const pos = reactive<PrPt>({ x: 0, y: 0 })
const lifted = reactive<PrPt>({ x: 0, y: 0 })
const dragging = ref(false)
const talking = ref(false)
const back = ref(false)
const wobble = ref(-1)
const helpSpot = ref<PrPt | null>(null)
const mistakes = ref(0)
const idle = ref(0)
const between = ref(false)
const finished = ref(false)
const crossAt = ref<PrPt | null>(null)
const tickAt = ref<PrPt | null>(null)
const message = ref('')
const done = ref(0)
let messageSeq = 0
let markSeq = 0
const field = ref<HTMLElement | null>(null)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => osterStars(mistakes.value))

function startRound() {
  pos.x = current.value.start.x
  pos.y = current.value.start.y
  talking.value = false
  back.value = false
  helpSpot.value = null
}
startRound()

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
  if (!between.value && !finished.value && !dragging.value) idle.value += 0.25
  later(idleLoop, 250)
}
later(idleLoop, 250)

/** The pair is put down at `pos`. */
function drop() {
  if (between.value || finished.value) return
  idle.value = 0
  helpSpot.value = null
  const p = { x: pos.x, y: pos.y }
  const pairR = props.game.pairR
  if (quietBlockedAt(current.value, p, pairR, ratio.value)) {
    pos.x = lifted.x
    pos.y = lifted.y
    say(t('app.adventure.quietSpotBlocked'))
    return
  }
  const heard = quietHeardBy(current.value, p, pairR, ratio.value)
  if (heard >= 0) {
    mistakes.value++
    play('wrong')
    flash('bad', p)
    wobble.value = heard
    say(t('app.adventure.quietSpotHeard'))
    later(() => {
      if (wobble.value === heard) wobble.value = -1
    }, 700)
    back.value = true
    later(() => {
      pos.x = current.value.start.x
      pos.y = current.value.start.y
      back.value = false
    }, 800)
    return
  }
  talking.value = true
  done.value++
  progress.mark()
  play('found')
  flash('good', p)
  endRound()
}

function endRound() {
  between.value = true
  later(() => play('right'), 300)
  say(`${t('app.adventure.quietSpotRight')} ${t('app.adventure.quietSpotRoundDone')}`, 0)
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
    startRound()
    between.value = false
    idle.value = 0
    message.value = ''
  }, 2800)
}

// ---- the finger
function percentAt(e: { clientX: number; clientY: number }): PrPt | null {
  const r = field.value?.getBoundingClientRect()
  if (!r || !r.width || !r.height) return null
  const pc = (v: number) => Math.round(Math.max(0, Math.min(100, v)) * 100) / 100
  return { x: pc(((e.clientX - r.left) / r.width) * 100), y: pc(((e.clientY - r.top) / r.height) * 100) }
}
function onMove(e: PointerEvent) {
  if (!dragging.value) return
  const p = percentAt(e)
  if (p) {
    pos.x = p.x
    pos.y = p.y
  }
}
function unlisten() {
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', stopDrag)
  window.removeEventListener('pointercancel', stopDrag)
}
function stopDrag(e?: PointerEvent) {
  unlisten()
  if (!dragging.value) return
  dragging.value = false
  if (e && e.type === 'pointerup') {
    const p = percentAt(e)
    if (p) {
      pos.x = p.x
      pos.y = p.y
    }
    drop()
  } else {
    pos.x = lifted.x
    pos.y = lifted.y
  }
}
function down(e: PointerEvent) {
  if (e.button > 0 || between.value || finished.value || back.value) return
  idle.value = 0
  helpSpot.value = null
  dragging.value = true
  lifted.x = pos.x
  lifted.y = pos.y
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', stopDrag)
  window.addEventListener('pointercancel', stopDrag)
}
onBeforeUnmount(() => unlisten())

// ---- the keyboard
function onKey(e: KeyboardEvent) {
  if (between.value || finished.value || back.value) return
  const k = e.key
  const d: Record<string, PrPt> = { ArrowLeft: { x: -KEY_STEP, y: 0 }, ArrowRight: { x: KEY_STEP, y: 0 }, ArrowUp: { x: 0, y: -KEY_STEP }, ArrowDown: { x: 0, y: KEY_STEP } }
  const m = d[k]
  if (m) {
    e.preventDefault()
    idle.value = 0
    helpSpot.value = null
    pos.x = Math.max(0, Math.min(100, pos.x + m.x))
    pos.y = Math.max(0, Math.min(100, pos.y + m.y))
    return
  }
  if (k === 'Enter' || k === ' ') {
    e.preventDefault()
    lifted.x = current.value.start.x
    lifted.y = current.value.start.y
    drop()
  }
}

/** "Help me": the quiet place shimmers. */
function helpMe() {
  idle.value = 0
  const best = quietBestSpot(current.value, props.game.pairR, ratio.value)
  helpSpot.value = best ? best.p : null
  say(t('app.adventure.quietSpotHelpSay'), 4000)
}

// ---- looks
const soldierStyle = (s: { x: number; y: number }) => ({ left: `${s.x}%`, top: `${s.y}%`, width: `${props.game.soldierW}%` })
const ringStyle = (s: { x: number; y: number; r: number }) => ({ left: `${s.x}%`, top: `${s.y}%`, width: `${s.r * 2}%` })
const ringShown = (s: { x: number; y: number; r: number }) =>
  current.value.showRings === 'always' || prDist(pos, s, ratio.value) < s.r * 1.5
const pairStyle = computed(() => ({ left: `${pos.x}%`, top: `${pos.y}%`, width: `${props.game.pairW}%` }))
const markStyle = (p: PrPt) => ({ left: `${p.x}%`, top: `${p.y}%` })
const helpStyle = computed(() => (helpSpot.value ? { left: `${helpSpot.value.x}%`, top: `${helpSpot.value.y}%`, width: `${props.game.pairR * 2.4}%` } : {}))
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        ref="field"
        class="gm-field"
        :style="{ backgroundImage: `url(${src(game.yard)})`, aspectRatio: String(ratio) }"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.quietSpotField')"
        :aria-description="t('app.adventure.quietSpotKeys')"
        @keydown="onKey"
      )
        span(v-if="helpSpot" class="gm-spot" data-spot :style="helpStyle" aria-hidden="true")
        template(v-for="(s, si) in current.soldiers" :key="`soldier-${round}-${si}`")
          span(v-if="ringShown(s)" class="gm-ring" :data-ring="si" :style="ringStyle(s)" aria-hidden="true")
            GameImage(:src="game.ring" :ratio="1" round colour="rgba(255,246,220,0.35)" label="hoerkreis")
          span(class="gm-soldier" :class="{ wobble: wobble === si }" :data-soldier="si" :style="soldierStyle(s)" aria-hidden="true")
            GameImage(:src="game.soldiers[s.sprite - 1] ?? ''" :ratio="0.846" colour="#9aa0a6" label="soldat")
        button(
          type="button"
          class="gm-pair"
          :class="{ held: dragging, back, talking }"
          data-pair
          :style="pairStyle"
          :aria-label="t('app.adventure.quietSpotPair')"
          :disabled="between"
          @pointerdown.prevent="down($event)"
        )
          GameImage(:src="talking ? game.pairTalk : game.pair" :ratio="0.867" colour="#c9b48a" :label="talking ? 'paar-reden' : 'paar'")
        span(v-if="talking" class="gm-bubble" :style="{ left: `${pos.x}%`, top: `${pos.y}%` }" aria-hidden="true") …
        span(v-if="crossAt" class="gm-mark" :style="markStyle(crossAt)")
          GameMark(kind="bad")
        span(v-if="tickAt" class="gm-mark" :style="markStyle(tickAt)")
          GameMark(kind="good")
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.quietSpotCount', { n: done, total: game.rounds.length }) }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between" tone="gold" @click="helpMe") {{ t('app.adventure.quietSpotHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.quietSpotDone')" @next="emit('done', stars)")
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

.gm-ring
  position: absolute
  display: block
  aspect-ratio: 1 / 1
  transform: translate(-50%, -50%)
  pointer-events: none
  opacity: 0.85
  z-index: 1

.gm-soldier
  position: absolute
  display: block
  transform: translate(-50%, -50%)
  pointer-events: none
  z-index: 2
  filter: drop-shadow(0 3px 4px rgba(40, 25, 5, 0.45))

  &.wobble
    animation: gm-wobble 600ms ease

.gm-spot
  position: absolute
  display: block
  aspect-ratio: 1 / 1
  transform: translate(-50%, -50%)
  border-radius: 50%
  border: 3px dashed #fff6dc
  background: rgba(255, 246, 220, 0.3)
  box-shadow: 0 0 16px 5px rgba(255, 233, 160, 0.9)
  pointer-events: none
  z-index: 2
  animation: gm-glow 1400ms ease-in-out infinite

.gm-pair
  position: absolute
  display: block
  min-width: 44px
  min-height: 44px
  padding: 0
  transform: translate(-50%, -50%)
  border: 0
  background: transparent
  cursor: grab
  touch-action: none
  z-index: 4
  filter: drop-shadow(0 4px 5px rgba(40, 25, 5, 0.5))
  transition: left 700ms ease, top 700ms ease

  &.held
    cursor: grabbing
    transition: none
    filter: drop-shadow(0 8px 8px rgba(40, 25, 5, 0.5))

.gm-bubble
  position: absolute
  transform: translate(10%, -150%)
  padding: 0 10px
  border-radius: 12px
  border: 2px solid #5f4f35
  background: #fff6dc
  font-weight: 900
  font-size: 1.1rem
  letter-spacing: 0.1em
  color: #3f321b
  z-index: 5
  pointer-events: none

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

@keyframes gm-wobble
  0%, 100%
    transform: translate(-50%, -50%)
  30%
    transform: translate(-50%, -58%)
  60%
    transform: translate(-50%, -48%)

@keyframes gm-glow
  0%, 100%
    opacity: 0.6
  50%
    opacity: 1

@media (prefers-reduced-motion: reduce)
  .gm-pair
    transition: none

  .gm-soldier.wobble, .gm-spot
    animation: none
</style>
