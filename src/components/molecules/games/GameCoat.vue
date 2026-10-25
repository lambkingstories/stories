<script setup lang="ts">
/**
 * The little robe: every year Hannah brings Samuel a new little robe, and every year he has grown. Samuel stands in the room (in round one as a small boy, then bigger) and three robes lie on the shelf, one small,
 * one fitting and one big (the same picture of a robe, shown in three widths). The child taps the robe that fits: it flies to Samuel and he puts it on (the round is done). A robe that is too small or too big
 * is a mistake, it stays lying and fades. There is no clock. The arithmetic is in `utils/samuelGames.ts`.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { coatFits, coatMiss } from '@/utils/samuelGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { CoatGame } from '@/types/adventure'

const props = defineProps<{ game: CoatGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: one robe for each round
progress.setGoal(props.game.rounds.length)

const round = ref(0)
const tried = ref<Set<number>>(new Set())
const worn = ref<number | null>(null)
const misses = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const shaking = ref<number | null>(null)
const src = (p: string) => prependBaseUrl(p)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const stars = computed(() => mistakeStars(misses.value, 1, 3))
const boyW = computed(() => props.game.boyW[current.value.boy]!)
const n = computed(() => current.value.coats.length)
/** The middle of robe i along the shelf (percent of the picture width). */
const slotX = (i: number) => props.game.shelf.x0 + ((i + 0.5) * (props.game.shelf.x1 - props.game.shelf.x0)) / n.value

function coatStyle(i: number) {
  const gone = worn.value === i
  return gone
    ? { left: `${props.game.boyPos.x}%`, top: `${props.game.boyPos.y - 18}%`, width: `${current.value.coats[i]!}%` }
    : { left: `${slotX(i)}%`, top: `${props.game.shelf.y}%`, width: `${current.value.coats[i]!}%` }
}

function pick(i: number) {
  if (between.value || finished.value || tried.value.has(i)) return
  const w = current.value.coats[i]!
  if (coatFits(w, boyW.value, props.game.ratio)) {
    worn.value = i
    between.value = true
    progress.mark()
    play('star')
    message.value = t('app.adventure.coatRight')
    later(() => {
      if (lastRound.value) {
        finished.value = true
        return
      }
      round.value++
      tried.value = new Set()
      worn.value = null
      between.value = false
      message.value = ''
    }, 1700)
    return
  }
  misses.value++
  play('wrong')
  tried.value = new Set([...tried.value, i])
  shaking.value = i
  message.value = t(coatMiss(w, boyW.value, props.game.ratio) === 'small' ? 'app.adventure.coatSmall' : 'app.adventure.coatBig')
  later(() => {
    if (shaking.value === i) shaking.value = null
  }, 450)
}
</script>

<template lang="pug">
  div(class="gc")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gc-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gc-hint") {{ current.hint }}
      div(class="gc-field" :style="{ backgroundImage: `url(${src(game.background)})` }")
        //- Samuel at the age of this round
        div(class="gc-boy" :style="{ left: `${game.boyPos.x}%`, top: `${game.boyPos.y}%`, width: `${boyW}%` }" role="img" :aria-label="t('app.adventure.coatBoy')")
          GameImage(:src="game.boy" colour="#c9a77a")
        //- the three robes on the shelf
        button(
          v-for="(w, i) in current.coats"
          :key="`coat-${round}-${i}`"
          type="button"
          class="gc-coat"
          :class="{ worn: worn === i, tried: tried.has(i), shake: shaking === i }"
          :style="coatStyle(i)"
          :aria-label="t('app.adventure.coatOne', { n: i + 1 })"
          :disabled="between || tried.has(i)"
          @click="pick(i)"
        )
          GameImage(:src="game.coat" colour="#a5502a")
          span(v-if="tried.has(i)" class="gc-cross" aria-hidden="true")
            GameMark(kind="bad")
      p(class="gc-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.coatDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gc
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e7d9b4
  box-shadow: inset 0 0 18px rgba(90, 60, 20, 0.25)
  user-select: none
  -webkit-user-select: none

.gc-round
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

.gc-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #5f4f35

.gc-field
  position: relative
  width: 100%
  aspect-ratio: 4 / 3
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #cfae6a
  background-size: cover
  background-position: center

// Samuel stands with the middle of his foot at left/top
.gc-boy
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none

// a robe lies with the middle of its foot at left/top on the shelf
.gc-coat
  position: absolute
  display: block
  padding: 0
  border: 0
  background: transparent
  cursor: pointer
  transform: translate(-50%, -100%)
  transition: left 700ms ease, top 700ms ease, opacity 300ms ease
  -webkit-tap-highlight-color: transparent

  &:focus-visible
    outline: 3px solid #fff
    outline-offset: 2px
    border-radius: 10px

  &.worn
    z-index: 5
    cursor: default

  &.tried
    opacity: 0.45
    cursor: default

  &.shake
    animation: gc-shake 360ms ease

.gc-cross
  position: absolute
  left: 50%
  top: 40%
  display: block
  margin: -15px 0 0 -15px

.gc-fb
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

@keyframes gc-shake
  0%, 100%
    transform: translate(-50%, -100%)
  25%
    transform: translate(calc(-50% - 6px), -100%)
  75%
    transform: translate(calc(-50% + 6px), -100%)

@media (prefers-reduced-motion: reduce)
  .gc-coat
    transition: none
  .gc-coat.shake
    animation: none
</style>
