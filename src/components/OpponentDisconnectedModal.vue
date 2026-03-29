<template>
  <BaseModal :show="show">
    <div class="container">
      <h3>{{ $t('opponentDisconnectedModal.title') }}</h3>
      <p>{{ $t('opponentDisconnectedModal.message') }}</p>
      <BaseButton :button-color="colors.gray" @click="$emit('close')">{{
        $t('opponentDisconnectedModal.backToHome')
      }}</BaseButton>
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
