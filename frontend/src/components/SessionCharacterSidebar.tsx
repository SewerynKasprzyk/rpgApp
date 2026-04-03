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
  const sortedCharacters = [...allCharacters].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );

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
          sortedCharacters.map((char) => {
            const inSession = sessionCharacterIds.includes(char.id);
            const backpackTags = [...(char.backpackTags ?? [])]
              .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
              .map((tag, idx) => ({
                id: `bp-${char.id}-${idx}`,
                label: tag,
              }));
            return (
              <DraggableSourceItem
                key={char.id}
                id={`char-${char.id}`}
                sourceType="character"
                sourceId={char.id}
                label={char.name}
                payload={{
                  name: char.name,
                  portraitUrl: char.portraitUrl,
                  statuses: char.sceneStatuses ?? [],
                  currentStatuses: char.currentStatuses ?? [],
                  backpackTags,
                }}
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
