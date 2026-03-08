import { v4 as uuid } from "uuid";
import { Db } from "mongodb";
import { LocationGroup, CreateLocationGroupInput, UpdateLocationGroupInput } from "@rpg/shared";
import { LocationGroupRepository } from "./locationGroupRepository";

export class MongoLocationGroupRepository implements LocationGroupRepository {
  private col;

  constructor(db: Db) {
    this.col = db.collection<LocationGroup>("locationGroups");
  }

  async getAll(): Promise<LocationGroup[]> {
    const docs = await this.col.find({}).toArray();
    return docs.map(({ _id, ...rest }) => rest as LocationGroup);
  }

  async getById(id: string): Promise<LocationGroup | null> {
    const doc = await this.col.findOne({ id });
    if (!doc) return null;
    const { _id, ...rest } = doc;
    return rest as LocationGroup;
  }

  async create(input: CreateLocationGroupInput): Promise<LocationGroup> {
    const group: LocationGroup = { id: uuid(), ...input };
    await this.col.insertOne({ ...group } as any);
    return group;
  }

  async update(id: string, input: UpdateLocationGroupInput): Promise<LocationGroup | null> {
    const result = await this.col.findOneAndUpdate(
      { id },
      { $set: input },
      { returnDocument: "after" }
    );
    if (!result) return null;
    const { _id, ...rest } = result as any;
    return rest as LocationGroup;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.col.deleteOne({ id });
    return result.deletedCount > 0;
  }
}
