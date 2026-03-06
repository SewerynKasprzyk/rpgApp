import { useState } from "react";
import { useCharacters } from "../hooks/useCharacters";
import CharacterList from "../components/CharacterList";
import { CreateCharacterInput } from "@rpg/shared";

export default function Characters() {
  const { characters, loading, error, create, remove } = useCharacters();
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [charClass, setCharClass] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const input: CreateCharacterInput = {
      name,
      class: charClass,
      level: 1,
      hp: 1,
      maxHp: 1,
      inventory: [],
      campaignId: "",
      ownerId: "",
    };
    await create(input);
    setName("");
    setCharClass("");
    setShowForm(false);
  };

  return (
    <div>
      <div className="page-header">
        <h2>Characters</h2>
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ New Character"}
        </button>
      </div>

      {showForm && (
        <form className="create-form" onSubmit={handleCreate}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="new-name">Name</label>
              <input
                id="new-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="new-class">Class</label>
              <input
                id="new-class"
                value={charClass}
                onChange={(e) => setCharClass(e.target.value)}
                required
              />
            </div>
          </div>
          <button type="submit">Create Character</button>
        </form>
      )}

      {loading && <p>Loading…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && <CharacterList characters={characters} onDelete={remove} />}
    </div>
  );
}
