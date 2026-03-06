import { Character } from "../types/Character";

export type CharacterEventType =
  | "character_created"
  | "character_updated"
  | "character_deleted";

export interface CharacterCreatedEvent {
  type: "character_created";
  character: Character;
}

export interface CharacterUpdatedEvent {
  type: "character_updated";
  character: Character;
}

export interface CharacterDeletedEvent {
  type: "character_deleted";
  characterId: string;
}

export type CharacterEvent =
  | CharacterCreatedEvent
  | CharacterUpdatedEvent
  | CharacterDeletedEvent;
