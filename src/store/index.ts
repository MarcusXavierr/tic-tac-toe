import { determineWinner } from '@/services/GameService'
import { createStore } from 'vuex'
import { PlayerTypes } from '../enums/Players'

interface activateData {
  XPlayer: number,
  OPlayer: number
}

export const store = createStore<State>({
  state() {
    return {
      isGameActive: false,
      XPlayer: null,
      OPlayer: null,
      playHistory: [],
      gameResults: [],
    }
  },
  mutations: {
    activateGame(state, data: activateData) {
      state.OPlayer = data.OPlayer,
      state.XPlayer = data.XPlayer
      state.currentPlayerType = PlayerTypes.XPlayer
      state.isGameActive = true
    },
    addPlayToHistory(state, data: moveRecord ) {
      state.playHistory = state.playHistory.concat(data)
      state.currentPlayerType = swapPlayerTypes(state.currentPlayerType)
    },
    restartGame(state) {
      state.playHistory = []
      state.currentPlayerType = PlayerTypes.XPlayer
    },
    quitGame(state) {
      state.isGameActive = false
      state.gameResults = []

      store.commit('restartGame')
    },
    nextRound(state) {
      const winner = determineWinner(state.playHistory)
      state.gameResults = state.gameResults.concat({winner})

      store.commit('restartGame')

    }
  },
  getters: {
    getPlayer: (state) => (player: PlayerTypes) => {
      if (player == PlayerTypes.OPlayer) {
        return state.OPlayer
      }
      return state.XPlayer
    }
  }
})

function swapPlayerTypes(currentPlayerType?: number) {
  if (currentPlayerType == PlayerTypes.XPlayer) {
    return PlayerTypes.OPlayer
  }

  return PlayerTypes.XPlayer
}
