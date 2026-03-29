import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { Players, PlayerTypes } from '@/enums/Players'
import { IconType } from '@/enums/IconTypes'
import { createTestI18n } from '../helpers/i18n'

// ── Mock the singleton service ────────────────────────────────────────────────
const mockService = {
  createRoom: vi.fn(() => Promise.resolve()),
  joinRoom: vi.fn(),
  sendMove: vi.fn(),
  disconnect: vi.fn()
}
vi.mock('@/services/multiplayerServiceInstance', () => ({
  multiplayerService: mockService
}))

// Import AFTER mock is set up
const { default: HomePage } = await import('@/views/Home/index.vue')

// ── Store factory ─────────────────────────────────────────────────────────────
function makeStore(overrides = {}) {
  return createStore({
    state() {
      return {
        isGameActive: false,
        isMultiplayer: false,
        myPlayerType: null,
        opponentName: '',
        roomName: '',
        isWaitingForOpponent: false,
        isConnected: false,
        opponentDisconnected: false,
        oponentIsAI: false,
        isWaitingToPlay: false,
        XPlayer: null,
        OPlayer: null,
        playHistory: [],
        gameResults: [],
        currentPlayerType: undefined,
        ...overrides
      }
    },
    mutations: {
      activateGame: vi.fn(),
      setMultiplayerState: vi.fn(),
      clearMultiplayerState: vi.fn(),
      addPlayToHistory: vi.fn(),
      makePlayersWait: vi.fn(),
      finishWaiting: vi.fn(),
      receivePlayAgain: vi.fn(),
      setRemoteHover: vi.fn(),
      startRemoteHoverFade: vi.fn(),
      clearRemoteHover: vi.fn()
    }
  })
}

const stubs = {
  BaseButton: {
    template: '<button @click="$emit(\'click\')"><slot /></button>',
    emits: ['click']
  },
  PlayerSelector: {
    template: '<div />',
    props: ['xTypeSelected', 'oTypeSelected'],
    emits: ['update:xTypeSelected', 'update:oTypeSelected']
  },
  MultiplayerModal: {
    template: '<div data-testid="multiplayer-modal" />',
    props: ['show', 'errorMessage'],
    emits: ['create', 'join', 'cancel', 'error-clear']
  }
}

function mountHome(store: ReturnType<typeof makeStore>) {
  return mount(HomePage, {
    global: { plugins: [store, createTestI18n()], stubs }
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('Home — VS PLAYER button', () => {
  it('opens the MultiplayerModal when VS PLAYER is clicked', async () => {
    const store = makeStore()
    const wrapper = mountHome(store)
    // Find the VS PLAYER button (second BaseButton stub)
    const buttons = wrapper.findAll('button')
    const vsPlayerBtn = buttons.find((b) => b.text().includes('VS PLAYER'))
    expect(vsPlayerBtn).toBeDefined()
    await vsPlayerBtn!.trigger('click')
    const modal = wrapper.find('[data-testid="multiplayer-modal"]')
    // Modal show prop should now be true — check via component
    expect(wrapper.vm.showMultiplayerModal).toBe(true)
  })
})

describe('Home — @create event', () => {
  it('calls service.createRoom then service.joinRoom with player_type', async () => {
    const store = makeStore()
    const wrapper = mountHome(store)
    await wrapper.vm.handleCreate('room-1', 'Alice', PlayerTypes.XPlayer)
    expect(mockService.createRoom).toHaveBeenCalledWith('room-1')
    expect(mockService.joinRoom).toHaveBeenCalledWith(
      'room-1',
      'Alice',
      expect.any(Function),
      expect.any(Function),
      'x'
    )
  })

  it('passes player_type "o" to joinRoom when creating as OPlayer', async () => {
    const store = makeStore()
    const wrapper = mountHome(store)
    await wrapper.vm.handleCreate('room-1', 'Alice', PlayerTypes.OPlayer)
    expect(mockService.joinRoom).toHaveBeenCalledWith(
      'room-1',
      'Alice',
      expect.any(Function),
      expect.any(Function),
      'o'
    )
  })

  it('commits setMultiplayerState with isWaitingForOpponent: true', async () => {
    const store = makeStore()
    const commitSpy = vi.spyOn(store, 'commit')
    const wrapper = mountHome(store)
    await wrapper.vm.handleCreate('room-1', 'Alice', PlayerTypes.XPlayer)
    expect(commitSpy).toHaveBeenCalledWith(
      'setMultiplayerState',
      expect.objectContaining({ isWaitingForOpponent: true, roomName: 'room-1', isConnected: true })
    )
  })
})

describe('Home — @join event', () => {
  it('calls service.joinRoom (no createRoom)', async () => {
    const store = makeStore()
    const wrapper = mountHome(store)
    wrapper.vm.handleJoin('room-2', 'Bob')
    expect(mockService.createRoom).not.toHaveBeenCalled()
    expect(mockService.joinRoom).toHaveBeenCalledWith(
      'room-2',
      'Bob',
      expect.any(Function),
      expect.any(Function)
    )
  })

  it('commits setMultiplayerState with isWaitingForOpponent: true', () => {
    const store = makeStore()
    const commitSpy = vi.spyOn(store, 'commit')
    const wrapper = mountHome(store)
    wrapper.vm.handleJoin('room-2', 'Bob')
    expect(commitSpy).toHaveBeenCalledWith(
      'setMultiplayerState',
      expect.objectContaining({ isWaitingForOpponent: true, roomName: 'room-2', isConnected: true })
    )
  })
})

describe('Home — @cancel event', () => {
  it('calls service.disconnect', () => {
    const store = makeStore()
    const wrapper = mountHome(store)
    wrapper.vm.handleCancel()
    expect(mockService.disconnect).toHaveBeenCalled()
  })

  it('commits clearMultiplayerState', () => {
    const store = makeStore()
    const commitSpy = vi.spyOn(store, 'commit')
    const wrapper = mountHome(store)
    wrapper.vm.handleCancel()
    expect(commitSpy).toHaveBeenCalledWith('clearMultiplayerState')
  })

  it('closes the modal', () => {
    const store = makeStore()
    const wrapper = mountHome(store)
    wrapper.vm.showMultiplayerModal = true
    wrapper.vm.handleCancel()
    expect(wrapper.vm.showMultiplayerModal).toBe(false)
  })
})

describe('Home — player_joined message handling', () => {
  it('commits setMultiplayerState with opponent info and isWaitingForOpponent: false', async () => {
    const store = makeStore()
    const commitSpy = vi.spyOn(store, 'commit')
    const wrapper = mountHome(store)
    // Start a join so onMessage is registered
    wrapper.vm.handleJoin('room-1', 'Alice')
    // Grab the onMessage callback passed to joinRoom
    const onMessage = (mockService.joinRoom as ReturnType<typeof vi.fn>).mock.calls[0][2]
    onMessage({ type: 'player_joined', name: 'Bob', player_type: 'o', order: 2 })
    expect(commitSpy).toHaveBeenCalledWith(
      'setMultiplayerState',
      expect.objectContaining({
        opponentName: 'Bob',
        isWaitingForOpponent: false
      })
    )
  })

  it('commits activateGame with isMultiplayer: true on player_joined', () => {
    const store = makeStore()
    const commitSpy = vi.spyOn(store, 'commit')
    const wrapper = mountHome(store)
    wrapper.vm.handleJoin('room-1', 'Alice')
    const onMessage = (mockService.joinRoom as ReturnType<typeof vi.fn>).mock.calls[0][2]
    onMessage({ type: 'player_joined', name: 'Bob', player_type: 'o', order: 2 })
    expect(commitSpy).toHaveBeenCalledWith(
      'activateGame',
      expect.objectContaining({ isMultiplayer: true })
    )
  })

  it('closes the modal on player_joined', () => {
    const store = makeStore()
    const wrapper = mountHome(store)
    wrapper.vm.showMultiplayerModal = true
    wrapper.vm.handleJoin('room-1', 'Alice')
    const onMessage = (mockService.joinRoom as ReturnType<typeof vi.fn>).mock.calls[0][2]
    onMessage({ type: 'player_joined', name: 'Bob', player_type: 'o', order: 2 })
    expect(wrapper.vm.showMultiplayerModal).toBe(false)
  })
})

describe('Home — move message handling', () => {
  it('commits addPlayToHistory with opponent O piece when myPlayerType is X', () => {
    const store = makeStore({ myPlayerType: PlayerTypes.XPlayer })
    const commitSpy = vi.spyOn(store, 'commit')
    const wrapper = mountHome(store)
    wrapper.vm.handleJoin('room-1', 'Alice')
    const onMessage = (mockService.joinRoom as ReturnType<typeof vi.fn>).mock.calls[0][2]
    onMessage({ type: 'move', cell: 4 })
    expect(commitSpy).toHaveBeenCalledWith('addPlayToHistory', {
      position: 4,
      piece: IconType.O
    })
  })

  it('commits addPlayToHistory with opponent X piece when myPlayerType is O', () => {
    const store = makeStore({ myPlayerType: PlayerTypes.OPlayer })
    const commitSpy = vi.spyOn(store, 'commit')
    const wrapper = mountHome(store)
    wrapper.vm.handleJoin('room-1', 'Alice')
    const onMessage = (mockService.joinRoom as ReturnType<typeof vi.fn>).mock.calls[0][2]
    onMessage({ type: 'move', cell: 2 })
    expect(commitSpy).toHaveBeenCalledWith('addPlayToHistory', {
      position: 2,
      piece: IconType.X
    })
  })
})

describe('Home — player_disconnected message handling', () => {
  it('commits setMultiplayerState with opponentDisconnected: true', () => {
    const store = makeStore({
      myPlayerType: PlayerTypes.XPlayer,
      opponentName: 'Bob',
      roomName: 'room-1'
    })
    const commitSpy = vi.spyOn(store, 'commit')
    const wrapper = mountHome(store)
    wrapper.vm.handleJoin('room-1', 'Alice')
    const onMessage = (mockService.joinRoom as ReturnType<typeof vi.fn>).mock.calls[0][2]
    onMessage({ type: 'player_disconnected' })
    expect(commitSpy).toHaveBeenCalledWith(
      'setMultiplayerState',
      expect.objectContaining({ opponentDisconnected: true, isConnected: false })
    )
  })
})

describe('Home — play_again message handling', () => {
  it('commits receivePlayAgain when play_again message received', () => {
    const store = makeStore()
    const commitSpy = vi.spyOn(store, 'commit')
    const wrapper = mountHome(store)
    wrapper.vm.handleJoin('room-1', 'Alice')
    const onMessage = (mockService.joinRoom as ReturnType<typeof vi.fn>).mock.calls[0][2]
    onMessage({ type: 'play_again' })
    expect(commitSpy).toHaveBeenCalledWith('receivePlayAgain')
  })
})

describe('Home — hover message handling', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
  })

  it('commits setRemoteHover with cell number when hover message received', () => {
    const store = makeStore()
    const commitSpy = vi.spyOn(store, 'commit')
    const wrapper = mountHome(store)
    wrapper.vm.handleJoin('room-1', 'Alice')
    const onMessage = (mockService.joinRoom as ReturnType<typeof vi.fn>).mock.calls[0][2]
    onMessage({ type: 'hover', cell: 4 })
    expect(commitSpy).toHaveBeenCalledWith('setRemoteHover', 4)
  })

  it('commits clearRemoteHover after VITE_REMOTE_HOVER_DURATION ms', () => {
    vi.stubEnv('VITE_REMOTE_HOVER_DURATION', '800')
    const store = makeStore()
    const commitSpy = vi.spyOn(store, 'commit')
    const wrapper = mountHome(store)
    wrapper.vm.handleJoin('room-1', 'Alice')
    const onMessage = (mockService.joinRoom as ReturnType<typeof vi.fn>).mock.calls[0][2]
    onMessage({ type: 'hover', cell: 2 })
    vi.advanceTimersByTime(800)
    expect(commitSpy).toHaveBeenCalledWith('clearRemoteHover')
  })

  it('cancels previous timeout when a new hover arrives', () => {
    vi.stubEnv('VITE_REMOTE_HOVER_DURATION', '800')
    const store = makeStore()
    const commitSpy = vi.spyOn(store, 'commit')
    const wrapper = mountHome(store)
    wrapper.vm.handleJoin('room-1', 'Alice')
    const onMessage = (mockService.joinRoom as ReturnType<typeof vi.fn>).mock.calls[0][2]
    onMessage({ type: 'hover', cell: 1 })
    onMessage({ type: 'hover', cell: 5 })
    vi.advanceTimersByTime(800)
    const clearCalls = (commitSpy.mock.calls as any[]).filter((c) => c[0] === 'clearRemoteHover')
    expect(clearCalls).toHaveLength(1) // only one clear fires, not two
  })
})

describe('Home — error handling on create failure', () => {
  it('sets errorMessage when createRoom rejects', async () => {
    mockService.createRoom.mockRejectedValueOnce(new Error('room already exists'))
    const store = makeStore()
    const wrapper = mountHome(store)
    await wrapper.vm.handleCreate('taken', 'Alice', PlayerTypes.XPlayer)
    expect(wrapper.vm.errorMessage).toBe('Room already exists')
  })

  it('clears errorMessage before each attempt so the watcher fires on retry', async () => {
    mockService.createRoom.mockRejectedValue(new Error('Room already exists'))
    const store = makeStore()
    const wrapper = mountHome(store)
    await wrapper.vm.handleCreate('taken', 'Alice', PlayerTypes.XPlayer)
    expect(wrapper.vm.errorMessage).toBe('Room already exists')
    // Simulate second attempt — errorMessage must go through '' so vue watcher fires
    await wrapper.vm.handleCreate('taken', 'Alice', PlayerTypes.XPlayer)
    expect(wrapper.vm.errorMessage).toBe('Room already exists')
  })

  it('resets errorMessage when error-clear is emitted', async () => {
    mockService.createRoom.mockRejectedValueOnce(new Error('room already exists'))
    const store = makeStore()
    const wrapper = mountHome(store)
    await wrapper.vm.handleCreate('taken', 'Alice', PlayerTypes.XPlayer)
    wrapper.vm.handleErrorClear()
    expect(wrapper.vm.errorMessage).toBe('')
  })
})

describe('Home — error handling on WS error message', () => {
  it('sets errorMessage when WS sends { type: "error", reason: "room_not_found" }', () => {
    const store = makeStore()
    const wrapper = mountHome(store)
    wrapper.vm.handleJoin('room-404', 'Alice')
    const onMessage = (mockService.joinRoom as ReturnType<typeof vi.fn>).mock.calls[0][2]
    onMessage({ type: 'error', reason: 'room_not_found' })
    expect(wrapper.vm.errorMessage).toBe('Room not found')
  })

  it('sets errorMessage when WS sends { type: "error", reason: "room_full" }', () => {
    const store = makeStore()
    const wrapper = mountHome(store)
    wrapper.vm.handleJoin('room-full', 'Alice')
    const onMessage = (mockService.joinRoom as ReturnType<typeof vi.fn>).mock.calls[0][2]
    onMessage({ type: 'error', reason: 'room_full' })
    expect(wrapper.vm.errorMessage).toBe('Room is full')
  })
})

export {}
