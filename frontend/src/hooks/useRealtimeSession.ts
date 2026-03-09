import { useEffect } from "react";
import { Session, UpdateSessionInput } from "@rpg/shared";
import { subscribeSession } from "../services/realtimeClient";

export function useRealtimeSession(
  sessionId: string | undefined,
  setSession: React.Dispatch<React.SetStateAction<Session | null>>,
  getPending?: () => UpdateSessionInput
) {
  useEffect(() => {
    if (!sessionId) return;

    const unsubscribe = subscribeSession((event) => {
      if (
        event.type === "session_updated" &&
        event.session.id === sessionId
      ) {
        setSession((prev) => {
          // Re-apply any pending local changes on top of the server state so
          // our optimistic updates are never clobbered by a stale WS event.
          const pending = getPending?.() ?? {};
          return prev ? { ...prev, ...event.session, ...pending } : event.session;
        });
      }
      if (
        event.type === "session_deleted" &&
        event.sessionId === sessionId
      ) {
        setSession(null);
      }
    });

    return unsubscribe;
  }, [sessionId, setSession, getPending]);
}
