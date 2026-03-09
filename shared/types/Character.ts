export interface Item {
  id: string;
  name: string;
  description: string;
  quantity: number;
}

// ——— Character Sheet Types ———

export interface FellowshipTheme {
  id: string;
  text: string;
  isMarked: boolean; // battle/scratch icon red or grey
}

export interface QuestEntry {
  id: string;
  text: string;
  crossedOut: boolean;
}

export interface QuestCheckboxes {
  abandon: [boolean, boolean, boolean];
  improve: [boolean, boolean, boolean];
  milestone: [boolean, boolean, boolean];
}

export interface StatusTag {
  id: string;
  tag: string;
  note: string;
  checkboxes: [boolean, boolean, boolean, boolean, boolean, boolean];
}

export type ThemeIcon = "leaf" | "sword" | "crown" | null;

export interface Ability {
  text: string;
  isMarked: boolean;
  isCrossed?: boolean;
}

export interface ThemeCard {
  icon: ThemeIcon;
  type: string;
  abilities: (Ability | string)[];
  downsides: (Ability | string)[];
  quests: QuestEntry[];
  checkboxes: QuestCheckboxes;
}

export interface Character {
  id: string;
  name: string;
  class: string;
  level: number;
  hp: number;
  maxHp: number;
  inventory: Item[];
  campaignId: string;
  ownerId: string;

  // Hero Card
  playerName: string;
  backpackTags: string[];
  companions: string[];
  relationshipTags: string[];
  promises: [boolean, boolean, boolean, boolean, boolean];
  quintessences: string[];

  // Fellowship Theme Card + Quest (Section 1 right)
  fellowshipThemes: FellowshipTheme[];
  sectionQuests: QuestEntry[];
  sectionQuestCheckboxes: QuestCheckboxes;

  // Scene Statuses — simple label chips (Section 2a)
  sceneStatuses: { id: string; label: string }[];

  // Current Statuses — tag+note+checkboxes (Section 2b)
  currentStatuses: StatusTag[];

  // Theme Cards (Section 3)
  themeCards: [ThemeCard, ThemeCard, ThemeCard, ThemeCard];

  // Character Details (Section 4)
  history: string;
  notes: string;
  portraitUrl: string;
}

export function createDefaultCharacter(): Partial<Character> {
  return {
    playerName: "",
    backpackTags: [],
    companions: [],
    relationshipTags: [],
    promises: [false, false, false, false, false],
    quintessences: [],
    fellowshipThemes: [],
    sectionQuests: [],
    sectionQuestCheckboxes: {
      abandon: [false, false, false],
      improve: [false, false, false],
      milestone: [false, false, false],
    },
    sceneStatuses: [],
    currentStatuses: [],
    themeCards: [
      { icon: null, type: "", abilities: [], downsides: [], quests: [], checkboxes: { abandon: [false, false, false], improve: [false, false, false], milestone: [false, false, false] } },
      { icon: null, type: "", abilities: [], downsides: [], quests: [], checkboxes: { abandon: [false, false, false], improve: [false, false, false], milestone: [false, false, false] } },
      { icon: null, type: "", abilities: [], downsides: [], quests: [], checkboxes: { abandon: [false, false, false], improve: [false, false, false], milestone: [false, false, false] } },
      { icon: null, type: "", abilities: [], downsides: [], quests: [], checkboxes: { abandon: [false, false, false], improve: [false, false, false], milestone: [false, false, false] } },
    ],
    history: "",
    notes: "",
    portraitUrl: "",
  };
}

export type CreateCharacterInput = Omit<Character, "id">;
export type UpdateCharacterInput = Partial<Omit<Character, "id">>;
