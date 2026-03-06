import { useEffect } from "react";
import { Session } from "@rpg/shared";
import { subscribeSession } from "../services/realtimeClient";

export function useRealtimeSession(
  sessionId: string | undefined,
  setSession: React.Dispatch<React.SetStateAction<Session | null>>
) {
  useEffect(() => {
    if (!sessionId) return;

    const unsubscribe = subscribeSession((event) => {
      if (
        event.type === "session_updated" &&
        event.session.id === sessionId
      ) {
        setSession((prev) => (prev ? { ...prev, ...event.session } : event.session));
      }
      if (
        event.type === "session_deleted" &&
        event.sessionId === sessionId
      ) {
        setSession(null);
      }
    });

    return unsubscribe;
  }, [sessionId, setSession]);
}
