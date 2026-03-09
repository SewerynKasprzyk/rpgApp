import { useEffect } from "react";
import { Session, SessionCharacter, UpdateSessionInput } from "@rpg/shared";
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

          // For characters, merge at the per-character level so that a stale
          // pending characters array doesn't overwrite fresh statuses arriving
          // from the server (e.g. propagated from a character-editor save).
          let mergedCharacters = event.session.characters;
          if (pending.characters) {
            mergedCharacters = event.session.characters.map((serverChar) => {
              const pendingChar = pending.characters!.find(
                (pc) => pc.characterId === serverChar.characterId
              );
              // Per-character merge: server fields are authoritative, but
              // pending local fields (e.g. scene-local edits) overlay on top.
              return pendingChar
                ? { ...serverChar, ...pendingChar } as SessionCharacter
                : serverChar;
            });
            // Include any pending characters not in the server list (shouldn't
            // happen normally, but keep the data safe).
            for (const pc of pending.characters) {
              if (!mergedCharacters.some((c) => c.characterId === pc.characterId)) {
                mergedCharacters.push(pc);
              }
            }
          }

          const { characters: _pc, ...pendingRest } = pending;
          const base = prev
            ? { ...prev, ...event.session, ...pendingRest, characters: mergedCharacters }
            : { ...event.session, ...pendingRest, characters: mergedCharacters };
          return base;
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
