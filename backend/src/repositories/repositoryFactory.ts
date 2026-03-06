import { MongoClient, Db } from "mongodb";
import { CharacterRepository } from "./characterRepository";
import { CampaignRepository } from "./campaignRepository";
import { SessionRepository } from "./sessionRepository";
import { InMemoryCharacterRepository } from "./inMemoryCharacterRepository";
import { InMemoryCampaignRepository } from "./inMemoryCampaignRepository";
import { InMemorySessionRepository } from "./inMemorySessionRepository";
import { MongoCharacterRepository } from "./mongoCharacterRepository";
import { MongoCampaignRepository } from "./mongoCampaignRepository";
import { MongoSessionRepository } from "./mongoSessionRepository";

let characterRepo: CharacterRepository | null = null;
let campaignRepo: CampaignRepository | null = null;
let sessionRepo: SessionRepository | null = null;
let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;

async function getMongoDb(): Promise<Db> {
  if (!mongoDb) {
    const connectionString = process.env.MONGODB_CONNECTION_STRING!;
    const dbName = process.env.MONGODB_DATABASE || "rpg-db";
    mongoClient = new MongoClient(connectionString, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 30000,
    });
    await mongoClient.connect();
    mongoDb = mongoClient.db(dbName);
    console.log(`Connected to MongoDB: ${dbName}`);
  }
  return mongoDb;
}

export async function initRepositories(forceInMemory = false): Promise<void> {
  if (forceInMemory) {
    characterRepo = new InMemoryCharacterRepository();
    campaignRepo = new InMemoryCampaignRepository();
    sessionRepo = new InMemorySessionRepository();
    return;
  }
  if (process.env.USE_MONGODB === "true") {
    const db = await getMongoDb();
    characterRepo = new MongoCharacterRepository(db);
    campaignRepo = new MongoCampaignRepository(db);
    sessionRepo = new MongoSessionRepository(db);
  } else {
    characterRepo = new InMemoryCharacterRepository();
    campaignRepo = new InMemoryCampaignRepository();
    sessionRepo = new InMemorySessionRepository();
  }
}

export function getCharacterRepository(): CharacterRepository {
  if (!characterRepo) {
    throw new Error("Repositories not initialized. Call initRepositories() first.");
  }
  return characterRepo;
}

export function getCampaignRepository(): CampaignRepository {
  if (!campaignRepo) {
    throw new Error("Repositories not initialized. Call initRepositories() first.");
  }
  return campaignRepo;
}

export function getSessionRepository(): SessionRepository {
  if (!sessionRepo) {
    throw new Error("Repositories not initialized. Call initRepositories() first.");
  }
  return sessionRepo;
}
