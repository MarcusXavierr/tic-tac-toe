import type { IconType } from '@/enums/IconTypes'
import { possibleMoves } from '../BoardService'
import { determineWinner } from '../GameService'
import { getIconTypeFromPlayerTurn } from '../IconService'
import { swapIconType } from './player'

export function minimax(
  board: moveRecord[],
  depth: number,
  isMaximizing: boolean,
  piece: IconType,
  alpha: number,
  beta: number
) {
  const result = determineWinner(board)
  if (result != null || board.length >= 9) {
    if (result == null) {
      return 0
    }

    const icon = getIconTypeFromPlayerTurn(result)
    const iconEqualsPiece = icon === piece

    // if isMaximizing and iconEqualsPiece are the same value, the maximizer won
    if (isMaximizing === iconEqualsPiece) {
      return 1
    }

    return -1
  }

  if (isMaximizing) {
    let bestScore = -Infinity
    const moves = possibleMoves(board)
    for (let i = 0; i < moves.length; i++) {
      const move = moves[i]
      const tmpBoard = board.concat({ position: move.id, piece })
      const score = minimax(tmpBoard, depth + 1, false, swapIconType(piece), alpha, beta)
      bestScore = Math.max(score, bestScore)
      alpha = Math.max(alpha, bestScore)
      if (beta <= alpha) {
        break
      }
    }
    return bestScore
  }

  let bestScore = Infinity
  const moves = possibleMoves(board)
  for (let i = 0; i < moves.length; i++) {
    const move = moves[i]
    const tmpBoard = board.concat({ position: move.id, piece })
    const score = minimax(tmpBoard, depth + 1, true, swapIconType(piece), alpha, beta)
    bestScore = Math.min(score, bestScore)
    beta = Math.min(beta, bestScore)
    if (beta <= alpha) {
      break
    }
  }
  return bestScore
}
