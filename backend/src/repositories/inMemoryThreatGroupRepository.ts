import { ThreatGroup, CreateThreatGroupInput, UpdateThreatGroupInput } from "../models/ThreatGroup";
import { ThreatGroupRepository } from "./threatGroupRepository";
import { v4 as uuidv4 } from "uuid";

export class InMemoryThreatGroupRepository implements ThreatGroupRepository {
  private store = new Map<string, ThreatGroup>();

  async getAll(): Promise<ThreatGroup[]> {
    return Array.from(this.store.values());
  }

  async getById(id: string): Promise<ThreatGroup | null> {
    return this.store.get(id) ?? null;
  }

  async create(input: CreateThreatGroupInput): Promise<ThreatGroup> {
    const group: ThreatGroup = { ...input, id: uuidv4() };
    this.store.set(group.id, group);
    return group;
  }

  async update(id: string, input: UpdateThreatGroupInput): Promise<ThreatGroup | null> {
    const existing = this.store.get(id);
    if (!existing) return null;
    const updated: ThreatGroup = { ...existing, ...input };
    this.store.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.store.delete(id);
  }
}
