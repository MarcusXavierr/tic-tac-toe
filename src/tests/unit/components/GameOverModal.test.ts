import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GameOverModal from '@/components/GameOverModal.vue'
import { createTestI18n } from '../helpers/i18n'

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
  BaseIcon: {
    template: '<div />'
  }
}

function mountModal(props = {}) {
  return mount(GameOverModal, {
    props: { show: true, winner: -1, ...props },
    global: { plugins: [createTestI18n()], stubs }
  })
}

describe('GameOverModal — waiting prop', () => {
  it('shows WAITING FOR OPPONENT... text when waiting is true', () => {
    const wrapper = mountModal({ waiting: true })
    expect(wrapper.text()).toContain('WAITING FOR OPPONENT...')
  })

  it('hides NEXT ROUND button when waiting is true', () => {
    const wrapper = mountModal({ waiting: true })
    const buttons = wrapper.findAll('button')
    const nextButton = buttons.find((btn) => btn.text() === 'NEXT ROUND')
    expect(nextButton).toBeUndefined()
  })

  it('does not show waiting text when waiting is false', () => {
    const wrapper = mountModal({ waiting: false })
    expect(wrapper.text()).not.toContain('WAITING FOR OPPONENT...')
  })

  it('shows NEXT ROUND button when waiting is false', () => {
    const wrapper = mountModal({ waiting: false })
    const buttons = wrapper.findAll('button')
    const nextButton = buttons.find((btn) => btn.text() === 'NEXT ROUND')
    expect(nextButton).toBeDefined()
  })
})

describe('GameOverModal — winner display', () => {
  it('shows ROUND TIED when winner is -1', () => {
    const wrapper = mountModal({ winner: -1 })
    expect(wrapper.text()).toContain('ROUND TIED')
  })

  it('shows player winner text for X player', () => {
    const wrapper = mountModal({ winner: 0, playerWinner: 1 })
    expect(wrapper.text()).toContain('PLAYER 1 WINS!')
  })

  it('shows player winner text for O player', () => {
    const wrapper = mountModal({ winner: 1, playerWinner: 2 })
    expect(wrapper.text()).toContain('PLAYER 2 WINS!')
  })
})

describe('GameOverModal — winnerName prop', () => {
  it('shows winnerName instead of playerWins when winnerName is provided (X player)', () => {
    const wrapper = mountModal({ winner: 0, playerWinner: 1, winnerName: 'YOU WIN!' })
    expect(wrapper.text()).toContain('YOU WIN!')
    expect(wrapper.text()).not.toContain('PLAYER 1 WINS!')
  })

  it('shows winnerName instead of playerWins when winnerName is provided (O player)', () => {
    const wrapper = mountModal({ winner: 1, playerWinner: 2, winnerName: 'Alice WINS!' })
    expect(wrapper.text()).toContain('Alice WINS!')
    expect(wrapper.text()).not.toContain('PLAYER 2 WINS!')
  })

  it('falls back to playerWins translation when winnerName is null', () => {
    const wrapper = mountModal({ winner: 0, playerWinner: 1, winnerName: null })
    expect(wrapper.text()).toContain('PLAYER 1 WINS!')
  })
})

describe('GameOverModal — button events', () => {
  it('emits quit event when QUIT button is clicked', async () => {
    const wrapper = mountModal()
    const buttons = wrapper.findAll('button')
    const quitButton = buttons.find((btn) => btn.text() === 'QUIT')
    await quitButton!.trigger('click')
    expect(wrapper.emitted('quit')).toBeTruthy()
  })

  it('emits next event when NEXT ROUND button is clicked', async () => {
    const wrapper = mountModal({ waiting: false })
    const buttons = wrapper.findAll('button')
    const nextButton = buttons.find((btn) => btn.text() === 'NEXT ROUND')
    await nextButton!.trigger('click')
    expect(wrapper.emitted('next')).toBeTruthy()
  })
})
