import { Link } from "react-router-dom";
import React, { useState, useCallback } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
  pointerWithin,
} from "@dnd-kit/core";
import SidebarMenu from "./SidebarMenu";
import GMPanel from "./GMPanel";
import { SessionContext } from "../context/SessionContext";
import { Session, UpdateSessionInput, SceneItem, SceneItemSource, StatusTag, BoardScene } from "@rpg/shared";
import { v4 as uuid } from "uuid";

/** Default sizes per source type */
const DEFAULT_SIZE: Record<SceneItemSource, { w: number; h: number }> = {
  character:      { w: 210, h: 300 },
  advThreat:      { w: 560, h: 340 },
  advLocation:    { w: 600, h: 480 },
  simpleThreat:   { w: 400, h: 280 },
  simpleLocation: { w: 500, h: 360 },
  simpleElement:  { w: 200, h: 100 },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [activeOnChange, setActiveOnChange] = useState<(u: UpdateSessionInput) => void>(() => () => {});
  const [activeDrag, setActiveDrag] = useState<{ sourceType: SceneItemSource; label: string } | null>(null);

  const register = useCallback(
    (session: Session | null, onChange: (u: UpdateSessionInput) => void) => {
      setActiveSession(session);
      setActiveOnChange(() => onChange);
    },
    []
  );

  const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 5 } });
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(pointerSensor, keyboardSensor);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current as { sourceType?: SceneItemSource; label?: string } | undefined;
    if (data?.sourceType) {
      setActiveDrag({ sourceType: data.sourceType, label: data.label ?? "" });
    }
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDrag(null);
    const { active, over } = event;
    if (!over) return;

    const dragData = active.data.current as {
      sourceType?: SceneItemSource;
      sourceId?: string;
      payload?: Record<string, unknown>;
      label?: string;
      isSceneItem?: boolean;
      instanceId?: string;
      sceneId?: string;
    } | undefined;
    if (!dragData) return;

    /* ── Case A: Repositioning an existing scene item ── */
    if (dragData.isSceneItem && dragData.instanceId && dragData.sceneId && activeSession) {
      const delta = event.delta;
      // Clamp positions so cards can't leave the canvas boundaries
      const canvasEl = document.querySelector('.main-board__canvas') as HTMLElement | null;
      const canvasW = canvasEl?.clientWidth ?? 2000;
      const canvasH = canvasEl?.clientHeight ?? 1200;
      const scenes = (activeSession.scenes ?? []).map((scene) => {
        if (scene.id !== dragData.sceneId) return scene;
        return {
          ...scene,
          items: (scene.items ?? []).map((item) => {
            if (item.instanceId !== dragData.instanceId) return item;
            const newX = Math.max(0, Math.min(item.x + delta.x, canvasW - item.w));
            const newY = Math.max(0, item.y + delta.y);
            return { ...item, x: newX, y: newY };
          }),
        };
      });
      activeOnChange({ scenes });
      return;
    }

    /* ── Case B: Dropping a source item onto the board canvas ── */
    if (over.id === "board-canvas" && dragData.sourceType && dragData.sourceId && dragData.payload) {
      if (!activeSession) return;
      const activeSceneId = (over.data.current as { sceneId?: string })?.sceneId;
      if (!activeSceneId) return;

      const isNpcDrop = dragData.sourceType === "simpleElement" && (dragData.payload as Record<string, unknown> | undefined)?.kind === "npc";
      const size = isNpcDrop ? { w: 220, h: 200 } : DEFAULT_SIZE[dragData.sourceType];
      // Compute position from the pointer position relative to the droppable
      const overRect = over.rect;
      const pointerX = (event.activatorEvent as PointerEvent)?.clientX ?? 0;
      const pointerY = (event.activatorEvent as PointerEvent)?.clientY ?? 0;
      const x = Math.max(0, pointerX - overRect.left + event.delta.x);
      const y = Math.max(0, pointerY - overRect.top + event.delta.y);

      const newItem: SceneItem = {
        instanceId: uuid(),
        sourceType: dragData.sourceType,
        sourceId: dragData.sourceId,
        x,
        y,
        w: size.w,
        h: size.h,
        expanded: false,
        snapshot: dragData.payload,
      };

      const scenes: BoardScene[] = (activeSession.scenes ?? []).map((scene) => {
        if (scene.id !== activeSceneId) return scene;
        return { ...scene, items: [...(scene.items ?? []), newItem] };
      });
      activeOnChange({ scenes });
      return;
    }

    /* ── Case C: Dropping a tag/status onto a threat or character zone ── */
    if (
      dragData.sourceType === "simpleElement" &&
      typeof over.id === "string" &&
      (over.id.startsWith("scene-item-") || over.id.startsWith("scene-statuses-") || over.id.startsWith("scene-tags-")) &&
      activeSession
    ) {
      const overId = over.id as string;
      const targetSceneId = (over.data.current as { sceneId?: string })?.sceneId;
      // scene-item- encodes instanceId in the suffix; new zones include it in data
      const targetInstanceId = overId.startsWith("scene-item-")
        ? overId.replace("scene-item-", "")
        : (over.data.current as { instanceId?: string })?.instanceId;
      if (!targetSceneId || !targetInstanceId) return;

      const snap = dragData.payload ?? {};
      const kind = snap.kind as string | undefined;
      const label = snap.label as string | undefined;
      if (!label) return;

      const checkboxCountC = (snap.checkboxCount as number | undefined) ?? 0;
      const newStatusTag: StatusTag = {
        id: uuid(),
        tag: label,
        note: (snap.note as string) ?? "",
        checkboxes: [checkboxCountC>0,checkboxCountC>1,checkboxCountC>2,checkboxCountC>3,checkboxCountC>4,checkboxCountC>5],
      };

      // NPCs go to location areas only (Case E) — block here
      if (kind === "npc") return;

      // Determine forced target section from the drop zone id
      const forceStatuses = overId.startsWith("scene-statuses-");
      const forceTags = overId.startsWith("scene-tags-");

      // Track which character scene item was updated so we can sync session.characters
      let updatedCharSourceId: string | null = null;
      let updatedCharSceneStatuses: Array<{ id: string; label: string }> | null = null;
      let updatedCharCurrentStatuses: StatusTag[] | null = null;

      const scenes: BoardScene[] = (activeSession.scenes ?? []).map((scene) => {
        if (scene.id !== targetSceneId) return scene;
        return {
          ...scene,
          items: (scene.items ?? []).map((item) => {
            if (item.instanceId !== targetInstanceId) return item;
            const snapshot = { ...item.snapshot } as Record<string, unknown>;
            if (item.sourceType === "character") {
              if (kind === "status") {
                // Simple chip — goes to statuses, syncs to SessionCharacter.sceneStatuses
                const existing = (snapshot.statuses as Array<{ id: string; label: string }> | undefined) ?? [];
                if (existing.some((s) => s.label === label)) return item;
                const updated = [...existing, { id: uuid(), label }];
                snapshot.statuses = updated;
                updatedCharSourceId = item.sourceId;
                updatedCharSceneStatuses = updated;
              } else {
                // Tag row — goes to currentStatuses, syncs to SessionCharacter.currentStatuses
                const existing = (snapshot.currentStatuses as StatusTag[] | undefined) ?? [];
                if (existing.some((s) => s.tag === label)) return item;
                const updated = [...existing, newStatusTag];
                snapshot.currentStatuses = updated;
                updatedCharSourceId = item.sourceId;
                updatedCharCurrentStatuses = updated;
              }
            } else if (item.sourceType === "simpleLocation" || item.sourceType === "advLocation") {
              const goesToStatusesLoc = forceStatuses || (!forceTags && kind === "status");
              if (kind === "npc") {
                const existing = (snapshot.npcs as Array<{ id: string; name: string }> | undefined) ?? [];
                if (existing.some((n) => n.name === label)) return item;
                snapshot.npcs = [...existing, {
                  id: uuid(), name: label,
                  portraitUrl: (snap.portraitUrl as string) ?? "",
                  statuses: [], tags: [],
                }];
              } else if (goesToStatusesLoc) {
                const existing = (snapshot.statuses as Array<{ id: string; label: string }> | undefined) ?? [];
                if (existing.some((s) => s.label === label)) return item;
                snapshot.statuses = [...existing, { id: uuid(), label }];
              } else {
                const existing = (snapshot.tags as StatusTag[] | undefined) ?? [];
                if (existing.some((t) => t.tag === label)) return item;
                snapshot.tags = [...existing, newStatusTag];
              }
            } else {
              // Threats and simpleElements: block NPCs
              if (kind === "npc") return item;
              const goesToStatuses = forceStatuses || (!forceTags && kind === "status");
              if (goesToStatuses) {
                const existing = (snapshot.statuses as Array<{ id: string; label: string }> | undefined) ?? [];
                if (existing.some((s) => s.label === label)) return item;
                snapshot.statuses = [...existing, { id: uuid(), label }];
              } else {
                const existing = (snapshot.tags as StatusTag[] | undefined) ?? [];
                if (existing.some((t) => t.tag === label)) return item;
                snapshot.tags = [...existing, newStatusTag];
              }
            }
            return { ...item, snapshot };
          }),
        };
      });
      const charUpdate = updatedCharSourceId
        ? {
            characters: (activeSession.characters ?? []).map((c) => {
              if (c.characterId !== updatedCharSourceId) return c;
              return {
                ...c,
                ...(updatedCharSceneStatuses !== null ? { sceneStatuses: updatedCharSceneStatuses } : {}),
                ...(updatedCharCurrentStatuses !== null ? { currentStatuses: updatedCharCurrentStatuses } : {}),
              };
            }),
          }
        : {};
      activeOnChange({ scenes, ...charUpdate });
      return;
    }

    /* ── Case F: Dropping tag/status onto an NPC inside a location area box ── */
    if (
      dragData.sourceType === "simpleElement" &&
      typeof over.id === "string" &&
      over.id.startsWith("scene-npc-") &&
      activeSession
    ) {
      const npcData = over.data.current as { sceneId?: string; instanceId?: string; boxId?: string; npcId?: string } | undefined;
      const npcSceneId = npcData?.sceneId;
      const npcInstanceId = npcData?.instanceId;
      const npcBoxId = npcData?.boxId;
      const targetNpcId = npcData?.npcId;
      if (!npcSceneId || !npcInstanceId || !npcBoxId || !targetNpcId) return;

      const npcElemSnap = dragData.payload ?? {};
      const npcKind = npcElemSnap.kind as string | undefined;
      const npcLabel = npcElemSnap.label as string | undefined;
      if (!npcLabel || npcKind === "npc") return;

      const npcScenes: BoardScene[] = (activeSession.scenes ?? []).map((scene) => {
        if (scene.id !== npcSceneId) return scene;
        return {
          ...scene,
          items: (scene.items ?? []).map((item) => {
            if (item.instanceId !== npcInstanceId) return item;
            const snapshot = { ...item.snapshot } as Record<string, unknown>;

            const updateNpc = (npc: Record<string, unknown>) => {
              if ((npc.id as string) !== targetNpcId) return npc;
              if (npcKind === "status") {
                const existing = (npc.statuses as any[] | undefined) ?? [];
                if (existing.some((s: any) => (typeof s === 'string' ? s : s.label) === npcLabel)) return npc;
                return { ...npc, statuses: [...existing, npcLabel] };
              } else {
                const existing = (npc.tags as Array<{ id: string; label: string }> | undefined) ?? [];
                if (existing.some((t) => t.label === npcLabel)) return npc;
                const npcCbCount = (npcElemSnap.checkboxCount as number | undefined) ?? 0;
                return {
                  ...npc,
                  tags: [...existing, {
                    id: uuid(),
                    label: npcLabel,
                    note: (npcElemSnap.note as string) ?? "",
                    checkboxes: [npcCbCount>0,npcCbCount>1,npcCbCount>2,npcCbCount>3,npcCbCount>4,npcCbCount>5],
                  }],
                };
              }
            };

            if (npcBoxId === "__root__") {
              // SimpleLocation root-level NPC
              const npcs = ((snapshot.npcs as Array<Record<string, unknown>>) ?? []).map(updateNpc);
              snapshot.npcs = npcs;
            } else {
              // AdvLocation box NPC
              const boxes = ((snapshot.boxes as Array<Record<string, unknown>>) ?? []).map((box) => {
                if ((box.id as string) !== npcBoxId) return box;
                const npcs = ((box.npcs as Array<Record<string, unknown>>) ?? []).map(updateNpc);
                return { ...box, npcs };
              });
              snapshot.boxes = boxes;
            }
            return { ...item, snapshot };
          }),
        };
      });
      activeOnChange({ scenes: npcScenes });
      return;
    }

    /* ── Case E: Dropping tag/status/npc onto a location area box ── */
    if (
      dragData.sourceType === "simpleElement" &&
      typeof over.id === "string" &&
      over.id.startsWith("scene-box-") &&
      activeSession
    ) {
      const boxData = over.data.current as { sceneId?: string; instanceId?: string; boxId?: string } | undefined;
      const boxSceneId = boxData?.sceneId;
      const boxInstanceId = boxData?.instanceId;
      const targetBoxId = boxData?.boxId;
      if (!boxSceneId || !boxInstanceId || !targetBoxId) return;

      const boxSnap = dragData.payload ?? {};
      const boxKind = boxSnap.kind as string | undefined;
      const boxLabel = boxSnap.label as string | undefined;
      if (!boxLabel) return;

      const boxScenes: BoardScene[] = (activeSession.scenes ?? []).map((scene) => {
        if (scene.id !== boxSceneId) return scene;
        return {
          ...scene,
          items: (scene.items ?? []).map((item) => {
            if (item.instanceId !== boxInstanceId) return item;
            const snapshot = { ...item.snapshot } as Record<string, unknown>;
            const boxes = ((snapshot.boxes as Array<Record<string, unknown>>) ?? []).map((box) => {
              if ((box.id as string) !== targetBoxId) return box;
              if (boxKind === "status") {
                const existing = (box.statuses as Array<{ id: string; label: string; notes: string[] }> | undefined) ?? [];
                if (existing.some((s) => s.label === boxLabel)) return box;
                return { ...box, statuses: [...existing, { id: uuid(), label: boxLabel, notes: [] }] };
              } else if (boxKind === "tag") {
                const existing = (box.tags as Array<{ id: string; label: string }> | undefined) ?? [];
                if (existing.some((t) => t.label === boxLabel)) return box;
                const boxCbCount = (boxSnap.checkboxCount as number | undefined) ?? 0;
                return {
                  ...box,
                  tags: [...existing, {
                    id: uuid(),
                    label: boxLabel,
                    note: (boxSnap.note as string) ?? "",
                    checkboxes: [boxCbCount>0,boxCbCount>1,boxCbCount>2,boxCbCount>3,boxCbCount>4,boxCbCount>5],
                  }],
                };
              } else if (boxKind === "npc") {
                const existing = (box.npcs as Array<{ id: string; name: string }> | undefined) ?? [];
                if (existing.some((n) => n.name === boxLabel)) return box;
                return {
                  ...box,
                  npcs: [...existing, {
                    id: uuid(),
                    name: boxLabel,
                    portraitUrl: (boxSnap.portraitUrl as string) ?? "",
                    statuses: [],
                  }],
                };
              }
              return box;
            });
            snapshot.boxes = boxes;
            return { ...item, snapshot };
          }),
        };
      });
      activeOnChange({ scenes: boxScenes });
      return;
    }

    /* ── Case D: Dropping a location onto a location (area exception) ── */
    if (
      (dragData.sourceType === "advLocation" || dragData.sourceType === "simpleLocation") &&
      typeof over.id === "string" &&
      over.id.startsWith("scene-item-") &&
      activeSession
    ) {
      const targetInstanceId = (over.id as string).replace("scene-item-", "");
      const targetSceneId = (over.data.current as { sceneId?: string })?.sceneId;
      if (!targetSceneId) return;

      const scenes: BoardScene[] = (activeSession.scenes ?? []).map((scene) => {
        if (scene.id !== targetSceneId) return scene;
        return {
          ...scene,
          items: (scene.items ?? []).map((item) => {
            if (item.instanceId !== targetInstanceId) return item;
            if (item.sourceType !== "advLocation" && item.sourceType !== "simpleLocation") return item;

            const snap = dragData.payload ?? {};
            const sourceBoxes = (snap.boxes as unknown[]) ?? [];
            // Only locations without areas can be added as area
            if (sourceBoxes.length > 0) return item;

            const targetSnap = item.snapshot;
            const targetBoxes = (targetSnap.boxes as Array<Record<string, unknown>>) ?? [];
            // Don't add duplicate
            if (targetBoxes.some((b) => b.title === snap.name)) return item;

            const newBox = {
              id: uuid(),
              title: snap.name as string,
              statuses: [],
              tags: [],
              npcs: [],
            };
            return {
              ...item,
              snapshot: {
                ...targetSnap,
                boxes: [...targetBoxes, newBox],
              },
            };
          }),
        };
      });
      activeOnChange({ scenes });
      return;
    }
  }, [activeSession, activeOnChange]);

  return (
    <SessionContext.Provider value={{ session: activeSession, onChange: activeOnChange, register }}>
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="app-shell">
          <div className="resize-warning">
            <p>Window too small.<br />Please resize your browser wider to use the app.</p>
          </div>
          <SidebarMenu />
          <div className="app-layout">
            <header className="app-header">
              <nav>
                <Link to="/">Home</Link>
                <Link to="/characters">Characters</Link>
              </nav>
              <h1>DnD Character Manager</h1>
            </header>
            <main className="app-main">{children}</main>
          </div>
          <GMPanel />
        </div>

        {/* Drag overlay — ghost preview */}
        <DragOverlay dropAnimation={null}>
          {activeDrag && (
            <div className="drag-overlay">
              <span className={`drag-overlay__badge drag-overlay__badge--${activeDrag.sourceType}`}>
                {activeDrag.label}
              </span>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </SessionContext.Provider>
  );
}
