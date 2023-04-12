import { PlayerTypes } from '../../../enums/Players'
import { determineWinner } from '../../../services/GameService'

describe('Find out the winner on horizontal', () => {
  const cases = [
    {
      history: [],
      want: null,
      name: 'null'
    },
    {
      history: [
        { piece: PlayerTypes.XPlayer, position: 1 },
        { piece: PlayerTypes.XPlayer, position: 2 },
        { piece: PlayerTypes.XPlayer, position: 3 }
      ],
      want: PlayerTypes.XPlayer,
      name: 'X'
    },
    {
      history: [
        { piece: PlayerTypes.OPlayer, position: 5 },
        { piece: PlayerTypes.OPlayer, position: 4 },
        { piece: PlayerTypes.OPlayer, position: 6 }
      ],
      want: PlayerTypes.OPlayer,
      name: 'O'
    },
    {
      history: [
        { piece: PlayerTypes.OPlayer, position: 5 },
        { piece: PlayerTypes.OPlayer, position: 6 },
        { piece: PlayerTypes.OPlayer, position: 7 }
      ],
      want: null,
      name: 'null'
    },
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
        { piece: PlayerTypes.XPlayer, position: 1 },
        { piece: PlayerTypes.XPlayer, position: 4 },
        { piece: PlayerTypes.XPlayer, position: 7 }
      ],
      want: PlayerTypes.XPlayer,
      name: 'X'
    },
    {
      history: [
        { piece: PlayerTypes.XPlayer, position: 4 },
        { piece: PlayerTypes.OPlayer, position: 2 },
        { piece: PlayerTypes.XPlayer, position: 1 },
        { piece: PlayerTypes.OPlayer, position: 5 },
        { piece: PlayerTypes.OPlayer, position: 8 }
      ],
      want: PlayerTypes.OPlayer,
      name: 'O'
    },
    {
      history: [
        { piece: PlayerTypes.XPlayer, position: 2 },
        { piece: PlayerTypes.OPlayer, position: 5 },
        { piece: PlayerTypes.XPlayer, position: 8 }
      ],
      want: null,
      name: 'null'
    },
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
        { piece: PlayerTypes.XPlayer, position: 1 },
        { piece: PlayerTypes.XPlayer, position: 9 },
        { piece: PlayerTypes.XPlayer, position: 5 },
      ],
      want: PlayerTypes.XPlayer,
      name: 'X'
    },
    {
      history: [
        { piece: PlayerTypes.OPlayer, position: 7 },
        { piece: PlayerTypes.OPlayer, position: 3 },
        { piece: PlayerTypes.OPlayer, position: 5 },
      ],
      want: PlayerTypes.OPlayer,
      name: 'O'
    },
    {
      history: [
        { piece: PlayerTypes.XPlayer, position: 1 },
        { piece: PlayerTypes.XPlayer, position: 9 },
        { piece: PlayerTypes.OPlayer, position: 7 },
        { piece: PlayerTypes.OPlayer, position: 3 },
      ],
      want: null,
      name: 'null'
    },
  ]

  cases.forEach((tt) => {
    it(`should return ${tt.name} as winner`, () => {
      const result = determineWinner(tt.history)
      expect(result).toBe(tt.want)
    })
  })
})

export {}
