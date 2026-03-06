import { Character, StatusTag, UpdateCharacterInput } from "@rpg/shared";
import { v4 as uuid } from "uuid";
import RoundCheckbox from "./RoundCheckbox";

interface Props {
  character: Character;
  onChange: (updates: UpdateCharacterInput) => void;
}

export default function Section2Statuses({ character, onChange }: Props) {
  const statuses = character.currentStatuses;

  const updateStatus = (id: string, patch: Partial<StatusTag>) => {
    const updated = statuses.map((s) =>
      s.id === id ? { ...s, ...patch } : s
    );
    onChange({ currentStatuses: updated });
  };

  const toggleCheckbox = (id: string, index: number) => {
    const status = statuses.find((s) => s.id === id);
    if (!status) return;
    const cb: [boolean, boolean, boolean, boolean, boolean, boolean] = [
      ...status.checkboxes,
    ];
    if (!cb[index]) {
      for (let i = 0; i <= index; i++) cb[i] = true;
    } else {
      for (let i = index; i < cb.length; i++) cb[i] = false;
    }
    updateStatus(id, { checkboxes: cb });
  };

  const removeStatus = (id: string) => {
    onChange({ currentStatuses: statuses.filter((s) => s.id !== id) });
  };

  const addStatus = () => {
    onChange({
      currentStatuses: [
        ...statuses,
        {
          id: uuid(),
          tag: "",
          note: "",
          checkboxes: [false, false, false, false, false, false],
        },
      ],
    });
  };

  return (
    <div className="section section2">
      <h3 className="section__title">Current Statuses</h3>
      <div className="status-list">
        {statuses.map((s) => (
          <div key={s.id} className="status-box">
            <div className="status-box__top">
              <input
                className="status-box__tag"
                value={s.tag}
                placeholder="Tag"
                onChange={(e) => updateStatus(s.id, { tag: e.target.value })}
              />
              <input
                className="status-box__note"
                value={s.note}
                placeholder="Note"
                onChange={(e) => updateStatus(s.id, { note: e.target.value })}
              />
              <button
                type="button"
                className="status-box__remove"
                onClick={() => removeStatus(s.id)}
                title="Remove status"
              >
                ×
              </button>
            </div>
            <div className="status-box__checkboxes">
              {s.checkboxes.map((v, i) => (
                <RoundCheckbox
                  key={i}
                  checked={v}
                  onChange={() => toggleCheckbox(s.id, i)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <button type="button" className="add-slot-btn" onClick={addStatus}>
        + Create Tag
      </button>
    </div>
  );
}
