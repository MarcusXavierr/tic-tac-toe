import { IconType } from '@/enums/IconTypes'
import { minimax } from '@/services/utils/ai'
import { describe, it, expect } from 'vitest'

describe('minimax', () => {
  it('returns 1 when maximizer (X) already won', () => {
    // X has already won — board is terminal, result found immediately
    const board: MoveRecord[] = [
      { position: 1, piece: IconType.X },
      { position: 2, piece: IconType.X },
      { position: 3, piece: IconType.X },
      { position: 4, piece: IconType.O },
      { position: 5, piece: IconType.O },
    ]
    // isMaximizing=true, piece=X: iconEqualsPiece=true → true===true → 1
    const score = minimax(board, 0, true, IconType.X, -Infinity, Infinity)
    expect(score).toBe(1)
  })

  it('returns -1 when minimizer (O) already won', () => {
    const board: MoveRecord[] = [
      { position: 7, piece: IconType.O },
      { position: 8, piece: IconType.O },
      { position: 9, piece: IconType.O },
      { position: 1, piece: IconType.X },
      { position: 2, piece: IconType.X },
    ]
    const score = minimax(board, 0, true, IconType.X, -Infinity, Infinity)
    expect(score).toBe(-1)
  })

  it('returns 0 for a draw (full board, no winner)', () => {
    // X: 1,3,5,6,8 / O: 2,4,7,9 — valid draw, no winning lines for either
    const board: MoveRecord[] = [
      { position: 1, piece: IconType.X },
      { position: 2, piece: IconType.O },
      { position: 3, piece: IconType.X },
      { position: 4, piece: IconType.O },
      { position: 5, piece: IconType.X },
      { position: 6, piece: IconType.X },
      { position: 7, piece: IconType.O },
      { position: 8, piece: IconType.X },
      { position: 9, piece: IconType.O },
    ]
    const score = minimax(board, 0, true, IconType.X, -Infinity, Infinity)
    expect(score).toBe(0)
  })

  it('returns 1 when X can win in one move (isMaximizing)', () => {
    // X has 1,2 — next X move to 3 wins
    const board: MoveRecord[] = [
      { position: 1, piece: IconType.X },
      { position: 2, piece: IconType.X },
      { position: 4, piece: IconType.O },
      { position: 5, piece: IconType.O },
    ]
    const score = minimax(board, 0, true, IconType.X, -Infinity, Infinity)
    expect(score).toBe(1)
  })

  it('returns -1 when O can win in one move (isMaximizing=false, O is minimizer)', () => {
    // O has 7,8 — next O move to 9 wins, which is bad for X maximizer
    const board: MoveRecord[] = [
      { position: 7, piece: IconType.O },
      { position: 8, piece: IconType.O },
      { position: 1, piece: IconType.X },
      { position: 2, piece: IconType.X },
    ]
    const score = minimax(board, 0, false, IconType.X, -Infinity, Infinity)
    expect(score).toBe(-1)
  })
})

export {}
