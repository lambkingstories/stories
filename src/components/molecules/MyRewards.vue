<script setup lang="ts">
/**
 * "My game room" and "My coloring pictures" on the profile page (Anton, 28.10.2026): what the child has won on the journeys.
 *  - The gold cup of a journey gives its best replayable games (`REWARD_GAMES`); a tile opens the game of that stage in the free mode
 *    (`?free=1`: no stars, no progress). Games not yet won are counted, not shown.
 *  - Every cup (bronze, silver, gold) gives the coloring picture of the journey as a present; a tile opens the coloring program.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { journeys } from '@/data/adventures'
import useAdventure from '@/use/useAdventure'
import { cupOf, rewardGameTotal, unlockedGames, type RewardGame } from '@/utils/rewards'
import { prependBaseUrl } from '@/utils/function'

const { t } = useI18n({ useScope: 'global' })
const router = useRouter()
const adv = useAdventure()

const games = computed(() => unlockedGames(journeys, adv.progressOf))
const total = computed(() => rewardGameTotal(journeys))
const gifts = computed(() =>
  journeys
    .filter((j) => !!cupOf(j, adv.progressOf(j.id)))
    .map((j) => ({ id: `gift-${j.id}`, title: j.gift.title, image: prependBaseUrl(j.gift.image), from: j.title }))
)

function play(g: RewardGame) {
  void router.push({ name: 'app-adventure-stage', params: { journeyId: g.journeyId, stageId: String(g.stageId) }, query: { free: '1' } })
}
function paint(image: string) {
  void router.push({ name: 'app-coloring', query: { source: image, type: 'image' } })
}
const pic = (p: string | undefined) => (p ? prependBaseUrl(p) : '')
</script>

<template lang="pug">
  section(class="rw")
    h3(class="rw-title")
      span {{ t('app.profile.gameRoom') }}
      span(class="rw-count") {{ games.length }} / {{ total }}
    div(v-if="games.length" class="rw-grid")
      button(v-for="g in games" :key="`${g.journeyId}-${g.stageId}`" type="button" class="rw-tile" @click="play(g)")
        span(class="rw-img")
          img(v-if="g.image" :src="pic(g.image)" alt="" draggable="false" loading="lazy")
          span(class="rw-play" aria-hidden="true")
            svg(viewBox="0 0 24 24" width="26" height="26" fill="currentColor")
              path(d="M8 5.2v13.6a1 1 0 0 0 1.5.86l11-6.8a1 1 0 0 0 0-1.72l-11-6.8A1 1 0 0 0 8 5.2z")
        span(class="rw-name") {{ g.title }}
        span(class="rw-from") {{ g.journeyTitle }}
    p(v-else class="rw-empty") {{ t('app.profile.gameRoomEmpty') }}

    h3(class="rw-title rw-title--next")
      span {{ t('app.profile.myColoringPictures') }}
      span(class="rw-count") {{ gifts.length }}
    div(v-if="gifts.length" class="rw-grid")
      button(v-for="g in gifts" :key="g.id" type="button" class="rw-tile" @click="paint(g.image)")
        span(class="rw-img rw-img--paper")
          img(:src="g.image" alt="" draggable="false" loading="lazy")
        span(class="rw-name") {{ g.title }}
        span(class="rw-from") {{ g.from }}
    p(v-else class="rw-empty") {{ t('app.profile.myColoringPicturesEmpty') }}
</template>

<style scoped lang="sass">
.rw
  display: flex
  flex-direction: column
  gap: 10px
  margin-top: 18px

.rw-title
  display: flex
  align-items: center
  justify-content: space-between
  gap: 12px
  margin: 0
  font-size: 1.05rem
  font-weight: 800
  color: var(--color-text-primary)

.rw-title--next
  margin-top: 10px

.rw-count
  padding: 3px 10px
  border-radius: 999px
  border: 1px solid var(--lk-line)
  background: var(--lk-surface)
  font-size: 0.8rem
  font-weight: 700
  color: var(--lk-muted)

.rw-grid
  display: grid
  grid-template-columns: repeat(2, minmax(0, 1fr))
  gap: 12px

.rw-tile
  display: flex
  flex-direction: column
  align-items: stretch
  gap: 4px
  padding: 8px
  border: 1px solid var(--lk-line)
  border-radius: 18px
  background: var(--lk-surface)
  box-shadow: var(--lk-shadow)
  text-align: left
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  &:active
    transform: scale(0.98)

.rw-img
  position: relative
  display: block
  aspect-ratio: 3 / 2
  border-radius: 12px
  overflow: hidden
  background: var(--lk-surface-2)

  img
    width: 100%
    height: 100%
    object-fit: cover
    display: block

.rw-img--paper
  background: #fff

  img
    object-fit: contain

.rw-play
  position: absolute
  right: 8px
  bottom: 8px
  width: 40px
  height: 40px
  display: flex
  align-items: center
  justify-content: center
  padding-left: 3px
  border-radius: 50%
  background: var(--lk-accent)
  color: var(--lk-on-accent)
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3)

.rw-name
  font-weight: 800
  font-size: 0.95rem
  line-height: 1.25
  color: var(--color-text-primary)

.rw-from
  font-size: 0.8rem
  color: var(--lk-muted)

.rw-empty
  margin: 0
  padding: 18px 14px
  text-align: center
  border: 1px dashed var(--lk-line)
  border-radius: var(--lk-r-group)
  color: var(--lk-muted)
  font-size: 0.9rem
</style>
