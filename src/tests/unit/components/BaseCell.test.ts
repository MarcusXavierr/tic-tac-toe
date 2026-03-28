import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { PlayerTypes } from '@/enums/Players'
import { IconType } from '@/enums/IconTypes'

function makeStore(overrides = {}) {
  return createStore({
    state() {
      return {
        currentPlayerType: PlayerTypes.XPlayer,
        isWaitingToPlay: false,
        myPlayerType: PlayerTypes.XPlayer,
        ...overrides
      }
    }
  })
}

const IconStub = {
  template: '<div :data-icon="iconType" />',
  props: ['iconType']
}

const stubs = { BaseIcon: IconStub }

describe('BaseCell — remote hover rendering', () => {
  it('shows O_outline when isRemoteHovered=true and myPlayerType is X', async () => {
    const store = makeStore({ myPlayerType: PlayerTypes.XPlayer })
    const { default: BaseCell } = await import('@/components/base/BaseCell.vue')
    const wrapper = mount(BaseCell, {
      props: { selectedIcon: null, isRemoteHovered: true, isRemoteHoverFading: false },
      global: { plugins: [store], stubs }
    })
    const icon = wrapper.find('[data-icon]')
    expect(icon.exists()).toBe(true)
    expect(Number(icon.attributes('data-icon'))).toBe(IconType.O_outline)
  })

  it('shows X_outline when isRemoteHovered=true and myPlayerType is O', async () => {
    const store = makeStore({ myPlayerType: PlayerTypes.OPlayer })
    const { default: BaseCell } = await import('@/components/base/BaseCell.vue')
    const wrapper = mount(BaseCell, {
      props: { selectedIcon: null, isRemoteHovered: true, isRemoteHoverFading: false },
      global: { plugins: [store], stubs }
    })
    const icon = wrapper.find('[data-icon]')
    expect(Number(icon.attributes('data-icon'))).toBe(IconType.X_outline)
  })

  it('local hover takes priority over remote hover', async () => {
    const store = makeStore({ myPlayerType: PlayerTypes.XPlayer, currentPlayerType: PlayerTypes.XPlayer })
    const { default: BaseCell } = await import('@/components/base/BaseCell.vue')
    const wrapper = mount(BaseCell, {
      props: { selectedIcon: null, isRemoteHovered: true, isRemoteHoverFading: false },
      global: { plugins: [store], stubs }
    })
    wrapper.vm.hover = true
    await wrapper.vm.$nextTick()
    const icon = wrapper.find('[data-icon]')
    expect(Number(icon.attributes('data-icon'))).toBe(IconType.X_outline)
  })

  it('does not show remote hover when cell has a piece', async () => {
    const store = makeStore({ myPlayerType: PlayerTypes.XPlayer })
    const { default: BaseCell } = await import('@/components/base/BaseCell.vue')
    const wrapper = mount(BaseCell, {
      props: { selectedIcon: IconType.X, isRemoteHovered: true, isRemoteHoverFading: false },
      global: { plugins: [store], stubs }
    })
    const icon = wrapper.find('[data-icon]')
    expect(Number(icon.attributes('data-icon'))).toBe(IconType.X)
  })

  it('shows nothing when isRemoteHovered=false and no local hover and no piece', async () => {
    const store = makeStore({ myPlayerType: PlayerTypes.XPlayer })
    const { default: BaseCell } = await import('@/components/base/BaseCell.vue')
    const wrapper = mount(BaseCell, {
      props: { selectedIcon: null, isRemoteHovered: false, isRemoteHoverFading: false },
      global: { plugins: [store], stubs }
    })
    expect(wrapper.find('[data-icon]').exists()).toBe(false)
  })

})

export {}
