<template>
  <div class="selector">
    <p>PICK PLAYER 1'S MARK</p>
    <div class="player-type">
      <div :class="xTypeSelected && 'selected'" @click="selectX">
        <img :src="xIcon" alt="" />
      </div>
      <div :class="oTypeSelected && 'selected'" @click="selectO">
        <img :src="oIcon" alt="" />
      </div>
    </div>
    <p class="disclaimer">REMEMBER: X GOES FIRST</p>
  </div>
</template>

<script lang="ts">
import xOutline from '@/assets/gray-icons/icon-x-outline.svg'
import oOutline from '@/assets/gray-icons/icon-o-outline.svg'
import xNormal from '@/assets/gray-icons/icon-x.svg'
import oNormal from '@/assets/gray-icons/icon-o.svg'

export default {
  name: 'PlayerSelector',
  props: {
    xTypeSelected: {
      type: Boolean,
      required: true
    },
    oTypeSelected: {
      type: Boolean,
      required: true
    }
  },
  emits: ['update:xTypeSelected', 'update:oTypeSelected'],
  methods: {
    selectX() {
      this.$emit('update:xTypeSelected', true)
      this.$emit('update:oTypeSelected', false)
    },
    selectO() {
      this.$emit('update:oTypeSelected', true)
      this.$emit('update:xTypeSelected', false)
    }
  },
  computed: {
    xIcon() {
      if (this.xTypeSelected) {
        return xOutline
      }
      return xNormal
    },
    oIcon() {
      if (this.oTypeSelected) {
        return oOutline
      }
      return oNormal
    }
  }
}
</script>

<style lang="scss">
.selector {
  background-color: var(--semi-dark-navy);
  width: 100%;
  padding: 1.5rem;
  padding-bottom: 1.75rem;
  font-weight: 700;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  border-radius: 1rem;
  box-shadow: inset 0 -0.5rem 0 #10212a;

  .disclaimer {
    opacity: 0.5;
  }
}
.player-type {
  display: flex;
  justify-content: center;
  background: var(--dark-navy);
  padding: 0.5rem;
  border-radius: 0.75rem;

  div {
    flex-grow: 1;
    padding: 0.75rem;
    border-radius: 1rem;
  }

  .selected {
    background: var(--silver);
  }
}
</style>
