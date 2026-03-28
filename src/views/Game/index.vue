<template>
  <div class="container">
    <NavBar />
    <GameBoard ref="board" />
    <GameOverModal
      :show="showModal"
      :winner="winner"
      :player-winner="player"
      @quit="quit()"
      @next="next()"
    />
    <OpponentDisconnectedModal :show="opponentDisconnected" @close="handleDisconnectClose()" />
  </div>
</template>

<script lang="ts">
import NavBar from './NavBar.vue'
import GameBoard from './GameBoard.vue'
import { mapGetters, mapMutations, mapState } from 'vuex'
import { determineWinner, mapWinner } from '@/services/GameService'
import { PlayerTypes } from '@/enums/Players'
import GameOverModal from '@/components/GameOverModal.vue'
import OpponentDisconnectedModal from '@/components/OpponentDisconnectedModal.vue'
import { createBestMovement } from '@/services/BoardService'
import { getIconTypeFromPlayerTurn } from '@/services/IconService'
import { swapIconType } from '@/services/utils/player'
import { multiplayerService } from '@/services/multiplayerServiceInstance'

export default {
  name: 'GamePage',
  components: {
    NavBar,
    GameBoard,
    GameOverModal,
    OpponentDisconnectedModal
  },
  data() {
    return {
      showModal: false,
      winner: -1,
      player: -1
    }
  },
  computed: {
    ...mapState([
      'playHistory',
      'isWaitingToPlay',
      'currentPlayerType',
      'isMultiplayer',
      'myPlayerType',
      'opponentDisconnected'
    ]),
    ...mapGetters(['getPlayer'])
  },
  watch: {
    playHistory() {
      const winner = determineWinner(this.playHistory)
      if ((winner == null && this.playHistory.length < 9) || this.hasWinnerPath(this.playHistory)) {
        return
      }

      switch (winner) {
        case PlayerTypes.OPlayer:
          this.show(PlayerTypes.OPlayer, 500)
          break
        case PlayerTypes.XPlayer:
          this.show(PlayerTypes.XPlayer, 500)
          break
        default:
          this.show(-1, 200)
      }
    },
    isWaitingToPlay: {
      handler() {
        if (this.isMultiplayer) return // AI logic does not apply in multiplayer

        const winner = determineWinner(this.playHistory)
        const gameIsOver = winner != null || this.playHistory.length == 9
        const shouldMakeAIMove = this.isWaitingToPlay && !gameIsOver

        if (shouldMakeAIMove) {
          setTimeout(() => {
            const move = createBestMovement(
              this.playHistory,
              getIconTypeFromPlayerTurn(this.currentPlayerType)
            )
            this.addPlayToHistory(move)
          }, 175)
        }
      },
      immediate: true
    }
  },
  methods: {
    ...mapMutations([
      'quitGame',
      'nextRound',
      'addPlayToHistory',
      'finishWaiting',
      'makePlayersWait',
      'addWinnerPathToHistory',
      'clearMultiplayerState'
    ]),

    handleOpponentMove(cell: number) {
      // Opponent's piece is the opposite of my piece
      const myPiece = getIconTypeFromPlayerTurn(this.myPlayerType)
      const opponentPiece = swapIconType(myPiece)
      this.addPlayToHistory({ position: cell, piece: opponentPiece })
    },

    handleDisconnectClose() {
      multiplayerService.disconnect()
      this.quitGame()
      this.clearMultiplayerState()
    },

    show(winner: number, delay: number) {
      this.makePlayersWait()
      if (winner != -1) {
        this.addWinnerPathToHistory(mapWinner(getIconTypeFromPlayerTurn(winner), this.playHistory))
      }

      setTimeout(() => {
        this.showItem(winner)
        this.finishWaiting()
      }, delay)
    },
    hasWinnerPath(history: any): boolean {
      return history.some((item: any) => item.belongsToWinnerPath)
    },
    showItem(winner: PlayerTypes | null) {
      const board = this.$refs.board as any
      const cells = board.$refs.cell
      this.$nextTick(() =>
        cells.forEach((cell: any) => cell.$el.dispatchEvent(new Event('mouseleave')))
      )

      this.winner = winner as PlayerTypes
      this.player = this.getPlayer(this.winner)
      this.showModal = true
    },
    quit() {
      this.showModal = false
      if (this.isMultiplayer) {
        multiplayerService.disconnect()
        this.clearMultiplayerState()
      }
      this.quitGame()
    },
    next() {
      this.nextRound()
      this.showModal = false
    }
  }
}
</script>

<style lang="scss" scoped>
.container {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 4rem;
}

@media (min-width: 772px) {
  .container {
    padding: 0;
  }
}
</style>
