<template>
  <button :class="[color, size]">
    <slot>BUTTON</slot>
  </button>
</template>

<script lang="ts">
import { BtnColor, BtnWidth } from '@/enums/ButtonTypes'

export default {
  name: 'BaseButton',
  props: {
    buttonColor: {
      type: Number,
      required: true
    },
    buttonWidth: {
      type: Number,
      required: false,
      default: BtnWidth.md
    }
  },
  computed: {
    color() {
      switch (this.buttonColor) {
        case BtnColor.blue:
          return 'blue'
        case BtnColor.yellow:
          return 'yellow'
        default:
          return 'gray'
      }
    },
    size() {
      if (this.buttonWidth == BtnWidth.lg) {
        return 'w-full'
      }
      return 'normal'
    }
  }
}
</script>

<style lang="scss" scoped>
button {
  background: var(--btn-color);
  color: var(--dark-navy);
  font-size: 1.25rem;
  font-weight: 700;
  text-align: center;
  border-radius: 1rem;
  font-family: inherit;
  padding: 1rem;
  border: none;
  box-shadow: inset 0px var(--shadow-y-offset, -0.25rem) 0px var(--btn-color-shadow);

  &:hover {
    background: var(--btn-color-hover);
  }

  &:active {
    --offset: var(--shadow-y-offset, -0.25rem);
    --shadow-y-offset: calc(var(--offset) / 2);
    transform: translateY(calc(0.25rem / 4));
  }
}

.yellow {
  --btn-color: var(--yellow);
  --btn-color-hover: var(--yellow-hover);
  --btn-color-shadow: var(--yellow-shadow);
}

.blue {
  --btn-color: var(--blue);
  --btn-color-hover: var(--blue-hover);
  --btn-color-shadow: var(--blue-shadow);
}

.gray {
  --btn-color: var(--silver);
  --btn-color-hover: var(--silver-hover);
  --btn-color-shadow: var(--silver-shadow);
}

.w-full {
  width: 100%;
  padding-bottom: 1.5rem;
  --shadow-y-offset: -0.5rem;
}
</style>
