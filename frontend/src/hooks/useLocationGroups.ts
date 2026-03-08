import { useState, useEffect, useCallback } from "react";
import { LocationGroup, CreateLocationGroupInput, UpdateLocationGroupInput } from "@rpg/shared";
import * as api from "../services/apiClient";

export function useLocationGroups() {
  const [groups, setGroups] = useState<LocationGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.fetchLocationGroups();
      setGroups(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch location groups");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = async (input: CreateLocationGroupInput) => {
    const created = await api.createLocationGroup(input);
    setGroups((prev) => [...prev, created]);
    return created;
  };

  const update = async (id: string, input: UpdateLocationGroupInput) => {
    const updated = await api.updateLocationGroup(id, input);
    setGroups((prev) => prev.map((g) => (g.id === id ? updated : g)));
    return updated;
  };

  const optimisticUpdate = (id: string, patch: Partial<LocationGroup>) => {
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  };

  const remove = async (id: string) => {
    await api.deleteLocationGroup(id);
    setGroups((prev) => prev.filter((g) => g.id !== id));
  };

  return { groups, loading, error, refresh, create, update, optimisticUpdate, remove };
}
