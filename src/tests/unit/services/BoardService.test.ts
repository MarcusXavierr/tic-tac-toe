import { IconType } from '@/enums/IconTypes'
import {
  createBestMovement,
  createRandomMovement,
  generateBoard,
  possibleMoves
} from '@/services/BoardService'
import { describe, it, expect } from 'vitest'

describe('generate board', () => {
  it('should return an empty board', () => {
    const result = generateBoard([])

    expect(result).toStrictEqual([
      { id: 1, piece: null },
      { id: 2, piece: null },
      { id: 3, piece: null },
      { id: 4, piece: null },
      { id: 5, piece: null },
      { id: 6, piece: null },
      { id: 7, piece: null },
      { id: 8, piece: null },
      { id: 9, piece: null }
    ])
  })

  it('should fill player choices', () => {
    const history = [
      { position: 2, piece: IconType.O },
      { position: 4, piece: IconType.X },
      { position: 5, piece: IconType.X },
      { position: 7, piece: IconType.X }
    ] as MoveRecord[]

    const result = generateBoard(history)
    expect(result).toStrictEqual([
      { id: 1, piece: null },
      { id: 2, piece: IconType.O, belongsToWinnerPath: undefined },
      { id: 3, piece: null },
      { id: 4, piece: IconType.X, belongsToWinnerPath: undefined },
      { id: 5, piece: IconType.X, belongsToWinnerPath: undefined },
      { id: 6, piece: null },
      { id: 7, piece: IconType.X, belongsToWinnerPath: undefined },
      { id: 8, piece: null },
      { id: 9, piece: null }
    ])
  })
})

describe('pick only possible moves', () => {
  it('return only possible moves', () => {
    const history = [
      { position: 2, piece: IconType.O },
      { position: 4, piece: IconType.X },
      { position: 5, piece: IconType.X },
      { position: 7, piece: IconType.X }
    ] as MoveRecord[]

    const result = possibleMoves(history)

    expect(result).toStrictEqual([
      { id: 1, piece: null },
      { id: 3, piece: null },
      { id: 6, piece: null },
      { id: 8, piece: null },
      { id: 9, piece: null }
    ])
  })
})

describe('create random valid movement', () => {
  it('should return the only valid movement', () => {
    const history = [
      { position: 1, piece: IconType.O },
      { position: 2, piece: IconType.O },
      { position: 3, piece: IconType.O },
      { position: 4, piece: IconType.O },
      { position: 5, piece: IconType.O },
      { position: 6, piece: IconType.O },
      { position: 7, piece: IconType.O },
      { position: 9, piece: IconType.O }
    ] as MoveRecord[]

    const result = createRandomMovement(history, IconType.X)
    expect(result).toStrictEqual({ position: 8, piece: IconType.X })
  })
})
describe('generateBoard with winner path', () => {
  it('preserves belongsToWinnerPath flag from history', () => {
    const history: MoveRecord[] = [
      { position: 1, piece: IconType.X, belongsToWinnerPath: true },
      { position: 2, piece: IconType.X, belongsToWinnerPath: true },
      { position: 3, piece: IconType.X, belongsToWinnerPath: true }
    ]
    const board = generateBoard(history)
    expect(board[0].belongsToWinnerPath).toBe(true)
    expect(board[1].belongsToWinnerPath).toBe(true)
    expect(board[2].belongsToWinnerPath).toBe(true)
  })
})

describe('possibleMoves with full board', () => {
  it('returns empty array when board is full', () => {
    const history: MoveRecord[] = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((p) => ({
      position: p,
      piece: IconType.X
    }))
    expect(possibleMoves(history)).toStrictEqual([])
  })
})

describe('createBestMovement', () => {
  it('takes the winning move when available', () => {
    // X has 1,2 — best move is 3 to win horizontally
    const history: MoveRecord[] = [
      { position: 1, piece: IconType.X },
      { position: 2, piece: IconType.X },
      { position: 4, piece: IconType.O },
      { position: 5, piece: IconType.O }
    ]
    const result = createBestMovement(history, IconType.X)
    expect(result.position).toBe(3)
    expect(result.piece).toBe(IconType.X)
  })

  it('blocks opponent win', () => {
    // O has 1,2 (needs 3 to win row). X has 5 (no winning threat).
    // Blocking at 3 scores 0 (draw); any other move lets O play 3 for -1.
    const history: MoveRecord[] = [
      { position: 1, piece: IconType.O },
      { position: 2, piece: IconType.O },
      { position: 5, piece: IconType.X }
    ]
    const result = createBestMovement(history, IconType.X)
    expect(result.position).toBe(3)
  })
})

export {}
