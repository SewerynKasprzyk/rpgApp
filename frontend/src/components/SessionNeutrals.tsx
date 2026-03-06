import { Session, UpdateSessionInput, StatusTag, SessionNeutral } from "@rpg/shared";
import { v4 as uuid } from "uuid";
import RoundCheckbox from "./RoundCheckbox";

interface Props {
  session: Session;
  onChange: (updates: UpdateSessionInput) => void;
}

export default function SessionNeutrals({ session, onChange }: Props) {
  const neutrals = session.neutrals;

  const addNeutral = () => {
    onChange({
      neutrals: [
        ...neutrals,
        { id: uuid(), name: "", statuses: [] },
      ],
    });
  };

  const removeNeutral = (id: string) => {
    onChange({ neutrals: neutrals.filter((n) => n.id !== id) });
  };

  const updateNeutral = (id: string, patch: Partial<SessionNeutral>) => {
    onChange({
      neutrals: neutrals.map((n) => (n.id === id ? { ...n, ...patch } : n)),
    });
  };

  const addStatus = (neutralId: string) => {
    const neutral = neutrals.find((n) => n.id === neutralId);
    if (!neutral) return;
    updateNeutral(neutralId, {
      statuses: [
        ...neutral.statuses,
        { id: uuid(), tag: "", note: "", checkboxes: [false, false, false, false, false, false] },
      ],
    });
  };

  const updateStatus = (
    neutralId: string,
    statusId: string,
    patch: Partial<StatusTag>
  ) => {
    const neutral = neutrals.find((n) => n.id === neutralId);
    if (!neutral) return;
    updateNeutral(neutralId, {
      statuses: neutral.statuses.map((s) =>
        s.id === statusId ? { ...s, ...patch } : s
      ),
    });
  };

  const removeStatus = (neutralId: string, statusId: string) => {
    const neutral = neutrals.find((n) => n.id === neutralId);
    if (!neutral) return;
    updateNeutral(neutralId, {
      statuses: neutral.statuses.filter((s) => s.id !== statusId),
    });
  };

  const toggleCheckbox = (
    neutralId: string,
    statusId: string,
    index: number
  ) => {
    const neutral = neutrals.find((n) => n.id === neutralId);
    if (!neutral) return;
    const status = neutral.statuses.find((s) => s.id === statusId);
    if (!status) return;
    const cb: [boolean, boolean, boolean, boolean, boolean, boolean] = [
      ...status.checkboxes,
    ];
    if (!cb[index]) {
      for (let i = 0; i <= index; i++) cb[i] = true;
    } else {
      for (let i = index; i < cb.length; i++) cb[i] = false;
    }
    updateStatus(neutralId, statusId, { checkboxes: cb });
  };

  return (
    <div className="section session-neutrals">
      <h3 className="section__title">Neutral Characters</h3>
      <div className="session-entity-list">
        {neutrals.map((neutral) => (
          <div key={neutral.id} className="session-entity-card">
            <div className="session-entity-card__header">
              <input
                className="session-entity-card__name"
                value={neutral.name}
                placeholder="Character name"
                onChange={(e) =>
                  updateNeutral(neutral.id, { name: e.target.value })
                }
              />
              <button
                className="status-box__remove"
                onClick={() => removeNeutral(neutral.id)}
                title="Remove character"
              >
                ×
              </button>
            </div>
            <div className="status-list">
              {neutral.statuses.map((s) => (
                <div key={s.id} className="status-box">
                  <div className="status-box__top">
                    <input
                      className="status-box__tag"
                      value={s.tag}
                      placeholder="Tag"
                      onChange={(e) =>
                        updateStatus(neutral.id, s.id, { tag: e.target.value })
                      }
                    />
                    <input
                      className="status-box__note"
                      value={s.note}
                      placeholder="Note"
                      onChange={(e) =>
                        updateStatus(neutral.id, s.id, { note: e.target.value })
                      }
                    />
                    <button
                      className="status-box__remove"
                      onClick={() => removeStatus(neutral.id, s.id)}
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
                        onChange={() => toggleCheckbox(neutral.id, s.id, i)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="add-slot-btn"
              onClick={() => addStatus(neutral.id)}
            >
              + Add Status
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="add-slot-btn" onClick={addNeutral}>
        + Add Character
      </button>
    </div>
  );
}
