<template>
  <BaseModal :show="show">
    <div class="container">
      <h3>OPPONENT DISCONNECTED</h3>
      <p>Your opponent has left the game.</p>
      <BaseButton :button-color="colors.gray" @click="$emit('close')">BACK TO HOME</BaseButton>
    </div>
  </BaseModal>
</template>

<script lang="ts">
import BaseModal from './base/BaseModal.vue'
import BaseButton from './base/BaseButton.vue'
import { BtnColor } from '@/enums/ButtonTypes'

export default {
  name: 'OpponentDisconnectedModal',
  emits: ['close'],
  components: {
    BaseModal,
    BaseButton
  },
  props: {
    show: {
      type: Boolean,
      required: true
    }
  },
  computed: {
    colors() {
      return BtnColor
    }
  }
}
</script>

<style lang="scss" scoped>
.container {
  height: 14rem;
  display: flex;
  text-align: center;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  gap: 1.5rem;

  h3 {
    font-size: 1.5rem;
    letter-spacing: 1.5px;
  }

  p {
    opacity: 0.6;
  }
}
</style>
