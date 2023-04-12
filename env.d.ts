/// <reference types="vite/client" />
interface moveRecord {
  position: number,
  piece: number
}

interface gameResult {
  winner: PlayerTypes | null
}

interface State {
  isGameActive: boolean,
  XPlayer: number | null,
  OPlayer: number | null,
  currentPlayerType?: number,
  playHistory: moveRecord[],
  gameResults: gameResult[]
}
