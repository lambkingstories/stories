<script setup lang="ts">
/**
 * Under the flax: on the flat roof of Rahab's house lie the two men in their cloaks, seen from above. Bundles of flax lie at the edge. The child drags bundles onto the men (or taps a bundle and then
 * the roof); a tap on a bundle that lies on the roof turns it across, a bundle can be dragged on, and one let go outside the roof goes back to the edge. The button "The messengers come" looks:
 * when every man is covered (at least 96 %), two small figures look up from far away and go on (a tick, a star). If a corner still looks out, the places are marked softly (a cross, a mistake),
 * the messengers only look "almost" and go by, and the child covers more. Nobody is found and nothing ends. Round 1: one man, three bundles; round 2: two men, five bundles. All sizes
 * are in percent of the width of the roof (also upwards), so that turning a bundle keeps its size. The check is `covered` and `peeks` in `utils/josuaGames.ts`.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { useDragDrop, type DropPoint } from '@/use/useDragDrop'
import { covered, peeks, turnRect, type Rect } from '@/utils/josuaGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { HideBundle, HideGame, HideMan } from '@/types/adventure'

const props = defineProps<{ game: HideGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every man of every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.men.length, 0))

/** The roof is 3 : 4 (900 x 1200): its height is this many times its width. All the sizes below are in percent of the width. */
const H = 4 / 3
/** Stand-in colours for the men and the bundles until their pictures are there. */
const MAN_COLOURS = ['#7a8fb5', '#b58a5a']
const FLAX = '#e3cf86'

interface Lay {
  id: string
  /** the middle of the bundle, in percent of the width of the roof */
  cx: number
  cy: number
  rot: boolean
}

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)
const men = computed<HideMan[]>(() => current.value.men.map((id) => props.game.men.find((m) => m.id === id)).filter((m): m is HideMan => !!m))
const lying = ref<Lay[]>([])
const inTray = computed<HideBundle[]>(() => current.value.bundles.map((id) => props.game.bundles.find((b) => b.id === id)).filter((b): b is HideBundle => !!b && !lying.value.some((l) => l.id === b.id)))
const bundleOf = (id: string): HideBundle | undefined => props.game.bundles.find((b) => b.id === id)
const mistakes = ref(0)
const best = ref(0)
const looking = ref<{ x: number; y: number }[]>([])
const passing = ref(false)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const roof = ref<HTMLElement | null>(null)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => mistakeStars(mistakes.value, 1, 3))

/** A man's rectangle in the units of the check (the data is in percent of the picture, the height counts H times). */
const manRect = (m: HideMan): Rect => ({ x: m.x, y: m.y * H, w: m.w, h: m.h * H })
/** The rectangle of a bundle that lies on the roof. */
function rectOf(l: Lay): Rect {
  const b = bundleOf(l.id)
  if (!b) return { x: l.cx, y: l.cy, w: 0, h: 0 }
  const r: Rect = { x: l.cx - b.w / 2, y: l.cy - b.h / 2, w: b.w, h: b.h }
  return l.rot ? turnRect(r) : r
}
const rects = computed(() => lying.value.map(rectOf))

/** Keep the bundle on the roof: its middle moves in when it would stick out. */
function clamp(l: Lay): Lay {
  const r = rectOf(l)
  const dx = Math.max(0, -r.x) - Math.max(0, r.x + r.w - 100)
  const dy = Math.max(0, -r.y) - Math.max(0, r.y + r.h - 100 * H)
  return { ...l, cx: l.cx + dx, cy: l.cy + dy }
}

function lay(id: string, cx: number, cy: number) {
  if (between.value || finished.value || passing.value) return
  const old = lying.value.find((l) => l.id === id)
  const next = clamp({ id, cx, cy, rot: old?.rot ?? false })
  lying.value = [...lying.value.filter((l) => l.id !== id), next]
  looking.value = []
  message.value = ''
  play('tap')
}

function back(id: string) {
  lying.value = lying.value.filter((l) => l.id !== id)
  looking.value = []
}

function turn(id: string) {
  if (between.value || finished.value || passing.value) return
  lying.value = lying.value.map((l) => (l.id === id ? clamp({ ...l, rot: !l.rot }) : l))
  looking.value = []
  play('tap')
}

/** Where on the roof (in units) a point of the screen lies. */
function unitsOf(at: DropPoint) {
  const r = roof.value?.getBoundingClientRect()
  if (!r || !r.width) return null
  return { x: ((at.x - r.left) / r.width) * 100, y: ((at.y - r.top) / r.width) * 100 }
}

function dropped(id: string, _target: string, at?: DropPoint) {
  const p = at ? unitsOf(at) : null
  if (p) lay(id, p.x, p.y)
  else {
    // from the keyboard: the bundle goes over the first man who is not hidden yet
    const man = men.value.find((m) => !covered(manRect(m), rects.value)) ?? men.value[0]
    if (man) {
      const r = manRect(man)
      lay(id, r.x + r.w / 2, r.y + r.h / 2)
    }
  }
}
const { dragging, selected, down, tapPlace, dragStyle } = useDragDrop(dropped)

// a bundle that lies on the roof: a tap turns it, dragging moves it, letting go outside the roof takes it back to the edge
let grab: { id: string; dx: number; dy: number; moved: boolean; startX: number; startY: number } | null = null
function onMove(e: PointerEvent) {
  if (!grab) return
  if (Math.hypot(e.clientX - grab.startX, e.clientY - grab.startY) > 8) grab.moved = true
  if (!grab.moved) return
  const p = unitsOf({ x: e.clientX, y: e.clientY })
  if (p) {
    const g = grab
    lying.value = lying.value.map((l) => (l.id === g.id ? clamp({ ...l, cx: p.x - g.dx, cy: p.y - g.dy }) : l))
  }
}
function onUp(e: PointerEvent) {
  const g = grab
  stopGrab()
  if (!g) return
  if (!g.moved) {
    turn(g.id)
    return
  }
  const r = roof.value?.getBoundingClientRect()
  if (r && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)) back(g.id)
  else looking.value = []
}
function stopGrab() {
  grab = null
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', onUp)
  window.removeEventListener('pointercancel', stopGrab)
}
function grabBundle(e: PointerEvent, id: string) {
  if (e.button > 0 || between.value || finished.value || passing.value) return
  e.preventDefault()
  const l = lying.value.find((x) => x.id === id)
  const p = unitsOf({ x: e.clientX, y: e.clientY })
  if (!l || !p) return
  grab = { id, dx: p.x - l.cx, dy: p.y - l.cy, moved: false, startX: e.clientX, startY: e.clientY }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
  window.addEventListener('pointercancel', stopGrab)
}
onBeforeUnmount(stopGrab)

function keyBundle(e: KeyboardEvent, id: string) {
  const steps: Record<string, [number, number]> = { ArrowLeft: [-2, 0], ArrowRight: [2, 0], ArrowUp: [0, -2], ArrowDown: [0, 2] }
  const s = steps[e.key]
  if (s) {
    lying.value = lying.value.map((l) => (l.id === id ? clamp({ ...l, cx: l.cx + s[0], cy: l.cy + s[1] }) : l))
    looking.value = []
  } else if (e.key === 'Enter' || e.key === ' ') turn(id)
  else if (e.key === 'Delete' || e.key === 'Backspace') back(id)
  else return
  e.preventDefault()
}

/** "The messengers come": look at every man. */
function look() {
  if (between.value || finished.value || passing.value) return
  const hiddenMen = men.value.filter((m) => covered(manRect(m), rects.value))
  const hidden = hiddenMen.length
  for (let i = best.value; i < hidden; i++) progress.mark()
  best.value = Math.max(best.value, hidden)
  passing.value = true
  later(() => {
    passing.value = false
    if (hidden === men.value.length) {
      play('star')
      message.value = t('app.adventure.hideRight')
      roundOver()
    } else {
      mistakes.value++
      play('wrong')
      looking.value = men.value.filter((m) => !hiddenMen.includes(m)).flatMap((m) => peeks(manRect(m), rects.value))
      message.value = t('app.adventure.hideLooks')
    }
  }, 1300)
}

function roundOver() {
  if (lastRound.value) {
    later(() => {
      finished.value = true
    }, 1200)
    return
  }
  between.value = true
  later(() => {
    round.value++
    lying.value = []
    best.value = 0
    looking.value = []
    between.value = false
    message.value = ''
  }, 1800)
}

const pct = (r: Rect) => ({ left: `${r.x}%`, top: `${r.y / H}%`, width: `${r.w}%`, height: `${r.h / H}%` })
const colourOfMan = (id: string) => MAN_COLOURS[Math.max(0, props.game.men.findIndex((m) => m.id === id)) % MAN_COLOURS.length]
const lyingList = computed(() =>
  lying.value.map((l) => {
    const b = bundleOf(l.id)!
    return { l, b, style: pct(rectOf(l)), ratio: l.rot ? b.h / b.w : b.w / b.h }
  })
)
const cellPct = (p: { x: number; y: number }) => ({ left: `${p.x}%`, top: `${p.y / H}%` })
</script>

<template lang="pug">
  div(class="hd")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="hd-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="hd-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      div(
        ref="roof"
        class="hd-roof"
        :class="{ ready: selected !== null }"
        data-drop="roof"
        role="group"
        :aria-label="t('app.adventure.hideRoof', { n: best, total: men.length })"
        :style="{ backgroundImage: `url(${src(game.background)})` }"
        @click="tapPlace('roof', { x: $event.clientX, y: $event.clientY })"
      )
        div(v-for="(m, i) in men" :key="`${round}-m-${m.id}`" class="hd-man" :style="{ left: `${m.x}%`, top: `${m.y}%`, width: `${m.w}%`, height: `${m.h}%` }" role="img" :aria-label="t('app.adventure.hideMan', { n: i + 1 })")
          GameImage(:src="m.image" :ratio="(m.w * 1) / (m.h * H)" :colour="colourOfMan(m.id)")
        div(
          v-for="e in lyingList"
          :key="`${round}-${e.l.id}`"
          class="hd-bundle"
          :style="e.style"
          role="button"
          tabindex="0"
          :aria-label="t('app.adventure.hideBundleOn')"
          @pointerdown.stop="grabBundle($event, e.l.id)"
          @click.stop
          @keydown="keyBundle($event, e.l.id)"
        )
          GameImage(:src="e.b.image" :ratio="e.ratio" :colour="'#e3cf86'")
        span(v-for="(p, i) in looking" :key="`peek-${i}`" class="hd-peek" :style="cellPct(p)" aria-hidden="true")
        GameMark(v-if="looking.length" kind="bad" class="hd-mark")
        span(v-if="passing" class="hd-messengers" aria-hidden="true")
          GameImage(:src="game.messenger" :ratio="220 / 160" colour="#4a3f38")
      p(class="hd-fb" role="status") {{ message }}
      div(class="hd-tray" role="group" :aria-label="t('app.adventure.hideTray')")
        div(
          v-for="b in inTray"
          :key="`${round}-${b.id}`"
          class="hd-token"
          :class="{ chosen: selected === b.id, lifted: dragging === b.id }"
          :style="{ width: `${Math.round(b.w * 3.2)}px`, ...dragStyle(b.id) }"
          role="button"
          tabindex="0"
          :aria-label="t('app.adventure.hideBundle')"
          @pointerdown="down($event, b.id)"
          @keydown.enter.space.prevent="dropped(b.id, 'roof')"
        )
          GameImage(:src="b.image" :ratio="b.w / b.h" colour="#e3cf86")
      AdvButton(tone="gold" class="hd-look" :disabled="between || passing" @click.stop="look") {{ t('app.adventure.hideLook') }}
      p(class="hd-count") {{ t('app.adventure.hideCount', { n: best, total: men.length }) }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.hideDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.hd
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e6dcb4
  box-shadow: inset 0 0 18px rgba(80, 50, 10, 0.25)

.hd-round
  margin: 0
  align-self: center
  padding: 1px 12px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.92)
  font-weight: 800
  font-size: 1rem
  letter-spacing: 0.06em
  text-transform: uppercase
  color: #5f4f35

.hd-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.92)

// the roof seen from above, 3 : 4
.hd-roof
  position: relative
  width: 100%
  max-width: 360px
  aspect-ratio: 3 / 4
  align-self: center
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #d8bf86
  background-size: cover
  background-position: center
  touch-action: none

  &.ready
    box-shadow: 0 0 0 3px rgba(255, 214, 90, 0.95)

.hd-man
  position: absolute
  pointer-events: none

.hd-bundle
  position: absolute
  cursor: grab
  touch-action: none
  user-select: none
  -webkit-user-select: none
  z-index: 3

.hd-peek
  position: absolute
  width: 14px
  height: 14px
  transform: translate(-50%, -50%)
  border-radius: 50%
  border: 3px dashed rgba(210, 50, 40, 0.95)
  background: rgba(255, 200, 190, 0.5)
  pointer-events: none
  z-index: 6

.hd-mark
  position: absolute
  top: 8px
  right: 8px
  z-index: 7

.hd-messengers
  position: absolute
  bottom: 4px
  left: 0
  width: 34%
  animation: hd-pass 1300ms linear forwards
  pointer-events: none
  z-index: 8

.hd-fb
  margin: 0
  min-height: 1.4em
  text-align: center
  font-weight: 800
  color: #3f321b
  align-self: center
  padding: 4px 14px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.94)

  &:empty
    display: none

.hd-tray
  display: flex
  flex-wrap: wrap
  justify-content: center
  align-items: center
  gap: 10px
  min-height: 70px
  padding: 8px
  border-radius: 14px
  background: rgba(95, 65, 25, 0.22)

.hd-token
  min-width: 56px
  padding: 3px
  box-sizing: content-box
  border-radius: 10px
  background: rgba(255, 246, 220, 0.9)
  border: 2px solid rgba(150, 100, 30, 0.6)
  cursor: grab
  touch-action: none
  user-select: none
  -webkit-user-select: none

  &.chosen
    box-shadow: 0 0 0 3px rgba(255, 214, 90, 0.95)
    transform: translateY(-3px)

.hd-look
  align-self: center
  min-height: 56px

.hd-count
  margin: 0
  text-align: center
  font-weight: 800
  color: #5f4f35

@keyframes hd-pass
  from
    transform: translateX(-10%)
  to
    transform: translateX(200%)

@media (prefers-reduced-motion: reduce)
  .hd-messengers
    animation: none
    left: 33%
</style>
