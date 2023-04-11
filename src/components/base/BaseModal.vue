<template>
  <Transition name="modal">
    <div v-if="show" class="modal-mask">
      <div class="modal-container">
        <slot> Modal Not implemented </slot>
      </div>
    </div>
  </Transition>
</template>

<script lang="ts">
export default {
  name: 'BaseModal',
  props: {
    show: {
      type: Boolean,
      required: true
    }
  }
}
</script>

<style scoped>
.modal-mask {
  position: fixed;
  z-index: 100;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  transition: opacity 0.3s ease;
}

.modal-container {
  width: 100vw;
  margin: auto;
  display: flex;
  justify-content: center;
  text-align: center;
  background-color: var(--semi-dark-navy);
  transition: all 0.3s ease;
}

.modal-body {
  margin: 20px 0;
}

.modal-default-button {
  float: right;
}

/* Transition style */
.modal-enter-from {
  opacity: 0;
}

.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  -webkit-transform: scale(1.1);
  transform: scale(1.1);
}
</style>
