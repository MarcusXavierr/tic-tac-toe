# Play-Again Sync Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the multiplayer "Next Round" flow so both clients coordinate via a `play_again` WebSocket handshake before resetting the board — eliminating the mirrored-board bug and the desync on turn order.

**Architecture:** A new `play_again` message is relayed by the server (no backend changes). The store tracks two boolean flags (`playAgainSent`, `playAgainReceived`); when both are true, `resetRound` fires. The Game page watches `playAgainSent` going back to false to close the modal. For non-multiplayer games, the existing `nextRound` flow is unchanged.

**Tech Stack:** Vue 3 Options API, Vuex, Vitest, @vue/test-utils, TypeScript

---

### Task 1: Add `sendPlayAgain` to MultiplayerService

**Files:**
- Modify: `src/services/MultiplayerService.ts`
- Test: `src/tests/unit/services/MultiplayerService.test.ts`

**Step 1: Write the failing tests**

Add to `src/tests/unit/services/MultiplayerService.test.ts` inside a new `describe` block at the bottom (before the `export {}`):

```typescript
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
```

Also update the existing `player_joined` message test to confirm `play_again` parses correctly — add inside the `joinRoom` describe:

```typescript
  it('calls onMessage callback with parsed play_again message', () => {
    const onMessage = vi.fn()
    const service = new MultiplayerService()
    service.joinRoom('room-1', 'Alice', onMessage, vi.fn())
    const ws = MockWebSocket.instances[0]
    ws.simulateMessage({ type: 'play_again' })
    expect(onMessage).toHaveBeenCalledWith({ type: 'play_again' })
  })
```

**Step 2: Run tests to verify they fail**

```bash
cd /home/marcus/Projects/tic-tac-toe
npx vitest run src/tests/unit/services/MultiplayerService.test.ts
```

Expected: FAIL — `service.sendPlayAgain is not a function`

**Step 3: Implement**

In `src/services/MultiplayerService.ts`:

1. Add `play_again` to the `ServerMessage` union type:

```typescript
export type ServerMessage =
  | { type: 'player_joined'; name: string; player_type: 'x' | 'o'; order: number }
  | { type: 'player_disconnected' }
  | { type: 'move'; cell: number }
  | { type: 'play_again' }
```

2. Add the `sendPlayAgain` method after `sendMove`:

```typescript
  sendPlayAgain(): void {
    if (!this.ws) return
    this.ws.send(JSON.stringify({ type: 'play_again' }))
  }
```

**Step 4: Run tests to verify they pass**

```bash
npx vitest run src/tests/unit/services/MultiplayerService.test.ts
```

Expected: all PASS

**Step 5: Commit**

```bash
git add src/services/MultiplayerService.ts src/tests/unit/services/MultiplayerService.test.ts
git commit -m "feat: add play_again message type and sendPlayAgain to MultiplayerService"
```

---

### Task 2: Add play-again flags and mutations to the store

**Files:**
- Modify: `env.d.ts`
- Modify: `src/store/index.ts`
- Test: `src/tests/unit/store/mutations.test.ts`

**Step 1: Write the failing tests**

Add to `src/tests/unit/store/mutations.test.ts` (before the `export {}`):

```typescript
// ── helpers ───────────────────────────────────────────────────────────────────
function activateMultiplayer(myPlayerType: PlayerTypes) {
  store.commit('activateGame', {
    XPlayer: Players.playerOne,
    OPlayer: Players.playerTwo,
    oponentIsAI: false,
    isMultiplayer: true
  })
  store.commit('setMultiplayerState', {
    myPlayerType,
    opponentName: 'Opponent',
    roomName: 'test-room',
    isWaitingForOpponent: false,
    isConnected: true
  })
}

describe('sendPlayAgain', () => {
  it('sets playAgainSent to true', () => {
    activateMultiplayer(PlayerTypes.XPlayer)
    store.commit('sendPlayAgain')
    expect(store.state.playAgainSent).toBe(true)
  })

  it('is idempotent: second call is a no-op', () => {
    activateMultiplayer(PlayerTypes.XPlayer)
    store.commit('sendPlayAgain')
    store.commit('receivePlayAgain') // set received too
    // manually reset to re-test
    store.commit('quitGame')
    activateMultiplayer(PlayerTypes.XPlayer)
    store.commit('sendPlayAgain')
    // calling again should not change anything unexpected
    store.commit('sendPlayAgain')
    expect(store.state.playAgainSent).toBe(true)
  })

  it('triggers resetRound when receivePlayAgain was already true', () => {
    activateMultiplayer(PlayerTypes.XPlayer)
    store.commit('addPlayToHistory', { position: 1, piece: 0 })
    // Simulate opponent already sent play_again
    store.commit('receivePlayAgain')
    expect(store.state.playHistory).toHaveLength(1) // not reset yet
    store.commit('sendPlayAgain')
    // Both flags are true — resetRound should have fired
    expect(store.state.playHistory).toHaveLength(0)
    expect(store.state.playAgainSent).toBe(false)
    expect(store.state.playAgainReceived).toBe(false)
  })
})

describe('receivePlayAgain', () => {
  it('sets playAgainReceived to true', () => {
    activateMultiplayer(PlayerTypes.XPlayer)
    store.commit('receivePlayAgain')
    expect(store.state.playAgainReceived).toBe(true)
  })

  it('triggers resetRound when sendPlayAgain was already true', () => {
    activateMultiplayer(PlayerTypes.XPlayer)
    store.commit('addPlayToHistory', { position: 1, piece: 0 })
    store.commit('sendPlayAgain')
    expect(store.state.playHistory).toHaveLength(1)
    store.commit('receivePlayAgain')
    expect(store.state.playHistory).toHaveLength(0)
    expect(store.state.playAgainSent).toBe(false)
    expect(store.state.playAgainReceived).toBe(false)
  })
})

describe('resetRound (simultaneous clicks scenario)', () => {
  it('records winner in gameResults', () => {
    activateMultiplayer(PlayerTypes.XPlayer)
    // X wins top row
    store.commit('addPlayToHistory', { position: 1, piece: 1 })
    store.commit('addPlayToHistory', { position: 2, piece: 1 })
    store.commit('addPlayToHistory', { position: 3, piece: 1 })
    store.commit('sendPlayAgain')
    store.commit('receivePlayAgain')
    expect(store.state.gameResults).toHaveLength(1)
  })

  it('sets currentPlayerType back to XPlayer', () => {
    activateMultiplayer(PlayerTypes.XPlayer)
    store.commit('addPlayToHistory', { position: 5, piece: 0 })
    store.commit('sendPlayAgain')
    store.commit('receivePlayAgain')
    expect(store.state.currentPlayerType).toBe(PlayerTypes.XPlayer)
  })

  it('sets isWaitingToPlay to false when I am X', () => {
    activateMultiplayer(PlayerTypes.XPlayer)
    store.commit('sendPlayAgain')
    store.commit('receivePlayAgain')
    expect(store.state.isWaitingToPlay).toBe(false)
  })

  it('sets isWaitingToPlay to true when I am O', () => {
    activateMultiplayer(PlayerTypes.OPlayer)
    store.commit('sendPlayAgain')
    store.commit('receivePlayAgain')
    expect(store.state.isWaitingToPlay).toBe(true)
  })

  it('clears both flags after reset so a second call is idempotent', () => {
    activateMultiplayer(PlayerTypes.XPlayer)
    store.commit('addPlayToHistory', { position: 1, piece: 0 })
    store.commit('sendPlayAgain')
    store.commit('receivePlayAgain')
    // flags are cleared — both sending and receiving again should start fresh
    expect(store.state.playAgainSent).toBe(false)
    expect(store.state.playAgainReceived).toBe(false)
    // board should still be empty (no double reset)
    expect(store.state.playHistory).toHaveLength(0)
  })
})
```

**Step 2: Run tests to verify they fail**

```bash
npx vitest run src/tests/unit/store/mutations.test.ts
```

Expected: FAIL — `store.state.playAgainSent is not defined` or similar

**Step 3: Add fields to `env.d.ts` State interface**

Add the two fields to the `State` interface in `env.d.ts`:

```typescript
  // play-again handshake
  playAgainSent: boolean,
  playAgainReceived: boolean,
```

Place them after `opponentDisconnected`.

**Step 4: Add state fields and mutations to the store**

In `src/store/index.ts`:

1. Add to the `state()` return (after `opponentDisconnected`):

```typescript
      playAgainSent: false,
      playAgainReceived: false,
```

2. Add three new mutations after `clearMultiplayerState`:

```typescript
    sendPlayAgain(state) {
      if (state.playAgainSent) return // double-click guard
      state.playAgainSent = true
      if (state.playAgainSent && state.playAgainReceived) {
        store.commit('resetRound')
      }
    },
    receivePlayAgain(state) {
      state.playAgainReceived = true
      if (state.playAgainSent && state.playAgainReceived) {
        store.commit('resetRound')
      }
    },
    resetRound(state) {
      const winner = determineWinner(state.playHistory)
      state.gameResults = state.gameResults.concat({ winner })
      state.playHistory = []
      state.currentPlayerType = PlayerTypes.XPlayer
      state.isWaitingToPlay = state.myPlayerType === PlayerTypes.OPlayer
      state.playAgainSent = false
      state.playAgainReceived = false
    },
```

**Step 5: Run tests to verify they pass**

```bash
npx vitest run src/tests/unit/store/mutations.test.ts
```

Expected: all PASS

**Step 6: Commit**

```bash
git add env.d.ts src/store/index.ts src/tests/unit/store/mutations.test.ts
git commit -m "feat: add play-again handshake flags and mutations to store"
```

---

### Task 3: Handle `play_again` message in the Home page

**Files:**
- Modify: `src/views/Home/index.vue`
- Test: `src/tests/unit/views/Home.test.ts`

**Step 1: Write the failing test**

Read `src/tests/unit/views/Home.test.ts` to find where to add the test (look for the last `describe` block). Add:

```typescript
describe('Home — _handleServerMessage play_again', () => {
  it('commits receivePlayAgain when play_again message is received', () => {
    const store = makeStore()
    const commitSpy = vi.spyOn(store, 'commit')
    const wrapper = mountHome(store)
    ;(wrapper.vm as any)._handleServerMessage({ type: 'play_again' })
    expect(commitSpy).toHaveBeenCalledWith('receivePlayAgain')
  })
})
```

Also update the `makeStore` mutations in the test file to include the new mutation so the spy works — add to the mutations object in `makeStore`:

```typescript
      receivePlayAgain: vi.fn(),
```

**Step 2: Run tests to verify they fail**

```bash
npx vitest run src/tests/unit/views/Home.test.ts
```

Expected: FAIL — `receivePlayAgain` is not called / unknown message type

**Step 3: Implement**

In `src/views/Home/index.vue`, add a new condition to `_handleServerMessage` (after the `player_joined` block):

```typescript
      if (msg.type === 'play_again') {
        this.$store.commit('receivePlayAgain')
        return
      }
```

**Step 4: Run tests to verify they pass**

```bash
npx vitest run src/tests/unit/views/Home.test.ts
```

Expected: all PASS

**Step 5: Commit**

```bash
git add src/views/Home/index.vue src/tests/unit/views/Home.test.ts
git commit -m "feat: handle play_again message in Home page server handler"
```

---

### Task 4: Add `waiting` prop to GameOverModal

**Files:**
- Modify: `src/components/GameOverModal.vue`
- Test: `src/tests/unit/components/MultiplayerModal.test.ts` — actually create a new test file

**Step 1: Write the failing tests**

Create `src/tests/unit/components/GameOverModal.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { PlayerTypes } from '@/enums/Players'

const stubs = {
  BaseModal: { template: '<div><slot /></div>', props: ['show'] },
  BaseButton: {
    template: '<button :disabled="disabled"><slot /></button>',
    props: ['buttonColor', 'disabled']
  },
  BaseIcon: { template: '<span />', props: ['iconType'] }
}

const { default: GameOverModal } = await import('@/components/GameOverModal.vue')

describe('GameOverModal — waiting prop', () => {
  it('shows "NEXT ROUND" button text when not waiting', () => {
    const wrapper = mount(GameOverModal, {
      global: { stubs },
      props: { show: true, winner: PlayerTypes.XPlayer, playerWinner: 1, waiting: false }
    })
    expect(wrapper.text()).toContain('NEXT ROUND')
    expect(wrapper.text()).not.toContain('WAITING')
  })

  it('shows "WAITING..." button text when waiting', () => {
    const wrapper = mount(GameOverModal, {
      global: { stubs },
      props: { show: true, winner: PlayerTypes.XPlayer, playerWinner: 1, waiting: true }
    })
    expect(wrapper.text()).toContain('WAITING...')
  })

  it('disables the next round button when waiting', () => {
    const wrapper = mount(GameOverModal, {
      global: { stubs },
      props: { show: true, winner: PlayerTypes.XPlayer, playerWinner: 1, waiting: true }
    })
    // Button with WAITING... should be disabled
    const buttons = wrapper.findAll('button')
    const waitingBtn = buttons.find(b => b.text().includes('WAITING'))
    expect(waitingBtn?.attributes('disabled')).toBeDefined()
  })

  it('does not disable next round button when not waiting', () => {
    const wrapper = mount(GameOverModal, {
      global: { stubs },
      props: { show: true, winner: -1, waiting: false }
    })
    const buttons = wrapper.findAll('button')
    const nextBtn = buttons.find(b => b.text().includes('NEXT ROUND'))
    expect(nextBtn?.attributes('disabled')).toBeUndefined()
  })
})
```

**Step 2: Run tests to verify they fail**

```bash
npx vitest run src/tests/unit/components/GameOverModal.test.ts
```

Expected: FAIL — `waiting` prop not recognized, button text is always "NEXT ROUND"

**Step 3: Implement**

In `src/components/GameOverModal.vue`:

1. Add `waiting` to props:

```typescript
    waiting: {
      type: Boolean,
      default: false
    }
```

2. Update the "NEXT ROUND" button in the template to use `waiting`:

```html
<BaseButton
  :button-color="colors.yellow"
  :disabled="waiting"
  @click="!waiting && $emit('next')"
>
  {{ waiting ? 'WAITING...' : 'NEXT ROUND' }}
</BaseButton>
```

**Step 4: Run tests to verify they pass**

```bash
npx vitest run src/tests/unit/components/GameOverModal.test.ts
```

Expected: all PASS

**Step 5: Commit**

```bash
git add src/components/GameOverModal.vue src/tests/unit/components/GameOverModal.test.ts
git commit -m "feat: add waiting prop to GameOverModal for play-again handshake state"
```

---

### Task 5: Wire the Game page for multiplayer "Next Round"

**Files:**
- Modify: `src/views/Game/index.vue`
- Test: `src/tests/unit/views/GamePage.test.ts`

**Step 1: Write the failing tests**

Add to `src/tests/unit/views/GamePage.test.ts`. First update the `makeStore` factory to include the new fields and mutations:

In the `state()` return, add:
```typescript
        playAgainSent: false,
        playAgainReceived: false,
```

In the mutations object, add:
```typescript
      sendPlayAgain(state: any) { state.playAgainSent = true },
      resetRound: vi.fn(),
```

Also update `mockService` at the top to include `sendPlayAgain`:
```typescript
const mockService = {
  sendMove: vi.fn(),
  createRoom: vi.fn(),
  joinRoom: vi.fn(),
  disconnect: vi.fn(),
  sendPlayAgain: vi.fn()
}
```

Also update `GameOverModal` stub to include the `waiting` prop:
```typescript
  GameOverModal: {
    template: '<div />',
    props: ['show', 'winner', 'playerWinner', 'waiting'],
    emits: ['quit', 'next']
  },
```

Then add test cases:

```typescript
describe('GamePage — next() in multiplayer', () => {
  it('commits sendPlayAgain and calls service.sendPlayAgain when multiplayer', () => {
    const store = makeStore({ isMultiplayer: true, myPlayerType: PlayerTypes.XPlayer })
    const commitSpy = vi.spyOn(store, 'commit')
    const wrapper = mount(GamePage, { global: { plugins: [store], stubs } })
    wrapper.vm.next()
    expect(commitSpy).toHaveBeenCalledWith('sendPlayAgain')
    expect(mockService.sendPlayAgain).toHaveBeenCalled()
  })

  it('does NOT close the modal immediately in multiplayer', () => {
    const store = makeStore({ isMultiplayer: true, myPlayerType: PlayerTypes.XPlayer })
    const wrapper = mount(GamePage, { global: { plugins: [store], stubs } })
    wrapper.vm.showModal = true
    wrapper.vm.next()
    expect(wrapper.vm.showModal).toBe(true) // still open — waiting for opponent
  })

  it('closes the modal when playAgainSent transitions from true to false (reset fired)', async () => {
    const store = makeStore({ isMultiplayer: true, myPlayerType: PlayerTypes.XPlayer, playAgainSent: true })
    const wrapper = mount(GamePage, { global: { plugins: [store], stubs } })
    wrapper.vm.showModal = true
    // Simulate resetRound clearing the flag
    store.state.playAgainSent = false
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.showModal).toBe(false)
  })

  it('passes waiting=true to GameOverModal when playAgainSent and modal is open', async () => {
    const store = makeStore({ isMultiplayer: true, myPlayerType: PlayerTypes.XPlayer, playAgainSent: true })
    const wrapper = mount(GamePage, { global: { plugins: [store], stubs } })
    wrapper.vm.showModal = true
    await wrapper.vm.$nextTick()
    const modal = wrapper.findComponent({ name: 'GameOverModal' })
    expect(modal.props('waiting')).toBe(true)
  })

  it('calls nextRound (non-multiplayer) and closes modal', () => {
    const store = makeStore({ isMultiplayer: false })
    const commitSpy = vi.spyOn(store, 'commit')
    const wrapper = mount(GamePage, { global: { plugins: [store], stubs } })
    wrapper.vm.showModal = true
    wrapper.vm.next()
    expect(commitSpy).toHaveBeenCalledWith('nextRound')
    expect(wrapper.vm.showModal).toBe(false)
    expect(mockService.sendPlayAgain).not.toHaveBeenCalled()
  })
})
```

**Step 2: Run tests to verify they fail**

```bash
npx vitest run src/tests/unit/views/GamePage.test.ts
```

Expected: FAIL — `next()` always calls `nextRound`, no multiplayer branch

**Step 3: Implement**

In `src/views/Game/index.vue`:

1. Add `playAgainSent` to `mapState`:

```typescript
    ...mapState([
      'playHistory',
      'isWaitingToPlay',
      'currentPlayerType',
      'isMultiplayer',
      'myPlayerType',
      'opponentDisconnected',
      'playAgainSent'
    ]),
```

2. Add `playAgainSent` to the `waiting` computed on `GameOverModal`:

In the template, update the `GameOverModal` component:

```html
<GameOverModal
  :show="showModal"
  :winner="winner"
  :player-winner="player"
  :waiting="isMultiplayer && playAgainSent"
  @quit="quit()"
  @next="next()"
/>
```

3. Add a watcher for `playAgainSent` to close the modal when reset fires. Add inside `watch`:

```typescript
    playAgainSent(newVal: boolean, oldVal: boolean) {
      if (oldVal === true && newVal === false) {
        this.showModal = false
      }
    }
```

4. Update the `next()` method:

```typescript
    next() {
      if (this.isMultiplayer) {
        this.$store.commit('sendPlayAgain')
        multiplayerService.sendPlayAgain()
        // Modal stays open with "WAITING..." until resetRound fires
        return
      }
      this.nextRound()
      this.showModal = false
    }
```

**Step 4: Run tests to verify they pass**

```bash
npx vitest run src/tests/unit/views/GamePage.test.ts
```

Expected: all PASS

**Step 5: Run the full test suite**

```bash
npx vitest run
```

Expected: all tests PASS

**Step 6: Commit**

```bash
git add src/views/Game/index.vue src/tests/unit/views/GamePage.test.ts
git commit -m "feat: wire multiplayer play-again handshake in Game page"
```

---

### Task 6: Verify `clearMultiplayerState` resets play-again flags

The `clearMultiplayerState` mutation runs when quitting. We need to make sure it also resets `playAgainSent` and `playAgainReceived` to avoid stale state on the next game.

**Files:**
- Modify: `src/store/index.ts`
- Test: `src/tests/unit/store/mutations.test.ts`

**Step 1: Write the failing test**

Add to `src/tests/unit/store/mutations.test.ts` inside the `clearMultiplayerState` describe block:

```typescript
  it('resets playAgainSent and playAgainReceived to false', () => {
    store.commit('sendPlayAgain')
    store.commit('receivePlayAgain')
    store.commit('clearMultiplayerState')
    expect(store.state.playAgainSent).toBe(false)
    expect(store.state.playAgainReceived).toBe(false)
  })
```

**Step 2: Run tests to verify they fail**

```bash
npx vitest run src/tests/unit/store/mutations.test.ts
```

Expected: FAIL

**Step 3: Implement**

In `src/store/index.ts`, add to `clearMultiplayerState`:

```typescript
      state.playAgainSent = false
      state.playAgainReceived = false
```

**Step 4: Run all tests**

```bash
npx vitest run
```

Expected: all PASS

**Step 5: Commit**

```bash
git add src/store/index.ts src/tests/unit/store/mutations.test.ts
git commit -m "fix: reset play-again flags in clearMultiplayerState"
```
