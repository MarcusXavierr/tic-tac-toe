<template>
  <div class="container">
    <div v-if="isGameActive">
      <BaseButton :button-color="btnOptions.colors.yellow" :is-large="true">MAMACO</BaseButton><br>
      <BaseButton :button-color="btnOptions.colors.blue" />
      <BaseButton :button-color="btnOptions.colors.gray" :is-large="true"/>
      <BaseIcon :icon-type="iconOptions.X_outline"/>
      <BaseButton :button-color="btnOptions.colors.gray">
        <BaseIcon :icon-type="iconOptions.Restart"/>
      </BaseButton><br>
      <BaseButton :button-color="btnOptions.colors.yellow">SECONDARY BUTTON 1</BaseButton>
    </div>
  <HomePage v-else/>
  </div>
</template>

<script lang="ts">
import BaseButton from './components/base/BaseButton.vue'
import BaseIcon from './components/base/BaseIcon.vue'
import HomePage from './views/Home/index.vue'

import { BtnColor } from './enums/ButtonTypes'
import { IconType } from './enums/IconTypes'

import { mapState } from 'vuex'
export default {
  components: { BaseButton, BaseIcon, HomePage },
  computed: {
    ...mapState(['isGameActive']),
    btnOptions() {
      return {
        colors: BtnColor,
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
