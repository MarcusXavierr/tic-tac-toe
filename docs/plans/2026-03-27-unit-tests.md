# Unit Test Coverage Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Achieve full unit test coverage for all service, utility, and store logic so future refactors are caught immediately.

**Architecture:** Tests live in `src/tests/unit/` mirroring the source tree. Pure TypeScript logic (services, utils, store) is tested in isolation — no Vue component testing. The Vuex store is tested by creating a fresh store instance per test.

**Tech Stack:** Vitest, TypeScript, `@` path alias, Vuex 4, Vue 3

---

## Context: Current State

- **Existing tests:** `src/tests/unit/services/BoardService.test.ts` and `GameService.test.ts` — both use Vitest imports
- **Broken test script:** `package.json` has `"test": "jest"` but jest is NOT installed; only vitest is
- **Global type:** `MoveRecord` is declared globally in `src/env.d.ts` — vitest must include that file
- **Path alias:** `@` → `./src` defined in `vite.config.ts` — vitest must reuse it

---

## Task 1: Fix the Test Runner

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`
- Delete: `jest.config.ts` (unused, jest not installed)

**Step 1: Update `package.json` test script**

Change line 7 from `"test": "jest"` to:
```json
"test": "vitest run",
"test:watch": "vitest"
```

**Step 2: Add vitest config to `vite.config.ts`**

Replace the entire file with:
```typescript
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/tests/**/*.test.ts'],
    typecheck: {
      tsconfig: './tsconfig.json'
    }
  }
})
```

**Step 3: Run existing tests to confirm they pass**

```bash
npm test
```
Expected: All existing tests PASS (3 suites, 8 tests).

**Step 4: Delete the unused jest config**

```bash
rm jest.config.ts
```

**Step 5: Commit**

```bash
git add package.json vite.config.ts
git rm jest.config.ts
git commit -m "chore: switch test runner from jest to vitest"
```

---

## Task 2: Tests for `cleanHistory.ts`

**Files:**
- Create: `src/tests/unit/services/utils/cleanHistory.test.ts`

**Step 1: Write the failing tests**

Create `src/tests/unit/services/utils/cleanHistory.test.ts`:

```typescript
import { IconType } from '@/enums/IconTypes'
import { cleanHistory, rangeWithLeap, sortByPosition } from '@/services/utils/cleanHistory'
import { describe, it, expect } from 'vitest'

describe('cleanHistory', () => {
  it('returns empty array for empty history', () => {
    expect(cleanHistory(IconType.X, [])).toStrictEqual([])
  })

  it('filters to only the requested piece', () => {
    const history: MoveRecord[] = [
      { position: 1, piece: IconType.X },
      { position: 2, piece: IconType.O },
      { position: 3, piece: IconType.X },
    ]
    const result = cleanHistory(IconType.X, history)
    expect(result.every(r => r.piece === IconType.X)).toBe(true)
    expect(result).toHaveLength(2)
  })

  it('returns results sorted by position ascending', () => {
    const history: MoveRecord[] = [
      { position: 7, piece: IconType.O },
      { position: 2, piece: IconType.O },
      { position: 5, piece: IconType.O },
    ]
    const result = cleanHistory(IconType.O, history)
    expect(result.map(r => r.position)).toStrictEqual([2, 5, 7])
  })

  it('returns empty array when piece has no moves in history', () => {
    const history: MoveRecord[] = [
      { position: 1, piece: IconType.O },
      { position: 2, piece: IconType.O },
    ]
    expect(cleanHistory(IconType.X, history)).toStrictEqual([])
  })
})

describe('rangeWithLeap', () => {
  it('generates column 1 (1, 4, 7) with step 3', () => {
    expect(rangeWithLeap(1, 7, 3)).toStrictEqual([1, 4, 7])
  })

  it('generates column 2 (2, 5, 8) with step 3', () => {
    expect(rangeWithLeap(2, 8, 3)).toStrictEqual([2, 5, 8])
  })

  it('generates column 3 (3, 6, 9) with step 3', () => {
    expect(rangeWithLeap(3, 9, 3)).toStrictEqual([3, 6, 9])
  })

  it('generates single element when start equals end', () => {
    expect(rangeWithLeap(5, 5, 3)).toStrictEqual([5])
  })
})

describe('sortByPosition', () => {
  it('returns negative when first position is less', () => {
    const a: MoveRecord = { position: 2, piece: IconType.X }
    const b: MoveRecord = { position: 5, piece: IconType.X }
    expect(sortByPosition(a, b)).toBeLessThan(0)
  })

  it('returns positive when first position is greater', () => {
    const a: MoveRecord = { position: 8, piece: IconType.X }
    const b: MoveRecord = { position: 3, piece: IconType.X }
    expect(sortByPosition(a, b)).toBeGreaterThan(0)
  })

  it('returns 0 when positions are equal', () => {
    const a: MoveRecord = { position: 4, piece: IconType.X }
    const b: MoveRecord = { position: 4, piece: IconType.O }
    expect(sortByPosition(a, b)).toBe(0)
  })
})

export {}
```

**Step 2: Run to verify tests fail**

```bash
npm test -- src/tests/unit/services/utils/cleanHistory.test.ts
```
Expected: FAIL — module not found (file is new).

**Step 3: Run all tests (source already exists)**

```bash
npm test
```
Expected: New tests PASS immediately (source functions already exist).

**Step 4: Commit**

```bash
git add src/tests/unit/services/utils/cleanHistory.test.ts
git commit -m "test: add cleanHistory utility tests"
```

---

## Task 3: Tests for `player.ts`

**Files:**
- Create: `src/tests/unit/services/utils/player.test.ts`

**Step 1: Write the failing tests**

Create `src/tests/unit/services/utils/player.test.ts`:

```typescript
import { IconType } from '@/enums/IconTypes'
import { swapIconType } from '@/services/utils/player'
import { describe, it, expect } from 'vitest'

describe('swapIconType', () => {
  it('swaps X to O', () => {
    expect(swapIconType(IconType.X)).toBe(IconType.O)
  })

  it('swaps O to X', () => {
    expect(swapIconType(IconType.O)).toBe(IconType.X)
  })

  it('is its own inverse', () => {
    expect(swapIconType(swapIconType(IconType.X))).toBe(IconType.X)
    expect(swapIconType(swapIconType(IconType.O))).toBe(IconType.O)
  })
})

export {}
```

**Step 2: Run all tests**

```bash
npm test
```
Expected: All tests PASS.

**Step 3: Commit**

```bash
git add src/tests/unit/services/utils/player.test.ts
git commit -m "test: add swapIconType tests"
```

---

## Task 4: Tests for `IconService.ts`

**Files:**
- Create: `src/tests/unit/services/IconService.test.ts`

**Step 1: Write the failing tests**

Create `src/tests/unit/services/IconService.test.ts`:

```typescript
import { IconType } from '@/enums/IconTypes'
import { PlayerTypes } from '@/enums/Players'
import { getIconTypeFromPlayerTurn } from '@/services/IconService'
import { describe, it, expect } from 'vitest'

describe('getIconTypeFromPlayerTurn', () => {
  it('maps XPlayer to IconType.X', () => {
    expect(getIconTypeFromPlayerTurn(PlayerTypes.XPlayer)).toBe(IconType.X)
  })

  it('maps OPlayer to IconType.O', () => {
    expect(getIconTypeFromPlayerTurn(PlayerTypes.OPlayer)).toBe(IconType.O)
  })
})

export {}
```

**Step 2: Run all tests**

```bash
npm test
```
Expected: All tests PASS.

**Step 3: Commit**

```bash
git add src/tests/unit/services/IconService.test.ts
git commit -m "test: add IconService tests"
```

---

## Task 5: Tests for `ai.ts` (minimax)

**Files:**
- Create: `src/tests/unit/services/utils/ai.test.ts`

**About minimax:** The function scores a board position from the perspective of `piece` (the maximizer).
- Returns `1` if the maximizer wins
- Returns `-1` if the minimizer wins
- Returns `0` for a draw

The `isMaximizing` param reflects whether it's currently `piece`'s turn.

**Step 1: Write the failing tests**

Create `src/tests/unit/services/utils/ai.test.ts`:

```typescript
import { IconType } from '@/enums/IconTypes'
import { minimax } from '@/services/utils/ai'
import { describe, it, expect } from 'vitest'

describe('minimax', () => {
  it('returns 1 when maximizer (X) already won', () => {
    // X has already won — board is terminal, result found immediately
    const board: MoveRecord[] = [
      { position: 1, piece: IconType.X },
      { position: 2, piece: IconType.X },
      { position: 3, piece: IconType.X },
      { position: 4, piece: IconType.O },
      { position: 5, piece: IconType.O },
    ]
    // isMaximizing=false because it's O's turn, but X already won
    const score = minimax(board, 0, false, IconType.X, -Infinity, Infinity)
    expect(score).toBe(1)
  })

  it('returns -1 when minimizer (O) already won', () => {
    const board: MoveRecord[] = [
      { position: 7, piece: IconType.O },
      { position: 8, piece: IconType.O },
      { position: 9, piece: IconType.O },
      { position: 1, piece: IconType.X },
      { position: 2, piece: IconType.X },
    ]
    const score = minimax(board, 0, true, IconType.X, -Infinity, Infinity)
    expect(score).toBe(-1)
  })

  it('returns 0 for a draw (full board, no winner)', () => {
    // X: 1,3,6,7 / O: 2,4,5,8,9 — no winner
    const board: MoveRecord[] = [
      { position: 1, piece: IconType.X },
      { position: 2, piece: IconType.O },
      { position: 3, piece: IconType.X },
      { position: 4, piece: IconType.O },
      { position: 5, piece: IconType.O },
      { position: 6, piece: IconType.X },
      { position: 7, piece: IconType.X },
      { position: 8, piece: IconType.O },
      { position: 9, piece: IconType.O },
    ]
    const score = minimax(board, 0, true, IconType.X, -Infinity, Infinity)
    expect(score).toBe(0)
  })

  it('returns 1 when X can win in one move (isMaximizing)', () => {
    // X has 1,2 — next X move to 3 wins
    const board: MoveRecord[] = [
      { position: 1, piece: IconType.X },
      { position: 2, piece: IconType.X },
      { position: 4, piece: IconType.O },
      { position: 5, piece: IconType.O },
    ]
    const score = minimax(board, 0, true, IconType.X, -Infinity, Infinity)
    expect(score).toBe(1)
  })

  it('returns -1 when O can win in one move (isMaximizing=false, O is minimizer)', () => {
    // O has 7,8 — next O move to 9 wins, which is bad for X maximizer
    const board: MoveRecord[] = [
      { position: 7, piece: IconType.O },
      { position: 8, piece: IconType.O },
      { position: 1, piece: IconType.X },
      { position: 2, piece: IconType.X },
    ]
    const score = minimax(board, 0, false, IconType.X, -Infinity, Infinity)
    expect(score).toBe(-1)
  })
})

export {}
```

**Step 2: Run all tests**

```bash
npm test
```
Expected: All tests PASS.

**Step 3: Commit**

```bash
git add src/tests/unit/services/utils/ai.test.ts
git commit -m "test: add minimax algorithm tests"
```

---

## Task 6: Additional `BoardService.ts` edge cases

**Files:**
- Modify: `src/tests/unit/services/BoardService.test.ts`

**Step 1: Add edge case tests**

Append to the existing file (after the last `describe` block, before `export {}`):

```typescript
describe('generateBoard with winner path', () => {
  it('preserves belongsToWinnerPath flag from history', () => {
    const history: MoveRecord[] = [
      { position: 1, piece: IconType.X, belongsToWinnerPath: true },
      { position: 2, piece: IconType.X, belongsToWinnerPath: true },
      { position: 3, piece: IconType.X, belongsToWinnerPath: true },
    ]
    const board = generateBoard(history)
    expect(board[0].belongsToWinnerPath).toBe(true)
    expect(board[1].belongsToWinnerPath).toBe(true)
    expect(board[2].belongsToWinnerPath).toBe(true)
  })
})

describe('possibleMoves with full board', () => {
  it('returns empty array when board is full', () => {
    const history: MoveRecord[] = [1,2,3,4,5,6,7,8,9].map(p => ({
      position: p,
      piece: IconType.X
    }))
    expect(possibleMoves(history)).toStrictEqual([])
  })
})

describe('createBestMovement', () => {
  it('takes the winning move when available', () => {
    // X has 1,2 — best move is 3 to win horizontally
    const history: MoveRecord[] = [
      { position: 1, piece: IconType.X },
      { position: 2, piece: IconType.X },
      { position: 4, piece: IconType.O },
      { position: 5, piece: IconType.O },
    ]
    const result = createBestMovement(history, IconType.X)
    expect(result.position).toBe(3)
    expect(result.piece).toBe(IconType.X)
  })

  it('blocks opponent win', () => {
    // O has 7,8 — X must block at 9
    const history: MoveRecord[] = [
      { position: 7, piece: IconType.O },
      { position: 8, piece: IconType.O },
      { position: 1, piece: IconType.X },
    ]
    const result = createBestMovement(history, IconType.X)
    expect(result.position).toBe(9)
  })
})
```

Also add `createBestMovement` to the import on line 2:
```typescript
import { createBestMovement, createRandomMovement, generateBoard, possibleMoves } from "@/services/BoardService"
```

**Step 2: Run all tests**

```bash
npm test
```
Expected: All tests PASS.

**Step 3: Commit**

```bash
git add src/tests/unit/services/BoardService.test.ts
git commit -m "test: add BoardService edge cases and createBestMovement tests"
```

---

## Task 7: Additional `GameService.ts` edge cases

**Files:**
- Modify: `src/tests/unit/services/GameService.test.ts`

**Step 1: Add missing test cases**

Append after the last `describe` block in `GameService.test.ts`, before `export {}`:

```typescript
describe('determineWinner — draw / edge cases', () => {
  it('returns null for full board with no winner (draw)', () => {
    // X: 1,3,6,7 / O: 2,4,5,8,9 — no winner
    const history: MoveRecord[] = [
      { piece: IconType.X, position: 1 },
      { piece: IconType.O, position: 2 },
      { piece: IconType.X, position: 3 },
      { piece: IconType.O, position: 4 },
      { piece: IconType.O, position: 5 },
      { piece: IconType.X, position: 6 },
      { piece: IconType.X, position: 7 },
      { piece: IconType.O, position: 8 },
      { piece: IconType.O, position: 9 },
    ]
    expect(determineWinner(history)).toBeNull()
  })

  it('returns null when only 2 of 3 positions in a line are filled', () => {
    const history: MoveRecord[] = [
      { piece: IconType.X, position: 1 },
      { piece: IconType.X, position: 2 },
    ]
    expect(determineWinner(history)).toBeNull()
  })
})

describe('mapWinner', () => {
  it('returns history with winner path marked', () => {
    const history: MoveRecord[] = [
      { piece: IconType.X, position: 1 },
      { piece: IconType.X, position: 2 },
      { piece: IconType.X, position: 3 },
      { piece: IconType.O, position: 4 },
      { piece: IconType.O, position: 5 },
    ]
    const result = mapWinner(IconType.X, history)
    const winners = result.filter(r => r.belongsToWinnerPath === true)
    expect(winners.map(r => r.position)).toStrictEqual([1, 2, 3])
  })

  it('returns empty path when piece has no winning line', () => {
    const history: MoveRecord[] = [
      { piece: IconType.X, position: 1 },
      { piece: IconType.X, position: 2 },
    ]
    const result = mapWinner(IconType.X, history)
    expect(result.every(r => r.belongsToWinnerPath === false)).toBe(true)
  })
})
```

Also add `mapWinner` to the import on line 3:
```typescript
import { determineWinner, findWinnerPath, mapWinner, markWinnerPath } from '../../../services/GameService'
```

**Step 2: Run all tests**

```bash
npm test
```
Expected: All tests PASS.

**Step 3: Commit**

```bash
git add src/tests/unit/services/GameService.test.ts
git commit -m "test: add GameService edge cases and mapWinner tests"
```

---

## Task 8: Vuex Store — Mutations Tests

**Files:**
- Create: `src/tests/unit/store/mutations.test.ts`

**Important:** The store uses `store.commit('restartGame')` inside `quitGame` and `nextRound` mutations — this means those mutations call the *shared* store instance, not the local `state` parameter. Test these by calling `store.commit(...)` directly, not by testing `state` after calling the mutation function.

**Step 1: Write the failing tests**

Create `src/tests/unit/store/mutations.test.ts`:

```typescript
import { Players, PlayerTypes } from '@/enums/Players'
import { store } from '@/store/index'
import { describe, it, expect, beforeEach } from 'vitest'

// Reset store before each test by quitting any active game
beforeEach(() => {
  store.commit('quitGame')
})

function activateHumanVsHuman() {
  store.commit('activateGame', {
    XPlayer: Players.playerOne,
    OPlayer: Players.playerTwo,
    oponentIsAI: false
  })
}

describe('activateGame', () => {
  it('sets isGameActive to true', () => {
    activateHumanVsHuman()
    expect(store.state.isGameActive).toBe(true)
  })

  it('assigns player values', () => {
    activateHumanVsHuman()
    expect(store.state.XPlayer).toBe(Players.playerOne)
    expect(store.state.OPlayer).toBe(Players.playerTwo)
  })

  it('sets currentPlayerType to XPlayer at start', () => {
    activateHumanVsHuman()
    expect(store.state.currentPlayerType).toBe(PlayerTypes.XPlayer)
  })

  it('does not set isWaitingToPlay for human vs human', () => {
    activateHumanVsHuman()
    expect(store.state.isWaitingToPlay).toBe(false)
  })

  it('sets isWaitingToPlay when AI is player one (XPlayer)', () => {
    // AI plays as player 2 means human is player 1 (X), AI is O — no wait
    // AI plays as player 1 means AI is X — human waits for AI first move
    store.commit('activateGame', {
      XPlayer: Players.playerTwo, // AI is player two, assigned X role
      OPlayer: Players.playerOne,
      oponentIsAI: true
    })
    expect(store.state.isWaitingToPlay).toBe(true)
  })
})

describe('addPlayToHistory', () => {
  it('appends move to playHistory', () => {
    activateHumanVsHuman()
    store.commit('addPlayToHistory', { position: 5, piece: 0 })
    expect(store.state.playHistory).toHaveLength(1)
    expect(store.state.playHistory[0].position).toBe(5)
  })

  it('swaps currentPlayerType after each move', () => {
    activateHumanVsHuman()
    expect(store.state.currentPlayerType).toBe(PlayerTypes.XPlayer)
    store.commit('addPlayToHistory', { position: 1, piece: 0 })
    expect(store.state.currentPlayerType).toBe(PlayerTypes.OPlayer)
    store.commit('addPlayToHistory', { position: 2, piece: 1 })
    expect(store.state.currentPlayerType).toBe(PlayerTypes.XPlayer)
  })

  it('sets isWaitingToPlay to false', () => {
    activateHumanVsHuman()
    store.commit('makePlayersWait')
    store.commit('addPlayToHistory', { position: 3, piece: 0 })
    expect(store.state.isWaitingToPlay).toBe(false)
  })
})

describe('restartGame', () => {
  it('clears playHistory', () => {
    activateHumanVsHuman()
    store.commit('addPlayToHistory', { position: 1, piece: 0 })
    store.commit('restartGame')
    expect(store.state.playHistory).toStrictEqual([])
  })

  it('resets currentPlayerType to XPlayer', () => {
    activateHumanVsHuman()
    store.commit('addPlayToHistory', { position: 1, piece: 0 }) // now OPlayer
    store.commit('restartGame')
    expect(store.state.currentPlayerType).toBe(PlayerTypes.XPlayer)
  })
})

describe('nextRound', () => {
  it('records game result in gameResults', () => {
    activateHumanVsHuman()
    store.commit('nextRound')
    expect(store.state.gameResults).toHaveLength(1)
  })

  it('clears playHistory for next round', () => {
    activateHumanVsHuman()
    store.commit('addPlayToHistory', { position: 1, piece: 0 })
    store.commit('nextRound')
    expect(store.state.playHistory).toStrictEqual([])
  })
})

describe('quitGame', () => {
  it('sets isGameActive to false', () => {
    activateHumanVsHuman()
    store.commit('quitGame')
    expect(store.state.isGameActive).toBe(false)
  })

  it('clears gameResults', () => {
    activateHumanVsHuman()
    store.commit('nextRound')
    store.commit('quitGame')
    expect(store.state.gameResults).toStrictEqual([])
  })
})

describe('makePlayersWait / finishWaiting / allowUserToPlay', () => {
  it('makePlayersWait sets isWaitingToPlay to true', () => {
    activateHumanVsHuman()
    store.commit('makePlayersWait')
    expect(store.state.isWaitingToPlay).toBe(true)
  })

  it('finishWaiting sets isWaitingToPlay to false', () => {
    activateHumanVsHuman()
    store.commit('makePlayersWait')
    store.commit('finishWaiting')
    expect(store.state.isWaitingToPlay).toBe(false)
  })

  it('allowUserToPlay sets isWaitingToPlay to false', () => {
    activateHumanVsHuman()
    store.commit('makePlayersWait')
    store.commit('allowUserToPlay')
    expect(store.state.isWaitingToPlay).toBe(false)
  })
})

describe('addWinnerPathToHistory', () => {
  it('replaces playHistory with marked history', () => {
    activateHumanVsHuman()
    store.commit('addPlayToHistory', { position: 1, piece: 0 })
    const marked = [{ position: 1, piece: 0, belongsToWinnerPath: true }]
    store.commit('addWinnerPathToHistory', marked)
    expect(store.state.playHistory).toStrictEqual(marked)
  })
})

export {}
```

**Step 2: Run all tests**

```bash
npm test
```
Expected: All tests PASS.

**Step 3: Commit**

```bash
git add src/tests/unit/store/mutations.test.ts
git commit -m "test: add Vuex store mutation tests"
```

---

## Task 9: Vuex Store — Getters Tests

**Files:**
- Create: `src/tests/unit/store/getters.test.ts`

**Step 1: Write the failing tests**

Create `src/tests/unit/store/getters.test.ts`:

```typescript
import { Players, PlayerTypes } from '@/enums/Players'
import { store } from '@/store/index'
import { describe, it, expect, beforeEach } from 'vitest'

beforeEach(() => {
  store.commit('quitGame')
  store.commit('activateGame', {
    XPlayer: Players.playerOne,
    OPlayer: Players.playerTwo,
    oponentIsAI: false
  })
})

describe('getPlayer getter', () => {
  it('returns the correct player for XPlayer type', () => {
    const player = store.getters.getPlayer(PlayerTypes.XPlayer)
    expect(player).toBe(Players.playerOne)
  })

  it('returns the correct player for OPlayer type', () => {
    const player = store.getters.getPlayer(PlayerTypes.OPlayer)
    expect(player).toBe(Players.playerTwo)
  })
})

export {}
```

**Step 2: Run all tests**

```bash
npm test
```
Expected: All tests PASS.

**Step 3: Commit**

```bash
git add src/tests/unit/store/getters.test.ts
git commit -m "test: add Vuex store getter tests"
```

---

## Final Verification

**Step 1: Run the full test suite**

```bash
npm test
```

Expected output: All test suites pass. You should see approximately:
- `src/tests/unit/services/BoardService.test.ts` — 6+ tests
- `src/tests/unit/services/GameService.test.ts` — 15+ tests
- `src/tests/unit/services/IconService.test.ts` — 2 tests
- `src/tests/unit/services/utils/ai.test.ts` — 5 tests
- `src/tests/unit/services/utils/cleanHistory.test.ts` — 8 tests
- `src/tests/unit/services/utils/player.test.ts` — 3 tests
- `src/tests/unit/store/mutations.test.ts` — 14 tests
- `src/tests/unit/store/getters.test.ts` — 2 tests

**Step 2: Final commit**

```bash
git commit --allow-empty -m "test: complete unit test coverage for all services and store"
```
