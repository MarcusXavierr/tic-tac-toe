import { determineWinner } from '@/services/GameService'
import { createStore } from 'vuex'
import type { Client } from 'webstomp-client'
import { Players, PlayerTypes } from '../enums/Players'

interface ActivateOptions {
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
      isOnlineGame: false
    }
  },
  mutations: {
    activateGame(state, data: ActivateOptions) {
      state.OPlayer = data.OPlayer,
      state.XPlayer = data.XPlayer
      state.currentPlayerType = PlayerTypes.XPlayer
      state.oponentIsAI = data.oponentIsAI
      state.isWaitingToPlay = data.oponentIsAI && data.XPlayer == Players.playerTwo
      state.isGameActive = true
    },

    activateOnlineGame(state, data: ActivateOptions) {
      state.OPlayer = data.OPlayer,
      state.XPlayer = data.XPlayer
      state.currentPlayerType = PlayerTypes.XPlayer
      state.oponentIsAI = false
      state.isGameActive = true
      state.isOnlineGame = true
    },

    addPlayToHistory(state, data: MoveRecord) {
      state.playHistory = state.playHistory.concat(data)
      state.currentPlayerType = swapPlayerTypes(state.currentPlayerType)
      state.isWaitingToPlay = false
    },

    addAsyncPlayToHistory(state, data: MoveRecord) {
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
    },
    setWebsocketClient(state, client: Client) {
      state.websocketClient = client
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
