import { IconType } from "@/enums/IconTypes"
import { createRandomMovement, generateBoard, possibleMoves } from "@/services/BoardService"
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
      { position: 7, piece: IconType.X },
    ] as MoveRecord[]

    const result = generateBoard(history)
    expect(result).toStrictEqual([
        { id: 1, piece: null },
        { id: 2, piece: IconType.O, belongsToWinnerPath: undefined },
        { id: 3, piece: null },
        { id: 4, piece: IconType.X, belongsToWinnerPath: undefined },
        { id: 5, piece: IconType.X, belongsToWinnerPath: undefined},
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
      { position: 7, piece: IconType.X },
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
      { position: 9, piece: IconType.O },
    ] as MoveRecord[]

    const result = createRandomMovement(history, IconType.X)
    expect(result).toStrictEqual({ position: 8, piece: IconType.X })
  })
})
export {}
