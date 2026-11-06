<script setup lang="ts">
/**
 * All join in (Rev 5,13: "every creature which is in heaven, and on the earth, and under the earth, and such as are in the sea ... heard I saying, Blessing, and honour, and glory, and power, be unto him
 * that sitteth upon the throne, and unto the Lamb"). A wide painted world without people in the middle: heaven with birds above, the earth with herds and a village in the middle, the sea with fish
 * below; at the top only a rainbow and light, and the little white lamb. Three big areas lie over it. Round 1: the child calls the groups to praise in the order of the verse (heaven, earth, sea);
 * a group that is called lifts its head and sings (a second picture fades in, golden arcs of sound rise); out of order: a cross and "Listen again: John hears first ...", a mistake; a group that already
 * sings is no mistake. Round 2: all sing, but every group slowly gets quieter (its arcs shrink and pale, with its percent in words); a tap lets it sing in full again. When a group is quite silent: a cross and
 * "The sea has fallen silent", a mistake, it joins in again by itself after two seconds; the song must last twenty seconds with nobody silent (a bar and a percent show the time). Loudness never counts, only
 * what can be seen. "Help me" after fifteen seconds: round 1 the next group glows, round 2 the quietest. Keyboard: Tab to a group, Enter; arrow keys between them. Stars: `osterStars(mistakes)`.
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
import { osterStars } from '@/utils/osternGames'
import { praiseQuietest, praiseTap, praiseVolume } from '@/utils/offenbarungNeuA'
import type { Pt, PraiseGame, PraiseZone } from '@/utils/offenbarungNeuA'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: PraiseGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
const QUARTERS = 4
progress.setGoal(props.game.order.length + QUARTERS)

const TICK_MS = 50
const IDLE_SECONDS = 15
const still = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const round = ref(0)
const ratio = computed(() => props.game.ratio ?? 1.5)
const zones = computed<PraiseZone[]>(() => props.game.zones)
const zoneOf = (id: string) => props.game.zones.find((z) => z.id === id)!
/** Round 1: the groups that sing already. */
const sung = ref<string[]>([])
/** Round 2: milliseconds since each group was called, how long each is still silent, and how long all sang together. */
const since = ref<number[]>(props.game.zones.map(() => 0))
const quiet = ref<number[]>(props.game.zones.map(() => 0))
const together = ref(0)
let credited = 0
const mistakes = ref(0)
const idle = ref(0)
const helpZone = ref<string | null>(null)
const between = ref(false)
const finished = ref(false)
const tickAt = ref<Pt | null>(null)
const crossAt = ref<Pt | null>(null)
const message = ref('')
let messageSeq = 0
let markSeq = 0
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => osterStars(mistakes.value))
const hint = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]?.hint ?? '')
const nextId = computed(() => props.game.order[sung.value.length] ?? null)

/** How loud group `i` sings now (0 to 1). */
const volume = (i: number): number => {
  const z = zones.value[i]!
  if (round.value === 0) return sung.value.includes(z.id) ? 1 : 0
  return quiet.value[i]! > 0 ? 0 : praiseVolume(z, since.value[i]!)
}
const volumes = computed(() => zones.value.map((_, i) => volume(i)))
const share = computed(() => Math.min(1, together.value / props.game.duration))
const pct = computed(() => Math.round(share.value * 100))

function say(text: string, ms = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}
function centre(z: PraiseZone): Pt {
  return { x: (z.box.left + z.box.right) / 2, y: (z.box.top + z.box.bottom) / 2 }
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

function step() {
  if (finished.value) return
  later(step, TICK_MS)
  if (between.value) return
  idle.value += TICK_MS / 1000
  if (round.value !== 1) return
  const dt = TICK_MS
  let anySilent = false
  zones.value.forEach((z, i) => {
    if (quiet.value[i]! > 0) {
      anySilent = true
      quiet.value[i] = Math.max(0, quiet.value[i]! - dt)
      if (quiet.value[i] === 0) {
        since.value[i] = Math.max(0, z.fade * 0.4 - z.offset)
        say(t('app.adventure.praiseBack', { name: z.name }), 2200)
      }
      return
    }
    since.value[i] = since.value[i]! + dt
    if (praiseVolume(z, since.value[i]!) <= 0) {
      anySilent = true
      quiet.value[i] = props.game.silent
      mistakes.value++
      play('wrong')
      flash('bad', centre(z))
      say(t('app.adventure.praiseSilent', { name: z.name }), 3000)
    }
  })
  if (anySilent) return
  together.value += dt
  const q = Math.min(QUARTERS, Math.floor(share.value * QUARTERS))
  while (credited < q) {
    progress.mark()
    credited++
  }
  if (together.value >= props.game.duration) endRound()
}
later(step, TICK_MS)

/** A group is called. */
function call(i: number) {
  const z = zones.value[i]
  if (!z || between.value || finished.value) return
  idle.value = 0
  helpZone.value = null
  if (round.value === 0) {
    const r = praiseTap(props.game.order, sung.value, z.id)
    if (r === 'again') {
      say(t('app.adventure.praiseAlready', { name: z.name }), 1800)
      return
    }
    if (r === 'wrong') {
      mistakes.value++
      play('wrong')
      flash('bad', centre(z))
      say(t('app.adventure.praiseWrong', { place: nextId.value ? zoneOf(nextId.value).place : '' }), 3200)
      return
    }
    sung.value.push(z.id)
    progress.mark()
    play('found')
    flash('good', centre(z))
    say(t('app.adventure.praiseSings', { name: z.name }), 2000)
    if (sung.value.length >= props.game.order.length) endRound()
    return
  }
  // round 2: the group sings in full again, also when it was silent
  since.value[i] = 0
  quiet.value[i] = 0
  play('tap')
  flash('good', centre(z))
}

function endRound() {
  between.value = true
  helpZone.value = null
  later(() => play('right'), 300)
  if (round.value === 0) {
    say(t('app.adventure.praiseRoundDone'), 0)
    later(() => say(t('app.adventure.gameNext'), 0), 1300)
    later(() => {
      round.value = 1
      since.value = zones.value.map(() => 0)
      quiet.value = zones.value.map(() => 0)
      together.value = 0
      credited = 0
      between.value = false
      idle.value = 0
      message.value = ''
    }, 2800)
    return
  }
  say(t('app.adventure.praiseAmen'), 0)
  later(() => {
    play('star')
    finished.value = true
  }, 2600)
}

// ---- the keyboard: arrow keys move between the groups
function onKey(e: KeyboardEvent) {
  if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return
  const box = e.currentTarget as HTMLElement | null
  if (!box) return
  e.preventDefault()
  const all = Array.from(box.querySelectorAll<HTMLElement>('button'))
  if (!all.length) return
  const at = all.indexOf(document.activeElement as HTMLElement)
  const fwd = e.key === 'ArrowDown' || e.key === 'ArrowRight'
  all[(at < 0 ? 0 : at + (fwd ? 1 : -1) + all.length) % all.length]?.focus()
}

/** "Help me": round 1 the next group glows, round 2 the quietest. */
function helpMe() {
  idle.value = 0
  if (round.value === 0) {
    helpZone.value = nextId.value
    say(t('app.adventure.praiseHelpOne', { name: nextId.value ? zoneOf(nextId.value).name : '' }), 4000)
    return
  }
  const q = praiseQuietest(volumes.value)
  helpZone.value = zones.value[q]!.id
  say(t('app.adventure.praiseHelpTwo', { name: zones.value[q]!.name }), 4000)
}

// ---- looks
const zoneStyle = (z: PraiseZone) => ({ left: `${z.box.left}%`, top: `${z.box.top}%`, width: `${z.box.right - z.box.left}%`, height: `${z.box.bottom - z.box.top}%` })
const stripStyle = (z: PraiseZone) => ({ top: `${z.box.top}%` })
const waveStyle = (z: PraiseZone, i: number) => {
  const c = centre(z)
  const v = volume(i)
  return { left: `${c.x}%`, top: `${c.y}%`, width: `${22 * Math.max(0.3, v)}%`, opacity: v > 0 ? 0.35 + 0.65 * v : 0 }
}
const lambStyle = computed(() => ({ left: `${props.game.lambAt.x}%`, top: `${props.game.lambAt.y}%`, width: `${props.game.lambAt.w}%` }))
const markStyle = (p: Pt) => ({ left: `${p.x}%`, top: `${p.y}%` })
const level = (i: number) => Math.round(volume(i) * 100)
const labelOf = (z: PraiseZone, i: number) => (round.value === 1 ? `${z.name} ${level(i)} %` : z.name)
const isLow = (i: number) => round.value === 1 && volume(i) < 0.4
</script>

<template lang="pug">
  div(class="gm" :class="{ still }")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ hint }}
      div(
        class="gm-field"
        :style="{ backgroundImage: `url(${src(game.world)})`, aspectRatio: String(ratio) }"
        role="group"
        :aria-label="t('app.adventure.praiseField')"
        @keydown="onKey"
      )
        span(v-for="z in zones" :key="`still-${z.id}`" class="gm-strip" :style="stripStyle(z)" aria-hidden="true")
          GameImage(:src="z.still" :ratio="6" colour="transparent" :label="`${z.id}-still`")
        span(v-for="(z, i) in zones" :key="`sing-${z.id}`" class="gm-strip sing" :data-sing="z.id" :style="{ ...stripStyle(z), opacity: volume(i) }" aria-hidden="true")
          GameImage(:src="z.sing" :ratio="6" colour="transparent" :label="`${z.id}-lob`")
        span(class="gm-lamb" :style="lambStyle" aria-hidden="true")
          GameImage(:src="game.lamb" :ratio="1" colour="#f4f0e4" label="lamm")
        span(v-for="(z, i) in zones" :key="`wave-${z.id}`" class="gm-wave" :class="{ low: isLow(i) }" :data-wave="z.id" :style="waveStyle(z, i)" aria-hidden="true")
          GameImage(:src="game.wave" :ratio="1" colour="#f2c46a" label="klang")
        button(
          v-for="(z, i) in zones"
          :key="`zone-${z.id}`"
          type="button"
          class="gm-zone"
          :class="{ help: helpZone === z.id, low: isLow(i), next: round === 0 && nextId === z.id && helpZone === z.id }"
          :data-zone="z.id"
          :style="zoneStyle(z)"
          :aria-label="round === 1 ? t('app.adventure.praiseZoneLevel', { name: z.name, n: level(i) }) : z.name"
          :disabled="between"
          @click="call(i)"
        )
          span(class="gm-name") {{ labelOf(z, i) }}
        span(v-if="crossAt" class="gm-mark" :style="markStyle(crossAt)")
          GameMark(kind="bad")
        span(v-if="tickAt" class="gm-mark" :style="markStyle(tickAt)")
          GameMark(kind="good")
      div(v-if="round === 1" class="gm-time" role="img" :aria-label="t('app.adventure.praiseTime', { n: pct })")
        span(class="gm-time-bar" :style="{ width: `${pct}%` }")
        span(class="gm-time-text") {{ t('app.adventure.praiseTime', { n: pct }) }}
      p(v-else class="gm-count" aria-live="polite") {{ t('app.adventure.praiseCount', { n: sung.length, total: game.order.length }) }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between" tone="gold" @click="helpMe") {{ t('app.adventure.praiseHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.praiseDone')" @next="emit('done', stars)")
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

// a strip as wide as the picture lies over the area of a group: the group still, and over it, fading in, the group singing
.gm-strip
  position: absolute
  left: 0
  width: 100%
  display: block
  pointer-events: none
  z-index: 1

  &.sing
    z-index: 2
    transition: opacity 400ms ease

.gm-lamb
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none
  z-index: 3

.gm-wave
  position: absolute
  display: block
  transform: translate(-50%, -50%)
  pointer-events: none
  z-index: 3
  transition: width 200ms linear, opacity 200ms linear

  &.low
    animation: gm-blink 900ms ease-in-out infinite

// the area of a group: an invisible button, at least 44 pixels high; its name (and in round 2 its loudness in words) sits at its lower edge
.gm-zone
  position: absolute
  display: flex
  align-items: flex-end
  justify-content: center
  min-height: 44px
  padding: 0 0 2px
  border: 3px dashed transparent
  border-radius: 12px
  background: transparent
  cursor: pointer
  z-index: 4

  &:focus-visible
    border-color: #fff6dc
    border-style: solid
    box-shadow: 0 0 0 3px rgba(40, 25, 5, 0.55)

  &.help
    border-color: #fff6dc
    border-style: solid
    box-shadow: 0 0 0 3px rgba(40, 25, 5, 0.55)

  &.low
    border-color: rgba(255, 246, 220, 0.85)

  &:disabled
    cursor: default

.gm-name
  padding: 0 10px
  border-radius: 10px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  line-height: 1.35
  color: #3f321b

.gm-mark
  position: absolute
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 7

.gm-time
  position: relative
  align-self: center
  width: min(80%, 320px)
  height: 26px
  border-radius: 13px
  border: 2px solid #8a5a2a
  background: rgba(255, 246, 220, 0.94)
  overflow: hidden

.gm-time-bar
  position: absolute
  left: 0
  top: 0
  bottom: 0
  display: block
  background: #e8c15a
  transition: width 100ms linear

.gm-time-text
  position: relative
  display: block
  text-align: center
  font-weight: 800
  font-size: 1rem
  line-height: 22px
  color: #3f321b

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

@keyframes gm-blink
  0%, 100%
    opacity: 1
  50%
    opacity: 0.5

@media (prefers-reduced-motion: reduce)
  .gm-strip.sing, .gm-wave, .gm-time-bar
    transition: none

  .gm-wave.low
    animation: none
</style>
