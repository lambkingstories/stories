<script setup lang="ts">
/**
 * Meet the son (Luke 15,20-24). Round 1, the run: on a country road the son stands far to the left, tired and looking at the ground; in the gate of the estate at the right stands his father, who has seen him from afar.
 * Two big feet are the buttons: the father runs one step to his son whenever the child taps the feet in turn, left, right, left, right (twelve steps; a sign "Now" shows the foot that comes next; the same foot twice only says
 * "In turn!", it is no mistake and nothing is lost; with the keyboard the arrow keys left and right do the same). At the end the father falls on the neck of his son (one picture of the embrace replaces both).
 * Round 2, the gifts: in the yard stands the son in rags, and three gifts lie in a row below (robe, ring, shoes). The child drags a gift to the son, or taps the gift and then the son (or Enter on both): in any order; the son
 * wears the robe, then everything. Nothing can be wrong, so all three stars are given at the end. The arithmetic is in `utils/gleichnisseGames.ts`.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { useDragDrop } from '@/use/useDragDrop'
import { MEET_GIFTS, meetArrived, meetEmbraceX, meetFatherX, meetGive, meetNext, meetOutfit, meetTap } from '@/utils/gleichnisseGames'
import type { Foot } from '@/utils/gleichnisseGames'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { MeetGame, MeetGiftId } from '@/types/adventure'

const props = defineProps<{ game: MeetGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every step of the run and every gift
progress.setGoal(props.game.steps + MEET_GIFTS.length)

/** Nothing can go wrong in this game: all three stars. */
const stars = 3
const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const isRun = computed(() => current.value.kind === 'run')
const steps = ref(0)
const last = ref<Foot | null>(null)
const given = ref<string[]>([])
const sparkle = ref(0)
const finished = ref(false)
const message = ref('')
let messageSeq = 0
const src = (p: string) => prependBaseUrl(p)
const arrived = computed(() => meetArrived(steps.value, props.game.steps))
const fatherX = computed(() => meetFatherX(steps.value, props.game.steps, props.game.father.x, props.game.meet))
const embraceX = computed(() => meetEmbraceX(props.game.son.x, props.game.meet))
const next = computed(() => meetNext(last.value))
const outfit = computed(() => meetOutfit(given.value))
const sonSprite = computed(() => (outfit.value === 'dressed' ? props.game.dressed : outfit.value === 'robed' ? props.game.robed : props.game.ragged))
const hint = computed(() => current.value.hint)

function say(text: string, ms = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}

function toGifts() {
  round.value = Math.min(props.game.rounds.length - 1, round.value + 1)
  message.value = ''
}

/** One tap on a foot. */
function foot(which: Foot) {
  if (!isRun.value || arrived.value || finished.value) return
  const r = meetTap(steps.value, last.value, which, props.game.steps)
  if (!r.moved) {
    say(t('app.adventure.meetAlternate'))
    return
  }
  steps.value = r.steps
  last.value = r.last
  progress.mark()
  play('tap')
  if (steps.value === 1) say(t('app.adventure.meetStart'), 2200)
  if (meetArrived(steps.value, props.game.steps)) {
    play('right')
    say(t('app.adventure.meetEmbrace'), 0)
    later(toGifts, 2600)
  }
}

function onFieldKey(e: KeyboardEvent) {
  if (!isRun.value) return
  if (e.key === 'ArrowLeft') {
    e.preventDefault()
    foot('left')
  } else if (e.key === 'ArrowRight') {
    e.preventDefault()
    foot('right')
  }
}

const giftOf = (id: string) => props.game.gifts.find((g) => g.id === id)
const giftName = (id: string) => giftOf(id)?.label ?? id

function give(id: string) {
  const r = meetGive(given.value, id)
  if (!r.fresh) return
  given.value = r.given
  progress.mark()
  sparkle.value++
  play(id === 'ring' ? 'coin' : 'snap')
  say(t('app.adventure.meetGiven', { name: giftName(id) }), 2200)
  if (r.given.length >= MEET_GIFTS.length) {
    play('right')
    later(() => {
      play('star')
      finished.value = true
    }, 2000)
  }
}

const { dragging, selected, down, tapPlace, toggleSelect, dragStyle } = useDragDrop((id, target) => {
  if (target === 'son') give(id)
})
function sonTap() {
  tapPlace('son')
}
const isGiven = (id: MeetGiftId) => given.value.includes(id)
const fatherStyle = computed(() => ({ left: `${fatherX.value}%`, top: `${props.game.father.y}%`, width: `${props.game.father.w}%` }))
const sonStyle = computed(() => ({ left: `${props.game.son.x}%`, top: `${props.game.son.y}%`, width: `${props.game.son.w}%` }))
const embraceStyle = computed(() => ({ left: `${embraceX.value}%`, top: `${props.game.son.y}%`, width: `${props.game.embrace.w}%` }))
const yardSonStyle = computed(() => ({ left: `${props.game.ragged.x}%`, top: `${props.game.ragged.y}%`, width: `${sonSprite.value.w}%` }))
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ hint }}
      template(v-if="isRun")
        div(
          class="gm-field"
          :style="{ backgroundImage: `url(${src(game.road)})` }"
          role="group"
          tabindex="0"
          :aria-label="t('app.adventure.meetField')"
          @keydown="onFieldKey"
        )
          template(v-if="!arrived")
            div(class="gm-son" :style="sonStyle" role="img" :aria-label="game.son.label")
              GameImage(:src="game.son.image" :ratio="0.55" colour="#a5835a" :label="game.son.label")
            div(class="gm-father" :style="fatherStyle" role="img" :aria-label="game.father.label")
              GameImage(:src="game.father.image" :ratio="0.55" colour="#d9d2bf" :label="game.father.label")
          div(v-else class="gm-embrace" :style="embraceStyle" role="img" :aria-label="game.embrace.label")
            GameImage(:src="game.embrace.image" :ratio="0.8" colour="#c9a24a" :label="game.embrace.label")
            span(class="gm-mark" aria-hidden="true")
              GameMark(kind="good")
        div(class="gm-feet")
          button(
            type="button"
            class="gm-foot"
            :class="{ next: next === null || next === 'left' }"
            :aria-label="t('app.adventure.meetLeft')"
            :disabled="arrived"
            @click="foot('left')"
          )
            span(class="gm-sole" aria-hidden="true") 🦶
            span(class="gm-footname") {{ t('app.adventure.meetLeft') }}
            span(v-if="next === null || next === 'left'" class="gm-now" aria-hidden="true") ▲ {{ t('app.adventure.meetNow') }}
          button(
            type="button"
            class="gm-foot"
            :class="{ next: next === null || next === 'right' }"
            :aria-label="t('app.adventure.meetRight')"
            :disabled="arrived"
            @click="foot('right')"
          )
            span(class="gm-sole right" aria-hidden="true") 🦶
            span(class="gm-footname") {{ t('app.adventure.meetRight') }}
            span(v-if="next === null || next === 'right'" class="gm-now" aria-hidden="true") ▲ {{ t('app.adventure.meetNow') }}
        p(class="gm-count" aria-live="polite") {{ t('app.adventure.meetSteps', { n: steps, total: game.steps }) }}
      template(v-else)
        div(
          class="gm-field"
          :style="{ backgroundImage: `url(${src(game.yard)})` }"
          role="group"
          :aria-label="t('app.adventure.meetYard')"
        )
          div(
            class="gm-yardson"
            :class="{ ready: selected !== null, over: dragging !== null }"
            :style="yardSonStyle"
            data-drop="son"
            role="button"
            tabindex="0"
            :aria-label="t('app.adventure.meetSon')"
            @click="sonTap"
            @keydown.enter.space.prevent="sonTap"
          )
            GameImage(:src="sonSprite.image" :ratio="0.55" colour="#a5835a" :label="sonSprite.label")
            span(:key="sparkle" v-if="sparkle > 0" class="gm-sparkle" aria-hidden="true") ✦ ✦
        div(class="gm-tray" role="group")
          template(v-for="g in game.gifts" :key="g.id")
            span(v-if="isGiven(g.id)" class="gm-gift given" role="img" :aria-label="t('app.adventure.meetGiven', { name: g.label })")
              GameImage(:src="g.image" :ratio="1" colour="#c9a24a" :label="g.label")
              span(class="gm-mark" aria-hidden="true")
                GameMark(kind="good")
            button(
              v-else
              type="button"
              class="gm-gift"
              :class="{ picked: selected === g.id, drag: dragging === g.id }"
              :style="dragStyle(g.id)"
              :aria-label="t('app.adventure.meetGift', { name: g.label })"
              :aria-pressed="selected === g.id"
              @pointerdown="down($event, g.id)"
              @keydown.enter.space.prevent="toggleSelect(g.id)"
            )
              GameImage(:src="g.image" :ratio="1" colour="#c9a24a" :label="g.label")
        p(class="gm-count" aria-live="polite") {{ t('app.adventure.meetGiftsCount', { n: given.length, total: game.gifts.length }) }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.meetDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #efe1bb
  box-shadow: inset 0 0 18px rgba(90, 60, 20, 0.25)
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
  color: #5f4f35

.gm-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #5f4f35

.gm-field
  position: relative
  width: 100%
  aspect-ratio: 3 / 2
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #b9a77a
  background-size: cover
  background-position: center

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 2px

.gm-son, .gm-father, .gm-embrace
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none
  filter: drop-shadow(0 3px 3px rgba(40, 25, 5, 0.4))

.gm-father
  transition: left 280ms ease-out

.gm-embrace
  animation: gm-pop 360ms ease-out both

.gm-mark
  position: absolute
  right: -6px
  top: -10px
  z-index: 6
  pointer-events: none

// the two feet: big buttons (at least 72 pixels), side by side
.gm-feet
  display: flex
  justify-content: center
  gap: 18px

.gm-foot
  position: relative
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  gap: 2px
  min-width: 112px
  min-height: 92px
  padding: 8px 12px 14px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #f2e4b8
  color: #3f321b
  font-family: inherit
  font-weight: 900
  cursor: pointer
  -webkit-tap-highlight-color: transparent
  touch-action: manipulation
  transition: background 100ms ease, scale 100ms ease

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 2px

  &:active
    scale: 0.96

  &.next
    border-width: 5px
    background: #f7e9bc

  &:disabled
    opacity: 0.7
    cursor: default

.gm-sole
  display: block
  font-size: 2.2rem
  line-height: 1

  &.right
    transform: scaleX(-1)

.gm-footname
  font-size: 1rem

// the sign under the foot that comes next
.gm-now
  position: absolute
  left: 50%
  bottom: -2px
  transform: translateX(-50%)
  padding: 0 8px
  border-radius: 999px
  background: #3f321b
  color: #fff6dc
  font-size: 0.8rem
  font-weight: 900
  white-space: nowrap

// the son in the yard: the place for the gifts (at least 44 pixels)
.gm-yardson
  position: absolute
  display: block
  min-width: 44px
  min-height: 44px
  transform: translate(-50%, -100%)
  cursor: pointer
  filter: drop-shadow(0 3px 3px rgba(40, 25, 5, 0.4))
  transition: scale 160ms ease

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px
    border-radius: 14px

  &.ready, &.over
    scale: 1.05
    outline: 3px dashed #fff6dc
    outline-offset: 4px
    border-radius: 14px

.gm-sparkle
  position: absolute
  left: 50%
  top: 14%
  transform: translateX(-50%)
  color: #fff3b0
  font-size: 1.6rem
  font-weight: 900
  text-shadow: 0 0 6px #c9962e, 0 0 12px #c9962e
  pointer-events: none
  white-space: nowrap
  animation: gm-twinkle 1400ms ease-out both

// the gifts: at least 56 pixels
.gm-tray
  display: flex
  justify-content: center
  gap: 16px
  min-height: 72px

.gm-gift
  position: relative
  display: block
  width: 72px
  min-width: 56px
  min-height: 56px
  padding: 4px
  border-radius: 14px
  border: 3px solid #d4a83e
  background: #f2e4b8
  cursor: grab
  touch-action: none
  -webkit-tap-highlight-color: transparent

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 2px

  &.picked
    border-style: dashed
    border-width: 4px
    scale: 1.08

  &.given
    opacity: 0.75
    cursor: default

.gm-count
  margin: 0
  align-self: center
  padding: 2px 14px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  color: #5f4f35

.gm-fb
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

@keyframes gm-pop
  from
    opacity: 0
    scale: 0.7
  to
    opacity: 1
    scale: 1

@keyframes gm-twinkle
  0%
    opacity: 0
    scale: 0.6
  30%
    opacity: 1
    scale: 1.1
  100%
    opacity: 0
    scale: 1

// less motion: the father jumps from step to step, nothing twinkles or pops
@media (prefers-reduced-motion: reduce)
  .gm-father, .gm-yardson, .gm-foot
    transition: none

  .gm-embrace, .gm-sparkle
    animation: none
</style>
