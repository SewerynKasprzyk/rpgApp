import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Character, UpdateCharacterInput } from "@rpg/shared";
import { fetchCharacter, updateCharacter } from "../services/apiClient";
import CharacterEditor from "../components/CharacterEditor";

export default function CharacterDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchCharacter(id)
      .then(setCharacter)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async (_id: string, input: UpdateCharacterInput) => {
    if (!id) return;
    const updated = await updateCharacter(id, input);
    setCharacter(updated);
  };

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="error">{error}</p>;
  if (!character) return <p>Character not found.</p>;

  return (
    <div>
      <button onClick={() => navigate("/characters")} style={{ marginBottom: "1rem" }}>
        ← Back to Characters
      </button>
      <h2>Edit: {character.name}</h2>
      <CharacterEditor character={character} onSave={handleSave} />
    </div>
  );
}
