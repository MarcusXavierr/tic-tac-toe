<template>
  <BaseModal :show="show" @close="handleCancel">
    <div class="multiplayer-modal">
      <!-- TAB TOGGLE (hidden during waiting) -->
      <div v-if="!isWaiting" class="tab-toggle">
        <div class="tab-track" role="tablist">
          <div
            :class="['tab', activeTab === 'create' && 'tab--active']"
            data-testid="tab-create"
            role="tab"
            :aria-selected="activeTab === 'create'"
            @click="activeTab = 'create'"
          >
            {{ $t('multiplayerModal.create') }}
          </div>
          <div
            :class="['tab', activeTab === 'join' && 'tab--active']"
            data-testid="tab-join"
            role="tab"
            :aria-selected="activeTab === 'join'"
            @click="activeTab = 'join'"
          >
            {{ $t('multiplayerModal.join') }}
          </div>
        </div>
      </div>

      <!-- CREATE VIEW -->
      <div
        v-if="!isWaiting && activeTab === 'create'"
        data-testid="create-view"
        class="view"
        role="tabpanel"
      >
        <BaseTextInput
          v-model="createPlayerName"
          :label="$t('multiplayerModal.yourName')"
          :placeholder="$t('multiplayerModal.enterName')"
          :maxlength="20"
          data-testid="input-player-name-create"
        />

        <BaseTextInput
          v-model="createRoomName"
          :label="$t('multiplayerModal.roomCode')"
          :placeholder="$t('multiplayerModal.enterCode')"
          :maxlength="20"
          data-testid="input-room-name-create"
        />

        <PlayerSelector
          v-model:x-type-selected="xTypeSelected"
          v-model:o-type-selected="oTypeSelected"
        />

        <p v-if="errorMessage" class="error-message" data-testid="error-message-create">
          {{ errorMessage }}
        </p>

        <BaseButton
          :button-color="btnColors.blue"
          :is-large="true"
          :disabled="!isCreateValid"
          data-testid="btn-create"
          @click="handleCreate"
        >
          {{ $t('multiplayerModal.createRoom') }}
        </BaseButton>
      </div>

      <!-- JOIN VIEW -->
      <div
        v-if="!isWaiting && activeTab === 'join'"
        data-testid="join-view"
        class="view"
        role="tabpanel"
      >
        <BaseTextInput
          v-model="joinPlayerName"
          :label="$t('multiplayerModal.yourName')"
          :placeholder="$t('multiplayerModal.enterName')"
          :maxlength="20"
          data-testid="input-player-name-join"
        />

        <BaseTextInput
          v-model="joinRoomName"
          :label="$t('multiplayerModal.roomCode')"
          :placeholder="$t('multiplayerModal.enterCode')"
          :maxlength="20"
          data-testid="input-room-name-join"
        />

        <p v-if="errorMessage" class="error-message" data-testid="error-message-join">
          {{ errorMessage }}
        </p>

        <BaseButton
          :button-color="btnColors.yellow"
          :is-large="true"
          :disabled="!isJoinValid"
          data-testid="btn-join"
          @click="handleJoin"
        >
          {{ $t('multiplayerModal.joinRoom') }}
        </BaseButton>
      </div>

      <!-- WAITING STATE -->
      <div
        v-if="isWaiting"
        :class="['waiting', oTypeSelected && 'waiting--o']"
        data-testid="waiting-state"
      >
        <!-- RADAR RING -->
        <div class="radar" aria-hidden="true">
          <div class="radar__sweep" />
          <div class="radar__inner" />
        </div>

        <!-- ROOM CODE PILL -->
        <div class="room-pill">
          <span class="room-pill__label">{{ $t('multiplayerModal.room') }}</span>
          <span class="room-pill__code">{{ activeRoomName }}</span>
        </div>

        <!-- STATUS TEXT -->
        <p class="waiting-text">
          {{ $t('multiplayerModal.waitingForOpponent')
          }}<span class="ellipsis"><span>.</span><span>.</span><span>.</span></span>
        </p>

        <BaseButton
          :button-color="btnColors.gray"
          :is-large="true"
          data-testid="btn-cancel"
          @click="handleCancel"
        >
          {{ $t('multiplayerModal.cancel') }}
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>

<script lang="ts">
import BaseModal from '@/components/base/BaseModal.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseTextInput from '@/components/base/BaseTextInput.vue'
import PlayerSelector from '@/views/Home/PlayerSelector.vue'
import { BtnColor } from '@/enums/ButtonTypes'
import { PlayerTypes } from '@/enums/Players'

export default {
  name: 'MultiplayerModal',
  components: { BaseModal, BaseButton, BaseTextInput, PlayerSelector },
  props: {
    show: {
      type: Boolean,
      required: true
    },
    errorMessage: {
      type: String,
      default: ''
    }
  },
  emits: ['create', 'join', 'cancel', 'error-clear'],
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
  computed: {
    isCreateValid(): boolean {
      return this.createPlayerName.trim().length > 0 && this.createRoomName.trim().length > 0
    },
    isJoinValid(): boolean {
      return this.joinPlayerName.trim().length > 0 && this.joinRoomName.trim().length > 0
    }
  },
  watch: {
    errorMessage(val: string) {
      if (val) this.isWaiting = false
    },
    createPlayerName() {
      this.clearError()
    },
    createRoomName() {
      this.clearError()
    },
    joinPlayerName() {
      this.clearError()
    },
    joinRoomName() {
      this.clearError()
    },
    activeTab() {
      this.clearError()
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
      ;(this as any).$emit('cancel')
    },
    clearError() {
      if ((this as any).errorMessage) (this as any).$emit('error-clear')
    }
  }
}
</script>

<style lang="scss" scoped>
// ─── LAYOUT ──────────────────────────────────────────────────────────────────

:deep(.modal-container) {
  max-width: 30rem;
  width: calc(100% - 2rem);
  border-radius: 1rem;
  margin: auto;
  background: var(--dark-navy);
}

.multiplayer-modal {
  position: relative;
  width: 100%;
  padding: 2rem 1.5rem 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  overflow: hidden;
}

// ─── STAGGERED CONTENT FADE-IN ────────────────────────────────────────────────

.tab-toggle {
  animation: fade-up 0.25s ease both;
  animation-delay: 0.05s;
}

.view {
  display: flex;
  flex-direction: column;
  gap: 1rem;

  > * {
    animation: fade-up 0.25s ease both;
  }

  > *:nth-child(1) {
    animation-delay: 0.1s;
  }
  > *:nth-child(2) {
    animation-delay: 0.16s;
  }
  > *:nth-child(3) {
    animation-delay: 0.22s;
  }
  > *:nth-child(4) {
    animation-delay: 0.28s;
  }
  > *:nth-child(5) {
    animation-delay: 0.34s;
  }
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// ─── TAB TOGGLE ───────────────────────────────────────────────────────────────

.tab-toggle {
  background: var(--semi-dark-navy);
  border-radius: 1rem;
  box-shadow: inset 0 -0.5rem 0 #10212a;
  padding: 1.25rem 1.5rem 1.75rem;
}

.tab-track {
  display: flex;
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

// ─── ERROR MESSAGE ────────────────────────────────────────────────────────────

.error-message {
  font-family: 'Outfit', sans-serif;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: #e36262;
  text-align: center;
  animation: fade-up 0.2s ease both;
}

// ─── WAITING STATE ────────────────────────────────────────────────────────────

.waiting {
  --w-color: var(--blue);
  --w-shadow: var(--blue-shadow);
  --w-glow: rgba(49, 195, 189, 0.35);

  &--o {
    --w-color: var(--yellow);
    --w-shadow: var(--yellow-shadow);
    --w-glow: rgba(242, 177, 55, 0.35);
  }

  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  padding: 0.75rem 0 0.5rem;
  animation: fade-up 0.3s ease both;
}

// RADAR RING

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
  border: 2px solid var(--w-color);
  opacity: 0.45;

  &::after {
    content: '';
    position: absolute;
    inset: -2px;
    border-radius: 50%;
    background: conic-gradient(
      from 0deg,
      transparent 75%,
      var(--w-shadow) 88%,
      var(--w-color) 100%
    );
    animation: radar-spin 2s linear infinite;
  }
}

.radar__inner {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  background: var(--w-color);
  box-shadow: 0 0 12px 4px var(--w-glow);
  animation: radar-pulse 1.8s ease-in-out infinite;
  position: relative;
  z-index: 1;
}

@keyframes radar-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes radar-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(0.82);
    opacity: 0.7;
  }
}

// ROOM CODE PILL

.room-pill {
  display: flex;
  align-items: baseline;
  gap: 0.625rem;
  background: var(--semi-dark-navy);
  border: 1px solid var(--w-color);
  border-radius: 0.5rem;
  padding: 0.375rem 0.875rem;
  box-shadow: inset 0 -2px 0 #10212a, 0 0 8px var(--w-glow);
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
  color: var(--w-color);
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

    &:nth-child(1) {
      animation-delay: 0s;
    }
    &:nth-child(2) {
      animation-delay: 0.2s;
    }
    &:nth-child(3) {
      animation-delay: 0.4s;
    }
  }
}

@keyframes dot-blink {
  0%,
  60%,
  100% {
    opacity: 0;
  }
  30% {
    opacity: 1;
  }
}
</style>
