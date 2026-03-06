import { Character, createDefaultCharacter } from "../models/Character";
import { Campaign } from "../models/Campaign";
import { Session } from "../models/Session";

interface MockDB {
  characters: Map<string, Character>;
  campaigns: Map<string, Campaign>;
  sessions: Map<string, Session>;
}

const db: MockDB = {
  characters: new Map(),
  campaigns: new Map(),
  sessions: new Map(),
};

const defaults = createDefaultCharacter();

const seedCharacter: Character = {
  ...defaults,
  id: "char-1",
  name: "Thorin Ironforge",
  class: "Fighter",
  level: 5,
  hp: 45,
  maxHp: 52,
  inventory: [
    { id: "item-1", name: "Longsword", description: "A sturdy steel sword", quantity: 1 },
    { id: "item-2", name: "Health Potion", description: "Restores 2d4+2 HP", quantity: 3 },
  ],
  campaignId: "camp-1",
  ownerId: "user-1",
} as Character;

const seedCharacter2: Character = {
  ...defaults,
  id: "char-2",
  name: "Elara Nightwhisper",
  class: "Wizard",
  level: 4,
  hp: 22,
  maxHp: 28,
  inventory: [
    { id: "item-3", name: "Spellbook", description: "Contains arcane knowledge", quantity: 1 },
    { id: "item-4", name: "Mana Crystal", description: "Restores a spell slot", quantity: 2 },
  ],
  campaignId: "camp-1",
  ownerId: "user-2",
} as Character;

const seedCampaign: Campaign = {
  id: "camp-1",
  name: "The Lost Mines of Phandelver",
  description: "A classic adventure in the Sword Coast",
  playerIds: ["user-1", "user-2"],
};

db.characters.set(seedCharacter.id, seedCharacter);
db.characters.set(seedCharacter2.id, seedCharacter2);
db.campaigns.set(seedCampaign.id, seedCampaign);

export default db;
