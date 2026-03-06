import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { QuestEntry } from "@rpg/shared";
import { v4 as uuid } from "uuid";

interface Props {
  quests: QuestEntry[];
  onChange: (quests: QuestEntry[]) => void;
  placeholder: string;
  editMode?: boolean;
}

export default function QuestSlotList({ quests, onChange, placeholder, editMode = true }: Props) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingIndex !== null && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingIndex]);

  const commitEdit = (index: number) => {
    const trimmed = editValue.trim();
    if (index < quests.length) {
      if (trimmed) {
        const updated = [...quests];
        updated[index] = { ...updated[index], text: trimmed };
        onChange(updated);
      } else {
        onChange(quests.filter((_, i) => i !== index));
      }
    } else if (trimmed) {
      onChange([...quests, { id: uuid(), text: trimmed, crossedOut: false }]);
    }
    setEditingIndex(null);
    setEditValue("");
  };

  const handleKeyDown = (e: KeyboardEvent, index: number) => {
    if (e.key === "Enter") commitEdit(index);
    else if (e.key === "Escape") { setEditingIndex(null); setEditValue(""); }
  };

  const toggleCrossout = (index: number) => {
    const updated = [...quests];
    updated[index] = { ...updated[index], crossedOut: !updated[index].crossedOut };
    onChange(updated);
  };

  return (
    <div className="editable-slot-list">
      {quests.map((q, i) => (
        <div key={q.id} className="editable-slot">
          {editingIndex === i ? (
            <input
              ref={inputRef}
              className="editable-slot__input"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => commitEdit(i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
            />
          ) : (
            <span
              className={`editable-slot__text ${q.crossedOut ? "editable-slot__text--crossed" : ""}`}
              onClick={() => toggleCrossout(i)}
              onDoubleClick={editMode ? () => { setEditingIndex(i); setEditValue(q.text); } : undefined}
            >
              {q.text}
            </span>
          )}
          {editMode && (
            <button
              type="button"
              className="editable-slot__delete"
              onClick={() => onChange(quests.filter((_, idx) => idx !== i))}
              title="Remove"
            >
              ×
            </button>
          )}
        </div>
      ))}
      {editMode && (
      <div className="editable-slot editable-slot--add">
        {editingIndex === quests.length ? (
          <input
            ref={inputRef}
            className="editable-slot__input"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => commitEdit(quests.length)}
            onKeyDown={(e) => handleKeyDown(e, quests.length)}
            placeholder={placeholder}
          />
        ) : (
          <span
            className="editable-slot__placeholder"
            onClick={() => { setEditingIndex(quests.length); setEditValue(""); }}
          >
            + {placeholder}
          </span>
        )}
      </div>
      )}
    </div>
  );
}
