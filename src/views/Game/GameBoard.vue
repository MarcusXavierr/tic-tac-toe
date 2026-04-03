<template>
  <div class="cells">
    <BaseCell
      v-for="cell in cells"
      :key="cell.id"
      ref="cell"
      :selected-icon="cell.piece"
      :belongs-to-winner-path="cell.belongsToWinnerPath"
      :is-remote-hovered="cell.id === remoteHoverCell"
      @click="checkCell(cell.id)"
      @mouseenter="handleCellHover(cell)"
      @mouseleave="handleCellLeave"
    />
  </div>
  <GameHistory />
</template>

<script lang="ts">
import BaseCell from '@/components/base/BaseCell.vue'
import GameHistory from './GameHistory.vue'
import { mapState, mapMutations } from 'vuex'
import { getIconTypeFromPlayerTurn } from '../../services/IconService'
import { generateBoard, type move } from '@/services/BoardService'
import { multiplayerService } from '@/services/multiplayerServiceInstance'
import posthog from 'posthog-js'

export default {
  name: 'GameBoard',
  components: {
    BaseCell,
    GameHistory
  },
  data() {
    return {
      hoverReSendTimer: null as ReturnType<typeof setInterval> | null
    }
  },
  beforeUnmount() {
    this.handleCellLeave()
  },
  methods: {
    ...mapMutations(['addPlayToHistory', 'addAsyncPlayToHistory', 'makePlayersWait']),
    handleCellHover(cell: move) {
      if (!this.isMultiplayer || cell.piece != null || this.isWaitingToPlay) return
      if (this.hoverReSendTimer !== null) {
        clearInterval(this.hoverReSendTimer)
      }
      multiplayerService.sendHover(cell.id)
      const duration = Number(import.meta.env.VITE_REMOTE_HOVER_DURATION ?? 800)
      this.hoverReSendTimer = setInterval(() => {
        multiplayerService.sendHover(cell.id)
      }, duration)
    },
    handleCellLeave() {
      if (this.hoverReSendTimer !== null) {
        clearInterval(this.hoverReSendTimer)
        this.hoverReSendTimer = null
      }
    },
    checkCell(cellId: number) {
      if (this.isWaitingToPlay) {
        return
      }
      const cell = this.cells.find((cell) => cell.id == cellId)
      if (cell?.piece != null) {
        return
      }

      const data = { position: cellId, piece: getIconTypeFromPlayerTurn(this.currentPlayerType) }
      posthog.capture('game_move_made', {
        cell_id: cellId,
        move_number: this.playHistory.length + 1,
        game_mode: this.isMultiplayer ? 'multiplayer' : this.oponentIsAI ? 'vs_cpu' : 'vs_player'
      })

      if (this.isMultiplayer) {
        this.addPlayToHistory(data)
        multiplayerService.sendMove(cellId)
        this.makePlayersWait()
        return
      }

      if (this.oponentIsAI) {
        this.addAsyncPlayToHistory(data)
        return
      }

      this.addPlayToHistory(data)
    }
  },
  computed: {
    ...mapState([
      'playHistory',
      'currentPlayerType',
      'oponentIsAI',
      'isWaitingToPlay',
      'isMultiplayer',
      'remoteHoverCell'
    ]),
    cells(): move[] {
      return generateBoard(this.playHistory)
    }
  }
}
</script>

<style scoped>
.cells {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 1rem;
  justify-items: center;
  align-items: center;
  grid-auto-columns: auto;
  grid-auto-rows: auto;
}
</style>
