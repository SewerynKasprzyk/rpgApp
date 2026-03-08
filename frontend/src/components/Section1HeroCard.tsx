import { useState } from "react";
import { Character, QuestCheckboxes, UpdateCharacterInput } from "@rpg/shared";
import { v4 as uuid } from "uuid";
import EditableSlotList from "./EditableSlotList";
import QuestSlotList from "./QuestSlotList";
import RoundCheckbox from "./RoundCheckbox";
import CheckboxGroup from "./CheckboxGroup";

interface Props {
  character: Character;
  onChange: (updates: UpdateCharacterInput) => void;
}

export default function Section1HeroCard({ character, onChange }: Props) {
  const [editMode, setEditMode] = useState(false);

  const toggleFellowshipMark = (id: string) => {
    const updated = character.fellowshipThemes.map((f) =>
      f.id === id ? { ...f, isMarked: !f.isMarked } : f
    );
    onChange({ fellowshipThemes: updated });
  };

  const updatePromise = (index: number, val: boolean) => {
    const updated: [boolean, boolean, boolean, boolean, boolean] = [...character.promises];
    updated[index] = val;
    onChange({ promises: updated });
  };

  const updateQuestCheckboxes = (
    group: keyof QuestCheckboxes,
    values: [boolean, boolean, boolean]
  ) => {
    onChange({
      sectionQuestCheckboxes: {
        ...( character.sectionQuestCheckboxes ?? {} ),
        [group]: values,
      },
    });
  };

  return (
    <div className="section section1">
      <div className="section1__header">
        <button
          type="button"
          className={`edit-mode-btn${editMode ? " edit-mode-btn--active" : ""}`}
          onClick={() => setEditMode(!editMode)}
        >
          {editMode ? "✓ Done" : "✎ Edit"}
        </button>
      </div>
      <div className="section1__body">
        <div className="section1__left">
          {/* Character Name */}
          <div className="sheet-box sheet-box--bordered">
            <label className="sheet-box__label">Character Name</label>
            <input
              className="sheet-box__input"
              value={character.name}
              onChange={(e) => onChange({ name: e.target.value })}
            />
          </div>

          {/* Hero Card */}
          <div className="sheet-box hero-card">
            <label className="sheet-box__label">Hero Card</label>

            <div className="hero-card__field">
              <span className="hero-card__sublabel">Player Name</span>
              <input
                className="sheet-box__input"
                value={character.playerName}
                onChange={(e) => onChange({ playerName: e.target.value })}
              />
            </div>

            <div className="hero-card__field">
              <span className="hero-card__sublabel">Backpack Tags 🎒</span>
              <EditableSlotList
                items={character.backpackTags}
                onChange={(items) => onChange({ backpackTags: items })}
                placeholder="Add Backpack Tag"
                editMode={editMode}
              />
            </div>

            {/* Fellowship Relationship */}
            <div className="hero-card__field">
              <span className="hero-card__sublabel">Fellowship Relationship</span>
              <div className="fellowship-rel">
                <div className="fellowship-rel__col">
                  <span className="fellowship-rel__header">Companion</span>
                  <EditableSlotList
                    items={character.companions}
                    onChange={(items) => onChange({ companions: items })}
                    placeholder="Add Companion"
                    editMode={editMode}
                  />
                </div>
                <div className="fellowship-rel__divider" />
                <div className="fellowship-rel__col">
                  <span className="fellowship-rel__header">Relationship Tag</span>
                  <EditableSlotList
                    items={character.relationshipTags}
                    onChange={(items) => onChange({ relationshipTags: items })}
                    placeholder="Add Relationship Tag"
                    editMode={editMode}
                  />
                </div>
              </div>
            </div>

            {/* Promise */}
            <div className="hero-card__field">
              <span className="hero-card__sublabel">Promise</span>
              <div className="promise-row">
                {character.promises.map((v, i) => (
                  <RoundCheckbox
                    key={i}
                    checked={v}
                    onChange={(val) => updatePromise(i, val)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Quintessences */}
          <div className="sheet-box sheet-box--bordered">
            <label className="sheet-box__label">Quintessences ✨</label>
            <EditableSlotList
              items={character.quintessences}
              onChange={(items) => onChange({ quintessences: items })}
              placeholder="Add Quintessence"
              editMode={editMode}
            />
          </div>
        </div>

        <div className="section1__right">
          {/* Fellowship Theme Card + Quest */}
          <div className="sheet-box sheet-box--bordered">
            <label className="sheet-box__label">Fellowship Theme Card</label>
            {character.fellowshipThemes.map((f) => (
              <div key={f.id} className="fellowship-theme-item">
                <span className="fellowship-theme-item__text">{f.text}</span>
                <button
                  type="button"
                  className={`fellowship-theme-item__icon ${
                    f.isMarked ? "fellowship-theme-item__icon--red" : ""
                  }`}
                  onClick={() => toggleFellowshipMark(f.id)}
                >
                  ⚔️
                </button>
              </div>
            ))}
            {editMode && (
              <div className="editable-slot editable-slot--add">
                <span
                  className="editable-slot__placeholder"
                  onClick={() =>
                    onChange({
                      fellowshipThemes: [
                        ...character.fellowshipThemes,
                        { id: uuid(), text: "New Fellowship", isMarked: false },
                      ],
                    })
                  }
                >
                  + Add Fellowship
                </span>
              </div>
            )}

            <div className="fellowship-quest-divider" />

            <label className="sheet-box__label">Quest</label>
            <QuestSlotList
              quests={character.sectionQuests}
              onChange={(quests) => onChange({ sectionQuests: quests })}
              placeholder="Add Quest"
              editMode={editMode}
            />
            <div className="quest-checkboxes">
              <CheckboxGroup
                label="Abandon"
                values={character.sectionQuestCheckboxes?.abandon ?? [false, false, false]}
                onChange={(v) => updateQuestCheckboxes("abandon", v)}
              />
              <CheckboxGroup
                label="Improve"
                values={character.sectionQuestCheckboxes?.improve ?? [false, false, false]}
                onChange={(v) => updateQuestCheckboxes("improve", v)}
              />
              <CheckboxGroup
                label="Milestone"
                values={character.sectionQuestCheckboxes?.milestone ?? [false, false, false]}
                onChange={(v) => updateQuestCheckboxes("milestone", v)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
