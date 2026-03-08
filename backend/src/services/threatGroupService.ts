import { ThreatGroup, CreateThreatGroupInput, UpdateThreatGroupInput } from "@rpg/shared";
import { getThreatGroupRepository } from "../repositories/repositoryFactory";

export async function getAllThreatGroups(): Promise<ThreatGroup[]> {
  return getThreatGroupRepository().getAll();
}

export async function getThreatGroupById(id: string): Promise<ThreatGroup | null> {
  return getThreatGroupRepository().getById(id);
}

export async function createThreatGroup(input: CreateThreatGroupInput): Promise<ThreatGroup> {
  return getThreatGroupRepository().create(input);
}

export async function updateThreatGroup(
  id: string,
  input: UpdateThreatGroupInput
): Promise<ThreatGroup | null> {
  return getThreatGroupRepository().update(id, input);
}

export async function deleteThreatGroup(id: string): Promise<boolean> {
  return getThreatGroupRepository().delete(id);
}
