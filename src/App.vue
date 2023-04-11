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
  }
}
</script>

<style scoped>
.container {
  width: 28.75rem;
}

.home {
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

@media (min-width: 772px) {
  .container {
    display: flex;
    margin: auto;
    justify-content: center;
    height: 100vh;
  }
}
</style>
