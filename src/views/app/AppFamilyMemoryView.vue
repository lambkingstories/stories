<script setup lang="ts">
/**
 * The memory game (Plus) on the old map, small, medium or large: the cards lie face down on the map (dark linen with a golden edge), two
 * are turned over at a time. A pair is the same big painted scene of a Bible story twice (the name of the scene is on a narrow parchment
 * band). One to four people take turns (who finds a pair goes on); alone it counts the moves. Pairs that are found stay face up with a
 * fine golden edge. Everything runs on the device.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import MapTable from '@/components/molecules/map/MapTable.vue'
import MapPaper from '@/components/molecules/map/MapPaper.vue'
import MapButton from '@/components/molecules/map/MapButton.vue'
import MapSeats from '@/components/molecules/map/MapSeats.vue'
import MapScoreBar from '@/components/molecules/map/MapScoreBar.vue'
import MapResult from '@/components/molecules/map/MapResult.vue'
import MapResume from '@/components/molecules/map/MapResume.vue'
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

/** Inside a round the arrow leads to the start page of this game (the round stays kept); there it leads to the main menu. */
function goBack() {
  if (phase.value !== 'setup') {
    // nothing may still turn cards or end the round while the start page is shown: the kept state has all of it
    clearTimeout(hideTimer)
    busy.value = false
    phase.value = 'setup'
    return
  }
  void router.push({ name: 'app-family' })
}

const locked = computed(() => PREMIUM_TEASER && !hasFeature('family'))
const lang = computed<ActivityLocale>(() => (locale.value.startsWith('en') ? 'en' : locale.value.startsWith('es') ? 'es' : 'de'))
const nameOf = (scene: number) => MEMORY_SCENES[scene]?.[lang.value] ?? ''
const picture = (scene: number) => prependBaseUrl(`images/spiele-memory/${String(scene).padStart(2, '0')}.webp`)
const back = prependBaseUrl('images/familie/karte/karten-rueck.webp')
const bandBg = `url(${prependBaseUrl('images/familie/karte/pergament-streifen.webp')})`
/** The linen back is not there (yet): the cards get a dark blue face with a golden edge. */
const backGone = ref(false)

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
// turned phone: the score moves up beside the back button, every card as big as the screen allows, all of them in sight
const { landscape, full, canTurn, width, height, toggle } = useLandscapePlay()
const fit = computed(() => landscape.value && phase.value === 'play')
const fitBoard = computed(() => bestColumns(cards.value.length, width.value - 32, height.value - 96))
// upright phone: the board gets only as wide as all the rows still fit on the screen (but the cards stay at least 70 px wide)
const uprightWidth = computed(() => {
  const rows = Math.ceil((cards.value.length || pairsTotal.value * 2) / cols.value)
  const room = height.value - 60 - 92 - 24 - 9 * (rows - 1)
  const card = Math.max(70, Math.floor(room / rows / 1.5))
  return Math.min(576, card * cols.value + 9 * (cols.value - 1))
})
const boardStyle = computed(() =>
  fit.value ? { '--fm-cols': fitBoard.value.cols, '--fm-w': `${fitBoard.value.cardWidth}px` } : { '--fm-cols': cols.value, maxWidth: `${uprightWidth.value}px` }
)
const pairsTotal = computed(() => MEMORY_SIZES[size.value].pairs)
const pairsFound = computed(() => found.value.length / 2)
const isFace = (c: MemoryCard) => open.value.includes(c.id) || found.value.includes(c.id)

const scorePlayers = computed(() =>
  playerCount.value > 1
    ? players.value.map((name, i) => ({ name, score: scores.value[i] ?? 0, index: i, turn: i === turn.value }))
    : [{ name: t('app.memory.moves'), score: moves.value, index: 0, turn: true }]
)

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
const rows = computed(() => placing.value.map((p) => ({ rank: p.rank, name: p.name, score: t('app.memory.pairsOf', p.score), index: p.index })))

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
const keptInfo = computed(() => (kept.value ? `${t('app.memory.pairsFound')} ${kept.value.found.length / 2}/${MEMORY_SIZES[kept.value.size].pairs}` : ''))

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
onBeforeUnmount(() => clearTimeout(hideTimer))

function again() {
  play('tap')
  start()
}

function change() {
  play('tap')
  phase.value = 'setup'
}

/** A picture that is not there (yet) is left out; the band with the name stays. */
function hideBroken(e: Event) {
  const el = e.target
  if (el instanceof HTMLElement) el.style.display = 'none'
}

/** Every card lies a little crooked on the table (a fixed small angle per place, so that nothing jumps). */
const tilt = (id: number) => `${(((id * 37) % 5) - 2) * 0.5}deg`
</script>

<template lang="pug">
  MapTable(:title="fit ? '' : t('app.memory.title')" @back="goBack")
    template(#actions)
      template(v-if="phase === 'play'")
        div(v-if="fit" class="fm-hud")
          MapScoreBar(:players="scorePlayers")
          span(class="fm-tag")
            span {{ t('app.memory.pairsFound') }}
            strong {{ pairsFound }}/{{ pairsTotal }}
        button(v-if="canTurn" type="button" class="fm-rotate" @click="toggle") {{ full ? t('app.family.rotateBack') : t('app.family.rotate') }}

    //- ===== Plus ====================================================================================================
    div(v-if="locked" class="fm-stack")
      MapPaper(kind="card")
        p(class="fm-text") {{ t('app.memory.locked') }}
      MapButton(@click="showUpsell('family')") {{ t('app.family.lockedButton') }}

    //- ===== setup ===================================================================================================
    div(v-else-if="phase === 'setup'" class="fm-setup")
      MapResume(v-if="kept" :info="keptInfo" @resume="resume")
      p(class="fm-sub") {{ t('app.memory.sub') }}
      div(class="fm-part")
        MapSeats(v-model:count="playerCount" v-model:names="names" :max="MEMORY_MAX_PLAYERS" :question="t('app.family.howMany')")
      div(class="fm-part")
        h2(class="fm-h") {{ t('app.memory.size') }}
        div(class="fm-sizes" role="radiogroup")
          button(v-for="s in MEMORY_SIZE_LIST" :key="s" type="button" role="radio" :aria-checked="size === s" :class="['fm-size', { 'is-on': size === s }]" @click="size = s; play('tap')")
            span(class="fm-size-name") {{ t(`app.memory.size_${s}`) }}
            span(class="fm-size-pairs") {{ t('app.memory.pairs', { n: MEMORY_SIZES[s].pairs }) }}
        div(class="fm-go")
          MapButton(@click="play('button'); start()") {{ t('app.family.start') }}

    //- ===== the game ================================================================================================
    template(v-else-if="phase === 'play'")
      div(v-if="!fit" class="fm-top")
        MapScoreBar(:players="scorePlayers")
        span(class="fm-tag")
          span {{ t('app.memory.pairsFound') }}
          strong {{ pairsFound }}/{{ pairsTotal }}
      p(v-if="playerCount > 1" class="fm-sr" aria-live="polite") {{ t('app.family.turn', { name: players[turn] ?? '' }) }}
      div(:class="['fm-board', { 'is-fit': fit }]" :style="boardStyle")
        button(
          v-for="c in cards"
          :key="c.id"
          type="button"
          :class="['fm-card3d', { 'is-face': isFace(c), 'is-found': found.includes(c.id) }]"
          :style="{ '--fm-tilt': tilt(c.id) }"
          :aria-label="isFace(c) ? nameOf(c.scene) : t('app.memory.hidden')"
          @click="flip(c)"
        )
          span(class="fm-inner")
            span(:class="['fm-face', 'fm-back', { 'is-bare': backGone }]")
              img(v-if="!backGone" :src="back" alt="" draggable="false" @error="backGone = true")
            span(class="fm-face fm-front")
              img(:src="picture(c.scene)" alt="" draggable="false" @error="hideBroken")
              span(class="fm-band" :style="{ backgroundImage: bandBg }") {{ nameOf(c.scene) }}

    //- ===== the end =================================================================================================
    div(v-else class="fm-stack")
      MapResult(:headline="headline" :rows="rows" :winner-index="winners[0]?.index")
        MapButton(@click="again") {{ t('app.family.again') }}
        MapButton(quiet @click="change") {{ t('app.memory.change') }}
</template>

<style scoped lang="sass">
$light: #f6ead0
$shade: 0 1px 4px rgba(0, 0, 0, 0.95), 0 0 10px rgba(0, 0, 0, 0.6)

.fm-stack
  display: flex
  flex-direction: column
  align-items: center
  gap: 14px
  width: 100%
  max-width: 28rem
  margin: 0 auto
  padding-top: 8px
  text-align: center

.fm-text
  margin: 0
  line-height: 1.4

.fm-sr
  position: absolute
  width: 1px
  height: 1px
  margin: -1px
  overflow: hidden
  clip: rect(0, 0, 0, 0)

// ── setup ──
.fm-setup
  display: flex
  flex-direction: column
  gap: 14px
  width: 100%
  max-width: 30rem
  margin: 0 auto
  padding-top: 4px

.fm-sub
  margin: 0
  text-align: center
  font-size: 1.1rem
  font-style: italic
  line-height: 1.35
  color: $light
  text-shadow: $shade

.fm-part
  display: flex
  flex-direction: column
  gap: 12px

.fm-h
  margin: 0
  font-size: 1.15rem
  font-weight: 800
  text-align: center
  color: $light
  text-shadow: $shade

.fm-sizes
  display: grid
  grid-template-columns: repeat(3, minmax(0, 1fr))
  gap: 10px

// a plate of bronze for every size
.fm-size
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  gap: 2px
  min-height: 68px
  padding: 8px 4px
  border-radius: 12px
  border: 1px solid rgba(255, 222, 150, 0.75)
  background: radial-gradient(120% 140% at 35% 25%, #c79a45, #7d5a22 70%, #4d3513)
  box-shadow: 0 3px 7px rgba(0, 0, 0, 0.55), inset 0 1px 1px rgba(255, 240, 190, 0.6), inset 0 0 0 3px rgba(60, 38, 10, 0.22)
  color: #fff3cf
  font-family: var(--mp-serif, Georgia, serif)
  text-shadow: 0 1px 2px rgba(20, 10, 0, 0.9)
  cursor: pointer
  filter: brightness(0.7) saturate(0.85)
  transition: transform 0.2s, filter 0.2s, box-shadow 0.2s
  -webkit-tap-highlight-color: transparent

  &.is-on
    filter: none
    transform: translateY(-3px) scale(1.04)
    border-color: #ffe9a8
    box-shadow: 0 0 16px rgba(255, 205, 100, 0.8), 0 4px 8px rgba(0, 0, 0, 0.55), inset 0 1px 1px rgba(255, 240, 190, 0.7), inset 0 0 0 3px rgba(60, 38, 10, 0.22)

.fm-size-name
  font-size: 1.2rem
  font-weight: 800

.fm-size-pairs
  font-size: 0.9rem
  font-weight: 600
  opacity: 0.9

.fm-go
  display: flex
  justify-content: center
  padding-top: 6px

@media (orientation: landscape)
  .fm-setup
    display: grid
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr)
    max-width: 52rem
    gap: 6px 22px
    align-items: start

  .fm-sub
    display: none

  .fm-part
    gap: 8px

  .fm-go
    padding-top: 0

// ── the game ──
.fm-top
  display: flex
  flex-wrap: wrap
  justify-content: center
  align-items: center
  gap: 6px
  margin-bottom: 10px

.fm-hud
  display: flex
  align-items: center
  gap: 6px
  min-width: 0

  :deep(.msb)
    flex-wrap: nowrap

  :deep(.msb-name)
    max-width: 5em

// the pairs counter, a small brass tag like those of the players
.fm-tag
  display: inline-flex
  align-items: center
  gap: 7px
  padding: 5px 12px
  border-radius: 999px
  border: 1px solid rgba(226, 189, 102, 0.55)
  background: rgba(28, 19, 10, 0.72)
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.5)
  color: $light
  font-family: var(--mp-serif, Georgia, serif)
  font-size: 1rem
  font-weight: 700
  white-space: nowrap

  strong
    font-size: 1.15rem
    font-weight: 800
    color: var(--mp-gold, #e2bd66)

// the small brass button in the corner: turn the phone
.fm-rotate
  flex: none
  min-height: 44px
  padding: 0 16px
  border-radius: 999px
  border: 2px solid #9a6b1c
  background: linear-gradient(180deg, #fff8e0 0%, #efd89c 100%)
  box-shadow: 0 0 0 2px rgba(255, 246, 214, 0.92), 0 4px 8px rgba(60, 35, 5, 0.45), inset 0 1px 0 #ffffff
  color: #3a2812
  font-family: var(--mp-serif, Georgia, serif)
  font-size: 0.95rem
  font-weight: 700
  text-shadow: none
  white-space: nowrap
  cursor: pointer
  -webkit-tap-highlight-color: transparent

// the board: the cards lie on the map, as wide as the columns allow
.fm-board
  display: grid
  grid-template-columns: repeat(var(--fm-cols), minmax(0, 1fr))
  gap: 9px
  width: 100%
  max-width: 36rem
  margin: 0 auto

.fm-board.is-fit
  grid-template-columns: repeat(var(--fm-cols), var(--fm-w))
  justify-content: center
  max-width: none

  .fm-card3d
    width: var(--fm-w)

.fm-card3d
  position: relative
  aspect-ratio: 2 / 3
  padding: 0
  border: none
  background: transparent
  perspective: 700px
  cursor: pointer
  transform: rotate(var(--fm-tilt, 0deg))
  -webkit-tap-highlight-color: transparent

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
  border-radius: 8px
  backface-visibility: hidden
  -webkit-backface-visibility: hidden
  box-shadow: 0 4px 9px rgba(10, 5, 0, 0.6)

// the dark linen back; without its picture: dark blue with a golden edge
.fm-back
  background: #14284f

  img
    width: 100%
    height: 100%
    object-fit: cover

  &.is-bare
    border: 2px solid #c9a24a
    box-shadow: 0 4px 9px rgba(10, 5, 0, 0.6), inset 0 0 0 3px rgba(20, 40, 79, 0.9), inset 0 0 0 4px rgba(201, 162, 74, 0.55)

.fm-front
  transform: rotateY(180deg)
  background: #ecdcb6
  justify-content: flex-end

  img
    position: absolute
    inset: 0
    width: 100%
    height: 100%
    object-fit: cover

// the name of the scene on a narrow parchment band at the foot of the card
.fm-band
  position: relative
  box-sizing: border-box
  width: 100%
  min-height: 22px
  padding: 4px 5px 3px
  display: flex
  align-items: center
  justify-content: center
  background-color: #e9d8ae
  background-size: 100% 100%
  background-repeat: no-repeat
  color: #3a2812
  font-family: var(--mp-serif, Georgia, serif)
  font-size: 0.66rem
  font-weight: 700
  line-height: 1.1
  text-align: center
  overflow-wrap: anywhere
  box-shadow: 0 -2px 4px rgba(10, 5, 0, 0.35)

// a pair that is found stays face up with a fine golden edge
.is-found
  .fm-front
    box-shadow: 0 0 0 2px #e2bd66, 0 0 12px rgba(226, 189, 102, 0.75), 0 4px 9px rgba(10, 5, 0, 0.6)
</style>
