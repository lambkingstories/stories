<script setup lang="ts">
/**
 * Whom is the word for? (Matthew 5,3-6): on the hillside meadow four listeners sit as in the story (the man with the empty hands, the woman who wipes her eyes, the shepherd on his staff, the young
 * man who leans far forward). The child gives every listener what Jesus says to him: the kingdom of heaven (a small open gate), comfort (a soft cloth), the land (a piece of green earth), to be
 * filled (bread and a jug). Round 1: the sentence is on the screen and its gift lies alone and shines; the child drags it to the listener it fits (or taps the gift and then the listener). Round 2: six
 * gifts lie ready for four listeners, in any order and without a sentence; two of them (a chest of gold, a king's cloak) belong to nobody and go into the basket at the end. After round 2 the four
 * sentences are read once more, one after the other, and each listener rises a little. Right: a tick, a bright tone, a line of words, the listener lifts his head and a soft glow lies under him. Wrong:
 * the gift springs back, a cross, a low tone, a line of words, a mistake. Letting go beside the listeners is no mistake. "Help me" after fifteen seconds makes the right listener (and his gift) shine.
 * Keyboard: Tab to a gift, Enter takes it up, Tab to a listener, Enter gives it to him. Less motion: nothing glides, nothing rises, the gifts and listeners switch. Nothing is shown by colour alone.
 * Stars: `bergStars(mistakes)`.
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
import { bergStars } from '@/utils/bergpredigtGames'
import { BLESSED_RECAP_MS, blessedGift, blessedGiftOf, blessedHeight, blessedHelp, blessedPersonAt, blessedPlace, blessedSentenceOf, blessedStrangers } from '@/utils/bergpredigtNeu'
import type { BlessedGame, BlessedPerson } from '@/utils/bergpredigtNeu'
import { prependBaseUrl } from '@/utils/function'

const props = defineProps<{ game: BlessedGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.people.length * props.game.rounds.length)

const IDLE_SECONDS = 15
const still = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

type Phase = 'play' | 'between' | 'recap'
const round = ref(0)
const phase = ref<Phase>('play')
/** The listeners who have their gift in this round. */
const served = ref<string[]>([])
/** The gifts that went into the basket (belong to nobody). */
const basketed = ref<string[]>([])
const held = ref<string | null>(null)
const mistakes = ref(0)
const idle = ref(0)
const helping = ref(false)
const finished = ref(false)
const message = ref('')
const recapAt = ref(-1)
const bounce = ref<string | null>(null)
const picked = ref<{ id: string; kind: 'good' | 'bad' } | null>(null)
const wrapEl = ref<HTMLElement | null>(null)
const fieldEl = ref<HTMLElement | null>(null)
const drag = reactive<{ gift: string; x: number; y: number; moved: number }>({ gift: '', x: 0, y: 0, moved: 0 })
const downAt = ref({ x: 0, y: 0 })
let messageSeq = 0
let pickSeq = 0

const src = (p: string) => prependBaseUrl(p)
const ratio = computed(() => props.game.ratio ?? 1.5)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const stars = computed(() => bergStars(mistakes.value))
const total = props.game.people.length * props.game.rounds.length
const countText = computed(() => t('app.adventure.beatitudeCount', { n: progress.parts.value, total }))

/** The gifts that lie on the tray: round 1 only the gift of the sentence that is on, round 2 every gift that is neither given nor in the basket. */
const trayGifts = computed(() => {
  if (current.value.mode === 'sentence') {
    const id = current.value.order[served.value.length]
    const g = id ? blessedGiftOf(props.game, id) : undefined
    return g && phase.value === 'play' ? [g] : []
  }
  return props.game.gifts.filter((g) => !basketed.value.includes(g.id) && !(g.forPerson && served.value.includes(g.forPerson)))
})
/** The sentence that is on (round 1). */
const sentence = computed(() => {
  if (current.value.mode !== 'sentence' || phase.value !== 'play') return recapAt.value >= 0 ? props.game.sentences[recapAt.value] : undefined
  const id = current.value.order[served.value.length]
  return id ? blessedSentenceOf(props.game, id) : undefined
})
const sentenceText = computed(() => (sentence.value ? t('app.adventure.beatitudeSays', { text: sentence.value.text }) : ''))
/** The gift each listener holds (shown beside him once given). */
const givenGift = (p: BlessedPerson) => (served.value.includes(p.id) ? blessedGiftOf(props.game, p.id) : undefined)
const help = computed(() => (helping.value && phase.value === 'play' ? blessedHelp(props.game, round.value, served.value, held.value ?? undefined) : null))

function say(text: string, ms = 3200) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}
function pick(id: string, kind: 'good' | 'bad') {
  const n = ++pickSeq
  picked.value = { id, kind }
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

// ---- the pointer: drag a gift (or tap it and then the listener)
function toPercent(e: { clientX: number; clientY: number }): { x: number; y: number } | null {
  const r = fieldEl.value?.getBoundingClientRect()
  if (!r || r.width <= 0 || r.height <= 0) return null
  return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }
}
function down(e: PointerEvent, id: string) {
  if (phase.value !== 'play' || finished.value) return
  touched()
  const p = toPercent(e)
  drag.gift = id
  drag.x = p?.x ?? 50
  drag.y = p?.y ?? 50
  drag.moved = 0
  downAt.value = { x: e.clientX, y: e.clientY }
  ;(wrapEl.value as HTMLElement | null)?.setPointerCapture?.(e.pointerId)
}
function move(e: PointerEvent) {
  if (!drag.gift) return
  const p = toPercent(e)
  if (p) {
    drag.x = p.x
    drag.y = p.y
  }
  drag.moved = Math.max(drag.moved, Math.hypot(e.clientX - downAt.value.x, e.clientY - downAt.value.y))
}
function up(e: PointerEvent) {
  if (!drag.gift) return
  const id = drag.gift
  const moved = drag.moved
  drag.gift = ''
  if (moved < 8) {
    // a tap: the gift is taken up, the next tap on a listener gives it to him
    toggleHeld(id)
    return
  }
  const p = toPercent(e)
  const who = p ? blessedPersonAt(props.game, p) : null
  if (who) give(id, who)
}
/** The keyboard (and a click without a pointer): take the gift up or put it down. */
function giftClick(e: MouseEvent, id: string) {
  if (e.detail !== 0) return
  touched()
  toggleHeld(id)
}
function toggleHeld(id: string) {
  if (phase.value !== 'play') return
  held.value = held.value === id ? null : id
  if (held.value) say(t('app.adventure.beatitudePick'), 0)
  else say('', 1)
}
function personClick(id: string) {
  if (phase.value !== 'play' || finished.value) return
  touched()
  if (!held.value) {
    say(t('app.adventure.beatitudeTake'), 3000)
    return
  }
  give(held.value, id)
}

function give(giftId: string, personId: string) {
  if (phase.value !== 'play') return
  touched()
  held.value = null
  const r = blessedPlace(props.game, giftId, personId, served.value)
  if (r === 'taken') return
  if (r !== 'ok') {
    mistakes.value++
    play('wrong')
    pick(personId, 'bad')
    bounce.value = giftId
    later(() => (bounce.value = null), 600)
    say(t(current.value.mode === 'sentence' ? 'app.adventure.beatitudeWrong' : 'app.adventure.beatitudeWrongGift'), 3600)
    return
  }
  served.value = [...served.value, personId]
  progress.mark()
  play('right')
  pick(personId, 'good')
  say(t('app.adventure.beatitudeRight'), 0)
  if (served.value.length < props.game.people.length) {
    if (current.value.mode === 'sentence') {
      phase.value = 'between'
      later(() => {
        say('', 1)
        phase.value = 'play'
      }, 1700)
    }
    return
  }
  endRound()
}

function endRound() {
  phase.value = 'between'
  if (current.value.mode === 'sentence') {
    later(() => say(t('app.adventure.beatitudeRoundDone'), 0), 900)
    later(() => {
      round.value++
      served.value = []
      basketed.value = []
      phase.value = 'play'
      say('', 1)
    }, 3000)
    return
  }
  // round 2: the gifts that belong to nobody go into the basket, then the four sentences are read once more
  later(() => {
    basketed.value = blessedStrangers(props.game).map((g) => g.id)
    play('tap')
    say(t('app.adventure.beatitudeBasket'), 0)
  }, 1500)
  later(() => {
    phase.value = 'recap'
    say(t('app.adventure.beatitudeRecap'), 0)
    props.game.sentences.forEach((_, i) => later(() => (recapAt.value = i), 1600 + i * BLESSED_RECAP_MS))
    later(() => {
      recapAt.value = -1
      play('star')
      finished.value = true
    }, 1600 + props.game.sentences.length * BLESSED_RECAP_MS + 600)
  }, 3400)
}

function helpMe() {
  touched()
  if (phase.value !== 'play') return
  helping.value = true
  say(t('app.adventure.beatitudeHelpGo'), 4200)
}

// ---- looks
const personStyle = (p: BlessedPerson) => {
  const h = blessedHeight(props.game, p)
  return { left: `${p.x - p.w / 2}%`, top: `${p.y - h}%`, width: `${p.w}%`, zIndex: String(Math.round(p.y * 10)) }
}
const glowStyle = (p: BlessedPerson) => ({ left: `${p.x}%`, top: `${p.y}%`, width: `${p.w * 1.7}%`, zIndex: String(Math.round(p.y * 10) - 1) })
const giftStyle = (p: BlessedPerson) => ({ left: `${p.x + p.w * 0.34}%`, top: `${p.y}%`, zIndex: String(Math.round(p.y * 10) + 2) })
const lifted = (p: BlessedPerson) => served.value.includes(p.id) || (recapAt.value >= 0 && props.game.sentences[recapAt.value]?.personId === p.id)
const ghostImage = computed(() => (drag.gift ? src(blessedGift(props.game, drag.gift)?.image ?? '') : ''))
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
          :aria-label="t('app.adventure.beatitudeField')"
        )
          template(v-for="p in game.people" :key="p.id")
            span(v-if="lifted(p)" class="gm-glow" :data-glow="p.id" :style="glowStyle(p)" aria-hidden="true")
              GameImage(:src="game.glow" :ratio="1" colour="#f2d98a" round :label="`leuchten-${p.id}`")
            button(
              type="button"
              class="gm-person"
              :class="{ lifted: lifted(p), shine: help && help.personId === p.id }"
              :data-person="p.id"
              :style="personStyle(p)"
              :aria-label="p.label"
              @click="personClick(p.id)"
            )
              GameImage(:src="p.image" :ratio="game.peopleRatio" colour="#b79a6a" :label="p.id")
              span(v-if="picked && picked.id === p.id" class="gm-mark")
                GameMark(:kind="picked.kind")
            span(v-if="givenGift(p)" class="gm-given" :data-given="p.id" :style="giftStyle(p)" aria-hidden="true")
              GameImage(:src="givenGift(p)?.image ?? ''" :ratio="1" colour="#d9b86a" :label="givenGift(p)?.id ?? ''")
        p(v-if="sentenceText" class="gm-says" aria-live="polite") {{ sentenceText }}
        div(class="gm-tray" role="group" :aria-label="t('app.adventure.beatitudeGifts')")
          button(
            v-for="g in trayGifts"
            :key="g.id"
            type="button"
            class="gm-gift"
            :class="{ sel: held === g.id, held: drag.gift === g.id && drag.moved >= 8, bounce: bounce === g.id, shine: (help && help.giftId === g.id) || (current.mode === 'sentence' && !held) }"
            :data-gift="g.id"
            :aria-label="g.label"
            :aria-pressed="held === g.id"
            @pointerdown.prevent="down($event, g.id)"
            @click="giftClick($event, g.id)"
          )
            GameImage(:src="g.image" :ratio="1" colour="#d9b86a" :label="g.id")
            span(class="gm-cap") {{ g.caption }}
          span(v-if="current.mode === 'free'" class="gm-basket" :class="{ full: basketed.length > 0 }" role="img" :aria-label="t('app.adventure.beatitudeBasketLabel')")
            GameImage(:src="game.basket" :ratio="1.2" colour="#a98a58" :label="'korb'")
        img(v-if="drag.gift && drag.moved >= 8" class="gm-ghost" :src="ghostImage" alt="" :style="{ left: `${drag.x}%`, top: `${drag.y}%` }")
      p(class="gm-count" aria-live="polite") {{ countText }}
      div(class="gm-actions")
        AdvButton(v-if="idle >= IDLE_SECONDS && phase === 'play'" tone="gold" @click="helpMe") {{ t('app.adventure.beatitudeHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.beatitudeDone')" @next="emit('done', stars)")
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
  background-color: #7a8a52
  background-size: cover
  background-position: center

.gm-person
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
  transition: transform 300ms ease

  &:focus-visible
    outline: 3px solid #2f6b8a
    outline-offset: 2px

  &.lifted
    transform: translateY(-3%)

  &.shine
    animation: gm-pulse 1300ms ease-in-out infinite
    border-color: #f2c46a
    background: rgba(255, 236, 170, 0.35)

.gm-glow
  position: absolute
  display: block
  transform: translate(-50%, -50%) scaleY(0.4)
  pointer-events: none
  opacity: 0.9

.gm-given
  position: absolute
  display: block
  width: 9%
  transform: translate(-50%, -100%)
  pointer-events: none

.gm-mark
  position: absolute
  top: -6px
  right: -6px
  pointer-events: none

.gm-says
  margin: 0
  padding: 6px 14px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.96)
  text-align: center
  font-weight: 800
  font-size: 1rem
  line-height: 1.35
  color: #3f321b

.gm-tray
  display: flex
  flex-wrap: wrap
  justify-content: center
  align-items: flex-start
  gap: 6px
  min-height: 92px

.gm-gift
  display: flex
  flex-direction: column
  align-items: center
  gap: 2px
  box-sizing: border-box
  width: 110px
  min-height: 84px
  padding: 4px 2px
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

.gm-cap
  display: block
  font-size: 1rem
  font-weight: 800
  line-height: 1.1
  color: #3f321b
  overflow-wrap: anywhere

.gm-basket
  display: block
  width: 110px
  padding: 4px
  opacity: 0.55

  &.full
    opacity: 1

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
  .gm-person, .gm-gift
    transition: none

  .gm-person.shine, .gm-gift.shine, .gm-gift.bounce
    animation: none
</style>
