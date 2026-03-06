import { MongoClient, Db, Collection } from "mongodb";
import { Character, CreateCharacterInput, UpdateCharacterInput } from "../models/Character";
import { CharacterRepository } from "./characterRepository";
import { v4 as uuidv4 } from "uuid";

export class MongoCharacterRepository implements CharacterRepository {
  private collection: Collection<Character>;

  constructor(db: Db) {
    this.collection = db.collection<Character>("characters");
  }

  async getAll(): Promise<Character[]> {
    return this.collection.find({}).toArray();
  }

  async getById(id: string): Promise<Character | null> {
    return this.collection.findOne({ id });
  }

  async create(input: CreateCharacterInput): Promise<Character> {
    const character: Character = { ...input, id: uuidv4() };
    await this.collection.insertOne(character);
    return character;
  }

  async update(id: string, input: UpdateCharacterInput): Promise<Character | null> {
    const existing = await this.getById(id);
    if (!existing) return null;
    
    const updated: Character = { ...existing, ...input };
    await this.collection.updateOne({ id }, { $set: updated });
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.collection.deleteOne({ id });
    return result.deletedCount > 0;
  }
}
