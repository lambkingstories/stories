import { afterEach, describe, expect, it, vi } from 'vitest'

async function load() {
  vi.resetModules()
  return (await import('@/use/useUserName')).default()
}

afterEach(() => {
  localStorage.clear()
  vi.resetModules()
})

describe('the name of the child', () => {
  it('is "Entdecker" until a name is typed (never a stranger first name)', async () => {
    const u = await load()
    expect(u.defaultName).toBe('Entdecker')
    expect(u.displayName.value).toBe('Entdecker')
    expect(u.hasCustomName.value).toBe(false)
  })

  it('uses the typed name and goes back to the default when it is cleared', async () => {
    const u = await load()
    u.setUserName('  Mia ')
    expect(u.displayName.value).toBe('Mia')
    expect(u.hasCustomName.value).toBe(true)
    u.setUserName('')
    expect(u.displayName.value).toBe('Entdecker')
    expect(u.hasCustomName.value).toBe(false)
  })

  it('does not count the default name as a typed one', async () => {
    const u = await load()
    u.setUserName('Entdecker')
    expect(u.hasCustomName.value).toBe(false)
  })
})
