import { Campaign, CreateCampaignInput, UpdateCampaignInput } from "../models/Campaign";

export interface CampaignRepository {
  getAll(): Promise<Campaign[]>;
  getById(id: string): Promise<Campaign | null>;
  create(input: CreateCampaignInput): Promise<Campaign>;
  update(id: string, input: UpdateCampaignInput): Promise<Campaign | null>;
  delete(id: string): Promise<boolean>;
}
