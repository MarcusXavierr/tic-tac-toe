import { IconType } from '@/enums/IconTypes'
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
      console.log(data)
      state.playHistory = state.playHistory.concat(data)
      state.currentPlayerType = state.currentPlayerType == PlayerTypes.XPlayer ? PlayerTypes.OPlayer : PlayerTypes.XPlayer
      console.log(data)
    }
  }
})
