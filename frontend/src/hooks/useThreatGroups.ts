import { useState, useEffect, useCallback } from "react";
import { ThreatGroup, CreateThreatGroupInput, UpdateThreatGroupInput } from "@rpg/shared";
import * as api from "../services/apiClient";

export function useThreatGroups() {
  const [groups, setGroups] = useState<ThreatGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.fetchThreatGroups();
      setGroups(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch threat groups");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = async (input: CreateThreatGroupInput) => {
    const created = await api.createThreatGroup(input);
    setGroups((prev) => [...prev, created]);
    return created;
  };

  const update = async (id: string, input: UpdateThreatGroupInput) => {
    const updated = await api.updateThreatGroup(id, input);
    setGroups((prev) => prev.map((g) => (g.id === id ? updated : g)));
    return updated;
  };

  /** Update local state immediately without an API call (for debounced edits). */
  const optimisticUpdate = (id: string, patch: Partial<ThreatGroup>) => {
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  };

  const remove = async (id: string) => {
    await api.deleteThreatGroup(id);
    setGroups((prev) => prev.filter((g) => g.id !== id));
  };

  return { groups, loading, error, refresh, create, update, optimisticUpdate, remove };
}
