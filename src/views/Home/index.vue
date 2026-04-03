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
      :error-message="errorMessage"
      @create="handleCreate"
      @join="handleJoin"
      @cancel="handleCancel"
      @error-clear="handleErrorClear"
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
import posthog from 'posthog-js'

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
      _pendingRoomName: '' as string,
      _hoverTimeout: null as ReturnType<typeof setTimeout> | null,
      errorMessage: '' as string,
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
      ;(this as any).errorMessage = ''
      try {
        await multiplayerService.createRoom(roomName)
      } catch (err: any) {
        const raw: string = err?.message ?? ''
        if (raw.toLowerCase().includes('already exists')) {
          ;(this as any).errorMessage = (this as any).$t('home.errors.roomAlreadyExists')
        } else {
          ;(this as any).errorMessage = raw.charAt(0).toUpperCase() + raw.slice(1)
        }
        posthog.capture('multiplayer_connection_error', { reason: raw, action: 'create' })
        return
      }
      posthog.capture('multiplayer_room_created', { room_name: roomName })
      ;(this as any).$store.commit('setMultiplayerState', {
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
      posthog.capture('multiplayer_room_joined', { room_name: roomName })
      ;(this as any).$store.commit('setMultiplayerState', {
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
      ;(this as any).$store.commit('clearMultiplayerState')
      this.showMultiplayerModal = false
    },

    _handleServerMessage(msg: ServerMessage) {
      if (msg.type === 'error') {
        const messages: Record<string, string> = {
          room_not_found: 'Room not found',
          room_full: 'Room is full'
        }
        ;(this as any).errorMessage =
          messages[msg.reason] ?? (this as any).$t('home.errors.connectionError')
        posthog.capture('multiplayer_connection_error', { reason: msg.reason, action: 'join' })
        return
      }

      if (msg.type === 'move') {
        const myPiece = getIconTypeFromPlayerTurn((this as any).$store.state.myPlayerType)
        const opponentPiece = swapIconType(myPiece)
        ;(this as any).$store.commit('addPlayToHistory', { position: msg.cell, piece: opponentPiece })
        return
      }

      if (msg.type === 'play_again') {
        ;(this as any).$store.commit('receivePlayAgain')
        return
      }

      if (msg.type === 'hover') {
        this._handleOpponentHover(msg.cell)
        return
      }

      if (msg.type === 'player_disconnected') {
        posthog.capture('multiplayer_opponent_disconnected', {
          room_name: (this as any).$store.state.roomName
        })
        ;(this as any).$store.commit('setMultiplayerState', {
          myPlayerType: (this as any).$store.state.myPlayerType,
          opponentName: (this as any).$store.state.opponentName,
          roomName: (this as any).$store.state.roomName,
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

        ;(this as any).$store.commit('setMultiplayerState', {
          myPlayerType: myType,
          opponentName: msg.name,
          roomName: this._pendingRoomName,
          isWaitingForOpponent: false,
          isConnected: true
        })

        // X always goes first; if I'm O I wait for the first move
        const isWaitingToPlay = myType === PlayerTypes.OPlayer

        ;(this as any).$store.commit('activateGame', {
          XPlayer: Players.playerOne,
          OPlayer: Players.playerTwo,
          oponentIsAI: false,
          isMultiplayer: true
        })

        posthog.capture('multiplayer_game_started', {
          room_name: this._pendingRoomName,
          my_piece: myType === PlayerTypes.XPlayer ? 'x' : 'o'
        })

        // Override isWaitingToPlay set by activateGame based on turn assignment
        if (isWaitingToPlay) {
          ;(this as any).$store.commit('makePlayersWait')
        } else {
          ;(this as any).$store.commit('finishWaiting')
        }

        this.showMultiplayerModal = false
      }
    },

    _handleOpponentHover(cell: number) {
      if (this._hoverTimeout) clearTimeout(this._hoverTimeout)

      ;(this as any).$store.commit('setRemoteHover', cell)

      const duration = Number(import.meta.env.VITE_REMOTE_HOVER_DURATION ?? 800)

      this._hoverTimeout = setTimeout(() => {
        ;(this as any).$store.commit('clearRemoteHover')
      }, duration)
    },

    _handleConnectionClose() {
      // Only fires on unexpected close (disconnect() nulls onclose first)
      ;(this as any).$store.commit('setMultiplayerState', {
        myPlayerType: (this as any).$store.state.myPlayerType,
        opponentName: (this as any).$store.state.opponentName,
        roomName: (this as any).$store.state.roomName,
        isWaitingForOpponent: false,
        isConnected: false,
        opponentDisconnected: true
      })
    },

    handleErrorClear() {
      ;(this as any).errorMessage = ''
    },

    startGame() {
      this.activateGame({ ...(this as any).players, oponentIsAI: false })
    },
    startIAGame() {
      const playerPiece = (this as any).oTypeSelected ? 'o' : 'x'
      posthog.capture('game_started', { game_mode: 'vs_cpu', player_piece: playerPiece })
      this.activateGame({ ...(this as any).players, oponentIsAI: true })
    }
  },
  computed: {
    players() {
      if ((this as any).oTypeSelected) {
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
