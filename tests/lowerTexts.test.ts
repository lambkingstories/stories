/**
 * The own words of the lowering game (`LowerGame.texts`): Paul in the basket over the wall of Damascus says other words than the red rope of Joshua.
 * Without `texts` the words of Joshua stay (the test of Joshua checks them); `{n}` and `{total}` may stand in the line of the field.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import useTaskProgress from '@/use/useTaskProgress'
import { LOWER_DATA } from './lowerTextsData'
import type { LowerGame } from '@/types/adventure'

vi.mock('@/use/useSfx', () => ({
  default: () => ({
    play: () => Promise.resolve(),
    preload: vi.fn(),
    stopAll: vi.fn(),
    lengthOf: () => 0,
    enabled: { value: true },
    setEnabled: vi.fn(),
    toggle: vi.fn(),
    playedSince: () => true
  })
}))

const mk = () => createI18n({ legacy: false, locale: 'de', fallbackLocale: 'de', messages: messages as never, missingWarn: false, fallbackWarn: false })
const open = async (game: LowerGame) => {
  const { default: Lower } = await import('@/components/molecules/games/GameLower.vue')
  const w = mount(Lower, { global: { plugins: [mk()], stubs: { RouterLink: true } }, attachTo: document.body, props: { game } })
  await flushPromises()
  return w
}
const finish = async (w: Awaited<ReturnType<typeof open>>) => {
  ;(w.vm as unknown as { phase: string }).phase = 'finished'
  await flushPromises()
}

beforeEach(() => {
  useTaskProgress().reset()
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('GameLower texts', () => {
  it('without texts the words of Joshua stay', async () => {
    const w = await open(LOWER_DATA)
    expect(w.find('.lw-field').attributes('aria-label')).toBe('Die Stadtmauer mit dem roten Seil: 0 von 2 Männern unten')
    await finish(w)
    expect(w.text()).toContain('Beide Männer sind sicher unten.')
  })

  it('own texts replace the line of the field and the line at the end', async () => {
    const w = await open({ ...LOWER_DATA, texts: { field: 'Die Stadtmauer von Damaskus: Der Korb wird hinabgelassen', done: 'Saulus ist sicher unten.' } })
    expect(w.find('.lw-field').attributes('aria-label')).toBe('Die Stadtmauer von Damaskus: Der Korb wird hinabgelassen')
    await finish(w)
    expect(w.text()).toContain('Saulus ist sicher unten.')
    expect(w.text()).not.toContain('Beide Männer')
  })

  it('{n} and {total} are filled in; a text with only one of the two lines keeps the other one of Joshua', async () => {
    const w = await open({ ...LOWER_DATA, texts: { field: 'Unten: {n} von {total}' } })
    expect(w.find('.lw-field').attributes('aria-label')).toBe('Unten: 0 von 2')
    await finish(w)
    expect(w.text()).toContain('Beide Männer sind sicher unten.')
  })
})
