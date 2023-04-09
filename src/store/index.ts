import { createStore } from 'vuex'

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
      state.isGameActive = true
    }
  }
})
