<script setup lang="ts">
/**
 * Bible bingo (Plus), on the map table: every player has a card with sixteen people of the Bible, one person after the other is called (by
 * name, or, harder, by three hints), and whoever has the person on the card lets a wax seal fall on it. Whoever has a whole row, column or
 * diagonal calls "Bingo".
 * Two ways to play, both without any connection between the devices:
 *  - `table`: one person reads aloud on one device (the host: the name, or the hints one by one) and plays with their own card on that
 *    device, too; the others have their cards on their own devices.
 *  - `code`: no host. A round code gives every phone the same order of people; everybody taps "Go" together, and every phone calls the
 *    people by itself, by its own clock (a new person every 20 seconds, or hints every 10 seconds). Bingo is checked on the phone against
 *    the people that were called by then.
 * The people and their hints are in `data/whoAmI.ts`.
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import MapTable from '@/components/molecules/map/MapTable.vue'
import MapButton from '@/components/molecules/map/MapButton.vue'
import MapMedallion from '@/components/molecules/map/MapMedallion.vue'
import MapPaper from '@/components/molecules/map/MapPaper.vue'
import MapResult from '@/components/molecules/map/MapResult.vue'
import MapResume from '@/components/molecules/map/MapResume.vue'
import BingoGrid from '@/components/molecules/BingoGrid.vue'
import { PREMIUM_TEASER, hasFeature, showUpsell } from '@/use/usePremium'
import { WHO_PEOPLE } from '@/data/whoAmI'
import type { ActivityLocale } from '@/data/activityWords'
import { BINGO_CELLS, drawOrder, hasBingo, isTrueBingo, liveIsOver, makeCard, parseBingoSnap, type BingoSnap } from '@/utils/bibleBingo'
import { mulberry32, newCode, readCode, showCode } from '@/utils/familyCode'
import useFamilySave from '@/use/useFamilySave'
import useLandscapePlay from '@/use/useLandscapePlay'
import useSfx from '@/use/useSfx'

const { t, locale } = useI18n({ useScope: 'global' })
const router = useRouter()
const { play } = useSfx()
const save = useFamilySave<BingoSnap>('bingo', 1)
// a kept round of another shape (older app) is thrown away at once
if (save.saved.value && !parseBingoSnap(save.saved.value)) save.clear()

/** Inside a round the arrow leads to the start page of this game (the round stays kept); there it leads to the main menu. */
function goBack() {
  if (phase.value !== 'setup') {
    stopTimer()
    phase.value = 'setup'
    return
  }
  void router.push({ name: 'app-family' })
}

const locked = computed(() => PREMIUM_TEASER && !hasFeature('family'))
const { landscape, full, canTurn, width, height, toggle: rotate } = useLandscapePlay()
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

// ── setup ───────────────────────────────────────────────────────────────────────────────────────────────────────
const way = ref<Way>('table')
const level = ref<Level>('name')
const codeInput = ref('')
const codeError = ref(false)
const showRules = ref(false)

type Phase = 'setup' | 'host' | 'card' | 'ready' | 'live' | 'won' | 'over'
const phase = ref<Phase>('setup')
/** The screens with a card: the turn button is shown there. */
const withCard = computed(() => phase.value === 'host' || phase.value === 'card' || phase.value === 'live')

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
  tableMessage.value = false
  if (as === 'host') startHost()
  else {
    newCard()
    phase.value = 'card'
    persist()
  }
}

// ── keep playing: what this phone has of the round is kept whenever it changes ──────────────────────────────────
/** Keeps this phone's round: the card with its seals, and (at the table) what has been called, or (code) the code and the start. */
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
const keptInfo = computed(() => {
  const s = kept.value
  if (!s) return ''
  if (s.phase === 'host') return t('app.bingo.callOf', { n: s.step + 1, total: s.order.length })
  if (s.phase === 'ready') return showCode(s.code)
  if (s.phase === 'live') {
    const per = s.level === 'hints' ? HINTS_PERIOD : NAME_PERIOD
    return t('app.bingo.callOf', { n: Math.min(WHO_PEOPLE.length, Math.floor(Math.max(0, wallNow.value - s.startedAt) / per) + 1), total: WHO_PEOPLE.length })
  }
  return ''
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
    order.value = [...s.order]
    step.value = s.step
    hintN.value = s.hintN
    revealed.value = s.revealed
    phase.value = 'host'
  } else if (s.phase === 'card') {
    phase.value = 'card'
  } else {
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
  roundCode.value = code
  level.value = lv
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

function leave() {
  stopTimer()
  phase.value = 'setup'
}

// ── what the call shows (the same on the reader's device and in the code game) ──────────────────────────────────
const live = computed(() => phase.value === 'live')
const call = computed(() => {
  if (live.value) {
    return {
      step: step2.value,
      count: `${t('app.bingo.callOf', { n: Math.min(step2.value + 1, liveOrder.value.length), total: liveOrder.value.length })} · ${t('app.bingo.nextIn', { n: secondsLeft.value })}`,
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
    person: hostPerson.value,
    name: level.value === 'name' || revealed.value,
    hintN: hintN.value,
    hints: revealed.value ? 3 : hintN.value,
    names: called.value
  }
})
/** The size of the medallion: smaller sideways (the card needs the height) and when hints take room below it. */
const medal = computed(() => {
  if (landscape.value && height.value <= 700) return level.value === 'hints' ? 112 : Math.round(Math.max(130, Math.min(170, height.value * 0.4)))
  const room = Math.max(150, Math.min(width.value - 80, 240))
  return level.value === 'hints' ? Math.min(room, 180) : room
})
const nameSize = computed(() => (medal.value >= 200 ? '1.7rem' : medal.value >= 160 ? '1.4rem' : '1.2rem'))
</script>

<template lang="pug">
  MapTable(:title="t('app.bingo.title')" @back="goBack")
    template(#actions)
      button(v-if="canTurn && withCard" type="button" class="fb-rotate" @click="rotate") {{ full ? t('app.family.rotateBack') : t('app.family.rotate') }}

    div(class="fb-wrap")
      //- ===== Plus only =====
      MapPaper(v-if="locked" kind="card" class="fb-note-card")
        p(class="fb-lock") {{ t('app.bingo.locked') }}
        MapButton(@click="showUpsell('family')") {{ t('app.family.lockedButton') }}

      //- ===== setup: two pairs of brass marks on the table ... =====
      div(v-else-if="phase === 'setup'" class="fb-setup")
        MapResume(v-if="kept" :info="keptInfo" @resume="resume")
        div(class="fb-col")
          section(class="fb-sec")
            h2(class="fb-h") {{ t('app.bingo.wayLabel') }}
            div(class="fb-marks" role="radiogroup" :aria-label="t('app.bingo.wayLabel')")
              MapButton(v-for="w in WAYS" :key="w" role="radio" :aria-checked="way === w" :quiet="way !== w" :class="['fb-mark', { 'is-on': way === w }]" @click="way = w") {{ t(`app.bingo.way_${w}`) }}
            p(class="fb-plate") {{ t(`app.bingo.wayText_${way}`) }}
          section(class="fb-sec")
            h2(class="fb-h") {{ t('app.bingo.levelLabel') }}
            div(class="fb-marks" role="radiogroup" :aria-label="t('app.bingo.levelLabel')")
              MapButton(v-for="l in LEVELS" :key="l" role="radio" :aria-checked="level === l" :quiet="level !== l" :class="['fb-mark', { 'is-on': level === l }]" @click="level = l") {{ t(`app.bingo.level_${l}`) }}
            p(class="fb-plate") {{ t(`app.bingo.levelText_${level}`) }}
          button(type="button" class="fb-link" :aria-expanded="showRules" @click="showRules = !showRules") {{ t('app.bingo.rulesLink') }}
          p(v-if="showRules" class="fb-plate fb-rules") {{ t('app.bingo.explain') }}

        //- ... then at the table: the reader or a card; or with several phones: a code
        div(v-if="way === 'table'" class="fb-col fb-col--go")
          MapButton(@click="startTable('host')") {{ t('app.bingo.iRead') }}
          MapButton(quiet @click="startTable('card')") {{ t('app.bingo.iPlay') }}
        div(v-else class="fb-col fb-col--go")
          section(class="fb-sec")
            h2(class="fb-h") {{ t('app.bingo.codeNew') }}
            p(class="fb-plate") {{ t('app.bingo.codeNewText') }}
            MapButton(@click="newRound") {{ t('app.bingo.codeNewGo') }}
          section(class="fb-sec")
            h2(class="fb-h") {{ t('app.bingo.codeJoin') }}
            MapPaper(kind="strip")
              input(
                v-model="codeInput"
                class="fb-input"
                type="text"
                maxlength="8"
                autocapitalize="characters"
                autocomplete="off"
                spellcheck="false"
                placeholder="K7M-4QX"
                :aria-label="t('app.bingo.codeJoin')"
                @keyup.enter="joinRound"
              )
            p(v-if="codeError" class="fb-error" role="alert") {{ t('app.bingo.codeError') }}
            MapButton(quiet :disabled="!codeInput.trim()" @click="joinRound") {{ t('app.bingo.codeJoinGo') }}

      //- ===== the game: the call (the reader's device, or this phone by itself) and the card =====
      div(v-else-if="phase === 'host' || phase === 'live'" class="fb-play")
        div(class="fb-call")
          p(class="fb-count") {{ call.count }}
          MapMedallion(:key="call.step" :size="medal" class="fb-medal")
            template(v-if="call.name")
              span(class="fb-name" :style="{ fontSize: nameSize }") {{ nameOf(call.person) }}
            template(v-else)
              span(class="fb-q") ?
              span(class="fb-hint-no") {{ t('app.bingo.hintN', { n: call.hintN }) }}
          div(v-if="level === 'hints'" class="fb-hints")
            MapPaper(v-for="n in call.hints" :key="call.step + '-' + n" kind="strip" :lit="n === call.hints && !call.name" class="fb-hint") {{ factsOf(call.person)[n - 1] }}
          template(v-if="phase === 'host'")
            p(class="fb-plate fb-help") {{ level === 'name' ? t('app.bingo.hostNameHelp') : t('app.bingo.hostHintHelp') }}
            div(class="fb-actions")
              MapButton(v-if="level === 'hints' && !revealed && hintN < 3" quiet @click="nextHint") {{ t('app.bingo.nextHint') }}
              MapButton(v-if="level === 'hints' && !revealed" quiet @click="reveal") {{ t('app.bingo.reveal') }}
              MapButton(v-if="revealed" @click="nextPerson") {{ hostLast ? t('app.bingo.finish') : t('app.bingo.nextPerson') }}

        div(class="fb-mine")
          p(v-if="phase === 'host'" class="fb-count") {{ t('app.bingo.hostPlays') }}
          BingoGrid(class="fb-grid" :card="card" :marked="marked" @toggle="toggle")
          MapButton(:class="['fb-bingo', { 'is-lit': lineOnCard }]" @click="phase === 'host' ? hostBingo() : callBingo()") {{ t('app.bingo.bingo') }}
          MapPaper(v-if="phase === 'host' && hostMessage" kind="strip" :lit="hostMessage === 'yes'" class="fb-msg" role="status") {{ hostMessage === 'yes' ? t('app.bingo.callAloud') : t('app.bingo.notYet') }}
          MapPaper(v-if="phase === 'live' && wrongTry" kind="strip" class="fb-msg fb-msg--bad" role="alert") {{ t('app.bingo.notTrue') }}

        div(class="fb-rest")
          div(v-if="call.names.length" class="fb-plate fb-called")
            span(class="fb-called-title") {{ t('app.bingo.calledSoFar') }}
            span(class="fb-called-list") {{ call.names.map(nameOf).join(', ') }}
          button(type="button" class="fb-link" @click="phase === 'host' ? (phase = 'setup') : leave()") {{ t('app.bingo.leave') }}

      //- ===== a card at the table =====
      div(v-else-if="phase === 'card'" class="fb-play fb-play--card")
        div(class="fb-call")
          p(class="fb-plate") {{ t('app.bingo.cardHelp') }}
        div(class="fb-mine")
          BingoGrid(class="fb-grid" :card="card" :marked="marked" @toggle="toggle")
          MapButton(:class="['fb-bingo', { 'is-lit': lineOnCard }]" @click="sayBingo") {{ t('app.bingo.bingo') }}
          MapPaper(v-if="tableMessage" kind="strip" :lit="lineOnCard" class="fb-msg" role="status") {{ lineOnCard ? t('app.bingo.callAloud') : t('app.bingo.notYet') }}
        div(class="fb-rest")
          button(type="button" class="fb-link" @click="newCard(); persist()") {{ t('app.bingo.newCard') }}
          button(type="button" class="fb-link" @click="phase = 'setup'") {{ t('app.bingo.leave') }}

      //- ===== several phones: the code, the card, "Go" =====
      div(v-else-if="phase === 'ready'" class="fb-play fb-play--card")
        div(class="fb-call")
          p(class="fb-count") {{ t('app.bingo.roundCode') }}
          MapPaper(kind="strip" lit class="fb-codeplate")
            span(class="fb-code") {{ showCode(roundCode) }}
          p(class="fb-plate") {{ t(`app.bingo.levelText_${level}`) }}
          p(class="fb-plate") {{ t('app.bingo.readyText') }}
        div(class="fb-mine")
          BingoGrid(class="fb-grid" :card="card" :marked="marked" readonly)
          MapButton(class="fb-go" @click="go") {{ t('app.bingo.go') }}
        div(class="fb-rest")
          button(type="button" class="fb-link" @click="phase = 'setup'") {{ t('app.bingo.leave') }}

      //- ===== the end =====
      MapResult(v-else-if="phase === 'won'" :headline="t('app.bingo.won')" :winner-index="0")
        p(class="fb-plate fb-center") {{ t('app.bingo.wonText', { n: wonAt }) }}
        BingoGrid(class="fb-grid fb-grid--small" :card="card" :marked="marked" readonly)
        MapButton(@click="phase = 'setup'") {{ t('app.bingo.again') }}

      MapPaper(v-else kind="card" class="fb-note-card")
        h2(class="fb-over") {{ t('app.bingo.over') }}
        p(class="fb-lock") {{ t('app.bingo.overText') }}
        MapButton(@click="phase = 'setup'") {{ t('app.bingo.again') }}
</template>

<style scoped lang="sass">
.fb-wrap
  width: 100%
  max-width: 34rem
  margin: 0 auto
  padding-bottom: 12px

// ── the turn button: a small brass plate in the corner ──
.fb-rotate
  min-height: 44px
  padding: 0 16px
  border: 2px solid #9a6b1c
  border-radius: 10px
  background: linear-gradient(180deg, #fff8e0 0%, #efd89c 100%)
  box-shadow: 0 0 0 2px rgba(255, 246, 214, 0.92), 0 4px 8px rgba(60, 35, 5, 0.45), inset 0 1px 0 #ffffff
  color: #3a2812
  font: inherit
  font-size: 0.95rem
  font-weight: 700
  letter-spacing: 0.04em
  cursor: pointer
  -webkit-tap-highlight-color: transparent

// ── text on the table: a dark leather plate, so that it reads on the map ──
.fb-plate
  margin: 0
  padding: 9px 14px
  border: 1px solid rgba(226, 189, 102, 0.35)
  border-radius: 8px
  background: rgba(28, 19, 10, 0.78)
  color: var(--mp-cream, #f6ead0)
  font-family: var(--mp-serif, Georgia, serif)
  font-size: 1.02rem
  font-weight: 600
  line-height: 1.35
  text-align: center
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.35)

.fb-center
  text-align: center

.fb-h
  margin: 0
  font-family: var(--mp-serif, Georgia, serif)
  font-size: 1.15rem
  font-weight: 700
  letter-spacing: 0.1em
  text-transform: uppercase
  text-align: center
  color: var(--mp-cream, #f6ead0)
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.95), 0 0 10px rgba(0, 0, 0, 0.6)

.fb-count
  margin: 0
  text-align: center
  font-size: 1rem
  font-weight: 700
  letter-spacing: 0.05em
  color: var(--mp-cream, #f6ead0)
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.95), 0 0 8px rgba(0, 0, 0, 0.6)

.fb-error
  margin: 0
  padding: 8px 12px
  border-radius: 8px
  background: rgba(60, 14, 8, 0.85)
  color: #ffd9c9
  font-weight: 700
  line-height: 1.35
  text-align: center

.fb-lock,
.fb-over
  margin: 0 0 14px
  text-align: center
  line-height: 1.4

.fb-over
  font-size: 1.5rem

.fb-note-card
  margin-top: 8px
  :deep(.mpa-in)
    display: flex
    flex-direction: column
    align-items: center

.fb-link
  align-self: center
  min-height: 44px
  padding: 0 12px
  border: 0
  background: transparent
  color: var(--mp-cream, #f6ead0)
  font-family: var(--mp-serif, Georgia, serif)
  font-size: 1rem
  font-weight: 700
  text-decoration: underline
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.95)
  cursor: pointer
  -webkit-tap-highlight-color: transparent

// ── setup ──
.fb-setup
  padding-top: 10px
  display: flex
  flex-direction: column
  gap: 18px
  align-items: stretch

.fb-col
  display: flex
  flex-direction: column
  gap: 16px
  align-items: stretch

.fb-col--go
  align-items: center

.fb-sec
  display: flex
  flex-direction: column
  gap: 10px
  align-items: stretch

.fb-col--go .fb-sec
  align-items: center
  width: 100%

.fb-marks
  display: grid
  grid-template-columns: repeat(2, minmax(0, 1fr))
  gap: 10px

// the marks are brass when chosen, dark bronze when not
.fb-mark.fb-mark
  min-width: 0
  width: 100%
  height: 60px
  padding: 0 8px
  font-size: 1.05rem
  letter-spacing: 0.03em

  &.is-on
    filter: drop-shadow(0 0 10px rgba(255, 210, 110, 0.8)) drop-shadow(0 5px 6px rgba(10, 5, 0, 0.6))

.fb-input
  width: 100%
  min-height: 44px
  border: 0
  border-bottom: 1px solid rgba(58, 40, 18, 0.5)
  background: transparent
  color: var(--mp-ink, #3a2812)
  font-family: var(--mp-serif, Georgia, serif)
  font-size: 1.5rem
  font-weight: 800
  letter-spacing: 0.14em
  text-align: center
  text-transform: uppercase
  outline: none

  &::placeholder
    color: rgba(58, 40, 18, 0.4)

.fb-col--go .fb-sec :deep(.mpa)
  max-width: 22rem

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

.fb-mine
  display: flex
  flex-direction: column
  align-items: center
  gap: 12px

.fb-rest
  display: flex
  flex-direction: column
  align-items: center
  gap: 8px

.fb-medal
  animation: fb-turn 0.45s ease-out both

.fb-name
  display: block
  max-width: 100%
  font-family: var(--mp-serif, Georgia, serif)
  font-weight: 800
  line-height: 1.05
  letter-spacing: 0.02em
  overflow-wrap: anywhere
  hyphens: auto

.fb-q
  display: block
  font-size: 3rem
  font-weight: 800
  line-height: 1

.fb-hint-no
  display: block
  margin-top: 2px
  font-size: 1rem
  letter-spacing: 0.08em
  text-transform: uppercase

.fb-hints
  display: flex
  flex-direction: column
  gap: 8px
  width: 100%

.fb-hints .fb-hint
  min-height: 46px
  animation: fb-rise 0.4s ease-out both

  :deep(.mpa-in)
    justify-content: center
    min-height: 46px
    font-size: 1.05rem
    line-height: 1.25
    padding-top: 5px
    padding-bottom: 5px

.fb-help
  display: none
  font-size: 0.95rem

@media (min-height: 900px)
  .fb-help
    display: block

.fb-actions
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 8px
  width: 100%

  :deep(.mb.mb)
    min-width: 0
    flex: 1 1 150px
    padding: 0 12px

.fb-grid
  width: 100%

.fb-grid--small
  max-width: 24rem

// the brass plate glows when a whole line is sealed
.fb-bingo
  &.is-lit
    animation: fb-shine 1.8s ease-in-out infinite

.fb-msg
  :deep(.mpa-in)
    justify-content: center
    font-size: 1.05rem

.fb-msg--bad
  color: #7d2418

.fb-codeplate
  max-width: 20rem
  :deep(.mpa-in)
    justify-content: center

.fb-code
  display: block
  width: 100%
  font-size: 2rem
  font-weight: 800
  letter-spacing: 0.14em
  text-align: center

.fb-called
  display: grid
  gap: 2px
  width: 100%
  text-align: left

.fb-called-title
  font-size: 0.78rem
  font-weight: 700
  letter-spacing: 0.1em
  text-transform: uppercase
  color: var(--mp-gold, #e2bd66)

.fb-called-list
  font-size: 0.95rem
  line-height: 1.4

@keyframes fb-turn
  0%
    opacity: 0
    transform: rotateY(90deg) scale(0.9)
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
    filter: drop-shadow(0 0 6px rgba(255, 205, 100, 0.55)) drop-shadow(0 5px 6px rgba(10, 5, 0, 0.6))
  50%
    filter: drop-shadow(0 0 18px rgba(255, 225, 130, 1)) drop-shadow(0 5px 6px rgba(10, 5, 0, 0.6))

@media (prefers-reduced-motion: reduce)
  .fb-medal,
  .fb-hints .fb-hint,
  .fb-bingo.is-lit
    animation: none

// the phone lies on its side: the call on the left, the card, as big as the height allows, on the right
@media (orientation: landscape) and (max-height: 700px)
  .fb-wrap
    max-width: none

  .fb-setup
    display: grid
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr)
    column-gap: 22px
    align-items: start
    max-width: 52rem
    margin: 0 auto

  .fb-play
    display: grid
    grid-template-columns: minmax(0, 1fr) auto
    column-gap: 18px
    row-gap: 8px
    align-items: start
    justify-content: center

  .fb-wrap
    padding-bottom: 0

  .fb-call
    grid-column: 1
    grid-row: 1

  // the card (as wide as it is high: the screen height minus the top bar) stays while the left side scrolls; the button goes to the left
  .fb-mine
    display: contents

  .fb-mine > .fb-count
    display: none

  .fb-grid
    grid-column: 2
    grid-row: 1 / span 6
    width: calc(100dvh - 108px)
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
    height: 52px

  .fb-msg
    grid-column: 1
    grid-row: 3

  .fb-rest
    grid-column: 1
    grid-row: 4

  .fb-actions :deep(.mb.mb)
    height: 46px

  .fb-hints .fb-hint
    min-height: 40px

    :deep(.mpa-in)
      min-height: 40px
      font-size: 0.95rem

  .fb-medal
    margin: 0

  .fb-grid--small
    max-width: 17rem
</style>
