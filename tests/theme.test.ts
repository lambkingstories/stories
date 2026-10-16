/**
 * Day and night look: the choice is remembered, "auto" follows the device, and the look is written on <html>.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import useTheme, { applyTheme } from '@/use/useTheme'

describe('theme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('night is written on <html> and remembered', () => {
    const { setChoice, theme, isNight } = useTheme()
    setChoice('night')
    expect(document.documentElement.getAttribute('data-theme')).toBe('night')
    expect(theme.value).toBe('night')
    expect(isNight.value).toBe(true)
    expect(localStorage.getItem('lk-theme')).toBe('night')
  })

  it('day switches back', () => {
    const { setChoice, theme } = useTheme()
    setChoice('night')
    setChoice('day')
    expect(document.documentElement.getAttribute('data-theme')).toBe('day')
    expect(theme.value).toBe('day')
  })

  it('applyTheme sets the attribute', () => {
    applyTheme('night')
    expect(document.documentElement.getAttribute('data-theme')).toBe('night')
  })

  it('both looks define every colour the screens use', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const css = fs.readFileSync(path.resolve(__dirname, '../src/assets/css/theme.css'), 'utf-8')
    const dayStart = css.indexOf("[data-theme='day']")
    const nightStart = css.indexOf("[data-theme='night']")
    const day = css.slice(dayStart, nightStart)
    const night = css.slice(nightStart)
    const names = [...day.matchAll(/--(lk-[a-z0-9-]+):/g)].map((m) => m[1])
    expect(names.length).toBeGreaterThan(15)
    for (const n of names) expect(night, `night is missing --${n}`).toContain(`--${n}:`)
  })
})
