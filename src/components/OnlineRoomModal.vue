<template>
  <BaseModal :show="show" @click="$emit('close')">
    <div class="container-modal">
      <div class="options">
        <h3>Join Room</h3>
        <div class="join-room">
          <input
            type="text"
            placeholder="Enter Room ID"
            v-model="roomId"
          >
          <BaseButton :button-color="colors.blue" @click="$emit('join', roomId)">
            JOIN
          </BaseButton>
        </div>
        <!-- Create room -->
        <h3>Or</h3>
        <BaseButton :button-color="colors.yellow" @click="$emit('create')" class="create-room">CREATE ROOM AS {{selected}} PLAYER</BaseButton>
        <div class="btn-group">
          <BaseButton :button-color="colors.gray" @click="$emit('close')" is-small>CLOSE</BaseButton>
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<script lang="ts">
import BaseModal from './base/BaseModal.vue'
import BaseButton from './base/BaseButton.vue'
import { BtnColor } from '@/enums/ButtonTypes'
import { PlayerTypes } from '@/enums/Players'
import { IconType } from '@/enums/IconTypes'

export default {
  name: 'OnlineRoomModal',
  emits: ['close', 'join', 'create'],
  components: {
    BaseModal,
    BaseButton
  },
  data() {
    return {
      roomId: ''
    }
  },
  props: {
    show: Boolean,
    selected: {
      type: Object,
      required: true
    }
  },
  computed: {
    colors() {
      return BtnColor
    },
    playerTypes() {
      return PlayerTypes
    },
    icons() {
      return IconType
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
