/**
 * Anton 12.11.2026: "Hallo, Name" stays in the header of the main screens; the collector card of an adventure lights up once when it is won;
 * an adventure that is finished gets its own colour in the list.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { journeys } from '@/data/adventures'
import messages from '@/i18n/app'

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: {}, query: {}, name: 'app-main' }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), beforeEach: vi.fn(), afterEach: vi.fn(), onError: vi.fn() })
}))
vi.mock('@/use/useSfx', () => ({
  default: () => ({ play: () => Promise.resolve(), preload: vi.fn(), stopAll: vi.fn(), lengthOf: () => 0.4, enabled: { value: true }, setEnabled: vi.fn(), toggle: vi.fn(), playedSince: () => true })
}))
vi.mock('canvas-confetti', () => ({ default: vi.fn() }))

const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'de', messages: messages as never, missingWarn: false, fallbackWarn: false })
const opts = { global: { plugins: [i18n], stubs: { RouterLink: true } }, attachTo: document.body }
const josef = journeys.find((j) => j.id === 'josef')!

beforeEach(() => {
  document.body.innerHTML = ''
})

describe('the header: "Hallo" and the name, all the time', () => {
  it('shows "Hallo" and the name of the child; without a name "Entdecker" (it never goes away)', async () => {
    const { default: AppHeader } = await import('@/components/molecules/AppHeader.vue')
    const { default: useUserName } = await import('@/use/useUserName')
    const { setUserName } = useUserName()
    setUserName('')
    const w = mount(AppHeader, opts)
    expect(w.find('[data-test="header-hello"]').exists()).toBe(true)
    expect(w.find('.hello-word').text()).toBe('Hallo')
    expect(w.find('.hello-name').text()).toBe('Entdecker')
    setUserName('Mia')
    await flushPromises()
    expect(w.find('.hello-name').text()).toBe('Mia')
    setUserName('')
    w.unmount()
  })
})

describe('the collector card lights up when it is won', () => {
  const reveal = async (delay = 5) => {
    const { default: AdventureCardReveal } = await import('@/components/molecules/AdventureCardReveal.vue')
    const w = mount(AdventureCardReveal, { ...opts, props: { journey: josef, delay } })
    await new Promise((r) => setTimeout(r, delay + 30))
    await flushPromises()
    return w
  }

  it('nothing shows while the adventure is not finished', async () => {
    const { default: useAdventure } = await import('@/use/useAdventure')
    useAdventure().reset('josef')
    const w = await reveal()
    expect(document.body.querySelector('.cv')).toBeNull()
    w.unmount()
  })

  it('when the last stage is done the card shows with its line; closing it leaves the page as it is, and it shows only once', async () => {
    const { default: useAdventure } = await import('@/use/useAdventure')
    const adv = useAdventure()
    adv.reset('josef')
    josef.stages.forEach((s) => {
      adv.recordStars('josef', s.id, 1)
      adv.recordFinal('josef', s.id, 1)
      adv.completeStage('josef', s.id)
    })
    const w = await reveal()
    expect(document.body.querySelector('.cv-caption')?.textContent).toBe('Neue Sammelkarte freigeschaltet!')
    ;(document.body.querySelector('.cv-close') as HTMLElement).click()
    await flushPromises()
    expect(document.body.querySelector('.cv')).toBeNull()
    w.unmount()
    // seen: it does not come a second time
    const again = await reveal()
    expect(document.body.querySelector('.cv')).toBeNull()
    again.unmount()
  })
})
