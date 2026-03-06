export interface Campaign {
  id: string;
  name: string;
  description: string;
  playerIds: string[];
}

export type CreateCampaignInput = Omit<Campaign, "id">;
export type UpdateCampaignInput = Partial<Omit<Campaign, "id">>;
