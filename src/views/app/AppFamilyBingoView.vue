<script setup lang="ts">
/**
 * Bible bingo (Plus): every player has a card with nine people of the Bible, one person after the other is called (by name, or, harder,
 * by three hints), and whoever has the person on the card ticks it. Whoever has a whole row, column or diagonal calls "Bingo".
 * Two ways to play, both without any connection between the devices:
 *  - `table`: one person reads aloud on one device (the host: the name, or the hints one by one) and plays with their own card on that
 *    device, too; the others have their cards on their own devices.
 *  - `code`: no host. A round code gives every phone the same order of people; everybody taps "Go" together, and every phone calls the
 *    people by itself, by its own clock (a new person every 20 seconds, or hints every 10 seconds). Bingo is checked on the phone against
 *    the people that were called by then.
 * The people and their hints are in `data/whoAmI.ts`.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import LkPageHead from '@/components/molecules/LkPageHead.vue'
import AdvButton from '@/components/atoms/AdvButton.vue'
import BingoGrid from '@/components/molecules/BingoGrid.vue'
import { PREMIUM_TEASER, hasFeature, showUpsell } from '@/use/usePremium'
import { WHO_PEOPLE } from '@/data/whoAmI'
import type { ActivityLocale } from '@/data/activityWords'
import { BINGO_CELLS, drawOrder, hasBingo, isTrueBingo, makeCard } from '@/utils/bibleBingo'
import { mulberry32, newCode, readCode, showCode } from '@/utils/familyCode'
import useLandscapePlay from '@/use/useLandscapePlay'

const { t, locale } = useI18n({ useScope: 'global' })
const router = useRouter()

function goBack() {
  if (window.history.length > 1) router.back()
  else void router.push({ name: 'app-family' })
}

const locked = computed(() => PREMIUM_TEASER && !hasFeature('family'))
const { landscape, full, canTurn, toggle: rotate } = useLandscapePlay()
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

type Phase = 'setup' | 'host' | 'card' | 'ready' | 'live' | 'won' | 'over'
const phase = ref<Phase>('setup')
/** The screens with a card: turned on its side they show the call on the left and the card on the right, without the header. */
const withCard = computed(() => phase.value === 'host' || phase.value === 'card' || phase.value === 'live')

// ── the card (the same for the table and the code game) ─────────────────────────────────────────────────────────
const card = ref<number[]>(makeCard())
const marked = ref<boolean[]>(Array.from({ length: BINGO_CELLS }, () => false))
const toggle = (p: number) => (marked.value = marked.value.map((m, i) => (i === p ? !m : m)))
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
}
function nextHint() {
  hintN.value = Math.min(3, hintN.value + 1)
}
function reveal() {
  revealed.value = true
}
function nextPerson() {
  if (hostLast.value) {
    phase.value = 'over'
    return
  }
  step.value++
  hintN.value = 1
  revealed.value = level.value === 'name'
}

function startTable(as: 'host' | 'card') {
  tableMessage.value = false
  if (as === 'host') startHost()
  else {
    newCard()
    phase.value = 'card'
  }
}
const sayBingo = () => (tableMessage.value = true)
/** The reader plays, too: the card is checked against the people called so far. */
const hostMessage = ref<'' | 'yes' | 'no'>('')
const hostBingo = () => (hostMessage.value = isTrueBingo(card.value, marked.value, order.value.slice(0, step.value + 1)) ? 'yes' : 'no')

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

function go() {
  wrongTry.value = false
  startedAt.value = Date.now()
  now.value = startedAt.value
  stopTimer()
  timer = setInterval(() => {
    now.value = Date.now()
    if (step2.value >= liveOrder.value.length) {
      stopTimer()
      phase.value = 'over'
    }
  }, 500)
  phase.value = 'live'
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
  } else {
    wrongTry.value = true
  }
}

function leave() {
  stopTimer()
  phase.value = 'setup'
}
</script>

<template lang="pug">
  div(class="app-page min-h-screen w-full")
    LkPageHead(v-if="!(landscape && withCard)" :title="t('app.bingo.title')" :subtitle="phase === 'setup' ? t('app.bingo.sub') : ''" :lamb="phase === 'setup'" @back="goBack")

    section(class="fb-wrap")
      div(v-if="canTurn && withCard" class="fb-tools")
        button(type="button" class="fb-rotate" @click="rotate") {{ full ? t('app.family.rotateBack') : t('app.family.rotate') }}

      div(v-if="locked" class="fb-card")
        p(class="fb-explain") {{ t('app.bingo.locked') }}
        AdvButton(tone="gold" @click="showUpsell('family')") {{ t('app.family.lockedButton') }}

      //- ===== setup =====
      template(v-else-if="phase === 'setup'")
        div(class="fb-card")
          p(class="fb-explain") {{ t('app.bingo.explain') }}
          h3(class="fb-h") {{ t('app.bingo.wayLabel') }}
          div(class="fb-chips" role="radiogroup")
            button(v-for="w in WAYS" :key="w" type="button" role="radio" :aria-checked="way === w" :class="['fb-chip', { 'is-on': way === w }]" @click="way = w") {{ t(`app.bingo.way_${w}`) }}
          p(class="fb-note") {{ t(`app.bingo.wayText_${way}`) }}
          template(v-if="way === 'table' || phase === 'setup'")
            h3(class="fb-h") {{ t('app.bingo.levelLabel') }}
            div(class="fb-chips" role="radiogroup")
              button(v-for="l in LEVELS" :key="l" type="button" role="radio" :aria-checked="level === l" :class="['fb-chip', { 'is-on': level === l }]" @click="level = l") {{ t(`app.bingo.level_${l}`) }}
            p(class="fb-note") {{ t(`app.bingo.levelText_${level}`) }}

        //- at the table: the host or a card
        div(v-if="way === 'table'" class="fb-card")
          AdvButton(tone="gold" @click="startTable('host')") {{ t('app.bingo.iRead') }}
          AdvButton(tone="blau" @click="startTable('card')") {{ t('app.bingo.iPlay') }}

        //- several phones: a code
        div(v-else class="fb-card")
          h3(class="fb-h") {{ t('app.bingo.codeNew') }}
          p(class="fb-note") {{ t('app.bingo.codeNewText') }}
          AdvButton(tone="gold" @click="newRound") {{ t('app.bingo.codeNewGo') }}
          h3(class="fb-h") {{ t('app.bingo.codeJoin') }}
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
          AdvButton(tone="blau" :disabled="!codeInput.trim()" @click="joinRound") {{ t('app.bingo.codeJoinGo') }}

      //- ===== the host reads aloud =====
      div(v-else-if="phase === 'host'" class="fb-card fb-center fb-split")
        p(class="fb-count") {{ t('app.bingo.callOf', { n: step + 1, total: order.length }) }}
        template(v-if="level === 'name' || revealed")
          h2(class="fb-person") {{ nameOf(hostPerson) }}
        template(v-else)
          p(class="fb-hint-title") {{ t('app.bingo.hintN', { n: hintN }) }}
        ul(v-if="level === 'hints'" class="fb-hints")
          li(v-for="n in (revealed ? 3 : hintN)" :key="n") {{ factsOf(hostPerson)[n - 1] }}
        p(class="fb-note") {{ level === 'name' ? t('app.bingo.hostNameHelp') : t('app.bingo.hostHintHelp') }}
        div(class="fb-actions")
          AdvButton(v-if="level === 'hints' && !revealed && hintN < 3" tone="blau" @click="nextHint") {{ t('app.bingo.nextHint') }}
          AdvButton(v-if="level === 'hints' && !revealed" tone="blau" @click="reveal") {{ t('app.bingo.reveal') }}
          AdvButton(v-if="revealed" tone="gold" @click="nextPerson") {{ hostLast ? t('app.bingo.finish') : t('app.bingo.nextPerson') }}
        div(v-if="called.length" class="fb-called")
          span(class="fb-called-title") {{ t('app.bingo.calledSoFar') }}
          span(class="fb-called-list") {{ called.map(nameOf).join(', ') }}
        div(class="fb-host-card")
          p(class="fb-count fb-center-text") {{ t('app.bingo.hostPlays') }}
          BingoGrid(:card="card" :marked="marked" @toggle="toggle")
          AdvButton(tone="gold" @click="hostBingo") {{ t('app.bingo.bingo') }}
          p(v-if="hostMessage" class="fb-note fb-center-text" role="status") {{ hostMessage === 'yes' ? t('app.bingo.callAloud') : t('app.bingo.notYet') }}
        button(type="button" class="fb-link" @click="phase = 'setup'") {{ t('app.bingo.leave') }}

      //- ===== a card at the table =====
      div(v-else-if="phase === 'card'" class="fb-card fb-split")
        p(class="fb-explain") {{ t('app.bingo.cardHelp') }}
        BingoGrid(class="fb-grid-slot" :card="card" :marked="marked" @toggle="toggle")
        AdvButton(tone="gold" @click="sayBingo") {{ t('app.bingo.bingo') }}
        p(v-if="tableMessage" class="fb-note fb-center-text" role="status") {{ lineOnCard ? t('app.bingo.callAloud') : t('app.bingo.notYet') }}
        div(class="fb-row")
          button(type="button" class="fb-link" @click="newCard") {{ t('app.bingo.newCard') }}
          button(type="button" class="fb-link" @click="phase = 'setup'") {{ t('app.bingo.leave') }}

      //- ===== several phones: ready ... =====
      div(v-else-if="phase === 'ready'" class="fb-card fb-center")
        p(class="fb-count") {{ t('app.bingo.roundCode') }}
        p(class="fb-code") {{ showCode(roundCode) }}
        p(class="fb-explain") {{ t(`app.bingo.levelText_${level}`) }}
        p(class="fb-explain") {{ t('app.bingo.readyText') }}
        BingoGrid(class="fb-preview" :card="card" :marked="marked" readonly)
        AdvButton(tone="gold" @click="go") {{ t('app.bingo.go') }}
        button(type="button" class="fb-link" @click="phase = 'setup'") {{ t('app.bingo.leave') }}

      //- ... and the game: this phone calls the people by itself
      div(v-else-if="phase === 'live'" class="fb-card fb-split")
        div(class="fb-live")
          p(class="fb-count") {{ t('app.bingo.callOf', { n: Math.min(step2 + 1, liveOrder.length), total: liveOrder.length }) }} · {{ t('app.bingo.nextIn', { n: secondsLeft }) }}
          template(v-if="liveRevealed")
            h2(class="fb-person") {{ nameOf(livePerson) }}
          p(v-else class="fb-hint-title") {{ t('app.bingo.hintN', { n: liveHints }) }}
          ul(v-if="level === 'hints'" class="fb-hints")
            li(v-for="n in (liveRevealed ? 3 : liveHints)" :key="n") {{ factsOf(livePerson)[n - 1] }}
        BingoGrid(class="fb-grid-slot" :card="card" :marked="marked" @toggle="toggle")
        AdvButton(tone="gold" @click="callBingo") {{ t('app.bingo.bingo') }}
        p(v-if="wrongTry" class="fb-error fb-center-text" role="alert") {{ t('app.bingo.notTrue') }}
        div(v-if="revealedLive.length" class="fb-called")
          span(class="fb-called-title") {{ t('app.bingo.calledSoFar') }}
          span(class="fb-called-list") {{ revealedLive.map(nameOf).join(', ') }}
        button(type="button" class="fb-link" @click="leave") {{ t('app.bingo.leave') }}

      div(v-else-if="phase === 'won'" class="fb-card fb-center")
        h2(class="fb-person") {{ t('app.bingo.won') }}
        p(class="fb-explain") {{ t('app.bingo.wonText', { n: wonAt }) }}
        BingoGrid(class="fb-preview" :card="card" :marked="marked" readonly)
        AdvButton(tone="gold" @click="phase = 'setup'") {{ t('app.bingo.again') }}

      div(v-else class="fb-card fb-center")
        h2(class="fb-person") {{ t('app.bingo.over') }}
        p(class="fb-explain") {{ t('app.bingo.overText') }}
        AdvButton(tone="gold" @click="phase = 'setup'") {{ t('app.bingo.again') }}

    div(class="h-32")
</template>

<style scoped lang="sass">
.app-page
  background-color: var(--color-bg-main)
  color: var(--color-text-primary)

.fb-wrap
  display: grid
  grid-template-columns: minmax(0, 1fr)
  gap: 12px
  max-width: 36rem
  margin: 14px auto 0
  padding: 0 16px

.fb-card
  display: flex
  flex-direction: column
  gap: 8px
  padding: 18px 16px 20px
  border-radius: 24px
  background: var(--lk-surface)
  border: 1px solid var(--lk-line)
  box-shadow: var(--lk-shadow)

.fb-center
  align-items: center
  text-align: center

.fb-center-text
  text-align: center

.fb-explain
  margin: 0
  line-height: 1.5

.fb-h
  margin: 10px 0 0
  font-size: 1rem
  font-weight: 800

.fb-note
  margin: 4px 0 6px
  color: var(--lk-muted)
  line-height: 1.4

.fb-error
  margin: 0
  color: #c8553d
  font-weight: 700
  line-height: 1.4

.fb-chips
  display: flex
  flex-wrap: wrap
  gap: 8px

.fb-chip
  flex: 1 1 120px
  min-height: 48px
  padding: 4px 10px
  border: 1px solid var(--lk-line)
  border-radius: 16px
  background: var(--lk-surface-2)
  color: var(--lk-text)
  font: inherit
  font-weight: 800
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  &.is-on
    background: var(--lk-accent)
    border-color: var(--lk-accent)
    color: var(--lk-on-accent)

.fb-input
  width: 100%
  min-height: 46px
  padding: 0 14px
  border: 1px solid var(--lk-line)
  border-radius: 14px
  background: var(--lk-bg)
  color: var(--lk-text)
  font: inherit
  font-size: 1.3rem
  font-weight: 800
  letter-spacing: 0.12em
  text-align: center
  text-transform: uppercase

.fb-count
  margin: 0
  font-size: 0.85rem
  color: var(--lk-muted)

.fb-code
  margin: 0
  padding: 8px 26px
  border-radius: 999px
  background: rgba(230, 184, 64, 0.25)
  box-shadow: inset 0 0 0 1px #e0bd62
  font-size: 2rem
  font-weight: 900
  letter-spacing: 0.14em

.fb-person
  margin: 8px 0
  font-size: 2rem
  font-weight: 900
  line-height: 1.15
  overflow-wrap: anywhere

.fb-hint-title
  margin: 6px 0 0
  padding: 3px 14px
  border-radius: 999px
  background: rgba(230, 184, 64, 0.25)
  font-weight: 800

.fb-hints
  width: 100%
  margin: 6px 0
  padding: 10px 14px 10px 32px
  border-radius: 16px
  background: rgba(230, 184, 64, 0.2)
  text-align: left
  display: grid
  gap: 4px
  line-height: 1.4

.fb-live
  display: flex
  flex-direction: column
  align-items: center
  text-align: center
  min-height: 170px

.fb-preview
  width: 100%

.fb-host-card
  display: grid
  gap: 8px
  width: 100%
  margin-top: 6px

.fb-tools
  display: flex
  justify-content: flex-end

.fb-rotate
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

// the phone lies on its side: the call (and the buttons) on the left, the card, as big as the height allows, on the right
@media (orientation: landscape) and (max-height: 700px)
  .fb-wrap
    max-width: none
    margin-top: 6px
    padding: 0 10px

  .fb-split
    display: grid
    grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr)
    column-gap: 14px
    align-content: start
    align-items: start
    text-align: left
    padding: 10px 12px
    gap: 6px

    > *
      grid-column: 1

    // the explaining lines make room for the card
    .fb-note:not(.fb-center-text)
      display: none

    .fb-person
      margin: 2px 0
      font-size: 1.5rem

    > .fb-grid-slot,
    > .fb-host-card
      grid-column: 2
      grid-row: 1 / span 30
      --bg-ratio: 1.15 / 1
      width: min(100%, calc((100dvh - 60px) * 1.1))
      justify-self: center
      margin-top: 0
      position: sticky
      top: 6px

.fb-actions
  display: grid
  gap: 10px
  width: 100%

.fb-called
  display: grid
  gap: 2px
  width: 100%
  padding: 8px 12px
  border-radius: 14px
  background: var(--lk-surface-2)
  text-align: left

.fb-called-title
  font-size: 0.74rem
  font-weight: 800
  letter-spacing: 0.04em
  text-transform: uppercase
  color: var(--lk-muted)

.fb-called-list
  font-size: 0.9rem
  line-height: 1.4

.fb-row
  display: flex
  justify-content: center
  gap: 18px

.fb-link
  align-self: center
  min-height: 36px
  padding: 0 10px
  border: none
  background: transparent
  color: var(--lk-muted)
  font: inherit
  font-weight: 700
  text-decoration: underline
  cursor: pointer
</style>
