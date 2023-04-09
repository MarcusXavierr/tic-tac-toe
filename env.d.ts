/// <reference types="vite/client" />
interface moveRecord {
  position: number,
  piece: number
}

interface gameResult {
  winner: number | null
}

enum Players {
  playerOne = 1,
  playerTwo = 2
}

interface State {
  isGameActive: boolean,
  XPlayer: number | null,
  OPlayer: number | null,
  playHistory: moveRecord[],
  gameResults: gameResult[]
}
