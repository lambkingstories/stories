<script setup lang="ts">
/**
 * The forge (Micah 4,3): in a village smithy the child beats weapons into tools. A weapon lies on the anvil (a sword, a spear); the child taps the anvil until the metal glows (three blows, the hammer swings),
 * then chooses what it becomes among three tools: a right choice (plowshare for the sword, pruning hook for the spear) turns the metal into that tool; a wrong tool is a mistake (a cross).
 * Four rounds (the sword, the spear, then both again without the hint of the text). The arithmetic is in `utils/prophetenGames.ts`.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { forgeBlow, forgeChoice } from '@/utils/prophetenGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { ForgeGame } from '@/types/adventure'

const props = defineProps<{ game: ForgeGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every blow and every choice of every round
progress.setGoal(props.game.rounds.reduce((n, r) => n + r.hits + 1, 0))

const round = ref(0)
const hits = ref(0)
const phase = ref<'strike' | 'choose' | 'made'>('strike')
const swing = ref(false)
const crossAt = ref<string | null>(null)
const misses = ref(0)
const finished = ref(false)
const message = ref('')
const src = (p: string) => prependBaseUrl(p)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const stars = computed(() => mistakeStars(misses.value, 2, 5))
const doneCount = computed(() => progress.parts.value)
const total = computed(() => props.game.rounds.reduce((n, r) => n + r.hits + 1, 0))
const itemOf = (id: string) => props.game.items.find((i) => i.id === id)
// the picture on the anvil: the weapon, then the glowing metal, then the tool
const onAnvil = computed(() => (phase.value === 'strike' ? (hits.value >= current.value.hits ? props.game.hot : current.value.item) : phase.value === 'choose' ? props.game.hot : current.value.result))

function strike() {
  if (phase.value !== 'strike') return
  swing.value = true
  later(() => {
    swing.value = false
  }, 320)
  play('snap')
  progress.mark()
  const r = forgeBlow(hits.value, current.value.hits)
  hits.value++
  message.value = ''
  if (r === 'ready') {
    later(() => {
      phase.value = 'choose'
      message.value = t('app.adventure.forgeChoose')
    }, 450)
  }
}

function choose(id: string) {
  if (phase.value !== 'choose') return
  if (forgeChoice(current.value.result, id) === 'wrong') {
    misses.value++
    play('wrong')
    message.value = t('app.adventure.forgeWrong')
    crossAt.value = id
    later(() => {
      crossAt.value = null
    }, 900)
    return
  }
  progress.mark()
  play('snap')
  phase.value = 'made'
  message.value = t('app.adventure.forgeMade')
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 2400)
    return
  }
  later(() => {
    round.value++
    hits.value = 0
    phase.value = 'strike'
    message.value = ''
  }, 2100)
}
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        class="gm-field"
        :style="{ backgroundImage: `url(${src(game.background)})` }"
        role="img"
        :aria-label="t('app.adventure.forgeField')"
      )
        img(
          class="gm-item"
          :class="{ glow: onAnvil === game.hot }"
          :src="src(itemOf(onAnvil)?.image ?? '')"
          alt=""
          draggable="false"
          :style="{ left: `${game.anvil.x}%`, top: `${game.anvil.y}%`, width: `${itemOf(onAnvil)?.w ?? game.itemW}%` }"
        )
        img(
          class="gm-hammer"
          :class="{ swing }"
          :src="src(itemOf(game.hammer)?.image ?? '')"
          alt=""
          draggable="false"
          :style="{ left: `${game.anvil.x + 16}%`, top: `${game.anvil.y - 4}%`, width: `${itemOf(game.hammer)?.w ?? 18}%` }"
        )
        button(
          v-if="phase === 'strike'"
          type="button"
          class="gm-anvil"
          :style="{ left: `${game.anvil.x}%`, top: `${game.anvil.y}%` }"
          :aria-label="t('app.adventure.forgeStrike')"
          @click="strike"
        )
          span(class="gm-anvil-text") {{ t('app.adventure.forgeStrike') }}
        div(v-if="phase === 'choose'" class="gm-options")
          button(
            v-for="id in current.options"
            :key="id"
            type="button"
            class="gm-option"
            :aria-label="itemOf(id)?.label"
            @click="choose(id)"
          )
            img(:src="src(itemOf(id)?.image ?? '')" alt="" draggable="false")
            span(class="gm-option-name") {{ itemOf(id)?.label }}
            span(v-if="crossAt === id" class="gm-cross" aria-hidden="true")
              GameMark(kind="bad")
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.forgeCount', { n: doneCount, total }) }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.forgeDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
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
  aspect-ratio: 4 / 3
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #8a6a48
  background-size: cover
  background-position: center

.gm-item
  position: absolute
  display: block
  height: auto
  transform: translate(-50%, -100%)
  pointer-events: none
  z-index: 3
  filter: drop-shadow(0 0 5px rgba(255, 238, 190, 0.95)) drop-shadow(0 4px 4px rgba(40, 25, 5, 0.45))
  transition: filter 300ms ease

  &.glow
    filter: drop-shadow(0 0 14px rgba(255, 150, 50, 0.95))

.gm-hammer
  position: absolute
  display: block
  height: auto
  transform: translate(-50%, -100%) rotate(18deg)
  transform-origin: 80% 90%
  pointer-events: none
  z-index: 4
  filter: drop-shadow(0 0 5px rgba(255, 238, 190, 0.95)) drop-shadow(0 4px 4px rgba(40, 25, 5, 0.45))
  transition: transform 160ms ease-in

  &.swing
    transform: translate(-50%, -100%) rotate(-28deg)

.gm-anvil
  position: absolute
  width: 44%
  height: 30%
  transform: translate(-50%, -75%)
  border: 3px dashed rgba(255, 233, 150, 0.95)
  border-radius: 16px
  background: rgba(255, 233, 150, 0.12)
  box-shadow: 0 0 10px rgba(255, 220, 110, 0.7)
  cursor: pointer
  z-index: 5
  min-width: 44px
  min-height: 44px
  padding: 0

.gm-anvil-text
  position: absolute
  bottom: 100%
  left: 50%
  transform: translateX(-50%)
  margin-bottom: 4px
  padding: 1px 10px
  border-radius: 999px
  background: rgba(20, 30, 55, 0.82)
  color: #fff6dc
  font-size: 0.8rem
  font-weight: 800
  white-space: nowrap
  pointer-events: none

.gm-options
  position: absolute
  left: 0
  right: 0
  bottom: 2%
  display: flex
  justify-content: center
  gap: 8px
  padding: 0 6px
  z-index: 6

.gm-option
  position: relative
  display: flex
  flex-direction: column
  align-items: center
  flex: 1 1 0
  max-width: 31%
  min-height: 44px
  padding: 4px
  border: 3px solid #d4a83e
  border-radius: 12px
  background: rgba(255, 246, 220, 0.94)
  cursor: pointer

  img
    display: block
    width: 100%
    max-height: 70px
    object-fit: contain
    pointer-events: none

.gm-option-name
  font-size: 0.8rem
  font-weight: 800
  color: #5f4f35

.gm-cross
  position: absolute
  left: 50%
  top: 40%
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none

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

@media (prefers-reduced-motion: reduce)
  .gm-hammer, .gm-item
    transition: none
</style>
