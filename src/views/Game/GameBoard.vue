<template>
  <div class="cells">
    <BaseCell
      v-for="cell in cells"
      :key="cell.id"
      ref="cell"
      :selected-icon="cell.playerChoice"
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

interface cell {
  id: number
  playerChoice: number
}

export default {
  name: 'GameBoard',
  components: {
    BaseCell,
    GameHistory
  },
  data() {
    return {
      cellData: [
        { id: 1, playerChoice: null },
        { id: 2, playerChoice: null },
        { id: 3, playerChoice: null },
        { id: 4, playerChoice: null },
        { id: 5, playerChoice: null },
        { id: 6, playerChoice: null },
        { id: 7, playerChoice: null },
        { id: 8, playerChoice: null },
        { id: 9, playerChoice: null }
      ]
    }
  },
  methods: {
    ...mapMutations(['addPlayToHistory']),
    checkCell(cellId: number) {
      const cell = this.cells.find((cell: cell) => cell.id == cellId) as cell
      if (cell.playerChoice != null) {
        return
      }
      const data = { position: cellId, piece: getIconTypeFromPlayerTurn(this.currentPlayerType)}
      this.addPlayToHistory(data)
    }
  },
  computed: {
    ...mapState(['playHistory', 'currentPlayerType']),
    cells() {
      return this.cellData.map((cell: any): any => {
        const item = this.playHistory.find((x: any) => x.position == cell.id)
        if (!item) {
          return cell
        }

        return { ...cell, playerChoice: item.piece }
      })
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
