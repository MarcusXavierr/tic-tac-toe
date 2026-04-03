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
  isGameActive: boolean,
  XPlayer: number | null,
  OPlayer: number | null,
  currentPlayerType?: number,
  playHistory: MoveRecord[],
  gameResults: GameResult[],
  // multiplayer fields
  isMultiplayer: boolean,
  myPlayerType: import('./enums/Players').PlayerTypes | null,
  opponentName: string,
  roomName: string,
  isWaitingForOpponent: boolean,
  isConnected: boolean,
  opponentDisconnected: boolean,
  // play-again handshake
  playAgainSent: boolean,
  playAgainReceived: boolean,
  remoteHoverCell: number | null,
  // i18n locale
  locale: string,
}

interface ImportMetaEnv {
  readonly VITE_API_BASE: string
  readonly VITE_REMOTE_HOVER_DURATION?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
