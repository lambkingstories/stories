/**
 * The page of a big game that the child has not unlocked: a friendly page (tile, one sentence, a big button to the game room) instead of
 * an empty one, and the test door `?probe=1` that only works in the test app and in development, never in a store build.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createMemoryHistory, createRouter } from 'vue-router'
import app from '../src/i18n/app'

const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'en', messages: { de: (app as { de?: object }).de ?? {}, en: (app as { en?: object }).en ?? {} } })

async function open(path: string, env: Record<string, string | boolean> = {}) {
  vi.resetModules()
  localStorage.clear()
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v as string)
  const { default: View } = await import('@/views/app/AppBigGameView.vue')
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/app/spiel/:gameId', name: 'app-biggame', component: View },
      { path: '/app/spiele/abenteuer', name: 'app-games-adventure', component: { template: '<div id="room">room</div>' } },
      { path: '/app/spielzimmer', name: 'app-gameroom', component: { template: '<div id="room">room</div>' } },
      { path: '/app/profile', name: 'app-profile', component: { template: '<div>profile</div>' } }
    ]
  })
  await router.push(path)
  const stub = (name: string) => ({ name, template: `<div class="stub-game">${name}</div>` })
  const wrapper = mount(View, {
    global: {
      plugins: [i18n, router],
      stubs: Object.fromEntries(['David', 'Elia', 'Gideon', 'Wasser', 'Mose', 'Karawane', 'Nehemia', 'Memory', 'Lamm', 'Bogen'].map((n) => [`BigGame${n}`, stub(`BigGame${n}`)]))
    }
  })
  await flushPromises()
  return { wrapper, router }
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
  localStorage.clear()
})

describe('the page of a game that is not unlocked', () => {
  it('shows the tile, the name, one friendly sentence and a big button to the game room', async () => {
    const { wrapper, router } = await open('/app/spiel/david')
    expect(wrapper.find('.stub-game').exists()).toBe(false)
    expect(wrapper.find('img.bg-closed-pic').exists()).toBe(true)
    expect(wrapper.find('.bg-closed-title').text()).toBe('Davids Schleuder')
    expect(wrapper.find('.bg-closed-note').text()).toContain('noch nicht freigeschaltet')
    const go = wrapper.find('.bg-closed-btn')
    expect(go.text()).toBe(i18n.global.t('app.bigGames.toGameRoom'))
    expect(go.text().length).toBeGreaterThan(3)
    await go.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('app-games-adventure')
  })

  it('does not break on an unknown game (no tile, still the button)', async () => {
    const { wrapper } = await open('/app/spiel/gibtsnicht')
    expect(wrapper.find('img.bg-closed-pic').exists()).toBe(false)
    expect(wrapper.find('.bg-closed-btn').exists()).toBe(true)
  })
})

describe('the test door ?probe=1', () => {
  it('opens a game in development (and in tests)', async () => {
    const { wrapper } = await open('/app/spiel/david?probe=1')
    expect(wrapper.find('.stub-game').exists()).toBe(true)
  })

  it('opens a game in the test app (test switch on) even when it is not development', async () => {
    const { wrapper } = await open('/app/spiel/david?probe=1', { DEV: false, VITE_PLUS_TEST: 'true' })
    expect(wrapper.find('.stub-game').exists()).toBe(true)
  })

  it('does nothing in a store build (no development, no test switch)', async () => {
    const { wrapper } = await open('/app/spiel/david?probe=1', { DEV: false, VITE_PLUS_TEST: 'false' })
    expect(wrapper.find('.stub-game').exists()).toBe(false)
    expect(wrapper.find('.bg-closed-btn').exists()).toBe(true)
  })
})
