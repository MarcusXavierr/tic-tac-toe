<template>
  <BaseModal :show="show" @click="$emit('close')">
    <div class="container">
      <h3>ROUND TIED</h3>
      <div class="btn-group">
        <BaseButton :button-color="colors.gray">QUIT</BaseButton>
        <BaseButton :button-color="colors.yellow">NEXT ROUND</BaseButton>
      </div>
    </div>
  </BaseModal>
</template>

<script lang="ts">
import BaseModal from './base/BaseModal.vue'
import BaseButton from './base/BaseButton.vue'
import { BtnColor } from '@/enums/ButtonTypes'

export default {
  name: 'GameOverModal',
  emits: ['close'],
  components: {
    BaseModal,
    BaseButton
  },
  props: {
    show: Boolean,
    winner: {
      type: Number,
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
  height: 16.5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1.5rem;
  h3 {
    font-size: 2rem;
    letter-spacing: 1.5px;
  }
}
.btn-group {
  display: flex;
  gap: 1rem;
}
</style>
