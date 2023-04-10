<template>
  <button :class="[color, size]">
    <slot>BUTTON</slot>
  </button>
</template>

<script lang="ts">
import { BtnColor } from '@/enums/ButtonTypes'
import { mapState } from 'vuex'

export default {
  name: 'BaseButton',
  props: {
    buttonColor: {
      type: Number,
      required: true
    },
    isLarge: {
      type: Boolean,
      required: false,
      default: false
    },
    isSmall: {
      type: Boolean,
      required: false,
      default: false
    },
  },
  computed: {
    ...mapState(['cringe', 'foo']),

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
      if (this.isLarge) {
        return 'w-full'
      }

      if (this.isSmall) {
        return 'small'
      }

      return 'normal'
    },

  },
}
</script>

<style lang="scss" scoped>
button {
  background: var(--btn-color);
  color: var(--dark-navy);
  font-size: 1.25rem;
  font-weight: 700;
  text-align: center;
  border-radius: 0.75rem;
  font-family: inherit;
  padding: 1rem;
  padding-bottom: 1.25rem;
  border: none;
  letter-spacing: 1px;
  box-shadow: inset 0px var(--shadow-y-offset, -0.25rem) 0px var(--btn-color-shadow);
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: var(--btn-color-hover);
  }

  &:active {
    --offset: var(--shadow-y-offset, -0.25rem);
    --shadow-y-offset: calc(var(--offset) / 2);
    transform: translateY(calc(0.25rem / 4));
  }
}

.small {
  padding: 0.75rem;
  padding-top: 0.625rem;
  padding-bottom: 0.875rem;
  border-radius: 0.35rem;
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
  border-radius: 1rem;
}
</style>
