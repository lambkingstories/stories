<script setup lang="ts">
/**
 * The games for the whole family on the old map: six places, each a bronze emblem with a parchment strip below it, the quiz (its first
 * form is free, the others come with Plus), the activity, "Wer bin ich?", the order race, Bible bingo and memory (Plus). One purchase
 * covers the family, see the Plus page. All of it runs on the device: nothing is sent anywhere and nobody has an account.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import MapTable from '@/components/molecules/map/MapTable.vue'
import MapPaper from '@/components/molecules/map/MapPaper.vue'
import PlusBadge from '@/components/atoms/PlusBadge.vue'
import useSfx from '@/use/useSfx'
import { PREMIUM_TEASER, hasFeature, showUpsell } from '@/use/usePremium'
import { prependBaseUrl } from '@/utils/function'

const { t } = useI18n({ useScope: 'global' })
const router = useRouter()
const { play } = useSfx()

function goBack() {
  if (window.history.length > 1) router.back()
  else void router.push({ name: 'app-adventure' })
}

interface Game {
  key: 'quiz' | 'activity' | 'who' | 'order' | 'bingo' | 'memory'
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
  { key: 'memory', to: 'app-family-memory', plus: true }
]

const locked = computed(() => PREMIUM_TEASER && !hasFeature('family'))
const emblem = (key: string) => prependBaseUrl(`images/familie/karte/emblem-${key}.webp`)
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
  MapTable(:title="t('app.family.hubTitle')" @back="goBack")
    div(class="fh")
      div(class="fh-grid")
        button(
          v-for="g in GAMES"
          :key="g.key"
          type="button"
          :class="['fh-place', 'fh-place--' + g.key]"
          @click="open(g)"
        )
          span(class="fh-emblem")
            img(:src="emblem(g.key)" alt="" class="fh-img" draggable="false" @error="hide")
            PlusBadge(v-if="g.plus && PREMIUM_TEASER" size="small" class="fh-badge")
          MapPaper(kind="strip" class="fh-strip")
            span(class="fh-label")
              span(class="fh-title") {{ t(`app.family.hub_${g.key}`) }}
              span(class="fh-sub") {{ t(`app.family.hub_${g.key}Sub`) }}

      MapPaper(kind="strip" class="fh-note")
        span(class="fh-note-text") {{ t('app.family.hubNote') }}
</template>

<style scoped lang="sass">
.fh
  --em: 104px
  display: flex
  flex-direction: column
  gap: 16px
  max-width: 44rem
  margin: 0 auto
  padding-top: 6px

.fh-grid
  display: grid
  grid-template-columns: repeat(2, minmax(0, 1fr))
  gap: 14px 12px

.fh-place
  min-width: 0
  display: flex
  flex-direction: column
  align-items: center
  gap: 4px
  padding: 0
  border: 0
  background: transparent
  color: inherit
  font: inherit
  cursor: pointer
  -webkit-tap-highlight-color: transparent
  transition: transform 0.18s

  &:active
    transform: translateY(1px) scale(0.98)

  &:hover .fh-emblem
    transform: translateY(-3px)

// the round place on the map, every game in another material; the colored disc only shows while the picture is missing
.fh-emblem
  position: relative
  display: grid
  place-items: center
  width: var(--em)
  height: var(--em)
  border-radius: 50%
  background: radial-gradient(circle at 38% 32%, var(--em-a, #c79a45), var(--em-b, #7d5a22) 68%, var(--em-c, #4d3513))
  box-shadow: inset 0 0 0 3px rgba(255, 224, 150, 0.35)
  filter: drop-shadow(0 7px 8px rgba(10, 5, 0, 0.6))
  transition: transform 0.2s

.fh-place--quiz
  --em-a: #e6c25a
  --em-b: #1f3f8a
  --em-c: #14285c

.fh-place--activity
  --em-a: #d8dde0
  --em-b: #2a8f98
  --em-c: #1a5f66

.fh-place--who
  --em-a: #b8402f
  --em-b: #7a1f18
  --em-c: #4a100c

.fh-place--order
  --em-a: #5fa49a
  --em-b: #2f6f68
  --em-c: #1c4540

.fh-place--bingo
  --em-a: #a06ac0
  --em-b: #55307a
  --em-c: #34194f

.fh-place--memory
  --em-a: #efe3c4
  --em-b: #6b4a2a
  --em-c: #3b2713

.fh-img
  position: absolute
  inset: -3%
  width: 106%
  height: 106%
  object-fit: contain

.fh-badge
  position: absolute
  right: -8px
  bottom: 2px
  transform: scale(0.82)
  transform-origin: right bottom

.fh-strip
  flex: 1
  min-height: 0

  :deep(.mpa-in)
    min-height: 0
    justify-content: center
    padding: 12px 5% 12px 14%

.fh-label
  display: flex
  flex-direction: column
  gap: 1px
  min-width: 0

.fh-title
  font-size: 1.05rem
  font-weight: 800
  line-height: 1.12
  letter-spacing: 0.02em

.fh-sub
  font-size: 0.92rem
  font-weight: 600
  line-height: 1.2
  color: var(--mp-ink-soft, #6b5230)

.fh-note
  :deep(.mpa-in)
    padding: 12px 5% 12px 14%

.fh-note-text
  font-size: 1rem
  font-weight: 600
  line-height: 1.3

@media (orientation: landscape)
  .fh
    --em: clamp(56px, 17vh, 96px)
    gap: 10px
    max-width: 62rem

  .fh-grid
    grid-template-columns: repeat(3, minmax(0, 1fr))
    gap: 8px 14px

  .fh-sub
    font-size: 0.85rem
</style>
