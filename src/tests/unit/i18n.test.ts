import { describe, it, expect, vi, beforeEach } from 'vitest'

beforeEach(() => {
  // Clear localStorage before each test
  localStorage.clear()
})

describe('i18n locale state management', () => {
  it('has locale state in store', async () => {
    const { store: storeModule } = await import('@/store/index')

    expect(storeModule.state.locale).toBeDefined()
    expect(['en', 'pt']).toContain(storeModule.state.locale)
  })

  it('persists locale to localStorage', async () => {
    // Set locale in localStorage before importing store
    localStorage.setItem('app-locale', 'pt')

    // Re-import store to pick up localStorage value
    vi.resetModules()
    const { store: storeModule } = await import('@/store/index')

    expect(storeModule.state.locale).toBe('pt')
  })

  it('updates locale via mutation', async () => {
    const { store: storeModule } = await import('@/store/index')

    const originalLocale = storeModule.state.locale
    const newLocale = originalLocale === 'en' ? 'pt' : 'en'

    storeModule.commit('setLocale', newLocale)

    expect(storeModule.state.locale).toBe(newLocale)
    expect(localStorage.getItem('app-locale')).toBe(newLocale)
  })

  it('syncs i18n with store state', async () => {
    const { i18n, syncLocaleWithStore } = await import('@/i18n')
    const { store: storeModule } = await import('@/store/index')

    // Set a known locale first
    storeModule.commit('setLocale', 'en')

    // Sync i18n with store - should sync immediately
    syncLocaleWithStore(storeModule)

    expect(i18n.global.locale).toBe('en')
  })

  it('setLocale helper updates both store and i18n', async () => {
    const { i18n, syncLocaleWithStore, setLocale } = await import('@/i18n')
    const { store: storeModule } = await import('@/store/index')

    syncLocaleWithStore(storeModule)

    // Set to known state first
    storeModule.commit('setLocale', 'en')

    // Use setLocale helper
    setLocale('pt')

    expect(storeModule.state.locale).toBe('pt')
    expect(i18n.global.locale).toBe('pt')
    expect(localStorage.getItem('app-locale')).toBe('pt')
  })
})
