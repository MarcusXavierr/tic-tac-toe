<template>
  <div class="container">
    <div class="card blue">
      <p>{{ labelX }}</p>
      <h4>{{ history.x }}</h4>
    </div>
    <div class="card silver">
      <p>{{ $t('gameHistory.ties') }}</p>
      <h4>{{ history.tie }}</h4>
    </div>
    <div class="card yellow">
      <p>{{ labelO }}</p>
      <h4>{{ history.o }}</h4>
    </div>
  </div>
</template>

<script lang="ts">
import { PlayerTypes } from '@/enums/Players'
import { mapGetters, mapState } from 'vuex'
export default {
  name: 'GameHistory',
  computed: {
    ...mapState(['gameResults', 'isMultiplayer', 'myPlayerType']),
    ...mapGetters(['getPlayer']),

    labelX(): string {
      const self = this as any
      if (!self.isMultiplayer)
        return self.$t('gameHistory.xPlayer', { n: self.getPlayer(PlayerTypes.XPlayer) })
      return self.myPlayerType === PlayerTypes.XPlayer
        ? self.$t('gameHistory.xYou')
        : self.$t('gameHistory.x')
    },
    labelO(): string {
      const self = this as any
      if (!self.isMultiplayer)
        return self.$t('gameHistory.oPlayer', { n: self.getPlayer(PlayerTypes.OPlayer) })
      return self.myPlayerType === PlayerTypes.OPlayer
        ? self.$t('gameHistory.oYou')
        : self.$t('gameHistory.o')
    },
    history() {
      const initialState = { x: 0, o: 0, tie: 0 }
      return (this as any).gameResults.reduce((acc: any, item: any) => {
        if (item.winner == PlayerTypes.XPlayer) return { ...acc, x: acc.x + 1 }
        if (item.winner == PlayerTypes.OPlayer) return { ...acc, o: acc.o + 1 }
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
