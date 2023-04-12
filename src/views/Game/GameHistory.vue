<template>
  <div class="container">
    <div class="card blue">
      <p>X (P{{ playerX }})</p>
      <h4>{{ history.x }}</h4>
    </div>
    <div class="card silver">
      <p>TIES</p>
      <h4>{{ history.tie }}</h4>
    </div>
    <div class="card yellow">
      <p>O (P{{ playerO }})</p>
      <h4>{{ history.o }}</h4>
    </div>
  </div>
</template>

<script lang="ts">
import { PlayerTypes } from '@/enums/Players'
import { mapGetters, mapState } from 'vuex'
export default {
  name: 'GameHistory',
  methods: {},
  computed: {
    ...mapState(['gameResults']),
    ...mapGetters(['getPlayer']),

    playerX() {
      return this.getPlayer(PlayerTypes.XPlayer)
    },
    playerO() {
      return this.getPlayer(PlayerTypes.OPlayer)
    },
    history() {
      const initialState = { x: 0, o: 0, tie: 0 }

      return this.gameResults.reduce((acc: any, item: any) => {
        console.log('aaaaaaaaaa', item, acc)
        if (item.winner == PlayerTypes.XPlayer) {
          return { ...acc, x: acc.x + 1 }
        }

        if (item.winner == PlayerTypes.OPlayer) {
          return { ...acc, o: acc.o + 1 }
        }

        return { ...acc, tie: acc.tie + 1 }
      }, initialState)
    }
  }
}
</script>

<style scoped>
.container {
  display: flex;
  gap: 1rem;
}

.card {
  color: var(--dark-navy);
  width: 100%;
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  text-align: center;
}

h4 {
  font-size: 1.5rem;
}

.blue {
  background: var(--blue);
}

.yellow {
  background: var(--yellow);
}

.silver {
  background: var(--silver);
}
</style>
