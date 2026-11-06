<script setup lang="ts">
/**
 * The order race (Plus), on the old map: a few stages of one adventure lie mixed up on the table as parchment strips (their titles), and
 * the person on turn taps them in the order in which they happen in the story. A strip that is right travels onto a dotted route, where
 * it gets a wax seal with its number; a wrong one shakes for a moment. One point for every place that was right at the first try, and a
 * bonus for the whole row (`scoreOrder`, unchanged). One device is passed around (or one person plays alone). The right order is the
 * order of the stages in the adventure, so nothing is made up.
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import MapTable from '@/components/molecules/map/MapTable.vue'
import MapPaper from '@/components/molecules/map/MapPaper.vue'
import MapButton from '@/components/molecules/map/MapButton.vue'
import MapSeats from '@/components/molecules/map/MapSeats.vue'
import MapToken from '@/components/molecules/map/MapToken.vue'
import MapScoreBar from '@/components/molecules/map/MapScoreBar.vue'
import MapRoute from '@/components/molecules/map/MapRoute.vue'
import MapResult from '@/components/molecules/map/MapResult.vue'
import MapResume from '@/components/molecules/map/MapResume.vue'
import { journeys } from '@/data/adventures'
import { PREMIUM_TEASER, hasFeature, showUpsell } from '@/use/usePremium'
import useFamilySave from '@/use/useFamilySave'
import useSfx from '@/use/useSfx'
import useUserName from '@/use/useUserName'
import { prependBaseUrl } from '@/utils/function'
import { MAX_PLAYERS, ranking } from '@/utils/familyQuiz'
import {
  ORDER_BONUS,
  ORDER_COUNTS,
  ORDER_ROUND_CHOICES,
  buildOrderRound,
  mixUp,
  orderJourneys,
  parseOrderSnap,
  scoreFromMissed,
  type OrderRound,
  type OrderScore,
  type OrderSnap
} from '@/utils/orderRace'

const { t } = useI18n({ useScope: 'global' })
const router = useRouter()
const { displayName, hasCustomName } = useUserName()
const { play } = useSfx()
const save = useFamilySave<OrderSnap>('order', 1)
// a kept round of another shape (older app) is thrown away at once
if (save.saved.value && !parseOrderSnap(save.saved.value)) save.clear()

/** Inside a round the arrow leads to the start page of this game (the round stays kept); there it leads to the main menu. */
function goBack() {
  if (phase.value !== 'setup') {
    clearTimeout(wobbleTimer)
    wobble.value = null
    phase.value = 'setup'
    return
  }
  void router.push({ name: 'app-family' })
}

const locked = computed(() => PREMIUM_TEASER && !hasFeature('family'))
const NAMES_KEY = 'lk-family-names'

// ── setup ───────────────────────────────────────────────────────────────────────────────────────────────────────
const names = ref<string[]>(Array.from({ length: MAX_PLAYERS }, () => ''))
const playerCount = ref(2)
const rounds = ref<number>(1)
const count = ref<number>(5)
const only = ref('')

onMounted(() => {
  let saved: string[] = []
  try {
    const raw = JSON.parse(localStorage.getItem(NAMES_KEY) ?? 'null')
    if (Array.isArray(raw)) saved = raw.filter((x) => typeof x === 'string').slice(0, MAX_PLAYERS)
  } catch {
    // start with the standard names
  }
  names.value = Array.from({ length: MAX_PLAYERS }, (_, i) => saved[i] || (i === 0 && hasCustomName.value ? displayName.value : ''))
  if (saved.filter(Boolean).length >= 1) playerCount.value = Math.min(MAX_PLAYERS, Math.max(1, saved.filter(Boolean).length))
})

const nameOf = (i: number) => names.value[i]?.trim() || t('app.family.player', { n: i + 1 })
const players = computed(() => Array.from({ length: playerCount.value }, (_, i) => nameOf(i)))
const journeyOptions = computed(() => orderJourneys(journeys, count.value))
const canStart = computed(() => journeyOptions.value.length > 0 && (!only.value || journeyOptions.value.includes(only.value)))
const totalTurns = computed(() => playerCount.value * rounds.value)

// ── the game ────────────────────────────────────────────────────────────────────────────────────────────────────
type Phase = 'setup' | 'handover' | 'play' | 'result'
const phase = ref<Phase>('setup')
const turn = ref(0)
const scores = ref<number[]>([])
const round = ref<OrderRound | null>(null)
const mixed = ref<string[]>([])
/** The strips that are already on the route (always the right ones, in the right order). */
const picked = ref<string[]>([])
/** For every place: it was not right at the first try (no point for it). */
const missed = ref<boolean[]>([])
/** The strips that were wrong for the place that is open now (they rest a little). */
const tried = ref<string[]>([])
const wobble = ref<string | null>(null)
const result = ref<OrderScore | null>(null)
let wobbleTimer: ReturnType<typeof setTimeout> | undefined

const who = computed(() => turn.value % playerCount.value)
const whoName = computed(() => players.value[who.value] ?? '')
const isLast = computed(() => turn.value >= totalTurns.value - 1)
const left = computed(() => mixed.value.filter((x) => !picked.value.includes(x)))
const done = computed(() => !!round.value && picked.value.length === round.value.titles.length)
const routeMax = computed(() => rounds.value * (count.value + ORDER_BONUS))

const scorePlayers = computed(() => players.value.map((name, i) => ({ name, score: scores.value[i] ?? 0, index: i, turn: i === who.value })))
const routePlayers = computed(() => players.value.map((name, i) => ({ name, value: scores.value[i] ?? 0, index: i, turn: i === who.value })))

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
    ? t('app.order.soloEnd', { points: t('app.family.points', scores.value[0] ?? 0) })
    : winners.value.length > 1
      ? t('app.family.winners', { names: winners.value.map((w) => w.name).join(' & ') })
      : t('app.family.winner', { name: winners.value[0]?.name ?? '' })
)
const rows = computed(() => placing.value.map((p) => ({ rank: p.rank, name: p.name, score: t('app.family.points', p.score), index: p.index })))

function newRound() {
  round.value = buildOrderRound(journeys, count.value, Math.random, only.value)
  mixed.value = round.value ? mixUp(round.value.titles) : []
  picked.value = []
  missed.value = mixed.value.map(() => false)
  tried.value = []
  wobble.value = null
  result.value = null
}

// ── keep playing: the round is kept on the device whenever something in it changes ─────────────────────────────
/** Keeps the round as it is now (between two turns, or in a row). The points of a finished row are in `scores` already. */
function persist() {
  if (phase.value !== 'handover' && phase.value !== 'play') return
  save.save({
    phase: phase.value,
    playerCount: playerCount.value,
    rounds: rounds.value,
    count: count.value,
    only: only.value,
    names: names.value.map((n) => n.trim()),
    turn: turn.value,
    scores: [...scores.value],
    round: phase.value === 'play' && round.value ? { journey: round.value.journey, titles: [...round.value.titles] } : null,
    mixed: phase.value === 'play' ? [...mixed.value] : [],
    picked: phase.value === 'play' ? [...picked.value] : [],
    missed: phase.value === 'play' ? [...missed.value] : [],
    tried: phase.value === 'play' ? [...tried.value] : []
  })
}

/** The kept round, if it is still good. */
const kept = computed(() => parseOrderSnap(save.saved.value))
const keptInfo = computed(() => (kept.value ? t('app.order.turnOf', { n: kept.value.turn + 1, total: kept.value.playerCount * kept.value.rounds }) : ''))

function resume() {
  const s = kept.value
  if (!s) {
    save.clear()
    return
  }
  play('tap')
  clearTimeout(wobbleTimer)
  playerCount.value = s.playerCount
  rounds.value = s.rounds
  count.value = s.count
  only.value = s.only
  names.value = Array.from({ length: MAX_PLAYERS }, (_, i) => s.names[i] ?? '')
  turn.value = s.turn
  scores.value = [...s.scores]
  round.value = s.round
  mixed.value = [...s.mixed]
  picked.value = [...s.picked]
  missed.value = [...s.missed]
  tried.value = [...s.tried]
  wobble.value = null
  // a finished row shows its result again (without giving the points a second time: they are in `scores`)
  result.value = s.round && s.picked.length === s.round.titles.length ? scoreFromMissed(s.round.titles, s.missed) : null
  phase.value = s.phase
}

function start() {
  try {
    localStorage.setItem(NAMES_KEY, JSON.stringify(names.value.map((n) => n.trim())))
  } catch {
    // the names are not remembered in a private window
  }
  if (!canStart.value) return
  scores.value = Array.from({ length: playerCount.value }, () => 0)
  turn.value = 0
  phase.value = 'handover'
  persist()
}

function go() {
  play('tap')
  newRound()
  if (round.value) {
    phase.value = 'play'
    persist()
  }
}

function finish() {
  const r = round.value
  if (!r) return
  // a place that was missed at the first try counts as a wrong one, so the points are those of `scoreOrder`
  result.value = scoreFromMissed(r.titles, missed.value)
  scores.value[who.value] = (scores.value[who.value] ?? 0) + result.value.points
  play(result.value.all ? 'fanfare' : 'star')
}

function pick(title: string) {
  const r = round.value
  if (!r || done.value || picked.value.includes(title)) return
  const k = picked.value.length
  if (title === r.titles[k]) {
    picked.value = [...picked.value, title]
    tried.value = []
    play('familyRight')
    if (picked.value.length === r.titles.length) finish()
    persist()
    return
  }
  missed.value[k] = true
  if (!tried.value.includes(title)) tried.value = [...tried.value, title]
  wobble.value = title
  play('familyWrong')
  clearTimeout(wobbleTimer)
  wobbleTimer = setTimeout(() => (wobble.value = null), 520)
  persist()
}
onBeforeUnmount(() => clearTimeout(wobbleTimer))

function next() {
  if (isLast.value) {
    play('familyResult')
    phase.value = 'result'
    save.clear()
    return
  }
  play('tap')
  turn.value++
  phase.value = 'handover'
  persist()
}

function again() {
  play('tap')
  start()
}

function change() {
  play('tap')
  phase.value = 'setup'
}

// ── pictures ────────────────────────────────────────────────────────────────────────────────────────────────────
/** The picture of a stage (small, beside its title) when the adventure has one. */
function thumb(title: string): string {
  const stage = journeys.find((j) => j.title === round.value?.journey)?.stages.find((s) => s.title?.trim() === title)
  return stage?.image ? prependBaseUrl(stage.image) : ''
}
const seal = (n: number) => prependBaseUrl(`images/familie/karte/siegel-${n}.webp`)
const sealGone = reactive<Record<number, boolean>>({})
function hide(e: Event) {
  ;(e.target as HTMLElement).style.display = 'none'
}
</script>

<template lang="pug">
  MapTable(:title="t('app.order.title')" @back="goBack")
    //- ===== Plus ====================================================================================================
    div(v-if="locked" class="fo-stack")
      MapPaper(kind="card")
        p(class="fo-text") {{ t('app.order.locked') }}
      MapButton(@click="showUpsell('family')") {{ t('app.family.lockedButton') }}

    //- ===== setup: the seats, the coins, the adventure =============================================================
    div(v-else-if="phase === 'setup'" class="fo-setup")
      div(v-if="kept" class="fo-resume")
        MapResume(:info="keptInfo" @resume="resume")
      p(class="fo-sub") {{ t('app.order.sub') }}
      div(class="fo-part")
        MapSeats(v-model:count="playerCount" v-model:names="names" :max="MAX_PLAYERS" :question="t('app.order.howMany')")
      div(class="fo-part")
        div(class="fo-duo")
          section(class="fo-sec")
            h2(class="fo-h") {{ t('app.order.count') }}
            div(class="fo-marks" role="radiogroup")
              button(v-for="n in ORDER_COUNTS" :key="n" type="button" role="radio" :aria-checked="count === n" :class="['fo-mark', { 'is-on': count === n }]" @click="count = n; play('tap')") {{ n }}
          section(class="fo-sec")
            h2(class="fo-h") {{ t('app.order.rounds') }}
            div(class="fo-marks" role="radiogroup")
              button(v-for="r in ORDER_ROUND_CHOICES" :key="r" type="button" role="radio" :aria-checked="rounds === r" :class="['fo-mark', { 'is-on': rounds === r }]" @click="rounds = r; play('tap')") {{ r }}
        section(class="fo-sec")
          h2(class="fo-h") {{ t('app.order.from') }}
          MapPaper(kind="strip")
            select(v-model="only" class="fo-select" :aria-label="t('app.order.from')")
              option(value="") {{ t('app.family.eveningAll') }}
              option(v-for="j in journeyOptions" :key="j" :value="j") {{ j }}
            span(class="fo-caret" aria-hidden="true") ▾
        p(class="fo-note") {{ t('app.order.rule') }}
        div(class="fo-go")
          MapButton(:disabled="!canStart" @click="play('button'); start()") {{ t('app.family.start') }}

    //- ===== whose turn =============================================================================================
    div(v-else-if="phase === 'handover'" class="fo-stack")
      p(class="fo-count") {{ t('app.order.turnOf', { n: turn + 1, total: totalTurns }) }}
      MapToken(:index="who" :size="92" lit class="fo-hero")
      h2(class="fo-big") {{ t('app.family.turn', { name: whoName }) }}
      p(v-if="playerCount > 1" class="fo-note") {{ t('app.order.handover') }}
      MapRoute(v-if="playerCount > 1" :players="routePlayers" :max="routeMax" class="fo-wide")
      MapButton(@click="go") {{ t('app.order.show') }}

    //- ===== bring the strips in order ==============================================================================
    div(v-else-if="phase === 'play'" class="fo-play")
      div(class="fo-head")
        MapScoreBar(:players="scorePlayers")
        p(class="fo-who") {{ whoName }} · {{ t('app.family.fromAdventure', { name: round?.journey ?? '' }) }}
        p(v-if="!done" class="fo-task") {{ t('app.order.task') }}
      div(class="fo-board")
        ol(class="fo-route" :aria-label="t('app.order.yours')")
          li(v-for="(title, i) in round?.titles ?? []" :key="i" :class="['fo-slot', { 'is-full': i < picked.length, 'is-missed': i < picked.length && missed[i] }]")
            span(class="fo-seal")
              template(v-if="i < picked.length")
                img(v-if="!sealGone[missed[i] ? 4 : 1]" :src="seal(missed[i] ? 4 : 1)" alt="" draggable="false" @error="sealGone[missed[i] ? 4 : 1] = true")
                span(v-else class="fo-seal-fallback")
              span(class="fo-seal-n") {{ i + 1 }}
            Transition(name="fo-land")
              MapPaper(v-if="i < picked.length" kind="strip" :lit="!done && i === picked.length - 1" class="fo-placed")
                img(v-if="thumb(picked[i] ?? '')" :src="thumb(picked[i] ?? '')" alt="" class="fo-thumb" loading="lazy" draggable="false" @error="hide")
                span(class="fo-card-t") {{ picked[i] }}
              span(v-else class="fo-empty" aria-hidden="true")
        div(class="fo-side")
          TransitionGroup(v-if="!done" name="fo-pile" tag="div" class="fo-pile")
            button(
              v-for="x in left"
              :key="x"
              type="button"
              :class="['fo-card', { 'is-wobble': wobble === x, 'is-tried': tried.includes(x) }]"
              @click="pick(x)"
            )
              MapPaper(kind="strip" :dim="tried.includes(x)")
                img(v-if="thumb(x)" :src="thumb(x)" alt="" class="fo-thumb" loading="lazy" draggable="false" @error="hide")
                span(class="fo-card-t") {{ x }}
          div(v-else class="fo-done")
            h2(class="fo-big") {{ result?.all ? t('app.order.allRight') : t('app.order.someRight', { n: result?.right ?? 0, total: round?.titles.length ?? 0 }) }}
            p(class="fo-note") {{ t('app.order.gotPoints', { name: whoName, points: t('app.family.points', result?.points ?? 0) }) }}
            MapButton(@click="next") {{ isLast ? t('app.family.result') : t('app.order.nextTurn') }}

    //- ===== the end ================================================================================================
    div(v-else class="fo-stack")
      MapResult(:headline="headline" :rows="rows" :winner-index="winners[0]?.index")
        MapButton(@click="again") {{ t('app.family.again') }}
        MapButton(quiet @click="change") {{ t('app.activity.change') }}
</template>

<style scoped lang="sass">
$ink: #3a2812
$light: #f6ead0
$shade: 0 1px 4px rgba(0, 0, 0, 0.95), 0 0 10px rgba(0, 0, 0, 0.6)

.fo-stack
  display: flex
  flex-direction: column
  align-items: center
  gap: 14px
  width: 100%
  max-width: 28rem
  margin: 0 auto
  padding-top: 8px
  text-align: center

.fo-text
  margin: 0
  line-height: 1.4

.fo-sub, .fo-note, .fo-count
  margin: 0
  text-align: center
  color: $light
  text-shadow: $shade
  line-height: 1.35

.fo-sub
  font-size: 1.1rem
  font-style: italic

.fo-note
  font-size: 1rem

.fo-count
  font-size: 0.95rem
  letter-spacing: 0.12em
  text-transform: uppercase

.fo-big
  margin: 0
  font-size: 1.7rem
  font-weight: 800
  line-height: 1.15
  text-align: center
  color: $light
  text-shadow: $shade

.fo-wide
  width: 100%

.fo-hero
  margin: 8px 0 2px

// ── setup ──
.fo-setup
  display: flex
  flex-direction: column
  gap: 14px
  width: 100%
  max-width: 30rem
  margin: 0 auto
  padding-top: 4px

.fo-part
  display: flex
  flex-direction: column
  gap: 12px

.fo-sec
  display: flex
  flex-direction: column
  gap: 8px

.fo-h
  margin: 0
  font-size: 1.15rem
  font-weight: 800
  text-align: center
  color: $light
  text-shadow: $shade

.fo-duo
  display: grid
  grid-template-columns: repeat(2, minmax(0, 1fr))
  gap: 10px
  align-items: start

  .fo-h
    font-size: 1rem
    line-height: 1.15

.fo-marks
  display: flex
  justify-content: center
  gap: 9px

// a brass mark: a round plate of bronze with the number
.fo-mark
  display: grid
  place-items: center
  width: 50px
  height: 50px
  padding: 0 0 2px
  border-radius: 50%
  border: 2px solid #9a6b1c
  background: radial-gradient(circle at 38% 30%, #fffbeb, #ecd596 80%)
  box-shadow: 0 0 0 2px rgba(255, 246, 214, 0.92), 0 4px 8px rgba(60, 35, 5, 0.45), inset 0 1px 0 #ffffff
  color: #3a2812
  font-family: var(--mp-serif, Georgia, serif)
  font-size: 1.4rem
  font-weight: 800
  text-shadow: none
  cursor: pointer
  transition: transform 0.2s, filter 0.2s, box-shadow 0.2s
  -webkit-tap-highlight-color: transparent

  &.is-on
    transform: translateY(-3px) scale(1.08)
    border-color: #ffe9a8
    box-shadow: 0 0 0 3px rgba(255, 246, 214, 0.95), 0 0 16px rgba(255, 200, 70, 0.85), 0 4px 8px rgba(60, 35, 5, 0.45), inset 0 1px 0 #fffbe0

.fo-select
  flex: 1
  min-width: 0
  height: 40px
  border: 0
  background: transparent
  color: $ink
  font: inherit
  font-size: 1.1rem
  font-weight: 700
  appearance: none
  -webkit-appearance: none
  outline: none
  cursor: pointer
  text-overflow: ellipsis

  option
    color: $ink
    background: #f3e6c6

.fo-caret
  flex: none
  margin-left: 6px
  color: $ink
  font-size: 1.1rem
  pointer-events: none

.fo-go
  display: flex
  justify-content: center
  padding-top: 6px

@media (orientation: landscape)
  .fo-resume
    grid-column: 1 / -1

  .fo-setup
    display: grid
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr)
    max-width: 52rem
    gap: 6px 22px
    align-items: start

  .fo-sub
    display: none

  .fo-part
    gap: 8px

  .fo-go
    padding-top: 0

// ── the game ──
.fo-play
  display: flex
  flex-direction: column
  gap: 8px
  width: 100%
  max-width: 34rem
  margin: 0 auto

.fo-head
  display: flex
  flex-direction: column
  align-items: center
  gap: 6px

.fo-who
  margin: 0
  font-size: 1.05rem
  font-weight: 700
  text-align: center
  color: $light
  text-shadow: $shade

.fo-task
  margin: 0
  font-size: 0.95rem
  font-style: italic
  text-align: center
  color: $light
  text-shadow: $shade

.fo-board
  display: flex
  flex-direction: column
  gap: 12px

// the route: a dotted line over the map, a wax seal for every stop, a strip beside it
.fo-route
  position: relative
  margin: 0
  padding: 0
  list-style: none
  display: flex
  flex-direction: column
  gap: 6px

  &::before
    content: ''
    position: absolute
    left: 21px
    top: 20px
    bottom: 20px
    border-left: 4px dotted rgba(58, 40, 18, 0.9)
    filter: drop-shadow(0 1px 0 rgba(255, 240, 200, 0.5))

.fo-slot
  position: relative
  display: grid
  grid-template-columns: 46px minmax(0, 1fr)
  align-items: center
  gap: 8px
  min-height: 36px
  transition: min-height 0.3s ease

  &.is-full
    min-height: 54px

.fo-seal
  position: relative
  display: grid
  place-items: center
  width: 44px
  height: 44px
  justify-self: center
  border-radius: 50%
  border: 2px dashed rgba(246, 234, 208, 0.55)
  background: rgba(28, 19, 10, 0.55)
  color: rgba(246, 234, 208, 0.6)
  font-family: var(--mp-serif, Georgia, serif)
  font-size: 1.05rem
  font-weight: 700
  transform: scale(0.8)
  transition: transform 0.3s ease

  img
    position: absolute
    inset: -8%
    width: 116%
    height: 116%
    object-fit: contain
    filter: drop-shadow(0 3px 3px rgba(10, 5, 0, 0.6))

.fo-seal-fallback
  position: absolute
  inset: -2px
  border-radius: 50%
  background: radial-gradient(circle at 35% 30%, #c0493c, #8c2a22 70%, #5e1a14)
  box-shadow: 0 3px 4px rgba(10, 5, 0, 0.6)

.fo-seal-n
  position: relative
  z-index: 1

.is-full .fo-seal
  transform: scale(1)
  border: 0
  background: transparent
  color: #fbe9c4
  font-size: 1.3rem
  font-weight: 800
  text-shadow: 0 1px 2px rgba(40, 8, 4, 0.9)

.is-missed .fo-seal
  opacity: 0.72

  .fo-seal-fallback
    background: radial-gradient(circle at 35% 30%, #c9a24a, #8a6a24 70%, #5a4214)

.fo-empty
  display: block
  height: 34px
  border-radius: 8px
  border: 2px dashed rgba(58, 40, 18, 0.45)
  background: rgba(246, 234, 208, 0.18)

.fo-placed
  min-width: 0

.fo-play
  :deep(.mpa--strip)
    min-height: 48px

  :deep(.mpa--strip .mpa-in)
    justify-content: flex-start
    gap: 8px
    min-height: 48px
    padding-top: 4px
    padding-bottom: 4px
    text-align: left

.fo-card-t
  min-width: 0
  font-size: 1.1rem
  font-weight: 700
  line-height: 1.2
  overflow-wrap: anywhere

.fo-thumb
  flex: none
  width: 54px
  height: 36px
  border-radius: 4px
  object-fit: cover
  box-shadow: 0 1px 3px rgba(40, 24, 6, 0.6), 0 0 0 1px rgba(58, 40, 18, 0.45)

// the strips that are still on the table
.fo-side
  position: relative
  min-width: 0

.fo-pile
  position: relative
  display: flex
  flex-direction: column
  gap: 8px

.fo-card
  display: block
  width: 100%
  padding: 0
  border: 0
  background: transparent
  font: inherit
  text-align: left
  cursor: pointer
  -webkit-tap-highlight-color: transparent
  transition: transform 0.15s

  &:active
    transform: scale(0.985)

  &.is-tried
    transform: scale(0.97)

  &.is-wobble
    animation: fo-wobble 0.5s ease

.fo-done
  display: flex
  flex-direction: column
  align-items: center
  gap: 12px
  padding-top: 6px

@keyframes fo-wobble
  0%, 100%
    transform: translateX(0) rotate(0)
  18%
    transform: translateX(-7px) rotate(-1.5deg)
  38%
    transform: translateX(6px) rotate(1.2deg)
  58%
    transform: translateX(-4px) rotate(-0.8deg)
  78%
    transform: translateX(2px) rotate(0.4deg)

// a right strip leaves the pile and settles on the route
.fo-pile-leave-active
  position: absolute
  left: 0
  right: 0
  transition: opacity 0.3s, transform 0.3s

.fo-pile-leave-to
  opacity: 0
  transform: translateY(-24px) scale(0.96)

.fo-pile-move
  transition: transform 0.35s ease

.fo-land-enter-active
  transition: opacity 0.35s ease, transform 0.4s cubic-bezier(0.3, 1.4, 0.5, 1)

.fo-land-enter-from
  opacity: 0
  transform: translateY(26px) scale(0.94)

// turned phone: the route on the left, the strips on the right
@media (orientation: landscape)
  .fo-play
    max-width: 56rem
    gap: 4px

  .fo-head
    flex-direction: row
    flex-wrap: wrap
    justify-content: center
    gap: 4px 16px

  .fo-task
    display: none

  .fo-board
    display: grid
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr)
    gap: 20px
    align-items: start

@media (prefers-reduced-motion: reduce)
  .fo-card.is-wobble
    animation: none
</style>
