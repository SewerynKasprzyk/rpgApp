import React, { useState, useRef } from "react";
import { v4 as uuid } from "uuid";
import { Threat } from "@rpg/shared";
import ThreatGroupsSidebar from "../components/ThreatGroupsList";
import ThreatEditor from "../components/ThreatEditor";
import { useThreatGroups } from "../hooks/useThreatGroups";

const emptyThreat = (): Threat => ({
  id: uuid(),
  name: "",
  portraitUrl: "",
  limits: [],
  tags: [],
  statuses: [],
  moves: [],
});

export default function Threats() {
  const { groups, loading, create, update, optimisticUpdate, remove } = useThreatGroups();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedThreatId, setSelectedThreatId] = useState<string | null>(null);
  const [autoEditGroupId, setAutoEditGroupId] = useState<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleAddGroup = async () => {
    const created = await create({ name: "", threats: [] });
    setSelectedGroupId(created.id);
    setSelectedThreatId(null);
    setAutoEditGroupId(created.id);
  };

  const handleRenameGroup = (id: string, name: string) => {
    optimisticUpdate(id, { name });
    update(id, { name });
  };

  const handleDeleteGroup = async (id: string) => {
    await remove(id);
    if (selectedGroupId === id) { setSelectedGroupId(null); setSelectedThreatId(null); }
  };

  const handleSelectThreat = (groupId: string, threatId: string) => {
    setSelectedGroupId(groupId);
    setSelectedThreatId(threatId);
  };

  const handleAddThreat = (groupId: string) => {
    const t = emptyThreat();
    const group = groups.find(g => g.id === groupId)!;
    const updatedThreats = [...group.threats, t];
    optimisticUpdate(groupId, { threats: updatedThreats });
    update(groupId, { threats: updatedThreats });
    setSelectedGroupId(groupId);
    setSelectedThreatId(t.id);
  };

  const handleDeleteThreat = (groupId: string, threatId: string) => {
    const group = groups.find(g => g.id === groupId)!;
    const updatedThreats = group.threats.filter(t => t.id !== threatId);
    optimisticUpdate(groupId, { threats: updatedThreats });
    update(groupId, { threats: updatedThreats });
    if (selectedThreatId === threatId) setSelectedThreatId(null);
  };

  const handleThreatChange = (updated: Threat) => {
    if (!selectedGroupId) return;
    const group = groups.find(g => g.id === selectedGroupId)!;
    const updatedThreats = group.threats.map(t => t.id === updated.id ? updated : t);
    optimisticUpdate(selectedGroupId, { threats: updatedThreats });
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      update(selectedGroupId, { threats: updatedThreats });
    }, 800);
  };

  const selectedGroup = groups.find(g => g.id === selectedGroupId);
  const selectedThreat = selectedGroup?.threats.find(t => t.id === selectedThreatId);

  return (
    <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
      <div className="session-detail__layout" style={{ display: "flex", flex: 1, alignItems: "stretch", minHeight: 0 }}>
        <ThreatGroupsSidebar
          groups={groups}
          selectedGroupId={selectedGroupId}
          selectedThreatId={selectedThreatId}
          autoEditGroupId={autoEditGroupId}
          onSelectGroup={(id) => { setSelectedGroupId(id); setSelectedThreatId(null); }}
          onAdd={handleAddGroup}
          onRename={handleRenameGroup}
          onDelete={handleDeleteGroup}
          onSelectThreat={handleSelectThreat}
          onAddThreat={handleAddThreat}
          onDeleteThreat={handleDeleteThreat}
          style={{ flex: "0 0 auto" }}
        />
        <div className="session-detail__main" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {loading ? (
            <div className="section" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <p style={{ color: "var(--muted)" }}>Loading...</p>
            </div>
          ) : selectedThreat ? (
            <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
              <ThreatEditor threat={selectedThreat} onChange={handleThreatChange} />
            </div>
          ) : (
            <div className="section" style={{ flex: 1, display: "flex", flexDirection: "column"}}>
              <p style={{ color: "var(--muted)" }}>
                {groups.length === 0
                  ? "Add a group from the sidebar to get started."
                  : "Select or add a threat from the sidebar."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
