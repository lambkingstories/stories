<script setup lang="ts">
/**
 * The Wortreise (Plus), a family game on the old map: a circle of letters and a crossword of Bible words. The people take turns on one device
 * (or one person plays alone): whoever is on turn draws a word over the letters with a finger. A word of the grid fills its squares, gives
 * points and ends the turn; a word that is not in the grid but is a good word gives bonus points and the turn goes on; with "pass" the turn
 * goes to the next person. A few helps (a shown letter) are shared by everybody. Every filled grid takes the group one place further on
 * the journey of the people of Israel (Mara to Jericho), and the person who fills the last square gets a bonus. The rules and the puzzles are
 * in `utils/wortreise.ts` and `utils/wortreiseGame.ts` (the same seed gives the same puzzles; every puzzle is proven solvable by the tests).
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
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
import WortreiseWheel from '@/components/molecules/wortreise/WortreiseWheel.vue'
import WortreiseGrid from '@/components/molecules/wortreise/WortreiseGrid.vue'
import WortreiseJourney from '@/components/molecules/wortreise/WortreiseJourney.vue'
import { PREMIUM_TEASER, hasFeature, showUpsell } from '@/use/usePremium'
import useFamilySave from '@/use/useFamilySave'
import useSfx from '@/use/useSfx'
import useUserName from '@/use/useUserName'
import { goBackTo } from '@/utils/navBack'
import { ranking } from '@/utils/familyQuiz'
import {
  WR_LEVELS,
  WR_MAX_PLAYERS,
  WR_STAGE_CHOICES,
  cellsOf,
  filledCells,
  mixCircle,
  wordInfo,
  type WrLang,
  type WrLevel
} from '@/utils/wortreise'
import {
  WR_ROUTES,
  endTurn,
  newGame,
  nextStage,
  parseGame,
  pass,
  puzzleOf,
  showLetter,
  submit,
  type WrGame
} from '@/utils/wortreiseGame'

const { t, tm, rt, locale } = useI18n({ useScope: 'global' })
const router = useRouter()
const { displayName, hasCustomName } = useUserName()
const { play } = useSfx()

const lang = computed<WrLang>(() => (locale.value === 'de' || locale.value === 'es' ? locale.value : 'en'))
const T = (key: string, args?: Record<string, unknown>) => t(`app.bigGames.wortreise.${key}`, args ?? {})

interface Snap {
  phase: 'handover' | 'play' | 'stage'
  game: WrGame
  names: string[]
  level: WrLevel
  circle: string[]
}
const save = useFamilySave<Snap>('wortreise', 1)
function keptSnap(): { snap: Snap; game: WrGame } | null {
  const s = save.saved.value
  if (!s || !Array.isArray(s.names) || !Array.isArray(s.circle) || !['handover', 'play', 'stage'].includes(s.phase)) return null
  const game = parseGame(s.game)
  if (!game || game.cfg.lang !== lang.value) return null
  return { snap: s, game }
}
// a kept game of another shape (an older app, another language) is thrown away at once
if (save.saved.value && !keptSnap()) save.clear()

const locked = computed(() => PREMIUM_TEASER && !hasFeature('family'))
const NAMES_KEY = 'lk-family-names'

// ── setup ───────────────────────────────────────────────────────────────────────────────────────────────────────
const names = ref<string[]>(Array.from({ length: WR_MAX_PLAYERS }, () => ''))
const playerCount = ref(2)
const level = ref<WrLevel>('family')
const stages = ref<number>(5)

onMounted(() => {
  let saved: string[] = []
  try {
    const raw = JSON.parse(localStorage.getItem(NAMES_KEY) ?? 'null')
    if (Array.isArray(raw)) saved = raw.filter((x) => typeof x === 'string').slice(0, WR_MAX_PLAYERS)
  } catch {
    // start with the standard names
  }
  names.value = Array.from({ length: WR_MAX_PLAYERS }, (_, i) => saved[i] || (i === 0 && hasCustomName.value ? displayName.value : ''))
  if (saved.filter(Boolean).length >= 1) playerCount.value = Math.min(WR_MAX_PLAYERS, Math.max(1, saved.filter(Boolean).length))
})

const nameOf = (i: number) => names.value[i]?.trim() || t('app.family.player', { n: i + 1 })
const players = computed(() => Array.from({ length: playerCount.value }, (_, i) => nameOf(i)))

// ── the game ────────────────────────────────────────────────────────────────────────────────────────────────────
type Phase = 'setup' | 'handover' | 'play' | 'stage' | 'result'
const phase = ref<Phase>('setup')
const game = ref<WrGame | null>(null)
/** The letters of the circle in the order they are shown (the person can mix them). */
const circle = ref<string[]>([])
const flash = ref<'' | 'ok' | 'bonus' | 'no' | 'again'>('')
/** What the last word did: shown under the grid. */
const message = ref<{ kind: 'info' | 'ok' | 'bonus' | 'again' | 'no' | 'stage'; text: string; sub?: string } | null>(null)
/** The turn is over (a word of the grid was found): the wheel rests until the device is passed on. */
const turnDone = ref(false)
/** The letters that are drawn on the circle now, and whether a word is built by single taps (then the strip has buttons). */
const drawn = ref('')
const tapActive = ref(false)
const wheel = ref<InstanceType<typeof WortreiseWheel> | null>(null)
/** The word that was laid last (it stays in the strip of the circle while the turn is over). */
const lastWord = ref('')
const fresh = ref<string[]>([])
const pulse = ref<string[]>([])
/** A note for the next person (a letter that was shown after everybody passed). */
const note = ref('')
let flashTimer: ReturnType<typeof setTimeout> | undefined
let pulseTimer: ReturnType<typeof setTimeout> | undefined

const g = computed(() => game.value)
/** The strip above the circle: the letters that are drawn, or the word that was laid last while the turn is over. */
const stripWord = computed(() => drawn.value || (turnDone.value ? lastWord.value : ''))
const puzzle = computed(() => (game.value ? puzzleOf(game.value) : null))
const who = computed(() => game.value?.turn ?? 0)
const whoName = computed(() => players.value[who.value] ?? '')
const nextName = computed(() => players.value[((game.value?.turn ?? 0) + 1) % playerCount.value] ?? '')
const filled = computed(() => (puzzle.value && game.value ? filledCells(puzzle.value, game.value.progress) : new Set<string>()))
const placeIdx = computed(() => WR_ROUTES[stages.value] ?? WR_ROUTES[5]!)
const places = computed(() => {
  const all = (tm('app.bigGames.wortreise.places') as unknown as { name: Parameters<typeof rt>[0]; ref: Parameters<typeof rt>[0] }[]) ?? []
  return placeIdx.value.map((i) => ({ name: all[i] ? rt(all[i]!.name) : '', ref: all[i] ? rt(all[i]!.ref) : '' }))
})
const stageNo = computed(() => (game.value ? game.value.stage + 1 : 1))
const stagePlace = computed(() => places.value[game.value?.stage ?? 0])
const isLastStage = computed(() => !!game.value && game.value.stage >= game.value.cfg.stages - 1)
const scorePlayers = computed(() => players.value.map((name, i) => ({ name, score: game.value?.scores[i] ?? 0, index: i, turn: i === who.value })))
const routePlayers = computed(() => players.value.map((name, i) => ({ name, value: game.value?.scores[i] ?? 0, index: i, turn: i === who.value })))
const routeMax = computed(() => Math.max(20, Math.ceil((Math.max(...(game.value?.scores ?? [0])) * 1.3) / 10) * 10))
const bonusFoundCount = computed(() => game.value?.progress.bonusFound.length ?? 0)

const placing = computed(() => {
  const used = new Set<number>()
  return ranking(players.value, game.value?.scores ?? []).map((p) => {
    const index = players.value.findIndex((n, i) => !used.has(i) && n === p.name && (game.value?.scores[i] ?? 0) === p.score)
    used.add(index)
    return { ...p, index: Math.max(0, index) }
  })
})
const winners = computed(() => placing.value.filter((p) => p.rank === 1))
const headline = computed(() =>
  playerCount.value === 1
    ? T('soloEnd', { points: t('app.family.points', game.value?.scores[0] ?? 0) })
    : winners.value.length > 1
      ? t('app.family.winners', { names: winners.value.map((w) => w.name).join(' & ') })
      : t('app.family.winner', { name: winners.value[0]?.name ?? '' })
)
const rows = computed(() => placing.value.map((p) => ({ rank: p.rank, name: p.name, score: t('app.family.points', p.score), index: p.index })))
const totalWords = computed(() => (game.value ? game.value.words.reduce((a, b) => a + b, 0) + game.value.bonusWords.reduce((a, b) => a + b, 0) : 0))

/** Inside a game the arrow leads to the start page of this game (the game stays kept); there it leads to the main menu. */
function goBack() {
  if (phase.value !== 'setup') {
    clearTimeout(flashTimer)
    clearTimeout(pulseTimer)
    phase.value = 'setup'
    return
  }
  goBackTo(router, { name: 'app-family' })
}

// ── keep playing ────────────────────────────────────────────────────────────────────────────────────────────────
function persist() {
  if (!game.value || (phase.value !== 'handover' && phase.value !== 'play' && phase.value !== 'stage')) return
  save.save({ phase: phase.value, game: game.value, names: names.value.map((n) => n.trim()), level: level.value, circle: [...circle.value] })
}
const kept = computed(() => keptSnap())
const keptInfo = computed(() => {
  const k = kept.value
  if (!k) return ''
  const name = k.snap.names[k.game.turn]?.trim() || t('app.family.player', { n: k.game.turn + 1 })
  return T('keptInfo', { n: k.game.stage + 1, total: k.game.cfg.stages, name })
})

function resume() {
  const k = kept.value
  if (!k) {
    save.clear()
    return
  }
  play('tap')
  game.value = k.game
  names.value = Array.from({ length: WR_MAX_PLAYERS }, (_, i) => k.snap.names[i] ?? '')
  playerCount.value = k.game.cfg.players
  level.value = k.game.cfg.level
  stages.value = k.game.cfg.stages
  circle.value = k.snap.circle.length === puzzleOf(k.game).circle.length ? [...k.snap.circle] : [...puzzleOf(k.game).circle]
  resetPlayState()
  phase.value = k.snap.phase
  if (phase.value === 'stage') message.value = null
}

function resetPlayState() {
  clearTimeout(flashTimer)
  clearTimeout(pulseTimer)
  flash.value = ''
  message.value = null
  lastWord.value = ''
  turnDone.value = false
  fresh.value = []
  pulse.value = []
}

function start() {
  try {
    localStorage.setItem(NAMES_KEY, JSON.stringify(names.value.map((n) => n.trim())))
  } catch {
    // the names are not remembered in a private window
  }
  const seed = Math.floor(Math.random() * 4294967296)
  game.value = newGame({ lang: lang.value, level: level.value, players: playerCount.value, stages: stages.value, seed })
  circle.value = [...puzzleOf(game.value).circle]
  note.value = ''
  resetPlayState()
  phase.value = 'handover'
  persist()
}

function go() {
  play('tap')
  resetPlayState()
  phase.value = 'play'
  message.value = { kind: 'info', text: T('startHint') }
  persist()
}

function setFlash(f: 'ok' | 'bonus' | 'no' | 'again') {
  flash.value = f
  clearTimeout(flashTimer)
  flashTimer = setTimeout(() => (flash.value = ''), f === 'ok' || f === 'bonus' ? 1500 : 700)
}

/** The squares that are new in `after` (in the order of the words), for the dropping tiles. */
function newCells(before: Set<string>, after: WrGame): string[] {
  const p = puzzleOf(after)
  const out: string[] = []
  const f = filledCells(p, after.progress)
  for (const w of p.words) for (const [r, c] of cellsOf(w)) {
    const id = `${r},${c}`
    if (f.has(id) && !before.has(id) && !out.includes(id)) out.push(id)
  }
  return out
}

/** A word was drawn on the circle. */
function onWord(word: string) {
  const cur = game.value
  if (!cur || turnDone.value) return
  const before = filled.value
  const m = submit(cur, word)
  const info = wordInfo(lang.value, word)
  if (m.result === 'no') {
    setFlash('no')
    play('familyWrong')
    message.value = { kind: 'no', text: T('no') }
    return
  }
  if (m.result === 'again') {
    setFlash('again')
    play('tap')
    const w = puzzleOf(cur).words.find((x) => x.key === word)
    if (w) {
      pulse.value = cellsOf(w).map(([r, c]) => `${r},${c}`)
      clearTimeout(pulseTimer)
      pulseTimer = setTimeout(() => (pulse.value = []), 1500)
    }
    message.value = { kind: 'again', text: T('again') }
    return
  }
  game.value = m.game
  if (m.result === 'bonus') {
    setFlash('bonus')
    play('coin')
    message.value = { kind: 'bonus', text: T('bonus', { word: info?.show ?? word, points: m.points }), sub: info?.ref ? T('standsIn', { ref: info.ref }) : '' }
    persist()
    return
  }
  // a word of the grid: the squares fill, the turn is over
  setFlash('ok')
  fresh.value = newCells(before, m.game)
  turnDone.value = true
  lastWord.value = word
  play(m.stageDone ? 'fanfare' : 'familyRight')
  message.value = {
    kind: m.stageDone ? 'stage' : 'ok',
    text: m.stageDone ? T('stageDoneWord', { word: info?.show ?? word, points: m.points }) : T('found', { word: info?.show ?? word, points: m.points }),
    sub: info?.ref ? T('standsIn', { ref: info.ref }) : ''
  }
  persist()
}

function onTick(n: number) {
  // a little scale of marimba tones goes up with every letter
  if (n <= 0) return
  const scale = [1, 1.122, 1.26, 1.498, 1.682, 2]
  play('bead', 0.7, scale[(n - 1) % scale.length]! * (n > 6 ? 2 : 1))
}

function mix() {
  if (turnDone.value) return
  play('tap')
  circle.value = mixCircle(circle.value)
  persist()
}

function lens() {
  const cur = game.value
  if (!cur || turnDone.value) return
  if (cur.hints <= 0) {
    play('familyWrong')
    message.value = { kind: 'no', text: T('noLens') }
    return
  }
  const m = showLetter(cur)
  if (!m.cell) return
  game.value = m.game
  fresh.value = [`${m.cell[0]},${m.cell[1]}`]
  play('star')
  if (m.stageDone) {
    turnDone.value = true
    setFlash('ok')
    play('fanfare')
    message.value = { kind: 'stage', text: T('stageDoneLens') }
  } else {
    message.value = { kind: 'info', text: T('letterShown') }
  }
  persist()
}

/** The person passes the turn. When everybody passed one after the other, a letter is shown for free. */
function passTurn() {
  const cur = game.value
  if (!cur || turnDone.value) return
  play('tap')
  const m = pass(cur)
  if (m.freeLetter && m.cell) {
    fresh.value = [`${m.cell[0]},${m.cell[1]}`]
    game.value = m.stageDone ? m.game : endTurn(m.game)
    if (m.stageDone) {
      turnDone.value = true
      setFlash('ok')
      play('fanfare')
      message.value = { kind: 'stage', text: T('stageDoneLens') }
      persist()
      return
    }
    note.value = playerCount.value === 1 ? T('freeLetterAlone') : T('freeLetter')
  } else {
    game.value = endTurn(m.game)
    note.value = ''
  }
  resetPlayState()
  if (playerCount.value === 1) {
    // alone: the same person goes on (the letter that was shown, if there is one, is in the grid)
    phase.value = 'play'
    message.value = { kind: 'info', text: note.value || T('startHint') }
  } else phase.value = 'handover'
  persist()
}

/** After a word of the grid: to the next person, or to the stage that is done. */
function proceed() {
  const cur = game.value
  if (!cur) return
  play('tap')
  if (puzzleDoneNow()) {
    phase.value = 'stage'
    play('familyResult')
    persist()
    return
  }
  game.value = endTurn(cur)
  note.value = ''
  resetPlayState()
  // a person who plays alone does not need the hand-over
  if (playerCount.value === 1) {
    phase.value = 'play'
    message.value = { kind: 'info', text: T('startHint') }
  } else phase.value = 'handover'
  persist()
}

function puzzleDoneNow(): boolean {
  const cur = game.value
  if (!cur) return false
  return cur.stageWinners.length > cur.stage
}

/** From the finished stage to the next puzzle, or to the end of the journey. */
function afterStage() {
  const cur = game.value
  if (!cur) return
  play('tap')
  const done = nextStage(cur)
  if (done.over) {
    game.value = done
    play('familyResult')
    phase.value = 'result'
    save.clear()
    return
  }
  game.value = endTurn(done)
  circle.value = [...puzzleOf(game.value).circle]
  note.value = ''
  resetPlayState()
  if (playerCount.value === 1) {
    phase.value = 'play'
    message.value = { kind: 'info', text: T('startHint') }
  } else phase.value = 'handover'
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

onBeforeUnmount(() => {
  clearTimeout(flashTimer)
  clearTimeout(pulseTimer)
})

const levelNames = computed(() => WR_LEVELS.map((l) => ({ id: l, title: T(`level_${l}`), text: T(`levelText_${l}`) })))
const stageWinner = computed(() => (game.value ? (game.value.stageWinners[game.value.stage] ?? game.value.turn) : 0))
const stageWinnerName = computed(() => players.value[stageWinner.value] ?? '')
</script>

<template lang="pug">
  MapTable(:title="T('title')" @back="goBack")
    //- ===== Plus ====================================================================================================
    div(v-if="locked" class="wr-stack")
      MapPaper(kind="card")
        p(class="wr-text") {{ T('locked') }}
      MapButton(@click="showUpsell('family')") {{ t('app.family.lockedButton') }}

    //- ===== setup: the seats, the level, the length of the journey ==================================================
    div(v-else-if="phase === 'setup'" class="wr-setup")
      div(v-if="kept" class="wr-resume")
        MapResume(:info="keptInfo" @resume="resume")
      p(class="wr-sub") {{ T('sub') }}
      div(class="wr-part")
        MapSeats(v-model:count="playerCount" v-model:names="names" :max="WR_MAX_PLAYERS" :question="T('howMany')")
      div(class="wr-part")
        section(class="wr-sec")
          h2(class="wr-h") {{ T('levelHead') }}
          div(class="wr-levels" role="radiogroup")
            button(
              v-for="l in levelNames"
              :key="l.id"
              type="button"
              role="radio"
              :aria-checked="level === l.id"
              class="wr-level"
              @click="level = l.id; play('tap')"
            )
              MapPaper(kind="strip" :lit="level === l.id")
                span(class="wr-level-in")
                  span(class="wr-level-t") {{ level === l.id ? '✓ ' : '' }}{{ l.title }}
                  span(class="wr-level-s") {{ l.text }}
        section(class="wr-sec")
          h2(class="wr-h") {{ T('stagesHead') }}
          div(class="wr-marks" role="radiogroup")
            button(v-for="n in WR_STAGE_CHOICES" :key="n" type="button" role="radio" :aria-checked="stages === n" :class="['wr-mark', { 'is-on': stages === n }]" @click="stages = n; play('tap')") {{ n }}
        p(class="wr-note") {{ T('rule') }}
        div(class="wr-go")
          MapButton(@click="play('button'); start()") {{ t('app.family.start') }}

    //- ===== whose turn ==============================================================================================
    div(v-else-if="phase === 'handover' && g" class="wr-stack")
      p(class="wr-count") {{ T('stageOf', { n: stageNo, total: g.cfg.stages }) }}
      MapToken(:index="who" :size="92" lit class="wr-hero")
      h2(class="wr-big") {{ t('app.family.turn', { name: whoName }) }}
      p(v-if="playerCount > 1" class="wr-note") {{ T('handover', { name: whoName }) }}
      p(v-if="note" class="wr-note wr-note--gold") {{ note }}
      div(class="wr-wide")
        WortreiseJourney(:places="places" :current="g.stage" :winners="g.stageWinners")
      MapRoute(v-if="playerCount > 1" :players="routePlayers" :max="routeMax" class="wr-wide")
      MapButton(@click="go") {{ t('app.family.start') }}

    //- ===== the puzzle ==============================================================================================
    div(v-else-if="phase === 'play' && g && puzzle" class="wr-play")
      div(class="wr-head")
        MapScoreBar(:players="scorePlayers")
        p(class="wr-where") {{ T('stageOf', { n: stageNo, total: g.cfg.stages }) }} · {{ stagePlace?.name }}
      div(class="wr-gridarea" :style="{ '--wr-min': puzzle.rows * 28 + 'px' }")
        WortreiseGrid(:puzzle="puzzle" :filled="filled" :fresh="fresh" :shown="g.progress.shown" :pulse="pulse" :max="g.cfg.level === 'kids' ? 64 : 52")
      div(class="wr-talk")
        div(:class="['wr-msg', message ? 'is-' + message.kind : '']" aria-live="polite")
          span(v-if="message" class="wr-msg-t") {{ message.text }}
          span(v-if="message && message.sub" class="wr-msg-s") {{ message.sub }}
        div(:class="['wr-word', 'is-' + (flash || 'idle')]" aria-live="polite")
          span(v-for="(ch, i) in stripWord" :key="i" class="wr-wl") {{ ch }}
          span(v-if="!stripWord && !turnDone" class="wr-hint") {{ T('drawHint') }}
          button(v-if="tapActive && drawn" type="button" class="wr-mini" :aria-label="T('undo')" @click="wheel?.undo()") ⌫
          button(v-if="tapActive && drawn.length >= 3" type="button" class="wr-mini wr-mini--ok" :aria-label="T('lay')" @click="wheel?.send()") ✓
      div(class="wr-wheelbox")
        WortreiseWheel(ref="wheel" :letters="circle" :disabled="turnDone" :bad="flash === 'no'" @submit="onWord" @mix="mix" @tick="onTick" @word="drawn = $event" @taps="tapActive = $event")
      div(class="wr-actions")
        template(v-if="!turnDone")
          button(type="button" class="wr-act" :disabled="g.hints <= 0" :aria-label="T('lens')" @click="lens")
            svg(viewBox="0 0 24 24" width="22" height="22" aria-hidden="true")
              circle(cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" stroke-width="2")
              path(d="m15 15 5.5 5.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round")
            span {{ T('lens') }} · {{ g.hints }}
          span(class="wr-bonus" :aria-label="T('bonusCount', { n: bonusFoundCount })") ✦ {{ bonusFoundCount }}
          button(type="button" class="wr-act" @click="passTurn")
            span {{ T('pass') }}
        template(v-else)
          MapButton(@click="proceed") {{ puzzleDoneNow() || playerCount === 1 ? T('toStage') : T('nextFor', { name: nextName }) }}

    //- ===== a stage is done ==========================================================================================
    div(v-else-if="phase === 'stage' && g && puzzle" class="wr-stack wr-stagedone")
      h2(class="wr-big") {{ T('stageDone') }}
      div(class="wr-gridarea wr-gridarea--small")
        WortreiseGrid(:puzzle="puzzle" :filled="filled" :all="true" :max="40")
      MapPaper(kind="strip" class="wr-place")
        span(class="wr-place-in")
          MapToken(:index="stageWinner" :size="34" lit)
          span(class="wr-place-t")
            span(class="wr-place-n") {{ T('reached', { place: stagePlace?.name ?? '' }) }}
            span(v-if="stagePlace?.ref" class="wr-place-r") {{ stagePlace?.ref }}
      p(v-if="playerCount > 1" class="wr-note") {{ T('filledBy', { name: stageWinnerName }) }}
      div(class="wr-wide")
        WortreiseJourney(:places="places" :current="g.stage + 1" :winners="g.stageWinners")
      MapButton(@click="afterStage") {{ isLastStage ? t('app.family.result') : T('nextStage') }}

    //- ===== the end ==================================================================================================
    div(v-else class="wr-stack")
      MapResult(:headline="headline" :rows="rows" :winner-index="winners[0]?.index")
        p(class="wr-note") {{ T('journeyEnd', { place: places[places.length - 1]?.name ?? '', n: totalWords }) }}
        MapButton(@click="again") {{ t('app.family.again') }}
        MapButton(quiet @click="change") {{ T('change') }}
</template>

<style scoped lang="sass">
$ink: #3a2812
$light: #1f3a36
$shade: none

.wr-stack
  display: flex
  flex-direction: column
  align-items: center
  gap: 14px
  width: 100%
  max-width: 28rem
  margin: 0 auto
  padding-top: 8px
  text-align: center

.wr-text
  margin: 0
  line-height: 1.4

.wr-sub, .wr-note, .wr-count
  margin: 0
  text-align: center
  color: $light
  text-shadow: $shade
  line-height: 1.35

.wr-sub
  font-size: 1.1rem
  font-style: italic

.wr-note
  font-size: 1rem

.wr-note--gold
  color: #ffe08a

.wr-count
  font-size: 0.95rem
  letter-spacing: 0.12em
  text-transform: uppercase

.wr-big
  margin: 0
  font-size: 1.7rem
  font-weight: 800
  line-height: 1.15
  text-align: center
  color: $light
  text-shadow: $shade

.wr-wide
  width: 100%

.wr-hero
  margin: 8px 0 2px

// ── setup ──
.wr-setup
  display: flex
  flex-direction: column
  gap: 14px
  width: 100%
  max-width: 30rem
  margin: 0 auto
  padding-top: 4px

.wr-part
  display: flex
  flex-direction: column
  gap: 12px

.wr-sec
  display: flex
  flex-direction: column
  gap: 8px

.wr-h
  margin: 0
  font-size: 1.15rem
  font-weight: 800
  text-align: center
  color: $light
  text-shadow: $shade

.wr-levels
  display: flex
  flex-direction: column
  gap: 8px

.wr-level
  display: block
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

.wr-level-in
  display: flex
  align-items: baseline
  justify-content: space-between
  gap: 10px
  width: 100%
  text-align: left

.wr-level-t
  font-size: 1.15rem
  font-weight: 800

.wr-level-s
  font-size: 0.95rem
  font-weight: 600
  color: #6b5230
  text-align: right

.wr-marks
  display: flex
  justify-content: center
  gap: 9px

// a brass mark: a round plate of bronze with the number
.wr-mark
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

.wr-go
  display: flex
  justify-content: center
  padding-top: 6px

@media (orientation: landscape)
  .wr-resume
    grid-column: 1 / -1

  .wr-setup
    display: grid
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr)
    max-width: 52rem
    gap: 6px 22px
    align-items: start

  .wr-sub
    display: none

  .wr-part
    gap: 8px

  .wr-go
    padding-top: 0

// ── the puzzle: the grid above, the circle below (turned phone: the grid on the left, the circle on the right) ──
.wr-play
  --wr-wheel: max(236px, min(78vw, 280px, 33dvh))
  display: flex
  flex-direction: column
  gap: 6px
  width: 100%
  height: 100%
  max-width: 34rem
  margin: 0 auto

.wr-head
  display: flex
  flex-direction: column
  align-items: center
  gap: 4px
  flex: none

.wr-where
  margin: 0
  font-size: 1rem
  font-weight: 700
  text-align: center
  color: $light
  text-shadow: $shade

.wr-gridarea
  position: relative
  flex: 1 0 auto
  min-height: var(--wr-min, 110px)
  width: 100%

.wr-gridarea--small
  flex: none
  height: 190px

.wr-talk
  display: flex
  flex-direction: column
  align-items: center
  gap: 6px
  flex: none
  width: 100%

.wr-msg
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  gap: 1px
  min-height: 40px
  width: 100%
  padding: 2px 10px
  text-align: center
  color: $light
  text-shadow: $shade
  line-height: 1.2

  &.is-ok, &.is-stage
    color: #fff3cf

  &.is-bonus
    color: #ffe08a

  &.is-no
    color: #f4c2b8

.wr-msg-t
  font-size: 1.1rem
  font-weight: 800

.wr-msg-s
  font-size: 0.95rem
  font-style: italic
  opacity: 0.9

// the word that is being drawn, as ivory tiles on a dark strip
.wr-word
  display: flex
  align-items: center
  justify-content: center
  gap: 4px
  min-height: 44px
  min-width: min(15rem, 80%)
  max-width: 100%
  padding: 3px 10px
  border-radius: 999px
  border: 1px solid rgba(226, 189, 102, 0.45)
  background: rgba(28, 19, 10, 0.7)
  box-shadow: inset 0 1px 6px rgba(0, 0, 0, 0.6), 0 2px 5px rgba(0, 0, 0, 0.4)
  transition: background 0.25s, border-color 0.25s

  &.is-ok
    border-color: #ffe08a
    background: rgba(80, 112, 40, 0.85)

  &.is-bonus
    border-color: #ffe08a
    background: rgba(120, 82, 24, 0.9)

  &.is-no
    border-color: #e29a8c
    background: rgba(120, 36, 28, 0.82)
    animation: wr-shake 0.4s

  &.is-again
    border-color: #f0e0b0
    background: rgba(90, 80, 60, 0.85)

.wr-wl
  display: grid
  place-items: center
  min-width: 1.5em
  height: 1.5em
  padding: 0 4px
  border-radius: 6px
  background: linear-gradient(#fbf3de, #e3cf9d)
  color: #3a2812
  font-size: 1.15rem
  font-weight: 800
  box-shadow: 0 1px 0 #fff6d8 inset, 0 2px 3px rgba(0, 0, 0, 0.5)
  animation: wr-pop 0.16s ease-out

.wr-hint
  color: rgba(246, 234, 208, 0.7)
  font-size: 0.95rem
  font-style: italic
  text-align: center
  line-height: 1.15

.wr-mini
  display: grid
  place-items: center
  flex: none
  width: 36px
  height: 36px
  margin-left: 4px
  border-radius: 50%
  border: 2px solid #f3d98a
  background: radial-gradient(circle at 35% 30%, #c79a45, #7d5a22 70%)
  color: #fff3cf
  font-size: 1.1rem
  cursor: pointer

  &--ok
    background: radial-gradient(circle at 35% 30%, #8fb85a, #4b6e22 70%)

@keyframes wr-pop
  from
    transform: scale(0.6)
    opacity: 0.4

  to
    transform: scale(1)
    opacity: 1

@keyframes wr-shake
  0%, 100%
    transform: translateX(0)
  20%
    transform: translateX(-7px)
  40%
    transform: translateX(6px)
  60%
    transform: translateX(-4px)
  80%
    transform: translateX(3px)

.wr-wheelbox
  width: 100%
  display: flex
  justify-content: center

.wr-actions
  display: flex
  align-items: center
  justify-content: center
  gap: 12px
  min-height: 72px
  width: 100%

.wr-act
  display: inline-flex
  align-items: center
  justify-content: center
  gap: 7px
  min-width: 112px
  height: 48px
  padding: 0 16px
  border-radius: 999px
  border: 2px solid #f3d98a
  background: radial-gradient(circle at 35% 30%, #c79a45, #7d5a22 70%, #4d3513)
  box-shadow: 0 0 0 2px rgba(28, 18, 6, 0.9), 0 3px 8px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 240, 190, 0.7)
  color: #fff3cf
  font-family: var(--mp-serif, Georgia, serif)
  font-size: 1.05rem
  font-weight: 800
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  &:active:not(:disabled)
    transform: translateY(2px)

  &:disabled
    filter: grayscale(0.8) brightness(0.7)
    cursor: default

.wr-bonus
  min-width: 3.2em
  text-align: center
  color: #ffe08a
  font-size: 1.1rem
  font-weight: 800
  text-shadow: $shade

// ── a stage is done ──
.wr-stagedone
  gap: 12px

.wr-place
  :deep(.mpa-in)
    padding: 8px 6% 8px 12%

.wr-place-in
  display: flex
  align-items: center
  gap: 10px
  width: 100%
  text-align: left

.wr-place-t
  display: flex
  flex-direction: column
  min-width: 0

.wr-place-n
  font-size: 1.15rem
  font-weight: 800
  line-height: 1.15

.wr-place-r
  font-size: 0.95rem
  font-style: italic
  color: #6b5230

// a small phone held upright: everything a little closer together
@media (max-height: 720px) and (orientation: portrait)
  .wr-play
    --wr-wheel: max(222px, min(78vw, 280px, 33dvh))
    gap: 3px

  .wr-actions
    min-height: 58px

    :deep(.mb)
      height: 54px

  .wr-msg
    min-height: 30px

  .wr-act
    height: 44px

// a tablet held upright: a bigger circle and a bigger grid
@media (min-width: 700px) and (orientation: portrait)
  .wr-play
    --wr-wheel: min(52vw, 380px, 36dvh)
    max-width: 44rem

@media (orientation: landscape)
  .wr-play
    --wr-wheel: max(210px, min(calc(100dvh - 132px), 296px))
    display: grid
    grid-template-columns: minmax(0, 1fr) minmax(0, 300px)
    grid-template-rows: auto minmax(0, 1fr) auto
    grid-template-areas: "head wheel" "grid wheel" "talk act"
    gap: 2px 14px
    max-width: 62rem

  .wr-head
    grid-area: head
    flex-direction: row
    flex-wrap: wrap
    justify-content: center
    align-items: center
    gap: 2px 14px

  .wr-where
    font-size: 0.95rem

  .wr-gridarea
    grid-area: grid
    min-height: 0

  .wr-talk
    grid-area: talk
    flex-direction: row
    justify-content: center
    gap: 10px

  .wr-wheelbox
    grid-area: wheel
    align-items: center

  .wr-actions
    grid-area: act
    min-height: 48px
    gap: 8px

  .wr-act
    min-width: 0
    height: 42px
    padding: 0 12px

  .wr-actions :deep(.mb)
    height: 50px
    min-width: 0
    padding: 0 22px
    font-size: 1.05rem

  .wr-msg
    min-height: 0
    width: auto
    flex: 1
    min-width: 0
    overflow: hidden

  .wr-msg-t
    max-width: 100%
    overflow: hidden
    text-overflow: ellipsis
    white-space: nowrap
    font-size: 1rem

  .wr-msg-s
    display: none

  .wr-word
    min-width: 0
    min-height: 40px
    flex: none

@media (prefers-reduced-motion: reduce)
  .wr-level
    transition: none

  .wr-word.is-no
    animation: none
</style>
