<script setup lang="ts">
/**
 * Bible bingo (Plus), in the light look of "Familien-Spiele v2": every player has a card with sixteen people of the Bible, one person after the
 * other is called (by name, or, harder, by three hints), and whoever has the person on the card ticks it. Whoever has a whole row, column or
 * diagonal calls "Bingo".
 * Two ways to play, both without any connection between the devices:
 *  - `table`: one person reads aloud on one device (the host: the name, or the hints one by one) and plays with their own card on that
 *    device, too; the others have their cards on their own devices.
 *  - `code`: no host. A round code gives every phone the same order of people; everybody taps "Go" together, and every phone calls the
 *    people by itself, by its own clock (a new person every 20 seconds, or hints every 10 seconds). Bingo is checked on the phone against
 *    the people that were called by then.
 * The people and their hints are in `data/whoAmI.ts`.
 * The course of a real game: the title screen (`start`), the page of the person on this phone (`lobby`: figure, name, the way, the level, "I read
 * aloud" / "I play" or the round code), the game (`host`, `card`, `ready`, `live`; the bar of the game in its colour) and the end (`won`, `over`).
 * Every phone is one person, so the players page has one card; the others play on their own phones.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import MapTable from '@/components/molecules/map/MapTable.vue'
import { goBackToOrigin } from '@/utils/navBack'
import FamilyCard from '@/components/molecules/family/FamilyCard.vue'
import FamilyButton from '@/components/molecules/family/FamilyButton.vue'
import FamilyChip from '@/components/molecules/family/FamilyChip.vue'
import FamilyNameField from '@/components/molecules/family/FamilyNameField.vue'
import FamilyQuestionCard from '@/components/molecules/family/FamilyQuestionCard.vue'
import FamilyStart from '@/components/molecules/family/FamilyStart.vue'
import FamilyLobby from '@/components/molecules/family/FamilyLobby.vue'
import FamilyGameBar from '@/components/molecules/family/FamilyGameBar.vue'
import FamilyPodium from '@/components/molecules/family/FamilyPodium.vue'
import BingoGrid from '@/components/molecules/BingoGrid.vue'
import { PREMIUM_TEASER, hasFeature, showUpsell } from '@/use/usePremium'
import { WHO_PEOPLE } from '@/data/whoAmI'
import type { ActivityLocale } from '@/data/activityWords'
import { BINGO_CELLS, drawOrder, hasBingo, isTrueBingo, liveIsOver, makeCard, parseBingoSnap, type BingoSnap } from '@/utils/bibleBingo'
import { mulberry32, newCode, readCode, showCode } from '@/utils/familyCode'
import useFamilySave from '@/use/useFamilySave'
import useLandscapePlay from '@/use/useLandscapePlay'
import useSfx from '@/use/useSfx'
import useUserName from '@/use/useUserName'

const { t, locale } = useI18n({ useScope: 'global' })
const router = useRouter()
const { play } = useSfx()
const { displayName, hasCustomName } = useUserName()
const save = useFamilySave<BingoSnap>('bingo', 1)
// a kept round of another shape (older app) is thrown away at once
if (save.saved.value && !parseBingoSnap(save.saved.value)) save.clear()

/** The arrow of the table: the page of the person and the end lead to the title screen, the title screen leads to the games. A running round has its own button (the bar of the game asks first). */
function goBack() {
  if (phase.value === 'lobby' || phase.value === 'won' || phase.value === 'over') {
    phase.value = 'start'
    return
  }
  goBackToOrigin(router, { name: 'app-family' })
}

/** Leaving a running round (the bar of the game asked first): the clock stops here, the round stays kept ("Continue"). */
function toStart() {
  stopTimer()
  phase.value = 'start'
}

/** "To the games": from the end back to the page of the family games. */
function toGames() {
  goBackToOrigin(router, { name: 'app-family' })
}

const locked = computed(() => PREMIUM_TEASER && !hasFeature('family'))
const { full, canTurn, toggle: rotate } = useLandscapePlay()
const lang = computed<ActivityLocale>(() => (locale.value.startsWith('en') ? 'en' : locale.value.startsWith('es') ? 'es' : 'de'))
const nameOf = (i: number) => WHO_PEOPLE[i]!.name[lang.value]
const factsOf = (i: number) => WHO_PEOPLE[i]!.facts[lang.value]

type Way = 'table' | 'code'
type Level = 'name' | 'hints'
const WAYS: Way[] = ['table', 'code']
const LEVELS: Level[] = ['name', 'hints']

/** Time per person in the code game: the name every 20 seconds, or three hints 10 seconds apart and the name 10 seconds after the last. */
const NAME_PERIOD = 20000
const HINT_STEP = 10000
const HINTS_PERIOD = 40000

/** The check character of a round code also tells the level (so a phone with the other level still reads the code and takes its level). */
const sizeFor = (level: Level) => WHO_PEOPLE.length + (level === 'hints' ? 1000 : 0)

// ── the page of the person on this phone ────────────────────────────────────────────────────────────────────────
const way = ref<Way>('table')
const level = ref<Level>('name')
const codeInput = ref('')
const codeError = ref(false)
const NAMES_KEY = 'lk-family-names'
/** The name of the person on this phone (the first place of the names that all the family games keep). */
const names = ref<string[]>([''])
const playerName = computed(() => names.value[0]?.trim() || t('app.family.player', { n: 1 }))

onMounted(() => {
  let saved: string[] = []
  try {
    const raw = JSON.parse(localStorage.getItem(NAMES_KEY) ?? 'null')
    if (Array.isArray(raw)) saved = raw.filter((x) => typeof x === 'string')
  } catch {
    // start with the standard name
  }
  names.value = [saved[0] || (hasCustomName.value ? displayName.value : '')]
})

function setNames(next: string[]) {
  names.value = [next[0] ?? '']
}
/** The name stays for the other family games, too (in the first place of the list they all use). */
function saveName() {
  try {
    const raw = JSON.parse(localStorage.getItem(NAMES_KEY) ?? 'null')
    const list: string[] = Array.isArray(raw) ? raw.filter((x) => typeof x === 'string') : []
    list[0] = names.value[0]?.trim() ?? ''
    localStorage.setItem(NAMES_KEY, JSON.stringify(list))
  } catch {
    // the name is not remembered in a private window
  }
}

function pickWay(w: Way) {
  way.value = w
  play('tap')
}
function pickLevel(l: Level) {
  level.value = l
  codeError.value = false
  play('tap')
}

/** The course: title screen, the page of the person, the screens with a card, the end. */
type Phase = 'start' | 'lobby' | 'host' | 'card' | 'ready' | 'live' | 'won' | 'over'
const phase = ref<Phase>('start')
/** The screens with a card (the game runs: the bar of the game is on top and the turn button is shown). */
const playing = computed(() => phase.value === 'host' || phase.value === 'card' || phase.value === 'ready' || phase.value === 'live')
const withCard = computed(() => phase.value === 'host' || phase.value === 'card' || phase.value === 'live')
/** How the last round was begun (what "Again" does). */
const lastAs = ref<'host' | 'card' | 'code'>('host')

// ── the card (the same for the table and the code game) ─────────────────────────────────────────────────────────
const card = ref<number[]>(makeCard())
const marked = ref<boolean[]>(Array.from({ length: BINGO_CELLS }, () => false))
function toggle(p: number) {
  play('tap')
  marked.value = marked.value.map((m, i) => (i === p ? !m : m))
  persist()
}
function newCard() {
  card.value = makeCard()
  marked.value = Array.from({ length: BINGO_CELLS }, () => false)
}
const lineOnCard = computed(() => hasBingo(marked.value))
const tableMessage = ref(false)
const tickedCount = computed(() => marked.value.filter(Boolean).length)

// ── the host at the table ───────────────────────────────────────────────────────────────────────────────────────
const order = ref<number[]>([])
const step = ref(0)
const hintN = ref(1)
const revealed = ref(false)

const hostPerson = computed(() => order.value[step.value] ?? 0)
const called = computed(() => order.value.slice(0, step.value + (revealed.value ? 1 : 0)))
const hostLast = computed(() => step.value >= order.value.length - 1)

function startHost() {
  newCard()
  hostMessage.value = ''
  order.value = drawOrder()
  step.value = 0
  hintN.value = 1
  revealed.value = level.value === 'name'
  phase.value = 'host'
  persist()
}
function nextHint() {
  play('flip')
  hintN.value = Math.min(3, hintN.value + 1)
  persist()
}
function reveal() {
  play('flip')
  revealed.value = true
  persist()
}
function nextPerson() {
  if (hostLast.value) {
    phase.value = 'over'
    save.clear()
    return
  }
  play('flip')
  step.value++
  hintN.value = 1
  revealed.value = level.value === 'name'
  persist()
}

function startTable(as: 'host' | 'card') {
  saveName()
  tableMessage.value = false
  lastAs.value = as
  if (as === 'host') startHost()
  else {
    newCard()
    phase.value = 'card'
    persist()
  }
}

// ── keep playing: what this phone has of the round is kept whenever it changes ──────────────────────────────────
/** Keeps this phone's round: the card with its ticks, and (at the table) what has been called, or (code) the code and the start. */
function persist() {
  const p = phase.value
  if (p !== 'host' && p !== 'card' && p !== 'ready' && p !== 'live') return
  save.save({
    way: p === 'host' || p === 'card' ? 'table' : 'code',
    level: level.value,
    phase: p,
    card: [...card.value],
    marked: [...marked.value],
    order: p === 'host' ? [...order.value] : [],
    step: p === 'host' ? step.value : 0,
    hintN: p === 'host' ? hintN.value : 1,
    revealed: p === 'host' ? revealed.value : false,
    code: p === 'ready' || p === 'live' ? roundCode.value : '',
    startedAt: p === 'live' ? startedAt.value : 0
  })
}

/** The kept round, if it is still good (a round with a code that has run out is not offered: the other phones are done, too). */
const wallNow = ref(Date.now())
watch(phase, () => (wallNow.value = Date.now()))
const kept = computed(() => {
  const s = parseBingoSnap(save.saved.value)
  if (!s) return null
  if (s.phase === 'ready' || s.phase === 'live') {
    if (!readCode(s.code, sizeFor(s.level)).ok) return null
    if (s.phase === 'live' && liveIsOver(s.startedAt, wallNow.value, s.level === 'hints' ? HINTS_PERIOD : NAME_PERIOD)) return null
  }
  return s
})
// a round that cannot be taken up any more (its code has run out) is forgotten
if (save.saved.value && !kept.value) save.clear()
/** The line over "Continue" on the title screen (a card at the table, without a call, says "At the table"). */
const keptInfo = computed(() => {
  const s = kept.value
  if (!s || locked.value) return ''
  if (s.phase === 'host') return t('app.bingo.callOf', { n: s.step + 1, total: s.order.length })
  if (s.phase === 'ready') return showCode(s.code)
  if (s.phase === 'live') {
    const per = s.level === 'hints' ? HINTS_PERIOD : NAME_PERIOD
    return t('app.bingo.callOf', { n: Math.min(WHO_PEOPLE.length, Math.floor(Math.max(0, wallNow.value - s.startedAt) / per) + 1), total: WHO_PEOPLE.length })
  }
  return t('app.bingo.way_table')
})

function resume() {
  const s = kept.value
  if (!s) {
    save.clear()
    return
  }
  play('tap')
  stopTimer()
  way.value = s.way
  level.value = s.level
  card.value = [...s.card]
  marked.value = [...s.marked]
  tableMessage.value = false
  hostMessage.value = ''
  wrongTry.value = false
  codeError.value = false
  if (s.phase === 'host') {
    lastAs.value = 'host'
    order.value = [...s.order]
    step.value = s.step
    hintN.value = s.hintN
    revealed.value = s.revealed
    phase.value = 'host'
  } else if (s.phase === 'card') {
    lastAs.value = 'card'
    phase.value = 'card'
  } else {
    lastAs.value = 'code'
    // the same code gives the same order of people as on every other phone
    const r = readCode(s.code, sizeFor(s.level))
    if (!r.ok) return
    roundCode.value = r.code
    liveOrder.value = drawOrder(mulberry32(r.seed))
    if (s.phase === 'ready') phase.value = 'ready'
    else runClock(s.startedAt)
  }
}
function sayBingo() {
  tableMessage.value = true
  play(lineOnCard.value ? 'fanfare' : 'wrong')
}
/** The reader plays, too: the card is checked against the people called so far. */
const hostMessage = ref<'' | 'yes' | 'no'>('')
function hostBingo() {
  hostMessage.value = isTrueBingo(card.value, marked.value, order.value.slice(0, step.value + 1)) ? 'yes' : 'no'
  play(hostMessage.value === 'yes' ? 'fanfare' : 'wrong')
}

// ── the code game ───────────────────────────────────────────────────────────────────────────────────────────────
const roundCode = ref('')
const liveOrder = ref<number[]>([])
const startedAt = ref(0)
const now = ref(0)
const wrongTry = ref(false)
const wonAt = ref(0)
let timer: ReturnType<typeof setInterval> | undefined

function stopTimer() {
  if (timer) clearInterval(timer)
  timer = undefined
}
onBeforeUnmount(stopTimer)

function prepare(code: string, seed: number, lv: Level) {
  saveName()
  roundCode.value = code
  level.value = lv
  lastAs.value = 'code'
  liveOrder.value = drawOrder(mulberry32(seed))
  newCard()
  codeError.value = false
  phase.value = 'ready'
  persist()
}

function newRound() {
  const lv = level.value
  const code = newCode(sizeFor(lv))
  const r = readCode(code, sizeFor(lv))
  if (r.ok) prepare(r.code, r.seed, lv)
}

function joinRound() {
  for (const lv of LEVELS) {
    const r = readCode(codeInput.value, sizeFor(lv))
    if (r.ok) {
      prepare(r.code, r.seed, lv)
      return
    }
  }
  codeError.value = true
}

/** The clock of the round runs from `from` (the moment of "Go"; after a pause it is the moment kept, so the round is where the other phones are). */
function runClock(from: number) {
  startedAt.value = from
  now.value = Date.now()
  stopTimer()
  timer = setInterval(() => {
    now.value = Date.now()
    if (step2.value >= liveOrder.value.length) {
      stopTimer()
      phase.value = 'over'
      save.clear()
    }
  }, 500)
  phase.value = 'live'
}

function go() {
  wrongTry.value = false
  runClock(Date.now())
  persist()
}

const period = computed(() => (level.value === 'hints' ? HINTS_PERIOD : NAME_PERIOD))
const elapsed = computed(() => Math.max(0, now.value - startedAt.value))
const step2 = computed(() => Math.floor(elapsed.value / period.value))
const inStep = computed(() => elapsed.value - step2.value * period.value)
const livePerson = computed(() => liveOrder.value[Math.min(step2.value, liveOrder.value.length - 1)] ?? 0)
const liveHints = computed(() => (level.value === 'hints' ? Math.min(3, Math.floor(inStep.value / HINT_STEP) + 1) : 0))
const liveRevealed = computed(() => level.value === 'name' || inStep.value >= 3 * HINT_STEP)
const secondsLeft = computed(() => Math.max(0, Math.ceil((period.value - inStep.value) / 1000)))
/** Everybody called so far (the person of this moment counts once the first hint or the name is shown). */
const calledLive = computed(() => liveOrder.value.slice(0, Math.min(liveOrder.value.length, step2.value + 1)))
const revealedLive = computed(() => liveOrder.value.slice(0, Math.min(liveOrder.value.length, step2.value)).concat(liveRevealed.value && step2.value < liveOrder.value.length ? [livePerson.value] : []))

function callBingo() {
  if (isTrueBingo(card.value, marked.value, calledLive.value)) {
    wonAt.value = Math.min(liveOrder.value.length, step2.value + 1)
    stopTimer()
    phase.value = 'won'
    save.clear()
    play('familyResult')
  } else {
    wrongTry.value = true
    play('familyWrong')
  }
}

// ── what the call shows (the same on the reader's device and in the code game) ──────────────────────────────────
const live = computed(() => phase.value === 'live')
const call = computed(() => {
  if (live.value) {
    return {
      step: step2.value,
      count: t('app.bingo.callOf', { n: Math.min(step2.value + 1, liveOrder.value.length), total: liveOrder.value.length }),
      next: t('app.bingo.nextIn', { n: secondsLeft.value }),
      person: livePerson.value,
      name: liveRevealed.value,
      hintN: liveHints.value,
      hints: liveRevealed.value ? 3 : liveHints.value,
      names: revealedLive.value
    }
  }
  return {
    step: step.value,
    count: t('app.bingo.callOf', { n: step.value + 1, total: order.value.length }),
    next: '',
    person: hostPerson.value,
    name: level.value === 'name' || revealed.value,
    hintN: hintN.value,
    hints: revealed.value ? 3 : hintN.value,
    names: called.value
  }
})
/** The size of the name: long names a little smaller. */
const nameSize = computed(() => (nameOf(call.value.person).length > 13 ? '1.5rem' : '2rem'))

// ── the bar of the game, the lines of "How to play", the end ────────────────────────────────────────────────────
/** The person on this phone: figure, name and how many fields are ticked. */
const barPlayers = computed(() => [{ name: playerName.value, score: `${tickedCount.value}/${BINGO_CELLS}`, index: 0 }])
const rules = computed(() => [t('app.bigGames.bingoFlow.rule1'), t('app.bigGames.bingoFlow.rule2'), t('app.bingo.cardHelp'), t('app.bigGames.bingoFlow.rule4')])

/** "Again": the same way once more (with a code: a new round with a new code). */
function again() {
  play('tap')
  if (lastAs.value === 'code') newRound()
  else startTable(lastAs.value)
}

/** "Play": to the page of the person (without Plus it opens the sheet of Plus). */
function onPlay() {
  if (locked.value) {
    showUpsell('family')
    return
  }
  phase.value = 'lobby'
}
</script>

<template lang="pug">
  MapTable(title="" game="bingo" @back="goBack")
    //- ===== the bar of the game (while a round runs): the colour of the game, the person on this phone, leaving asks first =====
    template(v-if="playing" v-slot:top)
      FamilyGameBar(
        game="bingo"
        :title="t('app.family.hub_bingo')"
        :players="barPlayers"
        :leave-text="t('app.bigGames.familyFlow.leaveKept')"
        @leave="toStart"
      )

    div(class="fb")
      //- ===== 1. the title screen (without Plus: "Play" opens the sheet of Plus, the note says why) =====
      FamilyStart(
        v-if="phase === 'start'"
        game="bingo"
        :name="t('app.family.hub_bingo')"
        :tagline="t('app.family.hub_bingoSub')"
        :rules="rules"
        :resume-info="keptInfo"
        @play="onPlay"
        @resume="resume"
      )
        template(v-if="locked" v-slot:extra)
          FamilyCard(compact class="fb-lock")
            span(class="fb-fine") {{ t('app.bingo.locked') }}
            FamilyButton(quiet @click="showUpsell('family')") {{ t('app.family.lockedButton') }}

      //- ===== 2. the person on this phone, the way, the level, and how to begin =====
      FamilyLobby(
        v-else-if="phase === 'lobby'"
        game="bingo"
        :title="t('app.bigGames.bingoFlow.whoHere')"
        :count="1"
        fixed
        hide-go
        :names="names"
        @update:names="setNames"
      )
        //- how: at the table, or several phones with a round code
        template(v-slot:top)
          div(class="fb-ways" role="radiogroup" :aria-label="t('app.bingo.wayLabel')")
            FamilyChip(v-for="w in WAYS" :key="w" class="fb-wide-chip" :selected="way === w" @click="pickWay(w)") {{ t(`app.bingo.way_${w}`) }}
          span(class="fb-fine") {{ t(`app.bingo.wayText_${way}`) }}

        template(v-slot:settings)
          //- how hard: the name, or three hints
          FamilyCard(:title="t('app.bingo.levelLabel')" symbol="bingo")
            div(class="fb-levels" role="radiogroup" :aria-label="t('app.bingo.levelLabel')")
              FamilyChip(v-for="l in LEVELS" :key="l" class="fb-wide-chip" :selected="level === l" @click="pickLevel(l)") {{ t(`app.bingo.level_${l}`) }}
            span(class="fb-fine") {{ t(`app.bingo.levelText_${level}`) }}

          //- at the table: read aloud, or only a card
          FamilyCard(v-if="way === 'table'" compact class="fb-begin")
            FamilyButton(@click="startTable('host')") {{ t('app.bingo.iRead') }}
            FamilyButton(quiet @click="startTable('card')") {{ t('app.bingo.iPlay') }}

          //- several phones: a new round with a code, or join with a code
          template(v-else)
            FamilyCard(:title="t('app.bingo.codeNew')")
              span(class="fb-fine") {{ t('app.bingo.codeNewText') }}
              FamilyButton(@click="newRound") {{ t('app.bingo.codeNewGo') }}
            FamilyCard(:title="t('app.bingo.codeJoin')")
              FamilyNameField(v-model="codeInput" code :maxlength="8" placeholder="K7M-4QX" :aria-label="t('app.bingo.codeJoin')" @enter="joinRound")
              span(v-if="codeError" class="fb-fine fb-error" role="alert") {{ t('app.bingo.codeError') }}
              FamilyButton(:disabled="!codeInput.trim()" @click="joinRound") {{ t('app.bingo.codeJoinGo') }}

      //- ===== 3a. the game: the call (the reader's device, or this phone by itself) and the card =====
      div(v-else-if="phase === 'host' || phase === 'live'" class="fb-play")
        div(class="fb-call")
          FamilyQuestionCard(:key="call.step" symbol="bingo" class="fb-callcard" :chip="call.count" :sub="call.next")
            div(class="fb-callbody")
              template(v-if="call.name")
                span(class="fb-name" :style="{ fontSize: nameSize }") {{ nameOf(call.person) }}
              template(v-else)
                span(class="fb-q") ?
                span(class="fb-hint-no") {{ t('app.bingo.hintN', { n: call.hintN }) }}
          div(v-if="level === 'hints'" class="fb-hints")
            FamilyCard(v-for="n in call.hints" :key="call.step + '-' + n" compact :tone="n === call.hints && !call.name ? 'lit' : 'default'" class="fb-hint")
              span(class="fb-hint-text") {{ factsOf(call.person)[n - 1] }}
          template(v-if="phase === 'host'")
            span(class="fb-fine fb-help") {{ level === 'name' ? t('app.bingo.hostNameHelp') : t('app.bingo.hostHintHelp') }}
            div(class="fb-actions")
              FamilyButton(v-if="level === 'hints' && !revealed && hintN < 3" quiet @click="nextHint") {{ t('app.bingo.nextHint') }}
              FamilyButton(v-if="level === 'hints' && !revealed" quiet @click="reveal") {{ t('app.bingo.reveal') }}
              FamilyButton(v-if="revealed" @click="nextPerson") {{ hostLast ? t('app.bingo.finish') : t('app.bingo.nextPerson') }}

        div(class="fb-mine")
          span(v-if="phase === 'host'" class="fb-fine fb-mine-note") {{ t('app.bingo.hostPlays') }}
          BingoGrid(class="fb-grid" :card="card" :marked="marked" @toggle="toggle")
          FamilyButton(:class="['fb-bingo', { 'is-lit': lineOnCard }]" @click="phase === 'host' ? hostBingo() : callBingo()") {{ t('app.bingo.bingo') }}
          FamilyCard(v-if="phase === 'host' && hostMessage" compact :tone="hostMessage === 'yes' ? 'right' : 'wrong'" class="fb-msg" role="status") {{ hostMessage === 'yes' ? t('app.bingo.callAloud') : t('app.bingo.notYet') }}
          FamilyCard(v-if="phase === 'live' && wrongTry" compact tone="wrong" class="fb-msg" role="alert") {{ t('app.bingo.notTrue') }}

        div(class="fb-rest")
          FamilyCard(v-if="call.names.length" compact class="fb-called")
            span(class="fb-called-title") {{ t('app.bingo.calledSoFar') }}
            span(class="fb-called-list") {{ call.names.map(nameOf).join(', ') }}
          FamilyButton(v-if="canTurn && withCard" quiet class="fb-rotate" @click="rotate") {{ full ? t('app.family.rotateBack') : t('app.family.rotate') }}

      //- ===== 3b. a card at the table =====
      div(v-else-if="phase === 'card'" class="fb-play fb-play--card")
        div(class="fb-call")
          FamilyCard(compact)
            span(class="fb-fine") {{ t('app.bingo.cardHelp') }}
        div(class="fb-mine")
          BingoGrid(class="fb-grid" :card="card" :marked="marked" @toggle="toggle")
          FamilyButton(:class="['fb-bingo', { 'is-lit': lineOnCard }]" @click="sayBingo") {{ t('app.bingo.bingo') }}
          FamilyCard(v-if="tableMessage" compact :tone="lineOnCard ? 'right' : 'wrong'" class="fb-msg" role="status") {{ lineOnCard ? t('app.bingo.callAloud') : t('app.bingo.notYet') }}
        div(class="fb-rest")
          FamilyButton(quiet @click="newCard(); persist()") {{ t('app.bingo.newCard') }}
          FamilyButton(v-if="canTurn" quiet class="fb-rotate" @click="rotate") {{ full ? t('app.family.rotateBack') : t('app.family.rotate') }}

      //- ===== 3c. several phones: the code, the card, "Go" =====
      div(v-else-if="phase === 'ready'" class="fb-play fb-play--card")
        div(class="fb-call")
          FamilyCard(:title="t('app.bingo.roundCode')" symbol="bingo")
            span(class="fb-code") {{ showCode(roundCode) }}
            span(class="fb-fine") {{ t(`app.bingo.levelText_${level}`) }}
            span(class="fb-fine") {{ t('app.bingo.readyText') }}
        div(class="fb-mine")
          BingoGrid(class="fb-grid" :card="card" :marked="marked" readonly)
          FamilyButton(class="fb-go" @click="go") {{ t('app.bingo.go') }}

      //- ===== 4. the end: the person has "Bingo!", or all the people have been called =====
      FamilyPodium(
        v-else
        game="bingo"
        :headline="phase === 'won' ? t('app.bingo.won') : t('app.bingo.over')"
        :winner-index="phase === 'won' ? 0 : undefined"
        @again="again"
        @change="phase = 'lobby'"
        @exit="toGames"
      )
        template(v-slot:extra)
          FamilyCard(compact)
            span(class="fb-fine") {{ phase === 'won' ? t('app.bingo.wonText', { n: wonAt }) : t('app.bingo.overText') }}
          BingoGrid(v-if="phase === 'won'" class="fb-grid fb-grid--small" :card="card" :marked="marked" readonly)
</template>

<style scoped lang="sass">
.fb
  display: flex
  flex-direction: column
  gap: 16px
  min-height: 100%
  max-width: 36rem
  margin: 0 auto
  padding: 6px 0 24px

.fb-fine
  display: block
  width: 100%
  color: var(--fam-muted)
  text-align: center
  font-size: 1.02rem
  font-weight: 600
  line-height: 1.35

.fb-error
  color: var(--fam-bad)
  font-weight: 700

.fb-lock
  max-width: 24rem

// ── the page of the person ──
.fb-ways,
.fb-levels
  display: grid
  grid-template-columns: repeat(2, minmax(0, 1fr))
  gap: 10px
  width: 100%

.fb-wide-chip
  width: 100%
  min-height: 56px
  padding: 8px 10px

.fb-begin
  :deep(.fam-card-body)
    gap: 12px

// ── the game ──
.fb-play
  display: flex
  flex-direction: column
  gap: 14px
  align-items: stretch

.fb-call
  display: flex
  flex-direction: column
  align-items: center
  gap: 10px

.fb-callcard
  :deep(.fam-card-body)
    gap: 6px

.fb-callbody
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  min-height: 72px

.fb-name
  display: block
  max-width: 100%
  color: var(--fam-ink)
  font-weight: 800
  line-height: 1.1
  overflow-wrap: anywhere
  hyphens: auto

.fb-q
  display: block
  color: var(--fam-ink)
  font-size: 3rem
  font-weight: 800
  line-height: 1

.fb-hint-no
  display: block
  margin-top: 2px
  color: var(--fam-muted)
  font-size: 1rem
  font-weight: 700

.fb-hints
  display: flex
  flex-direction: column
  gap: 8px
  width: 100%

.fb-hint
  :deep(.fam-card-body)
    padding: 10px 14px

.fb-hint-text
  font-size: 1.05rem
  font-weight: 700
  line-height: 1.25

.fb-help
  display: none

@media (min-height: 900px)
  .fb-help
    display: block

.fb-actions
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 10px
  width: 100%

  :deep(.fam-btn)
    flex: 1 1 150px
    min-width: 0
    padding: 8px 12px

.fb-mine
  display: flex
  flex-direction: column
  align-items: center
  gap: 12px

.fb-mine-note
  width: auto

.fb-grid
  width: 100%

.fb-grid--small
  max-width: 24rem

// the button "Bingo!" turns gold when a whole line is ticked
.fb-bingo.fb-bingo.is-lit
  border-color: var(--fam-gold-deep)
  background: var(--fam-gold)
  color: var(--fam-on-gold)
  box-shadow: 0 4px 0 var(--fam-gold-deep), 0 12px 18px -10px rgba(10, 40, 40, 0.55)

.fb-msg
  max-width: 28rem

.fb-rest
  display: flex
  flex-direction: column
  align-items: center
  gap: 10px

.fb-called
  :deep(.fam-card-body)
    gap: 2px

.fb-called-title
  display: block
  color: var(--fam-muted)
  font-size: 0.8rem
  font-weight: 800
  letter-spacing: 0.08em
  text-transform: uppercase

.fb-called-list
  display: block
  font-size: 0.98rem
  line-height: 1.4

// the round code: a gold capsule
.fb-code
  display: block
  padding: 8px 26px
  border: 1.5px solid var(--fam-gold)
  border-radius: 999px
  background: color-mix(in srgb, var(--fam-gold) 22%, var(--fam-card))
  color: var(--fam-ink)
  font-size: 2rem
  font-weight: 800
  letter-spacing: 0.14em
  text-align: center

// movement only for those who do not ask for less
@media (prefers-reduced-motion: no-preference)
  .fb-callcard
    animation: fb-turn 0.4s ease-out both

  .fb-hint
    animation: fb-rise 0.4s ease-out both

  .fb-bingo.is-lit
    animation: fb-shine 1.2s ease-in-out 2

@keyframes fb-turn
  0%
    opacity: 0
    transform: translateY(10px) scale(0.97)
  100%
    opacity: 1
    transform: none

@keyframes fb-rise
  0%
    opacity: 0
    transform: translateY(8px)
  100%
    opacity: 1
    transform: none

@keyframes fb-shine
  0%, 100%
    transform: none
  50%
    transform: scale(1.04)

// the phone lies on its side: the call on the left, the card, as big as the height allows, on the right
@media (orientation: landscape) and (max-height: 700px)
  .fb
    max-width: none
    padding-bottom: 8px

  .fb-play
    display: grid
    grid-template-columns: minmax(0, 1fr) auto
    column-gap: 18px
    row-gap: 8px
    align-items: start
    justify-content: center
    width: 100%
    max-width: 62rem
    margin: 0 auto

  .fb-call
    grid-column: 1
    grid-row: 1
    gap: 8px

  // the card (as wide as it is high: the screen height minus the top bar) stays while the left side scrolls; the button goes to the left
  .fb-mine
    display: contents

  .fb-mine > .fb-mine-note
    display: none

  .fb-grid
    grid-column: 2
    grid-row: 1 / span 6
    width: calc(100dvh - 78px)
    max-width: 52vw
    --bg-ratio: 1 / 1
    position: sticky
    top: 0
    align-self: start

  .fb-bingo.fb-bingo,
  .fb-go.fb-go
    grid-column: 1
    grid-row: 2
    justify-self: center
    min-width: 0
    width: 100%
    max-width: 18rem

  .fb-msg
    grid-column: 1
    grid-row: 3
    max-width: none

  .fb-rest
    grid-column: 1
    grid-row: 4

  .fb-callcard
    :deep(.fam-card-head)
      min-height: 44px
      padding-top: 4px
      padding-bottom: 4px

    :deep(.fam-card-body)
      padding: 8px 12px

  .fb-callbody
    min-height: 48px

  .fb-q
    font-size: 2.2rem

  .fb-hint
    :deep(.fam-card-body)
      padding: 6px 12px

  .fb-hint-text
    font-size: 0.95rem

  .fb-grid--small
    max-width: 17rem

  .fb-ways,
  .fb-levels
    max-width: 40rem
</style>
