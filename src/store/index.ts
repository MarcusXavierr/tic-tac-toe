import { determineWinner } from '@/services/GameService'
import { createStore } from 'vuex'
import { Players, PlayerTypes } from '../enums/Players'

interface activateData {
  XPlayer: Players
  OPlayer: Players
  oponentIsAI: boolean
  isMultiplayer?: boolean
}

interface MultiplayerPayload {
  myPlayerType: PlayerTypes | null
  opponentName: string
  roomName: string
  isWaitingForOpponent: boolean
  isConnected: boolean
  opponentDisconnected?: boolean
}

function detectInitialLocale(): string {
  // Check localStorage first for saved preference
  const saved = localStorage.getItem('app-locale')
  if (saved === 'en' || saved === 'pt') return saved

  // Fall back to browser detection
  const lang = (navigator.language || navigator.languages?.[0] || 'en').toLowerCase()
  let fallback = 'en'
  if (lang.startsWith('pt')) {
    fallback = 'pt'
  }
  localStorage.setItem('app-locale', fallback)

  return fallback
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
      // multiplayer
      isMultiplayer: false,
      myPlayerType: null,
      opponentName: '',
      roomName: '',
      isWaitingForOpponent: false,
      isConnected: false,
      opponentDisconnected: false,
      playAgainSent: false,
      playAgainReceived: false,
      remoteHoverCell: null,
      // i18n locale
      locale: detectInitialLocale()
    }
  },
  mutations: {
    activateGame(state, data: activateData) {
      state.OPlayer = data.OPlayer
      state.XPlayer = data.XPlayer
      state.currentPlayerType = PlayerTypes.XPlayer
      state.oponentIsAI = data.oponentIsAI
      state.isMultiplayer = data.isMultiplayer ?? false
      state.isWaitingToPlay = data.oponentIsAI && data.XPlayer == Players.playerTwo
      state.isGameActive = true
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
      state.isWaitingToPlay = state.oponentIsAI && state.XPlayer == Players.playerTwo
    },
    quitGame(state) {
      state.isGameActive = false
      state.gameResults = []
      store.commit('restartGame')
    },
    nextRound(state) {
      const winner = determineWinner(state.playHistory)
      state.gameResults = state.gameResults.concat({ winner })
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
    setMultiplayerState(state, payload: MultiplayerPayload) {
      state.myPlayerType = payload.myPlayerType
      state.opponentName = payload.opponentName
      state.roomName = payload.roomName
      state.isWaitingForOpponent = payload.isWaitingForOpponent
      state.isConnected = payload.isConnected
      if (payload.opponentDisconnected !== undefined) {
        state.opponentDisconnected = payload.opponentDisconnected
      }
    },
    clearMultiplayerState(state) {
      state.isMultiplayer = false
      state.myPlayerType = null
      state.opponentName = ''
      state.roomName = ''
      state.isWaitingForOpponent = false
      state.isConnected = false
      state.opponentDisconnected = false
      state.playAgainSent = false
      state.playAgainReceived = false
      state.remoteHoverCell = null
    },
    setRemoteHover(state, cell: number) {
      state.remoteHoverCell = cell
    },
    clearRemoteHover(state) {
      state.remoteHoverCell = null
    },
    sendPlayAgain(state) {
      if (state.playAgainSent) return // double-click guard
      state.playAgainSent = true
    },
    receivePlayAgain(state) {
      state.playAgainReceived = true
    },
    resetRound(state) {
      const winner = determineWinner(state.playHistory)
      state.gameResults = state.gameResults.concat({ winner })
      state.playHistory = []
      state.currentPlayerType = PlayerTypes.XPlayer
      state.isWaitingToPlay = state.myPlayerType === PlayerTypes.OPlayer
      state.playAgainSent = false
      state.playAgainReceived = false
    },
    setLocale(state, locale: string) {
      state.locale = locale
      localStorage.setItem('app-locale', locale)
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
