import { Character, CreateCharacterInput, UpdateCharacterInput } from "../models/Character";

export interface CharacterRepository {
  getAll(): Promise<Character[]>;
  getById(id: string): Promise<Character | null>;
  create(input: CreateCharacterInput): Promise<Character>;
  update(id: string, input: UpdateCharacterInput): Promise<Character | null>;
  delete(id: string): Promise<boolean>;
}
