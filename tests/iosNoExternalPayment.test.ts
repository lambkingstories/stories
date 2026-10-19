/**
 * The iOS build must never show a PayPal or Ko-fi link, nor the bank account (App Review Guideline 3.1.1(a): no buttons or
 * calls to action to payment outside in-app purchase, except on the US storefront). On iOS the support buttons are the StoreKit
 * tip instead (`TipButton`). Two guards:
 *  1. the start page and the parents' window are mounted as the iOS build and must contain no such link;
 *  2. every source file that mentions one of the links must also know `isIOS`, so a new place with a PayPal / Ko-fi button
 *     cannot slip in without the iOS switch.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: {}, query: {}, name: 'app-main' }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), beforeEach: vi.fn(), afterEach: vi.fn(), onError: vi.fn() })
}))
vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn(async () => ({ allowed: true })) }))
vi.mock('@choochmeque/tauri-plugin-iap-api', () => ({
  getProducts: vi.fn(async () => ({ products: [] })),
  purchase: vi.fn(),
  OS: 'ios'
}))
vi.mock('@/data/donation', () => ({
  bank: { holder: 'Test Holder', iban: 'DE00 0000 0000 0000 0000 00', bic: '', bankName: '', purpose: 'Spende LambKing' }
}))

const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'de', messages: messages as never, missingWarn: false, fallbackWarn: false })

const LINK = /paypal\.com|ko-fi\.com/i
/** What the child sees or what is in the markup: the button label, the picture name or the link itself. */
const SHOWN = /paypal|ko-?fi/i

beforeEach(() => {
  localStorage.clear()
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.resetModules()
  vi.doUnmock('@/utils/platform')
  document.body.innerHTML = ''
})

/** The whole text and markup of the page, links included (the buttons are `href` or `aria-label` carrying the target). */
const pageText = (html: string) => html + ' ' + document.body.textContent

async function mountHome(ios: boolean) {
  vi.doMock('@/utils/platform', () => ({ isIOS: ios, isAndroid: false, isMobile: true }))
  const { default: Home } = await import('@/views/app/AppHomeView.vue')
  const wrapper = mount(Home, { global: { plugins: [i18n], stubs: { RouterLink: true } }, attachTo: document.body })
  await flushPromises()
  return wrapper
}

async function mountParents(ios: boolean) {
  vi.doMock('@/utils/platform', () => ({ isIOS: ios, isAndroid: false, isMobile: true }))
  const { default: Sheet } = await import('@/components/molecules/ParentSheet.vue')
  const wrapper = mount(Sheet, {
    props: { open: true },
    global: { plugins: [i18n], stubs: { RouterLink: true, Teleport: true } },
    attachTo: document.body
  })
  await flushPromises()
  return wrapper
}

describe('iOS build: no payment outside in-app purchase', () => {
  it('start page: no PayPal, no Ko-fi on iOS (control: they are there off iOS)', async () => {
    const ios = await mountHome(true)
    expect(pageText(ios.html())).not.toMatch(SHOWN)
    ios.unmount()
    vi.resetModules()
    document.body.innerHTML = ''
    const other = await mountHome(false)
    expect(pageText(other.html())).toMatch(SHOWN)
  })

  it("parents' window: no PayPal, no Ko-fi and no bank account on iOS (control: all there off iOS)", async () => {
    const ios = await mountParents(true)
    const iosText = pageText(ios.html())
    expect(iosText).not.toMatch(SHOWN)
    expect(iosText).not.toMatch(/DE00 0000 0000/)
    ios.unmount()
    vi.resetModules()
    document.body.innerHTML = ''
    const other = await mountParents(false)
    const otherText = pageText(other.html())
    expect(otherText).toMatch(/PayPal/)
    expect(otherText).toMatch(/DE00 0000 0000/)
  })
})

describe('every place with a PayPal / Ko-fi link knows the iOS switch', () => {
  const root = join(__dirname, '..', 'src')
  const files: string[] = []
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name)
      if (statSync(p).isDirectory()) walk(p)
      else if (/\.(vue|ts)$/.test(name)) files.push(p)
    }
  }
  walk(root)

  it('finds the links only in files that also use isIOS (or in the button and data files themselves)', () => {
    const allowed = /(KoFiButton\.vue|donation\.ts|openExternal\.ts|platform\.ts|useTips\.ts|useMusic\.ts)$/
    const loose: string[] = []
    for (const f of files) {
      if (f.includes(`${join('src', 'i18n')}`) || f.includes(`${join('src', 'data', 'adventures')}`)) continue
      if (allowed.test(f)) continue
      const text = readFileSync(f, 'utf8')
      if (LINK.test(text) && !/isIOS/.test(text)) loose.push(f.replace(root, 'src'))
    }
    expect(loose).toEqual([])
  })
})
