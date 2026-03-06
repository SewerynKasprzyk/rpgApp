import { io, Socket } from "socket.io-client";
import { CharacterEvent, SessionEvent } from "@rpg/shared";

export type RealtimeListener = (event: CharacterEvent) => void;
export type SessionRealtimeListener = (event: SessionEvent) => void;

const REALTIME_URL =
  import.meta.env.VITE_REALTIME_URL ??
  import.meta.env.VITE_API_URL ??
  "http://localhost:3001";

let socket: Socket | null = null;
const listeners: RealtimeListener[] = [];
const sessionListeners: SessionRealtimeListener[] = [];

function getSocket(): Socket {
  if (!socket) {
    socket = io(REALTIME_URL);

    socket.on("character_created", (character) => {
      const event: CharacterEvent = { type: "character_created", character };
      listeners.forEach((fn) => fn(event));
    });

    socket.on("character_updated", (character) => {
      const event: CharacterEvent = { type: "character_updated", character };
      listeners.forEach((fn) => fn(event));
    });

    socket.on("character_deleted", (data: { characterId: string }) => {
      const event: CharacterEvent = {
        type: "character_deleted",
        characterId: data.characterId,
      };
      listeners.forEach((fn) => fn(event));
    });

    socket.on("session_created", (session) => {
      const event: SessionEvent = { type: "session_created", session };
      sessionListeners.forEach((fn) => fn(event));
    });

    socket.on("session_updated", (session) => {
      const event: SessionEvent = { type: "session_updated", session };
      sessionListeners.forEach((fn) => fn(event));
    });

    socket.on("session_deleted", (data: { sessionId: string }) => {
      const event: SessionEvent = {
        type: "session_deleted",
        sessionId: data.sessionId,
      };
      sessionListeners.forEach((fn) => fn(event));
    });
  }
  return socket;
}

export function subscribe(listener: RealtimeListener): () => void {
  listeners.push(listener);
  getSocket();

  return () => {
    const idx = listeners.indexOf(listener);
    if (idx >= 0) listeners.splice(idx, 1);
    if (listeners.length === 0 && sessionListeners.length === 0 && socket) {
      socket.disconnect();
      socket = null;
    }
  };
}

export function subscribeSession(listener: SessionRealtimeListener): () => void {
  sessionListeners.push(listener);
  getSocket();

  return () => {
    const idx = sessionListeners.indexOf(listener);
    if (idx >= 0) sessionListeners.splice(idx, 1);
    if (listeners.length === 0 && sessionListeners.length === 0 && socket) {
      socket.disconnect();
      socket = null;
    }
  };
}
