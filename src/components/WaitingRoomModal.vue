<template>
  <BaseModal :show="show" @click="$emit('close')">
    <div class="container-modal">
      <h3>Waiting other player to Join</h3>
      <p>Share this room ID with your friend</p>
      <p>Room ID: {{roomId}}</p>
    </div>
  </BaseModal>
</template>

<script lang="ts">
import BaseModal from './base/BaseModal.vue'

export default {
  name: 'WaitingRoomModal',
  emits: ['close'],
  components: {
    BaseModal,
  },
  props: {
    show: Boolean,
    roomId: {
      type: String,
      required: true
    }
  }
}
</script>

<style lang="scss" scoped>
.container-modal {
  height: 22.5rem;
  display: flex;
  text-align: center;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  padding: 1rem;
  gap: 1.5rem;
  max-width: 375px;
  h3 {
    font-size: 2rem;
    letter-spacing: 1.5px;
  }
  .options {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
}
.btn-group {
  display: flex;
  padding-bottom: 1rem;
  padding-top: 1.5rem;
}

.create-room {
  margin-top: 1rem;
}
.join-room {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  justify-content: center;
  input {
    padding: 0.5rem;
    border: 1px solid var(--silver-shadow);
    border-radius: 0.75rem;
    font-size: 1.1rem;
  }
}
</style>
