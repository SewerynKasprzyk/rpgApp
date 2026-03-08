import { StatusTag, ThemeCard, QuestCheckboxes } from "./Character";

/** A character snapshot shown in the session (Section 3) */
export interface SessionCharacter {
  characterId: string;
  name: string;
  portraitUrl: string;
  themeCards: [ThemeCard, ThemeCard, ThemeCard, ThemeCard];
  currentStatuses: StatusTag[];
  sectionQuestCheckboxes: QuestCheckboxes;
  backpackTags: string[];
  companions: string[];
  relationshipTags: string[];
}

/** Enemy entity in the session (Section 4) */
export interface SessionEnemy {
  id: string;
  name: string;
  statuses: StatusTag[];
}

/** Neutral character in the session (Section 5) */
export interface SessionNeutral {
  id: string;
  name: string;
  statuses: StatusTag[];
}

/** Dice roll result record */
export interface DiceRollResult {
  die1: number;
  die2: number;
  total: number;
  timestamp: number;
}

export interface Session {
  id: string;
  name: string;
  description: string;
  characters: SessionCharacter[];
  enemies: SessionEnemy[];
  neutrals: SessionNeutral[];
  diceHistory: DiceRollResult[];
  createdAt: number;
}

export type CreateSessionInput = Omit<Session, "id" | "createdAt">;
export type UpdateSessionInput = Partial<Omit<Session, "id" | "createdAt">>;
