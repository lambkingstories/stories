<script setup lang="ts">
/**
 * Dip seven times: Naaman stands in the river Jordan up to his hips (a painted picture, Naaman is a picture of his own). A big button below the river says when the water is calm. The child taps when the water is calm:
 * Naaman dips under (he sinks out of sight for a moment), comes up, and a ring spreads over the water. While the ring moves the water is not calm; whoever taps then dips him too early (a cross, a mistake, the dip does
 * not count). Seven good dips: Naaman comes up healthy with raised arms (the second picture). Taps while he is under water are ignored. The phases are in `utils/elisaGames.ts`; the places are percent of the picture.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { DivePhase } from '@/utils/elisaGames'
import type { DiveGame } from '@/types/adventure'

const props = defineProps<{ game: DiveGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.dips)

const phase = ref<DivePhase>('ready')
const dips = ref(0)
const misses = ref(0)
const cross = ref(false)
const message = ref('')
const finished = ref(false)
const healed = ref(false)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => mistakeStars(misses.value, 2, 5))
const calm = computed(() => phase.value === 'ready')
const status = computed(() => (calm.value ? t('app.adventure.diveCalm') : phase.value === 'under' ? t('app.adventure.diveDown') : t('app.adventure.diveWait')))

let alive = true
onBeforeUnmount(() => (alive = false))

function tap() {
  if (finished.value || healed.value) return
  if (phase.value === 'under') return
  if (phase.value === 'rippling') {
    misses.value++
    play('wrong')
    message.value = t('app.adventure.diveEarly')
    cross.value = true
    later(() => (cross.value = false), 900)
    return
  }
  // calm water: the dip counts
  phase.value = 'under'
  message.value = ''
  play('snap')
  later(() => {
    if (!alive) return
    dips.value++
    progress.mark()
    if (dips.value >= props.game.dips) {
      healed.value = true
      phase.value = 'done'
      play('star')
      later(() => (finished.value = true), 2600)
      return
    }
    phase.value = 'rippling'
    later(() => {
      if (alive && phase.value === 'rippling') phase.value = 'ready'
    }, props.game.calmMs)
  }, props.game.underMs)
}

const manStyle = computed(() => ({ left: `${props.game.pos.x}%`, top: `${props.game.pos.y}%`, width: `${props.game.pos.w}%` }))
const ringStyle = computed(() => ({ left: `${props.game.ripplePos.x}%`, top: `${props.game.ripplePos.y}%`, width: `${props.game.ripplePos.w}%` }))
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(class="gm-hint") {{ game.hint }}
      div(
        class="gm-field"
        :style="{ backgroundImage: `url(${src(game.background)})` }"
        role="img"
        :aria-label="t('app.adventure.diveRiver')"
        @contextmenu.prevent
      )
        img(
          class="gm-man"
          :class="{ under: phase === 'under' }"
          :src="src(healed ? game.naamanNew : game.naaman)"
          alt=""
          draggable="false"
          :style="manStyle"
        )
        img(v-if="phase === 'rippling'" class="gm-ring" :src="src(game.ripple)" alt="" draggable="false" :style="ringStyle")
        span(v-if="cross" class="gm-cross" aria-hidden="true")
          GameMark(kind="bad")
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.diveCount', { n: dips, total: game.dips }) }}
      button(type="button" class="gm-tap" :class="{ calm }" :disabled="healed" @click="tap")
        span(aria-hidden="true") {{ calm ? '💧' : '〰️' }}
        span {{ status }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.diveDone')" @next="emit('done', stars)")
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
  background-color: #4a6a78
  background-size: cover
  background-position: center

.gm-man
  position: absolute
  display: block
  height: auto
  transform: translate(-50%, -100%)
  pointer-events: none
  transition: transform 520ms ease, opacity 520ms ease

  &.under
    transform: translate(-50%, -40%)
    opacity: 0

.gm-ring
  position: absolute
  display: block
  height: auto
  transform: translate(-50%, -50%)
  pointer-events: none
  animation: gm-ring 1.6s ease-out infinite

.gm-cross
  position: absolute
  left: 50%
  top: 24%
  display: block
  margin: -15px 0 0 -15px
  z-index: 8

.gm-count
  margin: 0
  align-self: center
  padding: 2px 14px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  color: #5f4f35

.gm-tap
  align-self: center
  display: flex
  align-items: center
  gap: 10px
  min-height: 56px
  padding: 8px 26px
  border: 3px solid #3f6fb0
  border-radius: 999px
  background: #5b8fd6
  color: #fff
  font-weight: 800
  font-size: 1.1rem
  cursor: pointer

  &.calm
    background: #3f8f4f
    border-color: #2c6a3a

  &:disabled
    opacity: 0.6
    cursor: default

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

@keyframes gm-ring
  0%
    transform: translate(-50%, -50%) scale(0.7)
    opacity: 1
  100%
    transform: translate(-50%, -50%) scale(1.15)
    opacity: 0.35

@media (prefers-reduced-motion: reduce)
  .gm-man
    transition: none
  .gm-ring
    animation: none
</style>
