import { Character, CreateCharacterInput, UpdateCharacterInput } from "../models/Character";
import { CharacterRepository } from "./characterRepository";
import db from "../mocks/mockDatabase";

let nextId = 100;

export class InMemoryCharacterRepository implements CharacterRepository {
  async getAll(): Promise<Character[]> {
    return Array.from(db.characters.values());
  }

  async getById(id: string): Promise<Character | null> {
    return db.characters.get(id) ?? null;
  }

  async create(input: CreateCharacterInput): Promise<Character> {
    const character: Character = {
      ...input,
      id: `char-${nextId++}`,
    };
    db.characters.set(character.id, character);
    return character;
  }

  async update(id: string, input: UpdateCharacterInput): Promise<Character | null> {
    const existing = db.characters.get(id);
    if (!existing) return null;
    const updated: Character = { ...existing, ...input };
    db.characters.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return db.characters.delete(id);
  }
}
