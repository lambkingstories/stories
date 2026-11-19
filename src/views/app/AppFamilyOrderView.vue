<script setup lang="ts">
/**
 * The order race (Plus), in the light look of "Familien-Spiele v2": a few stages of one adventure lie mixed up as white cards (their titles), and
 * the person on turn taps them in the order in which they happen in the story. A card that is right travels onto a dotted route and gets a round
 * badge with its number; a wrong one wobbles for a moment. One point for every place that was right at the first try, and a bonus for the whole
 * row (`scoreOrder`, unchanged). One device is passed around (or one person plays alone). The right order is the order of the stages in the
 * adventure, so nothing is made up.
 * The course of a real game: the title screen (`start`), the players page (`lobby`: who plays, how many stations, how many turns, which
 * adventure), the game (`handover` "whose turn", `play`; the bar of the game in its colour) and the end (`result`: podium).
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import MapTable from '@/components/molecules/map/MapTable.vue'
import { goBackTo } from '@/utils/navBack'
import MapToken from '@/components/molecules/map/MapToken.vue'
import MapRoute from '@/components/molecules/map/MapRoute.vue'
import FamilyCard from '@/components/molecules/family/FamilyCard.vue'
import FamilyButton from '@/components/molecules/family/FamilyButton.vue'
import FamilyChip from '@/components/molecules/family/FamilyChip.vue'
import FamilyStart from '@/components/molecules/family/FamilyStart.vue'
import FamilyLobby from '@/components/molecules/family/FamilyLobby.vue'
import FamilyGameBar from '@/components/molecules/family/FamilyGameBar.vue'
import FamilyPodium, { type FamilyPodiumRow } from '@/components/molecules/family/FamilyPodium.vue'
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

/** The arrow of the table: the players page and the end lead to the title screen, the title screen leads to the games. A running round has its own button (the bar of the game asks first). */
function goBack() {
  if (phase.value === 'lobby' || phase.value === 'result') {
    phase.value = 'start'
    return
  }
  goBackTo(router, { name: 'app-family' })
}

/** Leaving a running round (the bar of the game asked first): to the title screen, the round stays kept ("Continue"). */
function toStart() {
  clearTimeout(wobbleTimer)
  wobble.value = null
  phase.value = 'start'
}

/** "To the games": from the end back to the page of the family games. */
function toGames() {
  goBackTo(router, { name: 'app-family' })
}

const locked = computed(() => PREMIUM_TEASER && !hasFeature('family'))
const NAMES_KEY = 'lk-family-names'

// ── players page ────────────────────────────────────────────────────────────────────────────────────────────────
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

/** The lobby hands over the changed names (always all eight places). */
function setNames(next: string[]) {
  names.value = Array.from({ length: MAX_PLAYERS }, (_, i) => next[i] ?? '')
}

const nameOf = (i: number) => names.value[i]?.trim() || t('app.family.player', { n: i + 1 })
const players = computed(() => Array.from({ length: playerCount.value }, (_, i) => nameOf(i)))
const journeyOptions = computed(() => orderJourneys(journeys, count.value))
const canStart = computed(() => journeyOptions.value.length > 0 && (!only.value || journeyOptions.value.includes(only.value)))
const totalTurns = computed(() => playerCount.value * rounds.value)

function pickCount(n: number) {
  count.value = n
  play('tap')
}
function pickRounds(r: number) {
  rounds.value = r
  play('tap')
}

// ── the game ────────────────────────────────────────────────────────────────────────────────────────────────────
/** The course: title screen, players page, whose turn, a row, the end. */
type Phase = 'start' | 'lobby' | 'handover' | 'play' | 'result'
const phase = ref<Phase>('start')
const playing = computed(() => phase.value === 'handover' || phase.value === 'play')
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

/** The chips in the bar of the game: figure, name and points of everybody; the one on turn shines. */
const barPlayers = computed(() => players.value.map((name, i) => ({ name, score: scores.value[i] ?? 0, index: i, turn: i === who.value })))
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
const rows = computed<FamilyPodiumRow[]>(() => placing.value.map((p) => ({ rank: p.rank, name: p.name, score: t('app.family.points', p.score), index: p.index })))
/** The lines of "How to play": what the race does anyway. */
const rules = computed(() => [t('app.bigGames.orderFlow.ruleMix'), t('app.order.task'), t('app.bigGames.orderFlow.ruleWrong'), t('app.order.rule'), t('app.bigGames.orderFlow.ruleTurns')])

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
const keptInfo = computed(() => (!locked.value && kept.value ? t('app.order.turnOf', { n: kept.value.turn + 1, total: kept.value.playerCount * kept.value.rounds }) : ''))

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

/** "New round with other players": back to the players page. */
function change() {
  play('tap')
  phase.value = 'lobby'
}

/** "Play": to the players page (without Plus it opens the sheet of Plus). */
function onPlay() {
  if (locked.value) {
    showUpsell('family')
    return
  }
  phase.value = 'lobby'
}

// ── pictures ────────────────────────────────────────────────────────────────────────────────────────────────────
/** A picture that cannot be loaded is left out (the title stays, in the middle). */
const gone = reactive<Record<string, boolean>>({})
/** The picture of a stage (small, beside its title) when the adventure has one. */
function thumb(title: string): string {
  const stage = journeys.find((j) => j.title === round.value?.journey)?.stages.find((s) => s.title?.trim() === title)
  const src = stage?.image ? prependBaseUrl(stage.image) : ''
  return src && !gone[src] ? src : ''
}
function hide(e: Event) {
  const el = e.target
  if (el instanceof HTMLImageElement) gone[el.getAttribute('src') ?? ''] = true
}
</script>

<template lang="pug">
  MapTable(title="" game="order" @back="goBack")
    //- ===== the bar of the game (while a round runs): the colour of the game, the people with their points, leaving asks first =====
    template(v-if="playing" v-slot:top)
      FamilyGameBar(
        game="order"
        :title="t('app.family.hub_order')"
        :subtitle="t('app.order.turnOf', { n: turn + 1, total: totalTurns })"
        :players="barPlayers"
        :leave-text="t('app.bigGames.familyFlow.leaveKept')"
        @leave="toStart"
      )

    div(class="fo")
      //- ===== 1. the title screen (without Plus: "Play" opens the sheet of Plus, the note says why) =====
      FamilyStart(
        v-if="phase === 'start'"
        game="order"
        :name="t('app.family.hub_order')"
        :tagline="t('app.family.hub_orderSub')"
        :rules="rules"
        :resume-info="keptInfo"
        @play="onPlay"
        @resume="resume"
      )
        template(v-if="locked" v-slot:extra)
          FamilyCard(compact class="fo-lock")
            span(class="fo-fine") {{ t('app.order.locked') }}
            FamilyButton(quiet @click="showUpsell('family')") {{ t('app.family.lockedButton') }}

      //- ===== 2. who plays, and the settings of the race =====
      FamilyLobby(
        v-else-if="phase === 'lobby'"
        game="order"
        :count="playerCount"
        :names="names"
        :min="1"
        :max="MAX_PLAYERS"
        :can-go="canStart"
        @update:count="playerCount = $event"
        @update:names="setNames"
        @go="start"
      )
        template(v-slot:settings)
          //- how many stations
          FamilyCard(:title="t('app.order.count')" symbol="order")
            div(class="fo-marks" role="radiogroup" :aria-label="t('app.order.count')")
              FamilyChip(v-for="n in ORDER_COUNTS" :key="n" round :selected="count === n" @click="pickCount(n)") {{ n }}

          //- how many turns for everybody
          FamilyCard(:title="t('app.order.rounds')")
            div(class="fo-marks" role="radiogroup" :aria-label="t('app.order.rounds')")
              FamilyChip(v-for="r in ORDER_ROUND_CHOICES" :key="r" round :selected="rounds === r" @click="pickRounds(r)") {{ r }}

          //- from which adventure
          FamilyCard(:title="t('app.order.from')")
            span(class="fo-field")
              select(v-model="only" class="fo-select" :aria-label="t('app.order.from')")
                option(value="") {{ t('app.family.eveningAll') }}
                option(v-for="j in journeyOptions" :key="j" :value="j") {{ j }}
              span(class="fo-caret" aria-hidden="true")

          FamilyCard(compact)
            span(class="fo-fine") {{ t('app.order.rule') }}

      //- ===== 3a. whose turn =====
      div(v-else-if="phase === 'handover'" class="fo-hand")
        FamilyCard(class="fo-handcard")
          MapToken(:index="who" :size="104" lit)
          h2(class="fo-big") {{ t('app.family.turn', { name: whoName }) }}
          p(v-if="playerCount > 1" class="fo-fine") {{ t('app.order.handover', { name: whoName }) }}
        MapRoute(v-if="playerCount > 1" :players="routePlayers" :max="routeMax" class="fo-wide")
        FamilyButton(class="fo-show" @click="go") {{ t('app.order.show') }}

      //- ===== 3b. bring the cards in order =====
      div(v-else-if="phase === 'play'" class="fo-play")
        div(class="fo-meta")
          p(class="fo-turn")
            MapToken(:index="who" :size="38" lit)
            span {{ t('app.family.turn', { name: whoName }) }}
          p(class="fo-chip") {{ t('app.family.fromAdventure', { name: round?.journey ?? '' }) }}
          p(v-if="!done" class="fo-task") {{ t('app.order.task') }}
        div(class="fo-board")
          FamilyCard(compact class="fo-routecard")
            ol(class="fo-route" :aria-label="t('app.order.yours')")
              li(v-for="(title, i) in round?.titles ?? []" :key="i" :class="['fo-slot', { 'is-full': i < picked.length, 'is-missed': i < picked.length && missed[i], 'is-last': !done && i === picked.length - 1 }]")
                span(class="fo-badge" :aria-label="t('app.bigGames.familyFlow.place', { n: i + 1 })") {{ i + 1 }}
                Transition(name="fo-land")
                  div(v-if="i < picked.length" :class="['fo-placed', { 'has-pic': !!thumb(picked[i] ?? '') }]")
                    img(v-if="thumb(picked[i] ?? '')" :src="thumb(picked[i] ?? '')" alt="" class="fo-thumb" loading="lazy" draggable="false" @error="hide")
                    span(class="fo-card-t") {{ picked[i] }}
                  span(v-else class="fo-empty" aria-hidden="true")
          div(class="fo-side")
            TransitionGroup(v-if="!done" name="fo-pile" tag="div" class="fo-pile")
              button(
                v-for="x in left"
                :key="x"
                type="button"
                :class="['fo-card', { 'is-wobble': wobble === x, 'is-tried': tried.includes(x), 'has-pic': !!thumb(x) }]"
                @click="pick(x)"
              )
                img(v-if="thumb(x)" :src="thumb(x)" alt="" class="fo-thumb" loading="lazy" draggable="false" @error="hide")
                span(class="fo-card-t") {{ x }}
            FamilyCard(v-else class="fo-done" :tone="result?.all ? 'right' : 'lit'")
              h2(class="fo-big" role="status") {{ result?.all ? t('app.order.allRight') : t('app.order.someRight', { n: result?.right ?? 0, total: round?.titles.length ?? 0 }) }}
              p(class="fo-fine") {{ t('app.order.gotPoints', { name: whoName, points: t('app.family.points', result?.points ?? 0) }) }}
              FamilyButton(@click="next") {{ isLast ? t('app.family.result') : t('app.order.nextTurn') }}

      //- ===== 4. the end: the podium =====
      FamilyPodium(
        v-else
        game="order"
        :headline="headline"
        :rows="rows"
        :winner-index="winners[0]?.index"
        @again="again"
        @change="change"
        @exit="toGames"
      )
</template>

<style scoped lang="sass">
.fo
  display: flex
  flex-direction: column
  gap: 16px
  min-height: 100%
  max-width: 36rem
  margin: 0 auto
  padding: 6px 0 24px

.fo-fine
  display: block
  width: 100%
  color: var(--fam-muted)
  text-align: center
  font-size: 1.02rem
  font-weight: 600
  line-height: 1.35

.fo-big
  margin: 0
  color: var(--fam-ink)
  font-size: 1.6rem
  font-weight: 800
  line-height: 1.15
  text-align: center

.fo-lock
  max-width: 24rem

// ── the players page ──
.fo-marks
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 14px
  padding-top: 4px

.fo-field
  position: relative
  display: block
  width: 100%

.fo-select
  box-sizing: border-box
  width: 100%
  min-height: 48px
  padding: 6px 44px 6px 16px
  border: 2px solid var(--fam-line-strong)
  border-radius: var(--fam-r-field)
  background: var(--fam-field)
  color: var(--fam-ink)
  font: inherit
  font-size: 1.1rem
  font-weight: 700
  text-align: center
  text-align-last: center
  text-overflow: ellipsis
  appearance: none
  -webkit-appearance: none
  cursor: pointer

  &:focus-visible
    outline: 3px solid var(--fam-focus)
    outline-offset: 2px

  option
    background: var(--fam-card)
    color: var(--fam-ink)

// the little arrow of the field (drawn by its borders)
.fo-caret
  position: absolute
  right: 18px
  top: 50%
  width: 9px
  height: 9px
  margin-top: -7px
  border: solid var(--fam-primary-ink)
  border-width: 0 3px 3px 0
  transform: rotate(45deg)
  pointer-events: none

// ── whose turn ──
.fo-hand
  display: flex
  flex-direction: column
  align-items: center
  gap: 16px
  margin: auto 0
  width: 100%

.fo-handcard
  max-width: 24rem

.fo-wide
  width: 100%

// ── the game ──
.fo-play
  display: flex
  flex-direction: column
  gap: 12px
  width: 100%

.fo-meta
  display: flex
  flex-direction: column
  align-items: center
  gap: 6px

.fo-turn
  display: flex
  align-items: center
  justify-content: center
  gap: 10px
  margin: 2px 0 0
  color: var(--fam-ink)
  font-size: 1.3rem
  font-weight: 800

.fo-chip
  margin: 0
  padding: 6px 18px
  border: 1.5px solid var(--fam-gold)
  border-radius: 999px
  background: color-mix(in srgb, var(--fam-gold) 22%, var(--fam-card))
  color: var(--fam-ink)
  font-size: 0.98rem
  font-weight: 800
  line-height: 1.2
  text-align: center

.fo-task
  max-width: 28rem
  margin: 0
  color: var(--fam-muted)
  font-size: 0.98rem
  font-weight: 600
  line-height: 1.35
  text-align: center

.fo-board
  display: flex
  flex-direction: column
  gap: 14px

// the route: a dotted line, a round badge with the number for every stop, a card beside it
.fo-route
  position: relative
  display: flex
  flex-direction: column
  gap: 8px
  width: 100%
  margin: 0
  padding: 0
  list-style: none

  &::before
    content: ''
    position: absolute
    left: 21px
    top: 20px
    bottom: 20px
    border-left: 3px dotted var(--fam-line-strong)

.fo-slot
  position: relative
  display: grid
  grid-template-columns: 44px minmax(0, 1fr)
  align-items: center
  gap: 10px
  min-height: 44px

.fo-badge
  position: relative
  z-index: 1
  display: grid
  place-items: center
  width: 40px
  height: 40px
  justify-self: center
  border: 2px dashed var(--fam-line-strong)
  border-radius: 50%
  background: var(--fam-card)
  color: var(--fam-muted)
  font-size: 1.1rem
  font-weight: 800

.is-full .fo-badge
  border: 2px solid var(--fam-primary)
  background: var(--fam-primary)
  color: var(--fam-on-primary)

// a place that was not right at the first try: a gold badge (and one point less)
.is-missed .fo-badge
  border-color: var(--fam-gold-deep)
  background: var(--fam-gold)
  color: var(--fam-on-gold)

.is-last .fo-badge
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--fam-gold) 45%, transparent)

.fo-empty
  display: block
  height: 40px
  border: 2px dashed var(--fam-line)
  border-radius: 14px
  background: color-mix(in srgb, var(--fam-field) 60%, transparent)

.fo-placed,
.fo-card
  box-sizing: border-box
  display: flex
  align-items: center
  justify-content: center
  gap: 10px
  min-width: 0
  min-height: 52px
  padding: 6px 12px
  border: 1.5px solid var(--fam-line-strong)
  border-radius: 16px
  background: var(--fam-card)
  box-shadow: var(--fam-shadow)
  color: var(--fam-ink)
  text-align: center

// a placed card: calm, with a teal edge at the left (it is on its place)
.fo-placed
  border-left: 5px solid var(--fam-primary)

.is-missed .fo-placed
  border-left-color: var(--fam-gold)

.fo-card-t
  min-width: 0
  font-size: 1.08rem
  font-weight: 700
  line-height: 1.2
  overflow-wrap: anywhere

.fo-thumb
  flex: none
  width: 54px
  height: 36px
  border-radius: 8px
  object-fit: cover
  box-shadow: 0 0 0 1px var(--fam-line)

// with a picture the title stays in the true middle (the same room left and right of it)
.fo-placed.has-pic,
.fo-card.has-pic
  display: grid
  grid-template-columns: 54px minmax(0, 1fr) 54px

// the cards that are still on the table
.fo-side
  position: relative
  min-width: 0

.fo-pile
  position: relative
  display: flex
  flex-direction: column
  gap: 10px

.fo-card
  position: relative
  width: 100%
  min-height: 56px
  padding: 8px 14px
  // the colour of the game as a small stripe on top
  border-top: 4px solid var(--fam-accent)
  font: inherit
  cursor: pointer
  touch-action: manipulation
  -webkit-tap-highlight-color: transparent
  transition: transform 0.15s, opacity 0.2s

  &:focus-visible
    outline: 3px solid var(--fam-focus)
    outline-offset: 2px

  &:active
    transform: scale(0.985)

  // a wrong card rests (and says so with a cross, not only with its colour)
  &.is-tried
    opacity: 0.6
    transform: scale(0.97)

    &::after
      content: '×'
      position: absolute
      top: 4px
      right: 8px
      display: grid
      place-items: center
      width: 20px
      height: 20px
      border-radius: 50%
      background: var(--fam-bad)
      color: var(--fam-on-accent)
      font-size: 1rem
      font-weight: 800
      line-height: 1

.fo-done
  max-width: 28rem
  margin: 0 auto

// ── sideways: the route on the left, the cards on the right ──
@media (orientation: landscape)
  .fo
    max-width: 62rem
    gap: 12px

  .fo-play
    gap: 8px

  .fo-meta
    flex-direction: row
    flex-wrap: wrap
    justify-content: center
    gap: 4px 16px

  .fo-task
    display: none

  .fo-board
    display: grid
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr)
    gap: 16px
    align-items: start

  // the route has to fit next to the cards on a phone held wide
  .fo-route
    gap: 5px

    &::before
      left: 19px
      top: 17px
      bottom: 17px

  .fo-slot
    grid-template-columns: 40px minmax(0, 1fr)
    min-height: 40px

  .fo-badge
    width: 34px
    height: 34px
    font-size: 1rem

  .fo-empty
    height: 34px

  .fo-placed
    min-height: 44px
    padding-top: 3px
    padding-bottom: 3px

  .fo-hand
    display: grid
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr)
    grid-template-areas: 'card route' 'show route'
    gap: 12px 20px
    align-items: center

  .fo-handcard
    grid-area: card
    max-width: none

  .fo-wide
    grid-area: route

  .fo-show
    grid-area: show
    justify-self: center

// ── movement only for those who do not ask for less ──
@media (prefers-reduced-motion: no-preference)
  .fo-card.is-wobble
    animation: fo-wobble 0.5s ease

  // a right card leaves the pile and settles on the route
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
</style>
