import type { IconType } from '@/enums/IconTypes'
import { minimax } from './utils/ai'
import { swapIconType } from './utils/player'

export function createRandomMovement(playHistory: MoveRecord[], piece: IconType): MoveRecord {
  const moves = possibleMoves(playHistory)
  const randomIndex = Math.floor(Math.random() * moves.length)
  const item = moves[randomIndex]
  return { position: item.id, piece }
}

export function createBestMovement(playHistory: MoveRecord[], piece: IconType): MoveRecord {
  //return random move if is the first play of AI
  // if (playHistory.length < 1) {
  //   return createRandomMovement(playHistory, piece)
  // }

  let bestScore = -Infinity
  let bestMove: move
  const moves = possibleMoves(playHistory)

  moves.forEach((move) => {
    const board = playHistory.concat({ position: move.id, piece })
    const score = minimax(board, 0, false, swapIconType(piece), -Infinity, Infinity)
    if (score > bestScore) {
      bestScore = score
      bestMove = move
    }
  })

  return { position: bestMove!.id, piece }
}

export function possibleMoves(playHistory: MoveRecord[]): board {
  return generateBoard(playHistory).filter((item) => item.piece == null)
}

export function generateBoard(playHistory: MoveRecord[]): board {
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

    return { ...cell, piece: item.piece, belongsToWinnerPath: item.belongsToWinnerPath}
  })
}

export type move = {
  id: number
  piece: IconType | null
  belongsToWinnerPath?: boolean
}
type board = move[]
