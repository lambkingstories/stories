<script setup lang="ts">
/**
 * Only in the test build (the Cloudflare test app): puts every stage of every adventure on three stars, so the cards and the big games can
 * be tried at once. The progress from before is kept in one place and can be brought back.
 */
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { journeys } from '@/data/adventures'
import useAdventure from '@/use/useAdventure'
import useBigGames from '@/use/useBigGames'
import { BIG_GAMES } from '@/data/bigGames'

const BACKUP = 'lk-adventure-backup-v1'

const { t } = useI18n({ useScope: 'global' })
const adv = useAdventure()
const games = useBigGames()
const note = ref('')

function hasBackup(): boolean {
  try {
    return localStorage.getItem(BACKUP) !== null
  } catch {
    return false
  }
}
const canRestore = ref(hasBackup())

function unlockAll() {
  try {
    // keep the real progress once (a second tap does not overwrite it with the unlocked one)
    if (!hasBackup()) localStorage.setItem(BACKUP, JSON.stringify({ adventure: adv.state, games: games.snapshot() }))
  } catch {
    // a private window: no backup
  }
  const all: Record<string, { stages: Record<number, { stars: number; gameStars: number; finalStars: number; bestStars: number; done: boolean }> }> = {}
  for (const j of journeys) {
    const stages: Record<number, { stars: number; gameStars: number; finalStars: number; bestStars: number; done: boolean }> = {}
    for (const s of j.stages) stages[s.id] = { stars: 3, gameStars: 3, finalStars: 3, bestStars: 3, done: true }
    all[j.id] = { stages }
  }
  adv.replaceAll({ ...JSON.parse(JSON.stringify(adv.state)), ...all })
  // the levels of the big games: the first four are won (one star each), so the last one opens too, so every level can be tried
  const won: Record<string, { levels: number[]; plays: number }> = {}
  for (const g of BIG_GAMES) won[g.id] = { levels: [1, 1, 1, 1], plays: 1 }
  games.replaceAll({ ...games.snapshot(), ...won })
  canRestore.value = hasBackup()
  note.value = t('app.testUnlock.done')
}

function restore() {
  try {
    const raw = localStorage.getItem(BACKUP)
    const saved = raw ? (JSON.parse(raw) as { adventure?: Record<string, never>; games?: Record<string, never> }) : {}
    adv.replaceAll(saved.adventure ?? {})
    games.replaceAll(saved.games ?? {})
    localStorage.removeItem(BACKUP)
  } catch {
    // nothing to bring back
  }
  canRestore.value = hasBackup()
  note.value = t('app.testUnlock.restored')
}
</script>

<template lang="pug">
  div(class="tu lk-panel")
    h3(class="tu-title") {{ t('app.testUnlock.title') }}
    p(class="tu-text") {{ t('app.testUnlock.text') }}
    button(type="button" class="lk-btn lk-btn--full" @click="unlockAll") {{ t('app.testUnlock.unlock') }}
    button(v-if="canRestore" type="button" class="lk-btn lk-btn--full lk-btn--outline tu-restore" @click="restore") {{ t('app.testUnlock.restore') }}
    p(v-if="note" class="tu-note" role="status") {{ note }}
</template>

<style scoped lang="sass">
.tu
  display: flex
  flex-direction: column
  gap: 10px
  margin-top: 16px
  padding: 16px
  border: 1px dashed var(--lk-line)
  border-radius: 20px

.tu-title
  margin: 0
  font-size: 1.02rem
  font-weight: 800

.tu-text
  margin: 0
  color: var(--lk-muted)
  font-size: 0.88rem
  line-height: 1.35

.tu-note
  margin: 0
  font-weight: 700
  text-align: center
</style>
