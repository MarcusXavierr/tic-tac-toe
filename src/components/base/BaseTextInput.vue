<template>
  <div class="text-input">
    <label :for="inputId" class="text-input__label">{{ label }}</label>
    <input
      v-bind="$attrs"
      :id="inputId"
      class="text-input__field"
      :class="{ 'text-input__field--mono': mono }"
      :value="modelValue"
      :placeholder="placeholder"
      :maxlength="maxlength"
      autocomplete="off"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </div>
</template>

<script lang="ts">
export default {
  name: 'BaseTextInput',
  inheritAttrs: false,
  props: {
    label: {
      type: String,
      required: true
    },
    modelValue: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: ''
    },
    maxlength: {
      type: Number,
      default: 50
    },
    mono: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue'],
  computed: {
    inputId() {
      return `input-${this.label.toLowerCase().replace(/\s+/g, '-')}`
    }
  }
}
</script>

<style lang="scss" scoped>
@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

.text-input {
  background: var(--semi-dark-navy);
  border-radius: 1rem;
  box-shadow: inset 0 -0.5rem 0 #10212a;
  padding: 1.25rem 1.5rem 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  text-align: center;
}

.text-input__label {
  font-family: 'Outfit', sans-serif;
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--silver);
  opacity: 0.5;
}

.text-input__field {
  width: 100%;
  background: var(--dark-navy);
  border: none;
  border-radius: 0.5rem;
  padding: 0.875rem 1rem;
  color: var(--silver);
  font-family: 'Outfit', sans-serif;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 1px;
  text-align: center;
  outline: none;
  transition: color 0.15s ease;

  &::placeholder {
    font-weight: 400;
    opacity: 0.25;
    letter-spacing: 1px;
  }

  &:focus {
    color: var(--silver-hover);
  }

  &--mono {
    font-family: 'Share Tech Mono', monospace;
    letter-spacing: 3px;
    font-size: 0.9375rem;
    text-transform: uppercase;

    &:focus {
      color: var(--blue);
    }
  }
}
</style>
