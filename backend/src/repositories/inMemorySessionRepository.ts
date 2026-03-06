import { Session, CreateSessionInput, UpdateSessionInput } from "../models/Session";
import { SessionRepository } from "./sessionRepository";
import db from "../mocks/mockDatabase";

let nextId = 200;

export class InMemorySessionRepository implements SessionRepository {
  async getAll(): Promise<Session[]> {
    return Array.from(db.sessions.values());
  }

  async getById(id: string): Promise<Session | null> {
    return db.sessions.get(id) ?? null;
  }

  async create(input: CreateSessionInput): Promise<Session> {
    const session: Session = {
      ...input,
      id: `sess-${nextId++}`,
      createdAt: Date.now(),
    };
    db.sessions.set(session.id, session);
    return session;
  }

  async update(id: string, input: UpdateSessionInput): Promise<Session | null> {
    const existing = db.sessions.get(id);
    if (!existing) return null;
    const updated: Session = { ...existing, ...input };
    db.sessions.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return db.sessions.delete(id);
  }
}
