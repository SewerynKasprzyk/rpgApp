import { createContext, useContext } from "react";
import { Session, UpdateSessionInput } from "@rpg/shared";

interface SessionContextValue {
  session: Session | null;
  onChange: (updates: UpdateSessionInput) => void;
  /** Called by SessionDetail to register the active session */
  register: (session: Session | null, onChange: (updates: UpdateSessionInput) => void) => void;
}

export const SessionContext = createContext<SessionContextValue>({
  session: null,
  onChange: () => {},
  register: () => {},
});

export function useSessionContext() {
  return useContext(SessionContext);
}
