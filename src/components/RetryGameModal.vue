<template>
  <BaseModal :show="show" @click="$emit('close')">
    <div class="container">
      <h3>RESTART GAME?</h3>
      <div class="btn-group">
        <BaseButton :button-color="colors.gray" @click="$emit('close')">NO, CANCEL</BaseButton>
        <BaseButton :button-color="colors.yellow" @click="restart()">YES, RESTART</BaseButton>
      </div>
    </div>
  </BaseModal>
</template>

<script lang="ts">
import { BtnColor } from '@/enums/ButtonTypes'
import { mapMutations } from 'vuex'
import BaseButton from './base/BaseButton.vue'
import BaseModal from './base/BaseModal.vue'
export default {
  name: 'RetryGameModal',
  emits: ['close'],
  components: {
    BaseModal,
    BaseButton
  },
  methods: {
    ...mapMutations(['restartGame']),
    restart() {
      this.restartGame()
      this.$emit('close')
    }
  },
  computed: {
    colors() {
      return BtnColor
    }
  },
  props: {
    show: {
      type: Boolean,
      required: true
    }
  }
}
</script>

<style scoped lang="scss">
.container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 3.75rem;

  h3 {
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1.75rem;
    letter-spacing: 1.5px;
  }
}

.btn-group {
  display: flex;
  gap: 1rem;
}
</style>
