<template>
  <div class="container">
    <img src="../assets/logo.svg" alt="" />
    <div class="selector">
      PICK PLAYER 1'S MARK
      <div class="player-type">
        <BaseIcon :icon-type="1" />
        <img src="../assets/icon-o-outline.svg" alt="" />
      </div>
      <p class="disclaimer">REMEMBER: X GOES FIRST</p>
    </div>
    <div class="buttons">
      <BaseButton :button-color="btnColors.yellow" :is-large="true">NEW GAME (VS CPU)</BaseButton>
      <BaseButton :button-color="btnColors.blue" :is-large="true">NEW GAME (VS PLAYER)</BaseButton>
    </div>
  </div>
</template>

<script lang="ts">
import BaseIcon from '@/components/base/BaseIcon.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { BtnColor } from '@/enums/ButtonTypes'

export default {
  name: 'HomePage',
  components: {
    BaseIcon,
    BaseButton
  },
  data() {
    return {
      btnColors: BtnColor
    }
  }
}
</script>

<style lang="scss">
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.selector {
  background-color: var(--semi-dark-navy);
  padding: 1.5rem;
  font-weight: 700;
  text-align: center;

  .disclaimer {
    opacity: 0.5;
  }
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
