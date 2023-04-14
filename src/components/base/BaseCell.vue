<template>
  <div class="cell" @mouseenter="hover = true" @mouseleave="hover = false">
    <KeepAlive>
      <BaseIcon v-if="selectedIcon != null" :icon-type="selectedIcon"/>
      <BaseIcon v-else-if="hover && !isWaitingToPlay" :icon-type="hoverIcon" />
    </KeepAlive>
  </div>
</template>

<script lang="ts">
import { mapState } from 'vuex'
import BaseIcon from '../base/BaseIcon.vue'
import { PlayerTypes } from '@/enums/Players'
import { IconType } from '@/enums/IconTypes'
import type { PropType } from 'vue'

export default {
  name: 'BaseCell',
  components: { BaseIcon },
  data() {
    return {
      hover: false
    }
  },
  props: {
    selectedIcon: {
      type: Number as PropType<IconType | null>,
      required: false,
      default: null
    }
  },
  computed: {
    ...mapState(['currentPlayerType', 'isWaitingToPlay']),
    hoverIcon() {
      if (this.currentPlayerType == PlayerTypes.OPlayer) {
        return IconType.O_outline
      }
      if (this.currentPlayerType == PlayerTypes.XPlayer) {
        return IconType.X_outline
      }
      return -1
    }
  }
}
</script>

<style scoped>
.cell {
  background: var(--semi-dark-navy);
  box-shadow: inset 0 -0.5rem 0 #10212a;
  padding-bottom: 0.5rem;
  border-radius: 0.75rem;
  min-height: 96px;
  min-width: 96px;
  aspect-ratio: 1/1;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

@media (min-width: 767px) {
  .cell {
    border-radius: 1rem;
  }
}
</style>
