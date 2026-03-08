import { ThreatGroup, CreateThreatGroupInput, UpdateThreatGroupInput } from "../models/ThreatGroup";

export interface ThreatGroupRepository {
  getAll(): Promise<ThreatGroup[]>;
  getById(id: string): Promise<ThreatGroup | null>;
  create(input: CreateThreatGroupInput): Promise<ThreatGroup>;
  update(id: string, input: UpdateThreatGroupInput): Promise<ThreatGroup | null>;
  delete(id: string): Promise<boolean>;
}
