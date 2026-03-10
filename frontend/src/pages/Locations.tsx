import React, { useState, useRef } from "react";
import { v4 as uuid } from "uuid";
import { Location } from "@rpg/shared";
import LocationGroupsSidebar from "../components/LocationGroupsList";
import LocationEditor from "../components/LocationEditor";
import { useLocationGroups } from "../hooks/useLocationGroups";

const emptyLocation = (): Location => ({
  id: uuid(),
  name: "",
  portraitUrl: "",
  description: "",
  statuses: [],
  tags: [],
  boxes: [],
});

export default function Locations() {
  const { groups, loading, create, update, optimisticUpdate, remove } = useLocationGroups();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [autoEditGroupId, setAutoEditGroupId] = useState<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleAddGroup = async () => {
    const created = await create({ name: "", locations: [] });
    setSelectedGroupId(created.id);
    setSelectedLocationId(null);
    setAutoEditGroupId(created.id);
  };

  const handleRenameGroup = (id: string, name: string) => {
    optimisticUpdate(id, { name });
    update(id, { name });
  };

  const handleDeleteGroup = async (id: string) => {
    await remove(id);
    if (selectedGroupId === id) { setSelectedGroupId(null); setSelectedLocationId(null); }
  };

  const handleSelectLocation = (groupId: string, locationId: string) => {
    setSelectedGroupId(groupId);
    setSelectedLocationId(locationId);
  };

  const handleAddLocation = (groupId: string) => {
    const loc = emptyLocation();
    const group = groups.find(g => g.id === groupId)!;
    const updatedLocations = [...group.locations, loc];
    optimisticUpdate(groupId, { locations: updatedLocations });
    update(groupId, { locations: updatedLocations });
    setSelectedGroupId(groupId);
    setSelectedLocationId(loc.id);
  };

  const handleDeleteLocation = (groupId: string, locationId: string) => {
    const group = groups.find(g => g.id === groupId)!;
    const updatedLocations = group.locations.filter(l => l.id !== locationId);
    optimisticUpdate(groupId, { locations: updatedLocations });
    update(groupId, { locations: updatedLocations });
    if (selectedLocationId === locationId) setSelectedLocationId(null);
  };

  const handleLocationChange = (updated: Location) => {
    if (!selectedGroupId) return;
    const group = groups.find(g => g.id === selectedGroupId)!;
    const updatedLocations = group.locations.map(l => l.id === updated.id ? updated : l);
    optimisticUpdate(selectedGroupId, { locations: updatedLocations });
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      update(selectedGroupId, { locations: updatedLocations });
    }, 800);
  };

  const selectedGroup = groups.find(g => g.id === selectedGroupId);
  const selectedLocation = selectedGroup?.locations.find(l => l.id === selectedLocationId);

  return (
    <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
      <div className="session-detail__layout" style={{ display: "flex", flex: 1, alignItems: "stretch", minHeight: 0 }}>
        <LocationGroupsSidebar
          groups={groups}
          selectedGroupId={selectedGroupId}
          selectedLocationId={selectedLocationId}
          autoEditGroupId={autoEditGroupId}
          onSelectGroup={id => { setSelectedGroupId(id); setSelectedLocationId(null); }}
          onAdd={handleAddGroup}
          onRename={handleRenameGroup}
          onDelete={handleDeleteGroup}
          onSelectLocation={handleSelectLocation}
          onAddLocation={handleAddLocation}
          onDeleteLocation={handleDeleteLocation}
          style={{ flex: "0 0 auto" }}
        />
        <div className="session-detail__main" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {loading ? (
            <div className="section" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <p style={{ color: "var(--muted)" }}>Loading…</p>
            </div>
          ) : selectedLocation ? (
            <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
              <LocationEditor location={selectedLocation} onChange={handleLocationChange} />
            </div>
          ) : (
            <div className="section" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <p style={{ color: "var(--muted)" }}>
                {groups.length === 0
                  ? "Add a group from the sidebar to get started."
                  : "Select or add a location from the sidebar."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
