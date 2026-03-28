<template>
  <div class="container">
    <img src="@/assets/logo.svg" alt="" />
    <PlayerSelector
      v-model:x-type-selected="xTypeSelected"
      v-model:o-type-selected="oTypeSelected"
    />
    <div class="buttons">
      <BaseButton :button-color="btnColors.yellow" :is-large="true" @click="startIAGame">
        NEW GAME (VS CPU)
      </BaseButton>
      <BaseButton :button-color="btnColors.blue" :is-large="true" @click="openMultiplayerModal">
        NEW GAME (VS PLAYER)
      </BaseButton>
    </div>

    <MultiplayerModal
      :show="showMultiplayerModal"
      :error-message="multiplayerError"
      @create="handleMultiplayerCreate"
      @join="handleMultiplayerJoin"
      @cancel="closeMultiplayerModal"
      @error-clear="multiplayerError = ''"
    />
  </div>
</template>

<script lang="ts">
import BaseButton from '@/components/base/BaseButton.vue'
import PlayerSelector from './PlayerSelector.vue'
import MultiplayerModal from '@/components/MultiplayerModal.vue'
import { BtnColor } from '@/enums/ButtonTypes'
import { Players } from '@/enums/Players'
import { PlayerTypes } from '@/enums/Players'
import { mapMutations } from 'vuex'

export default {
  name: 'HomePage',
  components: {
    BaseButton,
    PlayerSelector,
    MultiplayerModal
  },
  data() {
    return {
      btnColors: BtnColor,
      xTypeSelected: true,
      oTypeSelected: false,
      showMultiplayerModal: false,
      multiplayerError: ''
    }
  },
  methods: {
    ...mapMutations(['activateGame']),
    startIAGame() {
      this.activateGame({ ...this.players, oponentIsAI: true })
    },
    openMultiplayerModal() {
      this.showMultiplayerModal = true
    },
    closeMultiplayerModal() {
      this.showMultiplayerModal = false
    },
    handleMultiplayerCreate(roomName: string, playerName: string, playerType: PlayerTypes) {
      // Phase 2: call MultiplayerService.createRoom(roomName) then joinRoom(roomName, playerName)
      console.log('create', { roomName, playerName, playerType })
    },
    handleMultiplayerJoin(roomName: string, playerName: string) {
      // Phase 2: call MultiplayerService.joinRoom(roomName, playerName)
      console.log('join', { roomName, playerName })
    }
  },
  computed: {
    players() {
      if (this.oTypeSelected) {
        return {
          OPlayer: Players.playerOne,
          XPlayer: Players.playerTwo
        }
      }
      return {
        OPlayer: Players.playerTwo,
        XPlayer: Players.playerOne
      }
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
  width: 100%;
}
</style>
