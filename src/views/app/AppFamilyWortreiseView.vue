<script setup lang="ts">
/**
 * The Wortreise (Plus), a family game in the light look of "Familien-Spiele v2" (see components/molecules/family/): a circle of letters and a crossword of
 * Bible words. The course of a real game: the title screen (`start`: painted picture, name, "Play", "How to play", "Continue"), the players page (`lobby`:
 * one to six people with figures and names, the level, the number of stages), then the game with the bar of the game in its colour (`handover`, `play`,
 * `stage`) and the end (`result`: podium). The people take turns on one device
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
import MapToken from '@/components/molecules/map/MapToken.vue'
import FamilyCard from '@/components/molecules/family/FamilyCard.vue'
import FamilyButton from '@/components/molecules/family/FamilyButton.vue'
import FamilyChip from '@/components/molecules/family/FamilyChip.vue'
import FamilyStart from '@/components/molecules/family/FamilyStart.vue'
import FamilyLobby from '@/components/molecules/family/FamilyLobby.vue'
import FamilyGameBar from '@/components/molecules/family/FamilyGameBar.vue'
import FamilyPodium from '@/components/molecules/family/FamilyPodium.vue'
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
/** The five lines of "How to play". */
const rules = computed(() => [1, 2, 3, 4, 5].map((n) => t(`app.bigGames.wortreiseFlow.rule${n}`)))

// ── the game ────────────────────────────────────────────────────────────────────────────────────────────────────
/** The course: title screen, players page, the game (whose turn it is, the puzzle, a stage that is done), the end. */
type Phase = 'start' | 'lobby' | 'handover' | 'play' | 'stage' | 'result'
const phase = ref<Phase>('start')
const playing = computed(() => phase.value === 'handover' || phase.value === 'play' || phase.value === 'stage')
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
/** The chips in the bar of the game: the figure, the name and the points of everybody; the person on turn shines (alone there are no turns). */
const barPlayers = computed(() => players.value.map((name, i) => ({ name, score: game.value?.scores[i] ?? 0, index: i, turn: playerCount.value > 1 && i === who.value })))
const barSub = computed(() => (g.value ? `${T('stageOf', { n: stageNo.value, total: g.value.cfg.stages })} · ${stagePlace.value?.name ?? ''}` : ''))
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
/** The podium: the people by their points; one person alone gets the golden disc and the points in the headline. */
const rows = computed(() => (playerCount.value === 1 ? [] : placing.value.map((p) => ({ rank: p.rank, name: p.name, score: t('app.family.points', p.score), index: p.index }))))
const totalWords = computed(() => (game.value ? game.value.words.reduce((a, b) => a + b, 0) + game.value.bonusWords.reduce((a, b) => a + b, 0) : 0))

/** The bar of the game asked "End the game?" and the person ended it: back to the title screen (the game stays kept, there it can be taken up again). */
function leaveGame() {
  clearTimeout(flashTimer)
  clearTimeout(pulseTimer)
  phase.value = 'start'
}

/** The back button of the table: one step back (players page and end to the title screen), from the title screen to the games. */
function goBack() {
  if (playing.value) {
    leaveGame()
    return
  }
  if (phase.value === 'lobby' || phase.value === 'result') {
    phase.value = 'start'
    return
  }
  goBackTo(router, { name: 'app-family' })
}

/** "To the games": from the end back to the page of the family games. */
function toGames() {
  goBackTo(router, { name: 'app-family' })
}

// ── keep playing ────────────────────────────────────────────────────────────────────────────────────────────────
function persist() {
  if (!game.value || (phase.value !== 'handover' && phase.value !== 'play' && phase.value !== 'stage')) return
  save.save({ phase: phase.value, game: game.value, names: names.value.map((n) => n.trim()), level: level.value, circle: [...circle.value] })
}
const kept = computed(() => keptSnap())
const resumeInfo = computed(() => {
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

onBeforeUnmount(() => {
  clearTimeout(flashTimer)
  clearTimeout(pulseTimer)
})

const levelNames = computed(() => WR_LEVELS.map((l) => ({ id: l, title: T(`level_${l}`), text: T(`levelText_${l}`) })))
const stageWinner = computed(() => (game.value ? (game.value.stageWinners[game.value.stage] ?? game.value.turn) : 0))
const stageWinnerName = computed(() => players.value[stageWinner.value] ?? '')
</script>

<template lang="pug">
  MapTable(title="" game="wortreise" @back="goBack")
    //- ===== the bar of the game (while a journey runs): the colour of the game, the people with their points, leaving asks first =====
    template(v-if="playing && !locked && g" v-slot:top)
      FamilyGameBar(
        game="wortreise"
        :title="T('hub')"
        :subtitle="barSub"
        :players="barPlayers"
        :leave-text="t('app.bigGames.familyFlow.leaveKept')"
        @leave="leaveGame"
      )

    //- ===== the puzzle: the grid above, the circle below (turned phone: the grid on the left, the circle on the right) =====
    div(v-if="!locked && phase === 'play' && g && puzzle" class="wr-play")
      div(class="wr-gridarea" :style="{ '--wr-rows': puzzle.rows }")
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
          FamilyButton(class="wr-act" quiet :disabled="g.hints <= 0" :aria-label="T('lens')" @click="lens")
            svg(viewBox="0 0 24 24" width="22" height="22" aria-hidden="true")
              circle(cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" stroke-width="2")
              path(d="m15 15 5.5 5.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round")
            span {{ T('lens') }} · {{ g.hints }}
          span(class="wr-bonus" :aria-label="T('bonusCount', { n: bonusFoundCount })") ✦ {{ bonusFoundCount }}
          FamilyButton(class="wr-act" quiet @click="passTurn") {{ T('pass') }}
        FamilyButton(v-else class="wr-next" @click="proceed") {{ puzzleDoneNow() || playerCount === 1 ? T('toStage') : T('nextFor', { name: nextName }) }}

    div(v-else class="wr")
      //- ===== Plus: the title screen with the lock =====
      FamilyStart(
        v-if="locked"
        game="wortreise"
        :name="T('hub')"
        :tagline="T('hubSub')"
        @play="showUpsell('family')"
      )
        template(v-slot:extra)
          FamilyCard(compact)
            span(class="wr-fine") {{ T('locked') }}
          FamilyButton(class="wr-lock" quiet @click="showUpsell('family')") {{ t('app.family.lockedButton') }}

      //- ===== 1. the title screen =====
      FamilyStart(
        v-else-if="phase === 'start'"
        game="wortreise"
        :name="T('hub')"
        :tagline="T('hubSub')"
        :rules="rules"
        :resume-info="resumeInfo"
        @play="phase = 'lobby'"
        @resume="resume"
      )

      //- ===== 2. who plays, the level, the length of the journey =====
      FamilyLobby(
        v-else-if="phase === 'lobby'"
        game="wortreise"
        :count="playerCount"
        :names="names"
        :min="1"
        :max="WR_MAX_PLAYERS"
        @update:count="playerCount = $event"
        @update:names="names = $event"
        @go="start"
      )
        template(v-slot:settings)
          FamilyCard(:title="T('levelHead')" symbol="wortreise")
            div(class="wr-levels" role="radiogroup" :aria-label="T('levelHead')")
              FamilyChip(v-for="l in levelNames" :key="l.id" class="wr-level" :selected="level === l.id" @click="level = l.id; play('tap')")
                span(class="wr-level-t") {{ l.title }}
                span(class="wr-level-s") {{ l.text }}
          FamilyCard(:title="T('stagesHead')")
            div(class="wr-marks" role="radiogroup" :aria-label="T('stagesHead')")
              FamilyChip(v-for="n in WR_STAGE_CHOICES" :key="n" round class="wr-mark" :selected="stages === n" @click="stages = n; play('tap')") {{ n }}

      //- ===== whose turn =====
      div(v-else-if="phase === 'handover' && g" class="wr-stack")
        FamilyCard(class="wr-hand")
          MapToken(:index="who" :size="96" lit class="wr-hero")
          h2(class="wr-big") {{ t('app.family.turn', { name: whoName }) }}
          p(v-if="playerCount > 1" class="wr-note") {{ T('handover', { name: whoName }) }}
          p(v-if="note" class="wr-note wr-note--gold") {{ note }}
        FamilyCard(compact class="wr-journey")
          WortreiseJourney(:places="places" :current="g.stage" :winners="g.stageWinners")
        FamilyButton(@click="go") {{ t('app.family.start') }}

      //- ===== a stage is done =====
      div(v-else-if="phase === 'stage' && g && puzzle" class="wr-stack wr-stagedone")
        h2(class="wr-big") {{ T('stageDone') }}
        div(class="wr-gridarea wr-gridarea--small")
          WortreiseGrid(:puzzle="puzzle" :filled="filled" :all="true" :max="40")
        FamilyCard(compact tone="lit" class="wr-place")
          span(class="wr-place-in")
            MapToken(:index="stageWinner" :size="40" lit)
            span(class="wr-place-t")
              span(class="wr-place-n") {{ T('reached', { place: stagePlace?.name ?? '' }) }}
              span(v-if="stagePlace?.ref" class="wr-place-r") {{ stagePlace?.ref }}
        p(v-if="playerCount > 1" class="wr-note") {{ T('filledBy', { name: stageWinnerName }) }}
        FamilyCard(compact class="wr-journey")
          WortreiseJourney(:places="places" :current="g.stage + 1" :winners="g.stageWinners")
        FamilyButton(@click="afterStage") {{ isLastStage ? t('app.family.result') : T('nextStage') }}

      //- ===== 4. the end: the podium =====
      FamilyPodium(
        v-else
        game="wortreise"
        :headline="headline"
        :rows="rows"
        :winner-index="winners[0]?.index ?? 0"
        @again="again"
        @change="phase = 'lobby'"
        @exit="toGames"
      )
        template(v-slot:extra)
          FamilyCard(compact)
            span(class="wr-fine") {{ T('journeyEnd', { place: places[places.length - 1]?.name ?? '', n: totalWords }) }}
</template>

<style scoped lang="sass">
// the pages before and after the puzzle: one column in the middle (the title screen sits in the vertical middle)
.wr
  display: flex
  flex-direction: column
  gap: 16px
  min-height: 100%
  max-width: 36rem
  margin: 0 auto
  padding: 6px 0 24px

@media (orientation: landscape)
  .wr
    max-width: 62rem
    gap: 12px

.wr-fine
  display: block
  width: 100%
  color: var(--fam-muted)
  font-size: 1.02rem
  font-weight: 600
  line-height: 1.35
  text-align: center

.wr-lock
  width: min(100%, 22rem)

// whose turn, a stage that is done: one column of cards in the middle
.wr-stack
  display: flex
  flex-direction: column
  align-items: center
  gap: 14px
  width: 100%
  max-width: 30rem
  // in the column of the page: the cards sit in the vertical middle when they are shorter than the window
  margin: auto
  text-align: center

.wr-hand
  :deep(.fam-card-body)
    padding: 18px 16px 20px

.wr-hero
  margin: 2px 0 0

.wr-big
  margin: 0
  color: var(--fam-ink)
  font-size: 1.7rem
  font-weight: 800
  line-height: 1.15
  text-align: center

.wr-note
  margin: 0
  color: var(--fam-muted)
  font-size: 1.05rem
  font-weight: 600
  line-height: 1.35
  text-align: center

.wr-note--gold
  padding: 6px 14px
  border: 1.5px solid var(--fam-gold)
  border-radius: 16px
  background: color-mix(in srgb, var(--fam-gold) 22%, var(--fam-card))
  color: var(--fam-ink)
  font-weight: 700

.wr-journey
  :deep(.fam-card-body)
    padding: 12px 6px 10px

// ── the players page: the level, the length of the journey ──
.wr-levels
  display: flex
  flex-direction: column
  gap: 10px
  width: 100%
  padding: 4px 4px 2px

.wr-level
  width: 100%
  min-height: 60px
  padding: 8px 14px

  :deep(.fam-chip-text)
    display: flex
    flex-direction: column
    align-items: center
    gap: 1px

.wr-level-t
  display: block
  font-size: 1.15rem
  font-weight: 800

.wr-level-s
  display: block
  font-size: 0.95rem
  font-weight: 600
  opacity: 0.85

.wr-marks
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 14px
  padding-top: 4px

// ── the puzzle: the grid above, the circle below ──
.wr-play
  --wr-wheel: max(236px, min(78vw, 280px, 33dvh))
  --wr-row-h: 28px
  display: flex
  flex-direction: column
  gap: 8px
  width: 100%
  height: 100%
  max-width: 34rem
  margin: 0 auto

// the grid lies on a white card
.wr-gridarea
  position: relative
  box-sizing: border-box
  // the card takes the room that is left (the grid inside is measured and fits it), but is never lower than its rows need
  flex: 1 1 0
  min-height: calc(var(--wr-rows, 4) * var(--wr-row-h, 28px) + 16px)
  width: 100%
  padding: 8px
  border: 1.5px solid var(--fam-line)
  border-radius: var(--fam-r-card)
  background: var(--fam-card)
  box-shadow: var(--fam-shadow)

.wr-gridarea--small
  flex: none
  height: 210px

.wr-talk
  display: flex
  flex-direction: column
  align-items: center
  gap: 6px
  flex: none
  width: 100%

// what the last word did: a soft strip, always with words
.wr-msg
  box-sizing: border-box
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  gap: 1px
  min-height: 48px
  width: 100%
  padding: 4px 12px
  border-radius: 16px
  color: var(--fam-ink)
  text-align: center
  line-height: 1.2
  transition: background-color 0.25s

  &.is-info, &.is-again
    color: var(--fam-muted)

  &.is-ok, &.is-stage
    background: color-mix(in srgb, var(--fam-ok) 16%, var(--fam-card))

  &.is-bonus
    background: color-mix(in srgb, var(--fam-gold) 28%, var(--fam-card))

  &.is-no
    background: color-mix(in srgb, var(--fam-bad) 14%, var(--fam-card))

.wr-msg-t
  font-size: 1.1rem
  font-weight: 800

.wr-msg-s
  font-size: 0.95rem
  font-weight: 600
  opacity: 0.9

// the word that is being drawn: the letters as gold chips in a white strip
.wr-word
  box-sizing: border-box
  display: flex
  align-items: center
  justify-content: center
  gap: 4px
  min-height: 52px
  min-width: min(15rem, 80%)
  max-width: 100%
  padding: 2px 8px
  border: 2px solid var(--fam-line-strong)
  border-radius: 999px
  background: var(--fam-card)
  transition: background-color 0.25s, border-color 0.25s

  &.is-ok
    border-color: var(--fam-ok)
    background: color-mix(in srgb, var(--fam-ok) 12%, var(--fam-card))

  &.is-bonus
    border-color: var(--fam-gold-deep)
    background: color-mix(in srgb, var(--fam-gold) 22%, var(--fam-card))

  &.is-no
    border-color: var(--fam-bad)
    background: color-mix(in srgb, var(--fam-bad) 10%, var(--fam-card))

  &.is-again
    border-color: var(--fam-muted)

.wr-wl
  display: grid
  place-items: center
  min-width: 1.5em
  height: 1.5em
  padding: 0 4px
  border-radius: 8px
  background: var(--fam-gold)
  color: var(--fam-on-gold)
  font-size: 1.15rem
  font-weight: 800
  box-shadow: 0 2px 0 var(--fam-gold-deep)

.wr-hint
  color: var(--fam-muted)
  font-size: 0.95rem
  font-weight: 600
  text-align: center
  line-height: 1.15

// the two round buttons of a word built by taps: take a letter away, lay the word
.wr-mini
  display: grid
  place-items: center
  flex: none
  width: 48px
  height: 48px
  margin-left: 4px
  padding: 0
  border: 2px solid var(--fam-line-strong)
  border-radius: 50%
  background: var(--fam-card)
  color: var(--fam-ink)
  font: inherit
  font-size: 1.2rem
  font-weight: 800
  cursor: pointer
  touch-action: manipulation
  -webkit-tap-highlight-color: transparent

  &--ok
    border-color: var(--fam-primary)
    background: var(--fam-primary)
    color: var(--fam-on-primary)

@media (prefers-reduced-motion: no-preference)
  .wr-wl
    animation: wr-pop 0.16s ease-out

  .wr-word.is-no
    animation: wr-shake 0.4s

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
  gap: 10px
  min-height: 60px
  width: 100%

// the helps under the circle: magnifier, bonus words, pass
.wr-act
  min-width: 0
  min-height: 48px
  padding: 6px 16px
  font-size: 1rem

  :deep(.fam-btn-text)
    display: inline-flex
    align-items: center
    justify-content: center
    gap: 7px

.wr-next
  width: min(100%, 22rem)

.wr-bonus
  min-width: 3.4em
  padding: 6px 12px
  border: 1.5px solid var(--fam-gold)
  border-radius: 999px
  background: color-mix(in srgb, var(--fam-gold) 22%, var(--fam-card))
  color: var(--fam-ink)
  font-size: 1.05rem
  font-weight: 800
  text-align: center

// ── a stage is done ──
.wr-stagedone
  gap: 12px

.wr-place-in
  display: flex
  align-items: center
  justify-content: center
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
  color: var(--fam-muted)
  font-size: 0.95rem
  font-weight: 600

// a small phone held upright: everything a little closer together
@media (max-height: 720px) and (orientation: portrait)
  .wr-play
    --wr-wheel: max(204px, min(78vw, 280px, 33dvh))
    --wr-row-h: 26px
    gap: 4px

  .wr-actions
    min-height: 56px

    :deep(.fam-btn)
      min-height: 52px

  .wr-msg
    min-height: 32px

  .wr-word
    min-height: 48px

// a tablet held upright: a bigger circle and a bigger grid
@media (min-width: 700px) and (orientation: portrait)
  .wr-play
    --wr-wheel: min(52vw, 380px, 36dvh)
    max-width: 44rem

// the phone held wide: the grid on the left, the circle on the right
@media (orientation: landscape)
  .wr-play
    --wr-wheel: max(206px, min(calc(100dvh - 156px), 296px))
    display: grid
    grid-template-columns: minmax(0, 1fr) minmax(0, 300px)
    grid-template-rows: minmax(0, 1fr) auto
    grid-template-areas: "grid wheel" "talk act"
    gap: 6px 14px
    max-width: 62rem

  .wr-gridarea
    grid-area: grid
    min-height: 0

  .wr-gridarea--small
    height: 150px

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
    min-height: 48px
    padding: 4px 12px

  .wr-next
    min-height: 52px
    min-width: 0

  .wr-msg
    min-height: 0
    width: auto
    flex: 1
    min-width: 0
    overflow: hidden

  .wr-msg-t
    max-width: 100%
    overflow: hidden
    // two lines instead of one line cut off with dots (a phone held wide has room for it)
    display: -webkit-box
    -webkit-line-clamp: 2
    -webkit-box-orient: vertical
    font-size: 0.95rem
    line-height: 1.15

  .wr-msg-s
    display: none

  .wr-word
    min-width: 0
    min-height: 48px
    flex: none
</style>
