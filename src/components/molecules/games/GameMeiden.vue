<script setup lang="ts">
/**
 * What must she avoid? (Judges 13,4.13-14): the yard before Manoah's house; on the left a basket, on the right a cloth laid out, at the edge Manoah's wife sits and listens. The things of the
 * round stand on the table (the tray under the picture). The child puts into the basket what the woman may eat and drink and lays aside on the cloth what the angel forbade: wine, strong drink
 * and everything that comes from the vine (round 2: grapes, raisins and grape juice as well). Drag a thing onto the basket or the cloth, or tap it and then the basket or the cloth.
 * Right: a tick, a bright tone, a line of words ("Das darf sie.", "Das hat der Engel verboten.", "Das kommt vom Weinstock."), the thing lies in its place and the woman nods a little. Wrong: the
 * thing springs back, a cross, a low tone, a line of words, a mistake. Letting go elsewhere is no mistake. "Help me" after fifteen seconds makes the next thing and its place shine.
 * Keyboard: Tab to a thing, Enter takes it up, Tab to the basket or the cloth, Enter puts it there. Less motion: nothing springs, nothing nods. Nothing is shown by colour alone.
 * Stars: `simsonStars(mistakes)`.
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
import { simsonStars } from '@/utils/simsonGames'
import { avoidAnswer, avoidHelp, avoidItem, avoidRight, avoidTargetAt, avoidWomanHeight } from '@/utils/simsonNeu'
import type { AvoidAnswer, AvoidGame, AvoidItem, AvoidTarget, Box } from '@/utils/simsonNeu'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: AvoidGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
const total = props.game.rounds.reduce((n, r) => n + r.itemIds.length, 0)
progress.setGoal(total)

const IDLE_SECONDS = 15
const still = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const round = ref(0)
const phase = ref<'play' | 'between'>('play')
/** The things of this round that are in their place (and where). */
const placed = ref<{ id: string; target: AvoidTarget }[]>([])
const held = ref<string | null>(null)
const mistakes = ref(0)
const idle = ref(0)
const helping = ref(false)
const finished = ref(false)
const message = ref('')
const bounce = ref<string | null>(null)
const nod = ref(false)
const picked = ref<{ target: AvoidTarget; kind: 'good' | 'bad' } | null>(null)
const wrapEl = ref<HTMLElement | null>(null)
const fieldEl = ref<HTMLElement | null>(null)
const drag = reactive<{ item: string; x: number; y: number; moved: number }>({ item: '', x: 0, y: 0, moved: 0 })
const downAt = ref({ x: 0, y: 0 })
let messageSeq = 0
let pickSeq = 0

const src = (p: string) => prependBaseUrl(p)
const ratio = computed(() => props.game.ratio ?? 1.5)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const stars = computed(() => simsonStars(mistakes.value))
const countText = computed(() => t('app.adventure.vineSortCount', { n: progress.parts.value, total }))
const doneIds = computed(() => placed.value.map((p) => p.id))
/** The things that still stand on the table. */
const tray = computed(() => current.value.itemIds.filter((id) => !doneIds.value.includes(id)).map((id) => avoidItem(props.game, id)).filter((x): x is AvoidItem => !!x))
const inTarget = (target: AvoidTarget) => placed.value.filter((p) => p.target === target).map((p) => avoidItem(props.game, p.id)).filter((x): x is AvoidItem => !!x)
const help = computed(() => (helping.value && phase.value === 'play' ? avoidHelp(props.game, round.value, doneIds.value) : null))

function say(text: string, ms = 3200) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}
function mark(target: AvoidTarget, kind: 'good' | 'bad') {
  const n = ++pickSeq
  picked.value = { target, kind }
  later(() => {
    if (pickSeq === n) picked.value = null
  }, 1100)
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

// ---- the pointer: drag a thing (or tap it and then the basket or the cloth)
function toPercent(e: { clientX: number; clientY: number }): { x: number; y: number } | null {
  const r = fieldEl.value?.getBoundingClientRect()
  if (!r || r.width <= 0 || r.height <= 0) return null
  return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }
}
function down(e: PointerEvent, id: string) {
  if (phase.value !== 'play' || finished.value) return
  touched()
  const p = toPercent(e)
  drag.item = id
  drag.x = p?.x ?? 50
  drag.y = p?.y ?? 50
  drag.moved = 0
  downAt.value = { x: e.clientX, y: e.clientY }
  ;(wrapEl.value as HTMLElement | null)?.setPointerCapture?.(e.pointerId)
}
function move(e: PointerEvent) {
  if (!drag.item) return
  const p = toPercent(e)
  if (p) {
    drag.x = p.x
    drag.y = p.y
  }
  drag.moved = Math.max(drag.moved, Math.hypot(e.clientX - downAt.value.x, e.clientY - downAt.value.y))
}
function up(e: PointerEvent) {
  if (!drag.item) return
  const id = drag.item
  const moved = drag.moved
  drag.item = ''
  if (moved < 8) {
    toggleHeld(id)
    return
  }
  const p = toPercent(e)
  const where = p ? avoidTargetAt(props.game, p) : null
  if (where) put(id, where)
}
/** The keyboard (and a click without a pointer): take the thing up or put it down. */
function itemClick(e: MouseEvent, id: string) {
  if (e.detail !== 0) return
  touched()
  toggleHeld(id)
}
function toggleHeld(id: string) {
  if (phase.value !== 'play') return
  held.value = held.value === id ? null : id
  if (held.value) say(t('app.adventure.vineSortPick'), 0)
  else say('', 1)
}
function targetClick(target: AvoidTarget) {
  if (phase.value !== 'play' || finished.value) return
  touched()
  if (!held.value) {
    say(t('app.adventure.vineSortTake'), 3000)
    return
  }
  put(held.value, target)
}

const ANSWER_KEY: Record<AvoidAnswer, string> = {
  ok: 'app.adventure.vineSortOk',
  banned: 'app.adventure.vineSortBanned',
  vine: 'app.adventure.vineSortVine',
  wrongBanned: 'app.adventure.vineSortWrongBanned',
  wrongAllowed: 'app.adventure.vineSortWrongAllowed'
}

function put(id: string, target: AvoidTarget) {
  if (phase.value !== 'play' || doneIds.value.includes(id)) return
  touched()
  held.value = null
  const a = avoidAnswer(props.game, id, target)
  if (!avoidRight(a)) {
    mistakes.value++
    play('wrong')
    mark(target, 'bad')
    bounce.value = id
    later(() => (bounce.value = null), 600)
    say(t(ANSWER_KEY[a]), 3600)
    return
  }
  placed.value = [...placed.value, { id, target }]
  progress.mark()
  play('right')
  mark(target, 'good')
  nod.value = true
  later(() => (nod.value = false), 900)
  say(t(ANSWER_KEY[a]), 2600)
  if (placed.value.length >= current.value.itemIds.length) endRound()
}

function endRound() {
  phase.value = 'between'
  later(() => say(t('app.adventure.vineSortRoundDone'), 0), 900)
  later(() => {
    if (round.value >= props.game.rounds.length - 1) {
      play('star')
      finished.value = true
      return
    }
    round.value++
    placed.value = []
    phase.value = 'play'
    say('', 1)
  }, 2800)
}

function helpMe() {
  touched()
  if (phase.value !== 'play') return
  helping.value = true
  say(t('app.adventure.vineSortHelpGo'), 4200)
}

// ---- looks
const TARGETS: AvoidTarget[] = ['korb', 'tuch']
const boxStyle = (b: Box) => ({ left: `${b.x - b.w / 2}%`, top: `${b.y - b.h / 2}%`, width: `${b.w}%`, height: `${b.h}%` })
const womanStyle = computed(() => {
  const w = props.game.woman
  const h = avoidWomanHeight(props.game)
  return { left: `${w.x - w.w / 2}%`, top: `${w.y - h}%`, width: `${w.w}%` }
})
const ghostImage = computed(() => (drag.item ? src(avoidItem(props.game, drag.item)?.image ?? '') : ''))
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
          :aria-label="t('app.adventure.vineSortField')"
        )
          span(class="gm-woman" :class="{ nod }" :style="womanStyle" aria-hidden="true")
            GameImage(:src="game.woman.image" :ratio="game.womanRatio" colour="#8aa0b8" :label="'frau-hof'")
          button(
            v-for="tg in TARGETS"
            :key="tg"
            type="button"
            class="gm-target"
            :class="{ shine: help && help.target === tg, armed: !!held }"
            :data-target="tg"
            :style="boxStyle(tg === 'korb' ? game.basket.box : game.cloth.box)"
            :aria-label="t(tg === 'korb' ? 'app.adventure.vineSortBasket' : 'app.adventure.vineSortCloth')"
            @click="targetClick(tg)"
          )
            GameImage(:src="tg === 'korb' ? game.basket.image : game.cloth.image" :ratio="tg === 'korb' ? 4 / 3 : 1.8" colour="#c9a86a" :label="tg")
            span(class="gm-in" aria-hidden="true")
              span(v-for="it in inTarget(tg)" :key="it.id" class="gm-in-item" :data-in="it.id")
                GameImage(:src="it.image" :ratio="1" colour="#d9b86a" :label="it.id")
            span(v-if="picked && picked.target === tg" class="gm-mark")
              GameMark(:kind="picked.kind")
        div(class="gm-tray" role="group" :aria-label="t('app.adventure.vineSortThings')")
          button(
            v-for="it in tray"
            :key="it.id"
            type="button"
            class="gm-item"
            :class="{ sel: held === it.id, held: drag.item === it.id && drag.moved >= 8, bounce: bounce === it.id, shine: help && help.itemId === it.id }"
            :data-item="it.id"
            :aria-label="it.label"
            :aria-pressed="held === it.id"
            @pointerdown.prevent="down($event, it.id)"
            @click="itemClick($event, it.id)"
          )
            GameImage(:src="it.image" :ratio="1" colour="#d9b86a" :label="it.id")
        img(v-if="drag.item && drag.moved >= 8" class="gm-ghost" :src="ghostImage" alt="" :style="{ left: `${drag.x}%`, top: `${drag.y}%` }")
      p(class="gm-count" aria-live="polite") {{ countText }}
      div(class="gm-actions")
        AdvButton(v-if="idle >= IDLE_SECONDS && phase === 'play'" tone="gold" @click="helpMe") {{ t('app.adventure.vineSortHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.vineSortDone')" @next="emit('done', stars)")
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
  display: flex
  flex-direction: column
  gap: 8px
  touch-action: none

.gm-field
  position: relative
  width: 100%
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #b89a68
  background-size: cover
  background-position: center

.gm-woman
  position: absolute
  display: block
  pointer-events: none
  transform-origin: 50% 100%
  transition: transform 300ms ease

  &.nod
    transform: rotate(-2deg) translateY(1%)

.gm-target
  position: absolute
  display: flex
  align-items: center
  justify-content: center
  box-sizing: border-box
  min-width: 44px
  min-height: 44px
  padding: 0
  border: 3px dashed rgba(255, 246, 220, 0.7)
  border-radius: 14px
  background: rgba(255, 246, 220, 0.12)
  cursor: pointer

  &:focus-visible
    outline: 3px solid #2f6b8a
    outline-offset: 2px

  &.armed
    border-style: solid
    border-color: #f2c46a

  &.shine
    animation: gm-pulse 1300ms ease-in-out infinite
    border-color: #f2c46a
    background: rgba(255, 236, 170, 0.35)

.gm-in
  position: absolute
  left: 6%
  right: 6%
  bottom: 4%
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 2px
  pointer-events: none

.gm-in-item
  display: block
  width: 26%

.gm-mark
  position: absolute
  top: -6px
  right: -6px
  pointer-events: none

.gm-tray
  display: flex
  flex-wrap: wrap
  justify-content: center
  align-items: flex-start
  gap: 8px
  min-height: 80px

.gm-item
  display: block
  box-sizing: border-box
  width: 76px
  min-height: 72px
  padding: 4px
  border: 3px solid #d4a83e
  border-radius: 14px
  background: rgba(255, 246, 220, 0.94)
  cursor: grab
  touch-action: none
  font-family: inherit
  transition: transform 200ms ease

  &:focus-visible
    outline: 3px solid #2f6b8a
    outline-offset: 2px

  &.sel
    border-color: #2f7bd6
    transform: scale(1.08)
    box-shadow: 0 0 0 3px rgba(47, 123, 214, 0.35)

  &.held
    opacity: 0.45

  &.shine
    animation: gm-pulse 1300ms ease-in-out infinite
    box-shadow: 0 0 10px rgba(255, 220, 110, 0.9)

  &.bounce
    animation: gm-bounce 500ms ease

.gm-ghost
  position: absolute
  display: block
  width: 16%
  height: auto
  transform: translate(-50%, -50%)
  pointer-events: none
  z-index: 9999
  filter: drop-shadow(0 6px 6px rgba(40, 25, 5, 0.45))

.gm-actions
  display: flex
  justify-content: center
  gap: 10px
  flex-wrap: wrap

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

.still
  .gm-woman, .gm-item
    transition: none

  .gm-woman.nod
    transform: none

  .gm-target.shine, .gm-item.shine, .gm-item.bounce
    animation: none

@keyframes gm-pulse
  0%, 100%
    opacity: 0.75
  50%
    opacity: 1

@keyframes gm-bounce
  0%, 100%
    transform: translateY(0)
  30%
    transform: translateY(-8px)
  60%
    transform: translateY(2px)

@media (prefers-reduced-motion: reduce)
  .gm-woman, .gm-item
    transition: none

  .gm-woman.nod
    transform: none

  .gm-target.shine, .gm-item.shine, .gm-item.bounce
    animation: none
</style>
