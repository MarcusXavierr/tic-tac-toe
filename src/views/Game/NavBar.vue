<template>
  <nav class="navbar">
    <BaseButton :button-color="buttonOptions.gray" :is-small="true" @click="quitGameWithCleanup()">
      <span class="material-symbols-outlined">arrow_back</span>
    </BaseButton>
    <div class="turn">
      <img :src="iconPath" alt="icon representing actual turn" width="16" />
      TURN
    </div>
    <div v-if="isMultiplayer" class="opponent-badge" :class="opponentBadgeColor">
      <img :src="opponentIconPath" alt="opponent icon" width="16" />
      {{ opponentName }}
    </div>
    <template v-else>
      <BaseButton :button-color="buttonOptions.gray" :is-small="true" @click="show()">
        <BaseIcon :icon-type="iconOptions.Restart" />
      </BaseButton>
      <RetryGameModal
        :show="showModal"
        @close="showModal = false"
        @restart="restart()"
      ></RetryGameModal>
    </template>
  </nav>
</template>

<script lang="ts">
import XIcon from '@/assets/gray-icons/icon-x.svg'
import OIcon from '@/assets/gray-icons/icon-o.svg'
import XDarkIcon from '@/assets/icon-x-dark.svg'
import ODarkIcon from '@/assets/icon-o-dark.svg'

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
    ...mapState(['currentPlayerType', 'isMultiplayer', 'myPlayerType', 'opponentName']),
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
    },
    opponentPlayerType(): PlayerTypes {
      const myPlayerType = (this as any).myPlayerType
      return myPlayerType === PlayerTypes.XPlayer
        ? PlayerTypes.OPlayer
        : PlayerTypes.XPlayer
    },
    opponentBadgeColor(): string {
      return (this as any).opponentPlayerType === PlayerTypes.XPlayer ? 'blue' : 'yellow'
    },
    opponentIconPath(): string {
      return (this as any).opponentPlayerType === PlayerTypes.XPlayer ? XDarkIcon : ODarkIcon
    }
  }
}
</script>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.turn {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  background: var(--semi-dark-navy);
  padding: 0.5rem 1rem 0.75rem 1rem;
  box-shadow: inset 0px -4px 0px #10212a;
  border-radius: 0.25rem;
}

.opponent-badge {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem 0.75rem 1rem;
  box-shadow: inset 0px -4px 0px rgba(0, 0, 0, 0.25);
  border-radius: 0.25rem;
  font-weight: 700;
  font-size: 0.875rem;
  letter-spacing: 0.05em;
  color: var(--dark-navy);
}

.opponent-badge.blue {
  background: var(--blue);
}

.opponent-badge.yellow {
  background: var(--yellow);
}

.material-symbols-outlined {
  font-size: 1.25rem;
  line-height: 1;
}
</style>
