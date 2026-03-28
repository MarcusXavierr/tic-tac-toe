import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import MultiplayerModal from '@/components/MultiplayerModal.vue'

// Stub child components to isolate unit under test
const stubs = {
  BaseModal: {
    template: '<div v-if="show"><slot /></div>',
    props: ['show']
  },
  BaseButton: {
    template: '<button @click="$emit(\'click\')"><slot /></button>',
    emits: ['click']
  },
  PlayerSelector: {
    template: '<div data-testid="player-selector" />',
    props: ['xTypeSelected', 'oTypeSelected'],
    emits: ['update:xTypeSelected', 'update:oTypeSelected']
  }
}

function mountModal(props = {}) {
  return mount(MultiplayerModal, {
    props: { show: true, ...props },
    global: { stubs }
  })
}

describe('MultiplayerModal — tab switching', () => {
  it('shows the Create view by default', () => {
    const wrapper = mountModal()
    expect(wrapper.find('[data-testid="create-view"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="join-view"]').exists()).toBe(false)
  })

  it('switches to Join view when Join tab is clicked', async () => {
    const wrapper = mountModal()
    await wrapper.find('[data-testid="tab-join"]').trigger('click')
    expect(wrapper.find('[data-testid="join-view"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="create-view"]').exists()).toBe(false)
  })

  it('switches back to Create view when Create tab is clicked', async () => {
    const wrapper = mountModal()
    await wrapper.find('[data-testid="tab-join"]').trigger('click')
    await wrapper.find('[data-testid="tab-create"]').trigger('click')
    expect(wrapper.find('[data-testid="create-view"]').exists()).toBe(true)
  })
})

describe('MultiplayerModal — Create view', () => {
  it('renders PlayerSelector inside the Create view', () => {
    const wrapper = mountModal()
    expect(wrapper.find('[data-testid="player-selector"]').exists()).toBe(true)
  })

  it('emits @create with roomName, playerName, and playerType when Create is clicked', async () => {
    const wrapper = mountModal()

    await wrapper.find('[data-testid="input-player-name-create"]').setValue('Alice')
    await wrapper.find('[data-testid="input-room-name-create"]').setValue('room42')
    await wrapper.find('[data-testid="btn-create"]').trigger('click')

    expect(wrapper.emitted('create')).toBeTruthy()
    const [roomName, playerName, playerType] = wrapper.emitted('create')![0]
    expect(roomName).toBe('room42')
    expect(playerName).toBe('Alice')
    // default xTypeSelected = true → PlayerTypes.XPlayer (1)
    expect(playerType).toBe(1)
  })

  it('shows waiting state after Create is clicked', async () => {
    const wrapper = mountModal()
    await wrapper.find('[data-testid="input-player-name-create"]').setValue('Alice')
    await wrapper.find('[data-testid="input-room-name-create"]').setValue('room42')
    await wrapper.find('[data-testid="btn-create"]').trigger('click')

    expect(wrapper.find('[data-testid="waiting-state"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="create-view"]').exists()).toBe(false)
  })
})

describe('MultiplayerModal — Join view', () => {
  it('emits @join with roomName and playerName when Join is clicked', async () => {
    const wrapper = mountModal()
    await wrapper.find('[data-testid="tab-join"]').trigger('click')

    await wrapper.find('[data-testid="input-player-name-join"]').setValue('Bob')
    await wrapper.find('[data-testid="input-room-name-join"]').setValue('room42')
    await wrapper.find('[data-testid="btn-join"]').trigger('click')

    expect(wrapper.emitted('join')).toBeTruthy()
    const [roomName, playerName] = wrapper.emitted('join')![0]
    expect(roomName).toBe('room42')
    expect(playerName).toBe('Bob')
  })

  it('shows waiting state after Join is clicked', async () => {
    const wrapper = mountModal()
    await wrapper.find('[data-testid="tab-join"]').trigger('click')
    await wrapper.find('[data-testid="input-player-name-join"]').setValue('Bob')
    await wrapper.find('[data-testid="input-room-name-join"]').setValue('room42')
    await wrapper.find('[data-testid="btn-join"]').trigger('click')

    expect(wrapper.find('[data-testid="waiting-state"]').exists()).toBe(true)
  })
})

describe('MultiplayerModal — Waiting state', () => {
  async function mountInWaitingState() {
    const wrapper = mountModal()
    await wrapper.find('[data-testid="input-player-name-create"]').setValue('Alice')
    await wrapper.find('[data-testid="input-room-name-create"]').setValue('room42')
    await wrapper.find('[data-testid="btn-create"]').trigger('click')
    return wrapper
  }

  it('shows "WAITING FOR OPPONENT..." text', async () => {
    const wrapper = await mountInWaitingState()
    expect(wrapper.find('[data-testid="waiting-state"]').text()).toContain('WAITING FOR OPPONENT')
  })

  it('emits @cancel when Cancel is clicked', async () => {
    const wrapper = await mountInWaitingState()
    await wrapper.find('[data-testid="btn-cancel"]').trigger('click')
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('returns to the form view after Cancel resets waiting state', async () => {
    const wrapper = await mountInWaitingState()
    await wrapper.find('[data-testid="btn-cancel"]').trigger('click')
    expect(wrapper.find('[data-testid="waiting-state"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="create-view"]').exists()).toBe(true)
  })
})
