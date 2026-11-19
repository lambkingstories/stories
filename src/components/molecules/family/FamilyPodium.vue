<script setup lang="ts">
/**
 * Familien-Spiele v2: the end of a game (replaces `FamilyResult` for the new course Start -> Lobby -> Game -> End). The headline, then the podium: the
 * first three on blocks of three heights (winner in the middle and the tallest, in gold), each with the big painted figure, the name and the score;
 * more players stand as rows below; a tie shares the place. With less than two rows (one person, or a game without a ranking) the winner stands alone on a
 * golden disc. The slot `extra` sits between podium and buttons (e.g. a code, teams); the buttons "Again", "New round with other players" and "Back to
 * the games" are shown by the piece itself (events `again`, `change`, `exit`), or replaced by the slot `actions`. The NAME of the game never stands in
 * here.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import FamilyButton from './FamilyButton.vue'
import MapToken from '@/components/molecules/map/MapToken.vue'
import type { FamilyGameKey } from './familyGames'

export interface FamilyPodiumRow {
  rank: number
  name: string
  /** The score as text ("7 pairs"). */
  score: string
  /** The seat of the figure (0 for the first player). */
  index: number
  /** A small line under the name (e.g. the people of a team). */
  sub?: string
}

const props = withDefaults(defineProps<{ game?: FamilyGameKey; headline: string; rows?: FamilyPodiumRow[]; winnerIndex?: number }>(), { game: undefined, rows: () => [], winnerIndex: undefined })
const emit = defineEmits<{ again: []; change: []; exit: [] }>()
const { t } = useI18n({ useScope: 'global' })

const hasPodium = computed(() => props.rows.length >= 2)
/** The first three in the order of the stage: second, first, third (with two: second, first). */
const stage = computed(() => {
  const top = props.rows.slice(0, 3)
  if (top.length === 3) return [top[1]!, top[0]!, top[2]!]
  if (top.length === 2) return [top[1]!, top[0]!]
  return top
})
const rest = computed(() => props.rows.slice(3))
const level = (rank: number) => Math.min(3, Math.max(1, rank))
</script>

<template lang="pug">
  section(:class="['fam-pod', game ? 'fam-game--' + game : '']")
    div(v-if="!hasPodium && winnerIndex !== undefined" class="fam-pod-solo")
      MapToken(:index="winnerIndex" :size="96" lit)
    h1(class="fam-pod-head") {{ headline }}

    ol(v-if="hasPodium" class="fam-pod-stage")
      li(v-for="r in stage" :key="r.name + r.rank + r.index" :class="['fam-pod-col', 'is-place-' + level(r.rank)]")
        span(class="fam-pod-figure")
          MapToken(:index="r.index" :size="level(r.rank) === 1 ? 84 : 64" :lit="level(r.rank) === 1")
        span(class="fam-pod-name") {{ r.name }}
        span(v-if="r.sub" class="fam-pod-sub") {{ r.sub }}
        span(class="fam-pod-score") {{ r.score }}
        span(class="fam-pod-block")
          span(class="fam-pod-place" :aria-label="t('app.bigGames.familyFlow.place', { n: r.rank })") {{ r.rank }}

    ol(v-if="rest.length" class="fam-pod-rest")
      li(v-for="r in rest" :key="r.name + r.rank + r.index")
        span(class="fam-pod-n") {{ r.rank }}
        MapToken(:index="r.index" :size="34")
        span(class="fam-pod-rname") {{ r.name }}
        span(class="fam-pod-rscore") {{ r.score }}

    div(v-if="$slots.extra" class="fam-pod-extra")
      slot(name="extra")

    div(class="fam-pod-actions")
      slot(name="actions")
        FamilyButton(class="fam-pod-again" @click="emit('again')") {{ t('app.bigGames.familyFlow.again') }}
        FamilyButton(class="fam-pod-change" quiet @click="emit('change')") {{ t('app.bigGames.familyFlow.newPlayers') }}
        FamilyButton(class="fam-pod-exit" quiet @click="emit('exit')") {{ t('app.bigGames.familyFlow.toGames') }}
</template>

<style scoped lang="sass">
.fam-pod
  display: flex
  flex-direction: column
  align-items: center
  gap: 16px
  width: 100%
  max-width: 34rem
  margin: 0 auto
  padding: 10px 0 8px

.fam-pod-solo
  display: grid
  place-items: center
  width: 148px
  height: 148px
  border: 3px solid var(--fam-gold)
  border-radius: 50%
  background: radial-gradient(circle at 50% 38%, color-mix(in srgb, var(--fam-gold) 38%, var(--fam-card)), var(--fam-card) 72%)
  box-shadow: 0 0 0 8px color-mix(in srgb, var(--fam-gold) 22%, transparent), var(--fam-shadow)

.fam-pod-head
  margin: 0
  color: var(--fam-ink)
  font-size: 1.75rem
  font-weight: 800
  line-height: 1.15
  text-align: center
  overflow-wrap: anywhere

// the stage: the columns stand on one line, the blocks grow from the floor
.fam-pod-stage
  display: flex
  align-items: flex-end
  justify-content: center
  gap: 8px
  width: 100%
  margin: 6px 0 0
  padding: 0
  list-style: none

.fam-pod-col
  display: flex
  flex-direction: column
  align-items: center
  flex: 1 1 0
  max-width: 11rem
  min-width: 0
  text-align: center

.fam-pod-figure
  position: relative
  display: grid
  place-items: center
  margin-bottom: 4px

.is-place-1 .fam-pod-figure::before
  content: ''
  position: absolute
  inset: -18%
  border-radius: 50%
  background: radial-gradient(circle, color-mix(in srgb, var(--fam-gold) 55%, transparent), transparent 68%)

.fam-pod-name
  max-width: 100%
  overflow: hidden
  color: var(--fam-ink)
  font-size: 1.1rem
  font-weight: 800
  line-height: 1.2
  text-overflow: ellipsis
  white-space: nowrap

.fam-pod-sub
  max-width: 100%
  overflow: hidden
  color: var(--fam-muted)
  font-size: 0.85rem
  font-weight: 600
  text-overflow: ellipsis
  white-space: nowrap

.fam-pod-score
  margin-bottom: 8px
  color: var(--fam-muted)
  font-size: 1rem
  font-weight: 700

.fam-pod-block
  display: grid
  place-items: start center
  box-sizing: border-box
  width: 100%
  padding-top: 10px
  border-radius: 18px 18px 6px 6px
  background: linear-gradient(180deg, color-mix(in srgb, var(--fam-accent) 90%, white), color-mix(in srgb, var(--fam-accent) 80%, black))
  color: var(--fam-on-accent)
  box-shadow: var(--fam-shadow)

.is-place-1 .fam-pod-block
  height: 132px
  background: linear-gradient(180deg, var(--fam-gold), var(--fam-gold-deep))
  color: var(--fam-on-gold)

.is-place-2 .fam-pod-block
  height: 96px

.is-place-3 .fam-pod-block
  height: 70px
  background: linear-gradient(180deg, color-mix(in srgb, var(--fam-accent) 75%, black), color-mix(in srgb, var(--fam-accent) 60%, black))

.fam-pod-place
  font-size: 2rem
  font-weight: 800
  line-height: 1

// more than three: rows
.fam-pod-rest
  display: grid
  gap: 8px
  width: 100%
  margin: 0
  padding: 0
  list-style: none

  li
    display: grid
    grid-template-columns: 30px 38px minmax(0, 1fr) auto
    align-items: center
    gap: 10px
    min-height: 48px
    padding: 4px 14px 4px 10px
    border: 1.5px solid var(--fam-line)
    border-radius: 16px
    background: var(--fam-card)
    box-shadow: var(--fam-shadow)
    font-size: 1.05rem
    font-weight: 700

.fam-pod-n
  display: grid
  place-items: center
  width: 28px
  height: 28px
  border-radius: 50%
  background: var(--fam-accent)
  color: var(--fam-on-accent)
  font-size: 0.9rem
  font-weight: 800

.fam-pod-rname
  overflow: hidden
  text-align: left
  text-overflow: ellipsis
  white-space: nowrap

.fam-pod-rscore
  font-weight: 800
  white-space: nowrap

.fam-pod-extra
  display: flex
  flex-direction: column
  align-items: center
  gap: 12px
  width: 100%

.fam-pod-actions
  display: flex
  flex-direction: column
  align-items: center
  gap: 12px
  width: 100%
  padding: 6px 0 16px

  :deep(.fam-btn)
    width: min(100%, 24rem)

// the podium builds up: third, second, first
@media (prefers-reduced-motion: no-preference)
  .fam-pod-block
    transform-origin: bottom
    animation: fam-pod-grow 0.6s cubic-bezier(0.25, 0.9, 0.3, 1) both

  .is-place-2 .fam-pod-block
    animation-delay: 0.15s

  .is-place-1 .fam-pod-block
    animation-delay: 0.3s

  .fam-pod-figure, .fam-pod-name, .fam-pod-score, .fam-pod-sub
    animation: fam-pod-fade 0.5s 0.5s ease both

  .is-place-1 .fam-pod-figure
    animation: fam-pod-jump 0.7s 0.65s cubic-bezier(0.3, 1.5, 0.5, 1) both

@keyframes fam-pod-grow
  from
    transform: scaleY(0)

@keyframes fam-pod-fade
  from
    opacity: 0

@keyframes fam-pod-jump
  from
    opacity: 0
    transform: translateY(24px) scale(0.7)

// a phone held wide: the podium on the left, the buttons on the right, the blocks a little lower
@media (orientation: landscape) and (max-height: 520px)
  .fam-pod
    display: grid
    grid-template-columns: minmax(0, 1fr) minmax(0, 18rem)
    grid-template-areas: 'head head' 'stage actions' 'rest actions' 'extra actions'
    align-content: start
    align-items: start
    gap: 8px 28px
    max-width: 62rem

  .fam-pod-solo
    grid-area: stage
    justify-self: center
    width: 124px
    height: 124px

  .fam-pod-head
    grid-area: head
    font-size: 1.4rem

  .fam-pod-stage
    grid-area: stage

  .fam-pod-rest
    grid-area: rest

  .fam-pod-extra
    grid-area: extra

  .fam-pod-actions
    grid-area: actions
    align-self: center

  .is-place-1 .fam-pod-block
    height: 84px

  .is-place-2 .fam-pod-block
    height: 60px

  .is-place-3 .fam-pod-block
    height: 44px

  .fam-pod-place
    font-size: 1.5rem
</style>
