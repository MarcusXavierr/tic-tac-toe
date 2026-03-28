import { Players, PlayerTypes } from '@/enums/Players'
import { store } from '@/store/index'
import { describe, it, expect, beforeEach } from 'vitest'

// Reset store before each test by quitting any active game
beforeEach(() => {
  store.commit('quitGame')
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

export {}
