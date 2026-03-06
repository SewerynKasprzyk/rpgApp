import { Character } from "@rpg/shared";
import CharacterCard from "./CharacterCard";

interface Props {
  characters: Character[];
  onDelete?: (id: string) => void;
}

export default function CharacterList({ characters, onDelete }: Props) {
  if (characters.length === 0) {
    return <p>No characters yet. Create one to get started!</p>;
  }

  return (
    <div className="character-list">
      {characters.map((c) => (
        <CharacterCard key={c.id} character={c} onDelete={onDelete} />
      ))}
    </div>
  );
}
