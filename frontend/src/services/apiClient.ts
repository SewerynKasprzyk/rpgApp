import { Character, CreateCharacterInput, UpdateCharacterInput, Session, CreateSessionInput, UpdateSessionInput } from "@rpg/shared";

const BASE = `${import.meta.env.VITE_API_URL ?? "http://localhost:3001"}/api`;

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed with status ${res.status}`);
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
