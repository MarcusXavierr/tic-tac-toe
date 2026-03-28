import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { PlayerTypes } from '@/enums/Players'
import { IconType } from '@/enums/IconTypes'

// ── Mock singleton service ────────────────────────────────────────────────────
const mockService = {
  sendMove: vi.fn(),
  createRoom: vi.fn(),
  joinRoom: vi.fn(),
  disconnect: vi.fn()
}
vi.mock('@/services/multiplayerServiceInstance', () => ({
  multiplayerService: mockService
}))

const { default: GameBoard } = await import('@/views/Game/GameBoard.vue')

// ── Store factory ─────────────────────────────────────────────────────────────
function makeStore(overrides = {}) {
  return createStore({
    state() {
      return {
        playHistory: [],
        currentPlayerType: PlayerTypes.XPlayer,
        oponentIsAI: false,
        isWaitingToPlay: false,
        isMultiplayer: false,
        ...overrides
      }
    },
    mutations: {
      addPlayToHistory(state: any, data: any) {
        state.playHistory = state.playHistory.concat(data)
      },
      addAsyncPlayToHistory(state: any, data: any) {
        state.playHistory = state.playHistory.concat(data)
        state.isWaitingToPlay = true
      },
      makePlayersWait(state: any) {
        state.isWaitingToPlay = true
      }
    }
  })
}

const stubs = {
  BaseCell: {
    template: '<div @click="$emit(\'click\')" />',
    emits: ['click']
  },
  GameHistory: { template: '<div />' }
}

beforeEach(() => { vi.clearAllMocks() })
afterEach(() => { vi.clearAllMocks() })

describe('GameBoard — normal (non-multiplayer) move', () => {
  it('does NOT call service.sendMove when isMultiplayer is false', () => {
    const store = makeStore({ isMultiplayer: false })
    const wrapper = mount(GameBoard, { global: { plugins: [store], stubs } })
    wrapper.vm.checkCell(0)
    expect(mockService.sendMove).not.toHaveBeenCalled()
  })
})

describe('GameBoard — multiplayer move', () => {
  it('calls service.sendMove with the cell id after adding to history', () => {
    const store = makeStore({ isMultiplayer: true, isWaitingToPlay: false })
    const wrapper = mount(GameBoard, { global: { plugins: [store], stubs } })
    wrapper.vm.checkCell(4)
    expect(mockService.sendMove).toHaveBeenCalledWith(4)
  })

  it('sets isWaitingToPlay to true after sending a multiplayer move', () => {
    const store = makeStore({ isMultiplayer: true, isWaitingToPlay: false })
    const wrapper = mount(GameBoard, { global: { plugins: [store], stubs } })
    wrapper.vm.checkCell(2)
    expect(store.state.isWaitingToPlay).toBe(true)
  })

  it('does not send move when isWaitingToPlay is true', () => {
    const store = makeStore({ isMultiplayer: true, isWaitingToPlay: true })
    const wrapper = mount(GameBoard, { global: { plugins: [store], stubs } })
    wrapper.vm.checkCell(0)
    expect(mockService.sendMove).not.toHaveBeenCalled()
  })

  it('does not send move to an already-occupied cell', () => {
    const store = makeStore({
      isMultiplayer: true,
      isWaitingToPlay: false,
      playHistory: [{ position: 3, piece: IconType.X }]
    })
    const wrapper = mount(GameBoard, { global: { plugins: [store], stubs } })
    wrapper.vm.checkCell(3)
    expect(mockService.sendMove).not.toHaveBeenCalled()
  })
})

export {}
