/**
 * The reading voice follows the "Voice" slider of the sound window: a recording starts at that volume and changes at once when the
 * slider is moved while it plays.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'

const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'de', messages: messages as never, missingWarn: false, fallbackWarn: false })
const players: { volume: number; paused: boolean }[] = []

beforeEach(() => {
  localStorage.clear()
  vi.resetModules()
  players.length = 0
  vi.stubGlobal(
    'Audio',
    class {
      volume = 1
      paused = false
      onended: (() => void) | null = null
      onerror: (() => void) | null = null
      constructor() {
        players.push(this)
      }
      play() {
        return Promise.resolve()
      }
      pause() {
        this.paused = true
      }
    }
  )
})
afterEach(() => vi.unstubAllGlobals())

describe('read aloud volume', () => {
  it('plays a recording at the volume of the voice slider and follows the slider while it plays', async () => {
    const settings = (await import('@/use/useSoundSettings')).default()
    settings.setVoiceVolume(0.3)
    const { default: ReadAloud } = await import('@/components/molecules/ReadAloud.vue')
    const w = mount(ReadAloud, { props: { text: ['Ein Satz.'], audio: 'audio/x.mp3' }, global: { plugins: [i18n] } })
    await w.find('button').trigger('click')
    await flushPromises()
    expect(players).toHaveLength(1)
    expect(players[0]!.volume).toBe(0.3)
    settings.setVoiceVolume(0.8)
    await flushPromises()
    expect(players[0]!.volume).toBe(0.8)
    w.unmount()
  })
})
