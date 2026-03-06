import { Session, UpdateSessionInput, StatusTag, SessionEnemy } from "@rpg/shared";
import { v4 as uuid } from "uuid";
import RoundCheckbox from "./RoundCheckbox";

interface Props {
  session: Session;
  onChange: (updates: UpdateSessionInput) => void;
}

export default function SessionEnemies({ session, onChange }: Props) {
  const enemies = session.enemies;

  const addEnemy = () => {
    onChange({
      enemies: [
        ...enemies,
        { id: uuid(), name: "", statuses: [] },
      ],
    });
  };

  const removeEnemy = (id: string) => {
    onChange({ enemies: enemies.filter((e) => e.id !== id) });
  };

  const updateEnemy = (id: string, patch: Partial<SessionEnemy>) => {
    onChange({
      enemies: enemies.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    });
  };

  const addStatus = (enemyId: string) => {
    const enemy = enemies.find((e) => e.id === enemyId);
    if (!enemy) return;
    updateEnemy(enemyId, {
      statuses: [
        ...enemy.statuses,
        { id: uuid(), tag: "", note: "", checkboxes: [false, false, false, false, false, false] },
      ],
    });
  };

  const updateStatus = (
    enemyId: string,
    statusId: string,
    patch: Partial<StatusTag>
  ) => {
    const enemy = enemies.find((e) => e.id === enemyId);
    if (!enemy) return;
    updateEnemy(enemyId, {
      statuses: enemy.statuses.map((s) =>
        s.id === statusId ? { ...s, ...patch } : s
      ),
    });
  };

  const removeStatus = (enemyId: string, statusId: string) => {
    const enemy = enemies.find((e) => e.id === enemyId);
    if (!enemy) return;
    updateEnemy(enemyId, {
      statuses: enemy.statuses.filter((s) => s.id !== statusId),
    });
  };

  const toggleCheckbox = (
    enemyId: string,
    statusId: string,
    index: number
  ) => {
    const enemy = enemies.find((e) => e.id === enemyId);
    if (!enemy) return;
    const status = enemy.statuses.find((s) => s.id === statusId);
    if (!status) return;
    const cb: [boolean, boolean, boolean, boolean, boolean, boolean] = [
      ...status.checkboxes,
    ];
    if (!cb[index]) {
      for (let i = 0; i <= index; i++) cb[i] = true;
    } else {
      for (let i = index; i < cb.length; i++) cb[i] = false;
    }
    updateStatus(enemyId, statusId, { checkboxes: cb });
  };

  return (
    <div className="section session-enemies">
      <h3 className="section__title">Enemies</h3>
      <div className="session-entity-list">
        {enemies.map((enemy) => (
          <div key={enemy.id} className="session-entity-card">
            <div className="session-entity-card__header">
              <input
                className="session-entity-card__name"
                value={enemy.name}
                placeholder="Enemy name"
                onChange={(e) => updateEnemy(enemy.id, { name: e.target.value })}
              />
              <button
                className="status-box__remove"
                onClick={() => removeEnemy(enemy.id)}
                title="Remove enemy"
              >
                ×
              </button>
            </div>
            <div className="status-list">
              {enemy.statuses.map((s) => (
                <div key={s.id} className="status-box">
                  <div className="status-box__top">
                    <input
                      className="status-box__tag"
                      value={s.tag}
                      placeholder="Tag"
                      onChange={(e) =>
                        updateStatus(enemy.id, s.id, { tag: e.target.value })
                      }
                    />
                    <input
                      className="status-box__note"
                      value={s.note}
                      placeholder="Note"
                      onChange={(e) =>
                        updateStatus(enemy.id, s.id, { note: e.target.value })
                      }
                    />
                    <button
                      className="status-box__remove"
                      onClick={() => removeStatus(enemy.id, s.id)}
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
                        onChange={() => toggleCheckbox(enemy.id, s.id, i)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="add-slot-btn"
              onClick={() => addStatus(enemy.id)}
            >
              + Add Status
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="add-slot-btn" onClick={addEnemy}>
        + Add Enemy
      </button>
    </div>
  );
}
