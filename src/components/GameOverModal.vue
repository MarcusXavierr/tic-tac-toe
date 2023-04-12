<template>
  <BaseModal :show="show" @click="$emit('close')"></BaseModal>
</template>

<script lang="ts">
import BaseModal from './base/BaseModal.vue'

export default {
  name: 'GameOverModal',
  emits: ['close'],
  components: {
    BaseModal
  },
  props: {
    show: Boolean,
    winner: {
      type: Number,
      required: true
    }
  }
}
</script>
