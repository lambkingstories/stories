<script setup lang="ts">
/**
 * "Meine Spiele": all the games of the child on one page (Anton, 17.11.2026), in three groups, one below the other:
 *  - the adventure games (the big reward games; the bar "You may pick a game!" and the window to pick one are part of this group),
 *  - the stage games (the small games of the stages; one opens with the three stars of its stage),
 *  - the family games (the old-map page with the quiz, activity, memory and the others; one card leads there, nothing of them changed).
 * The first two groups come from `MyRewards`. Three chips at the top jump to the groups (the page is long). The old names "Minispiele",
 * "Bonusspiele" and "Spielzimmer" are gone. This page is reached from "Me" (the tile "My games") and from the games card of the start page.
 * The route name is still `app-gameroom` (so every old link arrives), the address is `/app/spiele`.
 */
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import LkPageHead from '@/components/molecules/LkPageHead.vue'
import MyRewards from '@/components/molecules/MyRewards.vue'
import { prependBaseUrl } from '@/utils/function'

const { t } = useI18n({ useScope: 'global' })
const router = useRouter()

function goBack() {
  if (window.history.length > 1) router.back()
  else void router.push({ name: 'app-profile' })
}

/** The three groups and the ids of their headings (the first two are in `MyRewards`). */
const GROUPS = [
  { id: 'rw-bonus', label: 'app.bigGames.title' },
  { id: 'rw-mini', label: 'app.profile.stageGamesTitle' },
  { id: 'gr-family', label: 'app.family.hubTitle' }
]

function jump(id: string) {
  const reduced = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  document.getElementById(id)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
}
</script>

<template lang="pug">
  div(class="app-page min-h-screen w-full")
    LkPageHead(:title="t('app.profile.myGames')" :subtitle="t('app.profile.myGamesSub')" @back="goBack")
    div(class="gr-wrap")
      //- one tap to each of the three groups
      nav(class="gr-chips" :aria-label="t('app.profile.myGames')")
        button(v-for="g in GROUPS" :key="g.id" type="button" class="gr-chip" :data-jump="g.id" @click="jump(g.id)") {{ t(g.label) }}

      MyRewards(part="games" section="all")

      //- the family games: the page on the old map, one tap away
      section(class="gr-family")
        h3(id="gr-family" class="gr-title")
          img(:src="prependBaseUrl('images/icons/kacheln/kachel-familie-c.webp')" alt="" class="gr-title-img" draggable="false")
          span {{ t('app.family.hubTitle') }}
        router-link(:to="{ name: 'app-family' }" class="gr-card")
          span(class="gr-card-sub") {{ t('app.profile.familyGamesSub') }}
          span(class="gr-card-go" aria-hidden="true") ›
</template>

<style scoped lang="sass">
.gr-wrap
  max-width: 760px
  margin: 0 auto
  padding: 0 16px 120px

.gr-chips
  display: flex
  flex-wrap: wrap
  gap: 8px
  padding: 4px 0 2px

.gr-chip
  flex: 1 1 auto
  min-height: 44px
  padding: 8px 14px
  border: 1px solid var(--lk-line)
  border-radius: 999px
  background: var(--lk-surface)
  color: var(--lk-text)
  font: inherit
  font-size: 0.92rem
  font-weight: 800
  white-space: nowrap
  cursor: pointer
  -webkit-tap-highlight-color: transparent
  touch-action: manipulation

  &:active
    transform: scale(0.96)

.gr-family
  display: flex
  flex-direction: column
  gap: 10px
  margin-top: 28px
  scroll-margin-top: 12px

.gr-title
  display: flex
  align-items: center
  gap: 12px
  margin: 0
  font-size: 1.05rem
  font-weight: 800
  color: var(--color-text-primary)

.gr-title-img
  flex: none
  width: 40px
  height: 40px
  object-fit: contain

.gr-card
  display: flex
  align-items: center
  justify-content: space-between
  gap: 14px
  min-height: 64px
  padding: 12px 18px
  border: 1px solid var(--lk-line)
  border-radius: 22px
  background: var(--lk-surface)
  box-shadow: var(--lk-shadow)
  color: var(--lk-text)
  text-decoration: none
  -webkit-tap-highlight-color: transparent

  &:active
    transform: translateY(1px)

.gr-card-sub
  font-size: 1rem
  font-weight: 700
  line-height: 1.3

.gr-card-go
  flex: none
  font-size: 2rem
  line-height: 1
  color: var(--lk-muted)
</style>
