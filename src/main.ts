import { createApp } from 'vue'
import App from './App.vue'

import "@fontsource/outfit/500.css"
import "@fontsource/outfit/700.css"

import './assets/main.css'
import { store } from './store/index'

createApp(App).use(store).mount('#app')
