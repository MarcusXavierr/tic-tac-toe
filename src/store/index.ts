import { createStore } from 'vuex'

export const store = createStore({
  state() {
    return {
      isGameActive: false,
      XPlayer: null,
      OPlayer: null,
      playHistory: [{
        position: 1,
        piece: 1
      }],
      gameResults: [{ winner: null }]
    }
  },
  mutations: {}
})
