import { Client, over } from "webstomp-client";
import { store } from "@/store";
import type { Room } from "./MultiplayerGame.service";
import { PlayerTypes } from "@/enums/Players";
import { getPlayersType } from "./utils/player";
import { parseMovementMessage } from "./utils/websocket.utils";

export class WebsocketService {
  private socket: WebSocket;
  private client: Client;

  private readonly stompEndpoint = import.meta.env.VITE_WS_CONNECT_HOST
  private readonly broker = import.meta.env.VITE_WS_MESSAGE_BROKER_BASE
  private readonly listener = import.meta.env.VITE_WS_MESSAGE_LISTENER_BASE

  public readonly gameRoomPath = `${this.broker}/rooms`;
  public readonly roomWaitingPath = `${this.broker}/room-joined`;
  private readonly roomJoinedPath = `${this.listener}/room-joined`;

  private readonly userId: string;

  constructor(userId: string) {
    // BUG: Sometimes the client can't connect to the websocket server. Need investigate why
    // and don't let the user start a multiplayer game until they have a websocket connection running
    this.socket = new WebSocket(this.stompEndpoint);
    this.client = over(this.socket);

    store.commit('setWebsocketClient', this.client);
    store.state.userId = userId;
    this.userId = userId;

    this.gameRoomPath = `${this.broker}/rooms`;
  }

  public handleCreatorConnection(room: Room) {
    this.client.connect({}, this.getCreateRoomCallback(room), (error) => {
      store.commit('setRoomWaitingState', false)
      console.error(error);
    });
  }

  public handleJoinerConnection(room: Room) {
    this.client.connect({}, this.getJoinRoomCallback(room), (error) => {
      store.commit('setRoomWaitingState', false)
      console.error(error);
    });
  }

  public getCreateRoomCallback(room: Room): (frame?: any) => any {
    const _this = this
    return () => {
      _this.client.subscribe(`${_this.gameRoomPath}/${room.roomId}`, (message) => {
        const body = parseMovementMessage(message);
        if (body.userId !== _this.userId) {
          store.commit('addPlayToHistory', body);
        }
      })

      // Wait for the other player to join the room
      _this.client.subscribe(`${_this.roomWaitingPath}/${room.roomId}`, () => {
        store.commit('activateOnlineGame', getPlayersType(room))

        if (room.creatorPiece === PlayerTypes.OPlayer) {
          store.commit('makePlayersWait')
        }

        store.commit('setRoomWaitingState', false)
      })
    }
  }

  public getJoinRoomCallback(room: Room): (frame?: any) => any {
    const _this = this
    return () => {
      _this.client.subscribe(`${_this.gameRoomPath}/${room.roomId}`, (message) => {
        const body = parseMovementMessage(message);
        if (body.userId !== _this.userId) {
          store.commit('addPlayToHistory', body);
        }
      })

      _this.client.send(`${_this.roomJoinedPath}/${room.roomId}`, JSON.stringify({ roomId: room.roomId }));
      const players = getPlayersType(room)
      store.commit('activateOnlineGame', players)

      if (room.creatorPiece === PlayerTypes.XPlayer) {
        store.commit('makePlayersWait')
      }
    }
  }
}
