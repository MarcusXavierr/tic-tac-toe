import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { Players, PlayerTypes } from '@/enums/Players'

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
      clearMultiplayerState: vi.fn()
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
    props: ['show'],
    emits: ['create', 'join', 'cancel']
  }
}

function mountHome(store: ReturnType<typeof makeStore>) {
  return mount(HomePage, {
    global: { plugins: [store], stubs }
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
    const vsPlayerBtn = buttons.find(b => b.text().includes('VS PLAYER'))
    expect(vsPlayerBtn).toBeDefined()
    await vsPlayerBtn!.trigger('click')
    const modal = wrapper.find('[data-testid="multiplayer-modal"]')
    // Modal show prop should now be true — check via component
    expect(wrapper.vm.showMultiplayerModal).toBe(true)
  })
})

describe('Home — @create event', () => {
  it('calls service.createRoom then service.joinRoom', async () => {
    const store = makeStore()
    const wrapper = mountHome(store)
    // Trigger the create event on the modal stub
    await wrapper.vm.handleCreate('room-1', 'Alice', PlayerTypes.XPlayer)
    expect(mockService.createRoom).toHaveBeenCalledWith('room-1')
    expect(mockService.joinRoom).toHaveBeenCalledWith(
      'room-1',
      'Alice',
      expect.any(Function),
      expect.any(Function)
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

export {}
