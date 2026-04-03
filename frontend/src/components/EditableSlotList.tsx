import { useState, useRef, useEffect, KeyboardEvent } from "react";

interface Props {
  items?: string[] | null;
  onChange: (items: string[]) => void;
  placeholder: string;
  editMode?: boolean;
}

export default function EditableSlotList({ items, onChange, placeholder, editMode = true }: Props) {
  // Fallback: ensure items is always an array
  const safeItems = items ?? [];
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
    if (index < safeItems.length) {
      // Editing existing item
      if (trimmed) {
        const updated = [...safeItems];
        updated[index] = trimmed;
        onChange(updated);
      } else {
        // Empty = delete
        onChange(safeItems.filter((_, i) => i !== index));
      }
    } else if (trimmed) {
      // Adding new item
      onChange([...safeItems, trimmed]);
    }
    setEditingIndex(null);
    setEditValue("");
  };

  const handleKeyDown = (e: KeyboardEvent, index: number) => {
    if (e.key === "Enter") {
      commitEdit(index);
    } else if (e.key === "Escape") {
      setEditingIndex(null);
      setEditValue("");
    }
  };

  const startEdit = (index: number, value: string) => {
    setEditingIndex(index);
    setEditValue(value);
  };

  return (
    <div className="editable-slot-list">
      {safeItems.map((item, i) => (
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
              onClick={editMode ? () => startEdit(i, item) : undefined}
              style={editMode ? undefined : { cursor: "default" }}
            >
              {item}
            </span>
          )}
          {editMode && (
            <button
              type="button"
              className="editable-slot__delete"
              onClick={() => onChange(safeItems.filter((_, idx) => idx !== i))}
              title="Remove"
            >
              ×
            </button>
          )}
        </div>
      ))}
      {/* Add new slot */}
      {editMode && (
      <div className="editable-slot editable-slot--add">
        {editingIndex === safeItems.length ? (
          <input
            ref={inputRef}
            className="editable-slot__input"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => commitEdit(safeItems.length)}
            onKeyDown={(e) => handleKeyDown(e, safeItems.length)}
            placeholder={placeholder}
          />
        ) : (
          <span
            className="editable-slot__placeholder"
            onClick={() => startEdit(safeItems.length, "")}
          >
            + {placeholder}
          </span>
        )}
      </div>
      )}
    </div>
  );
}
