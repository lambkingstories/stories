<script setup lang="ts">
/**
 * Send the runners (2 Chronicles 30,5-12): Hezekiah has letters carried from town to town. On the map of the hill country lie Jerusalem and five (round 1) or seven (round 2) towns, joined by roads.
 * Every runner has three letters; in every town stays exactly one letter, in none a second one. The child plans which runner goes to which towns: tap a runner (he shines), then the town he runs to
 * (only a town on a road from where he stands), or drag the runner over the town. Right: the runner runs, a letter lies in the town ("Letter delivered."), and the people do what the text says: they
 * laugh or they set out for Jerusalem (a footprint stays on the way). Wrong: a town that has a letter already, or a runner without letters (the runner wiggles, a cross, a low tone, a mistake). When no way
 * leads to a letter in every town any more: "That is not enough yet." (a mistake, once for such a state); "One step back" and "Start again" cost nothing. "Help me" after fifteen seconds lets a runner
 * and his next town shine (or the button "Start again", when nothing leads on). Keyboard: Tab to a runner or a town, Enter. Less motion: nothing runs, nothing wiggles, nothing pulses.
 * Nothing is shown by colour alone. Points (for "Go on"): every town counts once when it gets its first letter in its round. Stars: `hiskiaStars(mistakes)`.
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
import { hiskiaStars } from '@/utils/hiskiaGames'
import { RUN_CITY, runCheck, runDone, runHint, runStart, runStep, runStuck, runUndo } from '@/utils/hiskiaNeu'
import type { RunRoutesGame, RunState, RunTown } from '@/utils/hiskiaNeu'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: RunRoutesGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
const total = props.game.rounds.reduce((n, r) => n + r.towns.length, 0)
progress.setGoal(total)

const IDLE_SECONDS = 15
const still = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const round = ref(0)
const phase = ref<'play' | 'between'>('play')
const st = ref<RunState>(runStart(props.game.rounds[0]!))
/** The towns that got their first letter in the round (counted once, also after "Start again"). */
const counted = ref<string[]>([])
const selected = ref<number | null>(null)
const mistakes = ref(0)
const idle = ref(0)
const helping = ref(false)
const helpAgain = ref(false)
const finished = ref(false)
const message = ref('')
const wiggle = ref<number | null>(null)
const bad = ref<string | null>(null)
const stuck = ref(false)
const scene = ref<{ town: string; kind: 'comes' | 'laughs' } | null>(null)
const wrapEl = ref<HTMLElement | null>(null)
const fieldEl = ref<HTMLElement | null>(null)
const drag = reactive<{ runner: number; x: number; y: number; moved: number }>({ runner: -1, x: 0, y: 0, moved: 0 })
const downAt = ref({ x: 0, y: 0 })
let messageSeq = 0
let sceneSeq = 0

const src = (p: string) => prependBaseUrl(p)
const ratio = computed(() => props.game.ratio ?? 1.5)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const stars = computed(() => hiskiaStars(mistakes.value))
const countText = computed(() => t('app.adventure.lettersRunCount', { n: st.value.got.length, total: current.value.towns.length }))
const hint = computed(() => (helping.value && phase.value === 'play' ? runHint(current.value, st.value) : null))
const canBack = computed(() => st.value.log.length > 0 && phase.value === 'play')

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
  helpAgain.value = false
}
function tickIdle() {
  if (finished.value) return
  later(tickIdle, 1000)
  if (phase.value === 'play') idle.value++
}
later(tickIdle, 1000)

// ---- the moves
function attempt(r: number, to: string) {
  if (phase.value !== 'play' || finished.value) return
  touched()
  const rd = current.value
  const check = runCheck(rd, st.value, r, to)
  selected.value = null // every try puts the runner down: the next move starts with a tap on a runner
  if (check === 'noroad' || check === 'city') {
    say(t('app.adventure.lettersRunNoRoad'), 3000)
    return
  }
  if (check === 'empty' || check === 'taken') {
    mistakes.value++
    play('wrong')
    wiggle.value = r
    bad.value = check === 'taken' ? to : null
    later(() => {
      wiggle.value = null
      bad.value = null
    }, 900)
    say(t(check === 'taken' ? 'app.adventure.lettersRunTaken' : 'app.adventure.lettersRunEmpty'), 3600)
    return
  }
  const next = runStep(rd, st.value, r, to)
  if (!next) return
  st.value = next
  const wasStuck = stuck.value
  stuck.value = false
  play('snap')
  const town = rd.towns.find((x) => x.id === to)!
  if (!counted.value.includes(to)) {
    counted.value = [...counted.value, to]
    progress.mark()
  }
  const k = ++sceneSeq
  scene.value = { town: to, kind: town.reacts }
  later(() => {
    if (sceneSeq === k) scene.value = null
  }, 1600)
  const react = t(town.reacts === 'comes' ? 'app.adventure.lettersRunComes' : 'app.adventure.lettersRunLaughs')
  if (runDone(rd, next)) {
    say(`${t('app.adventure.lettersRunOk')} ${react}`, 0)
    endRound()
    return
  }
  if (runStuck(rd, next)) {
    stuck.value = true
    if (!wasStuck) {
      mistakes.value++
      play('wrong')
    }
    say(`${t('app.adventure.lettersRunOk')} ${react} ${t('app.adventure.lettersRunStuck')}`, 5200)
    return
  }
  say(`${t('app.adventure.lettersRunOk')} ${react}`, 3200)
}

function endRound() {
  phase.value = 'between'
  selected.value = null
  later(() => say(t('app.adventure.lettersRunRoundDone'), 0), 1400)
  later(() => {
    if (round.value >= props.game.rounds.length - 1) {
      play('star')
      finished.value = true
      return
    }
    round.value++
    st.value = runStart(props.game.rounds[round.value]!)
    counted.value = []
    stuck.value = false
    phase.value = 'play'
    say('', 1)
  }, 3400)
}

function back() {
  if (!canBack.value) return
  touched()
  st.value = runUndo(st.value)
  stuck.value = runStuck(current.value, st.value)
  selected.value = null
}
function again() {
  if (phase.value !== 'play') return
  touched()
  st.value = runStart(current.value)
  stuck.value = false
  selected.value = null
  scene.value = null
  say('', 1)
}

/** A tap on a runner (or Enter): take him up, or put him down again. */
function runnerTap(r: number) {
  if (phase.value !== 'play' || finished.value) return
  touched()
  if (selected.value === r) {
    selected.value = null
    say('', 1)
    return
  }
  selected.value = r
  say(t('app.adventure.lettersRunPick'), 0)
}
function runnerClick(e: MouseEvent, r: number) {
  if (e.detail !== 0) return // a click that comes from a finger or the mouse is handled by the pointer events
  runnerTap(r)
}
function townTap(id: string) {
  if (phase.value !== 'play' || finished.value) return
  touched()
  if (selected.value === null) {
    say(t('app.adventure.lettersRunFirst'), 2800)
    return
  }
  attempt(selected.value, id)
}

// ---- the pointer: drag a runner over a town (or tap the runner and then the town)
function toPercent(e: { clientX: number; clientY: number }): { x: number; y: number } | null {
  const r = fieldEl.value?.getBoundingClientRect()
  if (!r || r.width <= 0 || r.height <= 0) return null
  return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }
}
function down(e: PointerEvent, r: number) {
  if (phase.value !== 'play' || finished.value) return
  touched()
  const p = toPercent(e)
  drag.runner = r
  drag.x = p?.x ?? 50
  drag.y = p?.y ?? 50
  drag.moved = 0
  downAt.value = { x: e.clientX, y: e.clientY }
  ;(wrapEl.value as HTMLElement | null)?.setPointerCapture?.(e.pointerId)
}
function move(e: PointerEvent) {
  if (drag.runner < 0) return
  const p = toPercent(e)
  if (p) {
    drag.x = p.x
    drag.y = p.y
  }
  drag.moved = Math.max(drag.moved, Math.hypot(e.clientX - downAt.value.x, e.clientY - downAt.value.y))
}
/** The town whose picture lies under a place of the field (percent), or null. */
function townAt(p: { x: number; y: number }): RunTown | null {
  for (const tw of current.value.towns) {
    const h = townH.value
    if (Math.abs(p.x - tw.x) <= tw.w / 2 + 1 && Math.abs(p.y - tw.y) <= h / 2 + 1) return tw
  }
  return null
}
function up(e: PointerEvent) {
  if (drag.runner < 0) return
  const r = drag.runner
  const moved = drag.moved
  drag.runner = -1
  if (moved < 8) {
    runnerTap(r)
    return
  }
  const p = toPercent(e)
  const tw = p ? townAt(p) : null
  if (tw) {
    selected.value = r
    attempt(r, tw.id)
  }
}

function helpMe() {
  touched()
  if (phase.value !== 'play') return
  if (runHint(current.value, st.value)) {
    helping.value = true
    say(t('app.adventure.lettersRunHelpGo'), 4200)
  } else {
    helpAgain.value = true
    say(t('app.adventure.lettersRunHelpAgain'), 4200)
  }
}

// ---- looks (a width is percent of the width of the field, a height percent of its height)
const townH = computed(() => (current.value.towns[0]?.w ?? props.game.rounds[0]!.towns[0]!.w) * ratio.value / props.game.townRatio)
const cityH = computed(() => (props.game.city.w * ratio.value) / props.game.cityRatio)
const runnerH = computed(() => (props.game.runnerW * ratio.value) / props.game.runnerRatio)
const letterH = computed(() => (props.game.letterW * ratio.value) / props.game.letterRatio)
const sceneH = computed(() => (props.game.sceneW * ratio.value) / props.game.sceneRatio)
const townBox = (tw: RunTown) => ({ left: `${tw.x - tw.w / 2}%`, top: `${tw.y - townH.value / 2}%`, width: `${tw.w}%` })
const where = (id: string): { x: number; y: number } => (id === RUN_CITY ? props.game.city : (current.value.towns.find((x) => x.id === id) ?? props.game.city))
const roads = computed(() =>
  current.value.roads.map(([a, b]) => {
    const A = where(a)
    const B = where(b)
    const dx = B.x - A.x
    const dy = (B.y - A.y) / ratio.value
    const len = Math.hypot(dx, dy)
    const thick = props.game.roadH
    return {
      key: `${a}-${b}`,
      style: {
        left: `${(A.x + B.x) / 2 - len / 2}%`,
        top: `${(A.y + B.y) / 2 - (thick * ratio.value) / 2}%`,
        width: `${len}%`,
        aspectRatio: `${len} / ${thick}`,
        transform: `rotate(${(Math.atan2(dy, dx) * 180) / Math.PI}deg)`
      }
    }
  })
)
/** Where a runner stands (the middle of his feet): at the waiting place, or beside the lower right of the town he is in. */
function feet(r: number): { x: number; y: number } {
  const pos = st.value.pos[r] ?? RUN_CITY
  if (pos === RUN_CITY) return props.game.waiting[r] ?? { x: 10, y: 96 }
  const tw = current.value.towns.find((x) => x.id === pos)!
  return { x: Math.min(100 - props.game.runnerW / 2, tw.x + tw.w * 0.8), y: Math.min(99, tw.y + townH.value * 0.55) }
}
const runnerStyle = (r: number) => {
  const f = feet(r)
  return { left: `${f.x - props.game.runnerW / 2}%`, top: `${f.y - runnerH.value}%`, width: `${props.game.runnerW}%` }
}
const lettersStyle = (r: number) => {
  const f = feet(r)
  return { left: `${Math.max(0, Math.min(100 - props.game.letterW * 3, f.x - props.game.letterW * 1.5))}%`, top: `${Math.max(0, f.y - runnerH.value - letterH.value)}%`, width: `${props.game.letterW * 3}%`, height: `${letterH.value}%` }
}
const letterStyle = (i: number) => ({ left: `${(i * 100) / 3}%`, width: `${100 / 3}%` })
/** The footprint of a town that has set out and got its letter: a little way from the town towards Jerusalem. */
/** The footprint takes the colour of the runner who brought the letter (a filter on the picture, so that the three runners can be told apart on the way). */
const FOOT_TINT = ['none', 'hue-rotate(75deg) saturate(2.2) brightness(1.5)', 'hue-rotate(200deg) saturate(2.4) brightness(1.7)']
const footTint = (tw: RunTown) => FOOT_TINT[st.value.log.find((m) => m.to === tw.id)?.runner ?? 0] ?? 'none'
const footStyle = (tw: RunTown) => {
  const c = props.game.city
  const fx = tw.x + (c.x - tw.x) * 0.3
  const fy = tw.y + townH.value * 0.15 + (c.y - tw.y) * 0.25
  const w = Math.max(3.4, props.game.letterW)
  return { left: `${fx - w / 2}%`, top: `${fy - (w * ratio.value) / 2}%`, width: `${w}%`, filter: footTint(tw) }
}
const sceneStyle = computed(() => {
  const s = scene.value
  if (!s) return {}
  const tw = current.value.towns.find((x) => x.id === s.town)!
  const w = props.game.sceneW
  const top = Math.max(0, Math.min(100 - sceneH.value, tw.y - townH.value / 2 - sceneH.value + 4))
  return { left: `${Math.max(0, Math.min(100 - w, tw.x - w / 2))}%`, top: `${top}%`, width: `${w}%` }
})
const ghostStyle = computed(() => ({ left: `${drag.x - props.game.runnerW / 2}%`, top: `${drag.y - runnerH.value / 2}%`, width: `${props.game.runnerW}%` }))
const runnerLabel = (r: number) => t('app.adventure.lettersRunRunner', { who: props.game.runners[r]?.label ?? '', n: st.value.left[r] ?? 0 })
const townLabel = (tw: RunTown) => t(st.value.got.includes(tw.id) ? 'app.adventure.lettersRunTownHas' : 'app.adventure.lettersRunTownNot', { who: tw.label })
const runnerImage = (r: number) => props.game.runners[r]?.image ?? ''
const runnerIds = computed(() => Array.from({ length: current.value.runners }, (_, i) => i))
const comesTowns = computed(() => current.value.towns.filter((x) => x.reacts === 'comes' && st.value.got.includes(x.id)))
</script>

<template lang="pug">
  div(class="gm" :class="{ still }")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(ref="wrapEl" class="gm-wrap" @pointermove="move" @pointerup="up" @pointercancel="up" @contextmenu.prevent)
        div(
          ref="fieldEl"
          class="gm-field"
          :style="{ backgroundImage: `url(${src(game.background)})`, aspectRatio: String(ratio) }"
          role="group"
          :aria-label="t('app.adventure.lettersRunField')"
        )
          span(v-for="r in roads" :key="r.key" class="gm-road" :style="r.style" aria-hidden="true")
            GameImage(:src="game.road" :ratio="600 / 56" colour="#c9a86a" label="strasse")
          span(v-for="tw in comesTowns" :key="`f${tw.id}`" class="gm-foot" :style="footStyle(tw)" aria-hidden="true")
            GameImage(:src="game.step" :ratio="1" colour="#a08050" label="fuss")
          span(class="gm-city" :style="{ left: `${game.city.x - game.city.w / 2}%`, top: `${game.city.y - cityH / 2}%`, width: `${game.city.w}%` }" aria-hidden="true")
            GameImage(:src="game.city.image" :ratio="game.cityRatio" colour="#d8cfae" label="jerusalem")
          span(v-for="tw in current.towns" :key="`t${tw.id}`" class="gm-town" :style="townBox(tw)" aria-hidden="true")
            GameImage(:src="tw.image" :ratio="game.townRatio" colour="#b8b080" :label="`ort-${tw.id}`")
            span(v-if="st.got.includes(tw.id)" class="gm-mark")
              GameMark(kind="good")
            span(v-else-if="bad === tw.id" class="gm-mark")
              GameMark(kind="bad")
          button(
            v-for="tw in current.towns"
            :key="`b${tw.id}`"
            type="button"
            class="gm-tbtn"
            :class="{ shine: hint?.to === tw.id }"
            :data-town="tw.id"
            :style="{ ...townBox(tw), aspectRatio: String(game.townRatio) }"
            :aria-label="townLabel(tw)"
            :disabled="phase !== 'play'"
            @click="townTap(tw.id)"
          )
          span(v-if="scene" class="gm-scene" :class="scene.kind" :style="sceneStyle" aria-hidden="true")
            GameImage(:src="game.scenes[scene.kind]" :ratio="game.sceneRatio" colour="#d9b86a" :label="scene.kind")
          template(v-for="r in runnerIds" :key="`r${r}`")
            span(class="gm-letters" :style="lettersStyle(r)" aria-hidden="true")
              span(v-for="i in (st.left[r] ?? 0)" :key="`l${r}-${i}`" class="gm-letter" :style="letterStyle(i - 1)")
                GameImage(:src="game.letter" :ratio="game.letterRatio" colour="#e8dcb0" label="brief")
            button(
              type="button"
              class="gm-runner"
              :class="{ sel: selected === r, wiggle: wiggle === r, shine: hint?.runner === r }"
              :data-runner="r"
              :style="runnerStyle(r)"
              :aria-label="runnerLabel(r)"
              :aria-pressed="selected === r"
              :disabled="phase !== 'play'"
              @pointerdown.prevent="down($event, r)"
              @click="runnerClick($event, r)"
            )
              GameImage(:src="runnerImage(r)" :ratio="game.runnerRatio" colour="#8aa0b8" :label="`laeufer-${r + 1}`")
          img(v-if="drag.runner >= 0 && drag.moved >= 8" class="gm-ghost" :src="src(runnerImage(drag.runner))" alt="" :style="ghostStyle")
      p(class="gm-count" aria-live="polite") {{ countText }}
      div(class="gm-actions")
        AdvButton(tone="blau" small :disabled="!canBack" @click="back") {{ t('app.adventure.lettersRunBack') }}
        AdvButton(tone="blau" small :class="{ pulse: (stuck || helpAgain) && phase === 'play' }" :disabled="phase !== 'play'" @click="again") {{ t('app.adventure.lettersRunAgain') }}
        AdvButton(v-if="idle >= IDLE_SECONDS && phase === 'play'" tone="gold" small @click="helpMe") {{ t('app.adventure.lettersRunHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.lettersRunDone')" @next="emit('done', stars)")
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

.gm-field
  position: relative
  width: 100%
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #b8c088
  background-size: cover
  background-position: center

.gm-road, .gm-foot, .gm-city, .gm-town, .gm-letters, .gm-letter, .gm-scene
  position: absolute
  display: block
  pointer-events: none

// the road is a stripe that is stretched and turned: the picture fills it
.gm-road
  transform-origin: 50% 50%

  :deep(.gi), :deep(img), :deep(.gi-stand)
    width: 100%
    height: 100%

  :deep(img)
    object-fit: fill

.gm-mark
  position: absolute
  top: -10px
  right: -6px
  pointer-events: none

.gm-tbtn
  position: absolute
  display: block
  box-sizing: border-box
  min-width: 44px
  min-height: 44px
  padding: 0
  border: 3px solid transparent
  border-radius: 14px
  background: transparent
  cursor: pointer

  &:focus-visible
    outline: 3px solid #2f6b8a
    outline-offset: 2px

  &:disabled
    cursor: default

  &.shine
    border-color: #ffd86a
    box-shadow: 0 0 12px rgba(255, 220, 110, 0.95)
    animation: gm-pulse 1300ms ease-in-out infinite

.gm-runner
  position: absolute
  display: block
  box-sizing: border-box
  min-width: 44px
  padding: 0
  border: 0
  border-radius: 12px
  background: transparent
  cursor: pointer
  transition: left 700ms ease, top 700ms ease
  font-family: inherit

  &:focus-visible
    outline: 3px solid #2f6b8a
    outline-offset: 2px

  &:disabled
    cursor: default

  &.sel
    box-shadow: 0 0 0 3px #d4a83e, 0 0 14px rgba(255, 220, 110, 0.95)
    background: rgba(255, 246, 220, 0.35)

  &.shine
    animation: gm-pulse 1300ms ease-in-out infinite
    box-shadow: 0 0 12px rgba(255, 220, 110, 0.95)

  &.wiggle
    animation: gm-wiggle 500ms ease-in-out

.gm-letters
  transition: left 700ms ease, top 700ms ease

.gm-scene
  animation: gm-rise 1500ms ease-out both
  // the two people are cut off at the hem: the picture fades out at the bottom
  -webkit-mask-image: linear-gradient(to bottom, #000 72%, transparent)
  mask-image: linear-gradient(to bottom, #000 72%, transparent)

.gm-ghost
  position: absolute
  pointer-events: none
  opacity: 0.85
  height: auto

.gm-actions
  display: flex
  justify-content: center
  gap: 10px
  flex-wrap: wrap

  &:empty
    display: none

  :deep(.pulse)
    animation: gm-pulse 1300ms ease-in-out infinite
    box-shadow: 0 0 10px rgba(255, 220, 110, 0.9)

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
  .gm-runner, .gm-letters
    transition: none

  .gm-runner.shine, .gm-tbtn.shine, .gm-actions :deep(.pulse), .gm-scene
    animation: none

  .gm-runner.wiggle
    animation: none

@keyframes gm-pulse
  0%, 100%
    opacity: 0.75
  50%
    opacity: 1

@keyframes gm-wiggle
  0%, 100%
    transform: translateX(0)
  25%
    transform: translateX(-4px)
  75%
    transform: translateX(4px)

@keyframes gm-rise
  0%
    opacity: 0
    transform: translateY(6px)
  20%, 80%
    opacity: 1
    transform: translateY(0)
  100%
    opacity: 0

@media (prefers-reduced-motion: reduce)
  .gm-runner, .gm-letters
    transition: none

  .gm-runner.shine, .gm-tbtn.shine, .gm-actions :deep(.pulse), .gm-scene, .gm-runner.wiggle
    animation: none
</style>
