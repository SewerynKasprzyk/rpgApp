import { v4 as uuid } from "uuid";
import { LocationGroup, CreateLocationGroupInput, UpdateLocationGroupInput } from "@rpg/shared";
import { LocationGroupRepository } from "./locationGroupRepository";

export class InMemoryLocationGroupRepository implements LocationGroupRepository {
  private store = new Map<string, LocationGroup>();

  async getAll(): Promise<LocationGroup[]> {
    return Array.from(this.store.values());
  }

  async getById(id: string): Promise<LocationGroup | null> {
    return this.store.get(id) ?? null;
  }

  async create(input: CreateLocationGroupInput): Promise<LocationGroup> {
    const group: LocationGroup = { id: uuid(), ...input };
    this.store.set(group.id, group);
    return group;
  }

  async update(id: string, input: UpdateLocationGroupInput): Promise<LocationGroup | null> {
    const existing = this.store.get(id);
    if (!existing) return null;
    const updated: LocationGroup = { ...existing, ...input };
    this.store.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.store.delete(id);
  }
}
