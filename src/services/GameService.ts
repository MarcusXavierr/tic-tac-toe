import { IconType } from '../enums/IconTypes'
import { PlayerTypes } from '../enums/Players'
import { cleanHistory, rangeWithLeap, sortByPosition } from './utils/cleanHistory'

export function determineWinner(playHistory: moveRecord[]): PlayerTypes | null {
  if (playHistory.length === 0) {
    return null
  }

  if (findRow(IconType.X, playHistory)) {
    return PlayerTypes.XPlayer
  }

  if (findRow(IconType.O, playHistory)) {
    return PlayerTypes.OPlayer
  }

  return null
}

function findRow(piece: IconType, playHistory: moveRecord[]): boolean {
  const history = cleanHistory(piece, playHistory)

  return (
    findHorizontalPattern(history).length > 0 ||
    findVerticalPattern(history).length > 0 ||
    findDiagonalPatter(history).length > 0
  )
}

function findHorizontalPattern(history: moveRecord[]): number[] {
  const cases = rangeWithLeap(1, 9, 3)

  return cases.reduce<number[]>((acc, i) => {
    if (acc.length > 0) return acc

    const fst = history.some((move) => move.position === i)
    const snd = history.some((move) => move.position === i + 1)
    const third = history.some((move) => move.position === i + 2)

    if (fst && snd && third) {
      return acc.concat([i, i + 1, i + 2])
    }
    return []
  }, [])
}

function findVerticalPattern(history: moveRecord[]): number[] {
  const cases = rangeWithLeap(1, 3, 1)

  return cases.reduce<number[]>((acc, i) => {
    if (acc.length > 0) return acc

    const fst = history.some((move) => move.position === i)
    const snd = history.some((move) => move.position === i + 3)
    const third = history.some((move) => move.position === i + 6)

    if (fst && snd && third) {
      return acc.concat([i, i + 3, i + 6])
    }
    return []
  }, [])
}

function findDiagonalPatter(history: moveRecord[]): number[] {
  const mainAxis =
    history.some((move) => move.position === 1) &&
    history.some((move) => move.position === 5) &&
    history.some((move) => move.position === 9)

  const secondaryAxis =
    history.some((move) => move.position === 3) &&
    history.some((move) => move.position === 5) &&
    history.some((move) => move.position === 7)

  if (mainAxis) {
    return [1, 5, 9]
  }

  if (secondaryAxis) {
    return [3, 5, 7]
  }
  return []
}
