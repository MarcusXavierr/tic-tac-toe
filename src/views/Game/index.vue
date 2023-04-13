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
  </div>
</template>

<script lang="ts">
import NavBar from './NavBar.vue'
import GameBoard from './GameBoard.vue'
import { mapGetters, mapMutations, mapState } from 'vuex'
import { determineWinner } from '@/services/GameService'
import { PlayerTypes } from '@/enums/Players'
import GameOverModal from '@/components/GameOverModal.vue'
import { createRandomMovement } from '@/services/BoardService'
import { getIconTypeFromPlayerTurn } from '@/services/IconService'

export default {
  name: 'GamePage',
  components: {
    NavBar,
    GameBoard,
    GameOverModal
  },
  data() {
    return {
      showModal: false,
      winner: -1,
      player: -1
    }
  },
  computed: {
    ...mapState(['playHistory', 'isWaitingToPlay', 'currentPlayerType']),
    ...mapGetters(['getPlayer'])
  },
  watch: {
    playHistory() {
      const winner = determineWinner(this.playHistory)
      if (winner == null && this.playHistory.length < 9) {
        return
      }
      switch (winner) {
        case PlayerTypes.OPlayer:
          this.show(PlayerTypes.OPlayer)
          break
        case PlayerTypes.XPlayer:
          this.show(PlayerTypes.XPlayer)
          break
        default:
          this.show(-1)
      }
    },
    isWaitingToPlay() {
      const winner = determineWinner(this.playHistory)
      const shouldMakeAIMove = this.isWaitingToPlay && this.playHistory.length < 9 && winner == null

      if (shouldMakeAIMove) {
        const move = createRandomMovement(
          this.playHistory,
          getIconTypeFromPlayerTurn(this.currentPlayerType)
        )

        setTimeout(() => this.addPlayToHistory(move), 300)
      }
    }
  },
  methods: {
    ...mapMutations(['quitGame', 'nextRound', 'addPlayToHistory']),
    show(winner: PlayerTypes | null) {
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
