import { IconType } from '@/enums/IconTypes'
import { swapIconType } from '@/services/utils/player'
import { describe, it, expect } from 'vitest'

describe('swapIconType', () => {
  it('swaps X to O', () => {
    expect(swapIconType(IconType.X)).toBe(IconType.O)
  })

  it('swaps O to X', () => {
    expect(swapIconType(IconType.O)).toBe(IconType.X)
  })

  it('is its own inverse', () => {
    expect(swapIconType(swapIconType(IconType.X))).toBe(IconType.X)
    expect(swapIconType(swapIconType(IconType.O))).toBe(IconType.O)
  })
})

export {}
