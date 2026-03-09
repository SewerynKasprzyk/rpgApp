import { StatusTag, ThemeCard, QuestCheckboxes } from "./Character";

/** Source type for items placed on the scene board */
export type SceneItemSource =
  | "character"
  | "advThreat"
  | "advLocation"
  | "simpleThreat"
  | "simpleLocation"
  | "simpleElement";

/** An item placed on a scene board */
export interface SceneItem {
  instanceId: string;
  sourceType: SceneItemSource;
  sourceId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  expanded: boolean;
  /** Extra tags/statuses dropped onto this item */
  addedTags?: StatusTag[];
  addedStatuses?: string[];
  /** Snapshot of source item data at time of placement */
  snapshot: Record<string, unknown>;
}

/** A scene tab on the Main Board */
export interface BoardScene {
  id: string;
  name: string;
  items: SceneItem[];
}

/** GM Simple Panel element (Status / Tag / NPC) */
export interface GmElement {
  id: string;
  kind: "status" | "tag" | "npc";
  label: string;
  note?: string;
  checkboxCount?: number;
  portraitUrl?: string;
}

/** A character snapshot shown in the session (Section 3) */
export interface SessionCharacter {
  characterId: string;
  name: string;
  portraitUrl: string;
  themeCards: [ThemeCard, ThemeCard, ThemeCard, ThemeCard];
  sceneStatuses: { id: string; label: string }[];
  currentStatuses: StatusTag[];
  sectionQuestCheckboxes: QuestCheckboxes;
  companions?: string[];
  relationshipTags?: string[];
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
  diceHistory: DiceRollResult[];
  scenes: BoardScene[];
  gmElements?: GmElement[];
  createdAt: number;
}

export type CreateSessionInput = Omit<Session, "id" | "createdAt">;
export type UpdateSessionInput = Partial<Omit<Session, "id" | "createdAt">>;
