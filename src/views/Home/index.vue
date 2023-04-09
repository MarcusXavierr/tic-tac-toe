<template>
  <div class="container">
    <img src="@/assets/logo.svg" alt="" />
    <PlayerSelector/>
    <div class="buttons">
      <BaseButton :button-color="btnColors.yellow" :is-large="true">NEW GAME (VS CPU)</BaseButton>
      <BaseButton :button-color="btnColors.blue" :is-large="true">NEW GAME (VS PLAYER)</BaseButton>
    </div>
  </div>
</template>

<script lang="ts">
import BaseButton from '@/components/base/BaseButton.vue'
import PlayerSelector from './PlayerSelector.vue'
import { BtnColor } from '@/enums/ButtonTypes'

export default {
  name: 'HomePage',
  components: {
    BaseButton,
    PlayerSelector
  },
  data() {
    return {
      btnColors: BtnColor
    }
  }
}
</script>

<style lang="scss" scoped>
.container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.player-type {
  img {
    color: blue;
  }
}
</style>
