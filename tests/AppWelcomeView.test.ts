/**
 * Welcome / language choice screen (`AppWelcomeView`): shown on the first start only.
 *   - One button goes to the start page and remembers that the welcome screen was seen.
 *   - The two languages are a radio list; picking the other one is written through `setSettingValue`, picking the
 *     active one writes nothing.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AppWelcomeView from '@/views/app/AppWelcomeView.vue'

const push = vi.fn()
const currentLocale = { value: 'de' }
const setSettingValue = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push, back: vi.fn() })
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: currentLocale
  })
}))

// The language is written through `useUser`, which otherwise drags in the IndexedDB-backed user store on import.
vi.mock('@/use/useUser', () => ({
  default: () => ({ setSettingValue })
}))

vi.mock('@/components/molecules/AppHeader.vue', () => ({
  default: { name: 'AppHeader', template: '<header class="app-header-stub" />' }
}))

describe('AppWelcomeView', () => {
  beforeEach(() => {
    push.mockClear()
    setSettingValue.mockClear()
    localStorage.clear()
    currentLocale.value = 'de'
  })

  it('has one main button: it goes to the start page and remembers that the welcome screen was seen', async () => {
    const w = mount(AppWelcomeView)
    const cta = w.find('.lk-btn')
    expect(cta.text()).toContain('app.welcome.cta')

    await cta.trigger('click')
    expect(push).toHaveBeenCalledWith({ name: 'app-main' })
    expect(localStorage.getItem('lk-welcome-seen')).toBe('1')
  })

  it('offers both languages and marks the active one', () => {
    const w = mount(AppWelcomeView)
    const rows = w.findAll('.lang-row')
    expect(rows).toHaveLength(2)
    expect(rows[0]!.attributes('aria-checked')).toBe('true')
    expect(rows[1]!.attributes('aria-checked')).toBe('false')
  })

  it('writes the language when the other one is picked, and nothing when it is already active', async () => {
    const w = mount(AppWelcomeView)
    const rows = w.findAll('.lang-row')

    await rows[1]!.trigger('click')
    expect(setSettingValue).toHaveBeenCalledWith('language', 'en')
    expect(push).not.toHaveBeenCalled()

    setSettingValue.mockClear()
    await rows[0]!.trigger('click')
    expect(setSettingValue).not.toHaveBeenCalled()
  })
})
