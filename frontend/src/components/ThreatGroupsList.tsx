import React, { useState, useRef, useEffect } from "react";
import { ThreatGroup } from "@rpg/shared";

interface Props {
  groups: ThreatGroup[];
  selectedGroupId: string | null;
  selectedThreatId: string | null;
  autoEditGroupId?: string | null;
  onSelectGroup: (id: string) => void;
  onAdd: () => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onSelectThreat: (groupId: string, threatId: string) => void;
  onAddThreat: (groupId: string) => void;
  onDeleteThreat: (groupId: string, threatId: string) => void;
  style?: React.CSSProperties;
}

export default function ThreatGroupsSidebar({
  groups,
  selectedGroupId,
  selectedThreatId,
  autoEditGroupId,
  onSelectGroup,
  onAdd,
  onRename,
  onDelete,
  onSelectThreat,
  onAddThreat,
  onDeleteThreat,
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
                      {group.threats.map(threat => (
                        <div
                          key={threat.id}
                          className={`tg-threat-item${selectedThreatId === threat.id && isActiveGroup ? " tg-threat-item--active" : ""}`}
                          onClick={e => { e.stopPropagation(); onSelectThreat(group.id, threat.id); }}
                        >
                          <div className="tg-threat-item__portrait">
                            {threat.portraitUrl
                              ? <img src={threat.portraitUrl} alt={threat.name} className="tg-threat-item__portrait-img" />
                              : <span className="tg-threat-item__portrait-placeholder">👤</span>
                            }
                          </div>
                          <span className="tg-threat-item__name">{threat.name || "Unnamed"}</span>
                          <button
                            className="status-box__remove"
                            onClick={e => { e.stopPropagation(); onDeleteThreat(group.id, threat.id); }}
                            title="Remove threat"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="add-slot-btn tg-group__add-threat"
                        onClick={e => { e.stopPropagation(); onAddThreat(group.id); }}
                      >
                        + Add Threat
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
