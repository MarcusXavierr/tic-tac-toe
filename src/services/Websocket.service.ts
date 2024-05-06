import { Client, over, type Subscription } from "webstomp-client";
import { store } from "@/store";
import type { Room } from "./MultiplayerGame.service";
import { PlayerTypes } from "@/enums/Players";
import { getPlayersType } from "./utils/player";
import { parseMovementMessage, type RoomEvent } from "./utils/websocket.utils";
import { EventSubject } from "@/enums/EventSubject";

export class WebsocketService {
  private socket: WebSocket;
  private client: Client;

  private readonly stompEndpoint = import.meta.env.VITE_WS_CONNECT_HOST
  private readonly broker = '/message-broker'
  private readonly listener = '/app'

  public readonly gameRoomPath = `${this.broker}/rooms`;
  public readonly roomWaitingPath = `${this.broker}/room-joined`;
  readonly roomMessagesListener = `${this.listener}/room-messages`
  readonly roomMessagesBroker = `${this.broker}/room-messages`

  private eventsRoomSubscription: Subscription | undefined;
  private roomSubscription: Subscription | undefined;

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
      _this.roomSubscription = _this.subscribeToRoomGame(_this, room)
      _this.eventsRoomSubscription = _this.subscribeToEventsRoom(_this, room)
    }
  }

  public getJoinRoomCallback(room: Room): (frame?: any) => any {
    const _this = this
    return () => {
      _this.roomSubscription = _this.subscribeToRoomGame(_this, room)
      _this.eventsRoomSubscription = _this.subscribeToEventsRoom(_this, room)

      // TODO: Refactor this piece of shit
      _this.client.send(`${_this.roomMessagesListener}/${room.roomId}`, JSON.stringify({ userId: _this.userId, subject: EventSubject.JOINED }))
      const players = getPlayersType(room)
      store.commit('activateOnlineGame', players)

      if (room.creatorPiece === PlayerTypes.XPlayer) {
        store.commit('makePlayersWait')
      }
    }
  }

  private subscribeToRoomGame(_this: WebsocketService, room: Room): Subscription {
    return _this.client.subscribe(`${_this.gameRoomPath}/${room.roomId}`, (message) => {
        const body = parseMovementMessage(message);
        if (body.userId !== _this.userId) {
          store.commit('addPlayToHistory', body);
        }
      })
  }

  private subscribeToEventsRoom(_this: WebsocketService, room: Room): Subscription {
    return _this.client.subscribe(`${_this.roomMessagesBroker}/${room.roomId}`, (message) => {
      const event: RoomEvent = JSON.parse(message.body);
      if (event.userId === _this.userId) { // If the message is from the user, ignore it
        return
      }

      if (room.creatorId === _this.userId) {
        _this.roomCreatorMessageHandler(_this, room, event)
      }

      if (event.subject === EventSubject.QUIT) {
        window.alert('The other player left the game')
        // TODO: dar algum jeito de além de sair da sala, mostrar pro usuário que o outro jogador saiu com um banner ou algo do tipo
        _this.detachFromOlderConnections(_this)
        store.commit('quitGame')
      }

      if (event.subject === EventSubject.READY_TO_NEXT_ROUND) {
        // Aqui eu preciso fazer o jogo ir para a próxima rodada.
        // O primeiro usuário a disparar isso, vai deixar o botão de next round desativado com a mensagem "WAITING FOR OPPONENT"
        // Afetando somente o estado do usuário que disparou isso.
        // Quando o outro usuário disparar, o jogo deve ir para a próxima rodada, chamando a função nextRound do gameService
        // afetando o estado de ambos os clients
        store.commit('makePlayersWait')
      }
    })
  }

  private roomCreatorMessageHandler(_this: WebsocketService, room: Room, event: RoomEvent) {
      console.log('roomCreatorMessageHandler', event)
      if (event.subject === EventSubject.JOINED) {
        store.commit('activateOnlineGame', getPlayersType(room))

        if (room.creatorPiece === PlayerTypes.OPlayer) {
          store.commit('makePlayersWait')
        }

        store.commit('setRoomWaitingState', false)
      }
  }

  public detachFromOlderConnections(_this: WebsocketService) {
    _this.roomSubscription?.unsubscribe();
    _this.eventsRoomSubscription?.unsubscribe();

    const room = store.state.room as Room | undefined;
    if (room) {
      fetch(`${import.meta.env.VITE_HTTP_ROOMS_ENDPOINT}/${room?.roomId}`, {method: 'DELETE'}).catch(console.error)
    }
  }
}
