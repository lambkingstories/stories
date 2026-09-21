import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

/**
 * Pins the shape that made the PayPal / Ko-fi buttons dead in the Play Store
 * build: inside the Tauri WebView the link must leave through the opener
 * plugin (an ACTION_VIEW intent), never through a `target="_blank"` popup the
 * WebView drops on the floor.
 *
 * It has to be `plugin-opener`. `plugin-shell`'s JS `open()` looks equivalent
 * and fails on-device with "Scoped shell IO error: No such file or directory"
 * because its command runs the desktop `open` crate on Android too.
 */
const openUrl = vi.fn(async () => {
})

vi.mock('@tauri-apps/plugin-opener', () => ({
  openUrl: (url: string) => openUrl(url)
}))

// `openExternal` reads the Tauri marker at call time, but the module also
// pulls in `@tauri-apps/api/core`, so a fresh import per case keeps the
// environments from leaking into each other.
async function freshModule() {
  vi.resetModules()
  return import('@/utils/openExternal')
}

let windowOpen: ReturnType<typeof vi.fn>
let assign: ReturnType<typeof vi.fn>

beforeEach(() => {
  openUrl.mockClear()
  openUrl.mockResolvedValue(undefined)
  windowOpen = vi.fn(() => ({}) as Window)
  assign = vi.fn()
  vi.stubGlobal('open', windowOpen)
  vi.stubGlobal('location', { href: 'http://localhost/', assign })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('openExternal', () => {
  it('hands the URL to the opener plugin inside the Tauri app', async () => {
    vi.stubGlobal('isTauri', true)
    const { openExternal } = await freshModule()

    await expect(openExternal('https://ko-fi.com/U6U21YO0Z5')).resolves.toBe(true)

    expect(openUrl).toHaveBeenCalledWith('https://ko-fi.com/U6U21YO0Z5')
    // The WebView popup path is exactly what silently fails on Android.
    expect(windowOpen).not.toHaveBeenCalled()
    expect(assign).not.toHaveBeenCalled()
  })

  it('falls back to a popup request when the plugin fails', async () => {
    vi.stubGlobal('isTauri', true)
    openUrl.mockRejectedValue(new Error('no activity found'))
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {
    })
    const { openExternal } = await freshModule()

    await openExternal('https://www.paypal.com/ncp/payment/5CWTQPB6NGWLU')

    expect(windowOpen).toHaveBeenCalled()
    // Never a deliberate `location.assign` on top of it — one attempt only.
    expect(assign).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it('uses the Electron bridge on the desktop build', async () => {
    const openViaElectron = vi.fn()
    vi.stubGlobal('electronAPI', { quitApp: vi.fn(), openExternal: openViaElectron })
    const { openExternal } = await freshModule()

    await expect(openExternal('https://lambking.store')).resolves.toBe(true)

    expect(openViaElectron).toHaveBeenCalledWith('https://lambking.store')
    expect(openUrl).not.toHaveBeenCalled()
    expect(windowOpen).not.toHaveBeenCalled()
  })

  it('opens a new tab on the web build', async () => {
    const { openExternal } = await freshModule()

    await expect(openExternal('https://lambking.store')).resolves.toBe(true)

    expect(windowOpen).toHaveBeenCalledWith('https://lambking.store', '_blank', 'noopener,noreferrer')
    expect(openUrl).not.toHaveBeenCalled()
  })

  it('navigates the current tab when the web popup is blocked', async () => {
    windowOpen.mockReturnValue(null as unknown as Window)
    const { openExternal } = await freshModule()

    await expect(openExternal('https://lambking.store')).resolves.toBe(true)

    expect(assign).toHaveBeenCalledWith('https://lambking.store')
  })

  it.each([
    'javascript:alert(1)',
    'file:///etc/passwd',
    'data:text/html,<script>1</script>',
    'not a url',
    ''
  ])('refuses %s', async (url) => {
    vi.stubGlobal('isTauri', true)
    const { openExternal } = await freshModule()

    await expect(openExternal(url)).resolves.toBe(false)

    expect(openUrl).not.toHaveBeenCalled()
    expect(windowOpen).not.toHaveBeenCalled()
    expect(assign).not.toHaveBeenCalled()
  })

  it('accepts the protocols on the allow-list', async () => {
    const { isExternalUrl } = await freshModule()

    expect(isExternalUrl('https://ko-fi.com/U6U21YO0Z5')).toBe(true)
    expect(isExternalUrl('http://lambking.store')).toBe(true)
    expect(isExternalUrl('mailto:hi@lambking.de')).toBe(true)
    expect(isExternalUrl('tel:+491234')).toBe(true)
  })
})

describe('openExternal on the iOS App Store build', () => {
  // The iOS build used to hold every outgoing link behind a parental gate,
  // which the Kids Category requires (App Review Guideline 1.3). The app has
  // left that category and is rated 18+, so iOS now behaves like every other
  // shell — these cases exist to keep the gate from creeping back in.
  async function iosModule() {
    vi.stubEnv('VITE_APP_PLATFORM', 'ios')
    vi.stubGlobal('isTauri', true)
    return freshModule()
  }

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('opens the link straight away, with nothing to confirm', async () => {
    const { openExternal } = await iosModule()

    await expect(openExternal('https://lambking.store')).resolves.toBe(true)
    expect(openUrl).toHaveBeenCalledWith('https://lambking.store')
  })

  it('still refuses a blocked protocol', async () => {
    const { openExternal } = await iosModule()

    await expect(openExternal('javascript:alert(1)')).resolves.toBe(false)
    expect(openUrl).not.toHaveBeenCalled()
    expect(windowOpen).not.toHaveBeenCalled()
    expect(assign).not.toHaveBeenCalled()
  })
})
