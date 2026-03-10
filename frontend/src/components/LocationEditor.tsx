import React from "react";
import { v4 as uuid } from "uuid";
import {
  Location,
  LocationStatus,
  LocationBox,
  LocationBoxStatus,
  LocationBoxTag,
  LocationNPC,
} from "@rpg/shared";
import AutoExpandTextarea from "./AutoExpandTextarea";
import RoundCheckbox from "./RoundCheckbox";

const emptyTag = (): LocationBoxTag => ({ id: uuid(), label: "", note: "", checkboxes: [false, false, false, false, false, false] });
const emptyStatus = (): LocationStatus => ({ id: uuid(), label: "" });
const emptyBoxStatus = (): LocationBoxStatus => ({ id: uuid(), label: "", notes: [] });
const emptyBoxTag = (): LocationBoxTag => ({ id: uuid(), label: "", note: "", checkboxes: [false, false, false, false, false, false] });
const emptyNPC = (): LocationNPC => ({ id: uuid(), name: "", portraitUrl: "", statuses: [] });
const emptyBox = (): LocationBox => ({ id: uuid(), title: "", statuses: [], tags: [], npcs: [] });

const EMPTY_CHECKBOXES: [boolean, boolean, boolean, boolean, boolean, boolean] = [false, false, false, false, false, false];

function normalizeLocation(loc: Location): Location {
  return {
    ...loc,
    statuses: loc.statuses ?? [],
    tags: (loc.tags ?? []).map(t => ({
      ...t,
      checkboxes: (t.checkboxes ?? [...EMPTY_CHECKBOXES]) as [boolean, boolean, boolean, boolean, boolean, boolean],
    })),
    boxes: (loc.boxes ?? []).map(box => ({
      ...box,
      statuses: (box.statuses ?? []).map(s => ({ ...s, notes: s.notes ?? [] })),
      tags: (box.tags ?? []).map(t => ({
        ...t,
        checkboxes: (t.checkboxes ?? [...EMPTY_CHECKBOXES]) as [boolean, boolean, boolean, boolean, boolean, boolean],
      })),
      npcs: (box.npcs ?? []).map(n => ({ ...n, statuses: n.statuses ?? [] })),
    })),
  };
}

interface Props {
  location: Location;
  onChange: (l: Location) => void;
}

export default function LocationEditor({ location: rawLocation, onChange }: Props) {
  const location = normalizeLocation(rawLocation);
  const update = (patch: Partial<Location>) => onChange({ ...location, ...patch });

  // ─── Section 1: Statuses ──────────────────────────────────────────
  const addStatus = () => update({ statuses: [...location.statuses, emptyStatus()] });
  const removeStatus = (id: string) =>
    update({ statuses: location.statuses.filter(s => s.id !== id) });
  const patchStatus = (id: string, label: string) =>
    update({ statuses: location.statuses.map(s => s.id === id ? { ...s, label } : s) });

  // ─── Section 1: Tags ─────────────────────────────────────────────
  const addTag = () => update({ tags: [...(location.tags ?? []), emptyTag()] });
  const removeTag = (id: string) =>
    update({ tags: (location.tags ?? []).filter(t => t.id !== id) });
  const patchTag = (id: string, patch: Partial<LocationBoxTag>) =>
    update({ tags: (location.tags ?? []).map(t => t.id === id ? { ...t, ...patch } : t) });
  const toggleTagCheckbox = (id: string, i: number) => {
    const tag = (location.tags ?? []).find(t => t.id === id)!;
    const cb = [...tag.checkboxes] as [boolean, boolean, boolean, boolean, boolean, boolean];
    if (!cb[i]) { for (let j = 0; j <= i; j++) cb[j] = true; }
    else { for (let j = i; j < cb.length; j++) cb[j] = false; }
    patchTag(id, { checkboxes: cb });
  };

  // ─── Boxes ────────────────────────────────────────────────────────
  const addBox = () => update({ boxes: [...location.boxes, emptyBox()] });
  const removeBox = (id: string) =>
    update({ boxes: location.boxes.filter(b => b.id !== id) });
  const patchBox = (id: string, patch: Partial<LocationBox>) =>
    update({ boxes: location.boxes.map(b => b.id === id ? { ...b, ...patch } : b) });
  const getBox = (id: string) => location.boxes.find(b => b.id === id)!;

  // ─── Box Statuses ─────────────────────────────────────────────────
  const addBoxStatus = (boxId: string) =>
    patchBox(boxId, { statuses: [...getBox(boxId).statuses, emptyBoxStatus()] });
  const removeBoxStatus = (boxId: string, statusId: string) =>
    patchBox(boxId, { statuses: getBox(boxId).statuses.filter(s => s.id !== statusId) });
  const patchBoxStatus = (boxId: string, statusId: string, patch: Partial<LocationBoxStatus>) =>
    patchBox(boxId, {
      statuses: getBox(boxId).statuses.map(s => s.id === statusId ? { ...s, ...patch } : s),
    });

  const addBoxStatusNote = (boxId: string, statusId: string) => {
    const box = getBox(boxId);
    patchBox(boxId, {
      statuses: box.statuses.map(s =>
        s.id === statusId ? { ...s, notes: [...s.notes, ""] } : s
      ),
    });
  };
  const removeBoxStatusNote = (boxId: string, statusId: string, noteIdx: number) => {
    const box = getBox(boxId);
    patchBox(boxId, {
      statuses: box.statuses.map(s =>
        s.id === statusId ? { ...s, notes: s.notes.filter((_, i) => i !== noteIdx) } : s
      ),
    });
  };
  const patchBoxStatusNote = (boxId: string, statusId: string, noteIdx: number, val: string) => {
    const box = getBox(boxId);
    patchBox(boxId, {
      statuses: box.statuses.map(s => {
        if (s.id !== statusId) return s;
        const notes = [...s.notes];
        notes[noteIdx] = val;
        return { ...s, notes };
      }),
    });
  };

  // ─── Box Tags ─────────────────────────────────────────────────────
  const addBoxTag = (boxId: string) =>
    patchBox(boxId, { tags: [...getBox(boxId).tags, emptyBoxTag()] });
  const removeBoxTag = (boxId: string, tagId: string) =>
    patchBox(boxId, { tags: getBox(boxId).tags.filter(t => t.id !== tagId) });
  const patchBoxTag = (boxId: string, tagId: string, patch: Partial<LocationBoxTag>) =>
    patchBox(boxId, {
      tags: getBox(boxId).tags.map(t => t.id === tagId ? { ...t, ...patch } : t),
    });

  const toggleBoxTagCheckbox = (boxId: string, tagId: string, i: number) => {
    const tag = getBox(boxId).tags.find(t => t.id === tagId)!;
    const cb = [...tag.checkboxes] as [boolean, boolean, boolean, boolean, boolean, boolean];
    if (!cb[i]) {
      for (let j = 0; j <= i; j++) cb[j] = true;
    } else {
      for (let j = i; j < cb.length; j++) cb[j] = false;
    }
    patchBoxTag(boxId, tagId, { checkboxes: cb });
  };

  // ─── Box NPCs ─────────────────────────────────────────────────────
  const addBoxNPC = (boxId: string) =>
    patchBox(boxId, { npcs: [...getBox(boxId).npcs, emptyNPC()] });
  const removeBoxNPC = (boxId: string, npcId: string) =>
    patchBox(boxId, { npcs: getBox(boxId).npcs.filter(n => n.id !== npcId) });
  const patchBoxNPC = (boxId: string, npcId: string, patch: Partial<LocationNPC>) =>
    patchBox(boxId, {
      npcs: getBox(boxId).npcs.map(n => n.id === npcId ? { ...n, ...patch } : n),
    });

  const addNPCStatus = (boxId: string, npcId: string) => {
    const npc = getBox(boxId).npcs.find(n => n.id === npcId)!;
    patchBoxNPC(boxId, npcId, { statuses: [...npc.statuses, ""] });
  };
  const removeNPCStatus = (boxId: string, npcId: string, idx: number) => {
    const npc = getBox(boxId).npcs.find(n => n.id === npcId)!;
    patchBoxNPC(boxId, npcId, { statuses: npc.statuses.filter((_, i) => i !== idx) });
  };
  const patchNPCStatus = (boxId: string, npcId: string, idx: number, val: string) => {
    const npc = getBox(boxId).npcs.find(n => n.id === npcId)!;
    const statuses = [...npc.statuses];
    statuses[idx] = val;
    patchBoxNPC(boxId, npcId, { statuses });
  };

  return (
    <div className="loc-editor">
      <div className="loc-editor__grid">

        {/* ═══ Section 1 — Identity ═══ */}
        <div className="section loc-editor__s1">
          <h3 className="section__title">Location</h3>

          {/* Name */}
          <div className="sheet-box">
            <label className="sheet-box__label">Name</label>
            <input
              className="sheet-box__input"
              value={location.name}
              onChange={e => update({ name: e.target.value })}
              placeholder="Location name"
            />
          </div>

          {/* Portrait 3:2 landscape */}
          <div className="sheet-box loc-editor__portrait-box">
            {location.portraitUrl ? (
              <img
                className="loc-portrait-img"
                src={location.portraitUrl}
                alt={location.name}
              />
            ) : (
              <div className="loc-portrait-placeholder">No portrait</div>
            )}
            <input
              className="sheet-box__input"
              value={location.portraitUrl}
              onChange={e => update({ portraitUrl: e.target.value })}
              placeholder="Portrait URL"
            />
          </div>

          {/* Description with parchment icon */}
          <div className="sheet-box">
            <label className="sheet-box__label">
              <span className="loc-editor__parchment-icon">📜</span> Description
            </label>
            <AutoExpandTextarea
              value={location.description}
              onValueChange={val => update({ description: val })}
              placeholder="Describe this location…"
            />
          </div>

          {/* Statuses — horizontal */}
          <div className="sheet-box">
            <label className="sheet-box__label">Statuses</label>
            <div className="threat-status-list">
              {location.statuses.map(status => (
                <div key={status.id} className="threat-status-row">
                  <input
                    className="status-box__tag threat-status-row__input"
                    value={status.label}
                    placeholder="Status"
                    onChange={e => patchStatus(status.id, e.target.value)}
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

          {/* Tags */}
          <div className="sheet-box">
            <label className="sheet-box__label">Tags</label>
            <div className="status-list">
              {(location.tags ?? []).map(tag => (
                <div key={tag.id} className="status-box">
                  <div className="status-box__top">
                    <input
                      className="status-box__tag"
                      value={tag.label}
                      placeholder="Tag"
                      onChange={e => patchTag(tag.id, { label: e.target.value })}
                    />
                    <input
                      className="status-box__note"
                      value={tag.note}
                      placeholder="Note (optional)"
                      onChange={e => patchTag(tag.id, { note: e.target.value })}
                    />
                    <button type="button" className="status-box__remove" onClick={() => removeTag(tag.id)}>×</button>
                  </div>
                  <div className="status-box__checkboxes">
                    {tag.checkboxes.map((v, i) => (
                      <RoundCheckbox key={i} checked={v} onChange={() => toggleTagCheckbox(tag.id, i)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button type="button" className="add-slot-btn" onClick={addTag}>
              + Add Tag
            </button>
          </div>
        </div>

        {/* ═══ Section 2 — Boxes ═══ */}
        <div className="section loc-editor__s2">
          <h3 className="section__title">Areas</h3>

          <div className="loc-boxes">
            {location.boxes.map(box => (
              <div key={box.id} className="loc-box">
                <div className="loc-box__header">
                  <input
                    className="loc-box__title-input"
                    value={box.title}
                    placeholder="Place / Clan / Guild…"
                    onChange={e => patchBox(box.id, { title: e.target.value })}
                  />
                  <button
                    type="button"
                    className="status-box__remove"
                    onClick={() => removeBox(box.id)}
                  >
                    ×
                  </button>
                </div>

                {/* Box Statuses */}
                {box.statuses.length > 0 && (
                  <div className="loc-box__section">
                    <span className="theme-card__label">Statuses</span>
                    {box.statuses.map(status => (
                      <div key={status.id} className="loc-box-status">
                        <div className="loc-box-status__row">
                          <input
                            className="status-box__tag loc-box-status__input"
                            value={status.label}
                            placeholder="Status"
                            onChange={e => patchBoxStatus(box.id, status.id, { label: e.target.value })}
                          />
                          <button
                            type="button"
                            className="loc-box-status__note-btn"
                            title="Add note"
                            onClick={() => addBoxStatusNote(box.id, status.id)}
                          >
                            + note
                          </button>
                          <button
                            type="button"
                            className="status-box__remove"
                            onClick={() => removeBoxStatus(box.id, status.id)}
                          >
                            ×
                          </button>
                        </div>
                        {status.notes.map((note, idx) => (
                          <div key={idx} className="loc-box-status__note-row">
                            <input
                              className="status-box__note loc-box-status__note-input"
                              value={note}
                              placeholder="Note…"
                              onChange={e => patchBoxStatusNote(box.id, status.id, idx, e.target.value)}
                            />
                            <button
                              type="button"
                              className="status-box__remove"
                              onClick={() => removeBoxStatusNote(box.id, status.id, idx)}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {/* Box Tags */}
                {box.tags.length > 0 && (
                  <div className="loc-box__section">
                    <span className="theme-card__label">Tags</span>
                    {box.tags.map(tag => (
                      <div key={tag.id} className="status-box">
                        <div className="status-box__top">
                          <input
                            className="status-box__tag"
                            value={tag.label}
                            placeholder="Tag"
                            onChange={e => patchBoxTag(box.id, tag.id, { label: e.target.value })}
                          />
                          <input
                            className="status-box__note"
                            value={tag.note}
                            placeholder="Note (optional)"
                            onChange={e => patchBoxTag(box.id, tag.id, { note: e.target.value })}
                          />
                          <button
                            type="button"
                            className="status-box__remove"
                            onClick={() => removeBoxTag(box.id, tag.id)}
                          >
                            ×
                          </button>
                        </div>
                        <div className="status-box__checkboxes">
                          {tag.checkboxes.map((v, i) => (
                            <RoundCheckbox
                              key={i}
                              checked={v}
                              onChange={() => toggleBoxTagCheckbox(box.id, tag.id, i)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Box NPCs */}
                {box.npcs.length > 0 && (
                  <div className="loc-box__section">
                    <span className="theme-card__label">NPCs</span>
                    <div className="loc-npc-list">
                      {box.npcs.map(npc => (
                        <div key={npc.id} className="loc-npc">
                          <div className="loc-npc__portrait-wrap">
                            {npc.portraitUrl
                              ? <img className="loc-npc__portrait-img" src={npc.portraitUrl} alt={npc.name} />
                              : <div className="loc-npc__portrait-placeholder">👤</div>
                            }
                            <input
                              className="sheet-box__input loc-npc__portrait-input"
                              value={npc.portraitUrl}
                              placeholder="Portrait URL"
                              onChange={e => patchBoxNPC(box.id, npc.id, { portraitUrl: e.target.value })}
                            />
                          </div>
                          <div className="loc-npc__info">
                            <div className="loc-npc__name-row">
                              <input
                                className="sheet-box__input loc-npc__name-input"
                                value={npc.name}
                                placeholder="NPC name"
                                onChange={e => patchBoxNPC(box.id, npc.id, { name: e.target.value })}
                              />
                              <button
                                type="button"
                                className="status-box__remove"
                                onClick={() => removeBoxNPC(box.id, npc.id)}
                              >
                                ×
                              </button>
                            </div>
                            <div className="threat-status-list">
                              {npc.statuses.map((s, idx) => (
                                <div key={idx} className="threat-status-row">
                                  <input
                                    className="status-box__tag threat-status-row__input"
                                    value={s}
                                    placeholder="Status"
                                    onChange={e => patchNPCStatus(box.id, npc.id, idx, e.target.value)}
                                  />
                                  <button
                                    type="button"
                                    className="status-box__remove"
                                    onClick={() => removeNPCStatus(box.id, npc.id, idx)}
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                            <button
                              type="button"
                              className="add-slot-btn"
                              style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem" }}
                              onClick={() => addNPCStatus(box.id, npc.id)}
                            >
                              + Status
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add-item buttons */}
                <div className="loc-box__add-row">
                  <button type="button" className="add-slot-btn loc-box__add-btn" onClick={() => addBoxStatus(box.id)}>
                    + Status
                  </button>
                  <button type="button" className="add-slot-btn loc-box__add-btn" onClick={() => addBoxTag(box.id)}>
                    + Tag
                  </button>
                  <button type="button" className="add-slot-btn loc-box__add-btn" onClick={() => addBoxNPC(box.id)}>
                    + NPC
                  </button>
                </div>
              </div>
            ))}

            <button type="button" className="add-slot-btn" onClick={addBox}>
              + Add Area
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
