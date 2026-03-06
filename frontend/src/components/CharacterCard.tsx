import { useState } from "react";
import { Link } from "react-router-dom";
import { Character } from "@rpg/shared";

interface Props {
  character: Character;
  onDelete?: (id: string) => void;
}

export default function CharacterCard({ character, onDelete }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleDelete = () => {
    if (confirmText === character.name && onDelete) {
      onDelete(character.id);
      setConfirmOpen(false);
      setConfirmText("");
    }
  };

  return (
    <div className="character-card">
      <h3>
        <Link to={`/characters/${character.id}`}>{character.name}</Link>
      </h3>
      <p>
        <strong>Class:</strong> {character.class}
      </p>
      <div className="character-card-actions">
        <Link to={`/characters/${character.id}`}>
          <button>Edit</button>
        </Link>
        {onDelete && !confirmOpen && (
          <button className="btn-danger" onClick={() => setConfirmOpen(true)}>
            Delete
          </button>
        )}
      </div>

      {confirmOpen && (
        <div className="delete-confirm">
          <p className="delete-confirm__warning">
            ⚠ This will permanently delete <strong>{character.name}</strong>.
          </p>
          <p className="delete-confirm__prompt">
            Type <strong>{character.name}</strong> to confirm:
          </p>
          <input
            className="delete-confirm__input"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={character.name}
            autoFocus
          />
          <div className="delete-confirm__actions">
            <button
              className="btn-danger"
              disabled={confirmText !== character.name}
              onClick={handleDelete}
            >
              Confirm Delete
            </button>
            <button
              onClick={() => {
                setConfirmOpen(false);
                setConfirmText("");
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
