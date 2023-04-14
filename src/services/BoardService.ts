import type { IconType } from '@/enums/IconTypes'
import { PlayerTypes } from '@/enums/Players'
import { determineWinner } from './GameService'
import { swapIconType } from './utils/player'

export function createRandomMovement(playHistory: moveRecord[], piece: IconType): moveRecord {
  const moves = possibleMoves(playHistory)
  const randomIndex = Math.floor(Math.random() * moves.length)
  const item = moves[randomIndex]
  return { position: item.id, piece }
}

export function createBestMovement(playHistory: moveRecord[], piece: IconType): moveRecord {
  //return random move if is the first play of AI
  if (playHistory.length < 1) {
    return createRandomMovement(playHistory, piece)
  }

  let bestScore = -Infinity
  let bestMove: move
  const moves = possibleMoves(playHistory)

  moves.forEach((move) => {
    const board = playHistory.concat({ position: move.id, piece })
    const score = minimax(board, 0, false, swapIconType(piece))
    if (score > bestScore) {
      bestScore = score
      bestMove = move
    }
  })

  return { position: bestMove!.id, piece }
}

export function possibleMoves(playHistory: moveRecord[]): board {
  return generateBoard(playHistory).filter((item) => item.piece == null)
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

function minimax(board: moveRecord[], depth: number, isMaximizing: boolean, piece: IconType) {
  const result = determineWinner(board)
  if (result != null || board.length >= 9) {
    switch (result) {
      case null:
        return 0
      case PlayerTypes.XPlayer:
        return -1
      case PlayerTypes.OPlayer:
        return 1
    }
  }

  if (isMaximizing) {
    let bestScore = -Infinity
    const moves = possibleMoves(board)
    moves.forEach((move) => {
      const tmpBoard = board.concat({ position: move.id, piece })
      const score = minimax(tmpBoard, depth + 1, false, swapIconType(piece))
      bestScore = Math.max(score, bestScore)
    })
    return bestScore
  }

  let bestScore = Infinity
  const moves = possibleMoves(board)
  moves.forEach((move) => {
    const tmpBoard = board.concat({ position: move.id, piece })
    const score = minimax(tmpBoard, depth + 1, true, swapIconType(piece))
    bestScore = Math.min(score, bestScore)
  })
  return bestScore

}
export type move = {
  id: number
  piece: IconType | null
}
type board = move[]
