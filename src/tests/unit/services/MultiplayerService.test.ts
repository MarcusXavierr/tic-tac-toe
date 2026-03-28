import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MultiplayerService } from '@/services/MultiplayerService'

// ── WebSocket mock ────────────────────────────────────────────────────────────
class MockWebSocket {
  static instances: MockWebSocket[] = []
  url: string
  onmessage: ((event: { data: string }) => void) | null = null
  onclose: (() => void) | null = null
  onopen: (() => void) | null = null
  readyState = 1 // OPEN
  sentMessages: string[] = []

  constructor(url: string) {
    this.url = url
    MockWebSocket.instances.push(this)
  }

  send(data: string) {
    this.sentMessages.push(data)
  }

  close() {
    this.readyState = 3 // CLOSED
    this.onclose?.()
  }

  // Test helper: simulate server pushing a message
  simulateMessage(data: object) {
    this.onmessage?.({ data: JSON.stringify(data) })
  }
}

// ── Setup / teardown ─────────────────────────────────────────────────────────
beforeEach(() => {
  MockWebSocket.instances = []
  vi.stubEnv('VITE_API_BASE', 'http://localhost:8888')
  vi.stubGlobal('WebSocket', MockWebSocket)
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve({ ok: true } as Response))
  )
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

// ── createRoom ────────────────────────────────────────────────────────────────
describe('MultiplayerService.createRoom', () => {
  it('POSTs to /room/{roomId}', async () => {
    const service = new MultiplayerService()
    await service.createRoom('lobby-1')
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/room/lobby-1'),
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('includes the full base URL', async () => {
    const service = new MultiplayerService()
    await service.createRoom('my-room')
    const calledUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
    expect(calledUrl).toMatch(/^http/)
    expect(calledUrl).toContain('/room/my-room')
  })

  it('throws when the server returns a non-ok response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: false, status: 409 } as Response))
    )
    const service = new MultiplayerService()
    await expect(service.createRoom('taken-room')).rejects.toThrow()
  })
})

// ── joinRoom ──────────────────────────────────────────────────────────────────
describe('MultiplayerService.joinRoom', () => {
  it('opens a WebSocket to /room/{roomId}/join with player name query param', () => {
    const service = new MultiplayerService()
    service.joinRoom('room-42', 'Alice', vi.fn(), vi.fn())
    expect(MockWebSocket.instances).toHaveLength(1)
    const ws = MockWebSocket.instances[0]
    expect(ws.url).toContain('/room/room-42/join')
    expect(ws.url).toContain('name=Alice')
  })

  it('uses ws:// protocol', () => {
    const service = new MultiplayerService()
    service.joinRoom('room-1', 'Bob', vi.fn(), vi.fn())
    const ws = MockWebSocket.instances[0]
    expect(ws.url).toMatch(/^ws/)
  })

  it('includes player_type in the URL when provided', () => {
    const service = new MultiplayerService()
    service.joinRoom('room-1', 'Alice', vi.fn(), vi.fn(), 'x')
    const ws = MockWebSocket.instances[0]
    expect(ws.url).toContain('player_type=x')
  })

  it('omits player_type from URL when not provided', () => {
    const service = new MultiplayerService()
    service.joinRoom('room-1', 'Alice', vi.fn(), vi.fn())
    const ws = MockWebSocket.instances[0]
    expect(ws.url).not.toContain('player_type')
  })

  it('calls onMessage callback with parsed ServerMessage on incoming data', () => {
    const onMessage = vi.fn()
    const service = new MultiplayerService()
    service.joinRoom('room-1', 'Alice', onMessage, vi.fn())
    const ws = MockWebSocket.instances[0]
    ws.simulateMessage({ type: 'player_joined', name: 'Bob', player_type: 'x', order: 1 })
    expect(onMessage).toHaveBeenCalledWith({
      type: 'player_joined',
      name: 'Bob',
      player_type: 'x',
      order: 1
    })
  })

  it('calls onMessage callback with parsed play_again message', () => {
    const onMessage = vi.fn()
    const service = new MultiplayerService()
    service.joinRoom('room-1', 'Alice', onMessage, vi.fn())
    const ws = MockWebSocket.instances[0]
    ws.simulateMessage({ type: 'play_again' })
    expect(onMessage).toHaveBeenCalledWith({ type: 'play_again' })
  })

  it('calls onClose callback when WebSocket closes', () => {
    const onClose = vi.fn()
    const service = new MultiplayerService()
    service.joinRoom('room-1', 'Alice', vi.fn(), onClose)
    const ws = MockWebSocket.instances[0]
    ws.close()
    expect(onClose).toHaveBeenCalled()
  })
})

// ── sendMove ──────────────────────────────────────────────────────────────────
describe('MultiplayerService.sendMove', () => {
  it('sends a JSON move message through the open WebSocket', () => {
    const service = new MultiplayerService()
    service.joinRoom('room-1', 'Alice', vi.fn(), vi.fn())
    service.sendMove(4)
    const ws = MockWebSocket.instances[0]
    expect(ws.sentMessages).toHaveLength(1)
    expect(JSON.parse(ws.sentMessages[0])).toEqual({ type: 'move', cell: 4 })
  })

  it('does nothing when no WebSocket is open', () => {
    const service = new MultiplayerService()
    // No joinRoom called — sendMove should not throw
    expect(() => service.sendMove(0)).not.toThrow()
  })
})

// ── disconnect ────────────────────────────────────────────────────────────────
describe('MultiplayerService.disconnect', () => {
  it('closes the WebSocket', () => {
    const service = new MultiplayerService()
    service.joinRoom('room-1', 'Alice', vi.fn(), vi.fn())
    const ws = MockWebSocket.instances[0]
    service.disconnect()
    expect(ws.readyState).toBe(3) // CLOSED
  })

  it('is safe to call when no WebSocket exists', () => {
    const service = new MultiplayerService()
    expect(() => service.disconnect()).not.toThrow()
  })

  it('does not call onClose when disconnecting intentionally', () => {
    const onClose = vi.fn()
    const service = new MultiplayerService()
    service.joinRoom('room-1', 'Alice', vi.fn(), onClose)
    // Patch onclose to null before close (service should do this)
    service.disconnect()
    // onClose should NOT fire on intentional disconnect
    expect(onClose).not.toHaveBeenCalled()
  })
})

// ── sendPlayAgain ─────────────────────────────────────────────────────────────
describe('MultiplayerService.sendPlayAgain', () => {
  it('sends a JSON play_again message through the open WebSocket', () => {
    const service = new MultiplayerService()
    service.joinRoom('room-1', 'Alice', vi.fn(), vi.fn())
    service.sendPlayAgain()
    const ws = MockWebSocket.instances[0]
    expect(ws.sentMessages).toHaveLength(1)
    expect(JSON.parse(ws.sentMessages[0])).toEqual({ type: 'play_again' })
  })

  it('does nothing when no WebSocket is open', () => {
    const service = new MultiplayerService()
    expect(() => service.sendPlayAgain()).not.toThrow()
  })
})

// ── sendHover ─────────────────────────────────────────────────────────────────
describe('MultiplayerService.sendHover', () => {
  it('sends a JSON hover message through the open WebSocket', () => {
    const service = new MultiplayerService()
    service.joinRoom('room-1', 'Alice', vi.fn(), vi.fn())
    service.sendHover(4)
    const ws = MockWebSocket.instances[0]
    expect(ws.sentMessages).toHaveLength(1)
    expect(JSON.parse(ws.sentMessages[0])).toEqual({ type: 'hover', cell: 4 })
  })

  it('does nothing when no WebSocket is open', () => {
    const service = new MultiplayerService()
    expect(() => service.sendHover(0)).not.toThrow()
  })
})

export {}
