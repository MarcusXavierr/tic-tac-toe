import { createStore } from 'vuex'

export const store = createStore<State>({
  state() {
    return {
      isGameActive: false,
      XPlayer: null,
      OPlayer: null,
      playHistory: [],
      gameResults: []
    }
  },
  mutations: {}
})
