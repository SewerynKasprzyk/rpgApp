import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Ability } from "@rpg/shared";

interface Props {
  items: (Ability | string)[];
  onChange: (items: Ability[]) => void;
  placeholder: string;
  editMode?: boolean;
}

export default function AbilitySlotList({ items: rawItems, onChange, placeholder, editMode = true }: Props) {
  // Normalize: support legacy string abilities
  const items: Ability[] = rawItems.map((item) =>
    typeof item === "string" ? { text: item, isMarked: false } : item
  );

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
    if (index < items.length) {
      if (trimmed) {
        const updated = [...items];
        updated[index] = { ...updated[index], text: trimmed };
        onChange(updated);
      } else {
        onChange(items.filter((_, i) => i !== index));
      }
    } else if (trimmed) {
      onChange([...items, { text: trimmed, isMarked: false }]);
    }
    setEditingIndex(null);
    setEditValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Enter") commitEdit(index);
    else if (e.key === "Escape") {
      setEditingIndex(null);
      setEditValue("");
    }
  };

  const toggleMark = (index: number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], isMarked: !updated[index].isMarked };
    onChange(updated);
  };

  return (
    <div className="editable-slot-list">
      {items.map((item, i) => (
        <div key={i} className="editable-slot">
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
              className="editable-slot__text"
              onClick={editMode ? () => { setEditingIndex(i); setEditValue(item.text); } : undefined}
              style={editMode ? undefined : { cursor: "default" }}
            >
              {item.text}
            </span>
          )}
          <button
            type="button"
            className={`fellowship-theme-item__icon ${item.isMarked ? "fellowship-theme-item__icon--red" : ""}`}
            onClick={() => toggleMark(i)}
          >
            ⚔️
          </button>
          {editMode && (
            <button
              type="button"
              className="editable-slot__delete"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              title="Remove"
            >
              ×
            </button>
          )}
        </div>
      ))}
      {editMode && (
        <div className="editable-slot editable-slot--add">
          {editingIndex === items.length ? (
            <input
              ref={inputRef}
              className="editable-slot__input"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => commitEdit(items.length)}
              onKeyDown={(e) => handleKeyDown(e, items.length)}
              placeholder={placeholder}
            />
          ) : (
            <span
              className="editable-slot__placeholder"
              onClick={() => { setEditingIndex(items.length); setEditValue(""); }}
            >
              + {placeholder}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
