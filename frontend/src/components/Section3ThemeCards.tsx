import { useState, useCallback } from "react";
import { ThemeCard as ThemeCardType, ThemeIcon, QuestCheckboxes, UpdateCharacterInput } from "@rpg/shared";
import AbilitySlotList from "./AbilitySlotList";
import QuestSlotList from "./QuestSlotList";
import CheckboxGroup from "./CheckboxGroup";

const ICON_OPTIONS: { value: ThemeIcon; label: string }[] = [
  { value: null, label: "—" },
  { value: "leaf", label: "🍃" },
  { value: "sword", label: "⚔️" },
  { value: "crown", label: "👑" },
];

interface ThemeCardProps {
  card: ThemeCardType;
  index: number;
  onChange: (card: ThemeCardType) => void;
  editMode: boolean;
}

const EMPTY_CARD: ThemeCardType = {
  icon: null,
  type: "",
  abilities: [],
  downsides: [],
  quests: [],
  checkboxes: { abandon: [false, false, false], improve: [false, false, false], milestone: [false, false, false] },
};

function ThemeCardComponent({ card, index, onChange, editMode }: ThemeCardProps) {
  const [clearConfirm, setClearConfirm] = useState(false);

  const handleClear = useCallback(() => {
    onChange(EMPTY_CARD);
    setClearConfirm(false);
  }, [onChange]);

  const updateCheckboxes = (
    group: keyof QuestCheckboxes,
    values: [boolean, boolean, boolean]
  ) => {
    onChange({
      ...card,
      checkboxes: { ...card.checkboxes, [group]: values },
    });
  };

  return (
    <div className="theme-card">
      <div className="theme-card__header">
        {editMode ? (
          <div className="theme-card__icon-selector">
            {ICON_OPTIONS.map((opt) => (
              <button
                key={String(opt.value)}
                type="button"
                className={`theme-card__icon-btn ${
                  card.icon === opt.value ? "theme-card__icon-btn--active" : ""
                }`}
                onClick={() => onChange({ ...card, icon: opt.value })}
              >
                {opt.label}
              </button>
            ))}
          </div>
        ) : card.icon ? (
          <span className="theme-card__icon-display">
            {ICON_OPTIONS.find((o) => o.value === card.icon)?.label}
          </span>
        ) : null}
        <input
          className="theme-card__type"
          value={card.type}
          placeholder={`Theme ${index + 1}`}
          onChange={(e) => onChange({ ...card, type: e.target.value })}
        />
      </div>

      <div className="theme-card__section">
        <span className="theme-card__label">Abilities</span>
        <AbilitySlotList
          items={card.abilities}
          onChange={(items) => onChange({ ...card, abilities: items })}
          placeholder="Add Ability"
          editMode={editMode}
        />
      </div>

      <div className="theme-card__section">
        <span className="theme-card__label theme-card__label--red">Downsides ↓</span>
        <AbilitySlotList
          items={card.downsides}
          onChange={(items) => onChange({ ...card, downsides: items })}
          placeholder="Add Downside"
          editMode={editMode}
        />
      </div>

      <div className="theme-card__section">
        <span className="theme-card__label">Quests</span>
        <QuestSlotList
          quests={card.quests}
          onChange={(quests) => onChange({ ...card, quests: quests })}
          placeholder="Add Quest"
          editMode={editMode}
        />
      </div>

      <div className="theme-card__checkboxes">
        <CheckboxGroup
          label="Abandon"
          values={card.checkboxes.abandon}
          onChange={(v) => updateCheckboxes("abandon", v)}
        />
        <CheckboxGroup
          label="Improve"
          values={card.checkboxes.improve}
          onChange={(v) => updateCheckboxes("improve", v)}
        />
        <CheckboxGroup
          label="Milestone"
          values={card.checkboxes.milestone}
          onChange={(v) => updateCheckboxes("milestone", v)}
        />
      </div>

      {editMode && !clearConfirm && (
        <button
          type="button"
          className="theme-card__clear-btn"
          onClick={() => setClearConfirm(true)}
        >
          🗑 Clear Card
        </button>
      )}
      {editMode && clearConfirm && (
        <div className="theme-card__clear-confirm">
          <span>Clear all data in this card?</span>
          <div className="theme-card__clear-actions">
            <button type="button" className="btn-danger" onClick={handleClear}>Yes, Clear</button>
            <button type="button" onClick={() => setClearConfirm(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

interface Props {
  character: { themeCards: [ThemeCardType, ThemeCardType, ThemeCardType, ThemeCardType] };
  onChange: (updates: UpdateCharacterInput) => void;
}

export default function Section3ThemeCards({ character, onChange }: Props) {
  const [editMode, setEditMode] = useState(false);

  const updateCard = (index: number, card: ThemeCardType) => {
    const updated = [...character.themeCards] as [ThemeCardType, ThemeCardType, ThemeCardType, ThemeCardType];
    updated[index] = card;
    onChange({ themeCards: updated });
  };

  return (
    <div className="section section3">
      <div className="section3__header">
        <h3 className="section__title">Theme Cards</h3>
        <button
          type="button"
          className={`edit-mode-btn${editMode ? " edit-mode-btn--active" : ""}`}
          onClick={() => setEditMode(!editMode)}
        >
          {editMode ? "✓ Done" : "✎ Edit"}
        </button>
      </div>
      <div className="theme-cards-row">
        {character.themeCards.map((card, i) => (
          <ThemeCardComponent
            key={i}
            card={card}
            index={i}
            onChange={(c) => updateCard(i, c)}
            editMode={editMode}
          />
        ))}
      </div>
    </div>
  );
}
