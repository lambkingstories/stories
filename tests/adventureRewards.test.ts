/**
 * The account at the end of a stage ("Deine Belohnungen"): stars of the adventure, collector card, mini game of the stage, bonus game and
 * cup, all worked out from the progress. And the stage page has no "see my card" button any more.
 */
import { readFileSync } from 'node:fs'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import esExtra from '@/i18n/es/teil2'
import AdventureRewards from '@/components/molecules/AdventureRewards.vue'
import useAdventure from '@/use/useAdventure'
import useBigGames from '@/use/useBigGames'
import { REWARD_GAMES } from '@/data/adventures/rewardGames'
import type { Journey } from '@/types/adventure'

vi.mock('@/use/useSfx', () => ({
  default: () => ({ play: vi.fn(), preload: vi.fn(), stopAll: vi.fn(), lengthOf: () => 0, enabled: { value: true }, setEnabled: vi.fn(), toggle: vi.fn(), playedSince: () => true })
}))

const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'de', messages: messages as never, missingWarn: false, fallbackWarn: false })

const stage = (id: number, title: string) =>
  ({ id, title, ref: 'Test 1', text: ['x'], image: 'images/x.webp', task: { kind: 'quiz' }, questions: [] }) as unknown as Journey['stages'][number]

const journey = {
  id: 'testreise',
  title: 'Testreise',
  medal: 'images/abenteuer/ui/medaille-josef.webp',
  stages: [stage(1, 'Eins'), stage(2, 'Zwei'), stage(3, 'Drei')],
  exam: [{}, {}, {}]
} as unknown as Journey

const text = (w: { text: () => string }) => w.text().replace(/\s+/g, ' ')
const make = (stageId?: number) => mount(AdventureRewards, { props: { journey, stageId }, global: { plugins: [i18n] } })

beforeEach(() => {
  localStorage.clear()
  useBigGames().replacePicks([])
  const adv = useAdventure()
  for (const k of Object.keys(adv.state)) delete adv.state[k]
  REWARD_GAMES['testreise'] = [2]
})

describe('AdventureRewards', () => {
  it('counts the stars of the adventure and what is missing for the card', () => {
    const adv = useAdventure()
    adv.state['testreise'] = { stages: { 1: { stars: 3, bestStars: 3, done: true }, 2: { stars: 1, bestStars: 1, done: true } } }
    const t = text(make(1))
    expect(t).toContain('Noch 5 Sterne fehlen.')
    expect(t).toContain('4 von 9')
    // the card does not ask for stars: one stage is still open
    expect(t).toContain('Schließe das Abenteuer ab und schalte eine Sammelkarte mit Bibelvers frei.')
  })

  it('says the card is won when every stage has three stars', () => {
    const adv = useAdventure()
    adv.state['testreise'] = {
      stages: { 1: { stars: 3, bestStars: 3, done: true }, 2: { stars: 3, bestStars: 3, done: true }, 3: { stars: 3, bestStars: 3, done: true } }
    }
    const w = make(3)
    expect(text(w)).toContain('Gewonnen! Sie liegt in deiner Sammlung.')
    expect(text(w)).toContain('Alle Sterne sind gesammelt')
  })

  it('the card is won when the adventure is finished, also with few stars', () => {
    const adv = useAdventure()
    adv.state['testreise'] = {
      stages: { 1: { stars: 1, bestStars: 1, done: true }, 2: { stars: 0, bestStars: 0, done: true }, 3: { stars: 2, bestStars: 2, done: true } }
    }
    expect(text(make(3))).toContain('Gewonnen! Sie liegt in deiner Sammlung.')
  })

  it('opens the mini game of its stage with three stars and tells how many stars it still needs', () => {
    const adv = useAdventure()
    adv.state['testreise'] = { stages: { 2: { stars: 2, bestStars: 2, done: true } } }
    expect(text(make(2))).toContain('Noch 1 Stern in dieser Etappe, dann ist „Zwei“ frei.')
    adv.state['testreise'] = { stages: { 2: { stars: 3, bestStars: 3, done: true } } }
    expect(text(make(2))).toContain('„Zwei“ ist freigeschaltet')
  })

  it('shows the way to the next game wish and the way to the cup', () => {
    const adv = useAdventure()
    adv.state['testreise'] = { stages: { 1: { stars: 3, bestStars: 3, done: true } } }
    const t = text(make(1))
    // the wishes count the stars of the real adventures (the test journey is not one of them): none yet
    expect(t).toContain('Noch 40 Sterne bis zum nächsten Spiel-Wunsch.')
    // 3 stages x 3 stars + 3 exam questions = 12 points; bronze from 50 % = 6 points
    expect(t).toContain('Noch 3 Punkte bis zum Pokal in Bronze.')
    expect(t).toContain('3 von 12 Punkten')
  })

  it('lights the bonus row and says a game may be picked when a wish is free', () => {
    const adv = useAdventure()
    // the stars of all adventures count (the test build has only Josef, 36 stars): stages with high numbers of Josef's progress add enough for a wish
    adv.state['josef'] = { stages: Object.fromEntries(Array.from({ length: 14 }, (_, i) => [1001 + i, { stars: 3, bestStars: 3, done: true }])) }
    const w = make(1)
    expect(text(w)).toContain('Du darfst ein Spiel aussuchen!')
    expect(w.find('.rw-bonus').classes()).toContain('is-done')
    // the wish is used: the row speaks of the next one
    useBigGames().addPick('david')
    const again = make(1)
    expect(text(again)).not.toContain('aussuchen')
    expect(text(again)).toContain('Noch 38 Sterne bis zum nächsten Spiel-Wunsch.')
  })

  it('starts folded with the stars in the head line and opens and closes with a tap', async () => {
    const adv = useAdventure()
    adv.state['testreise'] = { stages: { 1: { stars: 3, bestStars: 3, done: true } } }
    const w = make(1)
    const toggle = w.get('button.rw-toggle')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(text(toggle)).toContain('3 von 9')
    expect((w.get('ul.rw-list').element as HTMLElement).style.display).toBe('none')
    await toggle.trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect((w.get('ul.rw-list').element as HTMLElement).style.display).toBe('')
    await toggle.trigger('click')
    expect((w.get('ul.rw-list').element as HTMLElement).style.display).toBe('none')
  })

  it('has no "see my card" button on the stage page and no device voice in the read-aloud button', () => {
    const stageView = readFileSync('src/views/app/AppAdventureStageView.vue', 'utf-8')
    expect(stageView).not.toContain('cardShow')
    expect(stageView).toContain('AdventureRewards')
    const readAloud = readFileSync('src/components/molecules/ReadAloud.vue', 'utf-8')
    expect(readAloud).not.toContain('SpeechSynthesisUtterance')
    expect(readAloud).not.toContain('speechSynthesis')
  })

  it('has every line in German, English and Spanish', () => {
    const keys = Object.keys((messages as never as Record<string, { app: { adventure: Record<string, string> } }>).de.app.adventure).filter((k) => /^r[A-Z]/.test(k))
    expect(keys.length).toBeGreaterThan(20)
    const en = (messages as never as Record<string, { app: { adventure: Record<string, string> } }>).en.app.adventure
    const es = esExtra as unknown as Record<string, string>
    for (const k of keys) {
      expect(en[k], `en ${k}`).toBeTruthy()
      expect(es[k], `es ${k}`).toBeTruthy()
    }
  })
})
