<template>
  <BaseModal :show="show">
    <div class="container">
      <div class="messages">
        <!-- TIE -->
        <h3 v-if="winner == -1">{{ $t('gameOverModal.roundTied') }}</h3>
        <!-- O player -->
        <div class="player" v-else-if="winner == playerTypes.OPlayer">
          <p>{{ winnerName ?? $t('gameOverModal.playerWins', { n: playerWinner }) }}</p>
          <h3 class="flex-header">
            <BaseIcon :icon-type="icons.O" class="icon" />
            <span class="yellow">{{ $t('gameOverModal.takesTheRound') }}</span>
          </h3>
        </div>
        <!-- X player -->
        <div class="player" v-else-if="winner == playerTypes.XPlayer">
          <p>{{ winnerName ?? $t('gameOverModal.playerWins', { n: playerWinner }) }}</p>
          <h3 class="flex-header">
            <BaseIcon :icon-type="icons.X" class="icon" />
            <span class="blue">{{ $t('gameOverModal.takesTheRound') }}</span>
          </h3>
        </div>
        <p v-if="waiting" class="waiting-text">{{ $t('gameOverModal.waitingForOpponent') }}</p>
      </div>
      <div class="btn-group">
        <BaseButton :button-color="colors.gray" @click="$emit('quit')">{{
          $t('gameOverModal.quit')
        }}</BaseButton>
        <BaseButton v-if="!waiting" :button-color="colors.yellow" @click="$emit('next')">{{
          $t('gameOverModal.nextRound')
        }}</BaseButton>
      </div>
    </div>
  </BaseModal>
</template>

<script lang="ts">
import BaseModal from './base/BaseModal.vue'
import BaseButton from './base/BaseButton.vue'
import BaseIcon from './base/BaseIcon.vue'
import { BtnColor } from '@/enums/ButtonTypes'
import { PlayerTypes } from '@/enums/Players'
import { IconType } from '@/enums/IconTypes'

export default {
  name: 'GameOverModal',
  emits: ['quit', 'next'],
  components: {
    BaseModal,
    BaseButton,
    BaseIcon
  },
  props: {
    show: Boolean,
    winner: {
      type: Number,
      required: true
    },
    playerWinner: {
      type: Number,
      required: false,
      default: undefined
    },
    waiting: {
      type: Boolean,
      default: false
    },
    winnerName: {
      type: String,
      default: null
    }
  },
  computed: {
    colors() {
      return BtnColor
    },
    playerTypes() {
      return PlayerTypes
    },
    icons() {
      return IconType
    }
  }
}
</script>

<style lang="scss" scoped>
.container {
  height: 16.5rem;
  display: flex;
  text-align: center;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  gap: 1.5rem;
  h3 {
    font-size: 2rem;
    letter-spacing: 1.5px;
  }
}
.btn-group {
  display: flex;
  gap: 1rem;
}
.player {
  display: flex;
  flex-direction: column;
  gap: 1rem;

  p {
    font-weight: 700;
  }
}

.flex-header {
  display: flex;
  gap: 0.5rem;
  align-items: center;

  .icon {
    width: 2rem;
    height: 2rem;
  }

  .yellow {
    color: var(--yellow);
  }

  .blue {
    color: var(--blue);
  }
}

.waiting-text {
  font-weight: 700;
  letter-spacing: 1px;
  margin-top: 0.5rem;
}
</style>
