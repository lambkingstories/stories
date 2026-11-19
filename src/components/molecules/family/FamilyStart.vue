<script setup lang="ts">
/**
 * Familien-Spiele v2: the title screen of a family game ("Titelbildschirm"). A big painted strip on top (`FamilyHero`), the name of the game
 * large and in the middle, one line of what the game is about, the big teal capsule "Spielen" and a small button "So geht's" that opens the rules
 * on a card. When a round was begun (`resumeInfo` is set) the main capsule is "Weiterspielen" (with the line where it stands) and "Spielen"
 * becomes the quiet capsule "Neues Spiel". The NAME of the game and every line come in as props (the piece never knows a game name).
 * Events: `play` (to the players page), `resume` (take up the kept round). Slots: `rules` (own content of the rules card instead of the
 * `rules` list), `extra` (below the buttons, e.g. a result of the day).
 */
import { computed, ref, useSlots } from 'vue'
import { useI18n } from 'vue-i18n'
import FamilyButton from './FamilyButton.vue'
import FamilyCard from './FamilyCard.vue'
import FamilyHero from './FamilyHero.vue'
import type { FamilyGameKey } from './familyGames'

const props = withDefaults(defineProps<{ game: FamilyGameKey; name: string; tagline?: string; rules?: string[]; resumeInfo?: string }>(), {
  tagline: '',
  rules: () => [],
  resumeInfo: ''
})
const emit = defineEmits<{ play: []; resume: [] }>()
const { t } = useI18n({ useScope: 'global' })
const slots = useSlots()
const open = ref(false)
const hasRules = computed(() => props.rules.length > 0 || !!slots.rules)
</script>

<template lang="pug">
  section(class="fam-start")
    div(class="fam-start-hero")
      FamilyHero(:game="game")
    div(class="fam-start-main")
      h1(class="fam-start-name") {{ name }}
      p(v-if="tagline" class="fam-start-line") {{ tagline }}
      div(class="fam-start-actions")
        template(v-if="resumeInfo")
          p(class="fam-start-info") {{ resumeInfo }}
          FamilyButton(class="fam-start-resume" @click="emit('resume')") {{ t('app.family.resume') }}
          FamilyButton(class="fam-start-play" quiet @click="emit('play')") {{ t('app.bigGames.familyFlow.newGame') }}
        FamilyButton(v-else class="fam-start-play" @click="emit('play')") {{ t('app.bigGames.familyFlow.play') }}
        button(v-if="hasRules" type="button" :class="['fam-start-how', { 'is-open': open }]" :aria-expanded="open" aria-controls="fam-start-rules" @click="open = !open")
          span(class="fam-start-q" aria-hidden="true") ?
          span {{ t('app.bigGames.familyFlow.howTo') }}
          span(class="fam-start-chev" aria-hidden="true")
      div(v-if="hasRules" id="fam-start-rules" :class="['fam-start-fold', { 'is-open': open }]" :aria-hidden="!open")
        div(class="fam-start-fold-in")
          FamilyCard(class="fam-start-rules" :title="t('app.bigGames.familyFlow.howTo')")
            slot(name="rules")
              ol(class="fam-start-list")
                li(v-for="(r, i) in rules" :key="i")
                  span(class="fam-start-n" aria-hidden="true") {{ i + 1 }}
                  span(class="fam-start-rule") {{ r }}
      slot(name="extra")
</template>

<style scoped lang="sass">
.fam-start
  display: flex
  flex-direction: column
  align-items: center
  gap: 20px
  width: 100%
  max-width: 36rem
  // in a column of the page (flex): the screen sits in the vertical middle when it is shorter than the window
  margin: auto
  padding: 6px 0 28px

.fam-start-hero
  width: 100%

.fam-start-main
  display: flex
  flex-direction: column
  align-items: center
  gap: 10px
  width: 100%
  min-width: 0
  text-align: center

.fam-start-name
  margin: 6px 0 0
  color: var(--fam-ink)
  font-size: 2.25rem
  font-weight: 800
  line-height: 1.1
  letter-spacing: -0.01em
  text-align: center
  overflow-wrap: anywhere

.fam-start-line
  margin: 0
  max-width: 26rem
  color: var(--fam-muted)
  font-size: 1.15rem
  font-weight: 600
  line-height: 1.35
  text-align: center

.fam-start-actions
  display: flex
  flex-direction: column
  align-items: center
  gap: 12px
  width: 100%
  padding-top: 10px

.fam-start-actions :deep(.fam-btn)
  width: min(100%, 22rem)

.fam-start-info
  margin: 0
  color: var(--fam-muted)
  font-size: 1.02rem
  font-weight: 700
  text-align: center

// the small button "So geht's": a quiet pill with a question mark and a chevron
.fam-start-how
  display: inline-flex
  align-items: center
  justify-content: center
  gap: 10px
  min-height: 48px
  padding: 6px 16px
  border: 0
  border-radius: 999px
  background: transparent
  color: var(--fam-primary-ink)
  font: inherit
  font-size: 1.05rem
  font-weight: 800
  cursor: pointer
  touch-action: manipulation
  -webkit-tap-highlight-color: transparent

  &:focus-visible
    outline: 3px solid var(--fam-focus)
    outline-offset: 2px

.fam-start-q
  display: grid
  place-items: center
  width: 26px
  height: 26px
  border: 2px solid currentColor
  border-radius: 50%
  font-size: 0.95rem
  font-weight: 800
  line-height: 1

.fam-start-chev
  width: 9px
  height: 9px
  margin-top: -3px
  border: solid currentColor
  border-width: 0 2.5px 2.5px 0
  transform: rotate(45deg)
  transition: transform 0.25s

.is-open .fam-start-chev
  margin-top: 3px
  transform: rotate(-135deg)

// the rules fold open: the row grows from 0 to its height
.fam-start-fold
  display: grid
  grid-template-rows: 0fr
  width: 100%
  visibility: hidden
  transition: grid-template-rows 0.3s ease, visibility 0s 0.3s

  &.is-open
    grid-template-rows: 1fr
    visibility: visible
    transition: grid-template-rows 0.3s ease, visibility 0s

.fam-start-fold-in
  min-height: 0
  overflow: hidden

  // room for the shadow of the card
  padding: 0 4px

.fam-start-rules
  margin: 4px 0 8px
  width: calc(100% - 0px)

.fam-start-list
  display: grid
  gap: 12px
  width: 100%
  margin: 0
  padding: 0
  list-style: none

  li
    display: grid
    grid-template-columns: 34px minmax(0, 1fr) 34px
    align-items: center
    gap: 8px
    min-height: 44px

.fam-start-n
  display: grid
  place-items: center
  width: 34px
  height: 34px
  border-radius: 50%
  background: var(--fam-accent)
  color: var(--fam-on-accent)
  font-size: 1rem
  font-weight: 800

.fam-start-rule
  text-align: center
  font-size: 1.08rem
  font-weight: 600
  line-height: 1.35

// the screen builds up: picture, name, line, buttons
@media (prefers-reduced-motion: no-preference)
  .fam-start-hero
    animation: fam-start-in 0.6s cubic-bezier(0.25, 0.8, 0.3, 1) both

  .fam-start-name
    animation: fam-start-in 0.55s 0.12s cubic-bezier(0.25, 0.8, 0.3, 1) both

  .fam-start-line
    animation: fam-start-in 0.55s 0.2s cubic-bezier(0.25, 0.8, 0.3, 1) both

  .fam-start-actions
    animation: fam-start-in 0.55s 0.3s cubic-bezier(0.25, 0.8, 0.3, 1) both

@keyframes fam-start-in
  from
    opacity: 0
    transform: translateY(14px)
  to
    opacity: 1
    transform: none

@media (prefers-reduced-motion: reduce)
  .fam-start-fold
    transition: none !important

  .fam-start-chev
    transition: none

// a tablet held upright: everything a little bigger
@media (orientation: portrait) and (min-width: 700px)
  .fam-start
    max-width: 44rem

  .fam-start-name
    font-size: 2.7rem

  .fam-start-line
    max-width: 32rem
    font-size: 1.3rem

// sideways (a phone held wide): the picture left, the rest right
@media (orientation: landscape) and (min-width: 700px)
  .fam-start
    display: grid
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr)
    align-items: center
    gap: 8px 28px
    max-width: 62rem

  .fam-start-name
    font-size: 2rem

  .fam-start-line
    font-size: 1.05rem

  .fam-start-actions
    padding-top: 4px
    gap: 8px
</style>
