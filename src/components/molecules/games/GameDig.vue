<script setup lang="ts">
/**
 * Dig for the treasure (Matthew 13,44-46). Round 1, the field: twelve mounds of earth lie on a field, one of them hides the chest. A tap on a mound digs it open (a spade sound, the mound sinks). Under an empty one
 * stays a hole with a small arrow that points towards the chest (eight directions, from the middle of the hole to the middle of the mound over the chest, with a word for the screen reader): that is a mistake without any loss.
 * Under the right one the chest opens and coins glimmer. Round 2, the pearl: the merchant has five pearls on his table, the child taps the most precious one (the biggest, round, white one); a wrong pearl wobbles and gets a cross
 * and a word, and stays where it lies. Nothing is shown by colour alone (arrow, cross, tick, words). The mounds and the pearls are buttons (at least 44 pixels), so the keyboard works, too. Stars: `gleichnisStars(holes + wrong pearls, rounds)`.
 * The arithmetic is in `utils/gleichnisseGames.ts`.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { DIG_CELLS, digArrow, digArrowTurn, digIndex, digJudge, pearlJudge, pearlOrder, gleichnisStars } from '@/utils/gleichnisseGames'
import type { DigDir } from '@/utils/gleichnisseGames'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { DigGame } from '@/types/adventure'

const props = defineProps<{ game: DigGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: one part for every round that is solved
progress.setGoal(props.game.rounds.length)

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const isField = computed(() => current.value.kind === 'field')
const cells = computed(() => current.value.cells ?? [])
const slots = computed(() => current.value.slots ?? [])
const treasureIndex = computed(() => (current.value.treasure ? digIndex(current.value.treasure[0], current.value.treasure[1]) : 0))
const pearlPictures = computed(() => pearlOrder(current.value.best ?? 0))

const dug = ref<boolean[]>(Array.from({ length: DIG_CELLS }, () => false))
const arrows = ref<Record<number, DigDir>>({})
const found = ref(false)
const chestOpen = ref(false)
/** The pearls that were tapped wrongly in this round (they keep their cross). */
const wrongSlots = ref<number[]>([])
const wobble = ref<{ slot: number; n: number } | null>(null)
const picked = ref(-1)
const solved = ref(0)
const holes = ref(0)
const wrongPearls = ref(0)
const finished = ref(false)
const message = ref('')
let messageSeq = 0
const locked = computed(() => found.value || picked.value >= 0)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => gleichnisStars(holes.value + wrongPearls.value, props.game.rounds.length))
const backdrop = computed(() => (isField.value ? props.game.field : props.game.stall))
const dirWord = (d: DigDir) => t(`app.adventure.digDir${d}`)
const arrowOf = (i: number): DigDir => arrows.value[i] ?? 0
/** The picture of the pearl at a place (the best one lies at the place `best`). */
const pearlOf = (slot: number) => props.game.pearls[pearlPictures.value[slot] ?? 0] ?? props.game.pearls[0]!

function say(text: string, ms = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}

/** The round is solved: a part of the task, then the next round or the end. */
function solve() {
  progress.mark()
  solved.value++
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 2000)
    return
  }
  later(() => say(t('app.adventure.gameNext'), 0), 900)
  later(() => {
    round.value++
    dug.value = Array.from({ length: DIG_CELLS }, () => false)
    arrows.value = {}
    found.value = false
    chestOpen.value = false
    wrongSlots.value = []
    wobble.value = null
    picked.value = -1
    message.value = ''
  }, 2200)
}

function dig(index: number) {
  if (locked.value || !isField.value) return
  const verdict = digJudge(index, treasureIndex.value, dug.value)
  if (verdict === 'again') return
  dug.value = dug.value.map((d, i) => (i === index ? true : d))
  play('hit')
  if (verdict === 'found') {
    found.value = true
    say(t('app.adventure.digFound'), 0)
    later(() => {
      play('coin')
      chestOpen.value = true
    }, 450)
    solve()
    return
  }
  holes.value++
  arrows.value = { ...arrows.value, [index]: digArrow(index, treasureIndex.value, cells.value) }
  say(t('app.adventure.digEmpty'))
}

function pearl(slot: number) {
  if (locked.value || isField.value) return
  if (pearlJudge(slot, current.value.best ?? 0) === 'right') {
    picked.value = slot
    play('right')
    say(t('app.adventure.digPearlRight'), 0)
    solve()
    return
  }
  if (!wrongSlots.value.includes(slot)) {
    wrongSlots.value = [...wrongSlots.value, slot]
    wrongPearls.value++
  }
  wobble.value = { slot, n: (wobble.value?.n ?? 0) + 1 }
  play('wrong')
  say(t('app.adventure.digPearlWrong'))
}
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        class="gm-field"
        :style="{ backgroundImage: `url(${src(backdrop)})` }"
        role="group"
        :aria-label="isField ? t('app.adventure.digField') : t('app.adventure.digStall')"
      )
        template(v-if="isField")
          template(v-for="(c, i) in cells" :key="`${round}-${i}`")
            button(
              v-if="!dug[i]"
              type="button"
              class="gm-mound"
              :style="{ left: `${c[0]}%`, top: `${c[1]}%`, width: `${game.mound.w}%` }"
              :aria-label="t('app.adventure.digMound', { n: i + 1 })"
              :disabled="locked"
              @click="dig(i)"
            )
              GameImage(:src="game.mound.image" :ratio="1" colour="#8a6a3e" :label="game.mound.label")
            div(
              v-else-if="i !== treasureIndex"
              class="gm-hole"
              :style="{ left: `${c[0]}%`, top: `${c[1]}%`, width: `${game.hole.w}%` }"
              role="img"
              :aria-label="t('app.adventure.digHole', { n: i + 1, dir: dirWord(arrowOf(i)) })"
            )
              GameImage(:src="game.hole.image" :ratio="1" colour="#4b3822" :label="game.hole.label")
              span(class="gm-arrow" aria-hidden="true")
                span(:style="{ transform: `rotate(${digArrowTurn(arrowOf(i))}deg)` }") →
            div(
              v-else
              class="gm-chest"
              :class="{ open: chestOpen }"
              :style="{ left: `${c[0]}%`, top: `${c[1]}%`, width: `${chestOpen ? game.chestOpen.w : game.chest.w}%` }"
              role="img"
              :aria-label="t('app.adventure.digChest')"
            )
              span(v-if="chestOpen" class="gm-glint" aria-hidden="true")
              GameImage(:src="chestOpen ? game.chestOpen.image : game.chest.image" :ratio="1" colour="#a5742e" :label="chestOpen ? game.chestOpen.label : game.chest.label")
              span(v-if="chestOpen" class="gm-mark" aria-hidden="true")
                GameMark(kind="good")
        template(v-else)
          template(v-for="(s, slot) in slots" :key="`${round}-${slot}`")
            button(
              type="button"
              class="gm-pearl"
              :class="{ wobble: wobble && wobble.slot === slot, lifted: picked === slot }"
              :style="{ left: `${s[0]}%`, top: `${s[1]}%`, width: `${pearlOf(slot).w}%` }"
              :aria-label="t('app.adventure.digPearl', { n: slot + 1 })"
              :disabled="locked"
              @click="pearl(slot)"
            )
              span(:key="wobble && wobble.slot === slot ? wobble.n : 0" class="gm-pearl-in")
                GameImage(:src="pearlOf(slot).image" :ratio="1" colour="#e6e1d4" round :label="pearlOf(slot).label")
              span(v-if="wrongSlots.includes(slot)" class="gm-mark" aria-hidden="true")
                GameMark(kind="bad")
              span(v-if="picked === slot" class="gm-mark" aria-hidden="true")
                GameMark(kind="good")
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.digCount', { n: solved, total: game.rounds.length }) }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.digDone')" @next="emit('done', stars)")
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

// a mound of earth: the button is as wide as the picture (never under 44 pixels)
.gm-mound
  position: absolute
  display: block
  min-width: 44px
  min-height: 44px
  padding: 0
  border: 0
  background: transparent
  transform: translate(-50%, -50%)
  cursor: pointer
  -webkit-tap-highlight-color: transparent
  touch-action: manipulation
  transition: scale 120ms ease
  filter: drop-shadow(0 2px 2px rgba(40, 25, 5, 0.4))

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px
    border-radius: 50%

  &:active
    scale: 0.94

  &:disabled
    cursor: default

.gm-hole
  position: absolute
  display: block
  min-width: 44px
  transform: translate(-50%, -50%)
  pointer-events: none
  animation: gm-sink 320ms ease-out both

// the arrow in the hole: a white round sign with the arrow in it (the direction is the message, not a colour)
.gm-arrow
  position: absolute
  left: 50%
  top: 50%
  display: flex
  align-items: center
  justify-content: center
  width: 70%
  min-width: 26px
  aspect-ratio: 1
  transform: translate(-50%, -50%)
  border-radius: 50%
  border: 2px solid #3f321b
  background: rgba(255, 250, 235, 0.95)
  color: #3f321b
  font-weight: 900
  font-size: 1.2rem
  line-height: 1

  span
    display: block
    transition: transform 200ms ease

.gm-chest
  position: absolute
  display: block
  transform: translate(-50%, -50%)
  pointer-events: none
  z-index: 3
  filter: drop-shadow(0 3px 3px rgba(40, 25, 5, 0.5))
  animation: gm-sink 360ms ease-out both

  &.open
    z-index: 4

.gm-glint
  position: absolute
  left: 50%
  top: 40%
  width: 130%
  aspect-ratio: 1
  transform: translate(-50%, -50%)
  border-radius: 50%
  background: radial-gradient(circle, rgba(255, 244, 170, 0.85) 0%, rgba(255, 230, 120, 0.35) 45%, rgba(255, 230, 120, 0) 70%)
  animation: gm-shine 1200ms ease-in-out infinite

.gm-mark
  position: absolute
  right: -6px
  top: -10px
  z-index: 6
  pointer-events: none

// a pearl: round, at least 44 pixels
.gm-pearl
  position: absolute
  display: block
  min-width: 44px
  min-height: 44px
  padding: 0
  border: 0
  background: transparent
  transform: translate(-50%, -50%)
  cursor: pointer
  -webkit-tap-highlight-color: transparent
  touch-action: manipulation
  transition: transform 360ms ease
  filter: drop-shadow(0 3px 3px rgba(40, 25, 5, 0.4))

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px
    border-radius: 50%

  &:disabled
    cursor: default

  &.lifted
    transform: translate(-50%, -80%) scale(1.15)
    z-index: 5

.gm-pearl-in
  display: block

.gm-pearl.wobble .gm-pearl-in
  animation: gm-wobble 420ms ease-in-out

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

@keyframes gm-sink
  from
    opacity: 0
    scale: 1.25
  to
    opacity: 1
    scale: 1

@keyframes gm-shine
  0%, 100%
    opacity: 0.55
  50%
    opacity: 1

@keyframes gm-wobble
  0%, 100%
    rotate: 0deg
  25%
    rotate: -10deg
  75%
    rotate: 10deg

// less motion: nothing sinks, glows or wobbles, the pearl does not glide
@media (prefers-reduced-motion: reduce)
  .gm-hole, .gm-chest, .gm-glint, .gm-pearl.wobble .gm-pearl-in
    animation: none

  .gm-pearl, .gm-mound, .gm-arrow span
    transition: none
</style>
