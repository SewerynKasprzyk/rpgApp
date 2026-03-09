import { useState, useRef, useEffect, KeyboardEvent } from "react";

interface Props {
  items: string[];
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
    if (index < items.length) {
      // Editing existing item
      if (trimmed) {
        const updated = [...items];
        updated[index] = trimmed;
        onChange(updated);
      } else {
        // Empty = delete
        onChange(items.filter((_, i) => i !== index));
      }
    } else if (trimmed) {
      // Adding new item
      onChange([...items, trimmed]);
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
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
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
            onClick={() => startEdit(items.length, "")}
          >
            + {placeholder}
          </span>
        )}
      </div>
      )}
    </div>
  );
}
