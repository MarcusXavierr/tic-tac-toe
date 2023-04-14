<template>
  <div class="container">
    <GamePage v-if="isGameActive" />
    <div class="home" v-else>
      <HomePage />
    </div>
  </div>
</template>

<script lang="ts">
import HomePage from './views/Home/index.vue'
import GamePage from './views/Game/index.vue'

import { BtnColor } from './enums/ButtonTypes'
import { IconType } from './enums/IconTypes'
import iconO from './assets/icon-o.svg'
import iconOOutline from './assets/icon-o-outline.svg'
import iconX from './assets/icon-x.svg'
import iconXOutline from './assets/icon-x-outline.svg'
import iconOGrayOutline from './assets/gray-icons/icon-o-outline.svg'
import iconXGray from './assets/gray-icons/icon-x.svg'
import iconODark from './assets/icon-o-dark.svg'
import iconXDark from './assets/icon-x-dark.svg'

import { mapState } from 'vuex'
export default {
  components: {
    HomePage,
    GamePage
  },
  computed: {
    ...mapState(['isGameActive']),
    btnOptions() {
      return {
        colors: BtnColor
      }
    },
    iconOptions() {
      return IconType
    }
  },
  created() {
    const images = [
      iconO,
      iconX,
      iconOOutline,
      iconXGray,
      iconXOutline,
      iconOGrayOutline,
      iconODark,
      iconXDark
    ]

    images.forEach((path) => {
      const img = new Image()
      img.src = path
    })
  }
}
</script>

<style scoped>
.container {
  max-width: 28.75rem;
  margin: auto;
}

.home {
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

@media (min-width: 772px) {
  .container {
    display: flex;
    justify-content: center;
    margin: auto;
    height: 100vh;
    width: 28.75rem;
  }
}
</style>
