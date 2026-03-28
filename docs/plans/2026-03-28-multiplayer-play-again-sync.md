# Multiplayer "Play Again" Sync Design

**Date:** 2026-03-28
**Status:** Approved

## Problem

Two bugs when clicking "Next Round" in multiplayer:

1. **Mirrored boards** — each client shows opposite pieces (X sees X winning, O sees O winning for the same game)
2. **No round sync** — "Next Round" resets locally with no coordination, so both clients can desync on whose turn it is and what piece they're playing

Root cause: there is zero WebSocket communication when starting a new round. Each client independently resets, leading to state divergence.

## Design

### New WebSocket Message

```json
{ "type": "play_again" }
```

Relayed by the server like `move` — no backend changes needed.

### New Store State

```typescript
playAgainSent: boolean      // I clicked "Next Round"
playAgainReceived: boolean  // Opponent sent play_again
```

### Handshake Protocol

```
Player A (X)                Server              Player B (O)
   |                          |                      |
   |  [both see game over modal]                     |
   |                          |                      |
   | clicks "Next Round"      |                      |
   | sends play_again ------->|----> play_again ---->|
   | button -> "Waiting..."   |                      |
   |                          |     playAgainReceived = true
   |                          |                      |
   |                          |      clicks "Next Round"
   |<---- play_again ---------|<---- play_again -----|
   | playAgainReceived = true |                      |
   |                          |                      |
   | BOTH flags true:         |     BOTH flags true: |
   | -> reset board           |     -> reset board   |
   | -> currentPlayerType = X |     -> currentPlayerType = X
   | -> isWaitingToPlay=false |     -> isWaitingToPlay=true
   | -> clear both flags      |     -> clear both flags
```

Reset only fires when `playAgainSent && playAgainReceived` are both `true`.

### Roles

Same roles every round. The creator's original choice persists for the entire session. X always goes first.

### Race Conditions

- **Simultaneous clicks**: Both send `play_again` at the same time. Each sets `playAgainSent = true`, then receives opponent's message and sets `playAgainReceived = true`. The `both true` check fires exactly once on each client. Works correctly.
- **Double-click guard**: `sendPlayAgain` mutation returns early if `playAgainSent` is already `true`. The button is also disabled after first click.
- **Reset idempotency**: `resetRound` clears both flags, so a second check sees `false && false` and skips.

### Quit During Handshake

If one player clicks "Quit" while the other clicked "Next Round", the quitter disconnects the WebSocket. The waiting player receives `player_disconnected` and sees the disconnect modal. No special handling needed.

## Implementation Changes

### Store (`store/index.ts`)
- Add `playAgainSent` and `playAgainReceived` to state (both `false`)
- New mutation `sendPlayAgain` — sets `playAgainSent = true`, guards against double-call
- New mutation `receivePlayAgain` — sets `playAgainReceived = true`
- New mutation `resetRound` — clears board, resets `currentPlayerType = XPlayer`, sets `isWaitingToPlay` based on `myPlayerType`, resets both flags to `false`
- Both `sendPlayAgain` and `receivePlayAgain` check: if both flags true, commit `resetRound`

### MultiplayerService (`services/MultiplayerService.ts`)
- Add `play_again` to `ServerMessage` union type
- Add `sendPlayAgain()` method

### Home Page (`views/Home/index.vue`)
- Handle `play_again` message in `_handleServerMessage` -> `commit('receivePlayAgain')`

### Game Page (`views/Game/index.vue`)
- "Next Round" click -> `commit('sendPlayAgain')` + `multiplayerService.sendPlayAgain()`
- Button disabled + "Waiting for opponent..." when `playAgainSent && !playAgainReceived`

### GameOverModal (`components/GameOverModal.vue`)
- Accept `waiting` prop to show waiting state on the "Next Round" button

### Tests
- Handshake flow: A clicks first, then B -> both reset correctly
- Simultaneous clicks: both send at same time -> both reset correctly
- Double-click guard: second click is no-op
- Role preservation: same player types after reset
- Turn order: X goes first after reset, O waits
- Quit during handshake: disconnect handled correctly
