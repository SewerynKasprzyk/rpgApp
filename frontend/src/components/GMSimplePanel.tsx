import { useState } from "react";
import { v4 as uuid } from "uuid";
import { useThreatGroups } from "../hooks/useThreatGroups";
import { useLocationGroups } from "../hooks/useLocationGroups";
import { Threat, LocationBox, GmElement } from "@rpg/shared";
import { useSessionContext } from "../context/SessionContext";
import DraggableSourceItem from "./DraggableSourceItem";

type SimpleTab = "threats" | "locations" | "elements";
type ElementFormType = "element" | "npc";
type ElementKind = "status" | "tag" | "npc";

// Derive kind from filled state:
// no note + no checkboxes checked  →  Status
// note OR checkboxes (or both)     →  Tag
function deriveKind(note: string, checkedCount: number): "status" | "tag" {
  return note.trim() || checkedCount > 0 ? "tag" : "status";
}

const QUICK_THREAT_GROUP = "Quick Threats";
const QUICK_LOCATION_GROUP = "Quick Locations";

function emptyThreat(name: string, portraitUrl: string): Threat {
  return { id: uuid(), name, portraitUrl, description: "", limits: [], tags: [], statuses: [], moves: [] };
}

function emptyBox(title: string): LocationBox {
  return { id: uuid(), title, statuses: [], tags: [], npcs: [] };
}

/* ── Simple Threats ── */
function SimpleThreats() {
  const { groups, create, update } = useThreatGroups();
  const [name, setName] = useState("");
  const [portrait, setPortrait] = useState("");
  const [saving, setSaving] = useState(false);

  const quickGroup = groups.find((g) => g.name === QUICK_THREAT_GROUP);
  const threats = quickGroup?.threats ?? [];

  const handleAdd = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const newThreat = emptyThreat(name.trim(), portrait.trim());
      if (quickGroup) {
        await update(quickGroup.id, { threats: [...quickGroup.threats, newThreat] });
      } else {
        await create({ name: QUICK_THREAT_GROUP, threats: [newThreat] });
      }
      setName(""); setPortrait("");
    } finally { setSaving(false); }
  };

  const handleRemove = async (threatId: string) => {
    if (!quickGroup) return;
    await update(quickGroup.id, { threats: quickGroup.threats.filter((t) => t.id !== threatId) });
  };

  return (
    <div className="simple-section">
      <div className="simple-section__form">
        <input className="simple-input" placeholder="Threat name…" value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
        <input className="simple-input" placeholder="Portrait URL…" value={portrait}
          onChange={(e) => setPortrait(e.target.value)} />
        <button className="simple-add-btn" onClick={handleAdd} disabled={saving || !name.trim()}>
          + Add Threat
        </button>
      </div>
      <ul className="simple-list">
        {threats.map((t) => (
          <DraggableSourceItem key={t.id} id={`simple-threat-${t.id}`} sourceType="simpleThreat" sourceId={t.id} label={t.name} payload={t as unknown as Record<string, unknown>}>
          <li className="simple-list__item">
            {t.portraitUrl
              ? <img className="simple-list__portrait simple-list__portrait--portrait" src={t.portraitUrl} alt={t.name} />
              : <div className="simple-list__portrait-placeholder">⚔</div>}
            <span className="simple-list__label">{t.name}</span>
            <button className="simple-list__remove" onClick={() => handleRemove(t.id)}>×</button>
          </li>
          </DraggableSourceItem>
        ))}
        {threats.length === 0 && <li className="simple-list__empty">No quick threats yet</li>}
      </ul>
    </div>
  );
}

/* ── Simple Locations ── */
function SimpleLocations() {
  const { groups, create, update } = useLocationGroups();
  const [name, setName] = useState("");
  const [portrait, setPortrait] = useState("");
  const [boxInput, setBoxInput] = useState("");
  const [boxes, setBoxes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const quickGroup = groups.find((g) => g.name === QUICK_LOCATION_GROUP);
  const locations = quickGroup?.locations ?? [];

  const addBox = () => {
    if (!boxInput.trim()) return;
    setBoxes((prev) => [...prev, boxInput.trim()]);
    setBoxInput("");
  };

  const handleAdd = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const newLoc = {
        id: uuid(),
        name: name.trim(),
        portraitUrl: portrait.trim(),
        description: "",
        statuses: [],
        boxes: boxes.map(emptyBox),
      };
      if (quickGroup) {
        await update(quickGroup.id, { locations: [...quickGroup.locations, newLoc] });
      } else {
        await create({ name: QUICK_LOCATION_GROUP, locations: [newLoc] });
      }
      setName(""); setPortrait(""); setBoxes([]);
    } finally { setSaving(false); }
  };

  const handleRemove = async (locId: string) => {
    if (!quickGroup) return;
    await update(quickGroup.id, { locations: quickGroup.locations.filter((l) => l.id !== locId) });
  };

  return (
    <div className="simple-section">
      <div className="simple-section__form">
        <input className="simple-input" placeholder="Location name…" value={name}
          onChange={(e) => setName(e.target.value)} />
        <input className="simple-input" placeholder="Portrait URL (landscape)…" value={portrait}
          onChange={(e) => setPortrait(e.target.value)} />

        {/* Box builder */}
        <div className="simple-box-row">
          <input className="simple-input simple-input--grow" placeholder="Area box name…"
            value={boxInput} onChange={(e) => setBoxInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addBox(); } }} />
          <button className="simple-add-btn simple-add-btn--small" onClick={addBox}>+</button>
        </div>
        {boxes.length > 0 && (
          <div className="simple-box-chips">
            {boxes.map((b, i) => (
              <span key={i} className="simple-chip">
                {b}
                <button className="simple-chip__remove" onClick={() => setBoxes(boxes.filter((_, j) => j !== i))}>×</button>
              </span>
            ))}
          </div>
        )}

        <button className="simple-add-btn" onClick={handleAdd} disabled={saving || !name.trim()}>
          + Add Location
        </button>
      </div>
      <ul className="simple-list">
        {locations.map((l) => (
          <DraggableSourceItem key={l.id} id={`simple-loc-${l.id}`} sourceType="simpleLocation" sourceId={l.id} label={l.name} payload={l as unknown as Record<string, unknown>}>
          <li className="simple-list__item">
            {l.portraitUrl
              ? <img className="simple-list__portrait simple-list__portrait--landscape" src={l.portraitUrl} alt={l.name} />
              : <div className="simple-list__portrait-placeholder simple-list__portrait-placeholder--landscape">🏛</div>}
            <div className="simple-list__info">
              <span className="simple-list__label">{l.name}</span>
              {l.boxes.length > 0 && <span className="simple-list__sub">{l.boxes.map((b) => b.title).join(", ")}</span>}
            </div>
            <button className="simple-list__remove" onClick={() => handleRemove(l.id)}>×</button>
          </li>
          </DraggableSourceItem>
        ))}
        {locations.length === 0 && <li className="simple-list__empty">No quick locations yet</li>}
      </ul>
    </div>
  );
}

/* ── Simple Elements ── */
function SimpleElements() {
  const { session, onChange } = useSessionContext();
  const [formType, setFormType] = useState<ElementFormType>("element");
  const [label, setLabel] = useState("");
  const [note, setNote] = useState("");
  const [checkboxes, setCheckboxes] = useState<boolean[]>(Array(6).fill(false));
  const [portraitUrl, setPortraitUrl] = useState("");

  const elements: GmElement[] = session?.gmElements ?? [];

  const checkedCount = checkboxes.filter(Boolean).length;
  const derivedKind: ElementKind =
    formType === "npc" ? "npc" : deriveKind(note, checkedCount);

  const kindLabel: Record<ElementKind, string> = {
    status: "Status",
    tag: note.trim() ? "Tag with Note" : "Tag",
    npc: "NPC",
  };

  const toggleCb = (i: number) =>
    setCheckboxes((prev) => {
      const current = prev.filter(Boolean).length;
      const newCount = current === i + 1 ? i : i + 1;
      return Array(6).fill(null).map((_, j) => j < newCount);
    });

  const reset = () => {
    setLabel(""); setNote(""); setCheckboxes(Array(6).fill(false)); setPortraitUrl("");
  };

  const handleAdd = () => {
    if (!label.trim()) return;
    const el: GmElement = {
      id: uuid(),
      kind: derivedKind,
      label: label.trim(),
      note: note.trim() || undefined,
      checkboxCount: checkedCount > 0 ? checkedCount : undefined,
      portraitUrl: formType === "npc" ? portraitUrl.trim() || undefined : undefined,
    };
    onChange({ gmElements: [el, ...elements] });
    reset();
  };

  const removeEl = (id: string) =>
    onChange({ gmElements: elements.filter((e) => e.id !== id) });

  return (
    <div className="simple-section">
      {/* Element / NPC toggle */}
      <div className="simple-type-row">
        {(["element", "npc"] as ElementFormType[]).map((ft) => (
          <button key={ft}
            className={`simple-type-btn ${formType === ft ? "simple-type-btn--active" : ""}`}
            onClick={() => { setFormType(ft); reset(); }}>
            {ft === "element" ? "Element" : "NPC"}
          </button>
        ))}
      </div>

      <div className="simple-section__form">
        <input
          className="simple-input"
          placeholder={formType === "npc" ? "NPC name…" : "Label…"}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />

        {formType === "npc" && (
          <input className="simple-input" placeholder="Portrait URL…" value={portraitUrl}
            onChange={(e) => setPortraitUrl(e.target.value)} />
        )}

        {formType === "element" && (
          <>
            <textarea
              className="simple-textarea"
              placeholder="Note… (leave empty for Status)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />

            {/* 6 clickable checkboxes */}
            <div className="simple-cb-row">
              {checkboxes.map((checked, i) => (
                <button
                  key={i}
                  type="button"
                  className={`simple-cb ${checked ? "simple-cb--checked" : ""}`}
                  onClick={() => toggleCb(i)}
                  title={`Checkbox ${i + 1}`}
                />
              ))}
              <span className="simple-kind-badge">→ {kindLabel[derivedKind]}</span>
            </div>
          </>
        )}

        <button className="simple-add-btn" onClick={handleAdd} disabled={!label.trim()}>
          + Add {kindLabel[derivedKind]}
        </button>
      </div>

      <ul className="simple-list">
        {elements.filter((el) => formType === "npc" ? el.kind === "npc" : el.kind !== "npc").map((el) => {
          const kl: Record<ElementKind, string> = { status: "Status", tag: el.note ? "Tag with Note" : "Tag", npc: "NPC" };
          return (
            <DraggableSourceItem key={el.id} id={`simple-el-${el.id}`} sourceType="simpleElement" sourceId={el.id} label={el.label} payload={el as unknown as Record<string, unknown>}>
            <li className="simple-list__item">
              {el.portraitUrl
                ? <img className="simple-list__portrait simple-list__portrait--portrait" src={el.portraitUrl} alt={el.label} />
                : el.kind === "npc"
                  ? <div className="simple-list__portrait-placeholder">👤</div>
                  : null}
              <div className="simple-list__info">
                <span className="simple-list__kind-tag">{kl[el.kind]}</span>
                <span className="simple-list__label">{el.label}</span>
                {el.note && <span className="simple-list__sub">{el.note}</span>}
                {el.checkboxCount != null && el.checkboxCount > 0 && (
                  <div className="simple-list__checkboxes">
                    {Array(6).fill(null).map((_, i) => (
                      <span key={i} className={`simple-list__cb ${i < el.checkboxCount! ? "simple-list__cb--checked" : ""}`} />
                    ))}
                  </div>
                )}
              </div>
              <button className="simple-list__remove" onClick={() => removeEl(el.id)}>×</button>
            </li>
            </DraggableSourceItem>
          );
        })}
        {elements.filter((el) => formType === "npc" ? el.kind === "npc" : el.kind !== "npc").length === 0 && (
          <li className="simple-list__empty">No {formType === "npc" ? "NPCs" : "elements"} yet</li>
        )}
      </ul>
    </div>
  );
}

/* ── Main export ── */
export default function GMSimplePanel() {
  const [tab, setTab] = useState<SimpleTab>("threats");

  return (
    <div className="gm-simple">
      <nav className="gm-panel__tabs">
        {(["threats", "locations", "elements"] as SimpleTab[]).map((t) => (
          <button key={t}
            className={`gm-panel__tab ${tab === t ? "gm-panel__tab--active" : ""}`}
            onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </nav>
      <div className="gm-panel__content">
        {tab === "threats"   && <SimpleThreats />}
        {tab === "locations" && <SimpleLocations />}
        {tab === "elements"  && <SimpleElements />}
      </div>
    </div>
  );
}
