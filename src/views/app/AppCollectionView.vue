<script setup lang="ts">
/**
 * "Meine Sammlung": two places for what the child has gathered on the adventures.
 *  - The cabinet: one place per journey with its painted medal; the cup (bronze, silver, gold) stands next to it once it is won.
 *  - The card album: one card for every adventure (gold frame, a painted hero picture, turns round, glints). It is won when every stage
 *    of the adventure has three stars. A card can be opened big; one that is not won yet shows how far the child is.
 * Everything is worked out from the progress of the adventures (nothing extra is stored).
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import CollectionCard from '@/components/molecules/CollectionCard.vue'
import CollectionCardViewer from '@/components/molecules/CollectionCardViewer.vue'
import MyRewards from '@/components/molecules/MyRewards.vue'
import LkPageHead from '@/components/molecules/LkPageHead.vue'
import { journeys } from '@/data/adventures'
import useAdventure from '@/use/useAdventure'
import { cupOf } from '@/utils/rewards'
import { maxPoints, pointsOf } from '@/utils/adventureScore'
import { albumCards, albumSetCard, cupStats } from '@/utils/collection'
import { CARD_ART } from '@/data/cardArt'
import useCardsSeen, { cardKey } from '@/use/useCardsSeen'
import { prependBaseUrl } from '@/utils/function'

const { t } = useI18n({ useScope: 'global' })
const router = useRouter()
const adv = useAdventure()

function goBack() {
  if (window.history.length > 1) router.back()
  else void router.push({ name: 'app-profile' })
}

type Tab = 'cabinet' | 'album' | 'gifts'
// the stack of cards comes first (it is the special thing), the cabinet second
const tab = ref<Tab>('album')

const cups = computed(() => journeys.map((j) => ({ journey: j, ...cupStats(j, adv.progressOf(j.id), cupOf, pointsOf, maxPoints) })))
const wonCups = computed(() => cups.value.filter((c) => c.cup).length)
// the coloring pictures that the cups gave (one for every cup)
const giftCount = computed(() => wonCups.value)
const cupImage = (cup: string) => prependBaseUrl(`images/abenteuer/ui/pokal-${cup === 'silver' ? 'silber' : cup}.webp`)

const { isNew, markSeen } = useCardsSeen()
/** One card for every adventure: it is won with all its stages at three stars. */
const albums = computed(() =>
  journeys
    .map((j) => {
      const cards = albumCards(j, (stageId) => adv.stageOf(j.id, stageId))
      return { journey: j, cards, set: albumSetCard(j, cards), art: CARD_ART[j.id] }
    })
    .filter((a) => a.cards.length > 0)
)
const wonCards = computed(() => albums.value.filter((a) => a.set.have).length)
const pic = (p: string | undefined) => (p ? prependBaseUrl(p) : '')
const newCount = computed(() => albums.value.filter((a) => isNew(cardKey(a.journey.id, 'set'), a.set.have)).length)

/** The card that is open big. */
interface Opened {
  key: string
  title: string
  image: string | undefined
  reference?: string
  journeyTitle?: string
  /** The hero picture is painted for this card (else the medal stands in). */
  art: boolean
  /** The painted picture of the back of the card (the hero at the end of the story). */
  back?: string
  reveal: boolean
}
const opened = ref<Opened | null>(null)

function openSet(a: (typeof albums.value)[number]) {
  if (!a.set.have) {
    // a card that is not won yet: a tap leads to its adventure
    openJourney(a.journey.id)
    return
  }
  const key = cardKey(a.journey.id, 'set')
  opened.value = {
    key,
    title: a.journey.title,
    image: a.art?.front ?? a.journey.medal,
    back: a.art?.back,
    reference: a.journey.subtitle,
    journeyTitle: t('app.collection.setBack', { n: a.set.all }),
    art: !!a.art,
    reveal: isNew(key, true)
  }
}

function closeCard() {
  if (opened.value) markSeen(opened.value.key)
  opened.value = null
}

function openJourney(id: string) {
  void router.push({ name: 'app-adventure-map', params: { journeyId: id } })
}
</script>

<template lang="pug">
  div(class="app-page min-h-screen w-full")
    LkPageHead(:title="t('app.collection.title')" :subtitle="t('app.collection.sub')" @back="goBack")

    section(class="co-wrap")
      div(class="co-tabs" role="tablist")
        button(type="button" role="tab" :aria-selected="tab === 'album'" :class="['co-tab', { 'is-on': tab === 'album' }]" @click="tab = 'album'")
          span {{ t('app.collection.album') }}
          span(class="co-count") {{ wonCards }} / {{ albums.length }}
          span(v-if="newCount" class="co-new-dot" :aria-label="t('app.collection.newCards', newCount)") {{ newCount }}
        button(type="button" role="tab" :aria-selected="tab === 'cabinet'" :class="['co-tab', { 'is-on': tab === 'cabinet' }]" @click="tab = 'cabinet'")
          span {{ t('app.collection.cabinet') }}
          span(class="co-count") {{ wonCups }} / {{ cups.length }}
        button(type="button" role="tab" :aria-selected="tab === 'gifts'" :class="['co-tab', { 'is-on': tab === 'gifts' }]" @click="tab = 'gifts'")
          span {{ t('app.collection.gifts') }}
          span(class="co-count") {{ giftCount }}

      //- ===== the coloring pictures that the cups gave =====
      div(v-if="tab === 'gifts'" class="co-cabinet")
        MyRewards(part="gifts")

      //- ===== the cabinet =====
      div(v-if="tab === 'cabinet'" class="co-cabinet")
        p(class="co-hint") {{ t('app.collection.cabinetHint') }}
        div(class="co-shelf")
          button(v-for="c in cups" :key="c.journey.id" type="button" :class="['co-slot', { 'is-won': !!c.cup }]" @click="openJourney(c.journey.id)")
            span(class="co-medal")
              img(class="co-medal-img" :src="pic(c.journey.medal)" alt="" draggable="false" loading="lazy")
              img(v-if="c.cup" class="co-cup" :src="cupImage(c.cup)" alt="" draggable="false")
            span(class="co-name") {{ c.journey.title }}
            span(v-if="c.cup" class="co-cupname") {{ t(`app.collection.cup_${c.cup}`) }}
            span(v-else class="co-cupname is-open") {{ t('app.collection.points', { n: c.points, max: c.max }) }}

      //- ===== the album =====
      div(v-if="tab === 'album'" class="co-album")
        p(class="co-hint") {{ t('app.collection.albumHint') }}
        div(class="co-cards")
          button(
            v-for="a in albums"
            :key="a.journey.id"
            type="button"
            :class="['co-card', { 'is-have': a.set.have }]"
            :aria-label="a.set.have ? a.journey.title : t('app.collection.specialLocked', { n: a.set.all - a.set.count }, a.set.all - a.set.count)"
            @click="openSet(a)"
          )
            template(v-if="a.set.have")
              CollectionCard(:title="a.journey.title" :image="a.art?.front ?? a.journey.medal" :back-image="a.art?.back" :art="!!a.art" special still)
              span(v-if="isNew(cardKey(a.journey.id, 'set'), true)" class="co-new") {{ t('app.collection.new') }}
            template(v-else)
              span(class="co-slot-card")
                span(class="co-slot-pic")
                  img(:src="pic(a.art?.front ?? a.journey.medal)" alt="" draggable="false" loading="lazy")
                span(class="co-slot-title") {{ a.journey.title }}
                span(class="co-slot-bar" aria-hidden="true")
                  span(class="co-slot-fill" :style="{ width: Math.round((a.set.count / a.set.all) * 100) + '%' }")
                span(class="co-slot-text") {{ t('app.collection.specialLocked', { n: a.set.all - a.set.count }, a.set.all - a.set.count) }}

    CollectionCardViewer(
      v-if="opened"
      :title="opened.title"
      :image="opened.image"
      :reference="opened.reference"
      :journey-title="opened.journeyTitle"
      :art="opened.art"
      :back-image="opened.back"
      special
      :reveal="opened.reveal"
      @close="closeCard"
    )

    div(class="h-32")
</template>

<style scoped lang="sass">
.app-page
  background-color: var(--color-bg-main)
  color: var(--color-text-primary)

.co-wrap
  max-width: 42rem
  margin: 18px auto 0
  padding: 0 16px

.co-tabs
  display: grid
  grid-template-columns: repeat(3, minmax(0, 1fr))
  gap: 8px
  padding: 5px
  border-radius: 999px
  background: var(--lk-surface-2)

.co-tab
  display: flex
  align-items: center
  justify-content: center
  flex-direction: column
  gap: 2px
  min-height: 54px
  padding: 4px 2px
  font-size: 0.88rem
  line-height: 1.15
  text-align: center
  border: none
  border-radius: 999px
  background: transparent
  color: var(--lk-text)
  font: inherit
  font-weight: 800
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  &.is-on
    background: var(--lk-accent)
    color: var(--lk-on-accent)

.co-count
  font-size: 0.82rem
  font-weight: 700
  opacity: 0.8

.co-hint
  margin: 14px 0 10px
  color: var(--lk-muted)
  line-height: 1.4
  text-align: center

// ── the cabinet: a shelf per row, the cups stand on a board ──
.co-shelf
  display: grid
  grid-template-columns: repeat(3, 1fr)
  gap: 22px 10px
  padding: 18px 12px 10px
  border-radius: 24px
  background: var(--lk-surface)
  border: 1px solid var(--lk-line)
  box-shadow: var(--lk-shadow)

.co-slot
  position: relative
  display: flex
  flex-direction: column
  align-items: center
  gap: 4px
  padding: 0 0 12px
  border: none
  background: transparent
  color: var(--lk-text)
  font: inherit
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  // the board under every place
  &::after
    content: ''
    position: absolute
    left: -6px
    right: -6px
    bottom: 0
    height: 7px
    border-radius: 4px
    background: linear-gradient(180deg, #b8895a 0%, #8a6038 100%)
    opacity: 0.55

.co-medal
  position: relative
  display: block
  width: 78px
  height: 78px

.co-medal-img
  width: 100%
  height: 100%
  object-fit: contain
  filter: grayscale(1) opacity(0.35)

.is-won .co-medal-img
  filter: drop-shadow(0 6px 8px rgba(40, 30, 10, 0.3))

.co-cup
  position: absolute
  right: -12px
  bottom: -4px
  width: 38px
  height: 38px
  object-fit: contain
  filter: drop-shadow(0 3px 4px rgba(40, 30, 10, 0.35))

.co-name
  font-weight: 800
  font-size: 0.82rem
  line-height: 1.2
  text-align: center

.co-cupname
  font-size: 0.74rem
  color: var(--lk-muted)
  font-weight: 700

  &.is-open
    opacity: 0.75

// ── the album ──
.co-set
  margin-top: 18px

.co-set-title
  display: flex
  align-items: center
  justify-content: space-between
  margin: 0 0 8px
  font-size: 1.05rem
  font-weight: 800

.co-cards
  display: grid
  grid-template-columns: repeat(2, 1fr)
  gap: 16px 14px

.co-card
  position: relative
  display: block
  width: 100%
  padding: 0
  border: none
  background: transparent
  color: var(--lk-text)
  font: inherit
  cursor: pointer
  -webkit-tap-highlight-color: transparent
  transition: transform 0.15s ease-out

  &.is-have:active
    transform: scale(0.97)

// a card that is not won yet: a dark place with its picture grayed out and what is missing
.co-slot-card
  position: relative
  display: flex
  flex-direction: column
  align-items: center
  justify-content: flex-end
  gap: 8px
  aspect-ratio: 2 / 3
  padding: 14px 10px 18px
  border-radius: 20px
  overflow: hidden
  background: var(--lk-surface-2)
  border: 2px dashed var(--lk-line)
  text-align: center

.co-slot-pic
  position: absolute
  inset: 0
  opacity: 0.22

  img
    width: 100%
    height: 100%
    object-fit: cover
    filter: grayscale(1)

.co-slot-num
  position: absolute
  top: 12px
  left: 12px
  display: grid
  place-items: center
  width: 34px
  height: 34px
  border-radius: 50%
  background: var(--lk-surface)
  border: 1px solid var(--lk-line)
  color: var(--lk-muted)
  font-weight: 800

.co-slot-title
  position: relative
  font-weight: 800
  font-size: 1rem
  line-height: 1.2

.co-slot-bar
  position: relative
  display: block
  width: 80%
  height: 8px
  border-radius: 6px
  background: rgba(0, 0, 0, 0.12)
  overflow: hidden

.co-slot-fill
  display: block
  height: 100%
  border-radius: 6px
  background: var(--lk-gold)

.co-slot-text
  position: relative
  font-weight: 800
  font-size: 0.9rem
  line-height: 1.25
  color: var(--lk-text)

.is-open .co-slot-card
  border-color: var(--lk-gold)

.co-new
  position: absolute
  top: 8px
  right: 8px
  padding: 3px 9px
  border-radius: 999px
  background: #e0402c
  color: #fff
  font-size: 0.72rem
  font-weight: 800
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3)

.co-new-dot
  display: grid
  place-items: center
  min-width: 22px
  height: 22px
  padding: 0 6px
  border-radius: 999px
  background: #e0402c
  color: #fff
  font-size: 0.74rem
  font-weight: 800
</style>
