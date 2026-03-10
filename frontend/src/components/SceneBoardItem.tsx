import React, { useState, useRef, useCallback } from "react";
import { SceneItem } from "@rpg/shared";
import { useDroppable } from "@dnd-kit/core";
import RoundCheckbox from "./RoundCheckbox";

interface Props {
  item: SceneItem;
  sceneId: string;
  onUpdateSnapshot: (instanceId: string, snapshot: Record<string, unknown>) => void;
}

/* ────────────────── snapshot types ────────────────── */
interface StatusSnap { id: string; label: string; isGlowing?: boolean; isCons?: boolean; }
interface TagSnap    { id: string; tag: string; note: string; checkboxes: boolean[]; isGlowing?: boolean; isCons?: boolean; }
interface LimitSnap  { id: string; label: string; maxBoxes: number; checked: boolean[]; }
interface MoveSnap   { id: string; name: string; tags: TagSnap[]; statuses: StatusSnap[]; }

interface ThreatSnap {
  name?: string; portraitUrl?: string; description?: string;
  limits?: LimitSnap[]; tags?: TagSnap[];
  statuses?: StatusSnap[]; moves?: MoveSnap[];
}

interface BoxStatusSnap { id: string; label: string; notes: string[]; isGlowing?: boolean; isCons?: boolean; }
interface BoxTagSnap    { id: string; label: string; note: string; checkboxes: boolean[]; isGlowing?: boolean; isCons?: boolean; }
interface NpcSnap       { id: string; name: string; portraitUrl: string; statuses: any[]; tags?: Array<{id: string; label: string; note: string; checkboxes: boolean[]}>; }
interface BoxSnap       { id: string; title: string; statuses: BoxStatusSnap[]; tags: BoxTagSnap[]; npcs: NpcSnap[]; }

interface LocationSnap {
  name?: string; portraitUrl?: string; description?: string;
  statuses?: StatusSnap[]; tags?: TagSnap[]; npcs?: NpcSnap[]; boxes?: BoxSnap[];
}

interface CharSnap {
  name?: string; portraitUrl?: string;
  statuses?: StatusSnap[];   // simple label chips — synced to SessionCharacter.sceneStatuses
  currentStatuses?: Array<{ id: string; tag: string; note: string; checkboxes: [boolean,boolean,boolean,boolean,boolean,boolean] }>; // TagRows — synced to SessionCharacter.currentStatuses
}

interface SimpleSnap { label?: string; note?: string; checkboxCount?: number; kind?: string; portraitUrl?: string; statuses?: StatusSnap[]; tags?: TagSnap[]; }

/* ── Small drop-zone strip for character cards (generic) ── */
function NestedDropZone({ instanceId, sceneId }: { instanceId: string; sceneId: string }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `scene-item-${instanceId}`,
    data: { sceneId, instanceId },
  });
  return (
    <div ref={setNodeRef} className={`sbi__drop-zone${isOver ? " sbi__drop-zone--over" : ""}`}>
      ↓ Drop status / tag
    </div>
  );
}

/* ── Droppable left column — Statuses target for threat cards ── */
function ThreatStatusesZone({
  instanceId, sceneId, children,
}: { instanceId: string; sceneId: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `scene-statuses-${instanceId}`,
    data: { sceneId, instanceId },
  });
  return (
    <div ref={setNodeRef} className={`sbi__col sbi__col--left${isOver ? " sbi__col--drop-over" : ""}`}>
      {children}
    </div>
  );
}

/* ── Droppable right column — Tags target for threat cards ── */
function ThreatTagsZone({
  instanceId, sceneId, children,
}: { instanceId: string; sceneId: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `scene-tags-${instanceId}`,
    data: { sceneId, instanceId },
  });
  return (
    <div ref={setNodeRef} className={`sbi__col sbi__col--right${isOver ? " sbi__col--drop-over" : ""}`}>
      {children}
    </div>
  );
}

/* ── Droppable wrapper for each move in threat cards ── */
function MoveDropZone({
  instanceId, sceneId, moveId, children,
}: {
  instanceId: string; sceneId: string; moveId: string; children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `scene-move-${instanceId}-${moveId}`,
    data: { sceneId, instanceId, moveId },
  });
  return (
    <div ref={setNodeRef} className={`sbi__move${isOver ? " sbi__move--over" : ""}`}>
      {children}
    </div>
  );
}

/* ── Droppable wrapper for each area box in location cards ── */
function DroppableBoxZone({
  instanceId, sceneId, boxId, children,
}: {
  instanceId: string; sceneId: string; boxId: string; children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `scene-box-${instanceId}-${boxId}`,
    data: { sceneId, instanceId, boxId },
  });
  return (
    <div ref={setNodeRef} className={`sbi__box${isOver ? " sbi__box--over" : ""}`}>
      {children}
    </div>
  );
}

/* ── Droppable wrapper for box NPCs ── */
function DroppableNpcZone({
  instanceId, sceneId, boxId, npcId, children,
}: {
  instanceId: string; sceneId: string; boxId: string; npcId: string; children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `scene-npc-${instanceId}-${boxId}-${npcId}`,
    data: { sceneId, instanceId, boxId, npcId },
  });
  return (
    <div ref={setNodeRef} className={`sbi__npc${isOver ? " sbi__npc--over" : ""}`}>
      {children}
    </div>
  );
}

/* ── Long-press helper hook ── */
function useLongPress(onLongPress: () => void, ms = 900) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pressing, setPressing] = useState(false);
  const start = useCallback(() => {
    setPressing(true);
    timerRef.current = setTimeout(() => {
      setPressing(false);
      onLongPress();
    }, ms);
  }, [onLongPress, ms]);
  const cancel = useCallback(() => {
    setPressing(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);
  return { pressing, start, cancel };
}

/* ── Removable chip (click = glow/pros, hold = cons) ── */
function RemovableChip({
  label, chipClass = "sbi__chip--status", onRemove, isGlowing, isCons, onToggleGlow, onToggleCons, large,
}: {
  label: string; chipClass?: string; onRemove?: () => void;
  isGlowing?: boolean; isCons?: boolean;
  onToggleGlow?: () => void; onToggleCons?: () => void;
  large?: boolean;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pressing, setPressing] = useState(false);
  const didLongRef = useRef(false);

  const startPress = (e: React.PointerEvent) => {
    e.stopPropagation();
    didLongRef.current = false;
    setPressing(true);
    timerRef.current = setTimeout(() => {
      setPressing(false);
      didLongRef.current = true;
      onToggleCons?.();
    }, 700);
  };
  const cancelPress = () => {
    setPressing(false);
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  };
  const handleClick = () => {
    if (didLongRef.current) { didLongRef.current = false; return; }
    onToggleGlow?.();
  };

  const stateClass = isCons
    ? " sbi__chip--cons"
    : isGlowing
      ? " sbi__chip--glowing"
      : "";
  const pressingClass = pressing ? " sbi__chip--pressing" : "";

  return (
    <span
      className={`sbi__chip ${chipClass}${large ? " sbi__chip--lg" : ""}${stateClass}${pressingClass}`}
      onPointerDown={onToggleCons || onToggleGlow ? startPress : undefined}
      onPointerUp={onToggleCons || onToggleGlow ? cancelPress : undefined}
      onPointerLeave={onToggleCons || onToggleGlow ? cancelPress : undefined}
      onClick={handleClick}
    >
      {label}
      {onRemove && (
        <button
          className="sbi__chip-remove"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          onPointerDown={(e) => e.stopPropagation()}
          title="Remove"
        >×</button>
      )}
    </span>
  );
}

/* ── Simple Element (Status / Tag / NPC from GM panel) ── */
function SimpleElementCard({
  item, sceneId, onUpdateSnapshot,
}: { item: SceneItem; sceneId: string; onUpdateSnapshot: Props["onUpdateSnapshot"] }) {
  const snap = item.snapshot as SimpleSnap;
  const isNpc = snap.kind === "npc";

  // NPC cards are droppable (entire card = drop zone)
  const { setNodeRef: setDropRef, isOver: isDropOver } = useDroppable({
    id: `scene-item-${item.instanceId}`,
    data: { sceneId, instanceId: item.instanceId },
  });

  const removeStatus = (id: string) =>
    onUpdateSnapshot(item.instanceId, { ...snap, statuses: (snap.statuses ?? []).filter(s => s.id !== id) } as Record<string, unknown>);
  const removeTag = (id: string) =>
    onUpdateSnapshot(item.instanceId, { ...snap, tags: (snap.tags ?? []).filter(t => t.id !== id) } as Record<string, unknown>);
  const toggleNpcTagCb = (tagId: string, i: number) => {
    const tags = (snap.tags ?? []).map(t =>
      t.id !== tagId ? t : { ...t, checkboxes: toggleFill(t.checkboxes, i) }
    );
    onUpdateSnapshot(item.instanceId, { ...snap, tags } as Record<string, unknown>);
  };
  const toggleStatusGlow = (id: string) =>
    onUpdateSnapshot(item.instanceId, { ...snap, statuses: (snap.statuses ?? []).map(s =>
      s.id !== id ? s : { ...s, isGlowing: !s.isGlowing, isCons: false }
    )} as Record<string, unknown>);
  const toggleStatusCons = (id: string) =>
    onUpdateSnapshot(item.instanceId, { ...snap, statuses: (snap.statuses ?? []).map(s =>
      s.id !== id ? s : { ...s, isCons: !s.isCons, isGlowing: false }
    )} as Record<string, unknown>);
  const toggleTagGlow = (id: string) =>
    onUpdateSnapshot(item.instanceId, { ...snap, tags: (snap.tags ?? []).map(t =>
      t.id !== id ? t : { ...t, isGlowing: !t.isGlowing, isCons: false }
    )} as Record<string, unknown>);
  const toggleTagCons = (id: string) =>
    onUpdateSnapshot(item.instanceId, { ...snap, tags: (snap.tags ?? []).map(t =>
      t.id !== id ? t : { ...t, isCons: !t.isCons, isGlowing: false }
    )} as Record<string, unknown>);

  return (
    <div
      ref={isNpc ? setDropRef : undefined}
      className={`sbi sbi--simple${isNpc && isDropOver ? " sbi--drop-over" : ""}`}
    >
      {isNpc && (
        <div className="sbi__npc-identity">
          {snap.portraitUrl
            ? <img className="sbi__portrait-square" src={snap.portraitUrl} alt="" />
            : <div className="sbi__portrait-square sbi__portrait-square--empty">?</div>}
          <span className="sbi__name sbi__name--centered">{snap.label ?? "—"}</span>
        </div>
      )}
      {!isNpc && <span className="sbi__name">{snap.label ?? "—"}</span>}
      {snap.note && <p className="sbi__description">{snap.note}</p>}
      {(snap.checkboxCount ?? 0) > 0 && (
        <div className="sbi__section">
          <span className="sbi__section-label">Checkboxes</span>
          <div className="sbi__cb-row">
            {Array.from({ length: snap.checkboxCount! }).map((_, i) => (
              <span key={i} className="sbi__cb sbi__cb--filled" />
            ))}
          </div>
        </div>
      )}
      {isNpc && (snap.statuses ?? []).length > 0 && (
        <div className="sbi__chips">
          {snap.statuses!.map(s => (
            <RemovableChip key={s.id} label={s.label} isGlowing={s.isGlowing} isCons={s.isCons}
              onRemove={() => removeStatus(s.id)}
              onToggleGlow={() => toggleStatusGlow(s.id)}
              onToggleCons={() => toggleStatusCons(s.id)} />
          ))}
        </div>
      )}
      {isNpc && (snap.tags ?? []).length > 0 && (
        <div className="sbi__box-tags">
          {snap.tags!.map(tag => (
            <TagRow key={tag.id} tag={tag} onToggle={i => toggleNpcTagCb(tag.id, i)} onRemove={() => removeTag(tag.id)}
              onToggleGlow={() => toggleTagGlow(tag.id)}
              onToggleCons={() => toggleTagCons(tag.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Simple Threat (quick-created Threat object, same shape as AdvThreat) ── */
function SimpleThreatCard({
  item, sceneId, onUpdateSnapshot,
}: { item: SceneItem; sceneId: string; onUpdateSnapshot: Props["onUpdateSnapshot"] }) {
  const snap = item.snapshot as ThreatSnap;

  const save = (patch: Partial<ThreatSnap>) =>
    onUpdateSnapshot(item.instanceId, { ...snap, ...patch } as Record<string, unknown>);

  const removeStatus   = (id: string) => save({ statuses: (snap.statuses ?? []).filter(s => s.id !== id) });
  const removeTag      = (id: string) => save({ tags:     (snap.tags     ?? []).filter(t => t.id !== id) });
  const toggleStatusGlow = (id: string) => save({ statuses: (snap.statuses ?? []).map(s => s.id !== id ? s : { ...s, isGlowing: !s.isGlowing, isCons: false }) });
  const toggleStatusCons = (id: string) => save({ statuses: (snap.statuses ?? []).map(s => s.id !== id ? s : { ...s, isCons: !s.isCons, isGlowing: false }) });
  const toggleTagGlow    = (id: string) => save({ tags: (snap.tags ?? []).map(t => t.id !== id ? t : { ...t, isGlowing: !t.isGlowing, isCons: false }) });
  const toggleTagCons    = (id: string) => save({ tags: (snap.tags ?? []).map(t => t.id !== id ? t : { ...t, isCons: !t.isCons, isGlowing: false }) });

  const toggleLimitCheck = (limitId: string, i: number) => {
    const limits = (snap.limits ?? []).map(l =>
      l.id !== limitId ? l : { ...l, checked: toggleFill(l.checked, i) }
    );
    save({ limits });
  };

  const toggleTagCb = (tagId: string, i: number) => {
    const tags = (snap.tags ?? []).map(t =>
      t.id !== tagId ? t : { ...t, checkboxes: toggleFill(t.checkboxes, i) }
    );
    save({ tags });
  };

  const toggleMoveTagCb = (moveId: string, tagId: string, i: number) => {
    const moves = (snap.moves ?? []).map(m => {
      if (m.id !== moveId) return m;
      return { ...m, tags: m.tags.map(t =>
        t.id !== tagId ? t : { ...t, checkboxes: toggleFill(t.checkboxes, i) }
      )};
    });
    save({ moves });
  };

  const { setNodeRef: setDropRef, isOver: isDropOver } = useDroppable({
    id: `scene-item-${item.instanceId}`,
    data: { sceneId, instanceId: item.instanceId },
  });

  return (
    <div ref={setDropRef} className={`sbi sbi--simple-threat${isDropOver ? " sbi--drop-over" : ""}`}>
      <span className="sbi__section-label">Threat</span>
      <span className="sbi__name">{snap.name ?? "Threat"}</span>
      {snap.portraitUrl
        ? <img className="sbi__portrait-square" src={snap.portraitUrl} alt="" />
        : <div className="sbi__portrait-square sbi__portrait-square--empty">☠</div>}
      {(snap.limits ?? []).length > 0 && (
        <div className="sbi__section">
          <span className="sbi__section-label">Limits</span>
          {snap.limits!.map(lim => (
            <div key={lim.id} className="sbi__limit-row">
              <span className="sbi__limit-label">{lim.label}</span>
              <div className="sbi__checkboxes">
                {lim.checked.slice(0, 8).map((v, i) => (
                  <RoundCheckbox key={i} checked={v} onChange={() => toggleLimitCheck(lim.id, i)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {(snap.statuses ?? []).length > 0 && (
        <div className="sbi__section">
          <span className="sbi__section-label">Statuses</span>
          <div className="sbi__chips">
            {snap.statuses!.map(s => (
              <RemovableChip key={s.id} label={s.label} isGlowing={s.isGlowing} isCons={s.isCons}
                onRemove={() => removeStatus(s.id)}
                onToggleGlow={() => toggleStatusGlow(s.id)}
                onToggleCons={() => toggleStatusCons(s.id)} />
            ))}
          </div>
        </div>
      )}
      {(snap.tags ?? []).length > 0 && (
        <div className="sbi__section">
          <span className="sbi__section-label">Tags</span>
          {snap.tags!.map(tag => (
            <TagRow key={tag.id} tag={tag} onToggle={i => toggleTagCb(tag.id, i)} onRemove={() => removeTag(tag.id)}
              onToggleGlow={() => toggleTagGlow(tag.id)}
              onToggleCons={() => toggleTagCons(tag.id)} />
          ))}
        </div>
      )}
      {(snap.moves ?? []).length > 0 && (
        <div className="sbi__section">
          <span className="sbi__section-label">Moves</span>
          {snap.moves!.map(move => (
            <div key={move.id} className="sbi__move">
              <span className="sbi__move-name">{move.name}</span>
              {move.tags.map(tag => (
                <TagRow key={tag.id} tag={tag} onToggle={i => toggleMoveTagCb(move.id, tag.id, i)} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Simple Location — flat statuses / tags / NPCs, no areas ── */
function SimpleLocationCard({
  item, sceneId, onUpdateSnapshot,
}: { item: SceneItem; sceneId: string; onUpdateSnapshot: Props["onUpdateSnapshot"] }) {
  const snap = item.snapshot as LocationSnap;

  // Entire card is droppable for statuses/tags/NPCs
  const { setNodeRef: setDropRef, isOver: isDropOver } = useDroppable({
    id: `scene-item-${item.instanceId}`,
    data: { sceneId, instanceId: item.instanceId },
  });

  const save = (patch: Partial<LocationSnap>) =>
    onUpdateSnapshot(item.instanceId, { ...snap, ...patch } as Record<string, unknown>);

  const removeStatus    = (id: string) => save({ statuses: (snap.statuses ?? []).filter(s => s.id !== id) });
  const removeTag       = (id: string) => save({ tags:     (snap.tags     ?? []).filter(t => t.id !== id) });
  const removeNpc       = (id: string) => save({ npcs:     (snap.npcs     ?? []).filter(n => n.id !== id) });

  const removeNpcStatus = (npcId: string, idx: number) =>
    save({ npcs: (snap.npcs ?? []).map(n =>
      n.id !== npcId ? n : { ...n, statuses: n.statuses.filter((_, i) => i !== idx) }
    ) });

  const removeNpcTag = (npcId: string, tagId: string) =>
    save({ npcs: (snap.npcs ?? []).map(n =>
      n.id !== npcId ? n : { ...n, tags: (n.tags ?? []).filter(t => t.id !== tagId) }
    ) });

  const toggleTagCb = (tagId: string, i: number) =>
    save({ tags: (snap.tags ?? []).map(t =>
      t.id !== tagId ? t : { ...t, checkboxes: toggleFill(t.checkboxes, i) }
    ) });

  const toggleNpcTagCb = (npcId: string, tagId: string, i: number) =>
    save({ npcs: (snap.npcs ?? []).map(n =>
      n.id !== npcId ? n : {
        ...n,
        tags: (n.tags ?? []).map(t =>
          t.id !== tagId ? t : { ...t, checkboxes: toggleFill(t.checkboxes, i) }
        ),
      }
    ) });

  const toggleStatusGlow = (id: string) => save({ statuses: (snap.statuses ?? []).map(s => s.id !== id ? s : { ...s, isGlowing: !s.isGlowing, isCons: false }) });
  const toggleStatusCons = (id: string) => save({ statuses: (snap.statuses ?? []).map(s => s.id !== id ? s : { ...s, isCons: !s.isCons, isGlowing: false }) });
  const toggleTagGlow    = (id: string) => save({ tags: (snap.tags ?? []).map(t => t.id !== id ? t : { ...t, isGlowing: !t.isGlowing, isCons: false }) });
  const toggleTagCons    = (id: string) => save({ tags: (snap.tags ?? []).map(t => t.id !== id ? t : { ...t, isCons: !t.isCons, isGlowing: false }) });

  const toggleBoxStatusGlow = (boxId: string, id: string) => save({ boxes: (snap.boxes ?? []).map(b => b.id !== boxId ? b : { ...b, statuses: b.statuses.map(s => s.id !== id ? s : { ...s, isGlowing: !s.isGlowing, isCons: false }) }) });
  const toggleBoxStatusCons = (boxId: string, id: string) => save({ boxes: (snap.boxes ?? []).map(b => b.id !== boxId ? b : { ...b, statuses: b.statuses.map(s => s.id !== id ? s : { ...s, isCons: !s.isCons, isGlowing: false }) }) });
  const toggleBoxTagGlow    = (boxId: string, id: string) => save({ boxes: (snap.boxes ?? []).map(b => b.id !== boxId ? b : { ...b, tags: b.tags.map(t => t.id !== id ? t : { ...t, isGlowing: !t.isGlowing, isCons: false }) }) });
  const toggleBoxTagCons    = (boxId: string, id: string) => save({ boxes: (snap.boxes ?? []).map(b => b.id !== boxId ? b : { ...b, tags: b.tags.map(t => t.id !== id ? t : { ...t, isCons: !t.isCons, isGlowing: false }) }) });

  const removeBoxStatus = (boxId: string, statusId: string) =>
    save({ boxes: (snap.boxes ?? []).map(b => b.id !== boxId ? b : { ...b, statuses: b.statuses.filter(s => s.id !== statusId) }) });

  const removeBoxTag = (boxId: string, tagId: string) =>
    save({ boxes: (snap.boxes ?? []).map(b => b.id !== boxId ? b : { ...b, tags: b.tags.filter(t => t.id !== tagId) }) });

  const toggleBoxTagCb = (boxId: string, tagId: string, i: number) => {
    const boxes = (snap.boxes ?? []).map(b => {
      if (b.id !== boxId) return b;
      return { ...b, tags: b.tags.map(t => t.id !== tagId ? t : { ...t, checkboxes: toggleFill(t.checkboxes, i) }) };
    });
    save({ boxes });
  };

  const removeNpcStatusFromBox = (boxId: string, npcId: string, idx: number) =>
    save({ boxes: (snap.boxes ?? []).map(b => b.id !== boxId ? b : {
      ...b, npcs: b.npcs.map(n => n.id !== npcId ? n : { ...n, statuses: n.statuses.filter((_, i) => i !== idx) })
    }) });

  const removeNpcTagFromBox = (boxId: string, npcId: string, tagId: string) =>
    save({ boxes: (snap.boxes ?? []).map(b => b.id !== boxId ? b : {
      ...b, npcs: b.npcs.map(n => n.id !== npcId ? n : { ...n, tags: (n.tags ?? []).filter(t => t.id !== tagId) })
    }) });

  const toggleNpcTagCbInBox = (boxId: string, npcId: string, tagId: string, i: number) => {
    const boxes = (snap.boxes ?? []).map(b => {
      if (b.id !== boxId) return b;
      return { ...b, npcs: b.npcs.map(n => {
        if (n.id !== npcId) return n;
        return { ...n, tags: (n.tags ?? []).map(t => t.id !== tagId ? t : { ...t, checkboxes: toggleFill(t.checkboxes, i) }) };
      }) };
    });
    save({ boxes });
  };
  const toggleNpcTagGlow = (npcId: string, tagId: string) =>
    save({ npcs: (snap.npcs ?? []).map(n => n.id !== npcId ? n : { ...n, tags: (n.tags ?? []).map(t => t.id !== tagId ? t : { ...t, isGlowing: !(t as any).isGlowing, isCons: false }) }) });
  const toggleNpcTagCons = (npcId: string, tagId: string) =>
    save({ npcs: (snap.npcs ?? []).map(n => n.id !== npcId ? n : { ...n, tags: (n.tags ?? []).map(t => t.id !== tagId ? t : { ...t, isCons: !(t as any).isCons, isGlowing: false }) }) });
  const toggleNpcTagGlowInBox = (boxId: string, npcId: string, tagId: string) =>
    save({ boxes: (snap.boxes ?? []).map(b => b.id !== boxId ? b : { ...b, npcs: b.npcs.map(n => n.id !== npcId ? n : { ...n, tags: (n.tags ?? []).map(t => t.id !== tagId ? t : { ...t, isGlowing: !(t as any).isGlowing, isCons: false }) }) }) });
  const toggleNpcTagConsInBox = (boxId: string, npcId: string, tagId: string) =>
    save({ boxes: (snap.boxes ?? []).map(b => b.id !== boxId ? b : { ...b, npcs: b.npcs.map(n => n.id !== npcId ? n : { ...n, tags: (n.tags ?? []).map(t => t.id !== tagId ? t : { ...t, isCons: !(t as any).isCons, isGlowing: false }) }) }) });
  const toggleNpcStatusGlow = (npcId: string, idx: number) =>
    save({ npcs: (snap.npcs ?? []).map(n => n.id !== npcId ? n : { ...n, statuses: n.statuses.map((s, i) => i !== idx ? s : { ...(typeof s === 'string' ? { label: s } : s), isGlowing: !(s as any).isGlowing, isCons: false }) }) });
  const toggleNpcStatusCons = (npcId: string, idx: number) =>
    save({ npcs: (snap.npcs ?? []).map(n => n.id !== npcId ? n : { ...n, statuses: n.statuses.map((s, i) => i !== idx ? s : { ...(typeof s === 'string' ? { label: s } : s), isCons: !(s as any).isCons, isGlowing: false }) }) });
  const toggleNpcStatusGlowInBox = (boxId: string, npcId: string, idx: number) =>
    save({ boxes: (snap.boxes ?? []).map(b => b.id !== boxId ? b : { ...b, npcs: b.npcs.map(n => n.id !== npcId ? n : { ...n, statuses: n.statuses.map((s, i) => i !== idx ? s : { ...(typeof s === 'string' ? { label: s } : s), isGlowing: !(s as any).isGlowing, isCons: false }) }) }) });
  const toggleNpcStatusConsInBox = (boxId: string, npcId: string, idx: number) =>
    save({ boxes: (snap.boxes ?? []).map(b => b.id !== boxId ? b : { ...b, npcs: b.npcs.map(n => n.id !== npcId ? n : { ...n, statuses: n.statuses.map((s, i) => i !== idx ? s : { ...(typeof s === 'string' ? { label: s } : s), isCons: !(s as any).isCons, isGlowing: false }) }) }) });

  const removeNpcFromBox = (boxId: string, npcId: string) =>
    save({ boxes: (snap.boxes ?? []).map(b => b.id !== boxId ? b : {
      ...b, npcs: b.npcs.filter(n => n.id !== npcId)
    }) });

  return (
    <div ref={setDropRef} className={`sbi sbi--simple-location${isDropOver ? " sbi--drop-over" : ""}`}>
      <div className="sbi__loc-s1">
        <span className="sbi__name">{snap.name ?? "Location"}</span>
        {snap.portraitUrl
          ? <img className="sbi__portrait-landscape" src={snap.portraitUrl} alt="" />
          : <div className="sbi__portrait-landscape sbi__portrait-landscape--empty">🏑</div>}
      </div>

      <div className="sbi__two-col">
        <ThreatStatusesZone instanceId={item.instanceId} sceneId={sceneId}>
          {snap.description && (
            <>
              <span className="sbi__section-label">Description</span>
              <p className="sbi__description">{snap.description}</p>
            </>
          )}
          {(snap.statuses ?? []).length > 0 ? (
            <div className="sbi__section">
              <span className="sbi__section-label">Statuses</span>
              <div className="sbi__chips">
                {snap.statuses!.map(s => (
                  <RemovableChip key={s.id} label={s.label} isGlowing={s.isGlowing} isCons={s.isCons}
                    onRemove={() => removeStatus(s.id)}
                    onToggleGlow={() => toggleStatusGlow(s.id)}
                    onToggleCons={() => toggleStatusCons(s.id)} />
                ))}
              </div>
            </div>
          ) : (
            !snap.description && <span className="sbi__empty">↓ Drop status</span>
          )}
        </ThreatStatusesZone>

        <ThreatTagsZone instanceId={item.instanceId} sceneId={sceneId}>
          {(snap.tags ?? []).length > 0 ? (
            <div className="sbi__section">
              <span className="sbi__section-label">Tags</span>
              {snap.tags!.map(tag => (
                <TagRow key={tag.id} tag={tag} onToggle={i => toggleTagCb(tag.id, i)} onRemove={() => removeTag(tag.id)}
                  onToggleGlow={() => toggleTagGlow(tag.id)}
                  onToggleCons={() => toggleTagCons(tag.id)} />
              ))}
            </div>
          ) : (
            <span className="sbi__empty">↓ Drop tag</span>
          )}
        </ThreatTagsZone>
      </div>

      {/* Areas (added by dropping a location-without-areas onto this card) */}
      {(snap.boxes ?? []).length > 0 && (
        <div className="sbi__section">
          <span className="sbi__section-label">Areas</span>
          {snap.boxes!.map(box => (
            <DroppableBoxZone key={box.id} instanceId={item.instanceId} sceneId={sceneId} boxId={box.id}>
              <span className="sbi__box-title">{box.title || <em className="sbi__empty">Unnamed area</em>}</span>
              {(box.statuses ?? []).length > 0 && (
                <div className="sbi__chips">
                  {box.statuses.map(s => (
                    <RemovableChip key={s.id} label={s.label} isGlowing={(s as any).isGlowing} isCons={(s as any).isCons}
                      onRemove={() => removeBoxStatus(box.id, s.id)}
                      onToggleGlow={() => toggleBoxStatusGlow(box.id, s.id)}
                      onToggleCons={() => toggleBoxStatusCons(box.id, s.id)} />
                  ))}
                </div>
              )}
              {(box.tags ?? []).length > 0 && (
                <div className="sbi__box-tags">
                  {box.tags.map(tag => (
                    <TagRow
                      key={tag.id}
                      tag={{ id: tag.id, tag: tag.label, note: tag.note, checkboxes: tag.checkboxes, isGlowing: (tag as any).isGlowing, isCons: (tag as any).isCons }}
                      onToggle={i => toggleBoxTagCb(box.id, tag.id, i)}
                      onRemove={() => removeBoxTag(box.id, tag.id)}
                      onToggleGlow={() => toggleBoxTagGlow(box.id, tag.id)}
                      onToggleCons={() => toggleBoxTagCons(box.id, tag.id)}
                    />
                  ))}
                </div>
              )}
              {(box.npcs ?? []).length > 0 && (
                <div className="sbi__npcs">
                  {box.npcs.map(npc => (
                    <DroppableNpcZone key={npc.id} instanceId={item.instanceId} sceneId={sceneId} boxId={box.id} npcId={npc.id}>
                      {npc.portraitUrl
                        ? <img className="sbi__npc-portrait" src={npc.portraitUrl} alt="" />
                        : <div className="sbi__npc-portrait sbi__npc-portrait--empty">?</div>}
                      <div className="sbi__npc-info">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span className="sbi__npc-name">{npc.name}</span>
                          <button className="sbi__npc-remove" onClick={() => removeNpcFromBox(box.id, npc.id)} title="Remove">×</button>
                        </div>
                        {npc.statuses.length > 0 && (
                          <div className="sbi__chips">
                            {npc.statuses.map((s: any, i: number) => (
                              <RemovableChip key={i}
                                label={typeof s === 'string' ? s : s.label}
                                isGlowing={(s as any).isGlowing}
                                isCons={(s as any).isCons}
                                onRemove={() => removeNpcStatusFromBox(box.id, npc.id, i)}
                                onToggleGlow={() => toggleNpcStatusGlowInBox(box.id, npc.id, i)}
                                onToggleCons={() => toggleNpcStatusConsInBox(box.id, npc.id, i)} />
                            ))}
                          </div>
                        )}
                        {(npc.tags ?? []).length > 0 && (
                          <div className="sbi__box-tags">
                            {npc.tags!.map(tag => (
                              <TagRow
                                key={tag.id}
                                tag={{ id: tag.id, tag: tag.label, note: tag.note, checkboxes: tag.checkboxes, isGlowing: (tag as any).isGlowing, isCons: (tag as any).isCons }}
                                onToggle={i => toggleNpcTagCbInBox(box.id, npc.id, tag.id, i)}
                                onRemove={() => removeNpcTagFromBox(box.id, npc.id, tag.id)}
                                onToggleGlow={() => toggleNpcTagGlowInBox(box.id, npc.id, tag.id)}
                                onToggleCons={() => toggleNpcTagConsInBox(box.id, npc.id, tag.id)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </DroppableNpcZone>
                  ))}
                </div>
              )}
            </DroppableBoxZone>
          ))}
        </div>
      )}

      {(snap.npcs ?? []).length > 0 && (
        <div className="sbi__npcs">
          {snap.npcs!.map(npc => (
            <DroppableNpcZone key={npc.id} instanceId={item.instanceId} sceneId={sceneId} boxId="__root__" npcId={npc.id}>
              {npc.portraitUrl
                ? <img className="sbi__npc-portrait" src={npc.portraitUrl} alt="" />
                : <div className="sbi__npc-portrait sbi__npc-portrait--empty">?</div>}
              <div className="sbi__npc-info">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="sbi__npc-name">{npc.name}</span>
                  <button className="sbi__npc-remove" onClick={() => removeNpc(npc.id)} title="Remove">×</button>
                </div>
                {npc.statuses.length > 0 && (
                  <div className="sbi__chips">
                    {npc.statuses.map((s: any, i: number) => (
                      <RemovableChip key={i}
                        label={typeof s === 'string' ? s : s.label}
                        isGlowing={(s as any).isGlowing}
                        isCons={(s as any).isCons}
                        onRemove={() => removeNpcStatus(npc.id, i)}
                        onToggleGlow={() => toggleNpcStatusGlow(npc.id, i)}
                        onToggleCons={() => toggleNpcStatusCons(npc.id, i)} />
                    ))}
                  </div>
                )}
                {(npc.tags ?? []).length > 0 && (
                  <div className="sbi__box-tags">
                    {npc.tags!.map(tag => (
                      <TagRow
                        key={tag.id}
                        tag={{ id: tag.id, tag: tag.label, note: tag.note, checkboxes: tag.checkboxes, isGlowing: (tag as any).isGlowing, isCons: (tag as any).isCons }}
                        onToggle={i => toggleNpcTagCb(npc.id, tag.id, i)}
                        onRemove={() => removeNpcTag(npc.id, tag.id)}
                        onToggleGlow={() => toggleNpcTagGlow(npc.id, tag.id)}
                        onToggleCons={() => toggleNpcTagCons(npc.id, tag.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </DroppableNpcZone>
          ))}
        </div>
      )}

    </div>
  );
}

/* ── Character card ── */
function CharacterCard({
  item, sceneId, onUpdateSnapshot,
}: { item: SceneItem; sceneId: string; onUpdateSnapshot: Props["onUpdateSnapshot"] }) {
  const snap = item.snapshot as CharSnap;

  // Entire card is one drop target
  const { setNodeRef: setDropRef, isOver: isDropOver } = useDroppable({
    id: `scene-item-${item.instanceId}`,
    data: { sceneId, instanceId: item.instanceId },
  });

  const removeStatus = (id: string) =>
    onUpdateSnapshot(item.instanceId, { ...snap, statuses: (snap.statuses ?? []).filter(s => s.id !== id) } as Record<string, unknown>);

  const removeTag = (id: string) =>
    onUpdateSnapshot(item.instanceId, { ...snap, currentStatuses: (snap.currentStatuses ?? []).filter(s => s.id !== id) } as Record<string, unknown>);

  const toggleCb = (tagId: string, i: number) => {
    const currentStatuses = (snap.currentStatuses ?? []).map((s) =>
      s.id !== tagId ? s : { ...s, checkboxes: toggleFill([...s.checkboxes], i) as typeof s.checkboxes }
    );
    onUpdateSnapshot(item.instanceId, { ...snap, currentStatuses } as Record<string, unknown>);
  };

  const toggleStatusGlow = (id: string) =>
    onUpdateSnapshot(item.instanceId, { ...snap, statuses: (snap.statuses ?? []).map(s =>
      s.id !== id ? s : { ...s, isGlowing: !s.isGlowing, isCons: false }
    )} as Record<string, unknown>);
  const toggleStatusCons = (id: string) =>
    onUpdateSnapshot(item.instanceId, { ...snap, statuses: (snap.statuses ?? []).map(s =>
      s.id !== id ? s : { ...s, isCons: !s.isCons, isGlowing: false }
    )} as Record<string, unknown>);
  const toggleTagGlow = (id: string) =>
    onUpdateSnapshot(item.instanceId, { ...snap, currentStatuses: (snap.currentStatuses ?? []).map(s =>
      s.id !== id ? s : { ...s, isGlowing: !(s as any).isGlowing, isCons: false }
    )} as Record<string, unknown>);
  const toggleTagCons = (id: string) =>
    onUpdateSnapshot(item.instanceId, { ...snap, currentStatuses: (snap.currentStatuses ?? []).map(s =>
      s.id !== id ? s : { ...s, isCons: !(s as any).isCons, isGlowing: false }
    )} as Record<string, unknown>);

  return (
    <div ref={setDropRef} className={`sbi sbi--character${isDropOver ? " sbi--drop-over" : ""}`}>
      {/* Portrait + name stacked, like NPC */}
      <div className="sbi__npc-identity">
        {snap.portraitUrl
          ? <img className="sbi__portrait-portrait" src={snap.portraitUrl} alt="" />
          : <div className="sbi__portrait-portrait sbi__portrait-portrait--empty">?</div>}
        <span className="sbi__name sbi__name--centered">{snap.name ?? "Character"}</span>
      </div>

      {/* Status chips — above tags, like NPC */}
      {(snap.statuses ?? []).length > 0 && (
        <div className="sbi__chips">
          {snap.statuses!.map(s => (
            <RemovableChip key={s.id} label={s.label} isGlowing={s.isGlowing} isCons={s.isCons}
              onRemove={() => removeStatus(s.id)}
              onToggleGlow={() => toggleStatusGlow(s.id)}
              onToggleCons={() => toggleStatusCons(s.id)} />
          ))}
        </div>
      )}

      {/* Tag rows with checkboxes — synced to session */}
      {(snap.currentStatuses ?? []).length > 0 && (
        <div className="sbi__section">
          {snap.currentStatuses!.map(s => (
            <TagRow
              key={s.id}
              tag={{ id: s.id, tag: s.tag, note: s.note, checkboxes: s.checkboxes, isGlowing: (s as any).isGlowing, isCons: (s as any).isCons }}
              onToggle={i => toggleCb(s.id, i)}
              onRemove={() => removeTag(s.id)}
              onToggleGlow={() => toggleTagGlow(s.id)}
              onToggleCons={() => toggleTagCons(s.id)}
            />
          ))}
        </div>
      )}

      {(snap.statuses ?? []).length === 0 && (snap.currentStatuses ?? []).length === 0 && (
        <span className="sbi__empty">↓ Drop statuses / tags</span>
      )}
    </div>
  );
}

/* ── Toggle helpers ── */
function toggleFill(arr: boolean[], idx: number): boolean[] {
  const cb = [...arr];
  if (!cb[idx]) {
    for (let j = 0; j <= idx; j++) cb[j] = true;
  } else {
    for (let j = idx; j < cb.length; j++) cb[j] = false;
  }
  return cb;
}

/* ── Reusable tag-with-checkboxes row (click = glow/pros, hold = cons) ── */
function TagRow({
  tag, onToggle, onRemove, onToggleGlow, onToggleCons,
}: {
  tag: { id: string; tag: string; note: string; checkboxes: boolean[]; isGlowing?: boolean; isCons?: boolean; };
  onToggle: (i: number) => void;
  onRemove?: () => void;
  onToggleGlow?: () => void;
  onToggleCons?: () => void;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pressing, setPressing] = useState(false);
  const didLongRef = useRef(false);

  const startPress = (e: React.PointerEvent) => {
    e.stopPropagation();
    didLongRef.current = false;
    setPressing(true);
    timerRef.current = setTimeout(() => {
      setPressing(false);
      didLongRef.current = true;
      onToggleCons?.();
    }, 700);
  };
  const cancelPress = () => {
    setPressing(false);
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  };
  const handleClick = () => {
    if (didLongRef.current) { didLongRef.current = false; return; }
    onToggleGlow?.();
  };

  const stateClass = tag.isCons
    ? " sbi__tag-row--cons"
    : tag.isGlowing
      ? " sbi__tag-row--glowing"
      : "";
  const pressingClass = pressing ? " sbi__tag-row--pressing" : "";

  return (
    <div
      className={`sbi__tag-row${stateClass}${pressingClass}`}
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={onToggleCons || onToggleGlow ? startPress : undefined}
      onPointerUp={onToggleCons || onToggleGlow ? cancelPress : undefined}
      onPointerLeave={onToggleCons || onToggleGlow ? cancelPress : undefined}
      onClick={handleClick}
    >
      <div className="sbi__tag-row-top">
        <span className="sbi__tag-row-name">{tag.tag || <em className="sbi__empty">—</em>}</span>
        {onRemove && (
          <button
            className="sbi__tag-row-remove"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            onPointerDown={(e) => e.stopPropagation()}
            title="Remove"
          >×</button>
        )}
      </div>
      <div
        className="sbi__checkboxes"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {tag.checkboxes.map((v, i) => (
          <RoundCheckbox key={i} checked={v} onChange={() => onToggle(i)} />
        ))}
      </div>
      {tag.note && <span className="sbi__tag-row-note">{tag.note}</span>}
    </div>
  );
}

/* ── Advanced Threat card ── */
function AdvThreatCard({
  item, sceneId, onUpdateSnapshot,
}: { item: SceneItem; sceneId: string; onUpdateSnapshot: Props["onUpdateSnapshot"] }) {
  const snap = item.snapshot as ThreatSnap;

  const save = (patch: Partial<ThreatSnap>) =>
    onUpdateSnapshot(item.instanceId, { ...snap, ...patch } as Record<string, unknown>);

  const removeStatus      = (id: string) => save({ statuses: (snap.statuses ?? []).filter(s => s.id !== id) });
  const removeTag         = (id: string) => save({ tags:     (snap.tags     ?? []).filter(t => t.id !== id) });
  const removeMoveTag     = (moveId: string, tagId: string) =>
    save({ moves: (snap.moves ?? []).map(m => m.id !== moveId ? m : { ...m, tags: m.tags.filter(t => t.id !== tagId) }) });
  const removeMoveStatus  = (moveId: string, statusId: string) =>
    save({ moves: (snap.moves ?? []).map(m => m.id !== moveId ? m : { ...m, statuses: m.statuses.filter(s => s.id !== statusId) }) });

  const toggleStatusGlow     = (id: string) => save({ statuses: (snap.statuses ?? []).map(s => s.id !== id ? s : { ...s, isGlowing: !s.isGlowing, isCons: false }) });
  const toggleStatusCons     = (id: string) => save({ statuses: (snap.statuses ?? []).map(s => s.id !== id ? s : { ...s, isCons: !s.isCons, isGlowing: false }) });
  const toggleTagGlow        = (id: string) => save({ tags: (snap.tags ?? []).map(t => t.id !== id ? t : { ...t, isGlowing: !t.isGlowing, isCons: false }) });
  const toggleTagCons        = (id: string) => save({ tags: (snap.tags ?? []).map(t => t.id !== id ? t : { ...t, isCons: !t.isCons, isGlowing: false }) });
  const toggleMoveStatusGlow = (moveId: string, id: string) => save({ moves: (snap.moves ?? []).map(m => m.id !== moveId ? m : { ...m, statuses: m.statuses.map(s => s.id !== id ? s : { ...s, isGlowing: !s.isGlowing, isCons: false }) }) });
  const toggleMoveStatusCons = (moveId: string, id: string) => save({ moves: (snap.moves ?? []).map(m => m.id !== moveId ? m : { ...m, statuses: m.statuses.map(s => s.id !== id ? s : { ...s, isCons: !s.isCons, isGlowing: false }) }) });
  const toggleMoveTagGlow    = (moveId: string, id: string) => save({ moves: (snap.moves ?? []).map(m => m.id !== moveId ? m : { ...m, tags: m.tags.map(t => t.id !== id ? t : { ...t, isGlowing: !t.isGlowing, isCons: false }) }) });
  const toggleMoveTagCons    = (moveId: string, id: string) => save({ moves: (snap.moves ?? []).map(m => m.id !== moveId ? m : { ...m, tags: m.tags.map(t => t.id !== id ? t : { ...t, isCons: !t.isCons, isGlowing: false }) }) });

  const toggleLimitCheck = (limitId: string, i: number) => {
    const limits = (snap.limits ?? []).map(l =>
      l.id !== limitId ? l : { ...l, checked: toggleFill(l.checked, i) }
    );
    save({ limits });
  };

  const toggleTagCb = (tagId: string, i: number) => {
    const tags = (snap.tags ?? []).map(t =>
      t.id !== tagId ? t : { ...t, checkboxes: toggleFill(t.checkboxes, i) }
    );
    save({ tags });
  };

  const toggleMoveTagCb = (moveId: string, tagId: string, i: number) => {
    const moves = (snap.moves ?? []).map(m => {
      if (m.id !== moveId) return m;
      return {
        ...m,
        tags: m.tags.map(t =>
          t.id !== tagId ? t : { ...t, checkboxes: toggleFill(t.checkboxes, i) }
        ),
      };
    });
    save({ moves });
  };

  return (
    <div className="sbi sbi--adv-threat">
      {/* ── 2-column grid ── */}
      <div className="sbi__two-col">

        {/* LEFT — Identity / Limits / Statuses — droppable for statuses */}
        <ThreatStatusesZone instanceId={item.instanceId} sceneId={sceneId}>
          <span className="sbi__section-label">Identity</span>
          <span className="sbi__name">{snap.name ?? "Threat"}</span>

          {snap.portraitUrl
            ? <img className="sbi__portrait-square" src={snap.portraitUrl} alt="" />
            : <div className="sbi__portrait-square sbi__portrait-square--empty">☠</div>}

          {snap.description && (
            <p className="sbi__description">{snap.description}</p>
          )}

          {(snap.limits ?? []).length > 0 && (
            <div className="sbi__section">
              <span className="sbi__section-label">Limits</span>
              {snap.limits!.map(lim => (
                <div key={lim.id} className="sbi__limit-row">
                  <span className="sbi__limit-label">{lim.label}</span>
                  <div className="sbi__checkboxes">
                    {lim.checked.slice(0, 8).map((v, i) => (
                      <RoundCheckbox key={i} checked={v} onChange={() => toggleLimitCheck(lim.id, i)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {(snap.statuses ?? []).length > 0 && (
            <div className="sbi__section">
              <span className="sbi__section-label">Statuses</span>
              <div className="sbi__chips">
                {snap.statuses!.map(s => (
                  <RemovableChip key={s.id} label={s.label} isGlowing={s.isGlowing} isCons={s.isCons}
                    onRemove={() => removeStatus(s.id)}
                    onToggleGlow={() => toggleStatusGlow(s.id)}
                    onToggleCons={() => toggleStatusCons(s.id)} />
                ))}
              </div>
            </div>
          )}
        </ThreatStatusesZone>

        {/* RIGHT — Tags & Moves — droppable for tags */}
        <ThreatTagsZone instanceId={item.instanceId} sceneId={sceneId}>
          {(snap.tags ?? []).length > 0 && (
            <div className="sbi__section">
              <span className="sbi__section-label">Tags</span>
              {snap.tags!.map(tag => (
                <TagRow key={tag.id} tag={tag} onToggle={i => toggleTagCb(tag.id, i)} onRemove={() => removeTag(tag.id)}
                  onToggleGlow={() => toggleTagGlow(tag.id)}
                  onToggleCons={() => toggleTagCons(tag.id)} />
              ))}
            </div>
          )}

          {(snap.moves ?? []).length > 0 && (
            <div className="sbi__section">
              <span className="sbi__section-label">Moves</span>
              {snap.moves!.map(move => (
                <MoveDropZone key={move.id} instanceId={item.instanceId} sceneId={sceneId} moveId={move.id}>
                  <span className="sbi__move-name">{move.name}</span>
                  {move.tags.length > 0 && (
                    <div className="sbi__move-tags">
                      {move.tags.map(tag => (
                        <TagRow
                          key={tag.id}
                          tag={tag}
                          onToggle={i => toggleMoveTagCb(move.id, tag.id, i)}
                          onRemove={() => removeMoveTag(move.id, tag.id)}
                          onToggleGlow={() => toggleMoveTagGlow(move.id, tag.id)}
                          onToggleCons={() => toggleMoveTagCons(move.id, tag.id)}
                        />
                      ))}
                    </div>
                  )}
                  {move.statuses.length > 0 && (
                    <div className="sbi__chips">
                      {move.statuses.map(s => (
                        <RemovableChip key={s.id} label={s.label} isGlowing={s.isGlowing} isCons={s.isCons}
                          onRemove={() => removeMoveStatus(move.id, s.id)}
                          onToggleGlow={() => toggleMoveStatusGlow(move.id, s.id)}
                          onToggleCons={() => toggleMoveStatusCons(move.id, s.id)} />
                      ))}
                    </div>
                  )}
                </MoveDropZone>
              ))}
            </div>
          )}
        </ThreatTagsZone>
      </div>
    </div>
  );
}

/* ── Advanced Location card ── */
function AdvLocationCard({
  item, sceneId, onUpdateSnapshot,
}: { item: SceneItem; sceneId: string; onUpdateSnapshot: Props["onUpdateSnapshot"] }) {
  const snap = item.snapshot as LocationSnap;

  const save = (patch: Partial<LocationSnap>) =>
    onUpdateSnapshot(item.instanceId, { ...snap, ...patch } as Record<string, unknown>);

  const toggleBoxTagCb = (boxId: string, tagId: string, i: number) => {
    const boxes = (snap.boxes ?? []).map(b => {
      if (b.id !== boxId) return b;
      return {
        ...b,
        tags: b.tags.map(t =>
          t.id !== tagId ? t : { ...t, checkboxes: toggleFill(t.checkboxes, i) }
        ),
      };
    });
    save({ boxes });
  };

  const toggleNpcTagCb = (boxId: string, npcId: string, tagId: string, i: number) => {
    const boxes = (snap.boxes ?? []).map(b => {
      if (b.id !== boxId) return b;
      return {
        ...b,
        npcs: b.npcs.map(npc => {
          if (npc.id !== npcId) return npc;
          const tags = (npc.tags ?? []).map(t =>
            t.id !== tagId ? t : { ...t, checkboxes: toggleFill(t.checkboxes, i) }
          );
          return { ...npc, tags };
        }),
      };
    });
    save({ boxes });
  };

  const toggleNpcTagGlow = (boxId: string, npcId: string, tagId: string) =>
    save({ boxes: (snap.boxes ?? []).map(b => b.id !== boxId ? b : { ...b, npcs: b.npcs.map(npc => npc.id !== npcId ? npc : { ...npc, tags: (npc.tags ?? []).map(t => t.id !== tagId ? t : { ...t, isGlowing: !(t as any).isGlowing, isCons: false }) }) }) });
  const toggleNpcTagCons = (boxId: string, npcId: string, tagId: string) =>
    save({ boxes: (snap.boxes ?? []).map(b => b.id !== boxId ? b : { ...b, npcs: b.npcs.map(npc => npc.id !== npcId ? npc : { ...npc, tags: (npc.tags ?? []).map(t => t.id !== tagId ? t : { ...t, isCons: !(t as any).isCons, isGlowing: false }) }) }) });
  const toggleNpcStatusGlow = (boxId: string, npcId: string, idx: number) =>
    save({ boxes: (snap.boxes ?? []).map(b => b.id !== boxId ? b : { ...b, npcs: b.npcs.map(npc => npc.id !== npcId ? npc : { ...npc, statuses: npc.statuses.map((s, i) => i !== idx ? s : { ...(typeof s === 'string' ? { label: s } : s), isGlowing: !(s as any).isGlowing, isCons: false }) }) }) });
  const toggleNpcStatusCons = (boxId: string, npcId: string, idx: number) =>
    save({ boxes: (snap.boxes ?? []).map(b => b.id !== boxId ? b : { ...b, npcs: b.npcs.map(npc => npc.id !== npcId ? npc : { ...npc, statuses: npc.statuses.map((s, i) => i !== idx ? s : { ...(typeof s === 'string' ? { label: s } : s), isCons: !(s as any).isCons, isGlowing: false }) }) }) });
  const removeLocStatus     = (id: string) => save({ statuses: (snap.statuses ?? []).filter(s => s.id !== id) });
  const removeLocTag         = (id: string) => save({ tags: (snap.tags ?? []).filter(t => t.id !== id) });
  const removeBoxStatus     = (boxId: string, statusId: string) =>
    save({ boxes: (snap.boxes ?? []).map(b => b.id !== boxId ? b : { ...b, statuses: b.statuses.filter(s => s.id !== statusId) }) });
  const removeBoxTag        = (boxId: string, tagId: string) =>
    save({ boxes: (snap.boxes ?? []).map(b => b.id !== boxId ? b : { ...b, tags: b.tags.filter(t => t.id !== tagId) }) });
  const removeNpcStatus     = (boxId: string, npcId: string, idx: number) =>
    save({ boxes: (snap.boxes ?? []).map(b => b.id !== boxId ? b : { ...b, npcs: b.npcs.map(npc => npc.id !== npcId ? npc : { ...npc, statuses: npc.statuses.filter((_, i) => i !== idx) }) }) });
  const removeNpcTagFromBox = (boxId: string, npcId: string, tagId: string) =>
    save({ boxes: (snap.boxes ?? []).map(b => b.id !== boxId ? b : { ...b, npcs: b.npcs.map(npc => npc.id !== npcId ? npc : { ...npc, tags: (npc.tags ?? []).filter(t => t.id !== tagId) }) }) });

  const toggleLocStatusGlow  = (id: string) => save({ statuses: (snap.statuses ?? []).map(s => s.id !== id ? s : { ...s, isGlowing: !s.isGlowing, isCons: false }) });
  const toggleLocStatusCons  = (id: string) => save({ statuses: (snap.statuses ?? []).map(s => s.id !== id ? s : { ...s, isCons: !s.isCons, isGlowing: false }) });
  const toggleLocTagGlow     = (id: string) => save({ tags: (snap.tags ?? []).map(t => t.id !== id ? t : { ...t, isGlowing: !t.isGlowing, isCons: false }) });
  const toggleLocTagCons     = (id: string) => save({ tags: (snap.tags ?? []).map(t => t.id !== id ? t : { ...t, isCons: !t.isCons, isGlowing: false }) });
  const toggleLocTagCb       = (tagId: string, i: number) => save({ tags: (snap.tags ?? []).map(t => t.id !== tagId ? t : { ...t, checkboxes: toggleFill(t.checkboxes, i) }) });
  const toggleBoxStatusGlow  = (boxId: string, id: string) => save({ boxes: (snap.boxes ?? []).map(b => b.id !== boxId ? b : { ...b, statuses: b.statuses.map(s => s.id !== id ? s : { ...s, isGlowing: !s.isGlowing, isCons: false }) }) });
  const toggleBoxStatusCons  = (boxId: string, id: string) => save({ boxes: (snap.boxes ?? []).map(b => b.id !== boxId ? b : { ...b, statuses: b.statuses.map(s => s.id !== id ? s : { ...s, isCons: !s.isCons, isGlowing: false }) }) });
  const toggleBoxTagGlow     = (boxId: string, id: string) => save({ boxes: (snap.boxes ?? []).map(b => b.id !== boxId ? b : { ...b, tags: b.tags.map(t => t.id !== id ? t : { ...t, isGlowing: !t.isGlowing, isCons: false }) }) });
  const toggleBoxTagCons     = (boxId: string, id: string) => save({ boxes: (snap.boxes ?? []).map(b => b.id !== boxId ? b : { ...b, tags: b.tags.map(t => t.id !== id ? t : { ...t, isCons: !t.isCons, isGlowing: false }) }) });

  return (
    <div className="sbi sbi--adv-location">

      {/* ── Section 1 (full width): Name + Portrait ── */}
      <div className="sbi__loc-s1">
        <span className="sbi__name">{snap.name ?? "Location"}</span>
        {snap.portraitUrl
          ? <img className="sbi__portrait-landscape" src={snap.portraitUrl} alt="" />
          : <div className="sbi__portrait-landscape sbi__portrait-landscape--empty">🏛</div>}
      </div>

      {/* ── Sections 2 & 3 side by side ── */}
      <div className="sbi__two-col">

        {/* LEFT — Section 2: Description + Statuses (droppable) */}
        <ThreatStatusesZone instanceId={item.instanceId} sceneId={sceneId}>
          {snap.description && (
            <>
              <span className="sbi__section-label">Description</span>
              <p className="sbi__description">{snap.description}</p>
            </>
          )}

          {(snap.statuses ?? []).length > 0 && (
            <div className="sbi__section">
              <span className="sbi__section-label">Statuses</span>
              <div className="sbi__chips">
                {snap.statuses!.map(s => (
                  <RemovableChip key={s.id} label={s.label} isGlowing={s.isGlowing} isCons={s.isCons}
                    onRemove={() => removeLocStatus(s.id)}
                    onToggleGlow={() => toggleLocStatusGlow(s.id)}
                    onToggleCons={() => toggleLocStatusCons(s.id)} />
                ))}
              </div>
            </div>
          )}

          {(snap.tags ?? []).length > 0 && (
            <div className="sbi__section">
              <span className="sbi__section-label">Tags</span>
              {snap.tags!.map(tag => (
                <TagRow key={tag.id} tag={tag} onToggle={i => toggleLocTagCb(tag.id, i)} onRemove={() => removeLocTag(tag.id)}
                  onToggleGlow={() => toggleLocTagGlow(tag.id)}
                  onToggleCons={() => toggleLocTagCons(tag.id)} />
              ))}
            </div>
          )}
        </ThreatStatusesZone>

        {/* RIGHT — Section 3: Areas */}
        <div className="sbi__col sbi__col--right">
          {(snap.boxes ?? []).length > 0 && (
            <>
              <span className="sbi__section-label">Areas</span>
              {snap.boxes!.map(box => (
                <DroppableBoxZone key={box.id} instanceId={item.instanceId} sceneId={sceneId} boxId={box.id}>
                  <span className="sbi__box-title">{box.title || <em className="sbi__empty">Unnamed area</em>}</span>

                  {(box.statuses ?? []).length > 0 && (
                    <div className="sbi__chips">
                      {box.statuses.map(s => (
                        <RemovableChip key={s.id} label={s.label} isGlowing={(s as any).isGlowing} isCons={(s as any).isCons}
                          onRemove={() => removeBoxStatus(box.id, s.id)}
                          onToggleGlow={() => toggleBoxStatusGlow(box.id, s.id)}
                          onToggleCons={() => toggleBoxStatusCons(box.id, s.id)} />
                      ))}
                    </div>
                  )}

                  {(box.tags ?? []).length > 0 && (
                    <div className="sbi__box-tags">
                      {box.tags.map(tag => (
                        <TagRow
                          key={tag.id}
                          tag={{ id: tag.id, tag: tag.label, note: tag.note, checkboxes: tag.checkboxes, isGlowing: (tag as any).isGlowing, isCons: (tag as any).isCons }}
                          onToggle={i => toggleBoxTagCb(box.id, tag.id, i)}
                          onRemove={() => removeBoxTag(box.id, tag.id)}
                          onToggleGlow={() => toggleBoxTagGlow(box.id, tag.id)}
                          onToggleCons={() => toggleBoxTagCons(box.id, tag.id)}
                        />
                      ))}
                    </div>
                  )}

                  {item.expanded && (box.npcs ?? []).length > 0 && (
                    <div className="sbi__npcs">
                      {box.npcs.map(npc => (
                        <DroppableNpcZone key={npc.id} instanceId={item.instanceId} sceneId={sceneId} boxId={box.id} npcId={npc.id}>
                          {npc.portraitUrl
                            ? <img className="sbi__npc-portrait" src={npc.portraitUrl} alt="" />
                            : <div className="sbi__npc-portrait sbi__npc-portrait--empty">?</div>}
                          <div className="sbi__npc-info">
                            <span className="sbi__npc-name">{npc.name}</span>
                            {npc.statuses.length > 0 && (
                              <div className="sbi__chips">
                                {npc.statuses.map((s: any, i: number) => (
                                  <RemovableChip key={i}
                                    label={typeof s === 'string' ? s : s.label}
                                    isGlowing={(s as any).isGlowing}
                                    isCons={(s as any).isCons}
                                    onRemove={() => removeNpcStatus(box.id, npc.id, i)}
                                    onToggleGlow={() => toggleNpcStatusGlow(box.id, npc.id, i)}
                                    onToggleCons={() => toggleNpcStatusCons(box.id, npc.id, i)} />
                                ))}
                              </div>
                            )}
                            {(npc.tags ?? []).length > 0 && (
                              <div className="sbi__box-tags">
                                {npc.tags!.map(tag => (
                                  <TagRow
                                    key={tag.id}
                                    tag={{ id: tag.id, tag: tag.label, note: tag.note, checkboxes: tag.checkboxes, isGlowing: (tag as any).isGlowing, isCons: (tag as any).isCons }}
                                    onToggle={i => toggleNpcTagCb(box.id, npc.id, tag.id, i)}
                                    onRemove={() => removeNpcTagFromBox(box.id, npc.id, tag.id)}
                                    onToggleGlow={() => toggleNpcTagGlow(box.id, npc.id, tag.id)}
                                    onToggleCons={() => toggleNpcTagCons(box.id, npc.id, tag.id)}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </DroppableNpcZone>
                      ))}
                    </div>
                  )}
                </DroppableBoxZone>
              ))}
            </>
          )}
        </div>
      </div>

    </div>
  );
}

/* ── Main dispatcher ── */
export default function SceneBoardItem({ item, sceneId, onUpdateSnapshot }: Props) {
  switch (item.sourceType) {
    case "simpleElement":
      return <SimpleElementCard item={item} sceneId={sceneId} onUpdateSnapshot={onUpdateSnapshot} />;
    case "simpleThreat":
      return <SimpleThreatCard item={item} sceneId={sceneId} onUpdateSnapshot={onUpdateSnapshot} />;
    case "simpleLocation":
      return <SimpleLocationCard item={item} sceneId={sceneId} onUpdateSnapshot={onUpdateSnapshot} />;
    case "character":
      return <CharacterCard item={item} sceneId={sceneId} onUpdateSnapshot={onUpdateSnapshot} />;
    case "advThreat":
      return <AdvThreatCard item={item} sceneId={sceneId} onUpdateSnapshot={onUpdateSnapshot} />;
    case "advLocation":
      return <AdvLocationCard item={item} sceneId={sceneId} onUpdateSnapshot={onUpdateSnapshot} />;
    default:
      return <div className="sbi">Unknown item type</div>;
  }
}
