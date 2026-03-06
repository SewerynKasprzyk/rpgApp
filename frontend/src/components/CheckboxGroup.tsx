import RoundCheckbox from "./RoundCheckbox";

interface Props {
  label: string;
  values: [boolean, boolean, boolean];
  onChange: (values: [boolean, boolean, boolean]) => void;
}

export default function CheckboxGroup({ label, values, onChange }: Props) {
  const toggle = (index: number) => {
    const updated: [boolean, boolean, boolean] = [...values];
    if (!values[index]) {
      for (let i = 0; i <= index; i++) updated[i] = true;
    } else {
      for (let i = index; i < values.length; i++) updated[i] = false;
    }
    onChange(updated);
  };

  return (
    <div className="checkbox-group">
      <span className="checkbox-group__label">{label}</span>
      <div className="checkbox-group__row">
        {values.map((v, i) => (
          <RoundCheckbox key={i} checked={v} onChange={() => toggle(i)} />
        ))}
      </div>
    </div>
  );
}
