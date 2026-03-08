import { CreateLocationGroupInput, UpdateLocationGroupInput } from "@rpg/shared";
import { getLocationGroupRepository } from "../repositories/repositoryFactory";

export async function getAllLocationGroups() {
  return getLocationGroupRepository().getAll();
}

export async function getLocationGroupById(id: string) {
  return getLocationGroupRepository().getById(id);
}

export async function createLocationGroup(input: CreateLocationGroupInput) {
  return getLocationGroupRepository().create(input);
}

export async function updateLocationGroup(id: string, input: UpdateLocationGroupInput) {
  return getLocationGroupRepository().update(id, input);
}

export async function deleteLocationGroup(id: string) {
  return getLocationGroupRepository().delete(id);
}
