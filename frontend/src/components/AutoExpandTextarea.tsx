import { useRef, useEffect, TextareaHTMLAttributes } from "react";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  value: string;
  onValueChange: (value: string) => void;
};

export default function AutoExpandTextarea({ value, onValueChange, ...rest }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = ref.current.scrollHeight + "px";
    }
  }, [value]);

  return (
    <textarea
      ref={ref}
      className="auto-textarea"
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      rows={2}
      {...rest}
    />
  );
}
