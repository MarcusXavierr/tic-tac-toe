export type ServerMessage =
  | { type: 'player_joined'; name: string; player_type: 'x' | 'o'; order: number }
  | { type: 'player_disconnected' }
  | { type: 'move'; cell: number }
  | { type: 'play_again' }
  | { type: 'hover'; cell: number }

function toWsUrl(httpBase: string): string {
  return httpBase.replace(/^http:\/\//, 'ws://').replace(/^https:\/\//, 'wss://')
}

export class MultiplayerService {
  private ws: WebSocket | null = null

  async createRoom(roomId: string): Promise<void> {
    const base = import.meta.env.VITE_API_BASE
    const response = await fetch(`${base}/room/${roomId}`, { method: 'POST' })
    if (!response.ok) {
      throw new Error(`Failed to create room: ${response.status}`)
    }
  }

  joinRoom(
    roomId: string,
    playerName: string,
    onMessage: (msg: ServerMessage) => void,
    onClose: () => void,
    playerType?: 'x' | 'o'
  ): void {
    const base = toWsUrl(import.meta.env.VITE_API_BASE)
    let url = `${base}/room/${roomId}/join?name=${encodeURIComponent(playerName)}`
    if (playerType) {
      url += `&player_type=${playerType}`
    }
    this.ws = new WebSocket(url)

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data) as ServerMessage
      onMessage(msg)
    }

    this.ws.onclose = () => {
      onClose()
    }
  }

  sendMove(cell: number): void {
    if (!this.ws) return
    this.ws.send(JSON.stringify({ type: 'move', cell }))
  }

  sendPlayAgain(): void {
    if (!this.ws) return
    this.ws.send(JSON.stringify({ type: 'play_again' }))
  }

  sendHover(cell: number): void {
    if (!this.ws) return
    this.ws.send(JSON.stringify({ type: 'hover', cell }))
  }

  disconnect(): void {
    if (!this.ws) return
    this.ws.onclose = null // suppress onClose for intentional disconnect
    this.ws.close()
    this.ws = null
  }
}
