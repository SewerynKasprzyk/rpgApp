import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Session, UpdateSessionInput, Character } from "@rpg/shared";
import { fetchSession, updateSession, fetchCharacters, updateCharacter } from "../services/apiClient";
import { useRealtimeCharacters } from "../hooks/useRealtimeCharacters";
import { subscribe, subscribeSession } from "../services/realtimeClient";
import SessionCharacterSidebar from "../components/SessionCharacterSidebar";
import SessionCharacters from "../components/SessionCharacters";
import DiceRoller from "../components/DiceRoller";
import SessionMainBoard from "../components/SessionMainBoard";
import { useSessionContext } from "../context/SessionContext";

const DEBOUNCE_MS = 500;

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [allCharacters, setAllCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingUpdates = useRef<UpdateSessionInput>({});
  // Ref mirrors current session so handleChange can read it synchronously
  const sessionRef = useRef<Session | null>(null);
  sessionRef.current = session;
  // Per-character debounced DB sync for sceneStatuses / currentStatuses
  const pendingCharUpdates = useRef<Map<string, Partial<{ sceneStatuses: unknown; currentStatuses: unknown }>>>(new Map());
  const charSaveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const { register } = useSessionContext();

  // Keep the allCharacters list in sync so drag-and-drop always uses fresh data
  useRealtimeCharacters(setAllCharacters);

  // Track character IDs recently freshened by character_updated events.
  // These are protected from being overwritten by stale session_updated events.
  const freshCharIds = useRef<Set<string>>(new Set());
  const freshCharTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // When a character in this session is updated elsewhere (e.g. character editor),
  // merge the fresh data into the session character snapshot immediately.
  useEffect(() => {
    const unsubscribe = subscribe((event) => {
      if (event.type !== "character_updated") return;
      const fresh = event.character;
      setSession((prev) => {
        if (!prev) return prev;
        const idx = prev.characters.findIndex((c) => c.characterId === fresh.id);
        if (idx === -1) return prev;
        const sc = prev.characters[idx];
        const merged = {
          ...sc,
          name: fresh.name,
          portraitUrl: fresh.portraitUrl ?? sc.portraitUrl,
          themeCards: fresh.themeCards ?? sc.themeCards,
          sceneStatuses: fresh.sceneStatuses ?? sc.sceneStatuses,
          currentStatuses: fresh.currentStatuses ?? sc.currentStatuses,
          sectionQuestCheckboxes: fresh.sectionQuestCheckboxes ?? sc.sectionQuestCheckboxes,
          companions: fresh.companions ?? sc.companions,
          relationshipTags: fresh.relationshipTags ?? sc.relationshipTags,
        };
        const updatedChars = [...prev.characters];
        updatedChars[idx] = merged;

        // Protect this character from being overwritten by a stale session_updated
        freshCharIds.current.add(fresh.id);
        const timer = freshCharTimers.current.get(fresh.id);
        if (timer) clearTimeout(timer);
        freshCharTimers.current.set(
          fresh.id,
          setTimeout(() => {
            freshCharIds.current.delete(fresh.id);
            freshCharTimers.current.delete(fresh.id);
          }, 3000)
        );

        // Patch any pending characters so flushed saves include fresh data
        if (pendingUpdates.current.characters) {
          pendingUpdates.current = {
            ...pendingUpdates.current,
            characters: pendingUpdates.current.characters.map((pc) =>
              pc.characterId === fresh.id ? merged : pc
            ),
          };
        }

        return { ...prev, characters: updatedChars };
      });
    });
    return unsubscribe;
  }, []);

  // Listen for session_updated events, protecting recently-updated characters
  // from being overwritten by stale events (race between character-editor saves
  // and session-page flushes).
  useEffect(() => {
    if (!id) return;
    const unsubscribe = subscribeSession((event) => {
      if (event.type === "session_updated" && event.session.id === id) {
        setSession((prev) => {
          if (!prev) return event.session;
          const pending = pendingUpdates.current;

          const mergedChars = event.session.characters.map((serverChar) => {
            // If this character was just updated via character_updated,
            // keep prev's version to avoid stale overwrite
            if (freshCharIds.current.has(serverChar.characterId)) {
              const prevChar = prev.characters.find(
                (c) => c.characterId === serverChar.characterId
              );
              return prevChar ?? serverChar;
            }
            // Apply any pending local edits on top of server data
            const pendingChar = pending.characters?.find(
              (pc) => pc.characterId === serverChar.characterId
            );
            return pendingChar
              ? { ...serverChar, ...pendingChar }
              : serverChar;
          });
          // Include any pending characters not yet on server
          if (pending.characters) {
            for (const pc of pending.characters) {
              if (!mergedChars.some((c) => c.characterId === pc.characterId)) {
                mergedChars.push(pc);
              }
            }
          }

          const { characters: _pc, ...pendingRest } = pending;
          return { ...prev, ...event.session, ...pendingRest, characters: mergedChars };
        });
      }
      if (event.type === "session_deleted" && event.sessionId === id) {
        setSession(null);
      }
    });
    return unsubscribe;
  }, [id]);

  useEffect(() => {
    if (!id) return;
    Promise.all([fetchSession(id), fetchCharacters()])
      .then(([s, chars]) => {
        // Merge fresh character statuses into session snapshots so that edits
        // made on the character sheet page are reflected here immediately.
        const mergedChars = s.characters.map((sc) => {
          const fresh = chars.find((c) => c.id === sc.characterId);
          if (!fresh) return sc;
          return {
            ...sc,
            currentStatuses: fresh.currentStatuses ?? [],
            sceneStatuses: fresh.sceneStatuses ?? [],
          };
        });
        setSession({ ...s, characters: mergedChars });
        setAllCharacters(chars);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const flushSave = useCallback(() => {
    if (!id || Object.keys(pendingUpdates.current).length === 0) return;
    const updates = { ...pendingUpdates.current };
    pendingUpdates.current = {};
    updateSession(id, updates).catch((err) =>
      console.error("Auto-save failed:", err)
    );
  }, [id]);

  const flushCharSave = useCallback((charId: string) => {
    const patch = pendingCharUpdates.current.get(charId);
    if (!patch || Object.keys(patch).length === 0) return;
    pendingCharUpdates.current.delete(charId);
    updateCharacter(charId, patch as Parameters<typeof updateCharacter>[1]).catch((err) =>
      console.error("Character auto-save failed:", err)
    );
  }, []);

  const handleChange = useCallback(
    (updates: UpdateSessionInput) => {
      // ── Problem 2: Session Characters changed without scenes → sync back to scene snapshots ──
      let fullUpdates = { ...updates };
      if (updates.characters && !updates.scenes && sessionRef.current) {
        fullUpdates.scenes = (sessionRef.current.scenes ?? []).map((scene) => ({
          ...scene,
          items: (scene.items ?? []).map((item) => {
            if (item.sourceType !== "character") return item;
            const matchChar = updates.characters!.find((c) => c.characterId === item.sourceId);
            if (!matchChar) return item;
            const snap = item.snapshot as Record<string, unknown>;
            return {
              ...item,
              snapshot: {
                ...snap,
                statuses: matchChar.sceneStatuses ?? snap.statuses ?? [],
                currentStatuses: matchChar.currentStatuses ?? snap.currentStatuses ?? [],
              },
            };
          }),
        }));
      }

      setSession((prev) => (prev ? { ...prev, ...fullUpdates } : prev));
      pendingUpdates.current = { ...pendingUpdates.current, ...fullUpdates };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(flushSave, DEBOUNCE_MS);

      // Persist session-character changes back to character DB.
      // The session service no longer syncs back (to avoid destructive races),
      // so we do it here on the client side.
      if (updates.characters) {
        for (const sc of updates.characters) {
          const patch: Record<string, unknown> = {};
          if (sc.sceneStatuses !== undefined) patch.sceneStatuses = sc.sceneStatuses;
          if (sc.currentStatuses !== undefined) patch.currentStatuses = sc.currentStatuses;
          if (sc.themeCards !== undefined) patch.themeCards = sc.themeCards;
          if (sc.sectionQuestCheckboxes !== undefined) patch.sectionQuestCheckboxes = sc.sectionQuestCheckboxes;
          if (sc.companions !== undefined) patch.companions = sc.companions;
          if (sc.relationshipTags !== undefined) patch.relationshipTags = sc.relationshipTags;
          if (Object.keys(patch).length === 0) continue;
          const prev = pendingCharUpdates.current.get(sc.characterId) ?? {};
          pendingCharUpdates.current.set(sc.characterId, { ...prev, ...patch });
          const t = charSaveTimers.current.get(sc.characterId);
          if (t) clearTimeout(t);
          charSaveTimers.current.set(
            sc.characterId,
            setTimeout(() => flushCharSave(sc.characterId), DEBOUNCE_MS)
          );
        }
      }
    },
    [flushSave, flushCharSave]
  );

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      flushSave();
      // Flush any pending character saves on unmount
      charSaveTimers.current.forEach((t, charId) => {
        clearTimeout(t);
        flushCharSave(charId);
      });
    };
  }, [flushSave, flushCharSave]);

  // Register this session into Layout's context so GMPanel can access it
  useEffect(() => {
    register(session, handleChange);
  }, [session, handleChange, register]);

  // Unregister on unmount
  useEffect(() => {
    return () => register(null, () => {});
  }, [register]);

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="error">{error}</p>;
  if (!session) return <p>Session not found.</p>;

  return (
    <div className="session-detail">
      <button
        className="character-sheet__back"
        onClick={() => navigate("/session")}
      >
        ← Back
      </button>

      <h2 className="session-detail__title">{session.name}</h2>

      <div className="session-detail__layout">
        {/* Section 1 — Character sidebar */}
        <SessionCharacterSidebar
          allCharacters={allCharacters}
          sessionCharacterIds={session.characters.map((c) => c.characterId)}
        />

        {/* Main content area */}
        <div className="session-detail__main">
          {/* Main Board — scenes navbar + board canvas */}
          <SessionMainBoard
            scenes={session.scenes ?? []}
            session={session}
            onChange={handleChange}
          />

          {/* Section 3 — Characters in session */}
          <SessionCharacters
            session={session}
            allCharacters={allCharacters}
            onChange={handleChange}
          />

          {/* Section 2 — Dice Roller */}
          <DiceRoller session={session} onChange={handleChange} />
        </div>
      </div>
    </div>
  );
}
