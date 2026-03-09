import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Character, UpdateCharacterInput } from "@rpg/shared";
import { fetchCharacter, updateCharacter, beaconUpdateCharacter } from "../services/apiClient";
import { useRealtimeCharacter } from "../hooks/useRealtimeCharacter";
import Section1HeroCard from "../components/Section1HeroCard";
import Section2Statuses from "../components/Section2Statuses";
import Section3ThemeCards from "../components/Section3ThemeCards";
import Section4Details from "../components/Section4Details";

const DEBOUNCE_MS = 500;

const EMPTY_CHECKBOXES = { abandon: [false, false, false] as [boolean,boolean,boolean], improve: [false, false, false] as [boolean,boolean,boolean], milestone: [false, false, false] as [boolean,boolean,boolean] };

function normalizeCharacter(c: Partial<Character>): Character {
  return {
    ...CHAR_DEFAULTS,
    ...c,
    sectionQuestCheckboxes: c.sectionQuestCheckboxes ?? CHAR_DEFAULTS.sectionQuestCheckboxes!,
    themeCards: (c.themeCards ?? CHAR_DEFAULTS.themeCards!).map((tc) => ({
      ...tc,
      checkboxes: tc.checkboxes ?? EMPTY_CHECKBOXES,
    })) as Character["themeCards"],
  } as Character;
}

const CHAR_DEFAULTS: Partial<Character> = {
  playerName: "",
  backpackTags: [],
  companions: [],
  relationshipTags: [],
  promises: [false, false, false, false, false],
  quintessences: [],
  fellowshipThemes: [],
  sectionQuests: [],
  sectionQuestCheckboxes: { abandon: [false, false, false], improve: [false, false, false], milestone: [false, false, false] },
  currentStatuses: [],
  themeCards: [
    { icon: null, type: "", abilities: [], downsides: [], quests: [], checkboxes: { abandon: [false, false, false], improve: [false, false, false], milestone: [false, false, false] } },
    { icon: null, type: "", abilities: [], downsides: [], quests: [], checkboxes: { abandon: [false, false, false], improve: [false, false, false], milestone: [false, false, false] } },
    { icon: null, type: "", abilities: [], downsides: [], quests: [], checkboxes: { abandon: [false, false, false], improve: [false, false, false], milestone: [false, false, false] } },
    { icon: null, type: "", abilities: [], downsides: [], quests: [], checkboxes: { abandon: [false, false, false], improve: [false, false, false], milestone: [false, false, false] } },
  ],
  history: "",
  notes: "",
  portraitUrl: "",
};

export default function CharacterSheet() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingUpdates = useRef<UpdateCharacterInput>({});

  // Real-time updates from other users
  useRealtimeCharacter(id, setCharacter);

  useEffect(() => {
    if (!id) return;
    fetchCharacter(id)
      .then((c) => {
        setCharacter(normalizeCharacter(c));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const flushSave = useCallback(() => {
    if (!id || Object.keys(pendingUpdates.current).length === 0) return;
    const updates = { ...pendingUpdates.current };
    pendingUpdates.current = {};
    updateCharacter(id, updates).catch((err) =>
      console.error("Auto-save failed:", err)
    );
  }, [id]);

  const handleChange = useCallback(
    (updates: UpdateCharacterInput) => {
      setCharacter((prev) => (prev ? { ...prev, ...updates } : prev));

      // Accumulate pending updates and debounce save
      pendingUpdates.current = { ...pendingUpdates.current, ...updates };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(flushSave, DEBOUNCE_MS);
    },
    [flushSave]
  );

  // Flush on unmount (e.g. navigating away via React Router)
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      flushSave();
    };
  }, [flushSave]);

  // Beacon-save on browser refresh / tab close — keepalive fetch survives page unload
  useEffect(() => {
    if (!id) return;
    const handleBeforeUnload = () => {
      if (Object.keys(pendingUpdates.current).length === 0) return;
      const updates = { ...pendingUpdates.current };
      pendingUpdates.current = {};
      if (saveTimer.current) clearTimeout(saveTimer.current);
      beaconUpdateCharacter(id, updates);
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [id]);

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="error">{error}</p>;
  if (!character) return <p>Character not found.</p>;

  return (
    <div className="character-sheet">
      <button
        className="character-sheet__back"
        onClick={() => navigate("/characters")}
      >
        ← Back
      </button>
      <div className="character-sheet__grid">
        <Section1HeroCard character={character} onChange={handleChange} />
        <Section2Statuses character={character} onChange={handleChange} />
        <Section3ThemeCards character={character} onChange={handleChange} />
        <Section4Details character={character} onChange={handleChange} />
      </div>
    </div>
  );
}
