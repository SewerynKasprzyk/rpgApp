import { useState, useEffect, useCallback } from "react";
import { Character, CreateCharacterInput, UpdateCharacterInput } from "@rpg/shared";
import * as api from "../services/apiClient";

export function useCharacters() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.fetchCharacters();
      setCharacters(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch characters");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = async (input: CreateCharacterInput) => {
    const created = await api.createCharacter(input);
    setCharacters((prev) => [...prev, created]);
    return created;
  };

  const update = async (id: string, input: UpdateCharacterInput) => {
    const updated = await api.updateCharacter(id, input);
    setCharacters((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  };

  const remove = async (id: string) => {
    await api.deleteCharacter(id);
    setCharacters((prev) => prev.filter((c) => c.id !== id));
  };

  return { characters, loading, error, refresh, create, update, remove };
}
