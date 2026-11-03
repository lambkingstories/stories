<script setup lang="ts">
/**
 * What the child has won on the adventures, in two parts:
 *  - `games` ("My game room"): the next goal in stars, the big games (they open with the stars of all adventures together) and the mini games
 *    (the best replayable games of every adventure; one opens when its stage has all three stars, the ones not yet won stand there as
 *    locked tiles, so they can be collected). A tile opens the game of that stage in the free mode (`?free=1`: no stars, no progress).
 *  - `gifts` ("My coloring pictures"): every cup (bronze, silver, gold) gives the coloring picture of the journey as a present; a tile
 *    opens the coloring program.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { journeys } from '@/data/adventures'
import useAdventure from '@/use/useAdventure'
import { cupOf, rewardGames, type RewardGame } from '@/utils/rewards'
import { BIG_GAMES } from '@/data/bigGames'
import useBigGames from '@/use/useBigGames'
import { bigGameStates, nextBigGame, totalStars, type BigGameState } from '@/utils/bigGames'
import { prependBaseUrl } from '@/utils/function'

/** `section` (for `part="games"`): both lists in one page (`all`), only the mini games or only the bonus games. */
withDefaults(defineProps<{ part?: 'games' | 'gifts'; section?: 'all' | 'mini' | 'bonus' }>(), { part: 'games', section: 'all' })

const { t } = useI18n({ useScope: 'global' })
const router = useRouter()
const adv = useAdventure()

const bigGames = useBigGames()
const stars = computed(() => totalStars(journeys, adv.progressOf))
const bigStates = computed(() => bigGameStates(BIG_GAMES, stars.value))
const nextBig = computed(() => nextBigGame(BIG_GAMES, stars.value))
function playBig(s: BigGameState) {
  if (s.open) void router.push({ name: 'app-big-game', params: { gameId: s.game.id } })
}

const games = computed(() => rewardGames(journeys, adv.progressOf))
const openCount = computed(() => games.value.filter((g) => g.open).length)
const gifts = computed(() =>
  journeys
    .filter((j) => !!cupOf(j, adv.progressOf(j.id)))
    .map((j) => ({ id: `gift-${j.id}`, title: j.gift.title, image: prependBaseUrl(j.gift.image), from: j.title }))
)

function play(g: RewardGame) {
  if (!g.open) return
  void router.push({ name: 'app-adventure-stage', params: { journeyId: g.journeyId, stageId: String(g.stageId) }, query: { free: '1' } })
}
function paint(image: string) {
  void router.push({ name: 'app-coloring', query: { source: image, type: 'image' } })
}
const pic = (p: string | undefined) => (p ? prependBaseUrl(p) : '')
</script>

<template lang="pug">
  section(class="rw")
    template(v-if="part === 'games'")
      //- the way to the next big game: the stars of all adventures together
      div(v-if="section !== 'mini'" class="rw-goal" role="group")
        span(class="rw-goal-stars") {{ stars }}
          img(:src="prependBaseUrl('images/abenteuer/ui/stern-gold-3.webp')" alt="" draggable="false")
        span(class="rw-goal-body")
          span(class="rw-goal-text") {{ nextBig ? t('app.bigGames.nextGame', { game: t(`app.bigGames.${nextBig.game.id}.title`), n: nextBig.missing }) : t('app.profile.allBigOpen') }}
          span(v-if="nextBig" class="rw-bar" aria-hidden="true")
            span(class="rw-bar-fill" :style="{ width: Math.round(nextBig.share * 100) + '%' }")

      //- the big games: each one opens with the stars of all adventures together
      h3(v-if="section !== 'mini'" id="rw-bonus" class="rw-title")
        span {{ t('app.bigGames.title') }}
        span(class="rw-count") {{ bigStates.filter((s) => s.open).length }} / {{ bigStates.length }}
      p(v-if="section !== 'mini'" class="rw-hint") {{ t('app.bigGames.hint') }}
      div(v-if="section !== 'mini'" class="rw-grid")
        button(
          v-for="s in bigStates"
          :key="s.game.id"
          type="button"
          :class="['rw-tile', 'rw-big', { 'is-locked': !s.open }]"
          :disabled="!s.open"
          @click="playBig(s)"
        )
          span(class="rw-img")
            img(:src="pic(s.game.image)" alt="" draggable="false" loading="lazy")
            span(v-if="s.open" class="rw-play" aria-hidden="true")
              svg(viewBox="0 0 24 24" width="26" height="26" fill="currentColor")
                path(d="M8 5.2v13.6a1 1 0 0 0 1.5.86l11-6.8a1 1 0 0 0 0-1.72l-11-6.8A1 1 0 0 0 8 5.2z")
            span(v-else class="rw-lock") {{ t('app.bigGames.locked', { n: s.missing }, s.missing) }}
          span(class="rw-name") {{ t(`app.bigGames.${s.game.id}.title`) }}
          span(v-if="s.open" class="rw-from") {{ t('app.bigGames.levelStars', { n: bigGames.stars(s.game.id), max: 15 }) }}
          span(v-else class="rw-bar" aria-hidden="true")
            span(class="rw-bar-fill" :style="{ width: Math.round(s.share * 100) + '%' }")

      //- the mini games: they come with the stars of their stage, the others wait as locked tiles
      h3(v-if="section !== 'bonus'" id="rw-mini" :class="['rw-title', { 'rw-title--next': section === 'all' }]")
        span {{ t('app.profile.miniTitle') }}
        span(class="rw-count") {{ openCount }} / {{ games.length }}
      p(v-if="section !== 'bonus'" class="rw-hint") {{ t('app.profile.miniHint') }}
      div(v-if="section !== 'bonus'" class="rw-grid")
        button(
          v-for="g in games"
          :key="`${g.journeyId}-${g.stageId}`"
          type="button"
          :class="['rw-tile', { 'is-locked': !g.open }]"
          :disabled="!g.open"
          @click="play(g)"
        )
          span(class="rw-img")
            img(v-if="g.image" :src="pic(g.image)" alt="" draggable="false" loading="lazy")
            span(v-if="g.open" class="rw-play" aria-hidden="true")
              svg(viewBox="0 0 24 24" width="26" height="26" fill="currentColor")
                path(d="M8 5.2v13.6a1 1 0 0 0 1.5.86l11-6.8a1 1 0 0 0 0-1.72l-11-6.8A1 1 0 0 0 8 5.2z")
            span(v-else class="rw-lock") {{ t('app.profile.miniLocked', { n: g.stageNo }) }}
          span(class="rw-name") {{ g.open ? g.title : '?' }}
          span(class="rw-from") {{ g.journeyTitle }}

    template(v-else)
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

.rw-hint
  margin: 0
  color: var(--lk-muted)
  font-size: 0.88rem
  line-height: 1.35

.rw-big.is-locked
  cursor: default

  .rw-img img
    filter: grayscale(1) brightness(0.8)

.rw-lock
  position: absolute
  inset: 0
  display: grid
  place-items: center
  padding: 8px
  background: rgba(20, 30, 50, 0.55)
  color: #fff
  font-weight: 800
  font-size: 0.95rem
  text-align: center

.rw-bar
  display: block
  height: 8px
  border-radius: 6px
  background: var(--lk-surface-2)
  overflow: hidden

.rw-bar-fill
  display: block
  height: 100%
  border-radius: 6px
  background: var(--lk-gold)

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
  text-align: center
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
.rw-goal
  display: flex
  align-items: center
  gap: 14px
  padding: 14px
  border: 1px solid var(--lk-line)
  border-radius: 22px
  background: var(--lk-surface)
  box-shadow: var(--lk-shadow)

.rw-goal-stars
  display: flex
  flex-direction: column
  align-items: center
  min-width: 52px
  font-size: 1.5rem
  font-weight: 800
  line-height: 1

  img
    width: 34px
    height: 34px
    margin-top: 2px
    object-fit: contain

.rw-goal-body
  flex: 1 1 auto
  display: flex
  flex-direction: column
  gap: 8px
  min-width: 0

.rw-goal-text
  font-weight: 800
  line-height: 1.25

.rw-tile.is-locked
  cursor: default
  opacity: 0.92

  .rw-img img
    filter: grayscale(1) brightness(0.75)
</style>
