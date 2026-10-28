/**
 * "Reach Kids": the book "Danke" (the two sheets of the children's Bible circle). The data keeps the words of the sheets, the shelf
 * and the open book are mounted (Pug templates are not checked by the type checker) and the page can be turned.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import { reachBook } from '@/data/reachKids'

const push = vi.fn()
// REACH Kids is switched on in these tests (the real switch is tested in reachSwitch.test.ts)
vi.mock('@/use/useReachKids', async () => {
  const { ref } = await import('vue')
  return { default: () => ({ active: ref(true), answered: ref(false) }) }
})

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { bookId: 'reach-kids-danke' }, query: {}, name: 'app-reach-kids' }),
  useRouter: () => ({
    push,
    replace: vi.fn(),
    back: vi.fn(),
    resolve: (to: { name: string }) => ({ path: '/' + to.name }),
    beforeEach: vi.fn(),
    afterEach: vi.fn(),
    onError: vi.fn()
  })
}))

const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'de', messages: messages as never, missingWarn: false, fallbackWarn: false })

let warnings: string[] = []
beforeEach(() => {
  warnings = []
  push.mockClear()
  window.scrollTo = vi.fn() as never
  vi.spyOn(console, 'warn').mockImplementation((...a) => {
    warnings.push(a.map(String).join(' '))
  })
  vi.spyOn(console, 'error').mockImplementation((...a) => {
    warnings.push('ERROR ' + a.map(String).join(' '))
  })
})
afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

const bad = (w: string) => /not defined on instance|is not a function|ERROR/.test(w)

describe('the book "Danke"', () => {
  it('has two pages with words and a voice text each', () => {
    expect(reachBook.pages).toHaveLength(2)
    for (const p of reachBook.pages) {
      expect(p.sections.length, p.id).toBeGreaterThan(0)
      expect(p.speech.length, p.id).toBeGreaterThan(0)
      expect(p.speech.every((s) => s.trim().length > 0)).toBe(true)
    }
  })

  it('keeps the words of the sheets', () => {
    const all = reachBook.pages.flatMap((p) => [...p.sections.flatMap((s) => [s.heading ?? '', ...s.text]), ...(p.facts ?? [])]).join('\n')
    for (const w of [
      'Hast du heute schon Danke gesagt',
      'nichts von dem, was wir haben, selbstverständlich ist',
      'Freitags 15:30 bis 17:30 Uhr',
      'FECG Trossingen · Ernst-Hohner-Str. 35/1 · 78647 Trossingen',
      'Aber Gott hat uns einen Ausweg geschaffen!',
      'Kinderbibelkreis'
    ]) expect(all, w).toContain(w)
  })

  it('has the words in English UI texts, too', () => {
    const en = (messages as Record<string, { app: { reach: Record<string, string>; read: Record<string, string> } }>).en.app
    for (const k of ['title', 'sub', 'pages', 'open', 'pageOf', 'next', 'prev']) expect(en.reach[k], k).toBeTruthy()
    expect(en.read.reachTitle).toBeTruthy()
  })
})

describe('the shelf and the open book', () => {
  it('opens the book from the shelf', async () => {
    const { default: View } = await import('@/views/app/AppReachKidsView.vue')
    const wrapper = mount(View, { global: { plugins: [i18n] }, attachTo: document.body })
    await flushPromises()
    expect(wrapper.text()).toContain('Danke')
    await wrapper.find('.reach-card').trigger('click')
    expect(push).toHaveBeenCalledWith({ name: 'app-reach-kids-book', params: { bookId: 'reach-kids-danke' } })
    expect(warnings.filter(bad)).toEqual([])
  })

  it('turns the page with the buttons and ends with a button that closes the book', async () => {
    const { default: View } = await import('@/views/app/AppReachReaderView.vue')
    const wrapper = mount(View, { global: { plugins: [i18n] }, attachTo: document.body })
    await flushPromises()
    expect(wrapper.find('.rr-count').text()).toBe('Seite 1 von 2')
    expect(wrapper.text()).toContain('Hast du heute schon Danke gesagt')
    const arrows = () => wrapper.findAll('.rr-arrow')
    expect(arrows()[0]!.attributes('disabled')).toBeDefined()
    await arrows()[1]!.trigger('click')
    expect(wrapper.find('.rr-count').text()).toBe('Seite 2 von 2')
    expect(wrapper.text()).toContain('Aber Gott hat uns einen Ausweg geschaffen!')
    await arrows()[0]!.trigger('click')
    expect(wrapper.find('.rr-count').text()).toBe('Seite 1 von 2')
    expect(warnings.filter(bad)).toEqual([])
  })
})
