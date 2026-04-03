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

type BackpackTagView = { id: string; label: string; isGlowing?: boolean; isCons?: boolean };

function normalizeBackpackTags(raw: Array<string | StatusTag | { id?: string; label?: string; isGlowing?: boolean; isCons?: boolean }> | undefined): BackpackTagView[] {
  return (raw ?? []).map((entry, idx) => {
    if (typeof entry === "string") {
      return {
        id: `bp-${idx}-${entry}`,
        label: entry,
      };
    }

    return {
      id: entry.id ?? `bp-${idx}-${(entry as any).label ?? (entry as any).tag ?? "item"}`,
      label: (entry as any).label ?? (entry as any).tag ?? "",
      isGlowing: (entry as any).isGlowing,
      isCons: (entry as any).isCons,
    };
  });
}

function SceneStatusInput({ onAdd }: { onAdd: (label: string) => void }) {
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
      placeholder="Add status…"
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

  const pressRef = useRef<{ timer: ReturnType<typeof setTimeout>; key: string } | null>(null);
  const [pressingAbilityKey, setPressingAbilityKey] = useState<string | null>(null);
  const didLongPressRef = useRef(false);

  /* ── Generic long-press helper for chips / status-boxes ── */
  const chipPressRef = useRef<{ timer: ReturnType<typeof setTimeout>; key: string } | null>(null);
  const [pressingChipKey, setPressingChipKey] = useState<string | null>(null);
  const chipDidLongRef = useRef(false);

  const startAbilityLongPress = (charId: string, themeIdx: number, abilityIdx: number) => {
    const key = `${charId}-${themeIdx}-${abilityIdx}`;
    if (pressRef.current) clearTimeout(pressRef.current.timer);
    setPressingAbilityKey(key);
    pressRef.current = {
      key,
      timer: setTimeout(() => {
        setPressingAbilityKey(null);
        pressRef.current = null;
        didLongPressRef.current = true;
        toggleAbilityCons(charId, themeIdx, abilityIdx);
      }, 900),
    };
  };

  const cancelAbilityLongPress = () => {
    if (pressRef.current) {
      clearTimeout(pressRef.current.timer);
      pressRef.current = null;
    }
    setPressingAbilityKey(null);
  };

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
        sceneStatuses: fullChar.sceneStatuses ?? [],
        currentStatuses: fullChar.currentStatuses ?? [],
        sectionQuestCheckboxes: fullChar.sectionQuestCheckboxes ?? {
          abandon: [false, false, false],
          improve: [false, false, false],
          milestone: [false, false, false],
        },
        backpackTags: normalizeBackpackTags(fullChar.backpackTags).sort((a, b) =>
          a.label.localeCompare(b.label, undefined, { sensitivity: "base" })
        ),
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
              currentStatuses: (c.currentStatuses ?? []).map((s) =>
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
                ...(c.currentStatuses ?? []),
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
              currentStatuses: (c.currentStatuses ?? []).filter((s) => s.id !== statusId),
            }
          : c
      ),
    });
  };

  const addSceneStatus = (charId: string, label: string) => {
    if (!label.trim()) return;
    onChange({
      characters: session.characters.map((c) =>
        c.characterId === charId
          ? { ...c, sceneStatuses: [...(c.sceneStatuses ?? []), { id: uuid(), label: label.trim() }] }
          : c
      ),
    });
  };

  const removeSceneStatus = (charId: string, statusId: string) => {
    onChange({
      characters: session.characters.map((c) =>
        c.characterId === charId
          ? { ...c, sceneStatuses: (c.sceneStatuses ?? []).filter((s) => s.id !== statusId) }
          : c
      ),
    });
  };

  /* ── Glow / Cons for scene status chips ── */
  const toggleSceneStatusGlow = (charId: string, statusId: string) => {
    if (chipDidLongRef.current) { chipDidLongRef.current = false; return; }
    onChange({
      characters: session.characters.map((c) =>
        c.characterId === charId
          ? { ...c, sceneStatuses: (c.sceneStatuses ?? []).map((s) =>
              s.id === statusId ? { ...s, isGlowing: !(s as any).isGlowing, isCons: false } : s
            ) }
          : c
      ),
    });
  };

  const toggleSceneStatusCons = (charId: string, statusId: string) => {
    onChange({
      characters: session.characters.map((c) =>
        c.characterId === charId
          ? { ...c, sceneStatuses: (c.sceneStatuses ?? []).map((s) =>
              s.id === statusId ? { ...s, isCons: !(s as any).isCons, isGlowing: false } : s
            ) }
          : c
      ),
    });
  };

  const startChipLongPress = (key: string, onLong: () => void) => {
    if (chipPressRef.current) clearTimeout(chipPressRef.current.timer);
    chipDidLongRef.current = false;
    setPressingChipKey(key);
    chipPressRef.current = {
      key,
      timer: setTimeout(() => {
        setPressingChipKey(null);
        chipPressRef.current = null;
        chipDidLongRef.current = true;
        onLong();
      }, 700),
    };
  };

  const cancelChipLongPress = () => {
    if (chipPressRef.current) {
      clearTimeout(chipPressRef.current.timer);
      chipPressRef.current = null;
    }
    setPressingChipKey(null);
  };

  /* ── Glow / Cons for current status tags ── */
  const toggleStatusGlow = (charId: string, statusId: string) => {
    if (chipDidLongRef.current) { chipDidLongRef.current = false; return; }
    onChange({
      characters: session.characters.map((c) =>
        c.characterId === charId
          ? { ...c, currentStatuses: (c.currentStatuses ?? []).map((s) =>
              s.id === statusId ? { ...s, isGlowing: !(s as any).isGlowing, isCons: false } : s
            ) }
          : c
      ),
    });
  };

  const toggleStatusCons = (charId: string, statusId: string) => {
    onChange({
      characters: session.characters.map((c) =>
        c.characterId === charId
          ? { ...c, currentStatuses: (c.currentStatuses ?? []).map((s) =>
              s.id === statusId ? { ...s, isCons: !(s as any).isCons, isGlowing: false } : s
            ) }
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
    if (didLongPressRef.current) {
      didLongPressRef.current = false;
      return;
    }
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
                          ? { ...ability, isMarked: !ability.isMarked, isCons: false }
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

  const toggleAbilityCons = (
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
                          ? { ...ability, isCons: !(ability as any).isCons, isMarked: false }
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
    const status = (char.currentStatuses ?? []).find((s) => s.id === statusId);
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

  const updateBackpackTags = (
    charId: string,
    updater: (tags: BackpackTagView[]) => BackpackTagView[]
  ) => {
    onChange({
      characters: session.characters.map((c) =>
        c.characterId === charId
          ? { ...c, backpackTags: updater(normalizeBackpackTags(c.backpackTags as Array<string | StatusTag> | undefined)) }
          : c
      ),
    });
  };

  const toggleBackpackGlow = (charId: string, tagId: string) => {
    if (chipDidLongRef.current) {
      chipDidLongRef.current = false;
      return;
    }
    updateBackpackTags(charId, (tags) =>
      tags.map((t) =>
        t.id === tagId ? { ...t, isGlowing: !(t as any).isGlowing, isCons: false } : t
      )
    );
  };

  const toggleBackpackCons = (charId: string, tagId: string) => {
    updateBackpackTags(charId, (tags) =>
      tags.map((t) =>
        t.id === tagId ? { ...t, isCons: !(t as any).isCons, isGlowing: false } : t
      )
    );
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
          Drag characters from the list below to add them here
        </p>
      )}

      {/* Character picker row — native-drag chars into session */}
      {allCharacters.filter(c => !session.characters.some(sc => sc.characterId === c.id)).length > 0 && (
        <div className="session-char-picker">
          <span className="session-char-picker__label">Drag to add:</span>
          <div className="session-char-picker__list">
            {allCharacters
              .filter(c => !session.characters.some(sc => sc.characterId === c.id))
              .map(c => (
                <div
                  key={c.id}
                  className="session-char-picker__item"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("characterId", c.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                >
                  {c.portraitUrl
                    ? <img className="session-char-picker__portrait" src={c.portraitUrl} alt={c.name} />
                    : <div className="session-char-picker__portrait-placeholder">?</div>}
                  <span className="session-char-picker__name">{c.name}</span>
                </div>
              ))}
          </div>
        </div>
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

              {/* Scene Statuses — simple chips, synced from scene board */}
              <div className="session-char-card__section">
                <span className="session-char-card__section-label">🎯 Statuses</span>
                <div className="session-char-card__chips">
                  {(sc.sceneStatuses ?? []).map((s) => {
                    const chipKey = `chip-${sc.characterId}-${s.id}`;
                    const isGlowing = (s as any).isGlowing;
                    const isCons = (s as any).isCons;
                    const stateClass = isCons
                      ? " session-char-card__chip--cons"
                      : isGlowing
                        ? " session-char-card__chip--glowing"
                        : "";
                    const pressingClass = pressingChipKey === chipKey ? " session-char-card__chip--pressing" : "";
                    return (
                      <span
                        key={s.id}
                        className={`session-char-card__chip${stateClass}${pressingClass}`}
                        onPointerDown={(e) => { e.stopPropagation(); startChipLongPress(chipKey, () => toggleSceneStatusCons(sc.characterId, s.id)); }}
                        onPointerUp={(e) => { e.stopPropagation(); cancelChipLongPress(); }}
                        onPointerLeave={cancelChipLongPress}
                        onClick={() => toggleSceneStatusGlow(sc.characterId, s.id)}
                        title="Click = glow (pros) | Hold = cons (violet)"
                      >
                        {s.label}
                        <button
                          className="session-char-card__chip-remove"
                          onClick={(e) => { e.stopPropagation(); removeSceneStatus(sc.characterId, s.id); }}
                          title="Remove"
                        >×</button>
                      </span>
                    );
                  })}
                </div>
                <SceneStatusInput onAdd={(label) => addSceneStatus(sc.characterId, label)} />
              </div>

              {(sc.companions ?? []).length > 0 && (
                <div className="session-char-card__section">
                  <span className="session-char-card__section-label">🐾 Companions</span>
                  <div className="session-char-card__tags">
                    {(sc.companions ?? []).map((t, i) => (
                      <span key={i} className="session-char-card__tag">{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {normalizeBackpackTags(sc.backpackTags as Array<string | StatusTag> | undefined).length > 0 && (
                <div className="session-char-card__section">
                  <span className="session-char-card__section-label">🎒 Backpack</span>
                  <div className="session-char-card__chips">
                    {normalizeBackpackTags(sc.backpackTags as Array<string | StatusTag> | undefined).map((t) => {
                      const key = `bp-${sc.characterId}-${t.id}`;
                      const isGlowing = (t as any).isGlowing;
                      const isCons = (t as any).isCons;
                      const stateClass = isCons
                        ? " session-char-card__chip--cons"
                        : isGlowing
                          ? " session-char-card__chip--glowing"
                          : "";
                      const pressingClass = pressingChipKey === key ? " session-char-card__chip--pressing" : "";

                      return (
                        <span
                          key={key}
                          className={`session-char-card__chip${stateClass}${pressingClass}`}
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            startChipLongPress(key, () => toggleBackpackCons(sc.characterId, t.id));
                          }}
                          onPointerUp={(e) => {
                            e.stopPropagation();
                            cancelChipLongPress();
                          }}
                          onPointerLeave={cancelChipLongPress}
                          onClick={() => toggleBackpackGlow(sc.characterId, t.id)}
                          title="Click = glow (pros) | Hold = cons (violet)"
                        >
                          {t.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {(sc.relationshipTags ?? []).length > 0 && (
                <div className="session-char-card__section">
                  <span className="session-char-card__section-label">🤝 Relationships</span>
                  <div className="session-char-card__tags">
                    {(sc.relationshipTags ?? []).map((t, i) => (
                      <span key={i} className="session-char-card__tag">{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Statuses */}
              <div className="session-char-card__section-label" style={{ marginTop: "0.25rem" }}>🏷️ Current Statuses</div>
              <div className="status-list">
                {(sc.currentStatuses ?? []).map((s) => {
                  const tagKey = `tag-${sc.characterId}-${s.id}`;
                  const isGlowing = (s as any).isGlowing;
                  const isCons = (s as any).isCons;
                  const stateClass = isCons
                    ? " status-box--cons"
                    : isGlowing
                      ? " status-box--glowing"
                      : "";
                  const pressingClass = pressingChipKey === tagKey ? " status-box--pressing" : "";
                  return (
                    <div
                      key={s.id}
                      className={`status-box${stateClass}${pressingClass}`}
                      onPointerDown={(e) => { e.stopPropagation(); startChipLongPress(tagKey, () => toggleStatusCons(sc.characterId, s.id)); }}
                      onPointerUp={(e) => { e.stopPropagation(); cancelChipLongPress(); }}
                      onPointerLeave={cancelChipLongPress}
                      onClick={() => toggleStatusGlow(sc.characterId, s.id)}
                      title="Click = glow (pros) | Hold = cons (violet)"
                    >
                      <div className="status-box__top">
                        <input
                          className="status-box__tag"
                          value={s.tag}
                          placeholder="Tag"
                          onClick={(e) => e.stopPropagation()}
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
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            updateStatus(sc.characterId, s.id, {
                              note: e.target.value,
                            })
                          }
                        />
                        <button
                          type="button"
                          className="status-box__remove"
                          onClick={(e) => { e.stopPropagation(); removeStatus(sc.characterId, s.id); }}
                          title="Remove status"
                        >
                          ×
                        </button>
                      </div>
                      <div className="status-box__checkboxes" onClick={(e) => e.stopPropagation()}>
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
                  );
                })}
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
                            } ${(ability as any).isCons ? "session-char-card__ability--cons" : ""} ${
                              ability.isCrossed ? "session-char-card__ability--crossed" : ""
                            } ${pressingAbilityKey === `${sc.characterId}-${i}-${j}` ? "session-char-card__ability--pressing" : ""}`}
                            onClick={() => toggleAbilityMark(sc.characterId, i, j)}
                            onPointerDown={(e) => { e.stopPropagation(); startAbilityLongPress(sc.characterId, i, j); }}
                            onPointerUp={(e) => { e.stopPropagation(); cancelAbilityLongPress(); }}
                            onPointerLeave={cancelAbilityLongPress}
                            title="Click to mark pros (glow) | Hold 1s for cons (violet)"
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
