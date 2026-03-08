import { useState, useCallback, useRef } from "react";
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

function BackpackInput({ onAdd }: { onAdd: (text: string) => void }) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const commit = () => {
    if (value.trim()) {
      onAdd(value.trim());
      setValue("");
      inputRef.current?.focus();
    }
  };
  return (
    <input
      ref={inputRef}
      className="session-char-card__backpack-input"
      value={value}
      placeholder="Add item…"
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commit(); } }}
    />
  );
}

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
        backpackTags: fullChar.backpackTags ?? [],
        companions: fullChar.companions ?? [],
        relationshipTags: fullChar.relationshipTags ?? [],
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

  const addBackpackItem = (charId: string, text: string) => {
    if (!text.trim()) return;
    onChange({
      characters: session.characters.map((c) =>
        c.characterId === charId
          ? { ...c, backpackTags: [...(c.backpackTags ?? []), text.trim()] }
          : c
      ),
    });
  };

  const removeBackpackItem = (charId: string, index: number) => {
    onChange({
      characters: session.characters.map((c) =>
        c.characterId === charId
          ? { ...c, backpackTags: (c.backpackTags ?? []).filter((_, i) => i !== index) }
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

  const toggleAbilityMark = (
    charId: string,
    themeIndex: number,
    abilityIndex: number
  ) => {
    onChange({
      characters: session.characters.map((c) =>
        c.characterId === charId
          ? {
              ...c,
              themeCards: c.themeCards.map((tc, i) =>
                i === themeIndex
                  ? {
                      ...tc,
                      abilities: tc.abilities.map((ab, j) => {
                        const ability = typeof ab === "string" ? { text: ab, isMarked: false } : ab;
                        return j === abilityIndex
                          ? { ...ability, isMarked: !ability.isMarked }
                          : ability;
                      }),
                    }
                  : tc
              ) as [any, any, any, any],
            }
          : c
      ),
    });
  };

  const toggleAbilityCross = (
    charId: string,
    themeIndex: number,
    abilityIndex: number
  ) => {
    onChange({
      characters: session.characters.map((c) =>
        c.characterId === charId
          ? {
              ...c,
              themeCards: c.themeCards.map((tc, i) =>
                i === themeIndex
                  ? {
                      ...tc,
                      abilities: tc.abilities.map((ab, j) => {
                        const ability = typeof ab === "string" ? { text: ab, isMarked: false } : ab;
                        return j === abilityIndex
                          ? { ...ability, isCrossed: !ability.isCrossed }
                          : ability;
                      }),
                    }
                  : tc
              ) as [any, any, any, any],
            }
          : c
      ),
    });
  };

  const toggleDownsideMark = (
    charId: string,
    themeIndex: number,
    downsideIndex: number
  ) => {
    onChange({
      characters: session.characters.map((c) =>
        c.characterId === charId
          ? {
              ...c,
              themeCards: c.themeCards.map((tc, i) =>
                i === themeIndex
                  ? {
                      ...tc,
                      downsides: tc.downsides.map((d, j) => {
                        const ds = typeof d === "string" ? { text: d, isMarked: false } : d;
                        return j === downsideIndex
                          ? { ...ds, isMarked: !ds.isMarked }
                          : ds;
                      }),
                    }
                  : tc
              ) as [any, any, any, any],
            }
          : c
      ),
    });
  };

  const toggleDownsideCross = (
    charId: string,
    themeIndex: number,
    downsideIndex: number
  ) => {
    onChange({
      characters: session.characters.map((c) =>
        c.characterId === charId
          ? {
              ...c,
              themeCards: c.themeCards.map((tc, i) =>
                i === themeIndex
                  ? {
                      ...tc,
                      downsides: tc.downsides.map((d, j) => {
                        const ds = typeof d === "string" ? { text: d, isMarked: false } : d;
                        return j === downsideIndex
                          ? { ...ds, isCrossed: !ds.isCrossed }
                          : ds;
                      }),
                    }
                  : tc
              ) as [any, any, any, any],
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
            {/* ── LEFT COLUMN ── */}
            <div className="session-char-card__left">
              <div className="session-char-card__name-row">
                <strong>{sc.name}</strong>
                <button
                  className="status-box__remove"
                  onClick={() => removeCharacter(sc.characterId)}
                  title="Remove from session"
                >
                  ×
                </button>
              </div>
              <div className="session-char-card__portrait-wrap">
                {sc.portraitUrl ? (
                  <img
                    className="session-char-card__portrait"
                    src={sc.portraitUrl}
                    alt={sc.name}
                  />
                ) : (
                  <div className="session-char-card__portrait-placeholder">?</div>
                )}
              </div>

              <div className="session-char-card__section">
                <span className="session-char-card__section-label">🎒 Backpack</span>
                <div className="session-char-card__tags">
                  {(sc.backpackTags ?? []).map((t, i) => (
                    <span key={i} className="session-char-card__tag">
                      {t}
                      <button
                        className="session-char-card__tag-remove"
                        onClick={() => removeBackpackItem(sc.characterId, i)}
                        title="Remove"
                      >×</button>
                    </span>
                  ))}
                </div>
                <BackpackInput onAdd={(text) => addBackpackItem(sc.characterId, text)} />
              </div>

              {(sc.companions ?? []).length > 0 && (
                <div className="session-char-card__section">
                  <span className="session-char-card__section-label">🐾 Companions</span>
                  <div className="session-char-card__tags">
                    {sc.companions.map((t, i) => (
                      <span key={i} className="session-char-card__tag">{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {(sc.relationshipTags ?? []).length > 0 && (
                <div className="session-char-card__section">
                  <span className="session-char-card__section-label">🤝 Relationships</span>
                  <div className="session-char-card__tags">
                    {sc.relationshipTags.map((t, i) => (
                      <span key={i} className="session-char-card__tag">{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Statuses */}
              <div className="session-char-card__section-label" style={{ marginTop: "0.25rem" }}>🏷️ Current Statuses</div>
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

            {/* ── RIGHT COLUMN ── */}
            <div className="session-char-card__right">
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
                            } ${ability.isCrossed ? "session-char-card__ability--crossed" : ""}`}
                            onClick={() => toggleAbilityMark(sc.characterId, i, j)}
                            title="Click text to glow, click icon to cross out"
                          >
                            {ability.text}
                            <span
                              className={`session-char-card__ability-icon ${
                                ability.isCrossed ? "session-char-card__ability-icon--active session-char-card__ability-icon--crossed" : ""
                              }`}
                              onClick={(e) => { e.stopPropagation(); toggleAbilityCross(sc.characterId, i, j); }}
                            >⚔️</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {tc.downsides.length > 0 && (
                    <ul className="session-char-card__abilities session-char-card__downsides">
                      {tc.downsides.map((ds, j) => {
                        const downside = typeof ds === "string" ? { text: ds, isMarked: false } : ds;
                        return (
                          <li
                            key={j}
                            className={`session-char-card__ability session-char-card__downside ${
                              downside.isMarked ? "session-char-card__downside--marked" : ""
                            } ${downside.isCrossed ? "session-char-card__ability--crossed" : ""}`}
                            onClick={() => toggleDownsideMark(sc.characterId, i, j)}
                            title="Click text to glow, click icon to cross out"
                          >
                            {downside.text}
                            <span
                              className={`session-char-card__ability-icon ${
                                downside.isCrossed ? "session-char-card__ability-icon--active session-char-card__ability-icon--crossed" : ""
                              }`}
                              onClick={(e) => { e.stopPropagation(); toggleDownsideCross(sc.characterId, i, j); }}
                            >⚔️</span>
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
            {/* end right column */}
          </div>
        ))}
      </div>
    </div>
  );
}
