<template>
  <div class="container">
    <div v-if="!isGameActive">
      <BaseCell/>
    </div>
    <HomePage v-else />
  </div>
</template>

<script lang="ts">
import BaseButton from './components/base/BaseButton.vue'
import BaseIcon from './components/base/BaseIcon.vue'
import BaseCell from './components/base/BaseCell.vue'
import HomePage from './views/Home/index.vue'

import { BtnColor } from './enums/ButtonTypes'
import { IconType } from './enums/IconTypes'

import { mapState } from 'vuex'
export default {
  components: {
    BaseButton,
    BaseIcon,
    HomePage,
    BaseCell
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
</style>
