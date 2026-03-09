import { Session, CreateSessionInput, UpdateSessionInput } from "@rpg/shared";
import { getSessionRepository } from "../repositories/repositoryFactory";
import { RealtimeGateway, MockRealtimeGateway } from "../realtime/realtimeGateway";

let gateway: RealtimeGateway = new MockRealtimeGateway();

export function setSessionRealtimeGateway(g: RealtimeGateway) {
  gateway = g;
}

export async function getAllSessions(): Promise<Session[]> {
  return getSessionRepository().getAll();
}

export async function getSessionById(id: string): Promise<Session | null> {
  return getSessionRepository().getById(id);
}

export async function createSession(input: CreateSessionInput): Promise<Session> {
  const session = await getSessionRepository().create(input);
  gateway.broadcastSessionCreated(session);
  return session;
}

export async function updateSession(
  id: string,
  input: UpdateSessionInput
): Promise<Session | null> {
  const updated = await getSessionRepository().update(id, input);
  if (updated) {
    gateway.broadcastSessionUpdated(updated);
    // Character-specific fields are synced back to character DB by the
    // client (flushCharSave) and propagated here via characterService.
    // Doing it here too would create a destructive write-back loop that
    // races with character-editor saves and overwrites fresh data.
  }
  return updated;
}

export async function deleteSession(id: string): Promise<boolean> {
  const deleted = await getSessionRepository().delete(id);
  if (deleted) {
    gateway.broadcastSessionDeleted(id);
  }
  return deleted;
}
