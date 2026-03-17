import { useState, useCallback } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ApiKeyInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  status: 'set' | 'not_set';
  placeholder?: string;
  helpText?: string;
  className?: string;
}

/**
 * Masked input for API keys with show/hide toggle and status badge.
 *
 * - Status badge: green "Set" when key is present, neutral "Not Set" otherwise.
 * - Eye icon toggles between password masking and visible text.
 * - Never logs or exposes key values — status uses "Set"/"Not Set" only.
 */
export function ApiKeyInput({
  label,
  value,
  onChange,
  status,
  placeholder = 'Enter API key…',
  helpText,
  className,
}: ApiKeyInputProps) {
  const [visible, setVisible] = useState(false);

  const toggleVisibility = useCallback(() => {
    setVisible((prev) => !prev);
  }, []);

  const inputId = `api-key-${label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-$/, '')}`;
  const isSet = status === 'set';

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-center justify-between">
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-sidebar-foreground/70"
        >
          {label}
        </label>
        <span
          className={cn(
            'inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium',
            isSet
              ? 'bg-emerald-500/15 text-emerald-400'
              : 'bg-sidebar-accent text-sidebar-foreground/50',
          )}
        >
          {isSet ? 'Set' : 'Not Set'}
        </span>
      </div>

      <div className="relative">
        <input
          id={inputId}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          className={cn(
            'h-8 w-full rounded-md border border-sidebar-border bg-sidebar pr-8 pl-2 text-sm',
            'text-sidebar-foreground placeholder:text-sidebar-foreground/40',
            'focus:outline-none focus:ring-1 focus:ring-primary',
          )}
        />
        <button
          type="button"
          onClick={toggleVisibility}
          aria-label={visible ? 'Hide API key' : 'Show API key'}
          className={cn(
            'absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5',
            'text-sidebar-foreground/40 hover:text-sidebar-foreground/70',
            'focus:outline-none focus:ring-1 focus:ring-primary',
          )}
        >
          {visible ? (
            <EyeOff className="size-3.5" />
          ) : (
            <Eye className="size-3.5" />
          )}
        </button>
      </div>

      {helpText && (
        <p className="text-[10px] text-sidebar-foreground/40">{helpText}</p>
      )}
    </div>
  );
}
