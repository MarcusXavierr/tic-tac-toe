import { PlayerTypes } from '../enums/Players'
import { cleanHistory, rangeWithLeap } from './utils/cleanHistory'

export function determineWinner(playHistory: moveRecord[]): PlayerTypes | null {
  if (playHistory.length === 0) {
    return null
  }

  if (findRow(PlayerTypes.XPlayer, playHistory)) {
    return PlayerTypes.XPlayer
  }

  if (findRow(PlayerTypes.OPlayer, playHistory)) {
    return PlayerTypes.OPlayer
  }

  return null
}

function findRow(piece: PlayerTypes, playHistory: moveRecord[]): boolean {
  const history = cleanHistory(piece, playHistory)

  return (
    findHorizontalPattern(history) || findVerticalPattern(history) || findDiagonalPatter(history)
  )
}

function findHorizontalPattern(history: moveRecord[]): boolean {
  const cases = rangeWithLeap(1, 9, 3)

  return cases.reduce((acc, i) => {
    if (acc) return acc

    const fst = history.some((move) => move.position === i)
    const snd = history.some((move) => move.position === i + 1)
    const third = history.some((move) => move.position === i + 2)

    return fst && snd && third
  }, false)
}

function findVerticalPattern(history: moveRecord[]): boolean {
  const cases = rangeWithLeap(1, 3, 1)

  return cases.reduce((acc, i) => {
    if (acc) return acc
    const fst = history.some((move) => move.position === i)
    const snd = history.some((move) => move.position === i + 3)
    const third = history.some((move) => move.position === i + 6)

    return fst && snd && third
  }, false)
}

function findDiagonalPatter(history: moveRecord[]): boolean {
  const mainAxis =
    history.some((move) => move.position === 1) &&
    history.some((move) => move.position === 5) &&
    history.some((move) => move.position === 9)

  const secondaryAxis =
    history.some((move) => move.position === 3) &&
    history.some((move) => move.position === 5) &&
    history.some((move) => move.position === 7)

  return mainAxis || secondaryAxis
}
