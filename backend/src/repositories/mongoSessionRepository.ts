import { Db, Collection } from "mongodb";
import { Session, CreateSessionInput, UpdateSessionInput } from "../models/Session";
import { SessionRepository } from "./sessionRepository";
import { v4 as uuidv4 } from "uuid";

export class MongoSessionRepository implements SessionRepository {
  private collection: Collection<Session>;

  constructor(db: Db) {
    this.collection = db.collection<Session>("sessions");
  }

  async getAll(): Promise<Session[]> {
    return this.collection.find({}).toArray();
  }

  async getById(id: string): Promise<Session | null> {
    return this.collection.findOne({ id });
  }

  async create(input: CreateSessionInput): Promise<Session> {
    const session: Session = { ...input, id: uuidv4(), createdAt: Date.now() };
    await this.collection.insertOne(session);
    return session;
  }

  async update(id: string, input: UpdateSessionInput): Promise<Session | null> {
    const existing = await this.getById(id);
    if (!existing) return null;
    const updated: Session = { ...existing, ...input };
    await this.collection.updateOne({ id }, { $set: updated });
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.collection.deleteOne({ id });
    return result.deletedCount > 0;
  }
}
