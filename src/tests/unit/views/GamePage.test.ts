import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { PlayerTypes } from '@/enums/Players'
import { IconType } from '@/enums/IconTypes'

const mockService = {
  sendMove: vi.fn(),
  createRoom: vi.fn(),
  joinRoom: vi.fn(),
  disconnect: vi.fn()
}
vi.mock('@/services/multiplayerServiceInstance', () => ({
  multiplayerService: mockService
}))

const { default: GamePage } = await import('@/views/Game/index.vue')

function makeStore(overrides: Record<string, any> = {}) {
  return createStore({
    state() {
      return {
        playHistory: [],
        currentPlayerType: PlayerTypes.XPlayer,
        oponentIsAI: false,
        isWaitingToPlay: false,
        isMultiplayer: false,
        myPlayerType: PlayerTypes.XPlayer,
        opponentName: '',
        roomName: '',
        isConnected: false,
        isWaitingForOpponent: false,
        opponentDisconnected: false,
        isGameActive: true,
        XPlayer: 1,
        OPlayer: 2,
        gameResults: [],
        ...overrides
      }
    },
    mutations: {
      addPlayToHistory(state: any, data: any) {
        state.playHistory = state.playHistory.concat(data)
        state.isWaitingToPlay = false
      },
      makePlayersWait(state: any) { state.isWaitingToPlay = true },
      finishWaiting(state: any) { state.isWaitingToPlay = false },
      addWinnerPathToHistory(state: any, h: any) { state.playHistory = h },
      quitGame(state: any) { state.isGameActive = false },
      nextRound: vi.fn(),
      setMultiplayerState(state: any, p: any) { Object.assign(state, p) },
      clearMultiplayerState(state: any) {
        state.isMultiplayer = false
        state.opponentDisconnected = false
      }
    },
    getters: {
      getPlayer: (state: any) => (type: PlayerTypes) =>
        type === PlayerTypes.OPlayer ? state.OPlayer : state.XPlayer
    }
  })
}

const stubs = {
  NavBar: { template: '<div />' },
  GameBoard: { template: '<div />', ref: 'board' },
  GameOverModal: {
    template: '<div />',
    props: ['show', 'winner', 'playerWinner'],
    emits: ['quit', 'next']
  },
  OpponentDisconnectedModal: {
    template: '<div data-testid="disconnected-modal" :class="{ visible: show }" />',
    props: ['show'],
    emits: ['close']
  }
}

beforeEach(() => vi.clearAllMocks())
afterEach(() => vi.clearAllMocks())

describe('GamePage — opponent move handling', () => {
  it('exposes a handleOpponentMove method that adds the opponent piece to history', () => {
    const store = makeStore({ isMultiplayer: true, myPlayerType: PlayerTypes.XPlayer, isWaitingToPlay: true })
    const wrapper = mount(GamePage, { global: { plugins: [store], stubs } })
    // O is the opponent when I am X
    wrapper.vm.handleOpponentMove(5)
    expect(store.state.playHistory).toHaveLength(1)
    expect(store.state.playHistory[0].position).toBe(5)
    expect(store.state.playHistory[0].piece).toBe(IconType.O)
  })

  it('sets isWaitingToPlay to false after opponent move', () => {
    const store = makeStore({ isMultiplayer: true, myPlayerType: PlayerTypes.XPlayer, isWaitingToPlay: true })
    const wrapper = mount(GamePage, { global: { plugins: [store], stubs } })
    wrapper.vm.handleOpponentMove(3)
    expect(store.state.isWaitingToPlay).toBe(false)
  })

  it('uses X piece for opponent when myPlayerType is OPlayer', () => {
    const store = makeStore({ isMultiplayer: true, myPlayerType: PlayerTypes.OPlayer, isWaitingToPlay: true })
    const wrapper = mount(GamePage, { global: { plugins: [store], stubs } })
    wrapper.vm.handleOpponentMove(1)
    expect(store.state.playHistory[0].piece).toBe(IconType.X)
  })
})

describe('GamePage — opponent disconnected', () => {
  it('shows OpponentDisconnectedModal when opponentDisconnected is true', async () => {
    const store = makeStore({ isMultiplayer: true, opponentDisconnected: true })
    const wrapper = mount(GamePage, { global: { plugins: [store], stubs } })
    await wrapper.vm.$nextTick()
    const modal = wrapper.find('[data-testid="disconnected-modal"]')
    expect(modal.classes()).toContain('visible')
  })

  it('does not show OpponentDisconnectedModal when opponentDisconnected is false', async () => {
    const store = makeStore({ isMultiplayer: true, opponentDisconnected: false })
    const wrapper = mount(GamePage, { global: { plugins: [store], stubs } })
    await wrapper.vm.$nextTick()
    const modal = wrapper.find('[data-testid="disconnected-modal"]')
    expect(modal.classes()).not.toContain('visible')
  })
})

describe('GamePage — handleDisconnectClose', () => {
  it('calls service.disconnect', () => {
    const store = makeStore({ isMultiplayer: true })
    const wrapper = mount(GamePage, { global: { plugins: [store], stubs } })
    wrapper.vm.handleDisconnectClose()
    expect(mockService.disconnect).toHaveBeenCalled()
  })

  it('commits quitGame and clearMultiplayerState', () => {
    const store = makeStore({ isMultiplayer: true })
    const commitSpy = vi.spyOn(store, 'commit')
    const wrapper = mount(GamePage, { global: { plugins: [store], stubs } })
    wrapper.vm.handleDisconnectClose()
    expect(commitSpy).toHaveBeenCalledWith('quitGame')
    expect(commitSpy).toHaveBeenCalledWith('clearMultiplayerState')
  })
})

export {}
