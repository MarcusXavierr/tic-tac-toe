/// <reference types="vite/client" />
interface moveRecord {
  position: number,
  piece: number,
  belongsToWinnerPath?: boolean
}

interface gameResult {
  winner: PlayerTypes | null
}

interface State {
  isWaitingToPlay: boolean,
  oponentIsAI: boolean,
  isGameActive: boolean,
  XPlayer: number | null,
  OPlayer: number | null,
  currentPlayerType?: number,
  playHistory: moveRecord[],
  gameResults: gameResult[]
}
