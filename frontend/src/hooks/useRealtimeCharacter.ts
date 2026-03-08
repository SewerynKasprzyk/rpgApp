import { useEffect } from "react";
import { Character } from "@rpg/shared";
import { subscribe } from "../services/realtimeClient";

/**
 * Listens for real-time updates to a single character.
 * When another user edits the same character, the local state is updated.
 */
export function useRealtimeCharacter(
  characterId: string | undefined,
  setCharacter: React.Dispatch<React.SetStateAction<Character | null>>
) {
  useEffect(() => {
    if (!characterId) return;

    const unsubscribe = subscribe((event) => {
      if (
        event.type === "character_updated" &&
        event.character.id === characterId
      ) {
        setCharacter((prev) => {
          const merged = prev ? { ...prev, ...event.character } : event.character;
          return {
            ...merged,
            sectionQuestCheckboxes: merged.sectionQuestCheckboxes ?? { abandon: [false,false,false], improve: [false,false,false], milestone: [false,false,false] },
          } as typeof merged;
        });
      }
      if (
        event.type === "character_deleted" &&
        event.characterId === characterId
      ) {
        setCharacter(null);
      }
    });

    return unsubscribe;
  }, [characterId, setCharacter]);
}
