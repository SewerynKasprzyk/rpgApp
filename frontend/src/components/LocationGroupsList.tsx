import React, { useState, useRef, useEffect } from "react";
import { LocationGroup } from "@rpg/shared";

interface Props {
  groups: LocationGroup[];
  selectedGroupId: string | null;
  selectedLocationId: string | null;
  autoEditGroupId?: string | null;
  onSelectGroup: (id: string) => void;
  onAdd: () => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onSelectLocation: (groupId: string, locationId: string) => void;
  onAddLocation: (groupId: string) => void;
  onDeleteLocation: (groupId: string, locationId: string) => void;
  style?: React.CSSProperties;
}

export default function LocationGroupsSidebar({
  groups,
  selectedGroupId,
  selectedLocationId,
  autoEditGroupId,
  onSelectGroup,
  onAdd,
  onRename,
  onDelete,
  onSelectLocation,
  onAddLocation,
  onDeleteLocation,
  style,
}: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const clickTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    if (autoEditGroupId) {
      setEditingGroupId(autoEditGroupId);
      setExpandedGroups(prev => new Set([...prev, autoEditGroupId]));
    }
  }, [autoEditGroupId]);

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleGroupClick = (id: string) => {
    if (clickTimers.current[id]) {
      clearTimeout(clickTimers.current[id]);
      delete clickTimers.current[id];
      setEditingGroupId(id);
    } else {
      clickTimers.current[id] = setTimeout(() => {
        delete clickTimers.current[id];
        onSelectGroup(id);
        toggleGroup(id);
      }, 250);
    }
  };

  return (
    <aside
      className={`threats-sidebar ${sidebarOpen ? "threats-sidebar--open" : ""}`}
      style={{ alignSelf: "stretch", height: "100%", ...style }}
      onClick={!sidebarOpen ? () => setSidebarOpen(true) : undefined}
    >
      {!sidebarOpen && (
        <span className="threats-sidebar__vertical-label">GROUPS</span>
      )}
      {sidebarOpen && (
        <button
          className="threats-sidebar__close"
          onClick={e => { e.stopPropagation(); setSidebarOpen(false); }}
        >
          ✕
        </button>
      )}
      <div className="threats-sidebar__list">
        {sidebarOpen && (
          <>
            {groups.map(group => {
              const isExpanded = expandedGroups.has(group.id);
              const isActiveGroup = selectedGroupId === group.id;
              return (
                <div key={group.id} className="tg-group">
                  <div
                    className={`tg-group__header${isActiveGroup ? " tg-group__header--active" : ""}`}
                    onClick={() => handleGroupClick(group.id)}
                  >
                    {editingGroupId === group.id ? (
                      <input
                        className="tg-group__name-input"
                        value={group.name}
                        placeholder="Group name"
                        autoFocus
                        onChange={e => onRename(group.id, e.target.value)}
                        onClick={e => e.stopPropagation()}
                        onBlur={() => setEditingGroupId(null)}
                        onKeyDown={e => { if (e.key === "Enter" || e.key === "Escape") setEditingGroupId(null); }}
                      />
                    ) : (
                      <span className="tg-group__name-label">
                        {group.name || <span style={{ color: "var(--muted)", fontStyle: "italic" }}>Group name</span>}
                      </span>
                    )}
                    <button
                      className="status-box__remove"
                      onClick={e => { e.stopPropagation(); onDelete(group.id); }}
                      title="Remove group"
                    >
                      ×
                    </button>
                  </div>

                  <div className={`tg-group__threats${isExpanded ? " tg-group__threats--open" : ""}`}>
                    <div className="tg-group__threats__inner">
                      {group.locations.map(loc => (
                        <div
                          key={loc.id}
                          className={`tg-threat-item${selectedLocationId === loc.id && isActiveGroup ? " tg-threat-item--active" : ""}`}
                          onClick={e => { e.stopPropagation(); onSelectLocation(group.id, loc.id); }}
                        >
                          <div className="tg-loc-item__portrait">
                            {loc.portraitUrl
                              ? <img src={loc.portraitUrl} alt={loc.name} className="tg-loc-item__portrait-img" />
                              : <span className="tg-threat-item__portrait-placeholder">🗺</span>
                            }
                          </div>
                          <span className="tg-threat-item__name">{loc.name || "Unnamed"}</span>
                          <button
                            className="status-box__remove"
                            onClick={e => { e.stopPropagation(); onDeleteLocation(group.id, loc.id); }}
                            title="Remove location"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="add-slot-btn tg-group__add-threat"
                        onClick={e => { e.stopPropagation(); onAddLocation(group.id); }}
                      >
                        + Add Location
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            <button type="button" className="add-slot-btn" onClick={e => { e.stopPropagation(); onAdd(); }}>
              + Add Group
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
