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
    }
  }
})

function swapPlayerTypes(currentPlayerType?: number) {
  if (currentPlayerType == PlayerTypes.XPlayer) {
    return PlayerTypes.OPlayer
  }

  return PlayerTypes.XPlayer
}
