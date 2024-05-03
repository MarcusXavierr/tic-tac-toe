import { PlayerTypes } from "@/enums/Players";
import type { Message } from "webstomp-client";
import { z } from "zod";

export function parseMovementMessage(message: Message): MoveRecord & {userId: string}  {
  try {
    const body = JSON.parse(message.body);

    const parser = z.object({
      userId: z.string(),
      position: z.number(),
      piece: z.nativeEnum(PlayerTypes),
      belongsToWinnerPath: z.boolean().optional().nullable(),
    });

    return parser.parse(body) as MoveRecord & {userId: string};
  } catch (e) {
    console.error(e);
    throw new Error("Failed to parse websocket message!");
  }
}
