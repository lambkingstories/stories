/**
 * The awards a finished stage brings are shown as pictures (medal and short name), not as a line of text (Anton, 17.11.2026).
 */
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { beforeEach, describe, expect, it } from 'vitest'
import messages from '@/i18n/app'
import NewAwards from '@/components/molecules/NewAwards.vue'

const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'de', messages: messages as never, missingWarn: false, fallbackWarn: false })

beforeEach(() => localStorage.clear())

describe('NewAwards', () => {
  it('shows nothing when no award was won', () => {
    const w = mount(NewAwards, { props: { ids: [] }, global: { plugins: [i18n] } })
    expect(w.find('[data-test="new-awards"]').exists()).toBe(false)
  })

  it('shows one medal picture with its name for every award, in the order won, not a sentence', () => {
    const w = mount(NewAwards, { props: { ids: ['first-stage', 'first-card'] }, global: { plugins: [i18n] } })
    const items = w.findAll('.na-item')
    expect(items).toHaveLength(2)
    for (const it of items) {
      expect(it.find('img.na-img').exists()).toBe(true)
      expect(it.find('img.na-img').attributes('src')).toMatch(/images\/awards\/.+\.webp$/)
    }
    expect(items.map((i) => i.find('.na-name').text())).toEqual(['Erster Schritt', 'Erste goldene Karte'])
    expect(w.text()).not.toContain(',')
  })
})
