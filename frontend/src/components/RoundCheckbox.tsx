interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export default function RoundCheckbox({ checked, onChange }: Props) {
  return (
    <button
      type="button"
      className={`round-checkbox ${checked ? "round-checkbox--checked" : ""}`}
      onClick={() => onChange(!checked)}
      aria-checked={checked}
      role="checkbox"
    />
  );
}
