import { Client, over } from "webstomp-client";
import { store } from "@/store";
import type { Room } from "./OnlineGame.service";
import { Players, PlayerTypes } from "@/enums/Players";

export class WebsocketService {
  private socket: WebSocket;
  private client: Client;
  // TODO: Colocar variaveis de ambiente no .env
  private readonly brokerUrl = 'ws://localhost:8080/ws/join';
  private readonly messageBrokerBase = '/topic';
  private readonly messageListenerBase = '/app'
  private _connected: boolean = false;
  private _waitingUserToJoin: boolean = false;

  constructor() {
    this.socket = new WebSocket(this.brokerUrl);
    this.client = over(this.socket);
    store.state.websocketClient = this.client;
  }

  public roomCreatorConnect(room: Room, players: players) {
    this.client.connect({}, this.getCreateRoomCallback(room, players), (error) => {
      this._waitingUserToJoin = false;
      console.error(error);
    });
  }

  public joinerConnect(room: Room) {
    this.client.connect({}, this.getJoinRoomCallback(room), (error) => {
      this._waitingUserToJoin = false;
      console.error(error);
    });
  }

  get connected(): boolean {
    return this._connected;
  }

  get waitingUserToJoin(): boolean {
    return this._waitingUserToJoin;
  }

  public getCreateRoomCallback(room: Room, players: players): (frame?: any) => any {
    this._waitingUserToJoin = true;
    const _this = this
    return () => {
      _this._connected = true;
      // Subscribe to the room
      // TODO: refactor to put this rooms in a constant too
      _this.client.subscribe(`${_this.messageBrokerBase}/rooms/${room.roomId}`, (message) => {
        if (store.state.isWaitingToPlay) {
          return
        }

        const body = JSON.parse(message.body) as MoveRecord;
        console.log('recebi a jogada: e vou aplicar ela', body);
        store.commit('addPlayToHistory', body);
      })

      // Waits for the other player to join
      // and start the game
      // TODO: refactor to put this room-joined in a constant too
      _this.client.subscribe(`${_this.messageBrokerBase}/room-joined/${room.roomId}`, () => {
        console.error('Entraram na minha SALINHA!!!');
        store.commit('activateOnlineGame', {
          ...players,
        })

        // Waits for the first move from the other player if the current player's piece is O
        if (room.creatorPiece === PlayerTypes.OPlayer) {
          store.commit('makePlayersWait')
        }

        // Now I can finally remove the waiting and let the user play
        _this._waitingUserToJoin = false;
      })
    }
  }

  public getJoinRoomCallback(room: Room): (frame?: any) => any {
    const _this = this
    return () => {
      _this._connected = true;
      // TODO: refactor to put this rooms in a constant too
      _this.client.subscribe(`${_this.messageBrokerBase}/rooms/${room.roomId}`, (message) => {
        if (store.state.isWaitingToPlay) {
          return
        }

        const body = JSON.parse(message.body) as MoveRecord;
        console.log('recebi a jogada: e vou aplicar ela', body);
        store.commit('addPlayToHistory', body);
      })

      // TODO: refactor to put this room-joined in a constant too
      _this.client.send(`${_this.messageListenerBase}/room-joined/${room.roomId}`, JSON.stringify({ roomId: room.roomId }));

      if (room.creatorPiece === PlayerTypes.XPlayer) {
        store.commit('activateOnlineGame', {
          XPlayer: Players.playerOne,
          OPlayer: Players.playerTwo,
        })

        // Waits for the first move from the other player if the current player's piece is O
        store.commit('makePlayersWait')

        return
      }

      store.commit('activateOnlineGame', {
        XPlayer: Players.playerTwo,
        OPlayer: Players.playerOne,
      })
    }
  }
}

// TODO: refactor this type with a better name and export it on the right place
type players = {
    OPlayer: Players;
    XPlayer: Players;
}
