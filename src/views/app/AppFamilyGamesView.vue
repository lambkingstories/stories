<script setup lang="ts">
/**
 * The games for the whole family (design C of Anton, 17.11.2026: "colourful game boxes" in the light look of the app, no longer the dark map): the
 * quiz as a wide blue box on top (its first form is free, the others come with Plus), below it the activity, "Wer bin ich?", the order race,
 * Bible bingo, memory and the word journey, every game in a box of its own colour with its own painted symbol (the lamb with a crown, in the style of the tile symbols). One purchase covers the family, see
 * the Plus page. The games themselves (and their board) are as before; All of it runs on the device: nothing is sent anywhere.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import LkPageHead from '@/components/molecules/LkPageHead.vue'
import PlusBadge from '@/components/atoms/PlusBadge.vue'
import useSfx from '@/use/useSfx'
import { PREMIUM_TEASER, hasFeature, showUpsell } from '@/use/usePremium'
import { prependBaseUrl } from '@/utils/function'
import { goBackTo } from '@/utils/navBack'

const { t } = useI18n({ useScope: 'global' })
const router = useRouter()
const { play } = useSfx()

function goBack() {
  // always to "My games" (one real step back when that is the page before, else it replaces this page): a game that
  // pushed this page must not become the way back
  goBackTo(router, { name: 'app-gameroom' })
}

interface Game {
  key: 'quiz' | 'activity' | 'who' | 'order' | 'bingo' | 'memory' | 'wortreise'
  to: string
  /** Comes with Plus. */
  plus: boolean
}

const GAMES: Game[] = [
  { key: 'quiz', to: 'app-family-quiz', plus: false },
  { key: 'activity', to: 'app-family-activity', plus: true },
  { key: 'who', to: 'app-family-who', plus: true },
  { key: 'order', to: 'app-family-order', plus: true },
  { key: 'bingo', to: 'app-family-bingo', plus: true },
  { key: 'memory', to: 'app-family-memory', plus: true },
  { key: 'wortreise', to: 'app-family-wortreise', plus: true }
]
const quiz = GAMES[0]!
const others = GAMES.slice(1)

/** The title or the line under it; the newer games keep their texts in their own file. */
function label(g: Game, sub: boolean): string {
  if (g.key === 'wortreise') return t(`app.bigGames.wortreise.${sub ? 'hubSub' : 'hub'}`)
  return t(`app.family.hub_${g.key}${sub ? 'Sub' : ''}`)
}

const locked = computed(() => PREMIUM_TEASER && !hasFeature('family'))
// the bingo symbol was painted again (the first lamb had too many legs): its file has a new name, so no phone keeps the old picture
const FILE: Record<string, string> = { bingo: 'bingo-2' }
const emblem = (key: string) => prependBaseUrl(`images/familie/symbole/${FILE[key] ?? key}.webp`)
function hide(e: Event) {
  ;(e.target as HTMLElement).style.display = 'none'
}

/** A game of Plus asks for Plus first (the sheet explains it); every other one just opens. */
function open(g: Game) {
  play('tap')
  if (g.plus && locked.value) {
    showUpsell('family')
    return
  }
  void router.push({ name: g.to })
}
</script>

<template lang="pug">
  div(class="app-page min-h-screen w-full")
    LkPageHead(:title="t('app.family.hubTitle')" :subtitle="PREMIUM_TEASER ? t('app.family.hubNote') : ''" @back="goBack")
    div(class="fh")
      //- the quiz: wide box on top, the free one
      button(type="button" :class="['fh-box', 'fh-box--hero', 'fh-box--' + quiz.key]" :data-game="quiz.key" @click="open(quiz)")
        span(class="fh-emblem")
          img(:src="emblem(quiz.key)" alt="" draggable="false" @error="hide")
        span(class="fh-text")
          span(class="fh-title") {{ label(quiz, false) }}
          span(class="fh-sub") {{ label(quiz, true) }}
        span(v-if="PREMIUM_TEASER" class="fh-free") {{ t('app.bigGames.rooms.free') }}
      div(class="fh-grid")
        button(
          v-for="g in others"
          :key="g.key"
          type="button"
          :class="['fh-box', 'fh-box--' + g.key]"
          :data-game="g.key"
          @click="open(g)"
        )
          span(class="fh-emblem")
            img(:src="emblem(g.key)" alt="" draggable="false" @error="hide")
          span(class="fh-text")
            span(class="fh-title") {{ label(g, false) }}
            span(class="fh-sub") {{ label(g, true) }}
          PlusBadge(v-if="g.plus && PREMIUM_TEASER" size="small" class="fh-badge")
</template>

<style scoped lang="sass">
.fh
  --em: 84px
  display: flex
  flex-direction: column
  gap: 12px
  max-width: 760px
  margin: 0 auto
  padding: 6px 16px 120px

.fh-grid
  display: grid
  grid-template-columns: repeat(2, minmax(0, 1fr))
  gap: 12px

// one box of a game: its own colour, the round emblem, the name and a line under it
.fh-box
  --bx: #2f5fb0
  position: relative
  min-width: 0
  display: flex
  flex-direction: column
  align-items: center
  justify-content: flex-start
  gap: 8px
  padding: 16px 10px 14px
  border: 0
  border-radius: 24px
  background: var(--bx)
  box-shadow: 0 4px 0 rgba(0, 0, 0, 0.18), var(--lk-shadow)
  color: #fff
  font: inherit
  text-align: center
  cursor: pointer
  -webkit-tap-highlight-color: transparent
  transition: transform 0.15s

  &:active
    transform: translateY(2px) scale(0.98)

.fh-box--hero
  flex-direction: row
  align-items: center
  gap: 14px
  padding: 14px 16px
  text-align: left

.fh-box--quiz
  --bx: #2f5fb0

.fh-box--activity
  --bx: #23808a

.fh-box--who
  --bx: #b0402f

.fh-box--order
  --bx: #3d7f76

.fh-box--bingo
  --bx: #7d52a6

.fh-box--memory
  --bx: #7a5a30

.fh-box--wortreise
  --bx: #b45a1f

.fh-emblem
  flex: none
  position: relative
  width: var(--em)
  height: var(--em)
  border-radius: 50%
  background: rgba(255, 255, 255, 0.22)

  img
    position: absolute
    inset: -8%
    width: 116%
    height: 116%
    object-fit: contain
    filter: drop-shadow(0 3px 4px rgba(0, 0, 0, 0.3))

.fh-box--hero .fh-emblem
  --em: 72px

.fh-text
  min-width: 0
  display: flex
  flex-direction: column
  gap: 2px

.fh-title
  font-size: 1.1rem
  font-weight: 800
  line-height: 1.15

.fh-sub
  font-size: 0.9rem
  font-weight: 600
  line-height: 1.25
  color: rgba(255, 255, 255, 0.9)

.fh-free
  margin-left: auto
  flex: none
  padding: 4px 12px
  border-radius: 999px
  background: #f3d27a
  color: #4a3608
  font-size: 0.85rem
  font-weight: 800

.fh-badge
  position: absolute
  top: 8px
  right: 8px
  transform: scale(0.85)
  transform-origin: right top

@media (orientation: landscape)
  .fh
    --em: clamp(56px, 16vh, 84px)
    max-width: 980px

  .fh-grid
    grid-template-columns: repeat(3, minmax(0, 1fr))
</style>
