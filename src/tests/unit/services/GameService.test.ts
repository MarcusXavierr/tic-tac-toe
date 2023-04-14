import { IconType } from '../../../enums/IconTypes'
import { PlayerTypes } from '../../../enums/Players'
import { determineWinner, findWinnerPath, markWinnerPath } from '../../../services/GameService'
import { describe, it, expect } from 'vitest'

describe('Find out the winner on horizontal', () => {
  const cases = [
    {
      history: [],
      want: null,
      name: 'null'
    },
    {
      history: [
        { piece: IconType.X, position: 1 },
        { piece: IconType.X, position: 2 },
        { piece: IconType.X, position: 3 }
      ],
      want: PlayerTypes.XPlayer,
      name: 'X'
    },
    {
      history: [
        { piece: IconType.O, position: 5 },
        { piece: IconType.O, position: 4 },
        { piece: IconType.O, position: 6 }
      ],
      want: PlayerTypes.OPlayer,
      name: 'O'
    },
    {
      history: [
        { piece: IconType.O, position: 5 },
        { piece: IconType.O, position: 6 },
        { piece: IconType.O, position: 7 }
      ],
      want: null,
      name: 'null'
    }
  ]

  cases.forEach((tt) => {
    it(`should return ${tt.name} as winner`, () => {
      const result = determineWinner(tt.history)
      expect(result).toBe(tt.want)
    })
  })
})

describe('Find out the winner on vertical', () => {
  const cases = [
    {
      history: [
        { piece: IconType.X, position: 1 },
        { piece: IconType.X, position: 4 },
        { piece: IconType.X, position: 7 }
      ],
      want: PlayerTypes.XPlayer,
      name: 'X'
    },
    {
      history: [
        { piece: IconType.X, position: 4 },
        { piece: IconType.O, position: 2 },
        { piece: IconType.X, position: 1 },
        { piece: IconType.O, position: 5 },
        { piece: IconType.O, position: 8 }
      ],
      want: PlayerTypes.OPlayer,
      name: 'O'
    },
    {
      history: [
        { piece: IconType.X, position: 2 },
        { piece: IconType.O, position: 5 },
        { piece: IconType.X, position: 8 }
      ],
      want: null,
      name: 'null'
    }
  ]

  cases.forEach((tt) => {
    it(`should return ${tt.name} as winner`, () => {
      const result = determineWinner(tt.history)
      expect(result).toBe(tt.want)
    })
  })
})

describe('Find out the winner on diagonal', () => {
  const cases = [
    {
      history: [
        { piece: IconType.X, position: 1 },
        { piece: IconType.X, position: 9 },
        { piece: IconType.X, position: 5 }
      ],
      want: PlayerTypes.XPlayer,
      name: 'X'
    },
    {
      history: [
        { piece: IconType.O, position: 7 },
        { piece: IconType.O, position: 3 },
        { piece: IconType.O, position: 5 }
      ],
      want: PlayerTypes.OPlayer,
      name: 'O'
    },
    {
      history: [
        { piece: IconType.X, position: 1 },
        { piece: IconType.X, position: 9 },
        { piece: IconType.O, position: 7 },
        { piece: IconType.O, position: 3 }
      ],
      want: null,
      name: 'null'
    }
  ]

  cases.forEach((tt) => {
    it(`should return ${tt.name} as winner`, () => {
      const result = determineWinner(tt.history)
      expect(result).toBe(tt.want)
    })
  })
})

describe('find the winner pattern', () => {
  const cases = [
    {
      history: [
        { piece: IconType.X, position: 1 },
        { piece: IconType.X, position: 2 },
        { piece: IconType.X, position: 4 },
        { piece: IconType.O, position: 3 },
        { piece: IconType.X, position: 9 },
        { piece: IconType.X, position: 5 }
      ],
      piece: IconType.X,
      want: [1, 5, 9],
      name: 'diagonal'
    },
    {
      history: [
        { piece: IconType.O, position: 1 },
        { piece: IconType.O, position: 3 },
        { piece: IconType.O, position: 4 },
        { piece: IconType.O, position: 7 },
        { piece: IconType.O, position: 8 }
      ],
      piece: IconType.O,
      want: [1, 4, 7],
      name: 'vertical'
    },
    {
      history: [
        { piece: IconType.X, position: 1 },
        { piece: IconType.X, position: 7 },
        { piece: IconType.O, position: 6 },
        { piece: IconType.O, position: 4 },
        { piece: IconType.O, position: 5 },
        { piece: IconType.O, position: 8 }
      ],
      piece: IconType.O,
      want: [4, 5, 6],
      name: 'horizontal'
    }
  ]

  cases.forEach((tt) => {
    it(`should return ${tt.name} as winner`, () => {
      const result = findWinnerPath(tt.piece, tt.history)
      expect(result).toStrictEqual(tt.want)
    })
  })
})

describe('map winner path to history', () => {
  const history = [
    { piece: IconType.O, position: 1 },
    { piece: IconType.O, position: 2 },
    { piece: IconType.X, position: 4 },
    { piece: IconType.O, position: 3 },
    { piece: IconType.X, position: 9 },
    { piece: IconType.X, position: 5 }
  ]
  const path = [1, 2, 3]

  const result = markWinnerPath(history, path)
  const want = [
    { piece: IconType.O, position: 1, belongsToWinnerPath: true },
    { piece: IconType.O, position: 2, belongsToWinnerPath: true },
    { piece: IconType.X, position: 4 , belongsToWinnerPath: false },
    { piece: IconType.O, position: 3, belongsToWinnerPath: true },
    { piece: IconType.X, position: 9 , belongsToWinnerPath: false },
    { piece: IconType.X, position: 5 , belongsToWinnerPath: false }
  ]

  it('should fill all fields', () => {
    expect(result).toStrictEqual(want)
  })
})
export {}
