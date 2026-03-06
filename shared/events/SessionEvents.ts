import { Session } from "../types/Session";

export type SessionEventType =
  | "session_created"
  | "session_updated"
  | "session_deleted";

export interface SessionCreatedEvent {
  type: "session_created";
  session: Session;
}

export interface SessionUpdatedEvent {
  type: "session_updated";
  session: Session;
}

export interface SessionDeletedEvent {
  type: "session_deleted";
  sessionId: string;
}

export type SessionEvent =
  | SessionCreatedEvent
  | SessionUpdatedEvent
  | SessionDeletedEvent;
