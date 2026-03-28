import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { PlayerTypes } from '@/enums/Players'

const mockService = {
  sendMove: vi.fn(),
  createRoom: vi.fn(),
  joinRoom: vi.fn(),
  disconnect: vi.fn()
}
vi.mock('@/services/multiplayerServiceInstance', () => ({
  multiplayerService: mockService
}))

const { default: NavBar } = await import('@/views/Game/NavBar.vue')

function makeStore(overrides: Record<string, any> = {}) {
  return createStore({
    state() {
      return {
        currentPlayerType: PlayerTypes.XPlayer,
        isMultiplayer: false,
        playHistory: [],
        ...overrides
      }
    },
    mutations: {
      quitGame: vi.fn(),
      restartGame: vi.fn(),
      clearMultiplayerState: vi.fn()
    }
  })
}

const stubs = {
  BaseButton: {
    template: '<button @click="$emit(\'click\')"><slot /></button>',
    emits: ['click']
  },
  BaseIcon: { template: '<span />' },
  RetryGameModal: {
    template: '<div />',
    props: ['show'],
    emits: ['close', 'restart']
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})
afterEach(() => {
  vi.clearAllMocks()
})

describe('NavBar — logo click quits game', () => {
  it('calls quitGame on logo click', async () => {
    const store = makeStore()
    const commitSpy = vi.spyOn(store, 'commit')
    const wrapper = mount(NavBar, { global: { plugins: [store], stubs } })
    await wrapper.find('img').trigger('click')
    expect(commitSpy).toHaveBeenCalledWith('quitGame')
  })

  it('calls service.disconnect on logo click when isMultiplayer', async () => {
    const store = makeStore({ isMultiplayer: true })
    const wrapper = mount(NavBar, { global: { plugins: [store], stubs } })
    await wrapper.find('img').trigger('click')
    expect(mockService.disconnect).toHaveBeenCalled()
  })

  it('does NOT call service.disconnect on logo click when not multiplayer', async () => {
    const store = makeStore({ isMultiplayer: false })
    const wrapper = mount(NavBar, { global: { plugins: [store], stubs } })
    await wrapper.find('img').trigger('click')
    expect(mockService.disconnect).not.toHaveBeenCalled()
  })
})

export {}
