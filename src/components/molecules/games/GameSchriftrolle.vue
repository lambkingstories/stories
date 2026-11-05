<script setup lang="ts">
/**
 * The scrolls (Luke 2,46: Jesus sits in the temple in the midst of the teachers). A painted scroll stands in the temple; in its window of parchment the painted pictures roll by.
 * The child rolls the scroll up and down (a drag on the parchment, the buttons "up" and "down", the arrow keys) until the picture that is looked for (named and shown small above)
 * stands in the middle of the window, then says "That is it!" (the button, a tap on the window, Enter). The right picture: a tick, the next one is looked for. Another picture: a cross
 * and "That is not it", a mistake. No picture in the middle: "Roll a little more" (no mistake). Round 1: six pictures, three to find; round 2: eight pictures, four to find, and the picture
 * must stand more exactly in the middle. "Help me" after fifteen seconds rolls the scroll to the picture. With reduced motion the scroll jumps instead of gliding.
 * Nothing is shown by colour alone (tick, cross, words). The arithmetic is `utils/taufeNeu.ts`; stars: `osterStars(mistakes)`.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { osterStars } from '@/utils/osternGames'
import { scrollCheck, scrollClamp, scrollMetrics, scrollNearest, scrollTarget, scrollTile, scrollTileTop } from '@/utils/taufeNeu'
import type { ScrollGame } from '@/utils/taufeNeu'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: ScrollGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.rounds.reduce((n, r) => n + r.find.length, 0))

const IDLE_SECONDS = 15
const TAP_PX = 8
const KEY_STEP = 1 / 3
const GLIDE_MS = 600
const still = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
/** The place of the scroll: the index of the picture in the middle of the window (a fraction between two pictures). */
const pos = ref(props.game.rounds[0]!.start)
/** Which picture of `find` is looked for now. */
const want = ref(0)
const gliding = ref(false)
const markAt = ref<{ i: number; kind: 'good' | 'bad' } | null>(null)
const mistakes = ref(0)
const idle = ref(0)
const finished = ref(false)
const between = ref(false)
const message = ref('')
let messageSeq = 0
let markSeq = 0
const win = ref<HTMLElement | null>(null)
const stars = computed(() => osterStars(mistakes.value))
const metrics = computed(() => scrollMetrics(props.game))
const wanted = computed(() => scrollTile(props.game, current.value.find[want.value] ?? ''))
const busy = computed(() => between.value || finished.value || gliding.value)

function say(text: string, ms = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}
function flash(i: number, kind: 'good' | 'bad') {
  const id = ++markSeq
  markAt.value = { i, kind }
  later(() => {
    if (markSeq === id) markAt.value = null
  }, 1100)
}

function idleLoop() {
  if (!busy.value) idle.value += 0.25
  later(idleLoop, 250)
}
later(idleLoop, 250)

function roll(to: number) {
  pos.value = scrollClamp(to, current.value.tiles.length)
  idle.value = 0
}

/** "That is it!": the picture in the middle of the window is checked. */
function choose(helped = false) {
  if (busy.value) return
  idle.value = 0
  const verdict = scrollCheck(current.value, pos.value, want.value)
  const { index } = scrollNearest(pos.value, current.value.tiles.length)
  if (verdict === 'off') {
    say(t('app.adventure.scrollOff'))
    return
  }
  if (verdict === 'wrong') {
    mistakes.value++
    play('wrong')
    flash(index, 'bad')
    say(t('app.adventure.scrollWrong', { name: scrollTile(props.game, current.value.tiles[index]!)?.label ?? '' }))
    return
  }
  pos.value = index
  progress.mark()
  play('bead')
  flash(index, 'good')
  if (want.value + 1 < current.value.find.length) {
    want.value++
    say(t(helped ? 'app.adventure.scrollHelped' : 'app.adventure.scrollRight', { name: wanted.value?.label ?? '' }), 2600)
    return
  }
  endRound()
}

function endRound() {
  between.value = true
  later(() => play('right'), 250)
  say(t('app.adventure.scrollAll'), 0)
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
    want.value = 0
    pos.value = current.value.start
    between.value = false
    idle.value = 0
    message.value = ''
  }, 2800)
}

/** "Help me": the scroll glides to the picture that is looked for, and it counts as found (no mistake). */
function helpMe() {
  if (busy.value) return
  const to = scrollTarget(current.value, want.value)
  if (to < 0) return
  idle.value = 0
  if (still) {
    pos.value = to
    choose(true)
    return
  }
  gliding.value = true
  pos.value = to
  later(() => {
    gliding.value = false
    choose(true)
  }, GLIDE_MS)
}

// ---- the finger rolls the scroll (a drag on the parchment); a tap is "That is it!"
let startY = 0
let startPos = 0
let moved = 0
let dragging = false
function stepPx(): number {
  const r = win.value?.getBoundingClientRect()
  return Math.max(1, (r?.height ?? 100) * metrics.value.step)
}
function onMove(e: PointerEvent) {
  if (!dragging) return
  moved = Math.max(moved, Math.abs(e.clientY - startY))
  if (moved >= TAP_PX) roll(startPos - (e.clientY - startY) / stepPx())
}
function stopDrag(e?: PointerEvent) {
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', stopDrag)
  window.removeEventListener('pointercancel', stopDrag)
  if (!dragging) return
  dragging = false
  if (!e || e.type !== 'pointerup') return
  const m = Math.max(moved, Math.abs(e.clientY - startY))
  if (m < TAP_PX) choose()
  else roll(startPos - (e.clientY - startY) / stepPx())
}
function down(e: PointerEvent) {
  if (e.button > 0 || busy.value) return
  e.preventDefault()
  win.value?.focus({ preventScroll: true })
  idle.value = 0
  dragging = true
  startY = e.clientY
  startPos = pos.value
  moved = 0
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', stopDrag)
  window.addEventListener('pointercancel', stopDrag)
}
onBeforeUnmount(() => stopDrag())

function onKey(e: KeyboardEvent) {
  if (busy.value) return
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
    e.preventDefault()
    roll(pos.value + KEY_STEP)
    say(shownLabel(), 0)
  } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
    e.preventDefault()
    roll(pos.value - KEY_STEP)
    say(shownLabel(), 0)
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    choose()
  }
}
function rollBy(d: number) {
  if (busy.value) return
  roll(Math.round(pos.value) + d)
}

// ---- looks
const tiles = computed(() => current.value.tiles.map((id) => scrollTile(props.game, id)!))
const tileStyle = (i: number) => ({ top: `${scrollTileTop(props.game, i, pos.value)}%`, height: `${metrics.value.side * 100}%` })
const winStyle = computed(() => ({ left: `${props.game.window.x}%`, top: `${props.game.window.y}%`, width: `${props.game.window.w}%`, height: `${props.game.window.h}%` }))
function shownLabel(): string {
  const { index, off } = scrollNearest(pos.value, current.value.tiles.length)
  return Math.abs(off) <= current.value.tolerance ? t('app.adventure.scrollShows', { name: tiles.value[index]?.label ?? '' }) : t('app.adventure.scrollBetween')
}
const winLabel = computed(() => `${t('app.adventure.scrollField')} ${shownLabel()}`)
</script>

<template lang="pug">
  div(class="gm" :style="{ backgroundImage: `url(${prependBaseUrl(game.background)})` }")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(v-if="wanted" class="gm-want")
        span(class="gm-want-pic" aria-hidden="true")
          GameImage(:src="wanted.image" :ratio="1" colour="#e8d6a8" :label="wanted.label")
        span(class="gm-want-text") {{ t('app.adventure.scrollLook', { name: wanted.label, n: want + 1, total: current.find.length }) }}
      div(class="gm-scroll" :style="{ aspectRatio: String(game.frameRatio) }")
        GameImage(:src="game.frame" :ratio="game.frameRatio" colour="#d9c08a" label="rolle")
        div(
          ref="win"
          class="gm-window"
          :class="{ glide: gliding }"
          :style="winStyle"
          role="group"
          tabindex="0"
          :aria-label="winLabel"
          @pointerdown="down"
          @keydown="onKey"
        )
          div(v-for="(tile, i) in tiles" :key="`t-${round}-${i}`" class="gm-tile" :data-tile="i" :style="tileStyle(i)" aria-hidden="true")
            GameImage(:src="tile.image" :ratio="1" colour="#e8d6a8" :label="tile.label")
            span(v-if="markAt && markAt.i === i" class="gm-mark")
              GameMark(:kind="markAt.kind")
          div(class="gm-middle l" aria-hidden="true")
          div(class="gm-middle r" aria-hidden="true")
      div(class="gm-row")
        AdvButton(tone="blau" small :disabled="busy" @click="rollBy(-1)") {{ t('app.adventure.scrollUp') }}
        AdvButton(tone="blau" small :disabled="busy" @click="rollBy(1)") {{ t('app.adventure.scrollDown') }}
      AdvButton(tone="gold" :disabled="busy" @click="choose()") {{ t('app.adventure.scrollThis') }}
      AdvButton(v-if="idle > IDLE_SECONDS && !busy" tone="gold" @click="helpMe") {{ t('app.adventure.scrollHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.scrollDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background-color: #e9d7ae
  background-size: cover
  background-position: center
  box-shadow: inset 0 0 18px rgba(110, 70, 20, 0.25)
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
  color: #6a4a22

.gm-hint
  margin: 0
  align-self: center
  padding: 4px 12px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.92)
  text-align: center
  font-weight: 700
  font-size: 1rem
  color: #6a4a22

// what is looked for: the small picture and its name
.gm-want
  display: flex
  align-items: center
  gap: 10px
  align-self: center
  padding: 4px 14px 4px 4px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.96)
  box-shadow: 0 0 0 2px #d4a83e

.gm-want-pic
  display: block
  width: 48px
  height: 48px
  border-radius: 8px
  overflow: hidden

.gm-want-text
  font-weight: 800
  font-size: 1rem
  color: #4a3214

.gm-scroll
  position: relative
  width: min(100%, 360px)
  align-self: center
  filter: drop-shadow(0 6px 8px rgba(60, 35, 10, 0.4))

// the window of parchment: the pictures roll in it (the rollers of the painted scroll stay outside)
.gm-window
  position: absolute
  overflow: hidden
  touch-action: none
  cursor: grab

  &:focus-visible
    outline: 3px solid #4a3214
    outline-offset: 2px

.gm-tile
  position: absolute
  left: 10%
  width: 80%
  display: block

  &:deep(img)
    height: 100%
    object-fit: contain

.glide .gm-tile
  transition: top 600ms ease-in-out

// the middle of the window: two short marks at the sides, so that the child sees where the picture must stand
.gm-middle
  position: absolute
  top: 50%
  width: 8%
  height: 0
  border-top: 4px solid rgba(74, 50, 20, 0.7)
  pointer-events: none

  &.l
    left: 0

  &.r
    right: 0

.gm-mark
  position: absolute
  left: 50%
  top: 50%
  margin: -15px 0 0 -15px
  z-index: 3

.gm-row
  display: flex
  justify-content: center
  gap: 8px

  :deep(.adv-btn)
    flex: 1 1 0
    min-width: 0
    min-height: 44px

.gm-fb
  margin: 0
  min-height: 1.4em
  text-align: center
  font-weight: 800
  font-size: 1rem
  color: #4a3214
  align-self: center
  padding: 4px 14px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.94)

  &:empty
    display: none

@media (prefers-reduced-motion: reduce)
  .glide .gm-tile
    transition: none
</style>
