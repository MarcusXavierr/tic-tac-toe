<template>
  <div class="container">
    <NavBar />
    <BaseCell />
  </div>
</template>

<script lang="ts">
import BaseCell from '../../components/base/BaseCell.vue'
import NavBar from './NavBar.vue'

export default {
  name: 'GamePage',
  components: { BaseCell, NavBar }
}
</script>

<style lang="scss" scoped>
.container {
  padding: 1.5rem;
}
</style>
