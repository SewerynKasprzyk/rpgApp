import { useState } from "react";
import { Character } from "@rpg/shared";
import DraggableSourceItem from "./DraggableSourceItem";

interface Props {
  allCharacters: Character[];
  sessionCharacterIds: string[];
}

export default function SessionCharacterSidebar({
  allCharacters,
  sessionCharacterIds,
}: Props) {
  const [expanded, setExpanded] = useState(true);

  return (
    <aside
      className={`session-sidebar ${expanded ? "session-sidebar--open" : ""}`}
      onClick={!expanded ? () => setExpanded(true) : undefined}
    >
      {!expanded && (
        <span className="session-sidebar__vertical-label">CHARS (SCENE)</span>
      )}
      {expanded && (
        <>
          <div className="session-sidebar__header-label">🎭 For Scene Board</div>
          <button
            className="session-sidebar__close"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(false);
            }}
          >
            ✕
          </button>
        </>
      )}
      <div className="session-sidebar__list">
        {expanded &&
          allCharacters.map((char) => {
            const inSession = sessionCharacterIds.includes(char.id);
            return (
              <DraggableSourceItem
                key={char.id}
                id={`char-${char.id}`}
                sourceType="character"
                sourceId={char.id}
                label={char.name}
                payload={char as unknown as Record<string, unknown>}
              >
                <div
                  className={`session-sidebar__char ${
                    inSession ? "session-sidebar__char--active" : ""
                  }`}
                >
                  {char.portraitUrl ? (
                    <img
                      className="session-sidebar__portrait"
                      src={char.portraitUrl}
                      alt={char.name}
                    />
                  ) : (
                    <div className="session-sidebar__portrait-placeholder">?</div>
                  )}
                  <span className="session-sidebar__name">{char.name}</span>
                </div>
              </DraggableSourceItem>
            );
          })}
      </div>
    </aside>
  );
}
