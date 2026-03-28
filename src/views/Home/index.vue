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
      <BaseButton :button-color="btnColors.blue" :is-large="true" @click="startGame">
        NEW GAME (ONLINE)
      </BaseButton>
    </div>
    <OnlineRoomModal
      :show="showMultiplayerGameModal"
      :selected="playerPiece"
      @close="showMultiplayerGameModal = false"
      @create="createRoom"
      @join="joinRoom"
    />
    <WaitingRoomModal :show="isWaitingForOponentJoin && !showMultiplayerGameModal" :room-id="service.roomId" />
  </div>
</template>

<script lang="ts">
import BaseButton from '@/components/base/BaseButton.vue'
import PlayerSelector from './PlayerSelector.vue'
import { BtnColor } from '@/enums/ButtonTypes'
import { Players, PlayerTypes } from '@/enums/Players'
import { mapMutations, mapState } from 'vuex'
import OnlineRoomModal from '@/components/OnlineRoomModal.vue'
import { OnlineGameService } from '@/services/OnlineGame.service'
import WaitingRoomModal from '@/components/WaitingRoomModal.vue'

export default {
  name: 'HomePage',
  components: {
    BaseButton,
    PlayerSelector,
    OnlineRoomModal,
    WaitingRoomModal
},
  data() {
    return {
      btnColors: BtnColor,
      xTypeSelected: true,
      oTypeSelected: false,
      showMultiplayerGameModal: false,
      service: new OnlineGameService()
    }
  },
  methods: {
    ...mapMutations(['activateGame']),
    startGame() {
      // this.activateGame({ ...this.players, oponentIsAI: false })
      this.showMultiplayerGameModal = true
    },
    startIAGame() {
      this.activateGame({ ...this.players, oponentIsAI: true })
    },
    createRoom() {
      this.showMultiplayerGameModal = false
      this.service.createRoom(this.playerPiece)
    },
    joinRoom(roomId: string) {
      this.showMultiplayerGameModal = false
      this.service.joinRoom(roomId)
    }
  },
  computed: {
    ...mapState(['isWaitingForOponentJoin']),
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
    },
    playerPiece() {
      return this.xTypeSelected ? PlayerTypes.XPlayer : PlayerTypes.OPlayer
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

.player-type {
  img {
    color: blue;
  }
}
</style>
