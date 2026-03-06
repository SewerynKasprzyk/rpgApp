import { Campaign, CreateCampaignInput, UpdateCampaignInput } from "@rpg/shared";
import { getCampaignRepository } from "../repositories/repositoryFactory";

export async function getAllCampaigns(): Promise<Campaign[]> {
  return getCampaignRepository().getAll();
}

export async function getCampaignById(id: string): Promise<Campaign | null> {
  return getCampaignRepository().getById(id);
}

export async function createCampaign(input: CreateCampaignInput): Promise<Campaign> {
  return getCampaignRepository().create(input);
}

export async function updateCampaign(
  id: string,
  input: UpdateCampaignInput
): Promise<Campaign | null> {
  return getCampaignRepository().update(id, input);
}

export async function deleteCampaign(id: string): Promise<boolean> {
  return getCampaignRepository().delete(id);
}
