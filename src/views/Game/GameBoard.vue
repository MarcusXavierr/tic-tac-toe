<template>
  <div class="cells">
    <BaseCell
      v-for="cell in cells"
      :key="cell.id"
      :selected-icon="cell.playerChoice"
      @click="checkCell(cell.id)"
    />
  </div>
</template>

<script lang="ts">
import BaseCell from '@/components/base/BaseCell.vue'
import { mapState, mapMutations } from 'vuex'
import { getIconTypeFromPlayerTurn } from '../../services/IconService'

interface cell {
  id: number
  playerChoice: number
}

export default {
  name: 'GameBoard',
  components: {
    BaseCell
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
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: space-between;
}
</style>
