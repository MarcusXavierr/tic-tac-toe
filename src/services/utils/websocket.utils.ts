import { EventSubject } from "@/enums/EventSubject";
import { PlayerTypes } from "@/enums/Players";
import type { Client, Message } from "webstomp-client";
import { z } from "zod";
import type { Room } from "../MultiplayerGame.service";

export function parseMovementMessage(message: Message): MoveWithUserId  {
  try {
    const body = JSON.parse(message.body);
    return validateMovementMessage(body);
  } catch (e) {
    console.error(e);
    throw new Error("Failed to parse websocket message!");
  }
}

export function validateMovementMessage(move: MoveWithUserId) {
    const parser = z.object({
      userId: z.string(),
      position: z.number(),
      piece: z.nativeEnum(PlayerTypes),
      belongsToWinnerPath: z.boolean().optional().nullable(),
    });

    return parser.parse(move) as MoveWithUserId;
}

export function quitRoom(client: Client, room: Room, userId: string) {
  const event: RoomEvent = { userId, subject: EventSubject.QUIT }
  const path = `${import.meta.env.VITE_WS_MESSAGE_LISTENER_BASE}/room-messages`
  client.send(`${path}/${room.roomId}`, JSON.stringify(event))
}

type MoveWithUserId = MoveRecord & {userId: string};

export type RoomEvent = {
  userId: string;
  subject: EventSubject
}
