import { Players, PlayerTypes } from '@/enums/Players'
import { store } from '@/store/index'
import { describe, it, expect, beforeEach } from 'vitest'

// Reset store before each test by quitting any active game
beforeEach(() => {
  store.commit('quitGame')
  store.commit('clearMultiplayerState')
})

function activateHumanVsHuman() {
  store.commit('activateGame', {
    XPlayer: Players.playerOne,
    OPlayer: Players.playerTwo,
    oponentIsAI: false
  })
}

describe('activateGame', () => {
  it('sets isGameActive to true', () => {
    activateHumanVsHuman()
    expect(store.state.isGameActive).toBe(true)
  })

  it('assigns player values', () => {
    activateHumanVsHuman()
    expect(store.state.XPlayer).toBe(Players.playerOne)
    expect(store.state.OPlayer).toBe(Players.playerTwo)
  })

  it('sets currentPlayerType to XPlayer at start', () => {
    activateHumanVsHuman()
    expect(store.state.currentPlayerType).toBe(PlayerTypes.XPlayer)
  })

  it('does not set isWaitingToPlay for human vs human', () => {
    activateHumanVsHuman()
    expect(store.state.isWaitingToPlay).toBe(false)
  })

  it('sets isWaitingToPlay when AI is player one (XPlayer)', () => {
    // AI plays as player 2 means human is player 1 (X), AI is O — no wait
    // AI plays as player 1 means AI is X — human waits for AI first move
    store.commit('activateGame', {
      XPlayer: Players.playerTwo, // AI is player two, assigned X role
      OPlayer: Players.playerOne,
      oponentIsAI: true
    })
    expect(store.state.isWaitingToPlay).toBe(true)
  })
})

describe('addPlayToHistory', () => {
  it('appends move to playHistory', () => {
    activateHumanVsHuman()
    store.commit('addPlayToHistory', { position: 5, piece: 0 })
    expect(store.state.playHistory).toHaveLength(1)
    expect(store.state.playHistory[0].position).toBe(5)
  })

  it('swaps currentPlayerType after each move', () => {
    activateHumanVsHuman()
    expect(store.state.currentPlayerType).toBe(PlayerTypes.XPlayer)
    store.commit('addPlayToHistory', { position: 1, piece: 0 })
    expect(store.state.currentPlayerType).toBe(PlayerTypes.OPlayer)
    store.commit('addPlayToHistory', { position: 2, piece: 1 })
    expect(store.state.currentPlayerType).toBe(PlayerTypes.XPlayer)
  })

  it('sets isWaitingToPlay to false', () => {
    activateHumanVsHuman()
    store.commit('makePlayersWait')
    store.commit('addPlayToHistory', { position: 3, piece: 0 })
    expect(store.state.isWaitingToPlay).toBe(false)
  })
})

describe('restartGame', () => {
  it('clears playHistory', () => {
    activateHumanVsHuman()
    store.commit('addPlayToHistory', { position: 1, piece: 0 })
    store.commit('restartGame')
    expect(store.state.playHistory).toStrictEqual([])
  })

  it('resets currentPlayerType to XPlayer', () => {
    activateHumanVsHuman()
    store.commit('addPlayToHistory', { position: 1, piece: 0 }) // now OPlayer
    store.commit('restartGame')
    expect(store.state.currentPlayerType).toBe(PlayerTypes.XPlayer)
  })
})

describe('nextRound', () => {
  it('records game result in gameResults', () => {
    activateHumanVsHuman()
    store.commit('nextRound')
    expect(store.state.gameResults).toHaveLength(1)
  })

  it('clears playHistory for next round', () => {
    activateHumanVsHuman()
    store.commit('addPlayToHistory', { position: 1, piece: 0 })
    store.commit('nextRound')
    expect(store.state.playHistory).toStrictEqual([])
  })
})

describe('quitGame', () => {
  it('sets isGameActive to false', () => {
    activateHumanVsHuman()
    store.commit('quitGame')
    expect(store.state.isGameActive).toBe(false)
  })

  it('clears gameResults', () => {
    activateHumanVsHuman()
    store.commit('nextRound')
    store.commit('quitGame')
    expect(store.state.gameResults).toStrictEqual([])
  })
})

describe('makePlayersWait / finishWaiting / allowUserToPlay', () => {
  it('makePlayersWait sets isWaitingToPlay to true', () => {
    activateHumanVsHuman()
    store.commit('makePlayersWait')
    expect(store.state.isWaitingToPlay).toBe(true)
  })

  it('finishWaiting sets isWaitingToPlay to false', () => {
    activateHumanVsHuman()
    store.commit('makePlayersWait')
    store.commit('finishWaiting')
    expect(store.state.isWaitingToPlay).toBe(false)
  })

  it('allowUserToPlay sets isWaitingToPlay to false', () => {
    activateHumanVsHuman()
    store.commit('makePlayersWait')
    store.commit('allowUserToPlay')
    expect(store.state.isWaitingToPlay).toBe(false)
  })
})

describe('addWinnerPathToHistory', () => {
  it('replaces playHistory with marked history', () => {
    activateHumanVsHuman()
    store.commit('addPlayToHistory', { position: 1, piece: 0 })
    const marked = [{ position: 1, piece: 0, belongsToWinnerPath: true }]
    store.commit('addWinnerPathToHistory', marked)
    expect(store.state.playHistory).toStrictEqual(marked)
  })
})

describe('activateGame with isMultiplayer flag', () => {
  it('sets isMultiplayer to true when flag is passed', () => {
    store.commit('activateGame', {
      XPlayer: Players.playerOne,
      OPlayer: Players.playerTwo,
      oponentIsAI: false,
      isMultiplayer: true
    })
    expect(store.state.isMultiplayer).toBe(true)
  })

  it('defaults isMultiplayer to false when flag is absent', () => {
    store.commit('activateGame', {
      XPlayer: Players.playerOne,
      OPlayer: Players.playerTwo,
      oponentIsAI: false
    })
    expect(store.state.isMultiplayer).toBe(false)
  })
})

describe('setMultiplayerState', () => {
  it('sets all multiplayer fields from payload', () => {
    store.commit('setMultiplayerState', {
      myPlayerType: PlayerTypes.XPlayer,
      opponentName: 'Alice',
      roomName: 'room-42',
      isWaitingForOpponent: false,
      isConnected: true
    })
    expect(store.state.myPlayerType).toBe(PlayerTypes.XPlayer)
    expect(store.state.opponentName).toBe('Alice')
    expect(store.state.roomName).toBe('room-42')
    expect(store.state.isWaitingForOpponent).toBe(false)
    expect(store.state.isConnected).toBe(true)
  })

  it('sets isWaitingForOpponent to true while waiting', () => {
    store.commit('setMultiplayerState', {
      myPlayerType: null,
      opponentName: '',
      roomName: 'lobby-1',
      isWaitingForOpponent: true,
      isConnected: true
    })
    expect(store.state.isWaitingForOpponent).toBe(true)
  })
})

describe('clearMultiplayerState', () => {
  it('resets all multiplayer fields to defaults', () => {
    store.commit('setMultiplayerState', {
      myPlayerType: PlayerTypes.OPlayer,
      opponentName: 'Bob',
      roomName: 'room-99',
      isWaitingForOpponent: false,
      isConnected: true
    })
    store.commit('clearMultiplayerState')
    expect(store.state.isMultiplayer).toBe(false)
    expect(store.state.myPlayerType).toBeNull()
    expect(store.state.opponentName).toBe('')
    expect(store.state.roomName).toBe('')
    expect(store.state.isWaitingForOpponent).toBe(false)
    expect(store.state.isConnected).toBe(false)
    expect(store.state.opponentDisconnected).toBe(false)
  })

  it('resets playAgainSent to false', () => {
    activateMultiplayer(PlayerTypes.XPlayer)
    store.commit('sendPlayAgain')
    expect(store.state.playAgainSent).toBe(true)
    store.commit('clearMultiplayerState')
    expect(store.state.playAgainSent).toBe(false)
  })

  it('resets playAgainReceived to false', () => {
    activateMultiplayer(PlayerTypes.XPlayer)
    store.commit('receivePlayAgain')
    expect(store.state.playAgainReceived).toBe(true)
    store.commit('clearMultiplayerState')
    expect(store.state.playAgainReceived).toBe(false)
  })
})

describe('opponentDisconnected flag', () => {
  it('setMultiplayerState can set opponentDisconnected', () => {
    store.commit('setMultiplayerState', {
      myPlayerType: null,
      opponentName: '',
      roomName: '',
      isWaitingForOpponent: false,
      isConnected: false,
      opponentDisconnected: true
    })
    expect(store.state.opponentDisconnected).toBe(true)
  })

  it('clearMultiplayerState resets opponentDisconnected to false', () => {
    store.commit('clearMultiplayerState')
    expect(store.state.opponentDisconnected).toBe(false)
  })
})

// ── helpers ───────────────────────────────────────────────────────────────────
function activateMultiplayer(myPlayerType: PlayerTypes) {
  store.commit('activateGame', {
    XPlayer: Players.playerOne,
    OPlayer: Players.playerTwo,
    oponentIsAI: false,
    isMultiplayer: true
  })
  store.commit('setMultiplayerState', {
    myPlayerType,
    opponentName: 'Opponent',
    roomName: 'test-room',
    isWaitingForOpponent: false,
    isConnected: true
  })
}

describe('sendPlayAgain', () => {
  it('sets playAgainSent to true', () => {
    activateMultiplayer(PlayerTypes.XPlayer)
    store.commit('sendPlayAgain')
    expect(store.state.playAgainSent).toBe(true)
  })

  it('is idempotent: second call is a no-op', () => {
    activateMultiplayer(PlayerTypes.XPlayer)
    store.commit('sendPlayAgain')
    store.commit('receivePlayAgain') // set received too
    // manually reset to re-test
    store.commit('quitGame')
    activateMultiplayer(PlayerTypes.XPlayer)
    store.commit('sendPlayAgain')
    // calling again should not change anything unexpected
    store.commit('sendPlayAgain')
    expect(store.state.playAgainSent).toBe(true)
  })

  it('sets both flags true when receivePlayAgain was already true', () => {
    activateMultiplayer(PlayerTypes.XPlayer)
    store.commit('receivePlayAgain')
    store.commit('sendPlayAgain')
    // Both flags should be true — component watcher handles the reset
    expect(store.state.playAgainSent).toBe(true)
    expect(store.state.playAgainReceived).toBe(true)
  })
})

describe('receivePlayAgain', () => {
  it('sets playAgainReceived to true', () => {
    activateMultiplayer(PlayerTypes.XPlayer)
    store.commit('receivePlayAgain')
    expect(store.state.playAgainReceived).toBe(true)
  })

  it('sets both flags true when sendPlayAgain was already true', () => {
    activateMultiplayer(PlayerTypes.XPlayer)
    store.commit('sendPlayAgain')
    store.commit('receivePlayAgain')
    // Both flags should be true — component watcher handles the reset
    expect(store.state.playAgainSent).toBe(true)
    expect(store.state.playAgainReceived).toBe(true)
  })
})

describe('resetRound', () => {
  it('records winner in gameResults', () => {
    activateMultiplayer(PlayerTypes.XPlayer)
    // X wins top row
    store.commit('addPlayToHistory', { position: 1, piece: 1 })
    store.commit('addPlayToHistory', { position: 2, piece: 1 })
    store.commit('addPlayToHistory', { position: 3, piece: 1 })
    store.commit('resetRound')
    expect(store.state.gameResults).toHaveLength(1)
  })

  it('sets currentPlayerType back to XPlayer', () => {
    activateMultiplayer(PlayerTypes.XPlayer)
    store.commit('addPlayToHistory', { position: 5, piece: 0 })
    store.commit('resetRound')
    expect(store.state.currentPlayerType).toBe(PlayerTypes.XPlayer)
  })

  it('sets isWaitingToPlay to false when I am X', () => {
    activateMultiplayer(PlayerTypes.XPlayer)
    store.commit('resetRound')
    expect(store.state.isWaitingToPlay).toBe(false)
  })

  it('sets isWaitingToPlay to true when I am O', () => {
    activateMultiplayer(PlayerTypes.OPlayer)
    store.commit('resetRound')
    expect(store.state.isWaitingToPlay).toBe(true)
  })

  it('clears both play-again flags', () => {
    activateMultiplayer(PlayerTypes.XPlayer)
    store.commit('sendPlayAgain')
    store.commit('receivePlayAgain')
    store.commit('resetRound')
    expect(store.state.playAgainSent).toBe(false)
    expect(store.state.playAgainReceived).toBe(false)
  })
})

export {}
