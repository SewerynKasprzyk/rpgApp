import { useState, useEffect, useCallback } from "react";
import { Session, CreateSessionInput } from "@rpg/shared";
import * as api from "../services/apiClient";
import { useRealtimeSessions } from "./useRealtimeSessions";

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useRealtimeSessions(setSessions);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.fetchSessions();
      setSessions(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch sessions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = async (input: CreateSessionInput) => {
    const created = await api.createSession(input);
    setSessions((prev) => [...prev, created]);
    return created;
  };

  const remove = async (id: string) => {
    await api.deleteSession(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  return { sessions, loading, error, refresh, create, remove };
}
