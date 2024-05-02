import { Client, over } from "webstomp-client";
import { store } from "@/store";
import type { Room } from "./OnlineGame.service";
import { Players, PlayerTypes } from "@/enums/Players";

export class WebsocketService {
  private socket: WebSocket;
  private client: Client;
  // TODO: Colocar variaveis de ambiente no .env
  private readonly brokerUrl = 'ws://localhost:8080/ws/join';
  private readonly messageBrokerBase = '/message-broker';
  private readonly messageListenerBase = '/app'
  private readonly userId: string;

  constructor(userId: string) {
    // BUG: Sometimes the client can't connect to the websocket server. Need investigate why
    // and don't let the user start a multiplayer game until they have a websocket connection running
    this.socket = new WebSocket(this.brokerUrl);
    this.client = over(this.socket);
    store.state.websocketClient = this.client;
    store.state.userId = userId;
    this.userId = userId;
  }

  public handleCreatorConnection(room: Room) {
    store.state.room = room;
    this.client.connect({}, this.getCreateRoomCallback(room), (error) => {
      store.commit('setRoomWaitingState', false)
      console.error(error);
    });
  }

  public handleJoinerConnection(room: Room) {
    store.state.room = room;
    this.client.connect({}, this.getJoinRoomCallback(room), (error) => {
      store.commit('setRoomWaitingState', false)
      console.error(error);
    });
  }

  public getCreateRoomCallback(room: Room): (frame?: any) => any {
    const _this = this
    return () => {
      // Subscribe to the room
      // TODO: refactor to put this rooms in a constant too
      _this.client.subscribe(`${_this.messageBrokerBase}/rooms/${room.roomId}`, (message) => {
        // If the current player is the creator of the room, skip the message handling because was the one who sent it
        const body = JSON.parse(message.body) as MoveRecord & { userId: string };
        if (body.userId === _this.userId) {
          return
        }

        store.commit('addPlayToHistory', body);
      })

      // Waits for the other player to join
      // and start the game
      // TODO: refactor to put this room-joined in a constant too
      _this.client.subscribe(`${_this.messageBrokerBase}/room-joined/${room.roomId}`, () => {
        store.commit('activateOnlineGame', getPlayersType(room))

        // Waits for the first move from the other player if the current player's piece is O
        if (room.creatorPiece === PlayerTypes.OPlayer) {
          store.commit('makePlayersWait')
        }

        // Now I can finally remove the waiting and let the user play
        store.commit('setRoomWaitingState', false)
      })
    }
  }

  public getJoinRoomCallback(room: Room): (frame?: any) => any {
    const _this = this
    return () => {
      // TODO: refactor to put this rooms in a constant too
      _this.client.subscribe(`${_this.messageBrokerBase}/rooms/${room.roomId}`, (message) => {
        // If the current player is the creator of the room, skip the message handling because was the one who sent it
        const body = JSON.parse(message.body) as MoveRecord & { userId: string };
        if (body.userId === _this.userId) {
          return
        }

        console.log('recebi a jogada: e vou aplicar ela', body);
        store.commit('addPlayToHistory', body);
      })

      // TODO: refactor to put this room-joined in a constant too
      _this.client.send(`${_this.messageListenerBase}/room-joined/${room.roomId}`, JSON.stringify({ roomId: room.roomId }));

      const players = getPlayersType(room)
      store.commit('activateOnlineGame', players)

      if (room.creatorPiece === PlayerTypes.XPlayer) {
        store.commit('makePlayersWait')
      }
    }
  }
}

function getPlayersType(room: Room): { OPlayer: Players; XPlayer: Players } {
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
