import { Db, Collection } from "mongodb";
import { Campaign, CreateCampaignInput, UpdateCampaignInput } from "../models/Campaign";
import { CampaignRepository } from "./campaignRepository";
import { v4 as uuidv4 } from "uuid";

export class MongoCampaignRepository implements CampaignRepository {
  private collection: Collection<Campaign>;

  constructor(db: Db) {
    this.collection = db.collection<Campaign>("campaigns");
  }

  async getAll(): Promise<Campaign[]> {
    return this.collection.find({}).toArray();
  }

  async getById(id: string): Promise<Campaign | null> {
    return this.collection.findOne({ id });
  }

  async create(input: CreateCampaignInput): Promise<Campaign> {
    const campaign: Campaign = { ...input, id: uuidv4() };
    await this.collection.insertOne(campaign);
    return campaign;
  }

  async update(id: string, input: UpdateCampaignInput): Promise<Campaign | null> {
    const existing = await this.getById(id);
    if (!existing) return null;
    
    const updated: Campaign = { ...existing, ...input };
    await this.collection.updateOne({ id }, { $set: updated });
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.collection.deleteOne({ id });
    return result.deletedCount > 0;
  }
}
