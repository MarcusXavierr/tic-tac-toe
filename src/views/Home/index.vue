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
      <BaseButton :button-color="btnColors.blue" :is-large="true" @click="startGame">
        NEW GAME (VS PLAYER)
      </BaseButton>
    </div>
  </div>
</template>

<script lang="ts">
import BaseButton from '@/components/base/BaseButton.vue'
import PlayerSelector from './PlayerSelector.vue'
import { BtnColor } from '@/enums/ButtonTypes'
import { Players } from '@/enums/Players'
import { mapMutations } from 'vuex'

export default {
  name: 'HomePage',
  components: {
    BaseButton,
    PlayerSelector
  },
  data() {
    return {
      btnColors: BtnColor,
      xTypeSelected: true,
      oTypeSelected: false
    }
  },
  methods: {
    ...mapMutations(['activateGame']),
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
