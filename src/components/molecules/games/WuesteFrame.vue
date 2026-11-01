<script setup lang="ts">
/**
 * The frame that the seven new games of "The People in the Desert" share: the round, the hint, the picture field (4:3, the background picture, the game goes into the slot), the count, a line of feedback and,
 * at the end, the stars. Only the frame; the rules and pictures are in the games.
 */
import { useI18n } from 'vue-i18n'
import GameDone from '@/components/molecules/games/GameDone.vue'
import { prependBaseUrl } from '@/utils/function'

defineProps<{
  background: string
  hint: string
  round: number
  rounds: number
  label: string
  count: string
  message: string
  finished: boolean
  stars: number
  doneText: string
}>()
const emit = defineEmits<{ next: [] }>()
const { t } = useI18n({ useScope: 'global' })
const src = (p: string) => prependBaseUrl(p)
</script>

<template lang="pug">
  div(class="wf")
    template(v-if="!finished")
      p(v-if="rounds > 1" class="wf-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds }) }}
      p(class="wf-hint") {{ hint }}
      div(
        class="wf-field"
        :style="{ backgroundImage: `url(${src(background)})` }"
        role="group"
        :aria-label="label"
      )
        slot
      p(class="wf-count" aria-live="polite") {{ count }}
      p(class="wf-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="doneText" @next="emit('next')")
</template>

<style scoped lang="sass">
.wf
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

.wf-round
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

.wf-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #5f4f35

.wf-field
  position: relative
  width: 100%
  aspect-ratio: 4 / 3
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #c9a46a
  background-size: cover
  background-position: center
  touch-action: manipulation

.wf-count
  margin: 0
  align-self: center
  padding: 2px 14px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  color: #5f4f35

.wf-fb
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
</style>
