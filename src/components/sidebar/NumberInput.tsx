import { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

interface NumberInputProps {
  label: string;
  /** Current value — `undefined` means "no value" (optional field) */
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  className?: string;
  /** If true, empty input commits as 0 instead of undefined */
  required?: boolean;
}

/**
 * Labeled number input for sidebar controls.
 *
 * Uses internal string state to avoid cursor-jumping issues that happen when
 * a controlled numeric input immediately parses and re-renders partial input
 * (e.g. typing "1." would snap to "1").
 *
 * Commits the parsed value to the store on blur or Enter.
 */
export function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
  placeholder,
  className,
  required = false,
}: NumberInputProps) {
  const [draft, setDraft] = useState(() =>
    value !== undefined ? String(value) : "",
  );

  // Sync draft when external value changes (e.g. preset switch)
  useEffect(() => {
    setDraft(value !== undefined ? String(value) : "");
  }, [value]);

  const commit = useCallback(() => {
    const trimmed = draft.trim();
    if (trimmed === "") {
      onChange(required ? 0 : undefined);
      return;
    }
    const parsed = parseFloat(trimmed);
    if (Number.isNaN(parsed)) {
      // Revert draft to current value
      setDraft(value !== undefined ? String(value) : "");
      return;
    }
    // Clamp to min/max if provided
    let clamped = parsed;
    if (min !== undefined) clamped = Math.max(clamped, min);
    if (max !== undefined) clamped = Math.min(clamped, max);
    onChange(clamped);
    setDraft(String(clamped));
  }, [draft, onChange, value, min, max, required]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commit();
      }
    },
    [commit],
  );

  const inputId = `number-input-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label
        htmlFor={inputId}
        className="text-xs font-medium text-sidebar-foreground/70"
      >
        {label}
      </label>
      <input
        id={inputId}
        type="number"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        className={cn(
          "h-8 w-full rounded-md border border-sidebar-border bg-sidebar px-2 text-sm",
          "text-sidebar-foreground placeholder:text-sidebar-foreground/40",
          "focus:outline-none focus:ring-1 focus:ring-primary",
          "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
        )}
      />
    </div>
  );
}
