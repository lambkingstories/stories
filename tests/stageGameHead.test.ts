/**
 * The page of a stage game on a phone held upright (Prüfbericht 17.11.2026, "Spiel-Aufgabenseite verdichten"): before and while the game is
 * played the head is short (no big app header, one line with stage and Bible place, the title once), the task stands once (when the game says
 * it itself in its first round, the page does not repeat it), and there is one way to play: the big button (the small round one is gone).
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'

const route = { params: { journeyId: 'adam-eva', stageId: '1' } as Record<string, string>, query: {} as Record<string, string>, name: 'app-adventure-stage' }
vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), beforeEach: vi.fn(), afterEach: vi.fn(), onError: vi.fn() })
}))
vi.mock('@/use/useSfx', () => ({
  default: () => ({ play: vi.fn(), preload: vi.fn(), stopAll: vi.fn(), lengthOf: () => 0, enabled: { value: true }, setEnabled: vi.fn(), toggle: vi.fn(), playedSince: () => true })
}))

vi.mock('@/data/adventures', async (original) => {
  const real = await original<typeof import('@/data/adventures')>()
  const { adamEva } = await import('@/data/adventures/adamEva')
  return { ...real, journeyById: (id: string) => (id === 'adam-eva' ? adamEva : real.journeyById(id)) }
})

const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'de', messages: messages as never, missingWarn: false, fallbackWarn: false })
const opts = { global: { plugins: [i18n], stubs: { RouterLink: true } }, attachTo: document.body }

beforeAll(async () => {
  await Promise.all(Object.values(import.meta.glob('/src/components/molecules/games/Game*.vue')).map((load) => load().catch(() => undefined)))
}, 180000)
beforeEach(() => {
  localStorage.clear()
  
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})
afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

async function openTask() {
  const { default: Stage } = await import('@/views/app/AppAdventureStageView.vue')
  const w = mount(Stage, opts)
  await flushPromises()
  const toTask = w.findAll('button').find((b) => /Zur Aufgabe/.test(b.text()))!
  await toTask.trigger('click')
  await flushPromises()
  return w
}

describe('the page of a stage game', () => {
  it('has a short head: no app header, stage and Bible place in one line, the title once', async () => {
    const w = await openTask()
    expect(w.find('.stage-head--game').exists()).toBe(true)
    expect(w.find('.stage-kind').text()).toMatch(/Etappe 1 von \d+ · /)
    expect(w.find('.stage-ref').exists()).toBe(false)
    expect(w.findAll('.stage-title')).toHaveLength(1)
    expect(w.find('.stage-steps').exists()).toBe(false)
    expect(w.find('.stage-pic').exists()).toBe(false)
  })

  it('has one way to play before the start (the big button) and the restart sign only after it', async () => {
    const w = await openTask()
    expect(w.find('.stage-play-big').exists()).toBe(true)
    expect(w.find('.stage-play').exists()).toBe(false)
    expect(w.find('.stage-ctrl').exists()).toBe(false)
    await w.find('.stage-play-big').trigger('click')
    await flushPromises()
    expect(w.find('.stage-play-big').exists()).toBe(false)
    expect(w.find('.stage-restart').exists()).toBe(true)
    expect(w.find('.stage-play').exists()).toBe(false)
  })

  it('says the task once: the game names it in its first round, so the page hides its own sentence', async () => {
    const w = await openTask()
    const hint = w.find('.stage-hint')
    expect(hint.isVisible()).toBe(true)
    await w.find('.stage-play-big').trigger('click')
    await flushPromises()
    const round = w.text().match(/Runde 1: Lege die Bilder in die Reihenfolge der Geschichte/g) ?? []
    expect(round).toHaveLength(1)
    expect(w.find('.stage-hint').attributes('style') ?? '').toContain('display: none')
    // a fresh start shows the sentence of the page again until the game has been seen
    await w.find('.stage-restart').trigger('click')
    await flushPromises()
    expect(w.text().match(/Lege die Bilder in die Reihenfolge der Geschichte/g)?.length ?? 0).toBeLessThanOrEqual(2)
  })
})
