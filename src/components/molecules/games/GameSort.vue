<script setup lang="ts">
/**
 * The sorting game: sacks of grain have to go into the storehouse that wears the same color. A sack is dragged to a house (or
 * tapped, then the house is tapped). A wrong house lets the sack spring back and counts as a mistake.
 */
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import useTimers from '@/use/useTimers'
import GameDone from '@/components/molecules/games/GameDone.vue'
import { useDragDrop } from '@/use/useDragDrop'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { SortGame } from '@/types/adventure'

const props = defineProps<{ game: SortGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()

interface Sack {
  id: number
  bin: string
  src: string
}

// the rounds: from the easy one to the hard one (a cue is taken away); without rounds the game is one round
const rounds = computed(() => props.game.rounds?.length ? props.game.rounds : [{ perBin: props.game.perBin, hint: '' }])
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const perBin = computed(() => current.value.perBin)
const graySacks = computed(() => !!(current.value as { graySacks?: boolean }).graySacks)
const grayHouses = computed(() => !!(current.value as { grayHouses?: boolean }).grayHouses)
const lastRound = computed(() => round.value >= rounds.value.length - 1)

const sacks = computed<Sack[]>(() => {
  const list: Sack[] = []
  let id = round.value * 100
  for (let k = 0; k < perBin.value; k++) {
    for (const b of props.game.bins) list.push({ id: id++, bin: b.id, src: prependBaseUrl(b.sack) })
  }
  let seed = list.length * 3571 + 11 + round.value * 17
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[list[i], list[j]] = [list[j]!, list[i]!]
  }
  return list
})

const stored = reactive<Record<number, boolean>>({})
const inHouse = reactive<Record<string, number>>({})
const mistakes = ref(0)
const wobble = ref<number | null>(null)
const pop = ref<string | null>(null)
/** The storehouse that flashes green (right color) or red (wrong color) for a moment. */
const flash = ref<{ bin: string; kind: 'good' | 'bad' } | null>(null)

function flashBin(bin: string, kind: 'good' | 'bad') {
  flash.value = { bin, kind }
  later(() => {
    if (flash.value?.bin === bin) flash.value = null
  }, 800)
}
const left = computed(() => sacks.value.filter((s) => !stored[s.id]))
/** All sacks of this round are stored: the next round begins, or the game is won. */
const roundDone = computed(() => left.value.length === 0)
const finished = computed(() => roundDone.value && lastRound.value)
const between = ref(false)

function nextRound() {
  between.value = false
  round.value++
  for (const k of Object.keys(inHouse)) delete inHouse[k]
}

watch(roundDone, (done) => {
  if (done && !lastRound.value) {
    between.value = true
    later(nextRound, 1400)
  }
})
const stars = computed(() => mistakeStars(mistakes.value, 2, 5))

const { dragging, selected, down, tapPlace, toggleSelect, dragStyle } = useDragDrop((id, target) => {
  const sack = sacks.value.find((s) => s.id === Number(id))
  if (!sack || stored[sack.id]) return
  if (sack.bin === target) {
    stored[sack.id] = true
    progress.mark()
    play('sack')
    flashBin(target, 'good')
    inHouse[target] = (inHouse[target] ?? 0) + 1
    pop.value = target
    later(() => (pop.value = null), 350)
  } else {
    mistakes.value++
    play('wrong')
    flashBin(target, 'bad')
    wobble.value = sack.id
    later(() => {
      if (wobble.value === sack.id) wobble.value = null
    }, 450)
  }
})
</script>

<template lang="pug">
  div(class="so")
    div(class="so-houses")
      div(
        v-for="b in game.bins"
        :key="b.id"
        class="so-house"
        :class="{ ready: selected !== null, pop: pop === b.id, 'flash-good': flash?.bin === b.id && flash.kind === 'good', 'flash-bad': flash?.bin === b.id && flash.kind === 'bad' }"
        :data-drop="b.id"
        role="button"
        tabindex="0"
        :aria-label="t('app.adventure.sortHouse', { n: inHouse[b.id] ?? 0, total: perBin })"
        @click="tapPlace(b.id)"
        @keydown.enter.space.prevent="tapPlace(b.id)"
      )
        img(:src="prependBaseUrl(b.house)" alt="" draggable="false" :class="{ gray: grayHouses }")
        span(class="so-n") {{ inHouse[b.id] ?? 0 }} / {{ perBin }}
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="so-round") {{ t('app.adventure.sortRound', { n: round + 1, total: rounds.length }) }}
      p(class="so-hint") {{ between ? t('app.adventure.sortNext') : current.hint || t('app.adventure.sortHint') }}
      div(class="so-tray")
        div(
          v-for="s in left"
          :key="s.id"
          class="so-sack"
          :class="{ chosen: selected === String(s.id), wobble: wobble === s.id }"
          :style="dragStyle(String(s.id))"
          role="button"
          tabindex="0"
          :aria-label="t('app.adventure.sortSack')"
          @pointerdown="down($event, String(s.id))"
          @keydown.enter.space.prevent="toggleSelect(String(s.id))"
        )
          img(:src="s.src" alt="" draggable="false" :class="{ gray: graySacks }")
    GameDone(v-else :stars="stars" :text="t('app.adventure.sortDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.so
  display: flex
  flex-direction: column
  gap: 12px

.so-houses
  display: grid
  grid-template-columns: repeat(3, 1fr)
  gap: 8px
  padding: 14px 6px 8px
  border-radius: 16px
  background: linear-gradient(#f4dc9d, #e6bf6c)
  border: 3px solid #d4a83e
  box-shadow: inset 0 0 14px rgba(120, 80, 20, 0.35)

.so-house
  position: relative
  display: grid
  justify-items: center
  padding: 0
  cursor: pointer
  border-radius: 14px
  transition: transform 160ms ease-out

  img
    display: block
    width: 100%
    height: auto
    pointer-events: none
    filter: drop-shadow(0 4px 4px rgba(60, 40, 10, 0.45))

  &.ready
    animation: so-ready 900ms ease-in-out infinite

  &.pop
    transform: scale(1.1)

  &.flash-good
    animation: flash-good 800ms ease-out

  &.flash-bad
    animation: flash-bad 800ms ease-out

.so-n
  margin-top: -4px
  padding: 1px 10px
  border-radius: 999px
  background: #4a3208
  color: #fff3cf
  font-family: 'Fraunces', serif
  font-weight: 700
  font-size: 0.9rem

.so-round
  margin: 0
  text-align: center
  font-weight: 800
  font-size: 0.85rem
  letter-spacing: 0.06em
  text-transform: uppercase
  color: #8a6a1f

.so-house img.gray,
.so-sack img.gray
  filter: grayscale(1) contrast(0.95) brightness(1.04) drop-shadow(0 4px 4px rgba(60, 40, 10, 0.45))

.so-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #5f4f35

.so-tray
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 8px
  min-height: 90px

.so-sack
  width: 28%
  max-width: 100px
  cursor: grab
  touch-action: none
  user-select: none
  -webkit-user-select: none
  transition: transform 160ms ease-out

  img
    display: block
    width: 100%
    height: auto
    pointer-events: none
    filter: drop-shadow(0 5px 5px rgba(60, 40, 10, 0.5))

  &.chosen
    transform: translateY(-6px) scale(1.08)
    filter: drop-shadow(0 0 8px rgba(255, 230, 120, 0.95))

  &.wobble
    animation: so-shake 420ms ease-in-out

// right is shown with a green glow, wrong with a red one
@keyframes flash-bad
  0%, 45%
    box-shadow: 0 0 0 4px rgba(214, 48, 49, 0.95), 0 0 22px 6px rgba(214, 48, 49, 0.75)
  100%
    box-shadow: 0 0 0 0 rgba(214, 48, 49, 0), 0 0 0 0 rgba(214, 48, 49, 0)

@keyframes flash-good
  0%, 45%
    box-shadow: 0 0 0 4px rgba(47, 174, 84, 0.95), 0 0 22px 6px rgba(47, 174, 84, 0.75)
  100%
    box-shadow: 0 0 0 0 rgba(47, 174, 84, 0), 0 0 0 0 rgba(47, 174, 84, 0)

@keyframes so-ready
  0%, 100%
    transform: scale(1)
  50%
    transform: scale(1.04)

@keyframes so-shake
  0%, 100%
    transform: translateX(0)
  25%
    transform: translateX(-8px) rotate(-5deg)
  75%
    transform: translateX(8px) rotate(5deg)

@media (prefers-reduced-motion: reduce)
  .so-house.ready
    animation: none
</style>
