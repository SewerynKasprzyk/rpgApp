import { Db, Collection } from "mongodb";
import { ThreatGroup, CreateThreatGroupInput, UpdateThreatGroupInput } from "../models/ThreatGroup";
import { ThreatGroupRepository } from "./threatGroupRepository";
import { v4 as uuidv4 } from "uuid";

export class MongoThreatGroupRepository implements ThreatGroupRepository {
  private collection: Collection<ThreatGroup>;

  constructor(db: Db) {
    this.collection = db.collection<ThreatGroup>("threatGroups");
  }

  async getAll(): Promise<ThreatGroup[]> {
    return this.collection.find({}).toArray();
  }

  async getById(id: string): Promise<ThreatGroup | null> {
    return this.collection.findOne({ id });
  }

  async create(input: CreateThreatGroupInput): Promise<ThreatGroup> {
    const group: ThreatGroup = { ...input, id: uuidv4() };
    await this.collection.insertOne(group);
    return group;
  }

  async update(id: string, input: UpdateThreatGroupInput): Promise<ThreatGroup | null> {
    const existing = await this.getById(id);
    if (!existing) return null;
    const updated: ThreatGroup = { ...existing, ...input };
    await this.collection.updateOne({ id }, { $set: updated });
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.collection.deleteOne({ id });
    return result.deletedCount > 0;
  }
}
