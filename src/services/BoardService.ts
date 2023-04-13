import type { IconType } from '../enums/IconTypes'

export function createRandomMovement(playHistory: moveRecord[], piece: IconType): moveRecord {
  const moves = possibleMoves(playHistory)
  const randomIndex = Math.floor(Math.random() * moves.length);
  const item = moves[randomIndex]
  return { position: item.id, piece: piece }
}

export function possibleMoves(playHistory: moveRecord[]): board {
  return generateBoard(playHistory).filter( item => item.piece == null )
}

export function generateBoard(playHistory: moveRecord[]): board {
  const emptyBoard = [
    { id: 1, piece: null },
    { id: 2, piece: null },
    { id: 3, piece: null },
    { id: 4, piece: null },
    { id: 5, piece: null },
    { id: 6, piece: null },
    { id: 7, piece: null },
    { id: 8, piece: null },
    { id: 9, piece: null }
  ]

  return emptyBoard.map((cell) => {
    const item = playHistory.find((x) => x.position == cell.id)
    if (!item) {
      return cell
    }

    return { ...cell, piece: item.piece }
  })
}

type move = {
  id: number,
  piece: IconType | null
}
type board = move[]
