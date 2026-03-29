import { createApp } from 'vue'
import App from './App.vue'

import '@fontsource/outfit/500.css'
import '@fontsource/outfit/700.css'

import './assets/main.css'
import { store } from './store/index'
import { i18n, syncLocaleWithStore } from './i18n'

// Sync i18n locale with store state
syncLocaleWithStore(store)

createApp(App).use(store).use(i18n).mount('#app')
