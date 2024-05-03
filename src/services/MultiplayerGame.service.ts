import type { PlayerTypes } from "@/enums/Players";
import { store } from "@/store";
import { v4 as uuidv4 } from 'uuid';
import type { Client } from "webstomp-client";
import { WebsocketService } from "./Websocket.service";

export class MultiplayerGameService {
  public readonly userId: string;
  private readonly ws: WebsocketService;
  private readonly httpRoomsEndpoint: string = import.meta.env.VITE_HTTP_ROOMS_ENDPOINT;

  public constructor() {
    this.userId = uuidv4();
    this.ws = new WebsocketService(this.userId);
  }

  async createRoom(playerPiece: PlayerTypes) {
    store.commit('setRoomWaitingState', true);
    this.detachFromOlderConnections()
    try {
      const room = await this.generateRoom(playerPiece)
      store.commit('setRoom', room);
      this.ws.handleCreatorConnection(room);

    } catch (error) {
      console.error(error);
      store.commit('setRoomWaitingState', false);
    }
  }

  async joinRoom(roomId: string) {
    this.detachFromOlderConnections()
    try {
      const room = await this.getRoom(roomId)
      store.commit('setRoom', room);
      this.ws.handleJoinerConnection(room);

    } catch (error) {
      console.error(error);
    }
  }

  private detachFromOlderConnections() {
    // unsubscribe from the room's websocket
    const client = store.state.websocketClient as Client | undefined;
    const room = store.state.room as Room | undefined;
    if (client && room) {
      client.unsubscribe(`${this.ws.gameRoomPath}/${room.roomId}`);

      if (room.creatorId === this.userId) {
        client.unsubscribe(`${this.ws.roomWaitingPath}/${room.roomId}`);
      }
    }

    // Delete the room from the server
    fetch(`${this.httpRoomsEndpoint}/${room?.roomId}`, {method: 'DELETE'}).catch(console.error)
  }

  private async generateRoom(playerPiece: PlayerTypes) {
    const room: Room = {
      roomId: uuidv4(),
      creatorId: this.userId,
      creatorPiece: playerPiece.valueOf()
    }

    const response = await fetch(this.httpRoomsEndpoint, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(room)
    })

    if (!response.ok) {
      throw new Error('Failed to create room');
    }

    return room;
  }


  private async getRoom(roomId: string) {
    const response = await fetch(`${this.httpRoomsEndpoint}/${roomId}`)
    if (!response.ok) {
      throw new Error('Failed to get room');
    }

    return await response.json();
  }
}

export type Room = {
  roomId: string;
  creatorId: string;
  creatorPiece: PlayerTypes;
}
