import { createStore } from 'vuex'

interface State {
  foo: string
}
export const store = createStore<State>({
  state() {
    return {
      foo: 'fighters',
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
