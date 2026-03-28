# Multiplayer Phase 3: Gameplay Wiring Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire the `MultiplayerService` and store multiplayer state into the live game loop — modal events activate the game, board clicks send moves, incoming opponent moves update the board, and disconnections are handled gracefully.

**Architecture:** A singleton `MultiplayerService` instance is created in `Home/index.vue` and passed down via `provide`/`inject` (or imported directly as a module-level singleton). `GameBoard.vue` calls `service.sendMove()` after a player click when `isMultiplayer` is true. `Game/index.vue` listens for incoming `move` and `player_disconnected` messages via the `onMessage` callback set up during `joinRoom`. A new `OpponentDisconnectedModal` component handles the disconnect flow.

**Tech Stack:** Vue 3 Options API, TypeScript, Vuex 4, Vitest + `@vue/test-utils`, `MultiplayerService` from Phase 2

---

## Prerequisite check

Before starting, confirm Phase 2 is complete and all tests pass:

```bash
cd /home/marcus/Projects/tic-tac-toe && npx vitest run
```

Expected: all suites pass, 0 failures.

---

## Task 1: Singleton service module + Home wiring

**Files:**
- Create: `src/services/multiplayerServiceInstance.ts`
- Edit: `src/views/Home/index.vue`
- Create: `src/tests/unit/views/Home.test.ts`

The cleanest way to share the service without prop-drilling or Vuex is a module-level singleton. Every file that imports `multiplayerService` gets the same instance.

---

### Step 1: Write failing tests for Home wiring

Create `src/tests/unit/views/Home.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { Players, PlayerTypes } from '@/enums/Players'

// ── Mock the singleton service ────────────────────────────────────────────────
const mockService = {
  createRoom: vi.fn(() => Promise.resolve()),
  joinRoom: vi.fn(),
  sendMove: vi.fn(),
  disconnect: vi.fn()
}
vi.mock('@/services/multiplayerServiceInstance', () => ({
  multiplayerService: mockService
}))

// Import AFTER mock is set up
const { default: HomePage } = await import('@/views/Home/index.vue')

// ── Store factory ─────────────────────────────────────────────────────────────
function makeStore(overrides = {}) {
  return createStore({
    state() {
      return {
        isGameActive: false,
        isMultiplayer: false,
        myPlayerType: null,
        opponentName: '',
        roomName: '',
        isWaitingForOpponent: false,
        isConnected: false,
        opponentDisconnected: false,
        oponentIsAI: false,
        isWaitingToPlay: false,
        XPlayer: null,
        OPlayer: null,
        playHistory: [],
        gameResults: [],
        currentPlayerType: undefined,
        ...overrides
      }
    },
    mutations: {
      activateGame: vi.fn(),
      setMultiplayerState: vi.fn(),
      clearMultiplayerState: vi.fn()
    }
  })
}

const stubs = {
  BaseButton: {
    template: '<button @click="$emit(\'click\')"><slot /></button>',
    emits: ['click']
  },
  PlayerSelector: {
    template: '<div />',
    props: ['xTypeSelected', 'oTypeSelected'],
    emits: ['update:xTypeSelected', 'update:oTypeSelected']
  },
  MultiplayerModal: {
    template: '<div data-testid="multiplayer-modal" />',
    props: ['show'],
    emits: ['create', 'join', 'cancel']
  }
}

function mountHome(store: ReturnType<typeof makeStore>) {
  return mount(HomePage, {
    global: { plugins: [store], stubs }
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('Home — VS PLAYER button', () => {
  it('opens the MultiplayerModal when VS PLAYER is clicked', async () => {
    const store = makeStore()
    const wrapper = mountHome(store)
    // Find the VS PLAYER button (second BaseButton stub)
    const buttons = wrapper.findAll('button')
    const vsPlayerBtn = buttons.find(b => b.text().includes('VS PLAYER'))
    expect(vsPlayerBtn).toBeDefined()
    await vsPlayerBtn!.trigger('click')
    const modal = wrapper.find('[data-testid="multiplayer-modal"]')
    // Modal show prop should now be true — check via component
    expect(wrapper.vm.showMultiplayerModal).toBe(true)
  })
})

describe('Home — @create event', () => {
  it('calls service.createRoom then service.joinRoom', async () => {
    const store = makeStore()
    const wrapper = mountHome(store)
    // Trigger the create event on the modal stub
    await wrapper.vm.handleCreate('room-1', 'Alice', PlayerTypes.XPlayer)
    expect(mockService.createRoom).toHaveBeenCalledWith('room-1')
    expect(mockService.joinRoom).toHaveBeenCalledWith(
      'room-1',
      'Alice',
      expect.any(Function),
      expect.any(Function)
    )
  })

  it('commits setMultiplayerState with isWaitingForOpponent: true', async () => {
    const store = makeStore()
    const commitSpy = vi.spyOn(store, 'commit')
    const wrapper = mountHome(store)
    await wrapper.vm.handleCreate('room-1', 'Alice', PlayerTypes.XPlayer)
    expect(commitSpy).toHaveBeenCalledWith(
      'setMultiplayerState',
      expect.objectContaining({ isWaitingForOpponent: true, roomName: 'room-1', isConnected: true })
    )
  })
})

describe('Home — @join event', () => {
  it('calls service.joinRoom (no createRoom)', async () => {
    const store = makeStore()
    const wrapper = mountHome(store)
    wrapper.vm.handleJoin('room-2', 'Bob')
    expect(mockService.createRoom).not.toHaveBeenCalled()
    expect(mockService.joinRoom).toHaveBeenCalledWith(
      'room-2',
      'Bob',
      expect.any(Function),
      expect.any(Function)
    )
  })

  it('commits setMultiplayerState with isWaitingForOpponent: true', () => {
    const store = makeStore()
    const commitSpy = vi.spyOn(store, 'commit')
    const wrapper = mountHome(store)
    wrapper.vm.handleJoin('room-2', 'Bob')
    expect(commitSpy).toHaveBeenCalledWith(
      'setMultiplayerState',
      expect.objectContaining({ isWaitingForOpponent: true, roomName: 'room-2', isConnected: true })
    )
  })
})

describe('Home — @cancel event', () => {
  it('calls service.disconnect', () => {
    const store = makeStore()
    const wrapper = mountHome(store)
    wrapper.vm.handleCancel()
    expect(mockService.disconnect).toHaveBeenCalled()
  })

  it('commits clearMultiplayerState', () => {
    const store = makeStore()
    const commitSpy = vi.spyOn(store, 'commit')
    const wrapper = mountHome(store)
    wrapper.vm.handleCancel()
    expect(commitSpy).toHaveBeenCalledWith('clearMultiplayerState')
  })

  it('closes the modal', () => {
    const store = makeStore()
    const wrapper = mountHome(store)
    wrapper.vm.showMultiplayerModal = true
    wrapper.vm.handleCancel()
    expect(wrapper.vm.showMultiplayerModal).toBe(false)
  })
})

describe('Home — player_joined message handling', () => {
  it('commits setMultiplayerState with opponent info and isWaitingForOpponent: false', async () => {
    const store = makeStore()
    const commitSpy = vi.spyOn(store, 'commit')
    const wrapper = mountHome(store)
    // Start a join so onMessage is registered
    wrapper.vm.handleJoin('room-1', 'Alice')
    // Grab the onMessage callback passed to joinRoom
    const onMessage = (mockService.joinRoom as ReturnType<typeof vi.fn>).mock.calls[0][2]
    onMessage({ type: 'player_joined', name: 'Bob', player_type: 'o', order: 2 })
    expect(commitSpy).toHaveBeenCalledWith(
      'setMultiplayerState',
      expect.objectContaining({
        opponentName: 'Bob',
        isWaitingForOpponent: false
      })
    )
  })

  it('commits activateGame with isMultiplayer: true on player_joined', () => {
    const store = makeStore()
    const commitSpy = vi.spyOn(store, 'commit')
    const wrapper = mountHome(store)
    wrapper.vm.handleJoin('room-1', 'Alice')
    const onMessage = (mockService.joinRoom as ReturnType<typeof vi.fn>).mock.calls[0][2]
    onMessage({ type: 'player_joined', name: 'Bob', player_type: 'o', order: 2 })
    expect(commitSpy).toHaveBeenCalledWith(
      'activateGame',
      expect.objectContaining({ isMultiplayer: true })
    )
  })

  it('closes the modal on player_joined', () => {
    const store = makeStore()
    const wrapper = mountHome(store)
    wrapper.vm.showMultiplayerModal = true
    wrapper.vm.handleJoin('room-1', 'Alice')
    const onMessage = (mockService.joinRoom as ReturnType<typeof vi.fn>).mock.calls[0][2]
    onMessage({ type: 'player_joined', name: 'Bob', player_type: 'o', order: 2 })
    expect(wrapper.vm.showMultiplayerModal).toBe(false)
  })
})

export {}
```

Run and confirm failures:

```bash
cd /home/marcus/Projects/tic-tac-toe && npx vitest run src/tests/unit/views/Home.test.ts
```

Expected: module-not-found or method-not-found failures.

---

### Step 2: Create the singleton module

Create `src/services/multiplayerServiceInstance.ts`:

```typescript
import { MultiplayerService } from './MultiplayerService'

export const multiplayerService = new MultiplayerService()
```

---

### Step 3: Update `src/views/Home/index.vue`

Replace the entire file:

```vue
<template>
  <div class="container">
    <img src="@/assets/logo.svg" alt="" />
    <PlayerSelector
      v-model:x-type-selected="xTypeSelected"
      v-model:o-type-selected="oTypeSelected"
    />
    <div class="buttons">
      <BaseButton :button-color="btnColors.yellow" :is-large="true" @click="startIAGame">
        NEW GAME (VS CPU)
      </BaseButton>
      <BaseButton :button-color="btnColors.blue" :is-large="true" @click="openMultiplayerModal">
        NEW GAME (VS PLAYER)
      </BaseButton>
    </div>
    <MultiplayerModal
      :show="showMultiplayerModal"
      @create="handleCreate"
      @join="handleJoin"
      @cancel="handleCancel"
    />
  </div>
</template>

<script lang="ts">
import BaseButton from '@/components/base/BaseButton.vue'
import PlayerSelector from './PlayerSelector.vue'
import MultiplayerModal from '@/components/MultiplayerModal.vue'
import { BtnColor } from '@/enums/ButtonTypes'
import { Players, PlayerTypes } from '@/enums/Players'
import { mapMutations } from 'vuex'
import { multiplayerService } from '@/services/multiplayerServiceInstance'
import type { ServerMessage } from '@/services/MultiplayerService'

export default {
  name: 'HomePage',
  components: {
    BaseButton,
    PlayerSelector,
    MultiplayerModal
  },
  data() {
    return {
      btnColors: BtnColor,
      xTypeSelected: true,
      oTypeSelected: false,
      showMultiplayerModal: false,
      // playerName set during create/join, used to infer myPlayerType on player_joined
      _pendingPlayerName: '' as string,
      _pendingRoomName: '' as string,
    }
  },
  methods: {
    ...mapMutations(['activateGame', 'setMultiplayerState', 'clearMultiplayerState']),

    openMultiplayerModal() {
      this.showMultiplayerModal = true
    },

    async handleCreate(roomName: string, playerName: string, playerType: PlayerTypes) {
      this._pendingRoomName = roomName
      this._pendingPlayerName = playerName
      await multiplayerService.createRoom(roomName)
      this.$store.commit('setMultiplayerState', {
        myPlayerType: playerType,
        opponentName: '',
        roomName,
        isWaitingForOpponent: true,
        isConnected: true
      })
      multiplayerService.joinRoom(
        roomName,
        playerName,
        (msg) => this._handleServerMessage(msg),
        () => this._handleConnectionClose()
      )
    },

    handleJoin(roomName: string, playerName: string) {
      this._pendingRoomName = roomName
      this._pendingPlayerName = playerName
      this.$store.commit('setMultiplayerState', {
        myPlayerType: null,
        opponentName: '',
        roomName,
        isWaitingForOpponent: true,
        isConnected: true
      })
      multiplayerService.joinRoom(
        roomName,
        playerName,
        (msg) => this._handleServerMessage(msg),
        () => this._handleConnectionClose()
      )
    },

    handleCancel() {
      multiplayerService.disconnect()
      this.$store.commit('clearMultiplayerState')
      this.showMultiplayerModal = false
    },

    _handleServerMessage(msg: ServerMessage) {
      if (msg.type === 'player_joined') {
        // The server tells us the *opponent's* player_type.
        // We are the opposite.
        const opponentType = msg.player_type === 'x' ? PlayerTypes.XPlayer : PlayerTypes.OPlayer
        const myType = opponentType === PlayerTypes.XPlayer ? PlayerTypes.OPlayer : PlayerTypes.XPlayer

        this.$store.commit('setMultiplayerState', {
          myPlayerType: myType,
          opponentName: msg.name,
          roomName: this._pendingRoomName,
          isWaitingForOpponent: false,
          isConnected: true
        })

        // X always goes first; if I'm O I wait for the first move
        const isWaitingToPlay = myType === PlayerTypes.OPlayer

        this.$store.commit('activateGame', {
          XPlayer: Players.playerOne,
          OPlayer: Players.playerTwo,
          oponentIsAI: false,
          isMultiplayer: true
        })

        // Override isWaitingToPlay set by activateGame based on turn assignment
        if (isWaitingToPlay) {
          this.$store.commit('makePlayersWait')
        } else {
          this.$store.commit('finishWaiting')
        }

        this.showMultiplayerModal = false
      }
    },

    _handleConnectionClose() {
      // Only fires on unexpected close (disconnect() nulls onclose first)
      this.$store.commit('setMultiplayerState', {
        myPlayerType: this.$store.state.myPlayerType,
        opponentName: this.$store.state.opponentName,
        roomName: this.$store.state.roomName,
        isWaitingForOpponent: false,
        isConnected: false,
        opponentDisconnected: true
      })
    },

    startGame() {
      this.activateGame({ ...this.players, oponentIsAI: false })
    },
    startIAGame() {
      this.activateGame({ ...this.players, oponentIsAI: true })
    }
  },
  computed: {
    players() {
      if (this.oTypeSelected) {
        return {
          OPlayer: Players.playerOne,
          XPlayer: Players.playerTwo
        }
      }
      return {
        OPlayer: Players.playerTwo,
        XPlayer: Players.playerOne
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.player-type {
  img {
    color: blue;
  }
}
</style>
```

---

### Step 4: Run Home tests — verify all pass

```bash
cd /home/marcus/Projects/tic-tac-toe && npx vitest run src/tests/unit/views/Home.test.ts
```

Expected output contains:
```
PASS src/tests/unit/views/Home.test.ts
```

---

### Step 5: Commit

```bash
cd /home/marcus/Projects/tic-tac-toe && git add src/services/multiplayerServiceInstance.ts src/views/Home/index.vue src/tests/unit/views/Home.test.ts && git commit -m "feat: wire MultiplayerModal events to service and store in Home view"
```

---

## Task 2: GameBoard — send moves over WebSocket

**Files:**
- Edit: `src/views/Game/GameBoard.vue`
- Create: `src/tests/unit/views/GameBoard.test.ts`

---

### Step 1: Write failing tests for GameBoard multiplayer move sending

Create `src/tests/unit/views/GameBoard.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { PlayerTypes } from '@/enums/Players'
import { IconType } from '@/enums/IconTypes'

// ── Mock singleton service ────────────────────────────────────────────────────
const mockService = {
  sendMove: vi.fn(),
  createRoom: vi.fn(),
  joinRoom: vi.fn(),
  disconnect: vi.fn()
}
vi.mock('@/services/multiplayerServiceInstance', () => ({
  multiplayerService: mockService
}))

const { default: GameBoard } = await import('@/views/Game/GameBoard.vue')

// ── Store factory ─────────────────────────────────────────────────────────────
function makeStore(overrides = {}) {
  return createStore({
    state() {
      return {
        playHistory: [],
        currentPlayerType: PlayerTypes.XPlayer,
        oponentIsAI: false,
        isWaitingToPlay: false,
        isMultiplayer: false,
        ...overrides
      }
    },
    mutations: {
      addPlayToHistory(state: any, data: any) {
        state.playHistory = state.playHistory.concat(data)
      },
      addAsyncPlayToHistory(state: any, data: any) {
        state.playHistory = state.playHistory.concat(data)
        state.isWaitingToPlay = true
      },
      makePlayersWait(state: any) {
        state.isWaitingToPlay = true
      }
    }
  })
}

const stubs = {
  BaseCell: {
    template: '<div @click="$emit(\'click\')" />',
    emits: ['click']
  },
  GameHistory: { template: '<div />' }
}

beforeEach(() => vi.clearAllMocks())
afterEach(() => vi.clearAllMocks())

describe('GameBoard — normal (non-multiplayer) move', () => {
  it('does NOT call service.sendMove when isMultiplayer is false', () => {
    const store = makeStore({ isMultiplayer: false })
    const wrapper = mount(GameBoard, { global: { plugins: [store], stubs } })
    wrapper.vm.checkCell(0)
    expect(mockService.sendMove).not.toHaveBeenCalled()
  })
})

describe('GameBoard — multiplayer move', () => {
  it('calls service.sendMove with the cell id after adding to history', () => {
    const store = makeStore({ isMultiplayer: true, isWaitingToPlay: false })
    const wrapper = mount(GameBoard, { global: { plugins: [store], stubs } })
    wrapper.vm.checkCell(4)
    expect(mockService.sendMove).toHaveBeenCalledWith(4)
  })

  it('sets isWaitingToPlay to true after sending a multiplayer move', () => {
    const store = makeStore({ isMultiplayer: true, isWaitingToPlay: false })
    const wrapper = mount(GameBoard, { global: { plugins: [store], stubs } })
    wrapper.vm.checkCell(2)
    expect(store.state.isWaitingToPlay).toBe(true)
  })

  it('does not send move when isWaitingToPlay is true', () => {
    const store = makeStore({ isMultiplayer: true, isWaitingToPlay: true })
    const wrapper = mount(GameBoard, { global: { plugins: [store], stubs } })
    wrapper.vm.checkCell(0)
    expect(mockService.sendMove).not.toHaveBeenCalled()
  })

  it('does not send move to an already-occupied cell', () => {
    const store = makeStore({
      isMultiplayer: true,
      isWaitingToPlay: false,
      playHistory: [{ position: 3, piece: IconType.X }]
    })
    const wrapper = mount(GameBoard, { global: { plugins: [store], stubs } })
    wrapper.vm.checkCell(3)
    expect(mockService.sendMove).not.toHaveBeenCalled()
  })
})

export {}
```

Run and confirm failures:

```bash
cd /home/marcus/Projects/tic-tac-toe && npx vitest run src/tests/unit/views/GameBoard.test.ts
```

Expected: failures because `GameBoard.checkCell` does not yet call `sendMove`.

---

### Step 2: Update `src/views/Game/GameBoard.vue`

Replace the `<script>` block:

```vue
<script lang="ts">
import BaseCell from '@/components/base/BaseCell.vue'
import GameHistory from './GameHistory.vue'
import { mapState, mapMutations } from 'vuex'
import { getIconTypeFromPlayerTurn } from '../../services/IconService'
import { generateBoard, type move } from '@/services/BoardService'
import { multiplayerService } from '@/services/multiplayerServiceInstance'

export default {
  name: 'GameBoard',
  components: {
    BaseCell,
    GameHistory
  },
  methods: {
    ...mapMutations(['addPlayToHistory', 'addAsyncPlayToHistory', 'makePlayersWait']),
    checkCell(cellId: number) {
      if (this.isWaitingToPlay) {
        return
      }
      const cell = this.cells.find((cell) => cell.id == cellId)
      if (cell?.piece != null) {
        return
      }

      const data = { position: cellId, piece: getIconTypeFromPlayerTurn(this.currentPlayerType) }

      if (this.isMultiplayer) {
        this.addPlayToHistory(data)
        multiplayerService.sendMove(cellId)
        this.makePlayersWait()
        return
      }

      if (this.oponentIsAI) {
        this.addAsyncPlayToHistory(data)
        return
      }

      this.addPlayToHistory(data)
    }
  },
  computed: {
    ...mapState(['playHistory', 'currentPlayerType', 'oponentIsAI', 'isWaitingToPlay', 'isMultiplayer']),
    cells(): move[] {
      return generateBoard(this.playHistory)
    },
  }
}
</script>
```

(Keep the `<template>` and `<style>` blocks unchanged.)

---

### Step 3: Run GameBoard tests — verify all pass

```bash
cd /home/marcus/Projects/tic-tac-toe && npx vitest run src/tests/unit/views/GameBoard.test.ts
```

Expected output contains:
```
PASS src/tests/unit/views/GameBoard.test.ts
```

---

### Step 4: Commit

```bash
cd /home/marcus/Projects/tic-tac-toe && git add src/views/Game/GameBoard.vue src/tests/unit/views/GameBoard.test.ts && git commit -m "feat: send moves via MultiplayerService on cell click when isMultiplayer"
```

---

## Task 3: Game page — incoming opponent moves and disconnect flag

**Files:**
- Edit: `src/views/Game/index.vue`
- Create: `src/tests/unit/views/GamePage.test.ts`

---

### Step 1: Write failing tests for Game page multiplayer handling

Create `src/tests/unit/views/GamePage.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { PlayerTypes } from '@/enums/Players'
import { IconType } from '@/enums/IconTypes'

const mockService = {
  sendMove: vi.fn(),
  createRoom: vi.fn(),
  joinRoom: vi.fn(),
  disconnect: vi.fn()
}
vi.mock('@/services/multiplayerServiceInstance', () => ({
  multiplayerService: mockService
}))

const { default: GamePage } = await import('@/views/Game/index.vue')

function makeStore(overrides: Record<string, any> = {}) {
  return createStore({
    state() {
      return {
        playHistory: [],
        currentPlayerType: PlayerTypes.XPlayer,
        oponentIsAI: false,
        isWaitingToPlay: false,
        isMultiplayer: false,
        myPlayerType: PlayerTypes.XPlayer,
        opponentName: '',
        roomName: '',
        isConnected: false,
        isWaitingForOpponent: false,
        opponentDisconnected: false,
        isGameActive: true,
        XPlayer: 1,
        OPlayer: 2,
        gameResults: [],
        ...overrides
      }
    },
    mutations: {
      addPlayToHistory(state: any, data: any) {
        state.playHistory = state.playHistory.concat(data)
        state.isWaitingToPlay = false
      },
      makePlayersWait(state: any) { state.isWaitingToPlay = true },
      finishWaiting(state: any) { state.isWaitingToPlay = false },
      addWinnerPathToHistory(state: any, h: any) { state.playHistory = h },
      quitGame(state: any) { state.isGameActive = false },
      nextRound: vi.fn(),
      setMultiplayerState(state: any, p: any) { Object.assign(state, p) },
      clearMultiplayerState(state: any) {
        state.isMultiplayer = false
        state.opponentDisconnected = false
      }
    },
    getters: {
      getPlayer: (state: any) => (type: PlayerTypes) =>
        type === PlayerTypes.OPlayer ? state.OPlayer : state.XPlayer
    }
  })
}

const stubs = {
  NavBar: { template: '<div />' },
  GameBoard: { template: '<div />', ref: 'board' },
  GameOverModal: {
    template: '<div />',
    props: ['show', 'winner', 'playerWinner'],
    emits: ['quit', 'next']
  },
  OpponentDisconnectedModal: {
    template: '<div data-testid="disconnected-modal" :class="{ visible: show }" />',
    props: ['show'],
    emits: ['close']
  }
}

beforeEach(() => vi.clearAllMocks())
afterEach(() => vi.clearAllMocks())

describe('GamePage — opponent move handling', () => {
  it('exposes a handleOpponentMove method that adds the opponent piece to history', () => {
    const store = makeStore({ isMultiplayer: true, myPlayerType: PlayerTypes.XPlayer, isWaitingToPlay: true })
    const wrapper = mount(GamePage, { global: { plugins: [store], stubs } })
    // O is the opponent when I am X
    wrapper.vm.handleOpponentMove(5)
    expect(store.state.playHistory).toHaveLength(1)
    expect(store.state.playHistory[0].position).toBe(5)
    expect(store.state.playHistory[0].piece).toBe(IconType.O)
  })

  it('sets isWaitingToPlay to false after opponent move', () => {
    const store = makeStore({ isMultiplayer: true, myPlayerType: PlayerTypes.XPlayer, isWaitingToPlay: true })
    const wrapper = mount(GamePage, { global: { plugins: [store], stubs } })
    wrapper.vm.handleOpponentMove(3)
    expect(store.state.isWaitingToPlay).toBe(false)
  })

  it('uses X piece for opponent when myPlayerType is OPlayer', () => {
    const store = makeStore({ isMultiplayer: true, myPlayerType: PlayerTypes.OPlayer, isWaitingToPlay: true })
    const wrapper = mount(GamePage, { global: { plugins: [store], stubs } })
    wrapper.vm.handleOpponentMove(1)
    expect(store.state.playHistory[0].piece).toBe(IconType.X)
  })
})

describe('GamePage — opponent disconnected', () => {
  it('shows OpponentDisconnectedModal when opponentDisconnected is true', async () => {
    const store = makeStore({ isMultiplayer: true, opponentDisconnected: true })
    const wrapper = mount(GamePage, { global: { plugins: [store], stubs } })
    await wrapper.vm.$nextTick()
    const modal = wrapper.find('[data-testid="disconnected-modal"]')
    expect(modal.classes()).toContain('visible')
  })

  it('does not show OpponentDisconnectedModal when opponentDisconnected is false', async () => {
    const store = makeStore({ isMultiplayer: true, opponentDisconnected: false })
    const wrapper = mount(GamePage, { global: { plugins: [store], stubs } })
    await wrapper.vm.$nextTick()
    const modal = wrapper.find('[data-testid="disconnected-modal"]')
    expect(modal.classes()).not.toContain('visible')
  })
})

describe('GamePage — handleDisconnectClose', () => {
  it('calls service.disconnect', () => {
    const store = makeStore({ isMultiplayer: true })
    const wrapper = mount(GamePage, { global: { plugins: [store], stubs } })
    wrapper.vm.handleDisconnectClose()
    expect(mockService.disconnect).toHaveBeenCalled()
  })

  it('commits quitGame and clearMultiplayerState', () => {
    const store = makeStore({ isMultiplayer: true })
    const commitSpy = vi.spyOn(store, 'commit')
    const wrapper = mount(GamePage, { global: { plugins: [store], stubs } })
    wrapper.vm.handleDisconnectClose()
    expect(commitSpy).toHaveBeenCalledWith('quitGame')
    expect(commitSpy).toHaveBeenCalledWith('clearMultiplayerState')
  })
})

export {}
```

Run and confirm failures:

```bash
cd /home/marcus/Projects/tic-tac-toe && npx vitest run src/tests/unit/views/GamePage.test.ts
```

Expected: failures — `handleOpponentMove`, `handleDisconnectClose`, and `OpponentDisconnectedModal` do not exist yet.

---

### Step 2: Create `src/components/OpponentDisconnectedModal.vue`

```vue
<template>
  <BaseModal :show="show">
    <div class="container">
      <h3>OPPONENT DISCONNECTED</h3>
      <p>Your opponent has left the game.</p>
      <BaseButton :button-color="colors.gray" @click="$emit('close')">BACK TO HOME</BaseButton>
    </div>
  </BaseModal>
</template>

<script lang="ts">
import BaseModal from './base/BaseModal.vue'
import BaseButton from './base/BaseButton.vue'
import { BtnColor } from '@/enums/ButtonTypes'

export default {
  name: 'OpponentDisconnectedModal',
  emits: ['close'],
  components: {
    BaseModal,
    BaseButton
  },
  props: {
    show: {
      type: Boolean,
      required: true
    }
  },
  computed: {
    colors() {
      return BtnColor
    }
  }
}
</script>

<style lang="scss" scoped>
.container {
  height: 14rem;
  display: flex;
  text-align: center;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  gap: 1.5rem;

  h3 {
    font-size: 1.5rem;
    letter-spacing: 1.5px;
  }

  p {
    opacity: 0.6;
  }
}
</style>
```

---

### Step 3: Update `src/views/Game/index.vue`

Replace the entire file:

```vue
<template>
  <div class="container">
    <NavBar />
    <GameBoard ref="board" />
    <GameOverModal
      :show="showModal"
      :winner="winner"
      :player-winner="player"
      @quit="quit()"
      @next="next()"
    />
    <OpponentDisconnectedModal
      :show="opponentDisconnected"
      @close="handleDisconnectClose()"
    />
  </div>
</template>

<script lang="ts">
import NavBar from './NavBar.vue'
import GameBoard from './GameBoard.vue'
import { mapGetters, mapMutations, mapState } from 'vuex'
import { determineWinner, mapWinner } from '@/services/GameService'
import { PlayerTypes } from '@/enums/Players'
import GameOverModal from '@/components/GameOverModal.vue'
import OpponentDisconnectedModal from '@/components/OpponentDisconnectedModal.vue'
import { createBestMovement } from '@/services/BoardService'
import { getIconTypeFromPlayerTurn } from '@/services/IconService'
import { swapIconType } from '@/services/utils/player'
import { multiplayerService } from '@/services/multiplayerServiceInstance'

export default {
  name: 'GamePage',
  components: {
    NavBar,
    GameBoard,
    GameOverModal,
    OpponentDisconnectedModal
  },
  data() {
    return {
      showModal: false,
      winner: -1,
      player: -1
    }
  },
  computed: {
    ...mapState([
      'playHistory',
      'isWaitingToPlay',
      'currentPlayerType',
      'isMultiplayer',
      'myPlayerType',
      'opponentDisconnected'
    ]),
    ...mapGetters(['getPlayer'])
  },
  watch: {
    playHistory() {
      const winner = determineWinner(this.playHistory)
      if ((winner == null && this.playHistory.length < 9) || this.hasWinnerPath(this.playHistory)) {
        return
      }

      switch (winner) {
        case PlayerTypes.OPlayer:
          this.show(PlayerTypes.OPlayer, 500)
          break
        case PlayerTypes.XPlayer:
          this.show(PlayerTypes.XPlayer, 500)
          break
        default:
          this.show(-1, 200)
      }
    },
    isWaitingToPlay: {
      handler() {
        if (this.isMultiplayer) return // AI logic does not apply in multiplayer

        const winner = determineWinner(this.playHistory)
        const gameIsOver = winner != null || this.playHistory.length == 9
        const shouldMakeAIMove = this.isWaitingToPlay && !gameIsOver

        if (shouldMakeAIMove) {
          setTimeout(() => {
            const move = createBestMovement(
              this.playHistory,
              getIconTypeFromPlayerTurn(this.currentPlayerType)
            )
            this.addPlayToHistory(move)
          }, 175)
        }
      },
      immediate: true
    }
  },
  methods: {
    ...mapMutations([
      'quitGame',
      'nextRound',
      'addPlayToHistory',
      'finishWaiting',
      'makePlayersWait',
      'addWinnerPathToHistory',
      'clearMultiplayerState'
    ]),

    handleOpponentMove(cell: number) {
      // Opponent's piece is the opposite of my piece
      const myPiece = getIconTypeFromPlayerTurn(this.myPlayerType)
      const opponentPiece = swapIconType(myPiece)
      this.addPlayToHistory({ position: cell, piece: opponentPiece })
    },

    handleDisconnectClose() {
      multiplayerService.disconnect()
      this.quitGame()
      this.clearMultiplayerState()
    },

    show(winner: number, delay: number) {
      this.makePlayersWait()
      if (winner != -1) {
        this.addWinnerPathToHistory(mapWinner(getIconTypeFromPlayerTurn(winner), this.playHistory))
      }

      setTimeout(() => {
        this.showItem(winner)
        this.finishWaiting()
      }, delay)
    },
    hasWinnerPath(history: any): boolean {
      return history.some((item: any) => item.belongsToWinnerPath)
    },
    showItem(winner: PlayerTypes | null) {
      const board = this.$refs.board as any
      const cells = board.$refs.cell
      this.$nextTick(() =>
        cells.forEach((cell: any) => cell.$el.dispatchEvent(new Event('mouseleave')))
      )

      this.winner = winner as PlayerTypes
      this.player = this.getPlayer(this.winner)
      this.showModal = true
    },
    quit() {
      this.showModal = false
      if (this.isMultiplayer) {
        multiplayerService.disconnect()
        this.clearMultiplayerState()
      }
      this.quitGame()
    },
    next() {
      this.nextRound()
      this.showModal = false
    }
  }
}
</script>

<style lang="scss" scoped>
.container {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 4rem;
}

@media (min-width: 772px) {
  .container {
    padding: 0;
  }
}
</style>
```

---

### Step 4: Run GamePage tests — verify all pass

```bash
cd /home/marcus/Projects/tic-tac-toe && npx vitest run src/tests/unit/views/GamePage.test.ts
```

Expected output contains:
```
PASS src/tests/unit/views/GamePage.test.ts
```

---

### Step 5: Commit

```bash
cd /home/marcus/Projects/tic-tac-toe && git add src/views/Game/index.vue src/components/OpponentDisconnectedModal.vue src/tests/unit/views/GamePage.test.ts && git commit -m "feat: handle opponent moves, disconnect modal, and quit wiring in Game page"
```

---

## Task 4: NavBar — disconnect on quit

**Files:**
- Edit: `src/views/Game/NavBar.vue`
- Create: `src/tests/unit/views/NavBar.test.ts`

When the user clicks the logo or confirms restart/quit inside `NavBar`, if the game is multiplayer the service should disconnect.

---

### Step 1: Write failing tests

Create `src/tests/unit/views/NavBar.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { PlayerTypes } from '@/enums/Players'

const mockService = {
  sendMove: vi.fn(),
  createRoom: vi.fn(),
  joinRoom: vi.fn(),
  disconnect: vi.fn()
}
vi.mock('@/services/multiplayerServiceInstance', () => ({
  multiplayerService: mockService
}))

const { default: NavBar } = await import('@/views/Game/NavBar.vue')

function makeStore(overrides: Record<string, any> = {}) {
  return createStore({
    state() {
      return {
        currentPlayerType: PlayerTypes.XPlayer,
        isMultiplayer: false,
        playHistory: [],
        ...overrides
      }
    },
    mutations: {
      quitGame: vi.fn(),
      restartGame: vi.fn(),
      clearMultiplayerState: vi.fn()
    }
  })
}

const stubs = {
  BaseButton: {
    template: '<button @click="$emit(\'click\')"><slot /></button>',
    emits: ['click']
  },
  BaseIcon: { template: '<span />' },
  RetryGameModal: {
    template: '<div />',
    props: ['show'],
    emits: ['close', 'restart']
  }
}

beforeEach(() => vi.clearAllMocks())
afterEach(() => vi.clearAllMocks())

describe('NavBar — logo click quits game', () => {
  it('calls quitGame on logo click', async () => {
    const store = makeStore()
    const commitSpy = vi.spyOn(store, 'commit')
    const wrapper = mount(NavBar, { global: { plugins: [store], stubs } })
    await wrapper.find('img').trigger('click')
    expect(commitSpy).toHaveBeenCalledWith('quitGame')
  })

  it('calls service.disconnect on logo click when isMultiplayer', async () => {
    const store = makeStore({ isMultiplayer: true })
    const wrapper = mount(NavBar, { global: { plugins: [store], stubs } })
    await wrapper.find('img').trigger('click')
    expect(mockService.disconnect).toHaveBeenCalled()
  })

  it('does NOT call service.disconnect on logo click when not multiplayer', async () => {
    const store = makeStore({ isMultiplayer: false })
    const wrapper = mount(NavBar, { global: { plugins: [store], stubs } })
    await wrapper.find('img').trigger('click')
    expect(mockService.disconnect).not.toHaveBeenCalled()
  })
})

export {}
```

Run and confirm failures:

```bash
cd /home/marcus/Projects/tic-tac-toe && npx vitest run src/tests/unit/views/NavBar.test.ts
```

Expected: failures — `quitGame` in NavBar does not yet call `service.disconnect`.

---

### Step 2: Update `src/views/Game/NavBar.vue`

Replace the `<script>` block (keep template and style unchanged):

```vue
<script lang="ts">
import XIcon from '@/assets/gray-icons/icon-x.svg'
import OIcon from '@/assets/gray-icons/icon-o.svg'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseIcon from '@/components/base/BaseIcon.vue'

import { BtnColor } from '@/enums/ButtonTypes'
import { IconType } from '@/enums/IconTypes'
import { mapMutations, mapState } from 'vuex'
import { PlayerTypes } from '@/enums/Players'
import RetryGameModal from '@/components/RetryGameModal.vue'
import { multiplayerService } from '@/services/multiplayerServiceInstance'

export default {
  name: 'NavBar',
  components: {
    BaseButton,
    BaseIcon,
    RetryGameModal
  },
  data() {
    return {
      showModal: false
    }
  },
  methods: {
    ...mapMutations(['quitGame', 'restartGame', 'clearMultiplayerState']),
    quitGameWithCleanup() {
      if (this.isMultiplayer) {
        multiplayerService.disconnect()
        this.clearMultiplayerState()
      }
      this.quitGame()
    },
    restart() {
      const boardRef = this.$parent!.$refs.board as any

      const cells = boardRef.$refs.cell
      this.$nextTick(() => {
        cells.forEach((cell: any) => cell.$el.dispatchEvent(new Event('mouseleave')))
      })

      this.restartGame()
      this.showModal = false
    },
    show() {
      this.showModal = true
    }
  },
  computed: {
    ...mapState(['currentPlayerType', 'isMultiplayer']),
    buttonOptions() {
      return BtnColor
    },
    iconOptions() {
      return IconType
    },
    iconPath() {
      if (this.currentPlayerType == PlayerTypes.OPlayer) {
        return OIcon
      }
      return XIcon
    }
  }
}
</script>
```

Also update the template's logo click handler from `@click="quitGame()"` to `@click="quitGameWithCleanup()"`:

```html
<img src="@/assets/logo.svg" alt="" @click="quitGameWithCleanup()" />
```

---

### Step 3: Run NavBar tests — verify all pass

```bash
cd /home/marcus/Projects/tic-tac-toe && npx vitest run src/tests/unit/views/NavBar.test.ts
```

Expected output contains:
```
PASS src/tests/unit/views/NavBar.test.ts
```

---

### Step 4: Commit

```bash
cd /home/marcus/Projects/tic-tac-toe && git add src/views/Game/NavBar.vue src/tests/unit/views/NavBar.test.ts && git commit -m "feat: disconnect from multiplayer when quitting via NavBar logo click"
```

---

## Task 5: Full suite verification

Run every test to confirm nothing regressed:

```bash
cd /home/marcus/Projects/tic-tac-toe && npx vitest run
```

Expected: all test files pass, 0 failures. The output should list:

```
PASS src/tests/unit/store/mutations.test.ts
PASS src/tests/unit/store/getters.test.ts
PASS src/tests/unit/services/MultiplayerService.test.ts
PASS src/tests/unit/services/IconService.test.ts
PASS src/tests/unit/services/BoardService.test.ts
PASS src/tests/unit/services/GameService.test.ts
PASS src/tests/unit/services/utils/cleanHistory.test.ts
PASS src/tests/unit/services/utils/player.test.ts
PASS src/tests/unit/services/utils/ai.test.ts
PASS src/tests/unit/views/Home.test.ts
PASS src/tests/unit/views/GameBoard.test.ts
PASS src/tests/unit/views/GamePage.test.ts
PASS src/tests/unit/views/NavBar.test.ts
```

If any test fails, diagnose and fix before proceeding.

---

### Final commit

```bash
cd /home/marcus/Projects/tic-tac-toe && git add -p && git commit -m "chore: verify all Phase 3 tests pass — multiplayer gameplay wiring complete"
```
