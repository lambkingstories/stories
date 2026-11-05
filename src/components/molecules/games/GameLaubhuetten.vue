<script setup lang="ts">
/**
 * "Booths" (Nehemiah 8,15-16): the hillside before Jerusalem at the left, a house with stairs to its flat roof at the right; on the roof stands the empty frame of a booth.
 * A young man with a basket walks along the path. A tap on a tree sends him there and he picks a branch (one a tap); a tap on the house sends him up the stairs and the branches of his basket are
 * tied to the booth, one place after the other. The booth needs so many branches of olive, myrtle and palm (the panel shows them). The dry thorn bush has no leaves, and a branch of a kind
 * there is enough of is not wanted: both are a mistake (a cross and a line). A full basket is no mistake ("Bring the branches up to the roof!"). Tapping the path sends him there.
 * The trees and the house are buttons: Tab or the arrow keys go from one to the next, Enter sends him. The button "Help me" comes after fifteen seconds without a move and does the next
 * right step for the child. Round 2 needs more branches, and the thorn bush stands among the trees. The arithmetic is `utils/nehemiaNeu.ts`; stars: `osterStars(mistakes)`.
 */
import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { osterStars } from '@/utils/osternGames'
import { BOUGH_KINDS, boothGo, boothNext, boothStart, boothStep, boothTotal } from '@/utils/nehemiaNeu'
import type { BoothGame, BoothGoal, BoothState, BoughKind } from '@/utils/nehemiaNeu'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: BoothGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.rounds.reduce((a, r) => a + boothTotal(r), 0))

const TICK = 0.05
const IDLE_SECONDS = 15
const ratio = computed(() => props.game.ratio ?? 1.5)
const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const st = ref<BoothState>(boothStart(current.value))
const helping = ref(false)
const badAt = ref(-1)
const mistakes = ref(0)
const idle = ref(0)
const finished = ref(false)
const between = ref(false)
const message = ref('')
const field = ref<HTMLElement | null>(null)
const buttons = ref<HTMLElement[]>([])
let messageSeq = 0
const stars = computed(() => osterStars(mistakes.value))

function say(text: string, ms = 2800) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}
const bough = (k: BoughKind) => props.game.boughs[k]

function roundDone() {
  between.value = true
  helping.value = false
  play('right')
  later(() => play('bead'), 200)
  say(t('app.adventure.boothsRoundDone'), 0)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 2400)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 1500)
  later(() => {
    round.value++
    st.value = boothStart(current.value)
    badAt.value = -1
    between.value = false
    message.value = ''
  }, 2900)
}

function loop() {
  if (!finished.value && !between.value) {
    const goal = st.value.goal
    const res = boothStep(props.game, current.value, st.value, TICK)
    st.value = res.state
    for (const ev of res.events) {
      const tree = goal?.type === 'tree' ? goal.tree : -1
      if (ev.type === 'picked') {
        play('tap')
        say(t('app.adventure.boothsPicked', { thing: bough(ev.kind).label }), 2200)
      } else if (ev.type === 'thorn' || ev.type === 'enough') {
        mistakes.value++
        badAt.value = tree
        play('wrong')
        say(ev.type === 'thorn' ? t('app.adventure.boothsThorn') : t('app.adventure.boothsEnough', { things: bough(ev.kind).plural }), 3200)
        later(() => {
          if (badAt.value === tree) badAt.value = -1
        }, 1400)
      } else if (ev.type === 'full') say(t('app.adventure.boothsFull'), 3000)
      else if (ev.type === 'empty') say(t('app.adventure.boothsEmpty'), 2600)
      else if (ev.type === 'built') {
        for (let i = 0; i < ev.n; i++) progress.mark()
        play('bead')
        say(t('app.adventure.boothsBuilt', { n: ev.n }), 2400)
      }
    }
    if (st.value.done) roundDone()
    else {
      // the help does one right step, then the child goes on
      if (helping.value && !st.value.goal && st.value.pause <= 0) helping.value = false
      if (!st.value.goal && !helping.value) idle.value += TICK
      else idle.value = 0
    }
  }
  later(loop, TICK * 1000)
}
later(loop, TICK * 1000)

function send(goal: BoothGoal) {
  if (finished.value || between.value) return
  helping.value = false
  idle.value = 0
  st.value = boothGo(st.value, goal)
}
/** a tap on the path (not on a tree or the house) sends him there */
function walkTo(e: PointerEvent) {
  if (e.button > 0 || e.target !== field.value) return
  const r = field.value?.getBoundingClientRect()
  if (!r || !r.width) return
  send({ type: 'walk', x: Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)) })
}
function setButton(el: unknown, i: number) {
  if (el) buttons.value[i] = el as HTMLElement
}
/** the arrow keys go along the row of trees and the house */
function arrows(e: KeyboardEvent, at: number) {
  const n = current.value.trees.length + 1
  let next: number | null = null
  if (e.key === 'ArrowRight') next = (at + 1) % n
  else if (e.key === 'ArrowLeft') next = (at - 1 + n) % n
  if (next === null) return
  e.preventDefault()
  void nextTick(() => buttons.value[next!]?.focus())
}

const showHelp = computed(() => idle.value > IDLE_SECONDS && !between.value && !finished.value && !helping.value)
function helpMe() {
  idle.value = 0
  const goal = boothNext(props.game, current.value, st.value)
  if (!goal) return
  helping.value = true
  st.value = boothGo(st.value, goal)
  if (goal.type === 'stairs') say(t('app.adventure.boothsHelpingRoof'), 3200)
  else if (goal.type === 'tree') say(t('app.adventure.boothsHelpingTree', { thing: bough(current.value.trees[goal.tree]!.kind as BoughKind).label }), 3200)
}

// ---- looks
const g = computed(() => props.game)
const treeStyle = (x: number, w: number) => ({ left: `${x}%`, top: `${g.value.hill}%`, width: `${w}%`, zIndex: 10 })
const walkerStyle = computed(() => ({ left: `${st.value.x}%`, top: `${g.value.road}%`, width: `${g.value.walker.w}%`, zIndex: 30 }))
const houseStyle = computed(() => {
  const h = g.value.house
  return { left: `${h.left}%`, top: `${h.top}%`, width: `${h.right - h.left}%`, height: `${h.bottom - h.top}%`, zIndex: 5 }
})
const slotStyle = (k: number) => {
  const s = g.value.slots[k]!
  return { left: `${s.x}%`, top: `${s.y}%`, width: `${s.w}%`, transform: `translate(-50%, -50%) rotate(${s.rot}deg)`, zIndex: 8 }
}
const walking = computed(() => !!st.value.goal && st.value.pause <= 0)
const have = (k: BoughKind) => st.value.built.filter((b) => b === k).length
const total = computed(() => boothTotal(current.value))
const treeLabel = (i: number) => {
  const tr = current.value.trees[i]!
  return t('app.adventure.boothsTree', { tree: g.value.trees[tr.kind]?.label ?? tr.kind })
}
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      ul(class="gm-need" :aria-label="t('app.adventure.boothsNeedTitle')")
        li(v-for="k in BOUGH_KINDS" :key="k" class="gm-need-item" :class="{ full: have(k) >= current.need[k] }")
          span(class="gm-need-pic")
            GameImage(:src="game.boughs[k].image" :ratio="1" colour="#6a8a3a" :label="game.boughs[k].label")
          span {{ t('app.adventure.boothsNeed', { things: game.boughs[k].plural, n: have(k), total: current.need[k] }) }}
          span(v-if="have(k) >= current.need[k]" class="gm-tick")
            GameMark(kind="good")
      div(
        ref="field"
        class="gm-field"
        :style="{ backgroundImage: `url(${prependBaseUrl(game.background)})`, aspectRatio: String(ratio) }"
        role="group"
        :aria-label="t('app.adventure.boothsField')"
        @pointerdown="walkTo"
        @contextmenu.prevent
      )
        template(v-for="(b, k) in st.built" :key="`b-${round}-${k}`")
          span(v-if="game.slots[k]" class="gm-slot" :style="slotStyle(k)" aria-hidden="true")
            GameImage(:src="game.boughs[b].image" :ratio="1" colour="#6a8a3a" :label="game.boughs[b].label")
        button(
          :ref="(el) => setButton(el, current.trees.length)"
          type="button"
          class="gm-house"
          :style="houseStyle"
          :aria-label="t('app.adventure.boothsHouse', { n: st.built.length, total })"
          @click="send({ type: 'stairs' })"
          @keydown="arrows($event, current.trees.length)"
        )
          span(v-if="st.done" class="gm-mark")
            GameMark(kind="good")
        template(v-for="(tr, i) in current.trees" :key="`t-${round}-${i}`")
          button(
            :ref="(el) => setButton(el, i)"
            type="button"
            class="gm-tree"
            :style="treeStyle(tr.x, tr.w)"
            :aria-label="treeLabel(i)"
            @click="send({ type: 'tree', tree: i })"
            @keydown="arrows($event, i)"
          )
            GameImage(:src="game.trees[tr.kind].image" :ratio="0.8" colour="#5f7f3a" :label="game.trees[tr.kind].label")
            span(v-if="badAt === i" class="gm-mark")
              GameMark(kind="bad")
        div(class="gm-walker" :class="{ walking, left: st.left }" :style="walkerStyle" role="img" :aria-label="t('app.adventure.boothsBasket', { n: st.basket.length, total: current.carry })")
          span(class="gm-bob")
            GameImage(:src="game.walker.image" :ratio="1" colour="#b08850" :label="game.walker.label")
          span(class="gm-load" aria-hidden="true")
            span(v-for="(b, k) in st.basket" :key="k" class="gm-load-item")
              GameImage(:src="game.boughs[b].image" :ratio="1" colour="#6a8a3a" :label="game.boughs[b].label")
      p(class="gm-count") {{ t('app.adventure.boothsBasket', { n: st.basket.length, total: current.carry }) }}
      AdvButton(v-if="showHelp" tone="gold" @click="helpMe") {{ t('app.adventure.boothsHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.boothsDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
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
  color: #5a4a2c

.gm-hint, .gm-count
  margin: 0
  text-align: center
  font-weight: 700
  font-size: 1rem
  color: #5a4a2c

.gm-need
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 6px 12px
  margin: 0
  padding: 0
  list-style: none

.gm-need-item
  position: relative
  display: flex
  align-items: center
  gap: 6px
  padding: 2px 10px 2px 4px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 1rem
  color: #4a3a18

  &.full
    background: #e3f0d2

.gm-need-pic
  display: block
  width: 40px

.gm-tick
  display: block
  transform: scale(0.8)

.gm-field
  position: relative
  align-self: center
  width: min(100%, 92vh)
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #b8c890
  background-size: cover
  background-position: center
  touch-action: none
  cursor: pointer
  -webkit-touch-callout: none

.gm-tree
  position: absolute
  display: block
  min-width: 44px
  min-height: 44px
  padding: 0
  border: 0
  border-radius: 14px
  background: transparent
  transform: translate(-50%, -100%)
  cursor: pointer
  filter: drop-shadow(0 3px 3px rgba(40, 35, 10, 0.3))

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 2px

.gm-house
  position: absolute
  display: block
  padding: 0
  border: 0
  border-radius: 14px
  background: transparent
  cursor: pointer

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: -3px

.gm-slot
  position: absolute
  display: block
  pointer-events: none
  filter: drop-shadow(0 2px 2px rgba(40, 35, 10, 0.3))
  animation: gm-tie 360ms ease-out

.gm-walker
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none
  filter: drop-shadow(0 3px 3px rgba(50, 35, 10, 0.35))
  transition: left 50ms linear

  &.left .gm-bob
    transform: scaleX(-1)

.gm-bob
  display: block

.gm-walker.walking .gm-bob
  animation: gm-step 460ms ease-in-out infinite

.gm-walker.left.walking .gm-bob
  animation-name: gm-step-left

.gm-load
  position: absolute
  left: 50%
  top: -18%
  display: flex
  transform: translateX(-50%)

.gm-load-item
  display: block
  width: 44%
  min-width: 26px
  margin: 0 -8%

.gm-mark
  position: absolute
  left: 50%
  top: 30%
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 3

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

@keyframes gm-step
  0%, 100%
    translate: 0 0
  50%
    translate: 0 -3%

@keyframes gm-step-left
  0%, 100%
    translate: 0 0
  50%
    translate: 0 -3%

@keyframes gm-tie
  from
    opacity: 0
    scale: 0.6
  to
    opacity: 1
    scale: 1

@media (prefers-reduced-motion: reduce)
  .gm-walker.walking .gm-bob, .gm-slot
    animation: none

  .gm-walker
    transition: none
</style>
