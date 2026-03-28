# Multiplayer Support Design

## Overview

Add online multiplayer to the tic-tac-toe game. Players can create or join rooms via WebSocket and play against each other in real time. The server relays moves without validation — the client handles all game logic.

## API Summary

- **POST `/room/{id}`** — Create a room
- **WS `/room/{id}/join?name={name}`** — Join a room (player_type is optional, backend auto-assigns)
- **Server messages:** `player_joined`, `move`, `player_disconnected`
- **Client messages:** `move`

Backend change required: make `player_type` optional on join — server assigns the opposite of the room creator's type.

## State & Data Model

New store state:

| Field                  | Type         | Description                                      |
|------------------------|--------------|--------------------------------------------------|
| `isMultiplayer`        | boolean      | True when in an online game                      |
| `myPlayerType`         | PlayerTypes  | X or O, inferred from opponent's player_joined   |
| `opponentName`         | string       | Display name from player_joined                  |
| `roomName`             | string       | Current room ID                                  |
| `isConnected`          | boolean      | WebSocket connection active                      |
| `isWaitingForOpponent` | boolean      | True after joining, before player_joined arrives  |

Existing `isWaitingToPlay` is reused to block clicks when it's the opponent's turn. `oponentIsAI` stays for CPU games. They are mutually exclusive with `isMultiplayer`.

The WebSocket instance lives in the service layer, not in Vuex (reactive proxies break WS objects).

## WebSocket Service

`MultiplayerService` holds the WS connection and exposes:

- **`createRoom(roomId)`** — POST `/room/{roomId}`
- **`joinRoom(roomId, playerName)`** — Opens WS to `/room/{roomId}/join?name={playerName}`
- **`sendMove(cell)`** — Sends `{ type: "move", cell }` through the WS
- **`disconnect()`** — Closes the WS connection

Incoming messages commit directly to the store:

- `player_joined` — Sets opponent info, infers own type, starts game
- `move` — Adds opponent's move to history via `addPlayToHistory`
- `player_disconnected` — Triggers disconnection modal flow

## Modal Flow

The "VS Player" button opens a `MultiplayerModal` with two views:

**Create Room:**
- Player name input
- Room name input
- X/O selector (reuses existing `PlayerSelector`)
- "Create" button: POST create, then WS join, switch to waiting state

**Join Room:**
- Player name input
- Room name input
- "Join" button: WS join, switch to waiting state

**Waiting state:**
- "Waiting for opponent..." with spinner, cancel button
- Cancel: disconnect, back to create/join view
- On `player_joined`: close modal, activate game

## Gameplay Wiring

**Your turn (click a cell):**
1. `GameBoard.checkCell()` blocks if `isWaitingToPlay` (existing behavior)
2. If `isMultiplayer`, also call `service.sendMove(cell)` with cell index 0-8
3. Set `isWaitingToPlay = true`

**Opponent's turn (incoming `move` message):**
1. Service commits move to store via `addPlayToHistory` with opponent's piece
2. Sets `isWaitingToPlay = false`

**Who goes first:**
- X always goes first
- If you're X: `isWaitingToPlay = false` at game start
- If you're O: `isWaitingToPlay = true`, wait for first move

**Win/tie detection:** Unchanged, fully client-side.

**Opponent disconnects:** Show "Opponent disconnected" modal, button returns to home.

**You leave (quit/logo click):** Existing `quitGame` also calls `service.disconnect()`.

## Implementation Phases

### Phase 1 — MultiplayerModal
- New `MultiplayerModal` component with create/join views and waiting state
- Wire "VS Player" button to open modal instead of directly starting game
- Reuse `PlayerSelector` for create flow
- UI only, no backend calls

### Phase 2 — Service & Store
- New `MultiplayerService` with createRoom, joinRoom, sendMove, disconnect
- New store state and mutations for multiplayer
- Update `.env` to single `VITE_API_BASE` url
- Unit tests for service and store mutations

### Phase 3 — Gameplay Wiring
- GameBoard sends moves via service when `isMultiplayer`
- Incoming moves commit to store with opponent's piece
- Turn management via `isWaitingToPlay` based on X/O assignment
- Disconnect handling both directions
- Activate game from modal on `player_joined`
