import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { PlayerTypes } from '@/enums/Players'
import { IconType } from '@/enums/IconTypes'

// ── Mock singleton service ────────────────────────────────────────────────────
const mockService = {
  sendMove: vi.fn(),
  sendHover: vi.fn(),
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
        remoteHoverCell: null,
        remoteHoverFading: false,
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
    name: 'BaseCell',
    template: '<div @click="$emit(\'click\')" @mouseenter="$emit(\'mouseenter\')" @mouseleave="$emit(\'mouseleave\')" />',
    props: ['selectedIcon', 'belongsToWinnerPath', 'isRemoteHovered', 'isRemoteHoverFading'],
    emits: ['click', 'mouseenter', 'mouseleave']
  },
  GameHistory: { template: '<div />' }
}

beforeEach(() => {
  vi.clearAllMocks()
})
afterEach(() => {
  vi.clearAllMocks()
})

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

describe('GameBoard — sendHover on mouseenter', () => {
  it('calls sendHover with cell id on mouseenter of empty cell in multiplayer', () => {
    const store = makeStore({ isMultiplayer: true })
    const wrapper = mount(GameBoard, { global: { plugins: [store], stubs } })
    wrapper.vm.handleCellHover({ id: 3, piece: null })
    expect(mockService.sendHover).toHaveBeenCalledWith(3)
  })

  it('does not call sendHover on mouseenter of occupied cell', () => {
    const store = makeStore({ isMultiplayer: true })
    const wrapper = mount(GameBoard, { global: { plugins: [store], stubs } })
    wrapper.vm.handleCellHover({ id: 3, piece: IconType.X })
    expect(mockService.sendHover).not.toHaveBeenCalled()
  })

  it('does not call sendHover when not in multiplayer', () => {
    const store = makeStore({ isMultiplayer: false })
    const wrapper = mount(GameBoard, { global: { plugins: [store], stubs } })
    wrapper.vm.handleCellHover({ id: 3, piece: null })
    expect(mockService.sendHover).not.toHaveBeenCalled()
  })
})

describe('GameBoard — sendHover turn guard', () => {
  it('does not call sendHover when it is not our turn (isWaitingToPlay is true)', () => {
    const store = makeStore({ isMultiplayer: true, isWaitingToPlay: true })
    const wrapper = mount(GameBoard, { global: { plugins: [store], stubs } })
    wrapper.vm.handleCellHover({ id: 3, piece: null })
    expect(mockService.sendHover).not.toHaveBeenCalled()
  })
})

describe('GameBoard — sendHover re-send timer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('re-sends hover after VITE_REMOTE_HOVER_DURATION ms while still hovering', () => {
    const store = makeStore({ isMultiplayer: true })
    const wrapper = mount(GameBoard, { global: { plugins: [store], stubs } })
    wrapper.vm.handleCellHover({ id: 3, piece: null })
    expect(mockService.sendHover).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(800)
    expect(mockService.sendHover).toHaveBeenCalledTimes(2)
    vi.advanceTimersByTime(800)
    expect(mockService.sendHover).toHaveBeenCalledTimes(3)
  })

  it('stops re-sending after handleCellLeave clears the timer', () => {
    const store = makeStore({ isMultiplayer: true })
    const wrapper = mount(GameBoard, { global: { plugins: [store], stubs } })
    wrapper.vm.handleCellHover({ id: 3, piece: null })
    expect(mockService.sendHover).toHaveBeenCalledTimes(1)
    wrapper.vm.handleCellLeave()
    vi.advanceTimersByTime(800)
    expect(mockService.sendHover).toHaveBeenCalledTimes(1)
  })

  it('clears the old timer and starts a new one when moving to a different cell', () => {
    const store = makeStore({ isMultiplayer: true })
    const wrapper = mount(GameBoard, { global: { plugins: [store], stubs } })
    wrapper.vm.handleCellHover({ id: 3, piece: null })
    wrapper.vm.handleCellLeave()
    wrapper.vm.handleCellHover({ id: 5, piece: null })
    vi.advanceTimersByTime(800)
    expect(mockService.sendHover).toHaveBeenCalledTimes(3)
    expect(mockService.sendHover).toHaveBeenNthCalledWith(1, 3)
    expect(mockService.sendHover).toHaveBeenNthCalledWith(2, 5)
    expect(mockService.sendHover).toHaveBeenNthCalledWith(3, 5)
  })

  it('does not start a timer when the hover is suppressed (not our turn)', () => {
    const store = makeStore({ isMultiplayer: true, isWaitingToPlay: true })
    const wrapper = mount(GameBoard, { global: { plugins: [store], stubs } })
    wrapper.vm.handleCellHover({ id: 3, piece: null })
    vi.advanceTimersByTime(800)
    expect(mockService.sendHover).not.toHaveBeenCalled()
  })
})

describe('GameBoard — isRemoteHovered prop passing', () => {
  it('passes isRemoteHovered=true to the cell matching remoteHoverCell', async () => {
    const store = makeStore({ remoteHoverCell: 2 })
    const wrapper = mount(GameBoard, { global: { plugins: [store], stubs } })
    await wrapper.vm.$nextTick()
    const cells = wrapper.findAllComponents({ name: 'BaseCell' })
    const hoveredCell = cells.find((c) => c.props('isRemoteHovered') === true)
    expect(hoveredCell).toBeDefined()
  })

  it('passes isRemoteHovered=false to cells not matching remoteHoverCell', async () => {
    const store = makeStore({ remoteHoverCell: 2 })
    const wrapper = mount(GameBoard, { global: { plugins: [store], stubs } })
    await wrapper.vm.$nextTick()
    const cells = wrapper.findAllComponents({ name: 'BaseCell' })
    const nonHovered = cells.filter((c) => c.props('isRemoteHovered') === false)
    expect(nonHovered).toHaveLength(8) // 9 cells, 1 is hovered
  })

})

export {}
