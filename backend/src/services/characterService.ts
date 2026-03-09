import { Character, CreateCharacterInput, UpdateCharacterInput } from "@rpg/shared";
import { getCharacterRepository, getSessionRepository } from "../repositories/repositoryFactory";
import { RealtimeGateway, MockRealtimeGateway } from "../realtime/realtimeGateway";

let gateway: RealtimeGateway = new MockRealtimeGateway();

export function setRealtimeGateway(g: RealtimeGateway) {
  gateway = g;
}

export async function getAllCharacters(): Promise<Character[]> {
  return getCharacterRepository().getAll();
}

export async function getCharacterById(id: string): Promise<Character | null> {
  return getCharacterRepository().getById(id);
}

export async function createCharacter(input: CreateCharacterInput): Promise<Character> {
  const character = await getCharacterRepository().create(input);
  gateway.broadcastCharacterCreated(character);
  return character;
}

export async function updateCharacter(
  id: string,
  input: UpdateCharacterInput
): Promise<Character | null> {
  const updated = await getCharacterRepository().update(id, input);
  if (updated) {
    gateway.broadcastCharacterUpdated(updated);

    // Propagate relevant character fields into any session snapshots
    const sessionRepo = getSessionRepository();
    const allSessions = await sessionRepo.getAll();
    await Promise.all(
      allSessions
        .filter((s) => s.characters.some((c) => c.characterId === id))
        .map(async (session) => {
          const patchedSession = await sessionRepo.update(session.id, {
            characters: session.characters.map((sc) =>
              sc.characterId === id
                ? {
                    ...sc,
                    name: updated.name ?? sc.name,
                    portraitUrl: updated.portraitUrl ?? sc.portraitUrl,
                    themeCards: updated.themeCards ?? sc.themeCards,
                    sceneStatuses: updated.sceneStatuses ?? sc.sceneStatuses,
                    currentStatuses: updated.currentStatuses ?? sc.currentStatuses,
                    sectionQuestCheckboxes: updated.sectionQuestCheckboxes ?? sc.sectionQuestCheckboxes,
                    companions: updated.companions ?? sc.companions,
                    relationshipTags: updated.relationshipTags ?? sc.relationshipTags,
                  }
                : sc
            ),
          });
          if (patchedSession) {
            gateway.broadcastSessionUpdated(patchedSession);
          }
        })
    );
  }
  return updated;
}

export async function deleteCharacter(id: string): Promise<boolean> {
  const deleted = await getCharacterRepository().delete(id);
  if (deleted) {
    gateway.broadcastCharacterDeleted(id);
  }
  return deleted;
}
