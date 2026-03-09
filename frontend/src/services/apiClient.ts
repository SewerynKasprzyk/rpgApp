import { Character, CreateCharacterInput, UpdateCharacterInput, Session, CreateSessionInput, UpdateSessionInput, ThreatGroup, CreateThreatGroupInput, UpdateThreatGroupInput, LocationGroup, CreateLocationGroupInput, UpdateLocationGroupInput } from "@rpg/shared";

const BASE = `${import.meta.env.VITE_API_URL ?? "http://localhost:3001"}/api`;

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed with status ${res.status}`);
  }
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as unknown as T;
  }
  return res.json();
}

// ——— Characters ———

export async function fetchCharacters(): Promise<Character[]> {
  const res = await fetch(`${BASE}/characters`);
  return handleResponse<Character[]>(res);
}

export async function fetchCharacter(id: string): Promise<Character> {
  const res = await fetch(`${BASE}/characters/${encodeURIComponent(id)}`);
  return handleResponse<Character>(res);
}

export async function createCharacter(input: CreateCharacterInput): Promise<Character> {
  const res = await fetch(`${BASE}/characters`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse<Character>(res);
}

export async function updateCharacter(
  id: string,
  input: UpdateCharacterInput
): Promise<Character> {
  const res = await fetch(`${BASE}/characters/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse<Character>(res);
}

/**
 * Best-effort save using keepalive fetch — survives page unload / browser refresh.
 * Ignores the response (fire-and-forget).
 */
export function beaconUpdateCharacter(id: string, input: UpdateCharacterInput): void {
  fetch(`${BASE}/characters/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    keepalive: true,
  }).catch(() => {});
}

export async function deleteCharacter(id: string): Promise<void> {
  const res = await fetch(`${BASE}/characters/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  await handleResponse(res);
}

// ——— Sessions ———

export async function fetchSessions(): Promise<Session[]> {
  const res = await fetch(`${BASE}/sessions`);
  return handleResponse<Session[]>(res);
}

export async function fetchSession(id: string): Promise<Session> {
  const res = await fetch(`${BASE}/sessions/${encodeURIComponent(id)}`);
  return handleResponse<Session>(res);
}

export async function createSession(input: CreateSessionInput): Promise<Session> {
  const res = await fetch(`${BASE}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse<Session>(res);
}

export async function updateSession(
  id: string,
  input: UpdateSessionInput
): Promise<Session> {
  const res = await fetch(`${BASE}/sessions/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse<Session>(res);
}

export async function deleteSession(id: string): Promise<void> {
  const res = await fetch(`${BASE}/sessions/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  await handleResponse(res);
}

// ——— ThreatGroups ———

export async function fetchThreatGroups(): Promise<ThreatGroup[]> {
  const res = await fetch(`${BASE}/threatGroups`);
  return handleResponse<ThreatGroup[]>(res);
}

export async function fetchThreatGroup(id: string): Promise<ThreatGroup> {
  const res = await fetch(`${BASE}/threatGroups/${encodeURIComponent(id)}`);
  return handleResponse<ThreatGroup>(res);
}

export async function createThreatGroup(input: CreateThreatGroupInput): Promise<ThreatGroup> {
  const res = await fetch(`${BASE}/threatGroups`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse<ThreatGroup>(res);
}

export async function updateThreatGroup(
  id: string,
  input: UpdateThreatGroupInput
): Promise<ThreatGroup> {
  const res = await fetch(`${BASE}/threatGroups/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse<ThreatGroup>(res);
}

export async function deleteThreatGroup(id: string): Promise<void> {
  const res = await fetch(`${BASE}/threatGroups/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  await handleResponse(res);
}

// ——— LocationGroups ———

export async function fetchLocationGroups(): Promise<LocationGroup[]> {
  const res = await fetch(`${BASE}/locationGroups`);
  return handleResponse<LocationGroup[]>(res);
}

export async function fetchLocationGroup(id: string): Promise<LocationGroup> {
  const res = await fetch(`${BASE}/locationGroups/${encodeURIComponent(id)}`);
  return handleResponse<LocationGroup>(res);
}

export async function createLocationGroup(input: CreateLocationGroupInput): Promise<LocationGroup> {
  const res = await fetch(`${BASE}/locationGroups`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse<LocationGroup>(res);
}

export async function updateLocationGroup(
  id: string,
  input: UpdateLocationGroupInput
): Promise<LocationGroup> {
  const res = await fetch(`${BASE}/locationGroups/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse<LocationGroup>(res);
}

export async function deleteLocationGroup(id: string): Promise<void> {
  const res = await fetch(`${BASE}/locationGroups/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  await handleResponse(res);
}
