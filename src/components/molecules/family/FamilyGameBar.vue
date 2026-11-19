<script setup lang="ts">
/**
 * Familien-Spiele v2: the bar on top of a game that runs (in the colour of the game, rounded at the bottom). At the left the button to leave (it asks
 * "End the game?" first, with a line you can set; `confirm` = false leaves at once), in the middle the NAME of the game (a prop, never fixed here) with an
 * optional line under it (e.g. "Question 3 of 10"), at the right the buttons for music and sounds, below (or sideways when the phone is held wide) one chip
 * for every player with the figure, the name and the score; the player whose turn it is has the gold chip. Event: `leave` (the player really wants to end).
 * Put it in the slot `top` of `MapTable` (that takes the place of the standard header). Slot `actions`: own round buttons (48 px) left of the sound buttons
 * (e.g. "play sideways" of the pairs game).
 */
import { nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import FamilyButton from './FamilyButton.vue'
import FamilySoundButtons from './FamilySoundButtons.vue'
import MapToken from '@/components/molecules/map/MapToken.vue'
import type { FamilyGameKey } from './familyGames'

export interface FamilyBarPlayer {
  name: string
  score: number | string
  /** The seat (0 for the first one): its figure is shown. */
  index: number
  turn?: boolean
}

const props = withDefaults(defineProps<{ game: FamilyGameKey; title: string; subtitle?: string; players?: FamilyBarPlayer[]; confirm?: boolean; leaveText?: string }>(), {
  subtitle: '',
  players: () => [],
  confirm: true,
  leaveText: ''
})
const emit = defineEmits<{ leave: [] }>()
const { t } = useI18n({ useScope: 'global' })
const asking = ref(false)

function ask() {
  if (!props.confirm) {
    emit('leave')
    return
  }
  asking.value = true
}
function end() {
  asking.value = false
  emit('leave')
}
watch(asking, (on) => {
  if (on) void nextTick(() => (document.querySelector('.fam-bar-stay') as HTMLElement | null)?.focus())
})
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') asking.value = false
}
</script>

<template lang="pug">
  header(:class="['fam-bar', 'fam-game--' + game]")
    div(class="fam-bar-back")
      button(type="button" class="fam-bar-btn" :aria-label="t('app.bigGames.familyFlow.leaveTitle')" @click="ask")
        span(aria-hidden="true") ‹
    div(class="fam-bar-titles")
      h1(:class="['fam-bar-title', { 'is-long': title.length > 14 }]") {{ title }}
      p(v-if="subtitle" class="fam-bar-sub") {{ subtitle }}
    div(class="fam-bar-sound")
      slot(name="actions")
      FamilySoundButtons
    ul(v-if="players.length" :class="['fam-bar-players', { 'is-many': players.length > 4 }]" :aria-label="title")
      li(v-for="(p, i) in players" :key="i" :class="['fam-bar-chip', { 'is-turn': p.turn }]")
        MapToken(:index="p.index" :size="players.length > 4 ? 26 : 30" :lit="p.turn")
        span(class="fam-bar-name") {{ p.name }}
        span(class="fam-bar-score") {{ p.score }}

    //- "End the game?"
    div(v-if="asking" class="fam-bar-veil" @click.self="asking = false" @keydown="onKey")
      div(class="fam-bar-dialog" role="alertdialog" aria-modal="true" aria-labelledby="fam-bar-q" aria-describedby="fam-bar-t")
        h2(id="fam-bar-q" class="fam-bar-q") {{ t('app.bigGames.familyFlow.leaveTitle') }}
        p(id="fam-bar-t" class="fam-bar-t") {{ leaveText || t('app.bigGames.familyFlow.leaveLost') }}
        FamilyButton(class="fam-bar-stay" @click="asking = false") {{ t('app.bigGames.familyFlow.leaveStay') }}
        FamilyButton(class="fam-bar-end" quiet @click="end") {{ t('app.bigGames.familyFlow.leaveEnd') }}
</template>

<style scoped lang="sass">
.fam-bar
  position: relative
  box-sizing: border-box
  display: grid
  grid-template-columns: 48px minmax(0, 1fr) auto
  grid-template-areas: 'back titles sound' 'players players players'
  align-items: center
  gap: 8px 10px
  padding: max(10px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) 14px max(12px, env(safe-area-inset-left))
  border-radius: 0 0 28px 28px
  background: linear-gradient(180deg, color-mix(in srgb, var(--fam-accent) 84%, white), var(--fam-accent) 70%)
  color: var(--fam-on-accent)
  box-shadow: 0 12px 24px -16px color-mix(in srgb, var(--fam-accent) 80%, black)

.fam-bar-back
  grid-area: back

.fam-bar-sound
  grid-area: sound
  display: flex
  align-items: center
  gap: 8px

.fam-bar-btn
  display: grid
  place-items: center
  width: 48px
  height: 48px
  padding: 0 0 4px
  border: 1.5px solid rgba(255, 255, 255, 0.4)
  border-radius: 50%
  background: rgba(255, 255, 255, 0.18)
  color: var(--fam-on-accent)
  font: inherit
  font-size: 2rem
  line-height: 1
  cursor: pointer
  touch-action: manipulation
  -webkit-tap-highlight-color: transparent

  &:focus-visible
    outline: 3px solid var(--fam-focus)
    outline-offset: 2px

.fam-bar-titles
  grid-area: titles
  display: flex
  flex-direction: column
  align-items: center
  min-width: 0
  text-align: center

.fam-bar-title
  max-width: 100%
  margin: 0
  overflow: hidden
  font-size: 1.3rem
  font-weight: 800
  line-height: 1.15
  text-overflow: ellipsis
  white-space: nowrap

// a long name (more than 14 letters): a little smaller, and it may take two lines instead of being cut off
.fam-bar-title.is-long
  font-size: clamp(1.02rem, 4.7vw, 1.3rem)
  white-space: normal
  overflow-wrap: anywhere
  display: -webkit-box
  -webkit-box-orient: vertical
  -webkit-line-clamp: 2

.fam-bar-sub
  margin: 1px 0 0
  font-size: 0.95rem
  font-weight: 700
  line-height: 1.2
  opacity: 0.92

.fam-bar-players
  grid-area: players
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 8px
  margin: 0
  padding: 0
  list-style: none

.is-many .fam-bar-chip
  gap: 5px
  padding-right: 9px

.is-many .fam-bar-name
  max-width: 5.5em
  font-size: 0.92rem

.is-many .fam-bar-score
  font-size: 1rem

.fam-bar-chip
  display: inline-flex
  align-items: center
  gap: 7px
  max-width: 100%
  padding: 3px 12px 3px 6px
  border: 1.5px solid rgba(255, 255, 255, 0.4)
  border-radius: 999px
  background: rgba(255, 255, 255, 0.18)
  color: var(--fam-on-accent)
  transition: background 0.25s, color 0.25s, transform 0.25s, box-shadow 0.25s

  &.is-turn
    border-color: var(--fam-gold-deep)
    background: var(--fam-gold)
    color: var(--fam-on-gold)
    box-shadow: 0 3px 0 var(--fam-gold-deep), 0 8px 14px -8px rgba(0, 0, 0, 0.5)
    transform: translateY(-1px)

.fam-bar-name
  max-width: 7em
  overflow: hidden
  font-size: 1rem
  font-weight: 700
  text-overflow: ellipsis
  white-space: nowrap

.fam-bar-score
  min-width: 1.3em
  font-size: 1.15rem
  font-weight: 800
  text-align: center

// "End the game?"
.fam-bar-veil
  position: fixed
  inset: 0
  z-index: 80
  display: grid
  place-items: center
  padding: 18px
  background: rgba(10, 30, 32, 0.55)

.fam-bar-dialog
  box-sizing: border-box
  display: flex
  flex-direction: column
  align-items: center
  gap: 12px
  width: min(100%, 24rem)
  padding: 24px 20px 20px
  border-radius: var(--fam-r-card)
  background: var(--fam-card)
  box-shadow: 0 24px 48px -16px rgba(0, 0, 0, 0.55)
  color: var(--fam-ink)
  text-align: center

  :deep(.fam-btn)
    width: 100%
    min-width: 0

.fam-bar-q
  margin: 0
  font-size: 1.45rem
  font-weight: 800
  line-height: 1.15

.fam-bar-t
  margin: 0 0 6px
  color: var(--fam-muted)
  font-size: 1.05rem
  font-weight: 600
  line-height: 1.35

@media (prefers-reduced-motion: no-preference)
  .fam-bar-veil
    animation: fam-bar-fade 0.2s ease both

  .fam-bar-dialog
    animation: fam-bar-pop 0.28s cubic-bezier(0.3, 1.4, 0.5, 1) both

@keyframes fam-bar-fade
  from
    opacity: 0

@keyframes fam-bar-pop
  from
    opacity: 0
    transform: translateY(14px) scale(0.94)

// a phone held wide: one thin row, the players between the name and the buttons
@media (orientation: landscape) and (max-height: 520px)
  .fam-bar
    grid-template-columns: 48px minmax(0, auto) minmax(0, 1fr) auto
    grid-template-areas: 'back titles players sound'
    padding-bottom: 8px
    border-radius: 0 0 22px 22px
</style>
