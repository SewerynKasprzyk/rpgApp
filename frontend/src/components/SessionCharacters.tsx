import { useState, useCallback } from "react";
import {
  Session,
  UpdateSessionInput,
  Character,
  SessionCharacter,
  StatusTag,
  QuestCheckboxes,
} from "@rpg/shared";
import { v4 as uuid } from "uuid";
import RoundCheckbox from "./RoundCheckbox";
import CheckboxGroup from "./CheckboxGroup";

interface Props {
  session: Session;
  allCharacters: Character[];
  onChange: (updates: UpdateSessionInput) => void;
}

export default function SessionCharacters({
  session,
  allCharacters,
  onChange,
}: Props) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const charId = e.dataTransfer.getData("characterId");
      if (!charId) return;
      if (session.characters.some((c) => c.characterId === charId)) return;

      const fullChar = allCharacters.find((c) => c.id === charId);
      if (!fullChar) return;

      const newSessionChar: SessionCharacter = {
        characterId: fullChar.id,
        name: fullChar.name,
        portraitUrl: fullChar.portraitUrl ?? "",
        themeCards: fullChar.themeCards,
        currentStatuses: fullChar.currentStatuses,
        sectionQuestCheckboxes: fullChar.sectionQuestCheckboxes ?? {
          abandon: [false, false, false],
          improve: [false, false, false],
          milestone: [false, false, false],
        },
      };

      onChange({ characters: [...session.characters, newSessionChar] });
    },
    [session.characters, allCharacters, onChange]
  );

  const removeCharacter = (charId: string) => {
    onChange({
      characters: session.characters.filter((c) => c.characterId !== charId),
    });
  };

  const updateStatus = (
    charId: string,
    statusId: string,
    patch: Partial<StatusTag>
  ) => {
    onChange({
      characters: session.characters.map((c) =>
        c.characterId === charId
          ? {
              ...c,
              currentStatuses: c.currentStatuses.map((s) =>
                s.id === statusId ? { ...s, ...patch } : s
              ),
            }
          : c
      ),
    });
  };

  const addStatus = (charId: string) => {
    onChange({
      characters: session.characters.map((c) =>
        c.characterId === charId
          ? {
              ...c,
              currentStatuses: [
                ...c.currentStatuses,
                {
                  id: uuid(),
                  tag: "",
                  note: "",
                  checkboxes: [false, false, false, false, false, false] as [boolean, boolean, boolean, boolean, boolean, boolean],
                },
              ],
            }
          : c
      ),
    });
  };

  const removeStatus = (charId: string, statusId: string) => {
    onChange({
      characters: session.characters.map((c) =>
        c.characterId === charId
          ? {
              ...c,
              currentStatuses: c.currentStatuses.filter((s) => s.id !== statusId),
            }
          : c
      ),
    });
  };

  const updateThemeCheckboxes = (
    charId: string,
    themeIndex: number,
    key: keyof QuestCheckboxes,
    values: [boolean, boolean, boolean]
  ) => {
    onChange({
      characters: session.characters.map((c) =>
        c.characterId === charId
          ? {
              ...c,
              themeCards: c.themeCards.map((tc, i) =>
                i === themeIndex
                  ? { ...tc, checkboxes: { ...tc.checkboxes, [key]: values } }
                  : tc
              ) as [any, any, any, any],
            }
          : c
      ),
    });
  };

  const updateSectionQuestCheckboxes = (
    charId: string,
    key: keyof QuestCheckboxes,
    values: [boolean, boolean, boolean]
  ) => {
    onChange({
      characters: session.characters.map((c) =>
        c.characterId === charId
          ? {
              ...c,
              sectionQuestCheckboxes: {
                ...(c.sectionQuestCheckboxes ?? {
                  abandon: [false, false, false],
                  improve: [false, false, false],
                  milestone: [false, false, false],
                }),
                [key]: values,
              },
            }
          : c
      ),
    });
  };

  const toggleCheckbox = (
    charId: string,
    statusId: string,
    index: number
  ) => {
    const char = session.characters.find((c) => c.characterId === charId);
    if (!char) return;
    const status = char.currentStatuses.find((s) => s.id === statusId);
    if (!status) return;
    const cb: [boolean, boolean, boolean, boolean, boolean, boolean] = [
      ...status.checkboxes,
    ];
    if (!cb[index]) {
      for (let i = 0; i <= index; i++) cb[i] = true;
    } else {
      for (let i = index; i < cb.length; i++) cb[i] = false;
    }
    updateStatus(charId, statusId, { checkboxes: cb });
  };

  return (
    <div
      className={`section session-characters ${
        dragOver ? "session-characters--dragover" : ""
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <h3 className="section__title">Characters in Session</h3>

      {session.characters.length === 0 && (
        <p className="session-characters__hint">
          Drag characters from the sidebar to add them here
        </p>
      )}

      <div className="session-characters__grid">
        {session.characters.map((sc) => (
          <div key={sc.characterId} className="session-char-card">
            <div className="session-char-card__header">
              {sc.portraitUrl ? (
                <img
                  className="session-char-card__portrait"
                  src={sc.portraitUrl}
                  alt={sc.name}
                />
              ) : (
                <div className="session-char-card__portrait-placeholder">?</div>
              )}
              <div className="session-char-card__info">
                <strong>{sc.name}</strong>
                <button
                  className="status-box__remove"
                  onClick={() => removeCharacter(sc.characterId)}
                  title="Remove from session"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Theme card icons + abilities */}
            <div className="session-char-card__themes">
              {sc.themeCards.map((tc, i) => (
                <div key={i} className="session-char-card__theme-block">
                  <span className="session-char-card__theme-badge">
                    {tc.icon === "leaf"
                      ? "🌿"
                      : tc.icon === "sword"
                      ? "⚔️"
                      : tc.icon === "crown"
                      ? "👑"
                      : "—"}
                    {tc.type && ` ${tc.type}`}
                  </span>
                  {tc.abilities.length > 0 && (
                    <ul className="session-char-card__abilities">
                      {tc.abilities.map((ab, j) => {
                        const ability = typeof ab === "string" ? { text: ab, isMarked: false } : ab;
                        return (
                          <li
                            key={j}
                            className={`session-char-card__ability ${
                              ability.isMarked ? "session-char-card__ability--marked" : ""
                            }`}
                          >
                            {ability.isMarked && <span className="session-char-card__ability-icon">⚔️</span>}
                            {ability.text}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {tc.quests.length > 0 && (
                    <ul className="session-char-card__quests">
                      {tc.quests.map((q) => (
                        <li
                          key={q.id}
                          className={`session-char-card__quest ${
                            q.crossedOut ? "session-char-card__quest--crossed" : ""
                          }`}
                        >
                          📜 {q.text}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="session-char-card__theme-checkboxes">
                    <CheckboxGroup
                      label="Abandon"
                      values={tc.checkboxes.abandon}
                      onChange={(v) => updateThemeCheckboxes(sc.characterId, i, "abandon", v)}
                    />
                    <CheckboxGroup
                      label="Improve"
                      values={tc.checkboxes.improve}
                      onChange={(v) => updateThemeCheckboxes(sc.characterId, i, "improve", v)}
                    />
                    <CheckboxGroup
                      label="Milestone"
                      values={tc.checkboxes.milestone}
                      onChange={(v) => updateThemeCheckboxes(sc.characterId, i, "milestone", v)}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Section Quest Checkboxes */}
            <div className="session-char-card__section-checkboxes">
              <h4 className="session-char-card__section-label">Quest Progress</h4>
              <div className="quest-checkboxes">
                <CheckboxGroup
                  label="Abandon"
                  values={(sc.sectionQuestCheckboxes ?? { abandon: [false, false, false], improve: [false, false, false], milestone: [false, false, false] }).abandon}
                  onChange={(v) => updateSectionQuestCheckboxes(sc.characterId, "abandon", v)}
                />
                <CheckboxGroup
                  label="Improve"
                  values={(sc.sectionQuestCheckboxes ?? { abandon: [false, false, false], improve: [false, false, false], milestone: [false, false, false] }).improve}
                  onChange={(v) => updateSectionQuestCheckboxes(sc.characterId, "improve", v)}
                />
                <CheckboxGroup
                  label="Milestone"
                  values={(sc.sectionQuestCheckboxes ?? { abandon: [false, false, false], improve: [false, false, false], milestone: [false, false, false] }).milestone}
                  onChange={(v) => updateSectionQuestCheckboxes(sc.characterId, "milestone", v)}
                />
              </div>
            </div>

            {/* Statuses */}
            <div className="status-list">
              {sc.currentStatuses.map((s) => (
                <div key={s.id} className="status-box">
                  <div className="status-box__top">
                    <input
                      className="status-box__tag"
                      value={s.tag}
                      placeholder="Tag"
                      onChange={(e) =>
                        updateStatus(sc.characterId, s.id, {
                          tag: e.target.value,
                        })
                      }
                    />
                    <input
                      className="status-box__note"
                      value={s.note}
                      placeholder="Note"
                      onChange={(e) =>
                        updateStatus(sc.characterId, s.id, {
                          note: e.target.value,
                        })
                      }
                    />
                    <button
                      type="button"
                      className="status-box__remove"
                      onClick={() => removeStatus(sc.characterId, s.id)}
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
                        onChange={() =>
                          toggleCheckbox(sc.characterId, s.id, i)
                        }
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="add-slot-btn"
              onClick={() => addStatus(sc.characterId)}
            >
              + Create Tag
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
