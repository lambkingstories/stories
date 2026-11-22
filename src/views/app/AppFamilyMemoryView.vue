<script setup lang="ts">
/**
 * "Find the Pairs" (Plus), the picture pair game of the family games, in the light look of "Familien-Spiele v2" (see components/molecules/family/).
 * The course of a real game: the title screen (`start`: painted picture, name, "Play", "How to play", "Continue"), the players page (`lobby`: one to
 * four people with their figures and names, small / medium / large), the game (`play`, with the bar of the game in its colour: figures, names and
 * pairs) and the end (`done`: podium). The cards lie face down (teal with a golden pattern), two are turned over at a time. A pair is the same big
 * painted scene of a Bible story twice (the name of the scene stands at the foot of the card). One to four people take turns (who finds a pair
 * goes on); alone it counts the moves. Pairs that are found stay face up with a golden edge. The cards are as big as the screen allows (the board is
 * measured). A round that was left is kept and can be taken up again. Everything runs on the device.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import MapTable from '@/components/molecules/map/MapTable.vue'
import { goBackToOrigin } from '@/utils/navBack'
import FamilyCard from '@/components/molecules/family/FamilyCard.vue'
import FamilyButton from '@/components/molecules/family/FamilyButton.vue'
import FamilyChip from '@/components/molecules/family/FamilyChip.vue'
import FamilyStart from '@/components/molecules/family/FamilyStart.vue'
import FamilyLobby from '@/components/molecules/family/FamilyLobby.vue'
import FamilyGameBar from '@/components/molecules/family/FamilyGameBar.vue'
import FamilyPodium from '@/components/molecules/family/FamilyPodium.vue'
import { PREMIUM_TEASER, hasFeature, showUpsell } from '@/use/usePremium'
import useFamilySave from '@/use/useFamilySave'
import useSfx from '@/use/useSfx'
import useUserName from '@/use/useUserName'
import { MEMORY_SCENES } from '@/data/memoryScenes'
import type { ActivityLocale } from '@/data/activityWords'
import { ranking } from '@/utils/familyQuiz'
import { MEMORY_MAX_PLAYERS, MEMORY_SIZES, MEMORY_SIZE_LIST, bestColumns, buildMemory, isMatch, nextPlayer, parseMemorySnap, type MemoryCard, type MemorySize, type MemorySnap } from '@/utils/memoryGame'
import useLandscapePlay from '@/use/useLandscapePlay'
import { prependBaseUrl } from '@/utils/function'

const { t, locale } = useI18n({ useScope: 'global' })
const router = useRouter()
const { displayName, hasCustomName } = useUserName()
const { play } = useSfx()
const save = useFamilySave<MemorySnap>('memory', 1)
// a kept round of another shape (older app) is thrown away at once
if (save.saved.value && !parseMemorySnap(save.saved.value)) save.clear()

const locked = computed(() => PREMIUM_TEASER && !hasFeature('family'))
const lang = computed<ActivityLocale>(() => (locale.value.startsWith('en') ? 'en' : locale.value.startsWith('es') ? 'es' : 'de'))
const nameOf = (scene: number) => MEMORY_SCENES[scene]?.[lang.value] ?? ''
const picture = (scene: number) => prependBaseUrl(`images/spiele-memory/${String(scene).padStart(2, '0')}.webp`)

const NAMES_KEY = 'lk-family-names'

// ── setup ───────────────────────────────────────────────────────────────────────────────────────────────────────
const size = ref<MemorySize>('medium')
const playerCount = ref(2)
const names = ref<string[]>(Array.from({ length: MEMORY_MAX_PLAYERS }, () => ''))

onMounted(() => {
  let saved: string[] = []
  try {
    const raw = JSON.parse(localStorage.getItem(NAMES_KEY) ?? 'null')
    if (Array.isArray(raw)) saved = raw.filter((x) => typeof x === 'string').slice(0, 8)
  } catch {
    // start with the standard names
  }
  names.value = Array.from({ length: MEMORY_MAX_PLAYERS }, (_, i) => saved[i] || (i === 0 && hasCustomName.value ? displayName.value : ''))
  const filled = saved.filter(Boolean).length
  if (filled >= 1) playerCount.value = Math.min(MEMORY_MAX_PLAYERS, filled)
})

const nameOfPlayer = (i: number) => names.value[i]?.trim() || t('app.family.player', { n: i + 1 })
const players = computed(() => Array.from({ length: playerCount.value }, (_, i) => nameOfPlayer(i)))
/** The five lines of "How to play". */
const rules = computed(() => [1, 2, 3, 4, 5].map((n) => t(`app.bigGames.memoryFlow.rule${n}`)))

// ── the game ────────────────────────────────────────────────────────────────────────────────────────────────────
/** The course: title screen, players page, the round, the end. */
type Phase = 'start' | 'lobby' | 'play' | 'done'
const phase = ref<Phase>('start')
const playing = computed(() => phase.value === 'play')
const cards = ref<MemoryCard[]>([])
const open = ref<number[]>([])
const found = ref<number[]>([])
const turn = ref(0)
const scores = ref<number[]>([])
const moves = ref(0)
const busy = ref(false)
let hideTimer: ReturnType<typeof setTimeout> | undefined

const cols = computed(() => MEMORY_SIZES[size.value].cols)
const pairsTotal = computed(() => MEMORY_SIZES[size.value].pairs)
const pairsFound = computed(() => found.value.length / 2)
const isFace = (c: MemoryCard) => open.value.includes(c.id) || found.value.includes(c.id)

// turned phone: every card as big as the screen allows, all of them in sight; the button "play sideways" asks for the full screen
const { landscape, full, canTurn, toggle } = useLandscapePlay()

// the room of the board is measured (the page of the game fills the screen under the bar), so that the cards are as big as possible
const playEl = ref<HTMLElement | null>(null)
const room = ref({ w: 360, h: 560 })
let ro: ResizeObserver | null = null
function readRoom() {
  const el = playEl.value
  if (!el) return
  const w = el.clientWidth
  const h = el.clientHeight
  if (w > 40 && h > 40) room.value = { w, h }
}
watch(
  playEl,
  (el) => {
    ro?.disconnect()
    ro = null
    if (!el) return
    readRoom()
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(readRoom)
      ro.observe(el)
    }
  },
  { flush: 'post' }
)
// the gap between the cards, and a little air around the board for the golden edge of a pair that was found
const GAP = 10
const AIR = 8
const board = computed(() => {
  const n = cards.value.length || pairsTotal.value * 2
  const w = room.value.w - 2 * AIR
  const h = room.value.h - 2 * AIR
  if (landscape.value) {
    const b = bestColumns(n, w, h, 1.5, GAP)
    return { cols: b.cols, card: Math.max(40, b.cardWidth) }
  }
  // upright: the columns of the size; the cards are as wide as the width and the height allow (at least 56 px, then the page scrolls)
  const rows = Math.ceil(n / cols.value)
  const byWidth = (w - GAP * (cols.value - 1)) / cols.value
  const byHeight = (h - GAP * (rows - 1)) / rows / 1.5
  return { cols: cols.value, card: Math.max(56, Math.floor(Math.min(byWidth, byHeight, 220))) }
})
const boardStyle = computed(() => ({ '--fm-cols': board.value.cols, '--fm-w': `${board.value.card}px`, '--fm-gap': `${GAP}px` }))

/** The chips in the bar of the game: the figure, the name and the pairs of everybody (alone: the moves); the person on turn shines. */
const barPlayers = computed(() =>
  playerCount.value > 1
    ? players.value.map((name, i) => ({ name, score: scores.value[i] ?? 0, index: i, turn: i === turn.value }))
    : [{ name: t('app.memory.moves'), score: moves.value, index: 0, turn: false }]
)
const barSub = computed(() => `${t('app.memory.pairsFound')} ${pairsFound.value}/${pairsTotal.value}`)

/** The ranking with the number of the token of each person. */
const placing = computed(() => {
  const used = new Set<number>()
  return ranking(players.value, scores.value).map((p) => {
    const index = players.value.findIndex((n, i) => !used.has(i) && n === p.name && (scores.value[i] ?? 0) === p.score)
    used.add(index)
    return { ...p, index: Math.max(0, index) }
  })
})
const winners = computed(() => placing.value.filter((p) => p.rank === 1))
const headline = computed(() =>
  playerCount.value === 1
    ? t('app.memory.soloEnd', { moves: moves.value })
    : winners.value.length > 1
      ? t('app.family.winners', { names: winners.value.map((w) => w.name).join(' & ') })
      : t('app.family.winner', { name: winners.value[0]?.name ?? '' })
)
/** The podium: the people by their pairs; one person alone gets the golden disc and the moves in the headline. */
const rows = computed(() => (playerCount.value === 1 ? [] : placing.value.map((p) => ({ rank: p.rank, name: p.name, score: t('app.memory.pairsOf', p.score), index: p.index }))))

function start() {
  try {
    localStorage.setItem(NAMES_KEY, JSON.stringify(names.value.map((n) => n.trim())))
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
  persist()
}

// ── keep playing: the round is kept on the device whenever something in it changes ─────────────────────────────
/** Keeps the round as it is now: the mix of the cards, the turned and found ones, the turn, the points and the moves. */
function persist() {
  if (phase.value !== 'play') return
  save.save({
    size: size.value,
    playerCount: playerCount.value,
    names: names.value.map((n) => n.trim()),
    cards: cards.value.map((c) => ({ id: c.id, scene: c.scene })),
    open: [...open.value],
    found: [...found.value],
    turn: turn.value,
    scores: [...scores.value],
    moves: moves.value
  })
}

/** The kept round, if it is still good. */
const kept = computed(() => parseMemorySnap(save.saved.value))
const resumeInfo = computed(() => (kept.value ? `${t('app.memory.pairsFound')} ${kept.value.found.length / 2}/${MEMORY_SIZES[kept.value.size].pairs}` : ''))

/** Two cards that are no pair lie open for a moment, then they are turned back and the next person is on turn. */
function hideSoon() {
  busy.value = true
  clearTimeout(hideTimer)
  hideTimer = setTimeout(() => {
    open.value = []
    turn.value = nextPlayer(turn.value, playerCount.value, false)
    busy.value = false
    persist()
  }, 1100)
}

/** All pairs are found: after a moment the end is shown and the kept round is forgotten. */
function endSoon() {
  clearTimeout(hideTimer)
  hideTimer = setTimeout(() => {
    phase.value = 'done'
    save.clear()
    play('familyResult')
  }, 1100)
}

function resume() {
  const s = kept.value
  if (!s) {
    save.clear()
    return
  }
  play('tap')
  clearTimeout(hideTimer)
  size.value = s.size
  playerCount.value = s.playerCount
  names.value = Array.from({ length: MEMORY_MAX_PLAYERS }, (_, i) => s.names[i] ?? '')
  cards.value = s.cards.map((c) => ({ ...c }))
  open.value = [...s.open]
  found.value = [...s.found]
  turn.value = s.turn
  scores.value = [...s.scores]
  moves.value = s.moves
  busy.value = false
  phase.value = 'play'
  if (open.value.length === 2) hideSoon()
  else if (found.value.length === cards.value.length) endSoon()
}

function flip(c: MemoryCard) {
  if (phase.value !== 'play' || busy.value || isFace(c)) return
  play('flip')
  open.value = [...open.value, c.id]
  if (open.value.length < 2) {
    persist()
    return
  }
  moves.value++
  const [a, b] = open.value.map((id) => cards.value[id]!) as [MemoryCard, MemoryCard]
  if (isMatch(a, b)) {
    found.value = [...found.value, a.id, b.id]
    scores.value[turn.value] = (scores.value[turn.value] ?? 0) + 1
    open.value = []
    persist()
    setTimeout(() => play('found'), 380)
    if (found.value.length === cards.value.length) endSoon()
    return
  }
  persist()
  hideSoon()
}
onBeforeUnmount(() => {
  clearTimeout(hideTimer)
  ro?.disconnect()
})

/** The bar of the game asked "End the game?" and the person ended it: back to the title screen (the round stays kept, there it can be taken up again). */
function leaveGame() {
  // nothing may still turn cards or end the round while the title screen is shown: the kept state has all of it
  clearTimeout(hideTimer)
  busy.value = false
  phase.value = 'start'
}

/** The back button of the table: one step back (players page and end to the title screen), from the title screen to the games. */
function goBack() {
  if (phase.value === 'play') {
    leaveGame()
    return
  }
  if (phase.value === 'lobby' || phase.value === 'done') {
    phase.value = 'start'
    return
  }
  goBackToOrigin(router, { name: 'app-family' })
}

/** "To the games": from the end back to the page of the family games. */
function toGames() {
  goBackToOrigin(router, { name: 'app-family' })
}

function again() {
  play('tap')
  start()
}

/** A picture that is not there (yet) is left out; the band with the name stays. */
function hideBroken(e: Event) {
  const el = e.target
  if (el instanceof HTMLElement) el.style.display = 'none'
}
</script>

<template lang="pug">
  MapTable(title="" game="memory" @back="goBack")
    //- ===== the bar of the game (while a round runs): the colour of the game, the people with their pairs, leaving asks first =====
    template(v-if="playing && !locked" v-slot:top)
      FamilyGameBar(
        game="memory"
        :title="t('app.family.hub_memory')"
        :subtitle="barSub"
        :players="barPlayers"
        :leave-text="t('app.bigGames.familyFlow.leaveKept')"
        @leave="leaveGame"
      )
        //- a touch screen: play with the phone turned (full screen)
        template(v-slot:actions)
          button(v-if="canTurn" type="button" class="fm-rotate" :aria-label="full ? t('app.family.rotateBack') : t('app.family.rotate')" :title="full ? t('app.family.rotateBack') : t('app.family.rotate')" @click="toggle")
            svg(viewBox="0 0 24 24" width="24" height="24" aria-hidden="true")
              rect(x="7" y="3" width="10" height="18" rx="2.2" fill="none" stroke="currentColor" stroke-width="1.8")
              path(d="M20.5 9.5a8.5 8.5 0 0 1-3 7.6M3.5 14.5a8.5 8.5 0 0 1 3-7.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round")

    //- ===== 3. the cards (the board is as big as the screen allows) =====
    div(v-if="playing && !locked" ref="playEl" class="fm-play")
      p(v-if="playerCount > 1" class="fm-sr" aria-live="polite") {{ t('app.family.turn', { name: players[turn] ?? '' }) }}
      div(class="fm-board" :style="boardStyle")
        button(
          v-for="c in cards"
          :key="c.id"
          type="button"
          :class="['fm-card', { 'is-face': isFace(c), 'is-found': found.includes(c.id) }]"
          :aria-label="isFace(c) ? nameOf(c.scene) : t('app.memory.hidden')"
          @click="flip(c)"
        )
          span(class="fm-inner")
            span(class="fm-face fm-back" aria-hidden="true")
            span(class="fm-face fm-front")
              img(:src="picture(c.scene)" alt="" draggable="false" @error="hideBroken")
              span(class="fm-band") {{ nameOf(c.scene) }}

    div(v-else class="fm")
      //- ===== Plus: the title screen with the lock =====
      FamilyStart(
        v-if="locked"
        game="memory"
        :name="t('app.family.hub_memory')"
        :tagline="t('app.family.hub_memorySub')"
        @play="showUpsell('family')"
      )
        template(v-slot:extra)
          FamilyCard(compact)
            span(class="fm-fine") {{ t('app.memory.locked') }}
          FamilyButton(class="fm-lock" quiet @click="showUpsell('family')") {{ t('app.family.lockedButton') }}

      //- ===== 1. the title screen =====
      FamilyStart(
        v-else-if="phase === 'start'"
        game="memory"
        :name="t('app.family.hub_memory')"
        :tagline="t('app.family.hub_memorySub')"
        :rules="rules"
        :resume-info="resumeInfo"
        @play="phase = 'lobby'"
        @resume="resume"
      )

      //- ===== 2. who plays, and how big =====
      FamilyLobby(
        v-else-if="phase === 'lobby'"
        game="memory"
        :count="playerCount"
        :names="names"
        :min="1"
        :max="MEMORY_MAX_PLAYERS"
        @update:count="playerCount = $event"
        @update:names="names = $event"
        @go="start"
      )
        template(v-slot:settings)
          FamilyCard(:title="t('app.memory.size')" symbol="memory")
            div(class="fm-sizes" role="radiogroup" :aria-label="t('app.memory.size')")
              FamilyChip(v-for="s in MEMORY_SIZE_LIST" :key="s" class="fm-size" :selected="size === s" @click="size = s; play('tap')")
                span(class="fm-size-name") {{ t(`app.memory.size_${s}`) }}
                span(class="fm-size-pairs") {{ t('app.memory.pairs', { n: MEMORY_SIZES[s].pairs }) }}

      //- ===== 4. the end: the podium =====
      FamilyPodium(
        v-else
        game="memory"
        :headline="headline"
        :rows="rows"
        :winner-index="winners[0]?.index ?? 0"
        @again="again"
        @change="phase = 'lobby'"
        @exit="toGames"
      )
</template>

<style scoped lang="sass">
// the pages before and after the game: one column in the middle (the title screen sits in the vertical middle)
.fm
  display: flex
  flex-direction: column
  gap: 16px
  min-height: 100%
  max-width: 36rem
  margin: 0 auto
  padding: 6px 0 24px

@media (orientation: landscape)
  .fm
    max-width: 62rem
    gap: 12px

.fm-fine
  display: block
  width: 100%
  color: var(--fam-muted)
  font-size: 1.02rem
  font-weight: 600
  line-height: 1.35
  text-align: center

.fm-lock
  width: min(100%, 22rem)

.fm-sr
  position: absolute
  width: 1px
  height: 1px
  margin: -1px
  overflow: hidden
  clip: rect(0, 0, 0, 0)

// ── the players page: the size ──
.fm-sizes
  display: grid
  grid-template-columns: repeat(3, minmax(0, 1fr))
  gap: 10px
  width: 100%
  // room for the tick of a chosen chip
  padding: 4px 4px 2px

.fm-size
  width: 100%
  min-height: 64px
  padding: 8px 4px

  :deep(.fam-chip-text)
    display: flex
    flex-direction: column
    align-items: center
    gap: 2px

.fm-size-name
  display: block
  font-size: 1.15rem
  font-weight: 800

.fm-size-pairs
  display: block
  font-size: 0.9rem
  font-weight: 700
  opacity: 0.85

// the button "play sideways" in the bar of the game
.fm-rotate
  flex: none
  display: grid
  place-items: center
  width: 48px
  height: 48px
  padding: 0
  border: 1.5px solid rgba(255, 255, 255, 0.4)
  border-radius: 50%
  background: rgba(255, 255, 255, 0.18)
  color: var(--fam-on-accent)
  cursor: pointer
  touch-action: manipulation
  -webkit-tap-highlight-color: transparent

  &:focus-visible
    outline: 3px solid var(--fam-focus)
    outline-offset: 2px

// ── the game: the board fills the screen under the bar, the cards are as big as it allows ──
.fm-play
  display: flex
  position: relative
  height: 100%
  min-height: 0

.fm-board
  display: grid
  grid-template-columns: repeat(var(--fm-cols), var(--fm-w))
  gap: var(--fm-gap, 10px)
  justify-content: center
  align-content: center
  // centred, but when the board is higher than the screen it starts at the top and the page scrolls
  margin: auto
  padding: 8px

.fm-card
  position: relative
  box-sizing: border-box
  width: var(--fm-w)
  aspect-ratio: 2 / 3
  padding: 0
  border: none
  border-radius: 12px
  background: transparent
  perspective: 800px
  cursor: pointer
  touch-action: manipulation
  -webkit-tap-highlight-color: transparent

  &:focus-visible
    outline: 3px solid var(--fam-focus)
    outline-offset: 3px

.fm-inner
  position: absolute
  inset: 0
  display: block
  transform-style: preserve-3d
  transition: transform 460ms ease

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
  border-radius: 12px
  backface-visibility: hidden
  -webkit-backface-visibility: hidden
  box-shadow: 0 4px 10px -3px color-mix(in srgb, var(--fam-ink) 45%, transparent), 0 1px 2px color-mix(in srgb, var(--fam-ink) 25%, transparent)

// the back of a card: teal with a fine golden pattern, a golden frame and a golden star
.fm-back
  background: repeating-linear-gradient(45deg, color-mix(in srgb, var(--fam-gold) 20%, transparent) 0 1.5px, transparent 1.5px 11px), repeating-linear-gradient(-45deg, color-mix(in srgb, var(--fam-gold) 20%, transparent) 0 1.5px, transparent 1.5px 11px), linear-gradient(160deg, color-mix(in srgb, var(--fam-primary) 82%, white), var(--fam-primary-deep))
  border: 2px solid color-mix(in srgb, var(--fam-gold) 75%, var(--fam-primary-deep))

  // the frame inside
  &::before
    content: ''
    position: absolute
    inset: 7%
    border: 1.5px solid color-mix(in srgb, var(--fam-gold) 85%, transparent)
    border-radius: 8px

  // the star
  &::after
    content: ''
    position: absolute
    left: 50%
    top: 50%
    width: 44%
    aspect-ratio: 1
    transform: translate(-50%, -50%)
    background: var(--fam-gold)
    clip-path: polygon(50% 0, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)
    filter: drop-shadow(0 1px 1px color-mix(in srgb, var(--fam-primary-deep) 70%, transparent))

.fm-front
  transform: rotateY(180deg)
  background: var(--fam-card)
  justify-content: flex-end

  img
    position: absolute
    inset: 0
    width: 100%
    height: 100%
    object-fit: cover

// the name of the scene at the foot of the card: a white strip, the size of the writing follows the size of the card
.fm-band
  position: relative
  box-sizing: border-box
  width: 100%
  min-height: 22px
  padding: 4px 5px 3px
  display: flex
  align-items: center
  justify-content: center
  border-top: 1.5px solid var(--fam-line-strong)
  background: color-mix(in srgb, var(--fam-card) 96%, transparent)
  color: var(--fam-ink)
  font-size: clamp(0.6rem, calc(var(--fm-w) * 0.115), 1rem)
  font-weight: 800
  line-height: 1.1
  text-align: center
  overflow-wrap: anywhere

// a pair that is found stays face up with a golden edge (no glow that keeps on)
.is-found
  .fm-front
    box-shadow: 0 0 0 3px var(--fam-gold), 0 4px 10px -3px color-mix(in srgb, var(--fam-ink) 45%, transparent)

@media (prefers-reduced-motion: reduce)
  .fm-inner
    transition: none
</style>
