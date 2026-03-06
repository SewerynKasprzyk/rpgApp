import { useState } from "react";
import { Character, UpdateCharacterInput, Item } from "@rpg/shared";

interface Props {
  character: Character;
  onSave: (id: string, input: UpdateCharacterInput) => Promise<void>;
}

export default function CharacterEditor({ character, onSave }: Props) {
  const [name, setName] = useState(character.name);
  const [charClass, setCharClass] = useState(character.class);
  const [level, setLevel] = useState(character.level);
  const [hp, setHp] = useState(character.hp);
  const [maxHp, setMaxHp] = useState(character.maxHp);
  const [inventory, setInventory] = useState<Item[]>(character.inventory);
  const [saving, setSaving] = useState(false);

  const [newItemName, setNewItemName] = useState("");
  const [newItemDesc, setNewItemDesc] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(character.id, {
        name,
        class: charClass,
        level,
        hp: Math.min(hp, maxHp),
        maxHp,
        inventory,
      });
    } finally {
      setSaving(false);
    }
  };

  const addItem = () => {
    if (!newItemName.trim()) return;
    const item: Item = {
      id: `item-${Date.now()}`,
      name: newItemName.trim(),
      description: newItemDesc.trim(),
      quantity: 1,
    };
    setInventory((prev) => [...prev, item]);
    setNewItemName("");
    setNewItemDesc("");
  };

  const removeItem = (itemId: string) => {
    setInventory((prev) => prev.filter((i) => i.id !== itemId));
  };

  return (
    <form className="character-editor" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="name">Name</label>
        <input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div className="form-group">
        <label htmlFor="class">Class</label>
        <input id="class" value={charClass} onChange={(e) => setCharClass(e.target.value)} required />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="level">Level</label>
          <input
            id="level"
            type="number"
            min={1}
            max={20}
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
          />
        </div>
        <div className="form-group">
          <label htmlFor="hp">HP</label>
          <input
            id="hp"
            type="number"
            min={0}
            max={maxHp}
            value={hp}
            onChange={(e) => setHp(Number(e.target.value))}
          />
        </div>
        <div className="form-group">
          <label htmlFor="maxHp">Max HP</label>
          <input
            id="maxHp"
            type="number"
            min={1}
            value={maxHp}
            onChange={(e) => setMaxHp(Number(e.target.value))}
          />
        </div>
      </div>

      <fieldset className="inventory-section">
        <legend>Inventory</legend>
        {inventory.length === 0 && <p>No items</p>}
        <ul>
          {inventory.map((item) => (
            <li key={item.id}>
              <strong>{item.name}</strong> — {item.description} (x{item.quantity})
              <button type="button" onClick={() => removeItem(item.id)}>
                ✕
              </button>
            </li>
          ))}
        </ul>
        <div className="form-row">
          <input
            placeholder="Item name"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
          />
          <input
            placeholder="Description"
            value={newItemDesc}
            onChange={(e) => setNewItemDesc(e.target.value)}
          />
          <button type="button" onClick={addItem}>
            Add Item
          </button>
        </div>
      </fieldset>

      <button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save Changes"}
      </button>
    </form>
  );
}
