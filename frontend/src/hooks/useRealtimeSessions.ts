import { useEffect } from "react";
import { Session } from "@rpg/shared";
import { subscribeSession } from "../services/realtimeClient";

export function useRealtimeSessions(
  setSessions: React.Dispatch<React.SetStateAction<Session[]>>
) {
  useEffect(() => {
    const unsubscribe = subscribeSession((event) => {
      switch (event.type) {
        case "session_created":
          setSessions((prev) => {
            if (prev.find((s) => s.id === event.session.id)) return prev;
            return [...prev, event.session];
          });
          break;
        case "session_updated":
          setSessions((prev) =>
            prev.map((s) => (s.id === event.session.id ? event.session : s))
          );
          break;
        case "session_deleted":
          setSessions((prev) =>
            prev.filter((s) => s.id !== event.sessionId)
          );
          break;
      }
    });

    return unsubscribe;
  }, [setSessions]);
}
