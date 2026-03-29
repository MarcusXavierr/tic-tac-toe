import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import pt from './locales/pt.json'
import type { Store } from 'vuex'

// Create i18n instance with initial locale (will be synced with store)
export const i18n = createI18n({
  legacy: true,
  locale: 'en', // Initial value, will be overridden by syncLocaleWithStore
  fallbackLocale: 'en',
  messages: { en, pt }
})

// Store reference to store for locale sync
let storeRef: Store<State> | null = null

/**
 * Initialize i18n locale from store and watch for changes
 * Call this after both store and i18n are created
 */
export function syncLocaleWithStore(store: Store<State>): void {
  storeRef = store

  // Set initial locale from store
  i18n.global.locale = store.state.locale as 'en' | 'pt'

  // Watch for locale changes in store and update i18n
  store.watch(
    (state) => state.locale,
    (newLocale) => {
      i18n.global.locale = newLocale as 'en' | 'pt'
    }
  )
}

/**
 * Change the current locale
 * Updates both store and i18n instance
 */
export function setLocale(locale: 'en' | 'pt'): void {
  if (storeRef) {
    storeRef.commit('setLocale', locale)
    // Immediately update i18n as well (in case watch doesn't trigger synchronously)
    i18n.global.locale = locale
  } else {
    // Fallback if store not yet initialized
    i18n.global.locale = locale
    localStorage.setItem('app-locale', locale)
  }
}
