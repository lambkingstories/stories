<script setup lang="ts">
/**
 * Fill the baskets (Acts 2,45; 4,34-35: "and distribution was made unto every man according as he had need"). A yard in Jerusalem in the evening; at the edge stand families, each with an
 * empty basket and a row of empty loaf outlines for what it needs. On the mat (a strip below) lie gifts of different sizes: a flat bread (1), a small basket (2), a big basket (3), a sack (5);
 * under every gift as many little loaf marks as it counts (no figures). The child drags a gift into a basket (or taps the gift, then the family; on the keyboard left/right a gift,
 * up/down a family, Enter; Delete takes the last gift of the family back). A gift that brings more than the family needs springs back: a cross and a word, a mistake. A gift in a basket
 * can be tapped and taken back (no mistake). When every basket is exactly full and the mat is empty, the families are glad. Round 1: three families, round 2: four.
 * "Help me" after fifteen seconds puts one gift where it still works out, or takes one back when nothing fits any more. Stars: `osterStars(mistakes)`.
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
import { fillFits, fillHelp } from '@/utils/pfingstenNeuA'
import type { FillGame, FillGift } from '@/utils/pfingstenNeuA'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: FillGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every family of every round with a full basket
progress.setGoal(props.game.rounds.reduce((s, r) => s + r.families.length, 0))

const IDLE_SECONDS = 15
const TAP_PX = 8

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const fams = computed(() => current.value.families)
/** For every gift of the round the family it lies with (-1: still on the mat), and the order in which they were laid. */
const at = ref<number[]>(props.game.rounds[0]!.gifts.map(() => -1))
const laidOrder = ref<number[]>([])
const selected = ref(-1)
const cursor = ref(-1)
const drag = reactive({ item: -1, x: 0, y: 0, sx: 0, sy: 0, moved: 0 })
const mistakes = ref(0)
const idle = ref(0)
const between = ref(false)
const glad = ref(false)
const finished = ref(false)
const crossAt = ref<number | null>(null)
const tickAt = ref<number | null>(null)
const bounce = ref(-1)
const message = ref('')
let messageSeq = 0
let markSeq = 0
let credited = new Set<number>()
const field = ref<HTMLElement | null>(null)
const famEls = ref<HTMLElement[]>([])
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => osterStars(mistakes.value))
const giftOf = (size: number): FillGift => props.game.gifts.find((g) => g.size === size) ?? { size, image: '', name: String(size) }
const have = computed(() => fams.value.map((_, f) => current.value.gifts.reduce((s, g, i) => (at.value[i] === f ? s + g : s), 0)))
const free = computed(() => current.value.gifts.map((_, i) => i).filter((i) => at.value[i] === -1))
const famName = (f: number) => props.game.families[fams.value[f]!.family]?.name ?? ''

function say(text: string, ms = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}
function flash(kind: 'good' | 'bad', f: number) {
  const id = ++markSeq
  tickAt.value = kind === 'good' ? f : null
  crossAt.value = kind === 'bad' ? f : null
  later(() => {
    if (markSeq !== id) return
    tickAt.value = null
    crossAt.value = null
  }, 900)
}
function idleLoop() {
  if (!between.value && !finished.value && drag.item < 0) idle.value += 0.25
  later(idleLoop, 250)
}
later(idleLoop, 250)

/** Gift `i` into the basket of family `f`. */
function put(i: number, f: number, helped = false) {
  if (between.value || finished.value || at.value[i] !== -1 || !fams.value[f]) return
  idle.value = 0
  selected.value = -1
  const size = current.value.gifts[i]!
  if (!fillFits(fams.value[f]!.need, have.value[f]!, size)) {
    mistakes.value++
    play('wrong')
    flash('bad', f)
    bounce.value = i
    later(() => {
      if (bounce.value === i) bounce.value = -1
    }, 600)
    say(t('app.adventure.fillTooMuch'))
    return
  }
  at.value[i] = f
  laidOrder.value.push(i)
  play('basket')
  if (have.value[f] === fams.value[f]!.need) {
    flash('good', f)
    if (!credited.has(f)) {
      credited.add(f)
      progress.mark()
    }
    say(t('app.adventure.fillEnough', { name: famName(f) }), 2000)
  } else say(t(helped ? 'app.adventure.fillHelped' : 'app.adventure.fillIn'), 1600)
  if (fams.value.every((x, k) => have.value[k] === x.need)) endRound()
  else if (!free.value.some((g) => fams.value.some((x, k) => fillFits(x.need, have.value[k]!, current.value.gifts[g]!)))) say(t('app.adventure.fillStuck'), 0)
}

/** A gift in a basket is taken back to the mat (no mistake). */
function takeBack(i: number) {
  if (between.value || finished.value || at.value[i] === -1) return
  idle.value = 0
  at.value[i] = -1
  laidOrder.value = laidOrder.value.filter((k) => k !== i)
  play('tap')
  say(t('app.adventure.fillBack'), 1800)
}

function endRound() {
  between.value = true
  glad.value = true
  cursor.value = -1
  later(() => play('right'), 300)
  say(t('app.adventure.fillAll'), 0)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 2600)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 1500)
  later(() => {
    round.value++
    at.value = current.value.gifts.map(() => -1)
    laidOrder.value = []
    credited = new Set<number>()
    selected.value = -1
    glad.value = false
    between.value = false
    idle.value = 0
    message.value = ''
  }, 3000)
}

// ---- the finger
function famAt(e: { clientX: number; clientY: number }): number {
  for (let f = 0; f < famEls.value.length; f++) {
    const r = famEls.value[f]?.getBoundingClientRect()
    if (r && r.width && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) return f
  }
  return -1
}
function onMove(e: PointerEvent) {
  if (drag.item < 0) return
  drag.x = e.clientX
  drag.y = e.clientY
  drag.moved = Math.max(drag.moved, Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy))
}
function unlisten() {
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', stopDrag)
  window.removeEventListener('pointercancel', stopDrag)
}
function stopDrag(e?: PointerEvent) {
  unlisten()
  const i = drag.item
  drag.item = -1
  if (i < 0 || !e || e.type !== 'pointerup') return
  const moved = Math.max(drag.moved, Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy))
  if (moved < TAP_PX) {
    pick(i)
    return
  }
  const f = famAt(e)
  if (f < 0) {
    say(t('app.adventure.fillMiss'))
    return
  }
  put(i, f)
}
function down(e: PointerEvent, i: number) {
  if (e.button > 0 || between.value || finished.value) return
  idle.value = 0
  drag.item = i
  drag.sx = drag.x = e.clientX
  drag.sy = drag.y = e.clientY
  drag.moved = 0
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', stopDrag)
  window.addEventListener('pointercancel', stopDrag)
}
onBeforeUnmount(() => unlisten())
function pick(i: number) {
  if (between.value || finished.value) return
  idle.value = 0
  selected.value = selected.value === i ? -1 : i
  if (selected.value >= 0) say(t('app.adventure.fillPicked', { gift: giftOf(current.value.gifts[i]!).name }), 3200)
}
function giftClick(e: MouseEvent, i: number) {
  if (e.detail === 0) pick(i)
}
function tapFamily(f: number) {
  if (between.value || finished.value) return
  if (selected.value < 0) {
    say(t('app.adventure.fillPickFirst'))
    return
  }
  put(selected.value, f)
}

// ---- the keyboard
function onKey(e: KeyboardEvent) {
  if (between.value || finished.value) return
  const k = e.key
  const nf = fams.value.length
  if (k === 'ArrowLeft' || k === 'ArrowRight') {
    e.preventDefault()
    idle.value = 0
    const list = free.value
    if (!list.length) return
    const p = list.indexOf(selected.value)
    selected.value = list[p < 0 ? 0 : (p + (k === 'ArrowRight' ? 1 : -1) + list.length) % list.length]!
    announce()
    return
  }
  if (k === 'ArrowUp' || k === 'ArrowDown') {
    e.preventDefault()
    idle.value = 0
    cursor.value = cursor.value < 0 ? 0 : (cursor.value + (k === 'ArrowDown' ? 1 : -1) + nf) % nf
    announce()
    return
  }
  if (k === 'Delete' || k === 'Backspace') {
    e.preventDefault()
    const f = cursor.value
    const last = [...laidOrder.value].reverse().find((i) => at.value[i] === f)
    if (last !== undefined) takeBack(last)
    return
  }
  if (k === 'Enter' || k === ' ') {
    e.preventDefault()
    if (selected.value < 0 && free.value.length) selected.value = free.value[0]!
    if (cursor.value < 0) {
      cursor.value = 0
      announce()
      return
    }
    if (selected.value >= 0) put(selected.value, cursor.value)
  }
}
function announce() {
  const gift = selected.value >= 0 ? giftOf(current.value.gifts[selected.value]!).name : ''
  const fam = cursor.value >= 0 ? famName(cursor.value) : ''
  if (gift && fam) say(t('app.adventure.fillChoice', { gift, name: fam }), 0)
  else if (gift) say(t('app.adventure.fillPicked', { gift }), 0)
  else if (fam) say(fam, 0)
}

/** "Help me": one gift where everything still works out; when nothing works out any more, the last gift is taken back. */
function helpMe() {
  idle.value = 0
  const sizes = free.value.map((i) => current.value.gifts[i]!)
  const h = fillHelp(fams.value.map((x) => x.need), have.value, sizes)
  if (h) {
    put(free.value[h.gift]!, h.family, true)
    return
  }
  const last = laidOrder.value[laidOrder.value.length - 1]
  if (last !== undefined) takeBack(last)
  say(t('app.adventure.fillStuck'), 4000)
}

// ---- looks
const famW = computed(() => Math.min(22, 88 / Math.max(1, fams.value.length)))
const famX = (f: number) => ((f + 0.5) / fams.value.length) * 100
const famStyle = (f: number) => ({ left: `${famX(f)}%`, width: `${famW.value}%` })
const chipStyle = (f: number, k: number, count: number) => ({ left: `${famX(f) + (k - (count - 1) / 2) * famW.value * 0.4}%`, width: `${famW.value * 0.42}%` })
const giftsOf = (f: number) => laidOrder.value.filter((i) => at.value[i] === f)
const famLabel = (f: number) => t('app.adventure.fillFamily', { name: famName(f), n: have.value[f], total: fams.value[f]!.need })
const setFam = (el: unknown, f: number) => {
  if (el instanceof HTMLElement) famEls.value[f] = el
}
const ghostStyle = computed(() => ({ left: `${drag.x}px`, top: `${drag.y}px` }))
const doneCount = computed(() => fams.value.filter((x, k) => have.value[k] === x.need).length)
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        ref="field"
        class="gm-field"
        :style="{ backgroundImage: `url(${src(game.yard)})` }"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.fillField')"
        @keydown="onKey"
      )
        template(v-for="(x, f) in fams" :key="`fam-${round}-${f}`")
          button(
            :ref="(el) => setFam(el, f)"
            type="button"
            class="gm-fam"
            :class="{ armed: selected >= 0 || drag.item >= 0, cursor: cursor === f }"
            :data-family="f"
            :style="famStyle(f)"
            :aria-label="famLabel(f)"
            tabindex="-1"
            @click="tapFamily(f)"
          )
            span(class="gm-people")
              GameImage(:src="glad ? game.families[x.family].happy : game.families[x.family].image" :ratio="0.833" colour="#c9b48a" :label="game.families[x.family].name")
            span(class="gm-basket")
              GameImage(:src="game.basket" :ratio="1.3" colour="#a8814a" label="korb-leer")
            span(class="gm-need")
              span(v-for="k in x.need" :key="k" class="gm-loaf" :class="{ full: k <= have[f] }")
                GameImage(:src="k <= have[f] ? game.markFull : game.markEmpty" :ratio="1" colour="#d6b27a" :label="k <= have[f] ? 'zeichen-brot' : 'zeichen-leer'")
            span(v-if="tickAt === f" class="gm-mark")
              GameMark(kind="good")
            span(v-if="crossAt === f" class="gm-mark")
              GameMark(kind="bad")
          button(
            v-for="(gi, k) in giftsOf(f)"
            :key="`chip-${round}-${gi}`"
            type="button"
            class="gm-chip"
            :data-chip="gi"
            :style="chipStyle(f, k, giftsOf(f).length)"
            :aria-label="t('app.adventure.fillTakeBack', { gift: giftOf(current.gifts[gi]).name })"
            :disabled="between"
            @click="takeBack(gi)"
          )
            GameImage(:src="giftOf(current.gifts[gi]).image" :ratio="1" colour="#d6b27a" :label="giftOf(current.gifts[gi]).name")
      div(class="gm-tray" role="group" :aria-label="t('app.adventure.fillTray')")
        template(v-for="(size, i) in current.gifts" :key="`gift-${round}-${i}`")
          button(
            v-if="at[i] === -1"
            type="button"
            class="gm-gift"
            :class="{ sel: selected === i, held: drag.item === i && drag.moved >= TAP_PX, bounce: bounce === i }"
            :data-gift="i"
            :data-size="size"
            :aria-label="t('app.adventure.fillGift', { gift: giftOf(size).name, n: size })"
            :aria-pressed="selected === i ? 'true' : 'false'"
            :disabled="between"
            @pointerdown.prevent="down($event, i)"
            @click="giftClick($event, i)"
          )
            GameImage(:src="giftOf(size).image" :ratio="1" colour="#d6b27a" :label="giftOf(size).name")
            span(class="gm-marks" aria-hidden="true")
              span(v-for="k in size" :key="k" class="gm-loaf")
                GameImage(:src="game.markFull" :ratio="1" colour="#d6b27a" label="zeichen-brot")
      div(v-if="drag.item >= 0 && drag.moved >= TAP_PX" class="gm-ghost" :style="ghostStyle" aria-hidden="true")
        GameImage(:src="giftOf(current.gifts[drag.item] ?? 1).image" :ratio="1" colour="#d6b27a")
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.fillCount', { n: doneCount, total: fams.length }) }}
      AdvButton(v-if="idle > IDLE_SECONDS && !between" tone="gold" @click="helpMe") {{ t('app.adventure.fillHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.fillDone')" @next="emit('done', stars)")
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
  aspect-ratio: 3 / 2
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #8a6a48
  background-size: cover
  background-position: center
  touch-action: none

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

// a family with its basket: one button (the place to drop a gift)
.gm-fam
  position: absolute
  top: 2%
  bottom: 2%
  display: flex
  flex-direction: column
  align-items: center
  min-width: 44px
  padding: 0
  transform: translateX(-50%)
  border: 3px dashed transparent
  border-radius: 14px
  background: transparent
  cursor: pointer
  z-index: 2

  &.armed
    border-color: rgba(255, 246, 220, 0.85)

  &.cursor
    border-color: #fff6dc
    border-style: solid
    box-shadow: 0 0 0 3px rgba(40, 25, 5, 0.55)

.gm-people
  width: 100%
  display: block
  filter: drop-shadow(0 3px 4px rgba(40, 25, 5, 0.35))

.gm-basket
  width: 90%
  display: block
  margin-top: -6%

.gm-need, .gm-marks
  display: flex
  justify-content: center
  gap: 1px

.gm-need
  width: 100%
  padding: 2px
  border-radius: 8px
  background: rgba(255, 246, 220, 0.8)

.gm-loaf
  width: 14px
  display: block
  opacity: 0.75

  &.full
    opacity: 1

.gm-chip
  position: absolute
  top: 50%
  padding: 0
  border: 0
  background: transparent
  transform: translateX(-50%)
  cursor: pointer
  z-index: 4
  filter: drop-shadow(0 2px 3px rgba(40, 25, 5, 0.45))

  // at least 44 x 44 pixels to tap
  &::after
    content: ''
    position: absolute
    left: 50%
    top: 50%
    width: max(100%, 44px)
    height: max(100%, 44px)
    transform: translate(-50%, -50%)

.gm-mark
  position: absolute
  top: 30%
  left: 50%
  display: block
  margin-left: -15px
  pointer-events: none
  z-index: 6

.gm-tray
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 8px
  min-height: 92px

.gm-gift
  display: flex
  flex-direction: column
  align-items: center
  width: 80px
  min-height: 88px
  padding: 4px
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
    transform: scale(1.06)

  &.held
    opacity: 0.4

  &.bounce
    animation: gm-bounce 500ms ease

.gm-ghost
  position: fixed
  width: 70px
  display: block
  transform: translate(-50%, -50%)
  pointer-events: none
  z-index: 50

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

@keyframes gm-bounce
  0%, 100%
    transform: translateY(0)
  30%
    transform: translateY(-8px)

@media (prefers-reduced-motion: reduce)
  .gm-gift
    transition: none

    &.bounce
      animation: none
</style>
