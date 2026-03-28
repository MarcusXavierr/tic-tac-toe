# Multiplayer Phase 2: Service & Store Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add `MultiplayerService` (HTTP + WebSocket) and all new Vuex state/mutations needed for online multiplayer, with full unit test coverage.

**Architecture:** `MultiplayerService` owns the raw WebSocket instance as a private field and exposes four methods; it never touches Vuex directly, passing incoming messages to an `onMessage` callback supplied by the caller. New multiplayer state fields are added to the Vuex store alongside two new mutations (`setMultiplayerState`, `clearMultiplayerState`) and an update to `activateGame` to accept an `isMultiplayer` flag.

**Tech Stack:** Vue 3 Options API, TypeScript, Vuex 4, Vitest, native `fetch` + `WebSocket`

---

## Task 1: Update environment and TypeScript interfaces

**Files:**
- Edit: `.env`
- Edit: `env.d.ts`

---

### Step 1: Write a failing test that imports `VITE_API_BASE`

Create `src/tests/unit/services/MultiplayerService.test.ts` with just an env sanity check so we can see it fail before the env is updated:

```typescript
// src/tests/unit/services/MultiplayerService.test.ts
import { describe, it, expect } from 'vitest'

describe('VITE_API_BASE env var', () => {
  it('is defined', () => {
    expect(import.meta.env.VITE_API_BASE).toBeDefined()
  })
})
```

Run and confirm it fails:

```bash
cd /home/marcus/Projects/tic-tac-toe && npx vitest run src/tests/unit/services/MultiplayerService.test.ts
```

Expected output contains:
```
FAIL src/tests/unit/services/MultiplayerService.test.ts
```

---

### Step 2: Replace `.env` contents

Replace the four existing vars with a single base URL:

```
VITE_API_BASE=http://192.168.3.141:8080
```

Full new `.env`:

```
VITE_API_BASE=http://192.168.3.141:8080
```

---

### Step 3: Update `env.d.ts`

Replace the entire file with updated `ImportMetaEnv` (adding `VITE_API_BASE`) and updated `State` interface (adding all multiplayer fields):

```typescript
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
}

interface ImportMetaEnv {
  readonly VITE_API_BASE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

---

### Step 4: Run the env test — verify it passes

```bash
cd /home/marcus/Projects/tic-tac-toe && npx vitest run src/tests/unit/services/MultiplayerService.test.ts
```

Expected output contains:
```
PASS src/tests/unit/services/MultiplayerService.test.ts
```

---

### Step 5: Commit

```bash
cd /home/marcus/Projects/tic-tac-toe && git add .env env.d.ts src/tests/unit/services/MultiplayerService.test.ts && git commit -m "chore: replace env vars with VITE_API_BASE, extend State and ImportMetaEnv interfaces"
```

---

## Task 2: Add multiplayer state and mutations to Vuex store

**Files:**
- Edit: `src/store/index.ts`
- Edit: `src/tests/unit/store/mutations.test.ts`

---

### Step 1: Write failing tests for new mutations

Append the following `describe` blocks to `src/tests/unit/store/mutations.test.ts` (before the final `export {}`):

```typescript
describe('activateGame with isMultiplayer flag', () => {
  it('sets isMultiplayer to true when flag is passed', () => {
    store.commit('activateGame', {
      XPlayer: Players.playerOne,
      OPlayer: Players.playerTwo,
      oponentIsAI: false,
      isMultiplayer: true
    })
    expect(store.state.isMultiplayer).toBe(true)
  })

  it('defaults isMultiplayer to false when flag is absent', () => {
    store.commit('activateGame', {
      XPlayer: Players.playerOne,
      OPlayer: Players.playerTwo,
      oponentIsAI: false
    })
    expect(store.state.isMultiplayer).toBe(false)
  })
})

describe('setMultiplayerState', () => {
  it('sets all multiplayer fields from payload', () => {
    store.commit('setMultiplayerState', {
      myPlayerType: PlayerTypes.XPlayer,
      opponentName: 'Alice',
      roomName: 'room-42',
      isWaitingForOpponent: false,
      isConnected: true
    })
    expect(store.state.myPlayerType).toBe(PlayerTypes.XPlayer)
    expect(store.state.opponentName).toBe('Alice')
    expect(store.state.roomName).toBe('room-42')
    expect(store.state.isWaitingForOpponent).toBe(false)
    expect(store.state.isConnected).toBe(true)
  })

  it('sets isWaitingForOpponent to true while waiting', () => {
    store.commit('setMultiplayerState', {
      myPlayerType: null,
      opponentName: '',
      roomName: 'lobby-1',
      isWaitingForOpponent: true,
      isConnected: true
    })
    expect(store.state.isWaitingForOpponent).toBe(true)
  })
})

describe('clearMultiplayerState', () => {
  it('resets all multiplayer fields to defaults', () => {
    store.commit('setMultiplayerState', {
      myPlayerType: PlayerTypes.OPlayer,
      opponentName: 'Bob',
      roomName: 'room-99',
      isWaitingForOpponent: false,
      isConnected: true
    })
    store.commit('clearMultiplayerState')
    expect(store.state.isMultiplayer).toBe(false)
    expect(store.state.myPlayerType).toBeNull()
    expect(store.state.opponentName).toBe('')
    expect(store.state.roomName).toBe('')
    expect(store.state.isWaitingForOpponent).toBe(false)
    expect(store.state.isConnected).toBe(false)
    expect(store.state.opponentDisconnected).toBe(false)
  })
})

describe('opponentDisconnected flag', () => {
  it('setMultiplayerState can set opponentDisconnected', () => {
    store.commit('setMultiplayerState', {
      myPlayerType: null,
      opponentName: '',
      roomName: '',
      isWaitingForOpponent: false,
      isConnected: false,
      opponentDisconnected: true
    })
    expect(store.state.opponentDisconnected).toBe(true)
  })

  it('clearMultiplayerState resets opponentDisconnected to false', () => {
    store.commit('clearMultiplayerState')
    expect(store.state.opponentDisconnected).toBe(false)
  })
})
```

Run and confirm failures:

```bash
cd /home/marcus/Projects/tic-tac-toe && npx vitest run src/tests/unit/store/mutations.test.ts
```

Expected: several tests fail with `TypeError` or property-not-found errors.

---

### Step 2: Update `src/store/index.ts`

Replace the file with the updated store that includes new state, updated `activateGame`, and two new mutations. Full replacement:

```typescript
import { determineWinner } from '@/services/GameService'
import { createStore } from 'vuex'
import { Players, PlayerTypes } from '../enums/Players'

interface activateData {
  XPlayer: Players,
  OPlayer: Players,
  oponentIsAI: boolean,
  isMultiplayer?: boolean
}

interface MultiplayerPayload {
  myPlayerType: PlayerTypes | null,
  opponentName: string,
  roomName: string,
  isWaitingForOpponent: boolean,
  isConnected: boolean,
  opponentDisconnected?: boolean
}

export const store = createStore<State>({
  state() {
    return {
      oponentIsAI: false,
      isWaitingToPlay: false,
      isGameActive: false,
      XPlayer: null,
      OPlayer: null,
      playHistory: [],
      gameResults: [],
      // multiplayer
      isMultiplayer: false,
      myPlayerType: null,
      opponentName: '',
      roomName: '',
      isWaitingForOpponent: false,
      isConnected: false,
      opponentDisconnected: false,
    }
  },
  mutations: {
    activateGame(state, data: activateData) {
      state.OPlayer = data.OPlayer
      state.XPlayer = data.XPlayer
      state.currentPlayerType = PlayerTypes.XPlayer
      state.oponentIsAI = data.oponentIsAI
      state.isMultiplayer = data.isMultiplayer ?? false
      state.isWaitingToPlay = data.oponentIsAI && data.XPlayer == Players.playerTwo
      state.isGameActive = true
    },
    addPlayToHistory(state, data: MoveRecord) {
      state.playHistory = state.playHistory.concat(data)
      state.currentPlayerType = swapPlayerTypes(state.currentPlayerType)
      state.isWaitingToPlay = false
    },
    addAsyncPlayToHistory(state, data: MoveRecord) {
      state.playHistory = state.playHistory.concat(data)
      state.currentPlayerType = swapPlayerTypes(state.currentPlayerType)
      state.isWaitingToPlay = true
    },
    allowUserToPlay(state) {
      state.isWaitingToPlay = false
    },
    restartGame(state) {
      state.playHistory = []
      state.currentPlayerType = PlayerTypes.XPlayer
      state.isWaitingToPlay = state.oponentIsAI && state.XPlayer == Players.playerTwo
    },
    quitGame(state) {
      state.isGameActive = false
      state.gameResults = []
      store.commit('restartGame')
    },
    nextRound(state) {
      const winner = determineWinner(state.playHistory)
      state.gameResults = state.gameResults.concat({ winner })
      store.commit('restartGame')
    },
    makePlayersWait(state) {
      state.isWaitingToPlay = true
    },
    finishWaiting(state) {
      state.isWaitingToPlay = false
    },
    addWinnerPathToHistory(state, history) {
      state.playHistory = history
    },
    setMultiplayerState(state, payload: MultiplayerPayload) {
      state.myPlayerType = payload.myPlayerType
      state.opponentName = payload.opponentName
      state.roomName = payload.roomName
      state.isWaitingForOpponent = payload.isWaitingForOpponent
      state.isConnected = payload.isConnected
      if (payload.opponentDisconnected !== undefined) {
        state.opponentDisconnected = payload.opponentDisconnected
      }
    },
    clearMultiplayerState(state) {
      state.isMultiplayer = false
      state.myPlayerType = null
      state.opponentName = ''
      state.roomName = ''
      state.isWaitingForOpponent = false
      state.isConnected = false
      state.opponentDisconnected = false
    },
  },
  getters: {
    getPlayer: (state) => (player: PlayerTypes) => {
      if (player == PlayerTypes.OPlayer) {
        return state.OPlayer
      }
      return state.XPlayer
    }
  }
})

function swapPlayerTypes(currentPlayerType?: number) {
  if (currentPlayerType == PlayerTypes.XPlayer) {
    return PlayerTypes.OPlayer
  }
  return PlayerTypes.XPlayer
}
```

---

### Step 3: Run all store tests — verify all pass

```bash
cd /home/marcus/Projects/tic-tac-toe && npx vitest run src/tests/unit/store/
```

Expected output contains:
```
PASS src/tests/unit/store/mutations.test.ts
PASS src/tests/unit/store/getters.test.ts
```

---

### Step 4: Commit

```bash
cd /home/marcus/Projects/tic-tac-toe && git add src/store/index.ts src/tests/unit/store/mutations.test.ts && git commit -m "feat: add multiplayer state fields and setMultiplayerState/clearMultiplayerState mutations"
```

---

## Task 3: Implement `MultiplayerService`

**Files:**
- Create: `src/services/MultiplayerService.ts`
- Edit: `src/tests/unit/services/MultiplayerService.test.ts`

The service must:
- `createRoom(roomId)` — POST to `${VITE_API_BASE}/room/{roomId}`
- `joinRoom(roomId, playerName, onMessage, onClose)` — open `WebSocket` to `${VITE_API_BASE_AS_WS}/room/{roomId}/join?name={playerName}` (swap `http://` → `ws://` and `https://` → `wss://`)
- `sendMove(cell)` — send `JSON.stringify({ type: 'move', cell })` on the open WS
- `disconnect()` — close the WS if it exists

---

### Step 1: Write failing tests for `MultiplayerService`

Replace `src/tests/unit/services/MultiplayerService.test.ts` with the full test suite:

```typescript
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
  vi.stubGlobal('WebSocket', MockWebSocket)
  vi.stubGlobal('fetch', vi.fn(() =>
    Promise.resolve({ ok: true } as Response)
  ))
})

afterEach(() => {
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
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ ok: false, status: 409 } as Response)
    ))
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
    const ws = MockWebSocket.instances[0]
    // Patch onclose to null before close (service should do this)
    service.disconnect()
    // onClose should NOT fire on intentional disconnect
    expect(onClose).not.toHaveBeenCalled()
  })
})

export {}
```

Run and confirm failures:

```bash
cd /home/marcus/Projects/tic-tac-toe && npx vitest run src/tests/unit/services/MultiplayerService.test.ts
```

Expected output contains:
```
FAIL src/tests/unit/services/MultiplayerService.test.ts
```

(Module not found or similar — `MultiplayerService` does not exist yet.)

---

### Step 2: Implement `src/services/MultiplayerService.ts`

```typescript
import type { PlayerTypes } from '@/enums/Players'

export type ServerMessage =
  | { type: 'player_joined'; name: string; player_type: 'x' | 'o'; order: number }
  | { type: 'player_disconnected' }
  | { type: 'move'; cell: number }

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
    onClose: () => void
  ): void {
    const base = toWsUrl(import.meta.env.VITE_API_BASE)
    const url = `${base}/room/${roomId}/join?name=${encodeURIComponent(playerName)}`
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

  disconnect(): void {
    if (!this.ws) return
    this.ws.onclose = null // suppress onClose for intentional disconnect
    this.ws.close()
    this.ws = null
  }
}
```

---

### Step 3: Run the service tests — verify all pass

```bash
cd /home/marcus/Projects/tic-tac-toe && npx vitest run src/tests/unit/services/MultiplayerService.test.ts
```

Expected output contains:
```
PASS src/tests/unit/services/MultiplayerService.test.ts
```

All tests in the file should be green.

---

### Step 4: Run the full test suite — verify nothing regressed

```bash
cd /home/marcus/Projects/tic-tac-toe && npx vitest run
```

Expected output: all test files pass, 0 failures.

---

### Step 5: Commit

```bash
cd /home/marcus/Projects/tic-tac-toe && git add src/services/MultiplayerService.ts src/tests/unit/services/MultiplayerService.test.ts && git commit -m "feat: add MultiplayerService with createRoom, joinRoom, sendMove, disconnect"
```

---

## Final check

Run the complete suite one more time to confirm everything is green:

```bash
cd /home/marcus/Projects/tic-tac-toe && npx vitest run
```

Expected: all suites pass.
