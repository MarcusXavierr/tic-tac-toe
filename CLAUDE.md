# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev            # Vite dev server (localhost:5173)
npm run build          # Type-check + production build
npm run type-check     # vue-tsc --noEmit
npm run lint           # ESLint with --fix
npm run format         # Prettier (src/ only)
npm test               # Vitest run (all tests, once)
npm run test:watch     # Vitest watch mode
```

There is no single-test flag in scripts. Use vitest directly:
```bash
npx vitest run src/tests/unit/services/GameService.test.ts
```

## Tech Stack

Vue 3 (Options API) + Vuex 4 + TypeScript + Vite + SCSS (scoped). Tests: Vitest + @vue/test-utils + happy-dom.

## Architecture

### State (Vuex)

Single store at `src/store/index.ts`. All game state lives here: play history, player config, game results, multiplayer connection state. Global types (`State`, `MoveRecord`, `GameResult`) are declared in `env.d.ts` at project root.

Key mutations:
- `activateGame` - starts a session with player config
- `addPlayToHistory` / `addAsyncPlayToHistory` - record moves (async sets `isWaitingToPlay`)
- `nextRound` - scores winner, resets board
- `setMultiplayerState` / `clearMultiplayerState` - WebSocket connection lifecycle

### Routing

No vue-router. `App.vue` conditionally renders `GamePage` or `HomePage` based on `isGameActive` store state.

### Game Logic

- `GameService.ts` - winner detection (checks 8 winning patterns), winner path finding
- `BoardService.ts` - reconstructs 3x3 board from `playHistory`, generates possible moves
- `utils/ai.ts` - minimax with alpha-beta pruning (unbeatable AI)
- AI delay: 175ms timeout before computer move in Game view

### Multiplayer

WebSocket-based. `MultiplayerService.ts` manages connections; singleton exported from `multiplayerServiceInstance.ts`.

Flow: HTTP POST creates room -> WebSocket joins room -> server broadcasts `player_joined` -> game activates -> moves sent/received as `{ type: 'move', cell: number }`.

Server messages: `player_joined`, `player_disconnected`, `move`.

Requires `VITE_API_BASE` env var pointing to the WebSocket/API backend (default in `.env`: `http://localhost:8888`).

### Enums

`Players` (playerOne=1, playerTwo=2) tracks local vs remote. `PlayerTypes` (XPlayer=0, OPlayer=1) tracks X vs O. `IconType` maps to SVG icons. These are numeric enums used throughout state and services.

### Component Patterns

- Options API exclusively (not Composition API)
- `mapState`, `mapMutations`, `mapGetters` for store access
- Base components (`src/components/base/`) form a small design system: BaseButton, BaseCell, BaseModal, BaseTextInput, BaseIcon
- Feature modals: GameOverModal, MultiplayerModal, OpponentDisconnectedModal

### Testing

Tests live in `src/tests/unit/` mirroring source structure. Vitest globals enabled (no imports needed for describe/it/expect). WebSocket is mocked via a `MockWebSocket` class in tests. Fetch is mocked via `vi.stubGlobal`.

### Path Alias

`@/` resolves to `src/` (configured in both vite.config.ts and tsconfig.json).


## Git policy
Don't commit the code otherwise i told you to do it.


# Development Partnership

We build production code together. I handle implementation details while you guide architecture and catch complexity early.

## Core Workflow: Research → Plan → Implement → Validate

**Start every feature with:** "Let me research the codebase and create a plan before implementing."

1. **Research** - Understand existing patterns and architecture
2. **Plan** - Propose approach and verify with you
3. **Implement** - Build with tests and error handling
4. **Validate** - ALWAYS run formatters, linters, and tests after implementation

## Code Organization

**Keep functions small and focused:**
- If you need comments to explain sections, split into functions
- Group related functionality into clear packages
- Prefer many small files over few large ones

## Architecture Principles

**This is always a feature branch:**
- Delete old code completely - no deprecation needed
- No versioned names (processV2, handleNew, ClientOld)
- No migration code unless explicitly requested
- No "removed code" comments - just delete it

**Prefer explicit over implicit:**
- Clear function names over clever abstractions
- Obvious data flow over hidden magic
- Direct dependencies over service locators

## Maximize Efficiency

**Parallel operations:** Run multiple searches, reads, and greps in single messages
**Multiple agents:** Split complex tasks - one for tests, one for implementation
**Batch similar work:** Group related file edits together

## Problem Solving

**When stuck:** Stop. The simple solution is usually correct.

**When uncertain:** "Let me ultrathink about this architecture."

**When choosing:** "I see approach A (simple) vs B (flexible). Which do you prefer?"

Your redirects prevent over-engineering. When uncertain about implementation, stop and ask for guidance.

## Testing Strategy

**Match testing approach to code complexity:**
- Complex business logic: Write tests first (TDD)
- Simple CRUD operations: Write code first, then tests
- Hot paths: Add benchmarks after implementation

## Progress Tracking

- **TodoWrite** for task management
- **Clear naming** in all code

Focus on maintainable solutions over clever abstractions.

DON'T EVER TOUCH THE .env file. (you can touch the .env.example and files like that)
