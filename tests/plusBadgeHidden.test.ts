/**
 * The Plus sign (crown and "Plus") is hidden for people who have Plus and comes back when Plus ends (Anton, 18 Nov 2026).
 * `always` keeps it on the pages that are about Plus itself.
 */
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, describe, expect, it } from 'vitest'
import PlusBadge from '@/components/atoms/PlusBadge.vue'
import OwnBadge from '@/components/atoms/OwnBadge.vue'
import { setSubscribed } from '@/use/usePremium'

const i18n = createI18n({ legacy: false, locale: 'de', messages: { de: { app: { adventure: { plusBadge: 'Plus', plusBadgeLabel: 'Gehört zu Plus' }, read: { own_plus: 'Mit Plus' } } } }, missingWarn: false })
const mountIt = (comp: object, props: Record<string, unknown> = {}) => mount(comp as never, { props, global: { plugins: [i18n] } })

afterEach(() => setSubscribed(false))

describe('the Plus sign', () => {
  it('shows without Plus, disappears with Plus and returns when Plus ends', async () => {
    const w = mountIt(PlusBadge)
    expect(w.find('.plus-badge').exists()).toBe(true)
    setSubscribed(true)
    await w.vm.$nextTick()
    expect(w.find('.plus-badge').exists()).toBe(false)
    setSubscribed(false)
    await w.vm.$nextTick()
    expect(w.find('.plus-badge').exists()).toBe(true)
    w.unmount()
  })

  it('stays where it is asked to (the page about Plus itself)', async () => {
    setSubscribed(true)
    const w = mountIt(PlusBadge, { always: true })
    expect(w.find('.plus-badge').exists()).toBe(true)
    w.unmount()
  })

  it('the "With Plus" sign on a book is hidden for people with Plus, too', async () => {
    setSubscribed(true)
    const w = mountIt(OwnBadge, { state: 'plus' })
    expect(w.find('.plus-badge').exists()).toBe(false)
    w.unmount()
  })

  it('a book that is still to get wears the Plus sign (Plus off), and the bought and free ones their own sign', async () => {
    const locked = mountIt(OwnBadge, { state: 'locked' })
    expect(locked.find('.plus-badge').exists()).toBe(true)
    expect(locked.find('.own-badge').exists()).toBe(false)
    locked.unmount()
    for (const state of ['free', 'owned']) {
      const w = mountIt(OwnBadge, { state })
      expect(w.find('.plus-badge').exists()).toBe(false)
      expect(w.find('.own-badge').exists()).toBe(true)
      w.unmount()
    }
  })

  it('has one look: no small plates', async () => {
    const w = mountIt(PlusBadge)
    expect(w.find('.plus-badge').classes()).toEqual(['plus-badge'])
    w.unmount()
  })
})
