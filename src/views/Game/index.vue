<template>
  <div class="container">
    <NavBar />
    <GameBoard/>
  </div>
</template>

<script lang="ts">
import NavBar from './NavBar.vue'
import GameBoard from './GameBoard.vue'

export default {
  name: 'GamePage',
  components: {
    NavBar,
    GameBoard
  }
}
</script>

<style lang="scss" scoped>
.container {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 4rem;
}
</style>
