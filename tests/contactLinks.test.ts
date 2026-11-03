/**
 * The contact entries for grown-ups (parents' window and the legal page): the contact form of lambking.store and the e-mail address,
 * both through `openExternal` (which asks the parental gate). The app has no form of its own, so no new data flow arises.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'

const openExternal = vi.fn(async (_url: string) => true)
vi.mock('@/utils/openExternal', () => ({ openExternal: (u: string) => openExternal(u), default: (u: string) => openExternal(u) }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))

import ContactLinks from '@/components/molecules/ContactLinks.vue'

describe('ContactLinks', () => {
  beforeEach(() => openExternal.mockClear())

  it('hands the form and the e-mail address to openExternal and has no form or input of its own', async () => {
    const w = mount(ContactLinks)
    expect(w.text()).toContain('app.contact.form')
    expect(w.text()).toContain('app.contact.email')
    expect(w.find('form').exists()).toBe(false)
    expect(w.find('input').exists()).toBe(false)

    await w.find('[data-test="contact-form"]').trigger('click')
    expect(openExternal).toHaveBeenLastCalledWith('https://lambking.store/#kontakt')
    await w.find('[data-test="contact-mail"]').trigger('click')
    expect(openExternal).toHaveBeenLastCalledWith('mailto:hello@lambking.store')
    expect(openExternal).toHaveBeenCalledTimes(2)
  })
})
