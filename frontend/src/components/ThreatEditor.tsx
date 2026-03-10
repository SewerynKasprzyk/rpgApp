import React from "react";
import { v4 as uuid } from "uuid";
import { ThreatLimit, ThreatTag, ThreatStatus, ThreatMove, Threat } from "@rpg/shared";
import RoundCheckbox from "./RoundCheckbox";
import AutoExpandTextarea from "./AutoExpandTextarea";

const emptyTag = (): ThreatTag => ({
  id: uuid(),
  tag: "",
  note: "",
  checkboxes: [false, false, false, false, false, false],
});
const emptyStatus = (): ThreatStatus => ({ id: uuid(), label: "" });
const emptyMove = (): ThreatMove => ({ id: uuid(), name: "", tags: [], statuses: [] });
const emptyLimit = (): ThreatLimit => ({ id: uuid(), label: "", maxBoxes: 0, checked: [] });

interface Props {
  threat: Threat;
  onChange: (t: Threat) => void;
}

export default function ThreatEditor({ threat, onChange }: Props) {
  const update = (patch: Partial<Threat>) => onChange({ ...threat, ...patch });

  // ─── Limits ───────────────────────────────────────────────────────
  const addLimit = () => update({ limits: [...threat.limits, emptyLimit()] });
  const removeLimit = (id: string) =>
    update({ limits: threat.limits.filter((l) => l.id !== id) });
  const patchLimit = (id: string, patch: Partial<ThreatLimit>) =>
    update({ limits: threat.limits.map((l) => (l.id === id ? { ...l, ...patch } : l)) });

  const setLimitMax = (id: string, n: number) => {
    const limit = threat.limits.find((l) => l.id === id)!;
    let newChecked: boolean[];
    if (n === 0) {
      newChecked = [];
    } else if (n <= limit.checked.length) {
      newChecked = limit.checked.slice(0, n);
    } else {
      newChecked = [...limit.checked, ...Array(n - limit.checked.length).fill(false)];
    }
    patchLimit(id, { maxBoxes: n, checked: newChecked });
  };

  const toggleLimitCheck = (id: string, i: number) => {
    const limit = threat.limits.find((l) => l.id === id)!;
    const cb = [...limit.checked];
    if (!cb[i]) {
      for (let j = 0; j <= i; j++) cb[j] = true;
    } else {
      for (let j = i; j < cb.length; j++) cb[j] = false;
    }
    patchLimit(id, { checked: cb });
  };

  // ─── Tags ─────────────────────────────────────────────────────────
  const addTag = () => update({ tags: [...threat.tags, emptyTag()] });
  const removeTag = (id: string) =>
    update({ tags: threat.tags.filter((t) => t.id !== id) });
  const patchTag = (id: string, patch: Partial<ThreatTag>) =>
    update({ tags: threat.tags.map((t) => (t.id === id ? { ...t, ...patch } : t)) });

  const toggleTagCheckbox = (id: string, i: number) => {
    const tag = threat.tags.find((t) => t.id === id)!;
    const cb = [...tag.checkboxes] as [boolean, boolean, boolean, boolean, boolean, boolean];
    if (!cb[i]) {
      for (let j = 0; j <= i; j++) cb[j] = true;
    } else {
      for (let j = i; j < cb.length; j++) cb[j] = false;
    }
    patchTag(id, { checkboxes: cb });
  };

  // ─── Statuses ─────────────────────────────────────────────────────
  const addStatus = () => update({ statuses: [...threat.statuses, emptyStatus()] });
  const removeStatus = (id: string) =>
    update({ statuses: threat.statuses.filter((s) => s.id !== id) });
  const patchStatus = (id: string, label: string) =>
    update({ statuses: threat.statuses.map((s) => (s.id === id ? { ...s, label } : s)) });

  // ─── Moves ────────────────────────────────────────────────────────
  const addMove = () => update({ moves: [...threat.moves, emptyMove()] });
  const removeMove = (id: string) =>
    update({ moves: threat.moves.filter((m) => m.id !== id) });
  const patchMove = (id: string, patch: Partial<ThreatMove>) =>
    update({ moves: threat.moves.map((m) => (m.id === id ? { ...m, ...patch } : m)) });

  const getMove = (moveId: string) => threat.moves.find((m) => m.id === moveId)!;

  const addMoveTag = (moveId: string) =>
    patchMove(moveId, { tags: [...getMove(moveId).tags, emptyTag()] });
  const removeMoveTag = (moveId: string, tagId: string) =>
    patchMove(moveId, { tags: getMove(moveId).tags.filter((t) => t.id !== tagId) });
  const patchMoveTag = (moveId: string, tagId: string, patch: Partial<ThreatTag>) =>
    patchMove(moveId, {
      tags: getMove(moveId).tags.map((t) => (t.id === tagId ? { ...t, ...patch } : t)),
    });

  const toggleMoveTagCheckbox = (moveId: string, tagId: string, i: number) => {
    const tag = getMove(moveId).tags.find((t) => t.id === tagId)!;
    const cb = [...tag.checkboxes] as [boolean, boolean, boolean, boolean, boolean, boolean];
    if (!cb[i]) {
      for (let j = 0; j <= i; j++) cb[j] = true;
    } else {
      for (let j = i; j < cb.length; j++) cb[j] = false;
    }
    patchMoveTag(moveId, tagId, { checkboxes: cb });
  };

  const addMoveStatus = (moveId: string) =>
    patchMove(moveId, { statuses: [...getMove(moveId).statuses, emptyStatus()] });
  const removeMoveStatus = (moveId: string, statusId: string) =>
    patchMove(moveId, {
      statuses: getMove(moveId).statuses.filter((s) => s.id !== statusId),
    });
  const patchMoveStatus = (moveId: string, statusId: string, label: string) =>
    patchMove(moveId, {
      statuses: getMove(moveId).statuses.map((s) =>
        s.id === statusId ? { ...s, label } : s
      ),
    });

  return (
    <div className="threat-editor">
      <div className="threat-editor__grid">

        {/* ═══════════════ Section 1 — Identity ═══════════════ */}
        <div className="section threat-editor__s1">
          <h3 className="section__title">Identity</h3>

          <div className="sheet-box">
            <label className="sheet-box__label">Name</label>
            <input
              className="sheet-box__input"
              value={threat.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="Threat name"
            />
          </div>

          <div className="sheet-box">
            <label className="sheet-box__label">Portrait</label>
            {threat.portraitUrl ? (
              <img
                className="portrait-img"
                src={threat.portraitUrl}
                alt={threat.name}
              />
            ) : (
              <div className="portrait-placeholder">No portrait</div>
            )}
            <input
              className="sheet-box__input"
              value={threat.portraitUrl}
              onChange={(e) => update({ portraitUrl: e.target.value })}
              placeholder="Portrait URL"
            />
          </div>

          <div className="sheet-box">
            <label className="sheet-box__label">Description</label>
            <AutoExpandTextarea
              value={threat.description ?? ""}
              onValueChange={val => update({ description: val })}
              placeholder="Describe this threat…"
            />
          </div>

          <div className="sheet-box">
            <label className="sheet-box__label">Limits</label>
            <div className="threat-limits">
              {threat.limits.map((limit) => (
                <div key={limit.id} className="threat-limit-row">
                  <div className="threat-limit-row__header">
                    <input
                      className="threat-limit-row__label-input"
                      value={limit.label}
                      onChange={(e) => patchLimit(limit.id, { label: e.target.value })}
                      placeholder="Limit name"
                    />
                    <button
                      type="button"
                      className="status-box__remove"
                      onClick={() => removeLimit(limit.id)}
                    >
                      ×
                    </button>
                  </div>
                  <div className="threat-limit-selector">
                    {[...Array(10)].map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`threat-limit-selector__dot${
                          i < limit.maxBoxes ? " threat-limit-selector__dot--active" : ""
                        }`}
                        onClick={() =>
                          setLimitMax(limit.id, i + 1 === limit.maxBoxes ? 0 : i + 1)
                        }
                        title={`Set ${i + 1} boxes`}
                      />
                    ))}
                  </div>
                  {limit.maxBoxes > 0 && (
                    <div className="threat-limit-checks">
                      {limit.checked.map((v, i) => (
                        <RoundCheckbox
                          key={i}
                          checked={v}
                          onChange={() => toggleLimitCheck(limit.id, i)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <button type="button" className="add-slot-btn" onClick={addLimit}>
                + Add Limit
              </button>
            </div>
          </div>
        </div>

        {/* ═══════════════ Section 2 — Tags & Statuses ═══════════════ */}
        <div className="section threat-editor__s2">
          <h3 className="section__title">Tags & Statuses</h3>

          <div className="sheet-box">
            <label className="sheet-box__label">Tags</label>
            <div className="status-list">
              {threat.tags.map((tag) => (
                <div key={tag.id} className="status-box">
                  <div className="status-box__top">
                    <input
                      className="status-box__tag"
                      value={tag.tag}
                      placeholder="Tag"
                      onChange={(e) => patchTag(tag.id, { tag: e.target.value })}
                    />
                    <input
                      className="status-box__note"
                      value={tag.note}
                      placeholder="Note"
                      onChange={(e) => patchTag(tag.id, { note: e.target.value })}
                    />
                    <button
                      type="button"
                      className="status-box__remove"
                      onClick={() => removeTag(tag.id)}
                    >
                      ×
                    </button>
                  </div>
                  <div className="status-box__checkboxes">
                    {tag.checkboxes.map((v, i) => (
                      <RoundCheckbox
                        key={i}
                        checked={v}
                        onChange={() => toggleTagCheckbox(tag.id, i)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button type="button" className="add-slot-btn" onClick={addTag}>
              + Add Tag
            </button>
          </div>

          <div className="sheet-box">
            <label className="sheet-box__label">Statuses</label>
            <div className="threat-status-list">
              {threat.statuses.map((status) => (
                <div key={status.id} className="threat-status-row">
                  <input
                    className="status-box__tag threat-status-row__input"
                    value={status.label}
                    placeholder="Status"
                    onChange={(e) => patchStatus(status.id, e.target.value)}
                  />
                  <button
                    type="button"
                    className="status-box__remove"
                    onClick={() => removeStatus(status.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button type="button" className="add-slot-btn" onClick={addStatus}>
              + Add Status
            </button>
          </div>
        </div>

        {/* ═══════════════ Section 3 — Moves ═══════════════ */}
        <div className="section threat-editor__s3">
          <h3 className="section__title">Moves</h3>

          <div className="threat-moves">
            {threat.moves.map((move) => (
              <div key={move.id} className="threat-move-card">
                <div className="threat-move-card__header">
                  <input
                    className="sheet-box__input threat-move-card__name"
                    value={move.name}
                    placeholder="Move name"
                    onChange={(e) => patchMove(move.id, { name: e.target.value })}
                  />
                  <button
                    type="button"
                    className="status-box__remove"
                    onClick={() => removeMove(move.id)}
                  >
                    ×
                  </button>
                </div>

                <div className="threat-move-card__section">
                  <span className="theme-card__label">Tags</span>
                  <div className="status-list">
                    {move.tags.map((tag) => (
                      <div key={tag.id} className="status-box">
                        <div className="status-box__top">
                          <input
                            className="status-box__tag"
                            value={tag.tag}
                            placeholder="Tag"
                            onChange={(e) =>
                              patchMoveTag(move.id, tag.id, { tag: e.target.value })
                            }
                          />
                          <input
                            className="status-box__note"
                            value={tag.note}
                            placeholder="Note"
                            onChange={(e) =>
                              patchMoveTag(move.id, tag.id, { note: e.target.value })
                            }
                          />
                          <button
                            type="button"
                            className="status-box__remove"
                            onClick={() => removeMoveTag(move.id, tag.id)}
                          >
                            ×
                          </button>
                        </div>
                        <div className="status-box__checkboxes">
                          {tag.checkboxes.map((v, i) => (
                            <RoundCheckbox
                              key={i}
                              checked={v}
                              onChange={() =>
                                toggleMoveTagCheckbox(move.id, tag.id, i)
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
                    onClick={() => addMoveTag(move.id)}
                  >
                    + Add Tag
                  </button>
                </div>

                <div className="threat-move-card__section">
                  <span className="theme-card__label">Statuses</span>
                  <div className="threat-status-list">
                    {move.statuses.map((status) => (
                      <div key={status.id} className="threat-status-row">
                        <input
                          className="status-box__tag threat-status-row__input"
                          value={status.label}
                          placeholder="Status"
                          onChange={(e) =>
                            patchMoveStatus(move.id, status.id, e.target.value)
                          }
                        />
                        <button
                          type="button"
                          className="status-box__remove"
                          onClick={() => removeMoveStatus(move.id, status.id)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="add-slot-btn"
                    onClick={() => addMoveStatus(move.id)}
                  >
                    + Add Status
                  </button>
                </div>
              </div>
            ))}
            <button type="button" className="add-slot-btn" onClick={addMove}>
              + Add Move
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
