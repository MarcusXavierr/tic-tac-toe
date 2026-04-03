import { createApp } from 'vue'
import App from './App.vue'

import '@fontsource/outfit/500.css'
import '@fontsource/outfit/700.css'

import './assets/main.css'
import { store } from './store/index'
import { i18n, syncLocaleWithStore } from './i18n'
import posthog from 'posthog-js'

posthog.init(import.meta.env.VITE_POSTHOG_PROJECT_TOKEN || '', {
  api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
  defaults: '2026-01-30'
})

// Sync i18n locale with store state
syncLocaleWithStore(store)

const app = createApp(App)

app.config.errorHandler = (err) => {
  posthog.captureException(err)
}

app.use(store).use(i18n).mount('#app')
