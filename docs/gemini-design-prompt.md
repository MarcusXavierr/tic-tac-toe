# Gemini Design Prompt — Multiplayer Components

Paste the content below directly into Gemini.

---

## Prompt

I'm building a multiplayer feature for a tic-tac-toe game and need you to design two new Vue 3 components. Before designing, read all the context below carefully so the new components feel native to the existing game.

---

### Existing Game Aesthetic

The game has a retro/arcade dark theme. Here's everything you need to match it:

**Color palette (CSS variables):**
```css
--dark-navy: #1A2A33;       /* page background */
--semi-dark-navy: #1F3641;  /* card/modal backgrounds */
--silver: #A8BFC9;          /* default text, gray buttons */
--silver-hover: #DBE8ED;
--blue: #31C3BD;             /* teal accent, X player color */
--blue-hover: #65E9E4;
--yellow: #F2B137;           /* Y player color, secondary CTA */
--yellow-hover: #FFC860;
--yellow-shadow: #CC8B13;
--blue-shadow: #118C87;
--silver-shadow: #6B8997;
```

**Typography:** `"Outfit"` (Google Fonts), bold, ALL CAPS, `letter-spacing: 1px`. No other fonts currently in use.

**Button style** (from `BaseButton.vue`):
- Rounded corners (`border-radius: 0.75rem` normal, `1rem` large)
- `box-shadow: inset 0px -0.25rem 0px var(--btn-color-shadow)` — the "3D pressed" effect
- On `:active`: shifts down slightly (the shadow squishes)
- Colors: teal (blue), yellow, or silver/gray
- All caps, bold, dark navy text

**Card/panel style** (from `PlayerSelector.vue`):
- `background: var(--semi-dark-navy)`
- `border-radius: 1rem`
- `box-shadow: inset 0 -0.5rem 0 #10212a` — deeper inset shadow for cards
- Inner toggle track: `background: var(--dark-navy)`, `border-radius: 0.75rem`
- Active pill: `background: var(--silver)`, `border-radius: 1rem`

**Modal base** (from `BaseModal.vue`):
- Full-screen overlay: `background: rgba(0,0,0,0.5)`
- Container: `background: var(--semi-dark-navy)`, centered, full width

**Existing modal example** (from `GameOverModal.vue`):
```
┌──────────────────────────────┐
│                              │
│     PLAYER 1 WINS!           │
│   [X icon] TAKES THE ROUND   │
│                              │
│   [ QUIT ]   [ NEXT ROUND ]  │
│                              │
└──────────────────────────────┘
```
Height ~16.5rem, vertically centered content, `gap: 1.5rem` between sections.

---

### Component 1: MultiplayerModal

**Purpose:** Opens when the user clicks "NEW GAME (VS PLAYER)". Lets them create a new room or join an existing one, then waits for an opponent.

**Three views inside the same modal:**

#### View A — Create Room
- Toggle to switch between "Create" and "Join" (tab-style, like the X/O selector pill)
- Input: player name
- Input: room name/code
- X/O selector (reuse the existing pill toggle — `PlayerSelector` component)
- CTA button: "CREATE ROOM" (teal/blue)

#### View B — Join Room
- Same toggle, "Join" tab active
- Input: player name
- Input: room name/code
- CTA button: "JOIN ROOM" (teal/blue)

#### View C — Waiting for Opponent
- Replaces the form content entirely (same modal, same size)
- Shows the room code the player entered (so they can share it)
- "Waiting for opponent..." with some kind of animated treatment
- Cancel button (gray/silver)

**Notes:**
- The modal should feel like a game lobby, not a generic form
- The room name/code input should feel like entering a channel or broadcast frequency
- Inputs should be styled to match the game's dark panel aesthetic (no white inputs)

---

### Component 2: OpponentDisconnectedModal

**Purpose:** Shows when the opponent closes their WebSocket connection mid-game.

**Content:**
- A short, punchy message (something like "OPPONENT DISCONNECTED" or "CONNECTION LOST")
- Optional: a small visual treatment (icon, indicator)
- One button: "BACK TO HOME" (gray/silver)

**Notes:**
- This should feel like a system/terminal alert — abrupt and clear
- Match the size and shape of `GameOverModal` (~16.5rem height)
- No need for animations — it appears suddenly, which is appropriate

---

### What I need from you

For **each component**, provide:

1. **Design rationale** — what aesthetic choices you're making and why they fit the existing game
2. **Complete Vue 3 component** with:
   - `<template>` — full markup
   - `<script lang="ts">` — Options API (not Composition API), props and emits defined
   - `<style lang="scss" scoped>` — complete styles using the CSS variables above

**Constraints:**
- Use only the CSS variables listed above — no new color values
- Options API only (all existing components use it)
- SCSS with `scoped`
- `BaseModal`, `BaseButton` are available as child components
- Font is `"Outfit"` — it's already loaded globally, just use it
- ALL CAPS for labels and button text (existing convention)
- No external UI libraries

**Emits for MultiplayerModal:**
- `@create(roomName: string, playerName: string, playerType: 'x' | 'o')`
- `@join(roomName: string, playerName: string)`
- `@cancel`

**Emits for OpponentDisconnectedModal:**
- `@close`

Go for it.
