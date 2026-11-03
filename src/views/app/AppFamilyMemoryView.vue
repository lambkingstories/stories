<script setup lang="ts">
/**
 * The memory game (Plus), small, medium or large: the cards lie face down, two are turned over at a time. A pair is the same big painted
 * scene of a Bible story twice (the name of the scene is on a ribbon). One to four people take turns (who finds a pair goes on); alone
 * it counts the moves. The back of the cards is the same as that of the collector cards. Everything runs on the device.
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import LkPageHead from '@/components/molecules/LkPageHead.vue'
import AdvButton from '@/components/atoms/AdvButton.vue'
import { PREMIUM_TEASER, hasFeature, showUpsell } from '@/use/usePremium'
import useUserName from '@/use/useUserName'
import { MEMORY_SCENES } from '@/data/memoryScenes'
import type { ActivityLocale } from '@/data/activityWords'
import { ranking } from '@/utils/familyQuiz'
import { MEMORY_MAX_PLAYERS, MEMORY_SIZES, MEMORY_SIZE_LIST, bestColumns, buildMemory, isMatch, nextPlayer, type MemoryCard, type MemorySize } from '@/utils/memoryGame'
import useLandscapePlay from '@/use/useLandscapePlay'
import { prependBaseUrl } from '@/utils/function'

const { t, locale } = useI18n({ useScope: 'global' })
const router = useRouter()
const { displayName, hasCustomName } = useUserName()

function goBack() {
  if (window.history.length > 1) router.back()
  else void router.push({ name: 'app-family' })
}

const locked = computed(() => PREMIUM_TEASER && !hasFeature('family'))
const lang = computed<ActivityLocale>(() => (locale.value.startsWith('en') ? 'en' : locale.value.startsWith('es') ? 'es' : 'de'))
const nameOf = (scene: number) => MEMORY_SCENES[scene]?.[lang.value] ?? ''
const picture = (scene: number) => prependBaseUrl(`images/spiele-memory/${String(scene).padStart(2, '0')}.webp`)
const back = prependBaseUrl('images/abenteuer/ui/karte-rueckseite.webp')

const NAMES_KEY = 'lk-family-names'

// ── setup ───────────────────────────────────────────────────────────────────────────────────────────────────────
const size = ref<MemorySize>('medium')
const playerCount = ref(2)
const names = reactive<string[]>([])
const playerChoices = Array.from({ length: MEMORY_MAX_PLAYERS }, (_, i) => i + 1)

onMounted(() => {
  let saved: string[] = []
  try {
    const raw = JSON.parse(localStorage.getItem(NAMES_KEY) ?? 'null')
    if (Array.isArray(raw)) saved = raw.filter((x) => typeof x === 'string').slice(0, 8)
  } catch {
    // start with the standard names
  }
  for (let i = 0; i < MEMORY_MAX_PLAYERS; i++) names[i] = saved[i] || (i === 0 && hasCustomName.value ? displayName.value : '')
  const filled = saved.filter(Boolean).length
  if (filled >= 1) playerCount.value = Math.min(MEMORY_MAX_PLAYERS, filled)
})

const nameOfPlayer = (i: number) => names[i]?.trim() || t('app.family.player', { n: i + 1 })
const players = computed(() => Array.from({ length: playerCount.value }, (_, i) => nameOfPlayer(i)))

// ── the game ────────────────────────────────────────────────────────────────────────────────────────────────────
type Phase = 'setup' | 'play' | 'done'
const phase = ref<Phase>('setup')
const cards = ref<MemoryCard[]>([])
const open = ref<number[]>([])
const found = ref<number[]>([])
const turn = ref(0)
const scores = ref<number[]>([])
const moves = ref(0)
const busy = ref(false)
let hideTimer: ReturnType<typeof setTimeout> | undefined

const cols = computed(() => MEMORY_SIZES[size.value].cols)
// turned phone: no header, every card as big as the screen allows, all of them in sight
const { landscape, full, canTurn, width, height, toggle } = useLandscapePlay()
const fit = computed(() => landscape.value && phase.value === 'play')
const fitBoard = computed(() => bestColumns(cards.value.length, width.value - 16, height.value - 78))
const boardStyle = computed(() => (fit.value ? { '--fm-cols': fitBoard.value.cols, '--fm-w': `${fitBoard.value.cardWidth}px` } : { '--fm-cols': cols.value }))
const pairsTotal = computed(() => MEMORY_SIZES[size.value].pairs)
const pairsFound = computed(() => found.value.length / 2)
const placing = computed(() => ranking(players.value, scores.value))
const winners = computed(() => placing.value.filter((p) => p.rank === 1))
const isFace = (c: MemoryCard) => open.value.includes(c.id) || found.value.includes(c.id)

function start() {
  try {
    localStorage.setItem(NAMES_KEY, JSON.stringify(names.map((n) => n.trim())))
  } catch {
    // the names are not remembered in a private window
  }
  clearTimeout(hideTimer)
  cards.value = buildMemory(pairsTotal.value)
  open.value = []
  found.value = []
  turn.value = 0
  moves.value = 0
  busy.value = false
  scores.value = Array.from({ length: playerCount.value }, () => 0)
  phase.value = 'play'
}

function flip(c: MemoryCard) {
  if (phase.value !== 'play' || busy.value || isFace(c)) return
  open.value = [...open.value, c.id]
  if (open.value.length < 2) return
  moves.value++
  const [a, b] = open.value.map((id) => cards.value[id]!) as [MemoryCard, MemoryCard]
  if (isMatch(a, b)) {
    found.value = [...found.value, a.id, b.id]
    scores.value[turn.value] = (scores.value[turn.value] ?? 0) + 1
    open.value = []
    if (found.value.length === cards.value.length) hideTimer = setTimeout(() => (phase.value = 'done'), 900)
    return
  }
  busy.value = true
  hideTimer = setTimeout(() => {
    open.value = []
    turn.value = nextPlayer(turn.value, playerCount.value, false)
    busy.value = false
  }, 1100)
}
onBeforeUnmount(() => clearTimeout(hideTimer))

/** A picture that is not there (yet) is left out; the ribbon with the name stays. */
function hideBroken(e: Event) {
  const el = e.target
  if (el instanceof HTMLElement) el.style.display = 'none'
}
</script>

<template lang="pug">
  div(class="app-page min-h-screen w-full")
    LkPageHead(v-if="!fit" :title="t('app.memory.title')" :subtitle="phase === 'setup' ? t('app.memory.sub') : ''" :lamb="phase === 'setup'" @back="goBack")

    section(:class="['fm-wrap', { 'is-fit': fit }]")
      div(v-if="locked" class="fm-card")
        p(class="fm-explain") {{ t('app.memory.locked') }}
        AdvButton(tone="gold" @click="showUpsell('family')") {{ t('app.family.lockedButton') }}

      //- ===== setup =====
      div(v-else-if="phase === 'setup'" class="fm-card")
        p(class="fm-explain") {{ t('app.memory.explain') }}
        h3(class="fm-h") {{ t('app.memory.size') }}
        div(class="fm-sizes" role="radiogroup")
          button(v-for="s in MEMORY_SIZE_LIST" :key="s" type="button" role="radio" :aria-checked="size === s" :class="['fm-size', { 'is-on': size === s }]" @click="size = s")
            span(class="fm-size-name") {{ t(`app.memory.size_${s}`) }}
            span(class="fm-size-pairs") {{ t('app.memory.pairs', { n: MEMORY_SIZES[s].pairs }) }}
        h3(class="fm-h") {{ t('app.family.howMany') }}
        div(class="fm-chips" role="radiogroup")
          button(v-for="n in playerChoices" :key="n" type="button" role="radio" :aria-checked="playerCount === n" :class="['fm-chip', { 'is-on': playerCount === n }]" @click="playerCount = n") {{ n }}
        div(class="fm-names")
          input(
            v-for="(_, i) in players"
            :key="i"
            v-model="names[i]"
            class="fm-input"
            type="text"
            maxlength="16"
            :placeholder="t('app.family.player', { n: i + 1 })"
            :aria-label="t('app.family.player', { n: i + 1 })"
          )
        AdvButton(tone="gold" @click="start") {{ t('app.family.start') }}

      //- ===== the game =====
      template(v-else-if="phase === 'play'")
        div(class="fm-top")
          template(v-if="playerCount > 1")
            span(v-for="(p, i) in players" :key="i" :class="['fm-score', { 'is-turn': i === turn }]")
              span(class="fm-score-name") {{ p }}
              span(class="fm-score-n") {{ scores[i] }}
          template(v-else)
            span(class="fm-score is-turn")
              span(class="fm-score-name") {{ t('app.memory.moves') }}
              span(class="fm-score-n") {{ moves }}
          span(class="fm-score")
            span(class="fm-score-name") {{ t('app.memory.pairsFound') }}
            span(class="fm-score-n") {{ pairsFound }}/{{ pairsTotal }}
          button(v-if="canTurn" type="button" class="fm-rotate" @click="toggle") {{ full ? t('app.family.rotateBack') : t('app.family.rotate') }}
        p(v-if="playerCount > 1" class="fm-turn") {{ t('app.family.turn', { name: players[turn] ?? '' }) }}
        div(:class="['fm-board', { 'is-fit': fit }]" :style="boardStyle")
          button(
            v-for="c in cards"
            :key="c.id"
            type="button"
            :class="['fm-card3d', { 'is-face': isFace(c), 'is-found': found.includes(c.id) }]"
            :aria-label="isFace(c) ? nameOf(c.scene) : t('app.memory.hidden')"
            @click="flip(c)"
          )
            span(class="fm-inner")
              span(class="fm-face fm-back")
                img(:src="back" alt="" draggable="false")
              span(class="fm-face fm-front")
                img(:src="picture(c.scene)" alt="" draggable="false" @error="hideBroken")
                span(class="fm-ribbon") {{ nameOf(c.scene) }}

      //- ===== the end =====
      div(v-else class="fm-card fm-center")
        h2(class="fm-big") {{ playerCount === 1 ? t('app.memory.soloEnd', { moves }) : winners.length > 1 ? t('app.family.winners', { names: winners.map((w) => w.name).join(' & ') }) : t('app.family.winner', { name: winners[0]?.name ?? '' }) }}
        ol(v-if="playerCount > 1" class="fm-rank")
          li(v-for="p in placing" :key="p.name + p.rank" :class="{ 'is-first': p.rank === 1 }")
            span(class="fm-rank-n") {{ p.rank }}
            span(class="fm-rank-name") {{ p.name }}
            span(class="fm-rank-score") {{ t('app.memory.pairsOf', p.score) }}
        div(class="fm-actions")
          AdvButton(tone="gold" @click="start") {{ t('app.family.again') }}
          AdvButton(tone="blau" @click="phase = 'setup'") {{ t('app.memory.change') }}

    div(class="h-32")
</template>

<style scoped lang="sass">
.app-page
  background-color: var(--color-bg-main)
  color: var(--color-text-primary)

.fm-wrap
  display: grid
  grid-template-columns: minmax(0, 1fr)
  gap: 10px
  max-width: 36rem
  margin: 14px auto 0
  padding: 0 12px

.fm-card
  display: flex
  flex-direction: column
  gap: 8px
  padding: 18px 16px 20px
  border-radius: 24px
  background: var(--lk-surface)
  border: 1px solid var(--lk-line)
  box-shadow: var(--lk-shadow)

.fm-center
  align-items: center
  text-align: center

.fm-explain
  margin: 0
  line-height: 1.5

.fm-h
  margin: 10px 0 0
  font-size: 1rem
  font-weight: 800

.fm-sizes
  display: grid
  grid-template-columns: repeat(3, minmax(0, 1fr))
  gap: 8px

.fm-size
  display: flex
  flex-direction: column
  align-items: center
  gap: 2px
  min-height: 64px
  padding: 8px 4px
  border: 1px solid var(--lk-line)
  border-radius: 16px
  background: var(--lk-surface-2)
  color: var(--lk-text)
  font: inherit
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  &.is-on
    background: var(--lk-accent)
    border-color: var(--lk-accent)
    color: var(--lk-on-accent)

.fm-size-name
  font-weight: 800
  font-size: 1.05rem

.fm-size-pairs
  font-size: 0.8rem
  opacity: 0.85

.fm-chips
  display: flex
  gap: 8px

.fm-chip
  flex: 1 1 48px
  min-height: 48px
  border: 1px solid var(--lk-line)
  border-radius: 16px
  background: var(--lk-surface-2)
  color: var(--lk-text)
  font: inherit
  font-weight: 800
  font-size: 1.05rem
  cursor: pointer

  &.is-on
    background: var(--lk-accent)
    border-color: var(--lk-accent)
    color: var(--lk-on-accent)

.fm-names
  display: grid
  grid-template-columns: 1fr 1fr
  gap: 8px

.fm-input
  width: 100%
  min-height: 46px
  padding: 0 14px
  border: 1px solid var(--lk-line)
  border-radius: 14px
  background: var(--lk-bg)
  color: var(--lk-text)
  font: inherit

.fm-top
  display: flex
  flex-wrap: wrap
  gap: 6px

.fm-score
  flex: 1 1 64px
  display: flex
  flex-direction: column
  align-items: center
  min-width: 0
  padding: 5px 4px
  border-radius: 14px
  background: var(--lk-surface-2)

  &.is-turn
    background: var(--lk-accent)
    color: var(--lk-on-accent)

.fm-score-name
  max-width: 100%
  font-size: 0.74rem
  font-weight: 700
  white-space: nowrap
  overflow: hidden
  text-overflow: ellipsis

.fm-score-n
  font-size: 1.15rem
  font-weight: 900

.fm-turn
  margin: 2px 0 0
  text-align: center
  font-weight: 800

.fm-rotate
  flex: 0 0 auto
  align-self: center
  min-height: 40px
  padding: 0 14px
  border: 1px solid var(--lk-line)
  border-radius: 999px
  background: var(--lk-surface)
  color: var(--lk-text)
  font: inherit
  font-size: 0.82rem
  font-weight: 800
  cursor: pointer

// the phone is turned: the board fills the screen
.fm-wrap.is-fit
  max-width: none
  gap: 4px
  margin-top: 6px
  padding: 0 8px

  .fm-top
    flex-wrap: nowrap

  .fm-score
    flex-direction: row
    justify-content: center
    gap: 8px
    padding: 2px 10px

  .fm-score-n
    font-size: 1rem

  .fm-turn
    margin: 0
    font-size: 0.85rem

.fm-board.is-fit
  grid-template-columns: repeat(var(--fm-cols), var(--fm-w))
  justify-content: center

  .fm-card3d
    width: var(--fm-w)

// the board: the cards are as wide as the columns allow, two to three high
.fm-board
  display: grid
  grid-template-columns: repeat(var(--fm-cols), minmax(0, 1fr))
  gap: 8px

.fm-card3d
  position: relative
  aspect-ratio: 2 / 3
  padding: 0
  border: none
  background: transparent
  perspective: 700px
  cursor: pointer
  -webkit-tap-highlight-color: transparent

.fm-inner
  position: absolute
  inset: 0
  display: block
  transform-style: preserve-3d
  transition: transform 420ms ease

.is-face .fm-inner
  transform: rotateY(180deg)

.fm-face
  position: absolute
  inset: 0
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  overflow: hidden
  border-radius: 10px
  backface-visibility: hidden
  -webkit-backface-visibility: hidden
  box-shadow: 0 3px 8px rgba(20, 30, 40, 0.3)

.fm-back
  background: #14284f

  img
    width: 100%
    height: 100%
    object-fit: cover

.fm-front
  transform: rotateY(180deg)
  background: linear-gradient(160deg, #fdf5dc, #f3d98c)
  border: 2px solid #d9b45a
  justify-content: flex-end

  img
    position: absolute
    inset: 0
    width: 100%
    height: 100%
    object-fit: cover

// the name of the scene on a ribbon at the foot of the card
.fm-ribbon
  position: relative
  width: 100%
  padding: 12px 3px 4px
  background: linear-gradient(to top, rgba(10, 18, 38, 0.88), rgba(10, 18, 38, 0))
  color: #fff7dc
  font-size: 0.62rem
  font-weight: 800
  line-height: 1.1
  text-align: center
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8)
  overflow-wrap: anywhere

.is-found
  .fm-front
    box-shadow: 0 0 0 3px #e0bd62, 0 0 14px rgba(224, 189, 98, 0.8)

.fm-big
  margin: 6px 0
  font-size: 1.5rem
  font-weight: 900
  line-height: 1.2

.fm-rank
  width: 100%
  margin: 8px 0 0
  padding: 0
  list-style: none
  display: grid
  gap: 8px

  li
    display: flex
    align-items: center
    gap: 12px
    padding: 10px 14px
    border-radius: 16px
    background: var(--lk-surface-2)
    text-align: left

    &.is-first
      background: rgba(233, 196, 106, 0.3)
      border: 1px solid var(--lk-gold)

.fm-rank-n
  flex: none
  display: grid
  place-items: center
  width: 30px
  height: 30px
  border-radius: 50%
  background: var(--lk-surface)
  font-weight: 900

.fm-rank-name
  flex: 1
  font-weight: 800

.fm-rank-score
  font-weight: 700
  color: var(--lk-muted)

.fm-actions
  display: grid
  gap: 10px
  width: 100%
  margin-top: 10px
</style>
