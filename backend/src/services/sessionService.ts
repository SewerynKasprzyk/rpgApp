import { Session, CreateSessionInput, UpdateSessionInput } from "@rpg/shared";
import { getSessionRepository, getCharacterRepository } from "../repositories/repositoryFactory";
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

    // Sync session character changes back to their character documents
    if (input.characters) {
      const charRepo = getCharacterRepository();
      await Promise.all(
        input.characters.map(async (sc) => {
          const updated = await charRepo.update(sc.characterId, {
            themeCards: sc.themeCards,
            currentStatuses: sc.currentStatuses,
            sectionQuestCheckboxes: sc.sectionQuestCheckboxes,
            backpackTags: sc.backpackTags,
            companions: sc.companions,
            relationshipTags: sc.relationshipTags,
          });
          if (updated) {
            gateway.broadcastCharacterUpdated(updated);
          }
        })
      );
    }
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
