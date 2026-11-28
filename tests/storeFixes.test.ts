import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { deliverFile } from '@/utils/deliverFile'
import { startPrice } from '@/use/usePurchases'

const invoke = vi.fn()
vi.mock('@tauri-apps/api/core', async (original) => ({ ...(await original<object>()), invoke: (...a: unknown[]) => invoke(...a) }))

// Anton, TestFlight 27.11.2026: the parental question opened behind the book, the PDF was not saved, the start price was promised to a subscriber.
const phase = (micros: number, price: string) => ({ priceAmountMicros: micros, formattedPrice: price }) as never

describe('the findings from the first test on the iPad', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('puts the parental question above the book reader and the games', () => {
    const gate = readFileSync('src/components/molecules/ParentalGateModal.vue', 'utf-8')
    expect(gate).toMatch(/\.gate-backdrop\r?\n  z-index: 10000/)
  })

  it('hands a file to the share sheet', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { canShare: () => true, share })
    const file = new File(['x'], 'Buch.pdf', { type: 'application/pdf' })
    expect(await deliverFile(file, true)).toBe('shared')
    expect(share).toHaveBeenCalledWith({ files: [file] })
  })

  it('says so when the phone cannot share, and stays quiet when the person closes the sheet', async () => {
    const file = new File(['x'], 'Buch.pdf', { type: 'application/pdf' })
    vi.stubGlobal('navigator', {})
    expect(await deliverFile(file, true)).toBe('failed')
    vi.stubGlobal('navigator', { canShare: () => true, share: () => Promise.reject(Object.assign(new Error('no'), { name: 'AbortError' })) })
    expect(await deliverFile(file, true)).toBe('cancelled')
  })

  it('saves through the system dialog on Android', async () => {
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (Linux; Android 14)' })
    const file = new File(['abc'], 'Buch.pdf', { type: 'application/pdf' })
    invoke.mockResolvedValueOnce({ status: 'saved' })
    expect(await deliverFile(file, true)).toBe('saved')
    expect(invoke).toHaveBeenCalledWith('plugin:save-file|save', { name: 'Buch.pdf', mime: 'application/pdf', data: 'YWJj' })
    invoke.mockRejectedValueOnce(new Error('no plugin'))
    expect(await deliverFile(file, true)).toBe('failed')
  })

  it('names a start price only when the offer has a cheaper first phase', () => {
    const intro = { offerToken: 'i', basePlanId: 'jahr', pricingPhases: [phase(19_990_000, '19,99 €'), phase(29_990_000, '29,99 €')] }
    const plain = { offerToken: 'p', basePlanId: 'jahr', pricingPhases: [phase(29_990_000, '29,99 €')] }
    expect(startPrice(intro)).toBe('19,99 €')
    expect(startPrice(plain)).toBeUndefined()
    expect(startPrice(undefined)).toBeUndefined()
  })
})
