import { IconType } from '@/enums/IconTypes'
import { determineWinner } from '@/services/GameService'
import { createStore } from 'vuex'
import { Players, PlayerTypes } from '../enums/Players'

interface activateData {
  XPlayer: Players,
  OPlayer: Players,
  oponentIsAI: boolean
}

export const store = createStore<State>({
  state() {
    return {
      oponentIsAI: false,
      isWaitingToPlay: false,
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
      state.oponentIsAI = data.oponentIsAI
      state.isWaitingToPlay = data.oponentIsAI && data.XPlayer == Players.playerTwo
      state.isGameActive = true
    },
    addPlayToHistory(state, data: moveRecord ) {
      state.playHistory = state.playHistory.concat(data)
      state.currentPlayerType = swapPlayerTypes(state.currentPlayerType)
      state.isWaitingToPlay = false
    },

    addAsyncPlayToHistory(state, data: moveRecord) {
      state.playHistory = state.playHistory.concat(data)
      state.currentPlayerType = swapPlayerTypes(state.currentPlayerType)
      state.isWaitingToPlay = true
    },

    allowUserToPlay(state) {
      state.isWaitingToPlay = false
    },

    restartGame(state) {
      state.playHistory = []
      state.currentPlayerType = PlayerTypes.XPlayer
      state.isWaitingToPlay = !state.isWaitingToPlay
      state.isWaitingToPlay = state.oponentIsAI && state.XPlayer == Players.playerTwo
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
    },
    makePlayersWait(state) {
      state.isWaitingToPlay = true
    },
    finishWaiting(state) {
      state.isWaitingToPlay = false
    },

    addWinnerPathToHistory(state, history) {
      state.playHistory = history
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
