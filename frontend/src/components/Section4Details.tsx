import { Character, UpdateCharacterInput } from "@rpg/shared";
import AutoExpandTextarea from "./AutoExpandTextarea";

interface Props {
  character: Character;
  onChange: (updates: UpdateCharacterInput) => void;
}

export default function Section4Details({ character, onChange }: Props) {
  return (
    <div className="section section4">
      <div className="section4__text">
        <div className="sheet-box">
          <label className="sheet-box__label">Character Name</label>
          <input
            className="sheet-box__input"
            value={character.name}
            onChange={(e) => onChange({ name: e.target.value })}
          />
        </div>

        <div className="sheet-box">
          <label className="sheet-box__label">History</label>
          <AutoExpandTextarea
            value={character.history}
            onValueChange={(val) => onChange({ history: val })}
            placeholder="Write character history..."
          />
        </div>

        <div className="sheet-box">
          <label className="sheet-box__label">Notes</label>
          <AutoExpandTextarea
            value={character.notes}
            onValueChange={(val) => onChange({ notes: val })}
            placeholder="Write notes..."
          />
        </div>
      </div>

      <div className="section4__portrait">
        <div className="sheet-box">
          <label className="sheet-box__label">Portrait</label>
          {character.portraitUrl ? (
            <img
              className="portrait-img"
              src={character.portraitUrl}
              alt={`${character.name} portrait`}
            />
          ) : (
            <div className="portrait-placeholder">No portrait</div>
          )}
          <input
            className="sheet-box__input"
            value={character.portraitUrl}
            onChange={(e) => onChange({ portraitUrl: e.target.value })}
            placeholder="Portrait URL"
          />
        </div>
      </div>
    </div>
  );
}
