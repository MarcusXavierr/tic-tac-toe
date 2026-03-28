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
      @create="handleCreate"
      @join="handleJoin"
      @cancel="handleCancel"
    />
  </div>
</template>

<script lang="ts">
import BaseButton from '@/components/base/BaseButton.vue'
import PlayerSelector from './PlayerSelector.vue'
import MultiplayerModal from '@/components/MultiplayerModal.vue'
import { BtnColor } from '@/enums/ButtonTypes'
import { Players, PlayerTypes } from '@/enums/Players'
import { mapMutations } from 'vuex'
import { multiplayerService } from '@/services/multiplayerServiceInstance'
import type { ServerMessage } from '@/services/MultiplayerService'
import { getIconTypeFromPlayerTurn } from '@/services/IconService'
import { swapIconType } from '@/services/utils/player'

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
      // playerName set during create/join, used to infer myPlayerType on player_joined
      _pendingPlayerName: '' as string,
      _pendingRoomName: '' as string
    }
  },
  methods: {
    ...mapMutations(['activateGame', 'setMultiplayerState', 'clearMultiplayerState']),

    openMultiplayerModal() {
      this.showMultiplayerModal = true
    },

    async handleCreate(roomName: string, playerName: string, playerType: PlayerTypes) {
      this._pendingRoomName = roomName
      this._pendingPlayerName = playerName
      await multiplayerService.createRoom(roomName)
      this.$store.commit('setMultiplayerState', {
        myPlayerType: playerType,
        opponentName: '',
        roomName,
        isWaitingForOpponent: true,
        isConnected: true
      })
      const typeParam: 'x' | 'o' = playerType === PlayerTypes.XPlayer ? 'x' : 'o'
      multiplayerService.joinRoom(
        roomName,
        playerName,
        (msg) => this._handleServerMessage(msg),
        () => this._handleConnectionClose(),
        typeParam
      )
    },

    handleJoin(roomName: string, playerName: string) {
      this._pendingRoomName = roomName
      this._pendingPlayerName = playerName
      this.$store.commit('setMultiplayerState', {
        myPlayerType: null,
        opponentName: '',
        roomName,
        isWaitingForOpponent: true,
        isConnected: true
      })
      multiplayerService.joinRoom(
        roomName,
        playerName,
        (msg) => this._handleServerMessage(msg),
        () => this._handleConnectionClose()
      )
    },

    handleCancel() {
      multiplayerService.disconnect()
      this.$store.commit('clearMultiplayerState')
      this.showMultiplayerModal = false
    },

    _handleServerMessage(msg: ServerMessage) {
      if (msg.type === 'move') {
        const myPiece = getIconTypeFromPlayerTurn(this.$store.state.myPlayerType)
        const opponentPiece = swapIconType(myPiece)
        this.$store.commit('addPlayToHistory', { position: msg.cell, piece: opponentPiece })
        return
      }

      if (msg.type === 'play_again') {
        this.$store.commit('receivePlayAgain')
        return
      }

      if (msg.type === 'player_disconnected') {
        this.$store.commit('setMultiplayerState', {
          myPlayerType: this.$store.state.myPlayerType,
          opponentName: this.$store.state.opponentName,
          roomName: this.$store.state.roomName,
          isWaitingForOpponent: false,
          isConnected: false,
          opponentDisconnected: true
        })
        return
      }

      if (msg.type === 'player_joined') {
        // The server tells us the *opponent's* player_type.
        // We are the opposite.
        const opponentType = msg.player_type === 'x' ? PlayerTypes.XPlayer : PlayerTypes.OPlayer
        const myType =
          opponentType === PlayerTypes.XPlayer ? PlayerTypes.OPlayer : PlayerTypes.XPlayer

        this.$store.commit('setMultiplayerState', {
          myPlayerType: myType,
          opponentName: msg.name,
          roomName: this._pendingRoomName,
          isWaitingForOpponent: false,
          isConnected: true
        })

        // X always goes first; if I'm O I wait for the first move
        const isWaitingToPlay = myType === PlayerTypes.OPlayer

        this.$store.commit('activateGame', {
          XPlayer: Players.playerOne,
          OPlayer: Players.playerTwo,
          oponentIsAI: false,
          isMultiplayer: true
        })

        // Override isWaitingToPlay set by activateGame based on turn assignment
        if (isWaitingToPlay) {
          this.$store.commit('makePlayersWait')
        } else {
          this.$store.commit('finishWaiting')
        }

        this.showMultiplayerModal = false
      }
    },

    _handleConnectionClose() {
      // Only fires on unexpected close (disconnect() nulls onclose first)
      this.$store.commit('setMultiplayerState', {
        myPlayerType: this.$store.state.myPlayerType,
        opponentName: this.$store.state.opponentName,
        roomName: this.$store.state.roomName,
        isWaitingForOpponent: false,
        isConnected: false,
        opponentDisconnected: true
      })
    },

    startGame() {
      this.activateGame({ ...this.players, oponentIsAI: false })
    },
    startIAGame() {
      this.activateGame({ ...this.players, oponentIsAI: true })
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

.player-type {
  img {
    color: blue;
  }
}
</style>
