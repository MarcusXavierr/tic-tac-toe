<template>
  <nav class="navbar">
    <img src="@/assets/logo.svg" alt="" />
    <div class="turn">
      <img :src="iconPath" alt="icon representing actual turn" width="16" />
      TURN
    </div>
    <BaseButton :button-color="buttonOptions.gray" :is-small="true" @click="show()">
      <BaseIcon :icon-type="iconOptions.Restart" />
    </BaseButton>
    <RetryGameModal :show="showModal" @close="showModal = false"></RetryGameModal>
  </nav>
</template>

<script lang="ts">
import XIcon from '@/assets/gray-icons/icon-x.svg'
import OIcon from '@/assets/gray-icons/icon-o.svg'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseIcon from '@/components/base/BaseIcon.vue'

import { BtnColor } from '@/enums/ButtonTypes'
import { IconType } from '@/enums/IconTypes'
import { mapState } from 'vuex'
import { PlayerTypes } from '@/enums/Players'
import RetryGameModal from '@/components/RetryGameModal.vue'

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
    show() {
      this.showModal = true
    }
  },
  computed: {
    ...mapState(['currentPlayerType']),
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
</style>
