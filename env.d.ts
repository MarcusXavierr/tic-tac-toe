/// <reference types="vite/client" />
interface MoveRecord {
  position: number,
  piece: number,
  belongsToWinnerPath?: boolean
}

interface GameResult {
  winner: PlayerTypes | null
}

interface State {
  isWaitingToPlay: boolean,
  oponentIsAI: boolean,
  isOnlineGame: boolean,
  isGameActive: boolean,
  XPlayer: number | null,
  OPlayer: number | null,
  currentPlayerType?: number,
  playHistory: MoveRecord[],
  gameResults: GameResult[],
  websocketClient?: Client,
  room?: Room,
  userId?: string
}
