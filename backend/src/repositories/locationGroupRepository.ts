import { LocationGroup, CreateLocationGroupInput, UpdateLocationGroupInput } from "@rpg/shared";

export interface LocationGroupRepository {
  getAll(): Promise<LocationGroup[]>;
  getById(id: string): Promise<LocationGroup | null>;
  create(input: CreateLocationGroupInput): Promise<LocationGroup>;
  update(id: string, input: UpdateLocationGroupInput): Promise<LocationGroup | null>;
  delete(id: string): Promise<boolean>;
}
