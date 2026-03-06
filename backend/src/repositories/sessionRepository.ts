import { Session, CreateSessionInput, UpdateSessionInput } from "../models/Session";

export interface SessionRepository {
  getAll(): Promise<Session[]>;
  getById(id: string): Promise<Session | null>;
  create(input: CreateSessionInput): Promise<Session>;
  update(id: string, input: UpdateSessionInput): Promise<Session | null>;
  delete(id: string): Promise<boolean>;
}
