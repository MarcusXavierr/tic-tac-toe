<template>
  <nav class="navbar">
    <img src="../../assets/logo.svg" alt="" />
    <div class="turn">
      <img src="../../assets/gray-icons/icon-x.svg" alt="icon representing actual turn" width="16">
      TURN
    </div>
    <BaseButton :button-color="buttonOptions.gray"
      ><BaseIcon :icon-type="iconOptions.Restart"
    /></BaseButton>
  </nav>
</template>

<script lang="ts">
import BaseButton from '@/components/base/BaseButton.vue'
import BaseIcon from '@/components/base/BaseIcon.vue'
import { BtnColor } from '@/enums/ButtonTypes'
import { IconType } from '@/enums/IconTypes'

export default {
  name: 'NavBar',
  components: {
    BaseButton,
    BaseIcon
  },
  computed: {
    buttonOptions() {
      return BtnColor
    },
    iconOptions() {
      return IconType
    }
  }
}
</script>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.turn {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  background: var(--semi-dark-navy);
  padding: 0.5rem 1rem 0.75rem 1rem;
  box-shadow: inset 0px -4px 0px #10212A;
  border-radius: 0.25rem;
}
</style>
