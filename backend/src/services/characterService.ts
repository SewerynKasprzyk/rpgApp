import { Character, CreateCharacterInput, UpdateCharacterInput } from "@rpg/shared";
import { getCharacterRepository } from "../repositories/repositoryFactory";
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
