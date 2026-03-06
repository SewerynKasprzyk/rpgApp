import { Server as SocketIOServer } from "socket.io";
import { Character, Session } from "@rpg/shared";

export interface RealtimeGateway {
  broadcastCharacterCreated(character: Character): void;
  broadcastCharacterUpdated(character: Character): void;
  broadcastCharacterDeleted(characterId: string): void;
  broadcastSessionCreated(session: Session): void;
  broadcastSessionUpdated(session: Session): void;
  broadcastSessionDeleted(sessionId: string): void;
}

export class SocketIoRealtimeGateway implements RealtimeGateway {
  constructor(private io: SocketIOServer) {}

  broadcastCharacterCreated(character: Character): void {
    this.io.emit("character_created", character);
  }

  broadcastCharacterUpdated(character: Character): void {
    this.io.emit("character_updated", character);
  }

  broadcastCharacterDeleted(characterId: string): void {
    this.io.emit("character_deleted", { characterId });
  }

  broadcastSessionCreated(session: Session): void {
    this.io.emit("session_created", session);
  }

  broadcastSessionUpdated(session: Session): void {
    this.io.emit("session_updated", session);
  }

  broadcastSessionDeleted(sessionId: string): void {
    this.io.emit("session_deleted", { sessionId });
  }
}

export class MockRealtimeGateway implements RealtimeGateway {
  broadcastCharacterCreated(_character: Character): void {}
  broadcastCharacterUpdated(_character: Character): void {}
  broadcastCharacterDeleted(_characterId: string): void {}
  broadcastSessionCreated(_session: Session): void {}
  broadcastSessionUpdated(_session: Session): void {}
  broadcastSessionDeleted(_sessionId: string): void {}
}
