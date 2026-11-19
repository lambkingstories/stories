<script setup lang="ts">
/**
 * Familien-Spiele v2: "Who is playing?", the page of the players before a round (the lobby). From the top: the heading, a slot `top` (e.g. the way of
 * playing, "one device / several phones"), the number of players (round chips), a card for EVERY player with a big painted figure (a tap on it gives the
 * next free figure; two players never have the same one: `useFamilyTokens` swaps) and the name field, the choice "alone / in two teams" (with
 * `team-option`), a slot `settings` for the cards of the settings of the game (questions, time, size ...), and fixed at the bottom the big teal capsule
 * (sticky, safe area kept). The game name never stands in here. `fixed` = no choice of the number (one fixed number of cards, e.g. one person with the
 * round code); `hide-go` = no capsule (the game brings its own buttons in the `settings` slot).
 * Events: `update:count`, `update:names`, `update:teams`, `go`.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import FamilyButton from './FamilyButton.vue'
import FamilyCard from './FamilyCard.vue'
import FamilyChip from './FamilyChip.vue'
import MapToken from '@/components/molecules/map/MapToken.vue'
import { MAP_MAX_PLAYERS } from '@/components/molecules/map/tokenColors'
import useFamilyTokens from '@/use/useFamilyTokens'
import useSfx from '@/use/useSfx'
import type { FamilyGameKey } from './familyGames'

const props = withDefaults(
  defineProps<{
    game: FamilyGameKey
    /** The heading (standard: "Wer spielt mit?"). */
    title?: string
    count: number
    names: string[]
    min?: number
    max?: number
    /** The number is fixed (`count` cards, no chips). */
    fixed?: boolean
    /** Text of the empty name field; `{n}` is the number of the player. */
    placeholderKey?: string
    /** Show the choice "alone / in two teams". */
    teamOption?: boolean
    teams?: boolean
    /** Which team a seat is in (0 or 1); standard: the seats take turns (1st, 3rd ... against 2nd, 4th ...). */
    teamOf?: (seat: number) => number
    /** Text of the capsule (standard: "Los geht's"). */
    goLabel?: string
    /** The capsule is off (the round cannot begin yet). */
    canGo?: boolean
    /** No capsule at all. */
    hideGo?: boolean
  }>(),
  { title: '', min: 1, max: MAP_MAX_PLAYERS, fixed: false, placeholderKey: 'app.family.player', teamOption: false, teams: false, teamOf: (seat: number) => seat % 2, goLabel: '', canGo: true, hideGo: false }
)
const emit = defineEmits<{ 'update:count': [n: number]; 'update:names': [names: string[]]; 'update:teams': [on: boolean]; go: [] }>()
const { t } = useI18n({ useScope: 'global' })
const { tokens, setToken } = useFamilyTokens()
const { play } = useSfx()

const heading = computed(() => props.title || t('app.bigGames.familyFlow.whoPlays'))
const seats = computed(() => Array.from({ length: props.count }, (_, i) => i))

function setName(i: number, v: string) {
  const next = props.names.slice()
  next[i] = v
  emit('update:names', next)
}
function onInput(i: number, e: Event) {
  setName(i, (e.target as HTMLInputElement).value)
}

/** A tap on the figure: the next one that nobody of the round has (if all eight are taken, it swaps with the next one). */
function nextFigure(seat: number) {
  const cur = tokens.value[seat] ?? seat
  let pick = (cur + 1) % 8
  for (let k = 1; k < 8; k++) {
    const cand = (cur + k) % 8
    if (tokens.value.indexOf(cand) >= props.count) {
      pick = cand
      break
    }
  }
  setToken(seat, pick)
  void play('tap')
}

function pickTeams(on: boolean) {
  emit('update:teams', on)
  void play('tap')
}
</script>

<template lang="pug">
  section(class="fam-lobby")
    h1(class="fam-lobby-title") {{ heading }}
    div(v-if="$slots.top" class="fam-lobby-top")
      slot(name="top")

    div(class="fam-lobby-cols")
      div(class="fam-lobby-main")
        //- how many: round chips
        div(v-if="!fixed" class="fam-lobby-count" role="radiogroup" :aria-label="t('app.bigGames.familyFlow.playerCount')")
          template(v-for="n in max" :key="n")
            FamilyChip(v-if="n >= min" round :selected="count === n" :aria-label="String(n)" @click="emit('update:count', n)") {{ n }}

        //- a card for every player: the big figure (a tap gives the next one) and the name
        ul(:class="['fam-lobby-seats', 'is-' + Math.min(count, 4)]")
          li(v-for="i in seats" :key="i" :class="['fam-lobby-seat', { 'has-team': teamOption && teams }]")
            span(v-if="teamOption && teams" :class="['fam-lobby-team', 'is-team-' + teamOf(i)]") {{ t('app.family.team', { n: teamOf(i) + 1 }) }}
            button(type="button" class="fam-lobby-fig" :aria-label="t('app.bigGames.familyFlow.figureNext')" @click="nextFigure(i)")
              span(:key="tokens[i]" class="fam-lobby-fig-in")
                MapToken(:index="i" :size="80")
              span(class="fam-lobby-swap" aria-hidden="true")
            input(
              :value="names[i] ?? ''"
              class="fam-lobby-name"
              type="text"
              maxlength="16"
              :placeholder="t(placeholderKey, { n: i + 1 })"
              :aria-label="t(placeholderKey, { n: i + 1 })"
              @input="onInput(i, $event)"
            )
        p(v-if="count > 0" class="fam-lobby-hint") {{ t('app.bigGames.familyFlow.figureHint') }}

        //- alone or in two teams
        div(v-if="teamOption" class="fam-lobby-teams" role="radiogroup" :aria-label="t('app.family.teamsOn')")
          FamilyChip(class="fam-lobby-teamchip" :selected="!teams" @click="pickTeams(false)") {{ t('app.bigGames.familyFlow.teamSolo') }}
          FamilyChip(class="fam-lobby-teamchip" :selected="teams" @click="pickTeams(true)") {{ t('app.family.teamsOn') }}
        FamilyCard(v-if="teamOption && teams" compact)
          span(class="fam-lobby-note") {{ t('app.family.teamsNote') }}

      //- the settings of the game
      div(class="fam-lobby-settings")
        slot(name="settings")

    //- the big capsule, fixed at the bottom
    div(v-if="!hideGo" class="fam-lobby-go")
      FamilyButton(:disabled="!canGo" @click="emit('go')") {{ goLabel || t('app.family.start') }}
</template>

<style scoped lang="sass">
.fam-lobby
  display: flex
  flex-direction: column
  align-items: center
  gap: 16px
  width: 100%
  max-width: 36rem
  margin: 0 auto
  padding: 4px 0 0

.fam-lobby-title
  margin: 4px 0 0
  color: var(--fam-ink)
  font-size: 1.75rem
  font-weight: 800
  line-height: 1.15
  text-align: center

.fam-lobby-top
  width: 100%

.fam-lobby-cols, .fam-lobby-main
  display: flex
  flex-direction: column
  align-items: center
  gap: 16px
  width: 100%
  min-width: 0

.fam-lobby-count
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 12px
  // the chips break into even rows (4 and 3, or 4 and 4) instead of one long row and a few left over
  max-width: 17rem
  padding: 4px 6px 2px

// the cards of the players: two in a row (a single one, or three of four, stay in the middle)
.fam-lobby-seats
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 14px
  width: 100%
  margin: 0
  padding: 0
  list-style: none

.fam-lobby-seat
  position: relative
  box-sizing: border-box
  display: flex
  flex-direction: column
  align-items: center
  gap: 8px
  flex: 0 1 calc(50% - 7px)
  min-width: 0
  padding: 14px 10px 12px
  border: 1.5px solid var(--fam-line)
  border-radius: var(--fam-r-card)
  background: var(--fam-card)
  box-shadow: var(--fam-shadow)

  &.has-team
    padding-top: 36px

.is-1 .fam-lobby-seat
  flex-basis: min(100%, 17rem)

.fam-lobby-team
  position: absolute
  top: 0
  left: 50%
  transform: translateX(-50%)
  padding: 3px 14px 4px
  border-radius: 0 0 14px 14px
  background: var(--fam-c-bg)
  color: var(--fam-c-ink)
  font-size: 0.9rem
  font-weight: 800
  white-space: nowrap

  &.is-team-1
    background: var(--fam-b-bg)
    color: var(--fam-b-ink)

.fam-lobby-fig
  position: relative
  display: grid
  place-items: center
  width: 108px
  height: 108px
  padding: 0
  border: 0
  border-radius: 50%
  background: radial-gradient(circle at 50% 40%, color-mix(in srgb, var(--fam-accent) 22%, var(--fam-card)), color-mix(in srgb, var(--fam-accent) 8%, var(--fam-card)) 72%)
  box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--fam-accent) 30%, transparent)
  cursor: pointer
  touch-action: manipulation
  -webkit-tap-highlight-color: transparent

  &:focus-visible
    outline: 3px solid var(--fam-focus)
    outline-offset: 3px

  &:active
    transform: scale(0.95)

.fam-lobby-fig-in
  display: grid
  place-items: center
  width: 78%
  height: 78%

  // the figure fills its disc (the disc is smaller when the phone is held wide)
  :deep(.mtk)
    width: 100% !important
    height: 100% !important

// the small round arrow at the foot of the figure: "a tap gives another one" (drawn by borders)
.fam-lobby-swap
  position: absolute
  right: 0
  bottom: 2px
  width: 30px
  height: 30px
  border: 2px solid var(--fam-card)
  border-radius: 50%
  background: var(--fam-accent)
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.25)

  &::before
    content: ''
    position: absolute
    inset: 6px
    border: 2.5px solid var(--fam-on-accent)
    border-top-color: transparent
    border-radius: 50%
    transform: rotate(35deg)

  &::after
    content: ''
    position: absolute
    left: 17px
    top: 6px
    width: 0
    height: 0
    border-left: 5px solid transparent
    border-right: 5px solid transparent
    border-bottom: 7px solid var(--fam-on-accent)
    transform: rotate(60deg)

.fam-lobby-name
  box-sizing: border-box
  width: 100%
  min-width: 0
  min-height: 48px
  padding: 4px 10px
  border: 1.5px solid var(--fam-line-strong)
  border-radius: var(--fam-r-field)
  background: var(--fam-field)
  color: var(--fam-ink)
  font: inherit
  font-size: 1.1rem
  font-weight: 700
  text-align: center
  outline: none
  transition: border-color 0.2s, box-shadow 0.2s

  &::placeholder
    color: var(--fam-muted)
    opacity: 0.9
    font-weight: 600

  &:focus
    border-color: var(--fam-gold)
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--fam-focus) 45%, transparent)

.fam-lobby-hint
  margin: -6px 0 0
  color: var(--fam-muted)
  font-size: 0.95rem
  font-weight: 600
  text-align: center

.fam-lobby-teams
  display: grid
  grid-template-columns: repeat(2, minmax(0, 1fr))
  gap: 10px
  width: 100%

.fam-lobby-teamchip
  width: 100%
  min-height: 56px
  padding: 8px 10px

.fam-lobby-note
  display: block
  width: 100%
  color: var(--fam-muted)
  font-size: 1.02rem
  font-weight: 600
  line-height: 1.35
  text-align: center

.fam-lobby-settings
  display: flex
  flex-direction: column
  gap: 16px
  width: 100%

  &:empty
    display: none

// the capsule at the foot of the page: it stays in sight while the page scrolls, and keeps clear of the home bar
.fam-lobby-go
  position: sticky
  bottom: 0
  z-index: 3
  display: flex
  justify-content: center
  box-sizing: border-box
  width: calc(100% + 28px)
  margin: 0 -14px -4px
  padding: 18px 14px max(14px, env(safe-area-inset-bottom))
  background: linear-gradient(to bottom, transparent, var(--lk-bg) 42%)
  pointer-events: none

  :deep(.fam-btn)
    width: min(100%, 24rem)
    pointer-events: auto

// the figure pops when it changes
@media (prefers-reduced-motion: no-preference)
  .fam-lobby-fig-in
    animation: fam-lobby-pop 0.38s cubic-bezier(0.3, 1.5, 0.5, 1) both

@keyframes fam-lobby-pop
  from
    opacity: 0.2
    transform: scale(0.6) rotate(-12deg)
  to
    opacity: 1
    transform: none

// sideways: the players on the left, the settings on the right
@media (orientation: landscape) and (min-width: 700px)
  .fam-lobby
    max-width: 62rem
    gap: 10px

  .fam-lobby-title
    margin: 0
    font-size: 1.35rem

  // the capsule takes less height, so that more of the page stays in sight
  .fam-lobby-go
    padding-top: 10px
    padding-bottom: max(8px, env(safe-area-inset-bottom))

  .fam-lobby-cols
    display: grid
    grid-template-columns: minmax(0, 1fr) minmax(0, 24rem)
    align-items: start
    gap: 10px 22px

  .fam-lobby-settings:empty
    display: none

  .fam-lobby-seat
    gap: 6px
    padding: 10px 10px 10px

    &.has-team
      padding-top: 30px

  .fam-lobby-fig
    width: 76px
    height: 76px
</style>
