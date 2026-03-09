import { useState, useCallback, useRef } from "react";
import { BoardScene, SceneItem, Session, StatusTag, UpdateSessionInput } from "@rpg/shared";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import SceneBoardItem from "./SceneBoardItem";

interface Props {
  scenes: BoardScene[];
  session?: Session;
  onChange: (updates: UpdateSessionInput) => void;
}

/* ── Draggable wrapper for a placed scene item ── */
function PlacedItem({
  item,
  sceneId,
  onToggleExpand,
  onRemove,
  onUpdateSnapshot,
}: {
  item: SceneItem;
  sceneId: string;
  onToggleExpand: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdateSnapshot: (id: string, snapshot: Record<string, unknown>) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `placed-${item.instanceId}`,
    data: {
      isSceneItem: true,
      instanceId: item.instanceId,
      sceneId,
    },
  });

  const style: React.CSSProperties = {
    position: "absolute",
    left: item.x,
    top: item.y,
    width: item.w,
    minHeight: item.h,
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="scene-item"
    >
      {/* Drag handle bar */}
      <div className="scene-item__handle" {...listeners} {...attributes} />
      {/* Expand / Collapse & Remove buttons */}
      <div className="scene-item__toolbar">
        <button
          className="scene-item__btn"
          onClick={() => onToggleExpand(item.instanceId)}
          title={item.expanded ? "Collapse" : "Expand"}
        >
          {item.expanded ? "▾" : "▸"}
        </button>
        <button
          className="scene-item__btn scene-item__btn--remove"
          onClick={() => onRemove(item.instanceId)}
          title="Remove from scene"
        >
          ×
        </button>
      </div>
      <SceneBoardItem item={item} sceneId={sceneId} onUpdateSnapshot={onUpdateSnapshot} />
    </div>
  );
}

/* ── Droppable canvas wrapper ── */
function BoardCanvas({
  scene,
  onToggleExpand,
  onRemove,
  onUpdateSnapshot,
}: {
  scene: BoardScene;
  onToggleExpand: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdateSnapshot: (id: string, snapshot: Record<string, unknown>) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: "board-canvas",
    data: { sceneId: scene.id },
  });

  return (
    <div
      ref={setNodeRef}
      className={`main-board__canvas ${isOver ? "main-board__canvas--over" : ""}`}
    >
      {(scene.items ?? []).map((item) => (
        <PlacedItem
          key={item.instanceId}
          item={item}
          sceneId={scene.id}
          onToggleExpand={onToggleExpand}
          onRemove={onRemove}
          onUpdateSnapshot={onUpdateSnapshot}
        />
      ))}
      {(scene.items ?? []).length === 0 && (
        <p className="main-board__empty-hint">
          Drag items here from the sidebar or GM Panel
        </p>
      )}
    </div>
  );
}

export default function SessionMainBoard({ scenes, session, onChange }: Props) {
  const [activeId, setActiveId] = useState<string | null>(
    scenes.length > 0 ? scenes[0].id : null
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  // Keep a ref to session so updateItemSnapshot always reads latest without recreating
  const sessionRef = useRef(session);
  sessionRef.current = session;

  const activeScene = scenes.find((s) => s.id === activeId) ?? null;

  const addScene = () => {
    const newScene: BoardScene = {
      id: crypto.randomUUID(),
      name: `Scene ${scenes.length + 1}`,
      items: [],
    };
    const updated = [...scenes, newScene];
    onChange({ scenes: updated });
    setActiveId(newScene.id);
  };

  const removeScene = (id: string) => {
    const updated = scenes.filter((s) => s.id !== id);
    onChange({ scenes: updated });
    if (activeId === id) {
      setActiveId(updated.length > 0 ? updated[updated.length - 1].id : null);
    }
  };

  const commitRename = (id: string) => {
    const trimmed = editingName.trim();
    if (!trimmed) { setEditingId(null); return; }
    const updated = scenes.map((s) => s.id === id ? { ...s, name: trimmed } : s);
    onChange({ scenes: updated });
    setEditingId(null);
  };

  const toggleExpand = useCallback(
    (instanceId: string) => {
      if (!activeScene) return;
      const updated = scenes.map((scene) => {
        if (scene.id !== activeScene.id) return scene;
        return {
          ...scene,
          items: (scene.items ?? []).map((it) =>
            it.instanceId === instanceId ? { ...it, expanded: !it.expanded } : it
          ),
        };
      });
      onChange({ scenes: updated });
    },
    [scenes, activeScene, onChange]
  );

  const removeItem = useCallback(
    (instanceId: string) => {
      if (!activeScene) return;
      const updated = scenes.map((scene) => {
        if (scene.id !== activeScene.id) return scene;
        return {
          ...scene,
          items: (scene.items ?? []).filter((it) => it.instanceId !== instanceId),
        };
      });
      onChange({ scenes: updated });
    },
    [scenes, activeScene, onChange]
  );

  const updateItemSnapshot = useCallback(
    (instanceId: string, snapshot: Record<string, unknown>) => {
      if (!activeScene) return;
      const targetItem = activeScene.items.find((it) => it.instanceId === instanceId);
      const updatedScenes = scenes.map((scene) => {
        if (scene.id !== activeScene.id) return scene;
        return {
          ...scene,
          items: (scene.items ?? []).map((it) =>
            it.instanceId === instanceId ? { ...it, snapshot } : it
          ),
        };
      });
      const updates: UpdateSessionInput = { scenes: updatedScenes };
      // Sync statuses + currentStatuses from scene snapshot back to session.characters (live)
      if (targetItem?.sourceType === "character" && sessionRef.current) {
        const charSnap = snapshot as { statuses?: Array<{ id: string; label: string }>; currentStatuses?: StatusTag[] };
        const updatedChars = sessionRef.current.characters.map((c) => {
          if (c.characterId !== targetItem.sourceId) return c;
          return {
            ...c,
            ...(charSnap.statuses !== undefined ? { sceneStatuses: charSnap.statuses } : {}),
            ...(charSnap.currentStatuses !== undefined ? { currentStatuses: charSnap.currentStatuses } : {}),
          };
        });
        updates.characters = updatedChars;
      }
      onChange(updates);
    },
    [scenes, activeScene, onChange]  // session intentionally excluded — read via ref
  );

  return (
    <div className="main-board">
      {/* Scene Navbar */}
      <div className="main-board__navbar">
        <div className="main-board__tabs">
          {scenes.map((scene) => (
            <div
              key={scene.id}
              className={`main-board__tab ${activeId === scene.id ? "main-board__tab--active" : ""}`}
              onClick={() => { if (editingId !== scene.id) setActiveId(scene.id); }}
            >
              {editingId === scene.id ? (
                <input
                  className="main-board__tab-input"
                  value={editingName}
                  autoFocus
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={() => commitRename(scene.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename(scene.id);
                    if (e.key === "Escape") setEditingId(null);
                    e.stopPropagation();
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span
                  className="main-board__tab-label"
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEditingId(scene.id);
                    setEditingName(scene.name);
                  }}
                >
                  {scene.name}
                </span>
              )}
              <button
                className="main-board__tab-close"
                onClick={(e) => { e.stopPropagation(); removeScene(scene.id); }}
                title="Remove scene"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button className="main-board__add-scene" onClick={addScene} title="Add scene">
          + Scene
        </button>
      </div>

      {/* Board Content */}
      <div className="main-board__content">
        {activeScene ? (
          <BoardCanvas
            scene={activeScene}
            onToggleExpand={toggleExpand}
            onRemove={removeItem}
            onUpdateSnapshot={updateItemSnapshot}
          />
        ) : (
          <p className="main-board__empty-hint">
            No scenes yet — click <strong>+ Scene</strong> to add one.
          </p>
        )}
      </div>
    </div>
  );
}
