import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Session, UpdateSessionInput, Character } from "@rpg/shared";
import { fetchSession, updateSession, fetchCharacters } from "../services/apiClient";
import { useRealtimeSession } from "../hooks/useRealtimeSession";
import SessionCharacterSidebar from "../components/SessionCharacterSidebar";
import SessionCharacters from "../components/SessionCharacters";
import SessionEnemies from "../components/SessionEnemies";
import SessionNeutrals from "../components/SessionNeutrals";
import DiceRoller from "../components/DiceRoller";

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

  useRealtimeSession(id, setSession);

  useEffect(() => {
    if (!id) return;
    Promise.all([fetchSession(id), fetchCharacters()])
      .then(([s, chars]) => {
        setSession(s);
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

  const handleChange = useCallback(
    (updates: UpdateSessionInput) => {
      setSession((prev) => (prev ? { ...prev, ...updates } : prev));
      pendingUpdates.current = { ...pendingUpdates.current, ...updates };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(flushSave, DEBOUNCE_MS);
    },
    [flushSave]
  );

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      flushSave();
    };
  }, [flushSave]);

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
          {/* Section 3 — Characters in session (top) */}
          <SessionCharacters
            session={session}
            allCharacters={allCharacters}
            onChange={handleChange}
          />

          {/* Bottom row: enemies left, neutrals right, dice roller */}
          <div className="session-detail__bottom">
            <SessionEnemies session={session} onChange={handleChange} />
            <SessionNeutrals session={session} onChange={handleChange} />
          </div>

          {/* Section 2 — Dice Roller */}
          <DiceRoller session={session} onChange={handleChange} />
        </div>
      </div>
    </div>
  );
}
