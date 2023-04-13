import { IconType } from "@/enums/IconTypes"
import { PlayerTypes } from "@/enums/Players"

const getIconTypeFromPlayerTurn = (playerTurn: PlayerTypes): IconType => {
  if (playerTurn == PlayerTypes.XPlayer) {
    return IconType.X
  }

  return IconType.O
}

export {
  getIconTypeFromPlayerTurn
}
