import { IconType } from '@/enums/IconTypes'
import { cleanHistory, rangeWithLeap, sortByPosition } from '@/services/utils/cleanHistory'
import { describe, it, expect } from 'vitest'

describe('cleanHistory', () => {
  it('returns empty array for empty history', () => {
    expect(cleanHistory(IconType.X, [])).toStrictEqual([])
  })

  it('filters to only the requested piece', () => {
    const history: MoveRecord[] = [
      { position: 1, piece: IconType.X },
      { position: 2, piece: IconType.O },
      { position: 3, piece: IconType.X },
    ]
    const result = cleanHistory(IconType.X, history)
    expect(result.every(r => r.piece === IconType.X)).toBe(true)
    expect(result).toHaveLength(2)
  })

  it('returns results sorted by position ascending', () => {
    const history: MoveRecord[] = [
      { position: 7, piece: IconType.O },
      { position: 2, piece: IconType.O },
      { position: 5, piece: IconType.O },
    ]
    const result = cleanHistory(IconType.O, history)
    expect(result.map(r => r.position)).toStrictEqual([2, 5, 7])
  })

  it('returns empty array when piece has no moves in history', () => {
    const history: MoveRecord[] = [
      { position: 1, piece: IconType.O },
      { position: 2, piece: IconType.O },
    ]
    expect(cleanHistory(IconType.X, history)).toStrictEqual([])
  })
})

describe('rangeWithLeap', () => {
  it('generates column 1 (1, 4, 7) with step 3', () => {
    expect(rangeWithLeap(1, 7, 3)).toStrictEqual([1, 4, 7])
  })

  it('generates column 2 (2, 5, 8) with step 3', () => {
    expect(rangeWithLeap(2, 8, 3)).toStrictEqual([2, 5, 8])
  })

  it('generates column 3 (3, 6, 9) with step 3', () => {
    expect(rangeWithLeap(3, 9, 3)).toStrictEqual([3, 6, 9])
  })

  it('generates single element when start equals end', () => {
    expect(rangeWithLeap(5, 5, 3)).toStrictEqual([5])
  })
})

describe('sortByPosition', () => {
  it('returns negative when first position is less', () => {
    const a: MoveRecord = { position: 2, piece: IconType.X }
    const b: MoveRecord = { position: 5, piece: IconType.X }
    expect(sortByPosition(a, b)).toBeLessThan(0)
  })

  it('returns positive when first position is greater', () => {
    const a: MoveRecord = { position: 8, piece: IconType.X }
    const b: MoveRecord = { position: 3, piece: IconType.X }
    expect(sortByPosition(a, b)).toBeGreaterThan(0)
  })

  it('returns 0 when positions are equal', () => {
    const a: MoveRecord = { position: 4, piece: IconType.X }
    const b: MoveRecord = { position: 4, piece: IconType.O }
    expect(sortByPosition(a, b)).toBe(0)
  })
})

export {}
