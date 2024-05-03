import { IconType } from "@/enums/IconTypes";
import { Players, PlayerTypes } from "@/enums/Players";
import type { Room } from "../MultiplayerGame.service";

export function swapIconType(icon: IconType) {
  if (icon == IconType.O) {
    return IconType.X
  }

  return IconType.O
}

export function getPlayersType(room: Room): { OPlayer: Players; XPlayer: Players } {
  if (room.creatorPiece === PlayerTypes.OPlayer) {
    return {
      OPlayer: Players.playerOne,
      XPlayer: Players.playerTwo,
    }
  }
  return {
    XPlayer: Players.playerOne,
    OPlayer: Players.playerTwo,
  }
}
