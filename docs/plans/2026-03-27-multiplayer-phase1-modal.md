# MultiplayerModal Phase 1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a `MultiplayerModal` component with Create Room / Join Room views and a Waiting state, wired into the Home screen's "VS PLAYER" button — UI only, no backend calls.

**Architecture:** A single `MultiplayerModal.vue` component wraps `BaseModal` and manages its own `activeTab` and `isWaiting` state internally. It reuses `PlayerSelector` for the X/O pick in the Create view. The parent (`Home/index.vue`) owns the `showModal` boolean and handles the three emitted events (`@create`, `@join`, `@cancel`).

**Tech Stack:** Vue 3 Options API, TypeScript, SCSS (scoped), Vitest + `@vue/test-utils`, Vuex 4

---

## Design Direction

### Aesthetic Concept: CRT Broadcast Lobby

The modal must feel like it was **born inside this arcade cabinet**, not dropped in from a generic UI kit. The existing game is already a tight retro-arcade world: `Outfit` font, dark navy backgrounds, tactile inset-shadow buttons, ALL-CAPS everything, a 3-color system (teal / yellow / silver). The multiplayer lobby escalates that language into something that reads like a **console broadcast terminal** — the moment you enter multiplayer, it feels like you're establishing a satellite uplink, not filling out a web form.

**The unforgettable detail:** A deliberate typographic split. All UI chrome (labels, tabs, buttons) stays in `Outfit Bold` — the game's native font — but "live data" fields (room codes, player names you've entered, the waiting state counter) render in `Share Tech Mono` (Google Fonts, ~12kb). That one contrast makes the room code feel like a real signal ID, not just a text input. When waiting, the terminal monospace renders "ESTABLISHING CONNECTION..." character-by-character via a CSS text-reveal, like a command line printing output.

**Modal entry:** On open, a single downward scanline sweeps the modal container (`@keyframes scan-open`): a 2px teal line travels from top to bottom over 400ms, then disappears. The modal content fades in with a 150ms delay staggered across three layers (header, form, button). This is a one-shot cinematic moment — not a loop — so it never gets annoying.

**Waiting state — radar sweep:** The pulse ring gains a radar arm: a conic-gradient rotating continuously on the outer ring, creating the impression of an active radar scan. The inner circle stays solid teal and breathes (scale 1 → 0.85 → 1). The room code the player entered is displayed in `Share Tech Mono` in a monospaced pill — `#1F3641` background, teal border — making it look like a broadcast channel ID. A dot-dot-dot ellipsis pulses via CSS (not JS) at the end of the status text.

**Color discipline:** No new colors introduced. All values are from the existing `--dark-navy`, `--semi-dark-navy`, `--silver`, `--silver-hover`, `--blue`, `--blue-hover`, `--blue-shadow` CSS variables. The `Share Tech Mono` text is always `--blue` or `--silver` — never anything outside the palette.

### Aesthetic Decisions by Layer

**Tab Toggle — identical pill mechanic as PlayerSelector:**
The Create/Join switcher uses the exact same pill toggle structure as the X/O selector: `--dark-navy` track, active pill is `--silver`, label is `--dark-navy` (on active) or `--silver` (on inactive). ALL CAPS in `Outfit Bold`. This gives instant visual continuity — players have already learned this interaction. No border, no outline — the inset shadow on the card below it provides all the containment needed.

**Input Fields — inset arcade panel with monospaced values:**
Inputs sit inside a card with `background: var(--semi-dark-navy)` and `box-shadow: inset 0 -0.5rem 0 #10212a` — the same inset-shadow treatment as `.selector` in `PlayerSelector.vue`. Labels are ALL-CAPS `Outfit Bold` at `0.75rem`, `opacity: 0.6`. The input itself uses `font-family: 'Share Tech Mono', monospace` so that as the player types their name or room code, it reads like a terminal entry. On `:focus`, `border-bottom: 2px solid var(--blue)`. Unfocused: no border — the dark panel is containment enough. Placeholder text is `Outfit` at `opacity: 0.25` so the monospaced feel only activates when real content is present.

**Waiting State — radar ring + monospaced room code pill:**
The outer ring is `border: 2px solid var(--blue)` with a `conic-gradient` overlay rotating at 2s/loop (the radar sweep). The inner dot breathes with `scale`. Below the ring: the room code displays in a `Share Tech Mono` pill (`--semi-dark-navy` bg, `1px solid var(--blue)` border, `var(--blue)` text). Status text: `"ESTABLISHING CONNECTION"` followed by a CSS-animated `...` (three dots that appear one-by-one via `animation-delay`). Cancel button is `BtnColor.gray` — secondary, matches QUIT in GameOverModal.

**Scanline entry animation:**
A `::after` pseudo-element on `.multiplayer-modal` runs the scan on `@keyframes scan-open` when the component mounts. It's a `2px` tall `var(--blue-shadow)` tinted line, `opacity: 0.4`, that translates from `top: 0` to `top: 100%` over 400ms then sets `display: none`. The modal content stagger: header at `animation-delay: 50ms`, form card at `150ms`, button at `250ms` — all fade-in from `translateY(8px)`.

---

## Task 1: MultiplayerModal Component

**Files:**
- Create: `src/components/MultiplayerModal.vue`
- Create: `src/tests/unit/components/MultiplayerModal.test.ts`

---

### Step 1: Install `@vue/test-utils` if not present

Check whether `@vue/test-utils` is already available:

```bash
grep vue/test-utils /home/marcus/Projects/tic-tac-toe/package.json
```

If it prints nothing, install it:

```bash
cd /home/marcus/Projects/tic-tac-toe && npm install --save-dev @vue/test-utils
```

Expected after install: `package.json` devDependencies includes `"@vue/test-utils"`.

Also verify vitest is configured to handle `.vue` files. Open `vite.config.ts` and confirm it already has the `vue()` plugin (it does). Vitest uses the same config. No extra setup needed.

---

### Step 2: Create the test file with failing tests

Create `src/tests/unit/components/MultiplayerModal.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import MultiplayerModal from '@/components/MultiplayerModal.vue'

// Stub child components to isolate unit under test
const stubs = {
  BaseModal: {
    template: '<div v-if="show"><slot /></div>',
    props: ['show']
  },
  BaseButton: {
    template: '<button @click="$emit(\'click\')"><slot /></button>',
    emits: ['click']
  },
  PlayerSelector: {
    template: '<div data-testid="player-selector" />',
    props: ['xTypeSelected', 'oTypeSelected'],
    emits: ['update:xTypeSelected', 'update:oTypeSelected']
  }
}

function mountModal(props = {}) {
  return mount(MultiplayerModal, {
    props: { show: true, ...props },
    global: { stubs }
  })
}

describe('MultiplayerModal — tab switching', () => {
  it('shows the Create view by default', () => {
    const wrapper = mountModal()
    expect(wrapper.find('[data-testid="create-view"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="join-view"]').exists()).toBe(false)
  })

  it('switches to Join view when Join tab is clicked', async () => {
    const wrapper = mountModal()
    await wrapper.find('[data-testid="tab-join"]').trigger('click')
    expect(wrapper.find('[data-testid="join-view"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="create-view"]').exists()).toBe(false)
  })

  it('switches back to Create view when Create tab is clicked', async () => {
    const wrapper = mountModal()
    await wrapper.find('[data-testid="tab-join"]').trigger('click')
    await wrapper.find('[data-testid="tab-create"]').trigger('click')
    expect(wrapper.find('[data-testid="create-view"]').exists()).toBe(true)
  })
})

describe('MultiplayerModal — Create view', () => {
  it('renders PlayerSelector inside the Create view', () => {
    const wrapper = mountModal()
    expect(wrapper.find('[data-testid="player-selector"]').exists()).toBe(true)
  })

  it('emits @create with roomName, playerName, and playerType when Create is clicked', async () => {
    const wrapper = mountModal()

    await wrapper.find('[data-testid="input-player-name-create"]').setValue('Alice')
    await wrapper.find('[data-testid="input-room-name-create"]').setValue('room42')
    await wrapper.find('[data-testid="btn-create"]').trigger('click')

    expect(wrapper.emitted('create')).toBeTruthy()
    const [roomName, playerName, playerType] = wrapper.emitted('create')![0]
    expect(roomName).toBe('room42')
    expect(playerName).toBe('Alice')
    // default xTypeSelected = true → PlayerTypes.XPlayer (1)
    expect(playerType).toBe(1)
  })

  it('shows waiting state after Create is clicked', async () => {
    const wrapper = mountModal()
    await wrapper.find('[data-testid="input-player-name-create"]').setValue('Alice')
    await wrapper.find('[data-testid="input-room-name-create"]').setValue('room42')
    await wrapper.find('[data-testid="btn-create"]').trigger('click')

    expect(wrapper.find('[data-testid="waiting-state"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="create-view"]').exists()).toBe(false)
  })
})

describe('MultiplayerModal — Join view', () => {
  it('emits @join with roomName and playerName when Join is clicked', async () => {
    const wrapper = mountModal()
    await wrapper.find('[data-testid="tab-join"]').trigger('click')

    await wrapper.find('[data-testid="input-player-name-join"]').setValue('Bob')
    await wrapper.find('[data-testid="input-room-name-join"]').setValue('room42')
    await wrapper.find('[data-testid="btn-join"]').trigger('click')

    expect(wrapper.emitted('join')).toBeTruthy()
    const [roomName, playerName] = wrapper.emitted('join')![0]
    expect(roomName).toBe('room42')
    expect(playerName).toBe('Bob')
  })

  it('shows waiting state after Join is clicked', async () => {
    const wrapper = mountModal()
    await wrapper.find('[data-testid="tab-join"]').trigger('click')
    await wrapper.find('[data-testid="input-player-name-join"]').setValue('Bob')
    await wrapper.find('[data-testid="input-room-name-join"]').setValue('room42')
    await wrapper.find('[data-testid="btn-join"]').trigger('click')

    expect(wrapper.find('[data-testid="waiting-state"]').exists()).toBe(true)
  })
})

describe('MultiplayerModal — Waiting state', () => {
  async function mountInWaitingState() {
    const wrapper = mountModal()
    await wrapper.find('[data-testid="input-player-name-create"]').setValue('Alice')
    await wrapper.find('[data-testid="input-room-name-create"]').setValue('room42')
    await wrapper.find('[data-testid="btn-create"]').trigger('click')
    return wrapper
  }

  it('shows "WAITING FOR OPPONENT..." text', async () => {
    const wrapper = await mountInWaitingState()
    expect(wrapper.find('[data-testid="waiting-state"]').text()).toContain('WAITING FOR OPPONENT')
  })

  it('emits @cancel when Cancel is clicked', async () => {
    const wrapper = await mountInWaitingState()
    await wrapper.find('[data-testid="btn-cancel"]').trigger('click')
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('returns to the form view after Cancel resets waiting state', async () => {
    const wrapper = await mountInWaitingState()
    await wrapper.find('[data-testid="btn-cancel"]').trigger('click')
    expect(wrapper.find('[data-testid="waiting-state"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="create-view"]').exists()).toBe(true)
  })
})
```

---

### Step 3: Run the tests to confirm they fail

```bash
cd /home/marcus/Projects/tic-tac-toe && npx vitest run src/tests/unit/components/MultiplayerModal.test.ts
```

Expected output: All tests fail with `Cannot find module '@/components/MultiplayerModal.vue'`.

---

### Step 4: Create the component

Create `src/components/MultiplayerModal.vue`:

```vue
<template>
  <BaseModal :show="show">
    <div class="multiplayer-modal">

      <!-- SCANLINE ENTRY — purely decorative, ARIA-hidden -->
      <div class="scanline" aria-hidden="true" />

      <!-- TAB TOGGLE (hidden during waiting) -->
      <div v-if="!isWaiting" class="tab-toggle" role="tablist">
        <div
          :class="['tab', activeTab === 'create' && 'tab--active']"
          data-testid="tab-create"
          role="tab"
          :aria-selected="activeTab === 'create'"
          @click="activeTab = 'create'"
        >
          CREATE
        </div>
        <div
          :class="['tab', activeTab === 'join' && 'tab--active']"
          data-testid="tab-join"
          role="tab"
          :aria-selected="activeTab === 'join'"
          @click="activeTab = 'join'"
        >
          JOIN
        </div>
      </div>

      <!-- CREATE VIEW -->
      <div
        v-if="!isWaiting && activeTab === 'create'"
        data-testid="create-view"
        class="view"
        role="tabpanel"
      >
        <div class="form-card">
          <div class="field">
            <label class="field-label" for="create-player-name">YOUR NAME</label>
            <input
              id="create-player-name"
              v-model="createPlayerName"
              data-testid="input-player-name-create"
              class="field-input"
              placeholder="ENTER NAME"
              maxlength="20"
              autocomplete="off"
            />
          </div>
          <div class="field">
            <label class="field-label" for="create-room-name">ROOM CODE</label>
            <input
              id="create-room-name"
              v-model="createRoomName"
              data-testid="input-room-name-create"
              class="field-input field-input--mono"
              placeholder="ENTER CODE"
              maxlength="20"
              autocomplete="off"
            />
          </div>
        </div>

        <PlayerSelector
          v-model:x-type-selected="xTypeSelected"
          v-model:o-type-selected="oTypeSelected"
        />

        <BaseButton
          :button-color="btnColors.blue"
          :is-large="true"
          data-testid="btn-create"
          @click="handleCreate"
        >
          CREATE ROOM
        </BaseButton>
      </div>

      <!-- JOIN VIEW -->
      <div
        v-if="!isWaiting && activeTab === 'join'"
        data-testid="join-view"
        class="view"
        role="tabpanel"
      >
        <div class="form-card">
          <div class="field">
            <label class="field-label" for="join-player-name">YOUR NAME</label>
            <input
              id="join-player-name"
              v-model="joinPlayerName"
              data-testid="input-player-name-join"
              class="field-input"
              placeholder="ENTER NAME"
              maxlength="20"
              autocomplete="off"
            />
          </div>
          <div class="field">
            <label class="field-label" for="join-room-name">ROOM CODE</label>
            <input
              id="join-room-name"
              v-model="joinRoomName"
              data-testid="input-room-name-join"
              class="field-input field-input--mono"
              placeholder="ENTER CODE"
              maxlength="20"
              autocomplete="off"
            />
          </div>
        </div>

        <BaseButton
          :button-color="btnColors.blue"
          :is-large="true"
          data-testid="btn-join"
          @click="handleJoin"
        >
          JOIN ROOM
        </BaseButton>
      </div>

      <!-- WAITING STATE -->
      <div v-if="isWaiting" data-testid="waiting-state" class="waiting">

        <!-- RADAR RING -->
        <div class="radar" aria-hidden="true">
          <div class="radar__sweep" />
          <div class="radar__inner" />
        </div>

        <!-- ROOM CODE PILL -->
        <div class="room-pill">
          <span class="room-pill__label">ROOM</span>
          <span class="room-pill__code">{{ activeRoomName }}</span>
        </div>

        <!-- STATUS TEXT -->
        <p class="waiting-text">
          WAITING FOR OPPONENT<span class="ellipsis"><span>.</span><span>.</span><span>.</span></span>
        </p>

        <BaseButton
          :button-color="btnColors.gray"
          :is-large="true"
          data-testid="btn-cancel"
          @click="handleCancel"
        >
          CANCEL
        </BaseButton>
      </div>

    </div>
  </BaseModal>
</template>

<script lang="ts">
import BaseModal from '@/components/base/BaseModal.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import PlayerSelector from '@/views/Home/PlayerSelector.vue'
import { BtnColor } from '@/enums/ButtonTypes'
import { PlayerTypes } from '@/enums/Players'

export default {
  name: 'MultiplayerModal',
  components: { BaseModal, BaseButton, PlayerSelector },
  props: {
    show: {
      type: Boolean,
      required: true
    }
  },
  emits: ['create', 'join', 'cancel'],
  data() {
    return {
      btnColors: BtnColor,
      activeTab: 'create' as 'create' | 'join',
      isWaiting: false,
      xTypeSelected: true,
      oTypeSelected: false,
      createPlayerName: '',
      createRoomName: '',
      joinPlayerName: '',
      joinRoomName: '',
      activeRoomName: ''
    }
  },
  methods: {
    handleCreate() {
      const playerType = this.xTypeSelected ? PlayerTypes.XPlayer : PlayerTypes.OPlayer
      this.activeRoomName = this.createRoomName
      this.$emit('create', this.createRoomName, this.createPlayerName, playerType)
      this.isWaiting = true
    },
    handleJoin() {
      this.activeRoomName = this.joinRoomName
      this.$emit('join', this.joinRoomName, this.joinPlayerName)
      this.isWaiting = true
    },
    handleCancel() {
      this.isWaiting = false
      this.$emit('cancel')
    }
  }
}
</script>

<style lang="scss" scoped>
// ─── GOOGLE FONT IMPORT ───────────────────────────────────────────────────────
// Share Tech Mono is loaded here (scoped to this component via @import in the
// style block). In production, add the <link> to index.html for better perf.
@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

// ─── LAYOUT ──────────────────────────────────────────────────────────────────

.multiplayer-modal {
  position: relative;
  width: 100%;
  padding: 2rem 1.5rem 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  overflow: hidden; // clips the scanline to modal bounds
}

// ─── SCANLINE ENTRY ───────────────────────────────────────────────────────────
// A single downward sweep on open — cinematic, not looping.
// The element is removed from paint after animation via forwards fill.

.scanline {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(
    to bottom,
    transparent,
    var(--blue-shadow) 40%,
    var(--blue) 50%,
    var(--blue-shadow) 60%,
    transparent
  );
  opacity: 0;
  pointer-events: none;
  z-index: 10;
  animation: scan-open 0.5s ease-in 0.05s forwards;
}

@keyframes scan-open {
  0%   { transform: translateY(0);    opacity: 0.5; }
  80%  { transform: translateY(calc(100vh - 3px)); opacity: 0.3; }
  100% { transform: translateY(calc(100vh - 3px)); opacity: 0; }
}

// ─── STAGGERED CONTENT FADE-IN ────────────────────────────────────────────────

.tab-toggle {
  animation: fade-up 0.25s ease both;
  animation-delay: 0.08s;
}

.view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  > .form-card {
    animation: fade-up 0.25s ease both;
    animation-delay: 0.16s;
  }

  > :deep(.selector) {
    animation: fade-up 0.25s ease both;
    animation-delay: 0.22s;
  }

  > button,
  > :last-child {
    animation: fade-up 0.25s ease both;
    animation-delay: 0.28s;
  }
}

@keyframes fade-up {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0);   }
}

// ─── TAB TOGGLE ───────────────────────────────────────────────────────────────
// Mirrors the X/O pill toggle in PlayerSelector exactly.

.tab-toggle {
  display: flex;
  justify-content: center;
  background: var(--dark-navy);
  padding: 0.5rem;
  border-radius: 0.75rem;
}

.tab {
  flex-grow: 1;
  padding: 0.75rem 1rem;
  border-radius: 0.625rem;
  text-align: center;
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: 0.875rem;
  letter-spacing: 1.5px;
  cursor: pointer;
  color: var(--silver);
  transition: background 0.15s ease, color 0.15s ease;
  user-select: none;

  &--active {
    background: var(--silver);
    color: var(--dark-navy);
  }

  &:not(&--active):hover {
    color: var(--silver-hover);
  }
}

// ─── FORM CARD ────────────────────────────────────────────────────────────────
// Same inset-shadow panel treatment as PlayerSelector's .selector card.

.form-card {
  background: var(--semi-dark-navy);
  border-radius: 1rem;
  box-shadow: inset 0 -0.5rem 0 #10212a;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field-label {
  display: block;
  font-family: 'Outfit', sans-serif;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--silver);
  opacity: 0.55;
  text-transform: uppercase;
}

.field-input {
  width: 100%;
  background: var(--dark-navy);
  border: none;
  border-bottom: 2px solid transparent;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  color: var(--silver);
  // Body inputs use Outfit — monospace only activates on focused mono inputs
  font-family: 'Outfit', sans-serif;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 1px;
  outline: none;
  transition: border-color 0.15s ease, color 0.15s ease;

  &::placeholder {
    font-family: 'Outfit', sans-serif;
    opacity: 0.25;
    font-weight: 400;
    letter-spacing: 1px;
  }

  &:focus {
    border-bottom-color: var(--blue);
    color: var(--silver-hover);
  }

  // Room code fields use Share Tech Mono — the live data signal treatment
  &--mono {
    font-family: 'Share Tech Mono', monospace;
    letter-spacing: 2px;
    font-size: 0.9375rem;

    &:focus {
      color: var(--blue-hover);
    }
  }
}

// ─── WAITING STATE ────────────────────────────────────────────────────────────

.waiting {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  padding: 0.75rem 0 0.5rem;
  animation: fade-up 0.3s ease both;
}

// RADAR RING
// A rotating conic-gradient sweep layered over a solid ring — pure CSS radar.

.radar {
  position: relative;
  width: 5.5rem;
  height: 5.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.radar__sweep {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  // Static outer ring
  border: 2px solid var(--blue);
  opacity: 0.45;
  // Rotating radar arm via conic-gradient on a pseudo-element
  &::after {
    content: '';
    position: absolute;
    inset: -2px; // cover the border
    border-radius: 50%;
    background: conic-gradient(
      from 0deg,
      transparent 75%,
      var(--blue-shadow) 88%,
      var(--blue) 100%
    );
    animation: radar-spin 2s linear infinite;
  }
}

.radar__inner {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  background: var(--blue);
  box-shadow: 0 0 12px 4px rgba(49, 195, 189, 0.35);
  animation: radar-pulse 1.8s ease-in-out infinite;
  position: relative;
  z-index: 1;
}

@keyframes radar-spin {
  to { transform: rotate(360deg); }
}

@keyframes radar-pulse {
  0%, 100% { transform: scale(1);    opacity: 1; }
  50%       { transform: scale(0.82); opacity: 0.7; }
}

// ROOM CODE PILL

.room-pill {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  background: var(--semi-dark-navy);
  border: 1px solid var(--blue);
  border-radius: 0.5rem;
  padding: 0.375rem 0.875rem;
  box-shadow: inset 0 -2px 0 #10212a, 0 0 8px rgba(49, 195, 189, 0.15);
}

.room-pill__label {
  font-family: 'Outfit', sans-serif;
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--silver);
  opacity: 0.5;
  text-transform: uppercase;
}

.room-pill__code {
  font-family: 'Share Tech Mono', monospace;
  font-size: 1rem;
  letter-spacing: 3px;
  color: var(--blue);
  text-transform: uppercase;
}

// STATUS TEXT with CSS ellipsis animation

.waiting-text {
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: 0.8125rem;
  letter-spacing: 2px;
  color: var(--silver);
  opacity: 0.8;
  display: flex;
  align-items: baseline;
  gap: 0;
}

.ellipsis {
  display: inline-flex;

  span {
    opacity: 0;
    animation: dot-blink 1.4s ease-in-out infinite both;

    &:nth-child(1) { animation-delay: 0s;     }
    &:nth-child(2) { animation-delay: 0.2s;   }
    &:nth-child(3) { animation-delay: 0.4s;   }
  }
}

@keyframes dot-blink {
  0%, 60%, 100% { opacity: 0; }
  30%           { opacity: 1; }
}
</style>
```

---

### Step 5: Run tests to confirm they pass

```bash
cd /home/marcus/Projects/tic-tac-toe && npx vitest run src/tests/unit/components/MultiplayerModal.test.ts
```

Expected output:
```
✓ MultiplayerModal — tab switching > shows the Create view by default
✓ MultiplayerModal — tab switching > switches to Join view when Join tab is clicked
✓ MultiplayerModal — tab switching > switches back to Create view when Create tab is clicked
✓ MultiplayerModal — Create view > renders PlayerSelector inside the Create view
✓ MultiplayerModal — Create view > emits @create with roomName, playerName, and playerType when Create is clicked
✓ MultiplayerModal — Create view > shows waiting state after Create is clicked
✓ MultiplayerModal — Join view > emits @join with roomName and playerName when Join is clicked
✓ MultiplayerModal — Join view > shows waiting state after Join is clicked
✓ MultiplayerModal — Waiting state > shows "WAITING FOR OPPONENT..." text
✓ MultiplayerModal — Waiting state > emits @cancel when Cancel is clicked
✓ MultiplayerModal — Waiting state > returns to the form view after Cancel resets waiting state

Test Files  1 passed (1)
Tests       11 passed (11)
```

---

### Step 6: Commit

```bash
cd /home/marcus/Projects/tic-tac-toe && git add src/components/MultiplayerModal.vue src/tests/unit/components/MultiplayerModal.test.ts && git commit -m "feat: add MultiplayerModal component with create/join views and waiting state"
```

---

## Task 2: Wire MultiplayerModal into Home/index.vue

**Files:**
- Modify: `src/views/Home/index.vue`
- Create: `src/tests/unit/views/Home.test.ts`

---

### Step 1: Write the failing test

Create `src/tests/unit/views/Home.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import HomePage from '@/views/Home/index.vue'

// Minimal Vuex store — activateGame mutation captured for assertions
function makeStore() {
  const activateGame = vi.fn()
  const store = createStore({
    state: () => ({}),
    mutations: { activateGame }
  })
  return { store, activateGame }
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
    template: '<div data-testid="multiplayer-modal" :data-show="show"><slot /></div>',
    props: ['show'],
    emits: ['create', 'join', 'cancel']
  }
}

function mountHome() {
  const { store, activateGame } = makeStore()
  const wrapper = mount(HomePage, {
    global: {
      plugins: [store],
      stubs
    }
  })
  return { wrapper, activateGame }
}

describe('Home — MultiplayerModal visibility', () => {
  it('does not show MultiplayerModal on initial render', () => {
    const { wrapper } = mountHome()
    expect(wrapper.find('[data-testid="multiplayer-modal"]').attributes('data-show')).toBe('false')
  })

  it('opens MultiplayerModal when "VS PLAYER" button is clicked', async () => {
    const { wrapper } = mountHome()
    // The VS PLAYER button is the second BaseButton (index 1)
    const buttons = wrapper.findAll('button')
    await buttons[1].trigger('click')
    expect(wrapper.find('[data-testid="multiplayer-modal"]').attributes('data-show')).toBe('true')
  })
})

describe('Home — MultiplayerModal event handling', () => {
  async function openModal(wrapper: ReturnType<typeof mount>) {
    const buttons = wrapper.findAll('button')
    await buttons[1].trigger('click')
  }

  it('closes the modal and does NOT call activateGame when @cancel is emitted', async () => {
    const { wrapper, activateGame } = mountHome()
    await openModal(wrapper)

    await wrapper.find('[data-testid="multiplayer-modal"]').trigger('cancel')
    expect(wrapper.find('[data-testid="multiplayer-modal"]').attributes('data-show')).toBe('false')
    expect(activateGame).not.toHaveBeenCalled()
  })
})
```

> **Note on `@create` and `@join` tests:** These events will trigger backend calls in Phase 2. For Phase 1, the parent only closes the modal on `@cancel`. The `@create` and `@join` handlers in Phase 1 are stubs (console.log placeholders). Tests for the full flow belong in Phase 2 once the service layer exists.

---

### Step 2: Run the test to confirm it fails

```bash
cd /home/marcus/Projects/tic-tac-toe && npx vitest run src/tests/unit/views/Home.test.ts
```

Expected: Tests fail — `MultiplayerModal` is not imported in `Home/index.vue` yet.

---

### Step 3: Update Home/index.vue

Replace `src/views/Home/index.vue` with:

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
      @create="handleMultiplayerCreate"
      @join="handleMultiplayerJoin"
      @cancel="closeMultiplayerModal"
    />
  </div>
</template>

<script lang="ts">
import BaseButton from '@/components/base/BaseButton.vue'
import PlayerSelector from './PlayerSelector.vue'
import MultiplayerModal from '@/components/MultiplayerModal.vue'
import { BtnColor } from '@/enums/ButtonTypes'
import { Players } from '@/enums/Players'
import { PlayerTypes } from '@/enums/Players'
import { mapMutations } from 'vuex'

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
      showMultiplayerModal: false
    }
  },
  methods: {
    ...mapMutations(['activateGame']),
    startIAGame() {
      this.activateGame({ ...this.players, oponentIsAI: true })
    },
    openMultiplayerModal() {
      this.showMultiplayerModal = true
    },
    closeMultiplayerModal() {
      this.showMultiplayerModal = false
    },
    handleMultiplayerCreate(roomName: string, playerName: string, playerType: PlayerTypes) {
      // Phase 2: call MultiplayerService.createRoom(roomName) then joinRoom(roomName, playerName)
      console.log('create', { roomName, playerName, playerType })
    },
    handleMultiplayerJoin(roomName: string, playerName: string) {
      // Phase 2: call MultiplayerService.joinRoom(roomName, playerName)
      console.log('join', { roomName, playerName })
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
</style>
```

---

### Step 4: Run tests to confirm they pass

```bash
cd /home/marcus/Projects/tic-tac-toe && npx vitest run src/tests/unit/views/Home.test.ts
```

Expected output:
```
✓ Home — MultiplayerModal visibility > does not show MultiplayerModal on initial render
✓ Home — MultiplayerModal visibility > opens MultiplayerModal when "VS PLAYER" button is clicked
✓ Home — MultiplayerModal event handling > closes the modal and does NOT call activateGame when @cancel is emitted

Test Files  1 passed (1)
Tests       3 passed (3)
```

---

### Step 5: Run the full test suite to confirm nothing regressed

```bash
cd /home/marcus/Projects/tic-tac-toe && npx vitest run
```

Expected: All test files pass. If `src/tests/unit/services/GameService.test.ts` or `BoardService.test.ts` fail for unrelated reasons, check whether the `vitest` config in `vite.config.ts` needs a `test` block. Add it if missing:

```typescript
// vite.config.ts — add inside defineConfig({})
test: {
  globals: true,
  environment: 'jsdom'
}
```

Then re-run: `npx vitest run`

---

### Step 6: Smoke test in the browser

```bash
cd /home/marcus/Projects/tic-tac-toe && npm run dev
```

Open `http://localhost:5173`. Click "NEW GAME (VS PLAYER)":

- Modal opens over the dark navy overlay
- A teal scanline sweeps downward on open, then the content fades up in staggered layers
- CREATE / JOIN tab toggle appears (pill style, same as X/O selector)
- Create tab: YOUR NAME field (Outfit font), ROOM CODE field (Share Tech Mono — monospaced as you type)
- PlayerSelector X/O toggle, CREATE ROOM button
- Join tab: same field pair, JOIN ROOM button
- Fill fields and click CREATE ROOM: radar ring appears (rotating conic sweep + breathing inner dot), room code displays in a teal-bordered pill in Share Tech Mono, "WAITING FOR OPPONENT..." text with staggered dot ellipsis
- Click CANCEL: returns to Create form, modal remains open (parent owns close logic in Phase 1)

---

### Step 7: Commit

```bash
cd /home/marcus/Projects/tic-tac-toe && git add src/views/Home/index.vue src/tests/unit/views/Home.test.ts && git commit -m "feat: wire MultiplayerModal into Home screen on VS PLAYER click"
```

---

## Summary

After both tasks:

| File | Status |
|---|---|
| `src/components/MultiplayerModal.vue` | Created |
| `src/tests/unit/components/MultiplayerModal.test.ts` | Created (11 tests) |
| `src/views/Home/index.vue` | Modified (opens modal instead of direct game start) |
| `src/tests/unit/views/Home.test.ts` | Created (3 tests) |

Phase 2 will replace the `console.log` stubs in `handleMultiplayerCreate` and `handleMultiplayerJoin` with real `MultiplayerService` calls and Vuex store mutations.
