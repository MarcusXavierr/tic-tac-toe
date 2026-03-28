import { IconType } from '@/enums/IconTypes'
import { PlayerTypes } from '@/enums/Players'
import { getIconTypeFromPlayerTurn } from '@/services/IconService'
import { describe, it, expect } from 'vitest'

describe('getIconTypeFromPlayerTurn', () => {
  it('maps XPlayer to IconType.X', () => {
    expect(getIconTypeFromPlayerTurn(PlayerTypes.XPlayer)).toBe(IconType.X)
  })

  it('maps OPlayer to IconType.O', () => {
    expect(getIconTypeFromPlayerTurn(PlayerTypes.OPlayer)).toBe(IconType.O)
  })
})

export {}
