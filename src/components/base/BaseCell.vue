<template>
  <div class="cell" :class="color" @mouseenter="hover = true" @mouseleave="hover = false">
    <KeepAlive>
      <BaseIcon v-if="selectedIcon != null" :icon-type="icon" />
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
    },
    belongsToWinnerPath: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  mounted() {
    console.log(this.belongsToWinnerPath, this.selectedIcon)
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
    },
    icon(): IconType {
      if (!this.belongsToWinnerPath) {
        return this.selectedIcon as IconType
      }

      if (this.selectedIcon == IconType.X) {
        return IconType.X_dark
      }

      return IconType.O_dark
    },
    color() {
      if (!this.belongsToWinnerPath) {
        return ''
      }

      if (this.selectedIcon == IconType.X) {
        return 'blue'
      }

      return 'yellow'
    }
  }
}
</script>

<style lang="scss" scoped>
.cell {
  --bg-cell: var(--semi-dark-navy);
  --border-color: #10212a;

  background: var(--bg-cell);
  box-shadow: inset 0 -0.5rem 0 var(--border-color);
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

.yellow {
  --bg-cell: var(--yellow);
  --border-color: var(--yellow-shadow);
}

.blue {
  --bg-cell: var(--blue);
  --border-color: var(--blue-shadow);
}
@media (min-width: 767px) {
  .cell {
    border-radius: 1rem;
  }
}
</style>
