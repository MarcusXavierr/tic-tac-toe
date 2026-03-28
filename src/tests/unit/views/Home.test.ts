import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import HomePage from '@/views/Home/index.vue'

// Minimal Vuex store — activateGame mutation captured for assertions
function makeStore() {
  const activateGame = vi.fn()
  const store = createStore({
    state: () => ({}),
    mutations: { activateGame }
  })
  return { store, activateGame }
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
    template: '<div data-testid="multiplayer-modal" :data-show="show" @cancel="$emit(\'cancel\')" @create="$emit(\'create\')" @join="$emit(\'join\')"><slot /></div>',
    props: ['show'],
    emits: ['create', 'join', 'cancel']
  }
}

function mountHome() {
  const { store, activateGame } = makeStore()
  const wrapper = mount(HomePage, {
    global: {
      plugins: [store],
      stubs
    }
  })
  return { wrapper, activateGame }
}

describe('Home — MultiplayerModal visibility', () => {
  it('does not show MultiplayerModal on initial render', () => {
    const { wrapper } = mountHome()
    expect(wrapper.find('[data-testid="multiplayer-modal"]').attributes('data-show')).toBe('false')
  })

  it('opens MultiplayerModal when "VS PLAYER" button is clicked', async () => {
    const { wrapper } = mountHome()
    // The VS PLAYER button is the second BaseButton (index 1)
    const buttons = wrapper.findAll('button')
    await buttons[1].trigger('click')
    expect(wrapper.find('[data-testid="multiplayer-modal"]').attributes('data-show')).toBe('true')
  })
})

describe('Home — MultiplayerModal event handling', () => {
  async function openModal(wrapper: ReturnType<typeof mount>) {
    const buttons = wrapper.findAll('button')
    await buttons[1].trigger('click')
  }

  it('closes the modal and does NOT call activateGame when @cancel is emitted', async () => {
    const { wrapper, activateGame } = mountHome()
    await openModal(wrapper)

    await wrapper.find('[data-testid="multiplayer-modal"]').trigger('cancel')
    expect(wrapper.find('[data-testid="multiplayer-modal"]').attributes('data-show')).toBe('false')
    expect(activateGame).not.toHaveBeenCalled()
  })
})
