import { Campaign, CreateCampaignInput, UpdateCampaignInput } from "../models/Campaign";
import { CampaignRepository } from "./campaignRepository";
import db from "../mocks/mockDatabase";

let nextId = 100;

export class InMemoryCampaignRepository implements CampaignRepository {
  async getAll(): Promise<Campaign[]> {
    return Array.from(db.campaigns.values());
  }

  async getById(id: string): Promise<Campaign | null> {
    return db.campaigns.get(id) ?? null;
  }

  async create(input: CreateCampaignInput): Promise<Campaign> {
    const campaign: Campaign = {
      ...input,
      id: `camp-${nextId++}`,
    };
    db.campaigns.set(campaign.id, campaign);
    return campaign;
  }

  async update(id: string, input: UpdateCampaignInput): Promise<Campaign | null> {
    const existing = db.campaigns.get(id);
    if (!existing) return null;
    const updated: Campaign = { ...existing, ...input };
    db.campaigns.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return db.campaigns.delete(id);
  }
}
