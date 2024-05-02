<template>
  <div class="cells">
    <BaseCell
      v-for="cell in cells"
      :key="cell.id"
      ref="cell"
      :selected-icon="cell.piece"
      :belongs-to-winner-path="cell.belongsToWinnerPath"
      @click="checkCell(cell.id)"
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
import type { Client } from 'webstomp-client'
import type { Room } from '@/services/OnlineGame.service'

export default {
  name: 'GameBoard',
  components: {
    BaseCell,
    GameHistory
  },
  methods: {
    ...mapMutations(['addPlayToHistory', 'addAsyncPlayToHistory']),
    checkCell(cellId: number) {
      if (this.isWaitingToPlay) {
        return
      }
      const cell = this.cells.find((cell) => cell.id == cellId)
      if (cell?.piece != null) {
        return
      }

      const data = { position: cellId, piece: getIconTypeFromPlayerTurn(this.currentPlayerType) }
      if (this.oponentIsAI) {
        this.addAsyncPlayToHistory(data)
        return
      }

      if (this.isOnlineGame) {
        // TODO: refactor to make this a method
        this.addAsyncPlayToHistory(data)
        const ws = this.websocketClient as Client
        const room = this.room as Room
        // TODO: Remove this magic string
        ws.send(`/app/rooms/${room.roomId}`, JSON.stringify({...data, userId: this.userId}))
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
		'isOnlineGame',
		'websocketClient',
		'room',
		'userId'
    ]),
    cells(): move[] {
      return generateBoard(this.playHistory)
    },
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
