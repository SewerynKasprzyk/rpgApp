import { useEffect } from "react";
import { Character } from "@rpg/shared";
import { subscribe } from "../services/realtimeClient";

export function useRealtimeCharacters(
  setCharacters: React.Dispatch<React.SetStateAction<Character[]>>
) {
  useEffect(() => {
    const unsubscribe = subscribe((event) => {
      switch (event.type) {
        case "character_created":
          setCharacters((prev) => {
            if (prev.find((c) => c.id === event.character.id)) return prev;
            return [...prev, event.character];
          });
          break;
        case "character_updated":
          setCharacters((prev) =>
            prev.map((c) => (c.id === event.character.id ? event.character : c))
          );
          break;
        case "character_deleted":
          setCharacters((prev) =>
            prev.filter((c) => c.id !== event.characterId)
          );
          break;
      }
    });

    return unsubscribe;
  }, [setCharacters]);
}
