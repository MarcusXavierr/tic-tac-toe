import { Players, PlayerTypes } from '@/enums/Players'
import { store } from '@/store/index'
import { describe, it, expect, beforeEach } from 'vitest'

beforeEach(() => {
  store.commit('quitGame')
  store.commit('activateGame', {
    XPlayer: Players.playerOne,
    OPlayer: Players.playerTwo,
    oponentIsAI: false
  })
})

describe('getPlayer getter', () => {
  it('returns the correct player for XPlayer type', () => {
    const player = store.getters.getPlayer(PlayerTypes.XPlayer)
    expect(player).toBe(Players.playerOne)
  })

  it('returns the correct player for OPlayer type', () => {
    const player = store.getters.getPlayer(PlayerTypes.OPlayer)
    expect(player).toBe(Players.playerTwo)
  })
})

export {}
