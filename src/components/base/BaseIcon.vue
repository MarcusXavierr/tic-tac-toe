<template>
  <img :src="iconSource" alt="icon" />
</template>

<script lang="ts">
import { IconType } from '@/enums/IconTypes'
import XIcon from '@/assets/icon-x.svg'
import XOutlineIcon from '@/assets/icon-x-outline.svg'
import OIcon from '@/assets/icon-o.svg'
import OOutlineIcon from '@/assets/icon-o-outline.svg'
import RestartIcon from '@/assets/icon-restart.svg'
import ODarkIcon from '@/assets/icon-o-dark.svg'
import XDarkIcon from '@/assets/icon-x-dark.svg'

export default {
  name: 'BaseIcon',
  props: {
    iconType: {
      type: Number,
      required: true
    }
  },
  computed: {
    iconSource() {
      switch (this.iconType) {
        case IconType.O:
          return OIcon
        case IconType.X:
          return XIcon
        case IconType.O_outline:
          return OOutlineIcon
        case IconType.X_outline:
          return XOutlineIcon
        case IconType.O_dark:
          return ODarkIcon
        case IconType.X_dark:
          return XDarkIcon
        default:
          return RestartIcon
      }
    }
  }
}
</script>
