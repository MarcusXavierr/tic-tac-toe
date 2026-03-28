import type { Players, PlayerTypes } from "@/enums/Players";
import { v4 as uuidv4 } from 'uuid';
import { WebsocketService } from "./Websocket.service";

export class OnlineGameService {
  public readonly userId: string;
  private readonly ws: WebsocketService;
  private _waitingOnRoom: boolean = false;
  private _roomId: string = '123123123';

  public constructor() {
    this.userId = uuidv4();
    this.ws = new WebsocketService(this.userId);
  }

  get waitingOnRoom(): boolean {
    // If the user is waiting on a room
    // return when the ws.isWaitingUserToJoin is resolved
    // this only applies to users creating a room
    // TODO: Write logic to wipe out all data, besides userId
    if (this._waitingOnRoom) {
      return this.ws.waitingUserToJoin;
    }

    return false; // Change to false, just debugging
  }

  get roomId(): string {
    return this._roomId;
  }

  createRoom(playerPiece: PlayerTypes, players: players) {
    this._waitingOnRoom = true;
    this.generateRoom(playerPiece)
      .then(room => {
        console.log('Room created', room);
        this._roomId = room.roomId;
        this.ws.roomCreatorConnect(room, players);
      })
      .catch(err => {
        console.error(err);
        this._waitingOnRoom = false;
      });
  }

  joinRoom(roomId: string) {
    this.getRoom(roomId)
      .then(room => {
        console.log('Room joined', room);
        this._roomId = room.roomId;
        this.ws.joinerConnect(room);
      })
      .catch(err => {
        console.error(err);
      });
  }

  private async generateRoom(playerPiece: PlayerTypes) {
    const room: Room = {
      roomId: uuidv4(),
      creatorId: this.userId,
      creatorPiece: playerPiece.valueOf()
    }

    const response = await fetch('http://localhost:8080/api/rooms', {
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
    const response = await fetch(`http://localhost:8080/api/rooms/${roomId}`)
    if (!response.ok) {
      throw new Error('Failed to get room');
    }

    return await response.json();
  }
}

export type Room = {
  roomId: string;
  creatorId: string;
  creatorPiece: number; // 0 for O or 1 for X
}

type players = {
    OPlayer: Players;
    XPlayer: Players;
}
