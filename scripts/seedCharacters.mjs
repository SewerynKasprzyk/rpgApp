/**
 * Seed script — inserts 5 dummy characters directly into MongoDB/Cosmos DB.
 * Usage:
 *   $env:MONGODB_CONNECTION_STRING = "mongodb://..."
 *   $env:MONGODB_DATABASE = "rpg-db"          # optional, defaults to rpg-db
 *   node scripts/seedCharacters.mjs
 */

import { MongoClient } from "mongodb";
import { randomUUID } from "crypto";

const CONNECTION_STRING = process.env.MONGODB_CONNECTION_STRING;
const DB_NAME = process.env.MONGODB_DATABASE ?? "rpg-db";

if (!CONNECTION_STRING) {
  console.error("ERROR: set MONGODB_CONNECTION_STRING environment variable first.");
  process.exit(1);
}

function mkCheckboxes(a = false, b = false, c = false) {
  return { abandon: [a, b, c], improve: [false, false, false], milestone: [false, false, false] };
}
function emptyCard() {
  return { icon: null, type: "", abilities: [], downsides: [], quests: [], checkboxes: mkCheckboxes() };
}
function ability(text, isMarked = false) { return { text, isMarked }; }
function downside(text) { return { text, isMarked: false }; }
function quest(text, crossedOut = false) { return { id: randomUUID(), text, crossedOut }; }
function status(tag, note, checked = 0) {
  return { id: randomUUID(), tag, note, checkboxes: Array.from({ length: 6 }, (_, i) => i < checked) };
}

const characters = [
  {
    id: randomUUID(),
    name: "Aldric Stormveil", playerName: "Seweryn", class: "Paladin", level: 5, hp: 38, maxHp: 42,
    campaignId: "", ownerId: "",
    portraitUrl: "https://i.pravatar.cc/150?img=11",
    backpackTags: ["Holy Symbol", "Rations x3", "Rope 50ft", "Healing Potion", "Torch x5"],
    companions: ["Mira the Cleric", "Dusty (war horse)"],
    relationshipTags: ["Sworn to Lady Elara", "Rival: Ser Vance", "Mentor: Brother Aldous"],
    promises: [false, true, false, true, false],
    quintessences: ["Courage", "Duty"],
    fellowshipThemes: [
      { id: randomUUID(), text: "Protector of the weak", isMarked: true },
      { id: randomUUID(), text: "Keeper of oaths", isMarked: false },
    ],
    sectionQuests: [
      quest("Track down the cultists"),
      quest("Deliver message to the king", true),
    ],
    sectionQuestCheckboxes: { abandon: [true, false, false], improve: [false, false, false], milestone: [true, true, false] },
    currentStatuses: [status("Blessed", "Granted by the Oracle", 2)],
    themeCards: [
      {
        icon: "sword", type: "Warrior of Light",
        abilities: [ability("Divine Smite", true), ability("Shield Wall")],
        downsides: [downside("Reckless charge")],
        quests: [quest("Cleanse the temple")],
        checkboxes: mkCheckboxes(),
      },
      { icon: "leaf", type: "Nature's Bond", abilities: [ability("Forest Path")], downsides: [], quests: [], checkboxes: mkCheckboxes() },
      emptyCard(), emptyCard(),
    ],
    history: "A former knight who abandoned his order after witnessing corruption within its ranks. Now wanders seeking redemption.",
    notes: "Dislikes arcane magic. Allergic to silver.",
  },
  {
    id: randomUUID(),
    name: "Sylvara Nightwhisper", playerName: "Kasia", class: "Ranger", level: 4, hp: 29, maxHp: 34,
    campaignId: "", ownerId: "",
    portraitUrl: "https://i.pravatar.cc/150?img=47",
    backpackTags: ["Quiver x20", "Hunting Trap", "Dried Herbs", "Map of the Wilds", "Cloak of Leaves"],
    companions: ["Fenris (wolf companion)"],
    relationshipTags: ["Owes debt to Elder Moss", "Hunted by the Black Arrows guild"],
    promises: [true, false, true, false, false],
    quintessences: ["Patience", "Kinship with beasts"],
    fellowshipThemes: [{ id: randomUUID(), text: "Voice of the forest", isMarked: false }],
    sectionQuests: [quest("Find the poacher camp")],
    sectionQuestCheckboxes: { abandon: [false, false, false], improve: [true, false, false], milestone: [false, false, false] },
    currentStatuses: [status("Poisoned", "Arrow graze", 1), status("Tracking", "Following mud trail", 0)],
    themeCards: [
      {
        icon: "leaf", type: "Beastmaster",
        abilities: [ability("Pack Tactics", true), ability("Eyes of the Hawk", true), ability("Vanish into Shadow")],
        downsides: [downside("Lone wolf — distrustful")],
        quests: [quest("Avenge the burned grove")],
        checkboxes: mkCheckboxes(),
      },
      { icon: "sword", type: "Sharpshooter", abilities: [ability("Called Shot")], downsides: [], quests: [], checkboxes: mkCheckboxes() },
      emptyCard(), emptyCard(),
    ],
    history: "Raised by wood elves after her village was burned. Has tracked the arsonist for 6 years.",
    notes: "Speaks to Fenris in elvish. Hates cities.",
  },
  {
    id: randomUUID(),
    name: "Torgun Ashbeard", playerName: "Marek", class: "Fighter", level: 6, hp: 52, maxHp: 58,
    campaignId: "", ownerId: "",
    portraitUrl: "https://i.pravatar.cc/150?img=15",
    backpackTags: ["Battle Axe (spare)", "Whetstone", "Ale flask", "War Journal", "Iron Rations x5", "Coin purse (12gp)"],
    companions: ["Brenna (sister, bard)", "Grunt (pack mule)"],
    relationshipTags: ["Former mercenary captain", "Blood oath with clan Ironfoot", "Wanted in Westfall city"],
    promises: [true, true, false, false, true],
    quintessences: ["Strength", "Loyalty", "Stubbornness"],
    fellowshipThemes: [
      { id: randomUUID(), text: "First into the breach", isMarked: true },
      { id: randomUUID(), text: "Never leave a man behind", isMarked: true },
    ],
    sectionQuests: [quest("Reclaim the ancestral forge"), quest("Pay off Brenna's debt")],
    sectionQuestCheckboxes: { abandon: [false, false, false], improve: [false, false, false], milestone: [true, false, false] },
    currentStatuses: [status("Exhausted", "Three battles in one day", 3)],
    themeCards: [
      {
        icon: "sword", type: "Ironclad Warrior",
        abilities: [ability("Reckless Attack", true), ability("Indomitable"), ability("Second Wind", true)],
        downsides: [downside("Slow to trust wizards"), { text: "Impulsive in rage", isMarked: true }],
        quests: [quest("Defeat the troll warlord")],
        checkboxes: { abandon: [false, false, false], improve: [true, false, false], milestone: [false, false, false] },
      },
      {
        icon: "crown", type: "Clan Champion",
        abilities: [ability("Rally the troops"), ability("Intimidating presence")],
        downsides: [downside("Pride before reason")],
        quests: [quest("Unite the clans")],
        checkboxes: mkCheckboxes(),
      },
      emptyCard(), emptyCard(),
    ],
    history: "Veteran of the Ironfoot wars. His clan was scattered by a dragon attack. Fights to reunite them.",
    notes: "Snores loudly. Refuses magic healing unless unconscious.",
  },
  {
    id: randomUUID(),
    name: "Zephyrine Voss", playerName: "Ola", class: "Wizard", level: 5, hp: 18, maxHp: 22,
    campaignId: "", ownerId: "",
    portraitUrl: "https://i.pravatar.cc/150?img=36",
    backpackTags: ["Spellbook", "Component pouch", "Ink and quill", "Scroll of Identify", "Silver mirror", "Strange compass"],
    companions: ["Pip (familiar — toad)", "Archmage Corren (correspondence only)"],
    relationshipTags: ["Under surveillance by the Mage Council", "Owes a boon to the Witch of the Crossroads"],
    promises: [false, false, true, true, false],
    quintessences: ["Curiosity", "Knowledge is power"],
    fellowshipThemes: [{ id: randomUUID(), text: "The answer is always in the books", isMarked: false }],
    sectionQuests: [quest("Decipher the Vaelthorn Codex"), quest("Find the sixth school of magic")],
    sectionQuestCheckboxes: mkCheckboxes(),
    currentStatuses: [status("Concentrating", "Arcane Shield active", 1), status("Low on slots", "Used 3rd level", 2)],
    themeCards: [
      {
        icon: "crown", type: "Arcanist",
        abilities: [ability("Counterspell"), ability("Arcane Recovery", true), ability("Twin Spell")],
        downsides: [downside("Physically fragile"), downside("Overconfident in magic")],
        quests: [quest("Retrieve stolen spellbook")],
        checkboxes: mkCheckboxes(),
      },
      { icon: "leaf", type: "Naturalist", abilities: [ability("Speak with plants")], downsides: [], quests: [], checkboxes: mkCheckboxes() },
      emptyCard(), emptyCard(),
    ],
    history: "Prodigy expelled from the Mage Academy for illegal experimentation. Now freelances to fund her research.",
    notes: "Talks to Pip constantly. Keeps detailed notes on everything.",
  },
  {
    id: randomUUID(),
    name: "Drak Ember", playerName: "Piotr", class: "Rogue", level: 4, hp: 24, maxHp: 28,
    campaignId: "", ownerId: "",
    portraitUrl: "https://i.pravatar.cc/150?img=57",
    backpackTags: ["Thieves tools", "Smoke bombs x3", "Disguise kit", "Lockpicking set", "Dark cloak", "Forged documents"],
    companions: ["'Ghost' (informant network contact)"],
    relationshipTags: ["Former member of the Shadow Coin", "Blackmails Lord Dunmore", "Trusted fixer for the Undercity"],
    promises: [false, true, false, false, true],
    quintessences: ["Survival", "Never for free", "Information is coin"],
    fellowshipThemes: [
      { id: randomUUID(), text: "Every man has a price", isMarked: false },
      { id: randomUUID(), text: "The best exit is one you planned before entering", isMarked: true },
    ],
    sectionQuests: [quest("Steal the Duchess's seal"), quest("Expose the corrupt guard captain", true)],
    sectionQuestCheckboxes: { abandon: [false, false, false], improve: [true, true, false], milestone: [false, false, false] },
    currentStatuses: [status("Disguised", "Posing as a merchant", 0), status("Marked", "Shadow Coin knows his face", 4)],
    themeCards: [
      {
        icon: "sword", type: "Shadowblade",
        abilities: [ability("Sneak Attack", true), ability("Uncanny Dodge"), ability("Evasion")],
        downsides: [{ text: "Paranoid — trusts nobody", isMarked: true }, downside("Greedy")],
        quests: [quest("Break into the palace vault")],
        checkboxes: { abandon: [false, false, false], improve: [false, false, false], milestone: [true, false, false] },
      },
      {
        icon: "crown", type: "Crimelord",
        abilities: [ability("Bribe the guards"), ability("Pull strings")],
        downsides: [downside("Too many enemies")],
        quests: [quest("Reclaim Shadow Coin leadership")],
        checkboxes: mkCheckboxes(),
      },
      emptyCard(), emptyCard(),
    ],
    history: "Street orphan turned master thief. Became the youngest Coin operative at 16. Left after a job went wrong and a friend died.",
    notes: "Never sleeps with his back to a door. Counts exits on entering any room.",
  },
];

const client = new MongoClient(CONNECTION_STRING, {
  serverSelectionTimeoutMS: 15000,
  connectTimeoutMS: 15000,
  tls: true,
});

try {
  await client.connect();
  const db = client.db(DB_NAME);
  const col = db.collection("characters");
  const result = await col.insertMany(characters);
  console.log(`✅ Inserted ${result.insertedCount} characters:`);
  characters.forEach((c) => console.log(`   • ${c.name} (${c.class} lv${c.level}) — id: ${c.id}`));
} catch (err) {
  console.error("❌ Failed:", err.message);
} finally {
  await client.close();
}
