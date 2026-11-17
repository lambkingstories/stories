<script setup lang="ts">
/**
 * "Meine Spiele": the overview of the games of the child (Anton, 17.11.2026), three big picture cards, each one leads to a page of its own:
 *  - the adventure games (the big reward games; a free wish for one shows on the card),
 *  - the stage games (the small games of the stages; one opens with the three stars of its stage),
 *  - the family games (quiz, activity, memory and the others; nothing of them changed).
 * Nothing lies one below the other any more (the old single page was eight thousand pixels long). The old names "Minispiele", "Bonusspiele" and
 * "Spielzimmer" are gone. This page is reached from "Me" (the tile "My games") and from the games card of the start page.
 * The route name is still `app-gameroom` (so every old link arrives), the address is `/app/spiele`.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import LkPageHead from '@/components/molecules/LkPageHead.vue'
import { journeys } from '@/data/adventures'
import useAdventure from '@/use/useAdventure'
import useGameWishes from '@/use/useGameWishes'
import { rewardGames } from '@/utils/rewards'
import { prependBaseUrl } from '@/utils/function'

const { t } = useI18n({ useScope: 'global' })
const router = useRouter()
const adv = useAdventure()
const wish = useGameWishes()

function goBack() {
  if (window.history.length > 1) router.back()
  else void router.push({ name: 'app-profile' })
}

const bigOpen = computed(() => wish.states.value.filter((s) => s.open).length)
const stage = computed(() => rewardGames(journeys, adv.progressOf))
const stageOpen = computed(() => stage.value.filter((g) => g.open).length)

interface Room {
  key: 'adventure' | 'stage' | 'family'
  to: string
  title: string
  sub: string
  count: string
  symbol: string
  /** A free wish for an adventure game: the card glows and says so. */
  wish?: boolean
}

const rooms = computed<Room[]>(() => [
  {
    key: 'adventure',
    to: 'app-games-adventure',
    title: t('app.bigGames.title'),
    sub: t('app.bigGames.rooms.adventureSub'),
    count: t('app.bigGames.rooms.openOf', { n: bigOpen.value, total: wish.states.value.length }),
    symbol: 'images/icons/kacheln/kachel-bonus-c.webp',
    wish: wish.wishes.value.free > 0
  },
  {
    key: 'stage',
    to: 'app-games-stage',
    title: t('app.profile.stageGamesTitle'),
    sub: t('app.bigGames.rooms.stageSub'),
    count: t('app.bigGames.rooms.openOf', { n: stageOpen.value, total: stage.value.length }),
    symbol: 'images/icons/kacheln/kachel-mini-c.webp'
  },
  {
    key: 'family',
    to: 'app-family',
    title: t('app.family.hubTitle'),
    sub: t('app.bigGames.rooms.familySub'),
    count: '',
    symbol: 'images/icons/kacheln/kachel-familie-c.webp'
  }
])
</script>

<template lang="pug">
  div(class="app-page min-h-screen w-full")
    LkPageHead(:title="t('app.profile.myGames')" :subtitle="t('app.profile.myGamesSub')" @back="goBack")
    div(class="gr-wrap")
      router-link(
        v-for="r in rooms"
        :key="r.key"
        :to="{ name: r.to }"
        :class="['gr-room', 'gr-room--' + r.key, { 'is-wish': r.wish }]"
        :data-room="r.key"
      )
        span(class="gr-art")
          img(:src="prependBaseUrl(r.symbol)" alt="" draggable="false")
        span(class="gr-text")
          span(class="gr-name") {{ r.title }}
          span(class="gr-sub") {{ r.sub }}
          span(v-if="r.wish" class="gr-wish")
            img(:src="prependBaseUrl('images/abenteuer/ui/stern-gold-1.webp')" alt="" draggable="false")
            span {{ t('app.bigGames.wishes', { n: wish.wishes.value.free }, wish.wishes.value.free) }}
          span(v-else-if="r.count" class="gr-count") {{ r.count }}
        span(class="gr-go" aria-hidden="true") ›
</template>

<style scoped lang="sass">
.gr-wrap
  max-width: 760px
  margin: 0 auto
  padding: 6px 16px 120px
  display: flex
  flex-direction: column
  gap: 14px

.gr-room
  --room-bg: #f6e3a8
  --room-ink: #4a3608
  display: flex
  align-items: center
  gap: 14px
  min-height: 132px
  padding: 14px 16px 14px 12px
  border-radius: 26px
  border: 1px solid rgba(0, 0, 0, 0.06)
  background: var(--room-bg)
  box-shadow: var(--lk-shadow)
  color: var(--room-ink)
  text-decoration: none
  -webkit-tap-highlight-color: transparent
  transition: transform 0.15s

  &:active
    transform: scale(0.98)

.gr-room--stage
  --room-bg: #cfe8e2
  --room-ink: #17453f

.gr-room--family
  --room-bg: #d3e2f7
  --room-ink: #17325f

.gr-room.is-wish
  border-color: #d4a83e
  box-shadow: 0 0 0 3px rgba(255, 214, 90, 0.5), var(--lk-shadow)

.gr-art
  flex: none
  display: grid
  place-items: center
  width: 96px
  height: 96px

  img
    width: 100%
    height: 100%
    object-fit: contain
    filter: drop-shadow(0 4px 5px rgba(0, 0, 0, 0.25))

.gr-text
  flex: 1 1 auto
  min-width: 0
  display: flex
  flex-direction: column
  align-items: flex-start
  gap: 3px

.gr-name
  font-size: 1.3rem
  font-weight: 800
  line-height: 1.15

.gr-sub
  font-size: 0.98rem
  font-weight: 600
  line-height: 1.3
  opacity: 0.85

.gr-count
  margin-top: 4px
  padding: 3px 11px
  border-radius: 999px
  background: rgba(255, 255, 255, 0.7)
  font-size: 0.85rem
  font-weight: 800

.gr-wish
  display: inline-flex
  align-items: center
  gap: 6px
  margin-top: 4px
  padding: 3px 11px 3px 6px
  border-radius: 999px
  background: #fff4c4
  border: 1px solid #d4a83e
  color: #3d2c00
  font-size: 0.85rem
  font-weight: 800

  img
    width: 22px
    height: 22px
    object-fit: contain

.gr-go
  flex: none
  font-size: 2.2rem
  line-height: 1
  opacity: 0.55

@media (orientation: landscape) and (max-height: 450px)
  .gr-room
    min-height: 100px

  .gr-art
    width: 72px
    height: 72px
</style>
