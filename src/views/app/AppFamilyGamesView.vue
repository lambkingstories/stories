<script setup lang="ts">
/**
 * The games for the whole family, one square tile each: the quiz (its first form is free, the others come with Plus), the activity and
 * "Wer bin ich?" (Plus). One purchase covers the family, see the Plus page. All of it runs on the device: nothing is sent anywhere and
 * nobody has an account.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import LkPageHead from '@/components/molecules/LkPageHead.vue'
import PlusBadge from '@/components/atoms/PlusBadge.vue'
import { PREMIUM_TEASER, hasFeature, showUpsell } from '@/use/usePremium'
import { prependBaseUrl } from '@/utils/function'

const { t } = useI18n({ useScope: 'global' })
const router = useRouter()

function goBack() {
  if (window.history.length > 1) router.back()
  else void router.push({ name: 'app-adventure' })
}

interface Game {
  key: 'quiz' | 'activity' | 'who' | 'order' | 'bingo' | 'memory'
  to: string
  icon: string
  /** Comes with Plus. */
  plus: boolean
}

const GAMES: Game[] = [
  { key: 'quiz', to: 'app-family-quiz', icon: 'symbol-quiz', plus: false },
  { key: 'activity', to: 'app-family-activity', icon: 'symbol-activity', plus: true },
  { key: 'who', to: 'app-family-who', icon: 'symbol-werbinich', plus: true },
  { key: 'order', to: 'app-family-order', icon: 'symbol-reihenfolge', plus: true },
  { key: 'bingo', to: 'app-family-bingo', icon: 'symbol-bingo', plus: true },
  { key: 'memory', to: 'app-family-memory', icon: 'symbol-memory', plus: true }
]

const locked = computed(() => PREMIUM_TEASER && !hasFeature('family'))
const icon = (name: string) => prependBaseUrl(`images/icons/spiele/${name}.webp`)

/** A game of Plus asks for Plus first (the sheet explains it); every other one just opens. */
function open(g: Game) {
  if (g.plus && locked.value) {
    showUpsell('family')
    return
  }
  void router.push({ name: g.to })
}
</script>

<template lang="pug">
  div(class="app-page min-h-screen w-full")
    LkPageHead(:title="t('app.family.hubTitle')" :subtitle="t('app.family.hubSub')" @back="goBack")

    section(class="fh-wrap")
      p(class="fh-intro") {{ t('app.family.hubIntro') }}

      div(class="fh-grid")
        button(
          v-for="g in GAMES"
          :key="g.key"
          type="button"
          :class="['fh-tile', { 'is-plus': g.plus && PREMIUM_TEASER }]"
          @click="open(g)"
        )
          PlusBadge(v-if="g.plus && PREMIUM_TEASER" size="small" class="fh-badge")
          img(:src="icon(g.icon)" alt="" class="fh-img" draggable="false")
          span(class="fh-title") {{ t(`app.family.hub_${g.key}`) }}
          span(class="fh-sub") {{ t(`app.family.hub_${g.key}Sub`) }}

      p(class="fh-note") {{ t('app.family.hubNote') }}

    div(class="h-32")
</template>

<style scoped lang="sass">
.app-page
  background-color: var(--color-bg-main)
  color: var(--color-text-primary)

.fh-wrap
  display: grid
  grid-template-columns: minmax(0, 1fr)
  gap: 14px
  max-width: 36rem
  margin: 14px auto 0
  padding: 0 16px

.fh-intro
  margin: 0
  line-height: 1.5

.fh-grid
  display: grid
  grid-template-columns: repeat(2, minmax(0, 1fr))
  grid-auto-rows: 1fr
  gap: 10px

.fh-tile
  min-width: 0
  position: relative
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  gap: 4px
  min-height: 190px
  padding: 12px 12px 14px
  border: 1px solid var(--lk-line)
  border-radius: 24px
  background: var(--lk-surface)
  box-shadow: var(--lk-shadow)
  color: var(--lk-text)
  font: inherit
  text-align: center
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  &:active
    transform: translateY(1px)

  &.is-plus
    border-color: #e0bd62
    background: linear-gradient(160deg, #fdf5dc, #f8e6ae)
    color: #3a2c10

.fh-badge
  position: absolute
  top: 8px
  right: 8px

.fh-img
  width: 84px
  height: 84px
  margin-bottom: 4px
  object-fit: contain

.fh-title
  font-size: 1.05rem
  font-weight: 800
  line-height: 1.15

.fh-sub
  font-size: 0.82rem
  line-height: 1.3
  color: var(--lk-muted)

.fh-tile.is-plus .fh-sub
  color: #5b4a22

.fh-note
  margin: 0
  font-size: 0.9rem
  line-height: 1.4
  color: var(--lk-muted)
</style>
