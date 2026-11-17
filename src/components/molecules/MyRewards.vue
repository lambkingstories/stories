<script setup lang="ts">
/**
 * What the child has won on the adventures, in two parts:
 *  - `games` (the first two groups of the page "My games"): the wishes for an adventure game (every full 40 stars give one; the child picks which
 *    game it opens, for good; a closed tile opens a little window to pick it), the adventure games, and the stage games
 *    (the best replayable games of every adventure; one opens when its stage has all three stars, the ones not yet won stand there as
 *    locked tiles, so they can be collected). A tile opens the game of that stage in the free mode (`?free=1`: no stars, no progress).
 *    The third group of the page, the family games, is made by the page itself (see `AppGameRoomView`).
 *  - `gifts` ("My coloring pictures", a part of "My rewards"): the gold cup gives the coloring picture of the journey as a
 *    present (Anton, 17.11.2026: only the gold cup); a tile opens the coloring program.
 * `section` (for `part="games"`) tells which group to show: `bonus` = the adventure games, `mini` = the stage games, `all` = both.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { journeys } from '@/data/adventures'
import useAdventure from '@/use/useAdventure'
import { cupOf, rewardGames, type RewardGame } from '@/utils/rewards'
import { STEP } from '@/data/bigGames'
import useBigGames from '@/use/useBigGames'
import useGameWishes from '@/use/useGameWishes'
import useCelebration from '@/use/useCelebration'
import BigGamePickDialog from '@/components/molecules/BigGamePickDialog.vue'
import GameWishBar from '@/components/molecules/GameWishBar.vue'
import type { BigGameState } from '@/utils/bigGames'
import { prependBaseUrl } from '@/utils/function'

/** `section` (for `part="games"`): both groups in one page (`all`), only the stage games (`mini`) or only the adventure games (`bonus`). */
withDefaults(defineProps<{ part?: 'games' | 'gifts'; section?: 'all' | 'mini' | 'bonus' }>(), { part: 'games', section: 'all' })

const { t } = useI18n({ useScope: 'global' })
const router = useRouter()
const adv = useAdventure()

const bigGames = useBigGames()
const wish = useGameWishes()
const { celebrate } = useCelebration()
const stars = wish.stars
const bigStates = wish.states
const w = wish.wishes
// the little window of a closed game, and the game that was just opened (its tile pops once)
const asking = ref<BigGameState | null>(null)
const justOpened = ref('')
function tapBig(s: BigGameState) {
  if (s.open) void router.push({ name: 'app-big-game', params: { gameId: s.game.id } })
  else asking.value = s
}
function doPick(id: string) {
  if (!wish.pick(id)) return
  asking.value = null
  justOpened.value = id
  celebrate('bronze')
  window.setTimeout(() => (justOpened.value = ''), 1600)
}

const games = computed(() => rewardGames(journeys, adv.progressOf))
const openCount = computed(() => games.value.filter((g) => g.open).length)
/** The stage games in the order of the adventures: one group per adventure with its own heading, so the tiles are not one endless grid. */
const gameGroups = computed(() => {
  const out: { id: string; title: string; open: number; games: RewardGame[] }[] = []
  for (const g of games.value) {
    let grp = out[out.length - 1]
    if (!grp || grp.id !== g.journeyId) {
      grp = { id: g.journeyId, title: g.journeyTitle, open: 0, games: [] }
      out.push(grp)
    }
    grp.games.push(g)
    if (g.open) grp.open += 1
  }
  return out
})
/** A group of the stage games is folded (75 tiles would be a very long page): the ones with an open game stand open, the child can fold and unfold every one. */
const unfolded = ref<Record<string, boolean>>({})
const isUnfolded = (grp: { id: string; open: number }) => unfolded.value[grp.id] ?? grp.open > 0
function toggleGroup(grp: { id: string; open: number }) {
  unfolded.value = { ...unfolded.value, [grp.id]: !isUnfolded(grp) }
}
const gifts = computed(() =>
  journeys
    .filter((j) => cupOf(j, adv.progressOf(j.id)) === 'gold')
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
      //- the wishes: every full 40 stars give one game to pick; the bar says how many are free, else how far the next one is
      div(v-if="section !== 'mini'" class="rw-goal" role="group")
        span(class="rw-goal-stars") {{ stars }}
          img(:src="prependBaseUrl('images/abenteuer/ui/stern-gold-3.webp')" alt="" draggable="false")
        span(class="rw-goal-body")
          GameWishBar(v-if="w.free > 0" :free="w.free")
          span(v-else class="rw-goal-text") {{ w.allOpen ? t('app.profile.allBigOpen') : t('app.bigGames.nextGame', { n: w.missing }, w.missing) }}
          span(v-if="!w.allOpen" class="rw-bar" aria-hidden="true")
            span(class="rw-bar-fill" :style="{ width: Math.round(w.share * 100) + '%' }")

      //- the adventure games: closed ones can be tapped, a free wish opens one of them
      h3(v-if="section !== 'mini'" id="rw-bonus" class="rw-title")
        img(:src="prependBaseUrl('images/icons/kacheln/kachel-bonus-c.webp')" alt="" class="rw-title-img" draggable="false")
        span(class="rw-title-text") {{ t('app.bigGames.title') }}
        span(class="rw-count") {{ bigStates.filter((s) => s.open).length }} / {{ bigStates.length }}
      p(v-if="section !== 'mini'" class="rw-hint") {{ t('app.bigGames.hint', { n: STEP }) }}
      div(v-if="section !== 'mini'" class="rw-grid")
        button(
          v-for="s in bigStates"
          :key="s.game.id"
          type="button"
          :class="['rw-tile', 'rw-big', { 'is-locked': !s.open, 'is-pick': !s.open && w.free > 0, 'is-new': justOpened === s.game.id }]"
          :data-game="s.game.id"
          :aria-label="s.open ? undefined : `${t(`app.bigGames.${s.game.id}.title`)}: ${t('app.bigGames.locked')}`"
          @click="tapBig(s)"
        )
          span(class="rw-img")
            img(:src="pic(s.game.image)" alt="" draggable="false" loading="lazy")
            span(v-if="s.open" class="rw-play" aria-hidden="true")
              svg(viewBox="0 0 24 24" width="26" height="26" fill="currentColor")
                path(d="M8 5.2v13.6a1 1 0 0 0 1.5.86l11-6.8a1 1 0 0 0 0-1.72l-11-6.8A1 1 0 0 0 8 5.2z")
            span(v-else-if="w.free > 0" class="rw-lock rw-lock--pick" aria-hidden="true")
              img(:src="prependBaseUrl('images/abenteuer/ui/stern-gold-1.webp')" alt="" draggable="false")
            span(v-else class="rw-lock" aria-hidden="true")
              svg(viewBox="0 0 24 24" width="30" height="30" fill="currentColor")
                path(d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zm-3 8V7a3 3 0 0 1 6 0v3H9z")
          span(class="rw-name") {{ t(`app.bigGames.${s.game.id}.title`) }}
          span(v-if="s.open" class="rw-from") {{ t('app.bigGames.levelStars', { n: bigGames.stars(s.game.id), max: s.game.maxStars }) }}

      //- the stage games: they come with the stars of their stage, the others wait as locked tiles
      h3(v-if="section !== 'bonus'" id="rw-mini" :class="['rw-title', { 'rw-title--next': section === 'all' }]")
        img(:src="prependBaseUrl('images/icons/kacheln/kachel-mini-c.webp')" alt="" class="rw-title-img is-small" draggable="false")
        span(class="rw-title-text") {{ t('app.profile.stageGamesTitle') }}
        span(class="rw-count") {{ openCount }} / {{ games.length }}
      p(v-if="section !== 'bonus'" class="rw-hint") {{ t('app.profile.stageGamesHint') }}
      template(v-if="section !== 'bonus'")
        section(v-for="grp in gameGroups" :key="grp.id" class="rw-group")
          h4(class="rw-group-head")
            button(type="button" class="rw-group-title" :aria-expanded="isUnfolded(grp)" @click="toggleGroup(grp)")
              span(class="rw-group-name") {{ grp.title }}
              span(class="rw-count") {{ grp.open }} / {{ grp.games.length }}
              span(:class="['rw-group-arrow', { 'is-open': isUnfolded(grp) }]" aria-hidden="true") ›
          div(v-if="isUnfolded(grp)" class="rw-grid")
            button(
              v-for="g in grp.games"
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
                span(v-else class="rw-lock") {{ t('app.profile.stageGameLocked', { n: g.stageNo }) }}
              span(class="rw-name") {{ g.open ? g.title : '?' }}

    template(v-else)
      div(v-if="gifts.length" class="rw-grid")
        button(v-for="g in gifts" :key="g.id" type="button" class="rw-tile" @click="paint(g.image)")
          span(class="rw-img rw-img--paper")
            img(:src="g.image" alt="" draggable="false" loading="lazy")
          span(class="rw-name") {{ g.title }}
          span(class="rw-from") {{ g.from }}
      p(v-else class="rw-empty") {{ t('app.profile.myColoringPicturesEmpty') }}
    BigGamePickDialog(v-if="asking" :game="asking.game" :free="w.free" :missing="w.missing" @close="asking = null" @pick="doPick")
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

.rw-group
  display: flex
  flex-direction: column
  gap: 8px
  margin-top: 2px

.rw-group-head
  margin: 0

.rw-group-title
  display: flex
  align-items: center
  gap: 10px
  width: 100%
  min-height: 48px
  padding: 8px 12px 8px 14px
  border: 1px solid var(--lk-line)
  border-radius: 16px
  background: var(--lk-surface)
  color: var(--color-text-primary)
  font: inherit
  font-size: 0.98rem
  font-weight: 800
  text-align: left
  cursor: pointer
  -webkit-tap-highlight-color: transparent
  touch-action: manipulation

.rw-group-arrow
  flex: none
  font-size: 1.6rem
  line-height: 1
  color: var(--lk-muted)
  transition: transform 0.2s

  &.is-open
    transform: rotate(90deg)

.rw-group-name
  flex: 1 1 auto
  min-width: 0

.rw-title-text
  flex: 1 1 auto
  min-width: 0

// the small painted symbol of the group (the same one that was on the tile of the adventure page)
.rw-title-img
  flex: none
  width: 40px
  height: 40px
  object-fit: contain

.rw-title-img.is-small
  width: 32px
  height: 32px
  margin: 4px

.rw-hint
  margin: 0
  color: var(--lk-muted)
  font-size: 0.88rem
  line-height: 1.35

.rw-big.is-locked
  .rw-img > img
    filter: grayscale(1) brightness(0.8)

// a free wish: the closed tiles glow a little, so the child sees that it may pick
.rw-big.is-pick
  border-color: #d4a83e
  box-shadow: 0 0 0 3px rgba(255, 214, 90, 0.4)

  .rw-img > img
    filter: grayscale(0.6) brightness(0.9)

.rw-big.is-new
  animation: rw-pop 1.2s ease-out

@keyframes rw-pop
  0%
    transform: scale(0.94)

  35%
    transform: scale(1.06)
    box-shadow: 0 0 0 6px rgba(255, 214, 90, 0.6)

  100%
    transform: scale(1)

@media (prefers-reduced-motion: reduce)
  .rw-big.is-new
    animation: none

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

.rw-lock--pick
  background: rgba(20, 30, 50, 0.3)

// the little gold star of a free wish (the picture rule of the tile would stretch it over the whole tile)
.rw-img .rw-lock--pick img
  width: 44px
  height: 44px
  object-fit: contain
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.45))

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

.rw-tile.is-locked:not(.rw-big)
  cursor: default
  opacity: 0.92

  .rw-img img
    filter: grayscale(1) brightness(0.75)
</style>
